/**
 * ProbabilityGauge Real-Data QA — manifest-used forecast variant (prisoners-dilemma).
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
import type { ProbabilityGaugeData } from "../templates/ProbabilityGauge/types";

import forecastPdCooperation from "../../data/episodes/prisoners-dilemma/forecast-pd-cooperation.json";

const TEST_TIMEOUT = 60000;
const REVIEW_FRAMES = [30, 60];
const BASELINE_DIR = path.resolve(__dirname, "baselines", "probability-gauge-review");
const TEMP_DIR = path.resolve(__dirname, ".temp-renders", "probability-gauge-review");

const REVIEW_ID = "prisoners-dilemma-forecast-pd-cooperation";
const INPUT_PROPS: { data: ProbabilityGaugeData } = {
  data: forecastPdCooperation as unknown as ProbabilityGaugeData,
};

describe("ProbabilityGauge Real-Data QA", () => {
  beforeAll(async () => {
    console.log("\n=== ProbabilityGauge Real-Data QA ===\n");
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
      `${REVIEW_ID}: frame ${frame} matches baseline — forecast variant, 6-layer card`,
      async () => {
        const fileName = `${REVIEW_ID}-frame-${frame}.png`;
        const currentFile = path.join(TEMP_DIR, fileName);
        const baselineFile = path.join(BASELINE_DIR, fileName);

        await renderCompositionFrame("ProbabilityGauge", frame, currentFile, INPUT_PROPS);

        expect(fs.existsSync(currentFile)).toBe(true);
        expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

        if (!fs.existsSync(baselineFile)) {
          console.log(`[Baseline] Creating probability-gauge baseline f${frame}...`);
          saveBaseline(currentFile, baselineFile);
          return;
        }

        const result = comparePNGs(baselineFile, currentFile);
        if (!result.match) {
          console.warn(
            `[ProbabilityGauge QA] f${frame}: visual regression ` +
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
