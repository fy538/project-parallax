/**
 * Composition base — shared Zod fragments for template `data` schemas.
 *
 * Before this module, every template's `schema.ts` repeated the same 7
 * editorial-shell fields under `data: z.object({...})`:
 *
 *   episode, title, subtitle, source, durationSec, backgroundVariant, _direction
 *
 * The .describe() text on `title` drifted between copies (canonical phrasing
 * vs. local rewrites) and the `?? / ||` inconsistency on `durationSec` was
 * the same story at the schema level. This module locks the canonical
 * description and shape so editorial-shell drift can't accumulate.
 *
 * Usage (in a template's schema.ts):
 *
 *   import { compositionBase, holdAfterRevealSec } from "../_shared/compositionBase";
 *   import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";
 *
 *   export const BumpChartSchema = z.object({
 *     data: z.object({
 *       ...compositionBase,
 *       holdAfterRevealSec, // optional — include when the template supports it
 *       // ── template-specific fields below ──
 *       periods: z.array(z.string()).min(2),
 *       entities: z.array(BumpChartEntitySchema).min(2),
 *       // ...
 *     }),
 *   });
 *
 * The Zod object-spread (`...compositionBase`) is well-supported and lets
 * each template override any field by re-declaring it AFTER the spread.
 *
 * Note: `DirectionBlockSchema` lives at `src/hooks/directionBlock.schema.ts`
 * (preserved as a separate import so the schema there can evolve with the
 * DIR: vocabulary without churning every template).
 *
 * ── Migration status (May 17, 2026) ─────────────────────────────────────────
 * Templates migrated to use this fragment:
 *   - BumpChart, StatReveal (demonstration cases)
 *
 * Templates still using the inline 7-field pattern (~43 schemas): migrate
 * opportunistically when touching the schema for other reasons. Bulk
 * migration deferred because each schema has subtle field overrides
 * (custom `.describe()` text, alternate `enum(["dark","light"])` vs
 * `enum(["light","dark"])` order, omitted fields) that need per-file
 * judgment. Zod's object-spread semantics mean migration is safe: any
 * field re-declared AFTER the spread overrides the canonical version.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

/**
 * The 7 editorial-shell fields every template carries on its `data` object.
 * Spread this into `z.object({ ...compositionBase, ... })`.
 */
export const compositionBase = {
  episode: z
    .string()
    .describe("Episode slug displayed in HeaderStrip metadata."),
  title: z
    .string()
    .describe(
      "State the finding, not the topic. Write: 'China overtakes Japan as World #2 GDP in 2010' " +
        "not 'GDP rankings over time'. The title IS the editorial argument.",
    ),
  subtitle: z
    .string()
    .optional()
    .describe("Optional subtitle adding analytical context."),
  source: z
    .string()
    .optional()
    .describe("Data source attribution shown at bottom-right."),
  durationSec: z
    .number()
    .positive()
    .optional()
    .describe(
      "Total composition duration in seconds. Default per-template; see the template's " +
        "registration in index.tsx (standardMetadata fallback).",
    ),
  backgroundVariant: z
    .enum(["light", "dark"])
    .optional()
    .describe(
      "Background theme variant — 'light' (default) or 'dark'. Per-segment overrides come " +
        "from `_direction.backgroundMode` or the manifest's beat-level setting.",
    ),
  _direction: DirectionBlockSchema.optional(),
} as const;

/**
 * `holdAfterRevealSec` — opt-in field for templates that animate content in
 * and then need a deliberate pause before the exit fade. Spread or attach
 * individually depending on the template's preference.
 */
export const holdAfterRevealSec = z
  .number()
  .min(0)
  .max(10)
  .optional()
  .describe(
    "Deliberate pause (seconds) after content finishes animating in, before the exit fade. " +
      "Must fit within durationSec. Default: 0.",
  );
