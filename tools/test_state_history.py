"""Tests for tools/state_history.py."""

from __future__ import annotations

import datetime
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import state_history as sh


def test_append_and_load_round_trip(tmp_path, monkeypatch):
    monkeypatch.setattr(sh, "EPISODES_DIR", tmp_path)
    monkeypatch.setattr(sh, "PIPELINE_STATE_JSON", tmp_path / "pipeline-state.json")
    sh.append_transition(
        "demo", "INCUBATING",
        from_state=None,
        date=datetime.date(2026, 3, 18),
        reason="bootstrap",
    )
    sh.append_transition(
        "demo", "VIABLE",
        date=datetime.date(2026, 5, 1),
        reason="viability passed",
    )
    history = sh.load_history("demo")
    assert len(history) == 2
    assert history[0].to_state == "INCUBATING"
    assert history[0].from_state is None
    assert history[1].from_state == "INCUBATING"  # inferred from previous entry
    assert history[1].to_state == "VIABLE"
    assert history[1].reason == "viability passed"


def test_load_history_missing_file_returns_empty(tmp_path, monkeypatch):
    monkeypatch.setattr(sh, "EPISODES_DIR", tmp_path)
    assert sh.load_history("never-existed") == []


def test_load_history_skips_malformed_rows(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(sh, "EPISODES_DIR", tmp_path)
    p = tmp_path / "demo" / "_state-history.jsonl"
    p.parent.mkdir()
    p.write_text(
        '{"date":"2026-03-18","from":null,"to":"INCUBATING"}\n'
        'not-json garbage\n'
        '{"date":"2026-05-01","from":"INCUBATING","to":"VIABLE"}\n',
        encoding="utf-8",
    )
    history = sh.load_history("demo")
    assert len(history) == 2  # bad row skipped
    err = capsys.readouterr().err
    assert "malformed row" in err


def test_bootstrap_writes_one_entry_per_episode(tmp_path, monkeypatch):
    monkeypatch.setattr(sh, "EPISODES_DIR", tmp_path)
    monkeypatch.setattr(sh, "PIPELINE_STATE_JSON", tmp_path / "pipeline-state.json")
    (tmp_path / "pipeline-state.json").write_text(json.dumps({
        "episodes": [
            {"slug": "ep1", "state": "INCUBATING", "stateEnteredAt": "2026-03-18"},
            {"slug": "ep2", "state": "RENDER READY", "stateEnteredAt": "2026-05-09"},
        ],
    }), encoding="utf-8")

    results = sh.bootstrap_from_pipeline_state()
    assert results == [("ep1", True), ("ep2", True)]
    h1 = sh.load_history("ep1")
    assert len(h1) == 1
    assert h1[0].to_state == "INCUBATING"
    assert h1[0].date == datetime.date(2026, 3, 18)
    assert h1[0].from_state is None


def test_bootstrap_is_idempotent(tmp_path, monkeypatch):
    """Re-running bootstrap on already-populated history is a no-op —
    history is append-only; bootstrap must never overwrite."""
    monkeypatch.setattr(sh, "EPISODES_DIR", tmp_path)
    monkeypatch.setattr(sh, "PIPELINE_STATE_JSON", tmp_path / "pipeline-state.json")
    (tmp_path / "pipeline-state.json").write_text(json.dumps({
        "episodes": [{"slug": "ep1", "state": "VIABLE", "stateEnteredAt": "2026-05-01"}],
    }), encoding="utf-8")

    first = sh.bootstrap_from_pipeline_state()
    second = sh.bootstrap_from_pipeline_state()
    assert first == [("ep1", True)]
    assert second == [("ep1", False)]  # skipped — already has history
    assert len(sh.load_history("ep1")) == 1  # not duplicated


def test_jsonl_serialization_stable():
    """The JSONL output must round-trip cleanly + key order is stable
    so line-diffs stay clean."""
    t = sh.StateTransition(
        date=datetime.date(2026, 5, 18),
        from_state="DRAFTING",
        to_state="RENDER READY",
        reason="script + visual-spec ready",
    )
    line = t.to_jsonl()
    assert json.loads(line) == {
        "date": "2026-05-18",
        "from": "DRAFTING",
        "to": "RENDER READY",
        "reason": "script + visual-spec ready",
    }
    parsed = sh.StateTransition.from_jsonl(line)
    assert parsed == t
