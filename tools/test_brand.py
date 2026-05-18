"""Tests for tools/brand.py — the Python-side brand-mark token loader."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from tools import brand


@pytest.fixture(autouse=True)
def _reset_cache() -> None:
    """Clear the module cache before each test so monkeypatching takes effect."""
    brand.reset_cache()
    yield
    brand.reset_cache()


def test_loads_canonical_glyph_from_palette() -> None:
    """The brand mark loaded from the real palette.json is the ∴ glyph."""
    bm = brand.get_brand_mark()
    assert bm.glyph == "∴"
    assert bm.font_family == "IBM Plex Serif"
    assert bm.color == "gold"
    assert bm.lockup_separator == " · "


def test_cached_between_calls() -> None:
    """Second call returns the same instance (no re-read from disk)."""
    first = brand.get_brand_mark()
    second = brand.get_brand_mark()
    assert first is second


def test_reset_cache_forces_reload(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """reset_cache() + a different palette path yields a different mark."""
    # Establish baseline.
    baseline = brand.get_brand_mark()
    assert baseline.glyph == "∴"

    # Swap palette to a custom one with a different glyph.
    swap = tmp_path / "palette.json"
    swap.write_text(
        json.dumps(
            {
                "brandMark": {
                    "glyph": "⟁",
                    "svg": None,
                    "fontFamily": "Sentinel",
                    "color": "amber",
                    "lockupSeparator": " // ",
                }
            }
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr(brand, "PALETTE_PATH", swap)
    brand.reset_cache()

    swapped = brand.get_brand_mark()
    assert swapped.glyph == "⟁"
    assert swapped.font_family == "Sentinel"
    assert swapped.lockup_separator == " // "


def test_brandmark_is_frozen() -> None:
    """BrandMark dataclass is frozen — runtime mutation must raise
    FrozenInstanceError (which is an AttributeError subclass)."""
    from dataclasses import FrozenInstanceError

    bm = brand.get_brand_mark()
    with pytest.raises(FrozenInstanceError):
        bm.glyph = "X"  # type: ignore[misc]
