/**
 * Shared constants and display sub-components for HorizontalTimeline:
 *   TimelineSpine, YearMarker, EventCard, ConnectionLine
 *
 * Constants are co-located here because they are consumed both by the
 * sub-components and by the main HorizontalTimeline component.
 */

import React from "react";
import {
  fonts,
  fontSizes,
  layout,
  sec,
  shadows,
  cardPresets,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  slideIn,
  lockOnPulse,
} from "../../utils/animation";
import type { TimelineEventData } from "./types";

// ── Constants ──────────────────────────────────────────────────────────────

export const CANVAS_WIDTH = layout.width;
export const CANVAS_HEIGHT = layout.height;
/** Spacing between events on the horizontal axis */
export const EVENT_SPACING = 480;
/** Horizontal padding before first and after last event */
export const TIMELINE_PADDING = 400;
/** Spine Y position (vertical center of the timeline) */
export const SPINE_Y = CANVAS_HEIGHT * 0.5;
/** Card width */
export const CARD_WIDTH = 320;
/** Card height (varies by weight, this is base) */
export const CARD_BASE_HEIGHT = 120;

// ── Spine glow component ───────────────────────────────────────────────────

export const TimelineSpine: React.FC<{
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

export const YearMarker: React.FC<{
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

export const EventCard: React.FC<{
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

export const ConnectionLine: React.FC<{
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
