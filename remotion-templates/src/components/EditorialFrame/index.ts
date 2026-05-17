/**
 * EditorialFrame barrel — shared editorial-chart-craft layer.
 *
 * Wraps any chart template and provides NYT-Upshot / FT / Economist
 * composition: kicker + title + dek + heroStat + annotations + reference
 * lines + era bands + legend strategy + chrome variants.
 *
 * Architecture doc: remotion-templates/EDITORIAL_FRAME_ARCHITECTURE.md
 */

export { EditorialFrame, computeChartRect } from "./EditorialFrame";
export type { Rect, ChartHelpers } from "./EditorialFrame";
export { AnnotationOverlay } from "./AnnotationOverlay";
export { ReferenceLineOverlay, EraBandOverlay } from "./ReferenceLineOverlay";
export { EditorialFrameSchema } from "./schema";
export type {
  EditorialFrameProps,
  Annotation,
  ReferenceLine,
  EraBand,
  HeroStat,
  LegendItem,
} from "./schema";
