"""Tests for tools/asset-source/zerohit_fallback.py."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import zerohit_fallback as zf  # noqa: E402


# ── Heuristic suggestion tests ────────────────────────────────────────────────

class TestSuggestAnchor:
    def test_industrial_keywords_pick_A2(self):
        assert zf.suggest_anchor(["TSMC cleanroom factory floor"], "") == "A2"
        assert zf.suggest_anchor(["chip manufacturing plant"], "") == "A2"

    def test_map_keywords_pick_A3(self):
        assert zf.suggest_anchor(["taiwan strait satellite map"], "") == "A3"

    def test_empire_keywords_pick_A1(self):
        assert zf.suggest_anchor(["ottoman ruins ancient empire"], "") == "A1"

    def test_archival_keywords_pick_A4(self):
        assert zf.suggest_anchor(["1960 newsreel archival footage"], "") == "A4"

    def test_protest_keywords_pick_A5(self):
        assert zf.suggest_anchor(["crowd protest demonstration"], "") == "A5"

    def test_military_keywords_pick_A7(self):
        assert zf.suggest_anchor(["warship military fleet"], "") == "A7"

    def test_no_match_defaults_to_A1(self):
        """Channel default when no keywords hit any anchor bag."""
        assert zf.suggest_anchor(["abstract gradient background"], "") == "A1"

    def test_notes_field_contributes(self):
        # No keywords in search terms, but notes mention 'factory'
        assert zf.suggest_anchor(["xyz"], "factory aerial shot") == "A2"


class TestSuggestStyleRef:
    def test_cleanroom_keyword_picks_r2(self):
        assert zf.suggest_style_ref(["cleanroom wafer"], "") == "r2"

    def test_constructivist_keyword_picks_r11(self):
        assert zf.suggest_style_ref(["soviet propaganda poster"], "") == "r11"

    def test_japanese_keyword_picks_r10(self):
        assert zf.suggest_style_ref(["japanese tokyo street"], "") == "r10"

    def test_no_match_defaults_to_r15(self):
        """Neutral channel default when no keywords hit any style-ref bag."""
        # Use a phrase that has no overlap with r1-r14 keyword bags.
        assert zf.suggest_style_ref(["plain neutral subject"], "") == "r15"

    def test_face_keyword_picks_r1(self):
        assert zf.suggest_style_ref(["portrait close-up face"], "") == "r1"


# ── Zero-hit detection tests ──────────────────────────────────────────────────

class TestFindZeroHitShots:
    def test_zero_total_results_detected(self):
        manifest = {"assets": [
            {"id": "s1", "search": {"total_results": 0, "results": []}, "downloaded": []},
        ]}
        out = zf.find_zero_hit_shots(manifest)
        assert len(out) == 1
        assert out[0]["id"] == "s1"

    def test_successful_download_excludes_shot(self):
        manifest = {"assets": [
            {"id": "s1", "search": {"total_results": 5, "results": [{}]},
             "downloaded": [{"path": "a.jpg", "source": "pexels", "photographer": "x",
                             "license": "CC0", "url": "..."}]},
        ]}
        assert zf.find_zero_hit_shots(manifest) == []

    def test_all_downloads_failed_treated_as_zero_hit(self):
        """If every downloaded entry is status=failed, still a zero-hit shot."""
        manifest = {"assets": [
            {"id": "s1", "search": {"total_results": 3, "results": [{}]},
             "downloaded": [{"status": "failed", "source": "pexels", "url": "..."},
                            {"status": "failed", "source": "pixabay", "url": "..."}]},
        ]}
        out = zf.find_zero_hit_shots(manifest)
        assert len(out) == 1

    def test_empty_manifest_returns_empty(self):
        assert zf.find_zero_hit_shots({"assets": []}) == []

    def test_missing_assets_key_returns_empty(self):
        assert zf.find_zero_hit_shots({}) == []


# ── Rendering tests ───────────────────────────────────────────────────────────

class TestRenderShotBrief:
    def test_includes_shot_id_priority_terms(self):
        entry = {
            "id": "beat1-fab",
            "priority": "P1",
            "search": {"search_terms": ["semiconductor fab"], "media_type": "photo"},
        }
        shot_meta = {"notes": "Cinematic opener"}
        anchors = [{"id": "A2", "name": "Industrial chokepoint"}]
        out = zf.render_shot_brief(entry, shot_meta, anchors)
        assert "beat1-fab (P1)" in out
        assert "`semiconductor fab`" in out
        assert "Cinematic opener" in out
        assert "Industrial chokepoint" in out
        assert "1920×1080 still" in out  # photo → still

    def test_video_media_type_renders_video_format(self):
        entry = {
            "id": "beat1-clip",
            "priority": "P2",
            "search": {"search_terms": ["taiwan strait"], "media_type": "video"},
        }
        out = zf.render_shot_brief(entry, {}, [])
        assert "16:9 video" in out
        assert "fal.ai" in out

    def test_handles_missing_shot_meta_gracefully(self):
        entry = {
            "id": "x",
            "priority": "P3",
            "search": {"search_terms": ["q"], "media_type": "photo"},
        }
        out = zf.render_shot_brief(entry, {}, [])
        # Should not crash and should still render basic structure
        assert "x (P3)" in out


class TestRenderFullBrief:
    def test_includes_count_and_appendices(self):
        out = zf.render_full_brief(
            "test-ep",
            zero_hits=[{
                "id": "a", "priority": "P1",
                "search": {"search_terms": ["x"], "media_type": "photo"},
            }],
            shots={"a": {"notes": "note"}},
            anchors=[{"id": "A1", "name": "Imperial", "useCases": ["fall"]}],
            style_ref_index="# style ref index content",
        )
        assert "AI-Gen Briefs — `test-ep`" in out
        assert "1 shot" in out
        assert "Recraft Anchor Catalog" in out
        assert "Flux Style Reference Catalog" in out


# ── Integration test on synthetic episode ─────────────────────────────────────

class TestEndToEnd:
    def test_count_mode_returns_correct_exit_code(self, tmp_path, monkeypatch, capsys):
        """--count mode exits 1 when zero-hits exist, 0 when clean."""
        # Build a fake episode with one zero-hit and one successful download.
        ep_dir = tmp_path / "fake-ep"
        assets_dir = ep_dir / "assets"
        assets_dir.mkdir(parents=True)
        (assets_dir / "asset-manifest.json").write_text(json.dumps({
            "episode": "fake-ep",
            "generated": "auto",
            "assets": [
                {"id": "a", "priority": "P1",
                 "search": {"total_results": 0, "search_terms": ["x"],
                            "media_type": "photo", "results": []},
                 "downloaded": []},
                {"id": "b", "priority": "P2",
                 "search": {"total_results": 5, "search_terms": ["y"],
                            "media_type": "photo", "results": [{}]},
                 "downloaded": [{"path": "p", "source": "pexels", "photographer": "x",
                                 "license": "CC0", "url": "..."}]},
            ],
        }))

        monkeypatch.setattr(zf, "EPISODES_DIR", tmp_path)
        monkeypatch.setattr(sys, "argv", ["zerohit_fallback.py", "fake-ep", "--count"])

        rc = zf.main()
        assert rc == 1  # 1 zero-hit → exit code 1

        out = capsys.readouterr().out
        assert "fake-ep: 1 zero-hit shot(s) of 2 total" in out

    def test_brief_written_to_default_path(self, tmp_path, monkeypatch, capsys):
        ep_dir = tmp_path / "fake-ep"
        assets_dir = ep_dir / "assets"
        assets_dir.mkdir(parents=True)
        (assets_dir / "asset-manifest.json").write_text(json.dumps({
            "episode": "fake-ep",
            "assets": [{
                "id": "a", "priority": "P1",
                "search": {"total_results": 0, "search_terms": ["TSMC factory"],
                           "media_type": "photo", "results": []},
                "downloaded": [],
            }],
        }))
        # Shot list with matching id
        (ep_dir / "shot-list.json").write_text(json.dumps({
            "episode": "fake-ep", "title": "x",
            "assets": [{"id": "a", "notes": "Big building."}],
        }))

        monkeypatch.setattr(zf, "EPISODES_DIR", tmp_path)
        monkeypatch.setattr(sys, "argv", ["zerohit_fallback.py", "fake-ep"])

        rc = zf.main()
        assert rc == 0
        brief_path = ep_dir / "ai-gen-briefs.md"
        assert brief_path.is_file()
        content = brief_path.read_text(encoding="utf-8")
        assert "TSMC factory" in content
        assert "Big building" in content
        assert "Industrial chokepoint" in content  # heuristic match for "factory"

    def test_no_zero_hits_writes_empty_message(self, tmp_path, monkeypatch, capsys):
        ep_dir = tmp_path / "fake-ep"
        (ep_dir / "assets").mkdir(parents=True)
        (ep_dir / "assets" / "asset-manifest.json").write_text(json.dumps({
            "episode": "fake-ep",
            "assets": [{
                "id": "a", "priority": "P1",
                "search": {"total_results": 5, "search_terms": ["x"],
                           "media_type": "photo", "results": [{}]},
                "downloaded": [{"path": "p", "source": "pexels", "photographer": "x",
                                "license": "CC0", "url": "..."}],
            }],
        }))
        monkeypatch.setattr(zf, "EPISODES_DIR", tmp_path)
        monkeypatch.setattr(sys, "argv", ["zerohit_fallback.py", "fake-ep"])

        rc = zf.main()
        assert rc == 0
        out = capsys.readouterr().out
        assert "Nothing to brief" in out
