/**
 * Zod schemas for ArcDiagram template — runtime validation + Remotion
 * Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down — see StatReveal for
 * canonical pattern). Inner shapes exported so types.ts can `z.infer` from
 * each.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const ArcNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  sublabel: z.string().optional(),
  color: z.string().optional(),
  importance: z.enum(["primary", "secondary"]).optional(),
  axisStamp: z.string().optional(),
});

export const ArcConnectionSchema = z.object({
  from: z.string(),
  to: z.string(),
  label: z.string().optional(),
  strength: z.number().min(0).max(2).optional(),
  style: z.enum(["solid", "dashed"]).optional(),
  color: z.string().optional(),
  emphasis: z.enum(["accent", "muted", "rebut"]).optional(),
});

export const ArcDiagramDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  nodes: z.array(ArcNodeSchema).min(2, {
    message:
      "ArcDiagram requires at least two nodes — a single point on a line has no relationships to render.",
  }),
  connections: z.array(ArcConnectionSchema),
  showBaseline: z.boolean().optional(),
  axisTitle: z.string().optional(),
  eras: z
    .array(
      z.object({
        label: z.string(),
        range: z.tuple([
          z.number().int().min(0),
          z.number().int().min(0),
        ]),
        color: z.string().optional(),
      }),
    )
    .optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  backgroundTint: z.string().optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const ArcDiagramSchema = z.object({
  data: ArcDiagramDataSchema,
});
