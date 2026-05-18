/**
 * FrameworkDiagram — side-by-side comparisons, flow diagrams, matrix/grid
 * layouts for analytical models.
 *
 * Types derived from Zod schemas (May 2026 audit #3 — see StatReveal for
 * the canonical pattern). What used to be 170 lines of hand-typed
 * interfaces is now a re-export shim — the schema is the single source of
 * truth. Field semantics live on `.describe()` calls in schema.ts.
 */

import type { z } from "zod";
import type {
  ComparisonColumnSchema,
  FlowNodeSchema,
  MatrixCellSchema,
  MatrixItemSchema,
  FrameworkPhaseSchema,
  EliminatedScenarioSchema,
  FrameworkDiagramDataSchema,
} from "./schema";

export type ComparisonColumn = z.infer<typeof ComparisonColumnSchema>;
export type FlowNode = z.infer<typeof FlowNodeSchema>;
export type MatrixCell = z.infer<typeof MatrixCellSchema>;
export type MatrixItem = z.infer<typeof MatrixItemSchema>;
export type FrameworkPhase = z.infer<typeof FrameworkPhaseSchema>;
export type EliminatedScenario = z.infer<typeof EliminatedScenarioSchema>;
export type FrameworkDiagramData = z.infer<typeof FrameworkDiagramDataSchema>;
