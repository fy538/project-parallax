/**
 * TransitionGrammarShowcase — visual reference for TRANSITION_GRAMMAR.md.
 *
 * A 3×2 mosaic showing the six canonical transitions firing simultaneously
 * on identical content. Each cell loops independently, demonstrating one
 * transition on the same two-slide pair so script-writers can compare them
 * side-by-side before reaching for `DIR: cut(<type>)`.
 *
 * Content: "1850 / Oil embargo" → "2025 / Chip controls" — the canonical
 * Parallax historical-analogy seam, matching the doctrine examples in
 * TRANSITION_GRAMMAR.md §04.
 *
 * Layout:
 *   Row 1: Hard cut · Cross-dissolve · Fade-through-black
 *   Row 2: Match cut (zoom) · Color-wash (ink) · Iris
 *
 * The composition-locked match-cut-still variant (§04b) and audio-bridged
 * J/L cuts (§07) are documented in the doctrine rather than shown here —
 * match-cut-still requires identical composition framing to demonstrate,
 * and J/L cuts live at the audio layer not the visual transition layer.
 *
 * See: `project/TRANSITION_GRAMMAR.md`, POLISH.md D21.
 */

import React from "react";
import {
  AbsoluteFill,
  Composition,
  interpolate,
  Easing,
  useCurrentFrame,
} from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  layout,
  letterSpacing,
  sec,
} from "../design/theme";
import { useCompositionAnimation } from "../hooks/useCompositionAnimation";
import { Background } from "../components/Background";
import { HeaderStrip } from "../components/HeaderStrip";
import { FooterStrip } from "../components/FooterStrip";
import { CATALOG_EPISODE, catalogId } from "./helpers";
import type { TransitionType } from "../components/Transitions";
import { CLAMP } from "../utils/animation";

// ── Timing constants ─────────────────────────────────────────────────────────

// Frames each slide holds before the next transition fires.
// At 30fps, 60 frames = 2s — long enough to read the slide, short enough
// to see many loops in the 30s showcase window.
const HOLD_FRAMES = 60;
// For 'cut' (0s duration), use a minimum of 2 frames so the instant switch
// is visible as a flash rather than an invisible no-op.
const MIN_TRANS_FRAMES = 2;

// ── Slide content ─────────────────────────────────────────────────────────────
//
// Two slides that mirror the canonical Parallax historical-analogy seam.
// Background tints (paper vs bone) provide enough contrast to show the seam
// clearly across all six transition types — including the instant hard cut.

interface SlideData {
  year: string;
  subtitle: string;
  bg: string;
}

const SLIDE_A: SlideData = { year: "1850", subtitle: "Oil embargo",   bg: palette.paper };
const SLIDE_B: SlideData = { year: "2025", subtitle: "Chip controls", bg: palette.bone  };

// ── Layer state ───────────────────────────────────────────────────────────────

interface LayerState {
  opacity: number;
  transform: string;
  clipPath?: string;
  overlay?: React.ReactNode;
}

const IDLE_A: LayerState = { opacity: 1, transform: "none" };
const IDLE_B: LayerState = { opacity: 0, transform: "none" };

// ── Transition math ───────────────────────────────────────────────────────────
//
// Inline logic mirrors Transitions.tsx `computeTransition` so the showcase
// stays honest — if Transitions.tsx changes the animation math, the showcase
// diverges and the discrepancy is visible during QA.
//
// `progress` = 0 at the start of the A→B seam, 1 at the end.
// Returns visual state for BOTH layers simultaneously.

function computeLayerStates(
  type: TransitionType,
  progress: number,
  washColor: string,
): { a: LayerState; b: LayerState } {
  // Eased progress — makes transitions feel physically grounded
  const p = interpolate(progress, [0, 1], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    ...CLAMP,
  });

  switch (type) {
    case "cut":
      // Instant: switch at midpoint of the transition window
      return {
        a: { opacity: p < 0.5 ? 1 : 0, transform: "none" },
        b: { opacity: p >= 0.5 ? 1 : 0, transform: "none" },
      };

    case "fade":
      // Fade-through-black: A fades out in the first half, B fades in during
      // the second half. The black (#0a0a0a) behind both slides is the "black."
      return {
        a: { opacity: interpolate(p, [0, 0.5], [1, 0], CLAMP), transform: "none" },
        b: { opacity: interpolate(p, [0.5, 1], [0, 1], CLAMP), transform: "none" },
      };

    case "dissolve":
      // Cross-dissolve: opacity + subtle scale shift (matching Transitions.tsx)
      return {
        a: { opacity: 1 - p, transform: `scale(${1 - 0.02 * p})` },
        b: { opacity: p,     transform: `scale(${1 + 0.02 * (1 - p)})` },
      };

    case "match-cut":
      // Synced zoom: exit scales in (pushes toward viewer), enter scales out
      // from an enlarged state (arrives from depth). Opacity crossfade runs
      // simultaneously so the zoom doesn't ghost.
      return {
        a: { opacity: 1 - p, transform: `scale(${1 + 0.15 * p})` },
        b: { opacity: p,     transform: `scale(${1 + 0.15 * (1 - p)})` },
      };

    case "match-cut-still":
      // Composition-locked: opacity only, no scale. The showcase entry is
      // the match-cut (zoom) variant — still is shown in doctrine.
      return {
        a: { opacity: 1 - p, transform: "none" },
        b: { opacity: p,     transform: "none" },
      };

    case "color-wash": {
      // Solid color floods the cell between segments.
      // A exits in the first ~45%, the wash holds at full, B enters in the last ~45%.
      const aOpacity = interpolate(p, [0, 0.45], [1, 0], CLAMP);
      const bOpacity = interpolate(p, [0.55, 1], [0, 1], CLAMP);
      const washAlpha = interpolate(p, [0, 0.3, 0.7, 1], [0, 1, 1, 0], CLAMP);
      const overlay =
        washAlpha > 0.01 ? (
          <AbsoluteFill
            style={{
              backgroundColor: washColor,
              opacity: washAlpha,
              zIndex: 10,
              pointerEvents: "none",
            }}
          />
        ) : null;
      return {
        a: { opacity: aOpacity, transform: "none", overlay },
        b: { opacity: bOpacity, transform: "none" },
      };
    }

    case "iris": {
      // Circular reveal: B expands from the center on top of A.
      // A stays visible at full opacity; B clips in from 0 to 72%.
      const radius = interpolate(p, [0, 1], [0, 72], {
        easing: Easing.out(Easing.cubic),
        ...CLAMP,
      });
      // Accent ring on the expanding edge — matches Transitions.tsx behavior
      const ringVisible = p > 0.04 && p < 0.96;
      const ringOpacity = (1 - Math.abs(p - 0.5) * 1.8) * 0.65;
      // half-diagonal of a ~640×360 cell estimate (1920/3 × 1080/2 / 2 ≈ 560px)
      const radiusPx = (radius / 100) * 560;
      const aOverlay = ringVisible ? (
        <AbsoluteFill style={{ pointerEvents: "none", zIndex: 11 }}>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: radiusPx * 2,
              height: radiusPx * 2,
              borderRadius: "50%",
              border: `1.5px solid ${palette.amber}`,
              transform: "translate(-50%, -50%)",
              boxShadow: `0 0 10px ${palette.amber}, inset 0 0 10px ${palette.amber}80`,
              opacity: ringOpacity,
            }}
          />
        </AbsoluteFill>
      ) : null;
      return {
        a: { opacity: 1, transform: "none", overlay: aOverlay },
        b: { opacity: 1, transform: "none", clipPath: `circle(${radius}% at 50% 50%)` },
      };
    }

    default:
      // Deprecated or unknown — render as dissolve so the showcase stays legible
      return {
        a: { opacity: 1 - p, transform: "none" },
        b: { opacity: p,     transform: "none" },
      };
  }
}

// ── Slide ─────────────────────────────────────────────────────────────────────

const Slide: React.FC<{ data: SlideData; state: LayerState }> = ({
  data,
  state,
}) => (
  <>
    <AbsoluteFill
      style={{
        backgroundColor: data.bg,
        opacity: state.opacity,
        transform: state.transform,
        clipPath: state.clipPath,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {/* Hero year — large enough to make scale shifts visible */}
      <div
        style={{
          fontFamily: fonts.data,
          fontSize: 52,
          fontWeight: 700,
          color: palette.ink,
          letterSpacing: -1,
          lineHeight: 1,
        }}
      >
        {data.year}
      </div>
      {/* Context subtitle */}
      <div
        style={{
          fontFamily: fonts.metadata,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: letterSpacing.meta,
          color: palette.ink,
          opacity: 0.5,
          textTransform: "uppercase",
        }}
      >
        {data.subtitle}
      </div>
    </AbsoluteFill>
    {/* Per-layer overlay (color-wash flood, iris accent ring) */}
    {state.overlay ?? null}
  </>
);

// ── Cell definition ───────────────────────────────────────────────────────────

interface CellDef {
  type: TransitionType;
  number: string;
  label: string;
  implicitClaim: string;
  durationSec: number;
  washColor?: string;
  note?: string;
}

const CANONICAL_TRANSITIONS: CellDef[] = [
  {
    type: "cut",
    number: "01",
    label: "Hard cut",
    implicitClaim: "same thought, next breath",
    durationSec: 0,
    note: "default within-beat",
  },
  {
    type: "dissolve",
    number: "02",
    label: "Cross-dissolve",
    implicitClaim: "elaboration of the same thought, gentler delivery",
    durationSec: 0.5,
    note: "default beat-boundary",
  },
  {
    type: "fade",
    number: "03",
    label: "Fade-through-black",
    implicitClaim: "new chapter / time-jump / silence beat",
    durationSec: 0.6,
    note: "pair with music silence per D18",
  },
  {
    type: "match-cut",
    number: "04",
    label: "Match cut (zoom)",
    implicitClaim: "same subject, different scale",
    durationSec: 0.4,
    note: "DIR: cut(match-cut)",
  },
  {
    type: "color-wash",
    number: "05",
    label: "Color-wash · ink",
    implicitClaim: "register shift — new editorial mode",
    durationSec: 0.7,
    washColor: palette.ink,
    note: "DIR: cut(color-wash, ink)",
  },
  {
    type: "iris",
    number: "06",
    label: "Iris-in / out",
    implicitClaim: "cinematic open or close, deliberately theatrical",
    durationSec: 0.8,
    note: "≤2 per episode",
  },
];

// ── TransitionCell ────────────────────────────────────────────────────────────

const TransitionCell: React.FC<{ cell: CellDef }> = ({ cell }) => {
  const frame = useCurrentFrame();

  const transLen = Math.max(MIN_TRANS_FRAMES, Math.round(sec(cell.durationSec)));
  // Loop: hold A | transition A→B | hold B | transition B→A
  const loopDuration = HOLD_FRAMES * 2 + transLen * 2;
  const localFrame = frame % loopDuration;

  const phaseAB_start = HOLD_FRAMES;
  const phaseAB_end   = HOLD_FRAMES + transLen;
  const phaseB_end    = HOLD_FRAMES + transLen + HOLD_FRAMES;
  // phaseBA goes phaseB_end → loopDuration

  let progress = 0;
  let isTransitioning = false;

  if (localFrame < phaseAB_start) {
    // Holding slide A
    progress = 0;
  } else if (localFrame < phaseAB_end) {
    // A → B transition
    progress = (localFrame - phaseAB_start) / transLen;
    isTransitioning = true;
  } else if (localFrame < phaseB_end) {
    // Holding slide B
    progress = 1;
  } else {
    // B → A transition (reverse progress)
    progress = 1 - (localFrame - phaseB_end) / transLen;
    isTransitioning = true;
  }

  const washColor = cell.washColor ?? palette.amber;
  const { a: stateA, b: stateB } = computeLayerStates(cell.type, progress, washColor);

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
      {/* Near-black substrate — makes fade-through-black visible */}
      <AbsoluteFill style={{ backgroundColor: "#0c0a08" }} />

      {/* Slide A (exits) */}
      <Slide data={SLIDE_A} state={stateA} />
      {/* Slide B (enters) */}
      <Slide data={SLIDE_B} state={stateB} />

      {/* ── Label overlay — always on top ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "16px 20px 0",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: fonts.metadata,
            fontSize: fontSizes.caption,
            fontWeight: 700,
            letterSpacing: letterSpacing.meta,
            color: palette.amber,
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          {cell.number} · {cell.label}
        </div>
        <div
          style={{
            fontFamily: fonts.metadata,
            fontSize: 11,
            fontWeight: 400,
            letterSpacing: 0.3,
            color: palette.ink,
            opacity: 0.65,
            marginTop: 5,
            lineHeight: 1.3,
            maxWidth: 280,
          }}
        >
          "{cell.implicitClaim}"
        </div>
      </div>

      {/* ── Bottom meta row: duration + editorial note ── */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          left: 20,
          right: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            fontFamily: fonts.metadata,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 1.5,
            color: palette.ink,
            opacity: 0.4,
            textTransform: "uppercase",
          }}
        >
          {cell.durationSec === 0 ? "0s (instant)" : `${cell.durationSec}s`}
        </div>
        {cell.note && (
          <div
            style={{
              fontFamily: fonts.metadata,
              fontSize: 10,
              fontWeight: 400,
              letterSpacing: 0.3,
              color: palette.ink,
              opacity: 0.38,
              textAlign: "right",
              maxWidth: 200,
            }}
          >
            {cell.note}
          </div>
        )}
      </div>

      {/* ── Pulse dot — amber when transition is firing ── */}
      <div
        style={{
          position: "absolute",
          bottom: 38,
          right: 20,
          width: 5,
          height: 5,
          borderRadius: "50%",
          backgroundColor: palette.amber,
          opacity: isTransitioning ? 0.9 : 0.15,
          zIndex: 20,
        }}
      />
    </div>
  );
};

// ── Root composition ──────────────────────────────────────────────────────────

const TransitionGrammarShowcase: React.FC = () => {
  useCompositionAnimation({ noDrift: true });

  return (
    <Background variant="light">
      <HeaderStrip mode="light" metadata={CATALOG_EPISODE} />
      <AbsoluteFill
        style={{
          padding: `${layout.safeArea.top + 80}px ${layout.safeArea.right}px ${layout.safeArea.bottom + 60}px ${layout.safeArea.left}px`,
        }}
      >
        {/* Title block */}
        <div
          style={{
            position: "absolute",
            top: layout.safeArea.top + 8,
            left: layout.safeArea.left,
            fontFamily: fonts.heading,
            fontSize: fontSizes.h3,
            fontWeight: 700,
            color: palette.ink,
          }}
        >
          The transition register
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
          Six canonical transitions, identical content. POLISH.md D21 / TRANSITION_GRAMMAR.md
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
          {CANONICAL_TRANSITIONS.map((cell) => (
            <TransitionCell key={cell.type} cell={cell} />
          ))}
        </div>
      </AbsoluteFill>
      <FooterStrip mode="light" />
    </Background>
  );
};

// ── Composition registration ──────────────────────────────────────────────────

const SHOWCASE_DURATION_SEC = 30;

export const CatalogTransitionGrammarShowcase: React.FC = () => (
  <Composition
    id={catalogId("Showcase", "transition-grammar")}
    component={TransitionGrammarShowcase}
    durationInFrames={sec(SHOWCASE_DURATION_SEC)}
    fps={layout.fps}
    width={layout.width}
    height={layout.height}
  />
);
