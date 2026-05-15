/**
 * NetworkDiagram template types.
 *
 * Nodes connected by edges with labels, data callouts, and control points.
 * Replaces Claude SVG "network/flow" illustrations with deterministic rendering.
 *
 * Supports optional cameraPath for cinematic narrated camera that pans between
 * node clusters, zooms into relationships, and uses focus isolation.
 */

import type { NarratedCameraStep } from "../../hooks/useNarratedCamera";
import type { DirectionBlock } from "../../hooks/useDirection";

export interface NetworkNode {
  id: string;
  label: string;
  sublabel?: string;
  /** Node shape following visual vocabulary */
  type: "nation" | "institution" | "actor" | "concept";
  /** Semantic color token from theme.ts (e.g., "amber", "rust", "bone") or hex */
  color: string;
  /**
   * Editorial hierarchy. Default `secondary` (small ~36px radius).
   * Set to `primary` only for the editorial hub of a hub-spoke layout —
   * it blooms to a much larger radius (~96px), gains a gravity-well
   * ring, an inner detail ring, and an in-circle stat numeral. For
   * flows / chains / grids where there is no central hub, leave every
   * node `undefined` so they read at a uniform satellite size.
   */
  importance?: "primary" | "secondary";
  /** Stat callout below node */
  stat?: { value: string; label: string };
  /** Override computed position (0-1 normalized coordinates) */
  position?: { x: number; y: number };
  /** Group tag for multi-node camera focus (e.g., "us-allies", "china-bloc") */
  group?: string;
  /**
   * Side assignment for `bipartite` layout. Required when layout is
   * "bipartite" — nodes get sorted into two columns and connector lines
   * drawn between them. Ignored by other layouts.
   */
  side?: "left" | "right";
}

export interface NetworkEdge {
  from: string; // node id
  to: string; // node id
  style: "solid" | "dashed" | "blocked";
  /** Optional label on the edge */
  label?: string;
  color?: string;
  /**
   * Editorial emphasis for this edge.
   * - `"accent"`: full opacity in the edge's color — draws the eye here.
   * - `"muted"`: reduced opacity (0.35) — deliberately recedes.
   *
   * Default (omitted) treats all edges equally. When ANY edge sets
   * `emphasis: "accent"`, other edges automatically read as muted.
   * Mirror of SankeyFlow's `link.emphasis` pattern.
   */
  emphasis?: "accent" | "muted";
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

  layout: "horizontal-chain" | "hub-spoke" | "grid" | "vertical-chain" | "bipartite";
  /** For grid layout: number of columns */
  gridColumns?: number;

  nodes: NetworkNode[];
  edges: NetworkEdge[];
  controls?: NetworkControl[];
  callouts?: NetworkCallout[];

  /**
   * Optional camera path for cinematic narrated movement.
   * When provided, enables the virtual camera system that pans/zooms
   * between nodes and applies focus isolation (dim + blur + scale).
   * When omitted, falls back to the static animation sequence.
   */
  cameraPath?: NarratedCameraStep[];

  /** Show ambient particles for depth (default: true when cameraPath present) */
  ambientParticles?: boolean;

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}
