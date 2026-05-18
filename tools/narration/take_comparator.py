#!/usr/bin/env python3
"""
take_comparator.py — rank N takes of the same passage objectively.

When you record Beat 3 three times, the "listen to all three back-to-
back and pick the best" loop is slow and biased toward whichever take
you heard last. This tool measures each take on the dimensions that
actually predict whether a take will edit cleanly — word accuracy,
loudness consistency, pacing stability, silence patterns — and ranks
them with a recommended winner.

What gets measured per take:

  1. word_accuracy   — fraction of script words present in the Whisper
                       transcript (catches misreads + skipped sentences)
  2. loudness_match  — how close the integrated LUFS lands to the
                       Auphonic target (-16 LUFS for YouTube post-master)
  3. pace_stability  — standard deviation of words-per-second across
                       rolling 10s windows. Lower = steadier delivery.
  4. silence_pattern — count of long silences (≥ 2s). Fewer = fewer
                       stumbles, less dead air to edit out.
  5. duration_match  — how close the take's duration is to the script's
                       estimated duration. Very long = overlong pauses;
                       very short = rushed read.

Each metric contributes weighted points to a per-take composite score
(0-100). The highest-scoring take is recommended. Tiebreaks favor the
take with fewest long silences (cleaner edit).

What this DOESN'T measure (use editorial ear for these):
  · Emotional energy / register match
  · Where the take "sits" with adjacent material
  · Mouth-noise / breath quality

Doctrine source: take-selection heuristics published by voice-acting
engineers + the Wendover/Lemmino interviews on editorial discipline.
The metrics are objective proxies — a 92 take is probably better than
an 85 take, but if the operator has a strong editorial reason to pick
the 85, that wins.

Usage:
    python3 tools/narration/take_comparator.py <slug> --beat <N> \\
        --takes take1.wav take2.wav take3.wav

    python3 tools/narration/take_comparator.py <slug> \\
        --takes full-take-a.wav full-take-b.wav --json

Exit codes:
    0 — comparison complete, winner picked
    1 — alignment or audio measurement failed for some take
    2 — usage / missing inputs / ffmpeg not on PATH
"""

from __future__ import annotations

import argparse
import json
import statistics
import subprocess
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))
import audio_qa as aq  # noqa: E402
import format_for_reading as ffr  # noqa: E402
import whisper_alignment as wa  # noqa: E402

ROOT = ffr.ROOT
EPISODES_DIR = ffr.EPISODES_DIR

# ── Tunables ─────────────────────────────────────────────────────────────────

# Target LUFS for the comparator. Auphonic's default YouTube preset
# targets -16; raw narration recorded into an MV7+ typically lands
# -18 to -22 before mastering. We score closeness to the post-master
# target since takes that already land closer master more predictably.
COMPARATOR_TARGET_LUFS = -16.0
# How close to count as "on target" before losing points.
LUFS_TOLERANCE = 3.0   # ±3 LUFS = full score

# Pace window for std-dev. 10s windows are long enough to smooth noise,
# short enough to catch within-take pace drift.
PACE_WINDOW_SEC = 10.0
# Standard deviation in words/sec above which pace is "unsteady".
PACE_HARD_STD = 0.8   # > 0.8 words/sec std → meaningful pacing wobble

# Silence threshold for "long" silences (counted toward silence_pattern).
LONG_SILENCE_SEC = 2.0

# Duration mismatch: takes within ±10% of script estimate get full score;
# linearly drop to zero at ±50%.
DURATION_EASY_PCT = 0.10
DURATION_HARD_PCT = 0.50

# Metric weights (sum = 100).
WEIGHT_WORD_ACCURACY = 40
WEIGHT_LOUDNESS_MATCH = 15
WEIGHT_PACE_STABILITY = 20
WEIGHT_SILENCE_PATTERN = 15
WEIGHT_DURATION_MATCH = 10


# ── Data shapes ──────────────────────────────────────────────────────────────


@dataclass
class TakeMeasurements:
    """Raw measurements for one take — all the inputs to scoring."""
    wav_path: str
    duration_sec: float
    integrated_lufs: float
    transcript_word_count: int
    script_word_count: int
    matched_word_count: int          # script words present in transcript
    pace_std_words_per_sec: float
    long_silence_count: int
    estimated_script_duration_sec: float

    @property
    def word_accuracy(self) -> float:
        if self.script_word_count == 0:
            return 0.0
        return self.matched_word_count / self.script_word_count


@dataclass
class TakeScore:
    """Per-take score breakdown."""
    take_index: int
    wav_path: str
    measurements: TakeMeasurements
    score: float = 0.0
    contributions: dict = field(default_factory=dict)


@dataclass
class ComparisonReport:
    slug: str
    script_path: str
    beat_number: Optional[int]
    takes: list[TakeScore] = field(default_factory=list)

    @property
    def winner(self) -> Optional[TakeScore]:
        if not self.takes:
            return None
        # Highest score; tiebreak on fewest long silences
        return max(
            self.takes,
            key=lambda t: (t.score, -t.measurements.long_silence_count),
        )


# ── Pure scoring functions ──────────────────────────────────────────────────


def _band_score(value: float, easy: float, hard: float, weight: float) -> float:
    """Linear ramp from `easy` (full weight) to `hard` (0 points). Used
    when LOWER values are better (e.g. distance from target, std-dev)."""
    if value <= easy:
        return float(weight)
    if value >= hard:
        return 0.0
    return weight * (1.0 - (value - easy) / (hard - easy))


def score_word_accuracy(m: TakeMeasurements) -> float:
    """0-WEIGHT_WORD_ACCURACY points. Linear in word accuracy, clamped
    to [0, 1] so transcripts that hallucinate or repeat words don't
    blow past the weight ceiling."""
    return min(max(m.word_accuracy, 0.0), 1.0) * WEIGHT_WORD_ACCURACY


def score_loudness_match(m: TakeMeasurements) -> float:
    """Score peaks when LUFS is at target; drops linearly outside tolerance."""
    distance = abs(m.integrated_lufs - COMPARATOR_TARGET_LUFS)
    return _band_score(distance, easy=LUFS_TOLERANCE, hard=LUFS_TOLERANCE * 3,
                       weight=WEIGHT_LOUDNESS_MATCH)


def score_pace_stability(m: TakeMeasurements) -> float:
    """Lower std-dev = steadier pace = full score. Above PACE_HARD_STD = 0."""
    return _band_score(m.pace_std_words_per_sec, easy=0.2, hard=PACE_HARD_STD,
                       weight=WEIGHT_PACE_STABILITY)


def score_silence_pattern(m: TakeMeasurements) -> float:
    """0 long silences = full score; ramps to 0 at 8+."""
    return _band_score(m.long_silence_count, easy=0, hard=8,
                       weight=WEIGHT_SILENCE_PATTERN)


def score_duration_match(m: TakeMeasurements) -> float:
    """Closer to script-estimated duration = better."""
    if m.estimated_script_duration_sec <= 0:
        return WEIGHT_DURATION_MATCH  # unknown — don't penalize
    pct_off = abs(m.duration_sec - m.estimated_script_duration_sec) \
        / m.estimated_script_duration_sec
    return _band_score(pct_off, easy=DURATION_EASY_PCT, hard=DURATION_HARD_PCT,
                       weight=WEIGHT_DURATION_MATCH)


def compute_take_score(m: TakeMeasurements) -> tuple[float, dict]:
    """Combine the 5 metric scores. Returns (total, per-metric breakdown)."""
    contribs = {
        "word_accuracy": round(score_word_accuracy(m), 1),
        "loudness_match": round(score_loudness_match(m), 1),
        "pace_stability": round(score_pace_stability(m), 1),
        "silence_pattern": round(score_silence_pattern(m), 1),
        "duration_match": round(score_duration_match(m), 1),
    }
    return round(sum(contribs.values()), 1), contribs


# ── Measurement helpers ─────────────────────────────────────────────────────


def compute_pace_std(transcript: wa.Transcript, window_sec: float = PACE_WINDOW_SEC) -> float:
    """Compute the std-dev of words-per-second across rolling windows.

    Returns 0 for transcripts too short to produce ≥ 3 windows. With
    only 2 windows the std-dev is statistically meaningless (the value
    is dominated by the difference between two single samples, not by
    a real pace pattern) so we conservatively report 0.
    """
    if not transcript.words:
        return 0.0
    total_dur = transcript.words[-1].end_sec
    if total_dur < window_sec * 3:
        return 0.0
    # Bin words into non-overlapping windows
    bins: list[int] = []
    current_bin_end = window_sec
    count = 0
    for w in transcript.words:
        while w.start_sec >= current_bin_end:
            bins.append(count)
            count = 0
            current_bin_end += window_sec
        count += 1
    bins.append(count)
    # Convert per-window counts to words/sec, compute std-dev
    rates = [c / window_sec for c in bins]
    if len(rates) < 3:
        return 0.0
    return statistics.stdev(rates)


def count_matched_script_words(
    script_words: list[str], transcript_words: list[str],
) -> int:
    """How many script words appear (lower-cased, punctuation-stripped) in
    the transcript? Used as a coarse "did the take cover the script?"
    signal — not a full alignment, just a presence check."""
    transcript_set = {wa.normalise_word(w) for w in transcript_words}
    return sum(
        1 for w in script_words
        if wa.normalise_word(w) and wa.normalise_word(w) in transcript_set
    )


# ── Orchestration ──────────────────────────────────────────────────────────


def measure_take(
    wav_path: Path, script_words: list[str], target_word_count: int,
    target_duration_sec: float,
) -> TakeMeasurements:
    """Run ffmpeg + whisper measurements on one WAV. Pure-ish: shells out
    to ffmpeg/ffprobe (via audio_qa) and faster-whisper (via wa)."""
    probe = aq.probe_audio(wav_path)
    loud = aq.measure_loudness(wav_path)
    silences = aq.detect_silences(
        wav_path, threshold_db=aq.SILENCE_THRESHOLD_DB,
        min_duration_sec=LONG_SILENCE_SEC,
    )
    transcript = wa.transcribe_wav(wav_path)
    transcript_words = [w.word for w in transcript.words]
    matched = count_matched_script_words(script_words, transcript_words)
    pace_std = compute_pace_std(transcript)

    return TakeMeasurements(
        wav_path=str(wav_path),
        duration_sec=probe.duration_sec,
        integrated_lufs=loud.integrated_lufs if loud else 0.0,
        transcript_word_count=len(transcript_words),
        script_word_count=target_word_count,
        matched_word_count=matched,
        pace_std_words_per_sec=round(pace_std, 3),
        long_silence_count=len(silences),
        estimated_script_duration_sec=target_duration_sec,
    )


def compare_takes(
    slug: str, script_path: Path, wav_paths: list[Path],
    beat_number: Optional[int] = None,
    wpm: int = ffr.DEFAULT_WPM,
) -> ComparisonReport:
    """Compare N takes and produce a ranked report."""
    if not wav_paths:
        raise ValueError("at least one take WAV is required")

    beats = ffr.parse_script(script_path)
    if beat_number is not None:
        beat = next((b for b in beats if b.number == beat_number), None)
        if beat is None:
            raise ValueError(f"beat {beat_number} not found in script")
        script_text = " ".join(t.text for t in beat.takes if t.kind == "narration")
    else:
        # Compare against the full script
        script_text = " ".join(
            t.text for b in beats for t in b.takes if t.kind == "narration"
        )

    script_words = script_text.split()
    target_word_count = len(script_words)
    target_duration_sec = target_word_count / wpm * 60

    takes: list[TakeScore] = []
    for i, wav in enumerate(wav_paths, 1):
        try:
            m = measure_take(wav, script_words, target_word_count, target_duration_sec)
            score, contribs = compute_take_score(m)
        except (
            RuntimeError, FileNotFoundError, subprocess.CalledProcessError,
            ImportError, OSError,
        ) as e:
            # One corrupt WAV shouldn't kill the comparison — record a
            # synthetic 0-score "failed" take so the operator sees which
            # one broke and the other takes still get ranked.
            print(
                f"⚠ take {i} ({wav}) failed: {type(e).__name__}: {e}",
                file=sys.stderr,
            )
            m = TakeMeasurements(
                wav_path=str(wav), duration_sec=0.0, integrated_lufs=0.0,
                transcript_word_count=0, script_word_count=target_word_count,
                matched_word_count=0, pace_std_words_per_sec=0.0,
                long_silence_count=0,
                estimated_script_duration_sec=target_duration_sec,
            )
            score, contribs = 0.0, {"failed": True}
        takes.append(TakeScore(
            take_index=i, wav_path=str(wav), measurements=m,
            score=score, contributions=contribs,
        ))

    return ComparisonReport(
        slug=slug, script_path=str(script_path),
        beat_number=beat_number, takes=takes,
    )


# ── Rendering ───────────────────────────────────────────────────────────────


def render_report_md(report: ComparisonReport) -> str:
    winner = report.winner
    lines = [
        f"# Take Comparison — {report.slug}",
        "",
    ]
    if report.beat_number is not None:
        lines.append(f"**Beat:** {report.beat_number}")
    lines.extend([
        f"**Takes compared:** {len(report.takes)}",
        "",
    ])

    if winner is not None:
        lines.extend([
            f"## ✓ Recommended take: **Take {winner.take_index}** "
            f"(score {winner.score:.1f})",
            "",
            f"`{winner.wav_path}`",
            "",
        ])

    lines.extend([
        "## Ranking",
        "",
        "| Rank | Take | Score | Word acc | Loudness | Pace | Silences | Duration | WAV |",
        "|---|---|---|---|---|---|---|---|---|",
    ])
    ranked = sorted(report.takes, key=lambda t: (-t.score, t.measurements.long_silence_count))
    for rank, t in enumerate(ranked, 1):
        m = t.measurements
        wav_name = Path(t.wav_path).name
        lines.append(
            f"| {rank} | {t.take_index} | **{t.score:.1f}** | "
            f"{int(m.word_accuracy * 100)}% | "
            f"{m.integrated_lufs:+.1f} LUFS | "
            f"σ={m.pace_std_words_per_sec:.2f} | "
            f"{m.long_silence_count} | "
            f"{m.duration_sec:.1f}s | "
            f"`{wav_name}` |"
        )
    lines.append("")

    lines.extend([
        "## Per-take score breakdown",
        "",
    ])
    for t in report.takes:
        m = t.measurements
        is_winner = (winner is not None and t.take_index == winner.take_index)
        marker = " ← WINNER" if is_winner else ""
        lines.extend([
            f"### Take {t.take_index} — score {t.score:.1f}{marker}",
            "",
            f"`{t.wav_path}`",
            "",
            f"- **Word accuracy:** {int(m.word_accuracy * 100)}% "
            f"({m.matched_word_count}/{m.script_word_count} script words present)",
            f"- **Integrated LUFS:** {m.integrated_lufs:+.1f} "
            f"(target {COMPARATOR_TARGET_LUFS:+.0f} ±{LUFS_TOLERANCE:.0f})",
            f"- **Pace std-dev:** {m.pace_std_words_per_sec:.2f} words/sec "
            f"across {PACE_WINDOW_SEC:.0f}s windows",
            f"- **Long silences (≥{LONG_SILENCE_SEC:.0f}s):** {m.long_silence_count}",
            f"- **Duration:** {m.duration_sec:.1f}s "
            f"(script estimate {m.estimated_script_duration_sec:.1f}s)",
            "",
            "_Contribution breakdown:_ " + ", ".join(
                f"{k}={v}" for k, v in t.contributions.items()
            ),
            "",
        ])

    lines.extend([
        "---",
        "",
        f"_Run: `python3 tools/narration/take_comparator.py {report.slug} "
        + (f"--beat {report.beat_number} " if report.beat_number is not None else "")
        + "--takes <wavs...>`_",
        "",
    ])
    return "\n".join(lines)


# ── CLI ─────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", help="Episode slug.")
    parser.add_argument("--script", help="Explicit script path.")
    parser.add_argument(
        "--takes", nargs="+", required=True,
        help="Paths to ≥1 take WAV files to compare.",
    )
    parser.add_argument(
        "--beat", type=int, default=None,
        help="Compare against this beat's script text only (default: full script).",
    )
    parser.add_argument(
        "--wpm", type=int, default=ffr.DEFAULT_WPM,
        help=f"Target WPM for duration estimate (default {ffr.DEFAULT_WPM}).",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON.")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout.")
    parser.add_argument("-o", "--output", help="Write to file.")
    args = parser.parse_args()

    if args.script:
        script_path = Path(args.script).resolve()
        if not script_path.is_file():
            print(f"✗ script not found: {script_path}", file=sys.stderr)
            return 2
    else:
        script_path = ffr.find_script(args.slug)
        if script_path is None or not script_path.is_file():
            print(f"✗ no production script for {args.slug}", file=sys.stderr)
            return 2

    wav_paths: list[Path] = []
    for w in args.takes:
        p = Path(w).resolve()
        if not p.is_file():
            print(f"✗ take WAV not found: {p}", file=sys.stderr)
            return 2
        wav_paths.append(p)

    try:
        report = compare_takes(
            args.slug, script_path, wav_paths,
            beat_number=args.beat, wpm=args.wpm,
        )
    except (RuntimeError, ImportError, FileNotFoundError) as e:
        print(f"✗ comparison failed: {type(e).__name__}: {e}", file=sys.stderr)
        return 1
    except ValueError as e:
        print(f"✗ {e}", file=sys.stderr)
        return 2

    if args.json:
        payload = {
            "slug": report.slug, "script_path": report.script_path,
            "beat_number": report.beat_number,
            "winner_take_index": report.winner.take_index if report.winner else None,
            "takes": [
                {
                    "take_index": t.take_index, "wav_path": t.wav_path,
                    "score": t.score, "contributions": t.contributions,
                    "measurements": asdict(t.measurements),
                }
                for t in report.takes
            ],
        }
        out = json.dumps(payload, indent=2)
    else:
        out = render_report_md(report)

    if args.stdout or not args.output:
        sys.stdout.write(out)
    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(out, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        if not args.stdout:
            print(f"✓ wrote {rel}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
