#!/usr/bin/env python3
"""
Parallax — AI Video Style Reference Generator

Generates the 7 canonical style reference images that define the "Parallax AI-GEN
look" via Flux 2 Pro on fal.ai. These references are used as style anchors for
Kling 3.0 / Seedance 2.0 / Sora 2 / Runway Gen-4 across all episodes.

Usage:
  # Generate all 7 references
  python generate_style_refs.py --all

  # Generate a specific reference by number (1-7)
  python generate_style_refs.py --ref 1

  # Generate a specific reference by name
  python generate_style_refs.py --ref mannequin-face

  # Re-generate with a modified prompt (iterating)
  python generate_style_refs.py --ref 1 --prompt "your custom prompt override"

  # List all references and their status
  python generate_style_refs.py --list

  # Run LUT test on all generated references
  python generate_style_refs.py --lut-test

  # Run LUT test on a specific reference
  python generate_style_refs.py --lut-test --ref 1

Environment variables:
  FAL_KEY  — API key from fal.ai (required)

Requires: pip install fal-client requests --break-system-packages

See: tools/ai-video/style-references/PROMPTS.md for full prompt details.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from dataclasses import dataclass

# ── Paths ────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).resolve().parent
STYLE_REFS_DIR = SCRIPT_DIR / "style-references"
TREAT_VIDEO = SCRIPT_DIR.parent / "brand-treatment" / "treat_video.py"
TREAT_IMAGE = SCRIPT_DIR.parent / "brand-treatment" / "treat.py"

# ── Style Reference Definitions ──────────────────────────────────────────


@dataclass
class StyleRef:
    number: int
    name: str
    filename: str
    description: str
    prompt: str
    lut_primary: str  # Which LUT treatment this ref is designed for


STYLE_REFS = [
    StyleRef(
        number=1,
        name="mannequin-face",
        filename="style-ref_face_mannequin-neutral_v1.png",
        description="Mannequin face close-up — locks the exact level of facial stylization",
        lut_primary="standard",
        prompt=(
            "Close-up portrait photograph of a realistic department store mannequin "
            "head on a human body. The face is a smooth, gently convex surface that "
            "protrudes forward naturally like a real face shape — prominent forehead, "
            "protruding nose ridge, forward cheekbones, defined jawline — but the "
            "entire surface is completely smooth with no eyes, no mouth, no nostrils, "
            "no wrinkles, no pores in the face area. Skin-colored matte plastic or "
            "ceramic finish on the face only. The rest of the body is a real human: "
            "warm natural skin on neck and ears, dark short hair with realistic "
            "texture, crisp white dress shirt with fabric detail. Studio portrait "
            "lighting from upper left, soft shadows on the smooth facial surface "
            "revealing its three-dimensional contour. Shot on Canon EOS R5, 85mm "
            "f/1.4, shallow depth of field, warm gray background. 16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=2,
        name="cleanroom-warm",
        filename="style-ref_interior_cleanroom-warm_v1.png",
        description="Industrial interior (warm) — semiconductor cleanroom with amber lithography light",
        lut_primary="standard",
        prompt=(
            "Interior of an advanced semiconductor fabrication cleanroom with yellow "
            "lithography lighting casting warm amber glow hex #E5A544 across white "
            "surfaces and HEPA-filtered ceiling panels. Raised floor with perforated "
            "tiles, wafer handling equipment in foreground, FOUP carriers on automated "
            "track receding into background. Two workers in full white bunny suits "
            "with clear polycarbonate face shields — behind each shield, a smooth "
            "featureless mannequin-like face with no eyes or mouth, just the blank "
            "convex shape of a department store mannequin head. Bunny suit fabric is "
            "crisp and realistic with seam detail. Atmosphere of extreme sterility "
            "and quiet precision. Shot on Sony A7IV, 35mm f/2.0, medium wide from "
            "hip level, shallow depth of field softening the background. "
            "Photorealistic rendering. 16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=3,
        name="command-cool",
        filename="style-ref_interior_command-cool_v1.png",
        description="Industrial interior (cool) — military/tech command center with blue screens",
        lut_primary="conflict",
        prompt=(
            "Interior of a military strategic operations room, dark and tense. "
            "Multiple large display screens casting cool blue light hex #3266AD as "
            "the primary illumination source, overhead fluorescent panels switched "
            "off. Three figures in generic military uniforms seated at workstations — "
            "each has a smooth featureless mannequin-like face with no eyes or mouth, "
            "the blank convex shape of a department store mannequin head with warm "
            "skin tone. Uniforms are photorealistic with pressed fabric, epaulettes, "
            "and generic insignia. Radar displays and situation maps glow on screens, "
            "cable management and keyboard detail visible at workstations. "
            "Institutional drop ceiling, rubber floor tiles. Shot on Arri Alexa, "
            "24mm f/2.8, slight dutch angle for tension, deep focus keeping all "
            "three figures sharp. Photorealistic rendering. 16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=4,
        name="historical-gov",
        filename="style-ref_interior_historical-gov_v1.png",
        description="Historical interior — 1940s government office, editorial LUT target",
        lut_primary="editorial",
        prompt=(
            "Interior of a 1940s American government office or diplomatic meeting "
            "room. Dark wood paneling on walls, heavy green curtains, brass desk lamp "
            "casting a warm pool of light on a large mahogany desk. Stacked papers, "
            "fountain pen, brass ashtray, rotary telephone on the desk surface. Two "
            "men seated across from each other in period-correct double-breasted "
            "suits with wide lapels and pocket squares — both have smooth featureless "
            "mannequin-like faces with no eyes or mouth, the blank convex shape of "
            "department store mannequin heads with warm skin tones. Hands are "
            "realistic, resting on the desk. Filing cabinet in the corner, venetian "
            "blinds casting slats of warm light across the room. Slightly desaturated "
            "color palette with warm sepia undertone suggesting aged Kodachrome film "
            "stock. Shot on vintage Leica lens with soft edges, 50mm equivalent, "
            "medium shot. Documentary framing. Photorealistic rendering. 16:9 "
            "aspect ratio."
        ),
    ),
    StyleRef(
        number=5,
        name="suit-walking",
        filename="style-ref_figure_suit-walking_v1.png",
        description="Figure in motion — full body mannequin-face, professional walking",
        lut_primary="standard",
        prompt=(
            "Full body photograph of a person in a tailored dark navy suit walking "
            "through a modern glass-and-steel building lobby, captured mid-stride "
            "with natural walking posture and subtle arm swing. The figure has a "
            "smooth featureless mannequin-like face with no eyes or mouth — the "
            "blank convex shape of a department store mannequin head — with warm "
            "skin tone and dark short hair in a clean shape. Clothing is "
            "photorealistic: visible wool fabric texture, horn buttons, proper drape "
            "and movement in the jacket, crisp white shirt collar visible. Hands are "
            "realistic with five fingers in a natural mid-swing pose. Modern "
            "architectural interior with floor-to-ceiling windows, polished stone "
            "floor showing subtle reflections. Natural daylight streaming from "
            "windows with soft interior fill light. Shot on Sony A7IV, 50mm f/2.0, "
            "full body in frame with walking room ahead of the figure, slight motion "
            "suggestion. Photorealistic rendering. 16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=6,
        name="aerial-urban",
        filename="style-ref_aerial_urban-development_v1.png",
        description="Aerial/wide environment — semiconductor campus, no people needed",
        lut_primary="standard",
        prompt=(
            "Aerial photograph of a massive semiconductor fabrication campus under "
            "construction in arid desert terrain. Multiple large white rectangular "
            "cleanroom buildings in various stages of completion, yellow construction "
            "cranes towering above, landscaped earthen berms separating construction "
            "zones, paved access roads with small white trucks and construction "
            "vehicles providing scale reference. Surrounding landscape transitions "
            "from raw desert scrub to graded earth to paved infrastructure. Late "
            "afternoon golden hour light casting long dramatic shadows from the "
            "buildings and cranes across the construction site. Sense of enormous "
            "industrial scale — each building is clearly hundreds of meters long "
            "based on vehicle sizes. Shot from helicopter at 500 feet altitude, "
            "70mm equivalent lens, f/5.6, slightly angled down at 30 degrees. "
            "Clear desert air with mild atmospheric haze softening the distant "
            "mountains. No people visible at this scale. Photorealistic rendering. "
            "16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=7,
        name="corridor-splitting",
        filename="style-ref_concept_corridor-splitting_v1.png",
        description="Conceptual corridor — physical metaphor for bifurcation/choice",
        lut_primary="standard",
        prompt=(
            "A long modern corridor with polished concrete floors that physically "
            "splits into two diverging paths ahead. The left path is bathed in warm "
            "amber light hex #E5A544, and through its glass walls shows a "
            "collaborative workspace with shared tables and equipment. The right "
            "path is bathed in cool blue light hex #3266AD, and through its glass "
            "walls shows isolated workstations separated by frosted glass barriers. "
            "At the split point stands a single figure in a neutral gray suit with "
            "a smooth featureless mannequin-like face — the blank convex shape of a "
            "department store mannequin head — arms slightly raised in a gesture of "
            "weighing options. Polished concrete floor with subtle expansion joints "
            "creating directional lines toward each path. Modern industrial ceiling "
            "with exposed silver ductwork. Shot on Sony A7IV, 24mm f/8, wide shot "
            "with one-point perspective, vanishing point at the corridor split, deep "
            "focus keeping everything sharp. Dramatic lighting contrast between the "
            "warm and cool paths. Photorealistic rendering. 16:9 aspect ratio."
        ),
    ),
]

# Index by name for CLI lookup
REFS_BY_NAME = {r.name: r for r in STYLE_REFS}
REFS_BY_NUMBER = {r.number: r for r in STYLE_REFS}

# Recommended generation order (face first, then scale test, then contexts)
GENERATION_ORDER = [1, 5, 2, 3, 4, 6, 7]


# ── fal.ai Generation ───────────────────────────────────────────────────


def generate_image(prompt: str, api_key: str, width: int = 1920, height: int = 1080) -> str:
    """
    Generate an image via Flux 2 Pro on fal.ai.
    Returns the URL of the generated image.
    """
    try:
        import fal_client
    except ImportError:
        # Fall back to requests-based approach
        return _generate_via_requests(prompt, api_key, width, height)

    # Set API key
    os.environ["FAL_KEY"] = api_key

    print("  Submitting to Flux 2 Pro via fal.ai...")
    result = fal_client.subscribe(
        "fal-ai/flux-pro/v1.1",
        arguments={
            "prompt": prompt,
            "image_size": {"width": width, "height": height},
            "num_images": 1,
            "safety_tolerance": "5",  # Most permissive (mannequin faces can trip filters)
        },
        with_logs=False,
    )

    if "images" in result and len(result["images"]) > 0:
        return result["images"][0]["url"]
    else:
        raise RuntimeError(f"No images returned. Response: {json.dumps(result, indent=2)}")


def _generate_via_requests(prompt: str, api_key: str, width: int, height: int) -> str:
    """Fallback: use requests directly against fal.ai REST API."""
    import requests

    url = "https://queue.fal.run/fal-ai/flux-pro/v1.1"
    headers = {
        "Authorization": f"Key {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "prompt": prompt,
        "image_size": {"width": width, "height": height},
        "num_images": 1,
        "safety_tolerance": "5",
    }

    print("  Submitting to Flux 2 Pro via fal.ai (REST)...")
    resp = requests.post(url, headers=headers, json=payload)

    if resp.status_code == 200:
        data = resp.json()
        if "images" in data and len(data["images"]) > 0:
            return data["images"][0]["url"]
        # Queue mode — need to poll
        if "request_id" in data:
            return _poll_queue(data["request_id"], api_key)
        raise RuntimeError(f"Unexpected response: {json.dumps(data, indent=2)}")
    elif resp.status_code == 202:
        # Queued — poll for result
        data = resp.json()
        if "request_id" in data:
            return _poll_queue(data["request_id"], api_key)
        raise RuntimeError(f"Queued but no request_id: {resp.text}")
    else:
        raise RuntimeError(f"fal.ai error {resp.status_code}: {resp.text}")


def _poll_queue(request_id: str, api_key: str) -> str:
    """Poll fal.ai queue until the image is ready."""
    import requests

    status_url = f"https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/{request_id}/status"
    result_url = f"https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/{request_id}"
    headers = {"Authorization": f"Key {api_key}"}

    print("  Queued. Polling for result", end="", flush=True)
    for _ in range(120):  # Up to 2 minutes
        time.sleep(2)
        print(".", end="", flush=True)

        resp = requests.get(status_url, headers=headers)
        if resp.status_code != 200:
            continue

        data = resp.json()
        status = data.get("status")

        if status == "COMPLETED":
            print(" done!")
            resp2 = requests.get(result_url, headers=headers)
            result = resp2.json()
            if "images" in result and len(result["images"]) > 0:
                return result["images"][0]["url"]
            raise RuntimeError(f"Completed but no images: {json.dumps(result, indent=2)}")
        elif status == "FAILED":
            print(" FAILED!")
            raise RuntimeError(f"Generation failed: {json.dumps(data, indent=2)}")

    raise RuntimeError("Timed out waiting for generation (2 minutes)")


def download_image(url: str, output_path: Path) -> None:
    """Download an image from URL to local path."""
    import requests

    print(f"  Downloading to {output_path.name}...")
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(resp.content)
    size_kb = len(resp.content) / 1024
    print(f"  Saved: {output_path} ({size_kb:.0f} KB)")


# ── LUT Testing ──────────────────────────────────────────────────────────


def run_lut_test(ref: StyleRef, style_refs_dir: Path) -> dict:
    """
    Run a style reference through all 3 LUT treatments.
    Returns dict with paths to treated images.
    """
    import subprocess

    input_path = style_refs_dir / ref.filename
    if not input_path.exists():
        print(f"  SKIP: {ref.filename} not found (generate first)")
        return {}

    treatments = ["standard", "conflict", "editorial"]
    results = {}

    for treatment in treatments:
        stem = input_path.stem
        output_path = style_refs_dir / f"{stem}_{treatment}.png"
        print(f"  Testing {treatment} LUT on {ref.name}...")

        # Try treat_video.py first (handles video AND stills)
        cmd = [
            sys.executable,
            str(TREAT_VIDEO),
            "--input", str(input_path),
            "--treatment", treatment,
            "--output", str(output_path),
        ]

        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                results[treatment] = str(output_path)
                print(f"    ✓ {output_path.name}")
            else:
                # Fall back to treat.py (image-only treatment)
                cmd_img = [
                    sys.executable,
                    str(TREAT_IMAGE),
                    "--input", str(input_path),
                    "--ramp", treatment,
                    "--output", str(output_path),
                ]
                result2 = subprocess.run(
                    cmd_img, capture_output=True, text=True, timeout=30
                )
                if result2.returncode == 0:
                    results[treatment] = str(output_path)
                    print(f"    ✓ {output_path.name} (via treat.py)")
                else:
                    print(f"    ✗ Failed: {result2.stderr[:200]}")
        except subprocess.TimeoutExpired:
            print(f"    ✗ Timed out")
        except FileNotFoundError:
            print(f"    ✗ Treatment tool not found at {TREAT_VIDEO}")
            break

    return results


# ── CLI ──────────────────────────────────────────────────────────────────


def resolve_ref(ref_arg: str) -> StyleRef:
    """Resolve a reference by number or name."""
    # Try as number
    try:
        num = int(ref_arg)
        if num in REFS_BY_NUMBER:
            return REFS_BY_NUMBER[num]
        print(f"Error: Reference number {num} not found (valid: 1-7)")
        sys.exit(1)
    except ValueError:
        pass

    # Try as name
    if ref_arg in REFS_BY_NAME:
        return REFS_BY_NAME[ref_arg]

    # Try partial match
    matches = [r for r in STYLE_REFS if ref_arg.lower() in r.name.lower()]
    if len(matches) == 1:
        return matches[0]
    elif len(matches) > 1:
        print(f"Ambiguous name '{ref_arg}'. Matches: {', '.join(m.name for m in matches)}")
        sys.exit(1)

    print(f"Error: Reference '{ref_arg}' not found.")
    print("Available: " + ", ".join(f"{r.number}={r.name}" for r in STYLE_REFS))
    sys.exit(1)


def cmd_list(args):
    """List all style references and their generation status."""
    print("\n  Parallax AI Video Style Reference Library")
    print("  " + "=" * 50)
    print(f"  Output directory: {STYLE_REFS_DIR}\n")

    for ref in STYLE_REFS:
        path = STYLE_REFS_DIR / ref.filename
        exists = path.exists()
        status = "✓ generated" if exists else "○ pending"
        size = f" ({path.stat().st_size / 1024:.0f} KB)" if exists else ""
        order_idx = GENERATION_ORDER.index(ref.number) + 1

        print(f"  [{ref.number}] {ref.name}")
        print(f"      {ref.description}")
        print(f"      File: {ref.filename}")
        print(f"      Status: {status}{size}")
        print(f"      Primary LUT: {ref.lut_primary}")
        print(f"      Generation order: {order_idx}/7")

        # Check for treated versions
        treated = []
        for t in ["standard", "conflict", "editorial"]:
            treated_path = STYLE_REFS_DIR / f"{path.stem}_{t}.png"
            if treated_path.exists():
                treated.append(t)
        if treated:
            print(f"      LUT tested: {', '.join(treated)}")
        print()


def cmd_generate(args):
    """Generate one or all style references."""
    api_key = args.api_key or os.environ.get("FAL_KEY")
    if not api_key:
        print("Error: FAL_KEY environment variable or --api-key required.")
        print("Get one at: https://fal.ai/dashboard/keys")
        sys.exit(1)

    if args.all:
        refs = [REFS_BY_NUMBER[n] for n in GENERATION_ORDER]
        print(f"\nGenerating all 7 style references in recommended order...")
        print(f"Estimated cost: ~$0.32 (7 × $0.045)\n")
    else:
        ref = resolve_ref(args.ref)
        refs = [ref]

    for ref in refs:
        output_path = STYLE_REFS_DIR / ref.filename
        prompt = args.prompt if args.prompt else ref.prompt

        if output_path.exists() and not args.force:
            print(f"\n[{ref.number}] {ref.name} — already exists. Use --force to regenerate.")
            continue

        print(f"\n[{ref.number}] {ref.name}")
        print(f"  {ref.description}")
        print(f"  Prompt: {prompt[:100]}...")

        try:
            url = generate_image(prompt, api_key)
            download_image(url, output_path)

            # Auto LUT-test if requested
            if args.lut_test:
                run_lut_test(ref, STYLE_REFS_DIR)

        except Exception as e:
            print(f"  ERROR: {e}")
            if not args.all:
                sys.exit(1)
            print("  Continuing with next reference...")

    print("\nDone!")
    generated = [r for r in STYLE_REFS if (STYLE_REFS_DIR / r.filename).exists()]
    print(f"Library status: {len(generated)}/7 references generated.")


def cmd_lut_test(args):
    """Run LUT tests on generated references."""
    if args.ref:
        ref = resolve_ref(args.ref)
        refs = [ref]
    else:
        refs = STYLE_REFS

    print("\nRunning LUT treatment tests...")
    results = {}

    for ref in refs:
        path = STYLE_REFS_DIR / ref.filename
        if not path.exists():
            print(f"\n[{ref.number}] {ref.name} — not generated yet, skipping")
            continue

        print(f"\n[{ref.number}] {ref.name}")
        ref_results = run_lut_test(ref, STYLE_REFS_DIR)
        results[ref.name] = ref_results

    print("\n\nLUT Test Summary:")
    print("-" * 50)
    for ref in refs:
        path = STYLE_REFS_DIR / ref.filename
        if not path.exists():
            print(f"  [{ref.number}] {ref.name}: NOT GENERATED")
            continue

        r = results.get(ref.name, {})
        statuses = []
        for t in ["standard", "conflict", "editorial"]:
            marker = "★" if t == ref.lut_primary else " "
            status = "✓" if t in r else "✗"
            statuses.append(f"{marker}{t}={status}")
        print(f"  [{ref.number}] {ref.name}: {' | '.join(statuses)}")
    print("\n  ★ = primary treatment for this reference")


def main():
    parser = argparse.ArgumentParser(
        description="Parallax AI Video Style Reference Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="See tools/ai-video/style-references/PROMPTS.md for full details.",
    )
    sub = parser.add_subparsers(dest="command")

    # List
    list_p = sub.add_parser("list", help="List all references and status")
    list_p.set_defaults(func=cmd_list)

    # Generate
    gen_p = sub.add_parser("generate", help="Generate style reference(s)")
    gen_ref = gen_p.add_mutually_exclusive_group(required=True)
    gen_ref.add_argument("--all", action="store_true", help="Generate all 7 references")
    gen_ref.add_argument("--ref", type=str, help="Reference number (1-7) or name")
    gen_p.add_argument("--prompt", type=str, help="Override prompt (for iteration)")
    gen_p.add_argument("--force", action="store_true", help="Regenerate even if exists")
    gen_p.add_argument("--api-key", type=str, help="fal.ai API key (or set FAL_KEY env)")
    gen_p.add_argument("--lut-test", action="store_true", help="Run LUT test after generation")
    gen_p.set_defaults(func=cmd_generate)

    # LUT test
    lut_p = sub.add_parser("lut-test", help="Run LUT treatment tests")
    lut_p.add_argument("--ref", type=str, help="Test specific reference (number or name)")
    lut_p.set_defaults(func=cmd_lut_test)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    args.func(args)


if __name__ == "__main__":
    main()
