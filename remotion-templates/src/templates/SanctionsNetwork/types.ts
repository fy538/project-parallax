/**
 * SanctionsNetwork template types.
 *
 * All types are derived from the Zod schema via z.infer<> — no hand-declared
 * interfaces.
 *
 * SanctionsNetwork renders a typed, directed network diagram for sanctions
 * architecture: sanctioners impose primary sanctions on targets, secondary
 * threats radiate outward to relay conduits, and evasion paths flow from the
 * target through relays back to the sanctioner bloc's market.
 *
 * The canonical use case is the Russia sanctions architecture (2022–2024),
 * which is wired as the sample data in index.tsx.
 */

import type { z } from "zod";
import type {
  SanctionsNetworkDataSchema,
  SanctionsNodeSchema,
  SanctionsEdgeSchema,
  SanctionsSectorSchema,
} from "./schema";

export type SanctionsNetworkData = z.infer<typeof SanctionsNetworkDataSchema>;
export type SanctionsNode = z.infer<typeof SanctionsNodeSchema>;
export type SanctionsEdge = z.infer<typeof SanctionsEdgeSchema>;
export type SanctionsSector = z.infer<typeof SanctionsSectorSchema>;
