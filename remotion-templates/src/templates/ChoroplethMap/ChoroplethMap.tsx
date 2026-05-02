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
  ramps,
  fontSizes,
  layout,
  sec,
  light,
  shadows,
  cardPadding,
  textMaxWidth,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  exitFade,
  CLAMP_QUARTIC,
  CLAMP_CUBIC_INOUT,
} from "../../utils/animation";
import { scaleToZoom, interpolateCamera } from "../../utils/mapUtils";
import type { CameraState } from "../../utils/mapUtils";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { Background } from "../../components/Background";
import { MapGL } from "../../components/MapGL";
import { FadeIn } from "../../components/FadeIn";
import type { ChoroplethMapData, AnimationPhase, CountryData } from "./types";

// ── Color ramp lookup ───────────────────────────────────────────────────────

const rampLookup: Record<string, readonly string[]> = {
  blue: ramps.blue,
  red: ramps.red,
  teal: ramps.amber,
  gray: ramps.gray,
};

function getColorRamp(ramp?: string | string[]): readonly string[] {
  if (!ramp) return ramps.blue;
  if (Array.isArray(ramp)) return ramp;
  return rampLookup[ramp] || ramps.blue;
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
    .filter((c) => c.iso3 && (c.fill || c.value !== undefined))
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
  const { durationInFrames } = useVideoConfig();
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });

  const colorRamp = useMemo(
    () => getColorRamp(data.colorRamp),
    [data.colorRamp]
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

  const bearingDrift = interpolate(frame, [0, durationInFrames], [0, 8], {
    extrapolateRight: "clamp",
  });

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
    <Background variant="light" tint={data.backgroundTint}>
      <AbsoluteFill style={compStyle}>
        <MapGL
          longitude={camera.longitude}
          latitude={camera.latitude}
          zoom={camera.zoom}
          pitch={camera.pitch}
          bearing={camera.bearing + bearingDrift}
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

        {/* Phase title overlay */}
        {current && (
          <div
            style={{
              position: "absolute",
              bottom: layout.safeArea.bottom,
              left: layout.safeArea.left,
              right: layout.safeArea.right,
              opacity: exitFade(frame, durationInFrames),
            }}
          >
            <FadeIn
              startFrame={current.startFrame}
              direction="up"
              distance={20}
            >
              <div
                style={{
                  backgroundColor: `${palette.ink}D9`,
                  padding: cardPadding.css,
                  borderRadius: 4,
                  maxWidth: 700,
                  boxShadow: `0 2px 12px rgba(0,0,0,0.25), 0 0 20px ${palette.amber}15`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 4,
                    background: `linear-gradient(180deg, ${palette.amber}, ${palette.amber}40)`,
                    borderRadius: "4px 0 0 4px",
                  }}
                />
                <div
                  style={{
                    fontSize: fontSizes.h3,
                    fontWeight: 600,
                    color: light.text.primary,
                    marginBottom: current.phase.subtitle ? layout.spacing.xs : 0,
                    textShadow: shadows.textLift,
                    maxWidth: textMaxWidth.h2,
                  }}
                >
                  {current.phase.title}
                </div>
                {current.phase.subtitle && (
                  <div
                    style={{
                      fontSize: fontSizes.caption,
                      color: light.text.muted,
                      textShadow: shadows.textLift,
                      maxWidth: textMaxWidth.body,
                    }}
                  >
                    {current.phase.subtitle}
                  </div>
                )}
              </div>
            </FadeIn>
          </div>
        )}

        {/* Episode label (top left) */}
        <div
          style={{
            position: "absolute",
            top: layout.safeArea.top,
            left: layout.safeArea.left,
            opacity: Math.min(
              fadeIn(frame, 0, sec(1)),
              exitFade(frame, durationInFrames)
            ),
            transform: `translateY(${slideIn(frame, 0, 12, sec(0.8))}px)`,
          }}
        >
          <div
            style={{
              fontSize: fontSizes.label,
              color: light.text.muted,
              letterSpacing: 2,
              textTransform: "uppercase",
              textShadow: shadows.textLift,
            }}
          >
            {data.episode}
          </div>
          <div
            style={{
              fontSize: fontSizes.body,
              color: light.text.primary,
              fontWeight: 500,
              marginTop: layout.spacing.xs / 2,
              textShadow: shadows.textLift,
            }}
          >
            {data.title}
          </div>
        </div>
      </AbsoluteFill>
    </Background>
  );
};
