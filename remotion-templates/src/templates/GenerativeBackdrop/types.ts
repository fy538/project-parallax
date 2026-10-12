/**
 * GenerativeBackdrop — manifest-facing template for the generative flow field.
 *
 * Wraps the shared `GenerativeField` component (src/components/GenerativeField)
 * as a placeable, data-driven segment. The atmospheric hold-beat backdrop for
 * diffusion / contagion / trade-spread / "the idea permeates" moments.
 *
 * EDITORIAL GATING: rare — ≈1 per episode (see GenerativeField's note and the
 * M-GENERATIVE-OVERUSE lint). On every hold beat it reads as a screensaver.
 *
 * Type is derived from the Zod schema (z.infer) so it can never drift from
 * validation. Field docs live on GenerativeBackdropSchema in schema.ts.
 */
import type { z } from "zod";
import type { GenerativeBackdropSchema } from "./schema";

export type GenerativeBackdropData = z.infer<typeof GenerativeBackdropSchema>;
