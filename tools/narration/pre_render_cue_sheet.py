#!/usr/bin/env python3
"""
pre_render_cue_sheet.py — print-friendly take-log for the recording session.

The operator's paper companion during recording. Lists every narration
take in beat order with a recognizable cue line, word count, estimated
duration, and a checkbox column for live markup (✓ clean / ⚠ re-take /
𝗫 skip). Pros do this on paper for exactly this reason — the DAW is
busy enough during the session that a separate take log keeps the
post-production decisions out of working memory.

The cue sheet is built from the script alone (no manifest dep, no
recorded WAV needed) — generate it the moment a script is locked,
print it, mark it up during the session, use the markup to drive
splice decisions in the DAW + the whisper_alignment pickup list.

Usage:
    python3 tools/narration/pre_render_cue_sheet.py <slug>
    python3 tools/narration/pre_render_cue_sheet.py <slug> --wpm 140
    python3 tools/narration/pre_render_cue_sheet.py <slug> --cue-chars 80
    python3 tools/narration/pre_render_cue_sheet.py <slug> --stdout
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
import format_for_reading as ffr  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"

DEFAULT_WPM = 150
DEFAULT_CUE_CHARS = 60   # length of the recognizable cue snippet


@dataclass
class CueRow:
    """One row of the cue sheet — one narration take."""

    beat_number: int
    take_index: int            # 1-based within the beat (1.1, 1.2, ...)
    cumulative_start_sec: float
    word_count: int
    target_duration_sec: float
    cue_text: str              # short snippet of the take's opening words


@dataclass
class BeatBlock:
    """All cue rows for one beat, plus beat metadata."""

    beat: ffr.Beat
    rows: list[CueRow]

    @property
    def total_words(self) -> int:
        return sum(r.word_count for r in self.rows)

    @property
    def total_duration_sec(self) -> float:
        return sum(r.target_duration_sec for r in self.rows)


# ── Build ────────────────────────────────────────────────────────────────────


def _truncate_cue(text: str, max_chars: int) -> str:
    """Trim to roughly `max_chars`, ending at a word boundary. Adds an
    ellipsis when truncated so the operator visually knows there's more."""
    text = text.strip()
    if len(text) <= max_chars:
        return text
    head = text[:max_chars].rsplit(" ", 1)[0]
    return f"{head}…"


def build_cue_sheet(
    beats: list[ffr.Beat], wpm: int = DEFAULT_WPM, cue_chars: int = DEFAULT_CUE_CHARS,
) -> list[BeatBlock]:
    """Walk every narration take in every beat, emit one CueRow each.

    cumulative_start_sec is computed running across the whole episode so
    the operator can sync any row's start to a stopwatch or the DAW
    timeline during recording — no manifest needed.
    """
    blocks: list[BeatBlock] = []
    cumulative_sec = 0.0
    for beat in beats:
        rows: list[CueRow] = []
        take_n = 0
        for take in beat.takes:
            if take.kind != "narration":
                continue
            take_n += 1
            duration = take.word_count / wpm * 60 if wpm > 0 else 0.0
            rows.append(CueRow(
                beat_number=beat.number,
                take_index=take_n,
                cumulative_start_sec=cumulative_sec,
                word_count=take.word_count,
                target_duration_sec=duration,
                cue_text=_truncate_cue(take.text, cue_chars),
            ))
            cumulative_sec += duration
        blocks.append(BeatBlock(beat=beat, rows=rows))
    return blocks


# ── Render ───────────────────────────────────────────────────────────────────


def _fmt_mmss(seconds: float) -> str:
    """0:22 / 2:04 / 13:16 — minute:second precision (paper-friendly)."""
    total = int(round(seconds))
    return f"{total // 60}:{total % 60:02d}"


def render_cue_sheet_md(
    blocks: list[BeatBlock], slug: str, wpm: int = DEFAULT_WPM,
) -> str:
    total_words = sum(b.total_words for b in blocks)
    total_sec = sum(b.total_duration_sec for b in blocks)
    lines: list[str] = [
        f"# Cue Sheet — {slug}",
        "",
        "> Print this. **Mark each take live**: ✓ clean · ⚠ re-take · 𝗫 skip.",
        f"> Estimates at {wpm} wpm. Cumulative times assume continuous reading "
        f"(no inter-take pauses).",
        "",
        f"**Total:** ~{total_words} words · est. {_fmt_mmss(total_sec)}",
        "",
        "---",
        "",
    ]

    for block in blocks:
        timing = f" ({block.beat.timing})" if block.beat.timing else ""
        lines.append(f"## Beat {block.beat.number} — {block.beat.title}{timing}")
        lines.append("")
        if not block.rows:
            lines.append("_(no narration takes in this beat)_")
            lines.append("")
            continue
        beat_target = _fmt_mmss(block.total_duration_sec)
        lines.append(f"_Beat target: {beat_target} · {block.total_words} words_")
        lines.append("")
        lines.append("| # | At | Cue (first words) | Words | Target | Mark |")
        lines.append("|---|---|---|---|---|---|")
        for row in block.rows:
            label = f"{row.beat_number}.{row.take_index}"
            lines.append(
                f"| **{label}** | {_fmt_mmss(row.cumulative_start_sec)} | "
                f"_\"{row.cue_text}\"_ | {row.word_count} | "
                f"{_fmt_mmss(row.target_duration_sec)} | ☐ |"
            )
        lines.append("")

    lines.extend([
        "---",
        "",
        "## Markup legend",
        "",
        "- **✓** — take was clean; no pickup needed",
        "- **⚠** — minor stumble; mark in DAW for pickup",
        "- **𝗫** — bad take; needs a full re-record (note timestamp)",
        "- **↻N** — did N takes of this line (most recent wins)",
        "",
        f"_Regenerate after script edits: `python3 tools/narration/pre_render_cue_sheet.py {slug}`_",
    ])
    return "\n".join(lines) + "\n"


# ── CLI ──────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument(
        "slug", nargs="?",
        help="Episode slug (resolves to episodes/<slug>/script-*.md).",
    )
    parser.add_argument("--script", help="Explicit script path.")
    parser.add_argument(
        "--wpm", type=int, default=DEFAULT_WPM,
        help=f"Words per minute for duration estimates (default: {DEFAULT_WPM}).",
    )
    parser.add_argument(
        "--cue-chars", type=int, default=DEFAULT_CUE_CHARS,
        help=f"Length of the cue snippet per take (default: {DEFAULT_CUE_CHARS}).",
    )
    parser.add_argument("-o", "--output", help="Output path (default: episodes/<slug>/cue-sheet.md).")
    parser.add_argument("--stdout", action="store_true", help="Write to stdout.")
    args = parser.parse_args()

    if args.script:
        script_path = Path(args.script).resolve()
        slug = args.slug or script_path.parent.name
    else:
        if not args.slug:
            print("✗ provide either a slug or --script <path>", file=sys.stderr)
            return 2
        slug = args.slug
        found = ffr.find_script(slug)
        if not found:
            print(f"✗ no script found for {slug}", file=sys.stderr)
            return 2
        script_path = found

    if not script_path.is_file():
        print(f"✗ script not found: {script_path}", file=sys.stderr)
        return 2

    beats = ffr.parse_script(script_path)
    if not beats:
        print(f"✗ no beats parsed from {script_path}", file=sys.stderr)
        return 1

    blocks = build_cue_sheet(beats, wpm=args.wpm, cue_chars=args.cue_chars)
    rendered = render_cue_sheet_md(blocks, slug=slug, wpm=args.wpm)

    if args.stdout:
        sys.stdout.write(rendered)
        return 0

    out_path = (
        Path(args.output).resolve()
        if args.output
        else EPISODES_DIR / slug / "cue-sheet.md"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(rendered, encoding="utf-8")
    rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
    total_rows = sum(len(b.rows) for b in blocks)
    print(f"✓ wrote {rel}")
    print(f"  {len(blocks)} beat(s) · {total_rows} take cue(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
