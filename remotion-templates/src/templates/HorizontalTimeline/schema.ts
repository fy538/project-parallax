/**
 * Zod schemas for HorizontalTimeline template — runtime validation + Remotion Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down — see StatReveal for
 * canonical pattern).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// ── Sub-schemas ─────────────────────────────────────────────────────────────

export const TimelineCameraFocusSchema = z.union([z.number(), z.literal("pullback")]);
export const TimelineCameraBehaviorSchema = z.enum(["track", "snap", "hold"]);
export const TimelineWeightSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export const TimelineEraWeightSchema = z.enum(["equal", "foil-old", "foil-new"]);
export const TimelineModeSchema = z.enum(["single", "dual", "morph"]);
export const TimelineFocusModeNameSchema = z.enum(["cinematic", "settled"]);

export const TimelineCameraStepSchema = z.object({
  /** Which event to focus on (index into events array, or "pullback" for full view) */
  focus: TimelineCameraFocusSchema,
  /** Zoom level: 1.0 = show ~3 events, 1.5 = tight on one, 0.6 = wide pullback */
  zoom: z.number(),
  /** Duration of this step in seconds */
  duration: z.number(),
  /** Camera behavior: how to arrive at this position */
  behavior: TimelineCameraBehaviorSchema.optional(),
  /** Optional overlay label shown during this step */
  label: z.string().optional(),
  /** Dim non-focused events during this step (default: true) */
  dimOthers: z.boolean().optional(),
});

export const TimelineEventDataSchema = z.object({
  /** Year or date label (e.g., "1941", "Oct 1941", "2022 Q4") */
  year: z.string(),
  /** Event title — short, punchy */
  title: z.string(),
  /** Optional description (shown when focused) */
  description: z.string().optional(),
  /** Optional accent color override for this event */
  color: z.string().optional(),
  /** Importance weight: affects node size and card prominence (1-3, default 1) */
  weight: TimelineWeightSchema.optional(),
  /** Optional icon/emoji shown in the node marker */
  icon: z.string().optional(),
});

export const TimelinePairDataSchema = z.object({
  /** Event from era A (top spine) */
  eraA: TimelineEventDataSchema,
  /** Event from era B (bottom spine) */
  eraB: TimelineEventDataSchema,
  /** Connection label drawn between paired events (shown on pullback) */
  connection: z.string().optional(),
  /** Phase position on shared axis — required when phaseAxis is set. */
  phasePosition: z.number().optional(),
});

export const PhaseAxisConfigSchema = z.object({
  label: z.string(),
  unit: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  ticks: z.array(z.number()).optional(),
});

export const TimelineMorphEventDataSchema = z.object({
  /** Era A state */
  eraAYear: z.string(),
  eraATitle: z.string(),
  eraADescription: z.string().optional(),
  /** Era B state (morphs to this) */
  eraBYear: z.string(),
  eraBTitle: z.string(),
  eraBDescription: z.string().optional(),
  /** Importance weight */
  weight: TimelineWeightSchema.optional(),
});

export const TimelineFocusModeSchema = z.union([
  TimelineFocusModeNameSchema,
  z.object({
    mode: TimelineFocusModeNameSchema,
    dimOpacity: z.number().min(0).max(1).optional(),
    hideOffFocusCards: z.boolean().optional(),
  }),
]);

export const TimelineEraBracketSchema = z.object({
  label: z.string(),
  startIndex: z.number().int().min(0),
  endIndex: z.number().int().min(0),
  color: z.string().optional(),
});

// ── Root schema ─────────────────────────────────────────────────────────────

export const HorizontalTimelineDataSchema = z
  .object({
    /** Composition title */
    title: z.string(),
    /** Chinese translation */
    titleCn: z.string().optional(),
    /** Optional subtitle */
    subtitle: z.string().optional(),

    /** Timeline mode */
    mode: TimelineModeSchema,

    // ── Single mode events ──
    /** Events for single-spine mode */
    events: z.array(TimelineEventDataSchema).optional(),

    // ── Dual mode events ──
    /** Paired events for dual-spine mode */
    pairs: z.array(TimelinePairDataSchema).optional(),
    /** Era A label — for dual mode */
    eraATitle: z.string().optional(),
    /** Era B label — for dual mode */
    eraBTitle: z.string().optional(),
    /** Phase-axis config — enforces phase-position alignment in dual mode. */
    phaseAxis: PhaseAxisConfigSchema.optional(),
    /** When connection lines render (in seconds from start) — dual mode only. */
    connectionRevealStart: z.number().nonnegative().optional(),
    /** Era weight ratio for dual mode. */
    eraWeight: TimelineEraWeightSchema.optional(),

    /**
     * Focus isolation behavior during camera tracking.
     *
     * - `"cinematic"`: off-focus events render dot+year only (card text hidden),
     *   focused event renders fully. Removes the "double card overlap" effect
     *   when two events are close together on the spine. Default when
     *   `cameraPath` is provided.
     * - `"settled"`: all events render their full card content with mild
     *   dimming. Use for static / pullback contexts where the viewer should
     *   read multiple events at once. Default when `cameraPath` is absent.
     *
     * Can also be set as an object for fine-tuning (`dimOpacity`, etc.).
     * See: May 13, 2026 timeline visual-register pass + POLISH.md T-rules.
     */
    focusMode: TimelineFocusModeSchema.optional(),

    // ── Morph mode events ──
    /** Events that morph between eras */
    morphEvents: z.array(TimelineMorphEventDataSchema).optional(),
    /** Era A title for morph header */
    morphEraATitle: z.string().optional(),
    /** Era B title for morph header */
    morphEraBTitle: z.string().optional(),

    // ── Styling ──
    /** Primary accent color for era A / single spine (default: brand amber) */
    eraAColor: z.string().optional(),
    /** Secondary accent color for era B (default: brand rust) */
    eraBColor: z.string().optional(),
    /** Background variant */
    backgroundVariant: z.enum(["light", "dark"]).optional(),
    /** Background tint color */
    backgroundTint: z.string().optional(),

    // ── Camera ──
    /** Camera keyframe sequence (auto-generated if omitted) */
    cameraPath: z.array(TimelineCameraStepSchema).optional(),

    // ── Meta ──
    /** Episode identifier */
    episode: z.string(),
    /** Total duration in seconds */
    durationSec: z.number().positive().optional(),

    // ── Era/bracket groupings (single mode only) ──
    /** Era brackets rendered above the spine spanning a range of events. */
    eras: z.array(TimelineEraBracketSchema).optional(),

    // ── Directing language overrides ──
    /** Per-composition direction block from visual-spec _direction namespace. */
    _direction: DirectionBlockSchema.optional(),
  })
  .superRefine((d, ctx) => {
    if (d.mode === "single" && (!d.events || d.events.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "mode 'single' requires at least one event",
        path: ["events"],
      });
    }
    if (d.mode === "dual" && (!d.pairs || d.pairs.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "mode 'dual' requires at least one pair",
        path: ["pairs"],
      });
    }
    if (d.mode === "morph" && (!d.morphEvents || d.morphEvents.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "mode 'morph' requires at least one morphEvent",
        path: ["morphEvents"],
      });
    }
    // phaseAxis is dual-only and requires phasePosition on every pair —
    // anything else turns phase alignment into a decorative claim instead of
    // a real one. See: references/template-research/timeline-comparison.md § 7.
    if (d.phaseAxis) {
      if (d.mode !== "dual") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "phaseAxis is only supported in mode 'dual'",
          path: ["phaseAxis"],
        });
      }
      if (d.pairs) {
        d.pairs.forEach((pair, i) => {
          if (pair.phasePosition === undefined) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message:
                "phaseAxis is set; every pair must declare phasePosition. " +
                "Falsifying phase alignment (e.g., letting events fall on calendar-spaced x positions) " +
                "is the most common audit failure for this template.",
              path: ["pairs", i, "phasePosition"],
            });
          }
        });
      }
    }
  });

export const HorizontalTimelineSchema = z.object({
  data: HorizontalTimelineDataSchema,
});
