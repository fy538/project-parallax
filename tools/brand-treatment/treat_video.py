#!/usr/bin/env python3
"""
Parallax Brand Video Treatment Pipeline

Extends the image treatment pipeline (treat.py) to handle video clips.
Applies the same 4-step brand treatment from BRAND.md to stock footage:
  1. Desaturate (25% of original saturation)
  2. Duotone remap via 3D LUT (shadows → midtones → highlights)
  3. Film grain overlay
  4. Radial vignette

The desaturation + duotone steps are baked into a .cube LUT file that ffmpeg
applies per-frame. Grain and vignette are ffmpeg filter chain effects.

This ensures stock video footage matches the same Meridian palette as:
  - treat.py (static images)
  - BrandImage.tsx (Remotion SVG filter)
  - Remotion template components (native brand colors)

Usage:
  # Treat a video with standard (amber) ramp
  python treat_video.py input.mp4

  # Treat with conflict (rust) ramp
  python treat_video.py input.mp4 -r conflict

  # Batch treat all clips in a directory
  python treat_video.py clips/*.mp4 -o treated/

  # Generate only the LUT file (for use in DaVinci Resolve / Premiere)
  python treat_video.py --lut-only -r standard -o luts/

  # Custom grain/vignette intensity
  python treat_video.py input.mp4 --grain 0.08 --vignette 0.20

  # Preview mode: side-by-side comparison (first 5 seconds)
  python treat_video.py input.mp4 --preview

  # Skip grain/vignette (LUT-only treatment, faster)
  python treat_video.py input.mp4 --lut-only-treatment

Requires:
  pip install numpy --break-system-packages
  ffmpeg must be installed and on PATH

The .cube LUT files can also be imported directly into DaVinci Resolve,
Premiere Pro, or Final Cut Pro for manual color grading workflows (Option C
in the production pipeline).
"""

import argparse
import json
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

# === Brand palette — loaded from palette.json (single source of truth) ===
from palette_loader import get_defaults, get_ramps_hex, get_ramps_rgb

RAMPS = get_ramps_rgb()
RAMPS_HEX = get_ramps_hex()  # Used for LUT file headers

_defaults = get_defaults()
DEFAULT_SATURATION = _defaults.get("saturation", 0.25)
# Grain intensity is on a 0–1 scale; multiplied by 100 to feed ffmpeg's
# `noise` filter (which uses 0–100). Default chosen so that the resulting
# noise strength (~25) matches the historical look from the prior incorrect
# 0.10 × 255 calibration that landed at the same value by coincidence.
DEFAULT_GRAIN_INTENSITY = _defaults.get("grain", 0.25)
DEFAULT_VIGNETTE_STRENGTH = _defaults.get("vignette", 0.18)

LUT_SIZE = 64  # 64³ = 262,144 entries — good balance of accuracy vs file size


# === LUT Generation ===
# The 3D LUT encodes both Step 1 (desaturation) and Step 2 (duotone remap)
# as a single color-to-color transformation. For any input RGB, the LUT
# outputs the treated RGB. ffmpeg applies this per-frame via the lut3d filter.

def generate_lut(
    ramp_name: str = "standard",
    saturation: float = DEFAULT_SATURATION,
    size: int = LUT_SIZE,
) -> str:
    """Generate a .cube format 3D LUT encoding desaturation + duotone.

    The .cube format is an industry standard supported by ffmpeg, DaVinci
    Resolve, Premiere Pro, and Final Cut Pro. This means the same LUT file
    we use for automated treatment can be loaded into any NLE for manual
    grading — ensuring identical color science across workflows.

    Returns the .cube file content as a string.
    """
    ramp = RAMPS[ramp_name]
    shadows = np.array(ramp["shadows"], dtype=np.float64)
    midtones = np.array(ramp["midtones"], dtype=np.float64)
    highlights = np.array(ramp["highlights"], dtype=np.float64)

    lines = []
    lines.append(f"# Parallax Meridian Brand Treatment — {ramp_name} ramp")
    lines.append(f"# Desaturation: {saturation*100:.0f}% of original")
    ramp_hex = RAMPS_HEX[ramp_name]
    lines.append(f"# Duotone: {ramp_hex['shadows']} → {ramp_hex['midtones']} → {ramp_hex['highlights']}")
    lines.append(f"TITLE \"Parallax {ramp_name.title()}\"")
    lines.append(f"LUT_3D_SIZE {size}")
    lines.append("")

    # The .cube format iterates R (fastest), then G, then B (slowest)
    # Values are normalized 0.0–1.0
    for b_idx in range(size):
        for g_idx in range(size):
            for r_idx in range(size):
                # Input RGB (0–255 range for computation)
                r_in = (r_idx / (size - 1)) * 255.0
                g_in = (g_idx / (size - 1)) * 255.0
                b_in = (b_idx / (size - 1)) * 255.0

                # Step 1: Desaturate
                # Luminance (ITU-R BT.601 weights, same as PIL's "L" mode)
                gray = 0.299 * r_in + 0.587 * g_in + 0.114 * b_in
                r_ds = gray + saturation * (r_in - gray)
                g_ds = gray + saturation * (g_in - gray)
                b_ds = gray + saturation * (b_in - gray)

                # Step 2: Duotone remap
                # Compute luminance of desaturated pixel for ramp position
                lum = (0.299 * r_ds + 0.587 * g_ds + 0.114 * b_ds) / 255.0
                lum = max(0.0, min(1.0, lum))

                # Three-stop interpolation (identical to treat.py)
                if lum <= 0.5:
                    t = lum * 2.0
                    r_out = shadows[0] + t * (midtones[0] - shadows[0])
                    g_out = shadows[1] + t * (midtones[1] - shadows[1])
                    b_out = shadows[2] + t * (midtones[2] - shadows[2])
                else:
                    t = (lum - 0.5) * 2.0
                    r_out = midtones[0] + t * (highlights[0] - midtones[0])
                    g_out = midtones[1] + t * (highlights[1] - midtones[1])
                    b_out = midtones[2] + t * (highlights[2] - midtones[2])

                # Normalize to 0.0–1.0 for .cube format
                lines.append(f"{r_out/255:.6f} {g_out/255:.6f} {b_out/255:.6f}")

    return "\n".join(lines) + "\n"



def save_lut(ramp_name: str, output_dir: Path, saturation: float = DEFAULT_SATURATION) -> Path:
    """Generate and save a .cube LUT file."""
    content = generate_lut(ramp_name, saturation)
    path = output_dir / f"parallax_{ramp_name}.cube"
    path.write_text(content)
    return path


# === Video Treatment via ffmpeg ===

def check_ffmpeg():
    """Verify ffmpeg is available."""
    try:
        result = subprocess.run(
            ["ffmpeg", "-version"], capture_output=True, text=True, timeout=5
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def get_video_info(input_path: Path) -> dict:
    """Get video dimensions and duration via ffprobe."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "quiet",
                "-print_format", "json",
                "-show_streams", "-show_format",
                str(input_path)
            ],
            capture_output=True, text=True, timeout=10
        )
        data = json.loads(result.stdout)
        video_stream = next(
            (s for s in data.get("streams", []) if s["codec_type"] == "video"),
            None
        )
        if video_stream:
            return {
                "width": int(video_stream.get("width", 1920)),
                "height": int(video_stream.get("height", 1080)),
                "duration": float(data.get("format", {}).get("duration", 0)),
                "fps": video_stream.get("r_frame_rate", "30/1"),
            }
    except Exception as e:
        print(f"  ⚠ ffprobe failed ({e}), assuming 1920×1080 @ 30fps", file=sys.stderr)
    return {"width": 1920, "height": 1080, "duration": 0, "fps": "30/1"}


def build_filter_chain(
    lut_path: Path,
    width: int,
    height: int,
    grain_intensity: float = DEFAULT_GRAIN_INTENSITY,
    vignette_strength: float = DEFAULT_VIGNETTE_STRENGTH,
    lut_only: bool = False,
) -> str:
    """Build the ffmpeg filter chain for the full brand treatment.

    The chain applies:
    1. 3D LUT (desaturation + duotone — baked into the .cube file)
    2. Film grain (noise filter, monochromatic)
    3. Radial vignette (darkens edges)

    The grain and vignette parameters match treat.py exactly so that
    treated video and treated photos look identical.
    """
    filters = []

    # Step 1+2: Apply the 3D LUT (desaturation + duotone combined)
    filters.append(f"lut3d='{lut_path}'")

    if not lut_only:
        # Step 3: Film grain.
        # ffmpeg's `noise` filter uses a 0–100 strength scale. We accept
        # grain_intensity on a normalized 0–1 scale and rescale here.
        # `allf=t` = temporal (per-frame) noise, which reads as live grain.
        noise_strength = max(0, min(100, int(grain_intensity * 100)))
        filters.append(
            f"noise=alls={noise_strength}:allf=t"
        )

        # Step 4: Vignette
        # ffmpeg's vignette filter uses angle parameter (PI/5 default)
        # Higher angle = stronger vignette. Map our 0-1 strength to angle.
        # treat.py at 0.18 ≈ vignette angle of PI/4
        vignette_angle = f"PI/5+{vignette_strength}*PI/3"
        filters.append(
            f"vignette=angle={vignette_angle}:mode=forward"
        )

    return ",".join(filters)


def treat_video(
    input_path: Path,
    output_path: Path,
    lut_path: Path,
    grain_intensity: float = DEFAULT_GRAIN_INTENSITY,
    vignette_strength: float = DEFAULT_VIGNETTE_STRENGTH,
    lut_only: bool = False,
    preview: bool = False,
) -> bool:
    """Apply brand treatment to a video file.

    Returns True on success.
    """
    info = get_video_info(input_path)

    filter_chain = build_filter_chain(
        lut_path, info["width"], info["height"],
        grain_intensity, vignette_strength, lut_only
    )

    cmd = ["ffmpeg", "-y", "-i", str(input_path)]

    if preview:
        # Only process first 5 seconds for quick preview
        cmd.extend(["-t", "5"])

    cmd.extend([
        "-vf", filter_chain,
        "-c:v", "libx264",
        "-preset", "medium",
        "-crf", "18",          # High quality
        "-pix_fmt", "yuv420p", # Broad compatibility
        "-c:a", "aac",         # Re-encode audio
        "-b:a", "192k",
        "-movflags", "+faststart",
        str(output_path)
    ])

    print(f"  ffmpeg command: {' '.join(cmd[:6])}... → {output_path.name}")

    try:
        result = subprocess.run(
            cmd, capture_output=True, text=True, timeout=300
        )
        if result.returncode != 0:
            print(f"  ✗ ffmpeg error:\n{result.stderr}", file=sys.stderr)
            return False
        return True
    except subprocess.TimeoutExpired:
        print("  ✗ ffmpeg timed out (5 min limit)", file=sys.stderr)
        return False


def treat_video_preview(
    input_path: Path,
    output_path: Path,
    lut_path: Path,
    grain_intensity: float = DEFAULT_GRAIN_INTENSITY,
    vignette_strength: float = DEFAULT_VIGNETTE_STRENGTH,
) -> bool:
    """Create a side-by-side comparison video (original | treated)."""
    info = get_video_info(input_path)

    filter_chain = build_filter_chain(
        lut_path, info["width"], info["height"],
        grain_intensity, vignette_strength
    )

    # Use split + filter + hstack for side-by-side
    complex_filter = (
        f"[0:v]split=2[orig][treat];"
        f"[treat]{filter_chain}[treated];"
        f"[orig][treated]hstack=inputs=2[out]"
    )

    cmd = [
        "ffmpeg", "-y",
        "-i", str(input_path),
        "-t", "5",  # First 5 seconds
        "-filter_complex", complex_filter,
        "-map", "[out]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "20",
        "-pix_fmt", "yuv420p",
        "-an",  # No audio for preview
        str(output_path)
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        return result.returncode == 0
    except subprocess.TimeoutExpired:
        return False


# === CLI ===

def main():
    parser = argparse.ArgumentParser(
        description="Parallax brand video treatment pipeline",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s clip.mp4                          Standard treatment
  %(prog)s clip.mp4 -r conflict              Conflict (rust) ramp
  %(prog)s clips/*.mp4 -o treated/           Batch mode
  %(prog)s --lut-only -r standard -o luts/   Export LUT only (for NLE)
  %(prog)s --lut-only -r conflict -o luts/   Export conflict LUT
  %(prog)s --lut-only -r editorial -o luts/  Export editorial LUT
  %(prog)s clip.mp4 --preview                Side-by-side comparison
  %(prog)s clip.mp4 --lut-only-treatment     LUT only, skip grain/vignette

The .cube LUT files are compatible with DaVinci Resolve, Premiere Pro,
and Final Cut Pro — import them for manual color grading workflows.
        """
    )
    parser.add_argument("inputs", nargs="*", help="Input video file(s)")
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
                        help="Generate side-by-side comparison (first 5s)")
    parser.add_argument("--lut-only", action="store_true",
                        help="Only generate the .cube LUT file, don't process video")
    parser.add_argument("--lut-only-treatment", action="store_true",
                        help="Apply only the LUT (skip grain + vignette)")
    parser.add_argument("--all-luts", action="store_true",
                        help="Generate LUT files for all three ramps")
    parser.add_argument("--suffix", default="_treated",
                        help="Suffix for output filename (default: _treated)")

    args = parser.parse_args()

    # Resolve output directory
    out_dir = Path(args.output) if args.output else None
    if out_dir:
        out_dir.mkdir(parents=True, exist_ok=True)

    # --- LUT-only mode ---
    if args.lut_only or args.all_luts:
        lut_dir = out_dir or Path(".")
        lut_dir.mkdir(parents=True, exist_ok=True)

        ramps_to_generate = list(RAMPS.keys()) if args.all_luts else [args.ramp]
        for ramp_name in ramps_to_generate:
            lut_path = save_lut(ramp_name, lut_dir, args.saturation)
            print(f"✓ LUT saved: {lut_path}")
            print("  Import into DaVinci Resolve / Premiere Pro for manual grading.")

        return

    # --- Video treatment mode ---
    if not args.inputs:
        parser.error("No input files specified. Use --lut-only to generate LUT without video.")

    if not check_ffmpeg():
        print("✗ ffmpeg not found. Install it: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)", file=sys.stderr)
        sys.exit(1)

    # Generate LUT in a temp directory (or output dir if specified)
    lut_dir = out_dir or Path(tempfile.mkdtemp(prefix="parallax_lut_"))
    lut_path = save_lut(args.ramp, lut_dir, args.saturation)
    print(f"Generated LUT: {lut_path}")

    success = 0
    total = 0

    for input_str in args.inputs:
        input_path = Path(input_str)
        if not input_path.exists():
            print(f"⚠ Skipping {input_path} — file not found", file=sys.stderr)
            continue

        total += 1
        info = get_video_info(input_path)
        print(f"\nProcessing {input_path.name} [{info['width']}×{info['height']}, {info['duration']:.1f}s] ramp={args.ramp}")

        target_dir = out_dir or input_path.parent

        if args.preview:
            out_path = target_dir / f"{input_path.stem}_{args.ramp}_preview.mp4"
            ok = treat_video_preview(
                input_path, out_path, lut_path,
                args.grain, args.vignette
            )
        else:
            out_path = target_dir / f"{input_path.stem}{args.suffix}.mp4"
            ok = treat_video(
                input_path, out_path, lut_path,
                args.grain, args.vignette,
                lut_only=args.lut_only_treatment,
            )

        if ok:
            print(f"  ✓ {out_path}")
            success += 1
        else:
            print(f"  ✗ Failed: {out_path}")

    print(f"\nDone. {success}/{total} videos treated.")

    # Also save the LUT alongside outputs for NLE import
    if out_dir and not (out_dir / lut_path.name).exists():
        final_lut = out_dir / lut_path.name
        final_lut.write_text(lut_path.read_text())
        print(f"LUT also saved to: {final_lut} (for NLE import)")


if __name__ == "__main__":
    main()
