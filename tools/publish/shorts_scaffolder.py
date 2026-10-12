#!/usr/bin/env python3
"""
shorts_scaffolder.py — pre-populate episodes/<slug>/shorts-manifest.json
from the assembly manifest.

The operator runs this early in the publish phase. It identifies the strongest
consecutive-segment windows inside the episode and emits a scaffold JSON with
startSec/endSec/segments already filled in. The operator edits hook, caption,
and hashtags; the file is then consumed by render-shorts.mjs.

Algorithm
---------
1.  Read remotion-templates/data/episodes/<slug>/assembly-manifest.json.
2.  Collect all non-HOLD, non-TRANSITION segments into a flat ordered list.
3.  Enumerate every consecutive window whose total duration falls between
    --min-sec and --max-sec.
4.  Score each window:
      +3  contains KineticTypography or StatReveal (strong visual moments)
      +2  contains DataChart, FrameworkDiagram, TimeSeriesChart, GameBoard
      +1  every additional "visual" template (non-FOOTAGE, non-IMAGE type
          foreground TEMPLATE segment)
      +2  mid-episode position (20%–80% of total runtime)
      -1  more than 3 consecutive FOOTAGE/IMAGE segments (visually thin)
5.  Select top --count non-overlapping windows, spaced >= 60 s apart.
6.  Write episodes/<slug>/shorts-manifest.json.

Usage
-----
    python3 tools/publish/shorts_scaffolder.py <slug>
    python3 tools/publish/shorts_scaffolder.py <slug> --count 4
    python3 tools/publish/shorts_scaffolder.py <slug> --min-sec 45 --max-sec 90
    python3 tools/publish/shorts_scaffolder.py <slug> --dry-run
    python3 tools/publish/shorts_scaffolder.py <slug> --force

Exit codes
----------
    0   success (file written or dry-run completed)
    1   assembly manifest not found
    2   usage error (slug missing, bad options, etc.)
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import NamedTuple

# ── Bootstrap shared path utilities ──────────────────────────────────────────

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()

# ── Constants ─────────────────────────────────────────────────────────────────

DEFAULT_COUNT = 3
DEFAULT_MIN_SEC = 30.0
DEFAULT_MAX_SEC = 90.0
MIN_SPACING_SEC = 60.0   # minimum gap between selected windows

# Components scored as "strong visual moments" (+3 bonus)
HIGH_VALUE_COMPONENTS = {"KineticTypography", "StatReveal"}

# Components scored as "good analytical moments" (+2 bonus)
MID_VALUE_COMPONENTS = {
    "DataChart", "FrameworkDiagram", "TimeSeriesChart", "GameBoard",
    "ArcDiagram", "BumpChart", "EscalationLadder", "NetworkDiagram",
    "HorizontalTimeline", "BayesianUpdate", "ProbabilityGauge",
    "MathReveal", "MathDerivation", "ToulminMap", "AnalogyCrossmap",
}

# Segment types that are visually thin on their own (FOOTAGE/IMAGE only)
THIN_TYPES = {"FOOTAGE", "IMAGE"}

# Segment types excluded from window construction entirely
SKIP_TYPES = {"HOLD", "TRANSITION"}


# ── Data shapes ───────────────────────────────────────────────────────────────


class FlatSeg(NamedTuple):
    """Flattened, indexable view of one manifest segment."""
    idx: int           # position in the flat list
    seg_id: str
    seg_type: str      # "TEMPLATE" | "FOOTAGE" | "IMAGE" | "HOLD" | etc.
    component: str     # Remotion component name (empty for FOOTAGE/IMAGE)
    start: float
    end: float
    duration: float
    narration_ref: str
    beat: str
    priority: str


class Window(NamedTuple):
    """A candidate excerpt window."""
    flat_start_idx: int    # index into flat_segs list
    flat_end_idx: int      # inclusive
    start_sec: float
    end_sec: float
    duration_sec: float
    seg_ids: list[str]
    score: float
    label: str             # first segment id or component for display


# ── Manifest helpers ──────────────────────────────────────────────────────────


def _load_manifest(slug: str) -> dict:
    path = ROOT / "remotion-templates" / "data" / "episodes" / slug / "assembly-manifest.json"
    if not path.is_file():
        print(f"Error: assembly manifest not found: {path}", file=sys.stderr)
        sys.exit(1)
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        print(f"Error: could not parse manifest JSON: {exc}", file=sys.stderr)
        sys.exit(1)


def _component_of(seg: dict) -> str:
    """Extract Remotion component name from a segment dict."""
    tmpl = seg.get("template")
    if isinstance(tmpl, dict):
        return tmpl.get("component") or tmpl.get("name", "")
    if isinstance(tmpl, str):
        return tmpl
    return ""


def _flatten_segments(manifest: dict) -> list[FlatSeg]:
    """Return an ordered list of relevant (non-HOLD, non-TRANSITION) segments."""
    flat: list[FlatSeg] = []
    for i, seg in enumerate(manifest.get("segments", [])):
        seg_type = seg.get("type", "TEMPLATE").upper()
        if seg_type in SKIP_TYPES:
            continue
        start = float(seg.get("startSec", 0))
        end = float(seg.get("endSec", 0))
        flat.append(FlatSeg(
            idx=len(flat),
            seg_id=seg.get("id", f"seg-{i}"),
            seg_type=seg_type,
            component=_component_of(seg),
            start=start,
            end=end,
            duration=max(0.0, end - start),
            narration_ref=seg.get("narrationRef", ""),
            beat=seg.get("beat", ""),
            priority=(seg.get("priority") or "").upper(),
        ))
    return flat


# ── Scoring ───────────────────────────────────────────────────────────────────


def _score_window(
    segs: list[FlatSeg],
    total_duration: float,
    win_start: float,
    win_end: float,
) -> float:
    """Compute a heuristic quality score for a window slice."""
    score = 0.0

    high_count = sum(1 for s in segs if s.component in HIGH_VALUE_COMPONENTS)
    mid_count = sum(1 for s in segs if s.component in MID_VALUE_COMPONENTS)
    thin_count = sum(1 for s in segs if s.seg_type in THIN_TYPES)
    template_count = sum(1 for s in segs if s.seg_type == "TEMPLATE")

    score += high_count * 3
    score += mid_count * 2
    score += template_count * 1

    # Penalty for footage-heavy windows (visually thin without narration context)
    if thin_count > 3:
        score -= 1

    # Mid-episode bonus (avoids cold open and ending)
    if total_duration > 0:
        mid_frac_start = win_start / total_duration
        mid_frac_end = win_end / total_duration
        mid_center = (mid_frac_start + mid_frac_end) / 2
        if 0.20 <= mid_center <= 0.80:
            score += 2

    # Diversity bonus: prefer windows that aren't a run of identical templates
    seen_components = {s.component for s in segs if s.component}
    if len(seen_components) >= 2:
        score += 1

    # P1/P2 priority bonus
    high_priority = sum(1 for s in segs if s.priority in ("P1", "P2"))
    if high_priority >= 1:
        score += 1

    return score


# ── Window enumeration ────────────────────────────────────────────────────────


def _enumerate_windows(
    flat: list[FlatSeg],
    min_sec: float,
    max_sec: float,
    total_duration: float,
) -> list[Window]:
    """Enumerate all consecutive-segment windows within duration bounds."""
    n = len(flat)
    windows: list[Window] = []

    for i in range(n):
        acc = 0.0
        for j in range(i, n):
            seg = flat[j]
            acc += seg.duration
            if acc < min_sec:
                continue
            if acc > max_sec:
                break
            # Valid window [i..j]
            segs_in = list(flat[i : j + 1])
            win_start = flat[i].start
            win_end = flat[j].end
            score = _score_window(segs_in, total_duration, win_start, win_end)
            label = segs_in[0].component or segs_in[0].seg_id if segs_in else "?"
            windows.append(Window(
                flat_start_idx=i,
                flat_end_idx=j,
                start_sec=win_start,
                end_sec=win_end,
                duration_sec=acc,
                seg_ids=[s.seg_id for s in segs_in],
                score=score,
                label=label,
            ))

    return windows


# ── Non-overlapping selection ─────────────────────────────────────────────────


def _select_windows(
    windows: list[Window],
    count: int,
    min_spacing: float,
) -> list[Window]:
    """Greedy selection of top-scored non-overlapping windows, spaced >= min_spacing apart."""
    # Sort descending by score, then by position as tiebreak
    ranked = sorted(windows, key=lambda w: (-w.score, w.start_sec))
    selected: list[Window] = []

    for candidate in ranked:
        if len(selected) >= count:
            break
        # Check spacing against all already-selected windows
        too_close = any(
            abs(candidate.start_sec - sel.start_sec) < min_spacing
            for sel in selected
        )
        if too_close:
            continue
        selected.append(candidate)

    # Return in episode order
    selected.sort(key=lambda w: w.start_sec)
    return selected


# ── Output construction ───────────────────────────────────────────────────────


def _build_manifest(slug: str, windows: list[Window]) -> dict:
    """Build the shorts-manifest.json dict."""
    shorts = []
    for i, win in enumerate(windows, 1):
        short_id = f"short-{i:02d}"
        title = f"Short {i} — {win.label}"
        shorts.append({
            "id": short_id,
            "title": title,
            "startSec": round(win.start_sec, 1),
            "endSec": round(win.end_sec, 1),
            "durationSec": round(win.duration_sec, 1),
            "segments": win.seg_ids,
            "hook": "TODO: Add 3-second hook text",
            "caption": "TODO: Add YouTube Shorts caption",
            "hashtags": ["#Parallax", "#Geopolitics", "TODO"],
        })

    return {
        "episode": slug,
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "note": (
            "Scaffolded by shorts_scaffolder.py — review timing and add "
            "hook/caption before rendering"
        ),
        "shorts": shorts,
    }


# ── Table output ──────────────────────────────────────────────────────────────


def _print_table(windows: list[Window]) -> None:
    """Print a summary table of selected windows."""
    header = f"{'#':>2}  {'Start':>8}  {'End':>8}  {'Dur':>6}  {'Score':>5}  Templates in window"
    print(header)
    print("-" * len(header))
    for i, win in enumerate(windows, 1):
        templates = ", ".join(dict.fromkeys(
            # Unique template names in order, skipping empties
            s for s in [
                # We reconstruct from seg_ids — just show the label for now
            ] if s
        )) or win.label
        print(
            f"{i:>2}  {win.start_sec:>7.1f}s  {win.end_sec:>7.1f}s  "
            f"{win.duration_sec:>5.1f}s  {win.score:>5.1f}  {templates}"
        )


def _print_table_with_segs(
    windows: list[Window],
    flat: list[FlatSeg],
) -> None:
    """Print a summary table with the component names pulled from flat_segs."""
    seg_by_id = {s.seg_id: s for s in flat}
    header = (
        f"{'#':>2}  {'Start':>8}  {'End':>8}  {'Dur':>6}  "
        f"{'Score':>5}  Templates in window"
    )
    print(header)
    print("-" * max(len(header), 80))
    for i, win in enumerate(windows, 1):
        components = []
        seen: set[str] = set()
        for seg_id in win.seg_ids:
            seg = seg_by_id.get(seg_id)
            if seg:
                label = seg.component or seg.seg_type
                if label and label not in seen:
                    components.append(label)
                    seen.add(label)
        template_str = ", ".join(components) if components else win.label
        # Trim if too long
        if len(template_str) > 55:
            template_str = template_str[:52] + "..."
        print(
            f"{i:>2}  {win.start_sec:>7.1f}s  {win.end_sec:>7.1f}s  "
            f"{win.duration_sec:>5.1f}s  {win.score:>5.1f}  {template_str}"
        )


# ── CLI ───────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Pre-populate episodes/<slug>/shorts-manifest.json from the "
            "assembly manifest. Identifies strong excerpt windows and emits "
            "a scaffold the operator edits before rendering."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("slug", help="Episode slug (e.g. prisoners-dilemma).")
    parser.add_argument(
        "--count", type=int, default=DEFAULT_COUNT,
        metavar="N",
        help=f"Number of Shorts to scaffold (default {DEFAULT_COUNT}).",
    )
    parser.add_argument(
        "--min-sec", type=float, default=DEFAULT_MIN_SEC,
        metavar="S",
        help=f"Minimum Short duration in seconds (default {DEFAULT_MIN_SEC:.0f}).",
    )
    parser.add_argument(
        "--max-sec", type=float, default=DEFAULT_MAX_SEC,
        metavar="S",
        help=f"Maximum Short duration in seconds (default {DEFAULT_MAX_SEC:.0f}).",
    )
    parser.add_argument(
        "--force", action="store_true",
        help="Overwrite existing shorts-manifest.json (default: fail if exists).",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print what would be written without writing the file.",
    )

    args = parser.parse_args()

    # Validate options
    if args.count < 1:
        print("Error: --count must be >= 1", file=sys.stderr)
        return 2
    if args.min_sec <= 0:
        print("Error: --min-sec must be > 0", file=sys.stderr)
        return 2
    if args.max_sec <= args.min_sec:
        print("Error: --max-sec must be > --min-sec", file=sys.stderr)
        return 2

    slug = args.slug
    out_path = ROOT / "episodes" / slug / "shorts-manifest.json"

    # Guard against overwriting without --force
    if out_path.exists() and not args.force and not args.dry_run:
        print(
            f"Error: {out_path.relative_to(ROOT)} already exists.\n"
            "  Use --force to overwrite, or --dry-run to preview.",
            file=sys.stderr,
        )
        return 2

    # Load + flatten manifest
    manifest = _load_manifest(slug)
    total_duration = float(manifest.get("totalDurationSec", 0))
    flat = _flatten_segments(manifest)

    if not flat:
        print(
            f"Error: no usable segments found in manifest for '{slug}'.\n"
            "  Is this a stub manifest?",
            file=sys.stderr,
        )
        return 1

    # Enumerate candidate windows
    windows = _enumerate_windows(flat, args.min_sec, args.max_sec, total_duration)

    if not windows:
        print(
            f"No windows found between {args.min_sec:.0f}s–{args.max_sec:.0f}s.\n"
            "  Try widening --min-sec / --max-sec.",
            file=sys.stderr,
        )
        return 1

    # Select top N non-overlapping windows
    selected = _select_windows(windows, args.count, MIN_SPACING_SEC)

    if not selected:
        print(
            "Could not select any non-overlapping windows with "
            f">= {MIN_SPACING_SEC:.0f}s spacing.\n"
            "  Try reducing --count or --min-sec.",
            file=sys.stderr,
        )
        return 1

    # Print selection table
    print(f"\nShorts scaffolder — {slug}")
    print(f"  Episode duration : {total_duration:.1f}s")
    print(f"  Candidate windows: {len(windows)}")
    print(f"  Selected         : {len(selected)}")
    print(f"  Duration range   : {args.min_sec:.0f}s – {args.max_sec:.0f}s")
    print()
    _print_table_with_segs(selected, flat)
    print()

    # Build output manifest
    manifest_out = _build_manifest(slug, selected)

    if args.dry_run:
        print("--- DRY RUN — would write to:", out_path.relative_to(ROOT))
        print(json.dumps(manifest_out, indent=2))
        return 0

    # Write file
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(manifest_out, indent=2) + "\n", encoding="utf-8")
    rel = out_path.relative_to(ROOT)
    print(f"Wrote {rel}")
    print(
        f"  Next: edit hook/caption/hashtags for each short,\n"
        f"  then run: npm run shorts -- --episode={slug}"
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
