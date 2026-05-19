/**
 * MathCrossfade — engine for animated multi-step math.
 *
 * Renders a sequence of LaTeX formulas, crossfading between adjacent
 * steps on a time-driven schedule. This single component covers all three
 * Phase 2 editorial primitives:
 *
 *   · Step-by-step derivation — each step is a different formula
 *   · Term-highlight          — an intermediate step adds `\textcolor{HEX}{T}`
 *                                around the highlighted term
 *   · Substitution            — an intermediate step replaces a variable
 *                                in the TeX source with its numeric value
 *
 * All three are authored as a sequence of fully-rendered KaTeX strings;
 * the component crossfades them in opacity. Identical positions across
 * steps stay visually anchored because KaTeX is deterministic — the eye
 * reads "the equation transforms" without needing per-symbol DOM tracking.
 *
 * Brand color hex codes for `\textcolor{}` in TeX:
 *   gold      #C4A747   — primary accent, "look here"
 *   rust      #A64D46   — china/danger semantic
 *   dustblue  #7AA3C9   — us/cool semantic
 *   walnut    #5C4A3D   — secondary emphasis, faded weight
 *   ink       #1C1814   — body color (default; rarely needed explicitly)
 *
 * Step timing model: each step has a `holdSec` (how long it stays solo
 * at full opacity). The crossfade to the next step starts `crossfadeSec`
 * before the next step's solo window begins. Composition duration is
 * sum(holdSec) for all steps; the last step's holdSec covers the final
 * dwell + the parent template's exit fade.
 *
 *   step.startSec  = sum(holdSec[0..i-1])
 *   step solo:       [startSec, startSec + holdSec - crossfadeSec)
 *   crossfade out:   [startSec + holdSec - crossfadeSec, startSec + holdSec)
 *   step N+1 solo:   begins at step N's startSec + holdSec
 *
 * Drives off the frame clock via `useCurrentFrame`. Position is centered
 * absolutely so each step lands at the same baseline; differing widths
 * are tolerated visually because the surrounding chrome doesn't pin to
 * the math's extent.
 */

import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { MathExpression } from "./MathExpression";
import { palette, sec } from "../design/theme";
import { CLAMP_CUBIC } from "../utils/animation";
import { interpolate } from "remotion";

export interface MathStep {
  /** LaTeX source for this step. KaTeX dialect. */
  formula: string;
  /** Seconds this step holds at full opacity before crossfading to the next.
   *  The final step's holdSec covers the dwell before the parent's exit fade. */
  holdSec: number;
  /** Optional plain-language gloss shown below the equation. */
  annotation?: string;
}

export interface MathCrossfadeProps {
  /** Ordered steps. Minimum 1; with 1 step the component renders statically. */
  steps: MathStep[];
  /** Pixel font size at the KaTeX root. Default 56 (slightly smaller than
   *  MathReveal's 72 to leave room for the step counter + annotation). */
  fontSize?: number;
  /** Crossfade duration in seconds. Default 0.5. Set 0 for hard cuts. */
  crossfadeSec?: number;
  /** Display mode (centered, larger operators). Default true. */
  display?: boolean;
  /** Text color for the math. Defaults to `palette.ink`. */
  color?: string;
  /** Optional callback fired with the active step index (for parent UI like
   *  step counters). Use the exported `activeStepIndex()` helper for the
   *  same calculation inside parent components. */
  onActiveStepChange?: (index: number) => void;
}

/**
 * Pure helper — returns the currently-active step index at a given frame.
 * Exported so parent templates (MathDerivation) can render a step counter
 * synced to the same math the engine is rendering, without duplicating
 * the timing math.
 */
export function activeStepIndex(
  steps: Pick<MathStep, "holdSec">[],
  frame: number,
): number {
  let acc = 0;
  for (let i = 0; i < steps.length; i++) {
    const end = acc + sec(steps[i].holdSec);
    if (frame < end) return i;
    acc = end;
  }
  return steps.length - 1; // past the end: stick on the last step
}

/**
 * Pure helper — total duration in frames for a steps array.
 * Useful for `calculateMetadata` in template index.tsx.
 */
export function crossfadeDurationFrames(
  steps: Pick<MathStep, "holdSec">[],
): number {
  return steps.reduce((acc, s) => acc + sec(s.holdSec), 0);
}

/**
 * Compute per-step opacity at the given frame.
 *
 * Returns an array of opacities — one per step. The component renders ALL
 * steps stacked; opacity drives which is visible. During a crossfade window,
 * two adjacent steps both have non-zero opacity.
 *
 * Exported for unit testing the timing math without rendering.
 */
export function stepOpacities(
  steps: Pick<MathStep, "holdSec">[],
  frame: number,
  crossfadeSec: number,
): number[] {
  const crossfadeFrames = sec(crossfadeSec);
  const opacities = steps.map(() => 0);
  let cumulativeStartFrame = 0;

  for (let i = 0; i < steps.length; i++) {
    const startFrame = cumulativeStartFrame;
    const holdFrames = sec(steps[i].holdSec);
    const endFrame = startFrame + holdFrames;

    if (frame < startFrame) {
      // This step hasn't appeared yet.
      cumulativeStartFrame = endFrame;
      continue;
    }

    if (frame >= endFrame) {
      // Step is past its hold. The last step sticks at opacity 1 — the
      // parent template owns the exit fade, and an invisible-after-end
      // result would leave a blank frame between the last step and the
      // parent's exitFade tail. (Bug caught in dev tracing: at frame past
      // the last endFrame, ALL opacities went to 0.)
      if (i === steps.length - 1) {
        opacities[i] = 1;
      }
      cumulativeStartFrame = endFrame;
      continue;
    }

    // Frame is somewhere in [startFrame, endFrame).
    // Sub-window 1: crossfade-in from the previous step (only if i > 0
    //   and we're at the very start of this step's window AND the
    //   previous step had a hold). Crossfade window:
    //     [startFrame - crossfadeFrames/2, startFrame + crossfadeFrames/2]
    //   But simpler: the crossfade window is the last `crossfadeFrames`
    //   of the PREVIOUS step's holdFrames, OR equivalently the first
    //   `crossfadeFrames` of THIS step's startFrame onward.
    //
    // We adopt the "crossfade overlaps the boundary symmetrically" model:
    // for the boundary at `startFrame` between step i-1 and step i, both
    // are visible in the window [startFrame - crossfadeFrames, startFrame).
    //
    // (Re-reading: simpler model — crossfade happens in the LAST window
    // of the outgoing step, with the incoming step fading in at the same
    // time. So incoming step i has opacity > 0 starting at
    // `startFrame - crossfadeFrames`. We handle that below.)
    opacities[i] = 1;
    cumulativeStartFrame = endFrame;
  }

  // Now overlay the crossfade-in for each step (i > 0): in the window
  // [stepStart - crossfadeFrames, stepStart], step i fades 0→1 AND
  // step i-1 fades 1→0.
  cumulativeStartFrame = 0;
  for (let i = 0; i < steps.length; i++) {
    const stepStart = cumulativeStartFrame;
    const holdFrames = sec(steps[i].holdSec);

    if (i > 0 && crossfadeFrames > 0) {
      const fadeStart = stepStart - crossfadeFrames;
      if (frame >= fadeStart && frame < stepStart) {
        const t = (frame - fadeStart) / crossfadeFrames;
        opacities[i] = t;       // incoming
        opacities[i - 1] = 1 - t; // outgoing
      }
    }

    cumulativeStartFrame = stepStart + holdFrames;
  }

  return opacities;
}

export const MathCrossfade: React.FC<MathCrossfadeProps> = ({
  steps,
  fontSize = 56,
  crossfadeSec = 0.5,
  display = true,
  color = palette.ink,
  onActiveStepChange,
}) => {
  const frame = useCurrentFrame();

  // Compute opacities per frame — pure function, no allocations beyond
  // the array itself. Cheap to recompute every frame.
  const opacities = useMemo(
    () => stepOpacities(steps, frame, crossfadeSec),
    [steps, frame, crossfadeSec],
  );

  // Notify parent of active step changes (for step counter UI). Computed
  // outside the effect to avoid an extra render cycle.
  const active = activeStepIndex(steps, frame);
  React.useEffect(() => {
    onActiveStepChange?.(active);
  }, [active, onActiveStepChange]);

  // Apply a tiny cubic ease to opacity so the crossfade doesn't read as
  // linear (which feels slightly mechanical). Same easing as MathReveal.
  const eased = (o: number) => interpolate(o, [0, 1], [0, 1], CLAMP_CUBIC);

  return (
    <div
      style={{
        position: "relative",
        // Set a min-height matching the math's approximate vertical extent
        // so neighboring chrome (annotation, step counter) doesn't reflow
        // between steps. KaTeX displaystyle math is typically 1.4×fontSize
        // tall, with extra space for descenders / fraction stacks.
        minHeight: fontSize * 1.8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {steps.map((step, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            opacity: eased(opacities[i]),
            // pointerEvents off to keep stacked invisible steps from
            // intercepting hit-testing in Studio's prop editor.
            pointerEvents: opacities[i] > 0 ? "auto" : "none",
          }}
        >
          <MathExpression
            formula={step.formula}
            reveal={1}
            fontSize={fontSize}
            display={display}
            color={color}
          />
        </div>
      ))}
    </div>
  );
};
