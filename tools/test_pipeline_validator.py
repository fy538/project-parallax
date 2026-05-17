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

    def test_blocked_on_field_loaded(self, tmp_path, monkeypatch):
        state_path = tmp_path / "episodes" / "pipeline-state.json"
        state_path.parent.mkdir(parents=True)
        state_path.write_text(json.dumps({
            "episodes": [{
                "slug": "x", "state": "BLOCKED",
                "stateEnteredAt": "2026-05-01",
                "format": None, "targetPublish": None,
                "blockedOn": "Awaiting client approval",
            }],
        }), encoding="utf-8")
        monkeypatch.setattr(pv, "PIPELINE_STATE_JSON", state_path)
        e = pv.load_pipeline_state()[0]
        assert e.blocked_on == "Awaiting client approval"

    def test_blocked_on_defaults_to_dash(self, tmp_path, monkeypatch):
        """Missing/null blockedOn → '—' (matches legacy EpisodeRow contract)."""
        state_path = tmp_path / "episodes" / "pipeline-state.json"
        state_path.parent.mkdir(parents=True)
        state_path.write_text(json.dumps({
            "episodes": [{
                "slug": "x", "state": "DRAFTING",
                "stateEnteredAt": "2026-05-01",
                "format": None, "targetPublish": None,
            }],
        }), encoding="utf-8")
        monkeypatch.setattr(pv, "PIPELINE_STATE_JSON", state_path)
        e = pv.load_pipeline_state()[0]
        assert e.blocked_on == "—"


# ── parse_pipeline_md (legacy shim over load_pipeline_state) ─────────────────

class TestParsePipelineMdShim:
    """After the May-17 refactor, parse_pipeline_md is a thin shim over
    load_pipeline_state. These tests lock the back-compat contract: it
    returns the same EpisodeRow shape callers always saw, just sourced
    from pipeline-state.json instead of regex-parsing PIPELINE.md."""

    def _setup(self, tmp_path, monkeypatch, episodes):
        state_path = tmp_path / "episodes" / "pipeline-state.json"
        state_path.parent.mkdir(parents=True)
        state_path.write_text(json.dumps({"episodes": episodes}), encoding="utf-8")
        monkeypatch.setattr(pv, "PIPELINE_STATE_JSON", state_path)

    def test_returns_episode_rows(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch, [
            {"slug": "test-ep", "state": "RENDER READY",
             "stateEnteredAt": "2026-05-01",
             "format": "Wargamer", "targetPublish": "2026-06-01"},
        ])
        rows = pv.parse_pipeline_md()
        assert len(rows) == 1
        assert rows[0].slug == "test-ep"
        assert rows[0].state == "RENDER READY"
        assert isinstance(rows[0].days_in_state, int)
        assert rows[0].blocked_on == "—"

    def test_carries_blocked_on(self, tmp_path, monkeypatch):
        self._setup(tmp_path, monkeypatch, [
            {"slug": "x", "state": "BLOCKED",
             "stateEnteredAt": "2026-05-01",
             "format": None, "targetPublish": None,
             "blockedOn": "Mapbox token expired"},
        ])
        rows = pv.parse_pipeline_md()
        assert rows[0].blocked_on == "Mapbox token expired"


# ── --check-only CLI flag ────────────────────────────────────────────────────

class TestCheckOnlyFlag:
    """--check-only computes statuses but writes nothing. Exits 1 if any
    episode has health warnings (manifest-stale, zero-hits, never-rendered)."""

    def _setup(self, tmp_path, monkeypatch, episodes):
        state_path = tmp_path / "episodes" / "pipeline-state.json"
        state_path.parent.mkdir(parents=True)
        state_path.write_text(json.dumps({"episodes": episodes}), encoding="utf-8")
        monkeypatch.setattr(pv, "ROOT", tmp_path)
        monkeypatch.setattr(pv, "EPISODES_DIR", tmp_path / "episodes")
        monkeypatch.setattr(pv, "REMOTION_DATA", tmp_path / "remotion-templates" / "data" / "episodes")
        monkeypatch.setattr(pv, "PIPELINE_STATE_JSON", state_path)

    def test_clean_state_returns_0(self, tmp_path, monkeypatch, capsys):
        self._setup(tmp_path, monkeypatch, [
            {"slug": "x", "state": "INCUBATING",
             "stateEnteredAt": "2026-05-01",
             "format": None, "targetPublish": None},
        ])
        # incubating with no manifest → health_summary = "⏸ awaiting promotion"
        # which is considered passing (not a warning)
        monkeypatch.setattr(sys, "argv", ["pipeline_validator.py", "--check-only"])
        rc = pv.main()
        assert rc == 0
        out = capsys.readouterr().out
        assert "awaiting promotion" in out

    def test_warnings_return_1(self, tmp_path, monkeypatch, capsys):
        """Set up an episode with a manifest but no render → never-rendered
        warning → exit 1."""
        self._setup(tmp_path, monkeypatch, [
            {"slug": "x", "state": "RENDER READY",
             "stateEnteredAt": "2026-05-01",
             "format": None, "targetPublish": None},
        ])
        # Create a manifest so has_manifest=True; no out/x-full.mp4 so
        # has_render=False → "never rendered" warning
        data_dir = tmp_path / "remotion-templates" / "data" / "episodes" / "x"
        data_dir.mkdir(parents=True)
        (data_dir / "assembly-manifest.json").write_text(json.dumps({
            "segments": [], "totalDurationSec": 0, "mode": "estimate",
        }), encoding="utf-8")
        monkeypatch.setattr(sys, "argv", ["pipeline_validator.py", "--check-only"])
        rc = pv.main()
        assert rc == 1
        out = capsys.readouterr().out
        assert "never rendered" in out

    def test_writes_nothing(self, tmp_path, monkeypatch):
        """--check-only must not create _status.md or modify any file."""
        self._setup(tmp_path, monkeypatch, [
            {"slug": "x", "state": "INCUBATING",
             "stateEnteredAt": "2026-05-01",
             "format": None, "targetPublish": None},
        ])
        ep_dir = tmp_path / "episodes" / "x"
        ep_dir.mkdir(parents=True)
        monkeypatch.setattr(sys, "argv", ["pipeline_validator.py", "--check-only"])
        pv.main()
        assert not (ep_dir / "_status.md").exists()


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


# ── Shared status fixture ────────────────────────────────────────────────────
# After the May-17 refactor, EpisodeStatus stores raw dates/datetimes (not
# pre-formatted strings) and exposes health_summary as a @property (no
# longer mutated post-construction). Tests use the canonical _make_status
# helper to stay in sync with the dataclass shape.

def _make_status(**overrides):
    defaults = dict(
        slug="test-ep", state="RENDER READY",
        days_in_state=5, days_to_target=10,
        target_publish=datetime.date(2026, 6, 1),
        format="Wargamer", notes="test notes",
        has_research=True, has_angle_memo=True, has_script=True,
        has_visual_spec=True, has_audio_cue_sheet=True, has_manifest=True,
        has_narration=False, has_render=False, has_thumbnails=False,
        data_files=20, asset_stills=5, asset_clips=3,
        manifest_segments=50, manifest_duration_sec=300.0,
        manifest_mode="estimate", zero_hit_count=0, cost_usd=15.50,
        manifest_stale=False, manifest_stale_drift_str="",
        script_version="v3",
        script_mtime=datetime.datetime(2026, 5, 17, 10, 0),
        stage_idx=5,
    )
    defaults.update(overrides)
    return pv.EpisodeStatus(**defaults)


# ── render_status_md ──────────────────────────────────────────────────────────

class TestRenderStatusMd:
    def test_renders_progress_bar(self):
        out = pv.render_status_md(_make_status())
        assert "## Progress" in out
        assert "▰" in out
        assert "6 of 9 stages" in out

    def test_zero_hits_fire_health(self):
        out = pv.render_status_md(_make_status(zero_hit_count=4))
        assert "🟡 4 zero-hit shots" in out
        assert "zerohit_fallback.py test-ep" in out

    def test_stale_manifest_fires_health(self):
        out = pv.render_status_md(_make_status(manifest_stale=True,
                                                manifest_stale_drift_str="2.5 d"))
        assert "M-MANIFEST-STALE" in out
        assert "2.5 d" in out
        assert "generate_manifest.py test-ep" in out

    def test_clean_status_no_health_issues(self):
        # render + narration + precise-mode manifest = truly clean
        out = pv.render_status_md(_make_status(has_render=True, has_narration=True,
                                                manifest_mode="precise"))
        assert "🟢 No health issues detected" in out

    def test_includes_notes(self):
        out = pv.render_status_md(_make_status(notes="A unique note string."))
        assert "A unique note string." in out

    def test_by_the_numbers_panel(self):
        out = pv.render_status_md(_make_status())
        assert "## By the numbers" in out
        assert "$15.50" in out
        assert "Segments" in out
        assert "50" in out

    def test_script_mtime_displayed_in_checklist(self):
        out = pv.render_status_md(_make_status(
            script_mtime=datetime.datetime(2026, 5, 17, 14, 30)))
        # script_mtime_iso property formats to "minute" precision
        assert "2026-05-17T14:30" in out

    def test_off_lifecycle_state_shown(self):
        out = pv.render_status_md(_make_status(state="BLOCKED", stage_idx=-1))
        assert "off-lifecycle" in out


# ── health_summary (now a @property on EpisodeStatus) ────────────────────────

class TestHealthSummary:
    """health_summary is computed on access, not stored. Tests call s.health_summary
    directly instead of the (removed) _build_health_summary function."""

    def _empty(self, **kwargs):
        # Minimal off-default status: nothing present, RENDER READY default
        defaults = dict(
            has_research=False, has_angle_memo=False, has_script=False,
            has_visual_spec=False, has_audio_cue_sheet=False, has_manifest=False,
            has_narration=False, has_render=False, has_thumbnails=False,
            data_files=0, asset_stills=0, asset_clips=0,
            manifest_segments=0, manifest_duration_sec=0,
            manifest_mode="missing", zero_hit_count=0, cost_usd=0,
            target_publish=None,
        )
        defaults.update(kwargs)
        return _make_status(**defaults)

    def test_clean_returns_check(self):
        assert self._empty().health_summary == "✓ clean"

    def test_incubating_returns_pause(self):
        assert "⏸" in self._empty(state="INCUBATING").health_summary

    def test_retroed_returns_shipped(self):
        assert "shipped" in self._empty(state="RETROED").health_summary

    def test_stale_manifest_appears(self):
        s = self._empty(manifest_stale=True, manifest_stale_drift_str="3 d")
        assert "stale manifest (3 d)" in s.health_summary

    def test_zero_hits_appear(self):
        s = self._empty(zero_hit_count=5)
        assert "🔴 5 zero-hit shots" in s.health_summary

    def test_single_zero_hit_no_plural(self):
        s = self._empty(zero_hit_count=1)
        assert "1 zero-hit shot" in s.health_summary
        assert "1 zero-hit shots" not in s.health_summary

    def test_never_rendered_appears(self):
        s = self._empty(has_manifest=True, has_render=False)
        assert "never rendered" in s.health_summary

    def test_no_narration_when_rendered(self):
        s = self._empty(has_manifest=True, has_render=True, has_narration=False)
        assert "no narration" in s.health_summary


# ── _read_cost_log ───────────────────────────────────────────────────────────

class TestReadCostLog:
    """Parses episodes/COST_LOG.md per-episode totals from markdown table rows."""

    def _write(self, tmp_path, content):
        p = tmp_path / "COST_LOG.md"
        p.write_text(content, encoding="utf-8")
        return p

    def test_sums_per_episode(self, tmp_path):
        p = self._write(tmp_path, """# Cost Log

| date | episode | service | amount_usd | note |
|---|---|---|---|---|
| 2026-05-10 | silicon-trap | claude | 4.50 | research |
| 2026-05-11 | silicon-trap | recraft | 2.00 | illustration |
| 2026-05-12 | prisoners-dilemma | claude | 6.00 | research |
""")
        totals = pv._read_cost_log(p)
        assert totals["silicon-trap"] == 6.50
        assert totals["prisoners-dilemma"] == 6.00

    def test_skips_synthetic_system_rows(self, tmp_path):
        p = self._write(tmp_path, """| date | episode | service | amount_usd | note |
|---|---|---|---|---|
| 2026-05-05 | (system) | other | 0.00 | cost log initialized |
| 2026-05-10 | silicon-trap | claude | 4.50 | research |
""")
        totals = pv._read_cost_log(p)
        assert "(system)" not in totals
        assert totals["silicon-trap"] == 4.50

    def test_handles_integer_amounts(self, tmp_path):
        """`5` is valid; doesn't require decimal point."""
        p = self._write(tmp_path, """| date | episode | service | amount_usd | note |
| 2026-05-10 | silicon-trap | claude | 5 | round number |
""")
        totals = pv._read_cost_log(p)
        assert totals["silicon-trap"] == 5.0

    def test_handles_refunds_negative_amounts(self, tmp_path):
        p = self._write(tmp_path, """| 2026-05-10 | silicon-trap | recraft | 10.00 | bulk |
| 2026-05-11 | silicon-trap | recraft | -2.50 | refund |
""")
        totals = pv._read_cost_log(p)
        assert totals["silicon-trap"] == 7.50

    def test_ignores_header_and_separator_rows(self, tmp_path):
        """Header (`| date | ...|`) and separator (`|---|`) rows don't match
        the date pattern, so they're silently skipped."""
        p = self._write(tmp_path, """| date | episode | service | amount_usd | note |
|---|---|---|---|---|
| 2026-05-10 | silicon-trap | claude | 4.50 | research |
""")
        totals = pv._read_cost_log(p)
        assert totals == {"silicon-trap": 4.50}

    def test_missing_file_returns_empty(self, tmp_path):
        assert pv._read_cost_log(tmp_path / "nope.md") == {}

    def test_tolerates_whitespace_variations(self, tmp_path):
        p = self._write(tmp_path, """|2026-05-10|silicon-trap|claude|4.50|tight|
|  2026-05-11  |  silicon-trap  |  recraft  |  2.00  |  loose  |
""")
        totals = pv._read_cost_log(p)
        assert totals["silicon-trap"] == 6.50

    def test_skips_unparseable_amount(self, tmp_path):
        """Row with non-numeric amount is silently skipped (defensive)."""
        p = self._write(tmp_path, """| 2026-05-10 | silicon-trap | claude | TBD | placeholder |
| 2026-05-11 | silicon-trap | claude | 3.00 | real |
""")
        totals = pv._read_cost_log(p)
        # First row's amount "TBD" fails the regex; second row succeeds.
        assert totals["silicon-trap"] == 3.00


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
        s = _make_status()  # uses canonical fixture (raw date + datetime)
        changed = pv.update_tracker_health([s])
        assert changed is True
        new_text = pipeline.read_text(encoding="utf-8")
        assert "test-ep" in new_text
        assert "🎬 RENDER READY" in new_text
        assert "old-row" not in new_text   # old row was overwritten
        assert "_footer note_" in new_text  # prose outside the table preserved

    def test_blank_line_default_no_change_second_run(self, tmp_path, monkeypatch):
        """The original failure mode: first run loses the blank line, every
        subsequent run reports 'no change' even though it shouldn't keep
        re-eating whitespace. Verify the second run is genuinely a no-op."""
        pipeline = self._make_tracker(tmp_path, monkeypatch)
        s = _make_status()
        first = pv.update_tracker_health([s])
        second = pv.update_tracker_health([s])
        assert first is True
        assert second is False  # second run is a no-op

    def test_preserves_blank_line_after_table(self, tmp_path, monkeypatch):
        """Regression test: the blank line between the table and the next
        section must survive every rewrite. Previously the row-terminator
        regex used `\\s*\\n` which greedily consumed the blank line as
        whitespace, eating it on every run."""
        pipeline = tmp_path / "episodes" / "PIPELINE.md"
        pipeline.parent.mkdir(parents=True)
        pipeline.write_text("""## At a glance

| Episode | State | Day | Target | Health |
|---|---|---|---|---|
| `old-row` | OLD | 0 | — | x |

_footer_
""", encoding="utf-8")
        monkeypatch.setattr(pv, "PIPELINE_MD", pipeline)
        s = _make_status()
        pv.update_tracker_health([s])
        # Re-run to verify the blank line survives multiple invocations
        pv.update_tracker_health([s])
        text = pipeline.read_text(encoding="utf-8")
        # Expect: "...| `test-ep` | ... |\n\n_footer_"
        assert "`test-ep`" in text
        assert "|\n\n_footer_" in text, f"blank line eaten: {repr(text[-80:])}"
