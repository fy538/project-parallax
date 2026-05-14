/**
 * Zod schemas for RouteAnimation template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { MapAnnotationSchema } from "../../components/MapAnnotations.types";
import { GraticuleSchema } from "../../components/Graticule.types";
import { LabelDensitySchema } from "../../components/MapGL.types";

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
    _direction: DirectionBlockSchema.optional(),
    backgroundTint: z.string().optional(),
    backgroundVariant: z.enum(["light", "dark"]).optional(),
    /**
     * Enable terrain hillshading. Default false (atlas register). Set true
     * per-shot when relief is the editorial point (Himalayan supply route,
     * alpine border dispute, etc.). See: LESSONS.md L99.
     */
    terrain: z.boolean().optional(),
    /**
     * Label-density register — see MapGL `labelDensity`. Default
     * `"editorial"` for RouteAnimation: country labels at globe, suppress
     * at regional zoom (>= 4) where MapAnnotations dominate. Shared
     * schema lives at `src/components/MapGL.types.ts`.
     */
    labelDensity: LabelDensitySchema.optional(),
    /**
     * Editorial annotations layered on the map. See
     * components/MapAnnotations.tsx and references/template-research/map-annotations.md
     * for hierarchy, leader-line, and phase-scoping conventions.
     */
    annotations: z.array(MapAnnotationSchema).optional(),
    /**
     * Parallels-and-meridians overlay. Faint grid that reads as "atlas
     * plate." On-brand because the channel is named *Parallax*. See:
     * components/Graticule.tsx.
     */
    graticule: GraticuleSchema.optional(),
    /**
     * Locator inset — small overview map in a corner showing where the
     * main map is zoomed. See: components/MapInset.tsx.
     */
    inset: z.object({
      show: z.boolean().optional(),
      position: z.enum(["tl", "tr", "bl", "br"]).optional(),
      size: z.number().positive().optional(),
      framed: z.boolean().optional(),
    }).optional(),
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
