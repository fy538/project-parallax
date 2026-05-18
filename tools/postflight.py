#!/usr/bin/env python3
"""
postflight.py — verify a rendered MP4 isn't silently broken.

Failure mode this catches: `npm run build` returns exit 0 and produces a
12KB MP4 with 0 video frames; or a 200MB MP4 that's missing the last 14
seconds because a manifest mismatch clipped the tail. Both happened before
either was caught — silent because the render command succeeded.

Checks (all configurable):
  1. File exists and is at least min_bytes_per_sec * duration_sec
  2. Container reports a non-zero video stream count
  3. (When --episode is given) duration matches manifest.totalDurationSec ± tolerance
  4. (When --episode is given OR --resolution is set) frame dimensions match expected

Dependencies:
  - ffprobe (ffmpeg). Brew: `brew install ffmpeg`. Most CI runners have it.
    If ffprobe is missing we degrade gracefully: bytes-only check still runs,
    duration/resolution checks skip with a clear note in the report.

Usage:
    python3 tools/postflight.py path/to/render.mp4
    python3 tools/postflight.py out/ep.mp4 --episode silicon-trap
    python3 tools/postflight.py out/short.mp4 --resolution 1080x1920
    python3 tools/postflight.py out/ep.mp4 --episode silicon-trap --json

Exit codes:
    0 — all checks pass
    1 — at least one check failed (corruption likely)
    2 — usage error or missing input file
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from video_config import get_video_config  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
EPISODES_DIR = REPO_ROOT / "remotion-templates" / "data" / "episodes"


# ─── Defaults ────────────────────────────────────────────────────────────────

# Minimum acceptable bytes per second of video. 1920×1080@30fps H.264 video
# typically produces 200–800 KB/s depending on content. 50 KB/s is well below
# the floor we'd ever expect for a non-blank render, so anything under this
# is almost certainly silent corruption (e.g. encoder produced empty stream).
DEFAULT_MIN_BYTES_PER_SEC = 50_000

# Tolerance when matching MP4 duration against manifest.totalDurationSec.
# Real renders typically land within ±0.05s — Remotion frames are discrete.
DEFAULT_DURATION_TOLERANCE_SEC = 0.5

# Default frame size — sourced from `tools/config/video.json::episode`.
# Shorts use the `short` profile (1080×1920) — pass --resolution to override
# or read `get_video_config("short")` if invoking programmatically.
_EPISODE_PROFILE = get_video_config("episode")
DEFAULT_WIDTH = _EPISODE_PROFILE.width
DEFAULT_HEIGHT = _EPISODE_PROFILE.height


# ─── Probe ───────────────────────────────────────────────────────────────────


@dataclass
class ProbeResult:
    """Parsed subset of ffprobe output. Fields are None when probe failed."""
    duration_sec: float | None = None
    video_streams: int = 0
    width: int | None = None
    height: int | None = None
    probe_available: bool = True   # False when ffprobe missing
    raw_error: str = ""


def probe_mp4(path: Path) -> ProbeResult:
    """Run ffprobe and parse the bits we care about. Degrade gracefully."""
    if shutil.which("ffprobe") is None:
        return ProbeResult(probe_available=False, raw_error="ffprobe not installed")

    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_format", "-show_streams",
                "-of", "json", str(path),
            ],
            capture_output=True, text=True, timeout=30,
            check=False,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
        return ProbeResult(raw_error=f"ffprobe invocation failed: {exc}")

    if result.returncode != 0:
        return ProbeResult(raw_error=f"ffprobe exit {result.returncode}: {result.stderr.strip()}")

    try:
        meta = json.loads(result.stdout)
    except json.JSONDecodeError as exc:
        return ProbeResult(raw_error=f"ffprobe output is not JSON: {exc}")

    duration = None
    fmt = meta.get("format") or {}
    if "duration" in fmt:
        try:
            duration = float(fmt["duration"])
        except (TypeError, ValueError):
            duration = None

    video_streams = [s for s in meta.get("streams", []) if s.get("codec_type") == "video"]
    width = height = None
    if video_streams:
        first = video_streams[0]
        width = first.get("width")
        height = first.get("height")

    return ProbeResult(
        duration_sec=duration,
        video_streams=len(video_streams),
        width=width,
        height=height,
    )


# ─── Manifest loader ─────────────────────────────────────────────────────────


def load_episode_manifest(slug: str) -> dict | None:
    manifest_path = EPISODES_DIR / slug / "assembly-manifest.json"
    if not manifest_path.is_file():
        return None
    try:
        return json.loads(manifest_path.read_text())
    except json.JSONDecodeError:
        return None


# ─── Check runner ────────────────────────────────────────────────────────────


@dataclass
class CheckResult:
    name: str
    ok: bool
    detail: str
    severity: str = "error"  # "error" or "info"


@dataclass
class PostflightReport:
    path: Path
    bytes: int
    episode: str | None
    probe: ProbeResult
    checks: list[CheckResult] = field(default_factory=list)

    @property
    def failed(self) -> bool:
        return any(c.severity == "error" and not c.ok for c in self.checks)


def run_postflight(
    path: Path,
    *,
    episode: str | None = None,
    min_bytes_per_sec: int = DEFAULT_MIN_BYTES_PER_SEC,
    expected_resolution: tuple[int, int] | None = None,
    duration_tolerance_sec: float = DEFAULT_DURATION_TOLERANCE_SEC,
) -> PostflightReport:
    if not path.is_file():
        # Missing file is a usage error — caller should have checked. Build a
        # minimal report so JSON-mode output is still well-formed.
        return PostflightReport(
            path=path, bytes=0, episode=episode, probe=ProbeResult(),
            checks=[CheckResult(name="file-exists", ok=False, detail=f"no file at {path}")],
        )

    size_bytes = path.stat().st_size
    probe = probe_mp4(path)
    report = PostflightReport(path=path, bytes=size_bytes, episode=episode, probe=probe)

    # ── Check: file size is at least min_bytes_per_sec × duration ─────────
    # When ffprobe couldn't read a duration, fall back to a flat absolute
    # minimum (1 KB) — better than no signal at all.
    if probe.duration_sec is not None:
        floor = int(min_bytes_per_sec * probe.duration_sec)
        ok = size_bytes >= floor
        report.checks.append(CheckResult(
            name="bytes-per-second-floor",
            ok=ok,
            detail=(
                f"{size_bytes:,} bytes for {probe.duration_sec:.2f}s "
                f"= {size_bytes / max(probe.duration_sec, 0.001):,.0f} B/s "
                f"(floor: {min_bytes_per_sec:,} B/s × {probe.duration_sec:.2f}s = {floor:,} B)"
            ),
        ))
    else:
        ok = size_bytes >= 1024
        report.checks.append(CheckResult(
            name="file-size-fallback",
            ok=ok,
            detail=f"{size_bytes:,} bytes (ffprobe duration unavailable; using 1 KB floor)",
        ))

    # ── Check: at least one video stream ──────────────────────────────────
    if probe.probe_available:
        report.checks.append(CheckResult(
            name="video-stream-present",
            ok=probe.video_streams >= 1,
            detail=f"{probe.video_streams} video stream(s) reported by ffprobe",
        ))
    else:
        report.checks.append(CheckResult(
            name="video-stream-present",
            ok=True,
            detail="ffprobe not installed — stream check skipped",
            severity="info",
        ))

    # ── Check: episode duration match ─────────────────────────────────────
    declared_duration = None
    if episode:
        manifest = load_episode_manifest(episode)
        if manifest is None:
            report.checks.append(CheckResult(
                name="manifest-loaded",
                ok=False,
                detail=f"could not load assembly-manifest.json for episode '{episode}'",
            ))
        else:
            declared_duration = manifest.get("totalDurationSec")
            if declared_duration is None:
                report.checks.append(CheckResult(
                    name="manifest-duration-declared",
                    ok=True,
                    detail="manifest has no totalDurationSec; duration check skipped",
                    severity="info",
                ))
            elif probe.duration_sec is None:
                report.checks.append(CheckResult(
                    name="duration-match",
                    ok=True,
                    detail="ffprobe duration unavailable; can't compare to manifest",
                    severity="info",
                ))
            else:
                diff = probe.duration_sec - declared_duration
                ok = abs(diff) <= duration_tolerance_sec
                report.checks.append(CheckResult(
                    name="duration-match",
                    ok=ok,
                    detail=(
                        f"rendered {probe.duration_sec:.2f}s vs declared {declared_duration:.2f}s "
                        f"(diff {diff:+.3f}s, tolerance ±{duration_tolerance_sec}s)"
                    ),
                ))

    # ── Check: resolution ─────────────────────────────────────────────────
    if expected_resolution is None and episode is not None:
        # Sensible default: episode renders are 1920×1080 unless overridden.
        expected_resolution = (DEFAULT_WIDTH, DEFAULT_HEIGHT)

    if expected_resolution is not None:
        if probe.width is None or probe.height is None:
            report.checks.append(CheckResult(
                name="resolution-match",
                ok=True,
                detail="ffprobe didn't return resolution; check skipped",
                severity="info",
            ))
        else:
            exp_w, exp_h = expected_resolution
            ok = probe.width == exp_w and probe.height == exp_h
            report.checks.append(CheckResult(
                name="resolution-match",
                ok=ok,
                detail=f"rendered {probe.width}×{probe.height}, expected {exp_w}×{exp_h}",
            ))

    return report


# ─── Output ──────────────────────────────────────────────────────────────────


def print_human(report: PostflightReport) -> int:
    BOLD = "\033[1m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    DIM = "\033[2m"
    YELLOW = "\033[33m"
    RESET = "\033[0m"

    try:
        path_disp = report.path.relative_to(REPO_ROOT)
    except ValueError:
        path_disp = report.path

    print(f"\n{BOLD}postflight: {path_disp}{RESET}")
    print(f"{DIM}  size: {report.bytes:,} bytes ({report.bytes / 1_000_000:.2f} MB){RESET}")
    if report.probe.probe_available:
        if report.probe.duration_sec is not None:
            print(f"{DIM}  duration: {report.probe.duration_sec:.2f}s, "
                  f"video streams: {report.probe.video_streams}, "
                  f"frame: {report.probe.width}×{report.probe.height}{RESET}")
    else:
        print(f"{YELLOW}  ⚠ ffprobe not installed — duration/resolution checks degraded{RESET}")
    print()

    fail_count = 0
    for c in report.checks:
        if c.ok:
            marker = f"{GREEN}✓{RESET}"
        else:
            marker = f"{RED}✖{RESET}" if c.severity == "error" else f"{YELLOW}⚠{RESET}"
            if c.severity == "error":
                fail_count += 1
        print(f"  {marker} {BOLD}{c.name}{RESET}: {c.detail}")

    print()
    if fail_count == 0:
        print(f"{GREEN}{BOLD}  ✓ render output looks healthy.{RESET}\n")
        return 0
    print(f"{RED}{BOLD}  ✖ {fail_count} check(s) failed — render is likely corrupted.{RESET}\n")
    return 1


def print_json(report: PostflightReport) -> int:
    try:
        path_disp = str(report.path.relative_to(REPO_ROOT))
    except ValueError:
        path_disp = str(report.path)

    out = {
        "path": path_disp,
        "bytes": report.bytes,
        "episode": report.episode,
        "probe": {
            "available": report.probe.probe_available,
            "duration_sec": report.probe.duration_sec,
            "video_streams": report.probe.video_streams,
            "width": report.probe.width,
            "height": report.probe.height,
            "error": report.probe.raw_error or None,
        },
        "checks": [
            {"name": c.name, "ok": c.ok, "detail": c.detail, "severity": c.severity}
            for c in report.checks
        ],
        "failed": report.failed,
    }
    print(json.dumps(out, indent=2))
    return 1 if report.failed else 0


# ─── CLI ─────────────────────────────────────────────────────────────────────


def parse_resolution(s: str) -> tuple[int, int]:
    """Parse `WxH` (e.g. '1920x1080') into a tuple."""
    parts = s.lower().replace("×", "x").split("x")
    if len(parts) != 2:
        raise argparse.ArgumentTypeError(f"resolution must be WxH, got '{s}'")
    try:
        return int(parts[0]), int(parts[1])
    except ValueError as exc:
        raise argparse.ArgumentTypeError(f"resolution parts must be integers: {exc}") from exc


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="postflight.py",
        description="Verify a rendered MP4 is healthy (size, duration, resolution).",
    )
    parser.add_argument("mp4", type=Path, help="Path to the rendered MP4")
    parser.add_argument("--episode", help="Episode slug — enables duration + resolution checks against manifest")
    parser.add_argument(
        "--min-bytes-per-sec", type=int, default=DEFAULT_MIN_BYTES_PER_SEC,
        help=f"Minimum bytes-per-second-of-video floor (default: {DEFAULT_MIN_BYTES_PER_SEC:,})",
    )
    _short = get_video_config("short")
    parser.add_argument(
        "--resolution", type=parse_resolution,
        help=(
            f"Expected resolution as WxH (e.g. '{_short.width}x{_short.height}' for Shorts). "
            f"Defaults to {DEFAULT_WIDTH}x{DEFAULT_HEIGHT} when --episode is given; "
            f"omit otherwise to skip."
        ),
    )
    parser.add_argument(
        "--tolerance-sec", type=float, default=DEFAULT_DURATION_TOLERANCE_SEC,
        help=f"Duration-match tolerance in seconds (default: {DEFAULT_DURATION_TOLERANCE_SEC})",
    )
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    args = parser.parse_args(argv)

    if not args.mp4.exists():
        print(f"Error: file not found: {args.mp4}", file=sys.stderr)
        return 2

    report = run_postflight(
        args.mp4,
        episode=args.episode,
        min_bytes_per_sec=args.min_bytes_per_sec,
        expected_resolution=args.resolution,
        duration_tolerance_sec=args.tolerance_sec,
    )
    if args.json:
        return print_json(report)
    return print_human(report)


if __name__ == "__main__":
    sys.exit(main())
