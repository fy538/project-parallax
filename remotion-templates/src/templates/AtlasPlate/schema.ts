/**
 * Zod schemas for AtlasPlate template.
 */

import { z } from "zod";
import { MapAnnotationSchema } from "../../components/MapAnnotations.types";
import { GraticuleSchema } from "../../components/Graticule.types";

const AtlasCountryFillSchema = z.object({
  iso3: z.string().min(2),
  fill: z.string().optional(),
  label: z.string().optional(),
  noData: z.boolean().optional(),
});

const AtlasPhaseSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  durationSec: z.number().positive(),
  countries: z.array(AtlasCountryFillSchema),
  focus: z
    .object({
      iso3: z.array(z.string()).optional(),
      center: z.tuple([z.number(), z.number()]).optional(),
      scaleHint: z.number().positive().optional(),
    })
    .optional(),
});

export const AtlasPlateSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    projection: z
      .enum([
        "equalEarth",
        "naturalEarth",
        "mercator",
        "orthographic",
        "albersUsa",
        "equirectangular",
      ])
      .optional(),
    phases: z.array(AtlasPhaseSchema).min(1),
    durationSec: z.number().positive().optional(),
    source: z.string().optional(),
    framePadding: z.number().nonnegative().optional(),
    annotations: z.array(MapAnnotationSchema).optional(),
    graticule: GraticuleSchema.optional(),
    backgroundVariant: z.enum(["light", "dark"]).optional(),
    backgroundTint: z.string().optional(),
    _direction: z.unknown().optional(),
  }),
});
