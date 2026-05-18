/**
 * PhotoMontage — rapid-fire image sequence with text overlays, chip counts,
 * date stamps. Each image gets the full BrandImage treatment (4-step pipeline).
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type { MontageImageSchema, PhotoMontageDataSchema } from "./schema";

export type MontageImage = z.infer<typeof MontageImageSchema>;
export type PhotoMontageData = z.infer<typeof PhotoMontageDataSchema>;
