/**
 * AtlasDetailInset — zoomed corner panel for AtlasPlate.
 *
 * The NatGeo / FT regional-supplement idiom INVERSE of `AtlasInsetLocator`:
 *   - AtlasInsetLocator: main = zoomed region, inset = world "you are here" box.
 *   - AtlasDetailInset: main = world/region context, inset = zoomed detail of
 *     specific countries at readable scale.
 *
 * Use both together when you want: main=world context, detail=zoomed subject,
 * AND the "you are here" locator. Example: main shows East Asia, inset shows
 * the Taiwan Strait in close-up, locator shows where East Asia is on the globe.
 *
 * The projection is fitted per `focusIso3` — the combined bbox of those countries
 * fills the inset with 16px padding, so at any scale the subject is legible.
 * Non-focus countries are rendered in bone for geographic context.
 */

import React, { useMemo } from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import {
  getAllCountries,
  getCountryByAlpha3,
  type CountryFeature,
} from "../utils/atlasProjection";
import { layout, palette, fonts } from "../design/theme";

// ── Layout ────────────────────────────────────────────────────────────────

const DEFAULT_SIZE = 220;
const ASPECT = 0.65; // height = size × 0.65
const INSET_MARGIN = 32;
const INSET_PAD = 16;

// ── Props ─────────────────────────────────────────────────────────────────

export interface AtlasDetailInsetProps {
  /** ISO 3166-1 alpha-3 codes of countries to fit the inset projection around. */
  focusIso3: string[];
  /**
   * Optional per-iso3 hex fill. When a country's iso3 is in focusIso3 but
   * absent from fillMap, falls back to `palette.amber`. Non-focus countries
   * always use `palette.bone` (geographic context).
   */
  fillMap?: Record<string, string>;
  /** Corner anchor position. */
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Width in px. Height = size × 0.65. Default 220. */
  size?: number;
  /** Light / dark register. */
  dark?: boolean;
  /** Overall opacity — use for fade-in animations. Default 1. */
  opacity?: number;
}

// ── Component ─────────────────────────────────────────────────────────────

export const AtlasDetailInset: React.FC<AtlasDetailInsetProps> = ({
  focusIso3,
  fillMap,
  corner,
  size = DEFAULT_SIZE,
  dark = false,
  opacity = 1,
}) => {
  const insetW = size;
  const insetH = Math.round(size * ASPECT);

  // All country features — loaded once at module level via getAllCountries().
  const allCountries = useMemo(() => getAllCountries(), []);

  // Focus features used to fit the projection.
  const focusFeatures = useMemo((): Feature<Geometry>[] => {
    const features: Feature<Geometry>[] = [];
    for (const iso3 of focusIso3) {
      const c = getCountryByAlpha3(iso3);
      if (c) features.push(c.feature);
    }
    return features;
  }, [focusIso3]);

  // Projection fitted to the focus countries' combined bbox.
  // Uses Equal Earth (area-preserving) so the inset matches the AtlasInsetLocator
  // projection family — consistent visual vocabulary across both insets.
  const projection = useMemo(() => {
    if (focusFeatures.length === 0) return null;
    const p = geoEqualEarth();
    const combinedFeature: Feature<Geometry> = {
      type: "Feature",
      geometry: {
        type: "GeometryCollection",
        geometries: focusFeatures.map((f) => f.geometry),
      } as Geometry, // d3-geo accepts GeometryCollection at runtime
      properties: {},
    };
    p.fitExtent(
      [
        [INSET_PAD, INSET_PAD],
        [insetW - INSET_PAD, insetH - INSET_PAD],
      ],
      combinedFeature as unknown as FeatureCollection,
    );
    return p;
  }, [focusFeatures, insetW, insetH]);

  // Screen-space bbox of the focus countries (for the dashed rust rect).
  const focusBbox = useMemo(() => {
    if (!projection || focusFeatures.length === 0) return null;
    const pathGen = geoPath(projection);
    const merged: Feature<Geometry> = {
      type: "Feature",
      geometry: {
        type: "GeometryCollection",
        geometries: focusFeatures.map((f) => f.geometry),
      } as Geometry,
      properties: {},
    };
    const [[x0, y0], [x1, y1]] = pathGen.bounds(merged as any); // no-as-any-ok: d3-geo accepts GeometryCollection at runtime
    const pad = 4;
    return {
      x: Math.max(0, x0 - pad),
      y: Math.max(0, y0 - pad),
      width: Math.min(insetW, x1 - x0 + pad * 2),
      height: Math.min(insetH, y1 - y0 + pad * 2),
    };
  }, [projection, focusFeatures, insetW, insetH]);

  // Country name label — up to 3 names, then "+N more".
  const labelText = useMemo(() => {
    const names: string[] = [];
    for (const iso3 of focusIso3) {
      const c = getCountryByAlpha3(iso3);
      if (c?.name) names.push(c.name);
    }
    if (names.length <= 3) return names.join(", ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
  }, [focusIso3]);

  // Absolute positioning by corner (same margin logic as AtlasInsetLocator).
  const cornerStyle: React.CSSProperties = {
    position: "absolute",
    top: corner.startsWith("top")
      ? layout.safeArea.top + INSET_MARGIN
      : undefined,
    bottom: corner.startsWith("bottom")
      ? layout.safeArea.bottom + INSET_MARGIN
      : undefined,
    left: corner.endsWith("left") ? layout.safeArea.left : undefined,
    right: corner.endsWith("right") ? layout.safeArea.right : undefined,
    zIndex: 9,
    pointerEvents: "none",
    opacity,
  };

  // Color tokens — mirrors AtlasInsetLocator register.
  const frameFill = dark ? palette.ink : palette.paper;
  const frameStroke = dark ? palette.bone + "40" : palette.ink + "30";
  const oceanFill = dark ? "#0A0907" : "#DDD3C5";

  if (!projection) return null;

  const pathGen = geoPath(projection);

  return (
    <div style={cornerStyle} aria-hidden="true">
      <svg
        width={insetW}
        height={insetH}
        viewBox={`0 0 ${insetW} ${insetH}`}
      >
        {/* Frame background */}
        <rect
          x={0}
          y={0}
          width={insetW}
          height={insetH}
          fill={frameFill}
          fillOpacity={0.92}
          stroke={frameStroke}
          strokeWidth={1}
          rx={4}
        />
        {/* Ocean fill */}
        <rect
          x={1}
          y={1}
          width={insetW - 2}
          height={insetH - 2}
          fill={oceanFill}
          rx={3}
        />
        {/* All countries — highlighted in amber (or fillMap color), others in bone */}
        {allCountries.map((c: CountryFeature) => {
          const iso3 = c.alpha3 ?? "";
          const isFocus = focusIso3.includes(iso3);
          const fill = isFocus
            ? (fillMap?.[iso3] ?? palette.amber)
            : (dark ? "#2A2620" : palette.bone);
          const d = pathGen(c.feature) ?? "";
          if (!d) return null;
          return (
            <path
              key={iso3 || c.name}
              d={d}
              fill={fill}
              stroke={palette.ink}
              strokeOpacity={0.15}
              strokeWidth={0.5}
              strokeLinejoin="round"
            />
          );
        })}
        {/* Dashed rust bbox around focused countries */}
        {focusBbox && (
          <rect
            x={focusBbox.x}
            y={focusBbox.y}
            width={focusBbox.width}
            height={focusBbox.height}
            fill="none"
            stroke={palette.rust}
            strokeWidth={1.5}
            strokeDasharray="6 3"
          />
        )}
      </svg>
      {/* Country name label — mono, small, below the SVG */}
      {labelText && (
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: 10,
            color: dark ? palette.bone + "99" : palette.ink + "80",
            marginTop: 3,
            paddingLeft: 4,
            letterSpacing: 0.3,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: insetW,
          }}
        >
          {labelText}
        </div>
      )}
    </div>
  );
};
