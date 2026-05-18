/**
 * Zod schemas for TilegramUSMap template — runtime validation + Remotion
 * Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { MapTitleConfigSchema } from "../../components/mapTitleFrame.schema";

const US_STATE_CODES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC",
] as const;

export const USStateCodeSchema = z.enum(US_STATE_CODES);

export const TilegramStateValueSchema = z.object({
  state: USStateCodeSchema,
  value: z.number(),
  label: z.string().optional(),
  color: z.string().optional(),
});

export const TilegramColorScaleSchema = z.object({
  min: z.number(),
  max: z.number(),
  low: z.string(),
  mid: z.string().optional(),
  high: z.string(),
});

export const TilegramColorScaleInputSchema = z.union([
  TilegramColorScaleSchema,
  z.literal("diverging"),
  z.literal("sequential"),
]);

export const TilegramUSMapDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  states: z.array(TilegramStateValueSchema).min(1, {
    message:
      "TilegramUSMap requires at least one state value — an empty tilegram has nothing to show.",
  }),
  colorScale: TilegramColorScaleInputSchema.optional(),
  valueLabel: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  mapTitle: MapTitleConfigSchema.optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const TilegramUSMapSchema = z.object({
  data: TilegramUSMapDataSchema,
});
