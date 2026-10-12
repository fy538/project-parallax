#!/usr/bin/env python3
"""
generate_manifest.py — Assembly Manifest Generator for Parallax episodes.

Parses a two-column production script (SCRIPT_FORMAT.md) and produces an
assembly manifest JSON that maps every second of the video to a visual element.

Two modes:
  estimate  — derives timing from script hints (~18s, 4s, "match narration")
              and word-count estimates. Use before narration is recorded.
  precise   — uses WhisperX phoneme-level alignment + SileroVAD pause detection
              for ±50ms precision. RapidFuzz fuzzy-matches transcript to script.
              (Requires: pip install whisperx rapidfuzz torch torchaudio)

Usage:
  # Estimate mode (no audio needed)
  python generate_manifest.py \\
    --script ../../episodes/silicon-trap/script-v5-production.md \\
    --episode silicon-trap \\
    --output ../../remotion-templates/data/episodes/silicon-trap/assembly-manifest.json

  # Precise mode (with narration audio)
  python generate_manifest.py \\
    --script ../../episodes/silicon-trap/script-v5-production.md \\
    --episode silicon-trap \\
    --audio ../../episodes/silicon-trap/narration.wav \\
    --output ../../remotion-templates/data/episodes/silicon-trap/assembly-manifest.json
"""

import argparse
import copy
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

_SHARED = Path(__file__).resolve().parent.parent / "shared"
sys.path.insert(0, str(_SHARED))
from backdrop_manifest import warn_clutter_backdrop_mismatch  # noqa: E402

# ── Constants ──────────────────────────────────────────────────────────────

WPM = 150  # analytical narration pace (from PRODUCTION_NOTES)
FPS = 30
DEFAULT_BROLL_INTERVAL = 4.0  # seconds per visual change for auto-fill gaps
END_CARD_PADDING_SEC = 4  # seconds added after narration ends for end-card hold

# ── Backdrop tags ([BACKDROP: id]) ──────────────────────────────────────────
# Canonical ids: remotion-templates/data/backdrop-manifest.json

BACKDROP_TAG_RE = re.compile(r"\[BACKDROP:\s*([a-z0-9-]+)\]", re.IGNORECASE)

# ── FilmOverlay tags ([OVERLAY: preset]) ────────────────────────────────────
#
# Rare. Most segments resolve their FilmOverlay preset via the cascade in
# `src/utils/resolveFilmOverlay.ts` from backdrop choice + template kind —
# script writers usually don't need to specify anything. Use [OVERLAY:] only
# when a specific moment needs to break from the auto-resolved preset
# (e.g. force `dramatic` on an otherwise documentary-toned segment for an
# editorial peak).
#
# Enum mirrors the schema's `$defs.filmOverlayConfig.preset` field. The
# whole FilmOverlay system is GATED on episode-level `manifest.filmOverlay`
# being set — if the episode hasn't opted in, [OVERLAY:] tags are emitted
# into the manifest but ignored at render time.

OVERLAY_TAG_RE = re.compile(
    r"\[OVERLAY:\s*(clean|documentary|cinematic|dramatic|archival)\]",
    re.IGNORECASE,
)

_VALID_BACKDROP_IDS: frozenset[str] | None = None


def _backdrop_manifest_path() -> Path:
    return Path(__file__).resolve().parents[2] / "remotion-templates" / "data" / "backdrop-manifest.json"


def valid_backdrop_ids() -> frozenset[str]:
    """Load backdrop ids from backdrop-manifest.json (cached)."""
    global _VALID_BACKDROP_IDS
    if _VALID_BACKDROP_IDS is not None:
        return _VALID_BACKDROP_IDS
    path = _backdrop_manifest_path()
    if not path.is_file():
        _VALID_BACKDROP_IDS = frozenset()
        return _VALID_BACKDROP_IDS
    with path.open(encoding="utf-8") as f:
        payload = json.load(f)
    _VALID_BACKDROP_IDS = frozenset(b["id"] for b in payload.get("backdrops", []))
    return _VALID_BACKDROP_IDS


# ── DIR: annotation parsing ───────────────────────────────────────────────
# Matches: DIR: type(params)
DIR_LINE_RE = re.compile(r"^\s*DIR:\s*(\w+)\((.+?)\)\s*$")

# ── AMB: annotation parsing ───────────────────────────────────────────────
# Matches `[AMB: archive-room]` or `AMB: archive-room` (with or without brackets)
# Used in the visual column to override the ambient soundscape register for a segment.
AMB_LINE_RE = re.compile(r"^\[?AMB:\s*([a-z-]+)\]?\s*$", re.IGNORECASE)

# Valid ambient soundscape registers (must stay in sync with
# remotion-templates/src/audio/soundscapeRegistry.ts SoundscapeRegister enum).
VALID_SOUNDSCAPE_REGISTERS = frozenset({
    "archive-room",
    "editorial-print",
    "atmospheric-outdoor",
    "cinematic-dark",
    "cyclical-drone",
    "silence",
})

# Hold presets → (holdAfter, holdBehavior)
HOLD_PRESETS = {
    "breathe": (2.0, "breathe"),
    "land": (1.0, "land"),
    "linger": (3.0, "linger"),
}

# Drift presets accepted by `DIR: drift(<preset>)` — must stay in sync with
# DRIFT_PRESETS in remotion-templates/src/hooks/useDirection.ts. Adding a
# preset here without adding it to useDirection (or vice versa) will leave
# the parser writing _direction.driftPreset values that templates ignore.
# See HOLD_MOTION_REGISTER.md for the editorial register each preset claims.
VALID_DRIFT_PRESETS = {
    "none",          # Stillness — document of record
    "editorial",     # The current conservative default (charts, diagrams)
    "slow",          # Back-compat preset (legacy episodes)
    "normal",        # Back-compat preset (legacy episodes)
    "documentary",   # Full Ken Burns — photo plates, archival, atmospheric
    "breathing",     # Sinusoidal scale; held hero stats, quotes, atlas plates
    "settle",        # One-time scale lock; framework headers, title cards
    "sway",          # Zero-net pan; held atmospheric maps
}

# Transition type mappings for cut()
# Canonical doctrine: project/TRANSITION_GRAMMAR.md (May 16, 2026).
# Deprecated values remain in VALID_CUT_TYPES for back-compat with shipped
# manifests but are flagged on parse (see DEPRECATED_CUT_TYPES below).
# `match-cut-still` was added in Phase 4 (composition-locked variant).
VALID_CUT_TYPES = {
    "cut", "fade", "dissolve", "wipe-left", "wipe-right", "wipe-up",
    "blur-through", "color-wash", "iris", "match-cut", "match-cut-still",
    "whip-pan", "spatial-zoom",
}

# Per-template-pair defaults — when the implicit-default engine sees two
# consecutive segments with the same component name AND the component is
# in this set AND no DIR override + no beat change, it defaults the in-
# transition to `match-cut-still` (composition-locked crossfade) instead
# of the legacy 0.3s dissolve. Promotes match-cut from unused to first-
# class for cartographic / historical-photo sequences where the two
# segments genuinely share composition. Phase 4 of TRANSITION_GRAMMAR.md.
MATCH_CUT_STILL_TEMPLATES = {
    "AtlasPlate",
    "ChoroplethMap",
    "AnnotatedImage",
    "RouteAnimation",
    "PhotoMontage",
    "CinematicMap",    # consecutive terrain shots lock to composition (same camera space)
    "TerritoryMap",    # consecutive territory segments share the same map canvas
    "FlowMap",         # consecutive flow maps share the same basemap
}

# Deprecated transitions per Phase 3 of TRANSITION_GRAMMAR.md. Each entry
# maps the deprecated name to (canonical-replacement, reason). The parser
# emits a one-shot stderr warning when these are encountered. Mirror of
# DEPRECATED_TRANSITIONS in remotion-templates/src/components/Transitions.tsx —
# keep in sync.
DEPRECATED_CUT_TYPES = {
    "wipe-left":     ("dissolve",  "PowerPoint signature"),
    "wipe-right":    ("dissolve",  "PowerPoint signature"),
    "wipe-up":       ("dissolve",  "PowerPoint signature"),
    "blur-through":  ("dissolve",  "YouTube-explainer signature"),
    "whip-pan":      ("cut",       "sports-broadcast / Vice News tell"),
    "spatial-zoom":  ("match-cut", "gimmicky depth-flight"),
}

# One-shot dedup so a script using many deprecated cuts only warns once each.
_warned_deprecated_cuts: set[str] = set()

# Palette name → hex for color-wash
PALETTE_COLORS = {
    "ink": "#1C1814",
    "amber": "#E5A544",
    "rust": "#C23B22",
    "bone": "#F0E6D0",
    "paper": "#F5F0E8",
    "oxblood": "#6B1D1D",
}

# Canonical text-animation technique names for `DIR: type(...)`. Mirrors
# the Zod enum in remotion-templates/src/hooks/directionBlock.schema.ts
# (TextAnimationTechniqueSchema). When this list changes, the schema
# must change too — and the schema-enum-sync test catches drift between
# manifest_lint and the schema, but this constant lives in a third file
# without automatic checking. Last synced: 2026-05-16.
VALID_TEXT_ANIMATIONS = {
    # Atomic primitives
    "typewriter",
    "tracking-in",
    "reveal-mask",
    "underline-draw",
    "number-ticker",
    "scramble",
    "backspace",
    "word-cascade",
    # Composite patterns
    "definition-reveal",
    "stat-caption",
    "quote-attribution",
}

# Templates that can be drawn over a held picture (DIR: over(previous) —
# hold-under, TRANSITION_GRAMMAR.md § "On the episode timeline"). Mirrors the
# `overPicture` support in remotion-templates/src/templates; extend both together.
OVER_PICTURE_TEMPLATES = {"KineticTypography"}

# ── PACE: annotation parsing ─────────────────────────────────────────────
# Matches: PACE: profile
PACE_LINE_RE = re.compile(r"^\s*PACE:\s*(\w+)\s*$")

# Pacing profiles → duration multiplier
PACE_MULTIPLIERS = {
    "urgent": 0.7,       # 30% shorter than analytical default
    "analytical": 1.0,   # baseline (4-6s per visual change)
    "breathing": 1.4,    # 40% longer (6-10s per visual change)
}


# ── Data Classes ───────────────────────────────────────────────────────────

@dataclass
class WordTimestamp:
    word: str
    start: float
    end: float


@dataclass
class Asset:
    shotListId: str | None = None
    searchTerms: list = field(default_factory=list)
    source: str | None = None
    file: str | None = None


@dataclass
class Treatment:
    ramp: str = "standard"
    composite: str = "background"
    opacity: float | None = None


@dataclass
class Template:
    component: str = ""
    dataFile: str = ""


@dataclass
class Hold:
    freeze: bool = True


@dataclass
class Transition:
    in_: str = "cut"
    out: str = "cut"
    durationSec: float = 0.5


@dataclass
class Segment:
    id: str = ""
    type: str = ""
    startSec: float = 0.0
    endSec: float = 0.0
    layer: str = "background"
    beat: str = ""
    priority: str = "P2"
    narrationRef: str = ""
    asset: Asset | None = None
    treatment: Treatment | None = None
    template: Template | None = None
    hold: Hold | None = None
    transition: Transition | None = None
    notes: str = ""

    def to_dict(self):
        d = {}
        for k, v in asdict(self).items():
            if v is None:
                continue
            if k == "transition" and v:
                # Rename in_ back to in for JSON
                v2 = {"in": v.pop("in_"), "out": v.pop("out"), "durationSec": v.pop("durationSec")}
                d["transition"] = v2
            elif isinstance(v, dict) and all(vv is None for vv in v.values()):
                continue
            else:
                d[k] = v
        return d


@dataclass
class Beat:
    id: str
    title: str
    startSec: float
    endSec: float = 0.0


# ── Script Parser ──────────────────────────────────────────────────────────

# Matches: ## BEAT N — TITLE (START–END)
BEAT_RE = re.compile(
    r"^##\s+BEAT\s+(\d+)\s*[—–-]\s*(.+?)\s*\((\d+):(\d+)[—–-](\d+):(\d+)\)",
    re.IGNORECASE,
)

# Also matches opening/closing sections without time ranges
SECTION_RE = re.compile(r"^##\s+(.+)", re.IGNORECASE)

# Table row: | NARRATION | VISUAL PRODUCTION |
TABLE_ROW_RE = re.compile(r"^\|\s*(.*?)\s*\|\s*(.*?)\s*\|$")

# Duration patterns in visual specs
DURATION_EXPLICIT_RE = re.compile(r"(\d+(?:\.\d+)?)\s*s(?:\s+hold)?")
DURATION_MATCH_RE = re.compile(r"match\s+narration\s*(?:\(~(\d+)s\))?", re.IGNORECASE)

# Priority tier
PRIORITY_RE = re.compile(r"\*\*P(\d)\s*[—–-]")

# Treatment ramp
RAMP_RE = re.compile(r"·\s*(standard|conflict|editorial)\s*·", re.IGNORECASE)

# Composite mode + opacity
COMPOSITE_RE = re.compile(
    r"(background|inset|antipode)\s*@?\s*(\d+)%?", re.IGNORECASE
)

# All Remotion template component names — keep in sync with:
#   - FullEpisode TEMPLATE_COMPONENTS map
#   - assembly-manifest.schema.json segment.template.component enum
ALL_TEMPLATES = [
    # ── Core (original) ──────────────────────────────────────────────────────
    "TitleTransition", "KineticTypography", "DataChart",
    "FrameworkDiagram", "ChoroplethMap", "RouteAnimation", "DecisionTree",
    "SplitComposition", "ProbabilityGauge", "ImageComposite", "PhotoMontage",
    "NetworkDiagram", "TimeSeriesChart", "SankeyFlow", "GameBoard",
    "BayesianUpdate", "StatReveal", "RadarChart", "AnnotatedImage", "ScrollyReveal",
    "EscalationLadder", "HorizontalTimeline", "HorizontalTimelineSingle",
    "DuelingFrameworks", "StrategicLandscape",
    # ── Audit #5 backfill (May 2026) — expanded chart/diagram library ────────
    "ArcDiagram", "ProportionalSymbolMap", "Slopegraph", "KPICard",
    "BulletChart", "StepLine", "OutcomePartition", "PricingWaterfall",
    "AtlasPlate", "BeeswarmChart", "BumpChart", "CalendarHeatmap",
    "CartogramMap", "ConnectedScatterplot", "DensityMap", "DumbbellPlot",
    "HorizonChart", "IsotypeChart", "MarimekkoChart", "PopulationPyramid",
    "RankChangeDotPlot", "RidgelinePlot", "Streamgraph", "TernaryPlot",
    "TilegramUSMap",
    # ── May 2026 sprint — new template families ───────────────────────────────
    "CinematicMap",          # 3D terrain fly-through (Mapbox FreeCamera)
    "TerritoryMap",          # animated territorial control over timesteps
    "FlowMap",               # directional volume flows (arc width = magnitude)
    "CausalLoopDiagram", "SpiralTimeline", "PrimarySourceReveal", "SmallMultiples",
    "HandwrittenLetter", "NewspaperHeadlineRotator", "ArchivalReel", "TelegramCable",
    "Syllogism", "AxiomList", "DialecticFlow", "ConditionalArgument", "CounterfactualPath",
    "AnalogyCrossmap", "ToulminMap",
    "PhilosophicalFamilyTree",  # ArcDiagram-variant with year-based x-axis
    "ConceptEvolutionTimeline", # HorizontalTimeline-variant with per-node definition panels
    "DivergingBar",             # centered horizontal bar (positive right / negative left)
    "DotPlot",                  # 1D strip chart: named entities along a continuous axis
    "OrgChart",                 # directed authority tree (NCA, ORBAT, procurement chains)
    "AnnotatedZoom",            # cinematic zoom regions on a 2D image/map canvas
    "BubbleMatrix",             # 4-variable scatter (X/Y/size/color) — Gapminder register
    "BarChartRace",             # animated rank race: bars animate width + vertical position
    "SanctionsNetwork",         # typed sanctions architecture: sanctioner/target/relay/sector nodes
    "ComparisonPair", "MorphTransition", "SplitFrame",
    "VennDiagram", "ChordDiagram", "Treemap", "MatrixHeatmap",
    "MathReveal", "MathDerivation",
    # ── DEPRECATED — kept for regex-matching old scripts during migration ─────
    # Do NOT use these in new episode manifests. They will not resolve in
    # FullEpisode TEMPLATE_COMPONENTS and will fail at render time.
    "TimelineComparison",    # deprecated May 2026 — use HorizontalTimeline
    "BifurcationRoute",      # deprecated — use RouteAnimation with radial: {} field
    "DualTimeline",          # deprecated May 2026 — use HorizontalTimeline
    "TimelineMorph",         # deprecated — use MorphTransition
]
_TEMPLATE_NAMES = "|".join(ALL_TEMPLATES)

# Template type
TEMPLATE_RE = re.compile(
    rf"\*\*(P\d)?\s*[—–-]?\s*({_TEMPLATE_NAMES})\*\*",
    re.IGNORECASE,
)

# Also match simpler template references
TEMPLATE_SIMPLE_RE = re.compile(
    rf"({_TEMPLATE_NAMES})",
    re.IGNORECASE,
)

# Search terms in quotes
SEARCH_TERMS_RE = re.compile(r'"([^"]+)"')

# Source
SOURCE_RE = re.compile(
    r"·\s*(Pexels|Pixabay|Unsplash|Wikimedia\s*Commons|Library\s*of\s*Congress|Press\s*kit)\s*·?",
    re.IGNORECASE,
)

# Production notes in italics
NOTES_RE = re.compile(r"\*([^*]+)\*")

# FOOTAGE / IMAGE / TRANSITION / HOLD type markers
TYPE_MARKERS = {
    "FOOTAGE": re.compile(r"\*\*P\d\s*[—–-]\s*FOOTAGE\*\*", re.IGNORECASE),
    "IMAGE": re.compile(r"\*\*P\d\s*[—–-]\s*IMAGE\*\*", re.IGNORECASE),
    "TRANSITION": re.compile(r"\*\*TRANSITION\*\*", re.IGNORECASE),
    "HOLD": re.compile(r"\*\*HOLD\*\*", re.IGNORECASE),
}


def estimate_narration_duration(text: str) -> float:
    """Estimate narration duration from word count at WPM pace."""
    text = re.sub(r"\*[^*]+\*", "", text)  # strip stage directions
    text = re.sub(r"\([^)]+\)", "", text)  # strip parenthetical notes
    words = [w for w in text.split() if w.strip()]
    return len(words) / WPM * 60


def parse_visual_spec(spec: str) -> dict | None:
    """Parse a single visual production cell into structured data."""
    result = {
        "type": None,
        "priority": "P2",
        "component": None,
        "searchTerms": [],
        "source": None,
        "ramp": "standard",
        "composite": "background",
        "opacity": None,
        "durationSec": None,
        "durationMode": "explicit",  # or "match_narration"
        "notes": "",
        "dataFile": None,
        "backdropId": None,
    }

    if not spec.strip():
        return None

    # Detect type
    for type_name, pattern in TYPE_MARKERS.items():
        if pattern.search(spec):
            result["type"] = type_name
            break

    # Check for template reference
    tmatch = TEMPLATE_RE.search(spec)
    if tmatch:
        result["component"] = tmatch.group(2)
        if not result["type"]:
            result["type"] = "TEMPLATE"
    elif not result["type"]:
        tmatch2 = TEMPLATE_SIMPLE_RE.search(spec)
        if tmatch2:
            result["component"] = tmatch2.group(1)
            result["type"] = "TEMPLATE"

    if result["type"] == "TRANSITION" and not result["component"]:
        result["component"] = "TitleTransition"

    # Priority
    pmatch = PRIORITY_RE.search(spec)
    if pmatch:
        result["priority"] = f"P{pmatch.group(1)}"

    # Search terms
    result["searchTerms"] = SEARCH_TERMS_RE.findall(spec)

    # Source
    smatch = SOURCE_RE.search(spec)
    if smatch:
        result["source"] = smatch.group(1).lower().replace(" ", "-")

    # Treatment ramp
    rmatch = RAMP_RE.search(spec)
    if rmatch:
        result["ramp"] = rmatch.group(1).lower()

    # Composite mode + opacity
    cmatch = COMPOSITE_RE.search(spec)
    if cmatch:
        result["composite"] = cmatch.group(1).lower()
        result["opacity"] = int(cmatch.group(2)) / 100

    # Duration
    dmatch = DURATION_MATCH_RE.search(spec)
    if dmatch:
        result["durationMode"] = "match_narration"
        if dmatch.group(1):
            result["durationSec"] = float(dmatch.group(1))
    else:
        # Find the LAST explicit duration (to avoid matching numbers in other contexts)
        all_durations = DURATION_EXPLICIT_RE.findall(spec)
        if all_durations:
            result["durationSec"] = float(all_durations[-1])

    # Also check for "Xs hold" pattern
    hold_match = re.search(r"(\d+)s\s+hold", spec)
    if hold_match:
        result["durationSec"] = float(hold_match.group(1))

    # Notes (italicized production annotations — the ones inside *...*)
    notes = NOTES_RE.findall(spec)
    # Filter out: stage directions, template type labels, priority markers
    notes = [
        n.strip() for n in notes
        if not n.startswith("(")
        and "P1" not in n and "P2" not in n and "P3" not in n
        and "FOOTAGE" not in n and "IMAGE" not in n
        and "TRANSITION" not in n and "HOLD" not in n
        and len(n) > 5  # skip very short fragments
    ]
    result["notes"] = " | ".join(notes) if notes else ""

    # Check for [generate via visual-spec] which means there should be a data file
    if "[generate via visual-spec]" in spec:
        result["dataFile"] = "pending"

    bd_m = BACKDROP_TAG_RE.search(spec)
    if bd_m:
        result["backdropId"] = bd_m.group(1).strip().lower()

    # FilmOverlay preset override — surfaced as template.filmOverlay.preset
    # on the segment. Absent → cascade resolves at render time.
    ov_m = OVERLAY_TAG_RE.search(spec)
    if ov_m:
        result["overlayPreset"] = ov_m.group(1).strip().lower()
    else:
        result["overlayPreset"] = None

    return result


def _extract_sync_words(params_str: str) -> list[str]:
    """
    Extract sync words from a DIR directive's parameter string.

    Grammar:
        sync:"word"             — single word (legacy, still supported)
        syncs:["word1","word2"] — list, maps 1:1 to syncPoints[i] in the
                                  template (per-element D17 — POLISH.md D19,
                                  L103). Use for templates that surface
                                  multiple labeled entities and want each
                                  to anticipate its own narration cue:
                                  NetworkDiagram, ArcDiagram, EscalationLadder
                                  rungs, HorizontalTimeline events,
                                  AnnotatedImage callouts (indexed 1..N
                                  with image at 0), FrameworkDiagram
                                  columns/cells, BumpChart entities.

    Returns the list of sync words in order. Empty list if neither form
    is present. If BOTH forms are present, returns the plural list first
    then the singular (defensive — shouldn't happen in well-formed scripts).
    """
    words: list[str] = []

    # Plural form — `syncs:["a","b",...]`
    syncs_m = re.search(r'syncs:\s*\[([^\]]+)\]', params_str)
    if syncs_m:
        words.extend(re.findall(r'"([^"]+)"', syncs_m.group(1)))

    # Singular form — `sync:"a"`. Use a negative-lookahead to not match
    # `syncs:` (which would already be handled above). Without `(?!s:)`,
    # `syncs:` would be matched as `sync:` with `s:["..."]` parsed as part
    # of the value (corrupted).
    sync_m = re.search(r'sync(?!s:)\s*:\s*"([^"]+)"', params_str)
    if sync_m:
        words.append(sync_m.group(1))

    return words


def _slugify_chapter_title(title: str) -> str:
    """Slugify a chapter title for matching against `title-section-<slug>.json`.

    Lowercases, drops articles (the/a/an), removes apostrophes, collapses
    non-alphanumerics to hyphens, strips edges. Matches the convention used
    in SILICON_TRAP_DATA_FILES (e.g. "The Logic of Denial" → "denial",
    "The Other Side of the Wall" → "wall", "The Trap" → "trap").

    Authors can override the auto-derived slug with the second positional
    arg or `slug:"..."` keyword in `chapter(...)`.
    """
    s = title.lower()
    s = re.sub(r"['']", "", s)  # drop apostrophes (don't → dont)
    # Drop common stop words to mirror existing title-section naming
    s = re.sub(r"\b(the|a|an|of|and|in|on|at|to|for|with)\b", " ", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    s = s.strip("-")
    # Final-token convention: SILICON_TRAP uses single-word slugs
    # (denial, wall, trap, chips, paradox). Take the last meaningful token.
    parts = [p for p in s.split("-") if p]
    if not parts:
        return "section"
    return parts[-1]


def parse_dir_lines(dir_lines: list[str]) -> dict:
    """
    Parse DIR: annotation lines into a direction dict for assembly manifest use.

    Extracts hold(), cut(), mood(), type(), and sync metadata from cam() /
    reveal(). cam() and reveal() positional parameters themselves are
    consumed by Remotion templates via _direction in JSON data files, not
    by the assembly manifest.

    Returns dict with keys: holdAfter, holdBehavior, preDelay, transitionOut,
    transitionDuration, washColor, narrationGate, syncWords, textAnimation,
    isCallback, narrationLeadIn (jcut), narrationLagOut (lcut),
    overPrevious / overDim (over).
    """
    result = {}

    for line in dir_lines:
        m = DIR_LINE_RE.match(line)
        if not m:
            continue

        dtype = m.group(1).lower()
        params_str = m.group(2).strip()

        if dtype == "hold":
            # Parse hold() — affects segment timing
            # Examples: hold(2s), hold(breathe), hold(land), hold(pre:1s),
            #           hold(pre:1s, breathe), hold(until:"word")
            for token in re.split(r",\s*", params_str):
                token = token.strip()

                # hold(until:"word")
                until_m = re.match(r'until:\s*"([^"]+)"', token)
                if until_m:
                    result["narrationGate"] = {"word": until_m.group(1)}
                    continue

                # hold(pre:Xs)
                pre_m = re.match(r"pre:\s*(\d+(?:\.\d+)?)s?", token)
                if pre_m:
                    result["preDelay"] = float(pre_m.group(1))
                    continue

                # hold(Xs) — explicit seconds
                sec_m = re.match(r"^(\d+(?:\.\d+)?)s?$", token)
                if sec_m:
                    result["holdAfter"] = float(sec_m.group(1))
                    continue

                # hold(preset) — breathe, land, linger
                if token in HOLD_PRESETS:
                    hold_after, hold_behavior = HOLD_PRESETS[token]
                    result["holdAfter"] = hold_after
                    result["holdBehavior"] = hold_behavior
                    continue

                # hold(stillness) — sugar for drift(none). Reads naturally
                # in scripts: "hold this beat with stillness." Sets the
                # segment's driftPreset to "none" so D17 anticipation
                # lands then the screen sits perfectly still for the
                # remainder (eulogy, casualty list, document-of-record
                # quote). HOLD_MOTION_REGISTER.md technique 01.
                if token == "stillness":
                    result["driftPreset"] = "none"
                    continue

        elif dtype == "drift":
            # Parse drift(<preset>) — sets the segment's drift register
            # per HOLD_MOTION_REGISTER.md / POLISH.md D20. Examples:
            #   drift(documentary)  — photo plates, archival, atlas plates
            #   drift(breathing)    — held hero stats, quotes
            #   drift(settle)       — framework headers, title cards
            #   drift(sway)         — held atmospheric maps
            #   drift(none)         — stillness (alias of hold(stillness))
            preset = params_str.strip().lower()
            if preset in VALID_DRIFT_PRESETS:
                result["driftPreset"] = preset

        elif dtype == "cut":
            # Parse cut() — affects transition out
            # Examples: cut(iris, origin:center, 0.6s), cut(color-wash, ink, 0.7s)
            tokens = [t.strip() for t in re.split(r",\s*", params_str)]

            # First token is always the transition type
            if tokens:
                cut_type = tokens[0].lower()
                if cut_type in VALID_CUT_TYPES:
                    # Emit one-shot deprecation notice per TRANSITION_GRAMMAR.md
                    if cut_type in DEPRECATED_CUT_TYPES and cut_type not in _warned_deprecated_cuts:
                        replacement, reason = DEPRECATED_CUT_TYPES[cut_type]
                        # "cut(cut)" reads awkwardly — use a plain hard-cut
                        # phrase when the canonical replacement is `cut`.
                        replacement_phrase = (
                            "a plain hard cut (omit the cut() directive)"
                            if replacement == "cut"
                            else f"cut({replacement})"
                        )
                        print(
                            f"⚠  cut({cut_type}) is deprecated — {reason}. "
                            f"Use {replacement_phrase} instead. "
                            f"(project/TRANSITION_GRAMMAR.md)",
                            file=sys.stderr,
                        )
                        _warned_deprecated_cuts.add(cut_type)
                    result["transitionOut"] = cut_type

            # Look for duration and color in remaining tokens
            for token in tokens[1:]:
                # Duration: 0.5s, 0.7s
                dur_m = re.match(r"^(\d+(?:\.\d+)?)s$", token.strip())
                if dur_m:
                    result["transitionDuration"] = float(dur_m.group(1))
                    continue

                # Palette color name (for color-wash)
                color_name = token.strip().lower()
                if color_name in PALETTE_COLORS:
                    result["washColor"] = PALETTE_COLORS[color_name]

        elif dtype == "cam":
            # Extract sync words for Whisper alignment.
            # Supports both singular `sync:"word"` and plural `syncs:["w1","w2"]`.
            # The plural form is for per-element D17 templates (NetworkDiagram,
            # ArcDiagram, EscalationLadder, AnnotatedImage, etc.) where each
            # entity/rung/callout has its own narration cue. List order maps
            # 1:1 to `syncPoints[i]` indices consumed by the template.
            for sw in _extract_sync_words(params_str):
                result.setdefault("syncWords", []).append(sw)

        elif dtype == "reveal":
            # Extract sync words from reveal() — same grammar as cam().
            for sw in _extract_sync_words(params_str):
                result.setdefault("syncWords", []).append(sw)

        elif dtype == "chapter":
            # Parse chapter() — Phase 6 of TRANSITION_GRAMMAR.md.
            # Sugar for `[TRANSITION] TitleTransition` segment + fade pair.
            # Reduces 4 lines of authoring boilerplate (timestamp + empty
            # narration + visual cell with **TRANSITION** TitleTransition +
            # data file reference) to a single DIR directive.
            #
            # Grammar:
            #   chapter("Title Text")
            #   chapter("Title Text", kicker:"Optional kicker")
            #   chapter("Title Text", "section-slug")  — slug override
            #
            # The slug defaults to slugify(title) and is used to look up the
            # corresponding `title-section-<slug>.json` data file. If no
            # data file is found, the segment is still emitted but the
            # template will fall back to inline `props.title` (Remotion
            # wiring of inline-title is queued for a follow-up; the segment
            # structure is the value Phase 6 delivers).
            tokens = []
            current = ""
            depth = 0
            in_str = False
            for ch in params_str:
                if ch == '"' and depth == 0:
                    in_str = not in_str
                    current += ch
                elif ch == "," and not in_str and depth == 0:
                    tokens.append(current.strip())
                    current = ""
                else:
                    current += ch
            if current.strip():
                tokens.append(current.strip())

            chapter = {}
            for _i, token in enumerate(tokens):
                # kicker:"..."
                kicker_m = re.match(r'^kicker:\s*"([^"]+)"\s*$', token)
                if kicker_m:
                    chapter["kicker"] = kicker_m.group(1)
                    continue
                # slug:"..." or bare second positional "slug"
                slug_m = re.match(r'^slug:\s*"([^"]+)"\s*$', token)
                if slug_m:
                    chapter["slug"] = slug_m.group(1)
                    continue
                # Bare quoted string — first is title, second is slug
                bare_m = re.match(r'^"([^"]+)"\s*$', token)
                if bare_m:
                    if "title" not in chapter:
                        chapter["title"] = bare_m.group(1)
                    elif "slug" not in chapter:
                        chapter["slug"] = bare_m.group(1)
                    continue
                # Unknown token — silently ignored (forward-compat).

            if "title" in chapter:
                if "slug" not in chapter:
                    chapter["slug"] = _slugify_chapter_title(chapter["title"])
                result["chapter"] = chapter

        elif dtype == "over":
            # Parse over(previous) — hold-under (TRANSITION_GRAMMAR.md § "On
            # the episode timeline"). This card is set over the picture before
            # it: the picture is held on its last frame and dimmed for the
            # length of the card. `previous` is the only target.
            # Grammar:
            #   over(previous)
            #   over(previous, dim:0.6)   — how far the picture is darkened (0–1)
            tokens = [t.strip() for t in re.split(r",\s*", params_str)]
            if tokens and tokens[0].lower() == "previous":
                result["overPrevious"] = True
                for token in tokens[1:]:
                    dim_m = re.match(r"^dim:\s*(\d*\.?\d+)$", token)
                    if dim_m:
                        result["overDim"] = min(1.0, float(dim_m.group(1)))

        elif dtype == "jcut":
            # Parse jcut(N) — J-cut audio bridge (TRANSITION_GRAMMAR.md §07).
            # Sets narrationLeadIn: the narrator's audio for THIS segment begins
            # N seconds before the segment's startSec so the audio bridges the
            # visual seam. Used in NLE assembly; does NOT affect Remotion timing.
            # Grammar: jcut(0.7)  or  jcut(0.5s)
            num_m = re.match(r"^([0-9]+(?:\.[0-9]+)?)s?$", params_str.strip())
            if num_m:
                result["narrationLeadIn"] = float(num_m.group(1))

        elif dtype == "lcut":
            # Parse lcut(N) — L-cut audio bridge (TRANSITION_GRAMMAR.md §07).
            # Sets narrationLagOut: narration from THIS segment extends N seconds
            # past the segment's endSec (audio trails the visual cut). Used in
            # NLE assembly; does NOT affect Remotion timing.
            # Grammar: lcut(0.5)  or  lcut(0.3s)
            num_m = re.match(r"^([0-9]+(?:\.[0-9]+)?)s?$", params_str.strip())
            if num_m:
                result["narrationLagOut"] = float(num_m.group(1))

        elif dtype == "type":
            # Parse type() — text-animation register for text-bearing
            # templates (KineticTypography, StatReveal). See
            # project/TEXT_ANIMATION_REGISTER.md for the technique catalog.
            # Grammar:
            #   type(<technique>)
            #   type(<technique>, callback)
            #   type(<technique>, isCallback:true)
            tokens = [t.strip() for t in re.split(r",\s*", params_str)]
            for token in tokens:
                # Bare technique name (first positional)
                if "textAnimation" not in result and token in VALID_TEXT_ANIMATIONS:
                    result["textAnimation"] = token
                    continue
                # Bare `callback` modifier
                if token.lower() == "callback":
                    result["isCallback"] = True
                    continue
                # `isCallback:true|false` keyword form
                cb_m = re.match(r"^isCallback:\s*(true|false)\s*$", token, re.IGNORECASE)
                if cb_m:
                    result["isCallback"] = cb_m.group(1).lower() == "true"
                    continue
                # Unknown token — silently ignored (forward-compat for
                # future sub-params like cps:22, cursor:blink). A future
                # version may surface these as warnings; for Phase 3
                # minimum, accept and discard.

    return result


def parse_script(script_path: str) -> tuple[list[Beat], list[dict]]:
    """
    Parse a two-column production script into beats and raw visual specs.

    Returns:
      beats: list of Beat objects with timing
      rows: list of dicts with {beat, narration, visual_spec, parsed_spec}
    """
    text = Path(script_path).read_text(encoding="utf-8")
    lines = text.split("\n")

    beats = []
    rows = []
    current_beat = None
    current_pace = "analytical"  # default pacing profile

    for line in lines:
        # Stop at ASSET SUMMARY — everything below is metadata, not narration
        if re.match(r"^##\s+(ASSET\s+SUMMARY|CLAIM\s+VERIFICATION)", line, re.IGNORECASE):
            break

        # Also stop at PRODUCTION NOTES
        if re.match(r"^##\s+PRODUCTION\s+NOTES", line, re.IGNORECASE):
            break

        # Check for beat header
        bmatch = BEAT_RE.match(line)
        if bmatch:
            beat_num = int(bmatch.group(1))
            beat_title = bmatch.group(2).strip()
            start_min, start_sec = int(bmatch.group(3)), int(bmatch.group(4))
            end_min, end_sec = int(bmatch.group(5)), int(bmatch.group(6))
            current_beat = Beat(
                id=f"beat{beat_num}",
                title=beat_title,
                startSec=start_min * 60 + start_sec,
                endSec=end_min * 60 + end_sec,
            )
            beats.append(current_beat)
            # Reset pace to default at beat boundaries — prevents a forgotten
            # PACE: urgent from infecting the rest of the episode
            if current_pace != "analytical":
                print(f"  Note: PACE reset from '{current_pace}' to 'analytical' "
                      f"at Beat {beat_num} ({beat_title})")
                current_pace = "analytical"
            continue

        # Table header row
        if TABLE_ROW_RE.match(line):
            row_match = TABLE_ROW_RE.match(line)
            narr = row_match.group(1).strip()
            vis = row_match.group(2).strip()

            # Skip header rows
            if narr == "NARRATION" or narr.startswith("---"):
                continue
            if narr.startswith("---"):
                continue

            # Check if this is a DIR: continuation line (empty narration, DIR: in visual)
            if not narr and vis.strip().startswith("DIR:"):
                # Attach to the previous row's direction lines
                if rows:
                    rows[-1].setdefault("dir_lines", []).append(vis.strip())
                continue

            # Check if this is a PACE: line (empty narration, PACE: in visual)
            if not narr:
                pace_m = PACE_LINE_RE.match(vis.strip())
                if pace_m:
                    pace_label = pace_m.group(1).lower()
                    if pace_label in PACE_MULTIPLIERS:
                        current_pace = pace_label
                    else:
                        print(f"  Warning: unknown PACE profile '{pace_label}' "
                              f"(valid: {', '.join(PACE_MULTIPLIERS.keys())})")
                    continue

            # Check if this is an AMB: continuation line (empty narration, AMB: in visual)
            if not narr:
                amb_m = AMB_LINE_RE.match(vis.strip())
                if amb_m:
                    register = amb_m.group(1).lower()
                    if register in VALID_SOUNDSCAPE_REGISTERS:
                        if rows:
                            rows[-1]["amb_register"] = register
                    else:
                        print(f"  Warning: unknown AMB register '{register}' "
                              f"(valid: {', '.join(sorted(VALID_SOUNDSCAPE_REGISTERS))})")
                    continue

            # Extract any inline [AMB: register] tag from the visual cell.
            # Handles the case where AMB: appears on the same row as the visual
            # spec, e.g. "[MG:] StatReveal  [AMB: silence]". The tag is stripped
            # conceptually; parse_visual_spec receives the full string but the
            # [AMB:] bracket form is not a recognized visual token so it is
            # silently ignored by the parser, which is the correct behavior.
            amb_register_inline = None
            amb_inline_m = re.search(r"\[AMB:\s*([a-z-]+)\]", vis, re.IGNORECASE)
            if amb_inline_m:
                candidate = amb_inline_m.group(1).lower()
                if candidate in VALID_SOUNDSCAPE_REGISTERS:
                    amb_register_inline = candidate
                else:
                    print(f"  Warning: unknown AMB register '{candidate}' in visual spec "
                          f"(valid: {', '.join(sorted(VALID_SOUNDSCAPE_REGISTERS))})")

            parsed = parse_visual_spec(vis)

            row_entry: dict = {
                "beat": current_beat.id if current_beat else "opening",
                "narration": narr,
                "visual_raw": vis,
                "parsed": parsed,
                "dir_lines": [],
                "pace": current_pace,
            }
            if amb_register_inline:
                row_entry["amb_register"] = amb_register_inline
            rows.append(row_entry)

            # Also check if the visual cell itself contains DIR: (inline)
            if "DIR:" in vis and not vis.strip().startswith("DIR:"):
                # DIR: might be on the same line after a visual spec — rare but handle it
                pass

    return beats, rows


# ── Manifest Builder (Estimate Mode) ──────────────────────────────────────

# ── Per-episode data mappings ────────────────────────────────────────────
#
# These maps are silicon-trap-specific. For other episodes, provide an
# episode config JSON (e.g. episodes/prisoners-dilemma/manifest-config.json)
# with keys "dataFiles" and "shotIds" to override these defaults.
#
# The build_estimate_manifest function accepts optional data_files and
# shot_ids parameters. The CLI loads them from --config if provided.

# Known data file mappings for silicon-trap (from EP01.tsx)
SILICON_TRAP_DATA_FILES = {
    # Opening
    "title-episode": "title-episode.json",
    # Beat 1
    "title-section-paradox": "title-section-paradox.json",
    "kinetic-92-yield": "kinetic-92-yield.json",
    "kinetic-165b": "kinetic-165b.json",
    "chart-7pct-demand": "chart-7pct-demand.json",
    # Beat 2
    "title-section-denial": "title-section-denial.json",
    "timeline-oil-chips": "timeline-oil-chips.json",
    "kinetic-revenue-deal": "kinetic-revenue-deal.json",
    "chart-chips-act": "chart-chips-act.json",
    "choropleth-cocom": "choropleth-cocom.json",
    "framework-cocom-china": "framework-cocom-china.json",
    # Beat 3
    "title-section-wall": "title-section-wall.json",
    "kinetic-kabozi": "kinetic-kabozi.json",
    "kinetic-juguo": "kinetic-juguo.json",
    "chart-lithography": "chart-lithography.json",
    "chart-smic-yield": "chart-smic-yield.json",
    "framework-kirin-teardown": "framework-kirin-teardown.json",
    "kinetic-deepseek-zero": "kinetic-deepseek-zero.json",
    # Beat 4
    "title-section-trap": "title-section-trap.json",
    "framework-chess-go": "framework-chess-go.json",
    "route-chip-supply": "route-chip-supply.json",
    "kinetic-trap": "kinetic-trap.json",
    "choropleth-caught-between": "choropleth-caught-between.json",
    "kinetic-morris-chang": "kinetic-morris-chang.json",
    # Beat 5
    "title-section-chips": "title-section-chips.json",
    "framework-ai-timeline": "framework-ai-timeline.json",
    # Closing
    "title-endcard": "title-endcard.json",
}

# Shot list ID mapping (search terms → shot list IDs from shot-list.json)
SILICON_TRAP_SHOT_IDS = {
    "TSMC Arizona": "beat1-tsmc-aerial",
    "semiconductor cleanroom": "beat1-cleanroom",
    "Arizona desert housing": "beat1-arizona-housing",
    "world map connections": "beat1-global-supply",
    "semiconductor chip macro": "beat2-chip-macro",
    "China high speed": "beat3-highspeed-rail",
    "space launch China": "beat3-space-launch",
    "ballpoint pen": "beat3-pen-tip",
    "Shenzhen skyline": "beat3-shenzhen",
    "AI data center": "beat3-ai-datacenter",
    "semiconductor wafer macro": "beat3-wafer-macro",
    "semiconductor chip wafer": "beat3-wafer-macro",
    "silicon wafer": "beat3-wafer-macro",
    "world map divided": "beat4-world-divided",
    "car dashboard": "beat5-car-electronics",
    "smartphone circuit": "beat5-smartphone",
    "hospital MRI": "beat5-mri",
    "data center server": "beat5-datacenter",
    "empty car dealership": "beat5-car-shortage",
    "world map night": "beat5-earth-night",
    "FDR signing": "beat2-fdr-embargo",
    "Jake Sullivan": "beat2-jake-sullivan",
    "DeepSeek": "beat3-deepseek",
}


def resolve_shot_id(search_terms: list[str], shot_ids: dict = None) -> str | None:
    """Try to match search terms to a known shot list ID."""
    lookup = shot_ids or SILICON_TRAP_SHOT_IDS
    for term in search_terms:
        for key, sid in lookup.items():
            if key.lower() in term.lower():
                return sid
    return None


def resolve_data_file(component: str, search_terms: list[str], vis_raw: str, data_files: dict | None = None) -> str | list[str] | None:
    """Try to resolve which Remotion data file(s) a template segment references.

    Returns a string for a single data file, or a LIST of filenames when the
    spec uses brace-expansion notation `[slug/prefix-{a,b,c}.json]` (e.g. an
    AnnotatedImage triptych). The list is later split into N sequential cards
    by expand_brace_segments().
    """
    vis_lower = vis_raw.lower()

    # Brace-expansion form: [slug/prefix-{a,b,c}.json] → [prefix-a.json, prefix-b.json, ...]
    # Used for triptychs / multi-card sequences declared in one script row.
    brace_m = re.search(
        r'\[(?:[a-z0-9-]+/)?([a-z0-9-]*)\{([a-z0-9,\-\s]+)\}([a-z0-9-]*\.json)\]',
        vis_raw,
    )
    if brace_m:
        prefix, items, suffix = brace_m.group(1), brace_m.group(2), brace_m.group(3)
        expanded = [f"{prefix}{it.strip()}{suffix}" for it in items.split(",") if it.strip()]
        if expanded:
            return expanded

    # Direct extraction: [episode-slug/filename.json] or [filename.json] in spec
    bracket_m = re.search(r'\[(?:[a-z0-9-]+/)?([a-z0-9-]+\.json)\]', vis_raw)
    if bracket_m:
        return bracket_m.group(1)

    lookup = data_files or SILICON_TRAP_DATA_FILES

    for slug, filename in lookup.items():
        # Match on slug keywords in the visual spec
        slug_words = slug.replace("-", " ")
        if slug_words in vis_lower:
            return filename

    # Heuristic matching for specific known compositions
    heuristics = [
        ("92%", "kinetic-92-yield.json"),
        ("165", "kinetic-165b.json"),
        ("7%", "chart-7pct-demand.json"),
        ("7 percent", "chart-7pct-demand.json"),
        ("oil embargo", "timeline-oil-chips.json"),
        ("huawei ban", "timeline-oil-chips.json"),
        ("20% →", "kinetic-revenue-deal.json"),
        ("20% → 15%", "kinetic-revenue-deal.json"),
        ("revenue-sharing deal", "kinetic-revenue-deal.json"),
        ("chips act", "chart-chips-act.json"),
        ("cocom member", "choropleth-cocom.json"),
        ("ussr vs china", "framework-cocom-china.json"),
        ("卡脖子", "kinetic-kabozi.json"),
        ("kabozi", "kinetic-kabozi.json"),
        ("stranglehold", "kinetic-kabozi.json"),
        ("举国体制", "kinetic-juguo.json"),
        ("juguo", "kinetic-juguo.json"),
        ("whole-nation", "kinetic-juguo.json"),
        ("34 lithography", "chart-lithography.json"),
        ("34 passes", "chart-lithography.json"),
        ("smic yield", "chart-smic-yield.json"),
        ("yield improvement", "chart-smic-yield.json"),
        ("forty percent to sixty", "chart-smic-yield.json"),
        ("right column appears", "timeline-oil-chips.json"),
        ("split-screen", "timeline-oil-chips.json"),
        ("chip control escalation", "timeline-oil-chips.json"),
        ("kirin", "framework-kirin-teardown.json"),
        ("deepseek", "kinetic-deepseek-zero.json"),
        ("0 successful", "kinetic-deepseek-zero.json"),
        ("chess", "framework-chess-go.json"),
        ("go board", "framework-chess-go.json"),
        ("supply chain map", "route-chip-supply.json"),
        ("supply chain:", "route-chip-supply.json"),
        ("trap for everyone", "kinetic-trap.json"),
        ("caught", "choropleth-caught-between.json"),
        ("asml", "choropleth-caught-between.json"),
        ("morris chang", "kinetic-morris-chang.json"),
        ("globalization", "kinetic-morris-chang.json"),
        ("ai timeline", "framework-ai-timeline.json"),
        ("fast ai", "framework-ai-timeline.json"),
        ("decision tree", "framework-ai-timeline.json"),
        ("end card", "title-endcard.json"),
        ("endcard", "title-endcard.json"),
        ("silicon trap", "title-episode.json"),
        ("episode open", "title-episode.json"),
        ("logic of denial", "title-section-denial.json"),
        ("other side", "title-section-wall.json"),
        ("the trap", "title-section-trap.json"),
        ("your chips", "title-section-chips.json"),
        ("the paradox", "title-section-paradox.json"),
        ("bifurcation", None),  # route-chip-supply variant — not yet built
    ]

    # These keyword heuristics are silicon-trap-specific. Apply them ONLY in
    # silicon-trap default mode (data_files is None). For config-driven episodes
    # (data_files is a dict), they must NOT run — otherwise stray matches like
    # "the trap" leak in and emit silicon-trap files (e.g. title-section-trap.json)
    # that don't exist in the other episode's data dir (broken refs).
    if data_files is None:
        for keyword, data_file in heuristics:
            if keyword.lower() in vis_lower:
                return data_file

    return None


def apply_over_previous(seg: dict, prev: dict | None, direction: dict) -> None:
    """DIR: over(previous) — set this card over the held, dimmed picture before it.

    Writes `layered.backgroundSegmentId` on the card. FullEpisode's seam
    resolver (resolveSeams.ts, rule 6) then keeps that picture on its last
    frame for the whole card and draws the card with a transparent ground,
    light type and no chrome. The directive is dropped, with a warning, when
    the engine could not honour it.
    """
    if not direction.get("overPrevious"):
        return
    comp = (seg.get("template") or {}).get("component")
    problem = None
    if prev is None or prev.get("layer") != "background":
        problem = "the segment before it is not a picture (footage, still or AI-GEN)"
    elif comp not in OVER_PICTURE_TEMPLATES:
        supported = ", ".join(sorted(OVER_PICTURE_TEMPLATES))
        problem = f"{comp or seg.get('type')} cannot be drawn over a picture ({supported} only)"
    elif abs(seg["startSec"] - prev["endSec"]) > 1 / FPS:
        problem = "the card does not start where the picture ends (drop hold(pre:…) from the card)"
    if problem:
        print(f"⚠  DIR: over(previous) ignored on {seg['id']} — {problem}.", file=sys.stderr)
        return
    layered = {"backgroundSegmentId": prev["id"], "position": "full"}
    if "overDim" in direction:
        layered["backgroundDim"] = direction["overDim"]
    seg["layered"] = layered


def expand_brace_segments(segments: list[dict]) -> list[dict]:
    """Expand any segment carrying `_braceDataFiles` into N sequential cards.

    A script row like:
        [MG:] AnnotatedImage TRIPTYCH … [slug/annotated-image-{valencia,torbel,maine}.json] · 12.8s
    builds ONE segment whose resolve_data_file() returned a list. Here we split
    that segment into N cards that evenly subdivide its [startSec, endSec] window
    (so total episode timing is unchanged), each carrying one data file and an
    id suffixed a/b/c…. Segments without the marker pass through untouched.
    """
    out: list[dict] = []
    for seg in segments:
        files = seg.pop("_braceDataFiles", None)
        if not files:
            out.append(seg)
            continue
        if len(files) == 1:
            seg["template"]["dataFile"] = files[0]
            out.append(seg)
            continue
        start = seg.get("startSec", 0.0)
        end = seg.get("endSec", start)
        span = (end - start) / len(files)
        for k, fname in enumerate(files):
            card = copy.deepcopy(seg)
            card["id"] = f"{seg['id']}{chr(ord('a') + k)}"
            card["startSec"] = round(start + k * span, 2)
            card["endSec"] = round(start + (k + 1) * span, 2)
            if k > 0:
                # Only the first card follows the picture it is set over.
                card.pop("layered", None)
            card["template"]["dataFile"] = fname
            out.append(card)
    return out


def apply_default_transitions(segments: list[dict]) -> list[dict]:
    """
    Apply context-aware transition defaults to segments.

    Transition design rules (Layer 3 — Cross-clip Pacing):

    1. BEAT BOUNDARIES: a cut, like every other seam (revised Oct 10, 2026;
       this used to hand out a 0.5s dissolve). A dissolve claims that time or
       place has changed, and a beat boundary usually changes neither. Mark a
       real chapter break in the script with `DIR: cut(fade)` (a dip through
       ink) or a chapter card; ask for a dissolve with `DIR: cut(dissolve)`.
       See TRANSITION_GRAMMAR.md § "By seam type".

    2. TITLE CARDS: TitleTransition segments (section headers, episode
       title, end card) always fade in/out (0.6s). They're structural
       punctuation, and a hard cut to a title card feels jarring.

    3. WITHIN A BEAT: Cuts are the default. Analytical content moves fast;
       dissolves within the same argument slow things down unnecessarily.

    4. FOOTAGE → TEMPLATE: When a background footage segment is followed
       by a foreground template, no transition needed (they're on different
       layers — the template overlays). When a TEMPLATE is followed by
       another TEMPLATE in the same layer, Phase 5 (TRANSITION_GRAMMAR.md
       May 16, 2026) sets the default to HARD CUT (0s), not dissolve.
       Rationale: the editorial doctrine says within-beat seams should
       cut by default; dissolve should be an opt-in editorial choice for
       same-data sequences (chart→chart small multiples, photo→photo
       within a montage). visual-spec opts in via
       `_direction.transitionOut: "dissolve"` on the prior segment, or
       authors write `DIR: cut(dissolve)` in the script.

    4a. MATCH-CUT PROMOTION (Phase 4 of TRANSITION_GRAMMAR.md): when the
        two consecutive same-layer templates are the SAME component AND the
        component is in MATCH_CUT_STILL_TEMPLATES (AtlasPlate, ChoroplethMap,
        AnnotatedImage, RouteAnimation, PhotoMontage), prefer
        `match-cut-still` (0.35s opacity-only crossfade) over `cut` —
        the composition genuinely carries between segments, so the seam
        reads as a layer-swap on the same scene rather than two different
        scenes hard-cutting against each other.

    5. HOLD SEGMENTS: No transition — they sustain the previous visual.
       A fade on a hold defeats its purpose.

    6. END CARD: The final segment (usually TitleTransition end-card)
       gets a fade-in (0.8s) for a cinematic close.

    7. J-CUT AUDIO BRIDGE (Phase 7 of TRANSITION_GRAMMAR.md): every
       hard-cut segment gets narrationLeadIn: 0.7 by default — the
       narrator's audio for the incoming segment begins 0.7s before the
       visual cut so the seam disappears in the NLE. Suppressed when:
       • i == 0 (first segment, nothing to bridge from)
       • the segment is a TRANSITION / chapter card (silence beat)
       • the previous segment has driftPreset "none" (hold(stillness) —
         eulogy / memorial / document-of-record; bridge contradicts intent)
       • narrationLeadIn already on the segment from DIR: jcut(N)
    """
    if not segments:
        return segments

    for i, seg in enumerate(segments):
        prev = segments[i - 1] if i > 0 else None
        is_last = (i == len(segments) - 1)

        # Skip HOLD segments — they sustain, no transition
        if seg.get("type") == "HOLD":
            continue

        # Determine context
        is_title = (
            seg.get("type") == "TRANSITION"
            or (seg.get("template", {}).get("component") == "TitleTransition")
        )
        beat_changed = (
            prev is not None
            and prev.get("beat") != seg.get("beat")
            and prev.get("beat") and seg.get("beat")
        )
        prev_is_template = (
            prev is not None
            and prev.get("type") in ("TEMPLATE", "TRANSITION")
        )
        curr_is_template = seg.get("type") in ("TEMPLATE", "TRANSITION")

        # Build transition
        trans_in = "cut"
        trans_out = "cut"
        dur = 0.5

        # Rule 0 (highest priority): Direction-specified transition on PREVIOUS segment
        # If the previous segment has a direction-specified transitionOut, use it.
        if prev is not None and prev.get("_dirTransitionOut"):
            prev_trans = prev.get("transition", {})
            prev_trans["out"] = prev["_dirTransitionOut"]
            if prev.get("_dirTransitionDuration"):
                prev_trans["durationSec"] = prev["_dirTransitionDuration"]
            if prev.get("_dirWashColor"):
                prev_trans["washColor"] = prev["_dirWashColor"]
            prev["transition"] = prev_trans
            # The current segment's transition-in should match
            trans_in = prev["_dirTransitionOut"]
            if prev.get("_dirTransitionDuration"):
                dur = prev["_dirTransitionDuration"]

        # Rule 1: Beat boundaries → cut (the default already). Until Oct 10,
        # 2026 this assigned a 0.5s dissolve; see the docstring. A dissolve
        # or a chapter dip now only comes from a DIR directive (Rule 0).

        # Rule 2: Title cards → fade
        if is_title:
            trans_in = "fade"
            trans_out = "fade"
            dur = 0.6

        # Rule 6: End card gets a longer fade-in
        if is_last and is_title:
            dur = 0.8

        # Rule 4: Template → Template (same layer) → brief dissolve
        # Refinement 4a (Phase 4): when both segments are the SAME template
        # AND the component is in MATCH_CUT_STILL_TEMPLATES (AtlasPlate,
        # ChoroplethMap, AnnotatedImage, RouteAnimation, PhotoMontage),
        # default to `match-cut-still` instead — the composition genuinely
        # carries from one segment to the next, so an opacity-only crossfade
        # reads as a layer-swap on the same scene rather than a "soft scene
        # change." See TRANSITION_GRAMMAR.md Section 4 Context A.
        # A DIR override (`prev._dirTransitionOut`) always wins; Rule 4
        # only fires when no override exists (consistent with Rule 1).
        if (
            prev_is_template
            and curr_is_template
            and not is_title
            and not beat_changed
            and not (prev and prev.get("_dirTransitionOut"))
        ):
            prev_component = prev.get("template", {}).get("component") if prev else None
            curr_component = seg.get("template", {}).get("component")
            same_template_match_cut = (
                prev_component is not None
                and prev_component == curr_component
                and prev_component in MATCH_CUT_STILL_TEMPLATES
            )
            if same_template_match_cut:
                trans_in = "match-cut-still"
                dur = 0.35
            else:
                # Phase 5 revision of Rule 4 — within-beat default = cut.
                # Same-data dissolve (small multiples) is now opt-in via
                # `_direction.transitionOut: "dissolve"` on the prior
                # segment, NOT implicit. See TRANSITION_GRAMMAR.md §4 Ctx A.
                trans_in = "cut"
                dur = 0

        # Rule 7: Pace-driven transition adjustments (applied last before write)
        # Pace context modifies durations and may upgrade/downgrade transition types.
        # Only applies when no DIR: override (Rule 0) was set.
        seg_pace = seg.get("paceProfile", "analytical")
        if not (prev and prev.get("_dirTransitionOut")):
            if seg_pace == "urgent":
                # Urgent: compress transition durations, prefer cuts
                dur = round(dur * 0.6, 2)  # e.g. 0.5s dissolve → 0.3s
                # Downgrade dissolves to cuts within beats (speed over smoothness)
                if trans_in == "dissolve" and not beat_changed:
                    trans_in = "cut"
                    dur = 0
            elif seg_pace == "breathing":
                # Breathing: stretch whatever transition is already there.
                # It no longer turns cuts into dissolves (revised Oct 10,
                # 2026): pace sets how long a seam takes, not what it claims.
                dur = round(dur * 1.5, 2)  # e.g. 0.6s title fade → 0.9s

        # Phase 7: J-cut audio bridge default (TRANSITION_GRAMMAR.md §07)
        # Every hard cut gets narrationLeadIn: 0.7 so the NLE editor has
        # the audio bridge ready. The field is an annotation only — it
        # does NOT change Remotion's visual timing. See TRANSITION_GRAMMAR
        # §07 "Hard cuts without audio bridging" failure mode.
        if trans_in == "cut" and not is_title and i > 0 and prev is not None:
            prev_stillness = prev.get("_direction", {}).get("driftPreset") == "none"
            if not prev_stillness and "narrationLeadIn" not in seg:
                seg["narrationLeadIn"] = 0.7

        # Only set transition if non-default
        if trans_in != "cut" or trans_out != "cut":
            seg["transition"] = {
                "in": trans_in,
                "out": trans_out,
                "durationSec": dur,
            }

        # Rule 2 addendum: the segment *before* a title card should fade out,
        # so the visual smoothly exits into the title. But if a beat-boundary
        # dissolve was already assigned (Rule 1), preserve it — dissolve is
        # a stronger transition and works well into title cards too.
        if is_title and prev is not None and prev.get("type") != "HOLD":
            if "transition" not in prev:
                prev["transition"] = {"in": "cut", "out": "fade", "durationSec": 0.5}
            elif prev["transition"].get("out", "cut") == "cut":
                prev["transition"]["out"] = "fade"

    return segments


# ── Audio Cue Mappings (from AUDIO_DESIGN.md) ──────────────────────────────

# Template → default soundCue at segment entrance or key moment
# Format: (entrance_type, entrance_intensity, key_moment_type, key_moment_intensity)
# None means no cue for that slot
TEMPLATE_AUDIO_MAP = {
    "TitleTransition": ("section-open", "normal", None, None),
    "KineticTypography": ("quote-bell", "normal", None, None),  # default; statistic variant overridden below
    "DataChart": (None, None, "stat-reveal", "normal"),
    "TimelineComparison": ("beat-transition", "normal", None, None),
    "FrameworkDiagram": ("beat-transition", "normal", None, None),
    "ChoroplethMap": ("map-whoosh", "normal", None, None),
    "RouteAnimation": ("map-whoosh", "normal", None, None),
    "DecisionTree": ("beat-transition", "normal", "stat-reveal", "normal"),
    "SplitComposition": ("beat-transition", "normal", None, None),
    "ProbabilityGauge": (None, None, "stat-reveal", "normal"),
    "ImageComposite": (None, None, None, None),
    "PhotoMontage": (None, None, None, None),
    "NetworkDiagram": ("beat-transition", "normal", None, None),
    "TimeSeriesChart": (None, None, "stat-reveal", "normal"),
    "SankeyFlow": ("beat-transition", "normal", "stat-reveal", "subtle"),
    "GameBoard": ("beat-transition", "normal", None, None),
    "BayesianUpdate": (None, None, "stat-reveal", "normal"),
    "StatReveal": (None, None, "stat-reveal", "dramatic"),
    "RadarChart": ("beat-transition", "normal", None, None),
    "AnnotatedImage": (None, None, None, None),
    "ScrollyReveal": (None, None, None, None),
    "GenerativeBackdrop": (None, None, None, None),
    "EscalationLadder": ("tension-rise", "normal", None, None),
    "StrategicLandscape": ("beat-transition", "normal", None, None),
    "DuelingFrameworks": ("beat-transition", "normal", "tension-resolve", "normal"),
    "DualTimeline": ("beat-transition", "normal", None, None),

    # Documentary-Archival templates (shipped May 19, 2026)
    "CausalLoopDiagram": ("beat-transition", "normal", None, None),
    "SpiralTimeline": ("beat-transition", "normal", None, None),
    "PrimarySourceReveal": (None, None, None, None),    # silence — document-of-record; no SFX intro
    "SmallMultiples": (None, None, "stat-reveal", "subtle"),
    "HandwrittenLetter": (None, None, None, None),       # silence — intimate; no SFX
    "NewspaperHeadlineRotator": ("beat-transition", "subtle", None, None),
    "ArchivalReel": (None, None, None, None),             # native footage — no SFX overlay
    "TelegramCable": (None, None, None, None),            # silence — document-of-record

    # Argument Primitives templates (shipped May 19, 2026)
    "Syllogism": (None, None, None, None),                # silence — pure logic; SFX would trivialize
    "AxiomList": (None, None, None, None),                # silence — foundational claims; no SFX
    "DialecticFlow": ("beat-transition", "subtle", "tension-resolve", "subtle"),
    "ConditionalArgument": ("beat-transition", "normal", None, None),
    "CounterfactualPath": ("tension-rise", "normal", "tension-resolve", "subtle"),
    "AnalogyCrossmap": ("beat-transition", "normal", None, None),
    "ToulminMap": ("beat-transition", "normal", None, None),

    # Tier 2 + Tier 3 templates (shipped May 20, 2026)
    "PhilosophicalFamilyTree": ("beat-transition", "normal", None, None),
    "ConceptEvolutionTimeline": ("beat-transition", "subtle", None, None),
    "DivergingBar": ("stat-reveal", "normal", None, None),   # bar-out animation = data stat reveal
    "DotPlot": ("beat-transition", "subtle", None, None),    # dots appear quietly; argument is position
    "OrgChart": ("section-open", "subtle", None, None),      # hierarchy reveal = section-establishing

    # Sprint 2026-05-20 — four new templates (AnnotatedZoom, BubbleMatrix, BarChartRace, SanctionsNetwork)
    "AnnotatedZoom": (None, None, None, None),              # zoom IS the motion; no ambient cue
    "BubbleMatrix": ("beat-transition", "subtle", None, None),  # Gapminder scatter; quiet reveal
    "BarChartRace": ("stat-reveal", "normal", None, None),  # rank-race arrival = stat moment
    "SanctionsNetwork": ("section-open", "subtle", None, None), # network architecture = section-establishing

    # Motion Primitives templates (shipped May 19, 2026)
    "ComparisonPair": ("beat-transition", "normal", None, None),
    "MorphTransition": ("stat-reveal", "normal", None, None),
    # Composition primitive (shipped May 19, 2026)
    # SplitFrame: quiet section-open cue at entrance; pane templates fire their own cues.
    "SplitFrame": ("section-open", "subtle", None, None),

    # Relationship / composition templates (shipped May 19, 2026)
    "VennDiagram": ("beat-transition", "subtle", None, None),
    "ChordDiagram": ("beat-transition", "normal", None, None),
    "Treemap": ("section-open", "subtle", None, None),
    "MatrixHeatmap": ("beat-transition", "subtle", None, None),

    # Terrain fly-through (shipped May 19, 2026)
    # Subtle map-whoosh marks entering cinematic map space; no data stat cue
    # (the camera path IS the argument — no discrete data event to punctuate).
    "CinematicMap": ("map-whoosh", "subtle", None, None),

    # Map extensions (shipped May 20, 2026)
    # TerritoryMap: map-whoosh on entry; timestep transitions driven by the
    # timeline strip not discrete audio events (no data-stat cue).
    "TerritoryMap": ("map-whoosh", "normal", None, None),
    # FlowMap: map-whoosh on entry; arc reveal cues in stagger mode would need
    # per-flow timing which is not yet supported — leave as None for now.
    "FlowMap": ("map-whoosh", "normal", None, None),

    # Math templates — promoted to manifest-level May 20, 2026.
    # Quiet analytical register: beat-transition (subtle) marks the equation
    # appearing; no data-stat cue (no countable bar/number to punctuate).
    "MathReveal": ("beat-transition", "subtle", None, None),
    "MathDerivation": ("beat-transition", "subtle", None, None),
    # HorizontalTimelineSingle: same register as HorizontalTimeline.
    "HorizontalTimelineSingle": ("beat-transition", "subtle", None, None),
}

# Template → texture hit patterns
# Each entry: list of (texture_type, offset_fraction, volume)
# offset_fraction is 0.0-1.0 relative to segment duration
TEMPLATE_TEXTURE_MAP = {
    "DataChart": [("bar-grow", 0.40, 0.08), ("bar-grow", 0.50, 0.06)],
    "TimelineComparison": [("dot-click", 0.15, 0.08), ("dot-click", 0.35, 0.06), ("line-draw", 0.60, 0.06)],
    "FrameworkDiagram": [("card-settle", 0.30, 0.06), ("card-settle", 0.55, 0.06)],
    "ChoroplethMap": [("region-glow", 0.25, 0.08), ("region-glow", 0.50, 0.06)],
    "RouteAnimation": [("line-draw", 0.25, 0.08), ("line-draw", 0.50, 0.06)],
    "DecisionTree": [("node-pop", 0.20, 0.08), ("line-draw", 0.40, 0.06)],
    "SplitComposition": [("card-settle", 0.30, 0.06), ("card-settle", 0.60, 0.06)],
    "ProbabilityGauge": [("bar-grow", 0.40, 0.08)],
    "NetworkDiagram": [("node-pop", 0.20, 0.08), ("node-pop", 0.35, 0.06)],
    "TimeSeriesChart": [("line-draw", 0.30, 0.08)],
    "SankeyFlow": [("line-draw", 0.30, 0.08), ("card-settle", 0.60, 0.06)],
    "GameBoard": [("dot-click", 0.25, 0.08), ("dot-click", 0.40, 0.06)],
    "BayesianUpdate": [("bar-grow", 0.35, 0.08), ("line-draw", 0.70, 0.06)],
    "StatReveal": [("bar-grow", 0.60, 0.06)],
    "RadarChart": [("line-draw", 0.30, 0.08)],
    "AnnotatedImage": [("card-settle", 0.30, 0.06), ("line-draw", 0.35, 0.06)],
    "EscalationLadder": [("dot-click", 0.20, 0.08), ("dot-click", 0.40, 0.06)],
    "StrategicLandscape": [("node-pop", 0.25, 0.08), ("node-pop", 0.45, 0.06)],
    "KineticTypography": [("card-settle", 0.25, 0.06)],  # quote/bilingual only
    "PhotoMontage": [("page-turn", 0.50, 0.06)],

    # Documentary-Archival templates (shipped May 19, 2026)
    "CausalLoopDiagram": [("node-pop", 0.20, 0.06), ("line-draw", 0.40, 0.06)],
    "SpiralTimeline": [("dot-click", 0.20, 0.06), ("dot-click", 0.45, 0.06)],
    "NewspaperHeadlineRotator": [("page-turn", 0.33, 0.06), ("page-turn", 0.66, 0.06)],

    # Argument Primitives templates (shipped May 19, 2026)
    "DialecticFlow": [("card-settle", 0.30, 0.06), ("card-settle", 0.60, 0.06)],
    "CounterfactualPath": [("line-draw", 0.30, 0.06), ("line-draw", 0.60, 0.06)],

    # Motion Primitives templates (shipped May 19, 2026)
    "MorphTransition": [("bar-grow", 0.55, 0.08)],

    # Relationship / composition templates (shipped May 19, 2026)
    "VennDiagram": [("node-pop", 0.25, 0.08), ("node-pop", 0.50, 0.06)],
    "ChordDiagram": [("line-draw", 0.30, 0.08), ("line-draw", 0.55, 0.06)],
    "Treemap": [("card-settle", 0.30, 0.06), ("card-settle", 0.55, 0.06)],
    "MatrixHeatmap": [("region-glow", 0.35, 0.08), ("region-glow", 0.60, 0.06)],
}

# Mood mapping for beats based on common keywords/patterns
BEAT_MOOD_KEYWORDS = {
    "contemplative": ["opening", "paradox", "introduction", "prologue"],
    "analytical": ["logic", "denial", "history", "context", "evidence", "analysis"],
    "tension": ["wall", "other side", "escalation", "crisis", "confrontation", "stranglehold"],
    "resolution": ["your", "conclusion", "closing", "future", "what now", "chips"],
}


def infer_music_mood(beat_title: str) -> str:
    """Infer music bed mood from beat title keywords."""
    title_lower = beat_title.lower()
    for mood, keywords in BEAT_MOOD_KEYWORDS.items():
        for kw in keywords:
            if kw in title_lower:
                return mood
    return "analytical"  # safe default


def build_music_bed(beats: list, total_duration: float, episode_slug: str = "episode") -> dict:
    """
    Generate a musicBed object with tracks for each beat.

    Tracks crossfade at beat boundaries (overlap by fade durations).
    Beats whose start exceeds total_duration are skipped (estimate mode
    may produce beat boundaries beyond actual content duration).
    """
    # Filter to beats that actually fall within estimated content duration
    active_beats = [b for b in beats if b["startSec"] < total_duration]
    if not active_beats:
        return {"tracks": []}

    tracks = []
    for i, beat in enumerate(active_beats):
        mood = infer_music_mood(beat["title"])

        # First beat: contemplative opening
        if i == 0:
            mood = "contemplative"

        # Last active beat: resolution (takes priority over keyword matching)
        is_last = i == len(active_beats) - 1

        # Keyword-based mood for middle beats only
        if not is_last and i > 0:
            if any(kw in beat["title"].lower() for kw in ["trap", "wall", "other side", "stranglehold"]):
                mood = "tension"

        if is_last and i > 0:
            mood = "resolution"

        start = beat["startSec"]
        end = min(beat.get("endSec", total_duration), total_duration)

        # Crossfade overlap: start 3s before beat boundary, end 2s after
        fade_in = 3.0 if i > 0 else 2.0
        fade_out = 3.0 if not is_last else 0.0

        adjusted_start = max(0, start - fade_in) if i > 0 else 0
        adjusted_end = min(end + 2.0, total_duration) if not is_last else total_duration

        track = {
            "id": f"{mood}-{i+1}",
            "file": f"audio/music/{episode_slug}/bed-{mood}-{i+1}.wav",
            "startSec": round(adjusted_start, 1),
            "endSec": round(adjusted_end, 1),
            "fadeInSec": fade_in,
            "fadeOutSec": fade_out,
            "volume": 0.12 if i > 0 else 0.15,
            "mood": mood,
            "beat": beat["id"],
        }
        tracks.append(track)

    return {"tracks": tracks}


def apply_audio_cues(segments: list[dict]) -> list[dict]:
    """
    Apply default audio cues (soundCue + textureCues) to segments based on
    template type mappings from AUDIO_DESIGN.md.

    Rules:
    - FOOTAGE and IMAGE segments get no audio cues (footage breathes)
    - HOLD segments get no audio cues
    - TEMPLATE/TRANSITION segments get cues based on TEMPLATE_AUDIO_MAP
    - Texture hits are limited to ≤3 per 10-second window
    """
    for seg in segments:
        seg_type = seg.get("type", "")
        component = seg.get("template", {}).get("component", "")

        # Skip non-template segments
        if seg_type not in ("TEMPLATE", "TRANSITION") or not component:
            continue

        # Look up audio mapping
        audio = TEMPLATE_AUDIO_MAP.get(component)
        if not audio:
            continue

        entrance_type, entrance_int, key_type, key_int = audio
        dur = seg["endSec"] - seg["startSec"]

        # Guard: if the segment already has a soundscape.transitionIn authored
        # (e.g. via an explicit script directive), skip the soundCue assignment
        # entirely to prevent double-fire (AudioLayer + SoundscapeMount both
        # playing the same cue at frame 0). Soundscape.tsx takes precedence.
        has_soundscape_transition_in = bool(
            seg.get("template", {})
               .get("soundscape", {})
               .get("transitionIn")
        )

        # Apply entrance soundCue
        if entrance_type and not has_soundscape_transition_in:
            seg["soundCue"] = {
                "type": entrance_type,
                "offsetSec": 0,
                "intensity": entrance_int,
            }

        # Apply key moment as secondary soundCue
        if key_type:
            offset = round(dur * 0.6, 1)  # key moment typically at ~60% of duration
            if entrance_type and not has_soundscape_transition_in:
                seg["soundCueSecondary"] = {
                    "type": key_type,
                    "offsetSec": offset,
                    "intensity": key_int,
                }
            elif not has_soundscape_transition_in:
                seg["soundCue"] = {
                    "type": key_type,
                    "offsetSec": offset,
                    "intensity": key_int,
                }

        # Apply texture hits
        textures = TEMPLATE_TEXTURE_MAP.get(component, [])
        if textures:
            cues = []
            for tex_type, offset_frac, vol in textures:
                cues.append({
                    "type": tex_type,
                    "offsetSec": round(dur * offset_frac, 1),
                    "volume": vol,
                })
            if cues:
                seg["textureCues"] = cues

    return segments


def build_estimate_manifest(
    script_path: str,
    episode: str,
    title: str = "",
    data_files: dict = None,
    shot_ids: dict = None,
) -> tuple[dict, list[dict]]:
    """
    Build an assembly manifest in estimate mode from script parsing.

    Returns:
        (manifest, rows) — rows are the parse_script table rows (for script-level lints).

    Timing model:
      Each table row in the script has NARRATION (left) and VISUAL (right).
      They happen SIMULTANEOUSLY — the visual accompanies the narration.

      - When narration is present: narration word count → WPM → row duration.
        The visual is placed at the same start time for that duration.
      - When narration is empty but visual is present (transitions, holds):
        the visual's explicit duration drives the clock.
      - TEMPLATE segments (foreground) overlay FOOTAGE/IMAGE (background).
        Both start at the same cursor position for the row.

      The cursor advances once per ROW by the row's duration, not per segment.
    """
    beats, rows = parse_script(script_path)

    segments = []
    cursor = 0.0  # current time position in seconds
    seg_counter = 0

    for row in rows:
        narr = row["narration"]
        parsed = row["parsed"]
        beat_id = row["beat"]
        vis_raw = row["visual_raw"]
        dir_lines = row.get("dir_lines", [])
        pace_mult = PACE_MULTIPLIERS.get(row.get("pace", "analytical"), 1.0)

        # Parse direction annotations for this row
        direction = parse_dir_lines(dir_lines) if dir_lines else {}

        # Soundscape override: [AMB: register] directive from script
        amb_register = row.get("amb_register")

        # Clean narration text for word-count estimation
        clean_narr = ""
        if narr.strip():
            clean_narr = re.sub(r"\*[^*]*\*", "", narr).strip()
            clean_narr = re.sub(r"\([^)]*\)", "", clean_narr).strip()

        # Determine row duration (how much the cursor advances)
        narr_dur = estimate_narration_duration(narr) if clean_narr else 0.0

        # Phase 6 of TRANSITION_GRAMMAR.md — `DIR: chapter("Title")` sugar.
        # When the visual cell is empty (parsed is None) and a chapter
        # directive is present, synthesize a TitleTransition segment so the
        # author doesn't have to write the `**TRANSITION** TitleTransition
        # title-section-<slug>.json` boilerplate. Rule 2 of
        # apply_default_transitions handles the fade pair on neighbors.
        if parsed is None and direction.get("chapter"):
            chapter = direction["chapter"]
            slug = chapter["slug"]
            # Default 3s — long enough for the card to land + a beat of breath.
            inferred_dur = 3.0
            parsed = {
                "type": "TRANSITION",
                "priority": "P1",
                "component": "TitleTransition",
                "searchTerms": [],
                "source": None,
                "ramp": "standard",
                "composite": "background",
                "opacity": None,
                "durationSec": inferred_dur,
                "durationMode": "explicit",
                "notes": "",
                "dataFile": None,
                "backdropId": None,
                # Synthesized hint for resolve_data_file (slug → file). The
                # data_files dict is searched first; if no match, we still
                # emit the segment and warn so the author knows to create
                # the JSON. The inline title/kicker are stashed on the
                # segment for future Remotion wiring (Phase 6 follow-up).
                "_chapterSlug": slug,
                "_chapterTitle": chapter["title"],
                "_chapterKicker": chapter.get("kicker"),
            }
            # Pretend the visual cell was the standard boilerplate so
            # downstream code (resolve_data_file, logging) has something
            # readable to work with.
            vis_raw = (
                f'**TRANSITION** TitleTransition '
                f'title-section-{slug}.json  '
                f'(synthesized from DIR: chapter("{chapter["title"]}"))'
            )

        if parsed is None:
            # Empty visual cell — narration with no specified visual.
            # Cursor still advances by narration duration.
            if narr_dur > 0:
                cursor += narr_dur
            continue

        seg_type = parsed["type"] or "FOOTAGE"

        # Visual duration: either explicit from script, or matched to narration
        if parsed["durationMode"] == "match_narration":
            # "match narration (~Xs)" — use hint if given, else WPM estimate
            vis_dur = parsed["durationSec"] if parsed["durationSec"] else narr_dur
        elif parsed["durationSec"]:
            vis_dur = parsed["durationSec"]
        else:
            vis_dur = narr_dur if narr_dur > 0 else 3.0

        # Apply PACE multiplier to visual duration when not explicitly set.
        # This stretches "breathing" visuals (1.4x) and compresses "urgent" ones (0.7x).
        # Narration duration is untouched — pacing affects visual change rate, not speech.
        # Don't apply to "match narration" mode — those explicitly want vis_dur == narr_dur.
        _pace_applied = False
        if (not parsed["durationSec"]
                and parsed["durationMode"] != "match_narration"
                and pace_mult != 1.0):
            vis_dur = vis_dur * pace_mult
            _pace_applied = True

        # Row duration = max of narration and visual.
        # Usually narration drives, but for empty-narration rows (transitions),
        # the visual drives.
        row_dur = max(narr_dur, vis_dur) if narr_dur > 0 else vis_dur

        # Handle multi-part visuals (THEN chains).
        # The script uses "THEN" to chain multiple visuals in one cell.
        # Split and create separate segments, but they share the row's time slot.
        vis_parts = re.split(r",?\s*THEN\s+", vis_raw) if "THEN" in vis_raw else [vis_raw]

        if len(vis_parts) > 1:
            # Multi-part: divide the row's time among parts based on their explicit durations
            part_specs = [parse_visual_spec(p) for p in vis_parts]
            explicit_durs = [ps["durationSec"] if ps and ps["durationSec"] else None for ps in part_specs]
            total_explicit = sum(d for d in explicit_durs if d)
            remaining = row_dur - total_explicit

            sub_cursor = cursor
            # strict=True: vis_parts and part_specs are constructed in parallel
            # earlier in this function; a length mismatch indicates a parser bug
            # we want to surface immediately, not silently truncate.
            for i, (part_raw, ps) in enumerate(zip(vis_parts, part_specs, strict=True)):
                if ps is None:
                    continue
                seg_counter += 1
                if explicit_durs[i]:
                    sub_dur = explicit_durs[i]
                elif remaining > 0:
                    # Divide remaining evenly among unspecified parts
                    unspecified = sum(1 for d in explicit_durs if d is None)
                    sub_dur = remaining / max(unspecified, 1)
                else:
                    sub_dur = row_dur / len(vis_parts)

                is_last_part = i == len(vis_parts) - 1
                part_direction = direction if is_last_part else {}
                seg = _build_segment(
                    seg_counter, ps or parsed, seg_type, sub_cursor, sub_dur,
                    beat_id, clean_narr, part_raw, vis_raw,
                    data_files=data_files, shot_ids=shot_ids,
                    direction=part_direction,
                )
                # over(previous) belongs to the first part — the one that
                # follows the picture.
                if i == 0:
                    apply_over_previous(seg, segments[-1] if segments else None, direction)
                # Stash direction transition on the last part of a THEN chain
                if is_last_part and direction.get("transitionOut"):
                    seg["_dirTransitionOut"] = direction["transitionOut"]
                    if direction.get("transitionDuration"):
                        seg["_dirTransitionDuration"] = direction["transitionDuration"]
                    if direction.get("washColor"):
                        seg["_dirWashColor"] = direction["washColor"]
                if row.get("pace") and row["pace"] != "analytical":
                    seg["paceProfile"] = row["pace"]
                if _pace_applied:
                    seg["_paceApplied"] = True
                # AMB: soundscape override — apply to TEMPLATE/TRANSITION segments only
                if amb_register and seg.get("type") in ("TEMPLATE", "TRANSITION"):
                    seg.setdefault("template", {})["soundscape"] = {"ambient": amb_register}
                segments.append(seg)
                sub_cursor += sub_dur
        else:
            seg_counter += 1
            seg = _build_segment(
                seg_counter, parsed, seg_type, cursor, vis_dur,
                beat_id, clean_narr, vis_raw, vis_raw,
                data_files=data_files, shot_ids=shot_ids,
                direction=direction,
            )
            apply_over_previous(seg, segments[-1] if segments else None, direction)

            # Stash direction transition info for apply_default_transitions
            if direction.get("transitionOut"):
                seg["_dirTransitionOut"] = direction["transitionOut"]
            if direction.get("transitionDuration"):
                seg["_dirTransitionDuration"] = direction["transitionDuration"]
            if direction.get("washColor"):
                seg["_dirWashColor"] = direction["washColor"]

            # Annotate non-default pacing for QA visibility
            if row.get("pace") and row["pace"] != "analytical":
                seg["paceProfile"] = row["pace"]
            if _pace_applied:
                seg["_paceApplied"] = True

            # AMB: soundscape override — apply to TEMPLATE/TRANSITION segments only
            if amb_register and seg.get("type") in ("TEMPLATE", "TRANSITION"):
                seg.setdefault("template", {})["soundscape"] = {"ambient": amb_register}

            segments.append(seg)

        # Advance cursor by row duration + holdAfter (direction extends segment
        # but also pushes all subsequent timing forward)
        hold_extra = direction.get("holdAfter", 0)
        cursor += row_dur + hold_extra

    # Expand brace-notation data refs (triptychs etc.) into N cards before
    # transitions are computed, so dissolves are applied between the cards too.
    segments = expand_brace_segments(segments)

    # Apply default transitions based on context (direction overrides take priority)
    segments = apply_default_transitions(segments)

    # Compute pace diff data before cleaning up temp keys
    pace_diffs = []
    for seg in segments:
        if seg.get("_paceApplied") and seg.get("paceProfile"):
            pace = seg["paceProfile"]
            mult = PACE_MULTIPLIERS.get(pace, 1.0)
            actual_dur = seg["endSec"] - seg["startSec"]
            if mult != 1.0:
                base_dur = actual_dur / mult
                pace_diffs.append({
                    "startSec": seg["startSec"],
                    "type": seg.get("type", "?"),
                    "template": seg.get("template", {}),
                    "baseDur": round(base_dur, 1),
                    "actualDur": round(actual_dur, 1),
                    "delta": round(actual_dur - base_dur, 1),
                    "pace": pace,
                })

    # Clean up temporary keys used by transition logic
    for seg in segments:
        for key in ["_dirTransitionOut", "_dirTransitionDuration", "_dirWashColor",
                     "_paceApplied"]:
            seg.pop(key, None)

    # Apply audio cues (L2 transition SFX + L3 texture hits) based on template type
    segments = apply_audio_cues(segments)

    # Compute total duration
    total_dur = max(
        (s["endSec"] for s in segments if isinstance(s.get("endSec"), (int, float))),
        default=0,
    )

    # Build music bed (L1) from beat structure
    beat_dicts = [
        {"id": b.id, "title": b.title, "startSec": b.startSec, "endSec": b.endSec}
        for b in beats
    ]
    music_bed = build_music_bed(beat_dicts, total_dur, episode_slug=episode)

    # Build manifest
    manifest = {
        "version": "1.0",
        "episode": episode,
        "title": title or episode,
        "fps": FPS,
        "totalDurationSec": round(total_dur, 2),
        "mode": "estimate",
        "pacing": {
            "multipliers": PACE_MULTIPLIERS,
            "profilesUsed": sorted(set(
                r["pace"] for r in rows if r.get("pace") and r["pace"] != "analytical"
            )),
            "diffs": pace_diffs,
            "netDeltaSec": round(sum(d["delta"] for d in pace_diffs), 1),
        },
        "narration": {
            "totalDurationSec": round(total_dur, 2),
            "words": [],
        },
        "musicBed": music_bed,
        "beats": [
            {
                "id": b.id,
                "title": b.title,
                "startSec": b.startSec,
                "endSec": b.endSec,
            }
            for b in beats
        ],
        "segments": segments,
        # Episode-level soundscape default (manifest.soundscape) is NOT set here —
        # per-segment [AMB:] directives set segment.template.soundscape.ambient.
        # A future `[AMB: register]` in the script HEADER (before any beat) would
        # set the episode default; that's a Phase 2 feature. For now, the cascade
        # falls to TEMPLATE_SOUNDSCAPE_DEFAULTS (level 3) then channel default (level 5).
    }

    return manifest, rows


# ── Pacing Lint ────────────────────────────────────────────────────────

def lint_pacing(manifest: dict) -> list[str]:
    """
    Check for problematic pacing patterns.
    Returns a list of warning strings (empty if clean).
    """
    warnings = []
    segments = manifest.get("segments", [])
    beats = manifest.get("beats", [])
    total_dur = manifest.get("totalDurationSec", 0)

    if not segments:
        return warnings

    # 1. Urgent stretches >45s
    urgent_run_start = None
    urgent_run_dur = 0.0
    for seg in segments:
        if seg.get("paceProfile") == "urgent":
            if urgent_run_start is None:
                urgent_run_start = seg["startSec"]
            urgent_run_dur = seg["endSec"] - urgent_run_start
        else:
            if urgent_run_dur > 45:
                warnings.append(
                    f"PACE-LINT: urgent section runs {urgent_run_dur:.0f}s "
                    f"({urgent_run_start:.0f}s–{urgent_run_start + urgent_run_dur:.0f}s) "
                    f"— consider >45s exhausting for viewers"
                )
            urgent_run_start = None
            urgent_run_dur = 0.0
    # Check final run
    if urgent_run_dur > 45:
        warnings.append(
            f"PACE-LINT: urgent section runs {urgent_run_dur:.0f}s "
            f"({urgent_run_start:.0f}s–{urgent_run_start + urgent_run_dur:.0f}s) "
            f"— consider >45s exhausting for viewers"
        )

    # 2. No breathing moments in episodes >15 minutes
    if total_dur > 900:  # 15 min
        has_breathing = any(
            s.get("paceProfile") == "breathing" for s in segments
        )
        if not has_breathing:
            warnings.append(
                f"PACE-LINT: {total_dur/60:.0f}-minute episode has no breathing "
                f"moments — consider adding PACE: breathing for emotional peaks"
            )

    # 3. Three or more pace changes in a single beat
    beat_ids = [b["id"] for b in beats]
    for bid in beat_ids:
        beat_segs = [s for s in segments if s.get("beat") == bid]
        if not beat_segs:
            continue
        # Count distinct pace transitions (not just distinct profiles)
        changes = 0
        prev_pace = None
        for s in beat_segs:
            p = s.get("paceProfile", "analytical")
            if prev_pace is not None and p != prev_pace:
                changes += 1
            prev_pace = p
        if changes >= 3:
            beat_title = next(
                (b["title"] for b in beats if b["id"] == bid), bid
            )
            warnings.append(
                f"PACE-LINT: Beat '{beat_title}' has {changes} pace transitions "
                f"— may feel erratic. Consider consolidating."
            )

    # 4. Breathing immediately after urgent (whiplash)
    prev_pace = "analytical"
    for seg in segments:
        cur_pace = seg.get("paceProfile", "analytical")
        if prev_pace == "urgent" and cur_pace == "breathing":
            warnings.append(
                f"PACE-LINT: whiplash at {seg['startSec']:.0f}s — urgent → breathing "
                f"with no analytical buffer. Consider a transition segment."
            )
        prev_pace = cur_pace

    return warnings


def lint_mg_streaks(rows: list[dict]) -> list[str]:
    """
    Warn when more than three consecutive script rows use [MG:] in the visual column.

    Editorial rule: VISUAL_LANGUAGE.md — max 3 consecutive [MG:] without a register break.
    Emits one warning per violating streak (when the 4th consecutive MG row is seen).

    Detection assumes SCRIPT_FORMAT table convention: the visual cell leads with the
    `[MG:` tag. Rows that mention MG only inline are not counted (avoids false positives).
    """
    warnings: list[str] = []
    mg_prefix = re.compile(r"^\s*\[MG:", re.IGNORECASE)
    streak = 0

    for row in rows:
        raw = row.get("visual_raw") or ""
        if mg_prefix.match(raw):
            streak += 1
            if streak == 4:
                beat = row.get("beat", "?")
                narr = (row.get("narration") or "").strip()
                narr_hint = narr[:70] + ("…" if len(narr) > 70 else "")
                vis_snip = raw[:90] + ("…" if len(raw) > 90 else "")
                warnings.append(
                    "VIS-LINT: 4+ consecutive [MG:] rows (max 3) — "
                    f"beat {beat}; narration: {narr_hint!r}; visual: {vis_snip!r}"
                )
        else:
            streak = 0

    return warnings


# ── Pacing Curve Visualization ──────────────────────────────────────────

def print_pace_map(manifest: dict) -> None:
    """
    Print an ASCII pacing curve showing segment durations, pace profiles,
    and visual change rate across the episode.

    Format:
      Beat 1: The Architecture of Dependency (0:00-2:30)
      ████░░░░░░██████░░░░░░████████░░░░░░████  avg: 5.2s/change
        F 4.5s   MG 8.0s     F 10.0s    MG 5.5s
        [analytical]

      Beat 2: The Trap Closes (2:30-5:00)
      ██░░██░░██░░████░░░░░░░░████████████████  avg: 3.1s/change
        F 2.8s MG 3.2s MG 2.5s  F 6.0s   MG 8.5s
        [urgent → breathing]
    """
    segments = manifest.get("segments", [])
    beats = manifest.get("beats", [])

    if not segments:
        print("\n  No segments to visualize.\n")
        return

    print(f"\n{'=' * 72}")
    print(f"  PACING MAP — {manifest.get('title', manifest.get('episode', ''))}")
    print(f"  {len(segments)} segments · {manifest.get('totalDurationSec', 0):.1f}s total")
    print(f"{'=' * 72}\n")

    # Group segments by beat
    beat_segments: dict[str, list[dict]] = {}
    for seg in segments:
        bid = seg.get("beat", "unknown")
        beat_segments.setdefault(bid, []).append(seg)

    beat_info = {b["id"]: b for b in beats}

    # Symbols for segment types
    TYPE_CHAR = {
        "FOOTAGE": "░",
        "IMAGE": "░",
        "TEMPLATE": "█",
        "TRANSITION": "─",
        "HOLD": "·",
    }

    for beat_id, segs in beat_segments.items():
        bi = beat_info.get(beat_id, {})
        title = bi.get("title", beat_id)
        start = bi.get("startSec", segs[0]["startSec"] if segs else 0)
        end = bi.get("endSec", segs[-1]["endSec"] if segs else 0)
        start_mm, start_ss = int(start // 60), int(start % 60)
        end_mm, end_ss = int(end // 60), int(end % 60)

        # Collect pace profiles in order of first appearance (not alphabetical)
        beat_paces = []
        seen_paces = set()
        for s in segs:
            p = s.get("paceProfile", "analytical")
            if p not in seen_paces:
                beat_paces.append(p)
                seen_paces.add(p)

        # Calculate durations and visual change rate
        durations = [s["endSec"] - s["startSec"] for s in segs]
        avg_dur = sum(durations) / len(durations) if durations else 0
        total_beat_dur = sum(durations)

        print(f"  Beat: {title} ({start_mm}:{start_ss:02d}–{end_mm}:{end_ss:02d})")

        # ASCII bar — each char ≈ 1 second, max width 60
        scale = min(1.0, 60 / max(total_beat_dur, 1))
        bar_chars = []
        labels = []
        for s in segs:
            dur = s["endSec"] - s["startSec"]
            width = max(1, int(dur * scale))
            char = TYPE_CHAR.get(s.get("type", ""), "?")
            bar_chars.append(char * width)

            # Short type label
            stype = s.get("type", "?")[:1]
            tpl = s.get("template", {}).get("component", "")
            if tpl:
                stype = tpl[:6]
            labels.append(f"{stype} {dur:.0f}s")

        print(f"  {''.join(bar_chars)}")
        print(f"    {' '.join(labels)}")

        # Pace annotation
        pace_str = " → ".join(beat_paces)
        change_rate = f"{avg_dur:.1f}s/change"
        print(f"    [{pace_str}]  avg: {change_rate}  ({len(segs)} segments)")
        print()

    # Summary
    all_paces = set(s.get("paceProfile", "analytical") for s in segments)
    all_durs = [s["endSec"] - s["startSec"] for s in segments]
    print(f"  {'─' * 60}")
    print(f"  Overall: avg {sum(all_durs)/len(all_durs):.1f}s/change  "
          f"profiles: {', '.join(sorted(all_paces))}")
    print(f"  Shortest: {min(all_durs):.1f}s  Longest: {max(all_durs):.1f}s")
    print()

    # Pace diff — show segments whose duration was actually altered by PACE multipliers.
    pacing = manifest.get("pacing", {})
    diffs = pacing.get("diffs", [])
    profiles_used = pacing.get("profilesUsed", [])
    if not diffs and profiles_used:
        paced_count = sum(1 for s in segments if s.get("paceProfile"))
        print(f"  PACE DIFF — {paced_count} segments have pace profiles but all have "
              f"explicit durations (multiplier not applied)")
        print()
    elif diffs:
        print(f"  PACE DIFF — {len(diffs)} segments affected")
        print(f"  {'─' * 60}")
        for d in diffs:
            tpl = d.get("template", {})
            comp = tpl.get("component", "") if isinstance(tpl, dict) else ""
            label = comp[:16] or d.get("type", "?")[:8]
            print(f"    {d['startSec']:6.1f}s  {label:16s}  "
                  f"{d['baseDur']:5.1f}s → {d['actualDur']:5.1f}s  "
                  f"({d['delta']:+.1f}s)  [{d['pace']}]")

        net = pacing.get("netDeltaSec", 0)
        print(f"  {'─' * 60}")
        print(f"  Net duration change from pacing: {net:+.1f}s")
        print()


def _build_segment(
    seg_counter: int,
    parsed: dict,
    seg_type: str,
    start: float,
    dur: float,
    beat_id: str,
    clean_narr: str,
    part_raw: str,
    vis_raw: str,
    data_files: dict = None,
    shot_ids: dict = None,
    direction: dict = None,
) -> dict:
    """Build a single segment dict from parsed visual spec data."""
    direction = direction or {}

    # Apply preDelay: shift the visual start later (but don't change the cursor)
    pre_delay = direction.get("preDelay", 0)

    # Apply holdAfter: extend the visual end time
    hold_after = direction.get("holdAfter", 0)

    seg = {
        "id": f"{beat_id}-seg{seg_counter:02d}",
        "type": seg_type,
        "startSec": round(start + pre_delay, 2),
        "endSec": round(start + dur + hold_after, 2),
        "layer": "foreground" if seg_type in ("TEMPLATE", "TRANSITION") else "background",
        "beat": beat_id,
        "priority": parsed["priority"],
    }

    # Add direction timing metadata if present
    if pre_delay > 0:
        seg["preDelay"] = pre_delay
    if hold_after > 0:
        seg["holdAfter"] = hold_after
        if "holdBehavior" in direction:
            seg["holdBehavior"] = direction["holdBehavior"]
    if "narrationGate" in direction:
        seg["narrationGate"] = direction["narrationGate"]
    if direction.get("syncWords"):
        seg["syncWords"] = direction["syncWords"]
    # Phase 7: J/L-cut audio bridge fields (TRANSITION_GRAMMAR.md §07).
    # Forwarded from DIR: jcut(N) / lcut(N) on the script row. The default
    # narrationLeadIn: 0.7 for hard cuts is applied later by
    # apply_default_transitions(), NOT here.
    if "narrationLeadIn" in direction:
        seg["narrationLeadIn"] = direction["narrationLeadIn"]
    if "narrationLagOut" in direction:
        seg["narrationLagOut"] = direction["narrationLagOut"]

    # Drift preset (DIR: drift(...) or hold(stillness)) — write to
    # segment._direction so FullEpisode.tsx merges it into data._direction
    # for the template's useDirection() to consume. Per-segment script
    # override wins over template default (set via useDirection(data._direction,
    # "documentary") in the template); see HOLD_MOTION_REGISTER.md / D20.
    if "driftPreset" in direction:
        seg.setdefault("_direction", {})["driftPreset"] = direction["driftPreset"]

    # Narration reference
    if clean_narr:
        seg["narrationRef"] = clean_narr[:80]

    # Asset info for FOOTAGE / IMAGE
    if seg_type in ("FOOTAGE", "IMAGE"):
        shot_id = resolve_shot_id(parsed["searchTerms"], shot_ids)
        seg["asset"] = {
            "searchTerms": parsed["searchTerms"],
            "source": parsed["source"],
        }
        if shot_id:
            seg["asset"]["shotListId"] = shot_id

        seg["treatment"] = {
            "ramp": parsed["ramp"],
            "composite": parsed["composite"],
        }
        if parsed["opacity"] is not None:
            seg["treatment"]["opacity"] = parsed["opacity"]

    # Template info for TEMPLATE / TRANSITION
    if seg_type in ("TEMPLATE", "TRANSITION") and parsed["component"]:
        data_file = resolve_data_file(parsed["component"], parsed["searchTerms"], vis_raw, data_files)
        seg["template"] = {
            "component": parsed["component"],
        }
        if isinstance(data_file, list):
            # Brace-expanded ref (e.g. annotated-image-{a,b,c}.json). Record the
            # first card's data file now and stash the full list; the seg is
            # split into N sequential cards by expand_brace_segments() after the
            # build loop, so the per-row caller logic stays untouched.
            if data_file:
                seg["template"]["dataFile"] = data_file[0]
                seg["_braceDataFiles"] = data_file
        elif data_file:
            seg["template"]["dataFile"] = data_file

        # Phase 6 chapter sugar — inline title metadata. When the segment
        # was synthesized from `DIR: chapter("...")`, attach the title /
        # kicker as `template.props` so Remotion can render the card even
        # if no `title-section-<slug>.json` data file exists yet. (The
        # FullEpisode-side merge of template.props into data is queued for
        # a follow-up; until then, this metadata is harmless if unread.)
        if parsed.get("_chapterTitle"):
            seg["template"]["props"] = {
                "title": parsed["_chapterTitle"],
                "variant": "section",
            }
            if parsed.get("_chapterKicker"):
                seg["template"]["props"]["kicker"] = parsed["_chapterKicker"]
            if not data_file:
                print(
                    f"⚠  DIR: chapter() emitted a TitleTransition segment but "
                    f"no `title-section-{parsed['_chapterSlug']}.json` data file "
                    f"was found in data_files. The card will rely on inline "
                    f"props.title until you create the JSON or update the slug.",
                    file=sys.stderr,
                )

        bid = parsed.get("backdropId")
        if (
            bid
            and seg_type == "TEMPLATE"
            and parsed["component"] != "TitleTransition"
        ):
            ids = valid_backdrop_ids()
            if ids and bid not in ids:
                print(
                    f"WARNING: Unknown [BACKDROP: {bid}] — not in "
                    "remotion-templates/data/backdrop-manifest.json. "
                    f"Known: {', '.join(sorted(ids))}",
                    file=sys.stderr,
                )
            seg["template"]["backdropId"] = bid
            warn_clutter_backdrop_mismatch(bid, parsed["component"])

        # [OVERLAY: preset] — per-segment FilmOverlay preset override.
        # Emitted as template.filmOverlay.preset when present; consumed at
        # render time by resolveFilmOverlay() (cascade level 1). When absent,
        # the cascade picks via backdrop.recommendedPreset → TEMPLATE_PRESET_MAP
        # → episode default → "documentary". The whole system is GATED on
        # episode-level manifest.filmOverlay being set; this tag is emitted
        # unconditionally and silently ignored at render time if the episode
        # hasn't opted in.
        preset = parsed.get("overlayPreset")
        if preset:
            seg["template"]["filmOverlay"] = {"preset": preset}

    # Hold info
    if seg_type == "HOLD":
        seg["hold"] = {"freeze": True}

    # Notes
    if parsed["notes"]:
        seg["notes"] = parsed["notes"]

    return seg


# ── Precise Mode: WhisperX + SileroVAD + RapidFuzz ────────────────────────
#
# Why WhisperX instead of vanilla Whisper:
#   - Vanilla Whisper word timestamps are an "inference-time trick" with ±200ms
#     drift. After long silence (dramatic pauses in narration), timestamps shift
#     by 10+ seconds and Whisper hallucinates filler phrases.
#   - WhisperX adds phoneme-level forced alignment via wav2vec2, giving ±50ms
#     precision. It also pre-segments with SileroVAD to strip silence before
#     transcription, preventing hallucination.
#
# Why RapidFuzz instead of string.find():
#   - Whisper transcripts differ from the script in punctuation, contractions,
#     and occasional rephrasing. token_sort_ratio from RapidFuzz is validated
#     in speech research for matching ASR output against known text.
#   - RapidFuzz is a C++ backend — much faster than difflib.SequenceMatcher.
#
# Install:
#   pip install whisperx rapidfuzz torch torchaudio
#
# WhisperX also requires a HuggingFace token for wav2vec2 alignment models:
#   export HF_TOKEN=your_token_here

MIN_PAUSE_SEC = 1.5  # Silence gaps >= this become HOLD segments
MATCH_THRESHOLD = 65  # RapidFuzz score below this = no match (0-100)


def detect_pauses(audio_path: str, min_pause_sec: float = MIN_PAUSE_SEC) -> list[dict]:
    """
    Use SileroVAD to detect silence gaps in narration audio.
    Returns list of pause segments: [{"start": float, "end": float, "durationSec": float}]
    """
    try:
        import torch
        # SileroVAD ships as a torch.hub model
        model, utils = torch.hub.load(
            repo_or_dir="snakers4/silero-vad",
            model="silero_vad",
            trust_repo=True,
        )
        (get_speech_timestamps, _, read_audio, *_) = utils
    except Exception as e:  # noqa: BLE001 — third-party torch.hub failure surface
        # torch.hub.load can fail in MANY ways: network (model download),
        # version mismatch (model API changed), filesystem (cache locked /
        # disk full), AttributeError (utils tuple shape changed), GPU
        # init errors. Every failure should degrade gracefully to "no
        # pause detection" — pre-launch users should never have a render
        # blocked by an optional model. Pre-launch this code path is also
        # rarely exercised; widening the catch is the right trade-off
        # until we have telemetry on real failures.
        print(f"WARNING: SileroVAD not available ({e}). Skipping pause detection.")
        return []

    print("  Detecting pauses with SileroVAD...")
    wav = read_audio(audio_path, sampling_rate=16000)
    speech_timestamps = get_speech_timestamps(wav, model, sampling_rate=16000)

    # Convert speech regions to pause regions (gaps between speech)
    pauses = []
    for i in range(1, len(speech_timestamps)):
        prev_end = speech_timestamps[i - 1]["end"] / 16000  # samples → seconds
        curr_start = speech_timestamps[i]["start"] / 16000
        gap = curr_start - prev_end
        if gap >= min_pause_sec:
            pauses.append({
                "start": round(prev_end, 3),
                "end": round(curr_start, 3),
                "durationSec": round(gap, 3),
            })

    print(f"  Found {len(pauses)} dramatic pauses (>= {min_pause_sec}s)")
    return pauses


def get_audio_duration(audio_path: str) -> float:
    """Get audio duration in seconds using ffprobe."""
    import subprocess
    probe = subprocess.run(
        ["ffprobe", "-v", "quiet", "-show_entries", "format=duration",
         "-of", "csv=p=0", audio_path],
        capture_output=True, text=True,
    )
    if probe.stdout.strip():
        return float(probe.stdout.strip())
    # Fallback: try torchaudio
    try:
        import torchaudio
        info = torchaudio.info(audio_path)
        return info.num_frames / info.sample_rate
    except (ImportError, OSError, RuntimeError, AttributeError, ZeroDivisionError) as e:
        # ImportError: torchaudio not installed (most common).
        # OSError: file missing / unreadable.
        # RuntimeError: torchaudio raises this for unsupported codecs +
        #   corrupt/truncated audio files.
        # AttributeError: defensive — if torchaudio's API changes and
        #   `.info()` returns a shape we don't expect.
        # ZeroDivisionError: sample_rate=0 → division crash.
        # Other exceptions bubble; this is a graceful-degradation path,
        # not a swallow-all defense.
        print(
            f"WARNING: could not read audio duration from {audio_path!r}: {e}. "
            "Precise-mode segment timestamps will be computed against duration=0 "
            "and will be wrong. Check that ffprobe and/or torchaudio are installed "
            "and the audio file is accessible.",
            file=sys.stderr,
        )
        return 0.0


def transcribe_whisperx(
    audio_path: str, hf_token: str | None = None, language: str = "en"
) -> tuple[float, list[dict]]:
    """
    Run WhisperX on narration audio for phoneme-level word timestamps.

    WhisperX pipeline:
      1. Transcribe with Whisper (fast, but coarse timestamps)
      2. Force-align with wav2vec2 (phoneme-level precision, ±50ms)
      3. Return word-level timestamps

    `language` selects the model + alignment model:
      "en" → English-only "base.en" model (fastest, default)
      "zh" → multilingual "base" model with forced language="zh"; WhisperX
             loads a Mandarin wav2vec2 alignment model. Used for the separate
             ZH narration + render cut (one full pipeline pass per language).

    Returns: (total_duration_sec, [{"word": str, "start": float, "end": float}, ...])
    """
    try:
        import whisperx
    except ImportError:
        print("ERROR: whisperx not installed. Install with:")
        print("  pip install whisperx")
        print("")
        print("  WhisperX also requires a HuggingFace token for alignment models:")
        print("  export HF_TOKEN=your_token_here")
        sys.exit(1)

    import os

    import torch

    device = "cuda" if torch.cuda.is_available() else "cpu"
    compute_type = "float16" if device == "cuda" else "int8"
    hf_token = hf_token or os.environ.get("HF_TOKEN")

    # English-only model is faster; any other language needs the multilingual base.
    model_name = "base.en" if language == "en" else "base"

    # Step 1: Transcribe with Whisper (coarse timestamps)
    print(f"  Loading WhisperX model ({model_name}, lang={language}) on {device}...")
    model = whisperx.load_model(model_name, device, compute_type=compute_type)

    print(f"  Transcribing {audio_path}...")
    audio = whisperx.load_audio(audio_path)
    # base.en ignores the language hint; multilingual models need it forced so
    # the transcriber doesn't mis-detect (e.g. short ZH clips read as Japanese).
    transcribe_kwargs = {"batch_size": 16}
    if model_name != "base.en":
        transcribe_kwargs["language"] = language
    result = model.transcribe(audio, **transcribe_kwargs)

    # Step 2: Force-align with wav2vec2 (phoneme-level precision)
    print("  Running phoneme-level forced alignment...")
    align_model, metadata = whisperx.load_align_model(
        language_code=language, device=device
    )
    result = whisperx.align(
        result["segments"], align_model, metadata, audio, device,
        return_char_alignments=False,
    )

    # Step 3: Extract word-level timestamps
    words = []
    for segment in result["segments"]:
        for w in segment.get("words", []):
            if "start" in w and "end" in w:
                words.append({
                    "word": w["word"].strip(),
                    "start": round(w["start"], 3),
                    "end": round(w["end"], 3),
                })

    total_duration = get_audio_duration(audio_path)
    if not total_duration and words:
        total_duration = words[-1]["end"]

    print(f"  WhisperX: {len(words)} words, {total_duration:.1f}s total")
    return total_duration, words


def fuzzy_match_segment(
    narration_ref: str,
    words: list[dict],
    already_matched: set[int],
) -> float | None:
    """
    Use RapidFuzz to find where a narration reference appears in the word stream.

    Instead of naive string.find(), this handles:
      - Contractions ("it's" vs "it is")
      - Punctuation differences
      - Minor ASR transcription variance
      - Whisper occasionally rephrasing slightly

    Uses a sliding window of word groups, scoring each against the narration ref
    with token_sort_ratio. Returns the start timestamp of the best match, or None.
    """
    try:
        from rapidfuzz import fuzz
    except ImportError:
        # Fallback to difflib if rapidfuzz not installed
        from difflib import SequenceMatcher

        def token_sort_ratio(a: str, b: str) -> float:
            a_sorted = " ".join(sorted(a.lower().split()))
            b_sorted = " ".join(sorted(b.lower().split()))
            return SequenceMatcher(None, a_sorted, b_sorted).ratio() * 100

        fuzz = type("fuzz", (), {"token_sort_ratio": staticmethod(token_sort_ratio)})()

    ref_clean = re.sub(r"[^\w\s]", "", narration_ref.lower()).strip()
    ref_words = ref_clean.split()

    if len(ref_words) < 3:
        return None

    # Use first 8 words of the reference for matching — enough for uniqueness,
    # short enough to be robust against mid-sentence transcription drift
    match_words = ref_words[:8]
    match_phrase = " ".join(match_words)
    window_size = len(match_words) + 2  # slightly wider window for fuzzy tolerance

    best_score = 0
    best_idx = -1

    for i in range(len(words) - len(match_words) + 1):
        if i in already_matched:
            continue

        window = " ".join(
            re.sub(r"[^\w\s]", "", w["word"].lower())
            for w in words[i : i + window_size]
        )

        score = fuzz.token_sort_ratio(match_phrase, window)

        if score > best_score and score >= MATCH_THRESHOLD:
            best_score = score
            best_idx = i

    if best_idx >= 0:
        already_matched.add(best_idx)
        return words[best_idx]["start"]

    return None


def align_to_narration(
    manifest: dict, audio_path: str, hf_token: str | None = None, language: str = "en"
) -> dict:
    """
    Upgrade an estimate-mode manifest to precise mode by aligning
    segment boundaries to WhisperX word timestamps + SileroVAD pauses.

    `language` ("en" | "zh") selects the WhisperX transcription/alignment models
    so the same pipeline produces a fully native ZH cut from a translated script
    + ZH narration WAV (the segments' narrationRef must be in that language for
    fuzzy-matching to work).

    Pipeline:
      1. Detect dramatic pauses with SileroVAD → insert HOLD segments
      2. Transcribe with WhisperX → phoneme-level word timestamps
      3. Fuzzy-match each segment's narrationRef to word stream → precise start times
      4. Re-sequence segments chronologically
    """
    # Step 1: Detect pauses
    pauses = detect_pauses(audio_path)

    # Step 2: Transcribe
    total_dur, words = transcribe_whisperx(audio_path, hf_token, language=language)

    # Update manifest metadata
    manifest["mode"] = "precise"
    manifest["narration"]["audioFile"] = str(Path(audio_path).name)
    manifest["narration"]["totalDurationSec"] = round(total_dur, 2)
    manifest["narration"]["words"] = words
    manifest["totalDurationSec"] = round(total_dur + END_CARD_PADDING_SEC, 2)

    # Step 3: Fuzzy-match segments to word timestamps
    already_matched: set[int] = set()
    matched_count = 0
    unmatched_segs = []

    for seg in manifest["segments"]:
        ref = seg.get("narrationRef", "").strip()
        if not ref or len(ref) < 10:
            continue

        match_time = fuzzy_match_segment(ref, words, already_matched)
        if match_time is not None:
            duration = seg["endSec"] - seg["startSec"]
            seg["startSec"] = round(match_time, 2)
            seg["endSec"] = round(match_time + duration, 2)
            matched_count += 1
        else:
            unmatched_segs.append(seg["id"])

    print(f"  Aligned {matched_count} segments to narration timestamps")
    if unmatched_segs:
        print(f"  Unmatched ({len(unmatched_segs)}): {', '.join(unmatched_segs[:5])}")

    # Step 4: Insert detected pauses as HOLD segments
    # These represent dramatic beats in the narration where the previous
    # visual should sustain (e.g. "Let that land. [2 second pause]")
    hold_count = 0
    for pause in pauses:
        hold_id = f"pause-hold-{hold_count + 1:02d}"
        # Find which beat this pause falls in
        beat_id = "unknown"
        for b in manifest.get("beats", []):
            # Use segment timestamps (already aligned) to find beat
            beat_segs = [s for s in manifest["segments"] if s.get("beat") == b["id"]]
            if beat_segs:
                b_start = min(s["startSec"] for s in beat_segs)
                b_end = max(s["endSec"] for s in beat_segs)
                if b_start <= pause["start"] <= b_end:
                    beat_id = b["id"]
                    break

        hold_seg = {
            "id": hold_id,
            "type": "HOLD",
            "startSec": pause["start"],
            "endSec": pause["end"],
            "layer": "background",
            "beat": beat_id,
            "hold": {"freeze": True},
            "notes": f"Dramatic pause detected by SileroVAD ({pause['durationSec']:.1f}s)",
        }
        manifest["segments"].append(hold_seg)
        hold_count += 1

    if hold_count:
        print(f"  Inserted {hold_count} HOLD segments from detected pauses")

    # Step 5: Resolve sync words to frame-accurate timestamps
    resolve_all_sync_points(manifest["segments"], words)

    # Re-sort segments by start time
    manifest["segments"].sort(key=lambda s: (s["startSec"], 0 if s["layer"] == "background" else 1))

    return manifest


def resolve_all_sync_points(segments: list[dict], words: list[dict]) -> None:
    """
    Resolve syncWords in segments to frame-accurate syncPoints using
    WhisperX word timestamps. Each syncWord is fuzzy-matched against
    words in the segment's time range.

    After resolution, segments gain a syncPoints array:
    [{"word": "Taiwan", "timeSec": 48.3, "frame": 1449, "confidence": 0.94}]

    Templates use these to anchor camera steps and reveal animations
    to exact narration moments.
    """
    resolved_count = 0

    for seg in segments:
        sync_words = seg.get("syncWords", [])
        if not sync_words:
            continue

        seg_start = seg["startSec"]
        seg_end = seg["endSec"]
        sync_points = []

        # Cues are positional and written in narration order, so each one is
        # searched after the one before it: a repeated word resolves to the
        # occurrence the cue means, not always the first.
        after = None
        for sw in sync_words:
            match = _find_sync_word(sw, words, seg_start, seg_end, after=after)
            if match:
                # How sure the transcriber was of the word (WhisperX calls it
                # `score`, faster-whisper `probability`), times how exact the
                # phrase match was.
                heard = match.get("confidence", match.get("probability", match.get("score")))
                heard = 1.0 if heard is None or heard < 0 else heard
                sync_points.append({
                    "word": sw,
                    "timeSec": round(match["start"], 3),
                    "frame": round(match["start"] * FPS),
                    "confidence": round(heard * match["_score"], 2),
                })
                resolved_count += 1
                after = match["start"] + 0.01
            else:
                # Word not found in this segment's range — keep as unresolved
                sync_points.append({
                    "word": sw,
                    "timeSec": None,
                    "frame": None,
                    "confidence": 0,
                })

        if sync_points:
            seg["syncPoints"] = sync_points

    if resolved_count:
        print(f"  Resolved {resolved_count} sync words to frame-accurate timestamps")


_ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
         "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen",
         "eighteen", "nineteen"]
_TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"]

# A fuzzy hit must be at least this similar, and the cue at least this long:
# short words are where near-misses are wrong words ("our" inside "four").
SYNC_FUZZY_RATIO = 0.88
SYNC_FUZZY_MIN_CHARS = 5
# How far outside its segment a cue word may fall (boundaries are themselves aligned).
SYNC_RANGE_SLACK_SEC = 0.25


def _int_words(n: int) -> list[str]:
    """123 → ["one", "hundred", "twenty", "three"] (no "and")."""
    if n < 20:
        return [_ONES[n]]
    if n < 100:
        return [_TENS[n // 10]] + ([_ONES[n % 10]] if n % 10 else [])
    if n < 1000:
        return [_ONES[n // 100], "hundred"] + (_int_words(n % 100) if n % 100 else [])
    if n < 1_000_000:
        return _int_words(n // 1000) + ["thousand"] + (_int_words(n % 1000) if n % 1000 else [])
    return [str(n)]


def _sync_tokens(text: str) -> list[str]:
    """Words as they are compared for sync cues: lower-case, no punctuation or
    possessive, and numerals spelled out, so "40 times", "40x" and "forty
    times" are the same three ways of writing one thing a narrator says."""
    out: list[str] = []
    for raw in re.split(r"[\s\-–—]+", text.lower().replace("’", "'")):
        raw = re.sub(r"'s$", "", raw.strip(".,;:!?\"'()[]"))
        if not raw:
            continue
        m = re.match(r"^\$?(\d[\d,]*)(?:\.(\d+))?(%|x|×)?$", raw)
        if m:
            out += _int_words(int(m.group(1).replace(",", "")))
            if m.group(2):
                out += ["point"] + [_ONES[int(d)] for d in m.group(2)]
            if m.group(3):
                out.append("percent" if m.group(3) == "%" else "times")
            continue
        raw = re.sub(r"[^\w]", "", raw)
        if raw and not (raw == "and" and out and out[-1] in ("hundred", "thousand")):
            out.append(raw)
    return out


def _find_sync_word(
    sync_word: str, words: list[dict], seg_start: float, seg_end: float,
    after: float | None = None,
) -> dict | None:
    """
    Find a sync cue in the word stream within a segment's time range.

    The cue and the transcript are compared as spelled-out, punctuation-free
    words (`_sync_tokens`), so numerals and possessives do not break a match.
    An exact phrase match wins; otherwise the closest phrase is accepted only
    when it is very close and the cue is long enough for that to mean something.
    There is no "one string contains the other" fallback: it resolved cues to
    unrelated short words.

    `after` restricts the search to words starting at or after that time, so
    the cues of one segment resolve in narration order.

    Returns the transcript word the cue starts on, with `_score` (1.0 for an
    exact match, the similarity for a fuzzy one), or None.
    """
    cue = _sync_tokens(sync_word)
    if not cue:
        return None
    lo = seg_start - SYNC_RANGE_SLACK_SEC
    if after is not None:
        lo = max(lo, after)
    hi = seg_end + SYNC_RANGE_SLACK_SEC

    # Flatten the in-range words to (token, word) pairs; one written word can
    # be several spoken ones ("36" → thirty, six).
    stream = [(tok, w) for w in words if lo <= w["start"] <= hi for tok in _sync_tokens(w["word"])]
    n = len(cue)
    for i in range(len(stream) - n + 1):
        if [tok for tok, _ in stream[i:i + n]] == cue:
            return {**stream[i][1], "_score": 1.0}

    phrase = " ".join(cue)
    if len(phrase) < SYNC_FUZZY_MIN_CHARS:
        return None
    from difflib import SequenceMatcher
    best, best_ratio = None, 0.0
    for i in range(len(stream) - n + 1):
        window = [tok for tok, _ in stream[i:i + n]]
        if window[0][:1] != cue[0][:1]:
            continue
        ratio = SequenceMatcher(None, phrase, " ".join(window)).ratio()
        if ratio > best_ratio:
            best, best_ratio = stream[i][1], ratio
    if best is not None and best_ratio >= SYNC_FUZZY_RATIO:
        return {**best, "_score": round(best_ratio, 3)}
    return None


# ── CLI ────────────────────────────────────────────────────────────────────

def hand_wired_refusal(out_path: Path, force: bool = False) -> str | None:
    """Why this output must not be regenerated, or None if it may be.

    A manifest marked `handWired` carries wiring the script cannot reproduce
    (clip files, split rows, hold-under, per-seam transitions). Regenerating
    would silently drop it, so the generator stops unless --force is given.
    """
    if force or not out_path.exists():
        return None
    try:
        existing = json.loads(out_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None
    if not (isinstance(existing, dict) and existing.get("handWired")):
        return None
    return (
        f"Refusing to overwrite {out_path}: it is marked handWired, and regenerating "
        "from the script would drop its hand wiring.\n"
        "  To move its timings to recorded narration: "
        "python3 tools/assembly/retime_manifest.py <slug> --audio <wav>\n"
        "  To regenerate anyway: add --force, or write to a different --output."
    )


def main():
    parser = argparse.ArgumentParser(
        description="Generate Parallax assembly manifest from production script."
    )
    parser.add_argument(
        "--script", required=True,
        help="Path to two-column production script (.md)",
    )
    parser.add_argument(
        "--episode", required=True,
        help="Episode slug (e.g. silicon-trap, prisoners-dilemma)",
    )
    parser.add_argument(
        "--title", default="",
        help="Episode title (e.g. 'The Silicon Trap')",
    )
    parser.add_argument(
        "--audio",
        help="Path to narration audio file for precise mode (WAV/MP3)",
    )
    parser.add_argument(
        "--hf-token",
        help="HuggingFace token for WhisperX alignment models (or set HF_TOKEN env var)",
    )
    parser.add_argument(
        "--lang", default="en", choices=["en", "zh"],
        help="Narration language for WhisperX transcription/alignment (default: en). "
             "Use 'zh' with a translated script + ZH narration WAV for the separate "
             "Mandarin cut (one full pipeline pass per language).",
    )
    parser.add_argument(
        "--output", "-o", required=True,
        help="Output path for assembly manifest JSON",
    )
    parser.add_argument(
        "--config",
        help="Path to episode config JSON with 'dataFiles' and 'shotIds' maps (optional — defaults to silicon-trap maps)",
    )
    parser.add_argument(
        "--pretty", action="store_true", default=True,
        help="Pretty-print JSON output (default: true)",
    )
    parser.add_argument(
        "--pace-map", action="store_true",
        help="Print ASCII pacing curve after manifest generation",
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Overwrite an output manifest marked handWired (its hand wiring is lost)",
    )

    args = parser.parse_args()

    refusal = hand_wired_refusal(Path(args.output), args.force)
    if refusal:
        sys.exit(refusal)

    # Load per-episode config if provided
    ep_data_files = None
    ep_shot_ids = None
    if args.config:
        config = json.loads(Path(args.config).read_text(encoding="utf-8"))
        ep_data_files = config.get("dataFiles")
        ep_shot_ids = config.get("shotIds")
        print(f"Loaded episode config: {args.config}")
    elif args.episode != "silicon-trap":
        # For new episodes without a config, use empty maps instead of
        # silicon-trap defaults. Template segments will get dataFile=null
        # and shotId=null, which is correct — data files don't exist yet.
        ep_data_files = {}
        ep_shot_ids = {}
        print(f"No --config provided for '{args.episode}' — using empty maps (dataFile/shotId will be null)")

    # Build estimate manifest
    print(f"Parsing script: {args.script}")
    manifest, script_rows = build_estimate_manifest(
        args.script, args.episode, args.title,
        data_files=ep_data_files, shot_ids=ep_shot_ids,
    )
    print(f"  Found {len(manifest['beats'])} beats, {len(manifest['segments'])} segments")
    print(f"  Estimated duration: {manifest['totalDurationSec']:.1f}s ({manifest['totalDurationSec']/60:.1f} min)")

    # Tag the manifest language so render scripts / templates can pick the cut.
    manifest["language"] = args.lang

    # Upgrade to precise mode if audio provided
    if args.audio:
        print(f"\nAligning to narration audio ({args.lang}): {args.audio}")
        print("  Pipeline: SileroVAD (pause detection) → WhisperX (transcription + alignment) → RapidFuzz (matching)")
        manifest = align_to_narration(manifest, args.audio, hf_token=args.hf_token, language=args.lang)
        print(f"  Precise duration: {manifest['totalDurationSec']:.1f}s")

    # Write output
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2 if args.pretty else None, ensure_ascii=False)

    print(f"\nManifest written to: {out_path}")
    print(f"  Mode: {manifest['mode']}")
    print(f"  Segments: {len(manifest['segments'])}")

    # Summary by type
    type_counts = {}
    for seg in manifest["segments"]:
        t = seg["type"]
        type_counts[t] = type_counts.get(t, 0) + 1
    for t, c in sorted(type_counts.items()):
        print(f"    {t}: {c}")

    # Pacing lint (always runs)
    pace_warnings = lint_pacing(manifest)
    if pace_warnings:
        print()
        for w in pace_warnings:
            print(f"  ⚠  {w}")

    mg_warnings = lint_mg_streaks(script_rows)
    if mg_warnings:
        print()
        for w in mg_warnings:
            print(f"  ⚠  {w}")

    # Pacing curve visualization
    if args.pace_map:
        print()
        print_pace_map(manifest)


if __name__ == "__main__":
    main()
