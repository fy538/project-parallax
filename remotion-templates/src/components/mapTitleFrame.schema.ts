/**
 * Zod schema for MapTitleConfig — shared across the 7 full-bleed map
 * templates so the placement contract stays consistent.
 *
 * Mirrors `MapTitleConfig` in MapTitleFrame.tsx (v2, May 14 2026 redesign).
 * Spread into a template's data schema as:
 *
 *   mapTitle: MapTitleConfigSchema.optional(),
 *
 * The runtime default is `{ placement: "auto" }` — the title floats in the
 * corner with maximum clearance from highlighted features. Omit the field
 * entirely to accept the default.
 *
 * v1 (band/cartouche/inline modes + treatments) was removed May 14 2026
 * after catalog review found the bands looked like UI chrome rather than
 * editorial framing. See MapTitleFrame.tsx Design section.
 */

import { z } from "zod";

export const MapTitleConfigSchema = z.object({
  placement: z
    .enum(["top-left", "top-right", "bottom-left", "bottom-right", "auto"])
    .optional(),
});
