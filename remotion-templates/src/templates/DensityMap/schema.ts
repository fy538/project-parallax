/**
 * Zod schemas for DensityMap template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { MapAnnotationSchema } from "../../components/MapAnnotations.types";
import { LabelDensitySchema } from "../../components/MapGL.types";
import { MapTitleConfigSchema } from "../../components/mapTitleFrame.schema";

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
    /** Label-density register — see MapGL `labelDensity`. DensityMap
     *  defaults to `"editorial"` — country labels at globe scale for
     *  orientation, auto-suppress at regional zoom where the heatmap
     *  dominates. Per-shot override to `"minimal"` when explicit
     *  MapAnnotations name everything that matters. */
    labelDensity: LabelDensitySchema.optional(),
    annotations: z.array(MapAnnotationSchema).optional(),
    inset: z
      .object({
        show: z.boolean().optional(),
        position: z.enum(["tl", "tr", "bl", "br"]).optional(),
        size: z.number().positive().optional(),
        framed: z.boolean().optional(),
      })
      .optional(),
    mapTitle: MapTitleConfigSchema.optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});
