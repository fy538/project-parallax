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
