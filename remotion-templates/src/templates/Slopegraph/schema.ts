/**
 * Zod schema for Slopegraph template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { EditorialFrameSchema } from "../../components/EditorialFrame/schema";

const SlopegraphEntitySchema = z.object({
  label: z.string(),
  leftValue: z.number(),
  rightValue: z.number(),
  color: z.string().optional(),
  hero: z.boolean().optional(),
});

export const SlopegraphSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z
      .string()
      .describe(
        "State the finding, not the topic. Write: 'Five countries cut subsidies — Brazil doubled them' not 'Subsidy policy 2010–2024'. The title IS the editorial argument.",
      ),
    subtitle: z.string().optional(),
    leftLabel: z.string(),
    rightLabel: z.string(),
    entities: z.array(SlopegraphEntitySchema).min(2, {
      message: "Slopegraph needs at least 2 entities to be readable.",
    }),
    unit: z.string().optional(),
    source: z.string().optional(),
    durationSec: z.number().positive().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    backgroundTint: z.string().optional(),
    frame: EditorialFrameSchema.optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});
