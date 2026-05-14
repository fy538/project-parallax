/**
 * AtlasInsetLocator — small Equal Earth locator inset for AtlasPlate.
 *
 * Editorial-atlas convention: when the main view is zoomed in on a region,
 * a small (~180×120px) world map in a corner shows "you are here" with a
 * rust rectangle highlighting the focused region. National Geographic,
 * FT regional supplements, NYT election graphics — all use this device.
 *
 * Always uses Equal Earth (area-preserving locator) regardless of the main
 * view's projection. The whole point is to show "where in the world" —
 * matching the main projection in the inset defeats the purpose.
 *
 * Renders:
 *   1. Subtle paper-tinted rounded rectangle (the inset frame).
 *   2. All countries projected through Equal Earth fit to the inset.
 *   3. Optional rust extent rectangle around the focused-region bbox.
 *
 * The country basemap is computed ONCE per composition (mounted state) —
 * it never changes per frame. Only the extent rectangle moves between
 * phases. Cheap to render.
 */

import React, { useMemo } from "react";
import { geoEqualEarth, geoPath } from "d3-geo";
import type { Feature, Geometry } from "geojson";
import {
  fitProjectionToWorld,
  getAllCountries,
  getCountryByAlpha3,
  type CountryFeature,
} from "../utils/atlasProjection";
import { layout, palette } from "../design/theme";

// ── Layout ────────────────────────────────────────────────────────────────

const DEFAULT_WIDTH = 180;
const ASPECT = 2 / 3; // height = width × 2/3 (Equal Earth fits ~2:1 world but we want a tighter inset)
const INSET_MARGIN = 32;
const INSET_PAD = 8;

// ── Props ─────────────────────────────────────────────────────────────────

export interface AtlasInsetLocatorProps {
  /** Corner anchor. */
  corner: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Width in px. Height auto-scales (2:3). */
  size?: number;
  /** ISO3 codes of currently focused countries, or undefined for world view. */
  focusIso3?: string[];
  /** Light / dark register. */
  dark: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────

export const AtlasInsetLocator: React.FC<AtlasInsetLocatorProps> = ({
  corner,
  size = DEFAULT_WIDTH,
  focusIso3,
  dark,
}) => {
  const width = size;
  const height = Math.round(size * ASPECT);

  // Inset projection — Equal Earth fit to (width × height) with a small
  // inner padding so countries don't kiss the inset frame. Stateful d3-geo
  // projection but only mutated once at memo time.
  const projection = useMemo(() => {
    const p = geoEqualEarth();
    fitProjectionToWorld(p, { width, height }, INSET_PAD);
    return p;
  }, [width, height]);

  // All-country land paths — projected through the inset projection ONCE.
  // Memoized on projection identity (which itself is memoized on size).
  const landPath = useMemo(() => {
    const pathGen = geoPath(projection);
    // Merge all country geometries into a single path for cheap render.
    const features = getAllCountries().map(
      (c: CountryFeature) => c.feature,
    );
    const merged: Feature<Geometry> = {
      type: "Feature",
      geometry: {
        type: "GeometryCollection",
        geometries: features.map((f) => f.geometry),
      } as any, // no-as-any-ok: d3-geo accepts GeometryCollection at runtime
      properties: {},
    };
    return pathGen(merged as any) ?? "";
  }, [projection]);

  // Focus-region bbox in screen coords — recomputed per phase.
  const focusRect = useMemo(() => {
    if (!focusIso3 || focusIso3.length === 0) return null;
    const features: Feature<Geometry>[] = [];
    for (const iso3 of focusIso3) {
      const c = getCountryByAlpha3(iso3);
      if (c) features.push(c.feature);
    }
    if (features.length === 0) return null;
    // Compute screen-space bbox via geoPath().bounds().
    const pathGen = geoPath(projection);
    const merged: Feature<Geometry> = {
      type: "Feature",
      geometry: {
        type: "GeometryCollection",
        geometries: features.map((f) => f.geometry),
      } as any,
      properties: {},
    };
    const [[x0, y0], [x1, y1]] = pathGen.bounds(merged as any);
    // Add a small inset padding around the bbox so the rust rectangle
    // visually "contains" the highlighted countries with breathing room.
    const pad = 3;
    return {
      x: Math.max(0, x0 - pad),
      y: Math.max(0, y0 - pad),
      width: Math.min(width, x1 - x0 + pad * 2),
      height: Math.min(height, y1 - y0 + pad * 2),
    };
  }, [focusIso3, projection, width, height]);

  // Absolute positioning by corner.
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
  };

  // Color tokens — inset register is a quieter version of the main map's.
  const frameFill = dark ? palette.ink : palette.paper;
  const frameStroke = dark ? palette.bone + "40" : palette.ink + "30";
  const landFill = dark ? "#2A2620" : palette.bone;
  const landStroke = dark ? palette.ink : "#D4CAB8";
  const oceanFill = dark ? "#0A0907" : "#DDD3C5";
  const focusStroke = palette.rust;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={cornerStyle}
      aria-hidden="true"
    >
      {/* Frame background — paper / ink with subtle stroke */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill={frameFill}
        stroke={frameStroke}
        strokeWidth={1}
        rx={3}
      />
      {/* Ocean fill (inside frame) */}
      <rect
        x={1}
        y={1}
        width={width - 2}
        height={height - 2}
        fill={oceanFill}
      />
      {/* Land — all countries merged */}
      <path
        d={landPath}
        fill={landFill}
        stroke={landStroke}
        strokeWidth={0.4}
        strokeLinejoin="round"
      />
      {/* Focus extent rectangle (when phase has focus.iso3) */}
      {focusRect && (
        <rect
          x={focusRect.x}
          y={focusRect.y}
          width={focusRect.width}
          height={focusRect.height}
          fill="none"
          stroke={focusStroke}
          strokeWidth={1.5}
        />
      )}
    </svg>
  );
};
