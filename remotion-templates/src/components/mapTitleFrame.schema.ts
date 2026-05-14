/**
 * Zod schema for MapTitleConfig — shared across the 7 full-bleed map
 * templates so the placement contract stays consistent.
 *
 * Mirrors `MapTitleConfig` in MapTitleFrame.tsx. Spread into a template's
 * data schema as:
 *
 *   mapTitle: MapTitleConfigSchema.optional(),
 *
 * Defaults are resolved at component time (not by Zod) — the runtime
 * default is `{ mode: "banner", treatment: "minimalist" }`. Omit the field
 * entirely to accept the defaults; opt into "inline" for back-compat on
 * episodes whose existing renders already look correct without bands.
 */

import { z } from "zod";

export const MapTitleMastheadSchema = z.object({
  date: z.string().optional(),
  scope: z.string().optional(),
  note: z.string().optional(),
});

export const MapTitleConfigSchema = z.object({
  mode: z.enum(["banner", "cartouche", "inline"]).optional(),
  treatment: z.enum(["minimalist", "atlas", "masthead"]).optional(),
  bottomBand: z.union([z.boolean(), z.literal("auto")]).optional(),
  placement: z
    .enum(["top-left", "top-right", "bottom-left", "bottom-right", "auto"])
    .optional(),
  masthead: MapTitleMastheadSchema.optional(),
});
