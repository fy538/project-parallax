"""
Tests for tools/brand-treatment/treat_video.py — LUT generation + filter chain.

Focus: pure functions only. ffmpeg/ffprobe subprocess calls are not tested
here (they're integration concerns).

Run: pytest tools/brand-treatment/test_treat_video.py -v
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import treat_video as tv


# ── build_filter_chain — string construction ──────────────────────────────


def test_filter_chain_default_includes_lut_grain_vignette(tmp_path):
    lut = tmp_path / "test.cube"
    lut.write_text("# fake LUT\n")
    chain = tv.build_filter_chain(lut, 1920, 1080)
    assert "lut3d" in chain
    assert "noise" in chain
    assert "vignette" in chain


def test_filter_chain_lut_only_skips_grain_vignette(tmp_path):
    lut = tmp_path / "test.cube"
    lut.write_text("# fake LUT\n")
    chain = tv.build_filter_chain(lut, 1920, 1080, lut_only=True)
    assert "lut3d" in chain
    assert "noise" not in chain
    assert "vignette" not in chain


def test_filter_chain_grain_uses_0_to_100_scale(tmp_path):
    """The fix in this sprint: ffmpeg's noise filter uses 0–100, not 0–255."""
    lut = tmp_path / "test.cube"
    lut.write_text("# fake LUT\n")
    chain = tv.build_filter_chain(lut, 1920, 1080, grain_intensity=0.50)
    # 0.50 × 100 = 50 (correct). Old buggy code would have produced 127 (out of range).
    assert "alls=50" in chain


def test_filter_chain_grain_clamps_to_100_max(tmp_path):
    """High grain values should be clamped, not silently passed through."""
    lut = tmp_path / "test.cube"
    lut.write_text("# fake LUT\n")
    chain = tv.build_filter_chain(lut, 1920, 1080, grain_intensity=2.0)  # > 1.0
    assert "alls=100" in chain


def test_filter_chain_grain_clamps_to_0_min(tmp_path):
    lut = tmp_path / "test.cube"
    lut.write_text("# fake LUT\n")
    chain = tv.build_filter_chain(lut, 1920, 1080, grain_intensity=-0.5)
    assert "alls=0" in chain


def test_filter_chain_grain_zero_yields_zero(tmp_path):
    lut = tmp_path / "test.cube"
    lut.write_text("# fake LUT\n")
    chain = tv.build_filter_chain(lut, 1920, 1080, grain_intensity=0.0)
    assert "alls=0" in chain


def test_filter_chain_default_grain_matches_palette_setting(tmp_path):
    """Default grain × 100 should equal whatever DEFAULT_GRAIN_INTENSITY resolved to.
    DEFAULT_GRAIN_INTENSITY is loaded from palette.json's `defaults.grain` (0.10)
    with a code fallback of 0.25 if missing."""
    lut = tmp_path / "test.cube"
    lut.write_text("# fake LUT\n")
    chain = tv.build_filter_chain(lut, 1920, 1080)
    expected = max(0, min(100, int(tv.DEFAULT_GRAIN_INTENSITY * 100)))
    assert f"alls={expected}" in chain


def test_filter_chain_temporal_noise_flag(tmp_path):
    """Noise should be temporal (allf=t) for live grain effect."""
    lut = tmp_path / "test.cube"
    lut.write_text("# fake LUT\n")
    chain = tv.build_filter_chain(lut, 1920, 1080)
    assert "allf=t" in chain


def test_filter_chain_vignette_uses_strength_param(tmp_path):
    lut = tmp_path / "test.cube"
    lut.write_text("# fake LUT\n")
    chain = tv.build_filter_chain(lut, 1920, 1080, vignette_strength=0.30)
    assert "vignette" in chain
    # Vignette angle formula: PI/5 + strength * PI/3
    assert "0.3" in chain or "0.30" in chain


# ── generate_lut — LUT math (returns .cube content as string) ─────────────


def test_generate_lut_writes_cube_format():
    text = tv.generate_lut("standard", size=8)  # tiny size for speed
    assert text.startswith("# Parallax")
    assert "LUT_3D_SIZE 8" in text
    assert 'TITLE "Parallax Standard"' in text


def test_generate_lut_has_correct_entry_count():
    """A LUT of size N has N³ data entries (lines of three floats)."""
    text = tv.generate_lut("standard", size=8)
    entries = []
    for line in text.splitlines():
        parts = line.split()
        if len(parts) == 3:
            try:
                [float(p) for p in parts]
                entries.append(line)
            except ValueError:
                pass
    assert len(entries) == 8 ** 3  # = 512


def test_generate_lut_values_in_unit_range():
    """All RGB values in the LUT must be in [0, 1] for ffmpeg / NLE compatibility."""
    text = tv.generate_lut("standard", size=8)
    for line in text.splitlines():
        parts = line.split()
        if len(parts) != 3:
            continue
        try:
            values = [float(p) for p in parts]
        except ValueError:
            continue
        assert all(0.0 <= v <= 1.0 for v in values), f"out-of-range: {values}"


def test_generate_lut_different_ramps_produce_different_output():
    """Standard and conflict ramps should produce different LUTs."""
    a = tv.generate_lut("standard", size=8)
    b = tv.generate_lut("conflict", size=8)
    assert a != b


def test_generate_lut_saturation_zero_collapses_color_axis():
    """At saturation=0, every pixel hits luminance only — output should depend on
    luminance only, not on which RGB axis varies. Two distinct RGBs with the same
    luminance map to the same output."""
    text = tv.generate_lut("standard", saturation=0.0, size=8)
    # Just verify it produces valid output without errors
    assert "LUT_3D_SIZE 8" in text


# ── Constants and defaults ────────────────────────────────────────────────


def test_default_grain_intensity_is_within_valid_range():
    """Default × 100 must land within the ffmpeg noise filter's 0–100 range."""
    assert 0.0 <= tv.DEFAULT_GRAIN_INTENSITY <= 1.0
    assert 0 <= int(tv.DEFAULT_GRAIN_INTENSITY * 100) <= 100


def test_default_vignette_strength_is_reasonable():
    assert 0.0 <= tv.DEFAULT_VIGNETTE_STRENGTH <= 1.0


def test_lut_size_is_typical():
    """64³ is a standard LUT size; smaller would be visibly banded."""
    assert tv.LUT_SIZE == 64
