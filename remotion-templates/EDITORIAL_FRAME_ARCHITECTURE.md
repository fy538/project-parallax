# EditorialFrame — Architecture Proposal

> Shared editorial-chart-craft layer that wraps any of Parallax's 19 chart templates and provides NYT-Upshot/FT/Economist-grade composition: kicker + hero stat + headline + dek + annotations + reference lines + legend strategy + chrome variants. Draft May 17, 2026. Pre-implementation review.

## The problem

The current DataChart template renders the data but does not render the *editorial frame around the data*. The aspirational compositions Tiger keeps testing in ChatGPT image-gen — hero stat on left, chart on right, callout with leader line, italic dek beneath headline, source attribution at bottom — are *FT/NYT signatures*, not novel design moves. They are achievable inside Remotion. They are not currently achievable inside DataChart because the schema does not have slots for them.

The fix is *not* to expand DataChart's schema (or every chart template's schema) with these slots. The fix is to **extract a shared `<EditorialFrame>` wrapper** that any chart template can opt into, providing:

1. Layout grid (hero-split / centered / full-bleed / stacked)
2. Header zone (kicker + title + dek + hero-stat module)
3. Annotation overlay (multi-callout with leader lines, event flags, era bands)
4. Reference elements (threshold lines, average lines, range bands)
5. Legend strategy (top-aligned / suppressed / direct-label-at-line-end)
6. Footer zone (publication chrome / intelligence chrome / no chrome)
7. Source attribution slot

The chart template (DataChart, TimeSeriesChart, BumpChart, etc.) renders only the geometric primitives — bars, lines, dots — inside the frame's content slot. **The frame is shared; the chart is local.**

This is the same pattern as a print-magazine page template: the magazine defines the page (margins, header, folio, source byline); the article fills the body. NYT, FT, and Economist all work this way internally — there is one chart-frame system that every desk reuses, and the actual chart geometry is variable.

## Research distillation

### Layout systems (what we're competing with)

- **Economist Daily Charts** — 35/65 hero-split is the workhorse. Massive hero stat or chart-as-argument on the left, supporting prose on the right (or vice versa). Cream background (`#FDF1E6`-ish). Red rectangle masthead in upper-left.
- **FT John Burn-Murdoch chart-as-argument** — single chart fills 60-80% of frame. Title states the FINDING, not the topic ("Theory outpaced evidence — three to one" not "Theory vs empirical papers, by decade"). Salmon paper background. Direct-label-at-line-end (no legend). 1-3 inline callout annotations with leader lines.
- **NYT Upshot static hero** — vertical stack: kicker → headline (states finding) → dek (italic, often quoting source) → chart fills ~50% → caption → source. Off-white background. Annotation layer is the editorial work — Amanda Cox doctrine ([Daily Northwestern](https://dailynorthwestern.com/2017/05/03/campus/new-york-times-upshot-editor-discusses-data-visualization-storytelling/), [Fast Company](https://www.fastcompany.com/3040817/the-upshot-where-the-new-york-times-is-redesigning-news)).
- **Bloomberg Graphics austere** — strip all chrome. Title, chart, source. Nothing else. Lets the data carry weight.
- **The Pudding** — varies per essay; no fixed system. Not relevant for a video channel.

### Annotation patterns (where we're behind most)

From [FT Visual Vocabulary](https://ft-interactive.github.io/visual-vocabulary/) ([GitHub](https://github.com/Financial-Times/chart-doctor/tree/main/visual-vocabulary)) and NYT Upshot's published practice ([FlowingData/Upshot archive](https://flowingdata.com/tag/upshot/)):

1. **Callout with leader line** — pointing to a specific data point, with headline + optional italic dek (NYT Upshot signature)
2. **Event flag on time series** — vertical line at a date with a short label ("Lehman fails", "Roe overturned", "Plaza Accord")
3. **Era band / shaded period** — gray vertical band covering a date range (recessions, war years, "before reform / after reform")
4. **Range band / confidence interval** — translucent band around a line showing uncertainty
5. **Terminal label at line endpoint** — direct labels on each line at its rightmost point (FT signature, kills the need for a legend)
6. **Inline value label** — the value sits ON the bar (Economist Daily Charts), not floating above
7. **Threshold line + label** — horizontal dashed line at a meaningful threshold (50%, zero, target, average)
8. **Anchor + arrow** — small triangular pointer at a data point, dek beneath

Parallax currently has: `annotation: string` (1 string, no positioning), `referenceLine` (single, no label terminus), `highlightIndex` (highlight one bar).

### Color discipline patterns

- **Single-protagonist mode** — one bar/point/line in accent color, rest in neutral. The single Round-1 amber bar in Tiger's image 2 aspiration is this exact move.
- **Two-category contrast** — theory vs empirical, supply vs demand, before vs after. Amber + oxblood is correct.
- **Per-bar coloring** — only when each bar represents a different categorical entity (countries, eras).
- **Saturation policy** — chart bars use FULL palette saturation (Parallax's 25% global desaturation should NOT apply to chart fills; it currently might).

### Number formatting

- Inline values: `140` not `140.0`, `2,000` not `2000`, `$3.2B` not `3,200,000,000`
- Hero stats: ratio (`3:1`), percentage (`82%`), magnitude (`$890M`)
- Decimals only where editorially load-bearing
- Direct number-on-bar for hero values, axis-anchored labels for context values

## Proposed architecture

### Component composition

```tsx
<EditorialFrame
  // Header zone
  kicker="THEORY DIFFUSION"
  title="Theory outpaced evidence — three to one"
  dek="Across every decade of the game-theory boom..."
  heroStat={{
    value: "3:1",
    placement: "left-rail",   // or "above-headline" / "inset"
    weight: "display",         // or "h1" / "h2"
  }}

  // Layout
  layout="hero-split"          // "hero-split" | "centered" | "full-bleed" | "stacked"
  splitRatio={[35, 65]}        // left/right split when applicable

  // Annotations (multi)
  annotations={[
    { targetDataPoint: 0, position: "right", headline: "The one-shot model predicts 0%.", dek: "Round one observed 82% cooperation." },
    { targetXValue: 1987, position: "top", headline: "INF Treaty signed", style: "event-flag" },
  ]}

  // Reference elements
  referenceLines={[
    { value: 50, label: "cooperation / defection threshold", style: "dashed" },
  ]}
  eraBands={[
    { start: 1929, end: 1939, label: "Great Depression", opacity: 0.08 },
  ]}

  // Legend
  legend="top-aligned"         // "top-aligned" | "direct-label" | "suppressed" | "inline"
  legendItems={[
    { label: "THEORY", color: "#C4A747" },
    { label: "EMPIRICAL", color: "#A64D46" },
  ]}

  // Chrome
  chrome="publication"         // "publication" | "intelligence" | "none"
  source="JSTOR citation analysis, PD-keyword publications 1960–1999"
>
  {/* Chart content slot — bars, lines, dots, whatever */}
  <DataChartBars dataPoints={...} colorBy="category" labelPlacement="inside-end" />
</EditorialFrame>
```

The chart template becomes a CONTENT primitive that knows how to render bars/lines/dots — nothing about kickers, titles, annotations, or chrome. The frame handles all of that.

### Schema design

`src/components/EditorialFrame/schema.ts`:

```ts
const HeroStatSchema = z.object({
  value: z.string(),                                          // "3:1", "82%", "$890M"
  placement: z.enum(["left-rail", "above-headline", "inset", "right-rail"]),
  weight: z.enum(["display", "h1", "h2"]).default("display"),
  color: z.string().optional(),
});

const AnnotationSchema = z.object({
  // Targeting — exactly one of these:
  targetDataPoint: z.number().optional(),                     // index into chart data
  targetXValue: z.union([z.number(), z.string()]).optional(), // for time-series (year, category)
  targetCoordinate: z.tuple([z.number(), z.number()]).optional(), // absolute placement
  // Content
  headline: z.string(),
  dek: z.string().optional(),
  // Style
  position: z.enum(["top", "right", "bottom", "left"]).default("right"),
  style: z.enum(["callout", "event-flag", "anchor", "inline"]).default("callout"),
  leaderLine: z.boolean().default(true),
  color: z.string().optional(),
});

const ReferenceLineSchema = z.object({
  value: z.number(),
  axis: z.enum(["x", "y"]).default("y"),
  label: z.string().optional(),
  labelPosition: z.enum(["start", "end", "above", "below"]).default("end"),
  style: z.enum(["solid", "dashed", "dotted"]).default("dashed"),
  color: z.string().optional(),
});

const EraBandSchema = z.object({
  start: z.union([z.number(), z.string()]),
  end: z.union([z.number(), z.string()]),
  axis: z.enum(["x", "y"]).default("x"),
  label: z.string().optional(),
  color: z.string().optional(),
  opacity: z.number().min(0).max(1).default(0.08),
});

const LegendItemSchema = z.object({
  label: z.string(),
  color: z.string(),
  symbol: z.enum(["square", "circle", "line"]).default("square"),
});

export const EditorialFrameSchema = z.object({
  // Header
  kicker: z.string().optional(),
  title: z.string(),
  dek: z.string().optional(),
  heroStat: HeroStatSchema.optional(),

  // Layout
  layout: z.enum(["hero-split", "centered", "full-bleed", "stacked"]).default("centered"),
  splitRatio: z.tuple([z.number(), z.number()]).optional(),   // e.g. [35, 65]

  // Overlay elements
  annotations: z.array(AnnotationSchema).optional(),
  referenceLines: z.array(ReferenceLineSchema).optional(),
  eraBands: z.array(EraBandSchema).optional(),

  // Legend
  legend: z.enum(["top-aligned", "direct-label", "suppressed", "inline"]).default("suppressed"),
  legendItems: z.array(LegendItemSchema).optional(),

  // Chrome
  chrome: z.enum(["publication", "intelligence", "none"]).default("publication"),
  source: z.string().optional(),

  // Footer
  caption: z.string().optional(),                              // italic dek beneath chart
  modeTag: z.string().optional(),                              // small caps tag (e.g. "ACADEMIC ANALYSIS")
});
```

This becomes the canonical contract every chart template can opt into. Schemas like `DataChartSchema` extend this rather than re-declaring the slots.

### Layout system specifics

**`hero-split`** — Left rail (default 35%): kicker + heroStat + title + dek (optional body). Right rail (65%): chart fills the column with margins. This is the Economist Daily Charts default. Tiger's image 1 aspirational.

**`centered`** — Vertical stack, all elements centered: kicker → title → dek → chart → caption → source. This is the NYT Upshot static-graphic default. Tiger's image 2 aspirational.

**`full-bleed`** — Title bar across top (kicker + title + dek), chart fills 100% of remaining frame width, source bottom-right. FT John Burn-Murdoch hero chart.

**`stacked`** — Vertical column: title → annotations → chart → caption → source. No left/right split. Most editorial-magazine-page natural.

### Chrome modes

- **`publication`** — No REC pulse, no FILED date. Just source attribution at bottom-right in mono caps small text. Light dividing rule above source. This is the chart default.
- **`intelligence`** — Current FooterStrip behavior: REC dot + runtime + SCALE + FILED. For atmospheric / map segments where the dossier register earns its keep.
- **`none`** — Bloomberg-austere. Title and chart; nothing else. Reserve for editorial peaks.

The chart's `chrome` field should default to `publication`; only specific segments (maps, atmospheric photos, archival reveals) opt into `intelligence`.

### Annotation rendering specifics

Callouts position relative to the chart's bounding rect (calculated from the layout grid) with these placement rules:

- `targetDataPoint: 0` + `position: "right"` → annotation sits to the right of the bar at index 0, leader line connects them
- `targetXValue: 1987` + `style: "event-flag"` → vertical thin line at x=1987 with label rotated 90° at the top
- `targetCoordinate: [0.75, 0.4]` → absolute placement (relative to chart bounding rect), useful for "watermark" callouts

Animation: callouts fade in with a 200ms lag after their target data point settles (anticipatory reveal in reverse — the data settles, THEN the callout names it).

## Chart-type gaps to add

After the EditorialFrame ships, these are the chart types Parallax is missing per the FT Visual Vocabulary 9 categories and the SOTA audit:

| Category | Have | Missing | Priority |
|---|---|---|---|
| **Deviation** | DumbbellPlot, RankChangeDotPlot | DivergingBar (positive/negative bars from zero) | Medium |
| **Correlation** | ConnectedScatterplot, ProportionalSymbolMap | Slopegraph (Tufte signature; before/after) | **High** |
| **Ranking** | BumpChart, DumbbellPlot, RankChangeDotPlot | Cleveland dot plot (ranked categories) | Medium |
| **Distribution** | BeeswarmChart, RidgelinePlot, PopulationPyramid | Boxplot, ViolinPlot | Low |
| **Change over time** | TimeSeriesChart, BumpChart, ConnectedScatter | **Stepped line** (threshold/discrete change), **Slopegraph**, **Spark line** (inline tiny) | **High** |
| **Magnitude** | DataChart, IsotypeChart, Lollipop, RadarChart, StatReveal | **Bullet chart** (target vs actual), **KPI card** (stat + change indicator + sparkline) | **High** |
| **Part-to-whole** | MarimekkoChart, PricingWaterfall, Streamgraph | **Treemap**, **Sunburst**, **Donut/Pie** (only at extreme bias points) | Medium |
| **Spatial** | All map templates | (covered) | — |
| **Flow** | SankeyFlow, RouteAnimation, ArcDiagram | **Chord diagram** (relationships in a closed system), **bundled flow map** (already in roadmap) | Medium |

**Priority high-value adds:** Slopegraph, Bullet, KPI card, Stepped line, Spark line. These are the 5 most-used SOTA chart forms that Parallax cannot currently render.

## Migration plan

### Phase 1 — Build EditorialFrame (2 days)
Files: `src/components/EditorialFrame/{schema.ts, EditorialFrame.tsx, layouts/HeroSplit.tsx, layouts/Centered.tsx, layouts/FullBleed.tsx, layouts/Stacked.tsx, AnnotationOverlay.tsx, ReferenceLineOverlay.tsx, EraBandOverlay.tsx, HeroStatModule.tsx, ChartChrome.tsx}`. No template migration yet. Unit tests for layout math + annotation positioning.

### Phase 2 — Migrate DataChart (1 day)
DataChart wraps `<EditorialFrame>` and accepts the frame props. Existing schema fields (`title`, `subtitle`, `annotation`, `referenceLine`, `highlightIndex`) get adapter shims so existing data files (PD's `chart-diffusion.json`) continue working. New data files can use the full EditorialFrame schema. Re-render PD's `chart-diffusion.json` and compare to Tiger's aspirational image 1.

### Phase 3 — Migrate TimeSeriesChart (1 day)
Same migration pattern. Re-render PD's `chart-vol-smile.json`.

### Phase 4 — Add Slopegraph + Bullet + KPI + StepLine + Sparkline (3-4 days)
The 5 priority-high chart types. Each uses EditorialFrame.

### Phase 5 — Backport remaining chart templates (5 days, can be incremental)
BumpChart, BeeswarmChart, ConnectedScatter, etc. all opt into EditorialFrame. Each adds ~30-60 min.

### Phase 6 — Build template-doctrine doc (1 day)
`PARALLAX_VISUAL_VOCABULARY.md` modeled on FT's Visual Vocabulary, but specific to Parallax's templates and editorial register. Becomes the chart-chooser for the production team.

**Total: 13-14 days of work spread over 2-3 weeks (incremental, not blocking episode production).**

## Open questions for Tiger

1. **Chrome default for charts: `publication` or `intelligence`?** Recommendation: `publication`. Intelligence chrome belongs on maps, archival reveals, atmospheric segments — not on data charts. The REC pulse undermines analytical credibility.

2. **Hero stat as standalone composition, or only as left-rail of a chart?** Recommendation: both. The standalone-hero-stat composition (like a giant `82%` filling the frame) is a separate template called `HeroStat` — sibling to StatReveal but more editorially polished (no count-up animation, just clean settle).

3. **Annotation animation timing — anticipatory or reactive?** D17 says anticipatory (elements settle 150ms before narration). For annotations on charts, the editorial logic is *reactive* — the data appears, THEN the annotation names what's happening. Recommendation: annotations override D17 to reactive (200ms lag).

4. **Legend default: `suppressed` or `top-aligned`?** Recommendation: `suppressed` (default direct-label-at-line-end). Top-aligned legend is the fallback when direct labeling doesn't fit.

5. **Per-chart customization overrides — schema-level fields or via `_direction`?** Recommendation: schema-level on EditorialFrame for the editorial knobs; `_direction` reserved for camera/atmosphere/drift.

## Out of scope for this proposal

- Interactivity (scroll-driven, click-driven). Charts in Parallax are video stills/animations only.
- Live data sources. All chart data is static JSON.
- Custom font commissions. Plex + JetBrains Mono are the typographic system.
- The 19 existing chart templates' geometric correctness — this proposal addresses the *frame around* the chart, not the chart math itself.

## Recommendation

Land Phase 1 + Phase 2 first (3 days of work). Re-render PD's two chart segments. If they match the aspirational compositions, the architecture is right and we extend across the chart family in Phases 3-5. If they don't match, we iterate the architecture before paying the migration cost on 17 more templates.
