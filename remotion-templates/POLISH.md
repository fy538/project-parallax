# Visual Polish Specification

> The quality bar for every Remotion composition. If a render doesn't pass these checks, it's not done.
>
> Grounded in reference analysis of CaspianReport (cinematic maps), Wendover Productions (data reveals),
> and PolyMatter (clean data viz). Every rule is concrete and checkable — no subjective "make it look good."
>
> Last updated: April 26, 2026

---

## 1. Animation

The goal: every movement should feel **intentional and weighted**, like objects have mass. No element should appear to be controlled by a spreadsheet.

### Rules

**A1: No linear interpolation.** Every animated property must use an easing function. Default: `Easing.out(Easing.cubic)` for entrances, `Easing.in(Easing.cubic)` for exits. Never `interpolate()` without an easing config.

**A2: Spring physics for primary reveals.** Hero elements (titles, key statistics, map highlights) use `spring()` with `damping: 12-15, mass: 0.8-1.2`. This produces organic overshoot without bouncing. The `gentleSpring()` utility exists — use it.

**A3: Stagger everything with 50-150ms offsets.** Child elements never appear simultaneously. Stagger delays: 50ms for dense lists (chart bars, framework items), 100ms for medium density (timeline events), 150ms for sparse layouts (title elements). Stagger follows spatial logic: left→right or top→bottom.

**A4: Entrance sequence = structure → data → labels.** On data-heavy screens, reveal in layers: (1) axes, grids, backgrounds first, (2) data elements second (bars, lines, map fills), (3) value labels and annotations last. Each layer gets its own stagger offset.

**A5: Subtle secondary motion on data elements.** After a bar finishes growing, add a 100ms micro-settle (spring with high damping). After a statistic finishes counting, hold 200ms then subtly pulse the number (scale 1.0→1.02→1.0 over 300ms). These details register subconsciously.

**A6: Ken Burns on static compositions.** Any screen held for >3 seconds gets a slow drift: either a subtle scale (1.00→1.02 over the full duration) or a slow pan (5-10px translation). This prevents "frozen slide" syndrome.

**A7: Exit animations exist.** Elements don't just cut. If a composition transitions, the last 15-20 frames should fade out key elements (opacity 1→0 with ease-in). Background can hold.

### Timing Reference

| Element type | Enter duration | Stagger delay | Hold minimum |
|-------------|---------------|---------------|--------------|
| Title text | 400-600ms | 150ms between lines | 1.5s |
| Section number | 300ms | — | 1s |
| Chart bar | 500-800ms | 50ms per bar | 0.5s after last bar |
| Data label | 200-300ms | 50ms after its bar | — |
| Map country fill | 300-400ms | 80ms per country | — |
| Timeline event | 400ms | 100ms per event | 0.5s |
| Framework item | 350ms | 80ms per item | 0.3s |
| Route segment | 600-1000ms | 200ms per segment | — |

---

## 2. Layout & Spacing

The goal: every screen should feel **deliberately composed**, with clear visual hierarchy and enough breathing room that the viewer's eye knows where to go.

### Rules

**L1: 8px spacing grid.** All margins, padding, and gaps must be multiples of 8: 8, 16, 24, 32, 40, 48, 64, 80. No arbitrary values like 15, 22, or 70. Define tokens in theme.ts:
```
spacing: { xs: 8, sm: 16, md: 24, lg: 32, xl: 48, xxl: 64, safe: 80 }
```

**L2: 20% minimum negative space.** No more than 80% of the safe area should contain content. For data-dense screens (charts with many bars, comparison frameworks), this means fewer items displayed larger, not more items displayed smaller.

**L3: Consistent inner padding on cards/containers.** Any bordered or shaded container uses `padding: 24px 28px` (vertical, horizontal). Framework diagram nodes, timeline event cards, chart legend boxes — all the same.

**L4: Vertical rhythm via baseline grid.** Text elements align to a 28px baseline grid (body line-height 22px × 1.27 ≈ 28px). This creates subtle vertical order even when elements aren't explicitly aligned.

**L5: Title-to-content gap is always 48px.** Distance between the main title/subtitle block and the first content element below it. Consistent across all templates.

**L6: Source attribution lives at bottom-right.** Always `position: absolute; bottom: safeArea.bottom; right: safeArea.right`. Small text, muted color. Never floats or competes with content.

**L7: Use `contentArea()` helper, not magic offsets.** Never write `top: layout.safeArea.top + 140`. Instead import `contentArea` from theme.ts and use `contentArea("content").top`. The helper computes safe area + title height + 48px gap automatically. Title variants: `"episode"` (220px), `"section"` (160px), `"content"` (92px, default), `"minimal"` (56px).

**L8: Use `columnLayout(n)` for multi-column layouts.** Never compute column widths manually. `columnLayout(2)` returns `{ columnWidth, gap, top, left, right, bottom }` with proper spacing. Default gap is `layout.spacing.xl` (48px).

**L9: All multi-line text needs `maxWidth`.** Every text element that could wrap must have a `maxWidth` constraint. Use tokens from `textMaxWidth`: `h1: 1400, h2: 1200, h3: 900, body: 1100, label: 600, node: 280`. This prevents text from running into adjacent columns, overflowing card boundaries, or spanning the full viewport width.

**L10: Use `cardPadding.css` for all card containers.** Any bordered or shaded container (framework nodes, timeline event cards, info panels) uses `padding: cardPadding.css` (`24px 32px`). This replaces L3's raw values with a token.

**L11: Map compositions zoom to region, not globe.** Default map camera should show the relevant geographic area, not two dots on opposite sides of a globe. Use `cameraPresets` from theme.ts: `eastAsia`, `china`, `taiwan`, `transatlantic`, `europe`, `semiconductorBelt`, etc. Reserve `globe` preset only for compositions that genuinely need a world view. Minimum zoom per scope: country = 4.5+, region = 3.5+, continent = 2.5+, global = 1.5.

**L12: No hardcoded shadow strings.** Use shadow tokens from theme.ts: `shadows.subtle`, `shadows.medium`, `shadows.accentGlow(color)`, `shadows.textLift`. Never write `"0 1px 3px rgba(0,0,0,0.5)"` inline.

**L13: Use `<TitleBlock>`, don't hand-build title blocks.** Every data template (DataChart, FrameworkDiagram, TimeSeriesChart, GameBoard, DecisionTree, SankeyFlow, ProbabilityGauge) uses the shared `TitleBlock` component from `../../components/TitleBlock`. It enforces L5 (48px gap), L9 (maxWidth), T1-T3 (typography hierarchy), and L14 (mode-aware colors) in a single import. Props: `title`, `subtitle`, `mode` (pass `backgroundVariant`). Exceptions: KineticTypography (IS the text), TitleTransition (full-screen), ChoroplethMap (overlay-style), TimelineComparison (dual column headers), NetworkDiagram (SVG text).

**L14: Use `useThemeMode()`, never reference `light.text.*` or `dark.text.*` directly.** Import `useThemeMode` from `../../hooks/useThemeMode`. Pass `data.backgroundVariant` and destructure `{ text, accent, bg }`. This prevents contrast bugs when a dark-tinted composition uses light-mode text colors. TitleBlock uses this internally — templates only need the hook for their own content elements.

### Safe Area Usage

```
┌──────────────────────────────────────────────────────────────┐
│  80px safe area                                              │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Title block (top 15% of safe area)                  │    │
│  │                                                      │    │
│  │  48px gap                                            │    │
│  │                                                      │    │
│  │  Content area (middle 70%)                           │    │
│  │                                                      │    │
│  │                                                      │    │
│  │                                                      │    │
│  │                                          Source ──┘  │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Visual Richness

The goal: compositions should feel **layered and dimensional** — like graphics placed on a surface with light falling on them — not like colored rectangles on a flat canvas.

### Rules

**V1: Three-layer depth system.** Every composition has three visual planes:
- **Background** (z=0): dark gradient or textured surface, never solid flat color
- **Content layer** (z=1): cards, charts, text blocks — with subtle drop shadow
- **Accent layer** (z=2): highlighted elements, key data points — with glow or stronger shadow

**V2: Backgrounds are gradients, not flat colors.** Dark mode: radial gradient from `ink` (#1A1A2E) center to `bg.dark.base` (#0D0D1A) edges, or linear gradient 5-10% darker at bottom. Light mode: flat `paper` (#F5F0E8) with subtle noise (2-3% opacity). This creates a subtle vignette (dark) or textured surface (light) that focuses attention on center content.

**V3: Content elements have shadows.** Every card, chart bar, framework node, and timeline event card gets a drop shadow. Shadow spec:
- **Subtle** (default): `0 2px 12px rgba(0, 0, 0, 0.25)` — barely visible, just enough lift
- **Medium** (highlighted elements): `0 4px 20px rgba(0, 0, 0, 0.35)`
- **Accent glow** (key data, active map country): `0 0 16px {accentColor}40` — colored halo

**V4: Chart bars have internal gradient.** Bars aren't flat fills. Each bar gets a top-to-bottom linear gradient: base color at top → 15% darker at bottom. This simulates overhead lighting and makes bars feel solid.

**V5: Dividers and borders have purpose.** Horizontal dividers (title underlines, section separators) are `2px` with gradient fade: full opacity in center → transparent at edges. Width: 60-80% of container, centered. Never full-width with hard edges.

**V6: Map countries have edge treatment.** Active (highlighted) countries get a 1px lighter stroke plus a subtle outer glow matching their fill color. Inactive countries use a 0.5px dark stroke. This prevents the "coloring book" look.

**V7: Text blocks over dark backgrounds get a subtle text shadow.** Not a drop shadow — a `0 1px 3px rgba(0,0,0,0.5)` to lift text off the background. Applied to all body text and captions, not to large titles (which are heavy enough on their own).

### Depth Reference (per template)

| Template | Background | Content shadow | Accent treatment |
|----------|-----------|---------------|-----------------|
| TitleTransition | Radial gradient vignette | — | Title has text glow on accent color |
| DataChart | Linear gradient (top lighter) | Bars have internal gradient + shadow | Highlighted bar gets outer glow |
| KineticTypography | Radial gradient vignette | Quote card has subtle shadow | Statistic number has accent glow |
| FrameworkDiagram | Linear gradient | Node cards have shadow + border | "vs" divider has accent color glow |
| TimelineComparison | Linear gradient | Event cards have shadow | Connection lines have soft glow |
| ChoroplethMap | Dark overlay on map | Phase info panel has shadow | Active countries have outer glow |
| RouteAnimation | Dark overlay on map | — | Active route segments have trail glow |

---

## 4. Typography

The goal: text should have **clear visual hierarchy at a glance** — the viewer should know what's the title, what's the data, and what's the footnote without reading any of it.

### Rules

**T1: Three-tier type hierarchy per screen.** Each composition uses exactly three text sizes:
- **Primary** (the thing you read first): 48-64px, weight 700, Space Grotesk
- **Secondary** (supporting context): 22-28px, weight 400-500, Space Grotesk
- **Tertiary** (labels, sources, captions): 14-18px, weight 400, IBM Plex Mono or JetBrains Mono for data

No screen should have more than 3 tiers. If it needs 4, the design is too dense — split it.

**T2: Headers get letter-spacing.** All text ≥36px gets `letterSpacing: 1.5-3px`. This opens up headlines and prevents them from looking cramped. Body text gets `letterSpacing: 0`. Data labels (JetBrains Mono) get `letterSpacing: 1px`.

**T3: Weight contrast between tiers.** The jump between primary and secondary weight must be ≥200 (e.g., 700 vs 500, 600 vs 400). Insufficient weight contrast is why everything looks "samey."

**T4: Line-height by purpose.**
- Headings: `lineHeight: 1.1` (tight — titles shouldn't float)
- Body/quotes: `lineHeight: 1.5` (readable)
- Data labels: `lineHeight: 1.2` (compact, attached to data)
- Chinese text: `lineHeight: 1.6` (CJK needs more vertical space)

**T5: Color creates hierarchy too.** Dark mode: Primary text `bone` (#F0E6D0). Secondary: `text.dark.secondary` (#B8AE9C). Tertiary: `text.dark.muted` (#6A6458). Light mode: Primary `ink` (#1A1A2E). Secondary: `text.light.secondary` (#4A4538). Tertiary: `text.light.muted` (#8A8070). Accent text: `amber` (dark) or `oxblood` (light).

**T6: Chinese text is always Noto Sans SC with explicit `fontFamily`.** Per L13. Chinese body text runs 10-15% larger than equivalent English to maintain optical size parity (CJK characters are denser).

**T7: Statistic numbers use JetBrains Mono at 2.5-3x body size.** A key stat like "7%" should be 72-96px in monospace — visually dominant, anchoring the screen. The unit/suffix inherits the same font but at 50% of the number size.

### Type Scale Reference

| Token | Size | Weight | Spacing | Line-height | Usage |
|-------|------|--------|---------|-------------|-------|
| display | 96px | 700 | 3px | 1.0 | Hero statistics |
| h1 | 64px | 700 | 2px | 1.1 | Episode titles |
| h2 | 48px | 700 | 2px | 1.1 | Section titles |
| h3 | 36px | 600 | 1.5px | 1.2 | Subsection / chart titles |
| body | 22px | 400 | 0 | 1.5 | Narration text, descriptions |
| label | 18px | 500 | 1px | 1.2 | Data labels, axis labels |
| caption | 14px | 400 | 0.5px | 1.4 | Sources, footnotes |

---

## QA Checklist

Before any composition is considered done, verify against this checklist:

### Animation
- [ ] No linear interpolation anywhere (grep for `interpolate` without `easing`)
- [ ] Hero elements use spring physics
- [ ] Child elements stagger (never appear simultaneously)
- [ ] Data screens reveal in layers: structure → data → labels
- [ ] Compositions >3s have subtle Ken Burns drift
- [ ] Last 15-20 frames have exit fade

### Layout
- [ ] All spacing values are multiples of 8 (no magic numbers — use `layout.spacing.*` tokens)
- [ ] Content fills ≤80% of safe area
- [ ] Title-to-content gap uses `contentArea()` helper (L7) — no hardcoded pixel offsets
- [ ] Multi-column layouts use `columnLayout(n)` helper (L8)
- [ ] Source attribution at bottom-right in muted text
- [ ] Cards/containers use `cardPadding.css` (L10)
- [ ] All multi-line text has `maxWidth` from `textMaxWidth` tokens (L9)
- [ ] Map compositions use regional `cameraPresets`, not globe default (L11)
- [ ] Shadows use `shadows.*` tokens, no inline shadow strings (L12)
- [ ] No `+ 60`, `+ 40`, `+ 120` magic offsets on safe area positions
- [ ] Title block uses `<TitleBlock>` component, not hand-built (L13)
- [ ] Colors come from `useThemeMode()`, not `light.text.*` / `dark.text.*` directly (L14)

### Border Safety & Clipping
- [ ] No text partially visible at frame edges (Background.tsx clips, but content should be inward)
- [ ] Dynamic/data-driven text uses `textSafe.*` utilities (ellipsis, wrap, clamp, bounded)
- [ ] Map labels don't cluster at viewport edges (adjust camera center or label positions)
- [ ] Animated camera templates stagger: camera → shapes → labels (L56 timing sequence)
- [ ] Long labels (city names, data values) have overflow protection
- [ ] All content respects 80px safe area — verify at frame 0 AND mid-animation AND final frame

### Visual Richness
- [ ] Background is a gradient, not flat color
- [ ] Content elements have drop shadows
- [ ] Chart bars have internal gradient
- [ ] Dividers fade at edges
- [ ] Highlighted elements have accent glow
- [ ] No "flat rectangles on flat background" anywhere

### Typography
- [ ] Exactly 3 text size tiers per screen
- [ ] Headers have letter-spacing ≥1.5px
- [ ] Weight contrast ≥200 between primary and secondary
- [ ] Line-heights match the T4 spec
- [ ] Chinese text uses Noto Sans SC at 10-15% larger
- [ ] Source text uses `text.dark.muted` or `text.light.muted`

---

## Implementation Priority

These changes should be applied in this order (shared infrastructure first, then template-specific):

1. **theme.ts** — Add spacing tokens, shadow tokens, gradient generators, updated type scale
2. **animation.ts** — Wire up spring physics, add entrance sequences, exit fade utility
3. **Background.tsx** — Replace flat fills with gradients
4. **FadeIn.tsx** — Add spring option, exit animation support
5. **DataChart** — Bar gradients, shadows, layered reveal sequence
6. **TitleTransition** — Text glow, gradient divider, spring on title
7. **KineticTypography** — Stat glow, quote card shadow, spring count-up
8. **FrameworkDiagram** — Node shadows, stagger fix, divider glow
9. **TimelineComparison** — Event card shadows, connection line glow
10. **ChoroplethMap** — Country edge treatment, phase panel shadow
11. **RouteAnimation** — Segment trail glow, point pulse spring

Each template update follows the same pattern: apply depth (V rules) → fix spacing (L rules) → upgrade animation (A rules) → verify typography (T rules) → run QA checklist.
