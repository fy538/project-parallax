/**
 * Label collision avoidance — greedy 8-position placement for MapAnnotations.
 *
 * The canonical Mapbox / NYT auto-placement algorithm: each label tries 9
 * candidate positions (center + 8 around). For each annotation in
 * priority-DESC order, place at the first non-overlapping candidate; fall
 * back to the least-overlap candidate when all collide.
 *
 * Deterministic — same inputs produce same output every frame. Critical for
 * video render: stochastic algorithms (force-directed simulation) produce
 * frame-to-frame jitter and non-reproducible renders. Greedy + priority is
 * what Mapbox itself uses internally (`text-variable-anchor`) and what
 * matches the editorial "static layout, then nudge" workflow.
 *
 * Manual `leader.dx/dy` (when set) always wins — authors get the last word
 * on stubborn cases. The auto-placer only fires for annotations that DON'T
 * have an explicit manual offset.
 *
 * Reference: NYT Derek Watkins on map labeling — "the algorithm gets you
 * 80%, a human nudges the last 20%." This module is the 80%; manual leader
 * offsets are the 20%.
 *
 * --- May 14, 2026 revision ---
 *
 * Three improvements over the initial implementation:
 *
 *   • **Accurate bbox via `measureText`** — replaced the char-width
 *     heuristic with `@remotion/layout-utils.measureText()`. Handles
 *     non-ASCII, long labels, and unusual font weights correctly. Memoized
 *     per (text, fontFamily, fontSize, fontWeight) so we don't measure
 *     the same label every frame.
 *
 *   • **Uniform polar leader length** — all 8 displacement candidates now
 *     sit at the SAME radial distance from the anchor (just varying
 *     direction). Previously NE/SW corners were ~30% farther than N/S
 *     edges — inconsistent visual register across a frame.
 *
 *   • **Placer-controlled text-alignment** — for E/SE/NE candidates the
 *     placer emits `align: "left"` (text starts near anchor, extends
 *     right); for W/SW/NW it emits `align: "right"`; for N/S/default it
 *     stays `"center"`. This matches how editorial cartographers actually
 *     justify text relative to leader-line direction.
 *
 * Performance: O(N²) per frame, plus one synchronous measureText() per
 * unique annotation. With ~10 annotations and cached measurements, total
 * cost is sub-millisecond at 30 FPS.
 */

import { measureText } from "@remotion/layout-utils";
import {
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
} from "../design/theme";
import type { MapAnnotation } from "./MapAnnotations.types";

// ── Types ─────────────────────────────────────────────────────────────────

/** Pixel-space bounding box centered at (cx, cy). */
interface Bbox {
  cx: number;
  cy: number;
  w: number;
  h: number;
}

/** Output of the placer — per-annotation chosen offset + leader-line flag +
 *  text-alignment hint matching the displacement direction. */
export interface Placement {
  /** Horizontal pixel offset of the label center from the anchor. */
  dx: number;
  /** Vertical pixel offset of the label center from the anchor. */
  dy: number;
  /** True when the placer pushed the label off the default position;
   *  templates should draw a leader line from anchor to label. */
  displaced: boolean;
  /** True when this annotation's anchor was off-screen / un-projectable
   *  and we fell back to a sane default. */
  offscreen: boolean;
  /** Text-alignment hint matching the displacement direction. Templates
   *  may use this to override the annotation's `align` field for displaced
   *  labels — e.g., an E-displaced label reads better with text starting
   *  near the anchor (align: "left") than centered. */
  align: "left" | "right" | "center";
}

interface AnchorXY {
  x: number;
  y: number;
}

// ── Bbox estimation via measureText ────────────────────────────────────────
//
// Memoized per (text, fontFamily, fontSize, fontWeight) so we don't measure
// the same label every frame. With ~10 visible annotations and stable text,
// cache hit rate is ~100% after frame 0.

const BBOX_CACHE = new Map<string, { w: number; h: number }>();

interface TypographyForHierarchy {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  textTransform?: "uppercase";
  letterSpacing?: number;
}

function typographyFor(
  hierarchy: MapAnnotation["hierarchy"],
): TypographyForHierarchy {
  switch (hierarchy) {
    case "primary":
      // 28 hardcoded — matches the May 14, 2026 MapAnnotations marker
      // render. Tracking the rendered size keeps measureText's bbox
      // estimate accurate; if the rendered size diverged, the placer's
      // collision detection would be off.
      return {
        fontFamily: fonts.display,
        fontSize: 28,
        fontWeight: fontWeights.bold,
        textTransform: "uppercase",
        letterSpacing: letterSpacing.h3,
      };
    case "secondary":
      return {
        fontFamily: fonts.heading,
        fontSize: fontSizes.body,
        fontWeight: fontWeights.semibold,
        letterSpacing: letterSpacing.label,
      };
    case "tertiary":
    default:
      return {
        fontFamily: fonts.metadata,
        fontSize: fontSizes.caption,
        fontWeight: fontWeights.medium,
        letterSpacing: letterSpacing.caption,
      };
  }
}

// Heuristic char-width factors per hierarchy. Used as a fallback when
// `measureText()` isn't available (Node test environment). In production
// (browser / Chromium render), the canvas-based measureText path runs.
const CHAR_WIDTH_FACTOR: Record<MapAnnotation["hierarchy"], number> = {
  primary: 0.72, // bold uppercase Plex Sans
  secondary: 0.56, // medium sentence-case
  tertiary: 0.52, // mono
};

function heuristicBbox(
  text: string,
  fontSize: number,
  hierarchy: MapAnnotation["hierarchy"],
): { w: number; h: number } {
  return {
    w: Math.min(320, text.length * fontSize * CHAR_WIDTH_FACTOR[hierarchy]),
    h: fontSize * 1.15,
  };
}

/**
 * Try `measureText` (browser path), fall back to heuristic (Node / test).
 * Wraps the call in try/catch because `@remotion/layout-utils.measureText`
 * throws "measureText() can only be called in a browser" outside a browser
 * environment — vitest's default Node env doesn't have canvas.
 */
function safeMeasureText(args: {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing?: string;
  hierarchy: MapAnnotation["hierarchy"];
}): { w: number; h: number } {
  try {
    const m = measureText({
      text: args.text,
      fontFamily: args.fontFamily,
      fontSize: args.fontSize,
      fontWeight: args.fontWeight,
      letterSpacing: args.letterSpacing,
    });
    return { w: Math.min(320, m.width), h: m.height };
  } catch {
    return heuristicBbox(args.text, args.fontSize, args.hierarchy);
  }
}

/**
 * Estimate label dimensions via `@remotion/layout-utils.measureText()` when
 * a browser canvas is available; falls back to a deterministic char-width
 * heuristic in Node (test) environments. Measures the actual rendered glyph
 * extents — correct for any text length, language, or weight under normal
 * render conditions.
 *
 * Sublabel adds its own measured height + a 4 px gap. Cap at 320 px max
 * width so a single very-long label doesn't push the bbox into adjacent
 * candidates (longer text visually wraps via CSS in the render layer).
 *
 * Memoized per (text, fontFamily, fontSize, fontWeight, letterSpacing) so
 * we don't measure the same label every frame.
 */
export function estimateBboxPx(ann: MapAnnotation): { w: number; h: number } {
  const typo = typographyFor(ann.hierarchy);
  const labelText = typo.textTransform === "uppercase"
    ? ann.label.toUpperCase()
    : ann.label;

  const labelKey = `${labelText}|${typo.fontFamily}|${typo.fontSize}|${typo.fontWeight}|${typo.letterSpacing ?? 0}`;
  let label = BBOX_CACHE.get(labelKey);
  if (!label) {
    label = safeMeasureText({
      text: labelText,
      fontFamily: typo.fontFamily,
      fontSize: typo.fontSize,
      fontWeight: typo.fontWeight,
      letterSpacing: typo.letterSpacing
        ? `${typo.letterSpacing}px`
        : undefined,
      hierarchy: ann.hierarchy,
    });
    BBOX_CACHE.set(labelKey, label);
  }

  let sublabel: { w: number; h: number } | undefined;
  if (ann.sublabel) {
    // Sublabel uses metadata font, smaller — see MapAnnotations marker render.
    const subKey = `SUB|${ann.sublabel}|${fonts.metadata}|${fontSizes.meta}|${fontWeights.regular}`;
    sublabel = BBOX_CACHE.get(subKey);
    if (!sublabel) {
      sublabel = safeMeasureText({
        text: ann.sublabel,
        fontFamily: fonts.metadata,
        fontSize: fontSizes.meta,
        fontWeight: fontWeights.regular,
        hierarchy: ann.hierarchy,
      });
      BBOX_CACHE.set(subKey, sublabel);
    }
  }

  return {
    w: Math.max(label.w, sublabel?.w ?? 0),
    h: label.h + (sublabel ? sublabel.h + 4 : 0),
  };
}

// ── Bbox overlap ───────────────────────────────────────────────────────────

/**
 * Axis-aligned bbox overlap area. Returns 0 when no overlap; positive area
 * (px²) when they intersect. Used as the cost function when no candidate
 * position is fully collision-free.
 *
 * Padding adds an editorial breathing-room buffer — two labels that *just
 * touch* still feel cramped, so we treat them as overlapping by a small
 * margin. 6 px ≈ a single x-height of inter-label gap.
 */
function overlapArea(a: Bbox, b: Bbox, padding = 6): number {
  const aLeft = a.cx - a.w / 2 - padding;
  const aRight = a.cx + a.w / 2 + padding;
  const aTop = a.cy - a.h / 2 - padding;
  const aBottom = a.cy + a.h / 2 + padding;
  const bLeft = b.cx - b.w / 2 - padding;
  const bRight = b.cx + b.w / 2 + padding;
  const bTop = b.cy - b.h / 2 - padding;
  const bBottom = b.cy + b.h / 2 + padding;

  const overlapX = Math.max(
    0,
    Math.min(aRight, bRight) - Math.max(aLeft, bLeft),
  );
  const overlapY = Math.max(
    0,
    Math.min(aBottom, bBottom) - Math.max(aTop, bTop),
  );
  return overlapX * overlapY;
}

// ── Polar candidate generator ──────────────────────────────────────────────
//
// All 8 displacement candidates sit at the SAME radial distance from the
// anchor — only direction varies. This gives a uniform visual register
// across a frame: every displaced label has the same leader length. The
// previous "axis-aligned" candidate set had NE/SW corners ~40% farther
// than N/S/E/W edges, which read as inconsistent at scrubbing speed.
//
// Radius is `max(halfW, halfH) + GAP` — just enough to clear the largest
// label's bbox edge.

const GAP = 12; // px of breathing room between anchor and label edge

/**
 * 9 candidate (dx, dy, align) outputs, ordered preferred → fallback.
 * First candidate is the "default" position (above the anchor, no leader).
 * The next 8 are polar-uniform at 8 directions (N, NE, E, SE, S, SW, W, NW).
 *
 * Align hint per direction:
 *   • E / NE / SE → "left"  (label extends right of anchor)
 *   • W / NW / SW → "right" (label extends left of anchor)
 *   • N / S / default → "center"
 */
function candidates(
  bbox: { w: number; h: number },
  defaultDy: number,
): Array<{ dx: number; dy: number; displaced: boolean; align: Placement["align"] }> {
  // Polar radius — uniform across all 8 displaced candidates.
  const r = Math.max(bbox.w, bbox.h) / 2 + GAP;
  // Half-axes for the default candidate's vertical clearance.
  const halfH = bbox.h / 2;

  return [
    // 0. Default — above anchor, no displacement, no leader.
    { dx: 0, dy: defaultDy, displaced: false, align: "center" },
    // 1. N — further above (clears default by 1 bbox height).
    { dx: 0, dy: -halfH + defaultDy - GAP, displaced: true, align: "center" },
    // 2. E — same y, label to the right.
    { dx: r, dy: 0, displaced: true, align: "left" },
    // 3. W — same y, label to the left.
    { dx: -r, dy: 0, displaced: true, align: "right" },
    // 4. S — below anchor.
    { dx: 0, dy: r, displaced: true, align: "center" },
    // 5-8. Diagonals at 45° intervals, all at radius r.
    { dx: r * Math.SQRT1_2, dy: -r * Math.SQRT1_2, displaced: true, align: "left" },  // NE
    { dx: -r * Math.SQRT1_2, dy: -r * Math.SQRT1_2, displaced: true, align: "right" }, // NW
    { dx: r * Math.SQRT1_2, dy: r * Math.SQRT1_2, displaced: true, align: "left" },   // SE
    { dx: -r * Math.SQRT1_2, dy: r * Math.SQRT1_2, displaced: true, align: "right" }, // SW
  ];
}

// ── Main placer ────────────────────────────────────────────────────────────

export interface PlaceableAnnotation {
  /** The annotation data. */
  ann: MapAnnotation;
  /** Default vertical offset (negative = above anchor) — passed from the
   *  caller so the placer agrees with the component's DEFAULT_OFFSET_Y
   *  convention per hierarchy. */
  defaultDy: number;
  /**
   * Optional bbox override for this label. When set, the placer uses the
   * provided pixel-space `{w, h}` instead of inferring from
   * `ann.hierarchy` via `estimateBboxPx`.
   *
   * Use case: AtlasPlate's country labels render with `fonts.display +
   * fontSizes.label` (not the metadata-style "tertiary" typography that
   * `estimateBboxPx` returns for that hierarchy). Passing the measured
   * country-label bbox makes the placer's collision detection accurate
   * to what's actually rendered.
   */
  bboxOverride?: { w: number; h: number };
}

/**
 * Map a (dx, dy) placement output to a RouteAnimation `labelPosition`
 * string ("above" / "below" / "left" / "right"). Used by RouteAnimation
 * to auto-position point labels that don't have an explicit
 * `labelPosition` field — the greedy placer runs against the points,
 * then this function picks the dominant cardinal direction.
 *
 * Resolves diagonals to their dominant axis. Ties (equal magnitude in
 * both axes) break toward horizontal — labels-to-the-side read better
 * than labels-stacked-vertically when crowding is happening.
 */
export function placementToLabelPosition(
  placement: Placement,
): "above" | "below" | "left" | "right" {
  const { dx, dy } = placement;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? "right" : "left";
  }
  return dy < 0 ? "above" : "below";
}

/**
 * Run greedy 8-position placement against a set of annotations.
 *
 * @param items   Visible annotations + their default dy values.
 * @param project Function projecting [lon, lat] → pixel coords ({x, y}),
 *                or null when off-screen / un-projectable / back-of-globe.
 * @returns       Per-annotation placement (dx, dy, displaced, align), in
 *                the same order as `items` (NOT priority order).
 */
export function placeLabels(
  items: ReadonlyArray<PlaceableAnnotation>,
  project: (lonLat: [number, number]) => AnchorXY | null,
): Placement[] {
  // Initialize result slots indexed to input order.
  const results: Placement[] = items.map(() => ({
    dx: 0,
    dy: 0,
    displaced: false,
    offscreen: false,
    align: "center",
  }));

  // Priority-DESC sort, with stable tie-break on input index so identical
  // priorities produce deterministic placement (same answer every frame).
  const order = items
    .map((item, idx) => ({
      idx,
      priority: item.ann.priority ?? 0,
    }))
    .sort((a, b) => b.priority - a.priority || a.idx - b.idx);

  // Bboxes we've already placed — checked for overlap by each subsequent label.
  const placed: Bbox[] = [];

  for (const { idx } of order) {
    const { ann, defaultDy, bboxOverride } = items[idx];
    const anchor = project(ann.at);
    if (!anchor) {
      results[idx] = {
        dx: 0,
        dy: defaultDy,
        displaced: false,
        offscreen: true,
        align: "center",
      };
      continue;
    }

    // Manual override always wins — author had a reason; honor it.
    if (ann.leader) {
      const { dx, dy } = ann.leader;
      const bbox = bboxOverride ?? estimateBboxPx(ann);
      placed.push({
        cx: anchor.x + dx,
        cy: anchor.y + dy,
        w: bbox.w,
        h: bbox.h,
      });
      // Infer align from manual offset direction — same logic as candidates.
      const manualAlign: Placement["align"] =
        dx > 4 ? "left" : dx < -4 ? "right" : "center";
      results[idx] = {
        dx,
        dy,
        displaced: true,
        offscreen: false,
        align: manualAlign,
      };
      continue;
    }

    const bbox = bboxOverride ?? estimateBboxPx(ann);
    const candList = candidates(bbox, defaultDy);

    // Find first non-overlapping candidate; fall back to least-overlap.
    let bestCand = candList[0];
    let bestOverlap = Infinity;
    for (const cand of candList) {
      const candBbox: Bbox = {
        cx: anchor.x + cand.dx,
        cy: anchor.y + cand.dy,
        w: bbox.w,
        h: bbox.h,
      };
      let totalOverlap = 0;
      for (const p of placed) {
        totalOverlap += overlapArea(candBbox, p);
        // Early exit when this candidate is already worse than best.
        if (totalOverlap >= bestOverlap) break;
      }
      if (totalOverlap === 0) {
        bestCand = cand;
        bestOverlap = 0;
        break;
      }
      if (totalOverlap < bestOverlap) {
        bestCand = cand;
        bestOverlap = totalOverlap;
      }
    }

    placed.push({
      cx: anchor.x + bestCand.dx,
      cy: anchor.y + bestCand.dy,
      w: bbox.w,
      h: bbox.h,
    });
    results[idx] = {
      dx: bestCand.dx,
      dy: bestCand.dy,
      displaced: bestCand.displaced,
      offscreen: false,
      align: bestCand.align,
    };
  }

  return results;
}
