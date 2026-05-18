/**
 * ImageComposite — rendered photographs with duotone pipeline. Used for
 * Time Collapse cinematic moments and historical photo segments.
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type { ImageCompositeDataSchema } from "./schema";

export type ImageCompositeData = z.infer<typeof ImageCompositeDataSchema>;
