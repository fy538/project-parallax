/**
 * Zod schemas for PhilosophicalFamilyTree template.
 *
 * ArcDiagram-inspired but with year-based x-axis: nodes are positioned
 * proportionally by their `year` field, encoding actual historical distance
 * between thinkers rather than equal spacing.
 *
 * Editorial use: intellectual genealogy diagrams — "Game theory's lineage:
 * von Neumann → Nash → Schelling → Axelrod → Ostrom."
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

export const PhilosophicalFamilyTreeThinkerSchema = z.object({
  /** Unique identifier used by influences.from / influences.to */
  id: z.string(),
  /** Display name — use ALLCAPS for the Parallax "monograph label" register */
  name: z.string(),
  /** One-line doctrine description, shown below the node */
  doctrine: z.string(),
  /** Year of publication / major contribution — drives x-axis position */
  year: z.number().int(),
  /** Optional brand palette color override for this node's dot + text */
  color: z.string().optional(),
  /** Primary = larger dot + halo; secondary = smaller dot, no halo */
  importance: z.enum(["primary", "secondary"]).optional(),
});

export const PhilosophicalFamilyTreeInfluenceSchema = z.object({
  /** id of the source thinker */
  from: z.string(),
  /** id of the destination thinker */
  to: z.string(),
  /**
   * Influence type drives visual style:
   * - "borrowed"    → solid gold stroke (direct intellectual debt)
   * - "transformed" → solid dustblue stroke (idea reinterpreted)
   * - "critique"    → dashed rust stroke (productive opposition)
   * - "parallel"    → dashed umber stroke, low opacity (independent convergence)
   */
  type: z.enum(["borrowed", "transformed", "critique", "parallel"]),
  /** Optional arc label — sits at the arc apex midpoint */
  label: z.string().optional(),
  /** Optional year override for the connection event itself */
  year: z.number().int().optional(),
});

export const PhilosophicalFamilyTreeDataSchema = z.object({
  episode: z.string(),
  title: z.string().optional(),
  subtitle: z.string().optional(),
  source: z.string().optional(),
  durationSec: z.number().positive().optional(),
  backgroundVariant: z.enum(["light", "dark"]).optional(),
  _direction: DirectionBlockSchema.optional(),
  thinkers: z
    .array(PhilosophicalFamilyTreeThinkerSchema)
    .min(2, {
      message:
        "PhilosophicalFamilyTree requires at least two thinkers — a single node has no lineage to show.",
    }),
  influences: z
    .array(PhilosophicalFamilyTreeInfluenceSchema)
    .min(1, {
      message:
        "PhilosophicalFamilyTree requires at least one influence arc to show intellectual connections.",
    }),
});

export const PhilosophicalFamilyTreeSchema = z.object({
  data: PhilosophicalFamilyTreeDataSchema,
});
