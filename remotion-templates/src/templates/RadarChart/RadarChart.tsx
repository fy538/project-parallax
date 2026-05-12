/**
 * RadarChart — multi-axis polygon comparison.
 *
 * Plots subjects as filled polygons on a radar/spider chart.
 * Polygons grow outward from center, and can optionally morph
 * from a prior state to show change over time.
 *
 * SVG-based rendering for crisp lines at any scale.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Easing,
} from "remotion";
import {
  fonts,
  fontSizes,
  layout,
  sec,
  contentArea,
  radii,
  shadows,
  palette,
} from "../../design/theme";
import { Legend } from "../../components/Legend";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  exitFade,
  pulse,
  CLAMP,
  CLAMP_CUBIC,
  CLAMP_CUBIC_INOUT,
  CLAMP_QUARTIC,
  CLAMP_SINE,
} from "../../utils/animation";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { checkChartDataCommon } from "../../utils/dataWarnings";
import { AmbientParticles } from "../../components/AmbientParticles";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import type { RadarChartData, RadarSubject, AxisFocusStep } from "./types";

// ── Geometry helpers ─────────────────────────────────────────────────────────

/** Convert axis index + value to (x, y) on the radar. */
const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  axisIndex: number,
  totalAxes: number,
  value: number // 0-100
): { x: number; y: number } => {
  const angle = (Math.PI * 2 * axisIndex) / totalAxes - Math.PI / 2;
  const r = (value / 100) * radius;
  return {
    x: centerX + r * Math.cos(angle),
    y: centerY + r * Math.sin(angle),
  };
};

/** Build an SVG polygon points string from a subject's values. */
const buildPolygonPoints = (
  values: number[],
  centerX: number,
  centerY: number,
  radius: number
): string =>
  values
    .map((v, i) => {
      const pt = polarToCartesian(centerX, centerY, radius, i, values.length, v);
      return `${pt.x},${pt.y}`;
    })
    .join(" ");

/** Interpolate between two value arrays. */
const lerpValues = (from: number[], to: number[], t: number): number[] =>
  to.map((v, i) => (from[i] ?? 0) + (v - (from[i] ?? 0)) * t);

// ── Main component ───────────────────────────────────────────────────────────

export const RadarChart: React.FC<{ data: RadarChartData }> = ({ data }) => {
  checkChartDataCommon("RadarChart", data);
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const theme = useThemeMode(data.backgroundVariant);
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  // Pace-aware scaling for grid draw + polygon grow + morph cadence.
  const t = direction.paceTimingScale;
  // Per-episode color emphasis for the focus-axis label tint.
  const emphasis = useEpisodeColorEmphasis();
  const area = contentArea("content", "generous");

  const numAxes = data.axes.length;
  const gridLevels = data.gridLevels || [25, 50, 75, 100];

  // ── Chart dimensions ────────────────────────────────────────────────────
  const chartSize = Math.min(area.width * 0.6, area.height - 40);
  const radius = chartSize / 2 - 40;
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;

  // ── Timing ──────────────────────────────────────────────────────────────
  const gridDrawFrames = sec(1 * t);
  const polygonGrowFrames = sec(1.5 * t);
  const morphFrames = sec(2 * t);
  const outroFrames = sec(1.5);

  const gridStart = sec(0.3 * t);
  const polygonStart = gridStart + gridDrawFrames;
  const morphStart = polygonStart + polygonGrowFrames + sec(0.5);

  // ── Axis focus sequence (rotation mode) ─────────────────────────────────
  const hasAxisFocus = !!data.axisFocusSequence && data.axisFocusSequence.length > 0;

  // Build cumulative frame boundaries for axis focus steps
  const axisFocusBounds = useMemo(() => {
    if (!hasAxisFocus || !data.axisFocusSequence) return [];
    const bounds: Array<{ start: number; end: number; step: AxisFocusStep }> = [];
    // Start axis focus after morph completes (or after polygons grow)
    let cumulative = sec(morphStart ? 4 : 3);
    for (const step of data.axisFocusSequence) {
      const stepFrames = sec(step.duration);
      bounds.push({ start: cumulative, end: cumulative + stepFrames, step });
      cumulative += stepFrames;
    }
    return bounds;
  }, [hasAxisFocus, data.axisFocusSequence, morphStart]);

  // Determine current focused axis
  let currentFocusAxisIndex = -1;
  let focusRotationAngle = 0;
  let focusAnnotation: string | undefined;
  let focusLabel: string | undefined;

  if (hasAxisFocus && axisFocusBounds.length > 0) {
    // Find current step
    let currentBound = axisFocusBounds[0];
    for (const bound of axisFocusBounds) {
      if (frame >= bound.start) currentBound = bound;
    }

    if (frame >= currentBound.start) {
      currentFocusAxisIndex = currentBound.step.axisIndex;
      focusAnnotation = currentBound.step.annotation;
      focusLabel = currentBound.step.label;

      // Rotation: bring focused axis to the top (12 o'clock position)
      // The angle for axis i is (2π * i / numAxes - π/2). To move it to top (-π/2),
      // we need to rotate by -(2π * i / numAxes)
      const targetAngle = -(360 * currentFocusAxisIndex) / numAxes;

      // Find previous bound for interpolation (first step rotates from 0°)
      const currentIdx = axisFocusBounds.indexOf(currentBound);
      const prevBound = currentIdx > 0 ? axisFocusBounds[currentIdx - 1] : null;
      const prevAngle = prevBound
        ? -(360 * prevBound.step.axisIndex) / numAxes
        : 0;

      const transitionEnd = Math.min(currentBound.start + sec(0.8), currentBound.end);
      focusRotationAngle = interpolate(
        frame,
        [currentBound.start, transitionEnd],
        [prevAngle, targetAngle],
        { ...CLAMP, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }
      );
    }
  }

  // Vertex pulse for focused axis — SINGLE pulse on landing (not continuous).
  // The dossier convention: "one pulse is punctuation, repeated pulse is
  // anxiety." When axis focus arrives, vertex pulses once (1.0 → 1.2 → 1.0
  // over ~12 frames) to confirm landing, then holds.
  // See: references/template-research/motion-design.md § 2 (single-pulse-on-landing)
  const vertexPulseScale = hasAxisFocus && currentFocusAxisIndex >= 0 && axisFocusBounds.length > 0
    ? (() => {
        // Find the current bound's start frame for the focused axis.
        const currentBoundForPulse = axisFocusBounds.find(
          (b) => b.step.axisIndex === currentFocusAxisIndex && frame >= b.start,
        );
        if (!currentBoundForPulse) return 1;
        // Pulse 12 frames AFTER focus settles (transitionEnd = +sec(0.8)),
        // so the pulse reads as "I've arrived" punctuation.
        const pulseStart = currentBoundForPulse.start + sec(0.8);
        return pulse(frame, pulseStart, 12, 1.2);
      })()
    : 1;

  // ── Grid progress ──────────────────────────────────────────────────────
  const gridProgress = interpolate(
    frame,
    [gridStart, gridStart + gridDrawFrames],
    [0, 1],
    CLAMP_CUBIC
  );

  // ── Polygon grow progress ──────────────────────────────────────────────
  const growProgress = interpolate(
    frame,
    [polygonStart, polygonStart + polygonGrowFrames],
    [0, 1],
    CLAMP_QUARTIC
  );

  // ── Morph progress (if morphFrom provided) ─────────────────────────────
  const morphProgress = data.morphFrom
    ? interpolate(
        frame,
        [morphStart, morphStart + morphFrames],
        [0, 1],
        CLAMP_CUBIC_INOUT
      )
    : 1;

  // ── Exit ───────────────────────────────────────────────────────────────
  const exit = exitFade(frame, durationInFrames, outroFrames);

  // ── Morph highlight: per-subject, axis with biggest delta during morph ──
  const morphHighlightAxisPerSubject = useMemo(() => {
    if (!data.morphFrom) return [];
    return data.subjects.map((subj, si) => {
      const from = data.morphFrom?.[si]?.values;
      if (!from) return -1;
      let maxDelta = 0;
      let maxIdx = -1;
      for (let i = 0; i < subj.values.length; i++) {
        const d = Math.abs(subj.values[i] - (from[i] ?? 0));
        if (d > maxDelta) {
          maxDelta = d;
          maxIdx = i;
        }
      }
      return maxIdx;
    });
  }, [data.morphFrom, data.subjects]);

  // ── Compute current polygon values ─────────────────────────────────────
  const currentSubjects: RadarSubject[] = useMemo(() => {
    if (data.morphFrom && morphProgress < 1) {
      return data.subjects.map((subj, i) => {
        const from = data.morphFrom![i];
        if (!from) return subj;
        return {
          ...subj,
          values: lerpValues(from.values, subj.values, morphProgress),
        };
      });
    }
    return data.subjects;
  }, [data.subjects, data.morphFrom, morphProgress]);

  // Defensive guard — schema's `axes.min(3)` + `subjects.min(1)` should catch
  // this at validation time, but template code paths that bypass Zod (e.g.,
  // direct prop spread via composition tooling, programmatic construction
  // where TS can't express minimum array length) could still produce empty
  // arrays. Without this guard, `polarToCartesian` divides by `numAxes` and
  // produces NaN-valued SVG points. Mirrors the 17af733 belt-and-suspenders
  // pattern from TimeSeriesChart / DataChart small-multiples.
  // Placed after all hooks (last useMemo: `currentSubjects`) for Rules-of-Hooks.
  if (data.axes.length < 3 || data.subjects.length === 0) return null;

  // ── Grid lines color ───────────────────────────────────────────────────
  const gridColor = theme.isDark ? "rgba(240,230,208,0.10)" : "rgba(28,24,20,0.06)";
  const axisColor = theme.isDark ? "rgba(240,230,208,0.15)" : "rgba(28,24,20,0.12)";

  const gridOpacity = fadeIn(frame, gridStart, sec(0.4)) * exit;
  const polygonOpacity = fadeIn(frame, polygonStart, sec(0.4)) * exit;
  const legendOpacity =
    fadeIn(frame, polygonStart + sec(0.5), sec(0.4)) * exit;

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
      tint={direction.backgroundTint}
    >
      <AbsoluteFill style={compStyle}>
        {/* Brand strips */}
        <HeaderStrip mode={data.backgroundVariant || "light"} metadata={data.episode} />
        <FooterStrip mode={data.backgroundVariant || "light"} />

        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={data.backgroundVariant}
          safeAreaTier="generous"
          syncPoints={direction.syncPoints}
        />

      {/* Chart area */}
      <div
        style={{
          position: "absolute",
          top: area.top,
          left: area.left,
          width: area.width,
          height: area.height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: layout.spacing.xxxl,
        }}
      >
        <svg
          width={chartSize}
          height={chartSize}
          viewBox={`0 0 ${chartSize} ${chartSize}`}
          style={{
            opacity: gridOpacity,
            overflow: "visible",
            transform: hasAxisFocus ? `rotate(${focusRotationAngle}deg)` : undefined,
            transformOrigin: "center center",
            transformBox: "fill-box",
            transition: "none",
          }}
        >
          {/* Per-subject radial gradients — denser center, transparent edges */}
          <defs>
            {currentSubjects.map((subj, si) => (
              <radialGradient
                key={`subj-grad-${si}`}
                id={`radar-subj-grad-${si}`}
                cx="50%"
                cy="50%"
                r="50%"
              >
                <stop offset="0%" stopColor={subj.color} stopOpacity={(subj.fillOpacity ?? 0.2) * 1.6} />
                <stop offset="60%" stopColor={subj.color} stopOpacity={(subj.fillOpacity ?? 0.2)} />
                <stop offset="100%" stopColor={subj.color} stopOpacity={0} />
              </radialGradient>
            ))}
          </defs>

          {/* Grid rings with fade-in animation */}
          <g opacity={fadeIn(frame, gridStart, sec(0.4))}>
            {gridLevels.map((level) => {
              const points = Array.from({ length: numAxes }, (_, i) => {
                const pt = polarToCartesian(
                  centerX,
                  centerY,
                  radius * gridProgress,
                  i,
                  numAxes,
                  level
                );
                return `${pt.x},${pt.y}`;
              }).join(" ");
              return (
                <polygon
                  key={level}
                  points={points}
                  fill="none"
                  stroke={gridColor}
                  strokeWidth={1}
                />
              );
            })}

            {/* Grid level labels at 12 o'clock — small percentage markers */}
            {gridLevels.map((level) => {
              const pt = polarToCartesian(centerX, centerY, radius * gridProgress, 0, numAxes, level);
              return (
                <text
                  key={`grid-label-${level}`}
                  x={pt.x + 6}
                  y={pt.y + 3}
                  fill={theme.text.muted}
                  fontSize={fontSizes.meta}
                  fontFamily={fonts.mono}
                  opacity={0.45}
                >
                  {level}
                </text>
              );
            })}

            {/* Axis spokes */}
            {data.axes.map((_, i) => {
              const end = polarToCartesian(
                centerX,
                centerY,
                radius,
                i,
                numAxes,
                100 * gridProgress
              );
              return (
                <line
                  key={i}
                  x1={centerX}
                  y1={centerY}
                  x2={end.x}
                  y2={end.y}
                  stroke={axisColor}
                  strokeWidth={1}
                />
              );
            })}
          </g>

          {/* Axis labels with fade-in animation */}
          <g opacity={fadeIn(frame, gridStart, sec(0.4))}>
            {data.axes.map((axis, i) => {
              const labelPt = polarToCartesian(
                centerX,
                centerY,
                radius + 28,
                i,
                numAxes,
                100
              );
              const angle = (Math.PI * 2 * i) / numAxes - Math.PI / 2;
              const isRight = Math.cos(angle) > 0.1;
              const isLeft = Math.cos(angle) < -0.1;
              const anchor = isRight ? "start" : isLeft ? "end" : "middle";

              return (
                <text
                  key={i}
                  x={labelPt.x}
                  y={labelPt.y}
                  textAnchor={anchor}
                  dominantBaseline="central"
                  fill={theme.text.secondary}
                  fontSize={fontSizes.label}
                  fontFamily={fonts.body}
                >
                  {axis.short || axis.label}
                </text>
              );
            })}
          </g>

          {/* Subject polygons */}
          {currentSubjects.map((subj, si) => {
            const scaledValues = subj.values.map((v) => v * growProgress);
            const points = buildPolygonPoints(
              scaledValues,
              centerX,
              centerY,
              radius
            );

            // Morph highlight: during morph, find axis with biggest |delta| and
            // bump that vertex's stroke briefly.
            const morphHighlightAxis = morphHighlightAxisPerSubject[si] ?? -1;
            const morphHighlightActive =
              data.morphFrom &&
              morphHighlightAxis >= 0 &&
              morphProgress > 0.2 &&
              morphProgress < 1.0;

            return (
              <g key={si} opacity={polygonOpacity}>
                <polygon
                  points={points}
                  fill={`url(#radar-subj-grad-${si})`}
                  stroke={subj.color}
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                />
                {/* Morph highlight: thicker stroke segment on the axis with biggest change */}
                {morphHighlightActive && (() => {
                  const a = morphHighlightAxis;
                  const fromPt = polarToCartesian(centerX, centerY, radius, (a + numAxes - 1) % numAxes, numAxes, scaledValues[(a + numAxes - 1) % numAxes]);
                  const peakPt = polarToCartesian(centerX, centerY, radius, a, numAxes, scaledValues[a]);
                  const toPt = polarToCartesian(centerX, centerY, radius, (a + 1) % numAxes, numAxes, scaledValues[(a + 1) % numAxes]);
                  return (
                    <polyline
                      points={`${fromPt.x},${fromPt.y} ${peakPt.x},${peakPt.y} ${toPt.x},${toPt.y}`}
                      fill="none"
                      stroke={subj.color}
                      strokeWidth={4.5}
                      strokeLinejoin="round"
                      opacity={interpolate(morphProgress, [0.2, 0.5, 0.95], [0, 1, 0], CLAMP_SINE)}
                      style={{ filter: `drop-shadow(0 0 8px ${subj.color}80)` }}
                    />
                  );
                })()}
                {/* Vertex dots — pulse when axis is focused */}
                {scaledValues.map((v, vi) => {
                  const pt = polarToCartesian(
                    centerX,
                    centerY,
                    radius,
                    vi,
                    numAxes,
                    v
                  );
                  const isAxisFocused = hasAxisFocus && vi === currentFocusAxisIndex;
                  const dotRadius = isAxisFocused ? 6 * vertexPulseScale : 4;
                  // Counter-rotate text so labels stay upright
                  const counterRotation = hasAxisFocus ? -focusRotationAngle : 0;
                  return (
                    <g key={vi}>
                      {/* Outer glow for focused vertex */}
                      {isAxisFocused && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={12 * vertexPulseScale}
                          fill={subj.color}
                          opacity={0.15}
                        />
                      )}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={dotRadius}
                        fill={subj.color}
                        stroke={theme.bg.base}
                        strokeWidth={2}
                      />
                      {/* Specular speck — tiny white dot upper-left, suggests dimensional vertex */}
                      <circle
                        cx={pt.x - dotRadius * 0.35}
                        cy={pt.y - dotRadius * 0.35}
                        r={dotRadius * 0.3}
                        fill="white"
                        opacity={0.5}
                      />
                      {/* Value callout for focused vertex */}
                      {isAxisFocused && si === 0 && (
                        <text
                          x={pt.x}
                          y={pt.y - 18}
                          textAnchor="middle"
                          fill={subj.color}
                          fontSize={fontSizes.label}
                          fontFamily={fonts.data}
                          fontWeight={700}
                          transform={`rotate(${counterRotation} ${pt.x} ${pt.y - 18})`}
                        >
                          {Math.round(subj.values[vi])}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Legend (right of chart, vertically centered via flex parent) */}
        <Legend
          items={data.subjects.map((subj) => ({
            label: subj.name,
            color: subj.color,
          }))}
          frame={frame}
          exit={exit}
          theme={theme}
          layout="vertical"
          swatchSize={20}
          fontSize="body"
          textColor={theme.text.primary}
          gap={layout.spacing.lg}
          startFrame={polygonStart + sec(0.5)}
          fadeInDuration={sec(0.4)}
        />

        {/* Morph label */}
        {data.morphFrom && (
          <div
            style={{
              position: "absolute",
              left: chartSize + layout.spacing.xl,
              bottom: "35%",
              fontSize: fontSizes.caption,
              color: theme.text.muted,
              fontFamily: fonts.body,
              opacity: legendOpacity * (morphProgress > 0 && morphProgress < 1 ? 1 : 0.5),
            }}
          >
            {morphProgress < 1 ? "Transitioning..." : "Current state"}
          </div>
        )}
      </div>

      {/* Axis focus annotation */}
      {hasAxisFocus && focusAnnotation && (
        <div
          style={{
            position: "absolute",
            bottom: layout.safeAreaTier.generous.bottom + 40,
            left: layout.safeAreaTier.generous.left,
            maxWidth: layout.width * 0.45,
            fontSize: fontSizes.label,
            fontFamily: fonts.body,
            color: theme.text.secondary,
            fontStyle: "italic",
            lineHeight: 1.4,
            opacity: fadeIn(frame, 0, sec(0.4)) * exit,
            textShadow: theme.textShadow,
          }}
        >
          {focusAnnotation}
        </div>
      )}

      {/* Axis focus label */}
      {hasAxisFocus && focusLabel && (
        <div
          style={{
            position: "absolute",
            top: layout.safeAreaTier.generous.top + layout.spacing.xxl,
            right: layout.safeAreaTier.generous.right,
            fontSize: fontSizes.caption,
            fontFamily: fonts.data,
            color: emphasis.primaryAccent,
            letterSpacing: 1,
            opacity: fadeIn(frame, 0, sec(0.3)) * exit,
            textShadow: shadows.textLift,
          }}
        >
          {focusLabel}
        </div>
      )}

      {/* Ambient particles */}
      {data.ambientParticles && (
        <AmbientParticles
          mode={data.backgroundVariant || "light"}
          density={15}
          speed={0.2}
          maxOpacity={0.07}
        />
      )}

      {/* Source attribution — shared component for consistent placement. */}
      <SourceAttribution source={data.source} mode={data.backgroundVariant || "light"} prefix="Source: " />
    </AbsoluteFill>
    </Background>
  );
};
