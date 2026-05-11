/**
 * DecisionTree Real-Data QA — manifest-used silicon-trap AI timeline shot.
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
import { closeBrowser, ensureBaselineDir, initBrowser, regenBaselinesIfRequested } from "./setup";
import type { DecisionTreeData } from "../templates/DecisionTree/types";

import decisiontreeAiTimeline from "../../data/episodes/silicon-trap/decisiontree-ai-timeline.json";

const TEST_TIMEOUT = 60000;
const REVIEW_FRAMES = [30, 60];
const BASELINE_DIR = path.resolve(__dirname, "baselines", "decision-tree-review");
const TEMP_DIR = path.resolve(__dirname, ".temp-renders", "decision-tree-review");

const REVIEW_ID = "silicon-trap-decisiontree-ai-timeline";
const INPUT_PROPS: { data: DecisionTreeData } = {
  data: decisiontreeAiTimeline as unknown as DecisionTreeData,
};

describe("DecisionTree Real-Data QA", () => {
  beforeAll(async () => {
    console.log("\n=== DecisionTree Real-Data QA ===\n");
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

  REVIEW_FRAMES.forEach((frame) => {
    it(
      `${REVIEW_ID}: frame ${frame} matches baseline — branching tree, camera path`,
      async () => {
        const fileName = `${REVIEW_ID}-frame-${frame}.png`;
        const currentFile = path.join(TEMP_DIR, fileName);
        const baselineFile = path.join(BASELINE_DIR, fileName);

        await renderCompositionFrame("DecisionTree", frame, currentFile, INPUT_PROPS);

        expect(fs.existsSync(currentFile)).toBe(true);
        expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

        if (!fs.existsSync(baselineFile)) {
          console.log(`[Baseline] Creating decision-tree baseline f${frame}...`);
          saveBaseline(currentFile, baselineFile);
          return;
        }

        const result = comparePNGs(baselineFile, currentFile);
        if (!result.match) {
          console.warn(
            `[DecisionTree QA] f${frame}: visual regression ` +
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
