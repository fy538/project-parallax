/**
 * Zod schemas for ProportionalSymbolMap template.
 */

import { z } from "zod";
import { MapAnnotationSchema } from "../../components/MapAnnotations.types";
import { GraticuleSchema } from "../../components/Graticule.types";

const SymbolDatumSchema = z.object({
  iso3: z.string().min(2),
  value: z.number(),
  label: z.string().optional(),
  color: z.string().optional(),
});

const ProportionalPhaseSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  durationSec: z.number().positive(),
  symbols: z.array(SymbolDatumSchema),
  focus: z
    .object({
      iso3: z.array(z.string()).optional(),
      center: z.tuple([z.number(), z.number()]).optional(),
      scaleHint: z.number().positive().optional(),
    })
    .optional(),
});

export const ProportionalSymbolMapSchema = z.object({
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
    phases: z.array(ProportionalPhaseSchema).min(1),
    durationSec: z.number().positive().optional(),
    source: z.string().optional(),
    framePadding: z.number().nonnegative().optional(),
    unit: z.string().optional(),
    valueLabel: z.string().optional(),
    maxRadiusPx: z.number().positive().optional(),
    scaleType: z.enum(["sqrt", "linear"]).optional(),
    symbolColor: z.string().optional(),
    annotations: z.array(MapAnnotationSchema).optional(),
    graticule: GraticuleSchema.optional(),
    backgroundVariant: z.enum(["light", "dark"]).optional(),
    backgroundTint: z.string().optional(),
    _direction: z.unknown().optional(),
  }),
});
