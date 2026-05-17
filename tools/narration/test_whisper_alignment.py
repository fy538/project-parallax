"""
Unit tests for tools/narration/whisper_alignment.py.

The alignment core is pure — given script + transcript, it produces a
deterministic list of issues. Tests cover:
  · Transcript JSON loading (with + without word timestamps)
  · Word normalization (punctuation, apostrophes, contractions)
  · difflib-based alignment (matched/missed/substituted/inserted opcodes)
  · Severity classification (single-word noise = minor; multi-word = major)
  · Low-confidence span coalescing
  · Pickup-candidate filtering
  · Display truncation
  · End-to-end CLI smoke
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
import format_for_reading as ffr  # type: ignore[import-not-found]
import whisper_alignment as wa  # type: ignore[import-not-found]


# ── normalise_word ───────────────────────────────────────────────────────────


class TestNormaliseWord:
    def test_lowercases(self):
        assert wa.normalise_word("Schelling") == "schelling"

    def test_strips_surrounding_punct(self):
        assert wa.normalise_word('"hello,"') == "hello"

    def test_preserves_interior_apostrophe(self):
        assert wa.normalise_word("don't") == "don't"

    def test_drops_interior_punctuation(self):
        # "U.S." → "us" so it matches "us" naively.
        assert wa.normalise_word("U.S.") == "us"

    def test_handles_curly_apostrophe(self):
        # Different apostrophe characters should collapse so the diff
        # treats them as equal.
        assert wa.normalise_word("don’t") == wa.normalise_word("don't")

    def test_empty_returns_empty(self):
        assert wa.normalise_word("") == ""


# ── load_transcript_from_json ────────────────────────────────────────────────


class TestLoadTranscript:
    def test_loads_word_level_timestamps(self, tmp_path):
        path = tmp_path / "t.json"
        path.write_text(json.dumps({
            "segments": [
                {
                    "start": 0.0, "end": 2.0, "text": "Hello world.",
                    "words": [
                        {"start": 0.0, "end": 0.5, "word": "Hello", "probability": 0.95},
                        {"start": 0.5, "end": 2.0, "word": "world.", "probability": 0.99},
                    ],
                }
            ]
        }), encoding="utf-8")
        t = wa.load_transcript_from_json(path)
        assert len(t.words) == 2
        assert t.words[0].word == "Hello"
        assert t.words[0].start_sec == 0.0
        assert t.words[1].probability == pytest.approx(0.99)
        assert t.duration_sec == 2.0

    def test_falls_back_to_segment_timing_when_no_words(self, tmp_path):
        """Older whisper.cpp output omits word timestamps; tool should
        still produce a Transcript by splitting segment text."""
        path = tmp_path / "t.json"
        path.write_text(json.dumps({
            "segments": [
                {"start": 0.0, "end": 4.0, "text": "one two three four"}
            ]
        }), encoding="utf-8")
        t = wa.load_transcript_from_json(path)
        assert len(t.words) == 4
        # Times should distribute roughly evenly across the segment.
        assert t.words[0].start_sec == 0.0
        assert t.words[-1].end_sec == pytest.approx(4.0)
        # Probability is -1 when missing.
        assert all(w.probability == -1.0 for w in t.words)

    def test_missing_probability_handled(self, tmp_path):
        path = tmp_path / "t.json"
        path.write_text(json.dumps({
            "segments": [{
                "start": 0.0, "end": 1.0, "text": "x",
                "words": [{"start": 0.0, "end": 1.0, "word": "x"}],
            }]
        }), encoding="utf-8")
        t = wa.load_transcript_from_json(path)
        assert t.words[0].probability == -1.0


# ── align (the core diff) ────────────────────────────────────────────────────


def _make_transcript(words: list[tuple[str, float, float, float]]) -> wa.Transcript:
    """Helper: build a Transcript from (word, start, end, prob) tuples."""
    return wa.Transcript(
        words=[wa.TranscriptWord(word=w, start_sec=s, end_sec=e, probability=p)
               for w, s, e, p in words]
    )


def _make_script_words(*tokens_per_beat: list[str]) -> list[wa.ScriptWord]:
    """Helper: build script words from positional lists, one per beat number."""
    out: list[wa.ScriptWord] = []
    for beat_num, tokens in enumerate(tokens_per_beat, start=1):
        for tok in tokens:
            out.append(wa.ScriptWord(word=tok, beat_number=beat_num, take_index=0))
    return out


class TestAlign:
    def test_perfect_match_no_issues(self):
        script = _make_script_words(["hello", "world"])
        transcript = _make_transcript([
            ("hello", 0.0, 0.5, 0.99),
            ("world", 0.5, 1.0, 0.99),
        ])
        assert wa.align(script, transcript) == []

    def test_single_word_missed_is_minor(self):
        script = _make_script_words(["hello", "great", "world"])
        transcript = _make_transcript([
            ("hello", 0.0, 0.5, 0.99),
            ("world", 0.5, 1.0, 0.99),
        ])
        issues = wa.align(script, transcript)
        assert len(issues) == 1
        assert issues[0].kind == "missed"
        assert issues[0].severity == "minor"
        assert "great" in issues[0].script_text

    def test_multi_word_missed_is_major(self):
        script = _make_script_words(["hello", "great", "big", "wide", "world"])
        transcript = _make_transcript([
            ("hello", 0.0, 0.5, 0.99),
            ("world", 0.5, 1.0, 0.99),
        ])
        issues = wa.align(script, transcript)
        major = [i for i in issues if i.severity == "major"]
        assert len(major) == 1
        assert major[0].kind == "missed"

    def test_single_word_substitution_is_minor(self):
        script = _make_script_words(["the", "cat", "sat"])
        transcript = _make_transcript([
            ("the", 0.0, 0.3, 0.99),
            ("dog", 0.3, 0.7, 0.95),
            ("sat", 0.7, 1.0, 0.99),
        ])
        issues = wa.align(script, transcript)
        assert len(issues) == 1
        assert issues[0].kind == "substituted"
        assert issues[0].severity == "minor"
        assert issues[0].script_text == "cat"
        assert issues[0].spoken_text == "dog"

    def test_inserted_word_classified_as_inserted(self):
        script = _make_script_words(["hello", "world"])
        transcript = _make_transcript([
            ("hello", 0.0, 0.3, 0.99),
            ("um", 0.3, 0.5, 0.95),  # ad-lib
            ("world", 0.5, 1.0, 0.99),
        ])
        issues = wa.align(script, transcript)
        assert len(issues) == 1
        assert issues[0].kind == "inserted"
        assert issues[0].spoken_text == "um"

    def test_normalization_collapses_punctuation_differences(self):
        # "U.S." vs "US" should compare equal — no issue.
        script = _make_script_words(["The", "U.S.", "won"])
        transcript = _make_transcript([
            ("The", 0.0, 0.2, 0.99),
            ("US", 0.2, 0.5, 0.99),
            ("won", 0.5, 0.8, 0.99),
        ])
        assert wa.align(script, transcript) == []

    def test_beat_number_assigned_from_script(self):
        script = _make_script_words(["one"], ["two", "missed"], ["three"])
        transcript = _make_transcript([
            ("one", 0.0, 0.3, 0.99),
            ("two", 0.3, 0.6, 0.99),
            ("three", 0.6, 0.9, 0.99),
        ])
        issues = wa.align(script, transcript)
        # The missed word "missed" belongs to beat 2.
        assert len(issues) == 1
        assert issues[0].beat_number == 2

    def test_audio_timestamps_come_from_transcript_for_substitution(self):
        script = _make_script_words(["a", "X", "b"])
        transcript = _make_transcript([
            ("a", 0.0, 0.2, 0.99),
            ("Y", 0.5, 0.8, 0.95),
            ("b", 1.0, 1.2, 0.99),
        ])
        issues = wa.align(script, transcript)
        assert issues[0].audio_start_sec == 0.5
        assert issues[0].audio_end_sec == 0.8

    def test_audio_timestamp_for_pure_deletion_uses_next_word(self):
        """Missed-word issues should report when the surrounding words sit
        in the audio so the operator can navigate to that spot in the DAW."""
        script = _make_script_words(["hello", "extra", "world"])
        transcript = _make_transcript([
            ("hello", 0.0, 0.5, 0.99),
            ("world", 2.0, 2.5, 0.99),
        ])
        issues = wa.align(script, transcript)
        assert len(issues) == 1
        # Missed words sit between hello and world — should point at world.
        assert issues[0].audio_start_sec == 2.0


# ── find_low_confidence_spans ────────────────────────────────────────────────


class TestLowConfidence:
    def test_coalesces_adjacent_low_conf_words(self):
        t = _make_transcript([
            ("Hello", 0.0, 0.5, 0.99),
            ("Alch", 0.5, 0.8, 0.3),   # low
            ("Alchian", 0.8, 1.2, 0.4),  # low
            ("said", 1.2, 1.5, 0.99),
        ])
        issues = wa.find_low_confidence_spans(t, threshold=0.5)
        assert len(issues) == 1
        assert "Alch Alchian" in issues[0].spoken_text
        assert issues[0].audio_start_sec == 0.5
        assert issues[0].audio_end_sec == 1.2

    def test_above_threshold_produces_nothing(self):
        t = _make_transcript([
            ("Hello", 0.0, 0.5, 0.99),
            ("world", 0.5, 1.0, 0.95),
        ])
        assert wa.find_low_confidence_spans(t, threshold=0.5) == []

    def test_missing_probability_skipped(self):
        # probability -1 = "no data"; should not be flagged as low conf.
        t = _make_transcript([
            ("hello", 0.0, 0.5, -1.0),
            ("world", 0.5, 1.0, -1.0),
        ])
        assert wa.find_low_confidence_spans(t, threshold=0.5) == []


# ── pickup_candidates ────────────────────────────────────────────────────────


class TestPickupCandidates:
    def test_only_major_missed_or_substituted(self):
        report = wa.AlignmentReport(
            issues=[
                wa.AlignmentIssue(kind="missed", severity="major", script_text="a b c",
                                  spoken_text="", audio_start_sec=0, audio_end_sec=0, beat_number=1),
                wa.AlignmentIssue(kind="missed", severity="minor", script_text="x",
                                  spoken_text="", audio_start_sec=0, audio_end_sec=0, beat_number=1),
                wa.AlignmentIssue(kind="low_confidence", severity="major", script_text="",
                                  spoken_text="y", audio_start_sec=0, audio_end_sec=0, beat_number=1),
                wa.AlignmentIssue(kind="inserted", severity="major", script_text="",
                                  spoken_text="um", audio_start_sec=0, audio_end_sec=0, beat_number=1),
            ],
            script_word_count=10, transcript_word_count=12,
            transcript_duration_sec=60, estimated_script_duration_sec=58,
        )
        # Only the first issue (major + missed) qualifies as a pickup.
        assert len(report.pickup_candidates) == 1
        assert report.pickup_candidates[0].kind == "missed"


# ── _truncate ────────────────────────────────────────────────────────────────


class TestTruncate:
    def test_short_text_returned_unchanged(self):
        assert wa._truncate("short") == "short"

    def test_long_text_truncated_with_word_count(self):
        text = " ".join(["word"] * 200)
        out = wa._truncate(text, limit=50)
        assert "…" in out
        assert "200 words" in out

    def test_truncates_at_word_boundary(self):
        text = "hello world foo bar baz quux"
        out = wa._truncate(text, limit=15)
        # Should NOT contain a partial word like "bar" cut mid-character.
        # Just check that it ends with a complete word before "…".
        assert "…" in out
        head = out.split("…")[0].strip()
        # head should be a sequence of complete words.
        assert all(w in text.split() for w in head.split())


# ── render_diff_md ───────────────────────────────────────────────────────────


class TestRenderDiffMd:
    def _make_report(self, issues=None, beats=None):
        return wa.AlignmentReport(
            issues=issues or [],
            script_word_count=100, transcript_word_count=100,
            transcript_duration_sec=40, estimated_script_duration_sec=40,
            beats=beats or [],
        )

    def test_clean_report_says_so(self):
        out = wa.render_diff_md(self._make_report(), slug="x")
        assert "No pickup candidates" in out

    def test_pickup_candidates_table_present(self):
        issue = wa.AlignmentIssue(
            kind="missed", severity="major", script_text="a few skipped words here",
            spoken_text="", audio_start_sec=12.5, audio_end_sec=12.5, beat_number=2,
        )
        out = wa.render_diff_md(self._make_report(issues=[issue]), slug="x")
        assert "Pickup-take shopping list" in out
        assert "0:12.5" in out
        assert "B2" in out
        assert "a few skipped words here" in out

    def test_huge_missed_chunk_renders_summary_not_text(self):
        big = " ".join(["word"] * 100)  # 100 words
        beat = ffr.Beat(number=1, title="ONE", timing="")
        issue = wa.AlignmentIssue(
            kind="missed", severity="major", script_text=big, spoken_text="",
            audio_start_sec=0, audio_end_sec=0, beat_number=1,
        )
        out = wa.render_diff_md(
            self._make_report(issues=[issue], beats=[beat]),
            slug="x",
        )
        # In the per-beat full diff, large chunks should NOT be dumped verbatim.
        assert "100 words" in out
        assert "large unrecorded chunk" in out

    def test_delivery_skew_note_present_when_off(self):
        report = wa.AlignmentReport(
            issues=[], script_word_count=100, transcript_word_count=100,
            transcript_duration_sec=80,   # 2x estimate
            estimated_script_duration_sec=40,
        )
        out = wa.render_diff_md(report, slug="x")
        assert "slower" in out.lower()

    def test_no_probabilities_surfaces_warning(self):
        """Regression: a transcript with no per-word probabilities
        (whisper.cpp older format, all probs = -1) silently produced
        zero low-confidence findings, which the operator could read as
        'no mispronunciations'. Now we say so explicitly."""
        report = wa.AlignmentReport(
            issues=[], script_word_count=10, transcript_word_count=10,
            transcript_duration_sec=10, estimated_script_duration_sec=10,
            transcript_has_probabilities=False,
        )
        out = wa.render_diff_md(report, slug="x")
        assert "no per-word probabilities" in out
        assert "low-confidence detection" in out

    def test_probabilities_present_no_warning(self):
        report = wa.AlignmentReport(
            issues=[], script_word_count=10, transcript_word_count=10,
            transcript_duration_sec=10, estimated_script_duration_sec=10,
            transcript_has_probabilities=True,
        )
        out = wa.render_diff_md(report, slug="x")
        assert "no per-word probabilities" not in out


# ── End-to-end (real script + synthetic transcript) ──────────────────────────


class TestEndToEnd:
    """Belt-and-suspenders: align a synthetic transcript against the
    shipped prisoners-dilemma script. We don't assert specific issues
    (the alignment depends on script content that may evolve) — just that
    the pipeline runs and produces a sensible report."""

    @pytest.fixture(scope="class")
    def script_path(self) -> Path:
        p = ffr.find_script("prisoners-dilemma")
        if p is None or not p.is_file():
            pytest.skip("prisoners-dilemma script not present")
        return p

    def test_runs_against_real_script(self, script_path):
        # Build a transcript that matches the first sentence reasonably well.
        # The remaining missed material should still produce a valid report.
        transcript = _make_transcript([
            ("The", 0.0, 0.3, 0.99),
            ("Prisoner's", 0.3, 0.8, 0.95),
            ("Dilemma", 0.8, 1.3, 0.95),
        ])
        report = wa.run_alignment(script_path, transcript, low_conf_threshold=0.5)
        assert report.script_word_count > 100   # real script is long
        assert report.transcript_word_count == 3
        # Should produce at least one major issue (the unrecorded rest).
        assert len(report.major_issues) >= 1
        # Rendering shouldn't blow up on large diffs.
        md = wa.render_diff_md(report, slug="prisoners-dilemma")
        assert "Narration Diff" in md

    def test_custom_wpm_changes_estimated_duration(self, script_path):
        """Regression: WPM was hardcoded as 150 in 5 places, so --wpm
        was silently ignored and delivery-skew calculations were wrong
        for any non-default delivery target."""
        transcript = _make_transcript([("x", 0.0, 1.0, 0.99)])
        r150 = wa.run_alignment(script_path, transcript, low_conf_threshold=0.5, wpm=150)
        r100 = wa.run_alignment(script_path, transcript, low_conf_threshold=0.5, wpm=100)
        # Slower target (100 wpm) → longer estimated duration.
        assert r100.estimated_script_duration_sec > r150.estimated_script_duration_sec
        # Report should echo the wpm value used.
        assert r100.wpm == 100
        assert "at 100 wpm" in wa.render_diff_md(r100, slug="x")


# ── CLI smoke ────────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_with_explicit_transcript_runs(self, tmp_path):
        # Build a script + transcript pair locally so no real-data dependency.
        script = tmp_path / "script-production.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — TEST

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world. | x |
        """), encoding="utf-8")
        transcript = tmp_path / "t.json"
        transcript.write_text(json.dumps({
            "segments": [{
                "start": 0.0, "end": 1.0, "text": "Hello world.",
                "words": [
                    {"start": 0.0, "end": 0.4, "word": "Hello", "probability": 0.99},
                    {"start": 0.4, "end": 1.0, "word": "world.", "probability": 0.99},
                ],
            }]
        }), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "whisper_alignment.py"),
                "smoke",
                "--script", str(script),
                "--transcript", str(transcript),
                "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0, result.stderr
        assert "No pickup candidates" in result.stdout

    def test_missing_transcript_exits_2(self, tmp_path):
        script = tmp_path / "s.md"
        script.write_text("## BEAT 1 — T\n\n| NARRATION | VISUAL |\n|---|---|\n| hi | x |\n",
                          encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "whisper_alignment.py"),
                "x",
                "--script", str(script),
                "--transcript", str(tmp_path / "no-such.json"),
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
