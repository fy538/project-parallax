/**
 * SplitComposition Real-Data QA — targeted render review for active split shots.
 *
 * SplitComposition previously mixed generous top padding with standard left/right
 * and bottom insets. This suite locks the live prisoners-dilemma split plus a
 * long-copy stress variant so the cinematic focus phases stay stable as we
 * migrate onto a shared content rect.
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
import { closeBrowser, ensureBaselineDir, initBrowser } from "./setup";
import type { SplitCompositionData } from "../templates/SplitComposition/types";
import pdVsStagHunt from "../../data/episodes/prisoners-dilemma/split-pd-vs-staghunt.json";

const TEST_TIMEOUT = 60000;
const REVIEW_FRAMES = [45, 150, 270];
const BASELINE_DIR = path.resolve(__dirname, "baselines", "split-review");
const TEMP_DIR = path.resolve(__dirname, ".temp-renders", "split-review");

interface SplitCase {
  reviewId: string;
  inputProps: { data: SplitCompositionData };
  why: string;
}

const baseSplit = pdVsStagHunt as SplitCompositionData;

const longCopySplit: SplitCompositionData = {
  ...baseSplit,
  title: "Two Games, Two Worlds, Two Completely Different Strategic Futures",
  subtitle: "Same surface dilemma. Different cooperation landscape and payoff logic.",
  left: {
    ...baseSplit.left,
    tag: "ONE EQUILIBRIUM / DEFECT DOMINATES",
    subtitle: "Cooperation collapses when trust cannot survive exploitation risk",
    items: [
      ...baseSplit.left.items,
      "The structure itself punishes optimistic coordination",
    ],
  },
  right: {
    ...baseSplit.right,
    tag: "TWO EQUILIBRIA / TRUST CHANGES EVERYTHING",
    subtitle: "Mutual trust opens a better outcome without making caution irrational",
    items: [
      ...baseSplit.right.items,
      "Institutions can move a society from fear to coordination",
    ],
  },
};

const SPLIT_CASES: SplitCase[] = [
  {
    reviewId: "prisoners-dilemma-pd-vs-staghunt",
    inputProps: { data: baseSplit },
    why: "live cinematic split with left focus, right focus, and overview phases",
  },
  {
    reviewId: "prisoners-dilemma-pd-vs-staghunt-long-copy",
    inputProps: { data: longCopySplit },
    why: "derived stress variant for long title, tag, subtitle, and item stacks",
  },
];

describe("SplitComposition Real-Data QA", () => {
  beforeAll(async () => {
    console.log("\n=== SplitComposition Real-Data QA ===\n");
    await initBrowser();
    await initBundler();
    ensureBaselineDir(BASELINE_DIR);
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await closeBrowser();
  }, TEST_TIMEOUT);

  SPLIT_CASES.forEach((splitCase) => {
    REVIEW_FRAMES.forEach((frame) => {
      it(
        `${splitCase.reviewId}: frame ${frame} matches baseline (${splitCase.why})`,
        async () => {
          const fileName = `${splitCase.reviewId}-frame-${frame}.png`;
          const currentFile = path.join(TEMP_DIR, fileName);
          const baselineFile = path.join(BASELINE_DIR, fileName);

          await renderCompositionFrame(
            "SplitComposition",
            frame,
            currentFile,
            splitCase.inputProps
          );

          expect(fs.existsSync(currentFile)).toBe(true);
          expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

          if (!fs.existsSync(baselineFile)) {
            console.log(
              `[Baseline] Creating split baseline for ${splitCase.reviewId} f${frame}...`
            );
            saveBaseline(currentFile, baselineFile);
            return;
          }

          const result = comparePNGs(baselineFile, currentFile);
          if (!result.match) {
            console.warn(
              `[Split QA] ${splitCase.reviewId} f${frame}: visual regression ` +
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
