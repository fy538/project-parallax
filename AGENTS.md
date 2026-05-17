# AGENTS.md — Parallax

> Read this **first**. For Parallax content/pipeline context, read [CLAUDE.md](./CLAUDE.md) after.

Parallax is a solo YouTube channel pipeline: **Python tools** (`tools/`) + **Remotion** (React→MP4) video templates (`remotion-templates/`) + **Markdown content** (`episodes/`, `project/`).

## Stack

- **Python 3.13** — CLI tools, manifest generator, asset sourcing, brand treatment
- **TypeScript** (strict mode) + **Remotion 4** — video templates
- **Pytest** for Python, **Vitest** for visual regression

## Common commands

From repo root:

| Task | Command |
|---|---|
| Run all tests | `./scripts/test.sh` |
| TypeScript typecheck | `./scripts/typecheck.sh` |
| TS lint conventions | `./scripts/lint.sh` |
| Remotion preview | `cd remotion-templates && npm start` |
| Render an episode | `cd remotion-templates && npm run build silicon-trap-full out/ep.mp4` |

Per-stack (when you need granular control):

- Python tests: `pytest tools/ -q` (730 tests across modules, <2s)
- Python tests in watch mode: `./scripts/test-watch.sh` (requires `entr`)
- TS typecheck: `cd remotion-templates && npx tsc --noEmit`
- TS lint: `cd remotion-templates && npm run lint`
- TS visual regression: `cd remotion-templates && npm test`
- TS **real-data** PNG regression (all manifest `data/episodes` JSONs wired in `*-real-data.test.ts`): `cd remotion-templates && npm run test:real-data` — requires Playwright Chromium. **`map-real-data.test.ts` skips** unless `MAPBOX_ACCESS_TOKEN` is set to a public token (`pk....`). Example: `MAPBOX_ACCESS_TOKEN=pk.... npm run test:real-data`.
- **Orphan episode JSON** (files under `remotion-templates/data/episodes/<slug>/` not referenced as `template.dataFile` in `assembly-manifest.json`): `python3 tools/list_orphan_episode_json.py` (optional `--episode <slug>`, `--json`). Triage only — drafts and alternates may be intentional.
- Manifest gen: `python3 tools/assembly/generate_manifest.py --script <path> --episode <slug> --output <path>`
- Backdrop pick list: `python3 tools/assembly/print_backdrop_catalog.py` (add `--dark-register`, `--tag TAG`, `--tone-prefix dark`, `--chart-at-least high|medium|low`, `--markdown`). Pairing rules: `remotion-templates/design-references/backdrops/BACKDROP_CHART_PAIRING.md`
- **Episode validator (all checks, one command):** `./scripts/check-episode.sh <slug>` — chains JSON validation, manifest doctrine, _direction orphans, Zod schemas, concept registry, TS typecheck, convention lint, **asset preflight**. Use before every render. `--list` to see known slugs.
- **Asset preflight** (run standalone too): `python3 tools/preflight.py <slug>` — verifies every asset path referenced by a manifest (narration audio, music bed, FOOTAGE/AI-GEN clips) AND every asset path inside referenced `dataFile` JSONs (`imageSrc`, `illustrationSrc`, etc.) resolves to an on-disk file. Catches the "render dies 8 minutes in" failure mode. Pending-sourcing assets reported separately; `--strict` treats them as failures, `--json` for machine output.
- **Render postflight** (after `npm run build`): `python3 tools/postflight.py <path-to-mp4> [--episode <slug>]` — verifies the rendered MP4 isn't silently corrupted (size ≥ bytes/sec floor, has a video stream, duration matches `manifest.totalDurationSec` ± 0.5s, resolution = 1920×1080 by default or `--resolution 1080x1920` for Shorts). Requires `ffprobe` (degrades gracefully if missing). `--json` for machine output.
- **Logged render** (wrap any render command): `python3 tools/render_log.py --episode <slug> [--output <mp4>] [--label <suffix>] -- <command...>` — tees stdout/stderr to `episodes/<slug>/render-logs/<timestamp>[-<label>].log` AND the terminal, propagates the wrapped command's exit code, and (when `--output` is set) appends a postflight report to the log. Use this for any real render so a permanent record exists.
- **Manifest schema migration**: `python3 tools/migrate_manifest.py` — status mode lists current versions of all manifests. `--to-version <X>` runs the migration planner; `--write` persists the result (default is dry-run). Migrations are registered in `MIGRATIONS` inside the script; the registry is empty today (schema is at 1.0) but the framework is wired so the first schema evolution doesn't become ad-hoc.
- **Sourcing brief generator**: `python3 tools/sourcing_brief.py <slug> [--pending-only] [--priority P1] [--source pexels] [--format csv] [--output FILE]` — reads `assembly-manifest.json` + `shot-list.json`, joins per shotListId, and emits a Markdown (default) or CSV brief grouped by beat. Each asset shows pre-built search URLs for the target platform (Pexels/Pixabay/Wikimedia/Archive.org), priority, treatment, notes, and status. Re-run after updating `asset.file` / `asset.status` to see only what's still pending. Use this to direct human or skill-driven asset sourcing.
- **Manifest doctrine lint**: `python3 tools/lint/manifest_lint.py [--episode <slug>]` — runs all `M-*` doctrine rules against assembly manifests. Also runs automatically via pre-commit when `assembly-manifest.json` is staged. Rules:
  - `M-D18` — music enters only after the opening setup concludes (POLISH.md D18)
  - `M-CROSSFADE` — music crossfades land near beat boundaries
  - `M-OVERLAP` — foreground segments that overlap must have an explicit transition
  - `M-DATAFILE` — `template.dataFile` references exist on disk
  - `M-CUE` — soundCue / textureCue types are canonical enum values
  - `M-DURATION` — max(segments[].endSec) matches totalDurationSec ±0.5s
  - `M-TEXT-ANIM` — textAnimation technique is canonical and matches template variant (see `project/TEXT_ANIMATION_REGISTER.md`)
  - `M-SYNC-MISSING` / `M-SYNC-COUNT` — per-element anticipatory reveal sync coverage
  - `M-DRIFT-DEFAULT` — driftPreset overrides don't contradict the template's editorial register (see `project/HOLD_MOTION_REGISTER.md`)
  - `M-BGMODE` — foreground TEMPLATE segments within the same beat must share a backgroundVariant (light/dark); unintentional mode switches mid-beat fire a warning
  - `M-TRANSITION-DEPRECATED` — deprecated transition types (`wipe-*`, `blur-through`, `whip-pan`, `spatial-zoom`) in `.in` or `.out`
  - `M-TRANSITION-IRIS-CHART` — iris on a chart-category template (no focal-point anchor)
  - `M-TRANSITION-DISSOLVE-CREEP` — >2 consecutive dissolve-in segments
  - `M-TRANSITION-IRIS-OVERUSE` — >2 iris-in transitions episode-wide
  - `M-TRANSITION-COLOR-WASH-TOKEN` — color-wash without `washColor` field (renders as transparent)
  (See `project/TRANSITION_GRAMMAR.md` for full transition doctrine.)
- **Cross-document drift checks** (all soft / informational by default; `--strict` to fail):
  - `python3 tools/check_script_manifest.py <slug>` — script + `shot-list.json` ↔ manifest. Catches renamed `shotListId`s and stale `[<slug>/*.json]` references.
  - `python3 tools/check_concept_coverage.py <slug>` — concepts in `data/concepts.json` claiming `introduced.episode == <slug>` must have their `term.en` / `term.cn` / `term.pinyin` appear in the script (diacritic-insensitive substring match).
  - `python3 tools/check_audio_cues.py <slug>` — `audio-cue-sheet.md` ↔ manifest. Cross-checks music-bed mood vocabulary, track count, and SFX/texture cue names against the canonical enum.
- JSON validation: `python3 tools/validate_data.py` (or `--files a.json b.json` for a subset)
- Cost log: `python3 tools/cost_tracker.py summary` and `python3 tools/cost_tracker.py add --episode <slug> --service claude --amount 12.50 --note "..."`
- Worktree for parallel work: `./scripts/worktree.sh new <slug>` / `remove <slug>` / `list`
- Clean regenerable artifacts (renders, caches, coverage): `./scripts/clean.sh`
- Clean episode cruft (`.DS_Store`, duplicate version files): `./scripts/clean-episode-cruft.sh [slug] [--apply]` (dry-run by default; reports duplicate `*-v2.{json,md}` files but doesn't auto-promote)
- Regenerate visual regression baselines (after intentional visual changes): `./scripts/regen-baselines.sh`
- **SFX generator** (Layer 2 + 3): `python3 tools/generate_sfx.py` — synthesises all 22 transition SFX + 7 texture-hit WAV files at 48 kHz · 24-bit · stereo. `--cue <name>` for one type, `--dry-run` to preview. Run after any sound design change; output goes directly to `remotion-templates/public/audio/sfx/`. Requires `numpy` + `scipy`.

## Slash commands and subagents

The `.claude/commands/` directory has prompt templates for common workflows: `/new-episode`, `/new-template`, `/concept-search`, `/render-preview`, `/audit-script`. The `.claude/agents/` directory has `script-reviewer` and `visual-spec-reviewer` subagents for delegated audit tasks.

## GitHub Actions (CI)

- **Pull requests:** Linux [`scripts/test.sh`](./scripts/test.sh) + macOS **`macos-smoke`** (typecheck, unit Vitest, `templates.test.ts` visual smoke). Does **not** run the heavy **`test:real-data`** PNG suite (keeps PRs fast).
- **`test:real-data` in CI:** Job **`macos-real-data`** in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml) — runs on **push to `main`**, **daily schedule** (UTC), and **`workflow_dispatch`**. Installs Playwright and runs `npm run test:real-data` (same as local full PNG regression). On the **daily cron**, the lighter **`macos-smoke`** job is skipped so only **`macos-real-data`** uses a macOS runner that day (Linux **`test`** still runs).
- **Mapbox maps in CI:** Add repository secret **`MAPBOX_ACCESS_TOKEN`** with a **public** token (`pk....`): GitHub → repo **Settings** → **Secrets and variables** → **Actions** → **New repository secret**. Without it, **`map-real-data.test.ts`** skips in CI (same as local).

## Pipeline state

Episode state lives in [`episodes/PIPELINE.md`](./episodes/PIPELINE.md) — read it on session start to know what's queued and what action is next.

## Code style

### Python

- PEP 8, 4-space indent, type hints on public functions.
- Errors → `print(..., file=sys.stderr)` then `sys.exit(1)`. Don't return error sentinels.
- Catch specific exceptions; **never** `except Exception: pass` (log to stderr at minimum).
- Shared utilities live in `tools/shared/` (e.g. `color_utils.py`). Don't redefine.
- API-key-using tools must guard for missing keys before dispatching subcommands.

### TypeScript / Remotion

- **Strict mode is on.** Don't disable. Add `?? 0` / `?? ""` for optional fields where you need a value.
- **Per-frame cost matters.** Components re-render every frame at 30fps. Wrap in `useMemo`:
  - Any `Math.max(...arr)` / `Math.min(...arr)` / `arr.sort()` / `arr.filter()` over data props
  - Lookup-map construction
- Pure sub-components rendered in a loop → `React.memo`.
- Hooks (incl. `useMemo`) must be called **before** any conditional `return`. Rules of Hooks.
- **Magic numbers**: pull animation/timing constants from `src/design/theme.ts` (`timing.entrance.*`) and `src/utils/animation.ts` (`KEN_BURNS_MAX_SCALE`, `PAN_DRIFT_MAX_OFFSET`, `EXIT_FADE_DURATION`). Don't reintroduce hardcoded `1.02`, `15`, etc.
- **Brand colors** come from `tools/brand-treatment/palette.json` → loaded by `theme.ts`. Don't hex-hardcode brand colors anywhere else.
- **`console.warn` in render**: use `warnIf()` from `utils/dataWarnings.ts`. Raw `console.warn` fires 30× per second.

## Testing

- Repo root **`./scripts/test.sh`** runs Python, `tsc`, and a **narrow Vitest subset** (fast checks). It does **not** run `*-real-data` PNG suites; use `cd remotion-templates && npm run test:real-data` locally, or rely on the **`macos-real-data`** CI job (main / nightly / manual — see GitHub Actions above).
- Python tests are <1s. **New parsing/state logic must come with a test.** Patterns to copy: `tools/assembly/test_generate_manifest.py` (parsing-heavy), `tools/test_cost_tracker.py` (markdown round-trip), `tools/brand-treatment/test_treat.py` (numeric image processing invariants).
- **Visual regression baselines** live in `remotion-templates/src/__tests__/baselines/`. Run `./scripts/regen-baselines.sh` after any intentional visual change (palette, animation timing, template refactor) and commit the resulting PNGs. `cd remotion-templates && npm test` then catches future drift via pixelmatch at a 0.5% pixel-diff threshold (see `render-helper.ts → compareFramesPixel`).
- Visual regression baselines live in `remotion-templates/src/__tests__/baselines/`. After intentional visual changes, regenerate with `npm run test:baseline`.
- Pre-commit hook runs typecheck on changed `.ts/.tsx` and Python tests on changed `.py`. Don't skip with `--no-verify` unless you have a specific reason worth stating.

## Commits

- Conventional-ish: `Sprint X: brief summary`, `Fix N issues from review`, `feat: ...`, `fix: ...`.
- Atomic — one concern per commit.
- AI co-author trailer:
  ```
  Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
  ```
- Never `git push --force` to `main`. Don't `--no-verify` without saying why.

## Security boundaries

- API keys live in `.env` (gitignored). `.env`, `.env.local`, `.env.*.local` are all ignored.
- `tools/asset-source/source.py` and `tools/recraft/recraft.py` exit early with a readable message if their key is unset.
- Never log API keys (no `key[:20]...` previews — they leak).
- All subprocess calls use list form (no `shell=True`). Don't reintroduce shell-string subprocess.

## Things NOT to do

- Don't reintroduce `react-simple-maps` (replaced by Mapbox GL via `MapGL` shared component).
- Don't write to `.durationSec` without `?? 0` fallback (optional in many Zod schemas). Enforced by `lint-conventions.mjs` rule `no-bare-durationSec`; suppress with `// eslint-disable-next-line no-bare-durationSec` for rare intentional cases.
- Don't use `as any` in template files. Disables TypeScript safety and the bug surfaces only at render time. Enforced by `lint-conventions.mjs` rule `no-as-any-in-templates`; suppress with `// no-as-any-ok: <reason>` on the same line for documented exceptions (Mapbox expression arrays, d3-geo interop). The existing `// eslint-disable-next-line @typescript-eslint/no-explicit-any` pattern is also accepted.
- Don't use `console.warn/error/log` in render bodies — fires 30× per second. Use `warnIf()` from `utils/dataWarnings.ts` instead. Enforced by `lint-conventions.mjs` rule `no-console-in-render`.
- Don't put hooks (`useMemo`, `useState`, `useId`) **after** an early return.
- Don't catch with bare `except Exception: pass` in Python.
- Don't paste hex colors when there's a palette token.
- Don't expand abbreviations into magic numbers when there's a named constant.

## Architecture pointers

- Project overview, pipeline, identity: [`CLAUDE.md`](./CLAUDE.md)
- Remotion-specific design system + templates: [`remotion-templates/CLAUDE.md`](./remotion-templates/CLAUDE.md)
- Production pipeline stages (script → render → publish): [`project/PRODUCTION_PIPELINE.md`](./project/PRODUCTION_PIPELINE.md)
- Brand system: [`remotion-templates/BRAND.md`](./remotion-templates/BRAND.md) + [`tools/brand-treatment/palette.json`](./tools/brand-treatment/palette.json) (machine-readable source of truth)
- Decisions log: [`project/DECISIONS.md`](./project/DECISIONS.md)
- Lessons learned (Remotion gotchas): [`remotion-templates/LESSONS.md`](./remotion-templates/LESSONS.md)

## Manual-only tools (not auto-invoked)

These tools exist in `tools/` but no skill or script auto-invokes them. Run by hand when the named recovery scenario applies:

- **`tools/assembly/fill_manifest_holds.py <slug>`** — Manual HOLD-segment repair. Use when an assembly manifest is missing HOLD segments after timing drift (e.g., narration ran longer than estimate-mode predicted). Reads the manifest, computes gaps, inserts HOLDs to bridge.
- **`tools/assembly/sync_episode_clips.py <slug>`** — Manual clip-attachment to a manifest. Use when stock/AI-gen clips landed in `assets/` after `generate_manifest.py` ran and you need to back-fill `file:` paths on FOOTAGE segments without re-running the full generator.
- **`tools/parallax/parallax.py`** — Experimental AI depth-based parallax video generator (own `.venv` with torch/numpy; ~5 GB install). Standalone; not part of the standard B-roll pipeline. Use for one-off effects.
- **`tools/postflight.py <mp4-path> --episode <slug>`** — Verify a rendered MP4 isn't silently broken (zero-frame, truncated tail, wrong resolution). Auto-invoked by `render-episode.mjs` after the final concat; also runnable standalone.
- **`tools/asset-source/zerohit_fallback.py <slug>`** — Generate AI-gen briefs for stock-search zero-hit shots. Wired into `check-episode.sh` as W8 (count only); run standalone to write `episodes/<slug>/ai-gen-briefs.md`.

Tools that were retired during the May 17, 2026 audit are at [`tools/_archive/`](./tools/_archive/README.md) — kept for provenance, not invoked anywhere.
