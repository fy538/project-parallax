/**
 * useCameraStagger — codifies L56 ("camera moves first, content fades in 0.8s later").
 *
 * Returns the three start frames a camera-driven template needs to keep its
 * narration in sync with the visual:
 *
 *   1. cameraStart — when the camera (pan/zoom/orbit) begins.
 *   2. geometryStart — when shapes/arcs/markers begin drawing
 *      (~40% into the camera move; the camera is already heading the right way).
 *   3. labelStart — when text labels and the phase title appear
 *      (~75% settled, so the eye reads "US → Taiwan" while the view shows Taiwan,
 *      not the mid-Atlantic).
 *
 * Without this discipline you get the desync described in L56: text appears
 * simultaneously with motion, viewers read the words against the wrong frame.
 *
 * All inputs are in seconds; outputs are in frames at the composition's fps.
 *
 * Usage:
 *   const { cameraStart, geometryStart, labelStart } = useCameraStagger({
 *     narrationStartSec: 0,
 *   });
 *   // pass cameraStart to the camera animation, geometryStart to draw-in
 *   // animations, labelStart to <FadeIn startFrame={labelStart}>.
 *
 * Override individual gaps for episodes where the script's pacing diverges
 * from the default rhythm (e.g. urgent PACE may want shorter gaps).
 */

import { useVideoConfig } from "remotion";

export interface CameraStaggerOptions {
  /** When the segment begins. Default: 0 (start of composition). */
  narrationStartSec?: number;
  /** Seconds of pure camera movement before any geometry draws. Default: 0.4 (L56). */
  geometryGapSec?: number;
  /** Seconds of camera+geometry before labels/titles appear. Default: 0.8 (L56). */
  labelGapSec?: number;
}

export interface CameraStaggerResult {
  /** Frame at which the camera animation begins. */
  cameraStart: number;
  /** Frame at which arcs / shapes / draw-ins begin. */
  geometryStart: number;
  /** Frame at which labels / phase titles fade in. */
  labelStart: number;
}

export const useCameraStagger = (
  options: CameraStaggerOptions = {}
): CameraStaggerResult => {
  const { fps } = useVideoConfig();
  const {
    narrationStartSec = 0,
    geometryGapSec = 0.4,
    labelGapSec = 0.8,
  } = options;

  const sec = (s: number) => Math.round(s * fps);

  return {
    cameraStart: sec(narrationStartSec),
    geometryStart: sec(narrationStartSec + geometryGapSec),
    labelStart: sec(narrationStartSec + labelGapSec),
  };
};
