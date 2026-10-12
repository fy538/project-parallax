/**
 * Zod schema for CausalLoopDiagram template.
 *
 * A causal loop diagram is a systems-thinking visualisation: nodes connected
 * by directed, polarised arrows. Polarity (+/-) encodes whether an increase
 * in the source causes an increase (+) or decrease (-) in the target.
 * Closed cycles in the graph are loops, classified as:
 *
 *   • Reinforcing (R) — even number of "-" arrows → self-amplifying
 *     (arms races, viral growth, escalation spirals)
 *   • Balancing (B)   — odd number of "-" arrows → self-correcting
 *     (homeostatic regulation, deterrence, supply/demand)
 *
 * Loops are author-declared (not auto-detected) so the editorial framing
 * controls which cycles get badged R1/B1/etc. and which stay implicit.
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — CausalLoopDiagram entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// ── Node ───────────────────────────────────────────────────────────────────

export const CausalLoopNodeSchema = z.object({
  /** Stable identifier — referenced by edges and loops. */
  id: z.string(),
  /** Display label. Kept short — node bubbles are small. */
  label: z.string(),
  /** Optional one-line elaboration shown beneath the label. */
  sublabel: z.string().optional(),
  /**
   * Position in 0–100 percentage coordinates (canvas-relative).
   * Authors place nodes manually — no auto-layout. This is editorial work:
   * the spatial composition IS part of the argument (clusters, hierarchies,
   * left-vs-right framing).
   */
  position: z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  }),
  /**
   * Emphasis tier — drives node size and weight.
   *   • "primary"   — the focal variable the loop is about
   *   • "secondary" — supporting variables (default)
   */
  emphasis: z.enum(["primary", "secondary"]).optional(),
  /**
   * Optional colour override (hex). Use sparingly — the doctrine is that
   * causal loops read as a single conceptual unit, so colour-coding nodes
   * fights the loop badge as the carrier of meaning. Reserved for cases
   * where node identity (US vs China, agent vs principal) is independent of
   * loop membership.
   */
  color: z.string().optional(),
});

// ── Edge ───────────────────────────────────────────────────────────────────

export const CausalLoopEdgeSchema = z.object({
  /** Source node id. */
  from: z.string(),
  /** Target node id. */
  to: z.string(),
  /**
   * Polarity — same-direction (+) or opposite-direction (−) influence.
   *   • "+"  — increase in `from` causes increase in `to` (and decrease→decrease)
   *   • "-"  — increase in `from` causes decrease in `to` (and vice versa)
   */
  polarity: z.enum(["+", "-"]),
  /**
   * Curvature direction for the arc. "auto" picks based on whether the edge
   * is part of a clockwise or counter-clockwise loop. Explicit "left"/"right"
   * overrides for visual disambiguation when two edges connect the same pair.
   */
  curve: z.enum(["auto", "left", "right", "straight"]).optional(),
  /** Curvature magnitude in percent of edge length. Default 18. */
  curveAmount: z.number().min(0).max(60).optional(),
  /**
   * Optional edge label (e.g., "perception of threat", "delay"). Kept rare —
   * the polarity sign carries most of the argument; labels add cognitive load.
   */
  label: z.string().optional(),
  /**
   * Indicates a delay relationship — rendered as a double slash (||) on the
   * edge, the systems-thinking convention for "this influence takes time."
   * Useful for sanctions effects, military procurement cycles, etc.
   */
  delay: z.boolean().optional(),
  /**
   * Reveal order. "auto" staggers by edge index. A numeric value (in seconds)
   * pins the reveal to a specific time — useful when syncing to narration.
   */
  revealAtSec: z.union([z.literal("auto"), z.number().nonnegative()]).optional(),
});

// ── Loop ───────────────────────────────────────────────────────────────────

export const CausalLoopLoopSchema = z.object({
  /** Loop identifier — e.g., "R1", "B2". Shown in the badge. */
  id: z.string(),
  /**
   * Ordered list of node ids defining the cycle. The first and last entries
   * need NOT be the same — the cycle is implicit (last → first closes it).
   * E.g., `["us-arms", "china-threat", "china-arms", "us-threat"]` defines
   * a 4-cycle returning to "us-arms".
   *
   * The polarity classification (R or B) must be authored — the schema does
   * not auto-classify (it's editorial intent, not just an algorithm).
   */
  nodeIds: z.array(z.string()).min(2),
  /**
   * Loop type:
   *   • "R" — Reinforcing (self-amplifying; even number of "-" edges)
   *   • "B" — Balancing (self-correcting; odd number of "-" edges)
   */
  type: z.enum(["R", "B"]),
  /**
   * Short narrative label for the loop, shown beneath the badge.
   * E.g., "Arms race", "Sanctions spiral", "Deterrence balance".
   */
  label: z.string(),
  /**
   * Loop "rotation" — clockwise vs counter-clockwise. Drives the rotating
   * arrow inside the badge. Default "auto" picks based on node geometry.
   */
  rotation: z.enum(["cw", "ccw", "auto"]).optional(),
  /**
   * Optional override for the loop badge centroid (0–100 coords).
   * When unset, the centroid is the geometric mean of loop node positions.
   */
  centroid: z
    .object({
      x: z.number().min(0).max(100),
      y: z.number().min(0).max(100),
    })
    .optional(),
  /** Reveal timing. Default: after all edges are drawn. */
  revealAtSec: z.union([z.literal("auto"), z.number().nonnegative()]).optional(),
});

// ── Top-level data ─────────────────────────────────────────────────────────

export const CausalLoopDiagramDataSchema = z.object({
  /** Episode slug — for archival lineage. */
  episode: z.string(),
  /** Optional title displayed in HeaderStrip. */
  title: z.string().optional(),
  /** Optional subtitle. */
  subtitle: z.string().optional(),
  /** Optional source attribution shown in FooterStrip. */
  source: z.string().optional(),
  /** Total duration in seconds. Default 12s. */
  durationSec: z.number().positive().optional(),

  /** Nodes (variables in the causal system). Min 2 — a loop needs ≥ 2 nodes. */
  nodes: z.array(CausalLoopNodeSchema).min(2, {
    message: "CausalLoopDiagram requires at least two nodes.",
  }),

  /** Edges (causal influences). Min 1 — an empty graph has nothing to render. */
  edges: z.array(CausalLoopEdgeSchema).min(1, {
    message: "CausalLoopDiagram requires at least one edge.",
  }),

  /**
   * Loops (closed cycles). Optional — a diagram can render edges without
   * declaring loops, but the editorial point of this template is the loop.
   */
  loops: z.array(CausalLoopLoopSchema).optional(),

  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block — drift presets, atmosphere, callback indicator. */
  _direction: DirectionBlockSchema.optional(),
});

export const CausalLoopDiagramSchema = z.object({
  data: CausalLoopDiagramDataSchema,
});
