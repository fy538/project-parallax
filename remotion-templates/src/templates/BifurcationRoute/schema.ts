/**
 * BifurcationRoute Zod schema — mirrors types.ts for Remotion Studio prop validation.
 *
 * Three sub-schemas:
 *   BifurcationNodeSchema  — a single network node (actor, country, company)
 *   BifurcationLinkSchema  — a directed edge between two nodes
 *   BifurcationRouteSchema — root schema (data wrapper consumed by Composition)
 *
 * Usage in index.tsx:
 *   import { BifurcationRouteSchema } from "./schema";
 *   <Composition schema={BifurcationRouteSchema} ... />
 */

import { z } from "zod";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

export const BifurcationNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  /** Canvas position as percentage (0-100) */
  x: z.number(),
  y: z.number(),
  /** Optional explicit color; defaults to network semantic color */
  color: z.string().optional(),
  /** Network membership: before split = "unified"; after = "networkA" or "networkB" */
  network: z.enum(["unified", "networkA", "networkB"]).optional(),
  /** Optional emoji / icon glyph rendered inside the node */
  icon: z.string().optional(),
});

export const BifurcationLinkSchema = z.object({
  from: z.string(),
  to: z.string(),
  /** "unified" links show in Phase 1; "split" links appear only after the fork */
  phase: z.enum(["unified", "split"]),
  /** Which post-split network does this link belong to? */
  network: z.enum(["networkA", "networkB"]).optional(),
  label: z.string().optional(),
  color: z.string().optional(),
  dashed: z.boolean().optional(),
});

// ── Root schema ───────────────────────────────────────────────────────────────

export const BifurcationRouteSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),

    nodes: z.array(BifurcationNodeSchema),
    links: z.array(BifurcationLinkSchema),

    /** ID of the node where the network splits */
    forkNodeId: z.string(),

    /** Human-readable labels for the two post-split networks */
    networkALabel: z.string(),
    networkBLabel: z.string(),

    /** Semantic color overrides; defaults to semantic.us / semantic.china */
    networkAColor: z.string().optional(),
    networkBColor: z.string().optional(),

    /** How long the unified state displays before the split animation begins */
    unifiedDurationSec: z.number().optional(),

    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundVariant: z.enum(["dark", "light"]).optional(),
    /** Cinematic mode: camera zoom-to-fork + spatial separation */
    cinematicMode: z.boolean().optional(),
    /** Ambient particle layer for depth (default: false) */
    ambientParticles: z.boolean().optional(),

    /** Per-segment direction block from assembly-manifest.json */
    _direction: z.unknown().optional(),
  }),
});
