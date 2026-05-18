#!/usr/bin/env python3
"""
format_for_reading.py — convert a two-column production script into a
teleprompter-friendly read-doc.

Strips everything Tiger doesn't read aloud (visual-column production specs,
DIR/PACE annotations, claim-verification tags) and lays the narration out
as one-paragraph-per-take chunks with sentence-boundary breath marks. Per
beat header includes word count + estimated runtime at 150 wpm so the
narrator knows the pacing budget before recording.

Input:  episodes/<slug>/script-production.md  (or script-v*-production.md)
Output: episodes/<slug>/narration-readable.md (default; override with -o)

Usage:
    python3 tools/narration/format_for_reading.py <slug>
    python3 tools/narration/format_for_reading.py <slug> -o /tmp/read.md
    python3 tools/narration/format_for_reading.py --script <path-to-script>
    python3 tools/narration/format_for_reading.py <slug> --wpm 140
    python3 tools/narration/format_for_reading.py <slug> --no-breath-marks

Why this exists: a 2,800-word two-column production script is a *production
document*, not a *reading document*. Trying to narrate from it forces the
operator's eye to dodge visual specs, DIR lines, and claim tags every
sentence. The result is uneven cadence and missed pickups. This tool
produces the read-doc — sentences only, breath marks, beat-by-beat pacing
budget, voice-note context preserved as italicized stage directions.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"

# Words per minute for runtime estimation. 150 is the empirically-observed
# Parallax target (matches the assembly manifest's estimate-mode default).
DEFAULT_WPM = 150

# Strip these inline tags from narration before display. They're production
# metadata, not text to read aloud.
CLAIM_TAG_RE = re.compile(r"\{(?:✅|⚠️|NEW|❌)\}")
# Voice notes are kept as italic stage directions, but stripped of the
# wrapping markdown emphasis so the formatter can re-render them cleanly.
VOICE_NOTE_RE = re.compile(r"^\s*\*\(\s*Voice note:\s*(.*?)\s*\)\*\s*$", re.IGNORECASE)
# Beat / pause markers stay visible but get distinct rendering.
BEAT_MARKER_RE = re.compile(r"^\s*\*\[\s*(Beat|Pause)\.?\s*\]\*\s*$", re.IGNORECASE)
# Beat header: ## BEAT 1 — TITLE (0:00–3:30)  [optional <!-- MARKER -->]
# The trailing `(?:\s*<!--.*?-->)?` absorbs psychology-structural-marker
# comments that real shipped scripts carry (e.g.
# `## BEAT 3 — THE WRONG GAME (7:30–11:30) <!-- [FRAMEWORK UNLOCK] -->`).
# Without it the lazy `(.+?)` for title expanded to swallow both the parens
# and the comment, leaving the timing capture empty and the title polluted
# with the literal HTML marker — visible to the operator in every
# downstream tool that displays beat.title (cue sheet, take comparison, etc.).
BEAT_HEADER_RE = re.compile(
    r"^##\s+BEAT\s+(\d+)\s*[—–-]\s*(.+?)"
    r"(?:\s*\((.+?)\))?"            # optional (timing)
    r"(?:\s*<!--.*?-->)*\s*$",      # zero or more trailing HTML markers
    re.IGNORECASE,
)
# Skip the asset summary table + anything after it — narration ends at the
# last beat. The asset summary always sits below all beats and contains no
# narration content.
ASSET_SUMMARY_HEADER_RE = re.compile(r"^##\s+ASSET\s+SUMMARY", re.IGNORECASE)
# Sentence-end pattern: [.!?] optionally followed by a closing quote, then
# whitespace, then a sentence-start character (capital letter or opening
# quote). Captures the punctuation+quote chunk in group(1) so the splitter
# can rejoin cleanly without losing the closing quote. We use a regular
# lookahead (not a fixed-width lookbehind) because the punctuation chunk
# is variable-length: we need to absorb both `works.` and `works."` and
# the lookbehind syntax can't handle the optional closing quote.
#
# Quote class covers both straight ASCII (`"`, `'`) and the curly typographic
# variants (`“`, `”`, `‘`, `’`) that Word / iA Writer / iA Pages emit by
# default. Without the curly variants, sentences ending in `works.”` (Word-
# autocorrected) wouldn't trip the boundary and missed the breath mark.
SENTENCE_END_RE = re.compile(r"([.!?][\"'“”‘’]?)(\s+)(?=[\"'“”‘’A-Z])")
# Common abbreviations where the period doesn't end a sentence. The
# breath-mark inserter checks the trailing token against this set to
# avoid splitting "Dr. Smith" or "U.S. policy". Add new entries as
# false positives surface during real recordings — especially Latin
# abbreviations and geopolitics-relevant country/region codes (Parallax
# scripts reference PRC, USSR, UAE etc. with periods more than most
# channels would).
ABBREV_PREFIXES = {
    "Mr.", "Mrs.", "Ms.", "Dr.", "Prof.", "Sr.", "Jr.",
    "Pres.", "Sec.", "Gen.", "Sgt.", "Capt.", "Rev.", "Hon.",
    "vs.", "etc.", "i.e.", "e.g.", "cf.", "ca.", "viz.", "fl.",
    "U.S.", "U.K.", "U.N.", "E.U.", "U.A.E.", "U.S.S.R.", "P.R.C.",
    "St.", "No.", "Inc.", "Ltd.", "Co.", "Corp.",
}


@dataclass
class Take:
    """One readable chunk of narration. Typically one paragraph, but can be
    a stage direction or beat marker, which renders differently."""

    kind: str          # "narration" | "voice_note" | "beat_marker" | "blank"
    text: str          # the readable content (post-strip)
    word_count: int = 0


@dataclass
class Beat:
    """One numbered beat from the script."""

    number: int
    title: str
    timing: str          # "0:00–3:30" or "" if not specified
    takes: list[Take] = field(default_factory=list)

    @property
    def word_count(self) -> int:
        return sum(t.word_count for t in self.takes if t.kind == "narration")


# ── Script discovery ─────────────────────────────────────────────────────────


def find_script(slug: str) -> Path | None:
    """Return the canonical or latest versioned production script for `slug`.

    Resolution order matches what `pipeline_validator._detect_script_version`
    does: canonical `script-production.md` first, then the highest
    `script-vN-production.md`. Returns None if nothing matches.
    """
    ep_dir = EPISODES_DIR / slug
    canonical = ep_dir / "script-production.md"
    if canonical.is_file():
        return canonical
    versioned = sorted(ep_dir.glob("script-v*-production.md"))
    return versioned[-1] if versioned else None


# ── Parsing ──────────────────────────────────────────────────────────────────


def _strip_table_cell(text: str) -> str:
    """Trim leading/trailing pipes and whitespace from a markdown table cell."""
    return text.strip().strip("|").strip()


def _split_table_row(line: str) -> list[str] | None:
    """Return the cells of a markdown table row, or None if the line isn't one.

    Conservative: a "row" is a line starting with `|` and containing at least
    two `|` characters (so a single-pipe text line isn't misread)."""
    s = line.rstrip("\n")
    if not s.lstrip().startswith("|"):
        return None
    if s.count("|") < 2:
        return None
    # Drop leading/trailing pipes, split on inner ones.
    inner = s.strip().strip("|")
    return [c.strip() for c in inner.split("|")]


def _is_table_separator(line: str) -> bool:
    """Markdown table separator row: |---|---|, |:--|--:|, etc."""
    cells = _split_table_row(line)
    if cells is None:
        return False
    return all(re.fullmatch(r":?-{2,}:?", c.strip()) for c in cells)


def _is_narration_header(cells: list[str]) -> bool:
    """The header row of a NARRATION/VISUAL table."""
    return (
        len(cells) >= 2
        and cells[0].upper() == "NARRATION"
        and "VISUAL" in cells[1].upper()
    )


def _clean_narration_cell(text: str) -> str:
    """Drop claim tags, normalize whitespace. Caller decides what to do with empty."""
    cleaned = CLAIM_TAG_RE.sub("", text)
    # Collapse multiple spaces; preserve em-dashes and quotes.
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def _count_words(text: str) -> int:
    """Word count for runtime estimation. Splits on whitespace, drops
    pure-punctuation tokens."""
    return sum(1 for tok in text.split() if re.search(r"\w", tok))


def _add_breath_marks(text: str) -> str:
    """Insert ` /// ` between sentences in a paragraph, respecting common
    abbreviations. The reader uses these as breath/pause cues."""
    parts: list[str] = []
    last_idx = 0
    for m in SENTENCE_END_RE.finditer(text):
        # Find the word ending at the punctuation+quote chunk (m.end(1)).
        # That word is everything from the previous space up to m.end(1).
        word_start = text.rfind(" ", 0, m.start()) + 1
        prev_token = text[word_start:m.end(1)]
        if prev_token in ABBREV_PREFIXES:
            continue
        # Emit text up to end of punctuation, the breath mark, then continue
        # past the inter-sentence whitespace.
        parts.append(text[last_idx:m.end(1)])
        parts.append(" /// ")
        last_idx = m.end()
    parts.append(text[last_idx:])
    return "".join(parts)


def parse_script(script_path: Path) -> list[Beat]:
    """Parse a two-column production script into a sequence of Beats.

    Walks the markdown line-by-line. Tracks current beat from `## BEAT N`
    headers. Inside each beat, recognizes NARRATION/VISUAL table rows and
    extracts the narration cell. Stops at the ASSET SUMMARY section.
    Voice notes, beat markers, and continuation lines are preserved with
    their distinct rendering kind.
    """
    beats: list[Beat] = []
    current: Beat | None = None
    inside_table = False  # we just saw a NARRATION/VISUAL header row

    for raw_line in script_path.read_text(encoding="utf-8").splitlines():
        # End of script content — stop parsing.
        if ASSET_SUMMARY_HEADER_RE.match(raw_line):
            break

        # New beat?
        bm = BEAT_HEADER_RE.match(raw_line)
        if bm:
            current = Beat(
                number=int(bm.group(1)),
                title=bm.group(2).strip(),
                timing=bm.group(3).strip() if bm.group(3) else "",
            )
            beats.append(current)
            inside_table = False
            continue

        if current is None:
            continue  # frontmatter / pre-beat material

        cells = _split_table_row(raw_line)
        if cells is None:
            inside_table = False
            continue
        if _is_table_separator(raw_line):
            continue
        if _is_narration_header(cells):
            inside_table = True
            continue
        if not inside_table:
            continue
        # Real NARRATION/VISUAL rows always have two cells. Single-cell
        # rows (e.g. `| **TRANSITION** · TitleTransition · ... |`) are
        # production metadata, not narration — skip.
        if len(cells) < 2:
            continue

        narration = _clean_narration_cell(cells[0])
        if not narration:
            # Empty narration cell — usually a DIR/PACE continuation row.
            # We don't surface these to the reader.
            continue

        # Voice notes → stage direction, preserved as italic.
        vn = VOICE_NOTE_RE.match(narration)
        if vn:
            current.takes.append(Take(kind="voice_note", text=vn.group(1).strip()))
            continue

        # Beat / pause markers.
        bm2 = BEAT_MARKER_RE.match(narration)
        if bm2:
            current.takes.append(Take(kind="beat_marker", text=bm2.group(1).capitalize()))
            continue

        # Otherwise: narration text. Word-count for budget.
        wc = _count_words(narration)
        current.takes.append(Take(kind="narration", text=narration, word_count=wc))

    return beats


# ── Rendering ────────────────────────────────────────────────────────────────


def _format_runtime(words: int, wpm: int) -> str:
    """Words → mm:ss string. Handles sub-minute beats cleanly."""
    if wpm <= 0:
        return "?:??"
    total_seconds = round(words / wpm * 60)
    minutes, seconds = divmod(total_seconds, 60)
    return f"{minutes}:{seconds:02d}"


def render_read_doc(
    beats: list[Beat], slug: str, wpm: int = DEFAULT_WPM, breath_marks: bool = True,
) -> str:
    """Return the formatted narration markdown."""
    total_words = sum(b.word_count for b in beats)
    total_runtime = _format_runtime(total_words, wpm)

    lines: list[str] = [
        f"# Narration — {slug}",
        "",
        "> Auto-generated by `tools/narration/format_for_reading.py`. **Do not hand-edit** —",
        "> regenerate from the production script after every script change.",
        ">",
        f"> Read at ~{wpm} wpm. `///` marks sentence boundaries (breath cues).",
        "> _Italic lines_ are stage directions — do **not** read aloud.",
        "> `[BEAT]` / `[PAUSE]` lines mean a deliberate silence — count one or two seconds.",
        "",
        f"**Episode total:** ~{total_words} words · est. {total_runtime} at {wpm} wpm",
        "",
        "---",
        "",
    ]

    for beat in beats:
        timing = f" ({beat.timing})" if beat.timing else ""
        lines.append(f"## Beat {beat.number} — {beat.title}{timing}")
        lines.append("")
        lines.append(
            f"_~{beat.word_count} words · est. {_format_runtime(beat.word_count, wpm)} at {wpm} wpm_"
        )
        lines.append("")
        for take in beat.takes:
            if take.kind == "voice_note":
                lines.append(f"_(voice note: {take.text})_")
                lines.append("")
            elif take.kind == "beat_marker":
                lines.append(f"**[{take.text.upper()} — short pause]**")
                lines.append("")
            elif take.kind == "narration":
                text = _add_breath_marks(take.text) if breath_marks else take.text
                lines.append(text)
                lines.append("")

        lines.append("---")
        lines.append("")

    lines.append(
        f"_Regenerate: `python3 tools/narration/format_for_reading.py {slug}`_"
    )
    return "\n".join(lines) + "\n"


# ── CLI ──────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument(
        "slug",
        nargs="?",
        help="Episode slug (resolves to episodes/<slug>/script-*.md).",
    )
    parser.add_argument(
        "--script",
        help="Explicit path to a production script (overrides slug resolution).",
    )
    parser.add_argument(
        "-o",
        "--output",
        help="Output path (default: episodes/<slug>/narration-readable.md).",
    )
    parser.add_argument(
        "--wpm",
        type=int,
        default=DEFAULT_WPM,
        help=f"Words-per-minute for runtime estimates (default: {DEFAULT_WPM}).",
    )
    parser.add_argument(
        "--no-breath-marks",
        action="store_true",
        help="Omit `///` sentence-boundary breath cues.",
    )
    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Write to stdout instead of a file (useful for piping).",
    )
    args = parser.parse_args()

    if args.script:
        script_path = Path(args.script).resolve()
        # Infer slug for the title and the default output path.
        slug = args.slug or script_path.parent.name
    else:
        if not args.slug:
            print("✗ provide either a slug or --script <path>", file=sys.stderr)
            return 2
        slug = args.slug
        script_path = find_script(slug)
        if not script_path:
            print(f"✗ no script found for {slug} "
                  f"(looked for script-production.md / script-v*-production.md)",
                  file=sys.stderr)
            return 2

    if not script_path.is_file():
        print(f"✗ script not found: {script_path}", file=sys.stderr)
        return 2

    beats = parse_script(script_path)
    if not beats:
        print(f"✗ no beats parsed from {script_path}. "
              f"Is the script in two-column NARRATION/VISUAL format?",
              file=sys.stderr)
        return 1

    rendered = render_read_doc(
        beats, slug=slug, wpm=args.wpm, breath_marks=not args.no_breath_marks
    )

    if args.stdout:
        sys.stdout.write(rendered)
        return 0

    out_path = (
        Path(args.output).resolve()
        if args.output
        else EPISODES_DIR / slug / "narration-readable.md"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(rendered, encoding="utf-8")

    total_words = sum(b.word_count for b in beats)
    print(f"✓ wrote {out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path}")
    print(f"  {len(beats)} beat(s) · ~{total_words} words · "
          f"est. {_format_runtime(total_words, args.wpm)} at {args.wpm} wpm")
    return 0


if __name__ == "__main__":
    sys.exit(main())
