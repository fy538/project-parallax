/**
 * Zod schema for ComparisonPair template.
 *
 * Renders two registered templates side-by-side at 50/50 with synchronized
 * timing. The data on each side validates against that specific template's
 * schema (discriminated union over the splittable template names below).
 *
 * Editorial use case: "1914 alliances ↔ 2024 alliances", "Athens model ↔
 * Sparta model", "Theory ↔ Reality", "Allison Model I ↔ Model II". The
 * editorial point IS the simultaneous comparison.
 *
 * ── Splittable templates (curated list) ─────────────────────────────────
 *
 * Not every template makes sense halved. The 10 splittable templates are
 * the ones that:
 *   • Render full-canvas-relative (no external positioning assumptions)
 *   • Scale gracefully (the visual argument survives at 50% size)
 *   • Don't have their own heavyweight runtime (no Mapbox doubling)
 *   • Aren't already inherently comparative (no DuelingFrameworks, no
 *     SplitComposition — those are single-template forms)
 *
 * The list:
 *   1. DataChart           — bar / column / lollipop / dot
 *   2. TimeSeriesChart     — line over time
 *   3. StatReveal          — single dramatic number
 *   4. KPICard             — hero metric + sparkline
 *   5. BumpChart           — rank-order over time
 *   6. BulletChart         — target vs actual
 *   7. ProbabilityGauge    — single probability dial
 *   8. AnnotatedImage      — photo with callouts
 *   9. FrameworkDiagram    — comparison / matrix / flow
 *  10. KineticTypography   — quote / definition / stat-caption
 *
 * Excluded by design:
 *   • Map templates       — Mapbox doubling is a perf + cost nightmare
 *   • EscalationLadder    — needs full vertical canvas
 *   • DecisionTree        — typography-heavy, scales poorly at 50%
 *   • NetworkDiagram      — has its own camera path, confusing in split
 *   • Episode templates   — recursive
 *   • ComparisonPair      — recursive
 *   • SplitComposition    — already a comparison form
 *   • DuelingFrameworks   — already a comparison form
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — ComparisonPair entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// Per-template data schema imports.
import { DataChartDataSchema } from "../DataChart/schema";
import { TimeSeriesChartDataSchema } from "../TimeSeriesChart/schema";
import { StatRevealDataSchema } from "../StatReveal/schema";
import { KPICardDataSchema } from "../KPICard/schema";
import { BumpChartDataSchema } from "../BumpChart/schema";
import { BulletChartDataSchema } from "../BulletChart/schema";
import { ProbabilityGaugeDataSchema } from "../ProbabilityGauge/schema";
import { AnnotatedImageDataSchema } from "../AnnotatedImage/schema";
import { FrameworkDiagramDataSchema } from "../FrameworkDiagram/schema";
import { QuoteDataDataSchema } from "../KineticTypography/schema";

// ── Pane (discriminated union over splittable templates) ─────────────────

/**
 * One side of a comparison. Each variant carries the template name as a
 * literal discriminator + that template's specific data schema. This gives
 * full compile-time type safety: hovering over `pane.data` in TypeScript
 * shows the exact data shape for that template.
 *
 * Authoring labels (above + below the rendered template):
 *   • `label`   — small-caps strip ABOVE the template ("1914", "ATHENS")
 *   • `caption` — italic-serif strip BELOW the template
 *                 ("The Bismarckian alliance system, on the eve of war")
 */
const PaneLabels = {
  /** Small-caps strip above the rendered template (e.g., "1914", "ATHENS"). */
  label: z.string().optional(),
  /** Italic-serif strip below the rendered template. */
  caption: z.string().optional(),
};

export const PaneSchema = z.discriminatedUnion("template", [
  z.object({
    template: z.literal("DataChart"),
    data: DataChartDataSchema,
    ...PaneLabels,
  }),
  z.object({
    template: z.literal("TimeSeriesChart"),
    data: TimeSeriesChartDataSchema,
    ...PaneLabels,
  }),
  z.object({
    template: z.literal("StatReveal"),
    data: StatRevealDataSchema,
    ...PaneLabels,
  }),
  z.object({
    template: z.literal("KPICard"),
    data: KPICardDataSchema,
    ...PaneLabels,
  }),
  z.object({
    template: z.literal("BumpChart"),
    data: BumpChartDataSchema,
    ...PaneLabels,
  }),
  z.object({
    template: z.literal("BulletChart"),
    data: BulletChartDataSchema,
    ...PaneLabels,
  }),
  z.object({
    template: z.literal("ProbabilityGauge"),
    data: ProbabilityGaugeDataSchema,
    ...PaneLabels,
  }),
  z.object({
    template: z.literal("AnnotatedImage"),
    data: AnnotatedImageDataSchema,
    ...PaneLabels,
  }),
  z.object({
    template: z.literal("FrameworkDiagram"),
    data: FrameworkDiagramDataSchema,
    ...PaneLabels,
  }),
  z.object({
    template: z.literal("KineticTypography"),
    data: QuoteDataDataSchema,
    ...PaneLabels,
  }),
]);

// ── Top-level data ─────────────────────────────────────────────────────────

export const ComparisonPairDataSchema = z.object({
  /** Episode slug. */
  episode: z.string(),
  /** Optional comparison-framing title ("FIFTY-YEAR ALLIANCE STRUCTURES"). */
  title: z.string().optional(),
  /** Optional subtitle. */
  subtitle: z.string().optional(),
  /** Source attribution. */
  source: z.string().optional(),
  /** Total clip duration in seconds. Default 12s. */
  durationSec: z.number().positive().optional(),

  /** Left pane. */
  left: PaneSchema,
  /** Right pane. */
  right: PaneSchema,

  /**
   * Visual separator between the panes.
   *   • "rule"   — thin vertical line (default)
   *   • "gap"    — empty space, no line (cleanest for AnnotatedImage panes)
   *   • "stitch" — dashed vertical line (editorial annotation register)
   *   • "none"   — no separator (panes touch)
   */
  divider: z.enum(["rule", "gap", "stitch", "none"]).optional(),

  /**
   * Reveal order across the two panes.
   *   • "sync"        — both reveal simultaneously (compares simultaneity)
   *   • "left-first"  — left reveals, then right (compares "before/after")
   *   • "right-first" — right reveals first (rare; for narrative inversion)
   *
   * Default "sync".
   */
  revealOrder: z.enum(["sync", "left-first", "right-first"]).optional(),

  /**
   * Stagger delay in seconds when revealOrder is "left-first" or
   * "right-first". Default 1.5s.
   */
  revealStaggerSec: z.number().nonnegative().optional(),

  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block. */
  _direction: DirectionBlockSchema.optional(),
});

export const ComparisonPairSchema = z.object({
  data: ComparisonPairDataSchema,
});
