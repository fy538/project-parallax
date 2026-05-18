#!/usr/bin/env python3
"""
check_audio_cues.py — cross-check the audio cue sheet against the assembly manifest.

Failure mode this catches:
  `episodes/<slug>/audio-cue-sheet.md` is the production planning document
  for audio: music bed moods/timing, transition SFX cues, texture hits. The
  manifest (`assembly-manifest.json`) carries the rendered timing. The two
  drift when the cue sheet is updated but the manifest isn't (or vice versa),
  and the gap silently produces a render with the wrong music mood under the
  wrong narrative beat.

What we check:
  1. The SET of music-bed moods named in the cue sheet matches the moods
     declared in `manifest.musicBed.tracks[].mood`. Mood vocabulary is fixed
     (analytical / tension / contemplative / resolution / neutral) — extras
     or misspellings on either side are a real drift signal.
  2. The COUNT of music bed entries is close (cue sheet's "Layer 1" rows vs
     manifest tracks[]). Off-by-one is the typical mistake.
  3. Soft warning when the cue sheet mentions SFX cue names that aren't in
     the canonical schema enum (caught secondarily by manifest_lint M-CUE,
     but flagging them here helps producers fix the cue sheet upstream).

What we DON'T check (deferred — too fuzzy):
  - Timing alignment between cue sheet `MM:SS` columns and manifest seconds.
    The cue sheet uses approximate ranges ("0:00–0:45"); manifest uses exact
    second values. Reconciling them requires a fuzzy comparator that would
    fire on every legitimate ~3-second offset.

Usage:
    python3 tools/check_audio_cues.py silicon-trap
    python3 tools/check_audio_cues.py prisoners-dilemma --json
    python3 tools/check_audio_cues.py silicon-trap --strict

Exit codes:
    0 — clean or warnings-only in default mode
    1 — strict + any disagreement, or a hard error (missing/invalid manifest)
    2 — usage error
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter
from dataclasses import dataclass, field
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
EPISODES_ROOT = REPO_ROOT / "episodes"
MANIFEST_ROOT = REPO_ROOT / "remotion-templates" / "data" / "episodes"

# Shared manifest loader — single source of truth (May 2026 audit #6).
sys.path.insert(0, str(Path(__file__).resolve().parent / "shared"))
from manifests import load_manifest as _shared_load_manifest  # noqa: E402

# Canonical music bed moods — must match the enum in
# remotion-templates/data/assembly-manifest.schema.json (musicBed.tracks.mood).
CANONICAL_MUSIC_MOODS = frozenset({
    "contemplative", "analytical", "tension", "resolution", "neutral",
})

# Canonical SFX cue types — mirrored from manifest_lint.py CANONICAL_SOUND_CUE_TYPES.
CANONICAL_SFX_TYPES = frozenset({
    "beat-transition", "stat-reveal", "tension-rise", "tension-resolve",
    "map-whoosh", "quote-bell", "section-open", "end-stinger",
})

# Canonical texture-hit cue types — mirrored from manifest_lint.py
# CANONICAL_TEXTURE_CUE_TYPES. The cue sheet mixes both vocabularies in Layer
# 2 / Layer 3 sections; we accept either as valid.
CANONICAL_TEXTURE_TYPES = frozenset({
    "dot-click", "card-settle", "line-draw", "region-glow",
    "bar-grow", "node-pop", "page-turn",
})

# Union for the cue-sheet check — a backtick token in the cue sheet is valid
# if it appears in EITHER canonical set.
CANONICAL_CUE_TYPES = CANONICAL_SFX_TYPES | CANONICAL_TEXTURE_TYPES


# ─── Cue sheet parsing ───────────────────────────────────────────────────────


def find_cue_sheet(slug: str) -> Path | None:
    p = EPISODES_ROOT / slug / "audio-cue-sheet.md"
    return p if p.is_file() else None


# Match every mood word in the music bed table column. The cue sheet uses
# combined moods like "contemplative → building" or "analytical → tension";
# we split on `→`, `to`, `,`, `/` and pick out any canonical mood tokens.
_MOOD_SPLIT_RE = re.compile(r"[→/,]| to ", re.IGNORECASE)


def music_moods_in_cue_sheet(cue_text: str) -> Counter[str]:
    """
    Extract music-bed mood mentions from the cue sheet.

    Strategy: find the `## Layer 1: Music Bed` section, then for every table
    row inside it, scan the Mood column for canonical mood tokens. Returns
    a Counter so callers can show how many TIMES each mood was declared.
    """
    moods: Counter[str] = Counter()
    # Pull the section between "Layer 1" heading and the next "Layer N" or
    # "## " level-2 heading (whichever comes first).
    # Heading can be either order: `## Layer 1: Music Bed Plan` or
    # `## Music Bed Plan (Layer 1)`. Match a heading whose content mentions
    # "Music Bed" OR "Layer 1" (Layer 2/3 are SFX/textures, not music).
    section_match = re.search(
        r"##\s+(?:[^\n]*Music Bed[^\n]*|[^\n]*Layer\s+1[^\n]*)\n(.*?)"
        r"(?=\n##\s+(?:Layer\s+\d|[A-Z])|\Z)",
        cue_text, flags=re.IGNORECASE | re.DOTALL,
    )
    if not section_match:
        return moods
    section = section_match.group(1)

    # Find every table row (pipe-delimited markdown). Skip header / separator rows.
    for line in section.splitlines():
        if not line.strip().startswith("|"):
            continue
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 3:
            continue
        # Skip header (contains "Mood") and separator (`---`-style).
        if any("---" in c for c in cells) or any(c.lower() == "mood" for c in cells):
            continue
        # The "Mood" column is conventionally the 3rd cell, but the docs allow
        # variation — scan ALL cells for canonical mood tokens to be robust.
        for cell in cells:
            for part in _MOOD_SPLIT_RE.split(cell):
                token = part.strip().lower()
                if token in CANONICAL_MUSIC_MOODS:
                    moods[token] += 1
    return moods


def sfx_cue_types_in_cue_sheet(cue_text: str) -> Counter[str]:
    """Extract SFX cue type names from anywhere in the cue sheet.

    The Layer 2 / Layer 3 sections render cue types as inline-code (backticks):
    `section-open`, `beat-transition`. We match every backtick token and
    filter to those that look like cue types (kebab-case, known prefix).
    """
    counter: Counter[str] = Counter()
    # Anything in `backticks` that matches a kebab-case identifier
    for token in re.findall(r"`([a-z][a-z0-9-]+)`", cue_text):
        counter[token] += 1
    return counter


def music_track_count(cue_text: str) -> int:
    """Count music-bed table rows (excluding header/separator).

    Heading regex mirrors `music_moods_in_cue_sheet` — accepts either
    "## Layer 1: Music Bed Plan" or "## Music Bed Plan (Layer 1)" shape.
    """
    section = re.search(
        r"##\s+(?:[^\n]*Music Bed[^\n]*|[^\n]*Layer\s+1[^\n]*)\n(.*?)"
        r"(?=\n##\s+(?:Layer\s+\d|[A-Z])|\Z)",
        cue_text, flags=re.IGNORECASE | re.DOTALL,
    )
    if not section:
        return 0
    count = 0
    for line in section.group(1).splitlines():
        stripped = line.strip()
        if not stripped.startswith("|"):
            continue
        cells = [c.strip() for c in stripped.strip("|").split("|")]
        if any("---" in c for c in cells):
            continue
        if any(c.lower() == "mood" for c in cells):
            continue
        # A 1-cell mood-only row still counts (some compact cue sheets use
        # `| analytical |`). Allow ≥1 cell; the canonical structure is
        # multi-column but we don't want to under-count.
        if len(cells) < 1:
            continue
        count += 1
    return count


# ─── Manifest ────────────────────────────────────────────────────────────────


def load_manifest(slug: str) -> dict | None:
    """Delegates to tools/shared/manifests.load_manifest. Constructs the
    path from MANIFEST_ROOT (rather than passing a bare slug) so test
    monkeypatching of MANIFEST_ROOT continues to redirect the lookup."""
    return _shared_load_manifest(MANIFEST_ROOT / slug / "assembly-manifest.json")


def manifest_moods(manifest: dict) -> Counter[str]:
    tracks = ((manifest.get("musicBed") or {}).get("tracks") or [])
    return Counter(t.get("mood", "") for t in tracks if t.get("mood"))


def manifest_track_count(manifest: dict) -> int:
    return len((manifest.get("musicBed") or {}).get("tracks") or [])


# ─── Report ──────────────────────────────────────────────────────────────────


@dataclass
class AudioReport:
    slug: str
    cue_sheet_path: Path | None
    manifest_path: Path
    cue_moods: Counter = field(default_factory=Counter)
    manifest_mood_counts: Counter = field(default_factory=Counter)
    cue_only_moods: set[str] = field(default_factory=set)
    manifest_only_moods: set[str] = field(default_factory=set)
    cue_track_rows: int = 0
    manifest_track_count: int = 0
    sfx_unknown: set[str] = field(default_factory=set)
    errors: list[str] = field(default_factory=list)

    @property
    def has_findings(self) -> bool:
        return bool(
            self.cue_only_moods or self.manifest_only_moods
            or (self.cue_track_rows and self.manifest_track_count
                and abs(self.cue_track_rows - self.manifest_track_count) > 1)
            or self.sfx_unknown
        )


def cross_check(slug: str) -> AudioReport:
    report = AudioReport(
        slug=slug,
        cue_sheet_path=find_cue_sheet(slug),
        manifest_path=MANIFEST_ROOT / slug / "assembly-manifest.json",
    )

    manifest = load_manifest(slug)
    if manifest is None:
        report.errors.append(f"manifest missing or invalid: {report.manifest_path}")
        return report

    report.manifest_mood_counts = manifest_moods(manifest)
    report.manifest_track_count = manifest_track_count(manifest)

    if report.cue_sheet_path is None:
        report.errors.append(
            f"audio-cue-sheet.md not found in episodes/{slug}/ — nothing to cross-check"
        )
        return report

    cue_text = report.cue_sheet_path.read_text()
    report.cue_moods = music_moods_in_cue_sheet(cue_text)
    report.cue_track_rows = music_track_count(cue_text)

    cue_mood_set = set(report.cue_moods.keys())
    man_mood_set = set(report.manifest_mood_counts.keys())
    report.cue_only_moods = cue_mood_set - man_mood_set
    report.manifest_only_moods = man_mood_set - cue_mood_set

    # SFX cue tokens that aren't in the canonical schema enum — surface so the
    # producer can fix the cue sheet (or extend the schema). Some backtick
    # tokens are legitimate non-SFX strings (e.g. file paths, JSON keys)
    # so we only flag tokens that have at least one kebab-case dash AND end
    # in a recognisable SFX-shaped suffix. Conservative: only flag tokens
    # that look like SFX cues by structure but aren't in the enum.
    sfx_candidates = sfx_cue_types_in_cue_sheet(cue_text)
    sfx_shape = re.compile(r"^[a-z]+-[a-z]+(?:-[a-z]+)*$")
    sfx_suffix_hints = ("reveal", "transition", "open", "stinger", "rise", "resolve", "bell", "whoosh", "click", "settle", "draw", "glow", "grow", "pop", "turn")
    for token in sfx_candidates:
        if token in CANONICAL_CUE_TYPES:   # canonical SFX OR texture
            continue
        if not sfx_shape.match(token):
            continue
        if not any(token.endswith(suf) for suf in sfx_suffix_hints):
            continue
        report.sfx_unknown.add(token)

    return report


# ─── Output ──────────────────────────────────────────────────────────────────


def print_human(report: AudioReport, strict: bool) -> int:
    BOLD = "\033[1m"; RED = "\033[31m"; YELLOW = "\033[33m"
    GREEN = "\033[32m"; DIM = "\033[2m"; RESET = "\033[0m"

    def _rel(p: Path) -> str:
        try:
            return str(p.relative_to(REPO_ROOT))
        except ValueError:
            return str(p)

    print(f"\n{BOLD}audio cue sheet ↔ manifest: {report.slug}{RESET}")
    if report.cue_sheet_path:
        print(f"{DIM}  cue sheet: {_rel(report.cue_sheet_path)}{RESET}")
    else:
        print(f"{DIM}  cue sheet: (none){RESET}")
    print(f"{DIM}  manifest:  {_rel(report.manifest_path)}{RESET}\n")

    if report.errors:
        for e in report.errors:
            print(f"  {RED}✖ {e}{RESET}")
        print()
        return 2

    marker_color = RED if strict else YELLOW
    marker_label = "ERROR" if strict else "WARN"

    findings = 0

    if report.cue_only_moods:
        findings += 1
        print(f"  {marker_color}{BOLD}{marker_label}: moods in cue sheet not present in manifest:{RESET}")
        for m in sorted(report.cue_only_moods):
            print(f"    {marker_color}•{RESET} {m} (cue sheet: {report.cue_moods[m]}×)")
        print(f"    {DIM}Hint: either add a musicBed.tracks[] entry with this mood, or remove it from the cue sheet.{RESET}\n")

    if report.manifest_only_moods:
        findings += 1
        print(f"  {marker_color}{BOLD}{marker_label}: moods in manifest not declared in cue sheet:{RESET}")
        for m in sorted(report.manifest_only_moods):
            print(f"    {marker_color}•{RESET} {m} (manifest: {report.manifest_mood_counts[m]} track(s))")
        print(f"    {DIM}Hint: add a Layer 1 row for this mood in the cue sheet, or rename/remove the manifest track.{RESET}\n")

    if report.cue_track_rows and report.manifest_track_count:
        diff = abs(report.cue_track_rows - report.manifest_track_count)
        if diff > 1:
            findings += 1
            print(f"  {marker_color}{BOLD}{marker_label}: music bed track count differs by {diff}:{RESET}")
            print(f"    {DIM}cue sheet: {report.cue_track_rows} rows / manifest: {report.manifest_track_count} tracks{RESET}\n")

    if report.sfx_unknown:
        findings += 1
        print(f"  {YELLOW}{BOLD}WARN: SFX cue names in cue sheet not in canonical enum:{RESET}")
        for t in sorted(report.sfx_unknown):
            print(f"    {YELLOW}•{RESET} {t}")
        print(f"    {DIM}Canonical types: {', '.join(sorted(CANONICAL_CUE_TYPES))}{RESET}")
        print(f"    {DIM}Fix the cue sheet's backtick token, or extend the schema enum if this is a new cue type.{RESET}\n")

    if findings == 0:
        print(f"{GREEN}{BOLD}  ✓ cue sheet and manifest agree on music beds + SFX vocabulary.{RESET}\n")
        return 0
    return 1 if strict else 0


def print_json(report: AudioReport, strict: bool) -> int:
    def _rel(p: Path | None) -> str | None:
        if p is None:
            return None
        try:
            return str(p.relative_to(REPO_ROOT))
        except ValueError:
            return str(p)

    out = {
        "episode": report.slug,
        "cueSheet": _rel(report.cue_sheet_path),
        "manifest": _rel(report.manifest_path),
        "cueOnlyMoods": sorted(report.cue_only_moods),
        "manifestOnlyMoods": sorted(report.manifest_only_moods),
        "cueTrackRows": report.cue_track_rows,
        "manifestTrackCount": report.manifest_track_count,
        "sfxUnknown": sorted(report.sfx_unknown),
        "errors": report.errors,
        "strict": strict,
    }
    print(json.dumps(out, indent=2))
    if report.errors:
        return 2
    if strict and report.has_findings:
        return 1
    return 0


# ─── CLI ─────────────────────────────────────────────────────────────────────


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="check_audio_cues.py",
        description="Cross-check episode audio cue sheet against the assembly manifest.",
    )
    parser.add_argument("episode", help="Episode slug")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    parser.add_argument(
        "--strict", action="store_true",
        help="Treat findings as failures (exit 1). Default: informational warnings.",
    )
    args = parser.parse_args(argv)

    if not (EPISODES_ROOT / args.episode).is_dir():
        print(f"check_audio_cues: episode dir not found: {EPISODES_ROOT / args.episode}", file=sys.stderr)
        return 2

    report = cross_check(args.episode)
    return print_json(report, args.strict) if args.json else print_human(report, args.strict)


if __name__ == "__main__":
    sys.exit(main())
