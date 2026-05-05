/**
 * Zod schemas for TimelineMorph template.
 */

import { z } from "zod";

const MorphEventSchema = z.object({
  eraALabel: z.string(),
  eraAText: z.string(),
  eraBLabel: z.string(),
  eraBText: z.string(),
  icon: z.string().optional(),
});

export const TimelineMorphSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    eraATitle: z.string(),
    eraBTitle: z.string(),
    eraAColor: z.string().optional(),
    eraBColor: z.string().optional(),
    events: z.array(MorphEventSchema).min(1),
    holdDurationSec: z.number().optional(),
    morphDurationSec: z.number().optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    _direction: z.unknown().optional(),
  }),
});
