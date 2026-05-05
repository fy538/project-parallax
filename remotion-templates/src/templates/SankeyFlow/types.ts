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
