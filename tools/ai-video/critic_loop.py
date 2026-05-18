#!/usr/bin/env python3
"""
critic_loop.py — VISTA-style iterative critic for AI-generated assets.

Wraps any AI generator (Recraft / Flux / Kling / Sora) in a
generate → critique → re-prompt loop. The orchestrator is generic;
specific critics evaluate the generated artifact against the brand
brief and either ACCEPT or return a structured failure with hints
that get fed back into the next prompt.

Doctrine source: VISTA (Visual Inspector with Self-iTeration for Anchored
asset generation) — research pattern for iterative AI generation where a
critic agent grounds the loop in checkable properties (palette compliance,
typographic register, prompt-spec match) rather than vibes. The Parallax
adaptation is non-LLM: critics are pure functions over the artifact +
spec, so the loop is fast, free at the critic stage, and deterministic in
tests.

Architecture (pure functions, mockable):

  ┌─────────────┐    ┌───────────────┐    ┌──────────────────┐
  │ generator() │ →  │  critic[]     │ →  │ accept / refine  │
  └─────────────┘    └───────────────┘    └────────┬─────────┘
        ▲                                          │
        │              refined_prompt              │
        └──────────────────────────────────────────┘
              max_iters guard (cost budget deferred — generators are
              priced per call by the caller, not the loop)

Built-in critics:
  · palette_critic — dominant colors fall within brand palette tolerance
  · prompt_spec_critic — generated prompt mentions all required terms
  · dimension_critic — output dimensions match the spec
  · register_critic — declared register (analytical/atmospheric/grounding)
    cross-checked against tag heuristics in the artifact metadata

Usage (programmatic):

    from critic_loop import (
        run_critic_loop, GenerationSpec, palette_critic, prompt_spec_critic,
    )

    spec = GenerationSpec(
        prompt="constructivist boardroom, dust motes, gold accent",
        required_terms=["constructivist", "gold"],
        target_dimensions=(1920, 1080),
        register="atmospheric",
    )

    def my_generator(prompt: str) -> Artifact:
        # call recraft/flux/etc.
        ...

    result = run_critic_loop(
        spec, my_generator,
        critics=[palette_critic, prompt_spec_critic, dimension_critic],
        max_iters=4,
    )

    if result.accepted:
        print(f"✓ accepted after {result.iterations} iter(s)")
    else:
        print(f"✗ exhausted {result.iterations} iter(s)")

CLI smoke (uses a stub generator):

    python3 tools/ai-video/critic_loop.py --dry-run

Exit codes (CLI):
    0 — accepted within budget
    1 — exhausted iterations without acceptance
    2 — usage error
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from status_emoji import ERROR, OK  # noqa: E402

ROOT = get_project_root()
PALETTE_PATH = ROOT / "tools" / "brand-treatment" / "palette.json"

# ── Tunables ─────────────────────────────────────────────────────────────────

DEFAULT_MAX_ITERS = 4
DEFAULT_PALETTE_TOLERANCE = 24    # max euclidean RGB distance to a palette color
DEFAULT_PALETTE_COVERAGE = 0.7    # ≥70% of sampled pixels must hit a palette color
DEFAULT_DIMENSION_TOLERANCE = 16  # px difference allowed for dimension match


# ── Spec + Artifact ─────────────────────────────────────────────────────────


@dataclass
class GenerationSpec:
    """What the visual-spec wants from the generator."""
    prompt: str
    required_terms: list[str] = field(default_factory=list)
    target_dimensions: tuple[int, int] | None = None
    register: str | None = None  # "analytical" | "atmospheric" | "grounding"
    aspect_ratio: str | None = None  # "16:9" | "9:16" | "1:1"


@dataclass
class Artifact:
    """What the generator returns. Image or video frame sample.

    For testability, callers either pass `image_path` (real file) OR
    `pixel_sample` (list of (r,g,b) tuples) — critics handle both.
    """
    prompt_used: str
    image_path: Path | None = None
    pixel_sample: list[tuple[int, int, int]] | None = None
    dimensions: tuple[int, int] | None = None
    metadata: dict = field(default_factory=dict)


@dataclass
class CritiqueResult:
    """Per-critic verdict on one artifact."""
    name: str
    passed: bool
    score: float                         # 0..1, where 1 = perfect
    message: str
    refinement_hint: str = ""            # added to next prompt if !passed


@dataclass
class IterationRecord:
    """One pass through the loop — generator output + all critique results."""
    iteration: int
    prompt_used: str
    critiques: list[CritiqueResult] = field(default_factory=list)

    @property
    def passed_all(self) -> bool:
        return all(c.passed for c in self.critiques)

    @property
    def failed_critiques(self) -> list[CritiqueResult]:
        return [c for c in self.critiques if not c.passed]


@dataclass
class LoopResult:
    """Outcome of the full loop."""
    accepted: bool
    iterations: int
    final_artifact: Artifact | None
    history: list[IterationRecord] = field(default_factory=list)

    @property
    def total_critic_calls(self) -> int:
        return sum(len(r.critiques) for r in self.history)


# ── Palette loading ─────────────────────────────────────────────────────────


def _hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def load_palette_rgb(palette_path: Path = PALETTE_PATH) -> list[tuple[int, int, int]]:
    """Load every brand palette color as an RGB tuple. Combines `palette`
    + `semantic` + all entries in `ramps`. Returns [] on missing or
    malformed JSON (caller treats empty palette as "skip critic")."""
    if not palette_path.is_file():
        return []
    try:
        payload = json.loads(palette_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError) as e:
        print(f"⚠ critic_loop: palette load failed ({e}) — palette critic "
              f"will be skipped.", file=sys.stderr)
        return []
    hexes: list[str] = []
    for sect in ("palette", "semantic"):
        for v in payload.get(sect, {}).values():
            if isinstance(v, str) and v.startswith("#"):
                hexes.append(v)
    for ramp in payload.get("ramps", {}).values():
        for v in ramp:
            if isinstance(v, str) and v.startswith("#"):
                hexes.append(v)
    # Deduplicate while preserving order
    seen: set[str] = set()
    result: list[tuple[int, int, int]] = []
    for h in hexes:
        if h.lower() not in seen:
            seen.add(h.lower())
            result.append(_hex_to_rgb(h))
    return result


def _color_distance(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2) ** 0.5


def _sample_image_pixels(image_path: Path, sample_size: int = 64) -> list[tuple[int, int, int]]:
    """Downsample an image to a coarse pixel grid for color analysis.
    Returns empty list if PIL unavailable or image unreadable."""
    try:
        from PIL import Image
    except ImportError:
        return []
    try:
        img = Image.open(image_path).convert("RGB")
        img = img.resize((sample_size, sample_size))
        return list(img.getdata())
    except (OSError, ValueError):
        # OSError covers file-not-found, truncated, unidentified format.
        # ValueError covers PIL "cannot convert/resize" cases (rare).
        # Empty-list fallback keeps the critic loop running on bad images;
        # programming errors still bubble.
        return []


# ── Critics ──────────────────────────────────────────────────────────────────


Critic = Callable[[Artifact, GenerationSpec], CritiqueResult]


def palette_critic(
    artifact: Artifact, spec: GenerationSpec,
    tolerance: float = DEFAULT_PALETTE_TOLERANCE,
    coverage: float = DEFAULT_PALETTE_COVERAGE,
    palette: list[tuple[int, int, int]] | None = None,
) -> CritiqueResult:
    """Check that dominant colors fall within the brand palette."""
    if palette is None:
        palette = load_palette_rgb()
    if not palette:
        return CritiqueResult(
            "palette", True, 1.0,
            "palette not loaded — skipped (treat as pass)",
        )
    pixels = artifact.pixel_sample
    if pixels is None and artifact.image_path is not None:
        pixels = _sample_image_pixels(artifact.image_path)
    if not pixels:
        return CritiqueResult(
            "palette", True, 1.0,
            "no pixel data available — skipped (treat as pass)",
        )

    in_palette = 0
    for px in pixels:
        nearest = min(_color_distance(px, pc) for pc in palette)
        if nearest <= tolerance:
            in_palette += 1
    ratio = in_palette / len(pixels)
    passed = ratio >= coverage
    return CritiqueResult(
        name="palette",
        passed=passed,
        score=ratio,
        message=f"{int(ratio * 100)}% of sampled pixels within tolerance "
                f"(target ≥{int(coverage * 100)}%)",
        refinement_hint=(
            "" if passed
            else "Constrain palette: only use Meridian brand colors "
                 "(ink #1C1814, walnut #5C4A3D, umber #8B7355, taupe #B8A189, "
                 "sand #D9C9B0, bone #F0E6D0, paper #F5F0E8, gold #C4A747). "
                 "Avoid saturated reds, greens, blues outside this palette."
        ),
    )


def prompt_spec_critic(
    artifact: Artifact, spec: GenerationSpec,
) -> CritiqueResult:
    """Check that the prompt actually used by the generator contains every
    required term from the spec."""
    required = [t.lower() for t in spec.required_terms]
    if not required:
        return CritiqueResult(
            "prompt_spec", True, 1.0,
            "no required terms specified — skipped (treat as pass)",
        )
    prompt_l = artifact.prompt_used.lower()
    # Word-boundary match so "gold" doesn't satisfy "goldfish" and "us"
    # doesn't satisfy "trust". Term punctuation (hyphens, slashes) is
    # escaped via re.escape so multi-word required terms work too.
    missing = [
        t for t in required
        if not re.search(rf"\b{re.escape(t)}\b", prompt_l)
    ]
    score = (len(required) - len(missing)) / len(required)
    passed = not missing
    return CritiqueResult(
        name="prompt_spec",
        passed=passed,
        score=score,
        message=(
            "all required terms present"
            if passed
            else f"missing required terms: {missing}"
        ),
        refinement_hint=(
            "" if passed
            else f"Ensure the prompt explicitly mentions: {', '.join(missing)}."
        ),
    )


def dimension_critic(
    artifact: Artifact, spec: GenerationSpec,
    tolerance: int = DEFAULT_DIMENSION_TOLERANCE,
) -> CritiqueResult:
    """Output dimensions match the spec within a small tolerance."""
    if spec.target_dimensions is None:
        return CritiqueResult(
            "dimensions", True, 1.0,
            "no target dimensions specified — skipped (treat as pass)",
        )
    if artifact.dimensions is None:
        return CritiqueResult(
            "dimensions", True, 1.0,
            "no dimensions on artifact — skipped (treat as pass)",
        )
    tw, th = spec.target_dimensions
    aw, ah = artifact.dimensions
    dw, dh = abs(tw - aw), abs(th - ah)
    passed = dw <= tolerance and dh <= tolerance
    # Score: 1.0 if exact, drops linearly with each excess pixel.
    worst = max(dw, dh)
    score = max(0.0, 1.0 - (worst / max(tw, th)))
    return CritiqueResult(
        name="dimensions",
        passed=passed,
        score=score,
        message=f"got {aw}×{ah}, want {tw}×{th} (±{tolerance})",
        refinement_hint=(
            "" if passed
            else f"Render at exactly {tw}×{th}."
        ),
    )


_REGISTER_KEYWORDS = {
    "analytical": {
        "diagram", "chart", "axis", "label", "data", "framework",
        "graph", "plot", "annotation", "callout", "legend", "schema",
    },
    "atmospheric": {
        "dust", "haze", "mood", "silhouette", "particles", "fog", "smoke",
        "shadow", "backlit", "ambient", "vapor", "glow", "rays",
    },
    "grounding": {
        "office", "boardroom", "interior", "scene", "figure", "table", "room",
        "desk", "chair", "wall", "factory", "street", "kitchen", "warehouse",
        "lobby", "hall", "corridor", "workshop", "loading dock",
    },
}


def register_critic(
    artifact: Artifact, spec: GenerationSpec,
) -> CritiqueResult:
    """If the spec declares a register, ensure the prompt actually expresses it."""
    if not spec.register:
        return CritiqueResult(
            "register", True, 1.0,
            "no register specified — skipped (treat as pass)",
        )
    expected = spec.register.lower()
    keywords = _REGISTER_KEYWORDS.get(expected, set())
    if not keywords:
        return CritiqueResult(
            "register", True, 1.0,
            f"register '{expected}' has no keyword set — skipped",
        )
    prompt_l = artifact.prompt_used.lower()
    hits = sum(1 for k in keywords if k in prompt_l)
    # We want at least 1 hit; score ramps with hits up to 3.
    passed = hits >= 1
    score = min(1.0, hits / 3)
    return CritiqueResult(
        name="register",
        passed=passed,
        score=score,
        message=(
            f"register='{expected}' — {hits} keyword(s) present "
            f"({sorted(k for k in keywords if k in prompt_l)})"
        ),
        refinement_hint=(
            "" if passed
            else f"The register is '{expected}'. Include language from "
                 f"this domain: {sorted(keywords)[:4]}."
        ),
    )


BUILTIN_CRITICS: list[Critic] = [
    palette_critic, prompt_spec_critic, dimension_critic, register_critic,
]


# ── The loop ────────────────────────────────────────────────────────────────


_HINT_MARKER = "<<critic-loop:{name}>>"


def refine_prompt(base: str, failed: list[CritiqueResult]) -> str:
    """Build the next-iteration prompt by appending refinement hints from
    every failed critique.

    Each hint is wrapped in a per-critic marker (`<<critic-loop:NAME>>`),
    which lets a subsequent iteration REPLACE the previous hint for that
    critic instead of accumulating duplicate text. This avoids the
    'wall of imperatives' failure mode where iter 4's prompt is bloated
    with stale hints from iter 1–3.
    """
    out = base
    for c in failed:
        if not c.refinement_hint:
            continue
        marker = _HINT_MARKER.format(name=c.name)
        # Strip any previous hint for this critic, then re-append fresh.
        existing = re.compile(
            r"\s*" + re.escape(marker) + r"[^<]*" + re.escape(marker),
        )
        out = existing.sub("", out).rstrip()
        out = f"{out} {marker}{c.refinement_hint}{marker}"
    return out.strip()


Generator = Callable[[str], Artifact]


def run_critic_loop(
    spec: GenerationSpec,
    generator: Generator,
    critics: list[Critic] | None = None,
    max_iters: int = DEFAULT_MAX_ITERS,
) -> LoopResult:
    """Iterate generator → critique → refine until all critics pass or
    max_iters is exhausted. Returns a structured LoopResult."""
    if critics is None:
        critics = BUILTIN_CRITICS
    if max_iters < 1:
        raise ValueError("max_iters must be ≥ 1")

    history: list[IterationRecord] = []
    current_prompt = spec.prompt
    artifact: Artifact | None = None

    for i in range(1, max_iters + 1):
        try:
            artifact = generator(current_prompt)
        except Exception as e:  # noqa: BLE001 — generators may raise anything
            # Record a synthetic critique so the loop history captures the
            # failure rather than crashing mid-run and losing prior progress.
            err = CritiqueResult(
                name="generator",
                passed=False,
                score=0.0,
                message=f"generator raised {type(e).__name__}: {e}",
                refinement_hint="",
            )
            history.append(IterationRecord(
                iteration=i, prompt_used=current_prompt, critiques=[err],
            ))
            return LoopResult(
                accepted=False, iterations=i,
                final_artifact=None, history=history,
            )
        results = [c(artifact, spec) for c in critics]
        record = IterationRecord(
            iteration=i, prompt_used=current_prompt, critiques=results,
        )
        history.append(record)
        if record.passed_all:
            return LoopResult(
                accepted=True, iterations=i,
                final_artifact=artifact, history=history,
            )
        current_prompt = refine_prompt(current_prompt, record.failed_critiques)

    return LoopResult(
        accepted=False, iterations=max_iters,
        final_artifact=artifact, history=history,
    )


# ── Rendering ───────────────────────────────────────────────────────────────


def render_report_md(result: LoopResult, spec: GenerationSpec) -> str:
    lines: list[str] = [
        "# Critic-Loop Report",
        "",
        f"**Status:** {'✓ ACCEPTED' if result.accepted else '✗ EXHAUSTED'}",
        f"**Iterations:** {result.iterations}",
        f"**Critic calls:** {result.total_critic_calls}",
        "",
        "## Initial spec",
        "",
        f"- Prompt: `{spec.prompt}`",
    ]
    if spec.required_terms:
        lines.append(f"- Required terms: {spec.required_terms}")
    if spec.target_dimensions:
        lines.append(f"- Target dimensions: {spec.target_dimensions}")
    if spec.register:
        lines.append(f"- Register: {spec.register}")
    lines.extend(["", "## Iteration history", ""])
    for rec in result.history:
        lines.append(f"### Iteration {rec.iteration}")
        lines.append("")
        lines.append(f"_Prompt:_ `{rec.prompt_used}`")
        lines.append("")
        lines.append("| Critic | Verdict | Score | Note |")
        lines.append("|---|---|---|---|")
        for c in rec.critiques:
            icon = OK if c.passed else ERROR
            # Escape `|` in messages so a critic that mentions pipes
            # (file paths, regex literals, "a|b" examples) doesn't break
            # the markdown table layout.
            safe_msg = c.message.replace("|", "\\|")
            lines.append(
                f"| {c.name} | {icon} {'PASS' if c.passed else 'FAIL'} | "
                f"{c.score:.2f} | {safe_msg} |"
            )
        lines.append("")
    return "\n".join(lines) + "\n"


# ── CLI smoke ────────────────────────────────────────────────────────────────


def _stub_generator(prompt: str) -> Artifact:
    """A dry-run generator: returns the prompt verbatim with palette-safe
    pixels and exact target dimensions. Used by --dry-run."""
    # Sample one palette color for every pixel so palette_critic passes.
    palette = load_palette_rgb()
    sample = (palette * 64)[:64] if palette else [(28, 24, 20)] * 64
    return Artifact(
        prompt_used=prompt,
        pixel_sample=sample,
        dimensions=(1920, 1080),
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Run the loop with a stub generator (no API calls).",
    )
    parser.add_argument("--prompt", default="constructivist boardroom, gold accent")
    parser.add_argument(
        "--required-terms", nargs="*", default=["constructivist", "gold"],
    )
    parser.add_argument("--register", default="grounding")
    parser.add_argument("--max-iters", type=int, default=DEFAULT_MAX_ITERS)
    parser.add_argument("--json", action="store_true", help="Emit JSON instead of markdown.")
    args = parser.parse_args()

    if not args.dry_run:
        print("✗ critic_loop CLI requires --dry-run (real generators are "
              "called programmatically).", file=sys.stderr)
        return 2

    spec = GenerationSpec(
        prompt=args.prompt,
        required_terms=args.required_terms,
        target_dimensions=(1920, 1080),
        register=args.register,
    )
    result = run_critic_loop(spec, _stub_generator, max_iters=args.max_iters)
    if args.json:
        payload = {
            "accepted": result.accepted, "iterations": result.iterations,
            "critic_calls": result.total_critic_calls,
            "history": [
                {
                    "iteration": r.iteration, "prompt_used": r.prompt_used,
                    "critiques": [
                        {"name": c.name, "passed": c.passed,
                         "score": c.score, "message": c.message}
                        for c in r.critiques
                    ],
                }
                for r in result.history
            ],
        }
        sys.stdout.write(json.dumps(payload, indent=2) + "\n")
    else:
        sys.stdout.write(render_report_md(result, spec))
    return 0 if result.accepted else 1


if __name__ == "__main__":
    sys.exit(main())
