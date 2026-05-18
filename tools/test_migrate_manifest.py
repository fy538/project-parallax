"""
Tests for tools/migrate_manifest.py — manifest schema migration framework.

The migration registry is empty today (no schema evolution has happened yet),
so the value of these tests is locking the FRAMEWORK in place. When the first
real migration lands, the planner, applier, dry-run, and write-mode logic
already work and have regression coverage.
"""

from __future__ import annotations

import copy
import json
import subprocess
import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parent))
import migrate_manifest as mm  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPT_PATH = REPO_ROOT / "tools" / "migrate_manifest.py"


# ─── 1. Planner ──────────────────────────────────────────────────────────────


class TestPlanMigration:
    def test_identity_returns_empty_path(self):
        assert mm.plan_migration("1.0", "1.0") == []

    def test_direct_hop_returns_single_edge(self, monkeypatch):
        monkeypatch.setattr(mm, "MIGRATIONS", {("1.0", "1.1"): lambda m: m})
        assert mm.plan_migration("1.0", "1.1") == [("1.0", "1.1")]

    def test_chain_three_hops(self, monkeypatch):
        monkeypatch.setattr(mm, "MIGRATIONS", {
            ("1.0", "1.1"): lambda m: m,
            ("1.1", "1.2"): lambda m: m,
            ("1.2", "2.0"): lambda m: m,
        })
        plan = mm.plan_migration("1.0", "2.0")
        assert plan == [("1.0", "1.1"), ("1.1", "1.2"), ("1.2", "2.0")]

    def test_no_path_returns_None(self, monkeypatch):
        monkeypatch.setattr(mm, "MIGRATIONS", {("1.0", "1.1"): lambda m: m})
        assert mm.plan_migration("0.5", "1.1") is None

    def test_no_reverse_path(self, monkeypatch):
        # We don't auto-derive reverse migrations.
        monkeypatch.setattr(mm, "MIGRATIONS", {("1.0", "1.1"): lambda m: m})
        assert mm.plan_migration("1.1", "1.0") is None


# ─── 2. Applier ──────────────────────────────────────────────────────────────


class TestApplyMigrations:
    def test_empty_hops_returns_input_unchanged(self):
        m = {"version": "1.0", "segments": []}
        out = mm.apply_migrations(m, [])
        assert out == m
        assert out is m  # identity allowed when nothing applied

    def test_each_hop_runs_in_order(self, monkeypatch):
        def add_field_a(m: dict) -> dict:
            m = copy.deepcopy(m)
            m["a"] = 1
            return m

        def add_field_b(m: dict) -> dict:
            m = copy.deepcopy(m)
            m["b"] = 2
            return m

        monkeypatch.setattr(mm, "MIGRATIONS", {
            ("1.0", "1.1"): add_field_a,
            ("1.1", "1.2"): add_field_b,
        })
        out = mm.apply_migrations(
            {"version": "1.0"}, [("1.0", "1.1"), ("1.1", "1.2")]
        )
        assert out == {"version": "1.0", "a": 1, "b": 2}

    def test_input_dict_is_not_mutated_when_fn_deepcopies(self, monkeypatch):
        original = {"version": "1.0", "segments": [{"id": "s1"}]}
        snapshot = copy.deepcopy(original)

        def fn(m: dict) -> dict:
            m = copy.deepcopy(m)
            m["version"] = "1.1"
            m["segments"][0]["renamed"] = True
            return m

        monkeypatch.setattr(mm, "MIGRATIONS", {("1.0", "1.1"): fn})
        out = mm.apply_migrations(original, [("1.0", "1.1")])
        assert original == snapshot, "applier must not mutate the caller's dict"
        assert out["segments"][0]["renamed"] is True


# ─── 3. Status mode ──────────────────────────────────────────────────────────


class TestStatusMode:
    def _setup(self, tmp_path: Path, manifests: dict[str, dict]) -> None:
        """Build a fake episodes tree and point EPISODES_DIR at it."""
        for slug, payload in manifests.items():
            episode_dir = tmp_path / slug
            episode_dir.mkdir(parents=True)
            (episode_dir / "assembly-manifest.json").write_text(json.dumps(payload))

    def test_reports_current_versions(self, tmp_path, monkeypatch):
        self._setup(tmp_path, {
            "alpha": {"version": "1.0", "segments": []},
            "beta": {"version": "1.0", "segments": []},
        })
        monkeypatch.setattr(mm, "EPISODES_DIR", tmp_path)
        rc, statuses = mm.run_status(None)
        assert rc == 0
        slugs = sorted(s.slug for s in statuses)
        assert slugs == ["alpha", "beta"]
        assert all(s.version == "1.0" for s in statuses)

    def test_filters_by_episode(self, tmp_path, monkeypatch):
        self._setup(tmp_path, {
            "alpha": {"version": "1.0"},
            "beta": {"version": "1.0"},
        })
        monkeypatch.setattr(mm, "EPISODES_DIR", tmp_path)
        _, statuses = mm.run_status("alpha")
        assert [s.slug for s in statuses] == ["alpha"]

    def test_invalid_json_marked_as_error(self, tmp_path, monkeypatch):
        episode_dir = tmp_path / "broken"
        episode_dir.mkdir()
        (episode_dir / "assembly-manifest.json").write_text("{ not valid json")
        monkeypatch.setattr(mm, "EPISODES_DIR", tmp_path)
        rc, statuses = mm.run_status(None)
        assert rc == 1
        assert statuses[0].error is not None
        assert "invalid JSON" in statuses[0].error

    def test_missing_version_field_shows_None(self, tmp_path, monkeypatch):
        episode_dir = tmp_path / "no-version"
        episode_dir.mkdir()
        (episode_dir / "assembly-manifest.json").write_text(json.dumps({"segments": []}))
        monkeypatch.setattr(mm, "EPISODES_DIR", tmp_path)
        _, statuses = mm.run_status(None)
        assert statuses[0].version is None
        assert statuses[0].error is None


# ─── 4. Migration mode ───────────────────────────────────────────────────────


class TestMigrationMode:
    def _setup(self, tmp_path: Path, slug: str, payload: dict) -> Path:
        episode_dir = tmp_path / slug
        episode_dir.mkdir(parents=True)
        path = episode_dir / "assembly-manifest.json"
        path.write_text(json.dumps(payload, indent=2))
        return path

    def test_already_at_target_is_noop_clean(self, tmp_path, monkeypatch):
        path = self._setup(tmp_path, "demo", {"version": "1.0", "segments": []})
        monkeypatch.setattr(mm, "EPISODES_DIR", tmp_path)
        rc, results = mm.run_migration("1.0", None, dry_run=True)
        assert rc == 0
        assert len(results) == 1
        assert results[0].changed is False
        assert results[0].hops == []
        # File untouched
        assert json.loads(path.read_text())["version"] == "1.0"

    def test_dry_run_does_not_write(self, tmp_path, monkeypatch):
        path = self._setup(tmp_path, "demo", {"version": "0.9"})
        # Register a fake 0.9 → 1.0 migration that bumps version
        def to_1_0(m: dict) -> dict:
            m = copy.deepcopy(m)
            m["version"] = "1.0"
            m["migrated"] = True
            return m

        monkeypatch.setattr(mm, "MIGRATIONS", {("0.9", "1.0"): to_1_0})
        monkeypatch.setattr(mm, "EPISODES_DIR", tmp_path)
        rc, results = mm.run_migration("1.0", None, dry_run=True)
        assert rc == 0
        assert results[0].changed is True
        # File still has the original version
        assert json.loads(path.read_text())["version"] == "0.9"
        assert "migrated" not in json.loads(path.read_text())

    def test_write_mode_persists_changes(self, tmp_path, monkeypatch):
        path = self._setup(tmp_path, "demo", {"version": "0.9", "x": 1})
        def to_1_0(m: dict) -> dict:
            m = copy.deepcopy(m)
            m["version"] = "1.0"
            return m

        monkeypatch.setattr(mm, "MIGRATIONS", {("0.9", "1.0"): to_1_0})
        monkeypatch.setattr(mm, "EPISODES_DIR", tmp_path)
        rc, results = mm.run_migration("1.0", None, dry_run=False)
        assert rc == 0
        on_disk = json.loads(path.read_text())
        assert on_disk["version"] == "1.0"
        # Existing fields preserved
        assert on_disk["x"] == 1

    def test_no_migration_path_returns_1(self, tmp_path, monkeypatch):
        self._setup(tmp_path, "stuck", {"version": "0.5"})
        # MIGRATIONS doesn't contain 0.5 → anything
        monkeypatch.setattr(mm, "MIGRATIONS", {("1.0", "1.1"): lambda m: m})
        monkeypatch.setattr(mm, "EPISODES_DIR", tmp_path)
        rc, results = mm.run_migration("1.1", None, dry_run=True)
        assert rc == 1
        assert results[0].error is not None
        assert "no migration path" in results[0].error


# ─── 5. CLI ──────────────────────────────────────────────────────────────────


class TestCLI:
    def test_no_args_runs_status(self):
        """Status mode (no --to-version) should succeed on real episodes."""
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH)],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 0
        assert "manifest versions" in result.stdout
        # Real episodes both at 1.0
        assert "silicon-trap: 1.0" in result.stdout

    def test_json_status(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--json"],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 0
        parsed = json.loads(result.stdout)
        assert parsed["currentVersion"] == "1.0"
        assert parsed["registeredMigrations"] == []
        assert isinstance(parsed["manifests"], list)

    def test_unknown_target_version_exits_2(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--to-version", "99.0"],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 2
        assert "not registered" in result.stderr

    def test_to_current_version_is_noop_on_real_episodes(self):
        """Migrating real episodes to the current version should be a clean no-op."""
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--to-version", "1.0"],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 0
        assert "no-op" in result.stdout
