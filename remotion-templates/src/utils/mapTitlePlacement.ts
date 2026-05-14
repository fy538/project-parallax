/**
 * mapTitlePlacement — smart placement algorithm for cartouche-mode title blocks.
 *
 * Given a set of country (or generic point) centroids in a d3-geo projection,
 * pick the corner of the canvas with the LOWEST data density. The cartouche
 * (~600x140px inset 32px from the corner) is then placed there, minimizing
 * occlusion of the actual map content.
 *
 * Algorithm:
 *   1. For each of 4 corner regions (~600x140px inset 32px from the edge):
 *   2. Count how many supplied points fall inside it
 *   3. Pick the corner with the LEAST coverage
 *   4. Tie-break preference: top-left → bottom-left → top-right → bottom-right
 *      (editorial reading-order bias — eyes land top-left first)
 *
 * Mapbox-based templates (ChoroplethMap, RouteAnimation, DensityMap) don't
 * have access to projected screen coordinates in the same precomputed way,
 * so they short-circuit to "top-left" with a `warnIf` advisory at the call
 * site (the caller already knows it's a Mapbox template).
 *
 * Reference: this module is the SVG-template companion to the smart-placement
 * fallback behavior documented in MapTitleFrame.tsx.
 */

import {
  MAP_TITLE_CARTOUCHE_WIDTH,
  MAP_TITLE_CARTOUCHE_HEIGHT,
  MAP_TITLE_CARTOUCHE_INSET,
} from "../components/MapTitleFrame";
import { layout } from "../design/theme";

export type CartoucheCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface ScreenPoint {
  x: number;
  y: number;
}

/** A corner rectangle in screen space (x, y, w, h). */
interface CornerRect {
  corner: CartoucheCorner;
  x: number;
  y: number;
  w: number;
  h: number;
}

const buildCornerRects = (): CornerRect[] => {
  const w = MAP_TITLE_CARTOUCHE_WIDTH;
  const h = MAP_TITLE_CARTOUCHE_HEIGHT;
  const inset = MAP_TITLE_CARTOUCHE_INSET;
  const W = layout.width;
  const H = layout.height;
  return [
    { corner: "top-left", x: inset, y: inset, w, h },
    { corner: "top-right", x: W - inset - w, y: inset, w, h },
    { corner: "bottom-left", x: inset, y: H - inset - h, w, h },
    { corner: "bottom-right", x: W - inset - w, y: H - inset - h, w, h },
  ];
};

const isInside = (p: ScreenPoint, r: CornerRect): boolean =>
  p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;

/** Tie-break preference (editorial reading order bias). */
const TIE_BREAK_ORDER: readonly CartoucheCorner[] = [
  "top-left",
  "bottom-left",
  "top-right",
  "bottom-right",
];

/**
 * Pick the lowest-density corner from a set of pre-projected screen points.
 *
 * @param points  Screen-space (x, y) centroids of currently rendered data
 *                (countries, symbols, route waypoints, etc.). Already in the
 *                canvas's 1920x1080 coordinate space.
 * @returns       The corner with the least overlap. Falls back to "top-left"
 *                when `points` is empty.
 */
export function resolveCartoucheCorner(points: ScreenPoint[]): CartoucheCorner {
  if (!points || points.length === 0) {
    return "top-left";
  }
  const rects = buildCornerRects();
  const counts = rects.map((r) => {
    let c = 0;
    for (const p of points) if (isInside(p, r)) c++;
    return { rect: r, count: c };
  });

  // Find the minimum count.
  let min = Infinity;
  for (const c of counts) if (c.count < min) min = c.count;

  // Tie-break by editorial preference.
  for (const preferred of TIE_BREAK_ORDER) {
    const hit = counts.find((c) => c.rect.corner === preferred && c.count === min);
    if (hit) return preferred;
  }
  // Should be unreachable, but fall back deterministically.
  return "top-left";
}

/**
 * Project an array of (lon, lat) points through a d3-geo projection function,
 * filtering out null projections (orthographic far-side, off-canvas, etc.).
 *
 * @param lonLats  Array of [longitude, latitude] tuples.
 * @param project  d3-geo projection function (lonLat → [x, y] | null).
 * @returns        Screen-space points, filtered to valid projections.
 */
export function projectPointsForPlacement(
  lonLats: readonly [number, number][],
  project: (p: [number, number]) => [number, number] | null
): ScreenPoint[] {
  const out: ScreenPoint[] = [];
  for (const ll of lonLats) {
    const projected = project(ll);
    if (!projected) continue;
    const [x, y] = projected;
    if (Number.isNaN(x) || Number.isNaN(y)) continue;
    out.push({ x, y });
  }
  return out;
}
