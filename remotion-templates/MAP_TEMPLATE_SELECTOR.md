# Map Template Selector — Wall-Table

> One page. Pin it. When a script beat needs a map, look here BEFORE writing visual-spec JSON.
>
> Last updated: May 11, 2026

Six map templates with overlapping-but-distinct purposes. Picking wrong wastes hours of render time and produces visuals that mislead. This doc is the canonical "if your data looks like X, use template Y" lookup.

Full editorial rationale, canonical idioms, and failure modes live in the per-template dossiers under `references/template-research/`:
- [`choropleth-map.md`](references/template-research/choropleth-map.md)
- [`route-animation.md`](references/template-research/route-animation.md)
- [`atlas-plate.md`](references/template-research/atlas-plate.md)
- [`proportional-symbol-map.md`](references/template-research/proportional-symbol-map.md)
- [`cartogram-map.md`](references/template-research/cartogram-map.md)
- [`density-map.md`](references/template-research/density-map.md)
- [`map-annotations.md`](references/template-research/map-annotations.md) — overlay layer used by all six

---

## The selection question

The editorial sentence you're trying to render answers this:

```
What KIND of data → what GEOGRAPHIC ATTRIBUTE → which TEMPLATE
```

| Data shape | Geographic attribute | Template |
|---|---|---|
| **Rate / share / %** (per-region quantitative) | "Where is it high vs. low" | **ChoroplethMap** |
| **Count / magnitude per country** (5-12 countries, geographically spread) | "Which country has how many" | **ProportionalSymbolMap** |
| **Count / magnitude per country** (15+ countries in a dense region) | "Weight ≠ size" | **CartogramMap** (Dorling) |
| **Individual events / facilities** (100s of points) | "Where do they cluster" | **DensityMap** (hex / heatmap) |
| **Categorical membership** ("X bloc," "Y treaty") | "Who's in, who's out" | **AtlasPlate** (modern) |
| **Categorical in a historical period** | "In 1962, the world looked like…" | **AtlasPlate** + `aesthetic: "vintage"` |
| **Flow / direction** (A → B, supply chain) | "How things move" | **RouteAnimation** |
| **Hub-and-spoke** (one center, N destinations) | "All roads lead to…" | **RouteAnimation** + radial mode |
| **Cinematic globe** (cold-open, dramatic pivot) | "Here's our planet" | **AtlasPlate** orthographic + rotation |

---

## Decision tree

```
What does the script say?
│
├─ "% / rate / share per country" ─────────────────── ChoroplethMap
│
├─ "X count per country"
│   ├─ 5-12 countries, geographically spread ──────── ProportionalSymbolMap
│   └─ 15+ countries, dense region (EU, Africa) ───── CartogramMap
│
├─ "X events / facilities at specific locations"
│   ├─ ~10 points ──────────────────────────────────── ProportionalSymbolMap
│   └─ 100+ points ─────────────────────────────────── DensityMap
│
├─ "Members of X" / "before vs. after"
│   ├─ Modern context ──────────────────────────────── AtlasPlate (modern)
│   └─ Historical / Cold War / period ──────────────── AtlasPlate (vintage)
│
├─ "From A to B" / "supply chain" / "campaign"
│   ├─ Multi-segment phased reveal ─────────────────── RouteAnimation
│   └─ One hub + N destinations ────────────────────── RouteAnimation + radial
│
├─ "Spinning globe" / "looking at the planet" ────── AtlasPlate orthographic + rotation
│
└─ Editorial register signals:
    + "Show the contested line" ───────────────────── any + disputedBoundaries
    + "Where on the planet are we" ────────────────── any + inset
    + "Atlas plate feel" ──────────────────────────── any + graticule
    + "Name this place" ───────────────────────────── any + annotations
```

---

## Mode flags every map can wear

These compose on top of any base template:

| Flag | Effect | When |
|---|---|---|
| `annotations: [{ at, label, hierarchy }]` | Plex-typed labels with optional leader lines | Whenever the narration names a place |
| `graticule: { spacing: 15 }` | Parallels/meridians overlay | Atlas-plate register |
| `inset: { show: true }` | Locator globe in corner | Regional zooms |
| `disputedBoundaries: ["taiwan-strait", ...]` | Dashed rust polylines | Any geopolitics map |
| `terrain: true` | Mapbox 3D hillshade | Rare — when relief is the editorial point |
| `cameraTransition: "cinematic"` | Bezier easing between phase cameras | Dramatic phase transitions |
| `cameraTransition: "via-globe"` | Pull-back-then-push-in pose curve | Long-distance camera moves |
| `cameraDwell: { before: 0.2 }` | Hold start pose for 20% of transition | Add breath before motion |
| `aesthetic: "vintage"` (AtlasPlate only) | Tea-stained paper, brown ink, grain | Cold War / historical analogy |

---

## Mandatory overlays for data-bearing maps

Every map that shows quantitative or categorical data MUST include:

1. **Source annotation.** Bottom-right or bottom-left as `hierarchy: "tertiary"`, `emphasis: "mute"`, Plex Mono register. Editorial doctrine: no provenance = no data map. From `map-annotations.md` failure-mode #1.
2. **Region / feature annotations** for any place the narration names — country name in primary register, feature name (city, strait, port) in secondary.
3. **Disputed-boundary lines** when the map covers a region with a relevant dispute. Taiwan in any East Asia map. Kashmir in any South Asia map. Crimea in any Russia/Ukraine map.

---

## Quick-fail checklist (read before generating JSON)

If you can't answer "yes" to all of these, pick a different template:

- [ ] Does the data shape match the template? (rate→Choropleth, count→Proportional/Cartogram/Density, categorical→AtlasPlate, flow→Route)
- [ ] Does the editorial register match? (atmospheric→Mapbox-based, analytical→AtlasPlate, period→vintage)
- [ ] Is the data set the right size for the template? (Dorling needs ≥15 in dense region, Density needs ≥10 points)
- [ ] Is there a source annotation?
- [ ] Are named places labeled with primary/secondary annotations?
- [ ] Are relevant disputed boundaries opted in?

---

## Common mistakes — flagged by `map-audit` skill

These produce technically-valid renders that visually mislead. The new `map-audit` skill (sister to `script-audit` and `visual-concept`) checks for them:

1. **ChoroplethMap for count data.** "5 fabs in Taiwan, 0 in Iceland." Country fills make Iceland visually prominent. → ProportionalSymbolMap or DensityMap.
2. **ChoroplethMap for categorical with no value semantics.** All countries have a `fill` color, none have a numeric `value` or `noData` flag. → AtlasPlate modern.
3. **AtlasPlate modern for Cold-War / historical-analogy beat.** Aesthetic mismatch. → AtlasPlate + `aesthetic: "vintage"`.
4. **DensityMap with <10 points.** No useful aggregation. → ProportionalSymbolMap.
5. **CartogramMap for globally-spread data.** Decollision does nothing when circles are already far apart. → ProportionalSymbolMap.
6. **RouteAnimation with empty segments and no radial.** Schema rejection — but worth catching upstream so you don't waste visual-spec cycles.
7. **No source annotation on a data-bearing map.** Auto-flag; every data map needs provenance.
8. **Modern map of a region with named disputes, no `disputedBoundaries`.** Map covers Taiwan but doesn't show the median line; map covers South Asia but doesn't show LoC. Editorial omission worth flagging.

---

## References

- `references/template-research/*.md` — per-template dossiers with canonical idioms and failure modes
- `BRAND.md` → Cartography section — Meridian style + cartographic doctrine
- `tools/mapbox-meridian-setup.md` — custom Mapbox Studio style setup (~2 hr)
- `LESSONS.md` L98 (MapAnnotations), L99 (terrain opt-in), L100 (Meridian env vars)
