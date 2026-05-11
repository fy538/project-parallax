"""
Backdrop manifest helpers — chartFit derivation + high-clutter template allowlist.

Used by tools/assembly/generate_manifest.py (warnings) and print_backdrop_catalog.py.
Pairing semantics: remotion-templates/design-references/backdrops/BACKDROP_CHART_PAIRING.md
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

CHART_RANK: dict[str, int] = {"low": 1, "medium": 2, "high": 3}

CHART_FIT_HINT: dict[str, str] = {
    "high": (
        "Dense charts OK if hero quiet zone respected (Sankey, network, multi-series)."
    ),
    "medium": "Typical charts; avoid max-clutter dashboards.",
    "low": "Sparse foreground — simple bars, big type; skip busy diagrams.",
}

# Conservative: templates that often carry many marks / small labels / network geometry.
# Keep in sync with BACKDROP_CHART_PAIRING.md intent (not every invocation is dense).
HIGH_CLUTTER_TEMPLATE_COMPONENTS: frozenset[str] = frozenset(
    {
        "BayesianUpdate",
        "BifurcationRoute",
        "ChoroplethMap",
        "DataChart",
        "DecisionTree",
        "DualTimeline",
        "DuelingFrameworks",
        "EscalationLadder",
        "FrameworkDiagram",
        "GameBoard",
        "HorizontalTimeline",
        "NetworkDiagram",
        "PricingWaterfall",
        "ProbabilityGauge",
        "RadarChart",
        "RouteAnimation",
        "SankeyFlow",
        "SplitComposition",
        "StrategicLandscape",
        "TimeSeriesChart",
        "TimelineMorph",
    },
)

_BACKDROP_INDEX: dict[str, dict[str, Any]] | None = None


def _repo_root() -> Path:
    # tools/shared/backdrop_manifest.py → …/project-parallax
    return Path(__file__).resolve().parent.parent.parent


def backdrop_manifest_path() -> Path:
    return _repo_root() / "remotion-templates" / "data" / "backdrop-manifest.json"


def load_backdrop_index() -> dict[str, dict[str, Any]]:
    """id → manifest row. Cached."""
    global _BACKDROP_INDEX
    if _BACKDROP_INDEX is not None:
        return _BACKDROP_INDEX
    path = backdrop_manifest_path()
    _BACKDROP_INDEX = {}
    if not path.is_file():
        return _BACKDROP_INDEX
    with path.open(encoding="utf-8") as f:
        payload = json.load(f)
    rows = payload.get("backdrops")
    if not isinstance(rows, list):
        return _BACKDROP_INDEX
    for row in rows:
        if isinstance(row, dict) and isinstance(row.get("id"), str):
            _BACKDROP_INDEX[row["id"]] = row
    return _BACKDROP_INDEX


def get_backdrop_row(backdrop_id: str) -> dict[str, Any] | None:
    return load_backdrop_index().get(backdrop_id)


def derive_chart_fit(row: dict[str, Any]) -> str:
    explicit = row.get("chartFit")
    if explicit in CHART_RANK:
        return str(explicit)
    density = row.get("density") or "medium"
    if density == "quiet":
        return "high"
    if density == "busy":
        return "low"
    return "medium"


def passes_chart_at_least(row: dict[str, Any], minimum: str | None) -> bool:
    if minimum is None:
        return True
    if minimum not in CHART_RANK:
        raise ValueError(f"Invalid chart-at-least level {minimum!r}")
    return CHART_RANK[derive_chart_fit(row)] >= CHART_RANK[minimum]


def warn_clutter_backdrop_mismatch(backdrop_id: str, component: str) -> None:
    """
    Emit stderr WARNING when a low-chartFit backdrop is paired with a template
    that usually carries dense foreground graphics.
    """
    row = get_backdrop_row(backdrop_id)
    if row is None:
        return
    if component not in HIGH_CLUTTER_TEMPLATE_COMPONENTS:
        return
    if derive_chart_fit(row) != "low":
        return
    print(
        "WARNING: "
        f"[BACKDROP: {backdrop_id}] resolves to chartFit low (busy / sparse-foreground plate); "
        f"{component} is typically graphically dense — risk of muddy overlap with the PNG. "
        "Prefer a plate with chartFit high/medium or run "
        "`python3 tools/assembly/print_backdrop_catalog.py --chart-at-least high`. "
        "See remotion-templates/design-references/backdrops/BACKDROP_CHART_PAIRING.md.",
        file=sys.stderr,
    )
