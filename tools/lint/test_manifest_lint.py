"""
Tests for tools/lint/manifest_lint.py.

Covers: M-DURATION, M-D18, M-CROSSFADE, M-OVERLAP, M-DATAFILE, M-CUE, M-BGMODE,
and the transition-grammar / text-animation / drift / sync-coverage rules.
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
                pytest.skip(f"manifest not present for {slug}")
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
                pytest.skip(f"manifest not present for {slug}")
            violations = manifest_lint.check_drift_register(
                json.loads(manifest_path.read_text()), manifest_path,
            )
            assert violations == [], (
                f"{slug} has M-DRIFT-DEFAULT violations: "
                + "; ".join(v.message for v in violations)
            )


# ─── M-TRANSITION-* rules (Phase 9 — TRANSITION_GRAMMAR.md) ─────────────────
# Tests the five sub-rules inside check_transition_grammar():
#   M-TRANSITION-DEPRECATED, M-TRANSITION-IRIS-CHART, M-TRANSITION-DISSOLVE-CREEP,
#   M-TRANSITION-IRIS-OVERUSE, M-TRANSITION-COLOR-WASH-TOKEN


def _trans_seg(
    seg_id: str,
    component: str = "KineticTypography",
    trans_in: str = "cut",
    trans_out: str = "cut",
    extra_trans: dict | None = None,
) -> dict:
    """Build a minimal foreground TEMPLATE segment with an explicit transition dict."""
    t = {"in": trans_in, "out": trans_out, "durationSec": 0.4}
    if extra_trans:
        t.update(extra_trans)
    return {
        "id": seg_id,
        "type": "TEMPLATE",
        "layer": "foreground",
        "startSec": 0,
        "endSec": 5,
        "template": {"component": component, "dataFile": "d.json"},
        "transition": t,
    }


def _manifest_from_segs(segs: list[dict]) -> dict:
    return {
        "version": "1.0",
        "episode": "test",
        "fps": 30,
        "totalDurationSec": 100,
        "narration": {"totalDurationSec": 100},
        "segments": segs,
    }


class TestTransitionGrammar:
    # ── Helpers ──────────────────────────────────────────────────────────────

    def _run(self, segs: list[dict]) -> list[manifest_lint.Violation]:
        return manifest_lint.check_transition_grammar(
            _manifest_from_segs(segs), Path(".")
        )

    def _rules(self, segs: list[dict]) -> set[str]:
        return {v.rule for v in self._run(segs)}

    # ── M-TRANSITION-DEPRECATED ───────────────────────────────────────────────

    def test_deprecated_in_fires_error(self):
        """wipe-left in .in → M-TRANSITION-DEPRECATED error."""
        vs = self._run([_trans_seg("s1", trans_in="wipe-left")])
        assert any(v.rule == "M-TRANSITION-DEPRECATED" and v.severity == "error" for v in vs)
        assert any("wipe-left" in v.message for v in vs)

    def test_deprecated_out_fires_error(self):
        """whip-pan in .out → M-TRANSITION-DEPRECATED error."""
        vs = self._run([_trans_seg("s1", trans_out="whip-pan")])
        assert any(v.rule == "M-TRANSITION-DEPRECATED" and ".out" in v.pointer for v in vs)

    def test_all_deprecated_types_caught(self):
        """Every entry in _DEPRECATED_TRANSITIONS fires on .in."""
        deprecated = list(manifest_lint._DEPRECATED_TRANSITIONS)
        for dtype in deprecated:
            vs = self._run([_trans_seg("s1", trans_in=dtype)])
            rules = self._rules([_trans_seg("s1", trans_in=dtype)])
            assert "M-TRANSITION-DEPRECATED" in rules, f"{dtype!r} not caught"

    def test_deprecated_suggests_replacement(self):
        """Message includes the recommended replacement type."""
        vs = self._run([_trans_seg("s1", trans_in="spatial-zoom")])
        deprecated_vs = [v for v in vs if v.rule == "M-TRANSITION-DEPRECATED"]
        assert any("match-cut" in v.message for v in deprecated_vs)

    def test_canonical_transitions_pass(self):
        """All 8 canonical types (including match-cut-still and color-wash) are not deprecated."""
        canonical = ("cut", "dissolve", "fade", "match-cut", "match-cut-still",
                     "color-wash", "iris")
        for t in canonical:
            # color-wash needs a washColor to avoid M-TRANSITION-COLOR-WASH-TOKEN;
            # we're only testing M-TRANSITION-DEPRECATED here, so filter by rule.
            vs = self._run([_trans_seg("s1", trans_in=t, trans_out=t,
                                       extra_trans={"washColor": "#1C1814"} if t == "color-wash" else None)])
            deprecated_vs = [v for v in vs if v.rule == "M-TRANSITION-DEPRECATED"]
            assert deprecated_vs == [], f"{t!r} incorrectly flagged as deprecated"

    # ── M-TRANSITION-IRIS-CHART ───────────────────────────────────────────────

    def test_iris_in_on_datachart_fires_error(self):
        """iris .in on DataChart → M-TRANSITION-IRIS-CHART error."""
        vs = self._run([_trans_seg("s1", component="DataChart", trans_in="iris")])
        assert any(v.rule == "M-TRANSITION-IRIS-CHART" and v.severity == "error" for v in vs)

    def test_iris_out_on_chart_fires_error(self):
        """iris .out on a chart template also fires."""
        vs = self._run([_trans_seg("s1", component="TimeSeriesChart", trans_out="iris")])
        assert any(v.rule == "M-TRANSITION-IRIS-CHART" and ".out" in v.pointer for v in vs)

    def test_iris_on_non_chart_is_clean(self):
        """iris on a non-chart template (e.g. KineticTypography) is fine."""
        vs = self._run([_trans_seg("s1", component="KineticTypography", trans_in="iris")])
        assert not any(v.rule == "M-TRANSITION-IRIS-CHART" for v in vs)

    def test_iris_chart_message_mentions_focal_point(self):
        """Error message explains the focal-point rationale."""
        vs = self._run([_trans_seg("s1", component="RadarChart", trans_in="iris")])
        iris_vs = [v for v in vs if v.rule == "M-TRANSITION-IRIS-CHART"]
        assert any("focal point" in v.message for v in iris_vs)

    # ── M-TRANSITION-DISSOLVE-CREEP ───────────────────────────────────────────

    def test_two_consecutive_dissolves_ok(self):
        """2 consecutive dissolve-in segments do not trigger creep warning."""
        segs = [_trans_seg(f"s{i}", trans_in="dissolve") for i in range(2)]
        assert "M-TRANSITION-DISSOLVE-CREEP" not in self._rules(segs)

    def test_three_consecutive_dissolves_warns(self):
        """3 consecutive dissolve-in segments → exactly 1 creep warning."""
        segs = [_trans_seg(f"s{i}", trans_in="dissolve") for i in range(3)]
        creep = [v for v in self._run(segs) if v.rule == "M-TRANSITION-DISSOLVE-CREEP"]
        assert len(creep) == 1
        assert creep[0].severity == "warning"

    def test_dissolve_creep_fires_once_for_long_run(self):
        """5 consecutive dissolves → still exactly 1 warning (suppressed after first)."""
        segs = [_trans_seg(f"s{i}", trans_in="dissolve") for i in range(5)]
        creep = [v for v in self._run(segs) if v.rule == "M-TRANSITION-DISSOLVE-CREEP"]
        assert len(creep) == 1

    def test_dissolve_run_reset_by_cut(self):
        """dissolve × 2 → cut × 1 → dissolve × 2: no creep (streak resets)."""
        segs = (
            [_trans_seg(f"d{i}", trans_in="dissolve") for i in range(2)]
            + [_trans_seg("c0", trans_in="cut")]
            + [_trans_seg(f"d{i}", trans_in="dissolve") for i in range(2, 4)]
        )
        assert "M-TRANSITION-DISSOLVE-CREEP" not in self._rules(segs)

    def test_dissolve_creep_pointer_mentions_third_segment(self):
        """The violation pointer or message identifies the segment where run hit 3."""
        segs = [_trans_seg(f"s{i}", trans_in="dissolve") for i in range(4)]
        creep = [v for v in self._run(segs) if v.rule == "M-TRANSITION-DISSOLVE-CREEP"]
        # Third segment (index 2) should be named
        assert "s2" in creep[0].pointer or "s2" in creep[0].message

    # ── M-TRANSITION-IRIS-OVERUSE ─────────────────────────────────────────────

    def test_two_iris_in_transitions_ok(self):
        """2 iris-in transitions episode-wide do not trigger overuse."""
        segs = [_trans_seg(f"s{i}", trans_in="iris") for i in range(2)]
        assert "M-TRANSITION-IRIS-OVERUSE" not in self._rules(segs)

    def test_three_iris_in_transitions_warns(self):
        """3 iris-in transitions → M-TRANSITION-IRIS-OVERUSE warning (fired once)."""
        segs = [_trans_seg(f"s{i}", trans_in="iris") for i in range(3)]
        overuse = [v for v in self._run(segs) if v.rule == "M-TRANSITION-IRIS-OVERUSE"]
        assert len(overuse) == 1
        assert overuse[0].severity == "warning"
        assert "3" in overuse[0].message

    def test_iris_out_not_counted_for_overuse(self):
        """iris .out alone does not count toward the overuse threshold."""
        # 3 segments each with iris .out only → 0 iris-in → no overuse
        segs = [_trans_seg(f"s{i}", trans_out="iris") for i in range(3)]
        assert "M-TRANSITION-IRIS-OVERUSE" not in self._rules(segs)

    def test_iris_overuse_fired_exactly_once(self):
        """Even with many iris-in segments, exactly one overuse violation fires."""
        segs = [_trans_seg(f"s{i}", trans_in="iris") for i in range(10)]
        overuse = [v for v in self._run(segs) if v.rule == "M-TRANSITION-IRIS-OVERUSE"]
        assert len(overuse) == 1

    # ── M-TRANSITION-COLOR-WASH-TOKEN ─────────────────────────────────────────

    def test_color_wash_without_token_warns(self):
        """color-wash .in without washColor → warning."""
        segs = [_trans_seg("s1", trans_in="color-wash")]
        vs = self._run(segs)
        assert any(v.rule == "M-TRANSITION-COLOR-WASH-TOKEN" and v.severity == "warning" for v in vs)

    def test_color_wash_out_without_token_warns(self):
        """color-wash .out without washColor also warns."""
        segs = [_trans_seg("s1", trans_out="color-wash")]
        vs = self._run(segs)
        assert any(v.rule == "M-TRANSITION-COLOR-WASH-TOKEN" for v in vs)

    def test_color_wash_with_token_passes(self):
        """color-wash with washColor present → clean."""
        segs = [_trans_seg("s1", trans_in="color-wash", extra_trans={"washColor": "#1C1814"})]
        vs = self._run(segs)
        assert not any(v.rule == "M-TRANSITION-COLOR-WASH-TOKEN" for v in vs)

    def test_color_wash_message_mentions_brand_token(self):
        """Warning message includes a brand palette example."""
        segs = [_trans_seg("s1", trans_in="color-wash")]
        vs = self._run(segs)
        wash_vs = [v for v in vs if v.rule == "M-TRANSITION-COLOR-WASH-TOKEN"]
        assert any("#1C1814" in v.message or "ink" in v.message for v in wash_vs)

    def test_iris_out_does_not_combine_with_iris_in_for_overuse(self):
        """2 iris-in + 1 iris-out-only = 2 iris-in count → no overuse warning.
        Only .in occurrences count toward the episode-wide threshold."""
        segs = (
            [_trans_seg(f"s{i}", trans_in="iris") for i in range(2)]
            + [_trans_seg("s2", trans_out="iris")]  # .out only — doesn't count
        )
        assert "M-TRANSITION-IRIS-OVERUSE" not in self._rules(segs)

    def test_dissolve_creep_streak_resets_on_segment_with_no_transition_dict(self):
        """A segment with no .transition dict resets the dissolve streak — it
        is treated as a non-dissolve break even though it has no explicit in value."""
        seg_no_trans = {
            "id": "gap", "type": "TEMPLATE", "layer": "foreground",
            "startSec": 0, "endSec": 5,
            "template": {"component": "KineticTypography", "dataFile": "d.json"},
            # deliberately no "transition" key
        }
        segs = (
            [_trans_seg(f"d{i}", trans_in="dissolve") for i in range(2)]
            + [seg_no_trans]
            + [_trans_seg(f"d{i}", trans_in="dissolve") for i in range(2, 4)]
        )
        assert "M-TRANSITION-DISSOLVE-CREEP" not in self._rules(segs)

    # ── Segment without transition dict is silently skipped ───────────────────

    def test_no_transition_dict_skipped(self):
        """Segments missing a .transition dict do not fire any M-TRANSITION-* rule."""
        seg = {
            "id": "s1", "type": "TEMPLATE", "layer": "foreground",
            "startSec": 0, "endSec": 5,
            "template": {"component": "DataChart", "dataFile": "d.json"},
        }
        vs = self._run([seg])
        assert not any(v.rule.startswith("M-TRANSITION") for v in vs)

    # ── Real episodes are clean ───────────────────────────────────────────────

    def test_real_episodes_clean(self):
        """Shipped episode manifests produce zero M-TRANSITION-* ERROR violations.
        Warnings (iris-overuse, dissolve-creep) are advisory and may appear in
        deliberately-structured episodes; errors (deprecated types, iris on charts,
        missing color-wash token) are blocking and must be absent."""
        for slug in ("silicon-trap", "prisoners-dilemma"):
            manifest_path = (
                REPO_ROOT / "remotion-templates" / "data" / "episodes" / slug
                / "assembly-manifest.json"
            )
            if not manifest_path.is_file():
                pytest.skip(f"manifest not present for {slug}")
            violations = manifest_lint.check_transition_grammar(
                json.loads(manifest_path.read_text()), manifest_path,
            )
            errors = [v for v in violations if v.severity == "error"]
            assert errors == [], (
                f"{slug} has blocking M-TRANSITION-* errors: "
                + "; ".join(v.rule + ": " + v.message[:80] for v in errors)
            )


# ─── M-D18: music must not enter before the opening setup concludes ──────────

class TestD18Rule:
    """check_d18_music_hold fires when music precedes the opening setup end."""

    def _run(self, manifest: dict) -> list:
        return manifest_lint.check_d18_music_hold(manifest, "")

    def test_no_music_tracks_passes(self):
        """Manifest with no musicBed → no violations."""
        m = {"segments": [], "musicBed": {"tracks": []}}
        assert self._run(m) == []

    def test_music_after_title_transition_passes(self):
        """Music starting after a TitleTransition at t=0 is valid (D18 pattern A)."""
        m = {
            "segments": [
                {
                    "id": "s-title", "type": "TRANSITION", "layer": "foreground",
                    "startSec": 0, "endSec": 8,
                    "template": {"component": "TitleTransition", "dataFile": "t.json"},
                },
            ],
            "musicBed": {"tracks": [{"startSec": 8, "endSec": 60}]},
        }
        assert self._run(m) == []

    def test_music_before_title_transition_end_errors(self):
        """Music starting before the TitleTransition ends violates M-D18."""
        m = {
            "segments": [
                {
                    "id": "s-title", "type": "TRANSITION", "layer": "foreground",
                    "startSec": 0, "endSec": 10,
                    "template": {"component": "TitleTransition", "dataFile": "t.json"},
                },
            ],
            "musicBed": {"tracks": [{"startSec": 5, "endSec": 60}]},
        }
        vs = self._run(m)
        assert len(vs) == 1
        assert vs[0].rule == "M-D18"
        assert vs[0].severity == "error"

    def test_music_after_cold_open_passes(self):
        """Second background content starts at 12s; music at 12s is fine."""
        m = {
            "segments": [
                {"id": "b1", "type": "FOOTAGE", "layer": "background", "startSec": 0, "endSec": 8},
                {"id": "b2", "type": "FOOTAGE", "layer": "background", "startSec": 8, "endSec": 20},
            ],
            "musicBed": {"tracks": [{"startSec": 8, "endSec": 120}]},
        }
        assert self._run(m) == []

    def test_music_during_cold_open_errors(self):
        """Music starting before the second background segment violates M-D18."""
        m = {
            "segments": [
                {"id": "b1", "type": "FOOTAGE", "layer": "background", "startSec": 0, "endSec": 8},
                {"id": "b2", "type": "FOOTAGE", "layer": "background", "startSec": 8, "endSec": 20},
            ],
            "musicBed": {"tracks": [{"startSec": 4, "endSec": 120}]},
        }
        vs = self._run(m)
        assert len(vs) == 1
        assert vs[0].rule == "M-D18"


# ─── M-CROSSFADE: crossfades land near beat boundaries ───────────────────────

class TestCrossfadeRule:
    """check_crossfade_beat_alignment warns when a crossfade midpoint drifts."""

    def _run(self, manifest: dict) -> list:
        return manifest_lint.check_crossfade_beat_alignment(manifest, "")

    def test_single_track_no_crossfade(self):
        """One track means zero crossfades — no violation possible."""
        m = {
            "musicBed": {"tracks": [{"startSec": 0, "endSec": 60}]},
            "beats": [{"startSec": 0, "endSec": 30}, {"startSec": 30, "endSec": 60}],
        }
        assert self._run(m) == []

    def test_no_beats_skips(self):
        """No beat list → rule returns early (nothing to align against)."""
        m = {
            "musicBed": {"tracks": [
                {"startSec": 0, "endSec": 30},
                {"startSec": 28, "endSec": 60},
            ]},
            "beats": [],
        }
        assert self._run(m) == []

    def test_crossfade_on_beat_passes(self):
        """Crossfade midpoint == beat boundary → no warning."""
        # Track A ends at 30, Track B starts at 30 → midpoint = 30.
        # Beat boundary at 30 → delta = 0 < 5s tolerance.
        m = {
            "musicBed": {"tracks": [
                {"startSec": 0, "endSec": 30},
                {"startSec": 30, "endSec": 60},
            ]},
            "beats": [{"startSec": 0, "endSec": 30}, {"startSec": 30, "endSec": 60}],
        }
        assert self._run(m) == []

    def test_crossfade_far_from_beat_warns(self):
        """Crossfade midpoint 20s from nearest beat boundary → M-CROSSFADE warning."""
        # A ends at 50, B starts at 50 → midpoint = 50.
        # Beats at 0 and 30 → nearest = 30, delta = 20 > 5.
        m = {
            "musicBed": {"tracks": [
                {"startSec": 0, "endSec": 50},
                {"startSec": 50, "endSec": 90},
            ]},
            "beats": [{"startSec": 0, "endSec": 30}, {"startSec": 30, "endSec": 60}],
        }
        vs = self._run(m)
        assert len(vs) == 1
        assert vs[0].rule == "M-CROSSFADE"
        assert vs[0].severity == "warning"


# ─── M-OVERLAP: foreground segments overlap without a declared transition ─────

class TestOverlapRule:
    """check_foreground_overlap_without_transition catches raw overlaps."""

    def _run(self, segments: list) -> list:
        return manifest_lint.check_foreground_overlap_without_transition(
            {"segments": segments}, ""
        )

    def test_sequential_segments_pass(self):
        """Non-overlapping foreground segments → no violation."""
        segs = [
            {"id": "s1", "type": "TEMPLATE", "layer": "foreground",
             "startSec": 0, "endSec": 5},
            {"id": "s2", "type": "TEMPLATE", "layer": "foreground",
             "startSec": 5, "endSec": 10},
        ]
        assert self._run(segs) == []

    def test_overlap_with_transition_passes(self):
        """Overlapping segments that declare transition.out → no violation."""
        segs = [
            {"id": "s1", "type": "TEMPLATE", "layer": "foreground",
             "startSec": 0, "endSec": 7,
             "transition": {"out": "dissolve"}},
            {"id": "s2", "type": "TEMPLATE", "layer": "foreground",
             "startSec": 5, "endSec": 12},
        ]
        assert self._run(segs) == []

    def test_bare_overlap_errors(self):
        """Overlapping foreground TEMPLATEs with no transition → M-OVERLAP error."""
        segs = [
            {"id": "s1", "type": "TEMPLATE", "layer": "foreground",
             "startSec": 0, "endSec": 7},
            {"id": "s2", "type": "TEMPLATE", "layer": "foreground",
             "startSec": 5, "endSec": 12},
        ]
        vs = self._run(segs)
        assert len(vs) == 1
        assert vs[0].rule == "M-OVERLAP"
        assert vs[0].severity == "error"

    def test_hold_segments_ignored(self):
        """HOLD-type segments skip the overlap check."""
        segs = [
            {"id": "s1", "type": "TEMPLATE", "layer": "foreground",
             "startSec": 0, "endSec": 7},
            {"id": "h1", "type": "HOLD", "layer": "foreground",
             "startSec": 5, "endSec": 10},
        ]
        assert self._run(segs) == []

    def test_background_segments_ignored(self):
        """Background-layer overlap is not checked."""
        segs = [
            {"id": "b1", "type": "TEMPLATE", "layer": "background",
             "startSec": 0, "endSec": 7},
            {"id": "b2", "type": "TEMPLATE", "layer": "background",
             "startSec": 5, "endSec": 12},
        ]
        assert self._run(segs) == []


# ─── M-DATAFILE: referenced data files must exist on disk ────────────────────

class TestDatafileRule:
    """check_datafile_exists fires when a template.dataFile is missing."""

    def test_existing_file_passes(self, tmp_path):
        """Segment referencing a present dataFile → no violation."""
        (tmp_path / "data.json").write_text("{}")
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "startSec": 0, "endSec": 5,
                "template": {"component": "StatReveal", "dataFile": "data.json"},
            }],
            datafiles={},
        )
        vs = manifest_lint.check_datafile_exists(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert vs == []

    def test_missing_file_errors(self, tmp_path):
        """Segment referencing a non-existent dataFile → M-DATAFILE error."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "TEMPLATE", "startSec": 0, "endSec": 5,
                "template": {"component": "StatReveal", "dataFile": "missing.json"},
            }],
            datafiles={},
        )
        vs = manifest_lint.check_datafile_exists(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(vs) == 1
        assert vs[0].rule == "M-DATAFILE"
        assert vs[0].severity == "error"
        assert "missing.json" in vs[0].message

    def test_no_datafile_field_passes(self, tmp_path):
        """Segment without a template.dataFile field → no violation."""
        manifest_path = _setup_episode(tmp_path,
            segments=[{
                "id": "s1", "type": "FOOTAGE", "startSec": 0, "endSec": 5,
            }],
            datafiles={},
        )
        vs = manifest_lint.check_datafile_exists(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert vs == []


# ─── M-CUE: soundCue / textureCue types must be canonical ────────────────────

class TestCueTypesRule:
    """check_cue_types_canonical warns on non-canonical cue type strings."""

    def _run(self, segments: list) -> list:
        return manifest_lint.check_cue_types_canonical({"segments": segments}, "")

    def test_canonical_sound_cue_passes(self):
        segs = [{"id": "s1", "soundCue": {"type": "stat-reveal", "timeSec": 2}}]
        assert self._run(segs) == []

    def test_canonical_texture_cue_passes(self):
        segs = [{"id": "s1", "textureCues": [{"type": "bar-grow", "timeSec": 1}]}]
        assert self._run(segs) == []

    def test_unknown_sound_cue_warns(self):
        segs = [{"id": "s1", "soundCue": {"type": "laser-blast", "timeSec": 2}}]
        vs = self._run(segs)
        assert len(vs) == 1
        assert vs[0].rule == "M-CUE"
        assert vs[0].severity == "warning"
        assert "laser-blast" in vs[0].message

    def test_unknown_texture_cue_warns(self):
        segs = [{"id": "s1", "textureCues": [{"type": "magic-sparkle", "timeSec": 1}]}]
        vs = self._run(segs)
        assert len(vs) == 1
        assert vs[0].rule == "M-CUE"
        assert vs[0].severity == "warning"

    def test_secondary_sound_cue_canonical_passes(self):
        segs = [{"id": "s1", "soundCueSecondary": {"type": "quote-bell", "timeSec": 3}}]
        assert self._run(segs) == []

    def test_secondary_sound_cue_unknown_warns(self):
        segs = [{"id": "s1", "soundCueSecondary": {"type": "drum-fill", "timeSec": 3}}]
        vs = self._run(segs)
        assert len(vs) == 1
        assert vs[0].rule == "M-CUE"

    def test_multiple_texture_cues_one_bad_warns_once(self):
        segs = [{"id": "s1", "textureCues": [
            {"type": "dot-click", "timeSec": 1},
            {"type": "made-up", "timeSec": 2},
        ]}]
        vs = self._run(segs)
        assert len(vs) == 1

    def test_no_cues_passes(self):
        segs = [{"id": "s1", "type": "TEMPLATE", "startSec": 0, "endSec": 5}]
        assert self._run(segs) == []


# ─── M-BGMODE: backgroundVariant must be consistent within a beat ─────────────

class TestBgmodeRule:
    """check_bgmode_consistency warns when a beat mixes light/dark variants."""

    def test_same_variant_passes(self, tmp_path):
        """Two segments in the same beat, both light → no warning."""
        manifest_path = _setup_episode(tmp_path,
            segments=[
                {"id": "s1", "type": "TEMPLATE", "layer": "foreground",
                 "startSec": 0, "endSec": 5, "beat": "B1",
                 "template": {"component": "StatReveal", "dataFile": "d1.json"}},
                {"id": "s2", "type": "TEMPLATE", "layer": "foreground",
                 "startSec": 5, "endSec": 10, "beat": "B1",
                 "template": {"component": "StatReveal", "dataFile": "d2.json"}},
            ],
            datafiles={
                "d1.json": {"backgroundVariant": "light"},
                "d2.json": {"backgroundVariant": "light"},
            },
        )
        vs = manifest_lint.check_bgmode_consistency(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert vs == []

    def test_mixed_variants_warns(self, tmp_path):
        """One light + one dark segment in beat B1 → M-BGMODE warning."""
        manifest_path = _setup_episode(tmp_path,
            segments=[
                {"id": "s1", "type": "TEMPLATE", "layer": "foreground",
                 "startSec": 0, "endSec": 5, "beat": "B1",
                 "template": {"component": "StatReveal", "dataFile": "d1.json"}},
                {"id": "s2", "type": "TEMPLATE", "layer": "foreground",
                 "startSec": 5, "endSec": 10, "beat": "B1",
                 "template": {"component": "StatReveal", "dataFile": "d2.json"}},
            ],
            datafiles={
                "d1.json": {"backgroundVariant": "light"},
                "d2.json": {"backgroundVariant": "dark"},
            },
        )
        vs = manifest_lint.check_bgmode_consistency(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(vs) == 1
        assert vs[0].rule == "M-BGMODE"
        assert vs[0].severity == "warning"
        assert "B1" in vs[0].pointer

    def test_no_beat_field_skipped(self, tmp_path):
        """Segments without a beat field are silently skipped."""
        manifest_path = _setup_episode(tmp_path,
            segments=[
                {"id": "s1", "type": "TEMPLATE", "layer": "foreground",
                 "startSec": 0, "endSec": 5,
                 "template": {"component": "StatReveal", "dataFile": "d1.json"}},
            ],
            datafiles={"d1.json": {"backgroundVariant": "dark"}},
        )
        vs = manifest_lint.check_bgmode_consistency(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert vs == []

    def test_background_layer_excluded(self, tmp_path):
        """Background-layer segments are excluded from the mode check."""
        manifest_path = _setup_episode(tmp_path,
            segments=[
                {"id": "b1", "type": "TEMPLATE", "layer": "background",
                 "startSec": 0, "endSec": 5, "beat": "B1",
                 "template": {"component": "StatReveal", "dataFile": "d1.json"}},
                {"id": "f1", "type": "TEMPLATE", "layer": "foreground",
                 "startSec": 0, "endSec": 5, "beat": "B1",
                 "template": {"component": "StatReveal", "dataFile": "d2.json"}},
            ],
            datafiles={
                "d1.json": {"backgroundVariant": "dark"},
                "d2.json": {"backgroundVariant": "light"},
            },
        )
        vs = manifest_lint.check_bgmode_consistency(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        # Only d2.json (foreground) participates — single-variant beat → no warning.
        assert vs == []

    def test_different_beats_independent(self, tmp_path):
        """Light in B1 and dark in B2 are two separate beats — no M-BGMODE."""
        manifest_path = _setup_episode(tmp_path,
            segments=[
                {"id": "s1", "type": "TEMPLATE", "layer": "foreground",
                 "startSec": 0, "endSec": 5, "beat": "B1",
                 "template": {"component": "StatReveal", "dataFile": "d1.json"}},
                {"id": "s2", "type": "TEMPLATE", "layer": "foreground",
                 "startSec": 5, "endSec": 10, "beat": "B2",
                 "template": {"component": "StatReveal", "dataFile": "d2.json"}},
            ],
            datafiles={
                "d1.json": {"backgroundVariant": "light"},
                "d2.json": {"backgroundVariant": "dark"},
            },
        )
        vs = manifest_lint.check_bgmode_consistency(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert vs == []


# ─── M-MANIFEST-STALE: script file newer than the manifest ────────────────────

class TestManifestStaleness:
    """check_manifest_staleness compares script mtime to manifest mtime."""

    def _make_repo(self, tmp_path, *, script_mtime: float, manifest_mtime: float):
        """Build a synthetic repo with script + manifest. Returns manifest_path."""
        import os
        slug = "test-ep"
        script_dir = tmp_path / "episodes" / slug
        script_dir.mkdir(parents=True)
        script_file = script_dir / "script-v1-production.md"
        script_file.write_text("# script")
        os.utime(script_file, (script_mtime, script_mtime))
        manifest_dir = tmp_path / "remotion-templates" / "data" / "episodes" / slug
        manifest_dir.mkdir(parents=True)
        manifest_path = manifest_dir / "assembly-manifest.json"
        manifest_path.write_text(json.dumps({"version": "1.0", "episode": slug, "segments": []}))
        os.utime(manifest_path, (manifest_mtime, manifest_mtime))
        return manifest_path

    def test_script_newer_warns(self, tmp_path, monkeypatch):
        """Script edited 2 h after manifest → M-MANIFEST-STALE warning."""
        manifest_mtime = 1_700_000_000.0
        script_mtime = manifest_mtime + 2 * 3600
        manifest_path = self._make_repo(tmp_path,
                                        script_mtime=script_mtime,
                                        manifest_mtime=manifest_mtime)
        monkeypatch.setattr(manifest_lint, "REPO_ROOT_DIR", tmp_path)

        vs = manifest_lint.check_manifest_staleness(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert len(vs) == 1
        assert vs[0].rule == "M-MANIFEST-STALE"
        assert vs[0].severity == "warning"
        assert "newer" in vs[0].message

    def test_manifest_newer_passes(self, tmp_path, monkeypatch):
        """Manifest regenerated after the latest script edit → no warning."""
        script_mtime = 1_700_000_000.0
        manifest_mtime = script_mtime + 600  # 10 min later
        manifest_path = self._make_repo(tmp_path,
                                        script_mtime=script_mtime,
                                        manifest_mtime=manifest_mtime)
        monkeypatch.setattr(manifest_lint, "REPO_ROOT_DIR", tmp_path)

        vs = manifest_lint.check_manifest_staleness(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert vs == []

    def test_within_tolerance_passes(self, tmp_path, monkeypatch):
        """Script saved 30 s after manifest = same edit session, no warning."""
        manifest_mtime = 1_700_000_000.0
        script_mtime = manifest_mtime + 30
        manifest_path = self._make_repo(tmp_path,
                                        script_mtime=script_mtime,
                                        manifest_mtime=manifest_mtime)
        monkeypatch.setattr(manifest_lint, "REPO_ROOT_DIR", tmp_path)

        vs = manifest_lint.check_manifest_staleness(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert vs == []

    def test_no_script_dir_passes(self, tmp_path, monkeypatch):
        """Manifest exists but no episodes/<slug>/ working dir → no violation."""
        slug = "test-ep"
        manifest_dir = tmp_path / "remotion-templates" / "data" / "episodes" / slug
        manifest_dir.mkdir(parents=True)
        manifest_path = manifest_dir / "assembly-manifest.json"
        manifest_path.write_text(json.dumps({"version": "1.0", "episode": slug, "segments": []}))
        monkeypatch.setattr(manifest_lint, "REPO_ROOT_DIR", tmp_path)

        vs = manifest_lint.check_manifest_staleness(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert vs == []

    def test_drafts_dir_ignored(self, tmp_path, monkeypatch):
        """Old script in drafts/ subdir doesn't trigger the rule."""
        import os
        slug = "test-ep"
        manifest_mtime = 1_700_000_000.0
        script_dir = tmp_path / "episodes" / slug
        drafts_dir = script_dir / "drafts"
        drafts_dir.mkdir(parents=True)
        old_script = drafts_dir / "script-v1-production.md"
        old_script.write_text("draft")
        os.utime(old_script, (manifest_mtime + 10000, manifest_mtime + 10000))
        manifest_dir = tmp_path / "remotion-templates" / "data" / "episodes" / slug
        manifest_dir.mkdir(parents=True)
        manifest_path = manifest_dir / "assembly-manifest.json"
        manifest_path.write_text(json.dumps({"version": "1.0", "episode": slug, "segments": []}))
        os.utime(manifest_path, (manifest_mtime, manifest_mtime))
        monkeypatch.setattr(manifest_lint, "REPO_ROOT_DIR", tmp_path)

        vs = manifest_lint.check_manifest_staleness(
            json.loads(manifest_path.read_text()), manifest_path,
        )
        assert vs == []  # drafts/ excluded from glob
