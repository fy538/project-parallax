"""Tests for tools/shared/manifests.py — the unified manifest loader.

The pre-existing six copies had drifted in error-handling — this suite
locks the new shared contract so future migrations / refactors don't
silently change behavior.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))

import manifests as M


VALID_MANIFEST = {
    "version": "1.0",
    "episode": "test-episode",
    "segments": [{"id": "seg1", "startSec": 0, "endSec": 5}],
}


# ── load_manifest(path) ──────────────────────────────────────────────────


def test_load_manifest_from_path_returns_parsed_dict(tmp_path):
    p = tmp_path / "assembly-manifest.json"
    p.write_text(json.dumps(VALID_MANIFEST), encoding="utf-8")
    assert M.load_manifest(p) == VALID_MANIFEST


def test_load_manifest_missing_file_returns_none(tmp_path):
    assert M.load_manifest(tmp_path / "does-not-exist.json") is None


def test_load_manifest_malformed_json_returns_none(tmp_path):
    p = tmp_path / "broken.json"
    p.write_text("{ this is not json")
    assert M.load_manifest(p) is None


def test_load_manifest_handles_utf8_correctly(tmp_path):
    """Manifests carry Chinese / accented characters in title fields. The
    pre-existing copies were split — some used .read_text() (system
    default encoding), some used encoding="utf-8". The unified contract
    is utf-8 always."""
    p = tmp_path / "intl.json"
    p.write_text(json.dumps({"title": "盘点 — Schwerpunkt"}), encoding="utf-8")
    assert M.load_manifest(p)["title"] == "盘点 — Schwerpunkt"


# ── load_manifest(slug) ──────────────────────────────────────────────────


def test_load_manifest_from_slug_resolves_canonical_path(tmp_path, monkeypatch):
    """When given a slug, the loader walks the canonical REMOTION_DATA
    path. Use monkeypatch to redirect get_project_root for a hermetic test."""
    # Build a fake project tree.
    fake_root = tmp_path / "fake-repo"
    manifest_dir = fake_root / "remotion-templates" / "data" / "episodes" / "my-slug"
    manifest_dir.mkdir(parents=True)
    (manifest_dir / "assembly-manifest.json").write_text(
        json.dumps(VALID_MANIFEST), encoding="utf-8",
    )

    monkeypatch.setattr(M, "get_project_root", lambda: fake_root)
    assert M.load_manifest("my-slug") == VALID_MANIFEST


def test_load_manifest_unknown_slug_returns_none(tmp_path, monkeypatch):
    monkeypatch.setattr(M, "get_project_root", lambda: tmp_path)
    assert M.load_manifest("ghost-episode") is None


# ── manifest_path_for ────────────────────────────────────────────────────


def test_manifest_path_for_returns_canonical_layout(monkeypatch, tmp_path):
    monkeypatch.setattr(M, "get_project_root", lambda: tmp_path)
    expected = tmp_path / "remotion-templates" / "data" / "episodes" / "foo" / "assembly-manifest.json"
    assert M.manifest_path_for("foo") == expected


# ── load_manifest_with_error ─────────────────────────────────────────────


def test_load_with_error_returns_none_data_and_error_on_missing(tmp_path):
    data, err = M.load_manifest_with_error(tmp_path / "missing.json")
    assert data is None
    assert err is not None
    assert "could not read" in err


def test_load_with_error_returns_none_data_and_error_on_malformed(tmp_path):
    p = tmp_path / "broken.json"
    p.write_text("not json{")
    data, err = M.load_manifest_with_error(p)
    assert data is None
    assert err is not None
    assert "invalid JSON" in err


def test_load_with_error_returns_data_and_none_on_success(tmp_path):
    p = tmp_path / "ok.json"
    p.write_text(json.dumps(VALID_MANIFEST), encoding="utf-8")
    data, err = M.load_manifest_with_error(p)
    assert data == VALID_MANIFEST
    assert err is None


# ── load_manifest_strict ─────────────────────────────────────────────────


def test_load_strict_returns_dict_on_success(tmp_path):
    p = tmp_path / "ok.json"
    p.write_text(json.dumps(VALID_MANIFEST), encoding="utf-8")
    assert M.load_manifest_strict(p) == VALID_MANIFEST


def test_load_strict_raises_on_missing(tmp_path):
    """Strict variant lets FileNotFoundError bubble — that's its job. A
    tool that picked strict should crash loudly rather than silently get
    a None and produce a confusing downstream error."""
    with pytest.raises(FileNotFoundError):
        M.load_manifest_strict(tmp_path / "missing.json")


def test_load_strict_raises_on_malformed(tmp_path):
    p = tmp_path / "broken.json"
    p.write_text("not json")
    with pytest.raises(json.JSONDecodeError):
        M.load_manifest_strict(p)
