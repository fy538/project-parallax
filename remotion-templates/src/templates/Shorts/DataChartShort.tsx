/**
 * DataChartShort — vertical 9:16 bar chart for Shorts.
 *
 * Uses ShortsWrapper + useVerticalLayout for systematic vertical
 * adaptation. Horizontal bars with large labels for mobile readability.
 * Same data schema as landscape DataChart.
 *
 * Series: "The Market Says...", "Was I Right?"
 */

import React, { useMemo } from "react";
import { interpolate } from "remotion";
import {
  palette,
  fonts,
  fontWeights,
  shadows,
} from "../../design/theme";
import { fadeIn, slideIn, CLAMP_CUBIC } from "../../utils/animation";
import { barGradient } from "../../utils/depth";
import { ShortsWrapper } from "../../components/ShortsWrapper";
import type { VerticalLayoutTokens } from "../../hooks/useVerticalLayout";
import type { ThemeTokens } from "../../hooks/useThemeMode";
import type { DataChartData, DataPoint } from "../DataChart/types";

// ── Animated horizontal bar ─────────────────────────────────────────────

const HorizontalBar: React.FC<{
  point: DataPoint;
  index: number;
  maxValue: number;
  frame: number;
  exit: number;
  unit: string;
  defaultColor: string;
  vl: VerticalLayoutTokens;
  theme: ThemeTokens;
}> = ({ point, index, maxValue, frame, exit, unit, defaultColor, vl, theme }) => {
  const barStart = 15 + index * 8;
  const color = point.color || defaultColor;

  const growth = interpolate(
    frame,
    [barStart, barStart + 20],
    [0, 1],
    CLAMP_CUBIC
  );

  const widthPercent = (point.value / maxValue) * 100 * growth;
  const displayValue = Math.round(point.value * growth);
  const labelOpacity = fadeIn(frame, barStart - 4, 6) * exit;

  return (
    <div style={{ marginBottom: vl.spacing.lg }}>
      {/* Label row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: vl.spacing.sm,
          opacity: labelOpacity,
          transform: `translateY(${slideIn(frame, barStart - 4, 8, 6)}px)`,
        }}
      >
        <span
          style={{
            fontSize: vl.fontSizes.body,
            fontFamily: fonts.display,
            fontWeight: fontWeights.medium,
            color: theme.text.primary,
            textShadow: theme.textShadow,
          }}
        >
          {point.label}
        </span>
        <span
          style={{
            fontSize: vl.fontSizes.body + 4,
            fontFamily: fonts.data,
            fontWeight: fontWeights.bold,
            color,
          }}
        >
          {displayValue}
          {unit}
        </span>
      </div>

      {/* Bar track */}
      <div
        style={{
          width: "100%",
          height: 32,
          backgroundColor: `${theme.text.muted}20`,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${widthPercent}%`,
            height: "100%",
            background: barGradient(color),
            borderRadius: 4,
            boxShadow: shadows.subtle,
          }}
        />
      </div>

      {/* Sublabel */}
      {point.sublabel && (
        <div
          style={{
            fontSize: vl.fontSizes.caption,
            fontFamily: fonts.body,
            color: theme.text.muted,
            marginTop: 4,
            opacity: labelOpacity,
            textShadow: theme.textShadow,
          }}
        >
          {point.sublabel}
        </div>
      )}
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────

export const DataChartShort: React.FC<{ data: DataChartData }> = ({
  data,
}) => {
  const points = data.dataPoints || [];
  const maxValue = useMemo(
    () => Math.max(...points.map((p) => p.value), 1),
    [points]
  );

  return (
    <ShortsWrapper
      title={data.title}
      subtitle={data.subtitle}
      mode={(data as any).backgroundVariant} // no-as-any-ok: backgroundVariant not in DataChartData type yet; ShortsWrapper accepts optional mode
    >
      {(vl, theme, frame, exit) => (
        <>
          {/* Bars area */}
          <div
            style={{
              position: "absolute",
              top: vl.contentTop + 40,
              left: vl.safeArea.left + 16,
              right: vl.safeArea.right + 16,
            }}
          >
            {points.map((point, i) => (
              <HorizontalBar
                key={i}
                point={point}
                index={i}
                maxValue={maxValue}
                frame={frame}
                exit={exit}
                unit={data.unit || ""}
                defaultColor={palette.amber}
                vl={vl}
                theme={theme}
              />
            ))}
          </div>

          {/* Source */}
          {data.source && (
            <div
              style={{
                position: "absolute",
                bottom: vl.safeArea.bottom,
                left: vl.safeArea.left,
                right: vl.safeArea.right,
                textAlign: "center",
                fontSize: vl.fontSizes.caption,
                fontFamily: fonts.body,
                color: theme.text.muted,
                opacity: fadeIn(frame, 30, 8) * exit,
                textShadow: theme.textShadow,
              }}
            >
              {data.source}
            </div>
          )}
        </>
      )}
    </ShortsWrapper>
  );
};
