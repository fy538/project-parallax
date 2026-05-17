/**
 * Zod schemas for SankeyFlow template — runtime validation + Remotion Studio editing.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

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
  emphasis: z.enum(["accent", "muted"]).optional(),
});

export const SankeyFlowSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string().describe("State where value concentrates, not what the flow shows. Write: 'ASML captures 85% of the value in the EUV supply chain' not 'EUV supply chain flow'. The title IS the editorial argument."),
    subtitle: z.string().optional(),
    nodes: z.array(SankeyNodeSchema).min(2, {
      message: "SankeyFlow requires at least 2 nodes (one source + one destination). A single-node Sankey has nothing to flow.",
    }),
    links: z.array(SankeyLinkSchema).min(1, {
      message: "SankeyFlow requires at least one link. The form IS the flow — no links means there's nothing to visualize.",
    }),
    showValues: z.boolean().optional(),
    valuePrefix: z.string().optional(),
    valueSuffix: z.string().optional(),
    columnHeaders: z.array(z.string()).optional(),
    sourceTotal: z.object({
      value: z.string(),
      context: z.string().optional(),
    }).optional(),
    aggregateOther: z.object({
      threshold: z.number().min(0).max(1).optional(),
      label: z.string().optional(),
      color: z.string().optional(),
    }).optional(),
    nodeAlign: z.enum(["left", "right", "center", "justify"]).optional(),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    backgroundTint: z.string().optional(),
    _direction: DirectionBlockSchema.optional(),
    // Animated flow particles along Sankey ribbons. Use sparingly —
    // see references/template-research/sankey-flow.md § 7 (failure modes).
    // TS-SIDE: flowParticles/particleSpeed/particleDensity/ambientParticles in types.ts.
    // Previously absent from schema, so Zod would strip these in non-passthrough mode.
    flowParticles: z.boolean().optional(),
    particleSpeed: z.number().positive().optional(),
    particleDensity: z.number().positive().optional(),
    ambientParticles: z.boolean().optional(),
  }),
});
