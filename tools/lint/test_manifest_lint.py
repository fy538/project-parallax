"""
Tests for tools/lint/manifest_lint.py — focused on the M-DURATION rule.

Other rules (M-D18, M-CROSSFADE, M-OVERLAP, M-DATAFILE, M-CUE) are exercised
indirectly when manifest_lint runs against real episodes in check-episode.sh
and against pinned fixtures in the smoke tests below. M-DURATION is new and
specifically tested here because it's the only rule that can fire on
otherwise-well-formed manifests.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent))
import manifest_lint  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parent.parent.parent


def _make_manifest(total: float | None, end_secs: list[float]) -> dict:
    """Build a minimal manifest with the given totalDurationSec and segment end times."""
    return {
        "version": "1.0",
        "episode": "test",
        "fps": 30,
        "totalDurationSec": total,
        "narration": {"totalDurationSec": end_secs[-1] if end_secs else 0},
        "segments": [
            {
                "id": f"seg-{i}",
                "type": "TEMPLATE",
                "startSec": 0 if i == 0 else end_secs[i - 1],
                "endSec": end_secs[i],
            }
            for i in range(len(end_secs))
        ],
    }


# ─── M-DURATION rule ─────────────────────────────────────────────────────────


class TestDurationDrift:
    def test_clean_manifest_yields_no_violation(self):
        m = _make_manifest(total=100.0, end_secs=[20, 50, 100.0])
        violations = manifest_lint.check_duration_drift(m, "")
        assert violations == []

    def test_segments_extending_past_declared_fires_error(self):
        # max(endSec)=105, declared=100 → 5s overrun, well above 0.5s tolerance
        m = _make_manifest(total=100.0, end_secs=[20, 50, 105.0])
        violations = manifest_lint.check_duration_drift(m, "")
        assert len(violations) == 1
        v = violations[0]
        assert v.rule == "M-DURATION"
        assert v.severity == "error"
        assert "5.00s past" in v.message
        assert "clipped" in v.message

    def test_segments_short_of_declared_fires_error(self):
        # max(endSec)=95, declared=100 → 5s underrun
        m = _make_manifest(total=100.0, end_secs=[20, 50, 95.0])
        violations = manifest_lint.check_duration_drift(m, "")
        assert len(violations) == 1
        v = violations[0]
        assert "5.00s before" in v.message
        assert "dead air" in v.message

    def test_within_tolerance_passes(self):
        # Off by 0.3s (< 0.5s tolerance) — clean
        m = _make_manifest(total=100.0, end_secs=[20, 50, 100.3])
        assert manifest_lint.check_duration_drift(m, "") == []

    def test_exactly_at_tolerance_boundary_passes(self):
        # The check uses abs(diff) > tolerance, so 0.5s diff passes (not strict <)
        m = _make_manifest(total=100.0, end_secs=[100.5])
        assert manifest_lint.check_duration_drift(m, "") == []

    def test_just_past_tolerance_fires(self):
        m = _make_manifest(total=100.0, end_secs=[100.51])
        assert len(manifest_lint.check_duration_drift(m, "")) == 1

    def test_missing_totalDurationSec_skips_silently(self):
        # Optional field — derived from elsewhere. Don't false-positive.
        m = _make_manifest(total=None, end_secs=[100.0])
        del m["totalDurationSec"]
        assert manifest_lint.check_duration_drift(m, "") == []

    def test_empty_segments_skips_silently(self):
        m = _make_manifest(total=100.0, end_secs=[])
        m["segments"] = []
        assert manifest_lint.check_duration_drift(m, "") == []

    def test_segments_without_endSec_are_ignored(self):
        # HOLD segments may legitimately lack endSec; only those with numeric
        # endSec contribute to the max.
        m = _make_manifest(total=100.0, end_secs=[50, 100.0])
        m["segments"].append({"id": "hold", "type": "HOLD"})  # no endSec
        assert manifest_lint.check_duration_drift(m, "") == []


# ─── Smoke: real episodes are clean under all rules ──────────────────────────


class TestRealEpisodesClean:
    """The full rule suite should produce zero ERRORs on shipped manifests."""

    @pytest.mark.parametrize("slug", ["silicon-trap", "prisoners-dilemma"])
    def test_no_errors_on_real_episode(self, slug):
        manifest_path = (
            REPO_ROOT / "remotion-templates" / "data" / "episodes" / slug / "assembly-manifest.json"
        )
        if not manifest_path.is_file():
            pytest.skip(f"manifest not present for {slug}")
        violations = manifest_lint.lint_manifest(manifest_path)
        errors = [v for v in violations if v.severity == "error"]
        assert errors == [], (
            f"{slug} has {len(errors)} M-* errors: "
            + ", ".join(f"{e.rule}: {e.message[:80]}" for e in errors)
        )


# ─── M-TEXT-ANIM rule (Phase 3 text-animation integration) ─────────────────
# Validates: (a) textAnimation values are canonical; (b) composite patterns
# match their template variant; (c) quote-attribution requires a real named
# attribution; (d) stat-caption with unparseable statValue warns.


def _setup_episode(tmp_path, segments, datafiles):
    """Build a synthetic episode dir with a manifest + dataFile JSONs."""
    episode_dir = tmp_path
    (episode_dir / "assembly-manifest.json").write_text(json.dumps({
        "version": "1.0",
        "episode": "test",
        "fps": 30,
        "narration": {"totalDurationSec": 100},
        "segments": segments,
    }))
    for fname, content in datafiles.items():
        (episode_dir / fname).write_text(json.dumps(content))
    return episode_dir / "assembly-manifest.json"


class TestTextAnimRule:
    def test_canonical_technique_passes(self, tmp_path):
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE",
                "startSec": 0, "endSec": 5,
                "template": {"component": "KineticTypography", "dataFile": "q.json"},
            }],
            datafiles={"q.json": {
                "variant": "quote",
                "text": "...",
                "attribution": "Nash",
                "_direction": {"textAnimation": "quote-attribution"},
            }},
        )
        violations = manifest_lint.check_text_animation_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert violations == []

    def test_unknown_technique_errors(self, tmp_path):
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "startSec": 0, "endSec": 5,
                "template": {"component": "KineticTypography", "dataFile": "q.json"},
            }],
            datafiles={"q.json": {
                "variant": "quote",
                "_direction": {"textAnimation": "made-up-name"},
            }},
        )
        violations = manifest_lint.check_text_animation_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(violations) == 1
        assert violations[0].severity == "error"
        assert "made-up-name" in violations[0].message
        assert violations[0].rule == "M-TEXT-ANIM"

    def test_quote_attribution_on_non_quote_variant_warns(self, tmp_path):
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "startSec": 0, "endSec": 5,
                "template": {"component": "KineticTypography", "dataFile": "x.json"},
            }],
            datafiles={"x.json": {
                "variant": "definition",
                "term": "test",
                "_direction": {"textAnimation": "quote-attribution"},
            }},
        )
        violations = manifest_lint.check_text_animation_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(violations) == 1
        assert violations[0].severity == "warning"
        assert "quote-attribution" in violations[0].message

    def test_quote_attribution_without_attribution_field_warns(self, tmp_path):
        """Channel-voice 'quote' (no named attribution) should NOT use typewriter register."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "startSec": 0, "endSec": 5,
                "template": {"component": "KineticTypography", "dataFile": "cv.json"},
            }],
            datafiles={"cv.json": {
                "variant": "quote",
                "text": "Cooperation isn't a miracle. It's designed.",
                # No attribution field — this is channel voice
                "_direction": {"textAnimation": "quote-attribution"},
            }},
        )
        violations = manifest_lint.check_text_animation_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(violations) == 1
        assert "named `attribution`" in violations[0].message

    def test_quote_attribution_with_empty_attribution_warns(self, tmp_path):
        """Empty-string attribution counts as missing."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "startSec": 0, "endSec": 5,
                "template": {"component": "KineticTypography", "dataFile": "x.json"},
            }],
            datafiles={"x.json": {
                "variant": "quote",
                "text": "...",
                "attribution": "   ",  # whitespace-only
                "_direction": {"textAnimation": "quote-attribution"},
            }},
        )
        violations = manifest_lint.check_text_animation_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(violations) == 1

    def test_definition_reveal_on_quote_warns(self, tmp_path):
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "startSec": 0, "endSec": 5,
                "template": {"component": "KineticTypography", "dataFile": "x.json"},
            }],
            datafiles={"x.json": {
                "variant": "quote",
                "_direction": {"textAnimation": "definition-reveal"},
            }},
        )
        violations = manifest_lint.check_text_animation_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(violations) == 1
        assert "definition-reveal" in violations[0].message

    def test_stat_caption_with_unparseable_value_warns(self, tmp_path):
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "startSec": 0, "endSec": 5,
                "template": {"component": "KineticTypography", "dataFile": "x.json"},
            }],
            datafiles={"x.json": {
                "variant": "statistic",
                "statValue": "many",  # not a number
                "_direction": {"textAnimation": "stat-caption"},
            }},
        )
        violations = manifest_lint.check_text_animation_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(violations) == 1
        assert "unparseable" in violations[0].message

    def test_stat_caption_with_parseable_value_passes(self, tmp_path):
        """Variants of parseable statValue strings — all should be silent."""
        for stat_value in ["82%", "$165B", "1,500", "0", "3.14"]:
            manifest_path = _setup_episode(tmp_path,
                segments=[{
                    "id": "s1", "type": "TEMPLATE", "startSec": 0, "endSec": 5,
                    "template": {"component": "KineticTypography", "dataFile": "x.json"},
                }],
                datafiles={"x.json": {
                    "variant": "statistic",
                    "statValue": stat_value,
                    "_direction": {"textAnimation": "stat-caption"},
                }},
            )
            violations = manifest_lint.check_text_animation_register(
                json.loads(manifest_path.read_text()), manifest_path,
            )
            assert violations == [], f"unexpected violation on statValue={stat_value!r}"

    def test_missing_direction_block_is_silent(self, tmp_path):
        """No _direction block → backwards-compat path; rule should not fire."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "startSec": 0, "endSec": 5,
                "template": {"component": "KineticTypography", "dataFile": "x.json"},
            }],
            datafiles={"x.json": {"variant": "quote", "text": "..."}},
        )
        violations = manifest_lint.check_text_animation_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert violations == []

    def test_real_episodes_have_no_violations(self):
        """Phase 2 backfill should be coherent with the M-TEXT-ANIM rule."""
        for slug in ("silicon-trap", "prisoners-dilemma"):
            manifest_path = (
                REPO_ROOT / "remotion-templates" / "data" / "episodes" / slug
                / "assembly-manifest.json"
            )
            if not manifest_path.is_file():
                continue
            violations = manifest_lint.check_text_animation_register(
                json.loads(manifest_path.read_text()), manifest_path,
            )
            assert violations == [], (
                f"{slug} has M-TEXT-ANIM violations: "
                + "; ".join(v.message for v in violations)
            )


# ─── M-SYNC rule (per-element D17 narration anchoring) ─────────────────────
# Validates: (a) TEMPLATE foreground segments have at least one syncWord;
# (b) per-element D17 components with >1 entities use syncs:[…] not a single sync.


class TestSyncCoverageRule:
    def test_template_with_sync_passes(self, tmp_path):
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "syncWords": ["Taiwan"],
                "template": {"component": "ChoroplethMap", "dataFile": "m.json"},
            }],
            datafiles={"m.json": {"title": "..."}},
        )
        violations = manifest_lint.check_sync_coverage(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert violations == []

    def test_template_without_sync_warns_missing(self, tmp_path):
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                # no syncWords
                "template": {"component": "KineticTypography", "dataFile": "q.json"},
            }],
            datafiles={"q.json": {"text": "..."}},
        )
        violations = manifest_lint.check_sync_coverage(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(violations) == 1
        assert violations[0].rule == "M-SYNC-MISSING"
        assert violations[0].severity == "warning"

    def test_background_segment_skipped(self, tmp_path):
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "background",
                "startSec": 0, "endSec": 5,
                "template": {"component": "ChoroplethMap", "dataFile": "m.json"},
            }],
            datafiles={"m.json": {"title": "..."}},
        )
        violations = manifest_lint.check_sync_coverage(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert violations == []  # background never flagged

    def test_non_template_segment_skipped(self, tmp_path):
        manifest_path = _setup_episode(tmp_path,
            segments=[
                {"id": "s1", "type": "FOOTAGE", "layer": "foreground",
                 "startSec": 0, "endSec": 5},
                {"id": "s2", "type": "HOLD", "layer": "foreground",
                 "startSec": 5, "endSec": 6},
            ],
            datafiles={},
        )
        violations = manifest_lint.check_sync_coverage(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert violations == []  # FOOTAGE / HOLD don't have entrance reveals

    def test_per_element_multi_entity_with_one_sync_warns_count(self, tmp_path):
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "syncWords": ["chokepoint"],  # only ONE sync for a 5-node network
                "template": {"component": "NetworkDiagram", "dataFile": "n.json"},
            }],
            datafiles={"n.json": {
                "nodes": [
                    {"id": "tsmc", "label": "TSMC"},
                    {"id": "apple", "label": "Apple"},
                    {"id": "nvidia", "label": "Nvidia"},
                    {"id": "amd", "label": "AMD"},
                    {"id": "qualcomm", "label": "Qualcomm"},
                ],
                "edges": [],
            }},
        )
        violations = manifest_lint.check_sync_coverage(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        # No M-SYNC-MISSING (has 1 sync), but M-SYNC-COUNT fires.
        assert len(violations) == 1
        assert violations[0].rule == "M-SYNC-COUNT"
        assert "5 entities" in violations[0].message

    def test_per_element_multi_entity_with_multi_sync_passes(self, tmp_path):
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "syncWords": ["Apple", "Nvidia", "AMD"],  # 3 syncs for 3 nodes
                "template": {"component": "NetworkDiagram", "dataFile": "n.json"},
            }],
            datafiles={"n.json": {
                "nodes": [
                    {"id": "a"}, {"id": "b"}, {"id": "c"},
                ],
                "edges": [],
            }},
        )
        violations = manifest_lint.check_sync_coverage(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert violations == []

    def test_per_element_single_entity_with_one_sync_passes(self, tmp_path):
        """A NetworkDiagram with 1 node is fine with 1 sync — no per-element gap."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "syncWords": ["hub"],
                "template": {"component": "NetworkDiagram", "dataFile": "n.json"},
            }],
            datafiles={"n.json": {"nodes": [{"id": "h"}], "edges": []}},
        )
        violations = manifest_lint.check_sync_coverage(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert violations == []

    def test_annotated_image_callout_count_includes_image(self, tmp_path):
        """AnnotatedImage convention: syncPoints[0]=image, [1..N]=callouts.
        So 4 callouts → 5 expected sync cues, not 4."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "syncWords": ["pearl"],  # just one
                "template": {"component": "AnnotatedImage", "dataFile": "img.json"},
            }],
            datafiles={"img.json": {
                "imageSrc": "x.png",
                "callouts": [{"x": 0, "y": 0, "label": "a"},
                             {"x": 0, "y": 0, "label": "b"},
                             {"x": 0, "y": 0, "label": "c"}],
            }},
        )
        violations = manifest_lint.check_sync_coverage(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(violations) == 1
        assert violations[0].rule == "M-SYNC-COUNT"
        assert "4 entities" in violations[0].message  # 3 callouts + 1 image

    def test_horizontal_timeline_pairs_mode_recognized(self, tmp_path):
        """HorizontalTimeline uses 'pairs' for dual mode, 'events' for single."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "syncWords": ["dependence"],
                "template": {"component": "HorizontalTimeline", "dataFile": "t.json"},
            }],
            datafiles={"t.json": {
                "pairs": [{"a": {}, "b": {}}, {"a": {}, "b": {}}, {"a": {}, "b": {}}],
            }},
        )
        violations = manifest_lint.check_sync_coverage(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(violations) == 1
        assert violations[0].rule == "M-SYNC-COUNT"
        assert "3 entities" in violations[0].message


# ─── M-DRIFT-DEFAULT rule (hold-motion register coverage) ───────────────────
# Validates: (a) chart-category + documentary = ERROR (axis tilt); (b)
# AtlasPlate + pan-bearing preset = ERROR (projection shift); (c) out-of-
# register usage = WARNING. Source of truth: HOLD_MOTION_REGISTER.md Section 4.


class TestDriftRegisterRule:
    def test_no_drift_preset_silent(self, tmp_path):
        """Segment without _direction.driftPreset → silent (template default applies)."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "template": {"component": "DataChart", "dataFile": "d.json"},
            }],
            datafiles={"d.json": {}},
        )
        violations = manifest_lint.check_drift_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert violations == []

    def test_chart_with_editorial_passes(self, tmp_path):
        """DataChart with editorial = recommended register, no violation."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "_direction": {"driftPreset": "editorial"},
                "template": {"component": "DataChart", "dataFile": "d.json"},
            }],
            datafiles={"d.json": {}},
        )
        violations = manifest_lint.check_drift_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert violations == []

    def test_chart_with_documentary_errors(self, tmp_path):
        """DataChart + documentary = ERROR (axis-rotation tilt)."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "_direction": {"driftPreset": "documentary"},
                "template": {"component": "DataChart", "dataFile": "d.json"},
            }],
            datafiles={"d.json": {}},
        )
        violations = manifest_lint.check_drift_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(violations) == 1
        assert violations[0].rule == "M-DRIFT-DEFAULT"
        assert violations[0].severity == "error"
        assert "documentary" in violations[0].message
        assert "rotation" in violations[0].message  # mentions the why

    def test_all_chart_components_reject_documentary(self, tmp_path):
        """The full chart-category set should ERROR on documentary."""
        for comp in ["TimeSeriesChart", "BumpChart", "Streamgraph",
                     "BeeswarmChart", "RadarChart", "MarimekkoChart",
                     "PopulationPyramid", "DumbbellPlot"]:
            sub = tmp_path / comp
            sub.mkdir()
            manifest_path = _setup_episode(sub,
                segments=[{
                    "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                    "startSec": 0, "endSec": 5,
                    "_direction": {"driftPreset": "documentary"},
                    "template": {"component": comp, "dataFile": "d.json"},
                }],
                datafiles={"d.json": {}},
            )
            violations = manifest_lint.check_drift_register(
                json.loads(manifest_path.read_text()), manifest_path,
            )
            assert len(violations) == 1, f"{comp} should error on documentary"
            assert violations[0].severity == "error", f"{comp} should be error-severity"

    def test_atlas_plate_with_breathing_passes(self, tmp_path):
        """AtlasPlate + breathing = projection-safe, the correct register."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "_direction": {"driftPreset": "breathing"},
                "template": {"component": "AtlasPlate", "dataFile": "a.json"},
            }],
            datafiles={"a.json": {}},
        )
        violations = manifest_lint.check_drift_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert violations == []

    def test_atlas_plate_with_documentary_errors(self, tmp_path):
        """AtlasPlate + documentary = ERROR (pan shifts projection)."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "_direction": {"driftPreset": "documentary"},
                "template": {"component": "AtlasPlate", "dataFile": "a.json"},
            }],
            datafiles={"a.json": {}},
        )
        violations = manifest_lint.check_drift_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(violations) == 1
        assert violations[0].rule == "M-DRIFT-DEFAULT"
        assert violations[0].severity == "error"
        assert "projection" in violations[0].message

    def test_atlas_plate_with_legacy_normal_errors(self, tmp_path):
        """Legacy 'normal' preset on AtlasPlate also pan-bearing → ERROR."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "_direction": {"driftPreset": "normal"},
                "template": {"component": "AtlasPlate", "dataFile": "a.json"},
            }],
            datafiles={"a.json": {}},
        )
        violations = manifest_lint.check_drift_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(violations) == 1
        assert violations[0].severity == "error"

    def test_photo_montage_with_editorial_warns(self, tmp_path):
        """PhotoMontage + editorial = out-of-register (doctrine says documentary).
        Warning, not error — author may have a reason."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "_direction": {"driftPreset": "editorial"},
                "template": {"component": "PhotoMontage", "dataFile": "p.json"},
            }],
            datafiles={"p.json": {}},
        )
        violations = manifest_lint.check_drift_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(violations) == 1
        assert violations[0].rule == "M-DRIFT-DEFAULT"
        assert violations[0].severity == "warning"

    def test_kinetic_typography_with_documentary_warns(self, tmp_path):
        """KineticTypography + documentary = out-of-register (Reg B is breathing/settle)."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "_direction": {"driftPreset": "documentary"},
                "template": {"component": "KineticTypography", "dataFile": "k.json"},
            }],
            datafiles={"k.json": {}},
        )
        violations = manifest_lint.check_drift_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(violations) == 1
        assert violations[0].severity == "warning"

    def test_background_layer_skipped(self, tmp_path):
        """Background segments aren't subject to drift register (no entrance)."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "background",
                "startSec": 0, "endSec": 5,
                "_direction": {"driftPreset": "documentary"},
                "template": {"component": "DataChart", "dataFile": "d.json"},
            }],
            datafiles={"d.json": {}},
        )
        violations = manifest_lint.check_drift_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert violations == []

    def test_footage_segments_skipped(self, tmp_path):
        """FOOTAGE / HOLD / TRANSITION segments don't have hold-motion registers."""
        manifest_path = _setup_episode(tmp_path,
            segments=[
                {"id": "s1", "type": "FOOTAGE", "layer": "foreground",
                 "startSec": 0, "endSec": 5,
                 "_direction": {"driftPreset": "documentary"}},
            ],
            datafiles={},
        )
        violations = manifest_lint.check_drift_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert violations == []

    def test_unmapped_component_silent(self, tmp_path):
        """Components not in _RECOMMENDED_DRIFT pass silently."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "layer": "foreground",
                "startSec": 0, "endSec": 5,
                "_direction": {"driftPreset": "documentary"},
                "template": {"component": "FutureUnknownTemplate", "dataFile": "f.json"},
            }],
            datafiles={"f.json": {}},
        )
        violations = manifest_lint.check_drift_register(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert violations == []

    def test_real_episodes_clean(self):
        """No existing episode segment has an explicit driftPreset yet, so
        M-DRIFT-DEFAULT should fire zero violations on the current state.
        This guards against accidentally regressing into drift mismatches
        as drift() directives are added."""
        for slug in ("silicon-trap", "prisoners-dilemma"):
            manifest_path = (
                REPO_ROOT / "remotion-templates" / "data" / "episodes" / slug
                / "assembly-manifest.json"
            )
            if not manifest_path.is_file():
                continue
            violations = manifest_lint.check_drift_register(
                json.loads(manifest_path.read_text()), manifest_path,
            )
            assert violations == [], (
                f"{slug} has M-DRIFT-DEFAULT violations: "
                + "; ".join(v.message for v in violations)
            )
