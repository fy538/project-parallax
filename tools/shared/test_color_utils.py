"""
Tests for tools/shared/color_utils.py — the canonical color helpers used by
treat.py, palette_loader.py, recraft.py, check.py.

Run: pytest tools/shared/test_color_utils.py -v
"""

import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent))

from color_utils import euclidean_distance, hex_to_rgb, hex_to_rgba


# ── hex_to_rgb ────────────────────────────────────────────────────────────


def test_hex_to_rgb_with_hash():
    assert hex_to_rgb("#1C1814") == (28, 24, 20)


def test_hex_to_rgb_without_hash():
    assert hex_to_rgb("1C1814") == (28, 24, 20)


def test_hex_to_rgb_lowercase():
    """Convention is uppercase, but lowercase must work too — palette.json mixes both."""
    assert hex_to_rgb("#a64d46") == (166, 77, 70)


def test_hex_to_rgb_pure_white():
    assert hex_to_rgb("#FFFFFF") == (255, 255, 255)


def test_hex_to_rgb_pure_black():
    assert hex_to_rgb("#000000") == (0, 0, 0)


def test_hex_to_rgb_rejects_short_form():
    with pytest.raises(ValueError, match="6 hex digits"):
        hex_to_rgb("#abc")


def test_hex_to_rgb_rejects_long_form():
    with pytest.raises(ValueError, match="6 hex digits"):
        hex_to_rgb("#1234567")


def test_hex_to_rgb_rejects_non_hex_chars():
    with pytest.raises(ValueError, match="non-hex characters"):
        hex_to_rgb("#GGHHII")


def test_hex_to_rgb_rejects_empty_string():
    with pytest.raises(ValueError):
        hex_to_rgb("")


# ── hex_to_rgba ───────────────────────────────────────────────────────────


def test_hex_to_rgba_default_alpha_is_opaque():
    assert hex_to_rgba("#1C1814") == (28, 24, 20, 255)


def test_hex_to_rgba_alpha_zero():
    assert hex_to_rgba("#1C1814", alpha=0.0) == (28, 24, 20, 0)


def test_hex_to_rgba_alpha_half():
    r, g, b, a = hex_to_rgba("#1C1814", alpha=0.5)
    assert (r, g, b) == (28, 24, 20)
    assert a == 128  # round(0.5 * 255)


def test_hex_to_rgba_alpha_clamps_above_one():
    """Out-of-range alpha is clamped, not raised — protects callers from float drift."""
    _, _, _, a = hex_to_rgba("#1C1814", alpha=1.5)
    assert a == 255


def test_hex_to_rgba_alpha_clamps_below_zero():
    _, _, _, a = hex_to_rgba("#1C1814", alpha=-0.2)
    assert a == 0


# ── euclidean_distance ────────────────────────────────────────────────────


def test_distance_to_self_is_zero():
    assert euclidean_distance((128, 64, 32), (128, 64, 32)) == 0.0


def test_distance_black_to_white():
    """Maximum possible distance in 0-255 RGB space."""
    d = euclidean_distance((0, 0, 0), (255, 255, 255))
    # sqrt(3 * 255^2) = 255 * sqrt(3) ≈ 441.67
    assert abs(d - (255 * (3**0.5))) < 0.01


def test_distance_is_symmetric():
    a = (28, 24, 20)
    b = (240, 230, 208)
    assert euclidean_distance(a, b) == euclidean_distance(b, a)


def test_distance_single_axis():
    """Distance along one axis only — should equal the axis delta."""
    assert euclidean_distance((10, 20, 30), (10, 20, 50)) == 20.0
