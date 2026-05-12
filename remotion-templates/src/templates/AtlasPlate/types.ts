/**
 * Data types for the AtlasPlate template.
 *
 * Pure-SVG editorial cartography rendered from Natural Earth TopoJSON via
 * d3-geo. The Tufte/Fortune/Bartholomew register — flat, high-contrast,
 * no tiles. Use when atmospheric Mapbox renders would distract from an
 * analytical point.
 *
 * Dossier: references/template-research/atlas-plate.md
 */

import type { DirectionBlock } from "../../hooks/useDirection";
import type { MapAnnotation } from "../../components/MapAnnotations.types";
import type { GraticuleConfig } from "../../components/Graticule.types";
import type { ProjectionName } from "../../utils/atlasProjection";

/** A country's fill assignment within a phase. */
export interface AtlasCountryFill {
  /** ISO 3166-1 alpha-3 code (e.g., "USA", "CHN", "TWN"). */
  iso3: string;
  /** Override fill color (hex). Wins over palette/value-based mapping. */
  fill?: string;
  /** Optional label rendered at the country's centroid for this phase. */
  label?: string;
  /**
   * Flag as having no data (rather than zero). Renders with the distinct
   * "no data" neutral, separate from the base land color. Same semantics
   * as ChoroplethMap → choropleth-map.md § 6.5.
   */
  noData?: boolean;
}

/** A single phase of the atlas animation. */
export interface AtlasPhase {
  /** Phase title rendered as overlay. */
  title: string;
  /** Optional subtitle. */
  subtitle?: string;
  /** How long this phase is visible, in seconds. */
  durationSec: number;
  /** Countries to highlight in this phase. */
  countries: AtlasCountryFill[];
  /**
   * Camera focus. Set EITHER:
   *   - `iso3`: list of country codes to fit the camera around (computes
   *     bounds + applies fit-extent with padding).
   *   - `center` + `scaleHint`: explicit center [lon, lat] + multiplicative
   *     scale relative to the world-fit scale (1.0 = world, 2.0 = 2× zoom).
   *
   * When unset, the camera holds the previous phase's pose (or the
   * world fit if this is phase 0).
   */
  focus?: {
    iso3?: string[];
    center?: [number, number];
    scaleHint?: number;
  };
}

/** Full data input for an AtlasPlate composition. */
export interface AtlasPlateData {
  /** Episode identifier (e.g., "prisoners-dilemma"). */
  episode: string;
  /** Composition title. */
  title: string;
  /** Optional subtitle. */
  subtitle?: string;
  /**
   * Map projection. Default `equalEarth` — area-honest world map.
   *
   * - `equalEarth` (default) — Šavrič 2018, the modern Bartholomew successor.
   * - `naturalEarth` — compromise projection, NYT/National Geographic register.
   * - `mercator` — conformal, navigational; DO NOT use for area comparison.
   * - `orthographic` — globe view, good for "looking at the planet" moments.
   * - `albersUsa` — North America-centric (includes inset Alaska + Hawaii).
   * - `equirectangular` — simplest flat projection, lat/lon grid is square.
   */
  projection?: ProjectionName;
  /** The phases of the animation, played sequentially. */
  phases: AtlasPhase[];
  /** Total composition duration override — defaults to sum of phase durations. */
  durationSec?: number;
  /** Source attribution rendered in the bottom-right via FooterStrip. */
  source?: string;
  /**
   * Padding (in pixels) around fitted features when the camera focuses on
   * countries. Larger = more breathing room around the focus. Default 80.
   */
  framePadding?: number;
  /**
   * Editorial annotations rendered as SVG text in projection space. Uses
   * the same `MapAnnotation` schema as Mapbox templates; AtlasPlate
   * projects lon/lat → SVG coords using the active projection.
   *
   * See: components/MapAnnotations.types.ts
   */
  annotations?: MapAnnotation[];
  /**
   * Parallels-and-meridians overlay rendered as SVG paths. Same `spacing`
   * / `opacity` / `emphasize30` semantics as the Mapbox graticule. See:
   * components/Graticule.types.ts.
   */
  graticule?: GraticuleConfig;
  /** Map mode — light (default) or dark. */
  backgroundVariant?: "light" | "dark";
  /** Subtle color tint for emotional temperature. Hex. */
  backgroundTint?: string;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}
