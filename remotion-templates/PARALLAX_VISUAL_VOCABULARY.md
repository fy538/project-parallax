# Parallax Visual Vocabulary

> The chart chooser. Given the editorial argument you want to make, find the
> template that fits.
>
> Modeled on the [FT Visual Vocabulary](https://ft-interactive.github.io/visual-vocabulary/),
> but specific to Parallax's templates, voice, and editorial register. Last
> updated: May 17, 2026.

## How to use this doc

**During scripting (visual-spec stage):** given a script beat that needs a
visual, find the editorial intent below and pick the template that fits.
The right form is determined by *what claim the visual is making* — not by
what data you happen to have.

**During production:** the recipe is template → data file → render. Click
through to the template's `types.ts` for the exact field structure.

**During review:** if a chart feels off, this doc is where to check whether
the *form* matches the *argument*. A correlation argument rendered as a
ranking chart fails even when the data is right.

## The decision rule

Ask one question first: **what argument is the visual making?**

| If your argument is… | Look at category | Strongest forms |
|---|---|---|
| "X changed over time" | [Change over time](#1-change-over-time) | TimeSeriesChart, StepLine, Slopegraph |
| "X is big / small relative to Y" | [Magnitude](#2-magnitude) | DataChart, BulletChart, KPICard |
| "X is made of these parts" | [Part-to-whole](#3-part-to-whole) | PricingWaterfall, DataChart (comparison), MarimekkoChart |
| "X is distributed this way across N" | [Distribution](#4-distribution) | BeeswarmChart, RidgelinePlot, PopulationPyramid |
| "X varies with Y" | [Correlation](#5-correlation) | Slopegraph, ConnectedScatterplot |
| "X is #1 (or has moved in rank)" | [Ranking](#6-ranking) | BumpChart, RankChangeDotPlot, DumbbellPlot |
| "X is off-target / below threshold" | [Deviation](#7-deviation) | BulletChart, DataChart + referenceLine |
| "X happens here, not there" | [Spatial](#8-spatial) | AtlasPlate, ChoroplethMap, ProportionalSymbolMap |
| "X moves from A to B" | [Flow](#9-flow) | SankeyFlow, RouteAnimation, ArcDiagram |
| "X relates to Y as Y relates to Z" | [Framework / argument](#10-framework--argument) | FrameworkDiagram, DuelingFrameworks, EscalationLadder |
| "The chance of X is N%" | [Forecast / probability](#11-forecast--probability) | ProbabilityGauge, BayesianUpdate |
| "X is *what we just said*" | [Typography / text moments](#12-typography--text-moments) | KineticTypography, StatReveal, TitleTransition |

## Editorial-frame status legend

Each template gets one of three tags:

- 🟢 **Editorial-frame migrated** — Supports the `frame` opt-in for
  publication-grade composition (kicker + heroStat + multi-annotation + top
  legend + publication chrome). Recommended for all new visual-spec work.
- 🟡 **Editorial-frame native** — Built directly inside EditorialFrame
  (no opt-in needed; the frame *is* how the template renders).
- ⚪ **Legacy chrome** — Uses the original HeaderStrip + FooterStrip +
  TitleBlock chrome. Migration path documented in `CHART_MIGRATION_GUIDE.md`.

---

## 1. Change over time

The thesis: "X moved this way between A and B." The y-axis carries the
quantitative claim; the x-axis carries the time discipline.

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **TimeSeriesChart** | 🟢 | Continuous data over many points; multiple series; event annotations on the timeline are critical (Black Monday / Lehman / Plaza Accord moments) | Data has fewer than ~5 points; differences between series matter more than absolute level (use Slopegraph) |
| **StepLine** | 🟡 | Discrete/threshold data (rates, policy bands, sanctions tiers) where a smooth line would lie about the change being gradual | Series is genuinely continuous; or the y-axis crosses zero (use DataChart) |
| **Slopegraph** | 🟡 | Before/after at exactly two points; the SLOPE *is* the story; one entity bucks the trend ("most countries cut, but Brazil doubled") | More than 2 time points; lots of entities (>12 lines crowds the slopes) |
| **ConnectedScatterplot** | ⚪ | Motion through 2D space over time (e.g., GDP × CO2 trajectories per decade); reader must trace a path | The two axes don't share a meaningful relationship; simple time-series will do |
| **BumpChart** | ⚪ | Rank changes over discrete time periods (top 5 economies, 1980 → 2024) | Continuous numeric series — use TimeSeriesChart |
| **Streamgraph** | ⚪ | Composition shift over time across 5–12 categories; the relative widths tell the story | Absolute totals matter (use stacked area or small multiples); sums fluctuate wildly making baselines confusing |
| **HorizonChart** | ⚪ | Multiple series with high dynamic range that must be compared side-by-side; technical-audience visual | Audience isn't analytical (the form is unfamiliar to most viewers) |
| **CalendarHeatmap** | ⚪ | Daily/weekly data across a calendar year; seasonality / cyclical patterns | Coarser-than-daily data; pattern is monotonic rather than periodic |

**Editorial register notes:**

- **Annotations are the editorial work.** A naked TimeSeriesChart says "the data went up." An annotated TimeSeriesChart with event flags ("Lehman fails / Sept 2008") and era bands ("Recession") makes the argument. Always annotate before publishing.
- **Direct-label-at-line-end** (FT signature) is the default for multi-line charts — the legend lives at the line's terminus, not above the chart. Set `frame.legend: "direct-label"` if multiple lines exist.
- **The "model vs reality" template** is two lines where one is dashed (model) and one is solid with area fill (reality). See `chart-vol-smile.json` for the canonical example.

---

## 2. Magnitude

The thesis: "X is this big." Bars and counts. The form makes 80 feel different from 800.

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **DataChart** (variant: bar) | 🟢 | Comparing magnitudes across 3–10 named entities; "country A invested $X, country B invested $Y" | Categories aren't meaningfully ordered (use unranked dot plot); values are percentages of a fixed total (use comparison or waterfall) |
| **DataChart** (variant: horizontal) | 🟢 | Long category labels that don't fit on a vertical x-axis | Use vertical for time-series-like x-axis order |
| **DataChart** (variant: comparison stacked) | 🟢 | Two paired magnitudes per category (theory vs empirical per decade); the stack shows total + the split | More than 2 series — use small multiples |
| **BulletChart** | 🟡 | Target vs actual + qualitative ranges (bad / ok / good); calibration scorecards | No target exists; only one category (use KPICard) |
| **KPICard** | 🟡 | Single hero number with optional change indicator + sparkline; "the number that matters" closing-card moment | Multiple categories — use DataChart |
| **StatReveal** | ⚪ | Single dramatic number drop ("60 of 100") with brand entry animation | Number sits alongside other visuals — use KPICard for editorial framing |
| **RadarChart** | ⚪ | Multi-axis profile comparison; "country X scores high on freedom, low on healthcare" | Fewer than 4 axes (use bars) or more than 8 axes (illegible spider) |
| **ProbabilityGauge** | ⚪ | A single probability/percentage as a gauge dial; calibrated-forecast peak moment | Generic percentages — use KPICard or DataChart |

**Editorial register notes:**

- **Inline values vs floating labels.** When a bar's value is the headline (and value > 100 to avoid sparseness), render it INSIDE the bar at the right edge (Economist signature). For smaller values, float above. The DataChart `comparison` variant already does this when bars are wide enough.
- **Highlight discipline.** When you set `highlightIndex` on DataChart, the highlighted bar takes the accent; all others fall to neutral taupe. Don't try to color-code every bar — most arguments are "this one bar, vs the rest."
- **The hero stat trap.** Don't put a KPICard at a beat that should be carrying narrative momentum. KPICards STOP a video. Reserve them for arrival moments (Beat 5 forecast, segment closer).

---

## 3. Part-to-whole

The thesis: "this total breaks down like this." The form makes the decomposition the argument.

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **PricingWaterfall** | 🟢 | Value-chain decomposition; "where does each dollar go"; vertical bar with smallest sliver (hero) in accent | Decomposition is about types of things (not sequential value capture) — use horizontal stacked bar or Marimekko |
| **DataChart** (variant: comparison) | 🟢 | Two-category stacked horizontal bar per row (theory + empirical per decade); both segments labeled inline | 3+ category split (use Marimekko or stacked area) |
| **MarimekkoChart** | ⚪ | Cross-tabulation of two part-to-whole splits (sector × region market share); the dual encoding is the argument | Either dimension dominates (use sorted bar); too few cells (use a 2×2 framework) |
| **IsotypeChart** | ⚪ | Counting people / discrete entities (Otto Neurath ISOTYPE convention); makes "this many" visceral | Counting continuous quantities (dollars, percentages) — use bars |
| **TernaryPlot** | ⚪ | Three-way composition where shares sum to 100 (geological samples, vote shares); rare and technical | Audience can't interpret the triangle — TernaryPlot has steep onboarding |
| **Streamgraph** | ⚪ | Part-to-whole shift OVER TIME — see [Change over time](#1-change-over-time) | Static decomposition — use one of the above |

**Editorial register notes:**

- **The 7-stage limit.** PricingWaterfall enforces a max of 7 stages with a lint warning. More than 7 = legibility collapse. Merge the smallest stages into "Other" before crossing the limit.
- **The hero sliver.** In PricingWaterfall, exactly ONE stage gets `hero: true`. It should be the editorial protagonist (the smallest share when the story is "farmer gets 3 cents"; the largest when the story is "Apple captures 60%"). The lint warns if multiple are hero.
- **Don't use pie charts.** Parallax doesn't have a pie/donut template by design. Pie charts force angular comparisons, which humans read worse than positional comparisons. Bar charts and waterfalls always beat pies for these arguments.

---

## 4. Distribution

The thesis: "the values aren't uniform — they cluster here / spread there."

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **BeeswarmChart** | ⚪ | Individual data points along one axis; clusters reveal the distribution shape | Fewer than ~20 points (use a dot plot); summary statistics matter more than individual dots (use box/violin — neither in inventory yet) |
| **RidgelinePlot** | ⚪ | Distribution compared across categories (income distribution by decade, sentiment by news outlet) | Single distribution — use a histogram (not in inventory; closest substitute is BeeswarmChart) |
| **PopulationPyramid** | ⚪ | Demographic comparison across two groups (male/female, young/old, US/China) by buckets | Continuous distribution — use ridgeline |

**Editorial register notes:**

- **Distribution charts are technical.** They require the viewer to know what "distribution" means as a statistical concept. For YouTube audiences not all-analytical, prefer to summarize the distribution into a hero statistic + a small RidgelinePlot rather than leading with the chart.

---

## 5. Correlation

The thesis: "as X varies, Y varies with it."

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **Slopegraph** | 🟡 | Before/after correlation for ~6-12 entities; the slope direction across entities is the argument | More than 2 time points — use ConnectedScatterplot |
| **ConnectedScatterplot** | ⚪ | Two variables tracked over time; the path through 2D space is the story (GDP × CO2 trajectory) | The two axes don't share a meaningful relationship — use a simple time-series |
| **ProportionalSymbolMap** | ⚪ | Geographic correlation — symbol size encodes one variable, symbol position encodes "here" | Non-geographic data (use scatter plot — not currently in inventory beyond ConnectedScatter) |
| **ChoroplethMap** | ⚪ | Geographic correlation where shading-by-category encodes the value | Use ProportionalSymbolMap when the case is the data point, not the country (it usually is) |

**Editorial register notes:**

- **Correlation isn't causation, and the visual mustn't suggest it is.** A trendline through a scatter implies a causal model; Parallax doesn't do that unless the script is making the model explicit and bounded. Avoid trendlines by default.

---

## 6. Ranking

The thesis: "X is ranked here / has moved up or down."

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **BumpChart** | ⚪ | Rank changes over time for 5–10 entities; line crossings ARE the editorial story | Continuous numeric series (use TimeSeriesChart); too many entities (>12 crosses become chaos) |
| **RankChangeDotPlot** | ⚪ | Single before/after rank shift for many entities; dots + connecting line emphasize rise/fall | Continuous rank tracking over many periods — use BumpChart |
| **DumbbellPlot** | ⚪ | Two values per category compared (men vs women earnings, before vs after policy) | Just need to show the difference — use a deviation bar |

**Editorial register notes:**

- **Rank ≠ magnitude.** Rank visualizations elide the absolute difference. If "China's GDP is now bigger than Japan's" is the argument, that's *magnitude* not rank. Rank charts answer "in what order" not "by how much."

---

## 7. Deviation

The thesis: "X is above/below the threshold / target / baseline."

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **BulletChart** | 🟡 | Target vs actual + qualitative ranges; calibration scorecards | No target exists; you just want bars |
| **DataChart** + `frame.referenceLines` | 🟢 | Bar chart with a horizontal threshold line crossing it (50% line, zero line, average) | The threshold IS the question — use BulletChart instead |
| **DumbbellPlot** | ⚪ | Difference between two values per category; deviation is the "gap" between dots | Single value with reference — use DataChart + referenceLine |

**Editorial register notes:**

- **Reference lines need labels.** A horizontal dashed line at y=50 with no label is a riddle. EditorialFrame's `ReferenceLine` schema requires `label` and renders a terminal label by default at the line's end.

---

## 8. Spatial

The thesis: "this happens HERE, not there." Geography is the data carrier.

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **AtlasPlate** | ⚪ | **Default for editorial map work** — pure SVG, no Mapbox dependency, doctrinally preferred per `MAP_TEMPLATE_SELECTOR.md` | Need terrain or atmospheric register (use ChoroplethMap with Mapbox style) |
| **ChoroplethMap** | ⚪ | Atmospheric or terrain-required map; country-fill encoding | Editorial illustrative work — prefer AtlasPlate |
| **ProportionalSymbolMap** | ⚪ | Each named case has its own weight; the case is the data point | Country-level aggregation is the story (use ChoroplethMap) |
| **RouteAnimation** | ⚪ | Movement along arcs between geographic points; trade routes, military campaigns, supply lanes | Static spatial story — use one of the above |
| **DensityMap** | ⚪ | Continuous density surface (heatmap on geography); population, satellite signal coverage | Discrete points — use ProportionalSymbolMap |
| **CartogramMap** | ⚪ | Continuous warp by value (Worldmapper-style; areas distorted by population/GDP); "the world isn't what you think" | Categorical / discrete data (use TilegramUSMap) |
| **TilegramUSMap** | ⚪ | US-state-level data shown as a hex grid (equal-weight per state, ignoring area) | Non-US data; non-state aggregation |

**Editorial register notes:**

- **Use AtlasPlate by default.** The Mapbox-based maps are reserved for atmospheric / terrain-required shots per the May 13, 2026 doctrine shift. See `MAP_TEMPLATE_SELECTOR.md`.
- **Annotate, don't just shade.** A choropleth without lat/lng-anchored case annotations is a heatmap of nothing. Add leader-line annotations for the named cases.
- **Disputed boundaries get dashed lines in `semantic.china` red.** This is the channel's cartographic doctrine; don't render disputed borders as if settled.

---

## 9. Flow

The thesis: "X moves from A to B."

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **SankeyFlow** | ⚪ | Quantitative flow between categories; widths encode magnitude | 3+ levels of nodes start to be unreadable; categorical flow without magnitude (use ArcDiagram) |
| **RouteAnimation** | ⚪ | Geographic movement along arcs (covered in [Spatial](#8-spatial)) | Non-geographic flow — use SankeyFlow |
| **ArcDiagram** | ⚪ | Intellectual lineage / citation chain / influence (Schelling → Hamilton → Axelrod → Hofstadter); nodes on a baseline with arcs above | Quantitative flow — use Sankey; relationships in a closed system — use NetworkDiagram |
| **NetworkDiagram** | ⚪ | Relationship structure among entities (hub-spoke, mesh); editorial-clean register | Lineage/chronology matters — use ArcDiagram |

**Editorial register notes:**

- **ArcDiagram is the channel's intellectual-lineage signature.** When the script names 4+ scholars in sequence ("Schelling, Hamilton, Trivers, Maynard Smith, Axelrod"), use ArcDiagram, not a bar chart of citation counts. The form does the editorial work.

---

## 10. Framework / argument

Parallax-specific category beyond FT VV — frameworks themselves are the visual. The chart IS the argument.

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **FrameworkDiagram** | ⚪ | Comparison / matrix / flow of analytical frameworks; 2-column comparison with protagonist; multi-cell matrix; sequential filter (narrowing) | Two competing frameworks with scoring — use DuelingFrameworks |
| **DuelingFrameworks** | ⚪ | Two named frameworks scored against the same phenomenon, with a verdict phase | Frameworks aren't being SCORED — use FrameworkDiagram (comparison variant) |
| **EscalationLadder** | ⚪ | Sequence with severity gradient (low → critical); each rung is a discrete event with a date | The sequence is logical/conditional (use FrameworkDiagram flow); no severity dimension |
| **DecisionTree** (5 variants — see below) | ⚪ | Branching choice structure; "if X then Y else Z" decision points | The decision is binary at one node (use FrameworkDiagram) |
| **OutcomePartition** | ⚪ | "The decision space narrows" — 2D field with named axes (e.g. US Resolve × PRC Escalation) recursively partitioned by editorial decisions; each terminal region is an outcome with severity-encoded fill | Sequential branching reasoning (use DecisionTree spine); flow/quantity (use SankeyFlow); time-series escalation (use EscalationLadder) |
| **GameBoard** | ⚪ | Payoff matrix; canonical 2×2 with TPRS labels (Prisoner's Dilemma, Stag Hunt) | Non-game-theory content (use FrameworkDiagram matrix) |
| **StrategicLandscape** | ⚪ | 2×2 quadrant positioning (sometimes Boston Matrix-style); axes named, entities placed | Continuous correlation (use ConnectedScatter); ordinal ranking (use BumpChart) |
| **SplitComposition** | ⚪ | Side-by-side two-pane visual ("PD on the left, Stag Hunt on the right") | Same form on both sides — use DuelingFrameworks |

**DecisionTree variant chooser** (pick by what editorial work the form does, not what the data looks like):

| Variant | When to pick | Visual signature |
|---|---|---|
| `extensive` (default) | Contingency / scenario branching with curved-edge typographic register; chess openings, game-theory branches, generic "what could happen" trees | Typography-only nodes, curved gold beziers, canvas with camera pan |
| `ladder` | "Decision-maker X weighed N options and picked this one" — Allison-style deliberation scenes (ExComm 1962, Politburo, boardroom) | Flat stack of option panels, left-rail ordinal numerals, accent left-bar + tint on highlighted option |
| `indented` | Script-density reasoning, policy taxonomies, branching outlines; tall narrow trees where horizontal branching wastes space | Manuscript outline; depth = horizontal indent; Plex Mono ordinals (1, 1.a, 1.a.i); right-aligned probability column when gated |
| `spine` | Sequential decision moments along a through-line; "the world forked here, then again there" — ≤3 levels deep, small lateral fans | Vertical ordinal spine on left; rung labels; discarded alternatives fan rightward as hairlines + leaf dots; non-highlighted fans dim to 35% |
| `schematic` | Engineering-drawing register; wargaming nomographs, contingency planning trees, technical "and-then-then" sequences | Thin-bordered node boxes with mono corner ordinals; orthogonal right-angle edges; same canvas-camera-pan as `extensive` |

**Editorial register notes:**

- **The 2×2 matrix is one of the channel's signature forms.** When the script frames any geopolitical question as "axis A × axis B," reach for FrameworkDiagram's matrix variant or StrategicLandscape.
- **Don't fake scoring.** DuelingFrameworks' scoring bars (0–100 per framework on a phenomenon) require an actual scoring rationale in the script. If the script doesn't justify the scoring, use FrameworkDiagram comparison instead — it doesn't pretend to quantify.

---

## 11. Forecast / probability

Parallax-specific category — the Honest Oracle posture requires explicit visual treatment of forecasts.

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **ProbabilityGauge** (variant: forecast) | ⚪ | Episode forecast with 6-layer calibration (probability + verbalTag + baseRate + keyDriver + keyDisconfirmer + benchmark + resolution); the channel's calibrated-forecast signature | Generic percentages — use KPICard |
| **BayesianUpdate** | ⚪ | Reasoning process is the argument (prior + evidence updates → posterior); "watch the reasoning, not just the result" | Result-only context — use ProbabilityGauge |

**Editorial register notes:**

- **Every episode-closing forecast must use the calibrated form.** The 6-layer ProbabilityGauge `forecast` variant ensures the prediction is registerable in `data/predictions-log.json` and falsifiable. See `episodes/EDITORIAL_PLAYBOOK.md` → Oracle doctrine.
- **BayesianUpdate is for reasoning-visible moments, not result moments.** Use when the script is showing HOW the prior updated, not just WHAT the posterior is.

---

## 12. Typography / text moments

Not "charts" but typography-as-visual. Used in dense sequences when no quantitative data is needed.

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **KineticTypography** | ⚪ | Quotes / definitions / 3-bullet checkpoints / hero statistic landings; the words ARE the visual | Image or chart could do the same work (let them) |
| **StatReveal** | ⚪ | Single dramatic number drop with brand-entry animation | Multiple stats — use DataChart or KPICard |
| **TitleTransition** | ⚪ | Episode title, section dividers, end card; structural punctuation | Mid-segment use (TitleTransition is structural, not analytical) |
| **AnnotatedImage** | ⚪ | Real photograph + brand-treated callouts; documentary evidence moment | Illustrative or generic — use Recraft constructivist illustration via BrandImage |
| **PhotoMontage** | ⚪ | Multiple photos sequenced with motion; historical archive feel | One strong image is enough — use AnnotatedImage |

**Editorial register notes:**

- **The textAnimation register applies here.** KineticTypography's 3 composite patterns (`quote-attribution`, `definition-reveal`, `stat-caption`) actually dispatch. The 8 atomic primitives (`word-cascade`, `tracking-in`, etc.) currently pass schema but don't dispatch — known gap, see `project/TEXT_ANIMATION_REGISTER.md`.
- **AnnotatedImage carries archival proof.** The Ostrom triptych (Valencia / Törbel / Maine) is the canonical pattern — real photos with callouts naming the principle they embody. See `episodes/prisoners-dilemma/CREDITS.md` for the CC BY-SA workflow.

---

## Editorial principles that apply to ALL charts

These are channel-wide, not chart-specific:

1. **Title states the finding, not the topic.**
   - ✅ "Theory outpaced evidence — three to one."
   - ❌ "Scholarly publications using PD framework"

2. **The single accent rule.** One element in the accent color (amber / oxblood); everything else in `palette.taupe` or muted. Don't color-rotate through every chart entity — the brand's editorial restraint *is* the brand.

3. **Annotations carry the argument.** A naked chart says "the data went up." An annotated chart with leader-line callouts ("Lehman fails / 2008", "policy change here") makes the argument. Always annotate before publishing.

4. **Direct labels beat legends.** When 2-3 series exist, place labels at the line's terminus or inside the bar. Reserve top-aligned legends for cases where direct labeling can't fit.

5. **Reference lines need terminal labels.** A dashed line with no label is a riddle. Always include `label` on `ReferenceLineSchema`.

6. **Sources at bottom-right, italic serif, small.** Never centered. Never bold. Wraps to max 700px or 45% of frame width.

7. **No 3D effects, no gradients, no drop shadows.** The Bauhaus / mid-century editorial register is the visual moat. Don't break it for novelty.

8. **No pie charts. No donut charts.** Bars and waterfalls beat angular comparisons every time.

9. **Y-axis must include zero (for bar charts).** Exception: line charts may use a non-zero baseline if the visible range is annotated clearly.

10. **Period of editorial restraint applies to all charts.** When in doubt: fewer entities, sharper accent, more annotation. The chart that survives a "what does this say in one sentence?" test is right.

## Parallax-specific anti-patterns

What NOT to do, even when the SOTA does it:

- **Don't use clickbait thumbnails.** Charts are in-video; thumbnails are separate. Don't import thumbnail-CTR optimization into chart design.
- **Don't fabricate quantitative data.** If a 2×2 matrix needs scoring axes but the data doesn't exist, use a qualitative framework (FrameworkDiagram) — not a fake-quantitative DuelingFrameworks.
- **Don't add interactivity.** Parallax is video. Static composition only.
- **Don't pour every chart through the same template variant.** If 5 segments in a row all use `DataChart` with `variant: bar`, the visual register collapses to "filler chart." Vary forms across an episode.
- **Don't reach for `frame.layout: "full-bleed"` when `hero-split` would do.** Full-bleed steals attention from the chart's argument. Reserve for the single hero chart per episode.
- **Don't use intelligence chrome on charts.** The REC pulse / FILED date register is for maps, atmospheric backdrops, archival reveals. Charts use publication chrome (`frame.chrome: "publication"`).

## Cross-reference index

| Topic | Where to look |
|---|---|
| Editorial system architecture | `EDITORIAL_FRAME_ARCHITECTURE.md` |
| How to migrate a chart to EditorialFrame | `CHART_MIGRATION_GUIDE.md` |
| Per-template schemas | `references/template-schemas.md` |
| Per-template editorial dossiers (NYT/FT/Economist references) | `references/template-research/<template-name>.md` |
| POLISH.md doctrine (D1-D21 cross-template rules) | `POLISH.md` |
| Brand spec (palette, type, timing) | `BRAND.md` |
| Map template selector | `MAP_TEMPLATE_SELECTOR.md` |
| Text animation register | `project/TEXT_ANIMATION_REGISTER.md` |
| Hold motion register | `project/HOLD_MOTION_REGISTER.md` |
| Visual language (three-register system) | `project/VISUAL_LANGUAGE.md` |

## The chart-chooser flowchart

```
Start: What argument is the visual making?

├── "X changed over time"
│   ├── Continuous, many points       → TimeSeriesChart
│   ├── Discrete steps (rates, tiers) → StepLine
│   ├── Before/after at 2 points      → Slopegraph
│   ├── Rank changes                  → BumpChart
│   └── Composition over time         → Streamgraph
│
├── "X is BIG / small"
│   ├── 3-10 named entities           → DataChart (bar)
│   ├── Target vs actual              → BulletChart
│   ├── Single hero number            → KPICard
│   └── Multi-axis profile            → RadarChart
│
├── "X is made of these parts"
│   ├── Sequential value capture      → PricingWaterfall
│   ├── Two-category stacked          → DataChart (comparison)
│   └── Cross-tabulation              → MarimekkoChart
│
├── "X varies with Y"
│   ├── Before/after, many entities   → Slopegraph
│   └── Path through 2D over time     → ConnectedScatterplot
│
├── "X is ranked here"
│   ├── Rank over time                → BumpChart
│   └── Before/after rank             → RankChangeDotPlot
│
├── "X happens here, not there"
│   ├── Editorial default             → AtlasPlate
│   ├── Country fills                 → ChoroplethMap
│   ├── Case-anchored                 → ProportionalSymbolMap
│   ├── Movement between points       → RouteAnimation
│   └── Population/GDP warp           → CartogramMap
│
├── "X moves from A to B"
│   ├── Quantitative flow             → SankeyFlow
│   ├── Geographic                    → RouteAnimation
│   └── Intellectual lineage          → ArcDiagram
│
├── "Framework / argument"
│   ├── Comparison                    → FrameworkDiagram (comparison)
│   ├── Matrix (2x2 +)                → FrameworkDiagram (matrix) / StrategicLandscape
│   ├── Filter / narrowing            → FrameworkDiagram (flow)
│   ├── Two frameworks scored         → DuelingFrameworks
│   ├── Sequence with severity        → EscalationLadder
│   └── Payoff matrix                 → GameBoard
│
├── "Chance of X is N%"
│   ├── Calibrated forecast           → ProbabilityGauge (forecast variant)
│   └── Reasoning visible             → BayesianUpdate
│
└── "Just text / typography"
    ├── Quote / definition / list     → KineticTypography
    ├── Single dramatic number        → StatReveal
    ├── Title / section / end card    → TitleTransition
    └── Photo + analytical callout    → AnnotatedImage
```

If the answer doesn't fit any branch, the visual probably isn't doing argumentative work — and the right answer might be no chart at all.
