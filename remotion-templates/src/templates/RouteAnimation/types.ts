/**
 * Data types for the RouteAnimation template.
 *
 * Animated paths on a world map showing trade routes, supply chains,
 * or movement of resources/technology between locations.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  RouteAnimationDataSchema,
  RouteInsetSchema,
  RoutePhaseCameraSchema,
  RoutePhaseSchema,
  RoutePointSchema,
  RouteRadialSchema,
  RouteSegmentSchema,
} from "./schema";

export type RoutePoint = z.infer<typeof RoutePointSchema>;
export type RouteSegment = z.infer<typeof RouteSegmentSchema>;
export type RoutePhaseCamera = z.infer<typeof RoutePhaseCameraSchema>;
export type RoutePhase = z.infer<typeof RoutePhaseSchema>;
export type RouteRadial = z.infer<typeof RouteRadialSchema>;
export type RouteInset = z.infer<typeof RouteInsetSchema>;
export type RouteAnimationData = z.infer<typeof RouteAnimationDataSchema>;
