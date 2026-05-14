/**
 * Zod schemas for AtlasPlate template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { MapAnnotationSchema } from "../../components/MapAnnotations.types";
import { GraticuleSchema } from "../../components/Graticule.types";
import { MapTitleConfigSchema } from "../../components/mapTitleFrame.schema";
import { ALL_DISPUTE_TAGS } from "../../utils/disputedBoundaries";

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
  rotation: z.tuple([z.number(), z.number()]).optional(),
  cameraTransition: z.enum(["linear", "cinematic", "via-globe"]).optional(),
  cameraDwell: z
    .object({
      before: z.number().min(0).max(1).optional(),
      after: z.number().min(0).max(1).optional(),
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
    /**
     * Render disputed-boundary overlays as dashed rust lines. See
     * src/utils/disputedBoundaries.ts for the curated set and tags.
     * - `true`: render ALL disputes.
     * - `string[]`: render only the named tags (e.g., ["taiwan-strait", "nine-dash"]).
     * - omitted: no disputes rendered.
     */
    disputedBoundaries: z
      .union([z.literal(true), z.array(z.string())])
      .optional()
      .superRefine((val, ctx) => {
        if (Array.isArray(val)) {
          for (const tag of val) {
            if (!ALL_DISPUTE_TAGS.includes(tag)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Unknown dispute tag "${tag}". Valid: ${ALL_DISPUTE_TAGS.join(", ")}`,
              });
            }
          }
        }
      }),
    backgroundVariant: z.enum(["light", "dark"]).optional(),
    aesthetic: z.enum(["atlas", "vintage"]).optional(),
    backgroundTint: z.string().optional(),
    mapTitle: MapTitleConfigSchema.optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});
