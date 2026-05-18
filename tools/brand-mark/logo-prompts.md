# Parallax Logo — Recraft Generation Prompts

> Status: design exploration. **None of these are canonical yet.** Run, look, iterate.

## Context

The current ∴ (therefore) brand mark needs replacement. The visual system (Meridian Light/Dark, IBM Plex type pair, palette, constructivist illustration register, crosshair reticle) stays intact regardless of what we land on — we're swapping the *iconic glyph slot* only.

This doc generates AI candidates for three of the six directions surfaced in the brand-mark conversation:

- **Path B — Two Offset Forms** (literal parallax: two identical geometric forms offset by perspective shift)
- **Path C — Custom P Monogram** (typographic letterform encoding the parallax-shift concept)
- **Path E — Strata / Layered Form** (horizontal/layered geometry encoding "patterns across eras")

Each path has 5 variants. Run all 15, pick 3-5 candidates from each path for human review, then narrow.

## Brand constraints (apply to every prompt)

**Palette (canonical hex):**
- ink: `#1C1814` (primary dark)
- amber / gold: `#E5A544` or `#C4A747` (primary accent)
- oxblood: `#6B1D1D` (secondary accent, light-mode)
- rust: `#C23B22` (dramatic accent, sparingly)
- bone: `#F0E6D0` (light surface)
- paper: `#F5F0E8` (light surface, primary)
- walnut: `#5C4A3D` (mid-tone)

**Restrict to a maximum of 3 hex values per logo.** Two-color marks are stronger. Avoid green, blue, purple — they break the Meridian palette discipline.

**Output specs:**
- Square aspect (1:1)
- Vector output (`.svg`) preferred for crisp scaling
- Must be legible at 32×32 pixels (favicon test)
- Must work in pure single color (one-color stamp test)
- Transparent or solid bone/paper background

**What NOT to generate:**
- No text or words in the mark itself (wordmark is separate)
- No gradients (flat fill only)
- No drop shadows or 3D effects
- No photorealistic rendering
- No human faces (figure paths are Path D, not these three)
- No mathematical/scientific symbols (no `∴`, no Σ, no ∫, etc. — that's what we're replacing)
- No standard logo clichés (no globes, no compasses, no upward arrows, no swooshes)
- No specific named entities (no real flags, no real institutional logos)

## How to run

The Recraft pipeline expects the prompt + negative-prompt + style. For logo generation use `--style logo_raster` or `--style vector_illustration` (the second often produces cleaner geometric output for marks like these). The `--register analytical` flag is the closest to "diagrammatic non-scenic" — use that.

```bash
cd tools/recraft
export RECRAFT_API_KEY="..."

# Generate one variant for inspection
python recraft.py generate "<PROMPT HERE>" \
  --register analytical \
  --style vector_illustration \
  --negative-prompt "<NEGATIVE HERE>" \
  -o /Users/feihuyan/project-parallax/tools/brand-mark/candidates/B1-v01.svg

# Generate 3 variants of one prompt at once (recommended)
python recraft.py generate "<PROMPT>" \
  --register analytical --style vector_illustration \
  --negative-prompt "<NEG>" \
  --variants 3 \
  -o tools/brand-mark/candidates/B1-vNN.svg
```

Approximate cost: $0.08/image × 3 variants × 15 prompts = ~$3.60 for a full sweep.

---

## Path B — Two Offset Forms

The "literal parallax" play. Two identical geometric forms offset in 2D space, the offset itself encoding the channel's central concept. Reads as designed-mark-with-meaning rather than borrowed-glyph.

### B1 — Twin offset triangles (stereoscopic pyramid)

**Prompt:**
> Logo mark: two identical equilateral triangles, both pointing upward, the second triangle offset 8-12% to the right and 4-6% downward from the first. The front triangle is solid amber gold (#E5A544); the back triangle is solid oxblood (#6B1D1D), partially occluded by the front. Where the two overlap, the color blends to a darker ink tone. Flat color fills only, no gradients, no shading, no outlines beyond the form edges themselves. Geometric precision, Bauhaus modernist register. Set on solid bone (#F0E6D0) square background. Centered composition with generous negative space (the mark occupies the central 60% of the frame). Mid-century corporate-modernist mark in the Paul Rand / Massimo Vignelli lineage.

**Negative prompt:**
> no gradients, no drop shadow, no 3D rendering, no perspective rendering, no text, no letters, no skeuomorphism, no globes, no compasses, no swooshes, no green or blue, no purple, no rendered faces, no photographic detail, no fine line work, no decorative ornament

### B2 — Two offset circles (stereoscopic eye)

**Prompt:**
> Logo mark: two identical solid circles of equal diameter, the second circle offset to the right by approximately 25% of one circle's diameter. The left circle is solid amber gold (#E5A544); the right circle is solid oxblood (#6B1D1D). Where they overlap in the center, the color is a deeper ink (#1C1814). Flat color fills only. The composition reads as the red-cyan channels of a 3D anaglyph image, but rendered in the Parallax warm palette. Centered on solid bone (#F0E6D0) square background with generous negative space. Editorial mid-century modernist mark in the Bauhaus / Vignelli lineage.

**Negative prompt:**
> no gradients, no drop shadow, no 3D rendering, no text, no letters, no glasses, no eyes, no rendered features, no skeuomorphism, no chemistry symbols, no biology cells, no green or blue, no purple, no decorative outlines, no photorealism

### B3 — Two offset squares (parallelogram resolve)

**Prompt:**
> Logo mark: two identical solid squares, both axis-aligned with the frame, the second square offset to the upper-right of the first by approximately 40% of one square's side length. Both squares are solid amber gold (#E5A544). Where they overlap, the color deepens to oxblood (#6B1D1D). The negative space between the two non-overlapping corners forms a clean parallelogram. Flat color fills only, no gradients, no outlines beyond the form edges. Bauhaus geometric precision. Centered on solid bone (#F0E6D0) square background with generous negative space. Modernist publication-brand register, the kind of mark you would see on a contemporary architectural-magazine masthead.

**Negative prompt:**
> no gradients, no drop shadow, no 3D rendering, no text, no letters, no rotation, no tilted shapes, no skeuomorphism, no decorative ornament, no green or blue, no purple, no photorealism, no fine line work

### B4 — Solid form + shifted echo (afterimage)

**Prompt:**
> Logo mark: a solid amber gold (#E5A544) form (a tall narrow rectangle, or a chevron pointing right) sits in the center of the frame. A second copy of the identical form, rendered in 35% opacity oxblood (#6B1D1D), is offset to the right and slightly downward, like an afterimage or echo. The two forms partially overlap; the overlap region shows the darker color slightly enhanced. Flat color fills only — the 35% opacity is the only non-solid element. No outlines. Centered on solid bone (#F0E6D0) square background. Editorial mid-century modernist mark.

**Negative prompt:**
> no gradients beyond the single opacity step, no drop shadow, no glow, no 3D rendering, no text, no letters, no motion blur, no perspective rendering, no decorative ornament, no green or blue, no purple, no photorealism

### B5 — Twin arrowheads (offset momentum)

**Prompt:**
> Logo mark: two identical solid arrowhead shapes (clean triangular wedges pointing rightward), the second arrowhead offset slightly behind and below the first. The lead arrowhead is solid amber gold (#E5A544); the trailing arrowhead is solid oxblood (#6B1D1D), partially occluded by the lead. The composition implies controlled forward momentum and parallax shift simultaneously. Flat color fills only, no gradients, geometric precision. Centered on solid bone (#F0E6D0) square background with generous negative space. The mark reads as an editorial publication's analytical sigil — closer to Bloomberg or Foreign Affairs than to a logistics company.

**Negative prompt:**
> no gradients, no drop shadow, no 3D rendering, no perspective, no text, no letters, no full arrow shafts, no archery, no aviation reference, no rocket motifs, no decorative ornament, no green or blue, no purple, no skeuomorphism

---

## Path C — Custom P Monogram

A typographic mark where the "P" letterform itself encodes the parallax concept. Reads as a publication mark first, parallax meaning second. Highest editorial-register option.

### C1 — Split-P (vertical fracture)

**Prompt:**
> Logo mark: a single capital letter P, geometric construction (think Bauhaus Universal or Futura-derived), composed of a vertical stem and a half-circle bowl. The letter has been cleanly fractured along its central vertical axis: the left half (stem) is solid ink (#1C1814) and stays in position, while the right half (bowl) is solid amber gold (#E5A544) and is offset slightly to the right and downward, creating a visible parallax-shift gap between the two halves. Flat color fills only, no gradients. Centered on solid bone (#F0E6D0) square background. Editorial publication-mark register.

**Negative prompt:**
> no gradients, no drop shadow, no 3D rendering, no italic, no serif, no script, no calligraphic flourish, no decorative outline, no text other than the P, no other letters, no rendered features, no green or blue, no purple, no shadow effects

### C2 — Overlapping-P (twin strokes)

**Prompt:**
> Logo mark: two identical capital letter P shapes overlaid on the same center point, the second P offset 6-10% to the right of the first. The back P is solid oxblood (#6B1D1D); the front P is solid amber gold (#E5A544). Where the two letters overlap, the color is a deeper ink tone. Geometric letterform construction (Bauhaus / Futura-derived), no serifs, clean straight stem and circular bowl. Flat color fills, no gradients. Centered on solid bone (#F0E6D0) square background. The mark reads as a typographic publication-brand whose letter itself encodes parallax.

**Negative prompt:**
> no gradients, no drop shadow, no 3D rendering, no italic, no serifs, no script, no calligraphic flourish, no Cyrillic letters, no Greek letters, no text beyond the P, no decorative outline, no green or blue, no purple

### C3 — Strata-P (P composed of horizontal layers)

**Prompt:**
> Logo mark: a single capital letter P, geometric construction, but the letterform is built out of 5-7 horizontal strata or bands of varying thickness, stacked vertically. The bands progress from solid ink (#1C1814) at the bottom through walnut (#5C4A3D) and umber (#8B7355) in the middle, to solid amber gold (#E5A544) at the top. Each band is a flat color, no gradient between bands — the transition is stepped. The letter P shape is the silhouette; the strata fill that silhouette. Centered on solid bone (#F0E6D0) square background. Editorial publication-mark register, modernist, the kind of mark a serious quarterly journal would adopt.

**Negative prompt:**
> no gradients within bands, no drop shadow, no 3D rendering, no italic, no serif, no script, no calligraphic flourish, no decorative outline, no text beyond the P, no other letters, no rainbow palette, no green or blue, no purple

### C4 — Telescope-P (extended descender)

**Prompt:**
> Logo mark: a single capital letter P, but the vertical stem extends downward well past the baseline into a long narrow tail, suggesting a telescope or sextant viewing tube. The bowl of the P sits at the top of the elongated form. Bowl is solid amber gold (#E5A544); the long tail is solid ink (#1C1814). Flat color fills only, no gradients, geometric precision. Centered on solid bone (#F0E6D0) square background. Editorial mark in the mid-century corporate-modernist lineage; the elongated descender reads as an instrument of observation.

**Negative prompt:**
> no gradients, no drop shadow, no 3D rendering, no realistic telescope rendering, no eyepiece detail, no italic, no serif, no script, no decorative ornament, no text beyond the P, no other letters, no green or blue, no purple

### C5 — P-in-reticle (monogram framed by crosshair)

**Prompt:**
> Logo mark: a single capital letter P at the center of a thin geometric crosshair reticle. The reticle consists of two concentric thin circles and four short crosshair tick marks at the cardinal compass positions, all rendered in 1-2px-equivalent line weight in ink (#1C1814). The P inside is solid amber gold (#E5A544), geometric construction, no serifs. Flat color fills, no gradients, generous negative space around and inside the reticle. Centered on solid bone (#F0E6D0) square background. The composition combines the crosshair element already established in the Parallax visual system with a typographic monogram.

**Negative prompt:**
> no gradients, no drop shadow, no 3D rendering, no rifle scope detail, no compass rose ornament, no italic, no serif, no script, no other letters, no rendered features inside the reticle, no decorative outline beyond the two concentric circles, no green or blue, no purple

---

## Path E — Strata / Layered Form

Horizontal/layered geometry encoding the "patterns across eras" thesis. Mid-century modernist clean lines. Closest to *The Atlantic* / *Foreign Affairs* editorial register.

### E1 — Five horizontal strata, one offset

**Prompt:**
> Logo mark: five horizontal rectangular bands of equal width, stacked vertically with a small gap between each band. From bottom to top, the colors progress: solid ink (#1C1814), solid walnut (#5C4A3D), solid umber (#8B7355), solid amber gold (#E5A544), and back to ink (#1C1814) at the top. The middle band (umber) is offset to the right by approximately 12% of the band's width, breaking the otherwise perfectly stacked column — the parallax-shift element. Flat color fills only, no gradients. Centered on solid bone (#F0E6D0) square background. Bauhaus geometric precision, mid-century editorial mark register.

**Negative prompt:**
> no gradients within bands, no drop shadow, no 3D rendering, no perspective, no text, no letters, no decorative ornament, no rainbow palette, no green or blue, no purple, no photorealism, no rounded corners

### E2 — Circular cross-section (geological core sample)

**Prompt:**
> Logo mark: a solid circle viewed face-on, the circle's interior divided into 5 horizontal strata of varying thickness, suggesting a vertical cross-section through layered earth or sediment. From bottom to top: solid ink (#1C1814), walnut (#5C4A3D), umber (#8B7355), amber gold (#E5A544), bone (#F0E6D0). The outermost stratum (top) is the thinnest; the lowest is the thickest. Each band is flat color, no gradient between bands. The whole circle is bordered by a thin ink (#1C1814) outline of 2-3px-equivalent weight. Centered on solid paper (#F5F0E8) square background with generous negative space. Editorial mark in the mid-century scientific publication register — think *Scientific American* or *Foreign Affairs* analytical brand.

**Negative prompt:**
> no gradients within strata, no drop shadow, no 3D rendering, no photorealistic geology, no text, no letters, no compass rose, no decorative ornament, no rainbow palette, no green or blue, no purple, no soft edges

### E3 — Three converging strata (vanishing point)

**Prompt:**
> Logo mark: three horizontal rectangular bands that taper toward a vanishing point on the right edge of the frame, suggesting layered terrain receding into distance. The leftmost (foreground) edges of the bands are full-width; the rightmost edges converge to a narrow point. From bottom to top: solid ink (#1C1814), solid amber gold (#E5A544), solid oxblood (#6B1D1D). Flat color fills only, no gradients, geometric precision, the convergence is mathematical perspective rendered as flat geometry. Centered on solid bone (#F0E6D0) square background. Editorial mark, mid-century modernist, the kind of mark a strategic-studies publication would adopt.

**Negative prompt:**
> no gradients within bands, no drop shadow, no atmospheric perspective, no fog, no 3D rendering with depth cues, no photorealistic terrain, no text, no letters, no decorative ornament, no rainbow palette, no green or blue, no purple

### E4 — Stacked column with parallax shift between layers

**Prompt:**
> Logo mark: a vertical column composed of 7 thin horizontal rectangular bands of equal height, stacked with no gap between them. Each band is offset horizontally from the band below it by a small consistent amount (3-5% of band width), so the column zigzags or staircases slightly to one side as it ascends. From bottom to top, alternate bands are solid ink (#1C1814) and solid amber gold (#E5A544); the bottom band is ink. The cumulative offset over 7 bands creates a clear parallax-shift visual at the top vs the bottom. Flat color fills, no gradients, geometric precision. Centered on solid bone (#F0E6D0) square background with generous negative space. Editorial publication mark in the modernist publication-brand register.

**Negative prompt:**
> no gradients within bands, no drop shadow, no 3D rendering, no perspective, no text, no letters, no decorative ornament, no rainbow palette, no green or blue, no purple, no rounded corners, no Jenga or block-tower reference

### E5 — Strata + crosshair (brand-system synthesis)

**Prompt:**
> Logo mark: a horizontally oriented composition combining two existing Parallax brand elements. The lower two-thirds of the frame contains 4 horizontal rectangular strata (ink, walnut, umber, amber gold from bottom to top), and centered above the strata sits a thin geometric crosshair reticle (two concentric thin circles with four short cardinal tick marks, in ink, line weight 1-2px equivalent). The crosshair is positioned as if surveying the strata. Flat color fills throughout, no gradients. Centered on solid bone (#F0E6D0) square background with generous negative space. Modernist editorial mark — synthesizes the "layered patterns" thesis with the existing crosshair reticle to read as a single coherent sigil.

**Negative prompt:**
> no gradients within strata, no drop shadow, no 3D rendering, no telescope rendering, no rifle scope, no decorative ornament, no text, no letters, no compass rose, no rainbow palette, no green or blue, no purple, no photorealistic geology

---

## Iteration plan

1. **First sweep (15 prompts × 3 variants = 45 images, ~$3.60).** Run all 15. Skim outputs as contact sheet. Discard obviously broken results (Recraft sometimes misreads geometric instructions; expect ~20-30% noise).

2. **Shortlist (target 6-9 candidates total).** Pick the 2-3 strongest from each path. Look for:
   - Reads correctly at thumbnail size (mentally resize to 32×32)
   - Brand-palette discipline (no color drift into greens/blues)
   - Concept legibility (someone unfamiliar with the project can describe what it depicts)
   - Geometric precision (no wobbly edges, no asymmetric forms unless intentional)

3. **Second sweep (refine 3-5 prompts with adjustments, $0.50-$1.00).** Take the strongest variants and refine — adjust offset amounts, swap color pairs, try the same shape at different scales.

4. **Final 3 (human selection).** Reduce to three finalists, one per path or three within one path. Test each:
   - As a 96×96 circular YouTube avatar (will detail survive the circle mask?)
   - As a 32×32 favicon
   - In single ink color (one-color stamp test)
   - Against a thumbnail background (visual weight in context)

5. **Polish in Figma.** AI generation gets us 80% there for geometric/typographic marks like these. The final 20% — kerning, optical correction, true vector cleanup — is faster in vector tooling than in Recraft prompt iteration.

## Notes for review

The three paths produce different brand registers. When picking, also pick a register:

- **Path B (two offset forms)** → reads as *concept-driven analytical brand*. Closest to OpenAI / Anthropic / Stripe abstract marks. Strongest "designed by a serious studio" energy. Weakest "publication brand" energy.
- **Path C (P monogram)** → reads as *publication brand*. Closest to The Atlantic / Foreign Affairs / Substack. Most legible as "this is a media channel." Most dependent on letterform-craft precision.
- **Path E (strata)** → reads as *analytical research brand*. Closest to Scientific American / Foreign Policy / RAND. Most distinctive in a YouTube grid of mostly-face thumbnails. Hardest to make feel warm / approachable.

There's no objectively right answer; pick the register that fits how you want viewers to describe the channel after one episode.
