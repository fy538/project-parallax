/**
 * Transitions — shared transition library for segment boundaries.
 *
 * Provides cinematic transitions between visual segments. Used by
 * FullEpisode when segments specify a transition type, and available
 * to any composition that needs inter-segment transitions.
 *
 * Transition types:
 *   - cut: instant switch (no animation)
 *   - fade: opacity crossfade
 *   - dissolve: fade + subtle scale shift (depth)
 *   - wipe-left: horizontal wipe from right to left
 *   - wipe-right: horizontal wipe from left to right
 *   - wipe-up: vertical wipe from bottom to top
 *   - blur-through: content blurs out, new content blurs in
 *   - color-wash: brief solid color flood between segments
 *   - iris: circular reveal from center
 *   - match-cut: synced zoom for visual continuity between segments
 *   - whip-pan: fast horizontal blur sweep (energetic)
 *
 * Usage:
 *   <TransitionWrapper
 *     type="wipe-left"
 *     durationSec={0.6}
 *     phase="in"
 *     durationInFrames={totalSegmentFrames}
 *   >
 *     <MyContent />
 *   </TransitionWrapper>
 */

import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  interpolate,
  Easing,
} from "remotion";
import { palette, sec } from "../design/theme";
import { CLAMP } from "../utils/animation";

// ── Types ────────────────────────────────────────────────────────────────────

export type TransitionType =
  | "cut"
  | "fade"
  | "dissolve"
  | "wipe-left"
  | "wipe-right"
  | "wipe-up"
  | "blur-through"
  | "color-wash"
  | "iris"
  | "match-cut"
  | "whip-pan"
  | "spatial-zoom";

interface TransitionWrapperProps {
  children: React.ReactNode;
  /** Transition type for entry */
  transitionIn?: TransitionType;
  /** Transition type for exit */
  transitionOut?: TransitionType;
  /** Duration of each transition in seconds (default: 0.5) */
  durationSec?: number;
  /** Total duration of the segment in frames */
  durationInFrames: number;
  /** Color for color-wash transition (default: palette.amber — brand-cinematic) */
  washColor?: string;
  /** Accent color for wipe leading edge / iris ring (default: palette.amber) */
  accentColor?: string;
}

// ── Easing presets ───────────────────────────────────────────────────────────

const EASE_OUT_CUBIC = { ...CLAMP, easing: Easing.out(Easing.cubic) };
const EASE_IN_CUBIC = { ...CLAMP, easing: Easing.in(Easing.cubic) };


// ── Transition computations ──────────────────────────────────────────────────

interface TransitionState {
  opacity: number;
  transform: string;
  clipPath: string | undefined;
  filter: string | undefined;
  overlay: React.ReactNode | null;
}

const computeTransition = (
  type: TransitionType,
  progress: number, // 0 = fully transitioned, 1 = fully visible
  phase: "in" | "out",
  washColor: string,
  accentColor: string
): TransitionState => {
  const state: TransitionState = {
    opacity: 1,
    transform: "none",
    clipPath: undefined,
    filter: undefined,
    overlay: null,
  };

  switch (type) {
    case "cut":
      // Instant — content either fully visible or fully hidden
      state.opacity = progress > 0 ? 1 : 0;
      break;

    case "fade":
      state.opacity = progress;
      break;

    case "dissolve":
      state.opacity = progress;
      if (phase === "in") {
        state.transform = `scale(${1 + 0.02 * (1 - progress)})`;
      } else {
        state.transform = `scale(${1 - 0.02 * (1 - progress)})`;
      }
      break;

    case "wipe-left": {
      // Content reveals from right edge moving left, with thin accent leading edge
      const isMid = progress > 0.05 && progress < 0.95;
      if (phase === "in") {
        const x = 100 * (1 - progress);
        state.clipPath = `inset(0 0 0 ${x}%)`;
        if (isMid) {
          state.overlay = (
            <AbsoluteFill style={{ pointerEvents: "none", zIndex: 11 }}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: `${x}%`,
                  width: 2,
                  height: "100%",
                  background: `linear-gradient(180deg, transparent 0%, ${accentColor} 30%, ${accentColor} 70%, transparent 100%)`,
                  boxShadow: `0 0 12px ${accentColor}`,
                  opacity: 1 - Math.abs(progress - 0.5) * 1.6,
                }}
              />
            </AbsoluteFill>
          );
        }
      } else {
        const x = 100 * (1 - progress);
        state.clipPath = `inset(0 ${x}% 0 0)`;
      }
      break;
    }

    case "wipe-right": {
      const isMid = progress > 0.05 && progress < 0.95;
      if (phase === "in") {
        const x = 100 * (1 - progress);
        state.clipPath = `inset(0 ${x}% 0 0)`;
        if (isMid) {
          state.overlay = (
            <AbsoluteFill style={{ pointerEvents: "none", zIndex: 11 }}>
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  right: `${x}%`,
                  width: 2,
                  height: "100%",
                  background: `linear-gradient(180deg, transparent 0%, ${accentColor} 30%, ${accentColor} 70%, transparent 100%)`,
                  boxShadow: `0 0 12px ${accentColor}`,
                  opacity: 1 - Math.abs(progress - 0.5) * 1.6,
                }}
              />
            </AbsoluteFill>
          );
        }
      } else {
        const x = 100 * (1 - progress);
        state.clipPath = `inset(0 0 0 ${x}%)`;
      }
      break;
    }

    case "wipe-up": {
      const isMid = progress > 0.05 && progress < 0.95;
      if (phase === "in") {
        const y = 100 * (1 - progress);
        state.clipPath = `inset(${y}% 0 0 0)`;
        if (isMid) {
          state.overlay = (
            <AbsoluteFill style={{ pointerEvents: "none", zIndex: 11 }}>
              <div
                style={{
                  position: "absolute",
                  top: `${y}%`,
                  left: 0,
                  width: "100%",
                  height: 2,
                  background: `linear-gradient(90deg, transparent 0%, ${accentColor} 30%, ${accentColor} 70%, transparent 100%)`,
                  boxShadow: `0 0 12px ${accentColor}`,
                  opacity: 1 - Math.abs(progress - 0.5) * 1.6,
                }}
              />
            </AbsoluteFill>
          );
        }
      } else {
        const y = 100 * (1 - progress);
        state.clipPath = `inset(0 0 ${y}% 0)`;
      }
      break;
    }

    case "blur-through":
      state.opacity = progress;
      const blur = 20 * (1 - progress);
      state.filter = blur > 0.5 ? `blur(${blur}px)` : undefined;
      break;

    case "color-wash": {
      state.opacity = 1;
      // Content fades in/out with a colored overlay
      const contentOpacity = progress;
      const overlayOpacity = 1 - progress;
      state.opacity = contentOpacity;
      if (overlayOpacity > 0.01) {
        state.overlay = (
          <AbsoluteFill
            style={{
              backgroundColor: washColor,
              opacity: overlayOpacity,
              zIndex: 10,
              pointerEvents: "none",
            }}
          />
        );
      }
      break;
    }

    case "iris": {
      // Circular reveal from center, with subtle accent ring on the leading edge
      const radius = 72 * progress; // 0% → 72% (covers corners at ~72%)
      state.clipPath = `circle(${radius}% at 50% 50%)`;
      const isMid = progress > 0.05 && progress < 0.95;
      if (isMid) {
        // Approximate radius in pixels (assuming 1920x1080, half-diagonal ≈ 1102)
        const radiusPx = (radius / 100) * 1102;
        state.overlay = (
          <AbsoluteFill style={{ pointerEvents: "none", zIndex: 11 }}>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: radiusPx * 2,
                height: radiusPx * 2,
                borderRadius: "50%",
                border: `1.5px solid ${accentColor}`,
                transform: "translate(-50%, -50%)",
                boxShadow: `0 0 16px ${accentColor}, inset 0 0 16px ${accentColor}80`,
                opacity: (1 - Math.abs(progress - 0.5) * 1.6) * 0.7,
              }}
            />
          </AbsoluteFill>
        );
      }
      break;
    }

    case "match-cut":
      // Synced zoom creates visual continuity between segments.
      // In: progress 0→1, scale 1.15→1.0 (zoom out from enlarged state)
      // Out: progress 1→0, scale 1.0→1.15 (zoom in, pushing into frame)
      // Same formula works for both phases because progress direction differs.
      state.opacity = progress;
      state.transform = `scale(${1 + 0.15 * (1 - progress)})`;
      break;

    case "whip-pan": {
      // Fast horizontal sweep with motion blur
      if (phase === "in") {
        // Slide in from right
        const slideX = (1 - progress) * 100;
        state.transform = `translateX(${slideX}%)`;
        // Motion blur peaks when moving fastest (low progress)
        const blur = 30 * (1 - progress);
        state.filter = blur > 0.5 ? `blur(${blur}px)` : undefined;
        state.opacity = progress < 0.2 ? progress / 0.2 : 1;
      } else {
        // Slide out to left
        const slideX = -(1 - progress) * 100;
        state.transform = `translateX(${slideX}%)`;
        const blur = 30 * (1 - progress);
        state.filter = blur > 0.5 ? `blur(${blur}px)` : undefined;
        state.opacity = progress < 0.2 ? progress / 0.2 : 1;
      }
      break;
    }

    case "spatial-zoom": {
      // Spatial zoom: camera "flies" from one composition to the next.
      // Out: zoom in rapidly (pushing "through" the content) with slight blur
      // In: zoom out from enlarged state, revealing new content from depth
      if (phase === "in") {
        // Scale from 2.5x down to 1x (arriving from far away)
        const scaleVal = 1 + 1.5 * (1 - progress);
        state.transform = `scale(${scaleVal})`;
        state.opacity = progress;
        const spatialBlur = 8 * (1 - progress);
        state.filter = spatialBlur > 0.5 ? `blur(${spatialBlur}px)` : undefined;
      } else {
        // Scale from 1x up to 2.5x (pushing into the frame)
        const scaleVal = 1 + 1.5 * (1 - progress);
        state.transform = `scale(${scaleVal})`;
        state.opacity = progress;
        const spatialBlur = 8 * (1 - progress);
        state.filter = spatialBlur > 0.5 ? `blur(${spatialBlur}px)` : undefined;
      }
      break;
    }
  }

  return state;
};

// ── Component ────────────────────────────────────────────────────────────────

export const TransitionWrapper: React.FC<TransitionWrapperProps> = ({
  children,
  transitionIn = "cut",
  transitionOut = "cut",
  durationSec = 0.5,
  durationInFrames,
  washColor = palette.amber,
  accentColor = palette.amber,
}) => {
  const frame = useCurrentFrame();
  const transFrames = sec(durationSec);

  // ── Compute in-transition progress (0→1) ────────────────────────────
  let inProgress = 1;
  if (transitionIn !== "cut") {
    inProgress = interpolate(
      frame,
      [0, transFrames],
      [0, 1],
      EASE_OUT_CUBIC
    );
  }

  // ── Compute out-transition progress (1→0) ───────────────────────────
  let outProgress = 1;
  if (transitionOut !== "cut") {
    outProgress = interpolate(
      frame,
      [durationInFrames - transFrames, durationInFrames],
      [1, 0],
      EASE_IN_CUBIC
    );
  }

  const inState = computeTransition(transitionIn, inProgress, "in", washColor, accentColor);
  const outState = computeTransition(transitionOut, outProgress, "out", washColor, accentColor);

  // ── Combine states (multiply opacities, compose transforms) ─────────
  const opacity = inState.opacity * outState.opacity;
  const transforms: string[] = [];
  if (inState.transform !== "none") transforms.push(inState.transform);
  if (outState.transform !== "none") transforms.push(outState.transform);
  const transform = transforms.length > 0 ? transforms.join(" ") : undefined;

  // Clip path: use whichever is active (in or out, not both simultaneously)
  const clipPath = inProgress < 1 ? inState.clipPath : outState.clipPath;

  // Filter: use whichever is active
  const filter = inProgress < 1 ? inState.filter : outState.filter;

  // Overlay: show whichever is active
  const overlay = inProgress < 1 ? inState.overlay : outState.overlay;

  return (
    <>
      <AbsoluteFill
        style={{
          opacity,
          transform,
          clipPath,
          filter,
          willChange:
            clipPath || filter ? "clip-path, filter" : undefined,
        }}
      >
        {children}
      </AbsoluteFill>
      {overlay}
    </>
  );
};

/**
 * Transition metadata for assembly manifests.
 * Describes available transitions so generate_manifest.py can reference them.
 */
export const TRANSITION_CATALOG: Record<
  TransitionType,
  { label: string; description: string; defaultDurationSec: number }
> = {
  cut: {
    label: "Cut",
    description: "Instant switch — no animation",
    defaultDurationSec: 0,
  },
  fade: {
    label: "Fade",
    description: "Simple opacity crossfade",
    defaultDurationSec: 0.5,
  },
  dissolve: {
    label: "Dissolve",
    description: "Opacity crossfade with subtle scale shift for depth",
    defaultDurationSec: 0.6,
  },
  "wipe-left": {
    label: "Wipe Left",
    description: "Content reveals from right edge moving left",
    defaultDurationSec: 0.6,
  },
  "wipe-right": {
    label: "Wipe Right",
    description: "Content reveals from left edge moving right",
    defaultDurationSec: 0.6,
  },
  "wipe-up": {
    label: "Wipe Up",
    description: "Content reveals from bottom edge moving up",
    defaultDurationSec: 0.6,
  },
  "blur-through": {
    label: "Blur Through",
    description: "Content blurs out, new content blurs in — dreamlike",
    defaultDurationSec: 0.8,
  },
  "color-wash": {
    label: "Color Wash",
    description: "Brief solid color flood between segments",
    defaultDurationSec: 0.7,
  },
  iris: {
    label: "Iris",
    description: "Circular reveal from center — cinematic opener",
    defaultDurationSec: 0.8,
  },
  "match-cut": {
    label: "Match Cut",
    description: "Synced zoom creates visual continuity — push in on exit, pull out on entry",
    defaultDurationSec: 0.4,
  },
  "whip-pan": {
    label: "Whip Pan",
    description: "Fast horizontal sweep with motion blur — energetic beat transition",
    defaultDurationSec: 0.5,
  },
  "spatial-zoom": {
    label: "Spatial Zoom",
    description: "Camera flies through depth — zoom in on exit, emerge from zoom on entry",
    defaultDurationSec: 0.7,
  },
};
