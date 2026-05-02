# Visual Polish V2 — Comprehensive Quality Spec

> Extends POLISH.md with the full 4-layer quality framework. This document captures everything implemented across the polish pass and serves as the ongoing quality standard for all Parallax visual production.
>
> Last updated: April 26, 2026

---

## Architecture: 4-Layer Quality Framework

```
Layer 4 · Brand Identity     Persistent UI, sound design, watermark, ∴ mark
Layer 3 · Composition        Cross-clip transitions, color storytelling, pacing
Layer 2 · Animation          Spring physics, stagger, exit fade, micro-interactions
Layer 1 · Per-Element        Shadows, cards, adaptive layout, information design
```

Each layer builds on the one below. You can't have good brand identity (L4) without consistent composition (L3), which requires polished animation (L2) on well-designed elements (L1).

---

## Layer 1 — Per-Element Polish

### 1A. Shadow System (theme.ts)

Four shadow tokens, applied consistently across all templates:

| Token | CSS | Use |
|-------|-----|-----|
| `shadows.subtle` | `0 2px 12px rgba(0,0,0,0.25)` | Default cards, chart bars, framework nodes |
| `shadows.medium` | `0 4px 20px rgba(0,0,0,0.35)` | Highlighted elements, focused panels |
| `shadows.accentGlow(color)` | `0 0 16px {color}40` | Hero data, active map countries |
| `shadows.textLift` | `0 1px 3px rgba(0,0,0,0.5)` | All body text on dark backgrounds |

### 1B. Gradient Helpers (theme.ts)

| Helper | Pattern | Use |
|--------|---------|-----|
| `gradients.darkVignette` | Radial, surface center → base edges | Background.tsx dark mode |
| `gradients.barFill(color)` | Linear 180°, color → colorD9 | DataChart bars |
| `gradients.dividerFade(color)` | Linear 90°, transparent → color → transparent | Section dividers |

### 1C. Card Containers

Every discrete content element sits in a card container, not bare text:

```css
padding: 14px 20px;
border-radius: 8px;
background-color: {accentColor}12; /* ~7% opacity tint */
border: 1px solid {accentColor}25;
border-left: 3px solid {accentColor}80; /* optional accent edge */
box-shadow: 0 2px 12px rgba(0,0,0,0.25);
```

Applied to: FrameworkDiagram items, TimelineComparison event cards, DataChart value panels.

### 1D. Adaptive Layout (DataChart)

Charts automatically adjust layout density based on item count:

| Item Count | Density | Bar Width Cap | Gap | Label Size |
|------------|---------|---------------|-----|-----------|
| ≤3 | sparse | 160px | 40px | `fontSizes.caption` |
| 4–5 | normal | 160px | 40px | `fontSizes.caption` |
| 6+ | dense | 100px | 20px | `fontSizes.small` |

### 1E. Information Design (DataChart)

Three opt-in data enrichment features:

| Feature | Field | Effect |
|---------|-------|--------|
| Reference line | `referenceLine: { value, label, color? }` | Dashed horizontal line at a target/threshold value |
| Hero bar | `highlightIndex: number` | Accent glow + enlarged value label on one bar |
| Context note | `contextNote: string` | Italicized framing sentence below the chart |

---

## Layer 2 — Animation

### 2A. Spring Physics (FadeIn.tsx)

Hero elements use `spring()` with organic overshoot instead of eased `interpolate()`:

```tsx
<FadeIn startFrame={0} direction="up" spring>
  <h1>Title</h1>
</FadeIn>
```

Spring config: `damping: 12, stiffness: 100, mass: 0.8` (via `heroSpring()` utility).

### 2B. Stagger Offsets

Spatial logic: left→right, top→bottom. Timing by density:

| Context | Delay | Example |
|---------|-------|---------|
| Dense lists (chart bars) | 50ms (4.5 frames @ 30fps) | `stagger(i, sec(0.15), sec(0.8))` |
| Medium density (timeline events) | 100ms | `stagger(i, sec(0.1), baseDelay)` |
| Sparse layout (title elements) | 150ms | `stagger(i, sec(0.15), 0)` |

### 2C. Exit Fade

Every composition fades out in the last ~15 frames via `exitFade(frame, durationInFrames, 15)`. Applied at the composition level (AbsoluteFill wrapper), not per-element.

FadeIn component supports this via the `exitFrames` prop:
```tsx
<FadeIn startFrame={0} exitFrames={15}>...</FadeIn>
```

### 2D. Micro-Interactions

| Effect | Where | Spec |
|--------|-------|------|
| Micro-settle pulse | DataChart bars after growth | `pulse(frame, endFrame, 9, 1.02)` — 9 frame duration, 2% overshoot |
| Layered value reveal | DataChart labels | Appear 0.3s after bar finishes growing |
| Ken Burns drift | DataChart, KineticTypography | `kenBurnsDrift(frame, durationInFrames)` — 1.0→1.015 slow scale |
| Trail glow | RouteAnimation active path | Double-path technique: wider blurred path behind sharp one |
| Point pulse | RouteAnimation waypoints | Spring scale 1.0→1.15→1.0 on arrival |
| Timeline dot glow | TimelineComparison | `boxShadow: 0 0 12px {color}60` on 16px dots |

---

## Layer 3 — Composition Choreography

### 3A. Cross-Clip Transition Rules

Implemented in `tools/assembly/generate_manifest.py` → `apply_default_transitions()`.
Rendered by `FullEpisode.tsx` → `FadeWrapper`.

| Rule | Condition | Transition | Duration |
|------|-----------|-----------|----------|
| 1 | Beat boundary | dissolve | 0.5s |
| 2 | Title card (in or out) | fade | 0.6s |
| 3 | Within same beat | cut | — |
| 4 | Template → Template (same beat) | dissolve | 0.3s |
| 5 | Hold segment | none | — |
| 6 | End card (final segment) | fade | 0.8s |

Dissolve includes subtle scale shift: 1.02→1.0 (in), 1.0→0.98 (out).
Full spec: `references/transition-rules.md`

### 3B. Color Storytelling

Background component accepts `tint` prop — a hex color overlaid as a subtle radial wash (~6% opacity) that shifts ambient mood without changing content colors.

All 7 core templates expose `backgroundTint` in their data types.

| Narrative Focus | Tint | Hex |
|----------------|------|-----|
| US / Western | Cool blue | `#3266AD` |
| China / Eastern | Warm red | `#C23B22` |
| Tension / Confrontation | Amber | `#E5A544` |
| Neutral / Structural | None | — |
| Danger / Escalation | Deep red | `#D64545` |

Full spec with EP01 color arc: `references/color-storytelling.md`

### 3C. Pacing Principles

- **Breathing room**: After a data-dense segment (chart, framework), hold or dissolve to a simpler visual for ≥2s before the next data segment.
- **Rhythm variation**: Alternate dense and sparse compositions. Three data charts in a row = viewer fatigue. Break with a map, quote card, or footage.
- **Dramatic pause**: The HOLD segment type in the manifest sustains the previous visual. Use after a peak stat or revelation — silence + static image lets the information land.
- **Beat cadence**: Each beat follows a rough arc: title card → context (footage/map) → analysis (charts/frameworks) → synthesis (quote/insight) → transition.

---

## Layer 4 — Brand Identity

### 4A. Persistent Section Indicator

`SectionIndicator` component (integrated in FullEpisode.tsx) shows the current beat title in the bottom-left corner. Appears 2s after each beat starts (so it doesn't compete with section title cards). Animated amber underline draws in on beat change.

### 4B. MetadataStrip

Header: `∴ PARALLAX | EP.01 — THE SILICON TRAP`
Footer: `● REC | 1:150,000 | FILED 2026-04-25`

Uses IBM Plex Mono at meta size (11px, tracking 2.5px). Positioned in the 80px safe area.

### 4C. Sound Design

8 cue types across 4 categories, specified per-segment via `soundCue` in the manifest:

**Structural**: `beat-transition`, `section-open`, `end-stinger`
**Data/Reveal**: `stat-reveal`, `quote-bell`
**Tension**: `tension-rise`, `tension-resolve`
**Motion**: `map-whoosh`

Three intensity levels: subtle (-24dB), normal (-18dB), dramatic (-12dB).
Ambient drone bed at -30dB runs underneath, shifting with color temperature.

Full spec: `references/sound-design.md`

### 4D. Film Grain

Background component applies a repeating 512px noise texture at:
- Dark mode: `mix-blend-mode: overlay`, 12% opacity
- Light mode: `mix-blend-mode: multiply`, 4% opacity

This prevents the "digital" look and adds analog texture.

### 4E. Brand Mark

The `∴` (therefore) symbol appears in MetadataStrip header, end cards, and social assets. Color: `palette.amber` (dark mode) or `palette.oxblood` (light mode).

---

## QA Checklist (Extended)

### Layer 1 — Per-Element
- [ ] All content elements sit in card containers (not bare text on background)
- [ ] Shadows use the 4-token system from theme.ts
- [ ] Chart bars have internal gradient (top lighter → bottom darker)
- [ ] Dividers use gradient fade (not hard-edge full-width lines)
- [ ] Text on dark backgrounds has `shadows.textLift`
- [ ] DataChart adapts layout density for item count

### Layer 2 — Animation
- [ ] No linear interpolation (grep `interpolate` without `easing`)
- [ ] Hero elements use spring physics
- [ ] Child elements stagger (50-150ms per density)
- [ ] Compositions >3s have Ken Burns drift
- [ ] Last 15 frames have exit fade
- [ ] Micro-settle pulse on data reveals

### Layer 3 — Composition
- [ ] Beat boundaries use dissolve transitions
- [ ] Title cards fade in/out
- [ ] Color temperature tint matches narrative focus
- [ ] No three data-dense segments in a row without a break
- [ ] Dramatic pauses use HOLD segments

### Layer 4 — Brand
- [ ] MetadataStrip reads "∴ PARALLAX"
- [ ] SectionIndicator shows current beat title
- [ ] Sound cues marked in manifest for key moments
- [ ] Film grain visible on all dark-mode backgrounds
- [ ] Consistent font usage per type scale

---

## File Reference

| What | Where |
|------|-------|
| Shadow & gradient tokens | `src/design/theme.ts` |
| Animation utilities | `src/utils/animation.ts` |
| Background + tint | `src/components/Background.tsx` |
| FadeIn (spring + exit) | `src/components/FadeIn.tsx` |
| Section indicator | `src/components/SectionIndicator.tsx` |
| MetadataStrip | `src/components/MetadataStrip.tsx` |
| FadeWrapper (transitions) | `src/templates/Episodes/FullEpisode.tsx` |
| Transition rules | `references/transition-rules.md` |
| Color storytelling | `references/color-storytelling.md` |
| Sound design | `references/sound-design.md` |
| Transition auto-assign | `tools/assembly/generate_manifest.py` |
| Manifest schema (soundCue) | `data/assembly-manifest.schema.json` |
