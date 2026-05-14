/**
 * Zod schemas for NetworkDiagram template — runtime validation + Remotion Studio editing.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

const NetworkNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  sublabel: z.string().optional(),
  type: z.enum(["nation", "institution", "actor", "concept"]),
  color: z.string(),
  importance: z.enum(["primary", "secondary"]).optional(),
  stat: z
    .object({
      value: z.string(),
      label: z.string(),
    })
    .optional(),
  position: z
    .object({
      x: z.number(),
      y: z.number(),
    })
    .optional(),
  side: z.enum(["left", "right"]).optional(),
});

const NetworkEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  style: z.enum(["solid", "dashed", "blocked"]),
  label: z.string().optional(),
  color: z.string().optional(),
});

const NetworkControlSchema = z.object({
  edge: z.tuple([z.string(), z.string()]),
  label: z.string(),
  color: z.string().optional(),
});

const NetworkCalloutSchema = z.object({
  value: z.string(),
  label: z.string(),
  position: z.enum(["bottom-right", "bottom-left", "top-right"]),
});

export const NetworkDiagramSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    layout: z.enum(["horizontal-chain", "hub-spoke", "grid", "vertical-chain", "bipartite"]),
    gridColumns: z.number().optional(),
    nodes: z.array(NetworkNodeSchema).min(1, {
      message: "NetworkDiagram requires at least one node. An empty diagram has nothing to render.",
    }),
    edges: z.array(NetworkEdgeSchema),
    controls: z.array(NetworkControlSchema).optional(),
    callouts: z.array(NetworkCalloutSchema).optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    backgroundTint: z.string().optional(),
    _direction: DirectionBlockSchema.optional(),
  }),
});
