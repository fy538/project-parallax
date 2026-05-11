/**
 * Background — layered full-frame background for compositions.
 *
 * Five visual planes (cinematic overhaul):
 *   z=0  Background gradient or textured surface
 *   z=1  Film grain + vignette
 *   z=2  Color temperature tint
 *   z=3  Atmospheric particles (dust motes + bokeh orbs + light ray)
 *   z=4  Content layer (children)
 *
 * The atmospheric layer is what separates "video essay" from "PowerPoint."
 * Particles are deterministic (seeded by position, animated by frame count)
 * so they render identically across Remotion's frame-based pipeline.
 *
 * Light mode (PRIMARY): flat paper with subtle noise + atmospheric particles + optional ruled border
 * Dark mode:  radial gradient vignette (ink center → bg.dark.base edges)
 * Map mode:   dark map background with slightly different tone
 *
 * Usage:
 *   <Background>{children}</Background>  // light mode (default)
 *   <Background variant="light" tint="#6B1D1D" atmosphere="subtle">{children}</Background>
 *   <Background variant="dark" tint="#3266AD" atmosphere="dense">{children}</Background>
 */

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile, random } from "remotion";
import { dark, light, palette, layout, fonts, fontSizes } from "../design/theme";
import {
  motionIdentities,
  DEFAULT_MOTION_IDENTITY,
  computeWobble,
  type MotionIdentity,
} from "../design/motion";
import { useEpisodeColorEmphasis, useEpisodeColorEmphasisName } from "../hooks/useEpisodeColorEmphasis";

// ── Deterministic random via Remotion's seeded random() ────────────────
// Remotion's random(seed) is deterministic per composition — same seed
// always produces the same value, no matter how many times the frame rerenders.

const seededRandom = (seed: number): number => random(`bg-particle-${seed}`);

// ── Particle types ───────────────────────────────────────────────────────

interface Particle {
  x: number;      // initial x position (0-1920)
  y: number;      // initial y position (0-1080)
  size: number;    // radius in px
  speed: number;   // drift speed multiplier
  angle: number;   // drift direction in radians
  opacity: number; // base opacity
  phase: number;   // phase offset for pulsing
}

const generateParticles = (
  count: number,
  sizeRange: [number, number],
  opacityRange: [number, number],
  seed: number = 0,
): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const s = seed + i * 7;
    particles.push({
      x: seededRandom(s + 1) * layout.width,
      y: seededRandom(s + 2) * layout.height,
      size: sizeRange[0] + seededRandom(s + 3) * (sizeRange[1] - sizeRange[0]),
      speed: 0.3 + seededRandom(s + 4) * 0.7,
      angle: seededRandom(s + 5) * Math.PI * 2,
      opacity: opacityRange[0] + seededRandom(s + 6) * (opacityRange[1] - opacityRange[0]),
      phase: seededRandom(s + 7) * Math.PI * 2,
    });
  }
  return particles;
};

// ── Atmosphere component (dust + bokeh + light ray) ──────────────────────

type AtmosphereDensity = "none" | "subtle" | "normal" | "dense";

const ATMOSPHERE_CONFIG = {
  none: { dustCount: 0, bokehCount: 0, lightRay: false },
  subtle: { dustCount: 15, bokehCount: 3, lightRay: false },
  normal: { dustCount: 30, bokehCount: 5, lightRay: true },
  dense: { dustCount: 50, bokehCount: 8, lightRay: true },
} as const;

const Atmosphere: React.FC<{
  density: AtmosphereDensity;
  tint?: string;
  isDark?: boolean;
  /** Intensity multiplier (0-2). Scales particle count and opacity. */
  intensity?: number;
  /** Skip CSS blur on bokeh orbs (for Lambda/CPU-only renders). Bokeh renders as soft gradients only. */
  noBlur?: boolean;
}> = React.memo(({ density, tint, isDark = false, intensity = 1.0, noBlur = false }) => {
  const frame = useCurrentFrame();
  const { durationInFrames, fps } = useVideoConfig();
  const config = ATMOSPHERE_CONFIG[density];

  // Scale particle counts by intensity (clamped to reasonable range)
  const intensityClamped = Math.max(0, Math.min(2, intensity));
  const dustCount = Math.round(config.dustCount * intensityClamped);
  const bokehCount = Math.round(config.bokehCount * intensityClamped);

  // Pre-compute particle arrays (only once per composition + intensity)
  const dustMotes = useMemo(
    () => generateParticles(dustCount, [1, 3], [0.15, 0.4], 42),
    [dustCount]
  );
  const bokehOrbs = useMemo(
    () => generateParticles(bokehCount, [20, 80], [0.03, 0.08], 137),
    [bokehCount]
  );

  if (density === "none") return null;

  const tintColor = tint || palette.amber;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", overflow: "hidden" }}>
      {/* ── Light ray — diagonal gradient sweep ─────────────────────── */}
      {config.lightRay && (
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 900,
            height: 1400,
            background: `linear-gradient(
              135deg,
              transparent 0%,
              ${tintColor}06 30%,
              ${tintColor}0A 50%,
              ${tintColor}06 70%,
              transparent 100%
            )`,
            // Slow drift: the ray moves across the frame over the composition
            transform: `rotate(-15deg) translateX(${
              (frame / durationInFrames) * 120 - 60
            }px) translateY(${
              (frame / durationInFrames) * 60 - 30
            }px)`,
            // Dual-frequency pulse: slow swell + faster shimmer, scaled by intensity
            opacity: (0.6 + 0.25 * Math.sin(frame / fps * 0.4) + 0.15 * Math.sin(frame / fps * 1.1 + 1.2)) * intensityClamped,
            mixBlendMode: isDark ? "screen" : "multiply",
          }}
        />
      )}

      {/* ── Bokeh orbs — large soft blurred circles with breathing size ── */}
      {bokehOrbs.map((orb, i) => {
        const t = frame / fps;
        // Slow sinusoidal drift — each orb moves independently
        const dx = Math.sin(t * 0.15 * orb.speed + orb.phase) * 60;
        const dy = Math.cos(t * 0.12 * orb.speed + orb.phase * 1.3) * 40;
        // Gentle opacity pulse
        const pulseOpacity = orb.opacity * (0.7 + 0.3 * Math.sin(t * 0.4 + orb.phase));
        // Breathing size — orbs gently expand/contract (±12%)
        const breathScale = 1.0 + 0.12 * Math.sin(t * 0.3 + orb.phase * 0.7);
        const breathSize = orb.size * breathScale;

        return (
          <div
            key={`bokeh-${i}`}
            style={{
              position: "absolute",
              left: orb.x + dx - (breathSize - orb.size) / 2,
              top: orb.y + dy - (breathSize - orb.size) / 2,
              width: breathSize,
              height: breathSize,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${tintColor}${Math.round(pulseOpacity * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
              ...(noBlur ? {} : { filter: `blur(${breathSize * 0.4}px)` }),
              mixBlendMode: isDark ? "screen" : "multiply",
            }}
          />
        );
      })}

      {/* ── Dust motes — tiny particles drifting slowly ─────────────── */}
      <svg
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        {dustMotes.map((mote, i) => {
          const t = frame / fps;
          // Constant drift + slight sinusoidal wobble
          const dx = Math.cos(mote.angle) * mote.speed * t * 12 +
                     Math.sin(t * 0.8 + mote.phase) * 8;
          const dy = Math.sin(mote.angle) * mote.speed * t * 12 +
                     Math.cos(t * 0.6 + mote.phase) * 6;
          // Wrap positions (modulo) for repositioning
          const rawX = mote.x + dx;
          const rawY = mote.y + dy;
          const px = ((rawX % (layout.width + 40)) + layout.width + 40) % (layout.width + 40) - 20;
          const py = ((rawY % (layout.height + 40)) + layout.height + 40) % (layout.height + 40) - 20;

          // Edge fade — particles fade out near edges instead of hard-wrapping
          const edgeMargin = 60;
          const edgeFadeX = Math.min(
            px < edgeMargin ? px / edgeMargin : 1,
            px > layout.width - edgeMargin ? (layout.width - px) / edgeMargin : 1
          );
          const edgeFadeY = Math.min(
            py < edgeMargin ? py / edgeMargin : 1,
            py > layout.height - edgeMargin ? (layout.height - py) / edgeMargin : 1
          );
          const edgeFade = Math.max(0, Math.min(1, edgeFadeX * edgeFadeY));

          // Flicker — slight opacity variation
          const flicker = mote.opacity * (0.6 + 0.4 * Math.sin(t * 2 + mote.phase)) * edgeFade;

          return (
            <circle
              key={`dust-${i}`}
              cx={px}
              cy={py}
              r={mote.size}
              fill={isDark ? palette.bone : palette.bronze}
              opacity={flicker}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
});

// ── Main Background component ────────────────────────────────────────────

interface BackgroundProps {
  color?: string;
  /**
   * `"transparent"` — no paper fill, grain, or atmospheric substrate; parent layers
   * (e.g. EditorialSurface + SegmentBackdrop under FullEpisode) show through.
   * Content chrome (HeaderStrip, chart, etc.) stays on top.
   */
  variant?: "dark" | "light" | "map" | "transparent";
  /** Show ruled border inset 40px (light mode only, per BRAND.md). Default: true for light. */
  border?: boolean;
  /** Episode label for the rubber stamp element (light mode only, per BRAND.md).
   *  Shows rotated "EPISODE XX" stamp in oxblood, top-right area. */
  stampLabel?: string;
  /** Disable grain overlay (default: enabled) */
  noGrain?: boolean;
  /** Disable atmospheric drift overlay (default: enabled in light mode).
   *  Slow-moving low-opacity warm gradients behind content add depth and
   *  "weather" to the frame — the substrate-motion intervention that
   *  separates editorial video from rendered slides. See VISUAL_LANGUAGE.md
   *  → Motion Identity (substrate-vs-element doctrine). */
  noAtmosphere?: boolean;
  /** Named motion-identity preset — combines grain, atmosphere, and wobble
   *  intensities into one switchable register. Three identities ship today:
   *  "briefing" (default — substrate alive but restrained), "still" (no
   *  substrate motion, for technical diagrams or paused moments), and
   *  "documentary" (heavier grain + wobble for found-footage register).
   *  Individual prop toggles (noGrain, noAtmosphere) override the preset's
   *  enabled flags but inherit its intensity calibration. */
  motionIdentity?: MotionIdentity;
  /**
   * Subtle color tint for emotional temperature (Layer 3 color storytelling).
   * A hex color overlaid at ~6% opacity to shift the ambient mood.
   * Use semantic.us (#3266AD) for US-focused analysis, semantic.china (#C23B22)
   * for China-focused, palette.amber for tension/confrontation, or null for neutral.
   */
  tint?: string;
  /**
   * Atmospheric particle density. Controls dust motes, bokeh orbs, and light rays.
   * "none" = clean background (backward compat), "subtle" = light dust,
   * "normal" = dust + bokeh + light ray, "dense" = heavy atmosphere.
   * Default: "normal" for dark/map, "none" for light.
   */
  atmosphere?: AtmosphereDensity;
  /**
   * Atmosphere intensity multiplier (0-2, default 1.0).
   * Scales particle count and opacity without changing the density tier.
   * Use to tie atmosphere to narrative tension:
   *   0.3 = calm analysis, 1.0 = normal, 1.8 = high tension/escalation.
   * Assembly manifest can drive this per-segment.
   */
  atmosphereIntensity?: number;
  /**
   * Skip CSS blur on bokeh orbs for faster CPU-only rendering (Lambda).
   * Bokeh still renders as soft radial gradients — just without the expensive
   * Gaussian blur filter that causes 2-3x slowdown on non-GPU renderers.
   */
  noBlur?: boolean;
  children?: React.ReactNode;
}

export const Background: React.FC<BackgroundProps> = ({
  color,
  variant = "light",
  border,
  noGrain = false,
  noAtmosphere = false,
  motionIdentity = DEFAULT_MOTION_IDENTITY,
  tint,
  atmosphere,
  atmosphereIntensity = 1.0,
  noBlur = false,
  stampLabel,
  children,
}) => {
  const isTransparent = variant === "transparent";
  const isDark = variant === "dark" || variant === "map";
  // Used by all substrate-motion layers (grain seed, atmospheric cloud
  // positions, wobble offset). Substrate motion is the editorial-video
  // signature — frame is alive even when nothing else moves.
  const frame = useCurrentFrame();

  // Resolve motion identity → individual layer config. Prop-level toggles
  // (noGrain, noAtmosphere) win over preset defaults so a "briefing" Background
  // can still opt out of grain for a specific composition.
  const motion = motionIdentities[motionIdentity];
  const grainActive =
    !isTransparent && motion.grain.enabled && !noGrain;
  const atmosphereActive =
    !isTransparent &&
    motion.atmosphere.enabled &&
    !noAtmosphere &&
    variant === "light";
  const wobbleOffset =
    isTransparent || !motion.wobble.enabled
      ? { x: 0, y: 0 }
      : computeWobble(frame, motion.wobble.amplitude);
  const grainOpacity = isDark ? motion.grain.opacityDark : motion.grain.opacityLight;

  // Light mode gets ruled border by default; transparent defaults off so backdrops read.
  const effectiveBorder =
    border ?? (variant === "light" && !isTransparent);

  // Default atmosphere: normal for dark, subtle for light; none when transparent
  const effectiveDensity = isTransparent
    ? "none"
    : atmosphere ?? (isDark ? "normal" : "subtle");

  // Per-episode color emphasis. The atmospheric tint defaults to the
  // episode's primary accent when (a) no explicit `tint` is passed AND
  // (b) the episode opted into a non-neutral emphasis — this extends
  // per-episode visual identity from charts/labels into the ambient
  // frame for Soviet/Chinese-state/Showa/etc. episodes without changing
  // how neutral-emphasis episodes (the channel default) have always
  // rendered. Templates that want a specific tint (e.g. semantic.us
  // for US-focused analysis) still pass `tint` explicitly.
  const emphasis = useEpisodeColorEmphasis();
  const emphasisName = useEpisodeColorEmphasisName();
  const effectiveTint =
    tint ?? (emphasisName !== "neutral" ? emphasis.primaryAccent : undefined);

  // ── Background gradient ─────────────────────────────────────────────
  const bgStyle: React.CSSProperties = (() => {
    if (color) return { backgroundColor: color };

    switch (variant) {
      case "dark":
        return {
          background: `radial-gradient(ellipse at center, ${dark.bg.surface} 0%, ${dark.bg.base} 100%)`,
        };
      case "map":
        return {
          background: `radial-gradient(ellipse at center, ${dark.bg.map} 0%, ${dark.bg.base} 100%)`,
        };
      case "transparent":
        return { backgroundColor: "transparent" };
      case "light":
        return {
          backgroundColor: light.bg.base,
        };
      default:
        return { backgroundColor: light.bg.base };
    }
  })();

  return (
    <AbsoluteFill style={{ ...bgStyle, overflow: "hidden" }}>
      {/* Substrate wobble wrapper — applies sub-pixel jitter to grain,
          atmosphere, vignette, tint, and particles. Content (children) and
          editorial chrome (border, stamp) live OUTSIDE this wrapper so type
          never jitters (eye reads jitter on numbers as data instability). */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          transform: `translate(${wobbleOffset.x}px, ${wobbleOffset.y}px)`,
          willChange:
            !isTransparent && motion.wobble.enabled ? "transform" : undefined,
        }}
      >
      {/* Animated film grain — per-frame re-randomized noise (seeded by
          current frame) gives real "film stock" motion at the substrate
          level. Industry name: "organic grain plate." Opacity, enabled
          state, and visibility all driven by the resolved motion identity. */}
      {grainActive && (
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            mixBlendMode: isDark ? "overlay" : "multiply",
            opacity: grainOpacity,
            pointerEvents: "none",
          }}
          aria-hidden
        >
          <filter id="organic-grain">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="1.6"
              numOctaves={2}
              // Seed advances every other frame (15Hz at 30fps) — matches
              // how 35mm film grain at 24fps visually pulses, each frame
              // a distinct emulsion event.
              seed={Math.floor(frame / 2)}
            />
          </filter>
          <rect width="100%" height="100%" filter="url(#organic-grain)" />
        </svg>
      )}

      {/* Atmospheric drift — slow-moving low-opacity radial gradients give
          the frame "weather" behind content. Two clouds at different speeds
          create gentle parallax: the substrate looks like it has temperature
          and humidity, not a flat plane. Industry name: "ambient layer" /
          "atmospheric perspective" (after Da Vinci's sfumato). Used by FT
          climate pieces, Bloomberg Originals, Netflix Explained. Calibrated
          to research recommendation: <8% opacity, 30–60s loop, warm tones
          in light mode. Disabled in dark mode (the dark vignette already
          carries the atmospheric weight) and on maps (need clear basemap). */}
      {atmosphereActive && (() => {
        // Two clouds at different periods + offset positions create the
        // parallax-dust effect. Periods chosen as coprime so the cycle
        // doesn't visually repeat within a typical episode duration.
        const period1 = 1500; // 50s at 30fps
        const period2 = 2100; // 70s at 30fps
        const c1x = 0.30 + Math.sin((frame * 2 * Math.PI) / period1) * 0.12;
        const c1y = 0.35 + Math.cos((frame * 2 * Math.PI) / period1) * 0.10;
        const c2x = 0.70 + Math.cos((frame * 2 * Math.PI) / period2) * 0.10;
        const c2y = 0.60 + Math.sin((frame * 2 * Math.PI) / period2) * 0.08;
        const cloudColor = palette.gold;
        // Per-identity intensity scaling — "documentary" softens atmosphere
        // (so the heavier grain doesn't compete), "briefing" uses standard.
        const scale = motion.atmosphere.intensityScale;
        // Hex alpha values scaled by intensityScale. 0x26 = 38 = standard
        // base; multiply by scale and floor back into hex for output.
        const hex = (a: number) => Math.max(0, Math.min(255, Math.round(a * scale))).toString(16).padStart(2, "0");
        return (
          <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply" }}>
            <div
              style={{
                position: "absolute",
                width: "70%",
                height: "70%",
                left: `${c1x * 100}%`,
                top: `${c1y * 100}%`,
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle, ${cloudColor}${hex(0x26)} 0%, ${cloudColor}${hex(0x10)} 40%, transparent 70%)`,
                filter: "blur(80px)",
              }}
            />
            <div
              style={{
                position: "absolute",
                width: "60%",
                height: "60%",
                left: `${c2x * 100}%`,
                top: `${c2y * 100}%`,
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle, ${palette.umber}${hex(0x1F)} 0%, ${palette.umber}${hex(0x0A)} 40%, transparent 70%)`,
                filter: "blur(100px)",
              }}
            />
          </AbsoluteFill>
        );
      })()}

      {/* Vignette overlay — edges darken (dark mode) or subtle (light mode) */}
      {isDark && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.3) 100%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Color temperature tint — emotional register shift. When no explicit
          tint is passed, the episode's primary accent provides a per-episode
          atmospheric cast at lower intensity (10/06 hex alpha vs 18/0C) so
          the default emphasis-driven tint is gentler than a script-specified
          tint that's intentionally pushing emotional temperature. */}
      {effectiveTint && !isTransparent && (
        <AbsoluteFill
          style={{
            background: tint
              ? `radial-gradient(ellipse at 40% 45%, ${tint}18 0%, ${tint}0C 50%, transparent 100%)`
              : `radial-gradient(ellipse at 40% 45%, ${effectiveTint}10 0%, ${effectiveTint}06 50%, transparent 100%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Atmospheric particles — the cinematic layer. Pass effectiveTint
          (which may be the episode emphasis fallback) so particle hue
          participates in per-episode identity. */}
      {effectiveDensity !== "none" && (
        <Atmosphere density={effectiveDensity} tint={effectiveTint} isDark={isDark} intensity={atmosphereIntensity} noBlur={noBlur} />
      )}
      </div>
      {/* end substrate-wobble wrapper — everything below this is outside the
          wobble so type and editorial chrome never jitter. */}

      {/* Light mode ruled border — inset 40px, 1px border (BRAND.md: editorial briefing) */}
      {effectiveBorder && (
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            right: 40,
            bottom: 40,
            border: `1px solid ${light.bg.border}`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Light mode rubber stamp — BRAND.md: rotated 2-3° in oxblood, top-right area */}
      {variant === "light" && stampLabel && (
        <div
          style={{
            position: "absolute",
            top: layout.safeArea.top + 8,
            right: layout.safeArea.right + 8,
            fontFamily: fonts.mono,
            fontSize: fontSizes.caption,
            fontWeight: 600,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: palette.walnut,
            opacity: 0.35,
            transform: "rotate(-2.5deg)",
            transformOrigin: "top right",
            border: `1.5px solid ${palette.walnut}50`,
            borderRadius: 2,
            padding: "4px 12px",
            pointerEvents: "none",
            zIndex: 15,
          }}
        >
          {stampLabel}
        </div>
      )}

      {/* Content layer */}
      {children}
    </AbsoluteFill>
  );
};
