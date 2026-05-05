# Design Token Centralization — Migration Plan

> Created: May 2, 2026
> Purpose: Centralize scattered styling decisions so tweaking 1 parameter affects all Remotion templates.

## Problem

Three card patterns are copy-pasted across ~15 templates with slight inconsistencies in borderRadius (2/4/6/8), border widths (1px/2px/3px/4px), opacity values (20/25/30/40), and shadow strings. The playground exposes these as unified controls, but the values need to be centralized in theme.ts and consumed by a shared component.

## Phase 1: Add Missing Tokens to theme.ts

Add these new exports after the existing `cardPadding` section:

```ts
// ── Border Radius Scale ──────────────────────────────────────────────────
export const radii = {
  xs: 2,    // bar chart top corners, progress bars
  sm: 4,    // small UI elements, chart axis ticks
  md: 6,    // matrix cells, sankey nodes
  lg: 8,    // cards, panels, decision nodes (default)
  pill: 20, // badges, status pills
} as const;

// ── Card Style Presets ───────────────────────────────────────────────────
// These functions return style objects for the three common card patterns.
// Templates consume these instead of building card styles inline.

export const cardPresets = {
  /** Accent-tinted card — colored background + left accent border.
   *  Used in: FrameworkDiagram, TimelineComparison, DualTimeline,
   *  TimelineMorph, EscalationLadder, etc. */
  tinted: (color: string) => ({
    backgroundColor: `${color}1F`,        // 12% opacity
    border: `1px solid ${color}33`,        // 20% opacity
    borderLeft: `3px solid ${color}80`,    // 50% opacity
    borderRadius: radii.lg,
    padding: cardPadding.css,
    boxShadow: shadows.subtle,
  }),

  /** Solid node — full-color background with border.
   *  Used in: FrameworkDiagram flow/matrix, DecisionTree, SankeyFlow. */
  solid: (color: string) => ({
    backgroundColor: color,
    border: `2px solid ${color}`,
    borderRadius: radii.lg,
    boxShadow: shadows.subtle,
  }),

  /** Elevated panel — floating container on mode background.
   *  Used in: StatReveal metric cards, tooltips, info panels. */
  elevated: (modeTokens: typeof dark | typeof light) => ({
    backgroundColor: modeTokens.bg.elevated,
    border: `1px solid rgba(128,128,128,0.06)`,
    borderRadius: radii.lg,
    padding: cardPadding.css,
    boxShadow: modeTokens.shadow,
  }),
} as const;

// ── Bar Style ────────────────────────────────────────────────────────────
export const barStyle = {
  borderRadius: `${radii.sm}px ${radii.sm}px 0 0`,
  labelOffset: 8,  // px above bar for value label
  gap: 12,         // px between bars
} as const;

// ── Badge Style ──────────────────────────────────────────────────────────
export const badgeStyle = {
  borderRadius: radii.pill,
  paddingH: 12,
  paddingV: 6,
  bgOpacity: 0.15,
  borderOpacity: 0.3,
} as const;

// ── Divider Style ────────────────────────────────────────────────────────
export const dividerStyle = {
  thickness: 2,
  opacity: 0.3,
} as const;
```

## Phase 2: Build Shared Card Component

Create `src/components/Card.tsx`:

```tsx
import React from "react";
import { cardPresets, type Mode } from "../design/theme";
import { useThemeMode } from "../hooks/useThemeMode";

interface CardProps {
  variant: "tinted" | "solid" | "elevated";
  color?: string;
  mode?: Mode | string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant, color, mode, style, children
}) => {
  const theme = useThemeMode(mode);
  const presetStyle = variant === "elevated"
    ? cardPresets.elevated(theme)
    : variant === "solid"
    ? cardPresets.solid(color || theme.accent)
    : cardPresets.tinted(color || theme.accent);

  return (
    <div style={{ ...presetStyle, ...style }}>
      {children}
    </div>
  );
};
```

## Phase 3: Migrate Templates (incremental)

Each template migration is a find-and-replace of inline card styles with the Card component or cardPresets function.

### Priority order (by visual impact × frequency):

| # | Template | Pattern Used | Lines Changed |
|---|----------|-------------|---------------|
| 1 | FrameworkDiagram | tinted (comparison items) + solid (flow/matrix nodes) | ~30 |
| 2 | TimelineComparison | tinted (event cards) | ~15 |
| 3 | DualTimeline | tinted (event cards) | ~15 |
| 4 | TimelineMorph | tinted (collapsed) + solid (active) | ~20 |
| 5 | EscalationLadder | tinted (step cards) + solid (dots) | ~15 |
| 6 | DecisionTree | solid (nodes) | ~10 |
| 7 | SankeyFlow | solid (nodes) | ~10 |
| 8 | DataChart | barStyle tokens | ~10 |
| 9 | StatReveal | elevated (metric cards) | ~10 |
| 10 | DuelingFrameworks | tinted | ~10 |
| 11 | ProbabilityGauge | barStyle tokens | ~8 |
| 12 | BayesianUpdate | solid + barStyle | ~15 |
| 13 | GameBoard | solid (pieces) | ~8 |

### Migration pattern for each template:

**Before:**
```tsx
<div style={{
  borderRadius: 8,
  backgroundColor: `${itemColor}20`,
  border: `1px solid ${itemColor}30`,
  borderLeft: `3px solid ${itemColor}80`,
  boxShadow: shadows.subtle,
  padding: cardPadding.css,
}}>
```

**After:**
```tsx
<div style={cardPresets.tinted(itemColor)}>
```

Or with the component:
```tsx
<Card variant="tinted" color={itemColor}>
```

### Migration for borderRadius:

Replace all hardcoded borderRadius values:
- `borderRadius: 4` → `borderRadius: radii.sm`
- `borderRadius: 6` → `borderRadius: radii.md`
- `borderRadius: 8` → `borderRadius: radii.lg`
- `borderRadius: 20` → `borderRadius: radii.pill`
- `borderRadius: "50%"` — leave as-is (circles)

### Migration for bar charts:

Replace inline bar styling:
```tsx
// Before
borderRadius: "4px 4px 0 0"
// After
borderRadius: barStyle.borderRadius
```

## Phase 4: Workflow

1. Open `playground.html` in browser
2. Tweak values until the look is right
3. Click "Export Token Delta" → get JSON of changed values
4. Apply the delta to theme.ts token definitions
5. All templates automatically pick up the new values (after Phase 3 migration)

## Files to create/modify:

- `src/design/theme.ts` — add radii, cardPresets, barStyle, badgeStyle, dividerStyle
- `src/components/Card.tsx` — new shared component
- 13 template files — replace inline styles with token references
- `tools/design-playground/playground.html` — already created
