/**
 * TelegramCable template types.
 *
 * Diplomatic cable register — typewriter monospace, ALL-CAPS body,
 * double-spaced, header block (FROM/TO/SUBJECT/DATE), classification
 * stamps (TOP SECRET / SECRET / DECLASSIFIED), file number, BEGIN/END
 * markers, punch holes, onionskin/carbon paper.
 *
 * Distinct from PrimarySourceReveal (formal document text — treaties,
 * speeches). TelegramCable is for BUREAUCRATIC document register —
 * cables, dispatches, ExComm records. Different editorial weight: the
 * format itself signals "primary source unfiltered."
 */

import type { z } from "zod";
import type {
  CableAnnotationSchema,
  CableRedactionSchema,
  TelegramCableDataSchema,
} from "./schema";

export type CableAnnotation = z.infer<typeof CableAnnotationSchema>;
export type CableRedaction = z.infer<typeof CableRedactionSchema>;
export type TelegramCableData = z.infer<typeof TelegramCableDataSchema>;
