/**
 * Zod schemas for DensityMap template.
 */

import { z } from "zod";
import { MapAnnotationSchema } from "../../components/MapAnnotations.types";

const DensityPointSchema = z.object({
  at: z.tuple([z.number(), z.number()]),
  weight: z.number().positive().optional(),
  /** Bivariate second dimension — when set, drives bin color independently. */
  colorWeight: z.number().optional(),
  tag: z.string().optional(),
});

const DensityPhaseSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  durationSec: z.number().positive(),
  points: z.array(DensityPointSchema),
  camera: z
    .object({
      longitude: z.number(),
      latitude: z.number(),
      zoom: z.number(),
      pitch: z.number().optional(),
      bearing: z.number().optional(),
    })
    .optional(),
});

export const DensityMapSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    phases: z.array(DensityPhaseSchema).min(1),
    durationSec: z.number().positive().optional(),
    source: z.string().optional(),
    mode: z.enum(["hex", "heatmap", "grid"]).optional(),
    cellSize: z.number().positive().optional(),
    coverage: z.number().min(0).max(1).optional(),
    colorRamp: z.array(z.string()).optional(),
    colorAggregation: z.enum(["sum", "mean", "max"]).optional(),
    opacity: z.number().min(0).max(1).optional(),
    camera: z
      .object({
        longitude: z.number(),
        latitude: z.number(),
        zoom: z.number(),
        pitch: z.number().optional(),
        bearing: z.number().optional(),
      })
      .optional(),
    backgroundVariant: z.enum(["light", "dark"]).optional(),
    backgroundTint: z.string().optional(),
    annotations: z.array(MapAnnotationSchema).optional(),
    inset: z
      .object({
        show: z.boolean().optional(),
        position: z.enum(["tl", "tr", "bl", "br"]).optional(),
        size: z.number().positive().optional(),
        framed: z.boolean().optional(),
      })
      .optional(),
    _direction: z.unknown().optional(),
  }),
});
