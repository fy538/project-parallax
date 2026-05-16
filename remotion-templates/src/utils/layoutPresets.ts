/**
 * layoutPresets — computes node positions for NetworkDiagram.
 *
 * Claude picks a topology (e.g., "horizontal-chain"), the template
 * computes (x, y) coordinates within the safe area. This separation
 * keeps Claude doing conceptual work while rendering stays deterministic.
 *
 * All coordinates are normalized 0–1, mapped to safe area at render time.
 */

import { layout } from "../design/theme";

export type LayoutPreset = "horizontal-chain" | "hub-spoke" | "grid" | "vertical-chain" | "bipartite";

export interface LayoutPosition {
  x: number; // 0–1 normalized
  y: number; // 0–1 normalized
}

/**
 * Compute positions for N nodes given a layout preset.
 * Returns an array of { x, y } in 0–1 normalized space.
 *
 * Nodes with explicit `position` overrides skip computation —
 * the caller should merge overrides after calling this.
 */
export const computeLayout = (
  preset: LayoutPreset,
  nodeCount: number,
  options?: {
    /** For grid: number of columns. Auto-computed if omitted. */
    columns?: number;
    /** Padding from edges (0–0.5). Default: 0.08 */
    padding?: number;
    /**
     * For bipartite: per-node side assignment, in the same order as
     * the caller's node array. Nodes without an explicit side default
     * to "left". Length should match nodeCount.
     */
    sides?: ReadonlyArray<"left" | "right" | undefined>;
  }
): LayoutPosition[] => {
  const pad = options?.padding ?? 0.08;
  const usable = 1 - pad * 2; // usable range in each axis

  switch (preset) {
    case "horizontal-chain":
      return horizontalChain(nodeCount, pad, usable);
    case "vertical-chain":
      return verticalChain(nodeCount, pad, usable);
    case "hub-spoke":
      return hubSpoke(nodeCount, pad, usable);
    case "grid":
      return gridLayout(nodeCount, pad, usable, options?.columns);
    case "bipartite":
      return bipartite(nodeCount, pad, usable, options?.sides);
    default:
      return horizontalChain(nodeCount, pad, usable);
  }
};

// ── Horizontal chain: left-to-right evenly spaced ──────────────────────

const horizontalChain = (
  count: number,
  pad: number,
  usable: number
): LayoutPosition[] => {
  if (count <= 1) return [{ x: 0.5, y: 0.5 }];

  return Array.from({ length: count }, (_, i) => ({
    x: pad + (i / (count - 1)) * usable,
    y: 0.5,
  }));
};

// ── Vertical chain: top-to-bottom evenly spaced ────────────────────────

const verticalChain = (
  count: number,
  pad: number,
  usable: number
): LayoutPosition[] => {
  if (count <= 1) return [{ x: 0.5, y: 0.5 }];

  return Array.from({ length: count }, (_, i) => ({
    x: 0.5,
    y: pad + (i / (count - 1)) * usable,
  }));
};

// ── Hub-spoke: central node with radials ───────────────────────────────

const hubSpoke = (
  count: number,
  pad: number,
  usable: number
): LayoutPosition[] => {
  if (count <= 1) return [{ x: 0.5, y: 0.5 }];

  const positions: LayoutPosition[] = [{ x: 0.5, y: 0.5 }]; // hub at center

  const spokeCount = count - 1;
  const radius = usable * 0.42; // leave room for labels

  for (let i = 0; i < spokeCount; i++) {
    // Start from top (-π/2) and go clockwise
    const angle = -Math.PI / 2 + (i / spokeCount) * Math.PI * 2;
    positions.push({
      x: 0.5 + Math.cos(angle) * radius,
      y: 0.5 + Math.sin(angle) * radius,
    });
  }

  return positions;
};

// ── Bipartite: two columns with connectors between them ───────────────
//
// The editorial form for "many → one" / "A's vs B's" / supplier-buyer
// stories. Lines run as clean diagonals from one column to the other —
// no radial geometry, no circle-on-circle overlap, no glossy "5 logos
// in a flower." Bloomberg / NYT Upshot use this constantly for trade,
// alliance, and exposure stories where one set of entities sits over
// against another.
//
// Each side packs tightly: the y-positions span ~80% of the safe area
// so single-node sides land at the vertical centerline and multi-node
// sides distribute evenly along it.

const bipartite = (
  count: number,
  pad: number,
  usable: number,
  sides?: ReadonlyArray<"left" | "right" | undefined>
): LayoutPosition[] => {
  if (count <= 1) return [{ x: 0.5, y: 0.5 }];

  // Resolve side per index — default "left" if missing.
  const resolved: ("left" | "right")[] = Array.from({ length: count }, (_, i) => {
    return sides?.[i] === "right" ? "right" : "left";
  });
  const leftIndices = resolved.map((s, i) => (s === "left" ? i : -1)).filter((i) => i >= 0);
  const rightIndices = resolved.map((s, i) => (s === "right" ? i : -1)).filter((i) => i >= 0);

  // Slightly inset from the safe-area edges so labels have horizontal
  // room beside each column without bleeding into the gutter.
  const leftX = pad + usable * 0.18;
  const rightX = pad + usable * 0.82;

  const yFor = (i: number, total: number): number => {
    if (total <= 1) return 0.5;
    // Spread across 80% of usable height, centered.
    const span = usable * 0.90;
    const top = pad + (usable - span) / 2;
    return top + (i / (total - 1)) * span;
  };

  const positions: LayoutPosition[] = new Array(count);
  leftIndices.forEach((idx, i) => {
    positions[idx] = { x: leftX, y: yFor(i, leftIndices.length) };
  });
  rightIndices.forEach((idx, i) => {
    positions[idx] = { x: rightX, y: yFor(i, rightIndices.length) };
  });
  return positions;
};

// ── Grid: rows × columns ──────────────────────────────────────────────

const gridLayout = (
  count: number,
  pad: number,
  usable: number,
  explicitCols?: number
): LayoutPosition[] => {
  if (count <= 1) return [{ x: 0.5, y: 0.5 }];

  const cols = explicitCols || Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  const positions: LayoutPosition[] = [];

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    // Center incomplete last row
    const colsInRow = row === rows - 1 ? count - row * cols : cols;
    const colOffset = (cols - colsInRow) / 2;

    positions.push({
      x: cols === 1 ? 0.5 : pad + ((col + colOffset) / (cols - 1)) * usable,
      y: rows === 1 ? 0.5 : pad + (row / (rows - 1)) * usable,
    });
  }

  return positions;
};

// ── Coordinate mapping: normalized → pixel space ───────────────────────

export interface SafeArea {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Default safe area from theme layout. */
export const defaultSafeArea: SafeArea = {
  left: layout.safeArea.left,
  top: layout.safeArea.top + 100, // leave room for title
  width: layout.width - layout.safeArea.left - layout.safeArea.right,
  height: layout.height - layout.safeArea.top - layout.safeArea.bottom - 140, // title + source
};

/** Convert normalized (0–1) position to pixel coordinates within safe area. */
export const toPixels = (
  pos: LayoutPosition,
  area: SafeArea = defaultSafeArea
): { px: number; py: number } => ({
  px: area.left + pos.x * area.width,
  py: area.top + pos.y * area.height,
});
