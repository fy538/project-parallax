/**
 * Data types for the DensityMap template.
 *
 * Point-density visualization on a Mapbox basemap via deck.gl's
 * aggregation layers (HexagonLayer, HeatmapLayer, GridLayer). Right form
 * when the editorial point is *where things concentrate* — chip fabs,
 * military bases, refugee origins, conflict events, scientific stations.
 *
 * Differs from ProportionalSymbolMap by:
 *   - Points are individual events / facilities, not country aggregates.
 *   - Aggregation is automatic (GPU bins or kernel density), not manual.
 *   - Designed for 100s-1000s of points; PSM is for ~10.
 *
 * Dossier: references/template-research/density-map.md
 */

import type { DirectionBlock } from "../../hooks/useDirection";
import type { MapAnnotation } from "../../components/MapAnnotations.types";
import type { MapTitleConfig } from "../../components/MapTitleFrame";

/** A single point. Optional `weight` aggregates the value (sum of weights). */
export interface DensityPoint {
  /** [longitude, latitude]. */
  at: [number, number];
  /**
   * Aggregated value at this point. Default `1` → counts.
   *
   * In the default UNIVARIATE mode, `weight` drives BOTH the bin's size
   * (visual area) AND its color-ramp position.
   *
   * When `colorWeight` is also provided, this becomes the BIVARIATE size
   * accessor only — color ramp uses `colorWeight` independently.
   */
  weight?: number;
  /**
   * Optional second dimension for bivariate hex/grid encoding. When
   * provided, the bin's COLOR is driven by aggregating these values
   * (via `data.colorAggregation`, default sum) while size still comes
   * from `weight`.
   *
   * Use case: "hex SIZE = number of fabs in this region, hex COLOR =
   * average year of establishment" (older = paler, newer = brighter).
   *
   * Ignored for `mode: "heatmap"` — heatmap is univariate-by-design.
   */
  colorWeight?: number;
  /** Optional tag for filtering / dev introspection (not rendered). */
  tag?: string;
}

/** Aggregation mode. */
export type DensityMode = "hex" | "heatmap" | "grid";

export interface DensityPhase {
  title: string;
  subtitle?: string;
  durationSec: number;
  /** Points active in this phase. Different phases can show different point sets. */
  points: DensityPoint[];
  /** Camera focus for this phase (optional). */
  camera?: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
  };
}

export interface DensityMapData {
  episode: string;
  title: string;
  subtitle?: string;
  /** Phases — typically 1 for a single shot. */
  phases: DensityPhase[];
  durationSec?: number;
  /** Source attribution rendered in FooterStrip. */
  source?: string;

  /**
   * Aggregation mode. Default `"hex"`.
   *
   * - `"hex"`: hexagonal bins, sized by aggregate value. Best for COUNT
   *   stories (number of fabs, number of bases) where countable bins are
   *   the editorial unit.
   * - `"heatmap"`: kernel-density-estimation gradient. Best for INTENSITY
   *   stories (where conflict concentrates, where billionaires cluster)
   *   where a continuous gradient reads as "hotspots."
   * - `"grid"`: square-grid version of hex. Less common editorially —
   *   reads as "data tile" rather than "natural cluster." Reserved.
   */
  mode?: DensityMode;

  /**
   * Cell size in METERS (hex/grid) or radius in PIXELS (heatmap).
   * Default 100,000m (100km) for hex, 30px for heatmap. Higher = more
   * aggregation (chunkier bins / smoother heatmap); lower = more detail.
   */
  cellSize?: number;

  /**
   * Coverage [0..1] — what fraction of the cell each hex/grid bin fills.
   * Default 0.9 (small gaps between bins for legibility). 1.0 = no gap.
   */
  coverage?: number;

  /**
   * Color ramp for aggregated values. Defaults to brand rust ramp:
   * paper → bone → gold → rust (sequential warm). Pass an array of hex
   * colors to override.
   */
  colorRamp?: string[];

  /**
   * Aggregation function for `colorWeight` (when bivariate is in use).
   * - `"sum"` (default): sum of colorWeights in each bin. Use when colorWeight
   *   is a count or magnitude that should accumulate.
   * - `"mean"`: average. Use when colorWeight is a per-item attribute
   *   (year, ratio, score) and you want the bin's central tendency.
   * - `"max"`: max colorWeight in the bin. Use to flag bins containing
   *   ANY high-value item.
   *
   * Ignored when no `colorWeight` is set (univariate mode uses sum).
   */
  colorAggregation?: "sum" | "mean" | "max";

  /**
   * Opacity for the aggregation layer. Default 0.75 — readable but lets
   * basemap context show through.
   */
  opacity?: number;

  /** Initial camera if no phase has its own. */
  camera?: {
    longitude: number;
    latitude: number;
    zoom: number;
    pitch?: number;
    bearing?: number;
  };

  /** Map mode — light (default) or dark. */
  backgroundVariant?: "light" | "dark";
  /** Subtle color tint. */
  backgroundTint?: string;

  /**
   * Label-density register. DensityMap defaults to `"editorial"` —
   * country labels at globe scale for orientation, auto-suppress at
   * regional zoom (>= 4) where the heatmap dominates. Per-shot override
   * to `"minimal"` when explicit MapAnnotations name everything that
   * matters. See MapGL `labelDensity`.
   */
  labelDensity?: "atlas" | "editorial" | "minimal" | "off";

  /** Mapbox Standard scene lighting preset. See MapGL.types.ts. */
  lightPreset?: "day" | "dawn" | "dusk" | "night";

  /** Editorial annotations. Same schema as other map templates. */
  annotations?: MapAnnotation[];

  /**
   * Locator inset — small overview globe in a corner showing where the
   * main map is zoomed. Same schema as RouteAnimation / ChoroplethMap.
   * Especially useful for DensityMap because tight regional zooms
   * (Asia-only, Europe-only) lose the "where on the planet" cue.
   *
   * Default: hidden. Pass `{ show: true }` to display.
   */
  inset?: {
    show?: boolean;
    position?: "tl" | "tr" | "bl" | "br";
    size?: number;
    framed?: boolean;
  };

  /**
   * OPTIONAL title overlay — opt-in for Mapbox-backed templates per the
   * atmospheric-register doctrine. See `MapTitleFrame`. Smart cartouche
   * placement is unsupported on Mapbox; "auto" falls back to "top-left"
   * with a dev warning.
   */
  mapTitle?: MapTitleConfig;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block. */
  _direction?: DirectionBlock;
}
