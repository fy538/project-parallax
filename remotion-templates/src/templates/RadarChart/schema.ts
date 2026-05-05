/**
 * Zod schemas for RadarChart template.
 */

import { z } from "zod";

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
    title: z.string(),
    subtitle: z.string().optional(),
    axes: z.array(RadarAxisSchema).min(3),
    subjects: z.array(RadarSubjectSchema).min(1),
    morphFrom: z.array(RadarSubjectSchema).optional(),
    gridLevels: z.array(z.number()).optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    _direction: z.unknown().optional(),
  }),
});
