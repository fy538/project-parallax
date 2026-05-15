"""Tests for tools/check_concept_coverage.py — registry-claimed concepts in script."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_concept_coverage as ccc  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent


# ─── Diacritic / matching helpers ────────────────────────────────────────────


class TestStripDiacritics:
    def test_chinese_pinyin_with_tone_marks(self):
        assert ccc.strip_diacritics("kǎ bózi") == "ka bozi"

    def test_no_change_for_ascii(self):
        assert ccc.strip_diacritics("hello") == "hello"

    def test_preserves_cjk_characters(self):
        # Hanzi don't have combining marks; should pass through unchanged.
        assert ccc.strip_diacritics("卡脖子") == "卡脖子"


class TestTermAppearsInScript:
    def test_basic_substring(self):
        assert ccc.term_appears_in_script("This is the COCOM regime.", "COCOM")

    def test_case_insensitive(self):
        assert ccc.term_appears_in_script("CHIPS Act funding", "chips act")

    def test_diacritic_insensitive(self):
        # Script lost diacritics — match should still succeed.
        assert ccc.term_appears_in_script("ka bozi technology", "kǎ bózi")

    def test_chinese_match(self):
        assert ccc.term_appears_in_script(
            "and the ballpoint 卡脖子 narrative drives policy",
            "卡脖子",
        )

    def test_no_match_when_absent(self):
        assert not ccc.term_appears_in_script("plain text", "missing term")

    def test_empty_needle_returns_false(self):
        assert not ccc.term_appears_in_script("any text", "")


class TestClaimsEpisode:
    def test_introduced_episode_claim(self):
        concept = {"introduced": {"episode": "demo"}}
        claims, reasons = ccc.claims_episode(concept, "demo")
        assert claims is True
        assert reasons == ["introduced"]

    def test_appearance_claim(self):
        concept = {"appearances": [{"episode": "demo"}]}
        claims, reasons = ccc.claims_episode(concept, "demo")
        assert claims is True
        assert reasons == ["appearance"]

    def test_both_introduce_and_appearance(self):
        concept = {
            "introduced": {"episode": "demo"},
            "appearances": [{"episode": "demo"}, {"episode": "other"}],
        }
        claims, reasons = ccc.claims_episode(concept, "demo")
        assert claims is True
        assert "introduced" in reasons and "appearance" in reasons

    def test_no_claim_when_unrelated(self):
        concept = {
            "introduced": {"episode": "other-ep"},
            "appearances": [{"episode": "yet-another"}],
        }
        claims, _ = ccc.claims_episode(concept, "demo")
        assert claims is False


# ─── End-to-end ──────────────────────────────────────────────────────────────


class TestCoverageEndToEnd:
    def _build(self, tmp_path: Path, concepts: list[dict], script_text: str) -> None:
        episodes = tmp_path / "episodes"
        (episodes / "demo").mkdir(parents=True)
        (episodes / "demo" / "script-production.md").write_text(script_text)
        registry_path = tmp_path / "concepts.json"
        registry_path.write_text(json.dumps({"version": "1.0.0", "concepts": concepts}))
        self._ep_root = episodes
        self._reg_path = registry_path

    def test_all_claimed_concepts_found(self, tmp_path, monkeypatch):
        self._build(tmp_path, concepts=[
            {"id": "c1", "term": {"en": "stranglehold technology"}, "introduced": {"episode": "demo"}},
            {"id": "c2", "term": {"en": "COCOM"}, "introduced": {"episode": "demo"}},
            {"id": "unrelated", "term": {"en": "foo"}, "introduced": {"episode": "other"}},
        ], script_text="stranglehold technology was a 1949 COCOM precursor")
        monkeypatch.setattr(ccc, "EPISODES_ROOT", self._ep_root)
        monkeypatch.setattr(ccc, "CONCEPTS_FILE", self._reg_path)
        report = ccc.check_coverage("demo")
        assert report.claimed == 2
        assert set(report.matched) == {"c1", "c2"}
        assert report.missing == []

    def test_missing_concept_reported(self, tmp_path, monkeypatch):
        self._build(tmp_path, concepts=[
            {"id": "c1", "term": {"en": "AbsentTerm"}, "introduced": {"episode": "demo"}},
        ], script_text="this script does not contain that string")
        monkeypatch.setattr(ccc, "EPISODES_ROOT", self._ep_root)
        monkeypatch.setattr(ccc, "CONCEPTS_FILE", self._reg_path)
        report = ccc.check_coverage("demo")
        assert len(report.missing) == 1
        assert report.missing[0].id == "c1"
        assert "introduced" in report.missing[0].reasons
        # In non-strict mode this is a warning, exit 0
        assert ccc.print_human(report, strict=False) == 0
        # In strict mode it's an error
        assert ccc.print_human(report, strict=True) == 1

    def test_alternate_term_form_succeeds(self, tmp_path, monkeypatch):
        # Script uses only the Chinese form; registry has all three.
        self._build(tmp_path, concepts=[{
            "id": "c1",
            "term": {"en": "stranglehold technology", "cn": "卡脖子", "pinyin": "kǎ bózi"},
            "introduced": {"episode": "demo"},
        }], script_text="The 卡脖子 narrative shapes policy.")
        monkeypatch.setattr(ccc, "EPISODES_ROOT", self._ep_root)
        monkeypatch.setattr(ccc, "CONCEPTS_FILE", self._reg_path)
        report = ccc.check_coverage("demo")
        assert report.matched == ["c1"]

    def test_concept_with_no_term_field_flagged(self, tmp_path, monkeypatch):
        # Missing canonical forms — can't be matched. Surface as a registry hygiene issue.
        self._build(tmp_path, concepts=[
            {"id": "no-terms", "introduced": {"episode": "demo"}},
        ], script_text="any content")
        monkeypatch.setattr(ccc, "EPISODES_ROOT", self._ep_root)
        monkeypatch.setattr(ccc, "CONCEPTS_FILE", self._reg_path)
        report = ccc.check_coverage("demo")
        assert len(report.missing) == 1
        assert "no term" in report.missing[0].searched_terms[0].lower()


# ─── Real episodes regression ────────────────────────────────────────────────


class TestRealEpisodes:
    @pytest.mark.parametrize("slug", ["silicon-trap", "prisoners-dilemma"])
    def test_check_runs_cleanly(self, slug):
        report = ccc.check_coverage(slug)
        assert report is not None
        assert report.total_registry > 0
        # Don't assert zero missing — concept term.en values are often
        # descriptive and won't appear verbatim. The default exit code (0
        # in non-strict mode) covers this; we just want the tool to RUN.
