/**
 * Zod schemas for EscalationLadder template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down — see StatReveal for
 * canonical pattern).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const SeverityLevelSchema = z.enum([
  "low",
  "moderate",
  "elevated",
  "high",
  "critical",
]);

export const LadderRungSchema = z.object({
  label: z.string(),
  date: z.string().optional(),
  severity: SeverityLevelSchema,
  detail: z.string().optional(),
  current: z.boolean().optional(),
});

export const LadderThresholdSchema = z.object({
  afterRungIndex: z.number().int().min(0),
  label: z.string(),
  color: z.string().optional(),
});

export const EscalationLadderDataSchema = z.object({
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
  thresholds: z.array(LadderThresholdSchema).optional(),
  // Cinematic narrated camera — same shape pattern as NetworkDiagram.
  // The full NarratedCameraStep type (in useNarratedCamera.ts) carries a
  // few extra optional fields (label, dimAmount, blurAmount, ...) that
  // aren't surfaced here; the schema accepts the JSON-serializable subset
  // script writers actually author.
  cameraPath: z
    .array(
      z.object({
        target: z.union([
          z.object({ x: z.number(), y: z.number() }),
          z.string(),
        ]),
        zoom: z.number().positive(),
        duration: z.number().positive(),
        focus: z.array(z.number().int()).optional(),
        focusGroup: z.string().optional(),
        behavior: z.enum(["track", "snap"]).optional(),
        shake: z.number().min(0).max(1).optional(),
        label: z.string().optional(),
        dimAmount: z.number().min(0).max(1).optional(),
        blurAmount: z.number().min(0).optional(),
        unfocusedScale: z.number().positive().optional(),
        syncStart: z.string().optional(),
      }),
    )
    .optional(),
  ambientParticles: z.boolean().optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const EscalationLadderSchema = z.object({
  data: EscalationLadderDataSchema,
});
