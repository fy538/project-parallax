# ProportionalSymbolMap — Research Dossier

> Country-anchored circles sized by data. The Mercator-fix for count data.
>
> Last updated: May 11, 2026 (initial)

## 1. The form's editorial purpose

When the editorial point is *who has the most of something* — fabs, military bases, billionaires, refugees, oil reserves — and you want the viewer's eye to land on the largest values regardless of the country's geographic size, you want proportional symbols, not choropleth fill.

The deep failure mode of choropleth for count data: Russia and Greenland are huge on a Mercator map, but their numbers may be small. Filling them with color over-emphasizes their visual weight. Conversely, Singapore and Israel are tiny but punch above their weight on many indicators — choropleth makes them invisible. Proportional symbols sever the relationship between country area and data weight: the eye sees *the number*, anchored at the country's location, and territorial size becomes mere geographic context.

This is the form most editorial outlets reach for when the headline noun is "where" but the structure is "how much."

## 2. Canonical idioms

### 2a. Single-variable circles, area-proportional
**References:** NYT (2020–present, COVID case maps); FT (2023, "Where the world's semiconductors are made"); Reuters (2024, refugee flow origin maps).

**Why it works:** One variable, one map. The eye reads area, sees the rank order at a glance, and the legend lets the viewer cash out approximate magnitudes. Cleveland's perceptual hierarchy: area-proportional encoding ranks high for ordinal comparison ("which is biggest"), lower for precise estimation — which is *exactly* the editorial task at video-scrubbing speed.

**Failure mode:** Radius-proportional instead of area-proportional. Encodes value² visually — the largest circles look ~10× too big. The proportional-symbol lie. We hard-default to `scaleType: "sqrt"` (area-proportional) and the audit should flag any `"linear"`.

### 2b. Bivariate proportional + color
**References:** FT (multiple, "winners and losers" frames); Bloomberg (2022, oil-export concentration with price-sensitivity color); The Pudding (migration maps with sending-vs-receiving color).

**Why it works:** Two dimensions per location — size = volume, color = sign/category. Trade balance maps (size = total trade, color = surplus or deficit) are the canonical case. Reads cleanly because the two encodings don't compete: area says "how much," color says "which side."

**Failure mode:** Using color for a quantitative second variable instead of a categorical/diverging one. Quantitative-on-quantitative bivariate maps require a 2D color matrix; that's its own animal and usually shouldn't be attempted in a fast-paced video.

### 2c. Multi-phase reveal — sequential by category
**References:** NYT (2021, "How NATO has grown" — country circles by accession era); FT (2024, "Where chip subsidies are flowing" — phased by year); Reuters (2023, naval-base buildup maps).

**Why it works:** The static all-at-once view is overwhelming for >10 countries. Phasing them in by category (founding members → expansion → recent additions) builds the argument step by step. Combine with camera focus per phase to spotlight the relevant region.

**Failure mode:** Phases that don't carry editorial meaning — just splitting because it's hard to fit everything. Each phase should answer a *different* question.

### 2d. Dorling cartogram — symbols decollided
**References:** The Economist (recurring, election cartograms); FT (2022, COVID-vaccine-distribution map); Tilegrams.org gallery.

**Why it works:** In dense regions (Europe, southeast Asia), proportional circles at true centroids overlap into an illegible jumble. A Dorling cartogram runs a force simulation to push overlapping circles apart while preserving rough geographic relationships. The viewer sees clean circles; the editorial cost is some geographic distortion.

**Failure mode:** Decollision pushed too far — circles end up at locations bearing no resemblance to the country. Loses the geographic anchor entirely.

**Parallax status:** Not implemented in v1. Add when an episode hits a dense-region scenario worth solving.

### 2e. Stacked / pie proportional
**References:** National Geographic plates (recurring); USGS thematic atlases.

**Why it works (sometimes):** Each country's circle is itself a mini-pie chart showing composition (e.g., total energy capacity split by source). Two-level encoding in one symbol.

**Failure mode:** Almost always too much information per symbol for video scrubbing speed. Reserve for print or interactive contexts. Not implemented in v1 — by design.

## 3. General principles

The design-theory backbone:

- **Area, not radius, proportional to value.** Cleveland (1985) on perceptual hierarchy; Tufte on the "lie factor." When you size a circle by `radius = value/max`, the visual area scales with `value²` and viewers misread magnitudes by orders of magnitude. Use `d3-scale`'s `scaleSqrt()` or equivalent. We implement `computeRadius()` in [`utils/proportionalSymbol.ts`](../../src/utils/proportionalSymbol.ts) — area-proportional by default, with `linear` as a footgun that lint should flag.
- **Centroid, not bounding-box center.** d3-geo's `geoCentroid()` returns the geographic center of mass — the visually correct anchor. Bounding-box centers fall in oceans for Indonesia, Russia (without Albers projection), USA-with-Alaska-and-Hawaii.
- **Legend is mandatory.** Three reference circles labeled with their values. Without it, the encoding is illegible. The legend's size ratios should match the actual data range (small ≈ max/16 → radius is max/4; medium ≈ max/4 → radius is max/2; large = max). This produces three visually equal-spaced circles — the eye reads them as a clean scale.
- **Render order: largest first.** Otherwise small circles vanish under large ones in dense regions. `sortSymbolsLargestFirst()` enforces this; the SVG render order puts small circles on top.
- **Stroke + slight fill alpha.** Default `SYMBOL_FILL_ALPHA = 0.72` plus a 1.5px stroke. Overlapping circles still read because the strokes don't merge the way fills do.
- **Max circle radius ~5-8% of frame diagonal.** Our default `maxRadiusPx = 50` at 1920×1080 → ~2.5% of frame width. Larger feels overweighted for video; smaller feels timid. Tune per composition via `data.maxRadiusPx`.
- **Use for COUNT data, not RATE.** Per-capita / share / percentage data want a choropleth with an area-honest projection (Equal Earth). Proportional symbols for rates produce confusing reads ("big circle in small country" doesn't carry the right argument).

## 4. Recommendation for Parallax

**Default form:** Area-proportional circles (`scaleType: "sqrt"`), rust fill (`palette.rust` at 72% alpha + rust stroke), centroid anchor, equal-earth projection, IBM Plex Mono legend in the bottom-right with `valueLabel` caption and three reference circles.

**Editorial defaults baked in:**
- 50px max radius (tunable).
- Largest-first render order.
- 15° graticule at 10% opacity to keep the atlas register.
- Source attribution mandatory in FooterStrip.

**When ProportionalSymbolMap vs. ChoroplethMap vs. AtlasPlate:**

| Data shape | Geographic context | Use |
|---|---|---|
| Per-capita, % share, rate | World-scale | **ChoroplethMap** + `equalEarth` projection |
| Count, volume, magnitude | World-scale or regional | **ProportionalSymbolMap** |
| Categorical membership, "before vs. after" | World-scale | **AtlasPlate** |
| Trade routes, flows, hub-and-spoke | Any | **RouteAnimation** |

When in doubt: if the editorial sentence is "X people / dollars / chips," use proportional symbols. If it's "X percent of people / share of dollars," use choropleth.

## 5. Current template alignment

`ProportionalSymbolMap.tsx` (initial implementation, May 11 2026):

| Canon | Implemented? | Notes |
|---|---|---|
| Single-variable circles, area-proportional | ✓ | Default `scaleType: "sqrt"`. |
| Bivariate (size + per-symbol color) | ✓ | `symbols[].color` per circle. |
| Multi-phase reveal | ✓ | `phases[]` with per-phase symbol arrays + camera focus. |
| Dorling cartogram decollision | ✗ | v2. Manual centroids only for now. |
| Stacked / pie proportional | ✗ | Out of scope by design. |
| Legend with three reference circles | ✓ | Auto-computed via `generateLegendTicks`. |
| Source attribution | ✓ | Via `data.source` → FooterStrip. |
| Annotations | ✓ | Reuses MapAnnotation schema (projected per-frame). |
| Graticule | ✓ | Same SVG graticule path as AtlasPlate. |

**Architectural note:** ProportionalSymbolMap shares the d3-geo + world-atlas + camera-transform pattern with AtlasPlate. The base-map rendering (countries, graticule, camera) is duplicated between the two templates rather than extracted into a shared `AtlasBaseMap` component. Reasonable as long as there are only two consumers; if a third appears, refactor.

**Performance:** Same as AtlasPlate — country paths memoized at world fit, camera animation via outer `<g transform>` (no per-frame re-projection). Symbol circles re-position per frame (cheap: `projectScreen()` is a single d3-geo call + 2 multiplies).

## 6. Specific upgrades proposed

Ranked by effort/impact:

1. **Color interpolation on phase transitions.** (~1 hr)
   When a country's symbol persists between phases and `color` changes, lerp the hex. Currently swaps instantly at phase boundaries.

2. **Radius animation on phase transitions.** (~2 hr)
   When a country's `value` changes between phases, animate the radius. Currently swaps instantly. Would smooth multi-phase reveals significantly.

3. **Dorling-cartogram decollision option.** (~half day)
   `decollide: true` runs a d3-force simulation to push overlapping circles apart. Loses some geographic fidelity in exchange for legibility in dense regions.

4. **Inline value labels.** (~30 min)
   Optionally render the symbol's value (formatted) inside or beside each circle, not just the country label. Useful when the legend isn't enough.

5. **Per-symbol stroke / opacity overrides.** (~30 min)
   When one symbol needs editorial emphasis (the "winner" or the "outlier"), allow per-symbol `stroke`, `strokeWidth`, `fillAlpha` overrides.

6. **Bivariate diverging color ramp.** (~half day)
   `colorBy: { value: "tradeBalance", ramp: "rdBu", domain: [-1, 1] }` — bivariate maps where the second variable drives color via a diverging ramp. Currently you can color per-symbol manually but a ramp helper would smooth the workflow.

## 7. Failure mode flags

These should always trigger an audit finding when seen:

- **`scaleType: "linear"`.** The proportional-symbol lie. Use `"sqrt"` (default). The radius-proportional encoding makes the largest values look ~10× too big.
- **No source annotation on a data-bearing symbol map.** Same rule as choropleth and AtlasPlate. Every ProportionalSymbolMap ships with `data.source`.
- **Using ProportionalSymbolMap for RATE/DENSITY data** (per-capita, % share). Wrong template. Use ChoroplethMap with an area-honest projection.
- **More than ~12 symbols in dense regions** without Dorling decollision. Visual jumble. Filter to top-N or move to a cartogram form.
- **Max radius >100px at 1920×1080.** Circles dominate the frame; geography becomes invisible. Tune `maxRadiusPx` down.
- **Max radius <20px at 1920×1080.** Circles invisible at thumbnail scale. Tune up.
- **Missing legend** (`valueLabel` undefined and no other legend caption). The encoding is unread without a scale reference.
- **Identical fill color for all symbols when bivariate intent exists.** If the script's editorial frame distinguishes "winners" from "losers," reflect it in per-symbol color.
- **`linear` scale used "to make differences more visible."** That's the proportional-symbol lie restated. The right fix is to filter top-N, or use a log scale (not implemented in v1 — add when needed) or a small-multiples comparison.

---

## References

- Cleveland, W. (1985). *The Elements of Graphing Data*. Perceptual hierarchy for length/angle/area encodings.
- Tufte, E. *The Visual Display of Quantitative Information*. Lie factor; proportional symbol pitfalls.
- Healy, K. (2018). *Data Visualization: A Practical Introduction*. Discusses area-proportional symbols (§ 5.4).
- Bostock, M. (2013). "Let's Make a Bubble Map." Observable / d3.js tutorial — canonical sqrt-scale implementation.
- NYT graphics dept (various, 2020-present). COVID case maps; vaccine distribution; refugee flows.
- FT Visual & Data Journalism (2023). "Where the world's semiconductors are made."
- Reuters Graphics (2024). Refugee origin / flow maps.
- The Economist (recurring). Dorling election cartograms.
- Tilegrams.org. Hexagonal / Dorling tilegram gallery.
