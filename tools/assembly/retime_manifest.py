#!/usr/bin/env python3
"""
Re-time an existing assembly manifest to recorded narration, keeping its wiring.

`generate_manifest.py --audio` (and `tools/narration/scratch_pass.py`, which
calls it) rebuilds the manifest from the script before it aligns. Everything
wired by hand after visual-spec — clip files, split rows, hold-under, per-seam
transitions — is lost. This tool leaves every segment as it is and moves only
time.

How it works:
  1. Find where each segment's narration starts in the recording: the first
     words of its `narrationRef`, searched forward through the word timestamps.
     Each hit is an anchor (old time → recorded time).
  2. Stretch the old timeline through those anchors, linearly between them.
     Every boundary — segment starts and ends, beat edges, music-bed edges —
     goes through the same map, so segments that abutted still abut, nothing
     overlaps and the order never changes. A segment without a hit is carried
     along between its neighbours.
  3. Offsets inside a segment (sound and texture cues) scale with the segment.
     Reveal times typed into a graphic's data file are not rewritten: each
     template segment records the slot length its data was written for
     (`authoredDurationSec`) and FullEpisode scales them when it renders.
  4. Sync words are resolved against the recording.

Boundaries are snapped to whole frames, so seams stay frame-exact.

Usage:
    python3 tools/assembly/retime_manifest.py <slug> --audio narration.wav
    python3 tools/assembly/retime_manifest.py <slug> --words words.json
    python3 tools/assembly/retime_manifest.py <slug> --audio narration.wav --write

Without --write nothing in the repo changes: the re-timed manifest and a report
go to remotion-templates/out/retime/<slug>/. With --write the live manifest
(and the episode's audio plan, if present) is replaced and the previous copy is
kept in that folder.

--audio transcribes with faster-whisper through tools/narration/whisper_alignment.py
(`pip install faster-whisper`). --words takes word timestamps from any source:
a list of {word, start, end}, or WhisperX / openai-whisper / faster-whisper /
whisper.cpp JSON.
"""
from __future__ import annotations

import argparse
import bisect
import copy
import json
import re
import shutil
import subprocess
import sys
from datetime import datetime
from difflib import SequenceMatcher
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))

from generate_manifest import FPS, MATCH_THRESHOLD, resolve_all_sync_points  # noqa: E402

REMOTION = REPO_ROOT / "remotion-templates"

# How many leading words of a narrationRef identify where the segment's line starts.
REF_TOKENS = 8
# Anchors closer together than this (in either timeline), or out of order, are dropped.
MIN_ANCHOR_GAP_SEC = 0.1
# Search budget: speech rate assumed when deciding how far ahead a line can be.
TOKENS_PER_SEC = 2.5
# Reported, not enforced.
STRETCH_NOTE = (0.75, 1.33)
STRETCH_SUSPECT = (0.5, 2.0)
SHORT_SEGMENT_SEC = 1.5
VIDEO_EXTS = {".mp4", ".mov", ".webm", ".m4v"}


# ── Word timestamps ─────────────────────────────────────────────────────────


def normalise_words(data) -> list[dict]:
    """Flatten any of the common word-timestamp JSON shapes to
    [{"word", "start", "end"}], dropping entries without a time."""
    if isinstance(data, dict):
        if "words" in data:
            items = data["words"]
        elif "word_segments" in data:  # WhisperX
            items = data["word_segments"]
        elif "segments" in data:  # openai-whisper / faster-whisper / WhisperX
            items = [w for seg in data["segments"] for w in (seg.get("words") or [])]
        elif "transcription" in data:  # whisper.cpp (-ml 1), milliseconds
            items = data["transcription"]
        else:
            raise ValueError("no word list found (expected words / word_segments / segments / transcription)")
    else:
        items = data

    words = []
    for w in items:
        text = str(w.get("word", w.get("text", ""))).strip()
        start = w.get("start", w.get("start_sec"))
        end = w.get("end", w.get("end_sec"))
        if start is None and isinstance(w.get("offsets"), dict):
            start = w["offsets"]["from"] / 1000
            end = w["offsets"]["to"] / 1000
        if not text or start is None:  # WhisperX leaves some tokens (numerals) untimed
            continue
        word = {"word": text, "start": float(start), "end": float(end if end is not None else start)}
        heard = w.get("probability", w.get("score", w.get("confidence")))
        if isinstance(heard, (int, float)) and heard >= 0:
            word["probability"] = float(heard)  # carried for sync-cue confidence, not stored
        words.append(word)
    if not words:
        raise ValueError("no timed words found")
    return words


def transcribe(audio_path: Path, model_size: str, language: str) -> list[dict]:
    sys.path.insert(0, str(REPO_ROOT / "tools" / "narration"))
    import whisper_alignment as wa  # noqa: E402

    transcript = wa.transcribe_wav(audio_path, model_size=model_size, language=language)
    return [
        {"word": w.word.strip(), "start": w.start_sec, "end": w.end_sec,
         **({"probability": w.probability} if w.probability >= 0 else {})}
        for w in transcript.words if w.word.strip()
    ]


def media_duration(path: Path) -> float | None:
    """Length of an audio or video file in seconds (None without ffprobe)."""
    if not shutil.which("ffprobe"):
        return None
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True,
    )
    try:
        return float(out.stdout.strip())
    except ValueError:
        return None


# ── Anchors ─────────────────────────────────────────────────────────────────


def _tokens(text: str) -> list[str]:
    return re.sub(r"[^\w\s]", " ", text.lower().replace("'", "").replace("’", "")).split()


def _word_tokens(words: list[dict]) -> list[tuple[str, float]]:
    """Transcript as (token, start) pairs; a hyphenated word yields several
    tokens that share its start."""
    return [(tok, w["start"]) for w in words for tok in _tokens(w["word"])]


def _find(ref: list[str], stream: list[tuple[str, float]], lo: int, hi: int) -> tuple[int, float] | None:
    phrase = " ".join(ref)
    best_i, best_score = -1, 0.0
    # Near the end of the take the window may be shorter than the phrase.
    for i in range(lo, min(hi, len(stream) - 2)):
        window = " ".join(tok for tok, _ in stream[i : i + len(ref)])
        score = SequenceMatcher(None, phrase, window).ratio() * 100
        if stream[i][0] == ref[0]:  # prefer the window that starts on the line's first word
            score = min(100.0, score + 5)
        if score > best_score:
            best_i, best_score = i, score
    return (best_i, best_score) if best_score >= MATCH_THRESHOLD else None


def match_anchors(ordered: list[dict], words: list[dict]) -> dict:
    """Find where each segment's narration starts in the recording.

    Searches forward only, so anchors come out in order. A segment that shares
    its line with an earlier segment (a portrait, then the quote card for the
    same sentence) is not searched again — it rides between its neighbours.
    """
    stream = _word_tokens(words)
    anchors, unmatched, shared, no_ref = [], [], [], []
    seen: set[str] = set()
    cursor = 0
    last_old = 0.0
    for seg in ordered:
        ref = _tokens(seg.get("narrationRef") or "")[:REF_TOKENS]
        if len(ref) < 3:
            no_ref.append(seg["id"])
            continue
        phrase = " ".join(ref)
        if phrase in seen:
            shared.append(seg["id"])
            continue
        seen.add(phrase)
        old = seg["startSec"] + (seg.get("preDelay") or 0)
        budget = int(max(0.0, old - last_old) * TOKENS_PER_SEC * 2.5) + 40
        hit = _find(ref, stream, cursor, cursor + budget)
        if hit is None:
            unmatched.append(seg["id"])
            continue
        idx, score = hit
        anchors.append({"id": seg["id"], "old": old, "new": stream[idx][1], "score": round(score)})
        cursor = idx + 1
        last_old = old
    return {"anchors": anchors, "unmatched": unmatched, "shared": shared, "noRef": no_ref}


# ── The time map ────────────────────────────────────────────────────────────


def build_warp(anchors: list[dict], old_total: float, new_floor: float | None) -> tuple[list[tuple[float, float]], list[dict]]:
    """Anchor points of the old → new map. The episode still starts at 0; past
    the last anchor the old durations are kept, extended if the recording runs
    longer."""
    pts: list[tuple[float, float]] = [(0.0, 0.0)]
    dropped = []
    for a in anchors:
        if a["old"] < MIN_ANCHOR_GAP_SEC:
            continue  # the opening segment starts at 0 whatever silence leads the take
        last_old, last_new = pts[-1]
        if a["old"] - last_old < MIN_ANCHOR_GAP_SEC or a["new"] - last_new < MIN_ANCHOR_GAP_SEC:
            dropped.append(a)
            continue
        pts.append((a["old"], a["new"]))
    last_old, last_new = pts[-1]
    if old_total - last_old >= MIN_ANCHOR_GAP_SEC:
        end_new = last_new + (old_total - last_old)
        if new_floor is not None:
            end_new = max(end_new, new_floor)
        pts.append((old_total, end_new))
    return pts, dropped


def warp(t: float, pts: list[tuple[float, float]]) -> float:
    olds = [p[0] for p in pts]
    i = bisect.bisect_right(olds, t) - 1
    if i < 0:
        return t
    if i >= len(pts) - 1:
        return pts[-1][1] + (t - pts[-1][0])
    (o0, n0), (o1, n1) = pts[i], pts[i + 1]
    return n0 + (t - o0) * (n1 - n0) / (o1 - o0)


def _snap(t: float) -> float:
    """Whole frames, stored so that round(t * FPS) recovers the frame."""
    return round(round(t * FPS) / FPS, 4)


# ── Re-time ─────────────────────────────────────────────────────────────────

_SEGMENT_TIME_KEYS = {"startSec", "endSec", "preDelay", "holdAfter", "syncPoints", "authoredDurationSec"}


def wiring(manifest: dict) -> list[dict]:
    """The manifest's segments with every time-bearing value removed — what a
    re-time must leave untouched."""
    out = []
    for seg in manifest["segments"]:
        s = {k: copy.deepcopy(v) for k, v in seg.items() if k not in _SEGMENT_TIME_KEYS}
        for key in ("soundCue", "soundCueSecondary"):
            if isinstance(s.get(key), dict):
                s[key].pop("offsetSec", None)
        for cue in s.get("textureCues") or []:
            cue.pop("offsetSec", None)
        out.append(s)
    return out


def retime(manifest: dict, words: list[dict], audio_sec: float | None = None, audio_file: str | None = None) -> tuple[dict, dict]:
    """Return (re-timed copy of the manifest, facts for the report)."""
    new = copy.deepcopy(manifest)
    segs = new["segments"]
    ordered = sorted(segs, key=lambda s: s["startSec"])
    old_total = max(manifest.get("totalDurationSec") or 0, max(s["endSec"] for s in segs))
    if audio_sec is None:
        audio_sec = words[-1]["end"]

    found = match_anchors(ordered, words)
    pts, dropped = build_warp(found["anchors"], old_total, audio_sec)
    anchor_new = {a["id"]: a["new"] for a in found["anchors"] if a not in dropped}

    def f(t: float) -> float:
        return _snap(warp(t, pts))

    rows, factors = [], {}
    for seg in segs:
        old_s, old_e = seg["startSec"], seg["endSec"]
        seg["startSec"], seg["endSec"] = f(old_s), f(old_e)
        old_dur, new_dur = old_e - old_s, seg["endSec"] - seg["startSec"]
        factor = new_dur / old_dur if old_dur > 0 else 1.0
        # The slot length the segment's data file was written for. Recorded the
        # first time timings move and never overwritten, so FullEpisode can
        # scale reveal times typed in seconds (src/utils/scaleToSlot.ts).
        if seg.get("template") and "authoredDurationSec" not in seg:
            seg["authoredDurationSec"] = round(old_dur, 3)
        factors[seg["id"]] = factor
        for key in ("soundCue", "soundCueSecondary"):
            cue = seg.get(key)
            if isinstance(cue, dict) and "offsetSec" in cue:
                cue["offsetSec"] = round(cue["offsetSec"] * factor, 2)
        for cue in seg.get("textureCues") or []:
            if "offsetSec" in cue:
                cue["offsetSec"] = round(cue["offsetSec"] * factor, 2)
        if "holdAfter" in seg:
            seg["holdAfter"] = round(seg["holdAfter"] * factor, 2)
        if "preDelay" in seg:
            # The lead-in is whatever the recording leaves before the line.
            lead = anchor_new[seg["id"]] - seg["startSec"] if seg["id"] in anchor_new else seg["preDelay"] * factor
            seg["preDelay"] = round(max(0.0, lead), 2)
        rows.append({
            "id": seg["id"], "beat": seg.get("beat"), "type": seg.get("type"),
            "component": (seg.get("template") or {}).get("component"),
            "dataFile": (seg.get("template") or {}).get("dataFile"),
            "assetFile": (seg.get("asset") or {}).get("file"),
            "oldStart": old_s, "oldDur": round(old_dur, 2),
            "newStart": seg["startSec"], "newDur": round(new_dur, 2), "factor": factor,
        })

    beat_rows = []
    for beat in new.get("beats") or []:
        old_b = (beat["startSec"], beat["endSec"])
        beat["startSec"], beat["endSec"] = f(old_b[0]), f(old_b[1])
        beat_rows.append({"id": beat["id"], "title": beat.get("title", ""),
                          "oldDur": round(old_b[1] - old_b[0], 1),
                          "newDur": round(beat["endSec"] - beat["startSec"], 1)})
    for track in (new.get("musicBed") or {}).get("tracks") or []:
        for key in ("startSec", "endSec"):
            if key in track:
                track[key] = f(track[key])
    for diff in (new.get("pacing") or {}).get("diffs") or []:
        if "startSec" in diff:
            diff["startSec"] = f(diff["startSec"])

    new_total = max(s["endSec"] for s in segs)
    new["totalDurationSec"] = new_total
    new["mode"] = "precise"
    narration = new.setdefault("narration", {})
    narration["totalDurationSec"] = round(audio_sec, 2)
    narration["words"] = [{"word": w["word"], "start": w["start"], "end": w["end"]} for w in words]
    if audio_file:
        narration["audioFile"] = audio_file

    resolve_all_sync_points(segs, words)

    intervals = []
    for (o0, n0), (o1, n1) in zip(pts, pts[1:]):
        intervals.append({"oldFrom": o0, "oldTo": o1, "factor": (n1 - n0) / (o1 - o0)})

    facts = {
        "anchors": found["anchors"], "dropped": dropped,
        "unmatched": found["unmatched"], "shared": found["shared"], "noRef": found["noRef"],
        "candidates": len(found["anchors"]) + len(found["unmatched"]),
        "oldTotal": old_total, "newTotal": new_total, "audioSec": audio_sec,
        "rows": rows, "beats": beat_rows, "factors": factors, "points": pts, "intervals": intervals,
        "wiringUnchanged": wiring(manifest) == wiring(new),
        "seams": {"before": _seam_faults(manifest["segments"]), "after": _seam_faults(segs)},
    }
    return new, facts


def _seam_faults(segments: list[dict]) -> int:
    """Gaps or overlaps of a frame or more between consecutive segments."""
    ordered = sorted(segments, key=lambda s: s["startSec"])
    return sum(1 for a, b in zip(ordered, ordered[1:]) if abs(b["startSec"] - a["endSec"]) >= 1 / FPS - 1e-6)


def retime_audio_plan(plan: dict, pts: list[tuple[float, float]], factors: dict[str, float]) -> dict:
    """The audio-spec companion file: music-bed edges are absolute times, the
    L2/L3 cues are offsets inside a named segment."""
    new = copy.deepcopy(plan)
    for track in (new.get("musicBed") or {}).get("tracks") or []:
        for key in ("startSec", "endSec"):
            if key in track:
                track[key] = _snap(warp(track[key], pts))
    for layer in ("layer2", "layer3"):
        for cue in new.get(layer) or []:
            if "offsetSec" in cue and cue.get("segment") in factors:
                cue["offsetSec"] = round(cue["offsetSec"] * factors[cue["segment"]], 2)
    return new


# ── What the re-time cannot fix by itself ───────────────────────────────────


def slot_checks(slug: str, facts: dict) -> dict:
    """Template data files and clips have lengths of their own. List the
    segments whose new slot no longer fits them."""
    data_dir = REMOTION / "data" / "episodes" / slug
    public_dir = REMOTION / "public" / "episodes" / slug
    short_templates, long_clips = [], []
    for r in facts["rows"]:
        if r["dataFile"]:
            path = data_dir / r["dataFile"]
            if path.exists():
                try:
                    data_dur = json.loads(path.read_text(encoding="utf-8")).get("durationSec")
                except json.JSONDecodeError:
                    data_dur = None
                if isinstance(data_dur, (int, float)) and r["newDur"] < data_dur - 0.3 and r["newDur"] < r["oldDur"]:
                    short_templates.append({**r, "dataDur": data_dur})
        if r["assetFile"] and Path(r["assetFile"]).suffix.lower() in VIDEO_EXTS:
            clip_dur = media_duration(public_dir / r["assetFile"]) if (public_dir / r["assetFile"]).exists() else None
            if clip_dur is not None and r["newDur"] > clip_dur + 0.1 and r["newDur"] > r["oldDur"]:
                long_clips.append({**r, "clipDur": round(clip_dur, 2)})
    return {"shortTemplates": short_templates, "longClips": long_clips}


# ── Report ──────────────────────────────────────────────────────────────────


def _mmss(t: float) -> str:
    return f"{int(t // 60)}:{t % 60:04.1f}"


def format_report(slug: str, facts: dict, checks: dict, source: str) -> str:
    kept = len(facts["anchors"]) - len(facts["dropped"])
    change = (facts["newTotal"] / facts["oldTotal"] - 1) * 100 if facts["oldTotal"] else 0
    lines = [
        f"# Re-time report — {slug}",
        "",
        f"Source: {source}",
        "",
        f"- Runtime: {_mmss(facts['oldTotal'])} → {_mmss(facts['newTotal'])} ({change:+.1f}%); narration audio {_mmss(facts['audioSec'])}",
        f"- Lines found in the recording: {len(facts['anchors'])} of {facts['candidates']} "
        f"({kept} used as anchors; {len(facts['shared'])} more segments share a line with the one before and ride along)",
        f"- Wiring unchanged (everything except times): {'yes' if facts['wiringUnchanged'] else 'NO'}",
        f"- Gaps or overlaps between segments: {facts['seams']['before']} before, {facts['seams']['after']} after",
    ]
    if facts["unmatched"]:
        lines += ["", "## Lines not found (placed between their neighbours)", ""]
        lines += [f"- `{i}`" for i in facts["unmatched"]]
    if facts["dropped"]:
        lines += ["", "## Hits ignored (out of order or on top of the previous one)", ""]
        lines += [f"- `{a['id']}` at {_mmss(a['new'])}" for a in facts["dropped"]]
    suspect = [iv for iv in facts["intervals"] if not STRETCH_SUSPECT[0] <= iv["factor"] <= STRETCH_SUSPECT[1]]
    if suspect:
        lines += ["", "## Stretches that look wrong (check the hit on either side)", ""]
        lines += [f"- old {_mmss(iv['oldFrom'])}–{_mmss(iv['oldTo'])}: ×{iv['factor']:.2f}" for iv in suspect]

    lines += ["", "## By beat", "", "| Beat | Was | Now | Change |", "|---|---|---|---|"]
    for b in facts["beats"]:
        pct = (b["newDur"] / b["oldDur"] - 1) * 100 if b["oldDur"] else 0
        lines.append(f"| {b['id']} {b['title']} | {b['oldDur']}s | {b['newDur']}s | {pct:+.0f}% |")

    moved = [r for r in facts["rows"] if not STRETCH_NOTE[0] <= r["factor"] <= STRETCH_NOTE[1]]
    if moved:
        lines += ["", "## Segments whose length changed by more than a quarter", "",
                  "| Segment | What | Was | Now |", "|---|---|---|---|"]
        for r in moved:
            lines.append(f"| `{r['id']}` | {r['component'] or r['type']} | {r['oldDur']}s | {r['newDur']}s |")
    short = [r for r in facts["rows"] if r["newDur"] < SHORT_SEGMENT_SEC]
    if short:
        lines += ["", f"## Segments now shorter than {SHORT_SEGMENT_SEC}s", ""]
        lines += [f"- `{r['id']}` ({r['component'] or r['type']}): {r['newDur']}s" for r in short]
    if checks["shortTemplates"]:
        lines += ["", "## Template slots now shorter than their data file's animation", "",
                  "The data file's `durationSec` is longer than the slot. Templates that size themselves to the slot "
                  "are unaffected; ones that animate to `durationSec`, or to reveal times typed in seconds, may be "
                  "cut off. Check these against the recording and shorten the data file where needed.", "",
                  "| Segment | Data file | Animation | Slot was | Slot now |", "|---|---|---|---|---|"]
        for r in checks["shortTemplates"]:
            lines.append(f"| `{r['id']}` | {r['dataFile']} | {r['dataDur']}s | {r['oldDur']}s | {r['newDur']}s |")
    if checks["longClips"]:
        lines += ["", "## Clip slots now longer than the clip", "",
                  "| Segment | Clip | Clip length | Slot was | Slot now |", "|---|---|---|---|---|"]
        for r in checks["longClips"]:
            lines.append(f"| `{r['id']}` | {r['assetFile']} | {r['clipDur']}s | {r['oldDur']}s | {r['newDur']}s |")
    lines += ["", "Reveal timings inside a graphic (stagger, per-row reveals) are not moved by a re-time. "
              "Where a graphic's rows are meant to land on particular words, check it against the recording.", ""]
    return "\n".join(lines)


# ── CLI ─────────────────────────────────────────────────────────────────────


def _dump(path: Path, data: dict, like: str | None = None) -> None:
    """Write JSON the way the file it replaces was written."""
    escaped = like is not None and "\\u00" in like
    text = json.dumps(data, indent=2, ensure_ascii=escaped)
    if like is None or like.endswith("\n"):
        text += "\n"
    path.write_text(text, encoding="utf-8")


def main() -> int:
    ap = argparse.ArgumentParser(description="Re-time an existing assembly manifest to recorded narration, keeping its wiring.")
    ap.add_argument("slug")
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--audio", type=Path, help="narration recording (transcribed with faster-whisper)")
    src.add_argument("--words", type=Path, help="word-timestamp JSON from any transcriber")
    ap.add_argument("--manifest", type=Path, help="default: remotion-templates/data/episodes/<slug>/assembly-manifest.json")
    ap.add_argument("--duration", type=float, help="length of the recording in seconds (with --words; default: end of the last word)")
    ap.add_argument("--model", default="medium", help="faster-whisper model size (with --audio)")
    ap.add_argument("--lang", default="en")
    ap.add_argument("--write", action="store_true", help="replace the live manifest and audio plan (the old copies are kept)")
    ap.add_argument("--force", action="store_true", help="write even if fewer than half the lines were found")
    args = ap.parse_args()

    manifest_path = args.manifest or REMOTION / "data" / "episodes" / args.slug / "assembly-manifest.json"
    if not manifest_path.exists():
        sys.exit(f"No manifest at {manifest_path}")
    raw = manifest_path.read_text(encoding="utf-8")
    manifest = json.loads(raw)

    if args.audio:
        try:
            words = transcribe(args.audio, args.model, args.lang)
        except ImportError as e:
            sys.exit(f"{e}\nOr transcribe elsewhere and pass the word timestamps with --words.")
        audio_sec = media_duration(args.audio)
        source = f"`{args.audio}` (faster-whisper {args.model})"
        audio_file = args.audio.name
    else:
        words = normalise_words(json.loads(args.words.read_text(encoding="utf-8")))
        audio_sec = args.duration
        source = f"word timestamps from `{args.words}`"
        audio_file = None

    new, facts = retime(manifest, words, audio_sec=audio_sec, audio_file=audio_file)
    checks = slot_checks(args.slug, facts)
    report = format_report(args.slug, facts, checks, source)

    out_dir = REMOTION / "out" / "retime" / args.slug
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "report.md").write_text(report, encoding="utf-8")
    _dump(out_dir / "assembly-manifest.retimed.json", new, like=raw)

    plan_path = REPO_ROOT / "episodes" / args.slug / "audio" / "manifest-audio.json"
    plan_raw = plan_path.read_text(encoding="utf-8") if plan_path.exists() else None
    new_plan = retime_audio_plan(json.loads(plan_raw), facts["points"], facts["factors"]) if plan_raw else None

    print(report)
    print(f"Report and re-timed manifest: {out_dir.relative_to(REPO_ROOT)}/")

    if not args.write:
        print("Nothing in the repo was changed. Re-run with --write to replace the live manifest.")
        return 0
    if not facts["wiringUnchanged"]:
        sys.exit("Refusing to write: the re-time changed something other than times.")
    if facts["candidates"] and len(facts["anchors"]) < facts["candidates"] / 2 and not args.force:
        sys.exit("Refusing to write: fewer than half the lines were found — is this the right recording? (--force to write anyway)")

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    (out_dir / f"assembly-manifest.before-{stamp}.json").write_text(raw, encoding="utf-8")
    _dump(manifest_path, new, like=raw)
    print(f"Wrote {manifest_path.relative_to(REPO_ROOT)} (previous copy: {out_dir.relative_to(REPO_ROOT)}/assembly-manifest.before-{stamp}.json)")
    if new_plan is not None:
        (out_dir / f"manifest-audio.before-{stamp}.json").write_text(plan_raw, encoding="utf-8")
        _dump(plan_path, new_plan, like=plan_raw)
        print(f"Wrote {plan_path.relative_to(REPO_ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
