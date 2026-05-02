/**
 * RouteAnimation — animated trade/supply chain routes on a world map.
 *
 * Migrated from react-simple-maps to Mapbox GL + deck.gl.
 * Routes render as 3D great-circle arcs (ArcLayer), points as glowing
 * markers (ScatterplotLayer), labels as projected HTML overlays.
 *
 * Data schema preserved — RoutePoint, RouteSegment, RoutePhase,
 * RouteAnimationData all unchanged. New optional `camera` field on
 * RoutePhase for full Mapbox camera control (backward-compatible).
 */

import React, { useMemo, useRef } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { Marker } from "react-map-gl/mapbox";
import { ArcLayer, ScatterplotLayer } from "@deck.gl/layers";
import {
  palette,
  fonts,
  fontSizes,
  layout,
  sec,
  light,
  shadows,
  contentArea,
  cardPadding,
  textMaxWidth,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  exitFade,
  scaleIn,
  pulse,
  CLAMP,
  CLAMP_CUBIC,
  CLAMP_CUBIC_INOUT,
} from "../../utils/animation";
import { hexToRgba, scaleToZoom, interpolateCamera } from "../../utils/mapUtils";
import type { CameraState } from "../../utils/mapUtils";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { Background } from "../../components/Background";
import { MapGL } from "../../components/MapGL";
import { FadeIn } from "../../components/FadeIn";
import type { RouteAnimationData, RoutePhase } from "./types";

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

// ── Camera conversion ───────────────────────────────────────────────────────

function phaseToCamera(
  phase: RoutePhase,
  defaults: { center?: [number, number]; scale?: number }
): CameraState {
  // New camera field takes priority (full Mapbox camera control)
  if (phase.camera) {
    return {
      longitude: phase.camera.longitude,
      latitude: phase.camera.latitude,
      zoom: phase.camera.zoom,
      pitch: phase.camera.pitch ?? 35,
      bearing: phase.camera.bearing ?? 0,
    };
  }

  // Legacy center/scale fallback
  const center = phase.center || defaults.center || [60, 25];
  const scale = phase.scale || defaults.scale || 200;
  return {
    longitude: center[0],
    latitude: center[1],
    zoom: scaleToZoom(scale),
    pitch: 35,
    bearing: 0,
  };
}

// ── Main component ──────────────────────────────────────────────────────────

export const RouteAnimation: React.FC<{ data: RouteAnimationData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });
  const routeColor = data.routeColor || palette.amber;

  const currentPhaseIdx = getCurrentPhaseIndex(data.phases, frame);
  const currentPhase = data.phases[currentPhaseIdx];
  const phaseWindow = getPhaseWindow(data.phases, currentPhaseIdx);

  // Collect all active segments/points up to and including current phase
  const allActiveSegments = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i <= currentPhaseIdx; i++) {
      data.phases[i].activeSegments.forEach((s) => set.add(s));
    }
    return set;
  }, [data.phases, currentPhaseIdx]);

  const allActivePoints = useMemo(() => {
    const set = new Set<number>();
    for (let i = 0; i <= currentPhaseIdx; i++) {
      data.phases[i].activePoints.forEach((p) => set.add(p));
    }
    return set;
  }, [data.phases, currentPhaseIdx]);

  // Segments newly added in this phase (for animation)
  const newSegments = new Set(data.phases[currentPhaseIdx].activeSegments);

  // ── Camera ────────────────────────────────────────────────────────────

  const currentCamera = phaseToCamera(currentPhase, data);

  let camera: CameraState;
  if (currentPhaseIdx > 0) {
    const prevCamera = phaseToCamera(data.phases[currentPhaseIdx - 1], data);
    const camT = interpolate(
      frame,
      [phaseWindow.start, phaseWindow.start + sec(1.5)],
      [0, 1],
      CLAMP_CUBIC_INOUT
    );
    camera = interpolateCamera(prevCamera, currentCamera, camT);
  } else {
    camera = currentCamera;
  }

  // Subtle bearing drift
  const bearingDrift = interpolate(frame, [0, durationInFrames], [0, 6], CLAMP);

  // ── deck.gl layers ────────────────────────────────────────────────────

  const arcData = useMemo(() => {
    const arcs: Array<{
      from: [number, number];
      to: [number, number];
      color: string;
      isNew: boolean;
      dashed: boolean;
      index: number;
    }> = [];

    data.segments.forEach((seg, i) => {
      if (!allActiveSegments.has(i)) return;
      const fromPt = data.points[seg.from];
      const toPt = data.points[seg.to];
      arcs.push({
        from: fromPt.coordinates,
        to: toPt.coordinates,
        color: seg.color || routeColor,
        isNew: newSegments.has(i),
        dashed: !!seg.dashed,
        index: i,
      });
    });

    return arcs;
  }, [data.segments, data.points, allActiveSegments, newSegments, routeColor]);

  // Animate new arcs: fade in + grow width
  const newArcProgress = interpolate(
    frame,
    [phaseWindow.start, phaseWindow.start + sec(1)],
    [0, 1],
    CLAMP_CUBIC
  );

  const arcLayer = new ArcLayer({
    id: "trade-routes",
    data: arcData,
    getSourcePosition: (d: any) => d.from,
    getTargetPosition: (d: any) => d.to,
    getSourceColor: (d: any) => {
      const alpha = d.isNew ? Math.round(newArcProgress * 200) : 200;
      return hexToRgba(d.color, alpha);
    },
    getTargetColor: (d: any) => {
      const alpha = d.isNew ? Math.round(newArcProgress * 200) : 200;
      return hexToRgba(d.color, alpha);
    },
    getWidth: (d: any) => {
      const base = d.dashed ? 1.5 : 3;
      return d.isNew ? base * newArcProgress : base;
    },
    greatCircle: true,
    getHeight: 0.3,
    widthUnits: "pixels" as const,
    updateTriggers: {
      getSourceColor: [newArcProgress],
      getTargetColor: [newArcProgress],
      getWidth: [newArcProgress],
    },
  });

  // Point markers via ScatterplotLayer (for the glow ring)
  const pointData = useMemo(() => {
    return data.points
      .map((pt, i) => ({ ...pt, index: i }))
      .filter((pt) => allActivePoints.has(pt.index));
  }, [data.points, allActivePoints]);

  const scatterLayer = new ScatterplotLayer({
    id: "point-glow",
    data: pointData,
    getPosition: (d: any) => d.coordinates,
    getRadius: 14,
    getFillColor: (d: any) => hexToRgba(d.color || routeColor, 60),
    radiusUnits: "pixels" as const,
    updateTriggers: {
      getFillColor: [routeColor],
    },
  });

  const layers = [arcLayer, scatterLayer];

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Background variant="light" tint={data.backgroundTint}>
      <AbsoluteFill style={compStyle}>
        <MapGL
          longitude={camera.longitude}
          latitude={camera.latitude}
          zoom={camera.zoom}
          pitch={camera.pitch}
          bearing={camera.bearing + bearingDrift}
          layers={layers}
        >
          {/* Point labels — rendered as Markers for proper geo projection */}
          {pointData.map((pt) => {
            // Find which phase first activated this point
            let activatedPhase = 0;
            for (let p = 0; p <= currentPhaseIdx; p++) {
              if (data.phases[p].activePoints.includes(pt.index)) {
                activatedPhase = p;
                break;
              }
            }
            const ptWindow = getPhaseWindow(data.phases, activatedPhase);
            const ptColor = pt.color || routeColor;
            const ptOpacity = fadeIn(frame, ptWindow.start, sec(0.4));
            const ptScale = scaleIn(frame, ptWindow.start, sec(0.5));

            const isNewPoint = activatedPhase === currentPhaseIdx;
            const pulseScale = isNewPoint
              ? pulse(frame, ptWindow.start + sec(0.5), sec(0.4), 1.15)
              : 1;

            const contentOpacity = Math.min(
              ptOpacity,
              exitFade(frame, durationInFrames)
            );
            const combinedScale = ptScale * pulseScale;

            return (
              <Marker
                key={`pt-${pt.index}`}
                longitude={pt.coordinates[0]}
                latitude={pt.coordinates[1]}
                anchor="center"
              >
                <div
                  style={{
                    opacity: contentOpacity,
                    transform: `scale(${combinedScale})`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  }}
                >
                  {/* Inner dot */}
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: ptColor,
                      border: `2px solid ${light.bg.map}`,
                      boxShadow: `0 0 8px ${ptColor}80`,
                    }}
                  />
                  {/* Label */}
                  {pt.label && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "100%",
                        marginBottom: layout.spacing.xs,
                        fontSize: 16,
                        fontFamily: fonts.heading,
                        fontWeight: 600,
                        color: light.text.primary,
                        whiteSpace: "nowrap",
                        textShadow: shadows.textLift,
                      }}
                    >
                      {pt.label}
                    </div>
                  )}
                  {pt.sublabel && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        marginTop: layout.spacing.xs,
                        fontSize: 11,
                        fontFamily: fonts.body,
                        color: light.text.muted,
                        whiteSpace: "nowrap",
                        textShadow: shadows.textLift,
                      }}
                    >
                      {pt.sublabel}
                    </div>
                  )}
                </div>
              </Marker>
            );
          })}
        </MapGL>

        {/* Title */}
        <FadeIn startFrame={0} direction="up" distance={20}>
          <div
            style={{
              position: "absolute",
              top: layout.safeArea.top,
              left: layout.safeArea.left,
              opacity: exitFade(frame, durationInFrames),
            }}
          >
            <div
              style={{
                fontSize: fontSizes.h2,
                fontWeight: 600,
                color: light.text.primary,
                fontFamily: fonts.heading,
                textShadow: shadows.textLift,
              }}
            >
              {data.title}
            </div>
            {data.subtitle && (
              <div
                style={{
                  fontSize: fontSizes.body,
                  color: light.text.muted,
                  marginTop: layout.spacing.xs,
                  textShadow: shadows.textLift,
                }}
              >
                {data.subtitle}
              </div>
            )}
          </div>
        </FadeIn>

        {/* Phase title overlay */}
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom + layout.spacing.md,
            left: layout.safeArea.left,
            right: layout.safeArea.right,
            display: "flex",
            alignItems: "center",
            gap: layout.spacing.sm,
            opacity: Math.min(
              fadeIn(frame, phaseWindow.start, sec(0.4)),
              exitFade(frame, durationInFrames)
            ),
            transform: `translateY(${slideIn(frame, phaseWindow.start, 20, sec(0.5))}px)`,
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
                color: light.text.primary,
                textShadow: shadows.textLift,
              }}
            >
              {currentPhase.title}
            </div>
            {currentPhase.subtitle && (
              <div
                style={{
                  fontSize: fontSizes.caption,
                  color: light.text.muted,
                  marginTop: layout.spacing.xs,
                  textShadow: shadows.textLift,
                }}
              >
                {currentPhase.subtitle}
              </div>
            )}
          </div>
        </div>

        {/* Episode label */}
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom,
            left: layout.safeArea.left,
            fontSize: fontSizes.label,
            color: light.text.muted,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: Math.min(
              fadeIn(frame, 0, sec(1)),
              exitFade(frame, durationInFrames)
            ),
            transform: `translateY(${slideIn(frame, 0, 10, sec(0.8))}px)`,
            textShadow: shadows.textLift,
          }}
        >
          {data.episode}
        </div>

        {/* Source */}
        {data.source && (
          <div
            style={{
              position: "absolute",
              bottom: layout.safeArea.bottom,
              right: layout.safeArea.right,
              fontSize: fontSizes.small,
              color: light.text.muted,
              opacity: Math.min(
                fadeIn(frame, sec(2), sec(0.5)),
                exitFade(frame, durationInFrames)
              ),
              textShadow: shadows.textLift,
            }}
          >
            Source: {data.source}
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};
