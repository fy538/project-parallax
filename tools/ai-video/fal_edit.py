#!/usr/bin/env python3
"""
Make ONE edited state of a still through fal.ai, registered to the original.

Two steps, kept apart so a mask can be retried without paying for the edit again:

    edit       send the still (or a crop of it) plus an instruction to an image-edit
               model; save what comes back, with a JSON sidecar of what was sent
    composite  paste the edit back onto the original through a feathered box mask,
               so everything outside the box is pixel-identical to the original

That second step is what makes a "state swap" usable: two frames that differ only
where the edit was asked for can be cut or cross-faded with nothing else moving.
See reports/AI stills beyond Ken Burns.md ("State swap") and
analysis/ai-video-landscape-2026-10-10.md (edit the frame, then animate).

No dependencies beyond the standard library and ffmpeg. The key is read from
FAL_KEY in the environment or the repo-root .env and is never printed or saved.

Usage:
    python3 tools/ai-video/fal_edit.py edit <slug> <name> --image still.png \\
        --prompt-file prompt.txt [--crop x,y,w,h] [--send-width 2752] \\
        [--ref other.png] [--aspect 4:1] [--resolution 2K] [--tag take1]
    python3 tools/ai-video/fal_edit.py composite --base still.png --edit edit.png \\
        [--crop x,y,w,h] --box x,y,w,h [--box ...] [--feather 14] --out state.png

Crop and box are in pixels of the base still. Edits land in
`episodes/<slug>/assets/keyframes/<name>-edit-<tag>.png`.
"""
from __future__ import annotations

import argparse
import base64
import json
import subprocess
import sys
import tempfile
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

from fal_i2v import EPISODES_DIR, QUEUE_BASE, REPO_ROOT, call, load_key

MODEL = "fal-ai/nano-banana-2/edit"
# USD per image, fal's model page read Oct 11 2026: $0.08 at 1K, 1.5x at 2K, 2x at 4K.
PRICE = {"1K": 0.08, "2K": 0.12, "4K": 0.16}


def parse_box(text: str) -> tuple[int, int, int, int]:
    parts = [int(p) for p in text.split(",")]
    if len(parts) != 4:
        raise argparse.ArgumentTypeError("expected x,y,w,h")
    return parts[0], parts[1], parts[2], parts[3]


def image_size(path: Path) -> tuple[int, int]:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0",
         "-show_entries", "stream=width,height", "-of", "csv=p=0", str(path)],
        check=True, capture_output=True, text=True,
    ).stdout.strip()
    w, h = out.split(",")
    return int(w), int(h)


def ffmpeg(*args: str) -> None:
    subprocess.run(["ffmpeg", "-v", "error", "-y", *args], check=True)


def cmd_edit(args: argparse.Namespace) -> None:
    key = load_key()
    image = args.image.resolve()
    prompt = args.prompt_file.read_text().strip()
    out_dir = EPISODES_DIR / args.slug / "assets" / "keyframes"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{args.name}-edit-{args.tag}.png"
    if out.exists():
        sys.exit(f"{out.relative_to(REPO_ROOT)} already exists; pick another --tag.")

    # What is sent: the crop (or the whole still), scaled to --send-width, as a
    # near-lossless JPEG so the request stays small.
    filters = []
    if args.crop:
        x, y, w, h = args.crop
        filters.append(f"crop={w}:{h}:{x}:{y}")
    if args.send_width:
        filters.append(f"scale={args.send_width}:-2:flags=lanczos")
    with tempfile.TemporaryDirectory() as tmp:
        sent = Path(tmp) / "sent.jpg"
        ffmpeg("-i", str(image), *(["-vf", ",".join(filters)] if filters else []),
               "-q:v", "1", str(sent))
        sent_size = image_size(sent)
        uris = [f"data:image/jpeg;base64,{base64.b64encode(sent.read_bytes()).decode()}"]
        # Extra reference pictures (a second figure, a style anchor) go whole.
        for n, ref in enumerate(args.ref):
            ref_sent = Path(tmp) / f"ref{n}.jpg"
            ffmpeg("-i", str(ref.resolve()), "-vf", f"scale={args.send_width or 2048}:-2:flags=lanczos",
                   "-q:v", "1", str(ref_sent))
            uris.append(f"data:image/jpeg;base64,{base64.b64encode(ref_sent.read_bytes()).decode()}")

    payload = {
        "prompt": prompt,
        "image_urls": uris,
        "num_images": 1,
        "resolution": args.resolution,
        "output_format": "png",
    }
    if args.aspect:
        payload["aspect_ratio"] = args.aspect
    if args.seed is not None:
        payload["seed"] = args.seed

    cost = PRICE.get(args.resolution)
    print(f"Submitting {image.name} ({sent_size[0]}x{sent_size[1]} sent) → {MODEL} "
          f"({args.resolution}, ~${cost:.2f})")
    started = time.time()
    job = call(f"{QUEUE_BASE}/{MODEL}", key, payload)
    status = job
    while status.get("status") != "COMPLETED":
        time.sleep(3)
        status = call(job["status_url"], key)
        if status.get("status") in ("FAILED", "ERROR"):
            sys.exit(f"Edit failed: {json.dumps(status)[:600]}")
    result = call(job["response_url"], key)
    url = result["images"][0]["url"]
    urllib.request.urlretrieve(url, out)

    sidecar = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": MODEL,
        "request_id": job["request_id"],
        "image": str(image.relative_to(REPO_ROOT)),
        "refs": [str(r.resolve().relative_to(REPO_ROOT)) for r in args.ref],
        "aspect_ratio": args.aspect,
        "crop": list(args.crop) if args.crop else None,
        "sent_size": list(sent_size),
        "returned_size": list(image_size(out)),
        "resolution": args.resolution,
        "seed": args.seed,
        "prompt": prompt,
        "description": result.get("description"),
        "wall_seconds": round(time.time() - started),
        "estimated_cost_usd": cost,
        "image_url": url,
    }
    out.with_suffix(".json").write_text(json.dumps(sidecar, indent=2) + "\n")
    print(f"Saved {out.relative_to(REPO_ROOT)} {sidecar['returned_size']} in {sidecar['wall_seconds']}s")


def cmd_composite(args: argparse.Namespace) -> None:
    base = args.base.resolve()
    width, height = image_size(base)
    cx, cy, cw, ch = args.crop if args.crop else (0, 0, width, height)
    boxes = ",".join(
        f"drawbox=x={x}:y={y}:w={w}:h={h}:color=white:t=fill" for x, y, w, h in args.box
    )
    graph = (
        f"[0:v]format=gbrp[base];"
        f"[1:v]scale={cw}:{ch}:flags=lanczos,pad={width}:{height}:{cx}:{cy},format=gbrp[edit];"
        # Blur in RGB, not gray: gblur on a gray frame clamps white to 235, which
        # leaves an 8% ghost of the original inside every box.
        f"color=black:s={width}x{height},format=gray,{boxes},"
        f"format=gbrp,gblur=sigma={args.feather}[mask];"
        f"[base][edit][mask]maskedmerge[out]"
    )
    args.out.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg("-i", str(base), "-i", str(args.edit.resolve()), "-filter_complex", graph,
           "-map", "[out]", "-frames:v", "1", str(args.out))
    print(f"Saved {args.out} ({width}x{height}); {len(args.box)} box(es), feather {args.feather}px")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    sub = ap.add_subparsers(dest="cmd", required=True)

    e = sub.add_parser("edit")
    e.add_argument("slug")
    e.add_argument("name")
    e.add_argument("--image", required=True, type=Path)
    e.add_argument("--prompt-file", required=True, type=Path)
    e.add_argument("--crop", type=parse_box)
    e.add_argument("--send-width", type=int)
    e.add_argument("--ref", type=Path, action="append", default=[],
                   help="extra reference picture, sent whole after --image (repeatable)")
    e.add_argument("--aspect", help='output aspect ratio, e.g. "4:1"; default follows --image')
    e.add_argument("--resolution", default="2K", choices=sorted(PRICE))
    e.add_argument("--seed", type=int)
    e.add_argument("--tag", default="take1")
    e.set_defaults(fn=cmd_edit)

    c = sub.add_parser("composite")
    c.add_argument("--base", required=True, type=Path)
    c.add_argument("--edit", required=True, type=Path)
    c.add_argument("--crop", type=parse_box)
    c.add_argument("--box", required=True, type=parse_box, action="append")
    c.add_argument("--feather", type=float, default=14)
    c.add_argument("--out", required=True, type=Path)
    c.set_defaults(fn=cmd_composite)

    args = ap.parse_args()
    args.fn(args)


if __name__ == "__main__":
    main()
