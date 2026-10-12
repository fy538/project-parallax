/**
 * MatrixHeatmap — N×M analytical comparison grid.
 *
 * Row labels on the left, column headers on top, cells filled by value
 * intensity. The canonical form for "how does country X score on dimension Y?"
 * editorial arguments — alliance matrices, policy adoption grids,
 * capability breakdowns.
 *
 * Animation sequence:
 *   1. TitleBlock fades in (frame 0)
 *   2. Column headers stagger left-to-right (sec 0.3)
 *   3. Row labels stagger top-to-bottom (sec 0.5)
 *   4. Cells ripple in diagonal wave top-left → bottom-right (sec 0.8)
 *      Each cell startFrame = sec(0.8) + (row + col) * sec(0.06)
 *   5. Source attribution fades in (sec 1.8)
 *   6. Ken Burns drift + exit fade (useCompositionAnimation)
 *
 * Color encoding:
 *   sequential: colorLow → colorHigh via Remotion interpolateColors
 *   diverging:  colorLow → colorMid → colorHigh (two linear segments)
 *
 * Cell text contrast: automatic luminance check (dark text on light cells,
 * light text on dark cells) via hexToLuminance from colorContrast utils.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolateColors,
} from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  fontWeights,
  letterSpacing,
  layout,
  sec,
  timing,
  radii,
} from "../../design/theme";
import { fadeIn, exitFade, CLAMP_CUBIC } from "../../utils/animation";
import { hexToLuminance } from "../../utils/colorContrast";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { SourceAttribution } from "../../components/SourceAttribution";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { useDirection } from "../../hooks/useDirection";
import { useThemeMode } from "../../hooks/useThemeMode";
import { warnIf } from "../../utils/dataWarnings";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import type { MatrixHeatmapData, MatrixCell } from "./types";

// ── Layout constants ────────────────────────────────────────────────────────

const SAFE = layout.safeAreaTier.generous;

// Height reserved for TitleBlock (h2 + optional subtitle)
const TITLE_BLOCK_H = 160;
// Gap between TitleBlock bottom and grid area
const TITLE_GAP = layout.spacing.lg;
// Left column for row labels
const ROW_LABEL_W = 200;
// Top row for column headers
const COL_HEADER_H = 80;
// Minimum cell size (px) — enforced for readability
const MIN_CELL_SIZE = 32;
// Cell inner padding (px) — keeps text away from border
const CELL_PADDING = 4;

// ── Value formatting ────────────────────────────────────────────────────────

function formatCellValue(
  value: number,
  format: "number" | "percent" | "currency",
): string {
  switch (format) {
    case "percent":
      return `${value}%`;
    case "currency":
      return `$${value}B`;
    case "number":
    default:
      return value.toLocaleString();
  }
}

// ── Color interpolation ─────────────────────────────────────────────────────

/**
 * Returns the fill color for a cell given its normalized value in [0,1].
 * For diverging scales, the normalized value is mapped to the full
 * [colorLow, colorMid, colorHigh] ramp.
 */
function cellFill(
  normalizedValue: number,
  colorScale: "sequential" | "diverging",
  colorLow: string,
  colorHigh: string,
  colorMid: string,
): string {
  const t = Math.max(0, Math.min(1, normalizedValue));

  if (colorScale === "diverging") {
    // Two-segment: [0, 0.5] → colorLow→colorMid, [0.5, 1] → colorMid→colorHigh
    if (t <= 0.5) {
      const t2 = t * 2;
      return interpolateColors(t2, [0, 1], [colorLow, colorMid]);
    } else {
      const t2 = (t - 0.5) * 2;
      return interpolateColors(t2, [0, 1], [colorMid, colorHigh]);
    }
  }

  // Sequential: colorLow → colorHigh
  return interpolateColors(t, [0, 1], [colorLow, colorHigh]);
}

/**
 * Returns readable text color (black or white) for a given background fill.
 * Uses Rec. 709 luminance; threshold 0.35 chosen to keep text legible on
 * mid-range fills without excessive contrast whiplash.
 */
function textColorForFill(fill: string): string {
  const lum = hexToLuminance(fill);
  return lum > 0.35 ? palette.ink : palette.bone;
}

// ── Component ───────────────────────────────────────────────────────────────

export const MatrixHeatmap: React.FC<{ data: MatrixHeatmapData }> = ({
  data,
}) => {
  // ── Warnings ────────────────────────────────────────────────────────────
  warnIf(
    data.rows.length > 12 || data.columns.length > 12,
    "MatrixHeatmap",
    `Matrix is ${data.rows.length}×${data.columns.length}. Max readable at 1920×1080 is 12×12; ` +
      "consider fewer entities or a smaller comparison.",
  );
  warnIf(
    data.cells.length === 0,
    "MatrixHeatmap",
    "No cells provided — grid will render empty.",
  );

  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // ── Hooks ────────────────────────────────────────────────────────────────
  const direction = useDirection(data._direction, "none");
  const { style: compStyle } = useCompositionAnimation(direction.driftOptions);
  const bgVariant = data.backgroundVariant ?? "light";
  const theme = useThemeMode(bgVariant);

  // ── Color defaults ────────────────────────────────────────────────────────
  const colorScale = data.colorScale ?? "sequential";
  const colorLow = data.colorLow ?? palette.midnight;
  const colorHigh = data.colorHigh ?? (colorScale === "sequential" ? palette.dustblue : palette.dustblue);
  const colorMid = data.colorMid ?? palette.walnut;
  const showValues = data.showValues !== false; // default true
  const valueFormat = data.valueFormat ?? "number";

  // ── Cell lookup ───────────────────────────────────────────────────────────
  const cellMap = useMemo(() => {
    const m = new Map<string, MatrixCell>();
    data.cells.forEach((c) => {
      m.set(`${c.row}::${c.col}`, c);
    });
    return m;
  }, [data.cells]);

  // ── Min/max for normalization ─────────────────────────────────────────────
  const { minVal, maxVal } = useMemo(() => {
    if (data.cells.length === 0) return { minVal: 0, maxVal: 1 };
    let lo = Infinity;
    let hi = -Infinity;
    data.cells.forEach((c) => {
      if (c.value < lo) lo = c.value;
      if (c.value > hi) hi = c.value;
    });
    return { minVal: lo, maxVal: hi };
  }, [data.cells]);

  const valueRange = maxVal - minVal;

  function normalize(value: number): number {
    if (valueRange <= 0) return 0.5;
    return (value - minVal) / valueRange;
  }

  // ── Layout geometry ───────────────────────────────────────────────────────
  const contentLeft = SAFE.left;
  const contentTop = SAFE.top;
  const contentW = layout.width - SAFE.left - SAFE.right;
  const contentH = layout.height - SAFE.top - SAFE.bottom;

  // Grid starts below the title block
  const gridAreaTop = contentTop + TITLE_BLOCK_H + TITLE_GAP;
  const gridAreaH = contentH - TITLE_BLOCK_H - TITLE_GAP;

  // Grid body (cells only) — after row labels and column headers
  const gridBodyLeft = contentLeft + ROW_LABEL_W;
  const gridBodyTop = gridAreaTop + COL_HEADER_H;
  const gridBodyW = contentW - ROW_LABEL_W;
  const gridBodyH = gridAreaH - COL_HEADER_H;

  const nRows = data.rows.length;
  const nCols = data.columns.length;

  const rawCellW = gridBodyW / nCols;
  const rawCellH = gridBodyH / nRows;
  const cellW = Math.max(MIN_CELL_SIZE, rawCellW);
  const cellH = Math.max(MIN_CELL_SIZE, rawCellH);

  // ── Exit opacity ─────────────────────────────────────────────────────────
  const exitOp = exitFade(frame, durationInFrames, 15);

  // ── Animation timing ─────────────────────────────────────────────────────
  // Frame boundaries (in frames at 30fps)
  const colHeaderStart = sec(0.3);
  const rowLabelStart = sec(0.5);
  const cellsStart = sec(0.8);
  const cellDiagonalStep = sec(0.06); // per (row+col) diagonal index
  const cellFadeDuration = timing.entrance.medium; // 15 frames

  return (
    <Background
      variant={resolveAnalyticalBackgroundVariant(
        analyticalBackgroundBase(data.backgroundVariant),
        transparentBackdropRequested(data),
      )}
      tint={direction.backgroundTint ?? undefined}
      atmosphere={direction.atmosphere}
      atmosphereIntensity={direction.atmosphereIntensity}
    >
      <AbsoluteFill style={compStyle}>
        <HeaderStrip mode={bgVariant} metadata={data.episode} />
        <FooterStrip mode={bgVariant} />

        {/* ── Title block ──────────────────────────────────────────── */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={bgVariant}
            safeAreaTier="generous"
            syncPoints={direction.syncPoints}
          />
        </div>

        {/* ── Column headers ────────────────────────────────────────── */}
        {data.columns.map((col, ci) => {
          const x = gridBodyLeft + ci * cellW;
          const y = gridAreaTop;
          const op =
            fadeIn(
              frame,
              colHeaderStart + ci * timing.stagger.tight,
              timing.entrance.crisp,
            ) * exitOp;
          const isHighlit = data.highlightCol === col.id;

          return (
            <div
              key={`col-${col.id}`}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: cellW,
                height: COL_HEADER_H,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
                paddingBottom: layout.spacing.xs,
                opacity: op,
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontFamily: fonts.mono,
                  fontSize: fontSizes.meta,
                  fontWeight: isHighlit ? fontWeights.semibold : fontWeights.regular,
                  letterSpacing: letterSpacing.meta,
                  color: isHighlit ? palette.gold : theme.text.muted,
                  textTransform: "uppercase",
                  textAlign: "center",
                  lineHeight: 1.2,
                  maxWidth: cellW - CELL_PADDING * 2,
                  wordBreak: "break-word",
                }}
              >
                {col.label}
              </span>
              {col.sublabel && (
                <span
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: fontSizes.meta - 1,
                    fontWeight: fontWeights.regular,
                    color: theme.text.muted,
                    textAlign: "center",
                    opacity: 0.7,
                  }}
                >
                  {col.sublabel}
                </span>
              )}
              {/* Gold underline for highlighted column */}
              {isHighlit && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: CELL_PADDING,
                    right: CELL_PADDING,
                    height: 2,
                    background: palette.gold,
                    borderRadius: radii.pill,
                  }}
                />
              )}
            </div>
          );
        })}

        {/* ── Row labels ────────────────────────────────────────────── */}
        {data.rows.map((row, ri) => {
          const x = contentLeft;
          const y = gridBodyTop + ri * cellH;
          const op =
            fadeIn(
              frame,
              rowLabelStart + ri * timing.stagger.tight,
              timing.entrance.crisp,
            ) * exitOp;
          const isHighlit = data.highlightRow === row.id;

          return (
            <div
              key={`row-${row.id}`}
              style={{
                position: "absolute",
                left: x,
                top: y,
                width: ROW_LABEL_W - layout.spacing.sm,
                height: cellH,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingRight: layout.spacing.sm,
                opacity: op,
                pointerEvents: "none",
              }}
            >
              <span
                style={{
                  fontFamily: fonts.body,
                  fontSize: fontSizes.caption,
                  fontWeight: isHighlit ? fontWeights.semibold : fontWeights.regular,
                  letterSpacing: letterSpacing.caption,
                  color: isHighlit ? palette.gold : theme.text.primary,
                  textAlign: "right",
                  lineHeight: 1.2,
                }}
              >
                {row.label}
              </span>
              {row.sublabel && (
                <span
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: fontSizes.meta,
                    fontWeight: fontWeights.regular,
                    color: theme.text.muted,
                    textAlign: "right",
                  }}
                >
                  {row.sublabel}
                </span>
              )}
            </div>
          );
        })}

        {/* ── Grid cells ────────────────────────────────────────────── */}
        {data.rows.map((row, ri) =>
          data.columns.map((col, ci) => {
            const cell = cellMap.get(`${row.id}::${col.id}`);
            const x = gridBodyLeft + ci * cellW;
            const y = gridBodyTop + ri * cellH;

            // Diagonal ripple: top-left → bottom-right
            const diagonalIndex = ri + ci;
            const startFrame = cellsStart + diagonalIndex * cellDiagonalStep;
            const op =
              fadeIn(frame, startFrame, cellFadeDuration) * exitOp;

            // Highlight borders from row/col accent or cell.highlight
            const rowHighlit = data.highlightRow === row.id;
            const colHighlit = data.highlightCol === col.id;
            const cellHighlit = cell?.highlight === true;
            const isAccented = rowHighlit || colHighlit || cellHighlit;

            // Compute fill color
            const normalized = cell ? normalize(cell.value) : 0;
            const fill = cell
              ? cellFill(normalized, colorScale, colorLow, colorHigh, colorMid)
              : (bgVariant === "dark" ? palette.midnight : palette.sand);

            const fillOpacity = cell ? 1 : 0.15;
            const textColor = cell ? textColorForFill(fill) : theme.text.muted;

            // Display text: cell.label overrides value text
            const displayText = cell?.label ?? (cell && showValues
              ? formatCellValue(cell.value, valueFormat)
              : null);

            return (
              <div
                key={`cell-${row.id}-${col.id}`}
                style={{
                  position: "absolute",
                  left: x + 1,
                  top: y + 1,
                  width: cellW - 2,
                  height: cellH - 2,
                  background: fill,
                  opacity: op * fillOpacity,
                  borderRadius: radii.xs,
                  border: isAccented
                    ? `2px solid ${palette.gold}`
                    : `1px solid ${bgVariant === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                  boxSizing: "border-box",
                  overflow: "hidden",
                }}
              >
                {displayText && (
                  <span
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: Math.min(fontSizes.caption, cellH * 0.35),
                      fontWeight: fontWeights.semibold,
                      color: textColor,
                      letterSpacing: letterSpacing.caption,
                      lineHeight: 1,
                      fontFeatureSettings: '"tnum" 1',
                      textAlign: "center",
                      padding: `0 ${CELL_PADDING}px`,
                    }}
                  >
                    {displayText}
                  </span>
                )}
                {cell?.annotation && (
                  <span
                    style={{
                      fontFamily: fonts.mono,
                      fontSize: Math.min(fontSizes.meta, cellH * 0.22),
                      fontWeight: fontWeights.regular,
                      color: textColor,
                      opacity: 0.75,
                      letterSpacing: letterSpacing.meta,
                      lineHeight: 1,
                      textAlign: "center",
                      marginTop: 2,
                      padding: `0 ${CELL_PADDING}px`,
                    }}
                  >
                    {cell.annotation}
                  </span>
                )}
              </div>
            );
          }),
        )}

        {/* ── Color scale legend ────────────────────────────────────── */}
        <ColorScaleLegend
          frame={frame}
          exitOp={exitOp}
          colorScale={colorScale}
          colorLow={colorLow}
          colorHigh={colorHigh}
          colorMid={colorMid}
          minVal={minVal}
          maxVal={maxVal}
          valueFormat={valueFormat}
          theme={theme}
          gridBodyLeft={gridBodyLeft}
          gridBodyW={gridBodyW}
          gridBodyTop={gridBodyTop + nRows * cellH}
        />

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

// ── Legend sub-component ────────────────────────────────────────────────────

interface LegendProps {
  frame: number;
  exitOp: number;
  colorScale: "sequential" | "diverging";
  colorLow: string;
  colorHigh: string;
  colorMid: string;
  minVal: number;
  maxVal: number;
  valueFormat: "number" | "percent" | "currency";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  theme: any;
  gridBodyLeft: number;
  gridBodyW: number;
  gridBodyTop: number;
}

const LEGEND_SWATCHES = 7;
const SWATCH_W = 24;
const SWATCH_H = 10;
const SWATCH_GAP = 2;

const ColorScaleLegend: React.FC<LegendProps> = React.memo(
  ({
    frame,
    exitOp,
    colorScale,
    colorLow,
    colorHigh,
    colorMid,
    minVal,
    maxVal,
    valueFormat,
    theme,
    gridBodyLeft,
    gridBodyW,
    gridBodyTop,
  }) => {
    const legendOp =
      // eslint-disable-next-line react-hooks/rules-of-hooks
      fadeIn(frame, sec(1.2), timing.entrance.medium) * exitOp;

    if (legendOp <= 0) return null;

    const totalLegendW =
      LEGEND_SWATCHES * SWATCH_W + (LEGEND_SWATCHES - 1) * SWATCH_GAP;
    const legendRight = gridBodyLeft + gridBodyW;
    const legendLeft = legendRight - totalLegendW;
    const legendY = gridBodyTop + layout.spacing.md;

    const swatches = Array.from({ length: LEGEND_SWATCHES }, (_, i) => {
      const t = i / (LEGEND_SWATCHES - 1);
      const fill = cellFill(t, colorScale, colorLow, colorHigh, colorMid);
      return { t, fill };
    });

    return (
      <div
        style={{
          position: "absolute",
          left: legendLeft,
          top: legendY,
          opacity: legendOp,
          pointerEvents: "none",
        }}
      >
        {/* Low label */}
        <div
          style={{
            position: "absolute",
            right: totalLegendW + layout.spacing.xs,
            top: 0,
            height: SWATCH_H,
            display: "flex",
            alignItems: "center",
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            fontWeight: fontWeights.regular,
            color: theme.text.muted,
            letterSpacing: letterSpacing.meta,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {formatCellValue(minVal, valueFormat)}
        </div>

        {/* Swatches */}
        <div style={{ display: "flex", gap: SWATCH_GAP }}>
          {swatches.map(({ fill }, i) => (
            <div
              key={i}
              style={{
                width: SWATCH_W,
                height: SWATCH_H,
                background: fill,
                borderRadius: 2,
                border: "0.5px solid rgba(128,128,128,0.2)",
              }}
            />
          ))}
        </div>

        {/* High label */}
        <div
          style={{
            position: "absolute",
            left: totalLegendW + layout.spacing.xs,
            top: 0,
            height: SWATCH_H,
            display: "flex",
            alignItems: "center",
            fontFamily: fonts.mono,
            fontSize: fontSizes.meta,
            fontWeight: fontWeights.regular,
            color: theme.text.muted,
            letterSpacing: letterSpacing.meta,
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          {formatCellValue(maxVal, valueFormat)}
        </div>
      </div>
    );
  },
);

ColorScaleLegend.displayName = "ColorScaleLegend";
