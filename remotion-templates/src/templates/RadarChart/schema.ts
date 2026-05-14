/**
 * Zod schemas for RadarChart template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

const RadarAxisSchema = z.object({
  label: z.string(),
  short: z.string().optional(),
});

const RadarSubjectSchema = z.object({
  name: z.string(),
  values: z.array(z.number().min(0).max(100)),
  color: z.string(),
  fillOpacity: z.number().min(0).max(1).optional(),
});

export const RadarChartSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string().describe("State the finding, not the topic. Write: 'China leads on yield but lags on node size and equipment' not 'Capability comparison'. The title IS the editorial argument."),
    subtitle: z.string().optional(),
    axes: z.array(RadarAxisSchema).min(3),
    subjects: z.array(RadarSubjectSchema).min(1),
    morphFrom: z.array(RadarSubjectSchema).optional(),
    gridLevels: z.array(z.number()).optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    holdAfterRevealSec: z.number().min(0).max(10).optional()
      .describe("Deliberate pause (seconds) after radar polygons finish drawing, before exit fade. Must fit within durationSec. Default: 0."),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});
