/**
 * Zod schemas for BayesianUpdate template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

const EvidenceItemSchema = z.object({
  label: z.string(),
  direction: z.enum(["up", "down"]),
  magnitude: z.number().min(1).max(5),
  color: z.string().optional(),
  source: z.string().optional(),
});

const HypothesisTrackSchema = z.object({
  label: z.string(),
  prior: z.number().min(0).max(100),
  color: z.string().optional(),
});

const MultiHypothesisSchema = z.object({
  label: z.string(),
  prior: z.number().min(0).max(100),
  color: z.string().optional(),
});

export const BayesianUpdateSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string().describe("State the reasoning outcome, not the topic. Write: 'Each sanction wave raises the probability of domestic substitution' not 'Export controls analysis'. The title IS the editorial argument."),
    subtitle: z.string().optional(),
    variant: z.enum(["single", "compare", "multi"]),
    prior: z.number().min(0).max(100).optional(),
    question: z.string().optional(),
    hypotheses: z.tuple([HypothesisTrackSchema, HypothesisTrackSchema]).optional(),
    multiHypotheses: z.array(MultiHypothesisSchema).optional(),
    credibleInterval: z.tuple([z.number(), z.number()]).optional(),
    credibleIntervalLabel: z.string().optional(),
    evidence: z.array(EvidenceItemSchema),
    marketPrice: z.number().min(0).max(100).optional(),
    marketSource: z.string().optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});
