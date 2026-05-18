"""
Tests for tools/cost_tracker.py — markdown ledger parser/writer.

Run: pytest tools/test_cost_tracker.py -v
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import cost_tracker as ct


# ── ROW_RE — the regex parsing each ledger row ────────────────────────────


def test_row_re_matches_basic_row():
    line = "| 2026-05-05 | silicon-trap | claude | 12.50 | research session |"
    m = ct.ROW_RE.match(line)
    assert m is not None
    assert m.group(1) == "2026-05-05"
    assert m.group(2) == "silicon-trap"
    assert m.group(3) == "claude"
    assert m.group(4) == "12.50"
    assert m.group(5) == "research session"


def test_row_re_handles_empty_note():
    line = "| 2026-05-05 | silicon-trap | claude | 5.00 |  |"
    m = ct.ROW_RE.match(line)
    assert m is not None
    assert m.group(5) == ""


def test_row_re_rejects_header_row():
    """The header row has 'date' instead of YYYY-MM-DD, so the strict regex rejects it
    structurally — no need to filter it later."""
    assert ct.ROW_RE.match("| date | episode | service | amount_usd | note |") is None


def test_row_re_rejects_separator_row():
    assert ct.ROW_RE.match("|---|---|---|---|---|") is None


def test_row_re_rejects_non_iso_date():
    line = "| 5/5/2026 | silicon-trap | claude | 12.50 | x |"
    assert ct.ROW_RE.match(line) is None


def test_row_re_rejects_non_numeric_amount():
    line = "| 2026-05-05 | silicon-trap | claude | twelve | x |"
    assert ct.ROW_RE.match(line) is None


# ── parse_log — ignores system rows and headers ────────────────────────────


def _write_log(tmp_path, content: str) -> Path:
    log = tmp_path / "COST_LOG.md"
    log.write_text(content, encoding="utf-8")
    return log


def test_parse_log_skips_system_row(tmp_path, monkeypatch):
    log_text = """# Cost Log

| date | episode | service | amount_usd | note |
|---|---|---|---|---|
| 2026-05-05 | silicon-trap | claude | 12.50 | research |
| 2026-05-05 | (system) | other | 0.00 | initialized |
"""
    log = _write_log(tmp_path, log_text)
    monkeypatch.setattr(ct, "LOG_PATH", log)
    rows = ct.parse_log()
    assert len(rows) == 1
    assert rows[0]["episode"] == "silicon-trap"


def test_parse_log_skips_header_text_row(tmp_path, monkeypatch):
    log_text = """| date | episode | service | amount_usd | note |
|---|---|---|---|---|
| 2026-05-05 | silicon-trap | claude | 12.50 | x |
"""
    log = _write_log(tmp_path, log_text)
    monkeypatch.setattr(ct, "LOG_PATH", log)
    rows = ct.parse_log()
    # Header row 'episode' name in episode column is filtered
    assert all(r["episode"] != "episode" for r in rows)


def test_parse_log_handles_malformed_rows_gracefully(tmp_path, monkeypatch):
    log_text = """|---|---|---|---|---|
| 2026-05-05 | silicon-trap | claude | 12.50 | good |
| not-a-row
| 2026-05-06 | silicon-trap | recraft | 3.00 | another good |
"""
    log = _write_log(tmp_path, log_text)
    monkeypatch.setattr(ct, "LOG_PATH", log)
    rows = ct.parse_log()
    assert len(rows) == 2
    assert rows[0]["amount"] == 12.50
    assert rows[1]["amount"] == 3.00


def test_parse_log_lowercases_service(tmp_path, monkeypatch):
    log_text = """|---|---|---|---|---|
| 2026-05-05 | silicon-trap | CLAUDE | 12.50 | x |
"""
    log = _write_log(tmp_path, log_text)
    monkeypatch.setattr(ct, "LOG_PATH", log)
    rows = ct.parse_log()
    assert rows[0]["service"] == "claude"


def test_parse_log_missing_file_exits(tmp_path, monkeypatch, capsys):
    monkeypatch.setattr(ct, "LOG_PATH", tmp_path / "nonexistent.md")
    import pytest
    with pytest.raises(SystemExit) as exc:
        ct.parse_log()
    assert exc.value.code == 1


# ── cmd_add — appends a new row to the ledger after the header separator ──


def test_cmd_add_inserts_after_separator(tmp_path, monkeypatch):
    log_text = """# Cost Log

| date | episode | service | amount_usd | note |
|---|---|---|---|---|
| 2026-05-05 | (system) | other | 0.00 | initialized |
"""
    log = _write_log(tmp_path, log_text)
    monkeypatch.setattr(ct, "LOG_PATH", log)

    class A:
        episode = "silicon-trap"
        service = "claude"
        amount = 12.50
        note = "test entry"
        date = "2026-05-06"
    rc = ct.cmd_add(A())
    assert rc == 0

    text = log.read_text(encoding="utf-8")
    # New row should land directly after the separator, before the system row
    sep_idx = text.find("|---|---|---|---|---|")
    new_idx = text.find("| 2026-05-06 | silicon-trap")
    sys_idx = text.find("| 2026-05-05 | (system)")
    assert sep_idx < new_idx < sys_idx


def test_cmd_add_rejects_invalid_service(tmp_path, monkeypatch, capsys):
    log = _write_log(tmp_path, "|---|---|---|---|---|\n")
    monkeypatch.setattr(ct, "LOG_PATH", log)

    class A:
        episode = "silicon-trap"
        service = "bogus-service"
        amount = 1.0
        note = "x"
        date = None
    rc = ct.cmd_add(A())
    assert rc == 1
    assert "invalid service" in capsys.readouterr().err.lower()


def test_cmd_add_uses_today_when_no_date(tmp_path, monkeypatch):
    log = _write_log(tmp_path, "|---|---|---|---|---|\n")
    monkeypatch.setattr(ct, "LOG_PATH", log)

    class A:
        episode = "silicon-trap"
        service = "claude"
        amount = 1.0
        note = "x"
        date = None
    ct.cmd_add(A())
    text = log.read_text(encoding="utf-8")
    # Default date should be today's ISO format — just verify it has YYYY-MM-DD shape
    import re
    assert re.search(r"\| \d{4}-\d{2}-\d{2} \| silicon-trap", text)


def test_cmd_add_aborts_when_no_separator_found(tmp_path, monkeypatch, capsys):
    log = _write_log(tmp_path, "no separator in this file\n")
    monkeypatch.setattr(ct, "LOG_PATH", log)

    class A:
        episode = "silicon-trap"
        service = "claude"
        amount = 1.0
        note = "x"
        date = "2026-05-05"
    rc = ct.cmd_add(A())
    assert rc == 1
    assert "could not find" in capsys.readouterr().err.lower()


# ── add → parse round-trip ─────────────────────────────────────────────────


def test_add_then_parse_round_trip(tmp_path, monkeypatch):
    log_text = """|---|---|---|---|---|
"""
    log = _write_log(tmp_path, log_text)
    monkeypatch.setattr(ct, "LOG_PATH", log)

    class A:
        episode = "silicon-trap"
        service = "claude"
        amount = 12.50
        note = "round-trip test"
        date = "2026-05-05"
    ct.cmd_add(A())

    rows = ct.parse_log()
    assert len(rows) == 1
    assert rows[0]["episode"] == "silicon-trap"
    assert rows[0]["service"] == "claude"
    assert rows[0]["amount"] == 12.50
    assert rows[0]["note"] == "round-trip test"
    assert rows[0]["date"] == "2026-05-05"


# ── cmd_summary — exits 0 with empty/non-empty data ───────────────────────


def test_cmd_summary_no_entries_prints_message(tmp_path, monkeypatch, capsys):
    log = _write_log(tmp_path, "|---|---|---|---|---|\n")
    monkeypatch.setattr(ct, "LOG_PATH", log)

    class A:
        episode = None
        service = None
    rc = ct.cmd_summary(A())
    assert rc == 0
    assert "no matching entries" in capsys.readouterr().out.lower()


def test_cmd_summary_aggregates(tmp_path, monkeypatch, capsys):
    log_text = """|---|---|---|---|---|
| 2026-05-05 | silicon-trap | claude | 10.00 | a |
| 2026-05-06 | silicon-trap | recraft | 5.00 | b |
| 2026-05-07 | prisoners-dilemma | claude | 7.00 | c |
"""
    log = _write_log(tmp_path, log_text)
    monkeypatch.setattr(ct, "LOG_PATH", log)

    class A:
        episode = None
        service = None
    rc = ct.cmd_summary(A())
    out = capsys.readouterr().out
    assert rc == 0
    assert "$22.00" in out  # 10 + 5 + 7
    assert "silicon-trap" in out and "15.00" in out
    assert "prisoners-dilemma" in out and "7.00" in out


def test_cmd_summary_filters_by_episode(tmp_path, monkeypatch, capsys):
    log_text = """|---|---|---|---|---|
| 2026-05-05 | silicon-trap | claude | 10.00 | a |
| 2026-05-07 | prisoners-dilemma | claude | 7.00 | c |
"""
    log = _write_log(tmp_path, log_text)
    monkeypatch.setattr(ct, "LOG_PATH", log)

    class A:
        episode = "silicon-trap"
        service = None
    ct.cmd_summary(A())
    out = capsys.readouterr().out
    assert "silicon-trap" in out
    assert "prisoners-dilemma" not in out
