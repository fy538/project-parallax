/**
 * StratumSidebar — historical era bands along the left edge.
 *
 * Meridian "Stratum" episode-type variant (BRAND.md):
 * Horizontal bands along the left edge showing historical eras,
 * colored in warm earth tones. Positioned flush with the left
 * edge of the frame, running full height.
 *
 * Usage:
 *   <Background variant="light">
 *     <StratumSidebar
 *       eras={[
 *         { label: "2026", color: "present" },
 *         { label: "1947", color: "coldWar" },
 *         { label: "1900", color: "empire" },
 *       ]}
 *     />
 *     {content}
 *   </Background>
 */

import React from "react";
import { useCurrentFrame } from "remotion";
import { interpolate, Easing } from "remotion";
import { palette, fonts, fontSizes, layout, sec } from "../design/theme";
import { fadeIn } from "../utils/animation";

// ── Era color presets (BRAND.md strata table) ───────────────────────────

const ERA_COLORS = {
  present: palette.bone,
  coldWar: palette.sand,
  empire: palette.umber,
  industrial: `${palette.walnut}99`, // rust at 60%
  deep: `${palette.ink}80`,          // ink at 50%
} as const;

type EraPreset = keyof typeof ERA_COLORS;

export interface StratumEra {
  /** Year or era label (e.g., "2026", "1947", "1900 BCE") */
  label: string;
  /** Color preset name or raw hex */
  color: EraPreset | string;
}

interface StratumSidebarProps {
  /** Eras to display, ordered top to bottom (present → deep past) */
  eras: StratumEra[];
  /** Width of the sidebar bands in px (default: 100) */
  width?: number;
  /** Stagger delay between band reveals in seconds (default: 0.12) */
  staggerSec?: number;
  /** Start time in seconds (default: 0.3) */
  startSec?: number;
}

const resolveColor = (color: string): string =>
  (ERA_COLORS as Record<string, string>)[color] || color;

/** Presets that need light text to maintain contrast. */
const DARK_PRESETS = new Set<string>(["industrial", "deep"]);

export const StratumSidebar: React.FC<StratumSidebarProps> = ({
  eras,
  width = 100,
  staggerSec = 0.12,
  startSec = 0.3,
}) => {
  const frame = useCurrentFrame();
  const bandHeight = layout.height / eras.length;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width,
        height: layout.height,
        zIndex: 5,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {eras.map((era, i) => {
        const bandStart = sec(startSec + i * staggerSec);
        // Slide in from left
        const slideProgress = interpolate(
          frame,
          [bandStart, bandStart + sec(0.5)],
          [0, 1],
          {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.cubic),
          }
        );
        const translateX = (1 - slideProgress) * -width;
        const opacity = fadeIn(frame, bandStart, sec(0.4));
        const color = resolveColor(era.color);

        return (
          <div
            key={era.label}
            style={{
              position: "absolute",
              top: i * bandHeight,
              left: 0,
              width,
              height: bandHeight,
              backgroundColor: color,
              opacity: opacity * 0.6, // bands are subtle, not overpowering
              transform: `translateX(${translateX}px)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Era label — rotated vertically */}
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: fontSizes.meta,
                fontWeight: 400,
                letterSpacing: 2.5,
                color: DARK_PRESETS.has(era.color) ? palette.bone : palette.ink,
                opacity: slideProgress * 0.7,
                transform: "rotate(-90deg)",
                whiteSpace: "nowrap",
                textTransform: "uppercase",
              }}
            >
              {era.label}
            </div>
          </div>
        );
      })}

      {/* Right edge: thin separator line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 1,
          height: layout.height,
          background: `linear-gradient(180deg, transparent 5%, ${palette.umber}30 20%, ${palette.umber}30 80%, transparent 95%)`,
          opacity: fadeIn(frame, sec(startSec + eras.length * staggerSec), sec(0.3)),
        }}
      />
    </div>
  );
};

StratumSidebar.displayName = "StratumSidebar";
