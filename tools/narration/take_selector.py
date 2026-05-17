#!/usr/bin/env python3
"""
take_selector.py — rank multiple narration takes and surface the best
per-beat candidate so the operator knows which take to use where.

Workflow: the operator records 2-3 full reads of an episode (each ~18-20
min). This tool consumes a transcript per take, runs the alignment
pipeline against the script, scores each take per beat, and emits
`take-comparison.md` — an overall ranking + per-beat best-take pick +
a manual-splice cue list when no single take wins every beat.

This is the right tool for the solo-creator workflow: the assumption
is that the operator will do a small number of full reads and then
splice the best beats together in their DAW. There's no EDL output —
EDL formats vary by NLE, and a manual splice with timestamps from this
report is fast for the 2-3-take case.

Scoring (lower = better, per beat):
    pickup_count * 10  +  abs(delivery_skew_pct)  +  low_confidence_count
That weights `MISSED`/`SUBSTITUTED` issues heavily (they're the
expensive ones in post), penalizes drift from the 150-wpm target only
modestly, and treats low-confidence spans as a tiebreaker.

Usage:
    python3 tools/narration/take_selector.py <slug> \
        --takes take-1.wav take-2.wav take-3.wav
    python3 tools/narration/take_selector.py <slug> \
        --transcripts t1.json t2.json t3.json
    python3 tools/narration/take_selector.py <slug> \
        --takes a.wav b.wav --names "Calm read" "Energetic read"
    python3 tools/narration/take_selector.py <slug> --stdout
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
import format_for_reading as ffr  # noqa: E402
import whisper_alignment as wa  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"

# ── Scoring tunables ─────────────────────────────────────────────────────────

# Each pickup candidate (MAJOR missed/substituted) costs this much in the
# scoring function. Tuned so 1 pickup ≈ 10% delivery skew ≈ 10 low-conf
# spans. In practice pickups dominate — a 5-pickup take is worse than a
# 50%-skewed clean take.
PICKUP_WEIGHT = 10.0
DELIVERY_SKEW_WEIGHT = 1.0
LOW_CONFIDENCE_WEIGHT = 1.0


# ── Data models ──────────────────────────────────────────────────────────────


@dataclass
class TakeMetrics:
    """One take's scorecard relative to the script."""

    name: str                              # display name (file stem or --names)
    source_path: Path                      # WAV or JSON used
    report: wa.AlignmentReport             # the alignment report
    score_overall: float = 0.0             # lower = better
    score_per_beat: dict[int, float] = field(default_factory=dict)
    pickups_per_beat: dict[int, int] = field(default_factory=dict)

    @property
    def pickup_count(self) -> int:
        return len(self.report.pickup_candidates)

    @property
    def low_confidence_count(self) -> int:
        return sum(1 for i in self.report.issues if i.kind == "low_confidence")

    @property
    def delivery_skew_pct(self) -> float:
        """Percentage drift from the 150-wpm script estimate. Positive = slower."""
        est = self.report.estimated_script_duration_sec
        act = self.report.transcript_duration_sec
        if est <= 0:
            return 0.0
        return (act - est) / est * 100


# ── Scoring ──────────────────────────────────────────────────────────────────


def score_take(report: wa.AlignmentReport) -> float:
    """Composite score for one take. Lower is better — see module docstring."""
    pickup_count = len(report.pickup_candidates)
    low_conf = sum(1 for i in report.issues if i.kind == "low_confidence")
    skew = report.transcript_duration_sec
    est = report.estimated_script_duration_sec
    skew_pct = abs((skew - est) / est * 100) if est > 0 else 0.0
    return (
        pickup_count * PICKUP_WEIGHT
        + skew_pct * DELIVERY_SKEW_WEIGHT
        + low_conf * LOW_CONFIDENCE_WEIGHT
    )


def score_per_beat(
    report: wa.AlignmentReport,
) -> tuple[dict[int, float], dict[int, int]]:
    """Score each beat in isolation. Returns (scores_by_beat, pickup_counts_by_beat).

    Per-beat scoring uses ONLY pickup count + low-confidence count (no
    delivery-skew component) because beat-level timing isn't observable
    without segment-resolution transcript alignment that we don't compute.
    Skew is a take-wide metric.
    """
    scores: dict[int, float] = {}
    pickups: dict[int, int] = {}
    for beat in report.beats:
        beat_issues = [i for i in report.issues if i.beat_number == beat.number]
        beat_pickups = [
            i for i in beat_issues
            if i.severity == "major" and i.kind in ("missed", "substituted")
        ]
        beat_lowconf = [i for i in beat_issues if i.kind == "low_confidence"]
        scores[beat.number] = (
            len(beat_pickups) * PICKUP_WEIGHT
            + len(beat_lowconf) * LOW_CONFIDENCE_WEIGHT
        )
        pickups[beat.number] = len(beat_pickups)
    return scores, pickups


# ── Per-take build ───────────────────────────────────────────────────────────


def build_take_metrics(
    name: str, transcript_source: Path, script_path: Path,
    transcript: wa.Transcript, low_conf_threshold: float = 0.5,
) -> TakeMetrics:
    """Run the alignment pipeline for one take + score it."""
    report = wa.run_alignment(script_path, transcript, low_conf_threshold=low_conf_threshold)
    metrics = TakeMetrics(name=name, source_path=transcript_source, report=report)
    metrics.score_overall = score_take(report)
    metrics.score_per_beat, metrics.pickups_per_beat = score_per_beat(report)
    return metrics


# ── Take ranking / best-per-beat ─────────────────────────────────────────────


def rank_takes(takes: list[TakeMetrics]) -> list[TakeMetrics]:
    """Return takes sorted ascending by overall score (best first)."""
    return sorted(takes, key=lambda t: t.score_overall)


def pick_best_per_beat(
    takes: list[TakeMetrics], beats: list[ffr.Beat],
) -> dict[int, TakeMetrics]:
    """For each beat, return the take with the lowest per-beat score.
    Ties broken by overall score (then by take order — stable)."""
    out: dict[int, TakeMetrics] = {}
    for beat in beats:
        out[beat.number] = min(
            takes,
            key=lambda t: (t.score_per_beat.get(beat.number, 0.0), t.score_overall),
        )
    return out


def has_single_winning_take(
    takes: list[TakeMetrics], best_per_beat: dict[int, TakeMetrics],
) -> Optional[TakeMetrics]:
    """If one take wins every beat, return it. Else None — operator needs to splice."""
    if not best_per_beat:
        return None
    winners = set(id(t) for t in best_per_beat.values())
    if len(winners) == 1:
        first = next(iter(best_per_beat.values()))
        return first
    return None


# ── Rendering ────────────────────────────────────────────────────────────────


def _fmt_skew(pct: float) -> str:
    if abs(pct) < 0.5:
        return "on target"
    direction = "slower" if pct > 0 else "faster"
    return f"{abs(pct):.0f}% {direction}"


def render_comparison_md(
    takes: list[TakeMetrics], beats: list[ffr.Beat], slug: str,
) -> str:
    """Render the take-comparison.md report."""
    ranked = rank_takes(takes)
    best_per_beat = pick_best_per_beat(takes, beats)
    single_winner = has_single_winning_take(takes, best_per_beat)

    lines: list[str] = [
        f"# Take Comparison — {slug}",
        "",
        f"> Auto-generated by `tools/narration/take_selector.py`. **Do not edit.**",
        f"> Lower scores are better. Scoring weights: pickup={PICKUP_WEIGHT}, "
        f"skew={DELIVERY_SKEW_WEIGHT}/pct, low-conf={LOW_CONFIDENCE_WEIGHT}.",
        "",
    ]

    # ── Overall ranking ──────────────────────────────────────────────────
    lines.append("## Overall ranking")
    lines.append("")
    lines.append("| Rank | Take | Score | Pickups | Skew | Low-conf |")
    lines.append("|---|---|---|---|---|---|")
    for rank, t in enumerate(ranked, start=1):
        marker = "🥇" if rank == 1 else "🥈" if rank == 2 else "🥉" if rank == 3 else ""
        lines.append(
            f"| {marker} {rank} | **{t.name}** | {t.score_overall:.1f} | "
            f"{t.pickup_count} | {_fmt_skew(t.delivery_skew_pct)} | "
            f"{t.low_confidence_count} |"
        )
    lines.append("")

    # ── Verdict ──────────────────────────────────────────────────────────
    lines.append("## Verdict")
    lines.append("")
    if single_winner is not None:
        lines.append(
            f"🏆 **Use {single_winner.name} for the entire episode.** This take "
            f"won (or tied) every beat — no splicing required."
        )
    else:
        lines.append(
            "⚠️  **No single take wins every beat.** Splice in your DAW: use "
            "the per-beat picks below as your edit guide."
        )
    lines.append("")

    # ── Per-beat breakdown ───────────────────────────────────────────────
    lines.append("## Per-beat best-take picks")
    lines.append("")
    headers = ["Beat", "Winner"] + [f"{t.name} score" for t in takes]
    lines.append("| " + " | ".join(headers) + " |")
    lines.append("|" + "|".join(["---"] * len(headers)) + "|")
    for beat in beats:
        winner = best_per_beat[beat.number]
        winner_label = f"**{winner.name}**"
        scores_cells = []
        for t in takes:
            sc = t.score_per_beat.get(beat.number, 0.0)
            cell = f"{sc:.1f}"
            if t is winner:
                cell = f"✓ {cell}"
            scores_cells.append(cell)
        lines.append(
            f"| B{beat.number} _{beat.title}_ | {winner_label} | "
            + " | ".join(scores_cells) + " |"
        )
    lines.append("")

    # ── Splice cheat sheet (when winner-per-beat) ────────────────────────
    if single_winner is None:
        lines.append("## Splice cheat sheet")
        lines.append("")
        lines.append("Use this as your DAW edit list — for each beat, the chosen take and its pickup count:")
        lines.append("")
        lines.append("| Beat | Use | Why | Pickups remaining |")
        lines.append("|---|---|---|---|")
        for beat in beats:
            winner = best_per_beat[beat.number]
            # Why: lowest score; surface tied takes as alternatives
            tied = [
                t.name for t in takes
                if t is not winner
                and abs(t.score_per_beat.get(beat.number, 0.0)
                        - winner.score_per_beat.get(beat.number, 0.0)) < 0.01
            ]
            why = "cleanest read"
            if tied:
                why += f" (tied with {', '.join(tied)})"
            remaining = winner.pickups_per_beat.get(beat.number, 0)
            remaining_str = f"{remaining}" if remaining else "0 — clean"
            lines.append(f"| B{beat.number} | **{winner.name}** | {why} | {remaining_str} |")
        lines.append("")
        lines.append("_Splice plan: open both takes in your NLE on adjacent tracks, "
                     "switch tracks at beat boundaries per the table above. The "
                     "`narration-diff.md` per-take shows exact timestamps for any "
                     "remaining pickups within the chosen take._")
        lines.append("")

    lines.extend([
        "---",
        "",
        f"_Re-run: `python3 tools/narration/take_selector.py {slug} --takes <wavs...>`_",
        "",
        "_For per-take pickup details, run `whisper_alignment.py` against each take separately._",
    ])
    return "\n".join(lines) + "\n"


# ── CLI ──────────────────────────────────────────────────────────────────────


def _resolve_take_name(path: Path, custom: Optional[str], index: int) -> str:
    if custom:
        return custom
    # Default: file stem ("take-1", "narration-take-2")
    return path.stem or f"take-{index + 1}"


def _load_transcript_from_input(
    inp: Path, transcribe_model: str,
) -> wa.Transcript:
    """Load a transcript from either a JSON file or a WAV (via faster-whisper)."""
    ext = inp.suffix.lower()
    if ext in {".json"}:
        return wa.load_transcript_from_json(inp)
    if ext in {".wav", ".flac", ".mp3", ".m4a"}:
        return wa.transcribe_wav(inp, model_size=transcribe_model)
    raise ValueError(
        f"Unrecognized take input: {inp} — expected .json (transcript) "
        f"or audio file (.wav/.flac/.mp3/.m4a)."
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", nargs="?", help="Episode slug.")
    parser.add_argument("--script", help="Explicit script path.")
    parser.add_argument(
        "--takes", nargs="+",
        help="Paths to audio takes (WAV/FLAC/MP3/M4A) — transcribed via faster-whisper.",
    )
    parser.add_argument(
        "--transcripts", nargs="+",
        help="Paths to pre-generated Whisper JSON transcripts (one per take).",
    )
    parser.add_argument(
        "--names", nargs="+",
        help="Display names for each take (default: filename stem).",
    )
    parser.add_argument(
        "--model", default="medium",
        help="faster-whisper model size (default: medium).",
    )
    parser.add_argument(
        "--low-conf", type=float, default=0.5,
        help="Probability threshold for low-confidence flagging (default: 0.5).",
    )
    parser.add_argument("-o", "--output", help="Output path (default: episodes/<slug>/take-comparison.md).")
    parser.add_argument("--stdout", action="store_true", help="Write to stdout.")
    args = parser.parse_args()

    # ── Resolve script ───────────────────────────────────────────────────
    if args.script:
        script_path = Path(args.script).resolve()
        slug = args.slug or script_path.parent.name
    else:
        if not args.slug:
            print("✗ provide either a slug or --script <path>", file=sys.stderr)
            return 2
        slug = args.slug
        script_path = ffr.find_script(slug)
        if script_path is None or not script_path.is_file():
            print(f"✗ no script found for {slug}", file=sys.stderr)
            return 2

    # ── Collect take inputs ──────────────────────────────────────────────
    inputs: list[Path] = []
    if args.transcripts:
        inputs.extend(Path(p).resolve() for p in args.transcripts)
    if args.takes:
        inputs.extend(Path(p).resolve() for p in args.takes)

    if len(inputs) < 2:
        print(
            "✗ provide at least 2 takes via --takes <wav…> or --transcripts <json…>.\n"
            "  For a single take, use whisper_alignment.py directly.",
            file=sys.stderr,
        )
        return 2

    if args.names and len(args.names) != len(inputs):
        print(
            f"✗ --names has {len(args.names)} entries but {len(inputs)} takes were provided",
            file=sys.stderr,
        )
        return 2

    # ── Build metrics per take ───────────────────────────────────────────
    takes: list[TakeMetrics] = []
    for i, inp in enumerate(inputs):
        if not inp.is_file():
            print(f"✗ take input not found: {inp}", file=sys.stderr)
            return 2
        name = _resolve_take_name(inp, args.names[i] if args.names else None, i)
        try:
            transcript = _load_transcript_from_input(inp, args.model)
        except ImportError as e:
            print(f"✗ {e}", file=sys.stderr)
            return 2
        except ValueError as e:
            print(f"✗ {e}", file=sys.stderr)
            return 2
        takes.append(build_take_metrics(
            name=name, transcript_source=inp,
            script_path=script_path, transcript=transcript,
            low_conf_threshold=args.low_conf,
        ))

    # All reports share the same beat list (from the same script).
    beats = takes[0].report.beats
    rendered = render_comparison_md(takes, beats, slug=slug)

    if args.stdout:
        sys.stdout.write(rendered)
        return 0

    out_path = (
        Path(args.output).resolve()
        if args.output
        else EPISODES_DIR / slug / "take-comparison.md"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(rendered, encoding="utf-8")
    rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
    ranked = rank_takes(takes)
    print(f"✓ wrote {rel}")
    print(f"  {len(takes)} take(s) compared · best: {ranked[0].name} (score {ranked[0].score_overall:.1f})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
