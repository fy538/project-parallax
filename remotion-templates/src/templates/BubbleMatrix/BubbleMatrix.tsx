/**
 * BubbleMatrix — multi-dimensional scatter chart.
 *
 * Encodes four simultaneous variables: X-position, Y-position, bubble size
 * (proportional AREA encoding, Gapminder standard), and color (group membership).
 * The canonical form for "compare N entities across two quantitative axes
 * with size and bloc context" — silicon trap country comparisons, climate
 * pledge matrices, human development overviews.
 *
 * Distinct from:
 *   ConnectedScatterplot — single entity's trajectory over time (two axes + path)
 *   StrategicLandscape   — qualitative 2×2 quadrant placement (editorial positioning)
 *   BubbleMatrix         — snapshot comparison across N entities, 4 simultaneous variables
 *
 * Animation sequence:
 *   1. Title / subtitle (frames 0–20)
 *   2. Axis frame lines draw in (15–30)
 *   3. Grid lines fade in (25–40)
 *   4. Tick labels fade in (30–45)
 *   5. Reference lines draw in (40–55)
 *   6. Bubbles appear — simultaneous | by-group | by-x-position (50–70)
 *   7. Bubble labels fade in (+10 frames after bubble)
 *   8. Group legend fades in (60–75)
 *   9. Size legend fades in (65–80)
 *  10. Source attribution (last 3s)
 *
 * Layout:
 *   chartLayout() handles title + source regions; extraPad carves axis label gutters.
 *   plotLeft/Right/Top/Bottom are the actual drawing bounds inside chart region.
 *   Y-axis: higher value = higher on screen (inverted SVG y).
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
  letterSpacing,
  layout,
  sec,
  timing,
} from "../../design/theme";
import {
  fadeIn,
  stagger,
  exitFade,
  CLAMP_CUBIC,
  CLAMP_QUAD,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { chartLayout } from "../../utils/chartLayout";
import { warnIf, checkChartDataCommon } from "../../utils/dataWarnings";
import type { BubbleMatrixData, BubbleEntity, BubbleGroup } from "./types";

// ── Format helpers ────────────────────────────────────────────────────────

/**
 * Format an axis tick value using a printf-style format string, or fall back
 * to a compact representation.
 *
 * Supported format patterns:
 *   "%.0f%%" → "42%"
 *   "$%.1fT"  → "$1.2T"
 *   "%.0fB"   → "500B"
 *   (no format) → compact number (e.g. 1500000 → "1.5M")
 */
function formatTick(value: number, format: string | undefined): string {
  if (!format) {
    const abs = Math.abs(value);
    if (abs >= 1e12) return `${(value / 1e12).toPrecision(3).replace(/\.?0+$/, "")}T`;
    if (abs >= 1e9) return `${(value / 1e9).toPrecision(3).replace(/\.?0+$/, "")}B`;
    if (abs >= 1e6) return `${(value / 1e6).toPrecision(3).replace(/\.?0+$/, "")}M`;
    if (abs >= 1e3) return `${(value / 1e3).toPrecision(3).replace(/\.?0+$/, "")}K`;
    const decimals = abs >= 100 ? 0 : abs >= 10 ? 1 : abs > 0 ? 1 : 0;
    return value.toFixed(decimals);
  }
  // Parse printf-style patterns: optional prefix, %<.N>f, optional suffix
  const match = format.match(/^([^%]*)%\.(\d+)f(.*)$/);
  if (!match) return String(value);
  const [, prefix, decimals, suffix] = match;
  return `${prefix}${value.toFixed(Number(decimals))}${suffix}`;
}

/**
 * Generate N evenly spaced tick values between min and max.
 * When logScale is true, ticks are spaced in log10 space.
 */
function generateTicks(
  min: number,
  max: number,
  count: number,
  logScale: boolean,
): number[] {
  const n = Math.max(2, count);
  if (logScale) {
    const logMin = Math.log10(Math.max(1e-9, min));
    const logMax = Math.log10(Math.max(1e-9, max));
    return Array.from({ length: n }, (_, i) =>
      Math.pow(10, logMin + (i / (n - 1)) * (logMax - logMin)),
    );
  }
  return Array.from({ length: n }, (_, i) => min + (i / (n - 1)) * (max - min));
}

// ── Color resolution ──────────────────────────────────────────────────────

/**
 * Resolve the display color for a bubble entity.
 * Priority: entity.color → group color → fallback.
 */
function resolveEntityColor(
  entity: BubbleEntity,
  groupMap: Map<string, BubbleGroup>,
): string {
  if (entity.color) return entity.color;
  if (entity.group) {
    const group = groupMap.get(entity.group);
    if (group) return group.color;
  }
  return palette.taupe;
}

// ── Sub-components (React.memo for per-frame perf) ────────────────────────

interface GridLineProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
  strokeColor: string;
}

const GridLine = React.memo(function GridLine({
  x1, y1, x2, y2, opacity, strokeColor,
}: GridLineProps) {
  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={strokeColor}
      strokeWidth={0.75}
      strokeDasharray="3 4"
      opacity={opacity}
    />
  );
});

interface AxisTickProps {
  // "x" tick: vertical line below axis + label below
  // "y" tick: horizontal line left of axis + label to the left
  axis: "x" | "y";
  tickPx: number;       // x coord for y-tick, y coord for x-tick
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
  label: string;
  opacity: number;
  textColor: string;
}

const AxisTick = React.memo(function AxisTick({
  axis, tickPx, plotLeft, plotRight, plotTop, plotBottom, label, opacity, textColor,
}: AxisTickProps) {
  if (axis === "y") {
    return (
      <g opacity={opacity}>
        <line
          x1={plotLeft - 5} y1={tickPx}
          x2={plotLeft}     y2={tickPx}
          stroke={textColor}
          strokeWidth={1}
          opacity={0.6}
        />
        <text
          x={plotLeft - 10}
          y={tickPx}
          textAnchor="end"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={fontSizes.caption}
          fontFamily={fonts.mono}
          letterSpacing={letterSpacing.caption}
        >
          {label}
        </text>
      </g>
    );
  }
  // x tick
  return (
    <g opacity={opacity}>
      <line
        x1={tickPx} y1={plotBottom}
        x2={tickPx} y2={plotBottom + 5}
        stroke={textColor}
        strokeWidth={1}
        opacity={0.6}
      />
      <text
        x={tickPx}
        y={plotBottom + 18}
        textAnchor="middle"
        fill={textColor}
        fontSize={fontSizes.caption}
        fontFamily={fonts.mono}
        letterSpacing={letterSpacing.caption}
      >
        {label}
      </text>
    </g>
  );
});

interface BubbleCircleProps {
  cx: number;
  cy: number;
  r: number;
  fillColor: string;
  emphasis: BubbleEntity["emphasis"];
  opacity: number;
  bgColor: string;
}

const BubbleCircle = React.memo(function BubbleCircle({
  cx, cy, r, fillColor, emphasis, opacity, bgColor,
}: BubbleCircleProps) {
  const isPrimary = emphasis === "primary";
  const isMuted = emphasis === "muted";
  const fillOpacity = isMuted ? 0.35 : isPrimary ? 0.92 : 0.72;
  const strokeOpacity = isMuted ? 0.35 : isPrimary ? 1 : 0.6;
  const strokeWidth = isPrimary ? 2.5 : 1.5;

  return (
    <g opacity={opacity}>
      {/* White/bg underlay so bubbles read clearly over grid */}
      <circle
        cx={cx} cy={cy} r={r + 1}
        fill={bgColor}
        opacity={0.6}
      />
      <circle
        cx={cx} cy={cy} r={r}
        fill={fillColor}
        fillOpacity={fillOpacity}
        stroke={fillColor}
        strokeWidth={strokeWidth}
        strokeOpacity={strokeOpacity}
      />
      {/* Primary emphasis gets a subtle outer ring */}
      {isPrimary && (
        <circle
          cx={cx} cy={cy} r={r + 5}
          fill="none"
          stroke={fillColor}
          strokeWidth={1}
          opacity={0.25}
        />
      )}
    </g>
  );
});

interface BubbleLabelProps {
  cx: number;
  cy: number;
  r: number;
  label: string;
  sublabel: string | undefined;
  annotation: string | undefined;
  resolvedPosition: "inside" | "above" | "below" | "right" | "left";
  textColor: string;
  accentColor: string;
  opacity: number;
}

const BubbleLabel = React.memo(function BubbleLabel({
  cx, cy, r, label, sublabel, annotation, resolvedPosition,
  textColor, accentColor, opacity,
}: BubbleLabelProps) {
  let tx = cx;
  let ty = cy;
  let anchor: "start" | "middle" | "end" = "middle";
  let baseline: "middle" | "auto" | "hanging" = "middle";
  let leaderX1 = cx;
  let leaderY1 = cy;
  let leaderX2 = cx;
  let leaderY2 = cy;
  let showLeader = false;

  const OFFSET = r + 10;

  switch (resolvedPosition) {
    case "inside":
      // Label inside the bubble — only legible for large bubbles
      ty = cy;
      baseline = "middle";
      break;
    case "above":
      ty = cy - OFFSET;
      baseline = "auto";
      leaderX1 = cx; leaderY1 = cy - r - 2;
      leaderX2 = cx; leaderY2 = ty + 4;
      showLeader = r > 15; // only draw leader for larger bubbles
      break;
    case "below":
      ty = cy + OFFSET;
      baseline = "hanging";
      leaderX1 = cx; leaderY1 = cy + r + 2;
      leaderX2 = cx; leaderY2 = ty - 4;
      showLeader = r > 15;
      break;
    case "right":
      tx = cx + OFFSET;
      anchor = "start";
      leaderX1 = cx + r + 2; leaderY1 = cy;
      leaderX2 = tx - 4; leaderY2 = cy;
      showLeader = r > 15;
      break;
    case "left":
      tx = cx - OFFSET;
      anchor = "end";
      leaderX1 = cx - r - 2; leaderY1 = cy;
      leaderX2 = tx + 4; leaderY2 = cy;
      showLeader = r > 15;
      break;
  }

  const lineH = fontSizes.caption + 3;

  return (
    <g opacity={opacity}>
      {showLeader && (
        <line
          x1={leaderX1} y1={leaderY1}
          x2={leaderX2} y2={leaderY2}
          stroke={textColor}
          strokeWidth={0.75}
          opacity={0.4}
        />
      )}
      <text
        x={tx}
        y={ty}
        textAnchor={anchor}
        dominantBaseline={baseline}
        fill={textColor}
        fontSize={fontSizes.caption}
        fontFamily={fonts.mono}
        fontWeight={600}
        letterSpacing={letterSpacing.caption}
      >
        {label}
      </text>
      {sublabel && (
        <text
          x={tx}
          y={ty + lineH}
          textAnchor={anchor}
          dominantBaseline={baseline}
          fill={textColor}
          fontSize={fontSizes.meta}
          fontFamily={fonts.mono}
          fontWeight={400}
          letterSpacing={letterSpacing.meta}
          opacity={0.7}
        >
          {sublabel}
        </text>
      )}
      {annotation && (
        <text
          x={tx}
          y={ty - lineH}
          textAnchor={anchor}
          dominantBaseline="auto"
          fill={accentColor}
          fontSize={fontSizes.meta}
          fontFamily={fonts.mono}
          fontWeight={500}
          letterSpacing={letterSpacing.meta}
          style={{ textTransform: "uppercase" }}
        >
          {annotation}
        </text>
      )}
    </g>
  );
});

// ── Main component ─────────────────────────────────────────────────────────

export const BubbleMatrix: React.FC<{ data: BubbleMatrixData }> = ({ data }) => {
  // ── Semantic warnings ────────────────────────────────────────────────
  checkChartDataCommon("BubbleMatrix", data);
  warnIf(
    data.entities.length > 40,
    "BubbleMatrix",
    `${data.entities.length} entities — BubbleMatrix reads cleanest at ≤20. Above 40, bubbles crowd and overlap; consider filtering to the most editorially salient subset.`,
  );
  const entityIds = data.entities.map((e) => e.id);
  warnIf(
    new Set(entityIds).size < entityIds.length,
    "BubbleMatrix",
    "Duplicate entity ids detected — each entity must have a unique id for reliable keying.",
  );
  const xMin0 = data.xAxis.min;
  const xMax0 = data.xAxis.max;
  const yMin0 = data.yAxis.min;
  const yMax0 = data.yAxis.max;
  warnIf(
    xMin0 !== undefined && xMax0 !== undefined &&
    data.entities.some((e) => e.x < xMin0 || e.x > xMax0),
    "BubbleMatrix",
    "One or more entity x-values fall outside the specified xAxis.min/max range — they will be clipped off the plot.",
  );
  warnIf(
    yMin0 !== undefined && yMax0 !== undefined &&
    data.entities.some((e) => e.y < yMin0 || e.y > yMax0),
    "BubbleMatrix",
    "One or more entity y-values fall outside the specified yAxis.min/max range — they will be clipped off the plot.",
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);

  // ── Layout ──────────────────────────────────────────────────────────
  // extraPad: left = Y tick labels (~70px); bottom = X tick labels (~30px)
  const region = useMemo(
    () =>
      chartLayout({
        hasTitle: Boolean(data.title),
        hasXAxis: true,
        hasSource: Boolean(data.source),
        safeAreaTier: "generous",
        extraPad: { left: 70, right: 40, bottom: 30 },
      }),
    [data.title, data.source],
  );

  const chart = region.chart;
  // Additional inner margins within the chart area for the actual plot
  const plotLeft = chart.left;
  const plotRight = chart.left + chart.width;
  const plotTop = chart.top + 20;
  const plotBottom = chart.top + chart.height;

  // ── Axis domain ─────────────────────────────────────────────────────
  const { xMin, xMax, yMin, yMax } = useMemo(() => {
    const xs = data.entities.map((e) => e.x);
    const ys = data.entities.map((e) => e.y);
    const dataXMin = Math.min(...xs);
    const dataXMax = Math.max(...xs);
    const dataYMin = Math.min(...ys);
    const dataYMax = Math.max(...ys);
    return {
      xMin: data.xAxis.min ?? dataXMin,
      xMax: data.xAxis.max ?? dataXMax,
      yMin: data.yAxis.min ?? dataYMin,
      yMax: data.yAxis.max ?? dataYMax,
    };
  }, [data.entities, data.xAxis.min, data.xAxis.max, data.yAxis.min, data.yAxis.max]);

  // ── Log scale helpers ────────────────────────────────────────────────
  const xLogScale = data.xAxis.logScale ?? false;
  const yLogScale = data.yAxis.logScale ?? false;

  // ── Scale functions (derived from memoized domain) ───────────────────
  // These are stable given xMin/xMax/yMin/yMax + plot bounds.
  const xScale = useMemo(
    () =>
      (val: number): number => {
        const xRange = Math.max(1e-9, xMax - xMin);
        if (xLogScale) {
          const logMin = Math.log10(Math.max(1e-9, xMin));
          const logMax = Math.log10(Math.max(1e-9, xMax));
          const logRange = Math.max(1e-9, logMax - logMin);
          return plotLeft + ((Math.log10(Math.max(1e-9, val)) - logMin) / logRange) * (plotRight - plotLeft);
        }
        return plotLeft + ((val - xMin) / xRange) * (plotRight - plotLeft);
      },
    [xMin, xMax, xLogScale, plotLeft, plotRight],
  );

  const yScale = useMemo(
    () =>
      (val: number): number => {
        const yRange = Math.max(1e-9, yMax - yMin);
        if (yLogScale) {
          const logMin = Math.log10(Math.max(1e-9, yMin));
          const logMax = Math.log10(Math.max(1e-9, yMax));
          const logRange = Math.max(1e-9, logMax - logMin);
          return plotBottom - ((Math.log10(Math.max(1e-9, val)) - logMin) / logRange) * (plotBottom - plotTop);
        }
        return plotBottom - ((val - yMin) / yRange) * (plotBottom - plotTop);
      },
    [yMin, yMax, yLogScale, plotTop, plotBottom],
  );

  // ── Tick arrays ──────────────────────────────────────────────────────
  const xTicks = useMemo(
    () => generateTicks(xMin, xMax, data.xAxis.tickCount ?? 5, xLogScale),
    [xMin, xMax, data.xAxis.tickCount, xLogScale],
  );
  const yTicks = useMemo(
    () => generateTicks(yMin, yMax, data.yAxis.tickCount ?? 5, yLogScale),
    [yMin, yMax, data.yAxis.tickCount, yLogScale],
  );

  // ── Bubble radius computation ────────────────────────────────────────
  // Proportional AREA encoding (Gapminder standard):
  // radius ∝ sqrt(size), so visual area ∝ size value.
  const minR = data.minBubbleRadius ?? 8;
  const maxR = data.maxBubbleRadius ?? 40;

  const { sizeMin, sizeMax } = useMemo(() => {
    const sizes = data.entities.map((e) => e.size);
    return {
      sizeMin: Math.min(...sizes),
      sizeMax: Math.max(...sizes),
    };
  }, [data.entities]);

  const bubbleRadius = useMemo(
    () =>
      (entity: BubbleEntity): number => {
        const sizeRange = Math.max(1e-9, sizeMax - sizeMin);
        return minR + Math.sqrt((entity.size - sizeMin) / sizeRange) * (maxR - minR);
      },
    [sizeMin, sizeMax, minR, maxR],
  );

  // ── Group color map ──────────────────────────────────────────────────
  const groupMap = useMemo(() => {
    const m = new Map<string, BubbleGroup>();
    data.groups?.forEach((g) => m.set(g.id, g));
    return m;
  }, [data.groups]);

  // ── Bubble pixel positions + colors ─────────────────────────────────
  const bubbleData = useMemo(
    () =>
      data.entities.map((entity) => ({
        entity,
        cx: xScale(entity.x),
        cy: yScale(entity.y),
        r: bubbleRadius(entity),
        color: resolveEntityColor(entity, groupMap),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data.entities, groupMap, xScale, yScale, bubbleRadius],
  );

  // ── Label position resolution ────────────────────────────────────────
  const labelPositionGlobal = data.labelPosition ?? "auto";

  const labelPositions = useMemo(
    () =>
      bubbleData.map(({ cx, cy, r }) => {
        if (labelPositionGlobal !== "auto") {
          return labelPositionGlobal as "inside" | "above" | "below" | "right" | "left";
        }
        // Auto placement heuristics:
        // 1. If bubble is in top 15% of plot → use "below"
        // 2. If bubble is near right edge (x > 85% of plot width) → use "left"
        // 3. Otherwise → "above"
        const plotWidth = plotRight - plotLeft;
        const plotHeight = plotBottom - plotTop;
        if (cy - plotTop < plotHeight * 0.15) {
          return "below" as const;
        }
        if (cx - plotLeft > plotWidth * 0.85) {
          return "left" as const;
        }
        return "above" as const;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bubbleData, labelPositionGlobal, plotLeft, plotRight, plotTop, plotBottom],
  );

  // ── Reveal order (bubble stagger) ───────────────────────────────────
  const revealOrder = data.revealOrder ?? "simultaneous";

  const bubbleRevealIndices = useMemo(() => {
    if (revealOrder === "simultaneous") {
      return data.entities.map(() => 0);
    }
    if (revealOrder === "by-x-position") {
      // Sort by x value; lowest x gets index 0
      const sorted = [...data.entities]
        .map((e, i) => ({ i, x: e.x }))
        .sort((a, b) => a.x - b.x);
      const result = new Array<number>(data.entities.length);
      sorted.forEach(({ i }, rank) => { result[i] = rank; });
      return result;
    }
    // "by-group" — entities in the same group appear together; group order
    // follows the declaration order in data.groups[]
    if (revealOrder === "by-group") {
      const groupOrder = new Map<string, number>();
      data.groups?.forEach((g, gi) => groupOrder.set(g.id, gi));
      const UNGROUPED_ORDER = (data.groups?.length ?? 0);
      return data.entities.map((e) => {
        const gi = e.group !== undefined ? (groupOrder.get(e.group) ?? UNGROUPED_ORDER) : UNGROUPED_ORDER;
        return gi;
      });
    }
    return data.entities.map(() => 0);
  }, [data.entities, data.groups, revealOrder]);

  // ── Timing ──────────────────────────────────────────────────────────
  const TITLE_START = 0;
  const AXES_START = 15;
  const GRID_START = 25;
  const TICKS_START = 30;
  const REFLINES_START = 40;
  const BUBBLES_START = 25;
  const BUBBLES_DUR = 20;   // duration for each bubble's fade/scale in
  const STAGGER_PER_GROUP = timing.stagger.loose;  // sec(0.3) = 9 frames
  const LABEL_OFFSET = 10;  // label trails bubble by N frames
  const LEGEND_START = 60;
  const SIZE_LEGEND_START = 65;

  const exitOp = exitFade(frame, durationInFrames, timing.exit.medium);

  // ── Reference line draw-in ───────────────────────────────────────────
  // Lines grow from origin to endpoint via strokeDashoffset
  const refLineProgress = interpolate(
    frame,
    [REFLINES_START, REFLINES_START + timing.entrance.slow],
    [0, 1],
    CLAMP_CUBIC,
  );

  // ── Render ──────────────────────────────────────────────────────────
  const showLegend =
    data.showLegend !== false && data.groups && data.groups.length > 0;
  const showSizeLegend = Boolean(data.sizeLabel);

  // Size legend values for reference
  const sizeLegendValues = useMemo(() => {
    if (!showSizeLegend) return [];
    const mid = (sizeMin + sizeMax) / 2;
    return [sizeMin, mid, sizeMax];
  }, [sizeMin, sizeMax, showSizeLegend]);

  const sizeLegendRadii = useMemo(
    () =>
      sizeLegendValues.map((s) => {
        const sizeRange = Math.max(1e-9, sizeMax - sizeMin);
        return minR + Math.sqrt((s - sizeMin) / sizeRange) * (maxR - minR);
      }),
    [sizeLegendValues, sizeMin, sizeMax, minR, maxR],
  );

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        <HeaderStrip mode={bgVariant} metadata={data.episode} />
        <FooterStrip mode={bgVariant} />

        {/* Title block */}
        {data.title && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <TitleBlock
              title={data.title}
              subtitle={data.subtitle}
              mode={bgVariant}
              safeAreaTier="generous"
              syncPoints={direction.syncPoints}
            />
          </div>
        )}

        <svg
          width={layout.width}
          height={layout.height}
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            overflow: "visible",
          }}
        >
          {/* ── Axis frame (left + bottom rules) ─────────────────────── */}
          <line
            x1={plotLeft} y1={plotTop}
            x2={plotLeft} y2={plotBottom}
            stroke={theme.text.muted}
            strokeWidth={1.5}
            opacity={0.5 * fadeIn(frame, AXES_START, timing.entrance.fast) * exitOp}
          />
          <line
            x1={plotLeft}  y1={plotBottom}
            x2={plotRight} y2={plotBottom}
            stroke={theme.text.muted}
            strokeWidth={1.5}
            opacity={0.5 * fadeIn(frame, AXES_START, timing.entrance.fast) * exitOp}
          />

          {/* ── Y-axis grid lines + tick marks + labels ──────────────── */}
          {yTicks.map((tick, ti) => {
            const ty = yScale(tick);
            if (ty < plotTop - 2 || ty > plotBottom + 2) return null;
            const gridOp =
              0.15 * fadeIn(frame, GRID_START + stagger(ti, 2), timing.entrance.medium) * exitOp;
            const tickOp =
              fadeIn(frame, TICKS_START + stagger(ti, 2), timing.entrance.medium) * exitOp;
            return (
              <g key={`yt-${ti}`}>
                <GridLine
                  x1={plotLeft} y1={ty} x2={plotRight} y2={ty}
                  opacity={gridOp}
                  strokeColor={theme.text.muted}
                />
                <AxisTick
                  axis="y"
                  tickPx={ty}
                  plotLeft={plotLeft} plotRight={plotRight}
                  plotTop={plotTop} plotBottom={plotBottom}
                  label={formatTick(tick, data.yAxis.format)}
                  opacity={tickOp}
                  textColor={theme.text.muted}
                />
              </g>
            );
          })}

          {/* Y-axis label (rotated 90°) */}
          <text
            x={plotLeft - 55}
            y={plotTop + (plotBottom - plotTop) / 2}
            textAnchor="middle"
            fill={theme.text.secondary}
            fontSize={fontSizes.meta}
            fontFamily={fonts.mono}
            fontWeight={500}
            letterSpacing={letterSpacing.meta}
            opacity={
              fadeIn(frame, AXES_START + timing.entrance.fast, timing.entrance.medium) * exitOp
            }
            transform={`rotate(-90 ${plotLeft - 55} ${plotTop + (plotBottom - plotTop) / 2})`}
            style={{ textTransform: "uppercase" }}
          >
            {data.yAxis.label}
          </text>

          {/* ── X-axis grid lines + tick marks + labels ──────────────── */}
          {xTicks.map((tick, ti) => {
            const tx = xScale(tick);
            if (tx < plotLeft - 2 || tx > plotRight + 2) return null;
            const gridOp =
              0.15 * fadeIn(frame, GRID_START + stagger(ti, 2), timing.entrance.medium) * exitOp;
            const tickOp =
              fadeIn(frame, TICKS_START + stagger(ti, 2), timing.entrance.medium) * exitOp;
            return (
              <g key={`xt-${ti}`}>
                <GridLine
                  x1={tx} y1={plotTop} x2={tx} y2={plotBottom}
                  opacity={gridOp}
                  strokeColor={theme.text.muted}
                />
                <AxisTick
                  axis="x"
                  tickPx={tx}
                  plotLeft={plotLeft} plotRight={plotRight}
                  plotTop={plotTop} plotBottom={plotBottom}
                  label={formatTick(tick, data.xAxis.format)}
                  opacity={tickOp}
                  textColor={theme.text.muted}
                />
              </g>
            );
          })}

          {/* X-axis label */}
          <text
            x={plotLeft + (plotRight - plotLeft) / 2}
            y={plotBottom + 50}
            textAnchor="middle"
            fill={theme.text.secondary}
            fontSize={fontSizes.meta}
            fontFamily={fonts.mono}
            fontWeight={500}
            letterSpacing={letterSpacing.meta}
            opacity={
              fadeIn(frame, AXES_START + timing.entrance.fast, timing.entrance.medium) * exitOp
            }
            style={{ textTransform: "uppercase" }}
          >
            {data.xAxis.label}
          </text>

          {/* ── Reference lines ──────────────────────────────────────── */}
          {data.referenceLines?.map((ref, ri) => {
            const lineColor = ref.color ?? palette.umber;
            const dashArr = ref.style === "solid" ? "none" : "8 5";

            if (ref.axis === "y") {
              const ty = yScale(ref.value);
              if (ty < plotTop - 2 || ty > plotBottom + 2) return null;
              // Draw from left; grow via strokeDashoffset
              const lineLen = plotRight - plotLeft;
              const refOp = fadeIn(frame, REFLINES_START + stagger(ri, 5), timing.entrance.medium) * exitOp;
              return (
                <g key={`ref-y-${ri}`} opacity={refOp}>
                  <line
                    x1={plotLeft} y1={ty} x2={plotRight} y2={ty}
                    stroke={lineColor}
                    strokeWidth={1}
                    strokeDasharray={dashArr !== "none" ? dashArr : `${lineLen} ${lineLen}`}
                    opacity={0.7}
                    strokeDashoffset={dashArr !== "none" ? 0 : lineLen * (1 - refLineProgress)}
                  />
                  {ref.label && (
                    <text
                      x={plotRight + 6}
                      y={ty}
                      dominantBaseline="middle"
                      fill={lineColor}
                      fontSize={fontSizes.meta}
                      fontFamily={fonts.mono}
                      fontWeight={500}
                      letterSpacing={letterSpacing.meta}
                      style={{ textTransform: "uppercase" }}
                    >
                      {ref.label}
                    </text>
                  )}
                </g>
              );
            }
            // x reference line
            const tx = xScale(ref.value);
            if (tx < plotLeft - 2 || tx > plotRight + 2) return null;
            const refOp = fadeIn(frame, REFLINES_START + stagger(ri, 5), timing.entrance.medium) * exitOp;
            const xLineLen = plotBottom - plotTop;
            return (
              <g key={`ref-x-${ri}`} opacity={refOp}>
                <line
                  x1={tx} y1={plotTop} x2={tx} y2={plotBottom}
                  stroke={lineColor}
                  strokeWidth={1}
                  strokeDasharray={dashArr !== "none" ? dashArr : `${xLineLen} ${xLineLen}`}
                  opacity={0.7}
                  strokeDashoffset={dashArr !== "none" ? 0 : xLineLen * (1 - refLineProgress)}
                />
                {ref.label && (
                  <text
                    x={tx}
                    y={plotTop - 6}
                    textAnchor="middle"
                    fill={lineColor}
                    fontSize={fontSizes.meta}
                    fontFamily={fonts.mono}
                    fontWeight={500}
                    letterSpacing={letterSpacing.meta}
                    style={{ textTransform: "uppercase" }}
                  >
                    {ref.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* ── Bubbles ──────────────────────────────────────────────── */}
          {bubbleData.map(({ entity, cx, cy, r, color }, i) => {
            const revealIdx = bubbleRevealIndices[i];
            const bubbleStart = BUBBLES_START + stagger(revealIdx, STAGGER_PER_GROUP);
            const bubbleOp = interpolate(
              frame,
              [bubbleStart, bubbleStart + BUBBLES_DUR],
              [0, 1],
              CLAMP_QUAD,
            ) * exitOp;
            const labelStart = bubbleStart + LABEL_OFFSET;
            const labelOp = interpolate(
              frame,
              [labelStart, labelStart + BUBBLES_DUR],
              [0, 1],
              CLAMP_CUBIC,
            ) * exitOp;

            const resolvedPos = labelPositions[i] ?? "above";

            return (
              <g key={entity.id}>
                <BubbleCircle
                  cx={cx} cy={cy} r={r}
                  fillColor={color}
                  emphasis={entity.emphasis}
                  opacity={bubbleOp}
                  bgColor={theme.bg.base}
                />
                <BubbleLabel
                  cx={cx} cy={cy} r={r}
                  label={entity.label}
                  sublabel={entity.sublabel}
                  annotation={entity.annotation}
                  resolvedPosition={resolvedPos}
                  textColor={theme.text.secondary}
                  accentColor={palette.gold}
                  opacity={labelOp}
                />
              </g>
            );
          })}

          {/* ── Group legend ─────────────────────────────────────────── */}
          {showLegend && data.groups && (
            <g opacity={fadeIn(frame, LEGEND_START, timing.entrance.medium) * exitOp}>
              {data.groups.map((group, gi) => {
                const legendX = plotRight - 160;
                const legendY = plotTop + gi * 24;
                return (
                  <g key={group.id}>
                    <circle
                      cx={legendX}
                      cy={legendY + 6}
                      r={6}
                      fill={group.color}
                      fillOpacity={0.8}
                    />
                    <text
                      x={legendX + 14}
                      y={legendY + 6}
                      dominantBaseline="middle"
                      fill={theme.text.secondary}
                      fontSize={fontSizes.caption}
                      fontFamily={fonts.mono}
                      fontWeight={500}
                      letterSpacing={letterSpacing.caption}
                    >
                      {group.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* ── Size legend ──────────────────────────────────────────── */}
          {showSizeLegend && data.sizeLabel && sizeLegendValues.length > 0 && (
            <g opacity={fadeIn(frame, SIZE_LEGEND_START, timing.entrance.medium) * exitOp}>
              {/* Legend title */}
              <text
                x={plotLeft + 8}
                y={plotBottom - 80}
                fill={theme.text.muted}
                fontSize={fontSizes.meta}
                fontFamily={fonts.mono}
                fontWeight={500}
                letterSpacing={letterSpacing.meta}
                style={{ textTransform: "uppercase" }}
              >
                {data.sizeLabel}
              </text>
              {/* Three reference bubbles: min, mid, max */}
              {sizeLegendValues.map((val, si) => {
                const legendBubbleX = plotLeft + 18 + si * 70;
                const legendBubbleY = plotBottom - 40;
                const legendR = sizeLegendRadii[si] ?? minR;
                return (
                  <g key={`sz-${si}`}>
                    <circle
                      cx={legendBubbleX}
                      cy={legendBubbleY}
                      r={Math.min(legendR * 0.7, 20)}
                      fill={palette.taupe}
                      fillOpacity={0.4}
                      stroke={palette.taupe}
                      strokeWidth={1}
                      strokeOpacity={0.7}
                    />
                    <text
                      x={legendBubbleX}
                      y={legendBubbleY + Math.min(legendR * 0.7, 20) + 12}
                      textAnchor="middle"
                      fill={theme.text.muted}
                      fontSize={fontSizes.meta}
                      fontFamily={fonts.mono}
                      letterSpacing={letterSpacing.meta}
                    >
                      {formatTick(val, undefined)}
                    </text>
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        <SourceAttribution
          source={data.source}
          mode={bgVariant}
          prefix="Source: "
          startSec={1.8}
        />
      </AbsoluteFill>
    </Background>
  );
};
