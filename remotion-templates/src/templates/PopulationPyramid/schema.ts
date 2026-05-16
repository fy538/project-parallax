/**
 * Zod schemas for PopulationPyramid template — runtime validation + Remotion Studio editing.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

const PyramidCohortSchema = z.object({
  ageGroup: z.string().describe("Age group label, e.g. '0–4', '15–19', '75+'"),
  male: z.number().min(0).describe("Male population (positive number in your chosen unit)"),
  female: z.number().min(0).describe("Female population (positive number in your chosen unit)"),
});

const PyrSideSchema = z.object({
  label: z.string(),
  cohorts: z.array(PyramidCohortSchema),
  color: z.string().optional(),
});

export const PopulationPyramidSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string().describe(
      "State the demographic argument, not the topic. Write: 'China's Working-Age Bulge Will Peak This Decade' not 'China demographics'."
    ),
    subtitle: z.string().optional(),
    source: z.string().optional(),
    durationSec: z.number().positive().optional(),
    holdAfterRevealSec: z.number().min(0).max(10).optional().describe(
      "Deliberate pause (seconds) after all bars finish animating in, before morph or exit. Default: 1."
    ),
    variant: z
      .enum(["single", "morph", "comparison"])
      .describe(
        "single: one pyramid. morph: animate from year A to year B. comparison: two countries side-by-side."
      ),
    cohorts: z
      .array(PyramidCohortSchema)
      .describe(
        "Age cohorts from youngest to oldest. Male and female values as positive numbers in your chosen unit."
      ),
    cohortsB: z
      .array(PyramidCohortSchema)
      .optional()
      .describe("Secondary cohorts for morph variant (year B). Required when variant='morph'."),
    labelA: z.string().optional().describe("Label for the initial cohorts set, e.g. '1990'"),
    labelB: z.string().optional().describe("Label for cohortsB, e.g. '2025'"),
    left: PyrSideSchema.optional().describe("Left pyramid for comparison variant"),
    right: PyrSideSchema.optional().describe("Right pyramid for comparison variant"),
    unit: z
      .string()
      .optional()
      .describe("Unit label for bar values, e.g. 'millions', 'thousands', '%'"),
    highlightAgeGroups: z
      .array(z.string())
      .optional()
      .describe(
        "Age groups to accent — e.g. ['20–24','25–29'] to highlight a youth bulge or ['65–69','70–74','75+'] for aging dependency."
      ),
    maxValue: z
      .number()
      .positive()
      .optional()
      .describe("Override auto-computed max value for bar scaling. Useful when comparing two pyramids."),
    backgroundVariant: z
      .enum(["light", "dark"])
      .optional()
      .describe("Background mode. 'light' (default) for analytical mode; 'dark' for dramatic/atmospheric segments."),
    medianAge: z
      .number()
      .min(0)
      .max(120)
      .optional()
      .describe(
        "When set, draws a horizontal dashed indicator line at this age band position across the full pyramid width. Label reads 'Median age: N'."
      ),
    maleColor: z
      .string()
      .optional()
      .describe("Override color for male bars. Default: semantic.us (muted blue). Use for comparison or custom palettes."),
    femaleColor: z
      .string()
      .optional()
      .describe("Override color for female bars. Default: semantic.china (muted rust). Use for comparison or custom palettes."),
    _direction: DirectionBlockSchema.optional(),
  }),
});
