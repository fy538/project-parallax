/**
 * Zod schemas for NetworkDiagram template — runtime validation + Remotion Studio editing.
 *
 * Schema-derived types (May 2026 audit #3 burn-down — see StatReveal for
 * canonical pattern). Schema closure: expanded `cameraPath[]` step to mirror
 * the full `NarratedCameraStep` shape (`label`, `dimAmount`, `blurAmount`,
 * `unfocusedScale`, `syncStart`) — previously a narrower subset, which
 * silently stripped these fields at parse time when manifest authors set
 * them.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const NetworkNodeSchema = z.object({
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
  // Group membership — used by cameraPath "group:name" targeting and node styling.
  group: z.string().optional(),
});

export const NetworkEdgeSchema = z.object({
  from: z.string(),
  to: z.string(),
  style: z.enum(["solid", "dashed", "blocked"]),
  label: z.string().optional(),
  color: z.string().optional(),
  emphasis: z.enum(["accent", "muted"]).optional(),
});

export const NetworkControlSchema = z.object({
  edge: z.tuple([z.string(), z.string()]),
  label: z.string(),
  color: z.string().optional(),
});

export const NetworkCalloutSchema = z.object({
  value: z.string(),
  label: z.string(),
  position: z.enum(["bottom-right", "bottom-left", "top-right"]),
});

export const NetworkLayoutSchema = z.enum([
  "horizontal-chain",
  "hub-spoke",
  "grid",
  "vertical-chain",
  "bipartite",
]);

/**
 * Camera-path target: either explicit coordinates or a string selector
 * (`"element:N"`, `"group:name"`, `"overview"`).
 */
export const NetworkCameraTargetSchema = z.union([
  z.object({ x: z.number(), y: z.number() }),
  z.string(),
]);

/**
 * Cinematic narrated-camera step. Mirrors `NarratedCameraStep` in
 * `src/hooks/useNarratedCamera.ts` (kept in sync — full superset so Zod
 * doesn't silently strip fields a manifest author may have set).
 */
export const NetworkCameraStepSchema = z.object({
  target: NetworkCameraTargetSchema,
  zoom: z.number().positive(),
  duration: z.number().positive(),
  focus: z.array(z.number().int()).optional(),
  focusGroup: z.string().optional(),
  behavior: z.enum(["track", "snap"]).optional(),
  shake: z.number().min(0).max(1).optional(),
  label: z.string().optional(),
  dimAmount: z.number().min(0).max(1).optional(),
  blurAmount: z.number().nonnegative().optional(),
  unfocusedScale: z.number().positive().optional(),
  syncStart: z.string().optional(),
});

export const NetworkDiagramDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  layout: NetworkLayoutSchema,
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
  // Cinematic narrated camera — pans between nodes/groups as argument builds.
  cameraPath: z.array(NetworkCameraStepSchema).optional(),
  // Background depth particles — enabled automatically when cameraPath present.
  ambientParticles: z.boolean().optional(),
}).superRefine((val, ctx) => {
  if (val.layout === "bipartite") {
    const missing = val.nodes.filter(n => !n.side).map(n => n.id);
    if (missing.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `NetworkDiagram layout="bipartite" requires every node to have side="left" or side="right". Nodes missing side: ${missing.join(", ")}. Without side, bipartite renders as a single column.`,
        path: ["nodes"],
      });
    }
  }
});

export const NetworkDiagramSchema = z.object({
  data: NetworkDiagramDataSchema,
});
