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
  /**
   * PD-canonical label: T(emptation) / R(eward) / P(unishment) / S(ucker).
   * Renders as a small mono kicker inside the cell. Only used by `pd-canonical` variant.
   * Convention: T > R > P > S.
   */
  cellType?: "T" | "R" | "P" | "S";
  /**
   * Hero treatment for `pd-canonical` variant:
   *  - "moral"      = the cell narration treats as what *should* happen (mutual cooperation).
   *                    Bone fill + amber accent.
   *  - "analytical" = the cell that *will* happen — Nash equilibrium (mutual defection).
   *                    Oxblood border + ∴ glyph.
   * Both can coexist; treatment is distinct.
   */
  heroRole?: "moral" | "analytical";
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

  variant: "chess" | "go" | "payoff-matrix" | "pd-canonical";

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

  // ── pd-canonical variant options ─────────────────────────────────────
  /**
   * Show T > R > P > S legend strip beneath the matrix.
   * Reads values from cells with `cellType` set. Default true for `pd-canonical`.
   */
  showTPRSLegend?: boolean;
  /**
   * Draw best-response arrows from off-equilibrium cells pointing toward each
   * player's preferred deviation. Rust color, low opacity. Default true for `pd-canonical`.
   *
   * Inferred from cell values when format is "X, Y" (row payoff, col payoff).
   */
  showBestResponseArrows?: boolean;
  /**
   * Show ∴ Parallax brand mark inside the analytical-hero (Nash) cell's top-right corner.
   * Default true for `pd-canonical`.
   */
  showNashGlyph?: boolean;
  /**
   * Units suffix appended to legend (e.g., "years" → "T = 5 years"). Default omitted.
   * Anchors abstract payoffs to a real referent (Tucker's original framing).
   */
  payoffUnits?: string;

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
