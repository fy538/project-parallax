/**
 * Zod schemas for FrameworkDiagram template.
 *
 * Schema-derived types (May 2026 audit #3 — see StatReveal for canonical
 * pattern). Inner shapes exported so types.ts can `z.infer` from each.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const ComparisonColumnSchema = z.object({
  title: z.string(),
  icon: z.string().optional(),
  items: z.array(z.string()),
  color: z.string().optional(),
});

export const FlowNodeSchema = z.object({
  label: z.string(),
  sublabel: z.string().optional(),
  color: z.string().optional(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  weight: z.number().positive().optional(),
});

export const MatrixCellSchema = z.object({
  row: z.number(),
  col: z.number(),
  label: z.string(),
  color: z.string().optional(),
  highlight: z.boolean().optional(),
});

export const MatrixItemSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  label: z.string(),
  color: z.string().optional(),
  weight: z.number().positive().optional(),
});

export const FrameworkPhaseSchema = z.object({
  label: z.string(),
  durationSec: z.number().positive(),
  activeNodes: z.array(z.number().int().nonnegative()).optional(),
});

export const EliminatedScenarioSchema = z.object({
  filter: z.number().int().nonnegative(),
  scenario: z.string(),
  color: z.string().optional(),
});

export const FrameworkDiagramDataSchema = z
    .object({
      episode: z.string(),
      title: z.string(),
      subtitle: z.string().optional(),
      variant: z.enum(["comparison", "flow", "matrix"]),
      columns: z.array(ComparisonColumnSchema).optional(),
      /**
       * comparison only. "columns" (default) stacks two independent lists.
       * "paired" lines the two columns up row by row — columns[0].items[i]
       * beside columns[1].items[i] — at large type, each pair arriving on
       * its own time. Use it when the argument is in the pairing.
       */
      comparisonLayout: z.enum(["columns", "paired"]).optional(),
      /** paired only. Optional label at the left of each row. */
      rowLabels: z.array(z.string()).optional(),
      /**
       * paired only. When each row arrives, in seconds: one number for the
       * pair, or [left, right] to land each side on its own phrase.
       */
      rowAtSec: z
        .array(z.union([z.number().min(0), z.tuple([z.number().min(0), z.number().min(0)])]))
        .optional(),
      /** paired only. Index of the row that carries the point (gold rail). */
      keyRow: z.number().int().nonnegative().optional(),
      /** paired only. "arrow" (default): left is acted on by right. "none": plain comparison. */
      connector: z.enum(["arrow", "none"]).optional(),
      /** Source line, bottom right. */
      source: z.string().optional(),
      protagonist: z.number().int().nonnegative().optional(),
      nodes: z.array(FlowNodeSchema).optional(),
      arrowLabels: z.array(z.string()).optional(),
      flowSpacing: z.enum(["equal", "proportional"]).optional(),
      heroStage: z.number().int().nonnegative().optional(),
      rowHeaders: z.array(z.string()).optional(),
      colHeaders: z.array(z.string()).optional(),
      cells: z.array(MatrixCellSchema).optional(),
      items: z.array(MatrixItemSchema).optional(),
      accentColor: z.string().optional(),
      backgroundVariant: z.enum(["dark", "light"]).optional(),
      durationSec: z.number().positive().optional(),
      _direction: DirectionBlockSchema.optional(),
      backgroundTint: z.string().optional(),
      // Phase-sequenced reveals — each phase makes a subset of nodes active.
      phases: z.array(FrameworkPhaseSchema).optional(),
      // Logical elimination overlays (matrix variant).
      eliminatedScenarios: z.array(EliminatedScenarioSchema).optional(),
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
    });

export const FrameworkDiagramSchema = z.object({
  data: FrameworkDiagramDataSchema,
});
