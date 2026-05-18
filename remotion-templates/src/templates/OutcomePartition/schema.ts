/**
 * Zod schemas for OutcomePartition template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// Region is recursive — Zod requires the .lazy() workaround for self-reference.
export const LeafRegionSchema = z.object({
  kind: z.literal("leaf"),
  label: z.string(),
  sublabel: z.string().optional(),
  severity: z.number().min(0).max(1).optional(),
  color: z.string().optional(),
  revealStep: z.number().optional(),
  highlighted: z.boolean().optional(),
});

export type LeafRegion = z.infer<typeof LeafRegionSchema>;

export type SplitRegion = {
  kind: "split";
  axis: "horizontal" | "vertical";
  at: number;
  revealStep?: number;
  label?: string;
  children: [Region, Region];
};

export type Region = LeafRegion | SplitRegion;

export const RegionSchema: z.ZodType<Region> = z.lazy(() =>
  z.union([
    LeafRegionSchema,
    z.object({
      kind: z.literal("split"),
      axis: z.enum(["horizontal", "vertical"]),
      at: z.number().min(0.05).max(0.95),
      revealStep: z.number().optional(),
      label: z.string().optional(),
      children: z.tuple([RegionSchema, RegionSchema]),
    }),
  ]),
);

export const OutcomePartitionDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  xAxisLabel: z.string().optional(),
  yAxisLabel: z.string().optional(),
  root: RegionSchema,
  source: z.string().optional(),
  durationSec: z.number().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const OutcomePartitionSchema = z.object({
  data: OutcomePartitionDataSchema,
});
