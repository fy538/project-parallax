"""
Unit tests for tools/narration/format_for_reading.py.

Cover the parsing pipeline (markdown two-column tables → Beats), the
narration-cell cleaner (claim tags, voice notes, beat markers), the
sentence-boundary breath-mark inserter (respecting common abbreviations),
and the end-to-end render plus CLI smoke against the real shipped
prisoners-dilemma script.
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


# ── _clean_narration_cell ─────────────────────────────────────────────────────


class TestCleanNarrationCell:
    def test_strips_check_tag(self):
        assert ffr._clean_narration_cell("They cooperated 60% of the time. {✅}") \
            == "They cooperated 60% of the time."

    def test_strips_warning_tag(self):
        assert ffr._clean_narration_cell("Likely true. {⚠️}") == "Likely true."

    def test_strips_new_tag(self):
        assert ffr._clean_narration_cell("Brand-new claim. {NEW}") == "Brand-new claim."

    def test_strips_multiple_tags_in_one_cell(self):
        text = "First fact {✅} and second fact {⚠️} and third {NEW}."
        assert ffr._clean_narration_cell(text) == "First fact and second fact and third ."

    def test_collapses_whitespace(self):
        assert ffr._clean_narration_cell("Foo   bar\nbaz") == "Foo bar baz"

    def test_empty_input_returns_empty(self):
        assert ffr._clean_narration_cell("") == ""


# ── _add_breath_marks ────────────────────────────────────────────────────────


class TestBreathMarks:
    def test_inserts_between_sentences(self):
        text = "Foo bar. Baz qux. Quux."
        out = ffr._add_breath_marks(text)
        assert out == "Foo bar. /// Baz qux. /// Quux."

    def test_respects_common_abbreviations(self):
        text = "Dr. Smith examined the U.S. data. Then he left."
        out = ffr._add_breath_marks(text)
        # Should split only on the second period (after "data."), not after Dr. or U.S.
        assert out.count("///") == 1
        assert "Dr. /// Smith" not in out

    def test_handles_question_and_exclamation(self):
        text = "Why now? Because. The answer is here!"
        out = ffr._add_breath_marks(text)
        assert out.count("///") == 2

    def test_single_sentence_no_breath_mark(self):
        assert "///" not in ffr._add_breath_marks("Just one sentence here.")

    def test_preserves_quoted_sentences(self):
        text = 'He said "It works." She nodded.'
        out = ffr._add_breath_marks(text)
        # Should split before "She" (capital after the closing quote).
        assert "///" in out

    def test_curly_closing_quotes_also_trigger_split(self):
        """Regression: Word/iA Writer auto-correct emits curly quotes.
        Without curly variants in SENTENCE_END_RE, sentences ending in
        curly-close-quote wouldn't get a breath mark."""
        text = "He said “It works.” She nodded."
        out = ffr._add_breath_marks(text)
        assert "///" in out

    def test_curly_opening_quote_starts_sentence(self):
        text = "He left. “Get back,” she called."
        out = ffr._add_breath_marks(text)
        # The boundary between "left." and the opening curly quote should split.
        assert "///" in out


# ── _split_table_row / _is_table_separator ───────────────────────────────────


class TestTableRowParser:
    def test_split_basic_row(self):
        assert ffr._split_table_row("| foo | bar | baz |") == ["foo", "bar", "baz"]

    def test_rejects_non_table_line(self):
        assert ffr._split_table_row("This is just text.") is None

    def test_rejects_single_pipe(self):
        assert ffr._split_table_row("hello | world") is None

    def test_is_table_separator(self):
        assert ffr._is_table_separator("|---|---|---|")
        assert ffr._is_table_separator("|:--|--:|:--:|")
        assert not ffr._is_table_separator("| Foo | Bar |")


# ── _count_words / _format_runtime ───────────────────────────────────────────


class TestCountAndRuntime:
    def test_count_words_simple(self):
        assert ffr._count_words("one two three") == 3

    def test_count_words_skips_pure_punctuation(self):
        assert ffr._count_words("one — two") == 2  # em-dash alone doesn't count

    def test_count_words_empty(self):
        assert ffr._count_words("") == 0

    def test_format_runtime_at_150_wpm(self):
        # 150 words at 150 wpm = exactly 1:00
        assert ffr._format_runtime(150, 150) == "1:00"

    def test_format_runtime_sub_minute(self):
        # 75 words at 150 wpm = 30 seconds
        assert ffr._format_runtime(75, 150) == "0:30"

    def test_format_runtime_handles_zero_wpm(self):
        assert ffr._format_runtime(100, 0) == "?:??"


# ── parse_script — full file synthesis ───────────────────────────────────────


def _write_minimal_script(tmp_path, body: str) -> Path:
    p = tmp_path / "script-production.md"
    p.write_text(body, encoding="utf-8")
    return p


class TestParseScript:
    def test_parses_single_beat_with_one_row(self, tmp_path):
        script = textwrap.dedent("""\
            # Title

            ## BEAT 1 — OPENING (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world. {✅} | **P1** · [MG:] some template · 5s |
        """)
        beats = ffr.parse_script(_write_minimal_script(tmp_path, script))
        assert len(beats) == 1
        assert beats[0].number == 1
        assert beats[0].title == "OPENING"
        assert beats[0].timing == "0:00–1:00"
        assert len(beats[0].takes) == 1
        assert beats[0].takes[0].kind == "narration"
        assert beats[0].takes[0].text == "Hello world."
        assert beats[0].word_count == 2

    def test_voice_note_classified_separately(self, tmp_path):
        script = textwrap.dedent("""\
            ## BEAT 1 — X

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | *(Voice note: deliberate pace here.)* | |
            | Real narration. | **P1** · [MG:] |
        """)
        beats = ffr.parse_script(_write_minimal_script(tmp_path, script))
        kinds = [t.kind for t in beats[0].takes]
        assert kinds == ["voice_note", "narration"]
        assert beats[0].takes[0].text == "deliberate pace here."

    def test_beat_marker_classified_separately(self, tmp_path):
        script = textwrap.dedent("""\
            ## BEAT 1 — X

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | *[Beat.]* | |
            | Next line. | **P1** · [MG:] |
        """)
        beats = ffr.parse_script(_write_minimal_script(tmp_path, script))
        assert beats[0].takes[0].kind == "beat_marker"
        assert beats[0].takes[0].text == "Beat"

    def test_empty_narration_rows_are_dropped(self, tmp_path):
        """DIR: / PACE: continuation rows have empty narration cells."""
        script = textwrap.dedent("""\
            ## BEAT 1 — X

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Speak this. | **P1** · [MG:] |
            |  | DIR: hold(land) |
            |  | PACE: breathing |
        """)
        beats = ffr.parse_script(_write_minimal_script(tmp_path, script))
        assert [t.text for t in beats[0].takes] == ["Speak this."]

    def test_asset_summary_terminates_parsing(self, tmp_path):
        script = textwrap.dedent("""\
            ## BEAT 1 — X

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | First. | **P1** |

            ## ASSET SUMMARY

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | This should not be parsed. | x |
        """)
        beats = ffr.parse_script(_write_minimal_script(tmp_path, script))
        assert len(beats) == 1
        assert [t.text for t in beats[0].takes] == ["First."]

    def test_multiple_beats_ordered(self, tmp_path):
        script = textwrap.dedent("""\
            ## BEAT 1 — A

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | One. | x |

            ## BEAT 2 — B (1:00–2:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Two. | x |
        """)
        beats = ffr.parse_script(_write_minimal_script(tmp_path, script))
        assert [b.number for b in beats] == [1, 2]
        assert [b.title for b in beats] == ["A", "B"]
        assert beats[1].timing == "1:00–2:00"

    def test_trailing_html_marker_stripped_from_title_and_timing_preserved(self, tmp_path):
        """Regression for the bug where psychology-structural markers
        like `<!-- [FRAMEWORK UNLOCK] -->` polluted beat.title and ate
        the timing capture. The shipped prisoners-dilemma script has
        this exact pattern on Beats 3 and 4."""
        script = textwrap.dedent("""\
            ## BEAT 3 — THE WRONG GAME (7:30–11:30) <!-- [FRAMEWORK UNLOCK] -->

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello. | x |
        """)
        beats = ffr.parse_script(_write_minimal_script(tmp_path, script))
        assert len(beats) == 1
        assert beats[0].title == "THE WRONG GAME"
        assert beats[0].timing == "7:30–11:30"

    def test_trailing_html_marker_without_timing(self, tmp_path):
        script = textwrap.dedent("""\
            ## BEAT 1 — TITLE ONLY <!-- [MAIN REVEAL] -->

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | x | y |
        """)
        beats = ffr.parse_script(_write_minimal_script(tmp_path, script))
        assert beats[0].title == "TITLE ONLY"
        assert beats[0].timing == ""

    def test_multiple_html_markers_on_one_beat_header(self, tmp_path):
        """A future script edit might stack multiple structural markers
        (psychology + format-override comments). The regex should
        absorb all of them, not just the first."""
        script = textwrap.dedent("""\
            ## BEAT 1 — TITLE (1:00–2:00) <!-- [FRAMEWORK UNLOCK] --> <!-- [TONE: SOMBER] -->

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | hi | x |
        """)
        beats = ffr.parse_script(_write_minimal_script(tmp_path, script))
        assert beats[0].title == "TITLE"
        assert beats[0].timing == "1:00–2:00"


# ── render_read_doc ──────────────────────────────────────────────────────────


class TestRenderReadDoc:
    @staticmethod
    def _one_beat_doc() -> list[ffr.Beat]:
        beat = ffr.Beat(number=1, title="OPENING", timing="0:00–1:00")
        beat.takes = [
            ffr.Take(kind="narration", text="Hello world. This is the second sentence.", word_count=8),
            ffr.Take(kind="voice_note", text="Slow this down."),
            ffr.Take(kind="beat_marker", text="Beat"),
        ]
        return [beat]

    def test_header_includes_total_and_wpm(self):
        out = ffr.render_read_doc(self._one_beat_doc(), slug="x", wpm=150)
        assert "Episode total" in out
        assert "150 wpm" in out

    def test_breath_marks_default_on(self):
        out = ffr.render_read_doc(self._one_beat_doc(), slug="x")
        # The actual narration line should carry the breath mark between
        # the two sentences. (The header docstring also mentions `///`, so
        # asserting on the substring alone is too loose — check the rendered
        # narration paragraph specifically.)
        assert "Hello world. /// This is the second sentence." in out

    def test_breath_marks_can_be_disabled(self):
        out = ffr.render_read_doc(self._one_beat_doc(), slug="x", breath_marks=False)
        assert "Hello world. This is the second sentence." in out
        assert "Hello world. ///" not in out

    def test_voice_note_rendered_as_italic_stage_direction(self):
        out = ffr.render_read_doc(self._one_beat_doc(), slug="x")
        assert "_(voice note: Slow this down.)_" in out

    def test_beat_marker_rendered_with_pause_hint(self):
        out = ffr.render_read_doc(self._one_beat_doc(), slug="x")
        assert "[BEAT — short pause]" in out

    def test_beat_word_count_displayed(self):
        out = ffr.render_read_doc(self._one_beat_doc(), slug="x")
        assert "~8 words" in out


# ── Real-data regression: parse the shipped prisoners-dilemma script ─────────


class TestRealScript:
    """Belt-and-suspenders guard against silent regressions: if the parser
    breaks against the actual production script, this fails loudly."""

    @pytest.fixture(scope="class")
    def real_script(self) -> Path:
        p = ffr.find_script("prisoners-dilemma")
        if p is None or not p.is_file():
            pytest.skip("prisoners-dilemma script not present")
        return p

    def test_parses_five_beats(self, real_script):
        beats = ffr.parse_script(real_script)
        assert len(beats) == 5, f"expected 5 beats, got {len(beats)}"

    def test_total_word_count_in_expected_range(self, real_script):
        beats = ffr.parse_script(real_script)
        total = sum(b.word_count for b in beats)
        # Script header claims ~2800 words; parsed narration excludes
        # voice notes and visual specs, so a 1500-2500 floor is reasonable.
        assert 1500 < total < 3500, f"word count {total} out of expected band"

    def test_no_beat_has_zero_narration(self, real_script):
        beats = ffr.parse_script(real_script)
        for b in beats:
            assert b.word_count > 0, f"beat {b.number} has zero narration"


# ── End-to-end CLI smoke ─────────────────────────────────────────────────────


class TestCliSmoke:
    def test_stdout_mode_emits_markdown(self, tmp_path):
        # Build a tiny script and feed it explicitly via --script.
        script = tmp_path / "script-production.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — TEST (0:00–0:30)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello CLI. {✅} | x |
        """), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "format_for_reading.py"),
                "smoke-test",  # positional slug — drives the doc title
                "--script", str(script),
                "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0, result.stderr
        assert "# Narration — smoke-test" in result.stdout
        assert "Hello CLI." in result.stdout
        assert "{✅}" not in result.stdout  # claim tag stripped

    def test_unknown_slug_exits_2(self, tmp_path):
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "format_for_reading.py"),
                "definitely-not-an-episode-xyzzy",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "no script found" in result.stderr
