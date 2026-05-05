# LAYOUT — Positioning principles for chart templates

> Why positioning has felt ad-hoc, and the discipline I'm moving toward.

## The problem

Most chart templates in this repo position elements with `position: absolute` and hardcoded math: `area.height - 220 - layout.spacing.xl` (BayesianUpdate), `chartTop - 56` (TimeSeriesChart legend), `area.top + fontSizes.h1 + layout.spacing.xl` (SankeyFlow). Magic numbers everywhere. Each template invents its own layout from scratch.

Symptoms a viewer notices:
- Charts hugging one edge of the frame instead of feeling balanced
- Inconsistent spacing between titles and chart bodies across templates
- Elements that bottom-anchor (Bayesian, Sankey before fixes) because the SVG fills available space without budgeting for what's around it
- Y-axis ticks running off the bottom because chartHeight didn't reserve room for x-axis labels

## What the pros do

**NYT, Bloomberg, FT graphics**: strict baseline grid (usually 8px or 12px); named regions (`title-block`, `kicker`, `chart-area`, `legend-strip`, `source-line`); position is by region, not coordinate.

**Vega-Lite / Observable Plot**: declarative — you say "chart with title, x-axis, y-axis, legend, source" and the layout engine claims minimum space per region from the available canvas, hands the chart whatever's left.

**Tableau / Power BI**: container hierarchy. Title-container, chart-container, legend-container. Auto-flow with explicit padding. Reordering = drag, no math.

**Figma auto-layout**: flex/grid containers with explicit gaps. Move children, layout reflows.

The common pattern: **named regions with declared sizes**, computed from content needs, not from pixel coordinates.

## The principles

For a 1920×1080 video frame, every chart template has roughly the same regions:

```
┌─────────────────────────────────────┐
│  ∴ PARALLAX            CATALOG       │ ← chrome (HeaderStrip)
├─────────────────────────────────────┤
│                                     │
│  Title Block                        │ ← titleRegion (h1 + subtitle)
│  Subtitle                           │
│                                     │
│                            Legend   │ ← legendRegion (when multi-series)
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │      Chart Region           │    │ ← chartRegion (what's left)
│  │                             │    │
│  └─────────────────────────────┘    │
│  Y-axis labels    X-axis labels     │ ← axisRegions (claimed by chartRegion)
│                                     │
│  Source attribution                 │ ← sourceRegion
├─────────────────────────────────────┤
│  ● REC 00:00              FILED ... │ ← chrome (FooterStrip)
└─────────────────────────────────────┘
```

**Rules I'm enforcing:**

1. **No hardcoded layout math in template bodies.** All positions come from a layout helper (see `src/utils/chartLayout.ts`). If a template has `area.height - 220` somewhere, it's a smell — that 220 is a magic number for "labels above the SVG."

2. **Reserve before you render.** A multi-line chart with a legend needs to subtract legend height from the chart region BEFORE computing its plot area. Currently legends overlay the chart; instead they should claim their own region above the chart and the chart shrinks accordingly.

3. **Center is the default, edge is the exception.** Most chart content should center within its region. `position: absolute` with `top: X, bottom: X` plus internal flex centering is the pattern. Templates that anchor content to one edge should justify it.

4. **Text lives outside data, not on top of data.** Sankey labels go outside the bars. Line labels go in the legend, not stuck to line endpoints. Bar values go above the bar in the gridline area, not floating into the title bounds.

5. **Domain inference > literal min/max.** Y-axis bottoms at 0 for non-negative data. Round tick values (1k, 2k, 3k — not 1051.4, 2427.0). See `src/utils/niceTicks.ts` — already in use by TimeSeriesChart and DataChart.

## The migration

I am not refactoring all templates at once. Path:

1. **Done:** Extract `niceTicks` utility, apply to TimeSeriesChart + DataChart bar variant. Y-axis values are now consistent.
2. **Next:** Define `chartLayout(opts)` helper that returns `{title, legend, chart, source}` bounding boxes given which regions are present. Templates opt in.
3. **After:** TimeSeriesChart adopts the helper, replacing its inline `chartPaddingTop = 180` etc. with named-region access.
4. **Eventually:** SankeyFlow, DataChart, BayesianUpdate adopt. Manual position-absolute math is replaced.

The migration only ships when each step keeps every existing comp rendering correctly. No big-bang rewrite.

## When to deviate

Some templates legitimately don't fit this grid — a full-bleed map fills the frame edge-to-edge, a quote card centers a single phrase. These are "expressive" templates and should stay free-form. The discipline applies to *cartesian* charts (line, bar, sankey, distribution) where viewers expect editorial structure.
