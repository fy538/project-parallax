# Mapbox Studio — Meridian Style Setup

> Step-by-step procedure to fork and publish the two custom Mapbox Studio styles that give Parallax maps their atlas register (vs. the "Google Earth" default).
>
> Output: two style URLs you paste into `remotion-templates/.env`.
>
> Time: ~2–3 hours in Mapbox Studio (browser). Free tier is sufficient.
>
> Last updated: May 11, 2026.

## Why this exists

The stock `mapbox/light-v11` and `mapbox/dark-v11` styles were designed for routing apps — they prioritize POI density, transit, road shields, and full-strength hillshading. Parallax wants the opposite register: an atlas plate in the lineage of Bartholomew, mid-century Fortune, and contemporary FT/Reuters editorial cartography. That requires custom styles.

The Parallax brand colors and intended cartographic palette are already encoded in [`remotion-templates/src/design/theme.ts`](../remotion-templates/src/design/theme.ts) (`mapConfig.styleColors` and `mapConfig.darkStyleColors`). This document is the recipe for applying that palette and the structural simplifications to two Mapbox Studio styles.

## Output

Two published style URLs of the form:
```
mapbox://styles/<your-account>/<style-id>
```

You'll paste them into `remotion-templates/.env`:
```bash
MAPBOX_STYLE_LIGHT_URL=mapbox://styles/<account>/<meridian-light-style-id>
MAPBOX_STYLE_DARK_URL=mapbox://styles/<account>/<meridian-dark-style-id>
```

Once set, [`theme.ts:mapConfig`](../remotion-templates/src/design/theme.ts) picks them up automatically. Until set, the pipeline falls back to stock Mapbox light-v11 / dark-v11 (works, but looks generic).

## Prerequisites

- Mapbox account ([account.mapbox.com](https://account.mapbox.com)). Free tier OK.
- 30 minutes of focused time per style (so ~1 hour total for the two).
- This file open in one window, Mapbox Studio in another.

## Procedure — Meridian Light

### 1. Fork the Monochrome template

1. Visit [Mapbox Studio → Styles](https://studio.mapbox.com/styles/).
2. Click **New style**.
3. Choose **Monochrome** as the template (NOT Standard, NOT Streets — Monochrome is the cleanest editorial starting point and the FT/Reuters base).
4. Pick the **Light** variant.
5. Click **Customize Monochrome**.
6. Rename: **Meridian Light v1**.

### 2. Strip non-atlas layers

In the left layer panel, hide (eye icon) everything in these groups:

- **POI labels** — every single one. Atlases don't show coffee shops.
- **Transit** — buses, subways, rail stations.
- **Road shields** — interstate badges, route numbers.
- **Aeroway labels** — runways, airport labels (we'll add specific labels editorially via `MapAnnotations`).
- **Minor roads** — all `road-minor`, `road-street`, `road-service` lines.
- **Building 3D extrusion** — if enabled, disable.

Keep visible:
- **Major roads** at very low opacity (0.15) — gives a faint sense of corridors without dominating.
- **Admin boundaries** (countries, disputed) — these are the geographic backbone.
- **Place labels** — country, state/province, city. We'll restyle these in Step 4.
- **Water, land, landuse-park** — base geographic fills.
- **Hillshade** — keep, but tone down (Step 5).

### 3. Apply the Meridian Light palette

From `mapConfig.styleColors` in `theme.ts`:

| Layer | Hex | Notes |
|---|---|---|
| `water` fill | `#E4DDD3` | A paper-tinted water — softer than blue, reads as "marbled paper" |
| `land` fill | `#F5F0E8` | Parallax paper |
| `landuse-park` | `#EBE3D5` | Slightly warmer than land |
| `landuse-pitch` (sports fields) | `#EBE3D5` | Same as park |
| `admin-0-boundary` (country) | `#1C1814` | Ink |
| `admin-1-boundary` (state/province) | `#D4CAB8` | Faint, only visible when zoomed in |
| `admin-0-boundary-bg` (halo) | `#F5F0E8` | Same as land — makes border read clean |

For each layer:
1. Click the layer.
2. Switch to **Color** tab.
3. Paste hex value.
4. (For lines) set **Width** as below.

### 4. Typography — IBM Plex

For all **place labels** (country, state, city, ocean, water labels):
1. Click the layer.
2. Switch to **Font** tab.
3. Pick **IBM Plex Sans Regular** as the primary font.
4. Set the fallback stack: `IBM Plex Sans Regular, Arial Unicode MS Regular`.

For **country labels** specifically:
- Font: **IBM Plex Sans Medium**
- Color: `#1C1814` (ink)
- Halo: `#F5F0E8` (paper), halo width 1.5px, halo blur 0.5
- Text size: zoom-stop based — 12 at zoom 2, 18 at zoom 5, 24 at zoom 8
- Letter spacing: `0.06`
- Text transform: **Uppercase** (this is editorial; matches the `MapAnnotations` primary hierarchy)

For **state/province labels**:
- Font: **IBM Plex Sans Regular**
- Color: `#5A5448`
- Letter spacing: `0.05`
- Text transform: **Uppercase**
- Text size: 10 at zoom 4, 14 at zoom 7

For **city labels**:
- Font: **IBM Plex Sans Regular**
- Color: `#1C1814`
- No uppercase — sentence case ("Tokyo", not "TOKYO")
- Text size: 11 at zoom 5, 16 at zoom 10

For **water / ocean labels**:
- Font: **IBM Plex Sans Light Italic** (if available) or **IBM Plex Serif Italic Regular**
- Color: `#8A8070` (water label color)
- Letter spacing: `0.08` (sparse — these labels span large areas)
- Text transform: **Uppercase** for ocean names ("PACIFIC OCEAN")
- Sentence case for sea/strait names ("South China Sea")

### 5. Hillshade — quiet it down

The default hillshade opacity (~40%) is the single biggest "Google Earth" tell. Reduce it.

1. Find the `hillshade` layer in the layer panel.
2. **Hillshade highlight color:** `#FAF5ED` (very pale paper)
3. **Hillshade shadow color:** `#D4CAB8` (soft umber)
4. **Hillshade exaggeration:** 0.4 (default is 1.0)
5. **Hillshade accent color:** `#C9BEA8`

The result should look like soft pencil shading on paper, not satellite-imagery terrain.

### 6. Border treatment

Lines, not fills, do the work in an atlas. Tune the admin layers carefully.

- **`admin-0-boundary`** (recognized country border):
  - Color: `#1C1814` (ink)
  - Width: 1.0 at zoom 2 → 1.5 at zoom 6
  - Line cap: butt
  - Line join: round
- **`admin-0-boundary-disputed`** (disputed borders — Taiwan, Kashmir, South China Sea nine-dash, etc.):
  - Color: `#C23B22` (rust — the Parallax accent)
  - Width: 1.0 at zoom 2 → 1.5 at zoom 6
  - **Line dasharray: [4, 3]** — this is the critical Parallax signal. Disputed boundaries are visually distinct.
- **`admin-1-boundary`** (state/province):
  - Color: `#A89C84`
  - Width: 0.5
  - Visible only at zoom ≥ 4
  - Line dasharray: [1, 2] (very fine dotted)

### 7. Worldview

Mapbox lets you set a default worldview. For Parallax (US-audience editorial channel that names disputes openly):

1. Top menu → **Worldview** → set to **United States**.
2. Open the `admin_status` filter on the boundary layers. Confirm `disputed = true` boundaries are rendered (dashed rust, per Step 6).

This gives viewers the US-recognized line *and* the disputed line — the bounded-analogy doctrine in cartographic form.

### 8. Sky / atmosphere

If your style template includes sky:
- **Sky type:** atmosphere
- **Atmosphere color:** `#F5F0E8` (paper)
- **Atmosphere halo color:** `#E4DDD3`

Keeps the globe edge from reading "space photograph."

### 9. Publish

1. **Publish** button (top right).
2. **Make style public** (so the Mapbox token can fetch it).
3. Copy the style URL — should look like `mapbox://styles/<account>/<style-id>`.
4. Save it somewhere — you'll need it in Step 11.

## Procedure — Meridian Dark

Repeat the procedure with these differences:

### Palette (from `mapConfig.darkStyleColors`)

| Layer | Hex |
|---|---|
| `water` fill | `#100E0C` |
| `land` fill | `#1C1814` (ink) |
| `landuse-park` | `#221E1A` |
| `admin-0-boundary` | `#5A5448` (muted, lifted off ink) |
| `admin-0-boundary-disputed` | `#C23B22` (same rust, contrast is fine) |
| `admin-0-boundary-bg` (halo) | `#1C1814` |

### Typography colors

- Country labels: `#F0E6D0` (bone), halo `#1C1814`
- State/province: `#8A8070`
- City: `#E2D7BB`
- Water: `#5A5448` (subtle — water in dark mode is felt, not announced)

### Hillshade

- Highlight: `#3A3530`
- Shadow: `#0C0A09`
- Exaggeration: 0.5

### Sky

- Atmosphere color: `#1C1814`
- Halo color: `#3A3530`

### Publish

1. Rename: **Meridian Dark v1**.
2. Publish + make public.
3. Copy URL.

## 11. Wire into Parallax

In `remotion-templates/.env`:
```bash
MAPBOX_STYLE_LIGHT_URL=mapbox://styles/<account>/<meridian-light-style-id>
MAPBOX_STYLE_DARK_URL=mapbox://styles/<account>/<meridian-dark-style-id>
```

Verify the wiring:
```bash
cd remotion-templates && MAPBOX_ACCESS_TOKEN=pk.... npm start
```
Open any map composition. You should see the new style render. If you still see stock light-v11, double-check the env var name (`MAPBOX_STYLE_LIGHT_URL`, not `MAPBOX_LIGHT_STYLE_URL`).

## 12. Re-baseline visual regression

Once the styles render correctly:
```bash
cd remotion-templates && MAPBOX_ACCESS_TOKEN=pk.... npm run test:real-data -- --update-snapshots
```

This regenerates the PNG baselines under `src/__tests__/baselines/map-review/` for the 10 map cases (5 compositions × 2 frames). Commit the new baselines. From this point forward, future renders must match the Meridian-styled baselines, not the legacy Mapbox-default ones.

If you don't want to re-baseline (e.g., you want to spike the styles first), just don't set the env vars — the pipeline keeps using the legacy stock styles.

## Maintenance

When you tweak a style in Studio later, you have two paths:

- **In-place edit + re-publish**: the URL stays the same; new renders pick up the new styling. Re-baseline visual regression.
- **Bump version**: publish as `Meridian Light v2`, update `.env` to the new URL, re-baseline. Keep v1 published as a fallback so older episodes can still render against it if needed.

The version-bump path is recommended for any change you couldn't reverse in 5 minutes (e.g., palette migration, typography overhaul). In-place is fine for tweaks (hillshade opacity, single layer color).

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Map renders solid grey | Style URL typo, or style is private | Confirm URL is correct + style is published public |
| Some layers visible that you hid | Browser cache | Hard refresh Studio or re-publish |
| Plex font not available in Studio | Studio font picker only shows fonts in your account | Mapbox supports IBM Plex out of the box; if missing, contact Mapbox support |
| Disputed boundaries don't render | Worldview not set, or filter on the layer | Re-check Step 7 |
| Hillshade still looks 3D | Exaggeration too high, or terrain DEM still attached at template level | Confirm hillshade exaggeration ≤ 0.5 in style; separately confirm template data files don't force `terrain: true` (see LESSONS L99) |

## Reference

- [`mapConfig.styleColors` in theme.ts](../remotion-templates/src/design/theme.ts) — single source of truth for the intended palette
- [`remotion-templates/BRAND.md`](../remotion-templates/BRAND.md) — typography + palette rationale
- [`remotion-templates/references/template-research/map-annotations.md`](../remotion-templates/references/template-research/map-annotations.md) — editorial cartography canon
- Bartholomew, J. *The Times Atlas of the World*. House typography + admin hierarchy reference.
- FT Visual & Data Journalism style guide (informal, observed from published work).
