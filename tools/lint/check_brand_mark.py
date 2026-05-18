#!/usr/bin/env python3
"""
check_brand_mark.py — block hardcoded brand-mark literals in Python.

Python sibling of the TypeScript `no-literal-brand-mark` rule in
`remotion-templates/scripts/lint-conventions.mjs`. The literal `∴` is
centralized in `tools/brand-treatment/palette.json::brandMark.glyph`,
exposed to Python via `tools.brand.get_brand_mark().glyph`.

Swapping the channel mark (∴ → another glyph, or out to an SVG asset)
should be a one-line change in palette.json, not a codebase-wide
grep-and-replace. This lint catches drift.

Scope:
  · Scans `tools/**.py` (the only place hand-written Python lives).
  · Skips comments and docstrings — they may legitimately describe the
    brand mark (e.g. `# ∴ brand mark — gold`).
  · Skips the canonical declaration + render sites (allowlist below).
  · Skips `_archive/` (frozen historical code).

Usage:
    python3 tools/lint/check_brand_mark.py             # exit 1 if violations
    python3 tools/lint/check_brand_mark.py --json      # machine-readable

Exits 0 on clean, 1 if any literal `∴` found outside the allowlist.
"""

from __future__ import annotations

import argparse
import ast
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
TOOLS_DIR = REPO_ROOT / "tools"

BRAND_GLYPH = "∴"  # ∴ — the literal we're guarding against

# Files allowed to contain the literal glyph (executable code, not just
# comments). Anything not in this set must read from `brand.get_brand_mark()`.
ALLOWED_PATHS = {
    REPO_ROOT / "tools" / "brand.py",                    # canonical Python token
    REPO_ROOT / "tools" / "test_brand.py",               # tests assert the glyph
    REPO_ROOT / "tools" / "test_pipeline_html.py",       # tests assert it renders
    REPO_ROOT / "tools" / "lint" / "check_brand_mark.py",  # this file (declares the constant)
    REPO_ROOT / "tools" / "lint" / "test_check_brand_mark.py",  # sibling test
}

# Directory prefixes to skip entirely.
SKIP_DIRS = {"_archive", "__pycache__"}


def _is_under_skipped(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)


def _docstring_line_ranges(tree: ast.AST) -> set[int]:
    """Return the set of line numbers covered by module/class/function docstrings.

    We allow the brand glyph inside docstrings (descriptive text about the mark)
    but flag it in every other string literal (those are renders of the glyph).
    """
    lines: set[int] = set()
    docstring_owners = (ast.Module, ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)
    for node in ast.walk(tree):
        if not isinstance(node, docstring_owners):
            continue
        body = getattr(node, "body", None) or []
        if not body:
            continue
        first = body[0]
        if (
            isinstance(first, ast.Expr)
            and isinstance(first.value, ast.Constant)
            and isinstance(first.value.value, str)
        ):
            start = first.lineno
            end = getattr(first, "end_lineno", start) or start
            for ln in range(start, end + 1):
                lines.add(ln)
    return lines


def _strip_for_scan(source: str) -> str:
    """Return source with `#` comments and docstring lines blanked out.

    String literals OTHER than docstrings are preserved — those are exactly
    the hardcoded brand-mark renders we want to catch (e.g. `label = '∴ X'`).
    Falls back to comment-only stripping if AST parsing fails.
    """
    try:
        tree = ast.parse(source)
        docstring_lines = _docstring_line_ranges(tree)
    except SyntaxError:
        docstring_lines = set()

    out: list[str] = []
    for i, line in enumerate(source.splitlines(), start=1):
        # Strip `#` comments. Crude but safe: a `#` inside a string literal
        # on the same line would lose the tail of the string, but that just
        # means we'd miss a flag — comments are always-allowed anyway.
        code_only = line.split("#", 1)[0] if "#" in line else line
        if i in docstring_lines:
            out.append("")
        else:
            out.append(code_only)
    return "\n".join(out)


# Backwards-compatible alias retained in case anything imports the old name.
_strip_strings_and_comments = _strip_for_scan


def scan_file(path: Path) -> list[dict]:
    """Return a list of {line, snippet} dicts for each offending occurrence."""
    if path.resolve() in {p.resolve() for p in ALLOWED_PATHS}:
        return []
    if _is_under_skipped(path):
        return []
    try:
        source = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return []
    if BRAND_GLYPH not in source:
        return []

    stripped = _strip_for_scan(source)
    issues: list[dict] = []
    for i, line in enumerate(stripped.splitlines(), start=1):
        if BRAND_GLYPH in line:
            # Report the original line for context, not the stripped version.
            original = source.splitlines()[i - 1] if i - 1 < len(source.splitlines()) else line
            issues.append({"line": i, "snippet": original.strip()})
    return issues


def scan_tree(root: Path) -> dict[Path, list[dict]]:
    """Scan every .py file under `root`; return {path: [issues]}."""
    results: dict[Path, list[dict]] = {}
    for py in sorted(root.rglob("*.py")):
        issues = scan_file(py)
        if issues:
            results[py] = issues
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[1] if __doc__ else "")
    parser.add_argument("--json", action="store_true", help="machine-readable output")
    parser.add_argument(
        "--root",
        type=Path,
        default=TOOLS_DIR,
        help="root directory to scan (default: tools/)",
    )
    args = parser.parse_args()

    results = scan_tree(args.root)

    if args.json:
        payload = {
            "ok": not results,
            "violations": [
                {"path": str(p.relative_to(REPO_ROOT)), "line": iss["line"], "snippet": iss["snippet"]}
                for p, items in results.items()
                for iss in items
            ],
        }
        print(json.dumps(payload, indent=2))
        return 0 if not results else 1

    if not results:
        print("✓ no hardcoded `∴` brand-mark literals in tools/*.py")
        return 0

    print("✗ hardcoded `∴` brand-mark literals found — use `tools.brand.get_brand_mark().glyph`:\n")
    for path, items in results.items():
        rel = path.relative_to(REPO_ROOT)
        for iss in items:
            print(f"  {rel}:{iss['line']}: {iss['snippet']}")
    print(
        "\nFix: `from brand import get_brand_mark` (with tools/ on sys.path) then "
        "interpolate `get_brand_mark().glyph` instead of the raw character. "
        "Or use `brand.lockup('part1', 'part2')` for the `∴ part1 · part2` form."
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
