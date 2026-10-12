# FlowMap — Template Dossier

**Template:** `FlowMap`  
**Family:** Maps (Mapbox via `MapGL` + deck.gl ArcLayer)  
**Schema:** `src/templates/FlowMap/schema.ts`  
**Component:** `src/templates/FlowMap/FlowMap.tsx`  
**Shipped:** May 20, 2026

---

## Editorial argument

**Directional volume flows where the amount is the argument.** Arc width encodes comparative magnitude — the viewer should immediately grasp that India receives 3× the oil Russia sends to Turkey, without being told.

Key distinction from RouteAnimation:
- **RouteAnimation:** equal-width arcs showing a *path* or *route*; multiple phases; the path IS the argument (trade routes, military campaigns).
- **FlowMap:** variable-width arcs showing *how much*; magnitude comparison IS the argument.

Use when the argument is "X sends significantly more to A than to B." Examples:
- Russian oil rerouting post-2022 (India 1.8Mbpd, China 1.2Mbpd, Turkey 0.6Mbpd)
- Semiconductor supply chain flows (TSMC → USA/EU/China in different volumes)
- Arms transfer magnitudes between blocs

---

## State-of-the-art editorial reference

**NYT, Bloomberg, FT** all use this form for trade/commodity flows. Key conventions:
- Arc width on a **square-root scale** — absolute width would make small flows invisible; sqrt compresses the range while preserving the ordering. FT and Bloomberg both use sqrt.
- Maximum arc width ≈ 15–20px (FT convention). Wider reads as stroke noise.
- Particles traveling along arcs encode direction. Without particles, a bidirectional arc is ambiguous.
- Dark basemap (dark-v11 or Meridian dark) — arcs pop against dark; same background color as RouteAnimation for visual consistency.
- Legend with 3 reference widths (small / medium / large with corresponding volume labels) in bottom-left.

---

## Parallax defaults

| Field | Default | Rationale |
|-------|---------|-----------|
| `register` | `"dark"` | Arcs pop on dark basemap |
| `fogPreset` | `"editorial"` | Less dramatic than `"atmospheric"` — flows are data, not terrain |
| `pitch` | `25` | Slight tilt gives perspective, helps arcs read as lifted off the surface |
| `showParticles` | `true` | Direction is ambiguous without particles |
| `showArrowheads` | `false` | Particles usually sufficient; arrowheads for stagger mode or very short arcs |
| `showLegend` | `true` | Volume legend required — flows without scale reference are decorative |
| `particleSpeed` | `0.0035` | Matches RouteAnimation particle speed for visual consistency |
| `particlesPerArc` | `3` | Actual count = `max(2, ceil(sqrt(v/maxV) * 2 * particlesPerArc))` — density double-encodes volume |

---

## Reveal modes

### `mode: "simultaneous"` (default)
All flows fade in together at `t=0.3s`. Use when the editorial argument is comparative magnitude — the viewer needs to see all flows at once to compare widths.

### `mode: "stagger"`
Each flow has a `revealAtSec` timestamp, fades in over 0.6s. Use when the editorial argument is sequential causation — "first X, then Y responded, then Z."

**Schema validation:** stagger mode enforces that every flow has `revealAtSec`. Missing entries fail Zod validation with a descriptive error.

---

## Arc width encoding

```
width = max(1.5, sqrt(volume / maxVolume) * MAX_WIDTH_PX)
```

`MAX_WIDTH_PX = 18` (Parallax default, close to FT's 20px convention). The `max(1.5, ...)` floor prevents hairline arcs disappearing on dark backgrounds.

**`maxVolume`:** When absent, auto-computed as `max(flows[].volume)`. Set explicitly to:
- Compare flows across episodes (shared scale)
- Prevent a single outlier flow from compressing all other arcs

---

## Arc height heuristic

Arcs < 3000km haversine distance render flat (no great-circle bow). Arcs ≥ 3000km get a quadratic height proportional to distance. The 3000km threshold matches RouteAnimation for visual consistency. Override with `distanceKm` on individual flows.

---

## Actor color grouping

```json
"actors": {
  "primary":   { "fill": "#C4A747", "label": "Major Relay" },
  "secondary": { "fill": "#7AA3C9", "label": "Secondary Relay" }
}
```

Each flow's `actor` field maps to an actor key. Flows without `actor` use the neutral gold `palette.gold`. When actors are defined, a compact actor legend auto-renders (right side, 14px labels).

---

## Catalog fixtures

- `data/episodes/catalog/flowmap-russia-oil-rerouting.json` — Stagger mode; 4 flows; 2 actors (primary/secondary relay). Dark/atmospheric.
- `data/episodes/catalog/flowmap-semiconductor-supply.json` — Simultaneous mode; 6 flows; 3 actors (leading-edge / trailing-edge / captive). Dark/editorial.

---

## Lint note

The `[missing-title-block]` lint info is expected for FlowMap. The title is rendered inline as part of the bottom overlay alongside the legend — this is an intentional design choice for a template where the overlay IS the editorial surface, not a separate header.

---

## When NOT to use

- Path-as-argument with discrete phases → **RouteAnimation**
- Non-geographic directed flow (org nodes, budget categories) → **SankeyFlow** or **ChordDiagram**
- Single-direction routes at equal weight → **RouteAnimation**
- Volume is a secondary detail, not the argument → annotate a static RouteAnimation
