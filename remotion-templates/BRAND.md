# Brand Design System — Meridian

> Canonical source of truth for all visual assets across the channel.
> Every template, thumbnail, title card, and social graphic pulls from this file.
>
> Direction: **Meridian** — a hybrid of Cartograph (data/maps), Dialectic (thesis/antithesis),
> and Tectonic (historical layering). Two registers: **Dark** (cinematic, in-video) and
> **Light** (editorial, title cards, social). Both pass through the same design system.
>
> Last updated: April 26, 2026

---

## Identity

- **Channel name:** Parallax
- **Brand mark:** ∴ (therefore) — the channel's thesis in a single symbol. Used as a visual divider, brand stamp, and recurring motif across both modes.
- **Tagline:** *The present, examined through the past.*
- **Tone:** Intellectually rigorous, narratively engaging. Smart friend explaining over drinks — not a lecture, not a rant. Analytical, not polemical.
- **Visual register:** Two modes — **Light** (briefing folder on a wooden desk — primary, used for all in-video content) and **Dark** (candlelit war room — secondary, available for occasional dramatic compositions). Both draw from the same palette, type system, and compositional rules. The mode sets the background plane; everything else is shared.

### Episode-Type Variants

The Meridian system has three compositional variants, selected by episode type:

| Variant | Lead DNA | When to use | Signature element |
|---------|----------|-------------|-------------------|
| **Meridian** (default) | Cartograph | Standard episodes — maps, data, supply chains | Crosshair reticle, coordinate metadata |
| **Antipode** | Dialectic | Comparison-heavy episodes — then vs. now, A vs. B | Vertical split at ∴ divider, dual dates |
| **Stratum** | Tectonic | Deep historical episodes — tracing a pattern across eras | Horizontal strata sidebar, era labels |

All three variants use the same palette, type pair, and image pipeline. They differ only in layout structure and signature graphic element.

---

## Color Palette

### Shared Palette

These colors work across both dark and light modes. They are the brand's DNA.

| Token | Hex | Role |
|-------|-----|------|
| `ink` | `#1C1814` | Deepest dark — shadows, dark mode bg base (warm umber) |
| `midnight` | `#2A2520` | Dark mode elevated surfaces (warm walnut) |
| `amber` | `#E5A544` | Primary accent — crosshairs, labels, highlights |
| `rust` | `#C23B22` | Secondary accent — conflict, China, urgency |
| `bone` | `#F0E6D0` | Primary text on dark, light mode bg base |
| `paper` | `#F5F0E8` | Light mode surface, card backgrounds |
| `folder` | `#C8B89A` | Light mode secondary surface, muted elements |
| `oxblood` | `#6B1D1D` | Light mode accent, stamps, emphasis |
| `olive` | `#4A5A24` | Tertiary accent — used sparingly for contrast |
| `bronze` | `#8B5E2B` | Midtone in duotone ramps, warm neutral |

### Semantic Colors (Geopolitical)

Unchanged from prior system. These override mode colors when encoding geopolitical meaning.

| Token | Hex | Meaning |
|-------|-----|---------|
| `us` | `#3266AD` | US / Western-aligned actions |
| `china` | `#C23B22` | China / Eastern-aligned actions (= `rust`) |
| `neutral` | `#888780` | Non-aligned, structural, historical |
| `highlight` | `#F5A623` | Emphasis, contested space (close to `amber`) |
| `success` | `#5DAA68` | Positive trend, growth |
| `danger` | `#D64545` | Negative trend, conflict, failure |

### Sequential Ramps (5-stop, light → dark)

| Ramp | Stops |
|------|-------|
| `rampBlue` | `#E6F1FB` `#85B7EB` `#378ADD` `#185FA5` `#042C53` |
| `rampRed` | `#FCEBEB` `#F09595` `#E24B4A` `#A32D2D` `#501313` |
| `rampAmber` | `#FFF3D6` `#F5D78E` `#E5A544` `#B07A28` `#5C3F12` |
| `rampGray` | `#F1EFE8` `#B4B2A9` `#888780` `#5F5E5A` `#2C2C2A` |

### Dark Mode Palette

| Token | Hex | Use |
|-------|-----|-----|
| `bg.dark.base` | `#12100E` | Deepest background (radial gradient edge) |
| `bg.dark.surface` | `#1C1814` | Primary surface (= `ink`) |
| `bg.dark.elevated` | `#2A2520` | Cards, panels, raised elements |
| `bg.dark.map` | `#1A1612` | Map background (slightly different from surface) |
| `text.dark.primary` | `#F0E6D0` | Primary text (= `bone`) |
| `text.dark.secondary` | `#B8AE9C` | Subtitles, descriptions |
| `text.dark.muted` | `#7A6E60` | Captions, metadata |
| `text.dark.accent` | `#E5A544` | Labels, crosshair text (= `amber`) |

Background treatment: radial gradient from `ink` (center) to `bg.dark.base` (edges), creating a warm vignette that focuses attention center-frame. The brown undertone reads as candlelit/archival rather than cold surveillance.

### Light Mode Palette

| Token | Hex | Use |
|-------|-----|-----|
| `bg.light.base` | `#F5F0E8` | Primary surface (= `paper`) |
| `bg.light.surface` | `#EDE7DB` | Slightly darker surface for depth |
| `bg.light.elevated` | `#FFFFFF` | Cards, containers on paper bg |
| `bg.light.border` | `#D4CAB8` | Subtle borders, divider lines |
| `text.light.primary` | `#1C1814` | Primary text (= `ink`) |
| `text.light.secondary` | `#4A4538` | Subtitles, descriptions |
| `text.light.muted` | `#8A8070` | Captions, metadata, sources |
| `text.light.accent` | `#6B1D1D` | Labels, stamps (= `oxblood`) |

Background treatment: flat or lightly textured `paper` with subtle noise (2-3% opacity). Optional: thin ruled border inset 40px from edges (1px, `bg.light.border`), evoking a briefing document.

---

## Typography

### Type Pair

| Role | Font | Weight | Use |
|------|------|--------|-----|
| **Display** | Space Grotesk | 700 | Episode titles, hero text, section headers |
| **Display** | Space Grotesk | 400-500 | Subtitles, descriptions |
| **Body** | IBM Plex Mono | 400 | Metadata, coordinates, labels, captions |
| **Body** | IBM Plex Mono | 600 | Emphasized data, highlighted metadata |
| **Data** | JetBrains Mono | 400-700 | Chart values, statistics, code-style data |
| **Chinese** | Noto Sans SC | 400-700 | All Chinese text (10-15% larger than equivalent English) |

Space Grotesk is the voice of the channel — geometric, confident, modern but not cold. IBM Plex Mono is the evidence layer — coordinates, dates, classifications, file numbers. JetBrains Mono is reserved for pure data display (chart labels, statistics).

### Type Scale

| Token | Size | Weight | Spacing | Line-height | Use |
|-------|------|--------|---------|-------------|-----|
| `display` | 96px | 700 | 3px | 1.0 | Hero statistics, episode numbers |
| `h1` | 64px | 700 | 2px | 1.1 | Episode titles |
| `h2` | 48px | 700 | 2px | 1.1 | Section titles |
| `h3` | 36px | 600 | 1.5px | 1.2 | Chart titles, subsections |
| `body` | 22px | 400 | 0 | 1.5 | Descriptions, narration text |
| `label` | 18px | 500 | 1px | 1.2 | Data labels, axis labels |
| `caption` | 14px | 400 | 0.5px | 1.4 | Sources, footnotes |
| `meta` | 11px | 400 | 2-3px | 1.0 | Coordinate strings, file codes (IBM Plex Mono) |

### Hierarchy Rules

- **Three tiers per screen maximum.** Primary (what you read first), secondary (context), tertiary (metadata). If you need a fourth, the design is too dense — split it.
- **Weight contrast ≥200 between primary and secondary.** E.g., 700 vs 500, 600 vs 400.
- **Headers ≥36px get letter-spacing ≥1.5px.** Opens up headlines, prevents cramping.
- **Chinese text: Noto Sans SC, 10-15% larger** than equivalent English to maintain optical parity.
- **All-caps text: always IBM Plex Mono or Space Grotesk 600+**, never body weight. All-caps at light weights looks anemic.

---

## Brand Mark & Motifs

### The ∴ Mark

The "therefore" symbol (∴) is the channel's brand mark. It represents the logical conclusion that structural parallels reveal — *this happened before, therefore expect this pattern.*

Usage:
- **Wordmark:** `∴ PARALLAX` in IBM Plex Mono, uppercase, letter-spacing 2.5px
- **Standalone:** The ∴ can appear alone as a section divider, loading indicator, or watermark
- **Antipode variant:** The ∴ sits at the center of the thesis/antithesis split
- **Minimum size:** 12px (the three dots must remain visually distinct)
- **Color:** `amber` on dark mode, `oxblood` on light mode

### Cross-Register Placement (the systematic anchor)

The ∴ mark is the channel's most reliable visual unity anchor. It appears across every register and every visual surface in deliberate, consistent placements. Viewers learn the placement unconsciously; cumulative recognition ties Remotion analytical layer to constructivist illustrations to thumbnails to social crops as one channel.

| Surface | Placement | Style | Source |
|---------|-----------|-------|--------|
| **Remotion templates** | Header strip (lower-left of strip), part of `∴ PARALLAX` wordmark | IBM Plex Mono uppercase, letter-spacing 2.5px, amber/oxblood per mode | HeaderStrip component |
| **Remotion templates (footer)** | Footer strip (right side, after FILED date) | Standalone glyph at meta size, muted color | FooterStrip component |
| **Constructivist illustrations (Register 2/3)** | Lower-right corner, 60-80px from edge | Standalone glyph, brand-treated to match the illustration's palette emphasis | Per AI_VIDEO_PIPELINE.md disclosure rules — also serves as "∴ Visualized" indicator for AI-GEN clips >10s |
| **Thumbnails** | After channel name in title, or as standalone accent in lower-third | Heavy weight, saturated accent color | thumbnail-concept skill |
| **Title cards** | Right-third of frame as part of crosshair tracking element | Inherited from Cartograph DNA | TitleTransition template |
| **Social crops (Shorts)** | Lower-third, scaled to vertical aspect | Standalone glyph at scaled meta size | shorts-adaptation skill |
| **Section dividers** | Centered as transition element | Standalone glyph, fades in over 200-400ms | Transitions library |

**The unity rule:** every shipped visual surface must contain the ∴ mark in at least one of these placements. render-qa validates that the mark is present and rendered correctly. The cumulative effect — viewers seeing ∴ across illustrations, charts, title cards, thumbnails, and Shorts — is what makes the channel feel like a unified publication despite the texture/style variation across registers.

### The Crosshair

Inherited from Cartograph. A reticle (concentric circles + crosshair lines) that frames subjects, maps, and key data. It says "we're looking at this closely."

- **Construction:** Outer circle (stroke only) + inner circle (stroke only) + center dot + vertical/horizontal hairlines extending beyond outer circle
- **Stroke weight:** 0.8px outer, 0.5px inner, 0.4px hairlines
- **Color:** `amber` at 40-60% opacity (dark mode), `oxblood` at 30-40% opacity (light mode)
- **Animation:** Slow tracking (translating to target over 600-800ms), lock-on pulse (inner circle scales 1.0 → 1.1 → 1.0 over 200ms)
- **Placement:** Right-third of frame for title cards, centered on subject for thumbnails

### Strata Sidebar (Stratum variant only)

Horizontal bands along the left edge showing historical eras, colored in warm earth tones:

| Era label | Color | Example |
|-----------|-------|---------|
| Present | `bone` at 80% | 2026 |
| Cold War | `folder` | 1947 |
| Empire | `bronze` | 1900 |
| Industrial | `rust` at 60% | 1786 |
| Deep | `ink` at 50% | — |

Bands are 80-120px wide, full height of frame, with era labels in IBM Plex Mono at `meta` size.

---

## Image Treatment Pipeline

Every image — archival photograph, satellite imagery, technical photography, AI generation — passes through the same 4-step pipeline before entering any composition. The pipeline IS the brand. No exceptions.

### Step 1: Desaturate

Reduce saturation to 20-30% of original. Strip the image's native color identity so it becomes a neutral grayscale base.

### Step 2: Duotone Remap

Map the desaturated image to a two-color ramp from the brand palette:

| Ramp name | Shadows | Midtones | Highlights | When to use |
|-----------|---------|----------|------------|-------------|
| **Standard** | `ink` #1C1814 | `bronze` #8B5E2B | `amber` #E5A544 | Default for most content |
| **Conflict** | `ink` #1C1814 | `#7A2E1A` | `rust` #C23B22 | China, conflict, danger |
| **Editorial** | `folder` #C8B89A | `bone` #F0E6D0 | `paper` #F5F0E8 | Light mode images |

### Step 3: Grain & Vignette

- **Film grain:** 8-12% opacity, monochromatic noise overlay. Makes the image feel captured, not generated.
- **Vignette:** Edges darken 15-20% (radial gradient, transparent center → semi-opaque edge). Focuses attention on center-frame content.

### Step 4: Composite

Place the treated image into the layout grid according to one of three placement modes:

| Mode | Description | Image opacity | Use when |
|------|-------------|---------------|----------|
| **Background** | Full-bleed behind grid, crosshair, and type | 25-40% | Default — image as texture |
| **Inset panel** | Confined to a bordered frame within the layout | 60-80% | When image needs more presence |
| **Antipode split** | Image fills one half of the ∴ divider | 40-50% per side | Comparison episodes |

### Approved Source Types

**Use these:**
- Archival photography (historical sites, factories, diplomatic events, period documents)
- Satellite / aerial imagery (fabs, ports, trade routes, geographic features)
- Technical photography (chip dies, machinery, circuit boards, lab equipment)
- Documentary photography (street scenes, infrastructure, architecture)
- Portraits / faces (leaders, engineers, historical figures) — treated equally through the pipeline
- AI-generated SVG: **geometric/diagrammatic only** (network diagrams, flow charts, framework comparisons, data visualizations). Generated via Claude SVG following the visual vocabulary in SVG_ILLUSTRATION_PIPELINE.md. These bypass the image treatment pipeline — they're built in Meridian palette from the start.

**Avoid these:**
- Photorealistic AI generations (date fast, uncanny, undermine credibility)
- Stock photography (generic handshake/globe/flag imagery — instant credibility loss)
- Full-saturation color images (every image must pass through the pipeline)
- AI illustrations attempting organic/artistic styles (hands, faces, nature, textured art) — reframe as geometric concepts or use stock + treatment instead

### Face Treatment Rule

Faces are allowed — they pass through the same pipeline as everything else. A portrait of Morris Chang gets the same desaturate → duotone → grain → composite treatment as a satellite image of TSMC Fab 18. The face becomes evidence in the briefing, not a YouTube personality thumbnail.

What to avoid: close-up faces as the dominant thumbnail element (personality-led framing fights the analytical brand). Faces should be one compositional element among many — behind the crosshair, beside data, within the grid.

---

## Layout

### Canvas

- Resolution: **1920 × 1080** at **30 fps**
- Safe area padding: **80px** on all sides
- Spacing grid: **8px increments** (8, 16, 24, 32, 40, 48, 64, 80)

### Composition Zones

```
┌──────────────────────────────────────────────────────────────┐
│  80px safe area                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Header strip (brand + metadata in IBM Plex Mono)    │    │
│  │  ─────────────────────────────────────────────────    │    │
│  │                                                      │    │
│  │  Content area (middle 70%)                           │    │
│  │  [Image plane z=0] [Content z=1] [Accent z=2]       │    │
│  │                                                      │    │
│  │  ─────────────────────────────────────────────────    │    │
│  │  Footer strip (source, coordinates, ∴ mark)     │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Three-Layer Depth System

| Layer | Z-index | Contains | Shadow |
|-------|---------|----------|--------|
| **Background** (z=0) | 0 | Gradient bg + optional treated image | None |
| **Content** (z=1) | 1 | Cards, charts, text blocks, map fills | `0 2px 12px rgba(0,0,0,0.25)` |
| **Accent** (z=2) | 2 | Highlighted elements, crosshair, key data | `0 0 16px {accentColor}40` (glow) |

### Thumbnail Layout

- Size: **1280 × 720**
- Max text: **6 words**, minimum **48px equivalent**
- Channel wordmark (`∴ PARALLAX` in IBM Plex Mono) in header strip
- Episode number in top-right corner
- Treated image as background (Mode A) or inset panel (Mode B)
- Title in Space Grotesk 700, lower-left quadrant

### Social Crops

- YouTube: 1280 × 720
- Instagram / Xiaohongshu: 1080 × 1080 (center-crop from 16:9)
- TikTok / Douyin shorts: 1080 × 1920 (recomposed vertical)
- Community post: 1200 × 675

---

## Editorial Magazine Layout Principles

Remotion templates are the channel's *inside layout* — the data, structure, and analytical surface the viewer reads. The compositional discipline that makes Remotion sit naturally next to the constructivist illustrations (Registers 2 and 3) is editorial magazine layout, not SaaS dashboard or generic data-viz. The references that should guide every template review:

**Push Pin Studios** — deliberate white-space discipline, restrained accent usage, geometric typographic confidence. *Push Pin Almanack* layouts as the model for how restraint creates intensity. The anti-pattern: filling space because it's available.

**Saul Bass title sequences** — bold negative space, asymmetric balance, hierarchical clarity through scale and weight rather than color shouting. *Anatomy of a Murder* and *The Man with the Golden Arm* poster discipline applied to data presentation.

**Fortune magazine industrial-modernism (1950s-60s)** — restrained palette anchored to brand colors with one dominant accent per spread, geometric sans-serif paired with monospace for "intelligence briefing" texture, deliberate compositional asymmetry. The benchmark for "magazine inside spread quality."

**Edward Tufte's data-ink ratio** — every pixel that doesn't carry information is a candidate for removal. Maximize signal-to-noise. Charts justify their decoration; chart junk is removed without ceremony.

**Swiss/Bauhaus grid systems** — strict 8px grid (already specified above), deliberate alignment, hierarchy through size and weight rather than color, restraint as the primary aesthetic discipline.

### Compositional Rules (apply to every template)

1. **Negative space is content.** Aim for 30-40% of frame as breathing room around primary elements. Crowded compositions read as dashboard; uncrowded read as editorial spread.
2. **One dominant accent per composition.** If the chart needs amber, the title doesn't also need amber — pick the hierarchy element that carries it. Multiple accents at equal weight read as decoration.
3. **Hierarchy through size and weight, not color.** Primary element ≥1.5× secondary in size *or* weight delta ≥200. Don't try to push hierarchy by saturating color — that's dashboard discipline.
4. **Asymmetric balance over centered symmetry.** Editorial layouts are deliberately off-center; centered symmetry reads as PowerPoint. Use the rule of thirds, not center-line.
5. **Restrained typography.** Two type tiers visible at once is the default; three is the maximum. Four tiers means the design is too dense.
6. **Metadata texture earns its place.** The IBM Plex Mono metadata strips, file codes, coordinate strings are texture-as-credibility. They should always feel like they belong to a real briefing — period-appropriate, plausible, never decorative.

### The Magazine-Spread Test (for every template review)

Before approving a Remotion template render, ask: "If I saw this as a half-page in a *Fortune* magazine inside spread, would it look like it belonged?" If yes, the editorial discipline is intact. If it looks like a Mixpanel dashboard, the discipline is missing — diagnose against the rules above.

The reverse test: "If I saw this next to a constructivist illustration cover, would they read as the same publication?" Same answer logic. The relationship between the registers is the relationship between magazine cover and inside spread — different intensities, same publication identity.

---

## Animation

### Timing Principles

- **No linear interpolation.** Every animated property uses an easing function. Default: `Easing.out(Easing.cubic)` for entrances, `Easing.in(Easing.cubic)` for exits.
- **Spring physics for hero elements.** Titles, key statistics, map highlights: `spring()` with `damping: 12-15, mass: 0.8-1.2`.
- **Stagger everything.** Child elements never appear simultaneously. 50ms for dense lists, 100ms for medium, 150ms for sparse.
- **Layered reveal:** Structure (axes, grids, bg) → data (bars, map fills) → labels (values, annotations).
- **Ken Burns on holds >3s.** Subtle scale (1.00 → 1.02) or slow pan (5-10px) to prevent frozen-slide syndrome.
- **Exit animations exist.** Last 15-20 frames fade out key elements. Background can hold.

### Timing Reference

| Element | Enter duration | Stagger delay | Hold minimum |
|---------|---------------|---------------|--------------|
| Title text | 400-600ms | 150ms between lines | 1.5s |
| Section number | 300ms | — | 1s |
| Chart bar | 500-800ms | 50ms per bar | 0.5s after last |
| Data label | 200-300ms | 50ms after its bar | — |
| Map country | 300-400ms | 80ms per country | — |
| Timeline event | 400ms | 100ms per event | 0.5s |
| Framework item | 350ms | 80ms per item | 0.3s |
| Route segment | 600-1000ms | 200ms per segment | — |
| Crosshair track | 600-800ms | — | 200ms lock-on pulse |

### Crosshair Animation Sequence

1. Hairlines extend from edges (200ms, ease-out)
2. Outer circle draws (300ms, ease-out)
3. Inner circle + center dot appear (200ms, spring)
4. Track to target position (600-800ms, ease-in-out)
5. Lock-on pulse: inner circle scales 1.0 → 1.1 → 1.0 (200ms, spring)

### Cross-Register Transition Signatures

Crossing between Register 1 (Remotion analytical, clean) and Register 2 / 3 (constructivist illustration, grain-textured) is the largest texture/style gap in any episode's visual layer. Hard cuts across this gap feel jarring. The channel uses signature transitions consistently so viewers learn the motion vocabulary unconsciously — these aren't decisions made per-shot, they're channel signatures.

| Direction | Signature transition | Duration | Why |
|-----------|---------------------|----------|-----|
| **Analytical → Grounding/Atmospheric** (Remotion → constructivist illustration or AI-GEN scene) | Amber color-wash with grain-fade-in | 600-800ms | The clean data dissolves into the warm illustrated world it describes. Grain ramps in over the second half of the wash, signaling the texture register shift. |
| **Grounding/Atmospheric → Analytical** (constructivist → Remotion) | Dissolve with grain-fade-out and ink iris-in | 500-700ms | The illustrated world crystallizes into the precise pattern. Grain fades out, ink-tinted iris contracts to reveal clean Remotion content. |
| **Grounding ↔ Atmospheric** (within constructivist registers, same visual language) | Cross-dissolve | 300-500ms | Same visual language, different role. Soft transition appropriate. |
| **Within Analytical** (Remotion → Remotion) | Cut (or wipe at register-defined corner) | Single frame for cut, 200-300ms wipe | Same texture register, no bridge needed. |
| **Beat boundaries** (any → any) | Fade through bone or ink (mode-dependent) | 400-600ms | Episode structure transitions, not register transitions. |

**Implementation note:** the Transitions library (`src/components/Transitions.tsx`) supports the underlying types (color-wash, blur-through, dissolve, iris, cut, wipe, fade). The signature pairings above are codified as preset transition configurations consumed via `cut()` directives in the script and parsed by `generate_manifest.py`. A `cut()` directive crossing between registers automatically applies the signature transition for that register pair unless overridden.

The unity rule: **never hard-cut across registers without a signature transition**. Hard cuts within a single register are fine (they share visual language); hard cuts across registers create visible seams. render-qa flags any cross-register hard-cut in the assembly manifest as a likely error.

---

## Color Assignment Rules

1. **Geopolitical actors get semantic colors.** US = `us` blue, China = `china`/`rust` red. Non-negotiable.
2. **Contested or swing actors get `amber`.** Countries caught between blocs, unresolved outcomes.
3. **Historical or structural concepts get `neutral`.** Past events, background context, non-partisan framing.
4. **Positive/negative valence uses `success`/`danger`.** Growth, triumph, failure, escalation.
5. **Default accent is `amber`** (dark mode) or **`oxblood`** (light mode). When no semantic meaning applies.
6. **Never use raw hex in JSON data files.** Always reference a named token from this file.
7. **Image duotone ramp matches content:** Standard (amber) for neutral analysis, Conflict (rust) for adversarial content.

---

## Per-Episode Color Emphasis

The brand palette range is constant across the channel. What varies per episode is which **subset of the palette gets foregrounded** in Remotion templates, mirroring the per-typography palette emphasis in the AI-generated content (see PROMPT_PREAMBLES.md and TYPOGRAPHY_TRADITIONS.md). This creates per-episode visual unity between the constructivist illustration cover and the Remotion analytical inside-layout — a Soviet-bloc episode's charts pull rust + gold revolutionary intensity to echo the AI-gen scenes; an American mid-century / contemporary tech episode's charts pull walnut + umber + gold restraint to match Saul Bass / Push Pin discipline; a Chinese-state episode incorporates vermillion accents distinct from Soviet crimson.

The episode color emphasis is specified once at the episode level (in `episodes/<slug>/visual-identity.json`) and propagates through `theme.ts`'s `getEpisodeColorEmphasis()` helper to every template. Templates consume the emphasis when choosing accent colors, chart fills, and highlight elements.

### Emphasis values

| Value | Foregrounded tokens | Semantic | Pairs with text_treatment |
|-------|---------------------|----------|----------------------------|
| `neutral` (default) | Full brand palette, `amber` accents | Channel default | Mixed-typography episodes, transitional moments |
| `soviet` | `rust` + `bronze` + `amber` + `ink` + `bone` (full saturated revolutionary) | Russian/Soviet content | `russian_constructivist` |
| `american-modernist` | `walnut` + `umber` + `bronze` + `bone` + `paper` (softer mid-century, `rust` only as sparing accent) | American mid-century / contemporary tech | `english_modernist` or `english_minimal` |
| `chinese-state` | Chinese vermillion + `amber` + `ink` + `bone` (lacquer-influenced, distinct from Soviet) | Chinese contemporary state-led content | `chinese_propaganda` or `chinese_minimal` |
| `chinese-traditional` | `ink` dominant + `bone` + `paper`, sparse `oxblood` for seal accents | Pre-revolutionary Chinese / classical | `chinese_traditional` |
| `japanese-showa` | `ink` + bold red + `bone` (minimal 2-3 colors) | Pre-1945 Japanese imperial / Showa-era | `japanese_showa` |

### Implementation

The `getEpisodeColorEmphasis(emphasis: EmphasisName)` helper in `theme.ts` returns a `PaletteEmphasis` object with foregrounded tokens for primary, secondary, and accent uses. Templates consume these instead of pulling directly from the full palette:

```typescript
// Before (pulls full palette regardless of episode)
<Bar fill={theme.colors.amber} />

// After (consumes episode emphasis)
const emphasis = useEpisodeColorEmphasis(); // reads from manifest's episodeColorEmphasis
<Bar fill={emphasis.primaryAccent} />
```

`emphasis.primaryAccent` returns `amber` for neutral, `rust` for soviet, `walnut` for american-modernist (a softer accent), Chinese vermillion for chinese-state, etc. Same for `secondaryAccent`, `dominantText`, `surfaceTone`, `chartFillSequence`.

### High-impact templates that consume emphasis

The five templates that benefit most from per-episode emphasis (chart fills, accent colors, and highlight elements drive visual identity hardest):

1. **DataChart** — bar fills and accent labels
2. **ChoroplethMap** — contested-actor highlight color (was always `amber`; now `emphasis.primaryAccent`)
3. **FrameworkDiagram** — node fills and connection-line colors
4. **TimelineComparison** — era band fills and event accents
5. **KineticTypography** — accent words and emphasis underlines

Other templates (TitleTransition, CrosshairOverlay, MetadataStrip, etc.) keep their default channel-wide treatment since the brand mark and metadata texture are unity anchors that should *not* vary per episode.

### Default behavior

If an episode's `visual-identity.json` is missing or `episodeColorEmphasis` is unset, templates fall back to `neutral` (full palette, `amber` accents). This preserves backward compatibility — existing data files render identically until an episode opts in to emphasis.

---

## Metadata System

Every composition includes a metadata layer in IBM Plex Mono at `meta` size (11px, letter-spacing 2-3px). This is the "intelligence briefing" texture that makes the brand feel systematic.

### Header strip (top of frame, inside safe area)

Dark mode: `amber` text on transparent
Light mode: `text.light.muted` text on transparent

Content varies by variant:
- **Meridian:** `∴ PARALLAX` (left) + `EP XX · coordinates` (right)
- **Antipode:** `∴ PARALLAX` (left) + `ROUNDUP` or `BRIEFING №` (right)
- **Stratum:** `∴ PARALLAX` (left) + `SURVEY XXX` (right)

### Footer strip (bottom of frame, inside safe area)

Dark mode: `text.dark.muted` on transparent
Light mode: `text.light.muted` on transparent

Content: `● REC · runtime` (left) + `scale or subject` (center) + `FILED date` (right)

### Light mode additions

- Rubber stamp element (EPISODE XX) in `oxblood`, rotated 2-3°, top-right area
- Thin ruled border inset 40px, 1px `bg.light.border`
- Classification-style label: `PARALLAX // FILE XXX` in IBM Plex Mono

---

## File Naming Convention

Data files: `{template-type}-{descriptive-slug}.json`
Examples: `choropleth-bifurcation.json`, `kinetic-juguo.json`, `chart-export-controls.json`

Episodes directory: `data/episodes/ep{NN}/`

---

## Quick Reference: Light (Primary) vs Dark (Secondary)

| Element | Light Mode — PRIMARY (Dossier) | Dark Mode — secondary (Meridian) |
|---------|---------------------|----------------------|
| Background | Radial gradient: `ink` → `bg.dark.base` (warm umber) | Flat `paper` with subtle noise |
| Text primary | `bone` #F0E6D0 | `ink` #1C1814 |
| Accent color | `amber` #E5A544 | `oxblood` #6B1D1D |
| Metadata text | `text.dark.muted` | `text.light.muted` |
| Crosshair | `amber` at 40-60% | `oxblood` at 30-40% |
| ∴ mark | `amber` | `oxblood` |
| Image duotone | ink → bronze → amber | folder → bone → paper |
| Card shadow | `0 2px 12px rgba(0,0,0,0.25)` | `0 1px 8px rgba(0,0,0,0.08)` |
| Divider lines | `amber` at 30%, gradient fade | `bg.light.border`, gradient fade |
| Stamp element | — (not used) | `oxblood`, rotated 2-3° |
| Border frame | — (not used) | 1px inset 40px, `bg.light.border` |
