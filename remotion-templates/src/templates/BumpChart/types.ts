/**
 * Data types for the BumpChart template.
 *
 * Shows N entities tracing their rank position over M time periods.
 * The "power transition" chart where rank crossings are the editorial argument.
 * Ranks are COMPUTED from entity values — not authored directly.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface BumpChartEntity {
  id: string;
  label: string;
  color?: string;
  /** Pre-supplied values per period; ranks are COMPUTED from these (not authored) */
  values: Array<{ period: string | number; value: number }>;
}

export interface BumpChartData {
  episode: string;
  title: string;
  subtitle?: string;
  source?: string;
  durationSec?: number;
  holdAfterRevealSec?: number;
  /** The ordered time-period labels for the x-axis */
  periods: string[];
  entities: BumpChartEntity[];
  /**
   * "desc" = highest value is rank 1 (default — GDP, military spending, population)
   * "asc"  = lowest value is rank 1 (e.g., cost rankings)
   */
  rankDirection?: "asc" | "desc";
  /** Entity IDs to bold and always label */
  highlightIds?: string[];
  /** Context shown in annotation, e.g. "GDP in current USD" */
  unit?: string;
  /** Background theme variant — "light" (default) or "dark". */
  backgroundVariant?: "light" | "dark";
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}
