/**
 * Zod schema for IsotypeChart — runtime validation + Remotion Studio editing.
 */

import { z } from "zod";

const IsotypeRowSchema = z.object({
  label: z.string(),
  total: z.number().int().positive(),
  highlighted: z.number().int().min(0),
  color: z.string().optional(),
  mutedColor: z.string().optional(),
  icon: z
    .enum(["person", "soldier", "ship", "plane", "chip", "dollar", "house", "circle"])
    .optional()
    .describe("Icon type for this row. Overrides the top-level icon field."),
});

export const IsotypeChartSchema = z.object({
  data: z
    .object({
      episode: z.string(),
      title: z
        .string()
        .describe(
          "State the finding, not the topic. Write: 'One Company Makes 92% of Advanced Chips' not 'Chip production shares'. The title IS the editorial argument."
        ),
      subtitle: z.string().optional(),
      source: z.string().optional(),
      durationSec: z.number().positive().optional(),
      holdAfterRevealSec: z
        .number()
        .min(0)
        .max(10)
        .optional()
        .describe(
          "Deliberate pause (seconds) after all icons finish animating in, before exit fade. Default: 0."
        ),
      variant: z
        .enum(["proportion", "comparison"])
        .describe(
          '"proportion" — single row showing highlighted/total ratio (e.g. "92 of 100"). "comparison" — multiple rows for side-by-side entity comparison.'
        ),
      total: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Total number of icons to render. Required for proportion variant."),
      highlighted: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe("Number of icons to show in accent color. Must be ≤ total."),
      highlightLabel: z
        .string()
        .optional()
        .describe(
          'Label for the highlighted portion, e.g. "TSMC" or "advanced". Shown in the annotation below the grid.'
        ),
      totalLabel: z
        .string()
        .optional()
        .describe(
          'Label for the total, e.g. "global leading-edge output". Shown in the annotation below the grid.'
        ),
      rows: z
        .array(IsotypeRowSchema)
        .optional()
        .describe("Required for comparison variant. Each row renders as a horizontal strip with label, icon grid, and count."),
      icon: z
        .enum(["person", "soldier", "ship", "plane", "chip", "dollar", "house", "circle"])
        .optional()
        .describe(
          'Icon to use. Options: "person" (human silhouette), "soldier" (armed figure), "ship" (naval hull), "plane" (aircraft), "chip" (processor), "dollar" (currency symbol), "house" (building), "circle" (filled dot, fallback). Default: "circle".'
        ),
      iconSize: z
        .number()
        .min(20)
        .max(80)
        .optional()
        .describe("Size of each icon in px. Default 36px. Range: 20–80px. Use smaller sizes (24px) for dense grids (total > 100)."),
      iconsPerRow: z
        .number()
        .int()
        .positive()
        .optional()
        .describe(
          "Number of icons per row in the grid. Auto-computed for proportion variant: Math.min(total, Math.ceil(Math.sqrt(total * 1.5))) capped at 20. Override for editorial control."
        ),
      unitLabel: z
        .string()
        .optional()
        .describe('Shown below the grid. e.g. "= 1 aircraft carrier" or "= 10,000 people". Use to anchor the icon to a real-world unit.'),
      _direction: z.unknown().optional(),
    })
    .superRefine((d, ctx) => {
      if (d.variant === "proportion") {
        if (d.total === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "variant 'proportion' requires total",
            path: ["total"],
          });
        }
        if (d.highlighted === undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "variant 'proportion' requires highlighted",
            path: ["highlighted"],
          });
        }
        if (
          d.total !== undefined &&
          d.highlighted !== undefined &&
          d.highlighted > d.total
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `highlighted (${d.highlighted}) must be ≤ total (${d.total})`,
            path: ["highlighted"],
          });
        }
      }
      if (d.variant === "comparison" && (!d.rows || d.rows.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "variant 'comparison' requires at least one row",
          path: ["rows"],
        });
      }
    }),
});
