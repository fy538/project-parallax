# CartogramMap (Dorling) — Research Dossier

> Country circles, force-decollided. The right form when structural weight ≠ geographic size.
>
> Last updated: May 11, 2026 (initial)

## 1. The form's editorial purpose

When the editorial point is "Switzerland punches above its weight in finance," "Israel dominates global semiconductor design," "Singapore controls more global trade than its land area suggests" — geography itself is the *obstacle* to the argument. A choropleth makes Switzerland a sliver and Russia an empire. A proportional-symbol map puts a circle at Bern, but if there are too many neighboring countries with values, the circles overlap into illegibility.

Dorling cartogram: each region → one circle, sized by data value, **de-collided** via force simulation so no two overlap. The result is a topology-preserving abstract map — circle positions roughly track country centroids, but every circle is fully visible at its data size.

The visual contract: **data weight = visual weight, with geographic relationships preserved as context, not constraint.**

## 2. Canonical idioms

### 2a. Single-variable Dorling cartogram (the canonical form)
**References:** The Economist (recurring, election cartograms); Daniel Dorling's own work (*Area Cartograms*, 1996); Worldmapper.org (Dorling for ~700 indicators); FT (2024, EU-wide energy-use cartogram).

**Why it works:** One variable, one map, no overlap. Reads at video-scrubbing speed because every circle has its own readable space.

**Failure mode:** Used with <10 data points → the decollision does no work; better to use ProportionalSymbolMap so geographic positions are exact.

### 2b. Election cartogram (the political-science classic)
**References:** The Economist UK/EU election coverage; NYT US-state cartograms (often hex-grid variant instead of Dorling); Politico EU.

**Why it works:** Election results NEED equal visual weight per district (one person, one vote — not one acre, one vote). A choropleth of US presidential results misleads ("look at all that red!"). A cartogram restores fairness — each state's visual weight is its electoral weight, not its land area.

**Failure mode:** Geographic intuition is broken — viewers who don't know the layout get lost. Always pair with country labels.

### 2c. Continent-restricted Dorling (dense-region case)
**References:** FT EU coverage (multiple); Eurostat publications; African Development Bank reports.

**Why it works:** Within Europe (or sub-Saharan Africa, or SE Asia), 20+ countries cluster densely. ProportionalSymbolMap would overlap them; Dorling de-collides into a legible portrait of relative weight.

**Failure mode:** Dorling on a *globally distributed* dataset wastes the decollision work — most circles are already far apart. ProportionalSymbolMap is cheaper and more geographically honest in that case.

### 2d. Comparative Dorling (two cartograms side by side)
**References:** Worldmapper.org dual cartograms; The Economist "Big Mac" purchasing-power cartograms paired with GDP.

**Why it works:** Two cartograms of the same regions but different data make structural mismatches obvious — "look how big Switzerland gets when you size by financial assets vs. land area." For Parallax, this is a two-phase multi-pose composition.

**Failure mode:** Out of scope for v1 (we'd need a split-screen layout). Future enhancement: SplitCartogram template, OR run two CartogramMap compositions side by side in NLE.

## 3. General principles

The design-theory backbone:

- **Area-proportional radius** (same as ProportionalSymbolMap). Use `sqrt` scale; `linear` is the proportional-symbol lie.
- **Force simulation, not analytical layout.** The d3-force `forceCollide` + `forceX`/`forceY` combo is the canonical Dorling implementation. Pure analytical decollision (Voronoi-based, geometric packing) gives prettier results but requires order-of-magnitude more code and runtime.
- **Convergence vs. faithfulness trade-off.** Higher `xyStrength` (pull toward true centroid) preserves geography but increases overlap; lower xyStrength gives cleaner decollision but circles drift far from where they "should" be. Default 0.1 is Dorling's original recommendation — preserves regional clustering, tolerates 10-30px drift per circle.
- **Topology preservation** is the design goal. Neighboring countries should remain visually adjacent — not necessarily in their exact relative positions, but recognizable.
- **Iterations ≈ 120** for stable convergence at 30 circles. Below 80 the simulation has visible residual overlap; above 200 returns diminishing visual improvement at increasing render cost.
- **Render largest-first** so small circles are on top. Same convention as ProportionalSymbolMap.
- **Faint coastline reference** at ~18% opacity gives spatial context without competing with the data circles. Optional via `showCoastlines`.

## 4. Recommendation for Parallax

**Default form:** Dorling cartogram with default xyStrength 0.1, 120 force iterations, area-proportional circles in rust (`palette.rust`) with white-ish stroke, faint coastline reference at 18% taupe opacity, three-circle legend bottom-right.

**Editorial register:** More abstract than AtlasPlate/ProportionalSymbolMap. The cartogram says "we're showing you weight, not territory" — that's its argument. Use the title block to name what the data IS (e.g., "European Union by population, 2024"); the cartogram does the rest.

**When CartogramMap vs. ProportionalSymbolMap:**

| Use Cartogram when | Use ProportionalSymbolMap when |
|---|---|
| 15+ data points, dense region | 5-12 data points, geographically spread |
| Overlapping circles would obscure | Circles separate naturally |
| Abstract / structural register fits | Geographic-precise register fits |
| Editorial: "weight ≠ size" | Editorial: "where" + "how much" |

If your data is 8 countries across 4 continents, use **ProportionalSymbolMap**. If your data is 27 European countries, use **CartogramMap**.

## 5. Current template alignment

`CartogramMap.tsx` (initial, May 11 2026):

| Canon | Implemented? | Notes |
|---|---|---|
| Single-variable Dorling | ✓ | Default behavior. |
| Election cartogram pattern | ✓ | Same form, just different data. Labels inside large circles. |
| Continent-restricted | ✓ | Works for any subset — pass only those countries' data. |
| Comparative side-by-side | ✗ | Out of scope v1. Use two compositions in NLE. |
| Faint coastline reference | ✓ | `showCoastlines: true` default. |
| Labels-inside-large-circles | ✓ | Empirical 16px-radius threshold — Plex Sans label inside; above for smaller circles. |
| Per-circle color override | ✓ | `data[].color`. |
| d3-force decollision | ✓ | Synchronous in useMemo, 120 iterations, deterministic. |

**Performance notes:**
- Decollision runs ONCE per phase (memoized on `phase.data` reference). ~30 circles × 120 iterations ≈ 20-50ms one-time cost when phase data changes; zero per-frame cost.
- Coastline paths memoized on `basePathGen` (changes only when projection/padding does).
- Symbols sorted largest-first for stable SVG render order.

## 6. Specific upgrades proposed

Ranked by effort/impact:

1. **Comparative split-screen Dorling.** (~half day)
   Two cartograms side by side, same regions, different variables. The "weight ≠ size" + "weight A ≠ weight B" double argument. Could be a `SplitCartogram` template or a layout option.

2. **Hex cartogram variant.** (~1 day)
   Instead of free-floating circles, snap each country to a hex tile in a topology-preserving grid. NYT US-state convention. Needs a static hex-tile data file (e.g., tilegrams.org).

3. **Animated transitions between phases.** (~half day)
   Currently each phase computes its layout independently. Animate circle positions + radii between phases so countries appear to "morph" rather than reset.

4. **Region-restricted views.** (~1 hr)
   Currently the projection is world-fit. Add `region` field (`"europe" | "asia" | "americas" | "africa"`) for tighter framing.

5. **Configurable label placement strategy.** (~1 hr)
   Currently labels go inside large circles, above small ones. Add `labelPosition: "inside" | "above" | "auto"` per data point.

## 7. Failure mode flags

These should always trigger an audit finding when seen:

- **CartogramMap with <10 data points.** No decollision needed. Use ProportionalSymbolMap.
- **`scaleType: "linear"`.** The proportional-symbol lie (encodes value²). Always sqrt.
- **No source annotation.** Same rule as all data-bearing maps. Every CartogramMap ships with `data.source`.
- **Cartogram of rate/density data** (per-capita, %). The cartogram form encodes COUNT visually. For rates, use ChoroplethMap.
- **xyStrength > 0.3.** Too much geographic pull → circles overlap → defeats the cartogram. Stay in [0.05, 0.2].
- **xyStrength < 0.05.** Too little geographic pull → circles drift away from their true positions → loses topology. Stay above 0.05.
- **`showCoastlines: false` without compelling editorial reason.** Coastlines anchor the abstract render; removing them is a stronger choice (pure-data plot, no geography). Justify in the script.
- **Country labels rendered inside circles smaller than 16px radius.** Truncates / illegible. The component handles this automatically (small circles label *above*); flag if author manually overrides.

---

## References

- Dorling, D. (1996). *Area Cartograms: Their Use and Creation.* The canonical text.
- Worldmapper.org (https://worldmapper.org). 700+ Dorling cartograms for every imaginable indicator.
- The Economist graphics dept (recurring). Election cartograms; "Big Mac" cartograms.
- Tilegrams.org. Hex / Dorling tilegram gallery (US, world, EU).
- Tobler, W. (2004). "Thirty-Five Years of Computer Cartograms." *Annals of the AAG.*
