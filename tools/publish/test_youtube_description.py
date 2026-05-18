"""
Unit tests for tools/publish/youtube_description.py.

Covers:
  · _fmt_timestamp (M:SS / MM:SS / H:MM:SS)
  · _clean_chapter_title (strips BEAT prefix, ALL-CAPS → Title Case, truncates)
  · build_chapters (intro injection, first-chapter-zero invariant)
  · load_concepts + find_episode_concepts (introduced / appears / none)
  · count_source_tags
  · build_description (end-to-end against synthetic manifest)
  · render_description (chapters / concepts / sources / footer)
  · CLI smoke (missing manifest, valid synthetic, --no-intro)
  · Real silicon-trap manifest smoke
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(Path(__file__).resolve().parent))
import youtube_description as yd  # type: ignore[import-not-found]


# ── _fmt_timestamp ──────────────────────────────────────────────────────────


class TestFmtTimestamp:
    def test_zero(self):
        assert yd._fmt_timestamp(0) == "0:00"

    def test_seconds_only(self):
        assert yd._fmt_timestamp(45) == "0:45"

    def test_minute_seconds(self):
        assert yd._fmt_timestamp(125) == "2:05"

    def test_hour_pad(self):
        # 1h 5m 7s
        assert yd._fmt_timestamp(3907) == "1:05:07"

    def test_rounds(self):
        assert yd._fmt_timestamp(125.6) == "2:06"


# ── _clean_chapter_title ────────────────────────────────────────────────────


class TestCleanChapterTitle:
    def test_strips_beat_prefix(self):
        assert yd._clean_chapter_title("Beat 1 — THE PARADOX") == "The Paradox"

    def test_strips_beat_colon(self):
        assert yd._clean_chapter_title("Beat 2: THE WRONG GAME") == "The Wrong Game"

    def test_all_caps_to_title(self):
        assert yd._clean_chapter_title("THE PARADOX") == "The Paradox"

    def test_truncates_long(self):
        long = "X" * 100
        out = yd._clean_chapter_title(long)
        assert len(out) <= yd.CHAPTER_TITLE_MAX_LEN
        assert out.endswith("…")

    def test_preserves_short_title_case(self):
        assert yd._clean_chapter_title("The Paradox") == "The Paradox"

    def test_preserves_acronyms_in_title_case(self):
        # ALL-CAPS title with embedded acronyms — acronyms stay upper,
        # rest gets title-cased. Pre-fix: "Wto", "Tsmc" mangling.
        assert yd._clean_chapter_title("THE WTO TRAP") == "The WTO Trap"
        assert yd._clean_chapter_title("TSMC AND CHIPS") == "TSMC And Chips"
        assert yd._clean_chapter_title("US VS CHINA") == "US Vs China"

    def test_acronym_case_insensitive_match(self):
        # Input is ALL-CAPS, our acronym set is also upper — match works
        assert yd._clean_chapter_title("USA FIRST") == "USA First"


# ── build_chapters ──────────────────────────────────────────────────────────


class TestBuildChapters:
    def _make_manifest(self, beats):
        return {"beats": beats}

    def test_injects_intro_when_first_beat_not_at_zero(self):
        m = self._make_manifest([
            {"id": "beat1", "title": "OPEN", "startSec": 15.0, "endSec": 100},
            {"id": "beat2", "title": "MID", "startSec": 100, "endSec": 200},
        ])
        chapters = yd.build_chapters(m, include_intro=True)
        assert chapters[0].timestamp == "0:00"
        assert chapters[0].title == "Intro"
        assert chapters[1].title == "Open"

    def test_first_beat_at_zero_no_intro_needed(self):
        m = self._make_manifest([
            {"id": "beat1", "title": "OPEN", "startSec": 0.0, "endSec": 100},
            {"id": "beat2", "title": "MID", "startSec": 100, "endSec": 200},
        ])
        chapters = yd.build_chapters(m, include_intro=True)
        assert chapters[0].timestamp == "0:00"
        assert chapters[0].title == "Open"  # no synthetic Intro prepended

    def test_no_intro_flag_skips_injection(self):
        m = self._make_manifest([
            {"id": "beat1", "title": "OPEN", "startSec": 15.0, "endSec": 100},
        ])
        chapters = yd.build_chapters(m, include_intro=False)
        # Should snap the first beat to 0:00 to satisfy the YouTube invariant
        assert chapters[0].timestamp == "0:00"

    def test_empty_manifest(self):
        assert yd.build_chapters(self._make_manifest([])) == []

    def test_chapter_count(self):
        m = self._make_manifest([
            {"id": "beat1", "title": "OPEN", "startSec": 0, "endSec": 60},
            {"id": "beat2", "title": "MID", "startSec": 60, "endSec": 120},
            {"id": "beat3", "title": "END", "startSec": 120, "endSec": 180},
        ])
        chapters = yd.build_chapters(m)
        assert len(chapters) == 3

    def test_dedups_duplicate_timestamps(self):
        # Two beats at the same startSec would silently disable YouTube
        # chapter UI; the dedup keeps the first and skips the second.
        m = self._make_manifest([
            {"id": "beat1", "title": "OPEN", "startSec": 0, "endSec": 60},
            {"id": "beat2", "title": "MID", "startSec": 60, "endSec": 120},
            {"id": "beat3", "title": "DUPLICATE", "startSec": 60, "endSec": 120},
        ])
        chapters = yd.build_chapters(m)
        # Only 2 chapters land — beat3 is deduped
        assert len(chapters) == 2
        assert chapters[1].title == "Mid"  # the FIRST 1:00 beat wins

    def test_missing_title_falls_back_to_chapter_n(self):
        # Beat with no title — should not produce "beat3" literal
        m = self._make_manifest([
            {"id": "beat1", "title": "OPEN", "startSec": 0, "endSec": 60},
            {"id": "beat2", "startSec": 60, "endSec": 120},  # no title
        ])
        chapters = yd.build_chapters(m)
        assert chapters[1].title.startswith("Chapter ")


# ── load_concepts + find_episode_concepts ──────────────────────────────────


class TestConceptLookup:
    def test_load_concepts_missing_file(self, tmp_path):
        assert yd.load_concepts(tmp_path / "no-such.json") == []

    def test_load_concepts_malformed_returns_empty(self, tmp_path):
        bad = tmp_path / "bad.json"
        bad.write_text("not json", encoding="utf-8")
        assert yd.load_concepts(bad) == []

    def test_find_introduced_concepts(self):
        concepts = [
            {
                "id": "ka-bozi",
                "term": {"en": "stranglehold technology"},
                "introduced": {"episode": "silicon-trap"},
                "appearances": [],
            },
        ]
        out = yd.find_episode_concepts("silicon-trap", concepts)
        assert len(out) == 1
        assert out[0].is_introduction is True
        assert out[0].introduced_in == "silicon-trap"

    def test_find_callback_concepts(self):
        concepts = [
            {
                "id": "ka-bozi",
                "term": {"en": "stranglehold technology"},
                "introduced": {"episode": "silicon-trap"},
                "appearances": [{"episode": "blockades-leak"}],
            },
        ]
        out = yd.find_episode_concepts("blockades-leak", concepts)
        assert len(out) == 1
        assert out[0].is_introduction is False
        assert out[0].introduced_in == "silicon-trap"

    def test_no_concepts_for_unknown_episode(self):
        concepts = [
            {
                "id": "x",
                "term": {"en": "x"},
                "introduced": {"episode": "other"},
                "appearances": [],
            }
        ]
        assert yd.find_episode_concepts("unknown", concepts) == []

    def test_concept_without_term_skipped(self):
        concepts = [
            {"id": "x", "introduced": {"episode": "y"}, "appearances": []},
        ]
        # No term.en or fallback id mechanism — but our impl falls back
        # to id, so this DOES register. Document the behavior.
        out = yd.find_episode_concepts("y", concepts)
        assert len(out) == 1
        assert out[0].term == "x"


# ── count_source_tags ──────────────────────────────────────────────────────


class TestCountSourceTags:
    def test_counts_tags(self, tmp_path):
        script = tmp_path / "s.md"
        script.write_text("alpha {✅} beta {✅} gamma {⚠️}", encoding="utf-8")
        # Only {✅} counts
        assert yd.count_source_tags(script) == 2

    def test_missing_file_zero(self, tmp_path):
        assert yd.count_source_tags(tmp_path / "no-such.md") == 0


# ── build_description ──────────────────────────────────────────────────────


class TestBuildDescription:
    def test_e2e_synthetic(self, tmp_path):
        manifest = tmp_path / "manifest.json"
        manifest.write_text(json.dumps({
            "episode": "test", "title": "Test Episode",
            "totalDurationSec": 180.0,
            "beats": [
                {"id": "beat1", "title": "OPEN", "startSec": 0, "endSec": 60},
                {"id": "beat2", "title": "MID", "startSec": 60, "endSec": 120},
                {"id": "beat3", "title": "END", "startSec": 120, "endSec": 180},
            ],
        }), encoding="utf-8")
        # Empty concepts file
        concepts = tmp_path / "concepts.json"
        concepts.write_text(json.dumps({"concepts": []}), encoding="utf-8")
        payload = yd.build_description(
            "test", manifest, concepts_path=concepts,
        )
        assert payload.episode_title == "Test Episode"
        assert payload.total_duration_sec == 180.0
        assert len(payload.chapters) == 3
        assert payload.concepts == []
        assert payload.source_tag_count == 0


# ── render_description ─────────────────────────────────────────────────────


class TestRenderDescription:
    def _make_payload(self, chapters=None, concepts=None, source_count=0):
        return yd.DescriptionPayload(
            slug="x", episode_title="X", total_duration_sec=180.0,
            chapters=chapters or [], concepts=concepts or [],
            source_tag_count=source_count,
        )

    def test_includes_hook_placeholder(self):
        out = yd.render_description(self._make_payload())
        assert "[HOOK:" in out
        assert "[SUMMARY:" in out

    def test_renders_chapters_section(self):
        chapters = [
            yd.Chapter(timestamp="0:00", title="Intro", start_sec=0),
            yd.Chapter(timestamp="1:30", title="Body", start_sec=90),
            yd.Chapter(timestamp="3:00", title="End", start_sec=180),
        ]
        out = yd.render_description(self._make_payload(chapters=chapters))
        assert "📺 Chapters:" in out
        assert "0:00 Intro" in out
        assert "1:30 Body" in out

    def test_renders_concepts_section(self):
        concepts = [
            yd.ConceptCallback(term="The Wrong Game", introduced_in="x", is_introduction=True),
            yd.ConceptCallback(term="ka-bozi", introduced_in="silicon-trap", is_introduction=False),
        ]
        out = yd.render_description(self._make_payload(concepts=concepts))
        assert "Concepts introduced" in out
        assert "The Wrong Game" in out
        assert "Callbacks to earlier" in out
        assert "ka-bozi" in out
        assert "silicon-trap" in out

    def test_caps_concepts_at_max_displayed(self):
        # If an episode introduces > MAX_CONCEPTS_DISPLAYED concepts,
        # the renderer truncates with an "...and N more" footer.
        intros = [
            yd.ConceptCallback(
                term=f"concept-{i}", introduced_in="x", is_introduction=True,
            )
            for i in range(yd.MAX_CONCEPTS_DISPLAYED + 5)
        ]
        out = yd.render_description(self._make_payload(concepts=intros))
        # The "and 5 more" footer appears
        assert "and 5 more" in out
        # First MAX are listed, the rest aren't
        assert "concept-0" in out
        last_displayed = yd.MAX_CONCEPTS_DISPLAYED - 1
        assert f"concept-{last_displayed}" in out
        assert f"concept-{last_displayed + 1}" not in out

    def test_renders_sources_when_tags_present(self):
        out = yd.render_description(self._make_payload(source_count=12))
        assert "📖 Sources:" in out
        assert "12 verified-claim" in out

    def test_no_sources_section_when_no_tags(self):
        out = yd.render_description(self._make_payload(source_count=0))
        assert "📖 Sources:" not in out

    def test_includes_channel_footer(self):
        out = yd.render_description(self._make_payload())
        assert "Parallax" in out
        assert "Subscribe" in out


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_missing_manifest_exits_2(self):
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "publish" / "youtube_description.py"),
                "definitely-not-an-episode",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2

    def test_synthetic_manifest(self, tmp_path):
        manifest = tmp_path / "m.json"
        manifest.write_text(json.dumps({
            "title": "Test", "totalDurationSec": 180,
            "beats": [
                {"id": "beat1", "title": "OPEN", "startSec": 0, "endSec": 60},
                {"id": "beat2", "title": "MID", "startSec": 60, "endSec": 120},
                {"id": "beat3", "title": "END", "startSec": 120, "endSec": 180},
            ],
        }), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "publish" / "youtube_description.py"),
                "x", "--manifest", str(manifest), "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        # Standard sections present
        assert "📺 Chapters:" in result.stdout
        assert "0:00" in result.stdout
        assert "Parallax" in result.stdout  # footer

    def test_too_few_chapters_warns_exit_1(self, tmp_path):
        manifest = tmp_path / "m.json"
        manifest.write_text(json.dumps({
            "title": "Tiny", "totalDurationSec": 60,
            "beats": [
                {"id": "beat1", "title": "ONLY", "startSec": 0, "endSec": 60},
            ],
        }), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "publish" / "youtube_description.py"),
                "x", "--manifest", str(manifest), "--stdout",
            ],
            capture_output=True, text=True,
        )
        # Only 1 chapter — below the YouTube minimum of 3
        assert result.returncode == 1
        assert "YouTube requires" in result.stderr

    def test_real_silicon_trap_manifest(self):
        manifest = REPO_ROOT / "remotion-templates" / "data" / "episodes" \
            / "silicon-trap" / "assembly-manifest.json"
        if not manifest.is_file():
            pytest.skip("silicon-trap manifest not present")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "publish" / "youtube_description.py"),
                "silicon-trap", "--json", "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert payload["episode_title"] == "The Silicon Trap"
        # 5 beats + possibly an Intro = 5-6 chapters
        assert len(payload["chapters"]) >= 5
        # All chapter timestamps in M:SS / MM:SS format
        for c in payload["chapters"]:
            assert ":" in c["timestamp"]
