/**
 * Per-template interpolation helpers for MorphTransition.
 *
 * Each interpolator takes a (from, to, t) tuple where t is 0-1 (eased
 * progress) and returns a new data object whose fields are lerped between
 * from and to. The MorphTransition wrapper drives `t` over the morph
 * window via Remotion's `interpolate()`.
 *
 * Design conventions:
 *   • Match list items by stable key (`label`, `x`) for lerp; items not
 *     present in both states fade in/out by opacity instead of lerping
 *   • Identity-preserving — same item across from/to keeps its color,
 *     accent, etc., from the TO state (which is where the viewer ends up)
 *   • Non-numeric fields snap at t=0.5 (mid-morph) for clean handoff
 */

import type { DataChartData } from "../DataChart/types";
import type { TimeSeriesChartData } from "../TimeSeriesChart/types";
import type { StatRevealData } from "../StatReveal/types";

/** Linear interpolation. */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ── StatReveal interpolation ───────────────────────────────────────────────

/**
 * StatReveal morph: the single hero number counts from FROM.stat.value to
 * TO.stat.value. Comparisons array snaps at t=0.5 (it would be too busy
 * to animate all comparison bars too).
 *
 * The `countUp` flag on the destination state is suppressed mid-morph —
 * we're already animating; StatReveal's own count-up logic would compete.
 */
export function interpolateStatRevealData(
  from: StatRevealData,
  to: StatRevealData,
  t: number,
): StatRevealData {
  return {
    ...to,
    stat: {
      ...to.stat,
      value: lerp(from.stat.value, to.stat.value, t),
      // Suppress count-up — we're driving the value externally.
      countUp: false,
    },
    // Comparisons: snap to TO at the midpoint so the bars don't churn.
    comparisons: t < 0.5 ? from.comparisons : to.comparisons,
  };
}

// ── DataChart interpolation ────────────────────────────────────────────────

/**
 * DataChart morph: bars matched by `label`, values lerped. Bars present
 * only in FROM (removed) fade out by t=0.5; bars present only in TO
 * (added) fade in from t=0.5. Bar reordering happens via the dataPoints
 * array reordering — the actual visual rearrangement depends on whether
 * DataChart sorts internally (it does, for bar variants).
 *
 * Note: for variants that order by `value` descending, the reorder is
 * automatic — sorted at every t and visually moves as values cross.
 * For variants with explicit ordering (`order: "asAuthored"`), bars
 * stay in array order; values lerp in place.
 */
export function interpolateDataChartData(
  from: DataChartData,
  to: DataChartData,
  t: number,
): DataChartData {
  if (!from.dataPoints || !to.dataPoints) return to;

  // Pre-build lookup maps so each per-point lookup is O(1) rather than
  // O(n) — was O(n·m) per frame (find + some inside map loops).
  const fromByLabel = new Map(from.dataPoints.map((p) => [p.label, p]));
  const toLabels = new Set(to.dataPoints.map((p) => p.label));

  // Match TO points to FROM by label; lerp value if matched.
  const interpolatedPoints = to.dataPoints.map((toPoint) => {
    const fromPoint = fromByLabel.get(toPoint.label);
    if (!fromPoint) {
      // New point — fade in from t=0.5 onward (use 0 value before that
      // to keep the bar collapsed until it's "discovered").
      return {
        ...toPoint,
        value: t < 0.5 ? 0 : lerp(0, toPoint.value, (t - 0.5) * 2),
      };
    }
    return {
      ...toPoint,
      value: lerp(fromPoint.value, toPoint.value, t),
    };
  });

  // Also include FROM points that have NO match in TO (removed); fade
  // them out by t=0.5 by collapsing value to 0. AFTER t=0.5, drop them
  // entirely so the chart doesn't render labeled zero-height bars in the
  // TO state — the visual signal "these countries fell out of the top N"
  // is the absence, not a labeled stump.
  const removedPoints =
    t < 0.5
      ? from.dataPoints
          .filter((p) => !toLabels.has(p.label))
          .map((p) => ({
            ...p,
            value: lerp(p.value, 0, t * 2),
          }))
      : [];

  return {
    ...to,
    dataPoints: [...interpolatedPoints, ...removedPoints],
    // Highlight index can shift; snap at midpoint.
    highlightIndex: t < 0.5 ? from.highlightIndex : to.highlightIndex,
  };
}

// ── TimeSeriesChart interpolation ──────────────────────────────────────────

/**
 * TimeSeriesChart morph: append-style. Each line's points array is the
 * union of from + to points, with new points (those in TO not in FROM)
 * appearing during the morph window by adjusting their `y` from null to
 * the destination value.
 *
 * For points present in BOTH (same x), y lerps. For points only in TO
 * (new), y interpolates from 0 → final as t → 1.
 *
 * Annotations from TO that aren't in FROM appear post-morph (no
 * interpolation — they're discrete labels).
 */
export function interpolateTimeSeriesChartData(
  from: TimeSeriesChartData,
  to: TimeSeriesChartData,
  t: number,
): TimeSeriesChartData {
  const fromLineByLabel = new Map(from.lines.map((l) => [l.label, l]));

  const interpolatedLines = to.lines.map((toLine) => {
    const fromLine = fromLineByLabel.get(toLine.label);
    if (!fromLine) {
      // Entirely new line — fade in from t=0.5.
      const visibleProgress = t < 0.5 ? 0 : (t - 0.5) * 2;
      return {
        ...toLine,
        points: toLine.points.map((p) => ({
          ...p,
          y: lerp(0, p.y, visibleProgress),
        })),
      };
    }

    // Match each toPoint to a fromPoint by x; if no match, interpolate
    // from 0 (new point) or from the line's last fromPoint y (extension).
    const fromPointByX = new Map(
      fromLine.points.map((p) => [String(p.x), p]),
    );
    const lastFromY = fromLine.points[fromLine.points.length - 1]?.y ?? 0;
    const interpolatedPoints = toLine.points.map((toPoint) => {
      const fromPoint = fromPointByX.get(String(toPoint.x));
      if (fromPoint) {
        return { ...toPoint, y: lerp(fromPoint.y, toPoint.y, t) };
      }
      // New x value — assume it's an extension (later in time) and start
      // from the last known fromPoint's y, easing into the new value.
      return { ...toPoint, y: lerp(lastFromY, toPoint.y, t) };
    });
    return { ...toLine, points: interpolatedPoints };
  });

  return {
    ...to,
    lines: interpolatedLines,
    // Annotations: snap at midpoint.
    annotations: t < 0.5 ? from.annotations : to.annotations,
  };
}

// ── Easing ─────────────────────────────────────────────────────────────────

export function ease(t: number, kind: "linear" | "ease-in-out" | "spring"): number {
  if (kind === "linear") return t;
  if (kind === "spring") {
    // Underdamped spring approximation: oscillates past 1.0 then settles.
    // ζ=0.6 (slightly underdamped), ω=8 (moderate frequency).
    // At t=1 the spring has settled to within ~2% of the target.
    // Values above 1.0 are intentional — the clamp is removed so callers
    // actually see the overshoot effect that distinguishes spring from ease-in-out.
    const zeta = 0.6;
    const omega = 8;
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * omega * t) * (
      Math.cos(wd * t) + (zeta * omega / wd) * Math.sin(wd * t)
    );
  }
  // ease-in-out (smoothstep cubic)
  return t * t * (3 - 2 * t);
}
