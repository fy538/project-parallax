/**
 * DataChartShort — vertical 9:16 bar chart for Shorts.
 *
 * Optimized for "The Market Says..." and "Was I Right?" series.
 * Horizontal bars (easier to read on mobile) with large labels.
 *
 * Usage: Feed the same JSON as landscape DataChart.
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import {
  palette,
  dark,
  semantic,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
  durations,
} from "../../design/theme";
import { fadeIn, slideIn, stagger } from "../../utils/animation";
import { barGradient } from "../../utils/depth";
import { Background } from "../../components/Background";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import type { DataChartData, DataPoint } from "../DataChart/types";
import { shortsLayout } from "./types";

// ── Animated horizontal bar ───────────────────────────────────────────────

const HorizontalBar: React.FC<{
  point: DataPoint;
  index: number;
  maxValue: number;
  frame: number;
  unit: string;
  defaultColor: string;
}> = ({ point, index, maxValue, frame, unit, defaultColor }) => {
  const barStart = 15 + index * 8; // Stagger per bar
  const color = point.color || defaultColor;

  // Bar growth
  const growth = interpolate(
    frame,
    [barStart, barStart + 20],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  const widthPercent = (point.value / maxValue) * 100 * growth;

  // Value count-up
  const displayValue = Math.round(point.value * growth);

  // Label fade
  const labelOpacity = fadeIn(frame, barStart - 4, 6);

  return (
    <div style={{ marginBottom: 28 }}>
      {/* Label row */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 10,
          opacity: labelOpacity,
        }}
      >
        <span
          style={{
            fontSize: 24,
            fontFamily: fonts.display,
            fontWeight: fontWeights.medium,
            color: dark.text.primary,
          }}
        >
          {point.label}
        </span>
        <span
          style={{
            fontSize: 28,
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
          backgroundColor: `${dark.text.muted}20`,
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        {/* Bar fill */}
        <div
          style={{
            width: `${widthPercent}%`,
            height: "100%",
            background: barGradient(color),
            borderRadius: 4,
            boxShadow: `0 2px 8px ${color}30`,
          }}
        />
      </div>

      {/* Sublabel */}
      {point.sublabel && (
        <div
          style={{
            fontSize: 16,
            fontFamily: fonts.body,
            color: dark.text.muted,
            marginTop: 6,
            opacity: labelOpacity,
          }}
        >
          {point.sublabel}
        </div>
      )}
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────

export const DataChartShort: React.FC<{ data: DataChartData }> = ({
  data,
}) => {
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation({ noDrift: true });
  const points = data.dataPoints || [];
  const maxValue = Math.max(...points.map((p) => p.value), 1);
  const accent = palette.amber;

  return (
    <Background variant={(data as any).backgroundVariant || "dark"}>
      <AbsoluteFill style={compStyle}>
        {/* Title area */}
        <div
          style={{
            position: "absolute",
            top: shortsLayout.titleTop,
            left: shortsLayout.safeArea.left,
            right: shortsLayout.safeArea.right,
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 40,
              fontFamily: fonts.display,
              fontWeight: fontWeights.bold,
              color: dark.text.primary,
              letterSpacing: letterSpacing.h2,
              opacity: fadeIn(frame, 0, 10),
              lineHeight: 1.2,
            }}
          >
            {data.title}
          </div>
          {data.subtitle && (
            <div
              style={{
                fontSize: 22,
                fontFamily: fonts.body,
                color: dark.text.secondary,
                marginTop: 12,
                opacity: fadeIn(frame, 5, 8),
              }}
            >
              {data.subtitle}
            </div>
          )}
        </div>

        {/* Bars area */}
        <div
          style={{
            position: "absolute",
            top: shortsLayout.contentTop + 40,
            left: shortsLayout.safeArea.left + 16,
            right: shortsLayout.safeArea.right + 16,
          }}
        >
          {points.map((point, i) => (
            <HorizontalBar
              key={i}
              point={point}
              index={i}
              maxValue={maxValue}
              frame={frame}
              unit={data.unit || ""}
              defaultColor={accent}
            />
          ))}
        </div>

        {/* Source */}
        {data.source && (
          <div
            style={{
              position: "absolute",
              bottom: shortsLayout.safeArea.bottom,
              left: shortsLayout.safeArea.left,
              right: shortsLayout.safeArea.right,
              textAlign: "center",
              fontSize: 14,
              fontFamily: fonts.body,
              color: dark.text.muted,
              opacity: fadeIn(frame, 30, 8),
            }}
          >
            {data.source}
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};
