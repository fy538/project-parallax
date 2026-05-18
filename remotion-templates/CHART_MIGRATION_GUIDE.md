# Chart → EditorialFrame Migration Guide

> Recipe for migrating an existing chart template to use the shared
> `EditorialFrame` composition system. ~30–60 minutes per chart template,
> mechanical once the pattern is understood. Pre-requisites: read
> `EDITORIAL_FRAME_ARCHITECTURE.md` first.

## Why migrate

Editorial-frame migration replaces a chart's bespoke chrome
(`HeaderStrip` + `FooterStrip` + `TitleBlock` + `SourceAttribution`) with
the shared `EditorialFrame` system, giving the chart:

- Hero-split / centered / full-bleed / stacked layout options
- Multi-callout annotations with leader lines
- Reference lines + era bands as overlay primitives
- Top-aligned legend or direct-label
- Publication / intelligence / none chrome variants
- A kicker + heroStat + title + dek header block in one consistent typographic system

Done once, then any data file using that chart can opt into editorial
composition by setting `frame: {...}` on the data — backward compatible
with all existing data files (which keep using the legacy chrome).

## Status (as of May 17, 2026)

**Migrated:** DataChart (bar + comparison), TimeSeriesChart, PricingWaterfall

**Editorial-native** (built directly inside EditorialFrame): Slopegraph, KPICard, BulletChart, StepLine, Sparkline (utility)

**Pending migration (in suggested priority order):**

1. **ProbabilityGauge** — PD launch episode needs editorial frame on the Beat 5 forecast. Largest template (1332 lines) and has 5 variants (gauge / strip / shift / scorecard / forecast); recommend focusing migration on the `forecast` variant first, which is what PD uses.
2. **BumpChart** (553 lines) — ranking-change-over-time stories; high editorial value
3. **BayesianUpdate** — when forecasts need reasoning-visible composition
4. **BeeswarmChart** (649 lines) — distributional comparisons
5. **DumbbellPlot** (657 lines) — between-group comparisons at a moment
6. **ConnectedScatterplot** (743 lines) — motion-through-time stories
7. **RankChangeDotPlot** (405 lines) — paired ranking shifts
8. **RidgelinePlot** (524 lines) — distributional comparison across categories
9. **HorizonChart** (609 lines) — dense multi-series volatility
10. **PopulationPyramid** (754 lines) — demographic asymmetries
11. **RadarChart** — multi-axis profile comparisons
12. **MarimekkoChart** — part-to-whole with cross-tabulation
13. **Streamgraph** — flow-over-time
14. **IsotypeChart** — pictogram counting
15. **TernaryPlot** — 3-way composition
16. **CalendarHeatmap** — daily-data over a year grid

Each can be migrated independently — no shared dependencies beyond `EditorialFrame` itself.

## The migration recipe (5 mechanical steps)

### Step 1 — Add `frame?` field to schema

In `src/templates/<Chart>/schema.ts`:

```diff
 import { z } from "zod";
 import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
+import { EditorialFrameSchema } from "../../components/EditorialFrame/schema";

 export const <Chart>Schema = z.object({
   data: z.object({
     // ... existing fields ...
     backgroundTint: z.string().optional(),
+    /**
+     * Opt-in editorial frame. When set, the chart renders inside EditorialFrame
+     * with publication-grade composition. See EDITORIAL_FRAME_ARCHITECTURE.md.
+     */
+    frame: EditorialFrameSchema.optional(),
     _direction: DirectionBlockSchema.optional(),
   }),
 });
```

### Step 2 — Mirror the field in TypeScript types

In `src/templates/<Chart>/types.ts`:

```diff
 import type { DirectionBlock } from "../../hooks/useDirection";
+import type { EditorialFrameProps } from "../../components/EditorialFrame/schema";

 export interface <Chart>Data {
   // ... existing fields ...
+  /** Opt-in editorial frame. See EDITORIAL_FRAME_ARCHITECTURE.md. */
+  frame?: EditorialFrameProps;
   _direction?: DirectionBlock;
 }
```

### Step 3 — Route to editorial path when `frame` is set

In `src/templates/<Chart>/<Chart>.tsx`, at the top of the main component:

```diff
+import { <Chart>Editorial } from "./<Chart>Editorial";

 export const <Chart>: React.FC<{ data: <Chart>Data }> = ({ data }) => {
+  // Editorial-frame opt-in. See EDITORIAL_FRAME_ARCHITECTURE.md.
+  if (data.frame) {
+    return (
+      <<Chart>Editorial
+        data={data as <Chart>Data & { frame: NonNullable<<Chart>Data["frame"]> }}
+      />
+    );
+  }
+
   // ... existing render path unchanged ...
 };
```

### Step 4 — Build `<Chart>Editorial.tsx`

This is the chart-specific work (~30–45 min). Template:

```tsx
/**
 * <Chart>Editorial — editorial render path for <Chart>.
 *
 * Wraps chart geometry inside EditorialFrame with publication composition.
 * Activated when `data.frame` is set on <Chart>Data.
 */

import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  sec,
} from "../../design/theme";
import { fadeIn, easings } from "../../utils/animation";
import { useDirection } from "../../hooks/useDirection";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { EditorialFrame } from "../../components/EditorialFrame/EditorialFrame";
import type { Rect } from "../../components/EditorialFrame/EditorialFrame";
import { useThemeMode } from "../../hooks/useThemeMode";
import type { <Chart>Data } from "./types";

interface <Chart>EditorialProps {
  data: <Chart>Data & { frame: NonNullable<<Chart>Data["frame"]> };
}

export const <Chart>Editorial: React.FC<<Chart>EditorialProps> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  useDirection(data._direction, "none");
  useCompositionAnimation();

  // ── Compute any axis domains / derived state in useMemo here ────────────

  return (
    <EditorialFrame
      frame={data.frame}
      episode={data.episode}
      durationInFrames={durationInFrames}
    >
      {(chartRect) => (
        <<Chart>Content
          {/* pass chart-specific props */}
          chartRect={chartRect}
          frame={frame}
        />
      )}
    </EditorialFrame>
  );
};

// ── Chart content — render INSIDE the chartRect provided by EditorialFrame ──

const <Chart>Content: React.FC<{
  chartRect: Rect;
  frame: number;
  /* ... */
}> = ({ chartRect, frame /*...*/ }) => {
  const theme = useThemeMode("light");

  // Two coordinate conventions:
  //   - Render at (left, top) = (0, 0) relative to chartRect
  //   - chartRect.width and chartRect.height define the available canvas

  return (
    <svg
      width={chartRect.width}
      height={chartRect.height}
      style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}
    >
      {/* Your chart geometry here. Use fadeIn() + interpolate() with easings.bar
       *  for animations. See DataChartEditorial / TimeSeriesChartEditorial /
       *  PricingWaterfallEditorial for reference implementations. */}
    </svg>
  );
};
```

**What to render:**

- The chart's geometric primitives (bars, lines, dots, polygons) — same logic as the existing component, but scaled to `chartRect.width` × `chartRect.height`
- Y-axis gridlines + labels using `palette.taupe`-tinted thin strokes
- X-axis labels at the bottom of `chartRect.height` (use a `LABEL_BAND` reserved area, similar to DataChartEditorial)
- Direct-label-at-line-end terminal labels (FT signature) when `frame.legend === "direct-label"`
- Highlight discipline: when a hero / highlight entity exists, all others render in `palette.taupe` to recede

**What NOT to render:**

- HeaderStrip / FooterStrip / TitleBlock / SourceAttribution — EditorialFrame handles these
- Hero stat — passed via `frame.heroStat`, rendered by EditorialFrame's left rail or above-headline slot
- Top legend — passed via `frame.legend === "top-aligned"` + `frame.legendItems`, rendered by EditorialFrame
- Multi-callout annotations — passed via `frame.annotations`, can be plumbed via `annotationOverlay` render-prop on EditorialFrame (see DataChartEditorial.renderOverlays for the pattern)
- Reference lines + era bands — pass via `frame.referenceLines` and `frame.eraBands`, use `ReferenceLineOverlay` + `EraBandOverlay` plumbed through EditorialFrame's annotationOverlay slot (see DataChartEditorial)

### Step 5 — Update sample data and test

In `src/templates/<Chart>/index.tsx`, add a `frame` block to the sample data so the Composition default-renders with editorial composition (this also serves as a render-test fixture):

```diff
 const sampleData: <Chart>Data = {
   // ... existing fields ...
+  frame: {
+    kicker: "CATEGORY LABEL",
+    title: "State the finding, not the topic.",
+    dek: "Optional italic dek with the one-sentence framing.",
+    layout: "centered",  // or "hero-split"
+    chrome: "publication",
+    legend: "suppressed",
+    source: "Source attribution.",
+    modeTag: "domain · catalog",
+  },
 };
```

Then render-test:

```bash
cd remotion-templates
CHROME=$(find ~/.cache/ms-playwright -name "headless_shell" 2>/dev/null | head -1)
npx remotion still src/index.ts <Chart> /tmp/<chart>-test.png --frame=120 \
  --browser-executable="$CHROME"
```

Visually compare to a reference aspirational composition (NYT Upshot / FT / Economist style).

### Step 6 — Run tests + commit

```bash
npm test             # full vitest run — confirm no regressions vs main
git add ...
git commit -m "feat(editorial-frame): migrate <Chart> to EditorialFrame"
```

Tests should pass because:
- `templateSchemas.ts` already validates the `frame` field via the inherited `EditorialFrameSchema`
- `template-coverage.test.ts` already covers the parent `<Chart>` composition
- Episode-integrity tests treat `frame` as optional, so existing data files keep working

## Common pitfalls

### Pitfall 1: Chart content overflowing chartRect

The `EditorialFrame` reserves space for header + footer + caption. The `chartRect.height` you receive is what's left. If your chart geometry needs more room, you have two options:

1. Use `frame.layout: "full-bleed"` instead of `hero-split` for more vertical space
2. Reserve a `LABEL_BAND` (40px) at the bottom of `chartRect` for x-axis labels rather than positioning them outside

### Pitfall 2: Annotation positioning math drift

EditorialFrame's `<AnnotationOverlay>` accepts pixel positions in absolute screen coordinates (not chartRect-relative). When you compute `targetPx` for an annotation, anchor it to **the bar's top-right corner** (not center) so the leader line emanates cleanly. Reference: `DataChartEditorial.renderOverlays`.

### Pitfall 3: Muted color too dim

Don't use `${palette.ink}33` (20% alpha dim ink) for non-highlighted entities — it reads as "broken." Use `palette.taupe` or `palette.umber` as clean editorial neutrals.

### Pitfall 4: Source text overflow

The `source` field can be long. The `EditorialFrame` publication footer wraps source at `width: Math.min(700, frameWidth * 0.45)` — for very long source attributions, consider shortening rather than letting them wrap to 4 lines.

### Pitfall 5: Hero stat overlap with header strip

If `frame.heroStat.weight === "display"` (default), it's ~150pt. On hero-split layout it sits at `chartRect.y - headerH + 80`. If the heroStat label is very long, it may collide with the kicker above or title below — bump up the heroStat container's gap.

## Acceptance criteria per migration

A chart migration is "done" when:

- [ ] Schema accepts `frame?` field (passes Zod validation)
- [ ] Types mirror schema
- [ ] Component routes to `<Chart>Editorial` when `frame` is set
- [ ] `<Chart>Editorial.tsx` exists with self-contained editorial composition
- [ ] Sample data in `index.tsx` includes a `frame` block (serves as render test)
- [ ] `npm test` passes with no regressions versus `origin/main`
- [ ] `npx remotion still` produces a publication-grade composition
- [ ] No regression in existing data files (backward compat via early-route pattern)

## When to skip migration

A chart template might NOT warrant editorial-frame migration if:

- It's deprecated or scheduled for removal
- No queued episode uses it
- It's a primitive used inside other charts (like Sparkline)
- Its visual identity is its own brand element (e.g., GameBoard's payoff-matrix chrome IS the editorial register)

Document the skip rationale in the chart's `types.ts` JSDoc header.
