/**
 * OrgChart types — all derived from Zod schemas via z.infer<>.
 *
 * No hand-declared interfaces: the schema IS the type contract.
 * If you need a new field, add it to schema.ts first.
 */

import type { z } from "zod";
import type {
  OrgChartNodeSchema,
  OrgChartEdgeSchema,
  OrgChartDataSchema,
  OrgChartSchema,
} from "./schema";

export type OrgChartNode = z.infer<typeof OrgChartNodeSchema>;
export type OrgChartEdge = z.infer<typeof OrgChartEdgeSchema>;
export type OrgChartData = z.infer<typeof OrgChartDataSchema>;
export type OrgChart = z.infer<typeof OrgChartSchema>;
