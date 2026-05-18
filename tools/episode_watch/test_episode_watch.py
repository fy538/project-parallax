"""
Unit tests for tools/episode_watch/episode_watch.py.

Covers:
  · build_pegasus_prompt (doctrine sections, beat structure embedded)
  · parse_pegasus_response (raw JSON / code-fenced / pre-pended text /
    malformed / tolerant field types)
  · map_findings_to_segments
  · upload_video (mocked happy path / mocked timeout / failed status)
  · query_pegasus (mocked happy path / malformed response)
  · run_episode_watch (dry-run / full pipeline mocked)
  · render_report_md (no findings / with findings / verdict + rationale)
  · CLI smoke (missing inputs / --dry-run / synthetic)
"""

from __future__ import annotations

import json
import subprocess
import sys
import time
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import episode_watch as ew  # type: ignore[import-not-found]


# ── build_pegasus_prompt ───────────────────────────────────────────────────


class TestBuildPrompt:
    def test_includes_doctrine_sections(self):
        out = ew.build_pegasus_prompt("test", "Test Ep", [])
        for keyword in (
            "BOUNDED ANALOGY",
            "VISUAL REGISTER",
            "PACING",
            "AUDIO-VISUAL ALIGNMENT",
            "CLOSING ENERGY",
            "ready_to_publish",
        ):
            assert keyword in out, f"missing: {keyword}"

    def test_embeds_beats(self):
        beats = [
            {"id": "beat1", "title": "OPEN", "startSec": 0, "endSec": 60},
            {"id": "beat2", "title": "MID", "startSec": 60, "endSec": 120},
        ]
        out = ew.build_pegasus_prompt("test", "T", beats)
        assert "beat1" in out and "OPEN" in out
        assert "beat2" in out and "MID" in out

    def test_handles_empty_beats(self):
        out = ew.build_pegasus_prompt("test", "T", [])
        assert "beats not provided" in out


# ── parse_pegasus_response ─────────────────────────────────────────────────


_GOOD_RESPONSE = json.dumps({
    "findings": [
        {
            "category": "pacing_dead_zone",
            "severity": "🔴",
            "timecode_sec": 215.0,
            "duration_sec": 30.0,
            "beat_number": 2,
            "description": "Visual register doesn't change for 30s after the chart settles.",
            "evidence": "From 3:35 to 4:05 the same DataChart frame holds while narration continues.",
        },
        {
            "category": "missed_callback",
            "severity": "🟡",
            "timecode_sec": 480.0,
            "duration_sec": 0.0,
            "beat_number": 4,
            "description": "Stag hunt mentioned in Beat 2 but never named where it breaks.",
            "evidence": "Beat 2 sets up stag hunt as the alternative; Beat 4 closes without bounded-analogy.",
        },
    ],
    "overall_verdict": "fix_then_publish",
    "rationale": "One material dead zone in the body; otherwise clean.",
})


class TestParseResponse:
    def test_clean_json(self):
        findings, verdict, rationale = ew.parse_pegasus_response(_GOOD_RESPONSE)
        assert len(findings) == 2
        assert findings[0].category == "pacing_dead_zone"
        assert findings[0].severity == "🔴"
        assert verdict == "fix_then_publish"
        assert "dead zone" in rationale

    def test_code_fenced(self):
        wrapped = f"Here's my analysis:\n\n```json\n{_GOOD_RESPONSE}\n```\n"
        findings, verdict, _ = ew.parse_pegasus_response(wrapped)
        assert len(findings) == 2
        assert verdict == "fix_then_publish"

    def test_prepended_text(self):
        wrapped = f"Sure, here you go: {_GOOD_RESPONSE}"
        findings, _, _ = ew.parse_pegasus_response(wrapped)
        assert len(findings) == 2

    def test_malformed_returns_empty(self):
        findings, verdict, rationale = ew.parse_pegasus_response("not json")
        assert findings == []
        assert verdict == ""

    def test_empty_string_returns_empty(self):
        findings, _, _ = ew.parse_pegasus_response("")
        assert findings == []

    def test_tolerates_missing_optional_fields(self):
        loose = json.dumps({
            "findings": [
                {
                    "category": "energy_drop",
                    # missing severity, timecode, etc.
                },
            ],
        })
        findings, _, _ = ew.parse_pegasus_response(loose)
        assert len(findings) == 1
        # Defaults applied
        assert findings[0].severity == "🟡"  # default noticeable
        assert findings[0].timecode_sec == 0.0

    def test_skips_finding_without_category(self):
        bad = json.dumps({
            "findings": [
                {"description": "no category at all"},
                {"category": "pacing_dead_zone", "severity": "🟢"},
            ],
        })
        findings, _, _ = ew.parse_pegasus_response(bad)
        assert len(findings) == 1
        assert findings[0].category == "pacing_dead_zone"

    def test_invalid_severity_defaults_to_noticeable(self):
        bad_sev = json.dumps({
            "findings": [
                {"category": "av_desync", "severity": "purple",
                 "timecode_sec": 0, "duration_sec": 0, "beat_number": 1},
            ],
        })
        findings, _, _ = ew.parse_pegasus_response(bad_sev)
        assert findings[0].severity == "🟡"


# ── map_findings_to_segments ───────────────────────────────────────────────


class TestMapFindingsToSegments:
    def test_assigns_segment_id(self):
        findings = [
            ew.Finding(
                category="pacing_dead_zone", severity="🔴",
                timecode_sec=70.0, duration_sec=30.0, beat_number=2,
                description="x", evidence="y",
            ),
        ]
        manifest = {
            "segments": [
                {"id": "beat1-seg01", "startSec": 0, "endSec": 60},
                {"id": "beat2-seg01", "startSec": 60, "endSec": 120},
            ],
        }
        ew.map_findings_to_segments(findings, manifest)
        assert findings[0].segment_id == "beat2-seg01"

    def test_no_match_leaves_segment_id_empty(self):
        findings = [
            ew.Finding(
                category="x", severity="🟡",
                timecode_sec=500.0, duration_sec=0.0, beat_number=99,
                description="x", evidence="y",
            ),
        ]
        manifest = {"segments": [{"id": "x", "startSec": 0, "endSec": 60}]}
        ew.map_findings_to_segments(findings, manifest)
        assert findings[0].segment_id == ""


# ── upload_video (mocked) ──────────────────────────────────────────────────


class TestUploadVideo:
    def test_happy_path_returns_video_id(self, tmp_path):
        mp4 = tmp_path / "ep.mp4"
        mp4.write_bytes(b"x" * 1024)
        calls = {"post": 0, "get": 0}

        def post_fn(url, payload, headers):
            calls["post"] += 1
            assert url.endswith("/tasks")
            return json.dumps({"_id": "task_abc"}).encode()

        def get_fn(url, headers):
            calls["get"] += 1
            assert "task_abc" in url
            # First poll → ready
            return json.dumps({"status": "ready", "video_id": "vid_xyz"}).encode()

        video_id = ew.upload_video(
            mp4, "KEY", "idx_1", post_fn=post_fn, get_fn=get_fn,
            sleep_fn=lambda s: None,
        )
        assert video_id == "vid_xyz"
        assert calls["post"] == 1
        assert calls["get"] == 1

    def test_polling_loop(self, tmp_path):
        mp4 = tmp_path / "ep.mp4"
        mp4.write_bytes(b"x" * 1024)
        get_calls = {"n": 0}

        def post_fn(url, payload, headers):
            return json.dumps({"_id": "task_abc"}).encode()

        def get_fn(url, headers):
            get_calls["n"] += 1
            # First two polls return "processing", third returns ready
            if get_calls["n"] < 3:
                return json.dumps({"status": "processing"}).encode()
            return json.dumps({"status": "ready", "video_id": "vid_z"}).encode()

        video_id = ew.upload_video(
            mp4, "KEY", "idx_1",
            post_fn=post_fn, get_fn=get_fn,
            sleep_fn=lambda s: None,
            poll_interval=0.001,
        )
        assert video_id == "vid_z"
        assert get_calls["n"] == 3

    def test_unknown_status_aborts_after_max_retries(self, tmp_path):
        # Backend returns a status we don't recognize — bounded retry
        # should abort before the full 15-min poll timeout.
        mp4 = tmp_path / "ep.mp4"
        mp4.write_bytes(b"x" * 1024)

        def post_fn(url, payload, headers):
            return json.dumps({"_id": "task_abc"}).encode()

        def get_fn(url, headers):
            return json.dumps({"status": "weird-unknown-status"}).encode()

        with pytest.raises(RuntimeError, match="unknown status"):
            ew.upload_video(
                mp4, "KEY", "idx_1",
                post_fn=post_fn, get_fn=get_fn,
                sleep_fn=lambda s: None,
                poll_interval=0.001,
                # Generous timeout — the unknown-status counter should fire first
                poll_timeout=300,
            )

    def test_known_pending_statuses_keep_polling(self, tmp_path):
        # queued / pending / processing are all expected during indexing.
        # They should NOT count toward the unknown-status budget.
        mp4 = tmp_path / "ep.mp4"
        mp4.write_bytes(b"x" * 1024)
        statuses = ["queued", "pending", "processing", "indexing", "ready"]
        idx = {"n": 0}

        def post_fn(url, payload, headers):
            return json.dumps({"_id": "task_abc"}).encode()

        def get_fn(url, headers):
            s = statuses[idx["n"]]
            idx["n"] += 1
            if s == "ready":
                return json.dumps({"status": "ready", "video_id": "vid_y"}).encode()
            return json.dumps({"status": s}).encode()

        video_id = ew.upload_video(
            mp4, "KEY", "idx_1",
            post_fn=post_fn, get_fn=get_fn,
            sleep_fn=lambda s: None,
            poll_interval=0.001,
        )
        assert video_id == "vid_y"

    def test_failed_status_raises(self, tmp_path):
        mp4 = tmp_path / "ep.mp4"
        mp4.write_bytes(b"x" * 1024)

        def post_fn(url, payload, headers):
            return json.dumps({"_id": "task_abc"}).encode()

        def get_fn(url, headers):
            return json.dumps({"status": "failed", "error": "bad format"}).encode()

        with pytest.raises(RuntimeError, match="indexing failed"):
            ew.upload_video(
                mp4, "KEY", "idx_1",
                post_fn=post_fn, get_fn=get_fn,
                sleep_fn=lambda s: None,
            )

    def test_timeout_raises(self, tmp_path):
        mp4 = tmp_path / "ep.mp4"
        mp4.write_bytes(b"x" * 1024)
        # Mock time.monotonic to return a value past the deadline on the
        # second call. We use a counter to control which call returns what.
        t = {"n": 0}
        def fake_monotonic():
            t["n"] += 1
            return float(t["n"] * 1000)  # huge jumps to blow the timeout

        with pytest.MonkeyPatch().context() as mp:
            mp.setattr(time, "monotonic", fake_monotonic)
            def post_fn(url, payload, headers):
                return json.dumps({"_id": "task_abc"}).encode()
            def get_fn(url, headers):
                return json.dumps({"status": "processing"}).encode()
            with pytest.raises(RuntimeError, match="did not complete"):
                ew.upload_video(
                    mp4, "KEY", "idx_1",
                    post_fn=post_fn, get_fn=get_fn,
                    sleep_fn=lambda s: None,
                    poll_timeout=1,
                )


# ── query_pegasus (mocked) ─────────────────────────────────────────────────


class TestQueryPegasus:
    def test_happy_path(self):
        def post_fn(url, payload, headers):
            assert "/generate" in url
            return json.dumps({"data": _GOOD_RESPONSE}).encode()
        out = ew.query_pegasus("vid_1", "prompt text", "KEY", post_fn=post_fn)
        assert "findings" in out  # raw response text contains the JSON

    def test_alternate_response_key(self):
        # Some endpoints return `text` instead of `data`
        def post_fn(url, payload, headers):
            return json.dumps({"text": _GOOD_RESPONSE}).encode()
        out = ew.query_pegasus("vid_1", "prompt", "KEY", post_fn=post_fn)
        assert "findings" in out

    def test_malformed_raises(self):
        def post_fn(url, payload, headers):
            return b"not json at all"
        with pytest.raises(RuntimeError, match="malformed"):
            ew.query_pegasus("vid_1", "p", "KEY", post_fn=post_fn)


# ── run_episode_watch ──────────────────────────────────────────────────────


class TestRunEpisodeWatch:
    def test_dry_run_skips_api_calls(self, tmp_path):
        manifest = tmp_path / "m.json"
        manifest.write_text(json.dumps({
            "title": "Test Episode",
            "beats": [{"id": "beat1", "title": "OPEN", "startSec": 0, "endSec": 60}],
        }), encoding="utf-8")
        report = ew.run_episode_watch(
            "test", mp4_path=None, video_id=None,
            manifest_path=manifest, api_key=None, dry_run=True,
        )
        assert report.video_id == ""
        assert report.findings == []
        assert "PARALLAX EDITORIAL DOCTRINE" in report.prompt_used
        assert "OPEN" in report.prompt_used

    def test_live_path_without_api_key_raises(self, tmp_path):
        with pytest.raises(RuntimeError, match="TWELVELABS_API_KEY"):
            ew.run_episode_watch(
                "test", mp4_path=tmp_path / "fake.mp4",
                api_key=None, dry_run=False,
            )

    def test_reuse_video_id_skips_upload(self):
        # mp4_path is None, video_id is provided → upload is skipped
        # and query_pegasus is called directly.
        def post_fn(url, payload, headers):
            return json.dumps({"data": _GOOD_RESPONSE}).encode()
        def get_fn(url, headers):
            raise AssertionError("get_fn should not be called when video_id is reused")
        report = ew.run_episode_watch(
            "test", mp4_path=None, video_id="vid_existing",
            manifest_path=None, api_key="KEY",
            dry_run=False, post_fn=post_fn, get_fn=get_fn,
        )
        assert report.video_id == "vid_existing"
        assert len(report.findings) == 2


# ── render_report_md ───────────────────────────────────────────────────────


class TestRenderReport:
    def test_no_findings_message(self):
        report = ew.EpisodeWatchReport(
            slug="x", episode_title="X", video_id="vid_x",
        )
        out = ew.render_report_md(report)
        assert "No findings" in out

    def test_findings_table_and_detail(self):
        report = ew.EpisodeWatchReport(
            slug="x", episode_title="X", video_id="vid_x",
            findings=[
                ew.Finding(
                    category="pacing_dead_zone", severity="🔴",
                    timecode_sec=180.0, duration_sec=30.0, beat_number=2,
                    description="Description here.",
                    evidence="Evidence here.",
                    segment_id="beat2-seg-04",
                ),
            ],
            overall_verdict="fix_then_publish",
            rationale="One material issue.",
        )
        out = ew.render_report_md(report)
        assert "fix_then_publish" in out
        assert "One material issue" in out
        assert "pacing_dead_zone" in out
        assert "Description here" in out
        assert "Evidence here" in out
        assert "beat2-seg-04" in out


# ── CLI smoke ──────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_dry_run_no_inputs_works(self, tmp_path):
        # --dry-run only needs the slug; no mp4, no key
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "episode_watch" / "episode_watch.py"),
             "test-slug", "--dry-run", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert "DRY RUN" in result.stdout
        assert "PARALLAX EDITORIAL DOCTRINE" in result.stdout

    def test_live_without_key_exits_2(self, tmp_path):
        mp4 = tmp_path / "ep.mp4"
        mp4.write_bytes(b"x" * 1024)
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "episode_watch" / "episode_watch.py"),
             "test-slug", "--mp4", str(mp4), "--stdout"],
            capture_output=True, text=True,
            env={**__import__("os").environ, "TWELVELABS_API_KEY": ""},
        )
        assert result.returncode == 2

    def test_missing_mp4_exits_2(self):
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "episode_watch" / "episode_watch.py"),
             "test-slug", "--mp4", "/no/such/file.mp4", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 2

    def test_dry_run_json(self):
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "episode_watch" / "episode_watch.py"),
             "test-slug", "--dry-run", "--json", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert payload["slug"] == "test-slug"
        assert "PARALLAX EDITORIAL DOCTRINE" in payload["prompt_used"]
