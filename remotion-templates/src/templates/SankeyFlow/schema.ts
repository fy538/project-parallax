/**
 * Zod schemas for SankeyFlow template — runtime validation + Remotion Studio editing.
 */

import { z } from "zod";

const SankeyNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number(),
  color: z.string().optional(),
  column: z.number(),
});

const SankeyLinkSchema = z.object({
  from: z.string(),
  to: z.string(),
  value: z.number(),
  color: z.string().optional(),
  label: z.string().optional(),
});

export const SankeyFlowSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    nodes: z.array(SankeyNodeSchema),
    links: z.array(SankeyLinkSchema),
    showValues: z.boolean().optional(),
    valuePrefix: z.string().optional(),
    valueSuffix: z.string().optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    backgroundTint: z.string().optional(),
    _direction: z.unknown().optional(),
  }),
});
