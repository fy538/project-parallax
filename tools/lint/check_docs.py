#!/usr/bin/env python3
"""
check_docs.py — repo-wide documentation consistency lint.

Catches the four classes of doc-drift that bit us during the May-17 audits:

  1. **Template names referenced in family SELECTORs that don't exist as
     directories in `remotion-templates/src/templates/`.** Picks up
     references to deleted templates (BifurcationRoute, TimelineMorph) and
     typos in selector wall-tables.

  2. **Palette colors named in `remotion-templates/BRAND.md` with a hex
     value that disagrees with `tools/brand-treatment/palette.json`.** This
     is the "BRAND.md bomb" — the audit found BRAND.md describing colors
     that hadn't matched palette.json for an unknown period.

  3. **`npm run <script>` mentions in docs that don't resolve to a script
     in `remotion-templates/package.json`.** Catches stale references to
     scripts that were renamed (e.g., `npm run render:lambda` was renamed
     to `_lambda_scaffolded` on May 17 but CLAUDE.md still told users to
     run the old name).

  4. **Persona names from `data/personas.json` that don't appear in BOTH
     `skills/persona-eval/SKILL.md` AND `skills/publish-retro/SKILL.md`.**
     Catches the sister-skill drift that caused publish-retro to use a
     previously-deleted persona name (`Wei`) for an unknown period.

Usage:
    python3 tools/lint/check_docs.py              # report all violations; exit 0 unless --strict
    python3 tools/lint/check_docs.py --strict     # exit 1 if any violations
    python3 tools/lint/check_docs.py --check=palette  # run just one check
    python3 tools/lint/check_docs.py --json       # machine-readable output

Exits 0 by default, 1 in --strict mode if violations are found, 2 on usage error.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent

TEMPLATES_DIR = REPO_ROOT / "remotion-templates" / "src" / "templates"
SELECTOR_FILES = [
    REPO_ROOT / "remotion-templates" / "MAP_TEMPLATE_SELECTOR.md",
    REPO_ROOT / "remotion-templates" / "CHART_TEMPLATE_SELECTOR.md",
    REPO_ROOT / "remotion-templates" / "DIAGRAM_TEMPLATE_SELECTOR.md",
    REPO_ROOT / "remotion-templates" / "TIMELINE_TEMPLATE_SELECTOR.md",
    REPO_ROOT / "remotion-templates" / "TYPOGRAPHY_TEMPLATE_SELECTOR.md",
    REPO_ROOT / "remotion-templates" / "TEMPLATE_FAMILIES.md",
]
PALETTE_JSON = REPO_ROOT / "tools" / "brand-treatment" / "palette.json"
BRAND_MD = REPO_ROOT / "remotion-templates" / "BRAND.md"
PACKAGE_JSON = REPO_ROOT / "remotion-templates" / "package.json"
PERSONAS_JSON = REPO_ROOT / "data" / "personas.json"
PERSONA_SKILLS = [
    REPO_ROOT / "skills" / "persona-eval" / "SKILL.md",
    REPO_ROOT / "skills" / "publish-retro" / "SKILL.md",
]

# Docs that reference `npm run …` commands; verified against package.json scripts.
NPM_DOC_SOURCES = [
    REPO_ROOT / "CLAUDE.md",
    REPO_ROOT / "AGENTS.md",
    REPO_ROOT / "remotion-templates" / "CLAUDE.md",
    REPO_ROOT / "remotion-templates" / "POLISH.md",
    REPO_ROOT / "remotion-templates" / "BRAND.md",
    REPO_ROOT / "project" / "PRODUCTION_PIPELINE.md",
] + list((REPO_ROOT / "skills").glob("*/SKILL.md"))


# ─── Violation model ─────────────────────────────────────────────────────────

@dataclass
class Violation:
    check: str          # which check produced it: "template" | "palette" | "npm" | "persona"
    file: str           # repo-relative path
    line: int | None    # line number, None for whole-file findings
    pointer: str        # short identifier (e.g., "TilegramUSMap" or "amber")
    message: str
    severity: str = "error"  # "error" or "warning"

    def to_dict(self) -> dict:
        return {
            "check": self.check, "file": self.file, "line": self.line,
            "pointer": self.pointer, "message": self.message, "severity": self.severity,
        }


# ─── Check 1: template names exist as directories ────────────────────────────

# Templates known to be deleted; references should be marked as DELETED in the
# nearby context (the SELECTORs already have banners + ~~strikethrough~~ markers
# for these; we only fire if a usage is presented as live / pickable).
KNOWN_DELETED_TEMPLATES = {"BifurcationRoute", "TimelineMorph"}

# A "live" reference is one that looks like authoring guidance (e.g. an
# entry in a Markdown table or decision-tree branch that presents the
# template as a choice). We treat ANY mention as live unless the same line
# (or its sibling marker) carries one of these "this is dead" cues.
DEAD_CUES = [
    "DELETED", "~~", "deleted ", "deprecated", "no longer", "was Bifurc",
    "was Timeline", "see banner", "now part of", "successor to",
    "before the template", "before the template was deleted", "(legacy",
    "legacy)", "now-deleted", "the deleted ", "in legacy data",
]


def _list_live_templates() -> set[str]:
    """Return the set of template directory names under src/templates/."""
    if not TEMPLATES_DIR.is_dir():
        return set()
    excluded = {"Episodes", "Shorts", "Thumbnail", "AudioPreview", "EditorialTest"}
    return {p.name for p in TEMPLATES_DIR.iterdir() if p.is_dir() and p.name not in excluded}


def check_template_names() -> list[Violation]:
    """Verify every templatey-looking name in family SELECTORs exists."""
    live = _list_live_templates()
    violations: list[Violation] = []
    # Match `TemplateName` mentions: any of a curated set of CamelCase symbols
    # known to be template names. We avoid false positives by NOT scanning for
    # generic CamelCase — we use the union of (live templates ∪ known-deleted)
    # as the symbol set to look for.
    known_names = live | KNOWN_DELETED_TEMPLATES
    pattern = re.compile(r"\b(" + "|".join(re.escape(n) for n in known_names) + r")\b")

    for selector in SELECTOR_FILES:
        if not selector.is_file():
            continue
        rel = str(selector.relative_to(REPO_ROOT))
        text = selector.read_text(encoding="utf-8")
        lines = text.splitlines()
        for ln, line in enumerate(lines, 1):
            for match in pattern.finditer(line):
                name = match.group(1)
                if name in live:
                    continue  # OK
                # Deleted-template reference — only fire if no DEAD cue on this
                # line (or the previous two lines for banner context).
                context = "\n".join(lines[max(0, ln - 3):ln])
                if any(cue in context for cue in DEAD_CUES):
                    continue
                violations.append(Violation(
                    check="template", file=rel, line=ln, pointer=name,
                    message=(
                        f"`{name}` is referenced as a current template but it "
                        f"doesn't exist under `src/templates/` (deleted or typo). "
                        f"If it's intentionally referenced for migration context, "
                        f"add a DELETED marker or strikethrough on the same line."
                    ),
                    severity="error",
                ))
    return violations


# ─── Check 2: palette hex consistency (BRAND.md vs palette.json) ─────────────

PALETTE_NAME_HEX_PATTERN = re.compile(
    # Matches `name HEX` pairs where the hex is *adjacent* to the name —
    # within a single Markdown table cell, parens, or bare prose. The gap
    # accepts only connector characters (whitespace, backticks, quotes,
    # parens, brackets, `=` `:` `,`), NOT `|` or `#` (the table-cell
    # separator and the next hex's `#` would let the regex stride across
    # cells into unrelated hex values).
    #   | `gold` | `#C4A747` | role   → matches gold, #C4A747
    #   gold (#C4A747)                → matches gold, #C4A747
    #   gold #C4A747                  → matches gold, #C4A747
    #   gold = #C4A747                → matches gold, #C4A747
    #   gold | #C4A747                → DOES NOT match (`|` excluded —
    #                                    too easy to stride into the wrong
    #                                    cell on dense ramp tables)
    # To handle the markdown-table case `| `gold` | `#C4A747` |`, this
    # function processes lines twice: once with the regex on the raw line
    # (catches prose + tight tables) and once after splitting on `|` to
    # check each cell pair (catches loose tables).
    r"\b([a-z][a-z0-9_-]{2,15})\b"
    r"[\s`'\"():=,\[\]]{0,5}?"
    r"(#[0-9a-fA-F]{6})\b"
)


def _load_palette() -> dict[str, str]:
    """Return {name: hex} from palette.json (palette + semantic flattened)."""
    if not PALETTE_JSON.is_file():
        return {}
    data = json.loads(PALETTE_JSON.read_text(encoding="utf-8"))
    out: dict[str, str] = {}
    for cat in ("palette", "semantic"):
        for name, hex_val in data.get(cat, {}).items():
            out[name] = hex_val.lower()
    return out


def _scan_palette_pair(line: str, palette: dict[str, str]) -> list[tuple[str, str]]:
    """Return list of (name, claimed_hex) pairs found in `line` with a
    canonical mismatch. Used by check_palette_consistency below.

    Two passes:
      1. Raw line — catches prose + tight tables where name and hex are
         adjacent (regex above).
      2. Per-cell — splits the line on `|` and scans each cell with the
         same regex, catching loose-table cases where a cell holds
         `name` and the next cell holds `#HEX`. We pair consecutive cells
         only (no cross-cell stride).
    """
    bad: list[tuple[str, str]] = []
    # Pass 1: raw-line scan
    for m in PALETTE_NAME_HEX_PATTERN.finditer(line):
        name, claimed = m.group(1), m.group(2).lower()
        if name in palette and claimed != palette[name].lower():
            bad.append((name, claimed))
    # Pass 2: cell-pair scan for markdown tables `| name | hex | desc |`.
    # Only fires when:
    #   - the line is clearly a table row (starts with `|` or has >=3 pipes)
    #   - cell N contains EXACTLY ONE palette name (avoids alias-doc cells
    #     like `gold (legacy alias: amber)` which have multiple names)
    #   - cell N does NOT already contain the canonical hex (if it does,
    #     the row is correctly defining the color and any hex in the next
    #     cell is just description, not a value claim)
    #   - cell N+1 contains EXACTLY ONE hex (avoids Sequential Ramps rows
    #     where one cell holds 5 hex values for the ramp stops)
    # These constraints kill the false positives produced on BRAND.md's
    # legacy-aliases table and sequential-ramps table.
    if line.lstrip().startswith("|") or line.count("|") >= 3:
        cells = [c.strip() for c in line.split("|")]
        # Skip rows that look like multi-color definitions (duotone treatments,
        # mode palettes — where each cell across the row defines a different
        # color slot rather than name=hex). Heuristic: ≥2 hex values across
        # different cells means the row is multi-color; pairing breaks.
        cells_with_hex = sum(1 for c in cells if re.search(r"#[0-9a-fA-F]{6}\b", c))
        if cells_with_hex >= 2:
            return _dedupe(bad)
        for i in range(len(cells) - 1):
            names_in_cell = re.findall(r"\b([a-z][a-z0-9_-]{2,15})\b", cells[i])
            palette_names = [n for n in names_in_cell if n in palette]
            if len(palette_names) != 1:
                continue
            name = palette_names[0]
            # If this cell ALSO already contains the canonical hex for the
            # name, the row is correctly defining the color — don't cross
            # into the description cell to find a "mismatch."
            this_cell_hexes = [h.lower() for h in re.findall(r"#[0-9a-fA-F]{6}\b", cells[i])]
            if palette[name].lower() in this_cell_hexes:
                continue
            # Cell N+1 must hold exactly one hex
            next_cell_hexes = re.findall(r"#[0-9a-fA-F]{6}\b", cells[i + 1])
            if len(next_cell_hexes) != 1:
                continue
            claimed = next_cell_hexes[0].lower()
            if claimed != palette[name].lower():
                bad.append((name, claimed))
    return _dedupe(bad)


def _dedupe(pairs: list[tuple[str, str]]) -> list[tuple[str, str]]:
    """Preserve order while removing duplicates."""
    seen = set()
    out = []
    for pair in pairs:
        if pair not in seen:
            out.append(pair)
            seen.add(pair)
    return out


def check_palette_consistency() -> list[Violation]:
    """Walk BRAND.md for `name #HEX` pairs; flag mismatches against palette.json."""
    palette = _load_palette()
    if not palette:
        return []
    if not BRAND_MD.is_file():
        return []
    violations: list[Violation] = []
    text = BRAND_MD.read_text(encoding="utf-8")
    for ln, line in enumerate(text.splitlines(), 1):
        for name, claimed_hex in _scan_palette_pair(line, palette):
            canonical_hex = palette[name].lower()
            violations.append(Violation(
                check="palette", file=str(BRAND_MD.relative_to(REPO_ROOT)),
                line=ln, pointer=name,
                message=(
                    f"BRAND.md says `{name}` is `{claimed_hex}` but "
                    f"palette.json says `{canonical_hex}`. palette.json wins "
                    f"(it's the source of truth — see palette.json header). "
                    f"Either fix BRAND.md or update palette.json + regenerate "
                    f"LUTs (`python tools/brand-treatment/treat_video.py "
                    f"--all-luts -o tools/brand-treatment/luts/`)."
                ),
                severity="error",
            ))
    return violations


# ─── Check 3: `npm run <script>` mentions resolve to package.json ────────────

NPM_RUN_PATTERN = re.compile(r"`?npm run ([a-z][a-z0-9:_-]*)")


def _load_npm_scripts() -> set[str]:
    """Return the set of script names in remotion-templates/package.json."""
    if not PACKAGE_JSON.is_file():
        return set()
    data = json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))
    return set(data.get("scripts", {}).keys())


def check_npm_scripts() -> list[Violation]:
    """Verify every `npm run X` mentioned in docs is a real script."""
    scripts = _load_npm_scripts()
    if not scripts:
        return []
    violations: list[Violation] = []
    for doc in NPM_DOC_SOURCES:
        if not doc.is_file():
            continue
        rel = str(doc.relative_to(REPO_ROOT))
        text = doc.read_text(encoding="utf-8")
        for ln, line in enumerate(text.splitlines(), 1):
            for match in NPM_RUN_PATTERN.finditer(line):
                script = match.group(1)
                if script not in scripts:
                    violations.append(Violation(
                        check="npm", file=rel, line=ln, pointer=script,
                        message=(
                            f"`npm run {script}` is mentioned but no such script "
                            f"exists in `remotion-templates/package.json`. Either "
                            f"the script was renamed (check the `_*_scaffolded` "
                            f"doc-keys in package.json for dormant scripts) or "
                            f"this is a typo."
                        ),
                        severity="error",
                    ))
    return violations


# ─── Check 4: persona names align across persona-eval + publish-retro ────────

def _load_personas() -> list[str]:
    """Return canonical persona names from data/personas.json."""
    if not PERSONAS_JSON.is_file():
        return []
    data = json.loads(PERSONAS_JSON.read_text(encoding="utf-8"))
    return [p["name"] for p in data.get("personas", [])]


def check_persona_consistency() -> list[Violation]:
    """Each canonical persona name must appear in both persona-eval and publish-retro."""
    canonical = _load_personas()
    if not canonical:
        return []
    violations: list[Violation] = []
    for skill in PERSONA_SKILLS:
        if not skill.is_file():
            continue
        rel = str(skill.relative_to(REPO_ROOT))
        text = skill.read_text(encoding="utf-8")
        for name in canonical:
            if not re.search(rf"\b{re.escape(name)}\b", text):
                violations.append(Violation(
                    check="persona", file=rel, line=None, pointer=name,
                    message=(
                        f"Canonical persona `{name}` (from data/personas.json) "
                        f"is not mentioned in this skill. Persona-eval and "
                        f"publish-retro must agree on the persona roster; "
                        f"missing names produce reports that don't align."
                    ),
                    severity="error",
                ))
    return violations


# ─── Driver ──────────────────────────────────────────────────────────────────

ALL_CHECKS: dict[str, Callable[[], list[Violation]]] = {
    "template": check_template_names,
    "palette": check_palette_consistency,
    "npm": check_npm_scripts,
    "persona": check_persona_consistency,
}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("--strict", action="store_true",
                        help="Exit 1 if any violations found")
    parser.add_argument("--check", choices=list(ALL_CHECKS), action="append",
                        help="Run only the named check(s); repeatable")
    parser.add_argument("--json", action="store_true",
                        help="Machine-readable JSON output")
    args = parser.parse_args()

    to_run = args.check or list(ALL_CHECKS.keys())
    all_violations: list[Violation] = []
    for name in to_run:
        all_violations.extend(ALL_CHECKS[name]())

    if args.json:
        print(json.dumps([v.to_dict() for v in all_violations], indent=2))
    else:
        if not all_violations:
            print("✓ check_docs: no violations")
        else:
            by_check: dict[str, list[Violation]] = {}
            for v in all_violations:
                by_check.setdefault(v.check, []).append(v)
            for check_name in sorted(by_check):
                vs = by_check[check_name]
                print(f"\n── {check_name} ({len(vs)} violation{'s' if len(vs) != 1 else ''}) ──")
                for v in vs:
                    loc = f"{v.file}:{v.line}" if v.line else v.file
                    print(f"  [{v.severity.upper()}] {loc} — `{v.pointer}`")
                    print(f"    {v.message}")
            print(f"\nTotal: {len(all_violations)} violation(s) across {len(by_check)} check(s)")

    if args.strict and all_violations:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
