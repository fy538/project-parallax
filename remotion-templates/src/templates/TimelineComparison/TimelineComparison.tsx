/**
 * TimelineComparison — side-by-side historical vs. modern timeline.
 *
 * Left column shows historical events, right column shows modern parallels.
 * Events fade in sequentially. Optional connecting lines between paired events
 * highlight the structural parallel.
 *
 * EP01 use case: 1941 oil embargo → Pearl Harbor vs 2022 chip controls → ?
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { palette, light, semantic, fonts, fontSizes, layout, sec, contentArea, cardPadding, shadows } from "../../design/theme";
import { fadeIn, slideIn, stagger, exitFade, kenBurnsDrift, CLAMP_CUBIC, CLAMP_QUAD } from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { Background } from "../../components/Background";
import type { TimelineComparisonData, TimelineEvent } from "./types";

// ── Single event card ───────────────────────────────────────────────────────

const EventCard: React.FC<{
  event: TimelineEvent;
  frame: number;
  startFrame: number;
  accentColor: string;
  align: "left" | "right";
}> = React.memo(({ event, frame, startFrame, accentColor, align }) => {
  const { durationInFrames } = useVideoConfig();
  const opacity = fadeIn(frame, startFrame, sec(0.5));
  const offsetY = slideIn(frame, startFrame, 24, sec(0.5));
  const exitOpacity = exitFade(frame, durationInFrames, 15);

  return (
    <div
      style={{
        opacity: opacity * exitOpacity,
        transform: `translateY(${offsetY}px)`,
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: layout.spacing.sm,
        marginBottom: layout.spacing.lg,
      }}
    >
      {/* Timeline dot + line */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          width: 20,
        }}
      >
        <div
          style={{
            width: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: event.color || accentColor,
            border: `2px solid ${event.color || accentColor}`,
            boxShadow: `0 0 12px ${event.color || accentColor}60, 0 2px 8px rgba(0,0,0,0.3)`,
          }}
        />
        <div
          style={{
            width: 2,
            flex: 1,
            minHeight: 40,
            backgroundColor: `${event.color || accentColor}33`,
            filter: "drop-shadow(0 0 4px rgba(229, 165, 68, 0.3))",
          }}
        />
      </div>

      {/* Content card — subtle internal gradient */}
      <div
        style={{
          flex: 1,
          padding: cardPadding.css,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${event.color || accentColor}15 0%, ${event.color || accentColor}08 100%)`,
          border: `1px solid ${event.color || accentColor}20`,
          borderLeft: `3px solid ${event.color || accentColor}60`,
          boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            fontSize: fontSizes.label,
            color: event.color || accentColor,
            fontWeight: 600,
            marginBottom: layout.spacing.xs,
            fontFamily: fonts.mono,
            textShadow: shadows.textLift,
          }}
        >
          {event.year}
        </div>
        <div
          style={{
            fontSize: fontSizes.body,
            color: light.text.primary,
            fontWeight: 500,
            lineHeight: 1.4,
            marginBottom: event.description ? layout.spacing.xs : 0,
            textShadow: shadows.textLift,
          }}
        >
          {event.title}
        </div>
        {event.description && (
          <div
            style={{
              fontSize: fontSizes.caption,
              color: light.text.secondary,
              lineHeight: 1.4,
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

// ── Connecting line between paired events ───────────────────────────────────

const ConnectionLine: React.FC<{
  frame: number;
  startFrame: number;
  label?: string;
  yPosition: number;
}> = React.memo(({ frame, startFrame, label, yPosition }) => {
  const { durationInFrames } = useVideoConfig();
  const opacity = fadeIn(frame, startFrame, sec(0.4));
  const exitOpacity = exitFade(frame, durationInFrames, 15);
  const dashOffset = interpolate(
    frame,
    [startFrame, startFrame + sec(0.6)],
    [200, 0],
    CLAMP_CUBIC
  );

  return (
    <div
      style={{
        position: "absolute",
        top: yPosition,
        left: "47%",
        width: "6%",
        opacity: opacity * exitOpacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <svg width="100%" height="2" style={{ overflow: "visible" }}>
        <line
          x1="0"
          y1="1"
          x2="100%"
          y2="1"
          stroke={semantic.highlight}
          strokeWidth="2"
          strokeDasharray="6 4"
          strokeDashoffset={dashOffset}
          style={{ filter: "drop-shadow(0 0 4px rgba(229, 165, 68, 0.3))" }}
        />
      </svg>
      {label && (
        <div
          style={{
            fontSize: fontSizes.small,
            color: semantic.highlight,
            marginTop: layout.spacing.xs / 2,
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

// ── Main component ──────────────────────────────────────────────────────────

export const TimelineComparison: React.FC<{
  data: TimelineComparisonData;
}> = ({ data }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const { style: compStyle } = useCompositionAnimation();

  const secsPerEvent = useMemo(() => data.secondsPerEvent || 2, [data.secondsPerEvent]);
  const leftColor = useMemo(() => data.leftColor || semantic.us, [data.leftColor]);
  const rightColor = useMemo(() => data.rightColor || semantic.china, [data.rightColor]);
  const totalEvents = useMemo(
    () => Math.max(data.leftEvents.length, data.rightEvents.length),
    [data.leftEvents.length, data.rightEvents.length]
  );
  const baseDelay = sec(0.8);

  return (
    <Background variant="light" tint={data.backgroundTint}>
      <AbsoluteFill style={compStyle}>
        {/* ── Column headers ───────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: layout.safeArea.top,
            left: layout.safeArea.left,
            right: layout.safeArea.right,
            display: "flex",
            justifyContent: "space-between",
            opacity: fadeIn(frame, 0, sec(0.6)),
          }}
        >
        <div style={{ width: "44%", paddingBottom: layout.spacing.sm }}>
          <div
            style={{
              fontSize: fontSizes.h3,
              fontWeight: 600,
              color: light.text.primary,
              fontFamily: fonts.heading,
              textShadow: shadows.textLift,
              marginBottom: layout.spacing.sm,
              transform: `translateY(${slideIn(frame, 0, 16, sec(0.5))}px)`,
            }}
          >
            {data.leftLabel}
          </div>
          <div
            style={{
              height: 3,
              background: `linear-gradient(90deg, ${leftColor} 0%, ${leftColor}40 80%, transparent 100%)`,
              borderRadius: 2,
              transform: `scaleX(${interpolate(frame, [sec(0.2), sec(0.8)], [0, 1], CLAMP_QUAD)})`,
              transformOrigin: "left center",
            }}
          />
        </div>
        <div style={{ width: "44%", paddingBottom: layout.spacing.sm }}>
          <div
            style={{
              fontSize: fontSizes.h3,
              fontWeight: 600,
              color: light.text.primary,
              fontFamily: fonts.heading,
              textShadow: shadows.textLift,
              marginBottom: layout.spacing.sm,
              transform: `translateY(${slideIn(frame, sec(0.1), 16, sec(0.5))}px)`,
            }}
          >
            {data.rightLabel}
          </div>
          <div
            style={{
              height: 3,
              background: `linear-gradient(90deg, ${rightColor} 0%, ${rightColor}40 80%, transparent 100%)`,
              borderRadius: 2,
              transform: `scaleX(${interpolate(frame, [sec(0.3), sec(0.9)], [0, 1], CLAMP_QUAD)})`,
              transformOrigin: "left center",
            }}
          />
        </div>
        </div>

        {/* ── Event columns — Ken Burns drift for camera energy ────────── */}
        <div
          style={{
            position: "absolute",
            top: contentArea("minimal").top,
            left: layout.safeArea.left,
            right: layout.safeArea.right,
            bottom: layout.safeArea.bottom,
            display: "flex",
            justifyContent: "space-between",
            transform: `scale(${kenBurnsDrift(frame, durationInFrames, 1.02)})`,
            transformOrigin: "center top",
          }}
        >
        {/* Left column */}
        <div style={{ width: "44%" }}>
          {data.leftEvents.map((event, i) => (
            <EventCard
              key={`l-${i}`}
              event={event}
              frame={frame}
              startFrame={stagger(i, sec(0.1), baseDelay)}
              accentColor={leftColor}
              align="left"
            />
          ))}
        </div>

        {/* Right column */}
        <div style={{ width: "44%" }}>
          {data.rightEvents.map((event, i) => (
            <EventCard
              key={`r-${i}`}
              event={event}
              frame={frame}
              startFrame={stagger(i, sec(0.1), baseDelay + sec(secsPerEvent * 0.5))}
              accentColor={rightColor}
              align="right"
            />
          ))}
        </div>
        </div>

        {/* ── Episode label — slideIn (no naked fade) ─────────────────── */}
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom,
            left: layout.safeArea.left,
            fontSize: fontSizes.label,
            color: light.text.muted,
            letterSpacing: 2,
            textTransform: "uppercase",
            opacity: fadeIn(frame, 0, sec(1)),
            transform: `translateY(${slideIn(frame, 0, 10, sec(0.8))}px)`,
          }}
        >
          {data.episode}
        </div>
      </AbsoluteFill>
    </Background>
  );
};
