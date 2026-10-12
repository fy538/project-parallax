#!/usr/bin/env python3
"""
pre_publish_check.py — Pre-publish gate for Parallax episodes.

Enforces the minimum requirements before an episode goes live on YouTube.
Runs hard gates (exit 1 on failure) and soft checks (warnings only, unless
--strict is given), then prints a manual verification checklist.

Usage:
    python3 tools/publish/pre_publish_check.py <slug>
    python3 tools/publish/pre_publish_check.py <slug> --strict
    python3 tools/publish/pre_publish_check.py <slug> --json

Exit codes:
    0 — all hard gates pass (warnings may exist)
    1 — at least one hard gate failed (or --strict + warnings)
    2 — usage error / episode not found
"""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Literal

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "shared"))
from paths import get_project_root  # noqa: E402

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from status_emoji import ERROR  # noqa: E402

ROOT = get_project_root()
EPISODES_DIR = ROOT / "episodes"
CONCEPTS_JSON = ROOT / "data" / "concepts.json"
PIPELINE_STATE_PATH = EPISODES_DIR / "pipeline-state.json"
COST_LOG_PATH = EPISODES_DIR / "COST_LOG.md"

# States considered "render-ready or later" (index >= 5 in the canonical order).
STATE_ORDER = [
    "INCUBATING", "VIABLE", "RESEARCHING", "RESEARCH READY",
    "DRAFTING", "RENDER READY", "IN POST", "PUBLISHED", "RETROED",
]
RENDER_READY_INDEX = STATE_ORDER.index("RENDER READY")

Status = Literal["pass", "fail", "warn"]

DIVIDER = "═" * 62


@dataclass
class CheckResult:
    name: str
    status: Status   # "pass" | "fail" | "warn"
    message: str
    hint: str = ""   # optional fix hint printed for failures


# ── Helpers ───────────────────────────────────────────────────────────────────

def _icon(status: Status) -> str:
    return {"pass": "✓", "fail": "✗", "warn": "⚠"}[status]


def _load_pipeline_state() -> dict:
    if not PIPELINE_STATE_PATH.exists():
        return {}
    with PIPELINE_STATE_PATH.open() as fh:
        return json.load(fh)


def _load_concepts() -> list[dict]:
    if not CONCEPTS_JSON.exists():
        return []
    with CONCEPTS_JSON.open() as fh:
        data = json.load(fh)
    return data.get("concepts", [])


def _episode_state(slug: str) -> str | None:
    """Return the current pipeline state string for slug, or None."""
    state_data = _load_pipeline_state()
    for ep in state_data.get("episodes", []):
        if ep.get("slug") == slug:
            return ep.get("state")
    return None


# ── Hard gate checks ─────────────────────────────────────────────────────────

def check_oracle_track(slug: str) -> CheckResult:
    """concepts.json must have >= 1 prediction entry for this episode."""
    concepts = _load_concepts()
    predictions = [
        c for c in concepts
        if c.get("type") == "prediction"
        and c.get("introduced", {}).get("episode") == slug
    ]
    count = len(predictions)
    if count == 0:
        return CheckResult(
            name="Oracle track",
            status="fail",
            message="no prediction entry in data/concepts.json",
            hint=(
                "Add a bounded verdict to data/concepts.json with "
                f'"type": "prediction", "introduced": {{"episode": "{slug}", ...}}. '
                "See project/ORACLE_TRACK.md."
            ),
        )
    return CheckResult(
        name="Oracle track",
        status="pass",
        message=f"{count} prediction {'entry' if count == 1 else 'entries'} committed",
    )


def check_episode_state(slug: str) -> CheckResult:
    """Episode must be at RENDER READY or later in pipeline-state.json."""
    state = _episode_state(slug)
    if state is None:
        return CheckResult(
            name="Episode state",
            status="fail",
            message=f"slug '{slug}' not found in episodes/pipeline-state.json",
            hint="Add the episode to pipeline-state.json before publishing.",
        )
    try:
        idx = STATE_ORDER.index(state)
    except ValueError:
        # Failure states (BLOCKED, REVISING) or unknown — not publish-ready.
        return CheckResult(
            name="Episode state",
            status="fail",
            message=f"state '{state}' is not a publish-ready lifecycle state",
            hint="Advance the episode to RENDER READY or later.",
        )
    if idx < RENDER_READY_INDEX:
        return CheckResult(
            name="Episode state",
            status="fail",
            message=f"state is {state} — must be RENDER READY or later",
            hint="Advance the episode to RENDER READY in pipeline-state.json.",
        )
    return CheckResult(
        name="Episode state",
        status="pass",
        message=f"{state} (pipeline-state.json)",
    )


def check_pipeline_validator(slug: str) -> CheckResult:
    """Run pipeline_validator.py --check-only <slug>; fail if it exits non-zero."""
    validator_path = ROOT / "tools" / "pipeline_validator.py"
    if not validator_path.exists():
        return CheckResult(
            name="Pipeline validator",
            status="fail",
            message="tools/pipeline_validator.py not found",
            hint="The validator script is missing from the repository.",
        )
    result = subprocess.run(
        [sys.executable, str(validator_path), "--check-only", slug],
        capture_output=True,
        text=True,
        cwd=str(ROOT),
    )
    if result.returncode != 0:
        # Count error lines (lines starting with 🔴) for a concise summary.
        error_lines = [
            ln for ln in result.stdout.splitlines()
            if ERROR in ln or "Validation error" in ln
        ]
        count = len([ln for ln in result.stdout.splitlines() if ERROR in ln])
        summary = f"{count} hard {'error' if count == 1 else 'errors'}" if count else "errors"
        return CheckResult(
            name="Pipeline validator",
            status="fail",
            message=f"{summary} (run --check-only for details)",
            hint=f"python3 tools/pipeline_validator.py --check-only {slug}",
        )
    return CheckResult(
        name="Pipeline validator",
        status="pass",
        message="clean (no hard errors)",
    )


# ── Soft checks ───────────────────────────────────────────────────────────────

def check_sourcing_doc(slug: str) -> CheckResult:
    """episodes/<slug>/development/sourcing-brief.md or publish/sources.md."""
    ep_dir = EPISODES_DIR / slug
    candidates = [
        ep_dir / "development" / "sourcing-brief.md",
        ep_dir / "publish" / "sources.md",
    ]
    for path in candidates:
        if path.exists():
            rel = path.relative_to(ROOT / "episodes" / slug)
            return CheckResult(
                name="Sourcing doc",
                status="pass",
                message=f"present ({rel})",
            )
    return CheckResult(
        name="Sourcing doc",
        status="warn",
        message="no sourcing-brief.md or publish/sources.md found",
        hint=(
            f"Run: python3 tools/sourcing_brief.py --episode={slug} "
            f"or create episodes/{slug}/publish/sources.md"
        ),
    )


def check_cost_log(slug: str) -> CheckResult:
    """COST_LOG.md must have at least one data row for this slug."""
    if not COST_LOG_PATH.exists():
        return CheckResult(
            name="Cost log",
            status="warn",
            message="episodes/COST_LOG.md not found",
            hint="Initialize with: python3 tools/cost_tracker.py add --episode <slug> ...",
        )
    text = COST_LOG_PATH.read_text()
    # A data row (not the header, not the init row) will contain the slug.
    # The init row is '(system)' not a real episode slug.
    data_lines = [
        ln for ln in text.splitlines()
        if f"| {slug} |" in ln or f"| {slug}\t" in ln
    ]
    if not data_lines:
        return CheckResult(
            name="Cost log",
            status="warn",
            message=f"no entries for '{slug}' in COST_LOG.md",
            hint=(
                f"Log costs: python3 tools/cost_tracker.py add "
                f"--episode {slug} --service claude --amount <X> --note \"...\""
            ),
        )
    return CheckResult(
        name="Cost log",
        status="pass",
        message=f"{len(data_lines)} {'entry' if len(data_lines) == 1 else 'entries'} logged",
    )


def check_thumbnails(slug: str) -> CheckResult:
    """thumbnail-concepts.md or thumbnail-spec.json must exist."""
    ep_dir = EPISODES_DIR / slug
    candidates = [
        ep_dir / "publish" / "thumbnail-concepts.md",
        ep_dir / "thumbnail-spec.json",
    ]
    for path in candidates:
        if path.exists():
            rel = path.relative_to(ep_dir)
            return CheckResult(
                name="Thumbnails",
                status="pass",
                message=f"present ({rel})",
            )
    return CheckResult(
        name="Thumbnails",
        status="warn",
        message="no thumbnail-concepts.md or thumbnail-spec.json",
        hint=(
            f"Run the thumbnail-concept skill or: "
            f"cd remotion-templates && npm run thumbnails -- --episode={slug}"
        ),
    )


def check_shorts_brief(slug: str) -> CheckResult:
    """episodes/<slug>/publish/shorts-brief.md must exist."""
    path = EPISODES_DIR / slug / "publish" / "shorts-brief.md"
    if path.exists():
        return CheckResult(
            name="Shorts brief",
            status="pass",
            message="present (publish/shorts-brief.md)",
        )
    return CheckResult(
        name="Shorts brief",
        status="warn",
        message="publish/shorts-brief.md not found",
        hint="Run the shorts-adaptation skill after narration is locked.",
    )


def check_audio_cue_sheet(slug: str) -> CheckResult:
    """episodes/<slug>/audio/audio-cue-sheet.md must exist."""
    path = EPISODES_DIR / slug / "audio" / "audio-cue-sheet.md"
    if path.exists():
        return CheckResult(
            name="Audio cue sheet",
            status="pass",
            message="present (audio/audio-cue-sheet.md)",
        )
    return CheckResult(
        name="Audio cue sheet",
        status="warn",
        message="audio/audio-cue-sheet.md not found",
        hint="Run the audio-spec skill to generate the 3-layer cue sheet.",
    )


# ── Output formatters ─────────────────────────────────────────────────────────

def _print_result(result: CheckResult, indent: int = 2) -> None:
    prefix = " " * indent
    icon = _icon(result.status)
    print(f"{prefix}{icon} {result.name} — {result.message}")
    if result.hint and result.status in ("fail", "warn"):
        print(f"{prefix}  → fix: {result.hint}")


def print_report(
    slug: str,
    hard_gates: list[CheckResult],
    soft_checks: list[CheckResult],
) -> None:
    """Print the human-readable pre-publish report to stdout."""
    hard_failures = [r for r in hard_gates if r.status == "fail"]
    warnings = [r for r in soft_checks if r.status == "warn"]

    print(f"\n{DIVIDER}")
    print(f"  Pre-Publish Gate: {slug}")
    print(DIVIDER)

    print("\nHard gates:")
    for result in hard_gates:
        _print_result(result)

    print("\nSoft checks:")
    for result in soft_checks:
        _print_result(result)

    print(
        "\nManual verification required before uploading:\n"
        "  [ ] Contemporary Context Update — has the geopolitical situation changed since script lock?\n"
        "  [ ] Kalshi/Metaculus price check — record current prediction market price if relevant\n"
        "  [ ] Final narration pass — confirm take selection and timing in NLE\n"
        "  [ ] Description + tags drafted in YouTube Studio\n"
        "  [ ] Premiere scheduled (not published immediately)"
    )

    print(f"\n{DIVIDER}")

    fail_count = len(hard_failures)
    warn_count = len(warnings)

    if fail_count == 0:
        ready_icon = "✓"
        ready_label = "READY"
    else:
        ready_icon = "✗"
        ready_label = "NOT READY"

    parts = []
    if fail_count:
        parts.append(f"{fail_count} hard gate{'s' if fail_count != 1 else ''} failed")
    if warn_count:
        parts.append(f"{warn_count} warning{'s' if warn_count != 1 else ''}")
    summary_detail = f"  ({' · '.join(parts)})" if parts else ""

    print(f"Result: {ready_icon} {ready_label}{summary_detail}")

    if hard_failures:
        print("  Fix hard gates before uploading.")
    elif warnings:
        print("  Hard gates passed. Review warnings before uploading.")
    else:
        print("  All checks passed. Good to go.")

    print(DIVIDER)
    print()


def print_json_report(
    slug: str,
    hard_gates: list[CheckResult],
    soft_checks: list[CheckResult],
    exit_code: int,
) -> None:
    """Emit a machine-readable JSON object to stdout."""
    output = {
        "slug": slug,
        "exit_code": exit_code,
        "hard_gates": [asdict(r) for r in hard_gates],
        "soft_checks": [asdict(r) for r in soft_checks],
        "manual_checklist": [
            "Contemporary Context Update — has the geopolitical situation changed since script lock?",
            "Kalshi/Metaculus price check — record current prediction market price if relevant",
            "Final narration pass — confirm take selection and timing in NLE",
            "Description + tags drafted in YouTube Studio",
            "Premiere scheduled (not published immediately)",
        ],
        "summary": {
            "hard_failures": len([r for r in hard_gates if r.status == "fail"]),
            "warnings": len([r for r in soft_checks if r.status == "warn"]),
            "ready": exit_code == 0,
        },
    }
    print(json.dumps(output, indent=2))


# ── Entry point ───────────────────────────────────────────────────────────────

def main() -> int:
    parser = argparse.ArgumentParser(
        description="Pre-publish gate for a Parallax episode.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("slug", help="Episode slug (e.g. prisoners-dilemma)")
    parser.add_argument(
        "--strict",
        action="store_true",
        help="Treat soft-check warnings as failures (exit 1 on any warning)",
    )
    parser.add_argument(
        "--json",
        dest="json_output",
        action="store_true",
        help="Emit a JSON object instead of the human-readable report",
    )
    args = parser.parse_args()
    slug: str = args.slug

    # Validate that the episode directory exists.
    ep_dir = EPISODES_DIR / slug
    if not ep_dir.is_dir():
        print(
            f"Error: episode '{slug}' not found at episodes/{slug}/",
            file=sys.stderr,
        )
        return 2

    # ── Run hard gates ────────────────────────────────────────────────────────
    hard_gates: list[CheckResult] = [
        check_oracle_track(slug),
        check_episode_state(slug),
        check_pipeline_validator(slug),
    ]

    # ── Run soft checks ───────────────────────────────────────────────────────
    soft_checks: list[CheckResult] = [
        check_sourcing_doc(slug),
        check_cost_log(slug),
        check_thumbnails(slug),
        check_shorts_brief(slug),
        check_audio_cue_sheet(slug),
    ]

    # ── Compute exit code ─────────────────────────────────────────────────────
    hard_failures = [r for r in hard_gates if r.status == "fail"]
    warnings = [r for r in soft_checks if r.status == "warn"]

    if hard_failures:
        exit_code = 1
    elif args.strict and warnings:
        exit_code = 1
    else:
        exit_code = 0

    # ── Output ────────────────────────────────────────────────────────────────
    if args.json_output:
        print_json_report(slug, hard_gates, soft_checks, exit_code)
    else:
        print_report(slug, hard_gates, soft_checks)

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
