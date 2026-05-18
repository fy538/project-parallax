"""
Unit tests for tools/narration/audio_qa.py.

Two layers:
  1. Pure-function tests for the parsers (loudnorm JSON extraction,
     silencedetect line pairing, timestamp formatting) — no ffmpeg required.
  2. Integration tests that synthesize tiny WAV files with ffmpeg's
     anullsrc + sine generators and run the full audit pipeline. These
     skip cleanly when ffmpeg isn't on PATH.
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


HAS_FFMPEG = shutil.which("ffmpeg") is not None and shutil.which("ffprobe") is not None


# ── parse_loudnorm_output ─────────────────────────────────────────────────────


class TestParseLoudnorm:
    def test_parses_real_ffmpeg_output(self):
        stderr = textwrap.dedent("""\
            [some other log line]
            [Parsed_loudnorm_0 @ 0x600003c44000]
            {
                    "input_i" : "-23.27",
                    "input_tp" : "-7.51",
                    "input_lra" : "8.30",
                    "input_thresh" : "-33.27",
                    "output_i" : "-24.00",
                    "output_tp" : "-2.00"
            }
        """)
        report = aq.parse_loudnorm_output(stderr)
        assert report is not None
        assert report.integrated_lufs == pytest.approx(-23.27)
        assert report.true_peak_db == pytest.approx(-7.51)
        assert report.lra == pytest.approx(8.30)

    def test_returns_none_when_no_block(self):
        assert aq.parse_loudnorm_output("ffmpeg version 6.0 ...") is None

    def test_returns_none_on_malformed_json(self):
        stderr = '{"input_i" : "not-a-number"}'
        assert aq.parse_loudnorm_output(stderr) is None

    def test_picks_first_matching_block_only(self):
        # If something resembling another input_i appears later, we still
        # grab the first complete block.
        stderr = (
            '{"input_i" : "-14.0", "input_tp" : "-1.0", "input_lra" : "5.0"}\n'
            '... noise ...\n'
            '{"input_i" : "-99.0", "input_tp" : "0.0", "input_lra" : "0.0"}\n'
        )
        report = aq.parse_loudnorm_output(stderr)
        assert report is not None
        assert report.integrated_lufs == pytest.approx(-14.0)

    def test_parses_block_when_keys_reordered(self):
        """Regression: the old regex required `input_i` to be the first
        key. Future ffmpeg versions may emit keys in different order;
        the brace-balanced extractor handles any ordering."""
        stderr = textwrap.dedent("""\
            [Parsed_loudnorm_0 @ 0x1]
            {
                "input_thresh": "-33.0",
                "input_lra": "5.0",
                "output_i": "-14.0",
                "input_tp": "-2.5",
                "input_i": "-23.0"
            }
        """)
        report = aq.parse_loudnorm_output(stderr)
        assert report is not None
        assert report.integrated_lufs == pytest.approx(-23.0)
        assert report.true_peak_db == pytest.approx(-2.5)

    def test_brace_balanced_handles_nested_objects(self):
        """Hypothetical future ffmpeg output: nested object values
        inside the loudnorm JSON. The old non-greedy `.*?\\}` stopped
        at the first `}`; the new extractor walks brace depth."""
        stderr = (
            '[Parsed_loudnorm_0]\n'
            '{"input_i": "-14.0", "input_tp": "-1.0", "input_lra": "5.0", '
            '"meta": {"nested": "value"}}\n'
        )
        report = aq.parse_loudnorm_output(stderr)
        assert report is not None
        assert report.integrated_lufs == pytest.approx(-14.0)


# ── parse_silencedetect_output ───────────────────────────────────────────────


class TestParseSilencedetect:
    def test_pairs_start_and_end_lines(self):
        stderr = textwrap.dedent("""\
            [silencedetect @ 0x1] silence_start: 5.0
            [silencedetect @ 0x1] silence_end: 8.5 | silence_duration: 3.5
            [silencedetect @ 0x1] silence_start: 20.1
            [silencedetect @ 0x1] silence_end: 23.6 | silence_duration: 3.5
        """)
        events = aq.parse_silencedetect_output(stderr)
        assert len(events) == 2
        assert events[0].start_sec == 5.0
        assert events[0].duration_sec == 3.5
        assert events[1].start_sec == 20.1

    def test_handles_interleaved_log_lines(self):
        stderr = textwrap.dedent("""\
            [silencedetect @ 0x1] silence_start: 5.0
            Some unrelated ffmpeg log line.
            More noise.
            [silencedetect @ 0x1] silence_end: 8.5 | silence_duration: 3.5
        """)
        events = aq.parse_silencedetect_output(stderr)
        assert len(events) == 1

    def test_drops_unpaired_trailing_start(self):
        """If the file cuts off during silence, the start has no matching
        end and should be silently dropped."""
        stderr = "[silencedetect @ 0x1] silence_start: 5.0\n"
        assert aq.parse_silencedetect_output(stderr) == []

    def test_empty_input_returns_empty(self):
        assert aq.parse_silencedetect_output("") == []


# ── _fmt_timestamp ───────────────────────────────────────────────────────────


class TestFmtTimestamp:
    def test_sub_minute(self):
        assert aq._fmt_timestamp(12.345) == "0:12.3"

    def test_one_minute(self):
        assert aq._fmt_timestamp(67.5) == "1:07.5"

    def test_zero(self):
        assert aq._fmt_timestamp(0) == "0:00.0"


# ── check_loudness ───────────────────────────────────────────────────────────


class TestCheckLoudness:
    def test_on_target_is_ok(self):
        r = aq.LoudnessReport(integrated_lufs=-14.2, true_peak_db=-2.0, lra=5.0)
        findings = aq.check_loudness(r)
        assert all(f.level == "ok" for f in findings)
        assert any(f.code == "A-LUFS" for f in findings)

    def test_too_quiet_warns(self):
        r = aq.LoudnessReport(integrated_lufs=-23.0, true_peak_db=-5.0, lra=5.0)
        findings = aq.check_loudness(r)
        codes = [f.code for f in findings]
        assert "A-LUFS-OUT-OF-SPEC" in codes
        # Message should say "quiet" not "loud"
        lufs_finding = next(f for f in findings if f.code == "A-LUFS-OUT-OF-SPEC")
        assert "quiet" in lufs_finding.msg

    def test_too_loud_warns(self):
        r = aq.LoudnessReport(integrated_lufs=-9.0, true_peak_db=-3.0, lra=5.0)
        findings = aq.check_loudness(r)
        lufs_finding = next(f for f in findings if f.code == "A-LUFS-OUT-OF-SPEC")
        assert "loud" in lufs_finding.msg

    def test_true_peak_above_minus_1_warns(self):
        r = aq.LoudnessReport(integrated_lufs=-14.0, true_peak_db=-0.5, lra=5.0)
        findings = aq.check_loudness(r)
        peak = next(f for f in findings if f.code == "A-TRUE-PEAK-OVER")
        assert peak.level == "warn"

    def test_true_peak_above_zero_is_error(self):
        r = aq.LoudnessReport(integrated_lufs=-14.0, true_peak_db=0.2, lra=5.0)
        findings = aq.check_loudness(r)
        peak = next(f for f in findings if f.code == "A-TRUE-PEAK-OVER")
        assert peak.level == "error"

    def test_missing_loudness_warns(self):
        findings = aq.check_loudness(None)
        assert any(f.code == "A-LUFS-UNKNOWN" for f in findings)


# ── check_format ─────────────────────────────────────────────────────────────


class TestCheckFormat:
    @staticmethod
    def _probe(**overrides) -> aq.ProbeReport:
        defaults = dict(
            duration_sec=600.0, sample_rate=48000, channels=1,
            codec="pcm_s24le", bit_depth=24,
        )
        defaults.update(overrides)
        return aq.ProbeReport(**defaults)

    def test_clean_probe_no_findings(self):
        assert aq.check_format(self._probe()) == []

    def test_stereo_audio_warns(self):
        findings = aq.check_format(self._probe(channels=2))
        assert any(f.code == "A-CHANNELS" for f in findings)

    def test_44100_acceptable_with_warning(self):
        findings = aq.check_format(self._probe(sample_rate=44100))
        codes = [f.code for f in findings]
        assert "A-SAMPLE-RATE-SECONDARY" in codes
        # Should not be an error.
        assert all(f.level != "error" for f in findings)

    def test_22050_is_error(self):
        findings = aq.check_format(self._probe(sample_rate=22050))
        sr = next(f for f in findings if f.code == "A-SAMPLE-RATE")
        assert sr.level == "error"

    def test_mp3_codec_warns(self):
        findings = aq.check_format(self._probe(codec="mp3"))
        assert any(f.code == "A-CODEC-LOSSY" for f in findings)

    def test_short_duration_errors(self):
        findings = aq.check_format(self._probe(duration_sec=2.0))
        dur = next(f for f in findings if f.code == "A-DURATION-TOO-SHORT")
        assert dur.level == "error"


# ── check_silences ───────────────────────────────────────────────────────────


class TestCheckSilences:
    def test_no_long_silences_no_findings(self):
        # All silences shorter than threshold
        events = [aq.SilenceEvent(start_sec=1.0, end_sec=2.0, duration_sec=1.0)]
        assert aq.check_silences(events, threshold_sec=2.5) == []

    def test_long_silence_surfaces_warning(self):
        events = [aq.SilenceEvent(start_sec=5.0, end_sec=8.0, duration_sec=3.0)]
        findings = aq.check_silences(events, threshold_sec=2.5)
        assert len(findings) == 1
        assert findings[0].code == "A-SILENCE-LONG"
        # Should mention the timestamp.
        assert "0:05.0" in findings[0].msg

    def test_caps_summary_to_five_worst(self):
        events = [
            aq.SilenceEvent(start_sec=float(i), end_sec=float(i) + 10, duration_sec=float(i) + 3)
            for i in range(20)
        ]
        findings = aq.check_silences(events, threshold_sec=2.5)
        # Worst 5 listed; total count in the summary line.
        assert "20 silence gap(s)" in findings[0].msg
        # 5 bullet lines in the worst list.
        assert findings[0].msg.count("•") == 5


# ── render_report_md ─────────────────────────────────────────────────────────


class TestRenderReportMd:
    def _make_report(self, **overrides) -> aq.AuditReport:
        probe = aq.ProbeReport(
            duration_sec=600.0, sample_rate=48000, channels=1, codec="pcm_s24le", bit_depth=24,
        )
        loud = aq.LoudnessReport(integrated_lufs=-14.2, true_peak_db=-2.0, lra=5.0)
        report = aq.AuditReport(
            wav_path=Path("/tmp/narration.wav"), probe=probe, loudness=loud,
        )
        for k, v in overrides.items():
            setattr(report, k, v)
        return report

    def test_clean_report_says_so(self):
        out = aq.render_report_md(self._make_report())
        assert "No findings" in out

    def test_finding_renders_with_icon_and_fix(self):
        report = self._make_report()
        report.findings.append(aq.Finding(
            level="warn", code="X-TEST", msg="example warning", fix="run this thing",
        ))
        out = aq.render_report_md(report)
        assert "🟡" in out
        assert "X-TEST" in out
        assert "run this thing" in out

    def test_duration_displayed_human_readable(self):
        out = aq.render_report_md(self._make_report())
        # 600 seconds = 10 minutes; should appear as "10:00.0".
        assert "10:00.0" in out


# ── Integration: real ffmpeg with synthesized WAVs ───────────────────────────


@pytest.mark.skipif(not HAS_FFMPEG, reason="ffmpeg/ffprobe not on PATH")
class TestIntegration:
    """End-to-end with real ffmpeg. Synthesizes a small WAV with known
    properties via ffmpeg's anullsrc + aevalsrc generators so we can
    assert against measured values."""

    @staticmethod
    def _make_wav(out_path: Path, duration_sec: float = 15.0,
                  sample_rate: int = 48000, channels: int = 1,
                  freq: int = 440) -> None:
        """Generate a sine-wave WAV at the given specs."""
        subprocess.run(
            [
                "ffmpeg", "-y", "-loglevel", "error",
                "-f", "lavfi",
                "-i", f"sine=frequency={freq}:duration={duration_sec}:"
                       f"sample_rate={sample_rate}",
                "-ac", str(channels),
                "-ar", str(sample_rate),
                "-c:a", "pcm_s16le",
                str(out_path),
            ],
            check=True,
        )

    def test_probe_returns_expected_specs(self, tmp_path):
        wav = tmp_path / "test.wav"
        self._make_wav(wav, duration_sec=12.5, sample_rate=48000, channels=1)
        probe = aq.probe_audio(wav)
        assert probe.sample_rate == 48000
        assert probe.channels == 1
        assert probe.codec.startswith("pcm_")
        assert 12.0 <= probe.duration_sec <= 13.0

    def test_measure_loudness_returns_report(self, tmp_path):
        wav = tmp_path / "test.wav"
        self._make_wav(wav)
        report = aq.measure_loudness(wav)
        assert report is not None
        # Don't assert exact values — ffmpeg sine output level varies
        # by build/version; just check we got sane floats in plausible
        # ranges and not NaN/inf.
        assert -80 < report.integrated_lufs < 0
        assert -80 < report.true_peak_db < 6  # peak ≤ +6 dBTP would be insane

    def test_silencedetect_finds_nothing_in_continuous_tone(self, tmp_path):
        wav = tmp_path / "tone.wav"
        self._make_wav(wav)  # continuous sine = no silence
        events = aq.detect_silences(wav, min_duration_sec=1.0)
        assert events == []

    def test_full_audit_runs_end_to_end(self, tmp_path):
        wav = tmp_path / "narration-mock.wav"
        self._make_wav(wav, duration_sec=15.0)
        report = aq.audit_audio(wav)
        # Probe checks should be clean (48k mono PCM).
        format_codes = [f.code for f in report.findings if f.code.startswith("A-CHANNELS")
                                                        or f.code.startswith("A-SAMPLE-RATE")
                                                        or f.code.startswith("A-CODEC")]
        assert format_codes == [], f"unexpected format findings: {format_codes}"

    def test_stereo_input_flags_channel_warning(self, tmp_path):
        wav = tmp_path / "stereo.wav"
        self._make_wav(wav, channels=2)
        report = aq.audit_audio(wav)
        codes = [f.code for f in report.findings]
        assert "A-CHANNELS" in codes

    def test_cli_smoke_returns_zero_on_clean(self, tmp_path):
        wav = tmp_path / "narration.wav"
        self._make_wav(wav, duration_sec=15.0)
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "audio_qa.py"),
                "--wav", str(wav),
                "--stdout",
            ],
            capture_output=True, text=True,
        )
        # A clean 15s sine should pass everything except possibly LUFS
        # (sine is much louder than -14 LUFS). So exit code may be 0 OR
        # 1 (warnings under --strict not set). Just check it ran.
        assert result.returncode in (0, 1)
        assert "Audio QA" in result.stdout

    def test_cli_smoke_missing_wav_exits_2(self, tmp_path):
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "audio_qa.py"),
                "--wav", str(tmp_path / "no-such-file.wav"),
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "not found" in result.stderr


# ── New: RMS envelope parsing ──────────────────────────────────────────────


class TestParseAstatsEnvelope:
    def test_empty_input_returns_empty(self):
        env = aq.parse_astats_envelope("")
        assert env.samples_dbfs == []

    def test_skips_inf_nan_readings(self):
        # Frames that are silent produce -inf RMS — must be filtered
        text = (
            "pts_time:0.5\nRMS level dB: -inf\n"
            "pts_time:1.5\nRMS level dB: -23.4\n"
            "pts_time:2.5\nRMS level dB: nan\n"
        )
        env = aq.parse_astats_envelope(text, window_sec=5.0)
        # Only the -23.4 reading survives the inf/nan filter; falls in bin 0
        assert env.samples_dbfs == [-23.4]

    def test_bins_by_window(self):
        # Two frames in bin 0 (pts < 5), one in bin 1 (pts ≥ 5)
        text = (
            "pts_time:1.0\nRMS level dB: -20.0\n"
            "pts_time:3.0\nRMS level dB: -22.0\n"
            "pts_time:7.0\nRMS level dB: -18.0\n"
        )
        env = aq.parse_astats_envelope(text, window_sec=5.0)
        assert len(env.samples_dbfs) == 2
        assert env.samples_dbfs[0] == pytest.approx(-21.0)
        assert env.samples_dbfs[1] == pytest.approx(-18.0)


# ── New: noise-floor parser ────────────────────────────────────────────────


class TestParseVolumedetect:
    def test_basic_extraction(self):
        text = "[Parsed_volumedetect_0] mean_volume: -52.3 dB\n"
        assert aq.parse_volumedetect_mean_dbfs(text) == -52.3

    def test_no_match_returns_none(self):
        assert aq.parse_volumedetect_mean_dbfs("nothing here") is None


# ── New: check_rms_envelope ────────────────────────────────────────────────


class TestCheckRmsEnvelope:
    def test_consistent_take_ok(self):
        env = aq.RmsEnvelope(window_sec=5.0, samples_dbfs=[-20.0, -20.5, -20.1, -19.8])
        findings = aq.check_rms_envelope(env)
        assert len(findings) == 1
        assert findings[0].level == "ok"

    def test_drift_warns(self):
        # std-dev of [-20,-10,-25,-15] ≈ 6.45 — between WARN (6) and ERROR (10)
        env = aq.RmsEnvelope(window_sec=5.0, samples_dbfs=[-20.0, -10.0, -25.0, -15.0])
        findings = aq.check_rms_envelope(env)
        assert findings[0].level == "warn"
        assert findings[0].code == "A-RMS-DRIFT"

    def test_material_drift_errors(self):
        env = aq.RmsEnvelope(window_sec=5.0, samples_dbfs=[-30.0, -10.0, -5.0, -35.0])
        findings = aq.check_rms_envelope(env)
        assert findings[0].level == "error"
        assert "MATERIAL" in findings[0].code

    def test_none_envelope_no_findings(self):
        assert aq.check_rms_envelope(None) == []

    def test_single_sample_no_findings(self):
        env = aq.RmsEnvelope(window_sec=5.0, samples_dbfs=[-20.0])
        assert aq.check_rms_envelope(env) == []


# ── New: check_noise_floor ─────────────────────────────────────────────────


class TestCheckNoiseFloor:
    def test_quiet_room_ok(self):
        nf = aq.NoiseFloor(rms_dbfs=-58.0, silence_seconds_measured=5.0)
        findings = aq.check_noise_floor(nf)
        assert findings[0].level == "ok"

    def test_noisy_warns(self):
        nf = aq.NoiseFloor(rms_dbfs=-40.0, silence_seconds_measured=5.0)
        findings = aq.check_noise_floor(nf)
        assert findings[0].level == "warn"
        assert "NOISY" in findings[0].code

    def test_unsalvageable_errors(self):
        nf = aq.NoiseFloor(rms_dbfs=-30.0, silence_seconds_measured=5.0)
        findings = aq.check_noise_floor(nf)
        assert findings[0].level == "error"
        assert "LOUD" in findings[0].code

    def test_none_floor_no_findings(self):
        assert aq.check_noise_floor(None) == []


# ── New: auphonic_ready composite ──────────────────────────────────────────


class TestAuphonicReady:
    def _make_report(self, findings=None):
        probe = aq.ProbeReport(
            duration_sec=60.0, sample_rate=48000, channels=1,
            codec="pcm_s24le", bit_depth=24,
        )
        return aq.AuditReport(
            wav_path=Path("/tmp/x.wav"), probe=probe,
            loudness=aq.LoudnessReport(
                integrated_lufs=-14.5, true_peak_db=-1.5, lra=8.0,
            ),
            findings=findings or [],
        )

    def test_clean_report_is_ready(self):
        assert self._make_report().auphonic_ready is True

    def test_errors_block_ready(self):
        report = self._make_report([
            aq.Finding(level="error", code="A-DURATION-TOO-SHORT", msg="x"),
        ])
        assert report.auphonic_ready is False

    def test_channel_warning_blocks_ready(self):
        report = self._make_report([
            aq.Finding(level="warn", code="A-CHANNELS", msg="stereo"),
        ])
        assert report.auphonic_ready is False

    def test_rms_drift_warning_blocks_ready(self):
        report = self._make_report([
            aq.Finding(level="warn", code="A-RMS-DRIFT", msg="drift"),
        ])
        assert report.auphonic_ready is False

    def test_noisy_floor_warning_blocks_ready(self):
        report = self._make_report([
            aq.Finding(level="warn", code="A-NOISE-FLOOR-NOISY", msg="noisy"),
        ])
        assert report.auphonic_ready is False

    def test_silence_warning_does_not_block(self):
        report = self._make_report([
            aq.Finding(level="warn", code="A-SILENCE-LONG", msg="5s gap"),
        ])
        assert report.auphonic_ready is True

    def test_lufs_warning_does_not_block(self):
        report = self._make_report([
            aq.Finding(level="warn", code="A-LUFS-OUT-OF-SPEC", msg="too quiet"),
        ])
        assert report.auphonic_ready is True


# ── New: render includes Auphonic-ready banner ─────────────────────────────


class TestRenderAuphonicReady:
    def _make_report(self, ready=True):
        probe = aq.ProbeReport(
            duration_sec=60.0, sample_rate=48000, channels=1,
            codec="pcm_s24le", bit_depth=24,
        )
        loud = aq.LoudnessReport(integrated_lufs=-14.5, true_peak_db=-1.5, lra=8.0)
        findings = []
        if not ready:
            findings.append(aq.Finding(
                level="error", code="A-DURATION-TOO-SHORT", msg="too short",
            ))
        return aq.AuditReport(
            wav_path=Path("/tmp/x.wav"), probe=probe, loudness=loud,
            findings=findings,
        )

    def test_ready_banner_in_render(self):
        out = aq.render_report_md(self._make_report(ready=True))
        assert "Auphonic-ready" in out
        assert "READY FOR MASTERING" in out

    def test_not_ready_banner_in_render(self):
        out = aq.render_report_md(self._make_report(ready=False))
        assert "FIX BEFORE MASTERING" in out


# ── New: skip-flag plumbing ────────────────────────────────────────────────


class TestSkipFlagsActuallySkip:
    """Verify --no-envelope / --no-noise-floor actually skip work, so
    a regression doesn't silently keep running the slow ffmpeg passes."""

    def test_audit_skips_envelope_when_disabled(self, monkeypatch, tmp_path):
        # Stub out the slow measurements so we don't need ffmpeg
        monkeypatch.setattr(aq, "probe_audio", lambda p: aq.ProbeReport(
            duration_sec=60.0, sample_rate=48000, channels=1,
            codec="pcm_s24le", bit_depth=24,
        ))
        monkeypatch.setattr(aq, "measure_loudness", lambda p: aq.LoudnessReport(
            integrated_lufs=-16.0, true_peak_db=-2.0, lra=8.0,
        ))
        monkeypatch.setattr(aq, "detect_silences", lambda *a, **kw: [])

        env_called = {"n": 0}
        def fake_env(*a, **kw):
            env_called["n"] += 1
            return aq.RmsEnvelope(window_sec=5.0, samples_dbfs=[-20.0, -20.0])
        monkeypatch.setattr(aq, "measure_rms_envelope", fake_env)

        # With measure_envelope=False, fake_env must NOT be called
        report = aq.audit_audio(
            tmp_path / "x.wav", measure_envelope=False, measure_floor=False,
        )
        assert env_called["n"] == 0
        assert report.rms_envelope is None

    def test_audit_skips_noise_floor_when_disabled(self, monkeypatch, tmp_path):
        monkeypatch.setattr(aq, "probe_audio", lambda p: aq.ProbeReport(
            duration_sec=60.0, sample_rate=48000, channels=1,
            codec="pcm_s24le", bit_depth=24,
        ))
        monkeypatch.setattr(aq, "measure_loudness", lambda p: None)
        monkeypatch.setattr(aq, "detect_silences", lambda *a, **kw: [])

        floor_called = {"n": 0}
        def fake_floor(*a, **kw):
            floor_called["n"] += 1
            return None
        monkeypatch.setattr(aq, "measure_noise_floor", fake_floor)

        report = aq.audit_audio(
            tmp_path / "x.wav", measure_envelope=False, measure_floor=False,
        )
        assert floor_called["n"] == 0
        assert report.noise_floor is None

    def test_audit_runs_envelope_when_enabled(self, monkeypatch, tmp_path):
        # Symmetric: when enabled, the function IS called
        monkeypatch.setattr(aq, "probe_audio", lambda p: aq.ProbeReport(
            duration_sec=60.0, sample_rate=48000, channels=1,
            codec="pcm_s24le", bit_depth=24,
        ))
        monkeypatch.setattr(aq, "measure_loudness", lambda p: None)
        monkeypatch.setattr(aq, "detect_silences", lambda *a, **kw: [])

        env_called = {"n": 0}
        def fake_env(*a, **kw):
            env_called["n"] += 1
            return aq.RmsEnvelope(window_sec=5.0, samples_dbfs=[-20.0, -20.0])
        monkeypatch.setattr(aq, "measure_rms_envelope", fake_env)

        aq.audit_audio(
            tmp_path / "x.wav", measure_envelope=True, measure_floor=False,
        )
        assert env_called["n"] == 1


# ── New: integration with new fields ───────────────────────────────────────


class TestAuditIntegrationNewFields:
    """Smoke that audit_audio composes the new fields into the report."""

    def test_report_carries_envelope_and_floor_when_measured(self, monkeypatch, tmp_path):
        monkeypatch.setattr(aq, "probe_audio", lambda p: aq.ProbeReport(
            duration_sec=60.0, sample_rate=48000, channels=1,
            codec="pcm_s24le", bit_depth=24,
        ))
        monkeypatch.setattr(aq, "measure_loudness", lambda p: aq.LoudnessReport(
            integrated_lufs=-14.5, true_peak_db=-1.5, lra=7.0,
        ))
        monkeypatch.setattr(aq, "detect_silences", lambda *a, **kw: [
            aq.SilenceEvent(start_sec=10.0, end_sec=12.0, duration_sec=2.0),
        ])
        monkeypatch.setattr(aq, "measure_rms_envelope", lambda *a, **kw: aq.RmsEnvelope(
            window_sec=5.0, samples_dbfs=[-20.0, -20.5, -19.8],
        ))
        monkeypatch.setattr(aq, "measure_noise_floor", lambda *a, **kw: aq.NoiseFloor(
            rms_dbfs=-58.0, silence_seconds_measured=2.0,
        ))
        report = aq.audit_audio(tmp_path / "x.wav")
        assert report.rms_envelope is not None
        assert report.noise_floor is not None
        # New findings should land in the report
        finding_codes = {f.code for f in report.findings}
        assert "A-RMS-DRIFT" in finding_codes
        assert "A-NOISE-FLOOR" in finding_codes
        # Auphonic-ready since everything is clean
        assert report.auphonic_ready is True
