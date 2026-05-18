/**
 * EscalationLadder — vertical event sequence with severity indicators.
 * Optional cameraPath enables cinematic vertical climb that dwells on each
 * rung with progressive tension cues at critical thresholds.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  EscalationLadderDataSchema,
  LadderRungSchema,
  SeverityLevelSchema,
} from "./schema";

export type SeverityLevel = z.infer<typeof SeverityLevelSchema>;
export type LadderRung = z.infer<typeof LadderRungSchema>;
export type EscalationLadderData = z.infer<typeof EscalationLadderDataSchema>;
