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
from paths import get_project_root  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent))
from status_emoji import ERROR, OK, WARN  # noqa: E402

ROOT = get_project_root()
PIPELINE_MD   = ROOT / "episodes" / "PIPELINE.md"
EPISODES_DIR  = ROOT / "episodes"
REMOTION_DATA = ROOT / "remotion-templates" / "data" / "episodes"

# Secondary docs that mirror episode state in human-readable tables. These are
# NOT sources of truth — pipeline-state.json is — but they must AGREE with it.
# check_source_consistency() validates that each committed episode's lifecycle
# token appears in these tables; the gate is wired into scripts/lint.sh.
CLAUDE_MD         = ROOT / "CLAUDE.md"
IDEAS_MD          = ROOT / "project" / "IDEAS.md"
CONCEPTS_JSON     = ROOT / "data" / "concepts.json"
PUBLISH_ORDER_JSON = ROOT / "episodes" / "publish-order.json"

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
    "VIABLE":          f"{OK} VIABLE",
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
    warn_only: bool = False   # emit warn (not error) if missing — soft requirement


# Required or recommended artifacts per state.
# Entries with warn_only=False (default): missing = ERROR.
# Entries with warn_only=True: missing = WARN (soft requirement).
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
        # Canonical name is script.md (once promoted from draft); legacy episodes
        # may still have script-production.md or script-v*-production.md.
        ArtifactSpec("script.md", "script-*production*.md", "production script"),
    ],
    "RENDER READY": [
        # script.md is the canonical production script name (promoted from versioned
        # draft). Glob fallback covers legacy script-production.md and
        # script-v6.3-production.md naming; canonical_only_warn=True (default)
        # nudges old-naming episodes to rename to script.md.
        ArtifactSpec("script.md", "script-*production*.md", "production script"),
        # script-audit.md is canonical at episode root; episodes that completed the
        # skill before the naming convention was settled may have it in development/.
        # Glob ** traversal finds development/script-audit.md and versioned copies.
        ArtifactSpec("script-audit.md", "**/script-audit*.md", "script audit"),
        ArtifactSpec("visual-spec.md", "visual-spec.md", "visual spec", canonical_only_warn=False),
        ArtifactSpec("shot-list.json", "shot-list.json", "shot list", canonical_only_warn=False),
        # Sourcing brief is recommended (not hard-required) at RENDER READY.
        # Missing = warn, not error: a RENDER READY episode without a sourcing
        # doc is unusual but valid if assets were gathered manually.
        # canonical: development/sourcing-brief.md
        # glob fallback: publish/sources*.md (matches publish/sources.md too —
        #   the wildcard is required for file_exists() to treat it as a glob
        #   rather than a literal ep_dir / "publish/sources.md" path check).
        ArtifactSpec(
            "development/sourcing-brief.md",
            "publish/sources*.md",
            "sourcing brief",
            canonical_only_warn=False,
            warn_only=True,
        ),
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
    ("script.md",                    "DRAFTING",        "episode"),
    ("script-audit.md",             "DRAFTING",        "episode"),
    ("script-audit*.md",            "DRAFTING",        "episode"),
    ("**/script-audit*.md",         "DRAFTING",        "episode"),
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


def fix_naming_drift(ep_dir: Path, dry_run: bool = False) -> list[str]:
    """Promote the latest versioned draft to canonical for any missing canonical files.

    Does NOT delete intermediate versions — human decides materiality.
    Returns a list of human-readable rename messages (empty if nothing to fix).

    With dry_run=True, prints the planned renames without executing them.
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
        if not dry_run:
            latest.rename(canon_path)
        dry_tag = " (dry-run — not moved)" if dry_run else ""
        renames.append(f"  {latest.name}  →  {canonical}{dry_tag}")
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
            level = "warn" if spec.warn_only else "error"
            qualifier = "recommended" if spec.warn_only else "required"
            add(Finding(level,
                f"{spec.label} missing — expected {spec.canonical!r} "
                f"({qualifier} for {row.state})"))

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
                except (json.JSONDecodeError, OSError) as e:
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

    viability = _first_match(
        ep_dir, "development/viability.md", "viability.md", "viability-check.md"
    )
    research.append(StageCheck(
        "Viability check", bool(viability),
        detail=viability.relative_to(ep_dir).as_posix() if viability else "development/viability.md missing",
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

    angle = _first_match(ep_dir, "development/angle-memo.md", "angle-memo.md")
    script.append(StageCheck(
        "Angle Memo", bool(angle),
        detail=angle.relative_to(ep_dir).as_posix() if angle else "development/angle-memo.md missing",
    ))

    canonical_script = _first_match(ep_dir, "script.md", "script-production.md")
    versioned_scripts = _all_matches(ep_dir, "script-v*-production.md", "drafts/script-v*.md")
    if canonical_script:
        script.append(StageCheck("Script Draft", True, detail=canonical_script.name))
    elif versioned_scripts:
        latest = versioned_scripts[-1].name
        script.append(StageCheck(
            "Script Draft", True, detail=latest,
            warn=f"no canonical script.md — rename {latest} to script.md once gate passes",
        ))
    else:
        script.append(StageCheck("Script Draft", False, detail="script.md missing"))

    for stage, canonical, alt_prefix, glob in [
        ("Script Audit",   "script-audit.md",        "development/", "script-audit-v*.md"),
        ("Persona Eval",   "persona-eval.md",         "development/", "persona-eval-v*.md"),
        ("Visual Concept", "visual-concept-audit.md", "development/", "visual-concept-audit-v*.md"),
        ("Review Package", "review-package.md",       "development/", "review-package-v*.md"),
    ]:
        found = _first_match(ep_dir, f"{alt_prefix}{canonical}", canonical)
        versioned = _all_matches(ep_dir, glob)
        if found:
            script.append(StageCheck(stage, True, detail=found.relative_to(ep_dir).as_posix()))
        elif versioned:
            latest = versioned[-1].name
            script.append(StageCheck(
                stage, True, detail=latest,
                warn=f"no canonical {alt_prefix}{canonical}",
            ))
        else:
            script.append(StageCheck(stage, False, detail=f"{alt_prefix}{canonical} missing"))

    thumb = _first_match(ep_dir, "publish/thumbnail-concepts.md", "thumbnail-concepts.md")
    script.append(StageCheck(
        "Title/Hook + Thumbnails", bool(thumb),
        detail=thumb.relative_to(ep_dir).as_posix() if thumb else "publish/thumbnail-concepts.md missing",
    ))

    groups.append(("Script", script))

    # ── Production Prep ───────────────────────────────────────────────────────
    prep: list[StageCheck] = []

    vspec = ep_dir / "visual-spec.md"
    prep.append(StageCheck(
        "Visual Spec", vspec.exists(),
        detail="visual-spec.md" if vspec.exists() else "visual-spec.md missing — run visual-spec skill",
    ))

    audio = _first_match(
        ep_dir,
        "audio/audio-cue-sheet.md", "audio-cue-sheet.md",
        "audio-spec.md", "audio-*.md",
    )
    prep.append(StageCheck(
        "Audio Spec", bool(audio),
        detail=audio.relative_to(ep_dir).as_posix() if audio else "audio/audio-cue-sheet.md missing — run audio-spec skill",
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
            except (json.JSONDecodeError, OSError) as e:
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


# ── Source consistency gate ───────────────────────────────────────────────────
# pipeline-state.json is the single source of truth for episode lifecycle state.
# Two human-facing docs mirror it: the CLAUDE.md "Status" table and the IDEAS.md
# "Launch sequence" table. Historically these drifted freely and contradicted
# the JSON (and each other). This gate re-reads those tables and fails if any
# committed episode's canonical token is missing from the row that mentions it.

# All recognized lifecycle + failure tokens, longest-first so "RESEARCH READY"
# is matched before "RESEARCHING" when scanning a cell for what it claims.
_ALL_STATE_TOKENS = sorted(
    set(STATE_ORDER) | set(STATE_BADGES.keys()),
    key=len,
    reverse=True,
)


def _detected_state_tokens(rows: list[str]) -> list[str]:
    """Return the lifecycle tokens that appear in any of the given table rows."""
    found: list[str] = []
    joined = " ".join(rows)
    for tok in _ALL_STATE_TOKENS:
        if tok in joined and tok not in found:
            found.append(tok)
    return found


def check_source_consistency() -> list[str]:
    """Verify CLAUDE.md + IDEAS.md + publish-order.json agree with
    pipeline-state.json on each committed episode's lifecycle state.

    For every episode in pipeline-state.json, scan each secondary doc for the
    markdown table row(s) that mention its slug (in backticks). If the doc
    tracks that slug at all, the canonical state token MUST appear in one of
    those rows. Returns a list of mismatch strings (empty = fully consistent).

    Robust to surrounding prose: we only require the canonical token to be
    present in the slug's row, not that the whole cell equals it.

    publish-order.json checks:
      1. Coverage: every slug in pipeline-state.json must appear in
         publish-order.json (either queue or published). Orphan = missing entry.
      2. Published consistency: if pipeline-state says PUBLISHED or RETROED,
         publish-order.json must also show "published" or "retroed" — the only
         hard drift that matters in production. RENDER READY still showing "draft"
         in publish-order.json is expected (it's a separate editorial queue).
    """
    entries = load_pipeline_state()
    if not entries:
        return []
    canonical = {e.slug: e.state for e in entries}
    problems: list[str] = []

    # ── CLAUDE.md + IDEAS.md markdown-table checks ────────────────────────────
    for label, path in (("CLAUDE.md", CLAUDE_MD), ("project/IDEAS.md", IDEAS_MD)):
        if not path.is_file():
            problems.append(f"{label}: file not found (cannot verify state consistency)")
            continue
        lines = path.read_text(encoding="utf-8").splitlines()
        for slug, state in canonical.items():
            rows = [
                ln for ln in lines
                if ln.lstrip().startswith("|") and f"`{slug}`" in ln
            ]
            if not rows:
                continue  # this doc doesn't track the slug — not a drift
            if not any(state in ln for ln in rows):
                found = _detected_state_tokens(rows)
                shows = ", ".join(found) if found else "no recognized lifecycle token"
                problems.append(
                    f"{label}: '{slug}' should be '{state}' "
                    f"(per pipeline-state.json) but the table shows {shows}"
                )

    # ── publish-order.json coverage + published-state consistency ─────────────
    if PUBLISH_ORDER_JSON.is_file():
        try:
            po = json.loads(PUBLISH_ORDER_JSON.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            problems.append(f"publish-order.json: JSON parse error — {exc}")
            return problems

        po_slugs: dict[str, str] = {}  # slug → publish-order state
        for entry in po.get("published", []):
            po_slugs[entry["slug"]] = entry.get("state", "published")
        for entry in po.get("queue", []):
            po_slugs[entry["slug"]] = entry.get("state", "draft")

        # Coverage: every pipeline-state slug must appear in publish-order.json
        for slug in canonical:
            if slug not in po_slugs:
                problems.append(
                    f"publish-order.json: '{slug}' is in pipeline-state.json "
                    f"but has no entry in publish-order.json (add it to 'queue')"
                )

        # Reverse coverage: every publish-order slug must be in pipeline-state.json
        for slug in po_slugs:
            if slug not in canonical:
                problems.append(
                    f"publish-order.json: '{slug}' has a publish-order entry "
                    f"but is not in pipeline-state.json (orphaned queue entry)"
                )

        # State floor: PUBLISHED/RETROED in pipeline-state must match publish-order
        FINAL_STATES = {"PUBLISHED", "RETROED"}
        PO_FINAL_STATES = {"published", "retroed"}
        for slug, state in canonical.items():
            if state in FINAL_STATES and slug in po_slugs:
                po_state = po_slugs[slug]
                if po_state not in PO_FINAL_STATES:
                    problems.append(
                        f"publish-order.json: '{slug}' is '{state}' in "
                        f"pipeline-state.json but publish-order shows '{po_state}' "
                        f"— update publish-order.json to 'published' or 'retroed'"
                    )
    else:
        problems.append(
            "publish-order.json: file not found at episodes/publish-order.json "
            "(required for publish-queue tracking)"
        )

    return problems


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

    # What the episode is waiting on from Tiger (pipeline-state.json `blockedOn`).
    # Keep it to five short items at most. "—" means nothing.
    blocked_on: str = "—"

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
            parts.append(f"{ERROR} {self.zero_hit_count} zero-hit shot{'s' if self.zero_hit_count != 1 else ''}")
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
        # brief.md lives in research/ (canonical) or root (legacy)
        "has_research":       bool(_first_match(ep_dir, "research/brief.md", "brief.md")),
        # angle-memo lives in development/ (canonical) or root (legacy)
        "has_angle_memo":     bool(_first_match(ep_dir, "development/angle-memo.md", "angle-memo.md")),
        # script.md (canonical) or old versioned/production names
        "has_script":         bool(_first_match(ep_dir, "script.md",
                                                "script-v*-production.md", "script-production.md")),
        "has_visual_spec":    (ep_dir / "visual-spec.md").is_file(),
        # audio-cue-sheet lives in audio/ (canonical) or root (legacy)
        "has_audio_cue_sheet": bool(_first_match(
            ep_dir, "audio/audio-cue-sheet.md", "audio-cue-sheet.md", "audio-spec.md",
        )),
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
        blocked_on=entry.blocked_on,
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
    if s.blocked_on not in ("—", "", "-"):
        lines.append(f"**Waiting on:** {s.blocked_on}")
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
            f"{ERROR} M-MANIFEST-STALE  script ({s.script_mtime_iso}) > manifest "
            f"(drift {s.manifest_stale_drift_str})"
        )
        health.append(f"   → fix: `python3 tools/assembly/generate_manifest.py {s.slug}`")
    if s.zero_hit_count > 0:
        health.append(
            f"{WARN} {s.zero_hit_count} zero-hit shot{'s' if s.zero_hit_count != 1 else ''} "
            f"in episodes/{s.slug}/assets/"
        )
        health.append(f"   → fix: `python3 tools/asset-source/zerohit_fallback.py {s.slug}`")
    if s.has_manifest and s.manifest_mode == "estimate" and s.has_narration:
        health.append(f"{WARN} Manifest in estimate mode but narration recorded — regenerate in precise mode")
        health.append(f"   → fix: `python3 tools/assembly/generate_manifest.py {s.slug} --audio`")
    if s.has_manifest and not s.has_render:
        health.append(f"{WARN} Manifest ready but episode never rendered")
        health.append(f"   → fix: `cd remotion-templates && node scripts/render-episode.mjs --episode={s.slug}`")
    if not health:
        health.append(f"{OK} No health issues detected")
    lines.extend(health)
    lines.append("")
    return lines


def _compute_next_actions(s: EpisodeStatus) -> list[tuple[int, str, str]]:
    """Return an ordered list of (priority, label, command) next actions.

    Priority 0 = hard blocker (renders/narration impossible until resolved).
    Priority 1 = important but not immediately blocking.
    Priority 2 = next phase not yet started.

    Callers typically take the first 3 items for display.
    """
    actions: list[tuple[int, str, str]] = []

    # Hard blockers ────────────────────────────────────────────────────────────
    if s.manifest_stale:
        actions.append((0, "Regenerate stale manifest",
                        f"python3 tools/assembly/generate_manifest.py {s.slug}"))
    if s.zero_hit_count > 0:
        actions.append((0,
                        f"Resolve {s.zero_hit_count} zero-hit shot{'s' if s.zero_hit_count != 1 else ''}",
                        f"python3 tools/asset-source/zerohit_fallback.py {s.slug}"))

    # Missing stage artifacts ──────────────────────────────────────────────────
    if not s.has_research:
        actions.append((1, "Research brief missing — run `research` skill", ""))
    if not s.has_angle_memo and s.has_research:
        actions.append((1, "Angle memo missing — run `angle-memo` skill", ""))
    if not s.has_script and s.has_angle_memo:
        actions.append((1, "Script missing — run `script-draft` skill", ""))
    if not s.has_visual_spec and s.has_script:
        actions.append((1, "Visual spec missing — run `visual-spec` skill", ""))
    if not s.has_manifest and s.has_visual_spec:
        actions.append((1, "Assembly manifest missing",
                        f"python3 tools/assembly/generate_manifest.py {s.slug}"))
    if not s.has_audio_cue_sheet and s.has_script:
        actions.append((2, "Audio cue sheet missing — run `audio-spec` skill", ""))

    # Render-ready but unrendered ──────────────────────────────────────────────
    if s.has_manifest and not s.has_render:
        actions.append((1, "First full-episode render pending",
                        f"./scripts/render.sh {s.slug}"))

    # Post-render ──────────────────────────────────────────────────────────────
    if s.has_render and not s.has_narration:
        actions.append((1, "Narration not yet recorded — prepare booth session",
                        f"./scripts/narration-prep.sh {s.slug}"))
    if not s.has_thumbnails and s.stage_idx >= STATE_ORDER.index("RENDER READY"):
        actions.append((2, "Thumbnails missing",
                        f"npm run thumbnails -- --episode={s.slug}"))

    # Sort by priority (stable sort preserves editorial ordering within tier)
    actions.sort(key=lambda x: x[0])
    return actions


def _render_next_actions(s: EpisodeStatus) -> list[str]:
    """Next-actions panel: top 3 concrete steps, with exact commands."""
    actions = _compute_next_actions(s)
    if not actions:
        return ["## Next actions", "", "✓ No blockers — episode is on track.", ""]
    lines = ["## Next actions", ""]
    for i, (_, label, cmd) in enumerate(actions[:3], 1):
        if cmd:
            lines.append(f"{i}. **{label}**")
            lines.append("   ```")
            lines.append(f"   {cmd}")
            lines.append("   ```")
        else:
            lines.append(f"{i}. **{label}**")
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
        _render_next_actions(s),
        _render_health(s),
        _render_asset_registry(s.slug),
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


def update_tracker_health(statuses: list[EpisodeStatus], check: bool = False) -> bool:
    """Update the At-a-glance table in PIPELINE.md in place. Returns True if changed.

    With check=True, computes the would-be result and returns whether a
    change is pending WITHOUT writing (freshness-gate dry run).

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
        if not check:
            PIPELINE_MD.write_text(new_text, encoding="utf-8")
        return True
    return False


# ── update_tracker_topics: append/replace auto-managed Topics block ─────────
# PIPELINE.md is mostly hand-curated narrative — the operator's strategic
# thinking lives there. But the same topic-pipeline data that drives the
# HTML's Topics tab (project/IDEAS.md) should also surface in the Markdown
# so a `cat PIPELINE.md` view doesn't miss it.
#
# Use an HTML-comment-delimited "managed block" so the auto-refresh can
# rewrite the section without disturbing the surrounding prose. If the
# block doesn't exist, append at the bottom of the file. Idempotent.

TOPICS_BLOCK_BEGIN = "<!-- BEGIN AUTO-TOPICS · do not edit — `pipeline_validator.py --update-tracker` rewrites this block. -->"
TOPICS_BLOCK_END = "<!-- END AUTO-TOPICS -->"
TOPICS_BLOCK_RE = re.compile(
    re.escape(TOPICS_BLOCK_BEGIN) + r"\n(?:.*\n)*?" + re.escape(TOPICS_BLOCK_END),
    re.MULTILINE,
)


def _render_topics_markdown_block() -> str | None:
    """Render the Topics summary section for PIPELINE.md. Returns None if
    IDEAS.md is empty / missing (nothing to surface)."""
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from topics_parser import load_topics  # type: ignore[import-not-found]
    topics = load_topics()
    if not topics.launch_sequence and not topics.signal_watch and not topics.lifecycle_states:
        return None

    parts: list[str] = [
        TOPICS_BLOCK_BEGIN,
        "",
        "## Topics — auto-summary from `project/IDEAS.md`",
        "",
        "> Surfaced here so the Markdown dashboard mirrors what the visual "
        "[`PIPELINE.html`](./PIPELINE.html) shows. **For the full topic "
        "thinking** (sequencing rationale, format variety, signal-discovery "
        "narrative), open `project/IDEAS.md` directly — that's the canonical "
        "source.",
        "",
    ]

    if topics.launch_sequence:
        parts.append("### Launch sequence")
        parts.append("")
        parts.append("| Ep | Slug | Format | Arc | Pipeline state |")
        parts.append("|---|---|---|---|---|")
        for ep in topics.launch_sequence:
            parts.append(
                f"| {ep.ep_number} | `{ep.slug}` | {ep.format} | {ep.arc} | {ep.pipeline_state} |"
            )
        parts.append("")

    if topics.signal_watch:
        parts.append(f"### Signal watch ({len(topics.signal_watch)} signals)")
        parts.append("")
        for sig in topics.signal_watch:
            # One bullet per signal, compact form (full table lives in IDEAS.md)
            parts.append(
                f"- **{sig.signal}** — _{sig.discovery_path}_ · {sig.potential_arc}"
                + (f" · first noticed {sig.first_noticed}" if sig.first_noticed else "")
            )
        parts.append("")

    if topics.lifecycle_states:
        parts.append("### Topic lifecycle")
        parts.append("")
        for ls in topics.lifecycle_states:
            parts.append(f"- {ls.emoji} **{ls.label}** — {ls.description}")
        parts.append("")

    parts.append(TOPICS_BLOCK_END)
    return "\n".join(parts)


def update_tracker_topics(check: bool = False) -> bool:
    """Refresh the auto-managed Topics block in PIPELINE.md. Returns True
    if changed.

    With check=True, returns whether a change is pending WITHOUT writing
    (freshness-gate dry run).

    Behavior:
      · IDEAS.md missing or empty → remove existing block (no-op if absent)
      · Existing block present     → in-place rewrite
      · No existing block          → append at end of file (after one blank line)

    Pairs with update_tracker_health — both run under --update-tracker.
    """
    if not PIPELINE_MD.is_file():
        return False
    text = PIPELINE_MD.read_text(encoding="utf-8")
    block = _render_topics_markdown_block()
    existing = TOPICS_BLOCK_RE.search(text)

    if block is None:
        # Nothing to render — strip an existing stale block if present.
        if existing:
            new_text = TOPICS_BLOCK_RE.sub("", text).rstrip() + "\n"
            if not check:
                PIPELINE_MD.write_text(new_text, encoding="utf-8")
            return True
        return False

    if existing:
        new_text = text.replace(existing.group(0), block, 1)
    else:
        # Append at end with a separating blank line.
        new_text = text.rstrip() + "\n\n" + block + "\n"

    if new_text != text:
        if not check:
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


def _record_state_transition(slug: str, to_state: str) -> None:
    """Append a state transition to episodes/<slug>/_state-history.jsonl.

    Non-fatal: if state_history.py is missing or fails, we warn but continue.
    Called from write_status() when a state change is detected by comparing
    the new EpisodeStatus against the previous **State:** line in _status.md.
    """
    state_history_py = Path(__file__).resolve().parent / "state_history.py"
    if not state_history_py.exists():
        return
    import contextlib
    import subprocess as _sp
    with contextlib.suppress(OSError):
        _sp.run(
            [sys.executable, str(state_history_py), "--record", slug, to_state,
             "detected by pipeline_validator --write-status"],
            cwd=str(ROOT),
            capture_output=True,
            check=False,  # non-fatal — audit trail must not block dashboard refresh
        )


def write_status(s: EpisodeStatus) -> Path:
    """Write _status.md for one episode. Returns the path.

    If the episode already has a _status.md from a prior run, the previous
    state is extracted from the ``**State:**`` header line. When the state
    differs from s.state, a transition is appended to _state-history.jsonl
    via state_history.py --record (non-fatal: audit trail must not block
    dashboard refresh).
    """
    ep_dir = EPISODES_DIR / s.slug
    ep_dir.mkdir(parents=True, exist_ok=True)
    out_path = ep_dir / "_status.md"

    # Detect state change by reading previous _status.md header.
    prev_state: str | None = None
    if out_path.exists():
        for line in out_path.read_text(encoding="utf-8").splitlines():
            if line.startswith("**State:**"):
                # Format: **State:** RENDER READY · day 3 in state ...
                tail = line[len("**State:**"):].strip()
                prev_state = tail.split("·")[0].strip() or None
                break

    out_path.write_text(render_status_md(s), encoding="utf-8")

    # Wire state_history: record transition when state changes.
    if prev_state and prev_state != s.state:
        _record_state_transition(s.slug, s.state)

    return out_path


# ── asset registry ────────────────────────────────────────────────────────────

PUBLIC_DIR = ROOT / "remotion-templates" / "public"

def compute_asset_status(slug: str) -> dict | None:
    """Read asset-registry.json for slug, scan disk, return computed status.
    Returns None if no registry exists for this episode."""
    registry_path = EPISODES_DIR / slug / "asset-registry.json"
    if not registry_path.exists():
        return None

    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    assets = registry.get("assets", [])
    morphs = registry.get("morphs", [])

    # Compute per-asset status from disk
    asset_status: dict[str, dict] = {}
    for a in assets:
        aid = a["id"]
        sp = a.get("stillPath")
        vp = a.get("videoPath")
        still_exists = (ROOT / sp).exists() if sp else None
        video_exists = (ROOT / vp).exists() if vp else None
        asset_status[aid] = {
            "still_exists": still_exists,
            "video_exists": video_exists,
            "motionType": a.get("motionType", "standalone"),
            "segments": a.get("segments", []),
        }

    # Compute per-morph status
    morph_status = []
    for m in morphs:
        from_still = asset_status.get(m["from"], {}).get("still_exists", False)
        to_still   = asset_status.get(m["to"],   {}).get("still_exists", False)
        vp = m.get("videoPath")
        video_exists = (ROOT / vp).exists() if vp else False
        morph_status.append({
            "from": m["from"],
            "to":   m["to"],
            "tool": m.get("tool", "?"),
            "intent": m.get("intent", ""),
            "unblocked": bool(from_still and to_still),
            "video_exists": video_exists,
        })

    # Compute wired status from assembly-manifest
    manifest_path = ROOT / "remotion-templates" / "data" / "episodes" / slug / "assembly-manifest.json"
    wired_segments: set[str] = set()
    total_footage = 0
    if manifest_path.exists():
        mdata = json.loads(manifest_path.read_text(encoding="utf-8"))
        for seg in mdata.get("segments", []):
            if seg.get("type") == "FOOTAGE":
                total_footage += 1
                if seg.get("asset", {}).get("file"):
                    wired_segments.add(seg["id"])

    return {
        "slug": slug,
        "assets": asset_status,
        "morphs": morph_status,
        "wired_segments": wired_segments,
        "total_footage_segments": total_footage,
    }


def intake_asset(slug: str, asset_id: str) -> int:
    """Wire an approved asset from public/ into assembly-manifest.json, refresh _status.md.

    Workflow:
      1. Look up `asset_id` in `episodes/{slug}/asset-registry.json`.
      2. Find the approved file in `public/episodes/{slug}/stills/` or `clips/`.
      3. Derive the `asset.file` value (relative to assetBasePath = "episodes/{slug}").
      4. Patch all FOOTAGE segments listed in asset["segments"] in assembly-manifest.json.
      5. Refresh _status.md so newly unblocked morphs appear immediately.
      6. Report any morphs that are now unblocked by this intake.

    Returns exit code: 0 = success, 1 = file not found in public/, 2 = missing data.
    """
    # ── 1. Load registry ──────────────────────────────────────────────────────
    registry_path = EPISODES_DIR / slug / "asset-registry.json"
    if not registry_path.is_file():
        print(f"{ERROR} No asset-registry.json found for episode '{slug}'", file=sys.stderr)
        return 2
    registry = json.loads(registry_path.read_text(encoding="utf-8"))

    # ── 2. Find asset ─────────────────────────────────────────────────────────
    asset = next((a for a in registry.get("assets", []) if a["id"] == asset_id), None)
    if asset is None:
        ids = ", ".join(a["id"] for a in registry.get("assets", []))
        print(f"{ERROR} Asset '{asset_id}' not found in registry for '{slug}'", file=sys.stderr)
        print(f"  Available IDs: {ids}")
        return 2

    # ── 3. Find approved file in public/ ──────────────────────────────────────
    public_ep = PUBLIC_DIR / "episodes" / slug
    asset_file: str | None = None
    public_path_found: Path | None = None

    # Primary: stillPath → extract filename → check public/stills/
    if asset.get("stillPath"):
        filename = Path(asset["stillPath"]).name
        candidate = public_ep / "stills" / filename
        if candidate.is_file():
            asset_file = f"stills/{filename}"
            public_path_found = candidate

    # Primary: videoPath → already points into public/ tree
    if asset.get("videoPath") and asset_file is None:
        vp = ROOT / asset["videoPath"]
        if vp.is_file():
            asset_file = f"clips/{vp.name}"
            public_path_found = vp

    # Fallback: scan public/{stills,clips}/ for any file whose name contains asset_id
    if asset_file is None:
        for subdir in ("stills", "clips"):
            scan_dir = public_ep / subdir
            if scan_dir.is_dir():
                matches = sorted(f for f in scan_dir.iterdir() if asset_id in f.name)
                if matches:
                    asset_file = f"{subdir}/{matches[0].name}"
                    public_path_found = matches[0]
                    break

    if asset_file is None:
        print(f"{ERROR} No approved file found in public/episodes/{slug}/ for '{asset_id}'")
        if asset.get("stillPath"):
            fn = Path(asset["stillPath"]).name
            print(f"  Expected still: remotion-templates/public/episodes/{slug}/stills/{fn}")
        if asset.get("videoPath"):
            fn = Path(asset["videoPath"]).name
            print(f"  Expected clip:  remotion-templates/public/episodes/{slug}/clips/{fn}")
        print("  Copy the treated file there first, then re-run --intake.")
        return 1

    assert public_path_found is not None
    print(f"{OK} Found: {public_path_found.relative_to(ROOT)}")

    # ── 4. Patch assembly-manifest.json ──────────────────────────────────────
    manifest_path = REMOTION_DATA / slug / "assembly-manifest.json"
    if not manifest_path.is_file():
        print(f"{ERROR} assembly-manifest.json not found for '{slug}'", file=sys.stderr)
        return 2

    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    segment_ids: list[str] = asset.get("segments", [])
    motion_type: str = asset.get("motionType", "standalone")

    if not segment_ids:
        print(f"{WARN} '{asset_id}' has no segments[] in registry (morph-endpoint only).")
        print("       Manifest unchanged — refreshing _status.md so morph unblocked state updates.")
    else:
        all_seg_ids = {s["id"] for s in manifest.get("segments", [])}
        missing_segs = [sid for sid in segment_ids if sid not in all_seg_ids]
        if missing_segs:
            print(f"{WARN} Segment IDs not found in manifest (registry may be out of sync): "
                  f"{', '.join(missing_segs)}")

        patched = 0
        for seg in manifest.get("segments", []):
            if seg["id"] in segment_ids:
                if "asset" not in seg:
                    seg["asset"] = {}
                seg["asset"]["file"] = asset_file
                seg["asset"]["status"] = "resolved"
                if not seg["asset"].get("source"):
                    seg["asset"]["source"] = (
                        "wikimedia-commons" if motion_type == "archival" else "local-aigen"
                    )
                patched += 1

        if patched > 0:
            manifest_path.write_text(
                json.dumps(manifest, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )
            print(f"{OK} Patched {patched} manifest segment(s): {', '.join(segment_ids)}")

    # ── 5. Capture morph state before refresh (for newly-unblocked detection) ─
    status_before = compute_asset_status(slug)
    was_blocked: set[tuple[str, str]] = set()
    if status_before:
        was_blocked = {
            (m["from"], m["to"])
            for m in status_before["morphs"]
            if not m["unblocked"] and not m["video_exists"]
        }

    # ── 6. Refresh _status.md ─────────────────────────────────────────────────
    all_entries = load_pipeline_state()
    entry = next((e for e in all_entries if e.slug == slug), None)
    if entry:
        s = compute_episode_status(entry)
        path = write_status(s)
        print(f"{OK} Refreshed {path.relative_to(ROOT)}")
    else:
        print(f"{WARN} '{slug}' not found in pipeline-state.json — _status.md not refreshed.")

    # ── 7. Report newly unblocked morphs ─────────────────────────────────────
    status_after = compute_asset_status(slug)
    if status_after and was_blocked:
        newly = [
            (m["from"], m["to"], m["tool"], m["intent"])
            for m in status_after["morphs"]
            if m["unblocked"] and not m["video_exists"]
            and (m["from"], m["to"]) in was_blocked
        ]
        if newly:
            print("\n  Newly unblocked morphs — open morph-prompts.md to generate:")
            for frm, to, tool, intent in newly:
                print(f"  · {frm} → {to}  ({tool})  {intent}")

    return 0


def _render_asset_registry(slug: str) -> list[str]:
    """Detailed asset-registry block for _status.md.

    Shows specific missing still IDs grouped by phase, all unblocked morphs,
    all blocked morphs with the specific still(s) they're waiting on, and the
    generation sequence so a new agent session can act without opening any
    additional files.  Returns [] if no registry exists for this episode.
    """
    status = compute_asset_status(slug)
    if status is None:
        return []

    # Re-read registry for motionType grouping (compute_asset_status strips it)
    registry_path = EPISODES_DIR / slug / "asset-registry.json"
    registry = json.loads(registry_path.read_text(encoding="utf-8"))
    motion_type_by_id = {a["id"]: a.get("motionType", "standalone") for a in registry.get("assets", [])}

    assets = status["assets"]
    morphs = status["morphs"]

    # ── Stills ────────────────────────────────────────────────────────────────
    # still_exists is None for static-template assets (no stillPath) — exclude those
    stills_with_path = {aid: a for aid, a in assets.items() if a["still_exists"] is not None}
    stills_present_ids = [aid for aid, a in stills_with_path.items() if a["still_exists"]]
    stills_missing_ids = [aid for aid, a in stills_with_path.items() if not a["still_exists"]]

    # Group missing stills by phase
    archival_missing  = [aid for aid in stills_missing_ids if motion_type_by_id.get(aid) == "archival"]
    bridge_missing    = [aid for aid in stills_missing_ids if motion_type_by_id.get(aid) in
                         ("morph-anchor", "morph-target", "morph-chain")]
    standalone_missing = [aid for aid in stills_missing_ids if motion_type_by_id.get(aid) == "standalone"]

    # ── Clips (standalone single-image-to-video) ───────────────────────────────
    videos_needed  = [a for a in assets.values() if a["video_exists"] is not None]
    videos_present = [a for a in videos_needed if a["video_exists"]]

    # ── Morphs ────────────────────────────────────────────────────────────────
    morphs_done      = [m for m in morphs if m["video_exists"]]
    morphs_unblocked = [m for m in morphs if m["unblocked"] and not m["video_exists"]]
    morphs_blocked   = [m for m in morphs if not m["unblocked"] and not m["video_exists"]]

    # ── Wired ─────────────────────────────────────────────────────────────────
    wired        = len(status["wired_segments"])
    total_footage = status["total_footage_segments"]

    lines = ["## Assets"]

    # Progress bars
    n_still_needed = len(stills_with_path)
    n_still_present = len(stills_present_ids)
    lines.append(
        f"  Stills    {_progress_bar(n_still_present, n_still_needed)}  "
        f"{n_still_present}/{n_still_needed}"
        + (f"  · {n_still_needed - n_still_present} missing" if stills_missing_ids else "  · all present")
    )
    lines.append(
        f"  Clips     {_progress_bar(len(videos_present), len(videos_needed))}  "
        f"{len(videos_present)}/{len(videos_needed)}"
        + (f"  · {len(videos_needed) - len(videos_present)} pending" if len(videos_present) < len(videos_needed) else "  · all ready")
    )
    lines.append(
        f"  Morphs    {_progress_bar(len(morphs_done), len(morphs))}  "
        f"{len(morphs_done)}/{len(morphs)}"
        + (f"  · {len(morphs_unblocked)} unblocked now" if morphs_unblocked else
           ("  · all generated" if len(morphs_done) == len(morphs) else ""))
    )
    lines.append(
        f"  Wired     {_progress_bar(wired, total_footage)}  "
        f"{wired}/{total_footage} footage segments"
    )

    # ── Segment → priority lookup (P1/P2/P3 from manifest timing) ──────────────
    # P1 = first third of episode, P2 = middle third, P3 = final third.
    # Used to surface which missing assets block early-episode renders first.
    seg_priority: dict[str, str] = {}   # segment_id → "P1" | "P2" | "P3"
    manifest_path_pri = ROOT / "remotion-templates" / "data" / "episodes" / slug / "assembly-manifest.json"
    if manifest_path_pri.exists():
        try:
            _mdata = json.loads(manifest_path_pri.read_text(encoding="utf-8"))
            _total_dur = float(_mdata.get("totalDurationSec") or 0)
            if _total_dur > 0:
                for _seg in _mdata.get("segments", []):
                    _start = float(_seg.get("startSec") or _seg.get("startTime") or 0)
                    _frac = _start / _total_dur
                    seg_priority[_seg["id"]] = "P1" if _frac < 0.34 else ("P2" if _frac < 0.67 else "P3")
        except (json.JSONDecodeError, KeyError, ValueError):
            pass  # non-fatal — priority tags are enhancement only

    def _asset_priority(aid: str) -> str:
        """Return the highest-priority (lowest number) tag across all segments for this asset."""
        asset_segs = registry.get("assets", [])
        seg_ids = next((a.get("segments", []) for a in asset_segs if a["id"] == aid), [])
        tags = [seg_priority.get(sid, "") for sid in seg_ids if seg_priority.get(sid)]
        if not tags:
            return ""
        for tag in ("P1", "P2", "P3"):
            if tag in tags:
                return tag
        return ""

    # ── Generation sequence (shown when work remains) ──────────────────────────
    work_remains = stills_missing_ids or morphs_unblocked or morphs_blocked
    if work_remains:
        lines.append("")
        lines.append("  **Generation sequence:**")
        step = 1
        if archival_missing:
            lines.append(f"  {step}. Archival stills — Wikimedia search (fastest, no queue):")
            for aid in archival_missing:
                tag = _asset_priority(aid)
                pri = f" [{tag}]" if tag else ""
                lines.append(f"       · {aid}{pri}")
            step += 1
        if bridge_missing or standalone_missing:
            lines.append(f"  {step}. AI-GEN stills — ChatGPT (`prompts/chatgpt-prompts.md`):")
            for aid in bridge_missing + standalone_missing:
                tag = _asset_priority(aid)
                pri = f" [{tag}]" if tag else ""
                lines.append(f"       · {aid}{pri}")
            step += 1
        if morphs_unblocked or morphs_blocked:
            lines.append(f"  {step}. Morph clips — Kling/Hailuo (`prompts/morph-prompts.md`):")
            step += 1
        lines.append(f"  {step}. After each new file in public/: run `pipeline_validator.py --write-status {slug}`")

    # ── Unblocked morphs (ready to generate now) ────────────────────────────────
    if morphs_unblocked:
        lines.append("")
        lines.append("  **Unblocked — generate now:**")
        for m in morphs_unblocked:
            lines.append(f"  · {m['from']} → {m['to']}  ({m['tool']})  {m['intent']}")

    # ── Blocked morphs with specific blockers ────────────────────────────────────
    if morphs_blocked:
        lines.append("")
        lines.append("  **Blocked morphs (waiting on stills):**")
        for m in morphs_blocked:
            blockers = []
            from_info = assets.get(m["from"], {})
            to_info   = assets.get(m["to"],   {})
            if from_info.get("still_exists") is False:
                blockers.append(m["from"])
            if to_info.get("still_exists") is False:
                blockers.append(m["to"])
            blocker_str = " + ".join(blockers) if blockers else "?"
            lines.append(
                f"  · {m['from']} → {m['to']}  ({m['tool']})  "
                f"needs: {blocker_str}"
            )

    lines.append("")
    return lines


# ── Main ──────────────────────────────────────────────────────────────────────

def check_oracle(slug: str | None = None) -> int:
    """Verify that every RENDER READY+ episode has at least one prediction entry
    in data/concepts.json (type: "prediction", introduced.episode == slug).

    This is the oracle-track gate: Parallax's brand commitment to timestamped,
    falsifiable predictions means every episode must commit at least one before
    publish. Without this gate, the commitment is aspirational prose only.

    Exit codes: 0 = all good, 1 = missing predictions on gated episodes.
    """
    if not CONCEPTS_JSON.is_file():
        print(f"✗ {CONCEPTS_JSON} not found", file=sys.stderr)
        return 2

    data = json.loads(CONCEPTS_JSON.read_text(encoding="utf-8"))
    concepts = data.get("concepts", [])

    # Build a map: episode_slug → count of prediction entries
    pred_counts: dict[str, int] = {}
    for c in concepts:
        if c.get("type") != "prediction":
            continue
        ep = (c.get("introduced") or {}).get("episode")
        if ep:
            pred_counts[ep] = pred_counts.get(ep, 0) + 1
        # Also count any appearances entries
        for app in c.get("appearances", []):
            ep2 = app.get("episode")
            if ep2:
                pred_counts[ep2] = pred_counts.get(ep2, 0) + 1

    # States that require an oracle entry before publishing
    ORACLE_REQUIRED_IDX = STATE_ORDER.index("RENDER READY")

    entries = load_pipeline_state()
    if not entries:
        print("✗ pipeline-state.json not found or empty", file=sys.stderr)
        return 2

    if slug:
        entries = [e for e in entries if e.slug == slug]
        if not entries:
            print(f"✗ episode '{slug}' not found in pipeline-state.json", file=sys.stderr)
            return 2

    problems: list[str] = []
    all_ok: list[str] = []
    skipped: list[str] = []

    for e in entries:
        idx = _stage_idx_for(e.state)
        if idx < ORACLE_REQUIRED_IDX:
            skipped.append(e.slug)
            continue
        count = pred_counts.get(e.slug, 0)
        if count == 0:
            problems.append(
                f"  {ERROR} {e.slug} ({e.state}) — no prediction entries in "
                f"data/concepts.json  (type: 'prediction', introduced.episode: '{e.slug}')"
            )
        else:
            all_ok.append(
                f"  {OK} {e.slug} ({e.state}) — {count} prediction "
                f"{'entry' if count == 1 else 'entries'}"
            )

    if not problems:
        for line in all_ok:
            print(line)
        if skipped:
            print(f"\n  (skipped: {', '.join(skipped)} — pre-RENDER READY state)")
        print(f"\n{OK} Oracle track: all RENDER READY+ episodes have prediction entries.")
        return 0

    print(f"\n{ERROR} Oracle track gate — missing prediction entries:\n")
    for line in problems:
        print(line)
    for line in all_ok:
        print(line)
    print(
        "\n  Fix: add an entry to data/concepts.json with:\n"
        "       \"type\": \"prediction\", "
        "\"introduced\": {\"episode\": \"<slug>\", ...}\n"
        "  Predictions are the oracle track — Parallax's core brand commitment."
    )
    return 1


def session_brief(episode: str | None = None) -> int:
    """Print a compact session-start digest: at-a-glance table + top 3 next
    actions per active episode. Designed to orient the operator in <10 seconds.

    Covers all non-RETROED episodes (or just one if episode is specified).
    """
    entries = load_pipeline_state()
    if not entries:
        print("✗ pipeline-state.json not found or empty", file=sys.stderr)
        return 2

    if episode:
        entries = [e for e in entries if e.slug == episode]
        if not entries:
            print(f"✗ episode '{episode}' not found in pipeline-state.json", file=sys.stderr)
            return 2

    statuses = [compute_episode_status(e) for e in entries]

    # ── At-a-glance table ────────────────────────────────────────────────────
    today = datetime.date.today().isoformat()
    print(f"\n{'═' * 62}")
    print(f"  Parallax — Session Brief                    {today}")
    print(f"{'═' * 62}\n")
    print(f"{'Episode':<30}  {'State':<20}  {'Health'}")
    print(f"{'─' * 30}  {'─' * 20}  {'─' * 30}")
    for s in statuses:
        badge = STATE_BADGES.get(s.state, s.state)
        print(f"{s.slug:<30}  {badge:<20}  {s.health_summary}")
    print()

    # ── Per-episode next actions (skip RETROED/PUBLISHED) ───────────────────
    active = [s for s in statuses if s.state not in ("RETROED", "PUBLISHED")]
    if not active:
        print("All episodes shipped. Nothing left to do.\n")
        return 0

    for s in active:
        print(f"── {s.slug} ({s.state}) {'─' * max(0, 54 - len(s.slug) - len(s.state))}")
        actions = _compute_next_actions(s)
        if not actions:
            print("  ✓ No blockers — episode is clean.\n")
            continue
        for i, (_, label, cmd) in enumerate(actions[:3], 1):
            print(f"  {i}. {label}")
            if cmd:
                print(f"     $ {cmd}")
        print()

    # ── Oracle track reminder for RENDER READY+ ──────────────────────────────
    render_ready = [s for s in active if s.stage_idx >= STATE_ORDER.index("RENDER READY")]
    if render_ready:
        print("─" * 62)
        print("  Oracle check:")
        oracle_rc = check_oracle(render_ready[0].slug if len(render_ready) == 1 else None)
        if oracle_rc != 0:
            print("  ⚠  Run: python3 tools/pipeline_validator.py --check-oracle")
        print()

    return 0


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
        "--dry-run",
        action="store_true",
        dest="dry_run",
        help=(
            "With --fix: print the renames that would be performed without "
            "executing them. Has no effect on other flags."
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
        "--check-sources",
        action="store_true",
        help=(
            "Verify CLAUDE.md + project/IDEAS.md state tables agree with "
            "pipeline-state.json (the single source of truth). Read-only; "
            "exits 1 on any drift. Wired into scripts/lint.sh so the two "
            "human-facing tables can never silently contradict the JSON."
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
    parser.add_argument(
        "--emit-html",
        action="store_true",
        help=(
            "Regenerate the visual pipeline dashboard at "
            "episodes/PIPELINE.html from current state. Reads "
            "the same data sources as --write-status (pipeline-state.json + "
            "per-episode _status.md inputs) plus project/IDEAS.md for the "
            "Topics tab. Pair with --check for a freshness-only gate."
        ),
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help=(
            "Freshness dry-run (don't write, compare instead; exit 1 if stale). "
            "With --emit-html: compares PIPELINE.html. With --update-tracker: "
            "compares the PIPELINE.md At-a-glance table + Topics block. Both are "
            "wired into scripts/lint.sh as freshness gates."
        ),
    )
    parser.add_argument(
        "--watch",
        action="store_true",
        help=(
            "With --emit-html: render once, then poll source files for "
            "mtime changes and re-emit on each change. Stays open until "
            "Ctrl-C. Use during dashboard design iteration — edit "
            "pipeline_html.py, save, reload browser to see the change. "
            "Incompatible with --check."
        ),
    )
    parser.add_argument(
        "--intake",
        nargs=2,
        metavar=("SLUG", "ASSET_ID"),
        help=(
            "Wire an approved asset into assembly-manifest.json and refresh _status.md. "
            "Copy the treated file to public/episodes/{slug}/stills/ or clips/ first. "
            "Example: --intake prisoners-dilemma arch-rand-hq"
        ),
    )
    parser.add_argument(
        "--check-oracle",
        action="store_true",
        help=(
            "Verify that every RENDER READY+ episode has at least one prediction "
            "entry (type: 'prediction') in data/concepts.json. The oracle track is "
            "Parallax's core brand commitment — timestamped falsifiable predictions "
            "before publish. Read-only; exits 1 when any gated episode is missing "
            "predictions. Pair with an episode slug to check only that episode."
        ),
    )
    parser.add_argument(
        "--session-brief",
        action="store_true",
        help=(
            "Print a compact session-start digest: at-a-glance table + top 3 "
            "next actions per active episode. Designed to orient the operator in "
            "under 10 seconds without opening any files. Read-only; always exits 0."
        ),
    )
    args = parser.parse_args()

    # ── --intake path ────────────────────────────────────────────────────────
    # Wire one approved asset into assembly-manifest.json + refresh _status.md.
    # Standalone path — does not run the validation or write-status flows.
    if args.intake:
        return intake_asset(args.intake[0], args.intake[1])

    # ── --session-brief path ─────────────────────────────────────────────────
    # Compact session-start digest: at-a-glance table + top 3 next actions per
    # active episode. Run this at the start of every production session.
    if args.session_brief:
        return session_brief(args.episode)

    # ── --check-oracle path ──────────────────────────────────────────────────
    # Oracle-track gate: verify RENDER READY+ episodes have prediction entries.
    # Enforces the brand commitment to falsifiable, timestamped predictions.
    if args.check_oracle:
        return check_oracle(args.episode)

    # ── --check-sources path ─────────────────────────────────────────────────
    # Standalone consistency gate: CLAUDE.md + IDEAS.md state tables vs
    # pipeline-state.json. Read-only; exit 1 on drift. Used by scripts/lint.sh.
    if args.check_sources:
        problems = check_source_consistency()
        if problems:
            print(f"{ERROR} Source-of-truth drift — secondary state tables disagree "
                  "with episodes/pipeline-state.json:\n")
            for p in problems:
                print(f"  {ERROR} {p}")
            print("\n  Fix: edit pipeline-state.json (canonical), then update the "
                  "CLAUDE.md / IDEAS.md rows to carry the same lifecycle token.")
            return 1
        print(f"{OK} Source consistency: CLAUDE.md + project/IDEAS.md + publish-order.json "
              "agree with pipeline-state.json on every episode's state.")
        return 0

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

    # ── --emit-html path ─────────────────────────────────────────────────────
    # Delegate to pipeline_html.emit_html — handles write + --check
    # freshness comparison + --watch live-rerender. Exits without running
    # the legacy flow.
    if args.emit_html:
        from pipeline_html import emit_html
        return emit_html(check=args.check, watch=args.watch)

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

        # ── --update-tracker --check: PIPELINE.md freshness gate ──────────────
        # Dry-run: detect whether the At-a-glance table or Topics block would
        # change if regenerated. Mirrors the --emit-html --check HTML gate so
        # the Markdown dashboard can't silently age between manual runs.
        if args.update_tracker and args.check:
            health_pending = update_tracker_health(all_statuses, check=True)
            topics_pending = update_tracker_topics(check=True)
            if health_pending or topics_pending:
                bits = []
                if health_pending:
                    bits.append("At-a-glance Health/day columns")
                if topics_pending:
                    bits.append("Topics auto-summary block")
                print(f"{ERROR} PIPELINE.md is STALE — {' + '.join(bits)} "
                      "would change if regenerated.")
                print("  Fix: python3 tools/pipeline_validator.py "
                      "--write-status --update-tracker")
                return 1
            print(f"{OK} PIPELINE.md At-a-glance + Topics block are fresh.")
            return 0

        if args.check_only:
            # Dry-run mode: print health summary AND run full per-episode
            # validation (required-artifact errors + stale-state detection that
            # the health chips alone miss) AND the source-consistency gate.
            print("\nPipeline status summary (--check-only; no files written):\n")
            any_warnings = False
            for s in targeted:
                print(f"  {s.slug:<30} {STATE_BADGES.get(s.state, s.state):<20} {s.health_summary}")
                if s.health_summary not in ("✓ clean", "✓ shipped", "⏸ awaiting promotion"):
                    any_warnings = True

            # Full validation for the targeted episodes (read-only).
            targeted_slugs = {s.slug for s in targeted}
            val_reports = [
                validate_episode(r) for r in parse_pipeline_md()
                if r.slug in targeted_slugs
            ]
            val_errors = [(r.slug, f.msg) for r in val_reports for f in r.errors]
            if val_errors:
                print("\n  Validation errors (required artifacts / state):")
                for slug, msg in val_errors:
                    print(f"    {ERROR} {slug}: {msg}")

            # Stale-state warnings (declared state behind on-disk evidence).
            stale_findings = [
                (r.slug, f.msg) for r in val_reports for f in r.findings
                if "STALE" in f.msg
            ]
            if stale_findings:
                print("\n  Stale state (declared state behind artifacts):")
                for slug, msg in stale_findings:
                    first_line = msg.splitlines()[0]
                    print(f"    {WARN} {slug}: {first_line}")
                any_warnings = True

            # Source-of-truth consistency (full run only).
            src_problems = [] if args.episode else check_source_consistency()
            if src_problems:
                print("\n  Source drift:")
                for p in src_problems:
                    print(f"    {ERROR} {p}")

            print()
            return 1 if (any_warnings or val_errors or src_problems) else 0

        if args.write_status:
            for s in targeted:
                path = write_status(s)
                print(f"✓ wrote {path.relative_to(ROOT)}")
        if args.update_tracker:
            changed = update_tracker_health(all_statuses)
            print(f"{'✓ updated' if changed else '✓ no change to'} episodes/PIPELINE.md (At-a-glance Health column)")
            topics_changed = update_tracker_topics()
            print(
                f"{'✓ updated' if topics_changed else '✓ no change to'} "
                "episodes/PIPELINE.md (Topics auto-summary block)"
            )
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
        if args.dry_run:
            print("\n── Naming drift (dry-run — no files moved) " + "─" * 23)
        fix_summary: list[str] = []
        for row in rows:
            ep_dir = EPISODES_DIR / row.slug
            if not ep_dir.is_dir():
                continue
            renames = fix_naming_drift(ep_dir, dry_run=args.dry_run)
            if renames:
                fix_summary.append(f"\n  {row.slug}:")
                fix_summary.extend(renames)
        if fix_summary:
            if not args.dry_run:
                print("\n── Naming drift fixes " + "─" * 35)
            for line in fix_summary:
                print(line)
            if args.dry_run:
                print("\n  (dry-run — re-run without --dry-run to apply)")
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

    # Source-of-truth consistency (only on a full run — a single-episode run
    # shouldn't fail on drift in OTHER episodes' rows). Counts as error(s).
    source_problems: list[str] = []
    if not args.episode:
        source_problems = check_source_consistency()
        if source_problems:
            print("\n── Source consistency " + "─" * 35)
            for p in source_problems:
                print(f"  {ERROR} {p}")
            total_errors += len(source_problems)

    print("\n── Summary " + "─" * 46)
    print(f"  {len(reports)} episode(s) checked  "
          f"· {total_errors} error(s)  · {total_warnings} warning(s)")
    if stale:
        print(f"  Stale state detected: {', '.join(stale)}")
    if source_problems:
        print(f"  Source drift: {len(source_problems)} table(s) disagree with pipeline-state.json")
    if total_errors == 0 and total_warnings == 0:
        print("  ✓ All checks passed — PIPELINE.md + state tables consistent with artifacts.")
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
