/**
 * Data types for the FlowMap template.
 *
 * FlowMap shows directional volume flows between geographic regions.
 * Arc width encodes comparative magnitude (volume IS the argument).
 * Animated particles show directionality.
 *
 * Key distinction from RouteAnimation: RouteAnimation shows discrete paths
 * at equal visual weight (path IS the argument). FlowMap shows simultaneous
 * flows where arc width encodes comparative magnitude (volume IS the argument).
 *
 * Types derived from Zod schemas — see schema.ts.
 */

import type { z } from "zod";
import type {
  FlowMapDataSchema,
  FlowArcSchema,
  FlowActorSchema,
} from "./schema";

export type FlowArc = z.infer<typeof FlowArcSchema>;
export type FlowActor = z.infer<typeof FlowActorSchema>;
export type FlowMapData = z.infer<typeof FlowMapDataSchema>;
