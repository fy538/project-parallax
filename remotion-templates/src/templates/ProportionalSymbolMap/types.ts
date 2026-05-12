/**
 * Data types for the ProportionalSymbolMap template.
 *
 * Country-anchored circles sized by a numeric value. The right form for
 * COUNT data (fabs, bases, cases, GDP) where area-based fills would
 * mislead. For RATE/DENSITY data (per-capita, share, %), use ChoroplethMap
 * with an area-honest projection instead.
 *
 * Dossier: references/template-research/proportional-symbol-map.md
 */

import type { DirectionBlock } from "../../hooks/useDirection";
import type { MapAnnotation } from "../../components/MapAnnotations.types";
import type { GraticuleConfig } from "../../components/Graticule.types";
import type { ProjectionName } from "../../utils/atlasProjection";
import type { ScaleType } from "../../utils/proportionalSymbol";

/** A single symbol — one circle on the map, anchored at a country's centroid. */
export interface SymbolDatum {
  /** ISO 3166-1 alpha-3 code (e.g., "USA", "CHN"). */
  iso3: string;
  /** Numeric value the symbol's area encodes. */
  value: number;
  /** Optional inline label rendered next to the circle. */
  label?: string;
  /** Per-symbol color override (hex). Default uses `symbolColor`. */
  color?: string;
}

/** One phase of the proportional-symbol animation. */
export interface ProportionalPhase {
  /** Phase title rendered as overlay. */
  title: string;
  /** Optional subtitle. */
  subtitle?: string;
  /** How long this phase is visible, in seconds. */
  durationSec: number;
  /** Symbols to render in this phase. Sorted internally largest-first. */
  symbols: SymbolDatum[];
  /**
   * Camera focus. Same semantics as AtlasPlate:
   *   - `iso3`: list of country codes to fit camera around.
   *   - `center` + `scaleHint`: explicit center + zoom multiplier.
   */
  focus?: {
    iso3?: string[];
    center?: [number, number];
    scaleHint?: number;
  };

  /** Cinematic camera transition. See AtlasPlate types for details. */
  cameraTransition?: "linear" | "cinematic" | "via-globe";
  cameraDwell?: { before?: number; after?: number };
}

export interface ProportionalSymbolMapData {
  /** Episode identifier. */
  episode: string;
  /** Composition title. */
  title: string;
  /** Optional subtitle. */
  subtitle?: string;
  /** Map projection. Default `equalEarth`. See atlasProjection.ts. */
  projection?: ProjectionName;
  /** Phases — played sequentially. */
  phases: ProportionalPhase[];
  /** Total duration override; defaults to sum of phase durations. */
  durationSec?: number;
  /** Source attribution rendered in FooterStrip. */
  source?: string;
  /** Padding (px) when fitting features for focused phases. Default 80. */
  framePadding?: number;

  /**
   * Unit suffix for legend values (e.g., "fabs", "GW", "barrels/day").
   * Optional — omit when the title already names the unit.
   */
  unit?: string;
  /** Caption above the legend ("Production capacity", "Active sites"). */
  valueLabel?: string;
  /**
   * Maximum circle radius in pixels. Default 50. Larger values dominate
   * the frame; smaller values render dense regions illegibly. Aim for
   * ~5-8% of frame diagonal at the intended scale.
   */
  maxRadiusPx?: number;
  /**
   * Scale type. **Default `sqrt` (area-proportional)** — the editorially
   * honest choice. `linear` is offered for parity but produces a visual
   * lie (encodes value²). Audit lint should flag any `"linear"` usage.
   */
  scaleType?: ScaleType;
  /** Default symbol fill color. Per-symbol `color` overrides this. */
  symbolColor?: string;

  /**
   * Editorial annotations rendered as SVG text in projection space.
   * Same MapAnnotation schema as Mapbox templates and AtlasPlate.
   */
  annotations?: MapAnnotation[];
  /** Parallels-and-meridians overlay. */
  graticule?: GraticuleConfig;
  /** Light/dark mode. Default "light". */
  backgroundVariant?: "light" | "dark";
  /** Subtle color tint for emotional temperature. */
  backgroundTint?: string;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}
