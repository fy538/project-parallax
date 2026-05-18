#!/usr/bin/env python3
"""
check_status_emoji.py — block hardcoded status-emoji literals in Python.

Sibling of `check_brand_mark.py`. The trio 🟢/🟡/🔴 is centralized in
`tools/status_emoji.py` (re-exported as OK / WARN / ERROR plus an
`ICON` dict). Without a token, any one of the ~18 tools that emit the
emoji could swap 🔴 for ❌ and the dashboard / CLI ecosystem would
render inconsistent indicators.

Scope:
  · Scans `tools/**.py` (every hand-written Python tool).
  · Skips comments and docstrings (descriptive use of the emoji is fine).
  · Skips the canonical module + tests + a small allowlist (e.g. the
    regex character-class in `topic/idea_invalidation.py` that strips
    these characters from text — functional use, not display).
  · Skips `_archive/` (frozen historical code).

Usage:
    python3 tools/lint/check_status_emoji.py             # exit 1 if violations
    python3 tools/lint/check_status_emoji.py --json      # machine-readable

Exits 0 on clean, 1 if any literal 🟢/🟡/🔴 found outside the allowlist.
"""

from __future__ import annotations

import argparse
import ast
import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
TOOLS_DIR = REPO_ROOT / "tools"

# The three emoji we guard against. Any new status emoji that joins the
# canonical set (e.g. adding 🟠 for "needs-attention") should be appended
# here AND exposed from status_emoji.py.
STATUS_EMOJI = {"🟢", "🟡", "🔴"}

# Files where the literal is expected by virtue of what the file IS
# (canonical module + its tests + this lint + its tests). Anything else
# — including legitimate functional uses like a regex character-class
# that happens to mention these glyphs — uses the inline pragma instead,
# so an allowlisted file doesn't become a back-door for new render
# regressions hidden among the legitimate uses.
ALLOWED_PATHS = {
    REPO_ROOT / "tools" / "status_emoji.py",
    REPO_ROOT / "tools" / "test_status_emoji.py",
    REPO_ROOT / "tools" / "lint" / "check_status_emoji.py",
    REPO_ROOT / "tools" / "lint" / "test_check_status_emoji.py",
}

# Inline pragma: same-line or previous-line comment suppresses the flag.
# Used for one-off functional uses (regex character-classes, etc.) without
# allowlisting the entire file.
_PRAGMA = "no-bare-status-emoji: ok"

SKIP_DIRS = {"_archive", "__pycache__", ".venv", "site-packages", "node_modules"}


def _is_under_skipped(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)


def _docstring_line_ranges(tree: ast.AST) -> set[int]:
    """Line numbers covered by module/class/function docstrings."""
    lines: set[int] = set()
    owners = (ast.Module, ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)
    for node in ast.walk(tree):
        if not isinstance(node, owners):
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
    """Blank out `#` comments and docstring lines, preserving line count."""
    try:
        tree = ast.parse(source)
        docstring_lines = _docstring_line_ranges(tree)
    except SyntaxError:
        docstring_lines = set()

    out: list[str] = []
    for i, line in enumerate(source.splitlines(), start=1):
        code_only = line.split("#", 1)[0] if "#" in line else line
        if i in docstring_lines:
            out.append("")
        else:
            out.append(code_only)
    return "\n".join(out)


def scan_file(path: Path) -> list[dict]:
    if path.resolve() in {p.resolve() for p in ALLOWED_PATHS}:
        return []
    if _is_under_skipped(path):
        return []
    # Test files routinely assert `"🔴" in output` — those literals are
    # the test contract, not a render. Skip anything named test_*.py or *_test.py.
    name = path.name
    if name.startswith("test_") or name.endswith("_test.py"):
        return []
    try:
        source = path.read_text(encoding="utf-8")
    except (UnicodeDecodeError, OSError):
        return []
    if not any(e in source for e in STATUS_EMOJI):
        return []

    stripped = _strip_for_scan(source)
    source_lines = source.splitlines()
    issues: list[dict] = []
    for i, line in enumerate(stripped.splitlines(), start=1):
        for emoji in STATUS_EMOJI:
            if emoji not in line:
                continue
            # Inline pragma: same line or immediately preceding line.
            original = source_lines[i - 1] if i - 1 < len(source_lines) else line
            prev = source_lines[i - 2] if i >= 2 else ""
            if _PRAGMA in original or _PRAGMA in prev:
                break
            issues.append({"line": i, "emoji": emoji, "snippet": original.strip()})
            break  # one issue per line is enough
    return issues


def scan_tree(root: Path) -> dict[Path, list[dict]]:
    results: dict[Path, list[dict]] = {}
    for py in sorted(root.rglob("*.py")):
        issues = scan_file(py)
        if issues:
            results[py] = issues
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Block hardcoded status emoji in tools/")
    parser.add_argument("--json", action="store_true", help="machine-readable output")
    parser.add_argument("--root", type=Path, default=TOOLS_DIR)
    args = parser.parse_args()

    results = scan_tree(args.root)

    if args.json:
        print(json.dumps({
            "ok": not results,
            "violations": [
                {"path": str(p.relative_to(REPO_ROOT)), **iss}
                for p, items in results.items()
                for iss in items
            ],
        }, indent=2))
        return 0 if not results else 1

    if not results:
        print("✓ no hardcoded status emoji in tools/*.py")
        return 0

    print("✗ hardcoded status emoji found — use `tools.status_emoji.{OK, WARN, ERROR}`:\n")
    for path, items in results.items():
        rel = path.relative_to(REPO_ROOT)
        for iss in items:
            print(f"  {rel}:{iss['line']} [{iss['emoji']}]: {iss['snippet']}")
    print(
        "\nFix: `from status_emoji import OK, WARN, ERROR` (with tools/ on sys.path) "
        "then interpolate the constants. The semantic dispatch helper "
        "`status_emoji.for_severity('error')` returns the right glyph from a "
        "lint-style severity string."
    )
    return 1


if __name__ == "__main__":
    sys.exit(main())
