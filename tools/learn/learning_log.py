#!/usr/bin/env python3
"""
learning_log.py — pre-populate a LEARNING_LOG.md entry from retention + script.

The publish-retro skill writes the retrospective by hand (or via LLM)
after every episode. This tool pre-populates the structural sections
the skill defines (Top Findings derived from retention drops, Retention
Profile derived from per-third averages, Visual Effectiveness from
drop-to-beat mapping) so the skill / operator only has to fill in the
editorial sections (Persona Prediction Accuracy, Next Episode Hypothesis).

Pre-populates per `episodes/LEARNING_LOG.md` template:

  · Top Findings (1-3 from material retention drops)
  · Retention Profile (hook minute / mid-video / closing third averages)
  · Visual Effectiveness Winners (beats with biggest +/- retention deltas)
  · Persona Prediction Accuracy (placeholders — needs persona-eval-report.md)
  · Prediction Feedback (placeholder)
  · Next Episode Hypothesis (placeholder)

The entry is APPENDED to `episodes/LEARNING_LOG.md` (after the marker
the file uses) — never overwrites prior entries. Re-runnable: a second
run with the same slug prompts to confirm replace vs. skip.

Usage:
    python3 tools/learn/learning_log.py <slug> \\
        --retention retention-report.json \\
        --published-at 2026-06-01

    python3 tools/learn/learning_log.py <slug> \\
        --retention retention-report.json --dry-run

Exit codes:
    0 — entry generated (or dry-run printed)
    1 — slug already has an entry AND --no-overwrite (default)
    2 — usage / missing inputs
"""

from __future__ import annotations

import argparse
import datetime
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"
LEARNING_LOG_PATH = EPISODES_DIR / "LEARNING_LOG.md"
REMOTION_DATA = ROOT / "remotion-templates" / "data" / "episodes"

# ── Tunables ─────────────────────────────────────────────────────────────────

# Retention band cutoffs match what YouTube Studio surfaces directly
# (Hook = first 30s, Engagement = first 3 min, Body = the rest). Per-
# third segmentation was the v1 default but it conflicted with the
# bands the operator sees in Studio, making the LEARNING_LOG numbers
# hard to cross-reference.
HOOK_END_SEC = 30.0
ENGAGEMENT_END_SEC = 180.0   # 3 min — Studio's "Engagement" band

# Number of findings to extract from material drops. publish-retro
# spec asks for "Top 3 Findings" so we cap there.
MAX_FINDINGS = 3

# Marker that publish-retro entries are inserted at the END of (the
# "No episodes published yet" placeholder gets replaced once any entry
# lands, but subsequent entries append before the HTML comment template).
_EMPTY_LOG_MARKER = "*No episodes published yet."
_TEMPLATE_COMMENT_MARKER = "<!--\nTemplate for each episode entry"


# ── Data shapes ──────────────────────────────────────────────────────────────


@dataclass
class RetentionProfile:
    """Per-band retention averages (Studio-aligned bands)."""
    hook_third_avg: float          # 0-100, average across 0-30s (the Hook band)
    mid_third_avg: float           # 30s-3min (Studio's Engagement band)
    closing_third_avg: float       # 3min-end (Body band)
    trajectory: str                # "climbing" | "flat" | "descending" | "volatile"


@dataclass
class FindingPoint:
    """One material finding for the Top Findings section."""
    summary: str
    detail: str = ""


@dataclass
class VisualEffectivenessNote:
    """One beat with a notable retention impact."""
    beat_number: int
    beat_title: str
    direction: str       # "+" | "-"
    pp_delta: float
    moment: str          # M:SS
    template_hints: list[str] = field(default_factory=list)


@dataclass
class LogEntryPayload:
    slug: str
    episode_title: str
    publish_date: str
    analysis_date: str
    days_live: int
    retention_profile: RetentionProfile
    findings: list[FindingPoint] = field(default_factory=list)
    visual_winners: list[VisualEffectivenessNote] = field(default_factory=list)
    raw_retention_path: str = ""


# ── Retention profile / findings derivation ────────────────────────────────


def _avg_in_window(
    points: list[dict], start_sec: float, end_sec: float,
) -> float:
    """Average retention across all sample points whose time_sec lies
    in [start_sec, end_sec)."""
    in_window = [
        p.get("retention_pct", 0)
        for p in points
        if start_sec <= p.get("time_sec", 0) < end_sec
    ]
    if not in_window:
        return 0.0
    return sum(in_window) / len(in_window)


def derive_retention_profile(
    points: list[dict], total_duration_sec: float,
) -> RetentionProfile:
    """Compute per-band averages + trajectory classification.

    Bands align with YouTube Studio's own analytics framing:
      · Hook (0-30s) — does the cold open land?
      · Engagement (30s-3min) — does the body start holding?
      · Body (3min-end) — does the second half retain?

    For videos shorter than the threshold, the band collapses; e.g. a
    2-min video has no Body band → that average is 0 and the
    trajectory derives from Hook + Engagement only.
    """
    if not points or total_duration_sec <= 0:
        return RetentionProfile(0, 0, 0, "unknown")
    hook_end = min(HOOK_END_SEC, total_duration_sec)
    engagement_end = min(ENGAGEMENT_END_SEC, total_duration_sec)
    hook = _avg_in_window(points, 0, hook_end)
    mid = _avg_in_window(points, hook_end, engagement_end)
    close = _avg_in_window(points, engagement_end, total_duration_sec)

    # Trajectory classification: compare segment averages.
    # "climbing" = closing > hook+5pp (rare — happens when payoff lands)
    # "flat" = within ±3pp across all three
    # "descending" = each third lower than the previous
    # "volatile" = mid is much lower than both ends (saggy middle)
    if abs(hook - mid) <= 3 and abs(mid - close) <= 3 and abs(hook - close) <= 5:
        traj = "flat"
    elif close > hook + 5:
        traj = "climbing"
    elif hook > mid > close:
        traj = "descending"
    elif mid < hook - 5 and mid < close - 5:
        traj = "volatile"
    else:
        traj = "descending" if close < hook else "flat"

    return RetentionProfile(
        hook_third_avg=round(hook, 1),
        mid_third_avg=round(mid, 1),
        closing_third_avg=round(close, 1),
        trajectory=traj,
    )


def derive_findings(drops: list[dict]) -> list[FindingPoint]:
    """Pull the top-3 material drops as Top Findings entries. Each
    finding cites the beat + drop magnitude + timestamp.

    If NO material (≥ 10pp) drops exist, returns the top-3 minor drops
    but explicitly tags each one as "minor" so the operator isn't
    misled into treating clean episodes as having material losses.
    """
    material = [
        d for d in drops
        if (d.get("start_retention_pct", 0) - d.get("end_retention_pct", 0)) >= 10
    ]
    # Fall back to all drops if no material ones — operator still wants
    # some findings to react to, but the summary clearly notes the
    # nature of the fallback.
    is_fallback = not material
    sorted_drops = sorted(
        material or drops,
        key=lambda d: -(d.get("start_retention_pct", 0) - d.get("end_retention_pct", 0)),
    )[:MAX_FINDINGS]
    findings: list[FindingPoint] = []
    for d in sorted_drops:
        pp = d.get("start_retention_pct", 0) - d.get("end_retention_pct", 0)
        beat_num = d.get("beat_number") or "?"
        beat_title = d.get("beat_title", "")
        start = d.get("start_sec", 0)
        m = int(start // 60)
        s = int(start % 60)
        magnitude_label = "minor" if is_fallback else "material"
        findings.append(FindingPoint(
            summary=(
                f"[{magnitude_label}] Beat {beat_num} ({beat_title or 'untitled'}) "
                f"lost {pp:.1f}pp of audience around {m}:{s:02d}"
            ),
            detail=(
                f"Retention fell {d.get('start_retention_pct', 0):.0f}% → "
                f"{d.get('end_retention_pct', 0):.0f}% across "
                f"{d.get('start_sec', 0):.0f}s – {d.get('end_sec', 0):.0f}s. "
                f"Cross-reference the script + visual-spec for this beat to "
                f"identify what the viewer encountered."
                + (" _(No material drops in this episode — these are the "
                   "biggest non-material variations.)_" if is_fallback else "")
            ),
        ))
    return findings


def derive_visual_winners(drops: list[dict]) -> list[VisualEffectivenessNote]:
    """Map the worst drops to visual-effectiveness notes the operator
    can use to evaluate template choices. Until +retention deltas are
    surfaced (would need contrast against a baseline), this section is
    populated only with the negative cases — the operator notes which
    visuals corresponded."""
    notes: list[VisualEffectivenessNote] = []
    for d in sorted(
        drops,
        key=lambda d: -(d.get("start_retention_pct", 0) - d.get("end_retention_pct", 0)),
    )[:3]:
        pp = d.get("start_retention_pct", 0) - d.get("end_retention_pct", 0)
        start = d.get("start_sec", 0)
        m = int(start // 60)
        s = int(start % 60)
        notes.append(VisualEffectivenessNote(
            beat_number=d.get("beat_number") or 0,
            beat_title=d.get("beat_title", ""),
            direction="-",
            pp_delta=round(pp, 1),
            moment=f"{m}:{s:02d}",
            template_hints=[],
        ))
    return notes


# ── Rendering the entry ────────────────────────────────────────────────────


def render_entry_md(payload: LogEntryPayload) -> str:
    rp = payload.retention_profile
    lines = [
        "",
        f"## {payload.slug}: {payload.episode_title}",
        f"**Publish Date:** {payload.publish_date}",
        f"**Analysis Date:** {payload.analysis_date}",
        f"**Days Live:** {payload.days_live} days at analysis",
        "",
        "### Top 3 Findings",
    ]
    if payload.findings:
        for i, f in enumerate(payload.findings, 1):
            lines.append(f"{i}. {f.summary}")
            if f.detail:
                lines.append(f"   _Detail:_ {f.detail}")
    else:
        lines.append("1. [No material drops detected. Operator: identify findings from comments / CTR / share-rate.]")
        lines.append("2. [...]")
        lines.append("3. [...]")
    lines.extend([
        "",
        "### Persona Prediction Accuracy",
        "_[Auto-populated from persona-eval-report.md if present, otherwise filled in by publish-retro skill.]_",
        "- Priya: [verdict + confidence score]",
        "- Marcus: [verdict + confidence score]",
        "- Amara: [verdict + confidence score]",
        "- James: [verdict + confidence score]",
        "- Sofia: [verdict + confidence score]",
        "- **Overall:** [X/5 personas correctly predicted]",
        "",
        "### Visual Effectiveness Winners",
    ])
    if payload.visual_winners:
        for w in payload.visual_winners:
            lines.append(
                f"- {w.direction} **Beat {w.beat_number} _({w.beat_title})_** : "
                f"{w.pp_delta:+.1f}pp at {w.moment} "
                f"_(operator: note which template was on screen)_"
            )
        lines.append("- **Recommended visual type for next episode:** [...]")
    else:
        lines.append("- [Operator: identify which visual types corresponded to retention peaks/valleys.]")
    lines.extend([
        "",
        "### Retention Profile",
        f"- **Hook strength (first third):** {rp.hook_third_avg:.0f}% "
        f"[strong if ≥ 70, weak if < 50]",
        f"- **Mid-video holding (middle third):** {rp.mid_third_avg:.0f}% "
        f"[holding if within 5pp of hook]",
        f"- **Closing commitment (final third):** {rp.closing_third_avg:.0f}% "
        f"[strong if within 10pp of hook]",
        f"- **Overall trajectory:** {rp.trajectory}",
        "",
        "### Prediction Feedback",
        "_[Note any ways the production prediction artifacts (script-audit, persona-eval, visual-spec) missed or nailed the mark.]_",
        "",
        "### Next Episode Hypothesis",
        "_[1-3 most critical hypotheses to carry forward into the next episode's script-draft / visual-spec.]_",
        "",
        f"_Raw retention data: `{payload.raw_retention_path}`_",
        "",
        "---",
        "",
    ])
    return "\n".join(lines)


# ── Log insertion ───────────────────────────────────────────────────────────


def _entry_exists(log_text: str, slug: str) -> bool:
    """Has an entry for this slug already been written?"""
    pattern = re.compile(rf"^## {re.escape(slug)}\s*:", re.MULTILINE)
    return bool(pattern.search(log_text))


def insert_entry(log_text: str, entry_md: str) -> str:
    """Insert a new entry just BEFORE the HTML template-comment marker,
    or just before the "No episodes published yet" placeholder if no
    entries exist yet. The placeholder is removed on first insertion."""
    # First insertion: replace the placeholder line with the entry.
    if _EMPTY_LOG_MARKER in log_text:
        # Remove the placeholder line(s) and put the entry there
        idx = log_text.find(_EMPTY_LOG_MARKER)
        # Walk back to the line start
        line_start = log_text.rfind("\n", 0, idx) + 1
        # Forward to next blank line
        end_idx = log_text.find("\n\n", idx)
        if end_idx < 0:
            end_idx = len(log_text)
        return (
            log_text[:line_start]
            + entry_md.lstrip("\n")
            + log_text[end_idx:]
        )
    # Subsequent insertions: place before the template-comment block
    if _TEMPLATE_COMMENT_MARKER in log_text:
        idx = log_text.find(_TEMPLATE_COMMENT_MARKER)
        return log_text[:idx] + entry_md + log_text[idx:]
    # Fallback: just append
    return log_text.rstrip() + "\n" + entry_md


# ── Top-level orchestration ─────────────────────────────────────────────────


def build_payload(
    slug: str, retention_json_path: Path,
    publish_date: str, analysis_date: Optional[str] = None,
    episode_title: Optional[str] = None,
) -> LogEntryPayload:
    """Assemble a LogEntryPayload from the structured retention JSON
    that `analytics_ingest.py --json` produces."""
    data = json.loads(retention_json_path.read_text(encoding="utf-8"))
    total_dur = float(data.get("total_duration_sec", 0))
    drops = data.get("drops", [])
    # Sample points may live alongside in the retention JSON, or only
    # the aggregate (sample_count / average_retention_pct). Both shapes
    # are handled — when only the aggregate is present, the profile
    # falls back to a single number.
    points = data.get("points") or []
    profile = (
        derive_retention_profile(points, total_dur)
        if points else
        RetentionProfile(
            hook_third_avg=data.get("average_retention_pct", 0),
            mid_third_avg=data.get("average_retention_pct", 0),
            closing_third_avg=data.get("average_retention_pct", 0),
            trajectory="unknown",
        )
    )
    findings = derive_findings(drops)
    visual = derive_visual_winners(drops)

    if analysis_date is None:
        analysis_date = datetime.date.today().isoformat()
    days_live = _days_between(publish_date, analysis_date)

    if not episode_title:
        # Try to read from the assembly manifest
        episode_title = _resolve_episode_title(slug) or slug

    return LogEntryPayload(
        slug=slug, episode_title=episode_title,
        publish_date=publish_date, analysis_date=analysis_date,
        days_live=days_live, retention_profile=profile,
        findings=findings, visual_winners=visual,
        raw_retention_path=str(retention_json_path),
    )


def _days_between(start_iso: str, end_iso: str) -> int:
    try:
        start = datetime.date.fromisoformat(start_iso)
        end = datetime.date.fromisoformat(end_iso)
        return max(0, (end - start).days)
    except ValueError:
        return 0


def _resolve_episode_title(slug: str) -> Optional[str]:
    manifest = REMOTION_DATA / slug / "assembly-manifest.json"
    if not manifest.is_file():
        return None
    try:
        return json.loads(manifest.read_text(encoding="utf-8")).get("title")
    except (json.JSONDecodeError, OSError):
        return None


# ── CLI ─────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument("slug", help="Episode slug.")
    parser.add_argument(
        "--retention", required=True,
        help="Path to retention JSON (output of analytics_ingest.py --json).",
    )
    parser.add_argument(
        "--published-at", required=True,
        help="Publish date ISO (YYYY-MM-DD).",
    )
    parser.add_argument(
        "--analysis-date", default=None,
        help="Analysis date ISO (default: today).",
    )
    parser.add_argument(
        "--episode-title",
        help="Episode title (default: read from assembly manifest).",
    )
    parser.add_argument(
        "--log",
        help="Path to LEARNING_LOG.md (default: episodes/LEARNING_LOG.md).",
    )
    parser.add_argument(
        "--overwrite", action="store_true",
        help="Replace existing entry for this slug instead of erroring.",
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Print the entry to stdout, don't write to the log.",
    )
    parser.add_argument("--stdout", action="store_true", help="Print entry to stdout.")
    args = parser.parse_args()

    retention_path = Path(args.retention).resolve()
    if not retention_path.is_file():
        print(f"✗ retention JSON not found: {retention_path}", file=sys.stderr)
        return 2

    log_path = Path(args.log).resolve() if args.log else LEARNING_LOG_PATH

    try:
        payload = build_payload(
            args.slug, retention_path,
            publish_date=args.published_at,
            analysis_date=args.analysis_date,
            episode_title=args.episode_title,
        )
    except (ValueError, json.JSONDecodeError) as e:
        print(f"✗ build failed: {type(e).__name__}: {e}", file=sys.stderr)
        return 2

    entry_md = render_entry_md(payload)

    if args.dry_run or args.stdout:
        sys.stdout.write(entry_md)
        if args.dry_run:
            return 0

    if not log_path.is_file():
        print(f"✗ learning log not found: {log_path}", file=sys.stderr)
        return 2

    log_text = log_path.read_text(encoding="utf-8")
    if _entry_exists(log_text, args.slug) and not args.overwrite:
        print(
            f"✗ entry for {args.slug} already exists in {log_path} — "
            f"pass --overwrite to replace.",
            file=sys.stderr,
        )
        return 1

    if _entry_exists(log_text, args.slug) and args.overwrite:
        # Strip the existing entry first
        log_text = _strip_entry(log_text, args.slug)

    new_text = insert_entry(log_text, entry_md)
    log_path.write_text(new_text, encoding="utf-8")
    rel = log_path.relative_to(ROOT) if log_path.is_relative_to(ROOT) else log_path
    print(f"✓ wrote entry to {rel}", file=sys.stderr)
    return 0


def _strip_entry(log_text: str, slug: str) -> str:
    """Remove an existing entry block for `slug`. Used by --overwrite.

    Tolerant of CRLF line endings and arbitrary whitespace before the
    next entry's `## ` or `<!--` marker — without this the regex would
    miss matches on Windows-edited LEARNING_LOG.md files and strip
    everything to EOF.
    """
    pattern = re.compile(
        rf"^## {re.escape(slug)}\s*:.*?(?=\r?\n## \s*|\r?\n<!--|\Z)",
        re.MULTILINE | re.DOTALL,
    )
    return pattern.sub("", log_text)


if __name__ == "__main__":
    sys.exit(main())
