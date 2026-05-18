#!/usr/bin/env python3
"""
youtube_description.py — generate the YouTube description from manifest + script.

Every episode needs the same description shape: hook, summary, chapter
markers, concept callbacks, sources, channel footer. The assembly
manifest already has beat boundaries and titles; the concept registry
already has callback opportunities; the script already has source
tags. This tool wires them together into a copy-paste-ready
description.

What it auto-generates:
  · Chapter markers from `assembly-manifest.beats[]` (M:SS Title)
  · Concept callback section from the registry (concepts this episode
    introduced or reused, with episode cross-refs)
  · Sources section from script `{✅}` claim tags (placeholder per-claim
    until the operator fills in citations)
  · Standard Parallax channel footer

What stays as placeholders (editorial work):
  · The hook line (1-2 sentences)
  · The summary paragraph
  · Per-source citation text

Chapter markers follow YouTube's spec: at least 3 markers, first must
be at 0:00, format is `M:SS Title` or `MM:SS Title`. Chapter titles
strip the BEAT N prefix since the YouTube UI already numbers them.

Usage:
    python3 tools/publish/youtube_description.py <slug>
    python3 tools/publish/youtube_description.py <slug> --include-intro
    python3 tools/publish/youtube_description.py <slug> --json
    python3 tools/publish/youtube_description.py <slug> -o desc.md

Exit codes:
    0 — description generated
    1 — manifest had insufficient beat data for YouTube chapter spec
    2 — usage / missing inputs
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"
REMOTION_DATA = ROOT / "remotion-templates" / "data" / "episodes"
CONCEPTS_PATH = ROOT / "data" / "concepts.json"

# ── Tunables ─────────────────────────────────────────────────────────────────

# YouTube chapter spec: minimum 3 chapters, first must be at 0:00.
YOUTUBE_MIN_CHAPTERS = 3

# Cap chapter title length — YouTube truncates long titles in some UIs.
CHAPTER_TITLE_MAX_LEN = 60

# Max concepts to display in the description before the "…and N more"
# footer kicks in. YouTube descriptions have a 5000-char hard cap and a
# 157-char "above the fold" line; an episode introducing 20+ concepts
# would otherwise produce a wall of bullets that pushes the chapters
# section past the fold.
MAX_CONCEPTS_DISPLAYED = 8

# Known acronyms that should NOT be title-cased. The title-case rule
# (applied when input is ALL CAPS) would otherwise mangle these to
# "Wto", "Tsmc", "Ussr". This list covers the geopolitics-relevant
# acronyms Parallax content uses; extend as needed.
PRESERVED_ACRONYMS = {
    "US", "USA", "UK", "EU", "UN", "NATO", "USSR", "PRC", "CCP",
    "WTO", "WHO", "IMF", "OECD", "OPEC", "GDP",
    "AI", "ML", "GPU", "CPU", "TSMC", "RAND", "MIT", "MIT",
    "TLDR", "DNA", "RNA", "FBI", "CIA", "NSA", "FDA",
}

# Standard channel footer. Edit here, not per-episode.
CHANNEL_FOOTER = """\
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Parallax — viewing the same object from different analytical positions.

Long-form analytical essays on contemporary geopolitics through historical
analogy and philosophical frameworks. Structural patterns across civilizations,
presented as heuristic lenses rather than predictions.

▸ Subscribe for episodes that take time to land: youtube.com/@parallax
▸ Discuss: discord.gg/parallax (or wherever the community lives)
▸ Sources, transcripts, and revision notes for every episode: parallax.video"""


# ── Data shapes ──────────────────────────────────────────────────────────────


@dataclass
class Chapter:
    """One YouTube chapter marker."""
    timestamp: str       # "M:SS" or "MM:SS"
    title: str           # cleaned, ≤ CHAPTER_TITLE_MAX_LEN chars
    start_sec: float     # the source seconds (for verification)


@dataclass
class ConceptCallback:
    """A concept this episode introduced or reused, with cross-refs."""
    term: str            # display term
    introduced_in: str   # episode slug where first introduced
    is_introduction: bool  # True if this episode introduces it


@dataclass
class DescriptionPayload:
    slug: str
    episode_title: str
    total_duration_sec: float
    chapters: list[Chapter] = field(default_factory=list)
    concepts: list[ConceptCallback] = field(default_factory=list)
    source_tag_count: int = 0


# ── Manifest + script loaders ───────────────────────────────────────────────


def _default_manifest_path(slug: str) -> Path:
    return REMOTION_DATA / slug / "assembly-manifest.json"


def _fmt_timestamp(seconds: float) -> str:
    """M:SS or MM:SS or H:MM:SS per YouTube spec. Always shows seconds
    zero-padded."""
    total = int(round(seconds))
    h = total // 3600
    m = (total % 3600) // 60
    s = total % 60
    if h > 0:
        return f"{h}:{m:02d}:{s:02d}"
    return f"{m}:{s:02d}"


def _clean_chapter_title(raw: str) -> str:
    """Strip BEAT prefix, ALL-CAPS shouting, and excess punctuation.
    YouTube's UI numbers chapters automatically; we don't need to.

    Order matters: strip the "Beat N — " prefix FIRST, then apply
    title-case to whatever remains. Doing title-case first would leave
    the inner title in shouting CAPS even after the prefix was removed.

    Title-case respects PRESERVED_ACRONYMS — `"THE WTO TRAP"` becomes
    `"The WTO Trap"`, not `"The Wto Trap"`.
    """
    s = raw.strip()
    # Strip leading "Beat N — " / "Beat N: " patterns
    s = re.sub(r"^Beat\s+\d+\s*[—:\-]\s*", "", s, flags=re.IGNORECASE)
    # Title case if all upper-case (post-prefix-strip), then restore
    # known acronyms word-by-word. The PRESERVED_ACRONYMS pass below
    # handles 2-3 letter acronyms (US/WTO/AI/TSMC) so we can title-case
    # short shouting words like "MID" → "Mid".
    if s.upper() == s and len(s) >= 2:
        # Title-case each whitespace-separated word, then re-capitalize
        # any word that matches a preserved acronym (case-insensitive).
        title_cased = " ".join(
            (w.upper() if w.upper() in PRESERVED_ACRONYMS else w.capitalize())
            for w in s.split()
        )
        s = title_cased
    if len(s) > CHAPTER_TITLE_MAX_LEN:
        s = s[: CHAPTER_TITLE_MAX_LEN - 1].rstrip() + "…"
    return s


def build_chapters(
    manifest: dict, include_intro: bool = True,
) -> list[Chapter]:
    """Build chapter markers from manifest.beats[].

    YouTube chapter spec invariants enforced here:
      · First chapter MUST be at 0:00 (else YouTube silently disables
        the chapter UI for the whole video).
      · Each chapter timestamp must be unique. Duplicate timestamps
        also silently disable chapters. Beats that share a startSec are
        deduped here (first wins, later one logged via the rationale).

    If the first beat starts after 0:00 (an intro/cold-open precedes it),
    prepend a synthetic 'Intro' chapter when `include_intro=True`.
    """
    beats = manifest.get("beats", [])
    chapters: list[Chapter] = []
    if not beats:
        return chapters

    first_start = float(beats[0].get("startSec", 0))
    if include_intro and first_start > 1.0:
        chapters.append(Chapter(timestamp="0:00", title="Intro", start_sec=0.0))

    seen_timestamps: set[str] = {c.timestamp for c in chapters}
    for b in beats:
        start = float(b.get("startSec", 0))
        # YouTube spec: first chapter MUST be at 0:00. Snap if we're not
        # including an intro and the first beat is close to zero.
        if not chapters and start < 1.0:
            start = 0.0
        title_raw = b.get("title")
        # Fall back to a chapter number rather than "Beat <id>" so
        # `_clean_chapter_title` doesn't produce literals like "beat3".
        if not title_raw:
            title_raw = f"Chapter {len(chapters) + 1}"
        timestamp = _fmt_timestamp(start)
        if timestamp in seen_timestamps:
            # Dedupe — skip this beat entirely. Two beats sharing a
            # timestamp would silently disable YouTube chapters.
            print(
                f"⚠ youtube_description: beat {b.get('id', '?')} at "
                f"{timestamp} duplicates an earlier chapter — skipped.",
                file=sys.stderr,
            )
            continue
        seen_timestamps.add(timestamp)
        chapters.append(Chapter(
            timestamp=timestamp,
            title=_clean_chapter_title(title_raw),
            start_sec=start,
        ))

    # Ensure first chapter is exactly "0:00"
    if chapters and chapters[0].timestamp != "0:00":
        chapters[0] = Chapter(
            timestamp="0:00", title=chapters[0].title, start_sec=0.0,
        )

    return chapters


# ── Concept callbacks ───────────────────────────────────────────────────────


def load_concepts(path: Path = CONCEPTS_PATH) -> list[dict]:
    """Load the concept registry. Returns [] on missing or malformed file."""
    if not path.is_file():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data.get("concepts", [])
    except (json.JSONDecodeError, OSError):
        return []


def find_episode_concepts(slug: str, concepts: list[dict]) -> list[ConceptCallback]:
    """Find concepts INTRODUCED by this slug or that appear in it."""
    out: list[ConceptCallback] = []
    for c in concepts:
        intro = c.get("introduced", {})
        intro_slug = intro.get("episode", "")
        term = (c.get("term", {}) or {}).get("en", "") or c.get("id", "")
        if not term:
            continue
        # Introduced by this episode
        if intro_slug == slug:
            out.append(ConceptCallback(
                term=term, introduced_in=slug, is_introduction=True,
            ))
            continue
        # Appears in this episode (callback from prior episode)
        for app in c.get("appearances", []):
            if app.get("episode") == slug:
                out.append(ConceptCallback(
                    term=term, introduced_in=intro_slug,
                    is_introduction=False,
                ))
                break
    return out


# ── Script source-tag counter ───────────────────────────────────────────────


_SOURCE_TAG_RE = re.compile(r"\{✅\}")


def count_source_tags(script_path: Path) -> int:
    """Count {✅} tags in a production script — these mark verified claims
    that should have inline citations in the description."""
    try:
        text = script_path.read_text(encoding="utf-8")
    except OSError:
        return 0
    return len(_SOURCE_TAG_RE.findall(text))


# ── Top-level ───────────────────────────────────────────────────────────────


def build_description(
    slug: str, manifest_path: Path, script_path: Optional[Path] = None,
    concepts_path: Path = CONCEPTS_PATH, include_intro: bool = True,
) -> DescriptionPayload:
    """Assemble all the data the description renderer needs."""
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    chapters = build_chapters(manifest, include_intro=include_intro)
    concepts = find_episode_concepts(slug, load_concepts(concepts_path))
    source_count = count_source_tags(script_path) if script_path else 0
    return DescriptionPayload(
        slug=slug,
        episode_title=manifest.get("title", slug),
        total_duration_sec=float(manifest.get("totalDurationSec", 0)),
        chapters=chapters, concepts=concepts,
        source_tag_count=source_count,
    )


# ── Rendering ───────────────────────────────────────────────────────────────


def render_description(payload: DescriptionPayload) -> str:
    """Render the final YouTube description (copy-paste ready)."""
    lines: list[str] = []

    # Hook + summary (placeholders — editorial work)
    lines.extend([
        "[HOOK: one or two sentences that promise the structural reveal — "
        "use the angle-memo's primary cold-open as a starting point]",
        "",
        "[SUMMARY: one paragraph on what the episode argues and why it "
        "matters. Pull from the brief.md TL;DR.]",
        "",
    ])

    # Chapters
    if payload.chapters:
        lines.append("📺 Chapters:")
        for c in payload.chapters:
            lines.append(f"{c.timestamp} {c.title}")
        lines.append("")

    # Concept callbacks. Cap each section at MAX_CONCEPTS_DISPLAYED with
    # an "…and N more" footer so episodes that introduce 20+ concepts
    # don't push the chapters section past YouTube's above-the-fold.
    if payload.concepts:
        intros = [c for c in payload.concepts if c.is_introduction]
        callbacks = [c for c in payload.concepts if not c.is_introduction]
        if intros:
            lines.append("📚 Concepts introduced in this episode:")
            for c in intros[:MAX_CONCEPTS_DISPLAYED]:
                lines.append(f"• {c.term}")
            extra = len(intros) - MAX_CONCEPTS_DISPLAYED
            if extra > 0:
                lines.append(f"• …and {extra} more (full list at parallax.video)")
            lines.append("")
        if callbacks:
            lines.append("🔗 Callbacks to earlier episodes:")
            for c in callbacks[:MAX_CONCEPTS_DISPLAYED]:
                lines.append(f"• {c.term} (introduced in: {c.introduced_in})")
            extra = len(callbacks) - MAX_CONCEPTS_DISPLAYED
            if extra > 0:
                lines.append(f"• …and {extra} more")
            lines.append("")

    # Sources placeholder
    if payload.source_tag_count > 0:
        lines.extend([
            "📖 Sources:",
            f"[Script contains {payload.source_tag_count} verified-claim tags. "
            f"Fill in the per-claim citations from the research brief — "
            f"primary sources with year, page, and link where possible.]",
            "",
            "1. [...]",
            "2. [...]",
            "",
        ])

    # Channel footer
    lines.append(CHANNEL_FOOTER)
    lines.append("")
    return "\n".join(lines)


# ── CLI ─────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", help="Episode slug.")
    parser.add_argument("--manifest", help="Explicit assembly manifest path.")
    parser.add_argument(
        "--script", help="Explicit script path (for source-tag counting).",
    )
    parser.add_argument(
        "--include-intro", action="store_true", default=True,
        help="Prepend a synthetic 0:00 'Intro' chapter if the first beat "
             "starts after 0:00 (default: on).",
    )
    parser.add_argument(
        "--no-intro", dest="include_intro", action="store_false",
        help="Disable the synthetic Intro chapter — useful if Beat 1 "
             "already starts at 0:00.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON payload.")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout.")
    parser.add_argument("-o", "--output", help="Write description to file.")
    args = parser.parse_args()

    manifest_path = (
        Path(args.manifest).resolve() if args.manifest
        else _default_manifest_path(args.slug)
    )
    if not manifest_path.is_file():
        print(f"✗ assembly manifest not found: {manifest_path}", file=sys.stderr)
        return 2

    script_path: Optional[Path] = None
    if args.script:
        script_path = Path(args.script).resolve()
        if not script_path.is_file():
            print(f"✗ script not found: {script_path}", file=sys.stderr)
            return 2
    else:
        # Try the canonical script-production.md location
        candidate = EPISODES_DIR / args.slug / "script-production.md"
        if candidate.is_file():
            script_path = candidate

    payload = build_description(
        args.slug, manifest_path, script_path=script_path,
        include_intro=args.include_intro,
    )

    if len(payload.chapters) < YOUTUBE_MIN_CHAPTERS:
        print(
            f"⚠ only {len(payload.chapters)} chapters — YouTube requires "
            f"at least {YOUTUBE_MIN_CHAPTERS} for chapter UI to enable.",
            file=sys.stderr,
        )

    if args.json:
        out = json.dumps({
            "slug": payload.slug,
            "episode_title": payload.episode_title,
            "total_duration_sec": payload.total_duration_sec,
            "chapters": [asdict(c) for c in payload.chapters],
            "concepts": [asdict(c) for c in payload.concepts],
            "source_tag_count": payload.source_tag_count,
        }, indent=2)
    else:
        out = render_description(payload)

    if args.stdout or not args.output:
        sys.stdout.write(out)
    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(out, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        if not args.stdout:
            print(f"✓ wrote {rel}", file=sys.stderr)

    if len(payload.chapters) < YOUTUBE_MIN_CHAPTERS:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
