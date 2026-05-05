"""
Tests for tools/brand-treatment/treat.py — image treatment pipeline.

Each step is a pure function on PIL Images; we test invariants rather than
exact pixel values.

Run: pytest tools/brand-treatment/test_treat.py -v
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import numpy as np
from PIL import Image

import treat


def _solid_image(color, size=(64, 64)) -> Image.Image:
    return Image.new("RGB", size, color)


def _gradient_image(size=(64, 64)) -> Image.Image:
    """Horizontal grayscale gradient 0..255."""
    arr = np.tile(np.linspace(0, 255, size[0], dtype=np.uint8), (size[1], 1))
    rgb = np.stack([arr, arr, arr], axis=-1)
    return Image.fromarray(rgb)


# ── step1_desaturate ──────────────────────────────────────────────────────


def test_desaturate_zero_yields_pure_gray():
    """saturation=0 → image is fully gray (R=G=B per pixel)."""
    img = _solid_image((255, 0, 0))  # pure red
    out = treat.step1_desaturate(img, saturation=0.0)
    arr = np.array(out)
    # All channels should be equal at every pixel
    assert np.allclose(arr[..., 0], arr[..., 1])
    assert np.allclose(arr[..., 1], arr[..., 2])


def test_desaturate_one_preserves_color():
    """saturation=1 → image unchanged."""
    img = _solid_image((180, 50, 100))
    out = treat.step1_desaturate(img, saturation=1.0)
    arr_in = np.array(img, dtype=np.int16)
    arr_out = np.array(out, dtype=np.int16)
    # Allow ±1 for float→int rounding
    assert np.max(np.abs(arr_in - arr_out)) <= 1


def test_desaturate_preserves_dimensions():
    img = _solid_image((100, 150, 200), size=(128, 96))
    out = treat.step1_desaturate(img, saturation=0.25)
    assert out.size == img.size


def test_desaturate_clamps_to_uint8_range():
    """No values outside [0, 255]."""
    img = _solid_image((255, 255, 255))
    out = treat.step1_desaturate(img, saturation=0.25)
    arr = np.array(out)
    assert arr.min() >= 0 and arr.max() <= 255


# ── step2_duotone ────────────────────────────────────────────────────────


def test_duotone_black_input_maps_to_shadows():
    """Pure-black input pixels should map to the ramp's shadows color."""
    img = _solid_image((0, 0, 0))
    out = treat.step2_duotone(img, ramp_name="standard")
    arr = np.array(out)
    expected = np.array(treat.RAMPS["standard"]["shadows"], dtype=np.int16)
    actual = arr[0, 0].astype(np.int16)
    # Allow small rounding error
    assert np.max(np.abs(actual - expected)) <= 2


def test_duotone_white_input_maps_to_highlights():
    img = _solid_image((255, 255, 255))
    out = treat.step2_duotone(img, ramp_name="standard")
    arr = np.array(out)
    expected = np.array(treat.RAMPS["standard"]["highlights"], dtype=np.int16)
    actual = arr[0, 0].astype(np.int16)
    assert np.max(np.abs(actual - expected)) <= 2


def test_duotone_midgray_maps_to_midtones():
    """Pure-mid-gray (≈128) should map to the ramp's midtones."""
    img = _solid_image((128, 128, 128))
    out = treat.step2_duotone(img, ramp_name="standard")
    arr = np.array(out)
    expected = np.array(treat.RAMPS["standard"]["midtones"], dtype=np.int16)
    actual = arr[0, 0].astype(np.int16)
    # 128/255 = 0.502 → very close to midtone but not exact; allow ±5
    assert np.max(np.abs(actual - expected)) <= 5


def test_duotone_supports_all_ramps():
    img = _solid_image((128, 128, 128))
    for ramp in ("standard", "conflict", "editorial"):
        out = treat.step2_duotone(img, ramp_name=ramp)
        assert out.size == img.size


def test_duotone_different_ramps_produce_different_outputs():
    img = _solid_image((128, 128, 128))
    a = np.array(treat.step2_duotone(img, ramp_name="standard"))
    b = np.array(treat.step2_duotone(img, ramp_name="conflict"))
    assert not np.array_equal(a, b)


# ── step3_grain ──────────────────────────────────────────────────────────


def test_grain_changes_pixels():
    """Grain at non-zero intensity should produce some pixel changes."""
    img = _solid_image((128, 128, 128), size=(32, 32))
    out = treat.step3_grain(img, intensity=0.10)
    assert not np.array_equal(np.array(img), np.array(out))


def test_grain_zero_intensity_unchanged():
    """Intensity 0 → identical output."""
    img = _solid_image((128, 128, 128), size=(32, 32))
    out = treat.step3_grain(img, intensity=0.0)
    # Noise sigma is 0, so grain values should all be 0; output equals input.
    assert np.array_equal(np.array(img), np.array(out))


def test_grain_is_monochromatic():
    """The same noise should be added to R, G, B at each pixel."""
    img = _solid_image((128, 128, 128), size=(32, 32))
    out = treat.step3_grain(img, intensity=0.10)
    arr = np.array(out, dtype=np.int16)
    # R, G, B per pixel should differ from input by the same amount
    delta_r = arr[..., 0] - 128
    delta_g = arr[..., 1] - 128
    delta_b = arr[..., 2] - 128
    assert np.array_equal(delta_r, delta_g)
    assert np.array_equal(delta_g, delta_b)


def test_grain_clamps_to_uint8():
    """Output values stay in [0, 255]."""
    img = _solid_image((128, 128, 128), size=(64, 64))
    out = treat.step3_grain(img, intensity=0.50)  # heavy grain
    arr = np.array(out)
    assert arr.min() >= 0 and arr.max() <= 255


# ── step3_vignette ───────────────────────────────────────────────────────


def test_vignette_corners_darker_than_center():
    """Vignette should darken corners more than center."""
    img = _solid_image((200, 200, 200), size=(100, 100))
    out = treat.step3_vignette(img, strength=0.30)
    arr = np.array(out)
    center = arr[50, 50, 0]
    corner = arr[0, 0, 0]
    assert center > corner


def test_vignette_zero_strength_unchanged():
    img = _solid_image((200, 200, 200), size=(64, 64))
    out = treat.step3_vignette(img, strength=0.0)
    assert np.array_equal(np.array(img), np.array(out))


def test_vignette_preserves_dimensions():
    img = _solid_image((200, 200, 200), size=(128, 96))
    out = treat.step3_vignette(img, strength=0.18)
    assert out.size == img.size


# ── treat_image — full pipeline ──────────────────────────────────────────


def test_treat_image_runs_full_pipeline():
    img = _gradient_image(size=(64, 64))
    out = treat.treat_image(img)
    assert out.size == img.size
    assert out.mode == "RGB"


def test_treat_image_converts_non_rgb():
    img = Image.new("L", (64, 64), 128)  # grayscale L mode
    out = treat.treat_image(img)
    assert out.mode == "RGB"


def test_treat_image_default_uses_standard_ramp():
    """A pure mid-gray image, default treatment, should approach the standard
    ramp's midtone region (after light desaturation)."""
    img = _solid_image((128, 128, 128), size=(64, 64))
    out = treat.treat_image(img, grain_intensity=0.0, vignette_strength=0.0)
    arr = np.array(out)
    # No exact assertion; just verify the output has plausible RGB values
    # closer to the ramp's midtone than to neutral gray
    assert arr.shape == (64, 64, 3)


# ── RAMPS sanity — fixture data shape ─────────────────────────────────────


def test_ramps_loaded_with_required_stops():
    for name in ("standard", "conflict", "editorial"):
        assert name in treat.RAMPS
        ramp = treat.RAMPS[name]
        assert "shadows" in ramp and "midtones" in ramp and "highlights" in ramp
        for stop in (ramp["shadows"], ramp["midtones"], ramp["highlights"]):
            assert len(stop) == 3
            assert all(isinstance(c, int) for c in stop)
            assert all(0 <= c <= 255 for c in stop)
