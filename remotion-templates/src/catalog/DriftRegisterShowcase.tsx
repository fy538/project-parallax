/**
 * CatalogDriftRegisterShowcase — visual reference for HOLD_MOTION_REGISTER.
 *
 * A 3×2 mosaic showing six drift presets running simultaneously on identical
 * content. Each cell is its own independent drift register (none / editorial /
 * breathing / settle / sway / documentary) so script-writers can compare
 * presets side-by-side before reaching for `DIR: drift(<preset>)`.
 *
 * The two adjacent treatments named in HOLD_MOTION_REGISTER.md (atmospheric
 * particles, mood pulse) live at the substrate / chrome layer and are NOT
 * direct drift presets — they're documented inline in the register doc and
 * not part of this showcase.
 *
 * See: `project/HOLD_MOTION_REGISTER.md`, POLISH.md D20.
 */

import React from "react";
import { AbsoluteFill, Composition } from "remotion";
import { palette, fonts, fontSizes, layout, letterSpacing, sec } from "../design/theme";
import { useCompositionAnimation } from "../hooks/useCompositionAnimation";
import { useDirection, type DriftPreset } from "../hooks/useDirection";
import { Background } from "../components/Background";
import { HeaderStrip } from "../components/HeaderStrip";
import { FooterStrip } from "../components/FooterStrip";
import { CATALOG_EPISODE, catalogId } from "./helpers";

// ── Cell content ───────────────────────────────────────────────────────────
//
// Each cell renders the same stat-reveal-style card so the *difference* the
// viewer reads is purely the drift register — same content, different motion.
// Hero stat ("92%") is the same fixed value across cells; the cell label
// names the preset; subtitle paraphrases the preset's implicit claim from
// HOLD_MOTION_REGISTER.md.

interface DriftCellProps {
  preset: DriftPreset;
  label: string;
  implicitClaim: string;
}

const DriftCell: React.FC<DriftCellProps> = ({ preset, label, implicitClaim }) => {
  // Use the same cascade production templates use — pass preset as the
  // template default to useDirection. This keeps the showcase honest:
  // when DRIFT_PRESETS change in useDirection.ts, the showcase reflects
  // the new behavior automatically.
  const direction = useDirection(undefined, preset);
  const { style: driftStyle } = useCompositionAnimation(direction.driftOptions);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        border: `1px solid ${palette.taupe}40`,
        overflow: "hidden",
      }}
    >
      {/* Preset label — top-left mono caps */}
      <div
        style={{
          position: "absolute",
          top: 20,
          left: 24,
          fontFamily: fonts.metadata,
          fontSize: fontSizes.caption,
          fontWeight: 600,
          letterSpacing: letterSpacing.meta,
          color: palette.amber,
          textTransform: "uppercase",
          zIndex: 2,
        }}
      >
        {label}
      </div>

      {/* Implicit-claim subtitle — top-left, smaller, muted */}
      <div
        style={{
          position: "absolute",
          top: 42,
          left: 24,
          fontFamily: fonts.metadata,
          fontSize: 11,
          fontWeight: 400,
          letterSpacing: 0.4,
          color: palette.ink,
          opacity: 0.55,
          maxWidth: 260,
          lineHeight: 1.3,
          zIndex: 2,
        }}
      >
        {implicitClaim}
      </div>

      {/* Drifted content — the part that responds to the preset.
          Centered "stat reveal" mockup with a +crosshair registration mark
          in each corner so scale / pan / rotation are all visible against
          the cell border. */}
      <AbsoluteFill style={driftStyle}>
        {/* Corner registration marks — make pan and rotation visible */}
        <CornerMark x={24} y={24} corner="tl" />
        <CornerMark x={24} y={24} corner="tr" />
        <CornerMark x={24} y={24} corner="bl" />
        <CornerMark x={24} y={24} corner="br" />

        {/* Hero stat — centered, makes scale visible */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: fonts.data,
              fontSize: 56,
              fontWeight: 700,
              color: palette.ink,
              letterSpacing: 0,
              lineHeight: 1,
            }}
          >
            92%
          </div>
          <div
            style={{
              fontFamily: fonts.metadata,
              fontSize: 12,
              fontWeight: 400,
              color: palette.ink,
              opacity: 0.6,
              letterSpacing: letterSpacing.meta,
              textTransform: "uppercase",
              marginTop: 8,
            }}
          >
            advanced-node chips
          </div>
        </div>
      </AbsoluteFill>
    </div>
  );
};

// Tiny corner registration mark — L-shaped hairline in each corner.
// Drawn at fixed inset distance so when the cell content scales/pans/rotates,
// the marks move with it and the viewer can compare against the cell border.
const CornerMark: React.FC<{ x: number; y: number; corner: "tl" | "tr" | "bl" | "br" }> = ({
  x,
  y,
  corner,
}) => {
  const len = 12;
  const stroke = `${palette.taupe}80`;
  const sw = 0.8;

  // Position the L-bracket at the named corner
  const isLeft = corner === "tl" || corner === "bl";
  const isTop = corner === "tl" || corner === "tr";

  const px = isLeft ? x : `calc(100% - ${x}px)`;
  const py = isTop ? y : `calc(100% - ${y}px)`;

  return (
    <>
      {/* Horizontal segment */}
      <div
        style={{
          position: "absolute",
          left: isLeft ? px : `calc(100% - ${x + len}px)`,
          top: py,
          width: len,
          height: sw,
          background: stroke,
        }}
      />
      {/* Vertical segment */}
      <div
        style={{
          position: "absolute",
          left: px,
          top: isTop ? py : `calc(100% - ${y + len}px)`,
          width: sw,
          height: len,
          background: stroke,
        }}
      />
    </>
  );
};

// ── Mosaic ─────────────────────────────────────────────────────────────────

/**
 * The six drift presets in author-recommended viewing order: from total
 * stillness on the left, through increasing motion intensity, to full
 * documentary Ken Burns on the right.
 *
 * Row 1: stillness — editorial — breathing
 * Row 2: settle     — sway      — documentary
 *
 * Implicit-claim phrasing matches HOLD_MOTION_REGISTER.md exactly so the
 * showcase doubles as a vocabulary card for the doctrine doc.
 */
const CELLS: Array<{ preset: DriftPreset; label: string; implicitClaim: string }> = [
  {
    preset: "none",
    label: "01 · Stillness",
    implicitClaim: "document of record; nothing competes with reading it",
  },
  {
    preset: "editorial",
    label: "02 · Editorial",
    implicitClaim: "analytical content; the screen is barely alive, intentionally",
  },
  {
    preset: "breathing",
    label: "03 · Breathing",
    implicitClaim: "this single idea is held and alive",
  },
  {
    preset: "settle",
    label: "04 · Settle",
    implicitClaim: "composition established and now waiting",
  },
  {
    preset: "sway",
    label: "05 · Sway",
    implicitClaim: "held view with subtle life, no directional slip",
  },
  {
    preset: "documentary",
    label: "06 · Documentary",
    implicitClaim: "this image is a master shot; meaning accrues through duration",
  },
];

export const DriftRegisterShowcase: React.FC = () => {
  return (
    <Background variant="light">
      <HeaderStrip mode="light" metadata={CATALOG_EPISODE} />
      <AbsoluteFill
        style={{
          padding: `${layout.safeArea.top + 80}px ${layout.safeArea.right}px ${layout.safeArea.bottom + 60}px ${layout.safeArea.left}px`,
        }}
      >
        {/* Title — sits above the mosaic */}
        <div
          style={{
            position: "absolute",
            top: layout.safeArea.top + 8,
            left: layout.safeArea.left,
            fontFamily: fonts.heading,
            fontSize: fontSizes.h3,
            fontWeight: 700,
            color: palette.ink,
            letterSpacing: 0,
          }}
        >
          The hold-motion register
        </div>
        <div
          style={{
            position: "absolute",
            top: layout.safeArea.top + 50,
            left: layout.safeArea.left,
            fontFamily: fonts.metadata,
            fontSize: fontSizes.caption,
            fontWeight: 400,
            color: palette.ink,
            opacity: 0.6,
            letterSpacing: 0.4,
          }}
        >
          Six drift presets, identical content. POLISH.md D20 / HOLD_MOTION_REGISTER.md
        </div>

        {/* 3×2 mosaic */}
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            gap: 8,
          }}
        >
          {CELLS.map((cell) => (
            <DriftCell
              key={cell.preset}
              preset={cell.preset}
              label={cell.label}
              implicitClaim={cell.implicitClaim}
            />
          ))}
        </div>
      </AbsoluteFill>
      <FooterStrip mode="light" />
    </Background>
  );
};

// ── Composition registration ───────────────────────────────────────────────

const SHOWCASE_DURATION_SEC = 16;

export const CatalogDriftRegisterShowcase: React.FC = () => (
  <Composition
    id={catalogId("Showcase", "drift-register")}
    component={DriftRegisterShowcase}
    durationInFrames={sec(SHOWCASE_DURATION_SEC)}
    fps={layout.fps}
    width={layout.width}
    height={layout.height}
  />
);
