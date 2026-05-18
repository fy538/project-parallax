#!/usr/bin/env python3
"""
analytics_ingest.py — parse YouTube Analytics + map retention to beats.

`publish-retro` skill consumes YouTube Studio analytics manually (paste
into Claude). This tool handles the structured-data path: read a CSV
exported from YouTube Studio's retention graph, map drops to the
episode's beat boundaries via the assembly manifest, and emit a
findings report the publish-retro skill can ingest directly.

What the tool produces per drop:
  · Time of drop (seconds, M:SS, and percentage-of-video)
  · Magnitude (percentage-point drop in audience retention)
  · Beat number + title at that moment
  · Severity classification (🟢 normal / 🟡 noticeable / 🔴 material)

YouTube's retention CSV export has two common shapes:
  1. Per-second: `Time (seconds), Audience retention (%)`
  2. Per-percent: `Video position (%), Audience retention (%)`
Both are handled — the parser detects which by column header.

Drop detection: a "drop" is a window where retention falls by ≥
`--drop-threshold` percentage points across `--window-sec` seconds
(default 3pp over 10s — surfaces the structural drops without
flagging the natural per-second jitter).

Usage:
    python3 tools/learn/analytics_ingest.py <slug> --csv retention.csv
    python3 tools/learn/analytics_ingest.py <slug> --csv retention.csv --json
    python3 tools/learn/analytics_ingest.py <slug> --csv retention.csv \\
        --drop-threshold 5 --window-sec 15

Exit codes:
    0 — drops analyzed (may be zero drops detected)
    1 — material drops found AND --strict
    2 — usage / missing inputs / CSV parse failure
"""

from __future__ import annotations

import argparse
import csv
import json
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from status_emoji import ERROR, OK, WARN  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"
REMOTION_DATA = ROOT / "remotion-templates" / "data" / "episodes"

# ── Tunables ─────────────────────────────────────────────────────────────────

# A drop is flagged when retention falls by ≥ this many percentage
# points across the rolling window. 3pp / 10s catches structural
# losses (a beat lost 3% of audience over 10 seconds) without flagging
# normal per-second jitter (±0.5-1pp is baseline noise).
DEFAULT_DROP_THRESHOLD_PP = 3.0
DEFAULT_WINDOW_SEC = 10.0

# Severity bands for individual drops.
DROP_SEVERITY_NOTICEABLE = 5.0   # ≥ 5pp in window = 🟡
DROP_SEVERITY_MATERIAL = 10.0    # ≥ 10pp in window = 🔴


# ── Data shapes ──────────────────────────────────────────────────────────────


@dataclass
class RetentionPoint:
    """One sample of audience retention."""
    time_sec: float
    retention_pct: float       # 0-100


@dataclass
class RetentionDrop:
    """A window where retention fell ≥ threshold percentage points."""
    start_sec: float
    end_sec: float
    start_retention_pct: float
    end_retention_pct: float
    beat_number: int | None = None
    beat_title: str = ""

    @property
    def drop_pp(self) -> float:
        return self.start_retention_pct - self.end_retention_pct

    @property
    def severity(self) -> str:
        if self.drop_pp >= DROP_SEVERITY_MATERIAL:
            return ERROR
        if self.drop_pp >= DROP_SEVERITY_NOTICEABLE:
            return WARN
        return OK


@dataclass
class RetentionReport:
    slug: str
    csv_path: str
    total_duration_sec: float
    average_retention_pct: float
    points: list[RetentionPoint] = field(default_factory=list)
    drops: list[RetentionDrop] = field(default_factory=list)

    @property
    def material_drops(self) -> list[RetentionDrop]:
        return [d for d in self.drops if d.drop_pp >= DROP_SEVERITY_MATERIAL]

    @property
    def noticeable_drops(self) -> list[RetentionDrop]:
        return [d for d in self.drops
                if DROP_SEVERITY_NOTICEABLE <= d.drop_pp < DROP_SEVERITY_MATERIAL]


# ── CSV parsing ─────────────────────────────────────────────────────────────


# Header substrings we recognize. YouTube's exports vary by locale and
# version; we match case-insensitively on common stems.
_TIME_HEADERS = ("time", "seconds", "second")
_POSITION_HEADERS = ("position", "percentage", "percent", "%")
_RETENTION_HEADERS = ("retention", "audience")


def _classify_header(headers: list[str]) -> tuple[int, int, str]:
    """Identify which columns are time + retention. Returns
    (time_col_idx, retention_col_idx, time_kind)
    where time_kind is 'seconds' or 'pct' depending on the header.

    Retention column is detected FIRST and excluded from the time-column
    search — otherwise "Audience retention (%)" would match the
    position-percent rule via the embedded '%' character.
    """
    retention_col = -1
    for i, h in enumerate(headers):
        h_low = h.strip().lower()
        if any(r in h_low for r in _RETENTION_HEADERS):
            retention_col = i
            break

    time_col = -1
    time_kind = "seconds"
    for i, h in enumerate(headers):
        if i == retention_col:
            continue
        h_low = h.strip().lower()
        if any(t in h_low for t in _POSITION_HEADERS):
            time_col = i
            time_kind = "pct"
            break
        if any(t in h_low for t in _TIME_HEADERS):
            time_col = i
            time_kind = "seconds"
            break

    if time_col < 0 or retention_col < 0:
        raise ValueError(
            f"Could not identify time / retention columns in headers: {headers}. "
            f"Expected one of {_TIME_HEADERS + _POSITION_HEADERS} for time "
            f"and one of {_RETENTION_HEADERS} for retention."
        )
    return time_col, retention_col, time_kind


def _read_csv_rows(csv_path: Path) -> list[list[str]]:
    """Read a CSV file with UTF-8 (BOM-tolerant) first, then UTF-16
    fallback. Studio exports on Windows-locale accounts sometimes ship
    UTF-16 LE with BOM; without the fallback the header row would parse
    as garbage and column classification would fail."""
    for encoding in ("utf-8-sig", "utf-16"):
        try:
            with csv_path.open(encoding=encoding) as fh:
                return list(csv.reader(fh))
        except UnicodeError:
            continue
    # Last resort: try without specifying encoding (Python default)
    with csv_path.open() as fh:
        return list(csv.reader(fh))


def parse_retention_csv(
    csv_path: Path, total_duration_sec: float,
) -> list[RetentionPoint]:
    """Parse a YouTube Analytics retention CSV. Returns time-sorted
    RetentionPoints normalized to seconds."""
    rows = _read_csv_rows(csv_path)
    if not rows:
        raise ValueError("CSV has no rows")
    # Skip blank header rows YouTube sometimes inserts
    while rows and not any(c.strip() for c in rows[0]):
        rows = rows[1:]
    if not rows:
        raise ValueError("CSV has no header row")
    headers = [c.strip() for c in rows[0]]
    time_col, retention_col, time_kind = _classify_header(headers)

    points: list[RetentionPoint] = []
    over_100_count = 0
    for row in rows[1:]:
        if len(row) <= max(time_col, retention_col):
            continue
        try:
            t_raw = float(row[time_col].replace("%", "").strip())
            r_raw = float(row[retention_col].replace("%", "").strip())
        except ValueError:
            continue
        # Normalize position-percentage to seconds when needed.
        if time_kind == "pct":
            if total_duration_sec <= 0:
                continue
            time_sec = (t_raw / 100.0) * total_duration_sec
        else:
            time_sec = t_raw
        if r_raw > 100:
            over_100_count += 1
            # Clamp so absolute retention bands work; the relative-retention
            # interpretation (audience grew via shares) would need a separate
            # column and is rare enough that flagging + clamping is safer
            # than silently treating "110%→95% loss" as a 15pp material drop.
            r_raw = min(r_raw, 100.0)
        points.append(RetentionPoint(time_sec=time_sec, retention_pct=r_raw))
    points.sort(key=lambda p: p.time_sec)
    if over_100_count:
        print(
            f"⚠ analytics_ingest: {over_100_count} retention value(s) > 100% "
            f"clamped — Studio may have exported relative (not absolute) "
            f"retention. Cross-check the source.",
            file=sys.stderr,
        )
    return points


# ── Drop detection ──────────────────────────────────────────────────────────


def detect_drops(
    points: list[RetentionPoint],
    threshold_pp: float = DEFAULT_DROP_THRESHOLD_PP,
    window_sec: float = DEFAULT_WINDOW_SEC,
) -> list[RetentionDrop]:
    """Walk the retention curve in non-overlapping `window_sec` windows;
    flag every window whose start→end fall is ≥ `threshold_pp`.

    Each window becomes its own drop event. A previous version merged
    "adjacent" drops (touching windows), but that collapsed a 40-second
    continuous decline into a single span and lost per-beat attribution
    — the operator wants "Beat 2 lost 8pp, Beat 3 lost 7pp" not "audience
    fell 20pp over 4 minutes". Separate events preserve the structural
    drop locations.

    Adjacent drops in the output are NOT merged; each window-sized event
    stands on its own and gets independently mapped to its beat.
    """
    if len(points) < 2:
        return []
    drops: list[RetentionDrop] = []
    i = 0
    n = len(points)
    while i < n:
        start = points[i]
        # Find the end-of-window point
        j = i + 1
        while j < n and points[j].time_sec - start.time_sec < window_sec:
            j += 1
        if j >= n:
            break
        end = points[j]
        drop_pp = start.retention_pct - end.retention_pct
        if drop_pp >= threshold_pp:
            drops.append(RetentionDrop(
                start_sec=start.time_sec, end_sec=end.time_sec,
                start_retention_pct=start.retention_pct,
                end_retention_pct=end.retention_pct,
            ))
        i = j
    return drops


# ── Beat-boundary mapping ───────────────────────────────────────────────────


def map_drops_to_beats(
    drops: list[RetentionDrop], manifest: dict,
) -> None:
    """Attach beat_number + beat_title to each drop (in-place)."""
    beats = manifest.get("beats", [])
    if not beats and drops:
        print(
            f"⚠ analytics_ingest: assembly manifest has no `beats[]` — "
            f"{len(drops)} drop(s) detected but unmapped to beats. "
            f"Run generate_manifest.py to populate beats.",
            file=sys.stderr,
        )
    for d in drops:
        # The drop's start time is the moment audience began leaving;
        # attribute to the beat that was on screen at start.
        for i, b in enumerate(beats, 1):
            start = float(b.get("startSec", 0))
            end = float(b.get("endSec", 0))
            if start <= d.start_sec < end:
                d.beat_number = i
                d.beat_title = b.get("title", "")
                break


# ── Top-level orchestration ────────────────────────────────────────────────


def _default_manifest_path(slug: str) -> Path:
    return REMOTION_DATA / slug / "assembly-manifest.json"


def load_manifest_duration(manifest_path: Path) -> float:
    """Read totalDurationSec from the assembly manifest. Returns 0 on
    missing field."""
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    return float(data.get("totalDurationSec", 0))


def ingest_analytics(
    slug: str, csv_path: Path, manifest_path: Path,
    threshold_pp: float = DEFAULT_DROP_THRESHOLD_PP,
    window_sec: float = DEFAULT_WINDOW_SEC,
) -> RetentionReport:
    """Full pipeline: parse CSV → detect drops → map to beats → return report."""
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    duration = float(manifest.get("totalDurationSec", 0))
    points = parse_retention_csv(csv_path, total_duration_sec=duration)
    drops = detect_drops(points, threshold_pp=threshold_pp, window_sec=window_sec)
    map_drops_to_beats(drops, manifest)
    avg = (
        sum(p.retention_pct for p in points) / len(points) if points else 0.0
    )
    return RetentionReport(
        slug=slug, csv_path=str(csv_path),
        total_duration_sec=duration,
        average_retention_pct=round(avg, 1),
        points=points, drops=drops,
    )


# ── Rendering ───────────────────────────────────────────────────────────────


def _fmt_mmss(sec: float) -> str:
    total = int(round(abs(sec)))
    return f"{total // 60}:{total % 60:02d}"


def render_report_md(report: RetentionReport) -> str:
    lines = [
        f"# Retention Analytics — {report.slug}",
        "",
        f"_Source: `{report.csv_path}` mapped against assembly-manifest "
        f"beat boundaries._",
        "",
        "## Overview",
        "",
        f"- **Duration:** {_fmt_mmss(report.total_duration_sec)}",
        f"- **Samples:** {len(report.points)}",
        f"- **Average retention:** {report.average_retention_pct:.1f}%",
        f"- **Detected drops:** {len(report.drops)} "
        f"({len(report.material_drops)} {ERROR}, "
        f"{len(report.noticeable_drops)} {WARN})",
        "",
    ]
    if not report.drops:
        lines.extend([
            "## ✅ No significant drops",
            "",
            "_Retention curve is within the configured threshold throughout. "
            "Try `--drop-threshold 2` to see smaller variations._",
            "",
        ])
    else:
        lines.append("## Drop events")
        lines.append("")
        lines.append("| # | Time | Drop | From → To | Beat | Severity |")
        lines.append("|---|---|---|---|---|---|")
        for i, d in enumerate(report.drops, 1):
            beat = (
                f"Beat {d.beat_number}: _{d.beat_title[:30]}_"
                if d.beat_number else "—"
            )
            lines.append(
                f"| {i} | {_fmt_mmss(d.start_sec)}–{_fmt_mmss(d.end_sec)} | "
                f"{d.drop_pp:.1f}pp | "
                f"{d.start_retention_pct:.0f}% → {d.end_retention_pct:.0f}% | "
                f"{beat} | {d.severity} |"
            )
        lines.append("")
        lines.append("## Drop detail")
        lines.append("")
        for i, d in enumerate(report.drops, 1):
            lines.extend([
                f"### {d.severity} Drop {i} — {_fmt_mmss(d.start_sec)} "
                f"({d.drop_pp:.1f}pp loss)",
                "",
                f"- **Window:** {_fmt_mmss(d.start_sec)} → {_fmt_mmss(d.end_sec)}",
                f"- **Retention:** {d.start_retention_pct:.1f}% → "
                f"{d.end_retention_pct:.1f}%",
                f"- **Beat:** {d.beat_number or 'unknown'}" + (
                    f" — _{d.beat_title}_" if d.beat_title else ""
                ),
                "",
                "_Cross-reference with the script + visual-spec for this beat "
                "to identify what the viewer encountered when they left._",
                "",
            ])
    lines.extend([
        "---",
        "",
        f"_Run: `python3 tools/learn/analytics_ingest.py {report.slug} --csv <file>`_",
        "",
    ])
    return "\n".join(lines)


# ── CLI ─────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", help="Episode slug.")
    parser.add_argument("--csv", required=True, help="YouTube Analytics retention CSV path.")
    parser.add_argument(
        "--manifest", help="Explicit assembly manifest path.",
    )
    parser.add_argument(
        "--drop-threshold", type=float, default=DEFAULT_DROP_THRESHOLD_PP,
        help=f"Percentage-point drop within window to flag (default "
             f"{DEFAULT_DROP_THRESHOLD_PP}).",
    )
    parser.add_argument(
        "--window-sec", type=float, default=DEFAULT_WINDOW_SEC,
        help=f"Window size in seconds (default {DEFAULT_WINDOW_SEC}).",
    )
    parser.add_argument(
        "--strict", action="store_true",
        help="Exit 1 if any material (≥ 10pp) drop detected.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON.")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout.")
    parser.add_argument("-o", "--output", help="Write report to file.")
    args = parser.parse_args()

    csv_path = Path(args.csv).resolve()
    if not csv_path.is_file():
        print(f"✗ CSV not found: {csv_path}", file=sys.stderr)
        return 2

    manifest_path = (
        Path(args.manifest).resolve() if args.manifest
        else _default_manifest_path(args.slug)
    )
    if not manifest_path.is_file():
        print(f"✗ assembly manifest not found: {manifest_path}", file=sys.stderr)
        return 2

    try:
        report = ingest_analytics(
            args.slug, csv_path, manifest_path,
            threshold_pp=args.drop_threshold,
            window_sec=args.window_sec,
        )
    except (ValueError, json.JSONDecodeError) as e:
        print(f"✗ ingest failed: {type(e).__name__}: {e}", file=sys.stderr)
        return 2

    if args.json:
        # Include the full points[] series — downstream tools
        # (learning_log per-third averages, prediction_tracker hook
        # retention) rely on it. Pre-fix the JSON only emitted
        # sample_count and learning_log silently degraded to "unknown"
        # trajectory.
        out = json.dumps({
            "slug": report.slug, "csv_path": report.csv_path,
            "total_duration_sec": report.total_duration_sec,
            "average_retention_pct": report.average_retention_pct,
            "drops": [asdict(d) for d in report.drops],
            "sample_count": len(report.points),
            "points": [asdict(p) for p in report.points],
        }, indent=2)
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

    if args.strict and report.material_drops:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
