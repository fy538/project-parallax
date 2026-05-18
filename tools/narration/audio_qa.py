#!/usr/bin/env python3
"""
audio_qa.py — pre-render QA for a narration WAV file.

Runs ffmpeg/ffprobe in measurement mode, parses the output, and produces
a `_audio-qa.md` health-check report. Designed as the narration-stage
sibling of `polish_lint.py` and `pipeline_validator.py`: surface what's
wrong with structured findings + exact-command fixes, before any of it
locks into the rendered master.

Checks performed:
  · Integrated loudness vs. YouTube target (-14 LUFS ±1.0)
  · True peak vs. ceiling (-1.0 dBTP — anything higher will inter-sample-clip)
  · Channels (must be mono = 1)
  · Sample rate (target 48000 Hz; 44100 Hz also acceptable with a warning)
  · Container format (must be PCM; MP3 = lossy = warning)
  · Silence gaps longer than --silence-min seconds (default 2.5s)
  · Total duration (sanity check: aborts if < 10s — almost certainly wrong file)

Usage:
    python3 tools/narration/audio_qa.py <slug>
    python3 tools/narration/audio_qa.py <slug> --wav <path>
    python3 tools/narration/audio_qa.py <slug> --stdout
    python3 tools/narration/audio_qa.py <slug> --strict
        # exit 1 on warnings too (default: only errors fail)

Default WAV resolution: `episodes/<slug>/assets/narration.wav` (matches
the path the assembly manifest expects). Override with --wav for pickup
takes or mastered alternates.

Exit codes:
    0 — clean (or --strict not set and only warnings)
    1 — errors found (or --strict with any findings)
    2 — ffmpeg not on PATH / WAV missing / wrong file format
"""

from __future__ import annotations

import argparse
import contextlib
import datetime
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"

# ── Targets (YouTube spec + studio-narration defaults) ──────────────────────

TARGET_LUFS = -14.0          # YouTube's normalization target
LUFS_TOLERANCE = 1.0         # ±1 LUFS counts as on-target
TARGET_TRUE_PEAK_DB = -1.0   # broadcast safe ceiling
TARGET_SAMPLE_RATE = 48000   # studio standard; 44100 acceptable
TARGET_CHANNELS = 1          # mono narration
SILENCE_THRESHOLD_DB = -50.0 # below this counts as silence
DEFAULT_SILENCE_MIN_SEC = 2.5  # gaps longer than this surface as warnings
MIN_DURATION_SEC = 10.0      # below this almost certainly the wrong file

# Acceptable secondary sample rate (warn but don't error).
SECONDARY_SAMPLE_RATE = 44100

# Noise-floor doctrine — measured during detected silence regions, not
# the active narration. A clean home-studio with treatment lands -60 to
# -55 dBFS; an untreated room with HVAC or computer fans lands -50 to
# -40 dBFS. > -45 dBFS is "noisy enough to be audible in pauses" and
# warrants either treatment, a noise gate in mastering, or re-recording.
TARGET_NOISE_FLOOR_DBFS = -55.0       # full score at or below
NOISE_FLOOR_WARN_DBFS = -45.0         # above this surfaces a warn
NOISE_FLOOR_ERROR_DBFS = -35.0        # above this surfaces an error

# RMS envelope doctrine — how much the loudness wanders over the take.
# A consistent take has std-dev under 3 dB across rolling 5s windows.
# > 6 dB suggests mic drift, room change, or significant pace/energy
# variation. Auphonic can normalize most of this but won't fix a take
# where the first half is -22 LUFS and the second half is -14 LUFS.
RMS_WINDOW_SEC = 5.0
RMS_STD_WARN_DB = 6.0
RMS_STD_ERROR_DB = 10.0


@dataclass
class SilenceEvent:
    """One silence gap detected by ffmpeg's silencedetect filter."""

    start_sec: float
    end_sec: float
    duration_sec: float


@dataclass
class ProbeReport:
    """Output of `ffprobe -of json`: container + stream metadata."""

    duration_sec: float
    sample_rate: int
    channels: int
    codec: str
    bit_depth: int | None = None  # PCM only


@dataclass
class LoudnessReport:
    """Parsed loudnorm-filter measurement output."""

    integrated_lufs: float
    true_peak_db: float
    lra: float


@dataclass
class RmsEnvelope:
    """Sliding-window RMS measurements over the take. `samples` is one
    dB value per RMS_WINDOW_SEC window."""

    window_sec: float
    samples_dbfs: list[float] = field(default_factory=list)

    @property
    def mean_dbfs(self) -> float:
        if not self.samples_dbfs:
            return 0.0
        return sum(self.samples_dbfs) / len(self.samples_dbfs)

    @property
    def std_dbfs(self) -> float:
        if len(self.samples_dbfs) < 2:
            return 0.0
        import statistics
        return statistics.stdev(self.samples_dbfs)


@dataclass
class NoiseFloor:
    """RMS dBFS measured during detected silence regions (the actual
    room-tone, not just gap detection)."""

    rms_dbfs: float
    silence_seconds_measured: float


@dataclass
class Finding:
    level: str   # "error" | "warn" | "ok"
    code: str    # short identifier for the check (e.g. "L-LUFS-OUT-OF-SPEC")
    msg: str
    fix: str = ""


@dataclass
class AuditReport:
    wav_path: Path
    probe: ProbeReport
    loudness: LoudnessReport | None
    silences: list[SilenceEvent] = field(default_factory=list)
    rms_envelope: RmsEnvelope | None = None
    noise_floor: NoiseFloor | None = None
    findings: list[Finding] = field(default_factory=list)

    @property
    def errors(self) -> list[Finding]:
        return [f for f in self.findings if f.level == "error"]

    @property
    def warnings(self) -> list[Finding]:
        return [f for f in self.findings if f.level == "warn"]

    @property
    def auphonic_ready(self) -> bool:
        """Composite go/no-go: no errors AND key warnings absent.
        Auphonic can normalize loudness + reduce noise + de-ess, but it
        can't fix wrong-file-format, clipped peaks, or a take with
        material loudness drift across its duration. Those need to be
        addressed before submission."""
        if self.errors:
            return False
        # Block warnings that Auphonic can't safely paper over
        blockers = {
            "A-CHANNELS",            # wrong mono/stereo — re-export first
            "A-CODEC-LOSSY",         # lossy source = re-export first
            "A-RMS-DRIFT",           # loudness wanders across the take
            "A-NOISE-FLOOR-NOISY",   # noise floor too high to clean up
        }
        return not any(f.code in blockers for f in self.warnings)


# ── ffmpeg / ffprobe wrappers ───────────────────────────────────────────────


def _ensure_ffmpeg() -> None:
    """Abort with code 2 if ffmpeg/ffprobe isn't on PATH."""
    if shutil.which("ffmpeg") is None or shutil.which("ffprobe") is None:
        print(
            "✗ ffmpeg/ffprobe not on PATH — install with:\n"
            "    brew install ffmpeg   # macOS\n"
            "    apt install ffmpeg    # Ubuntu",
            file=sys.stderr,
        )
        sys.exit(2)


def probe_audio(wav_path: Path) -> ProbeReport:
    """Run ffprobe + parse stream metadata."""
    result = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_streams", "-select_streams", "a:0",
            "-show_format",
            "-of", "json",
            str(wav_path),
        ],
        capture_output=True, text=True, check=True,
    )
    data = json.loads(result.stdout)
    streams = data.get("streams", [])
    if not streams:
        raise RuntimeError(f"No audio streams in {wav_path}")
    s = streams[0]
    fmt = data.get("format", {})
    duration_sec = float(s.get("duration") or fmt.get("duration") or 0)
    return ProbeReport(
        duration_sec=duration_sec,
        sample_rate=int(s.get("sample_rate", 0)),
        channels=int(s.get("channels", 0)),
        codec=s.get("codec_name", "unknown"),
        bit_depth=(int(s["bits_per_sample"]) if "bits_per_sample" in s and s["bits_per_sample"] else None),
    )


# Anchor for the loudnorm JSON block. ffmpeg writes its measurement output
# to stderr as a JSON object that starts somewhere after the Parsed_loudnorm
# marker line. We locate the first opening brace on or after that marker
# and walk forward counting brace depth to extract the balanced JSON —
# robust to (a) future key-order changes (the old regex assumed `input_i`
# was the first key), (b) extra log lines interleaved with the JSON, and
# (c) hypothetical nested object values.
_LOUDNORM_MARKER_RE = re.compile(r"Parsed_loudnorm", re.IGNORECASE)


def _extract_balanced_json(text: str, start: int) -> str | None:
    """Starting at the first `{` at or after `start`, walk forward and
    return the balanced JSON substring (or None if no balance found)."""
    open_pos = text.find("{", start)
    if open_pos < 0:
        return None
    depth = 0
    in_string = False
    escaped = False
    for i in range(open_pos, len(text)):
        ch = text[i]
        if in_string:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == '"':
                in_string = False
            continue
        if ch == '"':
            in_string = True
        elif ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[open_pos:i + 1]
    return None


def parse_loudnorm_output(stderr: str) -> LoudnessReport | None:
    """Extract integrated LUFS + true peak from the loudnorm stderr blob.

    Pure-function — takes the stderr text, returns parsed report or None
    if the JSON block isn't present (e.g. the filter failed). Splitting
    this out makes unit-testing the parser trivial without spawning ffmpeg.

    Two-step extraction: find the Parsed_loudnorm marker (if present),
    walk forward to the next `{`, balance braces. Falls back to scanning
    from position 0 if no marker is present — handles stderr blobs from
    older ffmpeg versions or piped subsets.
    """
    m = _LOUDNORM_MARKER_RE.search(stderr)
    start = m.end() if m else 0
    block = _extract_balanced_json(stderr, start)
    if block is None:
        return None
    try:
        data = json.loads(block)
    except json.JSONDecodeError:
        return None
    try:
        return LoudnessReport(
            integrated_lufs=float(data["input_i"]),
            true_peak_db=float(data["input_tp"]),
            lra=float(data["input_lra"]),
        )
    except (KeyError, ValueError):
        return None


def measure_loudness(wav_path: Path) -> LoudnessReport | None:
    """Run ffmpeg's loudnorm filter in measurement mode."""
    result = subprocess.run(
        [
            "ffmpeg", "-nostats", "-hide_banner",
            "-i", str(wav_path),
            "-af", "loudnorm=print_format=json",
            "-f", "null", "-",
        ],
        capture_output=True, text=True, check=False,
    )
    return parse_loudnorm_output(result.stderr)


# Silence events come out like:
#   [silencedetect @ 0x...] silence_start: 12.345
#   [silencedetect @ 0x...] silence_end: 14.901 | silence_duration: 2.556
SILENCE_START_RE = re.compile(r"silence_start:\s*([\d.]+)")
SILENCE_END_RE = re.compile(
    r"silence_end:\s*([\d.]+).*?silence_duration:\s*([\d.]+)"
)


def parse_silencedetect_output(stderr: str) -> list[SilenceEvent]:
    """Pair up silence_start + silence_end lines into SilenceEvents.

    Robust to ffmpeg interleaving other log lines between start/end pairs.
    If a trailing silence has no end (stream cut off during silence), it's
    dropped — duration unknown, not worth surfacing.
    """
    events: list[SilenceEvent] = []
    pending_start: float | None = None
    for line in stderr.splitlines():
        sm = SILENCE_START_RE.search(line)
        if sm:
            pending_start = float(sm.group(1))
            continue
        em = SILENCE_END_RE.search(line)
        if em and pending_start is not None:
            end = float(em.group(1))
            dur = float(em.group(2))
            events.append(SilenceEvent(start_sec=pending_start, end_sec=end, duration_sec=dur))
            pending_start = None
    return events


def detect_silences(
    wav_path: Path,
    threshold_db: float = SILENCE_THRESHOLD_DB,
    min_duration_sec: float = DEFAULT_SILENCE_MIN_SEC,
) -> list[SilenceEvent]:
    """Run ffmpeg's silencedetect filter."""
    result = subprocess.run(
        [
            "ffmpeg", "-nostats", "-hide_banner",
            "-i", str(wav_path),
            "-af", f"silencedetect=n={threshold_db}dB:d={min_duration_sec}",
            "-f", "null", "-",
        ],
        capture_output=True, text=True, check=False,
    )
    return parse_silencedetect_output(result.stderr)


# ── RMS envelope (loudness drift over time) ─────────────────────────────────

# Each frame from `astats` reports its own RMS_level in dB on its own line.
# Pattern: `[Parsed_astats_*] RMS level dB: -23.456` (after enabling the
# `metadata=1` option). We split into windows of RMS_WINDOW_SEC and take
# the mean RMS within each window.
_ASTATS_RMS_RE = re.compile(r"RMS level dB:\s*(-?\d+\.\d+|nan|inf|-inf)")
_ASTATS_PTS_RE = re.compile(r"pts_time:\s*(-?\d+\.\d+)")


def parse_astats_envelope(stderr: str, window_sec: float = RMS_WINDOW_SEC) -> RmsEnvelope:
    """Parse the per-frame metadata stream from ffmpeg `astats=metadata=1
    :reset=1` and bin into `window_sec` windows. Each window's value is
    the mean RMS dBFS of frames falling inside it.

    Robust to inf/nan readings (silent frames produce -inf RMS) — those
    are skipped from the mean rather than dragging it to -∞.
    """
    bins: dict[int, list[float]] = {}
    current_time = 0.0
    for line in stderr.splitlines():
        pm = _ASTATS_PTS_RE.search(line)
        if pm:
            with contextlib.suppress(ValueError):
                current_time = float(pm.group(1))
            continue
        rm = _ASTATS_RMS_RE.search(line)
        if rm:
            raw = rm.group(1)
            try:
                rms = float(raw)
            except ValueError:
                continue
            # Skip non-finite readings (silent frames)
            if rms != rms or rms in (float("inf"), float("-inf")):
                continue
            idx = int(current_time // window_sec)
            bins.setdefault(idx, []).append(rms)
    if not bins:
        return RmsEnvelope(window_sec=window_sec, samples_dbfs=[])
    # Emit one mean per window, in index order
    max_idx = max(bins)
    samples = [
        sum(bins[i]) / len(bins[i])
        for i in range(max_idx + 1) if i in bins
    ]
    return RmsEnvelope(window_sec=window_sec, samples_dbfs=samples)


def measure_rms_envelope(
    wav_path: Path, window_sec: float = RMS_WINDOW_SEC,
    sample_rate: int | None = None,
) -> RmsEnvelope:
    """Run ffmpeg with the astats filter and parse per-frame RMS into
    windowed bins. Returns RmsEnvelope (empty if measurement failed).

    `sample_rate` is used to size `asetnsamples` (samples per window).
    If not provided, probes the file to read it — previously this was
    hardcoded to 48 kHz, which made 44.1 kHz files report bins that
    were ~9% wider than `window_sec`.
    """
    if sample_rate is None:
        try:
            sample_rate = probe_audio(wav_path).sample_rate or 48000
        except (RuntimeError, subprocess.CalledProcessError):
            sample_rate = 48000
    result = subprocess.run(
        [
            "ffmpeg", "-nostats", "-hide_banner",
            "-i", str(wav_path),
            "-af", f"asetnsamples={int(sample_rate * window_sec)},astats=metadata=1:reset=1",
            "-f", "null", "-",
        ],
        capture_output=True, text=True, check=False,
    )
    return parse_astats_envelope(result.stderr, window_sec=window_sec)


# ── Noise floor (RMS during detected silences) ──────────────────────────────


def parse_volumedetect_mean_dbfs(stderr: str) -> float | None:
    """Extract `mean_volume: -XX.X dB` from ffmpeg volumedetect output."""
    m = re.search(r"mean_volume:\s*(-?\d+(?:\.\d+)?)\s*dB", stderr)
    if not m:
        return None
    try:
        return float(m.group(1))
    except ValueError:
        return None


def measure_noise_floor(
    wav_path: Path, silences: list[SilenceEvent], min_total_sec: float = 1.0,
) -> NoiseFloor | None:
    """Measure RMS dBFS during detected silence regions. Returns None if
    no silences were found (can't measure room tone if there are no
    pauses in the take) or if the total silent duration is too short to
    yield a stable RMS reading.

    Uses ffmpeg's volumedetect filter on a concatenation of silence
    segments cut out via aselect. Conservative: bails on the first
    ffmpeg failure rather than guessing at noise floor from active
    narration.
    """
    if not silences:
        return None
    total = sum(s.duration_sec for s in silences)
    if total < min_total_sec:
        return None

    # Build an aselect filter that keeps only frames whose timestamp
    # falls within one of the detected silence regions. Use the first
    # 60s of cumulative silence (most takes have plenty; cap so we don't
    # spend CPU on enormous files).
    keep_clauses = []
    accumulated = 0.0
    for s in silences:
        if accumulated >= 60.0:
            break
        keep_clauses.append(
            f"between(t,{s.start_sec:.3f},{s.end_sec:.3f})"
        )
        accumulated += s.duration_sec
    if not keep_clauses:
        return None
    aselect_expr = "+".join(keep_clauses)

    result = subprocess.run(
        [
            "ffmpeg", "-nostats", "-hide_banner",
            "-i", str(wav_path),
            "-af", f"aselect='{aselect_expr}',asetpts=N/SR/TB,volumedetect",
            "-f", "null", "-",
        ],
        capture_output=True, text=True, check=False,
    )
    rms = parse_volumedetect_mean_dbfs(result.stderr)
    if rms is None:
        return None
    return NoiseFloor(rms_dbfs=rms, silence_seconds_measured=min(accumulated, 60.0))


# ── Check functions: one per finding category ────────────────────────────────
# Each takes the relevant data and returns 0 or more Findings. Splitting
# checks out makes each one unit-testable without spawning ffmpeg.


def check_loudness(loud: LoudnessReport | None) -> list[Finding]:
    findings: list[Finding] = []
    if loud is None:
        findings.append(Finding(
            level="warn", code="A-LUFS-UNKNOWN",
            msg="Could not measure loudness — ffmpeg loudnorm output missing or unparseable.",
        ))
        return findings
    diff = loud.integrated_lufs - TARGET_LUFS
    if abs(diff) <= LUFS_TOLERANCE:
        findings.append(Finding(
            level="ok", code="A-LUFS",
            msg=f"Integrated loudness {loud.integrated_lufs:.1f} LUFS (target {TARGET_LUFS:.0f} ±{LUFS_TOLERANCE:.0f}).",
        ))
    else:
        direction = "loud" if diff > 0 else "quiet"
        findings.append(Finding(
            level="warn", code="A-LUFS-OUT-OF-SPEC",
            msg=f"Integrated loudness {loud.integrated_lufs:.1f} LUFS — "
                f"too {direction} by {abs(diff):.1f} LUFS vs. YouTube target {TARGET_LUFS:.0f}.",
            fix=f"Auphonic with `-14 LUFS` target, or ffmpeg loudnorm two-pass with I={TARGET_LUFS}.",
        ))
    if loud.true_peak_db > TARGET_TRUE_PEAK_DB:
        # >-1 dBTP risks inter-sample clipping; >0 is hard-clipped.
        level = "error" if loud.true_peak_db >= 0.0 else "warn"
        findings.append(Finding(
            level=level, code="A-TRUE-PEAK-OVER",
            msg=f"True peak {loud.true_peak_db:+.2f} dBTP exceeds ceiling {TARGET_TRUE_PEAK_DB:+.1f} dBTP — "
                f"{'hard-clipped audio' if level == 'error' else 'risks inter-sample clipping'}.",
            fix=f"Apply a brickwall limiter at {TARGET_TRUE_PEAK_DB} dBTP before mastering.",
        ))
    return findings


def check_format(probe: ProbeReport) -> list[Finding]:
    findings: list[Finding] = []
    if probe.channels != TARGET_CHANNELS:
        findings.append(Finding(
            level="warn", code="A-CHANNELS",
            msg=f"{probe.channels}-channel audio — narration should be mono (1 channel).",
            fix="Convert: `ffmpeg -i input.wav -ac 1 narration.wav`",
        ))
    if probe.sample_rate == TARGET_SAMPLE_RATE:
        pass  # ok
    elif probe.sample_rate == SECONDARY_SAMPLE_RATE:
        findings.append(Finding(
            level="warn", code="A-SAMPLE-RATE-SECONDARY",
            msg=f"Sample rate {probe.sample_rate} Hz — 48000 Hz preferred for video work.",
            fix="Re-record at 48 kHz, or resample: `ffmpeg -i input.wav -ar 48000 narration.wav`",
        ))
    elif probe.sample_rate > 0:
        findings.append(Finding(
            level="error", code="A-SAMPLE-RATE",
            msg=f"Sample rate {probe.sample_rate} Hz — not 48000 (preferred) or 44100 (acceptable).",
            fix="Re-record at 48 kHz, or resample: `ffmpeg -i input.wav -ar 48000 narration.wav`",
        ))
    # MP3/AAC = lossy → flag warn so the operator knows it's a re-encode.
    if probe.codec.lower() not in ("pcm_s16le", "pcm_s24le", "pcm_s32le", "pcm_f32le", "flac"):
        findings.append(Finding(
            level="warn", code="A-CODEC-LOSSY",
            msg=f"Codec '{probe.codec}' — lossless PCM/FLAC preferred for masters.",
            fix="Re-export from your DAW as 24-bit PCM WAV.",
        ))
    if probe.duration_sec < MIN_DURATION_SEC:
        findings.append(Finding(
            level="error", code="A-DURATION-TOO-SHORT",
            msg=f"Duration {probe.duration_sec:.1f}s — under {MIN_DURATION_SEC:.0f}s, likely wrong file.",
        ))
    return findings


def check_silences(silences: list[SilenceEvent], threshold_sec: float) -> list[Finding]:
    """Long silences either indicate an unedited pickup region or a
    take that ran out of momentum. Either way the operator should look."""
    findings: list[Finding] = []
    long_silences = [s for s in silences if s.duration_sec > threshold_sec]
    if not long_silences:
        return findings
    # Don't dump 40 silence events into the report; surface the worst few.
    worst = sorted(long_silences, key=lambda s: -s.duration_sec)[:5]
    summary_lines = [
        f"• {_fmt_timestamp(s.start_sec)} — {_fmt_timestamp(s.end_sec)} ({s.duration_sec:.1f}s)"
        for s in worst
    ]
    msg = (
        f"{len(long_silences)} silence gap(s) > {threshold_sec:.1f}s detected. Worst:\n  "
        + "\n  ".join(summary_lines)
    )
    findings.append(Finding(
        level="warn", code="A-SILENCE-LONG",
        msg=msg,
        fix="Edit out the unintended dead air in your DAW; "
            "or relax the threshold with `--silence-min` if these are deliberate pauses.",
    ))
    return findings


def check_rms_envelope(env: RmsEnvelope | None) -> list[Finding]:
    """Flag loudness drift across the take. Auphonic can normalize a
    consistent take but won't fix one where the first half is much
    quieter than the second."""
    findings: list[Finding] = []
    if env is None or len(env.samples_dbfs) < 2:
        return findings
    std = env.std_dbfs
    if std >= RMS_STD_ERROR_DB:
        findings.append(Finding(
            level="error", code="A-RMS-DRIFT-MATERIAL",
            msg=f"RMS std-dev {std:.1f} dB across {env.window_sec:.0f}s windows — "
                f"material loudness drift (≥{RMS_STD_ERROR_DB:.0f} dB). The take's "
                f"loudness wanders too much for clean mastering.",
            fix="Re-record the section where the level changed (often the "
                "mic was bumped or the room HVAC kicked in); OR manually "
                "ride the gain in your DAW before sending to Auphonic.",
        ))
    elif std >= RMS_STD_WARN_DB:
        findings.append(Finding(
            level="warn", code="A-RMS-DRIFT",
            msg=f"RMS std-dev {std:.1f} dB across {env.window_sec:.0f}s windows — "
                f"some loudness drift (≥{RMS_STD_WARN_DB:.0f} dB). Auphonic "
                f"compression will help but won't fully equalize.",
            fix="Inspect the take in your DAW for a quiet region; consider "
                "manual gain ride or a more aggressive compressor setting.",
        ))
    else:
        findings.append(Finding(
            level="ok", code="A-RMS-DRIFT",
            msg=f"RMS std-dev {std:.1f} dB — consistent loudness across the take.",
        ))
    return findings


def check_noise_floor(nf: NoiseFloor | None) -> list[Finding]:
    """Flag a noisy recording environment. > -45 dBFS is audible in
    pauses; > -35 dBFS is unsalvageable without aggressive denoising
    that introduces artifacts."""
    findings: list[Finding] = []
    if nf is None:
        return findings  # no silences detected — can't measure
    if nf.rms_dbfs >= NOISE_FLOOR_ERROR_DBFS:
        findings.append(Finding(
            level="error", code="A-NOISE-FLOOR-LOUD",
            msg=f"Noise floor {nf.rms_dbfs:+.1f} dBFS during silences — "
                f"≥ {NOISE_FLOOR_ERROR_DBFS:.0f} dBFS is too loud to clean up "
                f"without artifacts. Re-record in a quieter environment.",
            fix="Identify the noise source (HVAC / fans / outside traffic) "
                "and either eliminate it or move the recording location. "
                "Software denoise at this floor will degrade speech quality.",
        ))
    elif nf.rms_dbfs >= NOISE_FLOOR_WARN_DBFS:
        findings.append(Finding(
            level="warn", code="A-NOISE-FLOOR-NOISY",
            msg=f"Noise floor {nf.rms_dbfs:+.1f} dBFS during silences — "
                f"audible in pauses (target ≤ {TARGET_NOISE_FLOOR_DBFS:.0f} dBFS). "
                f"Auphonic's noise reduction may help but ideal is to fix "
                f"the source.",
            fix="Apply Auphonic's noise-reduction at medium strength, OR "
                "rerun ffmpeg with anlmdn / afftdn filter before mastering.",
        ))
    else:
        findings.append(Finding(
            level="ok", code="A-NOISE-FLOOR",
            msg=f"Noise floor {nf.rms_dbfs:+.1f} dBFS — quiet recording environment.",
        ))
    return findings


def _fmt_timestamp(seconds: float) -> str:
    """0:12.3 / 1:23.4 / 12:34.5 format. Sub-minute pads to 0:SS.S."""
    minutes = int(seconds // 60)
    remainder = seconds - minutes * 60
    return f"{minutes}:{remainder:04.1f}"


# ── Top-level orchestrator ───────────────────────────────────────────────────


def audit_audio(
    wav_path: Path,
    silence_min_sec: float = DEFAULT_SILENCE_MIN_SEC,
    measure_envelope: bool = True,
    measure_floor: bool = True,
) -> AuditReport:
    """Probe + measure + detect silences + run all checks. Returns full report.

    `measure_envelope` and `measure_floor` toggle the newer, slower
    ffmpeg passes (each runs the file once). Off by default in CI /
    test contexts that want only the cheap pre-flight checks.
    """
    probe = probe_audio(wav_path)
    loud = measure_loudness(wav_path)
    silences = detect_silences(
        wav_path,
        min_duration_sec=min(0.5, silence_min_sec),  # measure noise on shorter silences too
    )
    # Long-silence detection uses the user-facing threshold for the warn finding
    long_silences = [s for s in silences if s.duration_sec >= silence_min_sec]

    envelope: RmsEnvelope | None = None
    if measure_envelope:
        # Pass the already-probed sample_rate so measure_rms_envelope
        # doesn't re-probe (saves one ffprobe invocation).
        envelope = measure_rms_envelope(
            wav_path, sample_rate=probe.sample_rate or None,
        )
    floor: NoiseFloor | None = None
    if measure_floor:
        floor = measure_noise_floor(wav_path, silences)

    report = AuditReport(
        wav_path=wav_path, probe=probe, loudness=loud,
        silences=long_silences, rms_envelope=envelope, noise_floor=floor,
    )
    report.findings.extend(check_format(probe))
    report.findings.extend(check_loudness(loud))
    report.findings.extend(check_silences(long_silences, silence_min_sec))
    report.findings.extend(check_rms_envelope(envelope))
    report.findings.extend(check_noise_floor(floor))
    return report


# ── Rendering ────────────────────────────────────────────────────────────────

ICONS = {"error": "🔴", "warn": "🟡", "ok": "🟢"}


def render_report_md(report: AuditReport) -> str:
    today = datetime.date.today().isoformat()
    duration_str = _fmt_timestamp(report.probe.duration_sec)
    lines: list[str] = [
        f"# Audio QA — {report.wav_path.name}",
        f"> Auto-generated {today} by `tools/narration/audio_qa.py`.",
        "> **Do not edit by hand.** Re-run after each pickup or mastering pass.",
        "",
        f"**File:** `{report.wav_path}`",
        f"**Duration:** {duration_str} ({report.probe.duration_sec:.1f}s) · "
        f"{report.probe.sample_rate} Hz · {report.probe.channels} ch · "
        f"{report.probe.codec}",
        "",
    ]
    if report.loudness:
        lines.append(
            f"**Loudness:** {report.loudness.integrated_lufs:.1f} LUFS integrated · "
            f"{report.loudness.true_peak_db:+.2f} dBTP true peak · "
            f"LRA {report.loudness.lra:.1f}"
        )
        lines.append("")
    if report.rms_envelope and report.rms_envelope.samples_dbfs:
        lines.append(
            f"**RMS envelope:** mean {report.rms_envelope.mean_dbfs:+.1f} dBFS · "
            f"σ {report.rms_envelope.std_dbfs:.1f} dB across "
            f"{report.rms_envelope.window_sec:.0f}s windows "
            f"({len(report.rms_envelope.samples_dbfs)} bins)"
        )
        lines.append("")
    if report.noise_floor is not None:
        lines.append(
            f"**Noise floor:** {report.noise_floor.rms_dbfs:+.1f} dBFS "
            f"(measured over {report.noise_floor.silence_seconds_measured:.1f}s "
            f"of silence)"
        )
        lines.append("")

    # Auphonic-ready composite banner: a single go/no-go signal that the
    # operator can read at a glance before submitting.
    ready_icon = "✓" if report.auphonic_ready else "✗"
    ready_label = "READY FOR MASTERING" if report.auphonic_ready else "FIX BEFORE MASTERING"
    lines.append(f"**Auphonic-ready:** {ready_icon} **{ready_label}**")
    if not report.auphonic_ready:
        lines.append(
            "_Auphonic can normalize loudness + reduce noise + de-ess, but it "
            "can't fix wrong channels / lossy source / hard-clipped peaks / "
            "material loudness drift / extreme noise floors. Address the "
            "blocking findings below before submission._"
        )
    lines.append("")

    lines.append("## Findings")
    lines.append("")
    if not report.findings:
        lines.append("🟢 No findings — audio passes every check.")
        lines.append("")
    else:
        for f in report.findings:
            lines.append(f"{ICONS.get(f.level, '·')} **{f.code}** — {f.msg}")
            if f.fix:
                lines.append(f"   → fix: {f.fix}")
            lines.append("")

    lines.append("## Targets")
    lines.append("")
    lines.append(
        f"`{TARGET_LUFS:.0f} LUFS ±{LUFS_TOLERANCE:.0f}` integrated · "
        f"`{TARGET_TRUE_PEAK_DB:+.1f} dBTP` peak ceiling · "
        f"`{TARGET_SAMPLE_RATE} Hz` · `mono` · `PCM/FLAC`"
    )
    lines.append("")
    lines.append("---")
    lines.append("")
    # Use the literal placeholder — the previous attempt at slug recovery
    # via string surgery on the WAV filename was flaky (the canonical
    # layout has `narration.wav`, not `<slug>-narration.wav`) and almost
    # always fell back to `SLUG` anyway. Better to be honest.
    lines.append(
        "_Re-run: `python3 tools/narration/audio_qa.py <slug>` "
        "(or `--wav <path>` for ad-hoc files)._"
    )
    return "\n".join(lines) + "\n"


# ── CLI ──────────────────────────────────────────────────────────────────────


def _resolve_wav(slug: str | None, wav_arg: str | None) -> Path:
    """Resolve the WAV path from slug + --wav. Either may be set."""
    if wav_arg:
        return Path(wav_arg).resolve()
    if not slug:
        raise SystemExit("✗ provide either a slug or --wav <path>")
    return EPISODES_DIR / slug / "assets" / "narration.wav"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument(
        "slug",
        nargs="?",
        help="Episode slug (looks for episodes/<slug>/assets/narration.wav).",
    )
    parser.add_argument("--wav", help="Explicit WAV path (overrides slug resolution).")
    parser.add_argument(
        "--silence-min",
        type=float,
        default=DEFAULT_SILENCE_MIN_SEC,
        help=f"Min silence gap to flag, in seconds (default: {DEFAULT_SILENCE_MIN_SEC}).",
    )
    parser.add_argument("-o", "--output", help="Output path (default: <wav-dir>/_audio-qa.md).")
    parser.add_argument("--stdout", action="store_true", help="Write to stdout.")
    parser.add_argument(
        "--strict", action="store_true",
        help="Exit 1 on warnings as well as errors.",
    )
    parser.add_argument(
        "--no-envelope", action="store_true",
        help="Skip the RMS envelope measurement (faster; loses drift detection).",
    )
    parser.add_argument(
        "--no-noise-floor", action="store_true",
        help="Skip the noise-floor measurement (faster; loses room-tone signal).",
    )
    args = parser.parse_args()

    _ensure_ffmpeg()

    try:
        wav_path = _resolve_wav(args.slug, args.wav)
    except SystemExit as e:
        print(e, file=sys.stderr)
        return 2

    if not wav_path.is_file():
        print(f"✗ WAV not found: {wav_path}", file=sys.stderr)
        return 2

    report = audit_audio(
        wav_path, silence_min_sec=args.silence_min,
        measure_envelope=not args.no_envelope,
        measure_floor=not args.no_noise_floor,
    )
    rendered = render_report_md(report)

    if args.stdout:
        sys.stdout.write(rendered)
    else:
        out_path = (
            Path(args.output).resolve()
            if args.output
            else wav_path.parent / "_audio-qa.md"
        )
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(rendered, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        print(f"✓ wrote {rel}")
        print(f"  {len(report.errors)} error(s) · {len(report.warnings)} warning(s)")

    if report.errors:
        return 1
    if args.strict and report.warnings:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
