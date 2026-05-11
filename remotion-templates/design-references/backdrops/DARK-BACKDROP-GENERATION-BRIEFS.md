# Dark segment backdrops — generation briefs (v1)

Nine **Meridian dark-register** PNGs for `public/assets/backdrops/{id}.png` (1920×1080). Current repo files are **flat-color placeholders** — replace with photographic / matte-painting art that matches these briefs.

**Pick list (CLI):** `python tools/assembly/print_backdrop_catalog.py --dark-register` — add `--chart-at-least high` when the foreground chart is dense. See [BACKDROP_CHART_PAIRING.md](./BACKDROP_CHART_PAIRING.md).

## Brand constraints (non-negotiable)

- **Palette:** Anchor shadows in `modes.dark.bg` from [`tools/brand-treatment/palette.json`](../../../tools/brand-treatment/palette.json): base `#12100E`, surface `#1C1814` (ink), elevated `#2A2520` (midnight), map tone `#1A1612`. Accents sparingly: gold `#C4A747`, umber `#8B7355`, semantic accents only as tiny practical lights — **no neon rainbow**, no cyberpunk cyan grid unless it reads as instrument glow at 5% opacity.
- **Legibility:** Upper ~65% of frame stays **quiet** for charts/titles; no high-contrast clutter behind hero safe zones (see each id’s `anchor` in [`backdrop-manifest.json`](../../data/backdrop-manifest.json)).
- **Content:** No readable text, logos, flags, or recognizable faces. No literal war footage gore.
- **Treatment:** Subtle film grain OK; match existing editorial-backdrop PNG noise level. Export sRGB PNG.

## Image-gen prompts (adapt for your tool)

Use **photorealistic matte painting** or **large-format photograph heavily graded** — Parallax reads as serious documentary, not game UI.

### `night-operations`

Wide dark command floor; blank tactical screens (black glass); single amber exit sign or rack LED as pinprick. Cool bias in shadows `#12100E`–`#1A1612`. Weight left third — racks or console silhouette.

### `abyss-depth`

Vertical gradient from near-black to slightly cooler deep blue-black at bottom; faint horizon line; suggestion of cable curvature or bioluminescent dust — abstract, not submarine illustration.

### `foundry-ember`

Industrial yard at night; distant orange furnace bloom under smoke deck; silhouetted gantry left. Warm rim only — shadows stay ink-family.

### `city-noir`

City canopy from distance: sodium pools on wet asphalt, sparse windows; bottom fifth silhouette band; heavy atmospheric haze; upper frame empty gradient.

### `archive-nocturne`

Library vault after hours; diagonal warm shaft across shelving wall **on the right**; deep vignette; mahogany/bone bounce suppressed — mostly umber/gold in the light rake only.

### `constellation-grid`

Sparse real-star scatter (subtle Milky Way OK); faint projected graticule or meridian arc at **≤8% opacity**; no labeled constellations; centered quiet for orbital metaphors.

### `switchyard-night`

Rail or HV yard silhouettes; repeating structural rhythm bottom third; mixed amber and cool-white spill from yards — still monochrome-forward overall.

### `rift-silhouette`

Dark plateau split by a single horizon crevice/fault shadow; sky gradient ink→midnight; geological read without recognizable landmark.

### `night-grid`

Pure dark analytical field — **no stars**, only a faint ruled / perspective grid or meridian bundle at **≤10% luminance delta** against `#12100E`–`#1A1612`. Dark counterpart to daylight `strategy-grid`; reads as blank plotting plane or situation-map substrate.

## Pipeline

1. Produce full-res PNGs named `{id}.png`.
2. Drop into `remotion-templates/design-references/backdrops/` as `editorial-backdrop-{id}-v1.png` (optional archive).
3. Copy finals to `remotion-templates/public/assets/backdrops/{id}.png`.
4. Spot-check in Remotion: **Editorial → Backdrop-foundation → ForegroundBackdrop-{id}**.

## Manifest

Canonical ids and agent copy live in [`remotion-templates/data/backdrop-manifest.json`](../../data/backdrop-manifest.json).
