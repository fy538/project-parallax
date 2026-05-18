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
