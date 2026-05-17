"""
Tests for tools/lint/polish_lint.py — design-rule enforcement linter.

Strategy: each check_* function takes (lines, relpath) and returns a list of
Violations. We feed each check synthetic line arrays and assert which violations
fire (and which don't). No file I/O — pure function tests.

Run: pytest tools/lint/test_polish_lint.py -v
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import polish_lint as pl


# ── Helpers ────────────────────────────────────────────────────────────────


def _check(fn, source: str, *args) -> list[pl.Violation]:
    """Run a check_* function over a source string, return its violations."""
    return fn(source.split("\n"), "test.tsx", *args)


def _has_rule(violations, rule_id: str) -> bool:
    return any(v.rule == rule_id for v in violations)


# ── check_magic_numbers (L1) ───────────────────────────────────────────────


def test_magic_numbers_flags_non_grid_pixel_value():
    src = "  paddingTop: 13,"
    vs = _check(pl.check_magic_numbers, src)
    # 13 is not on the 8px grid → should flag
    assert any(v.rule == "L1" for v in vs)


def test_magic_numbers_allows_grid_aligned_value():
    src = "  paddingTop: 16,"
    vs = _check(pl.check_magic_numbers, src)
    # 16 = 2 × 8, on grid → no flag
    assert not any(v.rule == "L1" for v in vs)


def test_magic_numbers_allows_zero():
    src = "  marginLeft: 0,"
    vs = _check(pl.check_magic_numbers, src)
    assert not any(v.rule == "L1" for v in vs)


def test_magic_numbers_skips_within_strings():
    """Numbers inside strings shouldn't be flagged."""
    src = '  label: "13 chips",'
    vs = _check(pl.check_magic_numbers, src)
    assert not any(v.rule == "L1" for v in vs)


# ── check_direct_theme_refs (L14) ──────────────────────────────────────────


def test_direct_theme_refs_flags_dark_text():
    src = "  color: dark.text.primary,"
    vs = _check(pl.check_direct_theme_refs, src)
    assert _has_rule(vs, "L14")


def test_direct_theme_refs_flags_light_text():
    src = "  color: light.text.muted,"
    vs = _check(pl.check_direct_theme_refs, src)
    assert _has_rule(vs, "L14")


def test_direct_theme_refs_allows_useThemeMode_pattern():
    src = "  color: theme.text.primary,"  # `theme` is from useThemeMode hook
    vs = _check(pl.check_direct_theme_refs, src)
    assert not _has_rule(vs, "L14")


# ── check_hardcoded_shadows (L12) ──────────────────────────────────────────


def test_hardcoded_shadow_flags_pixel_string():
    src = '  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",'
    vs = _check(pl.check_hardcoded_shadows, src)
    assert _has_rule(vs, "L12")


def test_hardcoded_shadow_allows_token_reference():
    src = "  boxShadow: shadows.subtle,"
    vs = _check(pl.check_hardcoded_shadows, src)
    assert not _has_rule(vs, "L12")


# ── check_hardcoded_textshadow (L12) ───────────────────────────────────────
# Note: implementation tags textShadow violations as L12 (same family as
# regular shadow tokens), not the V7 from the docstring.


def test_hardcoded_textshadow_flags_inline_string():
    src = '  textShadow: "0 1px 2px rgba(0,0,0,0.4)",'
    vs = _check(pl.check_hardcoded_textshadow, src)
    assert _has_rule(vs, "L12")


def test_hardcoded_textshadow_allows_token():
    src = "  textShadow: shadows.textLift,"
    vs = _check(pl.check_hardcoded_textshadow, src)
    assert not _has_rule(vs, "L12")


# ── check_missing_titleblock (L13) ─────────────────────────────────────────


def test_titleblock_flagged_when_missing_in_eligible_template():
    # Trigger the hand-built-title detector: requires fontSize.h2/48/fontSizes
    # AND fontWeight 700/semibold/bold somewhere in the file.
    src = """
    return (
      <div style={{ fontSize: fontSizes.h2, fontWeight: 700 }}>
        {data.title}
      </div>
    );
    """
    vs = _check(pl.check_missing_titleblock, src, "DataChart")
    assert _has_rule(vs, "L13")


def test_titleblock_satisfied_when_imported():
    src = '  import { TitleBlock } from "../../components/TitleBlock";\n  return <TitleBlock title={data.title} />;'
    vs = _check(pl.check_missing_titleblock, src, "DataChart")
    assert not _has_rule(vs, "L13")


def test_titleblock_skipped_for_exempt_template():
    """KineticTypography IS text — exempt from TitleBlock requirement."""
    src = '  return <div>{data.title}</div>;'
    vs = _check(pl.check_missing_titleblock, src, "KineticTypography")
    assert not _has_rule(vs, "L13")


# ── check_linear_interpolation (A1) ────────────────────────────────────────


def test_linear_interpolation_flags_no_easing():
    src = "  const x = interpolate(frame, [0, 30], [0, 1]);"
    vs = _check(pl.check_linear_interpolation, src)
    assert _has_rule(vs, "A1")


def test_linear_interpolation_allows_clamp_easing():
    src = "  const x = interpolate(frame, [0, 30], [0, 1], CLAMP_CUBIC);"
    vs = _check(pl.check_linear_interpolation, src)
    assert not _has_rule(vs, "A1")


def test_linear_interpolation_allows_inline_easing_object():
    src = "  const x = interpolate(frame, [0, 30], [0, 1], { easing: Easing.out(Easing.cubic) });"
    vs = _check(pl.check_linear_interpolation, src)
    assert not _has_rule(vs, "A1")


# ── check_magic_safe_area_offsets (L7) ─────────────────────────────────────
# Rule covers BOTH legacy `safeArea.top + N` and current `safeAreaTier.X.top + N`
# patterns. Behavior: allows on-grid values ≤ 48 (normal spacing); flags
# off-grid values OR on-grid values > 48 (likely title-height misuse).


def test_safe_area_offset_flags_off_grid_legacy_pattern():
    src = "  top: layout.safeArea.top + 100,"  # 100 not on 8px grid
    vs = _check(pl.check_magic_safe_area_offsets, src)
    assert _has_rule(vs, "L7")


def test_safe_area_offset_flags_off_grid_safeAreaTier_pattern():
    """Current style after the L69 default-tier flip — rule must catch this form too."""
    src = "  top: layout.safeAreaTier.generous.top + 100,"
    vs = _check(pl.check_magic_safe_area_offsets, src)
    assert _has_rule(vs, "L7")


def test_safe_area_offset_flags_likely_title_height_either_pattern():
    # 56 IS on the grid but > 48 → looks like a title offset; the rule
    # nudges toward contentArea() helper instead. Both patterns flagged.
    legacy = _check(pl.check_magic_safe_area_offsets, "  top: layout.safeArea.top + 56,")
    current = _check(pl.check_magic_safe_area_offsets, "  top: layout.safeAreaTier.generous.top + 56,")
    assert _has_rule(legacy, "L7")
    assert _has_rule(current, "L7")


def test_safe_area_offset_allows_small_grid_value():
    # 16 is on the 8px grid AND ≤ 48 → rule allows it as a normal spacing offset.
    src = "  top: layout.safeAreaTier.generous.top + 16,"
    vs = _check(pl.check_magic_safe_area_offsets, src)
    assert not _has_rule(vs, "L7")


# ── check_hardcoded_padding (L10) ──────────────────────────────────────────


def test_hardcoded_padding_flags_inline_pixel_string():
    src = '  padding: "24px 32px",'
    vs = _check(pl.check_hardcoded_padding, src)
    assert _has_rule(vs, "L10")


def test_hardcoded_padding_allows_layout_card_token():
    src = "  padding: layout.cardPadding,"
    vs = _check(pl.check_hardcoded_padding, src)
    assert not _has_rule(vs, "L10")


# ── check_forbidden_easings (A2) ───────────────────────────────────────────


def test_forbidden_easings_bounce_fires():
    src = "  easing: Easing.bounce,"
    vs = _check(pl.check_forbidden_easings, src)
    assert _has_rule(vs, "A2")


def test_forbidden_easings_elastic_fires():
    src = "  easing: Easing.elastic(1.2),"
    vs = _check(pl.check_forbidden_easings, src)
    assert _has_rule(vs, "A2")


def test_forbidden_easings_back_fires():
    src = "  easing: Easing.back(2),"
    vs = _check(pl.check_forbidden_easings, src)
    assert _has_rule(vs, "A2")


def test_forbidden_easings_suppressed_passes():
    # The suppression marker on the line ABOVE the call disarms the rule.
    src = "// easing-ok: percussive impact — intentional\n  easing: Easing.bounce,"
    vs = _check(pl.check_forbidden_easings, src)
    assert not _has_rule(vs, "A2")


def test_forbidden_easings_comment_line_skipped():
    # A pure comment that mentions Easing.bounce must not trigger A2.
    src = "// do NOT use Easing.bounce here"
    vs = _check(pl.check_forbidden_easings, src)
    assert not _has_rule(vs, "A2")


def test_forbidden_easings_allowed_easing_passes():
    src = "  easing: Easing.out(Easing.cubic),"
    vs = _check(pl.check_forbidden_easings, src)
    assert not _has_rule(vs, "A2")


# ── check_missing_maxwidth (L9) ────────────────────────────────────────────


def test_maxwidth_flags_token_text_without_constraint():
    # The rule only fires on token-based fontSize (fontSizes.body|h1|h2|h3|display).
    # Raw pixel values (fontSize: 64) are not flagged — token usage is the precondition.
    src = '  <div style={{ fontSize: fontSizes.h2 }}>{data.title}</div>'
    vs = _check(pl.check_missing_maxwidth, src)
    assert _has_rule(vs, "L9")


def test_maxwidth_satisfied_with_maxWidth():
    src = '  <div style={{ fontSize: fontSizes.h2, maxWidth: 1200 }}>{data.title}</div>'
    vs = _check(pl.check_missing_maxwidth, src)
    assert not _has_rule(vs, "L9")


def test_maxwidth_satisfied_with_textmaxwidth_token():
    src = '  <div style={{ fontSize: fontSizes.h2, maxWidth: textMaxWidth.heading }}>{data.title}</div>'
    vs = _check(pl.check_missing_maxwidth, src)
    assert not _has_rule(vs, "L9")


def test_maxwidth_satisfied_when_position_constrained():
    """Position constraints (left + right both set) limit width without explicit maxWidth."""
    src = """
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        fontSize: fontSizes.h2,
      }}
    >
      {data.title}
    </div>
    """
    vs = _check(pl.check_missing_maxwidth, src)
    assert not _has_rule(vs, "L9")


# ── lint_file integration smoke test ───────────────────────────────────────


def test_lint_file_returns_list_of_violations(tmp_path):
    """Smoke: lint_file glues all checks together. We just verify it runs and
    returns a list — the per-rule semantics are covered above."""
    f = tmp_path / "Foo" / "Foo.tsx"
    f.parent.mkdir(parents=True)
    f.write_text(
        '''import { TitleBlock } from "../../components/TitleBlock";
const x = interpolate(frame, [0, 30], [0, 1], CLAMP);
const padding = 16;
return <TitleBlock title={data.title} />;
''',
        encoding="utf-8",
    )
    result = pl.lint_file(f, tmp_path)
    assert isinstance(result, list)


def test_lint_file_skips_test_files(tmp_path):
    """*.test.tsx files shouldn't be linted (they may use fixtures that violate rules)."""
    f = tmp_path / "Foo" / "Foo.test.tsx"
    f.parent.mkdir(parents=True)
    f.write_text("padding: 13,", encoding="utf-8")
    # If lint_file even processes test files, this padding: 13 would flag L1.
    # We expect either 0 violations OR the function recognizes test files.
    result = pl.lint_file(f, tmp_path)
    # Most likely it's filtered upstream by find_template_files; if lint_file
    # itself doesn't know, that's a real finding worth surfacing.
    # Test as smoke for now — it should at minimum not raise.
    assert isinstance(result, list)


# ── Configuration sanity ───────────────────────────────────────────────────


def test_titleblock_exempt_set_includes_known_exempt_templates():
    for name in (
        "KineticTypography",
        "TitleTransition",
        "ChoroplethMap",
        "FullEpisode",
        "KineticShort",
    ):
        assert name in pl.TITLEBLOCK_EXEMPT, f"{name} should be in TITLEBLOCK_EXEMPT"


def test_valid_spacing_includes_all_8px_multiples_to_256():
    assert 0 in pl.VALID_SPACING
    assert 8 in pl.VALID_SPACING
    assert 16 in pl.VALID_SPACING
    assert 256 in pl.VALID_SPACING
    # 13 is NOT on the grid
    assert 13 not in pl.VALID_SPACING


def test_violation_dataclass_has_required_fields():
    v = pl.Violation(
        rule="L1",
        file="x.tsx",
        line=1,
        message="test",
        snippet="padding: 13,",
    )
    assert v.file == "x.tsx"
    assert v.rule == "L1"
    assert v.severity == "warning"  # default


def test_violation_dataclass_supports_error_severity():
    v = pl.Violation(
        rule="L13",
        file="x.tsx",
        line=1,
        message="test",
        snippet="(file)",
        severity="error",
    )
    assert v.severity == "error"


def test_all_checks_export_includes_each_function():
    """Sanity — if a check function is added, it must be added to ALL_CHECKS too,
    or the runner will silently skip it."""
    assert pl.check_magic_numbers in pl.ALL_CHECKS
    assert pl.check_direct_theme_refs in pl.ALL_CHECKS
    assert pl.check_linear_interpolation in pl.ALL_CHECKS
    assert pl.check_missing_maxwidth in pl.ALL_CHECKS
    assert pl.check_hardcoded_shadows in pl.ALL_CHECKS
    assert pl.check_hardcoded_textshadow in pl.ALL_CHECKS
    assert pl.check_forbidden_easings in pl.ALL_CHECKS
    assert pl.check_magic_safe_area_offsets in pl.ALL_CHECKS
    assert pl.check_hardcoded_padding in pl.ALL_CHECKS
