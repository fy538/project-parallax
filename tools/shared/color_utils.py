"""
Shared color utility functions for Parallax brand treatment tools.

Single source of truth for hex/RGB conversion used across treat.py,
palette_loader.py, recraft.py, and check.py.
"""

from typing import Tuple


def hex_to_rgb(hex_str: str) -> Tuple[int, int, int]:
    """Convert '#RRGGBB' or 'RRGGBB' to (R, G, B) tuple.

    Raises ValueError for invalid input (wrong length, non-hex chars).
    Does not support 3-char shorthand (#RGB) — use full 6-char form.
    """
    h = hex_str.lstrip("#").upper()
    if len(h) != 6:
        raise ValueError(
            f"Invalid hex color '{hex_str}': expected 6 hex digits (got {len(h)}). "
            "Use full form e.g. '#1C1814', not shorthand '#abc'."
        )
    try:
        return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))
    except ValueError:
        raise ValueError(f"Invalid hex color '{hex_str}': contains non-hex characters.")


def hex_to_rgba(hex_str: str, alpha: float = 1.0) -> Tuple[int, int, int, int]:
    """Convert '#RRGGBB' to (R, G, B, A) tuple. Alpha is 0.0–1.0, converted to 0–255."""
    r, g, b = hex_to_rgb(hex_str)
    a = max(0, min(255, round(alpha * 255)))
    return (r, g, b, a)


def euclidean_distance(
    rgb1: Tuple[int, int, int], rgb2: Tuple[int, int, int]
) -> float:
    """Euclidean distance in RGB space."""
    return sum((a - b) ** 2 for a, b in zip(rgb1, rgb2)) ** 0.5
