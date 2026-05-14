# CalendarHeatmap (Year-as-Grid Daily Intensity) — Research Dossier

> Created: May 14, 2026. Web research integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## 1. The form's editorial purpose

The calendar heatmap exists to expose **temporal rhythm at daily granularity over a full year** — clusters, quiet stretches, weekday/weekend bias, and the spacing between flashpoints. It is the right form whenever the editorial claim is *"look at when this happened, not just how much."* A 365-bar time series can show the same data but flattens the rhythm; a calendar grid restores the human temporal frame (week, month, quarter) the viewer already navigates. Use it when daily cadence is the story — escalation days, protest waves, market-volatility regimes, sanctions tempo, COVID case rhythm. Don't use it when data is sparse (<20 non-zero days), spans multiple years, or when magnitude alone is the claim (use TimeSeriesChart or DataChart).

## 2. Canonical idioms

### a. GitHub contribution graph (the seed form)
- **GitHub user profiles** (2013–present) — daily commit counts, 53-week grid, 7 weekday rows, 4-step green ramp

The single most-copied calendar heatmap in the world: spawned d3-cal-heatmap, `react-calendar-heatmap`, `cal-heatmap`, dozens of clones. *Works because:* fixed-grid, single-year framing, perceptual quantization into ~4 bins keeps it readable at thumbnail scale. *Fails when:* the 4-bin quantization is too coarse for editorial narrative (you want continuous saturation for "intensity").

### b. WaPo / NYT pandemic case calendars
- **New York Times** "Tracking Coronavirus" daily-cases panels (2020–2023, archive frozen Mar 2023) — county-by-county and national daily-incidence grids
- **Washington Post** vaccination cadence and COVID daily-case heatmaps (2020–2022) — sequential red ramp over a 7×N daily strip
- **Reuters Graphics** state-by-state COVID intensity grids (2020–2021)

*Works because:* the public learned to read this layout in 2020 — calendar heatmap is now a primed schema, not novelty. Sequential ramp aligns with the editorial weight ("more red = worse"). *Fails when:* the data spans the full pandemic; outlets switched to spiral or stacked time-series after the 2022 retrospective work because 3-year span broke the year-grid frame.

### c. Daily volatility / market-day calendars
- **Bloomberg Graphics** year-end retrospectives (2023, 2024, 2025 "Year in Graphics" collections) — daily-return heatmaps for index moves
- **Reuters / FT** VIX-regime and trading-day calendars used in crisis post-mortems (2020 COVID, 2022 rates shock, 2023 banking)

Diverging color scale (red down, neutral, green up) keyed to a centered ramp. *Works because:* the diverging legend matches the underlying signed quantity. *Fails when:* the form's narrow swatches make a centered legend hard to read at video speed — most reach for two annotated extremes rather than a continuous ramp.

### d. Editorial event-day calendar (Pudding / NYT Magazine style)
- **The Pudding** has used year-grids for cultural cadence stories (release calendars, performance schedules); not as common as bars but appears when "rhythm of the year" is the explicit framing
- **NYT Magazine** has used hand-styled calendar grids for retrospective essays (year-in-review formats)

Lower data density than the GitHub form; the editorial move is to annotate 2–4 specific days with leader lines + captions. *Works because:* the calendar is scaffolding, not the chart — the eye lands on the annotated days first, the surrounding intensity is context. *Fails when:* too many highlights (>5) clutter the grid and steal the rhythm.

### e. Aggregated month×weekday matrix (compressed variant)
- **The Economist** has used 12×7 month-by-weekday-of-month grids in retrospectives — same idea, lower resolution

Use when the daily series is too noisy for full 365-cell rhythm but the weekly/monthly pattern still matters. *Works because:* fits in a smaller editorial footprint. *Fails when:* the story actually IS at daily resolution — the aggregation discards the signal.

## 3. General principles

The calendar heatmap sits low on Cleveland & McGill's perceptual hierarchy: color saturation is harder to decode than position or length. The form's advantage is **structure, not precision** — the viewer isn't asked to read off an exact value, they're asked to register a pattern (clusters, gaps, weekday cycles). Healy (*Data Visualization*, 2018) frames this as a "small multiples in disguise" — each week is its own column, the year is a grid of 53 columns over which the eye does a cross-scan. Tufte's small-multiples principle applies: consistent geometry across panels (here: weeks) lets the eye do the comparison the prose can't.

The form fails the moment you try to use it as a precise quantitative chart. It succeeds when the editorial point is "look at the shape of the year."

## 4. Recommendation for Parallax

**Default:** 7×53 grid, sunday-start (US convention, matches NYT/WaPo/GitHub), **`intensity` color scale** (bone → amber) on **paper `#F5F0E8`**, square cells with 3px gap, rounded corners (2px radius). Sequential ramp (bone → oxblood `#6B1D1D`) only when the data is monotonically "worse with more" (deaths, casualties, crisis days). Diverging (china/us anchor colors) only when the data is genuinely signed.

**Highlights:** 2–3 maximum. Amber ring (`#E5A544`) around the cell, leader line dropping to a horizontal strip above or below the grid, caption in Plex Mono caption size. More than 3 highlights and the grid stops reading as a year and starts reading as an annotated infographic — wrong form.

**Typography:**
- Month labels: Plex Mono meta, uppercase small caps, muted text token, anchored to the column of each month's 1st day
- Weekday labels: Mon / Wed / Fri only (every-day labels clutter the gutter) — Plex Mono meta, uppercase
- Highlight captions: Plex Mono caption, primary text color
- Title / subtitle handled by `TitleBlock`

**Legend:** bottom-right horizontal swatch strip, 5 stops, low/high labels, optional `valueLabel` kicker above. Keep narrow — the grid is the focal element.

**Scrub tolerance:** at 12–14s per frame, the column-sweep reveal (~3.5s) plus highlight fade (~1s) totals ~5s of meaningful motion; the remaining hold lets the narrator land the editorial point on the annotated days.

## 5. Current template alignment

The existing `CalendarHeatmap` template:
- 7×~53 grid with sunday/monday week-start option — ✓ matches canon
- Three color scales (`intensity`, `sequential`, `diverging`) with hex-lerp ramps — ✓ covers the editorial cases
- UTC-anchored date math (Lambda-region safe) — ✓ this is the kind of correctness the GitHub clones routinely get wrong
- Per-column left-to-right sweep reveal with 1-frame per-row stagger — ✓ matches editorial standard
- Highlight rings + leader lines with above/below alternation and inside-grid horizontal pinning — ✓ matches canon (d)
- Vertical grid centering within available height (recent fix) — ✓ corrects the previous "stuck to top edge with empty band beneath" failure
- Bottom-right horizontal swatch legend with low/high labels and optional valueLabel kicker — ✓ matches canon
- `warnIf` for >5 highlights — ✓ enforces the convention at production time
- **Diverges from canon:** diverging-scale legend currently renders only the positive half (acknowledged in code comments) — the swatch strip is too narrow for a symmetric centered ramp. Annotation-based workaround documented.

## 6. Specific upgrades proposed

1. **Diverging-scale legend with proper symmetric ramp.** The current code renders the positive half only with a TODO-style comment. For diverging data the legend reads as one-sided and misleading. Render a 7- or 9-stop symmetric strip with a centered "0" tick, low/high labels at both ends, and reuse the same `cellColor()` sampling logic. Width-bound — may need to allow the legend to wrap or to live below the grid centered rather than bottom-right.

2. **Quantized 4-bin mode (GitHub form).** Add `colorScale: "quantized"` that snaps values into 4 perceptual bins instead of continuous lerp. The GitHub form is recognizable precisely because of the quantization — for stories where the editorial point is "active vs. quiet days" rather than "exact daily intensity," quantization reads cleaner at scrubbing speed.

3. **Month-band background tint.** Faint alternating month-band background (every other month gets a 4% paper-tint stripe across the 7 rows of its columns) anchors the eye in the temporal frame without adding label chrome. Most production calendar heatmaps include some form of month chunking beyond the divider line.

4. **Highlight caption hierarchy.** When multiple highlights cluster (Oct 1, Oct 2, Oct 6 in sample data), captions can collide. Add a second-tier "stem only, no caption" highlight type for "look, also these days" cells that aren't worth their own label — the ring alone signals editorial weight, the named event next to it carries the prose.

5. **Weekend-row dimming option.** For stories where weekday/weekend cadence matters (markets, work-week strikes), an optional `dimWeekends: boolean` would render Sat/Sun rows at 70% saturation. Reads weekday rhythm at a glance.

## 7. Failure mode flags (always catch in audit)

- **Sparse data (<20 non-zero days)** — grid reads as empty placeholder soup. Use a dot plot or annotated time series instead.
- **Multi-year data** — calendar heatmap is one-year-per-grid. Use small multiples of yearly grids (Tufte) or switch to TimeSeriesChart.
- **More than ~3 highlights** — `warnIf` fires at 5 but the editorial sweet spot is 2–3. Audit any data file with 4+ as a candidate for thinning.
- **Diverging scale on unsigned data** — common authoring error. If all values are positive, use `intensity` or `sequential`. The diverging ramp's "zero is neutral" anchor is wasted on monotonic series.
- **Wrong week-start for region** — US data should use sunday-start (matches NYT/WaPo/GitHub); ISO weekday conventions (European, financial) use monday-start. Mixing them across an episode is a tell of inconsistent sourcing.
- **Magnitude-not-rhythm framing** — if the narrator's claim is "X had 240 events," that's a stat card or bar. Calendar heatmap only earns its complexity when the rhythm matters.
- **Color ramp uses non-palette hex** — anything outside `palette.amber` / `palette.oxblood` / `semantic.us` / `semantic.china` / `palette.bone` is off-brand. Don't reintroduce green/red web defaults.
- **TZ-naïve date strings** — the template uses UTC; data files written in local time can shift cells by a day. Always emit `YYYY-MM-DD` strings interpreted as UTC midnight.
- **Truncated year (Q1 of next year shown)** — keep the grid bounded to one calendar year; off-year corner cells are correctly skipped by the renderer, but data files should not include dates outside `year`.

## TL;DR

**7×53 grid, sunday-start, intensity ramp (bone → amber) on paper, 2–3 amber-ring highlights with leader-line captions, Plex Mono small-caps month/weekday labels, swatch-strip legend bottom-right, UTC date math, column-sweep reveal. GitHub's geometry, WaPo's editorial framing, Du Bois's restraint.**

Last updated: May 14, 2026
