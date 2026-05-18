"""
Unit tests for tools/learn/prediction_tracker.py.

Covers:
  · _load_or_init (existing / missing / malformed)
  · record_prediction / record_actual (creates file + merges)
  · compute_episode_calibration (matches pairs, skips missing,
    handles zero predicted)
  · compute_field_summary (mean / abs-mean / within-15pct count)
  · build_calibration_report (slug filter + all-episode discovery)
  · render_report_md
  · CLI smoke (record / actual / report / --strict drift)
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import prediction_tracker as pt  # type: ignore[import-not-found]


# ── _load_or_init ──────────────────────────────────────────────────────────


class TestLoadOrInit:
    def test_missing_returns_skeleton(self, tmp_path):
        data = pt._load_or_init(tmp_path / "no-such.json", default_slug="x")
        assert data == {"slug": "x"}

    def test_loads_existing(self, tmp_path):
        p = tmp_path / "x.json"
        p.write_text(json.dumps({"slug": "y", "predictions": {"a": 1}}), encoding="utf-8")
        data = pt._load_or_init(p, default_slug="x")
        assert data["slug"] == "y"
        assert data["predictions"]["a"] == 1

    def test_malformed_returns_skeleton(self, tmp_path):
        p = tmp_path / "x.json"
        p.write_text("not json", encoding="utf-8")
        data = pt._load_or_init(p, default_slug="x")
        assert data == {"slug": "x"}


# ── record_prediction / record_actual ───────────────────────────────────────


class TestRecord:
    def test_record_creates_file(self, tmp_path, monkeypatch):
        monkeypatch.setattr(pt, "EPISODES_DIR", tmp_path)
        path = pt.record_prediction("ep-a", "expected_runtime_sec", 770)
        assert path.is_file()
        data = json.loads(path.read_text())
        assert data["slug"] == "ep-a"
        assert data["predictions"]["expected_runtime_sec"] == 770

    def test_record_merges_with_existing(self, tmp_path, monkeypatch):
        monkeypatch.setattr(pt, "EPISODES_DIR", tmp_path)
        pt.record_prediction("ep-a", "expected_runtime_sec", 770)
        pt.record_prediction("ep-a", "expected_ctr_pct", 4.5)
        data = json.loads(pt._predictions_path("ep-a").read_text())
        assert data["predictions"]["expected_runtime_sec"] == 770
        assert data["predictions"]["expected_ctr_pct"] == 4.5

    def test_actual_creates_file(self, tmp_path, monkeypatch):
        monkeypatch.setattr(pt, "EPISODES_DIR", tmp_path)
        path = pt.record_actual("ep-a", "actual_runtime_sec", 812)
        data = json.loads(path.read_text())
        assert data["actuals"]["actual_runtime_sec"] == 812


# ── compute_episode_calibration ────────────────────────────────────────────


class TestComputeEpisodeCalibration:
    def _setup(self, tmp_path, monkeypatch, predictions=None, actuals=None):
        monkeypatch.setattr(pt, "EPISODES_DIR", tmp_path)
        if predictions:
            (tmp_path / "ep-a").mkdir()
            (tmp_path / "ep-a" / "predictions.json").write_text(
                json.dumps({"slug": "ep-a", "predictions": predictions}),
                encoding="utf-8",
            )
        if actuals:
            (tmp_path / "ep-a").mkdir(exist_ok=True)
            (tmp_path / "ep-a" / "actuals.json").write_text(
                json.dumps({"slug": "ep-a", "actuals": actuals}),
                encoding="utf-8",
            )

    def test_matches_paired_fields(self, tmp_path, monkeypatch):
        self._setup(
            tmp_path, monkeypatch,
            predictions={"expected_runtime_sec": 800, "expected_ctr_pct": 4.0},
            actuals={"actual_runtime_sec": 880, "actual_ctr_pct": 3.5},
        )
        cal = pt.compute_episode_calibration("ep-a")
        assert len(cal.deltas) == 2
        runtime = next(d for d in cal.deltas if d.field == "expected_runtime_sec")
        assert runtime.predicted == 800
        assert runtime.actual == 880
        # 880 - 800 = 80; 80 / 800 = 10%
        assert runtime.delta_pct == pytest.approx(10.0)

    def test_missing_actual_skipped(self, tmp_path, monkeypatch):
        self._setup(
            tmp_path, monkeypatch,
            predictions={"expected_runtime_sec": 800},
            actuals={},
        )
        cal = pt.compute_episode_calibration("ep-a")
        assert cal.deltas == []

    def test_zero_predicted_skipped(self, tmp_path, monkeypatch):
        # Avoid div-by-zero
        self._setup(
            tmp_path, monkeypatch,
            predictions={"expected_runtime_sec": 0},
            actuals={"actual_runtime_sec": 100},
        )
        cal = pt.compute_episode_calibration("ep-a")
        assert cal.deltas == []

    def test_non_numeric_value_skipped(self, tmp_path, monkeypatch):
        self._setup(
            tmp_path, monkeypatch,
            predictions={"expected_runtime_sec": "TBD"},
            actuals={"actual_runtime_sec": 100},
        )
        cal = pt.compute_episode_calibration("ep-a")
        assert cal.deltas == []


# ── compute_field_summary ──────────────────────────────────────────────────


class TestAutoPairFields:
    def test_auto_pairs_by_convention(self):
        pred = {"expected_runtime_sec": 100, "expected_engagement_priya": 8}
        actual = {"actual_runtime_sec": 110, "actual_engagement_priya": 7}
        pairs = pt.auto_pair_fields(pred, actual)
        assert pairs["expected_runtime_sec"] == "actual_runtime_sec"
        assert pairs["expected_engagement_priya"] == "actual_engagement_priya"

    def test_only_pairs_if_actual_exists(self):
        pred = {"expected_orphan": 5}
        actual = {}
        pairs = pt.auto_pair_fields(pred, actual)
        assert "expected_orphan" not in pairs

    def test_preserves_default_pairs(self):
        pairs = pt.auto_pair_fields({}, {})
        for k in pt.DEFAULT_FIELD_PAIRS:
            assert k in pairs


class TestIsKnownField:
    def test_default_pairs_known(self):
        assert pt._is_known_field("expected_runtime_sec")
        assert pt._is_known_field("actual_runtime_sec")

    def test_convention_known(self):
        assert pt._is_known_field("expected_anything_new")
        assert pt._is_known_field("actual_anything_new")

    def test_typo_unknown(self):
        assert not pt._is_known_field("expectde_runtime_sec")
        assert not pt._is_known_field("runtime_sec")


class TestAtomicSave:
    def test_save_via_replace_no_partial(self, tmp_path):
        # Atomic write should leave the destination either fully written
        # or untouched. We can't easily simulate a crash, but we CAN
        # verify the .tmp.* sidecar gets cleaned up.
        target = tmp_path / "predictions.json"
        pt._save(target, {"slug": "x"})
        assert target.is_file()
        # No leftover .tmp files in the parent
        tmp_leftovers = list(tmp_path.glob(".predictions.json.*.tmp"))
        assert tmp_leftovers == []


class TestComputeFieldSummary:
    def _make_cal(self, slug, deltas):
        return pt.EpisodeCalibration(slug=slug, deltas=deltas)

    def test_empty(self):
        s = pt.compute_field_summary("expected_runtime_sec", [])
        assert s.sample_count == 0
        assert s.mean_delta_pct == 0.0

    def test_mean_and_within_15(self):
        cals = [
            self._make_cal("a", [pt.FieldDelta(
                field="expected_runtime_sec", predicted=100, actual=110,
                delta_abs=10, delta_pct=10,
            )]),
            self._make_cal("b", [pt.FieldDelta(
                field="expected_runtime_sec", predicted=100, actual=80,
                delta_abs=-20, delta_pct=-20,
            )]),
            self._make_cal("c", [pt.FieldDelta(
                field="expected_runtime_sec", predicted=100, actual=105,
                delta_abs=5, delta_pct=5,
            )]),
        ]
        s = pt.compute_field_summary("expected_runtime_sec", cals)
        assert s.sample_count == 3
        # Mean of 10, -20, 5 = -1.67
        assert s.mean_delta_pct == pytest.approx(-1.67, abs=0.01)
        # |10| + |20| + |5| / 3 = 35/3 = 11.67
        assert s.abs_mean_delta_pct == pytest.approx(11.67, abs=0.01)
        # |10|, |5| within 15 → 2; |20| outside → 1
        assert s.within_15pct_count == 2


# ── build_calibration_report ───────────────────────────────────────────────


class TestBuildCalibrationReport:
    def test_discovers_all_episodes(self, tmp_path, monkeypatch):
        monkeypatch.setattr(pt, "EPISODES_DIR", tmp_path)
        for slug in ("ep-a", "ep-b"):
            d = tmp_path / slug
            d.mkdir()
            (d / "predictions.json").write_text(json.dumps({
                "slug": slug, "predictions": {"expected_runtime_sec": 100},
            }), encoding="utf-8")
            (d / "actuals.json").write_text(json.dumps({
                "slug": slug, "actuals": {"actual_runtime_sec": 110},
            }), encoding="utf-8")
        report = pt.build_calibration_report()
        assert len(report.episode_calibrations) == 2
        slugs = {c.slug for c in report.episode_calibrations}
        assert slugs == {"ep-a", "ep-b"}

    def test_slug_filter(self, tmp_path, monkeypatch):
        monkeypatch.setattr(pt, "EPISODES_DIR", tmp_path)
        for slug in ("ep-a", "ep-b"):
            d = tmp_path / slug
            d.mkdir()
            (d / "predictions.json").write_text(json.dumps({
                "slug": slug, "predictions": {"expected_runtime_sec": 100},
            }), encoding="utf-8")
            (d / "actuals.json").write_text(json.dumps({
                "slug": slug, "actuals": {"actual_runtime_sec": 110},
            }), encoding="utf-8")
        report = pt.build_calibration_report(slug_filter="ep-a")
        assert len(report.episode_calibrations) == 1
        assert report.episode_calibrations[0].slug == "ep-a"

    def test_no_data_empty_report(self, tmp_path, monkeypatch):
        monkeypatch.setattr(pt, "EPISODES_DIR", tmp_path)
        report = pt.build_calibration_report()
        assert report.episode_calibrations == []
        # field_summaries still present, all with sample_count = 0
        assert all(s.sample_count == 0 for s in report.field_summaries)


# ── render_report_md ───────────────────────────────────────────────────────


class TestRenderReport:
    def test_renders_summary_and_per_episode(self):
        cal = pt.EpisodeCalibration(
            slug="ep-a",
            deltas=[pt.FieldDelta(
                field="expected_runtime_sec", predicted=100, actual=110,
                delta_abs=10, delta_pct=10.0,
            )],
        )
        summary = pt.FieldCalibration(
            field="expected_runtime_sec", sample_count=1,
            mean_delta_pct=10.0, abs_mean_delta_pct=10.0,
            within_threshold_count=1,
        )
        report = pt.CalibrationReport(
            episode_calibrations=[cal], field_summaries=[summary],
        )
        out = pt.render_report_md(report)
        assert "Per-field calibration summary" in out
        assert "expected_runtime_sec" in out
        assert "ep-a" in out
        assert "+10.0%" in out


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_record_writes_file(self, tmp_path, monkeypatch):
        monkeypatch.setenv("PARALLAX_EPISODES_DIR", str(tmp_path))
        # The CLI doesn't honor that env var directly — instead test via
        # the library API (CLI just shells through to it). Verify by
        # invoking the CLI then checking the resulting file location.
        # Use --slug under a tmp episodes dir by patching EPISODES_DIR
        # through Python rather than env. Skip env-based test.
        # Instead use a direct CLI invocation with the real EPISODES_DIR
        # but a guaranteed-unique slug, and clean up after.
        slug = "tracker-smoke-test"
        ep_dir = REPO_ROOT / "episodes" / slug
        try:
            result = subprocess.run(
                [sys.executable, str(REPO_ROOT / "tools" / "learn" / "prediction_tracker.py"),
                 "record", slug, "--field", "expected_runtime_sec", "--value", "770"],
                capture_output=True, text=True,
            )
            assert result.returncode == 0
            assert (ep_dir / "predictions.json").is_file()
            data = json.loads((ep_dir / "predictions.json").read_text())
            assert data["predictions"]["expected_runtime_sec"] == 770
        finally:
            if ep_dir.exists():
                for f in ep_dir.iterdir():
                    f.unlink()
                ep_dir.rmdir()

    def test_actual_writes_file(self):
        slug = "tracker-actual-test"
        ep_dir = REPO_ROOT / "episodes" / slug
        try:
            result = subprocess.run(
                [sys.executable, str(REPO_ROOT / "tools" / "learn" / "prediction_tracker.py"),
                 "actual", slug, "--field", "actual_runtime_sec", "--value", "812"],
                capture_output=True, text=True,
            )
            assert result.returncode == 0
            assert (ep_dir / "actuals.json").is_file()
        finally:
            if ep_dir.exists():
                for f in ep_dir.iterdir():
                    f.unlink()
                ep_dir.rmdir()

    def test_report_runs_empty(self):
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "learn" / "prediction_tracker.py"),
             "report", "--slug", "definitely-nonexistent-slug", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert "Prediction Calibration Report" in result.stdout

    def test_report_json(self):
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "learn" / "prediction_tracker.py"),
             "report", "--slug", "definitely-nonexistent-slug", "--json", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert "episode_calibrations" in payload
        assert "field_summaries" in payload

    def test_strict_exits_1_on_drift(self):
        slug = "tracker-drift-test"
        ep_dir = REPO_ROOT / "episodes" / slug
        try:
            # 50% drift exceeds default 15% threshold
            subprocess.run(
                [sys.executable, str(REPO_ROOT / "tools" / "learn" / "prediction_tracker.py"),
                 "record", slug, "--field", "expected_runtime_sec", "--value", "100"],
                capture_output=True, text=True,
            )
            subprocess.run(
                [sys.executable, str(REPO_ROOT / "tools" / "learn" / "prediction_tracker.py"),
                 "actual", slug, "--field", "actual_runtime_sec", "--value", "150"],
                capture_output=True, text=True,
            )
            result = subprocess.run(
                [sys.executable, str(REPO_ROOT / "tools" / "learn" / "prediction_tracker.py"),
                 "report", "--slug", slug, "--strict", "--stdout"],
                capture_output=True, text=True,
            )
            assert result.returncode == 1
        finally:
            if ep_dir.exists():
                for f in ep_dir.iterdir():
                    f.unlink()
                ep_dir.rmdir()
