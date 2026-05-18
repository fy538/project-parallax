# `tools/pipeline_dashboard/`

A self-contained HTML rendering of the Parallax episode pipeline. Open `index.html` in a browser (or drop into Claude.ai's cowork pane) to see at-a-glance state, per-episode progress, and "what to work on next."

## Status

**Auto-generated** from the same data sources that drive the Markdown dashboards:

- `episodes/pipeline-state.json` — state + dates + format + target (machine truth)
- per-episode `_status.md` data via `pipeline_validator.compute_episode_status` (artifact presence, manifest mode, zero-hit counts, costs)
- `project/IDEAS.md` — Launch sequence + Signal watch + Topic lifecycle (parsed by `tools/topics_parser.py`)

**Regenerate:**

```bash
python3 tools/pipeline_validator.py --emit-html
```

**Check freshness** (CI gate — wired into `scripts/lint.sh`):

```bash
python3 tools/pipeline_validator.py --emit-html --check
```

The emitter lives at `tools/pipeline_html.py`; the IDEAS.md parser at `tools/topics_parser.py`. Both have full pytest coverage. Editing `index.html` by hand is a temporary hack only — the next `--emit-html` run will overwrite it. If the design needs to change, edit the emitter.

## Why a separate HTML rendering

The Markdown dashboards (`PIPELINE.md` + `_status.md`) are the canonical operator surface — they get auto-refreshed on every `pipeline_validator.py` run, they read well in IDEs and GitHub, and they don't require a browser. This HTML view is for:

- **Visual scanning** — the 9-stage pipeline diagram makes "where is everything blocked" obvious at a glance, vs. reading 3 Markdown files.
- **Cowork iteration** — single-file artifact that drops into Claude.ai's cowork pane for design iteration.
- **External sharing** — if Tiger wants to show the pipeline to a collaborator without exposing the repo, this file is screenshot-friendly.

## Architecture

```
episodes/pipeline-state.json        ─┐
episodes/<slug>/{assets,scripts,...} ┼─► pipeline_validator.compute_episode_status
                                      │       │
                                      │       ▼
                                      │   list[EpisodeStatus] ──┐
                                      │                         │
project/IDEAS.md ──► topics_parser ──► TopicsData ──────────────┤
                                                                ▼
                              pipeline_html.render_dashboard_html(...)
                                                                │
                                                                ▼
                                          tools/pipeline_dashboard/index.html
```

The same `EpisodeStatus` dataclass feeds the Markdown `_status.md` writer and the HTML emitter — so the two surfaces can't disagree about state. The HTML pulls additionally from `project/IDEAS.md` for the Topics tab (the Markdown dashboards don't surface this).

## Future moves

- Move the file to `episodes/PIPELINE.html` so it sits next to `PIPELINE.md` (sibling output of the same source). The current `tools/pipeline_dashboard/` location keeps tool artifacts grouped — both reasonable.
- Per-episode tabs currently show the same `_status.md` content rendered as HTML. Could add: a state-transition timeline (from `stateEnteredAt` history if we start tracking it), or a "cost burn rate" chart from `COST_LOG.md`.
- Topics tab parses tables from `IDEAS.md`. Could add: a search box across signal-watch entries, or count badges per lifecycle state.

## Design notes

- **Palette** from `tools/brand-treatment/palette.json` (single source of truth for brand colors).
- **Typography** IBM Plex Sans + Serif + Mono — matches the May 2026 type doctrine (replaced Space Grotesk).
- **Brand mark** ∴ (therefore) per CLAUDE.md.
- **9-stage pipeline** matches `pipeline-state.json::stateLifecycle` exactly. The "human gate" diamonds mark editorial-judgment boundaries (viability verdict, angle decision, render trigger).
- **Per-episode accent colors**: gold for prisoners-dilemma (launch candidate), dustblue for silicon-trap, taupe for blockades-leak. Consistent across the diagram, episode cards, and "what to work on next" list.

## Local preview

```bash
open tools/pipeline_dashboard/index.html
```

Or serve via Python:

```bash
python3 -m http.server 8000 --directory tools/pipeline_dashboard
# then http://localhost:8000/
```
