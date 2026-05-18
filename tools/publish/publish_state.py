#!/usr/bin/env python3
"""
publish_state.py — track the lifecycle state of every queued episode.

`episodes/publish-order.json` is the source of truth for episode
status (DRAFT / RENDERED / SCHEDULED / PUBLISHED / RETROED), but
nothing else verifies that the artifacts the state claims exist
actually do. This tool walks the queue, inspects each episode's
filesystem footprint, and reports the gap between declared state and
artifact reality.

What gets checked per episode (in pipeline order):

  · brief.md                    — research brief from research stage
  · angle-memo.md               — angle-memo skill output
  · viability.md                — viability assessment
  · script-production.md        — production script (canonical or vN)
  · assembly-manifest.json      — Remotion assembly manifest
  · narration.wav               — final narration recording
  · thumbnail-spec.json         — thumbnail concept spec
  · shorts-manifest.json        — Shorts manifest (or proposed)
  · render output               — any *.mp4 under episodes/<slug>/output/
  · publish-order.state         — declared state in publish-order.json

Each artifact is either ✓ (present), ⚠ (alternate location / partial),
or ✗ (missing). The combined view tells you exactly where each episode
sits in the pipeline at a glance — and surfaces declared-but-not-built
states (e.g. "state: rendered, but no mp4 file") that would otherwise
silently propagate.

Usage:
    python3 tools/publish/publish_state.py
    python3 tools/publish/publish_state.py --slug prisoners-dilemma
    python3 tools/publish/publish_state.py --json
    python3 tools/publish/publish_state.py --strict
        # exit 1 if any episode has declared state ahead of actual artifacts

Exit codes:
    0 — all episodes consistent (or no inconsistencies under non-strict)
    1 — declared state ahead of artifacts under --strict
    2 — usage / missing publish-order.json
"""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass, field
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"
REMOTION_DATA = ROOT / "remotion-templates" / "data" / "episodes"
PUBLISH_ORDER_PATH = EPISODES_DIR / "publish-order.json"

# ── Tunables ─────────────────────────────────────────────────────────────────

# Canonical pipeline ordering — the state machine for each episode.
# Each declared state implies all earlier artifacts MUST exist.
PIPELINE_STATES = [
    "draft", "viable", "scripted", "audited",
    "manifested", "narrated", "rendered",
    "scheduled", "published", "retroed",
]

# Map declared state → minimum required artifacts (state ≥ this means
# these MUST exist for the declaration to be coherent).
STATE_REQUIREMENTS = {
    "draft":      ["brief"],
    "viable":     ["brief", "viability"],
    "scripted":   ["brief", "viability", "angle_memo", "script"],
    # `audited` requires the script-audit.md artifact in addition to
    # `scripted`. Without it the state is structurally identical to
    # `scripted` and the consistency check is meaningless — anyone can
    # declare audited without running the audit.
    "audited":    ["brief", "viability", "angle_memo", "script", "script_audit"],
    "manifested": ["brief", "viability", "angle_memo", "script", "script_audit", "manifest"],
    "narrated":   ["brief", "viability", "angle_memo", "script", "script_audit", "manifest", "narration"],
    "rendered":   ["brief", "viability", "angle_memo", "script", "script_audit", "manifest", "narration", "rendered_mp4"],
    "scheduled":  ["brief", "viability", "angle_memo", "script", "script_audit", "manifest", "narration", "rendered_mp4", "thumbnail"],
    "published":  ["brief", "viability", "angle_memo", "script", "script_audit", "manifest", "narration", "rendered_mp4", "thumbnail"],
    "retroed":    ["brief", "viability", "angle_memo", "script", "script_audit", "manifest", "narration", "rendered_mp4", "thumbnail"],
}


# ── Data shapes ──────────────────────────────────────────────────────────────


@dataclass
class ArtifactCheck:
    """One artifact check result."""
    name: str
    exists: bool
    path: str = ""           # actual resolved path if exists
    note: str = ""           # alternate-location / partial notes


@dataclass
class EpisodeState:
    """Per-episode state report."""
    slug: str
    title: str
    declared_state: str
    artifacts: dict[str, ArtifactCheck] = field(default_factory=dict)
    missing_required: list[str] = field(default_factory=list)
    consistency_ok: bool = True

    @property
    def progress_pct(self) -> int:
        """Fraction of artifacts present (0-100)."""
        if not self.artifacts:
            return 0
        present = sum(1 for a in self.artifacts.values() if a.exists)
        return int(100 * present / len(self.artifacts))


@dataclass
class StateReport:
    publish_order_path: str
    episodes: list[EpisodeState] = field(default_factory=list)

    @property
    def any_inconsistent(self) -> bool:
        return any(not e.consistency_ok for e in self.episodes)


# ── Artifact checkers ──────────────────────────────────────────────────────


def _find_script(ep_dir: Path) -> Path | None:
    """Canonical script-production.md, then highest versioned."""
    canonical = ep_dir / "script-production.md"
    if canonical.is_file():
        return canonical
    versioned = sorted(ep_dir.glob("script-v*-production.md"))
    return versioned[-1] if versioned else None


# Minimum size to count an mp4 as a "real" render. Truncated / failed
# Remotion renders frequently end up as multi-MB stubs without a valid
# moov atom; we filter the obvious garbage by size threshold. A real
# 1080p H.264 episode at 13 min lands ≥ 80MB even at low bitrate.
RENDERED_MP4_MIN_BYTES = 1_000_000   # 1 MB


def _find_render_mp4(ep_dir: Path) -> Path | None:
    """Any *.mp4 under episodes/<slug>/output/ or render-output/.
    Returns the largest by file size that passes a minimum-size sanity
    check (rejects truncated / failed renders that landed as small
    stubs). Returns None if no qualifying mp4 exists."""
    for output_dirname in ("output", "render-output", "renders"):
        output_dir = ep_dir / output_dirname
        if not output_dir.is_dir():
            continue
        mp4s = [
            p for p in output_dir.glob("*.mp4")
            if p.stat().st_size >= RENDERED_MP4_MIN_BYTES
        ]
        if mp4s:
            return max(mp4s, key=lambda p: p.stat().st_size)
    return None


def check_episode_artifacts(slug: str) -> dict[str, ArtifactCheck]:
    """Run every per-episode artifact check. Returns a dict keyed by
    pipeline-stage name."""
    ep_dir = EPISODES_DIR / slug
    remotion_dir = REMOTION_DATA / slug

    out: dict[str, ArtifactCheck] = {}

    # Brief
    brief = ep_dir / "brief.md"
    out["brief"] = ArtifactCheck(
        name="brief.md", exists=brief.is_file(),
        path=str(brief) if brief.is_file() else "",
    )

    # Viability
    viab = ep_dir / "viability.md"
    out["viability"] = ArtifactCheck(
        name="viability.md", exists=viab.is_file(),
        path=str(viab) if viab.is_file() else "",
    )

    # Angle memo
    angle = ep_dir / "angle-memo.md"
    out["angle_memo"] = ArtifactCheck(
        name="angle-memo.md", exists=angle.is_file(),
        path=str(angle) if angle.is_file() else "",
    )

    # Script — canonical or versioned
    script = _find_script(ep_dir)
    out["script"] = ArtifactCheck(
        name="script-production.md", exists=script is not None,
        path=str(script) if script else "",
        note=("versioned" if script and "-v" in script.name else "") if script else "",
    )

    # Script audit report (output of the script-audit skill). Distinct
    # artifact so the `audited` state actually means something.
    audit = ep_dir / "script-audit.md"
    out["script_audit"] = ArtifactCheck(
        name="script-audit.md", exists=audit.is_file(),
        path=str(audit) if audit.is_file() else "",
    )

    # Assembly manifest
    manifest = remotion_dir / "assembly-manifest.json"
    out["manifest"] = ArtifactCheck(
        name="assembly-manifest.json", exists=manifest.is_file(),
        path=str(manifest) if manifest.is_file() else "",
    )

    # Narration WAV
    narration = ep_dir / "assets" / "narration.wav"
    scratch = ep_dir / "assets" / "narration-scratch.wav"
    if narration.is_file():
        out["narration"] = ArtifactCheck(
            name="narration.wav", exists=True, path=str(narration),
        )
    elif scratch.is_file():
        out["narration"] = ArtifactCheck(
            name="narration.wav", exists=False, path=str(scratch),
            note="scratch only — final not yet recorded",
        )
    else:
        out["narration"] = ArtifactCheck(name="narration.wav", exists=False)

    # Thumbnail spec
    thumb = ep_dir / "thumbnail-spec.json"
    out["thumbnail"] = ArtifactCheck(
        name="thumbnail-spec.json", exists=thumb.is_file(),
        path=str(thumb) if thumb.is_file() else "",
    )

    # Shorts manifest (canonical or proposed)
    shorts = ep_dir / "shorts-manifest.json"
    shorts_proposed = ep_dir / "shorts-manifest-proposed.json"
    if shorts.is_file():
        out["shorts"] = ArtifactCheck(
            name="shorts-manifest.json", exists=True, path=str(shorts),
        )
    elif shorts_proposed.is_file():
        out["shorts"] = ArtifactCheck(
            name="shorts-manifest.json", exists=False,
            path=str(shorts_proposed),
            note="proposed only — not yet promoted",
        )
    else:
        out["shorts"] = ArtifactCheck(name="shorts-manifest.json", exists=False)

    # Rendered MP4
    mp4 = _find_render_mp4(ep_dir)
    out["rendered_mp4"] = ArtifactCheck(
        name="output/*.mp4", exists=mp4 is not None,
        path=str(mp4) if mp4 else "",
    )

    return out


def evaluate_consistency(
    declared_state: str, artifacts: dict[str, ArtifactCheck],
) -> tuple[bool, list[str]]:
    """Check that all artifacts required by the declared state are present.
    Returns (consistency_ok, missing_required_artifact_keys)."""
    required = STATE_REQUIREMENTS.get(declared_state.lower(), [])
    missing = [
        key for key in required
        if key not in artifacts or not artifacts[key].exists
    ]
    return (not missing, missing)


# ── Top-level ───────────────────────────────────────────────────────────────


def load_publish_order(path: Path = PUBLISH_ORDER_PATH) -> dict:
    """Load publish-order.json. Raises FileNotFoundError if missing.
    Warns to stderr (but does not fail) if both `queue` and `published`
    keys are absent — a likely sign of a corrupt or empty file that
    would otherwise silently produce a zero-episode report."""
    if not path.is_file():
        raise FileNotFoundError(f"publish-order.json not found at {path}")
    data = json.loads(path.read_text(encoding="utf-8"))
    if not any(k in data for k in ("queue", "published")):
        print(
            f"⚠ publish_state: {path} has neither 'queue' nor 'published' "
            f"keys — report will be empty. Is the file corrupt?",
            file=sys.stderr,
        )
    return data


def build_state_report(
    slug_filter: str | None = None,
    publish_order_path: Path = PUBLISH_ORDER_PATH,
) -> StateReport:
    """Walk every queued + published episode, run all checks. If
    `slug_filter` is set, only that slug is reported."""
    order = load_publish_order(publish_order_path)
    queue_entries: list[dict] = order.get("queue", []) + order.get("published", [])

    episodes: list[EpisodeState] = []
    for entry in queue_entries:
        slug = entry.get("slug", "")
        if not slug:
            continue
        if slug_filter and slug != slug_filter:
            continue
        artifacts = check_episode_artifacts(slug)
        declared = (entry.get("state") or "draft").lower()
        ok, missing = evaluate_consistency(declared, artifacts)
        episodes.append(EpisodeState(
            slug=slug,
            title=entry.get("title", ""),
            declared_state=declared,
            artifacts=artifacts,
            missing_required=missing,
            consistency_ok=ok,
        ))

    return StateReport(
        publish_order_path=str(publish_order_path), episodes=episodes,
    )


# ── Rendering ───────────────────────────────────────────────────────────────


_ARTIFACT_DISPLAY_ORDER = [
    "brief", "viability", "angle_memo", "script", "script_audit",
    "manifest", "narration", "rendered_mp4", "thumbnail", "shorts",
]


def render_state_md(report: StateReport) -> str:
    lines = [
        "# Publish-State Report",
        "",
        f"_Source: `{report.publish_order_path}`. State checks for "
        f"{len(report.episodes)} queued + published episode(s)._",
        "",
        "## At a glance",
        "",
        "| Slug | State | Progress | Inconsistency |",
        "|---|---|---|---|",
    ]
    for e in report.episodes:
        consist = "✓" if e.consistency_ok else f"⚠ missing: {', '.join(e.missing_required)}"
        lines.append(
            f"| `{e.slug}` | {e.declared_state} | "
            f"{e.progress_pct}% | {consist} |"
        )
    lines.extend(["", "## Per-episode detail", ""])

    for e in report.episodes:
        lines.extend([
            f"### {e.slug} — _{e.title}_",
            "",
            f"**Declared state:** `{e.declared_state}` · "
            f"**Pipeline progress:** {e.progress_pct}%",
        ])
        if not e.consistency_ok:
            lines.append(
                f"⚠ **Inconsistency:** declared state requires "
                f"`{', '.join(e.missing_required)}` — not present on disk."
            )
        lines.extend(["", "| Artifact | Status | Notes |", "|---|---|---|"])
        for key in _ARTIFACT_DISPLAY_ORDER:
            a = e.artifacts.get(key)
            if a is None:
                continue
            icon = "✓" if a.exists else ("⚠" if a.note else "✗")
            note = a.note or ("" if a.exists else "missing")
            lines.append(f"| {a.name} | {icon} | {note} |")
        lines.append("")
    lines.extend([
        "---",
        "",
        "_Run: `python3 tools/publish/publish_state.py`_",
        "",
    ])
    return "\n".join(lines)


# ── CLI ─────────────────────────────────────────────────────────────────────


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument(
        "--slug",
        help="Limit report to one episode slug (default: all queued + published).",
    )
    parser.add_argument(
        "--strict", action="store_true",
        help="Exit 1 if any episode's declared state requires artifacts "
             "that don't exist on disk.",
    )
    parser.add_argument("--json", action="store_true", help="Emit JSON.")
    parser.add_argument("--stdout", action="store_true", help="Print to stdout.")
    parser.add_argument("-o", "--output", help="Write report to file.")
    args = parser.parse_args()

    try:
        report = build_state_report(slug_filter=args.slug)
    except FileNotFoundError as e:
        print(f"✗ {e}", file=sys.stderr)
        return 2

    if args.json:
        out = json.dumps({
            "publish_order_path": report.publish_order_path,
            "episodes": [
                {
                    "slug": e.slug, "title": e.title,
                    "declared_state": e.declared_state,
                    "progress_pct": e.progress_pct,
                    "consistency_ok": e.consistency_ok,
                    "missing_required": e.missing_required,
                    "artifacts": {k: asdict(v) for k, v in e.artifacts.items()},
                }
                for e in report.episodes
            ],
        }, indent=2)
    else:
        out = render_state_md(report)

    if args.stdout or not args.output:
        sys.stdout.write(out)
    if args.output:
        out_path = Path(args.output).resolve()
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(out, encoding="utf-8")
        rel = out_path.relative_to(ROOT) if out_path.is_relative_to(ROOT) else out_path
        if not args.stdout:
            print(f"✓ wrote {rel}", file=sys.stderr)

    if args.strict and report.any_inconsistent:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
