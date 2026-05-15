"""Tests for tools/check_script_manifest.py — script + shot-list ↔ manifest cross-check."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_script_manifest as csm  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent


# ─── Parsers ────────────────────────────────────────────────────────────────


class TestDatafileRefsInScript:
    def test_extracts_slug_prefixed_refs(self):
        text = "...as shown in [prisoners-dilemma/framework-foo.json] · 10s..."
        refs = csm.datafile_refs_in_script(text, "prisoners-dilemma")
        assert refs == {"framework-foo.json"}

    def test_ignores_other_slugs(self):
        text = "[silicon-trap/chart-x.json] [prisoners-dilemma/gameboard-y.json]"
        refs = csm.datafile_refs_in_script(text, "prisoners-dilemma")
        assert refs == {"gameboard-y.json"}

    def test_multiple_refs_dedup(self):
        text = "[ep/a.json] ... [ep/a.json] ... [ep/b.json]"
        refs = csm.datafile_refs_in_script(text, "ep")
        assert refs == {"a.json", "b.json"}

    def test_returns_empty_when_no_refs(self):
        assert csm.datafile_refs_in_script("plain prose with no refs", "ep") == set()


class TestShotIdsFromList:
    def test_extracts_from_assets_key(self):
        shot_list = {"assets": [{"id": "beat1-a"}, {"id": "beat2-b"}]}
        assert csm.shot_ids_from_list(shot_list) == {"beat1-a", "beat2-b"}

    def test_extracts_from_shots_key_alternate_shape(self):
        shot_list = {"shots": [{"id": "x"}]}
        assert csm.shot_ids_from_list(shot_list) == {"x"}

    def test_skips_items_without_id(self):
        shot_list = {"assets": [{"id": "a"}, {}]}
        assert csm.shot_ids_from_list(shot_list) == {"a"}


class TestManifestExtraction:
    def test_shotlist_ids_collected(self):
        manifest = {"segments": [
            {"asset": {"shotListId": "beat1-a"}},
            {"asset": {"shotListId": "beat2-b"}},
            {"asset": {}},  # missing shotListId — skip
            {},             # no asset at all — skip
        ]}
        assert csm.shotlist_ids_in_manifest(manifest) == {"beat1-a", "beat2-b"}

    def test_datafile_strips_slug_prefix(self):
        manifest = {"segments": [
            {"template": {"dataFile": "ep/foo.json"}},
            {"template": {"dataFile": "bar.json"}},  # bare; pass-through
        ]}
        assert csm.datafiles_in_manifest(manifest) == {"foo.json", "bar.json"}


# ─── End-to-end ─────────────────────────────────────────────────────────────


class TestCrossCheckSynthetic:
    def _build(self, tmp_path: Path) -> tuple[Path, Path]:
        episodes = tmp_path / "episodes"
        manifest_root = tmp_path / "remotion-templates" / "data" / "episodes"
        (episodes / "demo").mkdir(parents=True)
        (manifest_root / "demo").mkdir(parents=True)
        return episodes, manifest_root

    def test_clean_match_yields_no_orphans(self, tmp_path, monkeypatch):
        episodes, manifest_root = self._build(tmp_path)
        # Shot list with two assets
        (episodes / "demo" / "shot-list.json").write_text(json.dumps({
            "assets": [{"id": "a"}, {"id": "b"}],
        }))
        # Script references one data file
        (episodes / "demo" / "script-production.md").write_text(
            "intro text [demo/chart-1.json] more text"
        )
        # Manifest matches both
        (manifest_root / "demo" / "assembly-manifest.json").write_text(json.dumps({
            "segments": [
                {"asset": {"shotListId": "a"}},
                {"asset": {"shotListId": "b"}},
                {"template": {"dataFile": "chart-1.json"}},
            ],
        }))
        monkeypatch.setattr(csm, "EPISODES_ROOT", episodes)
        monkeypatch.setattr(csm, "MANIFEST_ROOT", manifest_root)
        report = csm.cross_check("demo")
        assert not report.has_orphans
        assert report.errors == []

    def test_shotlist_only_orphan_detected(self, tmp_path, monkeypatch):
        episodes, manifest_root = self._build(tmp_path)
        (episodes / "demo" / "shot-list.json").write_text(json.dumps({
            "assets": [{"id": "a"}, {"id": "unused-shot"}],
        }))
        (episodes / "demo" / "script-production.md").write_text("plain text")
        (manifest_root / "demo" / "assembly-manifest.json").write_text(json.dumps({
            "segments": [{"asset": {"shotListId": "a"}}],
        }))
        monkeypatch.setattr(csm, "EPISODES_ROOT", episodes)
        monkeypatch.setattr(csm, "MANIFEST_ROOT", manifest_root)
        report = csm.cross_check("demo")
        assert report.shotlist_only == {"unused-shot"}
        assert report.manifest_only_shots == set()

    def test_manifest_only_orphan_detected(self, tmp_path, monkeypatch):
        episodes, manifest_root = self._build(tmp_path)
        (episodes / "demo" / "shot-list.json").write_text(json.dumps({"assets": []}))
        (episodes / "demo" / "script-production.md").write_text("plain")
        (manifest_root / "demo" / "assembly-manifest.json").write_text(json.dumps({
            "segments": [{"asset": {"shotListId": "ghost-shot"}}],
        }))
        monkeypatch.setattr(csm, "EPISODES_ROOT", episodes)
        monkeypatch.setattr(csm, "MANIFEST_ROOT", manifest_root)
        report = csm.cross_check("demo")
        assert report.manifest_only_shots == {"ghost-shot"}

    def test_script_data_drift_in_both_directions(self, tmp_path, monkeypatch):
        episodes, manifest_root = self._build(tmp_path)
        (episodes / "demo" / "script-production.md").write_text(
            "[demo/in-script-only.json] [demo/both.json]"
        )
        (manifest_root / "demo" / "assembly-manifest.json").write_text(json.dumps({
            "segments": [
                {"template": {"dataFile": "both.json"}},
                {"template": {"dataFile": "in-manifest-only.json"}},
            ],
        }))
        monkeypatch.setattr(csm, "EPISODES_ROOT", episodes)
        monkeypatch.setattr(csm, "MANIFEST_ROOT", manifest_root)
        report = csm.cross_check("demo")
        assert report.script_only_data == {"in-script-only.json"}
        assert report.manifest_only_data == {"in-manifest-only.json"}

    def test_missing_manifest_yields_hard_error(self, tmp_path, monkeypatch):
        episodes, manifest_root = self._build(tmp_path)
        monkeypatch.setattr(csm, "EPISODES_ROOT", episodes)
        monkeypatch.setattr(csm, "MANIFEST_ROOT", manifest_root)
        report = csm.cross_check("demo")
        assert any("manifest missing" in e for e in report.errors)

    def test_no_shot_list_skips_check_without_error(self, tmp_path, monkeypatch):
        # Some early-draft episodes don't have a shot list yet — don't fail.
        episodes, manifest_root = self._build(tmp_path)
        (episodes / "demo" / "script-production.md").write_text("")
        (manifest_root / "demo" / "assembly-manifest.json").write_text(json.dumps({
            "segments": [{"asset": {"shotListId": "x"}}],
        }))
        monkeypatch.setattr(csm, "EPISODES_ROOT", episodes)
        monkeypatch.setattr(csm, "MANIFEST_ROOT", manifest_root)
        report = csm.cross_check("demo")
        # No error, no shot-list comparisons made
        assert report.errors == []
        assert report.shotlist_only == set()
        assert report.manifest_only_shots == set()


# ─── Real episodes regression guard ──────────────────────────────────────────


class TestRealEpisodesRegression:
    """Both shipped episodes should at least load cleanly with no hard errors."""

    @pytest.mark.parametrize("slug", ["silicon-trap", "prisoners-dilemma"])
    def test_no_hard_errors(self, slug):
        report = csm.cross_check(slug)
        assert report.errors == []
        # Orphan warnings are expected at this stage of production — don't
        # assert their count, just that the tool returns a structured report.
        assert isinstance(report.shotlist_only, set)


# ─── Script picker ──────────────────────────────────────────────────────────


class TestFindScript:
    def test_prefers_canonical_name(self, tmp_path, monkeypatch):
        ep = tmp_path / "ep"
        ep.mkdir()
        (ep / "script-production.md").write_text("")
        (ep / "script-v5-production.md").write_text("")
        monkeypatch.setattr(csm, "EPISODES_ROOT", tmp_path)
        assert csm.find_script("ep").name == "script-production.md"

    def test_picks_highest_versioned_when_no_canonical(self, tmp_path, monkeypatch):
        ep = tmp_path / "ep"
        ep.mkdir()
        (ep / "script-v3-production.md").write_text("")
        (ep / "script-v5-production.md").write_text("")
        (ep / "script-v4-production.md").write_text("")
        monkeypatch.setattr(csm, "EPISODES_ROOT", tmp_path)
        assert csm.find_script("ep").name == "script-v5-production.md"

    def test_returns_None_when_none_present(self, tmp_path, monkeypatch):
        (tmp_path / "ep").mkdir()
        monkeypatch.setattr(csm, "EPISODES_ROOT", tmp_path)
        assert csm.find_script("ep") is None
