#!/usr/bin/env python3
"""
local_master.py — apply a mastering chain to a narration WAV via ffmpeg
filters. The offline equivalent of `auphonic_submit.py`.

Auphonic is great but requires an API key + internet + an account.
This tool runs the canonical VO-mastering chain locally using only
ffmpeg (already a dependency for `audio_qa.py`), so there's no
external service in the launch-critical path. Output is deterministic,
reproducible, version-controllable.

Three presets:
  · safe       — HPF + loudnorm only. Minimal coloration; for already-
                 clean source material or operators who do their own
                 EQ/compression in a DAW.
  · standard   — HPF + gentle compression + loudnorm. The Auphonic-
                 equivalent. Default.
  · aggressive — HPF + noise gate + harder compression + tighter LRA.
                 For noisy / very dynamic source recordings.

Two-pass loudnorm: measurement pass first, then apply with the
measured values for accurate target loudness (vs. single-pass which
drifts ±1 LUFS in practice).

Usage:
    python3 tools/narration/local_master.py <slug>
    python3 tools/narration/local_master.py <slug> --preset aggressive
    python3 tools/narration/local_master.py <slug> --target-lufs -16
    python3 tools/narration/local_master.py <slug> --wav <path>
    python3 tools/narration/local_master.py <slug> --output <path>
    python3 tools/narration/local_master.py <slug> --no-audio-qa

Default WAV: `episodes/<slug>/assets/narration.wav`
Default output: `episodes/<slug>/assets/narration-mastered.wav` (alongside
the original; the source is never modified)

After mastering, automatically runs `audio_qa.py` on the output to
verify LUFS lands on target. Suppress with --no-audio-qa.

Exit codes:
    0 — mastered file written successfully
    1 — ffmpeg failed or audio_qa flagged errors
    2 — ffmpeg missing / WAV missing / wrong input
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

# Re-use the loudnorm output parser instead of duplicating it.
sys.path.insert(0, str(Path(__file__).resolve().parent))
import audio_qa as aq  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"

# Targets — mirror audio_qa's defaults so verification has the same yardstick.
DEFAULT_TARGET_LUFS = -14.0      # YouTube spec
DEFAULT_TARGET_TP_DB = -1.0      # broadcast-safe ceiling
DEFAULT_TARGET_LRA = 11.0        # loudness range target (broad enough for narration)

VALID_PRESETS = ("safe", "standard", "aggressive")
DEFAULT_PRESET = "standard"


@dataclass
class LoudnormPass1:
    """Measured loudness values from the first loudnorm pass — fed back
    into the second pass as `measured_*` parameters for accurate target."""

    input_i: float
    input_tp: float
    input_lra: float
    input_thresh: float
    target_offset: float


# ── Filter chain construction ────────────────────────────────────────────────


def _base_filters(preset: str) -> list[str]:
    """Return the pre-loudnorm filter chain (everything except loudnorm)."""
    if preset not in VALID_PRESETS:
        raise ValueError(f"Unknown preset {preset!r}. Valid: {VALID_PRESETS}")

    # Common to every preset: high-pass filter removes sub-speech rumble
    # (HVAC, mic-stand vibration, room modes below the voice fundamentals).
    chain = ["highpass=f=80"]

    if preset == "safe":
        # No further processing — operator handles dynamics + EQ themselves.
        return chain

    if preset == "standard":
        # Gentle compression: 3:1 ratio at -18 dB threshold makes quiet
        # syllables audible without flattening dynamics. 5ms attack +
        # 50ms release is the broadcast-narration sweet spot.
        chain.append("acompressor=threshold=-18dB:ratio=3:attack=5:release=50:makeup=2")
        return chain

    if preset == "aggressive":
        # Adds a noise gate (only for genuinely noisy source — tuned to
        # close in slow release to avoid choking quiet breath sounds)
        # and a harder compressor for source material with wider dynamics.
        chain.extend([
            "agate=threshold=-50dB:ratio=2:attack=10:release=300",
            "acompressor=threshold=-15dB:ratio=4:attack=3:release=40:makeup=3",
        ])
        return chain

    raise AssertionError("unreachable")  # exhausted by VALID_PRESETS check above


def build_pass1_filters(preset: str, target_lufs: float, target_lra: float) -> str:
    """Build the ffmpeg -af chain for the measurement pass."""
    base = _base_filters(preset)
    base.append(
        f"loudnorm=I={target_lufs}:TP={DEFAULT_TARGET_TP_DB}:LRA={target_lra}:"
        f"print_format=json"
    )
    return ",".join(base)


def build_pass2_filters(
    preset: str, target_lufs: float, target_lra: float, measured: LoudnormPass1,
) -> str:
    """Build the ffmpeg -af chain for the apply pass.

    The second-pass loudnorm uses the measured values from pass 1 to
    achieve accurate target loudness. Without this, single-pass loudnorm
    can drift ±1 LUFS depending on source dynamics.
    """
    base = _base_filters(preset)
    base.append(
        f"loudnorm=I={target_lufs}:TP={DEFAULT_TARGET_TP_DB}:LRA={target_lra}:"
        f"measured_I={measured.input_i}:measured_TP={measured.input_tp}:"
        f"measured_LRA={measured.input_lra}:measured_thresh={measured.input_thresh}:"
        f"offset={measured.target_offset}:linear=true"
    )
    return ",".join(base)


# ── ffmpeg invocation ────────────────────────────────────────────────────────


def _ensure_ffmpeg() -> None:
    if shutil.which("ffmpeg") is None:
        print(
            "✗ ffmpeg not on PATH — install with:\n"
            "    brew install ffmpeg   # macOS\n"
            "    apt install ffmpeg    # Ubuntu",
            file=sys.stderr,
        )
        sys.exit(2)


def parse_pass1_measurement(stderr: str) -> Optional[LoudnormPass1]:
    """Extract the measured-loudness JSON block from pass-1 stderr.

    Pure function over stderr text so we can unit-test against fixtures
    without spawning ffmpeg. Re-uses the brace-balanced extractor from
    `audio_qa.parse_loudnorm_output` so any future fix to that path
    benefits us too.
    """
    # Walk stderr the same way audio_qa does — find the marker, balance braces.
    m = aq._LOUDNORM_MARKER_RE.search(stderr)
    start = m.end() if m else 0
    block = aq._extract_balanced_json(stderr, start)
    if block is None:
        return None
    try:
        data = json.loads(block)
    except json.JSONDecodeError:
        return None
    try:
        return LoudnormPass1(
            input_i=float(data["input_i"]),
            input_tp=float(data["input_tp"]),
            input_lra=float(data["input_lra"]),
            input_thresh=float(data["input_thresh"]),
            target_offset=float(data["target_offset"]),
        )
    except (KeyError, ValueError):
        return None


def run_pass1(input_path: Path, filter_chain: str) -> LoudnormPass1:
    """Run measurement pass. Output is discarded (-f null); we only want
    the loudnorm JSON written to stderr."""
    result = subprocess.run(
        [
            "ffmpeg", "-nostats", "-hide_banner", "-y",
            "-i", str(input_path),
            "-af", filter_chain,
            "-f", "null", "-",
        ],
        capture_output=True, text=True, check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg pass-1 failed: {result.stderr[-500:]}")
    measured = parse_pass1_measurement(result.stderr)
    if measured is None:
        raise RuntimeError(
            "ffmpeg pass-1 succeeded but loudnorm JSON could not be parsed. "
            "Check that the loudnorm filter is in the chain."
        )
    return measured


def run_pass2(input_path: Path, output_path: Path, filter_chain: str) -> None:
    """Apply pass — writes the mastered output. Forces 48 kHz / mono / PCM
    so the mastered file matches the canonical layout audio_qa expects."""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        [
            "ffmpeg", "-nostats", "-hide_banner", "-y",
            "-i", str(input_path),
            "-af", filter_chain,
            "-ar", "48000", "-ac", "1", "-c:a", "pcm_s24le",
            str(output_path),
        ],
        capture_output=True, text=True, check=False,
    )
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg pass-2 failed: {result.stderr[-500:]}")


def master_wav(
    input_path: Path, output_path: Path,
    preset: str = DEFAULT_PRESET,
    target_lufs: float = DEFAULT_TARGET_LUFS,
    target_lra: float = DEFAULT_TARGET_LRA,
) -> LoudnormPass1:
    """Two-pass master. Returns the measured LoudnormPass1 from pass 1
    so callers can report or log the source levels."""
    pass1_chain = build_pass1_filters(preset, target_lufs, target_lra)
    measured = run_pass1(input_path, pass1_chain)
    pass2_chain = build_pass2_filters(preset, target_lufs, target_lra, measured)
    run_pass2(input_path, output_path, pass2_chain)
    return measured


# ── CLI ──────────────────────────────────────────────────────────────────────


def _default_wav(slug: str) -> Path:
    return EPISODES_DIR / slug / "assets" / "narration.wav"


def _default_output(wav_path: Path) -> Path:
    """Insert `-mastered` before the extension. Preserves the original."""
    return wav_path.with_name(f"{wav_path.stem}-mastered{wav_path.suffix}")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", nargs="?", help="Episode slug.")
    parser.add_argument("--wav", help="Explicit input WAV (overrides slug).")
    parser.add_argument("-o", "--output", help="Output path (default: <input>-mastered.wav).")
    parser.add_argument(
        "--preset", choices=VALID_PRESETS, default=DEFAULT_PRESET,
        help=f"Mastering preset (default: {DEFAULT_PRESET}). "
             f"safe = HPF+loudnorm only; standard = +compression; "
             f"aggressive = +noise gate + harder compression.",
    )
    parser.add_argument(
        "--target-lufs", type=float, default=DEFAULT_TARGET_LUFS,
        help=f"Target integrated loudness (default: {DEFAULT_TARGET_LUFS}). "
             f"YouTube uses -14; podcasts often -16.",
    )
    parser.add_argument(
        "--target-lra", type=float, default=DEFAULT_TARGET_LRA,
        help=f"Target loudness range (default: {DEFAULT_TARGET_LRA}).",
    )
    parser.add_argument(
        "--no-audio-qa", action="store_true",
        help="Skip the post-master audio_qa verification step.",
    )
    args = parser.parse_args()

    _ensure_ffmpeg()

    # ── Resolve input ──────────────────────────────────────────────────
    if args.wav:
        input_path = Path(args.wav).resolve()
    elif args.slug:
        input_path = _default_wav(args.slug)
    else:
        print("✗ provide either a slug or --wav <path>", file=sys.stderr)
        return 2

    if not input_path.is_file():
        print(f"✗ WAV not found: {input_path}", file=sys.stderr)
        return 2

    output_path = (
        Path(args.output).resolve() if args.output
        else _default_output(input_path)
    )

    if output_path.resolve() == input_path.resolve():
        print("✗ refusing to overwrite the source file. Pass --output explicitly.",
              file=sys.stderr)
        return 2

    print(f"→ Pass 1 (measurement) on {input_path.name}…")
    try:
        measured = master_wav(
            input_path, output_path,
            preset=args.preset,
            target_lufs=args.target_lufs,
            target_lra=args.target_lra,
        )
    except RuntimeError as e:
        print(f"✗ {e}", file=sys.stderr)
        return 1

    print(
        f"  · measured: {measured.input_i:.1f} LUFS · {measured.input_tp:+.1f} dBTP · "
        f"LRA {measured.input_lra:.1f}"
    )
    rel = output_path.relative_to(ROOT) if output_path.is_relative_to(ROOT) else output_path
    print(f"✓ wrote {rel} (preset={args.preset}, target={args.target_lufs} LUFS)")

    # ── Post-master verification ────────────────────────────────────────
    if not args.no_audio_qa:
        print(f"\n→ Verifying mastered output via audio_qa…")
        try:
            report = aq.audit_audio(output_path)
        except Exception as e:
            print(f"  ⚠ audio_qa skipped: {e}", file=sys.stderr)
            return 0
        if report.loudness:
            actual = report.loudness.integrated_lufs
            delta = abs(actual - args.target_lufs)
            ok = delta <= 1.0
            icon = "🟢" if ok else "🟡"
            print(
                f"  {icon} mastered loudness: {actual:.1f} LUFS "
                f"(target {args.target_lufs:.0f}, delta {delta:.1f})"
            )
        if report.errors:
            print(f"  ⚠ {len(report.errors)} error(s) in mastered output", file=sys.stderr)
            return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
