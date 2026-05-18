"""Tests for tools/lint/check_status_emoji.py."""

from __future__ import annotations

import textwrap
from pathlib import Path

from tools.lint import check_status_emoji


def test_clean_file_no_issues(tmp_path: Path) -> None:
    f = tmp_path / "clean.py"
    f.write_text("x = 1\nprint('hi')\n", encoding="utf-8")
    assert check_status_emoji.scan_file(f) == []


def test_literal_in_string_is_flagged(tmp_path: Path) -> None:
    f = tmp_path / "leaky.py"
    f.write_text("label = '🔴 broken'\n", encoding="utf-8")
    issues = check_status_emoji.scan_file(f)
    assert len(issues) == 1
    assert issues[0]["line"] == 1
    assert issues[0]["emoji"] == "🔴"


def test_each_canonical_emoji_caught(tmp_path: Path) -> None:
    for emoji in ("🟢", "🟡", "🔴"):
        f = tmp_path / f"{emoji}.py"
        f.write_text(f"x = '{emoji} x'\n", encoding="utf-8")
        issues = check_status_emoji.scan_file(f)
        assert len(issues) == 1
        assert issues[0]["emoji"] == emoji


def test_literal_in_comment_allowed(tmp_path: Path) -> None:
    f = tmp_path / "commented.py"
    f.write_text("# threshold = 5 # ≥ 5 = 🟡\nx = 1\n", encoding="utf-8")
    assert check_status_emoji.scan_file(f) == []


def test_literal_in_docstring_allowed(tmp_path: Path) -> None:
    f = tmp_path / "docstring.py"
    f.write_text(
        textwrap.dedent('''\
            """Module that describes the 🟢/🟡/🔴 health scale in its docstring."""
            def f() -> int:
                """🔴 = bad. Returns 1."""
                return 1
            '''),
        encoding="utf-8",
    )
    assert check_status_emoji.scan_file(f) == []


def test_test_files_allowlisted(tmp_path: Path) -> None:
    """Test files routinely assert `"🔴" in output` — those literals are
    the test contract, not a render."""
    f = tmp_path / "test_foo.py"
    f.write_text("def test(): assert '🔴' in 'x🔴y'\n", encoding="utf-8")
    assert check_status_emoji.scan_file(f) == []


def test_canonical_module_allowlisted() -> None:
    """tools/status_emoji.py contains the constants by design."""
    p = check_status_emoji.REPO_ROOT / "tools" / "status_emoji.py"
    if p.exists():
        assert check_status_emoji.scan_file(p) == []


def test_archive_dirs_skipped(tmp_path: Path) -> None:
    arch = tmp_path / "_archive" / "old.py"
    arch.parent.mkdir(parents=True)
    arch.write_text("x = '🔴'\n", encoding="utf-8")
    assert check_status_emoji.scan_tree(tmp_path) == {}


def test_venv_dirs_skipped(tmp_path: Path) -> None:
    venv = tmp_path / ".venv" / "lib" / "leaky.py"
    venv.parent.mkdir(parents=True)
    venv.write_text("x = '🔴'\n", encoding="utf-8")
    assert check_status_emoji.scan_tree(tmp_path) == {}


def test_full_tools_tree_is_clean() -> None:
    """The repo as it stands should have zero violations (post-refactor baseline)."""
    results = check_status_emoji.scan_tree(check_status_emoji.TOOLS_DIR)
    assert results == {}, f"Unexpected literals: {results}"
