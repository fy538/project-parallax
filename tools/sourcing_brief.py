#!/usr/bin/env python3
"""
sourcing_brief.py — generate an asset-sourcing brief from manifest + shot list.

Reads an episode's `assembly-manifest.json` plus its `shot-list.json` and
produces a per-asset sourcing brief grouped by beat. Each entry has:
  - shot-list ID, priority, medium (photo/video), source platform
  - All search terms with PRE-BUILT search URLs for the target platform
  - Per-asset treatment + editorial notes from the shot list
  - Status badge (pending / sourced / failed)
  - The segment IDs that use this asset (one shot can appear in multiple segments)

The brief is what an asset sourcer (human or skill) uses to actually go
find footage on Pexels / Pixabay / Wikimedia / archive.org. Re-running the
tool after updating `asset.file` / `asset.status` in the manifest produces
a fresh brief showing only what's still pending.

Failure mode this addresses: 21 silicon-trap FOOTAGE slots sit in `pending`
state. Today there's no single place to see "here are all the queries to
run, ranked by priority, grouped by beat." preflight.py reports the gap;
this tool tells you what to do about it.

Out of scope (handled elsewhere):
  - Asset existence verification → preflight.py
  - Shot-list vs manifest drift → check_script_manifest.py
  - Cost estimation, API key handling → tools/asset-source/source.py

Usage:
    python3 tools/sourcing_brief.py silicon-trap                  # markdown to stdout
    python3 tools/sourcing_brief.py silicon-trap --format csv     # CSV
    python3 tools/sourcing_brief.py silicon-trap --pending-only   # filter status
    python3 tools/sourcing_brief.py silicon-trap --priority P1    # filter by priority
    python3 tools/sourcing_brief.py silicon-trap --source pexels  # filter by platform
    python3 tools/sourcing_brief.py silicon-trap --output brief.md
    python3 tools/sourcing_brief.py --list                        # known episodes

Exit codes:
    0 — brief generated
    2 — usage error / missing episode / missing manifest
"""

from __future__ import annotations

import argparse
import csv
import datetime as dt
import io
import json
import sys
import urllib.parse
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
EPISODES_ROOT = REPO_ROOT / "episodes"
MANIFEST_ROOT = REPO_ROOT / "remotion-templates" / "data" / "episodes"


# ─── Source platform → search URL builder ──────────────────────────────────
#
# Each platform has a different URL shape. When we add a new source platform,
# add it here. Unknown platforms fall through to a "no URL" placeholder so
# the brief still shows the search terms as plain text.

PLATFORM_URL_BUILDERS: dict[str, callable] = {  # type: ignore[type-arg]
    "pexels": lambda q: f"https://www.pexels.com/search/videos/{urllib.parse.quote_plus(q)}/",
    "pixabay": lambda q: f"https://pixabay.com/videos/search/{urllib.parse.quote_plus(q)}/",
    "unsplash": lambda q: f"https://unsplash.com/s/photos/{urllib.parse.quote_plus(q)}",
    "wikimedia": lambda q: f"https://commons.wikimedia.org/w/index.php?search={urllib.parse.quote_plus(q)}&srnamespace=6",
    "archive": lambda q: f"https://archive.org/search?query={urllib.parse.quote_plus(q)}",
    "openverse": lambda q: f"https://openverse.org/search/?q={urllib.parse.quote_plus(q)}",
}


def build_search_url(platform: str | None, query: str) -> str | None:
    """Return a platform-specific search URL for `query`, or None for unknown
    platforms (caller renders plain text). `local-aigen` and similar
    already-sourced platforms return None — there's no external site to link to."""
    if not platform:
        return None
    builder = PLATFORM_URL_BUILDERS.get(platform.lower())
    return builder(query) if builder else None


# ─── Data shapes ────────────────────────────────────────────────────────────


@dataclass
class AssetEntry:
    """One asset to source, joined from manifest + shot-list."""
    shot_list_id: str
    priority: str            # "P1" / "P2" / "P3" / "?"
    medium: str              # "photo" / "video" / "?" (from shot-list `type`)
    segment_type: str        # "FOOTAGE" / "AI_GEN" / "ILLUST" / "?"
    source: str              # "pexels" / "wikimedia" / "local-aigen" / "?"
    status: str              # "pending" / "resolved" / "failed"
    search_terms: list[str]
    treatment: str           # "standard" / "conflict" / etc.
    notes: str
    duration_sec: float
    segment_ids: list[str]   # all segments using this shot
    beat: str                # "beat1" / "beat2" / ... / "unknown"
    file: str | None         # resolved filename when sourced
    in_shot_list: bool       # False if manifest references a shot-id not in shot-list.json


@dataclass
class Brief:
    episode: str
    generated_at: str
    manifest_path: Path
    shot_list_path: Path | None
    assets: list[AssetEntry] = field(default_factory=list)

    @property
    def total(self) -> int:
        return len(self.assets)

    @property
    def by_status(self) -> dict[str, int]:
        counts: dict[str, int] = {}
        for a in self.assets:
            counts[a.status] = counts.get(a.status, 0) + 1
        return counts

    @property
    def by_segment_type(self) -> dict[str, int]:
        counts: dict[str, int] = {}
        for a in self.assets:
            counts[a.segment_type] = counts.get(a.segment_type, 0) + 1
        return counts


# ─── Brief generation ──────────────────────────────────────────────────────


def normalise_status(raw: str | None) -> str:
    """Manifest `asset.status` is sometimes null, sometimes "pending" —
    treat both as the same effective state. We also accept "resolved" /
    "failed" / "sourced" with light normalization."""
    if raw is None or raw == "":
        return "pending"
    lo = raw.lower()
    if lo in {"pending", "resolved", "failed"}:
        return lo
    if lo == "sourced":
        return "resolved"  # legacy synonym
    return lo


def beat_id_for_segment(seg: dict) -> str:
    """Best-effort beat extraction. Manifests put `beat` on each segment
    when known; otherwise fall back to parsing the segment id prefix
    ('beat1-seg01' → 'beat1'). Returns 'unknown' if neither works."""
    explicit = seg.get("beat")
    if explicit:
        return str(explicit)
    seg_id = seg.get("id", "")
    if seg_id.startswith("beat") and "-" in seg_id:
        return seg_id.split("-", 1)[0]
    return "unknown"


def build_brief(slug: str) -> Brief:
    manifest_path = MANIFEST_ROOT / slug / "assembly-manifest.json"
    shot_list_path = EPISODES_ROOT / slug / "shot-list.json"

    if not manifest_path.is_file():
        print(f"sourcing_brief: manifest not found: {manifest_path}", file=sys.stderr)
        sys.exit(2)

    manifest = json.loads(manifest_path.read_text())
    shot_list_map: dict[str, dict] = {}
    shot_list_resolved_path: Path | None = None
    if shot_list_path.is_file():
        shot_list_resolved_path = shot_list_path
        try:
            shot_list = json.loads(shot_list_path.read_text())
            for entry in shot_list.get("assets", []) or shot_list.get("shots", []) or []:
                sid = entry.get("id")
                if sid:
                    shot_list_map[sid] = entry
        except json.JSONDecodeError:
            # validate_data.py is the authority on JSON shape; we just skip.
            pass

    # ── Join: walk manifest segments, group by shotListId ────────────────
    # One shot can appear across multiple segments (e.g. FOOTAGE + HOLD pair
    # sharing visual). We aggregate segment IDs and sum effective duration.
    grouped: dict[str, dict] = {}
    for seg in manifest.get("segments", []) or []:
        asset = seg.get("asset") or {}
        shot_id = asset.get("shotListId")
        if not shot_id:
            continue
        # Compute segment duration. endSec - startSec; either may be missing.
        try:
            dur = float(seg.get("endSec", 0)) - float(seg.get("startSec", 0))
        except (TypeError, ValueError):
            dur = 0.0
        bucket = grouped.setdefault(shot_id, {
            "segments": [],
            "first_seg": seg,
            "asset": asset,
            "total_duration": 0.0,
            "first_beat": beat_id_for_segment(seg),
        })
        bucket["segments"].append(seg.get("id", "?"))
        bucket["total_duration"] += dur

    # ── Build AssetEntry records ─────────────────────────────────────────
    brief = Brief(
        episode=slug,
        generated_at=dt.datetime.now().isoformat(timespec="seconds"),
        manifest_path=manifest_path,
        shot_list_path=shot_list_resolved_path,
    )

    for shot_id, bucket in grouped.items():
        first_seg = bucket["first_seg"]
        manifest_asset = bucket["asset"]
        shot_list_entry = shot_list_map.get(shot_id, {})

        # Search terms: manifest has them on segment.asset.searchTerms; shot-list
        # has them as search_terms (snake_case). Prefer shot-list when present
        # since it's the canonical sourcing-time spec; fall back to manifest.
        terms = (
            shot_list_entry.get("search_terms")
            or manifest_asset.get("searchTerms")
            or []
        )

        brief.assets.append(AssetEntry(
            shot_list_id=shot_id,
            priority=str(shot_list_entry.get("priority", "?")),
            medium=str(shot_list_entry.get("type", "?")),
            segment_type=str(first_seg.get("type", "?")),
            source=str(manifest_asset.get("source") or shot_list_entry.get("source") or "?"),
            status=normalise_status(manifest_asset.get("status")),
            search_terms=list(terms),
            treatment=str(
                manifest_asset.get("treatment", {}).get("ramp")
                if isinstance(manifest_asset.get("treatment"), dict)
                else shot_list_entry.get("treatment", "?")
            ),
            notes=str(shot_list_entry.get("notes", "")),
            duration_sec=round(bucket["total_duration"], 2),
            segment_ids=bucket["segments"],
            beat=bucket["first_beat"],
            file=manifest_asset.get("file"),
            in_shot_list=shot_id in shot_list_map,
        ))

    return brief


# ─── Filters ────────────────────────────────────────────────────────────────


def filter_assets(
    brief: Brief,
    *,
    pending_only: bool = False,
    priority: str | None = None,
    source: str | None = None,
    segment_type: str | None = None,
) -> list[AssetEntry]:
    out = []
    for a in brief.assets:
        if pending_only and a.status != "pending":
            continue
        if priority and a.priority.upper() != priority.upper():
            continue
        if source and a.source.lower() != source.lower():
            continue
        if segment_type and a.segment_type.upper() != segment_type.upper():
            continue
        out.append(a)
    return out


# ─── Markdown rendering ─────────────────────────────────────────────────────


STATUS_BADGES = {
    "pending": "⏳ pending",
    "resolved": "✅ resolved",
    "failed": "❌ failed",
}


def render_markdown(brief: Brief, assets: list[AssetEntry]) -> str:
    """Markdown brief grouped by beat. Each asset is a sub-section with
    its search terms rendered as clickable links to the source platform."""
    buf = io.StringIO()
    relative_manifest = _try_relative(brief.manifest_path)

    buf.write(f"# Sourcing Brief — `{brief.episode}`\n\n")
    buf.write(f"**Generated:** {brief.generated_at}\n")
    buf.write(f"**Manifest:** `{relative_manifest}`\n")
    if brief.shot_list_path:
        buf.write(f"**Shot list:** `{_try_relative(brief.shot_list_path)}`\n")
    else:
        buf.write("**Shot list:** (none — notes / treatment / priority unavailable)\n")
    buf.write(f"**Total assets shown:** {len(assets)} of {brief.total}\n")
    if brief.by_status:
        status_str = " · ".join(
            f"{STATUS_BADGES.get(s, s)}: {n}" for s, n in sorted(brief.by_status.items())
        )
        buf.write(f"**Status breakdown:** {status_str}\n")
    if brief.by_segment_type:
        type_str = " · ".join(f"{t}: {n}" for t, n in sorted(brief.by_segment_type.items()))
        buf.write(f"**Type breakdown:** {type_str}\n")
    buf.write("\n---\n\n")

    # Group by beat
    by_beat: dict[str, list[AssetEntry]] = {}
    for a in assets:
        by_beat.setdefault(a.beat, []).append(a)

    for beat_id in sorted(by_beat.keys()):
        beat_assets = by_beat[beat_id]
        buf.write(f"## {beat_id} · {len(beat_assets)} asset(s)\n\n")
        for a in beat_assets:
            badge = STATUS_BADGES.get(a.status, a.status)
            buf.write(
                f"### `{a.shot_list_id}` · {a.priority} · {a.source} · {a.segment_type} · {a.duration_sec}s\n\n"
            )
            buf.write(f"**Status:** {badge}  \n")
            buf.write(f"**Used in:** {', '.join(a.segment_ids)}  \n")
            buf.write(f"**Medium:** {a.medium} · **Treatment:** {a.treatment}  \n")
            if not a.in_shot_list:
                buf.write(
                    "⚠️  Not in shot-list.json — treatment/notes/priority unavailable.  \n"
                )
            if a.file:
                buf.write(f"**File:** `{a.file}`  \n")
            if a.notes:
                buf.write(f"\n**Notes:** {a.notes}\n")
            buf.write("\n**Search terms** (in priority order):\n")
            if not a.search_terms:
                buf.write("- _(no search terms — shot-list and manifest both empty)_\n")
            for i, term in enumerate(a.search_terms, 1):
                url = build_search_url(a.source, term)
                if url:
                    buf.write(f"{i}. [{term}]({url})\n")
                else:
                    buf.write(f"{i}. {term}  _(no URL for source: {a.source})_\n")
            buf.write("\n---\n\n")

    return buf.getvalue()


# ─── CSV rendering ──────────────────────────────────────────────────────────


def render_csv(brief: Brief, assets: list[AssetEntry]) -> str:
    """Flat CSV — one row per asset. Search terms + URLs are flattened
    into numbered columns (term_1, url_1, term_2, url_2, ...) up to a
    max of 5 terms (sufficient for current shot lists)."""
    MAX_TERMS = 5
    buf = io.StringIO()
    writer = csv.writer(buf)
    header = [
        "beat", "shot_list_id", "priority", "medium", "segment_type",
        "source", "status", "duration_sec", "segment_ids",
        "treatment", "notes", "file",
    ]
    for i in range(1, MAX_TERMS + 1):
        header.extend([f"term_{i}", f"url_{i}"])
    writer.writerow(header)

    for a in assets:
        row = [
            a.beat, a.shot_list_id, a.priority, a.medium, a.segment_type,
            a.source, a.status, a.duration_sec, ",".join(a.segment_ids),
            a.treatment, a.notes, a.file or "",
        ]
        for i in range(MAX_TERMS):
            if i < len(a.search_terms):
                term = a.search_terms[i]
                row.extend([term, build_search_url(a.source, term) or ""])
            else:
                row.extend(["", ""])
        writer.writerow(row)

    return buf.getvalue()


# ─── Path helper ────────────────────────────────────────────────────────────


def _try_relative(p: Path) -> str:
    try:
        return str(p.relative_to(REPO_ROOT))
    except ValueError:
        return str(p)


# ─── CLI ────────────────────────────────────────────────────────────────────


def list_episodes() -> int:
    print("Known episode slugs (have assembly-manifest.json):")
    if not MANIFEST_ROOT.is_dir():
        print("  (no data/episodes directory found)")
        return 2
    found = False
    for child in sorted(MANIFEST_ROOT.iterdir()):
        if (child / "assembly-manifest.json").is_file():
            print(f"  {child.name}")
            found = True
    if not found:
        print("  (none)")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="sourcing_brief.py",
        description="Generate an asset-sourcing brief from manifest + shot list.",
    )
    parser.add_argument("episode", nargs="?", help="Episode slug")
    parser.add_argument("--list", action="store_true", help="List known episodes")
    parser.add_argument(
        "--format", choices=("markdown", "csv"), default="markdown",
        help="Output format (default: markdown)",
    )
    parser.add_argument("--pending-only", action="store_true", help="Show only unsourced assets")
    parser.add_argument("--priority", choices=("P1", "P2", "P3"), help="Filter by priority")
    parser.add_argument("--source", help="Filter by source platform (e.g. pexels, wikimedia)")
    parser.add_argument(
        "--segment-type",
        help="Filter by manifest segment type (FOOTAGE, AI_GEN, ILLUST)",
    )
    parser.add_argument("--output", "-o", type=Path, help="Write to file instead of stdout")
    args = parser.parse_args(argv)

    if args.list:
        return list_episodes()
    if not args.episode:
        parser.print_usage(sys.stderr)
        print("sourcing_brief.py: error: episode slug required (or --list)", file=sys.stderr)
        return 2

    episode_dir = MANIFEST_ROOT / args.episode
    if not episode_dir.is_dir():
        print(f"sourcing_brief: unknown episode '{args.episode}'", file=sys.stderr)
        return 2

    brief = build_brief(args.episode)
    assets = filter_assets(
        brief,
        pending_only=args.pending_only,
        priority=args.priority,
        source=args.source,
        segment_type=args.segment_type,
    )

    if args.format == "csv":
        text = render_csv(brief, assets)
    else:
        text = render_markdown(brief, assets)

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text)
        print(f"sourcing brief written to {_try_relative(args.output)}", file=sys.stderr)
        print(
            f"  {len(assets)} of {brief.total} assets shown "
            f"({brief.by_status.get('pending', 0)} pending overall)",
            file=sys.stderr,
        )
    else:
        sys.stdout.write(text)

    return 0


if __name__ == "__main__":
    sys.exit(main())
