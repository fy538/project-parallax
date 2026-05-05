/**
 * SplitComposition — full-bleed vertical split for dual analytical lenses.
 *
 * Two rendering modes:
 *
 * ═══ STATIC MODE (default, backward compatible) ═══
 * Two halves reveal with staggered items. Center divider draws. Both halves visible.
 *
 * ═══ CINEMATIC MODE (cinematicMode: true) ═══
 * Progressive spotlight with camera-like focus:
 * 1. Camera zooms into left side (right dimmed + blurred)
 * 2. Items build sequentially with slide-in
 * 3. Camera transitions to right side (left fades back, right sharpens)
 * 4. Right items build
 * 5. Camera pulls back to reveal full split (overview)
 *
 * The "camera" is simulated via zoom + translateX on the content container,
 * with depth-of-field (blur + opacity) on the inactive side.
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
  radii,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  stagger,
  exitFade,
  CLAMP,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { MetadataStrip } from "../../components/MetadataStrip";
import { AmbientParticles } from "../../components/AmbientParticles";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { usePhase } from "../../hooks/usePhase";
import type { SplitCompositionData } from "./types";

// ── Helper: detect Chinese characters ───────────────────────────────────
const hasChinese = (text: string): boolean => {
  const chineseRegex = /[一-鿿㐀-䶿]/g;
  return chineseRegex.test(text);
};

const getFontFamily = (text: string): string => {
  return hasChinese(text) ? fonts.chinese : fonts.display;
};

// ══════════════════════════════════════════════════════════════════════════
// ██ CINEMATIC MODE
// ══════════════════════════════════════════════════════════════════════════

const EASE_SMOOTH = Easing.bezier(0.25, 0.1, 0.25, 1);

const CinematicSplitComposition: React.FC<{ data: SplitCompositionData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames: totalFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);

  const isDark = data.backgroundVariant === "dark";
  const mode = isDark ? dark : light;

  const leftAccent = data.left.accentColor || semantic.us;
  const rightAccent = data.right.accentColor || semantic.china;
  const splitPosition = layout.width / 2;

  // Phase timing based on item counts
  const leftItemCount = data.left.items.length;
  const rightItemCount = data.right.items.length;

  const phases = useMemo(() => [
    { name: "intro", duration: sec(0.6) },
    { name: "focusLeft", duration: sec(1.2 + leftItemCount * 0.5) },
    { name: "transition", duration: sec(0.8) },
    { name: "focusRight", duration: sec(1.2 + rightItemCount * 0.5) },
    { name: "overview", duration: sec(2.5) },
  ], [leftItemCount, rightItemCount]);

  const { getPhaseStart, isPhase, isPast } = usePhase(phases);

  // ── Camera simulation (zoom + translateX) ───────────────────────────
  const transStart = getPhaseStart("transition");
  const overviewStart = getPhaseStart("overview");

  // Stronger camera move — 1.35× zoom (was 1.2×) and ±180px offset (was ±120px)
  const cameraZoom = interpolate(
    frame,
    [0, sec(0.3), transStart, transStart + sec(0.4), overviewStart, overviewStart + sec(0.6)],
    [1.35, 1.35, 1.35, 1.35, 1.35, 1.0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_SMOOTH }
  );

  const cameraOffsetX = interpolate(
    frame,
    [0, sec(0.3), transStart, transStart + sec(0.6), overviewStart, overviewStart + sec(0.6)],
    [180, 180, 180, -180, -180, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_SMOOTH }
  );

  // Center divider opacity: dimmed during single-side focus, brightens in overview
  const dividerEmphasis = interpolate(
    frame,
    [0, sec(0.3), transStart, transStart + sec(0.4), overviewStart, overviewStart + sec(0.6)],
    [0.4, 0.4, 0.4, 0.4, 0.4, 1.0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: EASE_SMOOTH }
  );

  // ── Focus isolation ─────────────────────────────────────────────────
  const leftOpacity = interpolate(
    frame,
    [0, sec(0.3), transStart, transStart + sec(0.5), overviewStart, overviewStart + sec(0.5)],
    [1, 1, 1, 0.2, 0.2, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const rightOpacity = interpolate(
    frame,
    [0, sec(0.3), transStart, transStart + sec(0.5), overviewStart, overviewStart + sec(0.5)],
    [0.15, 0.15, 0.15, 1, 1, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const leftBlur = interpolate(
    frame,
    [transStart, transStart + sec(0.4), overviewStart, overviewStart + sec(0.4)],
    [0, 2.5, 2.5, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const rightBlur = interpolate(
    frame,
    [0, transStart, transStart + sec(0.4)],
    [2, 2, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // ── Divider ─────────────────────────────────────────────────────────
  const dividerStart = getPhaseStart("transition");
  const dividerProgress = interpolate(
    frame,
    [dividerStart, dividerStart + sec(0.6)],
    [0, 1],
    CLAMP
  );

  const exitOpacity = exitFade(frame, totalFrames, 15);

  // ── Item build timing ───────────────────────────────────────────────
  const leftBuildStart = getPhaseStart("focusLeft") + sec(0.3);
  const rightBuildStart = getPhaseStart("focusRight") + sec(0.3);

  return (
    <Background
      variant={isDark ? "dark" : "light"}
      tint={direction.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {data.ambientParticles !== false && (
          <AmbientParticles
            mode={isDark ? "dark" : "light"}
            density={20}
            speed={0.3}
            seed={77}
          />
        )}

        {/* Camera container */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${cameraZoom}) translateX(${cameraOffsetX / cameraZoom}px)`,
            transformOrigin: "center center",
            willChange: "transform",
          }}
        >
          {/* Left half tint */}
          {!data.noDivider && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: splitPosition,
                height: layout.height,
                backgroundColor: leftAccent,
                opacity: 0.06,
                pointerEvents: "none",
              }}
            />
          )}

          {/* Right half tint */}
          {!data.noDivider && (
            <div
              style={{
                position: "absolute",
                left: splitPosition,
                top: 0,
                width: layout.width - splitPosition,
                height: layout.height,
                backgroundColor: rightAccent,
                opacity: 0.06,
                pointerEvents: "none",
              }}
            />
          )}

          {/* Left side */}
          <div
            style={{
              position: "absolute",
              left: layout.safeArea.left,
              top: layout.safeAreaTier.generous.top,
              width: splitPosition - layout.safeArea.left - 40,
              opacity: leftOpacity * exitOpacity,
              filter: leftBlur > 0.5 ? `blur(${leftBlur}px)` : undefined,
            }}
          >
            {data.left.tag && (
              <div
                style={{
                  fontSize: fontSizes.caption,
                  fontWeight: fontWeights.semibold,
                  letterSpacing: letterSpacing.label,
                  textTransform: "uppercase",
                  color: leftAccent,
                  marginBottom: layout.spacing.lg,
                  fontFamily: fonts.body,
                  opacity: fadeIn(frame, leftBuildStart - sec(0.2), sec(0.3)),
                }}
              >
                {data.left.tag}
              </div>
            )}
            <h2
              style={{
                fontSize: fontSizes.h2,
                fontWeight: fontWeights.bold,
                letterSpacing: letterSpacing.h2,
                color: mode.text.primary,
                margin: 0,
                marginBottom: data.left.subtitle ? layout.spacing.sm : layout.spacing.md,
                fontFamily: getFontFamily(data.left.title),
                lineHeight: lineHeight.h2,
                opacity: fadeIn(frame, leftBuildStart, sec(0.4)),
                transform: `translateY(${slideIn(frame, leftBuildStart, 16, sec(0.4))}px)`,
              }}
            >
              {data.left.title}
            </h2>
            {data.left.subtitle && (
              <div
                style={{
                  fontSize: fontSizes.body,
                  color: mode.text.secondary,
                  marginBottom: layout.spacing.lg,
                  fontFamily: getFontFamily(data.left.subtitle),
                  lineHeight: lineHeight.body,
                  opacity: fadeIn(frame, leftBuildStart + sec(0.15), sec(0.3)),
                }}
              >
                {data.left.subtitle}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: layout.spacing.md }}>
              {data.left.items.map((item, idx) => {
                const itemStart = leftBuildStart + sec(0.3) + stagger(idx, sec(0.3), 0);
                return (
                  <div
                    key={idx}
                    style={{
                      fontSize: fontSizes.body,
                      color: mode.text.secondary,
                      fontFamily: getFontFamily(item),
                      lineHeight: lineHeight.body,
                      maxWidth: "90%",
                      opacity: fadeIn(frame, itemStart, sec(0.4)),
                      transform: `translateX(${slideIn(frame, itemStart, 20, sec(0.4))}px)`,
                    }}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div
            style={{
              position: "absolute",
              left: layout.safeArea.left + splitPosition,
              top: layout.safeAreaTier.generous.top,
              width: splitPosition - layout.safeArea.right - 40,
              opacity: rightOpacity * exitOpacity,
              filter: rightBlur > 0.5 ? `blur(${rightBlur}px)` : undefined,
            }}
          >
            {data.right.tag && (
              <div
                style={{
                  fontSize: fontSizes.caption,
                  fontWeight: fontWeights.semibold,
                  letterSpacing: letterSpacing.label,
                  textTransform: "uppercase",
                  color: rightAccent,
                  marginBottom: layout.spacing.lg,
                  fontFamily: fonts.body,
                  textAlign: "right",
                  opacity: fadeIn(frame, rightBuildStart - sec(0.2), sec(0.3)),
                }}
              >
                {data.right.tag}
              </div>
            )}
            <h2
              style={{
                fontSize: fontSizes.h2,
                fontWeight: fontWeights.bold,
                letterSpacing: letterSpacing.h2,
                color: mode.text.primary,
                textAlign: "right",
                margin: 0,
                marginBottom: data.right.subtitle ? layout.spacing.sm : layout.spacing.md,
                fontFamily: getFontFamily(data.right.title),
                lineHeight: lineHeight.h2,
                opacity: fadeIn(frame, rightBuildStart, sec(0.4)),
                transform: `translateY(${slideIn(frame, rightBuildStart, 16, sec(0.4))}px)`,
              }}
            >
              {data.right.title}
            </h2>
            {data.right.subtitle && (
              <div
                style={{
                  fontSize: fontSizes.body,
                  color: mode.text.secondary,
                  textAlign: "right",
                  marginBottom: layout.spacing.lg,
                  fontFamily: getFontFamily(data.right.subtitle),
                  lineHeight: lineHeight.body,
                  opacity: fadeIn(frame, rightBuildStart + sec(0.15), sec(0.3)),
                }}
              >
                {data.right.subtitle}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: layout.spacing.md, alignItems: "flex-end" }}>
              {data.right.items.map((item, idx) => {
                const itemStart = rightBuildStart + sec(0.3) + stagger(idx, sec(0.3), 0);
                return (
                  <div
                    key={idx}
                    style={{
                      fontSize: fontSizes.body,
                      color: mode.text.secondary,
                      fontFamily: getFontFamily(item),
                      lineHeight: lineHeight.body,
                      maxWidth: "90%",
                      textAlign: "right",
                      opacity: fadeIn(frame, itemStart, sec(0.4)),
                      transform: `translateX(${-slideIn(frame, itemStart, 20, sec(0.4))}px)`,
                    }}
                  >
                    {item}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Center divider — emphasis ramps in overview phase, dim during single-side focus */}
          {!data.noDivider && (
            <>
              <div
                style={{
                  position: "absolute",
                  left: splitPosition,
                  top: 0,
                  width: dividerEmphasis > 0.7 ? 2 : 1,
                  height: layout.height,
                  opacity: dividerProgress * exitOpacity * dividerEmphasis,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%",
                    height: "100%",
                    background: `linear-gradient(to bottom, transparent, ${mode.text.muted}${dividerEmphasis > 0.7 ? "AA" : "66"}, transparent)`,
                  }}
                />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: layout.spacing.lg,
                  height: layout.spacing.lg,
                  borderRadius: `${radii.pill}px`,
                  border: `1px solid ${mode.text.muted}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: fontSizes.label,
                  fontWeight: fontWeights.semibold,
                  color: mode.text.accent,
                  fontFamily: fonts.display,
                  opacity: fadeIn(frame, dividerStart + sec(0.3), sec(0.3)) * exitOpacity,
                  pointerEvents: "none",
                }}
              >
                {data.dividerLabel || "vs"}
              </div>
            </>
          )}
        </div>

        <MetadataStrip
          episodeNumber={data.episode ? parseInt(data.episode.replace(/\D/g, "")) : undefined}
          episodeTitle={data.title}
          variant={isDark ? "dark" : "light"}
          startFrame={60}
        />
      </AbsoluteFill>
      {/* Brand strips */}
      <HeaderStrip mode={isDark ? "dark" : "light"} metadata={data.episode} />
      <FooterStrip mode={isDark ? "dark" : "light"} />
    </Background>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// ██ STATIC MODE (original, backward compatible)
// ══════════════════════════════════════════════════════════════════════════

const SplitSideContent: React.FC<{
  side: "left" | "right";
  data: any;
  frame: number;
  totalFrames: number;
  isDark: boolean;
  splitPosition: number;
}> = ({ side, data, frame, totalFrames, isDark, splitPosition }) => {
  const mode = isDark ? dark : light;
  const isLeft = side === "left";

  const baseDelay = isLeft ? 10 : 40;
  const tagDelay = baseDelay;
  const titleDelay = baseDelay + 8;
  const itemBaseDelay = baseDelay + 16;

  const accentColor = data.accentColor || (isLeft ? semantic.us : semantic.china);

  const isRightHalf = !isLeft;
  const x = isLeft ? layout.safeArea.left : layout.safeArea.left + splitPosition;
  const w = splitPosition - layout.safeArea.left - (isRightHalf ? layout.safeArea.right : 40);
  const textAlign: "left" | "right" = isLeft ? "left" : "right";
  const itemAlign: "flex-start" | "flex-end" = isLeft ? "flex-start" : "flex-end";

  const exitOpacity = exitFade(frame, totalFrames, 15);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: layout.safeAreaTier.generous.top,
        width: w,
        height: layout.height - layout.safeArea.top - layout.safeArea.bottom,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        opacity: exitOpacity,
      }}
    >
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
            transform: `translateY(${slideIn(frame, tagDelay, layout.spacing.xs, sec(0.4))}px)`,
          }}
        >
          {data.tag}
        </div>
      )}

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
          transform: `translateY(${slideIn(frame, titleDelay, layout.spacing.sm, sec(0.5))}px)`,
        }}
      >
        {data.title}
      </h2>

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
            transform: `translateY(${slideIn(frame, titleDelay + 4, layout.spacing.xs, sec(0.4))}px)`,
          }}
        >
          {data.subtitle}
        </div>
      )}

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

const StaticSplitComposition: React.FC<{ data: SplitCompositionData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const { durationInFrames: totalFrames } = useVideoConfig();

  const isDark = data.backgroundVariant === "dark";
  const mode = isDark ? dark : light;

  const leftAccent = data.left.accentColor || semantic.us;
  const rightAccent = data.right.accentColor || semantic.china;
  const splitPosition = layout.width / 2;

  const dividerStartFrame = 25;
  const dividerDuration = 15;
  const dividerProgress = interpolate(
    frame,
    [dividerStartFrame, dividerStartFrame + dividerDuration],
    [0, 1],
    CLAMP
  );

  const labelStartFrame = 35;
  const labelOpacity = fadeIn(frame, labelStartFrame, sec(0.3));
  const exitOpacity = exitFade(frame, totalFrames, 15);
  const dividerLabel = data.dividerLabel || "vs";

  return (
    <Background
      variant={isDark ? "dark" : "light"}
      tint={direction.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {data.ambientParticles && (
          <AmbientParticles
            mode={isDark ? "dark" : "light"}
            density={15}
            speed={0.25}
            seed={77}
          />
        )}

        {!data.noDivider && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: splitPosition,
              height: layout.height,
              backgroundColor: leftAccent,
              opacity: 0.06,
              pointerEvents: "none",
            }}
          />
        )}

        {!data.noDivider && (
          <div
            style={{
              position: "absolute",
              left: splitPosition,
              top: 0,
              width: layout.width - splitPosition,
              height: layout.height,
              backgroundColor: rightAccent,
              opacity: 0.06,
              pointerEvents: "none",
            }}
          />
        )}

        <SplitSideContent
          side="left"
          data={data.left}
          frame={frame}
          totalFrames={totalFrames}
          isDark={isDark}
          splitPosition={splitPosition}
        />

        <SplitSideContent
          side="right"
          data={data.right}
          frame={frame}
          totalFrames={totalFrames}
          isDark={isDark}
          splitPosition={splitPosition}
        />

        {!data.noDivider && (
          <div
            style={{
              position: "absolute",
              left: splitPosition - 1,
              top: 0,
              width: 2,
              height: layout.height,
              opacity: exitOpacity,
            }}
          >
            {/* Divider with subtle accent glow + breath pulse */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: `${dividerProgress * 100}%`,
                background: `linear-gradient(to bottom, transparent, ${mode.text.muted}AA 40%, ${mode.text.muted}AA 60%, transparent)`,
                boxShadow: `0 0 ${8 + 4 * Math.sin(frame * 0.03)}px ${mode.text.muted}30`,
              }}
            />
          </div>
        )}

        {!data.noDivider && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: layout.spacing.lg,
              height: layout.spacing.lg,
              borderRadius: `${radii.pill}px`,
              border: `1px solid ${mode.text.accent}80`,
              backgroundColor: `${mode.bg.surface}E0`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fontSizes.label,
              fontWeight: fontWeights.semibold,
              color: mode.text.accent,
              fontFamily: fonts.display,
              opacity: labelOpacity,
              pointerEvents: "none",
              boxShadow: `0 0 12px ${mode.text.accent}30`,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
            {dividerLabel}
          </div>
        )}

        <MetadataStrip
          episodeNumber={data.episode ? parseInt(data.episode.replace(/\D/g, "")) : undefined}
          episodeTitle={data.title}
          variant={isDark ? "dark" : "light"}
          startFrame={60}
        />
      </AbsoluteFill>
      {/* Brand strips */}
      <HeaderStrip mode={isDark ? "dark" : "light"} metadata={data.episode} />
      <FooterStrip mode={isDark ? "dark" : "light"} />
    </Background>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// ██ Exported component — routes between modes
// ══════════════════════════════════════════════════════════════════════════

export const SplitComposition: React.FC<{ data: SplitCompositionData }> = ({
  data,
}) => {
  if (data.cinematicMode) {
    return <CinematicSplitComposition data={data} />;
  }
  return <StaticSplitComposition data={data} />;
};
