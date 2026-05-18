"""
Unit tests for tools/sourcing/source_sheet.py.

Covers:
  · _count_words (strips claim tags + annotation braces)
  · _split_sentences
  · extract_claims (per-tag entries, multi-tag cells, beat tracking,
    word offset accumulation)
  · map_claims_to_timecodes (with manifest + fallback)
  · render_source_sheet_md (no-claims path / with-claims / no-manifest banner)
  · CLI smoke (missing script / synthetic episode / real prisoners-dilemma)
"""

from __future__ import annotations

import json
import subprocess
import sys
import textwrap
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import source_sheet as ss  # type: ignore[import-not-found]


# ── _count_words ────────────────────────────────────────────────────────────


class TestCountWords:
    def test_strips_claim_tags(self):
        assert ss._count_words("hello world {✅}") == 2

    def test_strips_other_annotation_braces(self):
        assert ss._count_words("hello {⚠️} world {NEW}") == 2

    def test_handles_punctuation(self):
        assert ss._count_words("one, two. three!") == 3


# ── _split_sentences ───────────────────────────────────────────────────────


class TestSplitSentences:
    def test_basic_split(self):
        out = ss._split_sentences("First. Second. Third.")
        assert len(out) == 3

    def test_rhetorical_lowercase_splits(self):
        # Sayability fix: lookahead-uppercase was dropped
        out = ss._split_sentences("What is X? it is Y.")
        assert len(out) == 2

    def test_empty(self):
        assert ss._split_sentences("") == []


# ── extract_claims ─────────────────────────────────────────────────────────


def _make_script(tmp_path, body):
    p = tmp_path / "script.md"
    p.write_text(body, encoding="utf-8")
    return p


class TestExtractClaims:
    def test_single_claim(self, tmp_path):
        script = _make_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — Test

            | NARRATION | VISUAL |
            |-----------|--------|
            | Hello world. {✅} | [x] |
        """))
        claims = ss.extract_claims(script)
        assert len(claims) == 1
        assert claims[0].beat_number == 1
        assert claims[0].number == 1
        assert "{" not in claims[0].claim_text  # tags stripped
        assert "Hello world" in claims[0].claim_text

    def test_multi_claim_cell_each_gets_entry(self, tmp_path):
        script = _make_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — Test

            | NARRATION | VISUAL |
            |-----------|--------|
            | First fact. {✅} Second fact. {✅} | [x] |
        """))
        claims = ss.extract_claims(script)
        assert len(claims) == 2
        assert claims[0].number == 1
        assert claims[1].number == 2

    def test_word_offset_accumulates_across_rows(self, tmp_path):
        script = _make_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — Test

            | NARRATION | VISUAL |
            |-----------|--------|
            | The first row has five words. | [x] |
            | Second row tagged here. {✅} | [x] |
        """))
        claims = ss.extract_claims(script)
        assert len(claims) == 1
        # Word offset should be > 0 (accumulated from the prior row)
        assert claims[0].word_offset >= 5

    def test_beat_offset_resets_per_beat(self, tmp_path):
        script = _make_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — One

            | NARRATION | VISUAL |
            |-----------|--------|
            | A long line of narration filling words here. | [x] |

            ## BEAT 2 — Two

            | NARRATION | VISUAL |
            |-----------|--------|
            | Quick claim. {✅} | [x] |
        """))
        claims = ss.extract_claims(script)
        assert len(claims) == 1
        # Beat 2's offset should be small (resets per beat)
        assert claims[0].beat_number == 2
        assert claims[0].word_offset < 5

    def test_no_claims(self, tmp_path):
        script = _make_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — Test

            | NARRATION | VISUAL |
            |-----------|--------|
            | No tags here. | [x] |
        """))
        assert ss.extract_claims(script) == []

    def test_leading_tag_glued_back_to_prior_sentence(self, tmp_path):
        # Real script pattern: multiple {✅} tags in one cell, each at
        # the end of a sentence. Pre-fix the splitter put each {✅} at
        # the START of the next fragment, attributing claims to the
        # wrong sentence and producing duplicates.
        script = _make_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — Test

            | NARRATION | VISUAL |
            |-----------|--------|
            | First fact. {✅} Second fact. {✅} Third fact. {✅} | [x] |
        """))
        claims = ss.extract_claims(script)
        # Three distinct claims, each for the correct sentence
        assert len(claims) == 3
        texts = [c.claim_text for c in claims]
        assert any("First" in t for t in texts)
        assert any("Second" in t for t in texts)
        assert any("Third" in t for t in texts)
        # No duplicates
        assert len(set(texts)) == 3

    def test_bracket_directive_not_surfaced_as_claim(self, tmp_path):
        # `[VISUAL-FIRST: 3s]` in the narration column is a directive,
        # not a claim. Pre-fix it surfaced as its own claim because the
        # {✅} that ended the prior sentence ended up attached to the
        # bracket-directive fragment.
        script = _make_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — Test

            | NARRATION | VISUAL |
            |-----------|--------|
            | An actual claim here. {✅} [VISUAL-FIRST: 3s] | [x] |
        """))
        claims = ss.extract_claims(script)
        assert len(claims) == 1
        assert "VISUAL-FIRST" not in claims[0].claim_text
        assert "actual claim" in claims[0].claim_text

    def test_beat_id_non_numeric_still_works(self, tmp_path):
        # Manifest with non-numeric beat IDs (e.g. "opening") would
        # previously collapse to beat 0 and drop timecode to 0.
        script = _make_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — Open

            | NARRATION | VISUAL |
            |-----------|--------|
            | Hello. {✅} | [x] |

            ## BEAT 2 — Mid

            | NARRATION | VISUAL |
            |-----------|--------|
            | World. {✅} | [x] |
        """))
        manifest = {
            "totalDurationSec": 120,
            "beats": [
                {"id": "opening", "startSec": 0},
                {"id": "mid", "startSec": 60},
            ],
        }
        claims = ss.extract_claims(script)
        ss.map_claims_to_timecodes(claims, manifest)
        # Claim 2 should land at 60s+ (in BEAT 2), not at 0
        beat2_claim = next(c for c in claims if c.beat_number == 2)
        assert beat2_claim.timecode_sec >= 60.0

    def test_other_annotation_braces_not_treated_as_claims(self, tmp_path):
        # {⚠️} {NEW} {valencia,torbel,maine} are NOT verified-claim tags
        script = _make_script(tmp_path, textwrap.dedent("""\
            ## BEAT 1 — Test

            | NARRATION | VISUAL |
            |-----------|--------|
            | Caveat sentence. {⚠️} New thing. {NEW} | [x] |
        """))
        assert ss.extract_claims(script) == []


# ── map_claims_to_timecodes ────────────────────────────────────────────────


class TestMapTimecodes:
    def test_with_manifest_uses_beat_start(self):
        claims = [
            ss.ClaimEntry(
                number=1, beat_number=2, beat_title="x",
                timecode_sec=0.0, claim_text="x", word_offset=0,
            ),
        ]
        manifest = {
            "beats": [
                {"id": "beat1", "startSec": 0},
                {"id": "beat2", "startSec": 120},
            ],
        }
        ss.map_claims_to_timecodes(claims, manifest, wpm=150)
        # Beat 2 starts at 120s, word_offset 0 → 120.0
        assert claims[0].timecode_sec == pytest.approx(120.0, abs=0.5)

    def test_with_manifest_adds_within_beat_offset(self):
        claims = [
            ss.ClaimEntry(
                number=1, beat_number=2, beat_title="x",
                timecode_sec=0.0, claim_text="x", word_offset=150,
            ),
        ]
        manifest = {
            "beats": [
                {"id": "beat1", "startSec": 0},
                {"id": "beat2", "startSec": 120},
            ],
        }
        ss.map_claims_to_timecodes(claims, manifest, wpm=150)
        # 150 words at 150 wpm = 60s, plus 120s beat start = 180s
        assert claims[0].timecode_sec == pytest.approx(180.0, abs=0.5)

    def test_no_manifest_uses_wpm_fallback(self):
        claims = [
            ss.ClaimEntry(
                number=1, beat_number=1, beat_title="x",
                timecode_sec=0.0, claim_text="x", word_offset=300,
            ),
        ]
        ss.map_claims_to_timecodes(claims, None, wpm=150)
        # 300 words at 150 wpm = 120s
        assert claims[0].timecode_sec == pytest.approx(120.0, abs=0.5)


# ── render_source_sheet_md ─────────────────────────────────────────────────


class TestRenderSourceSheet:
    def _make_report(self, claims=None, has_manifest=True):
        return ss.SourceSheetReport(
            slug="x", episode_title="Test Episode",
            script_path="/tmp/s.md",
            manifest_path="/tmp/m.json" if has_manifest else "",
            total_claims=len(claims or []),
            claims=claims or [],
        )

    def test_no_claims_message(self):
        out = ss.render_source_sheet_md(self._make_report())
        assert "No verified claims" in out

    def test_claims_render_with_timecodes(self):
        claims = [
            ss.ClaimEntry(
                number=1, beat_number=1, beat_title="OPEN",
                timecode_sec=45.0, claim_text="Claim text here.", word_offset=10,
            ),
        ]
        out = ss.render_source_sheet_md(self._make_report(claims=claims))
        assert "0:45" in out
        assert "Claim text here" in out
        assert "Source:" in out
        assert "OPEN" in out

    def test_no_manifest_banner(self):
        claims = [
            ss.ClaimEntry(
                number=1, beat_number=1, beat_title="OPEN",
                timecode_sec=0.0, claim_text="x", word_offset=0,
            ),
        ]
        out = ss.render_source_sheet_md(self._make_report(claims=claims, has_manifest=False))
        assert "No assembly manifest" in out

    def test_groups_by_beat(self):
        claims = [
            ss.ClaimEntry(number=1, beat_number=1, beat_title="ONE",
                          timecode_sec=10, claim_text="A", word_offset=0),
            ss.ClaimEntry(number=2, beat_number=2, beat_title="TWO",
                          timecode_sec=120, claim_text="B", word_offset=0),
        ]
        out = ss.render_source_sheet_md(self._make_report(claims=claims))
        assert "Beat 1" in out
        assert "Beat 2" in out
        assert "ONE" in out and "TWO" in out


# ── CLI smoke ──────────────────────────────────────────────────────────────


# ── Source-suggestion (B1 ↔ B2 bridge) ───────────────────────────────────


def _source_entry(id, title, author, year=2020, url="", page="", status=None):
    """Build a type='source' registry entry for testing."""
    entry = {
        "id": id,
        "type": "source",
        "term": {"en": title},
        "definition": title,
        "introduced": {"episode": "ep-x", "beat": 1},
        "sourceMeta": {"author": author, "year": year},
    }
    if url:
        entry["sourceMeta"]["url"] = url
    if page:
        entry["sourceMeta"]["page"] = page
    if status:
        entry["_status"] = status
    return entry


class TestAuthorLastname:
    def test_single_name(self):
        assert ss._author_lastname("Allison") == "Allison"

    def test_two_names(self):
        assert ss._author_lastname("Graham Allison") == "Allison"

    def test_three_names(self):
        assert ss._author_lastname("John von Neumann") == "Neumann"

    def test_initials(self):
        assert ss._author_lastname("F. Scott Fitzgerald") == "Fitzgerald"

    def test_empty(self):
        assert ss._author_lastname("") == ""


class TestWordBoundaryMatch:
    def test_matches_word(self):
        assert ss._word_boundary_match("Nash", "John Nash read the results")

    def test_avoids_substring_false_positive(self):
        # "us" should NOT match "trust" — word-boundary required
        assert not ss._word_boundary_match("us", "trust the process")

    def test_case_insensitive(self):
        assert ss._word_boundary_match("kennan", "George Kennan said")
        assert ss._word_boundary_match("KENNAN", "george kennan said")

    def test_empty_inputs(self):
        assert not ss._word_boundary_match("", "anything")
        assert not ss._word_boundary_match("anything", "")


class TestTitleSubstringMatch:
    def test_full_title_match(self):
        assert ss._title_substring_match(
            "Strategy of Conflict", "Schelling's Strategy of Conflict book",
        ) == "Strategy of Conflict"

    def test_partial_match_below_min_skipped(self):
        # 3-char title is below MIN_TITLE_TOKEN_LEN (4)
        assert ss._title_substring_match("War", "After the War ended") is None

    def test_no_match(self):
        assert ss._title_substring_match("X", "totally unrelated") is None

    def test_word_boundary_enforced(self):
        # Title "war" should not match "warhead"
        assert ss._title_substring_match("warning", "afterwarnings") is None


class TestSuggestSourcesForClaim:
    def test_author_match_wins(self):
        entries = [
            _source_entry("nash-1950", "Equilibrium points", "John Nash"),
            _source_entry("schelling-1960", "Strategy of Conflict", "Thomas Schelling"),
        ]
        sugs = ss.suggest_sources_for_claim(
            "John Nash read the results.", entries,
        )
        assert len(sugs) == 1
        assert sugs[0].id == "nash-1950"
        assert "Nash" in sugs[0].match_reason

    def test_title_match_when_no_author(self):
        entries = [
            _source_entry("schelling-1960", "Strategy of Conflict", "Thomas Schelling"),
        ]
        sugs = ss.suggest_sources_for_claim(
            "The book Strategy of Conflict redefined deterrence.", entries,
        )
        # Author "Schelling" is not in the claim — title hits instead
        assert len(sugs) == 1
        assert "title" in sugs[0].match_reason

    def test_multiple_authors_match(self):
        entries = [
            _source_entry("nash-1950", "Equilibrium", "John Nash"),
            _source_entry("flood-1952", "Some Experimental Games", "Merrill Flood"),
        ]
        sugs = ss.suggest_sources_for_claim(
            "Flood showed Nash the data.", entries,
        )
        ids = {s.id for s in sugs}
        assert ids == {"nash-1950", "flood-1952"}

    def test_no_match_returns_empty(self):
        entries = [
            _source_entry("nash-1950", "Equilibrium", "John Nash"),
        ]
        sugs = ss.suggest_sources_for_claim(
            "Completely unrelated claim text.", entries,
        )
        assert sugs == []

    def test_empty_entries_returns_empty(self):
        sugs = ss.suggest_sources_for_claim("anything", [])
        assert sugs == []

    def test_dedup_by_id(self):
        # Same entry shouldn't surface twice even if both author + title match
        entries = [
            _source_entry("nash-1950", "Nash equilibrium", "John Nash"),
        ]
        sugs = ss.suggest_sources_for_claim(
            "John Nash's Nash equilibrium concept.", entries,
        )
        assert len(sugs) == 1


class TestLoadSourceEntries:
    def test_loads_only_source_type(self, tmp_path):
        reg = tmp_path / "concepts.json"
        reg.write_text(json.dumps({
            "concepts": [
                _source_entry("a", "Title A", "Author A"),
                {"id": "b", "type": "framework", "term": {"en": "x"},
                 "definition": "x", "introduced": {"episode": "e", "beat": 1}},
                _source_entry("c", "Title C", "Author C"),
            ],
        }), encoding="utf-8")
        out = ss.load_source_entries(reg)
        assert {e["id"] for e in out} == {"a", "c"}

    def test_skips_drafts_by_default(self, tmp_path):
        reg = tmp_path / "concepts.json"
        reg.write_text(json.dumps({
            "concepts": [
                _source_entry("a", "Title", "Author"),
                _source_entry("b", "Draft", "Author", status="draft"),
            ],
        }), encoding="utf-8")
        out = ss.load_source_entries(reg)
        assert {e["id"] for e in out} == {"a"}

    def test_include_drafts_opt_in(self, tmp_path):
        reg = tmp_path / "concepts.json"
        reg.write_text(json.dumps({
            "concepts": [_source_entry("b", "Draft", "Author", status="draft")],
        }), encoding="utf-8")
        out = ss.load_source_entries(reg, include_drafts=True)
        assert len(out) == 1

    def test_missing_file_empty(self, tmp_path):
        assert ss.load_source_entries(tmp_path / "no-such.json") == []

    def test_malformed_empty(self, tmp_path):
        reg = tmp_path / "concepts.json"
        reg.write_text("not json", encoding="utf-8")
        assert ss.load_source_entries(reg) == []


class TestAttachSourceSuggestions:
    def test_populates_in_place(self):
        claims = [
            ss.ClaimEntry(
                number=1, beat_number=1, beat_title="x",
                timecode_sec=0, claim_text="John Nash protested.",
                word_offset=0,
            ),
        ]
        entries = [_source_entry("nash", "Equilibrium", "John Nash")]
        ss.attach_source_suggestions(claims, entries)
        assert len(claims[0].suggested_sources) == 1
        assert claims[0].suggested_sources[0].id == "nash"


class TestRenderWithSuggestions:
    def test_renders_auto_suggestion(self):
        claim = ss.ClaimEntry(
            number=1, beat_number=1, beat_title="OPEN",
            timecode_sec=45, claim_text="Nash read the results.",
            word_offset=10,
            suggested_sources=[
                ss.SuggestedSource(
                    id="nash-1950", title="Equilibrium Points",
                    author="John Nash", year=1950,
                    url="https://example.com/nash",
                    match_reason="author 'Nash' in claim",
                ),
            ],
        )
        report = ss.SourceSheetReport(
            slug="x", episode_title="X", script_path="/tmp/s.md",
            manifest_path="/tmp/m.json", total_claims=1, claims=[claim],
        )
        out = ss.render_source_sheet_md(report)
        # Auto-suggested section instead of fill-in placeholder
        assert "auto-suggested" in out
        assert "John Nash" in out
        assert "Equilibrium Points" in out
        assert "1950" in out
        assert "https://example.com/nash" in out
        # The plain placeholder should NOT appear for this claim
        assert "[Fill in from the research brief" not in out

    def test_renders_placeholder_when_no_suggestion(self):
        claim = ss.ClaimEntry(
            number=1, beat_number=1, beat_title="x",
            timecode_sec=0, claim_text="x", word_offset=0,
        )
        report = ss.SourceSheetReport(
            slug="x", episode_title="X", script_path="/tmp/s.md",
            manifest_path="/tmp/m.json", total_claims=1, claims=[claim],
        )
        out = ss.render_source_sheet_md(report)
        assert "[Fill in" in out


class TestCliSmoke:
    def test_missing_script_exits_2(self):
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "sourcing" / "source_sheet.py"),
             "definitely-no-such-slug", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 2

    def test_synthetic_script(self, tmp_path):
        script = tmp_path / "script.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — Test

            | NARRATION | VISUAL |
            |-----------|--------|
            | A claim. {✅} | [x] |
            | Another claim. {✅} | [x] |
        """), encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "sourcing" / "source_sheet.py"),
             "x", "--script", str(script), "--json", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert payload["total_claims"] == 2

    def test_no_claims_exits_1(self, tmp_path):
        script = tmp_path / "script.md"
        script.write_text("## BEAT 1\n\n| NARRATION | VISUAL |\n|---|---|\n| no tags | [x] |\n",
                          encoding="utf-8")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "sourcing" / "source_sheet.py"),
             "x", "--script", str(script), "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 1

    def test_no_suggest_flag_skips_lookup(self, tmp_path):
        script = tmp_path / "script.md"
        script.write_text(textwrap.dedent("""\
            ## BEAT 1 — Test

            | NARRATION | VISUAL |
            |-----------|--------|
            | John Nash protested the experiment. {✅} | [x] |
        """), encoding="utf-8")
        registry = tmp_path / "concepts.json"
        registry.write_text(json.dumps({
            "concepts": [_source_entry("nash", "Equilibrium", "John Nash")],
        }), encoding="utf-8")
        # WITH suggestion: should match Nash
        result_with = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "sourcing" / "source_sheet.py"),
             "x", "--script", str(script), "--registry", str(registry),
             "--json", "--stdout"],
            capture_output=True, text=True,
        )
        payload_with = json.loads(result_with.stdout)
        assert len(payload_with["claims"][0]["suggested_sources"]) == 1
        # WITHOUT suggestion: empty
        result_without = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "sourcing" / "source_sheet.py"),
             "x", "--script", str(script), "--registry", str(registry),
             "--no-suggest", "--json", "--stdout"],
            capture_output=True, text=True,
        )
        payload_without = json.loads(result_without.stdout)
        assert payload_without["claims"][0]["suggested_sources"] == []

    def test_real_prisoners_dilemma(self):
        # Real launch-candidate script should yield > 5 claims
        script_dir = REPO_ROOT / "episodes" / "prisoners-dilemma"
        if not (
            (script_dir / "script-production.md").is_file()
            or list(script_dir.glob("script-v*-production.md"))
        ):
            pytest.skip("prisoners-dilemma script not present")
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "tools" / "sourcing" / "source_sheet.py"),
             "prisoners-dilemma", "--json", "--stdout"],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert payload["total_claims"] > 5
        # Beats are in script order
        for c in payload["claims"]:
            assert c["beat_number"] >= 1
            assert c["claim_text"]
