/**
 * EditorialFrame schema — shared editorial-chart-craft layer that wraps any
 * chart template and provides NYT-Upshot / FT / Economist composition.
 *
 * Design doc: remotion-templates/EDITORIAL_FRAME_ARCHITECTURE.md
 *
 * The frame handles: kicker + title + dek + heroStat + annotations + reference
 * lines + era bands + legend strategy + chrome variants + source attribution.
 * The chart template (DataChart, TimeSeriesChart, etc.) renders only the
 * geometric primitives — bars, lines, dots — inside the frame's content slot.
 *
 * Opt-in via `frame?: EditorialFrame` on a chart's data schema. When absent,
 * the chart renders with its default chrome (HeaderStrip + FooterStrip + the
 * intelligence-briefing register). When present, it wraps in EditorialFrame
 * and uses the editorial-publication register (no REC pulse, top-aligned
 * legend, multi-annotation overlay, etc.).
 */

import { z } from "zod";

// ── Hero stat ────────────────────────────────────────────────────────────────

const HeroStatSchema = z.object({
  /** Display value — "3:1", "82%", "$890M". */
  value: z.string(),
  /** Where the hero stat sits relative to the chart. */
  placement: z
    .enum(["left-rail", "above-headline", "inset", "right-rail"])
    .default("left-rail"),
  /** Typographic weight class. `display` = ~120pt, `h1` = ~80pt, `h2` = ~56pt. */
  weight: z.enum(["display", "h1", "h2"]).default("display"),
  /** Override the default ink color (e.g. amber for emphatic stats). */
  color: z.string().optional(),
});

// ── Annotations ──────────────────────────────────────────────────────────────

/**
 * Annotation targeting — exactly one of these should be set per annotation:
 *   - targetDataPoint: index into chart data (most common for bar charts)
 *   - targetXValue:    x-axis value (for time-series — pass a year or category)
 *   - targetCoordinate: absolute [x, y] in 0..1 chart-rect coords (escape hatch)
 *
 * If multiple are set, precedence is: targetDataPoint > targetXValue > targetCoordinate.
 */
const AnnotationSchema = z.object({
  targetDataPoint: z.number().optional(),
  targetXValue: z.union([z.number(), z.string()]).optional(),
  targetCoordinate: z.tuple([z.number(), z.number()]).optional(),

  /** Headline of the annotation (h3 sans, ~24-28pt). */
  headline: z.string(),
  /** Italic dek beneath the headline (~16-18pt). */
  dek: z.string().optional(),

  /** Where to position the annotation block relative to its target. */
  position: z.enum(["top", "right", "bottom", "left"]).default("right"),
  /** Visual style — `callout` is default (leader line + text block), `event-flag`
   * is a vertical line + small label (for time-series events), `anchor` is a
   * triangular pointer + dek (more diagrammatic), `inline` is no leader line. */
  style: z.enum(["callout", "event-flag", "anchor", "inline"]).default("callout"),
  /** Whether to draw a leader line from the target to the text block. */
  leaderLine: z.boolean().default(true),
  /** Override the default ink color. */
  color: z.string().optional(),
});

// ── Reference lines ──────────────────────────────────────────────────────────

const ReferenceLineSchema = z.object({
  /** Threshold value on the specified axis. */
  value: z.number(),
  /** Which axis the line is drawn against. */
  axis: z.enum(["x", "y"]).default("y"),
  /** Label text (placed near the line). */
  label: z.string().optional(),
  /** Where the label sits along the line. */
  labelPosition: z
    .enum(["start", "end", "above", "below"])
    .default("end"),
  /** Line stroke style. */
  style: z.enum(["solid", "dashed", "dotted"]).default("dashed"),
  /** Override the default neutral color. */
  color: z.string().optional(),
});

// ── Era bands ────────────────────────────────────────────────────────────────

const EraBandSchema = z.object({
  start: z.union([z.number(), z.string()]),
  end: z.union([z.number(), z.string()]),
  axis: z.enum(["x", "y"]).default("x"),
  label: z.string().optional(),
  color: z.string().optional(),
  /** Opacity for the band fill — keep low (0.05–0.15) for chart legibility. */
  opacity: z.number().min(0).max(1).default(0.08),
});

// ── Legend ───────────────────────────────────────────────────────────────────

const LegendItemSchema = z.object({
  label: z.string(),
  color: z.string(),
  symbol: z.enum(["square", "circle", "line"]).default("square"),
});

// ── EditorialFrame ───────────────────────────────────────────────────────────

export const EditorialFrameSchema = z.object({
  // ── Header zone ────────────────────────────────────────────────────────────
  /** Small all-caps category label above the title (e.g. "THEORY DIFFUSION"). */
  kicker: z.string().optional(),
  /** Main headline — state the finding, not the topic. */
  title: z.string(),
  /** Optional dek beneath the title — italic serif by convention. */
  dek: z.string().optional(),
  /** Optional body paragraph beneath the dek (left-rail in hero-split). */
  body: z.string().optional(),
  /** Hero stat (massive number / ratio / percentage). */
  heroStat: HeroStatSchema.optional(),

  // ── Layout ────────────────────────────────────────────────────────────────
  /**
   * - `hero-split` — left rail with kicker+heroStat+title+dek, chart fills right (Economist Daily Charts).
   * - `centered`   — vertical stack, all elements centered (NYT Upshot static).
   * - `full-bleed` — title bar across top, chart fills 100% width below (FT JBM hero).
   * - `stacked`    — vertical column: title, chart, source (most magazine-natural).
   */
  layout: z
    .enum(["hero-split", "centered", "full-bleed", "stacked"])
    .default("centered"),
  /** Left/right split percentages for `hero-split` layout. Defaults to [35, 65]. */
  splitRatio: z.tuple([z.number(), z.number()]).optional(),

  // ── Overlay elements ──────────────────────────────────────────────────────
  annotations: z.array(AnnotationSchema).optional(),
  referenceLines: z.array(ReferenceLineSchema).optional(),
  eraBands: z.array(EraBandSchema).optional(),

  // ── Legend ────────────────────────────────────────────────────────────────
  /**
   * - `top-aligned`  — small swatches + labels above the chart area.
   * - `direct-label` — labels placed at the end of each line/bar (FT signature).
   * - `suppressed`   — no legend (use direct labels or single-color data).
   * - `inline`       — labels mixed into the chart area at relevant positions.
   */
  legend: z
    .enum(["top-aligned", "direct-label", "suppressed", "inline"])
    .default("suppressed"),
  legendItems: z.array(LegendItemSchema).optional(),

  // ── Chrome ────────────────────────────────────────────────────────────────
  /**
   * - `publication` — chart default. No REC pulse. Just source attribution + brand mode tag.
   * - `intelligence` — current FooterStrip behavior. REC dot + runtime + SCALE + FILED. For maps / atmospheric segments.
   * - `none` — no chrome at all. Bloomberg-austere.
   */
  chrome: z
    .enum(["publication", "intelligence", "none"])
    .default("publication"),
  /** Source attribution (small mono caps at bottom). */
  source: z.string().optional(),
  /** Small caps mode tag (e.g. "ACADEMIC ANALYSIS · A"). */
  modeTag: z.string().optional(),
  /** Optional caption beneath the chart (italic dek). */
  caption: z.string().optional(),
});

export type EditorialFrameProps = z.infer<typeof EditorialFrameSchema>;
export type Annotation = z.infer<typeof AnnotationSchema>;
export type ReferenceLine = z.infer<typeof ReferenceLineSchema>;
export type EraBand = z.infer<typeof EraBandSchema>;
export type HeroStat = z.infer<typeof HeroStatSchema>;
export type LegendItem = z.infer<typeof LegendItemSchema>;
