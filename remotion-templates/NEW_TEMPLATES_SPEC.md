# New Remotion Templates — Specification

> ⚠️ **HISTORICAL — pre-May 11, 2026.** This document was the design spec when the original batch of templates was being built. All templates described here have shipped; the canonical reference for current schemas is now [`references/template-schemas.md`](./references/template-schemas.md). Any **"Space Grotesk"** mention in this file is also stale per D40 (May 10, 2026 — display face migrated to IBM Plex Sans). Keep this file for design-rationale history; do not use it as authoritative spec for new work.
>
> Design spec for 5 new templates + map infrastructure migration. Each template section defines: purpose, data schema (TypeScript types), animation behavior, variants, and silicon-trap usage. Follows existing patterns: types in `types.ts`, component in `TemplateName.tsx`, barrel export in `index.tsx`.
>
> All templates share existing infrastructure: `theme.ts` (palette, fonts, spacing), `animation.ts` (fadeIn, stagger, exitFade, spring), `Background` component, `FadeIn` component, `MetadataStrip`.

---

## 0. Map Infrastructure Migration (react-simple-maps → Mapbox GL + deck.gl)

### Problem

The current ChoroplethMap and RouteAnimation templates use `react-simple-maps`, which renders flat SVG fills on a 2D Natural Earth projection. No terrain, no bathymetry, no hillshading, no 3D camera movement. The result looks educational/amateur rather than broadcast-quality. Since maps are the workhorse visual for a geopolitics channel, this needs to be production-grade.

### Target Stack

| Layer | Library | Role |
|-------|---------|------|
| Map renderer | `mapbox-gl` + `react-map-gl` | WebGL-rendered vector tiles, terrain, hillshading, bathymetry, custom styles |
| Data overlays | `@deck.gl/layers` + `@deck.gl/mapbox` | GeoJsonLayer (country fills), ArcLayer (trade routes), ScatterplotLayer (city markers) |
| Remotion bridge | `@remotion/media-utils` + GPU rendering | Capture WebGL canvas frames into Remotion's rendering pipeline |
| Style system | Mapbox Studio custom style | Dark mode matching Meridian palette (ink background, muted land, amber/bone labels) |

### Why Mapbox GL

Three options were evaluated:

1. **Mapbox GL + deck.gl** — WebGL rendering, 3D terrain (mapbox-dem-v1), camera tilt/rotation, custom vector tile styles, deck.gl analytics layers. Highest visual ceiling. Free tier: 50K map loads/month (sufficient for video rendering, since renders happen locally).
2. **Improve react-simple-maps** — Add SVG gradients/textures for land, manual bathymetry layers. Moderate improvement, still fundamentally 2D SVG. Diminishing returns.
3. **Pre-rendered tiles + Canvas** — Use static map tiles from Stamen/CartoDB. Simple to implement, but no 3D, no camera animation, limited interactivity. Looks better than react-simple-maps but still flat.

**Decision: Option 1 (Mapbox GL + deck.gl).** The visual ceiling justifies the complexity. Maps appear in nearly every episode and set the production quality bar.

### Mapbox Setup

#### API Key

Store the Mapbox access token in `.env` as `MAPBOX_ACCESS_TOKEN`. Read at build time via Remotion's `getInputProps()` or `process.env`. Never commit the token.

#### Custom Map Style (Meridian Dark)

Create a custom Mapbox Studio style to match the Meridian palette:

| Map element | Color | Notes |
|-------------|-------|-------|
| Background (ocean) | `#0E0E1A` | Slightly darker than ink (`#1A1A2E`) for depth |
| Land fill | `#1A1A2E` (ink) | Base land color, matches video background |
| Land borders | `#2A2A42` | Subtle, 0.5px, lighter ink |
| Water labels | `#4A4A6A` | Very muted, almost invisible |
| Country labels | `#F0E6D0` (bone) | Only major countries, Space Grotesk |
| Highlighted country | Via deck.gl GeoJsonLayer | Not in base style — applied as overlay |
| Terrain hillshading | `mapbox-dem-v1` | Exaggeration: 1.5 for subtle relief |
| Bathymetry | Mapbox built-in contours | Subtle ocean depth lines |

Export the style ID (e.g., `mapbox://styles/parallax/xxxxx`) and reference it in theme.ts:

```typescript
// In theme.ts — map configuration
export const mapConfig = {
  styleUrl: "mapbox://styles/parallax/xxxxx",
  terrain: {
    source: "mapbox-dem",
    exaggeration: 1.5,
  },
  defaultCamera: {
    longitude: 20,
    latitude: 25,
    zoom: 1.8,
    pitch: 30,      // slight 3D tilt
    bearing: 0,
  },
  projection: "globe",  // globe projection for wide shots
} as const;
```

### Remotion + WebGL Rendering

Mapbox GL renders to a WebGL canvas. Remotion needs to capture these frames.

**Configuration for `remotion.config.ts`:**

```typescript
Config.setChromiumOpenGlRenderer("angle");  // or "swiftshader" for CI
```

**For Lambda renders:** Use Remotion's GPU-enabled Lambda layer (`--gl=angle`). See Remotion docs for `enableMultiprocessOnLinux()`.

**Key constraint:** The map must be fully loaded (tiles + terrain) before Remotion captures the frame. Use `delayRender()` / `continueRender()`:

```typescript
const [mapLoaded, setMapLoaded] = useState(false);
const handle = useMemo(() => delayRender(), []);

// In MapGL onLoad callback:
const onMapLoad = useCallback(() => {
  setMapLoaded(true);
  continueRender(handle);
}, [handle]);
```

### Shared Map Component

Create a `MapGL` shared component (`src/components/MapGL.tsx`) that wraps `react-map-gl` with Parallax defaults:

```typescript
interface MapGLProps {
  /** Camera state — animated via useCurrentFrame() */
  longitude: number;
  latitude: number;
  zoom: number;
  pitch?: number;    // default 30
  bearing?: number;  // default 0
  /** deck.gl layers to overlay */
  layers?: any[];
  /** Callback when map + terrain are fully loaded */
  onLoad?: () => void;
  /** Whether to use globe projection (default true for zoom < 3) */
  globe?: boolean;
  children?: React.ReactNode;
}
```

This component handles:
- Loading the Meridian Dark style
- Enabling terrain (`mapbox-dem-v1`)
- `delayRender()` / `continueRender()` lifecycle
- Passing deck.gl layers via `MapboxOverlay`
- Disabling all interaction (no mouse events — this is video, not interactive)

### Camera Animation Patterns

Animate camera properties using Remotion's `interpolate()` + `useCurrentFrame()`:

```typescript
const frame = useCurrentFrame();
const { fps } = useVideoConfig();

// Smooth zoom-in over 2 seconds
const zoom = interpolate(frame, [0, fps * 2], [1.8, 4.5], {
  easing: Easing.inOut(Easing.cubic),
  extrapolateRight: "clamp",
});

// Pan from world view to East Asia
const longitude = interpolate(frame, [0, fps * 2], [20, 116], {
  easing: Easing.inOut(Easing.cubic),
  extrapolateRight: "clamp",
});

// Tilt up during zoom
const pitch = interpolate(frame, [0, fps * 2], [30, 45], {
  easing: Easing.inOut(Easing.cubic),
  extrapolateRight: "clamp",
});
```

Common camera moves:
- **World → region**: zoom 1.8 → 4.5, pitch 30 → 45, duration 2s
- **Region → city**: zoom 4.5 → 8, pitch 45 → 50, duration 1.5s
- **Slow orbit**: bearing 0 → 15 over 5s (subtle rotation during a hold)
- **Pull back**: reverse any of the above

### deck.gl Layer Patterns

#### Country Highlights (GeoJsonLayer)

Replace react-simple-maps `<Geography>` fills:

```typescript
new GeoJsonLayer({
  id: "country-highlights",
  data: countriesGeoJson,
  filled: true,
  stroked: true,
  getFillColor: (d) => {
    const highlight = activeCountries.find(c => c.iso === d.properties.ISO_A3);
    if (!highlight) return [0, 0, 0, 0]; // transparent
    return hexToRgba(highlight.color, highlight.opacity ?? 180);
  },
  getLineColor: [42, 42, 66, 100], // subtle borders
  lineWidthMinPixels: 0.5,
  // Animate opacity via frame
  updateTriggers: {
    getFillColor: [activeCountries, frame],
  },
});
```

#### Trade Routes (ArcLayer)

Replace react-simple-maps SVG path lines:

```typescript
new ArcLayer({
  id: "trade-routes",
  data: activeRoutes,
  getSourcePosition: (d) => d.from,  // [lon, lat]
  getTargetPosition: (d) => d.to,
  getSourceColor: hexToRgba(palette.amber, 200),
  getTargetColor: hexToRgba(palette.amber, 200),
  getWidth: 2,
  greatCircle: true,  // curved along Earth's surface
  // Animate: only show routes whose startFrame <= current frame
  getHeight: 0.3,     // arc height
});
```

#### City/Point Markers (ScatterplotLayer)

```typescript
new ScatterplotLayer({
  id: "city-markers",
  data: activePoints,
  getPosition: (d) => d.coordinates,
  getRadius: (d) => d.importance === "primary" ? 6 : 4,
  getFillColor: (d) => hexToRgba(d.color),
  radiusUnits: "pixels",
  // Labels rendered as Remotion <AbsoluteFill> overlays, not deck.gl text
});
```

**Labels:** Don't use deck.gl's TextLayer for labels. Instead, project map coordinates to screen coordinates using `map.project([lon, lat])` and render labels as Remotion `<AbsoluteFill>` overlays with proper font control (Space Grotesk, IBM Plex Mono per BRAND.md).

### Impact on Existing Templates

#### ChoroplethMap — Full Rewrite

The current `ChoroplethMap.tsx` (320 lines, react-simple-maps) gets rewritten to use the shared `MapGL` component. The **data schema stays identical** — `ChoroplethMapData`, `AnimationPhase`, `CountryData` types don't change. Only the rendering implementation changes.

Key differences:
- `<ComposableMap>` / `<Geographies>` / `<Geography>` → `<MapGL>` + `GeoJsonLayer`
- SVG-based country labels → projected screen-space labels
- Static projection center → animated camera (zoom, pan, pitch per phase)
- No terrain → terrain + hillshading + bathymetry

New capabilities enabled by the migration:
- 3D camera tilt and orbit
- Smooth animated camera transitions between phases
- Terrain hillshading (mountain ranges visible)
- Ocean bathymetry (depth contours)
- Globe projection for wide shots
- Per-phase camera state (`center`, `zoom`, `pitch`, `bearing` on each `AnimationPhase`)

#### RouteAnimation — Full Rewrite

Same approach: `RouteAnimation.tsx` gets rewritten, data schema stays identical. `RoutePoint`, `RouteSegment`, `RoutePhase` types are preserved.

Key differences:
- SVG `<line>` / `<path>` elements → `ArcLayer` (great circle arcs on the actual globe)
- Flat 2D map → 3D terrain with trade routes curving over the Earth
- Static center → animated camera following the route progression
- `RoutePhase.center` and `RoutePhase.scale` → `RoutePhase.camera: { lon, lat, zoom, pitch, bearing }`

**Schema extension** (backward-compatible):

```typescript
// Add to RoutePhase
export interface RoutePhase {
  // ... existing fields ...
  /** Camera state for this phase (new — falls back to center/scale if absent) */
  camera?: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
  };
}
```

### GeoJSON Data Source

Both templates need country boundary GeoJSON. Options:

- **Natural Earth 110m** (current): Already bundled. 800KB. Good for world views.
- **Natural Earth 50m**: 4MB. Better coastlines for regional zooms. Bundle for zoom > 3.
- **Mapbox vector tiles**: Loaded automatically by the map style — no separate GeoJSON needed for visual rendering. But deck.gl overlay layers still need GeoJSON for `getFillColor` logic.

**Recommendation:** Keep Natural Earth 110m GeoJSON for deck.gl overlay layers (country highlighting logic). The base map visual quality comes from Mapbox vector tiles, not from the GeoJSON resolution.

### Dependencies

```json
{
  "mapbox-gl": "^3.x",
  "react-map-gl": "^7.x",
  "@deck.gl/core": "^9.x",
  "@deck.gl/layers": "^9.x",
  "@deck.gl/mapbox": "^9.x"
}
```

`react-simple-maps` can be removed after migration is complete.

### Build Order (Map Migration)

1. Create Mapbox Studio custom style (Meridian Dark) — requires Mapbox account setup
2. Build shared `MapGL` component with `delayRender` lifecycle
3. Create `mapUtils.ts` — `hexToRgba()`, coordinate projection helpers, camera interpolation presets
4. Rewrite `ChoroplethMap.tsx` (higher reuse — appears in more episodes)
5. Rewrite `RouteAnimation.tsx`
6. Verify GPU rendering works locally (`--gl=angle`) and on Lambda
7. Remove `react-simple-maps` dependency

This migration should happen **before** building the 5 new templates, since NetworkDiagram and other templates may benefit from the shared `MapGL` component for hybrid layouts (e.g., a network diagram overlaid on a geographic region).

### MapLibre GL Fallback

If Mapbox costs become a concern at scale, MapLibre GL JS is an open-source fork with identical API. Swap `mapbox-gl` → `maplibre-gl` and `react-map-gl` provider to MapLibre. Use free tile sources (OpenFreeMap, Protomaps). Terrain available via AWS Terrain Tiles. The shared `MapGL` component abstracts this — only one file changes.

---

## 1. NetworkDiagram

### Purpose

Nodes connected by edges with labels, data callouts, and control points. Replaces all Claude SVG "network/flow" illustrations with deterministic rendering.

Use cases: supply chain dependencies, alliance networks, trade relationships, actor-influence maps, institutional dependency graphs.

### Why This Can't Be an Existing Template

- **RouteAnimation** renders on a geographic map with lat/lon coordinates. NetworkDiagram is abstract — nodes represent concepts, not places.
- **FrameworkDiagram::flow** is a linear sequence (A → B → C). NetworkDiagram supports arbitrary graph topology (hub-spoke, circular, multi-path).
- **FrameworkDiagram::comparison** is columnar. NetworkDiagram positions nodes freely in 2D space.

### Layout System

The template computes node positions from a **layout preset**, so Claude only needs to choose the topology — not calculate x,y coordinates.

| Preset | Description | Best for |
|--------|-------------|----------|
| `horizontal-chain` | Left-to-right evenly spaced | Supply chains, process flows |
| `hub-spoke` | Central node with radials | Dependency graphs, one-to-many |
| `grid` | Rows × columns | Comparison matrices, actor maps |
| `vertical-chain` | Top-to-bottom evenly spaced | Hierarchies, escalation ladders |

Nodes can override their computed position with explicit `position: { x, y }` (normalized 0-1 coordinate space, mapped to safe area at render time). This handles outliers like "China sits below the main chain" without requiring full manual layout.

### Data Schema

```typescript
export interface NetworkNode {
  id: string;
  label: string;
  sublabel?: string;
  /** Node shape following visual vocabulary */
  type: "nation" | "institution" | "actor" | "concept";
  /** Semantic color token from theme.ts (e.g., "amber", "rust", "bone") */
  color: string;
  /** Primary = larger (default), secondary = smaller */
  importance?: "primary" | "secondary";
  /** Stat callout below node */
  stat?: { value: string; label: string };
  /** Override computed position (0-1 normalized coordinates) */
  position?: { x: number; y: number };
}

export interface NetworkEdge {
  from: string;  // node id
  to: string;    // node id
  style: "solid" | "dashed" | "blocked";
  /** Optional label on the edge */
  label?: string;
  color?: string;
}

export interface NetworkControl {
  /** Edge this control sits on (from/to node ids) */
  edge: [string, string];
  /** Short label inside the control box */
  label: string;
  color?: string;
}

export interface NetworkCallout {
  value: string;    // e.g., "$1T"
  label: string;    // e.g., "Estimated cost of full self-sufficiency"
  position: "bottom-right" | "bottom-left" | "top-right";
}

export interface NetworkDiagramData {
  episode: string;
  title: string;
  subtitle?: string;
  
  layout: "horizontal-chain" | "hub-spoke" | "grid" | "vertical-chain";
  
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  controls?: NetworkControl[];
  callout?: NetworkCallout;
  
  source?: string;
  durationSec?: number;
  backgroundTint?: string;
}
```

### Node Rendering (Visual Vocabulary)

Follows SVG_ILLUSTRATION_PIPELINE.md Section 2:

| `type` | Shape | Size (primary) | Size (secondary) |
|--------|-------|----------------|------------------|
| `nation` | Circle + inner ring | r=56 | r=44 |
| `institution` | Hexagon | 56px wide | 44px wide |
| `actor` | Circle (head) + trapezoid (shoulders) | 64px tall | 48px tall |
| `concept` | Rounded rectangle | 120×56 | 96×44 |

All nodes get: label (Space Grotesk), sublabel (IBM Plex Mono), stat (JetBrains Mono below), semantic color border, panel shadow, double-ring for nations.

### Edge Rendering

- **Straight lines only.** Start at node edge, end at node edge (computed from node center + radius + angle to target).
- `solid`: 2px stroke, color at 40% opacity, arrowhead marker.
- `dashed`: same but `stroke-dasharray="8 4"`.
- `blocked`: solid line with X mark at midpoint, rust color. Line weakens (lower opacity) after the X.

### Control Rendering

Small rounded rectangle (80×20) inline on the edge line, splitting it into two segments. Ink fill, colored border, short label in IBM Plex Mono 9px.

### Animation Sequence (follows POLISH.md A1-A7)

1. **Structure** (frames 0-15): Background gradient, grid dots fade in.
2. **Nodes** (frames 10-40): Nodes appear with spring physics, staggered by layout order (left→right for chain, center→radials for hub-spoke). 100ms stagger.
3. **Edges** (frames 30-60): Lines draw from source to target. Solid first, dashed after. 150ms stagger.
4. **Controls** (frames 50-65): Control boxes fade in on their edges.
5. **Labels & stats** (frames 55-80): Sublabels and stat callouts fade in. Stats count up.
6. **Callout** (frames 70-90): Data callout panel slides in from edge.
7. **Ken Burns hold**: 1.00→1.02 scale drift.
8. **Exit**: last 15 frames fade.

### silicon-trap Usage

- **Beat 4**: Semiconductor supply chain (Japan → Netherlands → USA → [CTRL] → Taiwan → Chip, China below)
- **Beat 2**: COCOM regime network (could augment the ChoroplethMap)
- **Beat 4**: "Caught-in-between" nations (ASML, SK Hynix, Japan photoresist)

### silicon-trap Example Data

```json
{
  "episode": "silicon-trap",
  "title": "THE SEMICONDUCTOR SUPPLY CHAIN",
  "subtitle": "Five countries, one chip — no nation can replicate this alone",
  "layout": "horizontal-chain",
  "nodes": [
    { "id": "japan", "label": "JAPAN", "sublabel": "Photoresist", "type": "nation", "color": "amber", "importance": "secondary", "stat": { "value": "70%", "label": "global share" } },
    { "id": "netherlands", "label": "NETHERLANDS", "sublabel": "EUV Lithography", "type": "nation", "color": "amber", "importance": "secondary" },
    { "id": "asml", "label": "ASML", "sublabel": "Only EUV maker", "type": "institution", "color": "amber", "importance": "secondary" },
    { "id": "usa", "label": "USA", "sublabel": "EDA Software", "type": "nation", "color": "amber", "importance": "primary" },
    { "id": "taiwan", "label": "TAIWAN", "type": "nation", "color": "amber", "importance": "primary", "stat": { "value": "92%", "label": "advanced chip share" } },
    { "id": "tsmc", "label": "TSMC", "type": "institution", "color": "amber", "importance": "secondary" },
    { "id": "china", "label": "CHINA", "sublabel": "Rare Earths + Assembly", "type": "nation", "color": "rust", "importance": "primary", "position": { "x": 0.3, "y": 0.75 } },
    { "id": "chip", "label": "Final Chip", "type": "concept", "color": "bone", "importance": "secondary" }
  ],
  "edges": [
    { "from": "japan", "to": "netherlands", "style": "solid" },
    { "from": "netherlands", "to": "usa", "style": "solid" },
    { "from": "usa", "to": "taiwan", "style": "solid" },
    { "from": "taiwan", "to": "chip", "style": "solid" },
    { "from": "china", "to": "netherlands", "style": "dashed", "color": "rust" },
    { "from": "china", "to": "taiwan", "style": "blocked", "color": "rust" }
  ],
  "controls": [
    { "edge": ["usa", "taiwan"], "label": "EXPORT CONTROLS", "color": "rust" }
  ],
  "callout": {
    "value": "$1T",
    "label": "Estimated cost of full self-sufficiency for any single nation",
    "position": "bottom-right"
  },
  "source": "Chris Miller, Chip War (2022); SIA data"
}
```

---

## 2. TimeSeriesChart

### Purpose

Lines over time with annotations, era shading, reference lines, and trend indicators. Fills the gap between DataChart (bar snapshots) and what episodes actually need for temporal data.

Use cases: yield curves, market price histories, metric trends over decades, prediction calibration, multi-variable divergence.

### Why This Can't Be DataChart

DataChart shows discrete values (bars). TimeSeriesChart shows continuous change over time (lines). Different visual grammar, different animation (line drawing vs bar growing), different data structure (x-y pairs vs single values).

### Data Schema

```typescript
export interface TimeSeriesPoint {
  /** X-axis value (typically a year or date number) */
  x: number;
  /** Y-axis value */
  y: number;
  /** Optional label at this point */
  label?: string;
}

export interface TimeSeriesLine {
  id: string;
  label: string;
  color: string;
  /** Data points, ordered by x */
  data: TimeSeriesPoint[];
  /** Line style */
  style?: "solid" | "dashed" | "dotted";
  /** Line width (default 2.5) */
  width?: number;
}

export interface TimeSeriesAnnotation {
  /** X position for the annotation marker */
  x: number;
  label: string;
  /** Optional secondary text */
  sublabel?: string;
  color?: string;
}

export interface TimeSeriesEra {
  from: number;
  to: number;
  label: string;
  color: string;
  opacity?: number;  // default 0.08
}

export interface TimeSeriesReferenceLine {
  y: number;
  label: string;
  color?: string;
  style?: "solid" | "dashed";
}

export interface TimeSeriesChartData {
  episode: string;
  title: string;
  subtitle?: string;

  xAxis: {
    label?: string;
    /** Explicit range, or auto-computed from data */
    range?: [number, number];
    /** How to format tick labels */
    format?: "year" | "number" | "month-year";
  };

  yAxis: {
    label?: string;
    range?: [number, number];
    format?: "percent" | "number" | "currency-B" | "currency-M";
  };

  /** One or more data series */
  series: TimeSeriesLine[];
  
  /** Vertical annotation markers */
  annotations?: TimeSeriesAnnotation[];
  /** Shaded background eras */
  eras?: TimeSeriesEra[];
  /** Horizontal reference/threshold lines */
  referenceLines?: TimeSeriesReferenceLine[];

  /** Optional stat callout (e.g., current value) */
  heroStat?: { value: string; label: string; color?: string };

  source?: string;
  durationSec?: number;
  backgroundTint?: string;
}
```

### Animation Sequence

1. **Structure** (frames 0-20): Axes draw in (x-axis left→right, y-axis bottom→up), tick marks fade in.
2. **Eras** (frames 15-25): Era shading fades in behind the chart area.
3. **Lines** (frames 20-60): Each series draws left→right with `stroke-dashoffset` animation. Stagger between series: 200ms.
4. **Data points** (frames 50-70): Dots appear at notable data points with spring.
5. **Reference lines** (frames 55-65): Dashed horizontal lines draw across.
6. **Annotations** (frames 60-80): Vertical markers with labels fade in.
7. **Hero stat** (frames 70-85): Large stat counts up with spring.
8. **Ken Burns + exit.**

### silicon-trap Usage

- **Beat 3**: SMIC 7nm yield improvement (<40% → 60-70% over 2023-2025)
- **Beat 4**: ASML revenue from China (36% → 20% decline)
- Future: prediction market price histories, multi-metric dashboards

### silicon-trap Example Data

```json
{
  "episode": "silicon-trap",
  "title": "SMIC 7nm YIELD IMPROVEMENT",
  "subtitle": "Without EUV lithography — multi-pass workaround",
  "xAxis": { "label": "Year", "range": [2023, 2026], "format": "year" },
  "yAxis": { "label": "Yield", "range": [0, 100], "format": "percent" },
  "series": [
    {
      "id": "smic-yield",
      "label": "SMIC 7nm (no EUV)",
      "color": "rust",
      "data": [
        { "x": 2023.0, "y": 35 },
        { "x": 2023.5, "y": 42 },
        { "x": 2024.0, "y": 48 },
        { "x": 2024.5, "y": 55 },
        { "x": 2025.0, "y": 63 },
        { "x": 2025.5, "y": 68 }
      ]
    }
  ],
  "referenceLines": [
    { "y": 92, "label": "TSMC 7nm yield", "color": "amber", "style": "dashed" }
  ],
  "annotations": [
    { "x": 2024.5, "label": "Multi-pass breakthrough", "sublabel": "34 passes vs 9 with EUV", "color": "amber" }
  ],
  "heroStat": { "value": "68%", "label": "Latest yield (mid-2025)", "color": "rust" },
  "source": "TechInsights teardown data; SemiAnalysis estimates"
}
```

---

## 3. SankeyFlow

### Purpose

Weighted flows between categories or stages. Width encodes quantity. Shows how a total splits, leaks, or funnels through stages.

Use cases: funding pipelines (authorized → disbursed), export control leakage (intended restriction → actual outcomes), resource allocation, trade flow breakdowns.

### Why This Can't Be DataChart or FrameworkDiagram

DataChart shows independent values. SankeyFlow shows how a single total **decomposes** through stages — the visual relationship between inputs and outputs is the point. FrameworkDiagram::flow is unweighted linear sequence; Sankey flows have width proportional to value and can branch.

### Data Schema

```typescript
export interface SankeyNode {
  id: string;
  label: string;
  /** Node value (determines height) */
  value: number;
  color?: string;
  /** Optional stat displayed alongside */
  stat?: string;
}

export interface SankeyLink {
  from: string;  // node id
  to: string;    // node id
  value: number;
  color?: string;
  /** Label on the flow band */
  label?: string;
}

export interface SankeyFlowData {
  episode: string;
  title: string;
  subtitle?: string;

  /** Layout direction */
  direction: "left-to-right" | "top-to-bottom";

  /** All nodes (stages/categories) */
  nodes: SankeyNode[];
  /** All flow links between nodes */
  links: SankeyLink[];

  /** Value formatting */
  valueFormat?: "currency-B" | "currency-M" | "percent" | "number";
  /** Units label (e.g., "billion", "%") */
  valueUnit?: string;

  source?: string;
  durationSec?: number;
  backgroundTint?: string;
}
```

### Layout Algorithm

Nodes are arranged in columns (left-to-right) or rows (top-to-bottom) based on graph depth. Height of each node is proportional to its value. Flow bands between nodes use cubic bezier paths with width proportional to `link.value`. The template computes all positions — Claude only provides the data.

### Animation Sequence

1. **Structure** (frames 0-15): Background, column guides fade in.
2. **Source nodes** (frames 10-25): Leftmost column nodes grow upward with spring.
3. **Flow bands** (frames 20-55): Bands draw left→right, staggered. Width animates from 0 to final.
4. **Destination nodes** (frames 40-65): Receiving nodes grow as flows arrive.
5. **Labels & stats** (frames 55-75): Value labels count up. Flow labels fade in.
6. **Ken Burns + exit.**

### silicon-trap Usage

- **Beat 2**: CHIPS Act funding funnel ($52.7B authorized → $30.9B awarded → $6B disbursed)
- **EP02**: Export control leakage (restrictions → third-party workarounds → black market)

### silicon-trap Example Data

```json
{
  "episode": "silicon-trap",
  "title": "CHIPS ACT FUNDING FLOW",
  "subtitle": "From authorization to actual disbursement",
  "direction": "left-to-right",
  "nodes": [
    { "id": "authorized", "label": "Authorized", "value": 52.7, "color": "amber" },
    { "id": "awarded", "label": "Awarded", "value": 30.9, "color": "amber" },
    { "id": "disbursed", "label": "Disbursed", "value": 6.0, "color": "amber" },
    { "id": "not-awarded", "label": "Not Yet Awarded", "value": 21.8, "color": "rust" },
    { "id": "pending", "label": "Pending Release", "value": 24.9, "color": "rust" }
  ],
  "links": [
    { "from": "authorized", "to": "awarded", "value": 30.9 },
    { "from": "authorized", "to": "not-awarded", "value": 21.8, "label": "Stalled" },
    { "from": "awarded", "to": "disbursed", "value": 6.0 },
    { "from": "awarded", "to": "pending", "value": 24.9, "label": "Pending" }
  ],
  "valueFormat": "currency-B",
  "valueUnit": "billion",
  "source": "CHIPS for America, NIST (April 2026)"
}
```

---

## 4. GameBoard

### Purpose

Strategic game visualizations with animated piece movements. Chess (piece capture), Go (territory surrounding), and payoff matrix (game theory).

Use cases: chess vs go strategic metaphors, prisoner's dilemma illustrations, game theory decision analysis, strategic competition framing.

### Why This Can't Be FrameworkDiagram

FrameworkDiagram is static comparison. GameBoard is dynamic — pieces move, are captured, placed in sequence. The board grid is a specific visual element (8×8 chess, 19×19 go) with intersection/square semantics. The animation is phase-based: each move/phase adds to the board state.

### Data Schema

```typescript
export interface ChessPiece {
  /** Board position [col, row] (0-indexed) */
  position: [number, number];
  /** Label on/near the piece */
  label: string;
  color: string;
  /** If captured in this phase */
  captured?: boolean;
}

export interface GoStone {
  /** Board intersection [col, row] (0-indexed) */
  position: [number, number];
  color: string;
  label?: string;
}

export interface PayoffCell {
  row: number;
  col: number;
  value: string;
  /** Highlight color if this is the equilibrium or focus */
  highlight?: string;
}

export interface GamePhase {
  label: string;
  sublabel?: string;
  /** Duration of this phase in seconds */
  durationSec: number;
  /** Pieces/stones to add or modify in this phase */
  pieces?: ChessPiece[];
  stones?: GoStone[];
  /** Territory claimed (go) — array of intersections */
  territory?: { positions: [number, number][]; color: string }[];
  /** Cells to highlight (payoff matrix) */
  highlightCells?: number[];
}

export interface GameBoardData {
  episode: string;
  title: string;
  subtitle?: string;

  variant: "chess" | "go" | "payoff-matrix";

  /** Board size (8 for chess, 19 or 9 for go) */
  boardSize?: number;

  /** For payoff matrix: row and column player labels */
  rowPlayer?: string;
  colPlayer?: string;
  rowOptions?: string[];
  colOptions?: string[];
  cells?: PayoffCell[];

  /** Phased animation */
  phases: GamePhase[];

  source?: string;
  durationSec?: number;
  backgroundTint?: string;
}
```

### Board Rendering

**Chess variant:** 8×8 grid with alternating ink/midnight squares. Pieces are labeled circles (no chess piece icons — too detailed for brand). Captured pieces slide off-board and fade. Company/country labels in IBM Plex Mono below each piece.

**Go variant:** 19×19 (or 9×9 simplified) grid of intersection lines on ink background. Stones are filled circles. Territory is a subtle shaded region. Labels in IBM Plex Mono. Star points (hoshi) rendered as small dots.

**Payoff matrix:** 2×2 or 3×3 grid with player labels on axes. Cell values in JetBrains Mono. Highlighted cells get accent glow. Nash equilibrium can be marked.

### Animation Sequence

**Chess/Go:**
1. **Board** (frames 0-20): Grid lines draw in.
2. **Initial pieces** (frames 15-35): Starting pieces/stones appear with stagger.
3. **Phase transitions**: Each phase adds/captures/places pieces with spring animation. Phase label appears as subtitle.
4. **Territory** (go only): Shaded regions fade in after stones are placed.
5. **Ken Burns + exit.**

**Payoff Matrix:**
1. **Grid** (frames 0-15): Matrix lines and headers draw in.
2. **Cells** (frames 15-40): Values appear with stagger.
3. **Highlights** (frames 35-55): Focus cells get accent glow.
4. **Labels** (frames 50-70): Explanation labels fade in.

### silicon-trap Usage

- **Beat 4**: Chess board (US strategy — targeting Huawei, SMIC, ASML)
- **Beat 4**: Go board (China strategy — surrounding territory with domestic capacity)
- Future: Prisoner's dilemma for export controls, payoff matrices for trade negotiations

### silicon-trap Example Data (Chess)

```json
{
  "episode": "silicon-trap",
  "title": "US STRATEGY: CHESS",
  "subtitle": "Target specific companies, capture specific pieces",
  "variant": "chess",
  "boardSize": 8,
  "phases": [
    {
      "label": "2019: Opening Move",
      "sublabel": "Entity List expansion",
      "durationSec": 3,
      "pieces": [
        { "position": [4, 4], "label": "Huawei", "color": "rust", "captured": true }
      ]
    },
    {
      "label": "2022: October Surprise",
      "sublabel": "Comprehensive export controls",
      "durationSec": 3,
      "pieces": [
        { "position": [2, 5], "label": "SMIC", "color": "rust", "captured": true },
        { "position": [6, 3], "label": "ASML", "color": "amber" }
      ]
    },
    {
      "label": "2025: Revenue Deal",
      "sublabel": "Controls become a tax",
      "durationSec": 3,
      "pieces": [
        { "position": [3, 6], "label": "Nvidia", "color": "amber" },
        { "position": [5, 2], "label": "AMD", "color": "amber" }
      ]
    }
  ]
}
```

---

## 5. PhotoMontage

### Purpose

Rapid-fire image sequence with text overlays, chip counts, date stamps. Shows multiple related images in rhythmic succession with unified pacing.

Use cases: "this affects your life" montages, historical photo sequences, geographic surveys, technology component breakdowns.

### Why This Can't Be ImageComposite

ImageComposite handles a single image with treatment. PhotoMontage handles a **timed sequence** of images with coordinated transitions and overlay text — the rhythm across the sequence is the visual grammar, not any individual frame.

### Data Schema

```typescript
export interface MontageImage {
  /** Path to image file (relative to public/) */
  src: string;
  /** Display duration in seconds */
  durationSec: number;
  /** Duotone ramp */
  treatment: "standard" | "conflict" | "editorial";
  /** Layout mode */
  compositeMode: "background" | "inset";
  /** Image opacity */
  compositeOpacity?: number;
  /** Text overlay */
  overlay?: {
    text: string;
    /** Position of overlay text */
    position: "bottom-left" | "bottom-right" | "center" | "top-right";
    /** Display style */
    style: "stat" | "label" | "caption";
  };
  /** Optional secondary overlay (e.g., date stamp) */
  secondaryOverlay?: {
    text: string;
    position: "top-left" | "top-right";
  };
}

export interface PhotoMontageData {
  episode: string;
  /** Optional title card before the sequence */
  title?: string;
  subtitle?: string;

  images: MontageImage[];

  /** Transition between images */
  transition: "cut" | "dissolve" | "wipe-left";
  /** Transition duration in seconds (default 0.3) */
  transitionDurationSec?: number;

  source?: string;
  durationSec?: number;
  backgroundTint?: string;
}
```

### Animation Behavior

Each image gets the full BrandImage treatment (4-step pipeline via SVG filters), then:

1. **Enter**: Image fades in (dissolve) or cuts in.
2. **Ken Burns**: Subtle drift during hold (1.00→1.02 scale + slight pan).
3. **Overlay**: Text overlay springs in 0.3s after image enters.
4. **Exit**: Transitions to next image.

Total duration = sum of all `image.durationSec` + transitions between them.

### silicon-trap Usage

- **Beat 5**: "Every modern car has between a thousand and three thousand chips" — car (3s) → phone (2s) → MRI (2s) → data center (2s) with chip count overlays.

### silicon-trap Example Data

```json
{
  "episode": "silicon-trap",
  "images": [
    {
      "src": "footage/silicon-trap/car-dashboard.jpg",
      "durationSec": 3,
      "treatment": "standard",
      "compositeMode": "inset",
      "compositeOpacity": 0.65,
      "overlay": { "text": "1,000–3,000 chips", "position": "bottom-left", "style": "stat" }
    },
    {
      "src": "footage/silicon-trap/smartphone-circuit.jpg",
      "durationSec": 2,
      "treatment": "standard",
      "compositeMode": "inset",
      "compositeOpacity": 0.65,
      "overlay": { "text": "~160 chips", "position": "bottom-left", "style": "stat" }
    },
    {
      "src": "footage/silicon-trap/mri-machine.jpg",
      "durationSec": 2,
      "treatment": "standard",
      "compositeMode": "inset",
      "compositeOpacity": 0.65,
      "overlay": { "text": "~1,200 chips", "position": "bottom-left", "style": "stat" }
    },
    {
      "src": "footage/silicon-trap/data-center-rack.jpg",
      "durationSec": 2,
      "treatment": "standard",
      "compositeMode": "inset",
      "compositeOpacity": 0.65,
      "overlay": { "text": "~10,000 chips per rack", "position": "bottom-left", "style": "stat" }
    }
  ],
  "transition": "dissolve",
  "transitionDurationSec": 0.3,
  "source": "SIA, IHS Markit semiconductor data"
}
```

---

## Build Order

| Priority | Item | Complexity | silicon-trap Need | Reuse Across Episodes |
|----------|------|------------|-----------|----------------------|
| 0 | **Map Infrastructure Migration** | High | ChoroplethMap + RouteAnimation used in Beats 1, 3, 4 | Every episode |
| 1 | **NetworkDiagram** | High | Beat 4 supply chain | Every episode |
| 2 | **TimeSeriesChart** | Medium | Beat 3 yield curve | Most episodes |
| 3 | **SankeyFlow** | Medium | Beat 2 CHIPS funnel | EP02+ |
| 4 | **GameBoard** | Medium | Beat 4 chess/go | Arc 3 game theory |
| 5 | **PhotoMontage** | Low | Beat 5 chip montage | Occasional |

Map migration comes first — it upgrades two existing templates used heavily in silicon-trap and establishes the shared `MapGL` component that new templates may compose with.

Estimated build time: Map migration is high complexity (Mapbox style setup, WebGL rendering pipeline, two template rewrites). NetworkDiagram is the heaviest new template (layout algorithm + multiple node types + edge routing). TimeSeriesChart and SankeyFlow are medium (coordinate math + line rendering). GameBoard is medium (grid rendering + phased state). PhotoMontage is lightest (sequence wrapper around existing BrandImage).

---

## Shared Infrastructure Needed

Before building individual templates, these shared pieces should exist:

1. **`layoutPresets.ts`** — Computes node positions for NetworkDiagram presets. Takes node count + layout type, returns `{ x, y }[]` within the safe area. Reusable if SankeyFlow or other templates need auto-layout.

2. **`drawLine.ts`** — Utility for animated straight-line drawing (stroke-dashoffset technique). Used by NetworkDiagram edges and TimeSeriesChart lines.

3. **`countUp.ts`** — Animated number counter (already partially in DataChart — extract to shared utility). Used by TimeSeriesChart hero stats, SankeyFlow value labels, NetworkDiagram stat callouts.

These exist partially in animation.ts and DataChart already. Extraction rather than new code.
