#!/usr/bin/env python3
"""
splice_plan.py — turn whisper_alignment's pickup list into an Audacity
label track the operator imports to splice corrected takes into the master.

After `whisper_alignment.py` surfaces "re-record these 7 lines at these
7 timestamps," the operator records pickup takes — one short WAV per
flagged line — and currently has to manually align each one to its
original position in their DAW. This tool closes that gap: it consumes
the pickup files + the alignment report, computes exact splice points,
and emits an Audacity label track marking each splice with a human-
readable description ("PICKUP 1: pickup-1.wav → 'Schelling's response'").

Operator workflow:
  1. Run whisper_alignment.py → narration-diff.md (pickup list)
  2. Re-record the flagged lines as pickup-1.wav, pickup-2.wav, … (in
     the order they appear in the pickup table — positional matching)
  3. Run splice_plan.py → splice-plan.txt (label track)
  4. In Audacity: File → Import → Labels → splice-plan.txt
  5. See markers at exact pickup positions, drag pickup WAVs onto
     adjacent tracks, crossfade at the boundaries, export.

Why label-track instead of auto-splice: pickup audio often has subtly
different room sound or mic position than the original take. Auto-
splicing produces audible clicks or tonal shifts at cut points. The
operator-in-the-loop workflow with a labeled timeline is faster than
trying to chase down "why does my splice sound weird" after the fact.

Usage:
    python3 tools/narration/splice_plan.py <slug> \
        --pickups episodes/<slug>/assets/pickups/*.wav
    python3 tools/narration/splice_plan.py <slug> \
        --transcript <path>.json \
        --pickups pickup-1.wav pickup-2.wav pickup-3.wav
    python3 tools/narration/splice_plan.py <slug> --stdout

Default output: `episodes/<slug>/splice-plan.txt`

Exit codes:
    0 — label track written
    1 — alignment produced no pickup candidates (nothing to splice)
    2 — missing input / fewer pickups than candidates
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
import format_for_reading as ffr  # noqa: E402
import whisper_alignment as wa  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"

# When the pickup audio's exact duration is unknown, expand the splice
# region by this many seconds on each side so the operator has room to
# nudge the alignment in Audacity. The default narration cut grabs a
# little of the surrounding context too — small over-allocation here
# is safer than under.
DEFAULT_SPLICE_PAD_SEC = 0.15

# Audacity label-track format: tab-separated `start TAB end TAB text`,
# times in seconds (decimal). Documented at
# https://manual.audacityteam.org/man/importing_and_exporting_labels.html


@dataclass
class SpliceMark:
    """One pickup splice — start/end in the master + the pickup file +
    a human-readable label for Audacity."""

    pickup_index: int          # 1-based, matches narration-diff.md ordering
    start_sec: float           # original start of the missed/substituted region
    end_sec: float             # original end
    pickup_path: Path          # the re-record WAV
    original_text: str         # what was supposed to be said (for the label)
    spoken_text: str           # what was actually said in the master (debug context)

    @property
    def duration_sec(self) -> float:
        return max(self.end_sec - self.start_sec, 0.0)


# ── Splice plan assembly ─────────────────────────────────────────────────────


def build_splice_plan(
    report: wa.AlignmentReport, pickup_paths: list[Path],
    pad_sec: float = DEFAULT_SPLICE_PAD_SEC,
) -> tuple[list[SpliceMark], list[str]]:
    """Match pickups (positional) to pickup candidates from the alignment.

    Returns (marks, warnings). Warnings are surfaced to the operator but
    don't block — e.g. "you provided 3 pickups but there are 5 candidates"
    is informational; we splice what we can.

    Pickups are matched by positional order: pickup_paths[0] → first
    candidate in the report's `pickup_candidates`, etc. Order in the
    report is by audio start time (chronological), which is also the
    order the operator naturally re-records.
    """
    candidates = report.pickup_candidates
    warnings: list[str] = []

    if not candidates:
        warnings.append("alignment report has no pickup candidates; nothing to splice")
        return [], warnings

    if len(pickup_paths) > len(candidates):
        warnings.append(
            f"{len(pickup_paths)} pickup file(s) provided but only "
            f"{len(candidates)} candidate(s) in the report — extras ignored"
        )
    elif len(pickup_paths) < len(candidates):
        warnings.append(
            f"{len(pickup_paths)} pickup file(s) provided but report has "
            f"{len(candidates)} candidate(s) — covering only the first "
            f"{len(pickup_paths)}; re-run after recording the rest"
        )

    marks: list[SpliceMark] = []
    for i, pickup in enumerate(pickup_paths[:len(candidates)]):
        c = candidates[i]
        # Pad the region slightly to give Audacity nudge room — exact
        # cut points often need ±100ms of slop to splice cleanly without
        # clipping the start of a syllable.
        start = max(c.audio_start_sec - pad_sec, 0.0)
        end = c.audio_end_sec + pad_sec
        marks.append(SpliceMark(
            pickup_index=i + 1,
            start_sec=start,
            end_sec=end,
            pickup_path=pickup,
            original_text=c.script_text,
            spoken_text=c.spoken_text,
        ))
    return marks, warnings


# ── Rendering ────────────────────────────────────────────────────────────────


def _truncate_for_label(text: str, max_chars: int = 60) -> str:
    """Audacity label rendering is finite — keep labels readable."""
    text = text.strip().replace("\n", " ").replace("\t", " ")
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0] + "…"


def render_audacity_labels(marks: list[SpliceMark]) -> str:
    """Tab-separated label-track format Audacity reads via Import → Labels."""
    lines: list[str] = []
    for m in marks:
        label = (
            f"PICKUP {m.pickup_index} ({m.pickup_path.name}): "
            f"\"{_truncate_for_label(m.original_text)}\""
        )
        lines.append(f"{m.start_sec:.3f}\t{m.end_sec:.3f}\t{label}")
    return "\n".join(lines) + ("\n" if lines else "")


def render_summary(marks: list[SpliceMark], warnings: list[str], slug: str) -> str:
    """Human-readable summary for stdout / log line — not for Audacity."""
    lines: list[str] = [
        f"# Splice Plan — {slug}",
        "",
        f"**{len(marks)} splice(s) planned.**",
        "",
    ]
    for w in warnings:
        lines.append(f"⚠ {w}")
    if warnings:
        lines.append("")
    if marks:
        lines.append("| # | Pickup file | Region | Original line |")
        lines.append("|---|---|---|---|")
        for m in marks:
            lines.append(
                f"| {m.pickup_index} | `{m.pickup_path.name}` | "
                f"{_fmt_ts(m.start_sec)}–{_fmt_ts(m.end_sec)} "
                f"({m.duration_sec:.1f}s) | "
                f"_\"{_truncate_for_label(m.original_text, 80)}\"_ |"
            )
        lines.append("")
    lines.extend([
        "**Next step:** In Audacity, File → Import → Labels → select the "
        "splice-plan.txt file. Markers will appear at the splice positions. "
        "Drag your pickup WAVs onto adjacent tracks, align to the markers, "
        "crossfade at the boundaries, export.",
        "",
    ])
    return "\n".join(lines)


def _fmt_ts(sec: float) -> str:
    minutes = int(sec // 60)
    rem = sec - minutes * 60
    return f"{minutes}:{rem:05.2f}"


# ── CLI ──────────────────────────────────────────────────────────────────────


def _default_transcript(slug: str) -> Path:
    return EPISODES_DIR / slug / "assets" / "narration.json"


def _default_wav(slug: str) -> Path:
    return EPISODES_DIR / slug / "assets" / "narration.wav"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", nargs="?", help="Episode slug.")
    parser.add_argument("--script", help="Explicit script path.")
    parser.add_argument(
        "--transcript", help="Whisper transcript JSON (default: episodes/<slug>/assets/narration.json).",
    )
    parser.add_argument(
        "--wav", help="Master WAV (transcribed via faster-whisper if --transcript absent).",
    )
    parser.add_argument(
        "--pickups", nargs="+", required=True,
        help="Pickup WAV files in order matching the report's pickup table "
             "(pickup-1.wav matches the first candidate, etc.).",
    )
    parser.add_argument(
        "--pad", type=float, default=DEFAULT_SPLICE_PAD_SEC,
        help=f"Seconds of region pad on each side (default: {DEFAULT_SPLICE_PAD_SEC}).",
    )
    parser.add_argument(
        "-o", "--output", help="Label-track output path (default: episodes/<slug>/splice-plan.txt).",
    )
    parser.add_argument("--stdout", action="store_true", help="Print label track to stdout.")
    parser.add_argument(
        "--summary", action="store_true",
        help="Print the human-readable summary (in addition to writing the label track).",
    )
    args = parser.parse_args()

    # Resolve script
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

    # Resolve transcript
    transcript: Optional[wa.Transcript] = None
    if args.transcript:
        tpath = Path(args.transcript).resolve()
        if not tpath.is_file():
            print(f"✗ transcript not found: {tpath}", file=sys.stderr)
            return 2
        transcript = wa.load_transcript_from_json(tpath)
    elif args.wav:
        wpath = Path(args.wav).resolve()
        if not wpath.is_file():
            print(f"✗ WAV not found: {wpath}", file=sys.stderr)
            return 2
        try:
            transcript = wa.transcribe_wav(wpath)
        except ImportError as e:
            print(f"✗ {e}", file=sys.stderr)
            return 2
    else:
        # Auto-discover (same logic as whisper_alignment)
        default_t = _default_transcript(slug)
        default_w = _default_wav(slug)
        if default_t.is_file():
            transcript = wa.load_transcript_from_json(default_t)
        elif default_w.is_file():
            try:
                transcript = wa.transcribe_wav(default_w)
            except ImportError as e:
                print(f"✗ {e}", file=sys.stderr)
                return 2
        else:
            print(
                f"✗ no transcript or WAV found.\n"
                f"  Looked at: {default_t}\n  And: {default_w}\n"
                f"  Provide --transcript or --wav.",
                file=sys.stderr,
            )
            return 2

    # Validate pickup files
    pickup_paths = [Path(p).resolve() for p in args.pickups]
    missing = [p for p in pickup_paths if not p.is_file()]
    if missing:
        for p in missing:
            print(f"✗ pickup not found: {p}", file=sys.stderr)
        return 2

    # Build the plan
    report = wa.run_alignment(script_path, transcript, low_conf_threshold=0.5)
    marks, warnings = build_splice_plan(report, pickup_paths, pad_sec=args.pad)

    if not marks:
        for w in warnings:
            print(f"⚠ {w}", file=sys.stderr)
        # No candidates to splice — return 1 so a CI / orchestrator
        # treats "alignment was clean" as "no work to do here" distinctly
        # from "all good."
        return 1

    label_track = render_audacity_labels(marks)

    if args.stdout:
        sys.stdout.write(label_track)
        if args.summary:
            sys.stdout.write("\n")
            sys.stdout.write(render_summary(marks, warnings, slug))
        return 0

    out_path = (
        Path(args.output).resolve() if args.output
        else EPISODES_DIR / slug / "splice-plan.txt"
    )
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(label_track, encoding="utf-8")

    rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
    print(f"✓ wrote {rel} — {len(marks)} splice mark(s)")
    for w in warnings:
        print(f"  ⚠ {w}")
    if args.summary:
        print()
        print(render_summary(marks, warnings, slug))
    return 0


if __name__ == "__main__":
    sys.exit(main())
