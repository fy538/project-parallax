"""
Unit tests for tools/lint/check_visual_hook.py.

Covers:
  · _extract_visual_hook_section — heading detection + section bounds
  · check_visual_hook — pass/fail per requirement
  · check_episode — severity rules respect pipeline state
  · CLI smoke (json + --strict + --soft + episode filter)
  · Real-data smoke against shipped viability docs
"""

from __future__ import annotations

import json
import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_visual_hook as cvh  # type: ignore[import-not-found]


# ── _extract_visual_hook_section ────────────────────────────────────────────


class TestExtractSection:
    def test_finds_standard_heading(self):
        text = textwrap.dedent("""\
            ### 5. Angle Gap
            stuff

            ### 6. Cold Open Visual Hook
            **What does the viewer SEE...**
            A constructivist research office scene.
            **Visual sourcing estimate:** Easy

            ## Format Recommendation
            next section
        """)
        section = cvh._extract_visual_hook_section(text)
        assert section is not None
        assert "Visual sourcing estimate" in section
        assert "Format Recommendation" not in section  # bounded by next heading

    def test_tolerates_naming_variants(self):
        for heading in (
            "### Cold Open Visual",
            "### Visual Hook",
            "### 6. Cold-Open Visual Hook",
            "### COLD OPEN VISUAL",
        ):
            text = f"{heading}\n\nA visual.\n**Visual sourcing estimate:** Easy\n"
            assert cvh._extract_visual_hook_section(text) is not None, f"failed: {heading}"

    def test_returns_none_when_no_heading(self):
        text = "### 5. Angle Gap\nNothing visual here.\n"
        assert cvh._extract_visual_hook_section(text) is None

    def test_section_ends_at_next_heading(self):
        text = (
            "### Visual Hook\n"
            "scene description here\n"
            "**Visual sourcing estimate:** Easy\n"
            "\n"
            "## Next Section\n"
            "this should not be included\n"
        )
        section = cvh._extract_visual_hook_section(text)
        assert "scene description" in section
        assert "Next Section" not in section


# ── check_visual_hook ───────────────────────────────────────────────────────


class TestCheckVisualHook:
    def _filled(self) -> str:
        return textwrap.dedent("""\
            ### 6. Cold Open Visual Hook
            **What does the viewer SEE in the first 15 seconds?**

            A constructivist research office: two geometric figures at a paper-grid
            table, warm amber light through venetian blinds. The textbook framing
            then appears: "Rational actors defect." Then it disappears in a flash
            and the RAND 60% experimental result lands.

            **Visual sourcing estimate:** Easy
        """)

    def test_filled_hook_passes(self):
        passes, issues = cvh.check_visual_hook(self._filled())
        assert passes, f"unexpected issues: {issues}"

    def test_missing_section_fails(self):
        text = "### 5. Angle Gap\nNothing about visuals.\n"
        passes, issues = cvh.check_visual_hook(text)
        assert not passes
        assert any("no Cold Open Visual Hook" in i for i in issues)

    def test_unfilled_template_fails(self):
        # The literal `[Easy / Moderate / Hard / Speculative]` placeholder
        # is the template default — must be replaced with a real verdict
        text = textwrap.dedent("""\
            ### 6. Cold Open Visual Hook
            A constructivist research office: two geometric figures, warm light.
            Long enough text to pass the word-count check easily.

            **Visual sourcing estimate:** [Easy / Moderate / Hard / Speculative]
        """)
        passes, issues = cvh.check_visual_hook(text)
        assert not passes
        assert any("placeholder" in i for i in issues)

    def test_missing_sourcing_estimate_fails(self):
        text = textwrap.dedent("""\
            ### 6. Cold Open Visual Hook
            A constructivist research office scene. Long enough body to be specific.

            (no sourcing estimate)
        """)
        passes, issues = cvh.check_visual_hook(text)
        assert not passes
        assert any("sourcing estimate" in i for i in issues)

    def test_too_thin_description_fails(self):
        # Section + estimate present but description is one word
        text = textwrap.dedent("""\
            ### 6. Cold Open Visual Hook

            **Visual sourcing estimate:** Easy
        """)
        passes, issues = cvh.check_visual_hook(text)
        assert not passes
        # Tight assertion — fail on the specific failure path, not
        # the more-general "section not found" branch which would
        # mask a different bug.
        assert any("too thin" in i for i in issues), \
            f"expected 'too thin' failure path, got: {issues}"

    def test_unfilled_template_does_not_false_pass(self):
        """REGRESSION: the unfilled template — bold question prompt +
        instructional brackets + glossary bullets + italic blockquote —
        previously cleared the 10-word floor on the bold question alone.
        That defeated the whole gate. After the body-stripping fix, only
        operator-supplied prose counts; the template alone fails."""
        unfilled = textwrap.dedent("""\
            ### 6. Cold Open Visual Hook
            **What does the viewer SEE in the first 15 seconds that makes them stop scrolling?**

            [1-3 sentences describing the CONCRETE visual. Not "we'll open with a hook"]

            **Visual sourcing estimate:** Easy
            - **Easy** — stock footage or familiar AI-gen pattern
            - **Moderate** — requires specific archival
            - **Hard** — expensive or expensive-to-iterate
            - **Speculative** — we don't yet know if this is sourcable

            _The visual-hook gate (Veritasium discipline): no topic should cross..._
        """)
        passes, issues = cvh.check_visual_hook(unfilled)
        assert not passes, "unfilled template should NOT pass — gate defeated"
        assert any("too thin" in i for i in issues), \
            f"expected the too-thin failure path; got: {issues}"

    @pytest.mark.parametrize("verdict", ["Easy", "Moderate", "Hard", "Speculative"])
    def test_each_valid_verdict_passes(self, verdict):
        text = textwrap.dedent(f"""\
            ### 6. Cold Open Visual Hook
            A constructivist research office: two geometric figures at a paper-grid
            table, warm amber light through venetian blinds. This is the framing image.

            **Visual sourcing estimate:** {verdict}
        """)
        passes, issues = cvh.check_visual_hook(text)
        assert passes, f"{verdict} should pass: {issues}"


# ── check_episode + severity rules ──────────────────────────────────────────


class TestCheckEpisode:
    def _setup_episode(self, tmp_path, monkeypatch, slug: str, viability_body: str = ""):
        ep_dir = tmp_path / "episodes" / slug
        ep_dir.mkdir(parents=True)
        if viability_body:
            (ep_dir / "viability.md").write_text(viability_body, encoding="utf-8")
        monkeypatch.setattr(cvh, "EPISODES_DIR", tmp_path / "episodes")
        return ep_dir

    def test_no_viability_doc_errors_for_viable_state(self, tmp_path, monkeypatch):
        self._setup_episode(tmp_path, monkeypatch, "alpha")
        f = cvh.check_episode("alpha", "VIABLE")
        assert f.level == "error"
        assert "no viability" in f.message

    def test_no_viability_doc_warns_for_incubating(self, tmp_path, monkeypatch):
        self._setup_episode(tmp_path, monkeypatch, "alpha")
        f = cvh.check_episode("alpha", "INCUBATING")
        assert f.level == "warn"

    def test_missing_hook_errors_for_viable(self, tmp_path, monkeypatch):
        body = "### 5. Angle Gap\nNothing visual.\n"
        self._setup_episode(tmp_path, monkeypatch, "alpha", body)
        f = cvh.check_episode("alpha", "VIABLE")
        assert f.level == "error"

    def test_missing_hook_warns_for_incubating(self, tmp_path, monkeypatch):
        body = "### 5. Angle Gap\nNothing visual.\n"
        self._setup_episode(tmp_path, monkeypatch, "alpha", body)
        f = cvh.check_episode("alpha", "INCUBATING")
        assert f.level == "warn"

    def test_filled_hook_passes_at_any_state(self, tmp_path, monkeypatch):
        body = textwrap.dedent("""\
            ### 6. Cold Open Visual Hook
            A constructivist scene with warm amber light through venetian blinds,
            two figures at a paper-grid table.

            **Visual sourcing estimate:** Easy
        """)
        for state in ("INCUBATING", "VIABLE", "RENDER READY"):
            self._setup_episode(tmp_path / state, monkeypatch, "x", body)
            f = cvh.check_episode("x", state)
            assert f.level == "ok", f"{state} unexpectedly failed: {f.message}"

    def test_missing_episode_directory_errors(self, tmp_path, monkeypatch):
        # Episode in pipeline-state but directory doesn't exist
        monkeypatch.setattr(cvh, "EPISODES_DIR", tmp_path / "episodes")
        f = cvh.check_episode("ghost", "VIABLE")
        assert f.level == "error"
        assert "directory missing" in f.message


# ── Real-data smoke ─────────────────────────────────────────────────────────


class TestRealEpisodes:
    """Smoke against the shipped viability docs. We expect them all to
    currently WARN (none have visual-hook sections yet — that's the
    intended state at toolchain rollout). Operator backfills over time."""

    def test_known_viability_docs_currently_fail(self):
        """As of the toolchain rollout, none of the shipped viability docs
        had the new visual-hook section. This test enshrines that intent
        until operator backfills retroactively — if it starts passing,
        someone added the section (good) and the test should be updated."""
        gates_passing = 0
        for slug in ("prisoners-dilemma", "silicon-trap", "blockades-leak"):
            doc = cvh._find_viability_doc(REPO_ROOT / "episodes" / slug)
            if doc is None:
                continue
            passes, issues = cvh.check_visual_hook(doc.read_text(encoding="utf-8"))
            if passes:
                gates_passing += 1
        # Backfill expectation: at most 1 doc currently passes
        # (when this hits 2+, update the threshold to track progress)
        assert gates_passing <= 1, (
            f"{gates_passing} viability docs now pass the visual-hook gate. "
            "Update this test's threshold to reflect the new baseline."
        )

    def test_lint_run_against_real_pipeline_state(self):
        # Lint should run on the real state file and produce findings for
        # the actual episodes. We don't assert pass/fail (operator backfills);
        # we assert the lint can RUN against real data.
        if not (REPO_ROOT / "episodes" / "pipeline-state.json").is_file():
            pytest.skip("pipeline-state.json not present")
        result = cvh.run_check()
        assert len(result.findings) >= 1


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_default_run(self):
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "lint" / "check_visual_hook.py")],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        # Either passes (0) or finds errors/warns (1) — both valid first-run states
        assert result.returncode in (0, 1)
        assert "Visual Hook Lint" in result.stdout

    def test_json_output(self):
        result = subprocess.run(
            [
                sys.executable, str(REPO_ROOT / "tools" / "lint" / "check_visual_hook.py"),
                "--json",
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        data = json.loads(result.stdout)
        assert isinstance(data, list)
        if data:
            assert "slug" in data[0]
            assert "level" in data[0]

    def test_episode_filter(self):
        result = subprocess.run(
            [
                sys.executable, str(REPO_ROOT / "tools" / "lint" / "check_visual_hook.py"),
                "--episode", "prisoners-dilemma",
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        # Output should be focused on the one episode
        assert "prisoners-dilemma" in result.stdout

    def test_soft_always_exits_0(self):
        result = subprocess.run(
            [
                sys.executable, str(REPO_ROOT / "tools" / "lint" / "check_visual_hook.py"),
                "--soft",
            ],
            capture_output=True, text=True, cwd=REPO_ROOT,
        )
        # --soft suppresses the non-zero exit even on errors
        assert result.returncode == 0
