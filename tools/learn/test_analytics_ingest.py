"""
Unit tests for tools/learn/analytics_ingest.py.

Covers:
  · _classify_header (time/seconds, position/pct, mixed orderings)
  · parse_retention_csv (per-second + per-percent + locale variants)
  · detect_drops (no drops / single drop / merged adjacent / threshold)
  · map_drops_to_beats
  · RetentionDrop.severity bands
  · ingest_analytics end-to-end on synthetic CSV + manifest
  · render_report_md (no-drops / with-drops paths)
  · CLI smoke (missing CSV / valid synthetic / --strict / --json)
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import analytics_ingest as ai  # type: ignore[import-not-found]


# ── _classify_header ────────────────────────────────────────────────────────


class TestClassifyHeader:
    def test_seconds_and_retention(self):
        t, r, kind = ai._classify_header(["Time (seconds)", "Audience retention (%)"])
        assert t == 0
        assert r == 1
        assert kind == "seconds"

    def test_position_pct_and_retention(self):
        t, r, kind = ai._classify_header(["Video position (%)", "Audience retention (%)"])
        assert t == 0
        assert r == 1
        assert kind == "pct"

    def test_reversed_columns(self):
        t, r, kind = ai._classify_header(["Audience retention (%)", "Time (seconds)"])
        assert t == 1
        assert r == 0
        assert kind == "seconds"

    def test_no_recognized_columns_raises(self):
        with pytest.raises(ValueError, match="time / retention"):
            ai._classify_header(["Foo", "Bar"])


# ── parse_retention_csv ─────────────────────────────────────────────────────


class TestParseRetentionCsv:
    def test_per_second_csv(self, tmp_path):
        csv = tmp_path / "retention.csv"
        csv.write_text(
            "Time (seconds),Audience retention (%)\n"
            "0,100\n10,90\n20,75\n",
            encoding="utf-8",
        )
        points = ai.parse_retention_csv(csv, total_duration_sec=30)
        assert len(points) == 3
        assert points[0].time_sec == 0.0
        assert points[2].retention_pct == 75.0

    def test_per_percent_csv_normalized(self, tmp_path):
        csv = tmp_path / "retention.csv"
        csv.write_text(
            "Video position (%),Audience retention (%)\n"
            "0,100\n50,75\n100,40\n",
            encoding="utf-8",
        )
        points = ai.parse_retention_csv(csv, total_duration_sec=600)
        # 50% of 600s = 300s
        assert points[1].time_sec == 300.0
        assert points[2].time_sec == 600.0

    def test_skips_blank_lines_and_bad_rows(self, tmp_path):
        csv = tmp_path / "retention.csv"
        csv.write_text(
            "Time (seconds),Audience retention (%)\n"
            "0,100\n"
            "not-a-number,99\n"      # bad row, skipped
            "10,90\n",
            encoding="utf-8",
        )
        points = ai.parse_retention_csv(csv, total_duration_sec=30)
        assert len(points) == 2

    def test_handles_percent_in_value(self, tmp_path):
        # YouTube sometimes exports "90%" with the symbol in the cell
        csv = tmp_path / "retention.csv"
        csv.write_text(
            "Time (seconds),Audience retention (%)\n"
            "0,100%\n10,90%\n",
            encoding="utf-8",
        )
        points = ai.parse_retention_csv(csv, total_duration_sec=30)
        assert points[1].retention_pct == 90.0

    def test_empty_csv_raises(self, tmp_path):
        csv = tmp_path / "retention.csv"
        csv.write_text("", encoding="utf-8")
        with pytest.raises(ValueError, match="no rows"):
            ai.parse_retention_csv(csv, total_duration_sec=30)

    def test_clamps_retention_over_100(self, tmp_path):
        # Some Studio exports use relative retention which can exceed
        # 100% (audience grew via shares). We clamp to 100 and warn so
        # the severity bands don't mis-classify.
        csv = tmp_path / "retention.csv"
        csv.write_text(
            "Time (seconds),Audience retention (%)\n"
            "0,110\n10,95\n",
            encoding="utf-8",
        )
        points = ai.parse_retention_csv(csv, total_duration_sec=30)
        # First sample clamped from 110 to 100
        assert points[0].retention_pct == 100.0
        assert points[1].retention_pct == 95.0

    def test_utf16_fallback(self, tmp_path):
        # Studio exports on Windows-locale accounts sometimes ship UTF-16
        csv = tmp_path / "retention.csv"
        content = "Time (seconds),Audience retention (%)\n0,100\n10,90\n"
        csv.write_bytes(content.encode("utf-16"))
        points = ai.parse_retention_csv(csv, total_duration_sec=30)
        assert len(points) == 2
        assert points[0].retention_pct == 100.0


# ── detect_drops ────────────────────────────────────────────────────────────


def _pts(values):
    """Build a list of RetentionPoints from (time, retention) tuples."""
    return [ai.RetentionPoint(time_sec=t, retention_pct=r) for t, r in values]


class TestDetectDrops:
    def test_no_drops_steady_retention(self):
        points = _pts([(0, 100), (10, 99), (20, 98), (30, 97)])
        assert ai.detect_drops(points, threshold_pp=3, window_sec=10) == []

    def test_single_drop_in_window(self):
        # 100 → 95 → 92 across 10s windows. Between 10s and 20s drops 5pp.
        points = _pts([(0, 100), (10, 100), (20, 92), (30, 92)])
        drops = ai.detect_drops(points, threshold_pp=3, window_sec=10)
        assert len(drops) == 1
        assert drops[0].drop_pp == pytest.approx(8.0)

    def test_consecutive_drops_NOT_merged(self):
        # Three 5pp drops in three consecutive 10s windows. Pre-fix the
        # merge logic collapsed these into one giant span. Post-fix:
        # each window is its own drop event so per-beat attribution
        # survives.
        points = _pts([(0, 100), (10, 95), (20, 90), (30, 85)])
        drops = ai.detect_drops(points, threshold_pp=3, window_sec=10)
        assert len(drops) == 3
        for d in drops:
            assert d.drop_pp == pytest.approx(5.0)

    def test_below_threshold_skipped(self):
        points = _pts([(0, 100), (10, 99)])
        # 1pp drop is below default 3pp threshold
        assert ai.detect_drops(points, threshold_pp=3, window_sec=10) == []

    def test_empty_points(self):
        assert ai.detect_drops([]) == []

    def test_single_point(self):
        assert ai.detect_drops(_pts([(0, 100)])) == []


# ── map_drops_to_beats ──────────────────────────────────────────────────────


class TestMapDropsToBeats:
    def test_assigns_beat_by_start_time(self):
        manifest = {
            "beats": [
                {"id": "beat1", "title": "OPEN", "startSec": 0, "endSec": 60},
                {"id": "beat2", "title": "MID", "startSec": 60, "endSec": 120},
            ]
        }
        drops = [
            ai.RetentionDrop(
                start_sec=70, end_sec=80,
                start_retention_pct=90, end_retention_pct=80,
            ),
        ]
        ai.map_drops_to_beats(drops, manifest)
        assert drops[0].beat_number == 2
        assert drops[0].beat_title == "MID"

    def test_outside_any_beat_leaves_none(self):
        manifest = {"beats": [
            {"id": "beat1", "title": "X", "startSec": 0, "endSec": 60},
        ]}
        drops = [
            ai.RetentionDrop(
                start_sec=200, end_sec=210,
                start_retention_pct=90, end_retention_pct=80,
            ),
        ]
        ai.map_drops_to_beats(drops, manifest)
        assert drops[0].beat_number is None


# ── RetentionDrop.severity ─────────────────────────────────────────────────


class TestDropSeverity:
    def test_normal(self):
        d = ai.RetentionDrop(
            start_sec=0, end_sec=10,
            start_retention_pct=100, end_retention_pct=97,
        )
        assert d.severity == "🟢"
        assert d.drop_pp == 3.0

    def test_noticeable(self):
        d = ai.RetentionDrop(
            start_sec=0, end_sec=10,
            start_retention_pct=100, end_retention_pct=93,
        )
        assert d.severity == "🟡"

    def test_material(self):
        d = ai.RetentionDrop(
            start_sec=0, end_sec=10,
            start_retention_pct=100, end_retention_pct=85,
        )
        assert d.severity == "🔴"


# ── ingest_analytics end-to-end ────────────────────────────────────────────


class TestIngestAnalytics:
    def test_e2e(self, tmp_path):
        csv = tmp_path / "retention.csv"
        # Steady beat 1, big drop INSIDE beat 2 (35→55), steady beat 3.
        # Spacing chosen so the drop window starts after beat 2's start
        # (35s) — drop is attributed to beat 2.
        csv.write_text(
            "Time (seconds),Audience retention (%)\n"
            "0,100\n10,99\n20,99\n35,98\n45,85\n55,70\n70,69\n90,69\n",
            encoding="utf-8",
        )
        manifest = tmp_path / "assembly.json"
        manifest.write_text(json.dumps({
            "totalDurationSec": 120,
            "beats": [
                {"id": "beat1", "title": "OPEN", "startSec": 0, "endSec": 30},
                {"id": "beat2", "title": "MID", "startSec": 30, "endSec": 90},
                {"id": "beat3", "title": "END", "startSec": 90, "endSec": 120},
            ],
        }), encoding="utf-8")
        report = ai.ingest_analytics("test", csv, manifest)
        assert report.total_duration_sec == 120
        assert len(report.drops) >= 1
        # The big drop sits in beat 2
        assert any(d.beat_number == 2 for d in report.drops)


# ── render_report_md ───────────────────────────────────────────────────────


class TestRenderReport:
    def test_no_drops_clean_message(self):
        report = ai.RetentionReport(
            slug="x", csv_path="/tmp/x.csv", total_duration_sec=120,
            average_retention_pct=85.0, points=[], drops=[],
        )
        out = ai.render_report_md(report)
        assert "No significant drops" in out

    def test_drops_render_table_and_detail(self):
        report = ai.RetentionReport(
            slug="x", csv_path="/tmp/x.csv", total_duration_sec=120,
            average_retention_pct=70.0, points=[],
            drops=[
                ai.RetentionDrop(
                    start_sec=30, end_sec=60,
                    start_retention_pct=95, end_retention_pct=80,
                    beat_number=2, beat_title="MID",
                ),
            ],
        )
        out = ai.render_report_md(report)
        assert "Drop events" in out
        assert "MID" in out
        assert "🔴" in out


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_missing_csv_exits_2(self):
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "learn" / "analytics_ingest.py"),
             "x", "--csv", "/no/such/file.csv"],
            capture_output=True, text=True,
        )
        assert result.returncode == 2

    def test_synthetic_csv_with_manifest(self, tmp_path):
        csv = tmp_path / "retention.csv"
        csv.write_text(
            "Time (seconds),Audience retention (%)\n"
            "0,100\n30,90\n60,85\n90,80\n",
            encoding="utf-8",
        )
        manifest = tmp_path / "m.json"
        manifest.write_text(json.dumps({
            "totalDurationSec": 120,
            "beats": [
                {"id": "beat1", "title": "OPEN", "startSec": 0, "endSec": 60},
                {"id": "beat2", "title": "END", "startSec": 60, "endSec": 120},
            ],
        }), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "learn" / "analytics_ingest.py"),
             "x", "--csv", str(csv), "--manifest", str(manifest),
             "--json", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert payload["slug"] == "x"
        assert payload["sample_count"] == 4

    def test_strict_exits_1_on_material(self, tmp_path):
        csv = tmp_path / "retention.csv"
        csv.write_text(
            "Time (seconds),Audience retention (%)\n"
            "0,100\n10,80\n20,70\n",  # 30pp drop ≥ material threshold
            encoding="utf-8",
        )
        manifest = tmp_path / "m.json"
        manifest.write_text(json.dumps({
            "totalDurationSec": 30,
            "beats": [{"id": "beat1", "title": "X", "startSec": 0, "endSec": 30}],
        }), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "learn" / "analytics_ingest.py"),
             "x", "--csv", str(csv), "--manifest", str(manifest),
             "--strict", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 1

    def test_bad_csv_exits_2(self, tmp_path):
        csv = tmp_path / "retention.csv"
        csv.write_text("Foo,Bar\n1,2\n", encoding="utf-8")
        manifest = tmp_path / "m.json"
        manifest.write_text(json.dumps({"totalDurationSec": 30, "beats": []}), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "learn" / "analytics_ingest.py"),
             "x", "--csv", str(csv), "--manifest", str(manifest), "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "ingest failed" in result.stderr
