import { z } from "zod";

export const GenerativeBackdropSchema = z.object({
  episode: z.string().optional(),
  durationSec: z.number().positive().optional(),
  density: z.enum(["quiet", "medium", "busy"]).optional(),
  driftSpeed: z.number().positive().optional(),
  kicker: z.string().optional(),
  title: z.string().optional(),
  _direction: z.unknown().optional(),
});
