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

export type LayoutPreset = "horizontal-chain" | "hub-spoke" | "grid" | "vertical-chain";

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
