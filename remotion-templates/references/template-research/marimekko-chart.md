# MarimekkoChart — Research Dossier

> Created: May 14, 2026. Companion to `pricing-waterfall.md` and `sankey-flow.md` in the Magnitude/Decomposition family. Update when new outlet conventions are observed.

## 1. The form's editorial purpose

A Marimekko (a.k.a. mosaic, mekko) earns its rectangle when **two magnitudes per entity are the argument** — *"each country is sized by how much it matters, and within that size, here is its composition."* Column width encodes the first dimension (GDP, revenue, market cap, export volume); the height stack within each column encodes the second (energy mix, segment revenue, demographic split). Cell *area* is the perceptual unit — `width × stack-share` — so a fact like *"the G7's largest economy is also its most fossil-dependent"* lands as one wide block of rust rather than two charts the viewer has to mentally multiply. Distinct from a stacked bar (equal-width columns; loses the scale axis), from a treemap (one magnitude, no shared composition axis), and from PricingWaterfall (single fixed denominator, not a comparison across entities).

### When *not* to reach for it

| Alternative | When it wins over Marimekko |
|---|---|
| **Side-by-side stacked bars** | Composition comparison where scale doesn't matter, or where precise within-column reads are the point. Stacked bars give cleaner per-segment comparison; Marimekko trades that precision for the second magnitude. |
| **Treemap** | One magnitude only (market caps), or nested hierarchy. Marimekko's height axis assumes a *shared* composition vocabulary across columns. |
| **DataChart (grouped bar)** | Two dimensions but you want precise segment-to-segment comparison across entities (e.g., "France's nuclear vs. US's nuclear in absolute TWh"). |
| **PricingWaterfall** | One fixed denominator decomposed into stages. Marimekko is N-entity composition, not single-anchor decomposition. |

**Marimekko's superpower fires when:** the narration says *"sized by X, composed of Y,"* and the editorial punch depends on the viewer feeling both the entity's weight and its internal mix in one glance.

## 2. Canonical idioms

### a. Industry-by-region (the McKinsey/BCG portfolio idiom)

- **McKinsey Quarterly** has used mekko charts since the 1970s for portfolio analysis — sector revenue × geography share. The form is sometimes called the *"McKinsey chart"* in consulting circles.
- **Bain & BCG** continue the convention for market-share-by-segment briefings.

*Works because:* the chart literally answers two questions at once — *"how big is each market?"* and *"how is it split?"* — which is the consulting decking decision. *Failure mode:* presented without an editorial accent, the wall-of-rectangles reads as a portfolio audit rather than an argument.

### b. Industry × geography revenue mix (FT Chart Doctor canon)

- **FT Chart Doctor** (Alan Smith, 2018–present) lists "Marimekko" under the *Magnitude/Part-to-whole* family of its visual-vocabulary poster, with the canonical illustration being industry mix × economy.
- **FT** has run mekko-style breakdowns of European bank exposure by country × asset class.

*Works because:* the FT's editorial discipline — one accent color, restrained palette, in-cell labels only where they fit — turns the form from consulting noise into editorial argument. *Failure mode:* the FT itself notes that mekko is "best used sparingly" in its visual-vocabulary guidance because cell-label precision degrades as columns narrow.

### c. Commodity exports × country (Economist / Bloomberg)

- **The Economist** has used mosaic charts for commodity-export breakdowns — e.g., what each oil-producing country's exports are made of, sized by total export value.
- **Bloomberg** runs the same idiom for revenue × business-segment matrices of large multinationals (Apple, Alphabet) — segment revenue per geography, where geography width encodes regional revenue and the stack encodes product-line mix.

*Works because:* the structural fact — *"this country exports almost nothing but one thing, and it's tiny compared to its neighbor"* — is encoded in a single tile's width and height. *Failure mode:* commodity stories with >8 countries or >5 commodities devolve into a fragmentation grid.

### d. Statistical mosaic plot (academic genealogy)

- **Hartigan & Kleiner (1981)** introduced the mosaic plot as a statistical-graphics tool for visualizing contingency tables; **Friendly (1994)** extended it for categorical-data analysis.
- **Steven Pinker**'s *Enlightenment Now* and academic statistical-graphics texts use the term *"mosaic plot"* for the same shape.

*Works because:* the statistical lineage gives the form mathematical credibility — area as joint probability, columns as marginals. *Failure mode:* academic mosaic plots cram in residuals shading and Pearson colorings that read as data-science homework, not editorial argument; Parallax's mekko should not borrow them.

### Name origin (worth knowing for the form's voice)

Named after **Marimekko**, the Finnish design house (founded 1951) famous for bold rectilinear prints — Maija Isola's *Unikko* poppy print (1964) is the visual genealogy. The chart shares the prints' DNA: large flat blocks of color, sharp boundaries, no decoration. The form *looks* the way a Marimekko textile looks; calling it the "Mondrian chart" would be equally apt and more decoded.

## 3. General principles

Marimekko sits at an awkward spot in **Cleveland & McGill's** perceptual hierarchy: width and length comparisons are excellent individually (position-along-a-common-scale beats angle/area), but the chart's *unit of meaning* is **area**, which Cleveland ranks fifth — below position, length, and angle. The form trades per-segment precision for the two-magnitudes-at-once read; this is acceptable when the editorial point is the *gestalt* (relative weights), not the exact values. **Tufte's** data-ink ratio favors the form when columns are wide and labels fit; **Healy** (*Data Visualization*, 2018) notes mosaic plots are most useful when "the marginal distributions are themselves part of the story." The perceptual rationale for Parallax is: at ~10s scrubbing speed, the viewer registers area as a single fact ("wide-and-rust" = "big and fossil-dependent"), which is exactly the read editorial narration wants. Precise within-column comparison is what the legend and width-percent stamp recover.

## 4. Recommendation for Parallax

**Default:** 4–7 columns, 3–5 segments per column, `widthMode: "percent"` so the chart fills horizontally and reads as composition-of-total. Use `"absolute"` only when the editorial point is *"and the small economies really are this much smaller"* — i.e., when leaving horizontal slack is the argument.

**Palette discipline:**
- **One accent rust** on the editorially loaded segment (the "fossil" band, the "China" exposure, the "subscription" revenue line) — applied via `segmentColorMap` so the band reads as a horizontal stripe across all columns.
- Remaining segments stay in muted earth tones (umber, walnut, taupe, sand) from the fallback ramp.
- Never let the auto-assigned ramp randomize the accent — the *narration names one segment*; that segment is rust.

**Structure:**
- Order columns by width descending (or by editorial geography — e.g., G7 in size order, US first). Left-to-right entrance stagger reinforces the reading order.
- Provide `sublabel` on every column (the "≈ 50% of G7 GDP" stamp under the country name) — this is the redundant encoding that lets the width-percent claim land before the viewer reads the bottom-row stamp.
- Always cite `source` — Marimekko is a two-claim form (scale claim + composition claim); uncited it's worth half.

## 5. Current template alignment

The existing `MarimekkoChart` template (`src/templates/MarimekkoChart/`) matches canon on the load-bearing axes:
- Cross-column color stability via `segmentColorMap` keyed on `seg.key` — `fossil` reads as rust everywhere, the canonical FT/Economist treatment.
- Width modes (`percent` default, `absolute` opt-in) cover both the McKinsey-portfolio and Economist-commodity idioms.
- In-cell labels gated by `LABEL_AREA_THRESHOLD` (6500 px²) plus min-width/min-height floors — slivers fall back to the legend, which is the FT discipline.
- Runtime `warnIf` lints fire above 10 columns and above 6 segments per column, encoding the canon's "wall-of-rectangles" failure mode in code.
- Recent fix (May 2026): column label font shrinks from `fontSizes.label` to `fontSizes.caption` when estimated label width exceeds column width — so "United Kingdom" stops truncating to "United Kin..." in a 7%-width column.
- Width-percent stamp ("32% of total") under each column makes the first-dimension claim explicit rather than implied by width alone.
- 2px paper-color gutters between columns *and* between segments give the Mondrian tile-wall feel — the form's design genealogy honored.

Where it could go further: no explicit "Other" aggregation flag for small columns/segments; no per-segment emphasis field analogous to SankeyFlow's `link.emphasis`; the bone-on-tile text shadow is uniform regardless of underlying tile color.

## 6. Specific upgrades proposed

1. **`emphasisKey?: string` for editorial promotion.** Add a top-level field naming one segment key as the accent; non-emphasis segments recede to 0.5–0.6 opacity. Lets visual-spec promote "fossil" or "China-exposure" without forcing a `segmentColorMap` override. Pattern mirrors SankeyFlow's `link.emphasis`.
2. **`aggregateOther` flag for both axes.** `aggregateOther: { columnThreshold?: 0.03, segmentThreshold?: 0.03, label?: "Other" }` rolls up sub-threshold columns into a trailing "Other" column and sub-threshold segments per column into a terminal "Other" band. Prevents the fragmentation grid that the warnIf currently only warns about.
3. **Width-axis label kicker.** Optional `widthAxisLabel?: string` (e.g., "Share of G7 GDP") rendered as a small-caps strip below the width-percent stamps — makes the first-dimension claim explicit instead of relying on the title to carry it. Mirrors SankeyFlow's `columnHeaders`.
4. **Per-column total stamp.** When `widthMode: "absolute"`, optionally surface each column's absolute total (e.g., "$28T" under United States) so the magnitude isn't only encoded in width — defends against the perceptual-area precision tradeoff.
5. **Auto-sort option.** `sortColumns?: "widthDesc" | "widthAsc" | "preserve"` defaulting to `"preserve"` (current behavior) but recommended as `"widthDesc"` for catalog samples — descending width is the canonical FT/Economist reading order.

## 7. Failure mode flags (always catch in audit)

- **Wall of rectangles** — >10 columns or >6 segments per column; the warnIf catches both but visual-spec should pre-empt.
- **No accent / rainbow palette** — every segment a different ramp color and no editorial emphasis; reads as audit, not argument. Always one rust band, the rest muted.
- **In-cell labels truncated to nonsense** — "United Kin...", "Renewa..."; recent dynamic-font fix handles column labels, but watch in-cell `seg.label` truncation in narrow columns. If a label can't fit, rely on the legend and drop the in-cell text rather than render an ellipsis.
- **`segmentColorMap` missing when segments share keys across columns** — without it, color stability still works (via first-non-empty `seg.color` then fallback ramp), but the editorial intent isn't recorded in data; visual-spec should always emit `segmentColorMap` when the narration names a tracked segment.
- **`widthMode: "percent"` when the chart's point is absolute scale gap** — if narration says "and the rest are tiny in comparison," percent mode flattens the gap; switch to `"absolute"` so the small columns leave horizontal slack.
- **No `source`** — Marimekko makes two quantitative claims simultaneously; missing source = reject in audit.
- **Mixed units within columns** — segments measuring different things (% of energy + absolute TWh) destroys area-as-area. The schema doesn't enforce this; visual-spec must.
- **Equal-width columns** — if `column.width` is constant, you've built a stacked bar chart with a Marimekko's overhead; switch templates.

## TL;DR

**4–7 columns sized by the first magnitude, 3–5 stack segments composing the second, one rust band carrying the editorial accent across all columns via `segmentColorMap`, in-cell labels only where they fit and the legend everywhere else, width-percent stamp under each column to name the scale claim — the FT industry-by-region idiom dressed in Marimekko's flat-tile design genealogy.**

Last updated: May 14, 2026.
