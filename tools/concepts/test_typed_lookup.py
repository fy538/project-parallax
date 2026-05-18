"""
Unit tests for the typed-object lookup commands added to
tools/concepts/lookup.py (cmd_person / cmd_quote / cmd_source).

Casey Newton typed-object pattern: registry stores Persons / Quotes /
Sources as first-class entries alongside Concepts, so cross-episode
queries like "every prior mention of Kennan" become trivial.

Covers:
  · _entries_of_type / _matches_query / _format_appearances helpers
  · cmd_person (filter / all / JSON / cross-episode appearances)
  · cmd_quote (filter / attribution rendered)
  · cmd_source (filter / sourceMeta rendered)
  · CLI smoke (each new subcommand on a synthetic registry)
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path
from types import SimpleNamespace

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import lookup  # type: ignore[import-not-found]


# ── Fixture registry ───────────────────────────────────────────────────────


def _registry():
    return {
        "version": "1.0.0",
        "concepts": [
            {
                "id": "george-kennan",
                "type": "person",
                "term": {"en": "George Kennan"},
                "definition": "American diplomat, architect of containment policy.",
                "introduced": {"episode": "prisoners-dilemma", "beat": 4},
                "appearances": [
                    {"episode": "silicon-trap", "beat": 2},
                    {"episode": "blockades-leak", "beat": 1},
                ],
            },
            {
                "id": "thomas-schelling",
                "type": "person",
                "term": {"en": "Thomas Schelling"},
                "definition": "Game theorist, author of The Strategy of Conflict.",
                "introduced": {"episode": "prisoners-dilemma", "beat": 2},
                "appearances": [],
            },
            {
                "id": "kennan-long-telegram-quote",
                "type": "quote",
                "term": {"en": "Soviet power is impervious to logic of reason."},
                "attribution": "George Kennan, Long Telegram (1946)",
                "introduced": {"episode": "blockades-leak", "beat": 1},
                "appearances": [],
            },
            {
                "id": "allison-thucydides-trap",
                "type": "source",
                "term": {"en": "Destined for War"},
                "sourceMeta": {
                    "author": "Graham Allison",
                    "year": 2017,
                    "publisher": "Houghton Mifflin Harcourt",
                    "url": "https://www.belfercenter.org/thucydides-trap",
                },
                "introduced": {"episode": "silicon-trap", "beat": 3},
                "appearances": [
                    {"episode": "prisoners-dilemma", "beat": 5},
                ],
            },
            # A non-typed entry so we can verify filtering ignores it
            {
                "id": "wrong-game",
                "type": "framework",
                "term": {"en": "The Wrong Game"},
                "definition": "Applying a special-case model to general cases.",
                "introduced": {"episode": "prisoners-dilemma", "beat": 3},
                "appearances": [],
            },
        ],
    }


# ── Helpers ────────────────────────────────────────────────────────────────


class TestEntriesOfType:
    def test_filters_by_type(self):
        reg = _registry()
        persons = lookup._entries_of_type(reg, "person")
        assert {p["id"] for p in persons} == {"george-kennan", "thomas-schelling"}

    def test_unknown_type_empty(self):
        assert lookup._entries_of_type(_registry(), "nonexistent") == []


class TestMatchesQuery:
    def test_matches_term_en(self):
        concept = {"id": "x", "term": {"en": "George Kennan"}}
        assert lookup._matches_query(concept, "kennan")
        assert not lookup._matches_query(concept, "schelling")

    def test_matches_attribution(self):
        concept = {"id": "x", "attribution": "George Kennan, 1946"}
        assert lookup._matches_query(concept, "kennan")

    def test_matches_source_meta_author(self):
        concept = {"id": "x", "sourceMeta": {"author": "Graham Allison"}}
        assert lookup._matches_query(concept, "allison")

    def test_case_insensitive(self):
        concept = {"id": "x", "term": {"en": "George Kennan"}}
        assert lookup._matches_query(concept, "KENNAN")
        assert lookup._matches_query(concept, "George")


class TestFormatAppearances:
    def test_intro_only(self):
        c = {"introduced": {"episode": "ep-a", "beat": 1}, "appearances": []}
        out = lookup._format_appearances(c)
        assert "intro: ep-a Beat 1" in out

    def test_intro_plus_appearances(self):
        c = {
            "introduced": {"episode": "ep-a", "beat": 1},
            "appearances": [
                {"episode": "ep-b", "beat": 2},
                {"episode": "ep-c", "beat": 3},
            ],
        }
        out = lookup._format_appearances(c)
        assert "ep-a Beat 1" in out
        assert "ep-b Beat 2" in out
        assert "ep-c Beat 3" in out


# ── cmd_person ─────────────────────────────────────────────────────────────


class TestCmdPerson:
    def test_lists_all_when_query_empty(self, capsys):
        args = SimpleNamespace(query="", json=False)
        lookup.cmd_person(args, _registry())
        out = capsys.readouterr().out
        assert "George Kennan" in out
        assert "Thomas Schelling" in out

    def test_filters_by_query(self, capsys):
        args = SimpleNamespace(query="Kennan", json=False)
        lookup.cmd_person(args, _registry())
        out = capsys.readouterr().out
        assert "George Kennan" in out
        assert "Thomas Schelling" not in out

    def test_json_output(self, capsys):
        args = SimpleNamespace(query="Kennan", json=True)
        lookup.cmd_person(args, _registry())
        payload = json.loads(capsys.readouterr().out)
        assert len(payload) == 1
        assert payload[0]["id"] == "george-kennan"

    def test_appearances_shown(self, capsys):
        args = SimpleNamespace(query="Kennan", json=False)
        lookup.cmd_person(args, _registry())
        out = capsys.readouterr().out
        # Cross-episode appearances surface
        assert "silicon-trap" in out
        assert "blockades-leak" in out

    def test_no_matches_message(self, capsys):
        args = SimpleNamespace(query="nonexistent-person", json=False)
        lookup.cmd_person(args, _registry())
        out = capsys.readouterr().out
        assert "No `person` entries" in out

    def test_draft_entries_hidden_by_default(self, capsys):
        reg = _registry()
        # Mark Schelling as draft
        for c in reg["concepts"]:
            if c["id"] == "thomas-schelling":
                c["_status"] = "draft"
        args = SimpleNamespace(query="", json=False)
        lookup.cmd_person(args, reg)
        out = capsys.readouterr().out
        assert "George Kennan" in out
        # Draft entry should NOT appear
        assert "Thomas Schelling" not in out

    def test_include_drafts_surfaces_them(self, capsys):
        reg = _registry()
        for c in reg["concepts"]:
            if c["id"] == "thomas-schelling":
                c["_status"] = "draft"
        args = SimpleNamespace(query="", json=False, include_drafts=True)
        lookup.cmd_person(args, reg)
        out = capsys.readouterr().out
        assert "Thomas Schelling" in out


# ── cmd_quote ──────────────────────────────────────────────────────────────


class TestCmdQuote:
    def test_renders_quote_with_attribution(self, capsys):
        args = SimpleNamespace(query="", json=False)
        lookup.cmd_quote(args, _registry())
        out = capsys.readouterr().out
        assert "Soviet power is impervious" in out
        assert "George Kennan" in out
        assert "1946" in out

    def test_filters_by_attribution(self, capsys):
        # Search by attribution should hit the quote
        args = SimpleNamespace(query="Kennan", json=False)
        lookup.cmd_quote(args, _registry())
        out = capsys.readouterr().out
        assert "Soviet power" in out

    def test_filters_by_quote_text(self, capsys):
        args = SimpleNamespace(query="impervious", json=False)
        lookup.cmd_quote(args, _registry())
        out = capsys.readouterr().out
        assert "Kennan" in out

    def test_json_output(self, capsys):
        args = SimpleNamespace(query="", json=True)
        lookup.cmd_quote(args, _registry())
        payload = json.loads(capsys.readouterr().out)
        assert len(payload) == 1
        assert payload[0]["type"] == "quote"


# ── cmd_source ─────────────────────────────────────────────────────────────


class TestCmdSource:
    def test_renders_source_meta(self, capsys):
        args = SimpleNamespace(query="", json=False)
        lookup.cmd_source(args, _registry())
        out = capsys.readouterr().out
        assert "Destined for War" in out
        assert "Graham Allison" in out
        assert "2017" in out
        assert "belfercenter.org" in out

    def test_filters_by_author(self, capsys):
        args = SimpleNamespace(query="Allison", json=False)
        lookup.cmd_source(args, _registry())
        out = capsys.readouterr().out
        assert "Destined for War" in out

    def test_no_matches_message(self, capsys):
        args = SimpleNamespace(query="nonexistent-source", json=False)
        lookup.cmd_source(args, _registry())
        out = capsys.readouterr().out
        assert "No `source` entries" in out


# ── CLI smoke ──────────────────────────────────────────────────────────────


class TestCliSmoke:
    def _make_registry_file(self, tmp_path):
        p = tmp_path / "concepts.json"
        p.write_text(json.dumps(_registry()), encoding="utf-8")
        return p

    def test_person_cli(self, tmp_path):
        reg = self._make_registry_file(tmp_path)
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "concepts" / "lookup.py"),
             "--registry", str(reg), "person", "Kennan"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert "George Kennan" in result.stdout

    def test_quote_cli(self, tmp_path):
        reg = self._make_registry_file(tmp_path)
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "concepts" / "lookup.py"),
             "--registry", str(reg), "quote", "impervious"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert "Soviet power" in result.stdout

    def test_source_cli_json(self, tmp_path):
        reg = self._make_registry_file(tmp_path)
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "concepts" / "lookup.py"),
             "--json", "--registry", str(reg), "source", ""],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert len(payload) == 1
        assert payload[0]["sourceMeta"]["author"] == "Graham Allison"

    def test_person_no_query_lists_all(self, tmp_path):
        reg = self._make_registry_file(tmp_path)
        # `person` with no arg should default to "" → list all
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "concepts" / "lookup.py"),
             "--registry", str(reg), "person"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        assert "George Kennan" in result.stdout
        assert "Thomas Schelling" in result.stdout
