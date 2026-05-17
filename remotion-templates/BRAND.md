# Brand Design System — Meridian

> Canonical source of truth for all visual assets across the channel.
> Every template, thumbnail, title card, and social graphic pulls from this file.
>
> Direction: **Meridian** — a hybrid of Cartograph (data/maps), Dialectic (thesis/antithesis),
> and Tectonic (historical layering). Two registers: **Dark** (cinematic, in-video) and
> **Light** (editorial, title cards, social). Both pass through the same design system.
>
> Last updated: May 14, 2026 (Motion Register section added)

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

> **Source of truth:** [`tools/brand-treatment/palette.json`](../tools/brand-treatment/palette.json). Everything below is derived from that file. If a hex value in this doc disagrees with palette.json, **palette.json wins** — file a fix on this doc. `theme.ts` consumes palette.json directly via `import paletteData from "...palette.json"`.

### Direction A — Monochrome Warm + muted semantics + gold accent

The palette is a warm-monochrome family (ink → walnut → umber → taupe → sand → bone → paper) with **two restrained semantic accents** (`us` muted blue, `china` muted rust-red) and **one channel accent** (`gold`). This is the "Direction A" palette adopted in the April 2026 brand exploration — calmer than the original Meridian draft (which had a saturated amber + rust + oxblood + olive system that this doc still partially described until May 17, 2026).

### Shared Palette (10 keys)

These are the canonical palette keys exported from `theme.ts` via `palette.<key>`. They work in both dark and light modes — they ARE the brand's DNA.

| Token | Hex | Role |
|-------|-----|------|
| `ink` | `#1C1814` | Deepest dark — shadows, dark mode bg base (warm umber undertone) |
| `midnight` | `#2A2520` | Dark mode elevated surfaces (one step lighter than ink) |
| `walnut` | `#5C4A3D` | Mid-shadow brown; light-mode accent (replaces the old `oxblood`) |
| `umber` | `#8B7355` | Midtone in duotone ramps; warm neutral; secondary accent |
| `taupe` | `#B8A189` | Light midtone; subtitles in dark mode |
| `sand` | `#D9C9B0` | Light secondary surface (replaces the old `folder`); primary text on dark |
| `bone` | `#F0E6D0` | Warm cream; primary text on dark, dark backgrounds in light mode |
| `paper` | `#F5F0E8` | Light mode bg base; card backgrounds |
| `gold` | `#C4A747` | **Channel accent** — crosshairs, hero labels, highlights, emphasis (replaces the old saturated `amber`) |
| `dustblue` | `#7AA3C9` | Muted us-blue midtone (RdBu diverging midpoint between `bone` and `semantic.us`) |

### Semantic Colors (Geopolitical)

These override mode colors when encoding geopolitical meaning. **Note the muted intensity** — Parallax intentionally avoids the saturated reds/blues of cable-news geopolitics; the editorial register is closer to The Economist than to CNN.

| Token | Hex | Meaning |
|-------|-----|---------|
| `us` | `#4A7BA7` | US / Western-aligned actions (muted blue) |
| `china` | `#A64D46` | China / Eastern-aligned actions (muted rust-red) |
| `neutral` | `#888780` | Non-aligned, structural, historical |

Exposed in `theme.ts` as `semantic.us` / `semantic.china` / `semantic.neutral`, plus three convenience aliases: `semantic.highlight` = `gold`, `semantic.success` = `us` (no separate green; growth/positive trends use US-blue when geopolitical, gold when channel-neutral), `semantic.danger` = `china`.

### Legacy aliases (in `theme.ts`, NOT in palette.json)

For backwards compatibility with templates written against the original Meridian draft, `theme.ts` exports six aliases that point at canonical palette keys. These names still appear in older template code — DON'T propagate them to new code.

| Legacy alias | Resolves to | Notes |
|--------------|-------------|-------|
| `amber` | `gold` (`#C4A747`) | Old saturated amber `#E5A544` is gone; channel accent is now `gold` |
| `rust` | `semantic.china` (`#A64D46`) | Old `#C23B22` saturated rust no longer exists |
| `oxblood` | `walnut` (`#5C4A3D`) | Old `#6B1D1D` deep-red no longer exists; light-mode accent migrated to `walnut` |
| `folder` | `sand` (`#D9C9B0`) | Old `#C8B89A` folder-tan no longer exists |
| `olive` | `umber` (`#8B7355`) | No green in palette — folded into umber |
| `bronze` | `umber` (`#8B7355`) | Duotone midtone — same family as `umber` |

Audit (May 17, 2026): all callers of these aliases were verified to render correctly against the current canonical values. New work should use the canonical keys directly.

### Sequential Ramps (5-stop, light → dark)

Defined in `palette.json` → `ramps`. Exposed in `theme.ts` as `ramps.<name>`. Used for sequential / divergent chart fills, choropleth scales, and ProportionalSymbolMap size encoding.

| Ramp | Stops |
|------|-------|
| `warm` (6-stop) | `#F5F0E8` `#D9C9B0` `#B8A189` `#8B7355` `#5C4A3D` `#1C1814` (paper → ink) |
| `blue` | `#E8F0F6` `#9DBDD6` `#4A7BA7` `#2E5C82` `#163048` |
| `red` | `#F5E8E7` `#CFA09C` `#A64D46` `#7A3530` `#3D1A18` |
| `gold` | `#FFF6E0` `#E8D49A` `#C4A747` `#967E30` `#5C4D1A` |
| `gray` | `#F1EFE8` `#B4B2A9` `#888780` `#5F5E5A` `#2C2C2A` |

### Dark Mode Palette

Defined in `palette.json` → `modes.dark`. Tokens resolve to palette keys, not raw hex — change the underlying key and the mode follows.

| Token | Resolves to | Hex | Use |
|-------|-------------|-----|-----|
| `bg.dark.base` | (raw) | `#12100E` | Deepest background (radial gradient edge) |
| `bg.dark.surface` | `ink` | `#1C1814` | Primary surface |
| `bg.dark.elevated` | `midnight` | `#2A2520` | Cards, panels, raised elements |
| `bg.dark.map` | (raw) | `#1A1612` | Map background (slightly different from surface) |
| `text.dark.primary` | `sand` | `#D9C9B0` | Primary text (warm cream) |
| `text.dark.secondary` | `taupe` | `#B8A189` | Subtitles, descriptions |
| `text.dark.muted` | `umber` | `#8B7355` | Captions, metadata |
| `text.dark.accent` | `gold` | `#C4A747` | Labels, crosshair text, hero numbers |

Background treatment: radial gradient from `ink` (center) to `bg.dark.base` (edges), creating a warm vignette that focuses attention center-frame. The brown undertone reads as candlelit/archival rather than cold surveillance.

### Light Mode Palette

Defined in `palette.json` → `modes.light`.

| Token | Resolves to | Hex | Use |
|-------|-------------|-----|-----|
| `bg.light.base` | `paper` | `#F5F0E8` | Primary surface |
| `bg.light.surface` | (raw) | `#EDE7DB` | Slightly darker surface for depth |
| `bg.light.elevated` | (raw) | `#FFFFFF` | Cards, containers on paper bg |
| `bg.light.border` | `sand` | `#D9C9B0` | Subtle borders, divider lines |
| `bg.light.map` | (raw) | `#EDE7DB` | Map background |
| `text.light.primary` | `ink` | `#1C1814` | Primary text |
| `text.light.secondary` | `walnut` | `#5C4A3D` | Subtitles, descriptions |
| `text.light.muted` | `umber` | `#8B7355` | Captions, metadata, sources |
| `text.light.accent` | `walnut` | `#5C4A3D` | Labels, stamps (replaces old `oxblood` for light-mode accent) |

Background treatment: flat or lightly textured `paper` with subtle noise (2-3% opacity). Optional: thin ruled border inset 40px from edges (1px, `bg.light.border`), evoking a briefing document.

### Duotone treatments (image pipeline)

Defined in `palette.json` → `duotone`. Used by `tools/brand-treatment/treat.py` and the `BrandImage` Remotion component. Each treatment is a 3-stop ramp (shadows → midtones → highlights).

| Treatment | Shadows | Midtones | Highlights | When to use |
|-----------|---------|----------|------------|-------------|
| `standard` | `ink` | `umber` | `gold` | Default treatment — most footage |
| `conflict` | `ink` | `#7A2E1A` (deep brick) | `china` `#A64D46` | Geopolitical tension, military, opposition |
| `editorial` | `taupe` | `bone` | `paper` | Documents, archival, low-saturation editorial register |

---

## Typography

### Type Pair

| Role | Font | Weight | Use |
|------|------|--------|-----|
| **Display** | IBM Plex Sans | 600-700 | Episode titles, hero text, section headers, hero numbers |
| **Display** | IBM Plex Sans | 400-500 | Subtitles, descriptions |
| **Body** | IBM Plex Sans | 400-500 | Paragraph text, framework tenets, item lists, card body content |
| **Serif body** | IBM Plex Serif | 400-500 | Long-form passages, asides, citations, editorial-register narrative |
| **Metadata** | IBM Plex Mono | 400-600 | Kicker labels, byline, coordinates, dates, axis labels, source attribution, captions |
| **Data** | JetBrains Mono | 400-700 | Chart values, statistics, tabular numbers |
| **Chinese** | Noto Sans SC | 400-700 | All Chinese text (10-15% larger than equivalent English) |

IBM Plex Sans is the voice of the channel — Franklin Gothic-derived, mid-century editorial, the actual lineage Burtin and Beall set Fortune magazine in (1945-55). It carries both the display register (titles, hero numbers) AND the body paragraph register (tenets, lists, descriptions) — using the same family across the hierarchy keeps the typographic voice consistent. IBM Plex Serif is the long-form companion — transitional serif from the same Plex superfamily, used when the editorial register calls for a transitional serif (asides, citations, narrative paragraphs). IBM Plex Mono is the metadata layer — coordinates, dates, classifications, file numbers, kicker labels, bylines, axis labels, source attribution. JetBrains Mono is reserved for pure data display (chart values, statistics, tabular numbers that need column alignment).

**Naming note.** In `theme.ts`, `fonts.body` = Plex Sans (paragraph text), `fonts.metadata` = Plex Mono (the labels-and-captions layer), `fonts.mono` is an alias for `fonts.metadata`. A May 10 regression briefly had `fonts.body` pointing to Mono, which made every tenet, item, and subtitle render typewriter-style; reverted same day.

The Plex superfamily (Sans + Serif + Mono, all by Mike Abbink for Bold Monday / IBM, 2017) was designed as a coherent system honoring Paul Rand's mid-century IBM corporate-modernist heritage. Adopting all three gives Parallax a single typographic source of truth in the genuine Bauhaus → Swiss → mid-century editorial lineage.

**Migration note (May 10, 2026).** The display face migrated from Space Grotesk (Florian Karsten, 2018) to IBM Plex Sans. Space Grotesk's lineage is monospaced-tech-display (derived from Colophon's Space Mono), and at the 100pt hero-number scale Parallax leans on, its quirks (extended `f j r t`, oval counters, distinctive `g`) compete with the data they label. Plex Sans's lining figures disappear into "this is a quantity," matching how Burtin and Beall set Franklin Gothic numerals in Fortune. See `project/DECISIONS.md` for the full decision record.

**Anthropic alignment note.** Parallax's typographic register (warm-modernist editorial, paper-substrate, mid-century corporate-modernist lineage) is a near-sibling to Anthropic's Claude design language (Styrene A → Anthropic Sans + Tiempos → Anthropic Serif, with the same warm cream/clay palette philosophy). This is accidental but worth knowing — the channel inherits "looks intelligent and considered" by association rather than fighting against it.

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
- **All-caps text: always IBM Plex Mono or IBM Plex Sans 600+**, never body weight. All-caps at light weights looks anemic.

---

## Brand Mark & Motifs

### The ∴ Mark

The "therefore" symbol (∴) is the channel's brand mark. It represents the logical conclusion that structural parallels reveal — *this happened before, therefore expect this pattern.*

Usage:
- **Wordmark:** `∴ PARALLAX` in IBM Plex Mono, uppercase, letter-spacing 2.5px
- **Standalone:** The ∴ can appear alone as a section divider, loading indicator, or watermark
- **Antipode variant:** The ∴ sits at the center of the thesis/antithesis split
- **Minimum size:** 12px (the three dots must remain visually distinct)
- **Color:** `gold` on dark mode, `walnut` on light mode (legacy aliases: `amber`/`oxblood`)

### Cross-Register Placement (the systematic anchor)

The ∴ mark is the channel's most reliable visual unity anchor. It appears across every register and every visual surface in deliberate, consistent placements. Viewers learn the placement unconsciously; cumulative recognition ties Remotion analytical layer to constructivist illustrations to thumbnails to social crops as one channel.

| Surface | Placement | Style | Source |
|---------|-----------|-------|--------|
| **Remotion templates** | Header strip (lower-left of strip), part of `∴ PARALLAX` wordmark | IBM Plex Mono uppercase, letter-spacing 2.5px, `gold` (dark) / `walnut` (light) per mode | HeaderStrip component |
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
- **Color:** `gold` at 40-60% opacity (dark mode), `walnut` at 30-40% opacity (light mode) (legacy aliases: `amber`/`oxblood`)
- **Animation:** Slow tracking (translating to target over 600-800ms), lock-on pulse (inner circle scales 1.0 → 1.1 → 1.0 over 200ms)
- **Placement:** Right-third of frame for title cards, centered on subject for thumbnails

### Strata Sidebar (Stratum variant only)

Horizontal bands along the left edge showing historical eras, colored in warm earth tones:

| Era label | Color | Example |
|-----------|-------|---------|
| Present | `bone` at 80% | 2026 |
| Cold War | `sand` (legacy alias: `folder`) | 1947 |
| Empire | `umber` (legacy alias: `bronze`) | 1900 |
| Industrial | `semantic.china` at 60% (legacy alias: `rust`) | 1786 |
| Deep | `ink` at 50% | — |

Bands are 80-120px wide, full height of frame, with era labels in IBM Plex Mono at `meta` size.

---

## Motion Register

The brand reads as **print-newsroom + film**, not as handheld documentary camera. The default motion register is intentionally restrained: charts stay level, axes stay perpendicular, content does not slip toward the bottom-right. Movement is for moments where motion *carries editorial weight*, not for adding texture to static information.

### The eight drift presets

Templates set their drift via `_direction: { driftPreset: "<name>" }`. The default (when no preset is specified) is `editorial`, defined by `motionBudget` in `theme.ts`.

| Preset | Mode | Scale | Pan X | Pan Y | Rotation | Use for |
|---|---|---|---|---|---|---|
| `none` | — | — | — | — | — | Maps, interactive comps, showreel/catalog evaluation |
| `editorial` *(default)* | linear | 1.02 | 0 | 0 | 0 | Charts, all data-visualization templates |
| `slow` | linear | 1.03 | 8 | 4 | 0.15 | Pre-May-2026 episodes (back-compat) |
| `normal` | linear | 1.06 | 18 | 8 | 0.3 | Pre-May-2026 episodes (back-compat) |
| `documentary` | linear | 1.06 | 18 | 8 | 0.3 | Atmospheric photo segments — NEVER charts |
| `breathing` | breathing | 1.008 | 0 | 0 | 0 | Long-held stats — sinusoidal scale on 8s cycle |
| `settle` | settle | 1.025 | 0 | 0 | 0 | Title cards, section dividers — settle then HOLD |
| `sway` | sway | 1.0 | 6 | 4 | 0 | Photo plates — bidirectional pan, no net drift |

### Hard rules

1. **Charts use `editorial` or `none`.** The 0.3° rotation in `documentary` tilts axis baselines visibly even when "imperceptible." Rotation is reserved for photo-driven segments where axes don't exist.
2. **Showreels and contact sheets use `none`.** Wrap each segment with the `still()` helper in `src/catalog/Showreel.tsx` so all demos render drift-free for back-to-back evaluation.
3. **Pan direction is editorially neutral.** When pan is non-zero (slow/normal/documentary), the convention is right + down (descended from documentary photography). For new motion choices, prefer no-pan or bidirectional `sway` — the directional slip works for photos, not for charts.
4. **`contentArea()` reserves 18×8px regardless of current default.** This protects opt-in `documentary` users from drifting past the safe-area boundary. The reserve is decoupled from `motionBudget`.

### Editorial intent per preset

- **`editorial`** — "The camera is watching." Barely-perceptible inward zoom that says the frame is alive but doesn't slip. Default for every chart.
- **`breathing`** — "This number is alive." Use for stat reveals held for 4+ seconds where you want presence without slip.
- **`settle`** — "The camera lands." Title cards, section dividers, anything that should establish then hold.
- **`sway`** — "Subtle handheld feel." Atmospheric photo plates, paper-texture title backgrounds. Net displacement zero — life without drift.
- **`documentary`** — "Documentary register." Archival photos, scenic establishing shots, anywhere the chart isn't the point.
- **`slow` / `normal`** — kept at their original values for episodes built before the May 2026 editorial revision. New work should not reach for these by name.
- **`none`** — used by maps (which have their own narrated camera systems) and by every showreel/contact-sheet rendering path.

### Where this lives in code

- **`src/design/theme.ts`** — `motionBudget` (the default envelope) + `contentArea()` (safe-area reserve)
- **`src/hooks/useCompositionAnimation.ts`** — the four interpolation modes (`linear`, `breathing`, `settle`, `sway`)
- **`src/hooks/useDirection.ts`** — `DRIFT_PRESETS` (maps preset names → envelope + mode)
- **POLISH.md A6** — the checkable rule version of this section

---

## Image Treatment Pipeline

Every image — archival photograph, satellite imagery, technical photography, AI generation — passes through the same 4-step pipeline before entering any composition. The pipeline IS the brand. No exceptions.

### Step 1: Desaturate

Reduce saturation to 20-30% of original. Strip the image's native color identity so it becomes a neutral grayscale base.

### Step 2: Duotone Remap

Map the desaturated image to a two-color ramp from the brand palette:

| Ramp name | Shadows | Midtones | Highlights | When to use |
|-----------|---------|----------|------------|-------------|
| **Standard** | `ink` #1C1814 | `umber` #8B7355 | `gold` #C4A747 | Default for most content |
| **Conflict** | `ink` #1C1814 | `#7A2E1A` (deep brick) | `china` #A64D46 | China, conflict, danger |
| **Editorial** | `taupe` #B8A189 | `bone` #F0E6D0 | `paper` #F5F0E8 | Light mode images, documents, archival |

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
- AI-generated SVG: **geometric/diagrammatic only** (network diagrams, flow charts, framework comparisons, data visualizations). Post-May 4, 2026 these are generated via `tools/recraft/recraft.py --register analytical` (the Recraft V3 vector_illustration style). The pre-May 4 Claude SVG path documented in SVG_ILLUSTRATION_PIPELINE.md is retired. These bypass the image treatment pipeline — they're built in Meridian palette from the start.

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
- Title in IBM Plex Sans 600-700, lower-left quadrant

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
- **Anticipatory entrance — the Economist 150ms rule.** When an element is sync'd to a narrated word (via `_direction.syncPoints[]` parsed from `DIR: cam(sync:"word")` / `DIR: reveal(sync:"word")`), it starts settling ~5 frames (≈150ms at 30fps) *before* the word lands. The viewer reads the element as already-present-and-settled when the spoken word arrives — not landing on the word, not appearing afterward. This is what separates editorial video from PowerPoint reveals. Implemented in `src/utils/animation.ts` → `anticipatoryStartFrame()`, consumed by `useEntrance()` and applied automatically by TitleTransition, KineticTypography, StatReveal, BayesianUpdate, TitleBlock. You don't opt in — every sync'd reveal gets it. See `references/template-research/motion-design.md` § 3.

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

### Cross-Pillar Transition Signatures

The three content pillars — Remotion (analytical, clean texture), AI-generated (constructivist illustration, grain texture, illustrated source), Footage (archival/screen, grain texture, photographic source) — have distinct texture and source-character profiles. Transitions between them carry editorial weight: a clean-to-grain transition signals "designed information dissolves into observed/illustrated world," and a same-texture-different-source transition signals "interpretation crystallizes into documented reality" or vice versa. The channel uses signature transitions consistently so viewers learn the motion vocabulary unconsciously — these aren't decisions made per-shot, they're channel signatures encoding the cognitive shift between cognitive modes.

The transitions sort into three classes:

**Class A — Within a pillar (same texture, same source character).** Soft transitions or hard cuts are fine; the visual language is shared. No bridge needed.

**Class B — Cross-pillar with texture gap** (clean Remotion ↔ either grainy pillar). Largest visual gap in the episode. Always uses an explicit color-wash + grain transition. Hard cuts across this gap are forbidden.

**Class C — Cross-pillar with source-character gap only** (AI-generated ↔ Footage, both grainy but illustrated vs. photographic). Soft cross-dissolve through a brand midtone. Marks the source shift without heavy bridge.

| Class | Direction | Signature transition | Duration | Why |
|---|---|---|---|---|
| A | **Within Analytical** (Remotion ↔ Remotion) | Cut, or wipe at register-defined corner | 1 frame for cut, 200-300ms for wipe | Same texture, same pillar, no bridge needed |
| A | **Within Constructivist** (AI-gen Atmospheric ↔ Grounding) | Cross-dissolve | 300-500ms | Same texture (grain), same source (illustrated). Soft transition appropriate |
| A | **Within Footage** (Archival ↔ Archival, Screen ↔ Screen, or Archival ↔ Screen) | Cut or cross-dissolve | 1 frame to 400ms | Same texture (grain), same source character (real-world capture). Can cut on action when archival carries motion |
| B | **Analytical → AI-generated** (Remotion → Constructivist) | Amber color-wash with illustrated-grain-fade-in | 600-800ms | The clean data dissolves into the warm illustrated world it describes. Amber signals constructivist family. Grain ramps in over the second half |
| B | **AI-generated → Analytical** (Constructivist → Remotion) | Dissolve with illustrated-grain-fade-out and ink iris-in | 500-700ms | The illustrated world crystallizes into the precise pattern. Grain fades out, ink iris contracts to reveal clean Remotion |
| B | **Analytical → Footage** (Remotion → Archival/Screen) | Sepia color-wash with photographic-grain-fade-in | 600-800ms | The clean data dissolves into the documented real world. Sepia signals archival/photographic source, distinct from amber (which signals constructivist illustrated source) — same color-wash mechanic, different tint encodes which pillar receives |
| B | **Footage → Analytical** (Archival/Screen → Remotion) | Dissolve with photographic-grain-fade-out and bone iris-in | 500-700ms | The documented reality crystallizes into the analytical pattern. Symmetric reverse of Analytical → Footage |
| C | **AI-generated ↔ Footage** (Constructivist ↔ Archival/Screen) | Warm cross-dissolve through walnut | 400-500ms | Both pillars share grain texture; the dissolve marks the source-character shift (interpreted ↔ documented) without heavy bridge. Walnut (brand midtone, #5C4A3D) tints the dissolve briefly to signal the source transition |
| — | **Beat boundaries** (any → any) | Fade through bone or ink (mode-dependent) | 400-600ms | Episode structure transitions, not pillar transitions. Used at beat-end regardless of pillar |

**The mnemonic for the color-wash tints:** amber means "into illustrated world," sepia means "into documented world," ink/bone means "back to analytical." The viewer learns these unconsciously across episodes — by the third episode, an amber color-wash signals "we're moving to constructivist" before the cut completes.

**Implementation note:** the Transitions library (`src/components/Transitions.tsx`) supports the 6 canonical types per `project/TRANSITION_GRAMMAR.md` — `cut`, `dissolve`, `fade`, `match-cut` / `match-cut-still`, `color-wash`, `iris`. (Six others — `wipe-left`/`wipe-right`/`wipe-up`, `blur-through`, `whip-pan`, `spatial-zoom` — remain in the enum for backward compatibility but are deprecated and should not be used in new scripts; `blur-through` in particular has no SFX pairing and should be replaced with `dissolve`.) The signature pairings above are codified as preset transition configurations consumed via `cut()` directives in the script and parsed by `generate_manifest.py`. A `cut()` directive crossing between pillars automatically applies the signature transition for that pair unless overridden. The new sepia color-wash and walnut cross-dissolve variants are added to the Transitions library alongside the existing amber color-wash and ink iris-in.

The unity rule: **never hard-cut across pillars in Class B (clean ↔ grainy) without a signature transition**. Class A (within-pillar) hard cuts are valid since visual language is shared. Class C (AI-gen ↔ Footage) tolerates hard cuts when editing rhythm explicitly calls for them, but the warm cross-dissolve is the channel default since both pillars share grain texture and the source-character gap is real even if the texture gap isn't. render-qa flags any Class B hard-cut in the assembly manifest as a likely error; Class C hard-cuts pass with a soft warning that asks "did you mean to skip the warm-dissolve signature here?"

---

## Color Assignment Rules

1. **Geopolitical actors get semantic colors.** US = `semantic.us` (muted blue `#4A7BA7`), China = `semantic.china` (muted rust-red `#A64D46`). Non-negotiable.
2. **Contested or swing actors get `gold`** (legacy alias: `amber`). Countries caught between blocs, unresolved outcomes.
3. **Historical or structural concepts get `neutral`.** Past events, background context, non-partisan framing.
4. **Positive/negative valence uses `semantic.success`/`semantic.danger` aliases.** These resolve to `semantic.us` (growth/positive — no separate green) and `semantic.china` (failure/escalation — same as conflict red). The lack of a dedicated green is intentional: Parallax's editorial register doesn't use the green-good/red-bad cable-news binary.
5. **Default accent is `gold`** (dark mode) or **`walnut`** (light mode) when no semantic meaning applies. Legacy aliases `amber`/`oxblood` still resolve correctly.
6. **Never use raw hex in JSON data files.** Always reference a named token from this file.
7. **Image duotone ramp matches content:** `standard` (ink → umber → gold) for neutral analysis, `conflict` (ink → deep-brick → `semantic.china`) for adversarial content, `editorial` (taupe → bone → paper) for documents/archival.

---

## Per-Episode Color Emphasis

The brand palette range is constant across the channel. What varies per episode is which **subset of the palette gets foregrounded** in Remotion templates, mirroring the per-typography palette emphasis in the AI-generated content (see PROMPT_PREAMBLES.md and TYPOGRAPHY_TRADITIONS.md). This creates per-episode visual unity between the constructivist illustration cover and the Remotion analytical inside-layout — a Soviet-bloc episode's charts pull rust + gold revolutionary intensity to echo the AI-gen scenes; an American mid-century / contemporary tech episode's charts pull walnut + umber + gold restraint to match Saul Bass / Push Pin discipline; a Chinese-state episode incorporates vermillion accents distinct from Soviet crimson.

The episode color emphasis is specified once at the episode level (in `episodes/<slug>/visual-identity.json`) and propagates through `theme.ts`'s `getEpisodeColorEmphasis()` helper to every template. Templates consume the emphasis when choosing accent colors, chart fills, and highlight elements.

### Emphasis values

| Value | Foregrounded tokens | Semantic | Pairs with text_treatment |
|-------|---------------------|----------|----------------------------|
| `neutral` (default) | Full brand palette, `gold` accents (legacy alias: `amber`) | Channel default | Mixed-typography episodes, transitional moments |
| `soviet` | `semantic.china` + `umber` + `gold` + `ink` + `bone` (legacy aliases: rust + bronze + amber — full revolutionary palette) | Russian/Soviet content | `russian_constructivist` |
| `american-modernist` | `walnut` + `umber` (legacy alias: bronze folds into umber) + `bone` + `paper` (softer mid-century, `semantic.china` only as sparing accent) | American mid-century / contemporary tech | `english_modernist` or `english_minimal` |
| `chinese-state` | Chinese vermillion + `gold` + `ink` + `bone` (lacquer-influenced, distinct from Soviet) | Chinese contemporary state-led content | `chinese_propaganda` or `chinese_minimal` |
| `chinese-traditional` | `ink` dominant + `bone` + `paper`, sparse `walnut` for seal accents (legacy alias: `oxblood`) | Pre-revolutionary Chinese / classical | `chinese_traditional` |
| `japanese-showa` | `ink` + bold red + `bone` (minimal 2-3 colors) | Pre-1945 Japanese imperial / Showa-era | `japanese_showa` |

### Implementation

The `getEpisodeColorEmphasis(emphasis: EmphasisName)` helper in `theme.ts` returns a `PaletteEmphasis` object with foregrounded tokens for primary, secondary, and accent uses. Templates consume these instead of pulling directly from the full palette:

```typescript
// Before (pulls full palette regardless of episode)
<Bar fill={theme.palette.gold} />  // or palette.amber (legacy alias)

// After (consumes episode emphasis)
const emphasis = useEpisodeColorEmphasis(); // reads from manifest's episodeColorEmphasis
<Bar fill={emphasis.primaryAccent} />
```

`emphasis.primaryAccent` returns `gold` for neutral, `semantic.china` for soviet, `walnut` for american-modernist (a softer accent), Chinese vermillion for chinese-state, etc. Same for `secondaryAccent`, `dominantText`, `surfaceTone`, `chartFillSequence`. (Legacy callers using the `amber`/`rust` alias names still resolve to the canonical values.)

### High-impact templates that consume emphasis

The five templates that benefit most from per-episode emphasis (chart fills, accent colors, and highlight elements drive visual identity hardest):

1. **DataChart** — bar fills and accent labels
2. **ChoroplethMap** — contested-actor highlight color (was always `gold`/`amber`; now `emphasis.primaryAccent`)
3. **FrameworkDiagram** — node fills and connection-line colors
4. **TimelineComparison** — era band fills and event accents
5. **KineticTypography** — accent words and emphasis underlines

Other templates (TitleTransition, CrosshairOverlay, MetadataStrip, etc.) keep their default channel-wide treatment since the brand mark and metadata texture are unity anchors that should *not* vary per episode.

### Default behavior

If an episode's `visual-identity.json` is missing or `episodeColorEmphasis` is unset, templates fall back to `neutral` (full palette, `gold` accents). This preserves backward compatibility — existing data files render identically until an episode opts in to emphasis.

### Typographic voice (per-emphasis display font)

Each non-neutral emphasis also carries a `displayFont` chain that mirrors the `text_treatment` axis in `tools/recraft/recraft.py`, so AI-generated cover art and Remotion overlays share a typographic voice (heavy condensed sans for `soviet`, Heiti sans for `chinese-state`, Songti serif for `chinese-traditional`, Hiragino-style sans for `japanese-showa`). FOSS fallbacks for each chain (Oswald, Noto Sans SC, Noto Serif SC, Noto Sans JP) are auto-loaded via `src/design/fonts.ts` so the voice survives on Linux render hosts (CI, Lambda) that don't ship the macOS-native faces. Adding a new emphasis with a non-system font: load it in `fonts.ts` and put the family name in the chain right after the macOS-native lead.

---

## Metadata System

Every composition includes a metadata layer in IBM Plex Mono at `meta` size (11px, letter-spacing 2-3px). This is the "intelligence briefing" texture that makes the brand feel systematic.

### Header strip (top of frame, inside safe area)

Dark mode: `gold` text on transparent
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

- Rubber stamp element (EPISODE XX) in `walnut` (legacy alias: `oxblood`), rotated 2-3°, top-right area
- Thin ruled border inset 40px, 1px `bg.light.border`
- Classification-style label: `PARALLAX // FILE XXX` in IBM Plex Mono

---

## Cartography — Meridian Map Styles

Maps occupy the *Cartograph* lobe of the Meridian brand and need editorial cartography as much as charts need editorial typography. The default Mapbox styles (`light-v11`, `dark-v11`) are designed for routing apps — Parallax wants the opposite register: an **atlas plate** in the lineage of Bartholomew, mid-century Fortune, and contemporary FT/Reuters editorial cartography.

### Custom Mapbox Studio styles

Two custom styles forked from Mapbox **Monochrome** and tuned to the Parallax palette + IBM Plex typography:

| Style | URL (after Studio setup) | Use case |
|---|---|---|
| **Meridian Light** | `mapbox://styles/<account>/<meridian-light-id>` | Default for analytical maps, light-mode episodes |
| **Meridian Dark** | `mapbox://styles/<account>/<meridian-dark-id>` | Atmospheric maps, dark-mode episodes |

Both URLs are wired via env var in `remotion-templates/.env` (`MAPBOX_STYLE_LIGHT_URL`, `MAPBOX_STYLE_DARK_URL`); `theme.ts:mapConfig` reads them with stock-Mapbox fallbacks so the pipeline runs even before the styles are published.

**Setup procedure:** [`tools/mapbox-meridian-setup.md`](../tools/mapbox-meridian-setup.md) — full step-by-step Mapbox Studio recipe (~2 hr).

### Cartographic palette

Source of truth: `mapConfig.styleColors` / `mapConfig.darkStyleColors` in [`src/design/theme.ts`](./src/design/theme.ts).

| Layer | Light | Dark | Rationale |
|---|---|---|---|
| Land fill | `#F5F0E8` (paper) | `#1C1814` (ink) | Reads as paper, not map |
| Water | `#E4DDD3` (paper-tint) | `#100E0C` | Soft, no marketing blue |
| Country border | `#1C1814` (ink) | `#5A5448` (muted) | Single ink-weight stroke, no glow |
| Disputed border | `#A64D46` (`semantic.china`) dashed | `#A64D46` (`semantic.china`) dashed | Editorially-named contests render visually distinct |
| Country label | `#1C1814` ink, IBM Plex Sans Medium, uppercase, letter-spacing 0.06em | `#F0E6D0` bone | Plex Sans matches the brand display register |
| State/province | `#5A5448`, IBM Plex Sans Regular | `#8A8070` | One step below country; uppercase + tight tracking |
| Water label | `#8A8070`, italic-feeling, sparse letter-spacing | `#5A5448` | Subtle — water is felt, not announced |
| Hillshade exaggeration | 0.4 | 0.5 | Pencil-on-paper, not satellite imagery (default Mapbox is 1.0) |

### Cartographic doctrine

These rules apply to every Parallax map regardless of template:

- **Terrain is opt-in, not default.** The single biggest "Google Earth" tell is on-by-default terrain hillshading. As of May 11 2026, `MapGL` defaults `terrain={false}`. Enable per-shot via the template data field when relief is genuinely the point (e.g., a Himalayan supply route). See LESSONS L99.
- **POIs are off.** Atlases don't show coffee shops. The Meridian styles hide every POI label group.
- **Disputed boundaries render dashed in `semantic.china` red (`#A64D46`).** Taiwan Strait, South China Sea nine-dash, Kashmir, Crimea — Parallax names these. Don't suppress them in styles.
- **US worldview, disputed lines visible.** The bounded-analogy doctrine in cartographic form: show the recognized boundary *and* the contested claim.
- **Major roads at 0.15 opacity, all other transit hidden.** Editorial corridors, not navigation.
- **Annotations carry the editorial voice.** Base maps are substrate; `MapAnnotations` (see [`components/MapAnnotations.tsx`](./src/components/MapAnnotations.tsx) and the [map-annotations dossier](./references/template-research/map-annotations.md)) carry the named places, leaders, source notes.

### When to use light vs. dark

| Editorial mode | Style |
|---|---|
| Analytical (data-bearing maps, choropleths, supply chains, comparative geography) | **Meridian Light** |
| Atmospheric (cold-war cartography, naval warfare, historical contest, geopolitical tension) | **Meridian Dark** |
| Default if unspecified | **Meridian Light** (per Parallax's "Light is primary" rule across the brand) |

Templates default to light; opt into dark via `backgroundVariant: "dark"` in the data file.

---

## File Naming Convention

Data files: `{template-type}-{descriptive-slug}.json`
Examples: `choropleth-bifurcation.json`, `kinetic-juguo.json`, `chart-export-controls.json`

Episodes directory: `data/episodes/ep{NN}/`

---

## Quick Reference: Light (Primary) vs Dark (Secondary)

_Note: the table columns are swapped — the first content column is Dark Mode (secondary), the second is Light Mode (primary). The headers are kept in their historical order; read left as Dark, right as Light, per the original "Dossier vs Meridian" framing._

| Element | Dark Mode — secondary (Meridian) | Light Mode — PRIMARY (Dossier) |
|---------|----------------------------------|--------------------------------|
| Background | Radial gradient: `ink` → `bg.dark.base` (warm umber) | Flat `paper` with subtle noise |
| Text primary | `sand` #D9C9B0 (was `bone` #F0E6D0) | `ink` #1C1814 |
| Accent color | `gold` #C4A747 | `walnut` #5C4A3D |
| Metadata text | `text.dark.muted` (`umber`) | `text.light.muted` (`umber`) |
| Crosshair | `gold` at 40-60% | `walnut` at 30-40% |
| ∴ mark | `gold` | `walnut` |
| Image duotone | ink → umber → gold | taupe → bone → paper |
| Card shadow | `0 2px 12px rgba(0,0,0,0.25)` | `0 1px 8px rgba(0,0,0,0.08)` |
| Divider lines | `gold` at 30%, gradient fade | `bg.light.border` (`sand`), gradient fade |
| Stamp element | — (not used) | `walnut`, rotated 2-3° |
| Border frame | — (not used) | 1px inset 40px, `bg.light.border` |
