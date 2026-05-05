/**
 * drawLine — animated straight-line drawing via stroke-dashoffset.
 *
 * Used by NetworkDiagram edges, TimeSeriesChart lines, and SankeyFlow links.
 * The technique: set strokeDasharray to the total path length, then animate
 * strokeDashoffset from that length down to 0. The line appears to "draw" in.
 *
 * This module provides both the raw progress calculator and SVG style helpers.
 */

import { interpolate } from "remotion";
import { easings } from "./animation";

// ── Progress calculator ────────────────────────────────────────────────

/**
 * Returns a 0→1 progress value for an animated line draw.
 *
 * @param frame - current frame
 * @param startFrame - when this line starts drawing
 * @param drawDuration - frames to complete the draw
 * @param easing - easing function (default: structure easing for grid/edges)
 */
export const lineDrawProgress = (
  frame: number,
  startFrame: number,
  drawDuration: number,
  easing: ((t: number) => number) = easings.structure
): number =>
  interpolate(frame, [startFrame, startFrame + drawDuration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

// ── SVG style helper ───────────────────────────────────────────────────

/**
 * Returns SVG style props for an animated line draw.
 * Apply to a <line>, <path>, or <polyline> element.
 *
 * @param pathLength - total length of the path in pixels
 * @param progress - 0→1 draw progress (from lineDrawProgress)
 */
export const lineDrawStyle = (
  pathLength: number,
  progress: number
): React.CSSProperties => ({
  strokeDasharray: pathLength,
  strokeDashoffset: pathLength * (1 - progress),
});

// ── Path length calculator ─────────────────────────────────────────────

/** Distance between two pixel-space points. */
export const distance = (
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// ── Arrowhead helper ───────────────────────────────────────────────────

/**
 * Compute arrowhead triangle points for a line endpoint.
 * Returns an SVG polygon points string.
 *
 * @param x - endpoint x
 * @param y - endpoint y
 * @param angle - line angle in radians (Math.atan2(dy, dx))
 * @param size - arrowhead size in pixels (default 10)
 */
export const arrowheadPoints = (
  x: number,
  y: number,
  angle: number,
  size: number = 10
): string => {
  const tipX = x;
  const tipY = y;
  const leftX = x - size * Math.cos(angle - Math.PI / 6);
  const leftY = y - size * Math.sin(angle - Math.PI / 6);
  const rightX = x - size * Math.cos(angle + Math.PI / 6);
  const rightY = y - size * Math.sin(angle + Math.PI / 6);
  return `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`;
};
