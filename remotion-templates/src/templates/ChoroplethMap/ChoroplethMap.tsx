/**
 * ChoroplethMap — animated world map that highlights countries in phases.
 *
 * Migrated from react-simple-maps to Mapbox GL + react-map-gl.
 * Base map renders via Mapbox vector tiles (terrain, hillshading, bathymetry).
 * Country highlights use the mapbox.country-boundaries-v1 tileset with
 * a dynamic Mapbox expression that updates per-frame for smooth color transitions.
 *
 * Data schema is unchanged — ChoroplethMapData, AnimationPhase, CountryData
 * all stay identical for backward compatibility with existing JSON data files.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { Source, Layer } from "react-map-gl/mapbox";
import {
  palette,
  semantic,
  ramps,
  fonts,
  fontSizes,
  layout,
  sec,
  shadows,
  contentArea,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import {
  fadeIn,
  slideIn,
  exitFade,
  CLAMP,
  CLAMP_QUARTIC,
  CLAMP_CUBIC_INOUT,
} from "../../utils/animation";
import { scaleToZoom, interpolateCamera } from "../../utils/mapUtils";
import type { CameraState } from "../../utils/mapUtils";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { MapGL } from "../../components/MapGL";
import { TitleBlock } from "../../components/TitleBlock";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import type { ChoroplethMapData, AnimationPhase, CountryData } from "./types";

// ── Color ramp lookup ───────────────────────────────────────────────────────
//
// ColorBrewer-vetted defaults adapted to the Parallax palette:
//
//   `ylOrBr` — bone → gold → rust → oxblood, the sequential warm ramp.
//     Recommended default for quantitative single-direction data (income,
//     intensity, density). Brand-aligned variant of ColorBrewer 5-class YlOrBr.
//
//   `rdBu` — rust → bone → blue, the diverging ramp.
//     Recommended for diff maps or anything with a meaningful midpoint
//     (deviation from baseline, swing maps). Brand-aligned variant of
//     ColorBrewer 5-class RdBu.
//
// Reference: references/template-research/choropleth-map.md § 6.2

// Brand-aligned YlOrBr (sequential, light → dark, warm).
// Pulled from palette tokens so the ramp stays in sync with brand updates.
const RAMP_YL_OR_BR: readonly string[] = [
  palette.paper,
  palette.bone,
  palette.gold,
  semantic.china,   // rust
  palette.walnut,   // oxblood-equivalent
];

// Brand-aligned RdBu (diverging — rust ↔ bone midpoint ↔ blue).
const RAMP_RD_BU: readonly string[] = [
  palette.walnut,   // oxblood deep
  semantic.china,   // rust
  palette.bone,     // midpoint
  palette.dustblue, // muted us-blue mid (between bone and us-blue)
  semantic.us,      // blue
];

const rampLookup: Record<string, readonly string[]> = {
  blue: ramps.blue,
  red: ramps.red,
  teal: ramps.amber,
  gray: ramps.gray,
  ylOrBr: RAMP_YL_OR_BR,
  rdBu: RAMP_RD_BU,
};

function getColorRamp(ramp?: string | string[]): readonly string[] {
  // Default to brand-aligned YlOrBr — the editorially safe choice for most
  // quantitative choropleth, per choropleth-map.md § 6.2.
  if (!ramp) return RAMP_YL_OR_BR;
  if (Array.isArray(ramp)) return ramp;
  return rampLookup[ramp] || RAMP_YL_OR_BR;
}

// ── Phase timing ────────────────────────────────────────────────────────────

interface PhaseWindow {
  phase: AnimationPhase;
  startFrame: number;
  endFrame: number;
  index: number;
}

function computePhaseWindows(phases: AnimationPhase[]): PhaseWindow[] {
  let cursor = 0;
  return phases.map((phase, i) => {
    const start = cursor;
    const duration = sec(phase.durationSec);
    cursor += duration;
    return { phase, startFrame: start, endFrame: cursor, index: i };
  });
}

function getCurrentPhase(
  frame: number,
  windows: PhaseWindow[]
): PhaseWindow | null {
  return (
    windows.find((w) => frame >= w.startFrame && frame < w.endFrame) || null
  );
}

// ── Camera conversion ───────────────────────────────────────────────────────

function phaseToCamera(
  phase: AnimationPhase | null,
  defaults: { center?: [number, number]; scale?: number }
): CameraState {
  const center = phase?.center || defaults.center || [0, 20];
  const scale = phase?.scale || defaults.scale || 150;
  return {
    longitude: center[0],
    latitude: center[1],
    zoom: scaleToZoom(scale),
    pitch: 30,
    bearing: 0,
  };
}

// ── Country fill color resolver ─────────────────────────────────────────────

function resolveCountryFill(
  country: CountryData,
  colorRamp: readonly string[],
  transitionT: number
): string {
  const base = ramps.gray[1];

  // No-data treatment: distinct umber neutral that doesn't collide with the
  // lightest bin of the active ramp. The dossier's failure mode this avoids
  // is "Gray for 'no data' indistinguishable from the lightest bin."
  // See: references/template-research/choropleth-map.md § 6.5
  if (country.noData) {
    return lerpHex(base, palette.umber, transitionT);
  }

  if (country.fill) {
    return lerpHex(base, country.fill, transitionT);
  }

  if (country.value !== undefined) {
    const idx = Math.min(
      Math.floor(country.value * (colorRamp.length - 1)),
      colorRamp.length - 1
    );
    return lerpHex(base, colorRamp[idx], transitionT);
  }

  return base;
}

function parseHex(hex: string): [number, number, number] {
  const num = parseInt(hex.replace("#", ""), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function lerpHex(from: string, to: string, t: number): string {
  const [fr, fg, fb] = parseHex(from);
  const [tr, tg, tb] = parseHex(to);
  const r = Math.round(fr + (tr - fr) * t);
  const g = Math.round(fg + (tg - fg) * t);
  const b = Math.round(fb + (tb - fb) * t);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// ── Mapbox style expressions for country fills ──────────────────────────────

function buildCountryFillExpression(
  phase: AnimationPhase | null,
  frame: number,
  phaseStart: number,
  colorRamp: readonly string[]
): any[] {
  if (!phase || !phase.countries.length) {
    return ["literal", "rgba(0,0,0,0)"];
  }

  const t = interpolate(
    frame,
    [phaseStart, phaseStart + sec(0.8)],
    [0, 1],
    CLAMP_QUARTIC
  );

  const entries: any[] = [];

  for (const country of phase.countries) {
    if (!country.iso3) continue;
    const fill = resolveCountryFill(country, colorRamp, t);
    entries.push(country.iso3, fill);
  }

  if (entries.length === 0) {
    return ["literal", "rgba(0,0,0,0)"];
  }

  return [
    "match",
    ["get", "iso_3166_1_alpha_3"],
    ...entries,
    "rgba(0,0,0,0)",
  ];
}

function buildCountryOpacityExpression(
  phase: AnimationPhase | null,
  frame: number,
  phaseStart: number
): any[] {
  if (!phase || !phase.countries.length) {
    return ["literal", 0];
  }

  const t = interpolate(
    frame,
    [phaseStart, phaseStart + sec(0.8)],
    [0, 0.75],
    CLAMP_QUARTIC
  );

  const isoList = phase.countries
    .filter((c) => c.iso3 && (c.fill || c.value !== undefined || c.noData))
    .map((c) => c.iso3!);

  if (isoList.length === 0) return ["literal", 0];

  return [
    "case",
    ["in", ["get", "iso_3166_1_alpha_3"], ["literal", isoList]],
    t,
    0,
  ];
}

// ── Main component ──────────────────────────────────────────────────────────

export const ChoroplethMap: React.FC<{ data: ChoroplethMapData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const theme = useThemeMode(data.backgroundVariant || "light");
  const { durationInFrames } = useVideoConfig();
  const { style: compStyle } = useCompositionAnimation({ noDrift: true, ...direction.driftOptions });
  // Per-episode color emphasis — pulls primaryAccent for contested-actor
  // highlight color. See remotion-templates/BRAND.md → "Per-Episode Color Emphasis".
  const emphasis = useEpisodeColorEmphasis();

  const colorRamp = useMemo(
    () => getColorRamp(data.colorRamp),
    [data.colorRamp]
  );
  // Detect whether any phase has a country marked noData — if so, the legend
  // strip appends an umber "No data" swatch so the encoding is self-explaining.
  // See: choropleth-map.md § 6.5 (no-data treatment).
  const hasAnyNoData = useMemo(
    () => data.phases.some((p) => p.countries.some((c) => c.noData)),
    [data.phases]
  );
  const windows = useMemo(
    () => computePhaseWindows(data.phases),
    [data.phases]
  );
  const current = getCurrentPhase(frame, windows);

  // ── Camera ────────────────────────────────────────────────────────────

  const currentCamera = phaseToCamera(current?.phase || null, data);

  let camera: CameraState;
  if (current && current.index > 0) {
    const prevPhase = windows[current.index - 1];
    const prevCamera = phaseToCamera(prevPhase?.phase || null, data);
    const camT = interpolate(
      frame,
      [current.startFrame, current.startFrame + sec(1.5)],
      [0, 1],
      CLAMP_CUBIC_INOUT
    );
    camera = interpolateCamera(prevCamera, currentCamera, camT);
  } else {
    camera = currentCamera;
  }

  // Linear intentional — constant-speed drift for bearing (easing: none)
  const bearingDrift = interpolate(frame, [0, durationInFrames], [0, 8], CLAMP);

  // ── Country highlight expressions ─────────────────────────────────────

  const fillExpression = buildCountryFillExpression(
    current?.phase || null,
    frame,
    current?.startFrame || 0,
    colorRamp
  );

  const opacityExpression = buildCountryOpacityExpression(
    current?.phase || null,
    frame,
    current?.startFrame || 0
  );

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {/* Brand strips */}
        <HeaderStrip
          metadata={`${data.episode || ""} · ${camera.latitude.toFixed(1)}°${camera.latitude >= 0 ? "N" : "S"} ${Math.abs(camera.longitude).toFixed(1)}°${camera.longitude >= 0 ? "E" : "W"}`.trim()}
          mode={data.backgroundVariant === "dark" ? "dark" : "light"}
        />
        <FooterStrip
          scale={`Z${camera.zoom.toFixed(1)}`}
          mode={data.backgroundVariant === "dark" ? "dark" : "light"}
        />

        <MapGL
          longitude={camera.longitude}
          latitude={camera.latitude}
          zoom={camera.zoom}
          pitch={camera.pitch}
          bearing={camera.bearing + bearingDrift}
          projection={data.projection}
          dark={data.backgroundVariant === "dark"}
        >
          <Source
            id="country-boundaries"
            type="vector"
            url="mapbox://mapbox.country-boundaries-v1"
          >
            <Layer
              id="country-highlight-fills"
              type="fill"
              source-layer="country_boundaries"
              paint={{
                "fill-color": fillExpression as any,
                "fill-opacity": opacityExpression as any,
              }}
            />
            {/* Fill-extrusion — Nat Geo signature: highlighted countries push up subtly */}
            <Layer
              id="country-highlight-extrude"
              type="fill-extrusion"
              source-layer="country_boundaries"
              paint={{
                "fill-extrusion-color": fillExpression as any,
                "fill-extrusion-opacity": 0.35,
                "fill-extrusion-height": [
                  "case",
                  ["==", ["typeof", opacityExpression], "number"],
                  ["*", ["literal", 30000], opacityExpression],
                  30000,
                ] as any,
                "fill-extrusion-base": 0,
              }}
            />
            <Layer
              id="country-highlight-borders"
              type="line"
              source-layer="country_boundaries"
              paint={{
                "line-color": fillExpression as any,
                "line-width": 1.5,
                "line-opacity": opacityExpression as any,
                "line-blur": 3,
              }}
            />
          </Source>
        </MapGL>

        {/* Coordinate metadata now lives in HeaderStrip (top-right) */}

        {/* Phase title overlay — now using TitleBlock component */}
        {current && (
          <div
            style={{
              opacity: exitFade(frame, durationInFrames, 15),
            }}
          >
            <TitleBlock
              title={current.phase.title}
              subtitle={current.phase.subtitle}
              mode="dark"
              safeAreaTier="generous"
              startFrame={current.startFrame}
              accentColor={emphasis.primaryAccent}
            />
          </div>
        )}

        {/* Episode info now consolidated into HeaderStrip (top) */}

        {/* Legend strip — horizontal color-ramp bar above the FooterStrip.
            Mandatory for quantitative choropleths so the color encoding
            is readable. Renders break-value labels in mono caps + optional
            caption on the left. See: choropleth-map.md § 6.4 */}
        {data.legend && (
          <div
            style={{
              position: "absolute",
              bottom: 64,
              left: layout.safeAreaTier.generous.left,
              right: layout.safeAreaTier.generous.right,
              display: "flex",
              alignItems: "center",
              gap: layout.spacing.md,
              opacity: fadeIn(frame, sec(0.6), sec(0.6)) * exitFade(frame, durationInFrames, 15),
              pointerEvents: "none",
            }}
          >
            {/* Caption */}
            {data.legend.label && (
              <div
                style={{
                  fontSize: fontSizes.label,
                  fontFamily: fonts.metadata,
                  color: theme.text.secondary,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  maxWidth: 320,
                }}
              >
                {data.legend.label}
              </div>
            )}

            {/* Color ramp swatch row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                maxWidth: 600,
              }}
            >
              {colorRamp.map((color, idx) => {
                const isLast = idx === colorRamp.length - 1;
                const breakValue = data.legend?.breaks?.[idx];
                return (
                  <React.Fragment key={`swatch-${idx}`}>
                    <div
                      style={{
                        flex: 1,
                        height: 12,
                        background: color,
                        opacity: 0.85,
                      }}
                    />
                    {!isLast && breakValue !== undefined && (
                      <div
                        style={{
                          fontSize: fontSizes.caption,
                          fontFamily: fonts.data,
                          color: theme.text.muted,
                          padding: `0 ${layout.spacing.xs}px`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {breakValue}
                        {data.legend?.unit ? data.legend.unit : ""}
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* "No data" swatch — appended after the ramp when any country
                is marked noData. Visually distinct from the ramp swatches
                (narrower, palette.umber fill, leading vertical separator)
                so the eye reads it as a separate category, not as another bin.
                See: choropleth-map.md § 6.5 */}
            {hasAnyNoData && (
              <>
                {/* Thin vertical separator between ramp and no-data swatch */}
                <div
                  style={{
                    width: 1,
                    height: 16,
                    background: theme.text.muted,
                    opacity: 0.35,
                    marginLeft: layout.spacing.sm,
                    marginRight: layout.spacing.sm,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: layout.spacing.xs,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 12,
                      background: palette.umber,
                      opacity: 0.85,
                    }}
                  />
                  <div
                    style={{
                      fontSize: fontSizes.caption,
                      fontFamily: fonts.data,
                      color: theme.text.muted,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {data.legend?.noDataLabel ?? "No data"}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};
