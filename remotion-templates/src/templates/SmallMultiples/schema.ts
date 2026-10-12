/**
 * Zod schema for SmallMultiples template.
 *
 * A grid of synchronized line-chart cells — same chart type, same x and
 * (optionally) y axes, applied to N different entities. The structural
 * comparison form: "all G7 members 1950–2024", "every US election since
 * 1980", "GDP trajectories of post-Soviet states." The NYT Upshot /
 * Economist / FT signature for comparison-at-a-glance.
 *
 * Each cell renders a single line series. Optional per-cell annotations
 * (highlight points, accent emphasis) let you call out the structural
 * commonality or the contrarian outlier.
 *
 * See: project/PARALLAX_VISUAL_VOCABULARY.md — SmallMultiples entry.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

// ── Data point ─────────────────────────────────────────────────────────────

export const SmallMultiplesPointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

// ── Cell ───────────────────────────────────────────────────────────────────

export const SmallMultiplesCellSchema = z.object({
  /** Cell title — typically the entity name (country, decade, election). */
  title: z.string(),
  /** Optional sub-title shown in small caps beneath the title. */
  subtitle: z.string().optional(),
  /** Ordered data points. Min 2 — a line needs two points. */
  data: z.array(SmallMultiplesPointSchema).min(2),
  /**
   * Highlight a single point (e.g., the crisis year, the year the metric
   * crossed a threshold). Annotated with a small dot + value label.
   */
  highlight: z
    .object({
      x: z.number(),
      label: z.string().optional(),
    })
    .optional(),
  /**
   * Accent emphasis. When true, this cell renders in the accent color (gold)
   * instead of the neutral ink — used to draw the eye to the contrarian
   * case or the focal example.
   */
  accent: z.boolean().optional(),
  /**
   * Optional inline annotation rendered in the upper-right corner of the
   * cell. Useful for adding a small numeric or label (e.g., "+248%").
   */
  badge: z.string().optional(),
});

// ── Top-level data ─────────────────────────────────────────────────────────

export const SmallMultiplesDataSchema = z.object({
  /** Episode slug. */
  episode: z.string(),
  /** Title (HeaderStrip). */
  title: z.string().optional(),
  /** Subtitle (italic serif beneath title). */
  subtitle: z.string().optional(),
  /** Source attribution. */
  source: z.string().optional(),
  /** Clip duration in seconds. Default 12s. */
  durationSec: z.number().positive().optional(),

  /** Cells in row-major order (left-to-right, top-to-bottom). Min 2 — a
   * single cell doesn't make sense as small multiples. */
  cells: z.array(SmallMultiplesCellSchema).min(2),

  /**
   * Explicit grid dimensions. When unset, auto-derives a grid close to
   * square (rows ≈ cols). Author this when you need a specific shape
   * (e.g., 2×3 to match a 6-cell argument).
   */
  grid: z
    .object({
      cols: z.number().int().positive(),
      rows: z.number().int().positive(),
    })
    .optional(),

  /**
   * Share the y-axis range across all cells (default true). When true,
   * patterns are directly comparable; when false, each cell auto-scales to
   * its own data (good for showing shape regardless of magnitude).
   */
  sharedY: z.boolean().optional(),
  /**
   * Share the x-axis range across all cells (default true). Set false only
   * when cells are on different time windows (rare).
   */
  sharedX: z.boolean().optional(),
  /** X-axis label (shown once, under the grid). */
  xLabel: z.string().optional(),
  /** Y-axis label (shown once, left of the grid). */
  yLabel: z.string().optional(),
  /**
   * Y-axis unit suffix (e.g., "%", "M", "$"). Appended to tick labels.
   */
  yUnit: z.string().optional(),
  /**
   * Number of y-axis ticks per cell. Default 3 (sparse — small multiples
   * want minimal chrome).
   */
  yTickCount: z.number().int().positive().optional(),
  /**
   * Reference line at y = N drawn across every cell (e.g., y=0 for
   * difference plots, y=100 for indexed values). Optional.
   */
  referenceY: z.number().optional(),

  /** Background variant. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block. */
  _direction: DirectionBlockSchema.optional(),
});

export const SmallMultiplesSchema = z.object({
  data: SmallMultiplesDataSchema,
});
