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
});

const GamePhaseSchema = z.object({
  label: z.string(),
  sublabel: z.string().optional(),
  durationSec: z.number(),
  pieces: z.array(ChessPieceSchema).optional(),
  stones: z.array(GoStoneSchema).optional(),
  highlights: z.array(z.number()).optional(),
});

export const GameBoardSchema = z.object({
  data: z.object({
    episode: z.string(),
    title: z.string(),
    subtitle: z.string().optional(),
    variant: z.enum(["chess", "go", "payoff-matrix"]),
    boardSize: z.number().optional(),
    initialPieces: z.array(ChessPieceSchema).optional(),
    initialStones: z.array(GoStoneSchema).optional(),
    rowPlayer: z.string().optional(),
    colPlayer: z.string().optional(),
    rowOptions: z.array(z.string()).optional(),
    colOptions: z.array(z.string()).optional(),
    cells: z.array(PayoffCellSchema).optional(),
    phases: z.array(GamePhaseSchema),
    source: z.string().optional(),
    durationSec: z.number().optional(),
    backgroundTint: z.string().optional(),
    backgroundVariant: z.enum(["light", "dark"]).optional(),
  }),
});
