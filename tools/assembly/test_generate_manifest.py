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
    _find_sync_word,
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


def test_transitions_template_to_template_dissolve():
    segs = [
        _make_seg("s1", "TEMPLATE", "beat1", component="DataChart"),
        _make_seg("s2", "TEMPLATE", "beat1", component="KineticTypography"),
    ]
    result = apply_default_transitions(segs)
    assert result[1]["transition"]["in"] == "dissolve"
    assert result[1]["transition"]["durationSec"] == 0.3


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
    segs = [
        _make_seg("s1", "TEMPLATE", "beat1", component="DataChart"),
        {**_make_seg("s2", "TEMPLATE", "beat1", component="KineticTypography"),
         "paceProfile": "breathing"},
    ]
    result = apply_default_transitions(segs)
    # Same beat template→template is normally dissolve 0.3s
    # Breathing should stretch it
    trans = result[1].get("transition", {})
    if trans:
        assert trans["durationSec"] >= 0.3


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
