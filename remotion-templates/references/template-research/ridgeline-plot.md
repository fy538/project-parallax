# RidgelinePlot — Research Dossier

> Created: May 14, 2026. Stacked density curves (joyplot) — one row per group, slight vertical overlap so ridge tops poke into the row above. Closest sibling form: faceted small-multiples histograms; closest rival: violin plot.

## 1. The form's editorial purpose

A ridgeline plot earns its rectangle when **the shape of a distribution is the story, not its mean.** The viewer's takeaway should be: *"these groups aren't just centered differently — the whole curve has a different character."* Two groups with the same median can have radically different tails, multimodality, or compression; a bar chart of means flattens that argument, a box plot summarizes it away. Stacking the curves on a shared X axis lets the eye scan top-to-bottom and read skew, spread, and modality as silhouettes — the same perceptual move that makes a seismograph or a music-EQ readable at a glance.

### When *not* to reach for it

| Alternative | When it wins over RidgelinePlot |
|---|---|
| **DataChart (bar/dot)** | One summary statistic per group is the whole point. Ridgelines on means are visual noise. |
| **TimeSeriesChart** | Groups overlap in time and the temporal axis matters more than distributional shape. |
| **Violin plot** | 2–4 groups where viewer needs to read median + IQR ticks alongside the shape. Violins crowd above ~5. |
| **Small-multiples histograms** | Within-group counts matter and the eye needs to read precise bar heights. Ridgelines smooth that detail away. |
| **Box plot grid** | Outliers and quartile cutoffs are the editorial point. Ridgelines hide both. |

**Ridgeline's superpower fires when:** comparing ≥5 groups where the editorial argument is *"look how differently shaped these distributions are"* — life expectancy by continent, income by decade, age structure by country, response times by school. The Africa-vs-Europe life-expectancy contrast in the sample data is the genre type-specimen: a wide, low, slightly-left-skewed African curve next to a narrow, tall, late-peaking European one tells a developmental story that no pair of means can.

## 2. Canonical idioms

### a. The Unknown Pleasures silhouette (overlap ≈ 0.5, monochrome)
- **Joy Division's "Unknown Pleasures" album cover (Peter Saville, 1979)** — radio pulses from pulsar CP 1919, the visual ancestor of every joyplot ever made

White-on-black, no axis, ~80 stacked traces; pure shape. The form's name ("joyplot" — coined by Wilke in a self-deprecating 2017 blog post) is a direct homage. *Works because:* removing all chrome leaves the silhouette argument. *Failure mode:* without an X axis or group labels, it's decoration, not analysis — Saville's cover is iconic precisely because it doesn't pretend to be a chart.

### b. The Wilke / ggridges canonical (overlap 0.3–0.5, per-group color)
- **Claus Wilke, "Introduction to ggridges" vignette (2017)** — temperatures-by-month example reproduced thousands of times since
- **Wilke, *Fundamentals of Data Visualization* (2019), Ch. 9** — the perceptual rationale (ridgelines as small-multiples that share an axis)

Each group gets a fill color from a continuous or ordinal ramp; baselines visible as thin rules; X axis shared at the bottom. *Works because:* the shared axis is the affordance ridgelines have over small-multiples — your eye doesn't have to recalibrate scale six times. *Failure mode:* > 8 groups stack into illegible noise; Wilke himself caps demos at ~6–10.

### c. The Economist / NYT Upshot editorial joyplot (overlap 0.4, one accent)
- **The Economist, "Daily chart: How the world's incomes have shifted" (Apr 2017)** — income distributions by region, 1988 vs 2011
- **NYT Upshot, "How Income Varies by Region" (Quoctrung Bui, 2014–2016 series)** — ridgeline-style income curves by metro area
- **NYT, "How Has the Coronavirus Spread Through Your State?" (Apr 2020)** — case-count distributions by week, state-by-state

Muted earth-tone fills across non-emphasized groups, single accent color (red / amber) on the editorially-loaded group, peak callouts only on the named distributions. *Works because:* editorial outlets converged on the form for "distributions by group" stories where the audience reads *one* contrast at a time. *Failure mode:* coloring every ridge differently destroys focal hierarchy — looks like a chart, reads like wallpaper.

### d. The WaPo COVID-outcomes / dense-stack variant (overlap 0.6–0.7)
- **Washington Post, "Excess deaths during the pandemic" (Bonnie Berkowitz, 2021)** — age-stratified mortality curves stacked tight
- **FT, "Coronavirus tracked" series (John Burn-Murdoch, 2020–2021)** — case-rate distributions by country, dense overlap

Tighter stacking, ridges visibly overrun their neighbors' baselines; reads as a topographic ridge line rather than discrete rows. *Works because:* when you're comparing ≥10 groups and the editorial point is the *envelope* of all distributions (not any one group), dense overlap creates a single readable silhouette. *Failure mode:* impossible to read any individual ridge — only use when the envelope, not the row, is the argument.

### e. Temporal joyplot (one ridge per time slice)
- **NYT, "How Birthdays Cluster" (Matt Stiles / Upshot, 2016)** — births by day-of-year, one ridge per decade
- **Pudding, "How songs get popular" (2018, multiple pieces)** — listening-curve shapes by song, ridgelines as small temporal multiples

X axis is itself a temporal/positional variable (day-of-year, days-since-release), each ridge is a different cohort. *Works because:* turns "how this curve evolved over time" into a static, scrollable image. *Failure mode:* if cohorts don't share the same X support (different time ranges), the shared-axis affordance collapses.

## 3. General principles

The ridgeline's perceptual leverage comes from **shared-axis small multiples with vertical adjacency** — Wilkinson's *Grammar of Graphics* (1999) provides the theoretical scaffolding (faceted layers on a common scale), Cleveland's position-along-a-common-scale ranking puts shared-X comparison at the top of the perceptual hierarchy, and Tufte's small-multiples principle ("comparisons across small multiples reveal pattern") explains why stacking beats juxtaposing. Wilke's contribution was practical: by letting ridges *overlap*, you fit 6–10 groups in the vertical space that 6 non-overlapping facets would demand, trading a small amount of occlusion (the bottom-right tail of each ridge clips behind the next ridge's body) for dramatically higher information density. Healy (*Data Visualization: A Practical Introduction*, 2018) notes ridgelines outperform violins above ~5 groups because violins' double-sided symmetry adds no information but doubles the ink-to-data ratio; the asymmetric ridge silhouette is what the eye actually reads.

The form fails the moment the argument shifts from *shape* to *value* — once a viewer needs to read "the median is 78.4," the smoothed silhouette is in the way. Ridgelines are a qualitative-shape form wearing quantitative clothes.

## 4. Recommendation for Parallax

**Default:** **5–6 groups, overlap 0.4–0.5, muted earth-tone fills with one accent rust on the load-bearing ridge, shared X axis at bottom, peak callout only on highlighted groups.** This is the Economist/Upshot variant — it matches the channel's "argument over inventory" doctrine and the muted earth-tone palette.

**Palette:**
- Default fill: `taupe` / `walnut` / `umber` / `olive` / `bronze` across non-highlighted ridges (the categorical fallback in `getCategoricalColor` already lands in this range)
- Highlight (1–2 ridges max): `rust` and/or `amber`
- Never `bone` — it's the paper background; ridges in bone disappear (see §5)
- Baselines visible only at low overlap (<0.2); at default overlap the ridges *are* the baselines

**Style:**
- Stroke + fill both at the group color, fill at 0.55 opacity (0.78 for highlighted) — the slightly-translucent fill softens the ridge-on-ridge occlusion without losing shape
- Peak callout only on `highlightIds` — never decorate every ridge with its peak value
- Group labels in mono small caps to the left, color-matched on highlight, muted otherwise
- Order groups by editorial meaning (low-to-high median, chronological) — order carries the argument

## 5. Current template alignment

The existing `RidgelinePlot` template (May 2026):

- ✅ Pre-computed density samples in data files — no runtime KDE, no SciPy in the renderer
- ✅ Catmull-Rom-to-cubic-bezier smoothing with tension 0.5 — peaks crisp, no overshoot
- ✅ Shared X axis with `niceDomain` / `niceTicks` — every ridge on the same scale
- ✅ Shared density Y scale (global peak × 1.05 headroom) — narrow tall peaks correctly tower over wide flat ones, which is the editorial reading
- ✅ Configurable overlap 0.0–0.8 (default 0.45) — covers Wilke / Economist / WaPo regimes
- ✅ `highlightIds` array → hero ridge gets heavier stroke, higher fill opacity, peak callout
- ✅ Left-to-right reveal sweep via SVG `clipPath`, staggered top-to-bottom — avoids the CSS `clip-path` frame-render gotcha
- ✅ Runtime `warnIf` for >8 groups (reads as noise) and <8 density samples per group (angular curves)
- ⚠️ The sample data's Oceania row originally specified `color: "bone"` — invisible against the paper background; fixed to `taupe` in a recent commit but the lesson belongs here so it can't drift back. **Color tokens must contrast with the substrate; `bone` is paper, not ink.**
- ⚠️ No explicit small-multiples fallback for >8 groups — the warning fires but doesn't suggest splitting

## 6. Specific upgrades proposed

1. **Schema-level color contrast validation.** Reject `color: "bone"` (and any token equal to the active substrate) at parse time with a Zod refinement; surface a clear message ("'bone' is the paper background and will render invisible — use 'taupe' or 'walnut' for muted ridges"). The runtime warn-only approach already missed this once; a schema-level reject prevents the next instance.
2. **Median / mean tick rule per ridge.** Optional `group.summary?: { value: number; kind: "mean" | "median" }` — renders a 1px vertical tick from baseline to peak at the summary x. Lets the form retain the shape argument while quietly answering "but what's the actual center" for the load-bearing ridges, without falling into the "label every peak" failure mode.
3. **Group-order auto-sort by median.** Optional `sort?: "median-asc" | "median-desc" | "as-given"`. Editorial canon (Wilke, Economist) almost always sorts by central tendency; making it explicit prevents the "alphabetical continents" failure where the viewer can't visually read the developmental gradient.
4. **Color-ramp mode for ordinal groups.** When groups are an ordered sequence (decades, age bands), allow `colorRamp?: "amber" | "rust" | "olive"` instead of per-group colors — derives a continuous ramp across the ordinal axis. Matches the Wilke/ggridges canonical and prevents the categorical-rainbow failure mode.
5. **`splitAt` threshold for >8 groups.** When the group count exceeds the legibility cap, optionally render two stacked half-height ridgelines (groups 1..k and k+1..n) sharing the same X axis instead of cramming everything into one column. Preserves the form when an episode legitimately needs 10–12 groups.

## 7. Failure mode flags (always catch in audit)

- **`color: "bone"` (or substrate-matched) on any ridge** — invisible; reject in audit, fix in data
- **>8 groups in a single ridgeline** — stacks into noise; split or collapse related groups
- **Rainbow palette / one-color-per-ridge for non-ordinal groups** — destroys editorial hierarchy; max 2 active accents
- **Every ridge highlighted (no `highlightIds` or every id listed)** — focal hierarchy gone; the form's argument depends on the contrast between hero and bed
- **Used for single summary stats per group** — wrong template; use DataChart or a dot plot
- **<8 density samples per group** — angular ridges read as low-fi rather than smooth distributions; needs 12–20 samples for the canonical silhouette
- **Groups not ordered editorially** (alphabetical, random) — the top-to-bottom scan must carry meaning; sort by median, chronology, or named argument
- **Peak callouts on every ridge** — turns the form into a value-readout chart; reserve for `highlightIds` only
- **Mixed X-units across groups** (years on one ridge, dollars on another) — shared X axis is the form's foundation; mixed units break it silently
- **Decorative overlap > 0.7 with named ridges** — the WaPo dense-stack mode is for *envelope* readings; pairing it with peak callouts and individual highlights asks the eye to do both jobs at once and accomplishes neither

## TL;DR

**5–6 muted earth-tone ridges sorted by median on a shared X axis, overlap 0.45, one rust-accent ridge with a peak callout, mono small-caps group labels to the left — the Economist/Upshot joyplot in the Parallax palette. Never use `bone` for a ridge fill; it's the paper.**

Last updated: May 14, 2026
