#!/usr/bin/env python3
"""List per-episode JSON files not referenced by assembly-manifest (dataFile).

Triage-only: episode JSON can exist for drafts, alternates, or future manifest
wires. This does not scan nested refs inside JSON bodies.

Usage:
  python3 tools/list_orphan_episode_json.py
  python3 tools/list_orphan_episode_json.py --episode silicon-trap
  python3 tools/list_orphan_episode_json.py --json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
EPISODES_DIR = ROOT / "remotion-templates" / "data" / "episodes"


def data_files_from_manifest(manifest: dict[str, Any]) -> set[str]:
    """Return basenames of all template dataFile values."""
    out: set[str] = set()
    for seg in manifest.get("segments") or []:
        t = seg.get("template") or {}
        df = t.get("dataFile")
        if isinstance(df, str) and df.strip():
            out.add(Path(df).name)
    return out


def json_files_in_episode_dir(ep_dir: Path) -> list[str]:
    return [
        p.name
        for p in sorted(ep_dir.glob("*.json"))
        if p.name != "assembly-manifest.json"
    ]


def orphans_for_slug(slug: str) -> tuple[str, list[str]]:
    ep_dir = EPISODES_DIR / slug
    manifest_path = ep_dir / "assembly-manifest.json"
    if not manifest_path.is_file():
        return slug, []
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        print(f"{manifest_path}: invalid JSON ({e})", file=sys.stderr)
        sys.exit(1)
    referenced = data_files_from_manifest(manifest)
    orphans = [n for n in json_files_in_episode_dir(ep_dir) if n not in referenced]
    return slug, sorted(orphans)


def iter_slugs(episode_filter: str | None) -> list[str]:
    if episode_filter:
        d = EPISODES_DIR / episode_filter
        if not d.is_dir():
            print(f"Unknown episode slug: {episode_filter}", file=sys.stderr)
            sys.exit(1)
        return [episode_filter]
    return sorted(
        p.name
        for p in EPISODES_DIR.iterdir()
        if p.is_dir() and (p / "assembly-manifest.json").is_file()
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--episode", metavar="SLUG", help="Only scan this episode slug.")
    parser.add_argument("--json", action="store_true", help="Emit JSON to stdout.")
    args = parser.parse_args()

    if not EPISODES_DIR.is_dir():
        print(f"Episodes directory not found: {EPISODES_DIR}", file=sys.stderr)
        sys.exit(1)

    results: dict[str, list[str]] = {}
    for slug in iter_slugs(args.episode):
        s, o = orphans_for_slug(slug)
        if o:
            results[s] = o

    if args.json:
        print(json.dumps(results, indent=2, sort_keys=True))
        return

    if not results:
        print(
            "No orphan episode JSON files (all *.json referenced as "
            "template dataFile or no extras)."
        )
        return

    for slug in sorted(results.keys()):
        print(f"=== {slug} ({len(results[slug])} orphan(s)) ===")
        for name in results[slug]:
            print(f"  {name}")
        print()


if __name__ == "__main__":
    main()
