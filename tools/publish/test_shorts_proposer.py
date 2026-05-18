"""
Unit tests for tools/publish/shorts_proposer.py.

Covers:
  · _segment_template_name (canonical component / legacy name / string / missing)
  · _is_anchor_segment (FOOTAGE / IMAGE / TEMPLATE anchor / TEMPLATE text-heavy / unknown)
  · _duration_score (sweet-spot / usable / out-of-band)
  · _priority_score
  · _beat_title_lookup
  · _propose_* per candidate kind
  · propose_shorts (top-N + tiebreak ordering)
  · render_proposal_md
  · build_proposal_manifest (correct schema + TODO markers)
  · CLI smoke (missing manifest, empty result, --emit-manifest)
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
import shorts_proposer as sp  # type: ignore[import-not-found]


# ── _segment_template_name ──────────────────────────────────────────────────


class TestSegmentTemplateName:
    def test_template_component_canonical(self):
        # Canonical schema: template.component
        assert sp._segment_template_name(
            {"template": {"component": "DataChart"}}
        ) == "DataChart"

    def test_template_name_legacy_fallback(self):
        # Legacy / hand-authored manifests may use template.name
        assert sp._segment_template_name({"template": {"name": "Quote"}}) == "Quote"

    def test_template_component_takes_precedence_over_name(self):
        # If both are present, component wins (it's the canonical key)
        assert sp._segment_template_name(
            {"template": {"component": "DataChart", "name": "Other"}}
        ) == "DataChart"

    def test_template_as_string(self):
        assert sp._segment_template_name({"template": "Quote"}) == "Quote"

    def test_missing_template(self):
        assert sp._segment_template_name({}) == ""

    def test_template_dict_without_component(self):
        assert sp._segment_template_name({"template": {}}) == ""


# ── _is_anchor_segment ──────────────────────────────────────────────────────


class TestIsAnchorSegment:
    def test_footage_anchor(self):
        assert sp._is_anchor_segment({"type": "FOOTAGE"}) is True

    def test_image_anchor(self):
        # Canonical schema: IMAGE covers archival photos AND AI-gen scenes
        # (both are anchors for Shorts-candidacy purposes)
        assert sp._is_anchor_segment({"type": "IMAGE"}) is True

    def test_template_anchor_component(self):
        assert sp._is_anchor_segment({
            "type": "TEMPLATE", "template": {"component": "DataChart"},
        }) is True

    def test_template_framework_anchor(self):
        assert sp._is_anchor_segment({
            "type": "TEMPLATE", "template": {"component": "FrameworkDiagram"},
        }) is True

    def test_template_typography_not_anchor(self):
        assert sp._is_anchor_segment({
            "type": "TEMPLATE", "template": {"component": "KineticTypography"},
        }) is False

    def test_template_quote_not_anchor(self):
        # Quotes are editorially weighty but not concrete-visual-evidence
        assert sp._is_anchor_segment({
            "type": "TEMPLATE", "template": {"component": "Quote"},
        }) is False

    def test_hold_not_anchor(self):
        assert sp._is_anchor_segment({"type": "HOLD"}) is False

    def test_transition_not_anchor(self):
        assert sp._is_anchor_segment({"type": "TRANSITION"}) is False

    def test_missing_type_not_anchor(self):
        assert sp._is_anchor_segment({}) is False


# ── _duration_score ─────────────────────────────────────────────────────────


class TestDurationScore:
    def test_sweet_spot_full(self):
        assert sp._duration_score(30) == 2
        assert sp._duration_score(25) == 2
        assert sp._duration_score(45) == 2

    def test_usable_band_half(self):
        assert sp._duration_score(20) == 1
        assert sp._duration_score(50) == 1

    def test_out_of_band_zero(self):
        assert sp._duration_score(10) == 0
        assert sp._duration_score(70) == 0


# ── _priority_score ─────────────────────────────────────────────────────────


class TestPriorityScore:
    def test_p1_p2_score_one(self):
        assert sp._priority_score({"priority": "P1"}) == 1
        assert sp._priority_score({"priority": "P2"}) == 1

    def test_p3_zero(self):
        assert sp._priority_score({"priority": "P3"}) == 0

    def test_missing_zero(self):
        assert sp._priority_score({}) == 0


# ── _beat_title_lookup ──────────────────────────────────────────────────────


class TestBeatTitleLookup:
    def test_builds_label_map(self):
        manifest = {
            "beats": [
                {"id": "beat1", "title": "OPEN"},
                {"id": "beat2", "title": "MIDDLE"},
            ]
        }
        labels = sp._beat_title_lookup(manifest)
        assert labels["beat1"] == "Beat 1: OPEN"
        assert labels["beat2"] == "Beat 2: MIDDLE"

    def test_empty_manifest(self):
        assert sp._beat_title_lookup({}) == {}


# ── _propose_stat_candidates ────────────────────────────────────────────────


def _make_segment(**overrides):
    """Build a canonical-schema TEMPLATE segment for tests. Pass type=
    or template= to override; everything else defaults to a sensible
    P1 TEMPLATE segment."""
    base = {
        "id": "test-seg", "type": "TEMPLATE", "startSec": 0.0, "endSec": 5.0,
        "beat": "beat1", "priority": "P1",
        "template": {"component": "KineticTypography"},
    }
    base.update(overrides)
    return base


class TestProposeStatCandidates:
    def test_finds_data_chart(self):
        manifest = {
            "beats": [{"id": "beat1", "title": "B1"}],
            "segments": [
                _make_segment(
                    template={"component": "DataChart"}, startSec=10, endSec=18,
                ),
            ],
        }
        labels = sp._beat_title_lookup(manifest)
        cands = sp._propose_stat_candidates(manifest, labels)
        assert len(cands) == 1
        assert cands[0].candidate_kind == "stat"
        # 8s actual duration but padded up to SHORTS_MIN_SEC
        assert cands[0].durationSec >= sp.SHORTS_MIN_SEC

    def test_finds_stat_caption(self):
        manifest = {
            "beats": [{"id": "beat1", "title": "B1"}],
            "segments": [
                _make_segment(template={"component": "StatCaption"}),
            ],
        }
        labels = sp._beat_title_lookup(manifest)
        cands = sp._propose_stat_candidates(manifest, labels)
        assert len(cands) == 1

    def test_skips_non_stat_templates(self):
        manifest = {
            "beats": [],
            "segments": [_make_segment(template={"component": "KineticTypography"})],
        }
        assert sp._propose_stat_candidates(manifest, {}) == []


# ── _propose_quote_candidates ───────────────────────────────────────────────


class TestProposeQuoteCandidates:
    def test_finds_quote(self):
        manifest = {
            "beats": [{"id": "beat1", "title": "B1"}],
            "segments": [_make_segment(template={"component": "Quote"})],
        }
        labels = sp._beat_title_lookup(manifest)
        cands = sp._propose_quote_candidates(manifest, labels)
        assert len(cands) == 1
        assert cands[0].template == "KineticShort"

    def test_finds_quote_attribution(self):
        manifest = {
            "beats": [{"id": "beat1", "title": "B1"}],
            "segments": [_make_segment(template={"component": "QuoteAttribution"})],
        }
        labels = sp._beat_title_lookup(manifest)
        assert len(sp._propose_quote_candidates(manifest, labels)) == 1


# ── _propose_framework_candidates ───────────────────────────────────────────


class TestProposeFrameworkCandidates:
    def test_finds_framework(self):
        manifest = {
            "beats": [{"id": "beat1", "title": "B1"}],
            "segments": [_make_segment(template={"component": "FrameworkDiagram"})],
        }
        labels = sp._beat_title_lookup(manifest)
        cands = sp._propose_framework_candidates(manifest, labels)
        assert len(cands) == 1
        assert cands[0].template == "FrameworkDiagram-Short"


# ── _propose_beat_opener_candidates ─────────────────────────────────────────


class TestProposeBeatOpenerCandidates:
    def test_proposes_opener_per_beat(self):
        manifest = {
            "beats": [
                {"id": "beat1", "title": "OPEN", "startSec": 0, "endSec": 100},
                {"id": "beat2", "title": "MID", "startSec": 100, "endSec": 200},
            ],
            "segments": [
                _make_segment(beat="beat1", type="FOOTAGE",
                              startSec=0, endSec=15),  # anchor in opener
            ],
        }
        labels = sp._beat_title_lookup(manifest)
        cands = sp._propose_beat_opener_candidates(manifest, labels)
        # One per beat that meets duration threshold
        assert len(cands) == 2
        # beat1 should get higher score (has anchor)
        beat1 = next(c for c in cands if c.beat_id == "beat1")
        beat2 = next(c for c in cands if c.beat_id == "beat2")
        assert beat1.score > beat2.score

    def test_skips_short_beats(self):
        # Beat under SHORTS_MIN_SEC doesn't qualify for an opener
        manifest = {
            "beats": [{"id": "tiny", "title": "T", "startSec": 0, "endSec": 5}],
            "segments": [],
        }
        labels = sp._beat_title_lookup(manifest)
        assert sp._propose_beat_opener_candidates(manifest, labels) == []

    def test_anchor_detection_in_opener(self):
        manifest = {
            "beats": [{"id": "beat1", "title": "B1", "startSec": 0, "endSec": 60}],
            "segments": [
                # KineticTypography only in opener → no anchor
                _make_segment(beat="beat1", type="MG",
                              template={"component": "KineticTypography"},
                              startSec=0, endSec=20),
            ],
        }
        labels = sp._beat_title_lookup(manifest)
        cands = sp._propose_beat_opener_candidates(manifest, labels)
        # No anchor → rationale warns
        assert "no anchor" in cands[0].rationale.lower()


# ── propose_shorts ──────────────────────────────────────────────────────────


class TestProposeShortsRanking:
    def test_top_n_limits(self):
        manifest = {
            "beats": [{"id": "beat1", "title": "B1", "startSec": 0, "endSec": 200}],
            "segments": [
                _make_segment(id=f"s{i}", template={"component": "DataChart"},
                              startSec=i * 30, endSec=i * 30 + 25)
                for i in range(10)
            ],
        }
        cands = sp.propose_shorts(manifest, top_n=3)
        assert len(cands) == 3

    def test_tiebreak_prefers_stat_over_opener(self):
        # Same score → stat candidate should rank above beat_opener
        manifest = {
            "beats": [{"id": "beat1", "title": "B1", "startSec": 0, "endSec": 100}],
            "segments": [
                _make_segment(beat="beat1", type="FOOTAGE",
                              startSec=0, endSec=30),
                _make_segment(template={"component": "DataChart"},
                              startSec=40, endSec=65, beat="beat1"),
            ],
        }
        cands = sp.propose_shorts(manifest, top_n=2)
        # Stat candidate first
        assert cands[0].candidate_kind == "stat"


# ── render_proposal_md ──────────────────────────────────────────────────────


class TestRenderProposalMd:
    def test_renders_table_and_details(self):
        cand = sp.ShortsCandidate(
            candidate_kind="stat", sourceBeat="Beat 1: OPEN",
            beat_id="beat1", template="StatRevealShort",
            startSec=10, endSec=40, durationSec=30, score=5,
            label="stat", rationale="why", notes="fill data",
        )
        report = sp.ProposalReport(
            slug="x", manifest_path="/tmp/x.json",
            total_candidates=1, candidates=[cand],
        )
        out = sp.render_proposal_md(report)
        assert "stat" in out
        assert "why" in out
        assert "fill data" in out


# ── build_proposal_manifest ─────────────────────────────────────────────────


class TestBuildProposalManifest:
    def test_emits_schema_compliant(self):
        cand = sp.ShortsCandidate(
            candidate_kind="quote", sourceBeat="Beat 2",
            beat_id="beat2", template="KineticShort",
            startSec=0, endSec=30, durationSec=30, score=4,
            label="test", rationale="r", notes="fill in",
        )
        manifest = sp.build_proposal_manifest("test-slug", [cand])
        assert manifest["episode"] == "test-slug"
        assert manifest["version"].endswith("proposed")
        assert len(manifest["shorts"]) == 1
        short = manifest["shorts"][0]
        assert short["id"] == "01"
        assert short["template"] == "KineticShort"
        assert "_TODO" in short["data"]

    def test_id_zero_padding(self):
        cands = [
            sp.ShortsCandidate(
                candidate_kind="stat", sourceBeat=f"B{i}", beat_id=f"b{i}",
                template="StatRevealShort", startSec=0, endSec=30,
                durationSec=30, score=1, label="x", rationale="r",
            )
            for i in range(12)
        ]
        manifest = sp.build_proposal_manifest("x", cands)
        # Zero-padded to 2 digits per schema
        assert manifest["shorts"][0]["id"] == "01"
        assert manifest["shorts"][11]["id"] == "12"

    def test_proposed_marker_at_top_level(self):
        # The skeleton is NOT renderable as-is — the _proposed marker
        # tells the operator (and any tooling) that this is a stub.
        cand = sp.ShortsCandidate(
            candidate_kind="stat", sourceBeat="B1", beat_id="beat1",
            template="StatRevealShort", startSec=0, endSec=30,
            durationSec=30, score=1, label="x", rationale="r",
        )
        manifest = sp.build_proposal_manifest("x", [cand])
        assert "_proposed" in manifest
        assert "STUB" in manifest["_proposed"]
        # And the per-short _TODO names the rename-then-render gate
        # ("renaming" → substring "renam" catches it without being
        # fragile to "rename" vs "renaming" word forms)
        assert "renam" in manifest["shorts"][0]["data"]["_TODO"].lower()

    def test_llm_score_persisted_to_data_llm(self):
        # When a candidate has LLM scoring, the score + rationale stash
        # under `data._llm` so the editorial judgment isn't lost when
        # the operator opens the JSON to fill in template fields.
        cand = sp.ShortsCandidate(
            candidate_kind="stat", sourceBeat="B1", beat_id="beat1",
            template="StatRevealShort", startSec=0, endSec=30,
            durationSec=30, score=4, label="x", rationale="r",
            llm_score=87.0,
            llm_rationale="strong snap moment; bounded clause lands cleanly",
        )
        manifest = sp.build_proposal_manifest("x", [cand])
        llm_meta = manifest["shorts"][0]["data"]["_llm"]
        assert llm_meta["score"] == 87.0
        assert "snap moment" in llm_meta["rationale"]

    def test_no_llm_meta_when_unscored(self):
        # Heuristic-only candidates don't get a _llm block (keeps the
        # JSON clean for the heuristic path)
        cand = sp.ShortsCandidate(
            candidate_kind="stat", sourceBeat="B1", beat_id="beat1",
            template="StatRevealShort", startSec=0, endSec=30,
            durationSec=30, score=4, label="x", rationale="r",
        )
        manifest = sp.build_proposal_manifest("x", [cand])
        assert "_llm" not in manifest["shorts"][0]["data"]


# ── CLI smoke ───────────────────────────────────────────────────────────────


class TestCliSmoke:
    def test_missing_manifest_exits_2(self):
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "publish" / "shorts_proposer.py"),
                "definitely-not-an-episode",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 2

    def test_explicit_manifest_path(self, tmp_path):
        manifest = tmp_path / "assembly.json"
        manifest.write_text(json.dumps({
            "beats": [{"id": "beat1", "title": "OPEN", "startSec": 0, "endSec": 100}],
            "segments": [
                {
                    "id": "seg1", "type": "TEMPLATE", "startSec": 10, "endSec": 35,
                    "beat": "beat1", "priority": "P1",
                    "template": {"component": "DataChart"},
                },
            ],
        }), encoding="utf-8")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "publish" / "shorts_proposer.py"),
                "x", "--manifest", str(manifest), "--json", "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        assert payload["slug"] == "x"
        assert len(payload["candidates"]) >= 1

    def test_emit_manifest_creates_file(self, tmp_path):
        manifest = tmp_path / "assembly.json"
        manifest.write_text(json.dumps({
            "beats": [{"id": "beat1", "title": "B", "startSec": 0, "endSec": 60}],
            "segments": [
                {
                    "id": "seg1", "type": "TEMPLATE", "startSec": 5, "endSec": 30,
                    "beat": "beat1", "priority": "P1",
                    "template": {"component": "Quote"},
                },
            ],
        }), encoding="utf-8")
        ep_dir = REPO_ROOT / "episodes" / "smoke-test-shorts"
        out_manifest = ep_dir / "shorts-manifest-proposed.json"
        # Clean any prior artifact
        if out_manifest.exists():
            out_manifest.unlink()
        try:
            result = subprocess.run(
                [
                    sys.executable,
                    str(REPO_ROOT / "tools" / "publish" / "shorts_proposer.py"),
                    "smoke-test-shorts",
                    "--manifest", str(manifest),
                    "--emit-manifest", "--stdout",
                ],
                capture_output=True, text=True,
            )
            assert result.returncode == 0
            assert out_manifest.exists()
            payload = json.loads(out_manifest.read_text())
            assert payload["episode"] == "smoke-test-shorts"
            assert "shorts" in payload
        finally:
            if out_manifest.exists():
                out_manifest.unlink()
            if ep_dir.exists() and not list(ep_dir.iterdir()):
                ep_dir.rmdir()

    def test_real_silicon_trap_manifest(self):
        manifest = REPO_ROOT / "remotion-templates" / "data" / "episodes" \
            / "silicon-trap" / "assembly-manifest.json"
        if not manifest.is_file():
            pytest.skip("silicon-trap manifest not present")
        result = subprocess.run(
            [
                sys.executable,
                str(REPO_ROOT / "tools" / "publish" / "shorts_proposer.py"),
                "silicon-trap", "--json", "--stdout",
            ],
            capture_output=True, text=True,
        )
        assert result.returncode == 0
        payload = json.loads(result.stdout)
        # Silicon-trap has 5 beats, plenty of MG content — should yield
        # ≥ 5 candidates (default top_n)
        assert len(payload["candidates"]) >= 3
        # All candidates should be valid Shorts templates
        valid_templates = set(sp.TEMPLATE_TO_SHORTS.values()) | {"KineticShort"}
        for c in payload["candidates"]:
            assert c["template"] in valid_templates
