/**
 * DuelingFrameworks — two analytical frameworks in head-to-head comparison.
 *
 * Two rendering modes:
 *
 * ═══ STATIC MODE (default, backward compatible) ═══
 * Five animation phases:
 * 1. Intro (~1s): Title + subtitle fade/slide in
 * 2. Framework A (~3s): Left side reveals — name, tenets (staggered), color-coded accent
 * 3. Framework B (~3s): Right side reveals — same treatment, right-aligned
 * 4. Scoring (~3s): Both visible, animated horizontal bars grow, verdict appears
 * 5. Exit (0.5s): Fade out
 *
 * ═══ CINEMATIC MODE (cinematicMode: true) ═══
 * Horizontal camera tracking with depth-of-field:
 * 1. Title fade (0.8s)
 * 2. Camera on Framework A (sequential tenet build with focus isolation)
 * 3. Pan to center VS clash (both partially visible, divider glows)
 * 4. Camera on Framework B (sequential tenet build)
 * 5. Pull back to overview (scoring phase, both frameworks visible)
 *
 * The cinematic mode uses a wider virtual canvas (2x viewport) with the camera
 * tracking horizontally. Non-focused elements are dimmed + blurred.
 *
 * Bilingual support in both modes.
 */

// @composition-animation: delegated — pure router; CinematicDuelingFrameworks
// and StaticDuelingFrameworks each call useCompositionAnimation themselves.

// Import the sub-modules and re-export the main component.
import React from "react";
import { CinematicDuelingFrameworks } from "./CinematicDuelingFrameworks";
import { StaticDuelingFrameworks } from "./StaticDuelingFrameworks";
import type { DuelingFrameworksData } from "./types";

export const DuelingFrameworks: React.FC<{ data: DuelingFrameworksData }> = ({
  data,
}) => {
  if (data.cinematicMode) {
    return <CinematicDuelingFrameworks data={data} />;
  }
  return <StaticDuelingFrameworks data={data} />;
};
