/**
 * AmbientParticles — subtle background particle drift for depth and life.
 *
 * Renders deterministic floating particles that drift slowly across the canvas.
 * Uses Remotion's frame-based animation (no requestAnimationFrame) for consistent
 * renders. Particles are seeded deterministically so renders are reproducible.
 *
 * Design principles:
 *   - Never distracting — particles are subtle (low opacity, small, slow)
 *   - Theme-aware — uses appropriate colors for light/dark modes
 *   - Configurable density and speed for different template moods
 *   - Zero runtime allocation — all positions computed from frame + seed
 *
 * Usage:
 *   <AmbientParticles
 *     mode="dark"
 *     density={30}
 *     speed={0.3}
 *     color="rgba(229,165,68,0.08)"
 *   />
 */

import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { layout } from "../design/theme";

export interface AmbientParticlesProps {
  /** Light or dark mode (affects default color) */
  mode?: "light" | "dark";
  /** Number of particles (default: 25) */
  density?: number;
  /** Movement speed multiplier (default: 0.4, range 0.1–2.0) */
  speed?: number;
  /** Particle color override (default: theme-based) */
  color?: string;
  /** Max particle radius in px (default: 2.5) */
  maxRadius?: number;
  /** Min particle radius in px (default: 0.8) */
  minRadius?: number;
  /** Max opacity per particle (default: 0.15) */
  maxOpacity?: number;
  /** Whether particles should gently pulse in opacity (default: true) */
  pulse?: boolean;
  /** Seed for deterministic randomness (default: 42) */
  seed?: number;
  /** Canvas width override (default: layout.width) */
  width?: number;
  /** Canvas height override (default: layout.height) */
  height?: number;
}

// ── Deterministic pseudo-random (seeded) ──────────────────────────────────

const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

// ── Particle data generation ──────────────────────────────────────────────

interface Particle {
  /** Starting X (0-1 normalized) */
  x0: number;
  /** Starting Y (0-1 normalized) */
  y0: number;
  /** X drift speed (pixels per frame) */
  vx: number;
  /** Y drift speed (pixels per frame) */
  vy: number;
  /** Radius */
  radius: number;
  /** Base opacity */
  opacity: number;
  /** Phase offset for pulsing */
  phase: number;
}

const generateParticles = (
  count: number,
  seed: number,
  speed: number,
  minRadius: number,
  maxRadius: number,
  maxOpacity: number
): Particle[] => {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const s = seed + i * 7;
    particles.push({
      x0: seededRandom(s),
      y0: seededRandom(s + 1),
      vx: (seededRandom(s + 2) - 0.5) * speed * 0.4,
      vy: (seededRandom(s + 3) - 0.5) * speed * 0.3 - speed * 0.1, // slight upward bias
      radius: minRadius + seededRandom(s + 4) * (maxRadius - minRadius),
      opacity: 0.03 + seededRandom(s + 5) * (maxOpacity - 0.03),
      phase: seededRandom(s + 6) * Math.PI * 2,
    });
  }
  return particles;
};

// ── Component ─────────────────────────────────────────────────────────────

export const AmbientParticles: React.FC<AmbientParticlesProps> = React.memo(
  ({
    mode = "dark",
    density = 25,
    speed = 0.4,
    color,
    maxRadius = 2.5,
    minRadius = 0.8,
    maxOpacity = 0.15,
    pulse = true,
    seed = 42,
    width = layout.width,
    height = layout.height,
  }) => {
    const frame = useCurrentFrame();

    // Default colors by mode
    const particleColor =
      color || (mode === "dark" ? "rgba(240,230,208,0.12)" : "rgba(28,24,20,0.06)");

    // Generate particles once (memoized)
    const particles = useMemo(
      () => generateParticles(density, seed, speed, minRadius, maxRadius, maxOpacity),
      [density, seed, speed, minRadius, maxRadius, maxOpacity]
    );

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: "none",
        }}
      >
        {particles.map((p, i) => {
          // Compute position with wrapping
          const rawX = p.x0 * width + p.vx * frame;
          const rawY = p.y0 * height + p.vy * frame;
          const x = ((rawX % width) + width) % width;
          const y = ((rawY % height) + height) % height;

          // Optional pulse
          const opacityMod = pulse
            ? 0.7 + 0.3 * Math.sin(frame * 0.03 + p.phase)
            : 1;

          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={p.radius}
              fill={particleColor}
              opacity={p.opacity * opacityMod}
            />
          );
        })}
      </svg>
    );
  }
);

AmbientParticles.displayName = "AmbientParticles";
