/**
 * Zod schemas for EscalationLadder template.
 */

import { z } from "zod";

const LadderRungSchema = z.object({
  label: z.string(),
  date: z.string().optional(),
  severity: z.enum(["low", "moderate", "elevated", "high", "critical"]),
  detail: z.string().optional(),
  current: z.boolean().optional(),
});

export const EscalationLadderSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    rungs: z.array(LadderRungSchema).min(2),
    direction: z.enum(["escalation", "de-escalation"]).optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    _direction: z.unknown().optional(),
  }),
});
