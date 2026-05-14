/**
 * DumbbellPlot — for each category, show two dots (low + high) connected by
 * a thick line. Encodes a min-max range or before-after pair across categories.
 *
 * Cleveland-canonical form for "ranges across categories." Sister of
 * RankChangeDotPlot but for ranges/intervals rather than rank changes.
 *
 * Animation sequence per row (top-to-bottom stagger):
 *   1. Category label fades in
 *   2. Low dot scales 0 → 1
 *   3. Connecting line draws low → high via strokeDashoffset
 *   4. High dot scales 0 → 1
 *   5. Value annotations fade in
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
} from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  layout,
  sec,
  shadows,
  timing,
} from "../../design/theme";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { Background } from "../../components/Background";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import {
  fadeIn,
  stagger,
  CLAMP_SINE,
  CLAMP_CUBIC,
} from "../../utils/animation";
import { warnIf } from "../../utils/dataWarnings";
import type {
  DumbbellItem,
  DumbbellPlotData,
  DumbbellValueFormat,
} from "./types";

// ── Value formatting ────────────────────────────────────────────────────────

/**
 * Compact currency formatter — renders large values with K/M/B suffixes so
 * "$142000" reads as "$142K", "$1,250,000" as "$1.25M". Chosen for video
 * legibility: full numbers crowd the line and force tick collisions.
 */
function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    const v = abs / 1_000_000_000;
    return `${sign}$${v >= 10 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, "")}B`;
  }
  if (abs >= 1_000_000) {
    const v = abs / 1_000_000;
    return `${sign}$${v >= 10 ? v.toFixed(0) : v.toFixed(2).replace(/\.?0+$/, "")}M`;
  }
  if (abs >= 1_000) {
    const v = abs / 1_000;
    return `${sign}$${v >= 10 ? v.toFixed(0) : v.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `${sign}$${abs.toFixed(0)}`;
}

function formatPercent(value: number): string {
  if (Math.abs(value) >= 10) return `${value.toFixed(0)}%`;
  return `${value.toFixed(1).replace(/\.0$/, "")}%`;
}

function formatNumber(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000) return value.toLocaleString("en-US", { maximumFractionDigits: 0 });
  if (abs >= 10) return value.toFixed(0);
  if (abs >= 1) return value.toFixed(1).replace(/\.0$/, "");
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function formatValue(value: number, format: DumbbellValueFormat): string {
  switch (format) {
    case "currency":
      return formatCurrency(value);
    case "percent":
      return formatPercent(value);
    case "number":
    default:
      return formatNumber(value);
  }
}

// ── Tick generation ────────────────────────────────────────────────────────
// "Nice numbers" — round axis bounds and tick step to human-friendly values
// so the axis doesn't read like a sensor dump (0.0317 … 0.9874).

function niceStep(rawStep: number): number {
  if (rawStep <= 0) return 1;
  const exp = Math.floor(Math.log10(rawStep));
  const base = Math.pow(10, exp);
  const fraction = rawStep / base;
  let niceFraction: number;
  if (fraction < 1.5) niceFraction = 1;
  else if (fraction < 3) niceFraction = 2;
  else if (fraction < 7) niceFraction = 5;
  else niceFraction = 10;
  return niceFraction * base;
}

function generateTicks(min: number, max: number, targetCount = 5): number[] {
  if (min === max) return [min];
  const rawStep = (max - min) / targetCount;
  const step = niceStep(rawStep);
  const niceMin = Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let t = niceMin; t <= niceMax + step * 0.0001; t += step) {
    // Guard against floating-point drift creeping past niceMax
    ticks.push(Number(t.toFixed(10)));
  }
  return ticks;
}

// ── Main component ────────────────────────────────────────────────────────

export const DumbbellPlot: React.FC<{ data: DumbbellPlotData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const theme = useThemeMode(data.backgroundVariant ?? "light");
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);

  // ── Validation guards ─────────────────────────────────────────────────
  warnIf(
    data.items.length > 14,
    "DumbbellPlot",
    "more than 14 items will compress row height; consider top-N filtering"
  );
  warnIf(
    data.items.length < 3,
    "DumbbellPlot",
    "fewer than 3 items looks sparse; use StatReveal for a single range"
  );
  warnIf(
    data.items.some((it) => it.high < it.low),
    "DumbbellPlot",
    "one or more items have high < low — line will draw right-to-left and labels may collide"
  );

  // ── Resolved options ──────────────────────────────────────────────────
  const sortBy = data.sortBy ?? "range";
  const valueFormat: DumbbellValueFormat = data.valueFormat ?? "number";
  const lowLegendLabel = data.lowLegendLabel ?? "Low";
  const highLegendLabel = data.highLegendLabel ?? "High";
  const midLegendLabel = data.midLegendLabel ?? "Median";
  const anyMid = data.items.some((it) => typeof it.mid === "number");
  const variant = data.backgroundVariant ?? "light";
  const isDark = variant === "dark";

  // ── Sort items ────────────────────────────────────────────────────────
  const sorted = useMemo<DumbbellItem[]>(() => {
    return [...data.items].sort((a, b) => {
      switch (sortBy) {
        case "label":
          return a.label.localeCompare(b.label);
        case "low":
          return a.low - b.low;
        case "high":
          return a.high - b.high;
        case "range":
        default:
          return (b.high - b.low) - (a.high - a.low);
      }
    });
  }, [data.items, sortBy]);

  // ── Layout constants ──────────────────────────────────────────────────
  const safe = layout.safeAreaTier.generous;
  const titleBlockHeight = 150;
  const chartTop = safe.top + titleBlockHeight + layout.spacing.xl;
  const axisBandHeight = 70; // tick row + axis caption
  const chartBottom = layout.height - safe.bottom - axisBandHeight - 40;
  const chartHeight = chartBottom - chartTop;

  // Label column on the left
  const labelColLeft = safe.left;
  const labelColWidth = 240;
  const labelColRight = labelColLeft + labelColWidth;

  // Chart x-range (the dot/line band)
  // Leave room on the right for the high-value annotation.
  const chartLeft = labelColRight + layout.spacing.lg;
  const chartRight = layout.width - safe.right - 80;
  const chartWidth = chartRight - chartLeft;

  // ── Domain + scale ────────────────────────────────────────────────────
  const { domainMin, domainMax, ticks } = useMemo(() => {
    const lows = sorted.map((it) => it.low);
    const highs = sorted.map((it) => it.high);
    const rawMin = Math.min(...lows, ...(data.referenceLine ? [data.referenceLine.value] : []));
    const rawMax = Math.max(...highs, ...(data.referenceLine ? [data.referenceLine.value] : []));
    const t = generateTicks(rawMin, rawMax, 5);
    return {
      domainMin: t[0] ?? rawMin,
      domainMax: t[t.length - 1] ?? rawMax,
      ticks: t,
    };
  }, [sorted, data.referenceLine]);

  const xScale = (v: number): number => {
    if (domainMax === domainMin) return chartLeft + chartWidth / 2;
    return chartLeft + ((v - domainMin) / (domainMax - domainMin)) * chartWidth;
  };

  const rowHeight = useMemo(() => {
    const computed = Math.floor(chartHeight / Math.max(sorted.length, 1));
    return Math.max(34, Math.min(70, computed));
  }, [chartHeight, sorted.length]);

  // ── Animation timings ────────────────────────────────────────────────
  const headerOpacity = interpolate(
    frame,
    [sec(0.3), sec(0.3) + sec(0.4)],
    [0, 1],
    CLAMP_SINE
  );

  const axisOpacity = interpolate(
    frame,
    [sec(0.4), sec(0.4) + sec(0.5)],
    [0, 1],
    CLAMP_SINE
  );

  const accentColor = palette.gold;
  const lowDotColor = isDark ? palette.taupe : palette.bone;
  const lowDotStroke = isDark ? palette.umber : palette.walnut;

  // FooterStrip scale label
  const scaleLabel = data.xUnit
    ? `SCALE · ${data.xUnit}`
    : `SCALE · ${data.xAxisLabel}`;

  return (
    <Background variant={variant}>
      <AbsoluteFill style={compStyle}>
        {/* Brand strips */}
        <HeaderStrip metadata={data.episode} mode={variant} />
        <FooterStrip scale={scaleLabel} mode={variant} />

        {/* Title wrapped in an absolutely-positioned div so the
            FadeIn's transform + center origin can't accidentally
            collapse the TitleBlock's positioning context — the
            regression-safe pattern documented in NetworkDiagram. */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            safeAreaTier="generous"
          />
        </div>

        {/* ── Legend (top-right) ──────────────────────────────────────── */}
        <div
          style={{
            position: "absolute",
            top: safe.top + titleBlockHeight - 18,
            right: safe.right,
            opacity: headerOpacity,
            display: "flex",
            alignItems: "center",
            gap: layout.spacing.md,
            fontSize: fontSizes.meta,
            fontFamily: fonts.metadata,
            color: theme.text.muted,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: layout.spacing.xs }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: lowDotColor,
                border: `1px solid ${lowDotStroke}`,
                display: "inline-block",
              }}
            />
            <span>{lowLegendLabel}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: layout.spacing.xs }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: "50%",
                background: accentColor,
                display: "inline-block",
              }}
            />
            <span>{highLegendLabel}</span>
          </div>
          {anyMid ? (
            <div style={{ display: "flex", alignItems: "center", gap: layout.spacing.xs }}>
              <span
                style={{
                  width: 2,
                  height: 14,
                  background: theme.text.secondary,
                  display: "inline-block",
                }}
              />
              <span>{midLegendLabel}</span>
            </div>
          ) : null}
        </div>

        {/* ── SVG layer: gridlines, lines, dots, reference line ────────── */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: layout.width,
            height: layout.height,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          {/* Vertical gridlines at each tick */}
          {ticks.map((tick) => {
            const x = xScale(tick);
            return (
              <line
                key={`grid-${tick}`}
                x1={x}
                y1={chartTop - 8}
                x2={x}
                y2={chartBottom}
                stroke={theme.text.muted}
                strokeWidth={0.5}
                opacity={axisOpacity * 0.18}
              />
            );
          })}

          {/* Optional reference line */}
          {data.referenceLine
            ? (() => {
                const refX = xScale(data.referenceLine.value);
                return (
                  <g key="refline">
                    <line
                      x1={refX}
                      y1={chartTop - 8}
                      x2={refX}
                      y2={chartBottom}
                      stroke={palette.walnut}
                      strokeWidth={1.5}
                      strokeDasharray="6 6"
                      opacity={axisOpacity * 0.7}
                    />
                    <text
                      x={refX}
                      y={chartTop - 14}
                      textAnchor="middle"
                      fill={palette.walnut}
                      fontSize={fontSizes.meta}
                      fontFamily={fonts.metadata}
                      letterSpacing={1.5}
                      opacity={axisOpacity}
                      style={{ textTransform: "uppercase" }}
                    >
                      {data.referenceLine.label}
                    </text>
                  </g>
                );
              })()
            : null}

          {/* Per-row dumbbells */}
          {sorted.map((item, i) => {
            const isHighlighted = item.highlight ?? false;
            const anyHighlighted = sorted.some((it) => it.highlight);
            const isMuted = anyHighlighted && !isHighlighted;
            const color = item.color ?? accentColor;
            const rowY = chartTop + (i + 0.5) * rowHeight;

            const lowX = xScale(item.low);
            const highX = xScale(item.high);

            // Animation timings
            const itemStart = stagger(i, sec(0.12), sec(0.6));
            const lowDotStart = itemStart + sec(0.1);
            const lineStart = itemStart + sec(0.3);
            const highDotStart = itemStart + sec(0.55);
            const valueStart = itemStart + sec(0.7);

            const lowDotScale = interpolate(
              frame,
              [lowDotStart, lowDotStart + timing.entrance.crisp],
              [0, 1],
              CLAMP_CUBIC
            );
            const highDotScale = interpolate(
              frame,
              [highDotStart, highDotStart + timing.entrance.crisp],
              [0, 1],
              CLAMP_CUBIC
            );

            const lineLength = Math.abs(highX - lowX);
            const lineProgress = interpolate(
              frame,
              [lineStart, lineStart + sec(0.4)],
              [0, 1],
              CLAMP_CUBIC
            );
            const dashOffset = lineLength * (1 - lineProgress);

            const lowDotRadius = isHighlighted ? 7 : 6;
            const highDotRadius = isHighlighted ? 12 : 10;
            const lineStrokeWidth = isHighlighted ? 6 : 4.5;

            const rowOpacity = isMuted ? 0.55 : 1;
            const lineFadeIn = fadeIn(frame, lineStart, sec(0.25));
            const valueFade = fadeIn(frame, valueStart, sec(0.3));

            const lowText = item.lowLabel ?? formatValue(item.low, valueFormat);
            const highText = item.highLabel ?? formatValue(item.high, valueFormat);

            // Annotation gutters: leave space between the dot edge and the text.
            const annotationGutter = 12;

            return (
              <g key={`row-${i}`} opacity={rowOpacity}>
                {/* Connecting line */}
                <line
                  x1={lowX}
                  y1={rowY}
                  x2={highX}
                  y2={rowY}
                  stroke={color}
                  strokeWidth={lineStrokeWidth}
                  strokeDasharray={lineLength || 1}
                  strokeDashoffset={dashOffset}
                  opacity={lineFadeIn * 0.85}
                  strokeLinecap="round"
                />

                {/* Midpoint tick — reveals as the connector line draws past it.
                    Visual treatment: 2px wide vertical bar, ~2× line stroke
                    tall, in theme.text.secondary (mode-aware muted). Purely
                    a distribution-skew tell; no per-row label to avoid
                    crowding the row. */}
                {typeof item.mid === "number"
                  ? (() => {
                      const midX = xScale(item.mid);
                      // Reveal once the drawing line has passed midX.
                      const lineMin = Math.min(lowX, highX);
                      const lineSpan = Math.abs(highX - lowX) || 1;
                      const midFrac = (midX - lineMin) / lineSpan;
                      const tickReveal = interpolate(
                        lineProgress,
                        [midFrac, Math.min(1, midFrac + 0.08)],
                        [0, 1],
                        CLAMP_CUBIC
                      );
                      const tickHeight = lineStrokeWidth * 2;
                      return (
                        <line
                          x1={midX}
                          y1={rowY - tickHeight}
                          x2={midX}
                          y2={rowY + tickHeight}
                          stroke={theme.text.secondary}
                          strokeWidth={2}
                          strokeLinecap="butt"
                          opacity={tickReveal * (isHighlighted ? 0.95 : 0.8)}
                        />
                      );
                    })()
                  : null}

                {/* Low dot — smaller, muted, with stroke for definition */}
                <circle
                  cx={lowX}
                  cy={rowY}
                  r={lowDotRadius * lowDotScale}
                  fill={lowDotColor}
                  stroke={lowDotStroke}
                  strokeWidth={1.5}
                  opacity={fadeIn(frame, lowDotStart, timing.entrance.crisp)}
                />

                {/* High dot — larger, accent color */}
                <circle
                  cx={highX}
                  cy={rowY}
                  r={highDotRadius * highDotScale}
                  fill={color}
                  opacity={fadeIn(frame, highDotStart, timing.entrance.crisp)}
                  filter={
                    isHighlighted ? `drop-shadow(0 0 6px ${color}66)` : undefined
                  }
                />

                {/* Low value annotation — left of the low dot */}
                <text
                  x={lowX - lowDotRadius - annotationGutter}
                  y={rowY + 4}
                  textAnchor="end"
                  fill={theme.text.muted}
                  fontSize={fontSizes.caption}
                  fontFamily={fonts.data}
                  opacity={valueFade}
                >
                  {lowText}
                </text>

                {/* High value annotation — right of the high dot */}
                <text
                  x={highX + highDotRadius + annotationGutter}
                  y={rowY + 4}
                  textAnchor="start"
                  fill={isHighlighted ? color : theme.text.secondary}
                  fontSize={
                    isHighlighted ? fontSizes.label : fontSizes.caption
                  }
                  fontFamily={fonts.data}
                  fontWeight={isHighlighted ? 600 : 400}
                  opacity={valueFade}
                >
                  {highText}
                </text>
              </g>
            );
          })}

          {/* ── X-axis baseline + tick marks ──────────────────────────── */}
          <line
            x1={chartLeft}
            y1={chartBottom + 6}
            x2={chartRight}
            y2={chartBottom + 6}
            stroke={theme.text.muted}
            strokeWidth={0.75}
            opacity={axisOpacity * 0.6}
          />
          {ticks.map((tick) => {
            const x = xScale(tick);
            return (
              <g key={`tick-${tick}`} opacity={axisOpacity}>
                <line
                  x1={x}
                  y1={chartBottom + 6}
                  x2={x}
                  y2={chartBottom + 12}
                  stroke={theme.text.muted}
                  strokeWidth={0.75}
                  opacity={0.6}
                />
                <text
                  x={x}
                  y={chartBottom + 28}
                  textAnchor="middle"
                  fill={theme.text.muted}
                  fontSize={fontSizes.meta}
                  fontFamily={fonts.data}
                  letterSpacing={1}
                >
                  {formatValue(tick, valueFormat)}
                </text>
              </g>
            );
          })}

          {/* X-axis caption */}
          <text
            x={chartLeft + chartWidth / 2}
            y={chartBottom + 52}
            textAnchor="middle"
            fill={theme.text.secondary}
            fontSize={fontSizes.label}
            fontFamily={fonts.metadata}
            letterSpacing={1.5}
            opacity={axisOpacity}
            style={{ textTransform: "uppercase" }}
          >
            {data.xAxisLabel}
          </text>
        </svg>

        {/* ── Row labels (HTML for text features) ──────────────────────── */}
        {sorted.map((item, i) => {
          const isHighlighted = item.highlight ?? false;
          const anyHighlighted = sorted.some((it) => it.highlight);
          const isMuted = anyHighlighted && !isHighlighted;
          const rowY = chartTop + (i + 0.5) * rowHeight;
          const itemStart = stagger(i, sec(0.12), sec(0.6));
          const labelOpacity = fadeIn(frame, itemStart, sec(0.3));

          return (
            <div
              key={`label-${i}`}
              style={{
                position: "absolute",
                top: rowY - fontSizes.body / 2,
                left: labelColLeft,
                width: labelColWidth,
                textAlign: "right",
                paddingRight: layout.spacing.md,
                fontSize: isHighlighted ? fontSizes.body : fontSizes.caption,
                fontFamily: fonts.body,
                fontWeight: isHighlighted ? 700 : 400,
                color: isMuted ? `${palette.ink}80` : theme.text.primary,
                opacity: labelOpacity * (isMuted ? 0.7 : 1),
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: 1,
                textShadow: isDark ? shadows.textLift : shadows.textLiftLight,
                pointerEvents: "none",
              }}
            >
              {item.label}
            </div>
          );
        })}

        {/* ── Source attribution ───────────────────────────────────────── */}
        <SourceAttribution
          source={data.source}
          mode={variant}
          prefix="Source: "
          startSec={2}
        />
      </AbsoluteFill>
    </Background>
  );
};
