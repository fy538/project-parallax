"""
Tests for tools/concepts/lookup.py — concept registry CLI.

Focus on pure functions: search scoring, registry parsing, validation.

Run: pytest tools/concepts/test_lookup.py -v
"""

import json
import sys
from argparse import Namespace
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import lookup


def _registry(concepts):
    """Build a minimal registry dict for tests."""
    return {"version": "1.0", "concepts": concepts}


def _concept(
    cid: str,
    en: str,
    cn: str = "",
    type_: str = "framework",
    definition: str = "",
    insight: str = "",
    tags: list[str] | None = None,
    pillar: list[str] | None = None,
    ep: str = "EP01",
    beat: int = 1,
    template: str | None = "KineticTypography",
    treatment: str = "cold-intro",
    accent: str = "#E5A544",
    appearances: list[dict] | None = None,
):
    """Build a minimal concept entry for tests."""
    c = {
        "id": cid,
        "term": {"en": en},
        "type": type_,
        "definition": definition,
        "insight": insight,
        "tags": tags or [],
        "pillar": pillar or [],
        "introduced": {
            "episode": ep,
            "beat": beat,
            "template": template,
            "treatment": treatment,
            "accentColor": accent,
        },
    }
    if cn:
        c["term"]["cn"] = cn
    if appearances:
        c["appearances"] = appearances
    return c


# ── load_registry — file existence + parse error handling ─────────────────


def test_load_registry_missing_file_exits(tmp_path, capsys):
    import pytest
    with pytest.raises(SystemExit) as exc:
        lookup.load_registry(tmp_path / "nonexistent.json")
    assert exc.value.code == 1
    assert "not found" in capsys.readouterr().err.lower()


def test_load_registry_malformed_json_exits(tmp_path, capsys):
    p = tmp_path / "bad.json"
    p.write_text("{not json", encoding="utf-8")
    import pytest
    with pytest.raises(SystemExit) as exc:
        lookup.load_registry(p)
    assert exc.value.code == 1
    assert "valid json" in capsys.readouterr().err.lower()


def test_load_registry_valid_json_returns_dict(tmp_path):
    p = tmp_path / "good.json"
    p.write_text('{"version": "1.0", "concepts": []}', encoding="utf-8")
    data = lookup.load_registry(p)
    assert data["version"] == "1.0"
    assert data["concepts"] == []


# ── cmd_search — scoring logic ────────────────────────────────────────────


def _capture_search(query: str, registry: dict, capsys, json_out: bool = False):
    args = Namespace(query=query, json=json_out)
    lookup.cmd_search(args, registry)
    return capsys.readouterr().out


def test_search_exact_term_match_outranks_partial(capsys):
    reg = _registry([
        _concept("a", "Stranglehold"),
        _concept("b", "Stranglehold technology"),
    ])
    out = _capture_search("Stranglehold", reg, capsys, json_out=True)
    results = json.loads(out)
    # Concept 'a' (exact match) should score higher than 'b' (partial)
    assert results[0]["id"] == "a"


def test_search_id_match(capsys):
    reg = _registry([_concept("ka-bozi", "Stranglehold")])
    out = _capture_search("ka-bozi", reg, capsys, json_out=True)
    results = json.loads(out)
    assert len(results) == 1
    assert results[0]["id"] == "ka-bozi"


def test_search_tag_match(capsys):
    reg = _registry([_concept("a", "X", tags=["technology"])])
    out = _capture_search("technology", reg, capsys, json_out=True)
    results = json.loads(out)
    assert len(results) == 1


def test_search_definition_match(capsys):
    reg = _registry([_concept("a", "X", definition="something about chips")])
    out = _capture_search("chips", reg, capsys, json_out=True)
    results = json.loads(out)
    assert len(results) == 1


def test_search_no_match_returns_empty(capsys):
    reg = _registry([_concept("a", "X")])
    out = _capture_search("nonexistent-term-xyz", reg, capsys, json_out=True)
    results = json.loads(out)
    assert results == []


def test_search_chinese_term_match(capsys):
    reg = _registry([_concept("a", "Stranglehold", cn="卡脖子")])
    out = _capture_search("卡脖子", reg, capsys, json_out=True)
    results = json.loads(out)
    assert len(results) == 1
    assert results[0]["id"] == "a"


def test_search_case_insensitive(capsys):
    reg = _registry([_concept("a", "Stranglehold")])
    out = _capture_search("STRANGLEHOLD", reg, capsys, json_out=True)
    results = json.loads(out)
    assert len(results) == 1


def test_search_results_sorted_by_score(capsys):
    """Most-relevant first."""
    reg = _registry([
        _concept("a", "X", definition="mention of chips somewhere"),  # def hit (3)
        _concept("b", "Chips"),  # exact term (10)
        _concept("c", "X", tags=["chips"]),  # tag hit (4)
    ])
    out = _capture_search("chips", reg, capsys, json_out=True)
    results = json.loads(out)
    assert [r["id"] for r in results] == ["b", "c", "a"]


# ── cmd_episode — filter by episode ───────────────────────────────────────


def test_episode_lists_introduced_concepts(capsys):
    reg = _registry([
        _concept("a", "X", ep="EP01"),
        _concept("b", "Y", ep="EP02"),
    ])
    args = Namespace(episode="EP01", json=True)
    lookup.cmd_episode(args, reg)
    out = json.loads(capsys.readouterr().out)
    assert len(out["introduced"]) == 1
    assert out["introduced"][0]["id"] == "a"


def test_episode_lists_callbacks(capsys):
    reg = _registry([
        _concept("a", "X", ep="EP01", appearances=[
            {"episode": "EP02", "role": "callback"}
        ]),
    ])
    args = Namespace(episode="EP02", json=True)
    lookup.cmd_episode(args, reg)
    out = json.loads(capsys.readouterr().out)
    assert len(out["introduced"]) == 0
    assert len(out["referenced"]) == 1


def test_episode_uppercases_input(capsys):
    """Episode IDs are case-insensitive at input but stored uppercase."""
    reg = _registry([_concept("a", "X", ep="EP01")])
    args = Namespace(episode="ep01", json=True)
    lookup.cmd_episode(args, reg)
    out = json.loads(capsys.readouterr().out)
    assert len(out["introduced"]) == 1
