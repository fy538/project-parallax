# DumbbellPlot (Range / Connected-Dot Plot) — Research Dossier

> Created: May 14, 2026. The canonical Cleveland-derived form for *"ranges across categories"* — for each row, two dots connected by a thick line. Sister of `RankChangeDotPlot` (rank deltas) and the lollipop variant of `DataChart` (single dot per row). Read before polish or extension work.

## 1. The form's editorial purpose

Reach for a dumbbell when the analytical claim is *"the **spread** is the story."* The bar chart answers "how big"; the line chart answers "how it moved"; the dumbbell answers "how **wide**" — the gap between two named endpoints (10th/90th percentile, before/after, min/max, women/men) across a list of categories. Position along a common scale ranks the categories, and the **length and placement of each connector** encode inequality, dispersion, or change without forcing the viewer to mentally subtract two bars. When the narrator says *"in Denmark the spread is narrow, in the US it's a chasm,"* this is the form.

## 2. Canonical idioms

### a. Inequality dumbbell (10th–90th percentile by country)
- **The Economist**, "How wide is the gap?" (Daily Chart, 2018) — OECD income deciles across rich economies, sorted by gap width, US row anchored at the extreme.
- **Financial Times**, gender pay-gap dumbbells (2019–2023, recurring) — women's median vs. men's median by sector, single rust connector per row.

*Works because:* the eye reads "how far apart are the two dots" before it reads the axis — the editorial point is delivered pre-cognitively. *Fails when:* the axis is log-scaled (the visual length stops corresponding to the verbal claim of "wide").

### b. Before / after policy or shock dumbbell
- **NYT Upshot**, "How Tax Bills Affect Each State" (Dec 2017) — pre- vs. post-TCJA effective rate per income bracket per state, accent dot = "after."
- **Reuters Graphics**, COVID life-expectancy retreat (2022) — 2019 vs. 2021 life expectancy by country; the rare case where the "after" dot sits *left* of the "before" dot, which is exactly the editorial shock.

*Works because:* the connector reads as a vector — the eye chases it from old to new without any animation needed. *Fails when:* the two dots are too close to distinguish (use a sorted bar of the *delta* instead).

### c. Min–max range dumbbell (forecast bands, salary bands, polling spreads)
- **The Washington Post**, "How much do CEOs make compared with workers?" (2018, recurring) — CEO-to-worker pay multiples with min/max across S&P 500 sectors.
- **FiveThirtyEight**, election polling spreads — candidate floor/ceiling across pollsters per state, ordered by midpoint.

*Works because:* the dumbbell makes "uncertainty width" the visual primary, not the point estimate. *Fails when:* the audience expects a probability distribution and reads the bar as flat-uniform; add a midpoint tick or reference line if the middle of the range is non-trivially informative.

### d. Ranked dumbbell with reference rule
- **Bloomberg**, gender employment gaps with OECD-average reference rule (2021) — a vertical dashed line at the cross-country mean lets every row read as "above/below average" at a glance.

*Works because:* the reference line converts a list of ranges into a per-row binary verdict without adding a second variable. *Fails when:* the reference is contested (a national average across very different denominators reads as editorializing).

## 3. General principles

Cleveland & McGill (1984) put **position along a common scale** at the top of the perceptual hierarchy; the dumbbell exploits that twice per row — once for each endpoint — and adds a connector whose **length** (also high in the hierarchy) encodes the spread directly. Stephen Few's *Now You See It* (2009) treats the dumbbell as the canonical answer to "I have two values per category and care about their gap"; Tufte's data-ink test favors it over paired bars because the line *is* the data (the gap) rather than redundant fill. Kieran Healy's *Data Visualization* (2018) recommends sorting by gap when the gap is the editorial point, by one endpoint when ranking on that endpoint is. d3, ggplot's `geom_segment + geom_point`, Plotly, and Datawrapper all expose dumbbells as primitives — meaning the form is durable enough to be a library default, which is the strongest signal a chart type can carry.

The weakness is structural: a dumbbell shows **two points per row** and nothing about the **middle of the distribution**. A bimodal distribution and a uniform one look identical. If the shape between the endpoints matters, reach for a strip plot, ridgeline, or boxplot instead.

## 4. Recommendation for Parallax

**Default form:** horizontal dumbbells, **sorted by range descending** (the widest gap is the lede), one to three rows highlighted in **amber `#E5A544`** with **rust `#C23B22`** reserved for the second hero in before/after pairings. Low dot small (r=6) and muted **bone over walnut stroke**; high dot large (r=10) and accent-filled. Connector at **stroke-width 4.5** (5–6 for highlighted rows), `strokeLinecap="round"`, drawn left-to-right via `strokeDashoffset` so the eye chases the spread on entrance.

**Typography:** category labels in **IBM Plex Sans** right-aligned in the left gutter; numeric annotations in **JetBrains Mono** flanking each dot; axis caption in **IBM Plex Mono** uppercase tracked +1.5. Currency formatted with K/M/B suffixes — at scrubbing speed `$142K` reads, `$142,000` does not.

**Chrome:** single thin baseline at the axis, 3–5 nice ticks with faint gridlines at ~18% opacity, no card or panel border. Reference line (when present) rendered as a dashed walnut rule with a tracked uppercase caption above the chart top — never inside the data band.

**Scrub tolerance:** at 8–12s per composition the viewer needs to grasp the ordering and the widest gap in ~2s. That means (a) sort by range by default, (b) keep ≤10 rows, (c) keep low/high color contrast non-negotiable.

## 5. Current template alignment

The existing `DumbbellPlot` matches the canon closely. Sort defaults to `range` (widest first — correct lede). Low dot is small/bone-fill with walnut stroke; high dot is large/accent — the asymmetric pair that reads as "anchor → target" rather than "two equivalent points." Connector animates via `strokeDashoffset` left-to-right (left→right entrance reinforces "low → high" semantically). Highlight emphasis is implemented as a per-row `highlight` boolean that boosts dot radii, line stroke, label weight, and adds a soft `drop-shadow` glow; un-highlighted rows fall to 55% row-opacity when any sibling is highlighted — the hero hierarchy already in `DataChart`. Currency formatter with K/M/B suffixes is wired. The `warnIf` guards (>14 rows, <3 rows, `high < low`) catch the three obvious authoring footguns.

Divergences from canon, intentional and otherwise:

- **Intentional:** legend in upper-right (most outlets put it inline with the title; ours uses the brand `FooterStrip` for the unit instead, so the inline legend is a quick low/high glyph key).
- **Intentional:** value annotations flank *each* dot rather than only the high one — at narration scrubbing speed we cannot rely on tick reading.
- **Accidental:** no midpoint tick or median dot option, so distributions that are bimodal or skewed look identical to uniform ones (see §3). No `valueLabel` suppression option when annotations collide on narrow ranges.
- **Accidental:** sort `"label"` is alphabetical only and unaware of locale ordering / pinned hero rows (US-pinned-at-top is a common Economist move).

## 6. Specific upgrades proposed

1. **Midpoint or median tick (low effort, high signal).** Optional `item.mid?: number` rendered as a thin perpendicular tick across the connector. Converts the form from "two-point summary" to "three-point summary" and defuses the §3 bimodal-vs-uniform failure mode for one extra field per row.
2. **Pinned-hero sort modifier (low effort).** A `pinnedLabels?: string[]` option that floats named rows to the top regardless of `sortBy`. Catches the recurring Economist/FT pattern of "sort by gap, but keep the United States at the top regardless."
3. **Delta annotation toggle (low effort).** `showDelta?: boolean` prints the `high - low` value above (or beside) the connector for the highlighted row only. The viewer currently has to mentally subtract `$11K` from `$142K`; the editorial point is `$131K`, so we should be drawing it.
4. **Direction-aware connector (medium effort).** When `high < low` (allowed; we only warn), render the connector with an arrowhead at the `high` end so a *decrease* reads as a vector. Matches the Reuters life-expectancy-retreat idiom and turns the warning case into a first-class variant.
5. **Light strip-plot fallback for distribution data (medium effort, opt-in).** When the data carries per-row sample arrays, render faint individual ticks behind the connector — preserves the dumbbell's instant-read while answering the "what about the middle" objection for episodes where the distribution shape matters.

## 7. Failure mode flags (always catch in audit)

- **Log-scaled axis with a "the gap is huge" narration line** — visual length no longer matches the verbal claim.
- **Unsorted dumbbells** when no intrinsic ordering exists. Alphabetical-by-country is the giveaway; sort by `range` or by one endpoint.
- **Two-color dot pair without legend** — viewers will guess which dot is "before"; ours has a top-right legend, don't suppress it.
- **More than 14 rows** — connectors compress to near-horizontal stubs; the `warnIf` fires, listen to it.
- **`high < low` rows treated as decoration** — the connector silently draws right-to-left and value labels collide on the wrong side. Use the proposed direction-aware connector or flip the encoding.
- **Bimodal-distribution data presented as a dumbbell** — the form lies about the middle. Switch to strip plot or small-multiples histogram if the shape is the point (§3).
- **Missing source attribution** — non-negotiable for Parallax voice; the template wires `SourceAttribution`, don't ship without populating it.

## TL;DR

Two dots, one connector, sorted by gap descending, low-bone over high-amber, value labels flanking each dot in Plex Mono, dashed walnut reference line when an average matters, no card chrome — the dumbbell is the form for "the **spread** is the story," and the Parallax template already renders the canon. The open work is making the middle of the distribution legible (midpoint tick), pinning narrative heroes, and turning the `high < low` decrease case into a first-class arrow-vector variant.

Last updated: May 14, 2026
