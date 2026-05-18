# Parallax Logo — ChatGPT (GPT Image 2) Prompts

> Companion to `logo-prompts.md`. Same 15 concepts, rewritten for **GPT Image 2** (ChatGPT Images 2.0, released April 21, 2026). Each prompt is a single copy-paste block.

## Why these prompts look different from the Recraft version

The April 2026 model added **native reasoning** ("Thinking Mode") — it now reasons through composition, object counts, spatial relationships, and constraints before rendering a pixel. The OpenAI prompting guide (2026) recommends:

1. **Describe an exact output, not a vibe.** Specifics get rewarded; mood words get flattened.
2. **Build the prompt in ordered parts:** composition → style → typography → color → secondary details → constraints. The model reads sequentially.
3. **Use directive verbs:** "Draw," "render," "compose." The model treats these as the operation.
4. **Inline the negatives** with "Do not include…" or "without…" rather than as a separate field. There is no negative-prompt parameter in the chat UI.
5. **Hex codes are honored.** Spell them out (`#E5A544`) — the 2026 model reads them accurately.
6. **Aspect ratio must be stated.** Default is landscape; say "square 1:1 aspect ratio" explicitly.

Sources: [OpenAI prompting guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide), [Atlabs 2026 guide](https://www.atlabs.ai/blog/the-ultimate-gpt-image-2-prompting-guide-how-to-use-openai%E2%80%99s-best-image-model-2026), [Phygital April 2026 update notes](https://phygital.plus/blog/chatgpt-image-2-0-guide-april-2026-update/).

## How to use

1. Open ChatGPT (Plus/Pro recommended — thinking mode is the killer feature for logo work, and it's gated).
2. **Before the first prompt, paste this context primer** in the chat (one time, sets the brand frame):

```
I'm designing a logo mark for Parallax, an editorial geopolitics YouTube channel. The brand register is mid-century corporate-modernist — Paul Rand for IBM, Massimo Vignelli, Bauhaus geometric precision, Burtin/Bayer/Fortune 1955 lineage. NOT consumer-tech, NOT crypto, NOT minimalist-sans-serif-startup. Editorial publication-mark energy. Restrict to two flat colors max, no gradients, no drop shadows, no 3D effects, no skeuomorphism. I'll send 15 prompts in three groups. For each, generate a single 1024×1024 square image.
```

3. Paste each prompt below as a separate message. Each is self-contained — the model will hold the brand context from the primer.

4. After a generation, you can iterate with **single-instruction edits**: *"Make the offset 50% larger"* / *"Try amber on ink instead of oxblood on bone"* / *"Reduce the bowl of the P by 15%."* The 2026 model handles sequential single-instruction refinements far better than re-prompting from scratch.

5. To compare variants side-by-side, ask: *"Generate four variants of this prompt, each with a different offset angle (15°, 30°, 45°, 60°)."* The 2026 model can produce up to 8 consistent variants per prompt.

---

## Path B — Two Offset Forms

The "literal parallax" play. Two identical geometric forms, offset in 2D space, the offset itself encoding the channel's central concept.

### B1 — Twin offset triangles

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: Two identical equilateral triangles, both pointing upward. The first triangle is centered. The second triangle is offset 10% to the right and 5% downward from the first, partially occluded by it. Generous negative space around the entire mark — the two triangles occupy the central 60% of the frame.

Style: Mid-century corporate-modernist, Bauhaus geometric precision, flat vector illustration. The lineage of Paul Rand and Massimo Vignelli — clean lines, mathematical proportions, no decorative ornament.

Color: The front triangle is solid amber gold (#E5A544). The back triangle is solid oxblood (#6B1D1D). Where they overlap, the color deepens to ink (#1C1814). Background is solid bone (#F0E6D0). These are the only colors in the image.

Constraints: Do not add gradients, shading, drop shadows, glow, or 3D rendering. Do not add text, letters, or symbols. Do not add outlines beyond the shape edges themselves. Do not use any green, blue, or purple. Do not add decorative elements, frames, or borders.
```

### B2 — Twin offset circles (stereoscopic eye)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: Two identical solid circles of equal diameter, side by side, the second circle offset to the right by approximately 25% of one circle's diameter — they partially overlap in the center. Generous negative space around the mark.

Style: Mid-century corporate-modernist, flat vector illustration, Bauhaus precision. The composition reads as the red-cyan channels of a 3D anaglyph image but in editorial warm palette — a sigil for an analytical publication, not a chemistry diagram.

Color: The left circle is solid amber gold (#E5A544). The right circle is solid oxblood (#6B1D1D). Where they overlap, the color is solid ink (#1C1814). Background is solid bone (#F0E6D0). These are the only colors.

Constraints: Do not add gradients, shading, drop shadows, glow, or 3D. Do not add text or letters. Do not render eyes, glasses, or any photographic features. Do not add cell-biology imagery or chemistry symbols. Do not use green, blue, or purple. Do not add outlines.
```

### B3 — Twin offset squares (parallelogram resolve)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: Two identical solid squares, both axis-aligned with the frame, the second square offset to the upper-right of the first by approximately 40% of one square's side length. Their partial overlap forms a clean parallelogram of darker color in the middle, and the negative space between the two non-overlapping corners forms another parallelogram. Generous negative space around the entire mark.

Style: Bauhaus geometric precision, flat vector illustration, the kind of mark you would see on a contemporary architectural-magazine masthead. Mid-century editorial register.

Color: Both squares are solid amber gold (#E5A544). Where they overlap, the color deepens to oxblood (#6B1D1D). Background is solid bone (#F0E6D0). These are the only three colors.

Constraints: Do not rotate or tilt the squares — they must stay perfectly axis-aligned. Do not add gradients, drop shadows, glow, or 3D. Do not add text, letters, or outlines. Do not use green, blue, or purple. Do not add ornament or framing.
```

### B4 — Solid form with shifted echo

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: A single solid form (a tall vertical rectangle, narrow proportions, height roughly 2.5× width) is centered in the frame. A second copy of the same form is offset to the right by 30% of its width and downward by 15% of its height. The second form is rendered at 35% opacity, like an afterimage or echo. Generous negative space.

Style: Editorial mid-century modernist, flat vector illustration, restrained.

Color: The front (solid) form is amber gold (#E5A544). The back (echo) form is oxblood (#6B1D1D) at 35% opacity, which makes it appear as a muted dusty version of itself. Background is solid bone (#F0E6D0). The 35% opacity step is the ONLY non-solid element in the image.

Constraints: Do not add any other gradients, drop shadows, glow, motion blur, or 3D perspective. Do not add text or letters. Do not add ornament, borders, or outlines. Do not use green, blue, or purple.
```

### B5 — Twin arrowheads (offset momentum)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: Two identical solid arrowhead shapes — clean triangular wedges pointing rightward, no arrow shafts. The second arrowhead sits slightly behind and below the first, offset by roughly 20% of one arrowhead's height. They imply controlled forward momentum and parallax shift simultaneously. Generous negative space around the mark.

Style: Editorial mid-century modernist, flat vector illustration. The mark should read like an analytical publication's sigil — closer to a Bloomberg or Foreign Affairs accent mark than to a logistics company logo.

Color: The lead arrowhead is solid amber gold (#E5A544). The trailing arrowhead is solid oxblood (#6B1D1D), partially occluded by the lead. Background is solid bone (#F0E6D0). These are the only colors.

Constraints: Do not add gradients, drop shadows, glow, or 3D. Do not draw any arrow shafts — only the triangular heads. Do not reference archery, aviation, rockets, or logistics. Do not add text. Do not use green, blue, or purple.
```

---

## Path C — Custom P Monogram

Typographic mark where the "P" letterform itself encodes the parallax concept. Highest editorial-register option — reads as publication brand first.

### C1 — Split-P (vertical fracture)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: A single capital letter P, geometric construction, the kind of P you would draw with compass and ruler — a clean vertical stem and a perfect half-circle bowl at the top. The letter has been cleanly fractured along its central vertical axis. The left half (the stem and the inner edge of the bowl) stays in position. The right half (the outer curve of the bowl) is offset 8% to the right and 4% downward, creating a visible parallax-shift gap between the two halves. Centered in the frame with generous negative space.

Style: Bauhaus geometric letterform (Universal-style or Futura-derived), no serifs, mid-century corporate-modernist register. Flat vector illustration.

Color: The left half (stem and inner bowl edge) is solid ink (#1C1814). The right half (offset outer curve) is solid amber gold (#E5A544). Background is solid bone (#F0E6D0). These are the only colors.

Constraints: Do not add gradients, drop shadows, glow, or 3D. Do not use italic, serif, script, or calligraphic flourishes. Do not add other letters or text. Do not render this as a 3D split with depth — both halves are flat. Do not use green, blue, or purple. Do not add decorative outline.
```

### C2 — Overlapping-P (twin strokes)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: Two identical capital letter P shapes overlaid on the same approximate center point, the second P offset 8% to the right of the first. Both are geometric Bauhaus-style letterforms — clean vertical stem and circular bowl, no serifs. Where the two P-shapes overlap, the colors deepen. Centered in the frame with generous negative space around the mark.

Style: Typographic publication-brand mark, mid-century corporate-modernist register, flat vector illustration. Letter construction in the Universal / Futura lineage.

Color: The back P is solid oxblood (#6B1D1D). The front P is solid amber gold (#E5A544). Where they overlap, the color is solid ink (#1C1814). Background is solid bone (#F0E6D0). These are the only colors.

Constraints: Do not add gradients, drop shadows, glow, or 3D. Do not use italic, serif, script, or calligraphic flourishes. Do not add Cyrillic, Greek, or any other letters — only the two Ps. Do not add decorative outlines, swashes, or ornament. Do not use green, blue, or purple.
```

### C3 — Strata-P (P composed of horizontal layers)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: A single capital letter P, geometric Bauhaus construction (clean vertical stem, half-circle bowl, no serifs). The letterform silhouette is filled with six horizontal stratum-bands of equal height, stacked from bottom to top. Each band is a single flat color. The bands are visible only inside the P silhouette — they do not extend beyond the letter's edges. Centered in the frame with generous negative space.

Style: Mid-century corporate-modernist typographic mark. Flat vector illustration. The kind of mark a serious quarterly journal would adopt.

Color: The six horizontal bands from bottom to top are: ink (#1C1814), walnut (#5C4A3D), umber (#8B7355), umber (#8B7355) again for visual weight, gold (#C4A747), and amber (#E5A544) at the top. The transitions between bands are stepped, not gradient. Background outside the P is solid bone (#F0E6D0).

Constraints: Do not blur or gradient between bands — they are stepped flat colors. Do not add drop shadows, glow, or 3D. Do not use italic, serif, or script. Do not add other letters or text. Do not use rainbow or pride colors. Do not use green, blue, or purple. Do not extend the bands outside the P silhouette.
```

### C4 — Telescope-P (extended descender)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: A single capital letter P with an unusually long vertical stem — the stem extends downward well past the baseline into a long narrow tail, suggesting the body of a telescope or sextant viewing tube. The bowl of the P sits at the very top of the elongated form. The total height of the mark is roughly 3× the bowl's diameter. Centered in the frame with generous negative space.

Style: Bauhaus geometric letterform, mid-century corporate-modernist register. The elongated descender reads as an instrument of observation. Flat vector illustration.

Color: The bowl of the P is solid amber gold (#E5A544). The elongated stem/tail is solid ink (#1C1814). Background is solid bone (#F0E6D0). These are the only three colors.

Constraints: Do not render a realistic telescope, lens, eyepiece, or tripod — this is a typographic mark, not an illustration of an instrument. Do not add gradients, drop shadows, glow, or 3D. Do not use italic, serif, or script. Do not add other letters. Do not use green, blue, or purple.
```

### C5 — P-in-reticle (monogram framed by crosshair)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: A single capital letter P sits at the exact center of a geometric crosshair reticle. The reticle consists of two thin concentric circles (the outer circle defines the mark's overall bounding circle), plus four short crosshair tick marks at the cardinal compass positions (12, 3, 6, 9 o'clock), each tick extending inward from the outer circle by roughly 8% of the circle's radius. The P fills approximately 50% of the inner space. The reticle lines have a consistent thin line weight, roughly equivalent to 2-3 pixels at 1024×1024. Centered in the frame.

Style: Mid-century corporate-modernist mark combining typographic monogram with reticle/crosshair element. Flat vector illustration. Editorial publication register with analytical surveying overtone.

Color: The P is solid amber gold (#E5A544). The reticle (both circles and tick marks) is solid ink (#1C1814). Background is solid bone (#F0E6D0). These are the only colors.

Constraints: Do not render a realistic rifle scope, camera viewfinder, or compass rose. Do not add cardinal direction letters (N/S/E/W). Do not add gradients, drop shadows, glow, or 3D. Do not use italic, serif, or script for the P. Do not add other letters. Do not add ornamental flourish to the reticle. Do not use green, blue, or purple.
```

---

## Path E — Strata / Layered Form

Horizontal/layered geometry encoding the "patterns across eras" thesis. Mid-century modernist clean lines. Closest to *The Atlantic* / *Foreign Affairs* editorial register.

### E1 — Five horizontal strata, one offset

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: Five horizontal rectangular bands of equal width and equal height, stacked vertically with a small consistent gap between each band (the gap is approximately 8% of band height). The whole stack occupies the central 60% of the frame, centered horizontally and vertically. Four of the bands are perfectly axis-aligned with the frame. The middle band (the third from the bottom) is offset horizontally to the right by 12% of the band's width — this single offset is the entire visual concept, the parallax-shift element.

Style: Bauhaus geometric precision, mid-century editorial publication-mark register, flat vector illustration.

Color: From bottom to top, the five bands are: ink (#1C1814), walnut (#5C4A3D), amber gold (#E5A544) — this is the offset band — walnut (#5C4A3D), ink (#1C1814). The palette has bilateral symmetry around the offset band, which emphasizes the offset as the focal point. Background is solid bone (#F0E6D0).

Constraints: Do not gradient between bands — each band is a single flat color. Do not add drop shadows, glow, or 3D perspective. Do not round the corners — every band is a perfect rectangle. Do not add text, letters, or ornament. Do not use rainbow or pride colors. Do not use green, blue, or purple.
```

### E2 — Circular cross-section (geological core sample)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: A single solid circle viewed face-on, occupying roughly 65% of the frame's diameter, centered. The circle's interior is divided into five horizontal strata of varying thickness, suggesting a vertical cross-section through layered earth, sediment, or time. The bottom stratum is the thickest (roughly 30% of the circle's height); the strata get progressively thinner toward the top, with the top stratum being the thinnest (roughly 8%). The circle is bordered by a thin ink-colored ring of 2-3px-equivalent line weight at 1024×1024.

Style: Mid-century scientific-publication register — think *Scientific American* analytical brand circa 1960, or a journal masthead. Flat vector illustration, Bauhaus geometric precision.

Color: The five strata from bottom to top are: solid ink (#1C1814), walnut (#5C4A3D), umber (#8B7355), amber gold (#E5A544), and solid bone (#F0E6D0). The outer ring/border of the circle is solid ink (#1C1814). Background outside the circle is solid paper (#F5F0E8).

Constraints: Do not gradient between strata — each is a flat color. Do not add drop shadows, glow, or 3D. Do not render photorealistic geology, soil texture, or rock detail. Do not add text, letters, or compass rose. Do not add ornament. Do not use green, blue, or purple. Do not soften the circle's edge.
```

### E3 — Three converging strata (vanishing point)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: Three horizontal rectangular bands of equal initial height, all three tapering from full width at the left edge of the mark to a narrow shared vanishing point near the right edge. The result reads as three layers of terrain or strata receding into distance — but rendered as flat geometric shapes, not perspective illustration. The three bands sit one above the other in the lower-center half of the frame. Generous negative space above and around the mark.

Style: Bauhaus geometric precision rendered as flat vector illustration. Mid-century modernist analytical-publication register. The convergence is mathematical perspective rendered as flat geometry, not atmospheric depth.

Color: From bottom to top, the three bands are: solid ink (#1C1814), solid amber gold (#E5A544), solid oxblood (#6B1D1D). Background is solid bone (#F0E6D0). These are the only four colors.

Constraints: Do not add atmospheric perspective, haze, or fog. Do not gradient the colors as they recede. Do not add a horizon line, sky, or sun. Do not render photorealistic terrain, mountains, or landscape. Do not add text or letters. Do not use green, blue, or purple. Do not soften any edges.
```

### E4 — Stacked column with parallax shift

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: A vertical column composed of seven thin horizontal rectangular bands of equal height, stacked with no gap between adjacent bands (they touch). Each band is offset horizontally from the band directly below it by a small consistent amount — 4% of band width. The offset direction is the same throughout (always rightward), so the column staircases progressively to the right as it ascends. By the seventh band, the cumulative horizontal offset is 24% of band width, producing a clearly visible diagonal lean. The column is centered horizontally on the frame (centered on the column's middle band).

Style: Bauhaus geometric precision, mid-century modernist editorial-publication register. Flat vector illustration.

Color: From bottom to top, alternating: ink (#1C1814), amber gold (#E5A544), ink, amber gold, ink, amber gold, ink. The pattern starts and ends with ink. Background is solid bone (#F0E6D0). These are the only colors.

Constraints: Do not gradient. Do not add drop shadows, glow, or 3D. Do not round the corners. Do not reference a Jenga tower, block tower, or building. Do not add text or letters. Do not use green, blue, or purple. The stair-step offset is consistent (4% each band) — do not vary the offset amount across bands.
```

### E5 — Strata plus crosshair (brand-system synthesis)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: A horizontally oriented composition combining two elements stacked vertically. The lower two-thirds of the frame contains four horizontal rectangular strata of equal height, stacked vertically with no gap between bands. The upper one-third of the frame contains a thin geometric crosshair reticle — two concentric thin circles with four short tick marks at the cardinal compass positions (12, 3, 6, 9 o'clock). The crosshair is centered horizontally above the strata. The whole composition is centered in the frame.

Style: Mid-century corporate-modernist mark synthesizing the channel's existing crosshair element with a strata thesis. Flat vector illustration, Bauhaus geometric precision. The mark reads as a single coherent sigil — "looking carefully at the layered patterns."

Color: The four strata from bottom to top are: solid ink (#1C1814), walnut (#5C4A3D), umber (#8B7355), amber gold (#E5A544). The crosshair (both concentric circles and tick marks) is solid ink (#1C1814). Background is solid bone (#F0E6D0). These are the only colors.

Constraints: Do not render a realistic telescope, rifle scope, or compass rose. Do not add cardinal direction letters (N/S/E/W). Do not gradient within strata. Do not add drop shadows, glow, or 3D. Do not add text or ornament beyond the elements described. Do not use green, blue, or purple. The crosshair sits above the strata; do not overlap them.
```

---

## After you generate

The 2026 model is very responsive to **iterative edits** in the same chat. Once you have a generated mark you like 70-80%, refine with single-instruction commands rather than re-prompting:

- *"Make the offset 50% larger."*
- *"Swap the colors — amber should be the back, oxblood should be the front."*
- *"Reduce the gap between bands by half."*
- *"Make the lines 30% thicker."*
- *"Try the same composition rotated 90 degrees."*
- *"Generate four variants of this same prompt with the offset at 15°, 30°, 45°, 60°."*

**To compare across paths:** once you have one finalist per path (B, C, E), put them side by side and ask ChatGPT for an opinion grounded in concrete criteria:

```
Compare these three marks as candidates for a YouTube channel logo in the analytical-geopolitics niche.
For each, assess: (1) legibility at 32px, (2) brand register match (mid-century editorial vs.
consumer-tech vs. crypto), (3) distinctiveness among other YouTube thumbnails. End with a single
recommendation and a one-paragraph justification.
```

The model's reasoning step makes it surprisingly useful as a *first-pass critic* before you commit to vector polish.

## Sources

- [OpenAI Cookbook — GPT Image Generation Models Prompting Guide](https://developers.openai.com/cookbook/examples/multimodal/image-gen-models-prompting-guide)
- [Atlabs — Ultimate GPT Image 2 Prompting Guide 2026](https://www.atlabs.ai/blog/the-ultimate-gpt-image-2-prompting-guide-how-to-use-openai%E2%80%99s-best-image-model-2026)
- [Phygital — ChatGPT Image 2.0 Guide After April 2026 Update](https://phygital.plus/blog/chatgpt-image-2-0-guide-april-2026-update/)
- [DataCamp — ChatGPT Images 2.0 Guide](https://www.datacamp.com/blog/chatgpt-images-2-0)
- [OpenAI — Introducing ChatGPT Images 2.0](https://openai.com/index/introducing-chatgpt-images-2-0/)
- [BuildFastWithAI — ChatGPT Images 2.0 Developer Breakdown 2026](https://www.buildfastwithai.com/blogs/chatgpt-images-2-0-gpt-image-2-2026)
