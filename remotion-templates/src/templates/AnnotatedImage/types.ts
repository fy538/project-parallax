/**
 * AnnotatedImage — image with animated callout labels.
 *
 * A brand-treated image fills the frame, with callout labels
 * animating in at specific positions to explain what the viewer
 * is looking at. Each callout has a dot, a leader line, and a
 * text label that fades in sequentially.
 *
 * Use cases: chip die shots, satellite imagery, historical photos,
 * military hardware, geographic features.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface Callout {
  /** Position of the callout dot (0-100 percentage of image width/height) */
  x: number;
  y: number;
  /** Label text */
  label: string;
  /** Optional detail text below the label */
  detail?: string;
  /** Label placement relative to the dot */
  placement?: "top" | "bottom" | "left" | "right";
  /** Length of the leader line in pixels (default: 60) */
  leaderLength?: number;
  /** Optional color override for the dot and leader line */
  color?: string;
}

export interface AnnotatedImageData {
  episode: string;
  title: string;
  subtitle?: string;

  /** Image source (staticFile path or URL) */
  imageSrc: string;
  /** Image alt text */
  imageAlt?: string;

  /** Duotone ramp for brand treatment (default: "standard") */
  duotoneRamp?: "standard" | "conflict" | "editorial";

  /** Callout annotations */
  callouts: Callout[];

  /** Source attribution */
  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}
