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
} from "remotion";
import {
  palette,
  semantic,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
  durations,
  light,
} from "../../design/theme";
import { fadeIn, slideIn, stagger, CLAMP_CUBIC } from "../../utils/animation";
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
    CLAMP_CUBIC
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
          transform: `translateY(${slideIn(frame, barStart - 4, 8, 6)}px)`,
        }}
      >
        <span
          style={{
            fontSize: 24,
            fontFamily: fonts.display,
            fontWeight: fontWeights.medium,
            color: light.text.primary,
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
          backgroundColor: `${light.text.muted}20`,
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
            color: light.text.muted,
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
    <Background variant={(data as any).backgroundVariant || "light"}>
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
              color: light.text.primary,
              letterSpacing: letterSpacing.h2,
              opacity: fadeIn(frame, 0, 10),
              transform: `translateY(${slideIn(frame, 0, 12, 10)}px)`,
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
                color: light.text.secondary,
                marginTop: 12,
                opacity: fadeIn(frame, 5, 8),
                transform: `translateY(${slideIn(frame, 5, 10, 8)}px)`,
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
              color: light.text.muted,
              opacity: fadeIn(frame, 30, 8),
              transform: `translateY(${slideIn(frame, 30, 8, 8)}px)`,
            }}
          >
            {data.source}
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};
