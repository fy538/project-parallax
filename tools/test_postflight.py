"""
Tests for tools/postflight.py — rendered-MP4 sanity verification.

We test the orchestration and check logic against fabricated ProbeResults.
Probing real MP4 files (and running ffprobe) is exercised in the CLI smoke
test on the real `prisoners-dilemma-showcase.mp4` render (skipped when not
present).
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import postflight  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPT_PATH = REPO_ROOT / "tools" / "postflight.py"


# ─── Helpers ─────────────────────────────────────────────────────────────────


def _write_dummy(path: Path, size: int) -> None:
    """Create a file of the given byte size — only the bytes-floor check cares."""
    path.write_bytes(b"\x00" * size)


def _patch_probe(monkeypatch, probe: postflight.ProbeResult) -> None:
    """Make probe_mp4 return our fixture instead of actually invoking ffprobe."""
    monkeypatch.setattr(postflight, "probe_mp4", lambda _path: probe)


# ─── 1. Bytes-per-second floor ───────────────────────────────────────────────


class TestBytesPerSecondFloor:
    def test_healthy_render_passes(self, tmp_path, monkeypatch):
        f = tmp_path / "ok.mp4"
        _write_dummy(f, size=10_000_000)  # 10 MB
        _patch_probe(monkeypatch, postflight.ProbeResult(
            duration_sec=20.0, video_streams=1, width=1920, height=1080,
        ))
        report = postflight.run_postflight(f)
        # 10 MB / 20s = 500 KB/s, well above the 50 KB/s floor
        floor_check = next(c for c in report.checks if c.name == "bytes-per-second-floor")
        assert floor_check.ok is True
        assert report.failed is False

    def test_tiny_for_its_duration_fails(self, tmp_path, monkeypatch):
        f = tmp_path / "stub.mp4"
        _write_dummy(f, size=100_000)  # 100 KB but ffprobe thinks it's 60s long
        _patch_probe(monkeypatch, postflight.ProbeResult(
            duration_sec=60.0, video_streams=1, width=1920, height=1080,
        ))
        report = postflight.run_postflight(f)
        floor_check = next(c for c in report.checks if c.name == "bytes-per-second-floor")
        assert floor_check.ok is False  # 100KB / 60s = ~1.6 KB/s, far below 50 KB/s
        assert report.failed is True

    def test_no_duration_uses_1KB_fallback(self, tmp_path, monkeypatch):
        # ffprobe couldn't read a duration — use absolute floor.
        f = tmp_path / "weird.mp4"
        _write_dummy(f, size=500)
        _patch_probe(monkeypatch, postflight.ProbeResult(
            duration_sec=None, video_streams=1,
        ))
        report = postflight.run_postflight(f)
        fallback = next(c for c in report.checks if c.name == "file-size-fallback")
        assert fallback.ok is False
        assert "1 KB floor" in fallback.detail

    def test_custom_floor_threshold(self, tmp_path, monkeypatch):
        # Caller can dial the floor up or down — e.g. for low-motion renders
        # where the bitrate is genuinely small.
        f = tmp_path / "low-bitrate.mp4"
        _write_dummy(f, size=500_000)  # 500 KB
        _patch_probe(monkeypatch, postflight.ProbeResult(
            duration_sec=60.0, video_streams=1, width=1920, height=1080,
        ))
        # Default 50 KB/s × 60s = 3 MB floor → 500KB fails
        assert postflight.run_postflight(f).failed is True
        # Drop floor to 5 KB/s × 60s = 300 KB → 500KB passes
        assert postflight.run_postflight(f, min_bytes_per_sec=5_000).failed is False


# ─── 2. Video-stream presence ────────────────────────────────────────────────


class TestVideoStreamPresence:
    def test_zero_video_streams_fails(self, tmp_path, monkeypatch):
        f = tmp_path / "audio-only.mp4"
        _write_dummy(f, size=10_000_000)
        _patch_probe(monkeypatch, postflight.ProbeResult(
            duration_sec=10.0, video_streams=0,
        ))
        report = postflight.run_postflight(f)
        stream_check = next(c for c in report.checks if c.name == "video-stream-present")
        assert stream_check.ok is False
        assert stream_check.severity == "error"

    def test_one_video_stream_passes(self, tmp_path, monkeypatch):
        f = tmp_path / "ok.mp4"
        _write_dummy(f, size=10_000_000)
        _patch_probe(monkeypatch, postflight.ProbeResult(
            duration_sec=10.0, video_streams=1, width=1920, height=1080,
        ))
        report = postflight.run_postflight(f)
        stream_check = next(c for c in report.checks if c.name == "video-stream-present")
        assert stream_check.ok is True

    def test_missing_ffprobe_skips_check_softly(self, tmp_path, monkeypatch):
        f = tmp_path / "ok.mp4"
        _write_dummy(f, size=10_000_000)
        _patch_probe(monkeypatch, postflight.ProbeResult(
            probe_available=False, raw_error="ffprobe not installed",
        ))
        report = postflight.run_postflight(f)
        stream_check = next(c for c in report.checks if c.name == "video-stream-present")
        assert stream_check.ok is True
        assert stream_check.severity == "info"
        # Bytes-fallback should still apply
        assert any(c.name == "file-size-fallback" for c in report.checks)


# ─── 3. Duration match against manifest ──────────────────────────────────────


class TestDurationMatch:
    def _make_manifest_loader(self, monkeypatch, manifest: dict | None):
        monkeypatch.setattr(postflight, "load_episode_manifest", lambda _slug: manifest)

    def test_within_tolerance_passes(self, tmp_path, monkeypatch):
        f = tmp_path / "ok.mp4"
        _write_dummy(f, size=10_000_000)
        _patch_probe(monkeypatch, postflight.ProbeResult(
            duration_sec=100.3, video_streams=1, width=1920, height=1080,
        ))
        self._make_manifest_loader(monkeypatch, {"totalDurationSec": 100.0})
        report = postflight.run_postflight(f, episode="demo")
        dm = next(c for c in report.checks if c.name == "duration-match")
        assert dm.ok is True  # 0.3s diff within 0.5s default tolerance

    def test_outside_tolerance_fails(self, tmp_path, monkeypatch):
        f = tmp_path / "clipped.mp4"
        _write_dummy(f, size=10_000_000)
        _patch_probe(monkeypatch, postflight.ProbeResult(
            duration_sec=85.0, video_streams=1, width=1920, height=1080,
        ))
        self._make_manifest_loader(monkeypatch, {"totalDurationSec": 100.0})
        report = postflight.run_postflight(f, episode="demo")
        dm = next(c for c in report.checks if c.name == "duration-match")
        assert dm.ok is False
        assert "85.00" in dm.detail and "100.00" in dm.detail
        assert report.failed is True

    def test_missing_manifest_yields_loader_failure(self, tmp_path, monkeypatch):
        f = tmp_path / "ok.mp4"
        _write_dummy(f, size=10_000_000)
        _patch_probe(monkeypatch, postflight.ProbeResult(
            duration_sec=100.0, video_streams=1, width=1920, height=1080,
        ))
        self._make_manifest_loader(monkeypatch, None)
        report = postflight.run_postflight(f, episode="nonexistent")
        ml = next(c for c in report.checks if c.name == "manifest-loaded")
        assert ml.ok is False
        assert report.failed is True

    def test_manifest_without_totalDurationSec_skips_softly(self, tmp_path, monkeypatch):
        f = tmp_path / "ok.mp4"
        _write_dummy(f, size=10_000_000)
        _patch_probe(monkeypatch, postflight.ProbeResult(
            duration_sec=100.0, video_streams=1, width=1920, height=1080,
        ))
        self._make_manifest_loader(monkeypatch, {})
        report = postflight.run_postflight(f, episode="demo")
        skipped = next(c for c in report.checks if c.name == "manifest-duration-declared")
        assert skipped.ok is True
        assert skipped.severity == "info"


# ─── 4. Resolution match ─────────────────────────────────────────────────────


class TestResolutionMatch:
    def test_default_1920x1080_when_episode_set(self, tmp_path, monkeypatch):
        f = tmp_path / "ok.mp4"
        _write_dummy(f, size=10_000_000)
        _patch_probe(monkeypatch, postflight.ProbeResult(
            duration_sec=100.0, video_streams=1, width=1920, height=1080,
        ))
        monkeypatch.setattr(postflight, "load_episode_manifest", lambda _s: {"totalDurationSec": 100})
        report = postflight.run_postflight(f, episode="demo")
        rm = next(c for c in report.checks if c.name == "resolution-match")
        assert rm.ok is True

    def test_wrong_resolution_fails(self, tmp_path, monkeypatch):
        f = tmp_path / "wrong.mp4"
        _write_dummy(f, size=10_000_000)
        _patch_probe(monkeypatch, postflight.ProbeResult(
            duration_sec=100.0, video_streams=1, width=1080, height=1920,  # Shorts shape, not episode
        ))
        monkeypatch.setattr(postflight, "load_episode_manifest", lambda _s: {"totalDurationSec": 100})
        report = postflight.run_postflight(f, episode="demo")
        rm = next(c for c in report.checks if c.name == "resolution-match")
        assert rm.ok is False
        assert "1080×1920" in rm.detail and "1920×1080" in rm.detail

    def test_shorts_resolution_via_override(self, tmp_path, monkeypatch):
        f = tmp_path / "short.mp4"
        _write_dummy(f, size=5_000_000)
        _patch_probe(monkeypatch, postflight.ProbeResult(
            duration_sec=30.0, video_streams=1, width=1080, height=1920,
        ))
        report = postflight.run_postflight(f, expected_resolution=(1080, 1920))
        rm = next(c for c in report.checks if c.name == "resolution-match")
        assert rm.ok is True

    def test_no_episode_and_no_override_skips_resolution_check(self, tmp_path, monkeypatch):
        f = tmp_path / "ok.mp4"
        _write_dummy(f, size=10_000_000)
        _patch_probe(monkeypatch, postflight.ProbeResult(
            duration_sec=10.0, video_streams=1, width=1920, height=1080,
        ))
        report = postflight.run_postflight(f)
        assert not any(c.name == "resolution-match" for c in report.checks)


# ─── 5. CLI smoke + arg parsing ──────────────────────────────────────────────


class TestCLI:
    def test_parse_resolution_accepts_x_and_unicode_times(self):
        assert postflight.parse_resolution("1920x1080") == (1920, 1080)
        assert postflight.parse_resolution("1080X1920") == (1080, 1920)
        assert postflight.parse_resolution("1920×1080") == (1920, 1080)

    def test_parse_resolution_rejects_garbage(self):
        with pytest.raises(Exception):
            postflight.parse_resolution("1920")
        with pytest.raises(Exception):
            postflight.parse_resolution("foo x bar")

    def test_missing_input_file_exits_2(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "/tmp/does-not-exist-xyz123.mp4"],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 2
        assert "not found" in result.stderr.lower()

    def test_real_render_passes_when_present(self):
        """Smoke test against the real prisoners-dilemma-showcase render if present."""
        real_render = REPO_ROOT / "remotion-templates" / "out" / "prisoners-dilemma-showcase.mp4"
        if not real_render.is_file():
            pytest.skip("no rendered MP4 to test against")
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), str(real_render), "--json"],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 0
        parsed = json.loads(result.stdout)
        assert parsed["failed"] is False
        # Sanity: should report 1920×1080 video stream
        assert parsed["probe"]["width"] == 1920
        assert parsed["probe"]["height"] == 1080
