/**
 * Zod schemas for SanctionsNetwork template — runtime validation + Remotion
 * Studio editing.
 *
 * Specialized network diagram for sanctions architecture: typed nodes
 * (sanctioner / target / relay / sector / institution) connected by typed
 * edges (primary-sanction / secondary-threat / evasion-path /
 * formal-exemption / intermediary).
 *
 * Simultaneously encodes authority (who sanctions whom), third-country
 * vulnerability, sector specificity, and evasion paths.
 *
 * Schema-derived types — all types via z.infer<> in types.ts.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const SanctionsNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  sublabel: z.string().optional(), // e.g., "2022–present", sector name

  // Node type determines shape + color treatment
  type: z.enum(["sanctioner", "target", "relay", "sector", "institution"]),
  // sanctioner: the imposing actor (USA, EU) — rectangular, gold border
  // target: the sanctioned entity — rectangular, rust/china-red border
  // relay: third-country conduit (India, Turkey) — oval, taupe border
  // sector: industry category (energy, finance, arms) — small badge shape
  // institution: intergovernmental body (SWIFT, UN) — diamond shape

  sector: z.string().optional(), // which sector this node belongs to (links to sector color)
  importance: z.enum(["primary", "secondary"]).optional(), // default "secondary"
  position: z.object({ x: z.number(), y: z.number() }).optional(), // 0-100 canvas %

  // Timeline: when this sanction was imposed (for sequential reveal)
  imposedAt: z.string().optional(), // e.g., "Feb 2022", "Mar 2022"
  revealAtSec: z.number().nonnegative().optional(), // explicit reveal timing
});

export const SanctionsEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),

  type: z.enum([
    "primary-sanction",
    "secondary-threat",
    "evasion-path",
    "formal-exemption",
    "intermediary",
  ]),
  // primary-sanction: direct sanction (solid rust arrow from sanctioner to target)
  // secondary-threat: implicit threat to third parties (dashed umber, from sanctioner outward)
  // evasion-path: reported bypass route (animated flow, china-red dashed)
  // formal-exemption: official carve-out (dotted, taupe)
  // intermediary: relay connection (from target through relay to destination)

  label: z.string().optional(), // e.g., "oil exports ~3Mbbl/d", "shadow fleet"
  sector: z.string().optional(), // sector this flow belongs to
  volume: z.string().optional(), // qualitative volume label
  revealAtSec: z.number().nonnegative().optional(), // when this edge appears

  // Evasion path animation: when true, draw an animated particle flow along the edge
  animated: z.boolean().optional(),
});

export const SanctionsSectorSchema = z.object({
  id: z.string(),
  label: z.string(),
  color: z.string(), // palette token or hex for this sector's color coding
});

export const SanctionsNetworkDataSchema = z.object({
  episode: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  _direction: DirectionBlockSchema.optional(),

  nodes: z.array(SanctionsNodeSchema).min(2).max(20),
  edges: z.array(SanctionsEdgeSchema).min(1),
  sectors: z.array(SanctionsSectorSchema).optional(),

  // Layout: if nodes have position, use them; otherwise use auto layout
  // Auto layout attempts: sanctioners at top, target in center, relays below
  layout: z.enum(["auto", "manual"]).optional(), // default "auto"

  // Animation mode
  revealMode: z.enum(["simultaneous", "sequential"]).optional(), // default "sequential"
  // sequential: sanctions imposed in revealAtSec order; evasion paths appear last
});

export const SanctionsNetworkSchema = z.object({
  data: SanctionsNetworkDataSchema,
});
