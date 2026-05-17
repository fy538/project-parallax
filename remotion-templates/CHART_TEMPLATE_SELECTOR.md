# Chart Template Selector — Wall-Table

> One page. Pin it. When a script beat needs a chart, look here BEFORE writing visual-spec JSON.
>
> Last updated: May 11, 2026

**19 chart templates** (6 core: DataChart, TimeSeriesChart, BayesianUpdate, ProbabilityGauge, RadarChart, StatReveal — plus 13 specialized: BeeswarmChart, BumpChart, CalendarHeatmap, ConnectedScatterplot, DumbbellPlot, HorizonChart, IsotypeChart, MarimekkoChart, PopulationPyramid, RankChangeDotPlot, RidgelinePlot, Streamgraph, TernaryPlot). The 6 core templates carry most production weight; the 13 specialized templates are reached for specific data shapes — see the per-template dossiers under `references/template-research/` for each one's canonical use case and failure modes. Cleveland's perceptual hierarchy is the underlying theory — *position-along-common-scale* (DataChart, TimeSeriesChart) outperforms *length* (proportional bars) which outperforms *angle / area* (pie charts, intentionally absent from this toolkit). Picking the wrong chart can falsify the editorial argument.

Per-template dossiers under `references/template-research/` (every chart template has one):
- Core 6: [`data-chart.md`], [`time-series-chart.md`], [`stat-reveal.md`], [`radar-chart.md`], [`bayesian-update.md`], [`probability-gauge.md`]
- Specialized 13: [`beeswarm-chart.md`], [`bump-chart.md`], [`calendar-heatmap.md`], [`connected-scatterplot.md`], [`dumbbell-plot.md`], [`horizon-chart.md`], [`isotype-chart.md`], [`marimekko-chart.md`], [`population-pyramid.md`], [`rank-change-dot-plot.md`], [`ridgeline-plot.md`], [`streamgraph.md`], [`ternary-plot.md`]
- Read the dossier for any template you're about to use — each one names the canonical idiom from real outlets (NYT Upshot, FT, Economist, Bloomberg, Reuters, Pudding), Parallax-specific defaults, and the failure modes that produce wrong-chart-for-the-data mis-routing.

---

## The selection question

```
What KIND of data → which TEMPLATE
```

### Core 6 (most production weight)

| Data shape | Editorial point | Template |
|---|---|---|
| Discrete categories, single metric | "Which is biggest" | **DataChart** (bar / lollipop / horizontal) |
| Continuous data over time | "Look at the trajectory / slope" | **TimeSeriesChart** |
| One hero statistic with historical context | "This number dwarfs everything else" | **StatReveal** |
| Multi-dimensional capability comparison | "What does the whole profile look like" | **RadarChart** |
| Probability updating from evidence | "Watch the prior shift into the posterior" | **BayesianUpdate** |
| Single probability readout / fast reveal | "X% likely / point estimate" | **ProbabilityGauge** |

### Specialized 13 (reach for these when the data shape demands it)

| Data shape | Editorial point | Template |
|---|---|---|
| Rank changes across periods (lines crossing) | "Who overtook whom and when" | **BumpChart** — line crossings ARE the story (e.g., "China overtakes Japan as #2 GDP, 2010"). For 2-3 entities + 2-3 periods consider **RankChangeDotPlot** (simpler, ordinal-rank dots with connecting lines) or **DumbbellPlot** (before/after on a value axis, not just rank) |
| Before-and-after on a value axis | "How far each shifted" | **DumbbellPlot** — two dots per entity connected by a line; reads the *delta* immediately. Use when "moved from X to Y" is the editorial sentence (income shift, polling shift, capability shift). |
| Two ordered series moving together over time | "These two variables are co-evolving" | **ConnectedScatterplot** — x-axis = variable A, y-axis = variable B, dots connected chronologically. The shape of the path IS the argument (e.g., "GDP per capita vs life expectancy 1950-2024"). |
| Distribution of many individual entities | "Look at the spread / cluster / outliers" | **BeeswarmChart** — dots non-overlapping along one axis. Use when there are 30-200 entities and the distribution shape matters more than per-entity labels (e.g., "income distribution across 195 countries"). |
| Distribution shape across many groups | "How the distribution changes across categories" | **RidgelinePlot** — stacked density curves, one per group. Use when distributions are the unit of comparison (e.g., "polling distribution by age group across 5 elections"). |
| Multi-series time data, dense, comparing shapes | "Each row IS a line — many tracks visible at once" | **HorizonChart** — overlapping bands compress vertical space so 8-15 series fit. Used by FT for market spreads, central-bank rate tracking. |
| Year × day-of-year cyclical data | "Pattern repeats across years" | **CalendarHeatmap** — color intensity per day across a calendar grid. Use for daily metrics with annual rhythm (election cycles, weather patterns, conflict-event frequency). |
| Counts using icons (one icon = N units) | "Make the count viscerally readable" | **IsotypeChart** — Otto Neurath pictogram tradition. Use when the count itself is the rhetoric (deaths, refugees, ships), and the icon humanizes the unit. |
| Width × height proportional rectangles (two dimensions on one chart) | "Both share and category-share visible at once" | **MarimekkoChart** — width = share of total, height segments = composition within. Used by FT/Bloomberg for energy mix × economy size, fleet composition × country. |
| Age × sex / two-axis population profile | "Demographic shape IS the story" | **PopulationPyramid** — back-to-back horizontal bars. Use only when age-cohort distribution is the editorial point. |
| Stacked area over time (compositions evolving) | "Pieces of the whole shifting over time" | **Streamgraph** — silhouette-style stacked area centered on baseline. Use for relative-composition stories (oil-import sources, fleet composition, party-vote share). |
| Three-component compositions (parts of 100%) | "Triangle showing the trade-off" | **TernaryPlot** — triangular plot for 3-component data summing to 100% (energy mix, soil composition, electoral splits A/B/abstain). |

---

## Decision tree

```
What does the script say about the data?
│
├─ "Compare X across countries / companies / categories"
│   ├─ 2-8 items, one metric ──────────────────── DataChart
│   ├─ 9+ items ──────────────────────────────── DataChart horizontal/lollipop
│   └─ Categories × multiple metrics ─────────── DataChart small multiples
│
├─ "Trend over time / look at the slope"
│   ├─ Single series ─────────────────────────── TimeSeriesChart
│   ├─ 2-3 series ────────────────────────────── TimeSeriesChart multi-line
│   └─ 4+ series ─────────────────────────────── TimeSeriesChart small multiples
│
├─ "The number that matters"
│   ├─ Hero stat + historical context bars ──── StatReveal
│   ├─ Hero stat alone (no comparison) ──────── KineticTypography (statistic variant — different family)
│   └─ Two stats compared head-to-head ──────── StatReveal (paired) or DataChart
│
├─ "Probability of X" / "% likely"
│   ├─ Show the analytical PROCESS (prior → posterior) ──── BayesianUpdate
│   ├─ Show just the OUTCOME (point estimate / gauge) ───── ProbabilityGauge
│   ├─ Compare two competing hypotheses ──────────────────── BayesianUpdate (compare)
│   └─ Forecast scorecard (predictions vs. outcomes) ────── ProbabilityGauge (scorecard)
│
├─ "Multi-axis capability / profile"
│   └─ 3-6 axes × 1-3 entities ────────────────── RadarChart
│
├─ "Rank changes over time"
│   ├─ Lines crossing IS the story (many crossings) ──── BumpChart
│   ├─ 2-3 entities, 2-3 periods (sparse) ────────────── RankChangeDotPlot
│   └─ Before/after on a value axis (not just rank) ──── DumbbellPlot
│
├─ "Distribution / spread / cluster of many entities"
│   ├─ 30-200 individual entities on one axis ────────── BeeswarmChart
│   └─ Distribution SHAPE across groups (stacked KDE) ── RidgelinePlot
│
├─ "Two variables co-evolving over time"
│   └─ x = var A, y = var B, path = chronology ──────── ConnectedScatterplot
│
├─ "Multi-series time data, dense"
│   └─ 8-15 series compressed into bands ─────────────── HorizonChart
│
├─ "Cyclical / repeating-period data"
│   └─ Year × day-of-year color grid ─────────────────── CalendarHeatmap
│
├─ "Counts made viscerally readable"
│   └─ One icon = N units, Otto Neurath tradition ────── IsotypeChart
│
├─ "Compositional / part-of-whole"
│   ├─ Width × height (share × composition) ──────────── MarimekkoChart
│   ├─ Three components summing to 100% ─────────────── TernaryPlot
│   ├─ Composition over time (stacked area silhouette)  Streamgraph
│   └─ Age × sex demographic profile ─────────────────── PopulationPyramid
```

---

## Sibling-template disambiguation

### DataChart vs. TimeSeriesChart

| | DataChart | TimeSeriesChart |
|---|---|---|
| X-axis | Categorical (countries, products) | Continuous time (dates) |
| Editorial point | "Which is biggest / smallest" | "Look at the trajectory" |
| When time IS in DataChart | Years 2000, 2010, 2020 as categories | (Use TimeSeries for dense quarterly/monthly) |
| Sample sentence | "US has 5×, China has 3×" | "Volume tripled then crashed" |
| Sample sentence (multi-series) | "By country and year, small multiples" | "Compare 2-3 countries' trajectories" |

### StatReveal vs. KineticTypography (statistic variant)

| | StatReveal | KineticTypography statistic |
|---|---|---|
| Family | Charts | Typography |
| Includes context bars | YES (mandatory comparison) | No |
| Editorial point | "Magnitude relative to history" | "The number is the headline" |
| Reveal duration | ~4-5s (hero + bars) | ~3-4s (number + label) |
| Sample sentence | "37,500 — more than 3× the previous record" | "37,500." |

### BayesianUpdate vs. ProbabilityGauge

| | BayesianUpdate | ProbabilityGauge |
|---|---|---|
| Editorial point | Teach the *mechanism* of belief updating | Reveal the *outcome* fast |
| Animation | Prior curve → evidence panel → posterior shift | Speedometer arc lands at point estimate |
| Sample sentence | "Started at 30%, then this evidence dropped, dropped it to 12%" | "P(Russia attacks) = 42%" |
| Best use | Teaching forecasting / probabilistic reasoning | Quick read of one or more predictions |
| Compare variant | Two competing hypothesis curves shifting | Two speedometers side-by-side OR scorecard grid |

### RadarChart vs. DataChart (bar)

| | RadarChart | DataChart bar |
|---|---|---|
| Editorial point | "Profile / overall capability gap" | "Who wins on this dimension" |
| Best for | 3+ subjects × 3-6 axes | 1 metric × many subjects |
| Failure mode | >3 subjects with long labels → radial collision | >8 bars without lollipop variant |
| Sample sentence | "Compare US, China, EU across 6 attributes" | "Compare US GDP, China GDP, EU GDP" |

---

## Mode flags by template

| Template | Common flags / variants |
|---|---|
| DataChart | `variant: "bar" \| "horizontal" \| "lollipop" \| "small-multiples"`; `referenceBand`; `annotationCallouts` |
| TimeSeriesChart | `variant: "single" \| "multi-line" \| "small-multiples"`; `referenceBands`; `eraBands`; `inflectionAnnotations`; `heroStat` overlay |
| StatReveal | `comparisonBars` (mandatory — without, use KineticTypography); `unit`; `precision` |
| RadarChart | 3-6 axes; `subjects[]` (1-3); axis-label letter spacing for radial-collision avoidance |
| BayesianUpdate | `variant: "single" \| "compare"`; `evidencePanels[]` (cited, pro/con) |
| ProbabilityGauge | `variant: "single" \| "compare" \| "scorecard"` |

---

## Mandatory editorial rules (Tufte + dossiers)

1. **No truncated y-axis on quantitative bars.** Cardinal sin. Always start at 0 unless there's a documented editorial reason (and even then, use a broken-axis treatment, not a silent truncation).
2. **No rainbow bars.** One accent color OR muted-bars-plus-one-highlight. Multi-color bars destroy hierarchy.
3. **Source attribution required.** Every chart cites its source (FooterStrip or tertiary annotation).
4. **Annotations tell the story.** Annotation describes *why* the chart bent, not *what* the chart shows.
5. **Hero stat in TimeSeriesChart** should overlay (positioned), not float independently. The dossier specifies position.
6. **Reference bands** (e.g., "1973 oil crisis") use era-color from the brand palette, not arbitrary tints.
7. **Cleveland-honest encoding.** Position-along-scale (DataChart bar, TSC line) beats length (proportional area) beats angle (pie). Pie charts are not in the toolkit by design.

---

## Quick-fail checklist (read before generating JSON)

- [ ] Is the data shape categorical (DataChart) or continuous-over-time (TimeSeriesChart)?
- [ ] Is the y-axis starting at 0? (truncation = falsification)
- [ ] Is there a source annotation?
- [ ] Does each chart have ≤6 items in vertical mode, or use horizontal/lollipop/small-multiples for more?
- [ ] If TimeSeriesChart with multiple series: are series visually distinguishable (weight, color, accent line)?
- [ ] If StatReveal: are there comparison bars (mandatory)?
- [ ] If RadarChart: are subject labels short enough to avoid radial collision (<25 chars)?
- [ ] If BayesianUpdate: do evidence panels actually shift the curve (not animated decoration)?

---

## Common mistakes — flagged by `chart-audit` skill

1. **DataChart with truncated y-axis** → cardinal sin; reject.
2. **DataChart with rainbow bars** → one accent OR muted+highlight; reject multi-color bars.
3. **DataChart with 8+ items in vertical mode** → horizontal/lollipop variant.
4. **TimeSeriesChart with all-same-weight series** → spaghetti; add hero series accent.
5. **TimeSeriesChart with only 3 x-axis ticks** → strips temporal context; add more.
6. **TimeSeriesChart with 4+ multi-line series** → use small multiples instead.
7. **TimeSeriesChart with annotation that describes WHAT, not WHY** → rewrite to name the cause.
8. **StatReveal without comparison bars** → context evaporates; use KineticTypography or add bars.
9. **StatReveal where context bars dominate hero** → proportion imbalance; rescale.
10. **RadarChart with >3 subjects** → use DataChart small multiples instead.
11. **RadarChart with subject labels >25 chars** → radial label collision; abbreviate.
12. **BayesianUpdate with invented probabilities** → cite or omit.
13. **BayesianUpdate compare with >2 hypotheses** → visual collapses.
14. **ProbabilityGauge for teaching Bayesian reasoning** → wrong template; use BayesianUpdate.
15. **ProbabilityGauge scorecard with >4 rows** → unreadable grid.
16. **Pie chart attempted** → not in toolkit; route to DataChart or PricingWaterfall.

---

## References

- `references/template-picker.md` — long-form selection prose (lines 218-300 cover Data family)
- `references/template-research/data-chart.md`, `time-series-chart.md`
- `TEMPLATE_FAMILIES.md` — cross-family wayfinding
- `POLISH.md` — D1-D18 editorial doctrine
- Cleveland, W. *The Elements of Graphing Data* (1985) — the perceptual hierarchy reference
- Tufte, E. *The Visual Display of Quantitative Information* — y-axis truncation rule
