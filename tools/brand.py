"""
brand.py — Python-side single source of truth for the Parallax brand mark.

Mirrors `brandMark` from `tools/brand-treatment/palette.json` (same source
the Remotion theme.ts reads). Any Python tool that renders the brand mark
(currently: tools/pipeline_html.py for the dashboard chrome) reads from
here, NOT from a hardcoded literal. A meta-test in test_brand.py blocks
new hardcoded "∴" outside the canonical set.

To swap the mark across the codebase:
  · Glyph swap: edit `palette.json::brandMark.glyph` (e.g. "∴" → "⟁")
  · SVG swap:   add a file to remotion-templates/public/, then set
                `palette.json::brandMark.svg` to the path
Both surfaces (React + Python) pick up the change automatically.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PALETTE_PATH = ROOT / "tools" / "brand-treatment" / "palette.json"


@dataclass(frozen=True)
class BrandMark:
    """The Parallax brand mark spec — frozen because no consumer should
    mutate it at runtime. Edit palette.json to change."""
    glyph: str                  # e.g. "∴"
    svg: str | None             # e.g. "/brand-mark.svg" or None
    font_family: str            # e.g. "IBM Plex Serif"
    color: str                  # palette key, e.g. "gold"
    lockup_separator: str       # e.g. " · "


# Lazy-load at module level so tests can monkeypatch PALETTE_PATH.
_cached: BrandMark | None = None


def get_brand_mark() -> BrandMark:
    """Return the canonical brand mark. Cached after first call."""
    global _cached
    if _cached is None:
        data = json.loads(PALETTE_PATH.read_text(encoding="utf-8"))
        bm = data["brandMark"]
        _cached = BrandMark(
            glyph=bm["glyph"],
            svg=bm.get("svg"),
            font_family=bm["fontFamily"],
            color=bm["color"],
            lockup_separator=bm["lockupSeparator"],
        )
    return _cached


def reset_cache() -> None:
    """Reset the module-level cache. For tests that monkeypatch the
    palette path between calls."""
    global _cached
    _cached = None
