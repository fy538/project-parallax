#!/usr/bin/env python3
"""
synthetic_scratch.py — make a SYNTHETIC scratch read of an episode, for timing only.

The scratch read is the gate before visual production (PRODUCTION_PIPELINE.md,
Stage 6b): no picture wiring until a read exists. When Tiger cannot record one,
this makes a machine read so the manifest never sits on a words-per-minute
estimate. His own recording replaces it later through the same re-time command.

What it does:
  1. Reads the narration from the episode's read-aloud draft (the text between
     `<!-- narration:start -->` and `<!-- narration:end -->` under each `## ` heading).
  2. Prints the character count and the expected cost, and stops unless --yes
     is given (state the spend before it is made).
  3. Sends one request per beat to ElevenLabs through fal.ai, with timestamps.
  4. Slows or speeds the result to the target pace, joins the beats with pauses,
     and writes three files to episodes/<slug>/assets/scratch-voice/:
         SYNTHETIC-scratch-read.wav          (git-ignored)
         SYNTHETIC-scratch-read.words.json   ([{word, start, end}, ...])
         SYNTHETIC-scratch-read.json         (what was sent, what it cost)

The voice is a timing aid. It is never the narration, never goes into an episode,
and every file it writes is named SYNTHETIC (project/PICTURE_RULES.md, rule 8).

Usage:
    python3 tools/narration/synthetic_scratch.py <slug>              # cost only
    python3 tools/narration/synthetic_scratch.py <slug> --yes        # make it
    python3 tools/narration/synthetic_scratch.py <slug> --text PATH --wpm 150 --yes

Then:
    python3 tools/assembly/retime_manifest.py <slug> \\
        --words episodes/<slug>/assets/scratch-voice/SYNTHETIC-scratch-read.words.json

The key is read from FAL_KEY in the environment or the repo-root .env. Needs ffmpeg.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
import urllib.request
from datetime import date
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(REPO_ROOT / "tools" / "ai-video"))

MODEL = "fal-ai/elevenlabs/tts/turbo-v2.5"
# USD per 1,000 characters. fal's model page, read Oct 12 2026. Check before relying on it.
PRICE_PER_1K_CHARS = 0.05
SAMPLE_RATE = 24000
TEMPO_RANGE = (0.8, 1.25)

BEAT_RE = re.compile(
    r"^## (?P<title>[^\n]+)\n.*?<!-- narration:start -->\n(?P<body>.*?)<!-- narration:end -->",
    re.S | re.M,
)


def extract_beats(text: str) -> list[tuple[str, str]]:
    """(heading, narration) for every `## ` section that carries narration markers."""
    return [(m["title"].strip(), m["body"].strip()) for m in BEAT_RE.finditer(text) if m["body"].strip()]


def estimate_cost(chars: int) -> float:
    return round(chars / 1000 * PRICE_PER_1K_CHARS, 2)


def words_from_characters(chunks: list[dict], offset: float = 0.0, tempo: float = 1.0) -> list[dict]:
    """Turn ElevenLabs character timings into word timings.

    `chunks` is the `timestamps` list of one response; its times run on across
    chunks. `offset` is where this beat starts in the joined file, and `tempo` is
    the speed change applied to the audio afterwards (0.93 = slowed to 93%).
    """
    words: list[dict] = []
    current, start, end = "", 0.0, 0.0
    for chunk in chunks:
        for ch, a, b in zip(
            chunk["characters"],
            chunk["character_start_times_seconds"],
            chunk["character_end_times_seconds"],
            strict=True,
        ):
            if ch.isspace():
                if current:
                    words.append(_word(current, start, end, offset, tempo))
                    current = ""
                continue
            if not current:
                start = a
            current += ch
            end = b
    if current:
        words.append(_word(current, start, end, offset, tempo))
    return words


def _word(text: str, start: float, end: float, offset: float, tempo: float) -> dict:
    return {"word": text, "start": round(offset + start / tempo, 3), "end": round(offset + end / tempo, 3)}


def tempo_for(words: int, speech_sec: float, target_wpm: float) -> float:
    """The speed change that brings a read of `words` in `speech_sec` to `target_wpm`."""
    if words <= 0 or speech_sec <= 0:
        return 1.0
    tempo = target_wpm / (words / speech_sec * 60)
    return round(min(max(tempo, TEMPO_RANGE[0]), TEMPO_RANGE[1]), 3)


def find_text(slug: str) -> Path:
    drafts = sorted((REPO_ROOT / "episodes" / slug / "drafts").glob("spoken-draft-*.md"))
    if not drafts:
        sys.exit(f"No episodes/{slug}/drafts/spoken-draft-*.md. Pass --text PATH.")
    return max(drafts, key=_draft_version)


def _rel(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def _draft_version(path: Path) -> int:
    m = re.search(r"spoken-draft-v(\d+)", path.name)
    return int(m.group(1)) if m else 0


def _duration(path: Path) -> float:
    out = subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)]
    )
    return float(out.strip())


def _speak(body: str, voice: str, speed: float, key: str, dest: Path) -> dict:
    from fal_i2v import QUEUE_BASE, call  # type: ignore[import-not-found]

    payload = {"text": body, "voice": voice, "timestamps": True, "speed": speed}
    job = call(f"{QUEUE_BASE}/{MODEL}", key, payload)
    status = job
    while status.get("status") != "COMPLETED":
        time.sleep(3)
        status = call(job["status_url"], key)
        if status.get("status") in ("FAILED", "ERROR"):
            sys.exit(f"fal job failed: {json.dumps(status)[:400]}")
    result = call(job["response_url"], key)
    urllib.request.urlretrieve(result["audio"]["url"], dest)
    return {"request_id": job["request_id"], "timestamps": result["timestamps"]}


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("slug")
    ap.add_argument("--text", type=Path, help="read-aloud draft (default: newest drafts/spoken-draft-*.md)")
    ap.add_argument("--voice", default="Brian")
    ap.add_argument("--speed", type=float, default=0.9, help="speed sent to the voice model")
    ap.add_argument("--wpm", type=float, default=140, help="pace of the finished read; 0 leaves it as generated")
    ap.add_argument("--gap", type=float, default=2.5, help="seconds of silence between beats")
    ap.add_argument("--yes", action="store_true", help="spend the money; without it only the cost is printed")
    args = ap.parse_args()

    text_path = args.text or find_text(args.slug)
    beats = extract_beats(text_path.read_text())
    if not beats:
        sys.exit(f"No narration markers found in {text_path}.")
    chars = sum(len(body) for _, body in beats)
    word_count = sum(len(body.split()) for _, body in beats)
    cost = estimate_cost(chars)
    print(f"{_rel(text_path)}: {len(beats)} beats, {word_count} words, {chars} characters")
    print(f"Expected cost: about ${cost:.2f} ({MODEL}, ${PRICE_PER_1K_CHARS} per 1,000 characters)")
    if not args.yes:
        print("Nothing was sent. Re-run with --yes to make the read.")
        return

    from fal_i2v import load_key  # type: ignore[import-not-found]

    key = load_key()
    work = REPO_ROOT / "remotion-templates" / "out" / "scratch-read" / args.slug
    work.mkdir(parents=True, exist_ok=True)
    out_dir = REPO_ROOT / "episodes" / args.slug / "assets" / "scratch-voice"
    out_dir.mkdir(parents=True, exist_ok=True)

    spoken = []
    for i, (title, body) in enumerate(beats, 1):
        mp3 = work / f"beat{i}.mp3"
        spoken.append((title, body, mp3, _speak(body, args.voice, args.speed, key, mp3)))
        print(f"  beat {i}/{len(beats)}: {title}")

    speech = sum(_duration(mp3) for _, _, mp3, _ in spoken)
    tempo = tempo_for(word_count, speech, args.wpm) if args.wpm else 1.0
    head, tail = 0.5, 2.0
    cursor, words, meta, inputs, filters = head, [], [], [], []
    for i, (title, body, mp3, spoke) in enumerate(spoken):
        wav = work / f"beat{i + 1}.wav"
        subprocess.check_call(
            ["ffmpeg", "-nostdin", "-v", "error", "-y", "-i", str(mp3),
             "-af", f"atempo={tempo}", "-ar", str(SAMPLE_RATE), "-ac", "1", str(wav)]
        )
        beat_words = words_from_characters(spoke["timestamps"], cursor, tempo)
        if len(beat_words) != len(body.split()):
            print(f"  ! {title}: {len(beat_words)} timed words for {len(body.split())} written", file=sys.stderr)
        words += beat_words
        dur = _duration(wav)
        meta.append({"beat": title, "startSec": round(cursor, 3), "durationSec": round(dur, 3),
                     "words": len(beat_words), "request_id": spoke["request_id"]})
        inputs += ["-i", str(wav)]
        lead = f"adelay={int(head * 1000)}:all=1," if i == 0 else ""
        pad = args.gap if i < len(spoken) - 1 else tail
        filters.append(f"[{i}:a]{lead}apad=pad_dur={pad}[a{i}]")
        cursor += dur + args.gap
    filters.append("".join(f"[a{i}]" for i in range(len(spoken))) + f"concat=n={len(spoken)}:v=0:a=1[out]")

    wav_out = out_dir / "SYNTHETIC-scratch-read.wav"
    subprocess.check_call(
        ["ffmpeg", "-nostdin", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(filters),
         "-map", "[out]", "-ar", str(SAMPLE_RATE), "-ac", "1", str(wav_out)]
    )
    (out_dir / "SYNTHETIC-scratch-read.words.json").write_text(json.dumps(words, indent=0) + "\n")
    (out_dir / "SYNTHETIC-scratch-read.json").write_text(json.dumps({
        "what": "Synthetic scratch read. A timing aid only: not the narration, never in an episode.",
        "source_text": _rel(text_path),
        "model": MODEL, "voice": args.voice, "speed": args.speed, "tempo_after": tempo,
        "target_wpm": args.wpm, "made": date.today().isoformat(),
        "characters": chars, "cost_usd_estimate": cost,
        "cost_note": f"${PRICE_PER_1K_CHARS} per 1,000 characters. No receipt is returned.",
        "durationSec": round(_duration(wav_out), 3), "words": len(words), "beats": meta,
    }, indent=2) + "\n")
    total = _duration(wav_out)
    print(f"Wrote {_rel(wav_out)}: {total:.1f}s, {len(words)} words, "
          f"{len(words) / (speech / tempo) * 60:.0f} wpm. About ${cost:.2f} spent.")
    print(f"Next: python3 tools/assembly/retime_manifest.py {args.slug} "
          f"--words {_rel(out_dir / 'SYNTHETIC-scratch-read.words.json')}")


if __name__ == "__main__":
    main()
