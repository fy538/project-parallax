#!/usr/bin/env python3
"""
script_diff.py — objective A/B comparison between two production scripts.

The recency-bias antidote. When two versions of a script exist, the
author (human or AI) instinctively favors the newer one — they wrote it
last, they're emotionally invested. This tool measures BOTH versions
through `engagement_metrics.py`, computes deltas, and renders a
side-by-side report so the comparison is structural rather than
emotional.

It does NOT decide which version is better — engagement metrics are
correlates, not causes, and only published-retention data can decide
definitively. What it does is surface where two versions DIFFER
measurably, so the decision is informed instead of vibes-based.

Use this on every script revision: v5 vs v6, then v6 vs v7, etc. The
diff reports compound into a per-episode revision history that lets
publish-retro calibrate which metric deltas correlated with retention
shifts.

Usage:
    python3 tools/narration/script_diff.py <script_a> <script_b>
    python3 tools/narration/script_diff.py <a> <b> --names "v5" "v6"
    python3 tools/narration/script_diff.py <a> <b> -o diff-report.md
    python3 tools/narration/script_diff.py <a> <b> --stdout

The first script is treated as the BASELINE (deltas are reported as
"vs baseline" — positive means "version B has more of X than A").
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Callable, Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
import engagement_metrics as em  # noqa: E402

ROOT = get_project_root()

# Significance thresholds — below these, deltas are noise.
# Above, they're flagged as material differences.
SIGNIFICANCE_THRESHOLDS: dict[str, float] = {
    "word_count_pct": 5.0,            # 5% word-count change matters
    "runtime_sec": 30.0,              # 30s runtime delta matters
    "hook_position_sec": 5.0,         # 5s hook-position delta matters
    "pattern_interrupts_per_min": 1.0,  # 1 interrupt/min matters
    "bridge_count": 2,                # 2 bridges matters
    "direct_address_per_100w": 0.3,   # 0.3 per-100w matters
    "caveat_per_1000w": 1.0,          # 1 per-1000w matters
    "sentence_length_mean": 1.0,      # 1 word mean delta matters
    "proper_noun_count": 3,           # 3 candidates matters
}


@dataclass
class MetricDelta:
    """One row of the comparison table."""

    name: str
    value_a: str        # rendered for display
    value_b: str
    delta: str          # rendered (e.g. "+12%", "-30s")
    significant: bool
    direction: str      # "↑" if B > A, "↓" if B < A, "→" if equal
    interpretation: str = ""


# ── Delta computation helpers ────────────────────────────────────────────────


def _delta_pct(a: float, b: float) -> float:
    """Percentage change from a to b. Handles zero baseline."""
    if a == 0:
        return float("inf") if b != 0 else 0.0
    return (b - a) / a * 100


def _direction(a: float, b: float) -> str:
    if abs(a - b) < 1e-9:
        return "→"
    return "↑" if b > a else "↓"


def _fmt_sec(s: Optional[float]) -> str:
    if s is None:
        return "—"
    return f"{s:.1f}s"


def _fmt_mmss(s: Optional[float]) -> str:
    if s is None:
        return "—"
    total = int(round(s))
    return f"{total // 60}:{total % 60:02d}"


def _make_delta(
    name: str, a: Optional[float], b: Optional[float],
    threshold_key: str,
    fmt: Callable[[Optional[float]], str] = lambda v: f"{v:.1f}" if v is not None else "—",
    interpretation: str = "",
    delta_fmt: Optional[Callable[[float, float], str]] = None,
) -> MetricDelta:
    """Build one MetricDelta row."""
    if a is None and b is None:
        return MetricDelta(name, "—", "—", "—", False, "→", interpretation)
    a_val = a if a is not None else 0.0
    b_val = b if b is not None else 0.0

    if delta_fmt:
        delta_str = delta_fmt(a_val, b_val)
    else:
        delta_str = f"{b_val - a_val:+.1f}"

    threshold = SIGNIFICANCE_THRESHOLDS.get(threshold_key, 0.0)
    # Threshold keys ending in `_pct` are interpreted as percentage deltas;
    # everything else as absolute deltas. Letting both styles coexist means
    # "word count differs by 5%" is comparable across episodes of any length.
    if threshold_key.endswith("_pct"):
        delta_metric = abs(_delta_pct(a_val, b_val))
    else:
        delta_metric = abs(b_val - a_val)
    significant = delta_metric >= threshold

    return MetricDelta(
        name=name,
        value_a=fmt(a) if a is not None else "—",
        value_b=fmt(b) if b is not None else "—",
        delta=delta_str,
        significant=significant,
        direction=_direction(a_val, b_val),
        interpretation=interpretation,
    )


# ── Top-level comparison ────────────────────────────────────────────────────


def compare(
    metrics_a: em.EngagementMetrics, metrics_b: em.EngagementMetrics,
) -> list[MetricDelta]:
    """Compute all the delta rows for the comparison table."""
    rows: list[MetricDelta] = []

    rows.append(_make_delta(
        "Total words", metrics_a.total_word_count, metrics_b.total_word_count,
        threshold_key="word_count_pct",
        fmt=lambda v: f"{int(v)}" if v is not None else "—",
        delta_fmt=lambda a, b: f"{int(b - a):+d} ({_delta_pct(a, b):+.0f}%)",
        interpretation="tighter scripts read faster, but lose content density if cut too far",
    ))

    rows.append(_make_delta(
        "Total runtime (est)", metrics_a.total_runtime_sec, metrics_b.total_runtime_sec,
        threshold_key="runtime_sec",
        fmt=_fmt_mmss,
        delta_fmt=lambda a, b: f"{b - a:+.0f}s",
        interpretation="under target = more breathing room; over target = pacing risk",
    ))

    rows.append(_make_delta(
        "Hook position", metrics_a.hook_position_sec, metrics_b.hook_position_sec,
        threshold_key="hook_position_sec",
        fmt=_fmt_sec,
        delta_fmt=lambda a, b: f"{b - a:+.0f}s",
        interpretation="research target: ≤15s. Earlier = stronger cold-open hook.",
    ))

    rows.append(_make_delta(
        "Pattern interrupts/min", metrics_a.pattern_interrupts_per_min,
        metrics_b.pattern_interrupts_per_min,
        threshold_key="pattern_interrupts_per_min",
        fmt=lambda v: f"{v:.1f}/min" if v is not None else "—",
        delta_fmt=lambda a, b: f"{b - a:+.1f}/min",
        interpretation="research target: ~7.5/min (visual change every 8s)",
    ))

    rows.append(_make_delta(
        "Total bridge sentences", metrics_a.total_bridge_count, metrics_b.total_bridge_count,
        threshold_key="bridge_count",
        fmt=lambda v: f"{int(v)}" if v is not None else "—",
        delta_fmt=lambda a, b: f"{int(b - a):+d}",
        interpretation="mid-act transition smoothness; more = less lecture-y",
    ))

    rows.append(_make_delta(
        "Direct-address density (/100w)", metrics_a.total_direct_address_per_100w,
        metrics_b.total_direct_address_per_100w,
        threshold_key="direct_address_per_100w",
        fmt=lambda v: f"{v:.2f}" if v is not None else "—",
        delta_fmt=lambda a, b: f"{b - a:+.2f}",
        interpretation="you/we/us tokens — viewer activation signal",
    ))

    rows.append(_make_delta(
        "Caveat density (/1000w)", metrics_a.total_caveat_density_per_1000w,
        metrics_b.total_caveat_density_per_1000w,
        threshold_key="caveat_per_1000w",
        fmt=lambda v: f"{v:.2f}" if v is not None else "—",
        delta_fmt=lambda a, b: f"{b - a:+.2f}",
        interpretation="bounded-analogy doctrine — too few = unhedged, too many = wishy-washy",
    ))

    rows.append(_make_delta(
        "Pivot detected", float(metrics_a.has_pivot_signal),
        float(metrics_b.has_pivot_signal),
        threshold_key="hook_position_sec",  # not really meaningful, just binary
        fmt=lambda v: "✓" if v == 1.0 else "✗" if v == 0.0 else "—",
        delta_fmt=lambda a, b: (
            "(no change)" if a == b else
            "GAINED pivot" if b > a else "LOST pivot"
        ),
        interpretation="misconception-first signature in cold open (Veritasium pattern)",
    ))

    return rows


def compare_per_beat(
    a: em.EngagementMetrics, b: em.EngagementMetrics,
) -> list[tuple[em.BeatMetrics, em.BeatMetrics, dict[str, str]]]:
    """For each pair of beats at matching index, return per-beat deltas.

    Both scripts must have the same beat count for the comparison to be
    meaningful. If they don't, we zip up to the shorter and flag the
    mismatch in the report.
    """
    pairs: list[tuple[em.BeatMetrics, em.BeatMetrics, dict[str, str]]] = []
    for ba, bb in zip(a.beats, b.beats):
        deltas = {
            "word_count": f"{bb.word_count - ba.word_count:+d}",
            "runtime": f"{bb.estimated_runtime_sec - ba.estimated_runtime_sec:+.0f}s",
            "bridges": f"{bb.bridge_sentence_count - ba.bridge_sentence_count:+d}",
            "direct_address": f"{bb.direct_address_count - ba.direct_address_count:+d}",
            "caveats": f"{bb.caveat_count - ba.caveat_count:+d}",
            "proper_nouns": f"{bb.proper_noun_candidate_count - ba.proper_noun_candidate_count:+d}",
            "mean_sent_len": f"{bb.sentence_length_mean - ba.sentence_length_mean:+.1f}",
        }
        pairs.append((ba, bb, deltas))
    return pairs


# ── Rendering ────────────────────────────────────────────────────────────────


def render_diff_md(
    metrics_a: em.EngagementMetrics, metrics_b: em.EngagementMetrics,
    name_a: str = "A", name_b: str = "B",
) -> str:
    deltas = compare(metrics_a, metrics_b)
    significant = [d for d in deltas if d.significant]

    lines: list[str] = [
        f"# Script Diff — {name_a} vs {name_b}",
        "",
        f"**Baseline (A):** `{Path(metrics_a.script_path).name}` ({metrics_a.total_word_count} words)",
        f"**Compared (B):** `{Path(metrics_b.script_path).name}` ({metrics_b.total_word_count} words)",
        "",
        f"**{len(significant)} of {len(deltas)} metrics show material delta.**",
        "",
        "## Headline deltas",
        "",
        "| Metric | " + name_a + " | " + name_b + " | Δ |  | What it means |",
        "|---|---|---|---|---|---|",
    ]

    for d in deltas:
        marker = "**" if d.significant else ""
        lines.append(
            f"| {marker}{d.name}{marker} | {d.value_a} | {d.value_b} | "
            f"{d.delta} | {d.direction} | _{d.interpretation}_ |"
        )

    lines.append("")
    lines.append("## Per-beat breakdown")
    lines.append("")

    if metrics_a.beat_count != metrics_b.beat_count:
        lines.append(
            f"⚠ **Beat count differs:** {name_a} = {metrics_a.beat_count}, "
            f"{name_b} = {metrics_b.beat_count}. Comparison limited to overlapping beats."
        )
        lines.append("")

    per_beat = compare_per_beat(metrics_a, metrics_b)
    for ba, bb, deltas_dict in per_beat:
        lines.append(f"### Beat {ba.number}: _{ba.title[:60]}_")
        lines.append("")
        lines.append("| Metric | " + name_a + " | " + name_b + " | Δ |")
        lines.append("|---|---|---|---|")
        lines.append(f"| Words | {ba.word_count} | {bb.word_count} | {deltas_dict['word_count']} |")
        lines.append(
            f"| Runtime | {_fmt_mmss(ba.estimated_runtime_sec)} | "
            f"{_fmt_mmss(bb.estimated_runtime_sec)} | {deltas_dict['runtime']} |"
        )
        lines.append(
            f"| Bridge sentences | {ba.bridge_sentence_count} | "
            f"{bb.bridge_sentence_count} | {deltas_dict['bridges']} |"
        )
        lines.append(
            f"| Direct-address tokens | {ba.direct_address_count} | "
            f"{bb.direct_address_count} | {deltas_dict['direct_address']} |"
        )
        lines.append(
            f"| Caveats | {ba.caveat_count} | {bb.caveat_count} | {deltas_dict['caveats']} |"
        )
        lines.append(
            f"| Proper nouns | {ba.proper_noun_candidate_count} | "
            f"{bb.proper_noun_candidate_count} | {deltas_dict['proper_nouns']} |"
        )
        lines.append(
            f"| Mean sentence length | {ba.sentence_length_mean:.1f} | "
            f"{bb.sentence_length_mean:.1f} | {deltas_dict['mean_sent_len']} |"
        )
        lines.append("")

    lines.extend([
        "---",
        "",
        "## How to read this",
        "",
        "These metrics are CORRELATES of engagement, not engagement itself. ",
        "Material deltas (bold rows) flag where the two versions differ in ",
        "ways that engagement research suggests matter. The interpretation column ",
        "says what direction is usually better — but \"usually\" is doing a lot of ",
        "work. Only published retention data can decide which version actually ",
        "engages your specific audience.",
        "",
        "Use this diff to:",
        "1. **Catch unintended deltas.** If your rewrite was supposed to improve hook ",
        "   position but didn't, the table tells you.",
        "2. **Calibrate metrics post-publish.** After episode publishes, compare ",
        "   actual retention against predicted deltas. Build up a per-channel ",
        "   correlation table.",
        "3. **Resist recency bias.** If the new version looks better in your head ",
        "   but the metrics say it's strictly equivalent, your head might be wrong.",
        "",
        "For BLIND comparison (recency-bias removed), pair this with ",
        "`blind_review.py` — that tool strips version labels and presents both ",
        "versions to a reviewer without telling them which is which.",
    ])
    return "\n".join(lines) + "\n"


# ── CLI ──────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("script_a", help="Baseline script path.")
    parser.add_argument("script_b", help="Compared script path.")
    parser.add_argument(
        "--names", nargs=2, metavar=("NAME_A", "NAME_B"),
        help="Display names for the two scripts (default: filename stems).",
    )
    parser.add_argument(
        "--wpm", type=int, default=em.DEFAULT_WPM,
        help=f"Words-per-minute for runtime estimates (default: {em.DEFAULT_WPM}).",
    )
    parser.add_argument("-o", "--output", help="Output path (default: stdout-only).")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout.")
    args = parser.parse_args()

    path_a = Path(args.script_a).resolve()
    path_b = Path(args.script_b).resolve()
    for p in (path_a, path_b):
        if not p.is_file():
            print(f"✗ script not found: {p}", file=sys.stderr)
            return 2

    name_a = args.names[0] if args.names else path_a.stem
    name_b = args.names[1] if args.names else path_b.stem

    metrics_a = em.compute_engagement_metrics(path_a, wpm=args.wpm)
    metrics_b = em.compute_engagement_metrics(path_b, wpm=args.wpm)
    rendered = render_diff_md(metrics_a, metrics_b, name_a=name_a, name_b=name_b)

    if args.stdout:
        sys.stdout.write(rendered)
        return 0

    if args.output:
        out_path = Path(args.output).resolve()
    else:
        # No output specified, no --stdout — print to stdout by default
        # since this is a comparison tool, not a per-episode artifact.
        sys.stdout.write(rendered)
        return 0

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(rendered, encoding="utf-8")
    rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
    print(f"✓ wrote {rel}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
