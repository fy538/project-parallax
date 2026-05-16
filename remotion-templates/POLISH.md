# Visual Polish Specification

> The quality bar for every Remotion composition. If a render doesn't pass these checks, it's not done.
>
> Grounded in reference analysis of CaspianReport (cinematic maps), Wendover Productions (data reveals),
> and PolyMatter (clean data viz). Every rule is concrete and checkable — no subjective "make it look good."
>
> **Companion doc:** [`POLISH_IMPLEMENTATION.md`](./POLISH_IMPLEMENTATION.md) — the 4-layer architecture spec (per-element / animation / composition / brand) showing *which infrastructure* makes each rule below cheap to follow. Read this file for *what* must pass; read implementation for *how* the system is built to make it easy.
>
> Last updated: May 16, 2026 (added D17.1 per-element anticipatory-reveal sub-rule; aligned drift Phase numbering with HOLD_MOTION_REGISTER.md)

---

## 1. Animation

The goal: every movement should feel **intentional and weighted**, like objects have mass. No element should appear to be controlled by a spreadsheet.

### Rules

**A1: No linear interpolation.** Every animated property must use an easing function. Default: `Easing.out(Easing.cubic)` for entrances, `Easing.in(Easing.cubic)` for exits. Never `interpolate()` without an easing config.

**A2: Spring physics for primary reveals.** Hero elements (titles, key statistics, map highlights) use `spring()` with `damping: 12-15, mass: 0.8-1.2`. This produces organic overshoot without bouncing. The `gentleSpring()` utility exists — use it.

**A3: Stagger everything with 50-150ms offsets.** Child elements never appear simultaneously. Stagger delays: 50ms for dense lists (chart bars, framework items), 100ms for medium density (timeline events), 150ms for sparse layouts (title elements). Stagger follows spatial logic: left→right or top→bottom.

**A4: Entrance sequence = structure → data → labels.** On data-heavy screens, reveal in layers: (1) axes, grids, backgrounds first, (2) data elements second (bars, lines, map fills), (3) value labels and annotations last. Each layer gets its own stagger offset.

**A5: Subtle secondary motion on data elements.** After a bar finishes growing, add a 100ms micro-settle (spring with high damping). After a statistic finishes counting, hold 200ms then subtly pulse the number (scale 1.0→1.02→1.0 over 300ms). These details register subconsciously.

**A6: Editorial drift register (revised May 14, 2026).** Any screen held for >3 seconds gets a slow drift via `useCompositionAnimation()`. The **default register is `editorial`**: a barely-perceptible inward zoom only (scale 1.00→1.02, no pan, no rotation). Charts stay level, content does not slip toward the bottom-right, axis baselines never tilt — the channel reads as print-newsroom + film, not as handheld documentary camera.

Eight presets are available via `_direction: { driftPreset: "<name>" }`:

| Preset | Mode | Scale | Pan X | Pan Y | Rotation | Use case |
|---|---|---|---|---|---|---|
| `none` | — | — | — | — | — | Maps, interactive comps, catalog showreel |
| `editorial` *(default)* | linear | 1.02 | 0 | 0 | 0 | Charts, all dataviz (the new safe default) |
| `slow` | linear | 1.03 | 8 | 4 | 0.15 | Back-compat — kept for existing episodes |
| `normal` | linear | 1.06 | 18 | 8 | 0.3 | Back-compat — kept for existing episodes |
| `documentary` | linear | 1.06 | 18 | 8 | 0.3 | **Explicit Ken Burns** — atmospheric / photo segments only, NEVER charts |
| `breathing` | breathing | 1.008 | 0 | 0 | 0 | Long-held stat reveals — 8s sinusoidal scale oscillation |
| `settle` | settle | 1.025 | 0 | 0 | 0 | Title cards, dividers — one-time settle in 0.6s, then HOLD |
| `sway` | sway | 1.0 | 6 | 4 | 0 | Atmospheric photo plates — bidirectional pan, no net displacement |

**Hard rule:** charts use `editorial` (default) or `none`. Documentary register (the 0.3° rotation in particular) tilts axis baselines visibly even when "imperceptible"; it's reserved for photo-driven segments where axes don't exist. The catalog showreel wraps every demo in `still()` to render all 33 demos drift-free for evaluation.

`contentArea()` reserves an 18×8px safety margin regardless of the current default — this means episodes that opt into `documentary` still can't drift past the safe-area boundary. The reserve is decoupled from `motionBudget`. Use `noDrift: true` directly only when applying manual Ken Burns to avoid compounding.

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

**L13: Use `<TitleBlock>`, don't hand-build title blocks.** Every data template (DataChart, FrameworkDiagram, TimeSeriesChart, GameBoard, DecisionTree, SankeyFlow, ProbabilityGauge) uses the shared `TitleBlock` component from `../../components/TitleBlock`. It enforces L5 (48px gap), L9 (maxWidth), T1-T3 (typography hierarchy), and L14 (mode-aware colors) in a single import. Props: `title`, `subtitle`, `mode` (pass `backgroundVariant`). Exceptions: KineticTypography (IS the text), TitleTransition (full-screen), TimelineComparison (dual column headers), NetworkDiagram (SVG text), and **Mapbox templates** (`RouteAnimation`, `ChoroplethMap`, `DensityMap`) — these render the map edge-to-edge with **no title overlay** per the May 13, 2026 Mapbox→AtlasPlate doctrine. Titles for Mapbox-rendered shots come from script voice-over or a preceding `TitleTransition` composition; see `MAP_TEMPLATE_SELECTOR.md`.

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
- **Primary** (the thing you read first): 48-64px, weight 600-700, IBM Plex Sans
- **Secondary** (supporting context): 22-28px, weight 400-500, IBM Plex Sans
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

---

## Editorial Doctrine (added May 10, 2026)

Compiled from session-by-session diagnoses of templates that "felt off." These are the recurring patterns that show up across the catalog. Read this section before doing polish work on any template — most "what's wrong with this composition" diagnoses reduce to one of these.

Each rule has the form: **observation → fix → why**. Cross-references to `references/template-research/<template>.md` when the rule has a deeper canonical backing.

### D1. Drop card chrome on editorial frames

**Observation:** Rounded-corner subtly-tinted rectangles around every content block read as Bootstrap settings panel / PowerPoint slideware, not editorial. They create competing surfaces with the paper background.

**Fix:** Items sit directly on the paper. Thin row dividers (1px low-opacity rule) replace card boundaries. Accent left-edge for hierarchy (in outcome color, framework color, etc.) — not a full card.

**Why:** The brand is intelligence-briefing on paper. Floating cards make the paper into a substrate for floating UI elements. NYT Upshot, FT, Economist, Pudding don't card-wrap.

**Where it lands:** every template with items in a list or grid — FrameworkDiagram (comparison / flow / matrix), DuelingFrameworks tenets, ProbabilityGauge scorecard, SplitComposition items.

---

### D2. Mirrored alignment creates a center valley

**Observation:** In N-column layouts where right column is `textAlign: "right"` and left is `textAlign: "left"`, both columns push text toward the center divider, leaving the outer edges of the canvas empty AND creating a tight center valley. Looks marooned in the upper-center.

**Fix:** Both columns use natural `textAlign: "left"` (or center if compositionally needed). Content fills each column from its inner edge outward.

**Why:** Newspaper 2-column layouts use mirroring on purpose (gutter at the spine), but newspapers fill columns vertically. When content occupies only the top third + mirrored alignment, the eye sees two narrow text strips squeezed toward center with dead air everywhere else.

**Where it lands:** SplitComposition (was mirrored, now natural left-align).

---

### D3. Vertically center content when there isn't enough to fill

**Observation:** Templates top-anchor their content, leaving 50–70% of the canvas empty below. Reads as cropped or unfinished.

**Fix:** `justify-content: center` on the content container OR shift content down by computing midpoint between title bottom and footer top.

**Why:** Empty paper below content reads as "the chart got cut off" or "loading…" The composition should occupy the canvas it's allocated.

**Where it lands:** SplitComposition, RadarChart (centered the chart+legend cluster), FrameworkDiagram comparison.

---

### D4. Use ordinal numbering for sequential or comparative items

**Observation:** Lists of items at uniform weight have no scanning index. Viewer can't tell which is first, which is the protagonist, where they are in the sequence.

**Fix:** Numbered ordinals (01, 02, 03…) in mono caps in the accent color or column color. Force parallelism in comparison columns (if you can't write item #4 for both sides, the comparison isn't ready).

**Why:** Ordinals are the editorial reading aid. NYT Upshot uses them; HBR uses them; Stratechery uses them. They also force the data writer to be honest about parity.

**Where it lands:** FrameworkDiagram comparison + flow + matrix (Q1-Q4), DuelingFrameworks tenets (if needed), any sequential list.

---

### D5. Hero/supporting hierarchy when one item is the protagonist

**Observation:** Every line/bar/node renders at the same visual weight. The protagonist (e.g., the line the narrator is about to discuss, the bar that's the punchline) doesn't stand out.

**Fix:** Single hero element gets accent color + heavier stroke / larger size / glow halo. Everything else mutes to taupe / 30% opacity / smaller stroke.

**Why:** The protagonist is the editorial point of the frame; the eye should land there in <300ms.

**Where it lands:** TimeSeriesChart (hero line via `hero: true`), DataChart (highlightIndex), PricingWaterfall (hero stage), FrameworkDiagram flow (terminal hero node), matrix (FOCUS quadrant).

---

### D6. Geographic data belongs on a map, not a schematic

**Observation:** Cities, countries, real places rendered as nodes-and-edges in NetworkDiagram. Loses all the editorial information geography carries (distance, neighbors, terrain).

**Fix:** If your nodes are named geographic places, use a map (ChoroplethMap, RouteAnimation). NetworkDiagram is for *relationship structure where geography is irrelevant* — supply-chain chokepoints, citation graphs, coalition diagrams, concept maps.

**Why:** "All roads led to Rome" is literally a fact about geography. Showing Londinium / Alexandria / Carthago as 5 circles around a center circle throws away the editorial meaning.

**Where it lands:** Documented in `references/template-research/route-animation.md` and `VISUAL_LANGUAGE.md` ("Map vs. Network Diagram"). NetworkDiagram catalog was updated from Roman roads to TSMC chip-supply chokepoint for this reason.

---

### D7. Arbitrary numbers aren't data

**Observation:** Score bars (76%, 71%) on framework comparisons; "ratings" with no source. Dresses up an editorial assertion as a measurement.

**Fix:** Drop the fake quantification. Use the verbal verdict directly ("Explains the tempo and timing"). Hero stat callouts must be derived from actual data (with source attribution).

**Why:** Numbers without methodology imply rigor that wasn't earned. The verbal verdict is the rhetorical clincher; the bar chart is data-viz junk. Economist doesn't put scoring bars on framework comparisons — they let the prose do the work.

**Where it lands:** DuelingFrameworks scoring phase (score bars removed May 10, 2026; per-framework verdict captions + verdict question kicker only).

---

### D8. Sequential progressions need direction cues

**Observation:** Flow diagrams with nodes-and-lines but no arrows, chevrons, or numbered stages. Eye can't tell which way the journey runs.

**Fix:** Spine line + chevrons (or numbered ordinals). Hero terminal node (the destination earns weight).

**Why:** A flow is meaningless without direction. Equal-spaced nodes connected by lines is a graph, not a sequence.

**Where it lands:** FrameworkDiagram flow variant. See `references/template-research/framework-diagram.md` for canon.

---

### D9. Terminal value labels anchor line-chart endings

**Observation:** Multi-line time-series charts where lines just end. Viewer doesn't know which line is which without consulting a legend (forcing eye ping-pong).

**Fix:** Each line gets its name + final value labeled at the right edge, stacked to avoid collision. NYT format: "Asia · 4,712M". Skip the legend.

**Why:** The viewer's eye lands at line endings anyway. Putting the identifier there removes the legend round-trip.

**Where it lands:** TimeSeriesChart (implemented). See `references/template-research/time-series-chart.md` for canon.

---

### D10. Y-axis must not overshoot data

**Observation:** Y-axis tops out at 6,000 when max data is 4,500. Wastes 25% of vertical canvas on dead space.

**Fix:** Headroom should be ≤10% above max value. Use nice ticks but don't round up generously.

**Why:** Empty space at the top flattens the trajectory and starves the chart of visual mass.

**Where it lands:** TimeSeriesChart (headroom changed 10% → 5% in session). Audit any chart with a fitted y-axis.

---

### D11. X-axis ticks should be readable, not minimal

**Observation:** 3-tick x-axis (start / middle / end) on a 124-year span. Middle value (1962) is arbitrary; viewer has no temporal context for the bend.

**Fix:** Adaptive ticks at decade or quarter-century intervals — 6–7 ticks at human-readable steps. Always include first and last.

**Why:** Sparse ticks force viewers to extrapolate. Editorial readers want to know "what year was that inflection?"

**Where it lands:** TimeSeriesChart (implemented). Audit any line chart with year axes.

---

### D12. Annotations connect to data points, not float in corners

**Observation:** "Crosses 400 ppm" as floating text top-right of the chart, disconnected from where the line actually crosses 400.

**Fix:** Annotation = vertical hairline from axis to data point + label leader pointing to the point. Interpolate between data points when annotation X doesn't match a sample.

**Why:** Floating annotations look like captions, not data marks. They lose the editorial connection between the moment and the place on the chart.

**Where it lands:** TimeSeriesChart (interpolation fix + leader-line positioning landed in session).

---

### D13. Distinguish `fonts.body` (Plex Sans, paragraphs) from `fonts.metadata` (Plex Mono, labels)

**Observation:** Editorial paragraphs render in IBM Plex Mono (typewriter style) because `fonts.body` was renamed during font migration. Tenets, items, subtitles all look like a transcript.

**Fix:** `fonts.body` = IBM Plex Sans (paragraph text). `fonts.metadata` = IBM Plex Mono (kicker labels, axis labels, source attribution, captions). `fonts.mono` is an alias for `fonts.metadata`. Don't use `fonts.body` for kicker labels or `fonts.metadata` for paragraphs.

**Why:** Body text in editorial design is never mono. Mono is the *evidence layer* — coordinates, dates, classifications, file numbers. Mixing them up makes paragraphs read as code and kicker labels read as headlines.

**Where it lands:** Theme.ts + BRAND.md updated May 10, 2026. Audit any template that uses `fonts.body` on long paragraph text.

---

### D14. Axis labels go ON the axes, not floating in margins

**Observation:** Matrix with "Urgent / Not Urgent" floating in the margins, not anchored to the axes.

**Fix:** Axes are drawn as actual lines with directional arrows ("↑ More Important", "← More Urgent"). Labels live ON the axes.

**Why:** Floating axis labels read as a legend; axes-as-axes read as space. The matrix's coordinate logic only works when the axes are visible.

**Where it lands:** FrameworkDiagram matrix variant (implemented).

---

### D15. Wrap absolutely-positioned elements in a positioning context

**Observation:** TitleBlock not rendering in NetworkDiagram because it was wrapped in FadeIn (which has a transform creating a zero-sized stacking context). Title positioned `absolute, top: safe.top` ended up relative to FadeIn's zero box, not the AbsoluteFill.

**Fix:** Wrap TitleBlock (and similar absolute-positioned components) in a `<div style={{ position: "absolute", inset: 0 }}>` to ensure the positioning context is the canvas, not the transformed parent.

**Why:** CSS transforms create new containing blocks for absolute-positioned children. Wrappers that look benign (FadeIn with transform: scale) silently break absolute positioning.

**Where it lands:** NetworkDiagram (title was missing for many frames before this fix). Watch for similar patterns in any template wrapping positioned components in FadeIn / animated wrappers.

---

### D16. The composition should look intentional, not like an asset accidentally cropped

**Observation:** Content occupies one quarter of the canvas (e.g., a matrix in the lower-right corner; a chart left-anchored with empty right half). Looks like the canvas was bigger than the design accounted for.

**Fix:** Either expand the chart to fill its allocated area, or explicitly use the empty space (editorial commentary, kicker stat, pull-quote). Don't leave dead paper.

**Why:** Empty canvas reads as accidental — like a slide that got pasted in but didn't resize. Editorial frames either fill their space or use it deliberately.

**Where it lands:** FrameworkDiagram matrix (was cornered, now fills canvas), NetworkDiagram (was off-center, now centered).

### D17. Reveals must complete BEFORE the narrator names the element

**Observation:** Element lands on the same frame the narrator says its name (or worse, after). The viewer's eye is still resolving the animation when the word arrives, so the moment of recognition is muddled.

**Fix:** Time reveals so the element is *settled* (opacity 1, no motion) ~150ms BEFORE the narration cue. Use `anticipatoryReveal(frame, narrationCueFrame)` or `anticipatoryStartFrame(narrationCueFrame)` from `utils/animation.ts` — defaults match the Economist editorial convention (5 frames anticipation, 12 frames settle at 30fps).

**Why:** Editorial video lives or dies on this single move. **The Economist** video team built their reputation on it. When the element is already on screen when the narrator names it, the viewer's brain registers *confirmation* — "yes, that thing." When the element lands on the word, the brain registers *competition* — "what am I looking at vs. what am I hearing." Anticipation reads as intentional; coincidence reads as PowerPoint.

**Where it lands:** Threaded through templates as Whisper-resolved narration cues come online. Per-template adoption tracked in `references/template-research/motion-design.md` § 8.

#### D17.1 Per-element variant — each entity settles before its OWN word

**Observation:** Single-cue D17 anchors the first element's reveal to the first narration word — but in templates that surface multiple labeled entities (callouts, nodes, rows), the LATER entities still drift relative to the narrator. By the third callout, the viewer hears "Taiwan" while a Korea node is still settling.

**Fix:** Authoring layer emits `_direction.syncPoints[]` positionally indexed against the rendered entities — `syncPoints[i]` is the narration cue for `data.nodes[i]` (or callouts, or rows). Each entity calls `anticipatoryStartFrame(syncPoints[i].frame, SETTLE)` independently. When per-element cues are absent, the template falls back pixel-identically to the legacy single-cue + stagger formula, so existing manifests are unaffected.

**Where it lands:** Shipped May 16, 2026 across seven analytical templates:
- **AnnotatedImage** — `syncPoints[0]` is the image cue, `syncPoints[1..N]` map to callouts 1..N
- **ArcDiagram, BumpChart, EscalationLadder, FrameworkDiagram, HorizontalTimeline, NetworkDiagram** — `syncPoints[i]` maps 1:1 to the i-th entity in the template's primary data array (nodes, rows, rungs)

DIR vocabulary: `DIR: syncs:["taiwan","korea","japan"]` in scripts emits the per-element `syncPoints` block via `generate_manifest.py`. Lint enforcement: **M-SYNC** rules in `tools/lint/manifest_lint.py`. Per-element conventions documented per-template in [`references/template-schemas.md`](./references/template-schemas.md) → "Per-element sync".

**Why care about the variant:** Multi-entity templates are where Parallax's argument density actually lives — a Network Diagram of alliances, a Framework matrix of stakeholders, an Escalation Ladder with seven rungs. Single-cue D17 was the prototype; per-element D17 is the production-ready form.

### D18. Episode openings hold music until AFTER the title card lands

**Observation:** Music starts in the first 3 seconds of the cold open. Reads as YouTube-explainer register, not editorial-essay register.

**Fix:** **Music enters only after the title card exits, not during the cold open and not during the title card itself.** The cold open is a single artifact (archival photo, single analytical visual, or text on paper) held with measured narration and *silence*. The title card lands in silence. Then music swells under the first body segment.

**Why:** Every YouTube explainer enters music in the first 3 seconds. The silence is the channel's differentiation. The Economist, NYT, FT, Atlantic, and Op-Docs all hold music until after the title card lands — this is the single strongest cross-outlet convention in editorial video. Parallax's silence at the open IS the register signal.

**Companion rules** (all from `references/template-research/title-card.md` § 4):
- Cold-open runtime ≤ 2% of episode length (10-14s for 15min, 15-25s for 30min)
- Title-card hold = 2.0s on screen (below 1.0s flashes past; above 3.0s reads as forgot-to-cut)
- Hard cut between cold open and title card — no wipes, no dissolves, no motion transitions
- No audio sting on title-card landing (broadcast convention, not editorial)
- Opener narration is substantive (first line is a claim or question, NOT "in this video we'll...")

### D19. Relationship diagrams use precision markers, not filled discs

**Observation:** Big filled circles with stroke rings, sized 3:1 hub-to-satellite for hierarchy, read as "bubble chart" or "marbles" rather than intelligence-briefing diagram — the form viewers associate with PowerPoint templates and game UI, not editorial argument. Even with proper hierarchy (large hub, small satellites), the visual register undermines the rigor of the claim.

**Fix:** For hub-spoke, bipartite, and arc-style relationship diagrams, render nodes as **precision markers**:
- Small filled dot (r=8–14 satellite, r=72 hub-disc as the editorial focal mass)
- Crosshair hairlines extending from the dot center (4 lines, ~16–22px length at 45–50% opacity) — reads as a reticle / annotation, not a bubble
- For the hub specifically: concentric rings outside the disc (r+12 inner, r+28 outer) at decreasing opacity (0.35, 0.18) — a "target lock" treatment
- Labels positioned at the end of an outward-bearing leader line (away from hub center), not below the marker — this earns reading order through line direction rather than fixed positioning
- Edges between markers stay thin (1.5px, not 3.25px), no glow halo — the markers carry the argument, not the connectors

**Reference implementation:** `templates/NetworkDiagram/NetworkDiagram.tsx` → `AnnotationNode` component + `HUB_*`/`SAT_*` geometry constants. The pattern transfers to ArcDiagram (relationship-over-time) and any diagram where viewers should read "who" and "to whom" without being distracted by container chrome.

**Where it lands:** NetworkDiagram (May 15, 2026), ArcDiagram (May 16, 2026). When building any new template whose primary content is named entities + their connections, default to this aesthetic rather than the filled-circle baseline.

**Why:** Bloomberg / The Economist / FT supply-chain diagrams converge on precision markers for the same reason — the editorial claim ("X depends on Y") needs to read at video-scrubbing speed without competing visual weight from the markers themselves. Marbles compete; reticles annotate.

**Where it lands:** `TitleTransition` `editorial-title` variant enforces the visual side (2.0s hold, fade-only, ∴ corner mark). Music and SFX are audio-track decisions made downstream in NLE assembly; this doctrine governs both.

### D20. Hold-beat motion is editorial register, not decoration

**Observation:** After D17 anticipatory entrance lands the element and before A7 exit fade kicks in, there's a 2–8 second window where the element is just *on screen*. The Phase 0 audit (May 16, 2026) found five templates rendering byte-identical (or near-identical) frames during this window — `ImageComposite-archive` showed **0 pixels different** between frame 90 and frame 150. Total stillness for two seconds on a historical photograph or atlas plate reads as a PowerPoint slide, not as documentary video.

**Fix:** Pick a hold-motion technique whose implicit claim matches what kind of element this is. Eight canonical techniques, six of which are already implemented as `DRIFT_PRESETS` entries:

| Technique | Preset | Implicit claim |
|---|---|---|
| Stillness | `none` | "document of record; nothing should compete with reading" |
| Editorial drift | `editorial` (current default) | "analytical content; the screen is barely alive, intentionally" |
| Breathing | `breathing` | "this single idea is held and alive" |
| Settle | `settle` | "this composition established itself and is now waiting" |
| Sway | `sway` | "this view is held with subtle life, no directional slip" |
| Documentary Ken Burns | `documentary` | "this image is a master shot; meaning accrues through duration" |
| Atmospheric particles | (FilmOverlay substrate layer) | "the world around this scene is alive" |
| Mood pulse | (component chrome) | "this single accent is responding to tension" |

Default-on-every-template is itself a wrong choice. Charts use `editorial`. Photo plates use `documentary`. Atlas plates use `breathing` (scale-only, projection-safe) or `sway`. Held quotes use `breathing` or `stillness` (for memorial moments). Dark cinematic scenes use atmospheric particles at substrate + an element-level technique.

**Anti-patterns:**
- Uniform continuous-zoom across every shot (YouTube-explainer signature; flag `driftPreset: "normal"` as global default)
- Particle layers on light/paper substrate (reads as game UI; FT/Economist/NYT never do this)
- Independent layer drifts — foreground text drifting while background photo drifts opposite direction (parallax mismatch causes motion sickness per OpenNews 2018; Gestalt Common Fate violation)
- Rotation drift on charts (tilts axis baselines; `documentary` preset notes call this out explicitly)
- Visible breathing on multi-element charts (bars appear to be "growing"; false data signal)

**Reference implementation:** `DRIFT_PRESETS` + `useCompositionAnimation()` already wire the technical surface. Per-template defaults via `TEMPLATE_DRIFT_DEFAULTS`, per-segment script directives (`DIR: drift(<preset>)` and `DIR: hold(stillness)`), and the catalog showcase are sequenced inside the ongoing HOLD_MOTION work — see `project/HOLD_MOTION_REGISTER.md` for the current implementation status and roadmap. (The Phase 3/4/5 numbering that previously appeared in this section was non-standard relative to the canonical doctrine; refer to HOLD_MOTION_REGISTER.md instead.)

**Canonical doctrine:** `project/HOLD_MOTION_REGISTER.md` (May 16, 2026) — full register doc with per-template recommendations, decision matrix, and per-technique editorial register. `references/template-research/hold-motion.md` is the outlet-research dossier (NYT VI, FT, Economist, Bloomberg, Reuters, Vox Atlas, PBS Frontline, Cinemagraphs 2011, Ken Burns) the doctrine derives from.

---

## Timeline Visual Discipline (added May 12, 2026)

Six rules specific to timeline templates (`HorizontalTimeline`, `EscalationLadder`). Catches the "looks unprofessional" failure mode that survives the template-fit pass. The `timeline-audit` skill checks these alongside template-fit rules; cite the rule ID (T1–T6) when filing a finding.

### T1. Entrance settled by frame 30

**Observation:** Title or era-label entrance animation still in motion at frame 30 (1 second in) — chromatic kick, slide-in, scale pulse — produces still-preview captures that look unstable.

**Fix:** Cap entrance easing duration so all chrome (title, subtitle, era labels, spine reveal) reaches its rest state by frame 30. Anything past 1s of entrance reads as "loading" in stills.

**Verify:** `npx remotion still <comp-id> /tmp/check.png --frame=30`. Title must be at full opacity, no transform, no shadow-double.

---

### T2. Spanning title names the parallel

**Observation:** Two side-by-side H1s (e.g., "First Industrial Revolution" + "Information Revolution") with no spanning frame above them. Reader can't tell what's being compared or why.

**Fix:** Every comparison timeline (`mode: "dual"` or `mode: "morph"`) gets a **single spanning `title`** that names the comparison's claim, plus a one-line `subtitle` that declares the framing.

Examples that earn it:
- ✅ "How Empires Hand Off" / "Two transitions, four centuries apart"
- ✅ "Two Revolutions, One Cadence" / "Aligned by phase, not by calendar"
- ❌ "First Industrial Revolution" + "Information Revolution" as parallel H1s with no spanning frame

**Why:** Two parallel H1s read as "two unrelated articles, not a comparison." The reader has to invent the parallel themselves.

---

### T3. Connection labels are the spine of the argument

**Observation:** A `mode: "dual"` timeline with no `connection` per pair, or with connection labels rendered as tiny gray afterthoughts floating in dead space between the columns.

**Fix:** Every pair in `mode: "dual"` declares a `connection: "..."` label (4-6 short phrases that name the structural rhyme: *Center divides → New center named → Old guarantor collapses → Handoff complete*). These ARE the editorial hypothesis. Render them prominently — on or near the spine, not as chrome between the rows.

**Why:** Without connection labels, a dual timeline reads as two parallel lists. The connection text *names* what the parallel is. Tiny gray text floating mid-canvas doesn't carry the editorial weight.

---

### T4. Date typography is the row anchor

**Observation:** Date labels rendered in body-weight warm-brown, same color as the description — they read as descriptors, not anchors.

**Fix:** Dates use:
- `fonts.mono` (Plex Mono)
- Small caps
- 600 weight (bold)
- Era's accent color (rust for historical era, navy for contemporary, etc.)
- Visually the **first** thing the eye reads on each row

**Why:** Dates anchor the row. If they read as "another piece of body text," the row has no anchor; everything floats. Mono caps + bold + era color makes the year the first read, the rest of the row clusters around it.

---

### T5. No row chrome in `dual` / `morph` modes

**Observation:** Heavy cream / tinted-blue panels per event row. Vertical pin-bar sidebar markers next to each card. Reads as form-field UI, not editorial layout.

**Fix:** Render on paper white with:
- One thin spine per timeline (1-2px),
- A dot on the spine per event,
- Clean type for the event itself.

No row backgrounds. No tinted card surfaces. No pin-bar sidebars.

**Why:** Editorial timelines (Economist, NYT Upshot, FT, Reuters) all use minimal chrome — the visual weight comes from the type and the dot pattern, not from filled rectangles. Heavy row chrome is the visual register of an org-chart UI, not a magazine spread.

**Exception:** `EscalationLadder` legitimately uses severity-color card backgrounds because the color IS the editorial encoding (low/moderate/high/critical). Other timeline templates have no such justification.

---

### T6. Use the canvas

**Observation:** Timeline content squeezed into one third of the canvas (commonly: vertical ladder left-aligned with 60% empty paper to the right).

**Fix:** Either —
- Widen content to the safe area (for horizontal spines), OR
- Center the content column horizontally so whitespace is symmetric (for vertical ladders), OR
- Fill the right side with editorial context (a small inset map, a portrait, a pull-quote annotation).

**Bias:** vertical ladders → *center*. Horizontal spines → *widen*. Never leave the canvas half-empty.

**Why:** At full-screen video rates, 60% empty paper reads as either "loading" or "underbuilt slide." Editorial outlets fill the canvas with intentional content; if there's nothing to fill it, narrow the content's *visual block* so the whitespace is balanced rather than lopsided.

---

## Reading order when polishing a template

1. Read this section's doctrine (D1–D18)
2. Read the template's dossier in `references/template-research/<template>.md` for canonical idioms + specific upgrades
3. Render the existing template at frame 30 + frame 180 to see current state
4. Apply doctrine rules + dossier upgrades
5. Regen visual regression baselines
6. Run `polish_lint.py` and ensure clean

This collapses the loop from "user screenshots → I diagnose" to "I audit against doctrine + dossier → propose specific upgrades."
