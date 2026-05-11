/**
 * Zod schemas for HorizontalTimeline template — runtime validation + Remotion Studio editing.
 */

import { z } from "zod";

// ── Sub-schemas ─────────────────────────────────────────────────────────────

const TimelineCameraStepSchema = z.object({
  /** Which event to focus on (index into events array, or "pullback" for full view) */
  focus: z.union([z.number(), z.literal("pullback")]),
  /** Zoom level: 1.0 = show ~3 events, 1.5 = tight on one, 0.6 = wide pullback */
  zoom: z.number(),
  /** Duration of this step in seconds */
  duration: z.number(),
  /** Camera behavior: how to arrive at this position */
  behavior: z.enum(["track", "snap", "hold"]).optional(),
  /** Optional overlay label shown during this step */
  label: z.string().optional(),
  /** Dim non-focused events during this step (default: true) */
  dimOthers: z.boolean().optional(),
});

const TimelineEventDataSchema = z.object({
  /** Year or date label (e.g., "1941", "Oct 1941", "2022 Q4") */
  year: z.string(),
  /** Event title — short, punchy */
  title: z.string(),
  /** Optional description (shown when focused) */
  description: z.string().optional(),
  /** Optional accent color override for this event */
  color: z.string().optional(),
  /** Importance weight: affects node size and card prominence (1-3, default 1) */
  weight: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  /** Optional icon/emoji shown in the node marker */
  icon: z.string().optional(),
});

const TimelinePairDataSchema = z.object({
  /** Event from era A (top spine) */
  eraA: TimelineEventDataSchema,
  /** Event from era B (bottom spine) */
  eraB: TimelineEventDataSchema,
  /** Connection label drawn between paired events (shown on pullback) */
  connection: z.string().optional(),
  /** Phase position on shared axis — required when phaseAxis is set. */
  phasePosition: z.number().optional(),
});

const PhaseAxisConfigSchema = z.object({
  label: z.string(),
  unit: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  ticks: z.array(z.number()).optional(),
});

const TimelineMorphEventDataSchema = z.object({
  /** Era A state */
  eraAYear: z.string(),
  eraATitle: z.string(),
  eraADescription: z.string().optional(),
  /** Era B state (morphs to this) */
  eraBYear: z.string(),
  eraBTitle: z.string(),
  eraBDescription: z.string().optional(),
  /** Importance weight */
  weight: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
});

// ── Root schema ─────────────────────────────────────────────────────────────

export const HorizontalTimelineSchema = z.object({
  data: z.object({
    /** Composition title */
    title: z.string(),
    /** Chinese translation */
    titleCn: z.string().optional(),
    /** Optional subtitle */
    subtitle: z.string().optional(),

    /** Timeline mode */
    mode: z.enum(["single", "dual", "morph"]),

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

    // ── Directing language overrides ──
    /** Per-composition direction block from visual-spec _direction namespace. */
    _direction: z.unknown().optional(),
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
  }),
});
