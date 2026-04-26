/**
 * SplitComposition — full-bleed vertical split for dual analytical lenses.
 *
 * Two halves: left and right, split at 960px.
 * Each half renders a "tag" (label), title, subtitle, and staggered item list.
 * Center divider line with optional label and gradient fade (transparent edges).
 *
 * Animation sequence:
 *   - Background appears immediately
 *   - Left side reveals: tag → title → items stagger (starting ~frame 10)
 *   - Divider draws top-to-bottom (~frame 25)
 *   - Divider label fades in (~frame 35)
 *   - Right side reveals: tag → title → items stagger (~frame 40)
 *   - Exits with fade on last 15 frames
 *
 * Colors (dark mode default):
 *   - Each side gets a subtle tint overlay (6% opacity) of its accentColor
 *   - Left default accent: semantic.us (#3266AD)
 *   - Right default accent: semantic.china (#C23B22)
 *   - Tag color: side's accentColor
 *   - Title: dark.text.primary (bone)
 *   - Items: dark.text.secondary
 *   - Divider: dark.text.muted at 40% opacity
 *   - Divider label: dark.text.accent (amber)
 *
 * Safe areas: 80px outer edges, 40px near divider
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import {
  palette,
  dark,
  light,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  lineHeight,
  layout,
  semantic,
  sec,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  stagger,
  heroSpring,
  exitFade,
} from "../../utils/animation";
import { contentShadow, gradientDivider } from "../../utils/depth";
import { Background } from "../../components/Background";
import { MetadataStrip } from "../../components/MetadataStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import type { SplitCompositionData } from "./types";

// ── Helper: detect Chinese characters ───────────────────────────────────
const hasChinese = (text: string): boolean => {
  const chineseRegex = /[一-鿿㐀-䶿]/g;
  return chineseRegex.test(text);
};

// ── Helper: apply correct font based on content ────────────────────────
const getFontFamily = (text: string): string => {
  return hasChinese(text) ? fonts.chinese : fonts.display;
};

// ── Side component (left or right half) ─────────────────────────────────
const SplitSideContent: React.FC<{
  side: "left" | "right";
  data: any; // SplitSide
  frame: number;
  totalFrames: number;
  isDark: boolean;
}> = ({ side, data, frame, totalFrames, isDark }) => {
  const mode = isDark ? dark : light;
  const isLeft = side === "left";

  // Stagger timing: left starts at ~10, right starts at ~40
  const baseDelay = isLeft ? 10 : 40;
  const tagDelay = baseDelay;
  const titleDelay = baseDelay + 8;
  const itemBaseDelay = baseDelay + 16;

  const accentColor = data.accentColor || (isLeft ? semantic.us : semantic.china);

  // Position within the half: 80px outer safe, 40px near divider
  const isRightHalf = !isLeft;
  const x = isLeft ? layout.safeArea.left : layout.safeArea.left + 960;
  const w = 960 - layout.safeArea.left - (isRightHalf ? layout.safeArea.right : 40);
  const textAlign: "left" | "right" = isLeft ? "left" : "right";
  const itemAlign: "flex-start" | "flex-end" = isLeft
    ? "flex-start"
    : "flex-end";

  // Exit fade on last 15 frames
  const exitOpacity = exitFade(frame, totalFrames, 15);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: layout.safeArea.top,
        width: w,
        height: layout.height - layout.safeArea.top - layout.safeArea.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        opacity: exitOpacity,
      }}
    >
      {/* Tag (e.g., "WESTERN LENS") */}
      {data.tag && (
        <div
          style={{
            fontSize: fontSizes.caption,
            fontWeight: fontWeights.semibold,
            letterSpacing: letterSpacing.label,
            textTransform: "uppercase",
            color: accentColor,
            textAlign,
            marginBottom: layout.spacing.lg,
            fontFamily: fonts.body,
            opacity: fadeIn(frame, tagDelay, sec(0.4)),
          }}
        >
          {data.tag}
        </div>
      )}

      {/* Title */}
      <h2
        style={{
          fontSize: fontSizes.h2,
          fontWeight: fontWeights.bold,
          letterSpacing: letterSpacing.h2,
          color: mode.text.primary,
          textAlign,
          margin: 0,
          marginBottom: data.subtitle ? layout.spacing.sm : layout.spacing.md,
          fontFamily: getFontFamily(data.title),
          lineHeight: lineHeight.h2,
          opacity: fadeIn(frame, titleDelay, sec(0.5)),
        }}
      >
        {data.title}
      </h2>

      {/* Subtitle */}
      {data.subtitle && (
        <div
          style={{
            fontSize: fontSizes.body,
            fontWeight: fontWeights.regular,
            color: mode.text.secondary,
            textAlign,
            marginBottom: layout.spacing.lg,
            fontFamily: getFontFamily(data.subtitle),
            lineHeight: lineHeight.body,
            opacity: fadeIn(frame, titleDelay + 4, sec(0.4)),
          }}
        >
          {data.subtitle}
        </div>
      )}

      {/* Items list (staggered) */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: layout.spacing.md,
          alignItems: itemAlign,
        }}
      >
        {data.items.map((item: string, idx: number) => {
          const itemStartFrame = itemBaseDelay + stagger(idx, 8, 0);
          const itemOpacity = fadeIn(frame, itemStartFrame, sec(0.4));
          const itemOffset = slideIn(frame, itemStartFrame, 20, sec(0.4));
          const transform = isLeft
            ? `translateX(${itemOffset}px)`
            : `translateX(${-itemOffset}px)`;

          return (
            <div
              key={idx}
              style={{
                fontSize: fontSizes.body,
                fontWeight: fontWeights.regular,
                color: mode.text.secondary,
                fontFamily: getFontFamily(item),
                lineHeight: lineHeight.body,
                maxWidth: "90%",
                opacity: itemOpacity,
                transform,
              }}
            >
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────
export const SplitComposition: React.FC<{ data: SplitCompositionData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation({ noExit: true });
  const { durationInFrames: totalFrames } = useVideoConfig();

  const isDark = data.backgroundVariant !== "light";
  const mode = isDark ? dark : light;

  const leftAccent = data.left.accentColor || semantic.us;
  const rightAccent = data.right.accentColor || semantic.china;

  // ── Background with tinted overlays ────────────────────────────────
  // Create a subtle tint overlay (6% opacity) of each side's accentColor
  const leftTintOpacity = 0.06;
  const rightTintOpacity = 0.06;

  // ── Divider animation ──────────────────────────────────────────────
  // Draw-in: top to bottom starting at frame 25
  const dividerStartFrame = 25;
  const dividerDuration = 15;
  const dividerProgress = interpolate(
    frame,
    [dividerStartFrame, dividerStartFrame + dividerDuration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Divider label fade-in at frame 35
  const labelStartFrame = 35;
  const labelOpacity = fadeIn(frame, labelStartFrame, sec(0.3));

  // Exit fade
  const exitOpacity = exitFade(frame, totalFrames, 15);

  const dividerLabel = data.dividerLabel || "vs";

  return (
    <Background variant={isDark ? "dark" : "light"}>
      <AbsoluteFill style={compStyle}>
        {/* Left half with tint */}
      {!data.noDivider && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 960,
            height: layout.height,
            backgroundColor: leftAccent,
            opacity: leftTintOpacity,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Right half with tint */}
      {!data.noDivider && (
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 0,
            width: 960,
            height: layout.height,
            backgroundColor: rightAccent,
            opacity: rightTintOpacity,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Left side content */}
      <SplitSideContent
        side="left"
        data={data.left}
        frame={frame}
        totalFrames={totalFrames}
        isDark={isDark}
      />

      {/* Right side content */}
      <SplitSideContent
        side="right"
        data={data.right}
        frame={frame}
        totalFrames={totalFrames}
        isDark={isDark}
      />

      {/* Center divider (vertical line) with gradient fade */}
      {!data.noDivider && (
        <div
          style={{
            position: "absolute",
            left: 960,
            top: 0,
            width: 2,
            height: layout.height,
            opacity: exitOpacity,
          }}
        >
          {/* Gradient divider that draws top-to-bottom */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: `${dividerProgress * 100}%`,
              background: `linear-gradient(
                to bottom,
                transparent,
                ${mode.text.muted}66,
                transparent
              )`,
            }}
          />
        </div>
      )}

      {/* Divider label in center circle */}
      {!data.noDivider && (
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: `1px solid ${mode.text.muted}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: fontSizes.label,
            fontWeight: fontWeights.semibold,
            color: mode.text.accent,
            fontFamily: fonts.display,
            opacity: labelOpacity,
            pointerEvents: "none",
          }}
        >
          {dividerLabel}
        </div>
      )}

      {/* Metadata strip (optional) */}
      <MetadataStrip
        episodeNumber={data.episode ? parseInt(data.episode.replace(/\D/g, "")) : undefined}
        episodeTitle={data.title}
        variant={isDark ? "dark" : "light"}
        startFrame={60}
      />
      </AbsoluteFill>
    </Background>
  );
};
