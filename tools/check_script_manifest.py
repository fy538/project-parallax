#!/usr/bin/env python3
"""
check_script_manifest.py — cross-reference script + shot list against the manifest.

Two failure modes this catches:

  A. Shot-list drift
     The episode shot list (`episodes/<slug>/shot-list.json`) declares
     `assets[].id` like `beat1-tsmc-aerial`. The assembly manifest references
     each as `segments[].asset.shotListId`. A rename in one without the other
     breaks the asset-sourcing handoff silently: the renamed segment gets a
     placeholder, the old shot-list entry never sources anything.

  B. Data-file drift
     The production script references each TEMPLATE segment by data file:
     `[prisoners-dilemma/gameboard-flood-dresher.json]`. The manifest carries
     the same path under `segments[].template.dataFile`. A renamed JSON file
     that's only updated in one place fails the render at that segment.

What we check:
  1. Every shot-list `assets[].id` appears in manifest as a `shotListId`.
  2. Every manifest `shotListId` traces back to a shot-list `assets[].id`.
  3. Every `[<slug>/*.json]` reference in the script exists in manifest `dataFile`s.
  4. Every manifest `dataFile` is referenced somewhere in the script.

Soft (W) vs hard (E):
  Default: orphans in either direction are WARNINGS — drafts legitimately
  add shots ahead of the manifest and vice versa. With `--strict`, both
  directions become errors and the exit code reflects them.

Usage:
    python3 tools/check_script_manifest.py silicon-trap
    python3 tools/check_script_manifest.py prisoners-dilemma --json
    python3 tools/check_script_manifest.py silicon-trap --strict

Exit codes:
    0 — clean (or only warnings in non-strict mode)
    1 — strict mode + any orphan, or hard errors (missing files)
    2 — usage error / missing manifest / missing script
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
EPISODES_ROOT = REPO_ROOT / "episodes"
MANIFEST_ROOT = REPO_ROOT / "remotion-templates" / "data" / "episodes"

# Shared manifest loader — May 2026 audit #6.
sys.path.insert(0, str(Path(__file__).resolve().parent / "shared"))
from manifests import load_manifest as _shared_load_manifest  # noqa: E402

# ─── Script parsing ──────────────────────────────────────────────────────────

# Match `[<slug>/<filename>.json]` style references. The slug must match the
# episode being checked (so unrelated cross-episode references in editorial
# notes don't false-positive).
def datafile_refs_in_script(script_text: str, slug: str) -> set[str]:
    pattern = re.compile(rf"\[{re.escape(slug)}/([\w\-./]+\.json)\]")
    return set(pattern.findall(script_text))


def find_script(slug: str) -> Path | None:
    """Pick the canonical production script for an episode.

    Convention: `script-production.md` (prisoners-dilemma) OR
    `script-v<N>-production.md` (silicon-trap had v3/v4/v5). When versions
    are present, return the highest-numbered one.
    """
    episode_dir = EPISODES_ROOT / slug
    if not episode_dir.is_dir():
        return None

    # Single canonical name first
    canonical = episode_dir / "script-production.md"
    if canonical.is_file():
        return canonical

    # Versioned variants: `script-v<N>-production.md`
    versioned = sorted(
        episode_dir.glob("script-v*-production.md"),
        key=lambda p: int(re.search(r"v(\d+)", p.name).group(1)) if re.search(r"v(\d+)", p.name) else 0,
        reverse=True,
    )
    if versioned:
        return versioned[0]
    return None


# ─── Shot list ───────────────────────────────────────────────────────────────


def load_shot_list(slug: str) -> dict | None:
    path = EPISODES_ROOT / slug / "shot-list.json"
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text())
    except json.JSONDecodeError:
        return None


def shot_ids_from_list(shot_list: dict) -> set[str]:
    """Pull `assets[].id` regardless of whether the shape uses .assets or .shots."""
    ids: set[str] = set()
    for key in ("assets", "shots"):
        for item in shot_list.get(key, []) or []:
            sid = item.get("id")
            if sid:
                ids.add(sid)
    return ids


# ─── Manifest ────────────────────────────────────────────────────────────────


def load_manifest(slug: str) -> dict | None:
    """Delegates to tools/shared/manifests.load_manifest. Path constructed
    from MANIFEST_ROOT so test monkeypatching continues to redirect."""
    return _shared_load_manifest(MANIFEST_ROOT / slug / "assembly-manifest.json")


def shotlist_ids_in_manifest(manifest: dict) -> set[str]:
    ids: set[str] = set()
    for seg in manifest.get("segments", []) or []:
        asset = seg.get("asset") or {}
        sid = asset.get("shotListId")
        if sid:
            ids.add(sid)
    return ids


def datafiles_in_manifest(manifest: dict) -> set[str]:
    """Return manifest `template.dataFile` values, leading slug-prefix stripped.

    Both shapes appear in the wild: `kinetic-92-yield.json` (bare filename,
    resolved relative to the episode dir) and `prisoners-dilemma/foo.json`
    (slug-prefixed). Strip the prefix when present so the comparison key
    matches the script's `[<slug>/<file>.json]` capture group.
    """
    out: set[str] = set()
    for seg in manifest.get("segments", []) or []:
        template = seg.get("template") or {}
        path = template.get("dataFile")
        if not path:
            continue
        # If it's `<slug>/<file>`, drop the slug prefix; otherwise pass through.
        parts = path.split("/", 1)
        out.add(parts[1] if len(parts) == 2 else path)
    return out


# ─── Report ──────────────────────────────────────────────────────────────────


@dataclass
class CrossRefReport:
    slug: str
    script_path: Path | None
    shot_list_path: Path | None
    manifest_path: Path

    # Shot-list ↔ manifest
    shotlist_only: set[str] = field(default_factory=set)   # in shot-list, not in manifest
    manifest_only_shots: set[str] = field(default_factory=set)  # in manifest, not in shot-list

    # Script ↔ manifest dataFile
    script_only_data: set[str] = field(default_factory=set)
    manifest_only_data: set[str] = field(default_factory=set)

    # Hard errors (missing files etc.)
    errors: list[str] = field(default_factory=list)

    @property
    def has_orphans(self) -> bool:
        return bool(
            self.shotlist_only or self.manifest_only_shots
            or self.script_only_data or self.manifest_only_data
        )


def cross_check(slug: str) -> CrossRefReport:
    manifest = load_manifest(slug)
    manifest_path = MANIFEST_ROOT / slug / "assembly-manifest.json"
    report = CrossRefReport(
        slug=slug,
        script_path=find_script(slug),
        shot_list_path=(EPISODES_ROOT / slug / "shot-list.json"),
        manifest_path=manifest_path,
    )

    if manifest is None:
        report.errors.append(f"manifest missing or invalid: {manifest_path}")
        return report

    # ── Shot list cross-check ────────────────────────────────────────────
    shot_list = load_shot_list(slug)
    if shot_list is None:
        # No shot list yet — that's expected during early drafts. Skip the
        # shot-list cross-check without erroring.
        report.shot_list_path = None
    else:
        shot_list_ids = shot_ids_from_list(shot_list)
        manifest_shot_ids = shotlist_ids_in_manifest(manifest)
        report.shotlist_only = shot_list_ids - manifest_shot_ids
        report.manifest_only_shots = manifest_shot_ids - shot_list_ids

    # ── Script ↔ data-file cross-check ───────────────────────────────────
    if report.script_path is None:
        # Some episodes don't have a production script yet (very early state).
        # That's not an error — we just can't run the script→manifest check.
        pass
    else:
        script_text = report.script_path.read_text()
        script_refs = datafile_refs_in_script(script_text, slug)
        manifest_datafiles = datafiles_in_manifest(manifest)
        report.script_only_data = script_refs - manifest_datafiles
        report.manifest_only_data = manifest_datafiles - script_refs

    return report


# ─── Output ──────────────────────────────────────────────────────────────────


def print_human(report: CrossRefReport, strict: bool) -> int:
    BOLD = "\033[1m"; RED = "\033[31m"; YELLOW = "\033[33m"
    GREEN = "\033[32m"; DIM = "\033[2m"; RESET = "\033[0m"

    print(f"\n{BOLD}script ↔ manifest cross-check: {report.slug}{RESET}")
    if report.script_path:
        print(f"{DIM}  script:    {report.script_path.relative_to(REPO_ROOT)}{RESET}")
    else:
        print(f"{DIM}  script:    (none found — skipping script/dataFile check){RESET}")
    if report.shot_list_path and report.shot_list_path.is_file():
        print(f"{DIM}  shot list: {report.shot_list_path.relative_to(REPO_ROOT)}{RESET}")
    else:
        print(f"{DIM}  shot list: (none found — skipping shot-list/manifest check){RESET}")
    try:
        print(f"{DIM}  manifest:  {report.manifest_path.relative_to(REPO_ROOT)}{RESET}")
    except ValueError:
        print(f"{DIM}  manifest:  {report.manifest_path}{RESET}")
    print()

    if report.errors:
        for e in report.errors:
            print(f"  {RED}✖ {e}{RESET}")
        print()
        return 2

    marker_color = RED if strict else YELLOW
    marker_label = "ERROR" if strict else "WARN"

    def _block(title: str, items: set[str], hint: str) -> None:
        if not items:
            return
        print(f"  {marker_color}{BOLD}{marker_label}: {title} ({len(items)}){RESET}")
        for item in sorted(items):
            print(f"    {marker_color}•{RESET} {item}")
        print(f"    {DIM}{hint}{RESET}\n")

    _block(
        "shot-list IDs not referenced in manifest",
        report.shotlist_only,
        "Either remove the unused shot from shot-list.json, or add a manifest segment with this shotListId.",
    )
    _block(
        "manifest shotListIds not declared in shot-list",
        report.manifest_only_shots,
        "Either add the shot to shot-list.json (sourceable upstream), or rename the manifest's shotListId to match an existing entry.",
    )
    _block(
        "script [<slug>/*.json] refs not in manifest dataFile",
        report.script_only_data,
        "Either remove the script reference, or add a manifest segment with template.dataFile pointing at this JSON.",
    )
    _block(
        "manifest dataFile refs not mentioned in script",
        report.manifest_only_data,
        "Either remove the manifest segment, or add a corresponding line in the production script referencing this JSON.",
    )

    if not report.has_orphans:
        print(f"{GREEN}{BOLD}  ✓ all script ↔ manifest references match.{RESET}\n")
        return 0
    return 1 if strict else 0


def print_json(report: CrossRefReport, strict: bool) -> int:
    def _rel(p: Path | None) -> str | None:
        if p is None:
            return None
        try:
            return str(p.relative_to(REPO_ROOT))
        except ValueError:
            return str(p)

    out = {
        "episode": report.slug,
        "script": _rel(report.script_path),
        "shotList": _rel(report.shot_list_path) if report.shot_list_path and report.shot_list_path.is_file() else None,
        "manifest": _rel(report.manifest_path),
        "shotlistOrphans": sorted(report.shotlist_only),
        "manifestOnlyShots": sorted(report.manifest_only_shots),
        "scriptOnlyDataRefs": sorted(report.script_only_data),
        "manifestOnlyDataRefs": sorted(report.manifest_only_data),
        "errors": report.errors,
        "strict": strict,
    }
    print(json.dumps(out, indent=2))
    if report.errors:
        return 2
    if strict and report.has_orphans:
        return 1
    return 0


# ─── CLI ─────────────────────────────────────────────────────────────────────


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="check_script_manifest.py",
        description="Cross-reference an episode's production script + shot list against its assembly manifest.",
    )
    parser.add_argument("episode", help="Episode slug")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    parser.add_argument("--strict", action="store_true", help="Treat orphans as errors (exit 1)")
    args = parser.parse_args(argv)

    episode_dir = EPISODES_ROOT / args.episode
    if not episode_dir.is_dir():
        print(f"check_script_manifest: episode dir not found: {episode_dir}", file=sys.stderr)
        return 2

    report = cross_check(args.episode)
    return print_json(report, args.strict) if args.json else print_human(report, args.strict)


if __name__ == "__main__":
    sys.exit(main())
