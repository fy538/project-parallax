/**
 * GameBoard Real-Data QA — targeted render review for active episode shots.
 *
 * GameBoard is used 8 times across both launch episodes (2 in silicon-trap,
 * 6 in prisoners-dilemma). It has three variants — chess (abstract board),
 * go (abstract board), and payoff-matrix (2D grid with cell values and
 * highlighting). The payoff-matrix variant accounts for 6 of the 8 shots
 * and is the primary risk surface: cell highlighting animation, Nash
 * equilibrium markers, and player labels all add layout pressure.
 *
 * The smoke test covers frame 30 with synthetic data; this suite uses real
 * episode JSON to catch failure modes that matter in review:
 *   - payoff-matrix cell alignment and highlight state
 *   - player label overflow (long names)
 *   - chess/go board grid correctness
 *   - mid-animation vs settled state consistency
 *
 * Pattern mirrors kinetic-typography-real-data.test.ts: render frame → compare
 * against baseline PNG. Baselines created on first run; must be committed.
 * To regenerate a baseline: delete the PNG and re-run.
 *
 * CASES:
 *   1. silicon-trap/gameboard-chess            — chess variant, 8×8 board
 *   2. silicon-trap/gameboard-go               — go variant, 19×19 board
 *   3. prisoners-dilemma/gameboard-flood-dresher — payoff-matrix, original RAND experiment
 *   4. prisoners-dilemma/gameboard-motif-beat1  — payoff-matrix, generic "The Model" context
 *   5. prisoners-dilemma/gameboard-trap-mechanism — payoff-matrix, self-confirming trap framing
 *   6. prisoners-dilemma/gameboard-final-choice — payoff-matrix manifest shot
 *   7. prisoners-dilemma/gameboard-nuclear — payoff-matrix nuclear framing
 *   8. prisoners-dilemma/gameboard-staghunt — payoff-matrix stag hunt
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  comparePNGs,
  initBundler,
  renderCompositionFrame,
  saveBaseline,
} from "./render-helper";
import { closeBrowser, ensureBaselineDir, initBrowser, regenBaselinesIfRequested } from "./setup";
import type { GameBoardData } from "../templates/GameBoard/types";

import gameboardChess          from "../../data/episodes/silicon-trap/gameboard-chess.json";
import gameboardGo             from "../../data/episodes/silicon-trap/gameboard-go.json";
import gameboardFloodDresher   from "../../data/episodes/prisoners-dilemma/gameboard-flood-dresher.json";
import gameboardFinalChoice    from "../../data/episodes/prisoners-dilemma/gameboard-final-choice.json";
import gameboardMotifBeat1     from "../../data/episodes/prisoners-dilemma/gameboard-motif-beat1.json";
import gameboardNuclear        from "../../data/episodes/prisoners-dilemma/gameboard-nuclear.json";
import gameboardStaghunt       from "../../data/episodes/prisoners-dilemma/gameboard-staghunt.json";
import gameboardTrapMechanism  from "../../data/episodes/prisoners-dilemma/gameboard-trap-mechanism.json";

const TEST_TIMEOUT   = 60000;
const REVIEW_FRAMES  = [30, 60];
const BASELINE_DIR   = path.resolve(__dirname, "baselines", "gameboard-review");
const TEMP_DIR       = path.resolve(__dirname, ".temp-renders", "gameboard-review");

interface GameBoardCase {
  reviewId: string;
  inputProps: { data: GameBoardData };
  why: string;
}

const GAMEBOARD_CASES: GameBoardCase[] = [
  {
    reviewId: "silicon-trap-gameboard-chess",
    inputProps: { data: gameboardChess as GameBoardData },
    why: "chess variant — 8×8 board with piece positions and move animations",
  },
  {
    reviewId: "silicon-trap-gameboard-go",
    inputProps: { data: gameboardGo as GameBoardData },
    why: "go variant — 19×19 board, stone positions",
  },
  {
    reviewId: "prisoners-dilemma-gameboard-flood-dresher",
    inputProps: { data: gameboardFloodDresher as GameBoardData },
    why: "payoff-matrix — original RAND experiment, historical player names",
  },
  {
    reviewId: "prisoners-dilemma-gameboard-motif-beat1",
    inputProps: { data: gameboardMotifBeat1 as GameBoardData },
    why: "payoff-matrix — generic 'Player A / Player B' framing, standard density",
  },
  {
    reviewId: "prisoners-dilemma-gameboard-trap-mechanism",
    inputProps: { data: gameboardTrapMechanism as GameBoardData },
    why: "payoff-matrix — self-confirming trap framing, 'You / Counterpart' labels",
  },
  {
    reviewId: "prisoners-dilemma-gameboard-final-choice",
    inputProps: { data: gameboardFinalChoice as GameBoardData },
    why: "payoff-matrix — final choice payoff layout (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-gameboard-nuclear",
    inputProps: { data: gameboardNuclear as GameBoardData },
    why: "payoff-matrix — nuclear deterrence framing",
  },
  {
    reviewId: "prisoners-dilemma-gameboard-staghunt",
    inputProps: { data: gameboardStaghunt as GameBoardData },
    why: "payoff-matrix — stag hunt payoff grid",
  },
];

describe("GameBoard Real-Data QA", () => {
  beforeAll(async () => {
    console.log("\n=== GameBoard Real-Data QA ===\n");
    await initBrowser();
    await initBundler();
    regenBaselinesIfRequested(BASELINE_DIR, { kind: "subdir" });
    ensureBaselineDir(BASELINE_DIR);
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await closeBrowser();
  }, TEST_TIMEOUT);

  GAMEBOARD_CASES.forEach((gbCase) => {
    REVIEW_FRAMES.forEach((frame) => {
      it(
        `${gbCase.reviewId}: frame ${frame} matches baseline (${gbCase.why})`,
        async () => {
          const fileName     = `${gbCase.reviewId}-frame-${frame}.png`;
          const currentFile  = path.join(TEMP_DIR, fileName);
          const baselineFile = path.join(BASELINE_DIR, fileName);

          await renderCompositionFrame(
            "GameBoard",
            frame,
            currentFile,
            gbCase.inputProps
          );

          expect(fs.existsSync(currentFile)).toBe(true);
          expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

          if (!fs.existsSync(baselineFile)) {
            console.log(
              `[Baseline] Creating gameboard baseline for ${gbCase.reviewId} f${frame}...`
            );
            saveBaseline(currentFile, baselineFile);
            return;
          }

          const result = comparePNGs(baselineFile, currentFile);
          if (!result.match) {
            console.warn(
              `[GameBoard QA] ${gbCase.reviewId} f${frame}: visual regression ` +
              `(${result.diffPixels}/${result.totalPixels} px differ, ` +
              `${result.diffPct.toFixed(3)}% > 0.5%). Diff: ${result.diffPath ?? "(not written)"}`
            );
          }
          expect(result.match).toBe(true);
        },
        TEST_TIMEOUT
      );
    });
  });
});
