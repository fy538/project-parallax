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
import datetime
import json
import re
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

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
    bit_depth: Optional[int] = None  # PCM only


@dataclass
class LoudnessReport:
    """Parsed loudnorm-filter measurement output."""

    integrated_lufs: float
    true_peak_db: float
    lra: float


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
    loudness: Optional[LoudnessReport]
    silences: list[SilenceEvent] = field(default_factory=list)
    findings: list[Finding] = field(default_factory=list)

    @property
    def errors(self) -> list[Finding]:
        return [f for f in self.findings if f.level == "error"]

    @property
    def warnings(self) -> list[Finding]:
        return [f for f in self.findings if f.level == "warn"]


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


# ffmpeg writes its measurement output to stderr. The loudnorm JSON block
# starts with `{` at the start of a line and is the last JSON in the stream.
# Use a non-greedy capture so we don't accidentally grab earlier `{}` from
# log lines.
LOUDNORM_JSON_RE = re.compile(r"\{\s*\"input_i\"\s*:.*?\}", re.DOTALL)


def parse_loudnorm_output(stderr: str) -> Optional[LoudnessReport]:
    """Extract integrated LUFS + true peak from the loudnorm stderr blob.

    Pure-function — takes the stderr text, returns parsed report or None
    if the JSON block isn't present (e.g. the filter failed). Splitting
    this out makes unit-testing the parser trivial without spawning ffmpeg.
    """
    m = LOUDNORM_JSON_RE.search(stderr)
    if not m:
        return None
    try:
        data = json.loads(m.group(0))
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


def measure_loudness(wav_path: Path) -> Optional[LoudnessReport]:
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
    pending_start: Optional[float] = None
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


# ── Check functions: one per finding category ────────────────────────────────
# Each takes the relevant data and returns 0 or more Findings. Splitting
# checks out makes each one unit-testable without spawning ffmpeg.


def check_loudness(loud: Optional[LoudnessReport]) -> list[Finding]:
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
            f"or relax the threshold with `--silence-min` if these are deliberate pauses.",
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
) -> AuditReport:
    """Probe + measure + detect silences + run all checks. Returns full report."""
    probe = probe_audio(wav_path)
    loud = measure_loudness(wav_path)
    silences = detect_silences(wav_path, min_duration_sec=silence_min_sec)

    report = AuditReport(
        wav_path=wav_path, probe=probe, loudness=loud, silences=silences,
    )
    report.findings.extend(check_format(probe))
    report.findings.extend(check_loudness(loud))
    report.findings.extend(check_silences(silences, silence_min_sec))
    return report


# ── Rendering ────────────────────────────────────────────────────────────────

ICONS = {"error": "🔴", "warn": "🟡", "ok": "🟢"}


def render_report_md(report: AuditReport) -> str:
    today = datetime.date.today().isoformat()
    duration_str = _fmt_timestamp(report.probe.duration_sec)
    lines: list[str] = [
        f"# Audio QA — {report.wav_path.name}",
        f"> Auto-generated {today} by `tools/narration/audio_qa.py`.",
        f"> **Do not edit by hand.** Re-run after each pickup or mastering pass.",
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
    lines.append(
        f"_Re-run: `python3 tools/narration/audio_qa.py "
        f"{report.wav_path.stem.replace('-narration', '') if 'narration' in report.wav_path.stem else 'SLUG'}`_"
    )
    return "\n".join(lines) + "\n"


# ── CLI ──────────────────────────────────────────────────────────────────────


def _resolve_wav(slug: Optional[str], wav_arg: Optional[str]) -> Path:
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

    report = audit_audio(wav_path, silence_min_sec=args.silence_min)
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
