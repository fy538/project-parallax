/**
 * Data types for the PopulationPyramid template.
 *
 * Back-to-back horizontal bar charts by age cohort (left = male, right = female).
 * The canonical demographics visualization for geopolitics arguments about
 * youth bulges, demographic cliffs, and dependency ratios.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface PyramidCohort {
  /** Age group label, e.g. "0–4", "15–19", "75+" */
  ageGroup: string;
  /** Male population (positive number) */
  male: number;
  /** Female population (positive number) */
  female: number;
}

export interface PopulationPyramidData {
  episode: string;
  title: string;
  subtitle?: string;
  source?: string;
  durationSec?: number;
  holdAfterRevealSec?: number;
  /**
   * "single"     — one pyramid, static or with hold
   * "morph"      — pyramid A builds in, then morphs to pyramid B
   * "comparison" — two pyramids side-by-side with labels
   */
  variant: "single" | "morph" | "comparison";
  /** Primary pyramid cohorts (all variants) */
  cohorts: PyramidCohort[];
  /** Secondary cohorts for morph variant (year B) */
  cohortsB?: PyramidCohort[];
  /** For morph variant: label for cohorts (e.g. "1990") */
  labelA?: string;
  /** For morph variant: label for cohortsB (e.g. "2025") */
  labelB?: string;
  /** For comparison variant: left pyramid */
  left?: { label: string; cohorts: PyramidCohort[]; color?: string };
  /** For comparison variant: right pyramid */
  right?: { label: string; cohorts: PyramidCohort[]; color?: string };
  /** Unit for bar values, e.g. "millions", "thousands", "%" */
  unit?: string;
  /** Age groups to visually accent, e.g. ["20–24", "25–29"] for youth bulge */
  highlightAgeGroups?: string[];
  /** Override auto-computed max value for bar scaling */
  maxValue?: number;
  /** Background mode — "light" (default) or "dark" for dramatic/atmospheric segments. */
  backgroundVariant?: "light" | "dark";
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
  /** Median age indicator line drawn horizontally across the pyramid. */
  medianAge?: number;
  /** Override color for male bars (default: semantic.us blue). */
  maleColor?: string;
  /** Override color for female bars (default: semantic.china rust). */
  femaleColor?: string;
}
