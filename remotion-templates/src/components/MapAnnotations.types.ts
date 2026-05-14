/**
 * MapAnnotation — editorial overlay label for MapGL-based templates.
 *
 * Pinned to a lon/lat anchor (tracks the map camera), rendered with brand
 * typography, optional leader line. This is the FT/Reuters/NYT signature
 * that separates an "atlas plate" from a "Mapbox screenshot."
 *
 * Three hierarchies map to entrance roles:
 *   primary   → "hero"     — uppercase Plex Sans SemiBold (country/region scale)
 *   secondary → "content"  — sentence-case Plex Sans Medium (city/feature scale)
 *   tertiary  → "label"    — Plex Mono Regular (source notes, small annotations)
 *
 * Authoring shorthand: when `phase` is set, the template resolves it against
 * its phase windows to drive appearAtSec / exitAtSec automatically. When the
 * annotation should persist across the whole composition, omit `phase` and
 * `appearAtSec`/`exitAtSec`.
 *
 * Dossier: references/template-research/map-annotations.md
 */

import { z } from "zod";

export const MapAnnotationSchema = z.object({
  /** Lon/lat anchor — annotation tracks the map camera through phase changes. */
  at: z.tuple([z.number(), z.number()]),
  /** Primary label text. */
  label: z.string().min(1),
  /** Optional secondary line (Plex Mono, taupe). */
  sublabel: z.string().optional(),
  /** Editorial hierarchy. */
  hierarchy: z.enum(["primary", "secondary", "tertiary"]),
  /**
   * Optional pixel offset for the label from the anchor. When set, renders
   * a leader line from the anchor dot to the label. When unset, the label
   * sits directly above the anchor with a small gap.
   */
  leader: z
    .object({
      dx: z.number(),
      dy: z.number(),
    })
    .optional(),
  /** Text alignment relative to the label's position. Default "center". */
  align: z.enum(["left", "right", "center"]).optional(),
  /** Color treatment. accent = rust, mute = taupe, default = ink/bone. */
  emphasis: z.enum(["default", "accent", "mute"]).optional(),
  /**
   * Authoring shorthand: when set, the annotation appears during this phase
   * index only (resolved by the parent template against its phase windows).
   * Mutually exclusive with explicit appearAtSec/exitAtSec.
   */
  phase: z.number().int().nonnegative().optional(),
  /** Explicit appear time in seconds (overrides phase shorthand). */
  appearAtSec: z.number().nonnegative().optional(),
  /** Explicit exit time in seconds (overrides phase shorthand). */
  exitAtSec: z.number().nonnegative().optional(),
  /**
   * Priority for the greedy auto-placer (May 13, 2026 — Layer A + D of the
   * label-collision defense). Higher numbers place FIRST and get the
   * preferred (center) position; lower numbers get pushed to surrounding
   * positions or dropped when the layout is over-constrained. Default 0.
   * Use 10+ for must-show labels (the focal-region annotations), 1-5 for
   * supporting context, 0 for "show if there's room."
   *
   * The auto-placer sorts annotations by `priority` DESC, places each at
   * one of 9 candidate positions (center + 8 around), and picks the first
   * non-overlapping slot. Manual `leader.dx/dy` always wins (when set).
   *
   * See: references/template-research/map-annotations.md § Auto-placement.
   */
  priority: z.number().optional(),
});

export type MapAnnotation = z.infer<typeof MapAnnotationSchema>;

export const MapAnnotationListSchema = z.array(MapAnnotationSchema);
