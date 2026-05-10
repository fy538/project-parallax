/**
 * StaticDuelingFrameworks — original phase-based animation mode for DuelingFrameworks.
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
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
  textMaxWidth,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  CLAMP_CUBIC,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { TitleBlock } from "../../components/TitleBlock";
import { AmbientParticles } from "../../components/AmbientParticles";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useTemplateLayout } from "../../hooks/useTemplateLayout";
import { useThemeMode } from "../../hooks/useThemeMode";
import { usePhase } from "../../hooks/usePhase";
import type { DuelingFrameworksData } from "./types";
import { getFontFamily, getBodyFont } from "./dueling-utils";
import { ScoringBar, FrameworkPanel } from "./DuelingPanels";

export const StaticDuelingFrameworks: React.FC<{
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
  // Scoring phase no longer dims tenets — tenets stay full-opacity throughout
  // because the scoring section has been simplified (score bars + arbitrary
  // percentages dropped May 10, 2026; only the verdict captions + final
  // verdict question remain, which fit comfortably below the tenet cards).

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

        {/* Scoring phase — simplified May 10, 2026. Score bars + arbitrary
            percentages dropped (they implied quantitative judgment that was
            never measured; the verdict text already does the editorial job).
            What remains: per-framework verdict captions ("Explains the tempo
            and timing"), and the final verdict question as an editorial
            kicker at the bottom. Sits in the footer zone, comfortably below
            the tenets — no opacity hacks needed. */}
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
            <div style={{ display: "flex", gap: layout.spacing.xl, marginBottom: layout.spacing.lg }}>
              <div style={{ flex: 1 }}>
                {data.frameworkA.verdict && (
                  <div
                    style={{
                      fontSize: fontSizes.body,
                      maxWidth: textMaxWidth.body,
                      color: data.frameworkA.color,
                      fontFamily: getBodyFont(data.frameworkA.verdict),
                      fontStyle: "italic",
                      lineHeight: 1.35,
                      opacity: fadeIn(frame, scoringStartFrame + sec(0.2), sec(0.4)),
                    }}
                  >
                    {data.frameworkA.verdict}
                  </div>
                )}
              </div>
              <div style={{ flex: 1 }}>
                {data.frameworkB.verdict && (
                  <div
                    style={{
                      fontSize: fontSizes.body,
                      maxWidth: textMaxWidth.body,
                      color: data.frameworkB.color,
                      fontFamily: getBodyFont(data.frameworkB.verdict),
                      fontStyle: "italic",
                      lineHeight: 1.35,
                      opacity: fadeIn(frame, scoringStartFrame + sec(0.35), sec(0.4)),
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
                  fontSize: fontSizes.h3,
                  maxWidth: textMaxWidth.body,
                  fontWeight: fontWeights.semibold,
                  color: theme.text.primary,
                  fontFamily: getBodyFont(data.verdictLabel),
                  fontStyle: "italic",
                  marginTop: layout.spacing.lg,
                  paddingTop: layout.spacing.lg,
                  borderTop: `1px solid ${theme.text.muted}40`,
                  opacity: fadeIn(frame, scoringStartFrame + sec(0.6), sec(0.4)),
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
