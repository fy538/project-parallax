/**
 * SankeyFlow — animated Sankey/funnel diagrams showing how values flow
 * from sources through intermediate stages to destinations. Used for
 * budget breakdowns, policy cascades, resource flows.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  SankeyNodeSchema,
  SankeyLinkSchema,
  SankeyFlowDataSchema,
} from "./schema";

export type SankeyNode = z.infer<typeof SankeyNodeSchema>;
export type SankeyLink = z.infer<typeof SankeyLinkSchema>;
export type SankeyFlowData = z.infer<typeof SankeyFlowDataSchema>;
