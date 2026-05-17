"""Tests for the new state/status/tracker functions in pipeline_validator.py.

The legacy validation path (parse_pipeline_md → validate_episode → write_checkpoint)
is exercised by manual runs and the check-episode.sh integration; these tests
cover the new May-17 functions that read pipeline-state.json and write the
auto-status dashboard + Health column.
"""

from __future__ import annotations

import datetime
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import pipeline_validator as pv  # noqa: E402


# ── load_pipeline_state ──────────────────────────────────────────────────────

class TestLoadPipelineState:
    def test_loads_and_parses(self, tmp_path, monkeypatch):
        state_path = tmp_path / "episodes" / "pipeline-state.json"
        state_path.parent.mkdir(parents=True)
        state_path.write_text(json.dumps({
            "version": "1.0",
            "episodes": [
                {
                    "slug": "test-ep",
                    "state": "RENDER READY",
                    "stateEnteredAt": "2026-05-01",
                    "format": "Wargamer",
                    "targetPublish": "2026-06-01",
                    "notes": "test notes",
                },
            ],
        }), encoding="utf-8")
        monkeypatch.setattr(pv, "PIPELINE_STATE_JSON", state_path)
        entries = pv.load_pipeline_state()
        assert len(entries) == 1
        e = entries[0]
        assert e.slug == "test-ep"
        assert e.state == "RENDER READY"
        assert e.state_entered_at == datetime.date(2026, 5, 1)
        assert e.format == "Wargamer"
        assert e.target_publish == datetime.date(2026, 6, 1)
        assert e.notes == "test notes"

    def test_handles_null_target(self, tmp_path, monkeypatch):
        state_path = tmp_path / "episodes" / "pipeline-state.json"
        state_path.parent.mkdir(parents=True)
        state_path.write_text(json.dumps({
            "episodes": [{"slug": "x", "state": "INCUBATING",
                          "stateEnteredAt": "2026-01-01",
                          "format": None, "targetPublish": None}],
        }), encoding="utf-8")
        monkeypatch.setattr(pv, "PIPELINE_STATE_JSON", state_path)
        e = pv.load_pipeline_state()[0]
        assert e.target_publish is None
        assert e.format is None
        assert e.days_to_target is None

    def test_returns_empty_when_missing(self, tmp_path, monkeypatch):
        monkeypatch.setattr(pv, "PIPELINE_STATE_JSON", tmp_path / "missing.json")
        assert pv.load_pipeline_state() == []


# ── compute_episode_status ────────────────────────────────────────────────────

class TestComputeEpisodeStatus:
    def _make_repo(self, tmp_path, slug="test-ep", *, with_script=True,
                   with_manifest=True, with_render=False, segment_count=10):
        """Build a minimal repo skeleton for one episode."""
        ep_dir = tmp_path / "episodes" / slug
        ep_dir.mkdir(parents=True)
        if with_script:
            (ep_dir / "script-v1-production.md").write_text("# script", encoding="utf-8")
        data_dir = tmp_path / "remotion-templates" / "data" / "episodes" / slug
        data_dir.mkdir(parents=True)
        if with_manifest:
            (data_dir / "assembly-manifest.json").write_text(json.dumps({
                "segments": [{"id": f"s{i}", "startSec": i, "endSec": i + 1}
                             for i in range(segment_count)],
                "totalDurationSec": float(segment_count),
                "mode": "estimate",
            }), encoding="utf-8")
        out_dir = tmp_path / "remotion-templates" / "out"
        out_dir.mkdir(parents=True)
        if with_render:
            (out_dir / f"{slug}-full.mp4").write_bytes(b"")
        return ep_dir, data_dir

    def test_full_render_ready_snapshot(self, tmp_path, monkeypatch):
        slug = "test-ep"
        self._make_repo(tmp_path, slug=slug, with_manifest=True, with_render=False)
        # Override module-level paths
        monkeypatch.setattr(pv, "ROOT", tmp_path)
        monkeypatch.setattr(pv, "EPISODES_DIR", tmp_path / "episodes")
        monkeypatch.setattr(pv, "REMOTION_DATA", tmp_path / "remotion-templates" / "data" / "episodes")

        entry = pv.StateEntry(
            slug=slug, state="RENDER READY",
            state_entered_at=datetime.date.today() - datetime.timedelta(days=5),
            format="Wargamer",
            target_publish=datetime.date.today() + datetime.timedelta(days=10),
            notes="x",
        )
        status = pv.compute_episode_status(entry)
        assert status.slug == slug
        assert status.state == "RENDER READY"
        assert status.days_in_state == 5
        assert status.days_to_target == 10
        assert status.has_script is True
        assert status.has_manifest is True
        assert status.has_render is False
        assert status.manifest_segments == 10
        assert status.manifest_duration_sec == 10.0
        assert status.stage_idx == pv.STATE_ORDER.index("RENDER READY")

    def test_incubating_episode_no_target(self, tmp_path, monkeypatch):
        slug = "test-ep"
        self._make_repo(tmp_path, slug=slug, with_manifest=False)
        monkeypatch.setattr(pv, "ROOT", tmp_path)
        monkeypatch.setattr(pv, "EPISODES_DIR", tmp_path / "episodes")
        monkeypatch.setattr(pv, "REMOTION_DATA", tmp_path / "remotion-templates" / "data" / "episodes")

        entry = pv.StateEntry(
            slug=slug, state="INCUBATING",
            state_entered_at=datetime.date.today() - datetime.timedelta(days=30),
            format=None, target_publish=None, notes="",
        )
        status = pv.compute_episode_status(entry)
        assert status.days_to_target is None
        assert status.target_publish is None
        assert status.has_manifest is False
        assert status.stage_idx == pv.STATE_ORDER.index("INCUBATING")


# ── _check_manifest_staleness ────────────────────────────────────────────────

class TestManifestStaleness:
    def test_fresh_manifest_not_stale(self, tmp_path, monkeypatch):
        import os
        slug = "test-ep"
        ep_dir = tmp_path / "episodes" / slug
        ep_dir.mkdir(parents=True)
        data_dir = tmp_path / "remotion-templates" / "data" / "episodes" / slug
        data_dir.mkdir(parents=True)
        # Both files have the same mtime (within tolerance)
        now = 1_700_000_000.0
        script = ep_dir / "script-v1-production.md"
        script.write_text("x")
        os.utime(script, (now, now))
        manifest = data_dir / "assembly-manifest.json"
        manifest.write_text("{}")
        os.utime(manifest, (now + 30, now + 30))  # manifest newer
        monkeypatch.setattr(pv, "EPISODES_DIR", tmp_path / "episodes")
        monkeypatch.setattr(pv, "REMOTION_DATA", tmp_path / "remotion-templates" / "data" / "episodes")

        is_stale, drift = pv._check_manifest_staleness(slug)
        assert is_stale is False
        assert drift == ""

    def test_stale_manifest_4_hours(self, tmp_path, monkeypatch):
        import os
        slug = "test-ep"
        ep_dir = tmp_path / "episodes" / slug
        ep_dir.mkdir(parents=True)
        data_dir = tmp_path / "remotion-templates" / "data" / "episodes" / slug
        data_dir.mkdir(parents=True)
        now = 1_700_000_000.0
        manifest = data_dir / "assembly-manifest.json"
        manifest.write_text("{}")
        os.utime(manifest, (now, now))
        script = ep_dir / "script-v1-production.md"
        script.write_text("x")
        os.utime(script, (now + 4 * 3600, now + 4 * 3600))  # 4h newer
        monkeypatch.setattr(pv, "EPISODES_DIR", tmp_path / "episodes")
        monkeypatch.setattr(pv, "REMOTION_DATA", tmp_path / "remotion-templates" / "data" / "episodes")

        is_stale, drift = pv._check_manifest_staleness(slug)
        assert is_stale is True
        assert "h" in drift  # hours format


# ── render_status_md ──────────────────────────────────────────────────────────

class TestRenderStatusMd:
    def _make_status(self, **overrides):
        defaults = dict(
            slug="test-ep", state="RENDER READY",
            days_in_state=5, days_to_target=10,
            target_publish="2026-06-01", format="Wargamer", notes="test notes",
            has_research=True, has_angle_memo=True, has_script=True,
            has_visual_spec=True, has_audio_cue_sheet=True, has_manifest=True,
            has_narration=False, has_render=False, has_thumbnails=False,
            data_files=20, asset_stills=5, asset_clips=3,
            manifest_segments=50, manifest_duration_sec=300.0,
            manifest_mode="estimate", zero_hit_count=0, cost_usd=15.50,
            manifest_stale=False, manifest_stale_drift_str="",
            script_version="v3", script_mtime="2026-05-17T10:00",
            stage_idx=5,
        )
        defaults.update(overrides)
        return pv.EpisodeStatus(**defaults)

    def test_renders_progress_bar(self):
        s = self._make_status()
        s.health_summary = pv._build_health_summary(s)
        out = pv.render_status_md(s)
        assert "## Progress" in out
        assert "▰" in out
        assert "6 of 9 stages" in out

    def test_zero_hits_fire_health(self):
        s = self._make_status(zero_hit_count=4)
        s.health_summary = pv._build_health_summary(s)
        out = pv.render_status_md(s)
        assert "🟡 4 zero-hit shots" in out
        assert "zerohit_fallback.py test-ep" in out

    def test_stale_manifest_fires_health(self):
        s = self._make_status(manifest_stale=True, manifest_stale_drift_str="2.5 d")
        s.health_summary = pv._build_health_summary(s)
        out = pv.render_status_md(s)
        assert "M-MANIFEST-STALE" in out
        assert "2.5 d" in out
        assert "generate_manifest.py test-ep" in out

    def test_clean_status_no_health_issues(self):
        # A truly clean status requires render + narration + manifest in precise
        # mode (estimate-mode + narration legitimately fires a "regenerate in
        # precise" health warning).
        s = self._make_status(has_render=True, has_narration=True, manifest_mode="precise")
        s.health_summary = pv._build_health_summary(s)
        out = pv.render_status_md(s)
        assert "🟢 No health issues detected" in out

    def test_includes_notes(self):
        s = self._make_status(notes="A unique note string.")
        s.health_summary = pv._build_health_summary(s)
        out = pv.render_status_md(s)
        assert "A unique note string." in out

    def test_by_the_numbers_panel(self):
        s = self._make_status()
        s.health_summary = pv._build_health_summary(s)
        out = pv.render_status_md(s)
        assert "## By the numbers" in out
        assert "$15.50" in out
        assert "Segments" in out
        assert "50" in out


# ── _build_health_summary ─────────────────────────────────────────────────────

class TestHealthSummary:
    def _status(self, **kwargs):
        # Minimal status with defaults
        defaults = dict(
            slug="x", state="RENDER READY",
            days_in_state=0, days_to_target=None,
            target_publish=None, format=None, notes="",
            has_research=False, has_angle_memo=False, has_script=False,
            has_visual_spec=False, has_audio_cue_sheet=False, has_manifest=False,
            has_narration=False, has_render=False, has_thumbnails=False,
            data_files=0, asset_stills=0, asset_clips=0,
            manifest_segments=0, manifest_duration_sec=0,
            manifest_mode="missing", zero_hit_count=0, cost_usd=0,
            manifest_stale=False, manifest_stale_drift_str="",
            script_version=None, script_mtime=None,
            stage_idx=5,
        )
        defaults.update(kwargs)
        return pv.EpisodeStatus(**defaults)

    def test_clean_returns_check(self):
        assert pv._build_health_summary(self._status()) == "✓ clean"

    def test_incubating_returns_pause(self):
        s = self._status(state="INCUBATING")
        assert "⏸" in pv._build_health_summary(s)

    def test_stale_manifest_appears(self):
        s = self._status(manifest_stale=True, manifest_stale_drift_str="3 d")
        assert "stale manifest (3 d)" in pv._build_health_summary(s)

    def test_zero_hits_appear(self):
        s = self._status(zero_hit_count=5)
        assert "🔴 5 zero-hit shots" in pv._build_health_summary(s)

    def test_never_rendered_appears(self):
        s = self._status(has_manifest=True, has_render=False)
        assert "never rendered" in pv._build_health_summary(s)


# ── update_tracker_health ─────────────────────────────────────────────────────

class TestUpdateTrackerHealth:
    def _make_tracker(self, tmp_path, monkeypatch):
        pipeline = tmp_path / "episodes" / "PIPELINE.md"
        pipeline.parent.mkdir(parents=True)
        pipeline.write_text("""# Episode Pipeline State

intro prose

## At a glance

| Episode | State | Day | Target | Health |
|---|---|---|---|---|
| `old-row` | OLD STATE | 99 | — | stale data |

_footer note_
""", encoding="utf-8")
        monkeypatch.setattr(pv, "PIPELINE_MD", pipeline)
        return pipeline

    def test_table_rewritten_in_place(self, tmp_path, monkeypatch):
        pipeline = self._make_tracker(tmp_path, monkeypatch)
        s = pv.EpisodeStatus(
            slug="test-ep", state="RENDER READY",
            days_in_state=5, days_to_target=10,
            target_publish="2026-06-01", format="x", notes="",
            has_research=True, has_angle_memo=True, has_script=True,
            has_visual_spec=True, has_audio_cue_sheet=True, has_manifest=True,
            has_narration=True, has_render=True, has_thumbnails=True,
            data_files=20, asset_stills=5, asset_clips=3,
            manifest_segments=50, manifest_duration_sec=300.0,
            manifest_mode="estimate", zero_hit_count=0, cost_usd=15.50,
            manifest_stale=False, manifest_stale_drift_str="",
            script_version="v3", script_mtime="2026-05-17",
            stage_idx=5,
        )
        s.health_summary = pv._build_health_summary(s)
        changed = pv.update_tracker_health([s])
        assert changed is True
        new_text = pipeline.read_text(encoding="utf-8")
        assert "test-ep" in new_text
        assert "🎬 RENDER READY" in new_text
        assert "old-row" not in new_text   # old row was overwritten
        assert "_footer note_" in new_text  # prose outside the table preserved
