/**
 * SankeyFlow template types.
 *
 * Animated Sankey/funnel diagrams showing how values flow from
 * sources through intermediate stages to destinations.
 * Used for budget breakdowns, policy cascades, resource flows.
 */

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

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;
}
