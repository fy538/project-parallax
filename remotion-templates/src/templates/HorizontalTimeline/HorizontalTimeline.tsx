/**
 * HorizontalTimeline — cinematic horizontal camera track through time.
 *
 * Renders events along a horizontal axis with a glowing spine. A virtual camera
 * tracks horizontally between events, with depth-of-field blur and scale hierarchy
 * for focus isolation. Matches the Vox/Johnny Harris documentary standard.
 *
 * Architecture:
 *   - Events distributed along a wide canvas (2-3× viewport width)
 *   - Glowing amber spine runs horizontally through the center
 *   - Event cards hang above/below the spine with elevation + accent edges
 *   - Camera tracks horizontally with eased motion, zoom per event
 *   - Unfocused events are dimmed, scaled down, and blurred
 *   - Final pullback reveals full timeline with connections
 *
 * Three modes:
 *   - "single": one spine, events alternate above/below
 *   - "dual": two parallel spines (era A top, era B bottom)
 *   - "morph": single spine, event content cross-fades between eras
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  interpolateColors,
} from "remotion";
import {
  fonts,
  fontSizes,
  layout,
  palette,
  sec,
  shadows,
  cardPresets,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  slideIn,
  exitFade,
  lockOnPulse,
  CLAMP,
  CLAMP_QUAD,
} from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import {
  useTimelineCamera,
  generateDefaultTimelineCameraPath,
} from "../../hooks/useTimelineCamera";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import type {
  HorizontalTimelineData,
  TimelineEventData,
  TimelineCameraStep,
} from "./types";

// ── Constants ──────────────────────────────────────────────────────────────

const CANVAS_WIDTH = layout.width;
const CANVAS_HEIGHT = layout.height;
/** Spacing between events on the horizontal axis */
const EVENT_SPACING = 480;
/** Horizontal padding before first and after last event */
const TIMELINE_PADDING = 400;
/** Spine Y position (vertical center of the timeline) */
const SPINE_Y = CANVAS_HEIGHT * 0.5;
/** Card width */
const CARD_WIDTH = 320;
/** Card height (varies by weight, this is base) */
const CARD_BASE_HEIGHT = 120;

// ── Spine glow component ───────────────────────────────────────────────────

const TimelineSpine: React.FC<{
  totalWidth: number;
  color: string;
  frame: number;
  mode: "light" | "dark";
}> = React.memo(({ totalWidth, color, frame, mode }) => {
  const theme = useThemeMode(mode);

  // Animated gradient pulse traveling along the spine — doubled speed
  // so the pulse is visibly traveling within a single timeline beat (~32s cycle).
  const pulseOffset = (frame * 1.0) % totalWidth;

  return (
    <div
      style={{
        position: "absolute",
        top: SPINE_Y - 2,
        left: 0,
        width: totalWidth,
        height: 4,
      }}
    >
      {/* Base spine line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: `${color}40`,
          borderRadius: 2,
        }}
      />
      {/* Glow layer */}
      <div
        style={{
          position: "absolute",
          top: -4,
          left: 0,
          width: "100%",
          height: 12,
          background: `linear-gradient(90deg, transparent, ${color}30, transparent)`,
          backgroundSize: `${totalWidth * 0.3}px 100%`,
          backgroundPosition: `${pulseOffset}px 0`,
          borderRadius: 6,
        }}
      />
      {/* Bright core pulse */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 4,
          background: `linear-gradient(90deg, transparent 0%, ${color}80 ${(pulseOffset / totalWidth) * 100}%, ${color} ${((pulseOffset + 100) / totalWidth) * 100}%, transparent ${((pulseOffset + 300) / totalWidth) * 100}%)`,
          borderRadius: 2,
        }}
      />
    </div>
  );
});

// ── Year marker on the spine ───────────────────────────────────────────────

const YearMarker: React.FC<{
  x: number;
  year: string;
  color: string;
  weight: number;
  dim: number;
  scale: number;
  blur: number;
  frame: number;
  revealFrame: number;
  mode: "light" | "dark";
  position: "above" | "below";
}> = React.memo(({ x, year, color, weight, dim, scale, blur, frame, revealFrame, mode, position }) => {
  const theme = useThemeMode(mode);
  const revealOpacity = fadeIn(frame, revealFrame, sec(0.4));
  const markerSize = 10 + weight * 4; // 14, 18, 22px based on weight
  // Brand lock-on pulse on first reveal — sells discovery
  const lockScale = lockOnPulse(frame, revealFrame, layout.fps);

  return (
    <div
      style={{
        position: "absolute",
        left: x - markerSize / 2,
        top: SPINE_Y - markerSize / 2,
        opacity: revealOpacity * (1 - dim * 0.75),
        transform: `scale(${scale * lockScale})`,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        transition: "filter 0.1s",
        willChange: "transform, opacity, filter",
      }}
    >
      {/* Marker dot */}
      <div
        style={{
          width: markerSize,
          height: markerSize,
          borderRadius: "50%",
          backgroundColor: color,
          boxShadow: `0 0 ${8 + weight * 4}px ${color}60, 0 0 ${16 + weight * 6}px ${color}25`,
        }}
      />
      {/* Year label */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          ...(position === "above"
            ? { bottom: markerSize + 8 }
            : { top: markerSize + 8 }),
          fontSize: fontSizes.label,
          fontFamily: fonts.mono,
          fontWeight: 600,
          color,
          whiteSpace: "nowrap",
          textShadow: shadows.textLift,
        }}
      >
        {year}
      </div>
    </div>
  );
});

// ── Event card ─────────────────────────────────────────────────────────────

const EventCard: React.FC<{
  event: TimelineEventData;
  x: number;
  position: "above" | "below";
  color: string;
  dim: number;
  scale: number;
  blur: number;
  frame: number;
  revealFrame: number;
  isFocused: boolean;
  mode: "light" | "dark";
}> = React.memo(({ event, x, position, color, dim, scale, blur, frame, revealFrame, isFocused, mode }) => {
  const theme = useThemeMode(mode);
  const revealOpacity = fadeIn(frame, revealFrame, sec(0.5));
  const slideOffset = slideIn(frame, revealFrame, 20, sec(0.5));

  const cardHeight = CARD_BASE_HEIGHT + (event.weight === 3 ? 40 : event.weight === 2 ? 20 : 0);
  const accentColor = event.color || color;

  // Card positioned above or below spine
  const cardTop = position === "above"
    ? SPINE_Y - 40 - cardHeight
    : SPINE_Y + 40;

  return (
    <div
      style={{
        position: "absolute",
        left: x - CARD_WIDTH / 2,
        top: cardTop,
        width: CARD_WIDTH,
        height: cardHeight,
        opacity: revealOpacity * (1 - dim * 0.75),
        transform: `scale(${scale}) translateY(${position === "above" ? slideOffset : -slideOffset}px)`,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        willChange: "transform, opacity, filter",
      }}
    >
      {/* Connector line from card to spine */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          width: 2,
          backgroundColor: `${accentColor}50`,
          ...(position === "above"
            ? { bottom: -40, height: 40 }
            : { top: -40, height: 40 }),
          transform: "translateX(-50%)",
        }}
      />

      {/* Card body */}
      <div
        style={{
          width: "100%",
          height: "100%",
          ...cardPresets.accentEdge(accentColor, mode === "dark"),
          // Enhanced shadow when focused
          boxShadow: isFocused
            ? `0 8px 32px rgba(0,0,0,0.25), 0 0 20px ${accentColor}20`
            : `0 4px 16px rgba(0,0,0,0.12)`,
        }}
      >
        {/* Title */}
        <div
          style={{
            fontSize: isFocused ? fontSizes.body + 2 : fontSizes.body,
            fontWeight: 600,
            color: theme.text.primary,
            lineHeight: 1.3,
            marginBottom: event.description ? 8 : 0,
            textShadow: shadows.textLift,
          }}
        >
          {event.title}
        </div>

        {/* Description — only visible when focused */}
        {event.description && (
          <div
            style={{
              fontSize: fontSizes.caption,
              color: theme.text.secondary,
              lineHeight: 1.4,
              opacity: isFocused ? 1 : 0.4,
              textShadow: shadows.textLift,
            }}
          >
            {event.description}
          </div>
        )}
      </div>
    </div>
  );
});

// ── Connection line (dual mode, shown on pullback) ─────────────────────────

const ConnectionLine: React.FC<{
  x: number;
  label?: string;
  color: string;
  opacity: number;
  mode: "light" | "dark";
}> = React.memo(({ x, label, color, opacity, mode }) => {
  const theme = useThemeMode(mode);

  return (
    <div
      style={{
        position: "absolute",
        left: x - 1,
        top: SPINE_Y - 80,
        width: 2,
        height: 160,
        opacity,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          background: `linear-gradient(180deg, ${color}60, ${color}, ${color}60)`,
          borderRadius: 1,
        }}
      />
      {label && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 8,
            transform: "translateY(-50%)",
            fontSize: fontSizes.meta,
            fontFamily: fonts.mono,
            color: theme.text.accent,
            whiteSpace: "nowrap",
            textShadow: shadows.textLift,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
});

// ── Main component ─────────────────────────────────────────────────────────

export const HorizontalTimeline: React.FC<{
  data: HorizontalTimelineData;
}> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const mode = (data.backgroundVariant || "light") as "light" | "dark";
  const theme = useThemeMode(mode);
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);

  const eraAColor = data.eraAColor || palette.gold;
  const eraBColor = data.eraBColor || palette.rust;

  // ── Compute event list and positions ─────────────────────────────────
  const eventData = useMemo((): {
    events: Array<{ event: TimelineEventData; position: "above" | "below" }>;
    positions: number[];
    totalWidth: number;
  } => {
    if (data.mode === "single" && data.events) {
      const events = data.events.map((e, i) => ({
        event: e,
        position: (i % 2 === 0 ? "above" : "below") as "above" | "below",
      }));
      const positions = data.events.map(
        (_, i) => TIMELINE_PADDING + i * EVENT_SPACING
      );
      const totalWidth =
        TIMELINE_PADDING * 2 + (data.events.length - 1) * EVENT_SPACING;
      return { events, positions, totalWidth };
    }

    if (data.mode === "dual" && data.pairs) {
      // Dual mode: era A events above, era B below, same x-positions
      const events: Array<{ event: TimelineEventData; position: "above" | "below" }> = [];
      const positions: number[] = [];

      data.pairs.forEach((pair, i) => {
        const x = TIMELINE_PADDING + i * EVENT_SPACING;
        // Era A above
        events.push({ event: pair.eraA, position: "above" });
        positions.push(x);
        // Era B below (same x, handled by rendering both)
        events.push({ event: pair.eraB, position: "below" });
        positions.push(x);
      });

      const totalWidth =
        TIMELINE_PADDING * 2 + (data.pairs.length - 1) * EVENT_SPACING;
      return { events, positions, totalWidth };
    }

    if (data.mode === "morph" && data.morphEvents) {
      // Morph: single spine, events alternate position
      const events = data.morphEvents.map((me, i) => ({
        event: {
          year: me.eraAYear,
          title: me.eraATitle,
          description: me.eraADescription,
          weight: me.weight,
        } as TimelineEventData,
        position: (i % 2 === 0 ? "above" : "below") as "above" | "below",
      }));
      const positions = data.morphEvents.map(
        (_, i) => TIMELINE_PADDING + i * EVENT_SPACING
      );
      const totalWidth =
        TIMELINE_PADDING * 2 + (data.morphEvents.length - 1) * EVENT_SPACING;
      return { events, positions, totalWidth };
    }

    // Fallback
    return { events: [], positions: [], totalWidth: CANVAS_WIDTH };
  }, [data]);

  // ── Camera path ──────────────────────────────────────────────────────
  const cameraPath = useMemo((): TimelineCameraStep[] => {
    if (data.cameraPath) return data.cameraPath;

    // Auto-generate: visit each unique x-position
    if (data.mode === "dual" && data.pairs) {
      // For dual, camera focuses on pair indices (every other event)
      return generateDefaultTimelineCameraPath(data.pairs.length, {
        secondsPerEvent: 2.5,
        zoomLevel: 1.3,
        pullbackZoom: 0.6,
      });
    }

    const eventCount =
      data.mode === "single"
        ? (data.events?.length ?? 0)
        : (data.morphEvents?.length ?? 0);

    return generateDefaultTimelineCameraPath(eventCount, {
      secondsPerEvent: 2.5,
      zoomLevel: 1.4,
      pullbackZoom: 0.65,
    });
  }, [data]);

  // For dual mode, event positions for the camera are the unique x-positions (one per pair)
  const cameraPositions = useMemo(() => {
    if (data.mode === "dual" && data.pairs) {
      return data.pairs.map((_, i) => TIMELINE_PADDING + i * EVENT_SPACING);
    }
    return eventData.positions;
  }, [data, eventData.positions]);

  // ── Camera hook ──────────────────────────────────────────────────────
  const camera = useTimelineCamera({
    eventPositions: cameraPositions,
    cameraPath,
    canvasWidth: CANVAS_WIDTH,
    canvasHeight: CANVAS_HEIGHT,
    totalTimelineWidth: eventData.totalWidth,
    spineY: SPINE_Y,
    transitionSec: 0.8,
  });

  // ── Exit fade ────────────────────────────────────────────────────────
  const exitOpacity = exitFade(frame, durationInFrames, 15);

  // ── Morph state (for morph mode) ─────────────────────────────────────
  const morphProgress = useMemo(() => {
    if (data.mode !== "morph") return 0;
    // Morph happens in the second half of the timeline
    const totalSteps = cameraPath.length;
    const morphStartStep = Math.floor(totalSteps * 0.5);
    const morphEndStep = Math.floor(totalSteps * 0.75);

    if (camera.stepIndex < morphStartStep) return 0;
    if (camera.stepIndex >= morphEndStep) return 1;

    return interpolate(
      camera.stepIndex - morphStartStep,
      [0, morphEndStep - morphStartStep],
      [0, 1],
      { ...{ extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const } }
    );
  }, [data.mode, cameraPath.length, camera.stepIndex]);

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <Background
      variant={mode}
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={{ ...compStyle, opacity: exitOpacity }}>
        {/* Brand strips */}
        <HeaderStrip mode={mode} metadata={data.episode} />
        <FooterStrip mode={mode} />

        {/* Title */}
        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={mode}
          safeAreaTier="generous"
        />

        {/* Camera viewport — contains all timeline content */}
        <div style={camera.viewportStyle}>
          <div style={camera.contentStyle}>
            {/* ── Glowing spine ─────────────────────────────────────── */}
            <TimelineSpine
              totalWidth={eventData.totalWidth}
              color={eraAColor}
              frame={frame}
              mode={mode}
            />

            {/* ── Dual mode: second spine for era B ─────────────────── */}
            {data.mode === "dual" && (
              <div
                style={{
                  position: "absolute",
                  top: SPINE_Y + 80 - 2,
                  left: 0,
                  width: eventData.totalWidth,
                  height: 4,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: `${eraBColor}40`,
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: -4,
                    left: 0,
                    width: "100%",
                    height: 12,
                    background: `linear-gradient(90deg, transparent, ${eraBColor}25, transparent)`,
                    borderRadius: 6,
                  }}
                />
              </div>
            )}

            {/* ── Event markers and cards ───────────────────────────── */}
            {data.mode === "single" && data.events && (
              <>
                {data.events.map((event, i) => {
                  const x = eventData.positions[i];
                  const eventDim = camera.getEventDim(i);
                  const eventScale = camera.getEventScale(i);
                  const eventBlur = camera.getEventBlur(i);
                  const isFocused = camera.focusIndex === i;
                  const position = (i % 2 === 0 ? "above" : "below") as "above" | "below";
                  const revealFrame = sec(0.5) + i * sec(0.15);

                  return (
                    <React.Fragment key={`single-${i}`}>
                      <YearMarker
                        x={x}
                        year={event.year}
                        color={event.color || eraAColor}
                        weight={event.weight || 1}
                        dim={eventDim}
                        scale={eventScale}
                        blur={eventBlur}
                        frame={frame}
                        revealFrame={revealFrame}
                        mode={mode}
                        position={position}
                      />
                      <EventCard
                        event={event}
                        x={x}
                        position={position}
                        color={eraAColor}
                        dim={eventDim}
                        scale={eventScale}
                        blur={eventBlur}
                        frame={frame}
                        revealFrame={revealFrame}
                        isFocused={isFocused}
                        mode={mode}
                      />
                    </React.Fragment>
                  );
                })}
              </>
            )}

            {/* ── Dual mode: paired events ─────────────────────────── */}
            {data.mode === "dual" && data.pairs && (
              <>
                {data.pairs.map((pair, i) => {
                  const x = TIMELINE_PADDING + i * EVENT_SPACING;
                  const eventDim = camera.getEventDim(i);
                  const eventScale = camera.getEventScale(i);
                  const eventBlur = camera.getEventBlur(i);
                  const isFocused = camera.focusIndex === i;
                  const revealFrame = sec(0.5) + i * sec(0.15);

                  return (
                    <React.Fragment key={`dual-${i}`}>
                      {/* Era A marker + card (above) */}
                      <YearMarker
                        x={x}
                        year={pair.eraA.year}
                        color={pair.eraA.color || eraAColor}
                        weight={pair.eraA.weight || 1}
                        dim={eventDim}
                        scale={eventScale}
                        blur={eventBlur}
                        frame={frame}
                        revealFrame={revealFrame}
                        mode={mode}
                        position="above"
                      />
                      <EventCard
                        event={pair.eraA}
                        x={x}
                        position="above"
                        color={eraAColor}
                        dim={eventDim}
                        scale={eventScale}
                        blur={eventBlur}
                        frame={frame}
                        revealFrame={revealFrame}
                        isFocused={isFocused}
                        mode={mode}
                      />

                      {/* Era B marker + card (below, on second spine) */}
                      <div
                        style={{
                          position: "absolute",
                          left: x - 7,
                          top: SPINE_Y + 80 - 7,
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          backgroundColor: pair.eraB.color || eraBColor,
                          boxShadow: `0 0 10px ${pair.eraB.color || eraBColor}50`,
                          opacity: fadeIn(frame, revealFrame, sec(0.4)) * (1 - eventDim * 0.75),
                          transform: `scale(${eventScale})`,
                          filter: eventBlur > 0 ? `blur(${eventBlur}px)` : undefined,
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: x - CARD_WIDTH / 2,
                          top: SPINE_Y + 80 + 30,
                          width: CARD_WIDTH,
                          opacity: fadeIn(frame, revealFrame, sec(0.5)) * (1 - eventDim * 0.75),
                          transform: `scale(${eventScale}) translateY(${-slideIn(frame, revealFrame, 20, sec(0.5))}px)`,
                          filter: eventBlur > 0 ? `blur(${eventBlur}px)` : undefined,
                          willChange: "transform, opacity, filter",
                        }}
                      >
                        {/* Era B year label */}
                        <div
                          style={{
                            fontSize: fontSizes.label,
                            fontFamily: fonts.mono,
                            fontWeight: 600,
                            color: pair.eraB.color || eraBColor,
                            marginBottom: 6,
                            textShadow: shadows.textLift,
                          }}
                        >
                          {pair.eraB.year}
                        </div>
                        {/* Era B card */}
                        <div
                          style={{
                            ...cardPresets.accentEdge(pair.eraB.color || eraBColor, mode === "dark"),
                            boxShadow: isFocused
                              ? `0 8px 32px rgba(0,0,0,0.25), 0 0 20px ${eraBColor}20`
                              : `0 4px 16px rgba(0,0,0,0.12)`,
                          }}
                        >
                          <div
                            style={{
                              fontSize: isFocused ? fontSizes.body + 2 : fontSizes.body,
                              fontWeight: 600,
                              color: theme.text.primary,
                              lineHeight: 1.3,
                              marginBottom: pair.eraB.description ? 8 : 0,
                              textShadow: shadows.textLift,
                            }}
                          >
                            {pair.eraB.title}
                          </div>
                          {pair.eraB.description && (
                            <div
                              style={{
                                fontSize: fontSizes.caption,
                                color: theme.text.secondary,
                                lineHeight: 1.4,
                                opacity: isFocused ? 1 : 0.4,
                                textShadow: shadows.textLift,
                              }}
                            >
                              {pair.eraB.description}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Connection line (visible on pullback) */}
                      {pair.connection && (
                        <ConnectionLine
                          x={x}
                          label={pair.connection}
                          color={theme.text.muted}
                          opacity={camera.focusIndex === -1 ? fadeIn(frame, sec(0.3), sec(0.5)) : 0}
                          mode={mode}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </>
            )}

            {/* ── Morph mode: events with cross-fade ───────────────── */}
            {data.mode === "morph" && data.morphEvents && (
              <>
                {data.morphEvents.map((morphEvent, i) => {
                  const x = eventData.positions[i];
                  const eventDim = camera.getEventDim(i);
                  const eventScale = camera.getEventScale(i);
                  const eventBlur = camera.getEventBlur(i);
                  const isFocused = camera.focusIndex === i;
                  const position = (i % 2 === 0 ? "above" : "below") as "above" | "below";
                  const revealFrame = sec(0.5) + i * sec(0.15);

                  // Morph color
                  const morphColor = interpolateColors(
                    morphProgress,
                    [0, 1],
                    [eraAColor, eraBColor]
                  );

                  // Text opacity for cross-fade
                  const eraATextOpacity = 1 - morphProgress;
                  const eraBTextOpacity = morphProgress;

                  return (
                    <React.Fragment key={`morph-${i}`}>
                      <YearMarker
                        x={x}
                        year={morphProgress < 0.5 ? morphEvent.eraAYear : morphEvent.eraBYear}
                        color={morphColor}
                        weight={morphEvent.weight || 1}
                        dim={eventDim}
                        scale={eventScale}
                        blur={eventBlur}
                        frame={frame}
                        revealFrame={revealFrame}
                        mode={mode}
                        position={position}
                      />

                      {/* Morph card — cross-fades content */}
                      <div
                        style={{
                          position: "absolute",
                          left: x - CARD_WIDTH / 2,
                          top: position === "above"
                            ? SPINE_Y - 40 - CARD_BASE_HEIGHT
                            : SPINE_Y + 40,
                          width: CARD_WIDTH,
                          height: CARD_BASE_HEIGHT,
                          opacity: fadeIn(frame, revealFrame, sec(0.5)) * (1 - eventDim * 0.75),
                          transform: `scale(${eventScale})`,
                          filter: eventBlur > 0 ? `blur(${eventBlur}px)` : undefined,
                          willChange: "transform, opacity, filter",
                        }}
                      >
                        {/* Connector */}
                        <div
                          style={{
                            position: "absolute",
                            left: "50%",
                            width: 2,
                            backgroundColor: `${morphColor}50`,
                            ...(position === "above"
                              ? { bottom: -40, height: 40 }
                              : { top: -40, height: 40 }),
                            transform: "translateX(-50%)",
                          }}
                        />

                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            ...cardPresets.accentEdge(morphColor, mode === "dark"),
                            boxShadow: isFocused
                              ? `0 8px 32px rgba(0,0,0,0.25)`
                              : `0 4px 16px rgba(0,0,0,0.12)`,
                            position: "relative",
                          }}
                        >
                          {/* Era A content */}
                          <div style={{ opacity: eraATextOpacity, position: "absolute", top: 16, left: 16, right: 16 }}>
                            <div
                              style={{
                                fontSize: fontSizes.body,
                                fontWeight: 600,
                                color: theme.text.primary,
                                lineHeight: 1.3,
                                marginBottom: 8,
                                textShadow: shadows.textLift,
                              }}
                            >
                              {morphEvent.eraATitle}
                            </div>
                            {morphEvent.eraADescription && (
                              <div style={{ fontSize: fontSizes.caption, color: theme.text.secondary, lineHeight: 1.4 }}>
                                {morphEvent.eraADescription}
                              </div>
                            )}
                          </div>

                          {/* Era B content (overlaid, fading in) */}
                          <div style={{ opacity: eraBTextOpacity, position: "absolute", top: 16, left: 16, right: 16 }}>
                            <div
                              style={{
                                fontSize: fontSizes.body,
                                fontWeight: 600,
                                color: theme.text.primary,
                                lineHeight: 1.3,
                                marginBottom: 8,
                                textShadow: shadows.textLift,
                              }}
                            >
                              {morphEvent.eraBTitle}
                            </div>
                            {morphEvent.eraBDescription && (
                              <div style={{ fontSize: fontSizes.caption, color: theme.text.secondary, lineHeight: 1.4 }}>
                                {morphEvent.eraBDescription}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* ── Camera step label overlay ─────────────────────────────── */}
        {camera.currentLabel && (
          <div
            style={{
              position: "absolute",
              top: layout.safeAreaTier.generous.top,
              right: layout.safeAreaTier.generous.right,
              fontSize: fontSizes.label,
              fontFamily: fonts.mono,
              fontWeight: 600,
              color: theme.text.accent,
              letterSpacing: 1,
              textTransform: "uppercase",
              opacity: fadeIn(frame, 0, sec(0.5)),
              textShadow: shadows.textLift,
            }}
          >
            {camera.currentLabel}
          </div>
        )}

        {/* ── Dual mode era labels ──────────────────────────────────── */}
        {data.mode === "dual" && (
          <>
            {data.eraATitle && (
              <div
                style={{
                  position: "absolute",
                  top: layout.safeAreaTier.generous.top + 60,
                  left: layout.safeAreaTier.generous.left,
                  fontSize: fontSizes.label,
                  fontFamily: fonts.mono,
                  fontWeight: 600,
                  color: eraAColor,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  opacity: fadeIn(frame, sec(0.3), sec(0.5)),
                  textShadow: shadows.textLift,
                }}
              >
                {data.eraATitle}
              </div>
            )}
            {data.eraBTitle && (
              <div
                style={{
                  position: "absolute",
                  bottom: layout.safeAreaTier.generous.bottom + 60,
                  left: layout.safeAreaTier.generous.left,
                  fontSize: fontSizes.label,
                  fontFamily: fonts.mono,
                  fontWeight: 600,
                  color: eraBColor,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  opacity: fadeIn(frame, sec(0.4), sec(0.5)),
                  textShadow: shadows.textLift,
                }}
              >
                {data.eraBTitle}
              </div>
            )}
          </>
        )}

        {/* ── Morph era title (morphs between A and B) ──────────────── */}
        {data.mode === "morph" && (
          <div
            style={{
              position: "absolute",
              top: layout.safeAreaTier.generous.top + 60,
              left: layout.safeAreaTier.generous.left,
              fontSize: fontSizes.h3,
              fontFamily: fonts.heading,
              fontWeight: 600,
              color: interpolateColors(morphProgress, [0, 1], [eraAColor, eraBColor]),
              opacity: fadeIn(frame, sec(0.3), sec(0.5)),
              textShadow: shadows.textLift,
            }}
          >
            <span style={{ opacity: 1 - morphProgress }}>
              {data.morphEraATitle}
            </span>
            <span style={{ position: "absolute", top: 0, left: 0, opacity: morphProgress }}>
              {data.morphEraBTitle}
            </span>
          </div>
        )}

        {/* ── Episode label ─────────────────────────────────────────── */}
        {data.episode && (
          <div
            style={{
              position: "absolute",
              bottom: layout.safeAreaTier.generous.bottom,
              left: layout.safeAreaTier.generous.left,
              fontSize: fontSizes.label,
              color: theme.text.muted,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: fadeIn(frame, 0, sec(1)),
              transform: `translateY(${slideIn(frame, 0, 10, sec(0.8))}px)`,
            }}
          >
            {data.episode}
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};
