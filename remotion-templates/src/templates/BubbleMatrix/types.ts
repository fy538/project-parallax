/**
 * BubbleMatrix — TypeScript types derived from Zod schemas.
 *
 * Four-variable scatter: X-position, Y-position, bubble area (size), color.
 * The Gapminder / Hans Rosling "wealth & health of nations" register.
 */

import type { z } from "zod";
import type {
  BubbleMatrixDataSchema,
  BubbleEntitySchema,
  BubbleGroupSchema,
} from "./schema";

export type BubbleMatrixData = z.infer<typeof BubbleMatrixDataSchema>;
export type BubbleEntity = z.infer<typeof BubbleEntitySchema>;
export type BubbleGroup = z.infer<typeof BubbleGroupSchema>;
