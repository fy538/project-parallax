/**
 * OutcomePartition type definitions.
 *
 * A 2D field partitioned into nested rectangles representing scenario
 * outcomes. The two axes are editorially named; each successive partition
 * (subdivision) represents one decision in the scenario chain. Final
 * regions are labeled outcomes.
 *
 * Visual register: RAND Robust Decision Making partition plots +
 * De Stijl / Mondrian compositional logic. Pure position + thin rules;
 * no card chrome possible. Area encodes likelihood / probability
 * weight without a number.
 *
 * Right when the editorial point is "the decision space narrows" — the
 * geometric act of subdivision IS the argument. Wrong when the point is
 * sequential branching (use DecisionTree variant: spine).
 *
 * Reference: research report 2026-05-17, Aesthetic C; RAND TR-392.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

/**
 * A partition operation: divides one rectangle into two children along
 * an axis. The split is recursive — each child can itself be a Partition
 * (with its own children) or a Leaf (terminal outcome region).
 */
export type Region =
  | {
      kind: "split";
      /** Direction of the cut. */
      axis: "horizontal" | "vertical";
      /**
       * Position of the cut as a fraction of the parent rect (0.5 = middle).
       * Editorially: this fraction encodes the relative weight / likelihood
       * of the two children.
       */
      at: number;
      /** Optional reveal-order index — when this rule appears in animation. */
      revealStep?: number;
      /** Label for the split itself (e.g., "if US holds resolve") — renders
       *  on the dividing rule. Optional; many splits read implicitly. */
      label?: string;
      /** Two children — order is [low/left, high/right] for horizontal
       *  cuts, [top, bottom] for vertical cuts. */
      children: [Region, Region];
    }
  | {
      kind: "leaf";
      /** Outcome label shown inside the region. */
      label: string;
      /** Optional secondary line (sub-label / metric / etc.). */
      sublabel?: string;
      /** Severity tint (paper → walnut). 0 = no fill, 1 = full walnut.
       *  Maps to opacity of the brand walnut palette token. */
      severity?: number;
      /** Optional explicit color override; when set, ignores severity. */
      color?: string;
      /** Optional reveal-order index — when this leaf label appears. */
      revealStep?: number;
      /** Highlighted outcome (the editorial "this is the one"). Renders
       *  with an accent rule on the leading edge. */
      highlighted?: boolean;
    };

export interface OutcomePartitionData {
  episode: string;
  title: string;
  subtitle?: string;
  /** Horizontal axis label, rendered below the partition rectangle. */
  xAxisLabel?: string;
  /** Vertical axis label, rendered to the left of the partition (rotated 90°). */
  yAxisLabel?: string;
  /** The root rectangle, which is recursively partitioned. */
  root: Region;
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  _direction?: DirectionBlock;
}
