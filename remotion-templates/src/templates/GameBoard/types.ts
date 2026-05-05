/**
 * GameBoard template types.
 *
 * Three game variants for strategic analysis metaphors:
 * - Chess: targeted moves, capturing specific pieces (US-style)
 * - Go: surrounding territory, patient strategy (China-style)
 * - Payoff Matrix: game theory outcomes (Nash equilibria)
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface ChessPiece {
  /** Board position [col, row] (0-indexed) */
  position: [number, number];
  /** Display label (company/country name) */
  label: string;
  color: string;
  /** Is this piece captured in this phase? */
  captured?: boolean;
}

export interface GoStone {
  /** Board position [col, row] (0-indexed) */
  position: [number, number];
  /** Stone color: "black" or "white" */
  stone: "black" | "white";
  label?: string;
}

export interface PayoffCell {
  row: number;
  col: number;
  /** Display value (e.g., "+3, -1") */
  value: string;
  /** Highlight this cell (e.g., Nash equilibrium) */
  highlight?: boolean;
  color?: string;
}

export interface CounterAnimation {
  /** Value to count up to (e.g., cooperate: 60) */
  cooperate?: number;
  defect?: number;
  cooperateColor?: string;
  defectColor?: string;
}

export interface GamePhase {
  /** Phase title shown as overlay */
  label: string;
  sublabel?: string;
  /** Duration of this phase in seconds */
  durationSec: number;
  /** Chess pieces to add/capture */
  pieces?: ChessPiece[];
  /** Go stones to place */
  stones?: GoStone[];
  /** Payoff cells to highlight */
  highlights?: number[]; // indices into cells array
  /** Text annotation shown below the phase label */
  annotation?: string;
  /** Animated counter display (e.g., counting up cooperation vs defection rounds) */
  counterAnimation?: CounterAnimation;
}

export interface GameBoardData {
  episode: string;
  title: string;
  subtitle?: string;

  variant: "chess" | "go" | "payoff-matrix";

  /** Chess: board size (default 8) */
  boardSize?: number;
  /** Go: board size (default 9 for simplified, 19 for full) */

  /** Chess/Go: initial pieces/stones before phases */
  initialPieces?: ChessPiece[];
  initialStones?: GoStone[];

  /** Payoff matrix: player labels */
  rowPlayer?: string;
  colPlayer?: string;
  rowOptions?: string[];
  colOptions?: string[];
  cells?: PayoffCell[];

  /** Phased animation */
  phases: GamePhase[];

  source?: string;
  durationSec?: number;
  backgroundTint?: string;
  backgroundVariant?: "light" | "dark";
  /** Cinematic mode: camera zooms to active board region per phase */
  cinematicMode?: boolean;
  /** Enable ambient particles for depth */
  ambientParticles?: boolean;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}
