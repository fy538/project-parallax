#!/usr/bin/env python3
"""
pipeline_validator.py — Cross-check PIPELINE.md states against actual episode artifacts.

For each episode in episodes/PIPELINE.md, verifies:
  · Required artifacts for the claimed state actually exist
  · No forward-state artifacts contradict the claimed state (catches stale table)
  · Stall detection: days in state exceeds warn/alert thresholds
  · Blocker consistency: "Blocked on" populated but state is not BLOCKED/REVISING
  · Naming drift: canonical filename missing but versioned copies present

Also writes episodes/<slug>/_checkpoint.md — a per-episode stage checklist
auto-populated from actual file presence. Agents and humans read this for a
quick "done / not done" summary without opening a dozen files.

Usage:
  python3 tools/pipeline_validator.py              # check all + write checkpoints
  python3 tools/pipeline_validator.py silicon-trap  # check one episode
  python3 tools/pipeline_validator.py --strict      # exit 1 on warnings too
  python3 tools/pipeline_validator.py --no-checkpoint  # skip writing checkpoints
  python3 tools/pipeline_validator.py --fix         # promote latest versioned → canonical
  python3 tools/pipeline_validator.py --fix silicon-trap  # fix one episode only

Exit 0 if clean, 1 if errors found (or warnings under --strict).
"""

import argparse
import datetime
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


# ── Canonical naming fixes ────────────────────────────────────────────────────
# Each tuple: (canonical_filename, versioned_glob)
# Used by --fix to promote the latest matching draft to the canonical name.
# Order matters: earlier entries run first (harmless here, but be explicit).
CANONICAL_FIXES: list[tuple[str, str]] = [
    ("script-production.md",      "script-v*-production.md"),
    ("script-audit.md",           "script-audit-v*.md"),
    ("persona-eval.md",           "persona-eval-v*.md"),
    ("visual-concept-audit.md",   "visual-concept-audit-v*.md"),
    ("review-package.md",         "review-package-v*.md"),
    ("research-audit.md",         "research-audit-v*.md"),
]


def fix_naming_drift(ep_dir: Path) -> list[str]:
    """Promote the latest versioned draft to canonical for any missing canonical files.

    Does NOT delete intermediate versions — human decides materiality.
    Returns a list of human-readable rename messages (empty if nothing to fix).
    """
    renames: list[str] = []
    for canonical, versioned_glob in CANONICAL_FIXES:
        canon_path = ep_dir / canonical
        if canon_path.exists():
            continue  # canonical already present — nothing to do
        hits = sorted(ep_dir.glob(versioned_glob))
        if not hits:
            continue  # no versioned copies either — genuine gap, not drift
        latest = hits[-1]
        latest.rename(canon_path)
        renames.append(f"  {latest.name}  →  {canonical}")
    return renames


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
                except Exception as e:
                    add(Finding("warn", f"assembly-manifest.json exists but failed to parse: {e}"))
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


# ── Checkpoint generator ──────────────────────────────────────────────────────

@dataclass
class StageCheck:
    label: str
    done: bool
    detail: str = ""    # found filename(s) or missing note
    warn: str = ""      # non-blocking issue (e.g. naming drift)


def _first_match(ep_dir: Path, *globs: str) -> Optional[Path]:
    """Return the first matching file from any of the glob patterns, or None."""
    for g in globs:
        hits = sorted(ep_dir.glob(g))
        if hits:
            return hits[-1]  # latest if versioned
    return None


def _all_matches(ep_dir: Path, *globs: str) -> list[Path]:
    results: list[Path] = []
    for g in globs:
        results.extend(ep_dir.glob(g))
    return sorted(set(results))


def build_checkpoint_stages(
    row: EpisodeRow, ep_dir: Path, data_dir: Path
) -> list[tuple[str, list[StageCheck]]]:
    """Return a list of (group_name, [StageCheck]) for the checkpoint file."""
    groups: list[tuple[str, list[StageCheck]]] = []

    # ── Research ──────────────────────────────────────────────────────────────
    research: list[StageCheck] = []

    viability = _first_match(ep_dir, "viability.md", "viability-check.md")
    research.append(StageCheck(
        "Viability check", bool(viability),
        detail=viability.name if viability else "viability.md missing",
    ))

    brief = ep_dir / "brief.md"
    passes = _all_matches(ep_dir, "research-pass*.md")
    has_research = brief.exists() or bool(passes)
    pass_names = ", ".join(p.name for p in passes[:3]) if passes else ""
    brief_part = "brief.md" if brief.exists() else ""
    detail = " + ".join(filter(None, [brief_part, pass_names])) or "brief.md missing"
    research.append(StageCheck("Deep Research", has_research, detail=detail))

    audit = _first_match(ep_dir, "research-audit.md", "research-audit-*.md")
    research.append(StageCheck(
        "Research Audit", bool(audit),
        detail=audit.name if audit else "research-audit.md missing",
    ))

    groups.append(("Research", research))

    # ── Script ────────────────────────────────────────────────────────────────
    script: list[StageCheck] = []

    angle = ep_dir / "angle-memo.md"
    script.append(StageCheck(
        "Angle Memo", angle.exists(),
        detail="angle-memo.md" if angle.exists() else "angle-memo.md missing",
    ))

    canonical_script = ep_dir / "script-production.md"
    versioned_scripts = _all_matches(ep_dir, "script-v*-production.md")
    if canonical_script.exists():
        script.append(StageCheck("Script Draft", True, detail="script-production.md"))
    elif versioned_scripts:
        latest = versioned_scripts[-1].name
        script.append(StageCheck(
            "Script Draft", True, detail=latest,
            warn=f"no canonical script-production.md — rename {latest} once gate passes",
        ))
    else:
        script.append(StageCheck("Script Draft", False, detail="no script file found"))

    for stage, canonical, glob in [
        ("Script Audit",     "script-audit.md",          "script-audit-v*.md"),
        ("Persona Eval",     "persona-eval.md",           "persona-eval-v*.md"),
        ("Visual Concept",   "visual-concept-audit.md",   "visual-concept-audit-v*.md"),
        ("Review Package",   "review-package.md",         "review-package-v*.md"),
    ]:
        canon_p = ep_dir / canonical
        versioned = _all_matches(ep_dir, glob)
        if canon_p.exists():
            script.append(StageCheck(stage, True, detail=canonical))
        elif versioned:
            latest = versioned[-1].name
            script.append(StageCheck(
                stage, True, detail=latest,
                warn=f"no canonical {canonical}",
            ))
        else:
            script.append(StageCheck(stage, False, detail=f"{canonical} missing"))

    thumb = ep_dir / "thumbnail-concepts.md"
    script.append(StageCheck(
        "Title/Hook + Thumbnails", thumb.exists(),
        detail="thumbnail-concepts.md" if thumb.exists() else "thumbnail-concepts.md missing",
    ))

    groups.append(("Script", script))

    # ── Production Prep ───────────────────────────────────────────────────────
    prep: list[StageCheck] = []

    vspec = ep_dir / "visual-spec.md"
    prep.append(StageCheck(
        "Visual Spec", vspec.exists(),
        detail="visual-spec.md" if vspec.exists() else "visual-spec.md missing — run visual-spec skill",
    ))

    audio = _first_match(ep_dir, "audio-cue-sheet.md", "audio-spec.md", "audio-*.md")
    prep.append(StageCheck(
        "Audio Spec", bool(audio),
        detail=audio.name if audio else "audio-cue-sheet.md missing — run audio-spec skill",
    ))

    shots = ep_dir / "shot-list.json"
    prep.append(StageCheck(
        "Shot List", shots.exists(),
        detail="shot-list.json" if shots.exists() else "shot-list.json missing",
    ))

    if data_dir.is_dir():
        json_files = [p for p in data_dir.glob("*.json") if p.name != "assembly-manifest.json"]
        manifest = data_dir / "assembly-manifest.json"
        if manifest.exists():
            try:
                mdata = json.loads(manifest.read_text())
                segs = len(mdata.get("segments", []))
                dur = mdata.get("totalDurationSec", 0)
                detail = f"assembly-manifest.json ({segs} segments, {dur:.0f}s) + {len(json_files)} data files"
            except Exception as e:
                detail = f"assembly-manifest.json (parse error: {e}) + {len(json_files)} data files"
            prep.append(StageCheck("Template Data + Manifest", True, detail=detail))
        elif json_files:
            prep.append(StageCheck(
                "Template Data + Manifest", False,
                detail=f"{len(json_files)} data files present but assembly-manifest.json missing",
            ))
        else:
            prep.append(StageCheck("Template Data + Manifest", False,
                detail="data dir exists but empty"))
    else:
        prep.append(StageCheck(
            "Template Data + Manifest", False,
            detail=f"remotion-templates/data/episodes/{row.slug}/ not created yet",
        ))

    groups.append(("Production Prep", prep))

    # ── Production ────────────────────────────────────────────────────────────
    prod: list[StageCheck] = []

    assets_dir = ep_dir / "assets"
    video_exts = {".mp4", ".mov", ".mkv", ".webm", ".mxf"}
    video_files = [p for p in assets_dir.rglob("*") if p.suffix.lower() in video_exts] \
        if assets_dir.is_dir() else []
    asset_manifest = assets_dir / "asset-manifest.json" if assets_dir.is_dir() else None
    has_footage = bool(video_files) or (asset_manifest is not None and asset_manifest.exists())
    if has_footage:
        detail = f"asset-manifest.json" if (asset_manifest and asset_manifest.exists()) \
            else f"{len(video_files)} video file(s) in assets/"
    else:
        detail = "no sourced footage — run: python3 tools/asset-source/source.py --batch shot-list.json"
    prod.append(StageCheck("Stock Footage", has_footage, detail=detail))

    audio_exts = {".wav", ".mp3", ".aiff", ".flac", ".m4a"}
    narration_files = [
        p for p in ep_dir.rglob("*")
        if p.suffix.lower() in audio_exts and "assets" not in p.parts
    ]
    # also check a dedicated audio/ subdir
    narration_files += [p for p in (ep_dir / "audio").rglob("*")
                        if p.suffix.lower() in audio_exts] \
        if (ep_dir / "audio").is_dir() else []
    has_narration = bool(narration_files)
    prod.append(StageCheck(
        "Narration", has_narration,
        detail=narration_files[0].name if has_narration else "not recorded yet",
    ))

    # NLE / publish inferred from state
    in_post    = row.state in ("IN POST", "PUBLISHED", "RETROED")
    published  = row.state in ("PUBLISHED", "RETROED")
    retroed    = row.state == "RETROED"

    prod.append(StageCheck("NLE Assembly", in_post,
        detail="complete (state ≥ IN POST)" if in_post else "not started"))
    prod.append(StageCheck("Publish", published,
        detail="published" if published else "not yet published"))
    prod.append(StageCheck("Publish Retro", retroed,
        detail="complete" if retroed else "not yet run"))

    groups.append(("Production", prod))

    return groups


def write_checkpoint(row: EpisodeRow, ep_dir: Path, data_dir: Path) -> None:
    """Write episodes/<slug>/_checkpoint.md from current artifact state."""
    today = datetime.date.today().isoformat()
    groups = build_checkpoint_stages(row, ep_dir, data_dir)

    lines: list[str] = [
        f"# {row.slug} — Pipeline Checkpoint",
        f"> Auto-generated {today} by `pipeline_validator.py` · do not edit manually",
        f"> Refresh: `python3 tools/pipeline_validator.py`",
        "",
        f"**State:** {row.state}  ·  {row.days_in_state} days in state",
    ]
    if row.blocked_on not in ("—", "", "-"):
        lines.append(f"**Blocked on:** {row.blocked_on}")
    lines.append("")

    for group_name, checks in groups:
        lines.append(f"## {group_name}")
        for c in checks:
            box = "x" if c.done else " "
            suffix = f" — {c.detail}" if c.detail else ""
            lines.append(f"- [{box}] {c.label}{suffix}")
            if c.warn:
                lines.append(f"  - ⚠ {c.warn}")
        lines.append("")

    # Quick summary counts
    all_checks = [c for _, grp in groups for c in grp]
    done  = sum(1 for c in all_checks if c.done)
    total = len(all_checks)
    warns = sum(1 for c in all_checks if c.warn)
    lines.append(f"---")
    lines.append(f"**Progress:** {done}/{total} stages complete"
                 + (f" · {warns} naming drift warning(s)" if warns else ""))
    lines.append("")

    out = ep_dir / "_checkpoint.md"
    out.write_text("\n".join(lines), encoding="utf-8")


# ── pipeline-state.json loader ────────────────────────────────────────────────

PIPELINE_STATE_JSON = ROOT / "episodes" / "pipeline-state.json"


@dataclass
class StateEntry:
    """One episode's row from pipeline-state.json."""
    slug: str
    state: str
    state_entered_at: datetime.date
    format: Optional[str]
    target_publish: Optional[datetime.date]
    notes: str = ""

    @property
    def days_in_state(self) -> int:
        return (datetime.date.today() - self.state_entered_at).days

    @property
    def days_to_target(self) -> Optional[int]:
        if self.target_publish is None:
            return None
        return (self.target_publish - datetime.date.today()).days


def load_pipeline_state() -> list[StateEntry]:
    """Parse episodes/pipeline-state.json into typed entries."""
    if not PIPELINE_STATE_JSON.is_file():
        return []
    data = json.loads(PIPELINE_STATE_JSON.read_text(encoding="utf-8"))
    out: list[StateEntry] = []
    for e in data.get("episodes", []):
        target = e.get("targetPublish")
        out.append(StateEntry(
            slug=e["slug"],
            state=e["state"],
            state_entered_at=datetime.date.fromisoformat(e["stateEnteredAt"]),
            format=e.get("format"),
            target_publish=datetime.date.fromisoformat(target) if target else None,
            notes=e.get("notes", ""),
        ))
    return out


# ── compute_episode_status ────────────────────────────────────────────────────
# Pulls together every signal needed for the _status.md dashboard and
# PIPELINE.md's Health column. Reads filesystem + COST_LOG + (optionally
# subprocess-ish) lint output. Designed to be safe to run on every
# check-episode.sh invocation: fast (no network), idempotent, no writes.


@dataclass
class EpisodeStatus:
    """Comprehensive operational snapshot for one episode."""
    slug: str
    state: str
    days_in_state: int
    days_to_target: Optional[int]
    target_publish: Optional[str]   # ISO string for display
    format: Optional[str]
    notes: str

    # Artifact presence
    has_research: bool
    has_angle_memo: bool
    has_script: bool
    has_visual_spec: bool
    has_audio_cue_sheet: bool
    has_manifest: bool
    has_narration: bool
    has_render: bool
    has_thumbnails: bool

    # Counts
    data_files: int
    asset_stills: int
    asset_clips: int
    manifest_segments: int
    manifest_duration_sec: float
    manifest_mode: str              # "estimate" | "precise" | "missing"
    zero_hit_count: int             # from zerohit_fallback.py logic
    cost_usd: float

    # Health signals
    manifest_stale: bool            # script mtime > manifest mtime + tolerance
    manifest_stale_drift_str: str   # human-readable e.g. "6 days"
    script_version: Optional[str]   # e.g. "v3"
    script_mtime: Optional[str]     # ISO

    # Stage progress (computed from state index)
    stage_idx: int                  # position in STATE_ORDER (0-8)
    stage_total: int = len(STATE_ORDER)

    # Health summary string for PIPELINE.md Health column
    health_summary: str = ""


def _read_cost_log() -> dict[str, float]:
    """Parse episodes/COST_LOG.md → {episode_slug: total_usd}."""
    cost_log = EPISODES_DIR / "COST_LOG.md"
    if not cost_log.is_file():
        return {}
    totals: dict[str, float] = {}
    # Format: | date | episode | service | amount_usd | note |
    row_re = re.compile(r"^\|\s*\d{4}-\d{2}-\d{2}\s*\|\s*([^|]+?)\s*\|\s*[^|]+?\s*\|\s*([\d.]+)\s*\|")
    for line in cost_log.read_text(encoding="utf-8").splitlines():
        m = row_re.match(line)
        if not m:
            continue
        slug = m.group(1).strip()
        amount = float(m.group(2))
        totals[slug] = totals.get(slug, 0.0) + amount
    return totals


def _count_zero_hits(slug: str) -> int:
    """Count zero-hit shots in episodes/<slug>/assets/**/asset-manifest.json."""
    ep_dir = EPISODES_DIR / slug
    if not ep_dir.is_dir():
        return 0
    count = 0
    for am in ep_dir.rglob("asset-manifest.json"):
        try:
            data = json.loads(am.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        for entry in data.get("assets", []):
            search = entry.get("search", {})
            total = search.get("total_results", 0)
            downloaded = [d for d in entry.get("downloaded", []) if d.get("status") != "failed"]
            if total == 0 or not downloaded:
                count += 1
    return count


def _check_manifest_staleness(slug: str) -> tuple[bool, str]:
    """Compare mtime(script-*.md) to mtime(assembly-manifest.json).
    Returns (is_stale, human-readable drift string).
    """
    ep_dir = EPISODES_DIR / slug
    data_dir = REMOTION_DATA / slug
    manifest = data_dir / "assembly-manifest.json"
    if not manifest.is_file():
        return False, ""
    manifest_mtime = manifest.stat().st_mtime
    scripts: list[Path] = []
    for pattern in ("script-v*-production.md", "script-production.md", "script.md"):
        scripts.extend(ep_dir.glob(pattern))
    if not scripts:
        return False, ""
    newest = max(scripts, key=lambda p: p.stat().st_mtime)
    drift = newest.stat().st_mtime - manifest_mtime
    if drift <= 60:  # within same edit session
        return False, ""
    if drift < 3600:
        return True, f"{int(drift / 60)} min"
    if drift < 86400:
        return True, f"{drift / 3600:.1f} h"
    return True, f"{drift / 86400:.1f} d"


def _detect_script_version(ep_dir: Path) -> tuple[Optional[str], Optional[str]]:
    """Return (version string like 'v3', mtime ISO) for the newest script file."""
    scripts: list[Path] = []
    for pattern in ("script-v*-production.md", "script-production.md", "script.md"):
        scripts.extend(ep_dir.glob(pattern))
    if not scripts:
        return None, None
    newest = max(scripts, key=lambda p: p.stat().st_mtime)
    version_match = re.search(r"script-v(\d+)-production\.md", newest.name)
    version = f"v{version_match.group(1)}" if version_match else None
    mtime = datetime.datetime.fromtimestamp(newest.stat().st_mtime).isoformat(timespec="minutes")
    return version, mtime


def _build_health_summary(s: "EpisodeStatus") -> str:
    """Compact one-line health string for PIPELINE.md's Health column."""
    parts: list[str] = []
    if s.manifest_stale:
        parts.append(f"⚠ stale manifest ({s.manifest_stale_drift_str})")
    if s.zero_hit_count > 0:
        parts.append(f"🔴 {s.zero_hit_count} zero-hit shot{'s' if s.zero_hit_count != 1 else ''}")
    if s.has_manifest and not s.has_render:
        parts.append("✗ never rendered")
    if s.has_render and not s.has_narration:
        parts.append("✗ no narration")
    if not parts:
        if s.state == "INCUBATING":
            return "⏸ awaiting promotion"
        if s.state == "RETROED":
            return "✓ shipped"
        return "✓ clean"
    return " · ".join(parts)


def compute_episode_status(entry: StateEntry) -> EpisodeStatus:
    """Snapshot one episode by walking filesystem + helpers. No writes."""
    slug = entry.slug
    ep_dir = EPISODES_DIR / slug
    data_dir = REMOTION_DATA / slug

    # Artifact presence
    has_research = (ep_dir / "brief.md").is_file()
    has_angle_memo = (ep_dir / "angle-memo.md").is_file()
    has_script = bool(_first_match(ep_dir, "script-v*-production.md", "script-production.md", "script.md"))
    has_visual_spec = (ep_dir / "visual-spec.md").is_file()
    has_audio_cue_sheet = (ep_dir / "audio-cue-sheet.md").is_file()
    has_manifest = (data_dir / "assembly-manifest.json").is_file()
    has_narration = (ep_dir / "assets" / "narration.wav").is_file()
    # Render check: look for a full-episode output named <slug>-full.mp4 or similar
    out_dir = ROOT / "remotion-templates" / "out"
    has_render = bool(list(out_dir.glob(f"{slug}-full*.mp4"))) if out_dir.is_dir() else False
    has_thumbnails = (ep_dir / "thumbnail-spec.json").is_file()

    # Counts
    data_files = len(list(data_dir.glob("*.json"))) - (1 if has_manifest else 0) if data_dir.is_dir() else 0
    assets_dir = ep_dir / "assets"
    stills_dir = assets_dir / "stills"
    clips_dir = assets_dir / "clips"
    asset_stills = len(list(stills_dir.glob("*"))) if stills_dir.is_dir() else 0
    asset_clips = len(list(clips_dir.glob("*"))) if clips_dir.is_dir() else 0

    # Manifest details
    manifest_segments = 0
    manifest_duration_sec = 0.0
    manifest_mode = "missing"
    if has_manifest:
        try:
            m = json.loads((data_dir / "assembly-manifest.json").read_text(encoding="utf-8"))
            manifest_segments = len(m.get("segments", []))
            manifest_duration_sec = float(m.get("totalDurationSec", 0))
            manifest_mode = m.get("mode", "estimate")
        except (OSError, json.JSONDecodeError):
            pass

    # Zero-hit count
    zero_hit_count = _count_zero_hits(slug)

    # Cost
    cost_totals = _read_cost_log()
    cost_usd = cost_totals.get(slug, 0.0)

    # Manifest staleness
    is_stale, drift_str = _check_manifest_staleness(slug)

    # Script version detection
    script_version, script_mtime = _detect_script_version(ep_dir)

    # Stage index
    try:
        stage_idx = STATE_ORDER.index(entry.state)
    except ValueError:
        stage_idx = -1  # BLOCKED/REVISING/unknown

    status = EpisodeStatus(
        slug=slug,
        state=entry.state,
        days_in_state=entry.days_in_state,
        days_to_target=entry.days_to_target,
        target_publish=entry.target_publish.isoformat() if entry.target_publish else None,
        format=entry.format,
        notes=entry.notes,
        has_research=has_research,
        has_angle_memo=has_angle_memo,
        has_script=has_script,
        has_visual_spec=has_visual_spec,
        has_audio_cue_sheet=has_audio_cue_sheet,
        has_manifest=has_manifest,
        has_narration=has_narration,
        has_render=has_render,
        has_thumbnails=has_thumbnails,
        data_files=data_files,
        asset_stills=asset_stills,
        asset_clips=asset_clips,
        manifest_segments=manifest_segments,
        manifest_duration_sec=manifest_duration_sec,
        manifest_mode=manifest_mode,
        zero_hit_count=zero_hit_count,
        cost_usd=cost_usd,
        manifest_stale=is_stale,
        manifest_stale_drift_str=drift_str,
        script_version=script_version,
        script_mtime=script_mtime,
        stage_idx=stage_idx,
    )
    status.health_summary = _build_health_summary(status)
    return status


# ── write_status_md ──────────────────────────────────────────────────────────

STAGE_LABELS = [
    ("research", "research (brief + audit)"),
    ("angle_memo", "angle-memo"),
    ("script", "script (production)"),
    ("visual_spec", "visual-spec + data files"),
    ("manifest", "assembly-manifest"),
    ("assets", "assets sourced"),
    ("render", "full-episode render"),
    ("narration", "narration recorded"),
    ("thumbnails", "thumbnails"),
]


def _progress_bar(done: int, total: int, width: int = 10) -> str:
    """Unicode block-element progress bar."""
    if total <= 0:
        return "▱" * width
    filled = round(done / total * width)
    return "▰" * filled + "▱" * (width - filled)


def _status_check(done: bool, in_progress: bool = False, warn: bool = False) -> str:
    """Return one of: ✓ done, ⚠ warning, ✗ missing, ○ not yet started."""
    if done and warn:
        return "⚠"
    if done:
        return "✓"
    if in_progress:
        return "⚠"
    return "✗"


def render_status_md(s: EpisodeStatus) -> str:
    """Render the per-episode _status.md dashboard string."""
    today = datetime.date.today().isoformat()
    lines: list[str] = [
        f"# Status — {s.slug}",
        f"> Auto-generated {today} by `tools/pipeline_validator.py --write-status`.",
        f"> **Do not edit by hand.** Re-run the tool to refresh.",
        f"> Hand-edit `episodes/PIPELINE.md` for state changes (the narrative + at-a-glance table).",
        "",
        f"**State:** {s.state} · day {s.days_in_state} in state"
        + (f" · target {s.target_publish}" if s.target_publish else "")
        + (f" ({s.days_to_target:+d} days)" if s.days_to_target is not None else ""),
    ]
    if s.format:
        lines.append(f"**Format:** {s.format}")
    lines.append("")

    # ── Progress meter ─────────────────────────────────────────────────────────
    if s.stage_idx >= 0:
        bar = _progress_bar(s.stage_idx + 1, s.stage_total)
        lines.append(f"## Progress  {bar}  {s.stage_idx + 1} of {s.stage_total} stages")
    else:
        lines.append(f"## Progress  (off-lifecycle state: {s.state})")
    lines.append("")

    # ── Done / In-progress / Blocked checklist ─────────────────────────────────
    lines.extend([
        f"{_status_check(s.has_research)} research (brief + audit)",
        f"{_status_check(s.has_angle_memo)} angle-memo",
    ])
    script_note = ""
    if s.has_script and s.script_version:
        script_note = f" — {s.script_version}, modified {s.script_mtime}"
    elif s.has_script:
        script_note = f" — modified {s.script_mtime}" if s.script_mtime else ""
    lines.append(f"{_status_check(s.has_script)} script-production.md{script_note}")
    lines.append(f"{_status_check(s.has_visual_spec)} visual-spec")
    if s.has_manifest:
        mode_note = f" ({s.manifest_mode} mode · {s.manifest_segments} segments · {s.manifest_duration_sec:.1f}s)"
        manifest_check = _status_check(True, warn=s.manifest_stale)
        lines.append(f"{manifest_check} assembly-manifest{mode_note}")
    else:
        lines.append("✗ assembly-manifest (run `generate_manifest.py`)")
    lines.append(f"{_status_check(s.has_audio_cue_sheet)} audio-cue-sheet")
    data_files_note = f" ({s.data_files} files)" if s.data_files > 0 else ""
    lines.append(f"{_status_check(s.data_files > 0)} data files (Remotion templates){data_files_note}")
    assets_note = ""
    if s.asset_stills or s.asset_clips:
        assets_note = f" ({s.asset_stills} stills · {s.asset_clips} clips"
        if s.zero_hit_count:
            assets_note += f" · {s.zero_hit_count} zero-hit shots unresolved"
        assets_note += ")"
    elif s.zero_hit_count:
        assets_note = f" ({s.zero_hit_count} zero-hit shots — no assets generated yet)"
    assets_done = (s.asset_stills > 0 or s.asset_clips > 0) and s.zero_hit_count == 0
    assets_check = _status_check(assets_done or s.asset_stills > 0, warn=s.zero_hit_count > 0)
    lines.append(f"{assets_check} assets{assets_note}")
    lines.append(f"{_status_check(s.has_render)} full-episode render")
    lines.append(f"{_status_check(s.has_narration)} narration recorded")
    lines.append(f"{_status_check(s.has_thumbnails)} thumbnail-spec")
    lines.append("")

    # ── Health checks ──────────────────────────────────────────────────────────
    lines.append("## Health")
    health_lines: list[str] = []
    if s.manifest_stale:
        health_lines.append(
            f"🔴 M-MANIFEST-STALE  script ({s.script_mtime}) > manifest "
            f"(drift {s.manifest_stale_drift_str})"
        )
        health_lines.append(f"   → fix: `python3 tools/assembly/generate_manifest.py {s.slug}`")
    if s.zero_hit_count > 0:
        health_lines.append(
            f"🟡 {s.zero_hit_count} zero-hit shot{'s' if s.zero_hit_count != 1 else ''} "
            f"in episodes/{s.slug}/assets/"
        )
        health_lines.append(f"   → fix: `python3 tools/asset-source/zerohit_fallback.py {s.slug}`")
    if s.has_manifest and s.manifest_mode == "estimate" and s.has_narration:
        health_lines.append(
            "🟡 Manifest in estimate mode but narration recorded — regenerate in precise mode"
        )
        health_lines.append(f"   → fix: `python3 tools/assembly/generate_manifest.py {s.slug} --audio`")
    if s.has_manifest and not s.has_render:
        health_lines.append("🟡 Manifest ready but episode never rendered")
        health_lines.append(f"   → fix: `cd remotion-templates && node scripts/render-episode.mjs --episode={s.slug}`")
    if not health_lines:
        health_lines.append("🟢 No health issues detected")
    lines.extend(health_lines)
    lines.append("")

    # ── By the numbers ─────────────────────────────────────────────────────────
    lines.append("## By the numbers")
    lines.append("")
    nums: list[tuple[str, str]] = []
    if s.cost_usd > 0:
        nums.append(("Cost so far", f"${s.cost_usd:.2f}"))
    if s.manifest_duration_sec > 0:
        nums.append(("Duration", f"{s.manifest_duration_sec / 60:.1f} min ({s.manifest_duration_sec:.1f}s)"))
    if s.manifest_segments > 0:
        nums.append(("Segments", str(s.manifest_segments)))
    if s.data_files > 0:
        nums.append(("Data files", str(s.data_files)))
    nums.append(("Days in state", str(s.days_in_state)))
    if s.days_to_target is not None:
        nums.append(("Days to target", f"{s.days_to_target:+d}"))
    width = max(len(label) for label, _ in nums)
    for label, val in nums:
        lines.append(f"`{label:<{width}}`  {val}")
    lines.append("")

    # ── Editorial note (from pipeline-state.json) ─────────────────────────────
    if s.notes:
        lines.append("## Notes")
        lines.append("")
        lines.append(s.notes)
        lines.append("")

    lines.append("---")
    lines.append("")
    lines.append(
        f"_Regenerate this file: `python3 tools/pipeline_validator.py --write-status {s.slug}` "
        f"or run `./scripts/check-episode.sh {s.slug}` (auto-refreshes)._"
    )
    return "\n".join(lines) + "\n"


# ── update_tracker_health: write Health column into PIPELINE.md ──────────────

PIPELINE_TABLE_RE = re.compile(
    r"(## At a glance\s*\n\s*\n"
    r"\| Episode\s*\|.*?\|\s*Health\s*\|\s*\n"
    r"\|[-: ]+(?:\|[-: ]+)+\|\s*\n)"
    r"((?:\|.*?\|\s*\n)+)",
    re.MULTILINE,
)


def _format_tracker_row(s: EpisodeStatus) -> str:
    """Render one row of the At-a-glance table."""
    state_badge_map = {
        "INCUBATING":      "💭 INCUBATING",
        "VIABLE":          "🟢 VIABLE",
        "RESEARCHING":     "📚 RESEARCHING",
        "RESEARCH READY":  "✅ RESEARCH READY",
        "DRAFTING":        "✍️ DRAFTING",
        "RENDER READY":    "🎬 RENDER READY",
        "IN POST":         "🎞️ IN POST",
        "PUBLISHED":       "🚀 PUBLISHED",
        "RETROED":         "📊 RETROED",
        "BLOCKED":         "🛑 BLOCKED",
        "REVISING":        "🔄 REVISING",
    }
    badge = state_badge_map.get(s.state, s.state)
    target = s.target_publish or "—"
    return f"| `{s.slug}` | {badge} | {s.days_in_state} | {target} | {s.health_summary} |"


def update_tracker_health(statuses: list[EpisodeStatus]) -> bool:
    """Update the At-a-glance table in PIPELINE.md in place. Returns True if changed."""
    if not PIPELINE_MD.is_file():
        return False
    text = PIPELINE_MD.read_text(encoding="utf-8")
    m = PIPELINE_TABLE_RE.search(text)
    if not m:
        # Table not present yet — first migration; caller should run --bootstrap-tracker
        return False
    header, _old_body = m.group(1), m.group(2)
    new_body = "\n".join(_format_tracker_row(s) for s in statuses) + "\n"
    new_text = text.replace(m.group(0), header + new_body, 1)
    if new_text != text:
        PIPELINE_MD.write_text(new_text, encoding="utf-8")
        return True
    return False


def write_status(s: EpisodeStatus) -> Path:
    """Write _status.md for one episode. Returns the path."""
    ep_dir = EPISODES_DIR / s.slug
    ep_dir.mkdir(parents=True, exist_ok=True)
    out_path = ep_dir / "_status.md"
    out_path.write_text(render_status_md(s), encoding="utf-8")
    return out_path


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
    parser.add_argument(
        "--no-checkpoint",
        action="store_true",
        help="Skip writing _checkpoint.md files (check-only mode).",
    )
    parser.add_argument(
        "--fix",
        action="store_true",
        help=(
            "Promote the latest versioned draft to canonical filename for any "
            "episode that has naming drift (canonical missing, versioned present). "
            "Runs before validation so the subsequent check reflects the fix. "
            "Does NOT delete intermediate versions — review manually."
        ),
    )
    parser.add_argument(
        "--write-status",
        action="store_true",
        help=(
            "Write episodes/<slug>/_status.md per-episode operational dashboard "
            "(from pipeline-state.json + filesystem walk). Skips the old "
            "validation/checkpoint flow when used alone."
        ),
    )
    parser.add_argument(
        "--update-tracker",
        action="store_true",
        help=(
            "Update the At-a-glance table's Health column in episodes/PIPELINE.md "
            "in place. Pairs with --write-status (typically use both together)."
        ),
    )
    args = parser.parse_args()

    # ── --write-status / --update-tracker path ────────────────────────────────
    # When either flag is set, run the new pipeline-state-driven flow and exit.
    # The legacy PIPELINE.md-parsing validation path runs only when neither
    # new flag is set (back-compat for existing callers).
    if args.write_status or args.update_tracker:
        state_entries = load_pipeline_state()
        if not state_entries:
            print("✗ episodes/pipeline-state.json not found or empty", file=sys.stderr)
            return 2
        if args.episode:
            state_entries = [e for e in state_entries if e.slug == args.episode]
            if not state_entries:
                print(f"✗ episode '{args.episode}' not found in pipeline-state.json", file=sys.stderr)
                return 2
        statuses = [compute_episode_status(e) for e in state_entries]
        if args.write_status:
            for s in statuses:
                path = write_status(s)
                print(f"✓ wrote {path.relative_to(ROOT)}")
        if args.update_tracker:
            # Always compute statuses for ALL episodes when updating the tracker,
            # since the table is global. If args.episode was passed we'd miss rows.
            if args.episode:
                all_entries = load_pipeline_state()
                all_statuses = [compute_episode_status(e) for e in all_entries]
            else:
                all_statuses = statuses
            changed = update_tracker_health(all_statuses)
            print(f"{'✓ updated' if changed else '✓ no change to'} episodes/PIPELINE.md (At-a-glance Health column)")
        return 0

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

    # ── --fix: promote versioned drafts to canonical before validation ─────────
    if args.fix:
        fix_summary: list[str] = []
        for row in rows:
            ep_dir = EPISODES_DIR / row.slug
            if not ep_dir.is_dir():
                continue
            renames = fix_naming_drift(ep_dir)
            if renames:
                fix_summary.append(f"\n  {row.slug}:")
                fix_summary.extend(renames)
        if fix_summary:
            print("\n── Naming drift fixes " + "─" * 35)
            for line in fix_summary:
                print(line)
            print()
        else:
            print("\n  ✓ No naming drift to fix — all canonical files present.\n")

    reports = [validate_episode(r) for r in rows]
    checkpoints_written: list[str] = []
    for rep in reports:
        print_report(rep)
        if not args.no_checkpoint:
            ep_dir   = EPISODES_DIR / rep.slug
            data_dir = REMOTION_DATA / rep.slug
            if ep_dir.is_dir():
                write_checkpoint(
                    next(r for r in rows if r.slug == rep.slug),
                    ep_dir, data_dir,
                )
                checkpoints_written.append(rep.slug)

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
    if checkpoints_written:
        print(f"  Checkpoints written: "
              + ", ".join(f"episodes/{s}/_checkpoint.md" for s in checkpoints_written))
    print()

    if total_errors:
        return 1
    if args.strict and total_warnings:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
