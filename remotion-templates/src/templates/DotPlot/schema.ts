/**
 * Zod schema for DotPlot — runtime validation + Remotion Studio editing.
 *
 * DotPlot: named entities along a single continuous axis. The Cleveland-
 * canonical alternative to bar charts when the argument is about relative
 * position between entities, not absolute magnitude from zero. Used by Pew
 * Research ("Where countries fall on X"), FT Alphaville position charts,
 * and the annual NATO burden-sharing registers.
 *
 * Distinct from DumbbellPlot (paired before/after — the pairing IS the
 * argument) and RankChangeDotPlot (ordinal rank change). DotPlot is a
 * continuous-scale strip chart.
 *
 * Schema-derived types (May 2026 pattern — see StatReveal for canonical form).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const DotPlotEntitySchema = z.object({
  id: z.string(),
  label: z.string().describe("Displayed entity name — country, actor, company, etc."),
  value: z.number().describe("Primary position on the continuous axis."),
  value2: z.number().optional().describe(
    "Optional second position. When set, draws an arrow from value → value2. " +
    "Useful for timeline snapshots (two time points per entity) without the " +
    "paired-structure editorial argument of DumbbellPlot."
  ),
  value2Label: z.string().optional().describe(
    "Short label for the second position when value2 is shown."
  ),
  color: z.string().optional().describe(
    "Dot color override. Use for alliance bloc coloring (NATO blue / BRICS etc.). " +
    "Accepts palette tokens or hex strings. Defaults to palette.gold for primary, " +
    "palette.taupe for secondary, palette.sand + lower opacity for muted."
  ),
  emphasis: z.enum(["primary", "secondary", "muted"]).optional().describe(
    "Visual weight of this entity. primary=full gold (default), secondary=taupe, " +
    "muted=sand+0.4 opacity. Use emphasis sparingly — 1–3 primary entities per chart " +
    "so the editorial argument stays readable."
  ),
  valueLabel: z.string().optional().describe(
    "The value as text (\"0.71\", \"2.1%\"). When set, the label becomes two levels: " +
    "this figure large, `label` small beside it. Use it when the value is the datum " +
    "and the name only says whose it is."
  ),
  atSec: z.number().min(0).optional().describe(
    "When this dot and its label appear, in seconds. Overrides the staggered " +
    "reveal so a dot can land on the sentence that names it."
  ),
  annotation: z.string().optional().describe(
    "Small annotation bubble rendered near the dot — for editorial callouts like " +
    "'NATO target', 'G7 average', 'Our estimate'."
  ),
});

export const DotPlotGroupSchema = z.object({
  label: z.string().describe("Group label, e.g. 'NATO allies' or 'BRICS members'."),
  entities: z.array(DotPlotEntitySchema).min(1),
});

export const DotPlotReferenceLineSchema = z.object({
  value: z.number(),
  label: z.string().optional(),
  style: z.enum(["solid", "dashed"]).optional().describe("Default 'dashed'."),
  color: z.string().optional().describe(
    "Line color. Defaults to palette.gold at 70% opacity."
  ),
});

/**
 * DotPlot data schema. Supports two modes:
 *   flat mode  — `entities` array (most common; single-axis strip chart)
 *   grouped mode — `groups` array (for bloc comparisons like NATO vs. non-NATO)
 * Only one of the two should be provided. warnIf checks for both / neither.
 */
export const DotPlotDataSchema = z.object({
  episode: z.string(),
  title: z.string().optional().describe(
    "State the finding, not the topic. E.g. 'NATO Burden-Sharing: Who Hits the Target' " +
    "is structural; 'NATO Defense Spending' is merely topical."
  ),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  _direction: DirectionBlockSchema.optional(),
  span: z
    .object({
      from: z.number(),
      to: z.number().optional(),
      label: z.string().optional(),
      atSec: z.number().min(0).optional(),
    })
    .optional()
    .describe(
      "Flat mode. A band drawn along the axis from `from` to `to` (default: the " +
      "furthest primary entity), with an optional label over its empty stretch. " +
      "Use it when the claim is a distance — \"better than chance\", \"above target\" — " +
      "so the distance itself is drawn, not left for the eye to work out."
    ),

  // ── Data: flat or grouped ───────────────────────────────────────────────
  entities: z.array(DotPlotEntitySchema).min(2).max(40).optional().describe(
    "Flat mode: all entities share one strip. 2–40 entities. " +
    "Mutually exclusive with 'groups'."
  ),
  groups: z.array(DotPlotGroupSchema).min(1).max(6).optional().describe(
    "Grouped mode: each group gets a labeled row. 1–6 groups, each with 1+ entities. " +
    "All groups share the same axis range. " +
    "Mutually exclusive with 'entities'."
  ),

  // ── Axis ───────────────────────────────────────────────────────────────
  axisMin: z.number().optional().describe(
    "Left edge of the axis. Auto-computed from data if not set."
  ),
  axisMax: z.number().optional().describe(
    "Right edge of the axis. Auto-computed from data if not set."
  ),
  axisLabel: z.string().optional().describe("Axis description, e.g. 'Defense spending (% of GDP)'."),
  axisTickCount: z.number().int().min(2).max(10).optional().describe("Default 5."),
  axisFormat: z.string().optional().describe(
    "printf-style format string for tick labels: '%.1f' '%.1f%%' '$%.0fB'. " +
    "The trailing '%' in '%.1f%%' renders as a literal percent sign."
  ),

  // ── Visual ─────────────────────────────────────────────────────────────
  dotRadius: z.number().min(3).max(12).optional().describe("Default 6."),
  /**
   * Label scale. "large" sizes entity labels, tick numbers and reference-line
   * labels for few-entity plots (≤6 dots) read on a phone; "default" keeps the
   * dense-data sizing (17-member NATO plots etc.).
   */
  labelScale: z.enum(["default", "large"]).optional(),
  showGrid: z.boolean().optional().describe(
    "Draw faint vertical grid lines at each tick. Default false — clean editorial look."
  ),
  showArrows: z.boolean().optional().describe(
    "When value2 is present on any entity, draw an arrow from value → value2. Default true."
  ),
  revealOrder: z.enum(["left-to-right", "top-to-bottom", "simultaneous"]).optional().describe(
    "Stagger order for the dot reveal animation. Default 'top-to-bottom' (alphabetical " +
    "or input order). 'left-to-right' reveals by ascending value — good for magnitude " +
    "arguments. 'simultaneous' for when the comparative array IS the argument."
  ),

  // ── Reference lines ─────────────────────────────────────────────────────
  referenceLines: z.array(DotPlotReferenceLineSchema).optional().describe(
    "Vertical benchmark lines with optional labels. Common uses: NATO 2% target, " +
    "global average, WHO threshold, treaty commitment value."
  ),
});

/** Top-level wrapper schema for Remotion Studio editing. */
export const DotPlotSchema = z.object({
  data: DotPlotDataSchema,
});
