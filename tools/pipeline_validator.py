#!/usr/bin/env python3
"""
pipeline_validator.py — Cross-check PIPELINE.md states against actual episode artifacts.

For each episode in episodes/PIPELINE.md, verifies:
  · Required artifacts for the claimed state actually exist
  · No forward-state artifacts contradict the claimed state (catches stale table)
  · Stall detection: days in state exceeds warn/alert thresholds
  · Blocker consistency: "Blocked on" populated but state is not BLOCKED/REVISING

Usage:
  python3 tools/pipeline_validator.py              # check all episodes
  python3 tools/pipeline_validator.py silicon-trap  # check one episode
  python3 tools/pipeline_validator.py --strict      # exit 1 on warnings too

Exit 0 if clean, 1 if errors found (or warnings under --strict).
"""

import argparse
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

sys.path.insert(0, str(Path(__file__).resolve().parent / "shared"))
from paths import get_project_root

ROOT = get_project_root()
PIPELINE_MD   = ROOT / "episodes" / "PIPELINE.md"
EPISODES_DIR  = ROOT / "episodes"
REMOTION_DATA = ROOT / "remotion-templates" / "data" / "episodes"

# ── Thresholds ────────────────────────────────────────────────────────────────

STALL_WARN_DAYS  = 7    # warn if days in state exceeds this
STALL_ALERT_DAYS = 21   # error if days in state exceeds this

# States that should not trigger stall warnings
NON_STALLING_STATES = {"PUBLISHED", "RETROED", "BLOCKED", "INCUBATING"}

# States where a populated "Blocked on" is expected
BLOCKED_STATES = {"BLOCKED", "REVISING"}

# Canonical pipeline order (higher index = more advanced)
STATE_ORDER = [
    "INCUBATING", "VIABLE", "RESEARCHING", "RESEARCH READY",
    "DRAFTING", "RENDER READY", "IN POST", "PUBLISHED", "RETROED",
]

# ── Artifact specs ────────────────────────────────────────────────────────────
# Each entry: (glob_or_name, description, is_canonical)
# A glob like "script-v*-production.md" matches any versioned draft.
# If is_canonical=True the check also warns when only versioned copies exist.

@dataclass
class ArtifactSpec:
    canonical: str            # exact canonical filename
    glob: str                 # glob pattern that also counts (versioned drafts)
    label: str                # human-readable label for output
    canonical_only_warn: bool = True  # warn if only glob matches, not canonical


# Required artifacts per state. Missing any = ERROR.
STATE_REQUIRED: dict[str, list[ArtifactSpec]] = {
    "VIABLE": [
        ArtifactSpec("viability.md", "viability-check.md", "viability check"),
    ],
    "RESEARCHING": [
        ArtifactSpec("brief.md", "brief.md", "research brief", canonical_only_warn=False),
    ],
    "RESEARCH READY": [
        ArtifactSpec("brief.md", "brief.md", "research brief", canonical_only_warn=False),
        ArtifactSpec("research-audit.md", "research-audit*.md", "research audit"),
        ArtifactSpec("angle-memo.md", "angle-memo.md", "angle memo", canonical_only_warn=False),
    ],
    "DRAFTING": [
        ArtifactSpec("angle-memo.md", "angle-memo.md", "angle memo", canonical_only_warn=False),
        ArtifactSpec("script-production.md", "script-v*-production.md", "production script"),
    ],
    "RENDER READY": [
        ArtifactSpec("script-production.md", "script-v*-production.md", "production script"),
        ArtifactSpec("script-audit.md", "script-audit*.md", "script audit"),
        ArtifactSpec("visual-spec.md", "visual-spec.md", "visual spec", canonical_only_warn=False),
        ArtifactSpec("shot-list.json", "shot-list.json", "shot list", canonical_only_warn=False),
    ],
    "IN POST": [
        ArtifactSpec("visual-spec.md", "visual-spec.md", "visual spec", canonical_only_warn=False),
        ArtifactSpec("audio-cue-sheet.md", "audio-*.md", "audio spec"),
    ],
}

# Forward-state evidence: if a claimed state is at or below the threshold,
# and these files exist, the table is likely stale.
# Format: (filename_or_glob, implies_state_label)
FORWARD_EVIDENCE = [
    ("assembly-manifest.json",      "RENDER READY",    "remotion_data"),  # checked in data dir
    ("visual-spec.md",              "RENDER READY",    "episode"),
    ("shot-list.json",              "RENDER READY",    "episode"),
    ("script-audit.md",             "DRAFTING",        "episode"),
    ("script-audit*.md",            "DRAFTING",        "episode"),
    ("script-v*-production.md",     "DRAFTING",        "episode"),
    ("script-production.md",        "DRAFTING",        "episode"),
    ("angle-memo.md",               "RESEARCH READY",  "episode"),
    ("research-audit.md",           "RESEARCH READY",  "episode"),
]


# ── PIPELINE.md parser ────────────────────────────────────────────────────────

@dataclass
class EpisodeRow:
    slug: str
    state: str
    days_in_state: int
    blocked_on: str          # "—" means none


def parse_pipeline_md() -> list[EpisodeRow]:
    """Parse the current-state table from episodes/PIPELINE.md."""
    if not PIPELINE_MD.exists():
        print(f"✗ {PIPELINE_MD} not found", file=sys.stderr)
        sys.exit(1)

    text = PIPELINE_MD.read_text(encoding="utf-8")

    # Find the table rows (skip header and separator)
    # Row format: | `slug` | STATE | N | Format | Next action | Blocked on | Date | link |
    row_re = re.compile(
        r"^\|\s*`([^`]+)`\s*\|\s*([^|]+?)\s*\|\s*(\d+)\s*\|[^|]*\|[^|]*\|\s*([^|]+?)\s*\|"
    )

    rows = []
    for line in text.splitlines():
        m = row_re.match(line)
        if not m:
            continue
        slug         = m.group(1).strip()
        state        = m.group(2).strip()
        days         = int(m.group(3))
        blocked_on   = m.group(4).strip()
        rows.append(EpisodeRow(slug=slug, state=state, days_in_state=days, blocked_on=blocked_on))

    return rows


# ── Artifact helpers ──────────────────────────────────────────────────────────

def file_exists(ep_dir: Path, name_or_glob: str) -> list[Path]:
    """Return matching paths (empty list if none)."""
    if "*" in name_or_glob:
        return list(ep_dir.glob(name_or_glob))
    p = ep_dir / name_or_glob
    return [p] if p.exists() else []


def state_index(state: str) -> int:
    try:
        return STATE_ORDER.index(state)
    except ValueError:
        return -1  # BLOCKED / REVISING / unknown — treat as not in order


# ── Per-episode validation ────────────────────────────────────────────────────

@dataclass
class Finding:
    level: str   # "error" | "warn" | "ok" | "info"
    msg: str


@dataclass
class EpisodeReport:
    slug: str
    state: str
    days: int
    findings: list[Finding] = field(default_factory=list)

    @property
    def errors(self):
        return [f for f in self.findings if f.level == "error"]

    @property
    def warnings(self):
        return [f for f in self.findings if f.level == "warn"]

    @property
    def oks(self):
        return [f for f in self.findings if f.level == "ok"]


def validate_episode(row: EpisodeRow) -> EpisodeReport:
    report = EpisodeReport(slug=row.slug, state=row.state, days=row.days_in_state)
    add = report.findings.append

    ep_dir   = EPISODES_DIR / row.slug
    data_dir = REMOTION_DATA / row.slug

    # ── Episode directory must exist ─────────────────────────────────────────
    if not ep_dir.is_dir():
        add(Finding("error", f"Episode directory missing: episodes/{row.slug}/"))
        return report  # nothing more to check

    # ── Required artifacts for claimed state ─────────────────────────────────
    required = STATE_REQUIRED.get(row.state, [])
    for spec in required:
        canonical_hits = file_exists(ep_dir, spec.canonical)
        glob_hits      = file_exists(ep_dir, spec.glob) if spec.glob != spec.canonical else []

        if canonical_hits:
            add(Finding("ok", f"{spec.label} ({spec.canonical})"))
        elif glob_hits:
            names = ", ".join(p.name for p in sorted(glob_hits)[-2:])
            if spec.canonical_only_warn:
                add(Finding("warn",
                    f"{spec.label}: only versioned copies exist ({names}) — "
                    f"rename canonical to {spec.canonical} once gate passes"))
            else:
                add(Finding("ok", f"{spec.label} ({names})"))
        else:
            add(Finding("error",
                f"{spec.label} missing — expected {spec.canonical!r} "
                f"(required for {row.state})"))

    # ── Remotion data directory checks ───────────────────────────────────────
    if row.state in ("RENDER READY", "IN POST", "PUBLISHED", "RETROED"):
        if data_dir.is_dir():
            json_files = [p for p in data_dir.glob("*.json")
                          if p.name != "assembly-manifest.json"]
            manifest   = data_dir / "assembly-manifest.json"
            if manifest.exists():
                try:
                    mdata = json.loads(manifest.read_text())
                    seg_count = len(mdata.get("segments", []))
                    dur = mdata.get("totalDurationSec", 0)
                    add(Finding("ok",
                        f"assembly-manifest.json ({seg_count} segments, {dur:.0f}s)"))
                except Exception:
                    add(Finding("warn", "assembly-manifest.json exists but failed to parse"))
            else:
                add(Finding("error",
                    f"assembly-manifest.json missing from "
                    f"remotion-templates/data/episodes/{row.slug}/"))
            if json_files:
                add(Finding("ok", f"{len(json_files)} template data JSON files"))
            else:
                add(Finding("warn", "No template data JSON files found in data dir"))
        else:
            add(Finding("error",
                f"remotion-templates/data/episodes/{row.slug}/ missing "
                f"(required for {row.state})"))

    # ── Forward-state evidence (stale table detection) ────────────────────────
    # Skip for failure states — BLOCKED/REVISING intentionally hold late-stage
    # artifacts from the state they were in before stalling/reverting.
    claimed_idx = state_index(row.state)
    stale_evidence: list[tuple[str, str]] = []  # (description, implied_state)
    if row.state in BLOCKED_STATES:
        claimed_idx = len(STATE_ORDER)  # treat as "any state is fine"

    for artifact, implies_state, location in FORWARD_EVIDENCE:
        implied_idx = state_index(implies_state)
        if implied_idx <= claimed_idx:
            continue  # evidence is consistent with or behind claimed state

        if location == "remotion_data":
            hits = file_exists(data_dir, artifact) if data_dir.is_dir() else []
        else:
            hits = file_exists(ep_dir, artifact)

        if hits:
            names = ", ".join(p.name for p in hits[:2])
            stale_evidence.append((names, implies_state))

    if stale_evidence:
        # stale_evidence entries: (description, implied_state_name)
        # Deduplicate by implied state, track highest
        seen_states: set[str] = set()
        unique: list[tuple[str, str]] = []
        highest_idx = claimed_idx
        for desc, implied in stale_evidence:
            if implied not in seen_states:
                seen_states.add(implied)
                unique.append((desc, implied))
                idx = state_index(implied)
                if idx > highest_idx:
                    highest_idx = idx

        suggested = STATE_ORDER[highest_idx] if 0 <= highest_idx < len(STATE_ORDER) else "later"
        add(Finding("warn",
            f"State appears STALE — evidence suggests {suggested} or later:\n"
            + "\n".join(f"      · {desc} → suggests {impl}" for desc, impl in unique)
            + f"\n    → Update PIPELINE.md state to {suggested}"))

    # ── Stall detection ───────────────────────────────────────────────────────
    if row.state not in NON_STALLING_STATES:
        if row.days_in_state > STALL_ALERT_DAYS:
            add(Finding("error",
                f"{row.days_in_state} days in {row.state} — critically stalled; "
                f"advance, block formally, or archive"))
        elif row.days_in_state > STALL_WARN_DAYS:
            add(Finding("warn",
                f"{row.days_in_state} days in {row.state} — consider advancing "
                f"or marking BLOCKED with a reason"))

    if row.state in NON_STALLING_STATES and row.state == "INCUBATING" \
            and row.days_in_state > STALL_ALERT_DAYS:
        add(Finding("warn",
            f"{row.days_in_state} days in INCUBATING — consider promoting "
            f"(run topic-viability) or archiving"))

    # ── Blocker consistency ───────────────────────────────────────────────────
    has_blocker = row.blocked_on not in ("—", "", "-")
    if has_blocker and row.state not in BLOCKED_STATES:
        add(Finding("warn",
            f"Blocked on: \"{row.blocked_on}\" — "
            f"but state is {row.state}, not BLOCKED/REVISING. "
            f"If this is still unresolved, change state to BLOCKED."))

    return report


# ── Formatting ────────────────────────────────────────────────────────────────

ICONS = {"error": "✗", "warn": "⚠", "ok": "✓", "info": "·"}
LEVEL_ORDER = {"error": 0, "warn": 1, "ok": 2, "info": 3}


def print_report(report: EpisodeReport) -> None:
    errors   = len(report.errors)
    warnings = len(report.warnings)

    # Header
    status_tag = ""
    if errors:
        status_tag = "  [ERRORS]"
    elif warnings:
        status_tag = "  [warnings]"
    else:
        status_tag = "  ✓"

    print(f"\n{report.slug}  ·  {report.state}  ·  {report.days} days{status_tag}")

    # Sort: errors first, then warnings, then oks
    for f in sorted(report.findings, key=lambda x: LEVEL_ORDER[x.level]):
        icon = ICONS[f.level]
        # Indent continuation lines
        lines = f.msg.split("\n")
        print(f"  {icon} {lines[0]}")
        for line in lines[1:]:
            print(f"    {line}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Validate PIPELINE.md states against actual episode artifacts."
    )
    parser.add_argument(
        "episode",
        nargs="?",
        help="Check only this episode slug (default: all episodes).",
    )
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Exit 1 on warnings as well as errors.",
    )
    args = parser.parse_args()

    rows = parse_pipeline_md()
    if not rows:
        print("No episodes found in PIPELINE.md.", file=sys.stderr)
        return 1

    if args.episode:
        rows = [r for r in rows if r.slug == args.episode]
        if not rows:
            print(f"Episode '{args.episode}' not found in PIPELINE.md.", file=sys.stderr)
            return 1

    print("══════════════════════════════════════════════════════")
    print("  Parallax Episode Pipeline Validator")
    print("══════════════════════════════════════════════════════")

    reports = [validate_episode(r) for r in rows]
    for rep in reports:
        print_report(rep)

    # Summary
    total_errors   = sum(len(r.errors)   for r in reports)
    total_warnings = sum(len(r.warnings) for r in reports)
    stale          = [r.slug for r in reports
                      if any("STALE" in f.msg for f in r.findings)]

    print("\n── Summary " + "─" * 46)
    print(f"  {len(reports)} episode(s) checked  "
          f"· {total_errors} error(s)  · {total_warnings} warning(s)")
    if stale:
        print(f"  Stale state detected: {', '.join(stale)}")
    if total_errors == 0 and total_warnings == 0:
        print("  ✓ All checks passed — PIPELINE.md is consistent with artifacts.")
    print()

    if total_errors:
        return 1
    if args.strict and total_warnings:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
