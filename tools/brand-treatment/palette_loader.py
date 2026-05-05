"""
Shared palette loader for Parallax brand treatment tools.

Reads palette.json (the single source of truth) and resolves named
references in the duotone ramps to their actual hex/RGB values.

Usage:
    from palette_loader import load_palette, get_ramps_rgb, get_defaults

    palette = load_palette()           # Full parsed palette dict
    ramps = get_ramps_rgb()            # {name: {shadows: (R,G,B), midtones: ..., highlights: ...}}
    defaults = get_defaults()          # {saturation: 0.25, grain: 0.10, vignette: 0.18}
"""

import json
from pathlib import Path
from typing import Dict, Tuple

PALETTE_PATH = Path(__file__).resolve().parent / "palette.json"

_cache: dict = {}


def load_palette() -> dict:
    """Load and return the raw palette.json contents. Cached after first call."""
    if not _cache:
        with open(PALETTE_PATH, "r", encoding="utf-8") as f:
            _cache.update(json.load(f))
    return _cache


def _hex_to_rgb(hex_str: str) -> Tuple[int, int, int]:
    """Convert '#RRGGBB' to (R, G, B) tuple."""
    h = hex_str.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _resolve_color(name_or_hex: str, palette_colors: dict) -> str:
    """Resolve a palette name ('ink', 'amber') to its hex value, or pass through if already hex."""
    if name_or_hex.startswith("#"):
        return name_or_hex.upper()
    resolved = palette_colors.get(name_or_hex)
    if resolved is None:
        raise ValueError(
            f"Unknown palette name '{name_or_hex}'. "
            f"Available: {', '.join(palette_colors.keys())}"
        )
    return resolved.upper()


def get_ramps_rgb() -> Dict[str, Dict[str, Tuple[int, int, int]]]:
    """
    Load duotone ramps with all named references resolved to RGB tuples.

    Returns:
        {
            "standard": {"shadows": (28, 24, 20), "midtones": (139, 94, 43), "highlights": (229, 165, 68)},
            "conflict": {...},
            "editorial": {...},
        }
    """
    data = load_palette()
    palette_colors = data["palette"]
    ramps = {}

    for ramp_name, stops in data["duotone"].items():
        ramps[ramp_name] = {
            stop: _hex_to_rgb(_resolve_color(color_ref, palette_colors))
            for stop, color_ref in stops.items()
        }

    return ramps


def get_ramps_hex() -> Dict[str, Dict[str, str]]:
    """
    Load duotone ramps with all named references resolved to hex strings.

    Returns:
        {
            "standard": {"shadows": "#1C1814", "midtones": "#8B5E2B", "highlights": "#E5A544"},
            ...
        }
    """
    data = load_palette()
    palette_colors = data["palette"]
    ramps = {}

    for ramp_name, stops in data["duotone"].items():
        ramps[ramp_name] = {
            stop: _resolve_color(color_ref, palette_colors)
            for stop, color_ref in stops.items()
        }

    return ramps


def get_defaults() -> dict:
    """Load treatment default parameters (saturation, grain, vignette)."""
    data = load_palette()
    return data.get("treatment", {
        "saturation": 0.25,
        "grain": 0.10,
        "vignette": 0.18,
    })


def get_all_approved_colors() -> set:
    """
    Build the complete set of approved hex colors for consistency checking.
    Includes palette, semantic, ramps, and mode tokens.
    """
    data = load_palette()
    palette_colors = data["palette"]
    colors = set()

    # Core palette
    colors.update(v.upper() for v in palette_colors.values())

    # Semantic
    colors.update(v.upper() for v in data.get("semantic", {}).values())

    # Sequential ramps
    for ramp_stops in data.get("ramps", {}).values():
        colors.update(v.upper() for v in ramp_stops)

    # Mode tokens (resolve named refs)
    for mode_data in data.get("modes", {}).values():
        for group in mode_data.values():
            if isinstance(group, dict):
                for val in group.values():
                    resolved = _resolve_color(val, palette_colors) if isinstance(val, str) else None
                    if resolved:
                        colors.update([resolved])

    return colors
