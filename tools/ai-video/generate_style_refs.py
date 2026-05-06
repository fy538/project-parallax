#!/usr/bin/env python3
"""
Parallax — AI Video Style Reference Generator

Generates the 15 canonical style reference images that define the "Parallax
AI-GEN look" via Flux 2 Pro on fal.ai. These references are used as style
anchors for Kling 3.0 / Seedance 2.0 / Sora 2 / Runway Gen-4 across all
episodes.

Updated May 4, 2026: switched from photoreal-mannequin reference library to
constructivist library matching the unified post-migration aesthetic. The
broadened constructivist anchor draws on the whole 20th-century editorial-
design family (Bauhaus, American mid-century modernism via Saul Bass / Push
Pin / Fortune magazine, British industrial modernism, Japanese Showa-era
graphic design, Soviet Constructivism, German political photomontage,
industrial woodcut tradition). Cultural specificity is supplied per scene by
the typography emphasis — see TYPOGRAPHY_TRADITIONS.md.

Library expanded May 4-5, 2026 from 7 → 11 → 15 references. The 15 cover
all major content types the channel will encounter in EP01-EP10:
  Phase 1 (refs 1-7): foundational anchors (face, cleanroom, atmospheric,
    domestic, historical, conceptual)
  Phase 2 (refs 8-11): broader-family cultural anchors (Bauhaus, American
    Modernist, Japanese Showa, Russian Constructivist canonical)
  Phase 3 (refs 12-15): coverage completion (Chinese traditional,
    adversarial war room, multi-figure boardroom, neutral channel default)

Note: Recraft V3 may produce stronger constructivist outputs than Flux 2 Pro
for some references, since Recraft has native vector_illustration / digital_
illustration styles calibrated for graphic illustration. Worth A/B testing
during Phase 1 generation. The fal.ai integration here remains as the primary
path for backward compatibility and for hero P1 references where photographic
spatial detail (realism: grounded) is desired.

Usage:
  # Generate all 15 references
  python generate_style_refs.py --all

  # Generate a specific reference by number (1-15)
  python generate_style_refs.py --ref 1

  # Generate a specific reference by name
  python generate_style_refs.py --ref constructivist-face

  # Re-generate with a modified prompt (iterating)
  python generate_style_refs.py --ref 1 --prompt "your custom prompt override"

  # List all references and their status
  python generate_style_refs.py --list

  # Run LUT test on all generated references
  python generate_style_refs.py --lut-test

  # Run LUT test on a specific reference
  python generate_style_refs.py --lut-test --ref 1

Environment variables:
  FAL_KEY  — API key from fal.ai (required)

Requires: pip install fal-client requests --break-system-packages

See: tools/ai-video/style-references/PROMPTS.md for full prompt details.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
from dataclasses import dataclass

# ── Paths ────────────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).resolve().parent
STYLE_REFS_DIR = SCRIPT_DIR / "style-references"
TREAT_VIDEO = SCRIPT_DIR.parent / "brand-treatment" / "treat_video.py"
TREAT_IMAGE = SCRIPT_DIR.parent / "brand-treatment" / "treat.py"

# ── Style Reference Definitions ──────────────────────────────────────────


@dataclass
class StyleRef:
    number: int
    name: str
    filename: str
    description: str
    prompt: str
    lut_primary: str  # Which LUT treatment this ref is designed for


_CONSTRUCTIVIST_ANCHOR = (
    "Editorial illustration in the Parallax 20th-century constructivist "
    "tradition — drawing on the broader graphic-design family that spans "
    "the Bauhaus design school (László Moholy-Nagy, Herbert Bayer), "
    "American mid-century editorial modernism (Saul Bass, Push Pin Studios, "
    "Charley Harper, Jim Flora, Paul Rand, Fortune magazine industrial-"
    "modernism), British industrial modernism (E. McKnight Kauffer, "
    "Edward Bawden), Japanese Showa-era graphic design (Yusaku Kamekura, "
    "Ikko Tanaka), Soviet Constructivism (Alexander Rodchenko, El Lissitzky), "
    "German political photomontage (John Heartfield), and 20th-century "
    "industrial woodcut tradition (Frans Masereel). The base aesthetic is "
    "the shared graphic discipline this family carries: bold compositional "
    "confidence, color-blocked forms with no soft shading or gradients, "
    "geometric clarity, restrained palette, editorial publication weight. "
    "Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D), "
    "umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46), "
    "and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors. "
    "Cultural specificity (Soviet Constructivist intensity, American "
    "mid-century restraint, Chinese vermillion, Japanese Showa minimalism, "
    "literati ink-wash) is supplied by the per-scene typography emphasis — "
    "this base provides the neutral 20th-century editorial-illustration "
    "grammar from which the cultural emphasis emerges. "
    "NOT photorealistic, NOT 3D render, NOT cool blue or teal, NOT Adobe "
    "stock aesthetic, NOT smooth featureless mannequin faces. "
)

# Updated May 4, 2026: replaced photoreal-mannequin reference library with
# the constructivist library matching the unified post-migration aesthetic.
# See PROMPT_PREAMBLES.md, AI_VIDEO_PIPELINE.md, VISUAL_LANGUAGE.md.
STYLE_REFS = [
    StyleRef(
        number=1,
        name="constructivist-face",
        filename="r1_constructivist_face.png",
        description="Planar-face study — locks the exact level of facial stylization for grounded scenes",
        lut_primary="standard",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "Close-up portrait of a figure rendered in the constructivist "
            "vocabulary. Face composed of geometric facets — jaw plane, "
            "cheekbone plane, brow plane — suggesting facial structure "
            "without realistic detail. Eyes obscured by lens shadow from "
            "round eyeglasses or by hair fall — never smooth blank surfaces. "
            "Hair simplified to color-blocked shapes. Crisp white shirt "
            "collar visible at the bottom of frame, color-blocked with no "
            "fabric texture. Subtle ambient backlight rim defining the "
            "head's silhouette against a neutral umber background. Mood: "
            "contemplative, intellectually rigorous. 16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=2,
        name="cleanroom-flat",
        filename="r2_cleanroom_flat.png",
        description="Flat constructivist cleanroom — monumentalist propaganda-poster aesthetic at maximum graphic flatness",
        lut_primary="standard",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "Interior of a semiconductor fabrication cleanroom rendered in "
            "flat constructivist composition. Three workers in white bunny "
            "suits with reflective polycarbonate face shields, faces composed "
            "of geometric facets behind the visors, eyes obscured by amber "
            "visor reflection. FOUP wafer carriers in foreground rendered as "
            "color-blocked geometric forms. Stacked machinery in background, "
            "monumentalist scale, low horizon line. Bold heiti propaganda "
            "typography integrated diagonally: '微米 — 我们的力量' (Micron "
            "— Our Strength) in red, '工业 · 精度 · 技术' (Industry · "
            "Precision · Technology) in stacked black/red blocks. Maximum "
            "graphic flatness, no photographic texture, all surfaces "
            "suggested through palette planes. 16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=3,
        name="cleanroom-grounded",
        filename="r3_cleanroom_grounded.png",
        description="Grounded constructivist cleanroom — same scene with photographic spatial detail for you-are-here presence",
        lut_primary="standard",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "Interior of a semiconductor fabrication cleanroom rendered in "
            "grounded constructivist composition: planar figures with "
            "facial facets and visor-obscured eyes, but environments "
            "rendered with more photographic spatial detail (atmospheric "
            "perspective, material texture on FOUP carriers and machinery, "
            "subtle floor reflections). Three workers in bunny suits "
            "operating wafer-handling equipment, medium shot from hip "
            "level, deeper spatial recession into background. Bold heiti "
            "propaganda typography in red and gold integrated with "
            "machinery. Constructivist DNA preserved — color-blocked "
            "figures, restricted palette, graphic composition — but more "
            "spatial depth and material grounding than the flat variant. "
            "16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=4,
        name="atmospheric-trap",
        filename="r4_atmospheric_trap.png",
        description="Atmospheric backdrop — system-mood, civilizational scale, used at low opacity behind narration",
        lut_primary="standard",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "An interlocking industrial trap viewed from a low monumentalist "
            "angle: massive factory complexes connected by tangled cable "
            "bundles and pipe networks forming a closing net. Smaller "
            "silhouetted figures inside the structure, dwarfed by scale. "
            "Smokestacks belching ribbons of smoke that twist into the "
            "cable network above. Heavy contrast between deep ink-black "
            "machinery and burnt amber accents on smoke and pipes. Bold "
            "geometric forms, color-blocked, no shading. Composition reads "
            "as background — figures are not the subject, the system is. "
            "Mood: civilizational stakes, technological dread, industrial "
            "ambition. 16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=5,
        name="domestic-intimate",
        filename="r5_domestic_intimate.png",
        description="Intimate domestic scene — locks the constructivist aesthetic at conversational human scale (Beijing apartment, 1980s)",
        lut_primary="standard",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "Eye-level intimate scene in a 1980s Beijing apartment. A figure "
            "in a dark wool suit and round eyeglasses seated at a small "
            "wooden writing desk, reading a document under the warm amber "
            "light of an Anglepoise-style desk lamp. Face rendered with "
            "constructivist planar facets — jaw plane, cheekbone plane — "
            "eyes obscured by the round lens shadow of the glasses. A "
            "traditional Chinese-style teacup with botanical motif on the "
            "desk. Books stacked nearby, a fountain pen on an open notebook. "
            "Window showing dark Beijing rooftop silhouettes. Wall calendar "
            "with subtle Chinese signage ('北京日报', '一九八四年三月', "
            "small scale, period-natural — chinese_minimal typography "
            "treatment). Small framed photograph of Tiananmen on the wall. "
            "Bookshelf in background. Restrained scale, contemplative "
            "composition, NOT propaganda-poster monumentalist — this is "
            "the constructivist tradition turned inward. 16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=6,
        name="historical-modernist",
        filename="r6_historical_modernist.png",
        description="Historical reconstruction — 1941 American government office with English Modernist typography, editorial LUT target",
        lut_primary="editorial",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "1941 American government office reconstruction. A figure in a "
            "double-breasted dark wool suit seated at a heavy wooden desk, "
            "hand poised over an executive order document. Face rendered "
            "with constructivist planar facets, eyes obscured by hat brim "
            "or downturned head. Dark wood paneling, brass desk lamp "
            "casting warm pool of light, side window with low-angle "
            "warm tungsten light streaming in, period-accurate fountain pen "
            "and stacked papers. Other suited figures standing at the edge "
            "of frame, faces equally simplified. American midcentury "
            "modernist typography integrated: 'INDUSTRY · INNOVATION · "
            "ENTERPRISE' or 'THE AMERICAN CENTURY' in geometric sans-serif "
            "(Push Pin / Saul Bass / Fortune-magazine modernism), bold "
            "color blocks. Slightly desaturated palette suggesting "
            "Kodachrome-era film. Mood: civilizational stakes, historical "
            "gravity, American mid-century industrial confidence. Grounded "
            "realism dosage. 16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=7,
        name="conceptual-corridor",
        filename="r7_conceptual_corridor.png",
        description="Conceptual corridor — physical metaphor for bifurcation, atmospheric backdrop usage",
        lut_primary="standard",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "A long industrial corridor that physically splits into two "
            "diverging paths ahead, rendered in flat constructivist "
            "composition. The left path is bathed in warm amber/gold and "
            "shows collaborative geometric forms (shared tables, "
            "interconnected machinery) through stylized glass walls. The "
            "right path is bathed in deep rust/ink and shows isolated "
            "workstations separated by hard-edged barriers. At the split "
            "point, a single figure stands in dark wool suit with planar "
            "constructivist face, eyes obscured by hat brim — the figure "
            "is in mid-stride, not gestural. Polished floor with directional "
            "expansion joints converging to vanishing point at the corridor "
            "split. One-point perspective, deep one-point composition. Bold "
            "color-blocked forms, no soft shading. Mood: structural choice, "
            "civilizational bifurcation, the moment before commitment. 16:9 "
            "aspect ratio."
        ),
    ),
    # ── Broader 20th-century constructivist family references (May 4) ──
    # Added during the May 4 risk-mitigation calibration. The first 7
    # references skewed toward Soviet/Chinese cultural emphasis; these 4
    # canonicalize the American/Bauhaus/Japanese/British modernist branches
    # of the broader 20th-century editorial-illustration family. The
    # CONSTRUCTIVIST_BASE_PREAMBLE in tools/recraft/recraft.py was broadened
    # at the same time so the channel default reads as "20th-century
    # editorial design tradition" rather than "Soviet propaganda."
    StyleRef(
        number=8,
        name="bauhaus-educational",
        filename="r8_bauhaus_educational.png",
        description="Bauhaus educational discipline — Moholy-Nagy / Bayer compositional rigor, framework/educational scenes",
        lut_primary="standard",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "Bauhaus educational scene in the visual tradition of László "
            "Moholy-Nagy and Herbert Bayer. A 1930s design studio interior: "
            "two figures at large drafting tables examining geometric design "
            "exercises. Faces composed of 4-5 color-blocked planes, eyes "
            "obscured by lowered head reading or by round wire-rim glasses "
            "casting shadow. Hands as flat color planes holding drafting "
            "tools. Walls feature pinned geometric studies in primary "
            "color-blocks (red, yellow, blue rendered as walnut/gold/umber "
            "in the Parallax warm-palette translation), grid systems, "
            "typographic exercises. Restrained Bauhaus-tradition palette "
            "PALETTE EMPHASIS: walnut (#5C4A3D), umber (#8B7355), gold "
            "(#C4A747), bone (#F0E6D0), paper (#F5F0E8) — restrained "
            "educational discipline, NOT propaganda intensity. COMPOSITIONAL "
            "EMPHASIS: orthogonal grid alignment, balanced asymmetric layout, "
            "deliberate negative space, hierarchy through size and placement. "
            "Mood: design-school discipline, geometric universalism, "
            "20th-century European modernism. 16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=9,
        name="american-modernist-fortune",
        filename="r9_american_modernist_fortune.png",
        description="American mid-century editorial — Fortune magazine industrial-modernism, Saul Bass / Push Pin discipline",
        lut_primary="standard",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "American mid-century editorial illustration in the tradition "
            "of Fortune magazine industrial-modernism (1950s-60s), Saul "
            "Bass title-sequence aesthetic, Push Pin Studios layout "
            "discipline, Charley Harper geometric wildlife illustration, "
            "Jim Flora RCA covers. A 1958 Detroit auto plant or American "
            "industrial-corporate scene: three figures in business attire "
            "(suits, ties, white shirts) gathered around a planning table "
            "with industrial blueprints. Faces composed of color-blocked "
            "planes, eyes obscured by hair fall or downturned head. PALETTE "
            "EMPHASIS: walnut, umber, gold, bone, paper — softer mid-century "
            "American optimism palette with rust as SINGLE sparing accent "
            "only (never dominant). NOT Soviet revolutionary red. "
            "COMPOSITIONAL EMPHASIS: balanced asymmetric editorial layout, "
            "deliberate white-space discipline, hierarchy through size and "
            "weight rather than color saturation, NOT diagonal monumentalist "
            "Soviet axis. Mood: American mid-century industrial optimism, "
            "post-war corporate confidence, magazine-spread quality. "
            "Typography integrated as Push Pin / Bass geometric sans-serif "
            "block lettering: 'INDUSTRY · INNOVATION · ENTERPRISE' or "
            "'PROGRESS' in walnut and gold. 16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=10,
        name="japanese-showa-modernist",
        filename="r10_japanese_showa.png",
        description="Japanese Showa-era post-war graphic design — Kamekura / Tanaka discipline, NOT pre-war propaganda",
        lut_primary="editorial",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "Japanese Showa-era post-war graphic design in the tradition of "
            "Yusaku Kamekura (1964 Tokyo Olympics identity), Ikko Tanaka, "
            "Tadanori Yokoo. A 1964 Japanese industrial-modernist scene: "
            "two figures in business attire at a Tokyo office overlooking "
            "the city skyline at dusk. Faces composed of color-blocked "
            "planes, eyes obscured by lowered head reading. PALETTE EMPHASIS: "
            "extremely minimal — black/deep ink, single bold red (Japanese "
            "red, slightly orange-leaning), cream/bone, paper. Often just "
            "2-3 colors total. NOT Soviet rust dominance. COMPOSITIONAL "
            "EMPHASIS: vertical orientation strongly preferred, geometric "
            "discipline, bold kanji typography integration ('技術 · 産業 · "
            "進歩' — Technology · Industry · Progress). Real Japanese, not "
            "mock-script. Restrained scale, intentional negative space, "
            "Showa-era post-war modernist confidence (NOT pre-1945 imperial "
            "propaganda — this is the post-war reconstruction Japan that "
            "became the Olympics-era / industrial-rise visual tradition). "
            "16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=11,
        name="russian-constructivist-canonical",
        filename="r11_russian_constructivist.png",
        description="Soviet Constructivist canonical reference — Rodchenko/Klutsis intensity, deployed only when content explicitly engages Soviet state power",
        lut_primary="conflict",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "Soviet Constructivist propaganda in the canonical Rodchenko / "
            "Klutsis / Lissitzky tradition. A 1930 Soviet industrial scene: "
            "three workers in dark blue overalls and protective goggles "
            "operating massive machinery. Faces composed of color-blocked "
            "planes, eyes obscured by goggle shadow. PALETTE EMPHASIS: full "
            "saturated revolutionary palette — heavy red (rust dominant), "
            "gold accents, deep ink structural elements, bone highlights. "
            "Revolutionary intensity is the goal here. COMPOSITIONAL EMPHASIS: "
            "diagonal compositional axis (signature Soviet Constructivist "
            "move), monumentalist scale, low horizon line, propaganda-poster "
            "dynamism. Bold Russian Cyrillic typography: 'ИНДУСТРИАЛИЗАЦИЯ' "
            "(Industrialization), 'ПЯТИЛЕТКА В ЧЕТЫРЕ ГОДА' (Five-Year Plan "
            "in Four Years), 'ПОБЕДА' (Victory) — real Russian, not mock-"
            "script. Mood: Soviet revolutionary mobilization, full agitprop "
            "intensity. EDITORIAL NOTE: this reference exists for episodes "
            "that explicitly cover Soviet-bloc state-power content. The "
            "channel deploys this aesthetic deliberately and analytically, "
            "not as default. 16:9 aspect ratio."
        ),
    ),
    # ── Coverage-completion references (May 4 calibration round 3) ──
    # Added so the canonical library covers all major content types the
    # channel will encounter in EP01-EP10 — chinese_traditional, non-Soviet
    # adversarial scenes, multi-figure group dynamics, and the neutral
    # channel-default visual identity. After this addition the library is
    # complete for foreseeable production demand.
    StyleRef(
        number=12,
        name="chinese-traditional-scholar",
        filename="r12_chinese_traditional.png",
        description="Pre-revolutionary Chinese / classical scholarly content — literati ink-wash discipline, scrolls, contemplative restraint",
        lut_primary="standard",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "A 1923 Shanghai scholar's study, intimate eye-level composition. "
            "A figure in traditional changshan robe seated at a low wooden "
            "desk, brush in hand, pausing over a long calligraphy scroll. "
            "Face composed of 4-5 distinct color-blocked planes (jaw, "
            "cheekbone, brow, lit, neck), no continuous skin tonality, no "
            "rendered facial features. Eyes obscured by lowered head "
            "reading position and round wire-rim eyeglasses casting shadow. "
            "Hands as flat color planes holding the brush. Wooden desk with "
            "stacked classical texts, small inkstone, teacup with botanical "
            "motif. Behind: hanging scroll with vertical Traditional Chinese "
            "calligraphy ('學而時習之' or similar real classical Chinese "
            "phrase) in brush-ink style on bone background. Window showing "
            "Shanghai rooftops at dusk as flat ink silhouettes. "
            "PALETTE EMPHASIS: ink wash dominant — deep ink (#1C1814) on "
            "paper (#F5F0E8) background, walnut and umber as material-"
            "grounding neutrals, sparse rust (#A64D46) only as red seal "
            "accent on the scroll or signature stamp. NOT propaganda "
            "intensity; literati restraint. "
            "COMPOSITIONAL EMPHASIS: vertical orientation (text columns "
            "right-to-left), restrained scale, contemplative composition, "
            "extensive negative space as deliberate aesthetic choice. "
            "Classical scholar's-study aesthetic, not industrial-modernist. "
            "Mood: scholarly contemplation, classical Chinese intellectual "
            "tradition, pre-revolutionary intellectual gravity. Realism: "
            "balanced (figure stays planar-constructivist, environment has "
            "subtle paper grain and material texture on books and scroll). "
            "16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=13,
        name="adversarial-warroom",
        filename="r13_adversarial_warroom.png",
        description="Non-Soviet adversarial scene — military command center / intelligence operations, conflict-treatment palette without Soviet revolutionary coding",
        lut_primary="conflict",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "Interior of a contemporary American military strategic "
            "operations center, dark and tense. Five figures in tactical "
            "uniforms gathered around a central display table — two seated "
            "examining maps, two standing in discussion, one pointing at a "
            "screen on the back wall. Faces composed of 4-5 distinct color-"
            "blocked planes, eyes obscured by helmet brim shadow or hat "
            "brim shadow. Hands as flat color planes pointing or holding "
            "documents. Multiple display screens in background showing "
            "radar, maps, and stylized data graphics — flat ink-and-rust "
            "panels. Composition shows clear group dynamic with lines of "
            "attention between figures. "
            "PALETTE EMPHASIS: conflict treatment palette — heavy contrast "
            "deep ink (#1C1814) shadows, oxblood (#7A2E1A) and rust "
            "(#A64D46) accents from displays, bone (#F0E6D0) highlights. "
            "Cool-blue display glow at secondary level only (NOT dominant; "
            "this is conflict-treatment, not generic-military-blue). "
            "Adversarial-American visual rhetoric, NOT Soviet revolutionary "
            "palette. "
            "COMPOSITIONAL EMPHASIS: balanced asymmetric editorial layout "
            "(Push Pin / Saul Bass discipline applied to military scene). "
            "Tension through deep shadow and rim-light isolation, NOT "
            "through Soviet diagonal monumentalist axis. Composition feels "
            "intentional and architectural. "
            "Mood: tension, contained adversarial weight, contemporary "
            "American military intelligence operations. NOT Cold War Soviet "
            "rocket factory. Realism: balanced. 16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=14,
        name="multi-figure-boardroom",
        filename="r14_multifigure_boardroom.png",
        description="Multi-figure group dynamics — diplomatic summit / corporate negotiation / panel discussion at 4-6 figure scale",
        lut_primary="standard",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "A 2026 international trade negotiation in a wood-paneled "
            "conference room with warm tungsten lighting from a side "
            "window. Six figures in business attire seated around a large "
            "rectangular conference table, mid-discussion. Two figures "
            "gesturing across the table; one figure referring to documents; "
            "one figure typing on a laptop; two figures in side-"
            "conversation. Faces composed of 4-5 distinct color-blocked "
            "planes, eyes obscured by hair fall, lowered head, or hand-"
            "raised gesture. Hands as flat color planes (palm + finger "
            "silhouette only, no individual finger detail) holding pens, "
            "pointing, or resting on documents. The composition reads as "
            "6-figure group dynamic with lines of attention establishing "
            "who's engaged with whom. "
            "PALETTE EMPHASIS: American mid-century editorial restraint — "
            "walnut (#5C4A3D), umber (#8B7355), gold (#C4A747), bone "
            "(#F0E6D0), paper (#F5F0E8). Rust as single sparing accent "
            "(one document folder, one chair, one tie). NOT Soviet "
            "revolutionary intensity. Saul Bass / Push Pin / Fortune-"
            "magazine palette discipline. "
            "COMPOSITIONAL EMPHASIS: balanced asymmetric editorial layout, "
            "Push Pin Studios' deliberate white-space discipline. The 6 "
            "figures arranged so that lines of attention between them are "
            "readable; NOT symmetric centered layout (PowerPoint-coded), "
            "NOT diagonal monumentalist (Soviet-coded). Editorial-magazine "
            "spread quality. "
            "Mood: contemporary diplomatic / corporate institutional "
            "discussion, intentional and architectural. Realism: balanced "
            "(figures flat, environment has selective material texture on "
            "wood paneling and documents). 16:9 aspect ratio."
        ),
    ),
    StyleRef(
        number=15,
        name="neutral-channel-default",
        filename="r15_neutral_default.png",
        description="Channel's neutral default visual identity — soft American-Modernist palette with no specific cultural geography. Used for channel art, banner, default thumbnails, framework episodes",
        lut_primary="standard",
        prompt=(
            _CONSTRUCTIVIST_ANCHOR +
            "A neutral atmospheric backdrop scene establishing the Parallax "
            "channel's default visual identity. Abstract industrial-"
            "modernist landscape: layered geometric forms suggesting "
            "infrastructure (architectural silhouettes, transportation "
            "corridors, network connections) at distance, no specific "
            "cultural geography or named location. No human figures. "
            "PALETTE EMPHASIS: the channel's softest American-Modernist-"
            "leaning default — walnut (#5C4A3D), umber (#8B7355), gold "
            "(#C4A747), bone (#F0E6D0), paper (#F5F0E8) — with rust "
            "(#A64D46) only as a single sparing accent on one element "
            "(a transportation line, a sun glint, a building edge). NOT "
            "Soviet revolutionary palette dominance. This is the channel's "
            "neutral default — Saul Bass / Push Pin / Charley Harper "
            "restraint applied to abstract infrastructure. "
            "COMPOSITIONAL EMPHASIS: balanced asymmetric editorial layout, "
            "deliberate negative space, hierarchy through size and weight "
            "rather than color saturation. Push Pin Studios / Eames-era "
            "flat-modernist grid discipline. NOT diagonal monumentalist "
            "Soviet axis. "
            "Mood: contemporary American mid-century editorial design "
            "optimism, intentional, architectural. The channel's default "
            "visual register when no specific cultural geography applies. "
            "Used for: channel art, banner imagery, default thumbnail "
            "style, episodes covering abstract topics or philosophical "
            "frameworks without strong geographic specificity. Realism: "
            "flat (atmospheric backdrop usage; full graphic flatness for "
            "monumentalist editorial composition). 16:9 aspect ratio."
        ),
    ),
]

# Index by name for CLI lookup
REFS_BY_NAME = {r.name: r for r in STYLE_REFS}
REFS_BY_NUMBER = {r.number: r for r in STYLE_REFS}

# Recommended generation order (face first, then scale test, then contexts)
GENERATION_ORDER = [
    # Phase 1 — foundational anchors (face standard, intimate domestic, industrial)
    1, 5, 2, 3, 4, 6, 7,
    # Phase 2 — broader 20th-century constructivist family (May 4 calibration)
    8, 9, 10, 11,
    # Phase 3 — coverage completion (May 4 calibration round 3)
    15, 12, 13, 14,
]


# ── fal.ai Generation ───────────────────────────────────────────────────


def generate_image(prompt: str, api_key: str, width: int = 1920, height: int = 1080) -> str:
    """
    Generate an image via Flux 2 Pro on fal.ai.
    Returns the URL of the generated image.
    """
    try:
        import fal_client
    except ImportError:
        # Fall back to requests-based approach
        return _generate_via_requests(prompt, api_key, width, height)

    # Set API key
    os.environ["FAL_KEY"] = api_key

    print("  Submitting to Flux 2 Pro via fal.ai...")
    result = fal_client.subscribe(
        "fal-ai/flux-pro/v1.1",
        arguments={
            "prompt": prompt,
            "image_size": {"width": width, "height": height},
            "num_images": 1,
            "safety_tolerance": "5",  # Most permissive — kept for backward compat; constructivist illustrations rarely trip filters
        },
        with_logs=False,
    )

    if "images" in result and len(result["images"]) > 0:
        return result["images"][0]["url"]
    else:
        raise RuntimeError(f"No images returned. Response: {json.dumps(result, indent=2)}")


def _generate_via_requests(prompt: str, api_key: str, width: int, height: int) -> str:
    """Fallback: use requests directly against fal.ai REST API."""
    import requests

    url = "https://queue.fal.run/fal-ai/flux-pro/v1.1"
    headers = {
        "Authorization": f"Key {api_key}",
        "Content-Type": "application/json",
    }
    payload = {
        "prompt": prompt,
        "image_size": {"width": width, "height": height},
        "num_images": 1,
        "safety_tolerance": "5",
    }

    print("  Submitting to Flux 2 Pro via fal.ai (REST)...")
    resp = requests.post(url, headers=headers, json=payload)

    if resp.status_code == 200:
        data = resp.json()
        if "images" in data and len(data["images"]) > 0:
            return data["images"][0]["url"]
        # Queue mode — need to poll
        if "request_id" in data:
            return _poll_queue(data["request_id"], api_key)
        raise RuntimeError(f"Unexpected response: {json.dumps(data, indent=2)}")
    elif resp.status_code == 202:
        # Queued — poll for result
        data = resp.json()
        if "request_id" in data:
            return _poll_queue(data["request_id"], api_key)
        raise RuntimeError(f"Queued but no request_id: {resp.text}")
    else:
        raise RuntimeError(f"fal.ai error {resp.status_code}: {resp.text}")


def _poll_queue(request_id: str, api_key: str) -> str:
    """Poll fal.ai queue until the image is ready."""
    import requests

    status_url = f"https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/{request_id}/status"
    result_url = f"https://queue.fal.run/fal-ai/flux-pro/v1.1/requests/{request_id}"
    headers = {"Authorization": f"Key {api_key}"}

    print("  Queued. Polling for result", end="", flush=True)
    for _ in range(120):  # Up to 2 minutes
        time.sleep(2)
        print(".", end="", flush=True)

        resp = requests.get(status_url, headers=headers)
        if resp.status_code != 200:
            continue

        data = resp.json()
        status = data.get("status")

        if status == "COMPLETED":
            print(" done!")
            resp2 = requests.get(result_url, headers=headers)
            result = resp2.json()
            if "images" in result and len(result["images"]) > 0:
                return result["images"][0]["url"]
            raise RuntimeError(f"Completed but no images: {json.dumps(result, indent=2)}")
        elif status == "FAILED":
            print(" FAILED!")
            raise RuntimeError(f"Generation failed: {json.dumps(data, indent=2)}")

    raise RuntimeError("Timed out waiting for generation (2 minutes)")


def download_image(url: str, output_path: Path) -> None:
    """Download an image from URL to local path."""
    import requests

    print(f"  Downloading to {output_path.name}...")
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_bytes(resp.content)
    size_kb = len(resp.content) / 1024
    print(f"  Saved: {output_path} ({size_kb:.0f} KB)")


# ── LUT Testing ──────────────────────────────────────────────────────────


def run_lut_test(ref: StyleRef, style_refs_dir: Path) -> dict:
    """
    Run a style reference through all 3 LUT treatments.
    Returns dict with paths to treated images.
    """
    import subprocess

    input_path = style_refs_dir / ref.filename
    if not input_path.exists():
        print(f"  SKIP: {ref.filename} not found (generate first)")
        return {}

    treatments = ["standard", "conflict", "editorial"]
    results = {}

    for treatment in treatments:
        stem = input_path.stem
        output_path = style_refs_dir / f"{stem}_{treatment}.png"
        print(f"  Testing {treatment} LUT on {ref.name}...")

        # Try treat_video.py first (handles video AND stills)
        cmd = [
            sys.executable,
            str(TREAT_VIDEO),
            "--input", str(input_path),
            "--treatment", treatment,
            "--output", str(output_path),
        ]

        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                results[treatment] = str(output_path)
                print(f"    ✓ {output_path.name}")
            else:
                # Fall back to treat.py (image-only treatment)
                cmd_img = [
                    sys.executable,
                    str(TREAT_IMAGE),
                    "--input", str(input_path),
                    "--ramp", treatment,
                    "--output", str(output_path),
                ]
                result2 = subprocess.run(
                    cmd_img, capture_output=True, text=True, timeout=30
                )
                if result2.returncode == 0:
                    results[treatment] = str(output_path)
                    print(f"    ✓ {output_path.name} (via treat.py)")
                else:
                    print(f"    ✗ Failed: {result2.stderr[:200]}")
        except subprocess.TimeoutExpired:
            print(f"    ✗ Timed out")
        except FileNotFoundError:
            print(f"    ✗ Treatment tool not found at {TREAT_VIDEO}")
            break

    return results


# ── CLI ──────────────────────────────────────────────────────────────────


def resolve_ref(ref_arg: str) -> StyleRef:
    """Resolve a reference by number or name."""
    # Try as number
    try:
        num = int(ref_arg)
        if num in REFS_BY_NUMBER:
            return REFS_BY_NUMBER[num]
        print(f"Error: Reference number {num} not found (valid: 1-7)")
        sys.exit(1)
    except ValueError:
        pass

    # Try as name
    if ref_arg in REFS_BY_NAME:
        return REFS_BY_NAME[ref_arg]

    # Try partial match
    matches = [r for r in STYLE_REFS if ref_arg.lower() in r.name.lower()]
    if len(matches) == 1:
        return matches[0]
    elif len(matches) > 1:
        print(f"Ambiguous name '{ref_arg}'. Matches: {', '.join(m.name for m in matches)}")
        sys.exit(1)

    print(f"Error: Reference '{ref_arg}' not found.")
    print("Available: " + ", ".join(f"{r.number}={r.name}" for r in STYLE_REFS))
    sys.exit(1)


def cmd_list(args):
    """List all style references and their generation status."""
    print("\n  Parallax AI Video Style Reference Library")
    print("  " + "=" * 50)
    print(f"  Output directory: {STYLE_REFS_DIR}\n")

    for ref in STYLE_REFS:
        path = STYLE_REFS_DIR / ref.filename
        exists = path.exists()
        status = "✓ generated" if exists else "○ pending"
        size = f" ({path.stat().st_size / 1024:.0f} KB)" if exists else ""
        order_idx = GENERATION_ORDER.index(ref.number) + 1

        print(f"  [{ref.number}] {ref.name}")
        print(f"      {ref.description}")
        print(f"      File: {ref.filename}")
        print(f"      Status: {status}{size}")
        print(f"      Primary LUT: {ref.lut_primary}")
        print(f"      Generation order: {order_idx}/7")

        # Check for treated versions
        treated = []
        for t in ["standard", "conflict", "editorial"]:
            treated_path = STYLE_REFS_DIR / f"{path.stem}_{t}.png"
            if treated_path.exists():
                treated.append(t)
        if treated:
            print(f"      LUT tested: {', '.join(treated)}")
        print()


def cmd_generate(args):
    """Generate one or all style references."""
    api_key = args.api_key or os.environ.get("FAL_KEY")
    if not api_key:
        print("Error: FAL_KEY environment variable or --api-key required.")
        print("Get one at: https://fal.ai/dashboard/keys")
        sys.exit(1)

    if args.all:
        refs = [REFS_BY_NUMBER[n] for n in GENERATION_ORDER]
        print(f"\nGenerating all 7 style references in recommended order...")
        print(f"Estimated cost: ~$0.32 (7 × $0.045)\n")
    else:
        ref = resolve_ref(args.ref)
        refs = [ref]

    for ref in refs:
        output_path = STYLE_REFS_DIR / ref.filename
        prompt = args.prompt if args.prompt else ref.prompt

        if output_path.exists() and not args.force:
            print(f"\n[{ref.number}] {ref.name} — already exists. Use --force to regenerate.")
            continue

        print(f"\n[{ref.number}] {ref.name}")
        print(f"  {ref.description}")
        print(f"  Prompt: {prompt[:100]}...")

        try:
            url = generate_image(prompt, api_key)
            download_image(url, output_path)

            # Auto LUT-test if requested
            if args.lut_test:
                run_lut_test(ref, STYLE_REFS_DIR)

        except Exception as e:
            print(f"  ERROR: {e}")
            if not args.all:
                sys.exit(1)
            print("  Continuing with next reference...")

    print("\nDone!")
    generated = [r for r in STYLE_REFS if (STYLE_REFS_DIR / r.filename).exists()]
    print(f"Library status: {len(generated)}/7 references generated.")


def cmd_lut_test(args):
    """Run LUT tests on generated references."""
    if args.ref:
        ref = resolve_ref(args.ref)
        refs = [ref]
    else:
        refs = STYLE_REFS

    print("\nRunning LUT treatment tests...")
    results = {}

    for ref in refs:
        path = STYLE_REFS_DIR / ref.filename
        if not path.exists():
            print(f"\n[{ref.number}] {ref.name} — not generated yet, skipping")
            continue

        print(f"\n[{ref.number}] {ref.name}")
        ref_results = run_lut_test(ref, STYLE_REFS_DIR)
        results[ref.name] = ref_results

    print("\n\nLUT Test Summary:")
    print("-" * 50)
    for ref in refs:
        path = STYLE_REFS_DIR / ref.filename
        if not path.exists():
            print(f"  [{ref.number}] {ref.name}: NOT GENERATED")
            continue

        r = results.get(ref.name, {})
        statuses = []
        for t in ["standard", "conflict", "editorial"]:
            marker = "★" if t == ref.lut_primary else " "
            status = "✓" if t in r else "✗"
            statuses.append(f"{marker}{t}={status}")
        print(f"  [{ref.number}] {ref.name}: {' | '.join(statuses)}")
    print("\n  ★ = primary treatment for this reference")


def main():
    parser = argparse.ArgumentParser(
        description="Parallax AI Video Style Reference Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="See tools/ai-video/style-references/PROMPTS.md for full details.",
    )
    sub = parser.add_subparsers(dest="command")

    # List
    list_p = sub.add_parser("list", help="List all references and status")
    list_p.set_defaults(func=cmd_list)

    # Generate
    gen_p = sub.add_parser("generate", help="Generate style reference(s)")
    gen_ref = gen_p.add_mutually_exclusive_group(required=True)
    gen_ref.add_argument("--all", action="store_true", help="Generate all 7 references")
    gen_ref.add_argument("--ref", type=str, help="Reference number (1-7) or name")
    gen_p.add_argument("--prompt", type=str, help="Override prompt (for iteration)")
    gen_p.add_argument("--force", action="store_true", help="Regenerate even if exists")
    gen_p.add_argument("--api-key", type=str, help="fal.ai API key (or set FAL_KEY env)")
    gen_p.add_argument("--lut-test", action="store_true", help="Run LUT test after generation")
    gen_p.set_defaults(func=cmd_generate)

    # LUT test
    lut_p = sub.add_parser("lut-test", help="Run LUT treatment tests")
    lut_p.add_argument("--ref", type=str, help="Test specific reference (number or name)")
    lut_p.set_defaults(func=cmd_lut_test)

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(0)

    args.func(args)


if __name__ == "__main__":
    main()
