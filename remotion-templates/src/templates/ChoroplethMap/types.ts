/**
 * Data types for the ChoroplethMap template.
 *
 * To use this template, create a JSON file matching ChoroplethMapData
 * and pass it as inputProps to the composition.
 */

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
  /** Episode identifier (e.g., "EP01"). */
  episode: string;
  /** Segment title. */
  title: string;
  /** Map projection to use. */
  projection?: "geoMercator" | "geoNaturalEarth1" | "geoEqualEarth";
  /** Default map center [longitude, latitude]. */
  center?: [number, number];
  /** Default scale. */
  scale?: number;
  /** Color ramp name from theme, or custom array of hex colors. */
  colorRamp?: "blue" | "red" | "teal" | "gray" | string[];
  /** The phases of the animation, played sequentially. */
  phases: AnimationPhase[];
}
