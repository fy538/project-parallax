/**
 * chartLayout — named-region layout for cartesian charts.
 *
 * See LAYOUT.md for principles. The short version: chart templates
 * shouldn't compute positions from `area.height - 220 - spacing.xl`-style
 * magic numbers. They should ask this helper for the bounding box of
 * each *named region* (title, legend, chart, source) and render content
 * INTO those boxes. When something changes (legend added, source dropped),
 * only this helper needs to know — templates don't recompute math.
 *
 * Status: stub. TimeSeriesChart and DataChart still use their own inline
 * layout. This helper is the target shape for migration. Use it for new
 * cartesian templates from the start.
 */

import { layout, fontSizes, titleHeight } from "../design/theme";

export interface ChartLayoutInput {
  /** Does the chart have a TitleBlock at top? Default: true. */
  hasTitle?: boolean;
  /** Title variant — controls reserved height. Default: "content". */
  titleVariant?: keyof typeof titleHeight;
  /** Does the chart have a multi-series legend strip below the title? */
  hasLegend?: boolean;
  /** Number of legend rows (each is one row of swatch+label entries). Default 1. */
  legendRows?: number;
  /** Does the chart have an x-axis tick label row at the bottom? */
  hasXAxis?: boolean;
  /** Does the chart have a source attribution line at the bottom? */
  hasSource?: boolean;
  /** Override the safe-area inset on each side. Default: `safeArea.{top,...}`. */
  insets?: { top?: number; right?: number; bottom?: number; left?: number };
}

export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface ChartLayoutResult {
  /** TitleBlock region — top of the canvas, below chrome. */
  title: BoundingBox;
  /** Legend strip — between title and chart. Zero-height when no legend. */
  legend: BoundingBox;
  /** Chart plot region — the largest box, what's left after others claim space. */
  chart: BoundingBox;
  /** X-axis tick label strip below the chart. Zero-height when no x-axis. */
  axisX: BoundingBox;
  /** Source attribution row at the very bottom. Zero-height when no source. */
  source: BoundingBox;
}

/**
 * Reserved heights for non-chart regions (in pixels). These are the budgets
 * the layout subtracts from the canvas before handing the rest to the chart.
 *
 * Tuned for the Meridian brand at 1080p; adjust here if you change typography
 * scales rather than recomputing in every template.
 */
const HEIGHTS = {
  legendRow: 36,
  legendGap: 12,    // gap between title block and legend
  chartGap: 24,     // gap between legend (or title) and chart top
  axisXLabel: 40,
  axisXGap: 12,     // gap between chart bottom and x-axis label row
  sourceRow: 28,
  sourceGap: 16,    // gap between source row and footer chrome
} as const;

export function chartLayout(opts: ChartLayoutInput = {}): ChartLayoutResult {
  const {
    hasTitle = true,
    titleVariant = "content",
    hasLegend = false,
    legendRows = 1,
    hasXAxis = false,
    hasSource = false,
    insets = {},
  } = opts;

  const top = insets.top ?? layout.safeArea.top;
  const right = insets.right ?? layout.safeArea.right;
  const bottom = insets.bottom ?? layout.safeArea.bottom;
  const left = insets.left ?? layout.safeArea.left;

  const canvasWidth = layout.width - left - right;

  const titleH = hasTitle ? titleHeight[titleVariant] : 0;
  const legendH = hasLegend
    ? HEIGHTS.legendRow * legendRows + (legendRows - 1) * 4
    : 0;
  const axisXH = hasXAxis ? HEIGHTS.axisXLabel : 0;
  const sourceH = hasSource ? HEIGHTS.sourceRow : 0;

  // Top-down stacking: title → legend gap → legend → chart gap → chart → axis-x gap → axis-x → source gap → source.
  let cursor = top;

  const title: BoundingBox = {
    top: cursor,
    left,
    width: canvasWidth,
    height: titleH,
  };
  cursor += titleH;
  if (hasLegend) cursor += HEIGHTS.legendGap;

  const legend: BoundingBox = {
    top: cursor,
    left,
    width: canvasWidth,
    height: legendH,
  };
  cursor += legendH;
  cursor += HEIGHTS.chartGap;

  // Chart claims everything between the cursor and the bottom-stack.
  const bottomStackHeight =
    (hasXAxis ? HEIGHTS.axisXGap + axisXH : 0) +
    (hasSource ? HEIGHTS.sourceGap + sourceH : 0);
  const chartBottom = layout.height - bottom - bottomStackHeight;

  const chart: BoundingBox = {
    top: cursor,
    left,
    width: canvasWidth,
    height: Math.max(0, chartBottom - cursor),
  };

  // Bottom-stack regions — anchored to the canvas bottom and stacked upward
  // visually but described top-down here for consistency.
  let bottomCursor = chartBottom;
  if (hasXAxis) bottomCursor += HEIGHTS.axisXGap;

  const axisX: BoundingBox = {
    top: bottomCursor,
    left,
    width: canvasWidth,
    height: axisXH,
  };
  bottomCursor += axisXH;
  if (hasSource) bottomCursor += HEIGHTS.sourceGap;

  const source: BoundingBox = {
    top: bottomCursor,
    left,
    width: canvasWidth,
    height: sourceH,
  };

  return { title, legend, chart, axisX, source };
}

/**
 * Convenience: convert a BoundingBox to React inline-style absolute positioning.
 *
 * Usage:
 *   const layout = chartLayout({ hasTitle: true, hasLegend: true });
 *   <div style={asAbsolute(layout.chart)}>...</div>
 */
export function asAbsolute(box: BoundingBox): React.CSSProperties {
  return {
    position: "absolute",
    top: box.top,
    left: box.left,
    width: box.width,
    height: box.height,
  };
}
