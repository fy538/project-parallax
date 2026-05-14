/**
 * Zod schemas for GameBoard template.
 */

import { z } from "zod";
import { DirectionBlockSchema } from "../../hooks/directionBlock.schema";

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
    // Phases is optional at the schema level; the superRefine below enforces
    // that non-iterated variants require non-empty phases, while iterated-play
    // requires non-empty rounds instead. Previously a `.min(1)` here forced
    // catalog samples like `gameIteratedPD` to pad filler phases.
    phases: z.array(GamePhaseSchema).optional(),
    source: z.string().optional(),
    durationSec: z.number().positive().optional(),
    backgroundTint: z.string().optional(),
    backgroundVariant: z.enum(["light", "dark"]).optional(),
    _direction: DirectionBlockSchema.optional(),
  })
  .superRefine((d, ctx) => {
    // Phases / rounds requirement gates by variant:
    //   chess | go | payoff-matrix | pd-canonical → require non-empty `phases`
    //   iterated-play                              → require non-empty `rounds`
    if (d.variant === "iterated-play") {
      if (!d.rounds || d.rounds.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "variant 'iterated-play' requires at least one entry in `rounds`",
          path: ["rounds"],
        });
      }
    } else {
      if (!d.phases || d.phases.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `variant '${d.variant}' requires at least one entry in \`phases\``,
          path: ["phases"],
        });
      }
    }
  }),
});
