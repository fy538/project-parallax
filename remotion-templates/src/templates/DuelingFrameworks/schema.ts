/**
 * Zod schemas for DuelingFrameworks template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

const FrameworkTenetSchema = z.object({
  text: z.string(),
  textCn: z.string().optional(),
});

const FrameworkSchema = z.object({
  name: z.string(),
  nameCn: z.string().optional(),
  color: z.string(),
  tenets: z.array(FrameworkTenetSchema),
  score: z.number().min(0).max(100),
  verdict: z.string().optional(),
  verdictCn: z.string().optional(),
});

export const DuelingFrameworksSchema = z.object({
  data: z.object({
    title: z.string(),
    titleCn: z.string().optional(),
    subtitle: z.string().optional(),
    subtitleCn: z.string().optional(),
    frameworkA: FrameworkSchema,
    frameworkB: FrameworkSchema,
    phenomenon: z.string(),
    phenomenonCn: z.string().optional(),
    verdictLabel: z.string().optional(),
    verdictLabelCn: z.string().optional(),
    episode: z.string().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    durationSec: z.number().optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});
