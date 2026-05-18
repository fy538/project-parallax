"""
cost_parser.py — structured per-episode + per-service cost data.

The existing pipeline_validator._read_cost_log returns only per-episode
totals (string slug → float USD). The HTML dashboard needs more: a
per-service breakdown (to show where spend goes), per-row data (to draw
a sparkline if we ever add one), and an empty-state signal so the UI
can render "no spend logged yet" gracefully.

This module reads episodes/COST_LOG.md once and exposes the parsed
shape via a single dataclass. Tolerant of:
  · the `(system)` init row at top of the log
  · arbitrary service labels (anything inside the service column)
  · negative amounts (refunds)
  · variable whitespace inside Markdown cells

Shape:
  CostData
    .total_usd: float                    — sum of all real rows
    .by_episode: dict[slug, float]       — per-episode totals
    .by_service: dict[service, float]    — per-service totals
    .rows: list[CostRow]                 — every parsed row, ordered as
                                           they appear in COST_LOG.md
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
COST_LOG_PATH = ROOT / "episodes" / "COST_LOG.md"


@dataclass
class CostRow:
    """One spend event parsed from COST_LOG.md."""
    date: str               # ISO YYYY-MM-DD
    episode: str            # slug
    service: str            # lowercase
    amount_usd: float
    note: str


@dataclass
class CostData:
    """Parsed COST_LOG.md ready for any consumer (dashboard, reports)."""
    total_usd: float = 0.0
    by_episode: dict[str, float] = field(default_factory=dict)
    by_service: dict[str, float] = field(default_factory=dict)
    rows: list[CostRow] = field(default_factory=list)

    @property
    def is_empty(self) -> bool:
        """True when no real spend rows are logged. Lets the UI render an
        empty-state without special-casing in the renderer."""
        return not self.rows


# Same regex shape as pipeline_validator._read_cost_log, extended to
# also capture the note column. Tolerates negative amounts (refunds).
_ROW_RE = re.compile(
    r"^\|\s*(\d{4}-\d{2}-\d{2})\s*"        # date (group 1)
    r"\|\s*([^|]+?)\s*"                    # episode (group 2)
    r"\|\s*([^|]+?)\s*"                    # service (group 3)
    r"\|\s*(-?\d+(?:\.\d+)?)\s*"           # amount_usd (group 4)
    r"\|\s*(.*?)\s*\|"                     # note (group 5)
)


def load_cost_data(path: Path | None = None) -> CostData:
    """Read COST_LOG.md and return parsed totals + rows. Empty if missing."""
    src = path or COST_LOG_PATH
    if not src.is_file():
        return CostData()
    data = CostData()
    for line in src.read_text(encoding="utf-8").splitlines():
        m = _ROW_RE.match(line)
        if not m:
            continue
        date, episode, service, amount_str, note = m.groups()
        episode = episode.strip()
        # Skip synthetic / system / header rows
        if episode.startswith("(") or episode in ("episode",) or not episode:
            continue
        try:
            amount = float(amount_str)
        except ValueError:
            continue
        service = service.strip().lower()
        row = CostRow(
            date=date,
            episode=episode,
            service=service,
            amount_usd=amount,
            note=note.strip(),
        )
        data.rows.append(row)
        data.total_usd += amount
        data.by_episode[episode] = data.by_episode.get(episode, 0.0) + amount
        data.by_service[service] = data.by_service.get(service, 0.0) + amount
    return data


if __name__ == "__main__":
    d = load_cost_data()
    if d.is_empty:
        print("(COST_LOG.md has no real spend rows yet)")
    else:
        print(f"Total: ${d.total_usd:.2f} across {len(d.rows)} rows")
        print("\nBy episode:")
        for ep, amt in sorted(d.by_episode.items(), key=lambda kv: -kv[1]):
            print(f"  {ep:24}  ${amt:7.2f}")
        print("\nBy service:")
        for svc, amt in sorted(d.by_service.items(), key=lambda kv: -kv[1]):
            print(f"  {svc:24}  ${amt:7.2f}")
