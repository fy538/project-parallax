#!/usr/bin/env python3
"""
preflight.py — verify every asset path referenced by an episode exists on disk.

Failure mode this catches: `npm run build silicon-trap-full ...` starts a long
render, crashes 8 minutes in because a music bed file was renamed / a clip is
still pending sourcing / a wafer-macro.jpg got moved during reorg. Preflight
catches those upfront in <1s.

Scope (assets covered):
  1. manifest.narration.audioFile           — narration audio
  2. manifest.musicBed.tracks[].file        — music bed audio
  3. segments[].asset.file                  — FOOTAGE / AI-GEN clips (when sourced)
  4. Inside every referenced dataFile JSON  — images, illustrations, embedded clips

Out of scope (already covered):
  - segments[].template.dataFile existence: manifest_lint.py M-DATAFILE
  - JSON well-formedness / schema:          validate_data.py
  - backdropId values (string IDs, not paths; validated at render time)

Path resolution is permissive: each path is tried against multiple roots
(`public/episodes/<slug>/<path>`, `public/<path>`, `public/assets/<path>`).
A file is "found" if ANY candidate resolves. This matches the convention
divergence between FullEpisode's `assetBasePath` (per-episode override) and
direct `staticFile(path)` usage in showcase compositions.

Reported categories:
  - missing:  path is set but resolves to no on-disk file (typo / moved / not yet sourced)
  - pending:  asset.file is null AND asset.status is "pending" (asset sourcing not yet done — informational)

Usage:
    python3 tools/preflight.py <episode-slug>
    python3 tools/preflight.py silicon-trap --json
    python3 tools/preflight.py silicon-trap --strict      # fail on pending too
    python3 tools/preflight.py --list                     # known episode slugs

Exit codes:
    0 — all referenced assets exist; pending assets reported but not blocking
    1 — at least one asset has a broken file path (or --strict and any pending)
    2 — usage error / unknown episode / missing manifest
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parent.parent
EPISODES_DIR = REPO_ROOT / "remotion-templates" / "data" / "episodes"
PUBLIC_DIR = REPO_ROOT / "remotion-templates" / "public"


def _relpath(p: Path) -> str:
    """Show `p` relative to REPO_ROOT when it's inside the repo, else absolute.

    Synthetic test paths under /tmp aren't repo-relative and would crash
    `Path.relative_to(REPO_ROOT)`. Falling back to the absolute path keeps
    the human report and JSON output usable in test contexts too.
    """
    try:
        return str(p.relative_to(REPO_ROOT))
    except ValueError:
        return str(p)

# ─── Asset reference detection ───────────────────────────────────────────────

# Key names that, when found in a JSON object, may carry a relative asset path.
# Used only as a hint — final filter is the extension check below, so adding
# an unknown key here costs nothing (it just widens the candidate set).
ASSET_KEY_PATTERN = re.compile(
    r"^(file|src|imageSrc|illustrationSrc|audioFile|videoFile|backgroundSrc|"
    r"thumbnailSrc|posterSrc)$"
)

# A value is treated as an asset path only when both:
#   - the key matches ASSET_KEY_PATTERN (or it's a manifest-level field we
#     explicitly know about — handled separately), AND
#   - the value ends in a recognised asset extension.
# This avoids false positives like searchTerms containing the string ".mp4"
# in free-text descriptions.
ASSET_EXTENSION_PATTERN = re.compile(
    r"\.(png|jpe?g|webp|gif|svg|avif|mp4|mov|webm|wav|mp3|ogg|m4a|flac)$",
    re.IGNORECASE,
)


@dataclass
class AssetRef:
    """One asset reference collected from the manifest or a data JSON."""

    path: str           # The literal string value as it appears in JSON
    source: str         # JSON path / location for the error message (e.g. "musicBed.tracks[0].file")
    file: Path          # The JSON file the reference lives in (for cross-referencing)
    is_pending: bool = False  # True when file=null AND status="pending"


@dataclass
class PreflightReport:
    episode: str
    manifest_path: Path
    total_refs: int = 0
    missing: list[AssetRef] = field(default_factory=list)
    pending: list[AssetRef] = field(default_factory=list)
    resolved_examples: list[tuple[AssetRef, Path]] = field(default_factory=list)


# ─── Path resolution ─────────────────────────────────────────────────────────


def candidate_resolutions(rel_path: str, slug: str) -> list[Path]:
    """
    Build the list of on-disk paths to try for a JSON-relative asset string.

    Order reflects observed conventions in the codebase:
      1. public/episodes/<slug>/<path>  — episode-scoped (most common)
      2. public/<path>                  — global (audio/sfx, geo, assets/, etc.)
      3. public/assets/<path>           — legacy `assetBasePath = "assets"` default
    """
    return [
        PUBLIC_DIR / "episodes" / slug / rel_path,
        PUBLIC_DIR / rel_path,
        PUBLIC_DIR / "assets" / rel_path,
    ]


def resolve_asset(ref: AssetRef, slug: str) -> Path | None:
    """Try each candidate root in order. Return the first existing file, or None."""
    for candidate in candidate_resolutions(ref.path, slug):
        if candidate.is_file():
            return candidate
    return None


# ─── Manifest scan ───────────────────────────────────────────────────────────


def collect_manifest_refs(manifest: dict, manifest_path: Path) -> list[AssetRef]:
    """
    Pull explicit asset references out of the manifest's known schema slots.

    These are top-level fields where we KNOW the value is a file path (or null
    when not yet sourced). We don't fall back to the generic key-matching walk
    here because the manifest also contains free-text fields (e.g. notes,
    searchTerms) where a string with `.mp4` would be a false positive.
    """
    refs: list[AssetRef] = []

    # 1. Narration audio (only present in precise mode; null/absent in estimate)
    audio_file = manifest.get("narration", {}).get("audioFile")
    if audio_file:
        refs.append(AssetRef(
            path=audio_file,
            source="narration.audioFile",
            file=manifest_path,
        ))

    # 2. Music bed tracks
    music_bed = manifest.get("musicBed") or {}
    for i, track in enumerate(music_bed.get("tracks", []) or []):
        track_file = track.get("file")
        if track_file:
            refs.append(AssetRef(
                path=track_file,
                source=f"musicBed.tracks[{i}].file (id={track.get('id', '?')})",
                file=manifest_path,
            ))

    # 3. Per-segment asset.file (FOOTAGE / AI_GEN / ILLUST)
    for i, seg in enumerate(manifest.get("segments", []) or []):
        asset = seg.get("asset") or {}
        asset_file = asset.get("file")
        status = asset.get("status", "pending")
        seg_id = seg.get("id", f"segment[{i}]")
        source = f"segments[{i}].asset.file (id={seg_id})"
        if asset_file:
            refs.append(AssetRef(path=asset_file, source=source, file=manifest_path))
        elif status == "pending" and seg.get("type") in {"FOOTAGE", "AI_GEN", "ILLUST"}:
            # Not yet sourced — track as `pending` so --strict can flag it.
            refs.append(AssetRef(
                path="(null — not yet sourced)",
                source=source,
                file=manifest_path,
                is_pending=True,
            ))

    return refs


# ─── Data-file scan ──────────────────────────────────────────────────────────


def collect_datafile_refs(
    data: Any,
    data_file_path: Path,
    json_path_prefix: str = "",
) -> list[AssetRef]:
    """
    Recursively walk a parsed data JSON and collect every key/value pair where
    the key looks like an asset slot AND the value ends in a known media extension.

    We do NOT validate that the path looks structurally "sensible" beyond the
    extension match — the resolver does the actual file-existence test.
    """
    refs: list[AssetRef] = []

    def visit(node: Any, json_path: str) -> None:
        if isinstance(node, dict):
            for key, value in node.items():
                child_path = f"{json_path}.{key}" if json_path else key
                if (
                    isinstance(value, str)
                    and ASSET_KEY_PATTERN.match(key)
                    and ASSET_EXTENSION_PATTERN.search(value)
                ):
                    refs.append(AssetRef(
                        path=value,
                        source=child_path,
                        file=data_file_path,
                    ))
                else:
                    visit(value, child_path)
        elif isinstance(node, list):
            for i, item in enumerate(node):
                visit(item, f"{json_path}[{i}]")

    visit(data, json_path_prefix)
    return refs


# ─── Top-level orchestration ─────────────────────────────────────────────────


def run_preflight(slug: str) -> PreflightReport:
    episode_dir = EPISODES_DIR / slug
    manifest_path = episode_dir / "assembly-manifest.json"

    if not episode_dir.is_dir():
        print(f"Error: episode directory not found: {episode_dir}", file=sys.stderr)
        sys.exit(2)
    if not manifest_path.is_file():
        print(f"Error: assembly-manifest.json not found in {episode_dir}", file=sys.stderr)
        print("  (preflight requires a manifest; some draft episodes don't have one yet)", file=sys.stderr)
        sys.exit(2)

    try:
        manifest = json.loads(manifest_path.read_text())
    except json.JSONDecodeError as exc:
        print(f"Error: assembly-manifest.json is not valid JSON: {exc}", file=sys.stderr)
        sys.exit(2)

    report = PreflightReport(episode=slug, manifest_path=manifest_path)

    # Collect refs from the manifest itself.
    all_refs: list[AssetRef] = collect_manifest_refs(manifest, manifest_path)

    # Walk every referenced dataFile and collect asset refs from inside.
    seen_data_files: set[Path] = set()
    for seg in manifest.get("segments", []) or []:
        template = seg.get("template") or {}
        data_file = template.get("dataFile")
        if not data_file:
            continue
        data_path = episode_dir / data_file
        if not data_path.is_file():
            # dataFile existence is M-DATAFILE's job — silently skip here so
            # preflight stays focused on file-content-derived asset refs.
            continue
        if data_path in seen_data_files:
            continue
        seen_data_files.add(data_path)
        try:
            data_json = json.loads(data_path.read_text())
        except json.JSONDecodeError:
            # Likewise, JSON validity is validate_data.py's job; skip silently.
            continue
        all_refs.extend(collect_datafile_refs(data_json, data_path))

    report.total_refs = len(all_refs)

    # Resolve each ref against the candidate roots.
    for ref in all_refs:
        if ref.is_pending:
            report.pending.append(ref)
            continue
        resolved = resolve_asset(ref, slug)
        if resolved is None:
            report.missing.append(ref)
        else:
            report.resolved_examples.append((ref, resolved))

    return report


# ─── Output ──────────────────────────────────────────────────────────────────


def print_human(report: PreflightReport, strict: bool) -> int:
    """Print a human-readable report. Returns the intended exit code."""
    BOLD = "\033[1m"
    RED = "\033[31m"
    YELLOW = "\033[33m"
    GREEN = "\033[32m"
    DIM = "\033[2m"
    RESET = "\033[0m"

    print(f"\n{BOLD}preflight: {report.episode}{RESET}")
    print(f"{DIM}  manifest: {_relpath(report.manifest_path)}{RESET}")
    print(f"{DIM}  refs scanned: {report.total_refs}{RESET}")
    resolved_n = report.total_refs - len(report.missing) - len(report.pending)
    print(f"{DIM}  resolved: {resolved_n} / missing: {len(report.missing)} / pending: {len(report.pending)}{RESET}\n")

    if report.missing:
        print(f"{RED}{BOLD}  ✖ {len(report.missing)} broken asset reference(s):{RESET}")
        for ref in report.missing:
            print(f"    {RED}•{RESET} {ref.path}")
            print(f"      {DIM}from {_relpath(ref.file)} :: {ref.source}{RESET}")
            print(f"      {DIM}tried:{RESET}")
            for candidate in candidate_resolutions(ref.path, report.episode):
                print(f"        {DIM}- {_relpath(candidate)}{RESET}")
        print()

    if report.pending:
        marker = RED if strict else YELLOW
        word = "ERROR" if strict else "WARN"
        print(f"{marker}{BOLD}  {word}: {len(report.pending)} asset(s) still pending sourcing:{RESET}")
        for ref in report.pending[:10]:
            print(f"    {marker}•{RESET} {ref.source}")
        if len(report.pending) > 10:
            print(f"    {DIM}... and {len(report.pending) - 10} more{RESET}")
        print()

    has_blocking = bool(report.missing) or (strict and report.pending)
    if not has_blocking:
        print(f"{GREEN}{BOLD}  ✓ all asset references resolved.{RESET}\n")
        return 0
    return 1


def print_json(report: PreflightReport, strict: bool) -> int:
    out = {
        "episode": report.episode,
        "manifest": _relpath(report.manifest_path),
        "totalRefs": report.total_refs,
        "missing": [
            {"path": r.path, "source": r.source, "file": _relpath(r.file)}
            for r in report.missing
        ],
        "pending": [
            {"source": r.source, "file": _relpath(r.file)}
            for r in report.pending
        ],
        "resolvedCount": report.total_refs - len(report.missing) - len(report.pending),
        "strict": strict,
    }
    print(json.dumps(out, indent=2))
    has_blocking = bool(report.missing) or (strict and report.pending)
    return 1 if has_blocking else 0


# ─── CLI ─────────────────────────────────────────────────────────────────────


def list_episodes() -> int:
    print("Known episode slugs (have assembly-manifest.json):")
    if not EPISODES_DIR.is_dir():
        print("  (no data/episodes directory found)")
        return 2
    found = False
    for child in sorted(EPISODES_DIR.iterdir()):
        if (child / "assembly-manifest.json").is_file():
            print(f"  {child.name}")
            found = True
    if not found:
        print("  (none)")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="preflight.py",
        description="Verify every asset path referenced by an episode exists on disk.",
    )
    parser.add_argument("episode", nargs="?", help="Episode slug (e.g. 'silicon-trap')")
    parser.add_argument("--list", action="store_true", help="List known episode slugs and exit")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat pending-sourcing entries as failures (default: warn-only)",
    )
    args = parser.parse_args(argv)

    if args.list:
        return list_episodes()
    if not args.episode:
        parser.print_usage(sys.stderr)
        print("preflight.py: error: episode slug required (or --list)", file=sys.stderr)
        return 2

    report = run_preflight(args.episode)
    if args.json:
        return print_json(report, args.strict)
    return print_human(report, args.strict)


if __name__ == "__main__":
    sys.exit(main())
