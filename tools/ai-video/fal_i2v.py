#!/usr/bin/env python3
"""
Generate ONE image-to-video clip through fal.ai's queue API.

A deliberately small tool: one still (plus an optional end frame) and one prompt
in, one mp4 out, with a JSON sidecar recording exactly what was sent, what the
model's prompt expander turned it into, and what it cost. No dependencies beyond
the standard library — the still is sent inline as a data URI, so there is no
upload step.

The key is read from FAL_KEY in the environment or the repo-root .env (gitignored)
and is never printed or written to the sidecar.

Usage:
    python3 tools/ai-video/fal_i2v.py <episode-slug> <still-id> \\
        --prompt-file path/to/prompt.txt [--image path.png] [--end-image path.png] \\
        [--model minimax/h3-max/image-to-video] [--duration 5] \\
        [--resolution 1080P] [--expansion balanced] [--tag take1]

Clips land in `episodes/<slug>/assets/clips-i2v/<still-id>-<tag>.mp4` (gitignored).
Prompting rules for flat constructivist stills: project/CHAINED_STILL_LESSONS.md.
"""
from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
EPISODES_DIR = REPO_ROOT / "episodes"
QUEUE_BASE = "https://queue.fal.run"

# USD per second by (model, resolution). fal's live model pages, read Oct 10 2026;
# H3 Max is 40% off until Oct 15 2026 (then 0.05 / 0.08 / 0.16).
PRICE_PER_SEC = {
    ("minimax/h3-max/image-to-video", "480P"): 0.03,
    ("minimax/h3-max/image-to-video", "768P"): 0.048,
    ("minimax/h3-max/image-to-video", "1080P"): 0.096,
    ("minimax/h3/image-to-video", "480P"): 0.05,
    ("minimax/h3/image-to-video", "768P"): 0.06,
    ("minimax/h3/image-to-video", "2K"): 0.13,
    ("minimax/h3/image-to-video", "4K"): 0.16,
}


def load_key() -> str:
    key = os.environ.get("FAL_KEY", "").strip()
    env_file = REPO_ROOT / ".env"
    if not key and env_file.exists():
        for line in env_file.read_text().splitlines():
            if line.startswith("FAL_KEY="):
                key = line.split("=", 1)[1].strip().strip("'\"")
    if not key:
        sys.exit("FAL_KEY not set (environment or repo-root .env).")
    return key


def data_uri(path: Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "image/png"
    return f"data:{mime};base64,{base64.b64encode(path.read_bytes()).decode()}"


def call(url: str, key: str, payload: dict | None = None) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode() if payload is not None else None,
        headers={"Authorization": f"Key {key}", "Content-Type": "application/json"},
        method="POST" if payload is not None else "GET",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        sys.exit(f"fal API error {e.code}: {e.read().decode()[:600]}")


def find_still(slug: str, still_id: str) -> Path:
    stills = sorted((EPISODES_DIR / slug / "assets" / "stills").glob(f"{still_id}-*.png"))
    if not stills:
        sys.exit(f"No still matching {still_id}-*.png in episodes/{slug}/assets/stills/")
    return stills[0]


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("slug")
    ap.add_argument("still_id")
    ap.add_argument("--prompt-file", required=True, type=Path)
    ap.add_argument("--image", type=Path, help="start frame; default is stills/<still-id>-*.png")
    ap.add_argument("--end-image", type=Path)
    ap.add_argument("--model", default="minimax/h3-max/image-to-video")
    ap.add_argument("--duration", type=float, default=5)
    ap.add_argument("--resolution", default="1080P")
    ap.add_argument("--expansion", default="balanced", help="disabled | balanced | quality")
    ap.add_argument("--seed", type=int)
    ap.add_argument("--tag", default="take1")
    args = ap.parse_args()

    key = load_key()
    still = args.image.resolve() if args.image else find_still(args.slug, args.still_id)
    prompt = args.prompt_file.read_text().strip()
    out_dir = EPISODES_DIR / args.slug / "assets" / "clips-i2v"
    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / f"{args.still_id}-{args.tag}.mp4"
    if out.exists():
        sys.exit(f"{out.relative_to(REPO_ROOT)} already exists; pick another --tag.")

    payload = {
        "prompt": prompt,
        "prompt_expansion_mode": args.expansion,
        "duration": args.duration,
        "resolution": args.resolution,
        "image_url": data_uri(still),
    }
    if args.end_image:
        payload["end_image_url"] = data_uri(args.end_image)
    if args.seed is not None:
        payload["seed"] = args.seed

    rate = PRICE_PER_SEC.get((args.model, args.resolution))
    est = f"~${rate * args.duration:.2f}" if rate else "price unknown"
    print(f"Submitting {still.name} → {args.model} ({args.duration}s, {args.resolution}, {est})")

    started = time.time()
    job = call(f"{QUEUE_BASE}/{args.model}", key, payload)
    request_id = job["request_id"]
    print(f"request {request_id}")
    status = job
    while status.get("status") != "COMPLETED":
        time.sleep(5)
        status = call(job["status_url"], key)
        if status.get("status") in ("FAILED", "ERROR"):
            sys.exit(f"Generation failed: {json.dumps(status)[:600]}")
    result = call(job["response_url"], key)

    video_url = result["video"]["url"]
    urllib.request.urlretrieve(video_url, out)

    sidecar = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "model": args.model,
        "request_id": request_id,
        "still": str(still.relative_to(REPO_ROOT)),
        "end_image": str(args.end_image) if args.end_image else None,
        "duration_requested": args.duration,
        "resolution": args.resolution,
        "prompt_expansion_mode": args.expansion,
        "seed": args.seed,
        "prompt": prompt,
        "expanded_prompt": result.get("expanded_prompt"),
        "timings": result.get("timings"),
        "wall_seconds": round(time.time() - started),
        "price_per_second_usd": rate,
        "estimated_cost_usd": round(rate * args.duration, 3) if rate else None,
        "video_url": video_url,
    }
    out.with_suffix(".json").write_text(json.dumps(sidecar, indent=2) + "\n")
    print(f"Saved {out.relative_to(REPO_ROOT)} ({out.stat().st_size / 1e6:.1f} MB) in {sidecar['wall_seconds']}s")


if __name__ == "__main__":
    main()
