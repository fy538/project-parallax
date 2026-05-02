/**
 * NetworkDiagram template types.
 *
 * Nodes connected by edges with labels, data callouts, and control points.
 * Replaces Claude SVG "network/flow" illustrations with deterministic rendering.
 */

export interface NetworkNode {
  id: string;
  label: string;
  sublabel?: string;
  /** Node shape following visual vocabulary */
  type: "nation" | "institution" | "actor" | "concept";
  /** Semantic color token from theme.ts (e.g., "amber", "rust", "bone") or hex */
  color: string;
  /** Primary = larger (default), secondary = smaller */
  importance?: "primary" | "secondary";
  /** Stat callout below node */
  stat?: { value: string; label: string };
  /** Override computed position (0-1 normalized coordinates) */
  position?: { x: number; y: number };
}

export interface NetworkEdge {
  from: string; // node id
  to: string; // node id
  style: "solid" | "dashed" | "blocked";
  /** Optional label on the edge */
  label?: string;
  color?: string;
}

export interface NetworkControl {
  /** Edge this control sits on (from/to node ids) */
  edge: [string, string];
  /** Short label inside the control box */
  label: string;
  color?: string;
}

export interface NetworkCallout {
  value: string; // e.g., "$1T"
  label: string; // e.g., "Estimated cost of full self-sufficiency"
  position: "bottom-right" | "bottom-left" | "top-right";
}

export interface NetworkDiagramData {
  episode: string;
  title: string;
  subtitle?: string;

  layout: "horizontal-chain" | "hub-spoke" | "grid" | "vertical-chain";
  /** For grid layout: number of columns */
  gridColumns?: number;

  nodes: NetworkNode[];
  edges: NetworkEdge[];
  controls?: NetworkControl[];
  callouts?: NetworkCallout[];

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;
}
