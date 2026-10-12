/**
 * DotPlot — named entities along a single continuous horizontal axis.
 *
 * The Cleveland-canonical alternative to bar charts when the editorial
 * argument is about relative position between entities, not each entity's
 * absolute magnitude from zero. Named after William Cleveland's 1984
 * "Graphical Perception" work showing dots outperform bars on relational
 * reading tasks.
 *
 * Editorial register: Pew Research "Where countries fall on X", FT Alphaville
 * position charts, NATO burden-sharing registers. 15–30 entities on one axis.
 *
 * Render form: strip chart. Each entity is a labeled dot on a horizontal axis.
 * Dots are vertically staggered (above/below) to prevent label collisions.
 * When value2 is present, an arrow animates from value → value2.
 *
 * Animation sequence:
 *   0–20   Title block
 *   20–35  Axis rule draws left → right
 *   30–45  Tick marks + tick labels
 *   35–50  Reference lines fade in
 *   40–70  Dots appear (staggered per revealOrder)
 *   50–80  Entity labels fade in
 *   60–80  Arrow animations (value → value2)
 *   last 3s  Source attribution
 */

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";
import {
  palette,
  semantic,
  fonts,
  fontSizes,
  layout,
  sec,
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
  CLAMP_SINE,
  CLAMP_CUBIC,
} from "../../utils/animation";
import { warnIf } from "../../utils/dataWarnings";
import type { DotPlotData, DotPlotEntity, DotPlotReferenceLine } from "./types";

// ── Format helpers ─────────────────────────────────────────────────────────

/**
 * Apply a printf-style format string to a number.
 * Supported specifiers: %.Nf (fixed N decimals), %d (integer), %.N%% (percent), $%.NB (currency).
 * Falls back to a reasonable default when the format string is unrecognized.
 */
function applyFormat(value: number, fmt?: string): string {
  if (!fmt) {
    // Default: show 1 decimal if abs < 10, else integer
    return Math.abs(value) < 10
      ? value.toFixed(1).replace(/\.0$/, "")
      : value.toFixed(0);
  }
  // "%.1f%%" → "2.1%" style
  const pctMatch = fmt.match(/^%\.(\d+)f%%$/);
  if (pctMatch) {
    return `${value.toFixed(parseInt(pctMatch[1], 10))}%`;
  }
  // "%.1f" → "2.1"
  const fixedMatch = fmt.match(/^%\.(\d+)f$/);
  if (fixedMatch) {
    return value.toFixed(parseInt(fixedMatch[1], 10));
  }
  // "%d" → integer
  if (fmt === "%d") {
    return value.toFixed(0);
  }
  // "$%.0fB" → "$5B" style (crude; for real currency use DataChart)
  const currMatch = fmt.match(/^\$%\.(\d+)f([BMK]?)$/);
  if (currMatch) {
    const decimals = parseInt(currMatch[1], 10);
    const suffix = currMatch[2] ?? "";
    return `$${value.toFixed(decimals)}${suffix}`;
  }
  // Fallback
  return value.toFixed(0);
}

// ── Axis helpers ───────────────────────────────────────────────────────────

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
    ticks.push(Number(t.toFixed(10)));
  }
  return ticks;
}

// ── Dot sub-component ─────────────────────────────────────────────────────

interface DotProps {
  cx: number;
  cy: number;
  radius: number;
  fillColor: string;
  opacity: number;
  scale: number;
  label: string;
  labelAbove: boolean;
  labelColor: string;
  labelOpacity: number;
  annotation?: string;
  annotationOpacity: number;
  isDark: boolean;
  labelFontSize?: number;
  /** Extra leader length in px — lifts this label clear of a neighbour's. */
  labelLift?: number;
  /** The value as text: set large, with `label` small beside it. */
  valueLabel?: string;
  /** Fill for the large value. */
  valueColor?: string;
}

const Dot = React.memo(function Dot({
  cx,
  cy,
  radius,
  fillColor,
  opacity,
  scale,
  label,
  labelAbove,
  labelColor,
  labelOpacity,
  annotation,
  annotationOpacity,
  isDark,
  labelFontSize = fontSizes.caption,
  labelLift = 0,
  valueLabel,
  valueColor,
}: DotProps) {
  // Large labels below the axis need to clear the tick numbers (flatAxisY + 18).
  const leaderLength =
    (labelFontSize > fontSizes.caption ? (labelAbove ? 24 : 44) : 16) + labelLift;
  const leaderY = labelAbove ? cy - radius - leaderLength : cy + radius + leaderLength;
  const labelY = labelAbove ? leaderY - 4 : leaderY + 4;

  return (
    <g style={{ opacity }} transform={`translate(${cx}, ${cy}) scale(${scale}) translate(${-cx}, ${-cy})`}>
      {/* Dot */}
      <circle cx={cx} cy={cy} r={radius} fill={fillColor} />
      {/* Leader line */}
      <line
        x1={cx}
        y1={labelAbove ? cy - radius : cy + radius}
        x2={cx}
        y2={leaderY}
        stroke={fillColor}
        strokeWidth={0.8}
        strokeOpacity={0.5}
        style={{ opacity: labelOpacity }}
      />
      {/* Label — one line, or the value large with the name small. */}
      {valueLabel ? (
        (() => {
          const { valueSize, nameSize } = twoLevelSizes(labelFontSize);
          // The figure sits nearest the dot; the name on the far side of it.
          const valueY = labelAbove ? labelY - 2 : labelY + 2;
          // Offsets clear the figure's full line box, not just its glyphs.
          const nameY = labelAbove
            ? valueY - valueSize - 8
            : valueY + valueSize * 1.2 + 4;
          return (
            <g style={{ opacity: labelOpacity }}>
              <text
                x={cx}
                y={valueY}
                textAnchor="middle"
                dominantBaseline={labelAbove ? "auto" : "hanging"}
                fill={valueColor ?? labelColor}
                fontFamily={fonts.data}
                fontSize={valueSize}
                fontWeight={700}
                letterSpacing={-0.5}
              >
                {valueLabel}
              </text>
              <text
                x={cx}
                y={nameY}
                textAnchor="middle"
                dominantBaseline={labelAbove ? "auto" : "hanging"}
                fill={labelColor}
                fontFamily={fonts.metadata}
                fontSize={nameSize}
                letterSpacing={0.5}
              >
                {label}
              </text>
            </g>
          );
        })()
      ) : (
        <text
          x={cx}
          y={labelY}
          textAnchor="middle"
          dominantBaseline={labelAbove ? "auto" : "hanging"}
          fill={labelColor}
          fontFamily={fonts.metadata}
          fontSize={labelFontSize}
          letterSpacing={0.5}
          style={{ opacity: labelOpacity }}
        >
          {label}
        </text>
      )}
      {/* Annotation bubble */}
      {annotation && (
        <text
          x={cx + radius + 4}
          y={cy - radius - 2}
          textAnchor="start"
          dominantBaseline="auto"
          fill={isDark ? palette.gold : palette.walnut}
          fontFamily={fonts.metadata}
          fontSize={fontSizes.meta}
          letterSpacing={1}
          style={{ opacity: annotationOpacity * labelOpacity }}
        >
          {annotation}
        </text>
      )}
    </g>
  );
});

// ── Arrow sub-component ───────────────────────────────────────────────────

interface ArrowProps {
  x1: number;
  x2: number;
  y: number;
  radius: number;
  positive: boolean;
  progress: number; // 0..1
  opacity: number;
}

const Arrow = React.memo(function Arrow({
  x1,
  x2,
  y,
  radius,
  positive,
  progress,
  opacity,
}: ArrowProps) {
  const arrowColor = positive ? palette.dustblue : semantic.china;
  const startX = x1 + (positive ? radius : -radius);
  const endX = x2 + (positive ? -radius : radius);
  const currentEndX = startX + (endX - startX) * progress;
  const arrowSize = 5;

  if (Math.abs(endX - startX) < 1) return null;

  return (
    <g style={{ opacity }}>
      <line
        x1={startX}
        y1={y}
        x2={currentEndX}
        y2={y}
        stroke={arrowColor}
        strokeWidth={1.5}
        strokeOpacity={0.75}
      />
      {progress > 0.85 && (
        <polygon
          points={
            positive
              ? `${currentEndX},${y} ${currentEndX - arrowSize},${y - arrowSize / 2} ${currentEndX - arrowSize},${y + arrowSize / 2}`
              : `${currentEndX},${y} ${currentEndX + arrowSize},${y - arrowSize / 2} ${currentEndX + arrowSize},${y + arrowSize / 2}`
          }
          fill={arrowColor}
          fillOpacity={0.75}
        />
      )}
    </g>
  );
});

// ── Reference line sub-component ───────────────────────────────────────────

interface ReferenceLineProps {
  x: number;
  yTop: number;
  yBottom: number;
  label?: string;
  style?: "solid" | "dashed";
  color?: string;
  opacity: number;
  isDark: boolean;
  labelFontSize?: number;
}

const ReferenceLine = React.memo(function ReferenceLine({
  x,
  yTop,
  yBottom,
  label,
  style: lineStyle,
  color,
  opacity,
  isDark,
  labelFontSize = fontSizes.meta,
}: ReferenceLineProps) {
  const lineColor = color ?? palette.gold;
  const dash = lineStyle === "solid" ? undefined : "6 4";
  const labelColor = isDark ? palette.sand : palette.walnut;

  return (
    <g style={{ opacity }}>
      <line
        x1={x}
        y1={yTop}
        x2={x}
        y2={yBottom}
        stroke={lineColor}
        strokeWidth={1}
        strokeOpacity={0.7}
        strokeDasharray={dash}
      />
      {label && (
        <text
          x={x + 5}
          y={yTop + 2}
          textAnchor="start"
          dominantBaseline="hanging"
          fill={labelColor}
          fontFamily={fonts.metadata}
          fontSize={labelFontSize}
          letterSpacing={1.5}
          fillOpacity={0.8}
        >
          {label.toUpperCase()}
        </text>
      )}
    </g>
  );
});

// ── Label placement helpers ────────────────────────────────────────────────

interface LabelPlacement {
  above: boolean;
  yOffset: number; // additional vertical stagger when dots are close
  /** Extra leader length so this label clears one already placed beside it. */
  labelLift: number;
}

/** Plex Mono advance width as a fraction of font size. */
const MONO_ADVANCE = 0.6;

/** Type sizes of a two-level label (value large, name small). */
function twoLevelSizes(labelFontSize: number): { valueSize: number; nameSize: number } {
  return {
    valueSize: Math.round(labelFontSize * 1.35),
    nameSize: Math.max(fontSizes.label, Math.round(labelFontSize * 0.78)),
  };
}

/** Estimated width and height of an entity's label block, in px. */
function labelBlockSize(
  label: string,
  valueLabel: string | undefined,
  labelFontSize: number,
): { width: number; height: number } {
  if (!valueLabel) {
    return {
      width: label.length * (labelFontSize * MONO_ADVANCE + 0.5),
      height: Math.round(labelFontSize * 1.35),
    };
  }
  const { valueSize, nameSize } = twoLevelSizes(labelFontSize);
  return {
    width: Math.max(
      valueLabel.length * valueSize * MONO_ADVANCE,
      label.length * (nameSize * MONO_ADVANCE + 0.5),
    ),
    height: Math.round(valueSize * 1.2) + nameSize + 12,
  };
}
/**
 * Minimum clear space between two labels on the same row, in ems. Two labels
 * closer than this read as one run of text even when they do not touch.
 */
const LABEL_CLEARANCE_EM = 1.5;

/**
 * Assign above/below placement to each entity to reduce label collisions.
 * Strategy:
 *   1. Even-index entities go above, odd-index go below (baseline alternation).
 *   2. When two adjacent dots (sorted by value) are within 60px of each other,
 *      the second dot gets an extra ±20px vertical stagger on top of above/below.
 *   3. Labels are centred on their dot and can be far wider than the gap to
 *      the next dot on the same side. Each label's width is estimated (the
 *      label face is monospaced, so characters × advance is exact enough) and
 *      a label that would run into one already placed on its side is lifted
 *      to the next row, on a longer leader.
 */
function computeLabelPlacements(
  sortedValues: number[],
  xPositions: number[],
  blocks: { width: number; height: number }[] = [],
  labelFontSize: number = fontSizes.caption,
): LabelPlacement[] {
  const result: LabelPlacement[] = sortedValues.map((_, i) => ({
    above: i % 2 === 0,
    yOffset: 0,
    labelLift: 0,
  }));

  // Pass: lift labels that would collide with one on the same side.
  const rowHeight = Math.max(
    Math.round(labelFontSize * 1.35),
    ...blocks.map((b) => b.height),
  );
  const clearance = labelFontSize * LABEL_CLEARANCE_EM;
  const placedBySide: Record<"above" | "below", { left: number; right: number; row: number }[]> = {
    above: [],
    below: [],
  };
  for (let i = 0; i < xPositions.length; i++) {
    const half = (blocks[i]?.width ?? 0) / 2;
    const left = xPositions[i] - half;
    const right = xPositions[i] + half;
    const placed = placedBySide[result[i].above ? "above" : "below"];
    let row = 0;
    while (
      placed.some(
        (p) =>
          p.row === row &&
          left < p.right + clearance &&
          right > p.left - clearance,
      )
    ) {
      row += 1;
    }
    placed.push({ left, right, row });
    result[i].labelLift = row * rowHeight;
  }

  // Pass: add extra stagger for pairs within 60px
  for (let i = 1; i < xPositions.length; i++) {
    const gap = Math.abs(xPositions[i] - xPositions[i - 1]);
    if (gap < 60) {
      // Both get extra separation in opposite directions
      result[i - 1].yOffset = result[i - 1].above ? -20 : 20;
      result[i].yOffset = result[i].above ? -20 : 20;
    }
  }
  return result;
}

// ── Main component ────────────────────────────────────────────────────────

export const DotPlot: React.FC<{ data: DotPlotData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const theme = useThemeMode(data.backgroundVariant ?? "light");
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);

  const variant = data.backgroundVariant ?? "light";
  const isDark = variant === "dark";

  // ── Validation guards ─────────────────────────────────────────────────
  warnIf(
    !data.entities && !data.groups,
    "DotPlot",
    "Neither 'entities' nor 'groups' is provided — chart will render empty."
  );
  warnIf(
    !!(data.entities && data.groups),
    "DotPlot",
    "'entities' and 'groups' are mutually exclusive — only one should be provided."
  );
  warnIf(
    (data.entities?.length ?? 0) > 40,
    "DotPlot",
    "More than 40 entities will compress the axis; consider trimming to the top-N."
  );

  // ── Resolved options ──────────────────────────────────────────────────
  const largeLabels = data.labelScale === "large";
  const dotRadius = data.dotRadius ?? (largeLabels ? 12 : 6);
  const entityLabelSize = largeLabels ? fontSizes.h3 : fontSizes.caption;
  // Large mode keeps every piece of text at 28px or more (the content floor).
  const tickLabelSize = largeLabels ? 28 : fontSizes.meta;
  const refLabelSize = largeLabels ? 28 : fontSizes.meta;
  const showArrows = data.showArrows !== false; // default true
  const revealOrder = data.revealOrder ?? "top-to-bottom";
  const axisTickCount = data.axisTickCount ?? 5;

  // ── Flat entity list (handles both flat and grouped modes) ────────────
  const allEntities = useMemo<DotPlotEntity[]>(() => {
    if (data.entities) return data.entities;
    if (data.groups) return data.groups.flatMap((g) => g.entities);
    return [];
  }, [data.entities, data.groups]);

  // ── Axis range ────────────────────────────────────────────────────────
  const { axisMin, axisMax, ticks } = useMemo(() => {
    const allValues = allEntities.flatMap((e) =>
      e.value2 != null ? [e.value, e.value2] : [e.value]
    );
    const refValues = (data.referenceLines ?? []).map((r) => r.value);
    const all = [...allValues, ...refValues];
    if (all.length === 0) return { axisMin: 0, axisMax: 1, ticks: [0, 1] };

    const rawMin = data.axisMin ?? Math.min(...all);
    const rawMax = data.axisMax ?? Math.max(...all);
    const generatedTicks = generateTicks(rawMin, rawMax, axisTickCount);
    return {
      axisMin: data.axisMin ?? generatedTicks[0] ?? rawMin,
      axisMax: data.axisMax ?? generatedTicks[generatedTicks.length - 1] ?? rawMax,
      ticks: generatedTicks,
    };
  }, [allEntities, data.axisMin, data.axisMax, data.referenceLines, axisTickCount]);

  // ── Layout ────────────────────────────────────────────────────────────
  const safe = layout.safeAreaTier.generous;
  const titleBlockHeight = 150;
  const chartTopPad = layout.spacing.xl; // 48px title-to-content gap
  // Axis sits ~200px below the title area. With large labels (a flat strip
  // carrying a whole card) it sits at the middle of the space under the title
  // instead, so the lower half of the frame is not left empty.
  const axisY = largeLabels
    ? Math.round(
        (safe.top + titleBlockHeight + (layout.height - safe.bottom - 80)) / 2,
      )
    : safe.top + titleBlockHeight + chartTopPad + 200;

  // Large mode sets 28px tick and axis labels, which hang past the ends of
  // the axis; pull the axis in so they stay inside the graphics-safe area.
  const chartLeft = safe.left + 18 + (largeLabels ? 20 : 0); // drift reserve
  const chartRight = layout.width - safe.right - 18 - (largeLabels ? 96 : 0);
  const chartWidth = chartRight - chartLeft;

  // In grouped mode, reserve extra vertical space per group
  const isGrouped = !!data.groups;
  const groupCount = data.groups?.length ?? 1;
  const groupHeight = isGrouped ? 100 : 0; // per-group strip height in grouped mode

  // Vertical extent of the dot field (above + below the axis rule)
  const dotFieldHalfHeight = isGrouped
    ? groupCount * groupHeight
    : 160; // flat mode: dots spread 160px above+below axis

  const axisRuleY = isGrouped
    ? safe.top + titleBlockHeight + chartTopPad + 80
    : axisY;

  // ── X-scale ───────────────────────────────────────────────────────────
  const xScale = useMemo(() => {
    return (v: number): number => {
      if (axisMax === axisMin) return chartLeft + chartWidth / 2;
      return chartLeft + ((v - axisMin) / (axisMax - axisMin)) * chartWidth;
    };
  }, [axisMin, axisMax, chartLeft, chartWidth]);

  // ── Dot positions (x coords + label placement) ────────────────────────
  const { dotPositions, labelPlacements } = useMemo(() => {
    if (isGrouped) {
      // Grouped: each group is a horizontal strip; placements are simpler
      return { dotPositions: [], labelPlacements: [] };
    }

    // Sort entities by value for label placement (left-to-right order matters
    // for collision detection regardless of revealOrder).
    const valueOrder = allEntities.map((e, i) => ({ entity: e, origIndex: i }))
      .sort((a, b) => a.entity.value - b.entity.value);

    const xPositions = valueOrder.map(({ entity }) => xScale(entity.value));
    const placements = computeLabelPlacements(
      valueOrder.map(({ entity }) => entity.value),
      xPositions,
      valueOrder.map(({ entity }) =>
        labelBlockSize(entity.label, entity.valueLabel, entityLabelSize),
      ),
      entityLabelSize,
    );

    // Map placements back to original entity order
    const posMap = new Map<number, LabelPlacement>();
    valueOrder.forEach(({ origIndex }, sortedIdx) => {
      posMap.set(origIndex, placements[sortedIdx]);
    });

    return {
      dotPositions: allEntities.map((e, i) => ({
        x: xScale(e.value),
        x2: e.value2 != null ? xScale(e.value2) : null,
        placement: posMap.get(i) ?? { above: i % 2 === 0, yOffset: 0, labelLift: 0 },
      })),
      labelPlacements: allEntities.map((_, i) => posMap.get(i) ?? { above: i % 2 === 0, yOffset: 0, labelLift: 0 }),
    };
  }, [allEntities, xScale, isGrouped, entityLabelSize]);

  // ── Entity colors by emphasis ─────────────────────────────────────────
  function entityColor(entity: DotPlotEntity): string {
    if (entity.color) return entity.color;
    switch (entity.emphasis ?? "primary") {
      case "secondary": return palette.taupe;
      case "muted": return palette.sand;
      default: return palette.gold;
    }
  }

  function entityRadiusByEmphasis(entity: DotPlotEntity): number {
    switch (entity.emphasis ?? "primary") {
      case "secondary": return dotRadius * 0.7;
      case "muted": return dotRadius * 0.5;
      default: return dotRadius;
    }
  }

  function entityOpacityByEmphasis(entity: DotPlotEntity): number {
    switch (entity.emphasis ?? "primary") {
      case "muted": return 0.4;
      default: return 1;
    }
  }

  // ── Reveal ordering ───────────────────────────────────────────────────
  /**
   * Returns a stagger index for entity i, per the revealOrder setting.
   * left-to-right → stagger by ascending value position
   * top-to-bottom → stagger by input order
   * simultaneous  → all index 0
   */
  const revealIndexes = useMemo(() => {
    if (revealOrder === "simultaneous") {
      return allEntities.map(() => 0);
    }
    if (revealOrder === "left-to-right") {
      // Sort by value; assign rank as reveal index
      const withValue = allEntities.map((e, i) => ({ i, v: e.value }));
      withValue.sort((a, b) => a.v - b.v);
      const ranks = new Array<number>(allEntities.length);
      withValue.forEach(({ i }, rank) => { ranks[i] = rank; });
      return ranks;
    }
    // top-to-bottom: input order
    return allEntities.map((_, i) => i);
  }, [allEntities, revealOrder]);

  // ── Animation timings ─────────────────────────────────────────────────
  // Timing tuned so axis + several dots are settled by frame 30 (POLISH.md T1).
  // Axis draws first (done by f20), dots stagger in from f15 at 2-frame steps so
  // the first ~8 entities are visible at f30 even with long entity lists.
  const TITLE_END = 16;
  const AXIS_DRAW_START = 8;
  const AXIS_DRAW_END = 20;
  const TICKS_START = 16;
  const TICKS_END = 28;
  const REFLINE_START = 20;
  const REFLINE_END = 32;
  const DOT_START = 15;
  const DOT_END = 58;
  const ARROW_START = 50;
  const ARROW_END = 72;
  const STAGGER_STEP = revealOrder === "simultaneous" ? 0 : 2;

  // Axis line draw progress (left → right)
  const axisProgress = interpolate(frame, [AXIS_DRAW_START, AXIS_DRAW_END], [0, 1], CLAMP_CUBIC);

  // Tick opacity
  const tickOpacity = interpolate(frame, [TICKS_START, TICKS_END], [0, 1], CLAMP_SINE);

  // Reference line opacity
  const refLineOpacity = interpolate(frame, [REFLINE_START, REFLINE_END], [0, 1], CLAMP_SINE);

  // Per-entity dot opacity + scale (staggered)
  function dotAnimValues(revealIdx: number, atSec?: number): { opacity: number; scale: number } {
    const start = atSec !== undefined ? sec(atSec) : DOT_START + revealIdx * STAGGER_STEP;
    const end = start + timing.entrance.medium; // 15 frames
    const opacity = interpolate(frame, [start, end], [0, 1], CLAMP_CUBIC);
    const scale = interpolate(frame, [start, start + timing.entrance.fast], [0.3, 1], CLAMP_CUBIC);
    return { opacity, scale };
  }

  function labelOpacityForIdx(revealIdx: number, atSec?: number): number {
    const start = (atSec !== undefined ? sec(atSec) : DOT_START + revealIdx * STAGGER_STEP) + 10;
    return interpolate(frame, [start, start + timing.entrance.medium], [0, 1], CLAMP_SINE);
  }

  function arrowProgressForIdx(revealIdx: number): number {
    const start = ARROW_START + revealIdx * STAGGER_STEP;
    return interpolate(frame, [start, ARROW_END], [0, 1], CLAMP_CUBIC);
  }

  // Source fade in during last 3s
  const durationSec = data.durationSec ?? 12;
  const totalFrames = sec(durationSec);
  const sourceOpacity = interpolate(
    frame,
    [totalFrames - sec(3), totalFrames - sec(2)],
    [0, 1],
    CLAMP_SINE
  );

  // Text colors from theme mode
  const textPrimary = isDark ? palette.sand : palette.ink;
  const textSecondary = isDark ? palette.taupe : palette.walnut;
  const textMuted = isDark ? palette.umber : palette.umber;
  const axisColor = isDark ? palette.umber : palette.taupe;

  // ── Grouped mode layout ───────────────────────────────────────────────
  const groupRows = useMemo(() => {
    if (!data.groups) return null;
    return data.groups.map((group, gi) => {
      const rowY = axisRuleY + gi * (groupHeight + 20);
      return {
        group,
        rowY,
        entities: group.entities.map((entity) => ({
          entity,
          x: xScale(entity.value),
          x2: entity.value2 != null ? xScale(entity.value2) : null,
        })),
      };
    });
  }, [data.groups, axisRuleY, groupHeight, xScale]);

  // ── Axis Y (flat mode uses single center axis, grouped uses axis above rows) ─
  const flatAxisY = axisY;

  // ── Dot field vertical bounds for the axis draw ───────────────────────
  const axisDrawY = isGrouped ? axisRuleY - 20 : flatAxisY;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <Background
      variant={variant}
      tint={direction.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        <HeaderStrip metadata={data.episode} mode={variant} />
        <FooterStrip
          scale={data.axisLabel ? `AXIS · ${data.axisLabel}` : undefined}
          mode={variant}
        />

        {/* Title */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <TitleBlock
            title={data.title ?? ""}
            subtitle={data.subtitle}
            safeAreaTier="generous"
          />
        </div>

        {/* Main SVG canvas */}
        <svg
          style={{ position: "absolute", inset: 0 }}
          width={layout.width}
          height={layout.height}
        >
          {/* ── Flat mode ─────────────────────────────────────────────── */}
          {!isGrouped && (
            <>
              {/* Optional grid lines */}
              {data.showGrid && ticks.map((tick) => {
                const gx = xScale(tick);
                if (gx < chartLeft || gx > chartRight) return null;
                return (
                  <line
                    key={`grid-${tick}`}
                    x1={gx}
                    y1={flatAxisY - dotFieldHalfHeight / 2}
                    x2={gx}
                    y2={flatAxisY + dotFieldHalfHeight / 2}
                    stroke={axisColor}
                    strokeWidth={0.5}
                    strokeOpacity={0.3}
                    strokeDasharray="3 5"
                    style={{ opacity: tickOpacity }}
                  />
                );
              })}

              {/* Axis rule — draws left → right */}
              <line
                x1={chartLeft}
                y1={flatAxisY}
                x2={chartLeft + axisProgress * chartWidth}
                y2={flatAxisY}
                stroke={axisColor}
                strokeWidth={0.8}
                strokeOpacity={0.8}
              />

              {/* Tick marks + labels */}
              {ticks.map((tick) => {
                const tx = xScale(tick);
                if (tx < chartLeft - 1 || tx > chartRight + 1) return null;
                return (
                  <g key={`tick-${tick}`} style={{ opacity: tickOpacity }}>
                    <line
                      x1={tx}
                      y1={flatAxisY - 4}
                      x2={tx}
                      y2={flatAxisY + 4}
                      stroke={axisColor}
                      strokeWidth={0.8}
                      strokeOpacity={0.6}
                    />
                    <text
                      x={tx}
                      y={flatAxisY + 18}
                      textAnchor="middle"
                      dominantBaseline="hanging"
                      fill={textMuted}
                      fontFamily={fonts.data}
                      fontSize={tickLabelSize}
                      letterSpacing={1}
                    >
                      {applyFormat(tick, data.axisFormat)}
                    </text>
                  </g>
                );
              })}

              {/* Axis label */}
              {data.axisLabel && (
                <text
                  x={chartRight + 8}
                  y={flatAxisY + 2}
                  textAnchor="start"
                  dominantBaseline="middle"
                  fill={textMuted}
                  fontFamily={fonts.metadata}
                  fontSize={tickLabelSize}
                  letterSpacing={1.5}
                  style={{ opacity: tickOpacity }}
                >
                  {data.axisLabel.toUpperCase()}
                </text>
              )}

              {/* Span — the distance the claim is about, drawn on the axis. */}
              {data.span &&
                (() => {
                  const primaries = allEntities.filter((e) => (e.emphasis ?? "primary") === "primary");
                  const pool = primaries.length > 0 ? primaries : allEntities;
                  const to = data.span.to ?? Math.max(...pool.map((e) => e.value));
                  const nearest = Math.min(
                    ...allEntities.filter((e) => e.value > data.span!.from).map((e) => e.value),
                    to,
                  );
                  const x0 = xScale(data.span.from);
                  const x1 = xScale(to);
                  const start = sec(data.span.atSec ?? 1.0);
                  const progress = interpolate(frame, [start, start + sec(0.9)], [0, 1], CLAMP_CUBIC);
                  if (progress <= 0) return null;
                  return (
                    <g>
                      <rect
                        x={x0}
                        y={flatAxisY - 5}
                        width={(x1 - x0) * progress}
                        height={10}
                        fill={palette.gold}
                        opacity={0.45}
                      />
                      {data.span.label && (
                        <text
                          x={(x0 + xScale(nearest)) / 2}
                          y={flatAxisY - 22}
                          textAnchor="middle"
                          fill={isDark ? palette.gold : palette.goldText}
                          fontFamily={fonts.metadata}
                          fontSize={Math.max(fontSizes.body, tickLabelSize)}
                          letterSpacing={1}
                          style={{ opacity: interpolate(frame, [start + sec(0.5), start + sec(1.1)], [0, 1], CLAMP_SINE) }}
                        >
                          {data.span.label}
                        </text>
                      )}
                    </g>
                  );
                })()}

              {/* Reference lines */}
              {(data.referenceLines ?? []).map((refLine, ri) => {
                const rx = xScale(refLine.value);
                if (rx < chartLeft || rx > chartRight) return null;
                return (
                  <ReferenceLine
                    key={`ref-${ri}`}
                    x={rx}
                    yTop={flatAxisY - dotFieldHalfHeight / 2}
                    yBottom={flatAxisY + dotFieldHalfHeight / 2}
                    label={refLine.label}
                    style={refLine.style ?? "dashed"}
                    color={refLine.color}
                    opacity={refLineOpacity}
                    isDark={isDark}
                    labelFontSize={refLabelSize}
                  />
                );
              })}

              {/* Arrows (value → value2) — render before dots so dots sit on top */}
              {showArrows && allEntities.map((entity, i) => {
                if (entity.value2 == null) return null;
                const pos = dotPositions[i];
                if (!pos) return null;
                const revealIdx = revealIndexes[i];
                const progress = arrowProgressForIdx(revealIdx);
                const { opacity } = dotAnimValues(revealIdx);
                const isPositive = entity.value2 > entity.value;
                return (
                  <Arrow
                    key={`arrow-${entity.id}`}
                    x1={pos.x}
                    x2={pos.x2 ?? pos.x}
                    y={flatAxisY}
                    radius={entityRadiusByEmphasis(entity)}
                    positive={isPositive}
                    progress={progress}
                    opacity={opacity}
                  />
                );
              })}

              {/* Dots */}
              {allEntities.map((entity, i) => {
                const pos = dotPositions[i];
                if (!pos) return null;
                const revealIdx = revealIndexes[i];
                const { opacity, scale } = dotAnimValues(revealIdx, entity.atSec);
                const labelOp = labelOpacityForIdx(revealIdx, entity.atSec);
                const entityOp = entityOpacityByEmphasis(entity) * opacity;
                const placement = pos.placement;
                const dotY = flatAxisY + placement.yOffset;
                const dotColor = entityColor(entity);
                const r = entityRadiusByEmphasis(entity);

                return (
                  <Dot
                    key={`dot-${entity.id}`}
                    cx={pos.x}
                    cy={dotY}
                    radius={r}
                    fillColor={dotColor}
                    opacity={entityOp}
                    scale={scale}
                    label={entity.label}
                    labelAbove={placement.above}
                    labelColor={textSecondary}
                    labelOpacity={labelOp}
                    annotation={entity.annotation}
                    annotationOpacity={refLineOpacity}
                    isDark={isDark}
                    labelFontSize={entityLabelSize}
                    labelLift={placement.labelLift}
                    valueLabel={entity.valueLabel}
                    valueColor={textPrimary}
                  />
                );
              })}

              {/* value2 dots (second position) */}
              {showArrows && allEntities.map((entity, i) => {
                if (entity.value2 == null) return null;
                const pos = dotPositions[i];
                if (!pos || pos.x2 == null) return null;
                const revealIdx = revealIndexes[i];
                const progress = arrowProgressForIdx(revealIdx);
                const arrowOpacity = interpolate(frame, [ARROW_START + revealIdx * STAGGER_STEP, ARROW_END], [0, 0.6], CLAMP_SINE);
                const r = entityRadiusByEmphasis(entity);
                const isPositive = entity.value2 > entity.value;
                const arrowColor = isPositive ? palette.dustblue : semantic.china;

                return (
                  <circle
                    key={`dot2-${entity.id}`}
                    cx={pos.x2}
                    cy={flatAxisY}
                    r={r * 0.8}
                    fill={arrowColor}
                    fillOpacity={0.6}
                    style={{ opacity: arrowOpacity * progress }}
                  />
                );
              })}
            </>
          )}

          {/* ── Grouped mode ──────────────────────────────────────────── */}
          {isGrouped && groupRows && (
            <>
              {/* Axis at the top of grouped strips */}
              <line
                x1={chartLeft}
                y1={axisDrawY}
                x2={chartLeft + axisProgress * chartWidth}
                y2={axisDrawY}
                stroke={axisColor}
                strokeWidth={0.8}
                strokeOpacity={0.8}
              />

              {/* Shared ticks along top axis */}
              {ticks.map((tick) => {
                const tx = xScale(tick);
                if (tx < chartLeft - 1 || tx > chartRight + 1) return null;
                return (
                  <g key={`tick-${tick}`} style={{ opacity: tickOpacity }}>
                    <line
                      x1={tx}
                      y1={axisDrawY - 4}
                      x2={tx}
                      y2={axisDrawY + 4}
                      stroke={axisColor}
                      strokeWidth={0.8}
                      strokeOpacity={0.6}
                    />
                    <text
                      x={tx}
                      y={axisDrawY - 10}
                      textAnchor="middle"
                      dominantBaseline="auto"
                      fill={textMuted}
                      fontFamily={fonts.data}
                      fontSize={fontSizes.meta}
                      letterSpacing={1}
                    >
                      {applyFormat(tick, data.axisFormat)}
                    </text>
                  </g>
                );
              })}

              {/* Reference lines (span all group rows) */}
              {(data.referenceLines ?? []).map((refLine, ri) => {
                const rx = xScale(refLine.value);
                if (rx < chartLeft || rx > chartRight) return null;
                const lastRow = groupRows[groupRows.length - 1];
                return (
                  <ReferenceLine
                    key={`ref-${ri}`}
                    x={rx}
                    yTop={axisDrawY}
                    yBottom={lastRow.rowY + 24}
                    label={refLine.label}
                    style={refLine.style ?? "dashed"}
                    color={refLine.color}
                    opacity={refLineOpacity}
                    isDark={isDark}
                  />
                );
              })}

              {/* Group rows */}
              {groupRows.map(({ group, rowY, entities: rowEntities }, gi) => {
                const groupStagger = gi * 8; // stagger group reveal
                const groupOpacity = interpolate(
                  frame,
                  [DOT_START + groupStagger, DOT_START + groupStagger + timing.entrance.medium],
                  [0, 1],
                  CLAMP_SINE
                );
                return (
                  <g key={`group-${gi}`} style={{ opacity: groupOpacity }}>
                    {/* Group label */}
                    <text
                      x={chartLeft}
                      y={rowY + 12}
                      textAnchor="start"
                      dominantBaseline="middle"
                      fill={textSecondary}
                      fontFamily={fonts.metadata}
                      fontSize={fontSizes.caption}
                      letterSpacing={1.5}
                    >
                      {group.label.toUpperCase()}
                    </text>

                    {/* Group axis rule */}
                    <line
                      x1={chartLeft}
                      y1={rowY + 28}
                      x2={chartRight}
                      y2={rowY + 28}
                      stroke={axisColor}
                      strokeWidth={0.5}
                      strokeOpacity={0.4}
                    />

                    {/* Group dots */}
                    {rowEntities.map(({ entity, x: ex, x2 }, ei) => {
                      const dotColor = entityColor(entity);
                      const r = entityRadiusByEmphasis(entity);
                      const eo = entityOpacityByEmphasis(entity);
                      const dotScale = interpolate(
                        frame,
                        [DOT_START + groupStagger + ei * 2, DOT_START + groupStagger + ei * 2 + timing.entrance.crisp],
                        [0.2, 1],
                        CLAMP_CUBIC
                      );
                      const lblOp = interpolate(
                        frame,
                        [DOT_START + groupStagger + ei * 2 + 8, DOT_START + groupStagger + ei * 2 + 8 + timing.entrance.crisp],
                        [0, 1],
                        CLAMP_SINE
                      );
                      const gy = rowY + 28;
                      return (
                        <Dot
                          key={`grpdot-${gi}-${ei}`}
                          cx={ex}
                          cy={gy}
                          radius={r}
                          fillColor={dotColor}
                          opacity={eo}
                          scale={dotScale}
                          label={entity.label}
                          labelAbove={ei % 2 === 0}
                          labelColor={textSecondary}
                          labelOpacity={lblOp}
                          annotation={entity.annotation}
                          annotationOpacity={lblOp}
                          isDark={isDark}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </>
          )}
        </svg>

        {/* Source attribution */}
        {/* SourceAttribution positions itself (bottom-right of the safe area).
            The old zero-width wrapper made its `right` offset push the line
            off-frame, so the source never appeared. */}
        {data.source && (
          <div style={{ opacity: sourceOpacity }}>
            <SourceAttribution source={data.source} mode={variant} />
          </div>
        )}
      </AbsoluteFill>
    </Background>
  );
};
