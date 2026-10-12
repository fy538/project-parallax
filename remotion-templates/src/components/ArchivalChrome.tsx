/**
 * ArchivalChrome — shared visual primitives for the Documentary Archival
 * template family (HandwrittenLetter, NewspaperHeadlineRotator, ArchivalReel,
 * TelegramCable).
 *
 * Three primitives:
 *
 *   <ArchivalPaper>      — cream/bone substrate with `tx-paper-grain` texture
 *                          and optional foxing / aging treatment. Used as
 *                          the background card for HandwrittenLetter,
 *                          TelegramCable, and NewspaperHeadlineRotator pages.
 *
 *   <RubberStamp>        — slightly-skewed semi-bled stamp (TOP SECRET /
 *                          SECRET / CONFIDENTIAL / DECLASSIFIED). Used by
 *                          TelegramCable for classification overlays.
 *
 *   <PunchHoles>         — 3-hole binder pattern for the left margin of
 *                          archival document forms. Used by TelegramCable.
 *
 * Editorial register: these primitives carry the "this is an artifact"
 * signal. The texture, the foxing, the skewed stamp, the punch holes — none
 * of them carry data, but they ARE the editorial argument that what you're
 * looking at is a real historical document, not a typeset reconstruction.
 *
 * Tufte would call this "non-data ink that earns its keep" — the chrome
 * isn't decoration, it's authentication.
 */

import React from "react";
import { palette } from "../design/theme";
import { TextureFilters } from "../utils/textures";

// ── ArchivalPaper ──────────────────────────────────────────────────────────

interface ArchivalPaperProps {
  /** Width in px. */
  width: number;
  /** Height in px. */
  height: number;
  /**
   * Aging amount 0–1. 0 = pristine cream paper; 1 = heavy foxing + warm
   * yellow shift. Default 0.3 (subtle aging, suitable for ~50-100 year old
   * documents). For pre-1900 substrate try 0.6+.
   */
  aged?: number;
  /**
   * Paper substrate variant.
   *   • "letter"     — cream/bone, soft warmth (default — Sullivan Ballou,
   *                    handwritten correspondence)
   *   • "newsprint"  — cooler yellowed cream, halftone dot-screen via
   *                    `tx-printed` filter (newspaper pages)
   *   • "onionskin"  — translucent pale grey, near-white (telegram cables)
   *   • "carbon"     — slightly purple-grey ghost of onionskin (carbon copy)
   */
  variant?: "letter" | "newsprint" | "onionskin" | "carbon";
  /** Child content (text, image, etc.). */
  children?: React.ReactNode;
  /** Additional style overrides. */
  style?: React.CSSProperties;
  /** Texture seed — different per composition keeps grain non-repeating. */
  seed?: number;
}

/** Paper substrate. Renders a full-width block with the chosen base colour,
 *  texture overlay, and optional aging cast. Children render on top.
 *  All four documentary-archival templates use this as their primary surface. */
export const ArchivalPaper: React.FC<ArchivalPaperProps> = ({
  width,
  height,
  aged = 0.3,
  variant = "letter",
  children,
  style,
  seed = 7,
}) => {
  const baseColors: Record<NonNullable<ArchivalPaperProps["variant"]>, string> = {
    letter: "#F1E6CE", // bone, lightly warmer than palette.bone
    newsprint: "#EFE6CC", // slightly more yellow than letter
    onionskin: "#E8E5DC", // pale cool grey
    carbon: "#D9D2C8", // slightly purple-grey ghost
  };
  const base = baseColors[variant];
  // Aging tint — overlay a warm yellow at low opacity (per `aged` knob).
  const tintAlpha = aged * 0.22;
  // Foxing — small irregular brown blotches (per `aged` knob). Implemented
  // as low-opacity radial gradients positioned at deterministic offsets
  // computed from `seed`. Real foxing is biological — chaotic but not random.
  const foxingSpots = aged > 0.15
    ? Array.from({ length: Math.floor(2 + aged * 6) }, (_, i) => {
        const sx = ((seed * 31 + i * 71) % 100);
        const sy = ((seed * 47 + i * 113) % 100);
        const sr = 1.5 + ((seed * 13 + i * 17) % 8);
        return { x: sx, y: sy, r: sr, k: i };
      })
    : [];

  return (
    <div
      style={{
        position: "relative",
        width,
        height,
        background: base,
        overflow: "hidden",
        boxShadow:
          variant === "onionskin" || variant === "carbon"
            ? "0 2px 12px rgba(28,24,20,0.18)"
            : "0 4px 28px rgba(28,24,20,0.16)",
        ...style,
      }}
    >
      {/* Texture filter — paper grain via SVG turbulence overlay. */}
      <svg
        width={width}
        height={height}
        style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
      >
        <defs>
          <TextureFilters intensity={0.45} seed={seed} />
        </defs>
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill={base}
          filter="url(#tx-paper-grain)"
          opacity={0.6}
        />
      </svg>
      {/* Aging tint overlay. */}
      {tintAlpha > 0 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(${(seed % 4) * 90}deg, rgba(160,110,40,${tintAlpha * 1.2}) 0%, rgba(180,140,80,${tintAlpha * 0.5}) 50%, rgba(160,110,40,${tintAlpha * 1.1}) 100%)`,
            mixBlendMode: "multiply",
            pointerEvents: "none",
          }}
        />
      )}
      {/* Foxing spots — soft brown blotches at deterministic positions. */}
      {foxingSpots.length > 0 && (
        <svg
          width={width}
          height={height}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            mixBlendMode: "multiply",
          }}
        >
          {foxingSpots.map((s) => (
            <circle
              key={`fox-${s.k}`}
              cx={(s.x / 100) * width}
              cy={(s.y / 100) * height}
              r={(s.r / 100) * Math.min(width, height) * 0.6}
              fill={`rgba(120,80,30,${0.04 + aged * 0.05})`}
            />
          ))}
        </svg>
      )}
      {/* Soft edge vignette — paper edges darker than centre. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, transparent 60%, rgba(60,40,20,0.18) 100%)",
          pointerEvents: "none",
          mixBlendMode: "multiply",
        }}
      />
      {/* Content layer. */}
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {children}
      </div>
    </div>
  );
};

// ── RubberStamp ────────────────────────────────────────────────────────────

interface RubberStampProps {
  /** Stamp label — typically a single word. ALL CAPS recommended. */
  label: string;
  /** Optional sub-label (e.g., release date for DECLASSIFIED). */
  subLabel?: string;
  /** Stamp colour. Default red ink for classification; black for DECLASSIFIED. */
  color?: string;
  /** Rotation in degrees. Default -7 (slightly counter-clockwise, "stamped quickly"). */
  rotation?: number;
  /** Scale 0.5-2.0. Default 1.0 (~140px label width at h1 font size). */
  scale?: number;
  /** Opacity. Default 0.78 — semi-bled rubber stamp look. */
  opacity?: number;
  /** Position styling. */
  style?: React.CSSProperties;
}

/** Bureaucratic rubber stamp — TOP SECRET / SECRET / CONFIDENTIAL /
 *  DECLASSIFIED. Slightly skewed, semi-bled. Box border + ALL CAPS label
 *  inside a double-line frame, with optional date stamp below. */
export const RubberStamp: React.FC<RubberStampProps> = ({
  label,
  subLabel,
  color,
  rotation = -7,
  scale = 1.0,
  opacity = 0.78,
  style,
}) => {
  const stampColor =
    color ?? (label.toLowerCase().includes("declassified") ? "#1A1A1A" : "#A63A2E");
  const labelSize = 28 * scale;
  const subSize = 11 * scale;
  const pad = 12 * scale;
  return (
    <div
      style={{
        display: "inline-block",
        transform: `rotate(${rotation}deg)`,
        opacity,
        // Slight horizontal blur to simulate ink-bleed.
        filter: "blur(0.4px)",
        ...style,
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: `${pad}px ${pad * 1.6}px`,
          border: `${3 * scale}px solid ${stampColor}`,
          boxShadow: `inset 0 0 0 ${1.5 * scale}px ${stampColor}`,
          // Double-frame stamp idiom.
        }}
      >
        <div
          style={{
            fontFamily: '"Special Elite", "Courier Prime", monospace',
            fontSize: labelSize,
            fontWeight: 700,
            letterSpacing: 4 * scale,
            color: stampColor,
            lineHeight: 1,
            textAlign: "center",
          }}
        >
          {label.toUpperCase()}
        </div>
        {subLabel && (
          <div
            style={{
              fontFamily: '"Special Elite", "Courier Prime", monospace',
              fontSize: subSize,
              color: stampColor,
              letterSpacing: 1.5 * scale,
              marginTop: 4 * scale,
              textAlign: "center",
            }}
          >
            {subLabel.toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
};

// ── PunchHoles ─────────────────────────────────────────────────────────────

interface PunchHolesProps {
  /** Container height (px) the holes are positioned within. */
  height: number;
  /** Horizontal offset from container's left edge. Default 24. */
  left?: number;
  /** Hole radius. Default 8. */
  radius?: number;
  /** Number of holes. Default 3 (US 3-hole binder); 2 for European. */
  count?: number;
  /** Hole interior colour — should match the page background for "transparent". */
  fillColor?: string;
}

/** Three-hole binder punches down a document's left margin. Renders as
 *  cut-out circles (matched to page background) with a subtle dark ring
 *  suggesting the hole's edge depth. Used by TelegramCable to signal
 *  "this came out of a binder." */
export const PunchHoles: React.FC<PunchHolesProps> = ({
  height,
  left = 24,
  radius = 8,
  count = 3,
  fillColor = "rgba(255,255,255,0.0)",
}) => {
  // Distribute holes evenly along the full height with vertical inset.
  const vInset = Math.max(60, height * 0.12);
  const span = height - vInset * 2;
  const positions = Array.from({ length: count }, (_, i) =>
    count === 1 ? height / 2 : vInset + (span / (count - 1)) * i,
  );
  return (
    <svg
      width={left * 2 + radius * 2}
      height={height}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none" }}
    >
      {positions.map((y, i) => (
        <g key={`punch-${i}`}>
          {/* Outer subtle drop-shadow ring. */}
          <circle
            cx={left}
            cy={y + 2}
            r={radius + 1}
            fill="rgba(60,40,20,0.18)"
          />
          {/* Hole interior — appears "cut out" via background-matched fill. */}
          <circle cx={left} cy={y} r={radius} fill={fillColor} />
          {/* Inner edge ring — hole-edge depth. */}
          <circle
            cx={left}
            cy={y}
            r={radius}
            fill="none"
            stroke="rgba(40,28,16,0.28)"
            strokeWidth={1}
          />
        </g>
      ))}
    </svg>
  );
};

// ── Re-exports for convenience ─────────────────────────────────────────────

export const archivalPalette = {
  letter: "#F1E6CE",
  newsprint: "#EFE6CC",
  onionskin: "#E8E5DC",
  carbon: "#D9D2C8",
  classificationRed: "#A63A2E",
  declassifiedBlack: "#1A1A1A",
  inkBrown: palette.ink,
} as const;
