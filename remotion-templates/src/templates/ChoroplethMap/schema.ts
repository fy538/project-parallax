/**
 * Zod schemas for ChoroplethMap template.
 */

import { z } from "zod";

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
  }),
});
