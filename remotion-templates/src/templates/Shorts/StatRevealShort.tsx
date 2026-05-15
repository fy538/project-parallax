/**
 * StatRevealShort — vertical 9:16 stat reveal for Shorts.
 *
 * Uses ShortsWrapper + useVerticalLayout for systematic vertical
 * adaptation. Hero number stacks above comparison bars in a vertical
 * flow. Same data schema as landscape StatReveal.
 */

import React, { useMemo } from "react";
import { interpolate } from "remotion";
import {
  palette,
  fonts,
  fontWeights,
  shadows,
  sec,
} from "../../design/theme";
import { fadeIn, scaleReveal, CLAMP_QUARTIC } from "../../utils/animation";
import { ShortsWrapper } from "../../components/ShortsWrapper";
import { formatNumber as sharedFormatNumber } from "../../utils/numberFormat";
import type { StatRevealData } from "../StatReveal/types";

const formatNumber = (
  value: number,
  decimals: number = 0,
  prefix: string = "",
  suffix: string = ""
): string =>
  sharedFormatNumber(value, { decimals, prefix, suffix });

export const StatRevealShort: React.FC<{ data: StatRevealData }> = ({
  data,
}) => {
  const maxValue = useMemo(() => {
    const allValues = [
      data.heroIsMax !== false ? data.stat.value : 0,
      ...data.comparisons.map((c) => c.value),
    ];
    return Math.max(...allValues);
  }, [data.stat.value, data.comparisons, data.heroIsMax]);

  return (
    <ShortsWrapper
      title={data.title}
      subtitle={data.subtitle}
      mode={data.backgroundVariant}
    >
      {(vl, theme, frame, exit) => {
        const heroStart = sec(0.3);
        const heroCountFrames = sec(1.5);
        const barsStart = heroStart + heroCountFrames + sec(0.3);
        const barStagger = sec(0.25);
        const barGrowFrames = sec(0.8);

        const heroProgress = interpolate(
          frame,
          [heroStart, heroStart + heroCountFrames],
          [0, 1],
          CLAMP_QUARTIC
        );
        const heroOpacity = fadeIn(frame, heroStart, sec(0.3)) * exit;
        const currentValue = data.stat.value * heroProgress;

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
              justifyContent: "center",
              gap: vl.spacing.xxl,
            }}
          >
            {/* Hero number — cinematic scale-reveal (1.3 → 1.0) + accent glow */}
            <div style={{ opacity: heroOpacity, textAlign: "center" }}>
              <div
                style={{
                  fontSize: 96,
                  fontWeight: fontWeights.bold,
                  color: palette.amber,
                  fontFamily: fonts.data,
                  textShadow: `0 0 24px ${palette.amber}50, ${theme.textShadow}`,
                  letterSpacing: -2,
                  lineHeight: 1,
                  transform: `scale(${scaleReveal(frame, heroStart, sec(0.7), 1.3, 1.0)})`,
                  transformOrigin: "center center",
                }}
              >
                {formatNumber(
                  currentValue,
                  data.stat.decimals,
                  data.stat.prefix,
                  data.stat.suffix
                )}
              </div>
              <div
                style={{
                  fontSize: vl.fontSizes.body,
                  color: theme.text.secondary,
                  fontFamily: fonts.body,
                  marginTop: vl.spacing.md,
                  textShadow: theme.textShadow,
                  maxWidth: vl.textMaxWidth.body,
                }}
              >
                {data.stat.label}
              </div>
            </div>

            {/* Comparison bars — full width, stacked vertically */}
            <div
              style={{
                width: "100%",
                display: "flex",
                flexDirection: "column",
                gap: vl.spacing.md,
              }}
            >
              {data.comparisons.map((bar, i) => {
                const barStart = barsStart + i * barStagger;
                const barProgress = interpolate(
                  frame,
                  [barStart, barStart + barGrowFrames],
                  [0, 1],
                  CLAMP_QUARTIC
                );
                const barOpacity = fadeIn(frame, barStart, sec(0.2)) * exit;
                const barColor = bar.color || palette.amber;
                const barFraction = bar.value / maxValue;
                const barWidth = (vl.contentArea.width - 40) * barFraction * barProgress;

                return (
                  <div key={i} style={{ opacity: barOpacity }}>
                    <div
                      style={{
                        fontSize: vl.fontSizes.label,
                        color: theme.text.secondary,
                        fontFamily: fonts.body,
                        marginBottom: 4,
                        textShadow: theme.textShadow,
                      }}
                    >
                      {bar.label}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: vl.spacing.sm }}>
                      <div
                        style={{
                          height: 32,
                          width: barWidth,
                          borderRadius: 4,
                          background: `linear-gradient(90deg, ${barColor} 0%, ${barColor}D9 100%)`,
                          boxShadow: shadows.subtle,
                          minWidth: 2,
                        }}
                      />
                      <div
                        style={{
                          fontSize: vl.fontSizes.label,
                          color: theme.text.muted,
                          fontFamily: fonts.data,
                        }}
                      >
                        {formatNumber(bar.value * barProgress)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Source */}
            {data.source && (
              <div
                style={{
                  fontSize: vl.fontSizes.caption,
                  color: theme.text.muted,
                  fontFamily: fonts.body,
                  opacity: fadeIn(frame, barsStart + sec(0.5), sec(0.3)) * exit,
                }}
              >
                {data.source}
              </div>
            )}
          </div>
        );
      }}
    </ShortsWrapper>
  );
};
