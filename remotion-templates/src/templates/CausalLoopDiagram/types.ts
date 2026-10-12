/**
 * CausalLoopDiagram template types.
 *
 * Renders a systems-thinking causal loop diagram (CLD) — nodes connected by
 * polarised arrows, with named feedback loops (Reinforcing R or Balancing B)
 * highlighted via central badges.
 *
 * Editorial use case: security dilemmas, arms races, sanctions tit-for-tat
 * cycles, economic feedback spirals — anything where the editorial argument
 * is that the system is a feedback loop rather than a linear sequence.
 *
 * Types are derived from Zod schemas. See `schema.ts` for the full spec.
 */

import type { z } from "zod";
import type {
  CausalLoopDiagramDataSchema,
  CausalLoopEdgeSchema,
  CausalLoopLoopSchema,
  CausalLoopNodeSchema,
} from "./schema";

export type CausalLoopNode = z.infer<typeof CausalLoopNodeSchema>;
export type CausalLoopEdge = z.infer<typeof CausalLoopEdgeSchema>;
export type CausalLoopLoop = z.infer<typeof CausalLoopLoopSchema>;
export type CausalLoopDiagramData = z.infer<typeof CausalLoopDiagramDataSchema>;
