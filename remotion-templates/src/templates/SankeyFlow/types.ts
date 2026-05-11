/**
 * SankeyFlow template types.
 *
 * Animated Sankey/funnel diagrams showing how values flow from
 * sources through intermediate stages to destinations.
 * Used for budget breakdowns, policy cascades, resource flows.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface SankeyNode {
  id: string;
  label: string;
  /** Value (determines node height) */
  value: number;
  color?: string;
  /** Column position (0-indexed from left) */
  column: number;
}

export interface SankeyLink {
  from: string;  // node id
  to: string;    // node id
  /** Flow value (determines link thickness) */
  value: number;
  color?: string;
  label?: string;
}

export interface SankeyFlowData {
  episode: string;
  title: string;
  subtitle?: string;

  nodes: SankeyNode[];
  links: SankeyLink[];

  /** Show value labels on nodes? Default: true */
  showValues?: boolean;
  /** Value format unit (e.g., "$", "B", "%") */
  valuePrefix?: string;
  valueSuffix?: string;

  /**
   * Optional column header labels rendered above each Sankey column
   * (e.g., ["Production", "Use", "Fate"]). Makes the conservation framing
   * explicit — "values in = values out" — which is the whole point of a
   * Sankey. Without column headers, the diagram reads as a flow chart;
   * with them, it reads as a budget.
   *
   * Length should match the number of columns (max(node.column) + 1).
   * See: references/template-research/sankey-flow.md § 6
   */
  columnHeaders?: string[];

  /**
   * Source-total kicker rendered top-left as a prominent stat
   * (e.g., "8.3K Mt produced 1950–2017"). Names the conservation total
   * explicitly so the viewer knows what 100% means. Pair with `source`
   * for full attribution.
   *
   * See: references/template-research/sankey-flow.md § 6
   */
  sourceTotal?: {
    /** The big number / phrase (e.g., "8.3K Mt"). Plex Sans display weight. */
    value: string;
    /** Sub-line context (e.g., "global plastic produced 1950–2017"). */
    context?: string;
  };

  /**
   * Enable animated flow particles along link paths.
   * Particles travel from source to destination, with count proportional to flow value.
   * Default: false (set to true for cinematic mode).
   */
  flowParticles?: boolean;
  /** Particle speed multiplier (default: 1.0) */
  particleSpeed?: number;
  /** Particle density multiplier (default: 1.0) */
  particleDensity?: number;

  /** Show ambient background particles (default: false) */
  ambientParticles?: boolean;

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}
