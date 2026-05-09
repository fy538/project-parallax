/**
 * DuelingFrameworks — two analytical frameworks in head-to-head comparison.
 *
 * Two rendering modes:
 *
 * ═══ STATIC MODE (default, backward compatible) ═══
 * Five animation phases:
 * 1. Intro (~1s): Title + subtitle fade/slide in
 * 2. Framework A (~3s): Left side reveals — name, tenets (staggered), color-coded accent
 * 3. Framework B (~3s): Right side reveals — same treatment, right-aligned
 * 4. Scoring (~3s): Both visible, animated horizontal bars grow, verdict appears
 * 5. Exit (0.5s): Fade out
 *
 * ═══ CINEMATIC MODE (cinematicMode: true) ═══
 * Horizontal camera tracking with depth-of-field:
 * 1. Title fade (0.8s)
 * 2. Camera on Framework A (sequential tenet build with focus isolation)
 * 3. Pan to center VS clash (both partially visible, divider glows)
 * 4. Camera on Framework B (sequential tenet build)
 * 5. Pull back to overview (scoring phase, both frameworks visible)
 *
 * The cinematic mode uses a wider virtual canvas (2x viewport) with the camera
 * tracking horizontally. Non-focused elements are dimmed + blurred.
 *
 * Bilingual support in both modes.
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
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  lineHeight,
  layout,
  sec,
  shadows,
  radii,
  cardPresets,
  textMaxWidth,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  stagger,
  CLAMP,
  CLAMP_CUBIC,
  CLAMP_QUARTIC,
  CLAMP_SINE,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { TitleBlock } from "../../components/TitleBlock";
import { AmbientParticles } from "../../components/AmbientParticles";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useTemplateLayout } from "../../hooks/useTemplateLayout";
import { useThemeMode, type ThemeTokens } from "../../hooks/useThemeMode";
import { usePhase } from "../../hooks/usePhase";
import type { DuelingFrameworksData, Framework } from "./types";

// ── Helper: detect Chinese characters ───────────────────────────────────
const CHINESE_REGEX = /[一-鿿㐀-䶿]/;
const hasChinese = (text: string): boolean => CHINESE_REGEX.test(text);

// ── Helper: get appropriate font family ────────────────────────────────
const getFontFamily = (text: string): string => {
  return hasChinese(text) ? fonts.chinese : fonts.display;
};

// ── Helper: get secondary font (body) for bilingual content ─────────────
const getBodyFont = (text: string): string => {
  return hasChinese(text) ? fonts.chinese : fonts.body;
};

// ── ScoringBar component (animated horizontal bar with glow) ────────────
const ScoringBar: React.FC<{
  score: number;
  color: string;
  frame: number;
  startFrame: number;
  duration: number;
  theme: ThemeTokens;
}> = React.memo(({ score, color, frame, startFrame, duration, theme }) => {
  const barProgress = interpolate(
    frame,
    [startFrame, startFrame + duration],
    [0, score / 100],
    CLAMP_QUARTIC
  );

  const barWidth = barProgress * 100;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: 32,
        backgroundColor: "rgba(0,0,0,0.05)",
        border: "none",
        borderRadius: radii.xs,
        overflow: "hidden",
        marginBottom: layout.spacing.md,
        boxShadow: `inset 0 1px 2px rgba(0,0,0,0.08)`,
      }}
    >
      {/* Outer glow layer */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${barWidth}%`,
          backgroundColor: color,
          opacity: 0.3,
          filter: "blur(8px)",
          zIndex: 0,
        }}
      />
      {/* Bar fill — vertical gradient (light top → solid bottom) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          height: "100%",
          width: `${barWidth}%`,
          background: `linear-gradient(180deg, ${color}E0 0%, ${color} 100%)`,
          zIndex: 1,
          boxShadow: `inset 0 -1px 2px rgba(0,0,0,0.2), inset -1px 0 2px rgba(0,0,0,0.18)`,
        }}
      />
      {/* Specular highlight — thin bright line at top */}
      {barWidth > 1 && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 1,
            height: 1.5,
            width: `${barWidth}%`,
            background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.65) 50%, rgba(255,255,255,0.5) 70%, transparent 100%)`,
            zIndex: 2,
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          right: layout.spacing.md,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: fontSizes.label,
          fontWeight: fontWeights.bold,
          color: theme.text.primary,
          fontFamily: fonts.mono,
          zIndex: 3,
          opacity: fadeIn(frame, startFrame + duration * 0.5, sec(0.3)),
          textShadow: shadows.textLift,
        }}
      >
        {Math.round(score)}%
      </div>
    </div>
  );
});

// ── FrameworkPanel component (left or right side) ─────────────────────
const FrameworkPanel: React.FC<{
  side: "left" | "right";
  data: Framework;
  frame: number;
  startFrame: number;
  theme: ThemeTokens;
  isDimmed: boolean;
  isDark: boolean;
  /** Zone style from useTemplateLayout — no manual positioning needed */
  zoneStyle: React.CSSProperties;
}> = React.memo(({ side, data, frame, startFrame, theme, isDimmed, isDark, zoneStyle }) => {
  const isLeft = side === "left";
  const alignText: "left" | "right" = isLeft ? "left" : "right";

  const nameDelay = startFrame;
  const tenetBaseDelay = startFrame + sec(0.3);

  const contentOpacity = isDimmed ? 0.3 : 1;

  return (
    <div
      style={{
        ...zoneStyle,
        opacity: contentOpacity,
      }}
    >
      {/* Framework name */}
      <h3
        style={{
          fontSize: fontSizes.h2,
          fontWeight: fontWeights.bold,
          letterSpacing: letterSpacing.h2,
          color: data.color,
          textAlign: alignText,
          margin: 0,
          marginBottom: layout.spacing.md,
          maxWidth: textMaxWidth.h2,
          fontFamily: getFontFamily(data.name),
          lineHeight: lineHeight.h2,
          textShadow: shadows.textLift,
          opacity: fadeIn(frame, nameDelay, sec(0.4)),
          transform: `translateY(${slideIn(frame, nameDelay, 20, sec(0.4))}px)`,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {data.name}
      </h3>

      {/* Tenets (staggered list with inset cards) */}
      <div style={{ display: "flex", flexDirection: "column", gap: layout.spacing.sm }}>
        {data.tenets.map((tenet, idx) => {
          const tenetStart = stagger(idx, sec(0.12), tenetBaseDelay);
          const tenetOpacity = fadeIn(frame, tenetStart, sec(0.4));
          const tenetSlide = slideIn(frame, tenetStart, 16, sec(0.4));

          // Bilingual: when textCn is provided, render Chinese as primary (h3-ish)
          // and English at 60% size, muted, beneath. Otherwise single-line.
          const hasBilingual = !!tenet.textCn;
          return (
            <div
              key={idx}
              style={{
                ...cardPresets.inset(isDark),
                opacity: tenetOpacity,
                transform: isLeft
                  ? `translateX(${tenetSlide}px)`
                  : `translateX(${-tenetSlide}px)`,
                overflow: "hidden",
              }}
            >
              {hasBilingual ? (
                <>
                  <div
                    style={{
                      fontSize: fontSizes.body,
                      fontWeight: fontWeights.medium,
                      color: theme.text.primary,
                      fontFamily: fonts.chinese,
                      lineHeight: lineHeight.body,
                      textAlign: alignText,
                      textShadow: shadows.textLift,
                    }}
                  >
                    {tenet.textCn}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: Math.round(fontSizes.body * 0.6),
                      fontWeight: fontWeights.regular,
                      color: theme.text.muted,
                      fontFamily: fonts.body,
                      lineHeight: lineHeight.body,
                      textAlign: alignText,
                      textShadow: shadows.textLift,
                      opacity: 0.85,
                    }}
                  >
                    {tenet.text}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    fontSize: fontSizes.body,
                    fontWeight: fontWeights.regular,
                    color: theme.text.secondary,
                    fontFamily: getBodyFont(tenet.text),
                    lineHeight: lineHeight.body,
                    textAlign: alignText,
                    textShadow: shadows.textLift,
                  }}
                >
                  {tenet.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ══════════════════════════════════════════════════════════════════════════
// ██ CINEMATIC MODE — horizontal camera tracking
// ══════════════════════════════════════════════════════════════════════════

const CANVAS_WIDTH = layout.width * 2.2; // wide canvas for camera travel
const VIEWPORT_WIDTH = layout.width;
const VIEWPORT_HEIGHT = layout.height;

// Camera positions on the wide canvas
const CAMERA_POS = {
  frameworkA: VIEWPORT_WIDTH * 0.35,   // left third
  center: CANVAS_WIDTH / 2,            // dead center (VS moment)
  frameworkB: CANVAS_WIDTH - VIEWPORT_WIDTH * 0.35, // right third
  overview: CANVAS_WIDTH / 2,          // pulled back (zoomed out)
};

const CAMERA_ZOOM = {
  focused: 1.15,    // zoomed in on individual framework
  center: 1.0,      // neutral at VS moment
  overview: 0.72,   // pulled back to show both
};

const CinematicDuelingFrameworks: React.FC<{
  data: DuelingFrameworksData;
}> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle, exitOpacity } = useCompositionAnimation(direction.driftOptions);

  const isDark = data.backgroundVariant === "dark";
  const theme = useThemeMode(isDark ? "dark" : "light");
  const safe = layout.safeAreaTier.generous;

  // ── Phase timing (cinematic has longer individual phases) ───────────
  const tenetCountA = data.frameworkA.tenets.length;
  const tenetCountB = data.frameworkB.tenets.length;
  const frameworkADuration = sec(1.5 + tenetCountA * 0.6);
  const frameworkBDuration = sec(1.5 + tenetCountB * 0.6);

  const phases = useMemo(() => [
    { name: "title", duration: sec(0.8) },
    { name: "frameworkA", duration: frameworkADuration },
    { name: "vsClash", duration: sec(1.2) },
    { name: "frameworkB", duration: frameworkBDuration },
    { name: "overview", duration: sec(3.5) },
  ], [frameworkADuration, frameworkBDuration]);

  const { getPhaseStart, isPhase, isPast } = usePhase(phases);

  // ── Camera interpolation ────────────────────────────────────────────
  const cameraX = useMemo(() => {
    const titleEnd = getPhaseStart("frameworkA");
    const vsStart = getPhaseStart("vsClash");
    const fbStart = getPhaseStart("frameworkB");
    const overviewStart = getPhaseStart("overview");

    // Define keyframes: [frame, targetX]
    return interpolate(
      frame,
      [0, titleEnd, vsStart, vsStart + sec(0.6), fbStart, overviewStart, overviewStart + sec(0.8)],
      [CAMERA_POS.frameworkA, CAMERA_POS.frameworkA, CAMERA_POS.frameworkA, CAMERA_POS.center, CAMERA_POS.frameworkB, CAMERA_POS.frameworkB, CAMERA_POS.overview],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.25, 0.1, 0.25, 1) }
    );
  }, [frame, getPhaseStart]);

  const cameraZoom = useMemo(() => {
    const titleEnd = getPhaseStart("frameworkA");
    const vsStart = getPhaseStart("vsClash");
    const fbStart = getPhaseStart("frameworkB");
    const overviewStart = getPhaseStart("overview");

    return interpolate(
      frame,
      [0, titleEnd, vsStart, vsStart + sec(0.6), fbStart, overviewStart, overviewStart + sec(0.8)],
      [CAMERA_ZOOM.focused, CAMERA_ZOOM.focused, CAMERA_ZOOM.focused, CAMERA_ZOOM.center, CAMERA_ZOOM.focused, CAMERA_ZOOM.focused, CAMERA_ZOOM.overview],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.25, 0.1, 0.25, 1) }
    );
  }, [frame, getPhaseStart]);

  // Camera transform: translate canvas so cameraX is centered in viewport, apply zoom
  const translateX = -(cameraX - VIEWPORT_WIDTH / 2);
  const cameraTransform = `scale(${cameraZoom}) translateX(${translateX / cameraZoom}px)`;

  // ── Focus isolation ─────────────────────────────────────────────────
  const getFrameworkOpacity = (side: "A" | "B"): number => {
    if (isPhase("frameworkA")) return side === "A" ? 1 : 0.15;
    if (isPhase("vsClash")) return 0.7;
    if (isPhase("frameworkB")) return side === "B" ? 1 : 0.15;
    if (isPast("frameworkB")) return 1; // overview: both visible
    return 0.5; // title phase
  };

  const getFrameworkBlur = (side: "A" | "B"): number => {
    if (isPhase("frameworkA")) return side === "A" ? 0 : 2;
    if (isPhase("frameworkB")) return side === "B" ? 0 : 2;
    return 0;
  };

  const getFrameworkScale = (side: "A" | "B"): number => {
    if (isPhase("frameworkA") && side === "A") return 1.02;
    if (isPhase("frameworkB") && side === "B") return 1.02;
    return 1;
  };

  // ── Layout positions on wide canvas ─────────────────────────────────
  const panelWidth = VIEWPORT_WIDTH * 0.4;
  const frameworkALeft = CANVAS_WIDTH * 0.15;
  const frameworkBLeft = CANVAS_WIDTH * 0.55;
  const dividerLeft = CANVAS_WIDTH / 2;

  // ── Scoring phase ─────────────────────────────────────────────────
  const scoringStartFrame = getPhaseStart("overview") + sec(0.5);

  // ── Divider animation ─────────────────────────────────────────────
  const dividerStart = getPhaseStart("vsClash");
  const dividerProgress = interpolate(
    frame,
    [dividerStart, dividerStart + sec(0.6)],
    [0, 1],
    CLAMP_CUBIC
  );

  // VS text pulse
  const vsPulse = isPhase("vsClash")
    ? 1 + 0.08 * Math.sin((frame - dividerStart) * 0.15)
    : 1;

  return (
    <Background
      variant={isDark ? "dark" : "light"}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
      tint={direction.backgroundTint}
    >
      <AbsoluteFill style={compStyle}>
        {/* Ambient particles for depth */}
        {data.ambientParticles !== false && (
          <AmbientParticles
            mode={isDark ? "dark" : "light"}
            density={18}
            speed={0.3}
            seed={42}
          />
        )}

        {/* Camera viewport — clips to screen size, transforms the wide canvas */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: CANVAS_WIDTH,
              height: VIEWPORT_HEIGHT,
              transform: cameraTransform,
              transformOrigin: `${VIEWPORT_WIDTH / 2}px ${VIEWPORT_HEIGHT / 2}px`,
              willChange: "transform",
            }}
          >
            {/* Framework A panel */}
            <div
              style={{
                position: "absolute",
                left: frameworkALeft,
                top: safe.top + 80,
                width: panelWidth,
                opacity: getFrameworkOpacity("A") * exitOpacity,
                filter: getFrameworkBlur("A") > 0 ? `blur(${getFrameworkBlur("A")}px)` : undefined,
                transform: `scale(${getFrameworkScale("A")})`,
                transition: "filter 0.3s, opacity 0.3s",
              }}
            >
              <h3
                style={{
                  fontSize: fontSizes.h2,
                  fontWeight: fontWeights.bold,
                  letterSpacing: letterSpacing.h2,
                  color: data.frameworkA.color,
                  margin: 0,
                  marginBottom: layout.spacing.lg,
                  maxWidth: textMaxWidth.h2,
                  fontFamily: getFontFamily(data.frameworkA.name),
                  lineHeight: lineHeight.h2,
                  textShadow: shadows.textLift,
                  opacity: fadeIn(frame, getPhaseStart("frameworkA"), sec(0.4)),
                  transform: `translateY(${slideIn(frame, getPhaseStart("frameworkA"), 20, sec(0.4))}px)`,
                }}
              >
                {data.frameworkA.name}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: layout.spacing.sm }}>
                {data.frameworkA.tenets.map((tenet, idx) => {
                  const tenetStart = stagger(idx, sec(0.35), getPhaseStart("frameworkA") + sec(0.4));
                  return (
                    <div
                      key={idx}
                      style={{
                        ...cardPresets.inset(isDark),
                        opacity: fadeIn(frame, tenetStart, sec(0.5)),
                        transform: `translateX(${slideIn(frame, tenetStart, 24, sec(0.5))}px)`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: fontSizes.body,
                          fontWeight: fontWeights.regular,
                          color: theme.text.secondary,
                          fontFamily: getBodyFont(tenet.text),
                          lineHeight: lineHeight.body,
                          textShadow: shadows.textLift,
                        }}
                      >
                        {tenet.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Center divider + VS — dramatic 2× thickness + accent glow during clash */}
            {(() => {
              // Brief 0.3s window where divider grows 2× thick with accent glow,
              // starting at the VS clash moment (just before camera pans to B).
              const clashStart = dividerStart + sec(0.4);
              const clashScale = interpolate(
                frame,
                [clashStart, clashStart + sec(0.15), clashStart + sec(0.3), clashStart + sec(0.6)],
                [1, 2, 2, 1],
                CLAMP_SINE
              );
              const clashGlow = interpolate(
                frame,
                [clashStart, clashStart + sec(0.15), clashStart + sec(0.3), clashStart + sec(0.6)],
                [0, 1, 1, 0],
                CLAMP_SINE
              );
              return (
                <div
                  style={{
                    position: "absolute",
                    left: dividerLeft - 1,
                    top: 0,
                    width: 2 * clashScale,
                    height: VIEWPORT_HEIGHT,
                    opacity: dividerProgress * exitOpacity,
                    boxShadow: clashGlow > 0 ? `0 0 ${24 * clashGlow}px ${theme.text.accent}${Math.round(clashGlow * 200).toString(16).padStart(2, "0")}` : undefined,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      width: "100%",
                      height: "100%",
                      background: `linear-gradient(to bottom, transparent, ${theme.text.muted}${clashGlow > 0.5 ? "CC" : "66"}, transparent)`,
                    }}
                  />
                  {/* VS badge */}
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "50%",
                      transform: `translate(-50%, -50%) scale(${vsPulse})`,
                      fontSize: fontSizes.h2,
                      fontWeight: fontWeights.bold,
                      color: theme.text.accent,
                      fontFamily: fonts.display,
                      letterSpacing: letterSpacing.h1,
                      maxWidth: textMaxWidth.h2,
                      textShadow: `0 0 ${20 + clashGlow * 30}px ${theme.text.accent}${clashGlow > 0.5 ? "80" : "40"}`,
                      opacity: fadeIn(frame, dividerStart + sec(0.2), sec(0.4)),
                    }}
                  >
                    VS
                  </div>
                </div>
              );
            })()}

            {/* Framework B panel */}
            <div
              style={{
                position: "absolute",
                left: frameworkBLeft,
                top: safe.top + 80,
                width: panelWidth,
                opacity: getFrameworkOpacity("B") * exitOpacity,
                filter: getFrameworkBlur("B") > 0 ? `blur(${getFrameworkBlur("B")}px)` : undefined,
                transform: `scale(${getFrameworkScale("B")})`,
                transition: "filter 0.3s, opacity 0.3s",
              }}
            >
              <h3
                style={{
                  fontSize: fontSizes.h2,
                  fontWeight: fontWeights.bold,
                  letterSpacing: letterSpacing.h2,
                  color: data.frameworkB.color,
                  margin: 0,
                  marginBottom: layout.spacing.lg,
                  maxWidth: textMaxWidth.h2,
                  fontFamily: getFontFamily(data.frameworkB.name),
                  lineHeight: lineHeight.h2,
                  textShadow: shadows.textLift,
                  opacity: fadeIn(frame, getPhaseStart("frameworkB"), sec(0.4)),
                  transform: `translateY(${slideIn(frame, getPhaseStart("frameworkB"), 20, sec(0.4))}px)`,
                }}
              >
                {data.frameworkB.name}
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: layout.spacing.sm }}>
                {data.frameworkB.tenets.map((tenet, idx) => {
                  const tenetStart = stagger(idx, sec(0.35), getPhaseStart("frameworkB") + sec(0.4));
                  return (
                    <div
                      key={idx}
                      style={{
                        ...cardPresets.inset(isDark),
                        opacity: fadeIn(frame, tenetStart, sec(0.5)),
                        transform: `translateX(${slideIn(frame, tenetStart, -24, sec(0.5))}px)`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: fontSizes.body,
                          fontWeight: fontWeights.regular,
                          color: theme.text.secondary,
                          fontFamily: getBodyFont(tenet.text),
                          lineHeight: lineHeight.body,
                          textShadow: shadows.textLift,
                          textAlign: "right",
                        }}
                      >
                        {tenet.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scoring (only in overview phase) */}
            {isPast("frameworkB") && (
              <div
                style={{
                  position: "absolute",
                  left: frameworkALeft,
                  bottom: safe.bottom + 20,
                  width: frameworkBLeft + panelWidth - frameworkALeft,
                  opacity: exitOpacity,
                }}
              >
                <div
                  style={{
                    fontSize: fontSizes.body,
                    fontWeight: fontWeights.semibold,
                    color: theme.text.muted,
                    letterSpacing: letterSpacing.label,
                    textTransform: "uppercase",
                    marginBottom: layout.spacing.md,
                    fontFamily: getBodyFont(data.phenomenon),
                    opacity: fadeIn(frame, scoringStartFrame, sec(0.3)),
                    textAlign: "center",
                  }}
                >
                  {data.phenomenon}
                </div>

                <div style={{ display: "flex", gap: layout.spacing.xl }}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: fontSizes.label,
                        fontWeight: fontWeights.semibold,
                        color: data.frameworkA.color,
                        marginBottom: layout.spacing.sm,
                        fontFamily: getFontFamily(data.frameworkA.name),
                      }}
                    >
                      {data.frameworkA.name}
                    </div>
                    <ScoringBar
                      score={data.frameworkA.score}
                      color={data.frameworkA.color}
                      frame={frame}
                      startFrame={scoringStartFrame + sec(0.2)}
                      duration={sec(1.5)}
                      theme={theme}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: fontSizes.label,
                        fontWeight: fontWeights.semibold,
                        color: data.frameworkB.color,
                        marginBottom: layout.spacing.sm,
                        fontFamily: getFontFamily(data.frameworkB.name),
                        textAlign: "right",
                      }}
                    >
                      {data.frameworkB.name}
                    </div>
                    <ScoringBar
                      score={data.frameworkB.score}
                      color={data.frameworkB.color}
                      frame={frame}
                      startFrame={scoringStartFrame + sec(0.35)}
                      duration={sec(1.5)}
                      theme={theme}
                    />
                  </div>
                </div>

                {data.verdictLabel && (
                  <div
                    style={{
                      fontSize: fontSizes.body,
                      fontWeight: fontWeights.semibold,
                      color: theme.text.accent,
                      fontFamily: getBodyFont(data.verdictLabel),
                      marginTop: layout.spacing.lg,
                      textAlign: "center",
                      opacity: fadeIn(frame, scoringStartFrame + sec(2), sec(0.4)),
                    }}
                  >
                    {data.verdictLabel}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Title overlay (stays in viewport space, not on wide canvas) */}
        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={isDark ? "dark" : "light"}
          safeAreaTier="generous"
        />
      </AbsoluteFill>
      {/* Brand strips */}
      <HeaderStrip mode={isDark ? "dark" : "light"} metadata={data.episode} />
      <FooterStrip mode={isDark ? "dark" : "light"} />
    </Background>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// ██ STATIC MODE — original phase-based animation (backward compatible)
// ══════════════════════════════════════════════════════════════════════════

const StaticDuelingFrameworks: React.FC<{
  data: DuelingFrameworksData;
}> = ({ data }) => {
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle, exitOpacity } = useCompositionAnimation(direction.driftOptions);

  const isDark = data.backgroundVariant === "dark";
  const theme = useThemeMode(isDark ? "dark" : "light");

  const { zones } = useTemplateLayout({
    title: "content",
    safeArea: "generous",
    split: true,
    footerHeight: 40,
  });

  const phases = [
    { name: "intro", duration: sec(1) },
    { name: "frameworkA", duration: sec(3) },
    { name: "frameworkB", duration: sec(3) },
    { name: "scoring", duration: sec(3) },
  ];

  const { getPhaseStart, isPhase, isPast } = usePhase(phases);

  let frameworkAOpacity = 1;
  let frameworkBOpacity = 1;

  if (isPhase("frameworkA")) {
    frameworkBOpacity = 0.3;
  } else if (isPhase("frameworkB")) {
    frameworkAOpacity = 0.3;
  }

  const dividerStartFrame = getPhaseStart("frameworkA") + sec(0.5);
  const dividerProgress = interpolate(
    frame,
    [dividerStartFrame, dividerStartFrame + sec(1)],
    [0, 1],
    CLAMP_CUBIC
  );

  const scoringStartFrame = getPhaseStart("scoring");
  const splitPosition = layout.width / 2;

  return (
    <Background
      variant={isDark ? "dark" : "light"}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
      tint={direction.backgroundTint}
    >
      <AbsoluteFill style={compStyle}>
        {data.ambientParticles && (
          <AmbientParticles
            mode={isDark ? "dark" : "light"}
            density={15}
            speed={0.25}
            seed={42}
          />
        )}

        <div
          style={{
            position: "absolute",
            left: splitPosition,
            top: 0,
            width: 2,
            height: layout.height,
            opacity: exitOpacity,
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: "100%",
              height: `${dividerProgress * 100}%`,
              background: `linear-gradient(to bottom, transparent, ${theme.text.muted}66, transparent)`,
            }}
          />
        </div>

        <div style={{ opacity: frameworkAOpacity * exitOpacity }}>
          <FrameworkPanel
            side="left"
            data={data.frameworkA}
            frame={frame}
            startFrame={getPhaseStart("frameworkA")}
            theme={theme}
            isDimmed={isPhase("frameworkB")}
            isDark={isDark}
            zoneStyle={zones.left.style}
          />
        </div>

        <div style={{ opacity: frameworkBOpacity * exitOpacity }}>
          <FrameworkPanel
            side="right"
            data={data.frameworkB}
            frame={frame}
            startFrame={getPhaseStart("frameworkB")}
            theme={theme}
            isDimmed={isPhase("frameworkA")}
            isDark={isDark}
            zoneStyle={zones.right.style}
          />
        </div>

        {isPast("frameworkB") && (
          <div
            style={{
              position: "absolute",
              bottom: zones.footer.rect.bottom,
              left: zones.footer.rect.left,
              width: zones.footer.rect.width,
              opacity: exitOpacity,
            }}
          >
            <div
              style={{
                fontSize: fontSizes.body,
                fontWeight: fontWeights.semibold,
                color: theme.text.muted,
                letterSpacing: letterSpacing.label,
                textTransform: "uppercase",
                marginBottom: layout.spacing.lg,
                fontFamily: getBodyFont(data.phenomenon),
                opacity: fadeIn(frame, scoringStartFrame, sec(0.3)),
              }}
            >
              {data.phenomenon}
            </div>

            <div style={{ display: "flex", gap: layout.spacing.xl, marginBottom: layout.spacing.xl }}>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: fontSizes.label,
                    fontWeight: fontWeights.semibold,
                    color: data.frameworkA.color,
                    marginBottom: layout.spacing.sm,
                    fontFamily: getFontFamily(data.frameworkA.name),
                  }}
                >
                  {data.frameworkA.name}
                </div>
                <ScoringBar
                  score={data.frameworkA.score}
                  color={data.frameworkA.color}
                  frame={frame}
                  startFrame={scoringStartFrame + sec(0.2)}
                  duration={sec(1.5)}
                  theme={theme}
                />
                {data.frameworkA.verdict && (
                  <div
                    style={{
                      fontSize: fontSizes.caption,
                      color: theme.text.secondary,
                      fontFamily: getBodyFont(data.frameworkA.verdict),
                      lineHeight: lineHeight.body,
                      marginTop: layout.spacing.sm,
                      opacity: fadeIn(frame, scoringStartFrame + sec(1.5), sec(0.4)),
                    }}
                  >
                    {data.frameworkA.verdict}
                  </div>
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: fontSizes.label,
                    fontWeight: fontWeights.semibold,
                    color: data.frameworkB.color,
                    marginBottom: layout.spacing.sm,
                    fontFamily: getFontFamily(data.frameworkB.name),
                  }}
                >
                  {data.frameworkB.name}
                </div>
                <ScoringBar
                  score={data.frameworkB.score}
                  color={data.frameworkB.color}
                  frame={frame}
                  startFrame={scoringStartFrame + sec(0.35)}
                  duration={sec(1.5)}
                  theme={theme}
                />
                {data.frameworkB.verdict && (
                  <div
                    style={{
                      fontSize: fontSizes.caption,
                      color: theme.text.secondary,
                      fontFamily: getBodyFont(data.frameworkB.verdict),
                      lineHeight: lineHeight.body,
                      marginTop: layout.spacing.sm,
                      opacity: fadeIn(frame, scoringStartFrame + sec(1.65), sec(0.4)),
                    }}
                  >
                    {data.frameworkB.verdict}
                  </div>
                )}
              </div>
            </div>

            {data.verdictLabel && (
              <div
                style={{
                  fontSize: fontSizes.body,
                  fontWeight: fontWeights.semibold,
                  color: theme.text.accent,
                  fontFamily: getBodyFont(data.verdictLabel),
                  marginTop: layout.spacing.lg,
                  paddingTop: layout.spacing.lg,
                  borderTop: `1px solid ${theme.text.muted}40`,
                  opacity: fadeIn(frame, scoringStartFrame + sec(2), sec(0.4)),
                }}
              >
                {data.verdictLabel}
              </div>
            )}
          </div>
        )}

        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={isDark ? "dark" : "light"}
          safeAreaTier="generous"
        />

        {data.episode && (
          <div
            style={{
              position: "absolute",
              bottom: zones.footer.rect.bottom,
              left: zones.footer.rect.left,
              fontSize: fontSizes.label,
              color: theme.text.muted,
              letterSpacing: letterSpacing.label,
              textTransform: "uppercase",
              opacity: fadeIn(frame, 0, sec(0.8)),
              transform: `translateY(${slideIn(frame, 0, 10, sec(0.8))}px)`,
              fontFamily: fonts.mono,
            }}
          >
            {data.episode}
          </div>
        )}
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

export const DuelingFrameworks: React.FC<{ data: DuelingFrameworksData }> = ({
  data,
}) => {
  if (data.cinematicMode) {
    return <CinematicDuelingFrameworks data={data} />;
  }
  return <StaticDuelingFrameworks data={data} />;
};
