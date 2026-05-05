#!/usr/bin/env python3
"""
Parallax Recraft Generation Tool

Generates production-quality illustrations and photoreal images via the Recraft V3
API, with brand-locked prompt preambles per visual register.

Two-stage brand unification:
  1. Prompt-level (this tool's --register flag) — bakes brand palette,
     composition, mood, and negative prompts into every generation.
  2. Treatment-level (treat.py / treat_video.py) — duotone LUT + grain pass
     applied to the output.

Both stages together produce naturalistic, on-brand outputs. Either stage alone
is weaker. See PROMPT_PREAMBLES.md for design rationale.

Usage:
  # Atmospheric backdrop (Register 2 — system-mood, low-opacity background)
  python recraft.py generate "industrial factory complex with smokestacks" \\
      --register atmospheric --realism flat -o factory.svg

  # Grounding scene with Chinese propaganda typography (Register 3, default realism)
  python recraft.py generate "semiconductor cleanroom with workers in bunny suits" \\
      --register grounding --text-treatment chinese_propaganda -o cleanroom.svg

  # Intimate domestic scene with subtle Chinese signage
  python recraft.py generate "scholar reading at desk in 1980s Beijing apartment" \\
      --register grounding --realism balanced --text-treatment chinese_minimal \\
      -o beijing_scholar.svg

  # 1941 historical reconstruction with English modernist typography
  python recraft.py generate "presidential office Oval signing executive order" \\
      --register grounding --realism grounded --text-treatment english_modernist \\
      -o oval_office_1941.svg

  # Analytical register (rare — for diagrammatic illustrations not coded in Remotion)
  python recraft.py generate "supply chain network nodes" \\
      --register analytical -o network.svg

  # Generate with a specific Recraft style override
  python recraft.py generate "chip schematic" --style vector_illustration -o chip.svg

  # Generate and apply brand duotone treatment (SVG only — use treat.py for raster)
  python recraft.py generate "strategic game board" --register atmospheric \\
      --treat standard -o board.svg

  # Batch generate from a shot list JSON (per-shot 'register' field supported)
  python recraft.py batch shot-list.json --output assets/ --treat standard

  # Batch with a default register for shots that don't specify one
  python recraft.py batch shot-list.json --register atmospheric --output assets/

  # List available styles
  python recraft.py styles

  # Preview mode (print URL, don't download)
  python recraft.py generate "test prompt" --register atmospheric --preview

  # Raw prompt — bypass register/mode preambles entirely
  python recraft.py generate "exact prompt as-is" --raw

Environment variables:
  RECRAFT_API_KEY  — Get at https://www.recraft.ai/docs/api-reference/getting-started

Requires: pip install requests --break-system-packages
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Optional
from xml.etree import ElementTree as ET

import requests

# ── Configuration ────────────────────────────────────────────────────────────

API_KEY = os.environ.get("RECRAFT_API_KEY", "")
BASE_URL = "https://external.api.recraft.ai/v1"

# Brand palette (inline to avoid cross-tool import complexity)
BRAND_PALETTE = {
    "ink": "#1C1814",
    "amber": "#E5A544",
    "rust": "#C23B22",
    "bone": "#F0E6D0",
    "paper": "#F5F0E8",
    "oxblood": "#6B1D1D",
    "bronze": "#8B6914",
    "midnight": "#0F1923",
}

# Duotone ramps matching palette.json
DUOTONE_RAMPS = {
    "standard": {"shadows": "#1C1814", "midtones": "#8B6914", "highlights": "#E5A544"},
    "conflict": {"shadows": "#1C1814", "midtones": "#6B1D1D", "highlights": "#C23B22"},
    "editorial": {"shadows": "#3A3530", "midtones": "#C4B89A", "highlights": "#F0E6D0"},
}

# Default prompt prefix for brand consistency
BRAND_PREFIX = (
    "Minimalist vector illustration, clean geometric style, "
    "warm amber and dark umber color palette, "
    "no text, no labels, no watermarks, "
    "suitable for video overlay on dark background. "
)

# Recraft style categories
VECTOR_STYLES = {
    "vector_illustration": "General purpose vector illustration (default)",
    "flat_2.0": "Modern flat design — clean shapes, bold colors",
    "vector_art": "Artistic vector with more detail and depth",
    "line_art": "Outline-only illustration",
    "linocut": "Woodcut/linocut print aesthetic",
    "engraving": "Classic engraving style — crosshatching, fine lines",
    "doodle_line_art": "Hand-drawn doodle aesthetic",
    "cartoon": "Simplified cartoon style",
}

ICON_STYLES = {
    "icon": "Standard icon",
    "outline": "Outline icon",
    "pictogram": "Pictogram — simplified symbolic representation",
    "colored_outline": "Colored outline icon",
    "colored_shape": "Colored filled shape icon",
    "gradient_outline": "Gradient outline icon",
    "gradient_shape": "Gradient filled shape icon",
    "broken_line": "Broken/dashed line icon",
    "offset_fill": "Offset shadow fill icon",
    "offset_doodle": "Offset doodle style icon",
    "doodle": "Doodle style icon",
}

# Raster styles (returned as PNG, not SVG)
RASTER_STYLES = {
    "realistic_image": "Photorealistic image — rare; constructivist preamble fights this style. Use only for `realism: grounded` shots that explicitly need photographic spatial detail.",
    "digital_illustration": "Digital painting — between vector and photo",
}

ALL_STYLES = {**VECTOR_STYLES, **ICON_STYLES, **RASTER_STYLES}

# ── API Client ───────────────────────────────────────────────────────────────


def generate_image(
    prompt: str,
    style: str = "vector_illustration",
    size: str = "1920x1080",
    n: int = 1,
    use_brand_prefix: bool = True,
) -> list[dict]:
    """
    Generate image(s) via Recraft API.

    Returns list of {url, revised_prompt} dicts.
    """
    if not API_KEY:
        print("ERROR: RECRAFT_API_KEY environment variable not set.", file=sys.stderr)
        print("  Get your key at: https://www.recraft.ai/docs/api-reference/getting-started", file=sys.stderr)
        sys.exit(1)

    full_prompt = (BRAND_PREFIX + prompt) if use_brand_prefix else prompt

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    body = {
        "model": "recraft-v3",
        "prompt": full_prompt,
        "style": style,
        "size": size,
        "n": n,
    }

    print(f"  Generating: {prompt[:80]}{'...' if len(prompt) > 80 else ''}")
    print(f"  Style: {style} | Size: {size} | Count: {n}")

    try:
        resp = requests.post(
            f"{BASE_URL}/images/generations",
            headers=headers,
            json=body,
            timeout=60,
        )
        resp.raise_for_status()
        data = resp.json()

        results = []
        for item in data.get("data", []):
            results.append({
                "url": item.get("url", ""),
                "revised_prompt": item.get("revised_prompt", ""),
            })

        return results

    except requests.exceptions.HTTPError as e:
        print(f"  API Error: {e}", file=sys.stderr)
        if resp.status_code == 401:
            print("  → Invalid API key. Check RECRAFT_API_KEY.", file=sys.stderr)
        elif resp.status_code == 429:
            print("  → Rate limited. Wait and retry.", file=sys.stderr)
        else:
            try:
                print(f"  → {resp.json()}", file=sys.stderr)
            except Exception:
                print(f"  → {resp.text[:200]}", file=sys.stderr)
        return []

    except requests.exceptions.Timeout:
        print("  Timeout — Recraft API took too long. Retry.", file=sys.stderr)
        return []


def download_svg(url: str, output_path: Path) -> bool:
    """Download SVG content from URL and save to file."""
    try:
        resp = requests.get(url, timeout=30)
        resp.raise_for_status()

        content = resp.text
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Verify it's actually SVG
        if "<svg" not in content[:500].lower():
            # It's a raster image URL — download as PNG instead
            png_path = output_path.with_suffix(".png")
            with open(png_path, "wb") as f:
                f.write(resp.content)
            print(f"  Note: Recraft returned raster image, saved as {png_path.name}")
            return True

        with open(output_path, "w", encoding="utf-8") as f:
            f.write(content)

        return True

    except Exception as e:
        print(f"  Download failed: {e}", file=sys.stderr)
        return False


# ── SVG Brand Treatment ──────────────────────────────────────────────────────


def apply_duotone_svg(svg_path: Path, ramp_name: str = "standard") -> Path:
    """
    Apply brand duotone treatment to an SVG file.

    Replaces colors in the SVG with the brand duotone ramp.
    This is a lightweight SVG-level treatment — for raster images,
    use tools/brand-treatment/treat.py instead.

    Returns path to the treated file.
    """
    ramp = DUOTONE_RAMPS.get(ramp_name, DUOTONE_RAMPS["standard"])

    with open(svg_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Parse all hex colors in the SVG
    hex_pattern = re.compile(r'#([0-9a-fA-F]{6})\b')

    def remap_color(match: re.Match) -> str:
        hex_color = match.group(1)
        r, g, b = int(hex_color[0:2], 16), int(hex_color[2:4], 16), int(hex_color[4:6], 16)

        # Convert to luminance (0-1)
        luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0

        # Map luminance to duotone ramp (3-stop: shadows → midtones → highlights)
        shadow = _hex_to_rgb(ramp["shadows"])
        mid = _hex_to_rgb(ramp["midtones"])
        highlight = _hex_to_rgb(ramp["highlights"])

        if luminance < 0.5:
            t = luminance / 0.5
            out_r = int(shadow[0] + t * (mid[0] - shadow[0]))
            out_g = int(shadow[1] + t * (mid[1] - shadow[1]))
            out_b = int(shadow[2] + t * (mid[2] - shadow[2]))
        else:
            t = (luminance - 0.5) / 0.5
            out_r = int(mid[0] + t * (highlight[0] - mid[0]))
            out_g = int(mid[1] + t * (highlight[1] - mid[1]))
            out_b = int(mid[2] + t * (highlight[2] - mid[2]))

        return f"#{out_r:02x}{out_g:02x}{out_b:02x}"

    treated = hex_pattern.sub(remap_color, content)

    # Write treated version
    treated_path = svg_path.with_stem(svg_path.stem + f"_treated_{ramp_name}")
    with open(treated_path, "w", encoding="utf-8") as f:
        f.write(treated)

    print(f"  Brand treatment ({ramp_name}): {treated_path.name}")
    return treated_path


def _hex_to_rgb(hex_str: str) -> tuple[int, int, int]:
    h = hex_str.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


# ── Prompt Engineering ───────────────────────────────────────────────────────


def build_parallax_prompt(
    description: str,
    context: str = "",
    visual_mode: str = "illustration",
) -> str:
    """
    Build an optimized prompt for Parallax brand aesthetics.

    Args:
        description: What to illustrate (from script right column)
        context: Narration context (helps Recraft understand intent)
        visual_mode: One of 'illustration', 'diagram', 'icon', 'metaphor'
    """
    mode_prefix = {
        "illustration": (
            "Editorial vector illustration for a geopolitics documentary. "
            "Warm color palette (amber, umber, bone). "
            "Clean composition, strong silhouettes, information-dense. "
        ),
        "diagram": (
            "Technical vector diagram for an analytical video essay. "
            "Geometric shapes, clean lines, labeled nodes. "
            "Warm amber and dark umber on light bone background. "
        ),
        "icon": (
            "Minimalist icon set, geometric style, consistent stroke width. "
            "Amber (#E5A544) on dark (#1C1814) background. "
        ),
        "metaphor": (
            "Conceptual vector illustration expressing an abstract idea. "
            "Symbolic, not literal. Warm tones, editorial magazine quality. "
            "Strong focal point, negative space used intentionally. "
        ),
    }

    prefix = mode_prefix.get(visual_mode, mode_prefix["illustration"])
    parts = [prefix, description]

    if context:
        parts.append(f"Context: {context}")

    parts.append("No text, no labels, no watermarks, no human faces.")

    return " ".join(parts)


# ── Constructivist Prompt Architecture (post-May 4 unified aesthetic) ────────
#
# Per VISUAL_LANGUAGE.md and AI_VIDEO_PIPELINE.md, every illustrated surface in
# Parallax (Registers 2 and 3) shares the same constructivist visual language:
# Rodchenko / Heartfield / Masereel tradition. The aesthetic is unified; what
# varies per scene is (1) the register's role (atmospheric backdrop vs. grounded
# figurative scene), (2) the realism dosage (flat / balanced / grounded), and
# (3) the typography tradition matched to the scene's geography/era.
#
# Prompts are composed from four blocks: BASE + register-focus + realism +
# typography. The composition is the prompt-level half of the two-stage brand
# unification (treat.py / treat_video.py is the treatment-level half).
#
# Replaces the prior photoreal-mannequin Register 3 and isolated Register 2
# preambles. May 4, 2026 migration. See PROMPT_PREAMBLES.md for design rationale.

CONSTRUCTIVIST_BASE_PREAMBLE = (
    "Editorial illustration in the Parallax constructivist style. Soviet "
    "constructivism meets German political photomontage meets industrial "
    "woodcut tradition — drawing on Alexander Rodchenko, El Lissitzky, "
    "John Heartfield, and Frans Masereel. Bold compositional confidence, "
    "color-blocked forms with no soft shading or gradients. "
    "Restricted warm palette: deep ink (#1C1814), walnut (#5C4A3D), "
    "umber (#8B7355), burnt amber and gold (#C4A747), rust (#A64D46), "
    "and bone (#F0E6D0) on paper (#F5F0E8) background. No other colors."
)

REGISTER_FOCUS_BLOCKS = {
    "atmospheric": (
        "Subject: industrial systems, civilizational mood, abstract forces — "
        "factories, supply chains, towers, networks, machinery. Composition: "
        "monumentalist scale, low horizon line, propaganda-poster dynamism. "
        "Used as background at 30-40% opacity behind narration. Figures "
        "absent or at silhouette scale only."
    ),
    "grounding": (
        "Subject: figures in environments — workers in facilities, decision-"
        "makers in offices, scenes with people navigating systems. Figures "
        "rendered in the constructivist photomontage tradition of Alexander "
        "Rodchenko's 1924 portrait series and El Lissitzky's 1924 "
        "Self-Portrait: faces composed of 4-5 distinct color-blocked planes "
        "(jaw plane, cheekbone plane, brow plane, lit plane, neck plane) "
        "with no continuous skin tonality, no rendered facial features, no "
        "photographic nose contour, no visible mouth or eye detail. Eyes "
        "are pure shadow shapes or obscured entirely by lens reflection / "
        "hat brim / hair fall. Hair is a single color-blocked dark shape. "
        "Hands are flat color planes (palm + finger silhouette only, no "
        "individual finger detail). Bodies and clothing are color-blocked "
        "with period-appropriate silhouette but no fabric texture on the "
        "figure itself. The figure is fully committed to graphic flatness "
        "regardless of the realism dosage applied to the environment. The "
        "depersonalization signal is editorial through aggressive "
        "stylization, never through realistic-but-blurred features."
    ),
    "analytical": (
        "Subject: diagrammatic, code-clean illustration. Geometric forms, "
        "clean precise lines, balanced negative space, labeled-style nodes "
        "without actual text. Composition reads left-to-right or top-to-"
        "bottom for diagrammatic clarity. Note: most analytical content "
        "should be code-locked Remotion, not Recraft-generated."
    ),
}

REALISM_DOSAGE_BLOCKS = {
    "flat": (
        "Realism dosage: maximum graphic flatness for both figure AND "
        "environment. Color-blocked forms only, no photographic texture "
        "anywhere, no soft shading, no gradients. All surfaces — figure, "
        "environment, props — suggested through palette planes alone. "
        "REQUIRED FOR ANIMATED AI-GEN CLIPS: animation stability needs this "
        "maximum flatness because color-blocked forms track reliably across "
        "frames whereas photographic textures drift. Best for monumentalist "
        "industrial scenes, propaganda-poster moments, and any asset that "
        "will be animated to video by Kling / Sora / Runway."
    ),
    "balanced": (
        "Realism dosage: balanced. The FIGURE stays fully flat-"
        "constructivist (4-5 color-blocked face planes, flat clothing, no "
        "fabric texture, no skin tonality — same standard as flat dosage). "
        "The ENVIRONMENT may have selective material texture only: paper "
        "grain on backgrounds, warm light gradient on a desk lamp's pool, "
        "subtle wood grain on furniture, dust haze in industrial spaces. "
        "The figure is never photorealistic; the environment may approach "
        "photographic detail at the edges. Default dosage for stills; "
        "works for most scenes from intimate domestic to industrial."
    ),
    "grounded": (
        "Realism dosage: grounded. The FIGURE retains constructivist DNA "
        "(color-blocked face planes, no continuous skin tonality, no "
        "rendered facial features) but may carry slightly more anatomical "
        "specificity (clearer jaw line, more defined cheek planes, more "
        "natural posture). The ENVIRONMENT is rendered with photographic "
        "spatial detail: atmospheric perspective, material texture on "
        "machinery and surfaces, deeper spatial recession. STILLS ONLY — "
        "animation drift becomes severe at this dosage because the "
        "environment's photographic surfaces fail to track consistently. "
        "Best for restricted-facility reconstruction stills where "
        "you-are-here presence matters and the asset will be Ken-Burned "
        "rather than animated."
    ),
}

# Typography traditions — full visual grammars in TYPOGRAPHY_TRADITIONS.md.
# Each block carries three responsibilities:
#   1. Typography itself (what text style/script/period)
#   2. PALETTE EMPHASIS (which subset of the brand palette to foreground)
#   3. COMPOSITIONAL EMPHASIS (which compositional grammar to use)
# Together these provide cultural counterweight to the base preamble's default
# Soviet/German constructivist lean. The brand's overall palette range stays
# constant (palette.json); typography blocks specify which colors to emphasize
# and how to compose for cultural appropriateness.
TYPOGRAPHY_BLOCKS = {
    "none": "",
    "english_minimal": (
        "Typography: minimal English signage where naturally diegetic only "
        "(calendars, equipment labels, document headers). Period-appropriate "
        "Helvetica or sans-serif, small scale, no compositional dominance, "
        "no slogans. "
        "PALETTE EMPHASIS: neutral subset of the brand range — walnut "
        "(#5C4A3D), umber (#8B7355), bone (#F0E6D0), paper (#F5F0E8). Avoid "
        "bold accents. This is everyday signage integrated into realistic "
        "scenes, not propaganda. "
        "COMPOSITIONAL EMPHASIS: small scale, no compositional dominance. "
        "Text integrates with realistic objects (calendar pages, document "
        "headers, equipment labels)."
    ),
    "english_modernist": (
        "Typography: American midcentury modernist propaganda-poster — Push "
        "Pin Studios, Saul Bass title-sequence, Fortune-magazine industrial-"
        "modernism, Herb Lubalin layouts. Geometric sans-serif (Helvetica-"
        "adjacent, Futura, Avant Garde), bold weight, slab-block letter "
        "compositions. Short imperative or declarative English phrases "
        "(e.g., 'INDUSTRY · INNOVATION · ENTERPRISE', 'PROGRESS', 'THE "
        "AMERICAN CENTURY', 'BUILD · ITERATE · SCALE'). Typography "
        "integrated with architectural elements. "
        "PALETTE EMPHASIS: pull from the brand's softer range — walnut "
        "(#5C4A3D), umber (#8B7355), gold (#C4A747), bone (#F0E6D0), paper "
        "(#F5F0E8) — with rust (#A64D46) as a SINGLE sparing accent only, "
        "never the dominant color. Avoid the saturated revolutionary red "
        "palette of Soviet constructivism. Think Saul Bass's restrained "
        "mid-century palette (Anatomy of a Murder posters), Charley Harper's "
        "wildlife illustrations, Jim Flora's RCA covers, Mad Men interiors — "
        "American mid-century optimism, NOT revolutionary mobilization. "
        "COMPOSITIONAL EMPHASIS: balanced asymmetric layouts typical of "
        "American mid-century editorial design — Push Pin Studios' "
        "deliberate white-space discipline, Saul Bass's confident negative "
        "space, the Eames-era flat-modernist grid. Avoid the diagonal "
        "compositional axis of Soviet constructivism (which reads as "
        "revolutionary intensity). Composition feels intentional and "
        "architectural, not heroic and monumentalist."
    ),
    "russian_constructivist": (
        "Typography: Soviet Constructivist propaganda — Rodchenko / Klutsis / "
        "Lissitzky tradition. Sans-serif geometric block letters, bold heavy "
        "weights, frequent vertical column treatment. Real Cyrillic text in "
        "Russian — short imperative slogans, declarations, dates as "
        "monumental design elements. Sample period-appropriate phrases: "
        "ЕДИНСТВО (Unity), ИНДУСТРИАЛИЗАЦИЯ (Industrialization), ПОБЕДА "
        "(Victory), ПЯТИЛЕТКА (Five-Year Plan), ЭНЕРГИЯ (Energy), ПРОГРЕСС "
        "(Progress). Cyrillic must be real Russian, not mock-script "
        "gibberish. "
        "PALETTE EMPHASIS: full saturated revolutionary palette — heavy red "
        "(rust #A64D46 dominant), gold (#C4A747) accents, deep ink (#1C1814) "
        "structural elements, bone (#F0E6D0) for highlights. This is the "
        "default Soviet emphasis; revolutionary intensity is the goal. "
        "COMPOSITIONAL EMPHASIS: diagonal compositional axis (signature "
        "Soviet constructivist move), monumentalist scale, low horizon line, "
        "propaganda-poster dynamism. Heroic figures rendered in low-angle "
        "shots. This is Rodchenko / Klutsis intensity — full revolutionary "
        "weight."
    ),
    "chinese_propaganda": (
        "Typography: Chinese propaganda poster — Cultural Revolution and "
        "post-Mao Reform Era tradition. Bold heiti (黑体) sans-serif at "
        "large scale. Frequent vertical text orientation (top-to-bottom "
        "right column). Imperative slogan tone, integration with "
        "revolutionary or industrial iconography. Real Simplified Chinese "
        "characters (post-1956). Sample period-appropriate phrases: 工业现代化 "
        "(Industrial Modernization), 自力更生 (Self-Reliance), 改革开放 (Reform "
        "and Opening), 科技自立 (Technological Self-Reliance), 中国制造 (Made in "
        "China), 微米 (Micron), 芯片 (Chip). Chinese characters must be real "
        "and parseable, not mock-script. "
        "PALETTE EMPHASIS: Chinese vermillion red (slightly warmer and more "
        "lacquer-influenced than Russian crimson — closer to traditional "
        "Chinese pigments and Chinese New Year red) plus gold (#C4A747) and "
        "deep ink (#1C1814), with ivory paper (#F5F0E8) background. The red "
        "reads Chinese-state, NOT generic-communist or Soviet revolutionary. "
        "Cultural Revolution posters used pigment characteristics distinct "
        "from Soviet propaganda — more saturated golden-yellow, more "
        "calligraphic black emphasis, traditional vermillion rather than "
        "industrial crimson. "
        "COMPOSITIONAL EMPHASIS: vertical orientation common (top-to-bottom "
        "right column for vertical text), often with stylized portrait "
        "elements (workers, peasants, soldiers tradition) integrated into "
        "the composition. Imperative slogan tone supported by bold heiti "
        "sans-serif at large scale. More frontal/symmetric composition than "
        "Soviet diagonal — reads as state-poster rather than revolutionary "
        "agitprop."
    ),
    "chinese_minimal": (
        "Typography: subtle period-natural Chinese signage only — calendars, "
        "newspaper headers, book spines, document text. Smaller scale, no "
        "compositional dominance. Real Chinese characters (Simplified for "
        "PRC scenes post-1956, Traditional for pre-1949 or Taiwan/Hong Kong "
        "scenes). Period-appropriate calligraphic or print styles. "
        "PALETTE EMPHASIS: neutral subset — walnut (#5C4A3D), umber "
        "(#8B7355), bone (#F0E6D0), paper (#F5F0E8). Restrained presence; "
        "NOT propaganda intensity. "
        "COMPOSITIONAL EMPHASIS: subtle integration into realistic objects "
        "(calendar pages, newspaper headers, book spines, document text). "
        "Small scale, no compositional dominance."
    ),
    "chinese_traditional": (
        "Typography: pre-revolutionary Chinese tradition — brush calligraphy "
        "aesthetic, vertical orientation (right-to-left columns), classical "
        "typesetting, restrained scale, black ink on bone background. "
        "Traditional Chinese characters (繁體). Often paired with classical "
        "iconography (scrolls, scholar's objects, pavilions). "
        "PALETTE EMPHASIS: ink wash dominant — deep ink (#1C1814) on paper "
        "(#F5F0E8) background, with sparse rust (#A64D46) only as red seal "
        "accents (chops, signatures). Avoid amber/gold dominance of "
        "propaganda traditions; this is scholarly restraint. Closest "
        "equivalent: classical scroll painting, scholar's study aesthetics, "
        "literati ink tradition. "
        "COMPOSITIONAL EMPHASIS: vertical orientation (right-to-left "
        "columns for text), restrained scale, contemplative composition. "
        "Negative space is content — extensive empty areas as deliberate "
        "aesthetic choice. NOT propaganda intensity; this is literati "
        "restraint."
    ),
    "japanese_showa": (
        "Typography: Japanese Showa-era propaganda (1930s-40s). Vertical "
        "text orientation, bold rendering, frequent integration with "
        "traditional Japanese iconography. Bold kanji at monumental scale. "
        "Sample period-appropriate kanji: 技術 (Technology), 産業 (Industry), "
        "国家 (Nation), 進歩 (Progress). Real Japanese, not mock-script. "
        "PALETTE EMPHASIS: extremely minimal — black/deep ink (#1C1814), "
        "single bold red (closer to traditional Japanese red, slightly "
        "orange-leaning — between rust #A64D46 and gold #C4A747), cream/"
        "bone (#F0E6D0). Often just 2-3 colors total. Avoid amber/gold "
        "dominance of Soviet propaganda; the Showa-era palette is "
        "deliberately stripped down. "
        "COMPOSITIONAL EMPHASIS: vertical orientation strongly preferred, "
        "geometric flag/sun motif integration, bold kanji at monumental "
        "scale. Rising sun radial composition is a signature element when "
        "appropriate to the historical moment. Less industrial than Soviet, "
        "more emblematic and graphic."
    ),
    "mixed": (
        "Typography: deliberately juxtaposed traditions in one frame. Two "
        "typographic vocabularies co-present with clear spatial separation "
        "(split frame, foreground vs. background, left vs. right). The "
        "juxtaposition itself is the editorial point. Specify which two "
        "traditions in the description (e.g., russian_constructivist + "
        "english_modernist for a Cold War comparison). "
        "PALETTE EMPHASIS: each half uses its tradition's palette emphasis "
        "(see individual blocks). The contrast between palettes is part of "
        "the editorial argument. "
        "COMPOSITIONAL EMPHASIS: clear vertical or horizontal split-line "
        "establishes the comparison. Each half follows its tradition's "
        "compositional grammar. Symmetric framing supports analytical "
        "comparison; asymmetric supports argumentative juxtaposition."
    ),
}

NEGATIVE_PROMPT_BLOCK = (
    "Avoid: corporate clip art, children's book illustration, pastel tones, "
    "cool blue or teal, photorealistic rendering as a primary mode, 3D render "
    "look, gradient-heavy fills, cute or whimsical mood, flat tech-startup "
    "aesthetic, Memphis design, isometric perspective, Adobe stock photo "
    "aesthetic. Smooth featureless mannequin-style faces are forbidden — "
    "figures must have planar color-blocked facets, eyes obscured by lens "
    "shadow or hair fall or visor reflection, never smooth convex blank "
    "surfaces. CONTINUOUS SKIN TONALITY ON FIGURES IS FORBIDDEN — faces "
    "must be 4-5 distinct color-blocked planes, not gradient skin renders. "
    "RENDERED FACIAL FEATURES ARE FORBIDDEN — no photographic nose contour, "
    "no individual mouth detail, no realistic eye structure, no eyelashes, "
    "no skin pores or texture. Realistic-but-blurred features fall in the "
    "uncanny valley sideways and are forbidden — commit to graphic "
    "stylization or don't include the feature. Hands must be flat color "
    "planes (no individual finger detail). No identifiable real "
    "individuals. Mock-script text in non-English typographies is "
    "forbidden — all text must be real and parseable in its source language."
)

# Recommended Recraft style per register. All registers default to vector
# illustration in the new constructivist architecture (the prior `realistic_image`
# default for grounding is retired — photoreal generation fights the
# constructivist preamble).
REGISTER_RECOMMENDED_STYLE = {
    "atmospheric": "vector_illustration",
    "grounding": "vector_illustration",
    "analytical": "vector_illustration",
}

# Backward-compatibility shim: the old REGISTER_PREAMBLES dict exposed
# `style` and `preamble` keys. External callers that still read this dict
# get the new composed values (with defaults: realism=balanced, text_treatment=none).
REGISTER_PREAMBLES = {
    register: {
        "style": REGISTER_RECOMMENDED_STYLE[register],
        "preamble": " ".join([
            CONSTRUCTIVIST_BASE_PREAMBLE,
            REGISTER_FOCUS_BLOCKS[register],
            REALISM_DOSAGE_BLOCKS["balanced"],
        ]),
        "negative": NEGATIVE_PROMPT_BLOCK,
    }
    for register in REGISTER_FOCUS_BLOCKS
}


def build_register_prompt(
    description: str,
    register: str,
    context: str = "",
    realism: str = "balanced",
    text_treatment: str = "none",
) -> str:
    """
    Build a constructivist-aesthetic prompt for the specified register.

    Composes the full prompt from four blocks:
      1. CONSTRUCTIVIST_BASE_PREAMBLE — unified aesthetic vocabulary
      2. REGISTER_FOCUS_BLOCKS[register] — what the register is for
      3. REALISM_DOSAGE_BLOCKS[realism] — how interpreted vs. grounded
      4. TYPOGRAPHY_BLOCKS[text_treatment] — which typographic tradition
    Plus: scene description, optional context, NEGATIVE_PROMPT_BLOCK.

    See VISUAL_LANGUAGE.md, AI_VIDEO_PIPELINE.md, TYPOGRAPHY_TRADITIONS.md, and
    PROMPT_PREAMBLES.md for the design rationale and parameter semantics.

    Args:
        description: What to illustrate (from the script's right column or
            shot list `description` field).
        register: One of 'atmospheric', 'grounding', 'analytical'.
        context: Optional narration context.
        realism: One of 'flat', 'balanced', 'grounded'. Default 'balanced'.
        text_treatment: One of 'none', 'english_minimal', 'english_modernist',
            'russian_constructivist', 'chinese_propaganda', 'chinese_minimal',
            'chinese_traditional', 'japanese_showa', 'mixed'. Default 'none'.

    Returns:
        Full prompt string ready to send to the Recraft API.
    """
    if register not in REGISTER_FOCUS_BLOCKS:
        raise ValueError(
            f"Unknown register: {register!r}. "
            f"Choose from: {sorted(REGISTER_FOCUS_BLOCKS.keys())}"
        )
    if realism not in REALISM_DOSAGE_BLOCKS:
        raise ValueError(
            f"Unknown realism dosage: {realism!r}. "
            f"Choose from: {sorted(REALISM_DOSAGE_BLOCKS.keys())}"
        )
    if text_treatment not in TYPOGRAPHY_BLOCKS:
        raise ValueError(
            f"Unknown text_treatment: {text_treatment!r}. "
            f"Choose from: {sorted(TYPOGRAPHY_BLOCKS.keys())}"
        )

    parts = [
        CONSTRUCTIVIST_BASE_PREAMBLE,
        REGISTER_FOCUS_BLOCKS[register],
        REALISM_DOSAGE_BLOCKS[realism],
        TYPOGRAPHY_BLOCKS[text_treatment],
        description,
    ]
    if context:
        parts.append(f"Context: {context}")
    parts.append(NEGATIVE_PROMPT_BLOCK)

    # Filter empty strings (typography 'none' contributes nothing)
    return " ".join(p for p in parts if p)


# ── Batch Processing ─────────────────────────────────────────────────────────


def process_batch(
    shot_list_path: Path,
    output_dir: Path,
    style: str = "vector_illustration",
    treat_ramp: Optional[str] = None,
    default_register: Optional[str] = None,
    default_realism: str = "balanced",
    default_text_treatment: str = "none",
) -> dict:
    """
    Process a shot list JSON file, generating SVGs for AI-GENERATE entries.

    Shot list format (per data/shot-list.schema.json):
    [
      {
        "id": "shot-01",
        "description": "Semiconductor supply chain flow diagram",
        "type": "ai-generate",                       // only processes these
        "register": "grounding",                     // atmospheric/grounding/analytical
        "realism": "balanced",                       // flat/balanced/grounded
        "text_treatment": "chinese_propaganda",      // see TYPOGRAPHY_TRADITIONS.md
        "context": "Narration about TSMC dominance",
        "visual_mode": "diagram",                    // legacy fallback if register not set
        "fallback_terms": ["chip supply chain", "semiconductor flow"]
      },
      ...
    ]

    Per-shot fields take precedence over CLI defaults. When `register` is set,
    the constructivist preamble is composed from register + realism +
    text_treatment. When `register` is absent, falls back to legacy `visual_mode`
    path (build_parallax_prompt). The recommended Recraft style for the register
    is used unless `style` is explicitly set on the shot.

    Returns manifest of generated files.
    """
    with open(shot_list_path, "r", encoding="utf-8") as f:
        shots = json.load(f)

    output_dir.mkdir(parents=True, exist_ok=True)
    manifest = {"generated": [], "skipped": [], "failed": []}

    # Filter to AI-generate entries only
    ai_shots = [s for s in shots if s.get("type", "").lower() in ("ai-generate", "ai-gen", "svg")]

    if not ai_shots:
        print("No ai-generate entries found in shot list.")
        return manifest

    print(f"\nProcessing {len(ai_shots)} AI-generate entries from {shot_list_path.name}\n")
    print("=" * 60)

    for i, shot in enumerate(ai_shots):
        shot_id = shot.get("id", f"shot-{i:02d}")
        description = shot.get("description", "")
        visual_mode = shot.get("visual_mode", "illustration")
        context = shot.get("context", "")
        # Per-shot register/realism/text_treatment override CLI-level defaults;
        # all three feed the constructivist preamble composition.
        shot_register = shot.get("register") or default_register
        shot_realism = shot.get("realism", default_realism)
        shot_text_treatment = shot.get("text_treatment", default_text_treatment)

        print(f"\n[{i+1}/{len(ai_shots)}] {shot_id}")
        print(f"  Description: {description[:60]}{'...' if len(description) > 60 else ''}")

        if not description:
            print("  SKIPPED: No description")
            manifest["skipped"].append({"id": shot_id, "reason": "no description"})
            continue

        # Build prompt — register-based if set, otherwise legacy visual_mode path
        if shot_register:
            prompt = build_register_prompt(
                description,
                shot_register,
                context=context,
                realism=shot_realism,
                text_treatment=shot_text_treatment,
            )
            print(f"  Register: {shot_register} | Realism: {shot_realism} | "
                  f"Text: {shot_text_treatment}")
        else:
            prompt = build_parallax_prompt(description, context, visual_mode)
            print(f"  Visual mode: {visual_mode} (legacy)")

        # Determine best style for this shot
        if shot_register:
            shot_style = shot.get("style") or REGISTER_PREAMBLES[shot_register]["style"]
        elif visual_mode == "icon":
            shot_style = shot.get("style", "pictogram")
        elif visual_mode == "diagram":
            shot_style = shot.get("style", "flat_2.0")
        else:
            shot_style = shot.get("style", style)

        # Generate
        results = generate_image(
            prompt=prompt,
            style=shot_style,
            size="1920x1080",
            n=1,
            use_brand_prefix=False,  # build_parallax_prompt already adds context
        )

        if not results:
            manifest["failed"].append({"id": shot_id, "reason": "API error"})
            continue

        # Download
        output_file = output_dir / f"{shot_id}.svg"
        url = results[0]["url"]

        if download_svg(url, output_file):
            entry = {
                "id": shot_id,
                "file": str(output_file),
                "prompt": prompt[:200],
                "style": shot_style,
                "url": url,
            }

            # Apply brand treatment if requested
            if treat_ramp:
                treated = apply_duotone_svg(output_file, treat_ramp)
                entry["treated_file"] = str(treated)

            manifest["generated"].append(entry)
            print(f"  ✓ Saved: {output_file.name}")
        else:
            manifest["failed"].append({"id": shot_id, "reason": "download failed"})

        # Rate limit courtesy (avoid hammering the API)
        if i < len(ai_shots) - 1:
            time.sleep(1)

    # Write manifest
    manifest_path = output_dir / "recraft-manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    print(f"\n{'=' * 60}")
    print(f"Done: {len(manifest['generated'])} generated, "
          f"{len(manifest['skipped'])} skipped, "
          f"{len(manifest['failed'])} failed")
    print(f"Manifest: {manifest_path}")

    return manifest


# ── CLI ──────────────────────────────────────────────────────────────────────


def cmd_generate(args):
    """Generate a single illustration."""
    # Build the full prompt based on register / mode / raw flag.
    # Register takes precedence over mode (it's the higher-level concept).
    if args.register:
        prompt = build_register_prompt(
            args.prompt,
            args.register,
            realism=args.realism,
            text_treatment=args.text_treatment,
        )
        # If user didn't explicitly set --style, use the register's recommended style
        style = args.style or REGISTER_PREAMBLES[args.register]["style"]
    elif args.raw:
        prompt = args.prompt
        style = args.style or "vector_illustration"
    else:
        prompt = build_parallax_prompt(args.prompt, visual_mode=args.mode)
        style = args.style or "vector_illustration"

    results = generate_image(
        prompt=prompt,
        style=style,
        size=args.size,
        n=args.count,
        use_brand_prefix=False,
    )

    if not results:
        sys.exit(1)

    for i, result in enumerate(results):
        url = result["url"]
        print(f"  URL: {url}")

        if args.preview:
            continue

        # Determine output path
        if args.output:
            out = Path(args.output)
            if args.count > 1:
                out = out.with_stem(f"{out.stem}_{i+1}")
        else:
            slug = re.sub(r'[^a-z0-9]+', '-', prompt[:40].lower()).strip('-')
            out = Path(f"recraft_{slug}.svg")

        if download_svg(url, out):
            print(f"  Saved: {out}")

            if args.treat:
                apply_duotone_svg(out, args.treat)


def cmd_batch(args):
    """Batch generate from shot list."""
    shot_list = Path(args.shot_list)
    if not shot_list.exists():
        print(f"ERROR: Shot list not found: {shot_list}", file=sys.stderr)
        sys.exit(1)

    output_dir = Path(args.output) if args.output else shot_list.parent / "recraft-assets"

    process_batch(
        shot_list_path=shot_list,
        output_dir=output_dir,
        style=args.style or "vector_illustration",
        treat_ramp=args.treat,
        default_register=args.register,
        default_realism=args.realism,
        default_text_treatment=args.text_treatment,
    )


def cmd_styles(args):
    """List available styles."""
    print("\n  VECTOR ILLUSTRATION STYLES")
    print("  " + "─" * 50)
    for name, desc in VECTOR_STYLES.items():
        marker = " ★" if name == "vector_illustration" else ""
        print(f"  {name:24s} {desc}{marker}")

    print("\n  ICON STYLES")
    print("  " + "─" * 50)
    for name, desc in ICON_STYLES.items():
        print(f"  {name:24s} {desc}")

    print(f"\n  Total: {len(ALL_STYLES)} styles available")
    print(f"  ★ = default\n")


def main():
    parser = argparse.ArgumentParser(
        description="Parallax Recraft SVG Generation Tool",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # ── generate ──
    gen = subparsers.add_parser("generate", help="Generate a single illustration or photo")
    gen.add_argument("prompt", help="Description of what to illustrate / photograph")
    gen.add_argument("-o", "--output", help="Output file path (default: auto-named)")
    gen.add_argument("-r", "--register",
                     choices=list(REGISTER_FOCUS_BLOCKS.keys()),
                     help="Parallax visual register — applies the constructivist "
                          "preamble composed from register + realism + typography. "
                          "Takes precedence over --mode. See VISUAL_LANGUAGE.md, "
                          "PROMPT_PREAMBLES.md, TYPOGRAPHY_TRADITIONS.md.")
    gen.add_argument("--realism",
                     choices=list(REALISM_DOSAGE_BLOCKS.keys()),
                     default="balanced",
                     help="Realism dosage for the constructivist preamble: flat "
                          "(maximum graphic), balanced (default), grounded "
                          "(more photographic spatial detail). Only used with "
                          "--register.")
    gen.add_argument("--text-treatment",
                     dest="text_treatment",
                     choices=list(TYPOGRAPHY_BLOCKS.keys()),
                     default="none",
                     help="Typography tradition matched to the scene's geography/"
                          "era. See TYPOGRAPHY_TRADITIONS.md for the full vocabulary. "
                          "Only used with --register.")
    gen.add_argument("-s", "--style", default=None,
                     choices=list(ALL_STYLES.keys()),
                     help="Recraft style (default: vector_illustration; "
                          "auto-selected from register if --register is set)")
    gen.add_argument("-m", "--mode", default="illustration",
                     choices=["illustration", "diagram", "icon", "metaphor"],
                     help="Legacy visual mode — shapes the prompt prefix when "
                          "--register is not set (default: illustration)")
    gen.add_argument("--size", default="1920x1080",
                     help="Image size WxH (default: 1920x1080)")
    gen.add_argument("-n", "--count", type=int, default=1,
                     help="Number of variations to generate (1-4)")
    gen.add_argument("--treat", choices=list(DUOTONE_RAMPS.keys()),
                     help="Apply brand duotone treatment after generation (SVG only; "
                          "use tools/brand-treatment/treat.py for raster output)")
    gen.add_argument("--preview", action="store_true",
                     help="Print URL only, don't download")
    gen.add_argument("--raw", action="store_true",
                     help="Use prompt as-is without brand prefix or register preamble")
    gen.set_defaults(func=cmd_generate)

    # ── batch ──
    bat = subparsers.add_parser("batch", help="Batch generate from shot list JSON")
    bat.add_argument("shot_list", help="Path to shot-list.json")
    bat.add_argument("-o", "--output", help="Output directory (default: alongside shot list)")
    bat.add_argument("-r", "--register",
                     choices=list(REGISTER_FOCUS_BLOCKS.keys()),
                     help="Default Parallax register for shots that don't set one "
                          "explicitly. Per-shot 'register' field overrides this.")
    bat.add_argument("--realism",
                     choices=list(REALISM_DOSAGE_BLOCKS.keys()),
                     default="balanced",
                     help="Default realism dosage for shots without explicit "
                          "'realism' field (default: balanced).")
    bat.add_argument("--text-treatment",
                     dest="text_treatment",
                     choices=list(TYPOGRAPHY_BLOCKS.keys()),
                     default="none",
                     help="Default typography tradition for shots without "
                          "explicit 'text_treatment' field (default: none).")
    bat.add_argument("-s", "--style", default=None,
                     help="Default Recraft style for shots without register / explicit style")
    bat.add_argument("--treat", choices=list(DUOTONE_RAMPS.keys()),
                     help="Apply brand duotone treatment to all generated SVGs")
    bat.set_defaults(func=cmd_batch)

    # ── styles ──
    sty = subparsers.add_parser("styles", help="List available Recraft styles")
    sty.set_defaults(func=cmd_styles)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
