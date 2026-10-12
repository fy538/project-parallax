#!/usr/bin/env python3
"""
Real-ESRGAN super-resolution for Parallax stills (Apple-Silicon / MPS).

WHY: Ken Burns and manual 2.5D clips are rendered LOCALLY by cropping into a
still and scaling the crop up to fill the frame. A push to zoom Z needs a source
at least `output_width * Z` wide to stay sharp. Our ChatGPT stills are ~1672px —
narrower than a 1920 frame — so every push starts soft. AI super-resolution
enlarges the still (adding real detail) so local camera moves stay crisp.

This is ONLY useful for locally-rendered families (ken-burns, parallax-2.5d).
AI-video families (live-still, cinemagraph, morph) are capped at 1080p by the
generator, so upscaling their source buys nothing — don't bother.

Flat constructivist art is the EASY case for super-resolution (clean edges,
flat color), the mirror image of depth estimation which fails on flat art.

Models (download once to ~/.cache/realesrgan/):
  x4plus       general — preserves paper grain / editorial texture (default)
  anime        RealESRGAN_x4plus_anime_6B — cleaner edges, flattens grain

Usage:
  python3 tools/ai-video/upscale.py <input.png|dir> --out <dir> [--model x4plus|anime] [--scale 4]
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import torch
from PIL import Image
from spandrel import ModelLoader

WEIGHTS = {
    "x4plus": Path.home() / ".cache/realesrgan/RealESRGAN_x4plus.pth",
    "anime": Path.home() / ".cache/realesrgan/RealESRGAN_x4plus_anime_6B.pth",
}
TILE = 512          # process in tiles to bound memory
TILE_PAD = 32       # overlap to avoid seams


def pick_device() -> str:
    if torch.backends.mps.is_available():
        return "mps"
    if torch.cuda.is_available():
        return "cuda"
    return "cpu"


def load_model(model_key: str, device: str):
    path = WEIGHTS[model_key]
    if not path.is_file():
        sys.exit(f"missing weights: {path}\n  download from the Real-ESRGAN GitHub releases.")
    model = ModelLoader().load_from_file(str(path))
    model.to(device).eval()
    return model


def to_tensor(img: Image.Image, device: str) -> torch.Tensor:
    import numpy as np
    arr = np.asarray(img.convert("RGB"), dtype="float32") / 255.0
    return torch.from_numpy(arr).permute(2, 0, 1).unsqueeze(0).to(device)


def to_image(t: torch.Tensor) -> Image.Image:
    import numpy as np
    arr = t.squeeze(0).clamp(0, 1).permute(1, 2, 0).cpu().numpy()
    return Image.fromarray((arr * 255.0).round().astype("uint8"))


@torch.inference_mode()
def upscale_tiled(model, inp: torch.Tensor, scale: int, device: str) -> torch.Tensor:
    _, _, h, w = inp.shape
    out = torch.zeros((1, 3, h * scale, w * scale), device=device)
    for y in range(0, h, TILE):
        for x in range(0, w, TILE):
            y0, x0 = max(0, y - TILE_PAD), max(0, x - TILE_PAD)
            y1, x1 = min(h, y + TILE + TILE_PAD), min(w, x + TILE + TILE_PAD)
            tile = model(inp[:, :, y0:y1, x0:x1])
            # crop the padded region back out, in output coords
            ty0, tx0 = (y - y0) * scale, (x - x0) * scale
            ty1 = ty0 + (min(h, y + TILE) - y) * scale
            tx1 = tx0 + (min(w, x + TILE) - x) * scale
            out[:, :, y * scale:min(h, y + TILE) * scale, x * scale:min(w, x + TILE) * scale] = \
                tile[:, :, ty0:ty1, tx0:tx1]
    return out


def upscale_file(model, src: Path, dst: Path, scale: int, device: str) -> tuple[int, int]:
    img = Image.open(src)
    w0, h0 = img.size
    out = upscale_tiled(model, to_tensor(img, device), scale, device)
    to_image(out).save(dst)
    return w0, out.shape[3]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", help="image file or directory of PNGs")
    ap.add_argument("--out", required=True, help="output directory")
    ap.add_argument("--model", choices=list(WEIGHTS), default="x4plus")
    ap.add_argument("--scale", type=int, default=4, help="model native scale (x4plus=4)")
    ap.add_argument("--glob", default="*.png", help="glob when input is a directory")
    args = ap.parse_args()

    device = pick_device()
    print(f"device={device}  model={args.model}")
    model = load_model(args.model, device)

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    inp = Path(args.input)
    files = sorted(inp.glob(args.glob)) if inp.is_dir() else [inp]
    files = [f for f in files if "copy" not in f.name.lower()]
    if not files:
        sys.exit(f"no inputs matched {args.input}")

    for f in files:
        dst = out_dir / f.name
        w0, w1 = upscale_file(model, f, dst, args.scale, device)
        print(f"  ✓ {f.name}: {w0}px -> {w1}px")
    print(f"\nupscaled {len(files)} file(s) -> {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
