"""
pipeline_html.py — render the Parallax pipeline dashboard as a single
self-contained HTML file.

Mirrors the visual structure of `tools/pipeline_dashboard/index.html` but
drives every dynamic value from current data:

  · `episodes/pipeline-state.json` (via pipeline_validator.load_pipeline_state)
  · per-episode `_status.md` data (via pipeline_validator.compute_episode_status)
  · `project/IDEAS.md` (via topics_parser.load_topics)

Same data sources the Markdown dashboards consume — so the HTML and the
Markdown can't disagree about state. Auto-regen via:

    python3 tools/pipeline_validator.py --emit-html

Check freshness without writing (CI gate):

    python3 tools/pipeline_validator.py --emit-html --check

The HTML structure is deliberately simple — every dynamic value is in a
clearly-named slot. Operators inspecting the output can find the source
of any number quickly. Brand palette + IBM Plex typography matches the
May 2026 doctrine (see `tools/brand-treatment/palette.json` and
CLAUDE.md → Channel identity).
"""

from __future__ import annotations

import datetime
import html
import sys
from pathlib import Path
from typing import TYPE_CHECKING

sys.path.insert(0, str(Path(__file__).resolve().parent / "shared"))
from paths import get_project_root  # noqa: E402

if TYPE_CHECKING:
    from pipeline_validator import EpisodeStatus
    from topics_parser import TopicsData

ROOT = get_project_root()

# Sibling to PIPELINE.md so the visual dashboard sits next to the Markdown
# truth in episodes/. Originally lived at tools/pipeline_dashboard/index.html
# (May 18, 2026 first wire-up); moved to episodes/ same day for cleaner
# discoverability — the file's an output of the pipeline, not a tool itself.
DEFAULT_OUTPUT = ROOT / "episodes" / "PIPELINE.html"


# Per-episode accent color assignments. Stays in sync with the visual
# convention from `tools/pipeline_dashboard/index.html` (gold = launch
# candidate, dustblue = silicon-trap, taupe = blockades-leak). New
# episodes default to `sand` until the operator picks an accent.
EP_ACCENT: dict[str, str] = {
    "prisoners-dilemma": "gold",
    "silicon-trap": "dustblue",
    "blockades-leak": "taupe",
}
DEFAULT_ACCENT = "sand"


# State badge for episode cards. Differs from STATE_BADGES (which is for
# the Markdown table) — here we just want the bare label + day counter.
def _accent_for(slug: str) -> str:
    return EP_ACCENT.get(slug, DEFAULT_ACCENT)


def _esc(s: str | None) -> str:
    """HTML-escape, treating None as empty string."""
    return html.escape(s or "")


# ── Section renderers ────────────────────────────────────────────────────────


def _render_pipeline_diagram(statuses: list[EpisodeStatus]) -> str:
    """The 9-stage horizontal pipeline with episode flags under their state.

    Stages match pipeline_validator.STATE_ORDER. Human-handoff diamonds
    sit at editorial-judgment boundaries (viability verdict, angle decision,
    render trigger).
    """
    from pipeline_validator import STATE_ORDER

    stage_labels = {
        "INCUBATING":     "Incubating",
        "VIABLE":         "Viable",
        "RESEARCHING":    "Researching",
        "RESEARCH READY": "Research Rdy",
        "DRAFTING":       "Drafting",
        "RENDER READY":   "Render Rdy",
        "IN POST":        "In Post",
        "PUBLISHED":      "Published",
        "RETROED":        "Retroed",
    }

    # Determine which stage is "active" — the leftmost stage any episode
    # currently sits in. Earlier stages are "done" (some episode has been
    # there); later stages are "upcoming."
    active_indices = [s.stage_idx for s in statuses if s.stage_idx >= 0]
    active_min = min(active_indices) if active_indices else len(STATE_ORDER)

    stage_html_parts: list[str] = []
    for i, state in enumerate(STATE_ORDER):
        label = stage_labels.get(state, state.title())
        if i < active_min:
            cls = "done"
        elif i == active_min:
            cls = "active"
        else:
            # Check if any episode is currently here — promote to "active" too
            here = any(s.stage_idx == i for s in statuses)
            cls = "active" if here else "upcoming"
        stage_html_parts.append(
            f'    <div class="stage {cls}">{_esc(label)}</div>'
        )
    stages_html = "\n".join(stage_html_parts)

    # Group episodes by stage_idx for the flag row underneath
    by_stage: dict[int, list[EpisodeStatus]] = {}
    for s in statuses:
        if s.stage_idx < 0:
            continue
        by_stage.setdefault(s.stage_idx, []).append(s)

    flag_columns: list[str] = []
    for i in range(len(STATE_ORDER)):
        eps = by_stage.get(i, [])
        if not eps:
            flag_columns.append('    <div class="ep-flag-column"></div>')
            continue
        flags = "\n".join(
            f'      <span class="ep-flag {_accent_for(s.slug)}">'
            f'<span class="ep-dot"></span>{_esc(s.slug)}</span>'
            for s in eps
        )
        flag_columns.append(
            f'    <div class="ep-flag-column">\n{flags}\n    </div>'
        )
    flags_html = "\n".join(flag_columns)

    # Handoff diamonds — placed at the gaps between specific stages.
    # Stage column n is centered at (n + 0.5) * (100/9)%; the gap between
    # stage n and n+1 is at (n + 1) * (100/9)%. Place each diamond
    # absolutely-positioned over the rail.
    handoff_positions = [
        (1, "Viability verdict"),    # between VIABLE → RESEARCHING
        (3, "Angle-memo decision"),  # between RESEARCH READY → DRAFTING
        (5, "Render trigger"),       # between RENDER READY → IN POST
    ]
    handoffs_html = "\n".join(
        f'    <div class="handoff" '
        f'style="left: calc({(i + 1) * 100 / 9:.4f}% - 9px);" '
        f'title="Human gate: {_esc(label)}"></div>'
        for i, label in handoff_positions
    )

    return f"""<section class="pipeline" aria-label="Pipeline state diagram">
  <div class="stage-row">
{handoffs_html}
{stages_html}
  </div>
  <div class="ep-flags">
{flags_html}
  </div>
  <div class="legend">
    <div class="legend-item"><span class="legend-swatch"></span>Done</div>
    <div class="legend-item"><span class="legend-swatch active"></span>Active</div>
    <div class="legend-item"><span class="legend-swatch upcoming"></span>Upcoming</div>
    <div class="legend-item"><span class="legend-swatch handoff"></span>Human gate</div>
  </div>
</section>"""


def _render_episode_card(s: EpisodeStatus) -> str:
    """One episode summary card for the Overview grid."""
    accent = _accent_for(s.slug)
    badge_text, badge_cls = _badge_for(s)
    title = _episode_title(s.slug)
    fraction = f"{s.stage_idx + 1}/{s.stage_total}" if s.stage_idx >= 0 else "—"
    progress_pct = (
        ((s.stage_idx + 1) / s.stage_total) * 100 if s.stage_idx >= 0 else 0
    )

    target_str = "—"
    if s.target_publish_iso and s.days_to_target is not None:
        target_str = f"{s.target_publish_iso} ({s.days_to_target:+d}d)"
    elif s.target_publish_iso:
        target_str = s.target_publish_iso
    elif s.state == "INCUBATING":
        target_str = "Viability re-gate" if s.days_in_state > 30 else "Awaiting"

    return f"""  <article class="ep-card {accent}">
    <div class="ep-meta-row">
      <div class="ep-slug">
        <span class="ep-dot"></span>
        <span>{_esc(s.slug)}</span>
      </div>
      <span class="ep-badge {badge_cls}">{_esc(badge_text)}</span>
    </div>
    <h3>{_esc(title)}</h3>
    <div class="state-line">
      <span class="state">{_esc(s.state)} · day {s.days_in_state}</span>
      <span class="progress-fraction">{_esc(fraction)}</span>
    </div>
    <div class="progress-bar"><div class="progress-fill" style="width: {progress_pct:.2f}%;"></div></div>
    <div class="ep-footer">
      <span><span class="label">Format</span>{_esc(s.format or "—")}</span>
      <span><span class="label">{"Target" if s.target_publish_iso else "Status"}</span>{_esc(target_str)}</span>
    </div>
  </article>"""


def _badge_for(s: EpisodeStatus) -> tuple[str, str]:
    """Return (text, css-class) for the badge in the upper-right of a card.
    Special-cases the launch candidate (prisoners-dilemma) until publish."""
    if s.slug == "prisoners-dilemma" and s.state not in ("PUBLISHED", "RETROED"):
        return ("Launch", "launch")
    if s.script_version:
        return (s.script_version.upper(), "version")
    if s.state == "INCUBATING":
        return ("V1", "draft")
    return ("—", "draft")


# Hand-curated titles per episode. New episodes default to a Title-Cased
# version of the slug; operator updates the map when picking a real title.
EPISODE_TITLES: dict[str, str] = {
    "prisoners-dilemma":
        "The Prisoner's Dilemma Is Wrong About Almost Everything",
    "silicon-trap":
        "The Silicon Trap",
    "blockades-leak":
        "Why Technological Blockades Always Leak",
}


def _episode_title(slug: str) -> str:
    return EPISODE_TITLES.get(slug, slug.replace("-", " ").title())


def _render_next_up(statuses: list[EpisodeStatus]) -> str:
    """The 'What to work on next' section. Priority order: smallest
    days-to-target first (then largest days-in-state for stalled INCUBATING)."""
    # Build ordered actions
    actions: list[tuple[EpisodeStatus, str]] = []
    for s in sorted(
        statuses,
        key=lambda x: (
            x.days_to_target if x.days_to_target is not None else 9999,
            -x.days_in_state,
        ),
    ):
        action = _next_action_for(s)
        actions.append((s, action))

    items_html = "\n".join(
        f'    <li class="{_accent_for(s.slug)}">'
        f'<span class="slug">{_esc(s.slug)}</span> — {action}</li>'
        for s, action in actions
    )

    # Context pills at the bottom: buffer, arc, format diversity.
    # These are operator-derived strategic signals; keep them static here
    # because pipeline-state.json doesn't carry them. Refresh by hand when
    # the strategy shifts.
    pills_html = (
        '    <span class="pill">Buffer: see PIPELINE.md</span>\n'
        '    <span class="pill">Strategy: prisoners-dilemma is launch candidate</span>\n'
        f'    <span class="pill">Formats: {_format_diversity(statuses)}</span>'
    )

    return f"""<section class="next-up">
  <ol>
{items_html}
  </ol>
  <div class="pills">
{pills_html}
  </div>
</section>"""


def _next_action_for(s: EpisodeStatus) -> str:
    """Recommended next action for one episode — derived from health signals."""
    if s.zero_hit_count > 0:
        return (
            f"close the {s.zero_hit_count} zero-hit asset gap "
            f"(<code class=\"copyable\">python3 tools/asset-source/zerohit_fallback.py {s.slug}</code>), "
            f"then regen manifest + first full render."
        )
    if s.manifest_stale:
        return (
            f"regen stale manifest "
            f"(<code class=\"copyable\">python3 tools/assembly/generate_manifest.py {s.slug}</code>), "
            f"then continue."
        )
    if s.has_manifest and not s.has_render:
        return (
            f"first full-episode render "
            f"(<code class=\"copyable\">cd remotion-templates && node scripts/render-episode.mjs --episode={s.slug}</code>)."
        )
    if s.has_render and not s.has_narration:
        return "record narration → assets/narration.wav → regenerate manifest in precise mode."
    if s.state == "INCUBATING" and s.days_in_state > 30:
        return (
            f"viability re-gate (day {s.days_in_state} in INCUBATING — likely needs "
            f"a fresh research scan or to be promoted/killed)."
        )
    return f"continue per <code>episodes/{s.slug}/_status.md</code>."


def _format_diversity(statuses: list[EpisodeStatus]) -> str:
    formats = [s.format for s in statuses if s.format]
    if not formats:
        return "—"
    return " · ".join(formats)


# ── Per-episode tab content ──────────────────────────────────────────────────


def _render_episode_tab(s: EpisodeStatus) -> str:
    """The content panel for one episode's tab — mirrors _status.md sections
    (Progress checklist + Health + By the numbers) in the same visual register."""
    accent = _accent_for(s.slug)
    title = _episode_title(s.slug)
    target_clause = ""
    if s.target_publish_iso and s.days_to_target is not None:
        target_clause = (
            f" · target {s.target_publish_iso} "
            f"({s.days_to_target:+d} days)"
        )

    checklist_html = _render_episode_checklist(s)
    health_html = _render_episode_health(s)
    metrics_html = _render_episode_metrics(s)

    return f"""<section class="ep-tab {accent}" data-tab-content="{_esc(s.slug)}" hidden>
  <header class="ep-tab-header">
    <div>
      <div class="ep-tab-slug">{_esc(s.slug)} · {_esc(s.format or "—")}</div>
      <h2>{_esc(title)}</h2>
    </div>
    <div class="ep-tab-state">
      <div class="ep-tab-state-pill">{_esc(s.state)}</div>
      <div class="ep-tab-state-meta">day {s.days_in_state}{_esc(target_clause)}</div>
    </div>
  </header>
  <div class="ep-tab-grid">
    <div class="ep-tab-panel">
      <h4>Progress · {s.stage_idx + 1 if s.stage_idx >= 0 else "—"} of {s.stage_total} stages</h4>
{checklist_html}
    </div>
    <div class="ep-tab-panel">
      <h4>Health</h4>
{health_html}
    </div>
    <div class="ep-tab-panel">
      <h4>By the numbers</h4>
{metrics_html}
    </div>
  </div>
  <div class="ep-tab-source">
    Source · <code>episodes/{_esc(s.slug)}/_status.md</code> (auto-generated by
    <code>tools/pipeline_validator.py --write-status</code>)
  </div>
</section>"""


def _render_episode_checklist(s: EpisodeStatus) -> str:
    """Stage checklist matching _status.md's per-episode body."""
    items: list[tuple[str, str]] = []

    def mark(ok: bool, warn: bool = False) -> str:
        if warn:
            return "⚠"
        return "✓" if ok else "✗"

    items.append((mark(s.has_research), "research (brief + audit)"))
    items.append((mark(s.has_angle_memo), "angle-memo"))

    script_note = ""
    if s.has_script and s.script_version and s.script_mtime_iso:
        script_note = f" — {s.script_version}, {s.script_mtime_iso}"
    elif s.has_script and s.script_mtime_iso:
        script_note = f" — {s.script_mtime_iso}"
    items.append((mark(s.has_script), f"script-production.md{script_note}"))

    items.append((mark(s.has_visual_spec), "visual-spec"))

    if s.has_manifest:
        items.append((
            mark(True, warn=s.manifest_stale),
            f"assembly-manifest ({s.manifest_mode} · "
            f"{s.manifest_segments} seg · {s.manifest_duration_sec:.0f}s)",
        ))
    else:
        items.append(("✗", "assembly-manifest"))
    items.append((mark(s.has_audio_cue_sheet), "audio-cue-sheet"))

    data_files_note = f" ({s.data_files} files)" if s.data_files > 0 else ""
    items.append((mark(s.data_files > 0), f"data files{data_files_note}"))

    # Assets line — mirrors _render_assets_line in pipeline_validator.py
    if s.asset_stills or s.asset_clips:
        asset_note = f" ({s.asset_stills} stills · {s.asset_clips} clips"
        if s.zero_hit_count:
            asset_note += f" · {s.zero_hit_count} zero-hit"
        asset_note += ")"
        items.append((
            mark(True, warn=s.zero_hit_count > 0),
            f"assets{asset_note}",
        ))
    elif s.zero_hit_count:
        items.append((
            mark(False, warn=True),
            f"assets ({s.zero_hit_count} zero-hit, none generated)",
        ))
    else:
        items.append(("✗", "assets"))

    items.append((mark(s.has_render), "full-episode render"))
    items.append((mark(s.has_narration), "narration recorded"))
    items.append((mark(s.has_thumbnails), "thumbnail-spec"))

    rows = "\n".join(
        f'        <li class="check-{_check_class(icon)}">'
        f'<span class="check-icon">{_esc(icon)}</span>'
        f'<span class="check-label">{_esc(label)}</span></li>'
        for icon, label in items
    )
    return f'      <ul class="checklist">\n{rows}\n      </ul>'


def _check_class(icon: str) -> str:
    return {"✓": "ok", "⚠": "warn", "✗": "missing"}.get(icon, "neutral")


def _render_episode_health(s: EpisodeStatus) -> str:
    """Health box — same content as `_render_health` in pipeline_validator.py
    but emitted as HTML chips."""
    health: list[tuple[str, str]] = []
    if s.manifest_stale:
        health.append((
            "🔴",
            f"Manifest stale ({s.manifest_stale_drift_str} drift) — "
            f"<code class=\"copyable\">python3 tools/assembly/generate_manifest.py {s.slug}</code>",
        ))
    if s.zero_hit_count > 0:
        health.append((
            "🟡",
            f"{s.zero_hit_count} zero-hit shot{'s' if s.zero_hit_count != 1 else ''} "
            f"— <code class=\"copyable\">python3 tools/asset-source/zerohit_fallback.py {s.slug}</code>",
        ))
    if s.has_manifest and s.manifest_mode == "estimate" and s.has_narration:
        health.append((
            "🟡",
            "Manifest in estimate mode but narration recorded — regenerate in precise mode",
        ))
    if s.has_manifest and not s.has_render:
        health.append((
            "🟡",
            f"Manifest ready but never rendered — "
            f"<code class=\"copyable\">cd remotion-templates && node scripts/render-episode.mjs --episode={s.slug}</code>",
        ))
    if s.has_render and not s.has_narration:
        health.append((
            "🟡",
            "Rendered but no narration recorded yet",
        ))
    if not health:
        return (
            '      <div class="health-clean">🟢 No health issues detected.</div>'
        )
    items = "\n".join(
        f'        <li class="health-item">'
        f'<span class="health-icon">{_esc(icon)}</span>'
        f'<span class="health-msg">{msg}</span></li>'
        for icon, msg in health
    )
    return f'      <ul class="health-list">\n{items}\n      </ul>'


def _render_episode_metrics(s: EpisodeStatus) -> str:
    """By-the-numbers table. Mirrors the trailing section of _status.md."""
    rows: list[tuple[str, str]] = []
    if s.manifest_duration_sec:
        minutes = s.manifest_duration_sec / 60
        rows.append(("Duration", f"{minutes:.1f} min ({s.manifest_duration_sec:.0f}s)"))
    if s.manifest_segments:
        rows.append(("Segments", str(s.manifest_segments)))
    if s.data_files:
        rows.append(("Data files", f"{s.data_files} Remotion JSON"))
    if s.asset_stills or s.asset_clips:
        rows.append(("Assets", f"{s.asset_stills} stills · {s.asset_clips} clips"))
    if s.cost_usd:
        rows.append(("Spend to date", f"${s.cost_usd:.2f}"))
    if s.manifest_mode:
        rows.append(("Manifest mode", s.manifest_mode))
    if not rows:
        return '      <div class="metrics-empty">No metrics yet — manifest + assets pending.</div>'
    items = "\n".join(
        f'        <div class="metric"><span class="metric-label">{_esc(label)}</span>'
        f'<span class="metric-value">{_esc(value)}</span></div>'
        for label, value in rows
    )
    return f'      <div class="metrics-grid">\n{items}\n      </div>'


# ── Topics tab ───────────────────────────────────────────────────────────────


def _render_topics_tab(topics: TopicsData) -> str:
    """The Topics tab — funnel + launch sequence + signal-watch cards."""
    if not topics.lifecycle_states and not topics.launch_sequence:
        return """<section class="topics-tab" data-tab-content="topics" hidden>
  <div class="topics-empty">project/IDEAS.md not found or empty.</div>
</section>"""

    funnel_html = _render_topics_funnel(topics)
    launch_html = _render_topics_launch(topics)
    signal_html = _render_topics_signals(topics)

    return f"""<section class="topics-tab" data-tab-content="topics" hidden>
  <div class="topics-section">
    <h4>Topic lifecycle</h4>
{funnel_html}
  </div>
  <div class="topics-section">
    <h4>Launch sequence ({len(topics.launch_sequence)} episodes)</h4>
{launch_html}
  </div>
  <div class="topics-section">
    <h4>Signal watch ({len(topics.signal_watch)} signals being monitored)</h4>
{signal_html}
  </div>
  <div class="topics-source">
    Source · <code>project/IDEAS.md</code>
  </div>
</section>"""


def _render_topics_funnel(topics: TopicsData) -> str:
    items = "\n".join(
        f'      <li class="funnel-state"><span class="funnel-emoji">{_esc(ls.emoji)}</span>'
        f'<div class="funnel-text"><div class="funnel-label">{_esc(ls.label)}</div>'
        f'<div class="funnel-desc">{_esc(ls.description)}</div></div></li>'
        for ls in topics.lifecycle_states
    )
    return f'    <ol class="funnel">\n{items}\n    </ol>'


def _render_topics_launch(topics: TopicsData) -> str:
    if not topics.launch_sequence:
        return '    <div class="topics-empty">No launch sequence parsed.</div>'
    cards = "\n".join(
        f'    <div class="topic-card">'
        f'<div class="topic-ep">Ep {_esc(ep.ep_number)}</div>'
        f'<div class="topic-slug">{_esc(ep.slug)}</div>'
        f'<div class="topic-format">{_esc(ep.format)}</div>'
        f'<div class="topic-arc">{_esc(ep.arc)}</div>'
        f'<div class="topic-state">{_esc(ep.pipeline_state)}</div>'
        f'</div>'
        for ep in topics.launch_sequence
    )
    return f'    <div class="topics-grid">\n{cards}\n    </div>'


def _render_topics_signals(topics: TopicsData) -> str:
    """Render the Signal Watch cards with a client-side filter box.

    Filter is wired in _JS — it matches against the card's full text
    (title + discovery path + arc + first-noticed + notes). Updates a
    count display so the operator sees how many match the query.
    """
    if not topics.signal_watch:
        return '    <div class="topics-empty">No signals parsed.</div>'
    n = len(topics.signal_watch)
    search_box = (
        '    <div class="signals-search">\n'
        '      <label for="signals-filter">Filter</label>\n'
        '      <input id="signals-filter" type="search" '
        'placeholder="search signals, arcs, discovery paths…" autocomplete="off">\n'
        f'      <span id="signals-count" class="signal-count">{n} signals</span>\n'
        '    </div>'
    )
    cards = "\n".join(
        f'    <div class="signal-card">'
        f'<div class="signal-title">{_esc(sig.signal)}</div>'
        f'<div class="signal-meta">'
        f'<span class="signal-pill">{_esc(sig.discovery_path)}</span>'
        f'<span class="signal-pill">{_esc(sig.potential_arc)}</span>'
        f'<span class="signal-date">First noticed: {_esc(sig.first_noticed)}</span>'
        f'</div>'
        f'<div class="signal-notes">{_esc(sig.notes)}</div>'
        f'</div>'
        for sig in topics.signal_watch
    )
    return f'{search_box}\n    <div class="signals-list">\n{cards}\n    </div>'


# ── CSS (kept inline so the file is a single drop-in artifact) ───────────────


_CSS = """
  :root {
    --ink: #1C1814; --midnight: #2A2520; --walnut: #5C4A3D;
    --umber: #8B7355; --taupe: #B8A189; --sand: #D9C9B0;
    --bone: #F0E6D0; --paper: #F5F0E8; --gold: #C4A747;
    --dustblue: #7AA3C9; --us: #4A7BA7; --china: #A64D46;
    --neutral: #888780;
    --ep-prisoners: var(--gold);
    --ep-silicon: var(--dustblue);
    --ep-blockades: var(--taupe);
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    background: var(--paper); color: var(--ink);
    font-family: 'IBM Plex Sans', system-ui, sans-serif;
    font-size: 14px; line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  body { min-height: 100vh; padding: 32px 40px 64px; }

  /* Header */
  .header { display: flex; align-items: baseline; justify-content: space-between; max-width: 1240px; margin: 0 auto 24px; }
  .brand { display: flex; align-items: center; gap: 14px; }
  .brand-mark { width: 28px; height: 28px; display: grid; place-items: center; color: var(--gold); font-size: 22px; font-family: 'IBM Plex Serif', Georgia, serif; line-height: 1; }
  .brand h1 { font-family: 'IBM Plex Sans', sans-serif; font-weight: 700; font-size: 22px; letter-spacing: -0.01em; color: var(--ink); }
  .snapshot { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--umber); letter-spacing: 0.05em; }

  /* Tabs */
  .tabs { display: flex; align-items: center; gap: 28px; max-width: 1240px; margin: 0 auto 24px; border-bottom: 1px solid var(--sand); }
  .tab { padding: 10px 2px 12px; font-size: 14px; font-weight: 500; color: var(--umber); cursor: pointer; border-bottom: 2px solid transparent; transition: color 0.15s, border-color 0.15s; display: flex; align-items: center; gap: 8px; background: none; border-top: none; border-left: none; border-right: none; }
  .tab:hover { color: var(--ink); }
  .tab.active { color: var(--ink); border-bottom-color: var(--gold); }
  .tab .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }

  /* Pipeline diagram */
  .pipeline { max-width: 1240px; margin: 0 auto 32px; background: white; border: 1px solid var(--sand); border-radius: 6px; padding: 40px 32px 32px; position: relative; box-shadow: 0 1px 0 rgba(28, 24, 20, 0.02); }
  .stage-row { display: grid; grid-template-columns: repeat(9, 1fr); gap: 16px; margin-bottom: 24px; align-items: center; position: relative; }
  .stage-row::before { content: ''; position: absolute; top: 50%; left: 5%; right: 5%; height: 1px; background: var(--sand); z-index: 0; }
  .stage { background: white; border: 1px solid var(--sand); border-radius: 4px; padding: 14px 8px; text-align: center; font-size: 11px; font-weight: 600; color: var(--walnut); letter-spacing: 0.02em; position: relative; z-index: 1; transition: all 0.15s; }
  .stage.done { background: var(--bone); border-color: var(--taupe); color: var(--midnight); }
  .stage.active { background: var(--gold); border-color: var(--gold); color: var(--ink); box-shadow: 0 2px 8px rgba(196, 167, 71, 0.25); }
  .stage.upcoming { background: white; border-style: dashed; border-color: var(--sand); color: var(--umber); }
  .handoff { position: absolute; top: -22px; width: 18px; height: 18px; background: white; border: 1.5px solid var(--gold); transform: rotate(45deg); display: grid; place-items: center; z-index: 2; }
  .handoff::before { content: 'H'; font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; color: var(--gold); transform: rotate(-45deg); }
  .ep-flags { display: grid; grid-template-columns: repeat(9, 1fr); gap: 16px; min-height: 64px; }
  .ep-flag-column { display: flex; flex-direction: column; gap: 6px; align-items: center; }
  .ep-flag { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px 5px 8px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--ink); background: white; border: 1px solid currentColor; border-radius: 14px; position: relative; }
  .ep-flag::before { content: ''; position: absolute; top: -10px; left: 50%; transform: translateX(-50%); width: 1px; height: 10px; background: currentColor; opacity: 0.4; }
  .ep-flag .ep-dot { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .ep-flag.gold { color: var(--ep-prisoners); }
  .ep-flag.dustblue { color: var(--ep-silicon); }
  .ep-flag.taupe { color: var(--ep-blockades); }
  .ep-flag.sand { color: var(--sand); }
  .legend { display: flex; gap: 24px; margin-top: 24px; padding-top: 18px; border-top: 1px dashed var(--sand); font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--walnut); text-transform: uppercase; letter-spacing: 0.06em; }
  .legend-item { display: flex; align-items: center; gap: 8px; }
  .legend-swatch { width: 12px; height: 12px; border: 1px solid var(--taupe); background: var(--bone); }
  .legend-swatch.active { background: var(--gold); border-color: var(--gold); }
  .legend-swatch.upcoming { background: white; border-style: dashed; }
  .legend-swatch.handoff { background: white; border-color: var(--gold); transform: rotate(45deg); width: 10px; height: 10px; }

  /* Section labels */
  .section-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: var(--umber); letter-spacing: 0.12em; text-transform: uppercase; max-width: 1240px; margin: 32px auto 12px; }

  /* Episode cards */
  .episodes-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; max-width: 1240px; margin: 0 auto; }
  .ep-card { background: white; border: 1px solid var(--sand); border-radius: 6px; padding: 18px 20px 16px; position: relative; transition: transform 0.15s, box-shadow 0.15s; }
  .ep-card:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(28, 24, 20, 0.06); }
  .ep-card .ep-meta-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .ep-card .ep-slug { display: flex; align-items: center; gap: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--walnut); }
  .ep-card .ep-slug .ep-dot { width: 8px; height: 8px; border-radius: 50%; }
  .ep-card.gold .ep-slug .ep-dot { background: var(--ep-prisoners); }
  .ep-card.dustblue .ep-slug .ep-dot { background: var(--ep-silicon); }
  .ep-card.taupe .ep-slug .ep-dot { background: var(--ep-blockades); }
  .ep-card.sand .ep-slug .ep-dot { background: var(--sand); }
  .ep-card .ep-badge { font-family: 'IBM Plex Mono', monospace; font-size: 9px; font-weight: 600; letter-spacing: 0.08em; padding: 3px 7px; border-radius: 3px; text-transform: uppercase; }
  .ep-badge.launch { background: var(--gold); color: var(--ink); }
  .ep-badge.version { background: var(--bone); color: var(--walnut); }
  .ep-badge.draft { background: var(--bone); color: var(--umber); }
  .ep-card h3 { font-family: 'IBM Plex Sans', sans-serif; font-size: 16px; font-weight: 600; color: var(--ink); letter-spacing: -0.01em; margin-bottom: 14px; line-height: 1.3; }
  .ep-card .state-line { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
  .ep-card .state { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.05em; color: var(--ink); }
  .ep-card.gold .state { color: var(--ep-prisoners); }
  .ep-card.dustblue .state { color: var(--ep-silicon); }
  .ep-card.taupe .state { color: var(--ep-blockades); }
  .ep-card .progress-fraction { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--umber); }
  .progress-bar { height: 3px; background: var(--bone); border-radius: 2px; overflow: hidden; margin-bottom: 12px; }
  .progress-fill { height: 100%; border-radius: 2px; background: currentColor; transition: width 0.4s ease-out; }
  .ep-card.gold .progress-bar .progress-fill { background: var(--ep-prisoners); }
  .ep-card.dustblue .progress-bar .progress-fill { background: var(--ep-silicon); }
  .ep-card.taupe .progress-bar .progress-fill { background: var(--ep-blockades); }
  .ep-card .ep-footer { display: flex; gap: 16px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--umber); padding-top: 10px; border-top: 1px dashed var(--sand); }
  .ep-card .ep-footer .label { color: var(--taupe); margin-right: 4px; }

  /* Next-up */
  .next-up { max-width: 1240px; margin: 0 auto; background: white; border: 1px solid var(--sand); border-radius: 6px; padding: 20px 24px; }
  .next-up ol { list-style: none; counter-reset: action; }
  .next-up li { counter-increment: action; position: relative; padding: 8px 0 8px 32px; font-size: 14px; color: var(--ink); line-height: 1.5; }
  .next-up li::before { content: counter(action) "."; position: absolute; left: 0; top: 8px; font-family: 'IBM Plex Mono', monospace; font-weight: 600; color: var(--umber); }
  .next-up li .slug { font-family: 'IBM Plex Mono', monospace; font-weight: 600; color: var(--ink); }
  .next-up li.gold .slug { color: var(--ep-prisoners); }
  .next-up li.dustblue .slug { color: var(--ep-silicon); }
  .next-up li.taupe .slug { color: var(--ep-blockades); }
  .next-up li code { font-family: 'IBM Plex Mono', monospace; background: var(--bone); padding: 1px 5px; border-radius: 3px; color: var(--walnut); font-size: 12px; }
  .next-up .pills { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--sand); }
  .pill { padding: 4px 10px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--walnut); background: var(--bone); border-radius: 12px; letter-spacing: 0.02em; }

  /* Per-episode tab */
  .ep-tab { max-width: 1240px; margin: 0 auto; background: white; border: 1px solid var(--sand); border-radius: 6px; padding: 28px 32px; }
  .ep-tab[hidden] { display: none; }
  .ep-tab-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; padding-bottom: 18px; border-bottom: 1px solid var(--sand); }
  .ep-tab-slug { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--umber); margin-bottom: 6px; letter-spacing: 0.05em; }
  .ep-tab-header h2 { font-family: 'IBM Plex Sans', sans-serif; font-size: 22px; font-weight: 600; letter-spacing: -0.01em; color: var(--ink); line-height: 1.25; }
  .ep-tab-state { text-align: right; }
  .ep-tab-state-pill { display: inline-block; padding: 5px 11px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.08em; background: var(--bone); border-radius: 14px; color: var(--ink); margin-bottom: 6px; }
  .ep-tab.gold .ep-tab-state-pill { background: var(--gold); color: var(--ink); }
  .ep-tab.dustblue .ep-tab-state-pill { background: var(--dustblue); color: white; }
  .ep-tab.taupe .ep-tab-state-pill { background: var(--taupe); color: var(--ink); }
  .ep-tab-state-meta { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--umber); }
  .ep-tab-grid { display: grid; grid-template-columns: 1.2fr 1fr 0.8fr; gap: 24px; }
  .ep-tab-panel h4 { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: var(--umber); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed var(--sand); }
  .checklist { list-style: none; }
  .checklist li { display: flex; align-items: baseline; gap: 8px; padding: 4px 0; font-size: 12px; font-family: 'IBM Plex Mono', monospace; line-height: 1.5; }
  .check-icon { width: 14px; text-align: center; font-size: 12px; }
  .check-ok .check-icon { color: var(--gold); }
  .check-warn .check-icon { color: #B8860B; }
  .check-missing .check-icon { color: var(--neutral); }
  .check-missing .check-label { color: var(--umber); }
  .health-list { list-style: none; }
  .health-item { display: flex; gap: 10px; padding: 8px 0; font-size: 12px; line-height: 1.5; border-bottom: 1px dashed var(--bone); }
  .health-item:last-child { border-bottom: none; }
  .health-icon { font-size: 12px; }
  .health-msg { color: var(--ink); }
  .health-msg code { font-family: 'IBM Plex Mono', monospace; background: var(--bone); padding: 1px 5px; border-radius: 3px; color: var(--walnut); font-size: 11px; }
  .health-clean { font-size: 13px; color: var(--walnut); padding: 8px 0; }
  .metrics-grid { display: flex; flex-direction: column; gap: 6px; }
  .metric { display: flex; justify-content: space-between; font-family: 'IBM Plex Mono', monospace; font-size: 11px; padding: 4px 0; border-bottom: 1px dashed var(--bone); }
  .metric:last-child { border-bottom: none; }
  .metric-label { color: var(--umber); }
  .metric-value { color: var(--ink); font-weight: 500; }
  .metrics-empty { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--umber); padding: 8px 0; }
  .ep-tab-source { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--sand); font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--umber); }
  .ep-tab-source code { background: var(--bone); padding: 1px 5px; border-radius: 3px; color: var(--walnut); }

  /* Topics tab */
  .topics-tab { max-width: 1240px; margin: 0 auto; background: white; border: 1px solid var(--sand); border-radius: 6px; padding: 28px 32px; }
  .topics-tab[hidden] { display: none; }
  .topics-section { margin-bottom: 36px; }
  .topics-section:last-of-type { margin-bottom: 0; }
  .topics-section h4 { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: var(--umber); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px dashed var(--sand); }
  .funnel { list-style: none; display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
  .funnel-state { background: var(--paper); border: 1px solid var(--sand); border-radius: 6px; padding: 14px 12px; display: flex; flex-direction: column; gap: 8px; }
  .funnel-emoji { font-size: 22px; }
  .funnel-label { font-family: 'IBM Plex Sans', sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 0.04em; color: var(--ink); line-height: 1.3; }
  .funnel-desc { font-size: 11px; color: var(--walnut); line-height: 1.4; }
  .topics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
  .topic-card { background: var(--paper); border: 1px solid var(--sand); border-radius: 4px; padding: 14px 16px; }
  .topic-ep { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: var(--gold); letter-spacing: 0.12em; font-weight: 700; margin-bottom: 6px; }
  .topic-slug { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--ink); margin-bottom: 6px; font-weight: 600; }
  .topic-format { font-family: 'IBM Plex Serif', Georgia, serif; font-style: italic; font-size: 12px; color: var(--walnut); margin-bottom: 4px; }
  .topic-arc { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--umber); margin-bottom: 10px; }
  .topic-state { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--ink); padding-top: 8px; border-top: 1px dashed var(--sand); }
  .signals-list { display: flex; flex-direction: column; gap: 12px; }
  .signal-card { background: var(--paper); border: 1px solid var(--sand); border-radius: 4px; padding: 14px 18px; }
  .signal-title { font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; font-weight: 600; color: var(--ink); margin-bottom: 8px; line-height: 1.4; }
  .signal-meta { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; align-items: baseline; }
  .signal-pill { padding: 2px 8px; font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: var(--walnut); background: var(--bone); border-radius: 8px; letter-spacing: 0.04em; text-transform: uppercase; }
  .signal-date { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: var(--umber); margin-left: auto; }
  .signal-notes { font-size: 12px; color: var(--walnut); line-height: 1.5; }
  .topics-empty { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--umber); padding: 24px; text-align: center; }
  .topics-source { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--sand); font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--umber); }
  .topics-source code { background: var(--bone); padding: 1px 5px; border-radius: 3px; color: var(--walnut); }

  /* Click-to-copy on inline shell commands.
     Any <code> wrapped in <code class=\"copyable\"> becomes hover-clickable;
     the JS wires the actual clipboard write + visual feedback. */
  code.copyable { cursor: pointer; position: relative; transition: background 0.12s; }
  code.copyable:hover { background: var(--gold); color: var(--ink); }
  code.copyable.copied { background: var(--gold); color: var(--ink); }
  code.copyable.copied::after {
    content: 'copied';
    position: absolute;
    top: -22px; left: 50%; transform: translateX(-50%);
    background: var(--ink); color: var(--paper);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase;
    padding: 3px 8px; border-radius: 3px;
    pointer-events: none; white-space: nowrap;
    animation: copied-pop 1.2s ease-out forwards;
  }
  @keyframes copied-pop {
    0% { opacity: 0; transform: translate(-50%, 4px); }
    15% { opacity: 1; transform: translate(-50%, 0); }
    85% { opacity: 1; }
    100% { opacity: 0; transform: translate(-50%, -4px); }
  }

  /* Signal-watch search box */
  .signals-search { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding: 10px 14px; background: var(--paper); border: 1px solid var(--sand); border-radius: 4px; }
  .signals-search label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--umber); letter-spacing: 0.06em; text-transform: uppercase; flex-shrink: 0; }
  .signals-search input { flex: 1; border: none; background: transparent; outline: none; font-family: 'IBM Plex Sans', sans-serif; font-size: 13px; color: var(--ink); }
  .signals-search input::placeholder { color: var(--taupe); }
  .signals-search .signal-count { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--walnut); letter-spacing: 0.06em; flex-shrink: 0; }
  .signal-card[hidden] { display: none; }

  /* Footer */
  .source { max-width: 1240px; margin: 32px auto 0; padding-top: 16px; border-top: 1px solid var(--sand); font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--umber); line-height: 1.6; }
  .source code { color: var(--walnut); background: var(--bone); padding: 1px 5px; border-radius: 3px; }
"""


_JS = """
  // ── Tab switching ────────────────────────────────────────────────────────
  // Overview content is the unkeyed top-level (diagram + episodes-grid + next-up).
  // Per-episode + topics tabs have [data-tab-content="<slug>"] panels that
  // get toggled with [hidden]. Overview is shown when no per-episode tab
  // is active.
  const overviewSlots = document.querySelectorAll('[data-overview]');
  const namedPanels = document.querySelectorAll('[data-tab-content]');
  function showTab(name) {
    const isOverview = name === 'overview';
    overviewSlots.forEach(el => el.hidden = !isOverview);
    namedPanels.forEach(el => el.hidden = el.dataset.tabContent !== name);
  }
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      showTab(tab.dataset.tab);
    });
  });

  // ── Click-to-copy on shell commands ───────────────────────────────────────
  // Every <code class=\"copyable\"> becomes clickable — the click writes the
  // text content to the clipboard and flashes a "copied" indicator. Falls
  // back silently on browsers without navigator.clipboard (cowork iframe
  // sandbox can be restrictive; the visual hover still works).
  document.querySelectorAll('code.copyable').forEach(el => {
    el.title = 'Click to copy';
    el.addEventListener('click', async () => {
      const text = el.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Fallback: select the text so the user can ⌘C manually
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
      el.classList.add('copied');
      setTimeout(() => el.classList.remove('copied'), 1200);
    });
  });

  // ── Signal-watch search ──────────────────────────────────────────────────
  // Filters .signal-card siblings by visible text (signal title + meta +
  // notes + arc + discovery path). Case-insensitive substring match.
  // Updates the count display so the operator sees "3 of 9 match".
  const signalSearch = document.querySelector('#signals-filter');
  if (signalSearch) {
    const cards = Array.from(document.querySelectorAll('.signal-card'));
    const countEl = document.querySelector('#signals-count');
    const total = cards.length;
    const update = () => {
      const q = signalSearch.value.trim().toLowerCase();
      let shown = 0;
      cards.forEach(card => {
        const hit = !q || card.textContent.toLowerCase().includes(q);
        card.hidden = !hit;
        if (hit) shown++;
      });
      if (countEl) countEl.textContent = q ? `${shown} of ${total} match` : `${total} signals`;
    };
    signalSearch.addEventListener('input', update);
    update();
  }
"""


# ── Top-level render ─────────────────────────────────────────────────────────


def render_dashboard_html(
    statuses: list[EpisodeStatus],
    topics: TopicsData | None = None,
    snapshot_date: str | None = None,
) -> str:
    """Render the whole dashboard as a single self-contained HTML string."""
    from topics_parser import TopicsData

    if topics is None:
        topics = TopicsData()

    today = snapshot_date or datetime.date.today().isoformat()

    diagram_html = _render_pipeline_diagram(statuses)
    cards_html = "\n".join(_render_episode_card(s) for s in statuses)
    next_up_html = _render_next_up(statuses)
    episode_tabs_html = "\n".join(_render_episode_tab(s) for s in statuses)
    topics_html = _render_topics_tab(topics)

    # Tab buttons — Overview, one per episode, Topics. Dot color comes
    # straight from the brand palette (--gold / --dustblue / --taupe /
    # --sand) rather than the role-based aliases — keeps the tabbar from
    # depending on which episode happens to be the launch candidate.
    tab_buttons: list[str] = ['<button class="tab active" role="tab" data-tab="overview">Overview</button>']
    for s in statuses:
        accent = _accent_for(s.slug)  # "gold" | "dustblue" | "taupe" | "sand"
        tab_buttons.append(
            f'<button class="tab" role="tab" data-tab="{_esc(s.slug)}">'
            f'<span class="dot" style="background: var(--{accent});"></span>'
            f'{_esc(s.slug)}</button>'
        )
    tab_buttons.append('<button class="tab" role="tab" data-tab="topics">Topics</button>')
    tabs_html = "\n  ".join(tab_buttons)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Parallax Pipeline</title>
<!-- AUTO-GENERATED by tools/pipeline_html.py — do not hand-edit.
     Regenerate: python3 tools/pipeline_validator.py --emit-html
     CI freshness gate: scripts/lint.sh runs --emit-html --check -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Serif:ital,wght@0,400;0,500;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>{_CSS}</style>
</head>
<body>

<header class="header">
  <div class="brand">
    <div class="brand-mark">∴</div>
    <h1>Parallax Pipeline</h1>
  </div>
  <div class="snapshot">SNAPSHOT {_esc(today)}</div>
</header>

<nav class="tabs" role="tablist">
  {tabs_html}
</nav>

<div data-overview>
{diagram_html}

<div class="section-label">Episodes</div>

<section class="episodes-grid">
{cards_html}
</section>

<div class="section-label">What to work on next</div>

{next_up_html}
</div>

{episode_tabs_html}

{topics_html}

<footer class="source">
  Source: <code>episodes/pipeline-state.json</code> · per-episode <code>_status.md</code> · <code>project/IDEAS.md</code>.
  Auto-generated by <code>tools/pipeline_validator.py --emit-html</code>.
  Snapshot rendered {_esc(today)}.
</footer>

<script>{_JS}</script>
</body>
</html>
"""


# ── CLI helpers (called from pipeline_validator.py --emit-html) ──────────────


def _display_path(p: Path) -> str:
    """Render a path relative to project root if possible, else absolute.
    Keeps test-tmpdir paths from blowing up `relative_to` while still
    printing the friendly relative form in production."""
    try:
        return str(p.relative_to(ROOT))
    except ValueError:
        return str(p)


def emit_html(output: Path | None = None, check: bool = False) -> int:
    """Top-level CLI helper. Returns exit code (0 ok, 1 drift in --check)."""
    from pipeline_validator import compute_episode_status, load_pipeline_state
    from topics_parser import load_topics

    entries = load_pipeline_state()
    if not entries:
        print("✗ episodes/pipeline-state.json not found or empty", file=sys.stderr)
        return 2
    statuses = [compute_episode_status(e) for e in entries]
    topics = load_topics()
    content = render_dashboard_html(statuses, topics)

    target = output or DEFAULT_OUTPUT
    target.parent.mkdir(parents=True, exist_ok=True)
    disp = _display_path(target)

    if check:
        if not target.exists():
            print(
                f"✗ {disp} missing — run "
                f"`python3 tools/pipeline_validator.py --emit-html` to create it.",
                file=sys.stderr,
            )
            return 1
        current = target.read_text(encoding="utf-8")
        if current.strip() != content.strip():
            print(
                f"✗ {disp} is stale — run "
                f"`python3 tools/pipeline_validator.py --emit-html` to refresh.",
                file=sys.stderr,
            )
            return 1
        print(f"✓ {disp} up to date")
        return 0

    target.write_text(content, encoding="utf-8")
    print(f"✓ wrote {disp}")
    return 0
