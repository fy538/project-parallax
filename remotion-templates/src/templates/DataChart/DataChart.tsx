/**
 * DataChart — animated bar chart and comparison chart.
 *
 * Bars grow upward with eased animation. Values count up alongside.
 * Supports single-series bars, side-by-side comparisons, and horizontal bars.
 *
 * EP01 use cases: SMIC 34 vs 9 lithography passes, yield rates, chip demand %.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { palette, dark, semantic, fonts, fontSizes, layout, sec } from "../../design/theme";
import { fadeIn, stagger } from "../../utils/animation";
import { Background } from "../../components/Background";
import { FadeIn } from "../../components/FadeIn";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import type { DataChartData } from "./types";

// ── Animated bar ────────────────────────────────────────────────────────────

const AnimatedBar: React.FC<{
  value: number;
  maxValue: number;
  label: string;
  sublabel?: string;
  color: string;
  unit: string;
  frame: number;
  startFrame: number;
  barWidth: number;
  maxHeight: number;
}> = React.memo(({ value, maxValue, label, sublabel, color, unit, frame, startFrame, barWidth, maxHeight }) => {
  const growProgress = interpolate(
    frame,
    [startFrame, startFrame + sec(1.2)],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );

  const barHeight = (value / maxValue) * maxHeight * growProgress;
  const displayValue = Math.round(value * growProgress);
  const opacity = fadeIn(frame, startFrame, sec(0.3));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        opacity,
        width: barWidth,
        height: maxHeight + 80, // bar area + label below
      }}
    >
      {/* Value label — positioned just above bar top */}
      <div
        style={{
          fontSize: fontSizes.h3,
          fontWeight: 600,
          color: dark.text.primary,
          marginBottom: 8,
          fontFamily: fonts.mono,
          textAlign: "center",
        }}
      >
        {displayValue}
        <span style={{ fontSize: fontSizes.caption, color: dark.text.muted }}>
          {unit}
        </span>
      </div>

      {/* Bar */}
      <div
        style={{
          width: barWidth * 0.7,
          height: barHeight,
          backgroundColor: color,
          borderRadius: "4px 4px 0 0",
          transition: "none",
        }}
      />

      {/* Label */}
      <div
        style={{
          fontSize: fontSizes.caption,
          color: dark.text.primary,
          marginTop: 12,
          textAlign: "center",
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      {sublabel && (
        <div
          style={{
            fontSize: fontSizes.small,
            color: dark.text.muted,
            marginTop: 2,
            textAlign: "center",
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
});

// ── Comparison pair (two bars side by side) ──────────────────────────────────

const ComparisonBars: React.FC<{
  label: string;
  leftValue: number;
  rightValue: number;
  leftLabel?: string;
  rightLabel?: string;
  leftColor: string;
  rightColor: string;
  maxValue: number;
  unit: string;
  frame: number;
  startFrame: number;
  pairWidth: number;
  maxHeight: number;
}> = React.memo((props) => {
  const barWidth = useMemo(() => props.pairWidth * 0.35, [props.pairWidth]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: props.pairWidth,
      }}
    >
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <AnimatedBar
          value={props.leftValue}
          maxValue={props.maxValue}
          label={props.leftLabel || ""}
          color={props.leftColor}
          unit={props.unit}
          frame={props.frame}
          startFrame={props.startFrame}
          barWidth={barWidth}
          maxHeight={props.maxHeight}
        />
        <AnimatedBar
          value={props.rightValue}
          maxValue={props.maxValue}
          label={props.rightLabel || ""}
          color={props.rightColor}
          unit={props.unit}
          frame={props.frame}
          startFrame={props.startFrame + sec(0.3)}
          barWidth={barWidth}
          maxHeight={props.maxHeight}
        />
      </div>
      <div
        style={{
          fontSize: fontSizes.caption,
          color: dark.text.primary,
          marginTop: 8,
          fontWeight: 500,
        }}
      >
        {props.label}
      </div>
    </div>
  );
});

// ── Main component ──────────────────────────────────────────────────────────

export const DataChart: React.FC<{ data: DataChartData }> = ({ data }) => {
  // Memoize expensive data computations
  const maxValBar = useMemo(
    () => Math.max(...(data.dataPoints || []).map((d) => d.value)),
    [data.dataPoints]
  );

  const barWidth = useMemo(
    () => Math.min(
      160,
      (layout.width - (layout.safeArea.left + 40) - (layout.safeArea.right + 40)) /
        (data.dataPoints?.length || 1) -
        20
    ),
    [data.dataPoints?.length]
  );

  const comparisonData = useMemo(() => {
    const allVals = (data.comparisonPairs || []).flatMap((p) => [
      p.leftValue,
      p.rightValue,
    ]);
    return {
      maxVal: Math.max(...allVals),
      pairWidth: (layout.width - (layout.safeArea.left + 40) - (layout.safeArea.right + 40)) /
        (data.comparisonPairs?.length || 1) -
        20
    };
  }, [data.comparisonPairs]);
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation();

  const chartArea = {
    top: layout.safeArea.top + 100,
    bottom: layout.safeArea.bottom + 60,
    left: layout.safeArea.left + 40,
    right: layout.safeArea.right + 40,
  };
  const maxHeight = layout.height - chartArea.top - chartArea.bottom;
  const unit = data.unit || "";

  return (
    <Background variant="dark">
      <AbsoluteFill style={compStyle}>
      {/* ── Title ──────────────────────────────────────────────────────── */}
      <FadeIn startFrame={0} direction="up" distance={20}>
        <div
          style={{
            position: "absolute",
            top: layout.safeArea.top,
            left: layout.safeArea.left,
          }}
        >
          <div
            style={{
              fontSize: fontSizes.h2,
              fontWeight: 600,
              color: dark.text.primary,
              fontFamily: fonts.heading,
            }}
          >
            {data.title}
          </div>
          {data.subtitle && (
            <div
              style={{
                fontSize: fontSizes.body,
                color: dark.text.muted,
                marginTop: 6,
              }}
            >
              {data.subtitle}
            </div>
          )}
        </div>
      </FadeIn>

      {/* ── Chart area ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: chartArea.top,
          left: chartArea.left,
          right: chartArea.right,
          bottom: chartArea.bottom,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 40,
        }}
      >
        {data.variant === "bar" &&
          data.dataPoints?.map((dp, i) => (
            <AnimatedBar
              key={i}
              value={dp.value}
              maxValue={maxValBar}
              label={dp.label}
              sublabel={dp.sublabel}
              color={dp.color || palette.amber}
              unit={unit}
              frame={frame}
              startFrame={stagger(i, sec(0.4), sec(1))}
              barWidth={barWidth}
              maxHeight={maxHeight}
            />
          ))}

        {data.variant === "comparison" &&
          data.comparisonPairs?.map((pair, i) => (
            <ComparisonBars
              key={i}
              label={pair.label}
              leftValue={pair.leftValue}
              rightValue={pair.rightValue}
              leftLabel={pair.leftLabel || data.leftGroupLabel}
              rightLabel={pair.rightLabel || data.rightGroupLabel}
              leftColor={data.leftGroupColor || semantic.us}
              rightColor={data.rightGroupColor || semantic.china}
              maxValue={comparisonData.maxVal}
              unit={unit}
              frame={frame}
              startFrame={stagger(i, sec(0.6), sec(1))}
              pairWidth={comparisonData.pairWidth}
              maxHeight={maxHeight}
            />
          ))}
      </div>

      {/* ── Legend for comparisons ──────────────────────────────────────── */}
      {data.variant === "comparison" && (
        <div
          style={{
            position: "absolute",
            top: layout.safeArea.top + 10,
            right: layout.safeArea.right,
            display: "flex",
            gap: 24,
            opacity: fadeIn(frame, sec(0.5), sec(0.5)),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 2,
                backgroundColor: data.leftGroupColor || semantic.us,
              }}
            />
            <span style={{ fontSize: fontSizes.caption, color: dark.text.muted }}>
              {data.leftGroupLabel}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 2,
                backgroundColor: data.rightGroupColor || semantic.china,
              }}
            />
            <span style={{ fontSize: fontSizes.caption, color: dark.text.muted }}>
              {data.rightGroupLabel}
            </span>
          </div>
        </div>
      )}

      {/* ── Source attribution ──────────────────────────────────────────── */}
      {data.source && (
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom - 20,
            right: layout.safeArea.right,
            fontSize: fontSizes.small,
            color: dark.text.muted,
            opacity: fadeIn(frame, sec(2), sec(0.5)),
          }}
        >
          Source: {data.source}
        </div>
      )}
      </AbsoluteFill>
    </Background>
  );
};
