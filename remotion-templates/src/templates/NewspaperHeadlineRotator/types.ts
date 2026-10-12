/**
 * NewspaperHeadlineRotator template types.
 *
 * Sequential reveal of 3-5 period newspaper front pages making the same
 * editorial point ("the world saw it this way" / "every paper had the same
 * headline that morning"). Each page = real masthead image crop + editorial
 * headline gloss + dateline strip.
 */

import type { z } from "zod";
import type {
  NewspaperHeadlineRotatorDataSchema,
  NewspaperHeadlineSchema,
} from "./schema";

export type NewspaperHeadline = z.infer<typeof NewspaperHeadlineSchema>;
export type NewspaperHeadlineRotatorData = z.infer<
  typeof NewspaperHeadlineRotatorDataSchema
>;
