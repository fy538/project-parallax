"""Tests for tools/status_emoji.py — the canonical 🟢/🟡/🔴 token module."""

from __future__ import annotations

import pytest

from tools import status_emoji


def test_constants_are_the_canonical_glyphs() -> None:
    assert status_emoji.OK == "🟢"
    assert status_emoji.WARN == "🟡"
    assert status_emoji.ERROR == "🔴"


def test_icon_dict_mirrors_constants() -> None:
    """The compatibility shim used by lint tools must agree with the constants."""
    assert status_emoji.ICON["ok"] == status_emoji.OK
    assert status_emoji.ICON["warn"] == status_emoji.WARN
    assert status_emoji.ICON["error"] == status_emoji.ERROR


@pytest.mark.parametrize(
    "severity,expected",
    [
        ("error", status_emoji.ERROR),
        ("warn", status_emoji.WARN),
        ("ok", status_emoji.OK),
        ("info", status_emoji.OK),  # info collapses to OK by design
    ],
)
def test_for_severity_dispatch(severity: str, expected: str) -> None:
    assert status_emoji.for_severity(severity) == expected  # type: ignore[arg-type]


@pytest.mark.parametrize("bad", ["errror", "critical", "Error", "", "info ", "warning"])
def test_for_severity_raises_on_unknown(bad: str) -> None:
    """A silent OK return on a typo'd severity would mask real errors
    behind a healthy-green dashboard indicator. The runtime guard makes
    the Literal contract real."""
    with pytest.raises(ValueError) as exc:
        status_emoji.for_severity(bad)  # type: ignore[arg-type]
    assert "unknown severity" in str(exc.value)
    assert bad in str(exc.value) or repr(bad) in str(exc.value)


def test_constants_are_strings() -> None:
    """Type sanity: the canonical names are plain `str`, not a custom Enum."""
    for c in (status_emoji.OK, status_emoji.WARN, status_emoji.ERROR):
        assert isinstance(c, str)
        # Each is exactly one user-perceived character (an emoji glyph).
        # Python len() counts code units; this is the lowest-effort sanity check.
        assert len(c) > 0
