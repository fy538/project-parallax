"""Tests for backdrop_manifest.py."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from backdrop_manifest import (  # noqa: E402
    backdrop_manifest_path,
    derive_chart_fit,
    warn_clutter_backdrop_mismatch,
)


def test_backdrop_manifest_path_points_at_repo_data():
    root = Path(__file__).resolve().parent.parent.parent
    expected = root / "remotion-templates" / "data" / "backdrop-manifest.json"
    assert backdrop_manifest_path() == expected
    assert expected.is_file()


def test_warn_clutter_emits_only_for_low_chartfit_and_dense_component(capsys):
    warn_clutter_backdrop_mismatch("reading-room", "SankeyFlow")
    err = capsys.readouterr().err
    assert "chartFit low" in err

    warn_clutter_backdrop_mismatch("reading-room", "KineticTypography")
    assert capsys.readouterr().err == ""

    warn_clutter_backdrop_mismatch("cartographic", "SankeyFlow")
    assert capsys.readouterr().err == ""


def test_derive_chart_fit_busy_density():
    assert derive_chart_fit({"density": "busy"}) == "low"
    assert derive_chart_fit({"density": "quiet"}) == "high"
