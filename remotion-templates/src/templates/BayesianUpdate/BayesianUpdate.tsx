/**
 * BayesianUpdate — animated probability distribution curve.
 *
 * Visualizes Bayesian reasoning: a bell curve starts at the prior,
 * then morphs as evidence items arrive sequentially. Each piece of
 * evidence shifts the distribution's mean and tightens or widens its
 * spread. Evidence cards fade in from the side as the curve animates.
 *
 * The distribution is rendered as a filled SVG path using a Gaussian
 * approximation. The x-axis represents probability (0-100%), the
 * curve height represents belief density.
 *
 * Single variant: one distribution shifting.
 * Compare variant: two overlapping distributions for competing hypotheses.
 * Multi variant: 3-6 competing hypotheses shown as animated horizontal probability bars.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import {
  palette,
  semantic,
  fonts,
  fontSizes,
  layout,
  sec,
  contentArea,
  shadows,
  radii,
  cardPresets,
  textMaxWidth,
} from "../../design/theme";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  exitFade,
  heroSpring,
  pulse,
  anticipatoryStartFrame,
  CLAMP,
  CLAMP_CUBIC,
  CLAMP_CUBIC_INOUT,
} from "../../utils/animation";
import { AmbientParticles } from "../../components/AmbientParticles";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection, type DirectionSyncPoint } from "../../hooks/useDirection";
import { useBeatSync } from "../../hooks/useBeatSync";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { TitleBlock } from "../../components/TitleBlock";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import type { BayesianUpdateData, EvidenceItem } from "./types";

// ── Gaussian curve generation ──────────────────────────────────────────────

function gaussian(x: number, mean: number, std: number): number {
  const exp = -0.5 * ((x - mean) / std) ** 2;
  return Math.exp(exp) / (std * Math.sqrt(2 * Math.PI));
}

function generateCurvePath(
  mean: number,
  std: number,
  width: number,
  height: number,
  steps: number = 200
): string {
  const points: string[] = [];
  const maxY = gaussian(mean, mean, std); // peak height

  for (let i = 0; i <= steps; i++) {
    const prob = (i / steps) * 100; // 0-100 probability
    const x = (prob / 100) * width;
    const y = height - (gaussian(prob, mean, std) / maxY) * height * 0.85;
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  // Close the path along the bottom
  return `M 0,${height} L ${points.join(" L ")} L ${width},${height} Z`;
}

// ── Evidence state computation ─────────────────────────────────────────────

interface DistributionState {
  mean: number;
  std: number;
}

interface MultiHypothesisState {
  probabilities: number[];
}

// For multi variant: compute how probabilities shift across hypotheses
function computeMultiHypothesisStates(
  priors: number[],
  evidence: EvidenceItem[]
): MultiHypothesisState[] {
  const states: MultiHypothesisState[] = [];

  // State 0: initial priors
  states.push({ probabilities: [...priors] });

  let currentProbs = [...priors];

  for (const e of evidence) {
    // Shift magnitude: magnitude scales 1-5 to 2-10% redistribution
    const shiftPercent = e.magnitude * 2;

    if (e.direction === "up") {
      // Increase hypothesis 0, decrease others proportionally.
      // Guard: single-hypothesis → nothing to redistribute to, skip.
      if (currentProbs.length <= 1) continue; // eslint-disable-line no-continue
      const decrease = shiftPercent / (currentProbs.length - 1);
      currentProbs = currentProbs.map((p, i) => {
        if (i === 0) {
          return Math.min(98, p + shiftPercent);
        } else {
          return Math.max(0, p - decrease);
        }
      });
    } else {
      // Decrease hypothesis 0, increase others proportionally.
      // Guard: single-hypothesis → nothing to redistribute to, skip.
      if (currentProbs.length <= 1) continue; // eslint-disable-line no-continue
      const increase = shiftPercent / (currentProbs.length - 1);
      currentProbs = currentProbs.map((p, i) => {
        if (i === 0) {
          return Math.max(0, p - shiftPercent);
        } else {
          return Math.min(98, p + increase);
        }
      });
    }

    // Normalize to sum ≈ 100
    const total = currentProbs.reduce((a, b) => a + b, 0);
    if (total > 0) {
      currentProbs = currentProbs.map(p => (p / total) * 100);
    }

    states.push({ probabilities: [...currentProbs] });
  }

  return states;
}

function computeDistributionStates(
  prior: number,
  evidence: EvidenceItem[]
): DistributionState[] {
  const states: DistributionState[] = [];
  let currentMean = prior;
  let currentStd = 18; // Wide initial uncertainty

  // State 0: prior
  states.push({ mean: currentMean, std: currentStd });

  for (const e of evidence) {
    const shift = e.magnitude * 4; // 4-20% shift per evidence
    if (e.direction === "up") {
      currentMean = Math.min(98, currentMean + shift);
    } else {
      currentMean = Math.max(2, currentMean - shift);
    }
    // Each evidence tightens uncertainty slightly
    currentStd = Math.max(6, currentStd - e.magnitude * 1.2);
    states.push({ mean: currentMean, std: currentStd });
  }

  return states;
}

// ── Evidence card component ────────────────────────────────────────────────

const EvidenceCard: React.FC<{
  item: EvidenceItem;
  index: number;
  frame: number;
  startFrame: number;
  theme: ReturnType<typeof useThemeMode>;
}> = React.memo(({ item, index, frame, startFrame, theme }) => {
  const opacity = fadeIn(frame, startFrame, sec(0.4));
  // Spring entrance instead of basic cubic slide
  const springVal = heroSpring(frame, layout.fps, startFrame);
  const offsetX = 60 * (1 - springVal);
  const cardScale = 0.85 + 0.15 * springVal;

  const isUp = item.direction === "up";
  const arrow = isUp ? "↑" : "↓";
  const cardColor = item.color || (isUp ? semantic.success : semantic.danger);

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${offsetX}px) scale(${cardScale})`,
        transformOrigin: "left center",
        display: "flex",
        alignItems: "center",
        gap: layout.spacing.sm,
        marginBottom: layout.spacing.sm,
      }}
    >
      {/* Direction indicator */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          backgroundColor: `${cardColor}25`,
          border: `2px solid ${cardColor}60`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: fontSizes.body,
          maxWidth: textMaxWidth.node,
          color: cardColor,
          fontWeight: 700,
          flexShrink: 0,
          boxShadow: shadows.accentGlow(cardColor),
        }}
      >
        {arrow}
      </div>

      {/* Label */}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: fontSizes.caption,
            color: theme.text.primary,
            fontWeight: 500,
            lineHeight: 1.3,
            textShadow: shadows.textLift,
          }}
        >
          {item.label}
        </div>
        {item.source && (
          <div
            style={{
              fontSize: fontSizes.meta,
              color: theme.text.muted,
              marginTop: 2,
              fontFamily: fonts.mono,
              textShadow: shadows.textLift,
            }}
          >
            {item.source}
          </div>
        )}
      </div>

      {/* Magnitude dots */}
      <div style={{ display: "flex", gap: 3, flexShrink: 0 }}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor:
                i < item.magnitude ? cardColor : `${theme.text.muted}30`,
            }}
          />
        ))}
      </div>
    </div>
  );
});

// ── Probability axis labels ────────────────────────────────────────────────

const AxisLabels: React.FC<{
  width: number;
  theme: ReturnType<typeof useThemeMode>;
}> = React.memo(({ width, theme }) => {
  const ticks = [0, 25, 50, 75, 100];
  return (
    <div
      style={{
        position: "relative",
        width,
        height: fontSizes.label,
        marginTop: layout.spacing.xs,
      }}
    >
      {ticks.map((tick) => (
        <div
          key={tick}
          style={{
            position: "absolute",
            left: (tick / 100) * width - 16,
            width: 32,
            textAlign: "center",
            fontSize: fontSizes.meta,
            color: theme.text.muted,
            fontFamily: fonts.data,
            textShadow: shadows.textLift,
          }}
        >
          {tick}%
        </div>
      ))}
    </div>
  );
});

// ── Market price reference line ────────────────────────────────────────────

const MarketPriceLine: React.FC<{
  price: number;
  label: string;
  width: number;
  height: number;
  frame: number;
  theme: ReturnType<typeof useThemeMode>;
}> = React.memo(({ price, label, width, height, frame, theme }) => {
  const x = (price / 100) * width;
  const lineOpacity = fadeIn(frame, sec(0.5), sec(0.6));

  return (
    <g opacity={lineOpacity}>
      <line
        x1={x}
        y1={0}
        x2={x}
        y2={height}
        stroke={palette.amber}
        strokeWidth={2}
        strokeDasharray="6 4"
        opacity={0.7}
      />
      <text
        x={x}
        y={-8}
        textAnchor="middle"
        fill={palette.amber}
        fontSize={fontSizes.meta}
        fontFamily={fonts.data}
      >
        {label} {price}%
      </text>
    </g>
  );
});

// ── Multi-hypothesis bar component ────────────────────────────────────────

interface HypothesisBarProps {
  label: string;
  probability: number;
  color: string;
  theme: ReturnType<typeof useThemeMode>;
}

const HypothesisBar: React.FC<HypothesisBarProps & { isLeading?: boolean }> = React.memo(
  ({ label, probability, color, theme, isLeading = false }) => {
    const barWidth = `${probability}%`;

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: layout.spacing.md,
          marginBottom: layout.spacing.md,
        }}
      >
        {/* Label */}
        <div
          style={{
            width: 160,
            flexShrink: 0,
            fontSize: fontSizes.caption,
            color: isLeading ? theme.text.primary : theme.text.secondary,
            fontFamily: fonts.mono,
            fontWeight: isLeading ? 600 : 400,
            textShadow: shadows.textLift,
          }}
        >
          {label}
        </div>

        {/* Bar container and bar */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            position: "relative",
            height: 28,
            backgroundColor: `${theme.text.muted}25`,
            borderRadius: `${radii.sm}px ${radii.sm}px 0 0`,
            overflow: "hidden",
            border: `1px solid ${theme.text.muted}30`,
            boxShadow: `inset 0 1px 2px rgba(0,0,0,0.08)`, // shadows.none equivalent — inset surface (no token)
          }}
        >
          {/* Bar fill — vertical gradient + transition */}
          <div
            style={{
              width: barWidth,
              height: "100%",
              background: `linear-gradient(180deg, ${color}E0 0%, ${color} 100%)`,
              borderRadius: `${radii.sm}px ${radii.sm}px 0 0`,
              transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
              boxShadow: isLeading
                ? `0 0 14px ${color}70, inset 0 -1px 2px rgba(0,0,0,0.18)`
                : `0 0 8px ${color}40, inset 0 -1px 2px rgba(0,0,0,0.18)`,
            }}
          />
          {/* Specular highlight on top edge */}
          {probability > 1 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 1,
                height: 1.5,
                width: barWidth,
                background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 30%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.55) 70%, transparent 100%)`,
                pointerEvents: "none",
                transition: "width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
            />
          )}
        </div>

        {/* Percentage */}
        <div
          style={{
            width: 50,
            flexShrink: 0,
            textAlign: "right",
            fontSize: fontSizes.caption,
            color: color,
            fontWeight: 600,
            fontFamily: fonts.data,
            textShadow: isLeading
              ? `0 0 8px ${color}60, ${shadows.textLift}`
              : shadows.textLift,
          }}
        >
          {Math.round(probability)}%
        </div>
      </div>
    );
  }
);

// ── Multi Variant Component ────────────────────────────────────────────────

const MultiVariant: React.FC<{
  data: BayesianUpdateData;
  theme: ReturnType<typeof useThemeMode>;
  frame: number;
  durationInFrames: number;
  area: ReturnType<typeof contentArea>;
  compStyle: React.CSSProperties;
  syncPoints?: DirectionSyncPoint[];
}> = React.memo(
  ({ data, theme, frame, durationInFrames, area, compStyle, syncPoints }) => {
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
      () => computeMultiHypothesisStates(priors, (data.evidence ?? [])),
      [priors, (data.evidence ?? [])]
    );

    // Timing
    const evidenceCount = (data.evidence ?? []).length;
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
      CLAMP_CUBIC
    );

    return (
      <Background
        variant={resolveAnalyticalBackgroundVariant(
          analyticalBackgroundBase(data.backgroundVariant),
          transparentBackdropRequested(data),
        )}
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
            syncPoints={syncPoints}
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
              {/* Anticipatory-reveal adoption (POLISH.md D17): the question
                  is the editorial frame for the whole Bayesian update — the
                  narrator's verbal anchor ("How do we know if X?"). The
                  question opacity settles 5 frames before `syncPoints[0]`'s
                  cue. Settle = sec(0.5). Falls back to sec(0.3) absent a cue
                  → identical visual baseline.
                  See TitleTransition.editorial-title (commit 1da5a49) for
                  the reference idiom. */}
              {data.question && (
                <div
                  style={{
                    fontSize: fontSizes.caption,
                    color: theme.text.secondary,
                    fontFamily: fonts.mono,
                    marginBottom: layout.spacing.lg,
                    textShadow: shadows.textLift,
                    opacity: fadeIn(
                      frame,
                      syncPoints?.[0]?.frame !== undefined
                        ? anticipatoryStartFrame(syncPoints[0].frame, sec(0.5))
                        : sec(0.3),
                      sec(0.5),
                    ),
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
                        boxShadow: `0 0 4px ${hypothesisColors[i]}60`, // shadows.accentGlowSm (4px, 60% opacity variant)
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

              {(data.evidence ?? []).map((item, i) => {
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

// ── Main component ─────────────────────────────────────────────────────────

export const BayesianUpdate: React.FC<{ data: BayesianUpdateData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const theme = useThemeMode(data.backgroundVariant || "light");
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  // Per-episode color emphasis for the single-hypothesis curve color (compare
  // variant uses semantic US/China colors which represent specific entities,
  // not stylistic accents — those stay).
  const emphasis = useEpisodeColorEmphasis();
  // Audio-reactive scale kick on Whisper-resolved sync points. Compounds
  // with the existing per-evidence settleScale below — beats that land near
  // an evidence transition reinforce that moment.
  const beat = useBeatSync({
    markers: (direction.syncPoints ?? []).map((p) => p.timeSec),
    pulseDecay: 0.3,
  });

  const area = contentArea("content", "generous");

  // ── Curve dimensions ─────────────────────────────────────────────────
  const curveWidth = area.width - 340; // Reserve space for evidence panel
  // Conservative SVG height — leaves breathing room above (under the
  // probability display) and below (above the safe-area floor). The
  // surrounding flex container center-aligns the SVG, so any extra
  // column space gets distributed evenly above + below the chart rather
  // than dumping it all at the bottom.
  const labelStackHeight = 220;
  const verticalBreath = 60;
  const curveHeight = Math.max(
    240,
    area.height - labelStackHeight - verticalBreath * 2
  );

  // ── Compute distribution states ──────────────────────────────────────
  const prior = data.variant === "single"
    ? (data.prior ?? 50)
    : (data.hypotheses?.[0]?.prior ?? 50);

  const states = useMemo(
    () => computeDistributionStates(prior, (data.evidence ?? [])),
    [prior, (data.evidence ?? [])]
  );

  // For compare variant, compute second track
  const states2 = useMemo(() => {
    if (data.variant !== "compare" || !data.hypotheses || data.hypotheses.length < 2) return null;
    return computeDistributionStates(data.hypotheses[1].prior, data.evidence ?? []);
  }, [data.variant, data.hypotheses, data.evidence]);

  // ── Evidence timing (pace-scaled) ─────────────────────────────────────
  // PACE: urgent compresses the evidence cadence so updates feel decisive;
  // breathing expands it so the audience has time to absorb each curve shift.
  const t = direction.paceTimingScale;
  const evidenceCount = (data.evidence ?? []).length;
  const introFrames = sec(1.5 * t); // Time before first evidence
  const perEvidenceFrames = sec(1.8 * t); // Time per evidence item

  // ── Current distribution state (interpolated with overshoot) ─────────
  const currentState = useMemo(() => {
    // Which evidence item are we on?
    const evidenceFrame = frame - introFrames;
    if (evidenceFrame <= 0) return states[0];

    const evidenceIndex = Math.floor(evidenceFrame / perEvidenceFrames);
    const evidenceT = (evidenceFrame % perEvidenceFrames) / perEvidenceFrames;

    if (evidenceIndex >= evidenceCount) return states[states.length - 1];

    const from = states[evidenceIndex];
    const to = states[evidenceIndex + 1];

    // Overshoot: curve pushes 3% past target then settles back
    const overshootMean = to.mean + (to.mean - from.mean) * 0.03;
    const t = evidenceT <= 0.5
      ? interpolate(evidenceT, [0, 0.5], [0, 1], CLAMP_CUBIC_INOUT)  // rush to overshoot
      : 1;
    const settleT = evidenceT > 0.5
      ? interpolate(evidenceT, [0.5, 0.8], [0, 1], CLAMP_CUBIC_INOUT) // settle back
      : 0;

    const meanTarget = t * (overshootMean - from.mean) + from.mean;
    const meanSettled = meanTarget - (overshootMean - to.mean) * settleT;

    return {
      mean: meanSettled,
      std: from.std + (to.std - from.std) * Math.min(t, 1),
    };
  }, [frame, introFrames, perEvidenceFrames, evidenceCount, states]);

  // Second track for compare variant (same overshoot pattern)
  const currentState2 = useMemo(() => {
    if (!states2) return null;
    const evidenceFrame = frame - introFrames;
    if (evidenceFrame <= 0) return states2[0];

    const evidenceIndex = Math.floor(evidenceFrame / perEvidenceFrames);
    const evidenceT = (evidenceFrame % perEvidenceFrames) / perEvidenceFrames;

    if (evidenceIndex >= evidenceCount) return states2[states2.length - 1];

    const from = states2[evidenceIndex];
    const to = states2[evidenceIndex + 1];

    const overshootMean = to.mean + (to.mean - from.mean) * 0.03;
    const t = evidenceT <= 0.5
      ? interpolate(evidenceT, [0, 0.5], [0, 1], CLAMP_CUBIC_INOUT)
      : 1;
    const settleT = evidenceT > 0.5
      ? interpolate(evidenceT, [0.5, 0.8], [0, 1], CLAMP_CUBIC_INOUT)
      : 0;

    const meanTarget = t * (overshootMean - from.mean) + from.mean;
    const meanSettled = meanTarget - (overshootMean - to.mean) * settleT;

    return {
      mean: meanSettled,
      std: from.std + (to.std - from.std) * Math.min(t, 1),
    };
  }, [frame, introFrames, perEvidenceFrames, evidenceCount, states2]);

  // ── Curve paths ──────────────────────────────────────────────────────
  const curvePath = generateCurvePath(
    currentState.mean,
    currentState.std,
    curveWidth,
    curveHeight
  );

  const curvePath2 = currentState2
    ? generateCurvePath(
        currentState2.mean,
        currentState2.std,
        curveWidth,
        curveHeight
      )
    : null;

  // ── Ghost curve (previous state) — fades during evidence transition ──
  // During the first 60% of each evidence's transition window, render the
  // previous distribution at 30% opacity, fading to 0 by transition end.
  const ghostState = useMemo(() => {
    const evidenceFrame = frame - introFrames;
    if (evidenceFrame <= 0) return null;
    const evidenceIndex = Math.floor(evidenceFrame / perEvidenceFrames);
    if (evidenceIndex < 1 || evidenceIndex > evidenceCount) return null;
    return states[evidenceIndex - 1];
  }, [frame, introFrames, perEvidenceFrames, evidenceCount, states]);

  const ghostOpacity = useMemo(() => {
    const evidenceFrame = frame - introFrames;
    if (evidenceFrame <= 0) return 0;
    const evidenceIndex = Math.floor(evidenceFrame / perEvidenceFrames);
    const evidenceT = (evidenceFrame % perEvidenceFrames) / perEvidenceFrames;
    if (evidenceIndex >= evidenceCount) return 0;
    // 0.3 → 0 over first 60% of transition
    return Math.max(0, 0.3 * (1 - evidenceT / 0.6));
  }, [frame, introFrames, perEvidenceFrames, evidenceCount]);

  const ghostPath = ghostState
    ? generateCurvePath(ghostState.mean, ghostState.std, curveWidth, curveHeight)
    : null;

  // ── Current probability label + settle pulse ─────────────────────────
  const currentProb = Math.round(currentState.mean);
  const currentProb2 = currentState2 ? Math.round(currentState2.mean) : null;

  // Micro-settle pulse when each evidence item finishes its transition.
  // Beat sync compounds: a Whisper sync point landing near an evidence
  // transition adds an extra ~3% scale kick on top of the settle pulse.
  const settleScale = useMemo(() => {
    for (let i = 0; i < evidenceCount; i++) {
      const evidenceSettleFrame = introFrames + i * perEvidenceFrames + sec(1.2);
      const p = pulse(frame, evidenceSettleFrame, 9, 1.04);
      if (p > 1.001) return p;
    }
    return 1.0;
  }, [frame, introFrames, perEvidenceFrames, evidenceCount]) * (1 + beat.pulse * 0.03);

  // ── Colors ───────────────────────────────────────────────────────────
  const curve1Color = data.variant === "compare"
    ? (data.hypotheses?.[0]?.color || semantic.us)
    : emphasis.primaryAccent;
  const curve2Color = data.hypotheses?.[1]?.color || semantic.china;

  // ── Entrance animation for the curve ─────────────────────────────────
  const curveEnterOpacity = fadeIn(frame, 0, sec(0.8));
  const curveEnterScale = interpolate(
    frame,
    [0, sec(1.0)],
    [0.95, 1],
    CLAMP_CUBIC
  );

  // Handle multi variant separately
  if (data.variant === "multi") {
    return (
      <MultiVariant
        data={data}
        theme={theme}
        frame={frame}
        durationInFrames={durationInFrames}
        area={area}
        compStyle={compStyle}
        syncPoints={direction.syncPoints}
      />
    );
  }

  const mode = data.backgroundVariant || "light";

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        {/* Background already provides default atmospheric particles per mode */}
        {/* Brand strips */}
        <HeaderStrip mode={mode as "dark" | "light"} metadata={data.episode} />
        <FooterStrip mode={mode as "dark" | "light"} />
        {/* ── Title ──────────────────────────────────────────────────── */}
        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={data.backgroundVariant}
          safeAreaTier="generous"
          syncPoints={direction.syncPoints}
        />

        {/* ── Main content area ──────────────────────────────────────── */}
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
          {/* ── Distribution curve (left) ────────────────────────────── */}
          {/* Flex-column so the SVG can flex:1 and center vertically in
              the remaining space below the question + probability labels. */}
          <div
            style={{
              flex: 1,
              opacity: curveEnterOpacity,
              transform: `scale(${curveEnterScale})`,
              transformOrigin: "center bottom",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Question label */}
            {/* Anticipatory-reveal adoption (POLISH.md D17): the question
                is the verbal anchor — the narrator says "is X true?" and the
                question card should be settled by then. Opacity settles 5
                frames before `syncPoints[0]`'s cue; settle = sec(0.5). Falls
                back to sec(0.3) absent a cue → identical visual baseline. */}
            {data.question && (
              <div
                style={{
                  fontSize: fontSizes.caption,
                  color: theme.text.secondary,
                  fontFamily: fonts.mono,
                  marginBottom: layout.spacing.sm,
                  textShadow: shadows.textLift,
                  opacity: fadeIn(
                    frame,
                    direction.syncPoints?.[0]?.frame !== undefined
                      ? anticipatoryStartFrame(direction.syncPoints[0].frame, sec(0.5))
                      : sec(0.3),
                    sec(0.5),
                  ),
                }}
              >
                {data.question}
              </div>
            )}

            {/* Probability value display */}
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: layout.spacing.md,
                marginBottom: layout.spacing.md,
              }}
            >
              <div
                style={{
                  fontSize: fontSizes.display,
                  fontWeight: 700,
                  fontFamily: fonts.data,
                  color: curve1Color,
                  textShadow: shadows.textLift,
                  lineHeight: 1,
                  maxWidth: textMaxWidth.h1,
                  transform: `scale(${settleScale})`,
                  transformOrigin: "left bottom",
                }}
              >
                {currentProb}%
              </div>
              {data.variant === "compare" && currentProb2 !== null && (
                <div
                  style={{
                    fontSize: fontSizes.h2,
                    fontWeight: 600,
                    fontFamily: fonts.data,
                    color: curve2Color,
                    textShadow: shadows.textLift,
                    lineHeight: 1,
                    maxWidth: textMaxWidth.h2,
                    opacity: 0.8,
                  }}
                >
                  {currentProb2}%
                </div>
              )}
            </div>

            {/* Compare variant: hypothesis labels */}
            {data.variant === "compare" && data.hypotheses && (
              <div
                style={{
                  display: "flex",
                  gap: layout.spacing.lg,
                  marginBottom: layout.spacing.sm,
                  opacity: fadeIn(frame, sec(0.4), sec(0.5)),
                }}
              >
                {data.hypotheses.map((h, i) => (
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
                        backgroundColor: i === 0 ? curve1Color : curve2Color,
                      }}
                    />
                    <div
                      style={{
                        fontSize: fontSizes.caption,
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
            )}

            {/* SVG distribution curve — wrapped in a flex:1 centering box
                so any leftover vertical space splits evenly above and
                below the chart instead of bottom-anchoring it. */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-start",
              }}
            >
            <svg
              width={curveWidth}
              height={curveHeight}
              viewBox={`0 -20 ${curveWidth} ${curveHeight + 20}`}
              style={{ overflow: "visible" }}
            >
              {/* Vertical gradients — top transparent → bottom solid for both curves (NYT/538 standard) */}
              <defs>
                <linearGradient id="bayes-curve1-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={curve1Color} stopOpacity={0} />
                  <stop offset="60%" stopColor={curve1Color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={curve1Color} stopOpacity={0.4} />
                </linearGradient>
                <linearGradient id="bayes-curve2-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={curve2Color} stopOpacity={0} />
                  <stop offset="60%" stopColor={curve2Color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={curve2Color} stopOpacity={0.4} />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map((tick) => {
                const x = (tick / 100) * curveWidth;
                return (
                  <line
                    key={tick}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={curveHeight}
                    stroke={theme.text.muted}
                    strokeWidth={0.5}
                    opacity={0.2}
                  />
                );
              })}

              {/* Baseline */}
              <line
                x1={0}
                y1={curveHeight}
                x2={curveWidth}
                y2={curveHeight}
                stroke={theme.text.muted}
                strokeWidth={1}
                opacity={0.4}
              />

              {/* Market price reference */}
              {data.marketPrice !== undefined && (
                <MarketPriceLine
                  price={data.marketPrice}
                  label={data.marketSource || "Market"}
                  width={curveWidth}
                  height={curveHeight}
                  frame={frame}
                  theme={theme}
                />
              )}

              {/* Second curve (compare variant, rendered behind) */}
              {curvePath2 && (
                <path
                  d={curvePath2}
                  fill="url(#bayes-curve2-grad)"
                  stroke={curve2Color}
                  strokeWidth={2.5}
                  style={{
                    filter: `drop-shadow(0 0 8px ${curve2Color}30)`,
                  }}
                />
              )}

              {/* Ghost curve — previous distribution at 30% during morph */}
              {ghostPath && ghostOpacity > 0.01 && (
                <path
                  d={ghostPath}
                  fill="none"
                  stroke={curve1Color}
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                  opacity={ghostOpacity}
                />
              )}

              {/* Primary curve — gradient fill (top transparent → bottom solid) */}
              <path
                d={curvePath}
                fill="url(#bayes-curve1-grad)"
                stroke={curve1Color}
                strokeWidth={3}
                style={{
                  filter: `drop-shadow(0 0 12px ${curve1Color}40)`,
                }}
              />

              {/* Mean indicator dot */}
              <circle
                cx={(currentState.mean / 100) * curveWidth}
                cy={curveHeight - curveHeight * 0.85}
                r={5}
                fill={curve1Color}
                stroke="white"
                strokeWidth={2}
                style={{
                  filter: `drop-shadow(0 0 6px ${curve1Color}60)`,
                }}
              />
            </svg>
            </div>

            {/* X-axis labels */}
            <AxisLabels width={curveWidth} theme={theme} />
          </div>

          {/* ── Evidence panel (right) ───────────────────────────────── */}
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

            {(data.evidence ?? []).map((item, i) => {
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

            {/* Prior label */}
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
                PRIOR → POSTERIOR
              </div>
              <div
                style={{
                  fontSize: fontSizes.caption,
                  color: theme.text.secondary,
                  fontFamily: fonts.data,
                  textShadow: shadows.textLift,
                }}
              >
                {Math.round(states[0].mean)}% → {currentProb}%
              </div>
            </div>
          </div>
        </div>

        {/* ── Source attribution ──────────────────────────────────────── */}
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
};
