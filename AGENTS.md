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

- Python tests: `pytest tools/assembly/test_generate_manifest.py -q` (76 tests, <1s)
- TS typecheck: `cd remotion-templates && npx tsc --noEmit`
- TS lint: `cd remotion-templates && npm run lint`
- TS visual regression: `cd remotion-templates && npm test`
- Manifest gen: `cd tools/assembly && python3 generate_manifest.py --script <path> --episode <slug> --output <path>`

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

- Python tests are <1s. **New manifest/parsing logic must come with a test.** See `tools/assembly/test_generate_manifest.py` for the pattern (76 examples).
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
- Don't write to `.durationSec` without `?? 0` fallback (optional in many Zod schemas).
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
