/**
 * Zod schemas for FrameworkDiagram template.
 */

import { z } from "zod";

const ComparisonColumnSchema = z.object({
  title: z.string(),
  icon: z.string().optional(),
  items: z.array(z.string()),
  color: z.string().optional(),
});

const FlowNodeSchema = z.object({
  label: z.string(),
  sublabel: z.string().optional(),
  color: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  weight: z.number().positive().optional(),
});

const MatrixCellSchema = z.object({
  row: z.number(),
  col: z.number(),
  label: z.string(),
  color: z.string().optional(),
  highlight: z.boolean().optional(),
});

export const FrameworkDiagramSchema = z.object({
  data: z
    .object({
      episode: z.string(),
      title: z.string(),
      subtitle: z.string().optional(),
      variant: z.enum(["comparison", "flow", "matrix"]),
      columns: z.array(ComparisonColumnSchema).optional(),
      protagonist: z.number().int().nonnegative().optional(),
      nodes: z.array(FlowNodeSchema).optional(),
      arrowLabels: z.array(z.string()).optional(),
      flowSpacing: z.enum(["equal", "proportional"]).optional(),
      rowHeaders: z.array(z.string()).optional(),
      colHeaders: z.array(z.string()).optional(),
      cells: z.array(MatrixCellSchema).optional(),
      items: z.array(z.object({
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        label: z.string(),
        color: z.string().optional(),
        weight: z.number().positive().optional(),
      })).optional(),
      accentColor: z.string().optional(),
      backgroundVariant: z.enum(["dark", "light"]).optional(),
      durationSec: z.number().positive().optional(),
      _direction: z.unknown().optional(),
      backgroundTint: z.string().optional(),
    })
    .superRefine((d, ctx) => {
      if (
        d.variant === "comparison" &&
        (!d.columns || d.columns.length === 0)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "variant 'comparison' requires at least one column",
          path: ["columns"],
        });
      }
      if (d.variant === "flow" && (!d.nodes || d.nodes.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "variant 'flow' requires at least one node",
          path: ["nodes"],
        });
      }
      if (d.variant === "matrix" && (!d.cells || d.cells.length === 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "variant 'matrix' requires at least one cell",
          path: ["cells"],
        });
      }
    }),
});
