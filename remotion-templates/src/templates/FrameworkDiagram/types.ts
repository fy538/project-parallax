/**
 * Data types for the FrameworkDiagram template.
 *
 * Visualizes conceptual frameworks: side-by-side comparisons,
 * flow diagrams, and matrix/grid layouts for analytical models.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface ComparisonColumn {
  title: string;
  icon?: string; // emoji or short symbol
  items: string[];
  color?: string;
}

export interface FlowNode {
  label: string;
  sublabel?: string;
  color?: string;
  /** Spatial position (0-1 normalized) for non-linear layouts. When present, nodes render at absolute positions instead of sequentially. */
  position?: { x: number; y: number };
}

export interface FrameworkPhase {
  /** Phase label shown during this phase */
  label: string;
  durationSec: number;
  /** Indices of nodes to make active/visible during this phase */
  activeNodes?: number[];
}

export interface EliminatedScenario {
  /** Index of the filter node that eliminates this scenario */
  filter: number;
  /** Name of what's eliminated */
  scenario: string;
  color?: string;
}

export interface MatrixCell {
  row: number;
  col: number;
  label: string;
  color?: string;
  highlight?: boolean;
}

export interface FrameworkDiagramData {
  episode: string;
  title: string;
  subtitle?: string;

  /** Diagram variant. */
  variant: "comparison" | "flow" | "matrix";

  // ── Comparison variant ──
  /** Two or more columns to compare side by side. */
  columns?: ComparisonColumn[];

  // ── Flow variant ──
  /** Sequential nodes connected by arrows. */
  nodes?: FlowNode[];
  /** Arrow label between nodes (index-based). */
  arrowLabels?: string[];
  /** Phased reveal: nodes appear progressively per phase. When omitted, all nodes appear with stagger. */
  phases?: FrameworkPhase[];
  /** Scenarios eliminated by each filter node (renders as strikethrough text beside the arrow). */
  eliminatedScenarios?: EliminatedScenario[];

  // ── Matrix variant ──
  /** Row headers. */
  rowHeaders?: string[];
  /** Column headers. */
  colHeaders?: string[];
  /** Cells to populate. */
  cells?: MatrixCell[];

  // ── Styling ──
  accentColor?: string;
  backgroundVariant?: "dark" | "light";
  /** Subtle color tint for emotional temperature (Layer 3). Hex color, e.g. "#3266AD" for US-blue, "#C23B22" for China-red. */
  backgroundTint?: string;
  durationSec?: number;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}
