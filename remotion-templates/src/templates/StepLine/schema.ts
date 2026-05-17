/**
 * Zod schema for StepLine template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { EditorialFrameSchema } from "../../components/EditorialFrame/schema";

const StepPointSchema = z.object({
  x: z.union([z.string(), z.number()]),
  y: z.number(),
  event: z.string().optional(),
});

export const StepLineSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    points: z.array(StepPointSchema).min(2),
    color: z.string().optional(),
    areaFill: z.boolean().optional(),
    areaOpacity: z.number().min(0).max(1).optional(),
    xLabel: z.string().optional(),
    yLabel: z.string().optional(),
    yUnit: z.string().optional(),
    source: z.string().optional(),
    durationSec: z.number().positive().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    backgroundTint: z.string().optional(),
    frame: EditorialFrameSchema.optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});
