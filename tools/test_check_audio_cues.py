"""Tests for tools/check_audio_cues.py — cue sheet ↔ manifest cross-check."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_audio_cues as cac  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent


# ─── Cue sheet parsing ──────────────────────────────────────────────────────


class TestMusicMoodsInCueSheet:
    def test_extracts_canonical_moods_from_table(self):
        cue = """
## Layer 1: Music Bed Plan

| Section | Timecode | Mood | Notes |
|---------|----------|------|-------|
| open | 0:00 | contemplative | sparse |
| beat1 | 0:45 | analytical | pads |
| beat3 | 7:30 | tension | rising |

## Layer 2
"""
        moods = cac.music_moods_in_cue_sheet(cue)
        assert dict(moods) == {"contemplative": 1, "analytical": 1, "tension": 1}

    def test_handles_alternate_heading_order(self):
        # `## Music Bed Plan (Layer 1)` form, not `## Layer 1: Music Bed Plan`.
        cue = """
## Music Bed Plan (Layer 1)

| Track | Mood | Vol |
|-------|------|-----|
| a | contemplative | 0.1 |

## Transition SFX (Layer 2)
"""
        moods = cac.music_moods_in_cue_sheet(cue)
        assert dict(moods) == {"contemplative": 1}

    def test_splits_combined_moods(self):
        # Cue sheets use "contemplative → building" or "tension → resolution".
        cue = """
## Layer 1: Music Bed

| Section | Mood | Notes |
|---------|------|-------|
| open | contemplative → building | sparse |
| close | tension → resolution | landing |

## Layer 2
"""
        moods = cac.music_moods_in_cue_sheet(cue)
        # contemplative and tension and resolution all appear; "building" is not canonical
        assert set(moods.keys()) >= {"contemplative", "tension", "resolution"}

    def test_skips_non_canonical_words(self):
        cue = """
## Layer 1

| Section | Mood |
|---------|------|
| open | atmospheric |   # not in canonical set

## Layer 2
"""
        moods = cac.music_moods_in_cue_sheet(cue)
        assert moods == {}

    def test_returns_empty_when_section_missing(self):
        cue = "# Header\n\n(no Layer 1 section at all)\n"
        assert cac.music_moods_in_cue_sheet(cue) == {}


class TestSfxCueTypesInCueSheet:
    def test_extracts_backtick_tokens(self):
        cue = "When the chart lands, fire `stat-reveal`. For sections, `section-open`."
        tokens = cac.sfx_cue_types_in_cue_sheet(cue)
        assert "stat-reveal" in tokens
        assert "section-open" in tokens

    def test_does_not_treat_non_kebab_tokens_as_cues(self):
        cue = "`README` and `file.json` aren't SFX cues."
        tokens = cac.sfx_cue_types_in_cue_sheet(cue)
        # `file.json` shouldn't match the [a-z0-9-]+ pattern (dot is excluded)
        # `README` is uppercase and shouldn't match either
        assert "file.json" not in tokens
        assert "readme" not in tokens


class TestMusicTrackCount:
    def test_counts_table_rows(self):
        cue = """
## Layer 1: Music Bed

| Section | Mood | Notes |
|---------|------|-------|
| a | analytical | x |
| b | tension | y |

## Layer 2
"""
        assert cac.music_track_count(cue) == 2

    def test_returns_zero_when_no_section(self):
        assert cac.music_track_count("# nothing here") == 0


# ─── Cross-check ────────────────────────────────────────────────────────────


class TestCrossCheckSynthetic:
    def _build(self, tmp_path: Path, cue_text: str | None, manifest_json: dict | None):
        episodes = tmp_path / "episodes"
        manifests = tmp_path / "remotion-templates" / "data" / "episodes"
        (episodes / "demo").mkdir(parents=True)
        (manifests / "demo").mkdir(parents=True)
        if cue_text is not None:
            (episodes / "demo" / "audio-cue-sheet.md").write_text(cue_text)
        if manifest_json is not None:
            (manifests / "demo" / "assembly-manifest.json").write_text(json.dumps(manifest_json))
        self._ep = episodes
        self._man = manifests

    def test_clean_match(self, tmp_path, monkeypatch):
        self._build(
            tmp_path,
            cue_text="""
## Layer 1: Music Bed

| Section | Mood | Notes |
|---------|------|-------|
| a | analytical | x |
| b | contemplative | y |

## Layer 2
""",
            manifest_json={
                "musicBed": {"tracks": [
                    {"id": "t1", "mood": "analytical"},
                    {"id": "t2", "mood": "contemplative"},
                ]},
                "segments": [],
            },
        )
        monkeypatch.setattr(cac, "EPISODES_ROOT", self._ep)
        monkeypatch.setattr(cac, "MANIFEST_ROOT", self._man)
        report = cac.cross_check("demo")
        assert report.cue_only_moods == set()
        assert report.manifest_only_moods == set()
        assert not report.has_findings

    def test_cue_only_mood_reported(self, tmp_path, monkeypatch):
        self._build(
            tmp_path,
            cue_text="""
## Layer 1: Music Bed

| Section | Mood | Notes |
|---------|------|-------|
| a | analytical | x |
| b | tension | y |

## Layer 2
""",
            manifest_json={"musicBed": {"tracks": [{"id": "t1", "mood": "analytical"}]}, "segments": []},
        )
        monkeypatch.setattr(cac, "EPISODES_ROOT", self._ep)
        monkeypatch.setattr(cac, "MANIFEST_ROOT", self._man)
        report = cac.cross_check("demo")
        assert report.cue_only_moods == {"tension"}

    def test_manifest_only_mood_reported(self, tmp_path, monkeypatch):
        self._build(
            tmp_path,
            cue_text="""
## Layer 1: Music Bed

| Section | Mood | Notes |
|---------|------|-------|
| a | analytical | x |

## Layer 2
""",
            manifest_json={"musicBed": {"tracks": [
                {"id": "t1", "mood": "analytical"},
                {"id": "t2", "mood": "resolution"},
            ]}, "segments": []},
        )
        monkeypatch.setattr(cac, "EPISODES_ROOT", self._ep)
        monkeypatch.setattr(cac, "MANIFEST_ROOT", self._man)
        report = cac.cross_check("demo")
        assert report.manifest_only_moods == {"resolution"}

    def test_track_count_diff_flagged_above_one(self, tmp_path, monkeypatch):
        self._build(
            tmp_path,
            cue_text="""
## Layer 1: Music Bed

| Section | Mood | Notes |
|---------|------|-------|
| a | analytical | x |
| b | analytical | x |
| c | analytical | x |
| d | analytical | x |
| e | analytical | x |
""",
            manifest_json={"musicBed": {"tracks": [{"id": "t1", "mood": "analytical"}]}, "segments": []},
        )
        monkeypatch.setattr(cac, "EPISODES_ROOT", self._ep)
        monkeypatch.setattr(cac, "MANIFEST_ROOT", self._man)
        report = cac.cross_check("demo")
        # 5 cue rows vs 1 manifest track — diff of 4, flagged
        assert report.cue_track_rows == 5
        assert report.manifest_track_count == 1
        assert report.has_findings is True

    def test_canonical_texture_cue_not_flagged_as_unknown(self, tmp_path, monkeypatch):
        # Texture cues (bar-grow, dot-click, etc.) used to false-positive
        # under the SFX-only canonical set. Now they're accepted.
        self._build(
            tmp_path,
            cue_text="""
## Layer 1: Music Bed

| Section | Mood | Notes |
|---------|------|-------|
| a | analytical | x |

## Layer 2

For the chart, fire `bar-grow` and `dot-click`.
""",
            manifest_json={"musicBed": {"tracks": [{"id": "t1", "mood": "analytical"}]}, "segments": []},
        )
        monkeypatch.setattr(cac, "EPISODES_ROOT", self._ep)
        monkeypatch.setattr(cac, "MANIFEST_ROOT", self._man)
        report = cac.cross_check("demo")
        assert "bar-grow" not in report.sfx_unknown
        assert "dot-click" not in report.sfx_unknown

    def test_unknown_cue_shape_flagged(self, tmp_path, monkeypatch):
        self._build(
            tmp_path,
            cue_text="""
## Layer 1: Music Bed

| Section | Mood | Notes |
|---------|------|-------|
| a | analytical | x |

## Layer 2

Try a `mystery-reveal` cue.
""",
            manifest_json={"musicBed": {"tracks": [{"id": "t1", "mood": "analytical"}]}, "segments": []},
        )
        monkeypatch.setattr(cac, "EPISODES_ROOT", self._ep)
        monkeypatch.setattr(cac, "MANIFEST_ROOT", self._man)
        report = cac.cross_check("demo")
        assert "mystery-reveal" in report.sfx_unknown

    def test_missing_manifest_yields_hard_error(self, tmp_path, monkeypatch):
        self._build(
            tmp_path,
            cue_text="## Layer 1: Music Bed\n\n| Section | Mood | Notes |\n|---|---|---|\n| a | analytical | x |\n",
            manifest_json=None,
        )
        monkeypatch.setattr(cac, "EPISODES_ROOT", self._ep)
        monkeypatch.setattr(cac, "MANIFEST_ROOT", self._man)
        report = cac.cross_check("demo")
        assert any("manifest missing" in e for e in report.errors)


class TestRealEpisodes:
    @pytest.mark.parametrize("slug", ["silicon-trap", "prisoners-dilemma"])
    def test_runs_cleanly_no_hard_errors(self, slug):
        report = cac.cross_check(slug)
        assert report.errors == []
        # Both episodes legitimately have findings (planning vs render-time
        # drift) — we just assert the tool ran without crashing.
        assert isinstance(report.cue_only_moods, set)
