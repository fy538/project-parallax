/**
 * GameBoard template types.
 *
 * Three game variants for strategic analysis metaphors:
 * - Chess: targeted moves, capturing specific pieces (US-style)
 * - Go: surrounding territory, patient strategy (China-style)
 * - Payoff Matrix: game theory outcomes (Nash equilibria)
 *
 * Types derived from Zod schemas (May 2026 audit #3 burn-down).
 */

import type { z } from "zod";
import type {
  ChessPieceSchema,
  CounterAnimationSchema,
  GameBoardDataSchema,
  GameBoardVariantSchema,
  GamePhaseSchema,
  GameRoundSchema,
  GoStoneSchema,
  PayoffCellSchema,
} from "./schema";

export type ChessPiece = z.infer<typeof ChessPieceSchema>;
export type GoStone = z.infer<typeof GoStoneSchema>;
export type PayoffCell = z.infer<typeof PayoffCellSchema>;
export type CounterAnimation = z.infer<typeof CounterAnimationSchema>;
export type GamePhase = z.infer<typeof GamePhaseSchema>;
export type GameRound = z.infer<typeof GameRoundSchema>;
export type GameBoardVariant = z.infer<typeof GameBoardVariantSchema>;
export type GameBoardData = z.infer<typeof GameBoardDataSchema>;
