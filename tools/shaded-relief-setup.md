# Shaded-Relief Setup — AtlasPlate `aesthetic: "atlas-relief"`

> One-time manual procedure. ~15 minutes including the download.
>
> Sets up the Tom Patterson hand-painted shaded relief asset that powers
> AtlasPlate's `atlas-relief` aesthetic — the National-Geographic register
> that absorbs most of the cases that historically escaped to Mapbox
> terrain. See `remotion-templates/MAP_TEMPLATE_SELECTOR.md` for the
> selection guide.

## What this gives you

A pre-warped PNG for each AtlasPlate projection (`equalEarth`,
`naturalEarth`, `equirectangular`) sitting at
`remotion-templates/public/geo/relief/{projection}.png`. When an
AtlasPlate composition sets `aesthetic: "atlas-relief"`, the
`<ReliefUnderlay>` component drops the matching PNG in underneath the
country layer with a bone/paper SVG filter applied.

License: **public domain.** Tom Patterson released the manual shaded
relief layers to the public domain via Natural Earth. No attribution
required (we credit by convention in the editorial chip).

## Step 1 — Download the source raster

The canonical asset is Natural Earth's 1:50m Cross-Blended Hypsometric
Tints With Shaded Relief raster ("NE2_HR_LC_SR_W") OR the 1:10m manual
shaded relief raster. The 1:50m is sufficient for 1920×1080 output and
~64 MB; the 1:10m is ~250 MB and worth it only if you regularly crop
into regional sub-views.

- 1:50m bundle (recommended): https://www.naturalearthdata.com/downloads/50m-raster-data/50m-cross-blend-hypso/
  Look for `HYP_50M_SR_W.zip` (or the version with `_W` suffix for
  west-of-the-antimeridian unwrapped). Unzip to extract the `.tif`.
- 1:10m bundle (regional zoom): https://www.naturalearthdata.com/downloads/10m-raster-data/10m-cross-blend-hypso/

Save the GeoTIFF as:

```
remotion-templates/public/geo/relief/_source/HYP_50M_SR_W.tif
```

(The `_source/` directory is gitignored — only the warped output PNGs
are committed, not the source raster.)

## Step 2 — Convert source to equirectangular PNG

The source is a GeoTIFF in WGS84 / EPSG:4326 (equirectangular / plate
carrée). We need a plain PNG to feed the warp script. The OUTPUT FILENAME
MATTERS: the warp script defaults to reading
`public/geo/relief/_source/equirect-source.png`. If you save it under a
different name, pass `--source=path/to/your.png` to the script in Step 3.

```bash
# Recommended: macOS sips (preinstalled, no dependency to install)
sips -s format png --resampleHeightWidth 2700 5400 \
  remotion-templates/public/geo/relief/_source/HYP_50M_SR_W.tif \
  --out remotion-templates/public/geo/relief/_source/equirect-source.png

# Alternative: ImageMagick (`brew install imagemagick`)
magick remotion-templates/public/geo/relief/_source/HYP_50M_SR_W.tif \
  -resize 5400x2700 \
  remotion-templates/public/geo/relief/_source/equirect-source.png

# Alternative: GDAL (`brew install gdal`)
gdal_translate -of PNG -outsize 5400 2700 \
  remotion-templates/public/geo/relief/_source/HYP_50M_SR_W.tif \
  remotion-templates/public/geo/relief/_source/equirect-source.png
```

`5400×2700` is the canonical 2:1 plate carrée aspect at high enough
detail for the 1920×1080 warp downstream. Don't go higher — the warp
script reads the entire source into memory.

## Step 3 — Pre-warp into each AtlasPlate projection

```bash
cd remotion-templates
node scripts/prepare-shaded-relief.mjs

# If the source PNG isn't at the default path, pass --source=
node scripts/prepare-shaded-relief.mjs \
  --source=/path/to/my-source.png

# If your episodes use a non-default `data.framePadding`, pass it through
# (the output filename gets a `-{padding}` suffix; see component docs)
node scripts/prepare-shaded-relief.mjs --framePadding=100
```

This script reads
`public/geo/relief/_source/equirect-source.png`, then for each supported
projection (Equal Earth, Natural Earth, Equirectangular) it:

1. Creates a fresh `d3-geo` projection instance.
2. Fits it to the canonical 1920×1080 viewport with 80px padding (matches
   AtlasPlate's `DEFAULT_FRAME_PADDING`).
3. For each output pixel, inverts through the projection to get
   lon/lat, samples the source raster, writes the pixel.
4. Saves the warped result to `public/geo/relief/{projection}.png`.

Per-projection runtime: ~3-5 seconds on a 2024 MacBook Pro. Output PNGs
are ~1.5-2 MB each.

## Step 4 — Verify

Render the catalog sample:

```bash
cd remotion-templates
npx remotion still src/index.ts CatalogAtlasReliefDemo --frame=60 \
  --output=out/relief-check.png
```

Expected result: warm-grayscale relief layer under the country
strokes, visible as topographic texture in the oceans (where there are
no country fills overlaid). If you see a flat ocean rectangle with no
relief, the asset is missing — check `public/geo/relief/` for the
warped PNGs.

## Adding support for a new projection

Edit `remotion-templates/scripts/prepare-shaded-relief.mjs` and add the projection name to
the `PROJECTIONS` array. The script reads d3-geo's projection registry,
so any projection d3-geo can invert is supported (Mercator, Albers,
Robinson, …). Orthographic (globe) is not supported in v1 — it would
need a per-frame warp because the visible hemisphere rotates.

## Why we don't ship the warped PNGs

Total committed size would be ~6-10 MB (3 projections × ~2 MB). That's
not breaking, but two reasons to defer:

1. Anyone adding an episode that uses a different projection needs the
   prep script anyway, so it's a one-time step regardless.
2. Tom Patterson updates the relief layers occasionally; re-running the
   pipeline grabs the latest. Committed PNGs would drift.

If solo-creator setup friction becomes the bottleneck, revisit and
commit the three default-projection PNGs. They're listed in
`.gitignore` under `# Shaded-relief warped output`.
