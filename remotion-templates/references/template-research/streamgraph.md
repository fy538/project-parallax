# Streamgraph — Research Dossier

> Created: May 14, 2026. Research delegated to web-research agent; integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## 1. The form's editorial purpose

A streamgraph earns its rectangle on screen when **the composition is shifting and the total is incidental**. The viewer's takeaway should be: *"one constituent receded while another swelled — the mix is the story."* By trading the zero baseline for a centered (silhouette) or minimum-wiggle baseline, the chart suppresses the eye's instinct to read absolute magnitudes off the y-axis and instead foregrounds the *relative-share movement*: the Saudi band shrinking, the Canadian band swelling, the Venezuelan band collapsing to a hairline. The form's load-bearing word is *yields* — old majority yields to new neighbors, one source yields to many, an era yields.

### When *not* to reach for it

| Alternative | When it wins over Streamgraph |
|---|---|
| **Stacked area (zero baseline)** | Total magnitude is part of the argument ("imports doubled while the mix shifted"). A flat-bottom stack reads totals AND composition; streamgraph sacrifices total readability for compositional flow. |
| **Small-multiples lines** | The viewer needs to read precise values per series at specific years. Heer & Bostock (2010) showed streamgraphs are worse than line charts at value-extraction tasks. |
| **TimeSeriesChart (single/few lines)** | ≤3 series and the magnitudes are roughly comparable — lines win on precision. |
| **SankeyFlow** | Two-point comparison (1970 vs 2024) where intermediate years don't carry editorial weight. Sankey reads cleaner at video scrubbing speed. |
| **DataChart (stacked bar over time)** | Decadal snapshots (5–7 bars) rather than continuous flow. Better for sparse benchmarks. |

**Streamgraph's superpower fires when:** 5–8 categorical series, long horizon (decades), and the editorial point is that *the constituents reordered themselves*. Not "the pie grew," but "the pie's slices traded places."

## 2. Canonical idioms

### a. The Pudding river — cultural composition over decades
- **The Pudding**, *"The Unlikely Odyssey of Foreign Films at the Oscars"* (2018) and *"The Hip-Hop Effect on the NBA"* (2017) — long-horizon cultural mix shifts rendered as flowing rivers.

Saturated but distinct categorical palette (8–10 hues), bands labeled directly on the river at the widest point, no legend, centered silhouette baseline. *Works because:* at scroll/scrub speed, the eye reads *flow direction* — which band is widening, which is collapsing — without ever needing to land on the y-axis. *Failure mode:* with rainbow palettes, more than ~8 bands becomes a Lisa-Frank smear; the editorial signal is buried.

### b. NYT Ebb-and-Flow — the genre's origin
- **NYT Upshot / Graphics**, *"The Ebb and Flow of Movies: Box Office Receipts 1986–2008"* (Matthew Bloch, Lee Byron, Shan Carter, Amanda Cox, Kevin Quealy — Feb 23, 2008)

The chart that named the form. Each movie is a stream (born at release, decaying over weeks); collectively they make a river of summer-blockbuster + holiday peaks. Used silhouette offset and direct labels on dominant bands. *Works because:* the metaphor of "movies as fluid mass moving through the year" is itself the editorial point — releases compete for finite audience attention, and the shape *is* that competition. *Failure mode:* the original is interactive (hover to reveal small streams); static/video versions lose the long tail of tiny films.

### c. Bloomberg composition-shift — economic mix over time
- **Bloomberg**, energy-mix and trade-composition streamgraphs (multiple, 2019–2023) — e.g., LNG supplier composition, EU gas import sources before/after Feb 2022.

Tighter palette (4–6 muted bands, one accent for the editorial subject), silhouette baseline, in-frame annotation pinpointing the inflection year. *Works because:* the muted palette + single accent matches Bloomberg's argument-led house style — the chart is making a *point*, not displaying a dataset. *Failure mode:* Bloomberg sometimes uses wiggle (Byron-Wattenberg) offset where silhouette would read cleaner; wiggle's asymmetry can suggest the *total* is drifting up/down when it isn't.

### d. FT Chart-Doctor "Flow" category
- **Financial Times**, Alan Smith's *Visual Vocabulary* (2018, periodically updated) — streamgraph lives under "Flow / change over time," paired with the warning that it's harder to read than stacked area.

Used sparingly by FT proper; the *Visual Vocabulary* poster lists it as the canonical option when "the focus is on the contour/silhouette of the total over time," with the explicit caveat that exact values are sacrificed. *Works because:* FT's discipline forces the question — does this story actually need the centered baseline? Most don't. *Failure mode:* picking streamgraph for its visual romance when a stacked area or small-multiples would communicate better.

### e. Wikipedia / ThemeRiver lineage — the academic ancestor
- **Havre, Hetzler, Nowell**, *"ThemeRiver: visualizing thematic changes over time"* (IEEE InfoVis 2000)
- **Byron & Wattenberg**, *"Stacked Graphs — Geometry & Aesthetics"* (IEEE TVCG 2008) — the paper that introduced the *minimum-slope-sum* ("wiggle") baseline algorithm, refined the NYT box-office chart, and turned the form into editorial canon.

The Byron-Wattenberg algorithm minimizes the visual wiggle of each band by choosing the baseline that minimizes the squared slope summed across all layers, weighted by layer thickness. *Works because:* mathematically optimal smoothness — no band has a more agitated profile than necessary. *Failure mode:* the optimization doesn't know which band is the editorial subject; the algorithm can hand the *quietest* slope to a series the narration doesn't care about and the *jaggiest* to the load-bearing one.

## 3. General principles

The form's perceptual rationale is **Cleveland & McGill position-along-non-aligned-scales** (lower in the hierarchy than position-along-common-scale, which is what a regular line chart uses). The viewer reads *thickness* — area between two curves — which is roughly equivalent to length judgment on a curved baseline: workable for rank-order and trend, unreliable for precise values. Heer & Bostock's 2010 crowdsourced study (*"Crowdsourcing graphical perception"*) confirmed: streamgraphs are statistically worse than stacked bar/area for value-extraction tasks; they hold their own for *trend* identification. This is the trade Parallax is making whenever we reach for the form — *we are intentionally lossy on values to be rhetorically clear on flow.* Munzner's framing: streamgraph is a "summarization" idiom, not an "identification" idiom. If the narration says a precise number, the streamgraph can't visually confirm it; that's a callout-card job.

## 4. Recommendation for Parallax

**Default:** **silhouette offset, 5–8 series, monotone-cubic interpolation, in-band labels at the widest point.** This matches the NYT/Pudding canon and the form's perceptual sweet spot at our 8–14s scrub speed.

**Palette:**
- 4–6 muted earth tones across non-emphasized bands (walnut, umber, taupe, sand, olive, bone)
- **Single accent** (amber or rust) on the editorially load-bearing band — the one the narration names
- No legend; labels sit *on* the band at its widest column
- Suppress the y-axis entirely (faint dashed midline only); keep a sparse x-axis (5–6 ticks at real data positions)

**Style:**
- `silhouette` offset is the default; reserve `wiggle` for episodes where Byron-Wattenberg's wiggle-minimization measurably reduces visual noise (mostly: many series with high-frequency value changes)
- Reserve `zero` for the rare case where total magnitude is part of the argument — at which point ask whether `DataChart` stacked-area would do the job better
- Squish-up reveal (scaleY around midline) is correct — the bands "bloom" from the river axis, reinforcing the centered-baseline metaphor

## 5. Current template alignment

The existing `Streamgraph` template:
- Silhouette default (correct per canon)
- Three offset modes: silhouette / wiggle / zero — wiggle implements Byron & Wattenberg 2008 minimum slope-sum with re-centering shift so the river doesn't drift over time
- Fritsch-Carlson monotone cubic Hermite interpolation — never overshoots band boundaries, which is exactly what a streamgraph needs (overshoot below another band breaks the stack illusion)
- In-band labels at the widest x-column with paint-order stroke halo for legibility on band fills; suppressed when band thickness < 22px
- Categorical palette via `getCategoricalColor(sIdx)` fallback, with per-series `color` override accepting palette tokens or `"accent"`
- Squish-up reveal: `scaleY(0→1)` around midline via SVG matrix transform with staggered start per band (lowest-first); avoids per-frame path reflow
- Sample data is decade benchmarks for US oil imports 1970–2024 (SA/CA/MX/VZ/Other) linearly resampled to 13 points so the spline reads smooth
- Recent fix (May 2026): SVG path closing regex was producing malformed `"L  C ..."` segments missing the L target — band bottoms now stitch cleanly to band tops
- Faint dashed midline (0.18 opacity) acts as the suppressed y-axis anchor
- Sparse x-axis: 6 evenly-spaced ticks at real data positions, mono font + small caps caption

**Diverges from canon:** No "Other" auto-aggregation — currently the catalog hand-bakes Other into the data. No editorial accent system (the canonical Bloomberg move: one accent band, rest muted). No annotation API for in-frame call-outs at inflection years.

## 6. Specific upgrades proposed

1. **Per-series `emphasis: "accent" | "muted"` field.** When ANY series declares accent, others recede to ~0.55 opacity. Lets visual-spec promote the editorially load-bearing band without per-frame color overrides. (Parallels the SankeyFlow May-2026 emphasis upgrade.) Low effort, high editorial impact.
2. **Inflection annotation API.** `annotations?: { x: number; text: string; seriesId?: string }[]` — small connector + label at a specific year, optionally pointing at one band. Lets narration say "by 2010, Canada had passed Saudi Arabia" and the chart visibly confirms the moment. Medium effort, high impact.
3. **`aggregateOther` auto-bucketing.** Schema flag to roll any series whose peak share never exceeds threshold (default 4%) into a single "Other" band, palette-token `bone`. Prevents unreadable hairlines and unenforces the canonical 5–8 cap. Low effort.
4. **Offset-mode lint warning.** `warnIf` when `offset === "zero"` AND series count ≥ 4 — suggest `DataChart` stacked-area instead, since at that point Parallax is using a streamgraph template for a non-streamgraph idiom. One-line addition to existing warnings.
5. **Wiggle baseline tie-breaker by `emphasis`.** When emphasis is set, reorder series before computing the wiggle baseline so the accent band receives the smoothest slope profile. Solves the Bloomberg failure mode (algorithm assigning quietest slope to wrong band). Medium effort; only valuable once emphasis ships.

## 7. Failure mode flags (always catch in audit)

- **Used when total is the argument** — narration says "imports doubled" but the silhouette baseline hides that. Use stacked area (zero offset) or pair with a callout showing total.
- **>8 series with rainbow palette** — collapses to a Lisa-Frank smear. Bucket smallest into "Other," collapse to 5–7 visible bands, mute everything except the accent.
- **One series dominates** — if one band is >60% at peak, others compress below readable thickness. Use TimeSeriesChart or split into two charts.
- **Precise-value claim with no callout** — narration says "Saudi share dropped to 5%" but the streamgraph alone cannot confirm 5 vs 7 vs 10. Pair with a StatReveal/callout, or switch to small-multiples lines.
- **Mismatched x-grids across series** — template assumes shared x; warns in `warnIf`, but visual-spec should resample upstream.
- **Wiggle baseline with high-frequency noise** — if data is yearly and noisy, wiggle can hand the editorial subject a jagged slope. Switch to silhouette or smooth the data upstream.
- **Sub-22px label suppression hiding the key band** — if the accent band is too thin to host its label at its widest point, the chart is showing it but the viewer can't name it. Either widen the y-extent, switch to a different form, or add an external label/annotation.
- **`zero` offset with ≥4 series** — using a streamgraph template for a stacked-area idiom. Audit should flag.
- **No source attribution** — every streamgraph is a quantitative composition claim across decades; it needs a citation.

## TL;DR

**Silhouette-baseline river with 5–7 muted earth-tone bands, monotone-cubic curves, single accent on the editorially load-bearing band, in-band labels at peak width, suppressed y-axis, sparse mono x-ticks — the NYT/Pudding skeleton wearing the Parallax palette. Reach for it when the mix is the story; reach for something else when the total is.**

Last updated: May 14, 2026
