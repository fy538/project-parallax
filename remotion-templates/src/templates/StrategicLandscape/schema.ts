/**
 * Zod schemas for StrategicLandscape template — runtime validation + Remotion Studio editing.
 */

import { z } from "zod";

const ActorSchema = z.object({
  name: z.string(),
  nameCn: z.string().optional(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  size: z.number().min(0.5).max(3).optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
});

export const StrategicLandscapeSchema = z.object({
  data: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    xAxisLabel: z.string(),
    xAxisLabelEnd: z.string(),
    yAxisLabel: z.string(),
    yAxisLabelEnd: z.string(),
    actors: z.array(ActorSchema),
    quadrantLabels: z.tuple([z.string(), z.string(), z.string(), z.string()]).optional(),
    episode: z.string().optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    _direction: z.unknown().optional(),
  }),
});
