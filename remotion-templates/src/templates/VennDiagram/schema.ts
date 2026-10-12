/**
 * Zod schema for VennDiagram template.
 *
 * Renders 2–3 overlapping circles exposing the exclusive and shared
 * regions of a concept space. The canonical Parallax use case is
 * overlapping sovereignty / alliance membership structures where the
 * intersection IS the editorial payload — dual commitments, contested
 * jurisdictions, or structural tensions that arise from belonging to
 * multiple institutions simultaneously.
 *
 * Editorial doctrine: the intersection label and items should carry the
 * argument. If your intersection is empty or trivial, consider a different
 * template (DataChart for non-overlapping categories, MatrixHeatmap for
 * more than 3 sets).
 *
 * See: references/template-research/venn-diagram.md
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const VennSetSchema = z.object({
  /** Unique identifier for the set (used to reference in intersections). */
  id: z.string(),
  /** Display label for the set ("EU Member", "NATO Member"). */
  label: z.string(),
  /**
   * Hex fill color for this set. Defaults to palette.dustblue (set[0])
   * or palette.gold (set[1]) if omitted. For a third set, defaults to
   * palette.umber.
   */
  color: z.string().optional(),
  /**
   * Bullet points shown in the EXCLUSIVE region of this set — items that
   * belong to this set but NOT to any intersecting set. Keep ≤ 5 items;
   * the exclusive region has limited text real estate.
   */
  items: z.array(z.string()),
});

export const VennIntersectionSchema = z.object({
  /**
   * Which set IDs overlap in this region. Must be 2 or 3 IDs,
   * each matching a `sets[].id` value in the parent data object.
   */
  setIds: z.array(z.string()).min(2).max(3),
  /**
   * Short label for the intersection region ("EU + NATO", "All Three").
   * Rendered in mono above the intersection items.
   */
  label: z.string().optional(),
  /**
   * Bullet points that belong to this intersection region — items that
   * are true ONLY for members of all referenced sets simultaneously.
   * Keep ≤ 4 items; the intersection lens has the tightest real estate.
   */
  items: z.array(z.string()),
});

export const VennDiagramDataSchema = z.object({
  /** Episode slug or "catalog" for reference compositions. */
  episode: z.string(),
  /** Primary title — should name the structural tension, not the topic. */
  title: z.string(),
  /** Optional subtitle providing historical or geographic context. */
  subtitle: z.string().optional(),
  /** Source attribution rendered at bottom of frame. */
  source: z.string().optional(),
  /** Total duration in seconds. Default 14s. */
  durationSec: z.number().positive().optional(),
  /** Two or three sets. Three-set layout shifts to a triangular arrangement. */
  sets: z.array(VennSetSchema).min(2).max(3),
  /**
   * Intersection regions. For 2-set diagrams: one intersection (setIds=[A,B]).
   * For 3-set diagrams: up to four intersections (AB, AC, BC, ABC). At minimum
   * one intersection must be defined.
   */
  intersections: z.array(VennIntersectionSchema).min(1),
  /** Background mode. Default "light". */
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  /** Direction block for atmosphere, drift, sync points. */
  _direction: DirectionBlockSchema.optional(),
});

export const VennDiagramSchema = z.object({ data: VennDiagramDataSchema });
