"""
Unit tests for tools/narration/sayability_lint.py.

Covers:
  · count_syllables — vowel-group heuristic across common patterns
  · alliteration_run_count — 3+ same-initial content-words
  · consonant_cluster_count
  · sibilance_ratio
  · unique_long_word_count
  · longest_breath_gap
  · score_sentence — band-ramp scoring + contribution breakdown
  · split_into_sentences — abbrev-respecting splitter
  · run_audit — end-to-end on synthetic + real script
  · render_report_md
  · CLI smoke (--json, --strict, --threshold)
"""

from __future__ import annotations

import json
import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import sayability_lint as sl  # type: ignore[import-not-found]


# ── count_syllables ─────────────────────────────────────────────────────────


class TestCountSyllables:
    def test_monosyllables(self):
        assert sl.count_syllables("the") == 1
        assert sl.count_syllables("strength") == 1
        assert sl.count_syllables("cake") == 1  # silent trailing e

    def test_multisyllables(self):
        assert sl.count_syllables("cooperation") >= 4
        assert sl.count_syllables("rational") >= 3

    def test_silent_e_with_le_keeps_syllable(self):
        # "table" should count as 2 (-le ending preserves syllable)
        assert sl.count_syllables("table") == 2

    def test_empty(self):
        assert sl.count_syllables("") == 0
        assert sl.count_syllables("'") == 0


# ── alliteration_run_count ──────────────────────────────────────────────────


class TestAlliterationRunCount:
    def test_three_word_run(self):
        words = ["structural", "stability", "suggested"]
        assert sl.alliteration_run_count(words) == 1

    def test_stopwords_dont_count(self):
        # "of" / "the" / "and" are skipped; the content words still alliterate
        words = ["structural", "and", "stable", "the", "system"]
        assert sl.alliteration_run_count(words) == 1

    def test_below_threshold(self):
        words = ["structural", "stable", "rational"]
        assert sl.alliteration_run_count(words) == 0

    def test_two_distinct_runs(self):
        words = ["structural", "stable", "suggested", "and", "rational", "real", "reasons"]
        assert sl.alliteration_run_count(words) == 2

    def test_empty(self):
        assert sl.alliteration_run_count([]) == 0


# ── consonant_cluster_count ─────────────────────────────────────────────────


class TestConsonantClusterCount:
    def test_strength_counts(self):
        # 'strngth' has consonant cluster (strng / ngth)
        assert sl.consonant_cluster_count(["strength"]) == 1

    def test_simple_words_dont_count(self):
        assert sl.consonant_cluster_count(["cat", "dog", "the"]) == 0

    def test_mixed(self):
        assert sl.consonant_cluster_count(["strength", "of", "thoughtful"]) == 2


# ── sibilance_ratio ─────────────────────────────────────────────────────────


class TestSibilanceRatio:
    def test_no_sibilants(self):
        assert sl.sibilance_ratio(["cat", "dog", "tree"]) == 0.0

    def test_pure_sibilants(self):
        assert sl.sibilance_ratio(["sea", "she", "ship"]) == 1.0

    def test_partial(self):
        ratio = sl.sibilance_ratio(["sea", "tree", "cat", "ship"])
        assert ratio == 0.5

    def test_empty(self):
        assert sl.sibilance_ratio([]) == 0.0


# ── unique_long_word_count ──────────────────────────────────────────────────


class TestUniqueLongWordCount:
    def test_filters_short(self):
        # "rationale" is 9 chars, "the" is not
        words = ["rationale", "the", "and", "diagrammatic"]
        assert sl.unique_long_word_count(words) == 2

    def test_dedups(self):
        assert sl.unique_long_word_count(["rationale", "RATIONALE"]) == 1


# ── longest_breath_gap ──────────────────────────────────────────────────────


class TestLongestBreathGap:
    def test_no_punct(self):
        assert sl.longest_breath_gap("the cat sat on the mat") == 6

    def test_comma_splits(self):
        # "abc def, ghi jkl mno" → max(2, 3) = 3
        assert sl.longest_breath_gap("abc def, ghi jkl mno") == 3

    def test_em_dash_splits(self):
        assert sl.longest_breath_gap("first part — second longer part here") == 4


# ── score_sentence ──────────────────────────────────────────────────────────


class TestScoreSentence:
    def test_easy_sentence_low_score(self):
        s = sl.score_sentence("The cat sat on the mat.")
        assert s.score < 30
        assert s.word_count == 6

    def test_long_sentence_scores_higher(self):
        long_sent = (
            "The complex constructivist epistemological framework that "
            "underpinned the structural stability suggestion ultimately "
            "resulted in a profoundly inadequate yet pervasive analytical "
            "paradigm shift."
        )
        s = sl.score_sentence(long_sent)
        assert s.score >= 60
        # Multiple contributors should fire
        assert s.contributions["word_count"] > 0
        assert s.contributions["unique_long_words"] > 0
        assert s.contributions["syllables_per_word"] > 0

    def test_alliteration_triggers(self):
        # One run = 5 points (banded contribution); 2+ runs = full weight.
        s = sl.score_sentence("Structural stability suggested simple solutions today.")
        assert s.alliteration_runs >= 1
        # Single run contributes 5 (1 × 5); 2 runs would contribute 10.
        assert s.contributions["alliteration"] == 5

    def test_alliteration_multiple_runs_full_weight(self):
        # Two distinct runs land the full alliteration weight.
        s = sl.score_sentence(
            "Structural stability suggested simple solutions, "
            "real rational reasoning rejected."
        )
        assert s.alliteration_runs >= 2
        assert s.contributions["alliteration"] == sl.ALLITERATION_WEIGHT

    def test_sibilance_not_sk_clusters(self):
        # "school scope scheme scan" — all /sk/ start, should NOT count
        # toward sibilance ratio.
        ratio = sl.sibilance_ratio(["school", "scope", "scheme", "scan"])
        assert ratio == 0.0

    def test_sibilance_real_sh_ch_counts(self):
        ratio = sl.sibilance_ratio(["ship", "she", "chosen"])
        assert ratio == 1.0

    def test_rhetorical_question_lowercase_splits(self):
        # The pre-fix splitter merged "What is X? it is Y." into 1 sentence
        # because lookahead required uppercase. Real Parallax scripts use
        # this rhetorical pattern.
        out = sl.split_into_sentences(
            "What is power? it is everywhere. Also see this."
        )
        assert len(out) == 3

    def test_empty_sentence_no_score(self):
        s = sl.score_sentence("")
        assert s.score == 0.0
        assert s.word_count == 0

    def test_severity_thresholds(self):
        easy = sl.SentenceScore(0, "", "", 0, 0, 0, 0, 0, 0, 0, score=30)
        warn = sl.SentenceScore(0, "", "", 0, 0, 0, 0, 0, 0, 0, score=65)
        bad = sl.SentenceScore(0, "", "", 0, 0, 0, 0, 0, 0, 0, score=80)
        assert easy.severity == "🟢"
        assert warn.severity == "🟡"
        assert bad.severity == "🔴"


# ── split_into_sentences ────────────────────────────────────────────────────


class TestSplitIntoSentences:
    def test_simple_split(self):
        out = sl.split_into_sentences("First. Second. Third.")
        assert len(out) == 3

    def test_respects_abbreviations(self):
        # "Dr. Smith said hello. Then he left." → 2 sentences, not 3
        out = sl.split_into_sentences("Dr. Smith said hello. Then he left.")
        assert len(out) == 2
        assert "Dr. Smith" in out[0]

    def test_us_period_abbrev(self):
        # "U.S. policy is set. Action follows." → 2 sentences
        out = sl.split_into_sentences("U.S. policy is set. Action follows.")
        assert len(out) == 2

    def test_empty_input(self):
        assert sl.split_into_sentences("") == []
        assert sl.split_into_sentences("   ") == []


# ── run_audit ───────────────────────────────────────────────────────────────


def _fixture_script(tmp_path, body: str) -> Path:
    script = tmp_path / "script.md"
    script.write_text(body, encoding="utf-8")
    return script


class TestRunAudit:
    def test_audit_returns_per_sentence_scores(self, tmp_path):
        script = _fixture_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — T (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Easy short sentence. Another easy one. | [FOOTAGE: x] |
        """))
        report = sl.run_audit("test", script)
        assert report.total_sentences == 2
        for s in report.sentences:
            assert s.beat_number == 1

    def test_threshold_filters_flagged(self, tmp_path):
        # A genuinely hard sentence + an easy one
        hard = (
            "The complex constructivist epistemological framework "
            "underpinning the structurally stable suggestion ultimately "
            "resulted in a profoundly inadequate yet pervasive analytical "
            "paradigm-shifting reformulation."
        )
        script = _fixture_script(tmp_path, textwrap.dedent(f"""\
            ## BEAT 1 — T (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | {hard} Easy short one. | [FOOTAGE: x] |
        """))
        report = sl.run_audit("test", script, threshold=60.0)
        assert len(report.flagged) >= 1
        assert all(s.score >= 60 for s in report.flagged)


# ── render_report_md ────────────────────────────────────────────────────────


class TestRenderReport:
    def test_clean_report_when_no_flags(self):
        rep = sl.SayabilityReport(
            slug="x", script_path="/tmp/x.md", threshold=60,
            sentences=[sl.score_sentence("Easy short sentence.")],
        )
        out = sl.render_report_md(rep)
        assert "No sentences exceed" in out

    def test_flagged_report_shows_sentences(self):
        hard = (
            "The complex constructivist epistemological framework "
            "underpinning the structurally stable suggestion ultimately "
            "resulted in a profoundly inadequate yet pervasive analytical "
            "paradigm-shifting reformulation."
        )
        s = sl.score_sentence(hard, beat_number=1, beat_title="Test")
        rep = sl.SayabilityReport(
            slug="x", script_path="/tmp/x.md", threshold=60, sentences=[s],
        )
        out = sl.render_report_md(rep)
        assert "flagged sentence" in out
        # The contributions inline
        assert "word_count=" in out

    def test_top_n_limits_detail(self):
        sentences = [sl.score_sentence(f"Sentence {i}.") for i in range(5)]
        for s in sentences:
            s.score = 90  # force all flagged
        rep = sl.SayabilityReport(
            slug="x", script_path="/tmp/x.md", threshold=60, sentences=sentences,
        )
        out = sl.render_report_md(rep, top=2)
        # Header should say "Top 2"
        assert "Top 2" in out


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_missing_slug_exits_2(self):
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "sayability_lint.py"),
                "definitely-not-an-episode-xyz",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2

    def test_json_emits_valid_json(self, tmp_path):
        script = _fixture_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — T (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world. | [FOOTAGE: x] |
        """))
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "sayability_lint.py"),
                "x", "--script", str(script), "--json", "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert payload["slug"] == "x"
        assert payload["total_sentences"] >= 1
        assert "sentences" in payload

    def test_strict_exits_1_on_flagged(self, tmp_path):
        hard = (
            "The complex constructivist epistemological framework "
            "underpinning the structurally stable suggestion ultimately "
            "resulted in a profoundly inadequate yet pervasive analytical "
            "paradigm-shifting reformulation."
        )
        script = _fixture_script(tmp_path, textwrap.dedent(f"""\
            ## BEAT 1 — T (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | {hard} | [FOOTAGE: x] |
        """))
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "sayability_lint.py"),
                "x", "--script", str(script), "--strict", "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 1

    def test_real_prisoners_dilemma_smoke(self):
        """Smoke against the launch-candidate script. Should run cleanly."""
        script_dir = REPO_ROOT / "episodes" / "prisoners-dilemma"
        if not (
            (script_dir / "script-production.md").is_file()
            or list(script_dir.glob("script-v*-production.md"))
        ):
            pytest.skip("prisoners-dilemma script not present in this checkout")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "sayability_lint.py"),
                "prisoners-dilemma", "--json", "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        # Should produce a meaningful sentence count
        assert payload["total_sentences"] > 20
        # And each sentence has the expected fields
        first = payload["sentences"][0]
        for key in (
            "word_count", "score", "syllables_per_word", "breath_gap",
            "alliteration_runs", "consonant_clusters", "sibilance_ratio",
            "unique_long_words", "contributions",
        ):
            assert key in first
