/**
 * Zod schemas for ChoroplethMap template.
 */

import { z } from "zod";
import { MapAnnotationSchema } from "../../components/MapAnnotations.types";
import { GraticuleSchema } from "../../components/Graticule.types";

const CountryDataSchema = z.object({
  name: z.string(),
  iso3: z.string().optional(),
  value: z.number().optional(),
  fill: z.string().optional(),
  label: z.string().optional(),
  noData: z.boolean().optional(),
});

const AnimationPhaseSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  durationSec: z.number(),
  countries: z.array(CountryDataSchema),
  center: z.tuple([z.number(), z.number()]).optional(),
  scale: z.number().optional(),
});

export const ChoroplethMapSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    projection: z.enum(["globe", "mercator", "equalEarth", "naturalEarth", "albers"]).optional(),
    center: z.tuple([z.number(), z.number()]).optional(),
    scale: z.number().optional(),
    legend: z.object({
      breaks: z.array(z.number()).optional(),
      unit: z.string().optional(),
      label: z.string().optional(),
      noDataLabel: z.string().optional(),
    }).optional(),
    colorRamp: z.union([
      z.enum(["blue", "red", "teal", "gray", "ylOrBr", "rdBu"]),
      z.array(z.string()),
    ]).optional(),
    phases: z.array(AnimationPhaseSchema).min(1),
    backgroundVariant: z.enum(["light", "dark"]).optional(),
    _direction: z.unknown().optional(),
    backgroundTint: z.string().optional(),
    /**
     * Enable terrain hillshading. Default false (atlas register). Set true
     * per-shot when relief is the editorial point (mountain choropleth,
     * etc.). See: LESSONS.md L99.
     */
    terrain: z.boolean().optional(),
    /**
     * Editorial annotations layered on the map. See
     * components/MapAnnotations.tsx and references/template-research/map-annotations.md
     * for hierarchy, leader-line, and phase-scoping conventions.
     */
    annotations: z.array(MapAnnotationSchema).optional(),
    /**
     * Parallels-and-meridians overlay. See components/Graticule.tsx.
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
  }),
});
