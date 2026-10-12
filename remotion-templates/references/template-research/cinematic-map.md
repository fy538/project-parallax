# CinematicMap — Terrain Fly-Through Dossier

> **Template:** `CinematicMap` · **Category:** Maps · **Shipped:** May 2026
> **Schema:** `src/templates/CinematicMap/schema.ts`
> **Component:** `src/templates/CinematicMap/CinematicMap.tsx`
> **Utils:** `src/utils/cinematicMapUtils.ts` — `warmTiles()` · `buildKeyframesFromSec()`
> **Catalog fixtures:** `cinematic-khyber-pass` · `cinematic-taiwan-strait` · `cinematic-globe-reveal-middleeast`

---

## 1. When to use

Use CinematicMap **when terrain is the editorial argument**. This template produces a pitched, moving camera over Mapbox terrain relief — it is not interchangeable with other map templates.

| Signal | Use CinematicMap |
|--------|-----------------|
| "The camera approaches the pass" | ✓ |
| "The valley funnels the army" | ✓ |
| "A 180 km choke point separates the fleets" | ✓ |
| "The global distribution of X" | ✗ → AtlasPlate or ChoroplethMap |
| "Three trade routes from Rome" | ✗ → RouteAnimation |
| "Population density across provinces" | ✗ → DensityMap |

**One rule:** use CinematicMap only when the 3D terrain *is* the argument — mountain ranges as barriers, straits as chokepoints, river valleys as invasion corridors. If the argument is statistical, relational, or can be expressed without terrain relief, choose a different template.

**Frequency constraint (doctrine):** limit to 1–3 shots per episode. Every additional cinematic map adds ~10–30s render startup time, 2–3× the Lambda cost of a 2D map, and requires QA in Studio before committing the camera path. The aesthetic tax compounds when overused, and impact diminishes.

---

## 2. Camera altitude reference

| Altitude | Zoom equiv. | What you see |
|----------|-------------|--------------|
| 100 m | ~20 | Street / building level |
| 1 000 m | ~17 | Village / valley floor |
| 8 000 m | ~14 | Mountain range visible |
| 40 000 m | ~11 | Regional terrain (Khyber Pass width) |
| 200 000 m | ~9 | Country scale |
| 500 000 m | ~7 | Sub-continental |
| 1 500 000 m | ~5 | Continental |
| 5 000 000 m | ~3 | Globe visible at edge |
| 9 000 000 m | ~1 | Full globe in frame |

Altitude is **linear in meters** (unlike zoom, which is logarithmic). `zoomToAltitudeM(z)` = 7,000,000 / 2^(z−1).

---

## 3. Pitch guidance by shot type

| Shot type | Pitch range | Notes |
|-----------|-------------|-------|
| **Valley-follow** | 60–75° | Nearly horizontal; viewer is "in" the terrain |
| **Mountain approach** | 45–65° | Classic fly-in; terrain fills frame |
| **Chokepoint reveal** | 35–55° | Water body flanked by land; pitch shows width |
| **Orbital** | 25–40° | Orbiting a fixed point; moderate tilt |
| **Globe reveal (cold open)** | 0 → 38° | Start overhead, pitch up as descending |
| **Overhead reconnaissance** | 10–25° | Almost nadir; shows extent, not relief |

Start low-pitch (wide, flat) and increase as you descend for a cinematic "entering the terrain" feel. The reverse (start pitched, pull back to flat) works for context reveals.

---

## 4. Fog + light preset pairing table

| `fogPreset` | `lightPreset` | Register | Use case |
|-------------|--------------|----------|---------|
| `atmospheric` | `night` | Dark space, star halo | Globe cold-open, space-to-Earth reveal |
| `atmospheric` | `dusk` | Dark space, warm horizon | Terrain fly-through (default CinematicMap stack) |
| `atmospheric` | `dawn` | Dark space, cold-angle light | Morning assault / convoy crossing |
| `editorial` | `day` | Paper-tinted atmosphere | Analytical terrain (rare; fights dark register) |
| `vintage` | `dusk` | Brown space, warm | Period map (WWI / WWII terrain) |
| `none` | `day` | No atmosphere | Flat analytical terrain; graticule carries signal |

The default stack (`atmospheric` + `dusk`) is the safest choice: long shadows make ridge lines pop, warm ambient makes the scene feel inhabited, dark space keeps the composition editorial rather than touristy.

---

## 5. Tile pre-warmer

**Problem:** Mapbox terrain DEM tiles are fetched on-demand. At the initial camera position (where MapGL fires `idle`), the starting tiles are loaded — but keyframe positions 2…N have not been fetched yet. Without pre-warming, frame-for-frame renders may show white DEM patches where terrain hasn't loaded.

**Solution — `warmTiles(map, keyframes, fps)`** in `src/utils/cinematicMapUtils.ts`:
1. After MapGL fires `idle` (initial position warm), `onMapReady` calls `warmTiles`.
2. For each keyframe position, jumps to that center/zoom via `map.jumpTo()`.
3. Polls `map.areTilesLoaded()` every 200ms (max 10s per position).
4. After all positions are warm (or timed out), resets to `keyframes[0]`.
5. Calls `continueRender(warmHandle)` — Remotion captures frame 0.

**Timing budget:**
- Fast CDN / warm cache: 1–3s per keyframe position
- Cold CDN / first render: 5–10s per position (capped at 10s)
- Total ceiling: 90s absolute timeout (then continues with a warning)
- 10-keyframe path: worst-case ~90s startup

**Two-pass fallback** (when patches persist despite warmTiles):
```bash
# Pass 1: 1fps render forces tile loading at every frame position
npx remotion render CinematicMap out/warm.mp4 --fps-override=1
# Pass 2: 30fps clean render — tiles are now in Chromium's disk cache
npx remotion render CinematicMap out/final.mp4
```

---

## 6. GlobeReveal pattern

GlobeReveal is NOT a separate template. Use CinematicMap with high-altitude keyframes:

```json
{
  "keyframes": [
    { "sec": 0, "center": [38, 30], "altitudeM": 9000000, "pitch": 0 },
    { "sec": 4, "center": [38, 30], "altitudeM": 1800000, "pitch": 18 },
    { "sec": 10, "center": [36, 33.5], "altitudeM": 300000, "pitch": 38 }
  ],
  "register": "dark",
  "fogPreset": "atmospheric",
  "lightPreset": "night",
  "terrain": false
}
```

Set `terrain: false` for the globe phase (no DEM needed above ~500km; the terrain budget is wasted on ocean floor at that altitude). The `fogPreset: "atmospheric"` + `lightPreset: "night"` gives the space-to-Earth cinematic register. See catalog fixture `cinematic-globe-reveal-middleeast`.

---

## 7. Camera path authoring

### Manual (JSON)

Author `keyframes[]` directly. Each keyframe: `{ sec, center, altitudeM/zoom, pitch, bearing, lookAt?, easing? }`. `sec` is converted to frames by the template; `fps` is always 30.

Rules of thumb:
- Use 3–6 keyframes per shot (more = micro-corrections that read as jittery)
- Ease in/out is default and usually correct; `linear` for mechanical tracking shots
- For valley-follows: bearing should track the valley axis, not north
- Off-axis shots: author `lookAt` for the focal point + `center` for camera position

### CLI tool (`tools/camera_path.py`)

```bash
python tools/camera_path.py \
  --waypoints "Kabul,Afghanistan" "Peshawar,Pakistan" \
  --altitude 40000 --pitch 62 --duration 10 \
  --style mountain-approach
```

Geocodes via Nominatim (no key), generates haversine-proportional keyframes, outputs JSON ready to paste into a data file. See `tools/camera_path.py --help`.

---

## 8. Anti-patterns

| Anti-pattern | Why it's wrong | Fix |
|---|---|---|
| Using CinematicMap for a non-terrain argument | Adds render cost without editorial payoff | Use AtlasPlate or RouteAnimation |
| More than 3 cinematic maps per episode | Cumulative render cost + diminishing impact | Cut to essential shots only |
| Pitch > 80° | Camera below horizon; ocean floor visible | Cap at 75° |
| Altitude < 500m over populated areas | Looks like street view, not editorial | Minimum 2000m for editorial shots |
| `terrain: false` over mountains | Flat terrain defeats the template's purpose | Only set false for ocean/globe shots |
| No annotations on a chokepoint shot | Viewer can't orient without a label | Add a primary annotation for the named feature |
| `fogPreset: "editorial"` on dark register | Paper-tinted space fights dark register; reads muddy | Use `atmospheric` for dark register |

---

## 9. Aesthetic tax table

| Cost | Frequency | Mitigation |
|------|-----------|-----------|
| Tile pre-warm: 10–30s startup | Every render | Accept; only use when terrain is the argument |
| Camera path JSON authoring | Once per shot | `camera_path.py` CLI reduces to ~5 min |
| DEM patches in 1–2% of renders | Occasional | Re-render; two-pass fallback if systematic |
| Lambda render: ~2–3× slower than 2D | Every Lambda render | Budget constraint; limit to 2–3 shots/episode |
| QA in Studio before committing | Per shot | Remotion Studio preview + scrub |
| Mapbox billing: 1 map load per render | Every render | 50k/month free tier; typical <5k/month |
