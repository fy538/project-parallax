#!/usr/bin/env python3
"""
fill_manifest_holds.py — Post-processing step: insert HOLD segments to fill
all inter-segment gaps on each layer of an assembly manifest.

Why this exists:
  generate_manifest.py assigns segment windows based on narration word timing.
  Between segments, both layers can be dark for 10-80+ seconds — blank paper
  in the rendered video. HOLD segments instruct FullEpisode to extend the
  preceding segment's endSec, sustaining the last frame of footage or the
  completed animation state of a template.

  This is a separate step (not baked into generate_manifest.py) so it can be
  re-run safely after manually editing the manifest (e.g. after wiring new
  footage clips or adding TRANSITION segments).

Usage:
  python tools/assembly/fill_manifest_holds.py --episode prisoners-dilemma
  python tools/assembly/fill_manifest_holds.py --episode silicon-trap --min-gap 2.0
  python tools/assembly/fill_manifest_holds.py --episode prisoners-dilemma --dry-run

Options:
  --episode SLUG    Episode slug (required)
  --min-gap FLOAT   Minimum gap (seconds) to fill with a HOLD (default: 1.0)
  --dry-run         Show what would change without writing

How FullEpisode consumes HOLDs:
  FullEpisode.tsx mergeHolds() walks each layer sorted by startSec.
  When it encounters a HOLD segment, it extends the *preceding* non-HOLD
  segment's endSec to cover the HOLD window — then drops the HOLD from the
  render list. Effect: the previous visual sustains (footage freezes on last
  frame; template holds at its completed animation state).

Re-run safety:
  The script tracks generated HOLD ids as "{prev_id}-hold". If a HOLD with
  that id already exists, it's skipped (idempotent). Manually added segments
  between two existing segments will cause new HOLDs to be generated on the
  next run.
"""

import argparse
import json
import os
import sys
import tempfile
from collections import defaultdict
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
REMOTION = REPO_ROOT / "remotion-templates"


def manifest_path(slug: str) -> Path:
    return REMOTION / "data/episodes" / slug / "assembly-manifest.json"


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--episode", required=True, help="Episode slug")
    parser.add_argument(
        "--min-gap",
        type=float,
        default=1.0,
        metavar="SECONDS",
        help="Minimum gap to fill with a HOLD (default: 1.0)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing")
    args = parser.parse_args()

    slug = args.episode
    mpath = manifest_path(slug)

    if not mpath.exists():
        print(f"ERROR: manifest not found: {mpath}", file=sys.stderr)
        sys.exit(1)

    with open(mpath, encoding="utf-8") as f:
        m = json.load(f)

    existing_ids = {seg["id"] for seg in m["segments"]}

    # Build a set of (layer, startSec, endSec) for existing HOLDs so we can
    # detect if a newly generated HOLD would overlap a pre-existing one.
    existing_hold_spans: list[tuple[str, float, float]] = [
        (seg.get("layer", "background"), seg["startSec"], seg["endSec"])
        for seg in m["segments"]
        if seg.get("type") == "HOLD"
    ]

    # Group by layer — exclude existing HOLDs from the gap-finding pass
    by_layer: dict[str, list] = defaultdict(list)
    for seg in m["segments"]:
        if seg.get("type") == "HOLD":
            continue  # Don't process existing HOLDs as "previous" segments
        layer = seg.get("layer", "background")
        by_layer[layer].append(seg)

    for layer in by_layer:
        by_layer[layer].sort(key=lambda s: s["startSec"])

    new_holds = []
    for layer, segs in by_layer.items():
        for i in range(1, len(segs)):
            prev = segs[i - 1]
            curr = segs[i]
            gap = curr["startSec"] - prev["endSec"]
            if gap <= args.min_gap:
                continue

            hold_id = f"{prev['id']}-hold"
            if hold_id in existing_ids:
                # Already present (idempotent)
                continue

            # Skip if a pre-existing HOLD on this layer overlaps the proposed range.
            # This prevents generating a HOLD that would swallow a manually placed
            # shorter HOLD (e.g. existing 500.4-502.4 inside proposed 480.4-502.4).
            proposed_start = prev["endSec"]
            proposed_end = curr["startSec"]
            overlap = any(
                hl == layer
                and hs < proposed_end
                and he > proposed_start
                for hl, hs, he in existing_hold_spans
            )
            if overlap:
                continue

            new_holds.append({
                "id": hold_id,
                "type": "HOLD",
                "startSec": round(prev["endSec"], 3),
                "endSec": round(curr["startSec"], 3),
                "layer": layer,
                "beat": prev.get("beat", ""),
                "priority": "P3",
            })

    if not new_holds:
        print(f"✅ No gaps > {args.min_gap}s found in [{slug}] — manifest already complete.")
        return

    print(f"\n📋 Episode: {slug}")
    print(f"   Would insert {len(new_holds)} HOLD segment(s) (min-gap={args.min_gap}s):\n")

    by_size = sorted(new_holds, key=lambda h: h["endSec"] - h["startSec"], reverse=True)
    for h in by_size[:15]:
        gap = h["endSec"] - h["startSec"]
        print(f"   [{h['layer']:12s}] {gap:5.1f}s — {h['id']}")
    if len(by_size) > 15:
        print(f"   ... and {len(by_size) - 15} more\n")

    if args.dry_run:
        print("\n[dry-run] No changes written.")
        return

    m["segments"].extend(new_holds)
    m["segments"].sort(key=lambda s: (s["startSec"], s.get("layer", "background")))

    # Atomic write: dump to a sibling temp file, then os.replace() into place.
    # Prevents a corrupted manifest if the process is interrupted mid-write.
    tmp_fd, tmp_path = tempfile.mkstemp(dir=mpath.parent, suffix=".tmp.json")
    try:
        with os.fdopen(tmp_fd, "w", encoding="utf-8") as f:
            json.dump(m, f, indent=2)
            f.write("\n")
        os.replace(tmp_path, mpath)
    except Exception:
        os.unlink(tmp_path)
        raise

    total = len(m["segments"])
    print(f"\n✅ Wrote {mpath.relative_to(REPO_ROOT)}")
    print(f"   Inserted {len(new_holds)} HOLDs  |  Total segments: {total}\n")


if __name__ == "__main__":
    main()
