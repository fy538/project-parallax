/**
 * Zod schemas for Treemap template — runtime validation +
 * Remotion Studio editing.
 *
 * V1: flat list of leaves. Hierarchical v2 deferred — documented in
 * references/template-research/treemap.md.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// Leaf item — terminal node
export const TreemapLeafSchema = z.object({
  label: z.string(),
  value: z.number().positive(),
  color: z.string().optional(),
  sublabel: z.string().optional(), // e.g. "$247B" or "23%"
  highlight: z.boolean().optional(), // accent this item in gold
});

// V1: flat list of leaves (hierarchical v2 deferred — documented in dossier)
export const TreemapDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  items: z.array(TreemapLeafSchema).min(2).max(40),
  valuePrefix: z.string().optional(), // e.g. "$"
  valueSuffix: z.string().optional(), // e.g. "B"
  showValues: z.boolean().optional(), // show value inside rect (default true)
  highlightLabel: z.string().optional(), // item label to accent with gold border
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const TreemapSchema = z.object({ data: TreemapDataSchema });
