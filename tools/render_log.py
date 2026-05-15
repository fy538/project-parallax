#!/usr/bin/env python3
"""
render_log.py — wrap a render command, tee output to a per-episode log file.

Why this exists:
  Right now `npm run build silicon-trap-full out/ep.mp4` prints to the
  terminal and disappears. When a render takes 15 minutes and silently
  produces a slightly-wrong frame count, there's no record to compare
  against the next render. This wrapper captures every render invocation
  to a timestamped log under `episodes/<slug>/render-logs/`, plus the
  postflight metadata if the output MP4 exists.

  Downstream uses (deferred until enough log corpus accumulates):
    - Render-cache invalidation rules (Tier 3 #7)
    - Cross-episode brand-consistency audit (Tier 3 #8)
    - Render-time regression detection (slow renders → diagnose)

Usage:
    # Wrap a single-composition render:
    python3 tools/render_log.py \\
        --episode silicon-trap \\
        --output out/silicon-trap-full.mp4 \\
        -- npm run build silicon-trap-full out/silicon-trap-full.mp4

    # Wrap a multi-segment orchestrated render (no single output file):
    python3 tools/render_log.py \\
        --episode silicon-trap \\
        --label segments \\
        -- node remotion-templates/scripts/render-episode.mjs --episode=silicon-trap

Behaviour:
  - stdout + stderr are merged (chronological) and tee'd to both the
    terminal and the log file.
  - Exit code matches the wrapped command's exit code.
  - When `--output` is set AND the file exists after the command, postflight
    is invoked and its report is appended to the log.
  - Log path: `episodes/<slug>/render-logs/<ISO-timestamp>[-<label>].log`

Exit codes:
    Whatever the wrapped command returned (so this is transparent in CI).
    2 — usage error (missing --episode, missing -- separator, etc.)
"""

from __future__ import annotations

import argparse
import datetime as dt
import os
import shlex
import subprocess
import sys
from pathlib import Path
from typing import TextIO

REPO_ROOT = Path(__file__).resolve().parent.parent
EPISODES_ROOT = REPO_ROOT / "episodes"
POSTFLIGHT = REPO_ROOT / "tools" / "postflight.py"


def log_path_for(slug: str, label: str | None) -> Path:
    """Build the timestamped log path; create the directory as needed."""
    timestamp = dt.datetime.now().strftime("%Y%m%dT%H%M%S")
    suffix = f"-{label}" if label else ""
    log_dir = EPISODES_ROOT / slug / "render-logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    return log_dir / f"{timestamp}{suffix}.log"


def write_banner(handle: TextIO, *, command: list[str], episode: str, output: Path | None) -> None:
    """Write a parseable header block at the start of the log."""
    handle.write("# === render_log header ===\n")
    handle.write(f"# episode: {episode}\n")
    handle.write(f"# started: {dt.datetime.now().isoformat(timespec='seconds')}\n")
    handle.write(f"# pwd: {Path.cwd()}\n")
    handle.write(f"# command: {shlex.join(command)}\n")
    if output:
        handle.write(f"# expected_output: {output}\n")
    handle.write("# === begin command output ===\n\n")
    handle.flush()


def write_footer(handle: TextIO, *, exit_code: int, elapsed_sec: float) -> None:
    handle.write("\n# === end command output ===\n")
    handle.write(f"# exit_code: {exit_code}\n")
    handle.write(f"# elapsed_sec: {elapsed_sec:.2f}\n")
    handle.write(f"# finished: {dt.datetime.now().isoformat(timespec='seconds')}\n")
    handle.flush()


def run_postflight(output: Path, episode: str, handle: TextIO) -> int:
    """Invoke postflight.py against the rendered output; append to log + terminal."""
    handle.write("\n# === postflight ===\n")
    handle.flush()
    cmd = [sys.executable, str(POSTFLIGHT), str(output), "--episode", episode]
    proc = subprocess.run(cmd, capture_output=True, text=True, check=False)
    # Both stdout and stderr — postflight uses stdout for the report, stderr
    # for usage errors. We want both in the log unconditionally.
    handle.write(proc.stdout)
    handle.write(proc.stderr)
    handle.flush()
    # Mirror to terminal too — the operator wants to see the result, not
    # have to open the log file.
    sys.stdout.write(proc.stdout)
    if proc.stderr:
        sys.stderr.write(proc.stderr)
    return proc.returncode


def tee_run(command: list[str], handle: TextIO) -> int:
    """
    Run `command`, streaming combined stdout+stderr to BOTH the terminal and
    the log file, line by line. Returns the wrapped command's exit code.
    """
    try:
        proc = subprocess.Popen(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,  # merge for chronological log
            bufsize=1,
            text=True,
            env=os.environ.copy(),
        )
    except FileNotFoundError as exc:
        msg = f"render_log: command not found: {command[0]} ({exc})\n"
        sys.stderr.write(msg)
        handle.write(msg)
        return 127

    assert proc.stdout is not None
    try:
        for line in proc.stdout:
            sys.stdout.write(line)
            sys.stdout.flush()
            handle.write(line)
            handle.flush()
    except KeyboardInterrupt:
        proc.terminate()
        # Wait briefly for the wrapped command to handle the signal, then move on.
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
        handle.write("\n# === interrupted by SIGINT ===\n")
        return 130
    return proc.wait()


def parse_args(argv: list[str] | None = None) -> tuple[argparse.Namespace, list[str]]:
    """Custom parsing — argparse can't cleanly split off a trailing `-- cmd` tail."""
    argv = list(argv if argv is not None else sys.argv[1:])
    if "--" not in argv:
        print("render_log: missing `--` separator before the wrapped command.\n", file=sys.stderr)
        print("Example: render_log.py --episode silicon-trap --output out/ep.mp4 -- npm run build silicon-trap-full out/ep.mp4", file=sys.stderr)
        sys.exit(2)
    sep_idx = argv.index("--")
    wrapper_args, command = argv[:sep_idx], argv[sep_idx + 1 :]

    parser = argparse.ArgumentParser(
        prog="render_log.py",
        description="Wrap a render command and tee output to a per-episode log file.",
    )
    parser.add_argument("--episode", required=True, help="Episode slug — determines log directory")
    parser.add_argument(
        "--output", type=Path,
        help="Expected output MP4 path. When set and file exists after render, postflight is appended to the log.",
    )
    parser.add_argument(
        "--label",
        help="Optional short label appended to the log filename (e.g. 'full', 'shorts-01').",
    )
    parser.add_argument(
        "--no-postflight", action="store_true",
        help="Skip the post-render postflight check even when --output is set.",
    )
    args = parser.parse_args(wrapper_args)

    if not command:
        print("render_log: no command after `--`.\n", file=sys.stderr)
        sys.exit(2)
    return args, command


def main(argv: list[str] | None = None) -> int:
    args, command = parse_args(argv)

    # Validate episode dir exists — we don't auto-create it because the slug
    # might be a typo and we don't want to litter empty directories.
    episode_dir = EPISODES_ROOT / args.episode
    if not episode_dir.is_dir():
        print(f"render_log: episode directory not found: {episode_dir}", file=sys.stderr)
        print("Run with a known episode slug or `mkdir -p` the directory first.", file=sys.stderr)
        return 2

    log_path = log_path_for(args.episode, args.label)
    start_time = dt.datetime.now()

    # Show repo-relative path when applicable, absolute otherwise (tests
    # monkeypatch EPISODES_ROOT to a tmp dir outside the repo).
    try:
        log_disp = log_path.relative_to(REPO_ROOT)
    except ValueError:
        log_disp = log_path
    print(f"[render_log] logging to {log_disp}", file=sys.stderr)

    with open(log_path, "w", encoding="utf-8") as handle:
        write_banner(handle, command=command, episode=args.episode, output=args.output)
        exit_code = tee_run(command, handle)
        elapsed = (dt.datetime.now() - start_time).total_seconds()
        write_footer(handle, exit_code=exit_code, elapsed_sec=elapsed)

        # Run postflight when conditions are met. We DO NOT override the
        # exit code based on postflight — the wrapped command's exit code
        # remains the canonical "did the render succeed" signal. Postflight
        # findings are appended for review.
        if (
            args.output is not None
            and not args.no_postflight
            and args.output.is_file()
            and POSTFLIGHT.is_file()
        ):
            postflight_rc = run_postflight(args.output, args.episode, handle)
            handle.write(f"# postflight_exit: {postflight_rc}\n")

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
