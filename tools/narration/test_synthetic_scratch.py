"""
Unit tests for tools/narration/synthetic_scratch.py.

Coverage (no network, no ffmpeg):
  · extract_beats: narration between the markers, per heading; sections without markers ignored
  · words_from_characters: character timings to word timings, across chunks, with offset and tempo
  · tempo_for: target pace, clamped
  · estimate_cost
  · CLI without --yes prints the cost and sends nothing
"""

from __future__ import annotations

import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import synthetic_scratch as ss  # type: ignore[import-not-found]

DRAFT = textwrap.dedent("""\
    # Title

    ## Beat 1 — Open

    <!-- narration:start -->
    One two three.

    Four five.
    <!-- narration:end -->

    ## Beat 2 — Close

    <!-- narration:start -->
    Six.
    <!-- narration:end -->

    ## Notes — not spoken

    Nothing here is read.
""")


def _chunk(text: str, t0: float, step: float = 0.1) -> dict:
    return {
        "characters": list(text),
        "character_start_times_seconds": [round(t0 + i * step, 3) for i in range(len(text))],
        "character_end_times_seconds": [round(t0 + (i + 1) * step, 3) for i in range(len(text))],
    }


class TestExtractBeats:
    def test_reads_only_marked_narration(self):
        beats = ss.extract_beats(DRAFT)
        assert [title for title, _ in beats] == ["Beat 1 — Open", "Beat 2 — Close"]
        assert beats[0][1] == "One two three.\n\nFour five."
        assert beats[1][1] == "Six."

    def test_no_markers_gives_nothing(self):
        assert ss.extract_beats("## Beat 1\n\nJust prose.\n") == []


class TestWordsFromCharacters:
    def test_splits_on_whitespace_and_keeps_punctuation(self):
        words = ss.words_from_characters([_chunk(" Hi there.", 0.0)])
        assert [w["word"] for w in words] == ["Hi", "there."]
        assert words[0]["start"] == pytest.approx(0.1)
        assert words[0]["end"] == pytest.approx(0.3)
        assert words[1]["end"] == pytest.approx(1.0)

    def test_a_word_can_span_two_chunks(self):
        words = ss.words_from_characters([_chunk("He", 0.0), _chunk("llo you", 0.2)])
        assert [w["word"] for w in words] == ["Hello", "you"]
        assert words[0]["start"] == pytest.approx(0.0)
        assert words[0]["end"] == pytest.approx(0.5)

    def test_offset_and_tempo(self):
        words = ss.words_from_characters([_chunk("ab", 1.0)], offset=10.0, tempo=0.5)
        assert words == [{"word": "ab", "start": 12.0, "end": 12.4}]


class TestTempo:
    def test_slows_a_fast_read_to_the_target(self):
        assert ss.tempo_for(150, 60.0, 140) == pytest.approx(0.933, abs=0.001)

    def test_is_clamped(self):
        assert ss.tempo_for(300, 60.0, 140) == ss.TEMPO_RANGE[0]
        assert ss.tempo_for(60, 60.0, 140) == ss.TEMPO_RANGE[1]

    def test_empty_read_is_left_alone(self):
        assert ss.tempo_for(0, 0.0, 140) == 1.0


def test_estimate_cost():
    assert ss.estimate_cost(8694) == pytest.approx(0.43)


def test_cli_without_yes_only_prints_the_cost(tmp_path):
    draft = tmp_path / "spoken-draft-v1.md"
    draft.write_text(DRAFT)
    out = subprocess.run(
        [sys.executable, str(Path(ss.__file__)), "unused-slug", "--text", str(draft)],
        capture_output=True, text=True, check=True,
    ).stdout
    assert "2 beats, 6 words" in out
    assert "Expected cost" in out
    assert "Nothing was sent" in out
