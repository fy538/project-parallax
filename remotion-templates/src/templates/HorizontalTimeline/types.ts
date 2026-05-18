/**
 * HorizontalTimeline — cinematic horizontal camera track through time.
 *
 * Replaces TimelineComparison, DualTimeline, and TimelineMorph with a single
 * configurable template that uses horizontal camera tracking (Vox/documentary style).
 *
 * Modes:
 * - "single": One timeline spine, events above/below
 * - "dual": Two parallel spines (era A top, era B bottom) with connections
 * - "morph": Single spine, events cross-fade between era A and era B content
 *
 * Camera behaviors:
 * - track: smooth horizontal pan to event (default)
 * - snap: smash zoom/cut to event (dramatic moments)
 * - pullback: zoom out to reveal full timeline
 * - hold: camera stays, content animates (for morph)
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  HorizontalTimelineDataSchema,
  PhaseAxisConfigSchema,
  TimelineCameraBehaviorSchema,
  TimelineCameraFocusSchema,
  TimelineCameraStepSchema,
  TimelineEraBracketSchema,
  TimelineEraWeightSchema,
  TimelineEventDataSchema,
  TimelineFocusModeNameSchema,
  TimelineFocusModeSchema,
  TimelineModeSchema,
  TimelineMorphEventDataSchema,
  TimelinePairDataSchema,
  TimelineWeightSchema,
} from "./schema";

export type TimelineCameraFocus = z.infer<typeof TimelineCameraFocusSchema>;
export type TimelineCameraBehavior = z.infer<typeof TimelineCameraBehaviorSchema>;
export type TimelineWeight = z.infer<typeof TimelineWeightSchema>;
export type TimelineEraWeight = z.infer<typeof TimelineEraWeightSchema>;
export type TimelineMode = z.infer<typeof TimelineModeSchema>;
export type TimelineFocusModeName = z.infer<typeof TimelineFocusModeNameSchema>;
export type TimelineFocusMode = z.infer<typeof TimelineFocusModeSchema>;
export type TimelineCameraStep = z.infer<typeof TimelineCameraStepSchema>;
export type TimelineEventData = z.infer<typeof TimelineEventDataSchema>;
export type TimelinePairData = z.infer<typeof TimelinePairDataSchema>;
export type PhaseAxisConfig = z.infer<typeof PhaseAxisConfigSchema>;
export type TimelineMorphEventData = z.infer<typeof TimelineMorphEventDataSchema>;
export type TimelineEraBracket = z.infer<typeof TimelineEraBracketSchema>;
export type HorizontalTimelineData = z.infer<typeof HorizontalTimelineDataSchema>;
