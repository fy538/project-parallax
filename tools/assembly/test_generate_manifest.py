"""
Tests for generate_manifest.py — pure-function coverage.

Run with:  pytest tools/assembly/test_generate_manifest.py -v
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from generate_manifest import (
    estimate_narration_duration,
    parse_visual_spec,
    parse_dir_lines,
    apply_default_transitions,
    infer_music_mood,
    resolve_shot_id,
    build_music_bed,
    lint_pacing,
    lint_mg_streaks,
    _find_sync_word,
    _build_segment,
    resolve_all_sync_points,
    FPS,
    WPM,
)


# ── estimate_narration_duration ────────────────────────────────────────────


def test_narration_duration_empty():
    assert estimate_narration_duration("") == 0.0


def test_narration_duration_word_count():
    words = " ".join(["word"] * 150)
    assert estimate_narration_duration(words) == 60.0


def test_narration_duration_strips_stage_directions():
    # Stage directions in *...* should not count
    text = "*[dramatic pause]* Hello world"
    assert estimate_narration_duration(text) == estimate_narration_duration("Hello world")


def test_narration_duration_strips_parentheticals():
    text = "Hello (emphasis here) world"
    assert estimate_narration_duration(text) == estimate_narration_duration("Hello world")


def test_narration_duration_proportional():
    text_75w = " ".join(["word"] * 75)
    assert abs(estimate_narration_duration(text_75w) - 30.0) < 0.01


# ── parse_visual_spec ──────────────────────────────────────────────────────


def test_parse_visual_spec_empty():
    assert parse_visual_spec("") is None
    assert parse_visual_spec("   ") is None


def test_parse_visual_spec_footage_type():
    spec = "**P1 — FOOTAGE** · standard · · Pexels · \"TSMC Arizona\" match narration (~18s)"
    result = parse_visual_spec(spec)
    assert result["type"] == "FOOTAGE"
    assert result["priority"] == "P1"


def test_parse_visual_spec_template_type():
    spec = "**P1 — DataChart** · 8s hold"
    result = parse_visual_spec(spec)
    assert result["type"] == "TEMPLATE"
    assert result["component"] == "DataChart"


def test_parse_visual_spec_simple_template_name():
    result = parse_visual_spec("KineticTypography · 6s")
    assert result["type"] == "TEMPLATE"
    assert result["component"] == "KineticTypography"


def test_parse_visual_spec_priority():
    assert parse_visual_spec("**P1 — DataChart**")["priority"] == "P1"
    assert parse_visual_spec("**P2 — FOOTAGE**")["priority"] == "P2"
    assert parse_visual_spec("**P3 — IMAGE**")["priority"] == "P3"


def test_parse_visual_spec_search_terms():
    spec = '**P1 — FOOTAGE** "TSMC Arizona" "semiconductor wafer" · Pexels ·'
    result = parse_visual_spec(spec)
    assert "TSMC Arizona" in result["searchTerms"]
    assert "semiconductor wafer" in result["searchTerms"]


def test_parse_visual_spec_source():
    assert parse_visual_spec("· Pexels ·")["source"] == "pexels"
    assert parse_visual_spec("· Unsplash ·")["source"] == "unsplash"
    assert parse_visual_spec("· Wikimedia Commons ·")["source"] == "wikimedia-commons"


def test_parse_visual_spec_ramp():
    assert parse_visual_spec("· standard ·")["ramp"] == "standard"
    assert parse_visual_spec("· conflict ·")["ramp"] == "conflict"
    assert parse_visual_spec("· editorial ·")["ramp"] == "editorial"


def test_parse_visual_spec_composite():
    result = parse_visual_spec("background @70%")
    assert result["composite"] == "background"
    assert abs(result["opacity"] - 0.70) < 0.01


def test_parse_visual_spec_duration_explicit():
    assert parse_visual_spec("DataChart 8s")["durationSec"] == 8.0
    assert parse_visual_spec("12s hold")["durationSec"] == 12.0


def test_parse_visual_spec_duration_match_narration():
    result = parse_visual_spec("match narration (~18s)")
    assert result["durationMode"] == "match_narration"
    assert result["durationSec"] == 18.0


def test_parse_visual_spec_match_narration_no_hint():
    result = parse_visual_spec("match narration")
    assert result["durationMode"] == "match_narration"
    assert result["durationSec"] is None


def test_parse_visual_spec_transition_sets_component():
    result = parse_visual_spec("**TRANSITION** 2s")
    assert result["type"] == "TRANSITION"
    assert result["component"] == "TitleTransition"


def test_parse_visual_spec_backdrop_tag():
    spec = "**P1 — DataChart** · 8s · [BACKDROP: cartographic]"
    result = parse_visual_spec(spec)
    assert result["backdropId"] == "cartographic"

    mixed = "**P1 — ChoroplethMap** · [BACKDROP: Fab-Interior]"
    assert parse_visual_spec(mixed)["backdropId"] == "fab-interior"


def test_build_segment_template_sets_backdrop_id():
    parsed = parse_visual_spec(
        "**P1 — DataChart** · 8s · [BACKDROP: cartographic]",
    )
    seg = _build_segment(
        1,
        parsed,
        "TEMPLATE",
        0.0,
        8.0,
        "beat-a",
        "",
        "",
        "",
        {},
        {},
        {},
    )
    assert seg["template"]["backdropId"] == "cartographic"


def test_build_segment_title_transition_ignores_backdrop():
    parsed = parse_visual_spec(
        "**P1 — TitleTransition** · 4s · [BACKDROP: cartographic]",
    )
    seg = _build_segment(
        1,
        parsed,
        "TEMPLATE",
        0.0,
        4.0,
        "beat-a",
        "",
        "",
        "",
        {},
        {},
        {},
    )
    assert "backdropId" not in seg["template"]


def test_build_segment_unknown_backdrop_warns(capsys):
    parsed = parse_visual_spec(
        "**P1 — DataChart** · 8s · [BACKDROP: not-a-real-backdrop-id]",
    )
    seg = _build_segment(
        1,
        parsed,
        "TEMPLATE",
        0.0,
        8.0,
        "beat-a",
        "",
        "",
        "",
        {},
        {},
        {},
    )
    assert seg["template"]["backdropId"] == "not-a-real-backdrop-id"
    err = capsys.readouterr().err
    assert "WARNING" in err
    assert "not-a-real-backdrop-id" in err


def test_build_segment_warns_low_chartfit_dense_template(capsys):
    parsed = parse_visual_spec(
        "**P1 — SankeyFlow** · 8s · [BACKDROP: reading-room]",
    )
    _build_segment(
        1,
        parsed,
        "TEMPLATE",
        0.0,
        8.0,
        "beat-a",
        "",
        "",
        "",
        {},
        {},
        {},
    )
    err = capsys.readouterr().err
    assert "chartFit low" in err
    assert "SankeyFlow" in err


def test_build_segment_no_chartfit_warn_high_chartfit_backdrop(capsys):
    parsed = parse_visual_spec(
        "**P1 — SankeyFlow** · 8s · [BACKDROP: cartographic]",
    )
    _build_segment(
        1,
        parsed,
        "TEMPLATE",
        0.0,
        8.0,
        "beat-a",
        "",
        "",
        "",
        {},
        {},
        {},
    )
    err = capsys.readouterr().err
    assert "chartFit low" not in err


def test_build_segment_no_chartfit_warn_sparse_template(capsys):
    parsed = parse_visual_spec(
        "**P1 — KineticTypography** · 8s · [BACKDROP: reading-room]",
    )
    _build_segment(
        1,
        parsed,
        "TEMPLATE",
        0.0,
        8.0,
        "beat-a",
        "",
        "",
        "",
        {},
        {},
        {},
    )
    err = capsys.readouterr().err
    assert "chartFit low" not in err


def test_parse_visual_spec_image_type():
    result = parse_visual_spec("**P2 — IMAGE** · Wikimedia Commons · \"FDR signing\" 4s")
    assert result["type"] == "IMAGE"


# ── parse_dir_lines ────────────────────────────────────────────────────────


def test_parse_dir_hold_seconds():
    result = parse_dir_lines(["DIR: hold(2s)"])
    assert result["holdAfter"] == 2.0


def test_parse_dir_hold_preset_breathe():
    result = parse_dir_lines(["DIR: hold(breathe)"])
    assert result["holdAfter"] == 2.0
    assert result["holdBehavior"] == "breathe"


def test_parse_dir_hold_preset_land():
    result = parse_dir_lines(["DIR: hold(land)"])
    assert result["holdAfter"] == 1.0
    assert result["holdBehavior"] == "land"


def test_parse_dir_hold_preset_linger():
    result = parse_dir_lines(["DIR: hold(linger)"])
    assert result["holdAfter"] == 3.0
    assert result["holdBehavior"] == "linger"


def test_parse_dir_hold_pre_delay():
    result = parse_dir_lines(["DIR: hold(pre:1s)"])
    assert result["preDelay"] == 1.0
    assert "holdAfter" not in result


def test_parse_dir_hold_combined():
    result = parse_dir_lines(["DIR: hold(pre:1s, breathe)"])
    assert result["preDelay"] == 1.0
    assert result["holdAfter"] == 2.0
    assert result["holdBehavior"] == "breathe"


def test_parse_dir_hold_until():
    result = parse_dir_lines(['DIR: hold(until:"Taiwan")'])
    assert result["narrationGate"] == {"word": "Taiwan"}


def test_parse_dir_cut_basic():
    result = parse_dir_lines(["DIR: cut(iris)"])
    assert result["transitionOut"] == "iris"


def test_parse_dir_cut_with_duration():
    result = parse_dir_lines(["DIR: cut(dissolve, 0.5s)"])
    assert result["transitionOut"] == "dissolve"
    assert result["transitionDuration"] == 0.5


def test_parse_dir_cut_color_wash():
    result = parse_dir_lines(["DIR: cut(color-wash, ink, 0.7s)"])
    assert result["transitionOut"] == "color-wash"
    assert result["washColor"] == "#1C1814"
    assert result["transitionDuration"] == 0.7


def test_parse_dir_cut_invalid_type():
    result = parse_dir_lines(["DIR: cut(teleport)"])
    assert "transitionOut" not in result


def test_parse_dir_cut_deprecated_emits_warning(capsys, monkeypatch):
    """Deprecated cut types per TRANSITION_GRAMMAR.md Phase 3 still parse
    (back-compat) but emit a one-shot stderr deprecation notice."""
    import generate_manifest as gm

    # Reset the one-shot dedup state so this test is isolated.
    monkeypatch.setattr(gm, "_warned_deprecated_cuts", set())

    result = parse_dir_lines(["DIR: cut(whip-pan)"])
    assert result["transitionOut"] == "whip-pan"  # parses (back-compat)

    captured = capsys.readouterr()
    assert "deprecated" in captured.err.lower()
    assert "whip-pan" in captured.err
    # `cut` replacement uses the special "plain hard cut" phrasing.
    assert "plain hard cut" in captured.err
    assert "TRANSITION_GRAMMAR" in captured.err


def test_parse_dir_cut_deprecated_warning_replacement_phrase(capsys, monkeypatch):
    """Non-`cut` replacements appear as cut(<replacement>) in the warning."""
    import generate_manifest as gm

    monkeypatch.setattr(gm, "_warned_deprecated_cuts", set())

    parse_dir_lines(["DIR: cut(spatial-zoom)"])
    captured = capsys.readouterr()
    assert "cut(match-cut)" in captured.err


def test_parse_dir_cut_deprecated_warning_is_one_shot(capsys, monkeypatch):
    """A second use of the same deprecated cut() does not re-warn."""
    import generate_manifest as gm

    monkeypatch.setattr(gm, "_warned_deprecated_cuts", set())

    parse_dir_lines(["DIR: cut(wipe-left)"])
    first = capsys.readouterr()
    assert "wipe-left" in first.err

    parse_dir_lines(["DIR: cut(wipe-left)"])
    second = capsys.readouterr()
    assert second.err == ""  # no re-warn for same type


def test_deprecated_cut_types_map_to_canonical_replacements():
    """Lock the deprecation map so accidental edits get caught."""
    from generate_manifest import DEPRECATED_CUT_TYPES, VALID_CUT_TYPES

    # Every deprecated type is still parseable (back-compat).
    for dep in DEPRECATED_CUT_TYPES:
        assert dep in VALID_CUT_TYPES

    # Every replacement is itself a canonical, non-deprecated type.
    for dep, (replacement, _reason) in DEPRECATED_CUT_TYPES.items():
        assert replacement in VALID_CUT_TYPES
        assert replacement not in DEPRECATED_CUT_TYPES, (
            f"{dep} replacement {replacement} is itself deprecated"
        )

    # Lock the canonical set per TRANSITION_GRAMMAR.md Phase 3.
    assert set(DEPRECATED_CUT_TYPES) == {
        "wipe-left", "wipe-right", "wipe-up",
        "blur-through", "whip-pan", "spatial-zoom",
    }


def test_parse_dir_cam_sync():
    result = parse_dir_lines(['DIR: cam(pan:right, sync:"Taiwan")'])
    assert result["syncWords"] == ["Taiwan"]


def test_parse_dir_reveal_sync():
    result = parse_dir_lines(['DIR: reveal(sync:"manufactured")'])
    assert result["syncWords"] == ["manufactured"]


def test_parse_dir_multiple_sync_words():
    result = parse_dir_lines([
        'DIR: cam(sync:"Taiwan")',
        'DIR: reveal(sync:"TSMC")',
    ])
    assert "Taiwan" in result["syncWords"]
    assert "TSMC" in result["syncWords"]


def test_parse_dir_reveal_syncs_plural():
    """Per-element D17 vocabulary — `syncs:[...]` for templates with multiple entities."""
    result = parse_dir_lines([
        'DIR: reveal(stagger, syncs:["sixty", "three percent", "fifteen years"])',
    ])
    assert result["syncWords"] == ["sixty", "three percent", "fifteen years"]


def test_parse_dir_cam_syncs_plural():
    result = parse_dir_lines([
        'DIR: cam(overview, syncs:["Apple", "Nvidia", "AMD"], track)',
    ])
    assert result["syncWords"] == ["Apple", "Nvidia", "AMD"]


def test_parse_dir_syncs_then_sync_both_accepted():
    """Defensive: if both plural and singular appear, plural wins first."""
    result = parse_dir_lines([
        'DIR: reveal(syncs:["a","b"], sync:"c")',
    ])
    # Plural extracts first (a, b), singular appends (c).
    assert result["syncWords"] == ["a", "b", "c"]


def test_parse_dir_no_sync_returns_no_synckey():
    """Absence: directives without sync clauses don't add a syncWords key."""
    result = parse_dir_lines(['DIR: cam(overview → element:0, track)'])
    assert "syncWords" not in result


# ── parse_dir_lines · drift() directive (HOLD_MOTION_REGISTER / D20) ───────


def test_parse_dir_drift_documentary():
    """Per-segment drift override — photo plate set to documentary Ken Burns."""
    result = parse_dir_lines(['DIR: drift(documentary)'])
    assert result["driftPreset"] == "documentary"


def test_parse_dir_drift_breathing():
    result = parse_dir_lines(['DIR: drift(breathing)'])
    assert result["driftPreset"] == "breathing"


def test_parse_dir_drift_none():
    """drift(none) = total stillness, alias of hold(stillness)."""
    result = parse_dir_lines(['DIR: drift(none)'])
    assert result["driftPreset"] == "none"


def test_parse_dir_drift_settle_sway():
    for preset in ("settle", "sway"):
        result = parse_dir_lines([f'DIR: drift({preset})'])
        assert result["driftPreset"] == preset


def test_parse_dir_drift_invalid_preset_silently_rejected():
    """Forward-compat: unknown preset names don't pollute the result."""
    result = parse_dir_lines(['DIR: drift(parallax-multi)'])
    assert "driftPreset" not in result


def test_parse_dir_drift_case_insensitive():
    result = parse_dir_lines(['DIR: drift(DOCUMENTARY)'])
    assert result["driftPreset"] == "documentary"


def test_parse_dir_hold_stillness_sets_driftPreset_none():
    """hold(stillness) sugar — sets driftPreset:'none' (alias of drift(none))."""
    result = parse_dir_lines(['DIR: hold(stillness)'])
    assert result["driftPreset"] == "none"


def test_parse_dir_hold_stillness_with_pre_delay():
    """Mixed tokens: stillness + pre:1s. Both fields land on the result."""
    result = parse_dir_lines(['DIR: hold(stillness, pre:1s)'])
    assert result["driftPreset"] == "none"
    assert result["preDelay"] == 1.0


def test_parse_dir_hold_breathe_does_not_set_driftPreset():
    """hold(breathe) sets holdBehavior, not driftPreset — they're different concepts."""
    result = parse_dir_lines(['DIR: hold(breathe)'])
    assert result.get("holdBehavior") == "breathe"
    assert "driftPreset" not in result


def test_parse_dir_drift_and_sync_independent():
    """drift() and sync clauses in different directives compose cleanly."""
    result = parse_dir_lines([
        'DIR: reveal(stagger, sync:"chokepoint")',
        'DIR: drift(documentary)',
    ])
    assert result["driftPreset"] == "documentary"
    assert result["syncWords"] == ["chokepoint"]


def test_parse_dir_multiple_lines_combined():
    result = parse_dir_lines([
        "DIR: hold(breathe)",
        "DIR: cut(iris)",
    ])
    assert result["holdAfter"] == 2.0
    assert result["transitionOut"] == "iris"


def test_parse_dir_empty():
    assert parse_dir_lines([]) == {}


def test_parse_dir_invalid_format():
    # Lines that don't match DIR: pattern are silently ignored
    result = parse_dir_lines(["not a dir line", "hold(2s)"])
    assert result == {}


# ── apply_default_transitions ──────────────────────────────────────────────


def _make_seg(seg_id, seg_type, beat, component=None, pace=None, dir_trans=None):
    seg = {
        "id": seg_id,
        "type": seg_type,
        "startSec": 0.0,
        "endSec": 5.0,
        "beat": beat,
    }
    if component:
        seg["template"] = {"component": component}
    if pace:
        seg["paceProfile"] = pace
    if dir_trans:
        seg["_dirTransitionOut"] = dir_trans
    return seg


def test_transitions_empty():
    assert apply_default_transitions([]) == []


def test_transitions_single_no_transition():
    segs = [_make_seg("s1", "FOOTAGE", "beat1")]
    result = apply_default_transitions(segs)
    assert "transition" not in result[0]


def test_transitions_beat_boundary_dissolve():
    segs = [
        _make_seg("s1", "FOOTAGE", "beat1"),
        _make_seg("s2", "FOOTAGE", "beat2"),
    ]
    result = apply_default_transitions(segs)
    assert result[1]["transition"]["in"] == "dissolve"
    assert result[1]["transition"]["durationSec"] == 0.5


def test_transitions_title_card_fade():
    # Title must not be the last segment — Rule 6 overrides duration to 0.8s for the last one
    segs = [
        _make_seg("s1", "FOOTAGE", "beat1"),
        _make_seg("s2", "TRANSITION", "beat1", component="TitleTransition"),
        _make_seg("s3", "FOOTAGE", "beat2"),
    ]
    result = apply_default_transitions(segs)
    assert result[1]["transition"]["in"] == "fade"
    assert result[1]["transition"]["out"] == "fade"
    assert result[1]["transition"]["durationSec"] == 0.6


def test_transitions_last_title_longer_fade():
    segs = [
        _make_seg("s1", "FOOTAGE", "beat1"),
        _make_seg("s2", "TRANSITION", "beat1", component="TitleTransition"),
    ]
    result = apply_default_transitions(segs)
    # Last segment is a title — gets 0.8s fade
    assert result[1]["transition"]["durationSec"] == 0.8


def test_transitions_hold_skipped():
    segs = [
        _make_seg("s1", "FOOTAGE", "beat1"),
        _make_seg("s2", "HOLD", "beat1"),
        _make_seg("s3", "FOOTAGE", "beat1"),
    ]
    result = apply_default_transitions(segs)
    assert "transition" not in result[1]


def test_transitions_template_to_template_within_beat_cuts_by_default():
    """Rule 4 revised (Phase 5 of TRANSITION_GRAMMAR.md): different
    templates within the same beat default to HARD CUT (0s), not the
    legacy 0.3s dissolve. visual-spec opts in to dissolve explicitly
    via `_direction.transitionOut` when same-data sequences justify it."""
    segs = [
        _make_seg("s1", "TEMPLATE", "beat1", component="DataChart"),
        _make_seg("s2", "TEMPLATE", "beat1", component="KineticTypography"),
    ]
    result = apply_default_transitions(segs)
    # cut is the default — apply_default_transitions only writes the
    # transition field when non-default, so absence == cut.
    assert "transition" not in result[1] or result[1]["transition"]["in"] == "cut"


def test_transitions_template_to_template_dissolve_via_dir_override():
    """visual-spec opts in to dissolve for same-data sequences via DIR
    override on the prior segment. Rule 0 wins over Rule 4."""
    segs = [
        {**_make_seg("s1", "TEMPLATE", "beat1", component="DataChart"),
         "_dirTransitionOut": "dissolve",
         "_dirTransitionDuration": 0.5},
        _make_seg("s2", "TEMPLATE", "beat1", component="DataChart"),
    ]
    result = apply_default_transitions(segs)
    assert result[1]["transition"]["in"] == "dissolve"
    assert result[1]["transition"]["durationSec"] == 0.5


def test_transitions_same_template_match_cut_still_atlas_plate():
    """Rule 4a (Phase 4 of TRANSITION_GRAMMAR.md): two consecutive
    AtlasPlate segments in the same beat default to match-cut-still."""
    segs = [
        _make_seg("s1", "TEMPLATE", "beat1", component="AtlasPlate"),
        _make_seg("s2", "TEMPLATE", "beat1", component="AtlasPlate"),
    ]
    result = apply_default_transitions(segs)
    assert result[1]["transition"]["in"] == "match-cut-still"
    assert result[1]["transition"]["durationSec"] == 0.35


def test_transitions_same_template_match_cut_still_route_animation():
    segs = [
        _make_seg("s1", "TEMPLATE", "beat1", component="RouteAnimation"),
        _make_seg("s2", "TEMPLATE", "beat1", component="RouteAnimation"),
    ]
    result = apply_default_transitions(segs)
    assert result[1]["transition"]["in"] == "match-cut-still"


def test_transitions_same_template_not_in_match_cut_set_falls_back_to_cut():
    """Phase 5: DataChart→DataChart is NOT in MATCH_CUT_STILL_TEMPLATES,
    so it falls through to the revised within-beat default of HARD CUT.
    Same-data dissolve (e.g. small multiples) is opt-in via visual-spec."""
    segs = [
        _make_seg("s1", "TEMPLATE", "beat1", component="DataChart"),
        _make_seg("s2", "TEMPLATE", "beat1", component="DataChart"),
    ]
    result = apply_default_transitions(segs)
    assert "transition" not in result[1] or result[1]["transition"]["in"] == "cut"


def test_transitions_different_templates_in_match_cut_set_fall_back_to_cut():
    """AtlasPlate→ChoroplethMap are BOTH in the match-cut set, but they're
    not the SAME template — same-component is the trigger, not just
    both-eligible. Phase 5 default for non-match-cut path = HARD CUT."""
    segs = [
        _make_seg("s1", "TEMPLATE", "beat1", component="AtlasPlate"),
        _make_seg("s2", "TEMPLATE", "beat1", component="ChoroplethMap"),
    ]
    result = apply_default_transitions(segs)
    assert "transition" not in result[1] or result[1]["transition"]["in"] == "cut"


def test_transitions_match_cut_still_does_not_fire_at_beat_boundary():
    """Beat-boundary AtlasPlate→AtlasPlate stays on Rule 1 (dissolve 0.5s)
    — match-cut-still is for within-beat continuation only."""
    segs = [
        _make_seg("s1", "TEMPLATE", "beat1", component="AtlasPlate"),
        _make_seg("s2", "TEMPLATE", "beat2", component="AtlasPlate"),
    ]
    result = apply_default_transitions(segs)
    assert result[1]["transition"]["in"] == "dissolve"
    assert result[1]["transition"]["durationSec"] == 0.5


def test_transitions_match_cut_still_is_overridden_by_dir():
    """Rule 0 (DIR override) always wins over the match-cut promotion."""
    segs = [
        {**_make_seg("s1", "TEMPLATE", "beat1", component="AtlasPlate"),
         "_dirTransitionOut": "color-wash"},
        _make_seg("s2", "TEMPLATE", "beat1", component="AtlasPlate"),
    ]
    result = apply_default_transitions(segs)
    assert result[1]["transition"]["in"] == "color-wash"


def test_parse_dir_cut_match_cut_still_accepted():
    """The split variant parses through cut() like any canonical type."""
    result = parse_dir_lines(["DIR: cut(match-cut-still, 0.35s)"])
    assert result["transitionOut"] == "match-cut-still"
    assert result["transitionDuration"] == 0.35


def test_parse_dir_chapter_basic():
    """Phase 6 of TRANSITION_GRAMMAR.md — DIR: chapter("Title") sugar."""
    result = parse_dir_lines(['DIR: chapter("The Logic of Denial")'])
    assert result["chapter"]["title"] == "The Logic of Denial"
    # Slug is the final meaningful token, stop-words dropped
    assert result["chapter"]["slug"] == "denial"


def test_parse_dir_chapter_with_kicker():
    result = parse_dir_lines(['DIR: chapter("The Other Side of the Wall", kicker:"Beat 3")'])
    assert result["chapter"]["title"] == "The Other Side of the Wall"
    assert result["chapter"]["kicker"] == "Beat 3"
    assert result["chapter"]["slug"] == "wall"


def test_parse_dir_chapter_explicit_slug_override():
    """Second positional arg or `slug:"..."` overrides the auto-derived slug."""
    result = parse_dir_lines(['DIR: chapter("The Trap", "custom-slug")'])
    assert result["chapter"]["slug"] == "custom-slug"

    result2 = parse_dir_lines(['DIR: chapter("The Trap", slug:"trap-v2")'])
    assert result2["chapter"]["slug"] == "trap-v2"


def test_parse_dir_chapter_slug_handles_apostrophes_and_stopwords():
    result = parse_dir_lines(['DIR: chapter("Don\'t Look Up")'])
    # apostrophe dropped (dont), stop-words dropped → slug = "up"
    assert result["chapter"]["slug"] == "up"


def test_slugify_chapter_title_silicon_trap_examples():
    """The slugifier should produce the same slugs as SILICON_TRAP_DATA_FILES."""
    from generate_manifest import _slugify_chapter_title
    assert _slugify_chapter_title("The Logic of Denial") == "denial"
    assert _slugify_chapter_title("The Other Side of the Wall") == "wall"
    assert _slugify_chapter_title("The Trap") == "trap"
    assert _slugify_chapter_title("Your Chips") == "chips"
    assert _slugify_chapter_title("The Paradox") == "paradox"


def _make_chapter_parsed(title: str, slug: str, kicker: str | None = None) -> dict:
    """Build a synthetic parsed dict as produced by the chapter-sugar intercept."""
    return {
        "type": "TRANSITION",
        "priority": "P1",
        "component": "TitleTransition",
        "searchTerms": [],
        "source": None,
        "ramp": "standard",
        "composite": "background",
        "opacity": None,
        "durationSec": 3.0,
        "durationMode": "explicit",
        "notes": "",
        "dataFile": None,
        "backdropId": None,
        "_chapterSlug": slug,
        "_chapterTitle": title,
        "_chapterKicker": kicker,
    }


def test_build_segment_chapter_sugar_emits_titletransition():
    """Phase 6: _build_segment attaches template.props when _chapterTitle is set."""
    parsed = _make_chapter_parsed("The Logic of Denial", "denial")
    seg = _build_segment(
        1,
        parsed,
        "TRANSITION",
        0.0,
        3.0,
        "beat-a",
        "",
        "**TRANSITION** TitleTransition title-section-denial.json",
        "**TRANSITION** TitleTransition title-section-denial.json",
        {},  # data_files — no file exists, triggers warning path
        {},
        {},
    )
    assert seg["template"]["component"] == "TitleTransition"
    assert seg["template"]["props"]["title"] == "The Logic of Denial"
    assert seg["template"]["props"]["variant"] == "section"
    assert "kicker" not in seg["template"]["props"]


def test_build_segment_chapter_sugar_includes_kicker():
    """Phase 6: kicker is forwarded into template.props when present."""
    parsed = _make_chapter_parsed("The Other Side of the Wall", "wall", kicker="Beat 3")
    seg = _build_segment(
        1,
        parsed,
        "TRANSITION",
        0.0,
        3.0,
        "beat-b",
        "",
        "**TRANSITION** TitleTransition title-section-wall.json",
        "**TRANSITION** TitleTransition title-section-wall.json",
        {},
        {},
        {},
    )
    assert seg["template"]["props"]["kicker"] == "Beat 3"
    assert seg["template"]["props"]["title"] == "The Other Side of the Wall"
    assert seg["template"]["props"]["variant"] == "section"


def test_build_segment_chapter_sugar_warns_when_no_data_file(capsys):
    """Phase 6: a stderr warning is emitted when no matching JSON data file exists."""
    parsed = _make_chapter_parsed("The Trap", "trap")
    _build_segment(
        1,
        parsed,
        "TRANSITION",
        0.0,
        3.0,
        "beat-c",
        "",
        "**TRANSITION** TitleTransition title-section-trap.json",
        "**TRANSITION** TitleTransition title-section-trap.json",
        {},   # empty data_files → triggers the "no data file" warning
        {},
        {},
    )
    err = capsys.readouterr().err
    assert "title-section-trap.json" in err
    assert "DIR: chapter()" in err


def test_build_segment_chapter_sugar_no_warn_when_data_file_present(capsys):
    """Phase 6: no warning when a data file is resolved (bracket notation triggers it)."""
    parsed = _make_chapter_parsed("The Trap", "trap")
    # Bracket notation [file.json] is the direct-extraction path in resolve_data_file
    # and does not require data_files dict lookup — guarantees data_file is non-None.
    _build_segment(
        1,
        parsed,
        "TRANSITION",
        0.0,
        3.0,
        "beat-c",
        "",
        "**TRANSITION** TitleTransition [title-section-trap.json]",
        "**TRANSITION** TitleTransition [title-section-trap.json]",
        {},
        {},
        {},
    )
    err = capsys.readouterr().err
    # When data_file is resolved, the "props.title until you create the JSON" warning
    # must NOT appear.
    assert "props.title until you create" not in err


def test_build_segment_chapter_sugar_timing():
    """Phase 6: segment startSec / endSec / type are set correctly."""
    parsed = _make_chapter_parsed("The Paradox", "paradox")
    seg = _build_segment(
        3,
        parsed,
        "TRANSITION",
        10.5,   # cursor position
        3.0,    # durationSec
        "beat-d",
        "",
        "",
        "",
        {},
        {},
        {},
    )
    assert seg["startSec"] == 10.5
    assert seg["endSec"] == 13.5
    assert seg["type"] == "TRANSITION"
    assert seg["beat"] == "beat-d"


# ── Phase 7: J/L-cut audio bridge fields ──────────────────────────────────


def test_parse_dir_jcut_sets_narration_lead_in():
    """DIR: jcut(0.5) → narrationLeadIn: 0.5 in the direction dict."""
    result = parse_dir_lines(["DIR: jcut(0.5)"])
    assert result["narrationLeadIn"] == 0.5


def test_parse_dir_jcut_integer_value():
    """jcut(1) — integer with no decimal — parses correctly."""
    result = parse_dir_lines(["DIR: jcut(1)"])
    assert result["narrationLeadIn"] == 1.0


def test_parse_dir_jcut_with_s_suffix():
    """jcut(0.7s) — trailing 's' suffix accepted."""
    result = parse_dir_lines(["DIR: jcut(0.7s)"])
    assert result["narrationLeadIn"] == 0.7


def test_parse_dir_lcut_sets_narration_lag_out():
    """DIR: lcut(0.3) → narrationLagOut: 0.3 in the direction dict."""
    result = parse_dir_lines(["DIR: lcut(0.3)"])
    assert result["narrationLagOut"] == 0.3


def test_hard_cut_gets_default_narration_lead_in():
    """Phase 7: within-beat hard cuts auto-get narrationLeadIn: 0.7."""
    segs = [
        _make_seg("s1", "TEMPLATE", "beat1"),
        _make_seg("s2", "TEMPLATE", "beat1"),
    ]
    result = apply_default_transitions(segs)
    assert result[1].get("narrationLeadIn") == 0.7


def test_footage_to_footage_cut_gets_narration_lead_in():
    """Phase 7: FOOTAGE→FOOTAGE hard cuts also get the 0.7 default."""
    segs = [
        _make_seg("s1", "FOOTAGE", "beat1"),
        _make_seg("s2", "FOOTAGE", "beat1"),
    ]
    result = apply_default_transitions(segs)
    assert result[1].get("narrationLeadIn") == 0.7


def test_title_card_no_default_narration_lead_in():
    """Phase 7: TRANSITION/chapter-card segments don't get the J-cut default."""
    segs = [
        _make_seg("s1", "TEMPLATE", "beat1"),
        _make_seg("s2", "TRANSITION", "beat1", component="TitleTransition"),
    ]
    result = apply_default_transitions(segs)
    # Title cards get fade (not cut) and silence — no narrationLeadIn.
    assert "narrationLeadIn" not in result[1]


def test_stillness_on_prev_suppresses_narration_lead_in():
    """Phase 7: hold(stillness) on preceding segment blocks the J-cut default."""
    segs = [
        {**_make_seg("s1", "TEMPLATE", "beat1"), "_direction": {"driftPreset": "none"}},
        _make_seg("s2", "TEMPLATE", "beat1"),
    ]
    result = apply_default_transitions(segs)
    assert "narrationLeadIn" not in result[1]


def test_explicit_jcut_wins_over_default():
    """Phase 7: explicit narrationLeadIn from DIR: jcut() is not clobbered by 0.7 default."""
    segs = [
        _make_seg("s1", "TEMPLATE", "beat1"),
        {**_make_seg("s2", "TEMPLATE", "beat1"), "narrationLeadIn": 0.4},
    ]
    result = apply_default_transitions(segs)
    assert result[1]["narrationLeadIn"] == 0.4


def test_beat_boundary_dissolve_no_narration_lead_in():
    """Phase 7: beat-boundary dissolve (not a hard cut) skips the J-cut default."""
    segs = [
        _make_seg("s1", "TEMPLATE", "beat1"),
        _make_seg("s2", "TEMPLATE", "beat2"),
    ]
    result = apply_default_transitions(segs)
    # Rule 1 assigns dissolve — trans_in != "cut" → no narrationLeadIn
    assert result[1].get("transition", {}).get("in") == "dissolve"
    assert "narrationLeadIn" not in result[1]


def test_first_segment_no_narration_lead_in():
    """Phase 7: the first segment (i=0) never gets narrationLeadIn (nothing precedes it)."""
    segs = [_make_seg("s1", "TEMPLATE", "beat1")]
    result = apply_default_transitions(segs)
    assert "narrationLeadIn" not in result[0]


def test_narration_lag_out_forwarded_in_build_segment():
    """Phase 7: DIR: lcut() value is forwarded to the built segment via direction dict."""
    parsed = parse_visual_spec("**P1 — DataChart** · 8s")
    seg = _build_segment(
        1, parsed, "TEMPLATE", 0.0, 8.0, "beat-a", "", "", "",
        {}, {}, {"narrationLagOut": 0.5},
    )
    assert seg["narrationLagOut"] == 0.5


def test_narration_lead_in_forwarded_in_build_segment():
    """Phase 7: DIR: jcut() value is forwarded to the built segment via direction dict."""
    parsed = parse_visual_spec("**P1 — DataChart** · 8s")
    seg = _build_segment(
        1, parsed, "TEMPLATE", 0.0, 8.0, "beat-a", "", "", "",
        {}, {}, {"narrationLeadIn": 0.4},
    )
    assert seg["narrationLeadIn"] == 0.4


def test_match_cut_still_templates_set_is_canonical():
    """Lock the set so accidental edits get caught."""
    from generate_manifest import MATCH_CUT_STILL_TEMPLATES

    assert MATCH_CUT_STILL_TEMPLATES == {
        "AtlasPlate",
        "ChoroplethMap",
        "AnnotatedImage",
        "RouteAnimation",
        "PhotoMontage",
    }


def test_transitions_dir_override_beats_rule1():
    segs = [
        {**_make_seg("s1", "FOOTAGE", "beat1"), "_dirTransitionOut": "iris"},
        _make_seg("s2", "FOOTAGE", "beat2"),
    ]
    result = apply_default_transitions(segs)
    # Rule 0: direction override on previous segment sets the transition
    assert result[0]["transition"]["out"] == "iris"
    # Current segment's in mirrors the override
    assert result[1]["transition"]["in"] == "iris"


def test_transitions_urgent_pace_compresses_duration():
    segs = [
        _make_seg("s1", "FOOTAGE", "beat1"),
        {**_make_seg("s2", "FOOTAGE", "beat2"), "paceProfile": "urgent"},
    ]
    result = apply_default_transitions(segs)
    # Beat boundary would normally be 0.5s dissolve — urgent compresses by 0.6x
    trans = result[1].get("transition", {})
    if trans:
        assert trans["durationSec"] < 0.5


def test_transitions_breathing_pace_stretches_cuts_to_dissolves():
    """Phase 5: same-beat template→template now cuts by default. Rule 7's
    breathing-pace upgrade then promotes cut→dissolve (0.4s), which is the
    doctrinal escalation criterion — breathing pace IS the editorial signal
    that justifies same-data dissolve treatment."""
    segs = [
        _make_seg("s1", "TEMPLATE", "beat1", component="DataChart"),
        {**_make_seg("s2", "TEMPLATE", "beat1", component="KineticTypography"),
         "paceProfile": "breathing"},
    ]
    result = apply_default_transitions(segs)
    trans = result[1].get("transition", {})
    assert trans, "breathing pace should upgrade the default cut to a dissolve"
    assert trans["in"] == "dissolve"
    assert trans["durationSec"] == 0.4


# ── infer_music_mood ───────────────────────────────────────────────────────


def test_music_mood_keywords():
    assert infer_music_mood("The Opening") == "contemplative"
    assert infer_music_mood("The Logic of Denial") == "analytical"
    assert infer_music_mood("The Other Side of the Wall") == "tension"
    assert infer_music_mood("Your Chips") == "resolution"


def test_music_mood_default():
    assert infer_music_mood("Unknown Beat Title") == "analytical"


def test_music_mood_case_insensitive():
    assert infer_music_mood("OPENING SECTION") == "contemplative"


# ── resolve_shot_id ────────────────────────────────────────────────────────


def test_resolve_shot_id_known_term():
    shot_ids = {"TSMC Arizona": "beat1-tsmc-aerial"}
    result = resolve_shot_id(["TSMC Arizona"], shot_ids)
    assert result == "beat1-tsmc-aerial"


def test_resolve_shot_id_partial_match():
    shot_ids = {"TSMC Arizona": "beat1-tsmc-aerial"}
    result = resolve_shot_id(["TSMC Arizona desert"], shot_ids)
    assert result == "beat1-tsmc-aerial"


def test_resolve_shot_id_no_match():
    shot_ids = {"TSMC Arizona": "beat1-tsmc-aerial"}
    result = resolve_shot_id(["random footage"], shot_ids)
    assert result is None


def test_resolve_shot_id_empty_terms():
    shot_ids = {"TSMC Arizona": "beat1-tsmc-aerial"}
    assert resolve_shot_id([], shot_ids) is None


def test_resolve_shot_id_case_insensitive():
    shot_ids = {"TSMC Arizona": "beat1-tsmc-aerial"}
    result = resolve_shot_id(["tsmc arizona"], shot_ids)
    assert result == "beat1-tsmc-aerial"


def test_resolve_shot_id_first_match_wins():
    shot_ids = {
        "TSMC Arizona": "beat1-tsmc-aerial",
        "semiconductor cleanroom": "beat1-cleanroom",
    }
    result = resolve_shot_id(["TSMC Arizona", "semiconductor cleanroom"], shot_ids)
    assert result == "beat1-tsmc-aerial"


# ── build_music_bed ────────────────────────────────────────────────────────


def _make_beat(beat_id, title, start, end):
    return {"id": beat_id, "title": title, "startSec": start, "endSec": end}


def test_build_music_bed_empty_beats():
    result = build_music_bed([], 100.0)
    assert result == {"tracks": []}


def test_build_music_bed_single_beat_contemplative():
    beats = [_make_beat("beat1", "Opening", 0, 60)]
    result = build_music_bed(beats, 60.0)
    tracks = result["tracks"]
    assert len(tracks) == 1
    assert tracks[0]["mood"] == "contemplative"


def test_build_music_bed_last_beat_resolution():
    beats = [
        _make_beat("beat1", "Opening", 0, 60),
        _make_beat("beat2", "Analysis", 60, 120),
        _make_beat("beat3", "Closing", 120, 180),
    ]
    result = build_music_bed(beats, 180.0)
    tracks = result["tracks"]
    assert tracks[-1]["mood"] == "resolution"


def test_build_music_bed_filters_beats_beyond_duration():
    beats = [
        _make_beat("beat1", "Opening", 0, 60),
        _make_beat("beat2", "Beyond", 200, 260),  # beyond total_duration=100
    ]
    result = build_music_bed(beats, 100.0)
    # Only beat1 is within duration
    assert len(result["tracks"]) == 1


def test_build_music_bed_first_track_higher_volume():
    beats = [
        _make_beat("beat1", "Opening", 0, 60),
        _make_beat("beat2", "Middle", 60, 120),
    ]
    result = build_music_bed(beats, 120.0)
    assert result["tracks"][0]["volume"] > result["tracks"][1]["volume"]


def test_build_music_bed_track_ids():
    beats = [_make_beat("beat1", "Opening", 0, 60)]
    result = build_music_bed(beats, 60.0)
    assert result["tracks"][0]["id"] == "contemplative-1"


# ── lint_pacing ────────────────────────────────────────────────────────────


def _make_manifest(segments, beats=None, total_dur=None):
    segs = segments
    total = total_dur or (max(s["endSec"] for s in segs) if segs else 0)
    return {
        "segments": segs,
        "beats": beats or [],
        "totalDurationSec": total,
    }


def _pace_seg(beat, start, end, pace=None):
    s = {
        "id": f"seg-{start}",
        "type": "TEMPLATE",
        "startSec": start,
        "endSec": end,
        "beat": beat,
    }
    if pace:
        s["paceProfile"] = pace
    return s


def test_lint_pacing_empty():
    assert lint_pacing(_make_manifest([])) == []


def test_lint_pacing_urgent_run_over_45s():
    segs = [_pace_seg("beat1", i * 5, i * 5 + 5, "urgent") for i in range(10)]
    # 10 segments × 5s = 50s urgent run
    warnings = lint_pacing(_make_manifest(segs, total_dur=50))
    assert any("urgent section runs" in w for w in warnings)


def test_lint_pacing_urgent_run_under_45s():
    segs = [_pace_seg("beat1", i * 5, i * 5 + 5, "urgent") for i in range(8)]
    # 8 × 5s = 40s — under limit
    warnings = lint_pacing(_make_manifest(segs, total_dur=40))
    assert not any("urgent section runs" in w for w in warnings)


def test_lint_pacing_long_episode_no_breathing():
    segs = [_pace_seg("beat1", i * 30, i * 30 + 30) for i in range(31)]
    # 31 × 30s = 930s > 15min, no breathing moments — threshold is strictly > 900
    warnings = lint_pacing(_make_manifest(segs, total_dur=930))
    assert any("no breathing" in w for w in warnings)


def test_lint_pacing_short_episode_no_breathing_ok():
    segs = [_pace_seg("beat1", i * 30, i * 30 + 30) for i in range(10)]
    # 300s < 15min — no breathing warning expected
    warnings = lint_pacing(_make_manifest(segs, total_dur=300))
    assert not any("no breathing" in w for w in warnings)


def test_lint_pacing_whiplash_urgent_to_breathing():
    segs = [
        _pace_seg("beat1", 0, 10, "urgent"),
        _pace_seg("beat1", 10, 20, "breathing"),
    ]
    warnings = lint_pacing(_make_manifest(segs))
    assert any("whiplash" in w for w in warnings)


def test_lint_pacing_no_whiplash_with_analytical_buffer():
    segs = [
        _pace_seg("beat1", 0, 10, "urgent"),
        _pace_seg("beat1", 10, 20),           # analytical buffer
        _pace_seg("beat1", 20, 30, "breathing"),
    ]
    warnings = lint_pacing(_make_manifest(segs))
    assert not any("whiplash" in w for w in warnings)


def test_lint_pacing_three_pace_changes_in_beat():
    beats = [{"id": "beat1", "title": "Test Beat", "startSec": 0, "endSec": 40}]
    segs = [
        _pace_seg("beat1", 0, 10, "urgent"),
        _pace_seg("beat1", 10, 20, "analytical"),
        _pace_seg("beat1", 20, 30, "breathing"),
        _pace_seg("beat1", 30, 40, "urgent"),
    ]
    # 3 transitions: urgent→analytical, analytical→breathing, breathing→urgent
    warnings = lint_pacing(_make_manifest(segs, beats=beats))
    assert any("pace transitions" in w for w in warnings)


def test_lint_pacing_two_pace_changes_ok():
    beats = [{"id": "beat1", "title": "Test Beat", "startSec": 0, "endSec": 30}]
    segs = [
        _pace_seg("beat1", 0, 10, "urgent"),
        _pace_seg("beat1", 10, 20, "analytical"),
        _pace_seg("beat1", 20, 30, "breathing"),
    ]
    # 2 transitions — should be fine
    warnings = lint_pacing(_make_manifest(segs, beats=beats))
    assert not any("pace transitions" in w for w in warnings)


# ── lint_mg_streaks ───────────────────────────────────────────────────────


def _mg_row(beat: str, narr: str, visual: str) -> dict:
    return {"beat": beat, "narration": narr, "visual_raw": visual}


def test_lint_mg_streaks_empty():
    assert lint_mg_streaks([]) == []


def test_lint_mg_streaks_three_ok():
    rows = [
        _mg_row("b1", "a", "[MG: **P2 — DataChart**]"),
        _mg_row("b1", "b", "[mg: foo]"),
        _mg_row("b1", "c", "  [MG: bar]"),
    ]
    assert lint_mg_streaks(rows) == []


def test_lint_mg_streaks_four_warns_once():
    rows = [
        _mg_row("b1", "n1", "[MG: one]"),
        _mg_row("b1", "n2", "[MG: two]"),
        _mg_row("b1", "n3", "[MG: three]"),
        _mg_row("b1", "n4", "[MG: four]"),
    ]
    w = lint_mg_streaks(rows)
    assert len(w) == 1
    assert "VIS-LINT" in w[0]
    assert "beat b1" in w[0]


def test_lint_mg_streaks_resets_on_non_mg():
    rows = [
        _mg_row("b1", "a", "[MG: a]"),
        _mg_row("b1", "b", "[MG: b]"),
        _mg_row("b1", "c", "[MG: c]"),
        _mg_row("b1", "d", "[FOOTAGE: x]"),
        _mg_row("b1", "e", "[MG: e]"),
        _mg_row("b1", "f", "[MG: f]"),
        _mg_row("b1", "g", "[MG: g]"),
    ]
    assert lint_mg_streaks(rows) == []


def test_lint_mg_streaks_two_streaks_two_warnings():
    rows = (
        [_mg_row("b1", str(i), "[MG: x]") for i in range(4)]
        + [_mg_row("b1", "break", "[FOOTAGE: y]")]
        + [_mg_row("b1", str(i + 10), "[MG: x]") for i in range(4)]
    )
    w = lint_mg_streaks(rows)
    assert len(w) == 2


# ── _find_sync_word ────────────────────────────────────────────────────────


def _make_words(word_list):
    words = []
    t = 0.0
    for w in word_list:
        words.append({"word": w, "start": round(t, 3), "end": round(t + 0.3, 3)})
        t += 0.35
    return words


def test_find_sync_word_exact():
    words = _make_words(["The", "silicon", "trap"])
    result = _find_sync_word("silicon", words, 0.0, 5.0)
    assert result is not None
    assert result["word"] == "silicon"


def test_find_sync_word_case_insensitive():
    words = _make_words(["Taiwan", "today"])
    result = _find_sync_word("taiwan", words, 0.0, 5.0)
    assert result is not None


def test_find_sync_word_out_of_range():
    words = _make_words(["The", "silicon", "trap"])
    # Segment range is 10s–20s but words are at 0–1s
    result = _find_sync_word("silicon", words, 10.0, 20.0)
    assert result is None


def test_find_sync_word_no_match():
    words = _make_words(["The", "silicon", "trap"])
    result = _find_sync_word("Taiwan", words, 0.0, 5.0)
    assert result is None


def test_find_sync_word_partial_match():
    # "taiwan's" in transcript, "Taiwan" in sync word
    words = [{"word": "taiwan's", "start": 1.0, "end": 1.3}]
    result = _find_sync_word("Taiwan", words, 0.0, 5.0)
    assert result is not None


def test_find_sync_word_multiword():
    words = _make_words(["semiconductor", "cleanroom", "footage"])
    result = _find_sync_word("semiconductor cleanroom", words, 0.0, 5.0)
    assert result is not None
    assert result["word"] == "semiconductor"


# ── parse_dir_lines · type() directive (text-animation register) ───────────
# Phase 3 text-animation integration: DIR: type(<technique>) populates
# _direction.textAnimation. Used by visual-spec and template dispatch
# (KineticTypography → DefinitionReveal / QuoteAttribution / StatCaption).

def test_parse_dir_type_typewriter():
    result = parse_dir_lines(["DIR: type(typewriter)"])
    assert result["textAnimation"] == "typewriter"


def test_parse_dir_type_composite_quote_attribution():
    result = parse_dir_lines(["DIR: type(quote-attribution)"])
    assert result["textAnimation"] == "quote-attribution"


def test_parse_dir_type_composite_definition_reveal():
    result = parse_dir_lines(["DIR: type(definition-reveal)"])
    assert result["textAnimation"] == "definition-reveal"


def test_parse_dir_type_unknown_technique_ignored():
    """Unknown technique names don't pollute result — silently dropped.

    Forward-compat: if the schema enum gains a new value before manifest
    generator is updated, scripts referencing it just fall back to no
    directive rather than emitting an invalid field.
    """
    result = parse_dir_lines(["DIR: type(nonexistent-technique)"])
    assert "textAnimation" not in result


def test_parse_dir_type_with_bare_callback_modifier():
    result = parse_dir_lines(["DIR: type(definition-reveal, callback)"])
    assert result["textAnimation"] == "definition-reveal"
    assert result["isCallback"] is True


def test_parse_dir_type_with_callback_keyword_form():
    result = parse_dir_lines(["DIR: type(definition-reveal, isCallback:true)"])
    assert result["textAnimation"] == "definition-reveal"
    assert result["isCallback"] is True


def test_parse_dir_type_callback_explicit_false():
    """isCallback:false is honored — visual-spec may emit it to overwrite
    a default."""
    result = parse_dir_lines(["DIR: type(definition-reveal, isCallback:false)"])
    assert result["isCallback"] is False


def test_parse_dir_type_isolated_callback_modifier():
    """Bare `callback` without technique → isCallback only, no textAnimation."""
    result = parse_dir_lines(["DIR: type(callback)"])
    assert "textAnimation" not in result
    assert result["isCallback"] is True


def test_parse_dir_type_unknown_subparams_ignored_silently():
    """Future-proofing: cps:22, cursor:blink etc. accepted and dropped."""
    result = parse_dir_lines(["DIR: type(typewriter, cps:30, cursor:solid)"])
    assert result["textAnimation"] == "typewriter"
    # Other tokens not surfaced — won't pollute _direction with unknown fields
    assert "cps" not in result
    assert "cursor" not in result


def test_parse_dir_type_composes_with_other_directives():
    """Multiple DIR: lines on the same segment all merge into one dict."""
    result = parse_dir_lines([
        "DIR: type(quote-attribution)",
        "DIR: hold(breathe)",
        "DIR: mood(subtle)",  # mood() exists and would parse — testing that
                              # type() doesn't conflict with the others.
    ])
    assert result["textAnimation"] == "quote-attribution"
    assert result["holdAfter"] == 2.0


# ── resolve_all_sync_points · end-to-end Whisper resolution path ───────────
#
# These tests exercise the precise-mode pipeline without requiring WhisperX
# to be installed. We synthesize the `words` list that WhisperX would produce
# (each item has word/start/end/confidence) and verify resolve_all_sync_points
# correctly attaches segment.syncPoints with episode-absolute timestamps and
# frame-rounded indices.


def _words_at(items):
    """Build a Whisper-shaped words list. items = [(word, start_sec, [confidence])]."""
    out = []
    for it in items:
        if len(it) == 3:
            w, s, c = it
        else:
            w, s = it
            c = 1.0
        out.append({"word": w, "start": s, "end": s + 0.25, "confidence": c})
    return out


def test_resolve_sync_points_single_match():
    """Basic case: one syncWord, one matching Whisper word in segment range."""
    segments = [
        {"id": "s1", "startSec": 0.0, "endSec": 10.0, "syncWords": ["Taiwan"]},
    ]
    words = _words_at([("Taiwan", 4.5, 0.95)])
    resolve_all_sync_points(segments, words)
    assert "syncPoints" in segments[0]
    sp = segments[0]["syncPoints"]
    assert len(sp) == 1
    assert sp[0]["word"] == "Taiwan"
    assert sp[0]["timeSec"] == 4.5
    assert sp[0]["frame"] == round(4.5 * FPS)
    assert sp[0]["confidence"] == 0.95


def test_resolve_sync_points_unresolved_writes_null_entry():
    """Sync word not present in audio: emit entry with confidence=0, null timeSec/frame."""
    segments = [
        {"id": "s1", "startSec": 0.0, "endSec": 10.0, "syncWords": ["Mongolia"]},
    ]
    words = _words_at([("Taiwan", 4.5)])
    resolve_all_sync_points(segments, words)
    sp = segments[0]["syncPoints"]
    assert len(sp) == 1
    assert sp[0]["word"] == "Mongolia"
    assert sp[0]["timeSec"] is None
    assert sp[0]["frame"] is None
    assert sp[0]["confidence"] == 0


def test_resolve_sync_points_multi_word_returns_first_word_frame():
    """Multi-word sync ('two thousand') matches a sliding window; frame anchors on the FIRST word."""
    segments = [
        {"id": "s1", "startSec": 0.0, "endSec": 10.0, "syncWords": ["two thousand"]},
    ]
    # "two" at 3.0, "thousand" at 3.4 — multi-word match anchors on the first.
    words = _words_at([("two", 3.0), ("thousand", 3.4)])
    resolve_all_sync_points(segments, words)
    sp = segments[0]["syncPoints"]
    assert sp[0]["timeSec"] == 3.0
    assert sp[0]["frame"] == round(3.0 * FPS)


def test_resolve_sync_points_per_element_d17():
    """Per-element D17 case: 3 syncWords on one segment → 3 syncPoints in order,
    each resolved against its respective Whisper word. Each entity gets its own anchor."""
    segments = [{
        "id": "s1", "startSec": 0.0, "endSec": 20.0,
        "syncWords": ["sixty", "three percent", "fifteen years"],
    }]
    words = _words_at([
        ("sixty", 2.0),
        ("three", 7.0),
        ("percent", 7.4),  # multi-word resolves on "three"
        ("fifteen", 12.0),
        ("years", 12.4),   # multi-word resolves on "fifteen"
    ])
    resolve_all_sync_points(segments, words)
    sp = segments[0]["syncPoints"]
    assert len(sp) == 3
    # Order preserved — index 0 is "sixty" (entity 0), 1 is "three percent" (entity 1), 2 is "fifteen years"
    assert sp[0]["word"] == "sixty"      and sp[0]["timeSec"] == 2.0
    assert sp[1]["word"] == "three percent" and sp[1]["timeSec"] == 7.0
    assert sp[2]["word"] == "fifteen years" and sp[2]["timeSec"] == 12.0


def test_resolve_sync_points_respects_segment_boundary():
    """A syncWord in segment A's range shouldn't match a Whisper word in segment B's range
    even if the same surface word appears there. (Boundary tolerance is ±0.5s.)"""
    segments = [
        {"id": "s1", "startSec": 0.0, "endSec": 5.0, "syncWords": ["Taiwan"]},
        {"id": "s2", "startSec": 6.0, "endSec": 10.0, "syncWords": ["Taiwan"]},
    ]
    # Two "Taiwan" utterances, one in each segment's range.
    words = _words_at([("Taiwan", 2.5), ("Taiwan", 7.5)])
    resolve_all_sync_points(segments, words)
    assert segments[0]["syncPoints"][0]["timeSec"] == 2.5
    assert segments[1]["syncPoints"][0]["timeSec"] == 7.5


def test_resolve_sync_points_segment_without_syncwords_unchanged():
    """Segments without syncWords are not modified — no syncPoints key added."""
    segments = [{"id": "s1", "startSec": 0.0, "endSec": 5.0}]  # no syncWords
    words = _words_at([("Taiwan", 2.0)])
    resolve_all_sync_points(segments, words)
    assert "syncPoints" not in segments[0]


def test_resolve_sync_points_dir_to_resolved_pipeline():
    """End-to-end: DIR annotation → parse_dir_lines → segment shape → resolve_all_sync_points.

    Simulates the precise-mode pipeline in miniature: a per-element D17 directive
    written in a script flows through extraction and resolution and lands as a
    fully-resolved syncPoints array on the segment, ready for FullEpisode to
    convert to segment-relative coordinates and inject into _direction."""
    # Step 1: parse the DIR line — extracts syncWords via _extract_sync_words
    dir_result = parse_dir_lines([
        'DIR: reveal(stagger, syncs:["Apple","Nvidia","AMD"])',
    ])
    assert dir_result["syncWords"] == ["Apple", "Nvidia", "AMD"]

    # Step 2: build a segment carrying those syncWords (what generate_manifest does)
    segments = [{
        "id": "beat1-network",
        "startSec": 30.0, "endSec": 45.0,
        "syncWords": dir_result["syncWords"],
        "type": "TEMPLATE",
    }]

    # Step 3: WhisperX (mocked) produces word timestamps
    words = _words_at([
        ("Apple", 32.0),
        ("designs", 32.3),
        ("Nvidia", 36.5),
        ("ships", 37.0),
        ("AMD", 41.0),
        ("rounds", 41.4),
    ])

    # Step 4: resolve_all_sync_points fills in syncPoints with frame-accurate timestamps
    resolve_all_sync_points(segments, words)
    sp = segments[0]["syncPoints"]
    assert [p["word"] for p in sp] == ["Apple", "Nvidia", "AMD"]
    assert [p["timeSec"] for p in sp] == [32.0, 36.5, 41.0]
    assert [p["frame"] for p in sp] == [round(32.0 * FPS), round(36.5 * FPS), round(41.0 * FPS)]
    # All resolved with confidence > 0
    assert all(p["confidence"] > 0 for p in sp)
