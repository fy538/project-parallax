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

# Brand mark via tools/brand.py (single source of truth). NO hardcoded
# "∴" in this file — the only acceptable place to write the literal
# glyph is tools/brand-treatment/palette.json::brandMark.glyph.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from brand import get_brand_mark  # noqa: E402
from status_emoji import ERROR, OK, WARN  # noqa: E402

if TYPE_CHECKING:
    from cost_parser import CostData
    from pipeline_validator import EpisodeStatus
    from topics_parser import TopicsData

ROOT = get_project_root()
_BRAND_MARK_GLYPH = get_brand_mark().glyph

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
    quick_actions_html = _render_episode_quick_actions(s)
    timeline_html = _render_episode_timeline(s)

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
{quick_actions_html}
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
{timeline_html}
  <div class="ep-tab-source">
    Source · <code>episodes/{_esc(s.slug)}/_status.md</code> (auto-generated by
    <code>tools/pipeline_validator.py --write-status</code>) ·
    <code>episodes/{_esc(s.slug)}/_state-history.jsonl</code> (append-only
    via <code>tools/state_history.py record</code>)
  </div>
</section>"""


def _render_episode_timeline(s: EpisodeStatus) -> str:
    """State-transition timeline strip — reads tools/state_history.py.

    Each transition becomes a node on a horizontal time-axis. Nodes are
    spaced proportionally by the days between transitions, so a fast
    advance through DRAFTING shows up visually different from a long
    stall in INCUBATING. Always-present: the current state is the
    rightmost node (open dot) showing how long the episode has been there.
    """
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    from state_history import load_history  # type: ignore[import-not-found]

    history = load_history(s.slug)
    if not history:
        return (
            '  <div class="ep-tab-timeline ep-tab-timeline-empty">'
            'Timeline · no <code>_state-history.jsonl</code> yet — run '
            '<code class="copyable">python3 tools/state_history.py bootstrap</code></div>'
        )

    today = datetime.date.today()
    earliest = history[0].date
    span_days = max((today - earliest).days, 1)

    def x_pos(d: datetime.date) -> float:
        return (d - earliest).days / span_days * 100

    nodes_html: list[str] = []
    for i, t in enumerate(history):
        pos = x_pos(t.date)
        days_in_prev = ""
        if i > 0:
            delta = (t.date - history[i - 1].date).days
            days_in_prev = f"+{delta}d"
        from_label = f" (from {t.from_state})" if t.from_state else ""
        reason_clause = (": " + t.reason) if t.reason else ""
        delta_div = f'<div class="timeline-delta">{_esc(days_in_prev)}</div>' if days_in_prev else ''
        nodes_html.append(
            f'    <div class="timeline-node" style="left: {pos:.2f}%;" '
            f'title="{_esc(t.date.isoformat())} → {_esc(t.to_state)}{_esc(from_label + reason_clause)}">'
            f'<div class="timeline-dot"></div>'
            f'<div class="timeline-label">{_esc(t.to_state)}</div>'
            f'<div class="timeline-date">{_esc(t.date.isoformat())}</div>'
            f'{delta_div}'
            f'</div>'
        )

    # Final marker: "today" at the right edge if current state ongoing >0 days.
    days_in_current = (today - history[-1].date).days
    if days_in_current > 0:
        nodes_html.append(
            f'    <div class="timeline-node timeline-node-now" '
            f'style="left: 100%;" title="Today · day {days_in_current} in {_esc(history[-1].to_state)}">'
            f'<div class="timeline-dot timeline-dot-open"></div>'
            f'<div class="timeline-label">Now</div>'
            f'<div class="timeline-date">{_esc(today.isoformat())}</div>'
            f'<div class="timeline-delta">+{days_in_current}d</div>'
            f'</div>'
        )

    return f"""  <div class="ep-tab-timeline">
    <h4>State transitions · {len(history)} event{'s' if len(history) != 1 else ''} over {span_days} day{'s' if span_days != 1 else ''}</h4>
    <div class="timeline-track">
{chr(10).join(nodes_html)}
    </div>
    <div class="timeline-axis">
      <span class="timeline-axis-start">{_esc(earliest.isoformat())}</span>
      <span class="timeline-axis-end">{_esc(today.isoformat())}</span>
    </div>
  </div>"""


def _render_episode_quick_actions(s: EpisodeStatus) -> str:
    """Curated 3-4 most-likely-next commands as copyable chips.

    Picks contextually based on the episode's current state + health.
    Operator workflow: open a tab, see the immediately-actionable
    commands, click to copy, paste into terminal. Faster than reading
    the Health section's prose remediation lines.
    """
    actions: list[tuple[str, str]] = []  # (label, shell command)

    # Always: refresh status (no-op if already fresh, but useful starting point)
    actions.append((
        "Refresh status",
        f"python3 tools/pipeline_validator.py --write-status {s.slug}",
    ))

    if s.manifest_stale or not s.has_manifest:
        actions.append((
            "Generate manifest" if not s.has_manifest else "Regen stale manifest",
            f"python3 tools/assembly/generate_manifest.py {s.slug}",
        ))

    if s.zero_hit_count > 0:
        actions.append((
            f"Fill {s.zero_hit_count} zero-hit asset{'s' if s.zero_hit_count != 1 else ''}",
            f"python3 tools/asset-source/zerohit_fallback.py {s.slug}",
        ))

    if s.has_manifest and not s.has_render:
        actions.append((
            "First full render",
            f"cd remotion-templates && node scripts/render-episode.mjs --episode={s.slug}",
        ))

    if s.has_render and not s.has_narration:
        actions.append((
            "Open NLE / record narration",
            f"open episodes/{s.slug}/assets/",
        ))

    if s.state == "INCUBATING":
        actions.append((
            "Run viability gate",
            f"python3 tools/topic/idea_invalidation.py {s.slug}",
        ))

    # Always: open the canonical operator dashboard
    actions.append((
        "Open _status.md",
        f"open episodes/{s.slug}/_status.md",
    ))

    chips = "\n".join(
        f'      <button class="quick-action" data-cmd="{_esc(cmd)}">'
        f'<span class="quick-action-label">{_esc(label)}</span>'
        f'<code class="quick-action-cmd copyable">{_esc(cmd)}</code>'
        f'</button>'
        for label, cmd in actions
    )
    return f"""  <div class="quick-actions">
    <div class="quick-actions-label">Quick actions · click to copy</div>
    <div class="quick-actions-row">
{chips}
    </div>
  </div>"""


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
            ERROR,
            f"Manifest stale ({s.manifest_stale_drift_str} drift) — "
            f"<code class=\"copyable\">python3 tools/assembly/generate_manifest.py {s.slug}</code>",
        ))
    if s.zero_hit_count > 0:
        health.append((
            WARN,
            f"{s.zero_hit_count} zero-hit shot{'s' if s.zero_hit_count != 1 else ''} "
            f"— <code class=\"copyable\">python3 tools/asset-source/zerohit_fallback.py {s.slug}</code>",
        ))
    if s.has_manifest and s.manifest_mode == "estimate" and s.has_narration:
        health.append((
            WARN,
            "Manifest in estimate mode but narration recorded — regenerate in precise mode",
        ))
    if s.has_manifest and not s.has_render:
        health.append((
            WARN,
            f"Manifest ready but never rendered — "
            f"<code class=\"copyable\">cd remotion-templates && node scripts/render-episode.mjs --episode={s.slug}</code>",
        ))
    if s.has_render and not s.has_narration:
        health.append((
            WARN,
            "Rendered but no narration recorded yet",
        ))
    if not health:
        return (
            f'      <div class="health-clean">{OK} No health issues detected.</div>'
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


# ── Spend tab ────────────────────────────────────────────────────────────────


def _render_spend_tab(cost: CostData) -> str:
    """The Spend tab — per-episode + per-service breakdowns.

    Two views side-by-side: episodes ranked by total spend, services
    ranked by total spend. Plus a recent-rows table (last 10).

    Empty state when no real spend logged — common pre-launch. Shows
    a "what to expect" message that points at the cost_tracker CLI so
    the tab isn't dead before any spend accumulates.
    """
    if cost.is_empty:
        return """<section class="spend-tab" data-tab-content="spend" hidden>
  <div class="spend-empty">
    <div class="spend-empty-icon">$0.00</div>
    <h3>No spend logged yet</h3>
    <p>
      The cost log (<code>episodes/COST_LOG.md</code>) has no real rows.
      Spend events get added one per row as you ship — research credits,
      AI illustration calls, mastering, lambda renders. The Markdown file
      lists rough per-stage targets ($10–80 per episode total).
    </p>
    <p>
      Once <code>python3 tools/cost_tracker.py add</code> starts logging
      real spend, this tab will fill in with per-episode and per-service
      breakdowns automatically — no separate refresh needed.
    </p>
  </div>
</section>"""

    ep_max = max(cost.by_episode.values(), default=1) or 1
    ep_rows_html = "\n".join(
        f'      <div class="spend-row">'
        f'<span class="spend-label">{_esc(ep)}</span>'
        f'<div class="spend-bar"><div class="spend-bar-fill" style="width: {amt / ep_max * 100:.1f}%;"></div></div>'
        f'<span class="spend-amount">${amt:.2f}</span>'
        f'</div>'
        for ep, amt in sorted(cost.by_episode.items(), key=lambda kv: -kv[1])
    )
    svc_max = max(cost.by_service.values(), default=1) or 1
    svc_rows_html = "\n".join(
        f'      <div class="spend-row">'
        f'<span class="spend-label">{_esc(svc)}</span>'
        f'<div class="spend-bar"><div class="spend-bar-fill" style="width: {amt / svc_max * 100:.1f}%;"></div></div>'
        f'<span class="spend-amount">${amt:.2f}</span>'
        f'</div>'
        for svc, amt in sorted(cost.by_service.items(), key=lambda kv: -kv[1])
    )

    recent = list(reversed(cost.rows))[:10]
    table_rows = "\n".join(
        f'        <tr><td>{_esc(r.date)}</td><td>{_esc(r.episode)}</td>'
        f'<td>{_esc(r.service)}</td><td class="amt">${r.amount_usd:.2f}</td>'
        f'<td class="note">{_esc(r.note)}</td></tr>'
        for r in recent
    )

    return f"""<section class="spend-tab" data-tab-content="spend" hidden>
  <header class="spend-header">
    <div>
      <div class="spend-total-label">Total spend to date</div>
      <div class="spend-total">${cost.total_usd:.2f}</div>
    </div>
    <div class="spend-count">{len(cost.rows)} event{'s' if len(cost.rows) != 1 else ''} across {len(cost.by_episode)} episode{'s' if len(cost.by_episode) != 1 else ''}</div>
  </header>
  <div class="spend-grid">
    <div class="spend-panel">
      <h4>By episode</h4>
      <div class="spend-bars">
{ep_rows_html}
      </div>
    </div>
    <div class="spend-panel">
      <h4>By service</h4>
      <div class="spend-bars">
{svc_rows_html}
      </div>
    </div>
  </div>
  <div class="spend-recent">
    <h4>Recent spend (last {len(recent)})</h4>
    <table class="spend-table">
      <thead><tr><th>Date</th><th>Episode</th><th>Service</th><th class="amt">Amount</th><th>Note</th></tr></thead>
      <tbody>
{table_rows}
      </tbody>
    </table>
  </div>
  <div class="spend-source">
    Source · <code>episodes/COST_LOG.md</code> (hand-curated; one row per spend event).
    Add via <code class="copyable">python3 tools/cost_tracker.py add --episode &lt;slug&gt; --service &lt;svc&gt; --amount &lt;usd&gt; --note "&lt;note&gt;"</code>
  </div>
</section>"""


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

  /* Per-episode state-transition timeline.
     Horizontal track with dots positioned proportionally by date. */
  .ep-tab-timeline { margin: 24px 0 0; padding: 18px 0 0; border-top: 1px solid var(--sand); }
  .ep-tab-timeline h4 { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: var(--umber); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 24px; }
  .ep-tab-timeline-empty { padding: 14px 0; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--umber); }
  .ep-tab-timeline-empty code { background: var(--bone); padding: 1px 5px; border-radius: 3px; color: var(--walnut); }
  .timeline-track { position: relative; height: 72px; margin: 0 12px 8px; background: linear-gradient(to right, var(--bone) 0%, var(--bone) 100%); background-size: 100% 1px; background-repeat: no-repeat; background-position: 0 12px; }
  .timeline-node { position: absolute; transform: translateX(-50%); top: 0; display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 80px; }
  .timeline-dot { width: 12px; height: 12px; border-radius: 50%; background: var(--gold); border: 2px solid white; box-shadow: 0 0 0 1px var(--gold); margin-bottom: 4px; cursor: help; }
  .timeline-dot-open { background: white; box-shadow: 0 0 0 1.5px var(--gold); }
  .timeline-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: var(--ink); letter-spacing: 0.04em; }
  .timeline-date { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: var(--umber); }
  .timeline-delta { font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: var(--gold); font-weight: 600; }
  .timeline-axis { display: flex; justify-content: space-between; margin: 6px 12px 0; font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: var(--umber); letter-spacing: 0.04em; }

  /* Spend tab */
  .spend-tab { max-width: 1240px; margin: 0 auto; background: white; border: 1px solid var(--sand); border-radius: 6px; padding: 28px 32px; }
  .spend-tab[hidden] { display: none; }
  .spend-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; padding-bottom: 18px; border-bottom: 1px solid var(--sand); }
  .spend-total-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--umber); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 6px; }
  .spend-total { font-family: 'IBM Plex Sans', sans-serif; font-size: 32px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }
  .spend-count { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--walnut); }
  .spend-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 28px; }
  .spend-panel h4 { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: var(--umber); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 14px; padding-bottom: 8px; border-bottom: 1px dashed var(--sand); }
  .spend-bars { display: flex; flex-direction: column; gap: 8px; }
  .spend-row { display: grid; grid-template-columns: 140px 1fr 70px; align-items: center; gap: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; }
  .spend-label { color: var(--walnut); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .spend-bar { background: var(--bone); height: 8px; border-radius: 4px; overflow: hidden; }
  .spend-bar-fill { background: var(--gold); height: 100%; border-radius: 4px; }
  .spend-amount { text-align: right; color: var(--ink); font-weight: 600; }
  .spend-recent h4 { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: var(--umber); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed var(--sand); }
  .spend-table { width: 100%; border-collapse: collapse; font-family: 'IBM Plex Mono', monospace; font-size: 11px; }
  .spend-table thead th { text-align: left; padding: 6px 12px 6px 0; color: var(--umber); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; font-size: 9px; border-bottom: 1px solid var(--sand); }
  .spend-table tbody td { padding: 7px 12px 7px 0; color: var(--ink); border-bottom: 1px dashed var(--bone); }
  .spend-table tbody tr:last-child td { border-bottom: none; }
  .spend-table .amt { text-align: right; font-weight: 600; }
  .spend-table .note { color: var(--walnut); }
  .spend-empty { text-align: center; padding: 64px 32px; color: var(--walnut); }
  .spend-empty-icon { font-family: 'IBM Plex Sans', sans-serif; font-size: 48px; font-weight: 700; color: var(--taupe); margin-bottom: 16px; letter-spacing: -0.02em; }
  .spend-empty h3 { font-family: 'IBM Plex Sans', sans-serif; font-size: 18px; color: var(--ink); margin-bottom: 12px; }
  .spend-empty p { font-size: 13px; color: var(--walnut); max-width: 560px; margin: 0 auto 12px; line-height: 1.6; }
  .spend-empty code { font-family: 'IBM Plex Mono', monospace; background: var(--bone); padding: 1px 5px; border-radius: 3px; color: var(--walnut); font-size: 12px; }
  .spend-source { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--sand); font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--umber); line-height: 1.6; }
  .spend-source code { background: var(--bone); padding: 1px 5px; border-radius: 3px; color: var(--walnut); }

  /* Per-episode quick-actions toolbar — curated next-step commands as
     copyable chips. Sits between the tab header and the 3-panel grid. */
  .quick-actions { margin: 0 0 22px; padding: 14px 18px; background: var(--paper); border: 1px solid var(--sand); border-radius: 4px; }
  .quick-actions-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; color: var(--umber); letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 10px; }
  .quick-actions-row { display: flex; flex-wrap: wrap; gap: 8px; }
  .quick-action { display: inline-flex; flex-direction: column; align-items: flex-start; gap: 4px; padding: 8px 12px; background: white; border: 1px solid var(--sand); border-radius: 4px; cursor: pointer; transition: border-color 0.12s, transform 0.12s; font-family: inherit; }
  .quick-action:hover { border-color: var(--gold); transform: translateY(-1px); }
  .quick-action-label { font-family: 'IBM Plex Sans', sans-serif; font-size: 11px; font-weight: 600; color: var(--ink); }
  .quick-action-cmd { font-family: 'IBM Plex Mono', monospace; font-size: 10px; background: var(--bone); padding: 2px 6px; border-radius: 2px; color: var(--walnut); max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .quick-action.copied { border-color: var(--gold); background: rgba(196, 167, 71, 0.06); }

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
  // Two click targets:
  //   1. <code class="copyable"> — inline commands inside prose
  //   2. <button class="quick-action" data-cmd="..."> — toolbar chips
  // Both write to clipboard + flash a "copied" indicator. Fallback selects
  // the text so the user can ⌘C manually (cowork iframe sandbox can be
  // restrictive about clipboard access).
  async function copyText(text) {
    try { await navigator.clipboard.writeText(text); return true; }
    catch { return false; }
  }
  function selectNode(el) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
  document.querySelectorAll('code.copyable').forEach(el => {
    el.title = 'Click to copy';
    el.addEventListener('click', async (ev) => {
      // Inside a quick-action button — let the parent handler fire to
      // avoid double-flash + ambiguity.
      if (el.closest('.quick-action')) return;
      ev.stopPropagation();
      const text = el.textContent.trim();
      if (!(await copyText(text))) selectNode(el);
      el.classList.add('copied');
      setTimeout(() => el.classList.remove('copied'), 1200);
    });
  });
  document.querySelectorAll('.quick-action').forEach(btn => {
    btn.title = 'Click to copy command';
    btn.addEventListener('click', async () => {
      const text = (btn.dataset.cmd || btn.querySelector('.quick-action-cmd')?.textContent || '').trim();
      if (!(await copyText(text))) {
        const code = btn.querySelector('.quick-action-cmd');
        if (code) selectNode(code);
      }
      btn.classList.add('copied');
      setTimeout(() => btn.classList.remove('copied'), 1200);
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
    cost: CostData | None = None,
    snapshot_date: str | None = None,
) -> str:
    """Render the whole dashboard as a single self-contained HTML string."""
    from cost_parser import CostData
    from topics_parser import TopicsData

    if topics is None:
        topics = TopicsData()
    if cost is None:
        cost = CostData()

    today = snapshot_date or datetime.date.today().isoformat()

    diagram_html = _render_pipeline_diagram(statuses)
    cards_html = "\n".join(_render_episode_card(s) for s in statuses)
    next_up_html = _render_next_up(statuses)
    episode_tabs_html = "\n".join(_render_episode_tab(s) for s in statuses)
    topics_html = _render_topics_tab(topics)
    spend_html = _render_spend_tab(cost)

    # Tab buttons — Overview, one per episode, Spend, Topics. Dot color
    # comes straight from the brand palette so the tabbar doesn't depend
    # on which episode happens to be the launch candidate.
    tab_buttons: list[str] = ['<button class="tab active" role="tab" data-tab="overview">Overview</button>']
    for s in statuses:
        accent = _accent_for(s.slug)  # "gold" | "dustblue" | "taupe" | "sand"
        tab_buttons.append(
            f'<button class="tab" role="tab" data-tab="{_esc(s.slug)}">'
            f'<span class="dot" style="background: var(--{accent});"></span>'
            f'{_esc(s.slug)}</button>'
        )
    tab_buttons.append('<button class="tab" role="tab" data-tab="spend">Spend</button>')
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
    <div class="brand-mark">{_esc(_BRAND_MARK_GLYPH)}</div>
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

{spend_html}

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


# Files whose mtime triggers a regen in --watch mode. Order chosen so the
# message printed on change names the most likely culprit. Per-episode
# _status.md / _state-history.jsonl are folded in dynamically (one entry
# per episode currently in pipeline-state.json).
def _watched_paths() -> list[Path]:
    """Return the file list the watch loop polls. Includes per-episode
    _status.md + _state-history.jsonl + the canonical sources."""
    from pipeline_validator import load_pipeline_state
    paths: list[Path] = [
        ROOT / "episodes" / "pipeline-state.json",
        ROOT / "project" / "IDEAS.md",
        ROOT / "episodes" / "COST_LOG.md",
        ROOT / "tools" / "pipeline_html.py",
        ROOT / "tools" / "topics_parser.py",
        ROOT / "tools" / "cost_parser.py",
        ROOT / "tools" / "state_history.py",
        ROOT / "tools" / "pipeline_validator.py",
    ]
    for entry in load_pipeline_state():
        paths.append(ROOT / "episodes" / entry.slug / "_status.md")
        paths.append(ROOT / "episodes" / entry.slug / "_state-history.jsonl")
    return paths


def _emit_once(output: Path) -> None:
    """One render pass: load all data, render, write. No --check semantics."""
    from cost_parser import load_cost_data
    from pipeline_validator import compute_episode_status, load_pipeline_state
    from topics_parser import load_topics

    entries = load_pipeline_state()
    if not entries:
        raise RuntimeError("episodes/pipeline-state.json missing or empty")
    statuses = [compute_episode_status(e) for e in entries]
    content = render_dashboard_html(
        statuses, load_topics(), cost=load_cost_data(),
    )
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(content, encoding="utf-8")


def emit_html(
    output: Path | None = None,
    check: bool = False,
    watch: bool = False,
    poll_interval_sec: float = 1.0,
) -> int:
    """Top-level CLI helper. Returns exit code (0 ok, 1 drift in --check).

    Three modes:
      · default        — render once, write to `output`, return 0
      · check=True     — render but don't write; exit 1 if disk drift
      · watch=True     — render once, then poll source files for mtime
                         changes and re-emit on each change. Ctrl-C exits.
                         Incompatible with check.
    """
    from cost_parser import load_cost_data
    from pipeline_validator import compute_episode_status, load_pipeline_state
    from topics_parser import load_topics

    target = output or DEFAULT_OUTPUT
    target.parent.mkdir(parents=True, exist_ok=True)
    disp = _display_path(target)

    if watch:
        if check:
            print("✗ --watch and --check are incompatible", file=sys.stderr)
            return 2
        return _watch_loop(target, poll_interval_sec)

    entries = load_pipeline_state()
    if not entries:
        print("✗ episodes/pipeline-state.json not found or empty", file=sys.stderr)
        return 2
    statuses = [compute_episode_status(e) for e in entries]
    topics = load_topics()
    cost = load_cost_data()
    content = render_dashboard_html(statuses, topics, cost=cost)

    # `target` + `disp` were already set above (before the watch branch);
    # re-using them here keeps the write/check paths consistent.

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


def _watch_loop(output: Path, poll_interval_sec: float) -> int:
    """Render-on-change loop. Polls every watched source file's mtime
    every `poll_interval_sec` seconds. On any change, regenerates the
    HTML and prints a brief log line naming the trigger.

    Ctrl-C exits with code 0. Uncaught exceptions during regen print to
    stderr but don't kill the loop — fix the source, save, watch
    converge. The poll interval defaults to 1s; that's responsive enough
    to feel live without burning CPU.
    """
    import signal
    import time

    disp = _display_path(output)
    stop = {"flag": False}

    def _on_sigint(signum, frame):
        stop["flag"] = True

    signal.signal(signal.SIGINT, _on_sigint)
    print(f"watching · re-emits to {disp} on change · Ctrl-C to exit")
    last_mtimes: dict[Path, float] = {}

    # Initial render so the file is fresh when the loop starts
    try:
        _emit_once(output)
        print(f"✓ initial render → {disp}")
    except Exception as e:  # noqa: BLE001 — surface any startup error
        print(f"✗ initial render failed: {e}", file=sys.stderr)

    while not stop["flag"]:
        try:
            changed: list[Path] = []
            for p in _watched_paths():
                try:
                    mtime = p.stat().st_mtime
                except FileNotFoundError:
                    continue
                if last_mtimes.get(p) != mtime:
                    if p in last_mtimes:  # not the first iteration
                        changed.append(p)
                    last_mtimes[p] = mtime
            if changed:
                names = ", ".join(_display_path(p) for p in changed)
                try:
                    _emit_once(output)
                    print(f"  ↻ regen ({names})")
                except Exception as e:  # noqa: BLE001 — keep loop alive
                    print(f"  ✗ regen failed ({names}): {e}", file=sys.stderr)
            time.sleep(poll_interval_sec)
        except InterruptedError:
            break
    print("\n✓ watch exited")
    return 0
