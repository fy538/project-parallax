/**
 * ImageComposite template types.
 *
 * Defines data structures for rendered photographs with duotone pipeline.
 * Used for Time Collapse cinematic moments and historical photo segments.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface ImageCompositeData {
  episode: string;
  title?: string;
  subtitle?: string;
  caption?: string;
  /** Path to the image file (relative to public/) */
  imagePath: string;
  /** Layout variant */
  variant: "background" | "inset" | "portrait";
  /** Duotone ramp to apply */
  duotone?: "standard" | "conflict" | "editorial";
  /** Override grain opacity (default: 0.12) */
  grainOpacity?: number;
  /** Text position for background variant */
  textPosition?: "bottom-left" | "bottom-right" | "center";
  /** For portrait: person name */
  personName?: string;
  /** For portrait: person title/role */
  personTitle?: string;
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}
