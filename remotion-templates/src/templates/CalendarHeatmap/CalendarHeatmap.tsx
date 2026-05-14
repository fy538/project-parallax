/**
 * CalendarHeatmap — year-as-grid daily intensity heatmap.
 *
 * 7 rows (days of week) × ~53 columns (ISO-style weeks). Each cell is
 * a small rounded rect colored by its value via the configured ramp.
 * Month dividers + small-caps month labels run along the top edge;
 * Mon/Wed/Fri labels run down the left side; an optional low→high
 * color-ramp legend lives bottom-right.
 *
 * Animation:
 *   1. Title block (handled by TitleBlock)
 *   2. Month labels + weekday labels fade in (structure layer)
 *   3. Cells reveal in a left-to-right column sweep — each week's 7
 *      cells appear together with a slight per-row stagger
 *   4. Highlight rings + leader-line labels fade in last
 *   5. Ken Burns drift + exit fade (via useCompositionAnimation)
 *
 * Date math: all dates are parsed as UTC midnight so timezone drift
 * doesn't shift cells by a day for renders in different locales /
 * Lambda regions. The column of a date is its "day-of-year offset from
 * the first cell of the grid," divided by 7. The first cell is the
 * Sunday (or Monday, if weekStart="monday") on or before Jan 1.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  palette,
  semantic,
  fonts,
  fontSizes,
  letterSpacing,
  layout,
  contentArea,
  timing,
} from "../../design/theme";
import { fadeIn, exitFade } from "../../utils/animation";
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
import { warnIf, checkChartDataCommon } from "../../utils/dataWarnings";
import type {
  CalendarHeatmapData,
  CalendarDay,
  CalendarColorScale,
} from "./types";

// ── Date helpers ────────────────────────────────────────────────────────
// All date math is in UTC. Date string format is ISO YYYY-MM-DD.

const MS_PER_DAY = 86_400_000;

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Parse "YYYY-MM-DD" as UTC midnight. Returns NaN-bearing Date if malformed. */
const parseISODate = (iso: string): Date => {
  const parts = iso.split("-");
  if (parts.length !== 3) return new Date(NaN);
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  return new Date(Date.UTC(y, m - 1, d));
};

/** Returns the grid column (0..~52) and row (0..6) for a given ISO date. */
const dateToGridPosition = (
  iso: string,
  weekStart: "sunday" | "monday",
  year: number,
): { row: number; col: number } | null => {
  const date = parseISODate(iso);
  if (isNaN(date.getTime())) return null;
  if (date.getUTCFullYear() !== year) return null;

  // Anchor: the Sunday (or Monday) on/before Jan 1 of the year. This is
  // the cell at column 0, row 0.
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const jan1Dow = jan1.getUTCDay(); // 0=Sun..6=Sat
  // Offset from anchor to Jan 1 in days.
  const anchorOffset = weekStart === "sunday" ? jan1Dow : (jan1Dow + 6) % 7;
  const anchor = new Date(jan1.getTime() - anchorOffset * MS_PER_DAY);

  const diffDays = Math.floor((date.getTime() - anchor.getTime()) / MS_PER_DAY);
  if (diffDays < 0) return null;

  // Row is just `diffDays % 7` regardless of weekStart, because the
  // anchor itself shifts: sunday-start anchors on a Sunday (row 0=Sun);
  // monday-start anchors on a Monday (row 0=Mon).
  const col = Math.floor(diffDays / 7);
  const row = diffDays % 7;
  return { row, col };
};

/** Total grid column count for the given year + weekStart. */
const gridColumnCount = (year: number, weekStart: "sunday" | "monday"): number => {
  // Last day of year → its column + 1.
  const dec31Iso = `${year}-12-31`;
  const pos = dateToGridPosition(dec31Iso, weekStart, year);
  return (pos?.col ?? 52) + 1;
};

// ── Color scale helpers ─────────────────────────────────────────────────

/** Linearly interpolate between two hex (#RRGGBB) colors at progress t. */
const lerpHex = (a: string, b: string, t: number): string => {
  const parse = (h: string) => {
    const s = h.startsWith("#") ? h.slice(1) : h;
    return [
      parseInt(s.slice(0, 2), 16),
      parseInt(s.slice(2, 4), 16),
      parseInt(s.slice(4, 6), 16),
    ];
  };
  const [ar, ag, ab] = parse(a);
  const [br, bg, bb] = parse(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
};

/** Returns the fill color for a cell value under the configured scale. */
const cellColor = (
  value: number,
  scale: CalendarColorScale,
  maxAbs: number,
  bgBase: string,
): string => {
  if (maxAbs <= 0) return bgBase;
  if (scale === "diverging") {
    const t = Math.max(-1, Math.min(1, value / maxAbs));
    if (t === 0) return bgBase;
    if (t < 0) return lerpHex(bgBase, semantic.china, Math.min(1, -t));
    return lerpHex(bgBase, semantic.us, Math.min(1, t));
  }
  const t = Math.max(0, Math.min(1, value / maxAbs));
  if (t === 0) return bgBase;
  if (scale === "sequential") {
    return lerpHex(bgBase, palette.oxblood, t);
  }
  // intensity (default)
  return lerpHex(palette.bone, palette.amber, t);
};

// ── Component ───────────────────────────────────────────────────────────

export const CalendarHeatmap: React.FC<{ data: CalendarHeatmapData }> = ({
  data,
}) => {
  checkChartDataCommon("CalendarHeatmap", data);
  warnIf(
    data.days.length === 0,
    "CalendarHeatmap",
    "Empty days array — grid will render with all placeholder cells.",
  );
  warnIf(
    (data.highlights?.length ?? 0) > 5,
    "CalendarHeatmap",
    `${data.highlights?.length} highlights — more than ~3 callouts clutter ` +
      `the year grid. Keep highlights to the 2–3 editorial-key events.`,
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const direction = useDirection(data._direction);
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);
  const accent = palette.amber;

  const weekStart: "sunday" | "monday" = data.weekStart ?? "sunday";
  const colorScale: CalendarColorScale = data.colorScale ?? "intensity";

  // Layout — bounded content rect from theme.
  const area = useMemo(() => contentArea("content", "generous"), []);

  // Grid geometry.
  const totalCols = useMemo(
    () => gridColumnCount(data.year, weekStart),
    [data.year, weekStart],
  );

  // Reserve fixed gutter on the left for weekday labels and a bottom
  // strip for the legend. The grid itself fills the remainder while
  // staying square-celled (cellSize is the binding constraint).
  const leftGutter = 56;
  const topLabelHeight = 28;
  const bottomLegendHeight = 56;

  const cellGap = 3;
  const gridLeft = area.left + leftGutter;
  const gridTopMin = area.top + topLabelHeight;
  const gridAvailWidth = area.width - leftGutter;
  const gridAvailHeight = area.height - topLabelHeight - bottomLegendHeight;

  // Cell size: pick the largest square cell that fits horizontally AND
  // vertically. At 1920×1080 with a 53-column year grid, width is
  // virtually always the binding constraint (~27px max cells); the cap
  // is intentionally generous so a future 16:9 canvas wider than 1920
  // could grow cells further without code changes.
  const cellSize = useMemo(() => {
    const byWidth = (gridAvailWidth - cellGap * (totalCols - 1)) / totalCols;
    const byHeight = (gridAvailHeight - cellGap * 6) / 7;
    const raw = Math.floor(Math.min(byWidth, byHeight));
    return Math.max(14, Math.min(40, raw));
  }, [gridAvailWidth, gridAvailHeight, totalCols]);

  const gridWidth = totalCols * cellSize + (totalCols - 1) * cellGap;
  const gridHeight = 7 * cellSize + 6 * cellGap;

  // Center the grid horizontally within its track if the cell-size cap
  // left slack.
  const gridXOffset = Math.max(0, Math.floor((gridAvailWidth - gridWidth) / 2));
  const gridX = gridLeft + gridXOffset;

  // Center the grid VERTICALLY within its track. Since cell size is
  // width-bound on a wide canvas (square cells × 53 columns), the grid
  // never fills the full available height — without this offset it
  // sticks to the top edge and leaves a tall empty band beneath. The
  // legend rides along below the grid so it follows the centering.
  const gridYOffset = Math.max(0, Math.floor((gridAvailHeight - gridHeight) / 2));
  const gridTop = gridTopMin + gridYOffset;

  // Build a lookup map: ISO date → value.
  const valueByDate = useMemo(() => {
    const m = new Map<string, number>();
    data.days.forEach((d: CalendarDay) => {
      m.set(d.date, d.value);
    });
    return m;
  }, [data.days]);

  // Max absolute value for the ramp.
  const maxAbs = useMemo(() => {
    if (data.maxValue && data.maxValue > 0) return data.maxValue;
    let m = 0;
    data.days.forEach((d) => {
      const av = Math.abs(d.value);
      if (av > m) m = av;
    });
    return m > 0 ? m : 1;
  }, [data.days, data.maxValue]);

  // Month divider columns: for each month, the column of its 1st day.
  const monthMarkers = useMemo(() => {
    const markers: { month: number; col: number }[] = [];
    for (let m = 0; m < 12; m++) {
      const iso = `${data.year}-${String(m + 1).padStart(2, "0")}-01`;
      const pos = dateToGridPosition(iso, weekStart, data.year);
      if (pos) markers.push({ month: m, col: pos.col });
    }
    return markers;
  }, [data.year, weekStart]);

  // ── Timing ────────────────────────────────────────────────────────────
  const structureStart = timing.entrance.crisp; // ~0.4s
  const cellsStart = structureStart + timing.entrance.medium; // ~0.9s
  // Each column reveals over `colReveal` frames; total sweep ~3.5s.
  const sweepDurationFrames = Math.max(60, Math.min(120, totalCols * 1.8));
  const cellRevealDuration = timing.entrance.crisp; // per-cell fade-in
  const rowStagger = 1; // tight per-row stagger inside a single column
  const highlightStart =
    cellsStart + sweepDurationFrames + timing.entrance.fast;
  const exitOp = exitFade(frame, durationInFrames, 15);

  // Per-column reveal start.
  const colStart = (col: number) =>
    cellsStart + (col / Math.max(1, totalCols - 1)) * sweepDurationFrames;

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint ?? data.backgroundTint}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        <HeaderStrip mode={bgVariant} metadata={data.episode} />
        <FooterStrip mode={bgVariant} />

        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={bgVariant}
            safeAreaTier="generous"
            syncPoints={direction.syncPoints}
          />
        </div>

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
          {/* ── Month labels along the top ─────────────────────────────
              Small-caps mono stamps at the column of each month's 1st.
              Faint vertical divider drops from the label into the grid
              to anchor the eye when scanning a date column. */}
          {monthMarkers.map((m, i) => {
            const x = gridX + m.col * (cellSize + cellGap);
            const op =
              fadeIn(frame, structureStart, timing.entrance.medium) * exitOp;
            return (
              <g key={`month-${m.month}`} opacity={op}>
                <text
                  x={x}
                  y={gridTop - 10}
                  textAnchor="start"
                  fill={theme.text.muted}
                  fontSize={fontSizes.meta}
                  fontFamily={fonts.mono}
                  fontWeight={400}
                  letterSpacing={letterSpacing.meta}
                  style={{ textTransform: "uppercase" }}
                >
                  {MONTH_LABELS[m.month]}
                </text>
                {/* Light divider from label into grid (skip Jan to avoid
                    cluttering the left edge). */}
                {i > 0 && (
                  <line
                    x1={x - cellGap / 2 - 0.5}
                    y1={gridTop - 4}
                    x2={x - cellGap / 2 - 0.5}
                    y2={gridTop + gridHeight}
                    stroke={theme.text.muted}
                    strokeWidth={0.5}
                    opacity={0.18}
                  />
                )}
              </g>
            );
          })}

          {/* ── Weekday labels (Mon / Wed / Fri only) ──────────────────
              Three labels is the editorial standard — every-day labels
              clutter the gutter. */}
          {[1, 3, 5].map((dayIdx) => {
            // For monday-start, the row index for Mon/Wed/Fri is dayIdx-1.
            const row = weekStart === "sunday" ? dayIdx : dayIdx - 1;
            if (row < 0 || row > 6) return null;
            const y = gridTop + row * (cellSize + cellGap) + cellSize / 2 + 4;
            const op =
              fadeIn(frame, structureStart, timing.entrance.medium) * exitOp;
            const label =
              weekStart === "sunday"
                ? WEEKDAY_LABELS[dayIdx]
                : WEEKDAY_LABELS[dayIdx === 0 ? 6 : dayIdx];
            return (
              <text
                key={`wd-${dayIdx}`}
                x={gridX - 10}
                y={y}
                textAnchor="end"
                fill={theme.text.muted}
                fontSize={fontSizes.meta}
                fontFamily={fonts.mono}
                fontWeight={400}
                letterSpacing={letterSpacing.meta}
                opacity={op}
                style={{ textTransform: "uppercase" }}
              >
                {label}
              </text>
            );
          })}

          {/* ── Cells ──────────────────────────────────────────────────
              Iterate every (col, row) in the grid. A cell maps back to
              a date via the same anchor used in dateToGridPosition; cells
              outside the target year are skipped (the corners of the
              grid that fall in adjacent years).

              Reveal: per-column sweep + 1-frame per-row stagger inside
              the column. Cells with no value render as faint placeholders
              at ~6% opacity of muted text color. */}
          {(() => {
            const cells: React.ReactNode[] = [];
            // Compute anchor once.
            const jan1 = new Date(Date.UTC(data.year, 0, 1));
            const jan1Dow = jan1.getUTCDay();
            const anchorOffset =
              weekStart === "sunday" ? jan1Dow : (jan1Dow + 6) % 7;
            const anchor = new Date(
              jan1.getTime() - anchorOffset * MS_PER_DAY,
            );

            for (let col = 0; col < totalCols; col++) {
              for (let row = 0; row < 7; row++) {
                const dayOffset = col * 7 + row;
                const cellDate = new Date(
                  anchor.getTime() + dayOffset * MS_PER_DAY,
                );
                if (cellDate.getUTCFullYear() !== data.year) continue;

                const iso = `${cellDate.getUTCFullYear()}-${String(
                  cellDate.getUTCMonth() + 1,
                ).padStart(2, "0")}-${String(cellDate.getUTCDate()).padStart(
                  2,
                  "0",
                )}`;

                const x = gridX + col * (cellSize + cellGap);
                const y = gridTop + row * (cellSize + cellGap);

                const value = valueByDate.get(iso);
                const start = colStart(col) + row * rowStagger;
                const op =
                  fadeIn(frame, start, cellRevealDuration) * exitOp;

                if (value === undefined) {
                  // Faint placeholder cell.
                  cells.push(
                    <rect
                      key={iso}
                      x={x}
                      y={y}
                      width={cellSize}
                      height={cellSize}
                      rx={2}
                      ry={2}
                      fill={theme.text.muted}
                      opacity={0.06 * op}
                    />,
                  );
                  continue;
                }

                const fill = cellColor(
                  value,
                  colorScale,
                  maxAbs,
                  theme.bg.base,
                );
                cells.push(
                  <rect
                    key={iso}
                    x={x}
                    y={y}
                    width={cellSize}
                    height={cellSize}
                    rx={2}
                    ry={2}
                    fill={fill}
                    opacity={op}
                  />,
                );
              }
            }
            return cells;
          })()}

          {/* ── Highlights ────────────────────────────────────────────
              Amber ring around the cell + leader line + caption. Fades
              in after the sweep completes. */}
          {(data.highlights ?? []).map((h, i) => {
            const pos = dateToGridPosition(h.date, weekStart, data.year);
            if (!pos) return null;
            const cx =
              gridX + pos.col * (cellSize + cellGap) + cellSize / 2;
            const cy =
              gridTop + pos.row * (cellSize + cellGap) + cellSize / 2;
            const ringR = cellSize * 0.85;

            const op =
              fadeIn(
                frame,
                highlightStart + i * timing.stagger.normal,
                timing.entrance.medium,
              ) * exitOp;

            // Leader line: goes down to a strip beneath the grid, then
            // bends horizontally to a label position. Alternates above /
            // below depending on row, for clarity.
            const goBelow = pos.row <= 3;
            const labelY = goBelow
              ? gridTop + gridHeight + 22
              : gridTop - 28;
            const elbowY = goBelow
              ? gridTop + gridHeight + 8
              : gridTop - 14;
            const labelOffset = 60; // horizontal offset of caption end
            // Pin caption inside the grid horizontal extent.
            const rawLabelX = cx + labelOffset;
            const labelX = Math.min(
              gridX + gridWidth - 4,
              Math.max(gridX + 4, rawLabelX),
            );

            return (
              <g key={`hl-${h.date}`} opacity={op}>
                {/* Ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={ringR}
                  fill="none"
                  stroke={accent}
                  strokeWidth={1.5}
                  opacity={0.9}
                />
                {/* Leader line */}
                <path
                  d={`M ${cx} ${cy + (goBelow ? ringR : -ringR)} L ${cx} ${elbowY} L ${labelX} ${elbowY}`}
                  fill="none"
                  stroke={accent}
                  strokeWidth={0.8}
                  opacity={0.7}
                />
                {/* Caption */}
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="end"
                  fill={theme.text.primary}
                  fontSize={fontSizes.caption}
                  fontFamily={fonts.mono}
                  fontWeight={500}
                  letterSpacing={letterSpacing.caption}
                >
                  {h.label}
                </text>
              </g>
            );
          })}

          {/* ── Legend ────────────────────────────────────────────────
              Bottom-right horizontal color ramp with low/high labels and
              an optional valueLabel kicker above.

              Two branches:
                - `diverging`: SYMMETRIC ramp −maxAbs → 0 → +maxAbs with
                  9 swatches, three labels (low / zero / high), and a
                  small center tick mark to anchor the neutral axis.
                - `sequential` / `intensity`: one-sided 5-swatch ramp
                  0 → maxAbs (original behavior). */}
          {(() => {
            const legendOp =
              fadeIn(frame, structureStart, timing.entrance.medium) * exitOp;
            const isDiverging = colorScale === "diverging";
            const swatchCount = isDiverging ? 9 : 5;
            const swatchW = isDiverging ? 22 : 22;
            const swatchH = 12;
            const swatchGap = isDiverging ? 2 : 3;
            const totalSwatchWidth =
              swatchCount * swatchW + (swatchCount - 1) * swatchGap;
            const legendRight = gridX + gridWidth;
            const legendY = gridTop + gridHeight + 22;
            const legendX = legendRight - totalSwatchWidth;
            const lowLabel = data.legendLabels?.low ?? "Less";
            const highLabel = data.legendLabels?.high ?? "More";
            const zeroLabel = data.legendLabels?.zero ?? "0";

            return (
              <g opacity={legendOp}>
                {data.valueLabel && (
                  <text
                    x={legendRight}
                    y={legendY - 12}
                    textAnchor="end"
                    fill={theme.text.muted}
                    fontSize={fontSizes.meta}
                    fontFamily={fonts.mono}
                    fontWeight={400}
                    letterSpacing={letterSpacing.meta}
                    style={{ textTransform: "uppercase" }}
                  >
                    {data.valueLabel}
                  </text>
                )}
                {/* Low label */}
                <text
                  x={legendX - 8}
                  y={legendY + swatchH - 2}
                  textAnchor="end"
                  fill={theme.text.muted}
                  fontSize={fontSizes.meta}
                  fontFamily={fonts.mono}
                  fontWeight={400}
                  letterSpacing={letterSpacing.meta}
                  style={{ textTransform: "uppercase" }}
                >
                  {lowLabel}
                </text>
                {/* Swatches.
                    Diverging: −maxAbs → 0 → +maxAbs across 9 stops; the
                    middle swatch (index 4) samples value=0 and renders
                    as bg.base, providing the neutral anchor.
                    Sequential / intensity: 0 → maxAbs across 5 stops. */}
                {Array.from({ length: swatchCount }).map((_, i) => {
                  const t = i / (swatchCount - 1);
                  const sampleValue = isDiverging
                    ? (t * 2 - 1) * maxAbs
                    : t * maxAbs;
                  const fill = cellColor(
                    sampleValue,
                    colorScale,
                    maxAbs,
                    theme.bg.base,
                  );
                  return (
                    <rect
                      key={`sw-${i}`}
                      x={legendX + i * (swatchW + swatchGap)}
                      y={legendY}
                      width={swatchW}
                      height={swatchH}
                      rx={2}
                      ry={2}
                      fill={fill}
                      stroke={theme.text.muted}
                      strokeWidth={0.3}
                      strokeOpacity={0.3}
                    />
                  );
                })}
                {/* Diverging-only: zero label + center tick. The middle
                    swatch index is (swatchCount-1)/2 = 4 for a 9-swatch
                    ramp; we anchor the label and tick to that swatch's
                    horizontal center. */}
                {isDiverging && (() => {
                  const midIdx = (swatchCount - 1) / 2;
                  const midCx =
                    legendX + midIdx * (swatchW + swatchGap) + swatchW / 2;
                  return (
                    <g key="legend-zero">
                      <line
                        x1={midCx}
                        y1={legendY - 3}
                        x2={midCx}
                        y2={legendY}
                        stroke={theme.text.muted}
                        strokeWidth={0.8}
                        opacity={0.5}
                      />
                      <line
                        x1={midCx}
                        y1={legendY + swatchH}
                        x2={midCx}
                        y2={legendY + swatchH + 3}
                        stroke={theme.text.muted}
                        strokeWidth={0.8}
                        opacity={0.5}
                      />
                      <text
                        x={midCx}
                        y={legendY + swatchH + 14}
                        textAnchor="middle"
                        fill={theme.text.muted}
                        fontSize={fontSizes.meta}
                        fontFamily={fonts.mono}
                        fontWeight={400}
                        letterSpacing={letterSpacing.meta}
                        style={{ textTransform: "uppercase" }}
                      >
                        {zeroLabel}
                      </text>
                    </g>
                  );
                })()}
                {/* High label */}
                <text
                  x={legendRight + 8}
                  y={legendY + swatchH - 2}
                  textAnchor="start"
                  fill={theme.text.muted}
                  fontSize={fontSizes.meta}
                  fontFamily={fonts.mono}
                  fontWeight={400}
                  letterSpacing={letterSpacing.meta}
                  style={{ textTransform: "uppercase" }}
                >
                  {highLabel}
                </text>
              </g>
            );
          })()}
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

