"""
topics_parser.py — extract structured topic data from project/IDEAS.md.

IDEAS.md is the hand-curated topic pipeline: signal-watch list, topic
lifecycle, sequencing notes. This parser pulls out the structured tables
so other tools (pipeline_html.py) can render them without re-implementing
the Markdown walk.

What it extracts:
  · launch_sequence — list of {ep, slug, format, arc, pipeline_state}
    rows from the "Launch Sequence" table
  · signal_watch — list of {signal, discovery_path, first_noticed, sources,
    potential_arc, notes} rows from the "Signal Watch List" table
  · lifecycle_states — ordered list of (state_label, description) tuples
    from the lifecycle code-block. Used to render a funnel.

Hand-edited prose sections (Throughline, Format variety, Sequencing notes)
are not parsed — they live in the file for human readers.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IDEAS_PATH = ROOT / "project" / "IDEAS.md"


@dataclass
class LaunchEpisode:
    """One row from the Launch Sequence table."""
    ep_number: str          # "1", "2", "3" ...
    slug: str               # bare slug, no backticks
    format: str
    arc: str
    pipeline_state: str     # raw text with emoji + status


@dataclass
class SignalEntry:
    """One row from the Signal Watch List table."""
    signal: str
    discovery_path: str
    first_noticed: str
    sources: str
    potential_arc: str
    notes: str


@dataclass
class LifecycleState:
    """One state from the topic-lifecycle code-block."""
    emoji: str              # "📡", "🔄", "✅", "🔬", "📋", "🎬"
    label: str              # "SIGNAL DETECTED", "INCUBATING", ...
    description: str        # the prose after the arrow


@dataclass
class TopicsData:
    """Everything topics_parser extracts from IDEAS.md."""
    launch_sequence: list[LaunchEpisode] = field(default_factory=list)
    signal_watch: list[SignalEntry] = field(default_factory=list)
    lifecycle_states: list[LifecycleState] = field(default_factory=list)


# ── Parser helpers ───────────────────────────────────────────────────────────


_TABLE_ROW_RE = re.compile(r"^\|(.+)\|\s*$")
_TABLE_SEP_RE = re.compile(r"^\|[\s\-:|]+\|\s*$")


def _split_cells(row_line: str) -> list[str]:
    """Split a Markdown table row into trimmed cell values."""
    inner = row_line.strip().strip("|")
    return [c.strip() for c in inner.split("|")]


def _strip_backticks(s: str) -> str:
    """Remove leading/trailing backticks from a cell value (for slug fields)."""
    return s.strip().strip("`")


def _find_table_rows(lines: list[str], header_predicate) -> list[list[str]]:
    """Scan `lines` for a Markdown table whose header row matches `header_predicate`.
    Returns the body rows (list of cell-value lists). Returns empty if no
    matching table is found.

    The walk is forgiving — it finds the first table whose header matches,
    then collects rows until it sees a non-table line.
    """
    for i, line in enumerate(lines):
        if not _TABLE_ROW_RE.match(line):
            continue
        cells = _split_cells(line)
        if not header_predicate(cells):
            continue
        # Header matched. Confirm next line is a separator, then collect rows.
        if i + 1 >= len(lines) or not _TABLE_SEP_RE.match(lines[i + 1]):
            continue
        body: list[list[str]] = []
        for j in range(i + 2, len(lines)):
            row = lines[j]
            if not _TABLE_ROW_RE.match(row):
                break
            body.append(_split_cells(row))
        return body
    return []


def _parse_launch_sequence(lines: list[str]) -> list[LaunchEpisode]:
    """Pull the 'Launch Sequence (First Cluster)' table.

    Header: | Ep | Slug | Format | Arc | Pipeline State |
    """
    def header(cells: list[str]) -> bool:
        if len(cells) < 5:
            return False
        return (
            cells[0].lower().strip() == "ep"
            and cells[1].lower().strip() == "slug"
            and cells[2].lower().strip() == "format"
        )

    out: list[LaunchEpisode] = []
    for row in _find_table_rows(lines, header):
        if len(row) < 5:
            continue
        out.append(LaunchEpisode(
            ep_number=row[0],
            slug=_strip_backticks(row[1]),
            format=row[2],
            arc=row[3],
            pipeline_state=row[4],
        ))
    return out


def _parse_signal_watch(lines: list[str]) -> list[SignalEntry]:
    """Pull the 'Signal Watch List' table.

    Header: | Signal | Discovery Path | First Noticed | Sources | Potential Arc | Notes |
    """
    def header(cells: list[str]) -> bool:
        if len(cells) < 6:
            return False
        return (
            cells[0].lower().strip() == "signal"
            and "discovery" in cells[1].lower()
        )

    out: list[SignalEntry] = []
    for row in _find_table_rows(lines, header):
        if len(row) < 6:
            continue
        out.append(SignalEntry(
            signal=row[0],
            discovery_path=row[1],
            first_noticed=row[2],
            sources=row[3],
            potential_arc=row[4],
            notes=row[5],
        ))
    return out


_LIFECYCLE_LINE_RE = re.compile(
    r"^(?P<emoji>\S+?)\s+(?P<label>[A-Z][A-Z ]+?)\s+→\s+(?P<desc>.*)$"
)


def _parse_lifecycle_states(content: str) -> list[LifecycleState]:
    """Pull the topic lifecycle from the code-block under '## Topic Lifecycle'.

    The block has lines like:
      📡 SIGNAL DETECTED     →  You noticed something interesting. ...

    We extract just the first sentence of each description (the part before
    the first period or up to the "Gate to next:" marker, whichever's first).
    """
    # Find the topic-lifecycle code block. Look for ```...``` after the
    # "## Topic Lifecycle" heading.
    h_re = re.compile(r"^##\s+Topic\s+Lifecycle\s*$", re.MULTILINE | re.IGNORECASE)
    m = h_re.search(content)
    if not m:
        return []
    after = content[m.end():]
    fence_open = after.find("```")
    if fence_open == -1:
        return []
    fence_close = after.find("```", fence_open + 3)
    if fence_close == -1:
        return []
    block = after[fence_open + 3:fence_close]

    out: list[LifecycleState] = []
    for raw in block.splitlines():
        m2 = _LIFECYCLE_LINE_RE.match(raw)
        if not m2:
            continue
        emoji = m2.group("emoji")
        label = m2.group("label").strip()
        desc_raw = m2.group("desc")
        # Trim description to first sentence OR up to "Gate to next:" marker
        desc = desc_raw.split("Gate to next:")[0].strip()
        # Take first sentence-ish
        for stop in (". ", "! ", "? "):
            if stop in desc:
                desc = desc.split(stop)[0] + stop.strip()
                break
        out.append(LifecycleState(emoji=emoji, label=label, description=desc))
    return out


# ── Top-level ────────────────────────────────────────────────────────────────


def load_topics(path: Path | None = None) -> TopicsData:
    """Read IDEAS.md and return the parsed TopicsData. Returns empty
    TopicsData if the file doesn't exist (callers can render an empty
    placeholder without special-casing)."""
    src = path or IDEAS_PATH
    if not src.is_file():
        return TopicsData()
    content = src.read_text(encoding="utf-8")
    lines = content.splitlines()
    return TopicsData(
        launch_sequence=_parse_launch_sequence(lines),
        signal_watch=_parse_signal_watch(lines),
        lifecycle_states=_parse_lifecycle_states(content),
    )


if __name__ == "__main__":
    # Smoke test — dumps a summary to stdout.
    topics = load_topics()
    print(f"Launch sequence: {len(topics.launch_sequence)} episodes")
    for ep in topics.launch_sequence:
        print(f"  {ep.ep_number}. {ep.slug} — {ep.format} ({ep.arc})")
    print(f"\nSignal watch: {len(topics.signal_watch)} signals")
    for s in topics.signal_watch:
        print(f"  · {s.signal[:60]}...")
    print(f"\nLifecycle states: {len(topics.lifecycle_states)}")
    for ls in topics.lifecycle_states:
        print(f"  {ls.emoji} {ls.label}")
