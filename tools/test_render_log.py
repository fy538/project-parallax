"""
Tests for tools/render_log.py — render-command wrapper that tees to a per-episode log file.

Covers:
  1. CLI arg parsing — `--` separator handling, required flags
  2. Log path construction — episode dir, timestamp, optional label
  3. End-to-end: small command, log captures stdout/stderr, exit code passes through
  4. Postflight invocation when --output exists
  5. Unknown-episode rejection (exit 2)
  6. Missing `--` separator rejection (exit 2)
"""

from __future__ import annotations

import contextlib
import re
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import render_log  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPT_PATH = REPO_ROOT / "tools" / "render_log.py"
TIMESTAMP_RE = re.compile(r"^\d{8}T\d{6}(-[\w-]+)?\.log$")


# ─── 1. Argument parsing ─────────────────────────────────────────────────────


class TestArgParsing:
    def test_splits_args_and_command_at_double_dash(self):
        args, cmd = render_log.parse_args(["--episode", "demo", "--", "echo", "hi"])
        assert args.episode == "demo"
        assert cmd == ["echo", "hi"]

    def test_label_and_output_are_optional(self):
        args, _ = render_log.parse_args(["--episode", "demo", "--", "true"])
        assert args.label is None
        assert args.output is None
        assert args.no_postflight is False

    def test_label_appended_to_filename(self):
        path = render_log.log_path_for("demo", "shorts-01")
        assert path.name.endswith("-shorts-01.log")
        assert TIMESTAMP_RE.match(path.name)
        # Cleanup the empty directory we just created
        try:
            path.parent.rmdir()
            path.parent.parent.rmdir()
        except OSError:
            pass

    def test_path_for_no_label(self):
        path = render_log.log_path_for("demo", None)
        # No "-label" suffix when label is None
        assert "-" not in path.stem.split("T")[1]  # stem after timestamp is plain
        try:
            path.parent.rmdir()
            path.parent.parent.rmdir()
        except OSError:
            pass


# ─── 2. CLI failure modes ────────────────────────────────────────────────────


class TestCLIErrors:
    def test_missing_double_dash_exits_2(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--episode", "demo"],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 2
        assert "missing" in result.stderr.lower()

    def test_missing_episode_flag_exits_2(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--", "echo", "hi"],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 2

    def test_unknown_episode_exits_2(self, tmp_path, monkeypatch):
        monkeypatch.setattr(render_log, "EPISODES_ROOT", tmp_path)
        rc = render_log.main(["--episode", "nonexistent", "--", "echo", "x"])
        assert rc == 2

    def test_no_command_after_separator_exits_2(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--episode", "demo", "--"],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 2


# ─── 3. End-to-end (tee, exit code propagation, log content) ─────────────────


class TestEndToEnd:
    def _episode_dir(self, root: Path, slug: str = "demo") -> Path:
        d = root / slug
        d.mkdir(parents=True)
        return d

    def test_log_captures_command_output(self, tmp_path, monkeypatch):
        self._episode_dir(tmp_path)
        monkeypatch.setattr(render_log, "EPISODES_ROOT", tmp_path)
        rc = render_log.main([
            "--episode", "demo", "--label", "smoke",
            "--", "echo", "hello-from-wrapped-command",
        ])
        assert rc == 0

        logs = list((tmp_path / "demo" / "render-logs").glob("*-smoke.log"))
        assert len(logs) == 1, f"expected one log, got {logs}"
        content = logs[0].read_text()
        assert "hello-from-wrapped-command" in content
        # Header + footer markers
        assert "# === render_log header ===" in content
        assert "# === begin command output ===" in content
        assert "# === end command output ===" in content
        assert "# exit_code: 0" in content
        assert "# elapsed_sec:" in content
        # Original command was recorded
        assert "echo" in content

    def test_exit_code_passes_through(self, tmp_path, monkeypatch):
        self._episode_dir(tmp_path)
        monkeypatch.setattr(render_log, "EPISODES_ROOT", tmp_path)
        # `false` always exits 1
        rc = render_log.main(["--episode", "demo", "--", "false"])
        assert rc == 1
        logs = list((tmp_path / "demo" / "render-logs").glob("*.log"))
        content = logs[0].read_text()
        assert "# exit_code: 1" in content

    def test_command_not_found_returns_127(self, tmp_path, monkeypatch):
        self._episode_dir(tmp_path)
        monkeypatch.setattr(render_log, "EPISODES_ROOT", tmp_path)
        rc = render_log.main([
            "--episode", "demo", "--",
            "definitely-not-a-real-command-xyz123",
        ])
        assert rc == 127
        # Log file is still created and notes the failure
        logs = list((tmp_path / "demo" / "render-logs").glob("*.log"))
        content = logs[0].read_text()
        assert "command not found" in content.lower()

    def test_stderr_is_merged_into_log(self, tmp_path, monkeypatch):
        self._episode_dir(tmp_path)
        monkeypatch.setattr(render_log, "EPISODES_ROOT", tmp_path)
        # `sh -c "echo to-stderr 1>&2"` writes to stderr only
        rc = render_log.main([
            "--episode", "demo", "--",
            "sh", "-c", "echo to-stderr 1>&2",
        ])
        assert rc == 0
        logs = list((tmp_path / "demo" / "render-logs").glob("*.log"))
        content = logs[0].read_text()
        # stderr is merged into the single stream
        assert "to-stderr" in content


# ─── 4. Postflight integration ───────────────────────────────────────────────


class TestPostflightHook:
    def test_postflight_skipped_when_output_missing(self, tmp_path, monkeypatch):
        (tmp_path / "demo").mkdir()
        monkeypatch.setattr(render_log, "EPISODES_ROOT", tmp_path)
        rc = render_log.main([
            "--episode", "demo",
            "--output", str(tmp_path / "never-created.mp4"),
            "--", "echo", "no output produced",
        ])
        assert rc == 0
        logs = list((tmp_path / "demo" / "render-logs").glob("*.log"))
        content = logs[0].read_text()
        assert "# === postflight ===" not in content

    def test_postflight_runs_when_output_exists(self, tmp_path, monkeypatch):
        (tmp_path / "demo").mkdir()
        # Create a dummy "MP4" — postflight will fail its checks but the
        # important thing is that it RUNS and writes output to the log.
        fake_mp4 = tmp_path / "tiny.mp4"
        fake_mp4.write_bytes(b"\x00" * 100)
        monkeypatch.setattr(render_log, "EPISODES_ROOT", tmp_path)

        rc = render_log.main([
            "--episode", "demo",
            "--output", str(fake_mp4),
            "--", "echo", "render-done",
        ])
        # Wrapped command succeeded, postflight findings don't override the rc
        assert rc == 0
        logs = list((tmp_path / "demo" / "render-logs").glob("*.log"))
        content = logs[0].read_text()
        assert "# === postflight ===" in content
        assert "postflight_exit:" in content

    def test_no_postflight_flag_skips_check(self, tmp_path, monkeypatch):
        (tmp_path / "demo").mkdir()
        fake_mp4 = tmp_path / "fake.mp4"
        fake_mp4.write_bytes(b"\x00" * 100)
        monkeypatch.setattr(render_log, "EPISODES_ROOT", tmp_path)
        rc = render_log.main([
            "--episode", "demo",
            "--output", str(fake_mp4),
            "--no-postflight",
            "--", "echo", "render-done",
        ])
        assert rc == 0
        logs = list((tmp_path / "demo" / "render-logs").glob("*.log"))
        content = logs[0].read_text()
        assert "# === postflight ===" not in content


# ─── 5. CLI smoke via subprocess ─────────────────────────────────────────────


class TestCLISubprocess:
    def test_succeeds_against_real_episode(self, tmp_path):
        """Wrap a no-op command against a real episode slug."""
        if not (REPO_ROOT / "episodes" / "silicon-trap").is_dir():
            pytest.skip("silicon-trap episode dir missing")
        result = subprocess.run(
            [
                sys.executable, str(SCRIPT_PATH),
                "--episode", "silicon-trap",
                "--label", "pytest-smoke",
                "--", "echo", "pytest-marker-line",
            ],
            capture_output=True, text=True, check=False,
        )
        try:
            assert result.returncode == 0
            assert "pytest-marker-line" in result.stdout
            # Log file should exist with our marker
            log_dir = REPO_ROOT / "episodes" / "silicon-trap" / "render-logs"
            matches = list(log_dir.glob("*-pytest-smoke.log"))
            assert len(matches) >= 1
            assert "pytest-marker-line" in matches[0].read_text()
        finally:
            # Cleanup — don't leave smoke logs in the real episode dir
            log_dir = REPO_ROOT / "episodes" / "silicon-trap" / "render-logs"
            for f in log_dir.glob("*-pytest-smoke.log"):
                f.unlink()
            # Remove the render-logs dir if it's empty (we may have created it)
            with contextlib.suppress(OSError):
                log_dir.rmdir()
