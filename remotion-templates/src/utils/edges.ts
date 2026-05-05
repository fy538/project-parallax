/**
 * Edge geometry utilities — shared bezier paths for diagrams.
 *
 * Replaces straight-line edges across NetworkDiagram, DecisionTree, and
 * BifurcationRoute with smooth curves that read as "designed" rather than
 * "graphviz output." Two curve styles:
 *
 *   - bezierEdge(): quadratic bezier with a perpendicular mid-point offset.
 *     Use when edges visually flow between two nodes at any angle.
 *
 *   - smoothStepEdge(): cubic bezier with horizontal/vertical control points.
 *     Use for top-down or left-to-right tree structures (DecisionTree).
 *
 * Both return SVG `d` strings ready to drop into <path d={...}>.
 */

// ── Quadratic bezier with perpendicular curvature ───────────────────────────

/**
 * Build an SVG path d-string for a curved edge between two points.
 * The midpoint is offset perpendicular to the line by `curvature × distance`,
 * which makes parallel edges between the same two nodes splay rather than
 * overlap, and avoids the dead-flat look of straight lines.
 *
 * @param x1 Source x
 * @param y1 Source y
 * @param x2 Destination x
 * @param y2 Destination y
 * @param curvature 0 = straight, 0.15-0.3 = subtle, 0.4+ = pronounced. Default 0.2.
 * @param direction "auto" | "left" | "right" — which side the curve bulges.
 *                   "auto" picks consistently based on coordinate signs so
 *                   the same edge always curves the same way across re-renders.
 */
export const bezierEdge = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature: number = 0.2,
  direction: "auto" | "left" | "right" = "auto"
): string => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return `M ${x1} ${y1} L ${x2} ${y2}`;

  // Midpoint
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;

  // Perpendicular unit vector (rotate 90° CCW)
  const nx = -dy / dist;
  const ny = dx / dist;

  // Side selection
  let sign = 1;
  if (direction === "left") sign = -1;
  else if (direction === "right") sign = 1;
  else {
    // Auto: deterministic based on slope so the curve is stable
    sign = dx + dy >= 0 ? 1 : -1;
  }

  const offset = curvature * dist * sign;
  const cx = mx + nx * offset;
  const cy = my + ny * offset;

  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};

// ── Smooth-step (S-curve) for tree structures ───────────────────────────────

/**
 * Build a vertical S-curve for parent → child connections in a top-down tree.
 * Cubic bezier with control points pulled toward each other vertically, so
 * the curve flows out of the parent downward, then into the child downward.
 *
 * @param x1 Parent x (typically node bottom-center)
 * @param y1 Parent y
 * @param x2 Child x (typically node top-center)
 * @param y2 Child y
 * @param tension 0-1, how aggressively the curve flattens at the ends.
 *                Default 0.5. Higher = more vertical at endpoints, more
 *                horizontal in the middle.
 */
export const smoothStepEdge = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tension: number = 0.5
): string => {
  const dy = y2 - y1;
  const cy1 = y1 + dy * tension;
  const cy2 = y2 - dy * tension;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} C ${x1.toFixed(2)} ${cy1.toFixed(2)} ${x2.toFixed(2)} ${cy2.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
};

// ── Path length estimation (for stroke-dasharray draw-in) ───────────────────

/**
 * Estimate the arc length of a quadratic bezier by sampling.
 * Used to compute proper stroke-dasharray for line-draw animations.
 */
export const bezierEdgeLength = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  curvature: number = 0.2,
  samples: number = 16
): number => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return dist;

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const nx = -dy / dist;
  const ny = dx / dist;
  const sign = dx + dy >= 0 ? 1 : -1;
  const offset = curvature * dist * sign;
  const cx = mx + nx * offset;
  const cy = my + ny * offset;

  let length = 0;
  let prevX = x1;
  let prevY = y1;
  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    const px = mt * mt * x1 + 2 * mt * t * cx + t * t * x2;
    const py = mt * mt * y1 + 2 * mt * t * cy + t * t * y2;
    length += Math.sqrt((px - prevX) ** 2 + (py - prevY) ** 2);
    prevX = px;
    prevY = py;
  }
  return length;
};

/**
 * Estimate the length of a smooth-step (cubic bezier) edge.
 */
export const smoothStepEdgeLength = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tension: number = 0.5,
  samples: number = 16
): number => {
  const dy = y2 - y1;
  const cy1 = y1 + dy * tension;
  const cy2 = y2 - dy * tension;
  let length = 0;
  let prevX = x1;
  let prevY = y1;
  for (let i = 1; i <= samples; i++) {
    const t = i / samples;
    const mt = 1 - t;
    const px = mt * mt * mt * x1 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x2;
    const py = mt * mt * mt * y1 + 3 * mt * mt * t * cy1 + 3 * mt * t * t * cy2 + t * t * t * y2;
    length += Math.sqrt((px - prevX) ** 2 + (py - prevY) ** 2);
    prevX = px;
    prevY = py;
  }
  return length;
};
