# TEMPLATES — Conventions, utilities, and components

> The pattern catalogue for working on Remotion templates in this repo.
> See LAYOUT.md for positioning principles and BRAND.md for color/type system.
> Last updated: May 4, 2026.

## Philosophy

The pipeline goal: a data author writes a JSON file and gets a render-ready video. To make that work, *templates own the editorial defaults* — domain inference, color assignment, label placement, animation timing, source positioning. The data file should describe *what* you want to show, not *how* to lay it out.

Symptoms that the philosophy is being violated:
- A data author has to specify `yMin: 0` to avoid negative ticks for population data → domain inference is missing
- A data author has to set `color` on every series to avoid amber-on-amber → categorical fallback is missing
- A data author has to position the source line manually → SourceAttribution component isn't being used
- A title overflows because the title is "long" → TitleBlock dynamic sizing isn't working

When you spot one of these, the fix lives in the *template*, not in every data file.

## Shared utilities

### `src/utils/niceTicks.ts`

**`niceDomain(min, max, targetTicks)`** — snap a domain to round multiples of 1/2/5 × 10ⁿ. Returns `[niceMin, niceMax]`.

**`niceTicks(min, max, targetTicks)`** — generate tick values at integer multiples of nice spacing. Always lands on round numbers.

**`computeYDomain(values, options)`** — full domain inference: clamps at 0 for non-negative data, snaps to nice domain.

**`formatTick(value, unit)`** — format a tick label with thousand-separators and unit suffix/prefix.

**Used by:** TimeSeriesChart, DataChart bar variant. Adoption pattern: replace any hardcoded "0–100% with unit" axis logic with these.

### `src/utils/chartLayout.ts`

**`chartLayout({hasTitle, hasLegend, hasXAxis, hasSource, ...})`** — returns named bounding boxes (`title`, `legend`, `chart`, `axisX`, `source`) for a one-column cartesian chart. Replaces hand-tuned `chartPaddingTop = 180` magic numbers.

**Used by:** TimeSeriesChart. Migration target: any cartesian template with title + chart + bottom rows.

### `src/utils/splitCanvas.ts`

**`splitCanvas({hasTitle, leftWeight, rightWeight, ...})`** — returns `{title, leftPanel, rightPanel, source}` for a two-column layout. Companion to chartLayout for templates with a primary visualization + sidebar.

**Used by:** None yet. Migration target: BayesianUpdate (curve + evidence panel), SplitComposition (thesis/antithesis), StatReveal (number + comparison bars).

### `src/utils/labelStack.ts`

**`computeLabelStacks(items, options)`** — collision-avoidance: returns a stack-level (0, 1, 2…) for each item so clustered labels cascade vertically instead of overlapping.

**Used by:** TimeSeriesChart annotations. Migration target: DataChart bar value labels, NetworkDiagram callouts. (BifurcationRoute branch-label use case deleted with the template May 13, 2026.)

### `src/utils/dataWarnings.ts`

**`warnIf(condition, template, message, data?)`** — once-per-(template, message) console.warn for semantic data issues. No-op in production.

**`checkChartDataCommon(template, data)`** — runs standard checks (title length > 80, missing source, etc).

**Used by:** TimeSeriesChart. Migration target: every template — call from the top of the render function.

## Shared components

### `<TitleBlock>` (`src/components/TitleBlock.tsx`)

The shared title + subtitle pattern. Auto-shrinks long titles down to h3 size before they overflow. Animates in with a vertical fade from below.

**Use everywhere a chart has a title.** Replaces the hand-built `<div style={{ fontSize: ..., position: "absolute", top: ... }}>{title}</div>` pattern that used to be copy-pasted.

### `<SourceAttribution>` (`src/components/SourceAttribution.tsx`)

The "Source: …" line at the bottom-right of every chart. Mode-aware, fade-in/fade-out timed, conventional positioning.

**Adopted by:** TimeSeriesChart, DataChart, SankeyFlow, RouteAnimation, ImageComposite. **Migrate next:** any template still rendering `data.source` inline with `<div style={{ position: "absolute" ... }}>`.

### `<HeroStat>` (`src/components/HeroStat.tsx`)

The "big number" display: optional prefix/suffix at smaller scale, count-up animation, halo text-shadow, optional caption below.

**Used by:** None yet (the new component). Migration target: StatReveal hero number, TimeSeriesChart's `heroStat`, BayesianUpdate's probability display, ProbabilityGauge readouts.

## Theme conventions (`src/design/theme.ts`)

### Categorical colors

```ts
import { categorical, getCategoricalColor } from "../../design/theme";

// Auto-assign when data omits color:
const color = node.color || getCategoricalColor(index);
```

Sequence: `[muted blue, rust, gold, umber, walnut, taupe]`. Wraps around for >6 series.

**Adopted by:** SankeyFlow nodes, StatReveal bars, DecisionTree nodes, StrategicLandscape actors, DataChart dataPoints. **Pattern to replace:** any `color || palette.amber` fallback.

### Animation timing tokens

```ts
import { timing } from "../../design/theme";

timing.entrance.fast    // sec(0.3) — quick reveal
timing.entrance.medium  // sec(0.5) — default
timing.entrance.slow    // sec(0.8) — hero moments
timing.exit.medium      // sec(0.5) — default exit
timing.stagger.normal   // sec(0.15) — sibling stagger
timing.hold.medium      // sec(1.2) — meaningful dwell
```

**Adopted by:** None yet. Migrate gradually — replace common `sec(0.X)` literals when next touching a template, but only when the value matches a token cleanly.

## Migration playbook

When you next touch a template, do these checks (in order, most→least impactful):

1. **Y-axis discipline** — does the chart compute its own domain? Does it pad below the data min? If yes, replace with `niceDomain` / `niceTicks`.
2. **Color fallbacks** — does it have `color || palette.amber` anywhere? Replace with `color || getCategoricalColor(index)`.
3. **Source rendering** — does it render `data.source` inline? Replace with `<SourceAttribution source={data.source} />`.
4. **Title sizing** — does it use `<TitleBlock>` for the title block? If not, replace.
5. **Magic-number layout** — does it have `chartPaddingTop = 180` style values? Migrate to `chartLayout` or `splitCanvas`.
6. **Hero numbers** — does it have inline `<div>{count}<span>%</span></div>`? Replace with `<HeroStat>`.
7. **Label collisions** — does it cluster labels horizontally? Use `computeLabelStacks`.
8. **Dev warnings** — call `checkChartDataCommon(templateName, data)` at the top of the render function.

## Catalog

`src/catalog/` is the toolkit view — every template registered with multiple variants of evergreen demo data. Open Studio → expand `Catalog/` in the sidebar to see them. The Showreel (`catalog-showreel`) is a single 6-minute mega-comp that walks through every variant.

**Coverage** (last reconciled May 13, 2026 — counts updated post-AtlasPlate migration + new-template additions; see `MAP_TEMPLATE_SELECTOR.md` for the Mapbox→AtlasPlate doctrine):
- Maps: **AtlasPlate × 5** (cocom, cold-war-vintage, g7, cold-war-blocs, tordesillas), **RouteAnimation × 4** (silk-road, magellan, chokepoints, rome-radial), ProportionalSymbolMap, CartogramMap, DensityMap, TilegramUSMap. *ChoroplethMap removed from the catalog post-migration — template still exists in `src/templates/ChoroplethMap/` for atmospheric / terrain-required shots only.*
- Data: StatReveal × 3, DataChart × 4 (bar, comparison, lollipop, small-multiples), TimeSeriesChart × 4, ProbabilityGauge × 2, BayesianUpdate, RadarChart, SankeyFlow, PricingWaterfall × 4, IsotypeChart, BumpChart, PopulationPyramid, RankChangeDotPlot, BeeswarmChart, CalendarHeatmap, ConnectedScatterplot, Streamgraph, RidgelinePlot, MarimekkoChart × 2, TernaryPlot, HorizonChart × 2, DumbbellPlot
- Typography: KineticTypography × 4
- Titles: TitleTransition × 4
- Diagrams: FrameworkDiagram × 3, NetworkDiagram × 2, SplitComposition × 2, ArcDiagram, StrategicLandscape, DuelingFrameworks × 2
- Timelines: HorizontalTimeline × 3, EscalationLadder × 2, TimelineComparison, DualTimeline
- Scenarios: DecisionTree × 2, GameBoard × 4 (chess-endgame, stag-hunt, pd-canonical, iterated-pd). *BifurcationRoute retired May 13, 2026 — institutional-bifurcation stories migrated to DuelingFrameworks or HorizontalTimeline dual mode.*

**Not yet covered:** ImageComposite, PhotoMontage, AnnotatedImage (need image assets), DuelingFrameworks, StrategicLandscape.

When adding a new template, add a catalog entry as part of the template's first commit. The pattern is in `src/catalog/Maps.tsx`.

## Per-template notes

| Template | Last touched | Notes |
|---|---|---|
| TimeSeriesChart | May 4, 2026 | chartLayout, niceDomain, leading-edge marker, legend, axis titles, dataWarnings |
| DataChart | May 4, 2026 | niceDomain on bar variant, formatAsYear, categorical colors |
| SankeyFlow | May 4, 2026 | Ribbon refactor, thin bars, smart labels, vertical bias |
| BayesianUpdate | May 4, 2026 | curveHeight centered, no longer bottom-pinned |
| TitleBlock | May 4, 2026 | Dynamic font sizing for long titles |
| StatReveal | May 4, 2026 | Categorical color fallback |
| DecisionTree | May 4, 2026 | Categorical color fallback |
| StrategicLandscape | May 4, 2026 | Shared categorical sequence (was duplicating blue) |
| Other templates | unchanged | Audit pending — see migration playbook |
