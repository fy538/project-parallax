"""Tests for tools/topics_parser.py — IDEAS.md → structured data."""

from __future__ import annotations

import sys
import textwrap
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

import topics_parser as tp


# ── Launch-sequence table ────────────────────────────────────────────────────


def test_parses_launch_sequence_table(tmp_path):
    """Header row + separator + 2 body rows yields 2 LaunchEpisode entries."""
    f = tmp_path / "IDEAS.md"
    f.write_text(textwrap.dedent("""\
        # Some doc

        ## Launch Sequence (First Cluster)

        | Ep | Slug | Format | Arc | Pipeline State |
        |---|---|---|---|---|
        | 1 | `prisoners-dilemma` | Philosopher's Lens | Arc 3 | 🔬 In progress |
        | 2 | `silicon-trap` | Detective | Arc 1 | 📋 Script v5 |
    """), encoding="utf-8")

    topics = tp.load_topics(f)
    assert len(topics.launch_sequence) == 2
    ep1 = topics.launch_sequence[0]
    assert ep1.ep_number == "1"
    assert ep1.slug == "prisoners-dilemma"
    assert ep1.format == "Philosopher's Lens"
    assert ep1.arc == "Arc 3"
    assert "In progress" in ep1.pipeline_state
    assert topics.launch_sequence[1].slug == "silicon-trap"


def test_strips_backticks_from_slug_cell(tmp_path):
    """Markdown table cells use `slug` formatting — backticks must come off."""
    f = tmp_path / "IDEAS.md"
    f.write_text(textwrap.dedent("""\
        | Ep | Slug | Format | Arc | Pipeline State |
        |---|---|---|---|---|
        | 1 | `weird-slug` | F | A | S |
    """), encoding="utf-8")
    assert tp.load_topics(f).launch_sequence[0].slug == "weird-slug"


# ── Signal-watch table ───────────────────────────────────────────────────────


def test_parses_signal_watch_table(tmp_path):
    f = tmp_path / "IDEAS.md"
    f.write_text(textwrap.dedent("""\
        ## Signal Watch List

        | Signal | Discovery Path | First Noticed | Sources | Potential Arc | Notes |
        |---|---|---|---|---|---|
        | New START expired | Mechanism + Silence | May 3 | UN, Arms Control | Arc 3 | Strongest convergence |
        | Industrial policy | Convergent Drift | May 3 | Asia Times | Arc 1 | Promoted. |
    """), encoding="utf-8")

    topics = tp.load_topics(f)
    assert len(topics.signal_watch) == 2
    s1 = topics.signal_watch[0]
    assert s1.signal == "New START expired"
    assert s1.discovery_path == "Mechanism + Silence"
    assert s1.first_noticed == "May 3"
    assert s1.potential_arc == "Arc 3"


# ── Topic lifecycle code-block ───────────────────────────────────────────────


def test_parses_lifecycle_code_block(tmp_path):
    f = tmp_path / "IDEAS.md"
    f.write_text(textwrap.dedent("""\
        ## Topic Lifecycle

        Every topic moves through these states.

        ```
        📡 SIGNAL DETECTED     →  You noticed something. Captured in one sentence.
        🔄 INCUBATING          →  Monitoring. Check back monthly.
                                  Gate to next: passes viability check.
        ✅ VIABLE              →  Passed viability check.
        ```

        Some prose after.
    """), encoding="utf-8")

    topics = tp.load_topics(f)
    assert len(topics.lifecycle_states) == 3
    assert topics.lifecycle_states[0].emoji == "📡"
    assert topics.lifecycle_states[0].label == "SIGNAL DETECTED"
    assert "noticed" in topics.lifecycle_states[0].description.lower()
    # "Gate to next:" content should be trimmed from the description
    assert "Gate to next" not in topics.lifecycle_states[1].description


def test_lifecycle_description_truncated_to_first_sentence(tmp_path):
    f = tmp_path / "IDEAS.md"
    f.write_text(textwrap.dedent("""\
        ## Topic Lifecycle

        ```
        🔬 RESEARCHING        →  First sentence. Then a second one. And a third.
        ```
    """), encoding="utf-8")
    topics = tp.load_topics(f)
    assert topics.lifecycle_states[0].description == "First sentence."


# ── Empty / missing file handling ────────────────────────────────────────────


def test_missing_file_returns_empty_topicsdata(tmp_path):
    """load_topics should NOT crash on a missing file — empty TopicsData
    lets callers render an empty placeholder without special-casing."""
    topics = tp.load_topics(tmp_path / "does-not-exist.md")
    assert topics.launch_sequence == []
    assert topics.signal_watch == []
    assert topics.lifecycle_states == []


def test_empty_file_returns_empty_topicsdata(tmp_path):
    f = tmp_path / "IDEAS.md"
    f.write_text("", encoding="utf-8")
    topics = tp.load_topics(f)
    assert topics.launch_sequence == []
    assert topics.signal_watch == []
    assert topics.lifecycle_states == []


def test_doc_without_target_tables_returns_empty_collections(tmp_path):
    f = tmp_path / "IDEAS.md"
    f.write_text("# Just prose\n\nNo tables here.\n", encoding="utf-8")
    topics = tp.load_topics(f)
    assert topics.launch_sequence == []
    assert topics.signal_watch == []
    assert topics.lifecycle_states == []


# ── Real IDEAS.md smoke test ─────────────────────────────────────────────────


def test_real_repo_ideas_md_parses_with_expected_shape():
    """Sanity check against the live file — guards against future edits
    that accidentally break the table shape (e.g. column rename)."""
    real = tp.IDEAS_PATH
    if not real.is_file():
        # Editorial team may have moved the file — skip rather than fail.
        return
    topics = tp.load_topics()
    # As of May 2026: 5 launch episodes, 9 signal-watch entries, 6 states.
    # Floors rather than exact match — operator can add rows without
    # breaking the test.
    assert len(topics.launch_sequence) >= 3, "launch sequence shrunk unexpectedly"
    assert len(topics.signal_watch) >= 5, "signal watch shrunk unexpectedly"
    assert len(topics.lifecycle_states) >= 4, "lifecycle shrunk unexpectedly"
    # First launch episode should be prisoners-dilemma (the launch candidate).
    assert topics.launch_sequence[0].slug == "prisoners-dilemma"
