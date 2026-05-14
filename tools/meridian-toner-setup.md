# Meridian Toner Setup — Stadia Maps × Stamen revival

> One-time manual procedure. ~45 minutes including the Stadia signup +
> Studio fork. After this, every `MapGL` composition that sets
> `toner={true}` renders against a high-contrast B+W vector basemap
> tuned to the Parallax bone/amber palette — the closest off-the-shelf
> match to FT/NYT static-print editorial cartography.
>
> Cost: $0 free tier (up to 200k tile requests/month — plenty for solo
> rendering). Paid tier starts at $20/mo if you scale.

## What this gives you

A third Mapbox style URL alongside Meridian Light and Meridian Sepia,
selectable via `<MapGL toner={true}>`. The toner register is the
**atmospheric atlas** — high-contrast grayscale, no terrain shading,
no POI clutter, typographic restraint. Use when the basemap is
supporting context (annotations + arcs carry the editorial point) and
Mapbox Standard reads too "web app."

## Why Stadia × Stamen

Stamen Design's original Toner / Terrain / Watercolor styles were the
gold standard for editorial map tilesets from 2010-2022. In 2024
Stadia Maps rebuilt them on MapLibre vector tiles, keeping the
hand-tuned cartography and adding per-style runtime parameters. The
rebuild is the cleanest off-the-shelf path to FT-style editorial
register without forking an entire style spec from scratch.

References:
- Stadia × Stamen announcement: https://stamen.com/stamen-x-stadia-harnessing-modern-vector-cartography/
- Toner style docs: https://docs.stadiamaps.com/map-styles/stamen-toner/
- Stadia pricing: https://stadiamaps.com/pricing/

## Step 1 — Create a Stadia Maps account

1. Visit https://client.stadiamaps.com/signup/ and create a free account.
2. After confirming email, open the dashboard → **Account → Authentication
   Configs → API Keys**.
3. Create a new API key with read-only access. Copy it.

Save it in your `.env`:

```
STADIA_API_KEY=your-key-here
```

(The key only matters if you use Stadia's hosted tiles. If you fork to
Mapbox Studio later — Step 3 alt — you can drop the env var.)

## Step 2 — Pick your style URL

Stadia hosts Stamen Toner directly. The simplest path:

```
MAPBOX_STYLE_TONER_URL=https://tiles.stadiamaps.com/styles/stamen_toner.json?api_key=${STADIA_API_KEY}
```

(`mapbox-gl` and `react-map-gl` both accept absolute JSON URLs as
style sources; the URL doesn't need to start with `mapbox://`.)

Variants Stadia ships:
- `stamen_toner` — full Toner (B+W, hand-tuned labels)
- `stamen_toner_lite` — lighter weight, less ink (try this if Toner
  feels too aggressive against the bone palette)
- `stamen_toner_background` — labels-off, basemap only (useful when
  MapAnnotations carry every label)

Set whichever feels right for your first episode in `.env`. You can
switch by changing the env var without touching component code.

## Step 3 — Customize the palette (optional but recommended)

Stadia's default Toner is pure black on pure white — too punchy
against the bone/amber Parallax palette. Two paths to fix:

### Option A — Stadia's runtime style customization (5 minutes, no fork)

Stadia exposes a few runtime parameters via query string. Try:

```
MAPBOX_STYLE_TONER_URL=https://tiles.stadiamaps.com/styles/stamen_toner.json?api_key=KEY&accent=%23E5A544
```

Accent injects the Parallax amber into highlighted features (roads,
borders). It's a thin customization but covers ~50% of what a fork
would give you.

### Option B — Fork to Mapbox Studio (20-30 minutes, full control)

For full control over the palette + typography, fork the Stadia JSON
into your own Mapbox Studio style:

1. Download the raw style JSON:
   `curl 'https://tiles.stadiamaps.com/styles/stamen_toner.json?api_key=$STADIA_API_KEY' > toner.json`
2. In Mapbox Studio, click "New style" → "Upload" → select `toner.json`.
3. In the Studio editor, find-and-replace:
   - `#000000` (Toner's black) → `#1C1814` (Parallax ink)
   - `#FFFFFF` (Toner's white) → `#F0E6D0` (Parallax bone)
   - Stamen's accent (typically `#0080FF`) → `#E5A544` (Parallax amber)
4. Open Typography → set the font stack to "IBM Plex Sans" for
   labels (Studio supports custom font uploads in the paid tier; on
   free tier substitute the closest match: "Roboto Mono").
5. Publish the style. Copy the `mapbox://styles/account/id` URL.
6. Update `.env`:
   ```
   MAPBOX_STYLE_TONER_URL=mapbox://styles/<account>/<id>
   ```

This path also drops the Stadia API key dependency — tiles serve
through your existing Mapbox account.

## Step 4 — Use it in a composition

```tsx
<MapGL
  longitude={104}
  latitude={35}
  zoom={3}
  toner={true}             // ← new
  fogPreset="editorial"
  vignette="editorial"
  labelDensity="minimal"   // toner is busy; suppress aggressive
/>
```

Or set it once at the top of a per-episode template:

```tsx
<MapGL toner={true} ...>
  {/* arcs, points, annotations as usual */}
</MapGL>
```

## Step 5 — Verify

```bash
cd remotion-templates
npx remotion still src/index.ts catalog-route-silk-road --frame=60 --output=out/toner-check.png

# Then edit src/catalog/Maps.tsx to set toner={true} on the Silk Road
# RouteAnimation and re-render. Compare against the un-toner version.
```

You should see:
- High-contrast B+W basemap (or grayscale fallback if env var unset)
- Hairline strokes for country borders (no Mapbox Standard hillshade)
- Labels in toner's stark sans-serif (or IBM Plex if you forked)
- Editorial vignette + paper-color fog edge still applied on top

## Fallback behavior

Until you set `MAPBOX_STYLE_TONER_URL`, `<MapGL toner={true}>` falls back
to `mapbox://styles/mapbox/light-v11` + a CSS filter
(`grayscale(1) contrast(1.35) brightness(1.05)`). That approximates the
toner look but loses the typographic restraint — the labels are still
Standard's mid-blue. Treat it as a stopgap.

## When NOT to use toner

- **Atlas analytical work** — use AtlasPlate (with or without atlas-relief).
  Toner is for the atmospheric slot.
- **Period episodes** — use `vintage={true}` (Meridian Sepia).
- **Dark-mode dramatic moments** — use `dark={true}` (Meridian Dark).

The decision tree in `MAP_TEMPLATE_SELECTOR.md` is the canonical guide;
toner enters at the "atmospheric / supporting basemap" branch where
Mapbox Standard was the previous default.
