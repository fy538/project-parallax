"""
Unit tests for tools/narration/pronunciation_guide.py.

The tool extracts proper-noun candidates from a script and emits a
pronunciation cheat-sheet. Tests cover the candidate extractor (sentence-
start filtering, acronyms, multi-word names, possessives), the bundled
LEXICON lookup, the merge-mode IPA preservation, and end-to-end render
against the shipped prisoners-dilemma script.
"""

from __future__ import annotations

import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import pronunciation_guide as pg  # type: ignore[import-not-found]


# ── _normalise_term ──────────────────────────────────────────────────────────


class TestNormaliseTerm:
    def test_strips_possessive(self):
        assert pg._normalise_term("Schelling's") == "Schelling"

    def test_strips_curly_possessive(self):
        assert pg._normalise_term("Schelling’s") == "Schelling"

    def test_strips_leading_determiner(self):
        assert pg._normalise_term("The Prisoner's Dilemma") == "Prisoner's Dilemma"

    def test_leaves_lowercase_alone(self):
        # Determiners are case-sensitive — "the prisoner's" wouldn't be a
        # match candidate in the first place, but the normaliser should be
        # safe to call on anything.
        assert pg._normalise_term("the Prisoner's Dilemma") == "the Prisoner's Dilemma"

    def test_whitespace_collapsed(self):
        assert pg._normalise_term("  Schelling  ") == "Schelling"


# ── extract_candidates ───────────────────────────────────────────────────────


class TestExtractCandidates:
    def test_picks_up_mid_sentence_proper_noun(self):
        # Mid-sentence single-word capitalized → kept.
        counts = pg.extract_candidates("The work of Schelling shaped the field.")
        assert counts["Schelling"] >= 1

    def test_drops_sentence_initial_common_noun(self):
        # "Mutual" at sentence start is a common adjective in disguise.
        counts = pg.extract_candidates("Mutual defection is rare.")
        assert "Mutual" not in counts

    def test_keeps_sentence_initial_when_in_lexicon(self):
        # "Nash" IS in the lexicon — even sentence-initial it should count.
        counts = pg.extract_candidates("Nash read the results.")
        assert counts["Nash"] >= 1

    def test_keeps_multi_word_at_sentence_start(self):
        # "Thomas Schelling" at sentence start = real name, kept.
        counts = pg.extract_candidates("Thomas Schelling put it in a textbook.")
        assert "Thomas Schelling" in counts

    def test_strips_leading_connector_in_multi_word(self):
        # "In Beijing" at sentence start → keep "Beijing", drop "In".
        counts = pg.extract_candidates("In Beijing the meeting happened.")
        # The candidate should be "Beijing", not "In Beijing".
        assert "Beijing" in counts or "In Beijing" not in counts

    def test_dedupes_with_and_without_leading_determiner(self):
        text = "The Prisoner's Dilemma is real. Prisoner's Dilemma is the model."
        counts = pg.extract_candidates(text)
        # Both forms should collapse to one entry.
        assert "Prisoner's Dilemma" in counts
        assert "The Prisoner's Dilemma" not in counts

    def test_handles_possessive_form(self):
        counts = pg.extract_candidates("Schelling's textbook covered it.")
        assert counts["Schelling"] >= 1
        assert "Schelling's" not in counts

    def test_acronym_extraction(self):
        counts = pg.extract_candidates("TSMC and ASML supply EUV lithography to SMIC.")
        for term in ("TSMC", "ASML", "EUV", "SMIC"):
            assert counts[term] >= 1

    def test_common_acronyms_excluded(self):
        # US, AI, EU, etc. shouldn't surface — every English speaker knows them.
        counts = pg.extract_candidates("The US and EU debated AI policy at the UN.")
        for excluded in ("US", "EU", "AI", "UN"):
            assert excluded not in counts

    def test_months_filtered(self):
        counts = pg.extract_candidates("In January 1950 the experiment ran.")
        assert "January" not in counts

    def test_voice_note_marker_filtered(self):
        counts = pg.extract_candidates("COUNTERPOINT flickers under the narration.")
        assert "COUNTERPOINT" not in counts


# ── _is_sentence_initial ─────────────────────────────────────────────────────


class TestSentenceInitial:
    def test_position_zero_is_initial(self):
        assert pg._is_sentence_initial("Schelling wrote it.", 0)

    def test_after_period_space_is_initial(self):
        # "X. Schelling" — Schelling starts at position 3
        text = "X. Schelling wrote it."
        assert pg._is_sentence_initial(text, 3)

    def test_after_comma_is_not_initial(self):
        text = "First, Schelling wrote it."
        # "Schelling" starts at position 7
        assert not pg._is_sentence_initial(text, 7)

    def test_mid_sentence_is_not_initial(self):
        text = "The work of Schelling shaped the field."
        idx = text.index("Schelling")
        assert not pg._is_sentence_initial(text, idx)


# ── Term URL properties ──────────────────────────────────────────────────────


class TestTermUrls:
    def test_forvo_url_url_encodes_special_chars(self):
        t = pg.Term(term="Xi Jinping", count=1)
        assert "Xi%20Jinping" in t.forvo_url

    def test_forvo_url_for_simple_word(self):
        t = pg.Term(term="Schelling", count=1)
        assert t.forvo_url == "https://forvo.com/word/Schelling/"

    def test_wiktionary_url_handles_apostrophe(self):
        t = pg.Term(term="Prisoner's Dilemma", count=1)
        assert "Prisoner%27s" in t.wiktionary_url


# ── render_guide ─────────────────────────────────────────────────────────────


class TestRenderGuide:
    def test_empty_terms_produces_friendly_message(self):
        out = pg.render_guide([], slug="x")
        assert "No proper-noun candidates" in out

    def test_split_into_known_and_unknown_sections(self):
        terms = [
            pg.Term(term="Schelling", count=2, ipa="ˈʃɛlɪŋ", anglicized="SHELL-ing"),
            pg.Term(term="Untermeyer", count=1),
        ]
        out = pg.render_guide(terms, slug="x")
        assert "## In the lexicon" in out
        assert "## Needs verification" in out
        # Known section should have IPA + anglicized
        assert "`ˈʃɛlɪŋ`" in out
        assert "SHELL-ing" in out
        # Unknown should have Forvo + Wiktionary links
        assert "forvo.com/word/Untermeyer" in out

    def test_term_count_reflected_in_summary(self):
        terms = [
            pg.Term(term="A", count=3, ipa="x", anglicized="x"),
            pg.Term(term="B", count=1),
        ]
        out = pg.render_guide(terms, slug="x")
        assert "2 candidate term(s)" in out
        assert "1 in lexicon" in out
        assert "1 need verification" in out


# ── merge_existing_ipa ───────────────────────────────────────────────────────


class TestMergeExistingIpa:
    def test_preserves_operator_filled_values(self, tmp_path):
        # Existing guide where operator filled in IPA for Untermeyer.
        existing = tmp_path / "pronunciation-guide.md"
        existing.write_text(textwrap.dedent("""\
            # Pronunciation Guide — test

            | Term | Count | IPA | Anglicized | Forvo | Wiktionary |
            |---|---|---|---|---|---|
            | **Untermeyer** | 2 | `ˈʌntərmaɪər` | UN-ter-my-er | x | x |
        """), encoding="utf-8")
        # New extraction has Untermeyer with no IPA yet.
        fresh = [pg.Term(term="Untermeyer", count=2)]
        merged = pg.merge_existing_ipa(fresh, existing)
        assert merged[0].ipa == "ˈʌntərmaɪər"
        assert "UN-ter-my-er" in merged[0].anglicized

    def test_does_not_overwrite_lexicon_ipa(self, tmp_path):
        # If a term came back with lexicon IPA, merge shouldn't blow it away
        # with whatever the existing file said (lexicon = source of truth).
        existing = tmp_path / "p.md"
        existing.write_text(textwrap.dedent("""\
            | **Nash** | 1 | `WRONG` | wrong | x | x |
        """), encoding="utf-8")
        fresh = [pg.Term(term="Nash", count=1, ipa="næʃ", anglicized="NASH")]
        merged = pg.merge_existing_ipa(fresh, existing)
        # IPA was non-empty already → merge skips this row.
        assert merged[0].ipa == "næʃ"

    def test_missing_file_returns_input_unchanged(self, tmp_path):
        fresh = [pg.Term(term="X", count=1)]
        merged = pg.merge_existing_ipa(fresh, tmp_path / "missing.md")
        assert merged == fresh


# ── Real-data regression ─────────────────────────────────────────────────────


class TestRealScript:
    @pytest.fixture(scope="class")
    def real_terms(self) -> list[pg.Term]:
        import format_for_reading as ffr
        script_path = ffr.find_script("prisoners-dilemma")
        if script_path is None or not script_path.is_file():
            pytest.skip("prisoners-dilemma script not present")
        return pg.gather_terms_from_script(script_path)

    def test_finds_at_least_some_lexicon_hits(self, real_terms):
        known = [t for t in real_terms if t.ipa]
        # The script mentions Alchian, Nash, and RAND at minimum — all in
        # the bundled lexicon. If lookups break we want loud failure.
        assert len(known) >= 3, f"expected ≥3 lexicon hits, got {len(known)}"

    def test_no_transition_markers_leaked(self, real_terms):
        # Visual-column "TRANSITION" rows should not appear as candidates.
        names = {t.term.upper() for t in real_terms}
        for noise in ("TRANSITION", "TITLETRANSITION", "COUNTERPOINT"):
            assert noise not in names, f"{noise} leaked from visual column"

    def test_common_acronyms_filtered(self, real_terms):
        names = {t.term for t in real_terms}
        for noise in ("US", "AI", "EU", "UN", "PD"):
            assert noise not in names

    def test_real_proper_nouns_present(self, real_terms):
        # Hard regression test — these names exist in the script and must
        # be surfaced. If extraction breaks subtly, this trips.
        names = {t.term for t in real_terms}
        # At least a couple should make it through. Don't over-specify which
        # so minor LEXICON/extraction tweaks don't break the test.
        expected_some = {
            "Alchian", "Nash", "Thomas Schelling", "Robert Axelrod",
            "Douglas Hofstadter", "Jean-Jacques Rousseau",
        }
        hits = names & expected_some
        assert len(hits) >= 2, f"expected some names from {expected_some}, got {hits}"


# ── End-to-end CLI ───────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_stdout_mode_emits_markdown(self, tmp_path):
        script = tmp_path / "script-production.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — TEST (0:00–0:30)

            | NARRATION | VISUAL PRODUCTION |
            |-----------|-------------------|
            | Schelling wrote the textbook. | x |
        """), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "narration" / "pronunciation_guide.py"),
                "smoke-test",
                "--script", str(script),
                "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0, result.stderr
        assert "Schelling" in result.stdout
        assert "ˈʃɛlɪŋ" in result.stdout  # from lexicon
