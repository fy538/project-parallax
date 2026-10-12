# TerritoryMap — Template Dossier

**Template:** `TerritoryMap`  
**Family:** Maps (Mapbox via `MapGL` + deck.gl)  
**Schema:** `src/templates/TerritoryMap/schema.ts`  
**Component:** `src/templates/TerritoryMap/TerritoryMap.tsx`  
**Shipped:** May 20, 2026

---

## Editorial argument

**Who controlled what, and when.** Territorial-control evolution over discrete timesteps. The fill crossfade (or hard-cut snap) makes the transfer of territory visible as motion, not just a sequence of static maps.

Use when the argument is "control shifted from X to Y between date A and date B." Examples:
- Ottoman retreat 1700–1920
- ISIS caliphate growth/shrink 2014–2019
- COCOM membership 1949–1994
- NATO expansion rounds

**Key distinction from ChoroplethMap:** ChoroplethMap encodes a *value* (GDP, risk score) as a fill shade. TerritoryMap encodes *categorical control* as actor colors, and the temporal animation is the primary argument — control transfer IS the story.

---

## State-of-the-art editorial reference

The NYT's "How the Front Lines Have Shifted" series (Ukraine 2022–) is the canonical editorial benchmark. Key conventions:
- Restrained color palette — typically 3–5 actors, each with a single flat fill
- Contested zones shown as hatched or dashed boundaries (not solid fills)
- Timeline strip anchored at bottom, gold active node, greyed future nodes
- Minimal typography — just the date label at the active timestep

FT's "Empire Collapses" series similarly uses crossfading fills between era slices with a horizontal timeline at the bottom.

---

## Parallax defaults

| Field | Default | Rationale |
|-------|---------|-----------|
| `register` | `"dark"` | Historical territory maps read better on dark basemap — borders visible without competing with fills |
| `fogPreset` | `"atmospheric"` | Adds editorial depth without terrain (fog works even at pitch 0) |
| `crossfadeSec` | `0.5` | Half-second crossfade feels historically "steady" — fast enough to show motion, slow enough to avoid whiplash |
| `showTimeline` | `true` | Timeline strip anchors the temporal argument without narration |
| `showActorLabels` | `true` | Markers at centroids; null-safe (only renders for defined centroids) |

---

## Rendering modes

### `mode: "country"` (default)
Uses Mapbox `country-boundaries-v1` vector tileset + per-render `match` expression keyed on ISO 3166-1 alpha-3 codes. Fastest and most reliable.

**Data format:** `regions[].id` = ISO 3166-1 alpha-3 (`"TUR"`, `"IRQ"`, etc.)

### `mode: "subnational"`
Uses deck.gl `GeoJsonLayer` with `getFillColor` accessor. Required for sub-national boundaries (provinces, oblasts, districts) not available in Mapbox's country tileset.

**Data format:** `regions[].id` = `feature.properties.id` in the GeoJSON at `geoJsonUrl`.

**Performance note:** GeoJSON is fetched lazily in `useEffect` with a cancel guard. Falls back gracefully on fetch failure (regions render transparent).

---

## Color guidance

- Each actor should use a **distinct hue** from the Parallax palette or a custom hex. Avoid shades of the same hue (difficult to distinguish on crossfade).
- Ottoman brown `#8B6B3D`, British red `#A64D46`, Russian blue `#4A6B8A`, neutral/independent `#888780` are established Parallax historical conventions.
- Contested / unclaimed territory → omit from `control` lookup for those timesteps (renders transparent).

---

## Timestep authoring

```json
"timesteps": [
  { "id": "1700", "label": "1700" },
  { "id": "1878", "label": "1878", "snap": true }
]
```

- `snap: true` on a timestep means the transition from the previous timestep is a **hard cut** rather than a crossfade. Use for rupture moments — revolutions, rapid seizures — where a fade would misrepresent the pace of change.
- `crossfadeSec` applies to all non-snap transitions.

---

## Catalog fixtures

- `data/episodes/catalog/territory-ottoman-retreat.json` — Ottoman retreat 1700–1920, 5 timesteps, 8 ISO codes, 6 actors. Country mode.
- `data/episodes/catalog/territory-cocom-membership.json` — COCOM membership 1949–1994, 5 timesteps, 17 member states, 4 actors (member/nonmember/joined/dissolved). Country mode.

---

## Known constraints

- **No warmTiles needed** — TerritoryMap has a static camera; tile loading is handled by the standard MapGL `idle` event, same as ChoroplethMap.
- **Subnational GeoJSON must be served** — place files under `public/geo/territory/` so they're accessible at render time.
- **Marker labels only appear if `centroid` is defined** on the region AND the region has a known actor at the current timestep.

---

## When NOT to use

- Single-point-in-time political geography → **AtlasPlate**
- Value encoded as fill shade (GDP, population density) → **ChoroplethMap**
- Flow / movement along arcs → **RouteAnimation** or **FlowMap**
