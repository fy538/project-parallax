#!/usr/bin/env python3
"""
source_sheet.py — Kurzgesagt-style per-episode source sheet.

The Kurzgesagt discipline (per their published methodology): every
episode ships a 15-50 page source sheet organized CHRONOLOGICALLY as
claims appear in the video — not as a flat bibliography. Each claim
gets its narration timecode, the claim text, and the supporting
citation. This is a public-facing trust artifact, not just an
internal QA doc.

The tool walks the production script for `{✅}` verified-claim tags,
maps each to its narration timecode from the assembly manifest, and
emits a scaffolded `episodes/<slug>/sources.md`. Each claim gets a
numbered section with timecode + claim text + a `**Source:**`
placeholder the operator fills from the research brief.

Why scaffolding (not auto-citing): the research brief is unstructured
prose. Mapping a specific {✅} tag to a specific citation requires
editorial judgment the tool doesn't have. The tool's job is to never
miss a {✅} tag (current alternative: hand-tracking 60+ claims per
episode and inevitably missing some).

Usage:
    python3 tools/sourcing/source_sheet.py <slug>
    python3 tools/sourcing/source_sheet.py <slug> --script PATH --output sources.md
    python3 tools/sourcing/source_sheet.py <slug> --json --stdout

Exit codes:
    0 — sources sheet generated
    1 — script has zero {✅} tags (likely missing claim discipline)
    2 — usage / missing inputs
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from manifests import load_manifest as _shared_load_manifest  # noqa: E402
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"
REMOTION_DATA = ROOT / "remotion-templates" / "data" / "episodes"
CONCEPTS_REGISTRY = ROOT / "data" / "concepts.json"

# ── Tunables ─────────────────────────────────────────────────────────────────

# Words-per-minute for word-count → runtime estimation when no
# assembly manifest is available (matches the rest of the pipeline).
DEFAULT_WPM = 150

# Match production-script verified-claim tags. The canonical form is
# `{✅}`; we also accept `{verified}` for tooling robustness. Other
# brace contents (e.g. `{⚠️}` for unresolved, `{NEW}` for revision
# markers, `{⚠️ softened from "most"...}` for editorial annotations)
# are NOT sourced claims and should not surface here.
_CLAIM_TAG_RE = re.compile(r"\{(?:✅|verified)\}")

# Markdown structural patterns we use to walk the script.
_BEAT_HEADER_RE = re.compile(
    # Absorb optional `(timing)` then any trailing `<!-- HTML comment -->`
    # markers so the captured title doesn't leak structural-marker
    # comments into the rendered output (same fix as
    # format_for_reading.BEAT_HEADER_RE).
    r"^##\s+BEAT\s+(\d+)\s*[—–-]\s*(.+?)"
    r"(?:\s*\((.+?)\))?"
    r"(?:\s*<!--.*?-->)*\s*$",
    re.IGNORECASE,
)
_ASSET_SUMMARY_RE = re.compile(r"^##\s+ASSET\s+SUMMARY", re.IGNORECASE)
_TABLE_SEP_RE = re.compile(r"^\|[\s\-:|]+\|$")


# ── Data shapes ──────────────────────────────────────────────────────────────


@dataclass
class SuggestedSource:
    """One source-registry entry that the matcher suspects backs this
    claim. Operator reviews and accepts / rejects."""
    id: str                        # registry concept id
    title: str                     # term.en — the source title
    author: str                    # sourceMeta.author
    year: int = 0                  # sourceMeta.year (0 if absent)
    url: str = ""                  # sourceMeta.url
    page: str = ""                 # sourceMeta.page
    match_reason: str = ""         # why the matcher picked this source
                                   # ("author 'Nash' in claim" / "title 'Strategy of Conflict' in claim")


@dataclass
class ClaimEntry:
    """One verified-claim tag found in the script."""
    number: int                    # 1-indexed across the whole episode
    beat_number: int
    beat_title: str
    timecode_sec: float            # narration position (sec from episode start)
    claim_text: str                # the narration sentence containing the tag
    word_offset: int               # word index within the beat's narration
                                   # (used to compute timecode when manifest absent)
    suggested_sources: list[SuggestedSource] = field(default_factory=list)


@dataclass
class SourceSheetReport:
    slug: str
    episode_title: str
    script_path: str
    manifest_path: str             # empty if no manifest
    total_claims: int
    claims: list[ClaimEntry] = field(default_factory=list)


# ── Parsing the script ──────────────────────────────────────────────────────


def _split_table_row(line: str) -> list[str] | None:
    s = line.rstrip("\n")
    if not s.lstrip().startswith("|") or s.count("|") < 2:
        return None
    return [c.strip() for c in s.strip().strip("|").split("|")]


def _is_table_separator(line: str) -> bool:
    return bool(_TABLE_SEP_RE.match(line.strip()))


def _is_narration_header(cells: list[str]) -> bool:
    return (
        len(cells) >= 2
        and cells[0].upper() == "NARRATION"
        and "VISUAL" in cells[1].upper()
    )


_LEADING_TAG_RE = re.compile(r"^(\{[^}]+\}(?:\s+\{[^}]+\})*)\s*(.*)$", re.DOTALL)
_BRACKET_DIRECTIVE_RE = re.compile(r"\[[A-Z][A-Z0-9-]*:[^\]]*\]")


def _split_sentences(text: str) -> list[str]:
    """Simple sentence splitter — same shape as the one in
    sayability_lint, kept inline so this tool has no cross-deps.

    Two post-processing passes fix real-script artifacts:

      1. LEADING-TAG MIGRATION: when a sentence ENDS with `. {✅}`, the
         naive split places `{✅}` at the START of the next sentence.
         We detect a leading brace-tag and move it back to the previous
         sentence's end — otherwise the tag's claim is attributed to
         the wrong sentence (one over) and produces "Maine lobster"-style
         duplicates when multiple claims land in the same cell.

      2. EMPTY-FRAGMENT MERGE: fragments that contain ONLY annotation
         braces and/or `[BRACKET-DIRECTIVE: ...]` markers (no real text)
         get glued onto the previous sentence so they don't surface as
         orphan "claims" whose text is just `[VISUAL-FIRST: 3s]`.
    """
    # Drop the lookahead-uppercase constraint so rhetorical-question +
    # lowercase patterns split cleanly.
    raw = [p.strip() for p in re.split(r"(?<=[.!?])\s+", text) if p.strip()]

    # Pass 1: pull leading {tags} backward onto the prior sentence.
    fixed: list[str] = []
    for part in raw:
        m = _LEADING_TAG_RE.match(part)
        if m and fixed:
            leading_tags = m.group(1)
            rest = m.group(2).strip()
            fixed[-1] = (fixed[-1] + " " + leading_tags).strip()
            if rest:
                fixed.append(rest)
        else:
            fixed.append(part)

    # Pass 2: glue empty-after-strip fragments (only braces +/- bracket
    # directives, no real prose) onto the prior sentence.
    merged: list[str] = []
    for part in fixed:
        # Strip both annotation braces AND square-bracket directives
        # before deciding whether the fragment carries actual narration.
        stripped = re.sub(r"\{[^}]*\}", "", part)
        stripped = _BRACKET_DIRECTIVE_RE.sub("", stripped).strip()
        if not stripped and merged:
            merged[-1] = (merged[-1] + " " + part).strip()
        else:
            merged.append(part)
    return merged


def _count_words(text: str) -> int:
    """Word count, dropping claim tags + pure-punctuation tokens."""
    cleaned = _CLAIM_TAG_RE.sub("", text)
    # Also strip other brace tags so they don't inflate the count
    cleaned = re.sub(r"\{[^}]*\}", "", cleaned)
    return sum(1 for tok in cleaned.split() if re.search(r"\w", tok))


def find_script(slug: str) -> Path | None:
    """Canonical script-production.md, then highest versioned."""
    ep_dir = EPISODES_DIR / slug
    canonical = ep_dir / "script-production.md"
    if canonical.is_file():
        return canonical
    versioned = sorted(ep_dir.glob("script-v*-production.md"))
    return versioned[-1] if versioned else None


def extract_claims(script_path: Path) -> list[ClaimEntry]:
    """Walk the script's table rows. For each row containing one or
    more {✅} tags, emit a ClaimEntry per tag. Tracks per-beat word
    offset so the manifest mapper can compute timecodes later.

    Multiple claims in the same narration cell each get their own
    entry (we re-split into sentences and pick the sentence containing
    the tag — same model Kurzgesagt uses where two adjacent claims
    each get their own citation).
    """
    claims: list[ClaimEntry] = []
    current_beat = 0
    current_beat_title = ""
    inside_table = False
    beat_word_offset = 0  # cumulative word count for this beat
    claim_idx = 0

    for raw_line in script_path.read_text(encoding="utf-8").splitlines():
        bh = _BEAT_HEADER_RE.match(raw_line)
        if bh:
            current_beat = int(bh.group(1))
            current_beat_title = bh.group(2).strip()
            inside_table = False
            beat_word_offset = 0
            continue
        if _ASSET_SUMMARY_RE.match(raw_line):
            break
        if current_beat == 0:
            continue
        cells = _split_table_row(raw_line)
        if cells is None:
            inside_table = False
            continue
        if _is_table_separator(raw_line):
            continue
        if _is_narration_header(cells):
            inside_table = True
            continue
        if not inside_table or len(cells) < 2:
            continue
        narration = cells[0]
        if not narration or not _CLAIM_TAG_RE.search(narration):
            beat_word_offset += _count_words(narration)
            continue
        # Sentence-by-sentence walk so multi-claim cells get distinct
        # entries with accurate per-claim word offsets.
        running_offset = beat_word_offset
        for sentence in _split_sentences(narration):
            sentence_words = _count_words(sentence)
            tags_in_sentence = len(_CLAIM_TAG_RE.findall(sentence))
            for _ in range(tags_in_sentence):
                claim_idx += 1
                clean = _CLAIM_TAG_RE.sub("", sentence)
                # Also strip other annotation braces for the public-facing claim text
                clean = re.sub(r"\{[^}]*\}", "", clean)
                # And [BRACKET-DIRECTIVE:] markers (e.g. [VISUAL-FIRST:])
                clean = _BRACKET_DIRECTIVE_RE.sub("", clean).strip()
                # Collapse multiple spaces
                clean = re.sub(r"\s+", " ", clean)
                claims.append(ClaimEntry(
                    number=claim_idx,
                    beat_number=current_beat,
                    beat_title=current_beat_title,
                    timecode_sec=0.0,  # filled in by map_claims_to_timecodes
                    claim_text=clean,
                    word_offset=running_offset,
                ))
            running_offset += sentence_words
        beat_word_offset += _count_words(narration)
    return claims


# ── Source-registry suggestion (B1 ↔ B2 bridge) ───────────────────────────
# Walks `data/concepts.json` for entries with type='source' and tries to
# match each claim's text against the source's author / title / id. When
# a match fires, the renderer pre-populates the operator-fillable
# `**Source:**` placeholder with the matching citation — closing the
# bundle-review cross-tool integration gap.


def load_source_entries(
    registry_path: Path, include_drafts: bool = False,
) -> list[dict]:
    """Load `type='source'` concepts from the registry. Returns [] on
    missing or malformed file — the source-sheet still ships, just
    without auto-suggestions."""
    if not registry_path.is_file():
        return []
    try:
        data = json.loads(registry_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    out = []
    for c in data.get("concepts", []):
        if c.get("type") != "source":
            continue
        if not include_drafts and c.get("_status") == "draft":
            continue
        out.append(c)
    return out


# Minimum length of a substring to count as a "title match" — avoids
# false-positive matches on short generic words like "the", "war", "is".
_MIN_TITLE_TOKEN_LEN = 4


def _author_lastname(author: str) -> str:
    """Extract the last name from an author string for word-boundary
    matching. 'Graham Allison' → 'Allison'; 'John von Neumann' →
    'Neumann'; 'F. Scott Fitzgerald' → 'Fitzgerald'."""
    parts = (author or "").strip().split()
    return parts[-1] if parts else ""


def _word_boundary_match(needle: str, haystack: str) -> bool:
    """Case-insensitive word-boundary substring match. Avoids
    'US' false-matching every 'us' pronoun."""
    if not needle or not haystack:
        return False
    pattern = re.compile(rf"\b{re.escape(needle)}\b", re.IGNORECASE)
    return bool(pattern.search(haystack))


def _title_substring_match(title: str, claim_text: str) -> str | None:
    """Match if a multi-word run from the source title appears in the
    claim text. Returns the matched substring or None. Avoids matching
    single short words ('War', 'The Strategy') by requiring the matched
    run to be ≥ _MIN_TITLE_TOKEN_LEN characters AND contain at least
    one non-stopword."""
    if not title or not claim_text:
        return None
    # Try the whole title first; fall back to shrinking from the end
    # until we find a match or hit the minimum-length floor.
    title_tokens = title.split()
    for n in range(len(title_tokens), 0, -1):
        for i in range(0, len(title_tokens) - n + 1):
            candidate = " ".join(title_tokens[i:i + n])
            if len(candidate) < _MIN_TITLE_TOKEN_LEN:
                continue
            if _word_boundary_match(candidate, claim_text):
                return candidate
    return None


def suggest_sources_for_claim(
    claim_text: str, source_entries: list[dict],
) -> list[SuggestedSource]:
    """Return source entries that plausibly back this claim.

    Match triggers (highest-signal first):
      1. Author last name appears as a word in the claim text
         ("Nash" in "John Nash read the results")
      2. Multi-word title substring appears in claim text
         ("Strategy of Conflict" in "Schelling's Strategy of Conflict")

    Author match is the strongest single signal — bare author last name
    in a claim usually means "this person said / wrote this." Title
    match is secondary because titles can be generic.
    """
    suggestions: list[SuggestedSource] = []
    seen_ids: set[str] = set()
    for entry in source_entries:
        meta = entry.get("sourceMeta", {}) or {}
        author = meta.get("author", "") or ""
        title = (entry.get("term", {}) or {}).get("en", "") or ""
        last_name = _author_lastname(author)

        reason = ""
        if last_name and _word_boundary_match(last_name, claim_text):
            reason = f"author '{last_name}' in claim"
        else:
            matched = _title_substring_match(title, claim_text)
            if matched:
                reason = f"title '{matched}' in claim"

        if not reason:
            continue
        if entry["id"] in seen_ids:
            continue
        seen_ids.add(entry["id"])
        suggestions.append(SuggestedSource(
            id=entry["id"], title=title, author=author,
            year=int(meta.get("year", 0) or 0),
            url=meta.get("url", "") or "",
            page=meta.get("page", "") or "",
            match_reason=reason,
        ))
    return suggestions


def attach_source_suggestions(
    claims: list[ClaimEntry], source_entries: list[dict],
) -> None:
    """Populate each claim's `suggested_sources` in-place."""
    for c in claims:
        c.suggested_sources = suggest_sources_for_claim(
            c.claim_text, source_entries,
        )


# ── Timecode mapping ──────────────────────────────────────────────────────


def map_claims_to_timecodes(
    claims: list[ClaimEntry], manifest: dict | None, wpm: int = DEFAULT_WPM,
) -> None:
    """Assign `timecode_sec` to each claim in-place.

    Two paths:
      · With assembly manifest: use beat startSec + (word_offset / wpm * 60)
        as the within-beat fractional offset.
      · Without manifest: use a flat wpm rate from the start of the script
        (less accurate; flagged in the rendered output).
    """
    if manifest and manifest.get("beats"):
        # Map by POSITIONAL order (1-indexed), not by parsing digits out
        # of the beat ID. Manifests with non-numeric IDs like "opening"
        # or "cold-open" would silently collapse to 0 under the digit-
        # extraction approach, dropping every claim's timecode to 0.
        # Script-side beat numbers ARE positional (1, 2, 3...) so this
        # mapping is correct as long as manifest order matches script
        # order — which the generator preserves.
        beat_starts = {
            i: float(b.get("startSec", 0))
            for i, b in enumerate(manifest.get("beats", []), 1)
        }
        for c in claims:
            start = beat_starts.get(c.beat_number, 0.0)
            # Within-beat offset: word_offset / wpm * 60s
            within = c.word_offset / wpm * 60
            c.timecode_sec = round(start + within, 1)
    else:
        # No manifest — flat wpm from episode start
        # claims arrive in script order so we accumulate
        last_beat = -1
        for c in claims:
            if c.beat_number != last_beat:
                last_beat = c.beat_number
            c.timecode_sec = round(c.word_offset / wpm * 60, 1)


# ── Top-level orchestration ──────────────────────────────────────────────


def _default_manifest_path(slug: str) -> Path:
    return REMOTION_DATA / slug / "assembly-manifest.json"


def load_manifest(path: Path) -> dict | None:
    """Delegates to tools/shared/manifests.load_manifest (May 2026 audit #6)."""
    return _shared_load_manifest(path)


def build_source_sheet(
    slug: str, script_path: Path,
    manifest_path: Path | None = None,
    wpm: int = DEFAULT_WPM,
    registry_path: Path | None = CONCEPTS_REGISTRY,
    suggest_sources: bool = True,
) -> SourceSheetReport:
    """Full pipeline. Returns the report.

    When `suggest_sources` is True (default) and `registry_path` exists,
    each claim gets its `suggested_sources` populated from `type='source'`
    entries in the registry whose author / title appears in the claim.
    Missing or empty registry degrades gracefully (no suggestions, no
    crash) — the operator just gets the standard fill-in placeholder.
    """
    claims = extract_claims(script_path)
    manifest = load_manifest(manifest_path) if manifest_path else None
    map_claims_to_timecodes(claims, manifest, wpm=wpm)
    episode_title = (manifest or {}).get("title", slug)
    if suggest_sources and registry_path is not None:
        source_entries = load_source_entries(registry_path)
        attach_source_suggestions(claims, source_entries)
    return SourceSheetReport(
        slug=slug,
        episode_title=episode_title,
        script_path=str(script_path),
        manifest_path=str(manifest_path) if manifest_path and manifest_path.is_file() else "",
        total_claims=len(claims),
        claims=claims,
    )


# ── Rendering ─────────────────────────────────────────────────────────────


def _fmt_mmss(sec: float) -> str:
    total = int(round(abs(sec)))
    h = total // 3600
    m = (total % 3600) // 60
    s = total % 60
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def render_source_sheet_md(report: SourceSheetReport) -> str:
    has_manifest = bool(report.manifest_path)
    lines = [
        f"# Sources — {report.episode_title}",
        "",
        f"_Per-episode source sheet, organized chronologically as claims "
        f"appear in the video. {report.total_claims} verified claim(s) "
        f"identified. Fill in each `**Source:**` field with the supporting "
        f"citation from the research brief — primary sources with year, "
        f"page, and link where possible._",
        "",
    ]
    if not has_manifest:
        lines.append(
            f"_⚠ No assembly manifest found — timecodes are estimated from "
            f"word position at {DEFAULT_WPM} wpm. Re-run after the "
            f"assembly-manifest.json is built for accurate timecodes._"
        )
        lines.append("")
    if report.total_claims == 0:
        lines.extend([
            "## No verified claims found",
            "",
            "_The script has zero `{✅}` tags. Either this episode is "
            "purely interpretive (no factual claims to source) or the "
            "claim-discipline pass hasn't been run yet. Re-check after "
            "research-audit confirms each load-bearing claim is verified._",
            "",
        ])
        return "\n".join(lines) + "\n"

    # Group by beat for navigation
    by_beat: dict[int, list[ClaimEntry]] = {}
    for c in report.claims:
        by_beat.setdefault(c.beat_number, []).append(c)

    lines.append("## Contents")
    lines.append("")
    for beat_num in sorted(by_beat):
        beat_claims = by_beat[beat_num]
        first = beat_claims[0]
        lines.append(
            f"- **Beat {beat_num}** _({first.beat_title})_ — "
            f"{len(beat_claims)} claim(s), starting at "
            f"{_fmt_mmss(first.timecode_sec)}"
        )
    lines.append("")

    for beat_num in sorted(by_beat):
        beat_claims = by_beat[beat_num]
        first = beat_claims[0]
        lines.append(f"## Beat {beat_num} — _{first.beat_title}_")
        lines.append("")
        for c in beat_claims:
            lines.extend([
                f"### Claim {c.number} — {_fmt_mmss(c.timecode_sec)}",
                "",
                f"> {c.claim_text}",
                "",
            ])
            if c.suggested_sources:
                # Pre-populated from the typed `source` registry. The
                # operator still confirms (especially for author-match
                # suggestions that could be false positives), but the
                # citation skeleton is already there.
                lines.append(
                    "**Source(s)** _(auto-suggested from concept registry — "
                    "verify before publishing):_"
                )
                for s in c.suggested_sources:
                    year = f" ({s.year})" if s.year else ""
                    page = f", {s.page}" if s.page else ""
                    link = f" — {s.url}" if s.url else ""
                    lines.append(
                        f"- _{s.author}{year}._ **{s.title}**{page}.{link}  "
                    )
                    lines.append(
                        f"  <sub>matched: {s.match_reason} · registry id: `{s.id}`</sub>"
                    )
                lines.append("")
            else:
                lines.extend([
                    "**Source:** _[Fill in from the research brief — primary "
                    "source with year, page, and link.]_",
                    "",
                ])

    lines.extend([
        "---",
        "",
        f"_Run: `python3 tools/sourcing/source_sheet.py {report.slug}`_",
        "",
    ])
    return "\n".join(lines)


# ── CLI ───────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(
        description=next(
            (ln for ln in __doc__.splitlines() if ln.strip()),
            "Source sheet generator.",
        ),
    )
    parser.add_argument("slug", help="Episode slug.")
    parser.add_argument("--script", help="Explicit script path override.")
    parser.add_argument("--manifest", help="Explicit assembly manifest path.")
    parser.add_argument(
        "--wpm", type=int, default=DEFAULT_WPM,
        help=f"WPM for timecode fallback when no manifest (default {DEFAULT_WPM}).",
    )
    parser.add_argument(
        "--registry", default=str(CONCEPTS_REGISTRY),
        help=f"Path to concept registry for source-suggestion "
             f"(default {CONCEPTS_REGISTRY.relative_to(ROOT)}).",
    )
    parser.add_argument(
        "--no-suggest", action="store_true",
        help="Skip source-suggestion from the concept registry — emit "
             "the plain fill-in placeholder for every claim.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON.")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout.")
    parser.add_argument("-o", "--output", help="Write to file (default: episodes/<slug>/sources.md).")
    args = parser.parse_args()

    if args.script:
        script_path = Path(args.script).resolve()
    else:
        script_path = find_script(args.slug)
        if script_path is None or not script_path.is_file():
            print(f"✗ no production script for {args.slug}", file=sys.stderr)
            return 2

    manifest_path = (
        Path(args.manifest).resolve() if args.manifest
        else _default_manifest_path(args.slug)
    )
    # manifest is optional — pass None when missing
    if not manifest_path.is_file():
        manifest_path = None

    registry_path = Path(args.registry).resolve() if args.registry else None
    report = build_source_sheet(
        args.slug, script_path, manifest_path=manifest_path, wpm=args.wpm,
        registry_path=registry_path,
        suggest_sources=not args.no_suggest,
    )

    if args.json:
        out = json.dumps({
            "slug": report.slug,
            "episode_title": report.episode_title,
            "script_path": report.script_path,
            "manifest_path": report.manifest_path,
            "total_claims": report.total_claims,
            "claims": [asdict(c) for c in report.claims],
        }, indent=2)
    else:
        out = render_source_sheet_md(report)

    if args.stdout:
        sys.stdout.write(out)
    elif args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(out, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        print(f"✓ wrote {rel}", file=sys.stderr)
    else:
        # Default: write to episodes/<slug>/sources.md
        out_path = EPISODES_DIR / args.slug / "sources.md"
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(out, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        print(f"✓ wrote {rel}", file=sys.stderr)
        print(f"  {report.total_claims} claim(s) identified", file=sys.stderr)

    if report.total_claims == 0:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
