# TimeSeriesChart (Line Charts Over Time) — Research Dossier

> Created: May 10, 2026. Research delegated to web-research agent; integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## 1. The form's editorial purpose

A line chart's job is to make a *trajectory* legible — direction, inflection, magnitude of change. Reach for it when the story is *"how did this number move over time, and where did it bend?"*

### Decision tree

| Sub-form | When to use |
|---|---|
| **Single line** | One quantity, one story arc (CO₂ ppm, S&P 500, US debt-to-GDP). Annotations carry the argument. |
| **Multi-line (2–5 series)** | Comparison *is* the story AND the lines genuinely cross or diverge (China vs. US GDP). |
| **Small multiples** | More than 4–5 series, or when each series has its own shape worth seeing. |
| **Slope chart** | Only two time points matter (pre/post-pandemic life expectancy by country). |
| **Stacked area** | Composition over time (energy mix, budget shares). NEVER for trends — the eye can't read non-baseline bands. |
| **Line + reference band** | Deviation from a baseline (global temp vs. 1850–1900 mean). |

**Multi-line vs. small multiples:** if a viewer needs to see *crossings*, multi-line. If they need to see *shapes*, small multiples. With Parallax's 8–12s scrub time, more than 4 lines becomes spaghetti; cut to small multiples.

## 2. Canonical idioms

### a. Single line with terminal label + event annotations
- **NYT** "Keeling Curve" treatments (2022 climate coverage)
- **FT** global-temperatures tracker (2023, ongoing)

One line, one bold terminal number, 2–4 vertical annotation rules ("1973 oil shock," "2008"). *Works because:* the chart *is* a sentence — subject, verb, modifiers. *Fails when:* annotations multiply past five — becomes a textbook diagram.

### b. Hero + supporting lines (2–4 series)
- **NYT Upshot** approval-tracker (Biden bold, comparison presidents in gray, 2021–2024)
- **Bloomberg** "Where inflation is hitting hardest" (2022) — hero country saturated, peers in muted tones

The hero gets full color + terminal label; supporting lines are gray/desaturated, optionally labeled at terminus. *Works because:* hierarchy resolves the spaghetti problem. *Fails when:* "supporting" lines are similar weights to the hero — the eye doesn't know where to land.

### c. Small multiples grid
- **Economist** demographic-trajectory panels (population pyramids over time)
- **FT** "Climate change tracker" by-country temperature anomalies (2023)

Consistent y-axis across panels, sparse ticks, terminal value in each. *Works for:* 6–20 series. *Fails when:* y-axes are independently scaled — kills the comparison.

### d. Slope chart (Tufte canonical)
- **Economist** life-expectancy 2019→2021 (COVID coverage)
- **NYT** "How Bad Is China's Economic Slowdown" (2023)

Just two columns of labels connected by lines. *Works for:* ranking changes. *Fails when:* lines bunch — needs aggressive label nudging.

### e. Line + reference band
- **FT** temperature-anomaly charts (2023) with 1850–1900 baseline shaded
- **NYT** inflation charts (2022) with Fed 2% target band

The band is the standard; the line is the verdict. *Works because:* it embeds the comparison *into the geometry*. *Fails when:* the band is too dark — competes with the line.

## 3. Treatment conventions

- **Terminal labels:** always for multi-line, usually for single-line. NYT format: series name + final value, right-aligned at line terminus ("Asia · 4,712M"). Skip the legend.
- **Annotations:** vertical hairline (1px, muted) from x-axis up to data point, with horizontal label leader. Anchor to a *specific data point*, not floating in space. Max 4 per chart.
- **Era shading:** subtle (5–8% opacity fill), full-height bands, labeled at top in small caps. "Bretton Woods," "post-Volcker." Sparingly — one or two eras max.
- **Reference lines:** dashed or dotted, 1px, muted. Labeled inline ("Pre-industrial baseline · 280 ppm"). Never compete with the data line in weight.
- **Y-axis:** start at zero for absolute quantities (population, dollars); fit-to-data for indices, anomalies, rates. Never overshoot data range by more than 10%.
- **X-axis ticks:** sparse. Decade marks for century-scale charts, year marks for decade-scale. Always label the first and last tick.

## 4. Recommendation for Parallax

**Default: hero + supporting multi-line with terminal labels, sparse era shading, and one reference line where applicable.**

- **Hero line:** `rust` accent, 2.5px stroke
- **Supporting lines:** `taupe` at 60% opacity, 1.5px stroke. Max 3 supporting
- **Terminal labels:** IBM Plex Mono, ink color, series name + final value, right-aligned
- **Annotations:** 1px `walnut` vertical rule to data point, label in IBM Plex Sans small caps above
- **Era shading:** `sand` at 8% opacity, labeled in mono small caps at top edge
- **Reference line:** 1px dashed `umber`, inline label at right terminus
- **Y-axis:** fit-to-data for rates/indices, zero-baseline for absolutes. 4 ticks max
- **X-axis:** 5–7 ticks, decade-aligned, mono numerals

**For 5+ series:** switch to 2×3 small multiples grid, hero panel highlighted with `rust` line, others in `walnut`.

## 5. Current template alignment

The existing `TimeSeriesChart` template, after our session's polish work:
- ✅ Terminal value labels at right edge (auto-stacking for collision avoidance)
- ✅ Hero/supporting line hierarchy via `hero?: boolean` field
- ✅ Tighter y-axis fit (10% → 5% headroom)
- ✅ Denser x-axis (adaptive ticks at decade/quarter-century intervals)
- ✅ Cleaner y-tick format (unit only on top tick)
- ✅ Era band opacity clamp (0.08 → 0.05)
- ✅ Annotation positioning fix — interpolates between adjacent points
- ✅ Leader-line label for annotations

**Diverges from canon:**
- Currently does NOT have a slope-chart sub-variant
- Currently does NOT have a small-multiples sub-variant
- Hero line stroke is 5–7px in our implementation (canon says 2.5px). Worth a closer look.

## 6. Specific upgrades proposed

1. ~~**Stroke weight calibration.** Canon says 2.5px hero / 1.5px supporting. We're at 7px / 3px. The bolder strokes work at video distance but should be tested — fonts research showed video stroke weights need to be ~2× print to read at 8–12s scrub. Validate in catalog renders.~~ **Done — May 11, 2026.** Recalibrated to 5px hero / 2px supporting / 3.5px solo (≈ 2× print canon — preserves video-scrub legibility while letting supporting lines recede properly). Codified as named constants `HERO_STROKE_WIDTH`, `SUPPORTING_STROKE_WIDTH`, `SOLO_STROKE_WIDTH` in the renderer with the rationale inline. Verified visually: CO₂ chart still reads as a hero curve; world-population hero (Asia) dominates cleanly while Africa/Europe/Americas stay legible.
2. ~~**Slope-chart sub-variant** (`variant: "slope"`) for two-point ranking comparisons. Useful for "GDP per capita 2000 vs 2024" or "Approval rating start vs end of term."~~ **Done — May 11, 2026.** Shipped as `variant: "slope"`. Renders each line as paired endpoints (uses first + last points, ignores anything between). Left side: label + start value. Right side: end value at line color. Hero treatment for `hero: true` lines (heavier stroke + display-weight end value). Catalog reference: `life-expectancy-slope` (Japan/Korea/US/India, 1900 → 2020). Known limitation: when start values cluster, left-side labels collide; future work could deconflict via greedy vertical adjustment.
3. **Small-multiples sub-variant** (`variant: "small-multiples"`) when series count exceeds 4. Shared y-axis, sparse labeling, hero panel highlighted.
4. **Annotation label hierarchy.** Annotation labels should describe *why*, not *what* — "OPEC embargo," not "CO₂ rises sharply." Audit existing annotations to enforce.
5. ~~**Reference band as alternative to reference line.** Add `referenceBand: { y1, y2, label }` option for "deviation from baseline" stories.~~ **Done — May 11, 2026.** Shipped as `data.referenceBands?: [{ y1, y2, label?, color?, opacity? }]`. Renders as shaded rectangles behind data, with optional right-aligned uppercase label inside the band. Domain auto-fits to keep bands visible. Use case: Fed-target inflation corridor, sustainable-yield range, temperature anomaly bands — anywhere the editorial point is "the data left the normal range."

## 7. Failure mode flags (always catch in audit)

- All lines same weight/color — spaghetti, no hierarchy
- Y-axis padded 25%+ above max data — flattens the trajectory
- Only 3 x-axis ticks (start/middle/end) — strips temporal context
- Annotations floating between data points — looks like a caption, not an anchor
- Legend in corner instead of terminal labels — forces eye ping-pong
- Era shading darker than 10% opacity — competes with data
- Reference line same weight as data line — eye can't tell which is the story
- More than 4 series multi-line — should be small multiples
- Independent y-axes across small multiples — destroys comparison
- Annotations describing *what* the chart shows instead of *why* it bent

## TL;DR

**Hero-and-supporting multi-line with terminal labels, one era band, and a single dashed reference line.** Most of our current template aligns; add slope and small-multiples sub-variants, calibrate stroke weights.
