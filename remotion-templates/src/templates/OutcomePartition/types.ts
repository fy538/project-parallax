/**
 * OutcomePartition — a 2D field partitioned into nested rectangles
 * representing scenario outcomes. The two axes are editorially named; each
 * successive partition (subdivision) represents one decision in the scenario
 * chain. Final regions are labeled outcomes.
 *
 * Visual register: RAND Robust Decision Making partition plots +
 * De Stijl / Mondrian compositional logic. Pure position + thin rules; no
 * card chrome possible. Area encodes likelihood / probability weight
 * without a number.
 *
 * Reference: research report 2026-05-17, Aesthetic C; RAND TR-392.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down). The
 * recursive `Region` type is defined in schema.ts (Zod's `z.lazy` requires
 * the static type to exist alongside the schema) and re-exported here.
 */

import type { z } from "zod";
import type { OutcomePartitionDataSchema } from "./schema";

export type { LeafRegion, SplitRegion, Region } from "./schema";
export type OutcomePartitionData = z.infer<typeof OutcomePartitionDataSchema>;
