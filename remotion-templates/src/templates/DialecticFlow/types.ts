/**
 * DialecticFlow template types.
 *
 * Hegelian thesis → antithesis → synthesis. Three panels in triangle layout
 * (T top-left, A top-right, S bottom-center) with tension marker between
 * T and A, and convergence arrows into S.
 */

import type { z } from "zod";
import type {
  DialecticFlowDataSchema,
  DialecticPanelSchema,
} from "./schema";

export type DialecticPanel = z.infer<typeof DialecticPanelSchema>;
export type DialecticFlowData = z.infer<typeof DialecticFlowDataSchema>;
