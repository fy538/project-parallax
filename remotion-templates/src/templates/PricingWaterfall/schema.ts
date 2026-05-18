/**
 * Zod schemas for PricingWaterfall template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { EditorialFrameSchema } from "../../components/EditorialFrame/schema";

export const PricingWaterfallStageSchema = z.object({
  label: z.string(),
  share: z.number(),
  descriptor: z.string().optional(),
  hero: z.boolean().optional(),
  color: z.string().optional(),
});

export const PricingWaterfallDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  total: z.object({
    value: z.string(),
    label: z.string(),
  }),
  stages: z.array(PricingWaterfallStageSchema),
  source: z.string().optional(),
  durationSec: z.number().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  backgroundTint: z.string().optional(),
  motionIdentity: z
    .enum(["still", "briefing", "documentary"])
    .optional()
    .describe("Substrate-motion preset (grain + atmosphere + wobble combination). Default: channel-wide 'briefing'. See design/motion.ts."),
  /**
   * Opt-in editorial frame. When set, the chart renders inside EditorialFrame
   * with publication-grade composition. See EDITORIAL_FRAME_ARCHITECTURE.md.
   */
  frame: EditorialFrameSchema.optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const PricingWaterfallSchema = z.object({
  data: PricingWaterfallDataSchema,
});
