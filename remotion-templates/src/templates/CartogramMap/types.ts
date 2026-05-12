/**
 * Data types for the CartogramMap (Dorling) template.
 *
 * A Dorling cartogram is the right form when the editorial point is
 * "structural weight ≠ geographic size" — small countries with massive
 * data values (Switzerland, Israel, Singapore, Taiwan) deserve visual
 * weight matching their data, not their land area.
 *
 * Differs from ProportionalSymbolMap by:
 *   - Circles are de-collided (force simulation) → no overlap.
 *   - Land paths optionally suppressed → cleaner, more abstract register.
 *   - Built for 15+ data points in dense regions (Europe, SE Asia).
 *
 * Dossier: references/template-research/cartogram-map.md
 */

import type { DirectionBlock } from "../../hooks/useDirection";
import type { MapAnnotation } from "../../components/MapAnnotations.types";
import type { ProjectionName } from "../../utils/atlasProjection";
import type { ScaleType } from "../../utils/proportionalSymbol";

/** One country circle. Same shape as ProportionalSymbolMap's SymbolDatum. */
export interface CartogramDatum {
  iso3: string;
  value: number;
  /** Optional inline label next to the circle. */
  label?: string;
  /** Per-circle color override. */
  color?: string;
}

export interface CartogramPhase {
  title: string;
  subtitle?: string;
  durationSec: number;
  /** Country circles for this phase. */
  data: CartogramDatum[];
}

export interface CartogramMapData {
  episode: string;
  title: string;
  subtitle?: string;
  /** Projection used to compute initial centroid positions. Default `equalEarth`. */
  projection?: ProjectionName;
  phases: CartogramPhase[];
  durationSec?: number;
  source?: string;
  framePadding?: number;

  /** Unit label for the legend. */
  unit?: string;
  /** Legend caption. */
  valueLabel?: string;
  /** Max circle radius in pixels. Default 50. */
  maxRadiusPx?: number;
  /** Scale type — sqrt (area-proportional, default) or linear. */
  scaleType?: ScaleType;
  /** Default fill for circles (per-circle `color` overrides). */
  symbolColor?: string;

  /**
   * Show the world coastline as a faint reference layer beneath the
   * circles. Default `true` — gives spatial context without competing
   * with the data. Set false for a fully abstract "pure cartogram" look.
   */
  showCoastlines?: boolean;

  /**
   * Force-simulation strength pulling each circle toward its true
   * centroid. Higher = more geographic faithfulness, lower = more
   * aggressive decollision. Default 0.1 (Dorling-canonical).
   */
  xyStrength?: number;

  /** Editorial annotations — same MapAnnotation schema as AtlasPlate. */
  annotations?: MapAnnotation[];
  backgroundVariant?: "light" | "dark";
  backgroundTint?: string;

  /** Per-composition direction block. */
  _direction?: DirectionBlock;
}
