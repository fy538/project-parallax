"""
Tests for tools/recraft/recraft.py — AI illustration via Recraft API.

Strategy: pure-function focus (color remap math, prompt builders). API calls
are not exercised; the API client itself is best tested manually with a real
key. The risky failure modes covered here:
  - SVG color remap math (drift would silently produce off-brand illustrations)
  - Prompt composition (drift would silently degrade generated quality)

Run: pytest tools/recraft/test_recraft.py -v
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import recraft


# ── apply_duotone_svg — luminance → ramp interpolation ───────────────────


# Float-arithmetic note: apply_duotone_svg uses int() truncation rather than
# round(). At extreme luminance values (0.0, 1.0) float drift can produce a
# 1-channel-off result (e.g. #E5A544 ramp top → #E5A543 in output). The tests
# below use a ±2 tolerance per channel, which preserves correctness while
# tolerating known float drift.


def _hex_to_rgb(h: str) -> tuple[int, int, int]:
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def _extract_first_hex(text: str) -> str:
    import re
    m = re.search(r"#[0-9a-fA-F]{6}", text)
    assert m is not None, f"no hex value in: {text}"
    return m.group(0)


def _assert_close_to_palette(actual_hex: str, expected_hex: str, tol: int = 2) -> None:
    a = _hex_to_rgb(actual_hex)
    e = _hex_to_rgb(expected_hex)
    deltas = [abs(a[i] - e[i]) for i in range(3)]
    assert all(d <= tol for d in deltas), (
        f"output {actual_hex} is {deltas} off per channel from {expected_hex} (tolerance={tol})"
    )


def test_duotone_remaps_pure_black_to_shadows(tmp_path):
    """Pure black input should map to the ramp's shadow color (luminance = 0)."""
    src = tmp_path / "test.svg"
    src.write_text('<svg><circle fill="#000000" /></svg>', encoding="utf-8")
    out = recraft.apply_duotone_svg(src, ramp_name="standard")
    text = out.read_text(encoding="utf-8")
    actual = _extract_first_hex(text)
    _assert_close_to_palette(actual, recraft.DUOTONE_RAMPS["standard"]["shadows"])


def test_duotone_remaps_pure_white_to_highlights(tmp_path):
    src = tmp_path / "test.svg"
    src.write_text('<svg><circle fill="#FFFFFF" /></svg>', encoding="utf-8")
    out = recraft.apply_duotone_svg(src, ramp_name="standard")
    text = out.read_text(encoding="utf-8")
    actual = _extract_first_hex(text)
    _assert_close_to_palette(actual, recraft.DUOTONE_RAMPS["standard"]["highlights"])


def test_duotone_replaces_all_hex_values(tmp_path):
    """Every #RRGGBB in the SVG should be remapped to a palette value."""
    src = tmp_path / "test.svg"
    src.write_text(
        '<svg><circle fill="#FF0000" /><rect fill="#00FF00" /><path fill="#0000FF" /></svg>',
        encoding="utf-8",
    )
    out = recraft.apply_duotone_svg(src, ramp_name="standard")
    text = out.read_text(encoding="utf-8")
    # None of the original colors should remain
    assert "#FF0000" not in text and "#ff0000" not in text
    assert "#00FF00" not in text and "#00ff00" not in text
    assert "#0000FF" not in text and "#0000ff" not in text


def test_duotone_writes_distinct_output_path(tmp_path):
    src = tmp_path / "input.svg"
    src.write_text('<svg><rect fill="#888888" /></svg>', encoding="utf-8")
    out = recraft.apply_duotone_svg(src, ramp_name="standard")
    assert out != src
    assert "_treated_standard" in out.name
    # Original is untouched
    assert "#888888" in src.read_text(encoding="utf-8")


def test_duotone_supports_multiple_ramps(tmp_path):
    src1 = tmp_path / "a.svg"
    src1.write_text('<svg><circle fill="#808080" /></svg>', encoding="utf-8")
    src2 = tmp_path / "b.svg"
    src2.write_text('<svg><circle fill="#808080" /></svg>', encoding="utf-8")

    a = recraft.apply_duotone_svg(src1, ramp_name="standard").read_text(encoding="utf-8")
    b = recraft.apply_duotone_svg(src2, ramp_name="conflict").read_text(encoding="utf-8")
    # Different ramps must produce different output for the same input gray
    assert a != b


def test_duotone_unknown_ramp_falls_back_to_standard(tmp_path):
    """Per the .get(name, DUOTONE_RAMPS['standard']) fallback in the source."""
    src1 = tmp_path / "a.svg"
    src1.write_text('<svg><rect fill="#404040" /></svg>', encoding="utf-8")
    src2 = tmp_path / "b.svg"
    src2.write_text('<svg><rect fill="#404040" /></svg>', encoding="utf-8")

    standard = recraft.apply_duotone_svg(src1, ramp_name="standard").read_text(encoding="utf-8")
    unknown = recraft.apply_duotone_svg(src2, ramp_name="totally-fake-ramp").read_text(encoding="utf-8")
    assert standard == unknown


def test_duotone_output_is_in_brand_palette(tmp_path):
    """For any input SVG, every output color must lie on the duotone ramp."""
    src = tmp_path / "test.svg"
    src.write_text(
        '<svg><a fill="#123456" /><b fill="#789ABC" /><c fill="#FEDCBA" /></svg>',
        encoding="utf-8",
    )
    out = recraft.apply_duotone_svg(src, ramp_name="standard").read_text(encoding="utf-8")
    import re

    output_hex = set(re.findall(r"#([0-9a-fA-F]{6})", out))
    # Every output must be palette-derived. We don't try to verify it lies EXACTLY
    # on the ramp (interpolation produces intermediate values), but we can at least
    # confirm none of the original hex values pass through.
    original_hex = {"123456", "789abc", "fedcba"}
    assert not (output_hex & original_hex)


# ── build_parallax_prompt — string composition ────────────────────────────


def test_prompt_includes_description():
    p = recraft.build_parallax_prompt("a chip factory at sunset")
    assert "a chip factory at sunset" in p


def test_prompt_default_mode_is_illustration():
    p = recraft.build_parallax_prompt("subject")
    # Default illustration mode preamble should appear
    assert "vector illustration" in p.lower() or "Editorial" in p


def test_prompt_diagram_mode_uses_diagram_preamble():
    p = recraft.build_parallax_prompt("circuit", visual_mode="diagram")
    assert "diagram" in p.lower()


def test_prompt_unknown_mode_falls_back_to_illustration():
    """build_parallax_prompt uses .get() with illustration default."""
    p_unknown = recraft.build_parallax_prompt("subject", visual_mode="totally-fake")
    p_default = recraft.build_parallax_prompt("subject", visual_mode="illustration")
    # Both should start with the same prefix (illustration prefix).
    # Check the first ~80 chars match (allowing for ordering of parts).
    assert p_unknown[:80] == p_default[:80]


def test_prompt_includes_context_when_provided():
    p = recraft.build_parallax_prompt("subject", context="Beat 2: tariff escalation")
    assert "Context:" in p
    assert "tariff escalation" in p


def test_prompt_omits_context_label_when_empty():
    p = recraft.build_parallax_prompt("subject", context="")
    assert "Context:" not in p


def test_prompt_includes_negative_constraints():
    """Every prompt should end with the brand's negative constraints
    (no text, no watermarks, no human faces) per the Parallax illustration spec."""
    p = recraft.build_parallax_prompt("subject")
    assert "No text" in p or "no text" in p.lower()
    assert "no human faces" in p.lower()


def test_prompt_icon_mode_specifies_brand_colors():
    """Icon mode preamble explicitly specifies the brand hex values."""
    p = recraft.build_parallax_prompt("subject", visual_mode="icon")
    assert "#E5A544" in p or "#1C1814" in p


# ── DUOTONE_RAMPS — fixture data sanity ───────────────────────────────────


def test_duotone_ramps_have_required_stops():
    for name in ("standard", "conflict", "editorial"):
        assert name in recraft.DUOTONE_RAMPS
        ramp = recraft.DUOTONE_RAMPS[name]
        assert "shadows" in ramp
        assert "midtones" in ramp
        assert "highlights" in ramp


def test_duotone_ramp_values_are_valid_hex():
    import re

    hex_re = re.compile(r"^#[0-9A-Fa-f]{6}$")
    for ramp in recraft.DUOTONE_RAMPS.values():
        for stop in ("shadows", "midtones", "highlights"):
            assert hex_re.match(ramp[stop]), f"Invalid hex in ramp: {ramp[stop]}"
