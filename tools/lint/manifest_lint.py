#!/usr/bin/env python3
"""
manifest-lint.py — doctrine-rule enforcement for assembly manifests.

Scans `remotion-templates/data/episodes/<slug>/assembly-manifest.json` files
for violations of editorial doctrine that aren't structurally enforced by
`assembly-manifest.schema.json`:

  - M-D18: music holds until after opening setup (POLISH.md D18)
  - M-CROSSFADE: music crossfades land near beat boundaries
  - M-OVERLAP: foreground segments overlap without an explicit transition
  - M-DATAFILE: segment `template.dataFile` references exist on disk
  - M-CUE: soundCue / textureCue types are in the canonical schema enum
  - M-DURATION: max(segments[].endSec) matches totalDurationSec (±0.5s)
  - M-TEXT-ANIM: textAnimation technique is canonical and matches variant
                 (Phase 3 text-animation integration — see TEXT_ANIMATION_REGISTER.md)

Usage:
    python3 tools/lint/manifest_lint.py
    python3 tools/lint/manifest_lint.py data/episodes/prisoners-dilemma/assembly-manifest.json
    python3 tools/lint/manifest_lint.py --episode silicon-trap

Exit code:
    0  — clean (no errors; warnings may still print)
    1  — at least one error
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable, Optional

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
EPISODES_DIR = REPO_ROOT / "remotion-templates" / "data" / "episodes"
SCHEMA_PATH = REPO_ROOT / "remotion-templates" / "data" / "assembly-manifest.schema.json"


# ─── Canonical cue enums (source of truth: assembly-manifest.schema.json) ────
# Mirrored explicitly here rather than parsed from the schema at runtime so the
# linter has zero non-stdlib dependencies. If the schema enum changes, both
# sets must be updated; the linter will silently miss new types until then.
# Last synced: 2026-05-11 (commit ec34e91 era).
CANONICAL_SOUND_CUE_TYPES: frozenset[str] = frozenset({
    "beat-transition", "stat-reveal", "tension-rise", "tension-resolve",
    "map-whoosh", "quote-bell", "section-open", "end-stinger",
})
CANONICAL_TEXTURE_CUE_TYPES: frozenset[str] = frozenset({
    "dot-click", "card-settle", "line-draw", "region-glow",
    "bar-grow", "node-pop", "page-turn",
})


# ─── Violation model ─────────────────────────────────────────────────────────

@dataclass
class Violation:
    rule: str            # e.g. "M-D18"
    file: str            # manifest path relative to REPO_ROOT
    pointer: str         # JSON pointer-ish locator (e.g. "musicBed.tracks[0].startSec")
    message: str
    severity: str = "error"   # "error" or "warning"


# ─── Rule: M-D18 (music holds until after opening setup) ─────────────────────
# Source: POLISH.md § D18 + references/template-research/title-card.md § 4.
# Reference fixes: commit b705b42 (PD manifest) + 09ceddc (silicon-trap).
#
# Definition:
#   The first music track in `musicBed.tracks` must not begin before the
#   episode's "opening setup" concludes. Opening setup is one of:
#     (a) episode-opening TitleTransition segment (b705b42 PD pattern), OR
#     (b) cold-open setup before the first body content (09ceddc silicon-trap
#         pattern) — found by walking foreground segments forward until the
#         first body-content segment (foreground TEMPLATE that's not a
#         TitleTransition section header) begins.
#
# Reports startSec of the first track vs. the computed opening-end-sec.

def _find_opening_end_sec(segments: list[dict]) -> tuple[float, str]:
    """
    Returns (end_sec, rationale).
    Walks the segment list to identify where music is allowed to enter.
    Three strategies, in order:
      1. PD pattern — episode opens directly with a TitleTransition near 0.
         Music enters after the title-card endSec.
      2. Silicon-trap pattern — cold open + hero-stat (per title-card dossier
         § 2 "Hero stat or claim on paper" — a canonical cold-open pattern).
         The cold open lasts through the FIRST background FOOTAGE/IMAGE
         segment AND any foreground hero TEMPLATE held above it. Body
         proper begins at the start of the SECOND background FOOTAGE/IMAGE.
         Returns that startSec.
      3. Fallback — first foreground TEMPLATE that isn't a TitleTransition.
         Returns its startSec as a lower bound (the linter will accept any
         music start at or after this, even if the editor pushes later for
         a longer cold open).
    """
    # Strategy 1: opening TitleTransition near 0
    for seg in segments:
        if seg.get("layer") != "foreground":
            continue
        if seg.get("type") != "TRANSITION":
            continue
        component = seg.get("template", {}).get("component", "")
        if component != "TitleTransition":
            continue
        if seg.get("startSec", 0) <= 2.0:
            return seg.get("endSec", 0), f"opening TitleTransition ({seg.get('id', '?')})"
        break  # first TitleTransition isn't at the start — it's a section break

    # Strategy 2: cold open + hero-stat pattern. Find the SECOND background
    # FOOTAGE/IMAGE — its startSec is when body proper begins. The first
    # one is the cold-open atmospheric; any foreground TEMPLATE held above
    # it (hero stat) is still part of the cold open per the dossier.
    bg_content = [
        s for s in segments
        if s.get("layer") == "background"
        and s.get("type") in ("FOOTAGE", "IMAGE")
    ]
    if len(bg_content) >= 2:
        second = bg_content[1]
        return (
            second.get("startSec", 0),
            f"second background content ({second.get('id', '?')}) — cold-open + hero-stat pattern",
        )

    # Strategy 3 (fallback): first foreground TEMPLATE that isn't a
    # TitleTransition. Yields a LOWER BOUND — editor may legitimately
    # push later if the cold open extends further.
    for seg in segments:
        if seg.get("layer") != "foreground":
            continue
        if seg.get("type") != "TEMPLATE":
            continue
        component = seg.get("template", {}).get("component", "")
        if component == "TitleTransition":
            continue
        return (
            seg.get("startSec", 0),
            f"first foreground body segment ({seg.get('id', '?')}) — lower bound",
        )

    return 0.0, "no opening structure detected"


def check_d18_music_hold(manifest: dict, _: str) -> list[Violation]:
    """M-D18: music must not enter before the opening setup concludes."""
    violations: list[Violation] = []
    tracks = manifest.get("musicBed", {}).get("tracks", [])
    if not tracks:
        return violations
    segments = manifest.get("segments", [])
    opening_end, rationale = _find_opening_end_sec(segments)
    first_track = tracks[0]
    track_start = first_track.get("startSec", 0)
    if track_start < opening_end:
        violations.append(Violation(
            rule="M-D18",
            file="",  # filled in by caller
            pointer=f"musicBed.tracks[0].startSec",
            message=(
                f"first music track starts at {track_start}s but opening setup "
                f"ends at {opening_end}s ({rationale}). POLISH.md D18: music "
                f"must enter only after the opening setup lands. Shift "
                f"`musicBed.tracks[0].startSec` to {opening_end} or later."
            ),
            severity="error",
        ))
    return violations


# ─── Rule: M-CROSSFADE (music crossfades land near beat boundaries) ──────────
# Source: editorial convention — music shifts mood at narrative beat
# transitions, not at arbitrary seconds. The generator (`build_music_bed`)
# already aligns to beats; this rule catches drift introduced by manual edits.

def check_crossfade_beat_alignment(manifest: dict, _: str) -> list[Violation]:
    """M-CROSSFADE: each crossfade midpoint should be within ±5s of a beat boundary."""
    violations: list[Violation] = []
    tracks = manifest.get("musicBed", {}).get("tracks", [])
    beats = manifest.get("beats", [])
    if len(tracks) < 2 or not beats:
        return violations
    beat_boundaries = [b.get("startSec", 0) for b in beats]
    # Also include episode end as a boundary for the final track's outro
    last_beat_end = beats[-1].get("endSec") if beats else None
    if last_beat_end is not None:
        beat_boundaries.append(last_beat_end)
    TOLERANCE_SEC = 5.0
    for i in range(len(tracks) - 1):
        a, b = tracks[i], tracks[i + 1]
        # Crossfade midpoint: where track A is fading out and B is fading in.
        # Treat the midpoint as the average of A.endSec and B.startSec.
        midpoint = (a.get("endSec", 0) + b.get("startSec", 0)) / 2.0
        # Find nearest beat boundary
        nearest = min(beat_boundaries, key=lambda x: abs(x - midpoint))
        if abs(nearest - midpoint) > TOLERANCE_SEC:
            violations.append(Violation(
                rule="M-CROSSFADE",
                file="",
                pointer=f"musicBed.tracks[{i}↔{i+1}]",
                message=(
                    f"crossfade midpoint at {midpoint:.1f}s is {abs(nearest - midpoint):.1f}s "
                    f"from the nearest beat boundary ({nearest:.1f}s). Music mood "
                    f"should shift on narrative beats, not at arbitrary seconds."
                ),
                severity="warning",
            ))
    return violations


# ─── Rule: M-OVERLAP (foreground segments overlap without transition) ────────
# Source: implicit invariant of generate_manifest.py — foreground segments
# that share time must declare a transition for the editor to honor (cross-
# dissolve, color-wash, iris, etc.). Without one, the renderer stacks them
# raw and the editor has no marker for what should happen.

def _segments_overlap(a: dict, b: dict) -> bool:
    """Return True if segments a and b share time on the same layer."""
    a_start, a_end = a.get("startSec", 0), a.get("endSec", 0)
    b_start, b_end = b.get("startSec", 0), b.get("endSec", 0)
    return a_start < b_end and b_start < a_end


def check_foreground_overlap_without_transition(manifest: dict, _: str) -> list[Violation]:
    """M-OVERLAP: foreground segments that overlap must have a transition declared."""
    violations: list[Violation] = []
    segments = manifest.get("segments", [])
    fg_segments = [s for s in segments if s.get("layer") == "foreground"]
    # Compare each pair only once; sort by startSec so "earlier" is well-defined
    fg_segments_sorted = sorted(fg_segments, key=lambda s: (s.get("startSec", 0), s.get("endSec", 0)))
    for i, a in enumerate(fg_segments_sorted):
        # HOLD segments are by definition continuations of the previous
        # foreground content (no new visual element); skip them.
        if a.get("type") == "HOLD":
            continue
        for b in fg_segments_sorted[i + 1:]:
            if b.get("type") == "HOLD":
                continue
            if b.get("startSec", 0) >= a.get("endSec", 0):
                # Sorted by startSec, so no further b can overlap a.
                break
            if not _segments_overlap(a, b):
                continue
            # Overlap detected. Check for transition on either segment.
            a_out = a.get("transition", {}).get("out") if a.get("transition") else None
            b_in = b.get("transition", {}).get("in") if b.get("transition") else None
            if a_out or b_in:
                continue  # OK — explicit transition declared
            violations.append(Violation(
                rule="M-OVERLAP",
                file="",
                pointer=f"segments[{a.get('id', '?')}]↔segments[{b.get('id', '?')}]",
                message=(
                    f"foreground segments {a.get('id')} ({a.get('startSec')}-{a.get('endSec')}s) "
                    f"and {b.get('id')} ({b.get('startSec')}-{b.get('endSec')}s) overlap but "
                    f"neither declares a `transition.out` (former) or `transition.in` (latter). "
                    f"Add a transition directive so the NLE editor has a marker for what should happen."
                ),
                severity="error",
            ))
    return violations


# ─── Rule: M-DATAFILE (referenced data files exist on disk) ──────────────────
# Source: implicit invariant — every segment with template.dataFile points
# to a real file in the episode's data directory. Missing data files surface
# at render time as a confusing Remotion error.

def check_datafile_exists(manifest: dict, manifest_path: Path) -> list[Violation]:
    """M-DATAFILE: every segment.template.dataFile must exist relative to the manifest's directory."""
    violations: list[Violation] = []
    episode_dir = manifest_path.parent
    for seg in manifest.get("segments", []):
        template = seg.get("template") or {}
        data_file = template.get("dataFile")
        if not data_file:
            continue
        full_path = episode_dir / data_file
        if not full_path.exists():
            violations.append(Violation(
                rule="M-DATAFILE",
                file="",
                pointer=f"segments[{seg.get('id', '?')}].template.dataFile",
                message=(
                    f"referenced data file `{data_file}` does not exist relative to "
                    f"`{episode_dir.relative_to(REPO_ROOT)}/`. Render will fail at this segment."
                ),
                severity="error",
            ))
    return violations


# ─── Rule: M-CUE (soundCue / textureCue types are in the canonical enum) ─────
# Source: assembly-manifest.schema.json enum on soundCue.type / textureCue.type.
# The JSON-schema validator would catch this at write time, but only if the
# validator is wired into the producer; this linter is a belt-and-suspenders
# check that also surfaces deprecated types if the canonical set ever shrinks.

def check_cue_types_canonical(manifest: dict, _: str) -> list[Violation]:
    """M-CUE: every soundCue.type, soundCueSecondary.type, and textureCue.type is in the canonical enum."""
    violations: list[Violation] = []
    for seg in manifest.get("segments", []):
        seg_id = seg.get("id", "?")
        for slot in ("soundCue", "soundCueSecondary"):
            cue = seg.get(slot)
            if not cue:
                continue
            t = cue.get("type")
            if t and t not in CANONICAL_SOUND_CUE_TYPES:
                violations.append(Violation(
                    rule="M-CUE",
                    file="",
                    pointer=f"segments[{seg_id}].{slot}.type",
                    message=(
                        f"soundCue type `{t}` is not in the canonical enum "
                        f"({', '.join(sorted(CANONICAL_SOUND_CUE_TYPES))}). "
                        f"Either typo or unauthorized addition — check AUDIO_DESIGN.md."
                    ),
                    severity="warning",
                ))
        for cue_idx, cue in enumerate(seg.get("textureCues") or []):
            t = cue.get("type")
            if t and t not in CANONICAL_TEXTURE_CUE_TYPES:
                violations.append(Violation(
                    rule="M-CUE",
                    file="",
                    pointer=f"segments[{seg_id}].textureCues[{cue_idx}].type",
                    message=(
                        f"textureCue type `{t}` is not in the canonical enum "
                        f"({', '.join(sorted(CANONICAL_TEXTURE_CUE_TYPES))}). "
                        f"Either typo or unauthorized addition — check AUDIO_DESIGN.md."
                    ),
                    severity="warning",
                ))
    return violations


# ─── Rule: M-DURATION (segment timeline matches declared totalDurationSec) ───
# Source: render-time invariant. `totalDurationSec` drives the Remotion
# composition's `durationInFrames`. If segments extend past that boundary the
# tail gets clipped; if segments don't reach it the final video has padding
# silence (or, more commonly, a stale segment freezes for the gap).
#
# What we actually compare:
#   max(segments[].endSec)  vs  manifest.totalDurationSec
# Tolerance: 0.5s (the smallest editorial cut a viewer would notice).
# We don't compare against narration.totalDurationSec — narration can lead
# or trail segments by design (cold opens, outro stings).

DURATION_TOLERANCE_SEC = 0.5


def check_duration_drift(manifest: dict, _: str) -> list[Violation]:
    """M-DURATION: max(segments[].endSec) must equal manifest.totalDurationSec ± tolerance."""
    violations: list[Violation] = []
    declared = manifest.get("totalDurationSec")
    segments = manifest.get("segments") or []

    if declared is None:
        # totalDurationSec is optional in the schema. Skip silently — the
        # composition will derive its duration from another source (e.g. narration).
        return violations
    if not segments:
        return violations

    end_secs = [s.get("endSec") for s in segments if isinstance(s.get("endSec"), (int, float))]
    if not end_secs:
        return violations

    actual = max(end_secs)
    diff = actual - declared

    if abs(diff) > DURATION_TOLERANCE_SEC:
        if diff > 0:
            verdict = (
                f"segments extend {diff:.2f}s past the declared totalDurationSec "
                f"(max segment endSec = {actual:.2f}s, declared = {declared:.2f}s). "
                f"The final {diff:.2f}s will be clipped from the render."
            )
        else:
            verdict = (
                f"segments end {-diff:.2f}s before the declared totalDurationSec "
                f"(max segment endSec = {actual:.2f}s, declared = {declared:.2f}s). "
                f"The last segment will freeze for {-diff:.2f}s of trailing dead air."
            )
        violations.append(Violation(
            rule="M-DURATION",
            file="",
            pointer=f"totalDurationSec ({declared:.2f}s) vs max(segments[].endSec) ({actual:.2f}s)",
            message=verdict,
            severity="error",
        ))
    return violations


# ─── Rule: M-TEXT-ANIM (text-animation register coherence) ───────────────────
# Phase 3 text-animation integration (May 2026). Checks that each segment's
# `template.dataFile` contents are coherent with the `_direction.textAnimation`
# value the file declares — i.e. that the chosen technique matches the
# content it's animating. See project/TEXT_ANIMATION_REGISTER.md for the
# editorial register and per-technique use/avoid rules.
#
# Failure modes this catches (all warnings, not errors — register selection
# is editorial judgment, not strict invariant):
#   1. `textAnimation: "quote-attribution"` set on a quote variant without
#      a real named `attribution` field (a channel-voice "quote" using the
#      transcribed register is a category error per the doctrine doc).
#   2. `textAnimation: "stat-caption"` on a statistic variant whose
#      `statValue` is unparseable (Number Ticker can't tick to a label).
#   3. `textAnimation: "definition-reveal"` on anything other than a
#      definition variant in KineticTypography.
#   4. `textAnimation: "quote-attribution"` on anything other than a quote
#      variant in KineticTypography.
#
# Mirrors the canonical technique vocabulary from
# remotion-templates/src/hooks/directionBlock.schema.ts. Unknown technique
# names ARE flagged as errors (typos slip through Zod's .passthrough()
# on the outer object — Zod validates the union inside, but only if Zod
# parses the data file at render time; render-time-only validation
# doesn't help authors during script writing).

CANONICAL_TEXT_ANIM_TECHNIQUES: frozenset[str] = frozenset({
    "typewriter", "tracking-in", "reveal-mask", "underline-draw",
    "number-ticker", "scramble", "backspace", "word-cascade",
    "definition-reveal", "stat-caption", "quote-attribution",
})


def _parsable_stat_value(s: str) -> bool:
    """Match the same regex the KineticTypography StatCaptionDispatch uses
    (`parseStatValueString` in KineticTypography.tsx). Returns True if the
    string has a parseable numeric component — i.e. NumberTicker can
    animate to a real value, not just fall back to 0."""
    import re as _re
    m = _re.match(r"^\s*[^\d\-+.]*\s*(-?[\d,]+(?:\.\d+)?)\s*.*$", s or "")
    if not m:
        return False
    try:
        float(m.group(1).replace(",", ""))
        return True
    except (TypeError, ValueError):
        return False


def check_text_animation_register(manifest: dict, manifest_path: Path) -> list[Violation]:
    """M-TEXT-ANIM: technique vocabulary + variant↔technique coherence."""
    violations: list[Violation] = []
    episode_dir = manifest_path.parent

    for seg in manifest.get("segments", []) or []:
        template = seg.get("template") or {}
        data_file = template.get("dataFile")
        if not data_file:
            continue
        full_path = episode_dir / data_file
        if not full_path.exists():
            continue  # M-DATAFILE already flagged this

        try:
            data = json.loads(full_path.read_text())
        except json.JSONDecodeError:
            continue  # validate_data.py handles JSON errors

        direction = data.get("_direction") or {}
        tech = direction.get("textAnimation")
        if not tech:
            continue  # Field absent → backwards-compat path; nothing to check

        seg_id = seg.get("id", "?")
        component = template.get("component", "")
        variant = data.get("variant")

        # 1. Validate technique against canonical vocabulary
        if tech not in CANONICAL_TEXT_ANIM_TECHNIQUES:
            violations.append(Violation(
                rule="M-TEXT-ANIM",
                file="",
                pointer=f"segments[{seg_id}] → {data_file} → _direction.textAnimation",
                message=(
                    f"unknown textAnimation technique: {tech!r}. "
                    f"Canonical set: {', '.join(sorted(CANONICAL_TEXT_ANIM_TECHNIQUES))}. "
                    f"See project/TEXT_ANIMATION_REGISTER.md."
                ),
                severity="error",
            ))
            continue  # Don't run the coherence checks against an unknown name

        # 2. Composite ↔ variant coherence (KineticTypography only)
        if component == "KineticTypography":
            if tech == "quote-attribution":
                if variant != "quote":
                    violations.append(Violation(
                        rule="M-TEXT-ANIM",
                        file="",
                        pointer=f"segments[{seg_id}] → {data_file}",
                        message=(
                            f"'quote-attribution' set on KineticTypography "
                            f"variant={variant!r}; this composite only applies to "
                            f"variant=\"quote\". Use 'definition-reveal' for "
                            f"definitions, 'stat-caption' for statistics, or omit "
                            f"the field for word-cascade default."
                        ),
                        severity="warning",
                    ))
                elif not (data.get("attribution") or "").strip():
                    violations.append(Violation(
                        rule="M-TEXT-ANIM",
                        file="",
                        pointer=f"segments[{seg_id}] → {data_file}",
                        message=(
                            "'quote-attribution' set on a quote without a named "
                            "`attribution` field. Typewriter register implies "
                            "transcribed speech from a named speaker; channel-voice "
                            "statements should omit textAnimation (defaults to "
                            "word-cascade) per TEXT_ANIMATION_REGISTER.md § 05."
                        ),
                        severity="warning",
                    ))
            elif tech == "definition-reveal" and variant != "definition":
                violations.append(Violation(
                    rule="M-TEXT-ANIM",
                    file="",
                    pointer=f"segments[{seg_id}] → {data_file}",
                    message=(
                        f"'definition-reveal' set on KineticTypography "
                        f"variant={variant!r}; this composite only applies to "
                        f"variant=\"definition\"."
                    ),
                    severity="warning",
                ))
            elif tech == "stat-caption":
                if variant != "statistic":
                    violations.append(Violation(
                        rule="M-TEXT-ANIM",
                        file="",
                        pointer=f"segments[{seg_id}] → {data_file}",
                        message=(
                            f"'stat-caption' set on KineticTypography "
                            f"variant={variant!r}; this composite only applies to "
                            f"variant=\"statistic\"."
                        ),
                        severity="warning",
                    ))
                elif not _parsable_stat_value(data.get("statValue") or ""):
                    violations.append(Violation(
                        rule="M-TEXT-ANIM",
                        file="",
                        pointer=f"segments[{seg_id}] → {data_file}",
                        message=(
                            f"'stat-caption' set on a statistic with unparseable "
                            f"statValue={data.get('statValue')!r}. NumberTicker "
                            f"will fall back to 0 with the value as a unit label. "
                            f"Consider either: (a) reformat statValue to "
                            f"<prefix><number><suffix>, or (b) omit textAnimation."
                        ),
                        severity="warning",
                    ))

    return violations


# ─── Sync-coverage rule (M-SYNC) ─────────────────────────────────────────────
#
# Components that surface multiple labeled entities and consume per-element
# D17 anticipation via syncPoints[i]. When data has >1 entity, the script
# should provide a syncs:[…] plural sync list rather than a single sync — see
# DIRECTING_LANGUAGE.md → "Per-element anticipatory reveals" (May 16, 2026).
#
# Each entry maps the component to its candidate entity-list field names in
# the data file. Tried in order; the first list found determines the entity
# count for the lint check. (HorizontalTimeline uses different fields per
# mode — events / pairs / morphEvents — so we try all three.)
_PER_ELEMENT_D17_COMPONENTS: dict[str, list[str]] = {
    "NetworkDiagram":     ["nodes"],
    "ArcDiagram":         ["nodes"],
    "EscalationLadder":   ["rungs"],
    "HorizontalTimeline": ["events", "pairs", "morphEvents"],
    "AnnotatedImage":     ["callouts"],  # +1 for image at index 0
    "FrameworkDiagram":   ["columns", "cells", "phases"],
    "BumpChart":          ["entities"],
}


def _expected_entity_count(component: str, data: dict) -> int:
    """
    Return the expected number of narrated entities for a per-element D17
    component, or 0 if the component isn't in the table or no candidate
    field resolves to a non-empty list.

    AnnotatedImage convention: syncPoints[0] = image, syncPoints[1..N] =
    callouts — so the expected count is callouts + 1.
    """
    field_candidates = _PER_ELEMENT_D17_COMPONENTS.get(component)
    if not field_candidates:
        return 0
    for field in field_candidates:
        value = data.get(field)
        if isinstance(value, list) and value:
            count = len(value)
            return count + 1 if component == "AnnotatedImage" else count
    return 0


def check_sync_coverage(manifest: dict, manifest_path: Path) -> list[Violation]:
    """
    M-SYNC: flag segments where narration anchoring is missing or under-utilized.

    Two sub-rules:
      M-SYNC-MISSING — TEMPLATE foreground segment has no syncWords. The
        D17 anticipatory entrance can't anchor to a narration word; the
        reveal falls back to estimate-mode timing. Fix: add sync:"word"
        to the reveal()/cam() directive in the script for at least one
        narration cue per beat.

      M-SYNC-COUNT — per-element D17 component (NetworkDiagram, ArcDiagram,
        EscalationLadder, HorizontalTimeline, AnnotatedImage, FrameworkDiagram,
        BumpChart) has >1 entities but only 1 syncWord. The per-element
        anticipation will only fire on entity 0; entities 1..N fall back to
        the staggered estimate. Fix: use syncs:["w1","w2",…] in the script
        so each entity anticipates its own cue.

    Both rules are advisory (severity: warning). They surface authoring gaps
    where the doctrine prescribes anchoring but the script omits it.

    TYPEs we intentionally skip:
      - FOOTAGE / HOLD / TRANSITION segments — no template, no entrance to
        anticipate. Sync isn't relevant.
      - background layer segments — narration anchors to foreground beats.
    """
    violations: list[Violation] = []
    episode_dir = manifest_path.parent

    for seg in manifest.get("segments", []) or []:
        # Skip background segments — narration anchors to foreground beats.
        if seg.get("layer") == "background":
            continue
        # Only TEMPLATE segments have entrance reveals that benefit from sync.
        if seg.get("type") != "TEMPLATE":
            continue

        seg_id = seg.get("id", "?")
        template = seg.get("template") or {}
        component = template.get("component", "")
        sync_words = seg.get("syncWords") or []

        # ── M-SYNC-MISSING: TEMPLATE foreground beat has no sync anchor ─────
        if not sync_words:
            violations.append(Violation(
                rule="M-SYNC-MISSING",
                file="",
                pointer=f"segments[{seg_id}] (component={component})",
                message=(
                    "TEMPLATE segment has no syncWords — D17 anticipation can't "
                    "anchor to narration. Add sync:\"word\" to the reveal()/cam() "
                    "directive in the script for at least one narration cue per beat."
                ),
                severity="warning",
            ))
            # When sync is missing entirely, M-SYNC-COUNT below is moot.
            continue

        # ── M-SYNC-COUNT: per-element template, multi-entity, single sync ───
        if component in _PER_ELEMENT_D17_COMPONENTS and len(sync_words) == 1:
            data_file = template.get("dataFile")
            if not data_file:
                continue
            full_path = episode_dir / data_file
            if not full_path.exists():
                continue  # M-DATAFILE handles missing files
            try:
                data = json.loads(full_path.read_text())
            except json.JSONDecodeError:
                continue  # validate_data.py handles JSON errors

            expected = _expected_entity_count(component, data)
            if expected > 1:
                violations.append(Violation(
                    rule="M-SYNC-COUNT",
                    file="",
                    pointer=f"segments[{seg_id}] (component={component}) → {data_file}",
                    message=(
                        f"{component} has {expected} entities but only 1 syncWord — "
                        f"per-element D17 anticipation will fire on entity 0 only. "
                        f"Replace sync:\"word\" with syncs:[…] in the reveal()/cam() "
                        f"directive so each entity anchors to its own narration cue. "
                        f"See DIRECTING_LANGUAGE.md → \"Per-element anticipatory reveals\"."
                    ),
                    severity="warning",
                ))

    return violations


# ─── Drift-register rule (M-DRIFT-DEFAULT) ───────────────────────────────────
#
# Flags segments whose explicit `_direction.driftPreset` contradicts the
# template's recommended hold-motion register per HOLD_MOTION_REGISTER.md
# Section 4 / POLISH.md D20. Two severity levels:
#
#   ERROR (hard doctrine violation):
#     - Chart-category template with driftPreset:"documentary"
#       → 0.3° rotation tilts axis baselines (false data signal)
#     - AtlasPlate with pan-bearing preset (documentary / normal / slow)
#       → directional pan shifts the map projection registration
#
#   WARNING (out-of-register, may be intentional):
#     - Template uses a preset that isn't in its recommended set per the
#       four registers (A analytical / B editorial-hero / C documentary
#       / D cartographic). Author may have a good reason — author may
#       not. The lint surfaces it for review.
#
# Templates with no entry in _RECOMMENDED_DRIFT are silently passed through
# (the rule doesn't presume to govern templates whose register isn't yet
# documented).

# Per-component recommended preset set per HOLD_MOTION_REGISTER.md Section 4.
# Add new templates here when extending the doctrine.
_RECOMMENDED_DRIFT: dict[str, set[str]] = {
    # Register A — Analytical (charts, diagrams, dense structured content)
    "DataChart":             {"editorial", "settle", "none"},
    "TimeSeriesChart":       {"editorial", "settle"},
    "BumpChart":             {"editorial", "settle"},
    "RidgelinePlot":         {"editorial", "settle"},
    "Streamgraph":           {"editorial", "settle"},
    "NetworkDiagram":        {"editorial", "settle"},
    "ArcDiagram":            {"editorial", "settle"},
    "FrameworkDiagram":      {"editorial", "settle"},
    "GameBoard":             {"editorial", "settle"},
    "DecisionTree":          {"editorial", "settle"},
    "EscalationLadder":      {"editorial", "settle"},
    "HorizontalTimeline":    {"editorial", "settle"},
    "BayesianUpdate":        {"editorial", "settle"},
    "BeeswarmChart":         {"editorial", "settle"},
    "CalendarHeatmap":       {"editorial", "settle"},
    "ConnectedScatterplot":  {"editorial", "settle"},
    "DumbbellPlot":          {"editorial", "settle"},
    "HorizonChart":          {"editorial", "settle"},
    "IsotypeChart":          {"editorial", "settle"},
    "MarimekkoChart":        {"editorial", "settle"},
    "PopulationPyramid":     {"editorial", "settle"},
    "ProbabilityGauge":      {"editorial", "settle"},
    "RadarChart":            {"editorial", "settle"},
    "RankChangeDotPlot":     {"editorial", "settle"},
    "SankeyFlow":            {"editorial", "settle"},
    "TernaryPlot":           {"editorial", "settle"},
    "PricingWaterfall":      {"editorial", "settle"},
    "StrategicLandscape":    {"editorial", "settle"},

    # Register B — Editorial-hero (single stat, held quote, definition)
    "StatReveal":            {"breathing", "settle", "none"},
    "KineticTypography":     {"breathing", "settle", "none"},

    # Register C — Documentary (photo plates, archival, evidence)
    "ImageComposite":        {"documentary", "breathing"},
    "PhotoMontage":          {"documentary", "breathing"},
    "AnnotatedImage":        {"documentary", "breathing"},

    # Register D — Cartographic (AtlasPlate: projection-safe only)
    "AtlasPlate":            {"breathing", "sway", "none"},

    # Other maps — editorial default, documentary for atmospheric register
    "ChoroplethMap":         {"editorial", "documentary"},
    "RouteAnimation":        {"editorial", "documentary"},
    "DensityMap":            {"editorial", "documentary"},
    "CartogramMap":          {"editorial"},
    "TilegramUSMap":         {"editorial"},
    "ProportionalSymbolMap": {"editorial"},

    # Title cards
    "TitleTransition":       {"settle", "breathing"},
}

# Components whose data is plotted on numerical axes — documentary preset's
# 0.3° rotation tilts those axes visibly, producing false data signal. The
# DRIFT_PRESETS source comment (`useDirection.ts`) explicitly flags this:
# "NOT for charts — the rotation tilts axis baselines."
_CHART_COMPONENTS: set[str] = {
    "DataChart", "TimeSeriesChart", "BumpChart", "RidgelinePlot",
    "Streamgraph", "BayesianUpdate", "BeeswarmChart", "CalendarHeatmap",
    "ConnectedScatterplot", "DumbbellPlot", "HorizonChart", "IsotypeChart",
    "MarimekkoChart", "PopulationPyramid", "ProbabilityGauge", "RadarChart",
    "RankChangeDotPlot", "TernaryPlot", "PricingWaterfall",
}

# Presets that move the camera with directional intent (pan, rotation, or
# both). When applied to a map plate where projection registration matters,
# these visibly shift which geography is foregrounded — false editorial
# signal about "which region the camera favors."
_PAN_BEARING_PRESETS: set[str] = {"documentary", "normal", "slow"}


def check_drift_register(manifest: dict, _manifest_path: Path) -> list[Violation]:
    """
    M-DRIFT-DEFAULT: surface segments whose explicit driftPreset contradicts
    the template's recommended register per HOLD_MOTION_REGISTER.md.

    Source of truth for the recommendations: HOLD_MOTION_REGISTER.md Section
    4 decision matrix, broken into four registers (A analytical / B editorial-
    hero / C documentary / D cartographic). When that doctrine doc updates,
    `_RECOMMENDED_DRIFT` above must update in parallel.

    Rule operates on segment._direction.driftPreset — the per-segment script
    override (set via DIR: drift(<preset>) or hold(stillness)). Template
    defaults (Phase 3 wiring) are not visible at the manifest layer, so
    this rule only sees script-side overrides. That's the correct scope:
    the rule shouldn't second-guess the template's own default register.
    """
    violations: list[Violation] = []

    for seg in manifest.get("segments", []) or []:
        if seg.get("layer") == "background":
            continue
        if seg.get("type") != "TEMPLATE":
            continue

        template = seg.get("template") or {}
        component = template.get("component", "")
        seg_id = seg.get("id", "?")

        # The script-side drift override lives in segment._direction.driftPreset.
        # Falls through silently if no override (template default applies and
        # is presumed correct by construction).
        seg_direction = seg.get("_direction") or {}
        seg_preset = seg_direction.get("driftPreset")
        if not seg_preset:
            continue

        # ── ERROR: chart with documentary (axis-rotation tilt) ────────────
        if component in _CHART_COMPONENTS and seg_preset == "documentary":
            violations.append(Violation(
                rule="M-DRIFT-DEFAULT",
                file="",
                pointer=f"segments[{seg_id}] (component={component})",
                message=(
                    f"{component} segment uses driftPreset=\"documentary\" — the 0.3° "
                    f"rotation in this preset tilts chart axis baselines visibly, "
                    f"producing a false data signal. Use \"editorial\" (default) or "
                    f"\"settle\" instead. See HOLD_MOTION_REGISTER.md technique 06 "
                    f"\"Failure mode\"."
                ),
                severity="error",
            ))
            continue

        # ── ERROR: AtlasPlate with pan-bearing preset (projection shift) ──
        if component == "AtlasPlate" and seg_preset in _PAN_BEARING_PRESETS:
            violations.append(Violation(
                rule="M-DRIFT-DEFAULT",
                file="",
                pointer=f"segments[{seg_id}] (component={component})",
                message=(
                    f"AtlasPlate uses driftPreset=\"{seg_preset}\" — this preset "
                    f"includes directional pan and/or rotation, which shifts the map "
                    f"projection registration (false signal about which geography "
                    f"the camera favors). Use \"breathing\" (scale-only — projection-"
                    f"safe), \"sway\" (zero-net pan), or \"none\" (memorial moments). "
                    f"See HOLD_MOTION_REGISTER.md technique 06 vs 04."
                ),
                severity="error",
            ))
            continue

        # ── WARNING: out-of-register usage ────────────────────────────────
        recommended = _RECOMMENDED_DRIFT.get(component)
        if recommended is not None and seg_preset not in recommended:
            violations.append(Violation(
                rule="M-DRIFT-DEFAULT",
                file="",
                pointer=f"segments[{seg_id}] (component={component})",
                message=(
                    f"{component} uses driftPreset=\"{seg_preset}\" — doctrine "
                    f"recommends one of {sorted(recommended)} for this template's "
                    f"editorial register. See HOLD_MOTION_REGISTER.md Section 4 "
                    f"\"Decision matrix\"."
                ),
                severity="warning",
            ))

    return violations


# ─── Driver ──────────────────────────────────────────────────────────────────

ALL_RULES: list[Callable[[dict, Path], list[Violation]]] = [
    lambda m, p: check_d18_music_hold(m, str(p)),
    lambda m, p: check_crossfade_beat_alignment(m, str(p)),
    lambda m, p: check_foreground_overlap_without_transition(m, str(p)),
    check_datafile_exists,  # needs the path
    lambda m, p: check_cue_types_canonical(m, str(p)),
    lambda m, p: check_duration_drift(m, str(p)),
    check_text_animation_register,  # needs the path (reads dataFile contents)
    check_sync_coverage,             # needs the path (reads dataFile contents)
    check_drift_register,            # reads segment._direction.driftPreset
]


def lint_manifest(manifest_path: Path) -> list[Violation]:
    """Run all rules against a single manifest file."""
    try:
        manifest = json.loads(manifest_path.read_text())
    except json.JSONDecodeError as e:
        return [Violation(
            rule="M-JSON",
            file=str(manifest_path.relative_to(REPO_ROOT)),
            pointer="",
            message=f"manifest is not valid JSON: {e}",
            severity="error",
        )]
    violations: list[Violation] = []
    rel = str(manifest_path.relative_to(REPO_ROOT))
    for rule in ALL_RULES:
        for v in rule(manifest, manifest_path):
            v.file = rel
            violations.append(v)
    return violations


def find_manifests(episode_filter: Optional[str] = None) -> list[Path]:
    """Find every assembly-manifest.json under data/episodes/."""
    paths = []
    if not EPISODES_DIR.exists():
        return paths
    for episode_dir in sorted(EPISODES_DIR.iterdir()):
        if not episode_dir.is_dir():
            continue
        if episode_filter and episode_dir.name != episode_filter:
            continue
        manifest = episode_dir / "assembly-manifest.json"
        if manifest.exists():
            paths.append(manifest)
    return paths


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Lint assembly-manifest.json files against editorial doctrine."
    )
    parser.add_argument(
        "paths", nargs="*", type=Path,
        help="Manifest file paths to lint. If omitted, every manifest under data/episodes/ is linted.",
    )
    parser.add_argument(
        "--episode", type=str, default=None,
        help="Lint only the given episode slug (e.g. --episode silicon-trap).",
    )
    args = parser.parse_args()

    if args.paths:
        manifests = [p.resolve() for p in args.paths]
    else:
        manifests = find_manifests(args.episode)

    if not manifests:
        print("No assembly manifests found.")
        return 0

    all_violations: list[Violation] = []
    for manifest_path in manifests:
        all_violations.extend(lint_manifest(manifest_path))

    if not all_violations:
        print(f"✓ {len(manifests)} manifest(s) clean.")
        return 0

    # Group by file for readable output
    by_file: dict[str, list[Violation]] = {}
    for v in all_violations:
        by_file.setdefault(v.file, []).append(v)

    for filepath, vs in sorted(by_file.items()):
        print(f"\n{'━' * 70}")
        print(f"  {filepath}  ({len(vs)} violation{'s' if len(vs) != 1 else ''})")
        print(f"{'━' * 70}")
        for v in vs:
            marker = "🔴" if v.severity == "error" else "🟡"
            print(f"  {marker} [{v.rule}] {v.pointer}")
            print(f"     {v.message}")
            print()

    errors = sum(1 for v in all_violations if v.severity == "error")
    warnings = sum(1 for v in all_violations if v.severity == "warning")
    print(f"\n{'─' * 70}")
    print(f"  {len(all_violations)} violations ({errors} errors, {warnings} warnings) "
          f"across {len(by_file)} file(s)")
    print(f"{'─' * 70}\n")

    return 1 if errors > 0 else 0


if __name__ == "__main__":
    sys.exit(main())
