#!/usr/bin/env python3
"""
prediction_tracker.py — track production predictions vs actuals over time.

Every episode generates predictions BEFORE publish (persona-eval, script-
audit, visual-spec): "we expect avg view duration ~58%, CTR ~4.5%, Marcus
to engage 7/10." After publish, retention + Studio data tells us what
actually happened. Without a tracker, the calibration drift across
episodes is impossible to see — every retrospective is one-off and
"prediction accuracy" stays anecdotal.

This tool stores per-episode predictions in
`episodes/<slug>/predictions.json` and per-episode actuals in
`episodes/<slug>/actuals.json` (when they land). It computes per-
prediction deltas and aggregates calibration drift across all episodes:

  · "persona-eval over-predicts Marcus by 14% on average across N episodes"
  · "script-audit runtime estimates land within ±5% in 8/10 episodes"
  · "predicted hook-strength scores correlate r=0.61 with actual minute-3 retention"

Two modes:

  RECORD (single episode):
    python3 tools/learn/prediction_tracker.py record <slug> \\
        --field expected_runtime_sec --value 770

    python3 tools/learn/prediction_tracker.py actual <slug> \\
        --field actual_runtime_sec --value 812

  REPORT (calibration across all episodes):
    python3 tools/learn/prediction_tracker.py report
    python3 tools/learn/prediction_tracker.py report --slug prisoners-dilemma
    python3 tools/learn/prediction_tracker.py report --json

Exit codes:
    0 — operation succeeded
    1 — calibration drift exceeds --drift-threshold AND --strict
    2 — usage error
"""

from __future__ import annotations

import argparse
import datetime
import json
import os
import statistics
import sys
import tempfile
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"

# ── Tunables ─────────────────────────────────────────────────────────────────

# Drift threshold for the calibration report. A field whose mean |delta|
# exceeds this percentage warrants attention — the production prediction
# for that field is systematically off.
DEFAULT_DRIFT_THRESHOLD_PCT = 15.0

# Known field-pair mappings. Used as a hint, NOT a strict requirement:
# new fields following the `expected_<X>` ↔ `actual_<X>` naming
# convention are auto-paired without code changes via
# `auto_pair_fields()` below. This list documents the canonical fields
# we expect the publish-retro skill to track.
DEFAULT_FIELD_PAIRS = {
    "expected_runtime_sec": "actual_runtime_sec",
    "expected_avg_view_duration_pct": "actual_avg_view_duration_pct",
    "expected_ctr_pct": "actual_ctr_pct",
    "expected_hook_retention_pct": "actual_hook_retention_pct",
}


def auto_pair_fields(predictions: dict, actuals: dict) -> dict[str, str]:
    """Pair predicted/actual fields by naming convention. Any field
    starting with `expected_` is paired with the corresponding `actual_`
    field if present. This means new prediction dimensions added by
    upstream skills (persona engagement, retention thresholds, etc.)
    work without code changes here.

    Falls back to DEFAULT_FIELD_PAIRS for any non-conventional pairs.
    """
    pairs = dict(DEFAULT_FIELD_PAIRS)
    for pred_field in predictions:
        if not pred_field.startswith("expected_"):
            continue
        actual_field = "actual_" + pred_field[len("expected_"):]
        if actual_field in actuals:
            pairs[pred_field] = actual_field
    return pairs


def _is_known_field(field_name: str) -> bool:
    """A field is recognized if it follows the `expected_<X>` or
    `actual_<X>` convention OR appears in DEFAULT_FIELD_PAIRS."""
    if field_name in DEFAULT_FIELD_PAIRS:
        return True
    if field_name in DEFAULT_FIELD_PAIRS.values():
        return True
    return field_name.startswith("expected_") or field_name.startswith("actual_")


# ── Data shapes ──────────────────────────────────────────────────────────────


@dataclass
class FieldDelta:
    """One field's predicted vs actual comparison."""
    field: str
    predicted: float
    actual: float
    delta_abs: float                # actual - predicted
    delta_pct: float                # 100 * (actual - predicted) / predicted

    def within_threshold(self, threshold_pct: float) -> bool:
        return abs(self.delta_pct) <= threshold_pct

    @property
    def within_15pct(self) -> bool:
        """Legacy convenience — checks the default 15pct band."""
        return self.within_threshold(DEFAULT_DRIFT_THRESHOLD_PCT)


@dataclass
class EpisodeCalibration:
    """All predicted vs actual deltas for one episode."""
    slug: str
    predicted_at: str = ""
    actual_at: str = ""
    deltas: list[FieldDelta] = field(default_factory=list)


@dataclass
class FieldCalibration:
    """Calibration summary for one prediction field across all episodes."""
    field: str
    sample_count: int               # how many episodes have BOTH pred+actual
    mean_delta_pct: float           # signed mean (negative = over-predicted)
    abs_mean_delta_pct: float
    within_threshold_count: int     # count within the configured threshold
    threshold_pct: float = DEFAULT_DRIFT_THRESHOLD_PCT

    @property
    def within_15pct_count(self) -> int:
        """Legacy alias — preserved for back-compat with older callers."""
        return self.within_threshold_count


@dataclass
class CalibrationReport:
    episode_calibrations: list[EpisodeCalibration] = field(default_factory=list)
    field_summaries: list[FieldCalibration] = field(default_factory=list)


# ── File helpers ────────────────────────────────────────────────────────────


def _predictions_path(slug: str) -> Path:
    return EPISODES_DIR / slug / "predictions.json"


def _actuals_path(slug: str) -> Path:
    return EPISODES_DIR / slug / "actuals.json"


def _load_or_init(path: Path, default_slug: str = "") -> dict:
    """Read a JSON file, or return a fresh skeleton if it doesn't exist."""
    if path.is_file():
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return {"slug": default_slug}
    return {"slug": default_slug}


def _save(path: Path, data: dict) -> None:
    """Atomic write: tempfile + os.replace so a crash mid-write doesn't
    corrupt the file, and a concurrent read sees only the old or new
    contents (never a partial). Doesn't prevent the read-modify-write
    race between two concurrent callers — for that the operator needs
    to serialize record/actual calls."""
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = json.dumps(data, indent=2)
    fd, tmp = tempfile.mkstemp(
        dir=str(path.parent), prefix=f".{path.name}.", suffix=".tmp",
    )
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(payload)
        os.replace(tmp, path)
    except Exception:
        if os.path.exists(tmp):
            os.unlink(tmp)
        raise


# ── Record / actual ────────────────────────────────────────────────────────


def record_prediction(
    slug: str, field_name: str, value, recorded_at: Optional[str] = None,
) -> Path:
    """Save (or update) a single predicted field for an episode.

    Warns to stderr when the field name doesn't follow the
    `expected_<X>` convention — likely a typo (e.g. `expectde_runtime`)
    that would otherwise orphan the value (never paired with any actual,
    invisible in the calibration report).
    """
    if not _is_known_field(field_name):
        print(
            f"⚠ prediction_tracker: field '{field_name}' doesn't follow "
            f"the `expected_<X>` / `actual_<X>` naming convention — "
            f"calibration report won't pair it with an actual. Typo?",
            file=sys.stderr,
        )
    path = _predictions_path(slug)
    data = _load_or_init(path, default_slug=slug)
    data.setdefault("slug", slug)
    data.setdefault("predicted_at", recorded_at or datetime.date.today().isoformat())
    data.setdefault("predictions", {})
    data["predictions"][field_name] = value
    _save(path, data)
    return path


def record_actual(
    slug: str, field_name: str, value, recorded_at: Optional[str] = None,
) -> Path:
    """Save (or update) a single actual field for an episode."""
    if not _is_known_field(field_name):
        print(
            f"⚠ prediction_tracker: field '{field_name}' doesn't follow "
            f"the `expected_<X>` / `actual_<X>` naming convention — "
            f"calibration report won't pair it with a prediction. Typo?",
            file=sys.stderr,
        )
    path = _actuals_path(slug)
    data = _load_or_init(path, default_slug=slug)
    data.setdefault("slug", slug)
    data.setdefault("actual_at", recorded_at or datetime.date.today().isoformat())
    data.setdefault("actuals", {})
    data["actuals"][field_name] = value
    _save(path, data)
    return path


# ── Calibration computation ────────────────────────────────────────────────


def compute_episode_calibration(
    slug: str, field_pairs: Optional[dict[str, str]] = None,
) -> EpisodeCalibration:
    """For one episode, compute deltas between every predicted/actual pair.

    If `field_pairs` is None, auto-pair via the `expected_<X>` ↔
    `actual_<X>` naming convention so any new prediction dimension
    works without a code change here.
    """
    pred_data = _load_or_init(_predictions_path(slug))
    actual_data = _load_or_init(_actuals_path(slug))
    predictions = pred_data.get("predictions", {})
    actuals = actual_data.get("actuals", {})
    if field_pairs is None:
        field_pairs = auto_pair_fields(predictions, actuals)

    deltas: list[FieldDelta] = []
    for pred_field, actual_field in field_pairs.items():
        if pred_field not in predictions or actual_field not in actuals:
            continue
        try:
            p = float(predictions[pred_field])
            a = float(actuals[actual_field])
        except (TypeError, ValueError):
            continue
        if p == 0:
            continue  # avoid /0
        delta_abs = a - p
        delta_pct = 100.0 * (a - p) / p
        deltas.append(FieldDelta(
            field=pred_field, predicted=p, actual=a,
            delta_abs=round(delta_abs, 2),
            delta_pct=round(delta_pct, 2),
        ))

    return EpisodeCalibration(
        slug=slug,
        predicted_at=pred_data.get("predicted_at", ""),
        actual_at=actual_data.get("actual_at", ""),
        deltas=deltas,
    )


def compute_field_summary(
    field_name: str, episode_calibrations: list[EpisodeCalibration],
    threshold_pct: float = DEFAULT_DRIFT_THRESHOLD_PCT,
) -> FieldCalibration:
    """For one prediction field, aggregate across all episodes that have
    BOTH predicted and actual values. The `within_threshold_count` honors
    the passed `threshold_pct` (was previously hardcoded to 15)."""
    deltas = [
        d.delta_pct for c in episode_calibrations
        for d in c.deltas if d.field == field_name
    ]
    if not deltas:
        return FieldCalibration(
            field=field_name, sample_count=0,
            mean_delta_pct=0.0, abs_mean_delta_pct=0.0,
            within_threshold_count=0, threshold_pct=threshold_pct,
        )
    return FieldCalibration(
        field=field_name,
        sample_count=len(deltas),
        mean_delta_pct=round(statistics.mean(deltas), 2),
        abs_mean_delta_pct=round(statistics.mean(abs(d) for d in deltas), 2),
        within_threshold_count=sum(1 for d in deltas if abs(d) <= threshold_pct),
        threshold_pct=threshold_pct,
    )


def build_calibration_report(
    slug_filter: Optional[str] = None,
    field_pairs: Optional[dict[str, str]] = None,
    threshold_pct: float = DEFAULT_DRIFT_THRESHOLD_PCT,
) -> CalibrationReport:
    """Walk every episode that has BOTH predictions.json and actuals.json
    (or only a single slug, when filtered), compute per-episode deltas
    and per-field summaries."""
    episode_calibrations: list[EpisodeCalibration] = []
    if slug_filter:
        slugs: list[str] = [slug_filter]
    else:
        # Discover episodes that have any predictions or actuals file
        slugs = sorted({
            p.parent.name
            for p in EPISODES_DIR.glob("*/predictions.json")
        } | {
            p.parent.name
            for p in EPISODES_DIR.glob("*/actuals.json")
        })

    # Determine the union of all pred fields across episodes so the
    # summary covers fields beyond DEFAULT_FIELD_PAIRS.
    all_fields: set[str] = set()
    for slug in slugs:
        cal = compute_episode_calibration(slug, field_pairs)
        if cal.deltas or slug_filter:
            episode_calibrations.append(cal)
        for d in cal.deltas:
            all_fields.add(d.field)
    # Always include the canonical defaults so the report still shows
    # zero-sample placeholders for the standard fields.
    all_fields.update(DEFAULT_FIELD_PAIRS.keys())

    field_summaries = [
        compute_field_summary(field_name, episode_calibrations, threshold_pct)
        for field_name in sorted(all_fields)
    ]
    return CalibrationReport(
        episode_calibrations=episode_calibrations,
        field_summaries=field_summaries,
    )


# ── Rendering ───────────────────────────────────────────────────────────────


def render_report_md(
    report: CalibrationReport, drift_threshold_pct: float = DEFAULT_DRIFT_THRESHOLD_PCT,
) -> str:
    th = drift_threshold_pct
    lines = [
        "# Prediction Calibration Report",
        "",
        "_Tracks how the production pipeline's predictions land against "
        "actuals over time. Per-field calibration drift surfaces which "
        "predictions are systematically off so the upstream skill (persona-"
        "eval / script-audit / visual-spec) can be tuned._",
        "",
        f"**Episodes with both predicted + actual data:** "
        f"{len(report.episode_calibrations)}",
        f"**Drift threshold:** ±{th:.0f}%",
        "",
        "## Per-field calibration summary",
        "",
        f"| Field | Sample N | Mean Δ% | |Mean Δ%| | Within ±{th:.0f}% |",
        "|---|---|---|---|---|",
    ]
    for s in report.field_summaries:
        ratio = (
            f"{s.within_threshold_count}/{s.sample_count}"
            if s.sample_count > 0 else "—"
        )
        # Use a marker for drifts past threshold to make the report scannable
        marker = "⚠" if s.abs_mean_delta_pct > th else ""
        lines.append(
            f"| `{s.field}` | {s.sample_count} | "
            f"{s.mean_delta_pct:+.1f}% {marker}| "
            f"{s.abs_mean_delta_pct:.1f}% | {ratio} |"
        )
    lines.extend(["", "## Per-episode deltas", ""])
    for cal in report.episode_calibrations:
        lines.append(f"### {cal.slug}")
        if not cal.deltas:
            lines.append("_No matched prediction+actual fields._")
        else:
            lines.append("")
            lines.append("| Field | Predicted | Actual | Δ | Δ% |")
            lines.append("|---|---|---|---|---|")
            for d in cal.deltas:
                marker = "✓" if d.within_threshold(th) else "⚠"
                lines.append(
                    f"| `{d.field}` | {d.predicted:.1f} | {d.actual:.1f} | "
                    f"{d.delta_abs:+.1f} | {d.delta_pct:+.1f}% {marker} |"
                )
        lines.append("")
    lines.extend([
        "---",
        "",
        "_Run: `python3 tools/learn/prediction_tracker.py report`_",
        "",
    ])
    return "\n".join(lines)


# ── CLI ─────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    sub = parser.add_subparsers(dest="cmd", required=True)

    # record
    p_record = sub.add_parser("record", help="Save a predicted value.")
    p_record.add_argument("slug")
    p_record.add_argument("--field", required=True)
    p_record.add_argument("--value", required=True)

    # actual
    p_actual = sub.add_parser("actual", help="Save an actual value.")
    p_actual.add_argument("slug")
    p_actual.add_argument("--field", required=True)
    p_actual.add_argument("--value", required=True)

    # report
    p_report = sub.add_parser("report", help="Calibration report across episodes.")
    p_report.add_argument("--slug", help="Limit to one episode.")
    p_report.add_argument("--json", action="store_true")
    p_report.add_argument("--stdout", action="store_true")
    p_report.add_argument("-o", "--output", help="Write report to file.")
    p_report.add_argument(
        "--strict", action="store_true",
        help="Exit 1 if any field's |mean Δ%%| exceeds --drift-threshold.",
    )
    p_report.add_argument(
        "--drift-threshold", type=float, default=DEFAULT_DRIFT_THRESHOLD_PCT,
        help=f"Drift threshold for --strict (default {DEFAULT_DRIFT_THRESHOLD_PCT}%%).",
    )

    args = parser.parse_args()

    if args.cmd == "record":
        # Try to parse value as number; fall back to string
        try:
            value = float(args.value)
        except ValueError:
            value = args.value
        path = record_prediction(args.slug, args.field, value)
        rel = path.relative_to(ROOT) if path.is_relative_to(ROOT) else path
        print(f"✓ recorded prediction → {rel}", file=sys.stderr)
        return 0

    if args.cmd == "actual":
        try:
            value = float(args.value)
        except ValueError:
            value = args.value
        path = record_actual(args.slug, args.field, value)
        rel = path.relative_to(ROOT) if path.is_relative_to(ROOT) else path
        print(f"✓ recorded actual → {rel}", file=sys.stderr)
        return 0

    if args.cmd == "report":
        report = build_calibration_report(
            slug_filter=args.slug, threshold_pct=args.drift_threshold,
        )
        if args.json:
            out = json.dumps({
                "episode_calibrations": [
                    {
                        "slug": c.slug,
                        "predicted_at": c.predicted_at,
                        "actual_at": c.actual_at,
                        "deltas": [asdict(d) for d in c.deltas],
                    }
                    for c in report.episode_calibrations
                ],
                "field_summaries": [asdict(s) for s in report.field_summaries],
            }, indent=2)
        else:
            out = render_report_md(report, drift_threshold_pct=args.drift_threshold)

        if args.stdout or not args.output:
            sys.stdout.write(out)
        if args.output:
            out_path = Path(args.output).resolve()
            out_path.parent.mkdir(parents=True, exist_ok=True)
            out_path.write_text(out, encoding="utf-8")
            rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
            if not args.stdout:
                print(f"✓ wrote {rel}", file=sys.stderr)

        if args.strict:
            for s in report.field_summaries:
                if s.sample_count > 0 and s.abs_mean_delta_pct > args.drift_threshold:
                    return 1
        return 0

    return 2


if __name__ == "__main__":
    sys.exit(main())
