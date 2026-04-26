/**
 * DecisionTree type definitions.
 *
 * A branching scenario/decision tree for "Wargamer" format episodes.
 * Example: "If China blockades Taiwan, what does each player do next?"
 *
 * Nodes form a tree structure via parent→children references.
 * Tree layout positions nodes by depth level (top-to-bottom).
 * Highlighted path draws over nodes, showing a particular decision sequence.
 */

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
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
}
