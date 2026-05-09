/**
 * @deprecated Use HorizontalTimeline instead. This template uses a static vertical
 * dot-line-card layout. HorizontalTimeline provides cinematic horizontal camera tracking,
 * depth-of-field focus isolation, and configurable modes (single/dual/morph) that replace
 * all three legacy timeline templates.
 *
 * TimelineComparison — side-by-side historical vs. modern timeline.
 *
 * Left column shows historical events, right column shows modern parallels.
 * Events fade in sequentially. Optional connecting lines between paired events
 * highlight the structural parallel.
 *
 * silicon-trap use case: 1941 oil embargo → Pearl Harbor vs 2022 chip controls → ?
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { semantic, fonts, fontSizes, layout, sec, contentArea, cardPadding, shadows, radii, cardPresets, dividerStyle } from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import { fadeIn, slideIn, stagger, exitFade, CLAMP_QUAD } from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import type { TimelineComparisonData, TimelineEvent } from "./types";

// ── Single event card ───────────────────────────────────────────────────────

const EventCard: React.FC<{
  event: TimelineEvent;
  frame: number;
  startFrame: number;
  accentColor: string;
  align: "left" | "right";
}> = React.memo(({ event, frame, startFrame, accentColor, align }) => {
  const theme = useThemeMode("light");
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
          width: 24,
        }}
      >
        <div
          style={{
            width: 14,
            height: 14,
            borderRadius: "50%",
            backgroundColor: event.color || accentColor,
            boxShadow: `0 0 8px ${event.color || accentColor}40`,
          }}
        />
        <div
          style={{
            width: 1,
            flex: 1,
            minHeight: 40,
            backgroundColor: `${event.color || accentColor}20`,
          }}
        />
      </div>

      {/* Content card — accent edge for clean, editorial appearance */}
      <div
        style={{
          flex: 1,
          ...cardPresets.accentEdge(event.color || accentColor, false),
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
            color: theme.text.primary,
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
              color: theme.text.secondary,
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

// ── Main component ──────────────────────────────────────────────────────────

export const TimelineComparison: React.FC<{
  data: TimelineComparisonData;
}> = ({ data }) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const theme = useThemeMode("light");
  const safe = layout.safeAreaTier.generous;
  const { durationInFrames } = useVideoConfig();
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);

  const secsPerEvent = useMemo(() => data.secondsPerEvent || 2, [data.secondsPerEvent]);
  const leftColor = useMemo(() => data.leftColor || semantic.us, [data.leftColor]);
  const rightColor = useMemo(() => data.rightColor || semantic.china, [data.rightColor]);
  // totalEvents available via Math.max(data.leftEvents.length, data.rightEvents.length)
  const baseDelay = sec(0.8);

  return (
    <Background
      variant="light"
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {/* ── Column headers ───────────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: safe.top,
            left: safe.left,
            right: safe.right,
            display: "flex",
            justifyContent: "space-between",
            opacity: fadeIn(frame, 0, sec(0.6)),
          }}
        >
        <div style={{ width: "48%", paddingBottom: layout.spacing.sm }}>
          <div
            style={{
              fontSize: fontSizes.h3,
              fontWeight: 600,
              color: theme.text.primary,
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
              height: dividerStyle.thickness,
              background: `linear-gradient(90deg, ${leftColor}60 0%, ${leftColor}20 80%, transparent 100%)`,
              borderRadius: radii.xs,
              transform: `scaleX(${interpolate(frame, [sec(0.2), sec(0.8)], [0, 1], CLAMP_QUAD)})`,
              transformOrigin: "left center",
            }}
          />
        </div>
        <div style={{ width: "48%", paddingBottom: layout.spacing.sm }}>
          <div
            style={{
              fontSize: fontSizes.h3,
              fontWeight: 600,
              color: theme.text.primary,
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
              height: dividerStyle.thickness,
              background: `linear-gradient(90deg, ${rightColor}60 0%, ${rightColor}20 80%, transparent 100%)`,
              borderRadius: radii.xs,
              transform: `scaleX(${interpolate(frame, [sec(0.3), sec(0.9)], [0, 1], CLAMP_QUAD)})`,
              transformOrigin: "left center",
            }}
          />
        </div>
        </div>

        {/* ── Event columns ────────── */}
        <div
          style={{
            position: "absolute",
            top: contentArea("minimal", "generous").top,
            left: safe.left,
            right: safe.right,
            bottom: safe.bottom,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
        {/* Left column */}
        <div style={{ width: "48%" }}>
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
        <div style={{ width: "48%" }}>
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
            bottom: safe.bottom,
            left: safe.left,
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
      </AbsoluteFill>
      {/* Brand strips */}
      <HeaderStrip mode="light" metadata={data.episode} />
      <FooterStrip mode="light" />
    </Background>
  );
};
