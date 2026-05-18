"""
CLI smoke tests for tools/assembly/invalidate.py.

The pure-function core is tested in test_invalidation_core.py. These
tests exercise the CLI orchestration:
  · --paths mode (no git invocation)
  · Episode filter
  · Markdown vs JSON output
  · Exit codes
  · The shipped dependency-graph.json loads cleanly + matches real paths
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
INVALIDATE_SCRIPT = REPO_ROOT / "tools" / "assembly" / "invalidate.py"


class TestPathsMode:
    """--paths bypasses git and lets us test the matching pipeline without
    depending on the test environment's git history."""

    def test_script_edit_produces_full_cascade(self):
        result = subprocess.run(
            [
                sys.executable, str(INVALIDATE_SCRIPT),
                "--paths", "episodes/prisoners-dilemma/script-production.md",
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        assert result.returncode == 1  # 🔴 high-confidence → exit 1
        out = result.stdout
        # Every key downstream artifact should be named in the report
        assert "narration-readable.md" in out
        assert "pronunciation-guide.md" in out
        assert "cue-sheet.md" in out
        assert "assembly-manifest.json" in out
        # Slug should be substituted into regen commands
        assert "format_for_reading.py prisoners-dilemma" in out

    def test_narration_wav_edit(self):
        result = subprocess.run(
            [
                sys.executable, str(INVALIDATE_SCRIPT),
                "--paths", "episodes/prisoners-dilemma/assets/narration.wav",
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        assert result.returncode == 1
        out = result.stdout
        # WAV edit should drive audio_qa, whisper_alignment, --audio manifest
        assert "audio_qa.py prisoners-dilemma" in out
        assert "whisper_alignment.py prisoners-dilemma" in out
        assert "generate_manifest.py prisoners-dilemma --audio" in out

    def test_palette_edit(self):
        result = subprocess.run(
            [
                sys.executable, str(INVALIDATE_SCRIPT),
                "--paths", "tools/brand-treatment/palette.json",
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        assert result.returncode == 1
        out = result.stdout
        # Palette change cascades to LUTs + every episode render
        assert "treat_video.py" in out
        assert "luts" in out.lower()

    def test_unmatched_path_returns_no_invalidations(self):
        result = subprocess.run(
            [
                sys.executable, str(INVALIDATE_SCRIPT),
                "--paths", "README.md",
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        assert result.returncode == 0  # no high-confidence stale → exit 0
        assert "No tracked dependencies invalidated" in result.stdout

    def test_no_paths_provided_no_changes(self):
        # If --paths is empty (or unspecified and working tree is clean),
        # report should be empty + exit 0
        # We pass an unmatched path here as a stand-in
        result = subprocess.run(
            [
                sys.executable, str(INVALIDATE_SCRIPT),
                "--paths", "completely-unrelated.txt",
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        assert result.returncode == 0


class TestEpisodeFilter:
    def test_filter_limits_to_one_episode(self):
        result = subprocess.run(
            [
                sys.executable, str(INVALIDATE_SCRIPT),
                "--paths",
                "episodes/prisoners-dilemma/script-production.md",
                "episodes/silicon-trap/script-production.md",
                "--episode", "prisoners-dilemma",
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        assert result.returncode == 1
        out = result.stdout
        assert "prisoners-dilemma" in out
        assert "silicon-trap" not in out

    def test_cross_cutting_change_surfaces_even_with_filter(self):
        # palette.json has no {slug} — should still surface under episode filter
        result = subprocess.run(
            [
                sys.executable, str(INVALIDATE_SCRIPT),
                "--paths", "tools/brand-treatment/palette.json",
                "--episode", "prisoners-dilemma",
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        # Should still report (palette affects all episodes including the filtered one)
        assert "palette.json" in result.stdout


class TestOutputFormats:
    def test_json_output(self):
        result = subprocess.run(
            [
                sys.executable, str(INVALIDATE_SCRIPT),
                "--paths", "episodes/prisoners-dilemma/script-production.md",
                "--json",
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        assert result.returncode == 1
        data = json.loads(result.stdout)
        assert data["invalidation_count"] >= 1
        assert "minimum_regen_set" in data
        assert "invalidations" in data
        # Sanity: the first invalidation should have captured the slug
        assert data["invalidations"][0]["captured_vars"]["slug"] == "prisoners-dilemma"

    def test_output_file(self, tmp_path):
        out_file = tmp_path / "report.md"
        result = subprocess.run(
            [
                sys.executable, str(INVALIDATE_SCRIPT),
                "--paths", "episodes/prisoners-dilemma/script-production.md",
                "-o", str(out_file),
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        assert result.returncode == 1
        assert out_file.is_file()
        content = out_file.read_text(encoding="utf-8")
        assert "Pipeline Invalidation Report" in content
        # Stdout shows a one-line summary
        assert "invalidation(s)" in result.stdout


class TestNoFail:
    def test_no_fail_returns_0_even_with_high_confidence_stale(self):
        result = subprocess.run(
            [
                sys.executable, str(INVALIDATE_SCRIPT),
                "--paths", "episodes/prisoners-dilemma/script-production.md",
                "--no-fail",
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        # Even though stale artifacts exist, --no-fail forces exit 0
        # (useful for informational pre-commit hooks).
        assert result.returncode == 0


class TestGraphLoadingErrors:
    def test_missing_graph_exits_2(self, tmp_path):
        result = subprocess.run(
            [
                sys.executable, str(INVALIDATE_SCRIPT),
                "--paths", "x",
                "--graph", str(tmp_path / "nope.json"),
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        assert result.returncode == 2
        assert "not found" in result.stderr

    def test_malformed_graph_exits_2(self, tmp_path):
        bad = tmp_path / "bad.json"
        bad.write_text("{not valid json", encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable, str(INVALIDATE_SCRIPT),
                "--paths", "x",
                "--graph", str(bad),
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        assert result.returncode == 2
