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
  useVideoConfig,
  interpolate,
} from "remotion";
import { palette, light, semantic, fonts, fontSizes, layout, sec, shadows, gradients, contentArea, textMaxWidth } from "../../design/theme";
import { TitleBlock } from "../../components/TitleBlock";
import { fadeIn, stagger, pulse, kenBurnsDrift, exitFade, bloomIntensity, gridlineDraw, focusPull, easings, CLAMP, CLAMP_SINE, CLAMP_CUBIC_INOUT } from "../../utils/animation";
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
  isHighlighted?: boolean;
}> = React.memo(({ value, maxValue, label, sublabel, color, unit, frame, startFrame, barWidth, maxHeight, isHighlighted = false }) => {
  // ── Role-based easing: hero bar gets quintic + overshoot, normal gets quartic ──
  const barEasing = isHighlighted ? easings.heroBar : easings.bar;
  const growDuration = isHighlighted ? sec(1.4) : sec(1.2); // hero bar takes slightly longer

  const growProgress = interpolate(
    frame,
    [startFrame, startFrame + growDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: barEasing,
    }  // Note: barEasing is role-based (easings.heroBar or easings.bar), keep inline for now
  );

  // ── Number overshoot: value briefly exceeds target then settles back ──
  const overshootAmount = isHighlighted ? 0.04 : 0.02; // 4% overshoot for hero, 2% for normal
  const rawProgress = interpolate(
    frame,
    [startFrame, startFrame + growDuration, startFrame + growDuration + sec(0.3)],
    [0, 1 + overshootAmount, 1],
    CLAMP
  );

  const barHeight = (value / maxValue) * maxHeight * growProgress;
  const displayValue = Math.round(value * Math.min(rawProgress, 1 + overshootAmount));
  const opacity = fadeIn(frame, startFrame, sec(0.3));

  // Layer 2: Value labels appear after bar finishes growing — sine easing for softness
  const labelOpacity = interpolate(
    frame,
    [startFrame + growDuration, startFrame + growDuration + sec(0.4)],
    [0, 1],
    CLAMP_SINE
  );

  // Micro-settle pulse after bar finishes growing — slightly stronger
  const pulseScale = pulse(frame, startFrame + growDuration, 9, isHighlighted ? 1.04 : 1.02);

  // Light bloom behind highlighted bars
  const highlightBloom = isHighlighted
    ? bloomIntensity(frame, startFrame + sec(0.6), sec(0.3), 0.5)
    : 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        opacity,
        width: barWidth,
        height: maxHeight + layout.spacing.xxxl, // bar area + label below
      }}
    >
      {/* Value label — positioned just above bar top — Layer 2: fade in after bar growth */}
      <div
        style={{
          fontSize: isHighlighted ? fontSizes.h2 : fontSizes.h3,
          fontWeight: isHighlighted ? 700 : 600,
          color: isHighlighted ? color : light.text.primary,
          marginBottom: layout.spacing.xs,
          fontFamily: fonts.mono,
          textAlign: "center",
          opacity: labelOpacity,
          textShadow: isHighlighted
            ? `0 0 12px ${color}60, ${shadows.textLift}`
            : shadows.textLift,
        }}
      >
        {displayValue}
        <span style={{ fontSize: fontSizes.caption, color: light.text.muted }}>
          {unit}
        </span>
      </div>

      {/* Bar — gradient fill + drop shadow + pulse effect + hero glow */}
      <div style={{ position: "relative" }}>
        {/* Multi-layer bloom: outer soft glow + inner sharp halo + breathing pulse */}
        {isHighlighted && highlightBloom > 0 && (
          <>
            {/* Layer 1: Outer soft bloom (40px blur) */}
            <div
              style={{
                position: "absolute",
                bottom: -10,
                left: "50%",
                width: barWidth * 2,
                height: barHeight * 1.1,
                transform: "translateX(-50%)",
                background: `radial-gradient(ellipse at center bottom, ${color}30 0%, transparent 65%)`,
                opacity: highlightBloom * 0.7,
                filter: "blur(40px)",
                pointerEvents: "none",
              }}
            />
            {/* Layer 2: Inner sharp halo (4px blur) */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                width: barWidth * 0.9,
                height: barHeight,
                transform: "translateX(-50%)",
                background: `radial-gradient(ellipse at center bottom, ${color}50 0%, transparent 80%)`,
                opacity: highlightBloom * 0.9,
                filter: "blur(4px)",
                pointerEvents: "none",
              }}
            />
            {/* Layer 3: Breathing pulse — opacity oscillates at ~2Hz */}
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                width: barWidth * 1.5,
                height: barHeight * 0.8,
                transform: "translateX(-50%)",
                background: `radial-gradient(ellipse at center bottom, ${color}25 0%, transparent 60%)`,
                opacity: 0.15 + 0.1 * Math.sin(frame * 0.4), // ~2Hz breathing at 30fps
                filter: "blur(20px)",
                pointerEvents: "none",
              }}
            />
          </>
        )}
        <div
          style={{
            width: barWidth * 0.7,
            height: barHeight,
            background: gradients.barFill(color),
            borderRadius: "4px 4px 0 0",
            transition: "none",
            boxShadow: isHighlighted
              ? `${shadows.medium}, 0 0 20px ${color}40, 0 0 50px ${color}20`
              : shadows.subtle,
            transform: `scale(${pulseScale})`,
            transformOrigin: "bottom center",
          }}
        />
        {/* Specular highlight — thin bright edge at bar top */}
        {barHeight > 4 && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: "15%",
              width: "70%",
              height: 2,
              background: `linear-gradient(90deg, transparent 0%, ${palette.bone}40 30%, ${palette.bone}60 50%, ${palette.bone}40 70%, transparent 100%)`,
              borderRadius: "4px 4px 0 0",
              opacity: growProgress,
              pointerEvents: "none",
            }}
          />
        )}
      </div>

      {/* Label — text shadow for dark background */}
      <div
        style={{
          fontSize: fontSizes.caption,
          color: light.text.primary,
          marginTop: layout.spacing.sm,
          textAlign: "center",
          fontWeight: 500,
          textShadow: shadows.textLift,
        }}
      >
        {label}
      </div>
      {sublabel && (
        <div
          style={{
            fontSize: fontSizes.small,
            color: light.text.muted,
            marginTop: 2,
            textAlign: "center",
            textShadow: shadows.textLift,
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
      <div style={{ display: "flex", gap: layout.spacing.xs, alignItems: "flex-end" }}>
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
          color: light.text.primary,
          marginTop: layout.spacing.xs,
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
  const { durationInFrames } = useVideoConfig();

  // Memoize expensive data computations
  const maxValBar = useMemo(
    () => Math.max(...(data.dataPoints || []).map((d) => d.value)),
    [data.dataPoints]
  );

  // Adaptive sizing: scale bar width, gap, and label font based on item count
  const itemCount = data.dataPoints?.length || data.comparisonPairs?.length || 1;
  const density = itemCount <= 3 ? "sparse" : itemCount <= 5 ? "normal" : "dense";
  const labelFontSize = density === "dense" ? fontSizes.small : fontSizes.caption;
  const barGap = density === "dense" ? layout.spacing.md : layout.spacing.xl;
  const area = contentArea("content");

  const barWidth = useMemo(
    () => Math.min(
      density === "dense" ? 100 : 160,
      area.width / (data.dataPoints?.length || 1) - barGap
    ),
    [data.dataPoints?.length, barGap, density]
  );

  const comparisonData = useMemo(() => {
    const allVals = (data.comparisonPairs || []).flatMap((p) => [
      p.leftValue,
      p.rightValue,
    ]);
    return {
      maxVal: Math.max(...allVals),
      pairWidth: area.width / (data.comparisonPairs?.length || 1) - layout.spacing.md
    };
  }, [data.comparisonPairs]);
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation();

  const chartArea = {
    top: area.top,
    bottom: layout.safeArea.bottom + layout.spacing.xxl, // extra space for labels below bars
    left: area.left,
    right: area.right,
  };
  const maxHeight = layout.height - chartArea.top - chartArea.bottom;
  const unit = data.unit || "";

  // ── Gridline configuration ─────────────────────────────────────────────
  const gridLineCount = 5; // 0%, 25%, 50%, 75%, 100%
  const chartWidth = layout.width - chartArea.left - chartArea.right;

  // ── Focus pull: compute highlight bar's finish frame ────────────────────
  const highlightBarIndex = data.highlightIndex ?? -1;
  const highlightFinishFrame = highlightBarIndex >= 0
    ? stagger(highlightBarIndex, sec(0.15), sec(0.8)) + sec(1.4) // hero bar duration
    : sec(1.5); // fallback: halfway through first bar stagger

  return (
    <Background variant="light" tint={data.backgroundTint}>
      <AbsoluteFill
        style={{
          ...compStyle,
          opacity: exitFade(frame, durationInFrames, 15),
        }}
      >
      <TitleBlock title={data.title} subtitle={data.subtitle} />

      {/* ── Chart area — with gridlines + focus pull ──────────────────── */}
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
          gap: barGap,
          transform: `scale(${
            highlightBarIndex >= 0
              ? focusPull(frame, durationInFrames, highlightFinishFrame)
              : kenBurnsDrift(frame, durationInFrames)
          })`,
          transformOrigin: highlightBarIndex >= 0 ? "center 70%" : "center center",
        }}
      >
        {/* ── Gridlines — structure layer, draws in before data ──────── */}
        <svg
          width={chartWidth}
          height={maxHeight}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          {Array.from({ length: gridLineCount }).map((_, i) => {
            const y = (i / (gridLineCount - 1)) * maxHeight;
            const progress = gridlineDraw(frame, sec(0.2), sec(0.6), i, sec(0.06));
            const pctLabel = Math.round(((gridLineCount - 1 - i) / (gridLineCount - 1)) * 100);
            return (
              <g key={i}>
                {/* Grid line — draws from left to right */}
                <line
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke={light.text.muted}
                  strokeWidth={i === gridLineCount - 1 ? 1 : 0.5}
                  strokeOpacity={i === gridLineCount - 1 ? 0.2 : 0.08}
                  strokeDasharray={chartWidth}
                  strokeDashoffset={chartWidth * (1 - progress)}
                />
                {/* Y-axis label — fades in after line draws */}
                <text
                  x={-12}
                  y={y + 4}
                  textAnchor="end"
                  fill={light.text.muted}
                  fontSize={fontSizes.meta}
                  fontFamily={fonts.data}
                  opacity={interpolate(
                    frame,
                    [sec(0.4) + i * sec(0.06), sec(0.7) + i * sec(0.06)],
                    [0, 0.5],
                    CLAMP_SINE
                  )}
                >
                  {pctLabel}{unit}
                </text>
              </g>
            );
          })}
        </svg>
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
              startFrame={stagger(i, sec(0.15), sec(0.8))}
              barWidth={barWidth}
              maxHeight={maxHeight}
              isHighlighted={data.highlightIndex === i}
            />
          ))}

        {/* ── Reference line (threshold / target / baseline) ────────── */}
        {data.variant === "bar" && data.referenceLine && (() => {
          const refY = (1 - data.referenceLine.value / maxValBar) * maxHeight;
          const refOpacity = fadeIn(frame, sec(1.5), sec(0.5));
          // Sweep easing: line scans in from left to right
          const refSweep = interpolate(
            frame,
            [sec(1.5), sec(1.5) + sec(0.8)],
            [0, 1],
            CLAMP_CUBIC_INOUT
          );
          // Label fades in after line finishes scanning — sine easing
          const refLabelOpacity = interpolate(
            frame,
            [sec(1.5) + sec(0.8), sec(1.5) + sec(1.1)],
            [0, 1],
            CLAMP_SINE
          );
          const refColor = data.referenceLine.color || palette.amber;
          return (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: maxHeight - refY + 80, // 80 = label space below bars
                opacity: refOpacity,
                display: "flex",
                alignItems: "center",
                pointerEvents: "none",
              }}
            >
              <svg width="100%" height="2" style={{ position: "absolute", overflow: "visible" }}>
                {/* Reference line sweeps in via clipPath */}
                <defs>
                  <clipPath id="ref-sweep">
                    <rect x="0" y="-2" width={`${refSweep * 100}%`} height="6" />
                  </clipPath>
                </defs>
                <line
                  x1="0" y1="0" x2="100%" y2="0"
                  stroke={refColor}
                  strokeWidth="2"
                  strokeDasharray="8 6"
                  clipPath="url(#ref-sweep)"
                  style={{ filter: `drop-shadow(0 0 4px ${refColor}40)` }}
                />
              </svg>
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: -22,
                  fontSize: fontSizes.small,
                  color: refColor,
                  fontFamily: fonts.mono,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  textShadow: shadows.textLift,
                  opacity: refLabelOpacity,
                }}
              >
                {data.referenceLine.label} — {data.referenceLine.value}{unit}
              </div>
            </div>
          );
        })()}

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
              startFrame={stagger(i, sec(0.15), sec(0.8))}
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
            gap: layout.spacing.md,
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
            <span style={{ fontSize: fontSizes.caption, color: light.text.muted }}>
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
            <span style={{ fontSize: fontSizes.caption, color: light.text.muted }}>
              {data.rightGroupLabel}
            </span>
          </div>
        </div>
      )}

      {/* ── Source attribution — sine easing for softness ─────────────── */}
      {data.source && (
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom,
            right: layout.safeArea.right,
            fontSize: fontSizes.small,
            color: light.text.muted,
            fontFamily: fonts.mono,
            opacity: interpolate(
              frame,
              [sec(2), sec(2) + sec(0.6)],
              [0, 1],
              CLAMP_SINE
            ),
          }}
        >
          Source: {data.source}
        </div>
      )}

      {/* ── Context note — frames what the data means ─────────────────── */}
      {data.contextNote && (
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom + (data.source ? 24 : 0),
            left: layout.safeArea.left,
            maxWidth: (layout.width - layout.safeArea.left - layout.safeArea.right) * 0.55,
            fontSize: fontSizes.caption,
            color: light.text.secondary,
            fontStyle: "italic",
            lineHeight: 1.4,
            opacity: interpolate(
              frame,
              [sec(2.5), sec(2.5) + sec(0.6)],
              [0, 1],
              CLAMP_SINE
            ),
            textShadow: shadows.textLift,
          }}
        >
          {data.contextNote}
        </div>
      )}
      </AbsoluteFill>
    </Background>
  );
};
