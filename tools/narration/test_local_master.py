"""
Unit tests for tools/narration/local_master.py.

Strategy mirrors audio_qa.py:
  · Pure-function tests for filter-chain construction (no ffmpeg).
  · Pure-function test for parse_pass1_measurement (re-uses audio_qa's
    brace-balanced JSON extractor — guard the integration point).
  · Integration tests that synthesize tiny WAVs via ffmpeg and run the
    full two-pass master, asserting the output is at target LUFS.
    Skipped cleanly when ffmpeg isn't on PATH.
"""

from __future__ import annotations

import shutil
import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import audio_qa as aq  # type: ignore[import-not-found]
import local_master as lm  # type: ignore[import-not-found]


HAS_FFMPEG = shutil.which("ffmpeg") is not None and shutil.which("ffprobe") is not None


# ── build_pass1_filters / build_pass2_filters ────────────────────────────────


class TestBuildFilters:
    def test_safe_preset_chain_minimal(self):
        chain = lm.build_pass1_filters("safe", target_lufs=-14, target_lra=11)
        # safe = HPF + loudnorm only; no compressor, no gate
        assert "highpass" in chain
        assert "loudnorm" in chain
        assert "acompressor" not in chain
        assert "agate" not in chain

    def test_standard_preset_includes_compressor(self):
        chain = lm.build_pass1_filters("standard", target_lufs=-14, target_lra=11)
        assert "highpass" in chain
        assert "acompressor" in chain
        assert "agate" not in chain  # no gate at standard
        assert "loudnorm" in chain

    def test_aggressive_preset_includes_gate_and_compressor(self):
        chain = lm.build_pass1_filters("aggressive", target_lufs=-14, target_lra=11)
        assert "agate" in chain
        assert "acompressor" in chain
        assert "loudnorm" in chain

    def test_unknown_preset_rejected(self):
        with pytest.raises(ValueError):
            lm.build_pass1_filters("unhinged", target_lufs=-14, target_lra=11)

    def test_target_lufs_appears_in_loudnorm_clause(self):
        chain = lm.build_pass1_filters("standard", target_lufs=-16, target_lra=7)
        assert "I=-16" in chain
        assert "LRA=7" in chain

    def test_pass2_includes_measured_values(self):
        measured = lm.LoudnormPass1(
            input_i=-23.0, input_tp=-2.5, input_lra=5.0,
            input_thresh=-33.0, target_offset=0.5,
        )
        chain = lm.build_pass2_filters("standard", -14, 11, measured)
        assert "measured_I=-23.0" in chain
        assert "measured_TP=-2.5" in chain
        assert "measured_LRA=5.0" in chain
        assert "offset=0.5" in chain
        assert "linear=true" in chain  # forces linear normalization mode


# ── parse_pass1_measurement ──────────────────────────────────────────────────


class TestParsePass1:
    def test_parses_real_pass1_output(self):
        stderr = textwrap.dedent("""\
            [Parsed_loudnorm_0 @ 0x600]
            {
                "input_i" : "-23.27",
                "input_tp" : "-7.51",
                "input_lra" : "8.30",
                "input_thresh" : "-33.27",
                "target_offset" : "0.73",
                "output_i" : "-24.00"
            }
        """)
        measured = lm.parse_pass1_measurement(stderr)
        assert measured is not None
        assert measured.input_i == pytest.approx(-23.27)
        assert measured.input_tp == pytest.approx(-7.51)
        assert measured.target_offset == pytest.approx(0.73)

    def test_returns_none_when_block_missing(self):
        assert lm.parse_pass1_measurement("ffmpeg version 6.0 …") is None

    def test_returns_none_when_target_offset_missing(self):
        # Older ffmpeg might omit target_offset — parser should fail
        # cleanly rather than crash with KeyError, so the caller can
        # surface a useful error instead of a traceback.
        stderr = textwrap.dedent("""\
            [Parsed_loudnorm_0]
            {"input_i": "-23", "input_tp": "-7", "input_lra": "8",
             "input_thresh": "-33"}
        """)
        assert lm.parse_pass1_measurement(stderr) is None


# ── _default_output ──────────────────────────────────────────────────────────


class TestDefaultOutput:
    def test_appends_mastered_before_extension(self, tmp_path):
        inp = tmp_path / "narration.wav"
        out = lm._default_output(inp)
        assert out.name == "narration-mastered.wav"
        assert out.parent == tmp_path

    def test_preserves_extension(self, tmp_path):
        inp = tmp_path / "x.flac"
        assert lm._default_output(inp).name == "x-mastered.flac"


# ── Integration tests (real ffmpeg) ──────────────────────────────────────────


@pytest.mark.skipif(not HAS_FFMPEG, reason="ffmpeg not on PATH")
class TestIntegration:
    """End-to-end with real ffmpeg. Synthesizes a tone, runs the master,
    asserts the output has correct format and reasonable loudness."""

    @staticmethod
    def _make_wav(out_path: Path, duration_sec: float = 15.0) -> None:
        """Generate a sine WAV at a controlled level."""
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-f", "lavfi",
                "-i", f"sine=frequency=440:duration={duration_sec}:sample_rate=48000",
                "-ac", "1", "-ar", "48000", "-c:a", "pcm_s16le",
                str(out_path),
            ],
            check=True,
        )

    def test_master_produces_output_at_correct_format(self, tmp_path):
        inp = tmp_path / "in.wav"
        out = tmp_path / "out.wav"
        self._make_wav(inp)
        lm.master_wav(inp, out, preset="safe", target_lufs=-14, target_lra=11)
        # Output should exist and be mono / 48k / PCM
        assert out.is_file()
        probe = aq.probe_audio(out)
        assert probe.sample_rate == 48000
        assert probe.channels == 1
        assert probe.codec.startswith("pcm_")

    def test_master_lands_close_to_target_lufs(self, tmp_path):
        inp = tmp_path / "in.wav"
        out = tmp_path / "out.wav"
        self._make_wav(inp)
        lm.master_wav(inp, out, preset="safe", target_lufs=-14, target_lra=11)
        loud = aq.measure_loudness(out)
        assert loud is not None
        # Two-pass loudnorm should hit -14 ± 1.5 LUFS in practice.
        assert abs(loud.integrated_lufs - (-14.0)) <= 1.5, \
            f"mastered LUFS {loud.integrated_lufs} too far from -14"

    def test_standard_preset_completes(self, tmp_path):
        inp = tmp_path / "in.wav"
        out = tmp_path / "out.wav"
        self._make_wav(inp)
        # The standard preset adds compression; just verify it runs
        # without error and produces a file.
        lm.master_wav(inp, out, preset="standard", target_lufs=-14, target_lra=11)
        assert out.is_file() and out.stat().st_size > 0

    def test_aggressive_preset_completes(self, tmp_path):
        inp = tmp_path / "in.wav"
        out = tmp_path / "out.wav"
        self._make_wav(inp)
        lm.master_wav(inp, out, preset="aggressive", target_lufs=-14, target_lra=11)
        assert out.is_file()

    def test_cli_refuses_to_overwrite_input(self, tmp_path):
        wav = tmp_path / "narration.wav"
        self._make_wav(wav)
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "local_master.py"),
                "--wav", str(wav),
                "-o", str(wav),  # same as input
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "refusing to overwrite" in result.stderr

    def test_cli_smoke_end_to_end(self, tmp_path):
        wav = tmp_path / "narration.wav"
        out = tmp_path / "narration-mastered.wav"
        self._make_wav(wav)
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "local_master.py"),
                "--wav", str(wav),
                "-o", str(out),
                "--preset", "safe",
                "--no-audio-qa",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0, result.stderr
        assert out.is_file()
