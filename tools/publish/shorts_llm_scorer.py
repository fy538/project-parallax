#!/usr/bin/env python3
"""
shorts_llm_scorer.py — Claude scoring layer for shorts_proposer.

The heuristic shorts_proposer finds candidates by template type +
priority + duration sweet-spot. That picks the STRUCTURALLY relevant
moments. But for an analytical-essay channel, the "punchy beat" is
rarely the loudest — it's when the analogy snaps into focus, when its
limit is named cleanly, when one sentence carries the whole thesis.
Claude can judge that; a heuristic can't.

This module re-ranks the heuristic top-K via a structured prompt
embedding Parallax's bounded-analogy doctrine. Same I/O contract as
the heuristic path (in: ShortsCandidate list + manifest; out: same
list with `llm_score` + `llm_rationale` fields populated).

Design:
  · Pluggable LLM caller — tests inject a fake scorer, no real API hit
  · Default scorer uses Anthropic SDK if ANTHROPIC_API_KEY env is set
  · `--dry-run`-style preview mode exposes the prompt without calling

Why not score every rolling 30s window of the episode? At 12-13 min
runtime that's 25+ windows × API cost, and the heuristic already
filters to the structurally-relevant moments. Re-ranking the top-K
(default 10) is the sweet spot between cost and signal.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Callable, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from shorts_proposer import ShortsCandidate


# ── Doctrine prompt ─────────────────────────────────────────────────────────


# The bounded-analogy rubric Parallax's editorial doctrine names as the
# channel's signature form (per CLAUDE.md → Content philosophy).
SCORING_RUBRIC = """\
Score each candidate 0-100 against the Parallax bounded-analogy rubric:

  · SNAP MOMENT (0-30 pts) — Does the analogy or framework click into
    focus in this window? A snap moment is when the viewer goes from
    "interesting" to "oh — *that's* the structure." Pure setup or
    pure conclusion = low; the actual click = high.

  · BOUNDED MOMENT (0-25 pts) — Does the candidate name where the
    analogy breaks, or point at its limit? Parallax's signature form
    is "useful here, misleading there, dangerous if overextended."
    A candidate that ONLY makes the strong claim = lower; one that
    also names the limit = higher.

  · SELF-CONTAINED (0-25 pts) — Would a stranger who hasn't watched
    the long-form understand this in 30-45s? Strong candidates land
    without setup. Candidates that reference earlier beats opaquely
    ("as we saw before") = low.

  · VISUAL HOOK (0-20 pts) — Is there a strong concrete visual
    anchor for this moment (footage / chart / framework diagram /
    scene), or is it talking-head territory? Walls of typography
    without a concrete anchor = low.

Return ONLY a JSON object with this exact shape:

{
  "score": <integer 0-100>,
  "rationale": "<one or two sentences naming which rubric dimensions
                drove the score; cite specific narration phrases if
                they were decisive>"
}
"""


def build_scoring_prompt(
    candidate: "ShortsCandidate", narration_text: str,
) -> str:
    """Render the per-candidate scoring prompt. The candidate's
    structural metadata (template, beat, duration, kind) frames the
    request; the narration text is what the LLM actually judges."""
    return f"""You are scoring a candidate YouTube Short for Parallax, a channel that does analytical-essay videos on geopolitics-through-historical-analogy and philosophical frameworks. Parallax's signature form is the BOUNDED ANALOGY — "this analogy is useful here, misleading there, dangerous if overextended."

CANDIDATE:
  · Kind: {candidate.candidate_kind}
  · Source beat: {candidate.sourceBeat}
  · Long-form template: {candidate.template}
  · Time window: {candidate.startSec:.0f}s – {candidate.endSec:.0f}s ({candidate.durationSec:.0f}s)
  · Heuristic score (template type + priority + duration fit): {candidate.score}

NARRATION TEXT IN THIS WINDOW:
\"\"\"
{narration_text or '(no narration text found in manifest for this window)'}
\"\"\"

{SCORING_RUBRIC}
"""


# ── Narration extraction from manifest ─────────────────────────────────────


def collect_narration_for_window(
    manifest: dict, start_sec: float, end_sec: float,
) -> str:
    """Concatenate `narrationRef` snippets from segments that overlap
    the [start_sec, end_sec] window. Manifest segments carry per-
    segment narration tied to the script via `narrationRef`.

    Fallback: if the window contains only FOOTAGE / HOLD / TRANSITION
    segments (no `narrationRef`) — common for beat-opener windows that
    span an introductory footage clip + a typography card — fall back
    to collecting narrationRef from EVERY segment in the parent beat(s)
    so the LLM scorer doesn't get blind context for the opener.
    """
    in_window: list[str] = []
    beat_ids_in_window: set[str] = set()
    for seg in manifest.get("segments", []):
        seg_start = float(seg.get("startSec", 0))
        seg_end = float(seg.get("endSec", 0))
        if seg_start >= end_sec or seg_end <= start_sec:
            continue
        beat_id = seg.get("beat", "")
        if beat_id:
            beat_ids_in_window.add(beat_id)
        ref = seg.get("narrationRef", "") or ""
        if ref and ref not in in_window:
            in_window.append(ref)
    if in_window:
        return " ".join(in_window)
    # Fallback: pull narrationRef from every segment in the overlapping
    # beat(s). Better to give the LLM a too-broad context than none at all.
    # Capped at MAX_FALLBACK_CHARS to keep prompts bounded — a long beat
    # with 20 narration-bearing segments could otherwise add ~5KB+ of
    # input tokens per candidate.
    beat_level: list[str] = []
    chars_so_far = 0
    for seg in manifest.get("segments", []):
        if seg.get("beat") not in beat_ids_in_window:
            continue
        ref = seg.get("narrationRef", "") or ""
        if ref and ref not in beat_level:
            if chars_so_far + len(ref) > MAX_FALLBACK_CHARS:
                # Truncate the last entry to land at the cap, then stop
                room = MAX_FALLBACK_CHARS - chars_so_far
                if room > 80:
                    beat_level.append(ref[:room].rstrip() + "…")
                break
            beat_level.append(ref)
            chars_so_far += len(ref) + 1  # +1 for the joining space
    return " ".join(beat_level)


# ── Response parsing ───────────────────────────────────────────────────────


@dataclass
class LLMScoreResult:
    score: float
    rationale: str


def parse_llm_response(text: str) -> Optional[LLMScoreResult]:
    """Parse the structured JSON the LLM returns. Tolerant of code
    fences + prepended text. Returns None on unparseable input."""
    if not text:
        return None
    # Strip code fences if present
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    else:
        start = text.find("{")
        end = text.rfind("}")
        if start >= 0 and end > start:
            text = text[start:end + 1]
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        return None
    try:
        score = float(data.get("score", 0))
    except (TypeError, ValueError):
        return None
    # Clamp to [0, 100]
    score = max(0.0, min(100.0, score))
    return LLMScoreResult(
        score=score, rationale=str(data.get("rationale", "")),
    )


# ── Default Anthropic scorer (real API) ───────────────────────────────────


# Pluggable scorer signature: callable that takes a prompt and returns
# the raw LLM response text.
ScorerFn = Callable[[str], str]


# Default model: the dated ID is more reproducible than the bare alias
# (`claude-sonnet-4-5`) since the alias floats to whatever's current.
# Operators can override with --llm-model. The token budget is generous
# (was 400) because the rubric has 4 dimensions × short rationale + the
# JSON envelope; truncation mid-response → unparseable → silent drop.
DEFAULT_LLM_MODEL = "claude-sonnet-4-5-20250929"
DEFAULT_MAX_TOKENS = 800

# Cap on parent-beat narration when the in-window collection comes up
# empty (beat-opener candidates spanning mostly FOOTAGE/HOLD segments).
# 3000 chars ≈ 750 tokens — plenty of context for the LLM to judge
# without blowing the input budget on every candidate.
MAX_FALLBACK_CHARS = 3000


def make_anthropic_scorer(
    api_key: str, model: str = DEFAULT_LLM_MODEL,
    max_tokens: int = DEFAULT_MAX_TOKENS,
) -> ScorerFn:
    """Build a scorer that calls Anthropic's Messages API. Import is
    lazy so this module doesn't hard-require the SDK — tests + dry-run
    can use a fake scorer without installing it."""
    try:
        from anthropic import Anthropic
    except ImportError as e:
        raise RuntimeError(
            "anthropic SDK not installed — `pip install anthropic` or use "
            "a custom scorer."
        ) from e
    client = Anthropic(api_key=api_key)

    def _call(prompt: str) -> str:
        resp = client.messages.create(
            model=model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        # response.content is a list of content blocks; concatenate text blocks
        return "".join(
            getattr(block, "text", "") for block in resp.content
        )
    return _call


# ── Top-level re-ranker ───────────────────────────────────────────────────


def llm_rerank(
    candidates: list["ShortsCandidate"], manifest: dict,
    scorer: ScorerFn, top_k: Optional[int] = None,
) -> list["ShortsCandidate"]:
    """Score the top-K candidates with the LLM and re-sort by LLM score
    (desc; falls back to heuristic score for unscored / failed entries).

    Mutates candidates in-place to populate `llm_score` + `llm_rationale`.
    Returns the same list re-sorted.

    `top_k` defaults to all of `candidates` — pass an int to limit how
    many get LLM-scored (the rest keep llm_score=None and sort by
    heuristic score below the LLM-scored set).
    """
    n_to_score = len(candidates) if top_k is None else min(top_k, len(candidates))
    for cand in candidates[:n_to_score]:
        narration = collect_narration_for_window(
            manifest, cand.startSec, cand.endSec,
        )
        prompt = build_scoring_prompt(cand, narration)
        try:
            response = scorer(prompt)
        except Exception as e:  # noqa: BLE001 — scorer is user-supplied
            cand.llm_rationale = f"LLM call failed: {type(e).__name__}: {e}"
            continue
        result = parse_llm_response(response)
        if result is None:
            cand.llm_rationale = (
                f"LLM response unparseable (first 80 chars): "
                f"{response[:80] if response else '<empty>'}"
            )
            continue
        cand.llm_score = result.score
        cand.llm_rationale = result.rationale
    # Sort: LLM-scored first (by llm_score desc), then unscored
    # (by heuristic score desc). Tie-break by startSec for stability.
    def _sort_key(c: "ShortsCandidate"):
        # llm_score=None sorts after any scored candidate
        has_llm = c.llm_score is not None
        return (
            not has_llm,                  # False (i.e. 0) sorts before True
            -(c.llm_score or 0.0),
            -c.score,
            c.startSec,
        )
    candidates.sort(key=_sort_key)
    return candidates
