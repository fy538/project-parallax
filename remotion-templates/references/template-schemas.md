# Template Schemas Reference

> Canonical field definitions for every Remotion template's JSON data file.
> Visual-spec reads this before generating any JSON. Last updated: May 16, 2026.

## Universal conventions (apply to every cartesian chart)

These behaviors now apply automatically — you don't need to opt in:

- **Y-axis domain inference**: charts using `niceTicks` (TimeSeriesChart, DataChart bar variant) automatically clamp y-axis at 0 for non-negative data, snap min/max to round numbers (1k, 2k, 5k…), and generate ticks at integer multiples of nice spacing. Don't pass `yRange` unless you specifically need to override.
- **Auto-categorical colors**: SankeyFlow nodes, StatReveal bars, DecisionTree nodes, StrategicLandscape actors auto-assign distinct colors when `color` is omitted on individual items. Sequence: muted blue → rust → gold → umber → walnut → taupe (wraps).
- **Source attribution**: every chart that has a `source` field renders it consistently bottom-right via the shared `<SourceAttribution>` component. No need to hand-position.
- **Title overflow**: `<TitleBlock>` auto-shrinks long titles down to h3 size before they overflow. You can still split into title + subtitle for very long headings.
- **Dev warnings**: when a chart's data is suspect (title > 80 chars, empty series, missing source), Studio will emit a one-time `console.warn` per template per session. Watch the DevTools console.

### Anticipatory entrance timing (`anticipatoryStartFrame`)

Parallax follows the Economist's 150ms anticipatory-reveal pattern: text begins settling *before* the narration word lands, so that by the time the viewer hears the word, the type is already at rest. Landing on the word reads as a caption; settling before it reads as a reveal. The `useEntrance()` hook and the `_direction.syncPoints[]` block both consume an `anticipatoryStartFrame` offset that shifts the entrance ~5 frames (150ms at 30fps) earlier than the literal sync point. This is applied automatically by **TitleTransition**, **KineticTypography**, **StatReveal**, **BayesianUpdate**, and **TitleBlock**. Don't author this field by hand — the pattern is on by default. If a moment needs the type to land *on* the beat instead of before it (rare; usually for percussive stat reveals), set `anticipatoryStartFrame: 0` in the `_direction` override.

### Text-animation register (`_direction.textAnimation`)

Selects which named text-animation technique a segment uses. Eight atomic primitives + three composite patterns; the composite name implies an editorial register (`quote-attribution` = Typewriter + serif-italic attribution + cursor, not just any quote rendering). Pick by editorial intent, not aesthetic — every technique makes an implicit claim about the text. Full doctrine: [`project/TEXT_ANIMATION_REGISTER.md`](../../project/TEXT_ANIMATION_REGISTER.md). Selection rules + anti-patterns: [`skills/visual-spec/SKILL.md`](../../skills/visual-spec/SKILL.md) → "Text-animation register".

| Value | Family | Use for |
|---|---|---|
| `typewriter` | atomic | Char-by-char reveal — quotes, witness testimony, archival cables. Implicit claim: "this is being said". |
| `tracking-in` | atomic | Letter-spacing collapse — proper nouns, place reveals. Implicit claim: "this entity matters". |
| `reveal-mask` | atomic | Gradient wipe — headline-weight reveals, single-word punchlines. Implicit claim: "this is the moment". |
| `underline-draw` | atomic | Hairline grows under text — quiet emphasis on a coined term or proper noun. |
| `number-ticker` | atomic | Eased count-up — stat reveals, vote tallies, market figures. Implicit claim: "this is the magnitude". |
| `scramble` | atomic | Glyph-shuffle into final string — cryptic / cipher / spy-thriller register. Reserve for ≤2× per episode. |
| `backspace` | atomic | Type-then-delete-then-retype — the bounded-analogy "actually" beat. Implicit claim: "I want to revise that". |
| `word-cascade` | atomic | Word-by-word fade-in stagger — editorial-safe default. |
| `definition-reveal` | composite | term + pinyin + translation + citation choreography (the 卡脖子 / *juguo* pattern). |
| `stat-caption` | composite | NumberTicker + caption + source with eased stagger. |
| `quote-attribution` | composite | Typewriter quote + serif-italic attribution (display OR archival register). |

Authored at the segment level: `"_direction": { "textAnimation": "quote-attribution" }`. KineticTypography dispatches automatically; archival quotes (year 1900–1979 + document markers in attribution) auto-route to the archival sub-register without authoring intervention.

### Cross-episode callbacks (`_direction.isCallback`)

Boolean flag — when `true`, the rendered text/term receives a one-time accent pulse (color overlay + underline flash + indicator dot) that marks it as a recurring concept introduced in a prior episode. Visual-spec determines this by checking `data/concepts.json` for prior `appearances[]` entries via the [`tools/concepts/lookup.py callback-check`](../../tools/concepts/lookup.py) CLI. Authors don't usually set this by hand; let the skill emit it. Pulse peaks at 0.75 opacity (deliberately under 1.0) so it reads as continuity, not interruption.

### Per-element sync (`_direction.syncPoints[]`)

`syncPoints` is positionally indexed against the template's rendered elements. The seven analytical templates that adopted per-element D17 (AnnotatedImage, ArcDiagram, BumpChart, EscalationLadder, FrameworkDiagram, HorizontalTimeline, NetworkDiagram) consume `syncPoints[i]` as the narration cue for the `i`th entity (node, callout, row). Templates falling back to legacy single-cue behaviour use `syncPoints[0]` only. Authors emit syncPoints from PACE annotations in the script; see [`project/DIRECTING_LANGUAGE.md`](../../project/DIRECTING_LANGUAGE.md) → "Per-element anticipatory reveals".

## Common Fields

Every template data object includes these fields:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `episode` | string | yes | Episode ID, e.g. `"silicon-trap"` |
| `title` | string | yes | Composition title shown on screen |
| `subtitle` | string | no | Secondary text below title |
| `durationSec` | number | no | Total duration in seconds (default varies by template) |
| `backgroundVariant` | `"dark"` \| `"light"` | no | Theme mode. Default: `"light"` (primary). Use `"dark"` for dramatic moments only. |
| `backgroundTint` | string | no | Hex color for subtle emotional temperature tint |
| `source` | string | no | Source attribution shown at bottom-right |

### Color Reference

Use these values for any `color` field:

> **Source of truth:** [`tools/brand-treatment/palette.json`](../../tools/brand-treatment/palette.json). The values below mirror the Direction A palette as of May 2026 — re-check palette.json if anything below looks off.

**Palette tokens:** `#1C1814` (ink), `#2A2520` (midnight), `#5C4A3D` (walnut), `#8B7355` (umber), `#B8A189` (taupe), `#D9C9B0` (sand), `#F0E6D0` (bone), `#F5F0E8` (paper), `#C4A747` (gold)

**Semantic tokens:** `#4A7BA7` (US / muted blue), `#A64D46` (China / muted rust), `#888780` (neutral)

**Ramps (light→dark, sequential — for multi-series chart fills, value-encoded heatmaps):** loaded from palette.json's `ramps` block by `theme.ts`. Use `ramps.<name>[i]` rather than the literal hex below.
- Warm (6-stop): `#F5F0E8`, `#D9C9B0`, `#B8A189`, `#8B7355`, `#5C4A3D`, `#1C1814`
- Blue (5-stop): `#E8F0F6`, `#9DBDD6`, `#4A7BA7`, `#2E5C82`, `#163048`
- Red (5-stop): `#F5E8E7`, `#CFA09C`, `#A64D46`, `#7A3530`, `#3D1A18`
- Gold (5-stop): `#FFF6E0`, `#E8D49A`, `#C4A747`, `#967E30`, `#5C4D1A`
- Gray (5-stop): `#F1EFE8`, `#B4B2A9`, `#888780`, `#5F5E5A`, `#2C2C2A`

**Duotone (3-stop, shadow→midtone→highlight — for image treatment via treat.py / recraft.py):** loaded from palette.json's `duotone` block.
- Standard: `#1C1814` ink → `#8B7355` umber → `#C4A747` gold
- Conflict: `#1C1814` ink → `#7A2E1A` → `#A64D46` china
- Editorial: `#B8A189` taupe → `#F0E6D0` bone → `#F5F0E8` paper

---

## ChoroplethMap

Country highlighting, alliances, trade blocs. Multi-phase animation with map camera control.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Export Control Coalition",
  "projection": "geoMercator",        // or "geoNaturalEarth1", "geoEqualEarth"
  "center": [20, 25],                 // [longitude, latitude] — default map center
  "scale": 150,                       // zoom level
  "colorRamp": "blue",                // "blue"|"red"|"teal"|"gray" or custom hex array
  "phases": [
    {
      "title": "Phase 1: Initial Controls",
      "subtitle": "October 2022",
      "durationSec": 4,
      "countries": [
        { "name": "United States", "iso3": "USA", "fill": "#4A7BA7", "label": "US" },
        { "name": "China", "iso3": "CHN", "fill": "#A64D46" }
      ],
      "center": [100, 35],           // optional per-phase camera
      "scale": 300
    }
  ]
}
```

**Key fields:**
- `countries[].name` — must match TopoJSON feature name
- `countries[].iso3` — ISO 3166-1 alpha-3 code
- `countries[].value` — numeric for color-ramp scaling (alternative to `fill`)
- `countries[].fill` — direct hex color override
- `terrain` — boolean. Default: `false` as of May 11, 2026 (was `true` previously). Enable per-shot when relief is the editorial point (mountain choropleth, alpine border dispute, etc.) — see LESSONS.md L99. The default-off shift puts the template back in atlas register; opt in only when terrain is doing narrative work.

---

## RouteAnimation

Supply chains, trade routes, resource flows. Phased segment reveal with map camera.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Semiconductor Supply Chain",
  "points": [
    { "name": "TSMC", "coordinates": [120.99, 24.78], "label": "Hsinchu" },
    { "name": "ASML", "coordinates": [5.46, 51.44], "sublabel": "Netherlands" }
  ],
  "segments": [
    { "from": 0, "to": 1, "label": "EUV machines", "color": "#C4A747" }
  ],
  "phases": [
    {
      "title": "The Supply Line",
      "durationSec": 5,
      "activeSegments": [0],
      "activePoints": [0, 1],
      "camera": { "longitude": 60, "latitude": 35, "zoom": 2.5, "pitch": 25 }
    }
  ],
  "routeColor": "#C4A747"
}
```

**Key fields:**
- `points[].coordinates` — `[longitude, latitude]`
- `segments[].from/to` — indices into `points` array
- `phases[].camera` — preferred over legacy `center/scale`
- `terrain` — boolean (default `false`). Enable per-shot when relief is the editorial point (Himalayan supply route, alpine border dispute). Same default-off convention as ChoroplethMap.
- `annotations[]` — `MapAnnotation[]` overlay labels with leader lines and per-phase gating. See the **MapAnnotations overlay** section below.

**Variants:**

- **`radial` mode** (added May 11, 2026) — closes the "hub with N destinations on a real basemap" gap. Set `radial: { hubIndex, staggerSec?, hubColor?, arcColor? }` and **omit `segments`** entirely. Segments + a default phase are auto-derived; destinations are sorted clockwise by bearing from the hub for a "broadcast outward" reveal. Use for trade-route hubs, military campaigns radiating from a command center, supply lanes from a single port.

```jsonc
{
  "episode": "rome",
  "title": "All Roads Lead From Rome",
  "points": [
    { "name": "Rome", "coordinates": [12.49, 41.90] },
    { "name": "Londinium", "coordinates": [-0.13, 51.51] },
    { "name": "Lugdunum", "coordinates": [4.83, 45.76] },
    { "name": "Alexandria", "coordinates": [29.92, 31.20] },
    { "name": "Antioch", "coordinates": [36.16, 36.20] }
  ],
  "segments": [],
  "phases": [],
  "radial": {
    "hubIndex": 0,
    "staggerSec": 0.4,
    "hubColor": "#C4A747",
    "arcColor": "#A64D46"
  }
}
```

---

## MapAnnotations overlay

Editorial overlay labels for any MapGL-based template. This is the FT/Reuters/NYT signature that separates an "atlas plate" from a "Mapbox screenshot." Labels are pinned to lon/lat anchors (they track the camera through phase changes), rendered with brand typography, and can include leader lines pulling the label off the dot toward whitespace. Not a standalone composition — passed in as `annotations: [...]` on **ChoroplethMap**, **RouteAnimation**, and **AtlasPlate**.

```jsonc
{
  "annotations": [
    {
      "at": [121.00, 24.80],
      "label": "TAIWAN",
      "sublabel": "92% of advanced fab capacity",
      "hierarchy": "primary",
      "emphasis": "accent",
      "leader": { "dx": 120, "dy": -40 },
      "align": "left",
      "phase": 0
    },
    {
      "at": [5.46, 51.44],
      "label": "ASML",
      "hierarchy": "secondary",
      "appearAtSec": 4,
      "exitAtSec": 9
    }
  ]
}
```

**Key fields:**
- `at: [lon, lat]` — anchor point; label tracks the map camera.
- `label` — primary line text.
- `sublabel` — optional secondary line (Plex Mono, taupe).
- `hierarchy` — `"primary"` (uppercase Plex Sans SemiBold, country/region scale, maps to entrance role `hero`), `"secondary"` (sentence-case Plex Sans Medium, city/feature scale, role `content`), `"tertiary"` (Plex Mono Regular, source notes, role `label`).
- `leader` — `{ dx, dy }` pixel offset from the anchor. When set, renders a leader line from the anchor dot to the offset label. When omitted, the label sits directly above the anchor with a small gap.
- `align` — `"left" | "right" | "center"` (default `"center"`). Text alignment relative to the label position.
- `emphasis` — `"default"` (ink/bone), `"accent"` (rust), `"mute"` (taupe).
- `phase` — non-negative integer phase index. Authoring shorthand: the template resolves it against its own phase windows to drive `appearAtSec` / `exitAtSec` automatically.
- `appearAtSec` / `exitAtSec` — explicit time-window override (mutually exclusive with `phase`). When the annotation should persist across the whole composition, omit all three of `phase` / `appearAtSec` / `exitAtSec`.

---

## AtlasPlate

Fixed-register atlas plate for orthographic globes, equal-earth world plates, or regional spreads — the "this is the world; here is what we are pointing at" register. Choose `aesthetic: "atlas"` (modern flat) or `"vintage"` (paper-warm with halftone). Phase-driven country fills with optional graticule, disputed-boundary overlays, and the shared `MapAnnotations` overlay for labels. Use AtlasPlate when the editorial point is the geographic register itself (orient the viewer, establish the theater); use ChoroplethMap when value encoding is doing the work.

```jsonc
{
  "episode": "silicon-trap",
  "title": "The COCOM Members",
  "subtitle": "1949–1994 — Western export-control regime against the Soviet bloc",
  "projection": "equalEarth",
  "aesthetic": "atlas",
  "framePadding": 100,
  "graticule": { "spacing": 15, "opacity": 0.1, "emphasize30": true },
  "disputedBoundaries": ["taiwan-strait", "nine-dash"],
  "phases": [
    {
      "title": "Western signatories",
      "subtitle": "17 nations, NATO + Japan",
      "durationSec": 6,
      "countries": [
        { "iso3": "USA", "fill": "#4A7BA7" },
        { "iso3": "GBR", "fill": "#4A7BA7" },
        { "iso3": "JPN", "fill": "#4A7BA7" }
      ]
    },
    {
      "title": "The Soviet bloc",
      "durationSec": 5,
      "countries": [
        { "iso3": "RUS", "fill": "#A64D46" },
        { "iso3": "CHN", "fill": "#A64D46" }
      ],
      "focus": { "center": [50, 45], "scaleHint": 1.6 },
      "cameraTransition": "cinematic"
    }
  ],
  "source": "Mastanduno (1992); COCOM records"
}
```

**Key fields:**
- `projection` — `"equalEarth"` (default world plate), `"naturalEarth"`, `"mercator"`, `"orthographic"` (globe), `"albersUsa"`, `"equirectangular"`.
- `aesthetic` — `"atlas"` (modern, default) or `"vintage"` (paper-warm halftone register).
- `phases[].countries[].iso3` — ISO 3166-1 alpha-3 (no `name` lookup unlike ChoroplethMap; iso3 is authoritative here).
- `phases[].focus` — optional camera target: `{ iso3?: string[], center?: [lon, lat], scaleHint?: number }`. Camera fits the iso3 set OR centers on the explicit coords.
- `phases[].rotation` — `[lambda, phi]` rotation for orthographic globe.
- `phases[].cameraTransition` — `"linear"` (default), `"cinematic"` (ease-in-out), `"via-globe"` (route through globe pose for dramatic continental swings).
- `phases[].cameraDwell` — `{ before?: 0-1, after?: 0-1 }` portion of phase duration to hold static before/after the transition.
- `framePadding` — pixel padding around the fitted geometry (default ~80).
- `graticule` — parallels-and-meridians overlay. On-brand because the channel is named Parallax.
- `disputedBoundaries` — `true` (render all) or `string[]` of named tags (e.g., `["taiwan-strait", "nine-dash"]`). Renders as dashed rust lines. See `src/utils/disputedBoundaries.ts` for the curated tag set.
- `annotations[]` — `MapAnnotation[]` (see the MapAnnotations section above).

---

## ProportionalSymbolMap

Point-based map where each circle's *area* is proportional to a numeric value. The canonical alternative to ChoroplethMap when the story is count data (capacity, population, troops, exports in $) and you don't want geographic area to over-encode the variable. Circles sit at country centroids; sqrt scaling is the editorial default (perceptually linear for area).

```jsonc
{
  "episode": "silicon-trap",
  "title": "Where Chips Are Made",
  "subtitle": "Monthly wafer-fab capacity by country, 2024",
  "projection": "equalEarth",
  "unit": "M wafers/mo",
  "valueLabel": "Wafer-fab capacity",
  "maxRadiusPx": 56,
  "scaleType": "sqrt",
  "symbolColor": "#C23B22",
  "framePadding": 100,
  "graticule": { "spacing": 15, "opacity": 0.1, "emphasize30": true },
  "phases": [
    {
      "title": "Concentrated production",
      "subtitle": "Top six fab nations",
      "durationSec": 8,
      "symbols": [
        { "iso3": "TWN", "value": 5.4, "label": "TWN" },
        { "iso3": "KOR", "value": 4.8, "label": "KOR" },
        { "iso3": "JPN", "value": 3.2, "label": "JPN" },
        { "iso3": "CHN", "value": 3.0, "label": "CHN" },
        { "iso3": "USA", "value": 1.8, "label": "USA" }
      ]
    }
  ],
  "source": "SEMI Industry Statistics 2024"
}
```

**Key fields:**
- `phases[].symbols[].iso3` — ISO 3166-1 alpha-3; circle anchors at the country centroid.
- `phases[].symbols[].value` — numeric magnitude (positive). Drives circle radius via `scaleType`.
- `phases[].symbols[].label` — optional inline label inside or beside the circle (typically a short iso3-style abbreviation).
- `phases[].symbols[].color` — per-symbol override; otherwise uses `symbolColor`.
- `scaleType` — `"sqrt"` (default, perceptually linear for area) or `"linear"` (radius proportional to value — only use for tightly-clustered ranges).
- `maxRadiusPx` — largest-value circle radius in pixels; smaller values scale down proportionally.
- `symbolColor` — fill color for all symbols when per-symbol `color` is unset. Default: rust (`#C23B22`).
- `phases[].focus` / `cameraTransition` / `cameraDwell` — same shape as AtlasPlate.
- `annotations[]` — `MapAnnotation[]` (see MapAnnotations).

---

## CartogramMap

Distorted-geography map where each country becomes a circle (Dorling-style) sized by value, packed to roughly preserve adjacency. Use when ProportionalSymbolMap would jumble (dense clusters like Europe) — the cartogram says "Germany is the biggest" without making it visually dominate via land area. Canonical for population, GDP, or vote-share at country level.

```jsonc
{
  "episode": "_catalog",
  "title": "European Union by population",
  "subtitle": "EU-27 member states, 2024 (millions)",
  "projection": "equalEarth",
  "unit": "M",
  "valueLabel": "Population",
  "maxRadiusPx": 64,
  "scaleType": "sqrt",
  "symbolColor": "#4A7BA7",
  "showCoastlines": true,
  "xyStrength": 0.7,
  "phases": [
    {
      "title": "Population weight",
      "subtitle": "Each circle is a member state, sized by people",
      "durationSec": 8,
      "data": [
        { "iso3": "DEU", "value": 84.7, "label": "DEU" },
        { "iso3": "FRA", "value": 68.4, "label": "FRA" },
        { "iso3": "ITA", "value": 58.8, "label": "ITA" },
        { "iso3": "ESP", "value": 48.6, "label": "ESP" },
        { "iso3": "POL", "value": 36.8, "label": "POL" }
      ]
    }
  ],
  "source": "Eurostat 2024"
}
```

**Key fields:**
- `phases[].data[].iso3` / `value` / `label` / `color` — same shape as ProportionalSymbolMap symbols.
- `scaleType` — `"sqrt"` (default) or `"linear"`. Sqrt is almost always correct.
- `maxRadiusPx` — sets the scale of the largest circle.
- `showCoastlines` — render faint geographic coastlines underneath the packed circles to anchor the cartogram in real geography. Default false.
- `xyStrength` — 0–1, how strongly circles snap toward their true centroid vs. pack freely. Lower = more packing freedom (better for dense clusters); higher = closer to true geography (better when adjacency must read).
- `symbolColor` — uniform fill for circles when per-datum `color` is unset.
- `annotations[]` — `MapAnnotation[]`.

---

## DensityMap

Point clusters or heatmap density on a Mapbox basemap (deck.gl HexagonLayer / HeatmapLayer / GridLayer). Use when the story is *where the dots cluster*, not country-level aggregates — individual fab sites, troop deployments, earthquake epicenters, protest locations. Each point has a lon/lat and optional `weight`; the layer aggregates into hex bins (or heatmap kernels) at render time.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Where chips are made",
  "subtitle": "Individual fab sites, 2024 — hex bins aggregate by region",
  "mode": "hex",
  "cellSize": 250000,
  "coverage": 0.92,
  "opacity": 0.78,
  "colorAggregation": "sum",
  "camera": { "longitude": 100, "latitude": 30, "zoom": 2.5, "pitch": 0 },
  "phases": [
    {
      "title": "Global fab geography",
      "subtitle": "Where wafers actually start",
      "durationSec": 8,
      "points": [
        { "at": [121.00, 24.80], "weight": 5, "tag": "tsmc-hsinchu" },
        { "at": [127.04, 37.20], "weight": 5, "tag": "samsung-giheung" },
        { "at": [-111.94, 33.45], "weight": 4, "tag": "tsmc-arizona" },
        { "at": [13.69, 51.05], "weight": 3, "tag": "globalfoundries-dresden" }
      ]
    }
  ],
  "source": "SEMI Industry Statistics 2024"
}
```

**Key fields:**
- `mode` — `"hex"` (HexagonLayer, default for editorial work), `"heatmap"` (smooth kernel-density), `"grid"` (square bins). Hex reads as "aggregated truth"; heatmap reads as "intensity field."
- `cellSize` — bin size in meters (e.g., `250000` = 250km hexes for continent-scale views; `5000` = 5km for city-scale).
- `coverage` — 0–1 fraction of each cell filled (0.92 leaves a faint hairline gap between hexes that reads as a grid). Default ~1.
- `colorRamp` — array of hex colors low→high. Default uses warm ramp from palette.
- `colorAggregation` — `"sum"` (default), `"mean"`, `"max"` — how `weight` aggregates within a bin.
- `opacity` — overall layer opacity (default ~0.78 so the basemap reads through).
- `phases[].points[].at` — `[lon, lat]`.
- `phases[].points[].weight` — numeric, default 1. Drives bin intensity via `colorAggregation`.
- `phases[].points[].colorWeight` — optional bivariate second dimension. When set, drives bin *color* independently from bin *height/intensity* (which still tracks `weight`).
- `phases[].camera` — per-phase camera override.
- `inset` — `{ show, position: "tl"|"tr"|"bl"|"br", size, framed }` locator inset.
- `annotations[]` — `MapAnnotation[]`.

---

## BifurcationRoute

> **⚠ DELETED May 13, 2026.** The template folder no longer exists; rendering will produce a silent null segment. For new work: use **DuelingFrameworks** (two head-to-head scenarios) or **DecisionTree** (branching with probabilities). Schema below kept for archival reference only.

Network split / lineage divergence. One unified network forks at a single node into two post-split networks (US-aligned vs. China-aligned, Indo-European → Germanic vs. Romance, etc.). Three phases: unified state holds → split animates → two-network steady state. Not a map — a node-graph laid out in percentage-of-canvas coords.

```jsonc
{
  "episode": "silicon-trap",
  "title": "The Bifurcation",
  "subtitle": "One supply chain becomes two",
  "nodes": [
    { "id": "tsmc", "label": "TSMC", "x": 50, "y": 15, "network": "unified", "icon": "🏭" },
    { "id": "asml", "label": "ASML", "x": 20, "y": 35, "network": "networkA" },
    { "id": "smic", "label": "SMIC", "x": 80, "y": 35, "network": "networkB" },
    { "id": "us",   "label": "US Market",    "x": 25, "y": 85, "network": "networkA" },
    { "id": "cn",   "label": "China Market", "x": 75, "y": 85, "network": "networkB" }
  ],
  "links": [
    { "from": "tsmc", "to": "asml", "phase": "unified" },
    { "from": "tsmc", "to": "smic", "phase": "unified" },
    { "from": "asml", "to": "us",   "phase": "split", "network": "networkA" },
    { "from": "smic", "to": "cn",   "phase": "split", "network": "networkB" }
  ],
  "forkNodeId": "tsmc",
  "networkALabel": "US-Aligned",
  "networkBLabel": "China-Aligned",
  "unifiedDurationSec": 3,
  "cinematicMode": true,
  "ambientParticles": true
}
```

**Key fields:**
- `nodes[].x` / `y` — canvas position as percentages (0–100). Hand-place to control the visual fork shape.
- `nodes[].network` — `"unified"` (pre-split, shown in phase 1), `"networkA"` or `"networkB"` (post-split membership).
- `nodes[].icon` — optional emoji/glyph rendered inside the node.
- `links[].phase` — `"unified"` (shown in phase 1, then fade) or `"split"` (appears after the fork animation).
- `links[].network` — for split links, which post-split branch they belong to (drives color).
- `forkNodeId` — id of the node where the split visually originates (camera zooms here in cinematic mode).
- `networkALabel` / `networkBLabel` — required human-readable branch labels.
- `networkAColor` / `networkBColor` — branch accent overrides; default to `semantic.us` / `semantic.china`.
- `unifiedDurationSec` — how long the unified state displays before the split animation begins.
- `cinematicMode` — boolean. Adds camera zoom-to-fork + spatial separation between the two branches as they diverge.
- `ambientParticles` — boolean. Adds atmospheric particle layer for depth (use sparingly).

---

## PricingWaterfall

Fixed-total value-chain decomposition. A single denominator the viewer already understands ($1, $5, $100) split horizontally into stage segments, with the smallest sliver typically in accent color to draw the eye to the "value capture" punchline. The canonical form for value-extraction stories — supply-chain margin, where-your-tax-dollar-goes, cost-of-goods decomposition. Built May 2026; converges with FT (iPhone breakdowns), Bloomberg (oil/cocoa decompositions), Specialty Coffee Association farmgate reports. Cleveland's perceptual hierarchy backs the form: position-along-a-common-scale on a fixed denominator.

```jsonc
{
  "episode": "_catalog",
  "title": "Where Your $5 Cup Goes",
  "subtitle": "The coffee bean's journey from Yirgacheffe to Williamsburg",
  "total": { "value": "$5", "label": "specialty coffee, retail" },
  "stages": [
    { "label": "Farm",        "share": 3,  "descriptor": "Yirgacheffe, Ethiopia", "hero": true },
    { "label": "Cooperative", "share": 5,  "descriptor": "Wash & dry" },
    { "label": "Exporter",    "share": 8,  "descriptor": "Addis Ababa" },
    { "label": "Importer",    "share": 14, "descriptor": "Hamburg" },
    { "label": "Roaster",     "share": 25, "descriptor": "Brooklyn" },
    { "label": "Café",        "share": 45, "descriptor": "Williamsburg" }
  ],
  "source": "Specialty Coffee Association reports",
  "durationSec": 10
}
```

**Key fields:**
- `total.value` — display string for the full denominator (e.g., `"$5"`, `"$1"`, `"$100"`). Rendered prominently.
- `total.label` — what the total represents (e.g., `"specialty coffee, retail"`).
- `stages[].label` — stage name (Farm, Cooperative, Roaster…).
- `stages[].share` — numeric share. Conventionally percentages summing to 100; the renderer normalizes whatever you pass, but staying on 100 keeps the math legible if a viewer pauses.
- `stages[].descriptor` — optional short geographic or contextual subtitle below the stage label.
- `stages[].hero` — boolean. The "punchline" stage (typically the smallest sliver — the farmer's share) renders in accent color and gets entrance emphasis. Set on exactly one stage.
- `stages[].color` — per-stage override; otherwise uses the sequential warm ramp with the `hero` stage in rust.

---

## DuelingFrameworks

Two competing intellectual frames placed side-by-side with their core tenets, a numeric "explanatory score" out of 100, and an optional verdict line per framework. The canonical Parallax "bounded analogy" template at the framework level: realism vs. liberalism, Confucian vs. Legalist, structural vs. agentic, etc. Bilingual fields (`titleCn`, `nameCn`, etc.) supported throughout for episodes that thread Chinese-language framing alongside English.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Realism vs. Liberalism",
  "phenomenon": "Great power competition",
  "verdictLabel": "Explanatory power",
  "durationSec": 12,
  "backgroundVariant": "dark",
  "frameworkA": {
    "name": "Realism",
    "color": "#C23B22",
    "tenets": [
      { "text": "Power politics" },
      { "text": "Security dilemma" },
      { "text": "Self-help system" }
    ],
    "score": 72,
    "verdict": "Explains escalation logic"
  },
  "frameworkB": {
    "name": "Liberalism",
    "color": "#3266AD",
    "tenets": [
      { "text": "Interdependence" },
      { "text": "Institutions" },
      { "text": "Democratic peace" }
    ],
    "score": 55,
    "verdict": "Explains restraint signals"
  }
}
```

**Key fields:**
- `phenomenon` — the thing both frameworks are trying to explain (e.g., "Great power competition"). Sits between the two columns.
- `frameworkA` / `frameworkB.name` — framework name (e.g., "Realism").
- `frameworkA` / `frameworkB.color` — accent color for the column (required).
- `frameworkA` / `frameworkB.tenets[]` — array of `{ text, textCn? }` core principles, rendered as bullet items.
- `frameworkA` / `frameworkB.score` — 0–100 explanatory score, rendered as a large numeric. Editorial — not a real metric; the viewer reads it as the channel's verdict.
- `frameworkA` / `frameworkB.verdict` — short one-line summary of where the framework lands.
- `verdictLabel` — label above the score columns (default "Explanatory power" or similar).
- `titleCn` / `subtitleCn` / `phenomenonCn` / `verdictLabelCn` / per-framework `nameCn` / `verdictCn` / per-tenet `textCn` — bilingual overlays.

---

## StrategicLandscape

2D actor-positioning matrix. Two axes the channel defines (defensive↔offensive, short-term↔long-term, low-influence↔high-influence, etc.), four quadrants with editorial labels, and N actors placed at `(x, y)` percentage coords. The canonical "where does everyone sit" template for geopolitical analysis. Different from FrameworkDiagram's `matrix` variant because the cells aren't fixed cases — actors move freely in the continuous 2D space.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Semiconductor Strategy Landscape",
  "subtitle": "Major actors positioned by approach and time horizon",
  "xAxisLabel": "Defensive",
  "xAxisLabelEnd": "Offensive",
  "yAxisLabel": "Short-term",
  "yAxisLabelEnd": "Long-term",
  "actors": [
    { "name": "United States", "icon": "US", "x": 70, "y": 65, "color": "#3266AD" },
    { "name": "China",         "icon": "CN", "x": 75, "y": 80, "color": "#C23B22" },
    { "name": "TSMC",          "icon": "TW", "x": 40, "y": 70 },
    { "name": "EU",            "icon": "EU", "x": 35, "y": 45, "color": "#5DAA68" },
    { "name": "Japan",         "icon": "JP", "x": 50, "y": 55, "color": "#E5A544" }
  ],
  "quadrantLabels": ["Strategic patience", "Long-term offensive", "Reactive defense", "Tactical strike"],
  "source": "Parallax analysis",
  "durationSec": 10
}
```

**Key fields:**
- `xAxisLabel` / `xAxisLabelEnd` — left and right axis endpoints (e.g., "Defensive" ↔ "Offensive").
- `yAxisLabel` / `yAxisLabelEnd` — bottom and top axis endpoints.
- `actors[].x` / `y` — 0–100 percentage position in the 2D space.
- `actors[].size` — 0.5–3 size multiplier (default 1). Use for "this actor matters more."
- `actors[].icon` — short 2-letter glyph rendered inside the marker (typically a country code: "US", "CN", "TW").
- `actors[].color` — per-actor color; auto-assigned from the categorical sequence if omitted.
- `actors[].nameCn` — optional Chinese name for bilingual episodes.
- `quadrantLabels` — `[topLeft, topRight, bottomLeft, bottomRight]` 4-tuple of quadrant titles. Optional but strongly editorial — without them, the matrix is just dots.

---

## HorizontalTimeline

Year-based event ribbon — the canonical Parallax timeline template, replacing the older standalone DualTimeline and TimelineMorph compositions (both deprecated; kept for backward compatibility). Three modes share a single schema: `"single"` (one spine of events along an x-axis), `"dual"` (two stacked spines for historical parallels, with optional phase-aligned connections), and `"morph"` (events animate from era A state to era B state in place). Supports an authored camera path for ride-the-rail pacing, importance weights for hierarchy, era foil treatments, and an optional phase axis that *enforces* shared phase alignment rather than calendar-spaced layout.

```jsonc
// Dual mode (the workhorse — historical parallel)
{
  "episode": "silicon-trap",
  "title": "The Oil-Chip Parallel",
  "subtitle": "Two resource denials, eight decades apart",
  "mode": "dual",
  "eraATitle": "1940s PACIFIC",
  "eraBTitle": "2020s SEMICONDUCTORS",
  "eraAColor": "#4A7BA7",
  "eraBColor": "#A64D46",
  "eraWeight": "foil-old",
  "connectionRevealStart": 8,
  "phaseAxis": {
    "label": "Phase",
    "ticks": [0, 1, 2, 3],
    "min": 0,
    "max": 3
  },
  "pairs": [
    {
      "eraA": { "year": "1939", "title": "Growing dependence", "weight": 1 },
      "eraB": { "year": "2015", "title": "Growing dependence", "weight": 1 },
      "connection": "Resource concentration",
      "phasePosition": 0
    },
    {
      "eraA": { "year": "Jul 1941", "title": "Asset freeze & oil embargo", "weight": 3 },
      "eraB": { "year": "Oct 2022", "title": "Export controls", "weight": 3 },
      "connection": "Denial trigger",
      "phasePosition": 1
    }
  ],
  "durationSec": 15
}

// Single mode
{
  "episode": "silicon-trap",
  "title": "Semiconductor escalation, 2018–2024",
  "mode": "single",
  "events": [
    { "year": "May 2019", "title": "Huawei added to Entity List", "weight": 2 },
    { "year": "Oct 2022", "title": "October 7 controls", "weight": 3, "icon": "⚡" },
    { "year": "Oct 2023", "title": "Controls tightened",  "weight": 2 }
  ]
}

// Morph mode
{
  "mode": "morph",
  "morphEraATitle": "Oil Age",
  "morphEraBTitle": "Silicon Age",
  "morphEvents": [
    { "eraAYear": "1941", "eraATitle": "Oil embargo",
      "eraBYear": "2022", "eraBTitle": "Chip controls", "weight": 3 }
  ]
}
```

**Key fields:**
- `mode` — `"single"` | `"dual"` | `"morph"` (required).
- **Single mode**: `events[]` (`year`, `title`, `description?`, `weight: 1|2|3`, `icon?`, `color?`).
- **Dual mode**: `pairs[]` (`eraA`, `eraB`, `connection?`, `phasePosition?`), plus `eraATitle` / `eraBTitle`.
- **Morph mode**: `morphEvents[]` (`eraAYear` + `eraATitle` + `eraBYear` + `eraBTitle`), plus `morphEraATitle` / `morphEraBTitle`.
- `weight` — `1` (light), `2` (medium), `3` (heavy). Controls node size and card prominence.
- `eraWeight` — `"equal"` (default), `"foil-old"` (era A muted to taupe, era B emphasized — past-as-foil-to-present), `"foil-new"` (inverse). Foil-mute is the editorial default when one era is the analytical anchor and the other is the contemporary subject.
- `phaseAxis` — when set, **every pair must declare `phasePosition`** and events lay out on the shared phase axis rather than calendar dates. Schema enforces this via superRefine. Required for honest "Phase 1 of X mirrors Phase 1 of Y" claims; without it the layout falsifies phase alignment by accident. Dual mode only.
- `connectionRevealStart` — seconds-from-start when connection lines render (dual mode).
- `cameraPath[]` — keyframe sequence `{ focus: number | "pullback", zoom, duration, behavior?: "track"|"snap"|"hold", label?, dimOthers? }`. Auto-generated if omitted; author by hand for narrated walk-throughs.

---

## DualTimeline

> **Deprecated** — use **HorizontalTimeline** with `mode: "dual"` for all new work. Kept registered for backward compatibility with existing silicon-trap data files. Schema is a simpler subset: `pairs[]` with `eraA` / `eraB` `{ label, text, textCn? }` plus optional `connection` label, `eraATitle` / `eraBTitle` / `eraAColor` / `eraBColor`. No phase axis, no camera path, no weights — migrate to HorizontalTimeline when adding any of these.

---

## TimelineMorph

> **⚠ DELETED May 13, 2026.** The template folder no longer exists; rendering will produce a silent null segment. Use **HorizontalTimeline** with `mode: "morph"` for all new work. Schema below kept for archival reference only — the original `events[]` of `{ eraALabel, eraAText, eraBLabel, eraBText, icon? }`, plus `eraATitle` / `eraBTitle` / `eraAColor` / `eraBColor`, with `holdDurationSec` and `morphDurationSec` controlling the animated topology shift between the two states.

---

## EditorialFrame

> **Not a standalone composition** — `EditorialFrame` is a *wrapper component* (`src/components/EditorialFrame.tsx`) that adds magazine-spread typographic scaffolding (kicker → hero stat → headline → body → byline → ∴ brand mark) around an inner template (chart, map, diagram). Pulls the analytical layer toward the channel's Fortune-1955 editorial register. Use for cold opens, hero moments, and any beat where the data needs editorial framing rather than living on its own.

```tsx
<EditorialSurface backdrop={pickBackdrop("library")}>
  <EditorialFrame
    variant="hero"
    mode="light"
    kicker="iterated prisoner's dilemma"
    hero="23%"
    headline="Does cooperation need memory?"
    body="Cooperation rate after 200 rounds when players cannot recall prior moves."
    byline="parallax · prisoner's dilemma · 2026"
  >
    <DataChart data={cooperationData} />
  </EditorialFrame>
</EditorialSurface>
```

**Key props:**
- `variant` — `"hero"` (full editorial layout: text panel left ~38%, chart right two-thirds), `"hero-flipped"` (mirror — text right, chart left; pair with right-anchored atmospheric backdrops), `"aside"` (chart-dominant: narrower text panel, smaller hero, chart claims primary real estate), `"minimal"` (pure passthrough with optional ∴ corner mark). Default `"minimal"` — explicit opt-in to scaffolding.
- `mode` — `"light"` (ink-on-paper, default) or `"dark"` (bone-on-near-black). When omitted, reads from `EditorialModeContext` set by `FullEpisode` per segment from the active backdrop's `register` field. Pass explicitly only in standalone test compositions.
- `kicker` — small lowercase label, top-left, IBM Plex Mono tracked-out. Preceded by a short rule in the episode's emphasis accent.
- `hero` — large display value (number, percentage, payoff pair, short name). Plex Sans Medium — size carries impact, not weight. ~120pt in `hero`, ~56pt in `aside`.
- `headline` — 1–2 line subhead. Sentence case. Question form preferred for Parallax voice.
- `body` — 1–2 line supporting context, smaller scale, slightly reduced opacity.
- `byline` — bottom-left attribution string, IBM Plex Mono lowercase, preceded by short ink rule.
- `showBrandMark` — render ∴ in a hairline circle at lower-right. Default `true` for hero/aside, `false` for minimal.
- `children` — the inner template (DataChart, ChoroplethMap, TimeSeriesChart, etc.). Mounts at frame 60 in hero mode via Remotion `<Sequence>` so its own entrance animations start after the editorial scaffolding has settled.

---

## TimelineComparison

Historical parallels, before/after dual-track timelines.

```jsonc
{
  "episode": "silicon-trap",
  "leftLabel": "Oil Embargo 1941",
  "rightLabel": "Chip Controls 2022",
  "leftColor": "#4A7BA7",
  "rightColor": "#A64D46",
  "leftEvents": [
    { "year": "1939", "title": "US-Japan trade friction begins", "icon": "⚡" }
  ],
  "rightEvents": [
    { "year": "2018", "title": "Entity List: Huawei added" }
  ],
  "connections": [
    { "leftIndex": 0, "rightIndex": 0, "label": "Trigger event" }
  ],
  "secondsPerEvent": 2
}
```

**Key fields:**
- `connections[].leftIndex/rightIndex` — indices linking left/right events
- `secondsPerEvent` — pacing control (default: 2)

---

## DataChart

Bar charts, comparisons, horizontal bars. The workhorse data template.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Chip Manufacturing by Nation",
  "subtitle": "% of global advanced chip production",
  "variant": "bar",                    // "bar"|"comparison"|"horizontal"
  "unit": "%",
  "dataPoints": [
    { "label": "Taiwan", "value": 92, "color": "#A64D46" },
    { "label": "South Korea", "value": 5, "color": "#4A7BA7" },
    { "label": "US", "value": 2 }
  ],
  "highlightIndex": 0,                // hero bar with accent glow
  "referenceLine": { "value": 50, "label": "Global average", "color": "#888780" },
  "contextNote": "A single earthquake could halt 92% of advanced chip production.",
  "source": "SIA, 2024"
}
```

**Comparison variant:**
```jsonc
{
  "variant": "comparison",
  "comparisonPairs": [
    { "label": "R&D Spending", "leftValue": 45, "rightValue": 38 }
  ],
  "leftGroupLabel": "US", "leftGroupColor": "#4A7BA7",
  "rightGroupLabel": "China", "rightGroupColor": "#A64D46"
}
```

**Year-mode (no thousand-separators):**
```jsonc
{
  "variant": "comparison",
  "formatAsYear": true,                // skip thousand-separator commas
  "comparisonPairs": [
    { "label": "Satellite", "leftValue": 1958, "rightValue": 1957 }
  ]
}
```
Use `formatAsYear: true` when values are years, postal codes, or 4-digit IDs that should not be comma-separated. Affects both bar value labels and y-axis ticks.

**Y-axis behavior:** y-axis ticks are now real data values (e.g. 0 / 2,000 / 4,000 / 6,000 / 8,000) computed via `niceTicks`. Previously the axis was hardcoded 0–100% with the unit appended. Pass `yRange: [min, max]` only if you specifically need to override the inferred domain.

**Variants:**

- **`bar`** — vertical bars. Pass `dataPoints[]`. Default workhorse.
- **`horizontal`** — horizontal bars. Pass `dataPoints[]`. Use when labels are long or there are many categories.
- **`lollipop`** — dot-on-stem variant of bar. Pass `dataPoints[]`. Reduces ink for many-category comparisons.
- **`comparison`** — paired left/right bars. Pass `comparisonPairs[]` + `leftGroupLabel` / `rightGroupLabel` / colors.
- **`small-multiples`** — grid of mini bar charts sharing axes. Pass `panels[]: [{ title, subtitle?, dataPoints[] }]`. Schema requires at least one panel. Use when comparing the same metric across N categories (countries, decades, scenarios) and a single chart would muddle.

---

## KineticTypography

Quotes, definitions, bilingual text, key statistics. Full-screen typography moments.

```jsonc
// Quote variant
{
  "episode": "silicon-trap",
  "variant": "quote",
  "text": "We are in a chip war.",
  "attribution": "Morris Chang",
  "attributionContext": "Founder of TSMC, 2024",
  "accentColor": "#C4A747"
}

// Definition variant
{
  "variant": "definition",
  "term": "卡脖子",
  "termPinyin": "kǎ bózi",
  "termTranslation": "Stranglehold technology",
  "definitionText": "Technologies where a foreign power has you by the throat."
}

// Bilingual variant
{
  "variant": "bilingual",
  "chineseText": "举国体制",
  "englishText": "Whole-nation system"
}

// Statistic variant
{
  "variant": "statistic",
  "statValue": "7%",
  "statLabel": "of US chip demand met domestically",
  "statContext": "Despite $165B in announced investment"
}
```

---

## FrameworkDiagram

Conceptual models, comparisons, matrix layouts, process flows.

```jsonc
// Comparison variant
{
  "episode": "silicon-trap",
  "title": "Chess vs. Go",
  "variant": "comparison",
  "columns": [
    { "title": "Chess", "icon": "♔", "items": ["Capture the king", "Open information"], "color": "#4A7BA7" },
    { "title": "Go (围棋)", "icon": "⚫", "items": ["Control territory", "Encirclement"], "color": "#A64D46" }
  ]
}

// Flow variant
{
  "variant": "flow",
  "nodes": [
    { "label": "Design", "sublabel": "US", "color": "#4A7BA7" },
    { "label": "Fabrication", "sublabel": "Taiwan", "color": "#A64D46" }
  ],
  "arrowLabels": ["IP license"]
}

// Matrix variant
{
  "variant": "matrix",
  "rowHeaders": ["Short-term", "Long-term"],
  "colHeaders": ["Success", "Failure"],
  "cells": [
    { "row": 0, "col": 0, "label": "Tech advantage holds", "highlight": true }
  ]
}
```

**Key fields:**
- `heroStage` — (flow variant) zero-based index of the stage to render in hero mode: enlarged node, accent color, anchored entrance. Use to single out the "punchline" stage in a process flow (the choke point, the value-capture step). Independent from `protagonist`, which highlights a comparison-variant column.

---

## TitleTransition

Episode titles, section titles, end cards.

```jsonc
// Episode title
{
  "episode": "silicon-trap",
  "variant": "episode-title",
  "episodeLabel": "EPISODE 01",
  "seriesName": "Parallax",
  "title": "The Silicon Trap",
  "subtitle": "When America Tried to Strangle China's AI"
}

// Section title
{
  "variant": "section",
  "sectionNumber": "II",
  "sectionTitle": "The Stranglehold"
}

// End card
{
  "variant": "end-card",
  "ctaText": "Subscribe for more",
  "nextEpisodeTeaser": "Next: The Rare Earth Gambit"
}
```

---

## DecisionTree

Branching scenarios, decision points. Tree structure via flat array + ID references.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Export Control Scenarios",
  "nodes": [
    { "id": "root", "label": "Current Policy", "children": ["success", "backfire"] },
    { "id": "success", "label": "Controls Succeed", "probability": "35%", "color": "#5DAA68" },
    { "id": "backfire", "label": "Controls Backfire", "probability": "45%", "color": "#A64D46", "highlighted": true }
  ],
  "rootId": "root",
  "highlightedPath": ["root", "backfire"],
  "highlightColor": "#A64D46"
}
```

**Key fields:**
- `nodes[].children` — array of node IDs (not nested objects)
- `rootId` — entry point for tree traversal
- `highlightedPath` — ordered IDs forming the emphasized decision path
- `nodes[].marketPrice` — optional Kalshi annotation

**Variants:**

- **`extensive`** (default) — classic extensive-form tree with branches radiating from `rootId`. Typography-only nodes, curved-bezier gold edges, canvas viewport with virtual camera pan. The original / "Italian Opening" register.
- **`ladder`** — Graham Allison flat-stack option list. Top-level options render as vertically-stacked rows; the first child's label (and additional children, joined) becomes the option's prose gloss inside the row. Use for "the decision-maker faced N options and picked this one" stories — ExComm October 1962 is the canonical case. POLISH.md D1: no card-chrome rectangles; left-rail ordinal numerals + 3px accent bar + faint walnut tint on the highlighted option carry the structure. Skip `cameraPath`; the ladder is static-frame.
- **`indented`** — Manuscript / directory-tree outline. Depth = horizontal indent; ordinals generated as `1` / `1.a` / `1.a.i` / `1.a.i.A` (numeric → alpha-lower → roman-lower → alpha-upper, alternating by depth, caps at depth 5); edges are thin vertical hairlines on the indent gutter; probability column renders right-aligned in Plex Mono when gated. Right for tall narrow trees, policy taxonomies, legal-style outlines. Static-frame; skip `cameraPath`.
- **`spine`** — Stem-and-leaf branching spine. Vertical ordinal spine on the left (rungs = decision moments along the chosen sequence); lateral children fan rightward off each rung as labeled hairlines with leaf-dot terminals. The spine is `highlightedPath` if set, else first-child walk from root. When a highlighted path exists, non-highlighted lateral children dim to ~35% so the spine reads first. ≤3 levels deep; >3 lateral children per rung will cause adjacent fans to collide vertically (the template emits a `warnIf`). Static-frame.
- **`schematic`** — Engineering-drawing register. Same canvas + camera-pan as `extensive`, but each node renders inside a thin-bordered box with a small mono corner-ordinal marker, and edges are orthogonal right-angle paths (parent → vertical → horizontal → vertical). Use for wargaming-nomograph / circuit-diagram scenes where the box IS the editorial device. POLISH.md D1 contextual exemption.

`layout: "horizontal"` is supported on `extensive` (and the `DecisionTree-Horizontal` catalog composition). It is ignored by the four non-canvas variants.

---

## OutcomePartition

A 2D scenario field, recursively partitioned by thin rules. Each terminal region is a labeled outcome; severity = walnut fill density; probability is read as area. Different editorial form than DecisionTree — the form argues "the decision space narrows," not "the world forked." Recursive Region type (split | leaf); reveal animation draws each rule progressively 0 → full length, then leaf labels fade in over region centroids.

```jsonc
{
  "episode": "silicon-trap",
  "title": "The Decision Space Narrows",
  "subtitle": "Taiwan-strait outcomes under two structural pressures",
  "xAxisLabel": "US RESOLVE  →",
  "yAxisLabel": "PRC ESCALATION  →",
  "root": {
    "kind": "split",
    "axis": "horizontal",         // "horizontal" axis = vertical cut line
    "at": 0.5,                    // split position 0.05–0.95
    "label": "US holds resolve?", // renders mid-rule, with paper-haloed mono caption
    "revealStep": 0,              // optional; auto-incrementing when omitted
    "children": [
      { "kind": "leaf", "label": "Fait accompli", "severity": 0.75, "revealStep": 4 },
      { "kind": "split", "axis": "vertical", "at": 0.55, "children": [
        { "kind": "leaf", "label": "Deterrence holds", "highlighted": true, "severity": 0.25 },
        { "kind": "leaf", "label": "Open hostilities", "color": "#A64D46" }
      ]}
    ]
  },
  "source": "Scenario sketch after RAND TR-392 contingency framework.",
  "durationSec": 12
}
```

**Key fields:**

- `root` — the partition tree; recursive `kind: "split" | "leaf"`.
- `axis: "horizontal"` cuts the rectangle vertically (left vs right halves). `axis: "vertical"` cuts horizontally (top vs bottom).
- `at` — fractional split position in [0.05, 0.95]; encodes the editorial weight of the two children (a 0.7 split says "this side gets 70% of the outcome space").
- `revealStep` — optional integer ordering reveal animation; explicit values are honored AND the auto-cursor advances past them, so mixing explicit + implicit is safe.
- Leaf `severity` (0–1) and `color` are mutually exclusive — `color` takes precedence (renders at ~15% opacity); `severity` ramps walnut fill 0–25% opacity.
- Leaf `highlighted: true` adds a 3px accent rule on the region's leading (left) edge.

**When to pick:** "the decision space narrows" arguments where successive editorial choices CARVE outcome regions rather than fork new branches. Wrong when ordering matters in a narrative sense (use DecisionTree `spine`) or quantitative flow (use SankeyFlow).

---

## SplitComposition

Side-by-side comparisons with divider.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Two Views of the Same Event",
  "left": {
    "tag": "WESTERN LENS",
    "title": "Technology Denial",
    "items": ["National security priority", "Protecting IP"],
    "accentColor": "#4A7BA7"
  },
  "right": {
    "tag": "CHINESE LENS",
    "title": "Technology Blockade",
    "items": ["Containment strategy", "卡脖子 — stranglehold"],
    "accentColor": "#A64D46"
  },
  "dividerLabel": "vs"
}
```

---

## ProbabilityGauge

Probability readouts, shifts, scorecard tracking.

```jsonc
// Gauge variant
{
  "episode": "silicon-trap",
  "title": "Will Export Controls Succeed?",
  "variant": "gauge",
  "gauges": [
    { "label": "P(lasting tech advantage)", "value": 42, "color": "#C4A747", "marketSource": "Kalshi" }
  ]
}

// Shift variant
{
  "variant": "shift",
  "shifts": [
    { "label": "Export controls effect", "before": 55, "after": 42, "trigger": "SMIC 7nm breakthrough" }
  ]
}

// Scorecard variant
{
  "variant": "scorecard",
  "scorecard": [
    { "prediction": "SMIC can't reach 7nm by 2025", "yourEstimate": 70, "marketPrice": 65, "outcome": "wrong" }
  ]
}
```

---

## NetworkDiagram

Relationship webs, alliance structures, supply chain networks.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Semiconductor Alliance Network",
  "layout": "hub-spoke",              // "horizontal-chain"|"hub-spoke"|"grid"|"vertical-chain"
  "nodes": [
    { "id": "us", "label": "United States", "type": "nation", "color": "#4A7BA7", "importance": "primary" },
    { "id": "asml", "label": "ASML", "type": "institution", "color": "#C4A747", "importance": "secondary",
      "stat": { "value": "100%", "label": "EUV monopoly" } }
  ],
  "edges": [
    { "from": "us", "to": "asml", "style": "solid", "label": "Export controls" }
  ],
  "controls": [
    { "edge": ["us", "asml"], "label": "FDPR", "color": "#A64D46" }
  ],
  "callouts": [
    { "value": "$1T", "label": "Estimated cost of full self-sufficiency", "position": "bottom-right" }
  ]
}
```

**Key fields:**
- `nodes[].type` — determines shape: `"nation"` (rect), `"institution"` (rounded), `"actor"` (circle), `"concept"` (diamond)
- `edges[].style` — `"solid"` (active), `"dashed"` (potential), `"blocked"` (restricted)
- `nodes[].position` — optional `{x, y}` in 0-1 normalized coords (overrides auto-layout)

---

## TimeSeriesChart

Multi-series line charts with annotations, eras, and reference lines.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Semiconductor Capex Over Time",
  "lines": [
    {
      "label": "TSMC",
      "color": "#A64D46",
      "points": [{ "x": 2015, "y": 10 }, { "x": 2020, "y": 17 }, { "x": 2025, "y": 36 }],
      "areaFill": true
    }
  ],
  "annotations": [
    { "x": 2022, "label": "October 7 controls", "sublabel": "Full-spectrum restrictions" }
  ],
  "eras": [
    { "from": 2018, "to": 2022, "label": "Escalation period", "color": "#A64D46" }
  ],
  "referenceLines": [
    { "y": 25, "label": "Breakeven threshold", "dashed": true }
  ],
  "xLabel": "Year",
  "yLabel": "Capex",
  "yUnit": "$B",
  "heroStat": { "value": "$36B", "label": "TSMC 2025 capex" }
}
```

**Key fields:**
- `lines[].points[].x` — can be number (year) or string (date)
- `lines[].width` — stroke width in px (default: 5 — was 3 before May 2026)
- `lines[].areaFill` — filled area under the line (default false)
- `eras[]` — shaded background bands for time periods
- `xLabel` — RENDERS now (rotated below x-axis ticks). Was a dead schema field before May 2026.
- `yLabel` — RENDERS now (rotated 90° on left side of chart).
- `heroStat` — large stat callout in corner

**Behaviors enabled by default:**
- **Auto-legend**: when `lines.length > 1`, a legend strip renders top-right of chart automatically (colored swatch + label per series). No opt-in needed.
- **Leading-edge marker**: a glowing dot tracks the tip of each line as it draws, then fades when the line completes. Adds NYT-style "recording instrument" feel without configuration.
- **Niced y-axis**: clamps at 0 for all-positive data, snaps min/max to round numbers, generates ticks at multiples of nice spacing. Pass `yRange` to override.

**Variants:**

- **`line`** (default) — multi-series line chart with all lines on a shared axis. Default behavior; omit `variant` field.
- **`slope`** — two-point slope chart (start value → end value per series). Use for "rank shuffle" or "before vs. after" stories where the in-between trajectory doesn't matter and the slope itself is the punchline.
- **`small-multiples`** — grid of mini line charts, one per series, with shared y-axis scaling. Use when N is large (≥ 4 series) and overlapping lines turn into a spaghetti plot. Each line gets its own panel; `referenceBands` and `eras` apply across all panels.

---

## SankeyFlow

Flow and allocation diagrams (trade, resources, budget).

```jsonc
{
  "episode": "silicon-trap",
  "title": "CHIPS Act Funding Flow",
  "nodes": [
    { "id": "chips", "label": "CHIPS Act", "value": 280, "color": "#4A7BA7", "column": 0 },
    { "id": "fab", "label": "Fabrication", "value": 200, "column": 1 },
    { "id": "rd", "label": "R&D", "value": 50, "column": 1 }
  ],
  "links": [
    { "from": "chips", "to": "fab", "value": 200, "label": "Manufacturing" },
    { "from": "chips", "to": "rd", "value": 50 }
  ],
  "valuePrefix": "$",
  "valueSuffix": "B",
  "showValues": true
}
```

**Key fields:**
- `nodes[].column` — 0-indexed column position (left to right)
- `nodes[].color` — colors the node's vertical bar. **If omitted, auto-assigns from the categorical sequence** (muted blue → rust → gold → umber → walnut → taupe). Always specify for nodes that need a specific semantic color (e.g. red for waste, green for useful).
- `links[].value` — determines ribbon thickness, proportional to source-node outflow share × source-node height. (Old behavior: capped at 16px stroke width — fixed May 2026.)

**Render behaviors (no opt-in):**
- **Thin colored bars**: nodes are 14px-wide colored vertical stripes, not wide translucent boxes. The bar's *height* carries the value; width is purely visual.
- **Filled bezier ribbons**: links are filled trapezoids stacked along node edges, not stroked lines through node centers. Source/dest endpoints stack proportionally so flows align with the node-edge they touch.
- **Smart label placement**: labels for first + middle columns sit outside-LEFT of the bar; last-column labels sit outside-RIGHT. Both stacked above the value text. Strong text-shadow halo for readability over crossing ribbons.
- **Vertical bias**: each column's stack centers vertically with a 35/65 top/bottom bias so the diagram feels anchored to the title rather than floating mid-frame.

---

## GameBoard

Strategic game theory: chess, go, payoff matrix.

```jsonc
// Chess variant
{
  "episode": "silicon-trap",
  "title": "The Chip War Board",
  "variant": "chess",
  "boardSize": 8,
  "initialPieces": [
    { "position": [4, 0], "label": "TSMC", "color": "#A64D46" }
  ],
  "phases": [
    { "label": "Opening Move", "durationSec": 3,
      "pieces": [{ "position": [3, 2], "label": "ASML", "color": "#C4A747" }] }
  ]
}

// Go variant
{
  "variant": "go",
  "boardSize": 9,
  "initialStones": [],
  "phases": [
    { "label": "Encirclement begins", "durationSec": 3,
      "stones": [{ "position": [4, 4], "stone": "black", "label": "US" }] }
  ]
}

// Payoff matrix variant
{
  "variant": "payoff-matrix",
  "rowPlayer": "US",
  "colPlayer": "China",
  "rowOptions": ["Restrict", "Engage"],
  "colOptions": ["Self-develop", "Cooperate"],
  "cells": [
    { "row": 0, "col": 0, "value": "-3, -2", "highlight": true }
  ],
  "phases": [
    { "label": "Nash Equilibrium", "durationSec": 4, "highlights": [0] }
  ]
}

// Canonical prisoner's dilemma variant
{
  "variant": "pd-canonical",
  "rowPlayer": "You",
  "colPlayer": "Them",
  "rowOptions": ["Cooperate", "Defect"],
  "colOptions": ["Cooperate", "Defect"],
  "cells": [
    { "row": 0, "col": 0, "value": "3, 3",  "cellType": "R", "heroRole": "moral" },
    { "row": 0, "col": 1, "value": "0, 5",  "cellType": "S" },
    { "row": 1, "col": 0, "value": "5, 0",  "cellType": "T" },
    { "row": 1, "col": 1, "value": "1, 1",  "cellType": "P", "heroRole": "analytical" }
  ],
  "showTPRSLegend": true,
  "showBestResponseArrows": true,
  "showNashGlyph": true,
  "phases": [
    { "label": "Payoffs revealed",        "durationSec": 3 },
    { "label": "Nash equilibrium",         "durationSec": 4, "highlights": [3] }
  ]
}

// Iterated play variant — N rounds of an iterated game
{
  "variant": "iterated-play",
  "rowPlayer": "Tit-for-Tat",
  "colPlayer": "Always Defect",
  "rowOptions": ["C", "D"],
  "colOptions": ["C", "D"],
  "cells": [
    { "row": 0, "col": 0, "value": "3, 3" },
    { "row": 0, "col": 1, "value": "0, 5" },
    { "row": 1, "col": 0, "value": "5, 0" },
    { "row": 1, "col": 1, "value": "1, 1" }
  ],
  "rounds": [
    { "label": "Round 1", "highlights": [1], "annotation": "Sucker payoff" },
    { "label": "Round 2", "highlights": [3], "annotation": "Mutual defection locks in" }
  ]
}
```

**Variants:**

- **`chess`** — chess board with `initialPieces` + per-phase `pieces` arrays. For positional / power-projection stories.
- **`go`** — go board with `initialStones` + per-phase `stones` arrays. For encirclement / territorial-control stories. Default `boardSize: 9` or `19`.
- **`payoff-matrix`** — generic 2×N game matrix. Pass `rowPlayer` / `colPlayer` / `rowOptions` / `colOptions` / `cells[]`, with `phases[].highlights` indexing into `cells`.
- **`pd-canonical`** — the textbook prisoner's dilemma form. Cells carry `cellType: "T" | "R" | "P" | "S"` (Temptation, Reward, Punishment, Sucker — the standard PD payoff labels) and `heroRole: "moral" | "analytical"` (which cell is the moral pull — mutual cooperation — and which is the analytical conclusion — mutual defection). Three optional render flags: `showTPRSLegend` (legend for the T/R/P/S corner labels), `showBestResponseArrows` (arrows showing each player's dominant strategy), `showNashGlyph` (highlight the Nash equilibrium cell with the channel's ∴ glyph). Use whenever the episode invokes the canonical PD; the structural payoff labels are the whole point.
- **`iterated-play`** — same payoff matrix, but the timeline is `rounds[]` instead of `phases[]`. Each round has a `label`, `highlights[]` (which cells fire that round), and an optional `annotation`. Schema requires non-empty `rounds`. Use for Axelrod-style iterated tournaments, repeated games, evolving strategy.

---

## BayesianUpdate

Animated probability distribution curve shifting with sequential evidence.

```jsonc
// Single variant
{
  "episode": "silicon-trap",
  "title": "Will Export Controls Succeed?",
  "variant": "single",
  "prior": 55,
  "question": "P(US export controls achieve lasting tech advantage)",
  "evidence": [
    { "label": "COCOM precedent: 45 years vs USSR", "direction": "up", "magnitude": 3, "source": "Cold War data" },
    { "label": "China's economy 6× more integrated", "direction": "down", "magnitude": 4 }
  ],
  "marketPrice": 42,
  "marketSource": "Kalshi"
}

// Compare variant
{
  "variant": "compare",
  "hypotheses": [
    { "label": "Controls succeed", "prior": 55, "color": "#4A7BA7" },
    { "label": "Controls backfire", "prior": 45, "color": "#A64D46" }
  ],
  "evidence": [
    { "label": "SMIC 7nm breakthrough", "direction": "down", "magnitude": 3 }
  ]
}
```

**Key fields:**
- `evidence[].direction` — `"up"` increases probability, `"down"` decreases
- `evidence[].magnitude` — 1 (marginal nudge) to 5 (dramatic shift)
- `marketPrice` — shown as amber dashed vertical reference line

---

## StatReveal

Dramatic single-statistic reveal with comparison bars.

```jsonc
{
  "episode": "silicon-trap",
  "title": "The Scale of Investment",
  "subtitle": "CHIPS Act funding vs. comparable programs",
  "stat": {
    "value": 280,
    "prefix": "$",
    "suffix": "B",
    "label": "Total CHIPS Act + private commitments",
    "decimals": 0
  },
  "comparisons": [
    { "label": "Apollo Program (adj.)", "value": 194, "color": "#4A7BA7" },
    { "label": "Marshall Plan (adj.)", "value": 173, "color": "#5DAA68" },
    { "label": "Manhattan Project (adj.)", "value": 30, "color": "#A64D46" }
  ],
  "heroIsMax": true
}
```

**Key fields:**
- `stat.prefix/suffix` — formatting around the number (e.g., "$280B")
- `stat.decimals` — decimal places (default: 0)
- `heroIsMax` — if true (default), hero stat is the largest bar

---

## RadarChart

Multi-axis polygon capability comparison.

```jsonc
{
  "episode": "EP02",
  "title": "Strategic Capability Comparison",
  "axes": [
    { "label": "Military", "short": "MIL" },
    { "label": "Economic", "short": "ECON" },
    { "label": "Technological", "short": "TECH" }
  ],
  "subjects": [
    { "name": "United States", "values": [95, 85, 92], "color": "#4A7BA7", "fillOpacity": 0.15 },
    { "name": "China", "values": [70, 78, 75], "color": "#A64D46", "fillOpacity": 0.15 }
  ],
  "morphFrom": [
    { "name": "United States", "values": [90, 90, 80], "color": "#4A7BA7" },
    { "name": "China", "values": [50, 60, 45], "color": "#A64D46" }
  ],
  "gridLevels": [25, 50, 75, 100]
}
```

**Key fields:**
- `subjects[].values` — array of 0-100 numbers, same length and order as `axes`
- `morphFrom` — optional prior state; polygons morph from these values to current
- `gridLevels` — concentric gridline levels (default: [25, 50, 75, 100])

---

## AnnotatedImage

Image with animated callout labels.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Inside the ASML EUV Machine",
  "imageSrc": "episodes/silicon-trap/euv-machine.jpg",
  "imageAlt": "ASML EUV lithography machine cross-section",
  "duotoneRamp": "standard",          // "standard"|"conflict"|"editorial"
  "callouts": [
    { "x": 30, "y": 35, "label": "Tin Droplet Generator", "detail": "50,000 droplets/second", "placement": "left" },
    { "x": 50, "y": 50, "label": "CO₂ Laser", "detail": "20kW", "placement": "right", "color": "#C4A747" }
  ]
}
```

**Key fields:**
- `callouts[].x/y` — percentage position (0-100) relative to image dimensions
- `callouts[].placement` — `"top"` | `"bottom"` | `"left"` | `"right"` (default: `"right"`)
- `duotoneRamp` — brand treatment ramp applied to the image

---

## EscalationLadder

Vertical event sequence with severity indicators.

```jsonc
{
  "episode": "silicon-trap",
  "title": "Semiconductor Sanctions Escalation",
  "direction": "escalation",          // "escalation"|"de-escalation"
  "rungs": [
    { "label": "Entity List additions", "date": "May 2019", "severity": "moderate",
      "detail": "Targeted restrictions on specific companies" },
    { "label": "October 7 export controls", "date": "Oct 2022", "severity": "high",
      "detail": "Full-spectrum restrictions", "current": true }
  ]
}
```

**Key fields:**
- `rungs[].severity` — `"low"` (green) | `"moderate"` (amber) | `"elevated"` (amber+) | `"high"` (rust) | `"critical"` (red)
- `rungs[].current` — shows pulsing indicator for latest/active step
- `direction` — affects visual tone (default: `"escalation"`)

---

## ImageComposite

Brand-treated photo with text overlay.

```jsonc
{
  "episode": "silicon-trap",
  "variant": "background",            // "background"|"inset"|"portrait"
  "title": "Morris Chang",
  "subtitle": "The man who built TSMC",
  "imagePath": "episodes/silicon-trap/morris-chang.jpg",
  "duotone": "standard",
  "textPosition": "bottom-left"       // "bottom-left"|"bottom-right"|"center"
}

// Portrait variant
{
  "variant": "portrait",
  "imagePath": "episodes/silicon-trap/morris-chang.jpg",
  "personName": "Morris Chang",
  "personTitle": "Founder of TSMC"
}
```

---

## PhotoMontage

Multi-photo grid with reveal animation.

```jsonc
{
  "episode": "silicon-trap",
  "title": "The Chip War",
  "transition": "dissolve",           // "cut"|"dissolve"|"wipe-left"
  "transitionDurationSec": 0.3,
  "images": [
    {
      "src": "episodes/silicon-trap/tsmc-fab.jpg",
      "durationSec": 3,
      "treatment": "standard",        // "standard"|"conflict"|"editorial"
      "compositeMode": "background",   // "background"|"inset"
      "overlay": { "text": "TSMC Fab 18", "position": "bottom-left", "style": "label" }
    }
  ]
}
```

**Key fields:**
- `images[].overlay.style` — `"stat"` (large number), `"label"` (medium text), `"caption"` (small text)
- `images[].secondaryOverlay` — optional date stamp at top corner

---

## File Naming Convention

```
data/episodes/epXX/<template-type>-<descriptive-slug>.json
```

Examples:
- `data/episodes/silicon-trap/datachart-chip-production-share.json`
- `data/episodes/silicon-trap/kinetic-ka-bozi-definition.json`
- `data/episodes/silicon-trap/choropleth-export-control-coalition.json`
- `data/episodes/silicon-trap/bayesian-export-controls.json`
- `data/episodes/silicon-trap/statreveal-chips-act-scale.json`
- `data/episodes/silicon-trap/radar-strategic-comparison.json`
- `data/episodes/silicon-trap/escalation-sanctions-timeline.json`
- `data/episodes/silicon-trap/annotated-euv-machine.json`

---

## Templates without dedicated schema documentation here

The following 15 live templates render fine and have full Zod schemas in their template directories, but no dedicated section has been authored in this doc yet. Until added, the per-template `schema.ts` is the source of truth. Read those files directly when authoring data files for these templates; the family SELECTORs name when to reach for each.

| Template | Family | Source of truth | Dossier |
|---|---|---|---|
| **TilegramUSMap** | Maps | `src/templates/TilegramUSMap/schema.ts` | `references/template-research/tilegram-us-map.md` |
| **ArcDiagram** | Diagrams | `src/templates/ArcDiagram/schema.ts` | `references/template-research/arc-diagram.md` |
| **BeeswarmChart** | Charts | `src/templates/BeeswarmChart/schema.ts` | `references/template-research/beeswarm-chart.md` |
| **BumpChart** | Charts | `src/templates/BumpChart/schema.ts` | `references/template-research/bump-chart.md` |
| **CalendarHeatmap** | Charts | `src/templates/CalendarHeatmap/schema.ts` | `references/template-research/calendar-heatmap.md` |
| **ConnectedScatterplot** | Charts | `src/templates/ConnectedScatterplot/schema.ts` | `references/template-research/connected-scatterplot.md` |
| **DumbbellPlot** | Charts | `src/templates/DumbbellPlot/schema.ts` | `references/template-research/dumbbell-plot.md` |
| **HorizonChart** | Charts | `src/templates/HorizonChart/schema.ts` | `references/template-research/horizon-chart.md` |
| **IsotypeChart** | Charts | `src/templates/IsotypeChart/schema.ts` | `references/template-research/isotype-chart.md` |
| **MarimekkoChart** | Charts | `src/templates/MarimekkoChart/schema.ts` | `references/template-research/marimekko-chart.md` |
| **PopulationPyramid** | Charts | `src/templates/PopulationPyramid/schema.ts` | `references/template-research/population-pyramid.md` |
| **RankChangeDotPlot** | Charts | `src/templates/RankChangeDotPlot/schema.ts` | `references/template-research/rank-change-dot-plot.md` |
| **RidgelinePlot** | Charts | `src/templates/RidgelinePlot/schema.ts` | `references/template-research/ridgeline-plot.md` |
| **Streamgraph** | Charts | `src/templates/Streamgraph/schema.ts` | `references/template-research/streamgraph.md` |
| **TernaryPlot** | Charts | `src/templates/TernaryPlot/schema.ts` | `references/template-research/ternary-plot.md` |

All 15 templates use the shared `_direction` field via `DirectionBlockSchema` (see `src/hooks/directionBlock.schema.ts`) and conform to the same editorial-shell fields documented in `src/templates/_shared/compositionBase.ts` (May 17, 2026). When this doc is expanded inline, follow the per-section pattern used for the existing 30+ entries above.
