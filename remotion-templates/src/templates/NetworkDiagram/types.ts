/**
 * NetworkDiagram template types.
 *
 * Nodes connected by edges with labels, data callouts, and control points.
 * Replaces Claude SVG "network/flow" illustrations with deterministic rendering.
 *
 * Supports optional cameraPath for cinematic narrated camera that pans between
 * node clusters, zooms into relationships, and uses focus isolation.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  NetworkCalloutSchema,
  NetworkCameraStepSchema,
  NetworkCameraTargetSchema,
  NetworkControlSchema,
  NetworkDiagramDataSchema,
  NetworkEdgeSchema,
  NetworkLayoutSchema,
  NetworkNodeSchema,
} from "./schema";

export type NetworkNode = z.infer<typeof NetworkNodeSchema>;
export type NetworkEdge = z.infer<typeof NetworkEdgeSchema>;
export type NetworkControl = z.infer<typeof NetworkControlSchema>;
export type NetworkCallout = z.infer<typeof NetworkCalloutSchema>;
export type NetworkLayout = z.infer<typeof NetworkLayoutSchema>;
export type NetworkCameraTarget = z.infer<typeof NetworkCameraTargetSchema>;
export type NetworkCameraStep = z.infer<typeof NetworkCameraStepSchema>;
export type NetworkDiagramData = z.infer<typeof NetworkDiagramDataSchema>;
