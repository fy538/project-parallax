/**
 * @deprecated Use HorizontalTimeline instead. This template uses a static vertical
 * dot-line-card layout. HorizontalTimeline provides cinematic horizontal camera tracking,
 * depth-of-field focus isolation, and configurable modes (single/dual/morph) that replace
 * all three legacy timeline templates.
 *
 * TimelineMorph — eras morphing into each other.
 *
 * Instead of side-by-side comparison (TimelineComparison), events from era A
 * transform into their era B counterparts. Same event card, animated position/color/label
 * transitions. Critical for silicon-trap: 1941 oil embargo → 2022 chip controls.
 *
 * Animation sequence:
 * - Phase 1 (hold): Title + era A label appear, event cards fade in with stagger
 *   showing era A data (year + text), all styled in eraAColor
 * - Phase 2 (morph): Each card's year label, text, and color smoothly transition
 *   to era B values. Text cross-fades. Era title morphs from eraATitle → eraBTitle.
 * - Phase 3 (hold B): Era B state holds, showing the structural parallel
 * - Exit fade last 15 frames
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
  semantic,
  fonts,
  fontSizes,
  layout,
  sec,
  contentArea,
  cardPadding,
  shadows,
  radii,
  cardPresets,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  slideIn,
  stagger,
  exitFade,
  CLAMP,
  CLAMP_QUAD,
  CLAMP_SINE,
} from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import type { TimelineMorphData, MorphEvent } from "./types";

// ── Single morphing event card ──────────────────────────────────────────────

const MorphEventCard: React.FC<{
  event: MorphEvent;
  frame: number;
  startFrame: number;
  holdDurationSec: number;
  morphDurationSec: number;
  eraAColor: string;
  eraBColor: string;
  mode: "light" | "dark";
}> = React.memo(
  ({
    event,
    frame,
    startFrame,
    holdDurationSec,
    morphDurationSec,
    eraAColor,
    eraBColor,
    mode,
  }) => {
    const theme = useThemeMode(mode);
    const { durationInFrames } = useVideoConfig();

    // Animation timeline
    const holdEndFrame = startFrame + sec(holdDurationSec);
    const morphEndFrame = holdEndFrame + sec(morphDurationSec);

    // Phase 1: Fade in (era A)
    const inOpacity = fadeIn(frame, startFrame, sec(0.5));

    // Phase 3: Exit fade
    const exitOpacity = exitFade(frame, durationInFrames, 15);

    // Color morphing: smooth transition from eraAColor → eraBColor
    const cardColor = interpolateColors(
      frame,
      [holdEndFrame, morphEndFrame],
      [eraAColor, eraBColor]
    );

    // Slide in offset (only for phase 1)
    const offsetY = slideIn(frame, startFrame, 24, sec(0.5));

    // Opacity for era A text (fades out during morph)
    const textAOpacity = interpolate(
      frame,
      [holdEndFrame, holdEndFrame + sec(morphDurationSec * 0.5)],
      [1, 0],
      CLAMP_SINE
    );

    // Opacity for era B text (fades in during morph)
    const textBOpacity = interpolate(
      frame,
      [holdEndFrame + sec(morphDurationSec * 0.5), morphEndFrame],
      [0, 1],
      CLAMP_SINE
    );

    return (
      <div
        style={{
          opacity: inOpacity * exitOpacity,
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
              backgroundColor: cardColor,
              border: `2px solid ${cardColor}`,
              boxShadow: `0 0 12px ${cardColor}60, 0 2px 8px rgba(0,0,0,0.3)`,
            }}
          />
          <div
            style={{
              width: 2,
              flex: 1,
              minHeight: 40,
              backgroundColor: `${cardColor}33`,
              filter: "drop-shadow(0 0 4px rgba(229, 165, 68, 0.3))",
            }}
          />
        </div>

        {/* Content card — morphs color + text */}
        <div
          style={{
            flex: 1,
            ...cardPresets.accentEdge(cardColor, mode === "dark"),
          }}
        >
          {/* Year badge — morphs from eraALabel → eraBLabel */}
          <div
            style={{
              fontSize: fontSizes.label,
              color: cardColor,
              fontWeight: 600,
              marginBottom: layout.spacing.xs,
              fontFamily: fonts.mono,
              textShadow: shadows.textLift,
              minHeight: fontSizes.label, // prevent layout shift
              position: "relative",
            }}
          >
            {/* Era A label fades out as era B fades in */}
            <span style={{ opacity: textAOpacity }}>
              {event.eraALabel}
            </span>
            <span
              style={{
                position: "absolute",
                opacity: textBOpacity,
                top: 0,
                left: 0,
              }}
            >
              {event.eraBLabel}
            </span>
          </div>

          {/* Text content — cross-fade from eraAText to eraBText */}
          <div style={{ minHeight: fontSizes.body * 1.4, position: "relative" }}>
            <div
              style={{
                fontSize: fontSizes.body,
                color: theme.text.primary,
                fontWeight: 500,
                lineHeight: 1.4,
                marginBottom: layout.spacing.xs,
                textShadow: shadows.textLift,
                opacity: textAOpacity,
              }}
            >
              {event.eraAText}
            </div>
            <div
              style={{
                fontSize: fontSizes.body,
                color: theme.text.primary,
                fontWeight: 500,
                lineHeight: 1.4,
                marginBottom: layout.spacing.xs,
                textShadow: shadows.textLift,
                position: "absolute",
                opacity: textBOpacity,
                top: 0,
                left: 0,
              }}
            >
              {event.eraBText}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

// ── Main component ──────────────────────────────────────────────────────────

export const TimelineMorph: React.FC<{
  data: TimelineMorphData;
}> = ({ data }) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const mode = (data.backgroundVariant || "light") as "light" | "dark";
  const theme = useThemeMode(mode);
  const { durationInFrames } = useVideoConfig();
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);

  const holdDuration = useMemo(() => data.holdDurationSec || 3, [
    data.holdDurationSec,
  ]);
  const morphDuration = useMemo(() => data.morphDurationSec || 2, [
    data.morphDurationSec,
  ]);
  const eraAColor = useMemo(() => data.eraAColor || semantic.us, [
    data.eraAColor,
  ]);
  const eraBColor = useMemo(() => data.eraBColor || semantic.china, [
    data.eraBColor,
  ]);
  const baseDelay = sec(0.8);

  // Morph progress for era title transition
  const firstEventStartFrame = baseDelay;
  const holdEndFrame = firstEventStartFrame + sec(holdDuration);
  const morphEndFrame = holdEndFrame + sec(morphDuration);

  const eraTitleAOpacity = interpolate(
    frame,
    [holdEndFrame, holdEndFrame + sec(morphDuration * 0.5)],
    [1, 0],
    CLAMP_SINE
  );

  const eraTitleBOpacity = interpolate(
    frame,
    [holdEndFrame + sec(morphDuration * 0.5), morphEndFrame],
    [0, 1],
    CLAMP_SINE
  );

  const eraTitleColor = interpolateColors(
    frame,
    [holdEndFrame, morphEndFrame],
    [eraAColor, eraBColor]
  );

  return (
    <Background
      variant={mode}
      tint={direction.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {/* ── Era title — morphs from A → B ────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: layout.safeAreaTier.generous.top,
            left: layout.safeAreaTier.generous.left,
            right: layout.safeAreaTier.generous.right,
            paddingBottom: layout.spacing.sm,
            opacity: fadeIn(frame, 0, sec(0.6)),
          }}
        >
          <div
            style={{
              fontSize: fontSizes.h3,
              fontWeight: 600,
              color: eraTitleColor,
              fontFamily: fonts.heading,
              textShadow: shadows.textLift,
              marginBottom: layout.spacing.sm,
              transform: `translateY(${slideIn(frame, 0, 16, sec(0.5))}px)`,
              minHeight: fontSizes.h3,
              position: "relative",
            }}
          >
            <span style={{ opacity: eraTitleAOpacity }}>
              {data.eraATitle}
            </span>
            <span
              style={{
                position: "absolute",
                opacity: eraTitleBOpacity,
                top: 0,
                left: 0,
              }}
            >
              {data.eraBTitle}
            </span>
          </div>
          <div
            style={{
              height: 3,
              background: `linear-gradient(90deg, ${eraTitleColor} 0%, ${eraTitleColor}40 80%, transparent 100%)`,
              borderRadius: 2,
              transform: `scaleX(${interpolate(
                frame,
                [sec(0.2), sec(0.8)],
                [0, 1],
                CLAMP_QUAD
              )})`,
              transformOrigin: "left center",
            }}
          />
        </div>

        {/* ── Event cards — staggered morph ────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: contentArea("minimal", "generous").top,
            left: layout.safeAreaTier.generous.left,
            right: layout.safeAreaTier.generous.right,
            bottom: layout.safeAreaTier.generous.bottom,
          }}
        >
          <div
            style={{
              width: "90%",
              margin: "0 auto",
            }}
          >
            {data.events.map((event, i) => (
              <MorphEventCard
                key={`morph-${i}`}
                event={event}
                frame={frame}
                startFrame={stagger(i, sec(0.1), baseDelay)}
                holdDurationSec={holdDuration}
                morphDurationSec={morphDuration}
                eraAColor={eraAColor}
                eraBColor={eraBColor}
                mode={mode}
              />
            ))}
          </div>
        </div>

        {/* ── Episode label — slideIn (no naked fade) ─────────────────── */}
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
      </AbsoluteFill>
      {/* Brand strips */}
      <HeaderStrip mode={mode} metadata={data.episode} />
      <FooterStrip mode={mode} />
    </Background>
  );
};
