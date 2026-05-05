/**
 * BifurcationRoute template types.
 *
 * Visualizes a supply chain or network splitting into two incompatible paths.
 * Critical for geopolitics content (e.g., semiconductor decoupling: unified TSMC
 * supply chain → US-aligned vs. China-aligned networks).
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface BifurcationNode {
  id: string;
  label: string;
  /** Position on canvas (0-100 percentage) */
  x: number;
  y: number;
  /** Node color */
  color?: string;
  /** Which network does this node belong to after the split? */
  network?: "unified" | "networkA" | "networkB";
  /** Optional icon/emoji */
  icon?: string;
}

export interface BifurcationLink {
  from: string; // node id
  to: string; // node id
  /** Which phase does this link appear in? */
  phase: "unified" | "split";
  /** Which network after split? */
  network?: "networkA" | "networkB";
  /** Link label */
  label?: string;
  color?: string;
  /** Dashed line? */
  dashed?: boolean;
}

export interface BifurcationRouteData {
  episode: string;
  title: string;
  subtitle?: string;

  nodes: BifurcationNode[];
  links: BifurcationLink[];

  /** The node where the split happens */
  forkNodeId: string;

  /** Labels for the two networks */
  networkALabel: string; // e.g., "US-aligned"
  networkBLabel: string; // e.g., "China-aligned"

  /** Colors for the two networks */
  networkAColor?: string; // default: semantic.us
  networkBColor?: string; // default: semantic.china

  /** Timing: how long the unified phase shows before split animation */
  unifiedDurationSec?: number; // default: 3

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  /** Cinematic mode: camera zoom to fork + spatial separation animation */
  cinematicMode?: boolean;
  /** Enable ambient particles for depth */
  ambientParticles?: boolean;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}
