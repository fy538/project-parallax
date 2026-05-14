/**
 * Zod schema for the `_direction` block authored in template data JSON.
 *
 * Mirrors the `DirectionBlock` TypeScript interface in `useDirection.ts`.
 * Use this in every template's data schema:
 *
 *   _direction: DirectionBlockSchema.optional(),
 *
 * Why a single shared schema (May 14, 2026):
 *   Previously every template declared `_direction: z.unknown().optional()`,
 *   which meant typos like `driftPreset: "documantary"` slipped through
 *   Zod validation and silently fell through to defaults at runtime. The
 *   tightened enums (driftPreset / atmosphere / paceProfile / holdBehavior)
 *   surface authoring errors at schema-validate time.
 *
 * Forward-compatibility:
 *   The schema is `.passthrough()` so experimental fields not yet typed
 *   in `DirectionBlock` round-trip cleanly. Tighten enums as the canonical
 *   vocabulary stabilizes; leave free-form fields (`cameraPath`,
 *   `syncPoints`, `revealMode`, `staggerMs`, etc.) permissive.
 */

import { z } from "zod";

/** Canonical drift presets — see `DRIFT_PRESETS` in useDirection.ts. */
export const DriftPresetSchema = z.enum([
  "none",
  "editorial",
  "slow",
  "normal",
  "documentary",
  "breathing",
  "settle",
  "sway",
]);

/** Atmosphere density tiers consumed by Background. */
export const AtmosphereDensitySchema = z.enum([
  "none",
  "subtle",
  "normal",
  "dense",
]);

/** Pace profile from PACE: annotations — maps to entrance timing scales. */
export const PaceProfileSchema = z.enum(["urgent", "analytical", "breathing"]);

/** Hold behavior at end of a segment. */
export const HoldBehaviorSchema = z.enum(["breathe", "land", "linger"]);

/** Resolved sync point from Whisper word-level alignment. */
export const DirectionSyncPointSchema = z.object({
  word: z.string(),
  timeSec: z.number(),
  frame: z.number(),
  confidence: z.number().optional(),
});

/**
 * DirectionBlock schema. `.passthrough()` preserves unknown / experimental
 * fields so script writers can prototype new directing vocabulary without
 * touching this file.
 */
export const DirectionBlockSchema = z
  .object({
    // Camera (consumed by individual templates, not useDirection)
    cameraPath: z.array(z.unknown()).optional(),
    cameraNote: z.string().optional(),
    proportional: z.boolean().optional(),
    syncPoints: z.array(DirectionSyncPointSchema).optional(),

    // Reveal (consumed by individual templates)
    revealMode: z.string().optional(),
    staggerMs: z.number().optional(),
    revealEasing: z.string().optional(),
    highlightIndex: z.number().optional(),
    spotlightSequence: z.array(z.unknown()).optional(),
    progressive: z.boolean().optional(),

    // Hold
    holdAfter: z.number().optional(),
    holdBehavior: HoldBehaviorSchema.optional(),
    preDelay: z.number().optional(),
    narrationGate: z.object({ word: z.string() }).passthrough().optional(),

    // Cut (consumed by FullEpisode / manifest)
    transitionOut: z.string().optional(),
    washColor: z.string().optional(),
    transitionDuration: z.number().optional(),

    // Mood
    atmosphere: AtmosphereDensitySchema.optional(),
    ambientParticles: z.number().optional(),
    musicBedAtmosphereMultiplier: z.number().optional(),
    driftPreset: DriftPresetSchema.optional(),
    globalDim: z.number().optional(),
    backgroundTint: z.string().optional(),

    // Pace
    paceProfile: PaceProfileSchema.optional(),
  })
  .passthrough();

export type DirectionBlockInput = z.input<typeof DirectionBlockSchema>;
export type DirectionBlockOutput = z.output<typeof DirectionBlockSchema>;
