/**
 * Zod schemas for GameBoard template.
 */

import { z } from "zod";

const ChessPieceSchema = z.object({
  position: z.tuple([z.number(), z.number()]),
  label: z.string(),
  color: z.string(),
  captured: z.boolean().optional(),
});

const GoStoneSchema = z.object({
  position: z.tuple([z.number(), z.number()]),
  stone: z.enum(["black", "white"]),
  label: z.string().optional(),
});

const PayoffCellSchema = z.object({
  row: z.number(),
  col: z.number(),
  value: z.string(),
  highlight: z.boolean().optional(),
  color: z.string().optional(),
  cellType: z.enum(["T", "R", "P", "S"]).optional(),
  heroRole: z.enum(["moral", "analytical"]).optional(),
});

const GamePhaseSchema = z.object({
  label: z.string(),
  sublabel: z.string().optional(),
  durationSec: z.number().positive(),
  pieces: z.array(ChessPieceSchema).optional(),
  stones: z.array(GoStoneSchema).optional(),
  highlights: z.array(z.number()).optional(),
});

export const GameBoardSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    variant: z.enum(["chess", "go", "payoff-matrix", "pd-canonical", "iterated-play"]),
    boardSize: z.number().optional(),
    initialPieces: z.array(ChessPieceSchema).optional(),
    initialStones: z.array(GoStoneSchema).optional(),
    rowPlayer: z.string().optional(),
    colPlayer: z.string().optional(),
    rowOptions: z.array(z.string()).optional(),
    colOptions: z.array(z.string()).optional(),
    cells: z.array(PayoffCellSchema).optional(),
    rounds: z.array(z.object({
      label: z.string(),
      highlights: z.array(z.number()),
      annotation: z.string().optional(),
    })).optional(),
    showTPRSLegend: z.boolean().optional(),
    showBestResponseArrows: z.boolean().optional(),
    showNashGlyph: z.boolean().optional(),
    payoffUnits: z.string().optional(),
    phases: z.array(GamePhaseSchema).min(1),
    source: z.string().optional(),
    durationSec: z.number().positive().optional(),
    backgroundTint: z.string().optional(),
    backgroundVariant: z.enum(["light", "dark"]).optional(),
    _direction: z.unknown().optional(),
  }),
});
