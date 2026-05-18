/**
 * Zod schemas for OutcomePartition template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// Region is recursive — Zod requires the .lazy() workaround for self-reference.
const LeafRegion = z.object({
  kind: z.literal("leaf"),
  label: z.string(),
  sublabel: z.string().optional(),
  severity: z.number().min(0).max(1).optional(),
  color: z.string().optional(),
  revealStep: z.number().optional(),
  highlighted: z.boolean().optional(),
});

type RegionType =
  | z.infer<typeof LeafRegion>
  | {
      kind: "split";
      axis: "horizontal" | "vertical";
      at: number;
      revealStep?: number;
      label?: string;
      children: [RegionType, RegionType];
    };

const RegionSchema: z.ZodType<RegionType> = z.lazy(() =>
  z.union([
    LeafRegion,
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

export const OutcomePartitionSchema = z.object({
  data: z.object({
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
  }),
});
