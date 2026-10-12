/**
 * BarChartRace — schema-derived types only.
 *
 * All types are inferred from Zod schemas (no hand-declared interfaces).
 * This is the canonical pattern established in StatReveal.
 */

import { z } from "zod";
import {
  BarRaceValueSchema,
  BarRacePeriodSchema,
  BarChartRaceDataSchema,
  BarChartRaceSchema,
} from "./schema";

export type BarRaceValue = z.infer<typeof BarRaceValueSchema>;
export type BarRacePeriod = z.infer<typeof BarRacePeriodSchema>;
export type BarChartRaceData = z.infer<typeof BarChartRaceDataSchema>;
export type BarChartRaceProps = z.infer<typeof BarChartRaceSchema>;
