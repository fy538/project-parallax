/**
 * MorphTransition template types.
 *
 * Animated state-change between two data states of the SAME embedded
 * template — same chart type, two different data sets, animated morph.
 * The NYT/Bloomberg "watch the rankings shift" / "election-night updates"
 * motion primitive.
 */

import type { z } from "zod";
import type {
  MorphStateSchema,
  MorphTransitionDataSchema,
} from "./schema";

export type MorphState = z.infer<typeof MorphStateSchema>;
export type MorphTransitionData = z.infer<typeof MorphTransitionDataSchema>;
export type MorphableTemplateName = MorphState["template"];
