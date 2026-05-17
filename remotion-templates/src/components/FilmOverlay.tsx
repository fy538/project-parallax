/**
 * FilmOverlay — Cinematic texture overlay component for Parallax episodes
 *
 * Wraps child content and renders film-like texture effects on top using absolute
 * positioning. Supports grain, vignette, light leaks, dust, scratches, and flicker.
 * All effects are deterministic (same seed = same result) and intensity-scaled.
 *
 * Brand palette context (Meridian warm monochrome):
 * - ink: #1C1814 (deep warm black)
 * - midnight: #2A2520 (dark gray)
 * - gold: #C4A747 (warm amber)
 * - paper: #F5F0E8 (off-white)
 *
 * @example
 * // Full effects at 60% intensity
 * <FilmOverlay
 *   effects={["grain", "vignette", "light-leak", "dust", "scratch", "flicker"]}
 *   intensity={0.6}
 * >
 *   <MyTemplate data={templateData} />
 * </FilmOverlay>
 *
 * @example
 * // Minimal: grain + vignette only (defaults)
 * <FilmOverlay>
 *   <SomeComposition />
 * </FilmOverlay>
 *
 * @example
 * // High intensity for dramatic sequences
 * <FilmOverlay
 *   effects={["grain", "vignette", "flicker"]}
 *   intensity={0.8}
 * >
 *   <CriticalMoment />
 * </FilmOverlay>
 *
 * Intensity guidelines:
 * - 0.3–0.4: Subtle, background presence (default for atmospheric episodes)
 * - 0.5–0.6: Medium, noticeable without distraction (recommended baseline)
 * - 0.7–0.8: Strong, dramatic atmosphere (use sparingly for climactic moments)
 * - 1.0: Maximum saturation (use rarely, for shock or period-film effect)
 */

import React, { useId, useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { random } from "remotion";
import { palette } from "../design/theme";
import { CLAMP } from "../utils/animation";

interface FilmOverlayProps {
  /** Which effects to enable. Default: ["grain", "vignette"] */
  effects?: Array<"grain" | "vignette" | "light-leak" | "dust" | "scratch" | "flicker">;
  /** Overall intensity (0–1). Scales all effects proportionally. Default: 0.5 */
  intensity?: number;
  /** Content rendered underneath the overlay */
  children: React.ReactNode;
  /** Optional container style */
  style?: React.CSSProperties;
  /**
   * Absolute episode frame at which this segment starts.
   * Added to `useCurrentFrame()` inside `LightLeakOverlay` so the leak
   * drifts continuously across the episode timeline rather than restarting
   * at each segment boundary. Pass 0 (or omit) for standalone compositions.
   * Default: 0.
   *
   * Context: `<Sequence>` resets `useCurrentFrame()` to 0 inside each
   * segment. Without this offset the leak traverses the full frame width
   * every segment and snaps back at boundaries — a hard visible seam
   * (LESSONS.md L101). Only affects `light-leak` effect; all other effects
   * are either stochastic (grain) or short-period enough to be imperceptible.
   */
  frameOffset?: number;
  /**
   * Total episode duration in frames. Paired with `frameOffset` to set the
   * correct interpolation range for `LightLeakOverlay`. When omitted, falls
   * back to `useVideoConfig().durationInFrames` (standalone / non-episode
   * use — the pre-per-segment behaviour). Default: undefined.
   */
  episodeTotalFrames?: number;
  /**
   * When > 0, grain intensity ramps from 0 → `intensity` over this many
   * frames. Use for Class B transitions (Remotion ↔ AI-gen/footage):
   * the receiving segment starts grain-free and ramps to full texture over
   * the transition window, so grain feels like it "grows into" the amber
   * color-wash rather than snapping at frame 0 of a cut.
   *
   * For `color-wash`, `dissolve`, and `fade` transitions the TransitionWrapper
   * already fades the content (including grain) via its `opacity` prop —
   * setting this additionally multiplies the grain intensity, producing an
   * even softer introduction. For `cut` transitions this is the ONLY grain
   * fade mechanism.
   *
   * Typical value: `Math.round(transitionDurationSec * fps)`.
   * Default: 0 (no ramp — grain appears at full intensity from frame 0).
   */
  grainRampInFrames?: number;
}

// Use the canonical palette from theme.ts (single source of truth)
const PALETTE = {
  ink: palette.ink,
  midnight: palette.midnight,
  gold: palette.gold,
  paper: palette.paper,
};

const clampValue = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * Grain effect: SVG feTurbulence filter with animated seed for flickering appearance
 */
const GrainOverlay = React.memo(({ intensity }: { intensity: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Update seed every 2 frames for filmic 15fps grain flicker
  const seed = Math.floor(frame / 2);

  // Per-instance unique id prefix prevents collisions when multiple
  // <FilmOverlay> mount simultaneously (e.g. per-segment wiring in
  // FullEpisode.tsx, commit 09bb29a). Strip colons from useId() output
  // (`:r0:`) — valid in HTML5 ids but noisy in SVG `url(#…)` refs.
  //
  // Perf note (May-17 audit): filterId is STABLE per instance — the changing
  // `seed` lives only on <feTurbulence seed={seed}>. Keeping the filter id
  // constant lets React patch the seed attribute in place; Chrome updates
  // the noise without recompiling the filter graph. Previously the seed was
  // baked into the id, forcing a fresh filter element 15×/sec.
  const instanceId = useId().replace(/:/g, "");
  const filterId = `film-grain-${instanceId}`;
  const opacity = clampValue(intensity * 0.12, 0, 0.12);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 10 }}>
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity,
          mixBlendMode: "overlay",
          pointerEvents: "none",
        }}
      >
        <defs>
          <filter id={filterId} x="0%" y="0%" width="100%" height="100%">
            {/* Generate fractal noise — this IS the grain texture */}
            <feTurbulence
              type="fractalNoise"
              baseFrequency={0.65}
              numOctaves={4}
              seed={seed}
              result="noise"
            />
            {/* Convert to grayscale so grain is neutral, not colored */}
            <feColorMatrix
              type="saturate"
              values="0"
              in="noise"
            />
          </filter>
        </defs>
        {/* Render the noise pattern directly — no source graphic needed */}
        <rect
          width="100%"
          height="100%"
          filter={`url(#${filterId})`}
        />
      </svg>
    </AbsoluteFill>
  );
});
GrainOverlay.displayName = "GrainOverlay";

/**
 * Vignette effect: radial gradient with warm-umber edges (matches brand palette)
 */
const VignetteOverlay = React.memo(({ intensity }: { intensity: number }) => {
  const frame = useCurrentFrame();
  const opacity = clampValue(intensity * 0.32, 0, 0.32);

  // Gentle breathing: vignette spread oscillates ±3% using sine of frame
  const breathe = Math.sin(frame * 0.04) * 3; // ±3% radius shift
  const innerStop = 45 + breathe; // center clear zone ~42-48%

  // Warm-umber vignette tint matches palette.ink, not cold pure black.
  // Two-tier gradient: subtle warm tint at ~70%, deeper umber at edge.
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, transparent 0%, transparent ${innerStop}%, rgba(28, 24, 20, ${opacity * 0.6}) 75%, rgba(18, 16, 14, ${opacity}) 100%)`,
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  );
});
VignetteOverlay.displayName = "VignetteOverlay";

/**
 * Light leak effect: animated warm glow drifting across frame
 */
const LightLeakOverlay = React.memo(
  ({
    intensity,
    frameOffset,
    episodeTotalFrames,
  }: {
    intensity: number;
    /**
     * Episode-absolute frame offset — see FilmOverlayProps.frameOffset.
     * When > 0, the drift is sampled at (useCurrentFrame() + frameOffset)
     * so the position is continuous across segment boundaries instead of
     * restarting from the right side each time a new Sequence mounts.
     */
    frameOffset: number;
    /**
     * Total episode frames to use as the interpolation ceiling.
     * Undefined in standalone mode → falls back to durationInFrames from
     * useVideoConfig() (which equals the segment duration inside a Sequence,
     * the original per-composition behaviour).
     */
    episodeTotalFrames: number | undefined;
  }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, width, height } = useVideoConfig();

  // Drift from right off-screen to left off-screen.
  //
  // In per-segment mode (frameOffset > 0): sample the episode-absolute
  // position (frame + frameOffset) against the full episode duration so the
  // leak moves smoothly across segment boundaries. The Sequence context makes
  // useCurrentFrame() reset to 0 at each segment start, but adding frameOffset
  // restores the episode-level position.
  //
  // In standalone mode (frameOffset === 0, episodeTotalFrames undefined): the
  // original behaviour — drift across the composition's own durationInFrames.
  const startX = width * 1.2;
  const endX = -width * 0.4;
  const absoluteFrame = frame + frameOffset;
  const totalFrames = episodeTotalFrames ?? durationInFrames;
  const posX = interpolate(absoluteFrame, [0, totalFrames], [startX, endX]);

  const centerY = height * 0.5;
  const leakWidth = width * 0.6;
  const leakHeight = height * 0.8;
  const leakOpacity = clampValue(intensity * 0.15, 0, 0.15);

  // Convert palette gold hex to rgba for gradient stops
  const goldR = parseInt(PALETTE.gold.slice(1, 3), 16);
  const goldG = parseInt(PALETTE.gold.slice(3, 5), 16);
  const goldB = parseInt(PALETTE.gold.slice(5, 7), 16);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse ${leakWidth}px ${leakHeight}px at ${posX}px ${centerY}px,
          rgba(${goldR}, ${goldG}, ${goldB}, ${leakOpacity}) 0%,
          rgba(${goldR}, ${goldG}, ${goldB}, 0) 70%)`,
        pointerEvents: "none",
        zIndex: 10,
        mixBlendMode: "screen",
      }}
    />
  );
});
LightLeakOverlay.displayName = "LightLeakOverlay";

/**
 * Dust effect: scattered small bright dots fading in and out
 */
const DustOverlay = React.memo(({ intensity }: { intensity: number }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Generate 10 dust particles with deterministic positions and fade cycles
  const particles = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: random(`dust-x-${i}`) * width,
      y: random(`dust-y-${i}`) * height,
      size: clampValue(random(`dust-size-${i}`) * 4 + 2, 2, 6),
      cycleDuration: clampValue(random(`dust-cycle-${i}`) * 120 + 60, 60, 180),
      cycleOffset: random(`dust-offset-${i}`) * 180,
    }));
  }, [width, height]);

  const dustOpacity = clampValue(intensity * 0.12, 0, 0.12);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 10 }}>
      {particles.map(({ id, x, y, size, cycleDuration, cycleOffset }) => {
        // Fade in and out over a cycle
        const cycleProgress = ((frame + cycleOffset) % cycleDuration) / cycleDuration;
        // Triangular fade: up for first half, down for second half
        const particleOpacity =
          cycleProgress < 0.5 ? cycleProgress * 2 : (1 - cycleProgress) * 2;

        return (
          <div
            key={id}
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${y}px`,
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: "50%",
              backgroundColor: PALETTE.paper,
              opacity: particleOpacity * dustOpacity,
              pointerEvents: "none",
              boxShadow: `0 0 ${size * 1.5}px rgba(245, 240, 232, ${particleOpacity * dustOpacity * 0.6})`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
});
DustOverlay.displayName = "DustOverlay";

/**
 * Scratch effect: thin vertical lines appearing and disappearing
 */
const ScratchOverlay = React.memo(({ intensity }: { intensity: number }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Generate 3 scratch lines with staggered appearance cycles
  const scratches = useMemo(() => {
    return Array.from({ length: 3 }, (_, i) => ({
      id: i,
      x: random(`scratch-x-${i}`) * width,
      heightPercent: clampValue(random(`scratch-height-${i}`) * 0.5 + 0.3, 0.3, 0.8),
      duration: clampValue(random(`scratch-duration-${i}`) * 8 + 4, 4, 12),
      offset: (i * fps) / 3, // Stagger across ~1 second
    }));
  }, [width, height, fps]);

  const scratchOpacity = clampValue(intensity * 0.04, 0, 0.04);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 10 }}>
      {scratches.map(({ id, x, heightPercent, duration, offset }) => {
        // Fade in and out over duration
        const cycleFrame = (frame + offset) % (duration * 2);
        const visible = cycleFrame < duration;
        const fade = visible
          ? cycleFrame / duration
          : Math.max(0, 1 - (cycleFrame - duration) / duration);

        const scratchHeight = height * heightPercent;
        const topPos = (height - scratchHeight) / 2;

        return (
          <div
            key={id}
            style={{
              position: "absolute",
              left: `${x}px`,
              top: `${topPos}px`,
              width: "1px",
              height: `${scratchHeight}px`,
              backgroundColor: PALETTE.paper,
              opacity: fade * scratchOpacity,
              pointerEvents: "none",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
});
ScratchOverlay.displayName = "ScratchOverlay";

/**
 * Flicker effect: subtle brightness flicker simulating projector instability
 */
const FlickerOverlay = React.memo(({ intensity }: { intensity: number }) => {
  const frame = useCurrentFrame();

  // Subtle sine-based flicker with slight randomness
  const baseSine = Math.sin(frame * 0.05) * 0.5 + 0.5;
  const randomFactor = random(`flicker-${Math.floor(frame / 5)}`) * 0.3;
  const flicker = baseSine * (1 + randomFactor * 0.2);

  const opacity = clampValue(flicker * intensity * 0.02, 0, 0.02);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "white",
        opacity,
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  );
});
FlickerOverlay.displayName = "FlickerOverlay";

/**
 * FilmOverlay component
 */
export const FilmOverlay = React.memo(
  ({
    effects = ["grain", "vignette"],
    intensity = 0.5,
    children,
    style,
    frameOffset = 0,
    episodeTotalFrames,
    grainRampInFrames = 0,
  }: FilmOverlayProps) => {
    // Grain ramp: interpolate intensity from 0 → clampedIntensity over the
    // first grainRampInFrames frames. frame 0 = start of THIS Sequence (Remotion
    // Sequence resets useCurrentFrame() to 0 at each segment boundary).
    // Note: React.memo optimization is intentionally weakened here — this hook
    // makes FilmOverlay frame-dependent when grainRampInFrames > 0. The sub-
    // components (GrainOverlay, VignetteOverlay, etc.) are already frame-
    // dependent via their own useCurrentFrame() calls, so this is not a
    // regression. When grainRampInFrames === 0 the interpolate call is skipped
    // and clampedIntensity is used directly, preserving the original behavior.
    const frame = useCurrentFrame();
    const clampedIntensity = clampValue(intensity, 0, 1);
    const grainIntensity =
      grainRampInFrames > 0
        ? clampedIntensity *
          interpolate(frame, [0, grainRampInFrames], [0, 1], CLAMP)
        : clampedIntensity;

    const effectMap = {
      grain: <GrainOverlay key="grain" intensity={grainIntensity} />,
      vignette: <VignetteOverlay key="vignette" intensity={clampedIntensity} />,
      "light-leak": <LightLeakOverlay key="light-leak" intensity={clampedIntensity} frameOffset={frameOffset} episodeTotalFrames={episodeTotalFrames} />,
      dust: <DustOverlay key="dust" intensity={clampedIntensity} />,
      scratch: <ScratchOverlay key="scratch" intensity={clampedIntensity} />,
      flicker: <FlickerOverlay key="flicker" intensity={clampedIntensity} />,
    };

    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          ...style,
        }}
      >
        {children}
        {effects.map((effect) => effectMap[effect] || null)}
      </div>
    );
  }
);

FilmOverlay.displayName = "FilmOverlay";

export default FilmOverlay;
