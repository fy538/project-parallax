/**
 * Helper utilities for AtlasPlate annotations — keyed independently of
 * the React rendering so the camera/layout code can build keys and
 * compute timing without pulling in component imports.
 *
 * Extracted from AtlasPlate.tsx (May 2026 split). Kept in `templates/
 * AtlasPlate/` because the semantics are template-specific:
 * `phase`-shorthand resolution against `phaseWindows` is only valid for
 * AtlasPlate's phase model. The Mapbox map-template path uses its own
 * `resolveTiming` in `MapAnnotations`.
 */

import type { MapAnnotation } from "../../components/MapAnnotations.types";
import { layout } from "../../design/theme";
import type { PhaseWindow } from "./atlasCamera";

/**
 * Content-derived key for an annotation. Array-index keys cause React
 * to reuse sub-components incorrectly when the data file's annotation
 * order changes during preview iteration (visible as: edit one
 * annotation, a *different* one appears to move). Anchor + label is
 * unique enough in practice.
 */
export const annotationKey = (ann: MapAnnotation): string =>
  `ann-${ann.at[0].toFixed(3)},${ann.at[1].toFixed(3)}-${ann.label}`;

/**
 * Resolve an annotation's frame window. Precedence:
 *   1. Explicit `appearAtSec` / `exitAtSec` (seconds, converted to frames).
 *   2. `phase` shorthand — uses the matching `PhaseWindow`.
 *   3. Default — the full composition duration (annotation is always on).
 *
 * Same semantics as `MapAnnotations.resolveTiming`, scoped to AtlasPlate's
 * phase model.
 */
export const resolveAnnotationFrames = (
  annotation: MapAnnotation,
  compositionDurationFrames: number,
  phaseWindows: PhaseWindow[],
): { startFrame: number; endFrame: number } => {
  if (annotation.appearAtSec !== undefined || annotation.exitAtSec !== undefined) {
    return {
      startFrame:
        annotation.appearAtSec !== undefined
          ? Math.round(annotation.appearAtSec * layout.fps)
          : 0,
      endFrame:
        annotation.exitAtSec !== undefined
          ? Math.round(annotation.exitAtSec * layout.fps)
          : compositionDurationFrames,
    };
  }
  if (annotation.phase !== undefined && phaseWindows[annotation.phase]) {
    return {
      startFrame: phaseWindows[annotation.phase].startFrame,
      endFrame: phaseWindows[annotation.phase].endFrame,
    };
  }
  return { startFrame: 0, endFrame: compositionDurationFrames };
};
