# ArchivalReel — Research Dossier

> Created May 19, 2026. Film-stock register applied to a still image —
> 8mm / 16mm / VHS. The medium dates the image without a chyron.

## 1. The form's editorial purpose

ArchivalReel applies a film-stock visual signature (8mm grain, 16mm scratches, VHS scanlines) to a still image to communicate *"this is period footage."* The treatment carries the date — viewers unconsciously read 8mm as 1965+ home-movie, 16mm as 1923+ newsreel/documentary, VHS as 1976+ consumer-video. Reach for it when the source image is a real archival still and you want the visual register to anchor the era without a chyron or dateline. Reach for it MORE rarely than instinct suggests — most modern photos shouldn't get 8mm grain (anachronism), and most real archive footage already has its own grain (Apollo 11 doctrine: don't over-treat).

## 2. Canonical signatures

**8mm (Super-8, 1965–1990).**
Heavy grain clumps (turbulence baseFrequency ~0.75), Kodachrome warm-magenta cast, 18 fps judder (hold every other frame), soft corners + heavy vignette, occasional splice flash (~0.3% probability per frame), small sprocket-hole flicker. Home-movie register: Vietnam-era family Super-8, Soviet vacation footage, 70s-80s amateur film. References: Apollo 11 (Miller, 2019) shot on real 8mm + 16mm; The Vietnam War (Burns/Novick, 2017) heavy use of period 8mm.
Failure mode: applied to a 1990s+ photo — anachronism. Use VHS for late-Cold-War.

**16mm (1923–present, dominant for newsreel until 1980s).**
Fine grain (baseFrequency ~1.2), neutral-to-cool color cast, 24 fps (no judder), 1–2px gate weave (horizontal jitter), occasional vertical scratch (emulsion damage, ~1% probability), deeper blacks via contrast bump. Newsreel / news-film register: CBS Vietnam coverage, BBC documentary footage, NBC nightly news pre-1990. References: Adam Curtis routinely uses untreated 16mm from BBC archives.
Failure mode: too much grain — the form's editorial point is "professional film stock"; overdoing artifacts reads as fake.

**VHS (1976–1995, dominant for consumer + late-broadcast).**
Repeating-2px scanlines, chroma bleed (red/blue offset on saturated edges), horizontal tracking band scrolling vertically (~120-frame cycle), saturation lift ~20%, soft luma, blocky chroma noise in shadows. Consumer-video register: Berlin Wall fall amateur footage, Gulf War CNN coverage, perestroika-era street video. Reference: Hypernormalisation (Curtis, 2016) intersperses VHS with film throughout.
Failure mode: tracking bands too frequent — real VHS has them rarely; constant tracking issues read as broken equipment, not period register.

**Apollo 11 doctrine (Miller, 2019).**
When you have **native** archive film, do NOT add grain on top. The footage already has its own grain at high fidelity. Set `nativeFootage: true` to reduce treatment intensity by ~60% (gate weave preserved, grain dialled back). The Apollo 11 restoration scanned 65mm at maximum fidelity precisely so the real grain could breathe; faked grain over a high-resolution still IS the "Instagram filter" tell.

## 3. General principles

The visual signature dates the image. The treatment IS the chyron. Editorial leverage requires *era-matching* — applying VHS scanlines to a 1944 photo or 8mm warm-magenta to a 2008 image is anachronism, which destroys evidentiary credibility. The selection of stock is itself an editorial claim about when the source belongs to.

Tufte / Cleveland frameworks don't apply directly (this isn't data viz); the relevant aesthetic frame is film-medium theory — Walter Murch's "moviola consciousness," the way film artifacts (grain, weave, splice) signal to viewers that they're looking at an artifact rather than direct observation.

Intensity dial: 0.3–0.4 for native archive footage (subtle treatment), 0.5–0.6 for clean photos receiving era register (medium), 0.7+ only for dramatic editorial moments where the artifact-ness IS the point (rare).

## 4. Recommendation for Parallax

Default to **16mm** at intensity 0.5 with `nativeFootage: true` when source is genuinely archival film. This matches the channel's analytical-documentary register (1950s-80s newsreel feel). Use **8mm** for personal / amateur 1960s-80s footage (Soviet family camera, vacation 8mm). Use **VHS** for late-Cold-War (1985-1995) consumer video moments.

Pair with `caption` block: `STOCK · YEAR · SOURCE` in mono small-caps bottom-left ("16MM · 1968 · US NATIONAL ARCHIVES"). This anchors the era without needing the title block.

Anti-pattern: applying any stock to a photo younger than ~10 years older than the stock's era. (No 8mm on a 1980+ photo; no VHS on a pre-1976 photo.) This is the dossier's most-violated rule when authors get excited about the "vintage look."

## 5. Current template alignment

`ArchivalReel` ships with all three stocks via `data.stock` enum. Each stock has its own STOCK_PRESETS entry driving filter / grain frequency / opacity / judder / gate weave / scanlines / chroma bleed / scratch probability / vignette intensity. `intensity` (0-1) scales everything; `nativeFootage: true` applies the Apollo 11 doctrine reduction. `colorCast` override available for unusual stock variants.

Default props ship with 16mm preset on a local placeholder image (the existing `public/assets/sample-historical.png`). Editors hot-swap `imageUrl` with real archive footage per episode.

## 6. Specific upgrades proposed

1. **Stock-specific frame rate** (high effort, low impact) — the judder for 8mm is approximated by stepping every other frame, but real 8mm is 18fps shown at 24fps (3:2 pulldown-like). A proper interpolated judder would feel more authentic. The current step approximation is good enough at video resolution.
2. **Color-cast LUTs per stock** (medium effort, medium impact) — current `filter` strings approximate Kodachrome warmth with hue-rotate. Real Kodachrome has non-linear color response (lifted reds, crushed blacks). A proper LUT would nail the look, but ships kilobytes per stock.
3. **Sprocket-hole flicker overlay** (low effort, low impact) — 8mm specifically has visible sprocket-hole light bleed at edges. Could add a per-frame edge-flash effect. Subtle but characteristic.
4. **Tape damage modes for VHS** (medium effort, medium impact) — beyond tracking bands, real VHS has rainbow-static at tape stress points, audio-video desync visualised as edge ghosting. Add `vhsDamage: "clean" | "worn" | "ragged"` for fine control.
5. **Multi-image montage variant** (medium effort, low impact) — show 2-3 archival stills in sequence with consistent stock treatment (a mini PhotoMontage with ArchivalReel chrome). Currently single-image only.

## 7. Failure mode flags

- **Era-mismatched stock** — 8mm on a 1990 photo, VHS on a 1950 photo. Catastrophic credibility failure.
- **Treatment intensity 1.0 on native footage** — reads as Instagram filter. Apply Apollo 11 doctrine: `nativeFootage: true` halves intensity automatically.
- **No source citation** — the form makes a claim ("this is period footage") that demands attribution. Always include `data.source` and a `data.caption.source`.
- **Color cast clashes with original image color** — applying warm 8mm magenta over an image already heavily warm-cast double-warms it into orange. Set `colorCast: null` for sources that already have strong native color.
- **Stock applied to a graphic / diagram** — ArchivalReel is for archival PHOTOGRAPHIC stills. Applying it to a chart or diagram is the wrong template (use FilmOverlay directly via a different template).
- **Title block under the film effects** — known initial bug, fixed by rendering title AFTER film overlays so it sits on top of the treated image.
