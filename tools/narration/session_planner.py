#!/usr/bin/env python3
"""
session_planner.py — plan a narration recording session before you sit down.

Given the script + your target WPM + an overhead percentage (retakes,
breath rests, take logging), produces:

  · Estimated total session time (recorded duration × overhead multiplier)
  · Per-beat duration estimate (so you know how long Beat 3 will take)
  · Suggested break points at beat boundaries closest to a target
    interval (default 15 min) — voice fatigue is real, and breaks help
  · A warm-up reading order: which beats are easiest (low sayability
    score average) → reads them first while voice settles in
  · Per-beat sayability flag count (from sayability_lint) so you can
    pre-flag "this beat will be slow"

What this avoids:
  · The Wendover "I sat down for 30 minutes and it was actually 90"
    surprise (overhead is structural, not accidental)
  · Recording in beat order when Beat 1's dense opening is exactly the
    wrong place to start cold
  · Skipping breaks until you're hoarse mid-session

Doctrine source: voice-acting session standards (Tony Anselmo / Wayne
June interview prep + the Wendover/CGP Grey workflow notes on
multi-session recording). The numbers are conservative — overestimate
beats underestimate; the operator can always finish early.

Usage:
    python3 tools/narration/session_planner.py <slug>
    python3 tools/narration/session_planner.py <slug> --wpm 160
    python3 tools/narration/session_planner.py <slug> --overhead 1.6
    python3 tools/narration/session_planner.py <slug> --break-every 15
    python3 tools/narration/session_planner.py <slug> --json

Exit codes:
    0 — plan produced
    2 — usage / missing script
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import format_for_reading as ffr  # noqa: E402
import sayability_lint as sl  # noqa: E402

ROOT = ffr.ROOT
EPISODES_DIR = ffr.EPISODES_DIR

# ── Tunables ─────────────────────────────────────────────────────────────────

# Default session overhead multiplier — wall-clock recording time as a
# multiple of pure narration runtime. 1.8 means a 15-min script takes
# ~27 wall-clock minutes including retakes, breath rests, and take
# logging. The solo-pickup-style workflow that this toolchain is built
# for (no co-host, no producer-driven momentum, pickup pass over
# scratch pass) consistently lands in the 1.6-2.0× band. 1.8 is the
# conservative-side default; --overhead 1.3 if doing a scratch pass,
# --overhead 2.0 if doing a final-quality polish pass.
# TODO: re-calibrate after the first prisoners-dilemma final session
# is logged (replace this heuristic with empirical median).
DEFAULT_OVERHEAD = 1.8

# Default break cadence in minutes of wall-clock time. Voice fatigue
# typically becomes audible after ~20 min of continuous narration; a
# 15-min cadence builds in a margin.
DEFAULT_BREAK_EVERY_MIN = 15.0

# Floor on break-segment length so we don't propose a "break after 2 min
# of work" plan. If a beat is shorter than this, fold it into the next
# segment.
MIN_SEGMENT_MIN = 5.0

# How many beats to read as warm-up. The first 1-2 easiest beats get
# read first while voice settles in. Default: read the single easiest
# beat first, then go in script order.
WARMUP_BEATS = 1


# ── Data shapes ──────────────────────────────────────────────────────────────


@dataclass
class BeatPlan:
    beat_number: int
    beat_title: str
    word_count: int
    estimated_runtime_sec: float       # at target wpm
    estimated_session_sec: float       # × overhead
    sayability_flagged_count: int      # sentences above threshold
    sayability_max_score: float        # worst single sentence
    avg_sayability: float              # mean across all sentences


@dataclass
class SegmentPlan:
    """One contiguous run between breaks."""
    segment_number: int
    beats: list[int] = field(default_factory=list)
    session_minutes: float = 0.0


@dataclass
class SessionPlan:
    slug: str
    script_path: str
    wpm: int
    overhead: float
    break_every_min: float
    total_words: int
    total_runtime_sec: float           # pure narration at target wpm
    total_session_sec: float           # × overhead
    beats: list[BeatPlan] = field(default_factory=list)
    segments: list[SegmentPlan] = field(default_factory=list)
    warmup_order: list[int] = field(default_factory=list)


# ── Helpers ─────────────────────────────────────────────────────────────────


def _fmt_min_sec(sec: float) -> str:
    total = int(round(sec))
    return f"{total // 60}:{total % 60:02d}"


def _fmt_minutes(sec: float) -> str:
    return f"{sec / 60:.1f} min"


def _compute_warmup_order(
    beats: list[BeatPlan], warmup_count: int = WARMUP_BEATS,
) -> list[int]:
    """Pick `warmup_count` easiest beats first (lowest avg_sayability),
    then the rest in script order. Avoids putting the script's hardest
    beat first when the voice is coldest."""
    if not beats:
        return []
    by_ease = sorted(beats, key=lambda b: b.avg_sayability)
    warmup_ids = {b.beat_number for b in by_ease[:warmup_count]}
    rest = [b.beat_number for b in beats if b.beat_number not in warmup_ids]
    return [b.beat_number for b in by_ease[:warmup_count]] + rest


def _compute_segments(
    beats: list[BeatPlan], break_every_min: float,
) -> list[SegmentPlan]:
    """Group consecutive beats into segments that target `break_every_min`
    of session time. Segments are closed both:
      · BEFORE appending a beat that would push past 1.25× target
        (normal case — small/medium beats hit the boundary cleanly)
      · AFTER appending a single oversized beat that lands past 1.5×
        target on its own (defends the doctrine against a tiny+huge
        beat sequence that would otherwise share a 25+ min segment)

    An oversized beat that can't fit anywhere is its own segment.
    """
    segments: list[SegmentPlan] = []
    if not beats:
        return segments
    current = SegmentPlan(segment_number=1)
    for b in beats:
        beat_min = b.estimated_session_sec / 60
        projected = current.session_minutes + beat_min
        # Two pre-append boundary triggers:
        #   · HARD-overshoot: projected > 1.5× target. Close current even
        #     if it's still tiny — the incoming beat is huge and needs to
        #     stand alone (the MIN_SEGMENT_MIN gate would otherwise let a
        #     1-min beat + 25-min beat fuse into a 26-min segment).
        #   · SOFT-overshoot: projected > 1.25× target OR current already
        #     past target. Gated by MIN_SEGMENT_MIN so a tiny opening
        #     beat doesn't immediately force a break.
        would_overshoot_hard = projected > break_every_min * 1.5
        would_overshoot_soft = (
            projected > break_every_min * 1.25
            or current.session_minutes >= break_every_min
        )
        if current.beats and (
            would_overshoot_hard
            or (would_overshoot_soft and current.session_minutes >= MIN_SEGMENT_MIN)
        ):
            segments.append(current)
            current = SegmentPlan(segment_number=len(segments) + 1)
        current.beats.append(b.beat_number)
        current.session_minutes = current.session_minutes + beat_min
        # POST-append boundary: a single oversized beat landed us past
        # 1.5× on its own. Close so the NEXT beat doesn't join it.
        if current.session_minutes >= break_every_min * 1.5:
            segments.append(current)
            current = SegmentPlan(segment_number=len(segments) + 1)
    if current.beats:
        segments.append(current)
    return segments


# ── Top-level ───────────────────────────────────────────────────────────────


def plan_session(
    slug: str, script_path: Path,
    wpm: int = ffr.DEFAULT_WPM, overhead: float = DEFAULT_OVERHEAD,
    break_every_min: float = DEFAULT_BREAK_EVERY_MIN,
    sayability_threshold: float = sl.DEFAULT_THRESHOLD,
) -> SessionPlan:
    """Build the full session plan as a pure function (returns the plan)."""
    if wpm <= 0:
        raise ValueError("wpm must be positive")
    if overhead < 1.0:
        raise ValueError("overhead must be ≥ 1.0 (recording time can't be "
                         "less than pure narration time)")
    if break_every_min <= 0:
        raise ValueError("break_every_min must be positive")

    beats = ffr.parse_script(script_path)
    say_report = sl.run_audit(slug, script_path, threshold=sayability_threshold)

    # Group sayability scores by beat for fast lookup
    by_beat: dict[int, list[sl.SentenceScore]] = {}
    for s in say_report.sentences:
        by_beat.setdefault(s.beat_number, []).append(s)

    beat_plans: list[BeatPlan] = []
    total_words = 0
    for b in beats:
        words = b.word_count
        total_words += words
        runtime_sec = words / wpm * 60
        session_sec = runtime_sec * overhead
        scores = by_beat.get(b.number, [])
        flagged = [s for s in scores if s.score >= sayability_threshold]
        avg = sum(s.score for s in scores) / len(scores) if scores else 0.0
        max_score = max((s.score for s in scores), default=0.0)
        beat_plans.append(BeatPlan(
            beat_number=b.number, beat_title=b.title,
            word_count=words,
            estimated_runtime_sec=runtime_sec,
            estimated_session_sec=session_sec,
            sayability_flagged_count=len(flagged),
            sayability_max_score=round(max_score, 1),
            avg_sayability=round(avg, 1),
        ))

    total_runtime = total_words / wpm * 60
    total_session = total_runtime * overhead
    segments = _compute_segments(beat_plans, break_every_min)
    warmup = _compute_warmup_order(beat_plans)

    return SessionPlan(
        slug=slug, script_path=str(script_path), wpm=wpm,
        overhead=overhead, break_every_min=break_every_min,
        total_words=total_words,
        total_runtime_sec=total_runtime, total_session_sec=total_session,
        beats=beat_plans, segments=segments, warmup_order=warmup,
    )


# ── Rendering ───────────────────────────────────────────────────────────────


def render_plan_md(plan: SessionPlan) -> str:
    lines = [
        f"# Narration Session Plan — {plan.slug}",
        "",
        f"_Plan generated at {plan.wpm} wpm with {plan.overhead}× overhead "
        f"(retakes + breath rests + take logging). Break cadence: every "
        f"~{plan.break_every_min:.0f} min of session time._",
        "",
        "## Overview",
        "",
        f"- **Total words:** {plan.total_words:,}",
        f"- **Pure narration runtime:** {_fmt_min_sec(plan.total_runtime_sec)} "
        f"({_fmt_minutes(plan.total_runtime_sec)})",
        f"- **Estimated wall-clock session:** "
        f"**{_fmt_minutes(plan.total_session_sec)}** "
        f"(at {plan.overhead}× overhead)",
        f"- **Number of segments:** {len(plan.segments)} "
        f"({max(0, len(plan.segments) - 1)} break(s) recommended)",
        "",
        "## Per-beat estimate",
        "",
        "| Beat | Title | Words | Narration | Session | Sayability avg | 🚩 flagged |",
        "|---|---|---|---|---|---|---|",
    ]
    for b in plan.beats:
        lines.append(
            f"| {b.beat_number} | _{b.beat_title[:40]}_ | {b.word_count} | "
            f"{_fmt_min_sec(b.estimated_runtime_sec)} | "
            f"{_fmt_min_sec(b.estimated_session_sec)} | "
            f"{b.avg_sayability:.0f} | {b.sayability_flagged_count} |"
        )
    lines.extend(["", "## Suggested segments (break between)", ""])
    for seg in plan.segments:
        beat_str = ", ".join(f"Beat {n}" for n in seg.beats)
        lines.append(
            f"- **Segment {seg.segment_number}** "
            f"({seg.session_minutes:.1f} min): {beat_str}"
        )
    if len(plan.segments) > 1:
        lines.extend([
            "",
            "_Voice fatigue typically becomes audible after ~20 min of "
            "continuous narration. Take a 2-3 min water + stretch break "
            "between segments. Don't push through — re-records always "
            "cost more than a break does._",
        ])
    lines.extend(["", "## Suggested warm-up order", ""])
    warmup_count = WARMUP_BEATS
    warmup_ids = plan.warmup_order[:warmup_count]
    if warmup_ids:
        lines.append(
            f"Read **Beat {warmup_ids[0]}** first as a warm-up — it has the "
            f"lowest average sayability score, so it gives the voice a "
            f"chance to settle in before harder passages.")
    lines.append("")
    lines.append("Recording order:")
    for i, num in enumerate(plan.warmup_order, 1):
        beat = next((b for b in plan.beats if b.beat_number == num), None)
        if beat:
            marker = " ← warm-up" if num in warmup_ids else ""
            lines.append(f"{i}. Beat {num} — _{beat.beat_title[:50]}_{marker}")
    lines.extend([
        "",
        "---",
        "",
        f"_Run: `python3 tools/narration/session_planner.py {plan.slug} "
        f"--wpm {plan.wpm} --overhead {plan.overhead} "
        f"--break-every {plan.break_every_min:.0f}`_",
        "",
    ])
    return "\n".join(lines)


# ── CLI ─────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", help="Episode slug.")
    parser.add_argument("--script", help="Explicit script path override.")
    parser.add_argument(
        "--wpm", type=int, default=ffr.DEFAULT_WPM,
        help=f"Words per minute (default {ffr.DEFAULT_WPM}).",
    )
    parser.add_argument(
        "--overhead", type=float, default=DEFAULT_OVERHEAD,
        help=f"Session-time multiplier over narration runtime "
             f"(default {DEFAULT_OVERHEAD}).",
    )
    parser.add_argument(
        "--break-every", type=float, default=DEFAULT_BREAK_EVERY_MIN,
        help=f"Suggest a break after this many minutes of session time "
             f"(default {DEFAULT_BREAK_EVERY_MIN}).",
    )
    parser.add_argument(
        "--sayability-threshold", type=float, default=sl.DEFAULT_THRESHOLD,
        help="Sayability threshold for the per-beat flag count.",
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

    try:
        plan = plan_session(
            args.slug, script_path,
            wpm=args.wpm, overhead=args.overhead,
            break_every_min=args.break_every,
            sayability_threshold=args.sayability_threshold,
        )
    except ValueError as e:
        print(f"✗ {e}", file=sys.stderr)
        return 2

    if args.json:
        payload = {
            "slug": plan.slug, "script_path": plan.script_path,
            "wpm": plan.wpm, "overhead": plan.overhead,
            "break_every_min": plan.break_every_min,
            "total_words": plan.total_words,
            "total_runtime_sec": plan.total_runtime_sec,
            "total_session_sec": plan.total_session_sec,
            "beats": [asdict(b) for b in plan.beats],
            "segments": [asdict(s) for s in plan.segments],
            "warmup_order": plan.warmup_order,
        }
        out = json.dumps(payload, indent=2)
    else:
        out = render_plan_md(plan)

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
