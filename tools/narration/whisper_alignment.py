#!/usr/bin/env python3
"""
whisper_alignment.py — diff a recorded narration against the script to
generate a pickup-take shopping list.

Given the production script (what was supposed to be read) and a Whisper
word-level transcript of the recording (what was actually read), this
tool aligns the two streams, flags discrepancies — skipped words,
substitutions, ad-libs, low-confidence spans likely to be mispronunciations
— and writes `narration-diff.md`: a beat-by-beat report with timestamps
and a re-record candidate list.

This is the single biggest time-saver in the narration workflow. The
difference between "listen back to 15 minutes of audio at 1x speed to
find your mistakes" and "here are the 7 specific lines to re-record at
0:43, 2:17, 5:52, ..." is the difference between a 30-minute pickup
session and a 3-hour one.

Transcript input: a JSON file in the standard Whisper schema (`segments`
with `words` containing `start`, `end`, `word`, `probability`). The
operator generates this however they prefer:
  · openai-whisper:    `whisper narration.wav --model medium --output_format json`
  · faster-whisper:    `from faster_whisper import WhisperModel; ...`
  · whisper.cpp:       `whisper-cli narration.wav -oj -ml 1`
  · OpenAI API:        `client.audio.transcriptions.create(... response_format="verbose_json")`

If `faster_whisper` is installed, this tool can run the transcription
itself — pass --wav instead of --transcript. Otherwise the transcript
arg is required.

Usage:
    python3 tools/narration/whisper_alignment.py <slug>
        # auto-discover script + transcript (episodes/<slug>/assets/narration.json)
    python3 tools/narration/whisper_alignment.py <slug> --transcript <path.json>
    python3 tools/narration/whisper_alignment.py <slug> --wav <path.wav>
        # transcribe via faster-whisper if available
    python3 tools/narration/whisper_alignment.py <slug> --wav <wav> --model large-v3
    python3 tools/narration/whisper_alignment.py <slug> --stdout
    python3 tools/narration/whisper_alignment.py <slug> --low-conf 0.7
        # surface words below this probability as likely mispronunciations
"""

from __future__ import annotations

import argparse
import difflib
import hashlib
import json
import os
import re
import sys
from dataclasses import dataclass, asdict, field
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

# Re-use the existing script parser instead of duplicating two-column parsing.
sys.path.insert(0, str(Path(__file__).resolve().parent))
import format_for_reading as ffr  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"

# ── Tunables ─────────────────────────────────────────────────────────────────

# Words below this probability are flagged as likely mispronunciations
# (Whisper struggling to recognize them often means the narrator slurred
# or mis-stressed). Tune via CLI --low-conf.
DEFAULT_LOW_CONFIDENCE_THRESHOLD = 0.5

# Substitutions/deletions of fewer than this many words are "minor" —
# almost always typographic differences ("the" vs "this", dropped
# articles) that aren't worth a pickup take. Above this is "major" and
# becomes a pickup candidate.
MAJOR_EDIT_THRESHOLD = 2

# Cap pickup candidates to avoid overwhelming the operator on first-take
# disasters. Past this, surface a "+N more — full list in the report below."
MAX_PICKUP_CANDIDATES = 15


# ── Data models ──────────────────────────────────────────────────────────────


@dataclass
class TranscriptWord:
    """One word from the Whisper transcript with timing and confidence."""

    word: str           # whitespace stripped, original case preserved
    start_sec: float
    end_sec: float
    probability: float  # 0-1; -1 if the transcript JSON didn't include one


@dataclass
class Transcript:
    """The full Whisper transcript flattened to a word list."""

    words: list[TranscriptWord]

    @property
    def full_text(self) -> str:
        return " ".join(w.word.strip() for w in self.words)

    @property
    def duration_sec(self) -> float:
        return self.words[-1].end_sec if self.words else 0.0


@dataclass
class ScriptWord:
    """One word from the production script, tagged with its beat for
    pickup-list grouping."""

    word: str
    beat_number: int
    take_index: int  # which take within the beat (for narrowing pickup region)


@dataclass
class AlignmentIssue:
    """One discrepancy between script and transcript."""

    kind: str           # "missed" | "substituted" | "inserted" | "low_confidence"
    severity: str       # "minor" | "major"
    script_text: str    # what was supposed to be said (empty for "inserted")
    spoken_text: str    # what was actually said (empty for "missed")
    audio_start_sec: float
    audio_end_sec: float
    beat_number: int    # 0 if no beat could be determined (e.g. trailing ad-lib)


@dataclass
class AlignmentReport:
    """Top-level output of the alignment pipeline."""

    issues: list[AlignmentIssue]
    script_word_count: int
    transcript_word_count: int
    transcript_duration_sec: float
    estimated_script_duration_sec: float
    wpm: int = ffr.DEFAULT_WPM    # the wpm used to compute estimated_script_duration_sec
    beats: list[ffr.Beat] = field(default_factory=list)
    transcript_has_probabilities: bool = True  # see find_low_confidence_spans

    @property
    def major_issues(self) -> list[AlignmentIssue]:
        return [i for i in self.issues if i.severity == "major"]

    @property
    def minor_issues(self) -> list[AlignmentIssue]:
        return [i for i in self.issues if i.severity == "minor"]

    @property
    def pickup_candidates(self) -> list[AlignmentIssue]:
        """Issues that warrant a re-record take — missed/substituted material,
        not minor word-choice noise and not transcription-confidence issues."""
        return [
            i for i in self.issues
            if i.severity == "major" and i.kind in ("missed", "substituted")
        ]


# ── Transcript loading ───────────────────────────────────────────────────────


def load_transcript_from_json(path: Path) -> Transcript:
    """Parse a Whisper-format JSON transcript into a flat Transcript.

    Handles both the openai-whisper schema (top-level `segments`, each
    with `words`) and the faster-whisper Python-API schema (when
    serialized similarly). If word-level timestamps are absent, falls
    back to segment-level timing (start = segment.start, end = next
    segment.start) so the operator still gets a per-line report — just
    without sub-line timestamps.
    """
    data = json.loads(path.read_text(encoding="utf-8"))
    words: list[TranscriptWord] = []
    segments = data.get("segments", [])
    for seg in segments:
        seg_words = seg.get("words")
        if seg_words:
            for w in seg_words:
                words.append(TranscriptWord(
                    word=str(w.get("word", "")).strip(),
                    start_sec=float(w.get("start", seg.get("start", 0.0))),
                    end_sec=float(w.get("end", seg.get("end", 0.0))),
                    probability=float(w.get("probability", -1.0)),
                ))
        else:
            # No word-level timing — fall back to splitting the segment
            # text and distributing timestamps uniformly across the span.
            text = seg.get("text", "").strip()
            tokens = text.split()
            if not tokens:
                continue
            start = float(seg.get("start", 0.0))
            end = float(seg.get("end", start))
            span = max(end - start, 0.01)
            per = span / len(tokens)
            for i, tok in enumerate(tokens):
                words.append(TranscriptWord(
                    word=tok,
                    start_sec=start + i * per,
                    end_sec=start + (i + 1) * per,
                    probability=-1.0,
                ))
    return Transcript(words=words)


# ── Transcript cache ─────────────────────────────────────────────────────────
# Whisper transcription on a 15-min medium-model file takes 2-5 minutes per
# run. Operators iterating (re-record a pickup → re-run alignment → repeat)
# would otherwise pay that cost every time even though the WAV hasn't
# changed. We cache transcripts by (canonical wav path + size + mtime +
# transcribe params), so a re-run hits the cache and returns in ~200ms.

CACHE_VERSION = "v1"   # bump to invalidate every cached transcript at once

# Honour XDG_CACHE_HOME on Linux; default to ~/.cache on Mac too (works fine
# even though macOS convention is ~/Library/Caches — keeping it simple).
def _cache_root() -> Path:
    base = os.environ.get("XDG_CACHE_HOME")
    if base:
        return Path(base) / "parallax" / "whisper"
    return Path.home() / ".cache" / "parallax" / "whisper"


def _cache_key(
    wav_path: Path, model_size: str, language: Optional[str], compute_type: str,
) -> str:
    """Stable hash over the inputs that determine the transcript output.

    Uses file (size + mtime_ns) as the content proxy rather than hashing
    bytes — operators re-export from a DAW which always updates mtime,
    so the trade-off is fine in practice and saves the few seconds it'd
    take to SHA-256 a 250MB WAV.

    Deliberately does NOT include the file path: copying or renaming the
    same WAV (parallel git worktree, renamed `narration-v2.wav`, moved
    project root) should still hit the cache when the bytes haven't
    changed. Path is cosmetic; only content + params determine the
    transcript.
    """
    st = wav_path.stat()
    blob = (
        f"{CACHE_VERSION}|{st.st_size}|{st.st_mtime_ns}"
        f"|{model_size}|{language or ''}|{compute_type}"
    )
    return hashlib.sha256(blob.encode()).hexdigest()


def _cache_load(key: str) -> Optional[Transcript]:
    """Hit → return Transcript. Miss / corrupted file → return None."""
    path = _cache_root() / f"{key}.json"
    if not path.is_file():
        return None
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    try:
        words = [
            TranscriptWord(
                word=w["word"], start_sec=w["start_sec"],
                end_sec=w["end_sec"], probability=w["probability"],
            )
            for w in data.get("words", [])
        ]
    except (KeyError, TypeError):
        return None
    return Transcript(words=words)


def _cache_store(key: str, transcript: Transcript) -> None:
    """Best-effort write. Cache failures don't propagate — caller already
    has the transcript, the cache is just an optimization.

    Writes atomically via a per-pid `.tmp.<pid>` sidecar + os.replace().
    Without this, two concurrent runs writing to the same key could race:
    one truncates while the other reads, and if the truncation lands at
    a JSON brace boundary the partial file parses successfully into
    garbage and gets returned as a fake transcript on the next call.
    """
    final = _cache_root() / f"{key}.json"
    tmp = final.with_name(f"{key}.json.tmp.{os.getpid()}")
    try:
        final.parent.mkdir(parents=True, exist_ok=True)
        tmp.write_text(
            json.dumps({"words": [asdict(w) for w in transcript.words]}),
            encoding="utf-8",
        )
        os.replace(tmp, final)  # atomic on POSIX + Windows
    except OSError:
        # Disk full / permissions / etc. don't break the run. Clean up
        # the tmp file if it was created.
        try:
            if tmp.exists():
                tmp.unlink()
        except OSError:
            pass


def transcribe_wav(
    wav_path: Path, model_size: str = "medium",
    compute_type: str = "int8", language: Optional[str] = "en",
    use_cache: bool = True,
) -> Transcript:
    """Run faster-whisper to produce a Transcript. Raises ImportError if
    faster-whisper isn't installed.

    `compute_type` defaults to `int8` (CPU-friendly, slower but works
    anywhere). On a CUDA box pass `float16` or `int8_float16`; on Apple
    Silicon `int8` is the right choice.

    `language` defaults to `en` since Parallax is English-only. Pass
    `None` to let Whisper auto-detect (slower, occasionally wrong on
    short inputs).

    `use_cache` (default True): hit-or-miss disk cache keyed on the WAV's
    (size + mtime) + params. Re-runs against an unchanged file return in
    ~200ms instead of re-transcribing for minutes. Cache is path-
    independent, so renames / copies / cross-worktree hits work.
    """
    # Initialize `key` up-front so the store path below can't NameError
    # if a future refactor accidentally moves the store outside the
    # `if use_cache:` gate. Cheaper than the time it'd take to debug
    # the resulting "name not defined" stack trace 6 months from now.
    key: Optional[str] = None
    if use_cache:
        key = _cache_key(wav_path, model_size, language, compute_type)
        cached = _cache_load(key)
        if cached is not None:
            return cached

    try:
        from faster_whisper import WhisperModel  # type: ignore[import-not-found]
    except ImportError as e:
        raise ImportError(
            "faster-whisper not installed. Either:\n"
            "  1. Install it:    pip install faster-whisper\n"
            "  2. Or transcribe externally and pass --transcript <path>.json\n"
            "     e.g. `whisper narration.wav --model medium --output_format json`"
        ) from e

    model = WhisperModel(model_size, compute_type=compute_type)
    segments, _info = model.transcribe(
        str(wav_path), word_timestamps=True, language=language,
    )
    words: list[TranscriptWord] = []
    for seg in segments:
        for w in seg.words or []:
            words.append(TranscriptWord(
                word=str(w.word).strip(),
                start_sec=float(w.start),
                end_sec=float(w.end),
                probability=float(getattr(w, "probability", -1.0)),
            ))
    transcript = Transcript(words=words)
    if use_cache and key is not None:
        _cache_store(key, transcript)
    return transcript


# ── Script word extraction ───────────────────────────────────────────────────


def script_to_words(beats: list[ffr.Beat]) -> list[ScriptWord]:
    """Flatten beats → narration takes → tagged words."""
    out: list[ScriptWord] = []
    for beat in beats:
        take_index = 0
        for take in beat.takes:
            if take.kind != "narration":
                continue
            for token in _word_tokens(take.text):
                out.append(ScriptWord(
                    word=token, beat_number=beat.number, take_index=take_index,
                ))
            take_index += 1
    return out


# ── Normalization ────────────────────────────────────────────────────────────
# Comparing raw words is too noisy ("don't" vs "dont", "U.S." vs "us",
# trailing commas). Normalize aggressively for the diff; preserve the
# original word for display.

_PUNCT_STRIP_RE = re.compile(r"^[\W_]+|[\W_]+$")
_INTERIOR_PUNCT_RE = re.compile(r"[^\w'’]")


def normalise_word(word: str) -> str:
    """Lowercase, strip surrounding punctuation, drop interior non-word
    chars except apostrophes (so don't/dont compare equal, but punctuation
    differences don't trip the diff). Curly apostrophes are flattened to
    straight ones so don't/don’t compare equal too — different sources
    use different unicode."""
    if not word:
        return ""
    # Flatten curly quotes/apostrophes to straight ASCII before any other
    # processing so the same-word-different-unicode case doesn't fork.
    w = word.replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    w = _PUNCT_STRIP_RE.sub("", w).lower()
    w = _INTERIOR_PUNCT_RE.sub("", w)
    return w


def _word_tokens(text: str) -> list[str]:
    """Split text into word tokens, preserving original case for display."""
    return [t for t in re.split(r"\s+", text.strip()) if t]


# ── Alignment ────────────────────────────────────────────────────────────────


def _classify_edit(
    script_chunk: list[ScriptWord], transcript_chunk: list[TranscriptWord],
    opcode: str,
) -> str:
    """Convert a difflib opcode + chunk sizes to {minor|major}."""
    # Insertions / deletions / replacements above the threshold are major.
    # Single-word noise is minor.
    if opcode == "replace":
        if len(script_chunk) <= 1 and len(transcript_chunk) <= 1:
            return "minor"
        return "major"
    # delete = missed; insert = ad-lib
    length = max(len(script_chunk), len(transcript_chunk))
    return "major" if length >= MAJOR_EDIT_THRESHOLD else "minor"


def _build_beat_lookup(script_words: list[ScriptWord]) -> dict[int, int]:
    """Map script-word-index → beat_number."""
    return {i: w.beat_number for i, w in enumerate(script_words)}


def align(script_words: list[ScriptWord], transcript: Transcript) -> list[AlignmentIssue]:
    """Align script word-stream against transcript word-stream via difflib.

    Returns issues ordered by audio time. Pure function: no I/O, fully
    deterministic given inputs. Test by constructing both inputs and
    asserting against the resulting issues.
    """
    script_norm = [normalise_word(w.word) for w in script_words]
    transcript_norm = [normalise_word(w.word) for w in transcript.words]

    matcher = difflib.SequenceMatcher(a=script_norm, b=transcript_norm, autojunk=False)
    issues: list[AlignmentIssue] = []
    beat_lookup = _build_beat_lookup(script_words)

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            continue
        script_chunk = script_words[i1:i2]
        transcript_chunk = transcript.words[j1:j2]

        # Determine audio timestamps. Prefer transcript_chunk's own range;
        # if empty (pure deletion), borrow the surrounding transcript word.
        if transcript_chunk:
            audio_start = transcript_chunk[0].start_sec
            audio_end = transcript_chunk[-1].end_sec
        else:
            # The gap sits *between* transcript[j1-1] and transcript[j1].
            # Use j1's start (or the end of j1-1 if j1 is at end).
            if j1 < len(transcript.words):
                audio_start = transcript.words[j1].start_sec
            elif transcript.words:
                audio_start = transcript.words[-1].end_sec
            else:
                audio_start = 0.0
            audio_end = audio_start

        beat = script_chunk[0].beat_number if script_chunk else 0
        if not script_chunk:
            # Pure insertion — infer beat from previous matched script word.
            prev_script_idx = i1 - 1
            if prev_script_idx >= 0:
                beat = beat_lookup.get(prev_script_idx, 0)

        severity = _classify_edit(script_chunk, transcript_chunk, tag)
        kind = {"replace": "substituted", "delete": "missed", "insert": "inserted"}[tag]

        script_text = " ".join(w.word for w in script_chunk)
        spoken_text = " ".join(w.word for w in transcript_chunk)

        issues.append(AlignmentIssue(
            kind=kind, severity=severity,
            script_text=script_text, spoken_text=spoken_text,
            audio_start_sec=audio_start, audio_end_sec=audio_end,
            beat_number=beat,
        ))

    return issues


def find_low_confidence_spans(
    transcript: Transcript, threshold: float = DEFAULT_LOW_CONFIDENCE_THRESHOLD,
    beat_lookup_at_time: Optional[dict[float, int]] = None,
) -> list[AlignmentIssue]:
    """Surface low-confidence transcribed words as likely mispronunciations.

    Adjacent low-confidence words coalesce into one span so the operator
    sees `"Alch- Alchian"` as one issue rather than two separate ones.
    """
    issues: list[AlignmentIssue] = []
    in_span = False
    span_start: Optional[TranscriptWord] = None
    span_words: list[TranscriptWord] = []

    def _flush() -> None:
        nonlocal in_span, span_start, span_words
        if span_words:
            text = " ".join(w.word for w in span_words)
            issues.append(AlignmentIssue(
                kind="low_confidence", severity="minor",
                script_text="", spoken_text=text,
                audio_start_sec=span_words[0].start_sec,
                audio_end_sec=span_words[-1].end_sec,
                beat_number=0,
            ))
        in_span = False
        span_start = None
        span_words = []

    for w in transcript.words:
        if w.probability < 0:
            continue  # no probability available — skip
        if w.probability < threshold:
            if not in_span:
                in_span = True
                span_start = w
            span_words.append(w)
        else:
            _flush()
    _flush()
    return issues


# ── Rendering ────────────────────────────────────────────────────────────────


def _fmt_ts(seconds: float) -> str:
    """0:12.3 / 1:23.4 / 12:34.5."""
    minutes = int(seconds // 60)
    rem = seconds - minutes * 60
    return f"{minutes}:{rem:04.1f}"


# Beyond this many words, a "missed" chunk is almost certainly an entire
# unrecorded section — not a useful pickup candidate. Surface as a summary
# instead of dumping the whole text into a table cell.
LARGE_DELETION_WORD_THRESHOLD = 50
# Character limit for inline display of script/spoken text in the diff
# table and bullet list. Past this, ellipsize so the report stays readable.
DISPLAY_TRUNCATE_CHARS = 120


def _truncate(text: str, limit: int = DISPLAY_TRUNCATE_CHARS) -> str:
    """Ellipsize text past `limit`. Adds a word count for context when
    the original is meaningfully longer than the truncated display."""
    text = text.strip()
    if len(text) <= limit:
        return text
    word_count = len(text.split())
    head = text[:limit].rsplit(" ", 1)[0]  # truncate at word boundary
    return f"{head}… _({word_count} words)_"


def _delivery_skew_note(report: AlignmentReport) -> str:
    """How does actual delivery compare to the target-WPM estimate?"""
    est = report.estimated_script_duration_sec
    actual = report.transcript_duration_sec
    if est <= 0 or actual <= 0:
        return ""
    delta = actual - est
    direction = "slower" if delta > 0 else "faster"
    pct = abs(delta) / est * 100
    return (
        f"Delivery {direction} than {report.wpm}-wpm estimate by {abs(delta):.0f}s "
        f"({pct:.0f}%). Actual: {_fmt_ts(actual)} · estimated: {_fmt_ts(est)}."
    )


KIND_LABELS = {
    "missed": "MISSED",
    "substituted": "SUBSTITUTED",
    "inserted": "AD-LIBBED",
    "low_confidence": "LOW CONFIDENCE",
}
KIND_ICONS = {
    "missed": "🔴",
    "substituted": "🟡",
    "inserted": "🟢",
    "low_confidence": "🟣",
}


def render_diff_md(report: AlignmentReport, slug: str) -> str:
    """Render narration-diff.md from the alignment report."""
    lines: list[str] = [
        f"# Narration Diff — {slug}",
        "",
        f"> Auto-generated by `tools/narration/whisper_alignment.py`. **Do not edit.**",
        f"> Compares the production script against the Whisper transcript of the recording.",
        "",
        f"**Script:** {report.script_word_count} words · est. "
        f"{_fmt_ts(report.estimated_script_duration_sec)} at {report.wpm} wpm",
        f"**Transcript:** {report.transcript_word_count} words · "
        f"actual {_fmt_ts(report.transcript_duration_sec)}",
        "",
    ]
    skew = _delivery_skew_note(report)
    if skew:
        lines.append(f"_{skew}_")
        lines.append("")
    # Only surface the missing-probabilities warning when there's
    # actually a transcript with words. An empty transcript has no
    # probabilities by definition (nothing was said) — telling the
    # operator "low-confidence detection was skipped" in that case is
    # technically true but misleading; the real issue is "no audio".
    if not report.transcript_has_probabilities and report.transcript_word_count > 0:
        lines.append(
            "_Note: the transcript carries no per-word probabilities — "
            "low-confidence detection (likely mispronunciations) was "
            "skipped. Regenerate with faster-whisper or openai-whisper for "
            "per-word timestamps + probabilities to surface this signal._"
        )
        lines.append("")

    # ── Pickup candidates (the actionable part) ──────────────────────────────
    pickups = report.pickup_candidates
    lines.append("## Pickup-take shopping list")
    lines.append("")
    if not pickups:
        lines.append("🟢 No pickup candidates — every major beat read cleanly.")
        lines.append("")
    else:
        lines.append(
            f"**{len(pickups)} pickup candidate(s)** — re-record these lines, then "
            f"splice in the corrected takes.")
        lines.append("")
        lines.append("| # | At | Beat | Was supposed to say | Actually said |")
        lines.append("|---|---|---|---|---|")
        for i, iss in enumerate(pickups[:MAX_PICKUP_CANDIDATES], start=1):
            beat_str = f"B{iss.beat_number}" if iss.beat_number else "—"
            script_disp = _truncate(iss.script_text) if iss.script_text else "_(skipped)_"
            spoken_disp = _truncate(iss.spoken_text) if iss.spoken_text else "_(silence)_"
            lines.append(
                f"| {i} | {_fmt_ts(iss.audio_start_sec)} | {beat_str} | "
                f"{script_disp} | {spoken_disp} |"
            )
        if len(pickups) > MAX_PICKUP_CANDIDATES:
            lines.append(
                f"| … | | | _+{len(pickups) - MAX_PICKUP_CANDIDATES} more — see full diff below_ | |"
            )
        lines.append("")

    # ── Full diff per beat ───────────────────────────────────────────────────
    lines.append("## Full diff per beat")
    lines.append("")
    by_beat: dict[int, list[AlignmentIssue]] = {}
    for iss in report.issues:
        by_beat.setdefault(iss.beat_number, []).append(iss)

    for beat in report.beats:
        beat_issues = by_beat.get(beat.number, [])
        if not beat_issues:
            lines.append(f"### Beat {beat.number} — {beat.title}  🟢 clean")
            lines.append("")
            continue
        major_n = sum(1 for i in beat_issues if i.severity == "major")
        minor_n = sum(1 for i in beat_issues if i.severity == "minor")
        lines.append(f"### Beat {beat.number} — {beat.title}  ({major_n} major / {minor_n} minor)")
        lines.append("")
        for iss in beat_issues:
            icon = KIND_ICONS.get(iss.kind, "·")
            label = KIND_LABELS.get(iss.kind, iss.kind)
            tag = "" if iss.severity == "major" else "  _(minor)_"
            ts = _fmt_ts(iss.audio_start_sec)
            if iss.kind == "missed":
                # For huge unrecorded chunks, surface a summary instead
                # of dumping the entire missed paragraph into a bullet.
                words = len(iss.script_text.split())
                if words > LARGE_DELETION_WORD_THRESHOLD:
                    lines.append(
                        f"- {icon} **{label}** @ {ts} — ⚠️ large unrecorded chunk "
                        f"({words} words). Likely an entire skipped beat."
                    )
                else:
                    lines.append(
                        f"- {icon} **{label}** @ {ts} — _\"{_truncate(iss.script_text)}\"_{tag}"
                    )
            elif iss.kind == "substituted":
                lines.append(
                    f"- {icon} **{label}** @ {ts} — script: _\"{_truncate(iss.script_text)}\"_  →  "
                    f"spoken: _\"{_truncate(iss.spoken_text)}\"_{tag}"
                )
            elif iss.kind == "inserted":
                lines.append(f"- {icon} **{label}** @ {ts} — added: _\"{_truncate(iss.spoken_text)}\"_{tag}")
            elif iss.kind == "low_confidence":
                lines.append(
                    f"- {icon} **{label}** @ {ts} — _\"{_truncate(iss.spoken_text)}\"_ — Whisper "
                    f"struggled here, likely mispronunciation{tag}"
                )
        lines.append("")

    # Trailing (beat-0) issues — ad-libs at end, etc.
    trailing = by_beat.get(0, [])
    if trailing:
        lines.append("### Outside any beat (trailing ad-libs)")
        lines.append("")
        for iss in trailing:
            icon = KIND_ICONS.get(iss.kind, "·")
            ts = _fmt_ts(iss.audio_start_sec)
            lines.append(f"- {icon} @ {ts} — _\"{iss.spoken_text or iss.script_text}\"_")
        lines.append("")

    lines.extend([
        "---",
        "",
        f"_Re-run: `python3 tools/narration/whisper_alignment.py {slug}`_",
        "",
        "_Severity rules: deletions/substitutions/ad-libs ≥ "
        f"{MAJOR_EDIT_THRESHOLD} words = major (pickup candidate). "
        "Single-word noise = minor (almost always typographic)._",
    ])
    return "\n".join(lines) + "\n"


# ── Top-level orchestrator ───────────────────────────────────────────────────


def run_alignment(
    script_path: Path, transcript: Transcript, low_conf_threshold: float,
    wpm: int = ffr.DEFAULT_WPM,
) -> AlignmentReport:
    """Parse the script, extract words, align against transcript, return report.

    `wpm` (default: ffr.DEFAULT_WPM = 150) is the target words-per-minute used
    to compute the script's estimated duration. Operators reading slower than
    that should pass their actual target via --wpm; otherwise delivery-skew
    reporting will be off by the difference.
    """
    beats = ffr.parse_script(script_path)
    script_words = script_to_words(beats)
    issues = align(script_words, transcript)
    issues.extend(find_low_confidence_spans(transcript, threshold=low_conf_threshold))
    # Re-sort by audio time so the report reads chronologically.
    issues.sort(key=lambda i: i.audio_start_sec)

    # Detect whether the transcript carries per-word probabilities. If every
    # word has probability == -1 (placeholder for "no data"), low-confidence
    # detection can't have surfaced anything — flag this in the report so
    # the operator doesn't read "0 low-conf findings" as "no mispronunciations".
    has_probs = any(w.probability >= 0 for w in transcript.words)

    return AlignmentReport(
        issues=issues,
        script_word_count=len(script_words),
        transcript_word_count=len(transcript.words),
        transcript_duration_sec=transcript.duration_sec,
        estimated_script_duration_sec=len(script_words) / wpm * 60 if wpm > 0 else 0.0,
        wpm=wpm,
        beats=beats,
        transcript_has_probabilities=has_probs,
    )


# ── CLI ──────────────────────────────────────────────────────────────────────


def _default_transcript_path(slug: str) -> Path:
    return EPISODES_DIR / slug / "assets" / "narration.json"


def _default_wav_path(slug: str) -> Path:
    return EPISODES_DIR / slug / "assets" / "narration.wav"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument(
        "slug",
        nargs="?",
        help="Episode slug (resolves to episodes/<slug>/script-*.md + assets/narration.json|.wav).",
    )
    parser.add_argument(
        "--script",
        help="Explicit script path (overrides slug resolution).",
    )
    parser.add_argument(
        "--transcript",
        help="Path to Whisper JSON transcript (default: episodes/<slug>/assets/narration.json).",
    )
    parser.add_argument(
        "--wav",
        help="Path to WAV (transcribes via faster-whisper if installed).",
    )
    parser.add_argument(
        "--model",
        default="medium",
        help="faster-whisper model size (default: medium). large-v3 = highest quality, slowest.",
    )
    parser.add_argument(
        "--compute-type", default="int8",
        help="faster-whisper compute_type (default: int8). For CUDA: float16 / int8_float16.",
    )
    parser.add_argument(
        "--language", default="en",
        help="ISO-639-1 language hint passed to Whisper (default: en). "
             "Pass an empty string to let Whisper auto-detect (slower).",
    )
    parser.add_argument(
        "--no-cache", action="store_true",
        help="Skip the transcript cache (always re-transcribe). Default: "
             "cache by (WAV size + mtime + model + lang + compute_type) at "
             "~/.cache/parallax/whisper/ so re-runs against unchanged files "
             "are ~200ms instead of minutes.",
    )
    parser.add_argument(
        "--low-conf", type=float, default=DEFAULT_LOW_CONFIDENCE_THRESHOLD,
        help=f"Probability threshold for low-confidence flagging "
             f"(default: {DEFAULT_LOW_CONFIDENCE_THRESHOLD}).",
    )
    parser.add_argument(
        "--wpm", type=int, default=ffr.DEFAULT_WPM,
        help=f"Target words-per-minute for the script duration estimate "
             f"(default: {ffr.DEFAULT_WPM}). Must match the --wpm passed to "
             f"format_for_reading.py for the delivery-skew percentage to be "
             f"meaningful.",
    )
    parser.add_argument("-o", "--output", help="Output path (default: episodes/<slug>/narration-diff.md).")
    parser.add_argument("--stdout", action="store_true", help="Write to stdout.")
    args = parser.parse_args()

    # ── Resolve script ────────────────────────────────────────────────────
    if args.script:
        script_path = Path(args.script).resolve()
        slug = args.slug or script_path.parent.name
    else:
        if not args.slug:
            print("✗ provide either a slug or --script <path>", file=sys.stderr)
            return 2
        slug = args.slug
        found = ffr.find_script(slug)
        if not found:
            print(f"✗ no script found for {slug}", file=sys.stderr)
            return 2
        script_path = found

    if not script_path.is_file():
        print(f"✗ script not found: {script_path}", file=sys.stderr)
        return 2

    # ── Resolve transcript ────────────────────────────────────────────────
    transcript: Optional[Transcript] = None
    if args.transcript:
        tpath = Path(args.transcript).resolve()
        if not tpath.is_file():
            print(f"✗ transcript not found: {tpath}", file=sys.stderr)
            return 2
        transcript = load_transcript_from_json(tpath)
    elif args.wav:
        wpath = Path(args.wav).resolve()
        if not wpath.is_file():
            print(f"✗ WAV not found: {wpath}", file=sys.stderr)
            return 2
        try:
            transcript = transcribe_wav(
                wpath, model_size=args.model,
                compute_type=args.compute_type,
                language=args.language or None,
                use_cache=not args.no_cache,
            )
        except ImportError as e:
            print(f"✗ {e}", file=sys.stderr)
            return 2
    else:
        # Auto-discover: prefer existing transcript JSON, fall back to wav.
        default_t = _default_transcript_path(slug)
        default_w = _default_wav_path(slug)
        if default_t.is_file():
            transcript = load_transcript_from_json(default_t)
        elif default_w.is_file():
            try:
                transcript = transcribe_wav(
                    default_w, model_size=args.model,
                    compute_type=args.compute_type,
                    language=args.language or None,
                    use_cache=not args.no_cache,
                )
            except ImportError as e:
                print(f"✗ {e}\n\nNo {default_t.name} found, and can't transcribe "
                      f"{default_w.name} without faster-whisper.", file=sys.stderr)
                return 2
        else:
            print(
                f"✗ no transcript or WAV found at:\n"
                f"  {default_t}\n  {default_w}\n"
                f"Provide --transcript or --wav explicitly.",
                file=sys.stderr,
            )
            return 2

    assert transcript is not None
    report = run_alignment(
        script_path, transcript,
        low_conf_threshold=args.low_conf, wpm=args.wpm,
    )
    rendered = render_diff_md(report, slug=slug)

    if args.stdout:
        sys.stdout.write(rendered)
        return 0

    out_path = (
        Path(args.output).resolve()
        if args.output
        else EPISODES_DIR / slug / "narration-diff.md"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(rendered, encoding="utf-8")
    rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
    print(f"✓ wrote {rel}")
    print(
        f"  {len(report.pickup_candidates)} pickup candidate(s) · "
        f"{len(report.major_issues)} major · {len(report.minor_issues)} minor"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
