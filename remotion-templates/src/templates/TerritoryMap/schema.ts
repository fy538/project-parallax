/**
 * Zod schemas for TerritoryMap template.
 *
 * Shows how territorial control changed over time. Supports country-level
 * Mapbox match-expression fills (default) and subnational deck.gl
 * GeoJsonLayer fills.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
import { MapAnnotationSchema } from "../../components/MapAnnotations.types";
import { RegisterSchema, LightPresetSchema } from "../../components/MapGL.types";
import { GraticuleSchema } from "../../components/Graticule.types";

// ── Actor ──────────────────────────────────────────────────────────────────

export const TerritoryActorSchema = z.object({
  fill: z.string().describe(
    "Hex color for this actor's territorial fills.",
  ),
  label: z.string().min(1).describe(
    "Display label shown in actor-label Markers at region centroids.",
  ),
});

// ── Timestep ────────────────────────────────────────────────────────────────

export const TerritoryTimestepSchema = z.object({
  id: z.string().min(1).describe(
    "Unique key used to look up region control at this timestep.",
  ),
  label: z.string().min(1).describe(
    "Displayed in the timeline strip (e.g. \"1700\", \"Jun 2014\").",
  ),
  snap: z.boolean().optional().describe(
    "If true, transition is a hard cut instead of a smooth crossfade. Use for rupture moments.",
  ),
});

// ── Region ──────────────────────────────────────────────────────────────────

export const TerritoryRegionSchema = z.object({
  id: z.string().min(1).describe(
    "ISO 3166-1 alpha-3 for country mode; GeoJSON feature.properties.id for subnational mode.",
  ),
  centroid: z.tuple([z.number(), z.number()]).optional().describe(
    "[lng, lat] centroid for actor-label Marker placement.",
  ),
});

// ── Fog preset ──────────────────────────────────────────────────────────────

const FogPresetSchema = z.enum(["editorial", "atmospheric", "vintage", "none"]);

// ── Main schema ─────────────────────────────────────────────────────────────

export const TerritoryMapDataSchema = z.object({
  // Geography
  center: z.tuple([z.number(), z.number()]).describe(
    "[lng, lat] map center.",
  ),
  zoom: z.number().positive().describe("Mapbox zoom level."),
  pitch: z.number().optional().describe("Camera pitch in degrees. Default 0 (flat editorial register)."),
  bearing: z.number().optional().describe("Camera bearing in degrees. Default 0."),
  mode: z.enum(["country", "subnational"]).optional().describe(
    "Rendering mode: \"country\" (default) for Mapbox match-expression fills; \"subnational\" for deck.gl GeoJsonLayer.",
  ),
  geoJsonUrl: z.string().optional().describe(
    "URL of the GeoJSON file for subnational mode. Required when mode === \"subnational\".",
  ),

  // Time dimension
  timesteps: z.array(TerritoryTimestepSchema).min(2).describe(
    "Ordered sequence of timesteps. Minimum 2.",
  ),
  crossfadeSec: z.number().positive().optional().describe(
    "Duration in seconds for fill crossfade between timesteps. Default 0.5.",
  ),

  // Control data
  regions: z.array(TerritoryRegionSchema).describe(
    "Regions to render with optional centroid Marker positions.",
  ),
  control: z.record(z.string(), z.record(z.string(), z.string())).describe(
    "regionId → { timestepId → actorId } control lookup.",
  ),
  actors: z.record(z.string(), TerritoryActorSchema).describe(
    "Actor definitions keyed by actorId.",
  ),

  // Overlays
  showTimeline: z.boolean().optional().describe("Show horizontal timestep strip. Default true."),
  showActorLabels: z.boolean().optional().describe("Show actor-name Markers at region centroids. Default true."),

  // Map style
  register: RegisterSchema.optional().describe("Visual register. Default \"dark\"."),
  fogPreset: FogPresetSchema.optional().describe("Atmospheric fog preset. Default \"atmospheric\"."),
  lightPreset: LightPresetSchema.optional().describe("Mapbox Standard lighting preset."),
  annotations: z.array(MapAnnotationSchema).optional().describe("Editorial annotation overlays."),
  graticule: GraticuleSchema.optional().describe("Parallels-and-meridians overlay."),

  // Standard editorial fields
  title: z.string().optional().describe("Composition title shown via MapTitleFrame when set."),
  source: z.string().optional().describe("Data source attribution."),
  episode: z.string().optional().describe("Episode slug."),
  durationSec: z.number().positive().optional().describe("Duration in seconds. Default 10."),
  backgroundVariant: z.enum(["light", "dark"]).optional().describe("Background register. Default \"dark\"."),
  _direction: DirectionBlockSchema.optional(),
});

export const TerritoryMapSchema = z.object({
  data: TerritoryMapDataSchema,
});
