#!/usr/bin/env python3
"""
polish-lint.py — AST-level design rule enforcement for Remotion templates.

Scans template TSX files for violations of POLISH.md rules:
  - Magic pixel numbers instead of spacing tokens (L1)
  - Direct light.text.* / dark.text.* references instead of useThemeMode (L14)
  - Missing maxWidth on text elements (L9)
  - Hardcoded textShadow strings instead of shadows.textLift (V7/L12)
  - Hardcoded box-shadow strings instead of shadows.* tokens (L12)
  - Missing TitleBlock usage in eligible templates (L13)
  - Linear interpolation without easing (A1)
  - Hardcoded padding values instead of cardPadding token (L10)
  - Magic safe-area offsets (+ 40, + 60, + 120, etc.) (L7)

Usage:
    python polish-lint.py                    # lint all templates
    python polish-lint.py DataChart          # lint one template
    python polish-lint.py --json             # machine-readable output
    python polish-lint.py --summary          # counts only

Exit code: number of violations found (0 = clean).
"""

import re
import sys
import json
import os
from pathlib import Path
from dataclasses import dataclass, field, asdict
from typing import Optional

# ─── Configuration ───────────────────────────────────────────────────────────

TEMPLATES_DIR = Path(__file__).resolve().parent.parent.parent / "remotion-templates" / "src" / "templates"

# Templates exempt from TitleBlock (L13) — they have legitimate reasons
TITLEBLOCK_EXEMPT = {
    "KineticTypography",   # IS the text
    "TitleTransition",     # Full-screen title
    "ChoroplethMap",       # Overlay-style title
    "TimelineComparison",  # Dual column headers
    "NetworkDiagram",      # SVG text
    "ImageComposite",      # No title block pattern
    "PhotoMontage",        # Montage layout
    "SplitComposition",    # Split layout
    "EP01",                # Episode composition (orchestrator)
    "EP01Full",            # Full episode composition (orchestrator)
    "FullEpisode",         # Generic episode player
    "KineticShort",        # Shorts variant
    "DataChartShort",      # Shorts variant
    "SplitShort",          # Shorts variant
}

# Valid 8px grid multiples (0-256 range covers all reasonable spacing)
VALID_SPACING = {i * 8 for i in range(33)}  # 0, 8, 16, 24, ..., 256

# ─── Rules ───────────────────────────────────────────────────────────────────

@dataclass
class Violation:
    rule: str           # e.g. "L1", "L12", "A1"
    file: str           # relative path
    line: int           # 1-indexed
    message: str        # human-readable description
    snippet: str        # the offending line (trimmed)
    severity: str = "warning"  # "warning" or "error"


def check_magic_numbers(lines: list[str], relpath: str) -> list[Violation]:
    """L1: No arbitrary spacing values — must be multiples of 8 via tokens."""
    violations = []
    # Match spacing properties: margin, padding, gap, positional offsets
    # Exclude width/height (element sizing is not spacing)
    pattern = re.compile(
        r'(?:margin|padding|gap)'
        r'(?:Top|Bottom|Left|Right)?'
        r'\s*[:=]\s*(\d+)'
    )
    # Exclude lines that use tokens (layout.spacing.*, layout.safeArea.*, contentArea, columnLayout)
    token_pattern = re.compile(
        r'layout\.|spacing\.|safeArea|contentArea|columnLayout|fontSizes?\.|'
        r'textMaxWidth|cardPadding|titleHeight|shadows\.'
    )
    for i, line in enumerate(lines, 1):
        # Skip comments, imports, type definitions
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*") or stripped.startswith("import "):
            continue
        if stripped.startswith("type ") or stripped.startswith("interface "):
            continue
        # Skip lines that already use tokens
        if token_pattern.search(line):
            continue
        for m in pattern.finditer(line):
            val = int(m.group(1))
            # Allow 0-6 (borders, fine adjustments below grid threshold)
            if val <= 6:
                continue
            # Allow 100 (percentage-like in certain contexts)
            if val == 100 and "%" in line:
                continue
            # Check if it's a valid 8px grid value
            if val not in VALID_SPACING:
                violations.append(Violation(
                    rule="L1",
                    file=relpath,
                    line=i,
                    message=f"Magic number {val}px — not on 8px grid. Use layout.spacing.* token.",
                    snippet=stripped,
                ))
    return violations


def check_direct_theme_refs(lines: list[str], relpath: str) -> list[Violation]:
    """L14: Use useThemeMode(), never reference light.text.* or dark.text.* directly."""
    violations = []
    pattern = re.compile(r'\b(light|dark)\.(text|bg|accent|mark|shadow)\b')
    # Exclude theme.ts itself and the hook definition
    if "theme.ts" in relpath or "useThemeMode" in relpath:
        return []
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*") or stripped.startswith("import "):
            continue
        for m in pattern.finditer(line):
            violations.append(Violation(
                rule="L14",
                file=relpath,
                line=i,
                message=f"Direct '{m.group(0)}.*' reference. Use useThemeMode() hook instead.",
                snippet=stripped,
                severity="error",
            ))
    return violations


def check_hardcoded_shadows(lines: list[str], relpath: str) -> list[Violation]:
    """L12: No hardcoded shadow strings — use shadows.* tokens."""
    violations = []
    # Match inline shadow strings like "0 2px 12px rgba(...)" or "0px 4px 20px"
    pattern = re.compile(r'["\']0\s+\d+px\s+\d+px\s+rgba')
    # Exclude theme.ts (where shadows are defined)
    if "theme.ts" in relpath:
        return []
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        if pattern.search(line):
            # Allow if the line also references shadows.* token
            if "shadows." in line:
                continue
            violations.append(Violation(
                rule="L12",
                file=relpath,
                line=i,
                message="Hardcoded shadow string. Use shadows.subtle / shadows.medium / shadows.accentGlow().",
                snippet=stripped,
            ))
    return violations


def check_hardcoded_textshadow(lines: list[str], relpath: str) -> list[Violation]:
    """V7/L12: textShadow should use shadows.textLift, not inline strings."""
    violations = []
    pattern = re.compile(r'textShadow\s*:\s*["\']')
    if "theme.ts" in relpath or "useThemeMode" in relpath:
        return []
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        if pattern.search(line):
            if "shadows.textLift" in line or "theme.textShadow" in line:
                continue
            violations.append(Violation(
                rule="L12",
                file=relpath,
                line=i,
                message="Hardcoded textShadow string. Use shadows.textLift or theme.textShadow.",
                snippet=stripped,
            ))
    return violations


def check_missing_titleblock(lines: list[str], relpath: str, template_name: str) -> list[Violation]:
    """L13: Eligible templates must use <TitleBlock>, not hand-built titles."""
    if template_name in TITLEBLOCK_EXEMPT:
        return []
    content = "\n".join(lines)
    if "TitleBlock" in content:
        return []
    # Check if there's a hand-built title pattern (fontSize + fontWeight + absolute positioning)
    has_title_pattern = (
        re.search(r'fontSize.*(?:h2|48|fontSizes)', content) and
        re.search(r'fontWeight.*(?:700|semibold|bold)', content)
    )
    if has_title_pattern:
        return [Violation(
            rule="L13",
            file=relpath,
            line=1,
            message=f"Template '{template_name}' has hand-built title block. Use <TitleBlock> component.",
            snippet="(file-level check)",
            severity="error",
        )]
    return []


def check_linear_interpolation(lines: list[str], relpath: str) -> list[Violation]:
    """A1: No linear interpolation — every interpolate() must have easing config."""
    violations = []
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        # Match interpolate( without an easing or extrapolateRight nearby
        if "interpolate(" in line and "easing" not in line.lower():
            # Check preceding comment for lint suppression (easing: justification)
            prev_line = lines[i-2].strip() if i >= 2 else ""
            if prev_line.startswith("//") and "easing:" in prev_line.lower():
                continue
            # Check surrounding lines for easing config (multi-line calls span ~10 lines)
            context = "\n".join(lines[max(0, i-1):min(len(lines), i+12)])
            # CLAMP_SINE, CLAMP_CUBIC_INOUT etc. are pre-defined configs with easing
            has_easing = (
                "easing" in context.lower()
                or "Easing" in context
                or re.search(r'\bCLAMP(?:_\w+)?\b', context)
            )
            if not has_easing:
                violations.append(Violation(
                    rule="A1",
                    file=relpath,
                    line=i,
                    message="interpolate() without easing config. Add easing: Easing.out(Easing.cubic).",
                    snippet=stripped,
                ))
    return violations


def check_magic_safe_area_offsets(lines: list[str], relpath: str) -> list[Violation]:
    """L7: No magic offsets on safeArea / safeAreaTier positions — use contentArea() helper."""
    violations = []
    # Match BOTH:
    #   - legacy:   layout.safeArea.top + 140
    #   - current:  layout.safeAreaTier.generous.top + 60
    # The (?:Tier\.\w+)? makes the tier segment optional; the trailing \.\w+
    # captures the side ("top" / "bottom" / "left" / "right").
    pattern = re.compile(r'safeArea(?:Tier\.\w+)?\.\w+\s*\+\s*(\d+)')
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        for m in pattern.finditer(line):
            val = int(m.group(1))
            # Allow small offsets that are spacing tokens (8, 16, 24, 32, 48, 64, 80)
            if val in VALID_SPACING and val <= 80:
                # Still flag if it looks like a title offset (> 48)
                if val > 48:
                    violations.append(Violation(
                        rule="L7",
                        file=relpath,
                        line=i,
                        message=f"safeArea offset +{val}px looks like title height. Use contentArea() helper.",
                        snippet=stripped,
                    ))
            elif val not in VALID_SPACING:
                violations.append(Violation(
                    rule="L7",
                    file=relpath,
                    line=i,
                    message=f"Magic offset +{val}px on safeArea. Use contentArea() or layout.spacing.* token.",
                    snippet=stripped,
                ))
    return violations


def check_hardcoded_padding(lines: list[str], relpath: str) -> list[Violation]:
    """L10: Card containers should use cardPadding token, not raw values."""
    violations = []
    # Match padding: "24px 28px" or "24px 32px" — the old hardcoded card padding
    pattern = re.compile(r'padding\s*:\s*["\'](\d+)px\s+(\d+)px["\']')
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        m = pattern.search(line)
        if m:
            if "cardPadding" in line:
                continue
            violations.append(Violation(
                rule="L10",
                file=relpath,
                line=i,
                message=f"Hardcoded padding '{m.group(0)}'. Use cardPadding.css token.",
                snippet=stripped,
            ))
    return violations


def check_missing_maxwidth(lines: list[str], relpath: str) -> list[Violation]:
    """L9: Multi-line text elements need maxWidth constraint."""
    violations = []
    # Simple heuristic: find large text blocks (fontSize >= 22) without maxWidth nearby
    # This is a soft check — it scans for fontSize declarations and looks for maxWidth within ±10 lines
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        if stripped.startswith("//") or stripped.startswith("*"):
            continue
        # Look for fontSize assignments using design tokens (body or larger)
        if re.search(r'fontSize\s*:\s*fontSizes\.(?:body|h[123]|display)', line):
            # Check surrounding 15 lines for maxWidth or container width constraint
            window = lines[max(0, i-8):min(len(lines), i+12)]
            window_text = "\n".join(window)
            # maxWidth, or parent has right: constraint (position-based width limit)
            has_constraint = (
                "maxWidth" in window_text
                or "textMaxWidth" in window_text
                or ("right:" in window_text and "left:" in window_text)  # position-constrained
                or "columnWidth" in window_text
            )
            if not has_constraint:
                violations.append(Violation(
                    rule="L9",
                    file=relpath,
                    line=i,
                    message="Text element with large fontSize but no maxWidth nearby. Add maxWidth from textMaxWidth tokens.",
                    snippet=stripped,
                    severity="warning",
                ))
    return violations


# ─── Runner ──────────────────────────────────────────────────────────────────

ALL_CHECKS = [
    check_magic_numbers,
    check_direct_theme_refs,
    check_hardcoded_shadows,
    check_hardcoded_textshadow,
    check_linear_interpolation,
    check_magic_safe_area_offsets,
    check_hardcoded_padding,
    check_missing_maxwidth,
]


def lint_file(filepath: Path, base: Path) -> list[Violation]:
    """Run all checks on a single template file."""
    relpath = str(filepath.relative_to(base))
    lines = filepath.read_text().splitlines()

    # Extract template name from path (e.g., "DataChart" from ".../DataChart/DataChart.tsx")
    template_name = filepath.parent.name
    if template_name in ("Shorts", "Episodes"):
        template_name = filepath.stem

    violations = []
    for check in ALL_CHECKS:
        violations.extend(check(lines, relpath))

    # File-level checks
    violations.extend(check_missing_titleblock(lines, relpath, template_name))

    return violations


def find_template_files(templates_dir: Path, filter_name: Optional[str] = None) -> list[Path]:
    """Find all template TSX files, optionally filtered by name."""
    files = []
    for tsx in sorted(templates_dir.rglob("*.tsx")):
        if tsx.name == "index.tsx" or ".test." in tsx.name:
            continue
        if filter_name:
            if filter_name.lower() not in tsx.stem.lower() and filter_name.lower() not in tsx.parent.name.lower():
                continue
        files.append(tsx)
    return files


def main():
    output_json = "--json" in sys.argv
    summary_only = "--summary" in sys.argv

    # Parse optional template filter
    filter_name = None
    for arg in sys.argv[1:]:
        if not arg.startswith("--"):
            filter_name = arg
            break

    templates_dir = TEMPLATES_DIR
    if not templates_dir.exists():
        print(f"Error: templates directory not found at {templates_dir}", file=sys.stderr)
        sys.exit(1)

    files = find_template_files(templates_dir, filter_name)
    if not files:
        print(f"No template files found" + (f" matching '{filter_name}'" if filter_name else ""))
        sys.exit(0)

    all_violations: list[Violation] = []
    file_results: dict[str, list[Violation]] = {}

    for f in files:
        relpath = str(f.relative_to(templates_dir.parent.parent))
        violations = lint_file(f, templates_dir.parent.parent)
        if violations:
            file_results[relpath] = violations
            all_violations.extend(violations)

    # ─── Output ──────────────────────────────────────────────────────────
    if output_json:
        print(json.dumps([asdict(v) for v in all_violations], indent=2))
    elif summary_only:
        # Count by rule
        rule_counts: dict[str, int] = {}
        for v in all_violations:
            rule_counts[v.rule] = rule_counts.get(v.rule, 0) + 1
        print(f"\n{'Rule':<8} {'Count':>6}  Description")
        print(f"{'─'*8} {'─'*6}  {'─'*40}")
        rule_descriptions = {
            "L1": "Magic pixel numbers (not on 8px grid)",
            "L7": "Magic safe-area offsets",
            "L9": "Missing maxWidth on text",
            "L10": "Hardcoded padding (use cardPadding)",
            "L12": "Hardcoded shadow/textShadow strings",
            "L13": "Missing TitleBlock component",
            "L14": "Direct light.*/dark.* theme references",
            "A1": "Linear interpolation (no easing)",
        }
        for rule in sorted(rule_counts):
            desc = rule_descriptions.get(rule, "")
            print(f"{rule:<8} {rule_counts[rule]:>6}  {desc}")
        print(f"\n{'TOTAL':<8} {len(all_violations):>6}")
        print(f"Files scanned: {len(files)}")
        print(f"Files with violations: {len(file_results)}")
    else:
        # Human-readable output
        if not all_violations:
            print(f"✓ All {len(files)} templates pass POLISH.md lint checks.")
            sys.exit(0)

        for relpath, violations in sorted(file_results.items()):
            print(f"\n{'━'*70}")
            print(f"  {relpath}  ({len(violations)} violation{'s' if len(violations) != 1 else ''})")
            print(f"{'━'*70}")
            for v in violations:
                severity_marker = "🔴" if v.severity == "error" else "🟡"
                print(f"  {severity_marker} [{v.rule}] L{v.line}: {v.message}")
                print(f"     │ {v.snippet[:100]}")
                print()

        # Summary footer
        errors = sum(1 for v in all_violations if v.severity == "error")
        warnings = sum(1 for v in all_violations if v.severity == "warning")
        print(f"\n{'─'*70}")
        print(f"  {len(all_violations)} violations ({errors} errors, {warnings} warnings) across {len(file_results)} files")
        print(f"  {len(files) - len(file_results)}/{len(files)} files clean")
        print(f"{'─'*70}\n")

    sys.exit(len(all_violations))


if __name__ == "__main__":
    main()
