# Chart Template Selector — Wall-Table

> One page. Pin it. When a script beat needs a chart, look here BEFORE writing visual-spec JSON.
>
> Last updated: May 11, 2026

Six chart templates. Cleveland's perceptual hierarchy is the underlying theory — *position-along-common-scale* (DataChart, TimeSeriesChart) outperforms *length* (proportional bars) which outperforms *angle / area* (pie charts, intentionally absent from this toolkit). Picking the wrong chart can falsify the editorial argument.

Per-template dossiers under `references/template-research/`:
- [`data-chart.md`](references/template-research/data-chart.md)
- [`time-series-chart.md`](references/template-research/time-series-chart.md)
- BayesianUpdate, ProbabilityGauge, RadarChart, StatReveal — no dedicated dossier; see `template-picker.md`

---

## The selection question

```
What KIND of data → which TEMPLATE
```

| Data shape | Editorial point | Template |
|---|---|---|
| Discrete categories, single metric | "Which is biggest" | **DataChart** (bar / lollipop / horizontal) |
| Continuous data over time | "Look at the trajectory / slope" | **TimeSeriesChart** |
| One hero statistic with historical context | "This number dwarfs everything else" | **StatReveal** |
| Multi-dimensional capability comparison | "What does the whole profile look like" | **RadarChart** |
| Probability updating from evidence | "Watch the prior shift into the posterior" | **BayesianUpdate** |
| Single probability readout / fast reveal | "X% likely / point estimate" | **ProbabilityGauge** |

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
└─ "Multi-axis capability / profile"
    └─ 3-6 axes × 1-3 entities ────────────────── RadarChart
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
