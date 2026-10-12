/**
 * Zod schema for SpiralTimeline template.
 *
 * A spiral timeline maps time → radius (linear inward → outward) and
 * time-mod-cycle → angle (one full revolution = `cycleYears`). Events that
 * recur at the "same point in the cycle" (e.g., 50-year financial crises)
 * appear at the same angular position on different rings, making the
 * structural pattern visible.
 *
 * Authors choose `cycleYears` to match their thesis:
 *   • 50 years — Kondratieff economic waves, hegemonic-power cycles
 *   • 80 years — Strauss-Howe generational/civic crisis cycle
 *   • 100 years — long political cycles, century reordering
 *   • 20 years — Tytler democratic cycle, generation gap
 *
 * The angular position carries the structural argument — the radius is just
 * "when in chronological time." Two events at the same angle ARE the rhyme.
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — SpiralTimeline entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// ── Category ───────────────────────────────────────────────────────────────

export const SpiralTimelineCategorySchema = z.object({
  /** Stable identifier — referenced by events. */
  id: z.string(),
  /** Display label for the legend. */
  label: z.string(),
  /**
   * Hex colour. If omitted, falls back to a palette accent rotation
   * (gold, china, dustblue, walnut) by category index.
   */
  color: z.string().optional(),
  /** Marker glyph shape. Default "circle". */
  glyph: z.enum(["circle", "square", "diamond", "triangle"]).optional(),
});

// ── Event ──────────────────────────────────────────────────────────────────

export const SpiralTimelineEventSchema = z.object({
  /** Year (full 4-digit; negative for BCE). */
  year: z.number(),
  /** Short label. Kept terse — spiral geometry crowds quickly. */
  label: z.string(),
  /** Optional category id; drives colour + glyph. */
  category: z.string().optional(),
  /**
   * Emphasis tier.
   *   • "primary"   — large marker, label always visible
   *   • "secondary" — standard marker (default)
   *   • "context"   — small dot, no label (background fill)
   */
  emphasis: z.enum(["primary", "secondary", "context"]).optional(),
  /**
   * Reveal time in seconds. "auto" staggers in chronological order. A
   * number pins the reveal to that timestamp for narration sync.
   */
  revealAtSec: z.union([z.literal("auto"), z.number().nonnegative()]).optional(),
});

// ── Top-level data ─────────────────────────────────────────────────────────

export const SpiralTimelineDataSchema = z.object({
  /** Episode slug. */
  episode: z.string(),
  /** Optional title (HeaderStrip). */
  title: z.string().optional(),
  /** Optional subtitle (italic serif beneath title). */
  subtitle: z.string().optional(),
  /** Optional source attribution. */
  source: z.string().optional(),
  /** Total clip duration in seconds. Default 14s. */
  durationSec: z.number().positive().optional(),

  // ── Cycle definition ─────────────────────────────────────────────────────
  /**
   * Cycle length in years — one full revolution of the spiral equals this
   * many years. The choice IS the editorial argument: a 50-year cycle
   * argues for Kondratieff/hegemonic resonance; an 80-year cycle argues
   * for the Strauss-Howe civic crisis.
   */
  cycleYears: z.number().positive(),
  /**
   * Lower bound of the time span (inclusive). Maps to spiral start (inner
   * radius). Use the earliest year you have an event for.
   */
  startYear: z.number(),
  /** Upper bound of the time span (inclusive). Maps to spiral end (outer radius). */
  endYear: z.number(),

  // ── Content ──────────────────────────────────────────────────────────────
  /** Event categories (for colour-coded legend + glyph variation). */
  categories: z.array(SpiralTimelineCategorySchema).optional(),
  /** Events plotted on the spiral. Min 1 — an empty spiral is meaningless. */
  events: z.array(SpiralTimelineEventSchema).min(1),

  // ── Styling ──────────────────────────────────────────────────────────────
  /**
   * Direction the spiral unwinds.
   *   • "outward" — earliest in centre, latest on outer ring (default — feels
   *     like growing complexity / accumulation; matches Western reading)
   *   • "inward"  — latest in centre, earliest on outer ring (use when the
   *     argument is "we converge on the present")
   */
  spiralDirection: z.enum(["outward", "inward"]).optional(),
  /**
   * Sense of rotation as time increases.
   *   • "cw"  — clockwise (default; feels like a clock face)
   *   • "ccw" — counter-clockwise
   */
  rotationDirection: z.enum(["cw", "ccw"]).optional(),
  /**
   * Show angular cycle markers (12 ticks like a clock). Useful when the
   * cycle has named sub-phases (Q1/Q2/Q3/Q4 of a Kondratieff). Default true.
   */
  showCycleTicks: z.boolean().optional(),
  /**
   * Show radial year guides — concentric circles at major round years.
   * Default true. Helps the viewer read off "when" alongside "what cycle phase."
   */
  showYearGuides: z.boolean().optional(),

  // ── Standard ─────────────────────────────────────────────────────────────
  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block. */
  _direction: DirectionBlockSchema.optional(),
});

export const SpiralTimelineSchema = z.object({
  data: SpiralTimelineDataSchema,
});
