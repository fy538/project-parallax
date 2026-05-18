/**
 * BayesianUpdate — animated probability distribution that shifts as evidence arrives.
 *
 * Visualizes Bayesian reasoning: prior belief → evidence → posterior.
 * Variants: single (one question + posterior), compare (two competing
 * hypotheses), multi (3-6 competing hypotheses).
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  BayesianUpdateDataSchema,
  EvidenceItemSchema,
  HypothesisTrackSchema,
  MultiHypothesisSchema,
} from "./schema";

export type EvidenceItem = z.infer<typeof EvidenceItemSchema>;
export type HypothesisTrack = z.infer<typeof HypothesisTrackSchema>;
export type MultiHypothesis = z.infer<typeof MultiHypothesisSchema>;
export type BayesianUpdateData = z.infer<typeof BayesianUpdateDataSchema>;
