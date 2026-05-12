/**
 * Graticule — parallels-and-meridians overlay for map templates.
 *
 * On-brand because the channel is literally named *Parallax*: the graticule
 * is the cartographic grid that lets a viewer "read coordinates" off the
 * map. Faint ink strokes at default 10° spacing, with optional 30°
 * major-line emphasis (the Bartholomew/National Geographic convention).
 *
 * Dossier: references/template-research/map-annotations.md § Graticule
 */

import { z } from "zod";

export const GraticuleSchema = z.object({
  /**
   * Spacing between grid lines, in degrees. Default 10 (the
   * Bartholomew/National Geographic convention). Use 15 for sparser globe
   * shots; use 5 for tight regional views.
   */
  spacing: z.number().positive().optional(),
  /**
   * Opacity of minor lines (0–1). Default 0.10 — present but not loud.
   * Major lines (every 30°) render at 2× this value, capped at 0.25.
   */
  opacity: z.number().min(0).max(1).optional(),
  /**
   * Draw a darker stroke every 30° (the Equator, Tropics, Arctic Circle
   * etc. fall close to these). Default true.
   */
  emphasize30: z.boolean().optional(),
  /**
   * Stroke color override. Defaults to theme ink (light maps) or theme
   * bone (dark maps). Hex string. Use sparingly — graticule is usually
   * neutral by design.
   */
  color: z.string().optional(),
});

export type GraticuleConfig = z.infer<typeof GraticuleSchema>;
