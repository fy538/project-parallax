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

May-17 additions — pipeline-state.json-driven dashboard + tracker refresh:
  python3 tools/pipeline_validator.py --write-status                # all eps
  python3 tools/pipeline_validator.py --write-status silicon-trap   # one ep
  python3 tools/pipeline_validator.py --update-tracker              # PIPELINE.md
  python3 tools/pipeline_validator.py --write-status --update-tracker  # both
  python3 tools/pipeline_validator.py --check-only                  # dry-run
  python3 tools/pipeline_validator.py --check-only silicon-trap     # one ep

When --write-status / --update-tracker / --check-only is set, the script
reads state from `episodes/pipeline-state.json` and bypasses the legacy
validation flow. Wired into scripts/check-episode.sh as the post-check
refresh (auto-runs after every per-episode validation). `--check-only`
is useful as a pre-commit gate or to preview what --write-status /
--update-tracker would do; exits 1 if any episode has health warnings.

Exit 0 if clean, 1 if errors found (or warnings under --strict).
"""

import argparse
import datetime
import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "shared"))
from paths import get_project_root

ROOT = get_project_root()
PIPELINE_MD   = ROOT / "episodes" / "PIPELINE.md"
EPISODES_DIR  = ROOT / "episodes"
REMOTION_DATA = ROOT / "remotion-templates" / "data" / "episodes"

# ── Thresholds ────────────────────────────────────────────────────────────────

STALL_WARN_DAYS  = 7    # warn if days in state exceeds this
STALL_ALERT_DAYS = 21   # error if days in state exceeds this

# Manifest-staleness thresholds (used by _check_manifest_staleness)
STALENESS_TOLERANCE_SEC = 60.0      # script edits within this of manifest = same session
SECONDS_PER_HOUR        = 3600.0
SECONDS_PER_DAY         = 86400.0

# States that should not trigger stall warnings
NON_STALLING_STATES = {"PUBLISHED", "RETROED", "BLOCKED", "INCUBATING"}

# States where a populated "Blocked on" is expected
BLOCKED_STATES = {"BLOCKED", "REVISING"}

# Canonical pipeline order (higher index = more advanced)
STATE_ORDER = [
    "INCUBATING", "VIABLE", "RESEARCHING", "RESEARCH READY",
    "DRAFTING", "RENDER READY", "IN POST", "PUBLISHED", "RETROED",
]

# Per-state emoji badge for the At-a-glance table in PIPELINE.md.
# Keep in sync with STATE_ORDER + failure states. When adding a new state,
# add it to BOTH STATE_ORDER (or the failure set) AND this map.
STATE_BADGES: dict[str, str] = {
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


# ── Episode-row shape (legacy validate_episode contract) ─────────────────────

@dataclass
class EpisodeRow:
    """Legacy-shape input to validate_episode() / write_checkpoint().

    Kept for back-compat with the original validation flow. Modern callers
    should consume StateEntry from load_pipeline_state() directly — the
    pipeline-state.json schema is the single source of truth for state +
    dates as of the May-17 refactor.
    """
    slug: str
    state: str
    days_in_state: int
    blocked_on: str          # "—" means none


def parse_pipeline_md() -> list[EpisodeRow]:
    """Legacy entry point — now delegates to load_pipeline_state().

    BEFORE THE MAY-17 REFACTOR this function regex-parsed the markdown
    table in PIPELINE.md to extract slug/state/days/blocked_on. The
    parser was brittle (any column reorder broke it) AND duplicated
    state information that already lived in pipeline-state.json.

    NOW this is a shim that loads from JSON and converts to the legacy
    EpisodeRow shape. The validate_episode() / write_checkpoint() code
    paths downstream don't need to change; they keep consuming
    EpisodeRow records.

    Returns empty list and prints a warning if pipeline-state.json is
    missing — same semantics as before but with a better diagnostic.
    """
    entries = load_pipeline_state()
    if not entries:
        if not PIPELINE_STATE_JSON.is_file():
            print(f"✗ {PIPELINE_STATE_JSON} not found — required for state lookup", file=sys.stderr)
            sys.exit(1)
        return []
    return [
        EpisodeRow(
            slug=e.slug,
            state=e.state,
            days_in_state=e.days_in_state,
            blocked_on=e.blocked_on,
        )
        for e in entries
    ]


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


def _first_match(ep_dir: Path, *globs: str) -> Path | None:
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
        detail = "asset-manifest.json" if (asset_manifest and asset_manifest.exists()) \
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
        "> Refresh: `python3 tools/pipeline_validator.py`",
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
    lines.append("---")
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
    format: str | None
    target_publish: datetime.date | None
    blocked_on: str = "—"   # "—" means none; populated when state is BLOCKED/REVISING
    notes: str = ""

    @property
    def days_in_state(self) -> int:
        return (datetime.date.today() - self.state_entered_at).days

    @property
    def days_to_target(self) -> int | None:
        if self.target_publish is None:
            return None
        return (self.target_publish - datetime.date.today()).days


def load_pipeline_state() -> list[StateEntry]:
    """Parse episodes/pipeline-state.json into typed entries.

    SINGLE source of truth for episode state + dates. Both the legacy
    validation flow (validate_episode) and the new dashboard flow
    (compute_episode_status) read from here. parse_pipeline_md() is a
    thin shim over this function for back-compat with code paths that
    expect the older EpisodeRow shape.
    """
    if not PIPELINE_STATE_JSON.is_file():
        return []
    data = json.loads(PIPELINE_STATE_JSON.read_text(encoding="utf-8"))
    out: list[StateEntry] = []
    for e in data.get("episodes", []):
        target = e.get("targetPublish")
        blocked = e.get("blockedOn")
        out.append(StateEntry(
            slug=e["slug"],
            state=e["state"],
            state_entered_at=datetime.date.fromisoformat(e["stateEnteredAt"]),
            format=e.get("format"),
            target_publish=datetime.date.fromisoformat(target) if target else None,
            blocked_on=blocked if blocked else "—",
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
    """Comprehensive operational snapshot for one episode.

    All fields are raw data — no derived display strings stored. Derived
    fields (health_summary, target_publish display, script_mtime display)
    are computed at render time via properties, NOT mutated after
    construction. This keeps the dataclass a pure data carrier.
    """
    slug: str
    state: str
    days_in_state: int
    days_to_target: int | None
    target_publish: datetime.date | None   # raw date, not formatted
    format: str | None
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
    zero_hit_count: int             # from zerohit_fallback.find_zero_hit_shots
    cost_usd: float

    # Health signals
    manifest_stale: bool            # script mtime > manifest mtime + tolerance
    manifest_stale_drift_str: str   # human-readable e.g. "6 days"
    script_version: str | None   # e.g. "v3"
    script_mtime: datetime.datetime | None   # raw datetime, not formatted

    # Stage progress
    stage_idx: int                  # position in STATE_ORDER (0-8), -1 off-lifecycle

    @property
    def stage_total(self) -> int:
        return len(STATE_ORDER)

    @property
    def target_publish_iso(self) -> str | None:
        """ISO date string for display, or None."""
        return self.target_publish.isoformat() if self.target_publish else None

    @property
    def script_mtime_iso(self) -> str | None:
        """ISO datetime for display (minute precision), or None."""
        return self.script_mtime.isoformat(timespec="minutes") if self.script_mtime else None

    @property
    def health_summary(self) -> str:
        """Compact one-line health string for PIPELINE.md's Health column.
        Derived; not stored, so it always reflects current field values."""
        parts: list[str] = []
        if self.manifest_stale:
            parts.append(f"⚠ stale manifest ({self.manifest_stale_drift_str})")
        if self.zero_hit_count > 0:
            parts.append(f"🔴 {self.zero_hit_count} zero-hit shot{'s' if self.zero_hit_count != 1 else ''}")
        if self.has_manifest and not self.has_render:
            parts.append("✗ never rendered")
        if self.has_render and not self.has_narration:
            parts.append("✗ no narration")
        if not parts:
            if self.state == "INCUBATING":
                return "⏸ awaiting promotion"
            if self.state == "RETROED":
                return "✓ shipped"
            return "✓ clean"
        return " · ".join(parts)


def _read_cost_log(cost_log_path: Path | None = None) -> dict[str, float]:
    """Parse episodes/COST_LOG.md → {episode_slug: total_usd}.

    Expected row format (markdown table):
        | YYYY-MM-DD | episode-slug | service | amount_usd | note |

    Tolerates:
      - Variable whitespace within cells
      - Negative amounts (refunds; uncommon but valid)
      - Decimal or integer amounts (`5`, `5.0`, `5.00`, `0.04`)
      - Leading/trailing whitespace in slug cell
      - Skips rows with non-date first cell (header/separator/conventions text)
      - Skips rows where slug is `(system)` or starts with `(` (synthetic
        rows like the cost-log initialization marker)

    `cost_log_path` argument exists for tests; production callers omit it
    to use the canonical episodes/COST_LOG.md path.
    """
    path = cost_log_path or (EPISODES_DIR / "COST_LOG.md")
    if not path.is_file():
        return {}
    totals: dict[str, float] = {}
    # `-?` allows refund rows; `\d+(?:\.\d+)?` accepts integer OR decimal.
    row_re = re.compile(
        r"^\|\s*\d{4}-\d{2}-\d{2}\s*"          # date column
        r"\|\s*([^|]+?)\s*"                    # episode slug (group 1)
        r"\|\s*[^|]+?\s*"                      # service (discarded)
        r"\|\s*(-?\d+(?:\.\d+)?)\s*"           # amount_usd (group 2)
        r"\|"
    )
    for line in path.read_text(encoding="utf-8").splitlines():
        m = row_re.match(line)
        if not m:
            continue
        slug = m.group(1).strip()
        # Skip synthetic / system rows
        if slug.startswith("(") or not slug:
            continue
        amount = float(m.group(2))
        totals[slug] = totals.get(slug, 0.0) + amount
    return totals


def _count_zero_hits(slug: str) -> int:
    """Count zero-hit shots in episodes/<slug>/assets/**/asset-manifest.json.

    Delegates to zerohit_fallback.find_zero_hit_shots so the "zero hit"
    definition lives in one place (asset-source module). Walks every
    asset-manifest.json in the episode tree because a single episode can
    have multiple sourcing batches.
    """
    # Local import — keeps the dependency edge intentional and avoids
    # an import-time cycle if zerohit_fallback ever imports from us.
    sys.path.insert(0, str(Path(__file__).resolve().parent / "asset-source"))
    try:
        import zerohit_fallback as zf
    except ImportError:
        return 0

    ep_dir = EPISODES_DIR / slug
    if not ep_dir.is_dir():
        return 0
    count = 0
    for am in ep_dir.rglob("asset-manifest.json"):
        try:
            manifest = json.loads(am.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        count += len(zf.find_zero_hit_shots(manifest))
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
    if drift <= STALENESS_TOLERANCE_SEC:  # within same edit session
        return False, ""
    if drift < SECONDS_PER_HOUR:
        return True, f"{int(drift / 60)} min"
    if drift < SECONDS_PER_DAY:
        return True, f"{drift / SECONDS_PER_HOUR:.1f} h"
    return True, f"{drift / SECONDS_PER_DAY:.1f} d"


def _detect_script_version(ep_dir: Path) -> tuple[str | None, datetime.datetime | None]:
    """Return (version string like 'v3', raw mtime datetime) for the newest script file."""
    scripts: list[Path] = []
    for pattern in ("script-v*-production.md", "script-production.md", "script.md"):
        scripts.extend(ep_dir.glob(pattern))
    if not scripts:
        return None, None
    newest = max(scripts, key=lambda p: p.stat().st_mtime)
    version_match = re.search(r"script-v(\d+)-production\.md", newest.name)
    version = f"v{version_match.group(1)}" if version_match else None
    mtime = datetime.datetime.fromtimestamp(newest.stat().st_mtime)
    return version, mtime


# ── compute_episode_status — composed of small single-purpose helpers ────────
# Each helper handles one signal source so the per-source logic is testable
# in isolation and easy to extend without grepping a 100-line function.

# Pattern for template data files Remotion consumes. Used by _count_data_files
# to exclude non-template configs (backdrop-manifest, music-bed-config, etc.).
_TEMPLATE_DATA_FILE_RE = re.compile(
    r"^(?:annotated|arc|atlas|bayesian|beeswarm|bump|calendar|cartogram|chart|"
    r"choropleth|connected|datachart|decision|density|dumbbell|dueling|"
    r"escalation|framework|gameboard|horizon|horizontal|image|isotype|"
    r"kinetic|map|marimekko|network|photo|population|pricing|probability|"
    r"proportional|radar|rank|ridgeline|route|sankey|split|stat|strategic|"
    r"streamgraph|template|ternary|tilegram|timeline|timeseries|title)"
    r"[\w-]*\.json$",
    re.IGNORECASE,
)


def _gather_artifacts(ep_dir: Path, data_dir: Path, slug: str) -> dict:
    """File-presence checks. Returns {has_research, has_script, has_manifest, …}."""
    out_dir = ROOT / "remotion-templates" / "out"
    return {
        "has_research":       (ep_dir / "brief.md").is_file(),
        "has_angle_memo":     (ep_dir / "angle-memo.md").is_file(),
        "has_script":         bool(_first_match(ep_dir, "script-v*-production.md",
                                                "script-production.md", "script.md")),
        "has_visual_spec":    (ep_dir / "visual-spec.md").is_file(),
        "has_audio_cue_sheet": (ep_dir / "audio-cue-sheet.md").is_file(),
        "has_manifest":       (data_dir / "assembly-manifest.json").is_file(),
        "has_narration":      (ep_dir / "assets" / "narration.wav").is_file(),
        "has_render":         bool(list(out_dir.glob(f"{slug}-full*.mp4"))) if out_dir.is_dir() else False,
        "has_thumbnails":     (ep_dir / "thumbnail-spec.json").is_file(),
    }


def _count_data_files(data_dir: Path) -> int:
    """Count Remotion template data files (excludes manifest + non-template configs).

    Uses a pattern allowlist of known template prefixes (datachart-, kinetic-,
    framework-, etc.) so episode dirs that happen to contain
    `backdrop-manifest.json`, `music-bed-config.json`, etc. don't inflate the
    count. Replaces the brittle `len(*.json) - 1` heuristic.
    """
    if not data_dir.is_dir():
        return 0
    return sum(1 for p in data_dir.glob("*.json") if _TEMPLATE_DATA_FILE_RE.match(p.name))


def _count_assets(ep_dir: Path) -> tuple[int, int]:
    """Count files in assets/stills and assets/clips. Returns (stills, clips)."""
    assets_dir = ep_dir / "assets"
    stills_dir = assets_dir / "stills"
    clips_dir = assets_dir / "clips"
    stills = len(list(stills_dir.glob("*"))) if stills_dir.is_dir() else 0
    clips = len(list(clips_dir.glob("*"))) if clips_dir.is_dir() else 0
    return stills, clips


def _read_manifest_info(data_dir: Path) -> tuple[int, float, str]:
    """Returns (segment_count, totalDurationSec, mode) from assembly-manifest.json."""
    manifest = data_dir / "assembly-manifest.json"
    if not manifest.is_file():
        return 0, 0.0, "missing"
    try:
        m = json.loads(manifest.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return 0, 0.0, "missing"
    return (
        len(m.get("segments", [])),
        float(m.get("totalDurationSec", 0)),
        m.get("mode", "estimate"),
    )


def _stage_idx_for(state: str) -> int:
    """Return position in STATE_ORDER, or -1 for off-lifecycle (BLOCKED/REVISING)."""
    try:
        return STATE_ORDER.index(state)
    except ValueError:
        return -1


def compute_episode_status(entry: StateEntry) -> EpisodeStatus:
    """Snapshot one episode by composing single-purpose readers. No writes.

    Each piece of data comes from a small helper:
      _gather_artifacts        artifact presence booleans
      _count_data_files        template-data file count (allowlist-filtered)
      _count_assets            stills + clips counts
      _read_manifest_info      segment/duration/mode from manifest JSON
      _count_zero_hits         delegates to zerohit_fallback module
      _read_cost_log           parses COST_LOG.md per-episode totals
      _check_manifest_staleness  script-vs-manifest mtime drift
      _detect_script_version   newest script + version + mtime
      _stage_idx_for           STATE_ORDER position
    """
    slug = entry.slug
    ep_dir = EPISODES_DIR / slug
    data_dir = REMOTION_DATA / slug

    artifacts = _gather_artifacts(ep_dir, data_dir, slug)
    asset_stills, asset_clips = _count_assets(ep_dir)
    manifest_segments, manifest_duration_sec, manifest_mode = _read_manifest_info(data_dir)
    is_stale, drift_str = _check_manifest_staleness(slug)
    script_version, script_mtime = _detect_script_version(ep_dir)

    return EpisodeStatus(
        slug=slug,
        state=entry.state,
        days_in_state=entry.days_in_state,
        days_to_target=entry.days_to_target,
        target_publish=entry.target_publish,
        format=entry.format,
        notes=entry.notes,
        **artifacts,
        data_files=_count_data_files(data_dir),
        asset_stills=asset_stills,
        asset_clips=asset_clips,
        manifest_segments=manifest_segments,
        manifest_duration_sec=manifest_duration_sec,
        manifest_mode=manifest_mode,
        zero_hit_count=_count_zero_hits(slug),
        cost_usd=_read_cost_log().get(slug, 0.0),
        manifest_stale=is_stale,
        manifest_stale_drift_str=drift_str,
        script_version=script_version,
        script_mtime=script_mtime,
        stage_idx=_stage_idx_for(entry.state),
    )


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


def _render_header(s: EpisodeStatus) -> list[str]:
    """Title + auto-gen banner + State/Format header lines."""
    today = datetime.date.today().isoformat()
    target_clause = ""
    if s.target_publish_iso:
        target_clause = f" · target {s.target_publish_iso}"
        if s.days_to_target is not None:
            target_clause += f" ({s.days_to_target:+d} days)"
    lines = [
        f"# Status — {s.slug}",
        f"> Auto-generated {today} by `tools/pipeline_validator.py --write-status`.",
        "> **Do not edit by hand.** Re-run the tool to refresh.",
        "> Hand-edit `episodes/PIPELINE.md` for state changes (the narrative + at-a-glance table).",
        "",
        f"**State:** {s.state} · day {s.days_in_state} in state{target_clause}",
    ]
    if s.format:
        lines.append(f"**Format:** {s.format}")
    lines.append("")
    return lines


def _render_progress(s: EpisodeStatus) -> list[str]:
    """Progress bar + stage counter."""
    if s.stage_idx >= 0:
        bar = _progress_bar(s.stage_idx + 1, s.stage_total)
        return [f"## Progress  {bar}  {s.stage_idx + 1} of {s.stage_total} stages", ""]
    return [f"## Progress  (off-lifecycle state: {s.state})", ""]


def _render_checklist(s: EpisodeStatus) -> list[str]:
    """Done/in-progress/blocked artifact checklist."""
    lines: list[str] = [
        f"{_status_check(s.has_research)} research (brief + audit)",
        f"{_status_check(s.has_angle_memo)} angle-memo",
    ]
    script_note = ""
    if s.has_script and s.script_version and s.script_mtime_iso:
        script_note = f" — {s.script_version}, modified {s.script_mtime_iso}"
    elif s.has_script and s.script_mtime_iso:
        script_note = f" — modified {s.script_mtime_iso}"
    lines.append(f"{_status_check(s.has_script)} script-production.md{script_note}")
    lines.append(f"{_status_check(s.has_visual_spec)} visual-spec")
    if s.has_manifest:
        mode_note = f" ({s.manifest_mode} mode · {s.manifest_segments} segments · {s.manifest_duration_sec:.1f}s)"
        lines.append(f"{_status_check(True, warn=s.manifest_stale)} assembly-manifest{mode_note}")
    else:
        lines.append("✗ assembly-manifest (run `generate_manifest.py`)")
    lines.append(f"{_status_check(s.has_audio_cue_sheet)} audio-cue-sheet")
    data_files_note = f" ({s.data_files} files)" if s.data_files > 0 else ""
    lines.append(f"{_status_check(s.data_files > 0)} data files (Remotion templates){data_files_note}")
    lines.append(_render_assets_line(s))
    lines.append(f"{_status_check(s.has_render)} full-episode render")
    lines.append(f"{_status_check(s.has_narration)} narration recorded")
    lines.append(f"{_status_check(s.has_thumbnails)} thumbnail-spec")
    lines.append("")
    return lines


def _render_assets_line(s: EpisodeStatus) -> str:
    """One line for the assets row — accounts for stills/clips/zero-hit combinations."""
    if s.asset_stills or s.asset_clips:
        note = f" ({s.asset_stills} stills · {s.asset_clips} clips"
        if s.zero_hit_count:
            note += f" · {s.zero_hit_count} zero-hit shots unresolved"
        note += ")"
    elif s.zero_hit_count:
        note = f" ({s.zero_hit_count} zero-hit shots — no assets generated yet)"
    else:
        note = ""
    has_any = s.asset_stills > 0 or s.asset_clips > 0
    return f"{_status_check(has_any, warn=s.zero_hit_count > 0)} assets{note}"


def _render_health(s: EpisodeStatus) -> list[str]:
    """Health checks with exact-command fixes."""
    lines = ["## Health"]
    health: list[str] = []
    if s.manifest_stale:
        health.append(
            f"🔴 M-MANIFEST-STALE  script ({s.script_mtime_iso}) > manifest "
            f"(drift {s.manifest_stale_drift_str})"
        )
        health.append(f"   → fix: `python3 tools/assembly/generate_manifest.py {s.slug}`")
    if s.zero_hit_count > 0:
        health.append(
            f"🟡 {s.zero_hit_count} zero-hit shot{'s' if s.zero_hit_count != 1 else ''} "
            f"in episodes/{s.slug}/assets/"
        )
        health.append(f"   → fix: `python3 tools/asset-source/zerohit_fallback.py {s.slug}`")
    if s.has_manifest and s.manifest_mode == "estimate" and s.has_narration:
        health.append("🟡 Manifest in estimate mode but narration recorded — regenerate in precise mode")
        health.append(f"   → fix: `python3 tools/assembly/generate_manifest.py {s.slug} --audio`")
    if s.has_manifest and not s.has_render:
        health.append("🟡 Manifest ready but episode never rendered")
        health.append(f"   → fix: `cd remotion-templates && node scripts/render-episode.mjs --episode={s.slug}`")
    if not health:
        health.append("🟢 No health issues detected")
    lines.extend(health)
    lines.append("")
    return lines


def _render_numbers(s: EpisodeStatus) -> list[str]:
    """By the numbers panel — only includes rows with non-default values."""
    lines = ["## By the numbers", ""]
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
    return lines


def _render_notes(s: EpisodeStatus) -> list[str]:
    """Editorial notes from pipeline-state.json (may be empty)."""
    if not s.notes:
        return []
    return ["## Notes", "", s.notes, ""]


def _render_footer(s: EpisodeStatus) -> list[str]:
    return [
        "---",
        "",
        f"_Regenerate this file: `python3 tools/pipeline_validator.py --write-status {s.slug}` "
        f"or run `./scripts/check-episode.sh {s.slug}` (auto-refreshes)._",
    ]


def render_status_md(s: EpisodeStatus) -> str:
    """Render the per-episode _status.md dashboard string.

    Composed of single-purpose section renderers so each block is easy to
    edit independently. Adding a new section = add a `_render_*` function
    and append its output to the pipeline below.
    """
    sections = [
        _render_header(s),
        _render_progress(s),
        _render_checklist(s),
        _render_health(s),
        _render_numbers(s),
        _render_notes(s),
        _render_footer(s),
    ]
    return "\n".join(line for section in sections for line in section) + "\n"


# ── update_tracker_health: write Health column into PIPELINE.md ──────────────

# Match the "At a glance" section. The regex captures THREE groups so we can
# preserve the blank line between the table and the next section when
# rewriting just the table body:
#   group(1) = header (## heading + table header + separator row)
#   group(2) = table body (one or more rows starting with `|`)
#   group(3) = trailing blank line(s) before the next non-table content;
#              preserved verbatim on rewrite
#
# IMPORTANT: row terminators use `[ \t]*` (only horizontal whitespace), NOT
# `\s*`. `\s` matches `\n`, so a greedy `\s*\n` row-terminator would consume
# the trailing blank line as part of the last row's whitespace, eating
# it on every rewrite. Same for the separator row pattern.
PIPELINE_TABLE_RE = re.compile(
    r"(## At a glance[ \t]*\n[ \t]*\n"
    r"\| Episode[ \t]*\|.*?\|[ \t]*Health[ \t]*\|[ \t]*\n"
    r"\|[-: ]+(?:\|[-: ]+)+\|[ \t]*\n)"
    r"((?:\|.*?\|[ \t]*\n)+)"
    r"(\n+)?",     # captured: blank line(s) between table and next section
    re.MULTILINE,
)


def _format_tracker_row(s: EpisodeStatus) -> str:
    """Render one row of the At-a-glance table."""
    badge = STATE_BADGES.get(s.state, s.state)
    target = s.target_publish_iso or "—"
    return f"| `{s.slug}` | {badge} | {s.days_in_state} | {target} | {s.health_summary} |"


def update_tracker_health(statuses: list[EpisodeStatus]) -> bool:
    """Update the At-a-glance table in PIPELINE.md in place. Returns True if changed.

    Preserves the trailing blank line between the table and the next
    section so the auto-refresh doesn't keep collapsing whitespace.
    """
    if not PIPELINE_MD.is_file():
        return False
    text = PIPELINE_MD.read_text(encoding="utf-8")
    m = PIPELINE_TABLE_RE.search(text)
    if not m:
        # Table not present yet — first migration; caller should run --bootstrap-tracker
        return False
    header = m.group(1)
    trailing = m.group(3) or ""
    new_body = "\n".join(_format_tracker_row(s) for s in statuses) + "\n"
    new_text = text.replace(m.group(0), header + new_body + trailing, 1)
    if new_text != text:
        PIPELINE_MD.write_text(new_text, encoding="utf-8")
        return True
    return False


def suggest_state_promotion(
    entry: StateEntry, status: EpisodeStatus
) -> tuple[str, str] | None:
    """Return (next_state, reason) if `entry` looks ready to promote, else None.

    Promotion rules — derived from STATE_REQUIRED + check-episode workflow:
      INCUBATING     → VIABLE         viability.md present
      VIABLE         → RESEARCHING    brief.md or research-pass1.md present
      RESEARCHING    → RESEARCH READY brief.md + research-audit.md present
      RESEARCH READY → DRAFTING       angle-memo.md + script present
      DRAFTING       → RENDER READY   script + visual-spec + manifest present
      RENDER READY   → IN POST        full render + narration present
      IN POST        → PUBLISHED      (manual — needs YouTube confirmation)
      PUBLISHED      → RETROED        (manual — publish-retro skill)

    Off-lifecycle states (BLOCKED, REVISING) and the two manual-only
    transitions return None — those require human judgment.

    The function reads ONLY filesystem signals via the already-computed
    EpisodeStatus, so it's pure relative to `entry` + `status` and safe
    to call in tests. It does NOT mutate pipeline-state.json — that's
    the caller's job under `--apply`.
    """
    ep_dir = EPISODES_DIR / entry.slug
    cur = entry.state

    if cur == "INCUBATING":
        if (ep_dir / "viability.md").is_file() or (ep_dir / "viability-check.md").is_file():
            return ("VIABLE", "viability.md present")
    elif cur == "VIABLE":
        if status.has_research or list(ep_dir.glob("research-pass*.md")):
            return ("RESEARCHING", "research brief / pass file present")
    elif cur == "RESEARCHING":
        if status.has_research and (ep_dir / "research-audit.md").is_file():
            return ("RESEARCH READY", "brief.md + research-audit.md present")
    elif cur == "RESEARCH READY":
        if status.has_angle_memo and status.has_script:
            return ("DRAFTING", "angle-memo + script started")
    elif cur == "DRAFTING":
        if status.has_script and status.has_visual_spec and status.has_manifest:
            return ("RENDER READY", "script + visual-spec + assembly-manifest all present")
    elif cur == "RENDER READY":
        if status.has_render and status.has_narration:
            return ("IN POST", "full-episode render + narration recorded")
    # IN POST → PUBLISHED and PUBLISHED → RETROED are manual.
    return None


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
    parser.add_argument(
        "--check-only",
        action="store_true",
        help=(
            "Compute status but don't write _status.md or modify PIPELINE.md. "
            "Useful as a pre-commit check or to preview what --write-status / "
            "--update-tracker would do. Prints a per-episode summary and exits "
            "1 if any episode has health warnings (manifest-stale, zero-hits, "
            "never-rendered, etc.)."
        ),
    )
    parser.add_argument(
        "--suggest-states",
        action="store_true",
        help=(
            "For each episode, check whether artifact presence indicates it "
            "should be promoted to a forward state and print the suggestion. "
            "Read-only by default — pair with --apply to actually rewrite "
            "pipeline-state.json (which also bumps stateEnteredAt to today)."
        ),
    )
    parser.add_argument(
        "--apply",
        action="store_true",
        help=(
            "With --suggest-states: apply the promotions in place to "
            "episodes/pipeline-state.json (sets new state + bumps "
            "stateEnteredAt to today). No-op without --suggest-states."
        ),
    )
    args = parser.parse_args()

    # ── --suggest-states path ────────────────────────────────────────────────
    # Walks every episode and surfaces ready-to-promote candidates by
    # comparing artifact presence against STATE_REQUIRED. Read-only by
    # default; --apply rewrites pipeline-state.json (bumping stateEnteredAt
    # to today, matching the pre-commit sync_pipeline_state.py invariant).
    if args.suggest_states:
        entries = load_pipeline_state()
        if not entries:
            print("✗ episodes/pipeline-state.json not found or empty", file=sys.stderr)
            return 2
        if args.episode:
            entries = [e for e in entries if e.slug == args.episode]
            if not entries:
                print(f"✗ episode '{args.episode}' not found in pipeline-state.json", file=sys.stderr)
                return 2
        statuses = {e.slug: compute_episode_status(e) for e in entries}
        suggestions: list[tuple[StateEntry, str, str]] = []
        for e in entries:
            sug = suggest_state_promotion(e, statuses[e.slug])
            if sug:
                suggestions.append((e, sug[0], sug[1]))
        if not suggestions:
            print("✓ no promotion candidates — every episode matches its claimed state")
            return 0
        print("\nPromotion candidates:\n")
        for e, new_state, reason in suggestions:
            print(f"  {e.slug:<30} {e.state} → {new_state}    ({reason})")
        print()
        if args.apply:
            # Rewrite pipeline-state.json: change state + bump stateEnteredAt
            data = json.loads(PIPELINE_STATE_JSON.read_text(encoding="utf-8"))
            today_iso = datetime.date.today().isoformat()
            applied: set[str] = {e.slug for e, _, _ in suggestions}
            slug_to_new = {e.slug: ns for e, ns, _ in suggestions}
            for ep in data.get("episodes", []):
                if ep.get("slug") in applied:
                    ep["state"] = slug_to_new[ep["slug"]]
                    ep["stateEnteredAt"] = today_iso
            PIPELINE_STATE_JSON.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            print(f"✓ applied {len(applied)} promotion(s) to {PIPELINE_STATE_JSON.relative_to(ROOT)}")
            print("  → re-run with --write-status --update-tracker to refresh dashboards")
        else:
            print("Run with --apply to write these to pipeline-state.json.")
        return 0

    # ── --write-status / --update-tracker / --check-only path ────────────────
    # When any of these flags is set, run the new pipeline-state-driven flow
    # and exit. The legacy PIPELINE.md-parsing validation path runs only when
    # none of the new flags are set (back-compat for existing callers).
    if args.write_status or args.update_tracker or args.check_only:
        all_entries = load_pipeline_state()
        if not all_entries:
            print("✗ episodes/pipeline-state.json not found or empty", file=sys.stderr)
            return 2
        # Always compute status for ALL episodes once. The tracker rewrite
        # needs every row; --write-status / --check-only with --episode just
        # filter which dashboards get written/reported.
        all_statuses = [compute_episode_status(e) for e in all_entries]
        if args.episode:
            targeted = [s for s in all_statuses if s.slug == args.episode]
            if not targeted:
                print(f"✗ episode '{args.episode}' not found in pipeline-state.json", file=sys.stderr)
                return 2
        else:
            targeted = all_statuses

        if args.check_only:
            # Dry-run mode: print summary, return 1 if any health issues.
            print("\nPipeline status summary (--check-only; no files written):\n")
            any_warnings = False
            for s in targeted:
                print(f"  {s.slug:<30} {STATE_BADGES.get(s.state, s.state):<20} {s.health_summary}")
                if s.health_summary not in ("✓ clean", "✓ shipped", "⏸ awaiting promotion"):
                    any_warnings = True
            print()
            return 1 if any_warnings else 0

        if args.write_status:
            for s in targeted:
                path = write_status(s)
                print(f"✓ wrote {path.relative_to(ROOT)}")
        if args.update_tracker:
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
        print("  Checkpoints written: "
              + ", ".join(f"episodes/{s}/_checkpoint.md" for s in checkpoints_written))
    print()

    if total_errors:
        return 1
    if args.strict and total_warnings:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
