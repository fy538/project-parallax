#!/usr/bin/env python3
"""
Remotion Template Linter — automated visual polish enforcement.

Scans template .tsx files and JSON data files for common anti-patterns
that cause visual quality issues. Run before every render.

Usage:
    python scripts/lint-templates.py                    # lint everything
    python scripts/lint-templates.py --templates-only   # just code checks
    python scripts/lint-templates.py --data-only        # just data checks
    python scripts/lint-templates.py --fix-suggestions  # include fix hints

Exit codes:
    0 — all clear
    1 — warnings only (render is safe but polish may suffer)
    2 — errors found (render may crash or look broken)
"""

import os
import re
import sys
import json
import argparse
from pathlib import Path
from collections import defaultdict
from typing import NamedTuple

# ── Config ──────────────────────────────────────────────────────────────────

TEMPLATES_DIR = Path(__file__).parent.parent / "src" / "templates"
DATA_DIR = Path(__file__).parent.parent / "data" / "episodes"
EPISODES_DIR = TEMPLATES_DIR / "Episodes"

# Templates that are exempt from certain rules
# (e.g., KineticTypography is full-screen centered text, doesn't need contentArea)
CONTENT_AREA_EXEMPT = {
    "KineticTypography",
    "TitleTransition",
    "ImageComposite",
    "SplitComposition",
}

# Templates where full-screen layout is intentional (no safe area needed for map fill)
SAFE_AREA_EXEMPT = {
    "ChoroplethMap",
    "RouteAnimation",
}

# ── Types ───────────────────────────────────────────────────────────────────

class Issue(NamedTuple):
    severity: str   # "error" | "warning" | "info"
    rule: str       # rule code like "POL-01"
    file: str       # relative path
    line: int       # 1-based line number (0 = file-level)
    message: str    # human-readable description
    fix: str        # suggested fix (empty if none)


# ── Rule implementations ────────────────────────────────────────────────────

def check_hardcoded_pixels(filepath: Path, lines: list[str]) -> list[Issue]:
    """POL-01: Hardcoded pixel values instead of layout.spacing tokens."""
    issues = []
    # Match gap: NN, padding: NN, margin*: NN where NN >= 8
    # Exclude lines that already use layout.*, spacing.*, fontSizes.*, cardPadding
    pattern = re.compile(
        r'(?:gap|padding|paddingTop|paddingBottom|paddingLeft|paddingRight|'
        r'margin|marginTop|marginBottom|marginLeft|marginRight):\s*(\d+)'
    )
    exempt_pattern = re.compile(
        r'layout\.|spacing\.|fontSizes\.|cardPadding|safeArea|contentArea'
    )
    rel = str(filepath.relative_to(TEMPLATES_DIR))

    for i, line in enumerate(lines, 1):
        # Skip comments
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        if exempt_pattern.search(line):
            continue
        m = pattern.search(line)
        if m:
            val = int(m.group(1))
            # Ignore very small values (1-4px micro-adjustments are fine)
            if val < 8:
                continue
            # Ignore margin: 0 resets
            if val == 0:
                continue
            # Map common values to token suggestions
            token_map = {
                8: "layout.spacing.xs",
                16: "layout.spacing.sm",
                20: "layout.spacing.md (24)",
                24: "layout.spacing.md",
                32: "layout.spacing.lg",
                40: "layout.spacing.xl (48)",
                48: "layout.spacing.xl",
                64: "layout.spacing.xxl",
                80: "layout.spacing.xxxl",
            }
            suggestion = token_map.get(val, f"nearest layout.spacing.* token")
            issues.append(Issue(
                severity="warning",
                rule="POL-01",
                file=rel,
                line=i,
                message=f"Hardcoded pixel value {val} — use {suggestion}",
                fix=f"Replace {val} with {suggestion}",
            ))
    return issues


def check_hardcoded_font_sizes(filepath: Path, lines: list[str]) -> list[Issue]:
    """POL-02: Hardcoded font sizes instead of fontSizes.* tokens."""
    issues = []
    pattern = re.compile(r'fontSize:\s*(\d+)')
    exempt = re.compile(r'fontSizes\.')
    rel = str(filepath.relative_to(TEMPLATES_DIR))

    # Intentionally oversized display text — hero numbers, decorative quote marks,
    # section numbers, etc. These exceed the design system on purpose for cinematic impact.
    DISPLAY_EXEMPTIONS: dict[str, set[int]] = {
        "KineticTypography/KineticTypography.tsx": {160, 180},  # hero quote mark, big stat number
        "StatReveal/StatReveal.tsx": {120},                      # hero stat number
        "TitleTransition/TitleTransition.tsx": {120},            # section number
        "AudioPreview/AudioPreview.tsx": {120},                  # timer countdown display
    }
    exempt_sizes = DISPLAY_EXEMPTIONS.get(rel, set())

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        if exempt.search(line):
            continue
        m = pattern.search(line)
        if m:
            val = int(m.group(1))
            if val in exempt_sizes:
                continue
            size_map = {
                96: "fontSizes.display",
                64: "fontSizes.h1",
                48: "fontSizes.h2",
                36: "fontSizes.h3",
                22: "fontSizes.body",
                18: "fontSizes.label",
                14: "fontSizes.caption",
                11: "fontSizes.meta",
            }
            suggestion = size_map.get(val, "nearest fontSizes.* token")
            issues.append(Issue(
                severity="warning",
                rule="POL-02",
                file=rel,
                line=i,
                message=f"Hardcoded fontSize {val} — use {suggestion}",
                fix=f"Replace {val} with {suggestion}",
            ))
    return issues


def check_ghostly_opacity(filepath: Path, lines: list[str]) -> list[Issue]:
    """POL-03: Hex opacity suffixes below visibility threshold.

    Catches patterns like ${color}15, ${color}08, ${color}0A that produce
    near-invisible elements. Minimum useful opacity for backgrounds is ~20% (hex 33),
    for borders ~30% (hex 4D).
    """
    issues = []
    rel = str(filepath.relative_to(TEMPLATES_DIR))

    # Match ${something}XX where XX is a 2-char hex opacity suffix
    bg_pattern = re.compile(r'background.*\$\{[^}]+\}([0-9a-fA-F]{2})')
    border_pattern = re.compile(r'border.*\$\{[^}]+\}([0-9a-fA-F]{2})')

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue

        # Check backgrounds — warn if opacity < 0x18 (9%)
        for m in bg_pattern.finditer(line):
            hex_val = m.group(1)
            opacity = int(hex_val, 16)
            pct = round(opacity / 255 * 100)
            if opacity < 0x18:
                issues.append(Issue(
                    severity="warning",
                    rule="POL-03",
                    file=rel,
                    line=i,
                    message=f"Background opacity {hex_val} ({pct}%) is near-invisible — minimum ~15% (hex 25+)",
                    fix=f"Increase opacity suffix to at least 25 (15%)",
                ))

        # Check borders — warn if opacity < 0x25 (14%)
        for m in border_pattern.finditer(line):
            hex_val = m.group(1)
            opacity = int(hex_val, 16)
            pct = round(opacity / 255 * 100)
            if opacity < 0x25:
                issues.append(Issue(
                    severity="warning",
                    rule="POL-03",
                    file=rel,
                    line=i,
                    message=f"Border opacity {hex_val} ({pct}%) is near-invisible — minimum ~15% (hex 25+)",
                    fix=f"Increase opacity suffix to at least 30 (19%)",
                ))

    return issues


def check_content_area_usage(filepath: Path, lines: list[str]) -> list[Issue]:
    """POL-04: Templates with title-driven layout should use shared layout helpers."""
    issues = []
    rel = str(filepath.relative_to(TEMPLATES_DIR))
    template_name = filepath.parent.name

    if template_name in CONTENT_AREA_EXEMPT:
        return []
    if template_name in ("Episodes", "Shorts"):
        return []

    content = "\n".join(lines)
    has_content_area = "contentArea" in content
    has_chart_layout = "chartLayout(" in content
    has_title_block = "TitleBlock" in content or "title" in content.lower()
    has_safe_area_math = re.search(r'safeArea\.(top|left|right|bottom)', content)

    # If it has a title and manually does safe area math but doesn't use a shared
    # layout helper, nudge it toward the canonical contract. Cartesian charts
    # may use chartLayout() instead of contentArea().
    if has_title_block and has_safe_area_math and not (has_content_area or has_chart_layout):
        issues.append(Issue(
            severity="info",
            rule="POL-04",
            file=rel,
            line=0,
            message="Template has title + manual safeArea math but doesn't use shared layout helpers",
            fix="Use contentArea() for general templates or chartLayout() for cartesian chart templates",
        ))

    return issues


def check_dark_mode_hardcoding(filepath: Path, lines: list[str]) -> list[Issue]:
    """POL-05: Hardcoded 'light' or 'dark' in useThemeMode — should use data.backgroundVariant."""
    issues = []
    rel = str(filepath.relative_to(TEMPLATES_DIR))
    template_name = filepath.parent.name

    if template_name in ("Episodes", "Shorts"):
        return []

    # Only flag in the main component file, not sub-components that receive mode as prop
    pattern = re.compile(r'useThemeMode\(\s*["\'](?:light|dark)["\']\s*\)')

    for i, line in enumerate(lines, 1):
        if pattern.search(line):
            # Check if this is the main export component (not an internal sub-component)
            # Heuristic: if the file has data.backgroundVariant elsewhere, this hardcoding is wrong
            content = "\n".join(lines)
            if "backgroundVariant" in content:
                # Component has a backgroundVariant field but is ignoring it
                issues.append(Issue(
                    severity="warning",
                    rule="POL-05",
                    file=rel,
                    line=i,
                    message="useThemeMode hardcodes mode — should use data.backgroundVariant",
                    fix='useThemeMode(data.backgroundVariant || "light")',
                ))

    return issues


def check_hardcoded_palette_hex(filepath: Path, lines: list[str]) -> list[Issue]:
    """POL-07: Brand palette hex values used directly in CSS property assignments.

    These should be replaced with palette.* tokens so the component stays in sync
    when palette.json changes. Only flags CSS value positions (color:, backgroundColor:,
    borderColor:, fill:, stroke:) — not comparison expressions like .toLowerCase() === "#...".
    """
    issues = []
    rel = str(filepath.relative_to(TEMPLATES_DIR))

    # The 6 canonical brand hex values (both cases). Source: palette.json.
    PALETTE_MAP = {
        "#1c1814": "palette.ink",
        "#e5a544": "palette.amber",
        "#c23b22": "palette.rust",
        "#f0e6d0": "palette.bone",
        "#f5f0e8": "palette.paper",
        "#6b1d1d": "palette.oxblood",
    }

    # CSS properties that hold color values — the context where direct hex is wrong.
    CSS_COLOR_PROPS = re.compile(
        r'\b(color|backgroundColor|borderColor|fill|stroke|background)\s*:'
    )

    for i, line in enumerate(lines, 1):
        # Skip comparison expressions — those are fine (e.g. .toLowerCase() === "#...")
        if ".toLowerCase()" in line and "===" in line:
            continue
        # Skip comments
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue

        line_lower = line.lower()
        for hex_val, token in PALETTE_MAP.items():
            if hex_val not in line_lower:
                continue
            # Only flag if a CSS color property is present on the same line
            if not CSS_COLOR_PROPS.search(line):
                continue
            issues.append(Issue(
                severity="warning",
                rule="POL-07",
                file=rel,
                line=i,
                message=f"Hardcoded palette hex {hex_val!r} — use {token}",
                fix=f"Replace with {token} from palette import",
            ))

    return issues


def check_background_redundancy(filepath: Path, lines: list[str]) -> list[Issue]:
    """POL-06: Redundant backgroundColor on AbsoluteFill when Background component is used."""
    issues = []
    rel = str(filepath.relative_to(TEMPLATES_DIR))

    content = "\n".join(lines)
    has_background_component = "<Background" in content

    if not has_background_component:
        return []

    # Check for backgroundColor on AbsoluteFill
    bg_color_pattern = re.compile(r'AbsoluteFill.*backgroundColor', re.DOTALL)
    # Simpler: just check for backgroundColor: theme.bg.base near AbsoluteFill
    for i, line in enumerate(lines, 1):
        if "AbsoluteFill" in line and "backgroundColor" in line:
            issues.append(Issue(
                severity="info",
                rule="POL-06",
                file=rel,
                line=i,
                message="AbsoluteFill has backgroundColor but Background component already handles this",
                fix="Remove backgroundColor from AbsoluteFill style",
            ))

    return issues


def check_hardcoded_palette_hex(filepath: Path, lines: list[str]) -> list[Issue]:
    """POL-07: Brand palette hex values used directly in CSS property assignments.

    Catches both current palette values and stale/old values that were valid
    in a previous version of palette.json but are no longer in the brand.
    Skips comparison expressions (isLightPiece === "#...") and comment lines.
    """
    issues = []
    rel = str(filepath.relative_to(TEMPLATES_DIR))

    # Hex → canonical token name. Includes stale aliases so old values are flagged.
    PALETTE_MAP = {
        "#1c1814": "palette.ink",
        "#2a2520": "palette.midnight",
        "#5c4a3d": "palette.walnut",
        "#8b7355": "palette.umber",
        "#b8a189": "palette.taupe",
        "#d9c9b0": "palette.sand",
        "#f0e6d0": "palette.bone",
        "#f5f0e8": "palette.paper",
        "#c4a747": "palette.gold",
        "#4a7ba7": "semantic.us",
        "#a64d46": "semantic.china",
        # Stale — old palette values that no longer match palette.json
        "#e5a544": "palette.gold (stale amber — update to palette.gold)",
        "#c23b22": "palette.rust (stale rust — update to palette.rust)",
        "#6b1d1d": "palette.walnut (stale oxblood — update to palette.walnut)",
    }

    CSS_COLOR_PROPS = re.compile(
        r'\b(color|backgroundColor|borderColor|fill|stroke|background)\s*:'
    )

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        # Skip comments
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        # Skip lines that are comparison expressions (luminance heuristics etc.)
        if ".toLowerCase()" in line and "===" in line:
            continue
        # Only check lines that have a CSS color property assignment
        if not CSS_COLOR_PROPS.search(line):
            continue

        line_lower = stripped.lower()
        for hex_val, token_name in PALETTE_MAP.items():
            if hex_val in line_lower:
                issues.append(Issue(
                    severity="warning",
                    rule="POL-07",
                    file=rel,
                    line=i,
                    message=f"Hardcoded palette hex {hex_val} — use {token_name}",
                    fix=f"Import palette/semantic from theme.ts and replace {hex_val} with {token_name}",
                ))

    return issues


def check_linear_interpolation(filepath: Path, lines: list[str]) -> list[Issue]:
    """POL-08: interpolate() without an easing config produces linear motion (A1).

    Flags bare `interpolate(` calls where no easing evidence appears within
    15 lines — wide enough to capture multi-line calls where CLAMP_* is on
    a line 4-6 below the opening parenthesis. Excludes interpolateColors().
    """
    issues = []
    rel = str(filepath.relative_to(TEMPLATES_DIR))

    bare_interp = re.compile(r'\binterpolate(?!Colors)\s*\(')
    # CLAMP_* constants, explicit easing: key, Easing.*, spring helpers, named easing vars,
    # or a // linear-ok suppression comment acknowledging intentional linear motion.
    has_easing = re.compile(
        r'CLAMP_|Easing\.|easing\s*:|spring\(|springConfig|easings\.|barEasing|growEasing|exitEasing|linear-ok'
    )

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        if not bare_interp.search(line):
            continue
        # 15-line window: 2 before + current + 12 after — covers multi-line call bodies
        window = "\n".join(lines[max(0, i - 3):min(len(lines), i + 12)])
        if not has_easing.search(window):
            issues.append(Issue(
                severity="info",
                rule="POL-08",
                file=rel,
                line=i,
                message="interpolate() with no easing visible in 15-line window — may be linear (A1)",
                fix="Add CLAMP_QUAD/CLAMP_SINE as 4th arg, or switch to fadeIn()/slideIn() helpers",
            ))

    return issues


def check_missing_max_width(filepath: Path, lines: list[str]) -> list[Issue]:
    """POL-09: Large text (h1/h2/display tokens) without maxWidth risks full-viewport wrapping (L9)."""
    issues = []
    rel = str(filepath.relative_to(TEMPLATES_DIR))

    # Only fire on explicit fontSizes.* token references for h1/h2/display scale
    large_font = re.compile(r'fontSize:\s*fontSizes\.(h1|h2|display|title)\b')

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        if not large_font.search(line):
            continue
        # Check 10-line window ahead for maxWidth
        window = "\n".join(lines[max(0, i - 2):min(len(lines), i + 10)])
        if "maxWidth" not in window:
            issues.append(Issue(
                severity="info",
                rule="POL-09",
                file=rel,
                line=i,
                message="Large text without maxWidth — can span full 1920px if unconstrained (L9)",
                fix="Add maxWidth from textMaxWidth tokens: textMaxWidth.h1 (1400) / textMaxWidth.h2 (1200)",
            ))

    return issues


def check_inline_shadows(filepath: Path, lines: list[str]) -> list[Issue]:
    """POL-10: Shadow values should use shadows.* tokens from theme.ts (L12).

    Flags boxShadow/textShadow with literal string values that don't reference
    a shadows.* token. Template literals augmenting tokens (e.g. `${shadows.medium}, ...`)
    are exempt because they extend a token rather than bypass it.
    """
    issues = []
    rel = str(filepath.relative_to(TEMPLATES_DIR))

    shadow_prop = re.compile(r'\b(boxShadow|textShadow)\s*:')
    # Literal string: quote or backtick immediately after the colon+space
    shadow_literal = re.compile(r'\b(boxShadow|textShadow)\s*:\s*["`\']')
    exempt_values = re.compile(r'"none"|\'none\'|shadows\.|undefined')

    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        if not shadow_prop.search(line):
            continue
        if not shadow_literal.search(line):
            continue
        if exempt_values.search(line):
            continue
        issues.append(Issue(
            severity="info",
            rule="POL-10",
            file=rel,
            line=i,
            message="Inline shadow string — use shadows.subtle / shadows.medium / shadows.accentGlow(color) (L12)",
            fix="Import shadows from theme.ts and replace inline string with shadows.* token",
        ))

    return issues


def check_svg_transform_box(filepath: Path, lines: list[str]) -> list[Issue]:
    """POL-11: CSS transforms on SVG elements need transformBox: 'fill-box'.

    When a CSS `transform` style is applied to an SVG element (<svg>, <g>,
    <rect>, <circle>, <path>, <ellipse>, <text>, <line>, <polyline>, <polygon>),
    the default transform-origin resolves against the SVG viewport (top-left),
    not the element's own bounding box. Without `transformBox: 'fill-box'`,
    scale/rotate animations pivot from the wrong point.

    SVG *attribute* transforms (transform="translate(x,y) scale(s)") are
    exempt — they already encode the pivot explicitly via translate-scale-translate.
    This rule only targets inline `style={{ transform: ... }}` on SVG elements.

    Note: `transformBox: 'fill-box'` must accompany `transformOrigin` when set,
    or the origin resolves against the wrong coordinate system regardless.
    """
    issues = []
    rel = str(filepath.relative_to(TEMPLATES_DIR))

    svg_elements = re.compile(
        r'<(svg|g|rect|circle|path|ellipse|text|line|polyline|polygon)\b'
    )
    # CSS style transform (style prop, not SVG attribute)
    css_transform = re.compile(r'\btransform\s*:\s*["`\']|transform\s*:\s*\w')
    has_transform_box = re.compile(r'\btransformBox\b')

    # Scan for SVG elements whose style block has transform but no transformBox.
    # Simple line-by-line heuristic: flag a line that is both inside an SVG
    # element open tag AND has a CSS transform without transformBox on the same line.
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        # Only flag lines that reference a CSS-style transform on an SVG element
        if not css_transform.search(line):
            continue
        if has_transform_box.search(line):
            continue
        # Check surrounding context (±5 lines) for an SVG element opening tag
        ctx_start = max(0, i - 6)
        ctx_end = min(len(lines), i + 2)
        ctx = "\n".join(lines[ctx_start:ctx_end])
        if not svg_elements.search(ctx):
            continue
        # Exclude SVG attribute transforms (no `style` keyword on the line)
        if "style=" not in line and "style:{" not in line and "style: {" not in line:
            # This is likely an SVG attribute transform — skip
            continue
        issues.append(Issue(
            severity="warning",
            rule="POL-11",
            file=rel,
            line=i,
            message="CSS transform on SVG element without transformBox: 'fill-box' — pivot defaults to viewport top-left",
            fix="Add transformBox: 'fill-box' alongside transformOrigin to anchor transforms to the element's own bounding box",
        ))

    return issues


def check_duplicate_compositions(episode_dir: Path) -> list[Issue]:
    """DATA-01: Detect data files that cover the same content (potential duplicates)."""
    issues = []
    if not episode_dir.exists():
        return []

    # Group files by template type prefix
    files_by_prefix: dict[str, list[str]] = defaultdict(list)
    for f in sorted(episode_dir.glob("*.json")):
        if f.name == "assembly-manifest.json":
            continue
        # Extract template prefix (e.g., "timeline" from "timeline-oil-chips.json")
        parts = f.stem.split("-")
        prefix = parts[0] if parts else f.stem
        files_by_prefix[prefix].append(f.name)

    # Also check across similar template types
    timeline_files = []
    for f in episode_dir.glob("*.json"):
        if any(x in f.stem for x in ["timeline", "dual-timeline"]):
            timeline_files.append(f.name)

    if len(timeline_files) > 1:
        # Check if they reference similar content by comparing titles
        titles = {}
        for fname in timeline_files:
            with open(episode_dir / fname) as fh:
                data = json.load(fh)
                titles[fname] = data.get("title", "")

        # Check for similar titles (crude but effective)
        seen_words: dict[str, str] = {}
        for fname, title in titles.items():
            key_words = frozenset(w.lower() for w in title.split() if len(w) > 3)
            for existing_words, existing_file in seen_words.items():
                overlap = key_words & frozenset(existing_words.split("|"))
                if len(overlap) >= 2:
                    rel = str(episode_dir.relative_to(DATA_DIR))
                    issues.append(Issue(
                        severity="warning",
                        rule="DATA-01",
                        file=rel,
                        line=0,
                        message=f"Possible duplicate: {fname} and {existing_file} share title words: {overlap}",
                        fix="Remove one if they cover the same content",
                    ))
            seen_words["|".join(key_words)] = fname

    return issues


def check_data_file_references(episode_tsx: Path) -> list[Issue]:
    """DATA-02: Check that all imported data files exist and all data files are imported."""
    issues = []
    if not episode_tsx.exists():
        return []

    content = episode_tsx.read_text()
    rel = str(episode_tsx.relative_to(TEMPLATES_DIR))

    # Extract all JSON imports
    import_pattern = re.compile(r'import\s+\w+\s+from\s+"[^"]*?/data/episodes/(\w+)/([^"]+\.json)"')
    imported_files: dict[str, int] = {}
    for i, line in enumerate(content.split("\n"), 1):
        m = import_pattern.search(line)
        if m:
            ep = m.group(1)
            fname = m.group(2)
            imported_files[fname] = i

    # Check data directory for JSON files
    ep_dir = DATA_DIR / "silicon-trap"
    if ep_dir.exists():
        actual_files = {f.name for f in ep_dir.glob("*.json") if f.name != "assembly-manifest.json"}

        # Files imported but don't exist
        for fname, line_num in imported_files.items():
            if fname not in actual_files:
                issues.append(Issue(
                    severity="error",
                    rule="DATA-02",
                    file=rel,
                    line=line_num,
                    message=f"Imported data file {fname} does not exist in data/episodes/silicon-trap/",
                    fix="Remove import or create the missing JSON file",
                ))

        # Files that exist but aren't imported (may be intentional for deprecated files)
        for fname in sorted(actual_files - set(imported_files.keys())):
            issues.append(Issue(
                severity="info",
                rule="DATA-02",
                file=f"silicon-trap/{fname}",
                line=0,
                message=f"Data file exists but is not imported in silicon-trap episode file",
                fix="Import in silicon-trap episode file or move to _deprecated/",
            ))

    return issues


def check_data_schema_fields(data_dir: Path) -> list[Issue]:
    """DATA-03: Validate JSON data files have required base fields."""
    issues = []
    recommended_fields = {"durationSec", "backgroundVariant"}

    # Template types that use alternative title fields (not "title")
    TITLE_ALTERNATIVES = {
        "kinetic": {"text", "quote", "statLabel", "statValue", "term"},  # KineticTypography variants
        "title": {"sectionTitle", "ctaText"},  # TitleTransition (incl. end-card variant)
    }

    for ep_dir in sorted(data_dir.iterdir()):
        if not ep_dir.is_dir():
            continue
        for json_file in sorted(ep_dir.glob("*.json")):
            if json_file.name in ("assembly-manifest.json",):
                continue
            try:
                with open(json_file) as f:
                    data = json.load(f)
            except json.JSONDecodeError as e:
                rel = str(json_file.relative_to(data_dir))
                issues.append(Issue(
                    severity="error",
                    rule="DATA-03",
                    file=rel,
                    line=0,
                    message=f"Invalid JSON: {e}",
                    fix="Fix JSON syntax",
                ))
                continue

            rel = str(json_file.relative_to(data_dir))

            # Thumbnail files store all their fields one level deeper under "data"
            # because the Thumbnail composition accepts { data: ThumbnailData } as props.
            # Unwrap for validation purposes so the checks below work uniformly.
            prefix = json_file.stem.split("-")[0]
            effective = data.get("data", data) if prefix == "thumbnail" else data

            # Check episode field (universally required)
            if "episode" not in effective:
                issues.append(Issue(
                    severity="error",
                    rule="DATA-03",
                    file=rel,
                    line=0,
                    message="Missing required field: episode",
                    fix='Add "episode" to the JSON data',
                ))

            # Check title field — but allow template-specific alternatives
            thumb_title_fields = {"titleText", "heroText", "symbolTitle"}
            alt_fields = (TITLE_ALTERNATIVES.get(prefix, set()) |
                          (thumb_title_fields if prefix == "thumbnail" else set()))
            has_title = "title" in effective or any(f in effective for f in alt_fields)
            if not has_title:
                issues.append(Issue(
                    severity="error",
                    rule="DATA-03",
                    file=rel,
                    line=0,
                    message=f"Missing title field (checked: title, {', '.join(alt_fields) if alt_fields else 'no alternatives'})",
                    fix='Add "title" or an appropriate title-like field',
                ))

            # Check recommended fields
            # Thumbnail files are static renders — durationSec and backgroundVariant
            # are meaningless for them; the outer wrapper sets those at render time.
            for field in recommended_fields:
                if prefix == "thumbnail":
                    continue
                if field not in effective:
                    issues.append(Issue(
                        severity="info",
                        rule="DATA-03",
                        file=rel,
                        line=0,
                        message=f"Missing recommended field: {field}",
                        fix=f'Add "{field}" for explicit control',
                    ))

            # Template-specific structural checks
            stem = json_file.stem.lower()

            # DecisionTree needs nodes (check before "timeline" to avoid
            # false positive on "decisiontree-ai-timeline")
            if "decisiontree" in stem:
                if "nodes" not in data:
                    issues.append(Issue(
                        severity="error",
                        rule="DATA-03",
                        file=rel,
                        line=0,
                        message="DecisionTree data missing 'nodes' array",
                        fix="Add nodes: [{id, label, ...}]",
                    ))

            # DualTimeline needs pairs array
            elif "dual-timeline" in stem:
                if "pairs" not in data:
                    issues.append(Issue(
                        severity="error",
                        rule="DATA-03",
                        file=rel,
                        line=0,
                        message="DualTimeline data missing 'pairs' array",
                        fix="Add pairs: [{eraA: {...}, eraB: {...}}]",
                    ))

            # TimelineComparison needs leftEvents/rightEvents.
            # HorizontalTimeline uses "pairs" instead — exclude those files.
            elif "timeline" in stem and "timeseries" not in stem and "morph" not in stem and "pairs" not in data:
                if "leftEvents" not in data and "events" not in data:
                    issues.append(Issue(
                        severity="error",
                        rule="DATA-03",
                        file=rel,
                        line=0,
                        message="TimelineComparison data missing 'leftEvents' array",
                        fix="Add leftEvents and rightEvents arrays",
                    ))

            # DataChart needs dataPoints or bars.
            # "lines" is the TimeSeriesChart format — also accepted.
            elif "chart" in stem and "timeseries" not in stem:
                if ("dataPoints" not in data and "bars" not in data and "series" not in data
                        and "comparisonPairs" not in data and "lines" not in data):
                    issues.append(Issue(
                        severity="warning",
                        rule="DATA-03",
                        file=rel,
                        line=0,
                        message="Chart data has no dataPoints/bars/series array",
                        fix="Ensure the chart has renderable data",
                    ))

            # DecisionTree needs nodes
            elif "decisiontree" in stem:
                if "nodes" not in data:
                    issues.append(Issue(
                        severity="error",
                        rule="DATA-03",
                        file=rel,
                        line=0,
                        message="DecisionTree data missing 'nodes' array",
                        fix="Add nodes: [{id, label, ...}]",
                    ))

            # GameBoard needs phases
            elif "gameboard" in stem:
                if "phases" not in data:
                    issues.append(Issue(
                        severity="error",
                        rule="DATA-03",
                        file=rel,
                        line=0,
                        message="GameBoard data missing 'phases' array",
                        fix="Add phases: [{label, durationSec, ...}]",
                    ))

            # Framework needs columns, items, nodes (flow variant), or cells (matrix variant)
            elif "framework" in stem:
                if ("columns" not in data and "items" not in data
                        and "nodes" not in data and "cells" not in data):
                    issues.append(Issue(
                        severity="warning",
                        rule="DATA-03",
                        file=rel,
                        line=0,
                        message="FrameworkDiagram data has no columns/items/nodes/cells array",
                        fix="Ensure the framework has renderable content",
                    ))

    return issues


def check_episode_clip_count(episode_tsx: Path) -> list[Issue]:
    """DATA-04: Verify clip count in index.tsx matches actual clips array."""
    issues = []
    if not episode_tsx.exists():
        return []

    content = episode_tsx.read_text()

    # Count clip entries (objects with filename: "...")
    clip_count = len(re.findall(r'filename:\s*"[^"]+\.json"', content))

    # Check index.tsx for declared count
    index_path = episode_tsx.parent / "index.tsx"
    if index_path.exists():
        index_content = index_path.read_text()
        m = re.search(r'has (\d+) clips', index_content)
        if m:
            declared = int(m.group(1))
            if declared != clip_count:
                issues.append(Issue(
                    severity="warning",
                    rule="DATA-04",
                    file="Episodes/index.tsx",
                    line=0,
                    message=f"Comment says {declared} clips but silicon-trap episode file has {clip_count}",
                    fix=f"Update comment and duration constants to reflect {clip_count} clips",
                ))

        # Check total seconds constant
        m = re.search(r'TOTAL_CLIP_SECONDS\s*=\s*(\d+)', index_content)
        if m:
            declared_seconds = int(m.group(1))
            # Calculate actual total from data files
            total_secs = 0
            for match in re.finditer(r'filename:\s*"([^"]+\.json)"', content):
                fname = match.group(1)
                data_path = DATA_DIR / "silicon-trap" / fname
                if data_path.exists():
                    with open(data_path) as f:
                        data = json.load(f)
                    dur = data.get("durationSec", 0)
                    total_secs += dur

            if total_secs > 0 and abs(total_secs - declared_seconds) > 5:
                issues.append(Issue(
                    severity="warning",
                    rule="DATA-04",
                    file="Episodes/index.tsx",
                    line=0,
                    message=f"SILICON_TRAP_TOTAL_CLIP_SECONDS={declared_seconds} but actual sum is {total_secs}",
                    fix=f"Update SILICON_TRAP_TOTAL_CLIP_SECONDS to {total_secs}",
                ))

    return issues


# ── Runner ──────────────────────────────────────────────────────────────────

def lint_templates() -> list[Issue]:
    """Run all template code checks."""
    issues = []

    for template_dir in sorted(TEMPLATES_DIR.iterdir()):
        if not template_dir.is_dir():
            continue
        if template_dir.name in ("Episodes", "Shorts"):
            continue

        # Find main component file
        tsx_files = list(template_dir.glob("*.tsx"))
        for tsx_file in tsx_files:
            if tsx_file.name in ("types.ts", "schema.ts", "index.tsx"):
                continue

            lines = tsx_file.read_text().split("\n")
            issues.extend(check_hardcoded_pixels(tsx_file, lines))
            issues.extend(check_hardcoded_font_sizes(tsx_file, lines))
            issues.extend(check_ghostly_opacity(tsx_file, lines))
            issues.extend(check_content_area_usage(tsx_file, lines))
            issues.extend(check_dark_mode_hardcoding(tsx_file, lines))
            issues.extend(check_background_redundancy(tsx_file, lines))
            issues.extend(check_hardcoded_palette_hex(tsx_file, lines))
            issues.extend(check_linear_interpolation(tsx_file, lines))
            issues.extend(check_missing_max_width(tsx_file, lines))
            issues.extend(check_inline_shadows(tsx_file, lines))
            issues.extend(check_svg_transform_box(tsx_file, lines))

    return issues


def lint_data() -> list[Issue]:
    """Run all data file checks."""
    issues = []

    if DATA_DIR.exists():
        issues.extend(check_data_schema_fields(DATA_DIR))
        for ep_dir in sorted(DATA_DIR.iterdir()):
            if ep_dir.is_dir():
                issues.extend(check_duplicate_compositions(ep_dir))

    silicon_trap_tsx = EPISODES_DIR / "SiliconTrap.tsx"
    issues.extend(check_data_file_references(silicon_trap_tsx))
    issues.extend(check_episode_clip_count(silicon_trap_tsx))

    return issues


def format_issues(issues: list[Issue], show_fixes: bool = False) -> str:
    """Format issues for terminal output."""
    if not issues:
        return "  ✓ All clear\n"

    # Group by severity
    errors = [i for i in issues if i.severity == "error"]
    warnings = [i for i in issues if i.severity == "warning"]
    infos = [i for i in issues if i.severity == "info"]

    lines = []

    for severity, group, icon in [
        ("error", errors, "✗"),
        ("warning", warnings, "△"),
        ("info", infos, "·"),
    ]:
        if not group:
            continue
        lines.append(f"\n  {severity.upper()} ({len(group)}):")
        for issue in group:
            loc = f"{issue.file}"
            if issue.line > 0:
                loc += f":{issue.line}"
            lines.append(f"    {icon} [{issue.rule}] {loc}")
            lines.append(f"      {issue.message}")
            if show_fixes and issue.fix:
                lines.append(f"      → {issue.fix}")

    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description="Remotion Template Linter")
    parser.add_argument("--templates-only", action="store_true", help="Only run template code checks")
    parser.add_argument("--data-only", action="store_true", help="Only run data file checks")
    parser.add_argument("--fix-suggestions", action="store_true", help="Show fix suggestions")
    parser.add_argument("--json", action="store_true", help="Output JSON instead of text")
    args = parser.parse_args()

    all_issues: list[Issue] = []

    print("╔══════════════════════════════════════════╗")
    print("║  Remotion Template Linter                ║")
    print("╚══════════════════════════════════════════╝\n")

    if not args.data_only:
        print("── Template Code Checks ─────────────────────")
        template_issues = lint_templates()
        all_issues.extend(template_issues)
        print(format_issues(template_issues, args.fix_suggestions))

    if not args.templates_only:
        print("── Data File Checks ─────────────────────────")
        data_issues = lint_data()
        all_issues.extend(data_issues)
        print(format_issues(data_issues, args.fix_suggestions))

    # Summary
    errors = sum(1 for i in all_issues if i.severity == "error")
    warnings = sum(1 for i in all_issues if i.severity == "warning")
    infos = sum(1 for i in all_issues if i.severity == "info")

    print(f"── Summary ──────────────────────────────────")
    print(f"  {errors} errors · {warnings} warnings · {infos} info")

    if args.json:
        output = [
            {
                "severity": i.severity,
                "rule": i.rule,
                "file": i.file,
                "line": i.line,
                "message": i.message,
                "fix": i.fix,
            }
            for i in all_issues
        ]
        print(json.dumps(output, indent=2))

    if errors > 0:
        print(f"\n  ✗ {errors} errors — render may crash or look broken")
        sys.exit(2)
    elif warnings > 0:
        print(f"\n  △ {warnings} warnings — render is safe but polish may suffer")
        sys.exit(1)
    else:
        print(f"\n  ✓ All checks passed")
        sys.exit(0)


if __name__ == "__main__":
    main()
