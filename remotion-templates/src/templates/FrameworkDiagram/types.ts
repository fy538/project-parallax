/**
 * Data types for the FrameworkDiagram template.
 *
 * Visualizes conceptual frameworks: side-by-side comparisons,
 * flow diagrams, and matrix/grid layouts for analytical models.
 */

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
}
