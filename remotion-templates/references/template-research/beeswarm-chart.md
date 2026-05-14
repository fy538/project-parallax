# BeeswarmChart (1D Strip-Plot Distribution) — Research Dossier

> Created: May 14, 2026. Web-research integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## 1. The form's editorial purpose

The beeswarm is the form you reach for when the editorial claim is **"here is the whole distribution, *and* here is where these specific entities sit inside it."** A bar chart of 30 countries compresses individual identity into noise; a histogram throws individual identity away entirely; a scatter wastes a dimension on jitter. The beeswarm preserves position-along-a-common-scale (the metric that matters) while using collision-resolved vertical offset purely as a legibility trick — every dot remains a *named entity* a narrator can point to. Use it when the script says some variant of *"most cluster here, a handful run hot, and look where the country we care about sits."* It is the canonical form for "ranking + distribution + outlier callout" stories at one glance.

## 2. Canonical idioms

### a. Horizontal axis, highlight-with-leader-label
- **FlowingData (Nathan Yau), Sept 2025** — "Salary and Occupation" beeswarm: every BLS occupation as a dot along a median-salary x-axis, healthcare cluster pulled up top, individual roles labeled on demand. ([Salary and Occupation 2024](https://flowingdata.com/2025/09/09/salary-and-occupation-2024/); [Making of: Salary and Occupation beeswarm charts](https://flowingdata.com/2025/09/11/process-354-beeswarm/))
- **Pew Research Center 2025** — included a beeswarm in their year-end "favorite visualizations" roundup specifically for **showing distribution densities** alongside named entities, mobile-first. ([Top data visualizations of 2025](https://www.pewresearch.org/short-reads/2025/12/15/our-favorite-data-visualizations-of-2025/))

*Works because:* the human eye reads the distribution shape (clustered low, sparse high) at a glance, *and* can be guided to a single labeled outlier in the same beat — two reads, one chart.
*Fails when:* every dot gets a label — the swarm turns into a wall of text and you've reinvented the bar chart badly.

### b. Animated beeswarm with category swap
- **FlowingData, "How to Make an Animated Beeswarm Chart" (Dec 2020)** — same dots, axis re-bound on click; viewer watches the swarm reshape between metrics. ([Animated Beeswarm tutorial](https://flowingdata.com/2020/12/15/how-to-make-an-animated-beeswarm-chart/))

*Works because:* the constancy of identity (same dots) plus reshape (new metric) makes the change **felt**, not read. *Fails when:* used non-interactively without narration that justifies the swap.

### c. Categorical-group split (small-multiples of swarms)
- **FlowingData chart-type page** documents the variant where one axis is categorical (e.g., job sector) and within each category a beeswarm reveals the within-group distribution; **Pudding** uses the same idiom for ranking-with-context projects. ([FlowingData: Beeswarm](https://flowingdata.com/charttype/beeswarm/); [DataViz Catalogue: Beeswarm Plot](https://datavizcatalogue.com/blog/chart-snapshot-beeswarm-plot/))

*Works because:* the viewer compares within-group spreads side-by-side without losing individual identity. *Fails when:* groups have wildly different N — sparser groups look anemic against denser ones for no analytical reason.

### d. Reference-line benchmark variant
- Standard across SIPRI/Atlantic Council derivatives ([Atlantic Council NATO Spending Tracker](https://www.atlanticcouncil.org/commentary/trackers-and-data-visualizations/nato-defense-spending-tracker/)) and Bloomberg Opinion — a dashed vertical at the editorially-loaded threshold (NATO 2% target, poverty line, inflation target) anchors the swarm.

*Works because:* the line gives the eye a "before/after" partition and the narrator a verbal hinge ("everyone to the right of this line is over target"). *Fails when:* the threshold is arbitrary and reads as editorial cherry-picking.

### e. NYT Upshot "every member on the axis"
- The Upshot uses 1D swarms for parliamentary/Congressional distributions — ideology score, voting record, age — so every member is individually present without 535 bars. ([FlowingData chart-type: Beeswarm](https://flowingdata.com/charttype/beeswarm/) documents the NYT pattern; The Upshot's interactive distribution pieces are the proximate model.)

*Works because:* viewers can find *their* representative in the swarm — distribution becomes personal. *Fails when:* used without interactivity in a static medium and individual dots aren't labeled — you've made a fancy histogram.

## 3. General principles

The beeswarm rides at the top of **Cleveland & McGill's perceptual hierarchy (1984)** for the same reason bars do: position along a common scale beats every other encoding. What it adds is **individual-entity preservation** — each datum survives as an addressable mark rather than being aggregated into a bin (histogram) or a box (boxplot). Tufte's data-ink ratio applies: dots are minimum-ink marks, the vertical offset is *non-data ink* that exists solely to prevent occlusion, so it should be visually quiet (small, low-contrast offsets; no vertical axis chrome). Munzner would classify the form as a 1D quantitative-position encoding with a marks-arrangement constraint — and warn that the moment readers start *interpreting* the vertical offset (as density, time, anything), the chart has failed. Vertical position must mean nothing, and the design has to make that obvious.

## 4. Recommendation for Parallax

**Default form:** **horizontal axis, dots packed upward only, 4–6 highlighted entities in amber `#E5A544` with leader-line + entity-and-value label, rest in ink `#1C1814` at 30–50% opacity**, on **paper `#F5F0E8`**.

**Typography:**
- Axis ticks in **IBM Plex Mono** at meta size (the data is numeric — Mono signals "read me as a number")
- Axis title in Plex Mono small-caps, right-anchored at axis end
- Highlight labels in **IBM Plex Sans 600**, format `Entity · Value` (mid-dot separator is canonical across the codebase)
- Reference-line label in Plex Mono small-caps above the line
- Source attribution lower-right ("SIPRI, 2024")

**Chrome:**
- Single thin baseline (ink at 50%), tick marks only at nice-number positions
- No vertical axis line, no gridlines, no bounding box around the swarm — the dots *are* the chart
- Reference line dashed `4 5`, ink at 70%

**Scrub tolerance:** at 8–12s per frame, the viewer must (1) clock the distribution shape, (2) find the amber dots, (3) read 1–2 labels in the first 3s. That means highlights ABOVE baseline always — leader lines pointing up are scanned faster than mixed up/down, and the cluster of amber labels reads as a "Parallax annotation row." This is the right call.

## 5. Current template alignment

The existing `BeeswarmChart` template:
- Canonical packing algorithm — sort by x, alternate up/down per cluster ✓
- Nice-number axis ticks via `niceStep` (d3-scale heuristic) ✓
- Reference line support with label ✓
- Per-item highlight with larger radius (9 vs 5), amber fill, leader-line callout, Plex Sans label ✓
- `valueFormat` for `number | percent | currency` ✓
- `warnIf` guards at <6 items (too sparse — recommend DataChart/StatReveal) and >80 items (wall-of-dots — recommend top-N) ✓
- Background variants, FilmOverlay cascade, drift/exit fade via `useCompositionAnimation` ✓
- Sample data is the canonical editorial use case (NATO + non-NATO military spending, 2% reference line, 5 outliers highlighted) ✓
- **Divergence from canon — intentional:** highlights are forced ABOVE baseline (`preferredSigns = [-1]`) so all amber callouts cluster on one side. Non-highlights still alternate up/down to keep the swarm visually balanced. This is the right Parallax call — keeps the leader-line/label layout consistent — but it diverges from "pure" beeswarm packing where all items share the same alternation rule.
- **Divergence — accidental/known:** dense clusters near a single x-value pile vertically into a column rather than spreading laterally — the algorithm is x-first-then-y, so adjacent equal-value dots stack rather than nudge.

## 6. Specific upgrades proposed

1. **Lateral micro-jitter for equal-x clusters.** When ≥3 items share an x-value within ±r, distribute them across a small horizontal band (±r) before vertical packing. Cures the "tower of Iceland/Luxembourg/Spain at 1.3%" stacking visible in the sample data. Low effort, high visual impact.
2. **Group-color secondary encoding.** The `group?: string` field on `BeeswarmItem` is already there as informational — wire it into non-highlight fill color (NATO vs non-NATO, allied vs adversary) so non-amber dots carry a second bit of editorial information at near-zero ink cost. Add a tiny legend strip under the axis title.
3. **Label-collision deconfliction for highlight callouts.** When two highlighted dots land within `labelWidth` of each other in x, stagger their `labelOffsetY` (-28 vs -52) so the labels don't overlap. Currently mitigated only by manually choosing well-spaced highlights — fragile.
4. **Categorical-split variant (small-multiples of swarms).** Add `variant: "split"` with `data.categories: Array<{ title, items }>` rendering one swarm per category with a shared x-scale. Unlocks idiom (c) for stories like "GDP/capita across continents" or "AI investment by sector."
5. **`hero` boolean separate from `highlight`.** Currently every highlight gets the same treatment. Add an optional `hero?: true` for *one* entity that gets the Plex Sans hero-stat treatment (DataChart precedent) — useful when the editorial point is "USA at 3.4%" and the other four highlights are supporting context.

## 7. Failure mode flags (always catch in audit)

- **Beeswarm with <6 items** — sparse on a 1D axis; use DataChart bars or StatReveal. Warning already wired.
- **Beeswarm with >80 items** — packing density above 80 produces walls of dots that obscure the distribution they're supposed to reveal. Top-N filter or group first. Warning already wired.
- **Vertical position read as meaningful** — if a viewer can infer *anything* from how high a dot sits (density? time? rank?), the chart is misleading. Vertical is jitter only. If vertical *should* mean something, you want a true scatter or RadarChart.
- **Equal-x tower stacking** — known limitation; see upgrade 1. Audit for "is there a vertical column of 4+ dots at one x-value?" — if yes, the form is failing.
- **Highlights without distribution context** — if you're only labeling 4 of 30 dots and the other 26 carry no editorial information, you should probably just use DataChart with those 4 entities.
- **Missing reference line where the script names a threshold** — narrator says "above the NATO 2% target" → reference line is non-negotiable.
- **Categorical data on the x-axis** — beeswarm requires a quantitative metric; use DataChart variants for ordinal/nominal comparisons.
- **Highlight outlier labels collide** — see upgrade 3; manual mitigation today.
- **No source attribution** — non-negotiable for Parallax voice; the form's authority depends on the implicit "here is the whole population" claim, which needs a citation.

## TL;DR

**1D horizontal swarm on a quantitative axis, highlights forced upward in amber with `Entity · Value` callouts in Plex Sans, rest in ink at 30–50% opacity, single thin baseline, reference line dashed where editorially loaded, source attribution lower-right. Distribution shape + named outliers in one read. Du Bois with a swarm of dots.**

Last updated: May 14, 2026.
