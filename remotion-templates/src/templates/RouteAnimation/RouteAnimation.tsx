/**
 * RouteAnimation — animated trade/supply chain routes on a world map.
 *
 * Points appear as labeled dots, route segments draw themselves between
 * points using animated SVG lines. Phases control which segments are
 * visible and in what order.
 *
 * EP01 use case: chip supply chain — design (US) → fab (Taiwan) → assembly
 * (China/Malaysia) → consumer markets.
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from "react-simple-maps";
import { palette, dark, ramps, fonts, fontSizes, layout, sec } from "../../design/theme";
import { fadeIn, slideIn } from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { FadeIn } from "../../components/FadeIn";
import type { RouteAnimationData, RoutePhase } from "./types";

// TopoJSON URL — world countries at 110m resolution
const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// ── Phase time calculator ──────────────────────────────────────────────────

function getPhaseWindow(
  phases: RoutePhase[],
  index: number
): { start: number; end: number } {
  let start = sec(0.5); // initial delay
  for (let i = 0; i < index; i++) {
    start += sec(phases[i].durationSec);
  }
  return { start, end: start + sec(phases[index].durationSec) };
}

function getCurrentPhaseIndex(
  phases: RoutePhase[],
  frame: number
): number {
  let cursor = sec(0.5);
  for (let i = 0; i < phases.length; i++) {
    const end = cursor + sec(phases[i].durationSec);
    if (frame < end) return i;
    cursor = end;
  }
  return phases.length - 1;
}

// ── Main component ──────────────────────────────────────────────────────────

export const RouteAnimation: React.FC<{ data: RouteAnimationData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });
  const routeColor = data.routeColor || palette.amber;

  const currentPhaseIdx = getCurrentPhaseIndex(data.phases, frame);
  const currentPhase = data.phases[currentPhaseIdx];
  const phaseWindow = getPhaseWindow(data.phases, currentPhaseIdx);

  // Collect all active segments/points up to and including current phase
  const allActiveSegments = new Set<number>();
  const allActivePoints = new Set<number>();
  for (let i = 0; i <= currentPhaseIdx; i++) {
    data.phases[i].activeSegments.forEach((s) => allActiveSegments.add(s));
    data.phases[i].activePoints.forEach((p) => allActivePoints.add(p));
  }

  // Segments newly added in this phase (for animation)
  const newSegments = new Set(data.phases[currentPhaseIdx].activeSegments);

  // Map projection
  const mapCenter = currentPhase.center || data.center || [60, 25];
  const mapScale = currentPhase.scale || data.scale || 200;

  return (
    <AbsoluteFill style={{ backgroundColor: dark.bg.map }}>
      <AbsoluteFill style={compStyle}>
      {/* ── Map ──────────────────────────────────────────────────────── */}
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: mapScale,
          center: mapCenter,
        }}
        width={layout.width}
        height={layout.height}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Base geography */}
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rpiKey}
                geography={geo}
                fill={ramps.gray[0]}
                stroke={dark.bg.map}
                strokeWidth={0.5}
                style={{
                  default: { outline: "none" },
                  hover: { outline: "none" },
                  pressed: { outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {/* ── Route lines ──────────────────────────────────────────── */}
        {data.segments.map((seg, i) => {
          if (!allActiveSegments.has(i)) return null;

          const fromPt = data.points[seg.from];
          const toPt = data.points[seg.to];
          const segColor = seg.color || routeColor;
          const isNew = newSegments.has(i);

          // Animate new segments drawing in
          const drawProgress = isNew
            ? interpolate(
                frame,
                [phaseWindow.start, phaseWindow.start + sec(1)],
                [0, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.out(Easing.cubic),
                }
              )
            : 1;

          const lineOpacity = isNew
            ? fadeIn(frame, phaseWindow.start, sec(0.3))
            : 1;

          return (
            <Line
              key={`seg-${i}`}
              from={fromPt.coordinates}
              to={toPt.coordinates}
              stroke={segColor}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray={seg.dashed ? "8 6" : undefined}
              style={{
                opacity: lineOpacity,
                strokeDashoffset: seg.dashed
                  ? undefined
                  : `${(1 - drawProgress) * 500}`,
              }}
            />
          );
        })}

        {/* ── Points ──────────────────────────────────────────────── */}
        {data.points.map((pt, i) => {
          if (!allActivePoints.has(i)) return null;

          // Find which phase first activated this point
          let activatedPhase = 0;
          for (let p = 0; p <= currentPhaseIdx; p++) {
            if (data.phases[p].activePoints.includes(i)) {
              activatedPhase = p;
              break;
            }
          }
          const ptWindow = getPhaseWindow(data.phases, activatedPhase);
          const ptColor = pt.color || routeColor;
          const ptOpacity = fadeIn(frame, ptWindow.start, sec(0.4));

          // Pulse animation for newly appearing points
          const isNewPoint =
            activatedPhase === currentPhaseIdx;
          const pulseScale = isNewPoint
            ? interpolate(
                frame,
                [
                  ptWindow.start,
                  ptWindow.start + sec(0.3),
                  ptWindow.start + sec(0.5),
                ],
                [0, 1.3, 1],
                {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                }
              )
            : 1;

          return (
            <Marker key={`pt-${i}`} coordinates={pt.coordinates}>
              {/* Outer glow */}
              <circle
                r={12 * pulseScale}
                fill={`${ptColor}30`}
                style={{ opacity: ptOpacity }}
              />
              {/* Inner dot */}
              <circle
                r={6}
                fill={ptColor}
                stroke={dark.bg.map}
                strokeWidth={2}
                style={{ opacity: ptOpacity }}
              />
              {/* Label */}
              {pt.label && (
                <text
                  textAnchor="middle"
                  y={-18}
                  style={{
                    fontSize: 16,
                    fontFamily: fonts.heading,
                    fontWeight: 600,
                    fill: dark.text.primary,
                    opacity: ptOpacity,
                  }}
                >
                  {pt.label}
                </text>
              )}
              {pt.sublabel && (
                <text
                  textAnchor="middle"
                  y={-4}
                  style={{
                    fontSize: 11,
                    fontFamily: fonts.body,
                    fill: dark.text.muted,
                    opacity: ptOpacity,
                  }}
                >
                  {pt.sublabel}
                </text>
              )}
            </Marker>
          );
        })}
      </ComposableMap>

      {/* ── Title ──────────────────────────────────────────────────── */}
      <FadeIn startFrame={0} direction="up" distance={20}>
        <div
          style={{
            position: "absolute",
            top: layout.safeArea.top,
            left: layout.safeArea.left,
          }}
        >
          <div
            style={{
              fontSize: fontSizes.h2,
              fontWeight: 600,
              color: dark.text.primary,
              fontFamily: fonts.heading,
            }}
          >
            {data.title}
          </div>
          {data.subtitle && (
            <div
              style={{
                fontSize: fontSizes.body,
                color: dark.text.muted,
                marginTop: 6,
              }}
            >
              {data.subtitle}
            </div>
          )}
        </div>
      </FadeIn>

      {/* ── Phase title overlay ────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: layout.safeArea.bottom + 40,
          left: layout.safeArea.left,
          right: layout.safeArea.right,
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: fadeIn(frame, phaseWindow.start, sec(0.4)),
        }}
      >
        <div
          style={{
            width: 4,
            height: 48,
            backgroundColor: routeColor,
            borderRadius: 2,
          }}
        />
        <div>
          <div
            style={{
              fontSize: fontSizes.h3,
              fontWeight: 600,
              color: dark.text.primary,
            }}
          >
            {currentPhase.title}
          </div>
          {currentPhase.subtitle && (
            <div
              style={{
                fontSize: fontSizes.caption,
                color: dark.text.muted,
                marginTop: 4,
              }}
            >
              {currentPhase.subtitle}
            </div>
          )}
        </div>
      </div>

      {/* ── Episode label ──────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: layout.safeArea.bottom,
          left: layout.safeArea.left,
          fontSize: fontSizes.label,
          color: dark.text.muted,
          letterSpacing: 2,
          textTransform: "uppercase",
          opacity: fadeIn(frame, 0, sec(1)),
        }}
      >
        {data.episode}
      </div>

      {/* ── Source ─────────────────────────────────────────────────── */}
      {data.source && (
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom,
            right: layout.safeArea.right,
            fontSize: fontSizes.small,
            color: dark.text.muted,
            opacity: fadeIn(frame, sec(2), sec(0.5)),
          }}
        >
          Source: {data.source}
        </div>
      )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
