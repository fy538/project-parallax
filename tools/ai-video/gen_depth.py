#!/usr/bin/env python3
"""
gen_depth.py — monocular depth map for a still, via Depth Anything V2.

Produces a grayscale depth map (white = near, black = far) suitable as the
`depthSrc` for the DepthParallax Remotion template. Depth Anything V2 emits
relative inverse-depth (disparity) where brighter = closer, which already
matches the template's convention.

Usage:
  python tools/ai-video/gen_depth.py INPUT.png [-o OUTPUT.png] [--model small|base|large]

Notes:
- Runs on Apple MPS when available, else CPU.
- First run downloads the model (~100MB small / ~390MB base) from HuggingFace.
- Depth estimation works on PHOTOREAL stills (landscapes, rooms, figures). It is
  unreliable on flat/illustrated art (diagrams, equation posters) — see
  project/CHAINED_STILL_LESSONS.md family-E blacklist.
"""
import argparse
import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image, ImageFilter
from transformers import pipeline

MODELS = {
    "small": "depth-anything/Depth-Anything-V2-Small-hf",
    "base": "depth-anything/Depth-Anything-V2-Base-hf",
    "large": "depth-anything/Depth-Anything-V2-Large-hf",
}


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=Path)
    ap.add_argument("-o", "--output", type=Path, default=None)
    ap.add_argument("--model", choices=list(MODELS), default="small")
    ap.add_argument("--blur", type=float, default=1.5,
                    help="Gaussian blur radius on the depth map (smooths displacement; default 1.5)")
    args = ap.parse_args()

    if not args.input.exists():
        print(f"error: {args.input} not found", file=sys.stderr)
        return 1
    out = args.output or args.input.with_name(args.input.stem + "-depth.png")

    device = "mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[gen_depth] model={args.model} device={device}")
    pipe = pipeline("depth-estimation", model=MODELS[args.model], device=device)

    img = Image.open(args.input).convert("RGB")
    result = pipe(img)
    depth = result["depth"]  # PIL grayscale, brighter = nearer (disparity)

    # Normalize to full 0..255 so the displacement uses the whole range.
    arr = np.asarray(depth, dtype=np.float32)
    lo, hi = float(arr.min()), float(arr.max())
    if hi > lo:
        arr = (arr - lo) / (hi - lo) * 255.0
    depth = Image.fromarray(arr.astype(np.uint8), mode="L")

    if args.blur > 0:
        depth = depth.filter(ImageFilter.GaussianBlur(radius=args.blur))

    depth.save(out)
    print(f"[gen_depth] wrote {out}  ({depth.size[0]}x{depth.size[1]})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
