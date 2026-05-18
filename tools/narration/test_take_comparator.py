"""
Unit tests for tools/narration/take_comparator.py.

Covers:
  · _band_score
  · Each per-metric scorer (word_accuracy / loudness / pace / silence / duration)
  · compute_take_score weighted sum
  · compute_pace_std with short / typical / empty transcripts
  · count_matched_script_words
  · compare_takes orchestration (mocked ffmpeg + whisper)
  · ComparisonReport.winner tiebreak (score, then fewer silences)
  · render_report_md (winner banner, ranking table, breakdown)
  · CLI smoke (missing inputs, valid path → mocked end-to-end)
"""

from __future__ import annotations

import json
import subprocess
import sys
import textwrap
from pathlib import Path
from unittest.mock import patch

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import take_comparator as tc  # type: ignore[import-not-found]
import whisper_alignment as wa  # type: ignore[import-not-found]


# ── _band_score ─────────────────────────────────────────────────────────────


class TestBandScore:
    def test_at_easy_full_score(self):
        assert tc._band_score(0.1, easy=0.2, hard=1.0, weight=10) == 10.0

    def test_at_hard_zero(self):
        assert tc._band_score(1.0, easy=0.2, hard=1.0, weight=10) == 0.0

    def test_midpoint_half(self):
        # (0.6 - 0.2) / (1.0 - 0.2) = 0.5 → 1 - 0.5 = 0.5 * weight = 5
        assert tc._band_score(0.6, easy=0.2, hard=1.0, weight=10) == 5.0


# ── Per-metric scorers ──────────────────────────────────────────────────────


def _make_measurements(**overrides):
    """Factory for TakeMeasurements with sensible defaults."""
    defaults = dict(
        wav_path="/tmp/x.wav",
        duration_sec=60.0,
        integrated_lufs=-16.0,
        transcript_word_count=150,
        script_word_count=150,
        matched_word_count=150,
        pace_std_words_per_sec=0.15,
        long_silence_count=0,
        estimated_script_duration_sec=60.0,
    )
    defaults.update(overrides)
    return tc.TakeMeasurements(**defaults)


class TestScorers:
    def test_word_accuracy_perfect(self):
        m = _make_measurements(matched_word_count=150, script_word_count=150)
        assert tc.score_word_accuracy(m) == tc.WEIGHT_WORD_ACCURACY

    def test_word_accuracy_partial(self):
        m = _make_measurements(matched_word_count=75, script_word_count=150)
        assert tc.score_word_accuracy(m) == pytest.approx(
            tc.WEIGHT_WORD_ACCURACY * 0.5,
        )

    def test_word_accuracy_clamped_when_transcript_repeats(self):
        # If the Whisper transcript hallucinates or repeats words, the raw
        # matched count can exceed script word count. Score must clamp
        # to [0, 1] so it doesn't blow past the weight ceiling.
        m = _make_measurements(matched_word_count=300, script_word_count=150)
        assert tc.score_word_accuracy(m) == tc.WEIGHT_WORD_ACCURACY

    def test_loudness_on_target(self):
        m = _make_measurements(integrated_lufs=tc.COMPARATOR_TARGET_LUFS)
        assert tc.score_loudness_match(m) == tc.WEIGHT_LOUDNESS_MATCH

    def test_loudness_far_off(self):
        # Way off target → 0
        m = _make_measurements(integrated_lufs=0.0)
        assert tc.score_loudness_match(m) == 0.0

    def test_pace_steady_full_score(self):
        m = _make_measurements(pace_std_words_per_sec=0.1)
        assert tc.score_pace_stability(m) == tc.WEIGHT_PACE_STABILITY

    def test_pace_unsteady_zero(self):
        m = _make_measurements(pace_std_words_per_sec=1.0)
        assert tc.score_pace_stability(m) == 0.0

    def test_silence_zero_full_score(self):
        m = _make_measurements(long_silence_count=0)
        assert tc.score_silence_pattern(m) == tc.WEIGHT_SILENCE_PATTERN

    def test_silence_many_zero(self):
        m = _make_measurements(long_silence_count=10)
        assert tc.score_silence_pattern(m) == 0.0

    def test_silence_middle_ramp(self):
        # Between easy (0) and hard (8) — partial score, not 0 or full
        m = _make_measurements(long_silence_count=4)
        score = tc.score_silence_pattern(m)
        assert 0 < score < tc.WEIGHT_SILENCE_PATTERN

    def test_duration_match_within_tolerance(self):
        m = _make_measurements(
            duration_sec=60.0, estimated_script_duration_sec=60.0,
        )
        assert tc.score_duration_match(m) == tc.WEIGHT_DURATION_MATCH

    def test_duration_unknown_no_penalty(self):
        m = _make_measurements(estimated_script_duration_sec=0)
        assert tc.score_duration_match(m) == tc.WEIGHT_DURATION_MATCH


# ── compute_take_score ──────────────────────────────────────────────────────


class TestComputeTakeScore:
    def test_perfect_take_max_score(self):
        m = _make_measurements()  # all defaults are "perfect"
        score, contribs = tc.compute_take_score(m)
        # Max possible: sum of all weights = 100
        assert score == 100.0
        assert all(v > 0 for v in contribs.values())

    def test_terrible_take_low_score(self):
        m = _make_measurements(
            matched_word_count=10, script_word_count=150,
            integrated_lufs=0.0,
            pace_std_words_per_sec=2.0,
            long_silence_count=20,
            duration_sec=120.0, estimated_script_duration_sec=60.0,
        )
        score, _ = tc.compute_take_score(m)
        assert score < 10

    def test_contributions_sum_to_score(self):
        m = _make_measurements(
            matched_word_count=100, script_word_count=150,
            integrated_lufs=-14.0,
            pace_std_words_per_sec=0.4,
            long_silence_count=2,
        )
        score, contribs = tc.compute_take_score(m)
        assert score == pytest.approx(sum(contribs.values()), abs=0.1)


# ── compute_pace_std ────────────────────────────────────────────────────────


def _make_transcript(words_per_window: list[int], window_sec: float = 10.0):
    """Build a Transcript with N words per window, uniformly spaced within."""
    words = []
    for win_idx, n in enumerate(words_per_window):
        for j in range(n):
            t = win_idx * window_sec + (j + 0.5) * (window_sec / max(n, 1))
            words.append(wa.TranscriptWord(
                word=f"w{win_idx}_{j}", start_sec=t, end_sec=t + 0.1,
                probability=1.0,
            ))
    return wa.Transcript(words=words)


class TestComputePaceStd:
    def test_steady_pace_low_std(self):
        # 15 words per 10s window, 4 windows → 0 std (need ≥3 windows
        # for the std computation to fire)
        t = _make_transcript([15, 15, 15, 15])
        assert tc.compute_pace_std(t) == 0.0

    def test_unsteady_pace_higher_std(self):
        # Vary words per window — 4 bins so we cross the ≥3 threshold
        t = _make_transcript([5, 25, 10, 20])
        std = tc.compute_pace_std(t)
        assert std > 0.5

    def test_empty_transcript(self):
        t = wa.Transcript(words=[])
        assert tc.compute_pace_std(t) == 0.0

    def test_too_short_returns_zero(self):
        # 5s transcript with 10s window → single window
        t = _make_transcript([10], window_sec=5.0)
        assert tc.compute_pace_std(t) == 0.0

    def test_two_windows_returns_zero_statistically_meaningless(self):
        # 2 windows is too few — std-dev of 2 samples is dominated by
        # noise, not a real pace pattern. The function correctly returns 0.
        t = _make_transcript([10, 30])
        assert tc.compute_pace_std(t) == 0.0


# ── count_matched_script_words ──────────────────────────────────────────────


class TestCountMatchedScriptWords:
    def test_full_match(self):
        script = ["hello", "world", "today"]
        transcript = ["hello", "world", "today"]
        assert tc.count_matched_script_words(script, transcript) == 3

    def test_partial_match(self):
        script = ["hello", "world", "today"]
        transcript = ["hello", "today"]
        assert tc.count_matched_script_words(script, transcript) == 2

    def test_case_and_punct_insensitive(self):
        script = ["Hello,", "WORLD."]
        transcript = ["hello", "world"]
        assert tc.count_matched_script_words(script, transcript) == 2

    def test_empty_inputs(self):
        assert tc.count_matched_script_words([], []) == 0
        assert tc.count_matched_script_words(["x"], []) == 0


# ── ComparisonReport.winner ─────────────────────────────────────────────────


class TestWinner:
    def test_picks_highest_score(self):
        report = tc.ComparisonReport(
            slug="x", script_path="/tmp/x.md", beat_number=None,
            takes=[
                tc.TakeScore(1, "/a.wav", _make_measurements(), score=85.0),
                tc.TakeScore(2, "/b.wav", _make_measurements(), score=92.0),
                tc.TakeScore(3, "/c.wav", _make_measurements(), score=80.0),
            ],
        )
        assert report.winner.take_index == 2

    def test_tiebreak_on_fewer_silences(self):
        report = tc.ComparisonReport(
            slug="x", script_path="/tmp/x.md", beat_number=None,
            takes=[
                tc.TakeScore(1, "/a.wav",
                             _make_measurements(long_silence_count=3), score=90.0),
                tc.TakeScore(2, "/b.wav",
                             _make_measurements(long_silence_count=1), score=90.0),
            ],
        )
        # Both 90; take 2 has fewer silences → wins
        assert report.winner.take_index == 2

    def test_no_takes_no_winner(self):
        report = tc.ComparisonReport(slug="x", script_path="/tmp/x.md", beat_number=None)
        assert report.winner is None


# ── compare_takes (mocked I/O) ─────────────────────────────────────────────


class TestCompareTakes:
    @pytest.fixture
    def tmp_script(self, tmp_path):
        script = tmp_path / "script.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — Open (0:00–1:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | The cat sat on the mat. | [FOOTAGE: x] |

            ## BEAT 2 — Body (1:00–2:00)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | A dog ran past quickly. | [FOOTAGE: y] |
        """), encoding="utf-8")
        return script

    def test_empty_wav_list_raises(self, tmp_script):
        with pytest.raises(ValueError, match="at least one"):
            tc.compare_takes("x", tmp_script, [])

    def test_beat_not_found_raises(self, tmp_script, tmp_path):
        wav = tmp_path / "fake.wav"
        wav.write_bytes(b"x")
        with pytest.raises(ValueError, match="beat .* not found"):
            tc.compare_takes("x", tmp_script, [wav], beat_number=99)

    def test_ranks_three_takes(self, tmp_script, tmp_path, monkeypatch):
        wavs = []
        for i in range(3):
            w = tmp_path / f"take{i}.wav"
            w.write_bytes(b"fake")
            wavs.append(w)

        # Mock measure_take to return canned measurements per WAV. Each
        # take varies on a different dimension; take 2 (index 1) is the
        # most balanced and should win.
        canned = {
            str(wavs[0]): _make_measurements(
                wav_path=str(wavs[0]),
                matched_word_count=8, script_word_count=12,   # 67% accuracy
                pace_std_words_per_sec=0.5,
                long_silence_count=3, integrated_lufs=-20.0,
            ),
            str(wavs[1]): _make_measurements(
                wav_path=str(wavs[1]),
                matched_word_count=12, script_word_count=12,  # 100% accuracy
                pace_std_words_per_sec=0.15,
                long_silence_count=0, integrated_lufs=-16.0,
            ),
            str(wavs[2]): _make_measurements(
                wav_path=str(wavs[2]),
                matched_word_count=10, script_word_count=12,  # 83% accuracy
                pace_std_words_per_sec=0.3,
                long_silence_count=1, integrated_lufs=-15.0,
            ),
        }

        def fake_measure(wav, script_words, word_count, est_dur):
            return canned[str(wav)]

        monkeypatch.setattr(tc, "measure_take", fake_measure)
        report = tc.compare_takes("test", tmp_script, wavs)
        assert len(report.takes) == 3
        # Take 2 (wavs[1], take_index=2) is the most balanced → wins
        assert report.winner.take_index == 2

    def test_corrupt_take_does_not_crash_comparison(self, tmp_script, tmp_path, monkeypatch):
        # One bad WAV should produce a synthetic 0-score take, NOT crash
        # the whole comparison and lose results for the other takes.
        wavs = [tmp_path / "a.wav", tmp_path / "b.wav"]
        for w in wavs:
            w.write_bytes(b"fake")

        good = _make_measurements(
            wav_path=str(wavs[0]),
            matched_word_count=12, script_word_count=12,
            integrated_lufs=-16.0,
        )

        def fake_measure(wav, *args, **kwargs):
            if str(wav) == str(wavs[1]):
                raise RuntimeError("ffmpeg: corrupt wav")
            return good

        monkeypatch.setattr(tc, "measure_take", fake_measure)
        report = tc.compare_takes("test", tmp_script, wavs)
        # Both takes recorded
        assert len(report.takes) == 2
        # Take 2 is the broken one — synthetic 0-score
        broken = report.takes[1]
        assert broken.score == 0.0
        assert broken.contributions.get("failed") is True
        # Take 1 still wins (good measurement preserved)
        assert report.winner.take_index == 1


# ── render_report_md ────────────────────────────────────────────────────────


class TestRenderReportMd:
    def test_winner_banner_present(self):
        m = _make_measurements()
        score, contribs = tc.compute_take_score(m)
        report = tc.ComparisonReport(
            slug="x", script_path="/tmp/x.md", beat_number=2,
            takes=[
                tc.TakeScore(1, "/a.wav", m, score=score, contributions=contribs),
                tc.TakeScore(2, "/b.wav", m, score=score - 10, contributions=contribs),
            ],
        )
        out = tc.render_report_md(report)
        assert "Recommended take" in out
        assert "Take 1" in out  # winner
        assert "Ranking" in out
        assert "Per-take score breakdown" in out

    def test_no_takes_no_winner_banner(self):
        report = tc.ComparisonReport(
            slug="x", script_path="/tmp/x.md", beat_number=None,
        )
        out = tc.render_report_md(report)
        # No winner section
        assert "Recommended take" not in out


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_missing_takes_arg_exits_2(self):
        # argparse error on missing --takes
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "narration" / "take_comparator.py"),
             "x"],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "--takes" in result.stderr

    def test_missing_wav_exits_2(self, tmp_path):
        script = tmp_path / "script.md"
        script.write_text("## BEAT 1 — x\n", encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "narration" / "take_comparator.py"),
             "x", "--script", str(script),
             "--takes", str(tmp_path / "no-such.wav")],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "not found" in result.stderr

    def test_missing_slug_script_exits_2(self, tmp_path):
        wav = tmp_path / "x.wav"
        wav.write_bytes(b"x")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "narration" / "take_comparator.py"),
             "definitely-not-an-episode-xyz",
             "--takes", str(wav)],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
