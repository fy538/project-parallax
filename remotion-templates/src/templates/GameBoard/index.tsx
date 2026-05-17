/**
 * GameBoard template registration.
 *
 * Sample composition for strategic game analysis (chess, go, payoff matrix).
 * Demonstrates US semiconductor strategy metaphor as chess — targeted moves,
 * capturing specific pieces (companies/tech).
 */

import { Composition } from "remotion";
import { GameBoard } from "./GameBoard";
import { standardMetadata } from "../../utils/composition";
import { GameBoardSchema } from "./schema";
import type { GameBoardData } from "./types";

// silicon-trap data — chess variant (US strategy)
import sampleData from "../../../data/episodes/silicon-trap/gameboard-chess.json";

export const GameBoardComposition = () => (
  <Composition
    id="GameBoard"
    component={GameBoard}
    schema={GameBoardSchema}
    calculateMetadata={standardMetadata<GameBoardData>(12)}
    defaultProps={{ data: sampleData as GameBoardData }}
  />
);
