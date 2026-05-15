/**
 * Zod schemas for AtlasPlate template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { MapAnnotationSchema } from "../../components/MapAnnotations.types";
import { GraticuleSchema } from "../../components/Graticule.types";
import { MapTitleConfigSchema } from "../../components/mapTitleFrame.schema";
import { ALL_DISPUTE_TAGS } from "../../utils/disputedBoundaries";
import { ALL_SEA_LABEL_TAGS } from "../../utils/seaLabels";

/**
 * Canonical aesthetic register enum for AtlasPlate. Re-exported as a
 * named symbol so `types.ts` can `z.infer` the type from the SAME source
 * the schema validates against. Avoids the silent-drift bug where the
 * hand-typed union and the Zod enum disagree.
 */
export const AtlasAestheticSchema = z.enum([
  "atlas",
  "vintage",
  "atlas-relief",
]);
export type AtlasAesthetic = z.infer<typeof AtlasAestheticSchema>;

const AtlasCountryFillSchema = z.object({
  iso3: z.string().min(2),
  fill: z.string().optional(),
  label: z.string().optional(),
  noData: z.boolean().optional(),
  /**
   * Country-label placement strategy:
   *   - "auto" (default) — let the collision-aware placer decide. Tiny
   *     countries auto-skip, small countries get leader-out, others sit
   *     inside.
   *   - "inside" — force the label INSIDE the polygon at centroid; no
   *     leader. Use when the polygon is large enough to host the label.
   *   - "leader" — force a leader-out placement (label outside the
   *     polygon with a thin line connecting). Use for tiny countries
   *     where label-inside is illegible.
   *   - "skip" — render no label at all.
   */
  labelStrategy: z.enum(["auto", "inside", "leader", "skip"]).optional(),
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
  /**
   * How country fills transition INTO this phase from the previous one.
   * - "lerp" (default): sRGB interpolation over the camera-transition window.
   *   Soft, editorial — the right default for analogy / phase reveals.
   * - "instant": hard swap at the phase boundary. Use for dramatic beats
   *   ("the bloc collapses") where the suddenness IS the editorial point.
   */
  fillTransition: z.enum(["lerp", "instant"]).optional(),
  showExtentBox: z.boolean().optional(),
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
    /**
     * Sea-label opt-in. Renders major water bodies as tracked uppercase
     * text following a projected geodesic arc — the atlas-plate convention
     * that makes an editorial atlas read as an atlas rather than data-vis.
     *
     * Pass an array of tag strings (curated set; see `seaLabels.ts`) or
     * inline `SeaLabel` objects for episode-specific labels.
     *
     * Example: `seaLabels: ["pacific", "atlantic", "mediterranean"]`.
     */
    seaLabels: z
      .array(
        z.union([
          z.string(),
          z.object({
            tag: z.string(),
            label: z.string(),
            arc: z.array(z.tuple([z.number(), z.number()])).min(2),
            hierarchy: z.enum(["primary", "secondary"]),
          }),
        ]),
      )
      .optional()
      .superRefine((val, ctx) => {
        if (!val) return;
        for (const item of val) {
          if (typeof item === "string" && !ALL_SEA_LABEL_TAGS.includes(item)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Unknown sea-label tag "${item}". Valid: ${ALL_SEA_LABEL_TAGS.join(", ")}`,
            });
          }
        }
      }),
    /**
     * Locator inset — a small Equal Earth world map showing where the
     * camera is currently focused. Anchors the viewer when the main view
     * is zoomed in on a region. Standard editorial-atlas device.
     *
     * When `phase.focus.iso3` is set, the inset draws a rust extent
     * rectangle around those countries' world-space bbox. Otherwise
     * (world view), no rectangle.
     */
    inset: z
      .object({
        show: z.literal(true),
        corner: z
          .enum(["top-left", "top-right", "bottom-left", "bottom-right"])
          .optional(),
        size: z.number().positive().optional(),
      })
      .optional(),
    backgroundVariant: z.enum(["light", "dark"]).optional(),
    aesthetic: AtlasAestheticSchema.optional(),
    backgroundTint: z.string().optional(),
    mapTitle: MapTitleConfigSchema.optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});
