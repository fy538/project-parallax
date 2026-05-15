"""
Tests for tools/preflight.py — episode asset-existence preflight.

Covers the load-bearing logic without touching the real episode data:
  1. Asset-path detection inside data JSON (key/extension filter)
  2. Manifest collector (narration, musicBed, segments.asset.file, pending)
  3. Path resolution against the three candidate roots
  4. End-to-end run on a fixture-style manifest in a temp dir
  5. CLI: --list, --json, --strict exit codes
  6. Real episodes resolve cleanly (no broken paths regressed)
"""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

import pytest

# Make `tools/` importable as a module path for direct function imports.
sys.path.insert(0, str(Path(__file__).resolve().parent))

import preflight  # noqa: E402


REPO_ROOT = Path(__file__).resolve().parent.parent
SCRIPT_PATH = REPO_ROOT / "tools" / "preflight.py"


# ─── 1. Data-JSON walker ─────────────────────────────────────────────────────


class TestCollectDataFileRefs:
    def test_picks_up_imageSrc_with_image_extension(self):
        data = {"title": "x", "imageSrc": "episodes/foo/wafer.jpg"}
        refs = preflight.collect_datafile_refs(data, Path("/tmp/x.json"))
        assert len(refs) == 1
        assert refs[0].path == "episodes/foo/wafer.jpg"
        assert refs[0].source == "imageSrc"

    def test_picks_up_illustrationSrc(self):
        data = {"illustrationSrc": "episodes/silicon-trap/chip.svg"}
        refs = preflight.collect_datafile_refs(data, Path("/tmp/x.json"))
        assert len(refs) == 1
        assert refs[0].source == "illustrationSrc"

    def test_picks_up_file_with_video_extension(self):
        data = {"clips": [{"file": "clips/aigen-01.mp4", "label": "intro"}]}
        refs = preflight.collect_datafile_refs(data, Path("/tmp/x.json"))
        assert len(refs) == 1
        assert refs[0].path == "clips/aigen-01.mp4"
        # JSON path should reflect the array index for debuggability
        assert refs[0].source == "clips[0].file"

    def test_ignores_searchTerms_string_with_mp4_substring(self):
        # False-positive guard: free text with ".mp4" should NOT be captured.
        # ASSET_KEY_PATTERN limits us to known asset keys.
        data = {
            "searchTerms": ["lightning shot from above .mp4 style cuts"],
            "label": "no asset here",
        }
        refs = preflight.collect_datafile_refs(data, Path("/tmp/x.json"))
        assert refs == []

    def test_ignores_file_without_recognised_extension(self):
        data = {"file": "notes.txt"}
        refs = preflight.collect_datafile_refs(data, Path("/tmp/x.json"))
        assert refs == []

    def test_walks_nested_objects_and_arrays(self):
        data = {
            "segments": [
                {"image": {"imageSrc": "a.png"}},   # nested object
                {"image": {"imageSrc": "b.jpg"}},
            ],
            "background": {"src": "bg.webp"},
        }
        refs = preflight.collect_datafile_refs(data, Path("/tmp/x.json"))
        # imageSrc twice + src once = 3
        assert len(refs) == 3
        paths = sorted(r.path for r in refs)
        assert paths == ["a.png", "b.jpg", "bg.webp"]

    def test_extension_match_is_case_insensitive(self):
        data = {"imageSrc": "FOO.PNG", "videoFile": "BAR.MP4"}
        refs = preflight.collect_datafile_refs(data, Path("/tmp/x.json"))
        assert len(refs) == 2


# ─── 2. Manifest collector ───────────────────────────────────────────────────


class TestCollectManifestRefs:
    def test_collects_narration_audioFile_when_present(self):
        manifest = {"narration": {"audioFile": "audio/narration.wav", "totalDurationSec": 100}}
        refs = preflight.collect_manifest_refs(manifest, Path("/tmp/m.json"))
        assert any(r.source == "narration.audioFile" for r in refs)

    def test_skips_narration_when_audioFile_is_null(self):
        # Estimate-mode manifest — narration not yet recorded.
        manifest = {"narration": {"audioFile": None, "totalDurationSec": 0}}
        refs = preflight.collect_manifest_refs(manifest, Path("/tmp/m.json"))
        assert all(r.source != "narration.audioFile" for r in refs)

    def test_collects_musicBed_tracks(self):
        manifest = {
            "musicBed": {
                "tracks": [
                    {"id": "a", "file": "audio/a.wav", "startSec": 0, "endSec": 10, "volume": 0.1, "mood": "neutral"},
                    {"id": "b", "file": "audio/b.wav", "startSec": 10, "endSec": 20, "volume": 0.1, "mood": "neutral"},
                ]
            }
        }
        refs = preflight.collect_manifest_refs(manifest, Path("/tmp/m.json"))
        assert len(refs) == 2
        assert refs[0].path == "audio/a.wav"
        assert "id=a" in refs[0].source

    def test_collects_resolved_segment_asset_file(self):
        manifest = {
            "segments": [
                {
                    "id": "s1",
                    "type": "AI_GEN",
                    "asset": {"file": "clips/aigen-01.mp4", "status": "resolved"},
                },
            ]
        }
        refs = preflight.collect_manifest_refs(manifest, Path("/tmp/m.json"))
        assert len(refs) == 1
        assert refs[0].path == "clips/aigen-01.mp4"
        assert refs[0].is_pending is False

    def test_collects_pending_FOOTAGE_segment_as_pending(self):
        manifest = {
            "segments": [
                {"id": "s1", "type": "FOOTAGE", "asset": {"file": None, "status": "pending"}},
            ]
        }
        refs = preflight.collect_manifest_refs(manifest, Path("/tmp/m.json"))
        assert len(refs) == 1
        assert refs[0].is_pending is True
        assert "id=s1" in refs[0].source

    def test_skips_HOLD_segments_with_no_asset(self):
        manifest = {"segments": [{"id": "s1", "type": "HOLD"}]}
        refs = preflight.collect_manifest_refs(manifest, Path("/tmp/m.json"))
        assert refs == []


# ─── 3. Path resolution ──────────────────────────────────────────────────────


class TestCandidateResolutions:
    def test_produces_three_candidates_in_documented_order(self):
        candidates = preflight.candidate_resolutions("clips/aigen-01.mp4", "silicon-trap")
        assert len(candidates) == 3
        # Episode-scoped should be first (most common)
        assert candidates[0].as_posix().endswith("public/episodes/silicon-trap/clips/aigen-01.mp4")
        # public root second
        assert candidates[1].as_posix().endswith("public/clips/aigen-01.mp4")
        # legacy assets/ third
        assert candidates[2].as_posix().endswith("public/assets/clips/aigen-01.mp4")

    def test_resolve_asset_finds_existing_file(self, tmp_path, monkeypatch):
        # Build a fake PUBLIC_DIR with one resolvable asset.
        fake_public = tmp_path / "public"
        (fake_public / "episodes" / "demo").mkdir(parents=True)
        target = fake_public / "episodes" / "demo" / "wafer.jpg"
        target.write_bytes(b"x")
        monkeypatch.setattr(preflight, "PUBLIC_DIR", fake_public)
        ref = preflight.AssetRef(path="wafer.jpg", source="imageSrc", file=Path("/tmp/x.json"))
        assert preflight.resolve_asset(ref, slug="demo") == target

    def test_resolve_asset_returns_None_for_missing(self, tmp_path, monkeypatch):
        monkeypatch.setattr(preflight, "PUBLIC_DIR", tmp_path / "public")
        ref = preflight.AssetRef(path="missing.png", source="src", file=Path("/tmp/x.json"))
        assert preflight.resolve_asset(ref, slug="demo") is None


# ─── 4. End-to-end with a synthetic episode ──────────────────────────────────


class TestRunPreflightSynthetic:
    """Build a self-contained fake episode tree in tmp_path and run the full pipeline."""

    def _build_fake_episode(self, root: Path) -> tuple[Path, Path]:
        """Returns (data_episodes_dir, public_dir)."""
        episode = root / "remotion-templates" / "data" / "episodes" / "demo"
        public = root / "remotion-templates" / "public"
        public_ep = public / "episodes" / "demo"

        episode.mkdir(parents=True)
        public_ep.mkdir(parents=True)

        # Create asset files on disk
        (public_ep / "music.wav").write_bytes(b"x")
        (public_ep / "wafer.jpg").write_bytes(b"x")
        # Intentionally NOT creating clip-broken.mp4 — preflight should flag it.

        # Data file referenced by the manifest, with a mix of resolvable +
        # broken asset references inside.
        (episode / "kinetic.json").write_text(json.dumps({
            "imageSrc": "episodes/demo/wafer.jpg",      # resolves via candidate 2
            "missingSrc": {"imageSrc": "episodes/demo/never.jpg"},  # broken
        }))

        # Manifest
        manifest = {
            "version": "1.0",
            "episode": "demo",
            "fps": 30,
            "narration": {"audioFile": None, "totalDurationSec": 0},
            "musicBed": {"tracks": [
                {"id": "m1", "file": "music.wav", "startSec": 0, "endSec": 10, "volume": 0.1, "mood": "neutral"},
            ]},
            "segments": [
                {
                    "id": "s1",
                    "type": "TEMPLATE",
                    "startSec": 0,
                    "endSec": 5,
                    "template": {"component": "KineticTypography", "dataFile": "kinetic.json"},
                },
                {
                    "id": "s2",
                    "type": "AI_GEN",
                    "startSec": 5,
                    "endSec": 10,
                    "asset": {"file": "clip-broken.mp4", "status": "resolved"},
                },
                {
                    "id": "s3",
                    "type": "FOOTAGE",
                    "startSec": 10,
                    "endSec": 15,
                    "asset": {"file": None, "status": "pending"},
                },
            ],
        }
        (episode / "assembly-manifest.json").write_text(json.dumps(manifest))
        return episode.parent, public

    def test_classifies_resolved_broken_and_pending(self, tmp_path, monkeypatch):
        episodes_dir, public_dir = self._build_fake_episode(tmp_path)
        monkeypatch.setattr(preflight, "EPISODES_DIR", episodes_dir)
        monkeypatch.setattr(preflight, "PUBLIC_DIR", public_dir)

        report = preflight.run_preflight("demo")

        # Refs collected: music + asset.file + 1 pending + 2 inside dataFile = 5
        assert report.total_refs == 5

        # Missing: clip-broken.mp4 + never.jpg
        missing_paths = sorted(r.path for r in report.missing)
        assert missing_paths == ["clip-broken.mp4", "episodes/demo/never.jpg"]

        # Pending: s3 footage
        assert len(report.pending) == 1
        assert "id=s3" in report.pending[0].source

    def test_exit_codes(self, tmp_path, monkeypatch, capsys):
        episodes_dir, public_dir = self._build_fake_episode(tmp_path)
        monkeypatch.setattr(preflight, "EPISODES_DIR", episodes_dir)
        monkeypatch.setattr(preflight, "PUBLIC_DIR", public_dir)

        # Non-strict: missing assets still fail (1), pending alone wouldn't.
        rc = preflight.main(["demo"])
        assert rc == 1

        # Strict adds pending as blocking too (still 1).
        rc = preflight.main(["demo", "--strict"])
        assert rc == 1

        # JSON output exit code parity
        rc = preflight.main(["demo", "--json"])
        assert rc == 1
        out = capsys.readouterr().out
        # Last printed JSON block should be parseable
        # (multiple --json invocations accumulate in capsys; grab the last)
        last_block = out.strip().split("\n{\n")[-1]
        # Reattach the opening brace we split on (if it was split)
        if not last_block.lstrip().startswith("{"):
            last_block = "{\n" + last_block
        parsed = json.loads(last_block)
        assert parsed["episode"] == "demo"
        assert len(parsed["missing"]) == 2
        assert len(parsed["pending"]) == 1

    def test_clean_episode_exits_0(self, tmp_path, monkeypatch):
        # Build a fully-clean episode (no missing, no pending).
        episodes_dir = tmp_path / "remotion-templates" / "data" / "episodes" / "clean"
        public_ep = tmp_path / "remotion-templates" / "public" / "episodes" / "clean"
        episodes_dir.mkdir(parents=True)
        public_ep.mkdir(parents=True)
        (public_ep / "music.wav").write_bytes(b"x")
        manifest = {
            "version": "1.0", "episode": "clean", "fps": 30,
            "narration": {"audioFile": None, "totalDurationSec": 0},
            "musicBed": {"tracks": [
                {"id": "m1", "file": "music.wav", "startSec": 0, "endSec": 5, "volume": 0.1, "mood": "neutral"}
            ]},
            "segments": [],
        }
        (episodes_dir / "assembly-manifest.json").write_text(json.dumps(manifest))
        monkeypatch.setattr(preflight, "EPISODES_DIR", episodes_dir.parent)
        monkeypatch.setattr(preflight, "PUBLIC_DIR", tmp_path / "remotion-templates" / "public")
        rc = preflight.main(["clean"])
        assert rc == 0


# ─── 5. CLI smoke tests via subprocess ───────────────────────────────────────


class TestCLISmoke:
    def test_list_returns_known_episodes(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "--list"],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 0
        assert "silicon-trap" in result.stdout

    def test_unknown_episode_exits_2(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "nonexistent-xyz-episode"],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 2
        assert "not found" in result.stderr.lower()

    def test_no_args_exits_2(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH)],
            capture_output=True, text=True, check=False,
        )
        assert result.returncode == 2

    def test_real_episode_json_output_parses(self):
        result = subprocess.run(
            [sys.executable, str(SCRIPT_PATH), "prisoners-dilemma", "--json"],
            capture_output=True, text=True, check=False,
        )
        # Exit may be 0 (no missing) or 1 (some pending in strict — but we
        # didn't pass --strict here, so 0 is expected for a healthy episode).
        assert result.returncode in {0, 1}
        parsed = json.loads(result.stdout)
        assert parsed["episode"] == "prisoners-dilemma"
        assert "totalRefs" in parsed
        assert isinstance(parsed["missing"], list)
        assert isinstance(parsed["pending"], list)


# ─── 6. Regression guard on real episodes ────────────────────────────────────


class TestRealEpisodes:
    """Real episodes shouldn't have any broken file paths (only pending sourcing)."""

    @pytest.mark.parametrize("slug", ["silicon-trap", "prisoners-dilemma"])
    def test_no_broken_paths(self, slug):
        manifest_path = REPO_ROOT / "remotion-templates" / "data" / "episodes" / slug / "assembly-manifest.json"
        if not manifest_path.is_file():
            pytest.skip(f"manifest not present for {slug}")
        report = preflight.run_preflight(slug)
        # `missing` = paths that should resolve but don't. Pending sourcing
        # is a separate category and not a regression.
        assert report.missing == [], (
            f"{slug}: {len(report.missing)} broken asset paths — "
            + ", ".join(f"{r.source}={r.path}" for r in report.missing)
        )
