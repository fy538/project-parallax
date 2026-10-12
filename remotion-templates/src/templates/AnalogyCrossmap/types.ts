/**
 * AnalogyCrossmap template types.
 *
 * Structural mapping between two domains in a bounded analogy. Source domain
 * (left column) connected to target domain (right column) by curved SVG paths.
 * The editorial revelation moment is when "break" connections appear, naming
 * where the analogy fails — the "bounded analogy" form core to Parallax.
 *
 * All types are derived via z.infer<> from schema.ts. No hand-declared
 * interfaces; shape is single-sourced from the Zod schema.
 */

import type { z } from "zod";
import type { AnalogyCrossmapDataSchema } from "./schema";

export type AnalogyCrossmapData = z.infer<typeof AnalogyCrossmapDataSchema>;
