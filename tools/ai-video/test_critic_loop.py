"""
Unit tests for tools/ai-video/critic_loop.py.

Covers:
  · _hex_to_rgb + load_palette_rgb (palette parsing)
  · Each built-in critic (palette / prompt_spec / dimension / register) —
    pass / fail / skip-when-not-specified
  · refine_prompt — append hints, idempotent
  · run_critic_loop — accept-first-pass, exhaust, accept-after-refine,
    raises on bad max_iters
  · render_report_md
  · CLI smoke (--dry-run, --json)
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import critic_loop as cl  # type: ignore[import-not-found]


# ── Palette loading ─────────────────────────────────────────────────────────


class TestPaletteLoad:
    def test_hex_to_rgb(self):
        assert cl._hex_to_rgb("#1C1814") == (28, 24, 20)
        assert cl._hex_to_rgb("C4A747") == (196, 167, 71)

    def test_load_palette_combines_sections(self):
        palette = cl.load_palette_rgb()
        # We expect at least the 10 base colors + 3 semantic + ramp entries
        assert len(palette) >= 13
        # Ink and gold should be in there
        assert (28, 24, 20) in palette  # ink
        assert (196, 167, 71) in palette  # gold

    def test_load_palette_missing_returns_empty(self, tmp_path):
        assert cl.load_palette_rgb(tmp_path / "nonexistent.json") == []

    def test_color_distance_symmetric(self):
        d1 = cl._color_distance((0, 0, 0), (10, 10, 10))
        d2 = cl._color_distance((10, 10, 10), (0, 0, 0))
        assert d1 == d2


# ── palette_critic ──────────────────────────────────────────────────────────


class TestPaletteCritic:
    def test_skipped_when_palette_unavailable(self):
        artifact = cl.Artifact(prompt_used="x", pixel_sample=[(1, 1, 1)])
        spec = cl.GenerationSpec(prompt="x")
        result = cl.palette_critic(artifact, spec, palette=[])
        assert result.passed
        assert "palette not loaded" in result.message

    def test_skipped_when_no_pixels(self):
        artifact = cl.Artifact(prompt_used="x")
        spec = cl.GenerationSpec(prompt="x")
        # Provide a palette so loader doesn't short-circuit
        result = cl.palette_critic(artifact, spec, palette=[(0, 0, 0)])
        assert result.passed
        assert "no pixel data" in result.message

    def test_all_in_palette_passes(self):
        palette = [(28, 24, 20), (196, 167, 71)]
        # All pixels are exactly palette colors
        artifact = cl.Artifact(
            prompt_used="x", pixel_sample=[(28, 24, 20)] * 64,
        )
        result = cl.palette_critic(
            artifact, cl.GenerationSpec(prompt="x"), palette=palette,
        )
        assert result.passed
        assert result.score == 1.0

    def test_off_palette_fails(self):
        palette = [(28, 24, 20)]  # only one color, very dark
        # All pixels bright magenta — far from palette
        artifact = cl.Artifact(
            prompt_used="x", pixel_sample=[(255, 0, 255)] * 64,
        )
        result = cl.palette_critic(
            artifact, cl.GenerationSpec(prompt="x"),
            palette=palette, tolerance=20,
        )
        assert not result.passed
        assert result.score == 0.0
        assert "Constrain palette" in result.refinement_hint

    def test_partial_coverage_below_threshold_fails(self):
        palette = [(0, 0, 0)]
        # Half in, half out
        sample = [(0, 0, 0)] * 32 + [(255, 255, 255)] * 32
        artifact = cl.Artifact(prompt_used="x", pixel_sample=sample)
        result = cl.palette_critic(
            artifact, cl.GenerationSpec(prompt="x"),
            palette=palette, tolerance=10, coverage=0.7,
        )
        assert not result.passed
        assert 0.4 < result.score < 0.6


# ── prompt_spec_critic ──────────────────────────────────────────────────────


class TestPromptSpecCritic:
    def test_skipped_when_no_required_terms(self):
        artifact = cl.Artifact(prompt_used="anything goes")
        spec = cl.GenerationSpec(prompt="anything")
        result = cl.prompt_spec_critic(artifact, spec)
        assert result.passed

    def test_all_terms_present(self):
        artifact = cl.Artifact(prompt_used="constructivist gold boardroom")
        spec = cl.GenerationSpec(
            prompt="x", required_terms=["constructivist", "gold"],
        )
        result = cl.prompt_spec_critic(artifact, spec)
        assert result.passed
        assert result.score == 1.0

    def test_missing_term_fails(self):
        artifact = cl.Artifact(prompt_used="boardroom scene")
        spec = cl.GenerationSpec(
            prompt="x", required_terms=["constructivist", "gold"],
        )
        result = cl.prompt_spec_critic(artifact, spec)
        assert not result.passed
        assert "constructivist" in result.refinement_hint
        assert "gold" in result.refinement_hint
        assert result.score == 0.0

    def test_partial_terms_partial_score(self):
        artifact = cl.Artifact(prompt_used="constructivist scene")
        spec = cl.GenerationSpec(
            prompt="x", required_terms=["constructivist", "gold"],
        )
        result = cl.prompt_spec_critic(artifact, spec)
        assert not result.passed
        assert result.score == 0.5

    def test_case_insensitive(self):
        artifact = cl.Artifact(prompt_used="CONSTRUCTIVIST Gold scene")
        spec = cl.GenerationSpec(
            prompt="x", required_terms=["constructivist", "GOLD"],
        )
        result = cl.prompt_spec_critic(artifact, spec)
        assert result.passed


# ── dimension_critic ────────────────────────────────────────────────────────


class TestDimensionCritic:
    def test_skipped_when_no_target(self):
        artifact = cl.Artifact(prompt_used="x", dimensions=(100, 100))
        spec = cl.GenerationSpec(prompt="x")
        result = cl.dimension_critic(artifact, spec)
        assert result.passed

    def test_skipped_when_no_artifact_dims(self):
        artifact = cl.Artifact(prompt_used="x")
        spec = cl.GenerationSpec(prompt="x", target_dimensions=(1920, 1080))
        result = cl.dimension_critic(artifact, spec)
        assert result.passed

    def test_exact_match_passes(self):
        artifact = cl.Artifact(prompt_used="x", dimensions=(1920, 1080))
        spec = cl.GenerationSpec(prompt="x", target_dimensions=(1920, 1080))
        result = cl.dimension_critic(artifact, spec)
        assert result.passed
        assert result.score == 1.0

    def test_within_tolerance_passes(self):
        artifact = cl.Artifact(prompt_used="x", dimensions=(1920, 1090))
        spec = cl.GenerationSpec(prompt="x", target_dimensions=(1920, 1080))
        result = cl.dimension_critic(artifact, spec, tolerance=16)
        assert result.passed

    def test_outside_tolerance_fails(self):
        artifact = cl.Artifact(prompt_used="x", dimensions=(1024, 1024))
        spec = cl.GenerationSpec(prompt="x", target_dimensions=(1920, 1080))
        result = cl.dimension_critic(artifact, spec, tolerance=16)
        assert not result.passed
        assert "1920×1080" in result.refinement_hint


# ── register_critic ─────────────────────────────────────────────────────────


class TestRegisterCritic:
    def test_skipped_when_no_register(self):
        artifact = cl.Artifact(prompt_used="anything")
        spec = cl.GenerationSpec(prompt="x")
        result = cl.register_critic(artifact, spec)
        assert result.passed

    def test_atmospheric_keyword_passes(self):
        artifact = cl.Artifact(prompt_used="dust motes in a haze")
        spec = cl.GenerationSpec(prompt="x", register="atmospheric")
        result = cl.register_critic(artifact, spec)
        assert result.passed

    def test_wrong_register_keywords_fail(self):
        artifact = cl.Artifact(prompt_used="bright sunny park afternoon")
        spec = cl.GenerationSpec(prompt="x", register="analytical")
        result = cl.register_critic(artifact, spec)
        assert not result.passed
        assert "analytical" in result.refinement_hint

    def test_unknown_register_skipped(self):
        artifact = cl.Artifact(prompt_used="x")
        spec = cl.GenerationSpec(prompt="x", register="totally-fake")
        result = cl.register_critic(artifact, spec)
        assert result.passed


# ── refine_prompt ───────────────────────────────────────────────────────────


class TestRefinePrompt:
    def test_no_hints_returns_base(self):
        assert cl.refine_prompt("base prompt", []) == "base prompt"

    def test_appends_hint(self):
        crit = cl.CritiqueResult(
            name="x", passed=False, score=0.0, message="m",
            refinement_hint="Use gold accent.",
        )
        result = cl.refine_prompt("constructivist scene", [crit])
        assert "constructivist scene" in result
        assert "Use gold accent." in result

    def test_replaces_prior_hint_for_same_critic(self):
        # Iter N's hint for critic "x" should REPLACE iter N-1's hint
        # for "x", not accumulate. This prevents the "wall of imperatives"
        # bloat where a 4-iter loop ends with 4 stacked hints.
        crit_first = cl.CritiqueResult(
            name="x", passed=False, score=0.0, message="m",
            refinement_hint="Use ONLY gold.",
        )
        crit_second = cl.CritiqueResult(
            name="x", passed=False, score=0.0, message="m",
            refinement_hint="Use ONLY ink + gold.",
        )
        once = cl.refine_prompt("base scene", [crit_first])
        twice = cl.refine_prompt(once, [crit_second])
        # The fresher hint replaces the prior one for critic "x"
        assert "Use ONLY ink + gold." in twice
        assert "Use ONLY gold." not in twice
        # And only one marker pair remains for "x"
        assert twice.count("<<critic-loop:x>>") == 2  # opening + closing marker

    def test_different_critics_accumulate(self):
        # Hints from different critics should both land in the prompt.
        crit_a = cl.CritiqueResult(
            name="palette", passed=False, score=0, message="m",
            refinement_hint="Use gold.",
        )
        crit_b = cl.CritiqueResult(
            name="register", passed=False, score=0, message="m",
            refinement_hint="Include boardroom.",
        )
        out = cl.refine_prompt("scene", [crit_a, crit_b])
        assert "Use gold." in out
        assert "Include boardroom." in out

    def test_skips_empty_hints(self):
        crit = cl.CritiqueResult("x", False, 0, "m", refinement_hint="")
        assert cl.refine_prompt("base", [crit]) == "base"


# ── run_critic_loop ─────────────────────────────────────────────────────────


class _StubGen:
    """Stub generator that records calls and returns canned artifacts."""

    def __init__(self, artifacts: list[cl.Artifact]):
        self.artifacts = artifacts
        self.calls: list[str] = []

    def __call__(self, prompt: str) -> cl.Artifact:
        self.calls.append(prompt)
        idx = min(len(self.calls) - 1, len(self.artifacts) - 1)
        a = self.artifacts[idx]
        # Update prompt_used so prompt_spec_critic sees what we just sent
        return cl.Artifact(
            prompt_used=prompt, pixel_sample=a.pixel_sample,
            dimensions=a.dimensions, image_path=a.image_path,
            metadata=a.metadata,
        )


class TestRunCriticLoop:
    def test_accept_first_pass(self):
        spec = cl.GenerationSpec(
            prompt="constructivist gold scene",
            required_terms=["constructivist", "gold"],
        )
        gen = _StubGen([cl.Artifact(prompt_used="x")])
        result = cl.run_critic_loop(
            spec, gen, critics=[cl.prompt_spec_critic], max_iters=3,
        )
        assert result.accepted
        assert result.iterations == 1
        assert len(gen.calls) == 1

    def test_exhausts_when_generator_ignores_refinement(self):
        spec = cl.GenerationSpec(
            prompt="boardroom scene",
            required_terms=["constructivist"],
        )

        # Generator always returns the same prompt — won't satisfy spec
        def stuck_gen(prompt: str) -> cl.Artifact:
            return cl.Artifact(prompt_used="boardroom scene")

        result = cl.run_critic_loop(
            spec, stuck_gen, critics=[cl.prompt_spec_critic], max_iters=3,
        )
        assert not result.accepted
        assert result.iterations == 3

    def test_accept_after_refinement(self):
        spec = cl.GenerationSpec(
            prompt="boardroom scene",
            required_terms=["constructivist"],
        )
        # Default generator will receive the refined prompt (which contains
        # "constructivist" via refinement_hint) on iteration 2
        gen = _StubGen([cl.Artifact(prompt_used="x")])
        result = cl.run_critic_loop(
            spec, gen, critics=[cl.prompt_spec_critic], max_iters=4,
        )
        assert result.accepted
        assert result.iterations == 2
        # Iteration 2's prompt should mention 'constructivist'
        assert "constructivist" in gen.calls[1].lower()

    def test_invalid_max_iters_raises(self):
        with pytest.raises(ValueError):
            cl.run_critic_loop(
                cl.GenerationSpec(prompt="x"),
                lambda p: cl.Artifact(prompt_used=p),
                max_iters=0,
            )

    def test_generator_exception_captured_not_crashed(self):
        # Generator raises → loop returns failed result with the exception
        # recorded as a synthetic 'generator' critique. Prior history is
        # preserved so a partial run is still inspectable.
        def boom(prompt: str) -> cl.Artifact:
            raise RuntimeError("api rate-limited")

        spec = cl.GenerationSpec(prompt="x")
        result = cl.run_critic_loop(spec, boom, critics=[cl.prompt_spec_critic])
        assert not result.accepted
        assert result.iterations == 1
        # Synthetic generator critique recorded
        critiques = result.history[0].critiques
        assert any(c.name == "generator" for c in critiques)
        gen_crit = next(c for c in critiques if c.name == "generator")
        assert not gen_crit.passed
        assert "api rate-limited" in gen_crit.message

    def test_records_all_critique_calls(self):
        spec = cl.GenerationSpec(
            prompt="x", required_terms=["missing"],
        )
        gen = _StubGen([cl.Artifact(prompt_used="y")])
        result = cl.run_critic_loop(
            spec, gen,
            critics=[cl.prompt_spec_critic, cl.dimension_critic],
            max_iters=2,
        )
        # 2 critics × 2 iters = 4 critic calls
        assert result.total_critic_calls == 4


# ── render_report_md ────────────────────────────────────────────────────────


class TestRenderReport:
    def test_renders_accepted_and_iterations(self):
        spec = cl.GenerationSpec(
            prompt="x", required_terms=["a"], target_dimensions=(100, 100),
            register="atmospheric",
        )
        gen = _StubGen([cl.Artifact(prompt_used="a x", dimensions=(100, 100))])
        result = cl.run_critic_loop(
            spec, gen, critics=[cl.prompt_spec_critic, cl.dimension_critic],
            max_iters=2,
        )
        out = cl.render_report_md(result, spec)
        assert "ACCEPTED" in out
        assert "Iteration 1" in out
        assert "🟢" in out

    def test_renders_failures(self):
        spec = cl.GenerationSpec(prompt="x", required_terms=["missing"])

        def stuck_gen(prompt: str) -> cl.Artifact:
            return cl.Artifact(prompt_used="nothing helpful")

        result = cl.run_critic_loop(
            spec, stuck_gen, critics=[cl.prompt_spec_critic], max_iters=1,
        )
        out = cl.render_report_md(result, spec)
        assert "EXHAUSTED" in out
        assert "🔴" in out


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_dry_run_exits_0(self):
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "ai-video" / "critic_loop.py"),
                "--dry-run",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert "ACCEPTED" in result.stdout

    def test_dry_run_json(self):
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "ai-video" / "critic_loop.py"),
                "--dry-run", "--json",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert payload["accepted"] is True
        assert payload["iterations"] >= 1

    def test_no_dry_run_exits_2(self):
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "ai-video" / "critic_loop.py"),
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2
        assert "--dry-run" in result.stderr
