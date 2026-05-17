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
  anticipatoryStartFrame,
  CLAMP_CUBIC,
  CLAMP,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import {
  analyticalBackgroundBase,
  resolveAnalyticalBackgroundVariant,
  transparentBackdropRequested,
} from "../../utils/segmentBackdrop";
import { TitleBlock } from "../../components/TitleBlock";
import { AmbientParticles } from "../../components/AmbientParticles";
import { HeaderStrip } from "../../components/HeaderStrip";
import { FooterStrip } from "../../components/FooterStrip";
import { useThemeMode } from "../../hooks/useThemeMode";
import { useDirection } from "../../hooks/useDirection";
import { useEpisodeColorEmphasis } from "../../hooks/useEpisodeColorEmphasis";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { warnIf } from "../../utils/dataWarnings";
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

  // `phases` is optional on the data type — iterated-play uses `rounds`
  // instead. For variants that don't carry phases, this loop is a no-op.
  const phases = data.phases ?? [];
  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];
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

const ChessBoard = React.memo<{
  data: GameBoardData;
  frame: number;
  state: StateSnapshot;
  mode: "light" | "dark";
  firstRevealFrame: number;
}>(function ChessBoard({ data, frame, state, mode, firstRevealFrame }) {
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

  // Initial pieces appear with stagger — driven by firstRevealFrame.
  const initialPiecesStart = firstRevealFrame;

  return (
    <div
      style={{
        position: "relative",
        width: 600,
        height: 600,
        background: theme.bg.surface,
        // Thin ink border — replaces the previous accent (amber) ring that
        // made the board look like a generic game-token board rather than a
        // chess diagram. NYT / FT chess columns use a 1 px dark stroke (or
        // nothing) — never a colored ring. May 13, 2026 polish pass.
        border: `1px solid ${palette.ink}33`,
        // Soft outer shadow lifts the board off the paper (chess diagrams
        // in print typically have a subtle shadow, like the board is laid
        // on a table). Replaces the previous inset vignette which fought
        // with the alternating-square pattern.
        boxShadow: shadows.medium,
      }}
    >
      {/* Alternating squares — warm wood-board palette.
          Bronze at full opacity (was 0.7) so the light/dark contrast reads
          clearly at scrubbing speed; same for paper (was 0.85). Without
          enough contrast the board reads as a flat grid, not a chess board.
          The grid-lines SVG was dropped — the alternating fills ARE the
          grid; drawing accent lines over them produced a wireframe-on-paint
          look characteristic of amateur diagrams. May 13, 2026 polish pass. */}
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
              backgroundColor: isLight ? palette.paper : palette.bronze,
              opacity: isLight ? 1 : 0.95 * gridOpacity + 0.05,
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
              ? (data.phases ?? [])
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
});

// ── Go Variant ───────────────────────────────────────────────────────────────

const GoBoard = React.memo<{
  data: GameBoardData;
  frame: number;
  state: StateSnapshot;
  mode: "light" | "dark";
  firstRevealFrame: number;
}>(function GoBoard({ data, frame, state, mode, firstRevealFrame }) {
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
          ? firstRevealFrame + idx * sec(0.15)
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
                border: isBlack ? "none" : `1px solid rgba(28,24,20,0.4)`, // palette.ink at 0.4 opacity — stone edge
                // rgba(0,0,0,0.3) = glass shadow — not a brand color
                // rgba(255,255,255,0.4) = glass refraction highlight — not a brand color
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
});

// ── Payoff Matrix Variant ────────────────────────────────────────────────────

const PayoffMatrix = React.memo<{
  data: GameBoardData;
  frame: number;
  state: StateSnapshot;
  mode: "light" | "dark";
  firstRevealFrame: number;
}>(function PayoffMatrix({ data, frame, state, mode, firstRevealFrame }) {
  const theme = useThemeMode(mode);
  // Per-episode primary accent for active-cell highlight + glow.
  const accent = useEpisodeColorEmphasis().primaryAccent;
  const cols = data.colOptions?.length || 2;
  // Bumped cellSize 140 → 200 (May 13, 2026) so 2×2 matrices like Stag Hunt
  // carry editorial weight on a 1920×1080 canvas. Previous size made the
  // matrix occupy ~21% of canvas width, reading as a small floating chip
  // rather than the load-bearing analytical element.
  const cellSize = 200;
  const labelWidth = 140;
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
      {/* Header row (column options).
          Empty corner placeholders on BOTH sides (labelWidth) so the
          GRID cells visually center within the flex bounding box. Without
          the right-side phantom, the row-label column on the left makes
          the bounding box wider on the left → grid sits right-of-center
          when the bounding box centers. May 13, 2026 visual-register pass. */}
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
        {/* Phantom right-side gutter to balance the row-label column. */}
        <div style={{ width: labelWidth }} />
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

            const cellStartFrame = firstRevealFrame + cellIdx * sec(0.15);
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
          {/* Phantom right-side gutter to balance the row-label column. */}
          <div style={{ width: labelWidth }} />
        </div>
      ))}
    </div>
  );
});

// ── PD-Canonical Matrix Variant ──────────────────────────────────────────────
// Tucker-framing 2×2 with T/R/P/S labels, Nash-marked equilibrium, best-response
// arrows, and distinct hero treatments for moral vs analytical outcomes.
// Reference: references/template-research/game-theory.md § B.

type Payoffs = { row: number; col: number };

/**
 * Parse "3, 3" / "-5, 0" / "+3, -1" / "−1, −1" into payoff pair.
 * Normalizes unicode minus (U+2212) and unicode en-dash (U+2013) to ASCII hyphen
 * so display strings can use proper typography ("−10, 0") without breaking parsing.
 * Returns null on malformed.
 */
const parsePayoffs = (value: string): Payoffs | null => {
  const normalized = value.replace(/[−–]/g, "-");
  const parts = normalized.split(",").map((s) => s.trim());
  if (parts.length !== 2) return null;
  const row = Number(parts[0]);
  const col = Number(parts[1]);
  if (Number.isNaN(row) || Number.isNaN(col)) return null;
  return { row, col };
};

/**
 * For a 2×2 PD-shape matrix, compute best-response arrows.
 * Returns an array of arrows { fromIdx, toIdx, player } where player ∈ {"row","col"}.
 * Row player compares cells within the same column; col player compares within the same row.
 * Arrows point from worse to better payoff. Nash = cell with no outgoing arrows.
 */
const computeBestResponseArrows = (
  cells: ReadonlyArray<{ row: number; col: number; value: string }>,
  rows: number,
  cols: number,
): Array<{ fromIdx: number; toIdx: number; player: "row" | "col" }> => {
  const arrows: Array<{ fromIdx: number; toIdx: number; player: "row" | "col" }> = [];
  const idxOf = (r: number, c: number) => r * cols + c;
  const payoffOf = (r: number, c: number): Payoffs | null => {
    const cell = cells.find((x) => x.row === r && x.col === c);
    return cell ? parsePayoffs(cell.value) : null;
  };

  // Row-player arrows: within each column, point from non-max to max.
  for (let c = 0; c < cols; c++) {
    let bestRow = 0;
    let bestPayoff = -Infinity;
    for (let r = 0; r < rows; r++) {
      const p = payoffOf(r, c);
      if (p && p.row > bestPayoff) {
        bestPayoff = p.row;
        bestRow = r;
      }
    }
    for (let r = 0; r < rows; r++) {
      if (r === bestRow) continue;
      arrows.push({ fromIdx: idxOf(r, c), toIdx: idxOf(bestRow, c), player: "row" });
    }
  }

  // Col-player arrows: within each row, point from non-max to max.
  for (let r = 0; r < rows; r++) {
    let bestCol = 0;
    let bestPayoff = -Infinity;
    for (let c = 0; c < cols; c++) {
      const p = payoffOf(r, c);
      if (p && p.col > bestPayoff) {
        bestPayoff = p.col;
        bestCol = c;
      }
    }
    for (let c = 0; c < cols; c++) {
      if (c === bestCol) continue;
      arrows.push({ fromIdx: idxOf(r, c), toIdx: idxOf(r, bestCol), player: "col" });
    }
  }

  return arrows;
};

const PDCanonicalMatrix: React.FC<{
  data: GameBoardData;
  frame: number;
  state: StateSnapshot;
  mode: "light" | "dark";
  firstRevealFrame: number;
}> = ({ data, frame, state, mode, firstRevealFrame }) => {
  const theme = useThemeMode(mode);
  const rows = data.rowOptions?.length || 2;
  const cols = data.colOptions?.length || 2;
  const cellSize = 220;
  const labelWidth = 160;
  const headerHeight = 72;
  const cells = data.cells || [];

  const showArrows = data.showBestResponseArrows !== false;
  const showGlyph = data.showNashGlyph !== false;
  const showLegend = data.showTPRSLegend !== false;

  // Arrow timing — appear after cells settle.
  const arrowsStartFrame = sec(1.6);
  const arrowsOpacity = fadeIn(frame, arrowsStartFrame, sec(0.6));

  const arrows = useMemo(
    () => (showArrows ? computeBestResponseArrows(cells, rows, cols) : []),
    [showArrows, cells, rows, cols],
  );

  // Geometry: top-left of grid is (labelWidth, headerHeight). Cell (r,c) center:
  const cellCenter = (idx: number): { x: number; y: number } => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    return {
      x: labelWidth + c * cellSize + cellSize / 2,
      y: headerHeight + r * cellSize + cellSize / 2,
    };
  };

  const gridWidth = labelWidth + cols * cellSize;
  const gridHeight = headerHeight + rows * cellSize;

  // Find TPRS values for legend.
  const tprsCells = ["T", "R", "P", "S"] as const;
  const tprsValues: Partial<Record<typeof tprsCells[number], number>> = {};
  cells.forEach((cell) => {
    if (cell.cellType) {
      const payoffs = parsePayoffs(cell.value);
      // For PD, T/R/P/S are the row player's payoffs in canonical cells.
      // T = (D,C) row, R = (C,C) both, P = (D,D) both, S = (C,D) row.
      if (payoffs) tprsValues[cell.cellType] = payoffs.row;
    }
  });

  // Account for external labels in the visual bounding box so the matrix
  // visually centers under the title. The rotated rowPlayer label sits 60px
  // LEFT of the grid; the colPlayer label sits 28px ABOVE. Previously only
  // the left/top gutters were added to the wrapper width/height, which made
  // the GRID itself sit shifted right + down by half-the-gutter inside its
  // centered flex parent. Fix: add phantom right + bottom gutters of equal
  // size so the grid is visually centered within its wrapper. See May 13,
  // 2026 GameBoard visual-register pass + POLISH T6 (use the canvas).
  const labelGutterLeft = data.rowPlayer ? 60 : 0;
  const labelGutterTop = data.colPlayer ? 28 : 0;
  // Phantom matching gutters keep the grid optically centered in its wrapper.
  const labelGutterRight = labelGutterLeft;
  const labelGutterBottom = labelGutterTop;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: layout.spacing.lg }}>
      <div
        style={{
          position: "relative",
          width: gridWidth + labelGutterLeft + labelGutterRight,
          height: gridHeight + labelGutterTop + labelGutterBottom,
        }}
      >
       <div
        style={{
          position: "absolute",
          left: labelGutterLeft,
          top: labelGutterTop,
          width: gridWidth,
          height: gridHeight,
        }}
      >
        {/* Column player label (top, above header) */}
        {data.colPlayer && (
          <div
            style={{
              position: "absolute",
              left: labelWidth,
              top: -28,
              width: cols * cellSize,
              textAlign: "center",
              fontSize: fontSizes.meta,
              fontFamily: fonts.metadata,
              color: theme.text.muted,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: fadeIn(frame, sec(0.3), sec(0.4)),
            }}
          >
            {data.colPlayer}
          </div>
        )}

        {/* Row player label (left, rotated) */}
        {data.rowPlayer && (
          <div
            style={{
              position: "absolute",
              left: -60,
              top: headerHeight,
              height: rows * cellSize,
              width: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fontSizes.meta,
              fontFamily: fonts.metadata,
              color: theme.text.muted,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: fadeIn(frame, sec(0.3), sec(0.4)),
              transform: "rotate(-90deg)",
              transformOrigin: "center center",
              whiteSpace: "nowrap",
            }}
          >
            {data.rowPlayer}
          </div>
        )}

        {/* Column option headers */}
        {data.colOptions?.map((option, i) => (
          <div
            key={`col-${i}`}
            style={{
              position: "absolute",
              left: labelWidth + i * cellSize,
              top: 0,
              width: cellSize,
              height: headerHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: fontSizes.label,
              fontFamily: fonts.display,
              fontWeight: 600,
              color: theme.text.primary,
              opacity: fadeIn(frame, sec(0.5) + i * sec(0.15), sec(0.4)),
            }}
          >
            {option}
          </div>
        ))}

        {/* Row option labels */}
        {data.rowOptions?.map((option, i) => (
          <div
            key={`row-${i}`}
            style={{
              position: "absolute",
              left: 0,
              top: headerHeight + i * cellSize,
              width: labelWidth,
              height: cellSize,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              paddingRight: layout.spacing.md,
              fontSize: fontSizes.label,
              fontFamily: fonts.display,
              fontWeight: 600,
              color: theme.text.primary,
              opacity: fadeIn(frame, sec(0.5) + i * sec(0.15), sec(0.4)),
            }}
          >
            {option}
          </div>
        ))}

        {/* Cells */}
        {Array.from({ length: rows * cols }).map((_, idx) => {
          const r = Math.floor(idx / cols);
          const c = idx % cols;
          const cell = cells.find((x) => x.row === r && x.col === c);
          const isActive = state.highlights.includes(idx);
          const cellStartFrame = firstRevealFrame + idx * sec(0.15);
          const cellOpacity = fadeIn(frame, cellStartFrame, sec(0.4));

          const isMoral = cell?.heroRole === "moral";
          const isAnalytical = cell?.heroRole === "analytical";

          // Distinct hero treatments (D7 / dossier §B3):
          //   Moral hero      → bone fill + amber underline accent
          //   Analytical hero → oxblood border + ∴ glyph
          //   Active phase    → adds outer accent glow (does not replace hero treatment)
          const fillColor = isMoral
            ? palette.bone
            : mode === "dark"
              ? `${palette.ink}80`
              : `${palette.paper}A0`;
          const borderColor = isAnalytical
            ? palette.oxblood
            : isActive
              ? palette.amber
              : mode === "dark"
                ? `${palette.bone}24`
                : `${palette.ink}24`;
          const borderWidth = isAnalytical ? 2.5 : 1;

          return (
            <div
              key={`cell-${idx}`}
              style={{
                position: "absolute",
                left: labelWidth + c * cellSize,
                top: headerHeight + r * cellSize,
                width: cellSize,
                height: cellSize,
                borderRadius: radii.sm,
                background: fillColor,
                border: `${borderWidth}px solid ${borderColor}`,
                boxShadow: isActive ? `0 0 24px ${palette.amber}40` : shadows.subtle,
                opacity: cellOpacity,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* TPRS kicker (top-left) — single-character label */}
              {cell?.cellType && (
                <div
                  style={{
                    position: "absolute",
                    top: layout.spacing.md,
                    left: layout.spacing.md,
                    fontSize: fontSizes.body,
                    fontFamily: fonts.metadata,
                    color: isMoral ? palette.amber : theme.text.muted,
                    letterSpacing: 2,
                    fontWeight: 600,
                    lineHeight: 1,
                    maxWidth: fontSizes.h2,
                  }}
                >
                  {cell.cellType}
                </div>
              )}

              {/* Nash ∴ glyph (top-right) — JetBrains Mono renders ∴ as three
                  weighted dots, the Parallax brand mark used to denote logical
                  inevitability. See: references/template-research/game-theory.md §B3. */}
              {isAnalytical && showGlyph && (
                <div
                  style={{
                    position: "absolute",
                    top: layout.spacing.sm,
                    right: layout.spacing.md,
                    fontSize: fontSizes.h2,
                    fontFamily: fonts.data,
                    color: palette.oxblood,
                    fontWeight: 700,
                    lineHeight: 0.7,
                    letterSpacing: -2,
                    maxWidth: fontSizes.h1,
                  }}
                  aria-label="Nash equilibrium"
                >
                  ∴
                </div>
              )}

              {/* Payoff value (center) */}
              <div
                style={{
                  fontSize: fontSizes.h3,
                  fontFamily: fonts.data,
                  maxWidth: cellSize - layout.spacing.lg * 2,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                  color: isMoral
                    ? palette.amber
                    : isAnalytical
                      ? palette.oxblood
                      : theme.text.primary,
                  fontWeight: 700,
                  letterSpacing: 1,
                }}
              >
                {cell?.value || "—"}
              </div>

              {/* Moral-hero amber underline */}
              {isMoral && (
                <div
                  style={{
                    position: "absolute",
                    bottom: layout.spacing.md,
                    left: "25%",
                    right: "25%",
                    height: 2,
                    background: palette.amber,
                    opacity: 0.7,
                  }}
                />
              )}
            </div>
          );
        })}

        {/* Best-response arrows (drawn after cells settle) */}
        {showArrows && (
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: gridWidth,
              height: gridHeight,
              opacity: arrowsOpacity,
              pointerEvents: "none",
            }}
            viewBox={`0 0 ${gridWidth} ${gridHeight}`}
          >
            <defs>
              <marker
                id="pd-arrowhead-rust"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill={palette.rust} />
              </marker>
            </defs>
            {arrows.map((arrow, i) => {
              const from = cellCenter(arrow.fromIdx);
              const to = cellCenter(arrow.toIdx);
              // Inset endpoints so arrow doesn't overlap cell numerals.
              const dx = to.x - from.x;
              const dy = to.y - from.y;
              const len = Math.sqrt(dx * dx + dy * dy) || 1;
              const inset = cellSize * 0.32;
              const ux = dx / len;
              const uy = dy / len;
              // Offset perpendicular to arrow direction so row/col arrows don't overlap.
              const perpX = -uy;
              const perpY = ux;
              const sideOffset = arrow.player === "row" ? -14 : 14;
              const x1 = from.x + ux * inset + perpX * sideOffset;
              const y1 = from.y + uy * inset + perpY * sideOffset;
              const x2 = to.x - ux * inset + perpX * sideOffset;
              const y2 = to.y - uy * inset + perpY * sideOffset;
              return (
                <line
                  key={`arr-${i}`}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={palette.rust}
                  strokeWidth={2}
                  strokeOpacity={0.72}
                  markerEnd="url(#pd-arrowhead-rust)"
                />
              );
            })}
          </svg>
        )}
       </div>
      </div>

      {/* T/R/P/S legend strip */}
      {showLegend && Object.keys(tprsValues).length > 0 && (
        <div
          style={{
            display: "flex",
            gap: layout.spacing.lg,
            alignItems: "baseline",
            opacity: fadeIn(frame, sec(2.2), sec(0.6)),
            fontFamily: fonts.metadata,
            fontSize: fontSizes.caption,
            color: theme.text.secondary,
            letterSpacing: 1,
            marginTop: layout.spacing.md,
          }}
        >
          {(["T", "R", "P", "S"] as const).map((key, i) => {
            const val = tprsValues[key];
            if (val === undefined) return null;
            return (
              <React.Fragment key={key}>
                <span>
                  <span style={{ color: theme.text.primary, fontWeight: 600, fontSize: fontSizes.label }}>{key}</span>
                  {" = "}
                  <span style={{ fontFamily: fonts.data, color: theme.text.primary, fontSize: fontSizes.label }}>{val}</span>
                  {data.payoffUnits && (
                    <span style={{ marginLeft: 4, fontSize: fontSizes.caption }}>{data.payoffUnits}</span>
                  )}
                </span>
                {i < 3 && tprsValues[(["T", "R", "P", "S"] as const)[i + 1]!] !== undefined && (
                  <span style={{ opacity: 0.5, fontSize: fontSizes.label }}>{">"}</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Iterated-play small-multiples matrix ───────────────────────────────────
//
// Small-multiples of the same 2×2 payoff matrix across N rounds. Each panel
// shares the cell structure (rowOptions, colOptions, cells); only the
// highlighted cells differ per round. The visual story is the equilibrium
// shifting visibly across panels — the Axelrod-tournament reveal.
//
// Reference: references/template-research/game-theory.md § B3

const IteratedPlayMatrix: React.FC<{
  data: GameBoardData;
  frame: number;
  mode: "light" | "dark";
}> = ({ data, frame, mode }) => {
  const theme = useThemeMode(mode);
  const rounds = data.rounds || [];
  const cells = data.cells || [];
  const rows = data.rowOptions?.length || 2;
  const cols = data.colOptions?.length || 2;

  // Layout: 2/3/4 columns depending on round count.
  const numPanels = rounds.length;
  const gridCols = numPanels <= 2 ? numPanels : numPanels <= 4 ? 2 : numPanels <= 6 ? 3 : 4;
  const gridRows = Math.ceil(numPanels / gridCols);
  const panelGap = 40;
  // Each panel is a mini 2×2 matrix; sizing tuned for ~3 panels per row at 1920w.
  const panelMaxWidth = 480;
  const cellSize = 90;
  const headerHeight = 30;
  const labelWidth = 80;
  const gridWidth = labelWidth + cols * cellSize;
  const gridHeight = headerHeight + rows * cellSize;
  const panelHeight = gridHeight + 60; // room for round label + annotation

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridCols}, ${panelMaxWidth}px)`,
        gridAutoRows: `${panelHeight}px`,
        gap: panelGap,
        justifyContent: "center",
        alignContent: "center",
      }}
    >
      {rounds.map((round, panelIdx) => {
        const panelStart = sec(0.5) + panelIdx * sec(0.5);
        const panelOpacity = fadeIn(frame, panelStart, sec(0.5));
        const cellRevealStart = panelStart + sec(0.3);
        const annotationOpacity = fadeIn(frame, panelStart + sec(0.7), sec(0.5));

        return (
          <div
            key={`round-${panelIdx}`}
            style={{
              opacity: panelOpacity,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* Round label */}
            <div
              style={{
                fontSize: fontSizes.label,
                fontFamily: fonts.metadata,
                color: theme.text.primary,
                letterSpacing: 3,
                textTransform: "uppercase",
                fontWeight: 600,
                lineHeight: 1,
              }}
            >
              {round.label}
            </div>

            {/* Mini 2×2 matrix */}
            <div
              style={{
                position: "relative",
                width: gridWidth,
                height: gridHeight,
              }}
            >
              {/* Column option headers */}
              {data.colOptions?.map((option, ci) => (
                <div
                  key={`col-${ci}`}
                  style={{
                    position: "absolute",
                    left: labelWidth + ci * cellSize,
                    top: 0,
                    width: cellSize,
                    height: headerHeight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: fontSizes.caption,
                    fontFamily: fonts.body,
                    color: theme.text.muted,
                    whiteSpace: "nowrap",
                  }}
                >
                  {option}
                </div>
              ))}

              {/* Row option labels */}
              {data.rowOptions?.map((option, ri) => (
                <div
                  key={`row-${ri}`}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: headerHeight + ri * cellSize,
                    width: labelWidth,
                    height: cellSize,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingRight: 8,
                    fontSize: fontSizes.caption,
                    fontFamily: fonts.body,
                    color: theme.text.muted,
                    whiteSpace: "nowrap",
                  }}
                >
                  {option}
                </div>
              ))}

              {/* Cells */}
              {Array.from({ length: rows * cols }).map((_, idx) => {
                const r = Math.floor(idx / cols);
                const c = idx % cols;
                const cell = cells.find((x) => x.row === r && x.col === c);
                const isActive = round.highlights.includes(idx);
                const cellOpacity = fadeIn(
                  frame,
                  cellRevealStart + idx * sec(0.05),
                  sec(0.3),
                );
                const cellBg = isActive
                  ? `${palette.amber}22`
                  : mode === "dark"
                    ? `${palette.ink}40`
                    : `${palette.paper}60`;
                const cellBorder = isActive
                  ? palette.amber
                  : mode === "dark"
                    ? `${palette.bone}1A`
                    : `${palette.ink}1A`;

                return (
                  <div
                    key={`cell-${idx}`}
                    style={{
                      position: "absolute",
                      left: labelWidth + c * cellSize,
                      top: headerHeight + r * cellSize,
                      width: cellSize,
                      height: cellSize,
                      border: `${isActive ? 2 : 1}px solid ${cellBorder}`,
                      borderRadius: 2,
                      background: cellBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: cellOpacity,
                      boxShadow: isActive ? `0 0 12px ${palette.amber}40` : "none",
                    }}
                  >
                    <div
                      style={{
                        fontSize: isActive ? fontSizes.label : fontSizes.caption,
                        fontFamily: fonts.data,
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? palette.amber : theme.text.primary,
                        whiteSpace: "nowrap",
                        maxWidth: cellSize - 8,
                        textAlign: "center",
                      }}
                    >
                      {cell?.value || "—"}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Annotation */}
            {round.annotation && (
              <div
                style={{
                  fontSize: fontSizes.caption,
                  fontFamily: fonts.body,
                  fontStyle: "italic",
                  color: theme.text.secondary,
                  textAlign: "center",
                  maxWidth: panelMaxWidth - 32,
                  opacity: annotationOpacity,
                  lineHeight: 1.3,
                  marginTop: 4,
                }}
              >
                {round.annotation}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ── Named shadow constant for chess piece drop shadow ────────────────────────
const PIECE_DROPSHADOW = "drop-shadow(0 2px 3px rgba(0,0,0,0.35))";

// ── Token-register precision-marker geometry ────────────────────────────────
// When a chess-board piece carries a non-chess label (e.g. company names like
// "NVIDIA", "ASML", "US" — strategic-actor-as-piece metaphor), it is rendered
// as a Bloomberg / Economist-style precision marker rather than a labeled disk.
// Geometry mirrors the AnnotationNode SAT_* constants in NetworkDiagram so the
// two templates share a visual vocabulary.
const TOKEN_DOT_R = 7;            // small filled dot — the "position"
const TOKEN_RING_R = 13;          // single hairline ring around the dot
const TOKEN_RING_OPACITY = 0.42;
const TOKEN_DOT_OPACITY = 0.95;
const TOKEN_TETHER_GAP = TOKEN_DOT_R + 3;   // 10 — dot rim → tether start
const TOKEN_TETHER_LEN = 8;
const TOKEN_TETHER_OPACITY = 0.48;
const TOKEN_LABEL_OFFSET = TOKEN_TETHER_GAP + TOKEN_TETHER_LEN + 4; // 22
const TOKEN_FOOTPRINT = 72;       // SVG canvas; matches chess-glyph footprint

// ── Unicode chess glyph map ─────────────────────────────────────────────────
// Map data labels (case-insensitive) to filled chess Unicode glyphs.
// Filled glyphs read better at video scale than outline ones.

// Filled (black-style) glyphs for the SHAPE — color-recoloring happens in
// `PieceCircle` based on the piece's own color. Using filled forms across
// the board gives consistent stroke weight at video scale; the outline
// (white-style) variants ♔♕♖♗♘♙ are too light/thin to read cleanly.
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

/**
 * Normalize a piece label to a Unicode chess glyph. Handles common forms:
 *   - Single letters: "K", "Q", "R", "B", "N", "P"
 *   - Full words: "king", "queen", ...
 *   - Color-prefixed: "wK" / "bK" / "wQ" / "bQ" / etc. — the leading "w" or
 *     "b" is stripped before lookup so the same glyph is used for both
 *     colors (color rendering is handled at the `PieceCircle` level).
 *   - Long-form prefixed: "white king" / "black queen" — same stripping.
 * Returns the original label unchanged when no match is found (raw text
 * fallback for non-chess uses).
 */
const toChessGlyph = (label: string): string => {
  const norm = label.trim().toLowerCase();
  // Strip "w"/"b" color prefix if it's followed by a known piece letter or word.
  // Handles "wk" → "k", "bking" → "king", "white king" → "king".
  const colorStripped = norm
    .replace(/^(white\s+|black\s+)/, "")
    .replace(/^[wb](?=[kqrbnp]\b|[kqrbnp]$|king|queen|rook|bishop|knight|pawn)/, "");
  return CHESS_GLYPHS[colorStripped] || CHESS_GLYPHS[norm] || label;
};

// ── Piece Circle Component ───────────────────────────────────────────────────

/**
 * Piece renderer — two distinct visual registers:
 *
 *  • CHESS register (label resolves to a Unicode chess glyph): no disk, no
 *    ring. The glyph is rendered as a 64 px silhouette directly on the
 *    square, NYT-chess-column / FT-editorial-style. White pieces get a thin
 *    ink stroke via `-webkit-text-stroke` so they read distinctly against
 *    both light (paper) and dark (bronze) squares; black pieces are solid
 *    ink fills. A soft drop-shadow lifts the piece off the board, mimicking
 *    a real chess piece casting a shadow. This is the canonical professional
 *    look — disks + rings make pieces read as checkers / poker tokens, not
 *    chess pieces. May 13, 2026 polish pass.
 *
 *  • TOKEN register (raw text label, e.g. iterated-play strategy markers):
 *    the original disk-with-ring treatment — appropriate for matrix tokens
 *    where pieces are abstract markers, not chess pieces.
 */
const PieceCircle = React.memo<{
  label: string;
  color: string;
  mode?: "light" | "dark";
}>(function PieceCircle({ label, color, mode = "light" }) {
  const theme = useThemeMode(mode);
  const glyph = toChessGlyph(label);
  const isGlyph = glyph !== label;
  // White-piece logic: matches bone/paper color → render as outlined silhouette.
  const isLightPiece =
    color.toLowerCase() === palette.bone.toLowerCase() ||
    color.toLowerCase() === palette.paper.toLowerCase();

  // ─── Chess register: silhouette only, no disk, no ring ─────────────────
  if (isGlyph) {
    return (
      <div
        style={{
          // Square footprint slightly larger than the glyph so the drop
          // shadow doesn't clip; transform-origin centers on the square.
          width: 72,
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Drop shadow — soft, slightly offset down-right to suggest the
          // piece is sitting on the board with raked light from upper-left.
          filter: PIECE_DROPSHADOW,
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontFamily: "'DejaVu Sans', 'Segoe UI Symbol', sans-serif",
            // Black pieces: solid ink fill.
            // White pieces: paper fill with ink stroke so they read against
            // both paper (light) and bronze (dark) squares — the stroke is
            // what makes the white piece SHAPE-readable without a disk.
            color: isLightPiece ? palette.paper : palette.ink,
            WebkitTextStroke: isLightPiece
              ? `1.5px ${palette.ink}`
              : undefined,
            textAlign: "center",
            lineHeight: 1,
            fontWeight: 400,
            // No textShadow — drop-shadow on the wrapper handles lift.
          }}
        >
          {glyph}
        </div>
      </div>
    );
  }

  // ─── Token register: precision marker (intelligence-briefing aesthetic) ─
  // Strategic-actor-as-piece (e.g. "NVIDIA", "ASML", "US") — Bloomberg /
  // Economist-style. Small filled colored dot anchors the position; a single
  // hairline ring marks the actor without claiming the visual weight of a
  // disk; a short tether drops down to a small uppercase label so the label
  // reads as annotation, not as a button. Replaces the previous disk + amber
  // ring + centered text treatment, which read as a poker chip rather than
  // a precision marker. May 16, 2026 polish pass.
  const half = TOKEN_FOOTPRINT / 2;
  return (
    <div
      style={{
        width: TOKEN_FOOTPRINT,
        height: TOKEN_FOOTPRINT,
        position: "relative",
        filter: PIECE_DROPSHADOW,
      }}
    >
      <svg
        width={TOKEN_FOOTPRINT}
        height={TOKEN_FOOTPRINT}
        viewBox={`0 0 ${TOKEN_FOOTPRINT} ${TOKEN_FOOTPRINT}`}
        style={{ position: "absolute", inset: 0, overflow: "visible" }}
      >
        {/* Outer hairline ring — subtle, single ring (no crosshair on chess
            squares; that would clutter the board). */}
        <circle
          cx={half}
          cy={half}
          r={TOKEN_RING_R}
          fill="none"
          stroke={color}
          strokeWidth={0.8}
          opacity={TOKEN_RING_OPACITY}
        />
        {/* Filled position dot. */}
        <circle
          cx={half}
          cy={half}
          r={TOKEN_DOT_R}
          fill={color}
          opacity={TOKEN_DOT_OPACITY}
        />
        {/* Hairline tether dropping to the label. */}
        <line
          x1={half}
          y1={half + TOKEN_TETHER_GAP}
          x2={half}
          y2={half + TOKEN_TETHER_GAP + TOKEN_TETHER_LEN}
          stroke={color}
          strokeWidth={0.6}
          opacity={TOKEN_TETHER_OPACITY}
        />
      </svg>
      {/* Label floats below the tether — uppercase metadata mono, no chip. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: half + TOKEN_LABEL_OFFSET,
          textAlign: "center",
          fontSize: fontSizes.meta,
          fontFamily: fonts.metadata,
          letterSpacing: 1.5,
          textTransform: "uppercase",
          fontWeight: 600,
          color: theme.text.primary,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {glyph}
      </div>
    </div>
  );
});

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

  // `phases` is optional on the data type (schema gates by variant — see
  // GameBoard/schema.ts superRefine). Coerce to [] for the variants that
  // don't use it (iterated-play uses `rounds` instead).
  const phases = data.phases ?? [];

  warnIf(
    data.variant === "chess" && !data.initialPieces?.length && !phases.length,
    "GameBoard",
    "chess variant has no piece data and no phases — board will be empty",
  );
  warnIf(
    (data.variant === "payoff-matrix" || data.variant === "pd-canonical") && !data.cells?.length,
    "GameBoard",
    "payoff matrix variant has no cell data — grid will be empty",
  );
  warnIf(
    data.variant === "iterated-play" && !data.rounds?.length,
    "GameBoard",
    "iterated-play variant has no rounds data — no animation will occur",
  );

  // Anticipatory start: first board/piece/cell reveal lands settled at sync point 0.
  const firstSyncFrame = direction.syncPoints?.[0]?.frame;
  const firstRevealFrame = firstSyncFrame != null
    ? anticipatoryStartFrame(firstSyncFrame, sec(0.5))
    : sec(0.5);

  // Total duration: sum of all phases
  const totalDuration = data.durationSec || phases.reduce((sum, p) => sum + p.durationSec, 0);

  // Current phase label
  const currentPhaseLabel =
    state.currentPhaseIndex >= 0 ? phases[state.currentPhaseIndex]?.label : "";
  const currentPhaseSublabel =
    state.currentPhaseIndex >= 0 ? phases[state.currentPhaseIndex]?.sublabel : "";

  // Phase label fade
  const phaseStart = phases
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
    const phaseProgress = (frame - phaseStart) / sec(phases[state.currentPhaseIndex]?.durationSec || 2);
    // Zoom in at phase start, hold, ease out near phase end
    if (phaseProgress < 0.2) {
      return interpolate(phaseProgress, [0, 0.2], [1.0, 1.12], CLAMP_CUBIC);
    }
    if (phaseProgress > 0.8) {
      return interpolate(phaseProgress, [0.8, 1.0], [1.12, 1.0], CLAMP_CUBIC);
    }
    return 1.12;
  }, [isCinematic, state.currentPhaseIndex, frame, phaseStart, phases]);

  return (
    <AbsoluteFill>
      <Background
        variant={resolveAnalyticalBackgroundVariant(
          analyticalBackgroundBase(data.backgroundVariant),
          transparentBackdropRequested(data),
        )}
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
            syncPoints={direction.syncPoints}
          />
        </div>

        {/* Board variants.
            Per-variant vertical nudge (May 13, 2026 visual-register pass):
            with the title block centered at safe.top, the flex justify=center
            placed boards too high against the title for chess and pd-canonical
            (boards are visually heavier, need more breathing room below the
            title). PD also drifts slightly right because the Nash glyph and
            best-response arrows extend rightward from the matrix — pull it
            left a touch to optically center the whole compound. */}
        <div
          style={{
            marginBottom: layout.spacing.xxl,
            transform:
              data.variant === "pd-canonical"
                ? "translate(-32px, 48px)"
                : data.variant === "chess"
                  ? "translate(0, 48px)"
                  : "none",
          }}
        >
          {data.variant === "chess" && (
            <ChessBoard data={data} frame={frame} state={state} mode={mode} firstRevealFrame={firstRevealFrame} />
          )}
          {data.variant === "go" && (
            <GoBoard data={data} frame={frame} state={state} mode={mode} firstRevealFrame={firstRevealFrame} />
          )}
          {data.variant === "payoff-matrix" && (
            <PayoffMatrix data={data} frame={frame} state={state} mode={mode} firstRevealFrame={firstRevealFrame} />
          )}
          {data.variant === "pd-canonical" && (
            <PDCanonicalMatrix data={data} frame={frame} state={state} mode={mode} firstRevealFrame={firstRevealFrame} />
          )}
          {data.variant === "iterated-play" && (
            <IteratedPlayMatrix data={data} frame={frame} mode={mode} />
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
              phases[state.currentPhaseIndex]?.annotation && (
                <p
                  style={{
                    fontSize: fontSizes.body,
                    maxWidth: textMaxWidth.body,
                    fontFamily: fonts.body,
                    color: theme.text.primary,
                    margin: 0,
                    marginTop: layout.spacing.sm,
                    opacity: fadeIn(frame, phaseStart + sec(0.5), sec(0.4)),
                  }}
                >
                  {phases[state.currentPhaseIndex].annotation}
                </p>
              )}
            {/* Counter animation */}
            {state.currentPhaseIndex >= 0 &&
              phases[state.currentPhaseIndex]?.counterAnimation && (
                <CounterDisplay
                  counter={phases[state.currentPhaseIndex]?.counterAnimation!}
                  frame={frame}
                  phaseStart={phaseStart}
                  phaseDuration={sec(phases[state.currentPhaseIndex]?.durationSec ?? 0)}
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
