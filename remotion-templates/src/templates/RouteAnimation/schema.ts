/**
 * Zod schemas for RouteAnimation template.
 */

import { z } from "zod";

const RoutePointSchema = z.object({
  name: z.string(),
  coordinates: z.tuple([z.number(), z.number()]),
  label: z.string().optional(),
  color: z.string().optional(),
  sublabel: z.string().optional(),
  labelPosition: z.enum(["above", "below", "left", "right"]).optional(),
});

const RouteSegmentSchema = z.object({
  from: z.number(),
  to: z.number(),
  label: z.string().optional(),
  color: z.string().optional(),
  dashed: z.boolean().optional(),
});

const RoutePhaseSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  durationSec: z.number(),
  activeSegments: z.array(z.number()),
  activePoints: z.array(z.number()),
  center: z.tuple([z.number(), z.number()]).optional(),
  scale: z.number().optional(),
});

export const RouteAnimationSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    points: z.array(RoutePointSchema).min(1),
    segments: z.array(RouteSegmentSchema),
    phases: z.array(RoutePhaseSchema),
    radial: z.object({
      hubIndex: z.number().int().nonnegative(),
      staggerSec: z.number().positive().optional(),
      hubColor: z.string().optional(),
      arcColor: z.string().optional(),
    }).optional(),
    center: z.tuple([z.number(), z.number()]).optional(),
    scale: z.number().optional(),
    routeColor: z.string().optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    _direction: z.unknown().optional(),
    backgroundTint: z.string().optional(),
    backgroundVariant: z.enum(["light", "dark"]).optional(),
  })
  .superRefine((d, ctx) => {
    // Radial mode auto-generates segments; non-radial requires explicit ones.
    if (!d.radial && d.segments.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "segments array must be non-empty unless `radial` mode is set",
        path: ["segments"],
      });
    }
    if (d.radial && (d.radial.hubIndex < 0 || d.radial.hubIndex >= d.points.length)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "radial.hubIndex out of range",
        path: ["radial", "hubIndex"],
      });
    }
  }),
});
