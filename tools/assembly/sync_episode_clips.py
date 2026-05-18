#!/usr/bin/env python3
"""
sync_episode_clips.py — Auto-wire footage clips to assembly manifest segments.

Scans public/episodes/{slug}/clips/ for .mp4 files, matches them to manifest
segments by shotListId, and updates the manifest asset fields in place.

Matching strategy (in order):
  1. Exact shotListId match: segment.asset.shotListId == "aigen-06" matches
     any file whose name starts with "aigen-06" (e.g. aigen-06-grid-landscape.mp4)
  2. Filename prefix: if a file is named "aigen-06-*.mp4", try to match any
     segment whose shotListId starts with "aigen-06"
  3. Manual override: pass --wire "segmentId=filename.mp4" to force a specific
     match regardless of shotListId

Segments already marked status=resolved are skipped unless --force is passed.

Usage:
  python tools/assembly/sync_episode_clips.py --episode prisoners-dilemma
  python tools/assembly/sync_episode_clips.py --episode silicon-trap --dry-run
  python tools/assembly/sync_episode_clips.py --episode prisoners-dilemma \\
    --wire "beat1-seg07=aigen-18-campus-walk.mp4"

Options:
  --episode SLUG   Episode slug (required)
  --dry-run        Show what would change without writing
  --force          Re-wire segments already marked resolved
  --wire ID=FILE   Override: manually assign a file to a segment ID
"""

import argparse
import json
import os
import re
import sys
import tempfile
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────

REPO_ROOT = Path(__file__).resolve().parents[2]
REMOTION = REPO_ROOT / "remotion-templates"


def manifest_path(slug: str) -> Path:
    return REMOTION / "data/episodes" / slug / "assembly-manifest.json"


def clips_dir(slug: str) -> Path:
    return REMOTION / "public/episodes" / slug / "clips"


# ── Matching ─────────────────────────────────────────────────────────────────

def shot_id_prefix(filename: str) -> str | None:
    """Extract 'aigen-06' from 'aigen-06-grid-landscape.mp4'."""
    m = re.match(r"^([a-z]+-\d+)", filename)
    return m.group(1) if m else None


def find_match(seg: dict, clip_files: list[str]) -> str | None:
    """Return the best matching filename for a segment, or None."""
    shot_id = (seg.get("asset") or {}).get("shotListId", "")
    if not shot_id:
        return None
    # Match any file whose name starts with the shotListId
    prefix = shot_id.rstrip("-").lower()
    for f in clip_files:
        if f.lower().startswith(prefix):
            return f
    return None


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--episode", required=True, help="Episode slug")
    parser.add_argument("--dry-run", action="store_true", help="Preview only")
    parser.add_argument("--force", action="store_true",
                        help="Re-wire already-resolved segments")
    parser.add_argument("--wire", action="append", default=[],
                        metavar="ID=FILE", help="Manual override (repeatable)")
    args = parser.parse_args()

    slug = args.episode
    mpath = manifest_path(slug)
    cdir = clips_dir(slug)

    if not mpath.exists():
        print(f"ERROR: manifest not found: {mpath}", file=sys.stderr)
        sys.exit(1)

    with open(mpath, encoding="utf-8") as f:
        m = json.load(f)

    # Clips available on disk
    if cdir.exists():
        clip_files = sorted(
            f for f in os.listdir(cdir)
            if f.endswith((".mp4", ".mov", ".webm"))
        )
    else:
        clip_files = []

    print(f"\n📁 Episode: {slug}")
    print(f"   Clips on disk: {len(clip_files)}")
    print(f"   Manifest segments: {len(m['segments'])}\n")

    # Parse --wire overrides
    manual_overrides: dict[str, str] = {}
    for spec in args.wire:
        if "=" not in spec:
            print(f"WARNING: --wire '{spec}' is malformed (expected ID=FILE)", file=sys.stderr)
            continue
        seg_id, filename = spec.split("=", 1)
        manual_overrides[seg_id.strip()] = filename.strip()

    # Sweep segments
    wired = 0
    skipped_resolved = 0
    no_match = 0
    updates: list[tuple[dict, str]] = []  # (segment, filename)

    for seg in m["segments"]:
        if seg.get("type") not in ("FOOTAGE", "IMAGE"):
            continue

        asset = seg.setdefault("asset", {})
        is_resolved = asset.get("status") == "resolved" and asset.get("file")

        # Manual override takes priority
        if seg["id"] in manual_overrides:
            filename = manual_overrides[seg["id"]]
            if is_resolved and not args.force:
                print(f"  ⏭  {seg['id']}: already resolved, skipping manual override "
                      f"(--force to apply)")
                skipped_resolved += 1
                continue
            updates.append((seg, filename))
            continue

        # Already resolved — skip unless forced
        if is_resolved and not args.force:
            skipped_resolved += 1
            continue

        # Auto-match by shotListId
        match = find_match(seg, clip_files)
        if match:
            updates.append((seg, match))
        else:
            shot_id = asset.get("shotListId", "—")
            src = asset.get("source", "—")
            if not is_resolved:
                no_match += 1
                status_str = "no shotListId match" if shot_id == "—" else f"no file for shotListId={shot_id}"
                print(f"  ❓ {seg['id']} ({seg['startSec']:.1f}s): {status_str} | source={src}")

    # Report proposed changes
    print()
    if updates:
        print(f"  Wiring {len(updates)} segment(s):\n")
        for seg, filename in updates:
            clip_path = cdir / filename
            exists = clip_path.exists()
            tag = "✅" if exists else "⚠ FILE NOT FOUND —"
            print(f"  {tag} {seg['id']} → clips/{filename}")
    else:
        print("  No new clips to wire.")

    if skipped_resolved > 0:
        print(f"\n  (Skipped {skipped_resolved} already-resolved segment(s) — "
              f"pass --force to re-wire)")
    if no_match > 0:
        print(f"  ({no_match} pending segment(s) still have no match — "
              f"source clips or use --wire to assign manually)")

    if args.dry_run:
        print("\n  [dry-run] No changes written.")
        return

    if not updates:
        return

    # Apply updates
    for seg, filename in updates:
        clip_path = cdir / filename
        asset = seg["asset"]
        asset["file"] = f"clips/{filename}"
        asset["status"] = "resolved" if clip_path.exists() else "pending"
        # Infer source from filename prefix
        if filename.startswith("aigen-"):
            asset["source"] = "local-aigen"
        elif not asset.get("source"):
            asset["source"] = "local"
        wired += 1

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

    print(f"\n  ✅ Wrote {mpath.relative_to(REPO_ROOT)}")
    print(f"     Wired: {wired}  |  Still pending: {no_match}\n")


if __name__ == "__main__":
    main()
