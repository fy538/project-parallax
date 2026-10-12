#!/usr/bin/env python3
"""
Render Ken Burns (camera-move-on-single-still) clips from an episode's shot-list.json.

Per the three-tool motion model (project/CHAINED_STILL_LESSONS.md), a *reframe*
(camera move, scene unchanged) is rendered deterministically as a push/pan on ONE
still — never as a morph. This reads every asset whose `motion_technique` is
"ken-burns", finds its still on disk, and renders an ffmpeg `zoompan` clip using
the asset's `ken_burns` params (start_scale, end_scale, focus_x, focus_y, duration_sec).

The image is pre-scaled large before zoompan so the motion is sub-pixel smooth
(zoompan jitters on small canvases). Output is 1920x1080 @ 30fps, yuv420p.

Usage:
    python3 tools/ai-video/render_kenburns.py <episode-slug> [--only id1,id2] [--fps 30]

Stills are matched by id prefix: `stills/<id>-*.png` (the trailing dash keeps
`aigen-04` from matching `aigen-04a-*`). Clips land in `assets/clips-kenburns/<id>.mp4`.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
EPISODES_DIR = REPO_ROOT / "episodes"

PRESCALE_W = 5016  # ~2.6x of 1920; enough headroom for smooth zoompan


def _match_in(d: Path, asset_id: str) -> Path | None:
    if not d.is_dir():
        return None
    exact = d / f"{asset_id}.png"
    if exact.is_file():
        return exact
    hits = sorted(p for p in d.glob(f"{asset_id}-*.png") if "copy" not in p.name.lower())
    return hits[0] if hits else None


def find_still(stills_dir: Path, asset_id: str) -> Path | None:
    # Prefer the upscaled 4K source (stills-4k/) so Ken Burns pushes stay sharp;
    # fall back to the base still. The dash in "<id>-*" disambiguates 04 vs 04a.
    upscaled = _match_in(stills_dir.parent / "stills-4k", asset_id)
    return upscaled or _match_in(stills_dir, asset_id)


def render_clip(still: Path, out: Path, kb: dict, fps: int) -> None:
    start = float(kb.get("start_scale", 1.0))
    end = float(kb.get("end_scale", 1.18))
    fx = float(kb.get("focus_x", 0.5))
    fy = float(kb.get("focus_y", 0.5))
    dur = float(kb.get("duration_sec", 4))
    nframes = max(2, round(dur * fps))

    # Linear zoom across output frames via 'on' (0..nframes-1).
    z_expr = f"'{start}+({end}-{start})*on/{nframes - 1}'"
    x_expr = f"'{fx}*(iw-iw/zoom)'"
    y_expr = f"'{fy}*(ih-ih/zoom)'"
    vf = (
        f"scale={PRESCALE_W}:-2,"
        f"zoompan=z={z_expr}:d={nframes}:x={x_expr}:y={y_expr}:"
        f"s=1920x1080:fps={fps},format=yuv420p"
    )
    cmd = [
        "ffmpeg", "-y", "-loop", "1", "-i", str(still),
        "-filter_complex", vf, "-t", f"{dur}", "-r", str(fps), str(out),
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--only", help="comma-separated asset ids to render")
    ap.add_argument("--fps", type=int, default=30)
    args = ap.parse_args()

    ep = EPISODES_DIR / args.slug
    shot_list = ep / "shot-list.json"
    stills_dir = ep / "assets" / "stills"
    out_dir = ep / "assets" / "clips-kenburns"
    if not shot_list.is_file():
        print(f"missing {shot_list}", file=sys.stderr)
        return 2
    out_dir.mkdir(parents=True, exist_ok=True)

    data = json.loads(shot_list.read_text())
    only = set(args.only.split(",")) if args.only else None

    rendered, skipped = [], []
    for asset in data.get("assets", []):
        if asset.get("motion_technique") != "ken-burns":
            continue
        aid = asset["id"]
        if only and aid not in only:
            continue
        kb = asset.get("ken_burns")
        if not kb:
            skipped.append((aid, "no ken_burns params"))
            continue
        still = find_still(stills_dir, aid)
        if not still:
            skipped.append((aid, "still not on disk"))
            continue
        out = out_dir / f"{aid}.mp4"
        try:
            render_clip(still, out, kb, args.fps)
            rendered.append((aid, still.name, out.name))
        except subprocess.CalledProcessError as e:
            skipped.append((aid, f"ffmpeg failed: {e.stderr.decode()[-200:]}"))

    print(f"\nRendered {len(rendered)} Ken Burns clip(s) -> {out_dir.relative_to(REPO_ROOT)}/")
    for aid, src, dst in rendered:
        print(f"  ✓ {aid:24s} {src}  ->  {dst}")
    if skipped:
        print(f"\nSkipped {len(skipped)} (still pending generation or no params):")
        for aid, why in skipped:
            print(f"  – {aid:24s} {why}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
