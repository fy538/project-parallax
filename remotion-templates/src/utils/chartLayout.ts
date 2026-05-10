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
 * Status: active. DataChart and TimeSeriesChart now consume this helper
 * for their primary title/legend/chart/source regions. New cartesian
 * templates should use it from the start, and older ones should migrate
 * toward it instead of adding more bespoke geometry.
 */

import { layout, titleHeight } from "../design/theme";

export interface ChartLayoutInput {
  /** Does the chart have a TitleBlock at top? Default: true. */
  hasTitle?: boolean;
  /** Title variant — controls reserved height. Default: "content". */
  titleVariant?: keyof typeof titleHeight;
  /** Does the chart have a multi-series legend strip below the title? */
  hasLegend?: boolean;
  /** Number of legend rows (each is one row of swatch+label entries). Default 1. */
  legendRows?: number;
  /** Safe-area tier — should match the companion TitleBlock safeAreaTier. Default: "generous". */
  safeAreaTier?: keyof typeof layout.safeAreaTier;
  /** Does the chart have an x-axis tick label row at the bottom? */
  hasXAxis?: boolean;
  /** Does the chart have a source attribution line at the bottom? */
  hasSource?: boolean;
  /** Number of source/context rows reserved at the bottom. Default 1. */
  sourceRows?: number;
  /**
   * Override the global safe-area inset on each side. Replaces (not adds to)
   * the `layout.safeArea` defaults. Use sparingly — when you need a non-
   * standard outer margin (e.g. full-bleed templates).
   */
  insets?: { top?: number; right?: number; bottom?: number; left?: number };
  /**
   * Additional padding ADDED to the safe area, for chart-specific needs
   * like y-axis label space or right-side legend strip clearance. Use this
   * for "I want extra room beyond the brand-standard safe area" — leaves
   * the global safe area intact and stacks on top.
   *
   * Example: `extraPad: { left: 100 }` reserves 100px of room for y-axis
   * tick labels, on top of the standard 80px safe area, so the chart's
   * left edge is at frame x=180.
   */
  extraPad?: { top?: number; right?: number; bottom?: number; left?: number };
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
  stackRowGap: 4,
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
    safeAreaTier = "generous",
    hasXAxis = false,
    hasSource = false,
    sourceRows = 1,
    insets = {},
    extraPad = {},
  } = opts;

  // safeArea (or its override via `insets`) is the global brand outer margin.
  // `extraPad` then adds chart-specific room (y-axis tick label width, etc.)
  // on top — same effect as the legacy `layout.padding + chartPaddingLeft`
  // pattern, but with declarative semantics.
  const safe = layout.safeAreaTier[safeAreaTier];
  const top = (insets.top ?? safe.top) + (extraPad.top ?? 0);
  const right = (insets.right ?? safe.right) + (extraPad.right ?? 0);
  const bottom = (insets.bottom ?? safe.bottom) + (extraPad.bottom ?? 0);
  const left = (insets.left ?? safe.left) + (extraPad.left ?? 0);

  const canvasWidth = layout.width - left - right;

  const titleH = hasTitle ? titleHeight[titleVariant] : 0;
  const legendH = hasLegend
    ? HEIGHTS.legendRow * legendRows + (legendRows - 1) * HEIGHTS.stackRowGap
    : 0;
  const axisXH = hasXAxis ? HEIGHTS.axisXLabel : 0;
  const sourceH = hasSource
    ? HEIGHTS.sourceRow * sourceRows + (sourceRows - 1) * HEIGHTS.stackRowGap
    : 0;

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

export function validateChartLayoutIntegrity(layoutResult: ChartLayoutResult): string[] {
  const issues: string[] = [];
  const boxes = [
    ["title", layoutResult.title],
    ["legend", layoutResult.legend],
    ["chart", layoutResult.chart],
    ["axisX", layoutResult.axisX],
    ["source", layoutResult.source],
  ] as const;

  const hasArea = (height: number) => height > 0;
  const rectBottom = (box: BoundingBox) => box.top + box.height;

  for (const [name, box] of boxes) {
    if (!hasArea(box.height)) continue;
    if (box.top < 0 || box.left < 0) {
      issues.push(`${name} starts outside the canvas`);
    }
    if (box.width < 0 || box.height < 0) {
      issues.push(`${name} has a negative size`);
    }
    if (box.left + box.width > layout.width || rectBottom(box) > layout.height) {
      issues.push(`${name} extends beyond the canvas bounds`);
    }
  }

  const ordered = boxes.filter(([, box]) => hasArea(box.height));
  for (let i = 1; i < ordered.length; i++) {
    const [prevName, prevBox] = ordered[i - 1];
    const [currName, currBox] = ordered[i];
    if (currBox.top < rectBottom(prevBox)) {
      issues.push(`${currName} overlaps ${prevName}`);
    }
  }

  return issues;
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
