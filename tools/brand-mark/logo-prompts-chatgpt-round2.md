# Parallax Logo — Round 2 (Geometric Minimalism)

> Supersedes `logo-prompts-chatgpt.md` for forward iteration. Round 1 produced three usable candidates (B1 triangles, B3 squares, E1 strata) and confirmed: **two-color max, simple silhouette, Bauhaus precision wins.** Round 2 stays in that lane.

## What Round 1 taught us

| Survivor | What worked | What to keep |
|---|---|---|
| **B1 Triangles** | The back triangle peeking out behind the front created a clean "parallax peek." Two solid colors, instantly readable. | Single dominant silhouette + small offset reveal |
| **B3 Squares** | The overlap created an emergent inner square — math doing the visual work. Both squares same accent, overlap as dark hit. | The "two same-color forms whose overlap creates the accent" mechanic |
| **E1 Strata** | Color rhythm (ink → walnut → amber → walnut → ink) gave bilateral symmetry around the accent band. | Symmetric stack, one accent band as focal point |

| Killed | Why |
|---|---|
| **All P variants (C1–C5)** | Typography is hard for image-gen models; letterforms drift into generic monogram territory. Drop the typographic path. If we want a typographic mark later, it's a Figma job. |
| **Multi-color strata (>2 accent colors)** | The 4-color cascades (E2, E3) felt busy. Stay at 2 colors + bone background. |
| **Anything with text or figurative reference** | Confirmed: the marks that worked were pure geometry. No telescopes, no eyes, no terrain. |

## Constraints locked in for Round 2

- **Max 2 colors** on the bone background (`#F0E6D0`). One accent + optional second accent. No walnut, no umber, no mid-tones — those muddy the mark.
- **Strong silhouette test:** the mark must read as one shape at 32×32 px, not five elements.
- **Bauhaus geometric only.** No typography, no figurative reference, no decorative outline.
- **One concept per mark.** Don't try to encode "parallax + crosshair + strata" in one image — the survivors won by doing one thing well.

## Brand primer (paste once before first prompt, same as Round 1)

```
I'm designing a logo mark for Parallax, an editorial geopolitics YouTube channel. The brand register is mid-century corporate-modernist — Paul Rand for IBM, Massimo Vignelli, Josef Albers "Homage to the Square," Bauhaus geometric precision. Editorial publication-mark energy. Restrict to exactly two flat colors on a bone background, no third color, no gradients, no drop shadows, no 3D effects, no outlines, no text, no figurative reference. Each prompt produces one 1024×1024 square image.
```

---

## Round 2 — 10 fresh prompts

### R2-T1 — Bisected pyramid (vertical split with offset)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: A single equilateral triangle, point up, occupying the central 55% of the frame. The triangle has been cleanly bisected along its vertical axis of symmetry. The left half stays in position. The right half is offset 6% to the right and 3% downward from the original position, creating a clean parallax-shift gap between the two halves. The two halves do not overlap.

Style: Bauhaus geometric precision, Josef Albers / Paul Rand register. Flat vector illustration. The mark reads as a single triangle that has split in two and the right half has stepped sideways.

Color: The left half is solid amber gold (#E5A544). The right half is solid oxblood (#6B1D1D). Background is solid bone (#F0E6D0). Exactly these three colors and nothing else.

Constraints: Do not overlap the two halves. Do not add gradients, drop shadows, glow, 3D, outlines, or ornament. Do not add text or letters. Do not use green, blue, purple, walnut, or umber.
```

### R2-T2 — Nested triangles (concentric)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: Three concentric equilateral triangles, all pointing upward, sharing the same center point. The outer triangle occupies 60% of the frame. The middle triangle is 65% the size of the outer. The inner triangle is 35% the size of the outer. Each successive triangle is centered inside the previous one. Generous negative space around the outer triangle.

Style: Josef Albers "Homage to the Square" register applied to triangles. Bauhaus geometric precision, flat vector illustration, mid-century editorial mark.

Color: The outer triangle is solid amber gold (#E5A544). The middle is solid bone (#F0E6D0) — same as background, so it reads as negative space cut out of the amber. The inner triangle is solid oxblood (#6B1D1D). Background is solid bone (#F0E6D0). The mark reads as: outer amber ring, middle bone "moat," inner oxblood core.

Constraints: All three triangles must be perfectly concentric and perfectly aligned (no rotation, no offset). Do not add gradients, drop shadows, glow, 3D, outlines, or ornament. Do not use green, blue, purple, walnut, or umber.
```

### R2-T3 — Opposing triangles (point-to-point offset)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: Two equilateral triangles of identical size. The first triangle points upward and sits in the upper-left of the central area. The second triangle points downward and sits in the lower-right of the central area. Their points are nearly touching at the center but offset by a small gap — the second triangle is shifted 8% to the right of being a perfect mirror of the first. The two triangles together occupy the central 60% of the frame.

Style: Bauhaus geometric precision, flat vector illustration, mid-century editorial register. Reads as two viewing positions converging on a central point but slightly misaligned — encoding the parallax concept literally.

Color: The upward-pointing triangle is solid amber gold (#E5A544). The downward-pointing triangle is solid oxblood (#6B1D1D). Background is solid bone (#F0E6D0). Exactly these three colors.

Constraints: The two triangles must not overlap. Do not add gradients, drop shadows, glow, 3D, outlines, or connecting lines between the triangles. Do not add text or ornament. Do not use green, blue, purple, walnut, or umber.
```

### R2-S1 — Albers nested squares

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: Three concentric axis-aligned squares, all sharing the same exact center. The outer square occupies 58% of the frame. The middle square is 65% the size of the outer. The inner square is 35% the size of the outer. Each square is perfectly centered inside the previous. Generous negative space around the outer square. Direct reference to Josef Albers' "Homage to the Square" series.

Style: Bauhaus geometric precision, Albers homage, flat vector illustration, mid-century editorial mark register.

Color: The outer square is solid amber gold (#E5A544). The middle square is solid bone (#F0E6D0) — same as background, so it appears as a clean "moat" of negative space. The inner square is solid oxblood (#6B1D1D). Background is solid bone (#F0E6D0).

Constraints: All squares perfectly concentric, all axis-aligned (no rotation). No gradients, drop shadows, glow, 3D, outlines, or ornament. No text. No green, blue, purple, walnut, umber.
```

### R2-S2 — Diagonally bisected square (offset halves)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: A single axis-aligned square occupying the central 55% of the frame. The square has been cleanly bisected along its diagonal from upper-left corner to lower-right corner. The upper-right triangular half stays in position. The lower-left triangular half is offset 7% to the left and 7% downward, creating a clean parallax-shift gap along the diagonal between the two halves.

Style: Bauhaus geometric precision, flat vector illustration. The mark reads as a square split along its diagonal where one half has stepped diagonally away.

Color: The upper-right half is solid amber gold (#E5A544). The lower-left half is solid oxblood (#6B1D1D). Background is solid bone (#F0E6D0). Exactly these three colors.

Constraints: The two halves do not overlap. Do not add gradients, drop shadows, glow, 3D, outlines, or ornament. Do not add text. Do not use green, blue, purple, walnut, umber.
```

### R2-S3 — Square plus diamond (rotation-offset pair)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: Two identical squares of equal size, both occupying the central area of the frame, sharing the same center point. The first square is axis-aligned (sides parallel to the frame edges). The second square is rotated 45 degrees (so it appears as a diamond, with corners pointing up/down/left/right). The two shapes overlap, creating a complex star-like outline.

Style: Bauhaus geometric precision, the kind of mark that appears in Paul Rand's 1950s identity work. Flat vector illustration, mid-century editorial register.

Color: The axis-aligned square is solid amber gold (#E5A544). The rotated diamond is solid oxblood (#6B1D1D). Where they overlap (the central octagonal region), the color is solid ink (#1C1814). Background is solid bone (#F0E6D0). Exactly four colors.

Constraints: Both shapes share the exact same center point. Do not add gradients, drop shadows, glow, 3D, outlines, or ornament. Do not add text. Do not use green, blue, purple, walnut, umber.
```

### R2-B1 — Three bars, middle accented and offset

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: Three horizontal rectangular bands of equal width and equal height, stacked vertically with a consistent small gap between bands (the gap is 12% of band height). The whole stack occupies the central 45% of the frame, centered horizontally and vertically. The top and bottom bands are perfectly axis-aligned. The middle band is offset to the right by 10% of band width.

Style: Bauhaus geometric precision, mid-century editorial register, flat vector illustration. Simpler than the Round 1 strata mark.

Color: The top and bottom bands are solid ink (#1C1814). The middle (offset) band is solid amber gold (#E5A544). Background is solid bone (#F0E6D0). Exactly three colors.

Constraints: Do not add gradients, drop shadows, glow, 3D, outlines, or ornament. Do not round the corners — every band is a perfect rectangle. Do not add text. Do not use green, blue, purple, walnut, umber. The middle band's offset is the entire visual concept — make sure it is clearly visible.
```

### R2-B2 — Seven bars, single accent, no offsets

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: Seven horizontal rectangular bands of equal width and equal height, stacked vertically with a tiny consistent gap between bands (gap is 6% of band height). The whole stack occupies the central 50% of the frame, centered horizontally and vertically. All seven bands are perfectly axis-aligned — no offsets, no rotations. The center band (the fourth from either end) is the visual focal point through color contrast.

Style: Bauhaus geometric precision, the simplest possible "ordered layers" mark, mid-century editorial register, flat vector illustration. Reads as a stack of pages, a barcode of historical eras, or a Color Field study.

Color: Six of the seven bands are solid ink (#1C1814). The center (fourth) band is solid amber gold (#E5A544). Background is solid bone (#F0E6D0). Exactly three colors.

Constraints: All bands perfectly aligned, no offsets, no rotations. Do not add gradients, drop shadows, glow, 3D, outlines, or ornament. Do not round the corners. Do not add text. Do not use green, blue, purple, walnut, umber.
```

### R2-N1 — Bisected circle with shifted half

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: A single solid circle of diameter equal to 55% of the frame width, centered. The circle has been cleanly bisected along its vertical diameter. The left half-circle stays in position. The right half-circle is offset 8% to the right, creating a clean parallax-shift gap of negative space between the two halves.

Style: Bauhaus geometric precision, flat vector illustration, mid-century editorial register. The mark reads as a circle split along its vertical axis where the right half has stepped sideways. Visual cousin to the bisected pyramid and bisected square.

Color: The left half-circle is solid amber gold (#E5A544). The right half-circle is solid oxblood (#6B1D1D). Background is solid bone (#F0E6D0). Exactly three colors.

Constraints: The two halves do not overlap. The bisection cut is perfectly vertical and perfectly straight. Do not add gradients, drop shadows, glow, 3D, outlines, or ornament. Do not add text or letters. Do not use green, blue, purple, walnut, umber.
```

### R2-N2 — Two columns (paired vertical bars)

```
Draw a logo mark, square 1:1 aspect ratio.

Composition: Two identical vertical rectangular bars of equal width and equal height, side by side, centered horizontally in the frame with a small gap between them (the gap is 20% of one bar's width). The two bars together occupy the central 35% of the frame width and 60% of the frame height. The bars are perfectly axis-aligned. The right bar is offset 4% downward from the left bar — a subtle vertical parallax shift between the two viewpoints.

Style: Bauhaus geometric precision, the simplest possible "two columns" mark, mid-century editorial register, flat vector illustration. Reads as a pair of columns or pillars representing two viewing positions.

Color: The left bar is solid amber gold (#E5A544). The right bar is solid oxblood (#6B1D1D). Background is solid bone (#F0E6D0). Exactly three colors.

Constraints: Bars must be perfectly vertical (no rotation, no taper). Do not add gradients, drop shadows, glow, 3D, outlines, capitals, bases, or ornament. Do not reference architectural columns or Doric/Ionic detail. Do not add text. Do not use green, blue, purple, walnut, umber.
```

---

## Iteration tactics for this round

### When a generation is 70% right, edit don't restart

GPT Image 2 is excellent at single-instruction edits within the same chat. Don't re-prompt — refine:

- *"Make the offset 50% larger so the parallax gap is more obvious."*
- *"Try the same composition with amber as the back element instead of oxblood."*
- *"Reduce the inner square by 20% — it's reading too heavy."*
- *"Increase the gap between bands so each band feels more distinct."*
- *"Make the triangle 15% larger relative to the frame — it's too small in negative space."*

### When you find a strong candidate, batch variants

```
Generate four variants of this same composition with the offset distance varying:
2%, 5%, 10%, 15%. Lay them out in a 2×2 grid in one image.
```

The 2×2 grid output is a quick way to find the precise offset that lands without 4 separate generations.

### When you have 3-4 candidates to compare

Paste them back in one message:

```
Compare these four marks as logo candidates for an editorial geopolitics YouTube channel.
For each: (1) does it read at 32px favicon size, (2) does it look like a publication brand
or like a generic tech-startup mark, (3) is the parallax-shift concept legible without
explanation. End with one ranked recommendation.
```

The model's reasoning step makes this surprisingly useful as a first-pass critic.

---

## What to look for in this round

The survivors from Round 1 won because they made the eye do one specific piece of math:

- **B1 (triangles):** "There are two triangles, the back one is barely visible."
- **B3 (squares):** "Two squares overlap and the overlap is a third color."
- **E1 (strata):** "Five bands, one is the accent."

For Round 2, ask: **what is the single piece of visual math this mark asks the viewer to do?** If you can name it in one sentence, it's a strong candidate. If you can't, the mark is doing too much.

The shortlist should be **2-3 finalists**. Test each:

1. Scale to 96×96 in your editor or terminal (`sips -z 96 96 mark.png`) — does it still read?
2. Convert to single-color (just amber on bone, no oxblood) — does it still read?
3. Place mentally next to a real YouTube thumbnail — does it look like a publication mark, or does it look like an exercise?

Once you have a finalist, the next step is **Figma cleanup**: redraw as true vector at integer-pixel sizes, optical-correct the geometric proportions, export as SVG + 1024px PNG + 512px PNG + 32px favicon. AI gen gets us to "this is the concept"; Figma gets us to "this is shippable."
