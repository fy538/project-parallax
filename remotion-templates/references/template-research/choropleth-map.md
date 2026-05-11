# Choropleth Map — Research Dossier

> Created: May 10, 2026. Research delegated to web-research agent; integrated and Parallax-aligned by claude. Update when new outlet conventions are observed.

## 1. The form's editorial purpose

Reach for choropleth when **the region itself is the unit of analysis** and the variable is **intensive** (rate, ratio, percentage, index) — not extensive (raw counts, totals). Choropleth answers *"how does this quality vary across space?"*

Decision rules:
- **Raw counts** (population, casualties, GDP totals) → proportional symbol map
- **Distribution within regions** → dot-density map
- **Political/demographic stories where land area distorts** → cartogram
- **Movement** (trade, migration, capital) → flow map (use RouteAnimation)
- **Quality varying across space** → choropleth ✓

The choropleth's editorial superpower is *legibility at glance* — viewers already know the shape of the world, so cognitive load goes to the color, not the geography. Its weakness: it implies regions are homogeneous, which is almost never true.

## 2. Canonical idioms

### a. Sequential diverging from a meaningful midpoint
Used when the variable has a natural center: zero, 50%, parity, a baseline year.
- **FT 2021** "excess mortality by country" — red-white-blue, centered at expected mortality
- **NYT Upshot 2020** election margin map — red/blue diverging from 50%, saturation encoding margin size

*Works because:* the midpoint is editorially load-bearing.
*Fails when:* designers center on the data mean instead of the meaningful threshold (e.g., centering an inflation map at the global median instead of the central-bank 2% target).

### b. Sequential single-hue, classed (5–7 bins)
The Economist's standard country-comparison treatment.
- **Economist** — GDP per capita, democracy index, press freedom (recurring)
- ColorBrewer "YlOrBr" or "Reds" — light-to-dark single hue

*Works because:* classed bins force the reader to a discrete judgment ("top quintile") rather than fuzzy hue-matching.
*Fails when:* bins are equal-interval on a skewed distribution — everything ends up in bin 1, three outliers in bin 5. Use quantile or Jenks natural breaks.

### c. Diff choropleth (change-since-X)
- **Bloomberg 2023** "where prices rose fastest" inflation maps
- **FT** "swing since last election" UK constituency maps

Diverging palette centered on zero change. *Works because:* it reframes a static snapshot as a *story of motion*. *Fails when:* the baseline year is arbitrary or unstated — always label "change since [date]" in the legend, not just the title.

### d. Categorical choropleth with legend strip
- **Reuters** conflict-actor control maps in Syria/Ukraine
- **Economist** "regime type" maps (Freedom House categories)

4–6 qualitative colors, no ordering implied. *Works when:* the variable is genuinely categorical. *Fails when:* designers use it for ordinal data — categorical palettes destroy the rank information.

### e. Bivariate choropleth
- **Joshua Stevens / NYT** "race and income" or "vaccination and political lean" — 3×3 color grid.

High information density but requires a legend the viewer must study — **avoid for Parallax** at 8–12 second scrub rates. Mention it exists; don't use it.

## 3. General principles

- **"Every choropleth is secretly a population map."** Raw counts over un-normalized regions just show where people live. Always normalize: per capita, per km², per GDP unit, as a share.
- **Color-blindness.** ~8% of men have red-green deficiency. ColorBrewer (Cynthia Brewer) palettes are vetted; "RdBu" is the safest diverging choice. Never use rainbow/jet — perceptually non-uniform, encodes false structure.
- **MAUP (modifiable areal unit problem).** Results change with boundary level (country vs. province vs. county). Pick the unit that matches the editorial claim.
- **Projection matters.** Mercator inflates high latitudes (Greenland, Russia) — political-economic distortion. Use **equal-area** for any quantitative comparison: Robinson or Equal Earth for world, Albers for national.
- **Classed beats unclassed** for editorial work — discrete bins are scannable; continuous gradients are pretty but unreadable at speed.

## 4. Recommendation for Parallax

**Default form:** Sequential single-hue **classed** choropleth, **5 bins**, **quantile** breaks, **Equal Earth** projection for world maps and **Albers** for regional.

**Palette:** use **rust** (`#C23B22`, channel accent) as the dark end of the sequential ramp, fading to **bone/paper** at the light end — ties the chart into the paper-on-desk aesthetic without inventing a new palette. For diverging variables (election swing, inflation vs. target, trade balance), use **rust ↔ accent-blue** through **bone** as the neutral midpoint.

**Legend:** horizontal strip below the map with numeric breakpoints, IBM Plex Mono labels, source attribution in Plex Mono at 60% ink, bottom-right.

**Other defaults:**
- No country labels except the 3–5 the narrator names.
- Borders: 0.5pt taupe, not black.
- Ocean: paper, not blue.
- Date stamp + units in the legend, always.
- Gray for "no data" — visually distinct from the lightest bin (use a hatching pattern if needed).

## 5. Current template alignment

The existing `ChoroplethMap` template (via `MapGL` shared component, Mapbox GL + deck.gl):
- Uses Mapbox GL tiles — projection is web-mercator by default. **Diverges from canon** for quantitative comparison.
- Catalog variants: `g7`, `cold-war-blocs`, `tordesillas` — mix of sequential and categorical.
- Legend implementation varies per variant.

## 6. Specific upgrades proposed

1. ~~**Projection switch for world-scale comparisons.** Add a `projection: "equal-earth" | "albers" | "mercator"` option, default to `equal-earth` for non-regional maps. Mercator is editorially dishonest for choropleth.~~ **Done — May 11, 2026.** Migrated the legacy d3-style `geoMercator`/`geoNaturalEarth1`/`geoEqualEarth` enum (unused since the Mapbox migration) to the Mapbox-native projections: `globe`, `mercator`, `equalEarth`, `naturalEarth`, `albers`. MapGL gained a top-level `projection?` prop that overrides the globe/mercator auto-choice. Legacy catalog references migrated. The `equalEarth` projection is now the recommended default for world-scale quantitative comparison — area-preserving and editorially honest.
2. **ColorBrewer-vetted defaults.** Build palette options around `RdBu` (diverging) and `YlOrBr` rust-to-bone (sequential), bake into the template rather than letting per-episode data pick arbitrary colors.
3. ~~**Quantile bin helper.** Auto-compute quantile breaks from data, default to 5 bins. Force the data writer to declare the binning strategy (equal-interval, quantile, Jenks).~~ **Done — May 11, 2026.** Shipped as `src/utils/quantileBins.ts` exporting `quantileBreaks()`, `equalIntervalBreaks()`, `assignBin()`, `normalizeForRamp()`, and one-step `binAndNormalize()`. Default strategy is `quantile`; default bin count is 5 (NYT/Reuters convention). Includes a test that explicitly demonstrates the dossier failure mode ("equal-interval on skewed distribution → everything one color") to prevent the convention from being unlearned. Covered by `src/__tests__/quantileBins.test.ts` (17 tests). Jenks deferred — quantile + equal-interval cover ~95% of editorial cases.
4. ~~**Legend strip standardization.** Horizontal bottom-of-map strip, mono labels, breakpoint values, source attribution baked in. Apply across all variants.~~ **Done — May 11, 2026.** Shipped as `data.legend?: { breaks?, unit?, label? }`. Renders a horizontal color-ramp strip above the FooterStrip with optional left-side caption (uppercase mono) and break-value labels (Plex Data, with unit suffix) between swatches. Pairs cleanly with `quantileBreaks()` from `src/utils/quantileBins.ts` — pass the same break array to both the data normalizer and the legend, and the encoding is self-documenting.
5. **"No data" treatment.** Hatched or stippled fill for missing regions so it's distinguishable from the lightest bin.

## 7. Failure mode flags (always catch in audit)

- Raw counts without per-capita / per-area normalization
- Rainbow, jet, viridis-without-reason, or any non-ColorBrewer-derived palette
- Mercator projection used for quantitative comparison
- Diverging palette on non-diverging data (no meaningful midpoint)
- Equal-interval bins on skewed distributions (everything one color)
- Missing source attribution, missing date stamp, missing units in legend
- Country labels everywhere (clutter); none of the narrated countries highlighted
- Gray for "no data" indistinguishable from the lightest bin
- Diff map without stated baseline date
- Bivariate choropleth at video speed (too dense to read in 2 seconds)

## TL;DR

**5-bin quantile sequential choropleth in rust-to-bone, Equal Earth projection, Plex Mono legend strip with source attribution.**
