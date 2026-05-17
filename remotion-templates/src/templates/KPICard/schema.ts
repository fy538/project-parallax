/**
 * Zod schema for KPICard template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { EditorialFrameSchema } from "../../components/EditorialFrame/schema";

export const KPICardSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    value: z.string(),
    unit: z.string().optional(),
    change: z.string().optional(),
    changeColor: z.string().optional(),
    context: z.string().optional(),
    trend: z.array(z.number()).optional(),
    trendColor: z.string().optional(),
    source: z.string().optional(),
    durationSec: z.number().positive().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    backgroundTint: z.string().optional(),
    frame: EditorialFrameSchema.optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});
