/**
 * TitleTransition Real-Data QA — silicon-trap assembly end-card (title-endcard.json).
 *
 * Mirrors framework-diagram-real-data pattern: render → baseline compare.
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
import type { TitleTransitionData } from "../templates/TitleTransition/types";

import titleEndcard from "../../data/episodes/silicon-trap/title-endcard.json";

const TEST_TIMEOUT = 60000;
const REVIEW_FRAMES = [30, 60];
const BASELINE_DIR = path.resolve(__dirname, "baselines", "title-transition-review");
const TEMP_DIR = path.resolve(__dirname, ".temp-renders", "title-transition-review");

const REVIEW_ID = "silicon-trap-title-endcard";
const INPUT_PROPS: { data: TitleTransitionData } = {
  data: titleEndcard as unknown as TitleTransitionData,
};

describe("TitleTransition Real-Data QA", () => {
  beforeAll(async () => {
    console.log("\n=== TitleTransition Real-Data QA ===\n");
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

  REVIEW_FRAMES.forEach((frame) => {
    it(
      `${REVIEW_ID}: frame ${frame} matches baseline — end-card, dark bg`,
      async () => {
        const fileName = `${REVIEW_ID}-frame-${frame}.png`;
        const currentFile = path.join(TEMP_DIR, fileName);
        const baselineFile = path.join(BASELINE_DIR, fileName);

        await renderCompositionFrame("TitleTransition", frame, currentFile, INPUT_PROPS);

        expect(fs.existsSync(currentFile)).toBe(true);
        expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

        if (!fs.existsSync(baselineFile)) {
          console.log(`[Baseline] Creating title-transition baseline f${frame}...`);
          saveBaseline(currentFile, baselineFile);
          return;
        }

        const result = comparePNGs(baselineFile, currentFile);
        if (!result.match) {
          console.warn(
            `[TitleTransition QA] f${frame}: visual regression ` +
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
