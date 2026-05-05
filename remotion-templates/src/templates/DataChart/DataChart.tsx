/**
 * DataChart — animated bar chart and comparison chart.
 *
 * Bars grow upward with eased animation. Values count up alongside.
 * Supports single-series bars, side-by-side comparisons, and horizontal bars.
 *
 * silicon-trap use cases: SMIC 34 vs 9 lithography passes, yield rates, chip demand %.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { palette, semantic, fonts, fontSizes, layout, sec, shadows, gradients, contentArea, radii, barStyle, getCategoricalColor } from "../../design/theme";
import { formatNumber } from "../../utils/numberFormat";
import { niceDomain, niceTicks, formatTick } from "../../utils/niceTicks";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { Legend } from "../../components/Legend";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useThemeMode } from "../../hooks/useThemeMode";
import { fadeIn, stagger, pulse, exitFade, bloomIntensity, gridlineDraw, focusPull, easings, CLAMP, CLAMP_SINE, CLAMP_CUBIC_INOUT } from "../../utils/animation";
import { Background } from "../../components/Background";
import { AmbientParticles } from "../../components/AmbientParticles";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useNarratedCamera } from "../../hooks/useNarratedCamera";
import type { DataChartData, SpotlightStep } from "./types";
import type { CameraElement, NarratedCameraStep } from "../../hooks/useNarratedCamera";

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
  /** Render value as plain number (no thousand-separators) — for years, IDs, etc. */
  formatAsYear?: boolean;
}> = React.memo(({ value, maxValue, label, sublabel, color, unit, frame, startFrame, barWidth, maxHeight, isHighlighted = false, formatAsYear = false }) => {
  const theme = useThemeMode("light");
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
        height: maxHeight + 80, // bar area + label space below
      }}
    >
      {/* Value label — positioned just above bar top — Layer 2: fade in after bar growth */}
      <div
        style={{
          fontSize: isHighlighted ? fontSizes.h2 : fontSizes.h3,
          fontWeight: isHighlighted ? 700 : 600,
          color: isHighlighted ? color : theme.text.primary,
          marginBottom: layout.spacing.xs,
          fontFamily: fonts.mono,
          textAlign: "center",
          opacity: labelOpacity,
          textShadow: isHighlighted
            ? `0 0 12px ${color}60, ${shadows.textLift}`
            : shadows.textLift,
        }}
      >
        {formatAsYear
          ? String(Math.round(displayValue))
          : formatNumber(displayValue, {
              decimals: 0,
              style: displayValue >= 10000 ? "abbreviated" : "decimal",
            })}
        <span style={{ fontSize: fontSizes.caption, color: theme.text.muted }}>
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
                opacity: bloomIntensity(frame, startFrame + growDuration, 0.15, 0.25),
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
            borderRadius: barStyle.borderRadius,
            transition: "none",
            // Outer shadow + inset right-edge to suggest end-cap volume
            boxShadow: isHighlighted
              ? `${shadows.medium}, 0 0 20px ${color}40, 0 0 50px ${color}20, inset -1px 0 0 rgba(0,0,0,0.18)`
              : `${shadows.subtle}, inset -1px 0 0 rgba(0,0,0,0.15)`,
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
          color: theme.text.primary,
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
            color: theme.text.muted,
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
  formatAsYear?: boolean;
}> = React.memo((props) => {
  const theme = useThemeMode("light");
  const barWidth = useMemo(() => props.pairWidth * 0.35, [props.pairWidth]);

  // Hairline divider opacity grows as bars complete
  const hairlineOpacity = interpolate(
    props.frame,
    [props.startFrame + sec(0.4), props.startFrame + sec(1.0)],
    [0, 0.45],
    CLAMP
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: props.pairWidth,
      }}
    >
      <div style={{ display: "flex", gap: layout.spacing.xs, alignItems: "flex-end", position: "relative" }}>
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
          formatAsYear={props.formatAsYear}
        />
        {/* Vertical hairline between left/right bars — gradient fade ends */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "10%",
            bottom: "20%",
            width: 1,
            background: `linear-gradient(180deg, transparent 0%, ${theme.text.muted}80 30%, ${theme.text.muted}80 70%, transparent 100%)`,
            opacity: hairlineOpacity,
            pointerEvents: "none",
          }}
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
          formatAsYear={props.formatAsYear}
        />
      </div>
      <div
        style={{
          fontSize: fontSizes.caption,
          color: theme.text.primary,
          marginTop: layout.spacing.xs,
          fontWeight: 500,
          textShadow: shadows.textLift,
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
  const theme = useThemeMode("light");
  const direction = useDirection(data._direction);

  const hasSpotlight = !!data.spotlightSequence && data.spotlightSequence.length > 0;
  const showParticles = data.ambientParticles ?? false;

  // Memoize expensive data computations.
  // The y-axis domain is the *nice* range above the largest bar — so
  // axis ticks land on round numbers (0, 2000, 4000, 6000, 8000) and
  // bar heights scale against the niced max, not the raw data max.
  // This is the same domain-inference rule TimeSeriesChart uses; both
  // share the niceTicks utility.
  const dataMaxBar = useMemo(
    () => {
      const points = data.dataPoints || [];
      return points.length > 0 ? Math.max(...points.map((d) => d.value)) : 1;
    },
    [data.dataPoints]
  );
  const [, niceMaxBar] = useMemo(
    () => niceDomain(0, dataMaxBar, 5),
    [dataMaxBar]
  );
  const yTicks = useMemo(
    () => niceTicks(0, niceMaxBar, 5),
    [niceMaxBar]
  );
  // maxValBar (kept for downstream consumers) is now the niced ceiling,
  // not the raw data max. Bars at full data magnitude render at <100%
  // of the chart height — which is correct: the axis tops out higher
  // than the tallest bar so the bar doesn't kiss the title.
  const maxValBar = niceMaxBar;

  // Adaptive sizing: scale bar width, gap, and label font based on item count
  const itemCount = data.dataPoints?.length || data.comparisonPairs?.length || 1;
  const density = itemCount <= 3 ? "sparse" : itemCount <= 5 ? "normal" : "dense";
  const barGap = density === "dense" ? layout.spacing.md : layout.spacing.xl;
  const area = contentArea("content", "generous");

  const barWidth = useMemo(
    () => Math.min(
      density === "dense" ? 100 : 160,
      area.width / (data.dataPoints?.length || 1) - barGap
    ),
    [data.dataPoints?.length, barGap, density]
  );

  // ── Spotlight camera elements (bar centers) ─────────────────────────────
  const spotlightElements: CameraElement[] = useMemo(() => {
    if (!hasSpotlight || !data.dataPoints) return [];
    const numBars = data.dataPoints.length;
    const totalWidth = numBars * (barWidth + barGap) - barGap;
    const startX = (layout.width - totalWidth) / 2;
    return data.dataPoints.map((_, i) => ({
      id: `bar-${i}`,
      x: startX + i * (barWidth + barGap) + barWidth / 2,
      y: layout.height * 0.5, // center vertically
    }));
  }, [hasSpotlight, data.dataPoints, barWidth, barGap]);

  // Convert spotlight sequence to camera path
  const spotlightCameraPath: NarratedCameraStep[] = useMemo(() => {
    if (!hasSpotlight || !data.spotlightSequence) return [{ target: "overview" as const, zoom: 1, duration: 10 }];
    return data.spotlightSequence.map((step) => ({
      target: step.barIndices.length === 1
        ? `element:${step.barIndices[0]}`
        : "overview",
      zoom: step.zoom ?? 1.3,
      duration: step.duration,
      focus: step.barIndices,
      behavior: step.behavior || "track",
      label: step.label,
      dimAmount: 0.55,
      blurAmount: 1.2,
      unfocusedScale: 0.92,
    }));
  }, [hasSpotlight, data.spotlightSequence]);

  const spotlightCamera = useNarratedCamera({
    elements: spotlightElements,
    cameraPath: spotlightCameraPath,
    canvasWidth: layout.width,
    canvasHeight: layout.height,
    transitionSec: 0.6,
  });

  // Per-bar spotlight opacity (1.0 when no spotlight active)
  const getBarSpotlightOpacity = (barIndex: number): number => {
    if (!hasSpotlight) return 1;
    return spotlightCamera.getElementOpacity(barIndex);
  };

  const getBarSpotlightScale = (barIndex: number): number => {
    if (!hasSpotlight) return 1;
    return spotlightCamera.getElementScale(barIndex);
  };

  const comparisonData = useMemo(() => {
    const allVals = (data.comparisonPairs || []).flatMap((p) => [
      p.leftValue,
      p.rightValue,
    ]);
    return {
      maxVal: allVals.length > 0 ? Math.max(...allVals) : 1,
      pairWidth: area.width / (data.comparisonPairs?.length || 1) - layout.spacing.md
    };
  }, [data.comparisonPairs]);
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);

  const labelSpace = 80; // room for bar labels + sublabels below the bars
  const chartArea = {
    top: area.top + layout.spacing.md, // extra breathing room below title
    bottom: layout.safeArea.bottom + labelSpace + layout.spacing.lg,
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
    <Background
      variant="light"
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill
        style={{
          ...compStyle,
          opacity: exitFade(frame, durationInFrames, 15),
        }}
      >
      {/* Ambient particles */}
      {showParticles && (
        <AmbientParticles mode="light" density={15} speed={0.2} maxOpacity={0.06} />
      )}

      {/* Brand strips — intelligence-briefing texture */}
      <HeaderStrip metadata={data.episode} mode="light" />
      <FooterStrip scale={data.unit ? `SCALE · ${data.unit}` : undefined} mode="light" />

      <TitleBlock title={data.title} subtitle={data.subtitle} safeAreaTier="generous" />

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
          overflow: "visible",
          transform: `scale(${
            highlightBarIndex >= 0
              ? focusPull(frame, durationInFrames, highlightFinishFrame)
              : 1.0
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
          {yTicks.slice().reverse().map((tickValue, i) => {
            // Place ticks proportionally on the niced y-axis.
            // i=0 is at the top (highest tickValue), so y=0; i=last is at maxHeight.
            const y = (i / (yTicks.length - 1)) * maxHeight;
            const progress = gridlineDraw(frame, sec(0.2), sec(0.6), i, sec(0.06));
            // formatAsYear bypasses thousand-separator commas — same rule
            // applied to bar value labels above.
            const tickLabel = data.formatAsYear
              ? `${Math.round(tickValue)}${unit || ""}`
              : formatTick(tickValue, unit);
            // Gridlines recede after bars settle (peaks ~sec 0.8, fades over sec 1.5)
            // Multiplier on stroke-opacity: full when bars draw, ~50% after.
            const recede = interpolate(
              frame,
              [sec(0.8), sec(2.3)],
              [1.0, 0.45],
              CLAMP
            );
            return (
              <g key={i}>
                {/* Grid line — draws from left to right, then recedes */}
                <line
                  x1={0}
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke={theme.text.muted}
                  strokeWidth={i === gridLineCount - 1 ? 1 : 0.5}
                  strokeOpacity={(i === gridLineCount - 1 ? 0.2 : 0.15) * recede}
                  strokeDasharray={chartWidth}
                  strokeDashoffset={chartWidth * (1 - progress)}
                />
                {/* Y-axis tick mark — small 4px nub on chart left edge */}
                <line
                  x1={-4}
                  y1={y}
                  x2={0}
                  y2={y}
                  stroke={theme.text.muted}
                  strokeWidth={1}
                  strokeOpacity={0.4 * progress}
                />
                {/* Y-axis label — fades in after line draws */}
                <text
                  x={-20}
                  y={y + 4}
                  textAnchor="end"
                  fill={theme.text.muted}
                  fontSize={fontSizes.meta}
                  fontFamily={fonts.data}
                  opacity={interpolate(
                    frame,
                    [sec(0.4) + i * sec(0.06), sec(0.7) + i * sec(0.06)],
                    [0, 0.5],
                    CLAMP_SINE
                  )}
                >
                  {tickLabel}
                </text>
              </g>
            );
          })}
        </svg>
        {data.variant === "bar" &&
          data.dataPoints?.map((dp, i) => (
            <div
              key={i}
              style={{
                opacity: getBarSpotlightOpacity(i),
                transform: `scale(${getBarSpotlightScale(i)})`,
                transformOrigin: "bottom center",
              }}
            >
              <AnimatedBar
                value={dp.value}
                maxValue={maxValBar}
                label={dp.label}
                sublabel={dp.sublabel}
                color={dp.color || getCategoricalColor(i)}
                unit={unit}
                frame={frame}
                startFrame={stagger(i, sec(0.15), sec(0.8))}
                barWidth={barWidth}
                maxHeight={maxHeight}
                isHighlighted={data.highlightIndex === i}
                formatAsYear={data.formatAsYear}
              />
            </div>
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

        {/* ── Domain labels (category groupings below bars) ────────── */}
        {data.variant === "bar" && data.domainLabels && data.domainLabels.length > 0 && (() => {
          const numBars = data.dataPoints?.length || 0;
          const barsPerDomain = numBars > 0 ? Math.ceil(numBars / data.domainLabels.length) : 1;
          const domainOpacity = fadeIn(frame, sec(2), sec(0.5));
          return (
            <div
              style={{
                position: "absolute",
                bottom: 20,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "space-around",
                opacity: domainOpacity,
              }}
            >
              {data.domainLabels.map((dl, di) => (
                <div
                  key={di}
                  style={{
                    fontSize: fontSizes.small,
                    fontFamily: fonts.body,
                    color: theme.text.muted,
                    textAlign: "center",
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  {dl}
                </div>
              ))}
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
              formatAsYear={data.formatAsYear}
            />
          ))}
      </div>

      {/* ── Spotlight annotation overlay ──────────────────────────────────── */}
      {hasSpotlight && data.spotlightSequence && (() => {
        const currentStepIdx = spotlightCamera.stepIndex;
        const currentSpotlight = data.spotlightSequence[currentStepIdx];
        if (!currentSpotlight?.annotation) return null;
        const annotationOpacity = fadeIn(frame, sec(0.5), sec(0.4));
        return (
          <div
            style={{
              position: "absolute",
              top: layout.safeAreaTier.generous.top + 60,
              left: layout.safeAreaTier.generous.left,
              maxWidth: layout.width * 0.4,
              fontSize: fontSizes.label,
              fontFamily: fonts.body,
              color: theme.text.secondary,
              fontStyle: "italic",
              opacity: annotationOpacity,
              textShadow: shadows.textLift,
              lineHeight: 1.4,
            }}
          >
            {currentSpotlight.annotation}
          </div>
        );
      })()}

      {/* ── Spotlight label ─────────────────────────────────────────────── */}
      {hasSpotlight && spotlightCamera.currentLabel && (
        <div
          style={{
            position: "absolute",
            top: layout.safeAreaTier.generous.top + 60,
            right: layout.safeAreaTier.generous.right,
            fontSize: fontSizes.caption,
            fontFamily: fonts.data,
            color: palette.amber,
            letterSpacing: 1,
            opacity: fadeIn(frame, 0, sec(0.3)),
            textShadow: shadows.textLift,
          }}
        >
          {spotlightCamera.currentLabel}
        </div>
      )}

      {/* ── Legend for comparisons ──────────────────────────────────────── */}
      {data.variant === "comparison" && (
        <Legend
          items={[
            { label: data.leftGroupLabel, color: data.leftGroupColor || semantic.us },
            { label: data.rightGroupLabel, color: data.rightGroupColor || semantic.china },
          ]}
          frame={frame}
          exit={exitFade(frame, durationInFrames, 15)}
          theme={theme}
          startFrame={sec(0.5)}
          fadeInDuration={sec(0.5)}
          style={{
            position: "absolute",
            top: layout.safeAreaTier.generous.top + 10,
            right: layout.safeAreaTier.generous.right,
          }}
        />
      )}

      {/* ── Source attribution — uses the shared component so position,
          type, opacity, and fade timing match every other chart. */}
      <SourceAttribution source={data.source} mode="light" prefix="Source: " startSec={2} />

      {/* ── Context note — frames what the data means ─────────────────── */}
      {data.contextNote && (
        <div
          style={{
            position: "absolute",
            bottom: layout.safeArea.bottom + (data.source ? 24 : 0),
            left: layout.safeAreaTier.generous.left,
            maxWidth: (layout.width - layout.safeArea.left - layout.safeArea.right) * 0.55,
            fontSize: fontSizes.caption,
            color: theme.text.secondary,
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
