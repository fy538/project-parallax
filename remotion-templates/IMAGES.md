# Image & Photo Processing Guide

> Practical reference for sourcing, treating, and compositing images across
> the Parallax brand. Companion to BRAND.md § Image Treatment Pipeline.
>
> Rule zero: **every image passes through the pipeline.** No exceptions.
> The pipeline IS the brand. A raw, full-color photo in a composition breaks
> the entire visual system.
>
> Last updated: May 5, 2026 (Direction A duotone migration)

---

## 1. Sourcing

### Where to find images

| Source type | Where to look | Notes |
|-------------|--------------|-------|
| Archival photography | Library of Congress, Wikimedia Commons, National Archives, Imperial War Museum, Bundesarchiv | Prefer high-res scans. Public domain or CC0 where possible. |
| Satellite / aerial | Google Earth (screenshot → fair use for commentary), Sentinel Hub, NASA Worldview, Planet Labs (free tier) | Great for fabs, ports, military bases, geographic features. |
| Technical photography | Wikimedia (chip dies, lab shots), manufacturer press kits (TSMC, ASML), IEEE/ACM paper figures | Chip dies and factory interiors are surprisingly photogenic after duotone. |
| Documentary / street | Unsplash, Pexels (CC0), Flickr (CC-licensed), AFP/Reuters via editorial license | For texture — street scenes, infrastructure, daily life. |
| Portraits / faces | Wikimedia (public figures), official government/corporate headshots, press pools | Always check licensing. Process through the same pipeline — no special treatment. |
| Maps / diagrams | Natural Earth (vector), OpenStreetMap exports, our own Remotion map renders | Can be screenshotted from our own compositions and re-treated as texture. |
| AI-generated | Midjourney, DALL-E, Flux — **engraved/etched style only** | Prompt for "copperplate engraving," "woodcut illustration," "technical etching." Never photorealistic AI. |

### Sourcing decision tree

```
Is the subject a real place, person, or event?
├─ YES → Find a real photograph or archival image
│        └─ Can't find one? → Commission an engraved-style AI generation
│           (label as "illustration" in metadata)
└─ NO (abstract concept, metaphor, structural pattern)
   └─ Use an AI-generated engraved illustration
      or a symbolic photograph (architecture, machinery, landscapes)
```

### What to avoid

- **Photorealistic AI generations.** They date fast, trigger uncanny valley, and undermine the channel's credibility as an analytical source. If viewers suspect a fake photo, trust erodes.
- **Stock photography.** The handshake-over-globe genre. Instant credibility loss. If it looks like a PowerPoint template, don't use it.
- **Logos and brand marks** of companies/governments as primary visual elements. Use them only as small reference elements within a larger composition, never as hero images.
- **Screenshots of news articles or social media posts** as hero images. Fine as small inset evidence panels, but never full-bleed.
- **Memes or internet-culture images.** They fight the analytical tone.

---

## 2. The Treatment Pipeline

Four steps, always in order. The goal: normalize any source into the brand's tonal language so a 1944 war photo, a 2024 satellite image, and an AI-generated engraving all look like they belong in the same briefing.

### Step 1: Desaturate

Strip the image's native color identity.

| Parameter | Value |
|-----------|-------|
| Target saturation | 20-30% of original |
| Method | HSL saturation slider, or `saturation(0.25)` CSS filter |
| Exception | Already-grayscale archival photos — skip to Step 2 |

The image should read as a warm grayscale, not a vivid color photograph. You're removing the image's "era" and "camera" so it enters the brand-neutral zone.

**Photoshop/Affinity:** Hue/Saturation adjustment layer → Saturation: -75  
**CSS (Remotion):** `filter: saturate(0.25)`  
**FFmpeg:** `-vf "eq=saturation=0.25"`  
**ImageMagick:** `-modulate 100,25,100`

### Step 2: Duotone Remap

Map the desaturated luminance values to a brand color ramp. This is where the image acquires the Meridian identity.

#### Ramp selection

| Ramp | Shadows → Midtones → Highlights | When to use |
|------|----------------------------------|-------------|
| **Standard** | `ink` #1C1814 → `umber` #8B7355 → `gold` #C4A747 | Default for most content. Neutral analysis, maps, infrastructure, history. |
| **Conflict** | `ink` #1C1814 → #7A2E1A → `china` #A64D46 | China-related content, military conflict, trade wars, sanctions, adversarial framing. |
| **Editorial** | `taupe` #B8A189 → `bone` #F0E6D0 → `paper` #F5F0E8 | Light-mode compositions only. Dossier aesthetic — bleached, archival, paper-like. |

> Source of truth: `tools/brand-treatment/palette.json` (the `duotone` block). Both `treat.py` and `recraft.py` read from there via `palette_loader.py` — the table above mirrors that file.

#### Ramp decision tree

```
Is this a light-mode composition (title card, social, editorial)?
├─ YES → Use Editorial ramp
└─ NO (dark-mode, in-video)
   ├─ Does the content involve conflict, China, military, or adversarial dynamics?
   │  ├─ YES → Use Conflict ramp
   │  └─ NO → Use Standard ramp
   └─ Mixed content (e.g., US-China comparison)?
      └─ Standard ramp for the overall image;
         use semantic colors (us/china) on overlaid data, not the image itself
```

#### How to apply duotone

**Photoshop:**
1. Image → Mode → Grayscale → Duotone
2. Set Ink 1 = shadow color, Ink 2 = highlight color
3. Adjust curve for midtone placement

**Affinity Photo:**
1. Layer → New Adjustment Layer → Gradient Map
2. Set gradient: shadow hex (left) → midtone hex (center) → highlight hex (right)

**CSS (Remotion — runtime compositing):**
```css
/* Approximate duotone via SVG filter or layered blend modes */
.duotone-standard {
  filter: saturate(0.25) sepia(1) hue-rotate(5deg) saturate(1.2);
  /* Fine-tune hue-rotate to hit amber target */
}
```

**Better Remotion approach — SVG feColorMatrix:**
```tsx
<svg width="0" height="0">
  <filter id="duotone-standard">
    <feColorMatrix type="saturate" values="0.25" />
    <feComponentTransfer>
      <feFuncR type="table" values="0.102 0.545 0.898" />
      <feFuncG type="table" values="0.102 0.369 0.647" />
      <feFuncB type="table" values="0.180 0.169 0.267" />
    </feComponentTransfer>
  </filter>
</svg>

<img style={{ filter: 'url(#duotone-standard)' }} src={...} />
```

The `feFuncR/G/B table` values map luminance stops to the RGB channels of your shadow → midtone → highlight colors. Calculate them by converting each hex to 0-1 RGB values:
- ink #1C1814 → R:0.110 G:0.094 B:0.078
- umber #8B7355 → R:0.545 G:0.451 B:0.333
- gold #C4A747 → R:0.769 G:0.655 B:0.278

**Pre-baked approach (recommended for thumbnails/social):**
Process images in Photoshop/Affinity before importing. Faster, more control, no runtime cost.

**Runtime approach (for dynamic compositions):**
Use the SVG filter method above. Good for images that change per episode (maps, satellite views) where pre-baking every variant isn't practical.

### Step 3: Grain & Vignette

Add analog texture. This is what makes images feel "captured, not generated" — critical for maintaining credibility when some images are AI-generated.

| Effect | Parameters |
|--------|-----------|
| **Film grain** | Monochromatic noise, 8-12% opacity, overlay blend mode. Fine grain (not blocky). |
| **Vignette** | Radial gradient: transparent center → 15-20% black at edges. Soft falloff starting at ~60% from center. |

**Photoshop:**
- Grain: New layer → Fill 50% gray → Filter → Noise → Add Noise (Gaussian, Monochromatic, 8-12%) → Blend mode: Overlay → Opacity: 100% (the noise amount already controls intensity)
- Vignette: Filter → Lens Correction → Vignette Amount: -25 to -35

**CSS (Remotion):**
```css
/* Grain overlay — use a pre-generated noise texture PNG */
.grain-overlay {
  background-image: url('/assets/noise-512.png');
  background-repeat: repeat;
  mix-blend-mode: overlay;
  opacity: 0.1;
  pointer-events: none;
}

/* Vignette */
.vignette {
  background: radial-gradient(
    ellipse at center,
    transparent 50%,
    rgba(0, 0, 0, 0.18) 100%
  );
  pointer-events: none;
}
```

**Tip:** Create a single `noise-512.png` tile (512×512, monochromatic Gaussian noise on transparent) and reuse it across all compositions. Tile it with `background-repeat: repeat`.

### Step 4: Composite

Place the treated image into the layout. Three placement modes:

#### Mode A: Background (default)

Full-bleed behind all content. The image becomes atmospheric texture.

| Parameter | Value |
|-----------|-------|
| Opacity | 25-40% |
| Position | `object-fit: cover`, centered |
| Z-index | 0 (background layer) |
| Overlay | Radial gradient vignette on top |

Use when: the image provides context but isn't the subject. A satellite view behind a data chart. A cityscape behind a title card. The most common mode.

#### Mode B: Inset Panel

Contained within a bordered rectangle inside the layout grid.

| Parameter | Value |
|-----------|-------|
| Opacity | 60-80% |
| Border | 1px `amber` at 30% (dark) or 1px `bg.light.border` (light) |
| Corner radius | 0px (sharp corners — briefing aesthetic) |
| Shadow | `0 2px 12px rgba(0,0,0,0.25)` |
| Max width | 40-60% of content area |

Use when: the image needs to be seen clearly — a portrait, a specific location, a document scan. The panel is a "piece of evidence" pinned to the briefing board.

#### Mode C: Antipode Split

Image fills one half of a vertical split, with the ∴ divider in the center.

| Parameter | Value |
|-----------|-------|
| Opacity | 40-50% per side |
| Split | Vertical center line with 2-4px gap |
| Divider | ∴ symbol centered in the gap, `amber` (dark) or `oxblood` (light) |

Use when: comparing two things visually — historical event on one side, modern parallel on the other. Both images pass through the pipeline but can use different duotone ramps (e.g., Editorial left for the historical image, Standard right for the modern one).

---

## 3. Template-Specific Guidance

How images integrate with each Remotion template type:

### TitleTransition

Primary image use case. The title card IS the thumbnail composition.

- **Default:** Mode A (background) with title text overlay
- **Portrait episodes:** Mode B (inset panel, right third) + title text left
- **Comparison episodes:** Mode C (antipode split) + title text centered over ∴ divider
- Image should be pre-baked (not runtime filtered) for maximum quality in thumbnails

### KineticTypography

Usually no image. The text IS the visual. But when quoting a historical figure:

- Mode B (inset panel, small, corner position) showing the person being quoted
- Opacity reduced further to 40-50% so it doesn't compete with the kinetic text
- Duotone ramp matches the quote's emotional tone (Standard for neutral, Conflict for adversarial)

### DataChart

Background texture only.

- Mode A at low opacity (25-30%)
- Choose an image that contextualizes the data: a port for trade data, a fab for chip data, a map for geographic data
- The chart should always dominate — the image is subliminal context

### FrameworkDiagram

Rarely used. The diagram IS the visual.

- If used, Mode A at very low opacity (20-25%) as atmospheric texture
- Only for frameworks about concrete subjects (military strategy → battlefield photo, trade policy → port photo)
- Abstract frameworks (game theory, systems thinking) should not have background images

### TimelineComparison

Each era marker can have a small inset image.

- Mode B (inset panel) at ~120×80px per era marker
- All era images use the same duotone ramp for visual consistency across the timeline
- Images should be era-appropriate (archival for historical periods, satellite/modern for recent)

### RouteAnimation

Maps are the primary visual. Additional images are rare.

- If used, Mode A behind the map layer at very low opacity (15-20%)
- Or Mode B as a destination/origin callout panel (appears when the route reaches that node)

### ChoroplethMap

The map itself is the image. No additional photos typically needed.

- If overlaying a photo (e.g., disputed territory satellite view), use Mode B within the map area
- Keep the choropleth fills visible — don't obscure data with photos

---

## 4. Faces & Portraits

Faces are allowed. They pass through the exact same pipeline. The key distinction is framing: the face is **evidence in the briefing**, not a personality thumbnail.

### When to use faces

- The episode is specifically about a person's role (Morris Chang and TSMC, Xi Jinping's consolidation, etc.)
- A historical figure is being quoted or compared to a modern counterpart
- A key decision-maker needs to be identified in a geopolitical context

### When NOT to use faces

- As the primary thumbnail hook (personality-led framing fights the analytical brand)
- Casual decoration (a face just because the topic mentions a country — use a map instead)
- Multiple faces competing for attention (one face per composition maximum, unless doing an Antipode comparison)

### Face composition rules

- **Never full-frame.** Faces should occupy 30-50% of the composition, with data/text occupying the rest.
- **Crosshair reticle on the face** for Meridian-variant compositions. The reticle says "subject under analysis."
- **Name + title in IBM Plex Mono `meta` size** below or beside the face. Never assume the viewer knows who this is.
- **Same pipeline, no exceptions.** Desaturate → duotone → grain → composite. The face should look like a dossier photo, not a magazine cover.

### Portrait processing tips

- **Crop tighter than you think.** Head and shoulders, not waist-up. The duotone treatment loses detail at small sizes, so crop into the face.
- **High-contrast sources work best.** Strong directional lighting → dramatic duotone. Flat office lighting → muddy duotone. If the source is flat, boost contrast +20-30% before Step 1.
- **Side-lit or three-quarter angle preferred.** Full frontal + flash → flat, passport-photo feel. Angled lighting gives the duotone ramp more dynamic range.

---

## 5. AI-Generated Images

AI generation is a tool in the pipeline, not a shortcut around it. Generated images pass through the same 4-step treatment.

### Approved styles

- **Copperplate engraving** — Fine crosshatching, high detail, works beautifully with duotone
- **Woodcut illustration** — Bold, graphic, historical feel
- **Technical illustration** — Patent-drawing style, isometric, labeled
- **Etched/intaglio** — Maps, architectural views, scientific diagrams

### Prompt patterns

For Midjourney/DALL-E/Flux, append style modifiers:

```
{subject description}, copperplate engraving style, fine crosshatching,
high detail, black and white, technical illustration --ar 16:9 --style raw
```

```
{subject description}, woodcut illustration, bold lines, historical print,
monochrome, no color --ar 16:9
```

The `--style raw` flag (Midjourney) reduces the model's tendency to add dramatic lighting and color grading — we'll add our own via the pipeline.

### Why no photorealistic AI

Three reasons:

1. **Credibility.** The channel's value proposition is rigorous analysis. Fake-looking photos undermine trust. Even good photorealistic AI has tells that erode confidence.
2. **Dating.** AI generation styles evolve fast. What looks cutting-edge today looks obviously-AI in 18 months. Engraved styles are timeless because they reference a 400-year-old visual tradition.
3. **Pipeline compatibility.** Engraved/etched images are already high-contrast grayscale, so they take duotone beautifully. Photorealistic AI has complex color that fights the remap.

### Disclosure

When an AI-generated image is used, note it in the video's description or end credits: "Some illustrations generated with AI assistance." This is both ethical and increasingly a platform requirement.

---

## 6. Batch Processing Workflow

For episodes with multiple images (common — a 15-minute video might use 8-12 images across compositions):

### Pre-production (recommended)

1. **Collect all source images** into `assets/ep{NN}/raw/`
2. **Create a Photoshop/Affinity action** for each duotone ramp (Standard, Conflict, Editorial)
3. **Batch process:** Run the action on all images for that episode
4. **Export** treated images to `assets/ep{NN}/treated/` as PNG (lossless) or high-quality JPEG (95%)
5. **Name convention:** `{descriptive-slug}-{ramp}.png` — e.g., `tsmc-fab18-satellite-standard.png`, `morris-chang-portrait-standard.png`

### Photoshop Action Recipe (Standard Ramp)

```
1. Image → Adjustments → Hue/Saturation → Saturation: -75
2. Image → Adjustments → Gradient Map →
   Left stop: #1C1814 (ink)
   Center stop: #8B7355 (umber) at 50%
   Right stop: #C4A747 (gold)
3. New Layer → Fill 50% Gray → Filter → Noise → Add Noise: 10%, Gaussian, Mono
   → Blend: Overlay
4. New Layer → Gradient: Radial, Foreground to Transparent, Black
   → Scale 150%, Opacity 18%
5. Flatten → Export
```

### Conflict Ramp — change step 2 to:
```
Left: #1C1814 | Center: #7A2E1A at 50% | Right: #A64D46
```

### Editorial Ramp — change step 2 to:
```
Left: #B8A189 | Center: #F0E6D0 at 50% | Right: #F5F0E8
```

---

## 7. Quality Checklist

Before any treated image enters a composition:

- [ ] **Pipeline complete?** All 4 steps applied (desaturate → duotone → grain → vignette)
- [ ] **Correct ramp?** Standard/Conflict/Editorial matches content and mode
- [ ] **No native color bleeding through?** Check for any original hue poking through the duotone
- [ ] **Grain visible at export resolution?** Zoom to 100% — grain should be subtle texture, not blocky noise
- [ ] **Vignette appropriate?** Edges darkened, center content visible, no harsh falloff
- [ ] **Composition mode correct?** Background (25-40%), Inset (60-80%), or Antipode (40-50%)
- [ ] **Text readable over image?** If Mode A, verify title/data text has sufficient contrast
- [ ] **Source attribution recorded?** Image source noted in episode production doc for credits
- [ ] **License cleared?** Public domain, CC0, CC-BY (credited), editorial use, or AI-generated
- [ ] **Face rule followed?** If a face is present: not dominant, pipeline-treated, labeled with name/title

---

## 8. File Organization

```
assets/
├── shared/                    # Reusable across episodes
│   ├── noise-512.png          # Grain overlay tile
│   ├── vignette-1920x1080.png # Pre-rendered vignette overlay
│   └── brand/                 # Brand mark, wordmark, reticle SVGs
├── silicon-trap/
│   ├── raw/                   # Original source images (untouched)
│   ├── treated/               # Pipeline-processed images (ready to use)
│   └── sources.md             # Image credits and licenses
├── ep02/
│   ├── raw/
│   ├── treated/
│   └── sources.md
└── ...
```

### sources.md template

```markdown
# EP{NN} Image Sources

| Filename | Source | License | Notes |
|----------|--------|---------|-------|
| tsmc-fab18-satellite-standard.png | Google Earth | Fair use (commentary) | Tainan Science Park, captured 2025-03 |
| morris-chang-portrait-standard.png | Wikimedia Commons | CC BY-SA 4.0 | Photo by [photographer], 2018 |
| silk-road-engraving-standard.png | AI-generated (Midjourney) | N/A | Prompt: "ancient silk road caravan..." |
```
