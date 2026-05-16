/**
 * CinematicDuelingFrameworks — horizontal camera tracking mode for DuelingFrameworks.
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
  textMaxWidth,
  layout,
  sec,
  shadows,
  cardPresets,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  stagger,
  CLAMP_CUBIC,
  CLAMP_SINE,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { TitleBlock } from "../../components/TitleBlock";
import { AmbientParticles } from "../../components/AmbientParticles";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { usePhase } from "../../hooks/usePhase";
import type { DuelingFrameworksData } from "./types";
import {
  getFontFamily,
  getBodyFont,
  CANVAS_WIDTH,
  VIEWPORT_WIDTH,
  VIEWPORT_HEIGHT,
  CAMERA_POS,
  CAMERA_ZOOM,
} from "./dueling-utils";
import { ScoringBar } from "./DuelingPanels";

export const CinematicDuelingFrameworks: React.FC<{
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
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
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
                          maxWidth: textMaxWidth.body,
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
                      textShadow: `0 0 ${20 + clashGlow * 30}px ${theme.text.accent}${clashGlow > 0.5 ? "80" : "40"}`, // shadows.accentGlow animated (dynamic size + opacity)
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
                          maxWidth: textMaxWidth.body,
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
                    maxWidth: textMaxWidth.label,
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
                      isDark={isDark}
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
                      isDark={isDark}
                    />
                  </div>
                </div>

                {data.verdictLabel && (
                  <div
                    style={{
                      fontSize: fontSizes.body,
                      maxWidth: textMaxWidth.label,
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
          syncPoints={direction.syncPoints}
        />
      </AbsoluteFill>
      {/* Brand strips */}
      <HeaderStrip mode={isDark ? "dark" : "light"} metadata={data.episode} />
      <FooterStrip mode={isDark ? "dark" : "light"} />
    </Background>
  );
};
