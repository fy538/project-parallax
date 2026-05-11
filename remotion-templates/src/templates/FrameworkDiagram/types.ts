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
  /**
   * Editorial weight for proportional flow spacing. Used when `flowSpacing`
   * is `"proportional"` — the node's horizontal position scales with this
   * value relative to siblings. Useful for time-encoded flows where stage
   * duration is part of the story (1806 → 1810 is a longer stretch than
   * 2022 → 2023; the flow should show that).
   *
   * When all nodes have `weight` set, the template positions them in
   * proportion to their cumulative weight; otherwise equal-spaced.
   */
  weight?: number;
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
  /**
   * Editorial protagonist — which column carries the argument.
   *
   * When set, the named column renders at full weight (accent color, heavier
   * ordinals, full opacity); the other column(s) recede to ink @ 40% opacity
   * with muted ordinals. The viewer's eye locks to the protagonist while the
   * counterpoint stays continuously legible.
   *
   * Use when ONE side is editorially weighted (e.g., a thesis vs a foil, the
   * actor whose decision you're explaining vs the counterfactual). Default
   * (omitted) gives equal-weight presentation — appropriate for true
   * comparisons where neither side leads.
   *
   * Index into `columns` (0-based). See:
   * references/template-research/framework-diagram.md § 6.3
   */
  protagonist?: number;

  // ── Flow variant ──
  /** Sequential nodes connected by arrows. */
  nodes?: FlowNode[];
  /** Arrow label between nodes (index-based). */
  arrowLabels?: string[];
  /** Phased reveal: nodes appear progressively per phase. When omitted, all nodes appear with stagger. */
  phases?: FrameworkPhase[];
  /** Scenarios eliminated by each filter node (renders as strikethrough text beside the arrow). */
  eliminatedScenarios?: EliminatedScenario[];
  /**
   * Stage spacing strategy for the flow variant.
   *
   * - `"equal"` (default) — uniform gap between every stage. Right when only
   *    the *sequence* matters (succession of regimes, phases of an argument).
   * - `"proportional"` — gap between stages scales with `FlowNode.weight`.
   *    Right when stage *duration* is part of the editorial point (compression
   *    of crisis cycles, decade-by-decade pacing). Requires `weight` on every
   *    node — falls back to equal spacing if not declared.
   *
   * See: references/template-research/framework-diagram.md § 6.1
   */
  flowSpacing?: "equal" | "proportional";

  // ── Matrix variant ──
  /** Row headers. */
  rowHeaders?: string[];
  /** Column headers. */
  colHeaders?: string[];
  /** Cells to populate. */
  cells?: MatrixCell[];
  /**
   * Empirical 2×2 scatter mode: instead of cell-based labels, plot named
   * items as points in the quadrant space. Each item declares its (x, y)
   * coordinates in normalized [0, 1] space — (0.5, 0.5) is the origin
   * crosshair, lower-left quadrant is (0..0.5, 0..0.5).
   *
   * Use for HBR/Boston-Consulting-style quadrant analysis where you want
   * to *show where countries / companies / actors actually sit* rather
   * than just label the quadrants abstractly.
   *
   * When `items` is set, axis tick rendering activates at the origin
   * crosshair. Cell labels (`cells`) remain available as quadrant titles.
   *
   * See: references/template-research/framework-diagram.md § 6.2
   */
  items?: Array<{
    x: number;  // 0..1
    y: number;  // 0..1
    label: string;
    color?: string;
    /** Marker size multiplier (default 1.0). Use 1.5–2× for hero items. */
    weight?: number;
  }>;

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
