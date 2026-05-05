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
import json
import re
import sys
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional


# ── Constants ──────────────────────────────────────────────────────────────

WPM = 150  # analytical narration pace (from PRODUCTION_NOTES)
FPS = 30
DEFAULT_BROLL_INTERVAL = 4.0  # seconds per visual change for auto-fill gaps

# ── DIR: annotation parsing ───────────────────────────────────────────────
# Matches: DIR: type(params)
DIR_LINE_RE = re.compile(r"^\s*DIR:\s*(\w+)\((.+?)\)\s*$")

# Hold presets → (holdAfter, holdBehavior)
HOLD_PRESETS = {
    "breathe": (2.0, "breathe"),
    "land": (1.0, "land"),
    "linger": (3.0, "linger"),
}

# Transition type mappings for cut()
VALID_CUT_TYPES = {
    "cut", "fade", "dissolve", "wipe-left", "wipe-right", "wipe-up",
    "blur-through", "color-wash", "iris", "match-cut", "whip-pan", "spatial-zoom",
}

# Palette name → hex for color-wash
PALETTE_COLORS = {
    "ink": "#1C1814",
    "amber": "#E5A544",
    "rust": "#C23B22",
    "bone": "#F0E6D0",
    "oxblood": "#6B1D1D",
}


# ── Data Classes ───────────────────────────────────────────────────────────

@dataclass
class WordTimestamp:
    word: str
    start: float
    end: float


@dataclass
class Asset:
    shotListId: Optional[str] = None
    searchTerms: list = field(default_factory=list)
    source: Optional[str] = None
    file: Optional[str] = None


@dataclass
class Treatment:
    ramp: str = "standard"
    composite: str = "background"
    opacity: Optional[float] = None


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
    asset: Optional[Asset] = None
    treatment: Optional[Treatment] = None
    template: Optional[Template] = None
    hold: Optional[Hold] = None
    transition: Optional[Transition] = None
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

# All Remotion template component names — keep in sync with FullEpisode TEMPLATE_COMPONENTS
ALL_TEMPLATES = [
    "TitleTransition", "KineticTypography", "DataChart", "TimelineComparison",
    "FrameworkDiagram", "ChoroplethMap", "RouteAnimation", "DecisionTree",
    "SplitComposition", "ProbabilityGauge", "ImageComposite", "PhotoMontage",
    "NetworkDiagram", "TimeSeriesChart", "SankeyFlow", "GameBoard",
    "BayesianUpdate", "StatReveal", "RadarChart", "AnnotatedImage",
    "EscalationLadder",
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


def parse_visual_spec(spec: str):
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

    return result


def parse_dir_lines(dir_lines: list[str]) -> dict:
    """
    Parse DIR: annotation lines into a direction dict for assembly manifest use.

    Only extracts hold(), cut(), and mood() — these affect timing and transitions.
    cam() and reveal() are consumed by Remotion templates via _direction in JSON
    data files, not by the assembly manifest.

    Returns dict with keys: holdAfter, holdBehavior, preDelay, transitionOut,
    transitionDuration, washColor, narrationGate, syncWords.
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

        elif dtype == "cut":
            # Parse cut() — affects transition out
            # Examples: cut(iris, origin:center, 0.6s), cut(color-wash, ink, 0.7s)
            tokens = [t.strip() for t in re.split(r",\s*", params_str)]

            # First token is always the transition type
            if tokens:
                cut_type = tokens[0].lower()
                if cut_type in VALID_CUT_TYPES:
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
            # Extract sync words for Whisper alignment
            sync_m = re.search(r'sync:\s*"([^"]+)"', params_str)
            if sync_m:
                result.setdefault("syncWords", []).append(sync_m.group(1))

        elif dtype == "reveal":
            # Extract sync words from reveal() too
            sync_m = re.search(r'sync:\s*"([^"]+)"', params_str)
            if sync_m:
                result.setdefault("syncWords", []).append(sync_m.group(1))

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
    in_table = False

    for line in lines:
        # Stop at ASSET SUMMARY — everything below is metadata, not narration
        if re.match(r"^##\s+ASSET\s+SUMMARY", line, re.IGNORECASE):
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
            in_table = False
            continue

        # Table header row
        if TABLE_ROW_RE.match(line):
            row_match = TABLE_ROW_RE.match(line)
            narr = row_match.group(1).strip()
            vis = row_match.group(2).strip()

            # Skip header rows
            if narr == "NARRATION" or narr.startswith("---"):
                in_table = True
                continue
            if narr.startswith("---"):
                continue

            # Check if this is a DIR: continuation line (empty narration, DIR: in visual)
            if not narr and vis.strip().startswith("DIR:"):
                # Attach to the previous row's direction lines
                if rows:
                    rows[-1].setdefault("dir_lines", []).append(vis.strip())
                continue

            parsed = parse_visual_spec(vis)

            rows.append({
                "beat": current_beat.id if current_beat else "opening",
                "narration": narr,
                "visual_raw": vis,
                "parsed": parsed,
                "dir_lines": [],
            })

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


def resolve_shot_id(search_terms: list[str], shot_ids: dict = None) -> Optional[str]:
    """Try to match search terms to a known shot list ID."""
    lookup = shot_ids or SILICON_TRAP_SHOT_IDS
    for term in search_terms:
        for key, sid in lookup.items():
            if key.lower() in term.lower():
                return sid
    return None


def resolve_data_file(component: str, search_terms: list[str], vis_raw: str, data_files: dict = None) -> Optional[str]:
    """Try to resolve which Remotion data file a template segment references."""
    vis_lower = vis_raw.lower()
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

    for keyword, data_file in heuristics:
        if keyword.lower() in vis_lower:
            return data_file

    return None


def apply_default_transitions(segments: list[dict]) -> list[dict]:
    """
    Apply context-aware transition defaults to segments.

    Transition design rules (Layer 3 — Cross-clip Pacing):

    1. BEAT BOUNDARIES: When consecutive segments belong to different beats,
       use dissolve (0.5s) to signal a structural shift. This is the most
       important transition — viewers unconsciously register beat changes
       through the visual rhythm shift.

    2. TITLE CARDS: TitleTransition segments (section headers, episode
       title, end card) always fade in/out (0.6s). They're structural
       punctuation, and a hard cut to a title card feels jarring.

    3. WITHIN A BEAT: Cuts are the default. Analytical content moves fast;
       dissolves within the same argument slow things down unnecessarily.

    4. FOOTAGE → TEMPLATE: When a background footage segment is followed
       by a foreground template, no transition needed (they're on different
       layers — the template overlays). But when a TEMPLATE is followed by
       another TEMPLATE in the same layer, use a brief dissolve (0.3s).

    5. HOLD SEGMENTS: No transition — they sustain the previous visual.
       A fade on a hold defeats its purpose.

    6. END CARD: The final segment (usually TitleTransition end-card)
       gets a fade-in (0.8s) for a cinematic close.
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

        # Rule 1: Beat boundaries → dissolve
        if beat_changed and not is_title and not (prev and prev.get("_dirTransitionOut")):
            trans_in = "dissolve"
            dur = 0.5

        # Rule 2: Title cards → fade
        if is_title:
            trans_in = "fade"
            trans_out = "fade"
            dur = 0.6

        # Rule 6: End card gets a longer fade-in
        if is_last and is_title:
            dur = 0.8

        # Rule 4: Template → Template (same layer) → brief dissolve
        if (
            prev_is_template
            and curr_is_template
            and not is_title
            and not beat_changed
        ):
            trans_in = "dissolve"
            dur = 0.3

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
    "EscalationLadder": ("tension-rise", "normal", None, None),
    "StrategicLandscape": ("beat-transition", "normal", None, None),
    "DuelingFrameworks": ("beat-transition", "normal", "tension-resolve", "normal"),
    "DualTimeline": ("beat-transition", "normal", None, None),
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

        # Apply entrance soundCue
        if entrance_type:
            seg["soundCue"] = {
                "type": entrance_type,
                "offsetSec": 0,
                "intensity": entrance_int,
            }

        # Apply key moment as secondary soundCue
        if key_type:
            offset = round(dur * 0.6, 1)  # key moment typically at ~60% of duration
            if entrance_type:
                seg["soundCueSecondary"] = {
                    "type": key_type,
                    "offsetSec": offset,
                    "intensity": key_int,
                }
            else:
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
) -> dict:
    """
    Build an assembly manifest in estimate mode from script parsing.

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

        # Parse direction annotations for this row
        direction = parse_dir_lines(dir_lines) if dir_lines else {}

        # Clean narration text for word-count estimation
        clean_narr = ""
        if narr.strip():
            clean_narr = re.sub(r"\*[^*]*\*", "", narr).strip()
            clean_narr = re.sub(r"\([^)]*\)", "", clean_narr).strip()

        # Determine row duration (how much the cursor advances)
        narr_dur = estimate_narration_duration(narr) if clean_narr else 0.0

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
            for i, (part_raw, ps) in enumerate(zip(vis_parts, part_specs)):
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
                # Stash direction transition on the last part of a THEN chain
                if is_last_part and direction.get("transitionOut"):
                    seg["_dirTransitionOut"] = direction["transitionOut"]
                    if direction.get("transitionDuration"):
                        seg["_dirTransitionDuration"] = direction["transitionDuration"]
                    if direction.get("washColor"):
                        seg["_dirWashColor"] = direction["washColor"]
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

            # Stash direction transition info for apply_default_transitions
            if direction.get("transitionOut"):
                seg["_dirTransitionOut"] = direction["transitionOut"]
            if direction.get("transitionDuration"):
                seg["_dirTransitionDuration"] = direction["transitionDuration"]
            if direction.get("washColor"):
                seg["_dirWashColor"] = direction["washColor"]

            segments.append(seg)

        # Advance cursor by row duration + holdAfter (direction extends segment
        # but also pushes all subsequent timing forward)
        hold_extra = direction.get("holdAfter", 0)
        cursor += row_dur + hold_extra

    # Apply default transitions based on context (direction overrides take priority)
    segments = apply_default_transitions(segments)

    # Clean up temporary direction keys used by transition logic
    for seg in segments:
        for key in ["_dirTransitionOut", "_dirTransitionDuration", "_dirWashColor"]:
            seg.pop(key, None)

    # Apply audio cues (L2 transition SFX + L3 texture hits) based on template type
    segments = apply_audio_cues(segments)

    # Compute total duration
    total_dur = max(s["endSec"] for s in segments) if segments else 0

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
    }

    return manifest


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
        if data_file:
            seg["template"]["dataFile"] = data_file

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
    except Exception as e:
        print(f"WARNING: SileroVAD not available ({e}). Skipping pause detection.")
        return []

    print(f"  Detecting pauses with SileroVAD...")
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
    except Exception:
        return 0.0


def transcribe_whisperx(audio_path: str, hf_token: Optional[str] = None) -> tuple[float, list[dict]]:
    """
    Run WhisperX on narration audio for phoneme-level word timestamps.

    WhisperX pipeline:
      1. Transcribe with Whisper (fast, but coarse timestamps)
      2. Force-align with wav2vec2 (phoneme-level precision, ±50ms)
      3. Return word-level timestamps

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

    # Step 1: Transcribe with Whisper (coarse timestamps)
    print(f"  Loading WhisperX model (base.en) on {device}...")
    model = whisperx.load_model("base.en", device, compute_type=compute_type)

    print(f"  Transcribing {audio_path}...")
    audio = whisperx.load_audio(audio_path)
    result = model.transcribe(audio, batch_size=16)

    # Step 2: Force-align with wav2vec2 (phoneme-level precision)
    print("  Running phoneme-level forced alignment...")
    align_model, metadata = whisperx.load_align_model(
        language_code="en", device=device
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
) -> Optional[float]:
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


def align_to_narration(manifest: dict, audio_path: str, hf_token: Optional[str] = None) -> dict:
    """
    Upgrade an estimate-mode manifest to precise mode by aligning
    segment boundaries to WhisperX word timestamps + SileroVAD pauses.

    Pipeline:
      1. Detect dramatic pauses with SileroVAD → insert HOLD segments
      2. Transcribe with WhisperX → phoneme-level word timestamps
      3. Fuzzy-match each segment's narrationRef to word stream → precise start times
      4. Re-sequence segments chronologically
    """
    # Step 1: Detect pauses
    pauses = detect_pauses(audio_path)

    # Step 2: Transcribe
    total_dur, words = transcribe_whisperx(audio_path, hf_token)

    # Update manifest metadata
    manifest["mode"] = "precise"
    manifest["narration"]["audioFile"] = str(Path(audio_path).name)
    manifest["narration"]["totalDurationSec"] = round(total_dur, 2)
    manifest["narration"]["words"] = words
    manifest["totalDurationSec"] = round(total_dur + 4, 2)  # +4s for end card

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

    # Re-sort segments by start time
    manifest["segments"].sort(key=lambda s: (s["startSec"], 0 if s["layer"] == "background" else 1))

    return manifest


# ── CLI ────────────────────────────────────────────────────────────────────

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

    args = parser.parse_args()

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
    manifest = build_estimate_manifest(
        args.script, args.episode, args.title,
        data_files=ep_data_files, shot_ids=ep_shot_ids,
    )
    print(f"  Found {len(manifest['beats'])} beats, {len(manifest['segments'])} segments")
    print(f"  Estimated duration: {manifest['totalDurationSec']:.1f}s ({manifest['totalDurationSec']/60:.1f} min)")

    # Upgrade to precise mode if audio provided
    if args.audio:
        print(f"\nAligning to narration audio: {args.audio}")
        print(f"  Pipeline: SileroVAD (pause detection) → WhisperX (transcription + alignment) → RapidFuzz (matching)")
        manifest = align_to_narration(manifest, args.audio, hf_token=args.hf_token)
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


if __name__ == "__main__":
    main()
