# DensityMap — Research Dossier

> Point-density visualization via deck.gl aggregation layers. Where things concentrate.
>
> Last updated: May 11, 2026 (initial)

## 1. The form's editorial purpose

When the data is *individual events / facilities* (not country aggregates) and the editorial point is *where they cluster*, you want density visualization. Chip fabs across Asia. Naval base concentrations in the South China Sea. Refugee origin clusters. ACLED conflict events. Astronomical observatories. Scientific stations in Antarctica.

DensityMap solves a specific failure mode: when ProportionalSymbolMap has too few data points and ChoroplethMap aggregates away the within-country variation. With 30+ individual facility locations, neither traditional form reads well — you need GPU-accelerated aggregation that turns 100s of points into a legible spatial argument.

## 2. Canonical idioms

### 2a. Hex-bin density (the canonical form)
**References:** Uber's deck.gl demos (taxi pickup density — the form's modern definition); FT (2024, "Where the world's semiconductors are made" — fab density across Asia); NYT graphics dept (multiple). 

**Why it works:** Hexagons tessellate perfectly with no gaps, are visually distinguishable from grid maps (signal: "this is aggregated data"), and produce countable bins. Reads as "this region has N fabs" at video-scrubbing speed.

**Failure mode:** Hex size mismatched to data spread — too small and bins read as scattered points; too large and the whole map is one hex. Calibrate to ~5-15 bins per major cluster.

### 2b. Kernel-density heatmap (continuous-gradient)
**References:** NYT COVID hot-spot maps (recurring, 2020-22); Bloomberg crime density maps; Carto / Felt heatmap demos. 

**Why it works:** Smooth gradient reads as "intensity" — perfect for events that don't have discrete locations (where conflict concentrates, where wealth gathers). The eye sees hotspots without bin boundaries imposing artificial structure.

**Failure mode:** Heatmaps imply *continuous phenomena*. Using heatmap for countable facilities (fabs, bases) misleads — implies the value at a point in between two fabs is meaningful when it's just smoothing.

### 2c. Grid (square-bin) density
**References:** Older GIS publications (pre-hex era); Tilegram-style aesthetic. 

**Why it works:** Rarely. Squares carry "data table" connotations that hex doesn't. Reserved for cases where the underlying data IS gridded (satellite raster cells, climate model grid cells).

**Failure mode:** Used by default. Hex is almost always the better choice for editorial maps.

### 2d. 3D hex extrusion (the "fancy" form)
**References:** Uber's original demo (3D taxi pickups); Bloomberg billionaire wealth maps. 

**Why it works:** Adds a third dimension (height = aggregate value) that doubles the legibility of magnitude differences. Looks impressive.

**Failure mode:** Easy to overdo. 3D extrusion is a stylistic commitment — the whole composition needs to support it (pitch > 30°, cinematic camera). For Parallax's analytical register, flat hex is usually right; reserve 3D for atmosphere shots.

**Parallax status:** Implemented as `extruded: false` (flat). Add an `extruded` flag if an episode needs it.

## 3. General principles

The design-theory backbone:

- **Aggregation is editorial commentary.** Hex/heatmap/grid each impose a structure on raw points. The choice signals to the viewer "I'm telling you to look at this *kind* of pattern." Choose deliberately.
- **Hex bin size determines the story.** A 50km hex tells "city cluster" stories; 250km tells "continental cluster"; 1000km tells "hemispheric." Match bin size to the editorial unit.
- **Sequential color ramps for counts; diverging only when the data has a midpoint.** Standard choropleth rule. Default ramp is paper → bone → gold → rust (sequential warm, brand-aligned).
- **Heatmap radius is in pixels, not meters.** Different from hex/grid (meters). This matters for zoom-aware tuning — a 30px heatmap radius reads consistently regardless of zoom; a 100km hex radius reads differently at zoom 2 vs. zoom 6.
- **Aggregation layers respect map projection.** Hex bins are projected to screen, so they look correct under any base projection. No special handling needed.
- **Opacity below 100%** so the basemap shows through. Default 75% keeps geographic context visible.

## 4. Recommendation for Parallax

**Default form:** Hex bins (`mode: "hex"`), 250km cell size, 92% coverage, 75% opacity, sequential warm ramp (paper → bone → gold → rust → umber), light-mode Mapbox basemap.

**Editorial register:** DensityMap is one step MORE atmospheric than ChoroplethMap and TWO steps more than AtlasPlate. Pair with Mapbox terrain off (terrain + density is double-aggregation, confusing). Use the cinematic Mapbox style for high-impact shots; the muted Meridian style for analytical ones.

**When DensityMap vs. ProportionalSymbolMap vs. ChoroplethMap:**

| Use DensityMap when | Use PSM when | Use Choropleth when |
|---|---|---|
| Individual events / facilities (100s+) | Country aggregates (~10) | Per-region rates (50+) |
| "Where do they cluster?" | "Which country has how many?" | "What's the share / rate?" |
| Lat/lon points | iso3-keyed values | iso3-keyed rates |

If your data has individual facilities + you have 30+ of them, **always DensityMap**. If you have <20 facilities, **ProportionalSymbolMap** with manual sized circles wins on geographic precision.

## 5. Current template alignment

`DensityMap.tsx` (initial, May 11 2026):

| Canon | Implemented? | Notes |
|---|---|---|
| Hex-bin density | ✓ | `mode: "hex"` (default), `cellSize` in meters. |
| Kernel-density heatmap | ✓ | `mode: "heatmap"`, `cellSize` in pixels. |
| Grid (square-bin) | ✓ | `mode: "grid"`. Reserved for raster-derived data; rarely the right choice. |
| 3D extrusion | ✗ | Out of scope v1. `extruded: false` hardcoded. |
| Per-phase point sets | ✓ | Each phase has its own `points` array. |
| Per-phase camera | ✓ | `phase.camera` override. |
| Weighted aggregation | ✓ | `point.weight` defaults to 1; sum-weighted bins. |
| Annotation overlay | ✓ | Reuses MapAnnotation schema, memoized phaseWindows. |
| Locator inset | ✓ | Same `MapInset` as Mapbox templates; opt-in via `data.inset.show`. Especially useful for regional zooms. |
| Bivariate encoding (size + color) | ✓ | Opt-in: when ANY point has `colorWeight`, hex/grid bins use it for color while `weight` still drives size. `colorAggregation: "sum" \| "mean" \| "max"` picks how to combine. Heatmap silently ignored (univariate by design); warnIf fires. |

**Performance notes:**
- GPU aggregation handles 1000s of points easily. The bottleneck would be data marshaling (point arrays from JSON), not rendering.
- Aggregation layer is recreated when `phase.points` reference changes (typically once per phase). Layer's `opacity` modulates per frame via `.clone({ opacity })` — deck.gl diffs and only re-uploads buffers if data actually changed.

## Adjacent capability — bivariate encoding (size + color)

DensityMap supports a bivariate "size = X, color = Y" mode for hex and grid (added May 11, 2026). Use cases:

| Editorial sentence | `weight` (size) | `colorWeight` (color) | `colorAggregation` |
|---|---|---|---|
| "More fabs in this hex, but the newer ones are in Asia" | 1 per fab | year of opening | `"mean"` |
| "Bigger fabs concentrated here, with the most advanced node sizes" | wafer-output | inverse process-node (smaller = brighter) | `"max"` |
| "Conflict events doubled, with severity rising" | event count | severity index | `"mean"` or `"max"` |

**The principled approach:** size encodes COUNT (or sum-magnitude) of a category; color encodes a per-item ATTRIBUTE of those items. Mixing these two dimensions on one bin reads cleanly when:
1. The size and color stories are CORRELATED (most-fabs region is also most-advanced).
2. OR the contrast is INTENTIONAL (lots-of-bases, but mostly old ones).

**Heatmap is univariate-only.** Kernel-density estimation is mathematically univariate — it smooths a single weight value into a continuous field. We `warnIf` when `colorWeight` is attached to heatmap data so authors get the message at dev time.

**Common failure mode:** using bivariate for two ARBITRARY dimensions that don't have a story relationship. Bivariate tells "size and color are RELATED in this geographic distribution." If they're independent, viewers can't read it; use a small-multiples form instead.

## 6. Specific upgrades proposed

Ranked by effort/impact:

1. **3D extrusion mode.** (~30 min)
   Add `extruded?: boolean` and `elevationScale?: number`. Hex bins become 3D bars (height = aggregate value). Dramatic for cinematic shots. Reserve for editorial register that supports it. Bivariate becomes especially powerful in 3D (size on ground × color on height).

2. **Per-phase point appearance animation.** (~1 hr)
   Currently points appear all-at-once when the phase starts. Could animate them in (sorted by weight, biggest first) for a "watch the map fill up" effect.

3. **Bin-count auto-tuning.** (~1 hr)
   `cellSize: "auto"` computes a sensible default from data bounds (aim for ~10 visible bins per major cluster). Reduces author tuning burden.

4. **Filtered hover annotations.** (~half day)
   Author labels specific bins ("this hex contains TSMC + UMC, 5 fabs"). v1 keeps annotations free-floating; this would attach them to bin centers.

5. **Time-series mode.** (~1 day)
   Animate point appearance over a date axis (point.timestamp). Watch fabs come online globally 1990 → 2024. Different from `phases` because it's CONTINUOUS not stepped.

## 7. Failure mode flags

These should always trigger an audit finding when seen:

- **DensityMap with <10 points.** Aggregation does no useful work. Use ProportionalSymbolMap or AtlasPlate instead.
- **`mode: "heatmap"` for countable facilities.** Heatmap implies continuous intensity. For countable things, use hex.
- **`mode: "grid"` without raster-derived data.** Grids read as data tables, not natural patterns. Default to hex.
- **Hex cellSize too large** (single hex covering the whole region of interest). Lose the "where it clusters" signal. Reduce to ~5-15 bins per cluster.
- **Hex cellSize too small** (bins read as scattered points). The aggregation isn't aggregating. Increase.
- **No source annotation on a data-bearing density map.** Always required. Cite the point source (SEMI, ACLED, etc.).
- **Density overlay with `terrain: true`.** Double-aggregation — terrain shading + density bins compete. Pick one or the other.
- **Diverging color ramp on count data.** Counts don't have a midpoint. Use sequential.

---

## References

- Uber Engineering blog (2018-present). The deck.gl `HexagonLayer` + `HeatmapLayer` reference implementations and design rationale.
- Cleveland, W. (1985). *The Elements of Graphing Data.* Density encoding via area / position.
- Tobler, W. (1970). "First law of geography: everything is related to everything else, but near things are more related than distant things." The theoretical foundation for density aggregation.
- FT Visual & Data Journalism (2024). Semiconductor manufacturing density maps.
- NYT Graphics (2020-22). COVID case-density visualizations.
- Carto.com / Felt.com / deck.gl gallery. Production exemplars.
