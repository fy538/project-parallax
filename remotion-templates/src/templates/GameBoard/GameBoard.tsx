/**
 * GameBoard — strategic game analysis metaphors (chess, go, payoff matrix).
 *
 * Three variants:
 * - Chess: 8x8 board, labeled pieces, capture animation
 * - Go: 9x19 grid, black/white stones, territory
 * - Payoff Matrix: game theory grid with cell highlights
 *
 * Phases drive the animation: pieces/stones placed, cells highlighted per phase.
 * Title and phase labels frame the narrative.
 */

import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import {
  palette,
  fonts,
  fontSizes,
  layout,
  sec,
  shadows,
  radii,
  textMaxWidth,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  scaleIn,
  exitFade,
  kenBurnsDrift,
  heroSpring,
  CLAMP_CUBIC,
  CLAMP,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import { TitleBlock } from "../../components/TitleBlock";
import { AmbientParticles } from "../../components/AmbientParticles";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import type { GameBoardData, ChessPiece, GoStone, CounterAnimation } from "./types";

// ── Helper: Get all pieces/stones/highlights active by frame ──────────────────

type StateSnapshot = {
  pieces: ChessPiece[];
  stones: GoStone[];
  highlights: number[];
  currentPhaseIndex: number;
};

const getStateAtFrame = (
  data: GameBoardData,
  frame: number,
  fps: number
): StateSnapshot => {
  const pieces = [...(data.initialPieces || [])];
  const stones = [...(data.initialStones || [])];
  const highlights: number[] = [];
  let currentPhaseIndex = -1;
  let cumulativeFrames = 0;

  for (let i = 0; i < data.phases.length; i++) {
    const phase = data.phases[i];
    const phaseDuration = sec(phase.durationSec);
    const phaseStart = cumulativeFrames;
    const phaseEnd = cumulativeFrames + phaseDuration;

    if (frame >= phaseStart && frame < phaseEnd) {
      currentPhaseIndex = i;
    }

    // By end of phase, accumulate pieces, stones, highlights
    if (frame >= phaseEnd) {
      if (phase.pieces) {
        pieces.push(...phase.pieces);
      }
      if (phase.stones) {
        stones.push(...phase.stones);
      }
      if (phase.highlights) {
        highlights.push(...phase.highlights);
      }
    }

    cumulativeFrames = phaseEnd;
  }

  return { pieces, stones, highlights, currentPhaseIndex };
};

// ── Chess Variant ────────────────────────────────────────────────────────────

const ChessBoard: React.FC<{
  data: GameBoardData;
  frame: number;
  state: StateSnapshot;
  mode: "light" | "dark";
}> = ({ data, frame, state, mode }) => {
  const theme = useThemeMode(mode);
  // Per-episode primary accent for active-state markers (selected square,
  // last-move highlight, threat overlay). A Soviet-emphasis chess board
  // gets vermillion highlights instead of channel amber, matching
  // the episode's identity throughout.
  const emphasis = useEpisodeColorEmphasis();
  const accent = emphasis.primaryAccent;
  const boardSize = data.boardSize || 8;
  const squareSize = 600 / boardSize; // 75px per square for 8x8

  // Grid draw: lines appear quickly (frames 0-20)
  const gridOpacity = fadeIn(frame, 0, sec(0.4));

  // Initial pieces appear with stagger (frames 15-35)
  const initialPiecesStart = sec(0.5);

  return (
    <div
      style={{
        position: "relative",
        width: 600,
        height: 600,
        background: theme.bg.surface,
        border: `${radii.sm}px solid ${accent}`,
        boxShadow: `inset 0 0 20px rgba(0, 0, 0, 0.1)`, // shadows.none equivalent — inset vignette (no token)
      }}
    >
      {/* Grid lines */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          opacity: gridOpacity,
        }}
        viewBox={`0 0 ${boardSize} ${boardSize}`}
      >
        {/* Vertical lines */}
        {Array.from({ length: boardSize + 1 }).map((_, i) => (
          <line
            key={`v-${i}`}
            x1={i}
            y1={0}
            x2={i}
            y2={boardSize}
            stroke={accent}
            strokeWidth="0.02"
            opacity="0.3"
          />
        ))}
        {/* Horizontal lines */}
        {Array.from({ length: boardSize + 1 }).map((_, i) => (
          <line
            key={`h-${i}`}
            x1={0}
            y1={i}
            x2={boardSize}
            y2={i}
            stroke={accent}
            strokeWidth="0.02"
            opacity="0.3"
          />
        ))}
      </svg>

      {/* Alternating squares — warm wood-board palette */}
      {Array.from({ length: boardSize * boardSize }).map((_, idx) => {
        const row = Math.floor(idx / boardSize);
        const col = idx % boardSize;
        const isLight = (row + col) % 2 === 0;

        return (
          <div
            key={`square-${idx}`}
            style={{
              position: "absolute",
              left: col * squareSize,
              top: row * squareSize,
              width: squareSize,
              height: squareSize,
              // Light squares = paper, dark squares = bronze (wood feel)
              backgroundColor: isLight ? palette.paper : palette.bronze,
              opacity: isLight ? 0.85 : 0.7,
            }}
          />
        );
      })}

      {/* Pieces */}
      {state.pieces.map((piece, idx) => {
        const [col, row] = piece.position;
        const left = col * squareSize + squareSize / 2;
        const top = row * squareSize + squareSize / 2;

        // Initial pieces: spring physics for weighted landing
        const pieceStart = initialPiecesStart + idx * sec(0.15);
        const springVal = heroSpring(frame, 30, pieceStart);
        const pieceScale = 0.4 + 0.6 * springVal;
        const pieceOpacity = fadeIn(frame, pieceStart, sec(0.3));

        // Captured pieces: fade out and slide down
        if (piece.captured) {
          const captureStart =
            state.currentPhaseIndex >= 0
              ? data.phases
                  .slice(0, state.currentPhaseIndex + 1)
                  .reduce((sum, p) => sum + sec(p.durationSec), 0)
              : frame;
          const captureProgress = interpolate(
            frame,
            [captureStart, captureStart + sec(0.8)],
            [0, 1],
            CLAMP_CUBIC
          );
          const translateY = 100 * captureProgress;
          const captureOpacity = 1 - captureProgress;

          return (
            <div
              key={`piece-${idx}`}
              style={{
                position: "absolute",
                left,
                top: top + translateY,
                transform: `translate(-50%, -50%) scale(${pieceScale})`,
                opacity: pieceOpacity * captureOpacity,
              }}
            >
              <PieceCircle label={piece.label} color={piece.color} mode={mode} />
            </div>
          );
        }

        return (
          <div
            key={`piece-${idx}`}
            style={{
              position: "absolute",
              left,
              top,
              transform: `translate(-50%, -50%) scale(${pieceScale})`,
              opacity: pieceOpacity,
            }}
          >
            <PieceCircle label={piece.label} color={piece.color} mode={mode} />
          </div>
        );
      })}
    </div>
  );
};

// ── Go Variant ───────────────────────────────────────────────────────────────

const GoBoard: React.FC<{
  data: GameBoardData;
  frame: number;
  state: StateSnapshot;
  mode: "light" | "dark";
}> = ({ data, frame, state, mode }) => {
  const theme = useThemeMode(mode);
  // Per-episode primary accent for last-move highlight + capture markers.
  const accent = useEpisodeColorEmphasis().primaryAccent;
  const boardSize = data.boardSize || 9;
  const gridSize = 500; // 500x500 grid

  // Standard hoshi positions for 9x9: [2,2], [2,6], [6,2], [6,6], [4,4]
  const hoshiPositions: [number, number][] =
    boardSize === 9
      ? [
          [2, 2],
          [2, 6],
          [6, 2],
          [6, 6],
          [4, 4],
        ]
      : [];

  const gridOpacity = fadeIn(frame, 0, sec(0.4));

  return (
    <div
      style={{
        position: "relative",
        width: gridSize + 40,
        height: gridSize + 40,
        padding: layout.spacing.md,
        background: theme.bg.surface,
      }}
    >
      {/* Grid lines */}
      <svg
        style={{
          position: "absolute",
          inset: layout.spacing.md,
          opacity: gridOpacity,
        }}
        width={gridSize}
        height={gridSize}
      >
        {/* Vertical lines */}
        {Array.from({ length: boardSize }).map((_, i) => {
          const x = (i / (boardSize - 1)) * gridSize;
          return (
            <line
              key={`v-${i}`}
              x1={x}
              y1={0}
              x2={x}
              y2={gridSize}
              stroke={accent}
              strokeWidth="0.5"
              opacity="0.4"
            />
          );
        })}
        {/* Horizontal lines */}
        {Array.from({ length: boardSize }).map((_, i) => {
          const y = (i / (boardSize - 1)) * gridSize;
          return (
            <line
              key={`h-${i}`}
              x1={0}
              y1={y}
              x2={gridSize}
              y2={y}
              stroke={accent}
              strokeWidth="0.5"
              opacity="0.4"
            />
          );
        })}

        {/* Hoshi (star points) */}
        {hoshiPositions.map(([col, row]) => {
          const x = (col / (boardSize - 1)) * gridSize;
          const y = (row / (boardSize - 1)) * gridSize;
          return (
            <circle
              key={`hoshi-${col}-${row}`}
              cx={x}
              cy={y}
              r="3"
              fill={palette.amber}
              opacity="0.5"
            />
          );
        })}
      </svg>

      {/* Stones */}
      {state.stones.map((stone, idx) => {
        const [col, row] = stone.position;
        const x = (col / (boardSize - 1)) * gridSize + layout.spacing.md;
        const y = (row / (boardSize - 1)) * gridSize + layout.spacing.md;

        const isInitial = data.initialStones?.includes(stone) || false;
        const stoneStart = isInitial
          ? sec(0.5) + idx * sec(0.15)
          : frame;
        const stoneSpring = heroSpring(frame, 30, stoneStart);
        const stoneScale = 0.4 + 0.6 * stoneSpring;
        const stoneOpacity = fadeIn(frame, stoneStart, sec(0.3));

        const isBlack = stone.stone === "black";
        // Radial gradient — specular highlight upper-left, shadow lower-right (real stone feel)
        const stoneGradient = isBlack
          ? `radial-gradient(circle at 35% 30%, #3a3530 0%, ${palette.ink} 50%, #0a0807 100%)`
          : `radial-gradient(circle at 35% 30%, #ffffff 0%, ${palette.bone} 60%, #c8bb9e 100%)`;

        return (
          <div
            key={`stone-${idx}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: `translate(-50%, -50%) scale(${stoneScale})`,
              opacity: stoneOpacity,
            }}
          >
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: "50%",
                background: stoneGradient,
                border: isBlack ? "none" : `1px solid rgba(28,24,20,0.4)`,
                boxShadow: `${shadows.subtle}, inset -1px -1px 2px rgba(0,0,0,0.3), inset 1px 1px 2px rgba(255,255,255,${isBlack ? 0.08 : 0.4})`,
              }}
            />
            {stone.label && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  marginTop: layout.spacing.xs,
                  fontSize: fontSizes.meta,
                  fontFamily: fonts.body,
                  color: theme.text.secondary,
                  whiteSpace: "nowrap",
                }}
              >
                {stone.label}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Payoff Matrix Variant ────────────────────────────────────────────────────

const PayoffMatrix: React.FC<{
  data: GameBoardData;
  frame: number;
  state: StateSnapshot;
  mode: "light" | "dark";
}> = ({ data, frame, state, mode }) => {
  const theme = useThemeMode(mode);
  // Per-episode primary accent for active-cell highlight + glow.
  const accent = useEpisodeColorEmphasis().primaryAccent;
  const cols = data.colOptions?.length || 2;
  const cellSize = 140;
  const labelWidth = 120;
  const headerHeight = 60;

  const cells = data.cells || [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: layout.spacing.md,
      }}
    >
      {/* Header row (column options) */}
      <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
        <div style={{ width: labelWidth }} />
        {data.colOptions?.map((option, i) => (
          <div
            key={`col-${i}`}
            style={{
              width: cellSize,
              height: headerHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fontSizes.label,
              fontFamily: fonts.body,
              color: theme.text.primary,
              opacity: fadeIn(frame, sec(0.8) + i * sec(0.2), sec(0.4)),
            }}
          >
            {option}
          </div>
        ))}
      </div>

      {/* Rows */}
      {data.rowOptions?.map((rowOption, rowIdx) => (
        <div key={`row-${rowIdx}`} style={{ display: "flex", gap: 0 }}>
          {/* Row label */}
          <div
            style={{
              width: labelWidth,
              height: cellSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: layout.spacing.sm,
              fontSize: fontSizes.label,
              fontFamily: fonts.body,
              color: theme.text.primary,
              opacity: fadeIn(frame, sec(0.8) + rowIdx * sec(0.2), sec(0.4)),
            }}
          >
            {rowOption}
          </div>

          {/* Cells in row */}
          {Array.from({ length: cols }).map((_, colIdx) => {
            const cellIdx = rowIdx * cols + colIdx;
            const cell = cells[cellIdx];
            const isHighlighted =
              state.highlights.includes(cellIdx);

            const cellStartFrame = sec(1) + cellIdx * sec(0.15);
            const cellOpacity = fadeIn(frame, cellStartFrame, sec(0.4));

            // Cell entrance scale for highlighted cells (subtle pop)
            const cellPopScale = isHighlighted
              ? 0.96 + 0.04 * heroSpring(frame, layout.fps, cellStartFrame)
              : 1;

            return (
              <div
                key={`cell-${rowIdx}-${colIdx}`}
                style={{
                  position: "relative",
                  width: cellSize,
                  height: cellSize,
                  borderRadius: radii.sm,
                  border: `1px solid ${isHighlighted ? accent : accent + "28"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isHighlighted
                    ? `${accent}1F`
                    : `${accent}06`,
                  opacity: cellOpacity,
                  transform: `scale(${cellPopScale})`,
                  transformOrigin: "center center",
                  boxShadow: isHighlighted
                    ? `${shadows.medium}, 0 0 24px ${accent}50, inset 0 1px 0 rgba(255,255,255,0.08)`
                    : `${shadows.subtle}, inset 0 1px 0 rgba(255,255,255,0.04)`,
                }}
              >
                <div
                  style={{
                    fontSize: isHighlighted ? fontSizes.h3 : fontSizes.body,
                    fontFamily: fonts.data,
                    fontWeight: isHighlighted ? 700 : 500,
                    color: isHighlighted ? accent : theme.text.primary,
                    textAlign: "center",
                    textShadow: isHighlighted
                      ? `0 0 12px ${accent}80, ${shadows.textLift}`
                      : shadows.textLift,
                  }}
                >
                  {cell?.value || "—"}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

// ── Unicode chess glyph map ─────────────────────────────────────────────────
// Map data labels (case-insensitive) to filled chess Unicode glyphs.
// Filled glyphs read better at video scale than outline ones.

const CHESS_GLYPHS: Record<string, string> = {
  king: "♚",
  queen: "♛",
  rook: "♜",
  bishop: "♝",
  knight: "♞",
  pawn: "♟",
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
};

const toChessGlyph = (label: string): string => {
  const norm = label.trim().toLowerCase();
  return CHESS_GLYPHS[norm] || label;
};

// ── Piece Circle Component ───────────────────────────────────────────────────

const PieceCircle: React.FC<{
  label: string;
  color: string;
  mode?: "light" | "dark";
}> = ({ label, color, mode = "light" }) => {
  const theme = useThemeMode(mode);
  const glyph = toChessGlyph(label);
  // Determine if this is a recognized chess glyph (vs raw text fallback)
  const isGlyph = glyph !== label;
  // White-piece logic: dark color on bone bg; black-piece: bone color on ink bg.
  // Detect via color luminance heuristic.
  const isLightPiece = color.toLowerCase() === palette.bone.toLowerCase()
    || color.toLowerCase() === palette.paper.toLowerCase();
  const glyphColor = isLightPiece ? palette.ink : palette.bone;
  const bgColor = isLightPiece ? palette.bone : palette.ink;
  return (
  <div
    style={{
      width: 56,
      height: 56,
      borderRadius: "50%",
      // Subtle radial gradient for ceramic-stone feel: highlight upper-left → shadow lower-right
      background: isGlyph
        ? `radial-gradient(circle at 35% 30%, ${bgColor} 0%, ${bgColor} 55%, ${isLightPiece ? "#D8CDB6" : "#0E0B09"} 100%)`
        : color,
      border: `2px solid ${palette.amber}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `${shadows.subtle}, inset -2px -2px 6px rgba(0,0,0,0.18), inset 2px 2px 4px rgba(255,255,255,0.12)`,
    }}
  >
    <div
      style={{
        fontSize: isGlyph ? 36 : fontSizes.label,
        fontFamily: isGlyph ? "'DejaVu Sans', 'Segoe UI Symbol', sans-serif" : fonts.body,
        color: isGlyph ? glyphColor : theme.text.primary,
        textAlign: "center",
        fontWeight: 600,
        lineHeight: 1,
        maxWidth: "90%",
        textShadow: isGlyph ? "0 1px 2px rgba(0,0,0,0.3)" : undefined,
      }}
    >
      {glyph}
    </div>
  </div>
);
};

// ── Counter Animation Component ─────────────────────────────────────────────

const CounterDisplay: React.FC<{
  counter: CounterAnimation;
  frame: number;
  phaseStart: number;
  phaseDuration: number;
  mode: "light" | "dark";
}> = ({ counter, frame, phaseStart, phaseDuration, mode }) => {
  const theme = useThemeMode(mode);
  const progress = interpolate(
    frame,
    [phaseStart + sec(0.5), phaseStart + phaseDuration - sec(1)],
    [0, 1],
    CLAMP // linear-ok: counter progress is intentionally linear (counting up at uniform speed)
  );

  const cooperateVal = Math.round((counter.cooperate || 0) * progress);
  const defectVal = Math.round((counter.defect || 0) * progress);
  const cooperateColor = counter.cooperateColor || palette.amber;
  const defectColor = counter.defectColor || palette.bronze;

  const counterOpacity = fadeIn(frame, phaseStart + sec(0.3), sec(0.4));

  return (
    <div
      style={{
        display: "flex",
        gap: layout.spacing.xxl,
        opacity: counterOpacity,
        marginTop: layout.spacing.md,
      }}
    >
      {counter.cooperate !== undefined && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: fontSizes.display,
              fontFamily: fonts.data,
              color: cooperateColor,
              fontWeight: 700,
              lineHeight: 1,
              maxWidth: textMaxWidth.h1,
              textShadow: `0 0 20px ${cooperateColor}40`, // shadows.accentGlow (20px variant)
            }}
          >
            {cooperateVal}
          </div>
          <div
            style={{
              fontSize: fontSizes.caption,
              fontFamily: fonts.body,
              color: theme.text.secondary,
              marginTop: layout.spacing.xs,
            }}
          >
            Cooperate
          </div>
        </div>
      )}
      {counter.defect !== undefined && (
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: fontSizes.display,
              fontFamily: fonts.data,
              color: defectColor,
              fontWeight: 700,
              lineHeight: 1,
              maxWidth: textMaxWidth.h1,
            }}
          >
            {defectVal}
          </div>
          <div
            style={{
              fontSize: fontSizes.caption,
              fontFamily: fonts.body,
              color: theme.text.secondary,
              marginTop: layout.spacing.xs,
            }}
          >
            Defect
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────

export const GameBoard: React.FC<{ data: GameBoardData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const mode = data.backgroundVariant || "light";
  const theme = useThemeMode(mode);
  const direction = useDirection(data._direction);

  const state = useMemo(() => getStateAtFrame(data, frame, fps), [data, frame, fps]);

  // Total duration: sum of all phases
  const totalDuration = data.durationSec || data.phases.reduce((sum, p) => sum + p.durationSec, 0);

  // Current phase label
  const currentPhaseLabel =
    state.currentPhaseIndex >= 0 ? data.phases[state.currentPhaseIndex]?.label : "";
  const currentPhaseSublabel =
    state.currentPhaseIndex >= 0 ? data.phases[state.currentPhaseIndex]?.sublabel : "";

  // Phase label fade
  const phaseStart = data.phases
    .slice(0, state.currentPhaseIndex)
    .reduce((sum, p) => sum + sec(p.durationSec), 0);
  const phaseLabelOpacity = fadeIn(frame, phaseStart, sec(0.4));

  // Exit fade at end (L44 + L66).
  // useCompositionAnimation gives the brand-standard exitOpacity. We pass
  // noDrift: true so the manual kenBurnsDrift below is the single drift source
  // (L66). The hook's default exit window is 15 frames; this template uses a
  // 30-frame fade ending 30 frames before duration end — preserved by keeping
  // the manual exitFade for the end-frame computation.
  useCompositionAnimation({ noDrift: true });
  const endFrame = sec(totalDuration) - sec(1);
  const overallOpacity = exitFade(frame, endFrame, sec(1));

  // ── Cinematic camera zoom to active region ──
  const isCinematic = data.cinematicMode === true;
  const cinematicZoom = useMemo(() => {
    if (!isCinematic) return 1;
    // During phases, zoom in slightly; between phases, ease back
    if (state.currentPhaseIndex < 0) return 1;
    const phaseProgress = (frame - phaseStart) / sec(data.phases[state.currentPhaseIndex]?.durationSec || 2);
    // Zoom in at phase start, hold, ease out near phase end
    if (phaseProgress < 0.2) {
      return interpolate(phaseProgress, [0, 0.2], [1.0, 1.12], CLAMP_CUBIC);
    }
    if (phaseProgress > 0.8) {
      return interpolate(phaseProgress, [0.8, 1.0], [1.12, 1.0], CLAMP_CUBIC);
    }
    return 1.12;
  }, [isCinematic, state.currentPhaseIndex, frame, phaseStart, data.phases]);

  return (
    <AbsoluteFill>
      <Background
        variant={mode}
        tint={direction.backgroundTint ?? data.backgroundTint}
        atmosphere={direction.atmosphere}
        atmosphereIntensity={direction.atmosphereIntensity}
      />

      {/* Brand strips */}
      <HeaderStrip mode={mode} metadata={data.episode} />
      <FooterStrip mode={mode} />

      {/* Ambient particles */}
      {(data.ambientParticles !== false) && (
        <AmbientParticles
          density={mode === "dark" ? 20 : 10}
          mode={mode as "dark" | "light"}
        />
      )}

      {/* Main content — cinematic zoom or Ken Burns drift */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: layout.spacing.xxxl,
          opacity: overallOpacity,
          transform: `scale(${isCinematic ? cinematicZoom : kenBurnsDrift(frame, durationInFrames, 1.02)})`,
          transformOrigin: "center center",
        }}
      >
        {/* Title */}
        <div
          style={{
            textAlign: "center",
            marginBottom: layout.spacing.lg,
          }}
        >
          <TitleBlock
            title={data.title}
            subtitle={data.subtitle}
            mode={mode}
            align="top-center"
            noAnimation
            safeAreaTier="generous"
          />
        </div>

        {/* Board variants */}
        <div style={{ marginBottom: layout.spacing.xxl }}>
          {data.variant === "chess" && (
            <ChessBoard data={data} frame={frame} state={state} mode={mode} />
          )}
          {data.variant === "go" && (
            <GoBoard data={data} frame={frame} state={state} mode={mode} />
          )}
          {data.variant === "payoff-matrix" && (
            <PayoffMatrix data={data} frame={frame} state={state} mode={mode} />
          )}
        </div>

        {/* Phase label + annotation + counter — slideIn (no naked fade) */}
        {currentPhaseLabel && (
          <div
            style={{
              opacity: phaseLabelOpacity,
              transform: `translateY(${slideIn(frame, phaseStart, 12, sec(0.5))}px)`,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontSize: fontSizes.label,
                fontFamily: fonts.display,
                color: palette.amber,
                margin: 0,
                letterSpacing: 1,
              }}
            >
              {currentPhaseLabel}
            </p>
            {currentPhaseSublabel && (
              <p
                style={{
                  fontSize: fontSizes.caption,
                  fontFamily: fonts.body,
                  color: theme.text.secondary,
                  margin: 0,
                  marginTop: layout.spacing.xs,
                }}
              >
                {currentPhaseSublabel}
              </p>
            )}
            {/* Annotation text */}
            {state.currentPhaseIndex >= 0 &&
              data.phases[state.currentPhaseIndex]?.annotation && (
                <p
                  style={{
                    fontSize: fontSizes.body,
                    fontFamily: fonts.body,
                    color: theme.text.primary,
                    margin: 0,
                    marginTop: layout.spacing.sm,
                    opacity: fadeIn(frame, phaseStart + sec(0.5), sec(0.4)),
                  }}
                >
                  {data.phases[state.currentPhaseIndex].annotation}
                </p>
              )}
            {/* Counter animation */}
            {state.currentPhaseIndex >= 0 &&
              data.phases[state.currentPhaseIndex]?.counterAnimation && (
                <CounterDisplay
                  counter={data.phases[state.currentPhaseIndex].counterAnimation!}
                  frame={frame}
                  phaseStart={phaseStart}
                  phaseDuration={sec(data.phases[state.currentPhaseIndex].durationSec)}
                  mode={mode}
                />
              )}
          </div>
        )}

        {/* Source attribution — slideIn (no naked fade) */}
        {data.source && (
          <p
            style={{
              fontSize: fontSizes.meta,
              fontFamily: fonts.body,
              color: theme.text.muted,
              position: "absolute",
              bottom: layout.spacing.lg,
              margin: 0,
              opacity: fadeIn(frame, 0, sec(1)),
              transform: `translateY(${slideIn(frame, 0, 10, sec(0.8))}px)`,
            }}
          >
            {data.source}
          </p>
        )}
      </div>
    </AbsoluteFill>
  );
};
