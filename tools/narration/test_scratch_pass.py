"""
Unit tests for tools/narration/scratch_pass.py.

Coverage:
  · Drift severity classification (within tolerance / noticeable / material)
  · Report rendering with each section conditionally present
  · run_scratch_pass orchestration with mocked subprocess + transcript
  · CLI smoke (missing inputs, --skip-alignment, --no-manifest)
"""

from __future__ import annotations

import subprocess
import sys
import textwrap
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import scratch_pass as sp  # type: ignore[import-not-found]


# ── _drift_severity ──────────────────────────────────────────────────────────


class TestDriftSeverity:
    def test_within_tolerance(self):
        assert "🟢" in sp._drift_severity(2.0)
        assert "🟢" in sp._drift_severity(-3.0)

    def test_noticeable(self):
        assert "🟡" in sp._drift_severity(7.0)
        assert "🟡" in sp._drift_severity(-8.0)

    def test_material(self):
        assert "🔴" in sp._drift_severity(15.0)
        assert "🔴" in sp._drift_severity(-20.0)


# ── _fmt_mmss ────────────────────────────────────────────────────────────────


class TestFmtMmss:
    def test_minute_seconds(self):
        assert sp._fmt_mmss(125.0) == "2:05"

    def test_zero(self):
        assert sp._fmt_mmss(0.0) == "0:00"

    def test_handles_negative(self):
        # _fmt_mmss is called on absolute-difference values so negative
        # inputs should still format cleanly (used inside the report
        # alongside an explicit ± sign).
        assert sp._fmt_mmss(-30.0) == "0:30"


# ── render_report_md ─────────────────────────────────────────────────────────


def _make_report(**overrides) -> sp.ScratchPassReport:
    defaults = dict(
        slug="test-ep",
        scratch_wav_path=Path("/tmp/narration-scratch.wav"),
        script_path=Path("/tmp/script-production.md"),
        alignment_ran=True,
        alignment_pickup_count=3,
        alignment_minor_issues=5,
        manifest_promoted=True,
        manifest_path=Path("/tmp/manifest.json"),
        script_estimated_sec=900.0,    # 15 min
        actual_runtime_sec=945.0,      # 15:45 (5% over)
        drift_pct=5.0,
    )
    defaults.update(overrides)
    return sp.ScratchPassReport(**defaults)


class TestRenderReport:
    def test_renders_alignment_section(self):
        out = sp.render_report_md(_make_report())
        assert "3" in out  # pickup count
        assert "5" in out  # minor issues
        assert "Alignment" in out

    def test_renders_drift_section(self):
        out = sp.render_report_md(_make_report(drift_pct=12.5))
        assert "+12.5%" in out
        assert "🔴" in out  # material drift

    def test_renders_manifest_promoted_when_successful(self):
        out = sp.render_report_md(_make_report())
        assert "promoted to precise mode" in out
        assert "✓" in out

    def test_renders_manifest_skipped_when_not_promoted(self):
        out = sp.render_report_md(_make_report(manifest_promoted=False, manifest_path=None))
        assert "promotion skipped" in out or "Manifest promotion skipped" in out

    def test_renders_warnings_when_present(self):
        r = _make_report()
        r.warnings.append("test warning message")
        out = sp.render_report_md(r)
        assert "test warning message" in out

    def test_skipped_alignment_renders_cleanly(self):
        out = sp.render_report_md(_make_report(alignment_ran=False))
        assert "Skipped" in out


# ── run_scratch_pass (mocked) ────────────────────────────────────────────────


class TestRunScratchPass:
    """run_scratch_pass orchestrates whisper_alignment + generate_manifest.
    We mock both so the test runs without faster-whisper or a real script."""

    @pytest.fixture
    def tmp_script(self, tmp_path):
        """Build a minimal valid script + scratch WAV in tmp_path."""
        ep_dir = tmp_path / "episodes" / "x"
        ep_dir.mkdir(parents=True)
        script = ep_dir / "script-production.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — T

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Hello world. | x |
        """), encoding="utf-8")
        wav = ep_dir / "assets" / "narration-scratch.wav"
        wav.parent.mkdir()
        wav.write_bytes(b"fake-wav-bytes")
        return script, wav

    def test_missing_script_raises(self, tmp_path):
        wav = tmp_path / "scratch.wav"
        wav.write_bytes(b"")
        with pytest.raises(FileNotFoundError, match="no production script"):
            sp.run_scratch_pass("nonexistent-ep", wav)

    def test_skip_flags_short_circuit(self, tmp_script):
        script, wav = tmp_script
        report = sp.run_scratch_pass(
            "x", wav, skip_alignment=True, skip_manifest=True,
            script_override=script,
        )
        # Both stages skipped → no calls to whisper or manifest
        assert not report.alignment_ran
        assert not report.manifest_promoted
        # Script estimate is still computed (no external dep)
        assert report.script_estimated_sec > 0

    def test_alignment_failure_captured_as_warning(self, tmp_script, monkeypatch):
        script, wav = tmp_script

        def fake_run_alignment(*args, **kwargs):
            raise RuntimeError("faster-whisper not installed")

        monkeypatch.setattr(sp, "run_alignment_pass", fake_run_alignment)
        report = sp.run_scratch_pass(
            "x", wav, skip_manifest=True, script_override=script,
        )
        assert not report.alignment_ran
        assert any("alignment skipped" in w for w in report.warnings)

    def test_manifest_promotion_failure_captured_as_warning(self, tmp_script, monkeypatch):
        script, wav = tmp_script

        def fake_alignment(*args, **kwargs):
            # Return a minimal AlignmentReport-shaped object
            import whisper_alignment as wa
            return (
                wa.AlignmentReport(
                    issues=[], script_word_count=10, transcript_word_count=10,
                    transcript_duration_sec=10, estimated_script_duration_sec=10,
                ),
                0, 0,
            )

        def fake_manifest(*args, **kwargs):
            raise RuntimeError("generate_manifest.py failed: simulated")

        monkeypatch.setattr(sp, "run_alignment_pass", fake_alignment)
        monkeypatch.setattr(sp, "run_manifest_promotion", fake_manifest)
        report = sp.run_scratch_pass("x", wav, script_override=script)
        assert report.alignment_ran
        assert not report.manifest_promoted
        assert any("manifest promotion failed" in w for w in report.warnings)


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_missing_scratch_wav_exits_2(self, tmp_path):
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "scratch_pass.py"),
                "nonexistent-slug",
                "--wav", str(tmp_path / "no-such.wav"),
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "not found" in result.stderr

    def test_missing_script_exits_2(self, tmp_path):
        # Create a fake wav at the expected path but no script
        slug = "missing-script-slug"
        ep_dir = REPO_ROOT / "episodes" / slug
        if ep_dir.exists():
            pytest.skip(f"{slug} accidentally exists")
        wav = tmp_path / "scratch.wav"
        wav.write_bytes(b"")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "scratch_pass.py"),
                slug, "--wav", str(wav),
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "no production script" in result.stderr
