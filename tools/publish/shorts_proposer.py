#!/usr/bin/env python3
"""
shorts_proposer.py — propose Shorts candidates from an assembly manifest.

`npm run shorts` exists, but `shorts-manifest.json` is hand-authored
per episode. This tool scans the assembly manifest + script for
high-signal moments that make good standalone Shorts and emits a
proposal manifest the operator reviews + fills in.

Doctrine — what makes a good Short (per channel-research from MrBeast,
Veritasium-Shorts, Lemmino-Shorts):

  · Self-contained: lands without setup
  · One clear point: a single stat, quote, or insight
  · Visual immediately: don't open on talking head
  · 15-60s: YouTube Shorts ceiling
  · Hook in first 2s: most viewers decide before that

What the proposer surfaces:

  1. STAT REVEAL    — TEMPLATE/DataChart or TEMPLATE/StatCaption segments
                      (a single landing number with comparison)
  2. QUOTE          — TEMPLATE/Quote or TEMPLATE/QuoteAttribution segments
                      (cited single-line moments)
  3. FRAMEWORK      — TEMPLATE/FrameworkDiagram segments
                      (one diagram explaining one concept)
  4. BEAT OPENER    — first 25-45s of each beat
                      (often carries the misconception pivot or hook)

Each candidate is scored on:
  · Has anchor visual (footage / archival / chart / scene): +2
  · Hits 25-45s duration band: +2 (Shorts sweet spot)
  · P1 / P2 priority in the manifest: +1
  · Beat opener: +1 (hook moments are inherently Shorts-ready)

Top-N (default 5) candidates are emitted as a SKELETON
`shorts-manifest-proposed.json` — operator reviews, picks the keepers,
fills in the template-specific `data` block (which the proposer can't
know without script-level understanding), and renames to
`shorts-manifest.json`.

Usage:
    python3 tools/publish/shorts_proposer.py <slug>
    python3 tools/publish/shorts_proposer.py <slug> --top 8
    python3 tools/publish/shorts_proposer.py <slug> --json
    python3 tools/publish/shorts_proposer.py <slug> --emit-manifest

Exit codes:
    0 — proposals emitted
    1 — manifest had no qualifying segments (rare; usually means stub
         manifest that hasn't been built out yet)
    2 — usage / missing inputs
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"
REMOTION_DATA = ROOT / "remotion-templates" / "data" / "episodes"

# ── Tunables ─────────────────────────────────────────────────────────────────

DEFAULT_TOP_N = 5

# Shorts sweet spot — the band where YouTube Shorts retention is best
# (per published channel-research). Below 15s feels unfinished; above
# 50s loses a meaningful chunk of viewers per platform analytics.
SHORTS_MIN_SEC = 15.0
SHORTS_MAX_SEC = 50.0
SHORTS_SWEET_MIN = 25.0
SHORTS_SWEET_MAX = 45.0

# Beat-opener window — how much of each beat's start to consider as a
# potential hook moment. Most beat openers land their hook within ~30s.
BEAT_OPENER_SEC = 30.0

# Template-name → Shorts-template mapping. When the long-form composition
# uses one of these MG templates, the equivalent Shorts template is the
# natural lift-and-shift.
TEMPLATE_TO_SHORTS = {
    "DataChart": "DataChartShort",
    "StatCaption": "StatRevealShort",
    "Quote": "KineticShort",            # variant=quote
    "QuoteAttribution": "KineticShort",  # variant=quote
    "FrameworkDiagram": "FrameworkDiagram-Short",
    "ChoroplethMap": "ChoroplethMap-Short",
    "SplitComposition": "SplitComposition-Short",
    "ProbabilityGauge": "ProbabilityGauge-Short",
    "TimelineComparison": "TimelineComparison-Short",
    "HorizontalTimeline": "TimelineComparison-Short",
}

# Anchor segment types per the canonical assembly-manifest schema.
# FOOTAGE = stock video; IMAGE = still photo/archival/AI-gen scene.
# (The script-side tags `[ARCHIVAL:]` / `[AI-GEN:]` all resolve to
# manifest type `IMAGE` — they're distinguished by `asset.source` field
# but for Shorts-candidacy purposes, all images are anchors.)
ANCHOR_SEGMENT_TYPES = {"FOOTAGE", "IMAGE"}
# TEMPLATE segments whose Remotion component carries concrete-evidence
# weight (chart / map / framework / annotated image).
ANCHOR_TEMPLATE_COMPONENTS = {
    "DataChart", "FrameworkDiagram", "ChoroplethMap", "ProportionalSymbolMap",
    "GameBoard", "TimeSeriesChart", "AnnotatedImage", "EscalationLadder",
    "NetworkDiagram", "RouteMap", "AtlasMap", "ArcDiagram", "BumpChart",
    "BeeswarmChart", "DumbbellChart", "DuelingChart", "HorizontalTimeline",
    "Sankey", "Marimekko", "TernaryPlot", "Tilegram", "Cartogram",
    "ProbabilityGauge", "PricingWaterfall",
}


# ── Data shapes ──────────────────────────────────────────────────────────────


@dataclass
class ShortsCandidate:
    """One proposed Short candidate."""
    candidate_kind: str          # "stat" | "quote" | "framework" | "beat_opener"
    sourceBeat: str              # e.g. "Beat 1: THE PARADOX"
    beat_id: str                 # "beat1"
    template: str                # Remotion Shorts template name
    startSec: float
    endSec: float
    durationSec: float
    score: int                   # heuristic composite ranking score
    label: str                   # human-readable description
    rationale: str               # why this got proposed
    notes: str = ""              # operator notes (which inner template + data to fill)
    # Optional LLM-scoring fields, populated only when --llm-score is used.
    # Bounded-analogy rubric: a candidate scores higher when an analogy
    # "snaps into focus" / when its limit is named cleanly / when it
    # stands alone without setup. The heuristic score gets WHAT to score;
    # the LLM score gets WHICH OF THESE deserves the operator's attention.
    llm_score: float | None = None     # 0-100 (None = not scored)
    llm_rationale: str = ""


@dataclass
class ProposalReport:
    slug: str
    manifest_path: str
    total_candidates: int
    candidates: list[ShortsCandidate] = field(default_factory=list)


# ── Manifest loading ────────────────────────────────────────────────────────


def _default_manifest_path(slug: str) -> Path:
    return REMOTION_DATA / slug / "assembly-manifest.json"


def load_manifest(path: Path) -> dict:
    """Read the assembly manifest. Returns the raw dict (no validation —
    the proposer is read-only and tolerates partial manifests)."""
    return json.loads(path.read_text(encoding="utf-8"))


# ── Candidate identification ────────────────────────────────────────────────


def _segment_template_name(seg: dict) -> str:
    """Extract the Remotion component name from a TEMPLATE segment.

    Canonical schema: `segment.template.component` (per
    `remotion-templates/data/assembly-manifest.schema.json`). Older or
    hand-authored manifests may use `template.name` or a bare string;
    we accept all three for forward/backward compatibility.
    Returns empty string if absent.
    """
    tmpl = seg.get("template")
    if isinstance(tmpl, dict):
        return tmpl.get("component") or tmpl.get("name", "")
    if isinstance(tmpl, str):
        return tmpl
    return ""


def _segment_data_file(seg: dict) -> str:
    """Pull `template.dataFile` safely. The template field may be a
    string in hand-authored or legacy manifests; in that case `.get()`
    would AttributeError. Returns a placeholder string when no
    dataFile is available."""
    tmpl = seg.get("template")
    if isinstance(tmpl, dict):
        return tmpl.get("dataFile", "<framework data file>") or "<framework data file>"
    return "<framework data file>"


def _is_anchor_segment(seg: dict) -> bool:
    """Does this segment carry concrete-evidence weight?

    FOOTAGE / IMAGE segments are anchors by type. TEMPLATE segments are
    anchors only when their `component` is in ANCHOR_TEMPLATE_COMPONENTS
    (chart / map / framework / annotated image). KineticTypography /
    Quote / Definition / TitleTransition TEMPLATEs are NOT anchors —
    they're typography over whatever's underneath.
    """
    seg_type = seg.get("type", "").upper()
    if seg_type in ANCHOR_SEGMENT_TYPES:
        return True
    if seg_type == "TEMPLATE":
        return _segment_template_name(seg) in ANCHOR_TEMPLATE_COMPONENTS
    return False


def _duration_score(dur: float) -> int:
    """+2 if in sweet-spot band, +1 if in usable band, 0 otherwise."""
    if SHORTS_SWEET_MIN <= dur <= SHORTS_SWEET_MAX:
        return 2
    if SHORTS_MIN_SEC <= dur <= SHORTS_MAX_SEC:
        return 1
    return 0


def _priority_score(seg: dict) -> int:
    """+1 for P1/P2 segments (production-prioritized = generally stronger)."""
    pri = (seg.get("priority") or "").upper()
    return 1 if pri in ("P1", "P2") else 0


def _beat_title_lookup(manifest: dict) -> dict[str, str]:
    """Map beat_id → 'Beat N: TITLE' label."""
    out: dict[str, str] = {}
    for i, b in enumerate(manifest.get("beats", []), 1):
        beat_id = b.get("id", "")
        title = b.get("title", "")
        out[beat_id] = f"Beat {i}: {title}".strip(": ")
    return out


def _propose_stat_candidates(manifest: dict, beat_labels: dict[str, str]) -> list[ShortsCandidate]:
    """TEMPLATE segments whose component is DataChart or StatCaption."""
    out: list[ShortsCandidate] = []
    for seg in manifest.get("segments", []):
        if seg.get("type", "").upper() != "TEMPLATE":
            continue
        tmpl = _segment_template_name(seg)
        if tmpl not in ("DataChart", "StatCaption"):
            continue
        dur = max(0.0, float(seg.get("endSec", 0)) - float(seg.get("startSec", 0)))
        # Pad short charts to the Shorts minimum so the candidate is
        # actually usable; the operator can tighten later.
        target_dur = max(dur, SHORTS_MIN_SEC)
        if target_dur > SHORTS_MAX_SEC:
            target_dur = SHORTS_MAX_SEC
        beat_id = seg.get("beat", "")
        score = _duration_score(target_dur) + _priority_score(seg) + 2  # anchor by construction
        shorts_template = TEMPLATE_TO_SHORTS.get(tmpl)
        if shorts_template is None:
            print(
                f"⚠ shorts_proposer: template '{tmpl}' has no entry in "
                f"TEMPLATE_TO_SHORTS — routing to StatRevealShort as fallback. "
                f"Add a mapping to silence this warning.",
                file=sys.stderr,
            )
            shorts_template = "StatRevealShort"
        out.append(ShortsCandidate(
            candidate_kind="stat",
            sourceBeat=beat_labels.get(beat_id, beat_id),
            beat_id=beat_id,
            template=shorts_template,
            startSec=float(seg.get("startSec", 0)),
            endSec=float(seg.get("startSec", 0)) + target_dur,
            durationSec=target_dur,
            score=score,
            label=f"Stat reveal — {seg.get('id', '')}",
            rationale=f"MG/{tmpl} segment at {seg.get('startSec', 0):.0f}s. "
                      f"Single-stat moments lift to StatRevealShort/DataChartShort cleanly.",
            notes=f"Fill `data.stat` block from the source chart at "
                  f"{seg.get('asset', {}).get('shotListId', 'chart data file')}.",
        ))
    return out


def _propose_quote_candidates(manifest: dict, beat_labels: dict[str, str]) -> list[ShortsCandidate]:
    """TEMPLATE segments whose component is Quote or QuoteAttribution."""
    out: list[ShortsCandidate] = []
    for seg in manifest.get("segments", []):
        if seg.get("type", "").upper() != "TEMPLATE":
            continue
        tmpl = _segment_template_name(seg)
        if tmpl not in ("Quote", "QuoteAttribution"):
            continue
        dur = max(0.0, float(seg.get("endSec", 0)) - float(seg.get("startSec", 0)))
        target_dur = max(dur, SHORTS_MIN_SEC)
        if target_dur > SHORTS_MAX_SEC:
            target_dur = SHORTS_MAX_SEC
        beat_id = seg.get("beat", "")
        # Quotes are anchors by editorial weight, not by anchor-tag class
        score = _duration_score(target_dur) + _priority_score(seg) + 2
        out.append(ShortsCandidate(
            candidate_kind="quote",
            sourceBeat=beat_labels.get(beat_id, beat_id),
            beat_id=beat_id,
            template="KineticShort",
            startSec=float(seg.get("startSec", 0)),
            endSec=float(seg.get("startSec", 0)) + target_dur,
            durationSec=target_dur,
            score=score,
            label=f"Quote — {seg.get('id', '')}",
            rationale=f"MG/{tmpl} segment at {seg.get('startSec', 0):.0f}s. "
                      f"Quotes carry their own context and lift cleanly to KineticShort/quote.",
            notes="Fill `data.variant='quote'`, `data.text`, `data.attribution`.",
        ))
    return out


def _propose_framework_candidates(manifest: dict, beat_labels: dict[str, str]) -> list[ShortsCandidate]:
    """TEMPLATE segments whose component is FrameworkDiagram — one
    diagram lifts to one Short."""
    out: list[ShortsCandidate] = []
    for seg in manifest.get("segments", []):
        if seg.get("type", "").upper() != "TEMPLATE":
            continue
        tmpl = _segment_template_name(seg)
        if tmpl != "FrameworkDiagram":
            continue
        dur = max(0.0, float(seg.get("endSec", 0)) - float(seg.get("startSec", 0)))
        target_dur = max(dur, SHORTS_MIN_SEC)
        if target_dur > SHORTS_MAX_SEC:
            target_dur = SHORTS_MAX_SEC
        beat_id = seg.get("beat", "")
        score = _duration_score(target_dur) + _priority_score(seg) + 2
        out.append(ShortsCandidate(
            candidate_kind="framework",
            sourceBeat=beat_labels.get(beat_id, beat_id),
            beat_id=beat_id,
            template="FrameworkDiagram-Short",
            startSec=float(seg.get("startSec", 0)),
            endSec=float(seg.get("startSec", 0)) + target_dur,
            durationSec=target_dur,
            score=score,
            label=f"Framework — {seg.get('id', '')}",
            rationale="FrameworkDiagram segment. One diagram → one Short is the cleanest "
                      "shape (a self-contained concept).",
            notes=f"Reuse the framework data file from "
                  f"{_segment_data_file(seg)}.",
        ))
    return out


def _propose_beat_opener_candidates(
    manifest: dict, beat_labels: dict[str, str],
) -> list[ShortsCandidate]:
    """First BEAT_OPENER_SEC of each beat — often the misconception pivot
    or the hook moment of that beat. Score boosted if the opening
    segments are anchor-bearing."""
    out: list[ShortsCandidate] = []
    segments = manifest.get("segments", [])
    for b in manifest.get("beats", []):
        beat_id = b.get("id", "")
        beat_start = float(b.get("startSec", 0))
        beat_end = float(b.get("endSec", 0))
        opener_end = min(beat_start + BEAT_OPENER_SEC, beat_end)
        opener_dur = opener_end - beat_start
        if opener_dur < SHORTS_MIN_SEC:
            continue  # beat too short to host an opener Short

        # Look at the segments that fall in the opener window for anchor presence
        opener_segs = [
            s for s in segments
            if s.get("beat") == beat_id
            and float(s.get("startSec", 0)) < opener_end
        ]
        has_anchor = any(_is_anchor_segment(s) for s in opener_segs)
        score = _duration_score(opener_dur) + (2 if has_anchor else 0) + 1  # +1 opener bonus
        # Skip openers that have NO anchor AND wouldn't even hit the
        # mid-band duration score — a 30s talking-head opener with no
        # visual evidence isn't a Short worth proposing.
        if not has_anchor and _duration_score(opener_dur) == 0:
            continue
        out.append(ShortsCandidate(
            candidate_kind="beat_opener",
            sourceBeat=beat_labels.get(beat_id, beat_id),
            beat_id=beat_id,
            template="KineticShort",
            startSec=beat_start,
            endSec=opener_end,
            durationSec=opener_dur,
            score=score,
            label=f"Beat opener — {beat_labels.get(beat_id, beat_id)}",
            rationale=f"First {opener_dur:.0f}s of {beat_labels.get(beat_id, beat_id)}. "
                      f"Beat openers carry the hook / misconception pivot and are "
                      f"often self-contained moments worth lifting."
                      + ("" if has_anchor else " ⚠ no anchor visual in opener — consider revising."),
            notes="Distill the opening 1-2 sentences of narration. Pick KineticShort "
                  "variant='hook' or variant='misconception-pivot' based on the script tone.",
        ))
    return out


def propose_shorts(
    manifest: dict, top_n: int = DEFAULT_TOP_N,
) -> list[ShortsCandidate]:
    """Score all candidate types, return the top N by score (desc).
    Tiebreak: stat > framework > quote > beat_opener (rough rank by
    self-containedness for Shorts-format)."""
    beat_labels = _beat_title_lookup(manifest)
    candidates: list[ShortsCandidate] = []
    candidates.extend(_propose_stat_candidates(manifest, beat_labels))
    candidates.extend(_propose_quote_candidates(manifest, beat_labels))
    candidates.extend(_propose_framework_candidates(manifest, beat_labels))
    candidates.extend(_propose_beat_opener_candidates(manifest, beat_labels))

    kind_priority = {"stat": 4, "framework": 3, "quote": 2, "beat_opener": 1}
    candidates.sort(
        key=lambda c: (
            -c.score,
            -kind_priority.get(c.candidate_kind, 0),
            c.startSec,
        ),
    )
    return candidates[:top_n]


# ── Output ──────────────────────────────────────────────────────────────────


def render_proposal_md(report: ProposalReport) -> str:
    any_llm_scored = any(c.llm_score is not None for c in report.candidates)
    lines = [
        f"# Shorts Candidate Proposals — {report.slug}",
        "",
        f"_Scanned `{report.manifest_path}` for high-signal moments that "
        f"make good standalone Shorts. Each candidate below is a SKELETON — "
        f"review the rationale, pick the keepers, fill in the template-"
        f"specific `data` block (the proposer can't know that without "
        f"script-level understanding), then promote `shorts-manifest-"
        f"proposed.json` to `shorts-manifest.json`._",
        "",
    ]
    if any_llm_scored:
        lines.append(
            "_LLM-scored: candidates re-ranked via Claude scoring against "
            "the Parallax bounded-analogy rubric (snap moment / bounded "
            "moment / self-contained / visual hook). Heuristic score "
            "shown alongside for cross-reference._"
        )
        lines.append("")
    lines.extend([
        f"**Total candidates considered:** {report.total_candidates}",
        f"**Top N proposed:** {len(report.candidates)}",
        "",
        "## Proposed candidates (highest score first)",
        "",
    ])
    if any_llm_scored:
        lines.append("| # | Kind | Beat | Dur | Template | LLM | Heur | Label |")
        lines.append("|---|---|---|---|---|---|---|---|")
        for i, c in enumerate(report.candidates, 1):
            llm = f"{c.llm_score:.0f}" if c.llm_score is not None else "—"
            lines.append(
                f"| {i} | {c.candidate_kind} | _{c.sourceBeat[:25]}_ | "
                f"{c.durationSec:.0f}s | `{c.template}` | **{llm}** | "
                f"{c.score} | {c.label} |"
            )
    else:
        lines.append("| # | Kind | Beat | Duration | Template | Score | Label |")
        lines.append("|---|---|---|---|---|---|---|")
        for i, c in enumerate(report.candidates, 1):
            lines.append(
                f"| {i} | {c.candidate_kind} | _{c.sourceBeat[:30]}_ | "
                f"{c.durationSec:.0f}s | `{c.template}` | {c.score} | {c.label} |"
            )
    lines.extend(["", "## Detail per candidate", ""])
    for i, c in enumerate(report.candidates, 1):
        header_score = (
            f"LLM {c.llm_score:.0f} · heuristic {c.score}"
            if c.llm_score is not None else f"score {c.score}"
        )
        lines.extend([
            f"### {i}. {c.label} ({header_score})",
            "",
            f"- **Kind:** {c.candidate_kind}",
            f"- **Source:** {c.sourceBeat}",
            f"- **Time:** {c.startSec:.1f}s – {c.endSec:.1f}s ({c.durationSec:.0f}s)",
            f"- **Template:** `{c.template}`",
            "",
            f"**Why (heuristic):** {c.rationale}",
            "",
        ])
        if c.llm_rationale:
            lines.append(f"**LLM rationale:** {c.llm_rationale}")
            lines.append("")
        lines.append(f"**Operator notes:** {c.notes}")
        lines.append("")
    lines.extend([
        "---",
        "",
        f"_Run: `python3 tools/publish/shorts_proposer.py {report.slug}`_",
        "",
    ])
    return "\n".join(lines)


def build_proposal_manifest(
    slug: str, candidates: list[ShortsCandidate],
) -> dict:
    """Build a shorts-manifest.json shape that the operator can edit + rename.

    `data` blocks are stubbed with TODO markers — the proposed manifest
    is NOT directly renderable (every Shorts template requires deep
    template-specific fields like `stat`, `comparisons`, `dataPoints`,
    `variant`, `attribution`). The operator must fill these in before
    renaming to `shorts-manifest.json` and running `npm run shorts`.

    When candidates were LLM-scored, we stash the score + rationale
    under `data._llm` (the `data` block has `additionalProperties: true`
    in the schema, so this is safe) so the editorial judgment isn't
    lost when the operator opens the JSON to fill it in.
    """
    shorts = []
    for i, c in enumerate(candidates, 1):
        data: dict = {
            "episode": slug,
            "_TODO": (
                f"Fill in template-specific fields before renaming to "
                f"shorts-manifest.json — this stub will crash render-shorts.mjs "
                f"as-is. {c.notes}"
            ),
        }
        if c.llm_score is not None or c.llm_rationale:
            data["_llm"] = {
                "score": c.llm_score,
                "rationale": c.llm_rationale,
            }
        shorts.append({
            "id": f"{i:02d}",
            "label": c.label,
            "template": c.template,
            "durationSec": round(c.durationSec, 1),
            "sourceBeat": c.sourceBeat,
            "data": data,
        })
    return {
        # `$schema` and `version: "1.0-proposed"` together signal stub
        # state. We previously also emitted a top-level `_proposed`
        # field but the schema has `additionalProperties: false` at
        # the top level — `_proposed` would be schema-illegal the
        # moment shorts-manifest is added to validate_data.py's
        # SCHEMAS map. `version: "1.0-proposed"` and the per-short
        # `data._TODO` markers carry the same signal without violating
        # the schema.
        "$schema": "../../remotion-templates/data/episodes/_schemas/shorts-manifest.schema.json",
        "episode": slug,
        "version": "1.0-proposed",
        "shorts": shorts,
    }


# ── CLI ─────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", help="Episode slug.")
    parser.add_argument(
        "--manifest",
        help="Explicit assembly manifest path (default: "
             "remotion-templates/data/episodes/<slug>/assembly-manifest.json).",
    )
    parser.add_argument(
        "--top", type=int, default=DEFAULT_TOP_N,
        help=f"Number of candidates to propose (default {DEFAULT_TOP_N}).",
    )
    parser.add_argument(
        "--emit-manifest", action="store_true",
        help="Also write episodes/<slug>/shorts-manifest-proposed.json "
             "(skeleton for the operator to fill + rename).",
    )
    parser.add_argument(
        "--llm-score", action="store_true",
        help="Re-rank candidates via Claude scoring against the Parallax "
             "bounded-analogy rubric (snap moment / bounded moment / "
             "self-contained / visual hook). Requires ANTHROPIC_API_KEY "
             "env var. Smarter than the heuristic for editorial judgment. "
             "NOTE: only re-ranks within the --top window; pass --llm-top-k "
             "to widen the pool the LLM sees before its own ranking.",
    )
    def _positive_int(s):
        try:
            v = int(s)
        except ValueError as e:
            raise argparse.ArgumentTypeError(f"expected int, got {s!r}") from e
        if v <= 0:
            raise argparse.ArgumentTypeError(
                f"--llm-top-k must be > 0 (got {v}); use --top alone if you "
                f"don't want to widen the LLM-scoring pool."
            )
        return v
    parser.add_argument(
        "--llm-top-k", type=_positive_int, default=None,
        help="With --llm-score: widen the candidate pool the LLM scores "
             "before --top trims for output. Default = whatever --top is. "
             "Useful when you suspect the heuristic missed a strong "
             "candidate at rank 11+. The LLM scores --llm-top-k candidates, "
             "then sorting + --top trim produces the final ranked list. "
             "Must be > 0.",
    )
    parser.add_argument(
        "--llm-model", default=None,
        help="Anthropic model to use for --llm-score "
             "(default: shorts_llm_scorer.DEFAULT_LLM_MODEL — dated for "
             "reproducibility; bare aliases like 'claude-sonnet-4-5' work too).",
    )
    parser.add_argument(
        "--llm-dry-run", action="store_true",
        help="Print the prompt that WOULD be sent for the first candidate "
             "(no API call, no API key needed). Useful for prompt iteration. "
             "Implies the LLM scoring path — no need to also pass --llm-score.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON report.")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout.")
    parser.add_argument("-o", "--output", help="Write report to file.")
    args = parser.parse_args()

    manifest_path = (
        Path(args.manifest).resolve() if args.manifest
        else _default_manifest_path(args.slug)
    )
    if not manifest_path.is_file():
        print(f"✗ assembly manifest not found: {manifest_path}", file=sys.stderr)
        return 2

    manifest = load_manifest(manifest_path)
    if "segments" not in manifest or "beats" not in manifest:
        print(
            f"✗ manifest at {manifest_path} missing 'segments' or 'beats' "
            f"key — is this a stub manifest?",
            file=sys.stderr,
        )
        return 2

    # When --llm-top-k > --top, the LLM scores a WIDER pool than the
    # final output (so it can surface a strong candidate the heuristic
    # ranked at #15). After LLM rerank sorts the wider pool, we trim
    # back to --top for the operator-facing output.
    llm_pool_size = max(args.top, args.llm_top_k or 0) if (
        args.llm_score or args.llm_dry_run
    ) else args.top
    candidates = propose_shorts(manifest, top_n=llm_pool_size)
    # The full unsliced candidate count is useful for the operator — but
    # for the report we report total of all considered candidates
    beat_labels = _beat_title_lookup(manifest)
    all_candidates = (
        _propose_stat_candidates(manifest, beat_labels)
        + _propose_quote_candidates(manifest, beat_labels)
        + _propose_framework_candidates(manifest, beat_labels)
        + _propose_beat_opener_candidates(manifest, beat_labels)
    )

    # Optional LLM re-rank — same I/O contract, smarter selection brain
    if args.llm_score or args.llm_dry_run:
        # Lazy import so the heuristic path has no LLM-related load
        import shorts_llm_scorer as scorer_mod  # noqa
        if args.llm_dry_run:
            # Preview the prompt for the first candidate, don't call API
            if candidates:
                narration = scorer_mod.collect_narration_for_window(
                    manifest, candidates[0].startSec, candidates[0].endSec,
                )
                prompt = scorer_mod.build_scoring_prompt(candidates[0], narration)
                print(
                    "# LLM Scoring — DRY RUN\n\n"
                    "_Prompt that would be sent for candidate #1. Re-run "
                    "without --llm-dry-run to actually score._\n\n"
                    "```\n" + prompt + "\n```\n",
                    file=sys.stderr,
                )
            # Even in dry-run, trim back to --top so the report matches
            # what a real --llm-score run would produce (the widened
            # pool is just for the LLM to score against).
            candidates = candidates[:args.top]
        else:
            api_key = os.environ.get("ANTHROPIC_API_KEY", "")
            if not api_key:
                print(
                    "✗ --llm-score requires ANTHROPIC_API_KEY env var. "
                    "Use --llm-dry-run to preview the prompt without "
                    "an API call.",
                    file=sys.stderr,
                )
                return 2
            try:
                model = args.llm_model or scorer_mod.DEFAULT_LLM_MODEL
                fn = scorer_mod.make_anthropic_scorer(api_key, model=model)
            except RuntimeError as e:
                print(f"✗ {e}", file=sys.stderr)
                return 2
            # Log the model being used — typo'd --llm-model values would
            # otherwise surface as cryptic 404s deep in the SDK; the log
            # line at least confirms what we sent.
            print(
                f"ℹ scoring {len(candidates)} candidate(s) with {model}",
                file=sys.stderr,
            )
            candidates = scorer_mod.llm_rerank(candidates, manifest, fn)
            # Trim back to --top after the wider-pool LLM rerank
            candidates = candidates[:args.top]

    report = ProposalReport(
        slug=args.slug, manifest_path=str(manifest_path),
        total_candidates=len(all_candidates), candidates=candidates,
    )

    if args.json:
        payload = {
            "slug": report.slug, "manifest_path": report.manifest_path,
            "total_candidates": report.total_candidates,
            "candidates": [asdict(c) for c in report.candidates],
        }
        out = json.dumps(payload, indent=2)
    else:
        out = render_proposal_md(report)

    if args.stdout or not args.output:
        sys.stdout.write(out)
    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(out, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        if not args.stdout:
            print(f"✓ wrote {rel}", file=sys.stderr)

    if args.emit_manifest:
        manifest_out = EPISODES_DIR / args.slug / "shorts-manifest-proposed.json"
        manifest_out.parent.mkdir(parents=True, exist_ok=True)
        manifest_out.write_text(
            json.dumps(build_proposal_manifest(args.slug, candidates), indent=2),
            encoding="utf-8",
        )
        rel = manifest_out.relative_to(ROOT) if manifest_out.is_relative_to(ROOT) else manifest_out
        target = manifest_out.with_name("shorts-manifest.json")
        target_rel = target.relative_to(ROOT) if target.is_relative_to(ROOT) else target
        print(f"✓ wrote skeleton {rel}", file=sys.stderr)
        print(
            f"  ⚠ skeleton is NOT renderable as-is — fill each short's `data` "
            f"block then\n    rename to {target_rel} before running "
            f"`npm run shorts -- --episode={args.slug}`",
            file=sys.stderr,
        )

    if not candidates:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
