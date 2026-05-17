"""
Unit tests for tools/narration/take_selector.py.

Coverage:
  · Scoring functions (overall + per-beat) — pure, easy to test
  · TakeMetrics properties (pickup_count, delivery_skew_pct)
  · Ranking + best-per-beat selection + single-winner detection
  · render_comparison_md output structure
  · CLI guards (< 2 takes, mismatched --names, missing files)
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import textwrap
from dataclasses import dataclass, field
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import format_for_reading as ffr  # type: ignore[import-not-found]
import take_selector as ts  # type: ignore[import-not-found]
import whisper_alignment as wa  # type: ignore[import-not-found]


# ── Helpers ──────────────────────────────────────────────────────────────────


def _make_report(
    pickups: int = 0, low_conf: int = 0,
    duration: float = 60.0, estimated: float = 60.0,
    beats: list[ffr.Beat] | None = None,
    beat_pickup_map: dict[int, int] | None = None,
) -> wa.AlignmentReport:
    """Build an AlignmentReport with controllable scoring inputs."""
    beats = beats or []
    issues: list[wa.AlignmentIssue] = []
    # Distribute pickup issues across beats per the beat_pickup_map.
    # If no map, dump all into beat 1 (or beat 0 if no beats).
    distribution = beat_pickup_map or ({beats[0].number: pickups} if beats else {0: pickups})
    for beat_num, count in distribution.items():
        for _ in range(count):
            issues.append(wa.AlignmentIssue(
                kind="missed", severity="major",
                script_text="x x x", spoken_text="",
                audio_start_sec=0, audio_end_sec=0, beat_number=beat_num,
            ))
    for _ in range(low_conf):
        issues.append(wa.AlignmentIssue(
            kind="low_confidence", severity="minor",
            script_text="", spoken_text="y",
            audio_start_sec=0, audio_end_sec=0,
            beat_number=beats[0].number if beats else 0,
        ))
    return wa.AlignmentReport(
        issues=issues,
        script_word_count=100, transcript_word_count=100,
        transcript_duration_sec=duration,
        estimated_script_duration_sec=estimated,
        beats=beats,
    )


def _make_metrics(name: str, **report_kwargs) -> ts.TakeMetrics:
    report = _make_report(**report_kwargs)
    m = ts.TakeMetrics(name=name, source_path=Path(f"/tmp/{name}.json"), report=report)
    m.score_overall = ts.score_take(report)
    m.score_per_beat, m.pickups_per_beat = ts.score_per_beat(report)
    return m


# ── score_take ───────────────────────────────────────────────────────────────


class TestScoreTake:
    def test_clean_take_scores_zero(self):
        report = _make_report(pickups=0, low_conf=0, duration=60, estimated=60)
        assert ts.score_take(report) == 0

    def test_pickup_dominates_score(self):
        # 1 pickup = PICKUP_WEIGHT; 10 low-conf = 10*LOW_CONFIDENCE_WEIGHT
        r1 = _make_report(pickups=1, low_conf=0)
        r2 = _make_report(pickups=0, low_conf=10)
        assert ts.score_take(r1) == pytest.approx(ts.PICKUP_WEIGHT)
        assert ts.score_take(r2) == pytest.approx(10 * ts.LOW_CONFIDENCE_WEIGHT)
        # With default weights (10 vs 1), 1 pickup ties 10 low-conf.

    def test_skew_penalty_is_signed_but_scored_absolute(self):
        # 50% faster delivery should score the same as 50% slower.
        slower = _make_report(duration=90, estimated=60)   # +50%
        faster = _make_report(duration=30, estimated=60)   # -50%
        assert ts.score_take(slower) == pytest.approx(ts.score_take(faster))

    def test_zero_estimate_safe(self):
        # Guard against divide-by-zero when script word count is 0.
        report = _make_report(duration=10, estimated=0)
        assert ts.score_take(report) == 0  # no skew, no pickups, no low-conf


# ── score_per_beat ───────────────────────────────────────────────────────────


class TestScorePerBeat:
    def test_beat_with_pickup_scored_higher(self):
        beats = [
            ffr.Beat(number=1, title="One", timing=""),
            ffr.Beat(number=2, title="Two", timing=""),
        ]
        report = _make_report(beats=beats, beat_pickup_map={1: 2, 2: 0})
        scores, pickups = ts.score_per_beat(report)
        assert pickups == {1: 2, 2: 0}
        assert scores[1] > scores[2]
        assert scores[2] == 0

    def test_beat_with_no_issues_scores_zero(self):
        beats = [ffr.Beat(number=5, title="Five", timing="")]
        report = _make_report(beats=beats, beat_pickup_map={5: 0})
        scores, _ = ts.score_per_beat(report)
        assert scores[5] == 0

    def test_low_conf_scored_separately(self):
        beats = [ffr.Beat(number=1, title="One", timing="")]
        report = wa.AlignmentReport(
            issues=[
                wa.AlignmentIssue(
                    kind="low_confidence", severity="minor",
                    script_text="", spoken_text="x",
                    audio_start_sec=0, audio_end_sec=0, beat_number=1,
                )
            ],
            script_word_count=10, transcript_word_count=10,
            transcript_duration_sec=10, estimated_script_duration_sec=10,
            beats=beats,
        )
        scores, pickups = ts.score_per_beat(report)
        assert pickups[1] == 0  # no pickup-class issues
        assert scores[1] == pytest.approx(ts.LOW_CONFIDENCE_WEIGHT)


# ── TakeMetrics properties ───────────────────────────────────────────────────


class TestTakeMetrics:
    def test_pickup_count_reflects_report(self):
        m = _make_metrics("t1", pickups=3)
        assert m.pickup_count == 3

    def test_low_confidence_count(self):
        m = _make_metrics("t1", low_conf=2)
        assert m.low_confidence_count == 2

    def test_delivery_skew_positive_when_slower(self):
        m = _make_metrics("t1", duration=120, estimated=60)
        assert m.delivery_skew_pct == pytest.approx(100.0)

    def test_delivery_skew_negative_when_faster(self):
        m = _make_metrics("t1", duration=30, estimated=60)
        assert m.delivery_skew_pct == pytest.approx(-50.0)

    def test_delivery_skew_zero_when_no_estimate(self):
        m = _make_metrics("t1", duration=10, estimated=0)
        assert m.delivery_skew_pct == 0.0


# ── rank_takes ───────────────────────────────────────────────────────────────


class TestRankTakes:
    def test_lower_score_comes_first(self):
        a = _make_metrics("a", pickups=5)
        b = _make_metrics("b", pickups=1)
        c = _make_metrics("c", pickups=3)
        ranked = ts.rank_takes([a, b, c])
        assert [t.name for t in ranked] == ["b", "c", "a"]

    def test_clean_take_wins(self):
        a = _make_metrics("clean", pickups=0)
        b = _make_metrics("sloppy", pickups=10)
        ranked = ts.rank_takes([a, b])
        assert ranked[0].name == "clean"


# ── pick_best_per_beat ───────────────────────────────────────────────────────


class TestPickBestPerBeat:
    def test_picks_lowest_scoring_per_beat(self):
        beats = [
            ffr.Beat(number=1, title="One", timing=""),
            ffr.Beat(number=2, title="Two", timing=""),
        ]
        # A: clean on beat 1, sloppy on beat 2
        # B: sloppy on beat 1, clean on beat 2
        a = _make_metrics("A", beats=beats, beat_pickup_map={1: 0, 2: 3})
        b = _make_metrics("B", beats=beats, beat_pickup_map={1: 3, 2: 0})
        best = ts.pick_best_per_beat([a, b], beats)
        assert best[1].name == "A"
        assert best[2].name == "B"

    def test_ties_broken_by_overall_score(self):
        beats = [ffr.Beat(number=1, title="One", timing="")]
        # Both takes have 0 pickups on beat 1 (tied per-beat) — but A has
        # better overall score.
        a = _make_metrics("A", beats=beats, beat_pickup_map={1: 0})
        b = _make_metrics("B", beats=beats, beat_pickup_map={1: 0})
        b.score_overall = 50.0   # bump B's overall to break the tie
        a.score_overall = 0.0
        best = ts.pick_best_per_beat([a, b], beats)
        assert best[1].name == "A"


# ── has_single_winning_take ──────────────────────────────────────────────────


class TestHasSingleWinningTake:
    def test_returns_take_when_one_wins_all_beats(self):
        beats = [ffr.Beat(number=1, title="x", timing=""), ffr.Beat(number=2, title="y", timing="")]
        a = _make_metrics("A", beats=beats, beat_pickup_map={1: 0, 2: 0})
        b = _make_metrics("B", beats=beats, beat_pickup_map={1: 3, 2: 3})
        best = ts.pick_best_per_beat([a, b], beats)
        winner = ts.has_single_winning_take([a, b], best)
        assert winner is not None and winner.name == "A"

    def test_returns_none_when_takes_split_beats(self):
        beats = [ffr.Beat(number=1, title="x", timing=""), ffr.Beat(number=2, title="y", timing="")]
        a = _make_metrics("A", beats=beats, beat_pickup_map={1: 0, 2: 5})
        b = _make_metrics("B", beats=beats, beat_pickup_map={1: 5, 2: 0})
        best = ts.pick_best_per_beat([a, b], beats)
        assert ts.has_single_winning_take([a, b], best) is None

    def test_returns_none_for_empty_beats(self):
        assert ts.has_single_winning_take([], {}) is None


# ── render_comparison_md ─────────────────────────────────────────────────────


class TestRenderComparisonMd:
    def _make_pair(self, splice_required: bool):
        beats = [
            ffr.Beat(number=1, title="ONE", timing="0:00–1:00"),
            ffr.Beat(number=2, title="TWO", timing="1:00–2:00"),
        ]
        if splice_required:
            a = _make_metrics("Take A", beats=beats, beat_pickup_map={1: 0, 2: 5})
            b = _make_metrics("Take B", beats=beats, beat_pickup_map={1: 5, 2: 0})
        else:
            a = _make_metrics("Take A", beats=beats, beat_pickup_map={1: 0, 2: 0})
            b = _make_metrics("Take B", beats=beats, beat_pickup_map={1: 5, 2: 5})
        return [a, b], beats

    def test_overall_ranking_table_present(self):
        takes, beats = self._make_pair(splice_required=False)
        out = ts.render_comparison_md(takes, beats, slug="x")
        assert "## Overall ranking" in out
        assert "🥇" in out

    def test_single_winner_verdict(self):
        takes, beats = self._make_pair(splice_required=False)
        out = ts.render_comparison_md(takes, beats, slug="x")
        assert "🏆" in out
        assert "Use Take A for the entire episode" in out
        assert "Splice cheat sheet" not in out  # no splice needed

    def test_splice_verdict_when_takes_split_beats(self):
        takes, beats = self._make_pair(splice_required=True)
        out = ts.render_comparison_md(takes, beats, slug="x")
        assert "⚠️" in out
        assert "No single take wins every beat" in out
        assert "Splice cheat sheet" in out

    def test_per_beat_table_includes_all_takes(self):
        takes, beats = self._make_pair(splice_required=True)
        out = ts.render_comparison_md(takes, beats, slug="x")
        assert "Take A score" in out
        assert "Take B score" in out

    def test_winner_marked_with_checkmark(self):
        takes, beats = self._make_pair(splice_required=True)
        out = ts.render_comparison_md(takes, beats, slug="x")
        # Both takes should appear with a ✓ in their winning beat.
        assert "✓ 0.0" in out


# ── CLI smoke ────────────────────────────────────────────────────────────────


class TestCliSmoke:
    def _make_script(self, tmp_path: Path) -> Path:
        p = tmp_path / "script-production.md"
        p.write_text(textwrap.dedent("""\
            ## BEAT 1 — TEST

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world. | x |
        """), encoding="utf-8")
        return p

    def _make_transcript(self, tmp_path: Path, name: str, words: list[str]) -> Path:
        p = tmp_path / f"{name}.json"
        word_entries = [
            {"start": i * 0.5, "end": (i + 1) * 0.5, "word": w, "probability": 0.99}
            for i, w in enumerate(words)
        ]
        p.write_text(json.dumps({
            "segments": [{
                "start": 0.0, "end": len(words) * 0.5,
                "text": " ".join(words),
                "words": word_entries,
            }]
        }), encoding="utf-8")
        return p

    def test_runs_with_two_transcripts(self, tmp_path):
        script = self._make_script(tmp_path)
        t1 = self._make_transcript(tmp_path, "take1", ["Hello", "world."])
        t2 = self._make_transcript(tmp_path, "take2", ["Hello", "world."])
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "take_selector.py"),
                "smoke",
                "--script", str(script),
                "--transcripts", str(t1), str(t2),
                "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0, result.stderr
        assert "Take Comparison" in result.stdout
        assert "Overall ranking" in result.stdout

    def test_single_take_rejected(self, tmp_path):
        script = self._make_script(tmp_path)
        t1 = self._make_transcript(tmp_path, "take1", ["Hello", "world."])
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "take_selector.py"),
                "smoke",
                "--script", str(script),
                "--transcripts", str(t1),
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "at least 2 takes" in result.stderr

    def test_mismatched_names_rejected(self, tmp_path):
        script = self._make_script(tmp_path)
        t1 = self._make_transcript(tmp_path, "take1", ["Hello", "world."])
        t2 = self._make_transcript(tmp_path, "take2", ["Hello", "world."])
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "take_selector.py"),
                "smoke",
                "--script", str(script),
                "--transcripts", str(t1), str(t2),
                "--names", "OnlyOne",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "--names" in result.stderr

    def test_missing_input_file_rejected(self, tmp_path):
        script = self._make_script(tmp_path)
        t1 = self._make_transcript(tmp_path, "take1", ["Hello", "world."])
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "take_selector.py"),
                "smoke",
                "--script", str(script),
                "--transcripts", str(t1), str(tmp_path / "no-such.json"),
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "not found" in result.stderr
