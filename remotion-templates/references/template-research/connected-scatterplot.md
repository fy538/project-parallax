# ConnectedScatterplot — Research Dossier

> Created: May 14, 2026. Sibling form to TimeSeriesChart but tuned for two-variable trajectories. Update when new outlet conventions are observed.

## 1. The form's editorial purpose

A connected scatterplot's job is to make the *shape of a joint trajectory* legible — the loop, the reversal, the regime break, the snap-back. Reach for it when the story is *"these two macro indicators moved together over decades, and the geometry of how they moved is the argument."* A line chart of either variable alone hides the relationship; a static scatter without the connecting line hides the time order. Only the connected form lets the viewer read *"we came back to where we started"* or *"in 2020 the rules changed"* directly off the page.

The form's home use case is the **Phillips curve** (unemployment × inflation), but the same idiom carries productivity-vs-wages, growth-vs-emissions, deficit-vs-yields, cases-vs-positivity, and any "is the historical relationship still holding?" question. FT Chart-Doctor lists it explicitly under **Correlation** in the Visual Vocabulary poster (Smith, 2018, `ft-interactive/chart-doctor`), distinguishing it from plain scatter precisely because the *path* — not just the cloud — is what's being argued about.

### When *not* to reach for it

| Alternative | When it wins over ConnectedScatterplot |
|---|---|
| **TimeSeriesChart** | The story is about the *level* of one variable over time — "US GDP grew from $5T to $25T." Use TimeSeriesChart when you have one variable; use ConnectedScatterplot only when the *relationship between two variables* is the argument. |
| **DataChart scatter** | Two variables are plotted, but there is no temporal ordering — the editorial point is the correlation at a single moment, not the trajectory over time. |
| **BumpChart** | The story is about relative rank shifts across time, not absolute two-variable co-movement. |
| **SankeyFlow** | The relationship between the two variables is a flow (one variable is a source, one is a destination) rather than a joint trajectory. |

**ConnectedScatterplot's superpower fires when:** the editorial point is the *shape* of the trajectory — a loop means "we came back to where we started," a jag means "regime break," a diagonal sweep means "monotone change" — and neither variable alone tells that story.

## 2. Canonical idioms

### a. Single trajectory with pivot labels + arrowhead
- **NYT Upshot** "The Phillips Curve May Be Broken For Good" (Irwin, 2018) — US unemployment × core inflation 1960→2018, single ochre line, labels at 1975 / 1980 / 2009 / 2018, arrow at the most recent point.
- **The Economist** "America's tight labour market" (2023) — wage growth × unemployment trajectory, labels only at decade pivots, arrowhead leading into the most recent quarter.

One series, one trajectory, labels reserved for *direction changes* (3–5 per chart). *Works because:* the eye reads the path as a sentence with the arrowhead as the period — "we ended up here." *Fails when:* every point gets a year label and the path turns into a textbook diagram.

### b. Era-segmented trajectory (color-coded by regime)
- **WSJ** "The Productivity-Wage Gap" (2022) — productivity × real compensation 1948→2021, line color shifts at 1973 (post-Bretton-Woods) and 2008.
- **FT** "Has the Phillips curve flattened?" (2021) — pre-1995 / 1995-2019 / post-2020 segments in three hues to argue the relationship broke in distinct phases.

Color encodes regime; the geometry of the kink shows when the regime changed. *Works because:* it embeds the historical thesis into the line itself. *Fails when:* the segmentation is arbitrary — viewers should be able to *guess* where the breaks are before reading the legend.

### c. COVID-style "loop" trajectory
- **Reuters Graphics** "Tracking the coronavirus" (2020–2021) — daily cases × test positivity for major countries, two-week trailing average, arrowhead on today.
- **NYT** "How the Virus Won" hospitalization × ICU trajectories (2020).

Short time window (weeks/months, not decades), heavy smoothing so the loop reads, arrowhead and "as of" date prominent. *Works because:* the loop pattern itself is the story (cases rising while positivity rising = uncontrolled spread). *Fails when:* the data is noisy and unsmoothed — the trajectory looks like a scribble.

### d. Country-comparison connected scatter (small multiples)
- **Our World In Data / Hannah Ritchie** GDP-per-capita × CO₂-per-capita 1990→2022 (ongoing) — one panel per country, shared axes, identical year markers.
- **The Economist** "Decoupling growth from emissions" (2023) — six-country small-multiples grid of the same income-emissions trajectory.

Each panel shows one country's path; identical axes let the eye compare shapes across panels. *Works because:* it answers the comparative question ("did the US decouple faster than China?") without the spaghetti of overlapping trajectories. *Fails when:* axes are independently scaled, killing the comparison.

### e. Bloomberg "era-fill" trajectory

Bloomberg Opinion uses filled translucent bands behind named sub-paths to highlight eras: the US Federal Reserve hiking cycle is a warm amber fill; the pause period is a muted grey fill; the cutting cycle is a cool teal fill. The path itself remains a single neutral line; the fills provide the regime context.

- **Bloomberg Opinion** "The Fed's Rate Cycle" (various, 2022–2024) — interest rate × inflation trajectory with shaded bands for "hiking," "pause," "cutting."
- **Bloomberg Economics** "Petrodollar recycling" charts (2023) — oil price × current-account balance with geopolitical event fills.

*Works because:* the filled bands are legible at thumbnail size and at print — the viewer sees "three eras" before reading any label. *Fails when:* bands are used without editorial justification for the periodization — the viewer will assume the fill means something and be confused if the breakpoints are arbitrary.

### f. The Economist "cyclical return" dotted path

The Economist occasionally distinguishes a *return path* (the second pass through the same territory) from the *initial path* using a dashed or dotted line. Used in inflation cycle stories: the solid line shows the 2021–2022 inflation surge; the dotted return path shows the 2023–2024 disinflation, revealing that the return trajectory follows almost the same curve as the rise.

- **The Economist** "Inflation: The Return Journey" (2023) — CPI × unemployment, solid line for the surge, dotted line for the retreat, labeled loop with directional arrows at each segment.

*Works because:* when the path literally retraces itself (a cycle), the overlap would be illegible as a single solid line — the dashed/dotted convention separates the two passes without resorting to color. *Fails when:* the paths don't actually overlap and the dashed line just looks like a rendering artifact.

## 3. General principles

Cleveland's perceptual hierarchy puts *position along a common scale* at the top — which is what both axes of a scatter give you — but Tufte's rule about *small multiples beat overlaid spaghetti* binds the form to one or two trajectories per panel. The connected scatter is the rare chart that asks the viewer to read **shape as text**: a tight loop means cyclic, a diagonal sweep means monotone change, a sharp jag means regime break. Healy (2018, *Data Visualization*) notes that this readability is fragile — without time labels at pivot points the viewer can't reconstruct direction, and without an arrowhead the latest point is ambiguous. Munzner frames it as a "derived attribute" visualization: the editorial payload is not in any single (x, y) but in the *sequence*, so the chart must make sequence visible through line, arrow, and sparse temporal labels.

The form's strength is showing **trajectory shape** — loops, reversals, regime breaks — at one glance. The weakness is **time legibility at scrubbing speed**: a viewer scanning the chart for 8–12 seconds can't read 30 year-labels, so labels must be reserved for the 3–5 vertices that carry the argument. The pivot-detection problem (which years deserve labels?) is the hardest design decision; "first, last, and any vertex with a turning angle ≥ ~120°" is the FT/Upshot consensus.

## 4. Recommendation for Parallax

**Default: single-trajectory amber line with pivot-only year labels and an arrowhead at the most recent point.** Era segmentation and small multiples are second-tier variants to add only when an episode actually needs them.

- **Trajectory line:** `amber` accent, 2px stroke, smooth Catmull-Rom (tension 0.5) so the path traces the data without overshoot
- **Points:** 6px disc at every observation, `amber` fill, with a paper-color underlay disc (r + 3) so the line reads "broken" at each marker — observation, not bump
- **Highlight points:** 10px disc + faint outer ring at editorially significant moments (max 4 per chart)
- **Arrowhead:** filled triangle along the tangent of the last segment, tip extending 4px past the final point
- **Labels:** year + optional editorial label (lowercase, mono, amber for highlights) at first / last / every `highlight: true` / auto-pivots ≥120° turn (cap 2 auto-pivots)
- **Leader lines:** 1px muted stroke from disc rim to label, perpendicular to local tangent, biased outward from chart center
- **Axes:** full XY frame, 5 nice ticks each side, mono numerals, light gridlines at 22% opacity dashed
- **Pacing:** axes fade in fast (sec 0.3), points stagger in chronologically (sec 0.15 each), trajectory line sweeps via `strokeDashoffset` to lead the next disc by ~one segment, arrowhead fades in once the line lands

## 5. Current template alignment

The existing `ConnectedScatterplot` template (sample data: Phillips curve 1973–2024):

- Catmull-Rom-to-cubic-bezier curve through every observation, tension 0.5, endpoint-duplicated so boundary tangents lay flat
- Single amber trajectory with point discs at every year, underlay disc cuts the line at each marker
- Arrowhead `<polygon>` oriented along the tangent of the last segment, reveal-gated on `trajProgress >= 1`
- Year labels at first / last / every `highlight: true` + auto-pivot detection (turning angle ≥ 120°, cap 2 auto-pivots)
- Editorial label (e.g. "stagflation", "Volcker shock", "post-pandemic inflation") rendered below the year for highlights, in amber lowercase mono
- Leader line from disc rim to label, perpendicular to local tangent, biased outward from chart center
- Label-edge clamping (`labelMargin = 18`) added recently to keep corner-region labels off the axis frame and tick row — leader endpoints recomputed from the clamped position so the connection stays intact
- Chronological stagger: points appear in year order, trajectory line sweeps via dashoffset to lead the next disc by ~one segment
- `warnIf` guards at <3 points (use TimeSeriesChart or DataChart scatter) and >40 points (trajectory crosses itself into noise)

**Matches canon (idiom a):** the single-trajectory + pivot-labels + arrowhead idiom is the Parallax default and it's faithfully rendered. The Phillips-curve sample matches the NYT Upshot / Economist treatment of the same dataset almost beat-for-beat.

**Diverges from canon:**
- No era-segmentation variant (idiom b). A `segments?: [{ from: year, to: year, color }]` field would unlock the WSJ productivity-wage and FT broken-Phillips treatments.
- No small-multiples variant (idiom d). Cross-country trajectory comparison currently requires multiple compositions.
- Single trajectoryColor only — no support for multi-trajectory overlay (e.g. US vs. EU Phillips curves on one panel). Generally fine; spaghetti is the failure mode this form is designed to avoid.

## 6. Specific upgrades proposed

1. **Era-segmentation variant.** Add `segments?: [{ fromYear, toYear, color, label? }]` so a single trajectory can shift color at regime breaks (1973, 2008, 2020). Render each segment as its own `<path>` with its own dashoffset window. Captures idiom (b) — high editorial value for "the relationship broke in 1973" narratives. *Effort: medium. Impact: high.*
2. **Hover-equivalent: persistent value badges on highlight points.** Currently a highlighted point shows `year` + editorial label only. Add the (x, y) value pair in mono caption below the label for the highlight set. *Effort: low. Impact: medium.* Makes the chart self-contained without forcing the viewer to triangulate against the axes.
3. **Label collision deconfliction.** Auto-pivot labels currently get perpendicular-tangent placement + edge clamping; when two pivots land within ~30px of each other the labels overlap. Add a greedy vertical-nudge pass (already used in TimeSeriesChart terminal labels). *Effort: medium. Impact: medium.* The Phillips sample is clean, but a denser dataset will hit this.
4. **Pivot-detection tuning.** Current threshold ≥120° turn picks up sharp reversals but misses gentle inflection points that are editorially significant (e.g. 2008 in the Phillips sample — important historically but the trajectory passes through smoothly). Consider a hybrid: angle threshold OR direction-of-motion sign change on either axis. *Effort: low. Impact: low.* Lean on `highlight: true` for now.
5. **Small-multiples sub-variant.** For 3–6 country comparison panels of the same trajectory (idiom d). Shared axes across panels, hero panel optionally accent-colored. *Effort: high. Impact: low until an episode actually needs it.* Defer.

## 7. Failure mode flags (always catch in audit)

- Fewer than 3 points — not a trajectory, it's a slope. Use TimeSeriesChart or DataChart scatter.
- More than 40 points — trajectory crosses itself into noise. Thin to every 2nd/3rd year or split into eras.
- Every year labeled — turns the chart into a textbook diagram. Cap labels at 4–5 (first, last, ≤3 pivots).
- No arrowhead — viewer can't tell which end is "now."
- Disc fill matches line color with no underlay disc — markers vanish into the line, observations stop reading as discrete.
- Axes start padded > 15% beyond data range — flattens the trajectory geometry that is the entire point of the chart.
- Two variables that aren't time-indexed — use DataChart scatter instead. The connecting line is meaningless without a temporal ordering.
- The editorial argument is about *level* of one variable, not *shape* of the joint path — use TimeSeriesChart instead.
- Highlighted year label sits on the axis frame or tick row — clamp inward (current implementation handles this; verify on edge-of-domain pivots).
- Multiple overlapping trajectories on one panel — switch to small multiples or pick the hero.

## TL;DR

**Single amber trajectory through every observation, pivot-only year labels, arrowhead at the most recent point.** The current implementation matches the NYT Upshot / FT / Economist canonical Phillips-curve idiom. Era-segmentation variant is the highest-value extension; small-multiples can wait for an episode that needs it.

Last updated: May 15, 2026 (added when-not-to-use table; Bloomberg era-fill and Economist cyclical-return idioms added to § 2).
