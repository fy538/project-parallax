/**
 * VennDiagram template types.
 *
 * Two or three overlapping circles exposing exclusive and shared regions
 * of a concept space. The canonical Parallax form for overlapping
 * sovereignty, alliance membership structures, and dual-commitment tensions.
 *
 * The editorial payload lives in the intersection — if the overlap is empty
 * or trivial, consider DataChart (non-overlapping) or MatrixHeatmap (>3 sets).
 */

import type { z } from "zod";
import type { VennDiagramDataSchema, VennSetSchema, VennIntersectionSchema } from "./schema";

export type VennDiagramData = z.infer<typeof VennDiagramDataSchema>;
export type VennSet = z.infer<typeof VennSetSchema>;
export type VennIntersection = z.infer<typeof VennIntersectionSchema>;
