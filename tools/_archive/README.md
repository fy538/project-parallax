# `tools/_archive/`

Tools that were built, served their purpose, and are now superseded or orphaned. Kept here (not deleted) for git provenance and so anyone investigating "did we ever have a tool for X?" finds the answer in one place.

**Nothing in this directory is invoked by any pipeline, skill, or script.** Inclusion here is the explicit signal that the tool is dormant. Promote out (move back to `tools/<area>/`) only after re-wiring it into a skill, npm script, or CI step.

---

## Inventory

### `new-episode.sh` (originally `tools/new-episode.sh`)

Shell scaffold for creating a new episode directory tree. **Superseded May 5, 2026** by `.claude/commands/new-episode.md` (Claude slash command) which does the same job with skill-grade prompt context and better defaults.

If you ever need plain `bash` provisioning (e.g., from CI without Claude), this still works — but the slash command is the canonical path.

### `consistency/check.py` (originally `tools/consistency/check.py`)

Early-generation JSON data-file consistency checker — palette compliance, duration sanity, required-field validation, cross-file entity colour consistency. **Superseded May 5, 2026** by `tools/validate_data.py` (canonical JSON+schema+palette validation, wired into `.githooks/pre-commit` and `scripts/check-episode.sh` as H1) plus `remotion-templates/scripts/lint-conventions.mjs` (hex enforcement, `npm run lint`).

The one feature `validate_data.py` doesn't replicate is `--fix-colors` (suggests closest palette color for non-standard hex). If that becomes important again, port that flag into `validate_data.py` rather than reviving this file.

### `backdrop-composite/contact_sheet.py` + `composite_preview.py` (originally `tools/backdrop-composite/`)

One-shot visualization tools used to seed `remotion-templates/BACKDROP_CHART_PAIRING.md` in May 2026 — generated contact sheets and per-pairing composite previews. The pairings are now baked into the doc; the tools were never re-invoked.

If new backdrops or chart families ship and the pairing doc needs a refresh, restore these temporarily, run, then re-archive.

### `remotion-templates/scripts/snapshot.mjs` (also archived if found)

Early-generation Remotion frame-snapshot helper. Not wired into any test or render path. The visual regression tests in `src/__tests__/templates.test.ts` cover this need via `@remotion/renderer`.

---

## Decision history

This archive was created during the May 17, 2026 engineering audit (P2.a — decide-or-kill the 10 orphan tools). The four tools above were judged clearly-superseded. Five more were judged "kept but documented" and remain in their original locations:

- `tools/assembly/fill_manifest_holds.py` — kept; documented in AGENTS.md as a manual recovery tool for HOLD-segment repair.
- `tools/assembly/sync_episode_clips.py` — kept; documented in AGENTS.md as a manual clip-attachment tool.
- `tools/parallax/parallax.py` — kept; experimental AI depth-parallax tool with its own `.venv`. Not part of the standard pipeline; useful as a one-off.
- Lambda render scripts (`deploy-lambda.mjs`, `render-lambda.mjs`) — kept; scaffolded for cloud rendering, not yet activated.
- `lint:source` npm script — kept; companion to `lint:polish`.

Two tools moved out of orphan status during the audit itself:

- `tools/pipeline_validator.py` — wired into `scripts/check-episode.sh` as W6.
- `tools/lint/polish_lint.py` — wired into `npm run lint:tsx` and `scripts/check-episode.sh` as W7.
