/**
 * Zod schemas for EscalationLadder template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

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
    /**
     * Fine-tune the ladder block's visual centering. The default centering
     * splits surplus area as left/right padding mathematically, but the
     * visible mass is asymmetric (short dates left, longer card text right),
     * so the optical center sits slightly left of the geometric center.
     * `contentOffset.x` adds px to the right; `contentOffset.y` adds px
     * downward (use negative to push UP). Typical episode-side tuning:
     * `{ x: 100–160, y: -40 to -60 }` to optically center on a 1920×1080
     * canvas with 6 rungs. See POLISH.md T6 (Use the canvas).
     */
    contentOffset: z
      .object({
        x: z.number().optional(),
        y: z.number().optional(),
      })
      .optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});
