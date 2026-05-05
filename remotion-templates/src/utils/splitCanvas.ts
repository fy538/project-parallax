/**
 * splitCanvas — two-column layout helper for templates that pair a primary
 * visualization with a secondary panel (annotations, evidence list, legend
 * column, side-by-side comparisons).
 *
 * Companion to `chartLayout` (one-column cartesian charts). Where chartLayout
 * stacks regions vertically — title → legend → chart → axisX → source —
 * splitCanvas additionally splits the chart row into two side-by-side panels
 * with declared width weights.
 *
 * Use cases in this codebase:
 *   - BayesianUpdate: distribution curve (left) + evidence list (right)
 *   - SplitComposition: thesis (left) + antithesis (right)
 *   - StatReveal: hero number (left) + comparison bars (right)
 *   - Any future "chart with sidebar" template
 *
 * The helper enforces a consistent gutter between panels and a consistent
 * relationship to the title and source rows. Templates that adopt it stop
 * inventing magic numbers like `area.width - 340` (BayesianUpdate's current
 * approach for reserving the evidence panel).
 */

import { layout, titleHeight } from "../design/theme";
import type { BoundingBox } from "./chartLayout";

export interface SplitCanvasInput {
  /** Does the canvas have a TitleBlock at top? Default: true. */
  hasTitle?: boolean;
  /** Title variant — controls reserved height. Default: "content". */
  titleVariant?: keyof typeof titleHeight;
  /** Source attribution row at the bottom? Default: false. */
  hasSource?: boolean;
  /**
   * Relative width weights for the two panels. Defaults to 0.7 / 0.3
   * (70% left, 30% right). Either-numbers; only the ratio matters.
   */
  leftWeight?: number;
  rightWeight?: number;
  /** Pixel gap between the two panels. Default: 32px. */
  gap?: number;
  /** Override the safe-area inset on each side. */
  insets?: { top?: number; right?: number; bottom?: number; left?: number };
}

export interface SplitCanvasResult {
  /** TitleBlock region — top of the canvas. */
  title: BoundingBox;
  /** Left panel — primary visualization. */
  leftPanel: BoundingBox;
  /** Right panel — secondary content. */
  rightPanel: BoundingBox;
  /** Source attribution row at the bottom. */
  source: BoundingBox;
}

const HEIGHTS = {
  chartGap: 32, // gap between title and panels
  sourceRow: 28,
  sourceGap: 16,
} as const;

export function splitCanvas(opts: SplitCanvasInput = {}): SplitCanvasResult {
  const {
    hasTitle = true,
    titleVariant = "content",
    hasSource = false,
    leftWeight = 0.7,
    rightWeight = 0.3,
    gap = HEIGHTS.chartGap,
    insets = {},
  } = opts;

  const top = insets.top ?? layout.safeArea.top;
  const right = insets.right ?? layout.safeArea.right;
  const bottom = insets.bottom ?? layout.safeArea.bottom;
  const left = insets.left ?? layout.safeArea.left;

  const canvasWidth = layout.width - left - right;
  const titleH = hasTitle ? titleHeight[titleVariant] : 0;
  const sourceH = hasSource ? HEIGHTS.sourceRow : 0;
  const sourceGapH = hasSource ? HEIGHTS.sourceGap : 0;

  const title: BoundingBox = {
    top,
    left,
    width: canvasWidth,
    height: titleH,
  };

  const panelTop = top + titleH + HEIGHTS.chartGap;
  const panelBottom = layout.height - bottom - sourceGapH - sourceH;
  const panelHeight = Math.max(0, panelBottom - panelTop);

  const totalWeight = leftWeight + rightWeight;
  const leftWidth = ((canvasWidth - gap) * leftWeight) / totalWeight;
  const rightWidth = ((canvasWidth - gap) * rightWeight) / totalWeight;

  const leftPanel: BoundingBox = {
    top: panelTop,
    left,
    width: leftWidth,
    height: panelHeight,
  };
  const rightPanel: BoundingBox = {
    top: panelTop,
    left: left + leftWidth + gap,
    width: rightWidth,
    height: panelHeight,
  };

  const source: BoundingBox = {
    top: panelBottom + sourceGapH,
    left,
    width: canvasWidth,
    height: sourceH,
  };

  return { title, leftPanel, rightPanel, source };
}
