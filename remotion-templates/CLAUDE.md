# Parallax Video Templates — Remotion Project

> Read top-level [`AGENTS.md`](../AGENTS.md) and [`CLAUDE.md`](../CLAUDE.md) first for build commands, dev conventions, and project context. This file is Remotion-specific.
>
> Last updated: September 22, 2026

## What this is

Remotion-based video workspace for Parallax. Current pilots explore philosophy, AI, and ethics; the earlier geopolitics library remains reusable. Templates are React components that render to MP4, often from JSON data.

- **~83 core + 9 Shorts + per-episode master sequences** — all built and functional (Maps 9, Charts 26, Diagrams 15, Timelines 6, Typography & visuals 9, Documentary archival 4, Argument Primitives 7, Cross-frame/morph 3, Relationship & Composition 4, Math 2, Exploratory 4; full inventory: `project/PRODUCTION_PIPELINE.md` Stage 7; canonical TEMPLATE_COMPONENTS registry in `src/templates/Episodes/templateRegistry.ts`)
- All templates use **Zod schemas** for runtime validation and **`calculateMetadata`** for dynamic durations
- Resolution: **1920×1080 @ 30fps** (1080×1920 for Shorts)
- TypeScript **strict mode** — don't disable

## Layout

```
remotion-templates/
├── README.md                 # Current Studio navigation, commands, and cleanup
├── BRAND.md                  # Canonical design system spec (palette, type, timing)
├── IMAGES.md                 # Image treatment pipeline (duotone, grain, compositing)
├── LESSONS.md                # Technical gotchas worth remembering (read on errors)
├── POLISH.md                 # Visual quality spec — checkable rules, "done" bar
├── PARALLAX_VISUAL_VOCABULARY.md  # Chart chooser — editorial intent → template
├── EDITORIAL_FRAME_ARCHITECTURE.md # Shared editorial-chart-craft layer architecture
├── CHART_MIGRATION_GUIDE.md       # Recipe for migrating a chart to EditorialFrame
├── references/               # Schema reference docs (template-schemas.md is canonical)
├── scripts/                  # Render scripts (local + Lambda) + tooling (lint, snapshot)
├── data/episodes/<slug>/     # Per-episode JSON data + assembly manifest
├── public/geo/               # Local TopoJSON (offline fallback)
└── src/
    ├── Root.tsx              # Studio registration: Current, Templates, Catalog, Experiments, Tests
    ├── design/               # theme.ts (BRAND.md in code), fonts.ts (preload)
    ├── components/           # Background, MetadataStrip, Crosshair, TitleBlock, Transitions, etc.
    ├── hooks/                # useCompositionAnimation, useDirection, useEntrance, useThemeMode, ...
    ├── utils/                # animation.ts, depth.ts, dataWarnings.ts, chartLayout.ts, mapUtils
    └── templates/            # One folder per template; FullEpisode in templates/Episodes/
```

## Templates

Canonical schemas and field definitions: [`references/template-schemas.md`](./references/template-schemas.md). Read that file when you need to know what JSON fields a template accepts.

Categories:

- **Maps**: **AtlasPlate** (pure SVG, default for editorial work — see `MAP_TEMPLATE_SELECTOR.md`); ChoroplethMap / RouteAnimation / DensityMap / ProportionalSymbolMap / CartogramMap / **CinematicMap** (Mapbox via `MapGL`, reserved for atmospheric / terrain-required shots only — no title overlay); **TerritoryMap** (animated territorial control over timesteps — crossfade or snap between actors, SVG timeline strip, `"country"` or `"subnational"` mode); **FlowMap** (directional volume flows — arc width ∝ `sqrt(volume)`, particles, `"simultaneous"` or `"stagger"` mode); CinematicMap = pitched moving camera for terrain fly-throughs + GlobeReveal pattern — see `MAP_TEMPLATE_SELECTOR.md` and dossiers in `references/template-research/`
- **Data / Charts**: DataChart, TimeSeriesChart, BayesianUpdate, ProbabilityGauge, RadarChart, StatReveal, BeeswarmChart, BumpChart, **BarChartRace** (kinetic rank race — bars animate width+vertical position between periods; FT/Burn-Murdoch register), CalendarHeatmap, ConnectedScatterplot, **BubbleMatrix** (4-variable scatter: X/Y/size/color — Gapminder register; silicon-trap canonical use), DumbbellPlot, HorizonChart, IsotypeChart, MarimekkoChart, PopulationPyramid, RankChangeDotPlot, RidgelinePlot, Streamgraph, StepLine, KPICard, BulletChart, PricingWaterfall, Slopegraph
- **Diagrams**: FrameworkDiagram, NetworkDiagram, **SanctionsNetwork** (typed sanctions architecture: sanctioner/target/relay/sector/institution nodes; primary-sanction/secondary-threat/evasion-path/formal-exemption edges; evasion-path particle animation), ArcDiagram, **PhilosophicalFamilyTree** (ArcDiagram-variant with year-based x-axis and typed influence edges: borrowed/transformed/critique/parallel), DecisionTree (5 variants: extensive · ladder · indented · spine · schematic), OutcomePartition (decision-space partition map), EscalationLadder, GameBoard, SankeyFlow, CausalLoopDiagram, SmallMultiples, TernaryPlot, TilegramUSMap
- **Timelines**: HorizontalTimeline / HorizontalTimelineSingle, SpiralTimeline, DuelingFrameworks, StrategicLandscape, **ConceptEvolutionTimeline** (Foucauldian genealogy — per-node definition panels show what a concept meant at each moment; inter-node drift labels name what shifted; use for Sovereignty / Deterrence / Legitimacy genealogies)
- **Typography & layout**: KineticTypography, TitleTransition, SplitComposition, ImageComposite, AnnotatedImage, **ScrollyReveal** (step-based progressive annotation with per-step pan/zoom focus — the video equivalent of NYT/Reuters scrollytelling; shared `AnnotationSVGLayer` component), **AnnotatedZoom** (pure directional zoom — "look here, then here, then here"; CSS transform IS the argument; no annotation callouts; sibling of ScrollyReveal for camera-as-rhetoric), PhotoMontage, PrimarySourceReveal
- **Documentary archival** (May 2026): HandwrittenLetter (dual-mode: photograph / typeset), NewspaperHeadlineRotator (front-page mastheads + press-era typography), ArchivalReel (8mm / 16mm / VHS film emulation), TelegramCable (diplomatic cable bureaucratic chrome). All four share `<ArchivalPaper>` base component. Use when you want a primary source to speak rather than describing it.
- **Argument Primitives** (May 2026): Syllogism, AxiomList, DialecticFlow, ConditionalArgument, CounterfactualPath, **AnalogyCrossmap** (structural mapping between domains + break connections — the "bounded analogy" form), **ToulminMap** (6-element Toulmin structure: Data → Warrant → Claim + Backing/Qualifier/Rebuttal; Warrant is the editorial focal point). The logic-as-visual family — render an argument's formal structure, not just its conclusion. Editorial constraint: each template makes one and only one argument move per segment.
- **Relationship & Composition** (May 2026): VennDiagram (set-overlap; 2–3 sets with SVG clip-path intersections), ChordDiagram (bilateral flows; pure-trig arcs), Treemap (hierarchical part-to-whole; squarify algorithm), MatrixHeatmap (N×M cross-tabulation; diagonal ripple reveal).
- **Cross-frame / morph** (May 2026): ComparisonPair (side-by-side scaled panes sharing one canvas), MorphTransition (cross-template interpolation — StatReveal, DataChart, TimeSeriesChart; real underdamped spring ζ=0.6 ω=8), SplitFrame (bespoke multi-pane layout with timed pane reveals).
- **Math** (May 2026; promoted to manifest-level May 20, 2026): MathReveal (single-equation write-on), MathDerivation (multi-step derivation crossfade). KaTeX rendering; `M-MATH-VALID` lint validates every formula. Doctrine: `project/MATH_RENDER_REGISTER.md`.
- **Episodes**: `FullEpisode.tsx` (manifest-driven), `SiliconTrap.tsx` (per-episode `<Series>`)
- **Shorts (9:16)**: KineticShort, DataChartShort, SplitShort, FrameworkDiagramShort

### Known gaps (build when an episode actually needs it)

- ~~**Hub-with-radial-routes map** — one anchor city + N destinations on a real geographic basemap.~~ **Closed May 11, 2026.** Extended `RouteAnimation` with a `radial?: { hubIndex, staggerSec?, hubColor?, arcColor? }` field. When set, segments + a default phase are auto-derived; destinations sort clockwise by bearing from the hub for staggered "broadcast outward" reveal. Reference: catalog `rome-radial`. Use for trade-route hubs, military campaigns radiating from a command center, supply lanes from a single port.

- **PricingWaterfall (value-chain decomposition)** — *built May 10, 2026 — see `templates/PricingWaterfall/`*. The canonical form for value-capture stories: a fixed total ($1, $5, $100) split into stage segments with the smallest sliver in accent color. Editorial outlets converge on this idiom: FT (iPhone breakdowns), Bloomberg Opinion (oil/cocoa decompositions), Reuters cocoa pricing, Specialty Coffee Association farmgate-share reports, Fair Trade USA penny-breakdown graphics. Cleveland's perceptual hierarchy backs it — position-along-a-common-scale on a fixed denominator the viewer already understands. Sankey is the runner-up but reads as "infographic" rather than "argument" at video scrubbing speed. Use cases: supply-chain margin extraction, where-your-tax-dollar-goes, cost-of-goods decomposition.

## Design system

- **Source of truth for colors:** [`tools/brand-treatment/palette.json`](../tools/brand-treatment/palette.json) → loaded by `src/design/theme.ts`. Don't hex-hardcode brand colors anywhere.
- **Animation timing:** import from `src/design/theme.ts` — `timing.entrance.{snap, fast, crisp, medium, slow}`, `timing.exit.*`, `timing.stagger.*`, `timing.hold.*`. Don't reintroduce bare `sec(0.4)` / `sec(0.2)` magic numbers (use `entrance.crisp` and `entrance.snap`).
- **Easing curves:** `easing.*` (bezier tuples → `Easing.bezier(...easing.decelerate)`) and `easingCss.*` (CSS strings) in `theme.ts`. Motion is **never linear** and **never bounces/overshoots** in this register. Default reveal = `decelerate` (`cubic-bezier(0,0,.2,1)`). Doctrine: `project/CHAINED_STILL_LESSONS.md` → "Organic vs geometric transforms".
- **Animation defaults:** `KEN_BURNS_MAX_SCALE`, `PAN_DRIFT_MAX_OFFSET`, `EXIT_FADE_DURATION` are exported from `src/utils/animation.ts`. The `kenBurnsDrift`/`panDrift`/`exitFade` functions reference them by default.
- **POLISH.md** defines the visual quality bar (checkable rules + Editorial Doctrine D1–D21); **BRAND.md** is the human-readable design spec.
- **`PARALLAX_VISUAL_VOCABULARY.md`** is the chart chooser — given the editorial argument a script beat is making, find the right template. Read this when picking which template to render at the visual-spec stage.
- **`EDITORIAL_FRAME_ARCHITECTURE.md`** explains the shared `EditorialFrame` system (kicker + heroStat + multi-annotation + publication chrome). **`CHART_MIGRATION_GUIDE.md`** is the 6-step recipe for migrating any chart template to use it (~30-60 min per chart).
- **`references/template-research/`** — per-template dossiers documenting how state-of-the-art editorial outlets (NYT Upshot, FT, Economist, Bloomberg, Reuters, Pudding) handle each viz form. Read the dossier for a template before doing polish or extension work on it. The dossier contains canonical idioms, real-world references, Parallax-specific defaults, and known failure modes.

**Polish workflow:** when editing any template visually, first read POLISH.md's "Editorial Doctrine" section (D1–D21) + the template's dossier in `references/template-research/<template-name>.md`. The doctrine captures cross-template patterns (drop card chrome, hero hierarchy, ordinal numbering, etc.); the dossiers capture template-specific canon.

## How to create a new template

1. Run `node scripts/create-template.mjs YourTemplate` to create `types.ts`, `YourTemplate.tsx`, `schema.ts`, and `index.tsx`.
2. Register in `src/Root.tsx` inside the appropriate `<Folder>`. Use `calculateMetadata` to derive `durationInFrames` from `data.durationSec`.
3. Add sample data in `data/episodes/<slug>/`. For manifest dispatch, register the component in `Episodes/templateRegistry.ts` and its schema in `Episodes/templateSchemas.ts`.
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
- **Pilot render:** `npx remotion render src/index.ts what-we-count out/what-we-count/what-we-count.mp4` (or `promise-and-copy`). The legacy `scripts/render-episode.mjs silicon-trap` renders only its configured silicon-trap clip sequence.
- **Lambda render:** `deploy`, `deploy:teardown`, and `render:lambda` npm scripts exist, but cloud rendering is not wired into CI; see `_lambda_scaffolded` in `package.json`.

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
- **Fonts load from Google at render time.** The Latin families load at import; the Chinese and Japanese families load only when something reads `fonts.chinese` or resolves a Chinese / Japanese emphasis (`ensureCjkFonts()` in `src/design/fonts.ts`). Don't reference those families by a literal string, or they will not be loaded.
- **Inside an episode a template does not animate its own frame in.** `areSeamsOwnedByEpisode()` (utils/animation.ts) is true under `FullEpisode`: `TitleBlock` and other structure should already be on screen at frame 0 so a cut lands on a set card. Animate only what the narration is about to name.
- **Reveal times typed in seconds are scaled to the slot** by `src/utils/scaleToSlot.ts` when `FullEpisode` hands data to a template (keys ending `AtSec`, `typingStartSec`, `holdSec`, narration-paced `staggerSec`, and `durationSec`). Name new timing fields accordingly: a start time ends in `AtSec`; a fade length does not.
- **Stills on the picture layer** are images, not clips: a FOOTAGE segment with an image `asset.file` is drawn by `src/components/StillFrame.tsx` using the segment's `framing`.
- Brand chrome (`HeaderStrip` + `FooterStrip`) must be explicitly imported and rendered in each template — they are **not** auto-included by `<Background>`. Chart, diagram, and timeline templates should have them; cinematic/full-bleed image templates (ScrollyReveal, AnnotatedZoom, ArchivalReel, etc.) intentionally omit them.

## Don't

- Don't reintroduce `react-simple-maps` (replaced by Mapbox GL via `MapGL`).
- Don't disable TypeScript strict mode.
- Don't access `data.durationSec` without a fallback — bare access yields `undefined`, `sec()` turns it into `NaN` frames, Remotion crashes or renders empty. `durationSec` is optional on many Zod schemas (`z.number().optional()` or `z.number().positive().optional()`). Use `data.durationSec ?? <default>` or `data.durationSec || <default>` (most templates use 5–14s). Enforced by `lint-conventions.mjs` rule `no-bare-durationSec`; suppress with `// eslint-disable-next-line no-bare-durationSec` for the rare intentional case.
- Don't paste hex colors when there's a palette token in `theme.ts`.
- Don't hardcode `1.02`, `8`, or `15` for Ken Burns / pan / exit-fade — use the named constants.
