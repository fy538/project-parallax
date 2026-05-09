/**
 * Geometry and axis helpers for TimeSeriesChart.
 */

// ── Geometry helpers ────────────────────────────────────────────────────────

/**
 * Walk along a polyline and return the (x, y) point at fractional progress
 * `t` (0–1) along the total path length. Used by the leading-edge marker
 * to track the tip of a line as it draws — the dot at the recording stylus.
 */
export function pointAtProgress(
  points: { x: number; y: number }[],
  t: number
): { x: number; y: number } {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1 || t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  // Total path length
  let total = 0;
  const segLengths: number[] = [];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    const d = Math.sqrt(dx * dx + dy * dy);
    segLengths.push(d);
    total += d;
  }
  if (total === 0) return points[0];

  const target = t * total;
  let walked = 0;
  for (let i = 0; i < segLengths.length; i++) {
    if (walked + segLengths[i] >= target) {
      const segT = (target - walked) / segLengths[i];
      const p0 = points[i];
      const p1 = points[i + 1];
      return {
        x: p0.x + (p1.x - p0.x) * segT,
        y: p0.y + (p1.y - p0.y) * segT,
      };
    }
    walked += segLengths[i];
  }
  return points[points.length - 1];
}

// ── Axis calculation helpers ────────────────────────────────────────────────

/**
 * Map a data point's x value to a pixel position within the chart area.
 * x values are assumed to be numeric or convertible to numbers.
 */
export const getXPosition = (
  xValue: number | string,
  xMin: number,
  xMax: number,
  chartLeft: number,
  chartRight: number
): number => {
  const x = typeof xValue === "string" ? parseFloat(xValue) : xValue;
  const progress = (x - xMin) / (xMax - xMin);
  return chartLeft + progress * (chartRight - chartLeft);
};

/**
 * Map a data point's y value to a pixel position within the chart area.
 * Higher y values → lower on screen (standard SVG coordinate system).
 */
export const getYPosition = (
  yValue: number,
  yMin: number,
  yMax: number,
  chartTop: number,
  chartBottom: number
): number => {
  const progress = (yValue - yMin) / (yMax - yMin);
  return chartBottom - progress * (chartBottom - chartTop);
};
