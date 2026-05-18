"""Tests for tools/lint/check_brand_mark.py.

The lint guards against hardcoded `∴` brand-mark literals in Python source.
Allowlisted: tools/brand.py (the canonical token), tests, and this file +
its sibling test (which both have to contain the constant by necessity).
"""

from __future__ import annotations

import textwrap
from pathlib import Path

from tools.lint import check_brand_mark


def test_clean_file_no_issues(tmp_path: Path) -> None:
    """Source with no brand-mark literal — no issues."""
    f = tmp_path / "clean.py"
    f.write_text("x = 1\nprint('hello')\n", encoding="utf-8")
    assert check_brand_mark.scan_file(f) == []


def test_literal_in_string_is_flagged(tmp_path: Path) -> None:
    """Brand glyph inside an executable string literal — flagged."""
    f = tmp_path / "leaky.py"
    f.write_text("label = '∴ PARALLAX'\n", encoding="utf-8")
    issues = check_brand_mark.scan_file(f)
    assert len(issues) == 1
    assert issues[0]["line"] == 1


def test_literal_in_comment_is_allowed(tmp_path: Path) -> None:
    """Brand glyph inside a `#` comment — allowed (docs describe the mark)."""
    f = tmp_path / "commented.py"
    f.write_text("# ∴ brand mark — rendered via brandMark.glyph\nx = 1\n", encoding="utf-8")
    assert check_brand_mark.scan_file(f) == []


def test_literal_in_docstring_is_allowed(tmp_path: Path) -> None:
    """Brand glyph inside a module/function docstring — allowed."""
    f = tmp_path / "docstring.py"
    f.write_text(
        textwrap.dedent(
            '''\
            """Module that talks about the ∴ brand mark in its docstring."""

            def f() -> int:
                """Returns 1 (related to ∴, but doesn't render it)."""
                return 1
            '''
        ),
        encoding="utf-8",
    )
    assert check_brand_mark.scan_file(f) == []


def test_allowlisted_files_skipped() -> None:
    """tools/brand.py contains the glyph by design — must not be flagged."""
    brand_py = check_brand_mark.REPO_ROOT / "tools" / "brand.py"
    if brand_py.exists():
        assert check_brand_mark.scan_file(brand_py) == []


def test_full_tools_tree_is_clean() -> None:
    """The repo as it stands should have no violations (the post-refactor baseline)."""
    results = check_brand_mark.scan_tree(check_brand_mark.TOOLS_DIR)
    assert results == {}, f"Unexpected brand-mark literals: {results}"


def test_archived_dirs_skipped(tmp_path: Path) -> None:
    """Files under `_archive/` are frozen historical code — skipped."""
    archive = tmp_path / "_archive" / "old.py"
    archive.parent.mkdir(parents=True)
    archive.write_text("legacy = '∴'\n", encoding="utf-8")
    results = check_brand_mark.scan_tree(tmp_path)
    assert results == {}
