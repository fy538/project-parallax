"""
Unit tests for tools/narration/blind_review.py.

Coverage:
  · sanitize_read_doc removes all version-identifying markers
  · randomly_assign_labels respects seed for reproducibility
  · Coin flip distribution over many seeds is roughly even
  · prepare_blind_pair returns a usable prompt + assignment
  · CLI smoke (--prompt-only mode + default mode)
"""

from __future__ import annotations

import subprocess
import sys
import textwrap
from collections import Counter
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import blind_review as br  # type: ignore[import-not-found]


# ── sanitize_read_doc ───────────────────────────────────────────────────────


class TestSanitizeReadDoc:
    def test_strips_narration_title_with_slug(self):
        raw = "# Narration — prisoners-dilemma\n\nbody text"
        out = br.sanitize_read_doc(raw, label="Script A")
        assert "prisoners-dilemma" not in out
        assert "# Narration — Script A" in out

    def test_strips_regenerate_footer(self):
        raw = "body\n\n_Regenerate: `python3 tools/narration/format_for_reading.py prisoners-dilemma`_"
        out = br.sanitize_read_doc(raw, label="Script A")
        assert "Regenerate" not in out
        assert "prisoners-dilemma" not in out

    def test_strips_versioned_filename_references(self):
        raw = "based on script-v6-production.md"
        out = br.sanitize_read_doc(raw, label="Script A")
        assert "v6" not in out.lower()
        assert "[script file]" in out

    def test_strips_bare_version_mentions(self):
        raw = "this is v5.6 of the script"
        out = br.sanitize_read_doc(raw, label="Script A")
        assert "v5.6" not in out
        assert "[version]" in out

    def test_label_substituted_in_title(self):
        raw = "# Narration — anything-here"
        a_out = br.sanitize_read_doc(raw, label="Script A")
        b_out = br.sanitize_read_doc(raw, label="Script B")
        assert "Script A" in a_out
        assert "Script B" in b_out


# ── randomly_assign_labels ──────────────────────────────────────────────────


class TestRandomlyAssignLabels:
    def test_seed_pins_assignment(self, tmp_path):
        p1 = tmp_path / "first.md"; p1.write_bytes(b"x")
        p2 = tmp_path / "second.md"; p2.write_bytes(b"y")
        # Same seed → same assignment.
        a1 = br.randomly_assign_labels(p1, p2, seed=42)
        a2 = br.randomly_assign_labels(p1, p2, seed=42)
        assert a1.a_is_first_input == a2.a_is_first_input
        assert a1.script_a_path == a2.script_a_path

    def test_assignment_is_consistent_with_a_is_first_input_flag(self, tmp_path):
        p1 = tmp_path / "first.md"; p1.write_bytes(b"x")
        p2 = tmp_path / "second.md"; p2.write_bytes(b"y")
        a = br.randomly_assign_labels(p1, p2, seed=0)
        if a.a_is_first_input:
            assert a.script_a_path == p1
            assert a.script_b_path == p2
        else:
            assert a.script_a_path == p2
            assert a.script_b_path == p1

    def test_distribution_over_many_seeds_is_roughly_even(self, tmp_path):
        # Confirm the coin flip is fair — 1000 seeds should land within
        # 5% of 50/50.
        p1 = tmp_path / "f.md"; p1.write_bytes(b"x")
        p2 = tmp_path / "s.md"; p2.write_bytes(b"y")
        counts = Counter(
            br.randomly_assign_labels(p1, p2, seed=s).a_is_first_input
            for s in range(1000)
        )
        # Both buckets present and close to 50/50.
        assert counts[True] > 400
        assert counts[False] > 400


# ── render_sanitized_read_doc + prepare_blind_pair ──────────────────────────


class TestPrepareBlindPair:
    @staticmethod
    def _make_script(tmp_path: Path, name: str, body: str) -> Path:
        p = tmp_path / name
        p.write_text(textwrap.dedent("""\
            ## BEAT 1 — TEST

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
        """) + body, encoding="utf-8")
        return p

    def test_returns_assignment_and_prompt(self, tmp_path):
        s1 = self._make_script(tmp_path, "s1.md", "| Hello. | x |\n")
        s2 = self._make_script(tmp_path, "s2.md", "| World. | y |\n")
        assignment, prompt = br.prepare_blind_pair(s1, s2, seed=1)
        # The prompt should contain both anonymized scripts AND the
        # five-question instructions.
        assert "SCRIPT A" in prompt
        assert "SCRIPT B" in prompt
        assert "Cold-open verdict" in prompt
        assert "Overall: which would you watch end to end" in prompt

    def test_prompt_contains_neither_filename(self, tmp_path):
        s1 = self._make_script(tmp_path, "version5.md", "| Hello. | x |\n")
        s2 = self._make_script(tmp_path, "version6.md", "| World. | y |\n")
        _, prompt = br.prepare_blind_pair(s1, s2, seed=2)
        assert "version5" not in prompt
        assert "version6" not in prompt

    def test_assignment_reveals_correct_paths(self, tmp_path):
        s1 = self._make_script(tmp_path, "s1.md", "| Hello. | x |\n")
        s2 = self._make_script(tmp_path, "s2.md", "| World. | y |\n")
        a, _ = br.prepare_blind_pair(s1, s2, seed=3)
        # The reveal-summary string should name the actual filenames so
        # the operator can map labels back after the review.
        assert "s1.md" in a.reveal_summary or "s2.md" in a.reveal_summary


# ── render_review_report ────────────────────────────────────────────────────


class TestRenderReviewReport:
    def test_report_includes_verdict_and_reveal(self, tmp_path):
        p1 = tmp_path / "first.md"; p1.write_bytes(b"x")
        p2 = tmp_path / "second.md"; p2.write_bytes(b"y")
        a = br.randomly_assign_labels(p1, p2, seed=4)
        out = br.render_review_report(
            a, reviewer_verdict="The reviewer chose Script A because…",
            name_first="first.md", name_second="second.md",
        )
        assert "Script A because" in out
        assert "Reveal" in out


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_prompt_only_writes_prompt_to_stdout_reveal_to_stderr(self, tmp_path):
        for name in ("a.md", "b.md"):
            (tmp_path / name).write_text(textwrap.dedent("""\
                ## BEAT 1 — TEST

                | NARRATION | VISUAL PRODUCTION |
                |-----------|-------------------|
                | Hello. | x |
            """), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "blind_review.py"),
                str(tmp_path / "a.md"), str(tmp_path / "b.md"),
                "--seed", "42", "--prompt-only",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0, result.stderr
        # Prompt to stdout
        assert "SCRIPT A" in result.stdout
        # Reveal mapping to stderr (separate stream so it doesn't poison reviewer)
        assert "label reveal" in result.stderr
        assert "Script A =" in result.stderr

    def test_default_mode_writes_full_report(self, tmp_path):
        for name in ("a.md", "b.md"):
            (tmp_path / name).write_text(textwrap.dedent("""\
                ## BEAT 1 — TEST

                | NARRATION | VISUAL PRODUCTION |
                |-----------|-------------------|
                | Hello. | x |
            """), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "blind_review.py"),
                str(tmp_path / "a.md"), str(tmp_path / "b.md"),
                "--seed", "42",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0, result.stderr
        assert "Blind Review Report" in result.stdout
        # Both the reveal section and the prompt should be in the report
        assert "Label reveal" in result.stdout
        assert "Reviewer prompt" in result.stdout

    def test_missing_script_exits_2(self, tmp_path):
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "blind_review.py"),
                str(tmp_path / "nope.md"), str(tmp_path / "nope2.md"),
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
