/**
 * Zod schemas for DecisionTree template.
 *
 * Schema-derived types (May 2026 audit #3 burn-down — see StatReveal for
 * canonical pattern).
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const TreeNodeSchema = z.object({
  id: z.string(),
  label: z.string(),
  edgeLabel: z.string().optional(),
  probability: z.string().optional(),
  color: z.string().optional(),
  children: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  highlighted: z.boolean().optional(),
  marketPrice: z.string().optional(),
});

export const CameraStepSchema = z.object({
  focus: z.string().describe("Node ID to center the camera on"),
  zoom: z.number().describe("Zoom level (1.0 = full tree visible, 2.5 = tight close-up)"),
  duration: z.number().describe("Duration of this step in seconds"),
  dimOthers: z.boolean().optional().describe("Dim nodes NOT on the path from root to focus node"),
  label: z.string().optional().describe("Optional label text overlaid during this step"),
});

export const DecisionTreeDataSchema = z.object({
  episode: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  variant: z.enum(["extensive", "ladder", "indented", "spine", "schematic"]).optional(),
  nodes: z.array(TreeNodeSchema).min(1),
  rootId: z.string(),
  highlightedPath: z.array(z.string()).optional(),
  highlightColor: z.string().optional(),
  probabilityWeights: z.boolean().optional(),
  cameraPath: z.array(CameraStepSchema).optional(),
  source: z.string().optional(),
  durationSec: z.number().optional(),
  backgroundVariant: z.enum(["dark", "light"]).optional(),
  layout: z.enum(["vertical", "horizontal"]).optional(),
  _direction: DirectionBlockSchema.optional(),
});

export const DecisionTreeSchema = z.object({
  data: DecisionTreeDataSchema,
});
