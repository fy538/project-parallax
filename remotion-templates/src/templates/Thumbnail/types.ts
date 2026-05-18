/**
 * Thumbnail — static 1280×720 composition for YouTube thumbnail export.
 *
 * Three layout modes, each corresponding to a concept from the
 * thumbnail-concept skill:
 *   juxtaposition    — image panel + dual stat cards (Concept A)
 *   data-provocation — hero stat over faded background (Concept B)
 *   symbolic         — centered illustration + title (Concept C)
 *
 * Render: npx remotion still Thumbnail --props='{"data":{...}}' --output thumbnail.png
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  ThumbnailLayoutSchema,
  ThumbnailRampSchema,
  ThumbnailDataSchema,
} from "./schema";

export type ThumbnailLayout = z.infer<typeof ThumbnailLayoutSchema>;
export type ThumbnailRamp = z.infer<typeof ThumbnailRampSchema>;
export type ThumbnailData = z.infer<typeof ThumbnailDataSchema>;
