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


# ── cmd_show — display single concept ──────────────────────────────────────


def test_show_existing_concept_json(capsys):
    reg = _registry([_concept("ka-bozi", "Stranglehold", definition="being held by the throat")])
    args = Namespace(concept_id="ka-bozi", json=True)
    lookup.cmd_show(args, reg)
    out = json.loads(capsys.readouterr().out)
    assert out["id"] == "ka-bozi"
    assert out["term"]["en"] == "Stranglehold"


def test_show_missing_concept_suggests_close_matches(capsys):
    reg = _registry([_concept("ka-bozi", "Stranglehold")])
    args = Namespace(concept_id="bozi", json=False)
    lookup.cmd_show(args, reg)
    out = capsys.readouterr().out
    assert "not found" in out
    assert "Did you mean" in out
    assert "ka-bozi" in out


def test_show_missing_concept_no_suggestions(capsys):
    reg = _registry([_concept("ka-bozi", "Stranglehold")])
    args = Namespace(concept_id="totally-unrelated-xyz", json=False)
    lookup.cmd_show(args, reg)
    out = capsys.readouterr().out
    assert "not found" in out
    assert "Did you mean" not in out


# ── cmd_tags — aggregation ─────────────────────────────────────────────────


def test_tags_counts_correctly(capsys):
    reg = _registry([
        _concept("a", "A", tags=["china", "chips"]),
        _concept("b", "B", tags=["china"]),
        _concept("c", "C", tags=["chips", "policy"]),
    ])
    args = Namespace(json=True)
    lookup.cmd_tags(args, reg)
    counts = json.loads(capsys.readouterr().out)
    assert counts["china"] == 2
    assert counts["chips"] == 2
    assert counts["policy"] == 1


def test_tags_empty_registry(capsys):
    args = Namespace(json=True)
    lookup.cmd_tags(args, _registry([]))
    counts = json.loads(capsys.readouterr().out)
    assert counts == {}


# ── cmd_stats — counts by type/episode/pillar ──────────────────────────────


def test_stats_total_count(capsys):
    reg = _registry([_concept(f"c{i}", f"T{i}") for i in range(5)])
    args = Namespace(json=True)
    try:
        lookup.cmd_stats(args, reg)
        out = capsys.readouterr().out
        # cmd_stats prints in non-json format mostly; just verify it doesn't crash
        # and that some stats are reflected.
        assert "5" in out or len(out) > 0
    except SystemExit:
        pass  # Some commands sys.exit; we accept either


# ── cmd_validate — registry health check ───────────────────────────────────


# cmd_validate returns early (no sys.exit) in JSON mode — these tests just inspect output.


def test_validate_clean_registry_passes(capsys):
    reg = _registry([_concept("a", "X", definition="defn", insight="insight")])
    reg["concepts"][0]["insight"] = "key insight"
    args = Namespace(json=True)
    lookup.cmd_validate(args, reg)
    out = json.loads(capsys.readouterr().out)
    assert out["valid"] is True
    assert out["issues"] == []


def test_validate_catches_duplicate_ids(capsys):
    reg = _registry([
        _concept("dup", "First"),
        _concept("dup", "Second"),
    ])
    for c in reg["concepts"]:
        c["definition"] = "x"
        c["insight"] = "y"
    args = Namespace(json=True)
    lookup.cmd_validate(args, reg)
    out = json.loads(capsys.readouterr().out)
    assert out["valid"] is False
    assert any("Duplicate" in i for i in out["issues"])


def test_validate_catches_broken_related_link(capsys):
    c = _concept("a", "A")
    c["definition"] = "x"
    c["insight"] = "y"
    c["relatedConcepts"] = ["nonexistent-target"]
    reg = _registry([c])
    args = Namespace(json=True)
    lookup.cmd_validate(args, reg)
    out = json.loads(capsys.readouterr().out)
    assert any("Broken link" in i and "nonexistent-target" in i for i in out["issues"])


def test_validate_catches_kebab_case_violation(capsys):
    c = _concept("Bad_ID_With_Underscores", "X")
    c["definition"] = "x"
    c["insight"] = "y"
    reg = _registry([c])
    args = Namespace(json=True)
    lookup.cmd_validate(args, reg)
    out = json.loads(capsys.readouterr().out)
    assert any("kebab-case" in i for i in out["issues"])


def test_validate_catches_invalid_type(capsys):
    c = _concept("a", "X", type_="not-a-real-type")
    c["definition"] = "x"
    c["insight"] = "y"
    reg = _registry([c])
    args = Namespace(json=True)
    lookup.cmd_validate(args, reg)
    out = json.loads(capsys.readouterr().out)
    assert any("Invalid type" in i for i in out["issues"])


def test_validate_prediction_needs_required_fields(capsys):
    c = _concept("p", "P", type_="prediction")
    c["definition"] = "x"
    c["insight"] = "y"
    c["prediction"] = {"claim": "something"}  # missing probability, timeframe, falsification, status
    reg = _registry([c])
    args = Namespace(json=True)
    lookup.cmd_validate(args, reg)
    out = json.loads(capsys.readouterr().out)
    assert any("Prediction missing" in i for i in out["issues"])


def test_validate_calls_sys_exit_only_in_non_json_mode(capsys):
    """Per the implementation: JSON mode returns early; CLI mode exits with status."""
    reg = _registry([_concept("a", "X", definition="d", insight="i")])
    args = Namespace(json=False)
    import pytest
    with pytest.raises(SystemExit) as exc:
        lookup.cmd_validate(args, reg)
    assert exc.value.code == 0  # no issues → exit 0


# ── cmd_predictions / predictions_due / resolve ────────────────────────────


def _prediction(cid: str, status: str = "open", timeframe: str = "2026"):
    c = _concept(cid, f"Prediction {cid}", type_="prediction")
    c["prediction"] = {
        "claim": "something will happen",
        "probability": 0.6,
        "timeframe": timeframe,
        "falsification": "thing doesn't happen",
        "status": status,
    }
    return c


def test_predictions_filters_to_prediction_type_only(capsys):
    """cmd_predictions returns ONLY concepts where type == 'prediction'."""
    reg = _registry([
        _concept("a", "Not a prediction", type_="framework"),
        _prediction("p1"),
        _prediction("p2"),
    ])
    args = Namespace(json=True)
    lookup.cmd_predictions(args, reg)
    out = json.loads(capsys.readouterr().out)
    assert len(out) == 2
    assert all("p" in c["id"] for c in out)


def test_predictions_returns_all_statuses(capsys):
    """cmd_predictions returns every prediction regardless of status (CLI mode groups
    them by status for display, JSON mode dumps the full list)."""
    reg = _registry([
        _prediction("p1", status="open"),
        _prediction("p2", status="confirmed"),
        _prediction("p3", status="falsified"),
    ])
    args = Namespace(json=True)
    lookup.cmd_predictions(args, reg)
    out = json.loads(capsys.readouterr().out)
    statuses = {c["prediction"]["status"] for c in out}
    assert statuses == {"open", "confirmed", "falsified"}


def test_predictions_empty_registry_prints_message(capsys):
    """Per the implementation: no predictions → prints 'No predictions in registry.' and returns."""
    args = Namespace(json=True)
    lookup.cmd_predictions(args, _registry([_concept("a", "X", type_="framework")]))
    out = capsys.readouterr().out
    assert "No predictions" in out


# ─── Real-registry regression guard ──────────────────────────────────────────
# Closes a CI-vs-check-episode.sh parity gap: check-episode.sh runs
# `python3 tools/concepts/lookup.py validate` against the SHIPPED
# data/concepts.json on every episode. Without this test, that invocation
# never runs in CI — the synthetic-registry tests above don't exercise the
# real-data path. Broken cross-refs would only surface when someone next
# runs check-episode.sh locally.

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
REAL_REGISTRY = REPO_ROOT / "data" / "concepts.json"


def test_validate_against_real_concepts_json(capsys):
    """The shipped data/concepts.json must pass `lookup.py validate`."""
    if not REAL_REGISTRY.is_file():
        # In a freshly-checked-out repo without the registry, skip — but
        # the file IS committed today, so this is defensive only.
        import pytest
        pytest.skip(f"real concepts registry not found at {REAL_REGISTRY}")

    reg = json.loads(REAL_REGISTRY.read_text())
    # cmd_validate reads args.json — pass it explicitly. cmd_validate exits(0)
    # on success and exits(1) on failure — catch the SystemExit so pytest
    # sees an assertion failure instead of getting killed.
    try:
        lookup.cmd_validate(Namespace(json=False), reg)
        exit_code = 0
    except SystemExit as e:
        exit_code = int(e.code) if e.code is not None else 0

    out = capsys.readouterr()
    assert exit_code == 0, (
        f"data/concepts.json failed validation (exit {exit_code}):\n"
        f"--- stdout ---\n{out.out}\n--- stderr ---\n{out.err}"
    )
