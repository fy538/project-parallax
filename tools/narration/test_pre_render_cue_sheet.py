"""
Unit tests for tools/narration/pre_render_cue_sheet.py.

Coverage:
  · Cue truncation (word-boundary aware, ellipsis on truncation)
  · BeatBlock totals (words + duration)
  · build_cue_sheet (cumulative time accumulation, take indexing)
  · render_cue_sheet_md output structure
  · Real-data regression against the shipped prisoners-dilemma script
  · CLI smoke
"""

from __future__ import annotations

import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import format_for_reading as ffr  # type: ignore[import-not-found]
import pre_render_cue_sheet as cs  # type: ignore[import-not-found]


# ── _truncate_cue ────────────────────────────────────────────────────────────


class TestTruncateCue:
    def test_short_text_returned_as_is(self):
        assert cs._truncate_cue("hello", 60) == "hello"

    def test_long_text_ellipsized(self):
        out = cs._truncate_cue("a b c d e f g h i j k l m n o p q r s t", max_chars=10)
        assert out.endswith("…")

    def test_truncates_at_word_boundary(self):
        text = "alpha beta gamma delta"
        out = cs._truncate_cue(text, max_chars=12)
        # head before "…" should be a sequence of complete words
        head = out.split("…")[0].strip()
        for word in head.split():
            assert word in text.split()

    def test_strips_leading_whitespace(self):
        assert cs._truncate_cue("   hi   ", 60) == "hi"


# ── _fmt_mmss ────────────────────────────────────────────────────────────────


class TestFmtMmss:
    def test_zero(self):
        assert cs._fmt_mmss(0) == "0:00"

    def test_sub_minute(self):
        assert cs._fmt_mmss(22.4) == "0:22"

    def test_rounds(self):
        # 22.6 rounds to 23
        assert cs._fmt_mmss(22.6) == "0:23"

    def test_over_minute(self):
        assert cs._fmt_mmss(125.0) == "2:05"


# ── BeatBlock totals ─────────────────────────────────────────────────────────


class TestBeatBlock:
    def test_total_words_sums(self):
        beat = ffr.Beat(number=1, title="X", timing="")
        rows = [
            cs.CueRow(beat_number=1, take_index=1, cumulative_start_sec=0,
                      word_count=10, target_duration_sec=4.0, cue_text="a"),
            cs.CueRow(beat_number=1, take_index=2, cumulative_start_sec=4,
                      word_count=20, target_duration_sec=8.0, cue_text="b"),
        ]
        block = cs.BeatBlock(beat=beat, rows=rows)
        assert block.total_words == 30
        assert block.total_duration_sec == pytest.approx(12.0)


# ── build_cue_sheet ──────────────────────────────────────────────────────────


class TestBuildCueSheet:
    def _beat(self, num: int, *takes: ffr.Take) -> ffr.Beat:
        b = ffr.Beat(number=num, title=f"B{num}", timing="")
        b.takes = list(takes)
        return b

    def _narration(self, text: str) -> ffr.Take:
        return ffr.Take(kind="narration", text=text, word_count=len(text.split()))

    def test_take_indexed_per_beat_starting_at_one(self):
        b1 = self._beat(1, self._narration("one"), self._narration("two three"))
        b2 = self._beat(2, self._narration("four"))
        blocks = cs.build_cue_sheet([b1, b2], wpm=150)
        assert [r.take_index for r in blocks[0].rows] == [1, 2]
        assert [r.take_index for r in blocks[1].rows] == [1]

    def test_cumulative_time_runs_across_beats(self):
        # 150 words/min = 2.5 words/sec → 1 word = 0.4s
        b1 = self._beat(1, self._narration("a " * 75))   # 75 words ≈ 30s
        b2 = self._beat(2, self._narration("b " * 75))   # next 75 ≈ start at 30
        blocks = cs.build_cue_sheet([b1, b2], wpm=150)
        assert blocks[0].rows[0].cumulative_start_sec == 0
        # First row of beat 2 starts at the cumulative end of beat 1.
        assert blocks[1].rows[0].cumulative_start_sec == pytest.approx(30.0)

    def test_voice_notes_skipped(self):
        b1 = self._beat(1,
            ffr.Take(kind="voice_note", text="slow down"),
            self._narration("hello world"),
            ffr.Take(kind="beat_marker", text="Beat"),
        )
        blocks = cs.build_cue_sheet([b1])
        # Only the narration row produces a CueRow.
        assert len(blocks[0].rows) == 1
        assert blocks[0].rows[0].word_count == 2

    def test_empty_beat_produces_empty_rows(self):
        b1 = self._beat(1)  # no takes
        blocks = cs.build_cue_sheet([b1])
        assert blocks[0].rows == []


# ── render_cue_sheet_md ──────────────────────────────────────────────────────


class TestRenderCueSheetMd:
    @staticmethod
    def _two_beats() -> list[cs.BeatBlock]:
        b1 = ffr.Beat(number=1, title="OPENING", timing="0:00–1:00")
        b2 = ffr.Beat(number=2, title="CLOSE", timing="")
        return [
            cs.BeatBlock(beat=b1, rows=[
                cs.CueRow(beat_number=1, take_index=1, cumulative_start_sec=0,
                          word_count=12, target_duration_sec=4.8,
                          cue_text="Hello world this is the first..."),
            ]),
            cs.BeatBlock(beat=b2, rows=[]),
        ]

    def test_includes_total_summary(self):
        out = cs.render_cue_sheet_md(self._two_beats(), slug="x")
        assert "Total" in out
        assert "12 words" in out

    def test_beat_title_and_timing_present(self):
        out = cs.render_cue_sheet_md(self._two_beats(), slug="x")
        assert "## Beat 1 — OPENING (0:00–1:00)" in out
        assert "## Beat 2 — CLOSE" in out

    def test_take_labels_formatted_as_beat_dot_take(self):
        out = cs.render_cue_sheet_md(self._two_beats(), slug="x")
        assert "**1.1**" in out

    def test_checkbox_column_present(self):
        out = cs.render_cue_sheet_md(self._two_beats(), slug="x")
        assert "☐" in out

    def test_markup_legend_present(self):
        out = cs.render_cue_sheet_md(self._two_beats(), slug="x")
        for symbol in ("✓", "⚠", "𝗫"):
            assert symbol in out

    def test_empty_beat_renders_placeholder(self):
        out = cs.render_cue_sheet_md(self._two_beats(), slug="x")
        assert "no narration takes" in out


# ── Real-data regression ─────────────────────────────────────────────────────


class TestRealScript:
    @pytest.fixture(scope="class")
    def real_blocks(self):
        p = ffr.find_script("prisoners-dilemma")
        if p is None or not p.is_file():
            pytest.skip("prisoners-dilemma script not present")
        beats = ffr.parse_script(p)
        return cs.build_cue_sheet(beats)

    def test_produces_five_beat_blocks(self, real_blocks):
        assert len(real_blocks) == 5

    def test_every_beat_has_at_least_one_take(self, real_blocks):
        # Sanity: each beat in the shipped script should produce ≥1 cue row.
        for block in real_blocks:
            assert len(block.rows) > 0, f"beat {block.beat.number} has no cues"

    def test_total_duration_in_expected_range(self, real_blocks):
        total = sum(b.total_duration_sec for b in real_blocks)
        # Script claims ~14-15 min; our cue-sheet estimate is narration-only
        # (excludes voice notes + beat pauses) at 150 wpm. ~11-15 min band.
        assert 600 < total < 1200, f"total duration {total}s out of expected band"


# ── CLI smoke ────────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_runs_against_explicit_script(self, tmp_path):
        script = tmp_path / "script-production.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — TEST (0:00–0:30)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world. | x |
            | A second sentence. | x |
        """), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "pre_render_cue_sheet.py"),
                "smoke",
                "--script", str(script),
                "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0, result.stderr
        assert "Cue Sheet — smoke" in result.stdout
        assert "**1.1**" in result.stdout
        assert "**1.2**" in result.stdout

    def test_missing_script_exits_2(self):
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "pre_render_cue_sheet.py"),
                "definitely-not-an-episode-xyzzy",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
