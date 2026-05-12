# Geopolitics Video Templates — Remotion Project

> Read top-level [`AGENTS.md`](../AGENTS.md) and [`CLAUDE.md`](../CLAUDE.md) first for build commands, dev conventions, and project context. This file is Remotion-specific.
>
> Last updated: May 5, 2026

## What this is

Remotion-based template library for producing educational geopolitics YouTube videos. Templates are React components that render to MP4. Each template is data-driven: feed it a JSON file and it generates the visual segment.

- **17 core + 4 format-specific + 9 Shorts + per-episode master sequences** — all built and functional
- All templates use **Zod schemas** for runtime validation and **`calculateMetadata`** for dynamic durations
- Resolution: **1920×1080 @ 30fps** (1080×1920 for Shorts)
- TypeScript **strict mode** — don't disable

## Layout

```
remotion-templates/
├── BRAND.md                  # Canonical design system spec (palette, type, timing)
├── IMAGES.md                 # Image treatment pipeline (duotone, grain, compositing)
├── LESSONS.md                # Technical gotchas worth remembering (read on errors)
├── POLISH.md                 # Visual quality spec — checkable rules, "done" bar
├── references/               # Schema reference docs (template-schemas.md is canonical)
├── scripts/                  # Render scripts (local + Lambda) + tooling (lint, snapshot)
├── data/episodes/<slug>/     # Per-episode JSON data + assembly manifest
├── public/geo/               # Local TopoJSON (offline fallback)
└── src/
    ├── Root.tsx              # Composition registration (all 25+ in <Folder> groups)
    ├── design/               # theme.ts (BRAND.md in code), fonts.ts (preload)
    ├── components/           # Background, MetadataStrip, Crosshair, TitleBlock, Transitions, etc.
    ├── hooks/                # useCompositionAnimation, useDirection, useEntrance, useThemeMode, ...
    ├── utils/                # animation.ts, depth.ts, dataWarnings.ts, chartLayout.ts, mapUtils
    └── templates/            # One folder per template; FullEpisode in templates/Episodes/
```

## Templates

Canonical schemas and field definitions: [`references/template-schemas.md`](./references/template-schemas.md). Read that file when you need to know what JSON fields a template accepts.

Categories:

- **Maps**: ChoroplethMap, RouteAnimation (both via `MapGL` shared component using Mapbox GL + deck.gl)
- **Data**: DataChart, TimeSeriesChart, BayesianUpdate, ProbabilityGauge, RadarChart, StatReveal
- **Diagrams**: FrameworkDiagram, NetworkDiagram, DecisionTree, EscalationLadder, GameBoard, SankeyFlow
- **Typography & layout**: KineticTypography, TitleTransition, SplitComposition, ImageComposite, AnnotatedImage, PhotoMontage
- **Episodes**: `FullEpisode.tsx` (manifest-driven), `SiliconTrap.tsx` (per-episode `<Series>`)
- **Shorts (9:16)**: KineticShort, DataChartShort, SplitShort, FrameworkDiagramShort

### Known gaps (build when an episode actually needs it)

- ~~**Hub-with-radial-routes map** — one anchor city + N destinations on a real geographic basemap.~~ **Closed May 11, 2026.** Extended `RouteAnimation` with a `radial?: { hubIndex, staggerSec?, hubColor?, arcColor? }` field. When set, segments + a default phase are auto-derived; destinations sort clockwise by bearing from the hub for staggered "broadcast outward" reveal. Reference: catalog `rome-radial`. Use for trade-route hubs, military campaigns radiating from a command center, supply lanes from a single port.

- **PricingWaterfall (value-chain decomposition)** — *built May 10, 2026 — see `templates/PricingWaterfall/`*. The canonical form for value-capture stories: a fixed total ($1, $5, $100) split into stage segments with the smallest sliver in accent color. Editorial outlets converge on this idiom: FT (iPhone breakdowns), Bloomberg Opinion (oil/cocoa decompositions), Reuters cocoa pricing, Specialty Coffee Association farmgate-share reports, Fair Trade USA penny-breakdown graphics. Cleveland's perceptual hierarchy backs it — position-along-a-common-scale on a fixed denominator the viewer already understands. Sankey is the runner-up but reads as "infographic" rather than "argument" at video scrubbing speed. Use cases: supply-chain margin extraction, where-your-tax-dollar-goes, cost-of-goods decomposition.

## Design system

- **Source of truth for colors:** [`tools/brand-treatment/palette.json`](../tools/brand-treatment/palette.json) → loaded by `src/design/theme.ts`. Don't hex-hardcode brand colors anywhere.
- **Animation timing:** import from `src/design/theme.ts` — `timing.entrance.{snap, fast, crisp, medium, slow}`, `timing.exit.*`, `timing.stagger.*`, `timing.hold.*`. Don't reintroduce bare `sec(0.4)` / `sec(0.2)` magic numbers (use `entrance.crisp` and `entrance.snap`).
- **Animation defaults:** `KEN_BURNS_MAX_SCALE`, `PAN_DRIFT_MAX_OFFSET`, `EXIT_FADE_DURATION` are exported from `src/utils/animation.ts`. The `kenBurnsDrift`/`panDrift`/`exitFade` functions reference them by default.
- **POLISH.md** defines the visual quality bar (checkable rules + Editorial Doctrine D1–D16); **BRAND.md** is the human-readable design spec.
- **`references/template-research/`** — per-template dossiers documenting how state-of-the-art editorial outlets (NYT Upshot, FT, Economist, Bloomberg, Reuters, Pudding) handle each viz form. Read the dossier for a template before doing polish or extension work on it. The dossier contains canonical idioms, real-world references, Parallax-specific defaults, and known failure modes.

**Polish workflow:** when editing any template visually, first read POLISH.md's "Editorial Doctrine" section (D1–D16) + the template's dossier in `references/template-research/<template-name>.md`. The doctrine captures cross-template patterns (drop card chrome, hero hierarchy, ordinal numbering, etc.); the dossiers capture template-specific canon.

## How to create a new template

1. Create `src/templates/YourTemplate/` with `types.ts`, `YourTemplate.tsx`, `schema.ts`, `index.tsx`.
2. Register in `src/Root.tsx` inside the appropriate `<Folder>`. Use `calculateMetadata` to derive `durationInFrames` from `data.durationSec`.
3. Add sample data in `data/episodes/<slug>/`.
4. Wire `useCompositionAnimation()` for the auto Ken Burns drift + exit fade. Maps need `{ noDrift: true }`; templates with their own exits need `{ noExit: true }`; Shorts need `{ noDrift: true }`.

```tsx
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Background } from "../../components/Background";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import type { YourDataType } from "./types";

export const YourTemplate: React.FC<{ data: YourDataType }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation();
  return (
    <Background variant="light">
      <AbsoluteFill style={compStyle}>
        {/* content */}
      </AbsoluteFill>
    </Background>
  );
};
```

Hooks, utilities, and shared components are documented via JSDoc/TSDoc in the source — read the file when you need to use one. Key hooks: `useCompositionAnimation` (Ken Burns + exit fade, wired into all templates), `useDirection` (`_direction` JSON → atmosphere/drift/hold), `useEntrance` (semantic entrance presets: hero/content/data/label/structure), `useThemeMode` (mode-aware tokens), `useVerticalLayout` (Shorts).

## FilmOverlay cascade

Per-segment FilmOverlay (grain, vignette, light-leak, dust, scratch, flicker) is **gated and cascaded**. The whole system is dormant unless the episode opts in by setting `filmOverlay: {}` (or any non-empty config) at the manifest top level. When opted-in, each segment's preset/effects/intensity resolves at render time via `src/utils/resolveFilmOverlay.ts`:

| Priority | Source | Applies to |
|---|---|---|
| 1 | `segment.template.filmOverlay.<field>` | preset, effects, intensity (each independently) |
| 2 | `backdrop.recommendedPreset` from `backdrop-manifest.json` | preset only |
| 3 | `TEMPLATE_PRESET_MAP[component]` in `FilmOverlayPresets.ts` | preset only |
| 4 | `manifest.filmOverlay.<field>` (episode default) | preset, effects, intensity |
| 5 | `"documentary"` (component default) | preset only |

Per-field cascade means script writers can override just `intensity` for one moment without disturbing the cascade-resolved `preset` and `effects`. Most segments need nothing beyond `[BACKDROP: id]` — the backdrop choice (line 2) drives the preset choice (each backdrop in `backdrop-manifest.json` declares its `recommendedPreset`). The explicit `[OVERLAY: preset]` script tag (line 1) is for the editorial peak case only.

`EditorialSurface` (paper background + episode-wide grain layer) stays at the outer composition level — it's NOT cascaded. `FilmOverlay` wraps individual segments; `EditorialSurface` wraps everything.

Cascade unit tests at `src/__tests__/resolveFilmOverlay.test.ts` lock all 5 priority levels.

## Rendering

- **Preview:** `npm start` — Remotion Studio at `localhost:3000`.
- **Single composition:** `npx remotion render src/index.ts ChoroplethMap out/map.mp4`. Override data: `--props='{"data":{...}}'`.
- **Single still (for QA):** `npx remotion still src/index.ts ChoroplethMap --frame=60 --output=frame.png`.
- **Episode render:** `node scripts/render-episode.mjs --episode=silicon-trap` (writes props to temp files, supports `--only=05,06` and `--from=16` for partial renders).
- **Lambda render:** `npm run render:lambda -- --episode=silicon-trap` (after one-time `npm run deploy`).

Sandbox / headless Chromium: `--browser-executable=$(find ~/.cache/ms-playwright -name "headless_shell" | head -1)`.

## Testing

- **Visual regression:** `npm test` (Vitest + `@remotion/renderer`). Each test renders frame 30 and diffs against a baseline PNG. First run creates baselines; subsequent runs detect drift. Regenerate after intentional changes: `npm run test:baseline`.
- **Real-data PNG regression:** `npm run test:real-data` — all `src/__tests__/*-real-data.test.ts` (manifest episode JSON). Uses Playwright Chromium; `map-real-data.test.ts` skips without `MAPBOX_ACCESS_TOKEN` (`pk.` prefix). Local: `MAPBOX_ACCESS_TOKEN=pk.... npm run test:real-data`.
- **TypeScript typecheck:** `npm run typecheck` or from repo root `./scripts/typecheck.sh`.
- **Convention lint:** `npm run lint`.

## Performance — what to remember

Components re-render every frame at 30fps. Cheap stuff is fine; the hot mistakes are:

- **`Math.max(...arr)` / `Math.min(...arr)` / `arr.sort()` / `arr.filter()` over data props** in render body → wrap in `useMemo`. The codebase has been audited; if you're touching one, follow the existing pattern.
- **Pure sub-components rendered in a loop** → wrap in `React.memo`.
- **Hooks (`useMemo`, `useState`, `useId`) after an early `return null`** → Rules of Hooks violation. Move hooks above the conditional return.
- **`console.warn` in render body** → use `warnIf()` from `utils/dataWarnings.ts`. Otherwise it fires 30× per second. Enforced by `lint-conventions.mjs` rule `no-console-in-render` (scans `src/templates/` + `src/components/`). Suppress with `// eslint-disable-next-line no-console` above the call for legitimate one-shot cases (`componentDidCatch`, `useEffect` + `setTimeout`).

## Known constraints

Full reference: [`LESSONS.md`](./LESSONS.md). Worth knowing without reading it:

- Map templates need network access for vector tile CDN — won't render full geography in fully sandboxed environments, but work fine in local Studio and Lambda.
- `theme.ts` uses `as const` creating readonly tuples — code consuming color ramps must use `readonly string[]` types.
- `MapGL` (the shared map component) requires the `delayRender` lifecycle — it's wired correctly; don't bypass it when adding new map templates.
- Brand chrome (`HeaderStrip` + `FooterStrip`) is wired into all 25 templates by default via `<Background>`. Don't double-wrap.

## Don't

- Don't reintroduce `react-simple-maps` (replaced by Mapbox GL via `MapGL`).
- Don't disable TypeScript strict mode.
- Don't access `data.durationSec` without a fallback — bare access yields `undefined`, `sec()` turns it into `NaN` frames, Remotion crashes or renders empty. `durationSec` is optional on many Zod schemas (`z.number().optional()` or `z.number().positive().optional()`). Use `data.durationSec ?? <default>` or `data.durationSec || <default>` (most templates use 5–14s). Enforced by `lint-conventions.mjs` rule `no-bare-durationSec`; suppress with `// eslint-disable-next-line no-bare-durationSec` for the rare intentional case.
- Don't paste hex colors when there's a palette token in `theme.ts`.
- Don't hardcode `1.02`, `8`, or `15` for Ken Burns / pan / exit-fade — use the named constants.
