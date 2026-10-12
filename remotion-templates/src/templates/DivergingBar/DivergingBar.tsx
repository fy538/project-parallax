/**
 * DivergingBar — centered horizontal bar chart where positive values extend
 * right and negative values extend left. The center axis is the editorial
 * division — the split IS the argument.
 *
 * Editorial uses:
 *   - Opinion splits across countries (Pew, FT poll-of-polls register)
 *   - Alliance/neutrality scores (-10 opposed ↔ +10 supportive)
 *   - Policy before/after: deficit left, surplus right
 *   - Trade position: net exporter right, net importer left
 *
 * Animation sequence:
 *   1. Title fades in (0–20)
 *   2. Center axis rule appears (15–25)
 *   3. Axis endpoint labels fade in (20–30)
 *   4. Bars animate outward from center (25–60, top-to-bottom stagger, cubic out)
 *   5. Value labels fade in as bars settle (50–75)
 *   6. Source attribution fades in last 3s (via SourceAttribution startSec)
 *   7. Ken Burns drift + exit fade (via useCompositionAnimation)
 *
 * Performance:
 *   - useMemo for sorting, maxAbsValue, and pixel layout
 *   - React.memo for per-bar DivergingBarRow sub-component
 *   - warnIf for items > 20, any item missing value
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import {
  palette,
  semantic,
  fonts,
  fontSizes,
  layout,
  sec,
  contentArea,
} from "../../design/theme";
import { fadeIn, stagger, CLAMP } from "../../utils/animation";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { warnIf } from "../../utils/dataWarnings";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import type { DivergingBarData, DivergingBarItem } from "./types";

// ── Layout constants ────────────────────────────────────────────────────────

const LABEL_COLUMN_WIDTH = 160; // entity label area (right-aligned, left of center)
const VALUE_LABEL_WIDTH = 80;   // value number at bar end
const CENTER_AXIS_PAD = 12;     // gap between label column and bar
const BAR_GAP = 6;              // vertical gap between bars
const BAR_MIN_H = 20;
const BAR_MAX_H = 36;

// ── Animation timing ────────────────────────────────────────────────────────

const AXIS_START = 15;
const AXIS_END = 25;
const AXIS_LABEL_START = 20;
const AXIS_LABEL_END = 30;
const BAR_START = 25;
const BAR_END = 60;
const VALUE_LABEL_START = 50;
const VALUE_LABEL_END = 75;
const BAR_STAGGER_FRAMES = 4; // frames between each bar's start

// ── Per-bar sub-component ───────────────────────────────────────────────────

interface DivergingBarRowProps {
  item: DivergingBarItem;
  index: number;
  frame: number;
  centerX: number;
  barY: number;
  barHeight: number;
  maxHalfWidth: number;
  maxAbsValue: number;
  positiveColor: string;
  negativeColor: string;
  colorMode: "split" | "gradient" | "categorical";
  showValues: boolean;
  textColor: string;
  valueLabelColor: string;
}

const DivergingBarRow: React.FC<DivergingBarRowProps> = React.memo(
  ({
    item,
    index,
    frame,
    centerX,
    barY,
    barHeight,
    maxHalfWidth,
    maxAbsValue,
    positiveColor,
    negativeColor,
    colorMode,
    showValues,
    textColor,
    valueLabelColor,
  }) => {
    const barStartFrame = BAR_START + stagger(index, BAR_STAGGER_FRAMES);
    const barProgress = interpolate(
      frame,
      [barStartFrame, Math.max(barStartFrame + 1, BAR_END)],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.cubic),
      }
    );

    const valueOpacity = fadeIn(frame, VALUE_LABEL_START, VALUE_LABEL_END - VALUE_LABEL_START);

    const pixelHalfWidth =
      maxAbsValue > 0
        ? (Math.abs(item.value) / maxAbsValue) * maxHalfWidth * barProgress
        : 0;

    // Resolve fill color based on colorMode
    let fillColor: string;
    if (colorMode === "categorical" && item.color) {
      fillColor = item.color;
    } else if (item.value >= 0) {
      fillColor = positiveColor;
    } else {
      fillColor = negativeColor;
    }

    const isPositive = item.value >= 0;
    const barX = isPositive ? centerX : centerX - pixelHalfWidth;
    const barTop = barY;

    // Value label position: at the end of the bar, away from center
    const valueLabelX = isPositive
      ? centerX + pixelHalfWidth + 6
      : centerX - pixelHalfWidth - 6;
    const valueLabelAnchor: "start" | "end" = isPositive ? "start" : "end";

    // Format value: show sign for both positive and negative
    const formattedValue =
      item.value >= 0 ? `+${item.value}` : `${item.value}`;

    return (
      <g>
        {/* Entity label — right-aligned left of center axis */}
        <text
          x={centerX - CENTER_AXIS_PAD}
          y={barTop + barHeight / 2}
          textAnchor="end"
          dominantBaseline="middle"
          style={{
            fontFamily: fonts.mono,
            fontSize: fontSizes.caption,
            fontWeight: 500,
            fill: textColor,
          }}
        >
          {item.label}
        </text>
        {/* Optional sublabel below entity label */}
        {item.sublabel && (
          <text
            x={centerX - CENTER_AXIS_PAD}
            y={barTop + barHeight / 2 + fontSizes.caption * 0.9}
            textAnchor="end"
            dominantBaseline="middle"
            style={{
              fontFamily: fonts.mono,
              fontSize: fontSizes.meta,
              fontWeight: 400,
              fill: valueLabelColor,
              opacity: 0.7,
            }}
          >
            {item.sublabel}
          </text>
        )}
        {/* Bar */}
        <rect
          x={barX}
          y={barTop}
          width={pixelHalfWidth}
          height={barHeight}
          fill={fillColor}
          rx={2}
          ry={2}
        />
        {/* Value label at bar end */}
        {showValues && pixelHalfWidth > 0 && (
          <text
            x={valueLabelX}
            y={barTop + barHeight / 2}
            textAnchor={valueLabelAnchor}
            dominantBaseline="middle"
            style={{
              fontFamily: fonts.data,
              fontSize: fontSizes.meta,
              fontWeight: 500,
              fill: valueLabelColor,
              opacity: valueOpacity,
            }}
          >
            {formattedValue}
          </text>
        )}
      </g>
    );
  }
);

DivergingBarRow.displayName = "DivergingBarRow";

// ── Main component ──────────────────────────────────────────────────────────

export const DivergingBar: React.FC<{ data: DivergingBarData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { style: compStyle } = useCompositionAnimation();
  const { syncPoints } = useDirection(data._direction);
  const mode = data.backgroundVariant ?? "light";
  const theme = useThemeMode(mode);

  // ── Warnings ────────────────────────────────────────────────────────────
  warnIf(
    data.items.length > 20,
    "DivergingBar",
    `items.length=${data.items.length} exceeds 20 — chart will be crowded. Trim to ≤20.`
  );
  warnIf(
    data.items.some((i) => i.value === undefined || i.value === null),
    "DivergingBar",
    "One or more items is missing a value — bars will render as zero-width."
  );

  // ── Sort ────────────────────────────────────────────────────────────────
  const sortedItems = useMemo<DivergingBarItem[]>(() => {
    const arr = [...data.items];
    const order = data.sortOrder ?? "value-desc";
    if (order === "value-desc") {
      arr.sort((a, b) => b.value - a.value);
    } else if (order === "value-asc") {
      arr.sort((a, b) => a.value - b.value);
    } else if (order === "label-asc") {
      arr.sort((a, b) => a.label.localeCompare(b.label));
    }
    // "data" — no sort, preserve insertion order
    return arr;
  }, [data.items, data.sortOrder]);

  // ── Scale ────────────────────────────────────────────────────────────────
  const maxAbsValue = useMemo<number>(() => {
    if (sortedItems.length === 0) return 1;
    return Math.max(...sortedItems.map((i) => Math.abs(i.value)));
  }, [sortedItems]);

  // ── Layout geometry ──────────────────────────────────────────────────────
  const area = useMemo(() => contentArea("content", "generous"), []);

  const barHeight = useMemo<number>(() => {
    const available = area.height - (sortedItems.length - 1) * BAR_GAP;
    return Math.max(BAR_MIN_H, Math.min(BAR_MAX_H, available / sortedItems.length));
  }, [area.height, sortedItems.length]);

  const totalBarsHeight = useMemo<number>(
    () => sortedItems.length * barHeight + (sortedItems.length - 1) * BAR_GAP,
    [sortedItems.length, barHeight]
  );

  // Center the bars block vertically within the content area
  const barsTopOffset = useMemo<number>(
    () => area.top + Math.max(0, (area.height - totalBarsHeight) / 2),
    [area.top, area.height, totalBarsHeight]
  );

  // Center X: left safe area + label column + center padding = the axis
  const centerX = useMemo<number>(
    () => area.left + LABEL_COLUMN_WIDTH,
    [area.left]
  );

  // Max half-width: from center to right edge, minus value label space
  const maxHalfWidth = useMemo<number>(
    () => Math.max(1, (area.width - LABEL_COLUMN_WIDTH) / 2 - VALUE_LABEL_WIDTH),
    [area.width]
  );

  // Resolve colors
  const positiveColor = data.positiveColor ?? palette.gold;
  const negativeColor = data.negativeColor ?? semantic.china;
  const colorMode = data.colorMode ?? "split";
  const showValues = data.showValues ?? true;
  const textColor = theme.text.primary;
  const axisColor = palette.taupe;
  const axisLabelColor = palette.umber;
  const valueLabelColor = palette.taupe;

  // ── Axis animation ───────────────────────────────────────────────────────
  const axisOpacity = interpolate(frame, [AXIS_START, AXIS_END], [0, 1], CLAMP);
  const axisLabelOpacity = interpolate(
    frame,
    [AXIS_LABEL_START, AXIS_LABEL_END],
    [0, 1],
    CLAMP
  );

  // Axis rule runs from barsTopOffset to barsTopOffset + totalBarsHeight
  const axisRuleTop = barsTopOffset;
  const axisRuleHeight = totalBarsHeight;

  // Endpoint label Y — below all bars
  const axisLabelY = barsTopOffset + totalBarsHeight + 20;
  // axisLabel Y (axis description) — just below that
  const axisDescY = axisLabelY + fontSizes.caption + 8;

  return (
    <Background variant={mode}>
      <AbsoluteFill style={compStyle}>
        <HeaderStrip metadata={data.episode} mode={mode} />
        {/* Title block */}
        {data.title && (
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={mode}
            syncPoints={syncPoints}
          />
        )}

        {/* Chart SVG */}
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: layout.width,
            height: layout.height,
            overflow: "visible",
          }}
        >
          {/* Center axis rule */}
          <line
            x1={centerX}
            y1={axisRuleTop}
            x2={centerX}
            y2={axisRuleTop + axisRuleHeight}
            stroke={axisColor}
            strokeWidth={1.5}
            opacity={axisOpacity * 0.7}
          />

          {/* Axis endpoint labels */}
          {data.negativeLabel && (
            <text
              x={area.left}
              y={axisLabelY}
              textAnchor="start"
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.caption,
                fontWeight: 500,
                fill: axisLabelColor,
                opacity: axisLabelOpacity,
              }}
            >
              ◄ {data.negativeLabel}
            </text>
          )}
          {data.zeroLabel && (
            <text
              x={centerX}
              y={axisLabelY}
              textAnchor="middle"
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.caption,
                fontWeight: 400,
                fill: valueLabelColor,
                opacity: axisLabelOpacity,
              }}
            >
              {data.zeroLabel}
            </text>
          )}
          {data.positiveLabel && (
            <text
              x={area.left + area.width}
              y={axisLabelY}
              textAnchor="end"
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.caption,
                fontWeight: 500,
                fill: axisLabelColor,
                opacity: axisLabelOpacity,
              }}
            >
              {data.positiveLabel} ►
            </text>
          )}

          {/* Axis description label */}
          {data.axisLabel && (
            <text
              x={centerX}
              y={axisDescY}
              textAnchor="middle"
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.meta,
                fontWeight: 400,
                fill: valueLabelColor,
                opacity: axisLabelOpacity * 0.7,
              }}
            >
              {data.axisLabel}
            </text>
          )}

          {/* Bar rows */}
          {sortedItems.map((item, index) => {
            const barY = barsTopOffset + index * (barHeight + BAR_GAP);
            return (
              <DivergingBarRow
                key={`${item.label}-${index}`}
                item={item}
                index={index}
                frame={frame}
                centerX={centerX}
                barY={barY}
                barHeight={barHeight}
                maxHalfWidth={maxHalfWidth}
                maxAbsValue={maxAbsValue}
                positiveColor={positiveColor}
                negativeColor={negativeColor}
                colorMode={colorMode}
                showValues={showValues}
                textColor={textColor}
                valueLabelColor={valueLabelColor}
              />
            );
          })}
        </svg>

        {/* Source attribution */}
        <SourceAttribution
          source={data.source}
          mode={mode}
          startSec={(data.durationSec ?? 12) - 3}
          prefix="Source: "
        />
        <FooterStrip mode={mode} />
      </AbsoluteFill>
    </Background>
  );
};
