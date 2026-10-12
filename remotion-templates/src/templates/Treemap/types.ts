/**
 * Treemap — part-to-whole area visualization using squarified layout.
 *
 * Types derived from Zod schemas.
 */

import type { z } from "zod";
import type {
  TreemapLeafSchema,
  TreemapDataSchema,
} from "./schema";

export type TreemapLeaf = z.infer<typeof TreemapLeafSchema>;
export type TreemapData = z.infer<typeof TreemapDataSchema>;

/**
 * A leaf item after the squarify layout pass — leaf data + computed
 * pixel rectangle for CSS absolute positioning.
 */
export interface TreemapRect {
  label: string;
  value: number;
  color?: string;
  sublabel?: string;
  highlight?: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}
