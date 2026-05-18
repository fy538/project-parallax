"""Tests for tools/pipeline_html.py — the HTML emitter."""

from __future__ import annotations

import datetime
import sys
from pathlib import Path


sys.path.insert(0, str(Path(__file__).resolve().parent))

import pipeline_html as ph
from cost_parser import CostData, CostRow
from pipeline_validator import EpisodeStatus
from topics_parser import LaunchEpisode, LifecycleState, SignalEntry, TopicsData


# ── Test fixtures ────────────────────────────────────────────────────────────


def _make_status(
    slug: str = "prisoners-dilemma",
    state: str = "RENDER READY",
    stage_idx: int = 5,
    has_manifest: bool = True,
    has_render: bool = False,
    has_narration: bool = False,
    days_in_state: int = 8,
    days_to_target: int | None = 15,
    target_publish: datetime.date | None = None,
    zero_hit_count: int = 0,
    manifest_stale: bool = False,
    manifest_segments: int = 121,
    manifest_duration_sec: float = 893.8,
    asset_stills: int = 17,
    asset_clips: int = 17,
    data_files: int = 48,
    format: str | None = "Philosopher's Lens",
) -> EpisodeStatus:
    """Build an EpisodeStatus with sensible defaults; override per test."""
    if target_publish is None and days_to_target is not None:
        target_publish = datetime.date.today() + datetime.timedelta(days=days_to_target)
    return EpisodeStatus(
        slug=slug,
        state=state,
        days_in_state=days_in_state,
        days_to_target=days_to_target,
        target_publish=target_publish,
        format=format,
        notes="",
        has_research=True,
        has_angle_memo=True,
        has_script=True,
        has_visual_spec=False,
        has_audio_cue_sheet=True,
        has_manifest=has_manifest,
        has_narration=has_narration,
        has_render=has_render,
        has_thumbnails=False,
        data_files=data_files,
        asset_stills=asset_stills,
        asset_clips=asset_clips,
        manifest_segments=manifest_segments,
        manifest_duration_sec=manifest_duration_sec,
        manifest_mode="estimate",
        zero_hit_count=zero_hit_count,
        cost_usd=0.0,
        manifest_stale=manifest_stale,
        manifest_stale_drift_str="4.5 d" if manifest_stale else "",
        script_version="v5",
        script_mtime=datetime.datetime(2026, 5, 17, 12, 0),
        stage_idx=stage_idx,
    )


def _make_topics(
    launch: int = 3,
    signals: int = 2,
    states: int = 6,
) -> TopicsData:
    return TopicsData(
        launch_sequence=[
            LaunchEpisode(str(i + 1), f"slug-{i}", f"Format {i}", "Arc 1", "🔬 ...")
            for i in range(launch)
        ],
        signal_watch=[
            SignalEntry(f"Signal {i}", "Mechanism", "May 3", "Sources", "Arc 1", "Notes")
            for i in range(signals)
        ],
        lifecycle_states=[
            LifecycleState(["📡", "🔄", "✅", "🔬", "📋", "🎬"][i],
                           f"STATE {i}", f"desc {i}")
            for i in range(states)
        ],
    )


# ── Whole-render smoke ───────────────────────────────────────────────────────


def test_renders_full_html_with_doctype():
    html = ph.render_dashboard_html(
        [_make_status()], _make_topics(), snapshot_date="2026-05-18",
    )
    assert html.startswith("<!DOCTYPE html>")
    assert "<title>Parallax Pipeline</title>" in html
    assert "SNAPSHOT 2026-05-18" in html


def test_renders_brand_mark_and_palette_vars():
    """Brand alignment lock — keeps the dashboard visually on-brand."""
    html = ph.render_dashboard_html([_make_status()], snapshot_date="2026-05-18")
    assert "∴" in html, "missing brand mark"
    # Palette CSS vars locked from tools/brand-treatment/palette.json
    for var in ("--ink", "--gold", "--bone", "--paper", "--dustblue", "--taupe"):
        assert f"{var}:" in html, f"missing palette var {var}"


def test_renders_ibm_plex_fonts():
    """May 2026 type doctrine: Plex Sans/Serif/Mono."""
    html = ph.render_dashboard_html([_make_status()], snapshot_date="2026-05-18")
    assert "IBM+Plex+Sans" in html
    assert "IBM+Plex+Serif" in html
    assert "IBM+Plex+Mono" in html


# ── Pipeline diagram ─────────────────────────────────────────────────────────


def test_renders_all_nine_lifecycle_stages():
    html = ph.render_dashboard_html([_make_status()], snapshot_date="2026-05-18")
    for label in ("Incubating", "Viable", "Researching", "Research Rdy",
                  "Drafting", "Render Rdy", "In Post", "Published", "Retroed"):
        assert f">{label}<" in html, f"missing stage label '{label}'"


def test_stage_marked_active_when_episode_currently_in_it():
    s = _make_status(state="RENDER READY", stage_idx=5)
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    # Render Rdy should be marked active (the episode is there)
    assert '<div class="stage active">Render Rdy</div>' in html


def test_episode_flag_appears_under_current_stage():
    s = _make_status(slug="silicon-trap", stage_idx=5)
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert 'class="ep-flag dustblue"' in html  # silicon-trap → dustblue accent
    assert ">silicon-trap<" in html


def test_handoff_diamonds_render_three_human_gates():
    html = ph.render_dashboard_html([_make_status()], snapshot_date="2026-05-18")
    assert html.count('class="handoff"') == 3


# ── Episode cards ────────────────────────────────────────────────────────────


def test_episode_card_shows_state_day_progress():
    s = _make_status(state="RENDER READY", days_in_state=8, stage_idx=5)
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert "RENDER READY · day 8" in html
    assert ">6/9<" in html  # stage_idx 5 → "6 of 9"


def test_episode_card_progress_bar_width_matches_stage():
    s = _make_status(stage_idx=5)  # 6 of 9 → 66.67%
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert "width: 66.67%" in html


def test_launch_badge_on_prisoners_dilemma_until_published():
    s = _make_status(slug="prisoners-dilemma", state="RENDER READY")
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert '<span class="ep-badge launch">Launch</span>' in html


def test_version_badge_uses_script_version():
    s = _make_status(slug="silicon-trap", state="RENDER READY")
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    # script_version="v5" from fixture
    assert ">V5<" in html


# ── Per-episode tab content ──────────────────────────────────────────────────


def test_per_episode_tabs_have_hidden_content_panels():
    statuses = [
        _make_status(slug="prisoners-dilemma"),
        _make_status(slug="silicon-trap", zero_hit_count=21),
        _make_status(slug="blockades-leak", state="INCUBATING", stage_idx=0),
    ]
    html = ph.render_dashboard_html(statuses, snapshot_date="2026-05-18")
    for slug in ("prisoners-dilemma", "silicon-trap", "blockades-leak"):
        assert f'data-tab-content="{slug}"' in html


def test_per_episode_tab_renders_health_zero_hit_chip():
    s = _make_status(slug="silicon-trap", zero_hit_count=21)
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    # The Health section should mention the 21 zero-hit shots
    assert "21 zero-hit shot" in html


def test_health_shell_commands_marked_copyable():
    """Shell commands in the Health section should be click-to-copy.
    Operator UX — the JS in _JS wires .copyable to clipboard.writeText."""
    s = _make_status(slug="silicon-trap", zero_hit_count=21, manifest_stale=True)
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert 'class="copyable">python3 tools/asset-source/zerohit_fallback.py' in html
    assert 'class="copyable">python3 tools/assembly/generate_manifest.py' in html


def test_next_up_shell_commands_marked_copyable():
    s = _make_status(slug="silicon-trap", zero_hit_count=21)
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert 'class="copyable">python3 tools/asset-source/zerohit_fallback.py silicon-trap' in html


def test_copyable_js_handler_present():
    """The JS that wires <code class='copyable'> to clipboard.writeText
    must be in every emitted file — without it, copyable elements have
    the hover-styled affordance but no actual copy on click."""
    html = ph.render_dashboard_html([_make_status()], snapshot_date="2026-05-18")
    assert "navigator.clipboard.writeText" in html
    assert "code.copyable" in html


# ── Signal-watch search ──────────────────────────────────────────────────────


def test_signals_search_box_emitted_when_signals_present():
    html = ph.render_dashboard_html(
        [_make_status()],
        topics=_make_topics(signals=3),
        snapshot_date="2026-05-18",
    )
    assert 'id="signals-filter"' in html
    assert 'id="signals-count"' in html
    assert ">3 signals<" in html


def test_signals_search_box_omitted_when_no_signals():
    """Empty signal_watch list — search box would be confusing UI clutter."""
    html = ph.render_dashboard_html(
        [_make_status()],
        topics=_make_topics(launch=1, signals=0, states=1),
        snapshot_date="2026-05-18",
    )
    assert 'id="signals-filter"' not in html


def test_signals_search_js_filter_handler_present():
    """The JS handler must reference both the input id and the card
    selector — otherwise the search input renders but does nothing."""
    html = ph.render_dashboard_html(
        [_make_status()],
        topics=_make_topics(signals=2),
        snapshot_date="2026-05-18",
    )
    assert "signals-filter" in html
    assert "signal-card" in html


def test_default_output_path_is_episodes_PIPELINE_html():
    """The dashboard lives next to PIPELINE.md as a sibling output of the
    pipeline. Was tools/pipeline_dashboard/index.html in the first wire-up;
    moved May 18, 2026 for discoverability."""
    assert ph.DEFAULT_OUTPUT.name == "PIPELINE.html"
    assert ph.DEFAULT_OUTPUT.parent.name == "episodes"


def test_per_episode_tab_renders_metric_rows():
    s = _make_status(manifest_duration_sec=893.8, manifest_segments=121, data_files=48)
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert "14.9 min" in html  # 893.8s / 60
    assert ">121<" in html or "Segments" in html
    assert "48 Remotion JSON" in html


# ── Topics tab ───────────────────────────────────────────────────────────────


def test_topics_tab_renders_launch_signal_funnel_sections():
    html = ph.render_dashboard_html(
        [_make_status()],
        topics=_make_topics(launch=2, signals=3, states=4),
        snapshot_date="2026-05-18",
    )
    assert 'data-tab-content="topics"' in html
    assert "Launch sequence (2 episodes)" in html
    assert "Signal watch (3 signals" in html
    assert 'class="funnel"' in html


def test_topics_tab_handles_empty_topics_data():
    html = ph.render_dashboard_html(
        [_make_status()], topics=TopicsData(), snapshot_date="2026-05-18",
    )
    assert "topics-empty" in html


def test_topics_tab_funnel_lists_each_lifecycle_state():
    topics = _make_topics(states=6)
    html = ph.render_dashboard_html([_make_status()], topics, snapshot_date="2026-05-18")
    for i in range(6):
        assert f"STATE {i}" in html


# ── Next-up section ──────────────────────────────────────────────────────────


def test_next_up_prioritizes_smallest_days_to_target():
    statuses = [
        _make_status(slug="far", days_to_target=30),
        _make_status(slug="near", days_to_target=5),
        _make_status(slug="middle", days_to_target=15),
    ]
    html = ph.render_dashboard_html(statuses, snapshot_date="2026-05-18")
    # The list should have "near" appear before "middle" appear before "far".
    near = html.find('class="slug">near<')
    middle = html.find('class="slug">middle<')
    far = html.find('class="slug">far<')
    assert 0 < near < middle < far, "next-up ordering wrong"


# ── Quick-actions toolbar ────────────────────────────────────────────────────


def test_quick_actions_toolbar_renders_for_each_episode_tab():
    statuses = [_make_status(slug=s) for s in ("prisoners-dilemma", "silicon-trap", "blockades-leak")]
    html = ph.render_dashboard_html(statuses, snapshot_date="2026-05-18")
    # Three episodes × one toolbar each = at least three quick-actions blocks
    assert html.count('class="quick-actions"') == 3


def test_quick_actions_always_includes_refresh_status():
    s = _make_status()
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert 'data-cmd="python3 tools/pipeline_validator.py --write-status prisoners-dilemma"' in html


def test_quick_actions_includes_zero_hit_remediation_when_present():
    s = _make_status(slug="silicon-trap", zero_hit_count=21)
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert 'data-cmd="python3 tools/asset-source/zerohit_fallback.py silicon-trap"' in html
    assert "Fill 21 zero-hit assets" in html


def test_quick_actions_skips_render_command_when_no_manifest():
    """blockades-leak shape — no manifest, so the "first full render" chip
    would dispatch a nonsense command. Make sure it's omitted."""
    s = _make_status(slug="blockades-leak", state="INCUBATING", stage_idx=0,
                     has_manifest=False)
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert "First full render" not in html


def test_quick_actions_includes_viability_gate_for_incubating():
    s = _make_status(slug="blockades-leak", state="INCUBATING", stage_idx=0,
                     has_manifest=False)
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert 'data-cmd="python3 tools/topic/idea_invalidation.py blockades-leak"' in html


# ── State-transition timeline ────────────────────────────────────────────────


def _seed_history(tmp_episodes_dir, slug, transitions):
    """Helper — write a _state-history.jsonl for a fake episode dir."""
    import json
    ep_dir = tmp_episodes_dir / slug
    ep_dir.mkdir(parents=True, exist_ok=True)
    lines = [
        json.dumps({"date": t["date"], "from": t.get("from"),
                    "to": t["to"], "reason": t.get("reason", "")})
        for t in transitions
    ]
    (ep_dir / "_state-history.jsonl").write_text("\n".join(lines) + "\n", encoding="utf-8")


def test_timeline_empty_state_when_no_history(tmp_path, monkeypatch):
    import state_history as sh
    monkeypatch.setattr(sh, "EPISODES_DIR", tmp_path)
    s = _make_status(slug="never-tracked")
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert "no <code>_state-history.jsonl</code> yet" in html


def test_timeline_renders_nodes_for_each_transition(tmp_path, monkeypatch):
    import state_history as sh
    monkeypatch.setattr(sh, "EPISODES_DIR", tmp_path)
    _seed_history(tmp_path, "demo-ep", [
        {"date": "2026-03-18", "from": None, "to": "INCUBATING", "reason": "bootstrap"},
        {"date": "2026-04-15", "from": "INCUBATING", "to": "VIABLE", "reason": "v1 brief"},
        {"date": "2026-05-09", "from": "VIABLE", "to": "RENDER READY", "reason": "skipped research → straight to draft"},
    ])
    s = _make_status(slug="demo-ep")
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    # Three transitions + one "Now" marker = at least 4 timeline-node elements
    assert html.count('class="timeline-node') >= 4
    # All three target states should appear as labels
    for state in ("INCUBATING", "VIABLE", "RENDER READY"):
        assert f">{state}</div>" in html


def test_timeline_now_marker_uses_open_dot(tmp_path, monkeypatch):
    import state_history as sh
    monkeypatch.setattr(sh, "EPISODES_DIR", tmp_path)
    _seed_history(tmp_path, "demo-ep", [
        {"date": "2026-05-01", "from": None, "to": "VIABLE", "reason": "bootstrap"},
    ])
    s = _make_status(slug="demo-ep")
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert "timeline-dot-open" in html
    assert ">Now</div>" in html


# ── Spend tab ────────────────────────────────────────────────────────────────


def test_spend_tab_renders_empty_state_when_no_cost_data():
    html = ph.render_dashboard_html(
        [_make_status()], cost=CostData(), snapshot_date="2026-05-18",
    )
    assert 'data-tab-content="spend"' in html
    assert "No spend logged yet" in html
    assert "$0.00" in html


def test_spend_tab_renders_bars_when_cost_data_present():
    cost = CostData()
    cost.rows = [
        CostRow(date="2026-05-10", episode="silicon-trap", service="claude",
                amount_usd=8.50, note="research"),
        CostRow(date="2026-05-11", episode="silicon-trap", service="recraft",
                amount_usd=1.20, note="illust"),
        CostRow(date="2026-05-12", episode="prisoners-dilemma", service="claude",
                amount_usd=4.00, note="audit"),
    ]
    cost.by_episode = {"silicon-trap": 9.70, "prisoners-dilemma": 4.00}
    cost.by_service = {"claude": 12.50, "recraft": 1.20}
    cost.total_usd = 13.70
    html = ph.render_dashboard_html(
        [_make_status()], cost=cost, snapshot_date="2026-05-18",
    )
    assert "$13.70" in html  # total
    assert "$9.70" in html   # silicon-trap subtotal
    assert "By episode" in html
    assert "By service" in html
    # Recent table should include the rows
    assert ">research<" in html


def test_spend_tab_recent_table_shows_at_most_ten_rows():
    cost = CostData()
    cost.rows = [
        CostRow(date=f"2026-05-{i:02d}", episode="demo", service="claude",
                amount_usd=1.0, note=f"distinct-note-{i}")
        for i in range(1, 16)  # 15 rows
    ]
    cost.by_episode = {"demo": 15.0}
    cost.by_service = {"claude": 15.0}
    cost.total_usd = 15.0
    html = ph.render_dashboard_html(
        [_make_status()], cost=cost, snapshot_date="2026-05-18",
    )
    # "Recent (last 10)" — newest 10 rows. The substring-match needs to be
    # specific enough that "distinct-note-1" doesn't accidentally match a
    # "distinct-note-15" substring (which it did in v1 of this test).
    for i in range(6, 16):
        assert f"distinct-note-{i}<" in html
    for i in range(1, 6):
        assert f"distinct-note-{i}<" not in html


def test_spend_tab_button_in_tabbar():
    html = ph.render_dashboard_html([_make_status()], snapshot_date="2026-05-18")
    assert '<button class="tab" role="tab" data-tab="spend">Spend</button>' in html


def test_next_up_recommends_zero_hit_remediation_when_present():
    s = _make_status(slug="silicon-trap", zero_hit_count=21)
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert "zerohit_fallback.py silicon-trap" in html


def test_next_up_recommends_first_render_when_manifest_ready_but_unrendered():
    s = _make_status(has_manifest=True, has_render=False, zero_hit_count=0,
                     manifest_stale=False)
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert "first full-episode render" in html


def test_next_up_recommends_viability_regate_for_stalled_incubating():
    # blockades-leak shape: INCUBATING, no manifest yet, day 60.
    # Must override has_manifest=False so the manifest-exists branch in
    # _next_action_for doesn't intercept before the INCUBATING-stalled check.
    s = _make_status(slug="blockades-leak", state="INCUBATING", stage_idx=0,
                     days_in_state=60, days_to_target=None, target_publish=None,
                     has_manifest=False)
    html = ph.render_dashboard_html([s], snapshot_date="2026-05-18")
    assert "viability re-gate" in html


# ── emit_html CLI helper ─────────────────────────────────────────────────────


def test_emit_html_write_mode_creates_file(tmp_path, monkeypatch):
    target = tmp_path / "dashboard.html"
    # Patch the loaders so we don't depend on real repo state
    monkeypatch.setattr(ph, "DEFAULT_OUTPUT", target)
    monkeypatch.setattr(
        "pipeline_validator.load_pipeline_state",
        lambda: _fake_load_state(),
    )
    monkeypatch.setattr(
        "topics_parser.load_topics",
        lambda: _make_topics(launch=1, signals=1, states=1),
    )
    rc = ph.emit_html(output=target, check=False)
    assert rc == 0
    assert target.exists()
    assert target.read_text(encoding="utf-8").startswith("<!DOCTYPE html>")


def test_emit_html_check_mode_passes_when_fresh(tmp_path, monkeypatch):
    target = tmp_path / "dashboard.html"
    monkeypatch.setattr(
        "pipeline_validator.load_pipeline_state",
        lambda: _fake_load_state(),
    )
    monkeypatch.setattr(
        "topics_parser.load_topics",
        lambda: _make_topics(launch=1, signals=1, states=1),
    )
    # First write
    assert ph.emit_html(output=target, check=False) == 0
    # Then check — should pass
    assert ph.emit_html(output=target, check=True) == 0


def test_emit_html_check_mode_fails_when_missing(tmp_path, monkeypatch):
    target = tmp_path / "missing.html"
    monkeypatch.setattr(
        "pipeline_validator.load_pipeline_state",
        lambda: _fake_load_state(),
    )
    monkeypatch.setattr(
        "topics_parser.load_topics",
        lambda: _make_topics(launch=1, signals=1, states=1),
    )
    assert ph.emit_html(output=target, check=True) == 1


def test_emit_html_check_mode_fails_when_stale(tmp_path, monkeypatch):
    target = tmp_path / "stale.html"
    target.write_text("<html>stale</html>", encoding="utf-8")
    monkeypatch.setattr(
        "pipeline_validator.load_pipeline_state",
        lambda: _fake_load_state(),
    )
    monkeypatch.setattr(
        "topics_parser.load_topics",
        lambda: _make_topics(launch=1, signals=1, states=1),
    )
    assert ph.emit_html(output=target, check=True) == 1


def _fake_load_state():
    """Build a fake StateEntry list for the emit_html tests."""
    from pipeline_validator import StateEntry
    return [
        StateEntry(
            slug="prisoners-dilemma",
            state="RENDER READY",
            state_entered_at=datetime.date.today() - datetime.timedelta(days=8),
            format="Philosopher's Lens",
            target_publish=datetime.date.today() + datetime.timedelta(days=15),
            blocked_on="—",
            notes="",
        ),
    ]


# ── Helper / pure-function tests ─────────────────────────────────────────────


def test_accent_for_known_episodes():
    assert ph._accent_for("prisoners-dilemma") == "gold"
    assert ph._accent_for("silicon-trap") == "dustblue"
    assert ph._accent_for("blockades-leak") == "taupe"
    assert ph._accent_for("unknown-future-episode") == "sand"


def test_episode_title_falls_back_to_titlecased_slug():
    assert ph._episode_title("my-cool-episode") == "My Cool Episode"


def test_episode_title_uses_curated_when_available():
    assert "Prisoner's Dilemma" in ph._episode_title("prisoners-dilemma")


def test_esc_html_escapes_specials():
    assert ph._esc("<script>") == "&lt;script&gt;"
    assert ph._esc("a & b") == "a &amp; b"
    assert ph._esc(None) == ""
