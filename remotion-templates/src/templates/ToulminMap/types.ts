/**
 * ToulminMap template types.
 *
 * All types are derived from the Zod schema via z.infer<> — no hand-declared
 * interfaces. The six-element Toulmin model:
 *
 *   Data → (via Warrant) → Claim
 *               ↓                ↓
 *            Backing         Qualifier
 *
 *                          → Rebuttal (UNLESS…)
 *
 * The WARRANT is the editorial focal point: making the logical bridge explicit
 * is Parallax's contribution over a plain data-to-conclusion slide.
 *
 * Reference: Toulmin, S. (1958). The Uses of Argument. Cambridge University Press.
 */

import type { z } from "zod";
import type { ToulminMapDataSchema } from "./schema";

export type ToulminMapData = z.infer<typeof ToulminMapDataSchema>;
