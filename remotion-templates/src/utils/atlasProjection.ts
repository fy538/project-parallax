/**
 * atlasProjection — pure helpers for the AtlasPlate template.
 *
 * AtlasPlate renders Natural Earth TopoJSON as SVG paths via d3-geo. This
 * module owns:
 *   1. Projection name → d3-geo projection function resolver.
 *   2. Fit-to-bounds math (find scale + translate to fit a feature into
 *      a viewport with padding).
 *   3. Country-feature lookup (alpha-3 → TopoJSON feature).
 *   4. Color animation between phases (matches ChoroplethMap's pattern).
 *
 * Why all the math is in here vs. inline in the component: render-loop
 * predictability + testability. The component re-renders 30 times per
 * second; pure functions keep allocations down and make the hot path
 * easy to profile.
 *
 * Reference: components/Graticule.tsx (sibling overlay), references/template-research/atlas-plate.md
 */

import {
  geoEqualEarth,
  geoNaturalEarth1,
  geoMercator,
  geoOrthographic,
  geoAlbersUsa,
  geoEquirectangular,
  geoPath,
  geoCentroid,
} from "d3-geo";
import type { GeoProjection, GeoPath, GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import countriesTopo from "world-atlas/countries-110m.json";
import { numericIdToAlpha3 } from "./isoNumericToAlpha3";

// ── Types ─────────────────────────────────────────────────────────────────

export type ProjectionName =
  | "equalEarth"
  | "naturalEarth"
  | "mercator"
  | "orthographic"
  | "albersUsa"
  | "equirectangular";

export interface CountryFeature {
  /** ISO 3166-1 alpha-3 code, or null when the numeric code is unknown. */
  alpha3: string | null;
  /** Country common name from Natural Earth (English). */
  name: string;
  /** GeoJSON feature ready for projection / path generation. */
  feature: Feature<Geometry>;
}

// ── Projection resolution ─────────────────────────────────────────────────

/**
 * Resolve a projection name into a fresh d3-geo projection instance.
 *
 * Default is `equalEarth` — the area-preserving Bartholomew successor,
 * the editorially-honest default for world-scale quantitative maps. See:
 *   - references/template-research/choropleth-map.md § "Projection matters"
 *   - Šavrič et al. (2018), Cartography & GIS — Equal Earth specification
 *
 * Don't reuse a projection across calls — d3-geo projections are stateful
 * (scale/translate/rotate mutate the same instance). Always create fresh.
 */
export const resolveProjection = (name: ProjectionName | undefined): GeoProjection => {
  switch (name) {
    case "mercator":
      return geoMercator();
    case "naturalEarth":
      return geoNaturalEarth1();
    case "orthographic":
      return geoOrthographic();
    case "albersUsa":
      return geoAlbersUsa();
    case "equirectangular":
      return geoEquirectangular();
    case "equalEarth":
    default:
      return geoEqualEarth();
  }
};

// ── TopoJSON → FeatureCollection ──────────────────────────────────────────

/**
 * Convert world-atlas's countries TopoJSON into a GeoJSON FeatureCollection
 * with alpha-3 codes attached. Memoized at module load — the conversion
 * is ~5-10ms and the result is constant.
 */
const buildCountryCollection = (): CountryFeature[] => {
  const topo = countriesTopo as unknown as Topology;
  const fc = feature(
    topo,
    topo.objects.countries as GeometryCollection,
  ) as unknown as FeatureCollection<Geometry>;
  return fc.features.map((f) => {
    const id = f.id !== undefined && f.id !== null ? String(f.id) : "";
    const props = (f.properties ?? {}) as { name?: string };
    return {
      alpha3: numericIdToAlpha3(id),
      name: props.name ?? "",
      feature: f,
    };
  });
};

// ── Lazy initialization ───────────────────────────────────────────────────
//
// The TopoJSON → GeoJSON conversion costs ~5-10ms + parses a ~105kb JSON.
// Eagerly running it at module-import time means every bundle that touches
// any map template pays the cost on import, even if AtlasPlate /
// ProportionalSymbolMap are never used. Lazy-build defers the work to
// first actual access — typically inside a useMemo at render time.

let _countryFeatures: CountryFeature[] | null = null;
let _countryByAlpha3: Readonly<Record<string, CountryFeature>> | null = null;
let _countryCentroids: Readonly<Record<string, [number, number]>> | null = null;

const ensureCountriesLoaded = (): void => {
  if (_countryFeatures !== null) return;
  const features = buildCountryCollection();
  const byAlpha3: Record<string, CountryFeature> = {};
  const centroids: Record<string, [number, number]> = {};
  for (const c of features) {
    if (c.alpha3) {
      byAlpha3[c.alpha3] = c;
      // geoCentroid walks the polygon — non-trivial. Cache once per country.
      centroids[c.alpha3] = geoCentroid(c.feature) as [number, number];
    }
  }
  _countryFeatures = features;
  _countryByAlpha3 = byAlpha3;
  _countryCentroids = centroids;
};

/** All ~177 country features as an array. Triggers lazy-load on first call. */
export const getAllCountries = (): CountryFeature[] => {
  ensureCountriesLoaded();
  return _countryFeatures!;
};

/** alpha-3 → CountryFeature lookup. Returns null when unknown. */
export const getCountryByAlpha3 = (alpha3: string): CountryFeature | null => {
  ensureCountriesLoaded();
  return _countryByAlpha3![alpha3] ?? null;
};

/**
 * alpha-3 → geographic centroid (center of mass) lookup. Memoized: the
 * underlying d3-geo `geoCentroid()` walks every polygon ring, which is
 * non-trivial work to repeat per frame. Returns `null` for unknown codes
 * OR when the country exists but has no centroid (small island states
 * occasionally fail d3-geo's centroid algorithm).
 */
export const getCountryCentroid = (alpha3: string): [number, number] | null => {
  ensureCountriesLoaded();
  const c = _countryCentroids![alpha3];
  if (!c) return null;
  // Guard against NaN — d3-geo returns NaN for malformed polygons.
  if (Number.isNaN(c[0]) || Number.isNaN(c[1])) return null;
  return c;
};

// ── Fit-to-bounds ─────────────────────────────────────────────────────────

export interface Viewport {
  width: number;
  height: number;
}

/**
 * Configure a projection to fit a set of GeoJSON features inside a viewport
 * with a configurable padding (in pixels). Mutates the projection in place
 * and returns it for chaining.
 *
 * Wraps d3-geo's `projection.fitExtent()`. Centralized here so the padding
 * convention is consistent across phases (animate against the same fit
 * extents on either side of a transition).
 */
export const fitProjectionToFeatures = (
  projection: GeoProjection,
  features: GeoPermissibleObjects,
  viewport: Viewport,
  padding: number = 40,
): GeoProjection => {
  const extent: [[number, number], [number, number]] = [
    [padding, padding],
    [viewport.width - padding, viewport.height - padding],
  ];
  projection.fitExtent(extent, features);
  return projection;
};

/**
 * Fit a projection to the WORLD (the full graticule extent). Useful for
 * the default "no focus" pose at the start of a composition.
 */
export const fitProjectionToWorld = (
  projection: GeoProjection,
  viewport: Viewport,
  padding: number = 40,
): GeoProjection => {
  const worldFeature: Feature<Geometry> = {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [[
      [-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85],
    ]] },
    properties: {},
  };
  return fitProjectionToFeatures(projection, worldFeature, viewport, padding);
};

/**
 * Build the (scale, translate) tuple a projection would adopt to fit the
 * given features. Useful when you want to interpolate camera between two
 * phase poses without actually mutating the projection (we instead drive
 * an outer SVG group transform — see AtlasPlate.tsx).
 */
export const computeCameraPose = (
  projectionName: ProjectionName | undefined,
  features: GeoPermissibleObjects,
  viewport: Viewport,
  padding: number = 40,
): { scale: number; translate: [number, number] } => {
  const p = resolveProjection(projectionName);
  fitProjectionToFeatures(p, features, viewport, padding);
  return {
    scale: p.scale(),
    translate: p.translate() as [number, number],
  };
};

// ── Path generator factory ────────────────────────────────────────────────

/**
 * Build a configured `geoPath` generator for the given projection. The
 * generator converts a GeoJSON feature into an SVG path `d` string.
 * Stateless once built; safe to memoize.
 */
export const makePathGenerator = (projection: GeoProjection): GeoPath =>
  geoPath(projection);

// ── Country fill resolution ───────────────────────────────────────────────

/**
 * Per-country fill resolved at a frame within a phase window.
 *
 * Phase semantics match ChoroplethMap:
 *   - explicit `fill` (hex) wins
 *   - `noData: true` → caller passes a distinct "no data" fill
 *   - otherwise the country uses the inactive `landFill` (base land color)
 *
 * For v1 there's no cross-phase color tweening — fills update at phase
 * boundaries with a short opacity fade. Matches the editorial register
 * of static atlas plates: countries don't morph colors mid-frame.
 */
export interface PhaseFillRule {
  alpha3: string;
  fill?: string;
  noData?: boolean;
}

export interface ResolveFillOptions {
  /** Base land color when no phase rule applies. */
  landFill: string;
  /** "No data" color used when a country is marked noData. */
  noDataFill: string;
}

/**
 * Build an alpha-3 → fill-color lookup for the given phase rules.
 * Returns a plain object so callers can read it with O(1) cost per frame.
 */
export const buildPhaseFillMap = (
  rules: readonly PhaseFillRule[],
  options: ResolveFillOptions,
): Readonly<Record<string, string>> => {
  const map: Record<string, string> = {};
  for (const r of rules) {
    if (r.noData) {
      map[r.alpha3] = options.noDataFill;
    } else if (r.fill) {
      map[r.alpha3] = r.fill;
    }
  }
  return map;
};
