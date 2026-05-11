/**
 * Data types for the ChoroplethMap template.
 *
 * To use this template, create a JSON file matching ChoroplethMapData
 * and pass it as inputProps to the composition.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

/** A single country's data for one phase of the animation. */
export interface CountryData {
  /** Country name — must match the name in the TopoJSON file. */
  name: string;
  /** ISO 3166-1 alpha-3 code (e.g., "USA", "CHN", "TWN"). */
  iso3?: string;
  /** Numeric value for color scaling (GDP, trade volume, etc.). */
  value?: number;
  /** Override fill color — use instead of value-based scaling. */
  fill?: string;
  /** Label to display on or near the country. */
  label?: string;
}

/** A phase in the animation — countries change color/state at each phase. */
export interface AnimationPhase {
  /** Phase title displayed on screen (e.g., "2022: Export Controls"). */
  title: string;
  /** Optional subtitle or context. */
  subtitle?: string;
  /** Duration of this phase in seconds. */
  durationSec: number;
  /** Countries to highlight in this phase. Unmentioned countries use default fill. */
  countries: CountryData[];
  /** Optional map center override [longitude, latitude]. */
  center?: [number, number];
  /** Optional zoom/scale override. */
  scale?: number;
}

/** Full data input for the ChoroplethMap composition. */
export interface ChoroplethMapData {
  /** Episode identifier (e.g., "silicon-trap"). */
  episode: string;
  /** Segment title. */
  title: string;
  /**
   * Map projection to use.
   *
   * - `globe` — 3D sphere, best for global narratives at zoom <3.
   * - `mercator` — flat web-mercator, default for regional views (zoom ≥3).
   *    DO NOT use for world-scale quantitative comparison — area distortion
   *    near the poles inflates Greenland / Russia and reads as editorial bias.
   * - `equalEarth` (recommended default for world-scale choropleth) —
   *    area-preserving, the only world projection that's editorially honest
   *    for quantitative comparison.
   * - `naturalEarth` — compromise projection, NYT/National Geographic default.
   * - `albers` — best for North America–centric views.
   *
   * Defaults: `globe` for zoom <3, `mercator` for zoom ≥3 (preserves legacy
   * behavior). When set, overrides the auto-choice.
   *
   * Reference: references/template-research/choropleth-map.md § 6.1
   */
  projection?: "globe" | "mercator" | "equalEarth" | "naturalEarth" | "albers";
  /** Default map center [longitude, latitude]. */
  center?: [number, number];
  /** Default scale. */
  scale?: number;
  /** Color ramp name from theme, or custom array of hex colors. */
  colorRamp?: "blue" | "red" | "teal" | "gray" | string[];
  /**
   * Optional legend strip configuration. When set, renders a horizontal
   * color-ramp legend above the FooterStrip at the bottom of the map.
   * Mandatory for choropleths that show *quantitative* data — without a
   * legend, the color encoding is illegible.
   *
   * - `breaks` — numeric breakpoints between bins (length = bins - 1).
   *    Pair with `quantileBreaks()` from `src/utils/quantileBins.ts`.
   *    When omitted, renders a continuous-gradient legend.
   * - `unit` — suffix appended to break values ("%", " GDP", "/cap").
   * - `label` — caption shown left of the swatches (e.g., "GDP per capita").
   *
   * See: references/template-research/choropleth-map.md § 6.4
   */
  legend?: {
    /** Internal break values between bins (length = numBins - 1). */
    breaks?: number[];
    /** Unit suffix for break-value labels. */
    unit?: string;
    /** Caption to the left of the swatches. */
    label?: string;
  };
  /** The phases of the animation, played sequentially. */
  phases: AnimationPhase[];
  /** Subtle color tint for emotional temperature (Layer 3). Hex color, e.g. "#3266AD" for US-blue, "#C23B22" for China-red. */
  backgroundTint?: string;
  /** Map style mode — selects Mapbox style (Meridian Light or Meridian Dark). Default "light". */
  backgroundVariant?: "light" | "dark";

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}
