"""
Unit tests for tools/narration/script_diff.py.

Coverage:
  · compare() produces one delta per tracked metric
  · Significance flagging respects thresholds
  · Direction arrows (↑↓→) correct
  · Per-beat comparison handles unequal beat counts
  · Real-data smoke against v5 vs v6 of prisoners-dilemma
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
import script_diff as sd  # type: ignore[import-not-found]


def _make_metrics(**overrides) -> em.EngagementMetrics:
    """Minimal EngagementMetrics for testing compare() in isolation."""
    defaults = dict(
        slug="test", script_path="/tmp/test.md",
        total_word_count=1000, total_runtime_sec=400.0,
        beat_count=5, beats=[],
        cold_open_word_count=50, hook_position_sec=20.0,
        hook_take_index=2, has_pivot_signal=True,
        pattern_interrupt_count=30, pattern_interrupts_per_min=4.5,
        visual_tag_count=30, dir_cut_count=0,
    )
    defaults.update(overrides)
    return em.EngagementMetrics(**defaults)


class TestCompare:
    def test_produces_one_row_per_tracked_metric(self):
        a = _make_metrics()
        b = _make_metrics()
        deltas = sd.compare(a, b)
        # 8 metric rows expected per the implementation
        assert len(deltas) == 8

    def test_significance_threshold(self):
        # word count delta of 100 = 10% on a 1000-word baseline → above 5% threshold
        a = _make_metrics(total_word_count=1000)
        b = _make_metrics(total_word_count=1100)
        deltas = sd.compare(a, b)
        word_delta = next(d for d in deltas if d.name == "Total words")
        assert word_delta.significant

    def test_below_threshold_not_significant(self):
        a = _make_metrics(total_word_count=1000)
        b = _make_metrics(total_word_count=1010)  # 1% — below threshold
        deltas = sd.compare(a, b)
        word_delta = next(d for d in deltas if d.name == "Total words")
        assert not word_delta.significant

    def test_direction_arrows(self):
        a = _make_metrics(pattern_interrupts_per_min=5.0)
        b = _make_metrics(pattern_interrupts_per_min=8.0)
        deltas = sd.compare(a, b)
        pi = next(d for d in deltas if "Pattern interrupts" in d.name)
        assert pi.direction == "↑"

        b2 = _make_metrics(pattern_interrupts_per_min=2.0)
        deltas2 = sd.compare(a, b2)
        pi2 = next(d for d in deltas2 if "Pattern interrupts" in d.name)
        assert pi2.direction == "↓"

    def test_equal_values_show_no_change(self):
        a = _make_metrics(total_word_count=1000)
        b = _make_metrics(total_word_count=1000)
        deltas = sd.compare(a, b)
        word = next(d for d in deltas if d.name == "Total words")
        assert word.direction == "→"

    def test_pivot_gained_message(self):
        a = _make_metrics(has_pivot_signal=False)
        b = _make_metrics(has_pivot_signal=True)
        deltas = sd.compare(a, b)
        pivot = next(d for d in deltas if d.name == "Pivot detected")
        assert "GAINED" in pivot.delta


class TestComparePerBeat:
    def test_zip_handles_unequal_beat_counts(self):
        # Build per-beat metrics manually
        a_beat = em.BeatMetrics(
            number=1, title="A", word_count=100, estimated_runtime_sec=40,
            take_count=5, sentence_count=8, sentence_length_mean=12,
            sentence_length_median=11, bridge_sentence_count=2,
            direct_address_count=3, direct_address_per_100w=3.0,
            caveat_count=1, proper_noun_candidate_count=5,
        )
        a = _make_metrics(beats=[a_beat, a_beat], beat_count=2)
        b = _make_metrics(beats=[a_beat], beat_count=1)  # mismatched
        pairs = sd.compare_per_beat(a, b)
        # Zip truncates to the shorter, so only 1 pair returned
        assert len(pairs) == 1


# ── Rendering ───────────────────────────────────────────────────────────────


class TestRenderDiffMd:
    def test_header_includes_both_script_names(self):
        a = _make_metrics(script_path="/tmp/a.md")
        b = _make_metrics(script_path="/tmp/b.md")
        out = sd.render_diff_md(a, b, name_a="v5", name_b="v6")
        assert "v5 vs v6" in out
        assert "`a.md`" in out
        assert "`b.md`" in out

    def test_significant_deltas_bolded(self):
        a = _make_metrics(total_word_count=1000)
        b = _make_metrics(total_word_count=1300)  # 30% delta
        out = sd.render_diff_md(a, b)
        # Bold marker around the metric name in the table
        assert "**Total words**" in out


# ── Real-data smoke ─────────────────────────────────────────────────────────


class TestRealScripts:
    @pytest.fixture(scope="class")
    def v5_path(self) -> Path:
        p = REPO_ROOT / "episodes" / "prisoners-dilemma" / "script-v5-production.md"
        if not p.is_file():
            pytest.skip("v5 script not present")
        return p

    @pytest.fixture(scope="class")
    def v6_path(self) -> Path:
        p = REPO_ROOT / "episodes" / "prisoners-dilemma" / "script-v6-production.md"
        if not p.is_file():
            pytest.skip("v6 script not present")
        return p

    def test_v5_v6_diff_produces_some_significant_deltas(self, v5_path, v6_path):
        a = em.compute_engagement_metrics(v5_path)
        b = em.compute_engagement_metrics(v6_path)
        deltas = sd.compare(a, b)
        significant = [d for d in deltas if d.significant]
        # The two versions should differ on at least one tracked metric.
        # If they don't, either the metrics aren't sensitive enough or the
        # scripts are genuinely identical (which they aren't).
        assert len(significant) >= 1


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_runs_against_two_scripts(self, tmp_path):
        for name in ("a.md", "b.md"):
            (tmp_path / name).write_text(textwrap.dedent("""\
                ## BEAT 1 — TEST

                | NARRATION | VISUAL PRODUCTION |
                |-----------|-------------------|
                | Hello world. | x |
            """), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "script_diff.py"),
                str(tmp_path / "a.md"), str(tmp_path / "b.md"),
                "--names", "Alpha", "Beta",
                "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0, result.stderr
        assert "Alpha vs Beta" in result.stdout

    def test_missing_script_exits_2(self, tmp_path):
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "script_diff.py"),
                str(tmp_path / "nope.md"), str(tmp_path / "nope2.md"),
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
