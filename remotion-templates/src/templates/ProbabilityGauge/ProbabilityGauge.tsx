/**
 * ProbabilityGauge — confidence meters, market prices, and prediction tracking.
 *
 * Three variants:
 *   gauge: Semi-circular arc gauges (1-3) with percentage labels
 *   shift: Horizontal bars showing probability transitions
 *   scorecard: Grid of past predictions with outcomes
 *
 * Oracle format for Parallax episodes: geopolitical event probabilities,
 * Kalshi market integration, and confidence tracking.
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
  fontWeights,
  letterSpacing,
  layout,
  sec,
  contentArea,
  radii,
  cardPresets,
} from "../../design/theme";
import { fadeIn, slideIn, stagger, exitFade, pulse, CLAMP, CLAMP_CUBIC } from "../../utils/animation";
import { contentShadow, cardStyle } from "../../utils/depth";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { checkChartDataCommon } from "../../utils/dataWarnings";
import { AmbientParticles } from "../../components/AmbientParticles";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import type { ProbabilityGaugeData, ShiftItem, ScorecardItem } from "./types";

// ── Gauge Arc Component ────────────────────────────────────────────────────

const GaugeArc: React.FC<{
  value: number;
  label: string;
  marketSource?: string;
  color: string;
  frame: number;
  startFrame: number;
  arcRadius: number;
  mode: "light" | "dark";
}> = React.memo(({ value, label, marketSource, color, frame, startFrame, arcRadius, mode }) => {
  const theme = useThemeMode(mode);
  const strokeWidth = 12;
  const circumference = useMemo(() => Math.PI * arcRadius * 2, [arcRadius]);

  // Animate arc fill with spring overshoot (overshoots 3% then settles)
  const overshootTarget = Math.min((value / 100) * 1.03, 1.0);
  const arcProgress = interpolate(
    frame,
    [startFrame, startFrame + sec(1.2), startFrame + sec(1.5)],
    [0, overshootTarget, value / 100],
    CLAMP_CUBIC
  );

  const strokeDashoffset = circumference * (1 - arcProgress);

  // Micro-settle pulse when arc finishes filling
  const settleFrame = startFrame + sec(1.5);
  const settleScale = pulse(frame, settleFrame, 9, 1.03);

  // Count up the percentage
  const displayValue = Math.round(value * (arcProgress / (value / 100 || 1)));
  const opacity = fadeIn(frame, startFrame, sec(0.3));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: layout.spacing.md,
        opacity,
      }}
    >
      {/* SVG Arc */}
      <svg
        width={arcRadius * 2 + strokeWidth + 24}
        height={arcRadius + strokeWidth + 24}
        viewBox={`-12 -8 ${arcRadius * 2 + strokeWidth + 24} ${arcRadius + strokeWidth + 32}`}
        style={{ filter: `drop-shadow(${contentShadow(true)})`, overflow: "visible" }}
      >
        {/* Background arc (full circle, muted) */}
        <path
          d={`M ${strokeWidth / 2} ${arcRadius + strokeWidth / 2} A ${arcRadius} ${arcRadius} 0 0 1 ${arcRadius * 2 + strokeWidth / 2} ${arcRadius + strokeWidth / 2}`}
          stroke={theme.text.muted}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          opacity={0.2}
        />

        {/* Tick marks at 0/25/50/75/100 — small nubs outside the arc */}
        {[0, 25, 50, 75, 100].map((tickPct) => {
          const tickAngle = Math.PI - (tickPct / 100) * Math.PI; // π → 0
          const cx = arcRadius + strokeWidth / 2;
          const cy = arcRadius + strokeWidth / 2;
          const innerR = arcRadius + strokeWidth / 2 + 2;
          const outerR = arcRadius + strokeWidth / 2 + 8;
          const x1 = cx + Math.cos(tickAngle) * innerR;
          const y1 = cy - Math.sin(tickAngle) * innerR;
          const x2 = cx + Math.cos(tickAngle) * outerR;
          const y2 = cy - Math.sin(tickAngle) * outerR;
          return (
            <line
              key={`tick-${tickPct}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={theme.text.muted}
              strokeWidth={1}
              opacity={0.45}
            />
          );
        })}

        {/* Foreground arc (animating) — with accent glow */}
        <path
          d={`M ${strokeWidth / 2} ${arcRadius + strokeWidth / 2} A ${arcRadius} ${arcRadius} 0 0 1 ${arcRadius * 2 + strokeWidth / 2} ${arcRadius + strokeWidth / 2}`}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />

        {/* Specular highlight — thin bright line along the top of the arc (catches light) */}
        <path
          d={`M ${strokeWidth / 2} ${arcRadius + strokeWidth / 2} A ${arcRadius} ${arcRadius} 0 0 1 ${arcRadius * 2 + strokeWidth / 2} ${arcRadius + strokeWidth / 2}`}
          stroke="rgba(255,255,255,0.45)"
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transform: "translateY(-3px)" }}
        />

        {/* Triangular pointer at current arc terminus */}
        {arcProgress > 0.04 && (() => {
          const ptrAngle = Math.PI - arcProgress * Math.PI;
          const cx = arcRadius + strokeWidth / 2;
          const cy = arcRadius + strokeWidth / 2;
          const tipR = arcRadius + strokeWidth / 2 + 2;
          const baseR = arcRadius + strokeWidth / 2 + 14;
          const tipX = cx + Math.cos(ptrAngle) * tipR;
          const tipY = cy - Math.sin(ptrAngle) * tipR;
          const ax = cx + Math.cos(ptrAngle + 0.18) * baseR;
          const ay = cy - Math.sin(ptrAngle + 0.18) * baseR;
          const bx = cx + Math.cos(ptrAngle - 0.18) * baseR;
          const by = cy - Math.sin(ptrAngle - 0.18) * baseR;
          return (
            <polygon
              points={`${tipX},${tipY} ${ax},${ay} ${bx},${by}`}
              fill={color}
              style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
            />
          );
        })()}
      </svg>

      {/* Percentage label in center — with accent glow + settle pulse */}
      <div
        style={{
          position: "relative",
          top: -arcRadius - layout.spacing.md,
          fontSize: fontSizes.display,
          fontWeight: fontWeights.bold,
          color: theme.text.primary,
          fontFamily: fonts.data,
          textAlign: "center",
          lineHeight: 1,
          textShadow: `0 0 20px ${color}40, 0 0 40px ${color}20`,
          transform: `scale(${settleScale})`,
          transformOrigin: "center",
        }}
      >
        {displayValue}
        <span style={{ fontSize: fontSizes.h2, color: color }}>%</span>
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: fontSizes.body,
          color: theme.text.primary,
          fontWeight: fontWeights.semibold,
          textAlign: "center",
          maxWidth: 180,
        }}
      >
        {label}
      </div>

      {/* Market source badge */}
      {marketSource && (
        <div
          style={{
            fontSize: fontSizes.meta,
            color: theme.text.muted,
            fontFamily: fonts.mono,
            letterSpacing: letterSpacing.meta,
            textTransform: "uppercase",
          }}
        >
          {marketSource}
        </div>
      )}
    </div>
  );
});

// ── Shift Bar Component ────────────────────────────────────────────────────

const ShiftBar: React.FC<{
  item: ShiftItem;
  frame: number;
  startFrame: number;
  index: number;
  mode: "light" | "dark";
}> = React.memo(({ item, frame, startFrame, index, mode }) => {
  const theme = useThemeMode(mode);
  // Timeline: before value appears → pause → after value animates
  const beforeStart = startFrame;
  const pauseEnd = beforeStart + sec(0.8);
  const afterEnd = pauseEnd + sec(1.2);

  const beforeOpacity = fadeIn(frame, beforeStart, sec(0.3));
  const pauseOpacity = interpolate(
    frame,
    [pauseEnd - sec(0.2), pauseEnd],
    [1, 0],
    CLAMP
  );

  const afterProgress = interpolate(
    frame,
    [pauseEnd, afterEnd],
    [0, 1],
    CLAMP_CUBIC
  );

  const displayAfter = Math.round(item.after * afterProgress);

  // Determine color: green for success, red for danger, neutral otherwise
  const isIncrease = item.after > item.before;
  const barColor = item.color || (isIncrease ? semantic.success : semantic.danger);

  const barWidth = 360;
  const barHeight = 8;
  const trackOpacity = 0.15;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: layout.spacing.xs,
        opacity: fadeIn(frame, beforeStart, sec(0.4)),
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: fontSizes.body,
          fontWeight: fontWeights.semibold,
          color: theme.text.primary,
        }}
      >
        {item.label}
      </div>

      {/* Bar container */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: layout.spacing.sm,
        }}
      >
        {/* Before value */}
        <div
          style={{
            fontSize: fontSizes.label,
            fontFamily: fonts.data,
            color: theme.text.secondary,
            minWidth: 40,
            opacity: beforeOpacity,
          }}
        >
          {item.before}%
        </div>

        {/* Animated bar transition */}
        <div
          style={{
            position: "relative",
            width: barWidth,
            height: barHeight,
          }}
        >
          {/* Track (always visible, low opacity) */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: barColor,
              opacity: trackOpacity,
              borderRadius: 4,
            }}
          />
          {/* Progress fill — vertical gradient + specular line */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${displayAfter}%`,
              background: `linear-gradient(180deg, ${barColor}E0 0%, ${barColor} 100%)`,
              borderRadius: 4,
              boxShadow: `0 0 8px ${barColor}55, inset 0 -1px 1px rgba(0,0,0,0.18)`,
            }}
          />
          {/* Specular thin line */}
          {displayAfter > 0 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0.5,
                height: 1,
                width: `${displayAfter}%`,
                background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)`,
                borderRadius: 4,
                pointerEvents: "none",
              }}
            />
          )}

          {/* Animated arrow indicator (slides from before → after) */}
          {pauseOpacity > 0 && (() => {
            const arrowProgress = interpolate(
              frame,
              [pauseEnd, afterEnd],
              [item.before, item.after],
              CLAMP_CUBIC
            );
            return (
              <div
                style={{
                  position: "absolute",
                  left: `${arrowProgress}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: fontSizes.h3,
                  color: barColor,
                  opacity: pauseOpacity,
                  textShadow: `0 0 6px ${barColor}80`,
                  fontWeight: 700,
                  pointerEvents: "none",
                }}
              >
                {isIncrease ? "▶" : "◀"}
              </div>
            );
          })()}
        </div>

        {/* After value */}
        <div
          style={{
            fontSize: fontSizes.label,
            fontFamily: fonts.data,
            color: theme.text.primary,
            fontWeight: fontWeights.semibold,
            minWidth: 40,
            opacity: interpolate(
              frame,
              [pauseEnd - sec(0.1), pauseEnd],
              [0, 1],
              CLAMP
            ),
          }}
        >
          {displayAfter}%
        </div>
      </div>

      {/* Trigger text */}
      {item.trigger && (
        <div
          style={{
            fontSize: fontSizes.caption,
            color: theme.text.muted,
            fontStyle: "italic",
            maxWidth: barWidth + 100,
          }}
        >
          {item.trigger}
        </div>
      )}
    </div>
  );
});

// ── Scorecard Component ────────────────────────────────────────────────────

const Scorecard: React.FC<{
  items: ScorecardItem[];
  frame: number;
  startFrame: number;
  mode: "light" | "dark";
}> = React.memo(({ items, frame, startFrame, mode }) => {
  const theme = useThemeMode(mode);
  const calibration = useMemo(() => {
    const correct = items.filter((i) => i.outcome === "correct").length;
    const total = items.length;
    return { correct, total, calibration: Math.round((correct / total) * 100) };
  }, [items]);

  return (
    <div style={{ ...cardPresets.shadowFloat(mode === "dark"), display: "inline-block" }}>
      {/* Table */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: fontSizes.body,
          fontFamily: fonts.mono,
        }}
      >
        <thead>
          <tr style={{ borderBottom: `1px solid ${theme.text.muted}40` }}>
            <th style={{ textAlign: "left", padding: `${layout.spacing.xs}px 0`, color: theme.text.muted }}>
              Prediction
            </th>
            <th style={{ textAlign: "center", padding: `${layout.spacing.xs}px 0`, color: theme.text.muted }}>
              Your Est.
            </th>
            <th style={{ textAlign: "center", padding: `${layout.spacing.xs}px 0`, color: theme.text.muted }}>
              Market
            </th>
            <th style={{ textAlign: "center", padding: `${layout.spacing.xs}px 0`, color: theme.text.muted }}>
              Outcome
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => {
            const rowStartFrame = startFrame + stagger(i, sec(0.2), 0);
            const rowOpacity = fadeIn(frame, rowStartFrame, sec(0.3));

            return (
              <tr
                key={i}
                style={{
                  borderBottom: `1px solid ${theme.text.muted}30`,
                  opacity: rowOpacity,
                  transform: `translateY(${slideIn(frame, rowStartFrame, layout.spacing.xs, sec(0.3))}px)`,
                }}
              >
                <td style={{ padding: `${layout.spacing.xs}px 0`, color: theme.text.primary }}>
                  {item.prediction}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    padding: `${layout.spacing.xs}px 0`,
                    color: theme.text.secondary,
                  }}
                >
                  {item.yourEstimate}%
                </td>
                <td
                  style={{
                    textAlign: "center",
                    padding: `${layout.spacing.xs}px 0`,
                    color: theme.text.secondary,
                  }}
                >
                  {item.marketPrice !== undefined ? `${item.marketPrice}%` : "—"}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    padding: `${layout.spacing.xs}px 0`,
                    fontSize: fontSizes.title,
                  }}
                >
                  {item.outcome === "correct" && (
                    <span
                      style={{
                        color: semantic.success,
                        textShadow: `0 0 12px ${semantic.success}80, 0 0 4px ${semantic.success}60`,
                        display: "inline-block",
                      }}
                    >
                      ✓
                    </span>
                  )}
                  {item.outcome === "wrong" && (
                    <span
                      style={{
                        color: semantic.danger,
                        textShadow: `0 0 12px ${semantic.danger}80, 0 0 4px ${semantic.danger}60`,
                        display: "inline-block",
                      }}
                    >
                      ✕
                    </span>
                  )}
                  {item.outcome === "pending" && (
                    <span
                      style={{
                        color: palette.amber,
                        textShadow: `0 0 8px ${palette.amber}60`,
                        opacity: 0.5 + 0.3 * Math.sin(frame * 0.08),
                        display: "inline-block",
                      }}
                    >
                      ◐
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary row */}
      <div
        style={{
          marginTop: layout.spacing.md,
          paddingTop: layout.spacing.xs,
          borderTop: `1px solid ${theme.text.muted}40`,
          display: "flex",
          justifyContent: "space-between",
          fontSize: fontSizes.body,
          fontWeight: fontWeights.semibold,
          color: theme.text.primary,
        }}
      >
        <span>
          {calibration.correct}/{calibration.total} correct
        </span>
        <span style={{ color: semantic.success }}>
          {calibration.calibration}% calibration
        </span>
      </div>
    </div>
  );
});

// ── Main Component ────────────────────────────────────────────────────────

export const ProbabilityGauge: React.FC<{ data: ProbabilityGaugeData }> = ({ data }) => {
  checkChartDataCommon("ProbabilityGauge", data);
  const frame = useCurrentFrame();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const { durationInFrames } = useVideoConfig();
  const bgVariant = data.backgroundVariant || "light";
  const theme = useThemeMode(bgVariant);
  const area = contentArea("content", "generous");

  return (
    <Background
      variant={bgVariant}
      tint={direction.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
      <AmbientParticles
        density={bgVariant === "dark" ? 20 : 10}
        mode={bgVariant as "dark" | "light"}
      />
      <AbsoluteFill style={{ opacity: exitFade(frame, durationInFrames, 15) }}>
        {/* Title */}
        <TitleBlock
          title={data.title}
          subtitle={data.subtitle}
          mode={bgVariant}
          safeAreaTier="generous"
        />

        {/* Content Area */}
        <div
          style={{
            position: "absolute",
            top: area.top,
            left: area.left,
            right: area.right,
            bottom: area.bottom,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: `0 ${layout.spacing.xxxl}px`,
          }}
        >
          {/* GAUGE VARIANT */}
          {data.variant === "gauge" && data.gauges && (
            <div
              style={{
                display: "flex",
                gap: layout.spacing.xxxl,
                justifyContent: "center",
                alignItems: "flex-start",
                width: "100%",
              }}
            >
              {data.gauges.map((gauge, i) => (
                <GaugeArc
                  key={i}
                  value={gauge.value}
                  label={gauge.label}
                  marketSource={gauge.marketSource}
                  color={gauge.color || palette.amber}
                  frame={frame}
                  startFrame={stagger(i, sec(0.4), sec(0.3))}
                  arcRadius={100}
                  mode={bgVariant as "light" | "dark"}
                />
              ))}
            </div>
          )}

          {/* SHIFT VARIANT */}
          {data.variant === "shift" && data.shifts && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: layout.spacing.xl,
                alignItems: "flex-start",
                width: "100%",
                maxWidth: 700,
              }}
            >
              {data.shifts.map((shift, i) => (
                <ShiftBar
                  key={i}
                  item={shift}
                  frame={frame}
                  startFrame={stagger(i, sec(0.8), sec(0.5))}
                  index={i}
                  mode={bgVariant as "light" | "dark"}
                />
              ))}
            </div>
          )}

          {/* SCORECARD VARIANT */}
          {data.variant === "scorecard" && data.scorecard && (
            <div
              style={{
                maxWidth: 900,
                opacity: fadeIn(frame, sec(0.3), sec(0.5)),
              }}
            >
              <Scorecard
                items={data.scorecard}
                frame={frame}
                startFrame={sec(0.5)}
                mode={bgVariant as "light" | "dark"}
              />
            </div>
          )}
        </div>

        {/* Source attribution — shared component for consistent placement. */}
        <SourceAttribution source={data.source} mode={bgVariant} prefix="Source: " startSec={1} />

      </AbsoluteFill>
      </AbsoluteFill>
      {/* Brand strips */}
      <HeaderStrip mode={bgVariant} metadata={data.episode} />
      <FooterStrip mode={bgVariant} />
    </Background>
  );
};
