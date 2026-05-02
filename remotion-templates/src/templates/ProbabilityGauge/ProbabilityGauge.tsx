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
  light,
} from "../../design/theme";
import { fadeIn, slideIn, stagger, heroSpring, exitFade, CLAMP, CLAMP_CUBIC } from "../../utils/animation";
import { contentShadow, accentGlow, cardStyle } from "../../utils/depth";
import { Background } from "../../components/Background";
import { MetadataStrip } from "../../components/MetadataStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import type { ProbabilityGaugeData, GaugeItem, ShiftItem, ScorecardItem } from "./types";

// ── Gauge Arc Component ────────────────────────────────────────────────────

const GaugeArc: React.FC<{
  value: number;
  label: string;
  marketSource?: string;
  color: string;
  frame: number;
  startFrame: number;
  arcRadius: number;
}> = React.memo(({ value, label, marketSource, color, frame, startFrame, arcRadius }) => {
  const strokeWidth = 12;
  const circumference = useMemo(() => Math.PI * arcRadius * 2, [arcRadius]);

  // Animate arc fill from 0 to value using spring physics
  const arcProgress = interpolate(
    frame,
    [startFrame, startFrame + sec(1.5)],
    [0, value / 100],
    CLAMP_CUBIC
  );

  const strokeDashoffset = circumference * (1 - arcProgress);

  // Count up the percentage
  const displayValue = Math.round(value * arcProgress);
  const opacity = fadeIn(frame, startFrame, sec(0.3));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        opacity,
      }}
    >
      {/* SVG Arc */}
      <svg
        width={arcRadius * 2 + strokeWidth}
        height={arcRadius + strokeWidth}
        viewBox={`0 0 ${arcRadius * 2 + strokeWidth} ${arcRadius + strokeWidth + 20}`}
        style={{ filter: `drop-shadow(${contentShadow(true)})` }}
      >
        {/* Background arc (full circle, muted) */}
        <path
          d={`M ${strokeWidth / 2} ${arcRadius + strokeWidth / 2} A ${arcRadius} ${arcRadius} 0 0 1 ${arcRadius * 2 + strokeWidth / 2} ${arcRadius + strokeWidth / 2}`}
          stroke={light.text.muted}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          opacity={0.2}
        />

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
      </svg>

      {/* Percentage label in center — with accent glow */}
      <div
        style={{
          position: "relative",
          top: -arcRadius - 40,
          fontSize: fontSizes.display,
          fontWeight: fontWeights.bold,
          color: light.text.primary,
          fontFamily: fonts.data,
          textAlign: "center",
          lineHeight: 1,
          textShadow: `0 0 20px ${color}40, 0 0 40px ${color}20`,
        }}
      >
        {displayValue}
        <span style={{ fontSize: fontSizes.h2, color: light.text.muted }}>%</span>
      </div>

      {/* Label */}
      <div
        style={{
          fontSize: fontSizes.body,
          color: light.text.primary,
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
            color: light.text.muted,
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
}> = React.memo(({ item, frame, startFrame, index }) => {
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
        gap: 12,
        opacity: fadeIn(frame, beforeStart, sec(0.4)),
      }}
    >
      {/* Label */}
      <div
        style={{
          fontSize: fontSizes.body,
          fontWeight: fontWeights.semibold,
          color: light.text.primary,
        }}
      >
        {item.label}
      </div>

      {/* Bar container */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Before value */}
        <div
          style={{
            fontSize: fontSizes.label,
            fontFamily: fonts.data,
            color: light.text.secondary,
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
            backgroundColor: barColor,
            opacity: trackOpacity,
            borderRadius: 4,
          }}
        >
          {/* Progress fill — Remotion-driven, no CSS transition */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${displayAfter}%`,
              backgroundColor: barColor,
              borderRadius: 4,
              boxShadow: `0 0 8px ${barColor}40`,
            }}
          />

          {/* Arrow indicator (appears when animating) */}
          {pauseOpacity > 0 && (
            <div
              style={{
                position: "absolute",
                left: `${Math.min(item.before, displayAfter)}%`,
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: 16,
                opacity: pauseOpacity,
              }}
            >
              →
            </div>
          )}
        </div>

        {/* After value */}
        <div
          style={{
            fontSize: fontSizes.label,
            fontFamily: fonts.data,
            color: light.text.primary,
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
            color: light.text.muted,
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
}> = React.memo(({ items, frame, startFrame }) => {
  const calibration = useMemo(() => {
    const correct = items.filter((i) => i.outcome === "correct").length;
    const total = items.length;
    return { correct, total, calibration: Math.round((correct / total) * 100) };
  }, [items]);

  return (
    <div style={{ ...cardStyle(true, false), display: "inline-block" }}>
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
          <tr style={{ borderBottom: `1px solid ${light.text.muted}40` }}>
            <th style={{ textAlign: "left", padding: "12px 0", color: light.text.muted }}>
              Prediction
            </th>
            <th style={{ textAlign: "center", padding: "12px 0", color: light.text.muted }}>
              Your Est.
            </th>
            <th style={{ textAlign: "center", padding: "12px 0", color: light.text.muted }}>
              Market
            </th>
            <th style={{ textAlign: "center", padding: "12px 0", color: light.text.muted }}>
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
                  borderBottom: `1px solid ${light.text.muted}20`,
                  opacity: rowOpacity,
                  transform: `translateY(${slideIn(frame, rowStartFrame, 12, sec(0.3))}px)`,
                }}
              >
                <td style={{ padding: "12px 0", color: light.text.primary }}>
                  {item.prediction}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    padding: "12px 0",
                    color: light.text.secondary,
                  }}
                >
                  {item.yourEstimate}%
                </td>
                <td
                  style={{
                    textAlign: "center",
                    padding: "12px 0",
                    color: light.text.secondary,
                  }}
                >
                  {item.marketPrice !== undefined ? `${item.marketPrice}%` : "—"}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    padding: "12px 0",
                    fontSize: fontSizes.title,
                  }}
                >
                  {item.outcome === "correct" && (
                    <span style={{ color: semantic.success }}>✓</span>
                  )}
                  {item.outcome === "wrong" && (
                    <span style={{ color: semantic.danger }}>✕</span>
                  )}
                  {item.outcome === "pending" && (
                    <span style={{ color: light.text.muted }}>◐</span>
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
          marginTop: 20,
          paddingTop: 12,
          borderTop: `1px solid ${light.text.muted}40`,
          display: "flex",
          justifyContent: "space-between",
          fontSize: fontSizes.body,
          fontWeight: fontWeights.semibold,
          color: light.text.primary,
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
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation({ noExit: true });
  const { durationInFrames } = useVideoConfig();
  const bgVariant = data.backgroundVariant || "light";

  return (
    <Background variant={bgVariant}>
      <AbsoluteFill style={compStyle}>
      <AbsoluteFill style={{ opacity: exitFade(frame, durationInFrames, 15) }}>
        {/* Title */}
        <div
          style={{
            position: "absolute",
            top: layout.safeArea.top,
            left: layout.safeArea.left,
            right: layout.safeArea.right,
          }}
        >
          <div
            style={{
              fontSize: fontSizes.h2,
              fontWeight: fontWeights.bold,
              color: light.text.primary,
              fontFamily: fonts.heading,
              opacity: fadeIn(frame, 0, sec(0.5)),
              transform: `translateY(${slideIn(frame, 0, 20)}px)`,
            }}
          >
            {data.title}
          </div>
          {data.subtitle && (
            <div
              style={{
                fontSize: fontSizes.body,
                color: light.text.muted,
                marginTop: 8,
                opacity: fadeIn(frame, sec(0.2), sec(0.4)),
              }}
            >
              {data.subtitle}
            </div>
          )}
        </div>

        {/* Content Area */}
        <div
          style={{
            position: "absolute",
            top: layout.safeArea.top + 140,
            left: layout.safeArea.left,
            right: layout.safeArea.right,
            bottom: layout.safeArea.bottom + 40,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "0 80px",
          }}
        >
          {/* GAUGE VARIANT */}
          {data.variant === "gauge" && data.gauges && (
            <div
              style={{
                display: "flex",
                gap: 80,
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
                gap: 48,
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
              />
            </div>
          )}
        </div>

        {/* Source attribution */}
        {data.source && (
          <div
            style={{
              position: "absolute",
              bottom: layout.safeArea.bottom,
              right: layout.safeArea.right,
              fontSize: fontSizes.caption,
              color: light.text.muted,
              opacity: fadeIn(frame, sec(1), sec(0.5)),
              transform: `translateY(${slideIn(frame, sec(1), 8, sec(0.5))}px)`,
            }}
          >
            Source: {data.source}
          </div>
        )}

      </AbsoluteFill>
      </AbsoluteFill>
    </Background>
  );
};
