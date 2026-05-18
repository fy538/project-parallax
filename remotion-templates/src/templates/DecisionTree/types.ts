/**
 * DecisionTree — branching scenario/decision tree for "Wargamer" episodes.
 * 5 variants (extensive · ladder · indented · spine · schematic) chosen via
 * `variant`. Virtual camera animates between nodes via `cameraPath[]`.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  CameraStepSchema,
  DecisionTreeDataSchema,
  TreeNodeSchema,
} from "./schema";

export type TreeNode = z.infer<typeof TreeNodeSchema>;
export type CameraStep = z.infer<typeof CameraStepSchema>;
export type DecisionTreeData = z.infer<typeof DecisionTreeDataSchema>;
