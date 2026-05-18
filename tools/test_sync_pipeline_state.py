"""
Unit tests for tools/sync_pipeline_state.py — the pre-commit helper that
auto-bumps `stateEnteredAt` whenever an episode's `state` changes in a
commit. The hook protects against the silent-drift bug where the operator
edits `state` in pipeline-state.json but forgets to update the matching
entry-date, so days-in-state quietly lies.

The tests exercise the diff logic (HEAD vs working tree → which slugs
moved?) and the in-place rewrite, plus the --check dry-run mode used by
CI-style guards.
"""

from __future__ import annotations

import datetime
import json
import subprocess
import sys
from pathlib import Path


import sync_pipeline_state as sps  # type: ignore[import-not-found]

REPO_ROOT = Path(__file__).resolve().parent.parent


# ─── Pure-function tests (no git, no fs) ─────────────────────────────────────


def _state_doc(entries: list[tuple[str, str]]) -> str:
    """Render a minimal pipeline-state.json with given (slug, state) pairs."""
    return json.dumps(
        {
            "version": "1.0",
            "episodes": [
                {
                    "slug": s,
                    "state": st,
                    "stateEnteredAt": "2026-01-01",
                }
                for s, st in entries
            ],
        }
    )


def test_find_state_changes_detects_single_transition():
    head = _state_doc([("alpha", "DRAFTING")])
    work = _state_doc([("alpha", "RENDER READY")])
    assert sps.find_state_changes(head, work) == ["alpha"]


def test_find_state_changes_no_op_when_states_match():
    head = _state_doc([("alpha", "DRAFTING"), ("beta", "INCUBATING")])
    work = _state_doc([("alpha", "DRAFTING"), ("beta", "INCUBATING")])
    assert sps.find_state_changes(head, work) == []


def test_find_state_changes_ignores_new_episodes():
    """A new episode (no HEAD entry) keeps the date the author wrote."""
    head = _state_doc([("alpha", "DRAFTING")])
    work = _state_doc([("alpha", "DRAFTING"), ("beta", "INCUBATING")])
    assert sps.find_state_changes(head, work) == []


def test_find_state_changes_new_file_no_resets():
    """If pipeline-state.json is being added (no HEAD version) → no resets."""
    work = _state_doc([("alpha", "INCUBATING"), ("beta", "VIABLE")])
    assert sps.find_state_changes(None, work) == []


def test_find_state_changes_handles_multiple_transitions():
    head = _state_doc([("a", "DRAFTING"), ("b", "INCUBATING"), ("c", "VIABLE")])
    work = _state_doc([("a", "RENDER READY"), ("b", "VIABLE"), ("c", "VIABLE")])
    assert sorted(sps.find_state_changes(head, work)) == ["a", "b"]


def test_state_map_skips_malformed_entries():
    """Missing `slug` or `state` keys shouldn't crash; just drop the entry."""
    doc = json.dumps(
        {
            "episodes": [
                {"slug": "ok", "state": "DRAFTING"},
                {"slug": "missing-state"},
                {"state": "no-slug"},
                {},
            ]
        }
    )
    assert sps._state_map(doc) == {"ok": "DRAFTING"}


def test_state_map_returns_empty_on_parse_error():
    assert sps._state_map("{not valid json") == {}


# ─── File-write tests ────────────────────────────────────────────────────────


def test_update_state_entered_at_rewrites_only_listed_slugs(tmp_path, monkeypatch):
    target = tmp_path / "pipeline-state.json"
    target.write_text(
        json.dumps(
            {
                "version": "1.0",
                "episodes": [
                    {"slug": "alpha", "state": "DRAFTING", "stateEnteredAt": "2026-01-01"},
                    {"slug": "beta", "state": "VIABLE", "stateEnteredAt": "2025-12-15"},
                ],
            },
            indent=2,
        )
        + "\n"
    )
    monkeypatch.setattr(sps, "PIPELINE_STATE_JSON", target)

    sps.update_state_entered_at(["alpha"], today=datetime.date(2026, 5, 17))

    data = json.loads(target.read_text())
    assert data["episodes"][0]["stateEnteredAt"] == "2026-05-17"  # bumped
    assert data["episodes"][1]["stateEnteredAt"] == "2025-12-15"  # untouched


def test_update_state_entered_at_no_op_for_empty_list(tmp_path, monkeypatch):
    target = tmp_path / "pipeline-state.json"
    original = json.dumps({"episodes": [{"slug": "a", "state": "X", "stateEnteredAt": "2026-01-01"}]}, indent=2) + "\n"
    target.write_text(original)
    monkeypatch.setattr(sps, "PIPELINE_STATE_JSON", target)

    sps.update_state_entered_at([], today=datetime.date(2026, 5, 17))

    assert target.read_text() == original  # file untouched


def test_update_state_entered_at_preserves_trailing_newline(tmp_path, monkeypatch):
    """Other JSON tools assume a trailing newline; we must preserve it."""
    target = tmp_path / "pipeline-state.json"
    target.write_text(
        json.dumps({"episodes": [{"slug": "a", "state": "X", "stateEnteredAt": "2026-01-01"}]}, indent=2) + "\n"
    )
    monkeypatch.setattr(sps, "PIPELINE_STATE_JSON", target)

    sps.update_state_entered_at(["a"], today=datetime.date(2026, 5, 17))

    assert target.read_text().endswith("\n")


# ─── End-to-end (subprocess + ephemeral git repo) ────────────────────────────


def _init_repo_with_state(tmp_path: Path, state_json: str) -> Path:
    """Create a git repo at tmp_path, commit episodes/pipeline-state.json."""
    subprocess.run(["git", "init", "-q"], cwd=tmp_path, check=True)
    subprocess.run(["git", "config", "user.email", "t@t.t"], cwd=tmp_path, check=True)
    subprocess.run(["git", "config", "user.name", "t"], cwd=tmp_path, check=True)
    ep = tmp_path / "episodes"
    ep.mkdir()
    (ep / "pipeline-state.json").write_text(state_json)
    # Mirror the tool's directory layout so ROOT/tools is real
    (tmp_path / "tools").mkdir()
    subprocess.run(["git", "add", "-A"], cwd=tmp_path, check=True)
    subprocess.run(["git", "commit", "-q", "-m", "init"], cwd=tmp_path, check=True)
    return ep / "pipeline-state.json"


def _run_helper(repo: Path, *args: str) -> subprocess.CompletedProcess:
    """Run sync_pipeline_state.py with a patched ROOT pointing at `repo`."""
    helper = REPO_ROOT / "tools" / "sync_pipeline_state.py"
    # Inject ROOT/PIPELINE_STATE_JSON via a tiny shim using -c so we can keep
    # the script unmodified.
    code = (
        "import sys, pathlib, runpy\n"
        f"import importlib.util\n"
        f"spec = importlib.util.spec_from_file_location('sps', r'{helper}')\n"
        "m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)\n"
        f"m.ROOT = pathlib.Path(r'{repo}')\n"
        f"m.PIPELINE_STATE_JSON = pathlib.Path(r'{repo}') / 'episodes' / 'pipeline-state.json'\n"
        "sys.argv = ['sync_pipeline_state.py'] + " + repr(list(args)) + "\n"
        "sys.exit(m.main())\n"
    )
    return subprocess.run(
        [sys.executable, "-c", code],
        cwd=repo,
        capture_output=True,
        text=True,
    )


def test_end_to_end_bumps_date_on_state_change(tmp_path):
    initial = json.dumps(
        {
            "version": "1.0",
            "episodes": [
                {"slug": "alpha", "state": "DRAFTING", "stateEnteredAt": "2026-01-01"},
            ],
        },
        indent=2,
    ) + "\n"
    path = _init_repo_with_state(tmp_path, initial)

    # Author edits the state but forgets to bump the date
    edited = json.loads(initial)
    edited["episodes"][0]["state"] = "RENDER READY"
    path.write_text(json.dumps(edited, indent=2) + "\n")
    subprocess.run(["git", "add", "episodes/pipeline-state.json"], cwd=tmp_path, check=True)

    result = _run_helper(tmp_path)
    assert result.returncode == 0, result.stderr
    assert "alpha" in result.stdout

    new_data = json.loads(path.read_text())
    assert new_data["episodes"][0]["stateEnteredAt"] == datetime.date.today().isoformat()


def test_end_to_end_no_state_change_silent_success(tmp_path):
    initial = json.dumps(
        {"episodes": [{"slug": "alpha", "state": "DRAFTING", "stateEnteredAt": "2026-01-01"}]},
        indent=2,
    ) + "\n"
    path = _init_repo_with_state(tmp_path, initial)

    # Edit notes but not state
    doc = json.loads(initial)
    doc["episodes"][0]["stateEnteredAt"] = "2026-02-02"  # author tweaks date manually
    path.write_text(json.dumps(doc, indent=2) + "\n")
    subprocess.run(["git", "add", "episodes/pipeline-state.json"], cwd=tmp_path, check=True)

    result = _run_helper(tmp_path)
    assert result.returncode == 0
    assert result.stdout == ""  # no slugs printed → no re-stage needed
    # Author's date preserved untouched
    assert json.loads(path.read_text())["episodes"][0]["stateEnteredAt"] == "2026-02-02"


def test_end_to_end_check_mode_reports_without_writing(tmp_path):
    initial = json.dumps(
        {"episodes": [{"slug": "alpha", "state": "DRAFTING", "stateEnteredAt": "2026-01-01"}]},
        indent=2,
    ) + "\n"
    path = _init_repo_with_state(tmp_path, initial)

    doc = json.loads(initial)
    doc["episodes"][0]["state"] = "RENDER READY"
    path.write_text(json.dumps(doc, indent=2) + "\n")
    subprocess.run(["git", "add", "episodes/pipeline-state.json"], cwd=tmp_path, check=True)

    result = _run_helper(tmp_path, "--check")
    assert result.returncode == 1  # pending changes
    assert "alpha" in result.stderr
    # Date NOT mutated by --check
    assert json.loads(path.read_text())["episodes"][0]["stateEnteredAt"] == "2026-01-01"


def test_end_to_end_missing_file_returns_2(tmp_path):
    subprocess.run(["git", "init", "-q"], cwd=tmp_path, check=True)
    subprocess.run(["git", "config", "user.email", "t@t.t"], cwd=tmp_path, check=True)
    subprocess.run(["git", "config", "user.name", "t"], cwd=tmp_path, check=True)
    (tmp_path / "episodes").mkdir()
    # NB: no pipeline-state.json
    result = _run_helper(tmp_path)
    assert result.returncode == 2
    assert "not found" in result.stderr
