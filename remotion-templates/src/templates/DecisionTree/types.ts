/**
 * DecisionTree type definitions.
 *
 * A branching scenario/decision tree for "Wargamer" format episodes.
 * Example: "If China blockades Taiwan, what does each player do next?"
 *
 * Nodes form a tree structure via parent→children references.
 * Tree layout positions nodes by depth level (top-to-bottom).
 *
 * Virtual camera system: the tree is rendered at full internal scale and
 * a viewport animates scale + translate to zoom/pan between nodes.
 * Camera path is data-driven via cameraPath[]. If omitted, a default
 * sequence is auto-generated from the tree structure.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface TreeNode {
  id: string;
  label: string;
  /** Optional probability label (e.g., "65%", "Likely") */
  probability?: string;
  /** Optional color override for this node */
  color?: string;
  /** Child node IDs */
  children?: string[];
  /** Is this the "you are here" / active node? */
  active?: boolean;
  /** Is this node on the highlighted path? */
  highlighted?: boolean;
  /** Optional Kalshi market price annotation */
  marketPrice?: string;
}

/** A single camera keyframe — where to look and how close. */
export interface CameraStep {
  /** Node ID to center the camera on */
  focus: string;
  /** Zoom level (1.0 = full tree visible, 2.5 = tight close-up) */
  zoom: number;
  /** Duration of this step in seconds */
  duration: number;
  /** Dim nodes NOT on the path from root to focus node (default: false) */
  dimOthers?: boolean;
  /** Optional label text overlaid during this step (e.g., "Scenario A") */
  label?: string;
}

export interface DecisionTreeData {
  episode: string;
  title: string;
  subtitle?: string;
  /** All nodes in the tree (flat array, tree structure via children refs) */
  nodes: TreeNode[];
  /** ID of the root node */
  rootId: string;
  /** IDs forming the highlighted decision path */
  highlightedPath?: string[];
  /** Color for highlighted path */
  highlightColor?: string;
  /**
   * Editorial gate on numeric probability labels.
   *
   * When `false` (default), any `node.probability` string matching a numeric
   * percentage pattern (`/\d+\s*%/`) is suppressed. Qualitative labels
   * ("Mainline", "Sharp", "Likely") always render.
   *
   * When `true`, all probability labels render — only set this when the
   * percentages come from a named source. The dossier failure mode is
   * "Decision tree with invented probabilities — worse than no probabilities;
   * cite or omit."
   *
   * For Cuban Missile Crisis, chess openings, or any case where probabilities
   * are editorial guesses, keep this `false` and use qualitative labels.
   * For Tetlock-style forecasting, Kelly-betting, medical triage, set `true`
   * and cite the source via `data.source`.
   *
   * Reference: references/template-research/game-theory.md § A4
   */
  probabilityWeights?: boolean;
  /**
   * Camera path — sequence of zoom/pan keyframes.
   * If omitted, auto-generates: root close-up → branch reveal → each leaf path → full pullback.
   */
  cameraPath?: CameraStep[];
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}
