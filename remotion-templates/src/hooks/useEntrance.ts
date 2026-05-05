/**
 * useEntrance — semantic element entrance presets.
 *
 * Instead of each template choosing between fadeIn, heroSpring, slideIn,
 * or raw interpolate, they declare the *role* of the element:
 *
 *   const title = useEntrance("hero", 0);      // spring with overshoot
 *   const bar = useEntrance("data", 15);        // smooth cubic grow
 *   const label = useEntrance("label", 30);     // quick subtle fade
 *   const axis = useEntrance("structure", 0);   // fastest, barely noticeable
 *
 * Returns { opacity, scale, translateY } — spread into style.
 *
 * This enforces POLISH.md rules:
 *   A1: No linear interpolation (all presets use easing)
 *   A2: Spring physics for hero elements
 *   A3: Different timing per element tier
 *   A4: Structure → data → labels ordering (via startFrame)
 */

import { useCurrentFrame, useVideoConfig } from "remotion";
import { interpolate, spring, Easing } from "remotion";

/** Element role determines animation character */
export type EntranceRole =
  | "hero"       // titles, key stats — spring with overshoot, slowest
  | "content"    // general content — smooth ease, medium speed
  | "data"       // chart bars, map fills — cubic out, medium-fast
  | "label"      // value labels, captions — quick fade, minimal motion
  | "structure"; // axes, grids, dividers — fastest, near-instant

interface EntranceResult {
  /** Opacity (0 → 1) */
  opacity: number;
  /** Scale (0.x → 1) for elements that scale in. 1 for labels/structure. */
  scale: number;
  /** Vertical offset in px (positive = below final position). 0 when settled. */
  translateY: number;
  /** Whether the entrance is complete (useful for triggering dependent animations) */
  settled: boolean;
  /** Combined style object — spread into your element's style */
  style: React.CSSProperties;
}

export const useEntrance = (
  role: EntranceRole,
  startFrame: number = 0,
  /**
   * Timing scale multiplier from pacing system (via useDirection).
   * Values <1 make entrances faster (urgent), >1 make them slower (breathing).
   * Default 1.0 (analytical pace). Pass direction.paceTimingScale here.
   */
  timingScale: number = 1.0
): EntranceResult => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const t = frame - startFrame; // frames since entrance begins

  let opacity = 0;
  let scale = 1;
  let translateY = 0;
  let settled = false;

  // Apply timing scale to durations. Clamp to prevent absurd values.
  const ts = Math.max(0.4, Math.min(2.0, timingScale));

  switch (role) {
    // ── Hero: spring physics, visible overshoot ─────────────────────────
    case "hero": {
      // Scale spring mass: higher mass = slower spring (breathing), lower = snappier (urgent)
      const springVal = t >= 0
        ? spring({
            frame: t,
            fps,
            config: { damping: 12, stiffness: 100, mass: ts },
          })
        : 0;
      opacity = Math.min(springVal * 1.5, 1); // fade slightly ahead of motion
      scale = 0.92 + springVal * 0.08; // 0.92 → 1.0 with overshoot
      translateY = (1 - springVal) * 20; // 20px → 0
      settled = springVal > 0.98;
      break;
    }

    // ── Content: smooth ease-out, moderate ──────────────────────────────
    case "content": {
      const dur = Math.round(18 * ts); // ~0.6s at 30fps, scaled by pace
      opacity = t >= 0
        ? interpolate(t, [0, dur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          })
        : 0;
      translateY = t >= 0
        ? interpolate(t, [0, dur], [15, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          })
        : 15;
      settled = t >= dur;
      break;
    }

    // ── Data: cubic out, slightly faster, includes scale ────────────────
    case "data": {
      const dur = Math.round(15 * ts); // ~0.5s at 30fps, scaled by pace
      opacity = t >= 0
        ? interpolate(t, [0, dur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          })
        : 0;
      scale = t >= 0
        ? interpolate(t, [0, dur], [0.85, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          })
        : 0.85;
      translateY = 0; // data elements don't slide — they scale
      settled = t >= dur;
      break;
    }

    // ── Label: quick fade, minimal motion ───────────────────────────────
    case "label": {
      const dur = Math.round(10 * ts); // ~0.33s at 30fps, scaled by pace
      opacity = t >= 0
        ? interpolate(t, [0, dur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : 0;
      translateY = t >= 0
        ? interpolate(t, [0, dur], [6, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.quad),
          })
        : 6;
      settled = t >= dur;
      break;
    }

    // ── Structure: near-instant, just a fade ────────────────────────────
    case "structure": {
      const dur = Math.round(6 * ts); // ~0.2s at 30fps, scaled by pace
      opacity = t >= 0
        ? interpolate(t, [0, dur], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        : 0;
      settled = t >= dur;
      break;
    }
  }

  const style: React.CSSProperties = {
    opacity,
    transform:
      scale !== 1 || translateY !== 0
        ? `scale(${scale}) translateY(${translateY}px)`
        : undefined,
  };

  return { opacity, scale, translateY, settled, style };
};

// ── Convenience: stagger + entrance ──────────────────────────────────────

/**
 * Returns useEntrance for an indexed item in a list.
 * Combines stagger delay with entrance preset.
 *
 * Usage:
 *   {items.map((item, i) => {
 *     const entrance = useStaggeredEntrance("data", i, baseDelay);
 *     return <div style={entrance.style}>{item}</div>;
 *   })}
 *
 * NOTE: This must be called inside the component (hooks rule).
 * For dynamic lists, use the raw values instead:
 *   const startFrame = baseDelay + i * staggerFrames;
 *   const entrance = useEntrance("data", startFrame);
 */
export const useStaggeredEntrance = (
  role: EntranceRole,
  index: number,
  baseDelay: number = 0,
  staggerFrames: number = 5,
  /**
   * Timing scale from pacing system. Scales both entrance duration
   * and stagger gap. Pass direction.paceTimingScale here.
   */
  timingScale: number = 1.0
): EntranceResult => {
  const scaledStagger = Math.round(staggerFrames * timingScale);
  const startFrame = baseDelay + index * scaledStagger;
  return useEntrance(role, startFrame, timingScale);
};
