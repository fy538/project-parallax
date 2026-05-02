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
  durations,
  light,
  contentArea,
  cardPadding,
  textMaxWidth,
} from "../../design/theme";
import {
  fadeIn,
  slideIn,
  stagger,
  scaleIn,
  gentleSpring,
  exitFade,
  kenBurnsDrift,
  CLAMP,
  CLAMP_CUBIC,
} from "../../utils/animation";
import { Background } from "../../components/Background";
import { FadeIn } from "../../components/FadeIn";
import type { GameBoardData, ChessPiece, GoStone, PayoffCell } from "./types";

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
}> = ({ data, frame, state }) => {
  const boardSize = data.boardSize || 8;
  const squareSize = 600 / boardSize; // 75px per square for 8x8
  const boardStart = sec(0.5);

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
        background: light.bg.surface,
        border: `2px solid ${palette.amber}`,
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
            stroke={palette.amber}
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
            stroke={palette.amber}
            strokeWidth="0.02"
            opacity="0.3"
          />
        ))}
      </svg>

      {/* Alternating squares */}
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
              backgroundColor: isLight
                ? light.bg.elevated
                : light.bg.surface,
              opacity: 0.5,
            }}
          />
        );
      })}

      {/* Pieces */}
      {state.pieces.map((piece, idx) => {
        const [col, row] = piece.position;
        const left = col * squareSize + squareSize / 2;
        const top = row * squareSize + squareSize / 2;

        // Initial pieces: spring in
        const isInitial = data.initialPieces?.includes(piece) || false;
        const pieceStart = isInitial
          ? initialPiecesStart + idx * sec(0.15)
          : frame; // Incoming pieces mid-phase
        const pieceScale = scaleIn(frame, pieceStart, sec(0.6));
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
              <PieceCircle label={piece.label} color={piece.color} />
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
            <PieceCircle label={piece.label} color={piece.color} />
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
}> = ({ data, frame, state }) => {
  const boardSize = data.boardSize || 9;
  const gridSize = 500; // 500x500 grid
  const intersectionSpacing = gridSize / (boardSize - 1);

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
        padding: 20,
        background: light.bg.surface,
      }}
    >
      {/* Grid lines */}
      <svg
        style={{
          position: "absolute",
          inset: 20,
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
              stroke={palette.amber}
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
              stroke={palette.amber}
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
        const x = (col / (boardSize - 1)) * gridSize + 20;
        const y = (row / (boardSize - 1)) * gridSize + 20;

        const isInitial = data.initialStones?.includes(stone) || false;
        const stoneStart = isInitial
          ? sec(0.5) + idx * sec(0.15)
          : frame;
        const stoneScale = scaleIn(frame, stoneStart, sec(0.6));
        const stoneOpacity = fadeIn(frame, stoneStart, sec(0.3));

        const stoneColor = stone.stone === "black" ? palette.ink : palette.bone;

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
                backgroundColor: stoneColor,
                border:
                  stone.stone === "black"
                    ? "none"
                    : `1px solid ${palette.ink}`,
                boxShadow: shadows.subtle,
              }}
            />
            {stone.label && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  marginTop: layout.spacing.xs,
                  fontSize: 11,
                  fontFamily: fonts.body,
                  color: light.text.secondary,
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
}> = ({ data, frame, state }) => {
  const rows = data.rowOptions?.length || 2;
  const cols = data.colOptions?.length || 2;
  const cellSize = 140;
  const labelWidth = 120;
  const headerHeight = 60;

  const gridOpacity = fadeIn(frame, 0, sec(0.4));
  const cells = data.cells || [];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 20,
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
              color: light.text.primary,
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
              paddingRight: 12,
              fontSize: fontSizes.label,
              fontFamily: fonts.body,
              color: light.text.primary,
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
            const highlightStart = sec(2.5);
            const highlightProgress = interpolate(
              frame,
              [highlightStart, highlightStart + sec(1)],
              [0, 1],
              CLAMP
            );
            const glowOpacity = isHighlighted ? highlightProgress : 0;

            return (
              <div
                key={`cell-${rowIdx}-${colIdx}`}
                style={{
                  position: "relative",
                  width: cellSize,
                  height: cellSize,
                  border: `1px solid ${palette.amber}50`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: isHighlighted
                    ? `${palette.amber}20`
                    : "transparent",
                  opacity: cellOpacity,
                  boxShadow: isHighlighted
                    ? `${shadows.accentGlow(palette.amber)}, ${shadows.accentGlow(
                        palette.rust
                      )}`
                    : "none",
                }}
              >
                <div
                  style={{
                    fontSize: fontSizes.body,
                    fontFamily: fonts.data,
                    color: light.text.primary,
                    textAlign: "center",
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

// ── Piece Circle Component ───────────────────────────────────────────────────

const PieceCircle: React.FC<{
  label: string;
  color: string;
}> = ({ label, color }) => (
  <div
    style={{
      width: 56,
      height: 56,
      borderRadius: "50%",
      backgroundColor: color,
      border: `2px solid ${palette.amber}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: shadows.subtle,
    }}
  >
    <div
      style={{
        fontSize: fontSizes.caption,
        fontFamily: fonts.body,
        color: light.text.primary,
        textAlign: "center",
        fontWeight: 600,
        maxWidth: "90%",
      }}
    >
      {label}
    </div>
  </div>
);

// ── Main Component ───────────────────────────────────────────────────────────

export const GameBoard: React.FC<{ data: GameBoardData }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

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

  // Exit fade at end
  const endFrame = sec(totalDuration) - sec(1);
  const overallOpacity = exitFade(frame, endFrame, sec(1));

  return (
    <AbsoluteFill style={{ backgroundColor: light.bg.base }}>
      <Background
        variant="light"
        tint={data.backgroundTint}
      />

      {/* Main content — Ken Burns drift for camera energy */}
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
          transform: `scale(${kenBurnsDrift(frame, durationInFrames, 1.02)})`,
          transformOrigin: "center center",
        }}
      >
        {/* Title */}
        <FadeIn
          duration={sec(0.6)}
          startFrame={0}
        >
          <h1
            style={{
              fontSize: fontSizes.h2,
              fontFamily: fonts.display,
              color: light.text.primary,
              textAlign: "center",
              margin: 0,
              marginBottom: layout.spacing.lg,
              letterSpacing: 1,
            }}
          >
            {data.title}
          </h1>
        </FadeIn>

        {/* Subtitle */}
        {data.subtitle && (
          <FadeIn
            duration={sec(0.6)}
            startFrame={sec(0.2)}
          >
            <p
              style={{
                fontSize: fontSizes.body,
                fontFamily: fonts.body,
                color: light.text.secondary,
                textAlign: "center",
                margin: 0,
                marginBottom: layout.spacing.xxl,
              }}
            >
              {data.subtitle}
            </p>
          </FadeIn>
        )}

        {/* Board variants */}
        <div style={{ marginBottom: layout.spacing.xxl }}>
          {data.variant === "chess" && (
            <ChessBoard data={data} frame={frame} state={state} />
          )}
          {data.variant === "go" && (
            <GoBoard data={data} frame={frame} state={state} />
          )}
          {data.variant === "payoff-matrix" && (
            <PayoffMatrix data={data} frame={frame} state={state} />
          )}
        </div>

        {/* Phase label — slideIn (no naked fade) */}
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
                  color: light.text.secondary,
                  margin: 0,
                  marginTop: layout.spacing.xs,
                }}
              >
                {currentPhaseSublabel}
              </p>
            )}
          </div>
        )}

        {/* Source attribution — slideIn (no naked fade) */}
        {data.source && (
          <p
            style={{
              fontSize: fontSizes.meta,
              fontFamily: fonts.body,
              color: light.text.muted,
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
