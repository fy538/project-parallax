/**
 * Zod schemas for OrgChart template.
 *
 * OrgChart encodes formal authority hierarchies — the tree structure
 * represents command/delegation, not decision points (DecisionTree) or
 * relationship meshes (NetworkDiagram).
 *
 * Use cases: nuclear command chains, ORBAT, bureaucratic procurement
 * chains, intelligence community oversight structures, corporate governance.
 *
 * Schema-derived types via z.infer<> — no hand-declared interfaces.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const OrgChartNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  sublabel: z.string().optional(),
  /**
   * Node type controls visual treatment:
   * - "role": standard box with ink border (default)
   * - "person": bold name emphasis, slightly heavier weight
   * - "empty": dashed border signaling a vacant post
   * - "committee": wider box, italic label, grouped authority
   */
  type: z.enum(["role", "person", "empty", "committee"]).optional(),
  /**
   * Visual emphasis:
   * - "primary": gold border accent — focal node of the argument
   * - "secondary": standard ink border (default)
   * - "muted": reduced opacity — administrative or peripheral
   */
  emphasis: z.enum(["primary", "secondary", "muted"]).optional(),
  /** Adds "[CLASSIFIED]" sublabel badge in taupe italic */
  classified: z.boolean().optional(),
  /** Small annotation bubble anchored at top-right of node */
  annotation: z.string().optional(),
  /** Box border color override — use palette tokens from theme.ts */
  color: z.string().optional(),
});

export const OrgChartEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  /**
   * Line style encodes relationship type:
   * - "solid": formal authority (default)
   * - "dashed": advisory / bypassed ("8 4" pattern)
   * - "dotted": informal / reporting ("2 4" pattern)
   */
  style: z.enum(["solid", "dashed", "dotted"]).optional(),
  /** Edge label positioned at the elbow midpoint */
  label: z.string().optional(),
  /** Edge color override — use palette tokens */
  color: z.string().optional(),
});

export const OrgChartDataSchema = z.object({
  episode: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  _direction: DirectionBlockSchema.optional(),

  nodes: z.array(OrgChartNodeSchema).min(2).max(24),
  edges: z.array(OrgChartEdgeSchema).min(1),
  /** ID of the topmost node in the hierarchy */
  rootId: z.string(),

  /** Chart orientation. Default: "top-down" */
  direction: z.enum(["top-down", "left-right"]).optional(),
  /** Vertical gap between tree levels in px. Computed if omitted. */
  levelSpacing: z.number().positive().optional(),
  /** Horizontal gap between sibling nodes in px. Computed if omitted. */
  nodeSpacing: z.number().positive().optional(),

  /**
   * Reveal mode controls animation sequence:
   * - "top-down": levels appear sequentially root → leaves (default)
   * - "left-right": nodes appear left-to-right within each level
   * - "simultaneous": all nodes appear at once
   */
  revealMode: z.enum(["top-down", "left-right", "simultaneous"]).optional(),
  /**
   * Sequence of node IDs to pulse as a highlighted command chain.
   * After all nodes are visible, each node in this array receives a gold
   * ring + scale pulse (1.0 → 1.03 → 1.0) in order, 1s per pulse.
   */
  highlightChain: z.array(z.string()).optional(),
});

export const OrgChartSchema = z.object({ data: OrgChartDataSchema });
