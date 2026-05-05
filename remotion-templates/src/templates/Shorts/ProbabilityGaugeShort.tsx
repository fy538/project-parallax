/**
 * ProbabilityGaugeShort — vertical 9:16 probability gauge for Shorts.
 *
 * Adapts ProbabilityGauge for vertical layout. Shows gauge arc centered,
 * large probability value below, then label and scorecard items flowing
 * downward. Supports gauge, shift, and scorecard variants.
 */

import React from "react";
import { interpolate } from "remotion";
import {
  palette,
  fonts,
  fontWeights,
  sec,
} from "../../design/theme";
import { fadeIn, CLAMP_CUBIC } from "../../utils/animation";
import { ShortsWrapper } from "../../components/ShortsWrapper";
import type { ProbabilityGaugeData } from "../ProbabilityGauge/types";

export const ProbabilityGaugeShort: React.FC<{ data: ProbabilityGaugeData }> = ({
  data,
}) => {
  return (
    <ShortsWrapper
      title={data.title}
      subtitle={data.subtitle}
      mode={data.backgroundVariant}
    >
      {(vl, theme, frame, exit) => {
        const startDelay = sec(0.3);
        const itemStagger = sec(0.3);
        const itemFadeDuration = sec(0.4);

        if (data.variant === "gauge" && data.gauges && data.gauges.length > 0) {
          // For Shorts, show only the first gauge
          const gauge = data.gauges[0];
          const gaugeColor = gauge.color || palette.amber;
          const gaugeProgress = interpolate(
            frame,
            [startDelay, startDelay + sec(1)],
            [0, gauge.value / 100],
            CLAMP_CUBIC
          );
          const gaugeOpacity = fadeIn(frame, startDelay, sec(0.3)) * exit;

          const arcSize = Math.min(vl.contentArea.width - 40, 280);
          const arcRadius = arcSize / 2;
          const arcCenterX = arcSize / 2;
          const arcCenterY = arcSize / 2;

          // Draw arc path (180 degrees, semicircle)
          const startAngle = Math.PI;
          const endAngle = Math.PI + Math.PI * gaugeProgress;

          const startX = arcCenterX + arcRadius * Math.cos(startAngle);
          const startY = arcCenterY + arcRadius * Math.sin(startAngle);
          const endX = arcCenterX + arcRadius * Math.cos(endAngle);
          const endY = arcCenterY + arcRadius * Math.sin(endAngle);

          const arcPath = `M ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 0 1 ${endX} ${endY}`;

          return (
            <div
              style={{
                position: "absolute",
                top: vl.contentTop,
                left: vl.safeArea.left,
                right: vl.safeArea.right,
                bottom: vl.safeArea.bottom,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: vl.spacing.lg,
              }}
            >
              {/* Gauge arc */}
              <div
                style={{
                  opacity: gaugeOpacity,
                  width: arcSize,
                  height: arcSize,
                  position: "relative",
                }}
              >
                <svg
                  width={arcSize}
                  height={arcSize}
                  viewBox={`0 0 ${arcSize} ${arcSize}`}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                >
                  {/* Background track */}
                  <path
                    d={`M ${arcCenterX + arcRadius * Math.cos(Math.PI)} ${
                      arcCenterY + arcRadius * Math.sin(Math.PI)
                    } A ${arcRadius} ${arcRadius} 0 0 1 ${
                      arcCenterX + arcRadius * Math.cos(Math.PI + Math.PI)
                    } ${arcCenterY + arcRadius * Math.sin(Math.PI + Math.PI)}`}
                    stroke={`${gaugeColor}30`}
                    strokeWidth={8}
                    fill="none"
                    strokeLinecap="round"
                  />

                  {/* Progress arc */}
                  <path
                    d={arcPath}
                    stroke={gaugeColor}
                    strokeWidth={8}
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Center label */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 20,
                    left: "50%",
                    transform: "translateX(-50%)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: vl.fontSizes.h2,
                      fontWeight: fontWeights.bold,
                      color: gaugeColor,
                      fontFamily: fonts.data,
                      textShadow: theme.textShadow,
                    }}
                  >
                    {Math.round(gauge.value * gaugeProgress)}%
                  </div>
                </div>
              </div>

              {/* Gauge label */}
              <div
                style={{
                  opacity: fadeIn(frame, startDelay + sec(0.5), itemFadeDuration) * exit,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: vl.fontSizes.label,
                    fontWeight: fontWeights.semibold,
                    color: theme.text.primary,
                    fontFamily: fonts.heading,
                    textShadow: theme.textShadow,
                  }}
                >
                  {gauge.label}
                </div>
                {gauge.marketSource && (
                  <div
                    style={{
                      fontSize: vl.fontSizes.caption,
                      color: theme.text.muted,
                      fontFamily: fonts.body,
                      marginTop: 4,
                      textShadow: theme.textShadow,
                    }}
                  >
                    {gauge.marketSource}
                  </div>
                )}
              </div>

              {/* Source */}
              {data.source && (
                <div
                  style={{
                    fontSize: vl.fontSizes.caption,
                    color: theme.text.muted,
                    fontFamily: fonts.body,
                    textAlign: "center",
                    opacity: fadeIn(
                      frame,
                      startDelay + sec(1.5),
                      itemFadeDuration
                    ) * exit,
                    textShadow: theme.textShadow,
                  }}
                >
                  {data.source}
                </div>
              )}
            </div>
          );
        }

        if (data.variant === "shift" && data.shifts && data.shifts.length > 0) {
          // Show before/after probability shifts
          return (
            <div
              style={{
                position: "absolute",
                top: vl.contentTop,
                left: vl.safeArea.left,
                right: vl.safeArea.right,
                bottom: vl.safeArea.bottom,
                display: "flex",
                flexDirection: "column",
                gap: vl.spacing.lg,
              }}
            >
              {data.shifts.map((shift, idx) => {
                const itemStart = startDelay + idx * itemStagger;
                const itemOpacity = fadeIn(frame, itemStart, itemFadeDuration) * exit;
                const shiftColor = shift.color || palette.amber;

                return (
                  <div
                    key={idx}
                    style={{
                      opacity: itemOpacity,
                      padding: vl.spacing.md,
                      borderRadius: 8,
                      background: `${shiftColor}15`,
                      border: `1px solid ${shiftColor}40`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: vl.fontSizes.label,
                        fontWeight: fontWeights.semibold,
                        color: theme.text.primary,
                        fontFamily: fonts.heading,
                        marginBottom: vl.spacing.sm,
                        textShadow: theme.textShadow,
                      }}
                    >
                      {shift.label}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: vl.spacing.md,
                        marginBottom: vl.spacing.md,
                      }}
                    >
                      <div
                        style={{
                          fontSize: vl.fontSizes.body,
                          fontWeight: fontWeights.bold,
                          color: theme.text.secondary,
                          fontFamily: fonts.data,
                          flex: 1,
                          textShadow: theme.textShadow,
                        }}
                      >
                        {shift.before}%
                      </div>
                      <div
                        style={{
                          fontSize: vl.fontSizes.label,
                          color: shiftColor,
                          fontFamily: fonts.data,
                        }}
                      >
                        →
                      </div>
                      <div
                        style={{
                          fontSize: vl.fontSizes.body,
                          fontWeight: fontWeights.bold,
                          color: shiftColor,
                          fontFamily: fonts.data,
                          flex: 1,
                          textAlign: "right",
                          textShadow: theme.textShadow,
                        }}
                      >
                        {shift.after}%
                      </div>
                    </div>

                    {shift.trigger && (
                      <div
                        style={{
                          fontSize: vl.fontSizes.caption,
                          color: theme.text.muted,
                          fontFamily: fonts.body,
                          fontStyle: "italic",
                          textShadow: theme.textShadow,
                        }}
                      >
                        Trigger: {shift.trigger}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }

        if (data.variant === "scorecard" && data.scorecard && data.scorecard.length > 0) {
          // Show prediction scorecard
          return (
            <div
              style={{
                position: "absolute",
                top: vl.contentTop,
                left: vl.safeArea.left,
                right: vl.safeArea.right,
                bottom: vl.safeArea.bottom,
                display: "flex",
                flexDirection: "column",
                gap: vl.spacing.lg,
              }}
            >
              {data.scorecard.map((item, idx) => {
                const itemStart = startDelay + idx * itemStagger;
                const itemOpacity = fadeIn(frame, itemStart, itemFadeDuration) * exit;
                const outcomeColor =
                  item.outcome === "correct"
                    ? palette.amber
                    : item.outcome === "wrong"
                      ? palette.rust
                      : palette.amber;

                return (
                  <div
                    key={idx}
                    style={{
                      opacity: itemOpacity,
                      padding: vl.spacing.md,
                      borderRadius: 8,
                      background: `${outcomeColor}15`,
                      border: `1px solid ${outcomeColor}40`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: vl.spacing.sm,
                        marginBottom: vl.spacing.sm,
                      }}
                    >
                      <div
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: "50%",
                          backgroundColor: outcomeColor,
                        }}
                      />
                      <div
                        style={{
                          fontSize: vl.fontSizes.caption,
                          fontWeight: fontWeights.bold,
                          color: outcomeColor,
                          fontFamily: fonts.data,
                          letterSpacing: 1,
                          textShadow: theme.textShadow,
                        }}
                      >
                        {item.outcome.toUpperCase()}
                      </div>
                    </div>

                    <div
                      style={{
                        fontSize: vl.fontSizes.body,
                        color: theme.text.primary,
                        fontFamily: fonts.body,
                        marginBottom: vl.spacing.sm,
                        textShadow: theme.textShadow,
                      }}
                    >
                      {item.prediction}
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: vl.spacing.sm,
                        fontSize: vl.fontSizes.caption,
                        color: theme.text.muted,
                        fontFamily: fonts.data,
                        textShadow: theme.textShadow,
                      }}
                    >
                      <div>Your estimate: {item.yourEstimate}%</div>
                      {item.marketPrice !== undefined && (
                        <div>Market: {item.marketPrice}%</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        return null;
      }}
    </ShortsWrapper>
  );
};
