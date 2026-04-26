/**
 * ChoroplethMap — animated world map that highlights countries in phases.
 *
 * Each phase can highlight different countries with different colors,
 * show labels, and optionally re-center the map. Phases play sequentially.
 *
 * This is the workhorse template for geopolitics content — supply chain
 * maps, alliance visualizations, trade flow overviews.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { palette, dark, semantic, ramps, fonts, fontSizes, layout, sec } from "../../design/theme";
import { fadeIn, stagger } from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { FadeIn } from "../../components/FadeIn";
import type { ChoroplethMapData, AnimationPhase, CountryData } from "./types";

// TopoJSON URL — world countries at 110m resolution
const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

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
  return windows.find((w) => frame >= w.startFrame && frame < w.endFrame) || null;
}

// ── Country fill resolver ───────────────────────────────────────────────────

function buildCountryLookup(
  countries: CountryData[]
): Map<string, CountryData> {
  const map = new Map<string, CountryData>();
  for (const c of countries) {
    map.set(c.name, c);
    if (c.iso3) map.set(c.iso3, c);
  }
  return map;
}

function getCountryFill(
  countryName: string,
  phase: AnimationPhase | null,
  frame: number,
  phaseStart: number,
  colorRamp: readonly string[],
  countryLookup?: Map<string, CountryData>
): string {
  if (!phase) return ramps.gray[1];

  const match = countryLookup?.get(countryName);
  if (!match) return ramps.gray[1];

  // If explicit fill color is set, use it
  if (match.fill) {
    // Animate the fill appearing
    const t = interpolate(
      frame,
      [phaseStart, phaseStart + sec(0.6)],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    return t > 0.5 ? match.fill : ramps.gray[1];
  }

  // If value is set, map to color ramp
  if (match.value !== undefined) {
    const idx = Math.min(
      Math.floor(match.value * (colorRamp.length - 1)),
      colorRamp.length - 1
    );
    const t = interpolate(
      frame,
      [phaseStart, phaseStart + sec(0.6)],
      [0, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
    return t > 0.5 ? colorRamp[idx] : ramps.gray[1];
  }

  return ramps.gray[1];
}

// ── Main component ──────────────────────────────────────────────────────────

export const ChoroplethMap: React.FC<{ data: ChoroplethMapData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });

  const colorRamp = useMemo(() => getColorRamp(data.colorRamp), [data.colorRamp]);
  const windows = useMemo(() => computePhaseWindows(data.phases), [data.phases]);
  const current = getCurrentPhase(frame, windows);

  const countryLookup = useMemo(
    () => current?.phase.countries ? buildCountryLookup(current.phase.countries) : new Map(),
    [current?.phase.countries]
  );

  // Resolve map projection settings
  const center = current?.phase.center || data.center || [0, 20];
  const scale = current?.phase.scale || data.scale || 150;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark.bg.map,
        fontFamily: fonts.heading,
      }}
    >
      <AbsoluteFill style={compStyle}>
        {/* ── Map ────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      >
        <ComposableMap
          projection={data.projection || "geoNaturalEarth1"}
          projectionConfig={{ scale, center: center as [number, number] }}
          width={layout.width}
          height={layout.height}
          style={{ width: "100%", height: "100%" }}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const name = geo.properties.name;
                const fill = getCountryFill(
                  name,
                  current?.phase || null,
                  frame,
                  current?.startFrame || 0,
                  colorRamp,
                  countryLookup
                );

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke={dark.bg.map}
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { outline: "none" },
                      pressed: { outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* ── Country labels ──────────────────────────────────────────── */}
          {current?.phase.countries
            .filter((c) => c.label)
            .map((c, i) => {
              // We need coordinates for labels — use a simple lookup
              // In production, add a coordinates field to CountryData
              return null; // Labels require geo coordinates — see CLAUDE.md
            })}
        </ComposableMap>
      </div>

      {/* ── Phase title overlay ─────────────────────────────────────────── */}
      {current && (
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom,
            left: layout.safeArea.left,
            right: layout.safeArea.right,
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
                borderLeft: `4px solid ${palette.amber}`,
                padding: "20px 32px",
                borderRadius: 4,
                maxWidth: 700,
              }}
            >
              <div
                style={{
                  fontSize: fontSizes.h3,
                  fontWeight: 600,
                  color: dark.text.primary,
                  marginBottom: current.phase.subtitle ? 6 : 0,
                }}
              >
                {current.phase.title}
              </div>
              {current.phase.subtitle && (
                <div
                  style={{
                    fontSize: fontSizes.caption,
                    color: dark.text.muted,
                  }}
                >
                  {current.phase.subtitle}
                </div>
              )}
            </div>
          </FadeIn>
        </div>
      )}

      {/* ── Episode label (top left) ────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: layout.safeArea.top,
          left: layout.safeArea.left,
          opacity: fadeIn(frame, 0, sec(1)),
        }}
      >
        <div
          style={{
            fontSize: fontSizes.label,
            color: dark.text.muted,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {data.episode}
        </div>
        <div
          style={{
            fontSize: fontSizes.body,
            color: dark.text.primary,
            fontWeight: 500,
            marginTop: 4,
          }}
        >
          {data.title}
        </div>
      </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
