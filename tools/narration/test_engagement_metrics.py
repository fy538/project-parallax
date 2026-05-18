"""
Unit tests for tools/narration/engagement_metrics.py.

Coverage:
  · Pivot detection (the misconception-first signature)
  · Bridge-sentence counting (per-beat connective recognition)
  · Direct-address counting (you/your/we/us)
  · Caveat detection (bounded-analogy patterns)
  · Sentence splitting + length distribution
  · Pattern-interrupt counting from raw markdown
  · End-to-end metrics computation against the shipped prisoners-dilemma script
"""

from __future__ import annotations

import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import engagement_metrics as em  # type: ignore[import-not-found]
import format_for_reading as ffr  # type: ignore[import-not-found]


# ── _has_pivot ───────────────────────────────────────────────────────────────


class TestHasPivot:
    def test_detects_its_also_wrong(self):
        assert em._has_pivot("It's also wrong. Not the math — the conclusion.")

    def test_detects_curly_apostrophe(self):
        assert em._has_pivot("It’s also wrong. Not the math.")

    def test_detects_but_actually(self):
        assert em._has_pivot("Everyone believes X. But actually, the data says Y.")

    def test_detects_turns_out(self):
        assert em._has_pivot("The textbook says X. Turns out X is wrong.")

    def test_does_not_detect_in_neutral_text(self):
        assert not em._has_pivot("This is the standard view of the framework.")

    def test_case_insensitive(self):
        assert em._has_pivot("IT'S ALSO WRONG.")


# ── _bridge_sentence_count ──────────────────────────────────────────────────


class TestBridgeCount:
    def test_detects_so_opener(self):
        # "So" matches; "And then" matches; bare "And" does NOT (would be a
        # false positive — too common in expository prose).
        sentences = ["So Nash dismissed the result.", "And then the model spread."]
        assert em._bridge_sentence_count(sentences) == 2

    def test_detects_how_does_that_happen(self):
        sentences = ["How does that happen?", "The answer is structural."]
        assert em._bridge_sentence_count(sentences) == 2

    def test_no_false_positive_on_substantive_openers(self):
        sentences = ["The Prisoner's Dilemma is wrong.", "Nash made a mistake."]
        assert em._bridge_sentence_count(sentences) == 0

    def test_handles_empty(self):
        assert em._bridge_sentence_count([]) == 0


# ── _direct_address_count ───────────────────────────────────────────────────


class TestDirectAddress:
    def test_counts_you_your_we_us(self):
        text = "You walk in. Your counterpart sees you defect. We've trained for this. Us versus them."
        # you (×2 — "You" + "you"), your, we, us → 5+ tokens; let's get exact
        # tokens: you, walk, in, your, counterpart, sees, you, defect,
        #         we've, trained, for, this, us, versus, them
        # direct address: you (2x), your, we've, us → 5
        assert em._direct_address_count(text) == 5

    def test_zero_when_no_direct_address(self):
        assert em._direct_address_count("The model says cooperation requires a miracle.") == 0


# ── _caveat_count ───────────────────────────────────────────────────────────


class TestCaveatCount:
    def test_detects_isnt_wrong_about_everything(self):
        text = "The Prisoner's Dilemma isn't wrong about everything."
        assert em._caveat_count(text) >= 1

    def test_detects_what_would_change_my_mind(self):
        text = "Here's what would change my mind."
        assert em._caveat_count(text) >= 1

    def test_detects_one_important_caveat(self):
        text = "One important caveat: this only applies at community scale."
        assert em._caveat_count(text) >= 1


# ── _split_sentences ────────────────────────────────────────────────────────


class TestSplitSentences:
    def test_simple_sentences(self):
        result = em._split_sentences("Hello world. This is two.")
        assert len(result) == 2

    def test_handles_abbreviations(self):
        # Dr. Smith should not split into two sentences
        result = em._split_sentences("Dr. Smith examined the data. He concluded X.")
        assert len(result) == 2  # one real boundary

    def test_handles_question_and_exclamation(self):
        result = em._split_sentences("Why? Because. The answer is here!")
        assert len(result) == 3


# ── count_pattern_interrupts ────────────────────────────────────────────────


class TestPatternInterrupts:
    def test_counts_visual_tags(self):
        raw = "Some text [MG:] template [AI-GEN:] scene more text [ARCHIVAL:] photo"
        visual, dir_cuts = em.count_pattern_interrupts(raw)
        assert visual == 3
        assert dir_cuts == 0

    def test_counts_dir_cut_lines(self):
        raw = (
            "Some narration\n"
            "DIR: cut(color-wash, ink)\n"
            "More narration\n"
            "DIR: cut(iris, center)\n"
        )
        visual, dir_cuts = em.count_pattern_interrupts(raw)
        assert visual == 0
        assert dir_cuts == 2

    def test_empty_script_returns_zero(self):
        visual, dir_cuts = em.count_pattern_interrupts("")
        assert visual == 0
        assert dir_cuts == 0


# ── detect_hook_position ────────────────────────────────────────────────────


class TestDetectHookPosition:
    def _build_beat(self, *take_texts: str) -> ffr.Beat:
        beat = ffr.Beat(number=1, title="TEST", timing="")
        for text in take_texts:
            beat.takes.append(ffr.Take(
                kind="narration", text=text, word_count=len(text.split()),
            ))
        return beat

    def test_pivot_in_second_take_returns_cumulative_word_count(self):
        beat = self._build_beat(
            "This is the textbook framing of the concept in question here.",  # 11 words
            "It's also wrong. Not the math.",  # 6 words, contains pivot
        )
        hook_sec, idx, words, has_pivot = em.detect_hook_position(beat, wpm=150)
        assert has_pivot
        # 11 + 6 = 17 words before pivot detected.
        assert words == 17
        # 17 words / 150 wpm * 60 = 6.8s
        assert hook_sec == pytest.approx(6.8, abs=0.1)

    def test_no_pivot_anywhere(self):
        beat = self._build_beat(
            "First take with no pivot signal.",
            "Second take also without pivot.",
        )
        hook_sec, idx, words, has_pivot = em.detect_hook_position(beat, wpm=150)
        assert not has_pivot
        assert hook_sec is None

    def test_pivot_in_first_take(self):
        beat = self._build_beat("It's also wrong from the start.")
        hook_sec, idx, words, has_pivot = em.detect_hook_position(beat, wpm=150)
        assert has_pivot
        assert words == 6


# ── compute_beat_metrics ────────────────────────────────────────────────────


class TestComputeBeatMetrics:
    def test_aggregates_word_count(self):
        beat = ffr.Beat(number=1, title="X", timing="")
        beat.takes = [
            ffr.Take(kind="narration", text="Hello world.", word_count=2),
            ffr.Take(kind="narration", text="Second sentence here now.", word_count=4),
        ]
        m = em.compute_beat_metrics(beat, wpm=150)
        assert m.word_count == 6
        assert m.take_count == 2

    def test_runtime_at_150wpm(self):
        beat = ffr.Beat(number=1, title="X", timing="")
        beat.takes = [ffr.Take(kind="narration", text=" ".join(["w"] * 150), word_count=150)]
        m = em.compute_beat_metrics(beat, wpm=150)
        assert m.estimated_runtime_sec == pytest.approx(60.0)

    def test_voice_notes_excluded(self):
        beat = ffr.Beat(number=1, title="X", timing="")
        beat.takes = [
            ffr.Take(kind="narration", text="Hello.", word_count=1),
            ffr.Take(kind="voice_note", text="Slow this down."),
        ]
        m = em.compute_beat_metrics(beat, wpm=150)
        assert m.word_count == 1
        assert m.take_count == 1  # voice notes don't count


# ── Real-data regression ────────────────────────────────────────────────────


class TestRealScripts:
    """Smoke against the shipped prisoners-dilemma scripts (v5 + v6)."""

    @pytest.fixture(scope="class")
    def v5_metrics(self) -> em.EngagementMetrics:
        path = REPO_ROOT / "episodes" / "prisoners-dilemma" / "script-v5-production.md"
        if not path.is_file():
            pytest.skip("script-v5-production.md not present")
        return em.compute_engagement_metrics(path)

    @pytest.fixture(scope="class")
    def v6_metrics(self) -> em.EngagementMetrics:
        path = REPO_ROOT / "episodes" / "prisoners-dilemma" / "script-v6-production.md"
        if not path.is_file():
            pytest.skip("script-v6-production.md not present")
        return em.compute_engagement_metrics(path)

    def test_v6_detects_pivot(self, v6_metrics):
        assert v6_metrics.has_pivot_signal

    def test_v6_has_more_bridges_in_beat_2_than_v5(self, v5_metrics, v6_metrics):
        # Beat 2 was the explicit restructure target — should have more bridges
        v5_b2 = v5_metrics.beats[1]
        v6_b2 = v6_metrics.beats[1]
        assert v6_b2.bridge_sentence_count > v5_b2.bridge_sentence_count

    def test_both_scripts_have_five_beats(self, v5_metrics, v6_metrics):
        assert v5_metrics.beat_count == 5
        assert v6_metrics.beat_count == 5


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_stdout_mode(self, tmp_path):
        script = tmp_path / "script-production.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — TEST

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | This is the standard view. | **P1** · [MG:] x |
            | It's also wrong. Not the math. | **P2** · [MG:] y |
        """), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "engagement_metrics.py"),
                "smoke", "--script", str(script), "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0, result.stderr
        assert "Pivot detected:** ✓" in result.stdout

    def test_json_output(self, tmp_path):
        script = tmp_path / "script-production.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — TEST

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello. | x |
        """), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "engagement_metrics.py"),
                "smoke", "--script", str(script), "--json", "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0, result.stderr
        import json
        data = json.loads(result.stdout)
        assert data["slug"] == "smoke"
        assert "beats" in data
