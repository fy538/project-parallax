# AtlasPlate — Research Dossier

> Pure-SVG editorial cartography in the Tufte / Fortune / Bartholomew register.
>
> Last updated: May 11, 2026 (initial)

## 1. The form's editorial purpose

When the geographic point is **structural** — *which countries belong to a category*, *who is inside vs. outside a regime*, *what the political map looked like in 1949* — and the atmospheric register of Mapbox tiles would distract, you want an **atlas plate**. A flat-art map. Land fills, country borders, named places, no terrain, no labels-from-routing-data, no shading.

This is the form classical print atlases reached for. Bartholomew's *Times Atlas*, the Fortune editorial maps of Burtin/Bayer, the political-history insets of mid-century textbooks. The viewer reads it as *the cartographer's argument about geography*, not as a satellite photo. It's also the form that survives best at 8-second scrubbing speed: high-contrast color blocks register instantly; ornate satellite imagery does not.

AtlasPlate is the template for moments where Parallax's editorial register calls for an atlas, not a map.

## 2. Canonical idioms

### 2a. Single-color highlight on neutral land
**References:** NYT (2022, "How NATO has expanded since 1949"); FT (2023, OPEC+ membership map); Bloomberg Originals (2021, "The Chip War" — semiconductor manufacturer countries).

**Why it works:** One ink color on bone land is the strongest figure-ground contrast in the brand palette. Reads instantly even at thumbnail scale. The eye sees "this set" and the cartographer doesn't have to explain.

**Failure mode:** Two different highlights on the same plate dilute the figure-ground. Two-category maps need two-tone treatment (idiom 2b) and should NOT share a phase with a single-highlight plate.

### 2b. Two-tone allegiance map
**References:** Economist (Cold War retrospectives, recurring); NYT (Oct 2023, Israel-Palestine recognition map); Reuters (multiple, NATO/Russia alignment).

**Why it works:** Two contrasting fills tell a relational story without any text — "these are with us, those are with them." Parallax's blue (`#4A7BA7`) for Western and red (`#A64D46`) for opposing reads cleanly. The visual asymmetry (blue tends to read calmer than red) does editorial work.

**Failure mode:** When the third category enters (non-aligned, neutral), the visual contract breaks. Move to a 3-color sequential ramp (sequential, not categorical) or split into multiple phases.

### 2c. Historical layering (multi-phase reveal)
**References:** NYT Upshot (2022, "How Russia's invasion has reshaped Europe"); FT (2018, "How the European empire dissolved"); Economist (2014, "100 years of Middle East borders").

**Why it works:** Geography that changes over time *needs* phasing. Showing all states simultaneously confuses chronology. Two or three phases with smooth camera transitions between focus regions gives the viewer the *narrative* of geographic change.

**Failure mode:** More than 4 phases on one map exhausts attention. If the story has more states, break into separate AtlasPlate compositions.

### 2d. Inset detail callout (zoom-and-focus)
**References:** National Geographic political atlases; FT regional supplements; NYT election maps with state-level detail.

**Why it works:** A primary world or continental view + a secondary zoomed inset focused on one country / region lets viewers see "where" and "what" simultaneously. In AtlasPlate this is implemented via per-phase `focus.iso3` — the camera zooms to those countries.

**Failure mode:** Inset and main view shown at very different scales but without a visual link (no leader, no boxed extent) leaves viewers unmoored. Future enhancement: explicit "extent box" annotation in the main view.

### 2e. Graticule-as-signature
**References:** Bartholomew (1972, plates throughout); Burtin/Bayer Fortune Atlas (1960); USGS topographic conventions; National Geographic standard plate.

**Why it works:** The parallels-and-meridians grid is the cartographic apparatus — the system the cartographer uses to *make* maps. Including it as a visible (but quiet) overlay signals "this is an atlas, not a photo." On-brand for Parallax because the channel name *is* a coordinate-system concept.

**Failure mode:** Graticule pitched too high (>20% opacity) competes with country fills and reads as cage. Default 10% works.

## 3. General principles

The design-theory backbone:

- **Figure-ground hierarchy** (Tufte). Land = figure on light, ocean = ground on light. Reverse for dark mode. Highlighted countries are *figure on figure* — a third register, the editorially-named category.
- **Equal-area projections for quantitative honesty** (Robinson, Šavrič, Tobler). Mercator inflates Russia/Greenland and shrinks Africa — political-economic distortion. Equal Earth (default) and Natural Earth (compromise) avoid this. Mercator opts-in only for shots where conformality matters (compass bearings, navigation history).
- **Two type families maximum** (Bringhurst). Plex Sans for editorial labels + Plex Mono for evidence/source notes.
- **Hue reserved for emphasis, not category enumeration** — a category map with 7 colors looks like an infographic, not an argument. Use sequential or diverging ramps for ≥3 categories; categorical only for 2-3 named groups.
- **The graticule is faint by default.** Per Tufte's data-ink rule, the grid is *axis*, not data.

## 4. Recommendation for Parallax

**Default form:** Single-color highlight on bone land + ink borders + 15° graticule at 10% opacity, **Equal Earth** projection, source attribution in FooterStrip.

**Multi-phase strategy:** Two or three phases, each with `focus.iso3` to zoom into the relevant region. Camera transitions auto-handled via outer SVG transform (cheap browser GPU compositing). Phase titles render in the lower-left corner per Parallax convention.

**Annotation strategy:** Use `MapAnnotations` for region names (`primary`), specific features (`secondary`), and the mandatory source note (`tertiary`). Per-phase country labels via `countries[].label` are projected at each country's centroid and fade in/out with the phase.

**When AtlasPlate vs. ChoroplethMap:**

| Use AtlasPlate | Use ChoroplethMap |
|---|---|
| Categorical "members of X" / "before vs. after" / "treaty signatories" | Quantitative fills (per-capita, share, rate) |
| Analytical register; flat aesthetic intended | Atmospheric register; terrain context relevant |
| No Mapbox token available / offline render | Need precise vector-tile labels at multiple zooms |
| Tight typographic control over labels | Want stock Mapbox label set |
| Stable, locked baselines (no network deps) | Globe pivots, terrain, hillshading desired |

## 5. Current template alignment

`AtlasPlate.tsx` (initial implementation, May 11 2026):

| Canon | Implemented? | Notes |
|---|---|---|
| Single-color highlight on neutral land | ✓ | Default behavior — pass `countries[].fill` as the highlight hex. |
| Two-tone allegiance map | ✓ | Two colors in the same phase's `countries[]`. |
| Multi-phase reveal | ✓ | `phases[]` with per-phase fills + camera focus. |
| Inset detail callout | ⚠ Partial | Per-phase `focus.iso3` zooms in, but no "extent box" on a parent view yet. v2. |
| Graticule | ✓ | Reuses the SVG graticule renderer; minor + 30° major. |
| Source attribution | ✓ | Renders in FooterStrip from `data.source`. |
| Annotations | ✓ | Reuses `MapAnnotation` schema; rendered as SVG text projected per-frame. |

**Performance characteristics:**
- Country paths memoized (177 paths generated once per `(projection, viewport, framePadding)` tuple).
- Camera animation via SVG outer `<g transform="...">` — does NOT re-project per frame.
- Graticule paths memoized.
- Per-frame cost: ~177 `<path>` reconciliations (fill only changes per phase). Should comfortably hold 30fps in Remotion's render pipeline.
- `orthographic` projection animates rotation via `phase.rotation` (added May 11 2026). The outer-`<g>` transform is bypassed; the projection is re-rotated per frame. `focus` settings are ignored for orthographic — use `rotation` instead.

**Divergences from canon:**
- No automatic compass rose or scale bar. Editorial decision — Parallax's compositions aren't navigation aids. Add if a specific shot calls for it.
- No inset-box-on-parent for the zoom-and-focus idiom. Add when a script needs it.
- No "extent indicator" between consecutive phases that focus on overlapping regions. Future enhancement.

## 6. Specific upgrades proposed

Ranked by effort/impact:

1. **Extent-box annotation overlay.** (~3 hr)
   Optional rectangle drawn in the parent (world) view showing the next phase's zoomed extent. Standard editorial cartography device.

2. **Inset detail on parent view.** (~half day)
   Render a small inset in a frame corner showing a zoomed view of a specific country/region, while the main view stays at world. Similar to MapInset but inverted (parent is wide, inset is detail).

3. **Color-tween at phase boundaries.** (~2 hr)
   Currently fills swap instantly at phase boundaries. For highlight-color *changes* (same country in two phases with different fills), lerp the hex over `sec(0.4)` for a smoother editorial feel.

4. **Disputed-boundary support.** ~~(~half day)~~ **Closed May 11, 2026.**
   Set `disputedBoundaries: true` (or pass an array of tags like `["taiwan-strait", "nine-dash"]`) and AtlasPlate renders dashed rust polylines for the curated set in `src/utils/disputedBoundaries.ts` — Taiwan Strait median line, S China Sea nine-dash, Kashmir LoC, Crimea post-2014 line, Western Sahara berm. Each carries an editorial `notes` field explaining what the line is. Schema validates against `ALL_DISPUTE_TAGS` so typos fail fast at validation.

5. **Globe rotation for `orthographic`.** ~~(~half day)~~ **Closed May 11, 2026.**
   Set `projection: "orthographic"` and `phase.rotation: [lon, lat]` for each phase. The projection's rotate parameter animates between phases (shortest-arc longitude, linear latitude), giving the RealLifeLore-style spinning-earth cold-open effect. Per-frame re-projection cost is ~9ms (177 paths × ~50μs); acceptable for short cinematic shots, document for longer compositions.

6. **Higher-resolution base map for tight zooms.** (~1 hr to wire, optional)
   `world-atlas/countries-50m.json` (~740kb) instead of 110m (~105kb) when zoomed in past a threshold. Adds detail but bloats bundle.

## 7. Failure mode flags

These should always trigger an audit finding when seen:

- **AtlasPlate with quantitative data (per-capita, share, rate).** Wrong template — use ChoroplethMap with a sequential ramp. AtlasPlate's flat color-block aesthetic is for *categorical* data.
- **Mercator projection on a world-scale plate.** Russia and Greenland inflated. Mercator opts-in only for conformality-critical shots (compass directions, historical navigation).
- **More than 4 phases.** Attention budget. Split into multiple AtlasPlate compositions.
- **No source annotation.** Atlas plates without provenance read as opinion, not evidence. Every AtlasPlate ships with `data.source`.
- **Graticule opacity > 20%.** The grid becomes a cage. Default 10%.
- **Highlight color in the rust family on bone land WITHOUT a non-rust ocean.** The default ocean color is also bone-tinted; rust highlights merge into the ocean's halo. Pick higher-saturation rust (closer to `#A64D46`) or use a different ocean shade.
- **Country `iso3` codes that aren't in ISO 3166-1.** Common typos: `UK` (use `GBR`), `IRN` not `IRA`, `BAH` not in the standard (use `BHR` Bahrain or `BHS` Bahamas). The `getCountryByAlpha3` lookup returns null for unknown codes; the country silently doesn't highlight.
- **Long compositions (>10s) on `orthographic` projection.** Per-frame re-projection costs ~9ms/frame; multiplied across a long composition the render time adds up. For globe shots > 10s, accept the cost or switch to a non-orthographic projection (which uses cheap outer-`<g>` transform animation instead).

---

## Adjacent register — Vintage / period-atlas aesthetic

AtlasPlate gains a `aesthetic: "atlas" | "vintage"` flag (May 11, 2026). Default `"atlas"` is the modern Tufte/Fortune flat cartography we ship; `"vintage"` invokes a mid-century period-atlas register for Cold War / historical-analogy episodes.

**What vintage swaps:**
- **Palette** (`mapConfig.vintageStyleColors`): tea-stained paper ocean (`#DDD0B3`), aged paper land (`#E8DCC0`), brown ink borders (`#4A3320`).
- **Paper grain**: SVG `feTurbulence` filter pushed toward warm brown via `feColorMatrix`, applied as a `mix-blend-mode: multiply` overlay at ~50% opacity. The result is sepia-toned grain texture that tints lights and darkens shadows like real aged paper.
- **Vignette**: warm radial gradient that darkens the frame corners, mimicking photographic-print falloff in period reproductions.

**Highlight palette** (`vintageStyleColors.westernHighlight` / `easternHighlight`): muted cold-war navy (`#5F7DA0`) and faded oxblood (`#9B4B3F`). Authors can use either the vintage pair (for Cold War analogies) or any palette token (for other periods).

**When to use:**
- Cold War analogy episodes — prisoners-dilemma's deterrence framing is the canonical fit.
- "Period reference" shots — showing a *historical* map as historical, not as live data.
- Atmospheric chapter cards that should signal era.

**When NOT to use:**
- Live-data shots (current-year choropleths, real-time event maps). Vintage register reads as "old artifact"; don't apply it to current data.
- Dark-mode compositions. Vintage is a light-mode-only register; the code silently honors `backgroundVariant: "dark"` over `aesthetic: "vintage"`.

**Reference samples:** see `catalog/Maps.tsx → atlasColdWarVintage` for the canonical Cold War blocs treatment.

**Failure modes:**
- **Vintage on live data** (e.g., 2024 election results). The register lies about the data's age. Pick a single register per shot; never mix.
- **Aggressive grain opacity** (>60%). Reads as Instagram filter, not period reference. Default 50% is at the upper end; reduce, never increase.
- **Vintage WITHOUT period-appropriate content.** A vintage map of 2025 trade flows looks weird. If the data isn't historical, the aesthetic isn't either.

## References

- Bartholomew, J. (1972 ed.). *The Times Atlas of the World*. Plate typography + hierarchy reference.
- Burtin, W. & Bayer, H. (1955-60). *Fortune* magazine editorial cartography. The corporate-modernist atlas register Parallax explicitly draws from.
- Šavrič, B., Patterson, T., Jenny, B. (2018). "The Equal Earth map projection." *International Journal of GIS*.
- Tufte, E. *Envisioning Information.* Data-ink, ground/figure, small multiples.
- Robinson, A. (1985). "Arno Peters and his new cartography." *American Cartographer*.
- USGS Topographic Map Symbols (2017 ed.).
- Healy, K. (2018). *Data Visualization: A Practical Introduction.* Sequential vs. categorical color rationale.
- Natural Earth Data (https://www.naturalearthdata.com). Public domain TopoJSON shipped via `world-atlas` npm package.
