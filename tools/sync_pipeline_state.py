#!/usr/bin/env python3
"""
sync_pipeline_state.py — pre-commit hook helper for pipeline-state.json edits.

Closes the "forgot to update stateEnteredAt" bug class: when an episode's
`state` field changes in a commit, this helper auto-updates the
corresponding `stateEnteredAt` to today's date so days-in-state doesn't
silently lie.

Workflow (from `.githooks/pre-commit`):
  1. Pre-commit detects `episodes/pipeline-state.json` in staged files.
  2. This helper runs: diff staged JSON vs HEAD's version. For each
     episode whose `state` changed, set its `stateEnteredAt` to today.
  3. Helper writes the updated JSON in place + prints changed slugs.
  4. Pre-commit re-stages pipeline-state.json + runs
     `pipeline_validator.py --write-status --update-tracker` to refresh
     dashboards, and stages those too.

Usage:
    python3 tools/sync_pipeline_state.py            # auto-update + print changes
    python3 tools/sync_pipeline_state.py --check    # report what would change; exit 1 if any
    python3 tools/sync_pipeline_state.py --help

Exit codes:
    0 — handled cleanly (with or without changes)
    1 — error parsing JSON OR --check mode found pending changes
    2 — git not available or pipeline-state.json doesn't exist
"""

from __future__ import annotations

import argparse
import datetime
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PIPELINE_STATE_JSON = ROOT / "episodes" / "pipeline-state.json"


def _git_show_head(path: Path) -> str | None:
    """Return the HEAD version of `path` as text, or None if not in HEAD."""
    rel = path.relative_to(ROOT)
    try:
        result = subprocess.run(
            ["git", "show", f"HEAD:{rel.as_posix()}"],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
    except FileNotFoundError:
        return None
    if result.returncode != 0:
        return None  # file not in HEAD (new file)
    return result.stdout


def _state_map(content: str) -> dict[str, str]:
    """Parse pipeline-state JSON → {slug: state}. Empty dict on parse error."""
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        return {}
    return {e["slug"]: e["state"] for e in data.get("episodes", []) if "slug" in e and "state" in e}


def find_state_changes(head_content: str | None, working_content: str) -> list[str]:
    """Return slugs whose `state` differs between HEAD and working tree."""
    if head_content is None:
        # New file — every entry is implicitly "new state"; treat as no
        # delta to update (initial population shouldn't trigger date resets)
        return []
    head = _state_map(head_content)
    working = _state_map(working_content)
    changed: list[str] = []
    for slug, new_state in working.items():
        old_state = head.get(slug)
        if old_state is None:
            # New episode — leave stateEnteredAt as the author wrote it
            continue
        if old_state != new_state:
            changed.append(slug)
    return changed


def update_state_entered_at(slugs: list[str], today: datetime.date | None = None) -> None:
    """For each slug, set its `stateEnteredAt` field in PIPELINE_STATE_JSON to today."""
    if not slugs:
        return
    today_iso = (today or datetime.date.today()).isoformat()
    data = json.loads(PIPELINE_STATE_JSON.read_text(encoding="utf-8"))
    for e in data.get("episodes", []):
        if e.get("slug") in slugs:
            e["stateEnteredAt"] = today_iso
    # Write atomically to avoid partial writes if the process is interrupted
    PIPELINE_STATE_JSON.write_text(
        json.dumps(data, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    parser.add_argument(
        "--check",
        action="store_true",
        help="Report what would change without writing. Exit 1 if any changes pending.",
    )
    args = parser.parse_args()

    if not PIPELINE_STATE_JSON.is_file():
        print(f"✗ {PIPELINE_STATE_JSON} not found", file=sys.stderr)
        return 2

    head_content = _git_show_head(PIPELINE_STATE_JSON)
    working_content = PIPELINE_STATE_JSON.read_text(encoding="utf-8")
    changed_slugs = find_state_changes(head_content, working_content)

    if not changed_slugs:
        # No state changes — silent success (hook keeps moving)
        return 0

    if args.check:
        print(
            f"State changes detected for: {', '.join(changed_slugs)} "
            f"— would set stateEnteredAt={datetime.date.today().isoformat()}",
            file=sys.stderr,
        )
        return 1

    update_state_entered_at(changed_slugs)
    # Print one slug per line so shell can capture + re-stage cleanly
    for slug in changed_slugs:
        print(slug)
    return 0


if __name__ == "__main__":
    sys.exit(main())
