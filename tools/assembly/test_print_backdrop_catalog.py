"""Tests for print_backdrop_catalog.py."""

import subprocess
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[2]
_ASSEMBLY = Path(__file__).resolve().parent
_TOOLS_SHARED = ROOT / "tools" / "shared"
sys.path.insert(0, str(_TOOLS_SHARED))
sys.path.insert(0, str(_ASSEMBLY))

from backdrop_manifest import derive_chart_fit, passes_chart_at_least  # noqa: E402

from print_backdrop_catalog import load_backdrops, passes_filters  # noqa: E402


def test_load_backdrops_has_night_grid():
    ids = {row["id"] for row in load_backdrops() if isinstance(row, dict) and "id" in row}
    assert "night-grid" in ids
    assert "cartographic" in ids


def test_passes_filters_dark_register_tag():
    rows = load_backdrops()
    night = next(r for r in rows if r.get("id") == "night-grid")
    carto = next(r for r in rows if r.get("id") == "cartographic")
    req = frozenset({"dark-register"})
    assert passes_filters(night, require_tags=req, tone_prefix=None)
    assert not passes_filters(carto, require_tags=req, tone_prefix=None)


def test_passes_filters_tone_prefix_dark():
    rows = load_backdrops()
    night_ops = next(r for r in rows if r.get("id") == "night-operations")
    carto = next(r for r in rows if r.get("id") == "cartographic")
    assert passes_filters(night_ops, require_tags=frozenset(), tone_prefix="dark")
    assert not passes_filters(carto, require_tags=frozenset(), tone_prefix="dark")


def test_derive_chart_fit_density_defaults():
    rows = load_backdrops()
    reading = next(r for r in rows if r.get("id") == "reading-room")
    carto = next(r for r in rows if r.get("id") == "cartographic")
    assert derive_chart_fit(reading) == "low"
    assert derive_chart_fit(carto) == "high"


def test_derive_chart_fit_explicit_override():
    rows = load_backdrops()
    strat = next(r for r in rows if r.get("id") == "strategy-grid")
    assert strat.get("density") == "medium"
    assert derive_chart_fit(strat) == "high"


def test_passes_chart_at_least_ranking():
    rows = load_backdrops()
    reading = next(r for r in rows if r.get("id") == "reading-room")
    carto = next(r for r in rows if r.get("id") == "cartographic")
    assert passes_chart_at_least(reading, "low")
    assert not passes_chart_at_least(reading, "medium")
    assert passes_chart_at_least(carto, "high")


def test_passes_filters_multi_tag_and():
    rows = load_backdrops()
    night_grid = next(r for r in rows if r.get("id") == "night-grid")
    assert passes_filters(
        night_grid,
        require_tags=frozenset({"dark-register", "grid"}),
        tone_prefix=None,
    )
    assert not passes_filters(
        night_grid,
        require_tags=frozenset({"dark-register", "maritime"}),
        tone_prefix=None,
    )


@pytest.mark.parametrize(
    "extra_args,expect_in,expect_out",
    [
        (["--dark-register"], ["night-grid", "night-operations"], ["cartographic"]),
        (
            ["--tag", "dark-register", "--tag", "grid"],
            ["night-grid"],
            ["night-operations", "cartographic"],
        ),
        (
            ["--chart-at-least", "high", "--dark-register"],
            ["night-grid", "night-operations"],
            ["archive-nocturne"],
        ),
    ],
)
def test_cli_filters(extra_args, expect_in, expect_out):
    cmd = [sys.executable, str(Path(__file__).parent / "print_backdrop_catalog.py"), *extra_args]
    proc = subprocess.run(cmd, cwd=str(ROOT), capture_output=True, text=True, check=False)
    assert proc.returncode == 0, proc.stderr
    out = proc.stdout
    for s in expect_in:
        assert s in out
    for s in expect_out:
        assert s not in out
