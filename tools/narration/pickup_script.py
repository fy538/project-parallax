#!/usr/bin/env python3
"""
pickup_script.py — close the whisper_alignment → re-record loop.

whisper_alignment.py identifies pickup candidates (missed/substituted
material that needs re-recording), but the operator still has to
manually assemble a "pickup-only" doc to re-read from in the booth.
That manual step is exactly the friction that makes pickups slip
("I'll fix that in editing") and ship as compromised audio.

This tool reads an AlignmentReport (live from whisper_alignment OR a
cached JSON), finds each pickup candidate's surrounding context in the
script, and emits a focused pickup-only document with:

  · One numbered pickup section per issue
  · Audio timestamp (where to splice into the existing take)
  · Context lead-in (~1 sentence of pre-roll for breath/tone matching)
  · The script text to re-record (highlighted)
  · Trail-out (~1 sentence after, so the read has natural momentum)
  · An Audacity-friendly .txt label track for snap-to-pickup editing

Consecutive pickups within --merge-window seconds of each other are
fused into one pickup chunk so the operator records once instead of
twice for adjacent re-takes.

Usage:
    python3 tools/narration/pickup_script.py <slug> --wav <path>
    python3 tools/narration/pickup_script.py <slug> --alignment-json <path>
    python3 tools/narration/pickup_script.py <slug> --wav <path> --labels labels.txt
    python3 tools/narration/pickup_script.py <slug> --wav <path> --merge-window 20

Exit codes:
    0 — pickup script produced (or no pickups needed — also success)
    1 — alignment failed
    2 — missing inputs
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent))
import format_for_reading as ffr  # noqa: E402
import whisper_alignment as wa  # noqa: E402

ROOT = ffr.ROOT
EPISODES_DIR = ffr.EPISODES_DIR

# ── Tunables ─────────────────────────────────────────────────────────────────

# Two pickups whose audio spans are within this many seconds of each
# other are fused into one pickup chunk — saves a separate take when
# they're adjacent in the read. 8 sec at 150 WPM ≈ 20 words ≈ one
# sentence on average, so adjacent-sentence pickups fuse but issues
# from different ideas (15s+ apart) stay separate as their own chunks.
# Previous default of 15s over-merged in dense thesis beats.
DEFAULT_MERGE_WINDOW_SEC = 8.0

# How many script sentences of lead-in context to include for breath /
# tone matching. 1 is the standard pickup discipline; more would make
# the doc bulky.
LEAD_IN_SENTENCES = 1
TRAIL_OUT_SENTENCES = 1


# ── Data shapes ──────────────────────────────────────────────────────────────


@dataclass
class PickupChunk:
    """One contiguous re-record unit."""
    chunk_number: int
    beat_number: int
    beat_title: str
    audio_start_sec: float
    audio_end_sec: float
    lead_in: str                       # pre-roll sentence(s)
    pickup_text: str                   # what to re-record
    trail_out: str                     # post-roll sentence(s)
    source_issues: list[dict] = field(default_factory=list)  # raw issue dicts


@dataclass
class PickupReport:
    slug: str
    wav_path: str
    script_path: str
    total_alignment_issues: int
    chunks: list[PickupChunk] = field(default_factory=list)

    @property
    def chunk_count(self) -> int:
        return len(self.chunks)


# ── Sentence splitting (reuse sayability_lint when available) ───────────────

# Same splitter as sayability_lint: drop the next-char lookahead so
# rhetorical-question + lowercase patterns split cleanly. Abbrev masking
# below handles "Dr. Smith" cases.
_SENTENCE_SPLIT_RE = re.compile(r"(?<=[.!?])\s+")


def _split_into_sentences(text: str) -> list[str]:
    """Lightweight sentence splitter respecting common abbreviations."""
    masked = text
    for abbrev in ffr.ABBREV_PREFIXES:
        masked = masked.replace(abbrev, abbrev.replace(".", "\x00"))
    parts = _SENTENCE_SPLIT_RE.split(masked)
    return [p.replace("\x00", ".").strip() for p in parts if p.strip()]


def _find_sentence_containing(
    text: str, needle: str,
) -> tuple[int, list[str]]:
    """Split text into sentences; return (best_match_index, sentences).

    Picks the sentence with the LONGEST overlap (in shared words) against
    the needle, not just the first one that contains it as a substring.
    This avoids the wrong-sentence-binding failure mode where common
    phrases like "the rational actor" hit a different sentence than the
    intended pickup site. Falls back to first-3-words match when no full
    overlap is found. Returns (-1, sentences) if nothing matches at all.
    """
    sentences = _split_into_sentences(text)
    if not sentences or not needle.strip():
        return -1, sentences

    needle_words = [w.lower() for w in needle.split()]
    if not needle_words:
        return -1, sentences

    needle_set = set(needle_words)

    def _overlap(s: str) -> int:
        sent_words = set(w.lower().strip(".,;:!?\"'") for w in s.split())
        return len(needle_set & sent_words)

    # Score every sentence; pick the highest-overlap one. Require at
    # least 1 shared word to count as a match (avoids binding to a random
    # sentence when the needle truly isn't present).
    scored = [(_overlap(s), i) for i, s in enumerate(sentences)]
    best_overlap, best_i = max(scored, key=lambda t: t[0])
    if best_overlap >= max(1, len(needle_words) // 3):
        return best_i, sentences

    # Fall back: try first 3 words of needle as a substring
    first_few = " ".join(needle.split()[:3]).lower()
    if first_few:
        for i, s in enumerate(sentences):
            if first_few in s.lower():
                return i, sentences
    return -1, sentences


# ── Building pickup chunks ──────────────────────────────────────────────────


def _build_context(
    issue: wa.AlignmentIssue, beats: list[ffr.Beat],
) -> tuple[str, str, str]:
    """For one alignment issue, find lead-in / pickup-text / trail-out
    sentences from the script. Returns ("", needle, "") if context can't
    be located (rare; just means the operator gets the raw issue text)."""
    beat = next((b for b in beats if b.number == issue.beat_number), None)
    if beat is None:
        return "", issue.script_text or issue.spoken_text, ""

    needle = issue.script_text or issue.spoken_text
    if not needle.strip():
        return "", "[insertion — no script text to re-read]", ""

    # Search each narration take in the beat
    for take in beat.takes:
        if take.kind != "narration":
            continue
        idx, sentences = _find_sentence_containing(take.text, needle)
        if idx < 0:
            continue
        # Build lead-in (prior N sentences) and trail (next N sentences)
        lead_start = max(0, idx - LEAD_IN_SENTENCES)
        trail_end = min(len(sentences), idx + 1 + TRAIL_OUT_SENTENCES)
        lead = " ".join(sentences[lead_start:idx])
        pickup = sentences[idx]
        trail = " ".join(sentences[idx + 1:trail_end])
        return lead, pickup, trail

    return "", needle, ""


def merge_adjacent_issues(
    issues: list[wa.AlignmentIssue], window_sec: float = DEFAULT_MERGE_WINDOW_SEC,
) -> list[list[wa.AlignmentIssue]]:
    """Group pickup issues whose audio spans are within `window_sec` of
    each other. Returns a list of groups (each group becomes one chunk)."""
    if not issues:
        return []
    # Sort by audio start time, then merge greedily
    sorted_issues = sorted(issues, key=lambda i: i.audio_start_sec)
    groups: list[list[wa.AlignmentIssue]] = [[sorted_issues[0]]]
    for issue in sorted_issues[1:]:
        last_group = groups[-1]
        last_end = max(i.audio_end_sec for i in last_group)
        if issue.audio_start_sec - last_end <= window_sec and \
                issue.beat_number == last_group[0].beat_number:
            last_group.append(issue)
        else:
            groups.append([issue])
    return groups


def build_pickup_chunks(
    alignment: wa.AlignmentReport, beats: list[ffr.Beat],
    merge_window: float = DEFAULT_MERGE_WINDOW_SEC,
) -> list[PickupChunk]:
    """Turn an AlignmentReport's pickup candidates into focused pickup chunks."""
    groups = merge_adjacent_issues(alignment.pickup_candidates, merge_window)
    chunks: list[PickupChunk] = []
    for n, group in enumerate(groups, 1):
        # Use the first issue for context lookup; combine all issues' text
        # if the group spans multiple sentences within the same beat.
        primary = group[0]
        beat = next((b for b in beats if b.number == primary.beat_number), None)
        beat_title = beat.title if beat else f"Beat {primary.beat_number}"

        if len(group) == 1:
            lead, pickup, trail = _build_context(primary, beats)
        else:
            # Combine: pick lead-in from the first, trail-out from the last,
            # concatenate pickup text from each issue's surrounding sentence
            lead, _, _ = _build_context(primary, beats)
            _, _, trail = _build_context(group[-1], beats)
            pickup_pieces = []
            for issue in group:
                _, p, _ = _build_context(issue, beats)
                if p and p not in pickup_pieces:
                    pickup_pieces.append(p)
            pickup = " ".join(pickup_pieces)

        chunks.append(PickupChunk(
            chunk_number=n,
            beat_number=primary.beat_number,
            beat_title=beat_title,
            audio_start_sec=min(i.audio_start_sec for i in group),
            audio_end_sec=max(i.audio_end_sec for i in group),
            lead_in=lead, pickup_text=pickup, trail_out=trail,
            source_issues=[asdict(i) for i in group],
        ))
    return chunks


# ── Top-level orchestration ─────────────────────────────────────────────────


def run_pickup_pass(
    slug: str, script_path: Path,
    wav_path: Optional[Path] = None,
    alignment_json: Optional[Path] = None,
    merge_window: float = DEFAULT_MERGE_WINDOW_SEC,
) -> PickupReport:
    """Run alignment (from WAV or cached JSON), produce the pickup report."""
    if wav_path is None and alignment_json is None:
        raise ValueError("either wav_path or alignment_json is required")

    beats = ffr.parse_script(script_path)

    if alignment_json is not None:
        # Pre-built report — parse from JSON. Filter to known dataclass
        # fields so a forward-compat AlignmentIssue addition doesn't
        # break already-cached alignment JSONs.
        data = json.loads(alignment_json.read_text(encoding="utf-8"))
        known_fields = {
            f.name for f in __import__("dataclasses").fields(wa.AlignmentIssue)
        }
        issues: list[wa.AlignmentIssue] = []
        for i in data.get("issues", []):
            filtered = {k: v for k, v in i.items() if k in known_fields}
            try:
                issues.append(wa.AlignmentIssue(**filtered))
            except TypeError as e:
                # Missing required field — log and skip
                print(
                    f"⚠ pickup_script: malformed alignment issue skipped: {e}",
                    file=sys.stderr,
                )
        report = wa.AlignmentReport(
            issues=issues,
            script_word_count=data.get("script_word_count", 0),
            transcript_word_count=data.get("transcript_word_count", 0),
            transcript_duration_sec=data.get("transcript_duration_sec", 0.0),
            estimated_script_duration_sec=data.get(
                "estimated_script_duration_sec", 0.0,
            ),
        )
    else:
        # Live alignment
        transcript = wa.transcribe_wav(wav_path)
        report = wa.run_alignment(script_path, transcript, low_conf_threshold=0.5)

    chunks = build_pickup_chunks(report, beats, merge_window=merge_window)
    return PickupReport(
        slug=slug,
        wav_path=str(wav_path) if wav_path else str(alignment_json),
        script_path=str(script_path),
        total_alignment_issues=len(report.issues),
        chunks=chunks,
    )


# ── Rendering ───────────────────────────────────────────────────────────────


def _fmt_mmss(sec: float) -> str:
    total = int(round(abs(sec)))
    return f"{total // 60}:{total % 60:02d}"


def render_pickup_md(report: PickupReport) -> str:
    lines = [
        f"# Pickup Script — {report.slug}",
        "",
        f"_Re-record only the chunks below. Each one is short enough to read "
        f"in one take with natural lead-in / trail-out for splicing._",
        "",
        f"**Source:** `{report.wav_path}`",
        f"**Alignment issues total:** {report.total_alignment_issues}",
        f"**Pickup chunks (after merging adjacent):** {report.chunk_count}",
        "",
    ]

    if not report.chunks:
        lines.extend([
            "## ✅ No pickups needed",
            "",
            "The alignment pass found no major missed/substituted material. "
            "The current take is ready for mastering.",
            "",
        ])
        return "\n".join(lines)

    lines.extend([
        "## Recording tips",
        "",
        "- Read the **lead-in** out loud first to set tone + breath, then "
        "continue straight into the pickup. The lead-in is NOT recorded — "
        "it just primes you.",
        "- Speak the **pickup text** with the same energy as the surrounding "
        "narration. If you started warm and the original was cold, the splice "
        "will be audible.",
        "- The **trail-out** gives you a place to land naturally; the editor "
        "trims it out at the splice point.",
        "- Adjacent pickups have already been fused — record each section "
        "ONCE end-to-end if it reads naturally.",
        "",
        "## Pickup chunks",
        "",
    ])

    for c in report.chunks:
        lines.append(
            f"### Pickup {c.chunk_number} · Beat {c.beat_number} "
            f"_({c.beat_title[:50]})_ · audio {_fmt_mmss(c.audio_start_sec)}–{_fmt_mmss(c.audio_end_sec)}"
        )
        lines.append("")
        if c.lead_in:
            lines.append(f"_Lead-in (don't record — read silently first):_")
            lines.append("")
            lines.append(f"> {c.lead_in}")
            lines.append("")
        lines.append("**RECORD THIS:**")
        lines.append("")
        lines.append(f"> **{c.pickup_text}**")
        lines.append("")
        if c.trail_out:
            lines.append(f"_Trail-out (read into this for natural landing — editor trims):_")
            lines.append("")
            lines.append(f"> {c.trail_out}")
            lines.append("")
        lines.append("---")
        lines.append("")

    return "\n".join(lines)


def render_audacity_labels(report: PickupReport) -> str:
    """Audacity label-track format: `start_sec\\tend_sec\\tlabel\\n`."""
    lines: list[str] = []
    for c in report.chunks:
        label = (
            f"Pickup {c.chunk_number} (Beat {c.beat_number}): "
            f"{c.pickup_text[:60]}{'…' if len(c.pickup_text) > 60 else ''}"
        )
        lines.append(f"{c.audio_start_sec:.3f}\t{c.audio_end_sec:.3f}\t{label}")
    return "\n".join(lines) + "\n"


# ── CLI ─────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", help="Episode slug.")
    parser.add_argument("--script", help="Explicit script path.")
    parser.add_argument("--wav", help="Path to recorded narration WAV.")
    parser.add_argument(
        "--alignment-json",
        help="Path to pre-built AlignmentReport JSON (skips Whisper run).",
    )
    parser.add_argument(
        "--merge-window", type=float, default=DEFAULT_MERGE_WINDOW_SEC,
        help=f"Fuse pickups within this many seconds (default {DEFAULT_MERGE_WINDOW_SEC}).",
    )
    parser.add_argument(
        "--labels",
        help="Also emit an Audacity .txt label track to this path.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON.")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout.")
    parser.add_argument("-o", "--output", help="Write markdown to this path.")
    args = parser.parse_args()

    if not args.wav and not args.alignment_json:
        print("✗ either --wav or --alignment-json is required", file=sys.stderr)
        return 2

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

    wav_path = Path(args.wav).resolve() if args.wav else None
    if wav_path and not wav_path.is_file():
        print(f"✗ wav not found: {wav_path}", file=sys.stderr)
        return 2

    align_path = Path(args.alignment_json).resolve() if args.alignment_json else None
    if align_path and not align_path.is_file():
        print(f"✗ alignment json not found: {align_path}", file=sys.stderr)
        return 2

    try:
        report = run_pickup_pass(
            args.slug, script_path,
            wav_path=wav_path, alignment_json=align_path,
            merge_window=args.merge_window,
        )
    except (
        ImportError, RuntimeError, FileNotFoundError,
        json.JSONDecodeError, KeyError, TypeError,
    ) as e:
        print(f"✗ alignment failed: {type(e).__name__}: {e}", file=sys.stderr)
        return 1

    if args.json:
        payload = {
            "slug": report.slug,
            "wav_path": report.wav_path,
            "script_path": report.script_path,
            "total_alignment_issues": report.total_alignment_issues,
            "chunk_count": report.chunk_count,
            "chunks": [asdict(c) for c in report.chunks],
        }
        out = json.dumps(payload, indent=2)
    else:
        out = render_pickup_md(report)

    if args.stdout or not args.output:
        sys.stdout.write(out)
    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(out, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        if not args.stdout:
            print(f"✓ wrote {rel}", file=sys.stderr)

    if args.labels:
        labels_path = Path(args.labels).resolve()
        labels_path.parent.mkdir(parents=True, exist_ok=True)
        labels_path.write_text(render_audacity_labels(report), encoding="utf-8")
        rel = labels_path.relative_to(ROOT) if labels_path.is_relative_to(ROOT) else labels_path
        print(f"✓ wrote labels {rel}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
