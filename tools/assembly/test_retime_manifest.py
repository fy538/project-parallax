"""Tests for retime_manifest.py — re-timing a hand-wired manifest to narration."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from retime_manifest import (  # noqa: E402
    FPS,
    build_warp,
    format_report,
    normalise_words,
    retime,
    retime_audio_plan,
    warp,
    wiring,
)

LINE_A = "You have probably asked an assistant whether your idea is any good"
LINE_B = "Immanuel Kant described a shop like this one two centuries ago"
LINE_C = "Take away the watching and ask what happens to the behavior"
LINE_D = "That is the Unwatched Test in a single plain sentence"


def _speak(lines):
    """[(start_sec, text)] → word timestamps at four words a second."""
    words = []
    for start, text in lines:
        for i, w in enumerate(text.split()):
            words.append({"word": w, "start": round(start + i * 0.25, 3), "end": round(start + i * 0.25 + 0.2, 3)})
    return words


def _seg(seg_id, start, end, ref, **extra):
    return {"id": seg_id, "type": "TEMPLATE", "startSec": start, "endSec": end,
            "layer": "foreground", "beat": "beat1", "narrationRef": ref, **extra}


def _manifest(segments, **extra):
    total = max(s["endSec"] for s in segments)
    return {"version": "3", "episode": "t", "fps": 30, "totalDurationSec": total, "mode": "estimate",
            "narration": {"totalDurationSec": total, "words": []},
            "beats": [{"id": "beat1", "title": "ONE", "startSec": 0.0, "endSec": total}],
            "segments": segments, **extra}


def _three():
    return _manifest([_seg("a", 0.0, 10.0, LINE_A), _seg("b", 10.0, 20.0, LINE_B), _seg("c", 20.0, 30.0, LINE_C)])


# ── word-timestamp formats ───────────────────────────────────────────────────


def test_normalise_words_plain_list_and_wrapped():
    plain = [{"word": " Hello ", "start": 0.1, "end": 0.4}]
    assert normalise_words(plain) == [{"word": "Hello", "start": 0.1, "end": 0.4}]
    assert normalise_words({"words": [{"word": "Hi", "start_sec": 1.0, "end_sec": 1.2}]})[0]["start"] == 1.0


def test_word_probability_is_used_for_cues_but_not_stored():
    manifest = _three()
    manifest["segments"][1]["syncWords"] = ["Kant"]
    words = normalise_words(_speak([(0.5, LINE_A), (12.0, LINE_B), (21.0, LINE_C)]))
    for w in words:
        w["probability"] = 0.7
    new, _ = retime(manifest, words, audio_sec=24.0)
    assert new["segments"][1]["syncPoints"][0]["confidence"] == 0.7
    assert set(new["narration"]["words"][0]) == {"word", "start", "end"}


def test_normalise_words_whisperx_and_whisper_cpp():
    whisperx = {"segments": [{"words": [{"word": "one", "start": 0.0, "end": 0.2}, {"word": "36"}]}]}
    assert [w["word"] for w in normalise_words(whisperx)] == ["one"]  # the untimed numeral is dropped
    cpp = {"transcription": [{"text": " two", "offsets": {"from": 1500, "to": 1800}}]}
    assert normalise_words(cpp) == [{"word": "two", "start": 1.5, "end": 1.8}]


# ── the time map ─────────────────────────────────────────────────────────────


def test_warp_is_linear_between_anchors_and_keeps_durations_after_the_last():
    pts = [(0.0, 0.0), (10.0, 12.0), (20.0, 21.0)]
    assert warp(5.0, pts) == 6.0
    assert warp(15.0, pts) == 16.5
    assert warp(26.0, pts) == 27.0


def test_build_warp_drops_hits_that_are_out_of_order():
    anchors = [{"id": "b", "old": 10.0, "new": 12.0}, {"id": "c", "old": 20.0, "new": 11.0},
               {"id": "d", "old": 30.0, "new": 31.0}]
    pts, dropped = build_warp(anchors, 40.0, None)
    assert [d["id"] for d in dropped] == ["c"]
    assert pts == [(0.0, 0.0), (10.0, 12.0), (30.0, 31.0), (40.0, 41.0)]


# ── retime ───────────────────────────────────────────────────────────────────


def test_retime_moves_each_segment_to_where_its_line_is_spoken():
    words = _speak([(0.5, LINE_A), (12.0, LINE_B), (21.0, LINE_C)])
    new, facts = retime(_three(), words, audio_sec=24.0)
    a, b, c = new["segments"]
    assert (a["startSec"], a["endSec"]) == (0.0, 12.0)  # the episode still starts at 0
    assert (b["startSec"], b["endSec"]) == (12.0, 21.0)
    assert (c["startSec"], c["endSec"]) == (21.0, 31.0)  # past the last line the old length is kept
    assert new["totalDurationSec"] == 31.0
    assert new["mode"] == "precise"
    assert new["beats"][0]["endSec"] == 31.0
    assert facts["wiringUnchanged"] is True
    assert facts["seams"] == {"before": 0, "after": 0}


def test_retime_extends_the_end_to_cover_a_longer_recording():
    words = _speak([(0.5, LINE_A), (12.0, LINE_B), (21.0, LINE_C)])
    new, _ = retime(_three(), words, audio_sec=40.0)
    assert new["segments"][-1]["endSec"] == 40.0


def test_retime_carries_an_unmatched_segment_between_its_neighbours():
    words = _speak([(0.5, LINE_A), (21.0, LINE_C)])  # B's line is missing from the take
    new, facts = retime(_three(), words, audio_sec=24.0)
    a, b, c = new["segments"]
    assert facts["unmatched"] == ["b"]
    assert b["startSec"] == 10.5 and a["endSec"] == 10.5
    assert b["endSec"] == c["startSec"] == 21.0


def test_retime_does_not_search_twice_for_a_shared_line():
    manifest = _manifest([_seg("a", 0.0, 10.0, LINE_A), _seg("portrait", 10.0, 14.0, LINE_B),
                          _seg("quote", 14.0, 20.0, LINE_B), _seg("c", 20.0, 30.0, LINE_C)])
    words = _speak([(0.5, LINE_A), (12.0, LINE_B), (22.0, LINE_C)])
    new, facts = retime(manifest, words, audio_sec=25.0)
    by_id = {s["id"]: s for s in new["segments"]}
    assert facts["shared"] == ["quote"]
    assert by_id["portrait"]["startSec"] == 12.0
    assert by_id["portrait"]["endSec"] == by_id["quote"]["startSec"] == 16.0
    assert by_id["quote"]["endSec"] == 22.0


def test_retime_keeps_wiring_and_abutment_for_a_hold_under_card():
    picture = {**_seg("pic", 10.0, 20.0, LINE_C), "type": "FOOTAGE", "layer": "background",
               "asset": {"file": "clips/street.mp4", "source": "local-aigen"}, "preDelay": 3.0}
    card = _seg("card", 20.0, 29.0, LINE_D, layered={"backgroundSegmentId": "pic", "backgroundDim": 0.6},
                transition={"in": "cut", "out": "dissolve", "durationSec": 0.5},
                textureCues=[{"type": "card-settle", "offsetSec": 4.5}])
    manifest = _manifest([_seg("a", 0.0, 10.0, LINE_A), picture, card])
    words = _speak([(0.4, LINE_A), (15.0, LINE_C), (23.0, LINE_D)])
    new, facts = retime(manifest, words, audio_sec=27.0)
    by_id = {s["id"]: s for s in new["segments"]}
    assert facts["wiringUnchanged"] is True
    assert wiring(new) == wiring(manifest)
    assert by_id["pic"]["endSec"] == by_id["card"]["startSec"] == 23.0  # still abuts: hold-under survives
    assert by_id["card"]["layered"] == {"backgroundSegmentId": "pic", "backgroundDim": 0.6}
    assert by_id["card"]["transition"]["out"] == "dissolve"
    # The picture's line was anchored 3s into its slot; the lead-in is now whatever the take leaves.
    assert by_id["pic"]["preDelay"] == round(15.0 - by_id["pic"]["startSec"], 2)


def test_retime_scales_cue_offsets_with_the_segment():
    manifest = _three()
    manifest["segments"][1]["textureCues"] = [{"type": "dot-click", "offsetSec": 5.0}]
    manifest["segments"][1]["soundCue"] = {"type": "quote-bell", "offsetSec": 1.0}
    words = _speak([(0.5, LINE_A), (12.0, LINE_B), (21.0, LINE_C)])
    new, _ = retime(manifest, words, audio_sec=24.0)
    b = new["segments"][1]  # 10s → 9s
    assert b["textureCues"][0]["offsetSec"] == 4.5
    assert b["soundCue"]["offsetSec"] == 0.9


def test_retime_snaps_every_boundary_to_a_whole_frame():
    words = _speak([(0.37, LINE_A), (11.713, LINE_B), (20.489, LINE_C)])
    new, facts = retime(_three(), words, audio_sec=23.3)
    for seg in new["segments"]:
        for key in ("startSec", "endSec"):
            assert abs(seg[key] * FPS - round(seg[key] * FPS)) < 1e-2
    assert facts["seams"]["after"] == 0


def test_retime_leaves_the_input_manifest_untouched():
    manifest = _three()
    words = _speak([(0.5, LINE_A), (12.0, LINE_B), (21.0, LINE_C)])
    retime(manifest, words, audio_sec=24.0)
    assert manifest["segments"][1]["startSec"] == 10.0 and manifest["mode"] == "estimate"


def test_retime_audio_plan_moves_music_edges_and_scales_cues():
    pts = [(0.0, 0.0), (10.0, 12.0), (20.0, 21.0), (30.0, 31.0)]
    plan = {"musicBed": {"tracks": [{"id": "bed", "startSec": 10.0, "endSec": 25.0, "fadeInSec": 3}]},
            "layer2": [{"segment": "b", "type": "quote-bell", "offsetSec": 2.0}],
            "layer3": [{"segment": "elsewhere", "type": "dot-click", "offsetSec": 1.0}]}
    new = retime_audio_plan(plan, pts, {"b": 0.9})
    track = new["musicBed"]["tracks"][0]
    assert (track["startSec"], track["endSec"], track["fadeInSec"]) == (12.0, 26.0, 3)
    assert new["layer2"][0]["offsetSec"] == 1.8
    assert new["layer3"][0]["offsetSec"] == 1.0


def test_report_names_what_was_not_found():
    words = _speak([(0.5, LINE_A), (21.0, LINE_C)])
    _, facts = retime(_three(), words, audio_sec=24.0)
    report = format_report("t", facts, {"shortTemplates": [], "longClips": []}, "test words")
    assert "Lines found in the recording: 2 of 3" in report
    assert "`b`" in report
    assert "Wiring unchanged (everything except times): yes" in report


def test_retime_records_the_slot_each_graphic_was_written_for():
    manifest = _three()
    manifest["segments"][1]["template"] = {"component": "AxiomList", "dataFile": "x.json"}
    words = _speak([(0.5, LINE_A), (12.0, LINE_B), (21.0, LINE_C)])
    once, _ = retime(manifest, words, audio_sec=24.0)
    assert once["segments"][1]["authoredDurationSec"] == 10.0   # 10s slot became 9s
    assert "authoredDurationSec" not in once["segments"][0]     # not a graphic
    # A second re-time keeps the original authored length.
    twice, facts = retime(once, _speak([(0.5, LINE_A), (11.0, LINE_B), (19.0, LINE_C)]), audio_sec=22.0)
    assert twice["segments"][1]["authoredDurationSec"] == 10.0
    assert facts["wiringUnchanged"] is True

