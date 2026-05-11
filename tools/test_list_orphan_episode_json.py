"""Tests for list_orphan_episode_json."""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import list_orphan_episode_json as loej


def test_data_files_from_manifest_collects_datafile_basenames():
    manifest = {
        "segments": [
            {"template": {"dataFile": "a.json"}},
            {"template": {"dataFile": "subdir/b.json"}},
            {"template": {}},
        ]
    }
    got = loej.data_files_from_manifest(manifest)
    assert got == {"a.json", "b.json"}


def test_orphans_for_slug_detects_unreferenced_json(tmp_path, monkeypatch):
    slug = "fake-episode"
    ep = tmp_path / "remotion-templates" / "data" / "episodes" / slug
    ep.mkdir(parents=True)
    manifest = {"segments": [{"template": {"dataFile": "used.json"}}]}
    (ep / "assembly-manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
    (ep / "used.json").write_text("{}", encoding="utf-8")
    (ep / "orphan.json").write_text("{}", encoding="utf-8")

    monkeypatch.setattr(loej, "EPISODES_DIR", tmp_path / "remotion-templates" / "data" / "episodes")

    s, orphans = loej.orphans_for_slug(slug)
    assert s == slug
    assert orphans == ["orphan.json"]
