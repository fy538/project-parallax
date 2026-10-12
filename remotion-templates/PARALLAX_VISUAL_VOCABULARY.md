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
| **ConceptEvolutionTimeline** | ⚪ | A single concept whose meaning shifts across historical moments — "Sovereignty in 1648 vs. 1919 vs. 1945 vs. 2005"; per-node definition panels show what the word meant at that moment; inter-node drift labels name what changed ("democratized," "conditioned"); Foucauldian genealogy as motion graphic | Multiple *different* concepts (use ArcDiagram or NetworkDiagram); continuous data (use TimeSeriesChart); no per-node definitional shift (use HorizontalTimeline) |
| **SpiralTimeline** | ⚪ | "History rhymes" arguments — recurring events on a NAMED cycle (Kondratieff 50y, Strauss-Howe 80y, financial panics 70y); events at the same angular position cluster across revolutions, making the rhyme visible; the editorial point is *recurrence*, not magnitude | Continuous data (use TimeSeriesChart); single cycle (use HorizontalTimeline); the cycle length isn't theoretically motivated (don't pick numbers to fit the data) |
| **SmallMultiples** | ⚪ | Grid of N synchronized mini line-charts (NYT / Economist / FT signature); "every great power on this dimension," "every election since 1980," "every empire's terminal decade" — the form for structural comparison across N cases; accent emphasis on the contrarian or focal case | Single entity (use TimeSeriesChart); N > 12 cells (illegible); no outlier or focal case (uninteresting argument); cells with different chart types (use individual compositions) |

**Editorial register notes:**

- **Annotations are the editorial work.** A naked TimeSeriesChart says "the data went up." An annotated TimeSeriesChart with event flags ("Lehman fails / Sept 2008") and era bands ("Recession") makes the argument. Always annotate before publishing.
- **Direct-label-at-line-end** (FT signature) is the default for multi-line charts — the legend lives at the line's terminus, not above the chart. Set `frame.legend: "direct-label"` if multiple lines exist.
- **The "model vs reality" template** is two lines where one is dashed (model) and one is solid with area fill (reality). See `chart-vol-smile.json` for the canonical example.
- **Counterfactual styling:** add `counterfactual: true` to any `TimeSeriesLine` to render it as a ghost projection (dashed 12/6, 45% opacity, no leading-edge dot, no glow). Optionally add `counterfactualZone: { fromX, toX, label }` to shade the divergence region. Every counterfactual line must name its condition in the label ("Without export controls," "Pre-2001 trajectory"). See `project/COUNTERFACTUAL_REGISTER.md`.

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
| **DivergingBar** | ⚪ | The SPLIT is the argument: trade surplus vs deficit, approve vs disapprove, allied vs opposed — bars extend from a shared center axis (positive right, negative left). The editorial form for opinion polling, net trade positions, and alliance alignment scores. `colorMode: split` (gold/china-red default) or `categorical` (per-entity alliance coloring). | When zero is not the editorial midpoint (use DataChart horizontal); more than 20 entities (crowded); when the sign of values is always the same (use DataChart) |

**Editorial register notes:**

- **Inline values vs floating labels.** When a bar's value is the headline (and value > 100 to avoid sparseness), render it INSIDE the bar at the right edge (Economist signature). For smaller values, float above. The DataChart `comparison` variant already does this when bars are wide enough.
- **Highlight discipline.** When you set `highlightIndex` on DataChart, the highlighted bar takes the accent; all others fall to neutral taupe. Don't try to color-code every bar — most arguments are "this one bar, vs the rest."
- **The hero stat trap.** Don't put a KPICard at a beat that should be carrying narrative momentum. KPICards STOP a video. Reserve them for arrival moments (Beat 5 forecast, segment closer).
- **Counterfactual bar styling:** add `counterfactual: true` to any `DataPoint` in `dataPoints[]` to render a ghost bar (dashed outline, transparent fill, 45% opacity). Works on `bar` and `horizontal` variants only. Name the bar's label to identify the hypothetical — don't reuse the actual entity's name. Don't combine with `highlightIndex` on the same chart (the two opacity hierarchies conflict). See `project/COUNTERFACTUAL_REGISTER.md`.

---

## 3. Part-to-whole

The thesis: "this total breaks down like this." The form makes the decomposition the argument.

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **PricingWaterfall** | 🟢 | Value-chain decomposition; "where does each dollar go"; vertical bar with smallest sliver (hero) in accent | Decomposition is about types of things (not sequential value capture) — use horizontal stacked bar or Marimekko |
| **DataChart** (variant: comparison) | 🟢 | Two-category stacked horizontal bar per row (theory + empirical per decade); both segments labeled inline | 3+ category split (use Marimekko or stacked area) |
| **MarimekkoChart** | ⚪ | Cross-tabulation of two part-to-whole splits (sector × region market share); the dual encoding is the argument | Either dimension dominates (use sorted bar); too few cells (use a 2×2 framework) |
| **Treemap** | ⚪ | Hierarchical part-to-whole — N items (2–40) with values rendered as proportional rectangles; "where does the money go" decompositions, budget breakdowns, portfolio allocations. Squarify algorithm maximises aspect ratios for legibility; accent `highlight: true` on the editorial protagonist tile | Temporal comparison needed (use Streamgraph or small multiples); ranking matters more than proportion (use sorted DataChart); more than 40 items (tiles become too small to read) |
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
| **DotPlot** | ⚪ | Named entities (countries, actors) as labeled dots along one continuous axis — "where countries fall on X." No zero-baseline; encodes relative position, not magnitude from zero. The Cleveland perceptually-superior alternative to bars when the argument is rank/position, not absolute size. Optional second position with arrow (change from A to B). `referenceLines` for threshold markers (NATO 2% target, sanctions ceiling). | Paired before/after comparison is the ENTIRE argument — use DumbbellPlot (two dots per entity, connection IS the editorial point); quantitative magnitude argument (bars are clearer); >40 entities (crowded) |
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
| **BubbleMatrix** | ⚪ | Four variables simultaneously: X axis, Y axis, bubble **area** (size, proportional — Gapminder standard), and color (group membership). The silicon-trap canonical: `x = military R&D`, `y = semiconductor capacity`, `size = wafer output`, `color = NATO membership`. Log scale on either axis for wide-range data. Optional `referenceLines` for threshold markers (NATO 2% target). `revealOrder: "by-group"` for categorical arguments. | Time-series (use ConnectedScatterplot — path through 2D space); no meaningful 4th variable (the size encoding is empty); >40 entities (overplotted — use BeeswarmChart instead) |
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
| **BarChartRace** | ⚪ | Animated rank race across time periods — bars animate both width (value) and vertical position (rank) continuously between periods. The kinetic form for "watch the rankings shift in real time" (FT/Burn-Murdoch GDP race, SIPRI defense spending). `topN` clips to the top-ranked bars at each frame; entity colors persist across periods. | Static comparison (use BumpChart or RankChangeDotPlot — the animation MUST be the argument, not decoration); fewer than 4 periods (not enough motion to justify the form); fewer than 5 entities (too sparse — use DataChart) |
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
| **CinematicMap** | ⚪ | **Terrain as the argument** — pitched moving camera, 200m–80km altitude, `terrain: true`. Mountain passes, straits, valley corridors. Also handles GlobeReveal pattern (planet cold-open → regional descent). Max 1–3 per episode. | Statistical or relational arguments — use AtlasPlate/RouteAnimation |
| **TerritoryMap** | ⚪ | **Who controlled what, and when** — animated territory fills crossing between actors over a sequence of timesteps; SVG timeline strip; crossfade (default) or `snap: true` hard-cut for rupture moments. `mode: "country"` for ISO 3166-1 alpha-3 codes; `mode: "subnational"` for custom GeoJSON. | Static political geography (use AtlasPlate or ChoroplethMap); single-point-in-time data |
| **FlowMap** | ⚪ | **Directional volume flows where magnitude is the argument** — arc width ∝ `sqrt(volume)`, particles show direction. `mode: "simultaneous"` for comparative; `mode: "stagger"` for sequential causation. Key distinction from RouteAnimation: equal-width arcs in RouteAnimation show the *path*; variable-width arcs in FlowMap show the *amount*. | Path-as-argument (use RouteAnimation); non-geographic flow (use SankeyFlow) |

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
| **OrgChart** | ⚪ | Directed authority tree: nuclear command chains (NCA → SecDef → STRATCOM), ORBAT, bureaucratic procurement, intelligence oversight. Typed nodes: `role` / `person` / `empty` (vacant post, dashed border) / `committee`. Typed edges: `solid` (formal authority) / `dashed` (advisory/bypassed) / `dotted` (informal). Sequential top-down reveal; `highlightChain` pulses the operational command path in gold. | Horizontal flow without hierarchy (use SankeyFlow); relationships without authority (use NetworkDiagram); branching decisions (use DecisionTree) |
| **ArcDiagram** | ⚪ | Intellectual lineage / citation chain / influence (Schelling → Hamilton → Axelrod → Hofstadter); nodes on a baseline with arcs above; equal node spacing | Quantitative flow — use Sankey; relationships in a closed system — use NetworkDiagram; nodes need year-precise placement — use PhilosophicalFamilyTree |
| **PhilosophicalFamilyTree** | ⚪ | Intellectual genealogy where the **calendar distance between thinkers** matters (von Neumann 1944 → Nash 1950 → Schelling 1960 → Axelrod 1980 → Ostrom 1990); nodes positioned proportionally by actual year value; typed influence edges: `borrowed` (solid gold) / `transformed` (solid dustblue) / `critique` (dashed rust) / `parallel` (dashed umber) | Equal-spacing is fine — use ArcDiagram (simpler); when the argument is ABOUT the influence TYPE — the typed edges are PhilosophicalFamilyTree's core contribution; use ArcDiagram when edge semantics don't matter |
| **NetworkDiagram** | ⚪ | Relationship structure among entities (hub-spoke, mesh); editorial-clean register | Lineage/chronology matters — use ArcDiagram or PhilosophicalFamilyTree |
| **SanctionsNetwork** | ⚪ | Specialized sanctions architecture: typed nodes (`sanctioner` / `target` / `relay` / `sector` / `institution`) connected by typed edges (`primary-sanction` / `secondary-threat` / `evasion-path` / `formal-exemption` / `intermediary`). Simultaneously encodes authority, third-country vulnerability, sector specificity, and evasion routes — the four dimensions that no single general-purpose template handles. Auto-layout positions sanctioners top, target center, relays bottom. Evasion paths with `animated: true` render as flowing particles (SVG strokeDashoffset). | General relationship maps (use NetworkDiagram — SanctionsNetwork's typed node/edge system is for sanctions SPECIFICALLY); quantitative flow (use SankeyFlow — SanctionsNetwork doesn't encode magnitudes) |

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
| **SplitComposition** | ⚪ | Side-by-side two-pane visual with text-pane lists ("PD on the left, Stag Hunt on the right") | Same form on both sides — use DuelingFrameworks; comparing two CHARTS or IMAGES — use ComparisonPair |
| **ComparisonPair** | ⚪ | Two registered templates rendered side-by-side at 50/50 with synchronized timing — "$17B (1914) ↔ $886B (2024)", "Athens NetworkDiagram ↔ Sparta NetworkDiagram", "Theory FrameworkDiagram ↔ Reality TimeSeriesChart". Embeds any of 10 splittable templates per side via discriminated union (DataChart, TimeSeriesChart, StatReveal, KPICard, BumpChart, BulletChart, ProbabilityGauge, AnnotatedImage, FrameworkDiagram, KineticTypography). | Sequential comparison (use transitions); one form serves the argument alone (use that form); map templates (use a dedicated dual-map template — Mapbox doubling is excluded by design); recursive embedding |
| **SplitFrame** | 🟢 | Generalized side-by-side composition primitive — renders ANY two registered templates as panes. Replaces all hand-built per-pair split layouts. Left and right can be DIFFERENT template types (Syllogism vs DialecticFlow, TelegramCable vs StatReveal). Supports variable ratio (default 50/50), gold divider + label badge, corner era labels ("1914" / "2024"), and two sync strategies: `simultaneous` (both panes animate in together) and `sequential` (left plays first, then right). ~60 templates in PANE_COMPONENTS. | Recursive SplitFrames (not supported); TitleTransition or MorphTransition as panes (not content templates); text-list content only — use SplitComposition for prose-pane arguments; when only 10 templates are needed and a discriminated-union schema matters — use ComparisonPair |
| **CausalLoopDiagram** | ⚪ | Systems-thinking feedback loops — security dilemmas, arms races, sanctions spirals, escalation dynamics; the editorial argument is "this isn't a sequence, it's a loop"; polarised arrows (+/−) and Reinforcing/Balancing loop badges encode the systems claim | Linear chain (use FrameworkDiagram flow); magnitude argument (CLD encodes direction only — pair with TimeSeriesChart for magnitudes); single-node "diagram" |

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
| **ScrollyReveal** | ⚪ | Progressive annotation of a fixed image — the video equivalent of NYT/Reuters "scrollytelling." A base image stays fixed while callouts appear step-by-step over 3–6 narrative beats; each step can also pan/zoom the image to a focus region. `annotationMode: "accumulate"` (default) for cumulative arguments; `"replace"` when each beat stands alone. Key distinction from AnnotatedImage: steps span seconds (not tenths), the focus pan/zoom IS the motion (no Ken Burns drift), and the reveal order is the argument structure. | Small annotation count (≤2 steps — use AnnotatedImage); non-image base (use a map or diagram template); >8 steps (split into two ScrollyReveal segments) |
| **AnnotatedZoom** | ⚪ | Pure directional zoom on a 2D image or map: "look here, then here, then here." Each region has a `centerX/centerY/scale` — the CSS transform IS the argument. Reuses `computeFocusTransform()` from ScrollyReveal. No annotation callouts; the framing is the rhetoric. Optional `showCrosshair` (thin gold hairlines at the focal point) and `label` (dark pill at bottom). Documentary director's "pull to region" move. | Annotation callouts needed at each focal point — use ScrollyReveal; geographic overlay data — use a map template; zoom is decorative not editorial (Ken Burns drift is built into every template — use that) |
| **PhotoMontage** | ⚪ | Multiple photos sequenced with motion; historical archive feel | One strong image is enough — use AnnotatedImage |
| **PrimarySourceReveal** | ⚪ | The "reading-the-text-closely" form — a treaty clause / speech / cable / cable with timed analytical annotations (underline, circle, highlight, strike, margin-note, translate, numbered footnote); academic-documentary register that distinguishes Parallax from explainer channels | Paraphrasing instead of quoting (use KineticTypography quote); document is >400 words (cut to the load-bearing passage); contemporary social media text (use KineticTypography quote-attribution) |

**Editorial register notes:**

- **The textAnimation register applies here.** KineticTypography's 3 composite patterns (`quote-attribution`, `definition-reveal`, `stat-caption`) actually dispatch. The 8 atomic primitives (`word-cascade`, `tracking-in`, etc.) currently pass schema but don't dispatch — known gap, see `project/TEXT_ANIMATION_REGISTER.md`.
- **ScrollyReveal vs AnnotatedImage:** ScrollyReveal when the *order of revelation* IS the editorial argument and each step needs breathing room (3-5s). AnnotatedImage when all callouts serve the same point simultaneously and can land in tight stagger (0.3-0.5s each).
- **AnnotatedImage carries archival proof.** The Ostrom triptych (Valencia / Törbel / Maine) is the canonical pattern — real photos with callouts naming the principle they embody. See `episodes/prisoners-dilemma/CREDITS.md` for the CC BY-SA workflow.

---

## 13. Documentary archival

The texture of historical evidence. Each template makes the same editorial claim — *"this is a real artifact from a real archive"* — but for a different document register. Reach for these when the editorial weight comes from the document being a primary source, not from its content alone. Distinct from § 12 (typography moments) because the form IS the document, not a typographic flourish.

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **HandwrittenLetter** | ⚪ | Personal/formal correspondence visualised as the actual artifact — Burns Sullivan Ballou idiom (photograph + Ken Burns + paragraph fade-ins) when an archival image exists; typeset script (Caveat) as fallback when it doesn't. Salutation/signature/dateline as evidentiary metadata. | Diplomatic cables (use TelegramCable — different register); modern social-media text; document text > 4 paragraphs (cut to the load-bearing passage); no archival source available (use a KineticTypography quote instead) |
| **NewspaperHeadlineRotator** | ⚪ | "The world saw it this way" — 3-5 period newspaper front pages making the same point in sequence; compounding evidence across outlets is the editorial argument. Real scanned mastheads (LOC, Wikimedia, newspapers.com) required. | Typeset mastheads ("NYT" set in IBM Plex looks fake — period typography is hard to fake); single headline (use KineticTypography); >6 pages (reads as montage — use PhotoMontage); headlines that don't make the same point (defeats the compounding-evidence argument) |
| **ArchivalReel** | ⚪ | Period footage register applied to a still — 8mm (1965-90 home movie), 16mm (1923+ newsreel/documentary), VHS (1976-95 consumer video). The medium dates the image without a chyron. | Era mismatch (8mm grain on 1990s photo, VHS on 1950s photo — anachronism); modern photo with no period claim (the treatment IS a claim); intensity 1.0 on native archive footage (Apollo 11 doctrine — set `nativeFootage: true`); diagrams/charts (wrong substrate) |
| **TelegramCable** | ⚪ | Diplomatic / military cable register with full bureaucratic chrome — header (FROM/TO/SUBJECT/DTG/file-number), classification rubber stamps, DECLASSIFIED overstamp, ALL-CAPS typewriter body, numbered paragraphs, redactions with FOIA exemption codes. Zimmermann Telegram, Long Telegram, ExComm cables, Wikileaks releases. | Formal document text — treaty articles, speeches, court opinions (use PrimarySourceReveal — different register); personal correspondence (use HandwrittenLetter); modern social-media text; faked redactions for drama (dishonest — only redact what the historical document actually had redacted) |

**Editorial register notes:**

- **The form's authority comes from authentication, not invention.** Every template in this family relies on the viewer's unconscious parsing of "this is real evidence." Faked mastheads, anachronistic film stock, faked redactions, or made-up file numbers destroy the authority faster than they help.
- **Source citation is non-negotiable.** Every template in this family REQUIRES `data.source` populated with the actual archive citation (LOC call number, FRUS volume, NSA Archive item ID, etc.). The source attribution chrome is the editorial signature that distinguishes a documentary register from an explainer.
- **Use rarely.** Documentary archival templates are HIGH-impact, low-frequency. 1-2 uses per episode max — they're the form for the moment where you ARE introducing a primary source. Using them for content that doesn't actually involve a document dilutes the register.
- **Apollo 11 doctrine** — when applying ArchivalReel to native archive footage, set `nativeFootage: true` so treatment intensity drops by ~60%. Real archive already has its own grain; piling more on produces the Instagram-filter look.

---

## 14. Argument primitives

The formal structures of philosophical argument made visible. Uniquely Parallax — no other geopolitics channel has visual treatments for these forms, and the brand mark (∴) is literally a logical operator. The family makes the channel's analytical method auditable: viewers can SEE the deductive structure, name the premises, and dispute the axioms.

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **Syllogism** | ⚪ | Formal deductive argument — major premise / minor premise / ∴ conclusion. The brand mark IS the editorial pivot. Reach for it when the argument's structural validity is the point (audit-able deduction). Use `validity: "fallacy"` mode + struck-through ∴ + named fallacy type ("Affirming the consequent") to expose flaws in someone else's reasoning. | Three statements that aren't actually syllogistic (use AxiomList for unrelated foundational claims); paraphrased premises (the form requires verbatim or near-verbatim quotes from the original argument); arguments that don't actually fail when you analyze them (don't use fallacy mode for arguments merely disliked) |
| **AxiomList** | ⚪ | Numbered foundational claims — "here are the four assumptions this analysis rests on." Used at the start of long analyses to lay groundwork OR as a structural recap of a worldview's pillars. Emphasis tiers: `"key"` (max 1, accent left-rail), `"disputed"` (struck-through in china-red), `"normal"`. Numbering: arabic / roman / lower-roman / Wittgensteinian decimal. | More than 7 axioms (reads as survey, not axiom system); non-foundational claims (reserve for true foundations); uncontroversial axioms ("the sky is blue" isn't worth listing — the form requires contestable claims) |
| **DialecticFlow** | ⚪ | Hegelian thesis → antithesis → synthesis. Three-panel triangle layout showing how an apparent contradiction resolves at a higher level. The signature form of Hegelian / Marxian / Adorno-style philosophy. Synthesis must TRANSCEND, not merely AVERAGE T and A. | Non-dialectical pairs (use ComparisonPair for general comparison); synthesis that's just a compromise (defeats the form's editorial point); permanent aporia framed as resolution (use the Adorno aporia variant when contradiction is irresolvable) |
| **ConditionalArgument** | ⚪ | IF / THEN binary branching — "If China invades Taiwan → credibility test. If China blockades → deterrence test." The scenario-forecasting primitive with explicit severity tiers (low/medium/high/critical) per branch. Forces analytical discipline: name the condition, both consequences, AND the determinant (what tips the balance). | Non-binary scenarios (use DecisionTree for N-way); no determinant named (the form's discipline depends on it); both branches "critical" (destroys severity hierarchy — at most one branch is critical) |
| **CounterfactualPath** | ⚪ | "The road not taken" — horizontal timeline with actual historical path + 1-2 dashed counterfactual branches diverging at a named decision point (e.g., OCT 1962 / Cuban Missile Crisis). Disciplined counterfactual reasoning per Ferguson / Hawthorn — each branch gets a `plausibility` annotation. | Implausible counterfactuals (Hawthorn test fails — "what if Hitler had a change of heart?"); more than 2 counterfactuals (diagram becomes a tangle — cap at 2); vague branching point ("the early 60s" isn't a moment); identical outcomes across branches (defeats the form) |
| **AnalogyCrossmap** | ⚪ | Structural mapping between two domains in a bounded analogy — the core Parallax editorial move. Two-column layout: source domain (left) ↔ target domain (right) connected by cubic Bezier paths. `strength: "strong"` = solid gold (analogy holds); `strength: "weak"` = dashed umber (partial); `strength: "break"` = taupe dashed 12/6 at 45% opacity (COUNTERFACTUAL REGISTER — where the analogy fails). The editorial revelation moment is when break paths appear + `breakNote` names exactly what fails. Catalog: Prisoner's Dilemma ↔ Nuclear Deterrence; Franchise ↔ Imperial patron-client. | Non-analogical comparisons (use ComparisonPair for side-by-side contrasts); analogies with no structural mapping at all (use DialecticFlow for dialectical pairs); more than 6 elements per domain (becomes unreadable); omitting `breakNote` when break mappings exist (defeats the "bounded analogy" form — name the limit) |
| **ToulminMap** | ⚪ | Toulmin's 6-element argument structure (Toulmin 1958). Horizontal flow: Data → Warrant → Claim. Subordinate elements: Backing below Warrant (dashed umber border), Qualifier below Claim (dashed umber border), Rebuttal branching from Claim (dashed china-red at 45% opacity — COUNTERFACTUAL REGISTER). **The WARRANT is the editorial focal point** — making the unstated logical bridge explicit is the form's core contribution. Sequential reveal builds the argument step by step; `claim.emphasis: true` highlights the editorial thesis in gold. | Arguments where the warrant is obvious (the form's power comes from *revealing* an obscure or contested warrant — don't use when the bridge is self-evident); evidence-only slides with no logical inference (use StatReveal); chains of more than 2 inferences (Toulmin is one argument move, not a flow chart) |

**Editorial register notes:**

- **The brand mark (∴) does load-bearing work in this family.** It's the pivot in Syllogism, the pivot in ConditionalArgument, the implicit logic across all five. The channel's brand glyph isn't decoration — it's a vocabulary element.
- **All seven templates are high-impact / low-frequency.** Each makes a STRONG philosophical claim about argument structure (deduction is binding, axioms are foundational, dialectic resolves contradictions, branches are bifurcations, history could have gone differently, analogies have structural limits, warrants are hidden). Overuse trivialises the claims.
- **The form IS the editorial discipline.** Counterfactual reasoning sloppy without `plausibility` annotations. Conditional reasoning sloppy without `determinant` field. Syllogism sloppy without verbatim premises. AnalogyCrossmap sloppy without `breakNote` when break mappings exist. ToulminMap sloppy when warrant is self-evident. The schemas reflect the disciplines.
- **Visual register: ornamental + slow.** All seven use serif body fonts, ornamental ordinals, slow reveal stagger. Argument primitives are the contemplative-pace forms — they hold the screen and ask the viewer to follow the logic.
- **Don't confuse them with each other.** Syllogism (deduction) ≠ AxiomList (foundations) ≠ DialecticFlow (contradiction resolution) ≠ ConditionalArgument (forward bifurcation) ≠ CounterfactualPath (backward bifurcation) ≠ AnalogyCrossmap (structural mapping + limits) ≠ ToulminMap (warrant anatomy). The dossiers spell out the distinctions explicitly because confusion is the most common authoring failure.

---

## 15. Motion primitives

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **MorphTransition** | ⚪ | Animated state-change between two data states of the SAME embedded template — bars rearrange, lines reroute, values count. The NYT/Bloomberg "watch the rankings shift" / "election-night updates" / "before-and-after policy change" motion primitive. Supports DataChart, TimeSeriesChart, StatReveal in v1. The visual structure of CHANGE made kinetic. | Both states visible side-by-side at rest (use ComparisonPair); items that don't match across FROM and TO (reads as random churn); tiny value differences (invisible at video resolution); morph > 5s (viewer attention drops); different template types (use ComparisonPair — schema enforces from.template === to.template) |

**Editorial register notes:**

- **MorphTransition vs ComparisonPair**: same data, different editorial register. MorphTransition is "watch the change happen"; ComparisonPair is "see both states at once." Pick MorphTransition when the MOTION is the editorial argument; ComparisonPair when the AT-REST contrast is.
- **Timing matters.** Default `holdFromSec: 2-3 / morphSec: 3-4 / holdToSec: 3-4` (total ~10s). Hold-from too short and viewers don't read the starting state; morph too fast and they don't process the change; hold-to too short and they don't absorb the ending. The pacing IS the editorial discipline.
- **Use rarely.** Morph is kinetic and high-impact. 1-2 per episode max — otherwise the viewer gets motion-fatigued and the form loses weight.
- **The match-by-key rule.** Bars in DataChart morph by matching `label`; lines in TimeSeriesChart match by `label`; points within a line match by `x`. If your FROM and TO use different keys for the same entity ("USA" vs "United States"), the morph drops the entity and re-creates it — visually broken. Normalize keys.
- **Apollo-doctrine equivalent for morph**: when the data has BIG changes (rank flips, items added/removed, large value swings), the morph reads as transformative; when changes are small (5% value shifts, same rankings), the morph reads as fidgeting. Reserve morph for big changes; use ComparisonPair for small ones.

---

## 16. Overlap / connection

Multi-entity relationship forms — when the argument is about what things share, how they connect, or how intensely they interact. Each form has a specific structural claim; picking the wrong one misrepresents the editorial argument.

| Template | Status | When to pick | Avoid when |
|---|---|---|---|
| **VennDiagram** | ⚪ | Set overlap — entities that share membership categories (EU ∩ NATO, alliances ∩ sanctions, colonial-era blocs ∩ contemporary coalitions); the editorial claim is WHICH members belong to WHICH combination; 2–3 sets. | More than 3 sets (intersections become combinatorially unreadable); the argument is about quantity per set (use DataChart); the overlap IS the only story — if no entity belongs to multiple sets, there's no Venn to draw |
| **ChordDiagram** | ⚪ | Bilateral flows between 3–12 entities (G7 trade flows, UN vote-coincidence, arms transfers) where direction and magnitude both matter; inner arc width encodes total flow, chord width encodes bilateral magnitude; emphasis on the LARGEST chord draws the eye to the dominant relationship | Simple directed flow from source to destination (use SankeyFlow); geographic routing of flows (use RouteAnimation); the entities have a natural order (use matrix or sorted bar) |
| **MatrixHeatmap** | ⚪ | N×M cross-tabulation where cell intensity is the argument (alliance reliability scores, treaty-compliance grids, tariff schedules, vote-coincidence matrices); color scale encodes the value; `highlightRow`/`highlightCol` pulls editorial focus to one axis | Only one dimension of comparison (use DataChart or DumbbellPlot); cells need exact values to be readable at video resolution — trust the color only for large, grid-scale patterns; N > 20 rows or M > 12 cols (cells become too small) |

**Editorial register notes:**

- **VennDiagram is for categorical membership, not quantitative overlap.** The circles encode identity (is X a member or not?), not magnitude. If the argument is "France contributes 3% of NATO budget," use DataChart — VennDiagram only tells you France is IN NATO.
- **ChordDiagram's power is its symmetry.** Each bilateral relationship appears once (France → Germany = Germany → France at rest; use `bidirectional: true`). It beats adjacency matrices for communicating dominance of a few relationships at a glance — the viewer's eye follows the widest chord.
- **MatrixHeatmap requires anchor labels.** Without `highlightRow` or `highlightCol` pulling the viewer's attention, a full N×M matrix reads as wallpaper. Pick one row or column to highlight (e.g., "how does the US score on every dimension" by highlighting the US column).
- **All three are structural snapshots, not time-series.** For change over time in any of these forms, repeat the template with `MorphTransition` (morph between two MatrixHeatmap states) or a small-multiples approach.

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
