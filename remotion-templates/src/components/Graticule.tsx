/**
 * Graticule — parallels-and-meridians overlay for MapGL-based templates.
 *
 * Returns deck.gl `GeoJsonLayer`s that the parent template adds to its
 * `MapGL.layers` array. We expose a factory function rather than a React
 * component because `MapGL` already composes deck.gl layers via
 * `MapboxOverlay` — wrapping the graticule in JSX would force a second
 * layer-composition path. The factory pattern keeps the deck.gl pipeline
 * single-rooted and lets the template control draw order (graticule
 * usually wants to render *under* highlighted countries / route arcs).
 *
 * Two layers are produced when `emphasize30` is true:
 *   - minor: every `spacing` degrees, at the configured opacity.
 *   - major: every 30 degrees, at 2× opacity (capped at 0.25) — the
 *     Equator, Tropics, Arctic Circle convention.
 *
 * Dossier: references/template-research/map-annotations.md § Graticule
 */

import { geoGraticule } from "d3-geo";
import { GeoJsonLayer } from "@deck.gl/layers";
import type { Feature, MultiLineString } from "geojson";
import { palette } from "../design/theme";
import type { GraticuleConfig } from "./Graticule.types";

// ── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_SPACING = 10;
const DEFAULT_OPACITY = 0.1;
const MAJOR_OPACITY_CAP = 0.25;
const MAJOR_STEP = 30;
const MINOR_LAYER_ID = "graticule-minor";
const MAJOR_LAYER_ID = "graticule-major";

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Convert a hex color (#RRGGBB) + alpha [0,1] to deck.gl's RGBA tuple
 * [r, g, b, a] where a is in [0, 255].
 */
const hexToRgbaTuple = (
  hex: string,
  alpha: number,
): [number, number, number, number] => {
  const m = hex.replace("#", "");
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  return [r, g, b, Math.round(Math.max(0, Math.min(1, alpha)) * 255)];
};

/**
 * Build a graticule MultiLineString feature at a given step. Wrapped as
 * a Feature so deck.gl's GeoJsonLayer treats it as a single geometry.
 *
 * Exported for unit-test access (we verify line counts at known steps).
 */
export const buildGraticuleFeature = (
  step: number,
): Feature<MultiLineString> => {
  const geometry = geoGraticule().step([step, step])() as MultiLineString;
  return { type: "Feature", geometry, properties: {} };
};

/**
 * Resolve effective configuration with defaults applied. Exported for tests.
 */
export const resolveGraticuleConfig = (
  config: GraticuleConfig | undefined,
  dark: boolean,
): {
  spacing: number;
  opacity: number;
  emphasize30: boolean;
  color: string;
} | null => {
  if (!config) return null;
  return {
    spacing: config.spacing ?? DEFAULT_SPACING,
    opacity: config.opacity ?? DEFAULT_OPACITY,
    emphasize30: config.emphasize30 ?? true,
    color: config.color ?? (dark ? palette.bone : palette.ink),
  };
};

// ── Factory ───────────────────────────────────────────────────────────────

/**
 * Build the deck.gl layers for a graticule overlay. Returns [] when the
 * config is undefined (graticule not requested). Call from the parent
 * template's `layers` array construction:
 *
 *   const layers = [
 *     ...buildGraticuleLayers(data.graticule, { dark: data.backgroundVariant === "dark" }),
 *     arcLayer,
 *     scatterLayer,
 *   ];
 *
 * Order matters: graticule lines should render UNDER content but OVER the
 * base tiles. Place them first in the layers array.
 */
export const buildGraticuleLayers = (
  config: GraticuleConfig | undefined,
  options: { dark?: boolean } = {},
): GeoJsonLayer[] => {
  const resolved = resolveGraticuleConfig(config, options.dark ?? false);
  if (!resolved) return [];

  const { spacing, opacity, emphasize30, color } = resolved;
  const layers: GeoJsonLayer[] = [];

  // Minor lines at `spacing` degrees.
  const minorFeature = buildGraticuleFeature(spacing);
  const minorColor = hexToRgbaTuple(color, opacity);
  layers.push(
    new GeoJsonLayer({
      id: MINOR_LAYER_ID,
      data: minorFeature,
      stroked: true,
      filled: false,
      getLineColor: minorColor,
      getLineWidth: 0.5,
      lineWidthUnits: "pixels" as const,
      pickable: false,
    }),
  );

  // Major lines at 30° — drawn on top so they win over minor where they overlap.
  if (emphasize30 && spacing !== MAJOR_STEP) {
    const majorFeature = buildGraticuleFeature(MAJOR_STEP);
    const majorOpacity = Math.min(MAJOR_OPACITY_CAP, opacity * 2);
    const majorColor = hexToRgbaTuple(color, majorOpacity);
    layers.push(
      new GeoJsonLayer({
        id: MAJOR_LAYER_ID,
        data: majorFeature,
        stroked: true,
        filled: false,
        getLineColor: majorColor,
        getLineWidth: 0.75,
        lineWidthUnits: "pixels" as const,
        pickable: false,
      }),
    );
  }

  return layers;
};
