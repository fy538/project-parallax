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
  interpolate,
  Easing,
} from "remotion";
import { palette, dark, semantic, fonts, fontSizes, layout, sec } from "../../design/theme";
import { fadeIn, slideIn, stagger } from "../../utils/animation";
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
  const opacity = fadeIn(frame, startFrame, sec(0.5));
  const offsetY = slideIn(frame, startFrame, 24, sec(0.5));

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${offsetY}px)`,
        display: "flex",
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 16,
        marginBottom: 28,
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
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: event.color || accentColor,
            border: `2px solid ${event.color || accentColor}`,
          }}
        />
        <div
          style={{
            width: 2,
            flex: 1,
            minHeight: 40,
            backgroundColor: `${event.color || accentColor}33`,
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: fontSizes.label,
            color: event.color || accentColor,
            fontWeight: 600,
            marginBottom: 4,
            fontFamily: fonts.mono,
          }}
        >
          {event.year}
        </div>
        <div
          style={{
            fontSize: fontSizes.body,
            color: dark.text.primary,
            fontWeight: 500,
            lineHeight: 1.4,
            marginBottom: event.description ? 6 : 0,
          }}
        >
          {event.title}
        </div>
        {event.description && (
          <div
            style={{
              fontSize: fontSizes.caption,
              color: dark.text.muted,
              lineHeight: 1.4,
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
  const opacity = fadeIn(frame, startFrame, sec(0.4));
  const dashOffset = interpolate(
    frame,
    [startFrame, startFrame + sec(0.6)],
    [200, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div
      style={{
        position: "absolute",
        top: yPosition,
        left: "47%",
        width: "6%",
        opacity,
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
        />
      </svg>
      {label && (
        <div
          style={{
            fontSize: fontSizes.small,
            color: semantic.highlight,
            marginTop: 4,
            whiteSpace: "nowrap",
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
  const { style: compStyle } = useCompositionAnimation();

  const secsPerEvent = useMemo(() => data.secondsPerEvent || 2, [data.secondsPerEvent]);
  const leftColor = useMemo(() => data.leftColor || semantic.us, [data.leftColor]);
  const rightColor = useMemo(() => data.rightColor || semantic.china, [data.rightColor]);
  const totalEvents = useMemo(
    () => Math.max(data.leftEvents.length, data.rightEvents.length),
    [data.leftEvents.length, data.rightEvents.length]
  );

  return (
    <Background variant="dark">
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
        <div
          style={{
            width: "44%",
            borderBottom: `3px solid ${leftColor}`,
            paddingBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: fontSizes.h3,
              fontWeight: 600,
              color: dark.text.primary,
              fontFamily: fonts.heading,
            }}
          >
            {data.leftLabel}
          </div>
        </div>
        <div
          style={{
            width: "44%",
            borderBottom: `3px solid ${rightColor}`,
            paddingBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: fontSizes.h3,
              fontWeight: 600,
              color: dark.text.primary,
              fontFamily: fonts.heading,
            }}
          >
            {data.rightLabel}
          </div>
        </div>
        </div>

        {/* ── Event columns ────────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: layout.safeArea.top + 70,
            left: layout.safeArea.left,
            right: layout.safeArea.right,
            bottom: layout.safeArea.bottom,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
        {/* Left column */}
        <div style={{ width: "44%" }}>
          {data.leftEvents.map((event, i) => (
            <EventCard
              key={`l-${i}`}
              event={event}
              frame={frame}
              startFrame={stagger(i, sec(secsPerEvent), sec(0.8))}
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
              startFrame={stagger(i, sec(secsPerEvent), sec(0.8) + sec(secsPerEvent * 0.5))}
              accentColor={rightColor}
              align="right"
            />
          ))}
        </div>
        </div>

        {/* ── Episode label ────────────────────────────────────────────── */}
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
      </AbsoluteFill>
    </Background>
  );
};
