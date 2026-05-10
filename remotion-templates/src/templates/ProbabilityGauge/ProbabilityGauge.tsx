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
  textMaxWidth,
  shadows,
} from "../../design/theme";
import { fadeIn, slideIn, stagger, exitFade, pulse, CLAMP, CLAMP_CUBIC, CLAMP_SINE } from "../../utils/animation";
import { Background } from "../../components/Background";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { checkChartDataCommon } from "../../utils/dataWarnings";
import { AmbientParticles } from "../../components/AmbientParticles";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useBeatSync } from "../../hooks/useBeatSync";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { useThemeMode } from "../../hooks/useThemeMode";
import type { ProbabilityGaugeData, GaugeItem, ShiftItem, ScorecardItem, ForecastData } from "./types";

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
  /** Audio-reactive pulse from useBeatSync — adds extra overshoot on beat. 0 = no effect. */
  beatPulse?: number;
}> = React.memo(({ value, label, marketSource, color, frame, startFrame, arcRadius, mode, beatPulse = 0 }) => {
  const theme = useThemeMode(mode);
  const strokeWidth = 12;
  const circumference = useMemo(() => Math.PI * arcRadius * 2, [arcRadius]);

  // Animate arc fill with spring overshoot (overshoots 3% then settles).
  // Beat sync amplifies the overshoot up to ~7% on a strong pulse.
  const overshootTarget = Math.min((value / 100) * (1.03 + beatPulse * 0.04), 1.0);
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
        style={{ filter: `drop-shadow(${shadows.subtle})`, overflow: "visible" }}
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
          maxWidth: textMaxWidth.h1,
          textShadow: `0 0 20px ${color}40, 0 0 40px ${color}20`, // shadows.accentGlow double (20px + 40px halo)
          transform: `scale(${settleScale})`,
          transformOrigin: "center",
        }}
      >
        {displayValue}
        <span style={{ fontSize: fontSizes.h2, color: color, maxWidth: textMaxWidth.h2 }}>%</span>
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

// ── Probability Strip Component ────────────────────────────────────────────
//
// Multi-source probability comparison on a shared 0–100% axis. One row per
// source, dot landing at each value — Cleveland & McGill (1984) rank
// position-on-a-common-axis as the most perceptually accurate encoding.
// Editorial form used by NYT Upshot approval trackers, FiveThirtyEight model
// comparisons, and Economist forecast pages. Replaces the multi-arc gauge
// pattern, which fails on clustered values (labels collide at tick positions).
const ProbabilityStrip: React.FC<{
  items: GaugeItem[];
  frame: number;
  startFrame: number;
  width: number;
  defaultColor: string;
  mode: "light" | "dark";
}> = React.memo(({ items, frame, startFrame, width, defaultColor, mode }) => {
  const theme = useThemeMode(mode);

  // Layout: source-label gutter | shared 0–100% axis | value gutter
  const labelGutter = 280;
  const valueGutter = 140;
  const axisWidth = width - labelGutter - valueGutter;
  const rowHeight = 84;
  const rowGap = 8;
  const axisLabelHeight = 36;

  const values = items.map((g) => g.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const spread = maxVal - minVal;
  const showSpread = items.length >= 2 && spread >= 5;
  const spreadFade = showSpread
    ? fadeIn(frame, startFrame + sec(1.4) + items.length * sec(0.2), sec(0.4))
    : 0;

  const minorTicks = [0, 25, 50, 75, 100];
  const axisFade = fadeIn(frame, startFrame, sec(0.5));

  const totalRowsHeight = items.length * rowHeight + (items.length - 1) * rowGap;
  const totalHeight = totalRowsHeight + axisLabelHeight + 32 + (showSpread ? 56 : 0);

  return (
    <div
      style={{
        position: "relative",
        width,
        height: totalHeight,
      }}
    >
      {/* ── Spread annotation (top-right, above the rows) ─────────────── */}
      {showSpread && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: valueGutter,
            opacity: spreadFade,
            fontSize: fontSizes.meta,
            color: theme.text.muted,
            fontFamily: fonts.mono,
            letterSpacing: letterSpacing.meta,
            textTransform: "uppercase",
            maxWidth: textMaxWidth.label,
            whiteSpace: "nowrap",
          }}
        >
          {spread}-pt spread between forecasts
        </div>
      )}

      {/* ── Per-source rows ───────────────────────────────────────────── */}
      {items.map((item, i) => {
        const rowTop = (showSpread ? 56 : 0) + i * (rowHeight + rowGap);
        const rowStart = startFrame + sec(0.4) + i * sec(0.3);
        const rowFade = fadeIn(frame, rowStart, sec(0.4));
        const dotProgress = interpolate(
          frame,
          [rowStart + sec(0.2), rowStart + sec(0.8)],
          [0, 1],
          CLAMP_CUBIC
        );
        const valueOpacity = fadeIn(frame, rowStart + sec(0.5), sec(0.4));
        const settle = pulse(frame, rowStart + sec(0.8), 8, 1.04);
        const displayValue = Math.round(item.value * dotProgress);
        const color = item.color || defaultColor;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: rowTop,
              left: 0,
              width,
              height: rowHeight,
              opacity: rowFade,
              display: "flex",
              alignItems: "center",
            }}
          >
            {/* Source label gutter (left) */}
            <div
              style={{
                width: labelGutter,
                paddingRight: layout.spacing.lg,
                textAlign: "right",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
              }}
            >
              <div
                style={{
                  fontSize: fontSizes.h3,
                  fontWeight: fontWeights.semibold,
                  color: theme.text.primary,
                  fontFamily: fonts.heading,
                  lineHeight: 1.1,
                  maxWidth: textMaxWidth.label,
                }}
              >
                {item.label}
              </div>
              {item.marketSource && (
                <div
                  style={{
                    marginTop: 4,
                    fontSize: fontSizes.meta,
                    color: theme.text.muted,
                    fontFamily: fonts.mono,
                    letterSpacing: letterSpacing.meta,
                    textTransform: "uppercase",
                    maxWidth: textMaxWidth.label,
                  }}
                >
                  {item.marketSource}
                </div>
              )}
            </div>

            {/* Shared axis (middle) */}
            <div
              style={{
                width: axisWidth,
                height: rowHeight,
                position: "relative",
              }}
            >
              {/* Background track */}
              <div
                style={{
                  position: "absolute",
                  top: rowHeight / 2 - 1,
                  left: 0,
                  width: "100%",
                  height: 2,
                  background: theme.text.muted,
                  opacity: 0.18,
                }}
              />
              {/* Filled portion (0 → value) — subtle weight on the row's color */}
              <div
                style={{
                  position: "absolute",
                  top: rowHeight / 2 - 1.5,
                  left: 0,
                  width: `${item.value * dotProgress}%`,
                  height: 3,
                  background: color,
                  opacity: 0.45,
                  borderRadius: 2,
                }}
              />
              {/* Dot at the value */}
              <div
                style={{
                  position: "absolute",
                  top: rowHeight / 2,
                  left: `${item.value * dotProgress}%`,
                  transform: `translate(-50%, -50%) scale(${settle})`,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: color,
                  border: `3px solid ${theme.bg.base}`,
                  boxShadow: `0 0 12px ${color}60, ${shadows.subtle}`,
                  opacity: dotProgress > 0.05 ? 1 : 0,
                }}
              />
            </div>

            {/* Value gutter (right) */}
            <div
              style={{
                width: valueGutter,
                paddingLeft: layout.spacing.lg,
                fontSize: fontSizes.h2,
                fontWeight: fontWeights.bold,
                fontFamily: fonts.data,
                color: theme.text.primary,
                lineHeight: 1,
                opacity: valueOpacity,
                whiteSpace: "nowrap",
                maxWidth: textMaxWidth.label,
              }}
            >
              {displayValue}
              <span
                style={{
                  fontSize: fontSizes.h3,
                  color,
                  fontWeight: fontWeights.semibold,
                  marginLeft: 2,
                }}
              >
                %
              </span>
            </div>
          </div>
        );
      })}

      {/* ── Shared 0–100% axis (below the rows) ───────────────────────── */}
      <div
        style={{
          position: "absolute",
          top: (showSpread ? 56 : 0) + totalRowsHeight + 24,
          left: labelGutter,
          width: axisWidth,
          opacity: axisFade,
        }}
      >
        {/* Top border of axis */}
        <div
          style={{
            width: "100%",
            height: 1,
            background: theme.text.muted,
            opacity: 0.4,
          }}
        />
        {/* Tick marks + labels */}
        {minorTicks.map((pct) => (
          <div
            key={pct}
            style={{
              position: "absolute",
              top: 0,
              left: `${pct}%`,
              transform: "translateX(-50%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: 1,
                height: 6,
                background: theme.text.muted,
                opacity: 0.5,
              }}
            />
            <div
              style={{
                marginTop: 6,
                fontSize: fontSizes.meta,
                color: theme.text.muted,
                fontFamily: fonts.mono,
                letterSpacing: letterSpacing.meta,
                maxWidth: textMaxWidth.label,
                whiteSpace: "nowrap",
              }}
            >
              {pct}%
            </div>
          </div>
        ))}
      </div>
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
          maxWidth: textMaxWidth.label,
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
              boxShadow: `0 0 8px ${barColor}55, inset 0 -1px 1px rgba(0,0,0,0.18)`, // shadows.accentGlowSm + inset composite
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
                  maxWidth: textMaxWidth.node,
                  color: barColor,
                  opacity: pauseOpacity,
                  textShadow: `0 0 6px ${barColor}80`, // shadows.accentGlowSm (6px, 80% opacity variant)
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
              CLAMP_SINE
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
    // Guard: empty scorecard → avoid 0/0 = NaN
    const calibration = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, total, calibration };
  }, [items]);

  // Outcome → label, color, glyph triple
  const outcomeMeta = (outcome: ScorecardItem["outcome"]) => {
    if (outcome === "correct") {
      return { label: "RESOLVED", glyph: "✓", color: semantic.success };
    }
    if (outcome === "wrong") {
      return { label: "WRONG", glyph: "✕", color: semantic.danger };
    }
    return { label: "PENDING", glyph: "◐", color: palette.amber };
  };

  // Hero calibration stat — accent color reflects performance band:
  // ≥70% accent gold (well-calibrated), 40-69% amber, <40% rust
  const calibrationColor =
    calibration.calibration >= 70
      ? semantic.success
      : calibration.calibration >= 40
        ? palette.amber
        : semantic.danger;
  const heroOpacity = fadeIn(frame, startFrame + sec(0.4) + items.length * sec(0.2), sec(0.5));
  const heroNumProgress = interpolate(
    frame,
    [startFrame + sec(0.4) + items.length * sec(0.2),
     startFrame + sec(0.9) + items.length * sec(0.2)],
    [0, 1],
    CLAMP_CUBIC
  );
  const displayCalibration = Math.round(calibration.calibration * heroNumProgress);

  // Column layout — explicit widths instead of table's auto-sizing.
  // Prediction takes flex remainder; numeric columns are fixed and right-aligned.
  const COL_YOUR_EST = 140;
  const COL_MARKET = 140;
  const COL_OUTCOME = 220;
  const ROW_PADDING_Y = layout.spacing.md;
  const ACCENT_EDGE = 4;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      {/* ── Header row ─────────────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          padding: `${layout.spacing.sm}px ${layout.spacing.md}px`,
          paddingLeft: ACCENT_EDGE + layout.spacing.md,
          borderBottom: `1px solid ${theme.text.muted}40`,
          fontFamily: fonts.mono,
          fontSize: fontSizes.meta,
          letterSpacing: letterSpacing.meta,
          textTransform: "uppercase",
          color: theme.text.muted,
        }}
      >
        <div style={{ flex: 1 }}>Prediction</div>
        <div style={{ width: COL_YOUR_EST, textAlign: "right" }}>Your est.</div>
        <div style={{ width: COL_MARKET, textAlign: "right" }}>Market</div>
        <div style={{ width: COL_OUTCOME, textAlign: "right" }}>Outcome</div>
      </div>

      {/* ── Prediction rows ───────────────────────────────────────────── */}
      {items.map((item, i) => {
        const rowStartFrame = startFrame + stagger(i, sec(0.25), 0);
        const rowOpacity = fadeIn(frame, rowStartFrame, sec(0.4));
        const rowSlide = slideIn(frame, rowStartFrame, layout.spacing.sm, sec(0.4));
        const meta = outcomeMeta(item.outcome);
        const glyphSettle = pulse(frame, rowStartFrame + sec(0.3), 8, 1.06);
        const isPending = item.outcome === "pending";
        const pendingPulse = isPending ? 0.7 + 0.3 * Math.sin(frame * 0.08) : 1;

        return (
          <div
            key={i}
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              padding: `${ROW_PADDING_Y}px ${layout.spacing.md}px`,
              paddingLeft: ACCENT_EDGE + layout.spacing.md,
              borderBottom: `1px solid ${theme.text.muted}25`,
              opacity: rowOpacity,
              transform: `translateY(${rowSlide}px)`,
            }}
          >
            {/* Accent edge in outcome color */}
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: ACCENT_EDGE,
                background: meta.color,
                opacity: 0.85,
              }}
            />

            {/* Prediction text */}
            <div
              style={{
                flex: 1,
                fontFamily: fonts.body,
                fontSize: fontSizes.body,
                maxWidth: textMaxWidth.body,
                color: theme.text.primary,
                lineHeight: 1.35,
                paddingRight: layout.spacing.lg,
              }}
            >
              {item.prediction}
            </div>

            {/* Your estimate */}
            <div
              style={{
                width: COL_YOUR_EST,
                maxWidth: textMaxWidth.label,
                textAlign: "right",
                fontFamily: fonts.data,
                fontSize: fontSizes.h3,
                fontWeight: fontWeights.semibold,
                color: theme.text.primary,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {item.yourEstimate}<span style={{ fontSize: fontSizes.body, maxWidth: textMaxWidth.label, color: theme.text.muted, marginLeft: 2 }}>%</span>
            </div>

            {/* Market price (or em-dash for missing) */}
            <div
              style={{
                width: COL_MARKET,
                maxWidth: textMaxWidth.label,
                textAlign: "right",
                fontFamily: fonts.data,
                fontSize: fontSizes.h3,
                fontWeight: fontWeights.regular,
                color: theme.text.secondary,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {item.marketPrice !== undefined ? (
                <>
                  {item.marketPrice}
                  <span style={{ fontSize: fontSizes.body, maxWidth: textMaxWidth.label, color: theme.text.muted, marginLeft: 2 }}>%</span>
                </>
              ) : (
                <span style={{ color: theme.text.muted, fontSize: fontSizes.body, maxWidth: textMaxWidth.label }}>—</span>
              )}
            </div>

            {/* Outcome (text label + glyph) */}
            <div
              style={{
                width: COL_OUTCOME,
                textAlign: "right",
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: layout.spacing.sm,
                fontFamily: fonts.mono,
                fontSize: fontSizes.label,
                letterSpacing: letterSpacing.meta,
                textTransform: "uppercase",
                fontWeight: fontWeights.semibold,
                color: meta.color,
                opacity: pendingPulse,
              }}
            >
              <span style={{ maxWidth: textMaxWidth.label }}>{meta.label}</span>
              <span
                style={{
                  fontSize: fontSizes.h3,
                  lineHeight: 1,
                  display: "inline-block",
                  transform: `scale(${glyphSettle})`,
                  textShadow: `0 0 10px ${meta.color}60`,
                }}
              >
                {meta.glyph}
              </span>
            </div>
          </div>
        );
      })}

      {/* ── Hero calibration banner ───────────────────────────────────── */}
      <div
        style={{
          marginTop: layout.spacing.xl,
          paddingTop: layout.spacing.lg,
          paddingLeft: ACCENT_EDGE + layout.spacing.md,
          paddingRight: layout.spacing.md,
          borderTop: `1px solid ${theme.text.muted}40`,
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          opacity: heroOpacity,
        }}
      >
        <div
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            letterSpacing: letterSpacing.meta,
            textTransform: "uppercase",
            color: theme.text.muted,
            maxWidth: textMaxWidth.label,
          }}
        >
          {calibration.correct} of {calibration.total} resolved correctly
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: layout.spacing.sm,
          }}
        >
          <div
            style={{
              fontFamily: fonts.data,
              fontSize: fontSizes.display,
              fontWeight: fontWeights.bold,
              color: calibrationColor,
              lineHeight: 1,
              textShadow: `0 0 16px ${calibrationColor}40`,
              maxWidth: textMaxWidth.h1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {displayCalibration}
            <span style={{ fontSize: fontSizes.h2, marginLeft: 2 }}>%</span>
          </div>
          <div
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.label,
              letterSpacing: letterSpacing.meta,
              textTransform: "uppercase",
              color: theme.text.primary,
              fontWeight: fontWeights.semibold,
              maxWidth: textMaxWidth.label,
            }}
          >
            calibration
          </div>
        </div>
      </div>
    </div>
  );
});

// ── Forecast Card Component (6-layer format from CALIBRATION_LANGUAGE.md) ────

const FORECAST_LABELS: Record<string, string> = {
  baseRate: "BASE RATE",
  keyDriver: "KEY DRIVER",
  keyDisconfirmer: "DISCONFIRMER",
  benchmark: "BENCHMARK",
  resolution: "RESOLUTION",
};

const ForecastCard: React.FC<{
  forecast: ForecastData;
  frame: number;
  mode: "light" | "dark";
}> = React.memo(({ forecast, frame, mode }) => {
  const theme = useThemeMode(mode);

  // Count-up for probability number
  const numStart = sec(0.2);
  const numEnd = sec(1.4);
  const displayValue = Math.round(
    interpolate(frame, [numStart, numEnd], [0, forecast.probability], CLAMP_CUBIC)
  );
  const settleFrame = numEnd;
  const settleScale = pulse(frame, settleFrame, 9, 1.025);

  // Layer-by-layer reveal: each meta row staggers in after the number settles
  const rows: Array<{ key: keyof typeof FORECAST_LABELS; value: string }> = [
    { key: "baseRate", value: forecast.baseRate },
    { key: "keyDriver", value: forecast.keyDriver },
    { key: "keyDisconfirmer", value: forecast.keyDisconfirmer },
    { key: "benchmark", value: forecast.benchmark },
    { key: "resolution", value: forecast.resolution },
  ];

  const rowBaseFrame = sec(1.6);
  const rowStagger = sec(0.22);

  const dividerColor = `${theme.text.muted}30`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 0,
        width: "100%",
        maxWidth: 860,
        ...cardPresets.shadowFloat(mode === "dark"),
        padding: `${layout.spacing.xl}px ${layout.spacing.xxl ?? layout.spacing.xl * 1.5}px`,
        opacity: fadeIn(frame, sec(0.1), sec(0.25)),
      }}
    >
      {/* ── Probability hero ── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingBottom: layout.spacing.lg,
          borderBottom: `1px solid ${dividerColor}`,
          marginBottom: layout.spacing.lg,
        }}
      >
        <div
          style={{
            fontFamily: fonts.data,
            fontSize: fontSizes.display,
            fontWeight: fontWeights.bold,
            color: theme.text.primary,
            lineHeight: 1,
            maxWidth: textMaxWidth.h1,
            textShadow: `0 0 24px ${palette.amber}40, 0 0 48px ${palette.amber}18`, // shadows.accentGlow large (24px + 48px double halo)
            transform: `scale(${settleScale})`,
            transformOrigin: "center",
          }}
        >
          {displayValue}
          <span style={{ fontSize: fontSizes.h2, color: palette.amber, maxWidth: textMaxWidth.h2 }}>%</span>
        </div>
        <div
          style={{
            fontSize: fontSizes.label,
            color: palette.amber,
            fontFamily: fonts.mono,
            letterSpacing: letterSpacing.meta,
            textTransform: "uppercase",
            marginTop: layout.spacing.xs,
            opacity: fadeIn(frame, numEnd, sec(0.3)),
          }}
        >
          {forecast.verbalTag}
        </div>
      </div>

      {/* ── 5 metadata rows ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {rows.map(({ key, value }, i) => {
          const isResolution = key === "resolution";
          const isDisconfirmer = key === "keyDisconfirmer";
          const rowOpacity = fadeIn(frame, rowBaseFrame + i * rowStagger, sec(0.28));
          const rowSlide = slideIn(frame, rowBaseFrame + i * rowStagger, 8, sec(0.28));
          return (
            <div
              key={key}
              style={{
                display: "flex",
                gap: layout.spacing.md,
                borderTop: isResolution
                  ? `1px solid ${theme.text.muted}55`
                  : i > 0
                  ? `1px solid ${dividerColor}`
                  : undefined,
                paddingTop: isResolution ? layout.spacing.md : layout.spacing.sm,
                paddingBottom: layout.spacing.sm,
                marginTop: isResolution ? layout.spacing.xs : 0,
                opacity: rowOpacity,
                transform: `translateY(${rowSlide}px)`,
              }}
            >
              <div
                style={{
                  fontFamily: fonts.mono,
                  fontSize: fontSizes.meta,
                  letterSpacing: letterSpacing.meta,
                  textTransform: "uppercase",
                  color: isDisconfirmer ? semantic.danger : isResolution ? palette.amber : theme.text.muted,
                  minWidth: 132,
                  paddingTop: 2,
                  flexShrink: 0,
                }}
              >
                {FORECAST_LABELS[key]}
              </div>
              <div
                style={{
                  fontSize: fontSizes.body,
                  maxWidth: textMaxWidth.body,
                  color: theme.text.primary,
                  fontFamily: isResolution ? fonts.mono : fonts.body,
                  lineHeight: 1.4,
                  fontStyle: isResolution ? undefined : undefined,
                }}
              >
                {value}
              </div>
            </div>
          );
        })}
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
  // Audio-reactive overshoot kick for gauge arc fills. Passed down to each
  // GaugeArc instance — they all share the same beat signal.
  const beat = useBeatSync({
    markers: (direction.syncPoints ?? []).map((p) => p.timeSec),
    pulseDecay: 0.3,
  });
  // Pace-aware stagger scale for the per-gauge entrance.
  const s = direction.paceStaggerScale;
  // Per-episode color emphasis — gauge fallback color now follows the
  // episode's primary accent instead of the channel default.
  const emphasis = useEpisodeColorEmphasis();
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
                  color={gauge.color || emphasis.primaryAccent}
                  frame={frame}
                  startFrame={stagger(i, sec(0.4 * s), sec(0.3))}
                  arcRadius={100}
                  mode={bgVariant as "light" | "dark"}
                  beatPulse={beat.pulse}
                />
              ))}
            </div>
          )}

          {/* STRIP VARIANT — multi-source comparison on a shared 0-100% axis */}
          {data.variant === "strip" && data.gauges && (
            <ProbabilityStrip
              items={data.gauges}
              frame={frame}
              startFrame={sec(0.3 * s)}
              width={Math.min(1280, area.width - layout.spacing.xxxl * 2)}
              defaultColor={emphasis.primaryAccent}
              mode={bgVariant as "light" | "dark"}
            />
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
                width: "100%",
                maxWidth: 1400,
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

          {/* FORECAST VARIANT — 6-layer superforecasting card */}
          {data.variant === "forecast" && data.forecast && (
            <ForecastCard
              forecast={data.forecast}
              frame={frame}
              mode={bgVariant as "light" | "dark"}
            />
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
