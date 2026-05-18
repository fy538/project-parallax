/**
 * ArcDiagram — nodes on a horizontal baseline connected by semicircular arcs.
 *
 * The editorial form for INFLUENCE, LINEAGE, and SUCCESSION stories where
 * the natural ordering (time, generation, hierarchy) matters.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down). Field
 * semantics live on schema.ts.
 */

import type { z } from "zod";
import type {
  ArcConnectionSchema,
  ArcDiagramDataSchema,
  ArcNodeSchema,
} from "./schema";

export type ArcNode = z.infer<typeof ArcNodeSchema>;
export type ArcConnection = z.infer<typeof ArcConnectionSchema>;
export type ArcDiagramData = z.infer<typeof ArcDiagramDataSchema>;
