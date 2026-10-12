# SmallMultiples — Research Dossier

> Created May 19, 2026. Grid of N synchronized cells — the NYT / Economist /
> FT signature for structural-comparison-across-N-entities arguments.

## 1. The form's editorial purpose

Small multiples (Tufte's coinage from *Envisioning Information*, 1990) shows the same chart type applied to N different entities in a grid with shared axes. The argument is *"all of these follow the same structural pattern — and look at this one that doesn't."* Reach for it when the editorial point is comparative across multiple cases, particularly when there's an outlier whose deviation IS the argument. For Parallax this is the workhorse form for "every great power on this dimension" / "every election since" / "every empire's terminal decade" — comparison-at-a-glance that's central to how historical-analogy reasoning works (the analogy holds if the cases share structure; the analogy is bounded by the cases that don't). Edward Tufte calls it the "highest-information-density" chart form per unit of cognitive load.

## 2. Canonical idioms

**Tufte mini-line grid.**
N cells in an M×K grid; each cell is a tiny line chart with shared x and y axes; cell titles at top; one or two cells emphasised by accent colour or weight; minimal chrome (hairline frames, sparse ticks, no inner gridlines). Used extensively by Edward Tufte's books and modern editorial outlets that have absorbed his teaching. The NYT Upshot's *"Election results in every state"* (2020) is canonical. Why it works: identical encoding across cells lets the eye spot anomalies in O(1) cognitive time; shared axes preserve magnitude comparability.
Failure mode: outlier with extreme value compresses the shared y-axis, hiding variation in the other cells. Often resolved with `sharedY: false` or by removing the outlier to a separate panel.

**Economist faceted bar charts.**
Same form as the line grid but with bar charts in each cell — used for categorical-x comparisons (regions × years, parties × decades). Often paired with a "delta from baseline" reference line. Reference: Economist *"How left-right axes shifted in every major democracy"* (2024). Same logic, different cell content.
Failure mode: bars at small cell scale don't read magnitude well; use sparkline-style bars (thin, no value labels) and let the shape carry the argument.

**FT "small-multiples-with-narrative-cells" hybrid.**
A grid where one cell (typically the focal case) is enlarged and annotated extensively, while the surrounding cells are smaller and minimally annotated — the hub-and-spoke variant of small multiples. Used by FT when the story is "this country, in the context of N others." Reference: FT *"Germany's Zeitenwende in context"* (2022).
Failure mode: the visual hierarchy makes the surrounding cells feel decorative rather than analytical; can degrade to "real chart + chart-of-charts thumbnails."

**Pudding-style scrollytelling small-multiples.**
The same N-cell grid revealed progressively as the reader scrolls, with the focal cell rotating through the N as the narrative progresses. Used by The Pudding for long-form data-driven essays. Not directly applicable to fixed-duration video, but inspires the "cell-by-cell narrated reveal" variant which IS applicable: each cell highlights and is narrated, then settles into the grid.
Failure mode: in video form, sequential cell-by-cell narration is slow; better to show all cells simultaneously and let the narration point to specific cells via voice direction.

## 3. General principles

Small multiples leverages **shape perception** at the highest tier of Cleveland's hierarchy (position-along-a-common-scale). When the y-axes are shared across cells, the eye reads each cell as a glyph and recognises pattern similarity / difference perceptually, faster than label-reading. This is why small multiples work: the human visual system is built for parallel pattern-matching across small repeated frames.

Munzner's "how" question is answered by SUPERIMPOSITION (cells share axes) + JUXTAPOSITION (cells sit side-by-side, easy to scan together). This combination is rare among chart types — most charts pick one or the other.

The single most important design decision is **shared vs unshared axes**:
- **Shared y-axis** (default): "compare magnitudes directly." Use when magnitudes vary similarly across cells.
- **Unshared y-axis**: "compare shapes regardless of magnitude." Use when you want to argue structural similarity despite scale differences. (A country whose military spending grew from $1B to $5B and a country that grew from $100B to $500B both show "5× growth" — same shape, very different absolute numbers.)

Tufte's data-density rule applies aggressively: small multiples is the highest-data-density chart form by design, so every cell should carry analytical weight. Don't pad with cells that don't change the argument.

## 4. Recommendation for Parallax

Default to the **Tufte mini-line grid** with selective accent emphasis:
- 2×3 or 3×2 grid for 6 cells (the most common case)
- 2×4 / 4×2 for 8 cells (Parallax's V-Dem-style 8-country comparisons)
- Shared y-axis by default (magnitude-comparable argument)
- Hairline cell frames (sand colour at low opacity)
- 3 y-axis ticks per cell (sparse — small multiples want minimal chrome)
- First and last x-axis values shown per cell (mono small, walnut)
- Cell titles in IBM Plex Sans medium, accent cells in semibold gold
- Accent line: 2× weight + full opacity (the focal case should READ as the focal case)
- Optional `highlight` points with mono labels (e.g., "Iraq/Afghan peak", "Lula returns") for the inflection-year argument within a cell
- Optional `badge` in top-right (e.g., "−51%") for terminal-value summary
- Optional `referenceY` line drawn across every cell (y=0 for difference plots, y=50 for democracy-index midpoint)

Reveal sequence: titles fade in staggered (~60ms apart), then all lines draw simultaneously over ~1.6s. The synchronization of line draws IS the argument — they're comparable patterns unfolding at the same moment.

## 5. Current template alignment

`SmallMultiples` ships with the recommended idiom. Auto-derives grid dimensions when `grid` is unset. `sharedY`/`sharedX` toggles available (both default true). `accent: true` makes a cell the focal case (gold colour, 2× line weight, semibold title). `highlight` adds a single annotated point per cell. `badge` adds top-right terminal-value text. `referenceY` draws a horizontal reference line across every cell.

Diverges from the canon only by limiting cells to LINE charts (no bar / scatter / etc. variants). This is intentional — Parallax's most common comparison is over time, so line-multiples cover the dominant case. Bar-multiples and scatter-multiples can be added when an episode genuinely needs them.

## 6. Specific upgrades proposed

1. **Outlier-aware y-axis** (medium effort, high impact) — when one cell's max is >3× the median cell's max, the shared y-axis compresses other cells. Add a `yScaleStrategy: "shared" | "shared-clipped" | "per-cell"` where `shared-clipped` clips the outlier's display and shows a "broken axis" indicator. NYT and Economist use this pattern routinely.
2. **Bar-chart cell variant** (medium effort, medium impact) — add `cells[].chartType: "line" | "bar"` so a Marimekko-style argument can be done as small multiples.
3. **Per-cell narrative annotation** (low effort, medium impact) — currently `highlight` supports ONE annotated point per cell. Add `cells[].annotations: [{x, label}]` for multiple inline annotations.
4. **Sparkline overlap mode** (high effort, low impact) — render ALL cells overlaid on a single grid with semi-transparent lines, plus the accent line in full opacity. Used by The Economist's "all countries on one axis with one highlighted" charts. Different form really — probably belongs in its own template (`SuperimposedSparklines`).
5. **Grid-level summary statistic** (low effort, low impact) — small text below the grid like "All 6 declined; only Russia rose." Could be `data.subtitle` already, but a dedicated `summary` field that takes a one-sentence footnote position would be cleaner.

## 7. Failure mode flags

- **Single cell** ("just show one chart") → use `TimeSeriesChart` or `DataChart`; small multiples requires N ≥ 2 and is most effective at N ≥ 4.
- **Too many cells** (N > 12) → cells become unreadable thumbnails; either filter to the focal subset OR break into multiple shots (with a transition like "and here are the next 8...").
- **No outlier / no focal case** → if all cells follow the same pattern with no exception, the argument is uninteresting; the form's editorial power comes from comparison-with-difference. Either find the outlier or use a different form.
- **Shared y-axis dominated by one outlier** (e.g., Russia's 12% military spending in 1990) → as noted above, compresses other cells. Solutions: (a) `sharedY: false` to let each cell auto-scale, (b) remove the outlier to a separate annotated panel, (c) use `shared-clipped` (TODO).
- **Heterogeneous chart types per cell** ("some bars, some lines") → fundamentally not small multiples — that's a dashboard. Use individual chart compositions or a `Dashboard` template (doesn't exist; build when needed).
- **Cells without consistent x-axis** (different time ranges per country) → defeats the "side-by-side comparison" argument. Either truncate to the shared range, or use `sharedX: false` and explicitly flag in the title that cells are on different time scales.
