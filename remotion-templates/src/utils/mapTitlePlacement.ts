/**
 * mapTitlePlacement — smart placement for the floating MapTitleFrame.
 *
 * Given a set of HIGHLIGHTED-feature centroids in screen space (countries
 * with data fills, route waypoints, symbol locations — NOT all countries on
 * the basemap), pick the corner with the maximum clearance.
 *
 * ## Algorithm (v3 — May 14, 2026)
 *
 * Distance-based: for each of 4 corner anchor points, compute the MINIMUM
 * euclidean distance to any highlighted-feature centroid. Pick the corner
 * with the LARGEST minimum distance (the corner whose nearest signal is
 * farthest away).
 *
 * The corner "anchor" is the inner-corner of the title's footprint — the
 * point furthest INSIDE the canvas. This gives the algorithm a better
 * sense of where the title's bounding box would actually overlap with a
 * country fill, vs. just using the corner of the canvas itself.
 *
 * ## Why distance-based, not in-box count
 *
 * v2 used "count points inside corner rect" — but country fills extend far
 * beyond their centroids (USA's centroid is in Kansas; its fill covers from
 * Maine to California). A corner box that doesn't *contain* the centroid
 * can still be entirely covered by the country's polygon. Distance-based
 * scoring rewards corners that are FAR from highlighted features, which
 * correlates better with "the title doesn't sit on top of a color fill."
 *
 * Tie-break preference: top-left → bottom-left → top-right → bottom-right
 * (editorial reading-order bias — eyes land top-left first).
 *
 * Mapbox-based templates (ChoroplethMap, RouteAnimation, DensityMap) don't
 * have access to projected screen coordinates in the same precomputed way,
 * so they short-circuit to "top-left" at the call site.
 */

import {
  MAP_TITLE_FOOTPRINT_WIDTH,
  MAP_TITLE_FOOTPRINT_HEIGHT,
} from "../components/MapTitleFrame";
import { layout } from "../design/theme";

/** Margin from the canvas edge that the footprint sits within. */
const FOOTPRINT_INSET = 32;

export type CartoucheCorner =
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export interface ScreenPoint {
  x: number;
  y: number;
}

/**
 * The "anchor" point for a corner is the INNER corner of the title
 * footprint — the diagonal point furthest into the canvas. This is the
 * point we measure clearance from: if a highlighted feature is far from
 * this anchor, it's far from the title's full bounding box.
 */
const buildCornerAnchors = (): { corner: CartoucheCorner; x: number; y: number }[] => {
  const w = MAP_TITLE_FOOTPRINT_WIDTH;
  const h = MAP_TITLE_FOOTPRINT_HEIGHT;
  const inset = FOOTPRINT_INSET;
  const W = layout.width;
  const H = layout.height;
  return [
    { corner: "top-left", x: inset + w, y: inset + h },
    { corner: "top-right", x: W - inset - w, y: inset + h },
    { corner: "bottom-left", x: inset + w, y: H - inset - h },
    { corner: "bottom-right", x: W - inset - w, y: H - inset - h },
  ];
};

/** Tie-break preference (editorial reading order bias). */
const TIE_BREAK_ORDER: readonly CartoucheCorner[] = [
  "top-left",
  "bottom-left",
  "top-right",
  "bottom-right",
];

const sqDist = (ax: number, ay: number, bx: number, by: number): number => {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
};

/**
 * Pick the corner with maximum clearance from a set of pre-projected screen
 * points. Falls back to "top-left" when `points` is empty.
 *
 * @param points  Screen-space (x, y) centroids of HIGHLIGHTED features only
 *                (countries with data fills, symbol locations, route
 *                waypoints) — not all-country centroids.
 */
export function resolveCartoucheCorner(points: ScreenPoint[]): CartoucheCorner {
  if (!points || points.length === 0) {
    return "top-left";
  }
  const anchors = buildCornerAnchors();
  // For each anchor: the squared distance to its NEAREST highlighted point.
  // We want to maximize this — the corner whose nearest signal is farthest
  // away is the corner with the most breathing room.
  const scores = anchors.map((a) => {
    let nearest = Infinity;
    for (const p of points) {
      const d = sqDist(a.x, a.y, p.x, p.y);
      if (d < nearest) nearest = d;
    }
    return { corner: a.corner, nearest };
  });

  // Find the maximum.
  let max = -Infinity;
  for (const s of scores) if (s.nearest > max) max = s.nearest;

  // Tie-break: when corners score within ~5% of the max, prefer the
  // editorial reading-order winner.
  const tolerance = max * 0.05;
  for (const preferred of TIE_BREAK_ORDER) {
    const hit = scores.find(
      (s) => s.corner === preferred && s.nearest >= max - tolerance,
    );
    if (hit) return preferred;
  }
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
