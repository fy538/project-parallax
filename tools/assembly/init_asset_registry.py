#!/usr/bin/env python3
"""
init_asset_registry.py — Scaffold asset-registry.json from shot-list.json.

Reads episodes/<slug>/shot-list.json and writes a skeleton
episodes/<slug>/asset-registry.json with one entry per asset and one entry
per morph pair.  Operators fill in segment assignments and update statuses
as production progresses.

Usage:
  python3 tools/assembly/init_asset_registry.py <slug>
  python3 tools/assembly/init_asset_registry.py <slug> --dry-run
  python3 tools/assembly/init_asset_registry.py <slug> --force
"""

import argparse
import json
import sys
from datetime import date
from pathlib import Path

# ── Bootstrap shared path resolution ───────────────────────────────────────

_SHARED = Path(__file__).resolve().parent.parent / "shared"
sys.path.insert(0, str(_SHARED))
from paths import get_episode_dir, get_project_root  # noqa: E402


# ── Motion-type derivation ──────────────────────────────────────────────────

def _derive_motion_type(asset_id: str, asset_type: str, morph_ids: set[str]) -> str:
    """Return the motionType for an asset entry.

    Rules:
    - "ai-generate" → "morph-anchor" if the id appears in any morph pair,
      else "standalone"
    - "archival"    → "still"
    - "footage"     → "footage"
    - "photo"       → "still"         (stock photo, sourced)
    - "video"       → "footage"       (stock video, sourced)
    - anything else → "standalone"    (safe default)
    """
    normalised = (asset_type or "").strip().lower()

    if normalised == "ai-generate":
        return "morph-anchor" if asset_id in morph_ids else "standalone"

    mapping = {
        "archival": "still",
        "footage":  "footage",
        "photo":    "still",
        "video":    "footage",
    }
    return mapping.get(normalised, "standalone")


def _derive_source(asset_type: str) -> str:
    """Map shot-list type → registry source tag."""
    normalised = (asset_type or "").strip().lower()
    if normalised == "ai-generate":
        return "ai-generate"
    if normalised == "archival":
        return "archival"
    # "footage", "video", "photo", or anything else → stock-footage
    return "stock-footage"


def _derive_status(shot_status: str | None) -> str:
    """Map shot-list status → registry status."""
    if shot_status in ("existing", "resolved"):
        return "resolved"
    return "missing"


# ── Core scaffold builder ───────────────────────────────────────────────────

def build_registry(slug: str, shot_list: dict) -> dict:
    """Return the full asset-registry dict ready for serialisation."""

    raw_assets: list[dict] = shot_list.get("assets", [])
    raw_morphs: list[dict] = shot_list.get("morph_pairs", [])

    # Collect the set of asset IDs that appear in any morph pair (from or to).
    morph_ids: set[str] = set()
    for pair in raw_morphs:
        morph_ids.add(pair.get("from", ""))
        morph_ids.add(pair.get("to", ""))

    # ── Scaffold assets ───────────────────────────────────────────────────
    assets: list[dict] = []
    for a in raw_assets:
        asset_id = a.get("id", "")
        asset_type = a.get("type", "")
        shot_status = a.get("status", None)

        # Prefer explicit description; fall back to notes or empty string.
        description = (
            a.get("description")
            or a.get("notes")
            or ""
        )

        motion_type = _derive_motion_type(asset_id, asset_type, morph_ids)
        source = _derive_source(asset_type)
        status = _derive_status(shot_status)

        entry: dict = {
            "id": asset_id,
            "description": description,
            "motionType": motion_type,
            "stillPath": f"episodes/{slug}/assets/stills/{asset_id}.png",
            "videoPath": f"remotion-templates/public/episodes/{slug}/clips/{asset_id}-pika.mp4",
            "segments": [],
            "status": status,
            "source": source,
        }
        assets.append(entry)

    # ── Scaffold morphs ───────────────────────────────────────────────────
    morphs: list[dict] = []
    for n, pair in enumerate(raw_morphs, start=1):
        from_id = pair.get("from", "")
        to_id = pair.get("to", "")
        morph_id = f"morph-{n:02d}"

        entry: dict = {
            "id": morph_id,
            "from": from_id,
            "to": to_id,
            "tool": pair.get("tool", "kling"),
            "duration_sec": pair.get("duration_sec", 6),
            "intent": pair.get("intent", ""),
            "clipPath": (
                f"remotion-templates/public/episodes/{slug}/clips/"
                f"{morph_id}-{from_id}-to-{to_id}.mp4"
            ),
            "status": "missing",
        }
        morphs.append(entry)

    registry: dict = {
        "version": "1.0",
        "slug": slug,
        "generated_at": date.today().isoformat(),
        "generated_from": "shot-list.json",
        "assets": assets,
        "morphs": morphs,
    }
    return registry


# ── Summary helpers ─────────────────────────────────────────────────────────

def _print_summary(registry: dict, out_path: Path, dry_run: bool) -> None:
    assets = registry["assets"]
    morphs = registry["morphs"]
    resolved = sum(1 for a in assets if a["status"] == "resolved")
    missing = len(assets) - resolved
    verb = "Would write" if dry_run else "Scaffolded"
    print(
        f"{verb} {len(assets)} assets "
        f"({resolved} resolved, {missing} missing) "
        f"+ {len(morphs)} morphs → {out_path}"
    )


# ── CLI entry point ─────────────────────────────────────────────────────────

def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Scaffold asset-registry.json for an episode from its shot-list.json."
        )
    )
    parser.add_argument(
        "slug",
        help="Episode slug (e.g. silicon-trap)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print what would be written without writing any files.",
    )
    parser.add_argument(
        "--force",
        action="store_true",
        help="Overwrite an existing asset-registry.json.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv)
    slug = args.slug
    dry_run = args.dry_run
    force = args.force

    # ── Resolve paths ─────────────────────────────────────────────────────
    try:
        episode_dir = get_episode_dir(slug)
    except RuntimeError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2

    if not episode_dir.is_dir():
        print(
            f"error: episode directory not found: {episode_dir}",
            file=sys.stderr,
        )
        return 2

    shot_list_path = episode_dir / "shot-list.json"
    if not shot_list_path.exists():
        print(
            f"error: shot-list.json not found at {shot_list_path}",
            file=sys.stderr,
        )
        return 2

    out_path = episode_dir / "asset-registry.json"
    if out_path.exists() and not force:
        print(
            f"error: {out_path} already exists. Use --force to overwrite.",
            file=sys.stderr,
        )
        return 1

    # ── Load shot-list ────────────────────────────────────────────────────
    try:
        shot_list: dict = json.loads(shot_list_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"error: could not parse {shot_list_path}: {exc}", file=sys.stderr)
        return 2

    # ── Build registry ────────────────────────────────────────────────────
    registry = build_registry(slug, shot_list)

    # ── Output ────────────────────────────────────────────────────────────
    output_json = json.dumps(registry, indent=2, ensure_ascii=False) + "\n"

    if dry_run:
        print(output_json, end="")
        _print_summary(registry, out_path, dry_run=True)
        return 0

    out_path.write_text(output_json, encoding="utf-8")
    _print_summary(registry, out_path, dry_run=False)
    return 0


if __name__ == "__main__":
    sys.exit(main())
