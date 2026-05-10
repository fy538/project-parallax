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
  textMaxWidth,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  stagger,
  exitFade,
  CLAMP,
  CLAMP_CUBIC,
  CLAMP_SINE,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { MetadataStrip } from "../../components/MetadataStrip";
import { AmbientParticles } from "../../components/AmbientParticles";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { usePhase } from "../../hooks/usePhase";
import { useTemplateLayout } from "../../hooks/useTemplateLayout";
import type { SplitCompositionData } from "./types";

// ── Helper: detect Chinese characters ───────────────────────────────────
const hasChinese = (text: string): boolean => {
  const chineseRegex = /[一-鿿㐀-䶿]/g;
  return chineseRegex.test(text);
};

const getFontFamily = (text: string): string => {
  return hasChinese(text) ? fonts.chinese : fonts.display;
};

interface SplitPanelRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const getSplitPanelRects = (
  contentRect: { top: number; left: number; width: number; height: number },
  centerX: number,
  sideInset = 40
): { left: SplitPanelRect; right: SplitPanelRect } => {
  const contentRight = contentRect.left + contentRect.width;
  return {
    left: {
      left: contentRect.left,
      top: contentRect.top,
      width: centerX - contentRect.left - sideInset,
      height: contentRect.height,
    },
    right: {
      left: centerX + sideInset,
      top: contentRect.top,
      width: contentRight - (centerX + sideInset),
      height: contentRect.height,
    },
  };
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
  // Pace-aware scaling for the per-phase duration. PACE: urgent compresses
  // each focus dwell; breathing extends contemplation.
  const t = direction.paceTimingScale;

  const isDark = data.backgroundVariant === "dark";
  const mode = isDark ? dark : light;

  const leftAccent = data.left.accentColor || semantic.us;
  const rightAccent = data.right.accentColor || semantic.china;
  const splitPosition = layout.width / 2;
  const { zones } = useTemplateLayout({
    title: "none",
    safeArea: "generous",
    footerHeight: 0,
    contentFooterGap: 0,
  });
  const splitPanels = useMemo(
    () => getSplitPanelRects(zones.content.rect, splitPosition),
    [splitPosition, zones.content.rect]
  );

  // Phase timing based on item counts
  const leftItemCount = data.left.items.length;
  const rightItemCount = data.right.items.length;

  const phases = useMemo(() => [
    { name: "intro", duration: sec(0.6 * t) },
    { name: "focusLeft", duration: sec((1.2 + leftItemCount * 0.5) * t) },
    { name: "transition", duration: sec(0.8 * t) },
    { name: "focusRight", duration: sec((1.2 + rightItemCount * 0.5) * t) },
    { name: "overview", duration: sec(2.5 * t) },
  ], [leftItemCount, rightItemCount, t]);

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
    CLAMP_SINE
  );

  const rightOpacity = interpolate(
    frame,
    [0, sec(0.3), transStart, transStart + sec(0.5), overviewStart, overviewStart + sec(0.5)],
    [0.15, 0.15, 0.15, 1, 1, 1],
    CLAMP_SINE
  );

  const leftBlur = interpolate(
    frame,
    [transStart, transStart + sec(0.4), overviewStart, overviewStart + sec(0.4)],
    [0, 2.5, 2.5, 0],
    CLAMP_SINE
  );

  const rightBlur = interpolate(
    frame,
    [0, transStart, transStart + sec(0.4)],
    [2, 2, 0],
    CLAMP_SINE
  );

  // ── Divider ─────────────────────────────────────────────────────────
  const dividerStart = getPhaseStart("transition");
  const dividerProgress = interpolate(
    frame,
    [dividerStart, dividerStart + sec(0.6)],
    [0, 1],
    CLAMP_CUBIC
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
              left: splitPanels.left.left,
              top: splitPanels.left.top,
              width: splitPanels.left.width,
              height: splitPanels.left.height,
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
                maxWidth: textMaxWidth.h2,
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
                  maxWidth: textMaxWidth.body,
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
              left: splitPanels.right.left,
              top: splitPanels.right.top,
              width: splitPanels.right.width,
              height: splitPanels.right.height,
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
                maxWidth: textMaxWidth.h2,
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
                  maxWidth: textMaxWidth.body,
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
  panelRect: SplitPanelRect;
}> = ({ side, data, frame, totalFrames, isDark, panelRect }) => {
  const mode = isDark ? dark : light;
  const isLeft = side === "left";

  const baseDelay = isLeft ? 10 : 40;
  const tagDelay = baseDelay;
  const titleDelay = baseDelay + 8;
  const itemBaseDelay = baseDelay + 16;

  const accentColor = data.accentColor || (isLeft ? semantic.us : semantic.china);

  // Magazine-spread treatment: each side reads naturally left-to-right
  // (no mirrored alignment), content vertically centers in its column,
  // first item gets pull-quote weight, subsequent items quieter. Page-
  // number-style roman ordinal (I / II) anchors each side as a "page".
  const ordinal = isLeft ? "I" : "II";

  const exitOpacity = exitFade(frame, totalFrames, 15);

  return (
    <div
      style={{
        position: "absolute",
        left: panelRect.left,
        top: panelRect.top,
        width: panelRect.width,
        height: panelRect.height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        opacity: exitOpacity,
      }}
    >
      {/* Kicker row — page-style ordinal + tag, with thin rule beneath */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: layout.spacing.md,
          marginBottom: layout.spacing.lg,
          paddingBottom: layout.spacing.sm,
          borderBottom: `1px solid ${mode.text.muted}40`,
          opacity: fadeIn(frame, tagDelay, sec(0.4)),
          transform: `translateY(${slideIn(frame, tagDelay, layout.spacing.xs, sec(0.4))}px)`,
        }}
      >
        <div
          style={{
            fontSize: fontSizes.h3,
            fontWeight: fontWeights.regular,
            color: mode.text.muted,
            fontFamily: fonts.heading,
            fontStyle: "italic",
            lineHeight: 1,
            maxWidth: textMaxWidth.label,
          }}
        >
          {ordinal}
        </div>
        {data.tag && (
          <div
            style={{
              fontSize: fontSizes.label,
              fontWeight: fontWeights.semibold,
              letterSpacing: letterSpacing.meta,
              textTransform: "uppercase",
              color: accentColor,
              fontFamily: fonts.mono,
              maxWidth: textMaxWidth.label,
            }}
          >
            {data.tag}
          </div>
        )}
      </div>

      <h2
        style={{
          fontSize: fontSizes.h1,
          fontWeight: fontWeights.bold,
          letterSpacing: letterSpacing.h2,
          color: mode.text.primary,
          textAlign: "left",
          margin: 0,
          marginBottom: data.subtitle ? layout.spacing.md : layout.spacing.lg,
          maxWidth: textMaxWidth.h1,
          fontFamily: getFontFamily(data.title),
          lineHeight: lineHeight.h2,
          opacity: fadeIn(frame, titleDelay, sec(0.5)),
          transform: `translateY(${slideIn(frame, titleDelay, layout.spacing.sm, sec(0.5))}px)`,
        }}
      >
        {data.title}
      </h2>

      {/* First item gets pull-quote treatment when there's no subtitle —
          it carries the definitional thrust of the side. With a subtitle,
          subtitle plays that role and items[0] is just the first bullet. */}
      {data.subtitle && (
        <div
          style={{
            fontSize: fontSizes.h3,
            maxWidth: textMaxWidth.body,
            fontWeight: fontWeights.regular,
            color: mode.text.secondary,
            textAlign: "left",
            marginBottom: layout.spacing.xl,
            fontFamily: getFontFamily(data.subtitle),
            fontStyle: "italic",
            lineHeight: 1.35,
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
          gap: layout.spacing.sm,
          alignItems: "flex-start",
        }}
      >
        {data.items.map((item: string, idx: number) => {
          const itemStartFrame = itemBaseDelay + stagger(idx, 8, 0);
          const itemOpacity = fadeIn(frame, itemStartFrame, sec(0.4));
          const itemOffset = slideIn(frame, itemStartFrame, 20, sec(0.4));
          const transform = isLeft
            ? `translateX(${itemOffset}px)`
            : `translateX(${-itemOffset}px)`;
          // First item in pull-quote weight when there's no subtitle to
          // carry that role; otherwise all items render at body weight.
          const isLeadItem = idx === 0 && !data.subtitle;

          return (
            <div
              key={idx}
              style={{
                position: "relative",
                paddingLeft: isLeadItem ? 0 : layout.spacing.md,
                fontSize: isLeadItem ? fontSizes.h3 : fontSizes.body,
                fontWeight: isLeadItem ? fontWeights.medium : fontWeights.regular,
                color: isLeadItem ? mode.text.primary : mode.text.secondary,
                fontFamily: getFontFamily(item),
                fontStyle: isLeadItem ? "italic" : "normal",
                lineHeight: 1.4,
                maxWidth: textMaxWidth.body,
                opacity: itemOpacity,
                transform,
                marginBottom: isLeadItem ? layout.spacing.md : 0,
              }}
            >
              {/* Subtle bullet glyph for non-lead items — a thin colored
                  marker rather than a circle, keeps the editorial feel. */}
              {!isLeadItem && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 12,
                    width: 6,
                    height: 1,
                    background: accentColor,
                    opacity: 0.6,
                  }}
                />
              )}
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
  const { zones } = useTemplateLayout({
    title: "none",
    safeArea: "generous",
    footerHeight: 0,
    contentFooterGap: 0,
  });
  const splitPanels = useMemo(
    () => getSplitPanelRects(zones.content.rect, splitPosition),
    [splitPosition, zones.content.rect]
  );

  const dividerStartFrame = 25;
  const dividerDuration = 15;
  const dividerProgress = interpolate(
    frame,
    [dividerStartFrame, dividerStartFrame + dividerDuration],
    [0, 1],
    CLAMP_CUBIC
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
              opacity: 0.1,
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
              opacity: 0.1,
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
          panelRect={splitPanels.left}
        />

        <SplitSideContent
          side="right"
          data={data.right}
          frame={frame}
          totalFrames={totalFrames}
          isDark={isDark}
          panelRect={splitPanels.right}
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
            {/* Magazine-spine divider — solid full-height rule, draws in
                from top, stronger color than the previous fading gradient. */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: `${dividerProgress * 100}%`,
                background: mode.text.muted,
                opacity: 0.45,
              }}
            />
          </div>
        )}

        {/* Spine pill (OR / VS) intentionally removed May 10, 2026.
            The magazine-spine divider + side-by-side layout already
            communicates binary opposition; the pill was redundant chrome
            that collided with subtitle text. `dividerLabel` field is kept
            on the data type for back-compat but no longer renders.
            If a future composition genuinely needs an explicit conjunction,
            put it in one side's tag/title rather than as floating chrome. */}
        {false && (
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              opacity: labelOpacity,
              pointerEvents: "none",
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
