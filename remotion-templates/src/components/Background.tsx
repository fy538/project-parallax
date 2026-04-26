/**
 * Background — layered full-frame background for compositions.
 *
 * Three visual planes per BRAND.md / POLISH.md:
 *   z=0  Background gradient or textured surface (this component)
 *   z=1  Content layer (children)
 *   z=2  Accent elements (handled by individual templates)
 *
 * Dark mode:  radial gradient vignette (ink center → bg.dark.base edges)
 * Light mode: flat paper with subtle noise texture + optional ruled border
 * Map mode:   dark map background with slightly different tone
 *
 * Usage:
 *   <Background variant="dark">{children}</Background>
 *   <Background variant="light" border>{children}</Background>
 */

import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { dark, light, palette, layout } from "../design/theme";

interface BackgroundProps {
  color?: string;
  variant?: "dark" | "light" | "map";
  /** Show ruled border inset 40px (light mode only, per BRAND.md) */
  border?: boolean;
  /** Disable grain overlay (default: enabled) */
  noGrain?: boolean;
  children?: React.ReactNode;
}

export const Background: React.FC<BackgroundProps> = ({
  color,
  variant = "dark",
  border = false,
  noGrain = false,
  children,
}) => {
  const isDark = variant === "dark" || variant === "map";

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
      case "light":
        return {
          backgroundColor: light.bg.base,
        };
      default:
        return { backgroundColor: dark.bg.base };
    }
  })();

  return (
    <AbsoluteFill style={bgStyle}>
      {/* Grain overlay — subtle film texture */}
      {!noGrain && (
        <AbsoluteFill
          style={{
            backgroundImage: `url(${staticFile("assets/noise-512.png")})`,
            backgroundRepeat: "repeat",
            backgroundSize: "512px 512px",
            mixBlendMode: isDark ? "overlay" : "multiply",
            opacity: isDark ? 0.12 : 0.04,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Vignette overlay — edges darken (dark mode) or subtle (light mode) */}
      {isDark && (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.2) 100%)`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Light mode ruled border — inset 40px, 1px border */}
      {variant === "light" && border && (
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

      {/* Content layer */}
      {children}
    </AbsoluteFill>
  );
};
