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
});

const MatrixCellSchema = z.object({
  row: z.number(),
  col: z.number(),
  label: z.string(),
  color: z.string().optional(),
  highlight: z.boolean().optional(),
});

export const FrameworkDiagramSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    variant: z.enum(["comparison", "flow", "matrix"]),
    columns: z.array(ComparisonColumnSchema).optional(),
    nodes: z.array(FlowNodeSchema).optional(),
    arrowLabels: z.array(z.string()).optional(),
    rowHeaders: z.array(z.string()).optional(),
    colHeaders: z.array(z.string()).optional(),
    cells: z.array(MatrixCellSchema).optional(),
    accentColor: z.string().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    durationSec: z.number().optional(),
  }),
});
