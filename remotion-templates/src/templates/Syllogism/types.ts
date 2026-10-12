/**
 * Syllogism template types.
 *
 * Formal deductive argument structure: major premise / minor premise /
 * ∴ conclusion. The brand mark (∴) IS the logical hinge between premises
 * and conclusion — uniquely Parallax since the channel's brand glyph is
 * literally a logical operator.
 */

import type { z } from "zod";
import type { SyllogismDataSchema } from "./schema";

export type SyllogismData = z.infer<typeof SyllogismDataSchema>;
