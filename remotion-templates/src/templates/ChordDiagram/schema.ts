/**
 * Zod schemas for ChordDiagram template — runtime validation + Remotion
 * Studio editing.
 *
 * ChordDiagram renders bilateral flow relationships between a fixed set of
 * entities arranged on a circle. Arc length encodes total traffic volume
 * per entity; chord thickness encodes bilateral flow magnitude. The editorial
 * form for trade interdependence, alliance webs, and migration networks.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const ChordEntitySchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string().optional(),
  sublabel: z.string().optional(),
});

export const ChordFlowSchema = z.object({
  from: z.string(),           // entity id
  to: z.string(),             // entity id
  value: z.number().positive(),
  label: z.string().optional(),
  emphasis: z.enum(["accent", "muted"]).optional(),
  bidirectional: z.boolean().optional(), // if true, both directions have same value
});

export const ChordDiagramDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  entities: z.array(ChordEntitySchema).min(2).max(12),
  flows: z.array(ChordFlowSchema).min(1),
  valueLabel: z.string().optional(),  // "USD billions", "% of total", etc.
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const ChordDiagramSchema = z.object({ data: ChordDiagramDataSchema });
