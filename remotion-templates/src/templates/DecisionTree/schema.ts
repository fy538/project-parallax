/**
 * Zod schemas for DecisionTree template.
 */

import { z } from "zod";

const TreeNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  probability: z.string().optional(),
  color: z.string().optional(),
  children: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  highlighted: z.boolean().optional(),
  marketPrice: z.string().optional(),
});

export const DecisionTreeSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    nodes: z.array(TreeNodeSchema).min(1),
    rootId: z.string(),
    highlightedPath: z.array(z.string()).optional(),
    highlightColor: z.string().optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
  }),
});
