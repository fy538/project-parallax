/**
 * Zod schemas for BarChartRace template — runtime validation + Remotion
 * Studio editing.
 *
 * The kinetic ranking form popularised by John Burn-Murdoch's FT "great-power
 * GDP race" charts. All entity values are continuously interpolated between
 * time periods, bars re-rank at every frame, and bar positions (y) smoothly
 * follow rank changes. The period label is the clock that drives the argument.
 *
 * Schema-derived types (see StatReveal for canonical pattern).
 * Inner shapes exported so types.ts can `z.infer` from each.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const BarRaceValueSchema = z.object({
  id: z.string().describe("Stable entity identifier — used to match across periods."),
  label: z.string().describe("Display name shown on the bar (left side)."),
  value: z.number().describe("Numeric value for this entity in this period."),
  color: z.string().optional().describe("Bar fill color (hex). Defaults to defaultPalette cycle."),
  sublabel: z.string().optional().describe("Optional secondary annotation, e.g. flag emoji or country code."),
});

export const BarRacePeriodSchema = z.object({
  label: z.string().describe("Period label displayed as the race clock, e.g. '1990', 'Q3 2024', 'Day 15'."),
  values: z
    .array(BarRaceValueSchema)
    .min(1)
    .describe("Entity values for this period. Entities can appear/disappear between periods."),
});

export const BarChartRaceDataSchema = z.object({
  episode: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  _direction: DirectionBlockSchema.optional(),

  periods: z
    .array(BarRacePeriodSchema)
    .min(2)
    .max(50)
    .describe("Ordered time periods. At least 2 required for animation."),

  topN: z
    .number()
    .int()
    .min(3)
    .max(15)
    .optional()
    .describe("Maximum number of bars shown at any frame (default 10)."),

  durationPerPeriod: z
    .number()
    .positive()
    .optional()
    .describe("Seconds spent animating between each adjacent period pair (default 1.5s)."),

  barHeight: z
    .number()
    .positive()
    .optional()
    .describe("Pixel height of each bar (default 52)."),

  barGap: z
    .number()
    .positive()
    .optional()
    .describe("Pixel gap between adjacent bars (default 8)."),

  valueFormat: z
    .string()
    .optional()
    .describe("printf-style format string for value labels: '%.1fT', '$%.0fB', '%.0f'. Uses bare number when omitted."),

  periodEasing: z
    .enum(["linear", "ease-in-out"])
    .optional()
    .describe("Whether to ease-in-out within each period transition (default 'ease-in-out')."),

  showValueAxis: z
    .boolean()
    .optional()
    .describe("Render a thin value axis rule at the bottom of the bar plot (default true)."),

  periodLabelPosition: z
    .enum(["top-right", "bottom-right"])
    .optional()
    .describe("Corner for the large period-label clock (default 'bottom-right')."),

  defaultPalette: z
    .array(z.string())
    .optional()
    .describe("Color sequence for entities that don't specify their own color. Cycles for >N entities."),
});

export const BarChartRaceSchema = z.object({ data: BarChartRaceDataSchema });
