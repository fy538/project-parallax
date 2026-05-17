"""
CI ↔ check-episode.sh parity audit.

`scripts/check-episode.sh` is the local "pre-flight before render" validator.
`.github/workflows/ci.yml` is the automated gate. The two run different
SHAPES of the same checks: check-episode.sh invokes each tool standalone
against ONE episode; CI runs the broader test suites that exercise each
tool's real-data regression guard plus narrower direct invocations.

If they drift — a new check is added to check-episode.sh but no CI test
covers it — silent regressions can land that pass CI and fail the operator's
local check, or vice versa. This test makes drift explicit:

  1. We parse check-episode.sh for every tool reference (python3 X.py /
     node X.mjs / npm run Y / npx vitest ...).
  2. We assert each reference is recorded in COVERAGE_CONTRACT below with
     a documented coverage path. New checks added to check-episode.sh fail
     this test until the author updates the contract.

This is a "documentation forcing function" — it doesn't verify the coverage
path is actually exercised, only that an author considered the question.
The real-data regression guards inside individual `tools/test_*.py` files
do the actual exercising.
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
CHECK_EPISODE_SH = REPO_ROOT / "scripts" / "check-episode.sh"
CI_WORKFLOW = REPO_ROOT / ".github" / "workflows" / "ci.yml"

# Each entry: the tool/command pattern that appears in check-episode.sh →
# how it's covered in CI. Update this when adding a new check.
#
# `pattern` is a substring or simple regex unique enough to identify the
# command. `covered_by` is a brief human-readable note describing where the
# same code path is exercised under CI (a test file, a CI step, or both).
COVERAGE_CONTRACT: list[dict[str, str]] = [
    # ── Hard checks ──────────────────────────────────────────────────────
    {
        "name": "validate_data.py",
        "pattern": r"validate_data\.py",
        "covered_by": "ci.yml Linux test job: 'python3 tools/validate_data.py' (all data files)",
    },
    {
        "name": "manifest_lint.py",
        "pattern": r"manifest_lint\.py",
        "covered_by": "tools/lint/test_manifest_lint.py::TestRealEpisodesClean — runs lint_manifest against shipped episodes",
    },
    {
        "name": "audit-direction-fields.mjs",
        "pattern": r"audit-direction-fields\.mjs",
        "covered_by": "remotion-templates/src/__tests__/audit-direction-fields.test.ts — script exits 0 against current episode data (in test:unit → macos-smoke)",
    },
    {
        "name": "episode-integrity.test.ts",
        "pattern": r"episode-integrity\.test\.ts",
        "covered_by": "Runs inside test:unit → macos-smoke 'Vitest unit tests' step",
    },
    {
        "name": "concepts/lookup.py validate",
        "pattern": r"concepts/lookup\.py",
        "covered_by": "tools/concepts/test_lookup.py::test_validate_against_real_concepts_json (real registry)",
    },
    {
        "name": "tsc",
        "pattern": r"^tsc$",
        "covered_by": "ci.yml Linux test job ./scripts/test.sh + macos-smoke ./scripts/typecheck.sh",
    },
    {
        "name": "lint-conventions.mjs",
        "pattern": r"lint-conventions\.mjs",
        "covered_by": "ci.yml Linux test job ./scripts/lint.sh; also remotion-templates/src/__tests__/lint-conventions.test.ts in test:unit",
    },
    {
        "name": "preflight.py",
        "pattern": r"preflight\.py",
        "covered_by": "tools/test_preflight.py::TestRealEpisodes (real episodes resolve cleanly) + CLI smoke",
    },
    # ── Soft checks ──────────────────────────────────────────────────────
    {
        "name": "list_orphan_episode_json.py",
        "pattern": r"list_orphan_episode_json\.py",
        "covered_by": "tools/test_list_orphan_episode_json.py — pure-function tests; informational tool, orphans are expected in drafts",
    },
    {
        "name": "check_script_manifest.py",
        "pattern": r"check_script_manifest\.py",
        "covered_by": "tools/test_check_script_manifest.py::TestRealEpisodesRegression — both shipped episodes load with no hard errors",
    },
    {
        "name": "check_concept_coverage.py",
        "pattern": r"check_concept_coverage\.py",
        "covered_by": "tools/test_check_concept_coverage.py::TestRealEpisodes — smoke on both episodes",
    },
    {
        "name": "check_audio_cues.py",
        "pattern": r"check_audio_cues\.py",
        "covered_by": "tools/test_check_audio_cues.py::TestRealEpisodes — smoke on both episodes",
    },
    {
        "name": "pipeline_validator.py",
        "pattern": r"pipeline_validator\.py",
        "covered_by": "tools/test_pipeline_validator.py — covers load_pipeline_state, compute_episode_status, render_status_md, update_tracker_health, _check_manifest_staleness, _build_health_summary (19 tests). Wired into check-episode.sh as W6 (validation) + as the post-check tracker refresh (--write-status --update-tracker).",
    },
    {
        "name": "lint/polish_lint.py",
        "pattern": r"lint/polish_lint\.py",
        "covered_by": "tools/lint/test_polish_lint.py — 40+ unit tests covering all 9 check functions + ALL_CHECKS sanity assertions. Wired into check-episode.sh as W7.",
    },
    {
        "name": "asset-source/zerohit_fallback.py",
        "pattern": r"asset-source/zerohit_fallback\.py",
        "covered_by": "tools/asset-source/test_zerohit_fallback.py — 25 tests covering anchor/style-ref heuristics, zero-hit detection, brief rendering, end-to-end --count and --output. Wired into check-episode.sh as W8.",
    },
    {
        "name": "lint/check_docs.py",
        "pattern": r"lint/check_docs\.py",
        "covered_by": "tools/lint/test_check_docs.py — 17 tests covering template-name resolution, palette consistency (two-pass scan with smart-skip), npm-script resolution, persona consistency. Wired into check-episode.sh as W9.",
    },
]


# ─── Parser ──────────────────────────────────────────────────────────────────


# Patterns that identify "this line invokes a tool we should track."
# Capture the whole path token after the executable; the post-process step
# extracts the meaningful basename (and any subdirectory we care about).
_INVOCATION_PATTERNS = [
    re.compile(r"python3\s+(\S+\.py)\b"),
    re.compile(r"\bnode\s+(\S+\.mjs)\b"),
    re.compile(r"npx\s+vitest\s+run\s+(\S+\.test\.ts)\b"),
    # Track bare-tool invocations like `npx tsc --noEmit` too. Capture the
    # tool name only; flags are noise. Pinned to a small allowlist so we
    # don't accidentally start tracking every npx command.
    re.compile(r"npx\s+(tsc)\b"),
]


def _normalise(path_token: str) -> str:
    """Strip shell `$VAR/` prefixes and leading repo subdirectories.

    `python3 "$TOOLS/lint/manifest_lint.py"` → `lint/manifest_lint.py`
    `node "$REMOTION/scripts/audit-direction-fields.mjs"` → `scripts/audit-direction-fields.mjs`
    Keep one parent component when present so `concepts/lookup.py` doesn't
    collapse to just `lookup.py` (different tools share `lookup.py` names).
    """
    # Drop surrounding quotes
    token = path_token.strip('"\'')
    # Drop shell variable prefixes: $VAR/  ${VAR}/
    token = re.sub(r"^\$\{?[A-Za-z_][A-Za-z0-9_]*\}?/", "", token)
    return token


def extract_invocations(text: str) -> set[str]:
    """Pull tool-script tokens out of every executable line of check-episode.sh.

    Returns normalised paths (without $VAR shell prefixes) so the contract
    patterns can match `concepts/lookup.py` instead of `$TOOLS/concepts/lookup.py`.
    """
    found: set[str] = set()
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        for rx in _INVOCATION_PATTERNS:
            for m in rx.finditer(line):
                found.add(_normalise(m.group(1)))
    return found


# ─── Tests ───────────────────────────────────────────────────────────────────


@pytest.fixture(scope="module")
def check_episode_invocations() -> set[str]:
    assert CHECK_EPISODE_SH.is_file(), f"missing {CHECK_EPISODE_SH}"
    return extract_invocations(CHECK_EPISODE_SH.read_text())


def test_check_episode_sh_exists():
    assert CHECK_EPISODE_SH.is_file()


def test_ci_workflow_exists():
    assert CI_WORKFLOW.is_file()


def test_every_invocation_is_covered(check_episode_invocations):
    """Every tool invoked by check-episode.sh must have a COVERAGE_CONTRACT entry.

    If this fails, you added a new check to check-episode.sh without
    deciding how CI exercises the same code path. Two valid fixes:
      1. Add a regression test under tools/ that runs the tool against
         real episode data, then register the contract here, OR
      2. Add a direct invocation in ci.yml and register it here.

    NEVER add an entry without ALSO adding the test/CI step it claims.
    """
    contract_patterns = [re.compile(c["pattern"]) for c in COVERAGE_CONTRACT]

    uncovered = []
    for token in sorted(check_episode_invocations):
        if not any(p.search(token) for p in contract_patterns):
            uncovered.append(token)

    assert uncovered == [], (
        f"{len(uncovered)} tool invocation(s) in check-episode.sh have no "
        f"entry in COVERAGE_CONTRACT (tools/test_ci_parity.py):\n  "
        + "\n  ".join(uncovered) +
        "\n\nAdd a covered_by entry — and the actual test/CI step it points at."
    )


def test_no_stale_contract_entries(check_episode_invocations):
    """Every COVERAGE_CONTRACT entry must match at least one real invocation.

    Stale entries (the check was removed from check-episode.sh but the
    contract entry was left behind) would otherwise hide the next gap by
    bloating the allowlist.
    """
    stale = []
    for entry in COVERAGE_CONTRACT:
        rx = re.compile(entry["pattern"])
        if not any(rx.search(tok) for tok in check_episode_invocations):
            stale.append(entry["name"])

    assert stale == [], (
        f"{len(stale)} COVERAGE_CONTRACT entries no longer match any "
        f"invocation in check-episode.sh:\n  "
        + "\n  ".join(stale) +
        "\n\nRemove these entries — the corresponding check was likely deleted."
    )


def test_invocations_extractor_finds_known_tools(check_episode_invocations):
    """Sanity guard against the parser silently failing.

    If the executor regex stops matching, the coverage test would pass
    vacuously. Assert a non-trivial floor — check-episode.sh has had 7+
    tool invocations for months, dropping below that means the parser
    broke (or the script was gutted, also worth surfacing).
    """
    assert len(check_episode_invocations) >= 7, (
        f"extracted only {len(check_episode_invocations)} invocations: "
        f"{sorted(check_episode_invocations)}"
    )
