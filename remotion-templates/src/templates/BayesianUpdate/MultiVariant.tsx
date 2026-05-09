/**
 * MultiVariant — the multi-hypothesis probability bars variant of BayesianUpdate.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
} from "remotion";
import {
  palette,
  semantic,
  fonts,
  fontSizes,
  layout,
  sec,
  shadows,
  contentArea,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  exitFade,
  CLAMP_CUBIC_INOUT,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { EvidenceCard, HypothesisBar } from "./BayesianPanels";
import { computeMultiHypothesisStates } from "./bayesian-utils";
import type { BayesianUpdateData } from "./types";

export const MultiVariant: React.FC<{
  data: BayesianUpdateData;
  theme: ReturnType<typeof useThemeMode>;
  frame: number;
  durationInFrames: number;
  area: ReturnType<typeof contentArea>;
  compStyle: React.CSSProperties;
}> = React.memo(
  ({ data, theme, frame, durationInFrames, area, compStyle }) => {
    if (!data.multiHypotheses || data.multiHypotheses.length === 0) {
      return null;
    }

    // Color palette for auto-assignment
    const colorPalette = [
      palette.amber,
      semantic.us,
      semantic.china,
      palette.rust,
      palette.bronze,
      semantic.highlight,
    ];

    // Get colors for each hypothesis
    const hypothesisColors = data.multiHypotheses.map(
      (h, i) => h.color || colorPalette[i % colorPalette.length]
    );

    // Extract initial probabilities
    const priors = data.multiHypotheses.map(h => h.prior);

    // Compute states
    const states = useMemo(
      () => computeMultiHypothesisStates(priors, data.evidence),
      [priors, data.evidence]
    );

    // Timing
    const evidenceCount = data.evidence.length;
    const introFrames = sec(1.5);
    const perEvidenceFrames = sec(1.8);

    // Current probabilities (interpolated)
    const currentProbs = useMemo(() => {
      const evidenceFrame = frame - introFrames;
      if (evidenceFrame <= 0) return states[0].probabilities;

      const evidenceIndex = Math.floor(evidenceFrame / perEvidenceFrames);
      const evidenceT = (evidenceFrame % perEvidenceFrames) / perEvidenceFrames;

      if (evidenceIndex >= evidenceCount) {
        return states[states.length - 1].probabilities;
      }

      const from = states[evidenceIndex].probabilities;
      const to = states[evidenceIndex + 1].probabilities;
      const t = interpolate(evidenceT, [0, 0.6], [0, 1], CLAMP_CUBIC_INOUT);

      return from.map((f, i) => f + (to[i] - f) * t);
    }, [frame, introFrames, perEvidenceFrames, evidenceCount, states]);

    // Entrance animation
    const barsEnterOpacity = fadeIn(frame, 0, sec(0.8));
    const barsEnterScale = interpolate(
      frame,
      [0, sec(1.0)],
      [0.95, 1],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );

    const multiMode = data.backgroundVariant || "light";

    return (
      <Background
        variant={multiMode}
        tint={undefined}
        atmosphere="subtle"
      >
        <AbsoluteFill style={compStyle}>
          {/* Background atmosphere covers ambient particles by default */}
          {/* Title */}
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={data.backgroundVariant}
            safeAreaTier="generous"
          />

          {/* Main content area */}
          <div
            style={{
              position: "absolute",
              top: area.top,
              left: area.left,
              right: area.right,
              bottom: area.bottom,
              display: "flex",
              gap: layout.spacing.xl,
            }}
          >
            {/* Bars section (left) */}
            <div
              style={{
                flex: 1,
                opacity: barsEnterOpacity,
                transform: `scale(${barsEnterScale})`,
                transformOrigin: "center top",
              }}
            >
              {/* Intro label */}
              {data.question && (
                <div
                  style={{
                    fontSize: fontSizes.caption,
                    color: theme.text.secondary,
                    fontFamily: fonts.mono,
                    marginBottom: layout.spacing.lg,
                    textShadow: shadows.textLift,
                    opacity: fadeIn(frame, sec(0.3), sec(0.5)),
                  }}
                >
                  {data.question}
                </div>
              )}

              {/* Hypothesis bars */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                }}
              >
                {(() => {
                  // Identify the leading hypothesis (highest current probability)
                  const leadingIdx = currentProbs.reduce(
                    (best, p, i) => (p > currentProbs[best] ? i : best),
                    0
                  );
                  return data.multiHypotheses.map((h, i) => (
                    <HypothesisBar
                      key={i}
                      label={h.label}
                      probability={currentProbs[i]}
                      color={hypothesisColors[i]}
                      theme={theme}
                      isLeading={i === leadingIdx}
                    />
                  ));
                })()}
              </div>

              {/* Hypothesis legend */}
              <div
                style={{
                  marginTop: layout.spacing.lg,
                  opacity: fadeIn(frame, sec(0.4), sec(0.5)),
                  display: "flex",
                  flexWrap: "wrap",
                  gap: layout.spacing.md,
                }}
              >
                {data.multiHypotheses.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: layout.spacing.xs,
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: hypothesisColors[i],
                        boxShadow: `0 0 4px ${hypothesisColors[i]}60`,
                      }}
                    />
                    <div
                      style={{
                        fontSize: fontSizes.meta,
                        color: theme.text.secondary,
                        fontFamily: fonts.mono,
                        textShadow: shadows.textLift,
                      }}
                    >
                      {h.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Evidence panel (right) */}
            <div
              style={{
                width: 300,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: fontSizes.label,
                  color: theme.text.muted,
                  fontFamily: fonts.mono,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: layout.spacing.md,
                  textShadow: shadows.textLift,
                  opacity: fadeIn(frame, sec(0.8), sec(0.5)),
                }}
              >
                EVIDENCE
              </div>

              {data.evidence.map((item, i) => {
                const itemStart = introFrames + i * perEvidenceFrames;
                return (
                  <EvidenceCard
                    key={i}
                    item={item}
                    index={i}
                    frame={frame}
                    startFrame={itemStart}
                    theme={theme}
                  />
                );
              })}

              {/* Prior summary */}
              <div
                style={{
                  marginTop: layout.spacing.lg,
                  opacity: fadeIn(frame, sec(0.5), sec(0.5)),
                }}
              >
                <div
                  style={{
                    fontSize: fontSizes.meta,
                    color: theme.text.muted,
                    fontFamily: fonts.mono,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: layout.spacing.xs,
                    textShadow: shadows.textLift,
                  }}
                >
                  DISTRIBUTION SHIFT
                </div>
                <div
                  style={{
                    fontSize: fontSizes.caption,
                    color: theme.text.secondary,
                    fontFamily: fonts.data,
                    textShadow: shadows.textLift,
                  }}
                >
                  {data.multiHypotheses[0].label}:{" "}
                  {Math.round(states[0].probabilities[0])}% →{" "}
                  {Math.round(currentProbs[0])}%
                </div>
              </div>
            </div>
          </div>

          {/* Source attribution */}
          {data.source && (
            <div
              style={{
                position: "absolute",
                bottom: layout.safeAreaTier.generous.bottom,
                right: layout.safeAreaTier.generous.right,
                fontSize: fontSizes.meta,
                color: theme.text.muted,
                fontFamily: fonts.mono,
                opacity: Math.min(
                  fadeIn(frame, sec(1), sec(0.5)),
                  exitFade(frame, durationInFrames, 15)
                ),
                textShadow: shadows.textLift,
              }}
            >
              {data.source}
            </div>
          )}
        </AbsoluteFill>
      </Background>
    );
  }
);
