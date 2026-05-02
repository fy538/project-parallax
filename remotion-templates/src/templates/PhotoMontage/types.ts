/**
 * PhotoMontage template types.
 *
 * Rapid-fire image sequence with text overlays, chip counts, date stamps.
 * Shows multiple related images in rhythmic succession with unified pacing.
 * Each image gets the full BrandImage treatment (4-step pipeline).
 */

export interface MontageImage {
  /** Path to image file (relative to public/) */
  src: string;
  /** Display duration in seconds */
  durationSec: number;
  /** Duotone ramp */
  treatment: "standard" | "conflict" | "editorial";
  /** Layout mode */
  compositeMode: "background" | "inset";
  /** Image opacity */
  compositeOpacity?: number;
  /** Text overlay */
  overlay?: {
    text: string;
    position: "bottom-left" | "bottom-right" | "center" | "top-right";
    style: "stat" | "label" | "caption";
  };
  /** Optional secondary overlay (e.g., date stamp) */
  secondaryOverlay?: {
    text: string;
    position: "top-left" | "top-right";
  };
}

export interface PhotoMontageData {
  episode: string;
  /** Optional title card before the sequence */
  title?: string;
  subtitle?: string;

  images: MontageImage[];

  /** Transition between images */
  transition: "cut" | "dissolve" | "wipe-left";
  /** Transition duration in seconds (default 0.3) */
  transitionDurationSec?: number;

  source?: string;
  durationSec?: number;
  backgroundTint?: string;
}
