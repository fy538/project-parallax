#!/usr/bin/env python3
"""
Parallax Brand Image Treatment Pipeline

Implements the 4-step image treatment from BRAND.md:
  1. Desaturate (20-30%)
  2. Duotone remap (shadows → midtones → highlights)
  3. Grain + vignette
  4. Composite metadata (opacity info for downstream use)

Usage:
  python treat.py input.jpg                          # Standard treatment → output/input_treated.png
  python treat.py input.jpg -r conflict              # Conflict (red) ramp
  python treat.py input.jpg -r editorial             # Editorial (light mode) ramp
  python treat.py *.jpg -o processed/                # Batch mode
  python treat.py input.jpg --grain 0.10 --vignette 0.18  # Custom grain/vignette
  python treat.py input.jpg --preview                # Side-by-side comparison

Requires: pip install Pillow numpy --break-system-packages
"""

import argparse
import sys
from pathlib import Path

import numpy as np

# === Brand palette — loaded from palette.json (single source of truth) ===
from palette_loader import get_defaults, get_ramps_rgb
from PIL import Image

RAMPS = get_ramps_rgb()

_defaults = get_defaults()
DEFAULT_SATURATION = _defaults.get("saturation", 0.25)
DEFAULT_GRAIN_INTENSITY = _defaults.get("grain", 0.10)
DEFAULT_VIGNETTE_STRENGTH = _defaults.get("vignette", 0.18)


def step1_desaturate(img: Image.Image, saturation: float = DEFAULT_SATURATION) -> Image.Image:
    """Reduce saturation to given fraction of original."""
    gray = img.convert("L").convert("RGB")
    arr_color = np.array(img, dtype=np.float32)
    arr_gray = np.array(gray, dtype=np.float32)
    blended = arr_gray + saturation * (arr_color - arr_gray)
    return Image.fromarray(np.clip(blended, 0, 255).astype(np.uint8))


def step2_duotone(img: Image.Image, ramp_name: str = "standard") -> Image.Image:
    """Map desaturated image to a three-stop color ramp."""
    ramp = RAMPS[ramp_name]
    shadows = np.array(ramp["shadows"], dtype=np.float32)
    midtones = np.array(ramp["midtones"], dtype=np.float32)
    highlights = np.array(ramp["highlights"], dtype=np.float32)

    # Convert to grayscale for luminance mapping
    gray = np.array(img.convert("L"), dtype=np.float32) / 255.0

    # Three-stop interpolation: 0→shadows, 0.5→midtones, 1.0→highlights
    result = np.zeros((*gray.shape, 3), dtype=np.float32)

    # Lower half: shadows → midtones
    mask_low = gray <= 0.5
    t_low = gray * 2.0  # 0→1 over the 0→0.5 range
    for c in range(3):
        result[..., c] = np.where(
            mask_low,
            shadows[c] + t_low * (midtones[c] - shadows[c]),
            0
        )

    # Upper half: midtones → highlights
    mask_high = gray > 0.5
    t_high = (gray - 0.5) * 2.0  # 0→1 over the 0.5→1.0 range
    for c in range(3):
        result[..., c] = np.where(
            mask_high,
            midtones[c] + t_high * (highlights[c] - midtones[c]),
            result[..., c]
        )

    return Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))


def step3_grain(img: Image.Image, intensity: float = DEFAULT_GRAIN_INTENSITY) -> Image.Image:
    """Add monochromatic film grain."""
    arr = np.array(img, dtype=np.float32)
    noise = np.random.normal(0, 255 * intensity, arr.shape[:2])
    # Monochromatic: same noise value across R, G, B
    noise_rgb = np.stack([noise] * 3, axis=-1)
    result = arr + noise_rgb
    return Image.fromarray(np.clip(result, 0, 255).astype(np.uint8))


def step3_vignette(img: Image.Image, strength: float = DEFAULT_VIGNETTE_STRENGTH) -> Image.Image:
    """Apply radial vignette — edges darken by given percentage."""
    w, h = img.size
    arr = np.array(img, dtype=np.float32)

    # Create radial gradient: 1.0 at center, 0.0 at corners
    Y, X = np.ogrid[:h, :w]
    cx, cy = w / 2, h / 2
    max_dist = np.sqrt(cx**2 + cy**2)
    dist = np.sqrt((X - cx)**2 + (Y - cy)**2) / max_dist

    # Vignette multiplier: 1.0 at center, (1-strength) at edges
    vignette = 1.0 - strength * (dist ** 1.5)  # power curve for softer falloff
    vignette = np.clip(vignette, 0, 1)

    for c in range(3):
        arr[..., c] *= vignette

    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


def treat_image(
    img: Image.Image,
    ramp: str = "standard",
    saturation: float = DEFAULT_SATURATION,
    grain_intensity: float = DEFAULT_GRAIN_INTENSITY,
    vignette_strength: float = DEFAULT_VIGNETTE_STRENGTH,
) -> Image.Image:
    """Run the full 4-step brand treatment pipeline."""
    # Ensure RGB
    if img.mode != "RGB":
        img = img.convert("RGB")

    # Step 1: Desaturate
    img = step1_desaturate(img, saturation)

    # Step 2: Duotone remap
    img = step2_duotone(img, ramp)

    # Step 3: Grain + Vignette
    img = step3_grain(img, grain_intensity)
    img = step3_vignette(img, vignette_strength)

    # Step 4: Composite — we output the treated image at full opacity.
    # The composite opacity (25-40% background, 60-80% inset, etc.) is applied
    # at the Remotion composition level, not here. This tool produces the
    # treated image ready for compositing.
    return img


def create_preview(original: Image.Image, treated: Image.Image) -> Image.Image:
    """Create side-by-side comparison image."""
    w, h = original.size
    preview = Image.new("RGB", (w * 2 + 4, h), (40, 40, 40))
    preview.paste(original.convert("RGB"), (0, 0))
    preview.paste(treated, (w + 4, 0))
    return preview


def main():
    parser = argparse.ArgumentParser(
        description="Parallax brand image treatment pipeline"
    )
    parser.add_argument("inputs", nargs="+", help="Input image file(s)")
    parser.add_argument("-r", "--ramp", default="standard",
                        choices=["standard", "conflict", "editorial"],
                        help="Duotone color ramp (default: standard)")
    parser.add_argument("-o", "--output", default=None,
                        help="Output directory (default: same dir as input)")
    parser.add_argument("--saturation", type=float, default=DEFAULT_SATURATION,
                        help=f"Desaturation level (default: {DEFAULT_SATURATION})")
    parser.add_argument("--grain", type=float, default=DEFAULT_GRAIN_INTENSITY,
                        help=f"Grain intensity (default: {DEFAULT_GRAIN_INTENSITY})")
    parser.add_argument("--vignette", type=float, default=DEFAULT_VIGNETTE_STRENGTH,
                        help=f"Vignette strength (default: {DEFAULT_VIGNETTE_STRENGTH})")
    parser.add_argument("--preview", action="store_true",
                        help="Output side-by-side comparison")
    parser.add_argument("--suffix", default="_treated",
                        help="Suffix for output filename (default: _treated)")

    args = parser.parse_args()

    # Resolve output directory
    out_dir = Path(args.output) if args.output else None
    if out_dir:
        out_dir.mkdir(parents=True, exist_ok=True)

    for input_path in args.inputs:
        path = Path(input_path)
        if not path.exists():
            print(f"⚠ Skipping {path} — file not found", file=sys.stderr)
            continue

        try:
            img = Image.open(path)
        except (OSError, Image.UnidentifiedImageError) as e:
            # OSError covers file-not-found + truncated/unreadable; the
            # PIL-specific UnidentifiedImageError covers "file exists but
            # isn't an image format we recognize." Programming errors
            # (TypeError on bad arg type) bubble — they're our bug.
            print(f"⚠ Skipping {path} — {e}", file=sys.stderr)
            continue

        print(f"Processing {path.name} [{img.size[0]}×{img.size[1]}] ramp={args.ramp}...")

        treated = treat_image(
            img,
            ramp=args.ramp,
            saturation=args.saturation,
            grain_intensity=args.grain,
            vignette_strength=args.vignette,
        )

        # Determine output path
        target_dir = out_dir or path.parent
        if args.preview:
            preview = create_preview(img, treated)
            out_path = target_dir / f"{path.stem}_{args.ramp}_preview.png"
            preview.save(out_path, "PNG")
            print(f"  → {out_path} (preview)")
        else:
            out_path = target_dir / f"{path.stem}{args.suffix}.png"
            treated.save(out_path, "PNG")
            print(f"  → {out_path}")

    print("Done.")


if __name__ == "__main__":
    main()
