/**
 * AxiomList template types.
 *
 * Numbered foundational claims — "here are the N axioms this analysis
 * rests on." Euclidean / Wittgensteinian register: stable hierarchical
 * propositions revealed in sequence.
 */

import type { z } from "zod";
import type { AxiomListDataSchema, AxiomSchema } from "./schema";

export type Axiom = z.infer<typeof AxiomSchema>;
export type AxiomListData = z.infer<typeof AxiomListDataSchema>;
