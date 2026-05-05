#!/usr/bin/env python3
"""
Parallax Recraft Generation Tool

Generates production-quality illustrations and photoreal images via the Recraft V3
API, with brand-locked prompt preambles per visual register.

Two-stage brand unification:
  1. Prompt-level (this tool's --register flag) — bakes brand palette,
     composition, mood, and negative prompts into every generation.
  2. Treatment-level (treat.py / treat_video.py) — duotone LUT + grain pass
     applied to the output.

Both stages together produce naturalistic, on-brand outputs. Either stage alone
is weaker. See PROMPT_PREAMBLES.md for design rationale.

Usage:
  # Atmospheric register (constructivist illustration — Register 2)
  python recraft.py generate "industrial factory complex with smokestacks" \\
      --register atmospheric -o factory.svg

  # Grounding register (photoreal mannequin scene — Register 3)
  python recraft.py generate "interior of semiconductor cleanroom with workers" \\
      --register grounding -o cleanroom.png

  # Analytical register (rare — for diagrammatic illustrations not coded in Remotion)
  python recraft.py generate "supply chain network nodes" \\
      --register analytical -o network.svg

  # Generate with a specific Recraft style override
  python recraft.py generate "chip schematic" --style vector_illustration -o chip.svg

  # Generate and apply brand duotone treatment (SVG only — use treat.py for raster)
  python recraft.py generate "strategic game board" --register atmospheric \\
      --treat standard -o board.svg

  # Batch generate from a shot list JSON (per-shot 'register' field supported)
  python recraft.py batch shot-list.json --output assets/ --treat standard

  # Batch with a default register for shots that don't specify one
  python recraft.py batch shot-list.json --register atmospheric --output assets/

  # List available styles
  python recraft.py styles

  # Preview mode (print URL, don't download)
  python recraft.py generate "test prompt" --register atmospheric --preview

  # Raw prompt — bypass register/mode preambles entirely
  python recraft.py generate "exact prompt as-is" --raw

Environment variables:
  RECRAFT_API_KEY  — Get at https://www.recraft.ai/docs/api-reference/getting-started

Requires: pip install requests --break-system-packages
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Optional
from xml.etree import ElementTree as ET

import requests

# ── Configuration ────────────────────────────────────────────────────────────

API_KEY = os.environ.get("RECRAFT_API_KEY", "")
BASE_URL = "https://external.api.recraft.ai/v1"

# Brand palette (inline to avoid cross-tool import complexity)
BRAND_PALETTE = {
    "ink": "#1C1814",
    "amber": "#E5A544",
    "rust": "#C23B22",
    "bone": "#F0E6D0",
    "paper": "#F5F0E8",
    "oxblood": "#6B1D1D",
    "bronze": "#8B6914",
    "midnight": "#0F1923",
}

# Duotone ramps matching palette.json
DUOTONE_RAMPS = {
    "standard": {"shadows": "#1C1814", "midtones": "#8B6914", "highlights": "#E5A544"},
    "conflict": {"shadows": "#1C1814", "midtones": "#6B1D1D", "highlights": "#C23B22"},
    "editorial": {"shadows": "#3A3530", "midtones": "#C4B89A", "highlights": "#F0E6D0"},
}

# Default prompt prefix for brand consistency
BRAND_PREFIX = (
    "Minimalist vector illustration, clean geometric style, "
    "warm amber and dark umber color palette, "
    "no text, no labels, no watermarks, "
    "suitable for video overlay on dark background. "
)

# Recraft style categories
VECTOR_STYLES = {
    "vector_illustration": "General purpose vector illustration (default)",
    "flat_2.0": "Modern flat design — clean shapes, bold colors",
    "vector_art": "Artistic vector with more detail and depth",
    "line_art": "Outline-only illustration",
    "linocut": "Woodcut/linocut print aesthetic",
    "engraving": "Classic engraving style — crosshatching, fine lines",
    "doodle_line_art": "Hand-drawn doodle aesthetic",
    "cartoon": "Simplified cartoon style",
}

ICON_STYLES = {
    "icon": "Standard icon",
    "outline": "Outline icon",
    "pictogram": "Pictogram — simplified symbolic representation",
    "colored_outline": "Colored outline icon",
    "colored_shape": "Colored filled shape icon",
    "gradient_outline": "Gradient outline icon",
    "gradient_shape": "Gradient filled shape icon",
    "broken_line": "Broken/dashed line icon",
    "offset_fill": "Offset shadow fill icon",
    "offset_doodle": "Offset doodle style icon",
    "doodle": "Doodle style icon",
}

# Raster styles (returned as PNG, not SVG)
RASTER_STYLES = {
    "realistic_image": "Photorealistic image — for the Grounding register (mannequin scenes)",
    "digital_illustration": "Digital painting — between vector and photo",
}

ALL_STYLES = {**VECTOR_STYLES, **ICON_STYLES, **RASTER_STYLES}

# ── API Client ───────────────────────────────────────────────────────────────


def generate_image(
    prompt: str,
    style: str = "vector_illustration",
    size: str = "1920x1080",
    n: int = 1,
    use_brand_prefix: bool = True,
) -> list[dict]:
    """
    Generate image(s) via Recraft API.

    Returns list of {url, revised_prompt} dicts.
    """
    if not API_KEY:
        print("ERROR: RECRAFT_API_KEY environment variable not set.", file=sys.stderr)
        print("  Get your key at: https://www.recraft.ai/docs/api-reference/getting-started", file=sys.stderr)
        sys.exit(1)

    full_prompt = (BRAND_PREFIX + prompt) if use_brand_prefix else prompt

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    body = {
        "model": "recraft-v3",
        "prompt": full_prompt,
        "style": style,
        "size": size,
        "n": n,
    }

    print(f"  Generating: {prompt[:80]}{'...' if len(prompt) > 80 else ''}")
    print(f"  Style: {style} | Size: {size} | Count: {n}")

    try:
        resp = requests.post(
            f"{BASE_URL}/images/generations",
            headers=headers,
            json=body,
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("data", []):
            results.append({
                "url": item.get("url", ""),
                "revised_prompt": item.get("revised_prompt", ""),
            })

        return results

    except requests.exceptions.HTTPError as e:
        print(f"  API Error: {e}", file=sys.stderr)
        if resp.status_code == 401:
            print("  → Invalid API key. Check RECRAFT_API_KEY.", file=sys.stderr)
        elif resp.status_code == 429:
            print("  → Rate limited. Wait and retry.", file=sys.stderr)
        else:
            try:
                print(f"  → {resp.json()}", file=sys.stderr)
            except Exception:
                print(f"  → {resp.text[:200]}", file=sys.stderr)
        return []

    except requests.exceptions.Timeout:
        print("  Timeout — Recraft API took too long. Retry.", file=sys.stderr)
        return []


def download_svg(url: str, output_path: Path) -> bool:
    """Download SVG content from URL and save to file."""
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()

        content = resp.text
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Verify it's actually SVG
        if "<svg" not in content[:500].lower():
            # It's a raster image URL — download as PNG instead
            png_path = output_path.with_suffix(".png")
            with open(png_path, "wb") as f:
                f.write(resp.content)
            print(f"  Note: Recraft returned raster image, saved as {png_path.name}")
            return True

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)

        return True

    except Exception as e:
        print(f"  Download failed: {e}", file=sys.stderr)
        return False


# ── SVG Brand Treatment ──────────────────────────────────────────────────────


def apply_duotone_svg(svg_path: Path, ramp_name: str = "standard") -> Path:
    """
    Apply brand duotone treatment to an SVG file.

    Replaces colors in the SVG with the brand duotone ramp.
    This is a lightweight SVG-level treatment — for raster images,
    use tools/brand-treatment/treat.py instead.

    Returns path to the treated file.
    """
    ramp = DUOTONE_RAMPS.get(ramp_name, DUOTONE_RAMPS["standard"])

    with open(svg_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Parse all hex colors in the SVG
    hex_pattern = re.compile(r'#([0-9a-fA-F]{6})\b')

    def remap_color(match: re.Match) -> str:
        hex_color = match.group(1)
        r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)

        # Convert to luminance (0-1)
        luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0

        # Map luminance to duotone ramp (3-stop: shadows → midtones → highlights)
        shadow = _hex_to_rgb(ramp["shadows"])
        mid = _hex_to_rgb(ramp["midtones"])
        highlight = _hex_to_rgb(ramp["highlights"])

        if luminance < 0.5:
            t = luminance / 0.5
            out_r = int(shadow[0] + t * (mid[0] - shadow[0]))
            out_g = int(shadow[1] + t * (mid[1] - shadow[1]))
            out_b = int(shadow[2] + t * (mid[2] - shadow[2]))
        else:
            t = (luminance - 0.5) / 0.5
            out_r = int(mid[0] + t * (highlight[0] - mid[0]))
            out_g = int(mid[1] + t * (highlight[1] - mid[1]))
            out_b = int(mid[2] + t * (highlight[2] - mid[2]))

        return f"#{out_r:02x}{out_g:02x}{out_b:02x}"

    treated = hex_pattern.sub(remap_color, content)

    # Write treated version
    treated_path = svg_path.with_stem(svg_path.stem + f"_treated_{ramp_name}")
    with open(treated_path, "w", encoding="utf-8") as f:
        f.write(treated)

    print(f"  Brand treatment ({ramp_name}): {treated_path.name}")
    return treated_path


def _hex_to_rgb(hex_str: str) -> tuple[int, int, int]:
    h = hex_str.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


# ── Prompt Engineering ───────────────────────────────────────────────────────


def build_parallax_prompt(
    description: str,
    context: str = "",
    visual_mode: str = "illustration",
) -> str:
    """
    Build an optimized prompt for Parallax brand aesthetics.

    Args:
        description: What to illustrate (from script right column)
        context: Narration context (helps Recraft understand intent)
        visual_mode: One of 'illustration', 'diagram', 'icon', 'metaphor'
    """
    mode_prefix = {
        "illustration": (
            "Editorial vector illustration for a geopolitics documentary. "
            "Warm color palette (amber, umber, bone). "
            "Clean composition, strong silhouettes, information-dense. "
        ),
        "diagram": (
            "Technical vector diagram for an analytical video essay. "
            "Geometric shapes, clean lines, labeled nodes. "
            "Warm amber and dark umber on light bone background. "
        ),
        "icon": (
            "Minimalist icon set, geometric style, consistent stroke width. "
            "Amber (#E5A544) on dark (#1C1814) background. "
        ),
        "metaphor": (
            "Conceptual vector illustration expressing an abstract idea. "
            "Symbolic, not literal. Warm tones, editorial magazine quality. "
            "Strong focal point, negative space used intentionally. "
        ),
    }

    prefix = mode_prefix.get(visual_mode, mode_prefix["illustration"])
    parts = [prefix, description]

    if context:
        parts.append(f"Context: {context}")

    parts.append("No text, no labels, no watermarks, no human faces.")

    return " ".join(parts)


# ── Register Preambles (Three-Register Visual System) ────────────────────────
#
# Per VISUAL_LANGUAGE.md, every visual surface in a Parallax video belongs to
# one of three registers. Recraft generates two of them (atmospheric, grounding);
# the third (analytical) normally lives in Remotion. The preambles below are the
# "shift-left" pass: they push the source image into brand palette and brand
# composition BEFORE treat.py / treat_video.py applies the duotone LUT. Goal is
# for the LUT to do the final 10% polish, not 60% color rescue — that produces
# more naturalistic results and reduces the "obvious LUT" feel.
#
# Architecture: prompt-level (here) + treatment-level (treat.py / treat_video.py)
# act as two stages of brand unification. Either stage alone is weaker than both.

REGISTER_PREAMBLES = {
    "atmospheric": {
        "style": "vector_illustration",
        "preamble": (
            "Editorial illustration in the Parallax constructivist style. "
            "Soviet constructivism meets art deco propaganda poster, with flowing "
            "organic forms (smoke, ribbons, cables) woven through brutal industrial "
            "geometry (factories, towers, pipes, machinery). "
            "Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D), "
            "umber (#8B7355), burnt amber / gold (#C4A747), rust (#A64D46), and "
            "bone (#F0E6D0) on paper (#F5F0E8) background. No other colors. "
            "Bold compositional confidence, monumentalist scale, low horizon line, "
            "heavy contrast, color-blocked forms with no soft shading or gradients. "
            "Mood: civilizational stakes, industrial ambition, technological dread, "
            "editorial weight, intellectually rigorous."
        ),
        "negative": (
            "Avoid: corporate clip art, children's book illustration, pastel tones, "
            "cool blue or teal, photorealistic rendering, 3D render look, "
            "gradient-heavy fills, cute or whimsical mood, flat tech-startup "
            "aesthetic, Memphis design, isometric perspective. "
            "No text, no labels, no watermarks, no human faces."
        ),
    },
    "grounding": {
        "style": "realistic_image",
        "preamble": (
            "Editorial documentary photography for a geopolitics video essay. "
            "Photorealistic environment rendered with accurate materials, lighting, "
            "and reflections. Human figures present but with completely smooth "
            "featureless mannequin faces — no eyes, no nose, no mouth, just smooth "
            "convex skin where features would be — while clothing, body, and hair "
            "remain fully realistic and context-appropriate. "
            "Warm tungsten or natural lighting, heavy chiaroscuro: deep umber "
            "shadows giving way to amber midtones and bone highlights. Slightly "
            "desaturated color grade in the warm-umber spectrum, ready for further "
            "color treatment. Shot on 35mm film, shallow depth of field, editorial "
            "composition. "
            "Mood: documentary reconstruction, contemplative weight, civilizational "
            "scale. The figures are depersonalized to represent roles rather than "
            "individuals."
        ),
        "negative": (
            "Avoid: cool corporate blue, clinical fluorescent white balance, Adobe "
            "stock photo aesthetic, teal-and-orange Hollywood grade, high-key "
            "advertising lighting, shiny CGI render look, cartoon style, "
            "illustration look. Mannequin faces must be smooth and convex — never "
            "concave or scooped inward. Faces must be completely featureless with "
            "no facial features whatsoever. No identifiable real individuals."
        ),
    },
    "analytical": {
        # Analytical register normally lives in Remotion (code-locked, not generated).
        # This entry exists for the rare case where a diagrammatic illustration
        # needs to be generated rather than coded — keep it code-clean in feel.
        "style": "vector_illustration",
        "preamble": (
            "Technical diagrammatic illustration for an analytical video essay. "
            "Geometric vector forms, clean precise lines, balanced negative space, "
            "labeled-style nodes without actual text. "
            "Restricted palette: ink (#1C1814) lines on paper (#F5F0E8) background, "
            "with burnt amber / gold (#C4A747) and rust (#A64D46) accents only "
            "where data weight demands attention. No other colors. "
            "Mood: information-first, analytical, code-clean. Composition reads "
            "left-to-right or top-to-bottom for diagrammatic clarity."
        ),
        "negative": (
            "Avoid: decorative flourishes, painterly textures, atmospheric mood, "
            "shading, gradients, organic flowing forms, photorealism, 3D render. "
            "No text, no labels, no watermarks."
        ),
    },
}


def build_register_prompt(
    description: str,
    register: str,
    context: str = "",
) -> str:
    """
    Build a prompt for the specified visual register.

    Prepends the register's brand preamble and appends the register's negative
    prompts. This is the prompt-level half of the two-stage brand unification
    architecture (the LUT pass in treat.py / treat_video.py is the second stage).

    See VISUAL_LANGUAGE.md for register definitions and PROMPT_PREAMBLES.md for
    the design rationale.

    Args:
        description: What to illustrate / photograph (from script right column)
        register: One of 'atmospheric', 'grounding', 'analytical'
        context: Optional narration context (helps Recraft understand intent)

    Returns:
        Full prompt string ready to send to the Recraft API.
    """
    if register not in REGISTER_PREAMBLES:
        raise ValueError(
            f"Unknown register: {register!r}. "
            f"Choose from: {sorted(REGISTER_PREAMBLES.keys())}"
        )

    spec = REGISTER_PREAMBLES[register]
    parts = [spec["preamble"], description]

    if context:
        parts.append(f"Context: {context}")

    parts.append(spec["negative"])

    return " ".join(parts)


# ── Batch Processing ─────────────────────────────────────────────────────────


def process_batch(
    shot_list_path: Path,
    output_dir: Path,
    style: str = "vector_illustration",
    treat_ramp: Optional[str] = None,
    default_register: Optional[str] = None,
) -> dict:
    """
    Process a shot list JSON file, generating SVGs for AI-GENERATE entries.

    Shot list format (same as source.py):
    [
      {
        "id": "shot-01",
        "description": "Semiconductor supply chain flow diagram",
        "type": "ai-generate",                  // only processes these
        "register": "atmospheric",              // optional: atmospheric/grounding/analytical
        "visual_mode": "diagram",               // legacy fallback if register not set
        "context": "Narration about TSMC dominance",
        "fallback_terms": ["chip supply chain", "semiconductor flow"]
      },
      ...
    ]

    `register` (per-shot) takes precedence over `visual_mode` and over
    `default_register` (CLI flag). When register is set, the register's
    recommended Recraft style is used unless `style` is explicitly set on the shot.

    Returns manifest of generated files.
    """
    with open(shot_list_path, "r", encoding="utf-8") as f:
        shots = json.load(f)

    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = {"generated": [], "skipped": [], "failed": []}

    # Filter to AI-generate entries only
    ai_shots = [s for s in shots if s.get("type", "").lower() in ("ai-generate", "ai-gen", "svg")]

    if not ai_shots:
        print("No ai-generate entries found in shot list.")
        return manifest

    print(f"\nProcessing {len(ai_shots)} AI-generate entries from {shot_list_path.name}\n")
    print("=" * 60)

    for i, shot in enumerate(ai_shots):
        shot_id = shot.get("id", f"shot-{i:02d}")
        description = shot.get("description", "")
        visual_mode = shot.get("visual_mode", "illustration")
        context = shot.get("context", "")
        # Per-shot register overrides CLI-level default; either takes precedence
        # over visual_mode for prompt construction.
        shot_register = shot.get("register") or default_register

        print(f"\n[{i+1}/{len(ai_shots)}] {shot_id}")
        print(f"  Description: {description[:60]}{'...' if len(description) > 60 else ''}")

        if not description:
            print("  SKIPPED: No description")
            manifest["skipped"].append({"id": shot_id, "reason": "no description"})
            continue

        # Build prompt — register-based if set, otherwise legacy visual_mode path
        if shot_register:
            prompt = build_register_prompt(description, shot_register, context)
            print(f"  Register: {shot_register}")
        else:
            prompt = build_parallax_prompt(description, context, visual_mode)
            print(f"  Visual mode: {visual_mode}")

        # Determine best style for this shot
        if shot_register:
            shot_style = shot.get("style") or REGISTER_PREAMBLES[shot_register]["style"]
        elif visual_mode == "icon":
            shot_style = shot.get("style", "pictogram")
        elif visual_mode == "diagram":
            shot_style = shot.get("style", "flat_2.0")
        else:
            shot_style = shot.get("style", style)

        # Generate
        results = generate_image(
            prompt=prompt,
            style=shot_style,
            size="1920x1080",
            n=1,
            use_brand_prefix=False,  # build_parallax_prompt already adds context
        )

        if not results:
            manifest["failed"].append({"id": shot_id, "reason": "API error"})
            continue

        # Download
        output_file = output_dir / f"{shot_id}.svg"
        url = results[0]["url"]

        if download_svg(url, output_file):
            entry = {
                "id": shot_id,
                "file": str(output_file),
                "prompt": prompt[:200],
                "style": shot_style,
                "url": url,
            }

            # Apply brand treatment if requested
            if treat_ramp:
                treated = apply_duotone_svg(output_file, treat_ramp)
                entry["treated_file"] = str(treated)

            manifest["generated"].append(entry)
            print(f"  ✓ Saved: {output_file.name}")
        else:
            manifest["failed"].append({"id": shot_id, "reason": "download failed"})

        # Rate limit courtesy (avoid hammering the API)
        if i < len(ai_shots) - 1:
            time.sleep(1)

    # Write manifest
    manifest_path = output_dir / "recraft-manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n{'=' * 60}")
    print(f"Done: {len(manifest['generated'])} generated, "
          f"{len(manifest['skipped'])} skipped, "
          f"{len(manifest['failed'])} failed")
    print(f"Manifest: {manifest_path}")

    return manifest


# ── CLI ──────────────────────────────────────────────────────────────────────


def cmd_generate(args):
    """Generate a single illustration."""
    # Build the full prompt based on register / mode / raw flag.
    # Register takes precedence over mode (it's the higher-level concept).
    if args.register:
        prompt = build_register_prompt(args.prompt, args.register)
        # If user didn't explicitly set --style, use the register's recommended style
        style = args.style or REGISTER_PREAMBLES[args.register]["style"]
    elif args.raw:
        prompt = args.prompt
        style = args.style or "vector_illustration"
    else:
        prompt = build_parallax_prompt(args.prompt, visual_mode=args.mode)
        style = args.style or "vector_illustration"

    results = generate_image(
        prompt=prompt,
        style=style,
        size=args.size,
        n=args.count,
        use_brand_prefix=False,
    )

    if not results:
        sys.exit(1)

    for i, result in enumerate(results):
        url = result["url"]
        print(f"  URL: {url}")

        if args.preview:
            continue

        # Determine output path
        if args.output:
            out = Path(args.output)
            if args.count > 1:
                out = out.with_stem(f"{out.stem}_{i+1}")
        else:
            slug = re.sub(r'[^a-z0-9]+', '-', prompt[:40].lower()).strip('-')
            out = Path(f"recraft_{slug}.svg")

        if download_svg(url, out):
            print(f"  Saved: {out}")

            if args.treat:
                apply_duotone_svg(out, args.treat)


def cmd_batch(args):
    """Batch generate from shot list."""
    shot_list = Path(args.shot_list)
    if not shot_list.exists():
        print(f"ERROR: Shot list not found: {shot_list}", file=sys.stderr)
        sys.exit(1)

    output_dir = Path(args.output) if args.output else shot_list.parent / "recraft-assets"

    process_batch(
        shot_list_path=shot_list,
        output_dir=output_dir,
        style=args.style or "vector_illustration",
        treat_ramp=args.treat,
        default_register=args.register,
    )


def cmd_styles(args):
    """List available styles."""
    print("\n  VECTOR ILLUSTRATION STYLES")
    print("  " + "─" * 50)
    for name, desc in VECTOR_STYLES.items():
        marker = " ★" if name == "vector_illustration" else ""
        print(f"  {name:24s} {desc}{marker}")

    print("\n  ICON STYLES")
    print("  " + "─" * 50)
    for name, desc in ICON_STYLES.items():
        print(f"  {name:24s} {desc}")

    print(f"\n  Total: {len(ALL_STYLES)} styles available")
    print(f"  ★ = default\n")


def main():
    parser = argparse.ArgumentParser(
        description="Parallax Recraft SVG Generation Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # ── generate ──
    gen = subparsers.add_parser("generate", help="Generate a single illustration or photo")
    gen.add_argument("prompt", help="Description of what to illustrate / photograph")
    gen.add_argument("-o", "--output", help="Output file path (default: auto-named)")
    gen.add_argument("-r", "--register",
                     choices=list(REGISTER_PREAMBLES.keys()),
                     help="Parallax visual register — applies the register's brand "
                          "preamble + negative prompts and auto-selects the right "
                          "Recraft style. Takes precedence over --mode. "
                          "See VISUAL_LANGUAGE.md / PROMPT_PREAMBLES.md.")
    gen.add_argument("-s", "--style", default=None,
                     choices=list(ALL_STYLES.keys()),
                     help="Recraft style (default: vector_illustration; "
                          "auto-selected from register if --register is set)")
    gen.add_argument("-m", "--mode", default="illustration",
                     choices=["illustration", "diagram", "icon", "metaphor"],
                     help="Legacy visual mode — shapes the prompt prefix when "
                          "--register is not set (default: illustration)")
    gen.add_argument("--size", default="1920x1080",
                     help="Image size WxH (default: 1920x1080)")
    gen.add_argument("-n", "--count", type=int, default=1,
                     help="Number of variations to generate (1-4)")
    gen.add_argument("--treat", choices=list(DUOTONE_RAMPS.keys()),
                     help="Apply brand duotone treatment after generation (SVG only; "
                          "use tools/brand-treatment/treat.py for raster output)")
    gen.add_argument("--preview", action="store_true",
                     help="Print URL only, don't download")
    gen.add_argument("--raw", action="store_true",
                     help="Use prompt as-is without brand prefix or register preamble")
    gen.set_defaults(func=cmd_generate)

    # ── batch ──
    bat = subparsers.add_parser("batch", help="Batch generate from shot list JSON")
    bat.add_argument("shot_list", help="Path to shot-list.json")
    bat.add_argument("-o", "--output", help="Output directory (default: alongside shot list)")
    bat.add_argument("-r", "--register",
                     choices=list(REGISTER_PREAMBLES.keys()),
                     help="Default Parallax register for shots that don't set one "
                          "explicitly. Per-shot 'register' field overrides this.")
    bat.add_argument("-s", "--style", default=None,
                     help="Default Recraft style for shots without register / explicit style")
    bat.add_argument("--treat", choices=list(DUOTONE_RAMPS.keys()),
                     help="Apply brand duotone treatment to all generated SVGs")
    bat.set_defaults(func=cmd_batch)

    # ── styles ──
    sty = subparsers.add_parser("styles", help="List available Recraft styles")
    sty.set_defaults(func=cmd_styles)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
