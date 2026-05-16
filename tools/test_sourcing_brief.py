"""Tests for tools/sourcing_brief.py — manifest + shot-list → sourcing brief."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sourcing_brief as sb  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPT_PATH = REPO_ROOT / "tools" / "sourcing_brief.py"


# ─── URL building ──────────────────────────────────────────────────────────


class TestBuildSearchURL:
    def test_pexels_video_search(self):
        url = sb.build_search_url("pexels", "TSMC Arizona aerial")
        assert url == "https://www.pexels.com/search/videos/TSMC+Arizona+aerial/"

    def test_pixabay_video_search(self):
        url = sb.build_search_url("pixabay", "chip factory")
        assert url == "https://pixabay.com/videos/search/chip+factory/"

    def test_wikimedia_namespace_filter(self):
        url = sb.build_search_url("wikimedia", "Pearl Harbor")
        assert "srnamespace=6" in url
        assert "Pearl+Harbor" in url

    def test_archive_search(self):
        url = sb.build_search_url("archive", "RAND memo 1950")
        assert url.startswith("https://archive.org/search?")

    def test_case_insensitive_platform_match(self):
        assert sb.build_search_url("PEXELS", "x") == sb.build_search_url("pexels", "x")

    def test_unknown_platform_returns_none(self):
        # local-aigen is already-sourced; no external URL applies
        assert sb.build_search_url("local-aigen", "any query") is None
        assert sb.build_search_url("totally-unknown-platform", "x") is None

    def test_none_or_empty_platform(self):
        assert sb.build_search_url(None, "x") is None
        assert sb.build_search_url("", "x") is None

    def test_query_special_chars_encoded(self):
        url = sb.build_search_url("pexels", "chips & wafers / 50%")
        # & / % must be url-encoded
        assert "&amp;" not in url  # not HTML entity
        assert "%26" in url  # & is %26
        assert "%2F" in url  # / is %2F
        assert "%25" in url  # % is %25


# ─── Status normalization ──────────────────────────────────────────────────


class TestNormaliseStatus:
    @pytest.mark.parametrize("raw,expected", [
        (None, "pending"),
        ("", "pending"),
        ("pending", "pending"),
        ("Pending", "pending"),
        ("RESOLVED", "resolved"),
        ("failed", "failed"),
        ("sourced", "resolved"),       # legacy synonym
        ("something-else", "something-else"),  # unknowns pass through (informational)
    ])
    def test_status_mapping(self, raw, expected):
        assert sb.normalise_status(raw) == expected


# ─── Beat ID extraction ────────────────────────────────────────────────────


class TestBeatIdForSegment:
    def test_explicit_beat_field(self):
        assert sb.beat_id_for_segment({"beat": "beat3"}) == "beat3"

    def test_prefix_fallback(self):
        assert sb.beat_id_for_segment({"id": "beat2-seg17"}) == "beat2"

    def test_unknown(self):
        assert sb.beat_id_for_segment({"id": "weird"}) == "unknown"
        assert sb.beat_id_for_segment({}) == "unknown"


# ─── build_brief — end-to-end with synthetic episode ───────────────────────


def _synth_episode(tmp_path: Path, slug: str = "demo") -> Path:
    """Build a synthetic episode tree with manifest + shot-list. Returns the
    manifest path."""
    episodes_root = tmp_path / "episodes" / slug
    manifest_root = tmp_path / "remotion-templates" / "data" / "episodes" / slug
    episodes_root.mkdir(parents=True)
    manifest_root.mkdir(parents=True)

    shot_list = {
        "episode": slug,
        "assets": [
            {
                "id": "beat1-foo",
                "priority": "P1",
                "type": "video",
                "search_terms": ["alpha", "beta"],
                "treatment": "standard",
                "notes": "foo notes",
            },
            {
                "id": "beat2-bar",
                "priority": "P2",
                "type": "photo",
                "search_terms": ["gamma"],
                "treatment": "conflict",
                "notes": "bar notes",
            },
        ],
    }
    (episodes_root / "shot-list.json").write_text(json.dumps(shot_list))

    manifest = {
        "version": "1.0",
        "episode": slug,
        "fps": 30,
        "narration": {"totalDurationSec": 60},
        "segments": [
            {
                "id": "beat1-seg01",
                "type": "FOOTAGE",
                "startSec": 0,
                "endSec": 6,
                "beat": "beat1",
                "asset": {
                    "shotListId": "beat1-foo",
                    "source": "pexels",
                    "searchTerms": ["alpha-from-manifest"],
                    "status": "pending",
                    "file": None,
                },
            },
            {
                "id": "beat1-seg01-hold",
                "type": "FOOTAGE",
                "startSec": 6,
                "endSec": 9,
                "beat": "beat1",
                "asset": {
                    "shotListId": "beat1-foo",  # same shot — should aggregate
                    "source": "pexels",
                    "status": "pending",
                },
            },
            {
                "id": "beat2-seg01",
                "type": "FOOTAGE",
                "startSec": 9,
                "endSec": 14,
                "beat": "beat2",
                "asset": {
                    "shotListId": "beat2-bar",
                    "source": "pexels",
                    "status": "resolved",
                    "file": "clips/beat2-bar.mp4",
                },
            },
            {
                "id": "beat3-seg01",
                "type": "FOOTAGE",
                "startSec": 14,
                "endSec": 18,
                "beat": "beat3",
                "asset": {
                    "shotListId": "beat3-missing-from-shotlist",
                    "source": "wikimedia",
                    "searchTerms": ["delta"],
                    "status": "pending",
                },
            },
            {
                "id": "beat3-template",
                "type": "TEMPLATE",
                "startSec": 18,
                "endSec": 20,
                "template": {"component": "KineticTypography", "dataFile": "x.json"},
                # No asset → should be skipped
            },
        ],
    }
    (manifest_root / "assembly-manifest.json").write_text(json.dumps(manifest))
    return manifest_root / "assembly-manifest.json"


class TestBuildBrief:
    def test_groups_by_shotlist_id_aggregating_segments(self, tmp_path, monkeypatch):
        _synth_episode(tmp_path)
        monkeypatch.setattr(sb, "MANIFEST_ROOT", tmp_path / "remotion-templates" / "data" / "episodes")
        monkeypatch.setattr(sb, "EPISODES_ROOT", tmp_path / "episodes")
        brief = sb.build_brief("demo")
        # Three distinct shotListIds: beat1-foo (2 segments), beat2-bar, beat3-missing
        assert len(brief.assets) == 3
        foo = next(a for a in brief.assets if a.shot_list_id == "beat1-foo")
        # Aggregated duration: 6 + 3 = 9
        assert foo.duration_sec == 9.0
        # Both segment IDs collected
        assert "beat1-seg01" in foo.segment_ids
        assert "beat1-seg01-hold" in foo.segment_ids

    def test_skips_segments_without_assets(self, tmp_path, monkeypatch):
        _synth_episode(tmp_path)
        monkeypatch.setattr(sb, "MANIFEST_ROOT", tmp_path / "remotion-templates" / "data" / "episodes")
        monkeypatch.setattr(sb, "EPISODES_ROOT", tmp_path / "episodes")
        brief = sb.build_brief("demo")
        ids = {a.shot_list_id for a in brief.assets}
        # TEMPLATE segment had no asset — not in brief
        assert "beat3-template" not in ids

    def test_prefers_shotlist_searchterms_over_manifest(self, tmp_path, monkeypatch):
        """Shot list is the canonical sourcing-time spec; manifest is a
        copy that may be stale. Brief should use shot-list terms when
        available."""
        _synth_episode(tmp_path)
        monkeypatch.setattr(sb, "MANIFEST_ROOT", tmp_path / "remotion-templates" / "data" / "episodes")
        monkeypatch.setattr(sb, "EPISODES_ROOT", tmp_path / "episodes")
        brief = sb.build_brief("demo")
        foo = next(a for a in brief.assets if a.shot_list_id == "beat1-foo")
        # Shot-list had ["alpha", "beta"]; manifest had ["alpha-from-manifest"].
        # Shot-list wins.
        assert foo.search_terms == ["alpha", "beta"]

    def test_falls_back_to_manifest_terms_when_not_in_shotlist(self, tmp_path, monkeypatch):
        _synth_episode(tmp_path)
        monkeypatch.setattr(sb, "MANIFEST_ROOT", tmp_path / "remotion-templates" / "data" / "episodes")
        monkeypatch.setattr(sb, "EPISODES_ROOT", tmp_path / "episodes")
        brief = sb.build_brief("demo")
        ghost = next(a for a in brief.assets if a.shot_list_id == "beat3-missing-from-shotlist")
        assert ghost.search_terms == ["delta"]
        assert ghost.in_shot_list is False

    def test_status_resolved_passes_through(self, tmp_path, monkeypatch):
        _synth_episode(tmp_path)
        monkeypatch.setattr(sb, "MANIFEST_ROOT", tmp_path / "remotion-templates" / "data" / "episodes")
        monkeypatch.setattr(sb, "EPISODES_ROOT", tmp_path / "episodes")
        brief = sb.build_brief("demo")
        bar = next(a for a in brief.assets if a.shot_list_id == "beat2-bar")
        assert bar.status == "resolved"
        assert bar.file == "clips/beat2-bar.mp4"

    def test_missing_shotlist_still_builds_brief(self, tmp_path, monkeypatch):
        _synth_episode(tmp_path)
        # Remove shot list
        (tmp_path / "episodes" / "demo" / "shot-list.json").unlink()
        monkeypatch.setattr(sb, "MANIFEST_ROOT", tmp_path / "remotion-templates" / "data" / "episodes")
        monkeypatch.setattr(sb, "EPISODES_ROOT", tmp_path / "episodes")
        brief = sb.build_brief("demo")
        # All assets present, but in_shot_list false for everyone
        assert len(brief.assets) == 3
        assert all(not a.in_shot_list for a in brief.assets)
        assert brief.shot_list_path is None


# ─── Filters ───────────────────────────────────────────────────────────────


class TestFilterAssets:
    def _make_brief(self) -> sb.Brief:
        brief = sb.Brief(
            episode="demo",
            generated_at="2026-01-01",
            manifest_path=Path("/tmp/m.json"),
            shot_list_path=None,
            assets=[
                sb.AssetEntry(
                    shot_list_id="a", priority="P1", medium="video",
                    segment_type="FOOTAGE", source="pexels", status="pending",
                    search_terms=[], treatment="standard", notes="",
                    duration_sec=5.0, segment_ids=["s1"], beat="beat1",
                    file=None, in_shot_list=True,
                ),
                sb.AssetEntry(
                    shot_list_id="b", priority="P2", medium="photo",
                    segment_type="FOOTAGE", source="pexels", status="resolved",
                    search_terms=[], treatment="standard", notes="",
                    duration_sec=5.0, segment_ids=["s2"], beat="beat1",
                    file="x.mp4", in_shot_list=True,
                ),
                sb.AssetEntry(
                    shot_list_id="c", priority="P1", medium="video",
                    segment_type="AI_GEN", source="wikimedia", status="pending",
                    search_terms=[], treatment="conflict", notes="",
                    duration_sec=5.0, segment_ids=["s3"], beat="beat2",
                    file=None, in_shot_list=True,
                ),
            ],
        )
        return brief

    def test_pending_only(self):
        brief = self._make_brief()
        out = sb.filter_assets(brief, pending_only=True)
        assert {a.shot_list_id for a in out} == {"a", "c"}

    def test_priority_filter(self):
        brief = self._make_brief()
        out = sb.filter_assets(brief, priority="P1")
        assert {a.shot_list_id for a in out} == {"a", "c"}

    def test_source_filter(self):
        brief = self._make_brief()
        out = sb.filter_assets(brief, source="wikimedia")
        assert {a.shot_list_id for a in out} == {"c"}

    def test_segment_type_filter(self):
        brief = self._make_brief()
        out = sb.filter_assets(brief, segment_type="AI_GEN")
        assert {a.shot_list_id for a in out} == {"c"}

    def test_combined_filters_apply_all(self):
        brief = self._make_brief()
        out = sb.filter_assets(brief, priority="P1", source="pexels", pending_only=True)
        assert {a.shot_list_id for a in out} == {"a"}


# ─── Rendering shape ───────────────────────────────────────────────────────


class TestMarkdownRender:
    def test_has_expected_sections(self, tmp_path, monkeypatch):
        _synth_episode(tmp_path)
        monkeypatch.setattr(sb, "MANIFEST_ROOT", tmp_path / "remotion-templates" / "data" / "episodes")
        monkeypatch.setattr(sb, "EPISODES_ROOT", tmp_path / "episodes")
        brief = sb.build_brief("demo")
        text = sb.render_markdown(brief, brief.assets)
        assert "# Sourcing Brief — `demo`" in text
        assert "## beat1" in text  # group header
        assert "## beat2" in text
        assert "## beat3" in text
        assert "`beat1-foo`" in text
        assert "https://www.pexels.com/search/videos/" in text  # URLs rendered
        assert "⚠️" in text  # warning for the missing-from-shotlist entry

    def test_status_badge_present(self, tmp_path, monkeypatch):
        _synth_episode(tmp_path)
        monkeypatch.setattr(sb, "MANIFEST_ROOT", tmp_path / "remotion-templates" / "data" / "episodes")
        monkeypatch.setattr(sb, "EPISODES_ROOT", tmp_path / "episodes")
        brief = sb.build_brief("demo")
        text = sb.render_markdown(brief, brief.assets)
        assert "⏳ pending" in text
        assert "✅ resolved" in text


class TestCSVRender:
    def test_csv_has_header(self, tmp_path, monkeypatch):
        _synth_episode(tmp_path)
        monkeypatch.setattr(sb, "MANIFEST_ROOT", tmp_path / "remotion-templates" / "data" / "episodes")
        monkeypatch.setattr(sb, "EPISODES_ROOT", tmp_path / "episodes")
        brief = sb.build_brief("demo")
        text = sb.render_csv(brief, brief.assets)
        first_line = text.split("\n")[0]
        assert first_line.startswith("beat,shot_list_id,priority")
        assert "url_5" in first_line  # 5 term/url columns

    def test_csv_row_count_matches_assets(self, tmp_path, monkeypatch):
        _synth_episode(tmp_path)
        monkeypatch.setattr(sb, "MANIFEST_ROOT", tmp_path / "remotion-templates" / "data" / "episodes")
        monkeypatch.setattr(sb, "EPISODES_ROOT", tmp_path / "episodes")
        brief = sb.build_brief("demo")
        text = sb.render_csv(brief, brief.assets)
        lines = [ln for ln in text.split("\n") if ln.strip()]
        # 1 header + N rows
        assert len(lines) == 1 + len(brief.assets)


# ─── CLI smoke ─────────────────────────────────────────────────────────────


class TestCLI:
    def test_list_includes_known_episode(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--list"],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 0
        assert "silicon-trap" in result.stdout

    def test_unknown_episode_exits_2(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "nonsense-episode-xyz"],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 2

    def test_no_args_exits_2(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH)],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 2

    def test_real_episode_silicon_trap(self):
        """Real-data smoke: silicon-trap brief generates without crashing."""
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "silicon-trap", "--pending-only"],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 0
        assert "Sourcing Brief" in result.stdout
        assert "beat1" in result.stdout
        # Should have non-trivial number of pending FOOTAGE entries
        assert "⏳ pending" in result.stdout
