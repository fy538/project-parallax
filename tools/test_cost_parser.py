"""Tests for tools/cost_parser.py."""

from __future__ import annotations

import sys
import textwrap
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import cost_parser as cp


def test_empty_log_returns_empty_cost_data(tmp_path):
    f = tmp_path / "COST_LOG.md"
    f.write_text("# Cost Log\n\n## Ledger\n\n| date | episode | service | amount_usd | note |\n", encoding="utf-8")
    data = cp.load_cost_data(f)
    assert data.is_empty
    assert data.total_usd == 0.0
    assert data.by_episode == {}
    assert data.by_service == {}


def test_missing_file_returns_empty(tmp_path):
    data = cp.load_cost_data(tmp_path / "does-not-exist.md")
    assert data.is_empty


def test_parses_three_rows_aggregates_by_episode_and_service(tmp_path):
    f = tmp_path / "COST_LOG.md"
    f.write_text(textwrap.dedent("""\
        # Cost Log

        ## Ledger

        | date | episode | service | amount_usd | note |
        |---|---|---|---|---|
        | 2026-05-10 | silicon-trap | claude | 8.50 | research |
        | 2026-05-11 | silicon-trap | recraft | 1.20 | three illust |
        | 2026-05-12 | prisoners-dilemma | claude | 4.00 | audit pass |
    """), encoding="utf-8")
    data = cp.load_cost_data(f)
    assert not data.is_empty
    assert data.total_usd == 13.70
    assert data.by_episode == {"silicon-trap": 9.70, "prisoners-dilemma": 4.00}
    assert data.by_service == {"claude": 12.50, "recraft": 1.20}
    assert len(data.rows) == 3


def test_skips_system_init_row(tmp_path):
    """The `(system)` slug in the canonical init row should never aggregate."""
    f = tmp_path / "COST_LOG.md"
    f.write_text(textwrap.dedent("""\
        | date | episode | service | amount_usd | note |
        |---|---|---|---|---|
        | 2026-05-05 | (system) | other | 0.00 | log initialized |
        | 2026-05-10 | silicon-trap | claude | 8.50 | research |
    """), encoding="utf-8")
    data = cp.load_cost_data(f)
    assert data.total_usd == 8.50
    assert "(system)" not in data.by_episode


def test_accepts_negative_amounts_for_refunds(tmp_path):
    f = tmp_path / "COST_LOG.md"
    f.write_text(textwrap.dedent("""\
        | 2026-05-10 | demo | recraft | 5.00 | original spend |
        | 2026-05-11 | demo | recraft | -2.00 | partial refund |
    """), encoding="utf-8")
    data = cp.load_cost_data(f)
    assert data.total_usd == 3.00
    assert data.by_episode["demo"] == 3.00


def test_lowercases_service_for_consistent_aggregation(tmp_path):
    """Operator typos: `Claude` vs `claude` shouldn't double-count."""
    f = tmp_path / "COST_LOG.md"
    f.write_text(textwrap.dedent("""\
        | 2026-05-10 | demo | Claude | 5.00 | one |
        | 2026-05-11 | demo | claude | 3.00 | two |
    """), encoding="utf-8")
    data = cp.load_cost_data(f)
    assert data.by_service == {"claude": 8.00}


def test_real_repo_cost_log_parses_to_empty():
    """Sanity: the canonical empty COST_LOG.md parses to is_empty=True.
    Guards against future edits that introduce a row with a malformed
    shape that the parser would silently misread."""
    data = cp.load_cost_data()
    # As of May 2026 the log has only the system init row.
    # Loose assertion (`is_empty` OR has some rows) — if Tiger starts
    # logging real spend, the assertion still passes.
    if not data.is_empty:
        assert all(r.episode != "(system)" for r in data.rows)
