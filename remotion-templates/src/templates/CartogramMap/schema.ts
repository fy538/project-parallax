/**
 * Zod schemas for CartogramMap template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down — see StatReveal for
 * canonical pattern).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { MapAnnotationSchema } from "../../components/MapAnnotations.types";
import { MapTitleConfigSchema } from "../../components/mapTitleFrame.schema";

export const CartogramDatumSchema = z.object({
  iso3: z.string().min(2),
  value: z.number(),
  label: z.string().optional(),
  color: z.string().optional(),
});

export const CartogramPhaseSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  durationSec: z.number().positive(),
  data: z.array(CartogramDatumSchema),
});

export const CartogramMapDataSchema = z.object({
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
  phases: z.array(CartogramPhaseSchema).min(1),
  durationSec: z.number().positive().optional(),
  source: z.string().optional(),
  framePadding: z.number().nonnegative().optional(),
  unit: z.string().optional(),
  valueLabel: z.string().optional(),
  maxRadiusPx: z.number().positive().optional(),
  scaleType: z.enum(["sqrt", "linear"]).optional(),
  symbolColor: z.string().optional(),
  showCoastlines: z.boolean().optional(),
  fitToData: z
    .boolean()
    .optional()
    .describe(
      "Fit the projection to data-country bounding box instead of the full world. " +
      "Default true — use false only for truly global datasets."
    ),
  xyStrength: z.number().min(0).max(1).optional(),
  annotations: z.array(MapAnnotationSchema).optional(),
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  backgroundTint: z.string().optional(),
  mapTitle: MapTitleConfigSchema.optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const CartogramMapSchema = z.object({
  data: CartogramMapDataSchema,
});
