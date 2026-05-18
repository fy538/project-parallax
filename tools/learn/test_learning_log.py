"""
Unit tests for tools/learn/learning_log.py.

Covers:
  · _avg_in_window
  · derive_retention_profile (climbing / flat / descending / volatile)
  · derive_findings (top-3 from material drops + fallback)
  · derive_visual_winners
  · _entry_exists / insert_entry (first-entry / subsequent / placeholder)
  · _strip_entry (overwrite path)
  · render_entry_md
  · build_payload from synthetic retention JSON
  · CLI smoke (missing inputs / dry-run / overwrite collision)
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
import learning_log as ll  # type: ignore[import-not-found]


# ── _avg_in_window ──────────────────────────────────────────────────────────


class TestAvgInWindow:
    def test_basic(self):
        points = [
            {"time_sec": 0, "retention_pct": 100},
            {"time_sec": 10, "retention_pct": 80},
            {"time_sec": 20, "retention_pct": 60},
        ]
        assert ll._avg_in_window(points, 0, 15) == 90.0   # 100+80 / 2
        assert ll._avg_in_window(points, 15, 25) == 60.0  # only 20

    def test_empty_window_returns_zero(self):
        assert ll._avg_in_window([], 0, 10) == 0.0
        assert ll._avg_in_window(
            [{"time_sec": 5, "retention_pct": 100}], 10, 20,
        ) == 0.0


# ── derive_retention_profile ────────────────────────────────────────────────


def _curve(values):
    """Build a list of points from (time_sec, retention_pct) tuples."""
    return [{"time_sec": t, "retention_pct": r} for t, r in values]


class TestDeriveRetentionProfile:
    def test_flat_curve(self):
        # All values around 85% — flat. With the new bands (Hook 0-30s,
        # Engagement 30s-3min, Body 3min-end) we need samples that
        # populate all three bands. Use a 5-min video.
        points = _curve([
            (0, 85), (15, 86),                          # Hook band (0-30s)
            (30, 84), (60, 85), (120, 86), (170, 85),   # Engagement band
            (180, 84), (250, 85), (290, 86),            # Body band
        ])
        rp = ll.derive_retention_profile(points, total_duration_sec=300)
        assert rp.trajectory == "flat"

    def test_descending_curve(self):
        # Spans the new Hook (0-30s) / Engagement (30s-3min) / Body bands
        points = _curve([
            (0, 100), (15, 95),                       # Hook ~97
            (60, 80), (120, 70),                      # Engagement ~75
            (200, 55), (280, 45),                     # Body ~50
        ])
        rp = ll.derive_retention_profile(points, total_duration_sec=300)
        assert rp.trajectory == "descending"
        assert rp.hook_third_avg > rp.closing_third_avg

    def test_volatile_curve_saggy_middle(self):
        # Strong hook, sag in engagement band, recovery in body band.
        # Spans the new 30s / 180s cutoffs.
        points = _curve([
            (0, 90), (15, 88),                           # Hook ~89
            (40, 70), (90, 65), (150, 60),               # Engagement ~65
            (200, 88), (250, 87), (290, 85),             # Body ~87
        ])
        rp = ll.derive_retention_profile(points, total_duration_sec=300)
        assert rp.trajectory == "volatile"

    def test_empty_returns_unknown(self):
        rp = ll.derive_retention_profile([], total_duration_sec=30)
        assert rp.trajectory == "unknown"

    def test_zero_duration_returns_unknown(self):
        rp = ll.derive_retention_profile(
            _curve([(0, 100)]), total_duration_sec=0,
        )
        assert rp.trajectory == "unknown"


# ── derive_findings ─────────────────────────────────────────────────────────


def _drop(start, end, start_pct, end_pct, beat_num=None, beat_title=""):
    return {
        "start_sec": start, "end_sec": end,
        "start_retention_pct": start_pct, "end_retention_pct": end_pct,
        "beat_number": beat_num, "beat_title": beat_title,
    }


class TestDeriveFindings:
    def test_top_3_material(self):
        drops = [
            _drop(10, 20, 100, 70, 1, "OPEN"),   # 30pp
            _drop(40, 50, 60, 50, 2, "MID"),    # 10pp
            _drop(70, 80, 50, 35, 3, "END"),    # 15pp
            _drop(90, 100, 35, 22, 3, "END"),   # 13pp
        ]
        findings = ll.derive_findings(drops)
        # Capped at MAX_FINDINGS = 3
        assert len(findings) == 3
        # Sorted by magnitude (30pp first)
        assert "30" in findings[0].summary or "30.0" in findings[0].summary

    def test_no_material_falls_back_to_minor(self):
        drops = [_drop(10, 20, 100, 95)]  # 5pp not material
        findings = ll.derive_findings(drops)
        # Falls back to top-3 of all drops
        assert len(findings) == 1

    def test_empty_drops_empty_findings(self):
        assert ll.derive_findings([]) == []


# ── derive_visual_winners ──────────────────────────────────────────────────


class TestDeriveVisualWinners:
    def test_returns_top_3_drops(self):
        drops = [
            _drop(10, 20, 100, 70, 1, "OPEN"),
            _drop(40, 50, 60, 30, 2, "MID"),
            _drop(70, 80, 50, 49, 3, "END"),
        ]
        notes = ll.derive_visual_winners(drops)
        assert len(notes) == 3
        assert all(n.direction == "-" for n in notes)
        # Sorted by magnitude — biggest first
        assert notes[0].pp_delta >= notes[1].pp_delta


# ── _entry_exists / insert_entry / _strip_entry ────────────────────────────


class TestLogManipulation:
    EMPTY_LOG = textwrap.dedent("""\
        # Parallax — Learning Log

        ---

        *No episodes published yet. This log will be populated after EP01 goes live and publish-retro runs.*

        <!--
        Template for each episode entry (publish-retro generates this):
        ## [episode-slug]: ...
        -->
        """)

    LOG_WITH_ONE_ENTRY = textwrap.dedent("""\
        # Parallax — Learning Log

        ---

        ## prisoners-dilemma: Title here
        **Publish Date:** 2026-06-01

        ### Top 3 Findings
        1. x
        2. y
        3. z

        ---

        <!--
        Template for each episode entry (publish-retro generates this):
        ## [episode-slug]: ...
        -->
        """)

    def test_entry_exists_detects(self):
        assert ll._entry_exists(self.LOG_WITH_ONE_ENTRY, "prisoners-dilemma")
        assert not ll._entry_exists(self.LOG_WITH_ONE_ENTRY, "silicon-trap")

    def test_insert_into_empty_log_replaces_placeholder(self):
        entry = "\n## test-ep: Test\nSome content\n"
        result = ll.insert_entry(self.EMPTY_LOG, entry)
        # Placeholder line replaced; new entry present
        assert "No episodes published yet" not in result
        assert "test-ep" in result

    def test_insert_into_populated_log_appends_before_template(self):
        entry = "\n## new-ep: New Episode\nfindings here\n"
        result = ll.insert_entry(self.LOG_WITH_ONE_ENTRY, entry)
        # Both entries present; new one is BEFORE the template comment
        assert "prisoners-dilemma" in result
        assert "new-ep" in result
        new_idx = result.find("new-ep")
        tpl_idx = result.find("Template for each episode")
        assert new_idx < tpl_idx

    def test_strip_entry_removes_block(self):
        stripped = ll._strip_entry(self.LOG_WITH_ONE_ENTRY, "prisoners-dilemma")
        assert "prisoners-dilemma" not in stripped
        # Template still present
        assert "Template for each episode" in stripped

    def test_strip_entry_no_match_returns_unchanged(self):
        assert ll._strip_entry(self.LOG_WITH_ONE_ENTRY, "nonexistent") == \
            self.LOG_WITH_ONE_ENTRY


# ── render_entry_md ────────────────────────────────────────────────────────


class TestRenderEntry:
    def _make_payload(self, findings=None, winners=None):
        return ll.LogEntryPayload(
            slug="test", episode_title="Test Episode",
            publish_date="2026-06-01", analysis_date="2026-06-08",
            days_live=7,
            retention_profile=ll.RetentionProfile(
                hook_third_avg=85, mid_third_avg=70, closing_third_avg=60,
                trajectory="descending",
            ),
            findings=findings or [],
            visual_winners=winners or [],
            raw_retention_path="/tmp/retention.json",
        )

    def test_includes_all_sections(self):
        out = ll.render_entry_md(self._make_payload())
        for header in (
            "## test: Test Episode",
            "### Top 3 Findings",
            "### Persona Prediction Accuracy",
            "### Visual Effectiveness Winners",
            "### Retention Profile",
            "### Prediction Feedback",
            "### Next Episode Hypothesis",
        ):
            assert header in out, f"missing section: {header}"

    def test_findings_render(self):
        findings = [
            ll.FindingPoint(summary="X dropped", detail="more context"),
        ]
        out = ll.render_entry_md(self._make_payload(findings=findings))
        assert "X dropped" in out
        assert "more context" in out

    def test_findings_placeholder_when_empty(self):
        out = ll.render_entry_md(self._make_payload(findings=[]))
        assert "No material drops" in out

    def test_retention_profile_numbers_render(self):
        out = ll.render_entry_md(self._make_payload())
        assert "85%" in out
        assert "descending" in out


# ── build_payload ──────────────────────────────────────────────────────────


class TestBuildPayload:
    def test_builds_from_retention_json(self, tmp_path):
        ret = tmp_path / "retention.json"
        ret.write_text(json.dumps({
            "slug": "x", "total_duration_sec": 30,
            "average_retention_pct": 75,
            "drops": [
                _drop(5, 15, 100, 80, 1, "OPEN"),
            ],
            "points": [
                {"time_sec": 0, "retention_pct": 95},
                {"time_sec": 10, "retention_pct": 90},
                {"time_sec": 15, "retention_pct": 80},
                {"time_sec": 25, "retention_pct": 65},
            ],
        }), encoding="utf-8")
        payload = ll.build_payload(
            "x", ret, publish_date="2026-06-01",
            analysis_date="2026-06-08", episode_title="Test",
        )
        assert payload.days_live == 7
        assert payload.episode_title == "Test"
        assert payload.retention_profile.hook_third_avg > 0
        assert len(payload.findings) >= 1

    def test_handles_retention_without_points(self, tmp_path):
        # When points aren't included (aggregate-only retention JSON),
        # retention_profile falls back to the average across all thirds.
        ret = tmp_path / "retention.json"
        ret.write_text(json.dumps({
            "slug": "x", "total_duration_sec": 30,
            "average_retention_pct": 65,
            "drops": [],
        }), encoding="utf-8")
        payload = ll.build_payload(
            "x", ret, publish_date="2026-06-01",
            analysis_date="2026-06-08", episode_title="Test",
        )
        assert payload.retention_profile.hook_third_avg == 65
        assert payload.retention_profile.trajectory == "unknown"


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_missing_retention_exits_2(self):
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "learn" / "learning_log.py"),
             "x", "--retention", "/no/such.json", "--published-at", "2026-06-01"],
            capture_output=True, text=True,
        )
        assert result.returncode == 2

    def test_dry_run_emits_entry_no_write(self, tmp_path):
        ret = tmp_path / "retention.json"
        ret.write_text(json.dumps({
            "slug": "x", "total_duration_sec": 30,
            "average_retention_pct": 75, "drops": [], "points": [],
        }), encoding="utf-8")
        log = tmp_path / "LEARNING_LOG.md"
        log.write_text("# Log\n\n*No episodes published yet.*\n", encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "learn" / "learning_log.py"),
             "x", "--retention", str(ret), "--published-at", "2026-06-01",
             "--log", str(log), "--dry-run"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert "## x:" in result.stdout
        # Log unchanged
        assert "No episodes published" in log.read_text()

    def test_writes_into_log(self, tmp_path):
        ret = tmp_path / "retention.json"
        ret.write_text(json.dumps({
            "slug": "x", "total_duration_sec": 30,
            "average_retention_pct": 75, "drops": [], "points": [],
        }), encoding="utf-8")
        log = tmp_path / "LEARNING_LOG.md"
        log.write_text(
            "# Log\n\n*No episodes published yet.*\n\n<!--\nTemplate for each episode entry\n-->\n",
            encoding="utf-8",
        )
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "learn" / "learning_log.py"),
             "x", "--retention", str(ret), "--published-at", "2026-06-01",
             "--log", str(log), "--episode-title", "Test Episode"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        log_after = log.read_text()
        assert "## x: Test Episode" in log_after
        # Placeholder removed
        assert "No episodes published" not in log_after

    def test_existing_entry_blocks_without_overwrite(self, tmp_path):
        ret = tmp_path / "retention.json"
        ret.write_text(json.dumps({
            "slug": "x", "total_duration_sec": 30,
            "average_retention_pct": 75, "drops": [], "points": [],
        }), encoding="utf-8")
        log = tmp_path / "LEARNING_LOG.md"
        log.write_text(
            "# Log\n\n## x: Existing\nold content\n\n<!--\nTemplate for each\n-->\n",
            encoding="utf-8",
        )
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "learn" / "learning_log.py"),
             "x", "--retention", str(ret), "--published-at", "2026-06-01",
             "--log", str(log)],
            capture_output=True, text=True,
        )
        assert result.returncode == 1
        assert "already exists" in result.stderr

    def test_overwrite_replaces_existing(self, tmp_path):
        ret = tmp_path / "retention.json"
        ret.write_text(json.dumps({
            "slug": "x", "total_duration_sec": 30,
            "average_retention_pct": 75, "drops": [], "points": [],
        }), encoding="utf-8")
        log = tmp_path / "LEARNING_LOG.md"
        log.write_text(
            "# Log\n\n## x: Existing\nold content here\n\n<!--\nTemplate\n-->\n",
            encoding="utf-8",
        )
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "learn" / "learning_log.py"),
             "x", "--retention", str(ret), "--published-at", "2026-06-01",
             "--log", str(log), "--overwrite", "--episode-title", "Fresh"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        log_after = log.read_text()
        assert "## x: Fresh" in log_after
        assert "old content" not in log_after
