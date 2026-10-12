/**
 * Zod schema for MorphTransition template.
 *
 * Animates between two data states of the same embedded template. The
 * sequence: hold the FROM state → animate the morph → hold the TO state.
 *
 * Three morphable templates supported in v1:
 *   • DataChart       — bar values lerp by `label` match; bars reorder if rankings change
 *   • TimeSeriesChart — append-style morph (timeline extends, new points
 *                       and annotations appear in sequence)
 *   • StatReveal      — single number counts from FROM.stat.value to
 *                       TO.stat.value; comparisons cross-fade
 *
 * Each variant carries the template name as a discriminator + that
 * template's specific FROM and TO data shapes. Type-safe via discriminated
 * union (same approach as ComparisonPair).
 *
 * Editorial use case: "Watch the rankings shift" / "Election-night data
 * updates" / "Before-and-after policy change" / "GDP composition 1990
 * versus 2024 in continuous motion." When the editorial point is the
 * CHANGE itself, MorphTransition makes it kinetic; ComparisonPair would
 * show the same data side-by-side at rest.
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — MorphTransition entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

import { DataChartDataSchema } from "../DataChart/schema";
import { TimeSeriesChartDataSchema } from "../TimeSeriesChart/schema";
import { StatRevealDataSchema } from "../StatReveal/schema";

// ── MorphState (one side of the morph — either FROM or TO) ─────────────────

const MorphStateLabels = {
  /** Small-caps strip above the rendered template ("1990", "BEFORE"). */
  label: z.string().optional(),
};

export const MorphStateSchema = z.discriminatedUnion("template", [
  z.object({
    template: z.literal("DataChart"),
    data: DataChartDataSchema,
    ...MorphStateLabels,
  }),
  z.object({
    template: z.literal("TimeSeriesChart"),
    data: TimeSeriesChartDataSchema,
    ...MorphStateLabels,
  }),
  z.object({
    template: z.literal("StatReveal"),
    data: StatRevealDataSchema,
    ...MorphStateLabels,
  }),
]);

// ── Top-level data ─────────────────────────────────────────────────────────

export const MorphTransitionDataSchema = z
  .object({
    /** Episode slug. */
    episode: z.string(),
    /** Optional title overlay. */
    title: z.string().optional(),
    /** Optional subtitle. */
    subtitle: z.string().optional(),
    /** Source attribution. */
    source: z.string().optional(),
    /** Total clip duration in seconds. Default 14s. */
    durationSec: z.number().positive().optional(),

    /**
     * Starting data state. The morph holds this state for `holdFromSec`,
     * then interpolates toward `to`.
     */
    from: MorphStateSchema,
    /** Ending data state. After the morph, the template holds this state. */
    to: MorphStateSchema,

    /**
     * Hold the FROM state for this many seconds before starting the morph.
     * Default 2s. Gives viewers time to read the starting state.
     */
    holdFromSec: z.number().nonnegative().optional(),
    /**
     * Duration of the morph animation. Default 3s. The interpolated values
     * cross over during this window.
     */
    morphSec: z.number().positive().optional(),
    /**
     * Hold the TO state for this many seconds after the morph completes.
     * Default 3s. Gives viewers time to read the ending state.
     */
    holdToSec: z.number().nonnegative().optional(),
    /**
     * Easing curve for the interpolation. Default "ease-in-out".
     *   • "linear"      — constant rate
     *   • "ease-in-out" — slow start + slow end (canonical)
     *   • "spring"      — gentle overshoot
     */
    morphEasing: z.enum(["linear", "ease-in-out", "spring"]).optional(),

    /** Background variant. Default "light". */
    backgroundVariant: z.enum(["light", "dark"]).optional(),
    /** Direction block. */
    _direction: DirectionBlockSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.from.template !== val.to.template) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `MorphTransition requires from.template === to.template. Got from="${val.from.template}", to="${val.to.template}". Use ComparisonPair if you want two different templates side-by-side.`,
        path: ["to", "template"],
      });
    }
  });

export const MorphTransitionSchema = z.object({
  data: MorphTransitionDataSchema,
});
