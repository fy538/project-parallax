# Mapbox Studio — Meridian Light Style Setup

> Step-by-step guide to create the custom "Meridian Light" map style for Parallax.
> Estimated time: 15 minutes. You'll start from Mapbox's `Light` base style and
> override colors to match the Meridian paper-tone palette from BRAND.md.
>
> Light mode is the primary visual register for all video content. A secondary
> "Meridian Dark" style can be built the same way from `dark-v11` for occasional
> dramatic compositions — the dark color values are documented at the end of this file.
>
> Once done, copy the style URL into theme.ts `mapConfig.styleUrl` — all map
> templates (ChoroplethMap, RouteAnimation) will pick it up automatically.

---

## Prerequisites

- Mapbox account (you already have one — your token is configured)
- Go to [Mapbox Studio](https://studio.mapbox.com/)

---

## Step 1: Create a New Style

1. Click **"New style"** in the top-right
2. Choose **"Light"** as the base template (this is `light-v11`)
3. Click **"Customize Light"**
4. Name it **"Meridian Light"** (click the style name at top-left to rename)

You now have a light-v11 clone. Everything below is color overrides to match the Meridian paper-tone palette.

---

## Step 2: Set the Background (Ocean)

The background color is what shows through everywhere there's no land — ocean, lakes, rivers.

1. In the left sidebar, search for **"background"**
2. Click the **Background** layer
3. Under **Color**, change to: **`#E4DDD3`**
   - This is a warm cream tone, slightly darker than paper (#F5F0E8), giving the ocean a parchment feel

> **Why not white?** Pure white ocean looks sterile. `#E4DDD3` has a warm paper undertone that matches the Meridian editorial palette and reads as "old atlas" on camera.

---

## Step 3: Set Land Fill

Land should match the video background so map templates composite seamlessly.

1. Search for **"land"** in the layers panel
2. Click **"land"** (the fill layer, not `landcover` or `landuse`)
3. Change **Color** to: **`#F5F0E8`** (paper)

If you see separate layers like `landuse_park`, `landuse_industrial`, etc.:
- Set them all to **`#F5F0E8`** (or slightly warmer `#EDE7DB` for subtle distinction)
- Or just hide them (click the eye icon) — for geopolitics content, land use detail is noise

---

## Step 4: Country & Admin Borders

1. Search for **"admin"** or **"boundary"**
2. Find the **admin-0** layer (country boundaries) — it may be called `admin-0-boundary` or similar
3. Set **Line color** to: **`#D4CAB8`** (= light border token)
4. Set **Line width** to: **`0.5`** px
5. For **admin-1** boundaries (state/province), either:
   - Hide them entirely (recommended for most episodes), OR
   - Set color to `#DDD4C6` at 0.3px (barely visible)

> The goal is "borders exist but don't compete." At 1080p video, 0.5px country borders read as subtle structure without visual noise.

---

## Step 5: Water Styling

1. Search for **"water"**
2. Find the **water** fill layer
3. Set **Color** to: **`#E4DDD3`** (same as background — ocean and water blend together)
   - If you want visible rivers/lakes, use **`#DAD2C6`** instead (very subtle distinction)

For **water labels** (ocean names, sea names):
1. Search for **"water-label"** or **"water_name"**
2. Set **Text color** to: **`#8A8070`** (= text.light.muted)
3. Set **Text size** to: **10-12 px** (small, ambient)
4. Set **Text halo color** to: **`#F5F0E8`** at 1px (ensures readability over paper water)
5. Set **Text font** to: **"DIN Pro Regular"** or **"DIN Pro Italic"** (closest to IBM Plex Mono in Mapbox's font library)

---

## Step 6: Country Labels

These are the text labels for countries — the most visible text on the map.

1. Search for **"country-label"**
2. Set **Text color** to: **`#1C1814`** (ink)
3. Set **Text size**: min **10**, max **16** (Mapbox will interpolate by zoom)
4. Set **Text halo color** to: **`#F5F0E8`** with **1.5px** width
5. Set **Text font** to: **"DIN Pro Medium"** (closest available to Space Grotesk)
6. Set **Text opacity** to: **0.85** (slightly dimmed — labels shouldn't dominate)
7. Optionally reduce **Max text width** to show fewer labels at low zoom

For **city/place labels** (`place-city-label`, `place-town-label`, etc.):
- Set **Text color** to: **`#8A8070`** (= text.light.muted) — or hide them entirely
- At zoom < 5, city labels are noise for geopolitics content
- At zoom > 6 (city-level shots), set to `#4A4538` (= text.light.secondary)

---

## Step 7: Roads and Infrastructure

For a geopolitics channel, roads are almost always noise. Hide or minimize them.

1. Search for **"road"**
2. Select all road layers (`road-motorway`, `road-primary`, `road-secondary`, etc.)
3. **Hide them all** (click the eye icon)
   - If you want to keep highways visible at high zoom, set color to `#D4CAB8` at 0.3px

Do the same for:
- **Railways** → hide
- **Buildings** → hide
- **POI labels** → hide (search "poi")
- **Transit** → hide

---

## Step 8: Terrain & Hillshading

This is what makes the map look broadcast-quality — subtle 3D relief.

1. Click **"+" (Add layer)** at the top of the layers panel
2. Choose **"Raster DEM"** as the source type
3. Search for source: **"mapbox-terrain-dem-v1"** (or it may appear as `mapbox.mapbox-terrain-dem-v1`)
4. Set **Type** to: **"hillshade"**
5. Configure:
   - **Exaggeration**: `0.3` (subtle — terrain should be felt, not seen)
   - **Shadow color**: `#000000` at 30% opacity
   - **Highlight color**: `#FFFFFF` at 8% opacity
   - **Illumination direction**: `315` (northwest — standard cartographic convention)

> **Important:** The MapGL component also enables terrain via the `terrain` prop with exaggeration 1.5 in the react-map-gl code. The Studio hillshade layer is for visual shading; the code-side terrain is for 3D elevation. They're complementary — you want both.

Move this layer to sit just above `land` but below borders and labels.

---

## Step 9: Bathymetry (Optional)

Mapbox dark-v11 may already have subtle depth contours. To enhance them:

1. Search for **"depth"** or **"bathymetry"**
2. If a layer exists, set the line color to: **`#0E0C0A`** (barely visible ocean depth lines)
3. If no layer exists, skip — the dark-v11 base already has some subtle ocean shading

---

## Step 10: Publish & Copy Style URL

1. Click **"Publish"** in the top-right
2. Click **"Share"** or look at the URL bar
3. Your style URL will be in the format:
   ```
   mapbox://styles/98flyingtiger/xxxxxxxxxx
   ```
   (where `98flyingtiger` is your Mapbox username and `xxxxxxxxxx` is the style ID)

4. Copy this full URL

---

## Step 11: Update the Codebase

Once you have the style URL, give it to me and I'll update theme.ts:

**`remotion-templates/src/design/theme.ts`** — the `mapConfig.styleUrl` field:
```typescript
export const mapConfig = {
  styleUrl: "mapbox://styles/98flyingtiger/xxxxxxxxxx",  // ← your Meridian Light style URL
  darkStyleUrl: "mapbox://styles/mapbox/dark-v11",       // ← or your Meridian Dark style URL
  // ... rest stays the same
};
```

**`remotion-templates/src/components/MapGL.tsx`** — reads from `mapConfig.styleUrl` automatically.

---

## Quick Reference: All Colors (Light — Primary)

| Map Element | Hex | Meridian Token |
|-------------|-----|----------------|
| Background / ocean | `#E4DDD3` | (custom — warmer than paper) |
| Land fill | `#F5F0E8` | `paper` (= `bg.light.base`) |
| Land borders | `#D4CAB8` | `bg.light.border` |
| Water labels | `#8A8070` | `text.light.muted` |
| Country labels | `#1C1814` | `ink` |
| Label halo | `#F5F0E8` | `paper` |
| City labels (muted) | `#8A8070` | `text.light.muted` |
| City labels (active) | `#4A4538` | `text.light.secondary` |
| Hillshade shadow | `#000000` @ 15% | — (lighter for paper bg) |
| Hillshade highlight | `#FFFFFF` @ 4% | — (subtle on light) |

## Quick Reference: Dark Mode Colors (Secondary)

| Map Element | Hex | Meridian Token |
|-------------|-----|----------------|
| Background / ocean | `#100E0C` | (custom — darker than ink) |
| Land fill | `#1C1814` | `ink` |
| Land borders | `#3A3530` | (custom) |
| Water labels | `#5A5448` | (custom) |
| Country labels | `#F0E6D0` | `bone` |
| Label halo | `#1C1814` | `ink` |

---

## Verification Checklist

After publishing, open Remotion Studio (`npx remotion studio --gl=angle`) and check:

- [ ] Ocean reads as warm cream, distinguishable from land but not bright white
- [ ] Land is paper-toned (#F5F0E8), matching the video background
- [ ] Country borders are subtle warm lines, not competing with content
- [ ] Country labels are readable (ink text with paper halo)
- [ ] No roads, buildings, or POI labels visible at zoom 1-5
- [ ] Hillshading gives subtle 3D relief on mountain ranges
- [ ] ChoroplethMap country highlight fills render on top of the base style
- [ ] RouteAnimation arc routes are visible against the dark land

If anything looks off, adjustments are easy — just go back to Studio, tweak, and re-publish. The style URL stays the same.
