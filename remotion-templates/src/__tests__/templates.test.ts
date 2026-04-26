/**
 * Visual Regression Tests — All 14 Remotion Compositions
 *
 * Tests render frame 30 of each composition and compare against baseline PNGs.
 * On the FIRST run, baselines are created.
 * On subsequent runs, renders are compared pixel-by-pixel with tolerance.
 *
 * Compositions tested:
 * 1. ChoroplethMap
 * 2. RouteAnimation
 * 3. TimelineComparison
 * 4. DataChart
 * 5. KineticTypography
 * 6. FrameworkDiagram
 * 7. TitleTransition
 * 8. DecisionTree
 * 9. SplitComposition
 * 10. ProbabilityGauge
 * 11. ImageComposite
 * 12. KineticShort
 * 13. DataChartShort
 * 14. SplitShort
 */

import { describe, it, beforeAll, afterAll, expect } from "vitest";
import path from "path";
import fs from "fs";
import {
  initBundler,
  renderCompositionFrame,
  comparePNGs,
  saveBaseline,
} from "./render-helper";
import { initBrowser, closeBrowser, ensureBaselineDir } from "./setup";

// Frame to render for each composition
const TEST_FRAME = 30;

// Baseline directory
const BASELINE_DIR = path.resolve(__dirname, "baselines");
const TEMP_DIR = path.resolve(__dirname, ".temp-renders");

// All 14 compositions
const COMPOSITIONS = [
  "ChoroplethMap",
  "RouteAnimation",
  "TimelineComparison",
  "DataChart",
  "KineticTypography",
  "FrameworkDiagram",
  "TitleTransition",
  "DecisionTree",
  "SplitComposition",
  "ProbabilityGauge",
  "ImageComposite",
  "KineticShort",
  "DataChartShort",
  "SplitShort",
];

describe("Visual Regression Tests", () => {
  // Set test timeout high (60 seconds) because rendering is slow
  const TEST_TIMEOUT = 60000;

  beforeAll(async () => {
    console.log("\n=== Visual Regression Test Suite ===\n");
    console.log("[Setup] Initializing browser...");
    await initBrowser();

    console.log("[Setup] Bundling entry point...");
    await initBundler();

    console.log("[Setup] Creating baseline directory...");
    ensureBaselineDir(BASELINE_DIR);

    console.log("[Setup] Creating temp directory...");
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    console.log("[Setup] Ready to render\n");
  }, TEST_TIMEOUT);

  afterAll(async () => {
    console.log("\n[Cleanup] Closing browser...");
    await closeBrowser();

    console.log("[Cleanup] Test suite complete.\n");
  }, TEST_TIMEOUT);

  /**
   * For each composition:
   * 1. Render frame 30 to a temp PNG
   * 2. If baseline doesn't exist, save the render as the baseline
   * 3. If baseline exists, compare current render against it
   * 4. Report result (match/diff)
   */
  COMPOSITIONS.forEach((compositionId) => {
    it(
      `${compositionId}: render and compare baseline`,
      async () => {
        const currentFile = path.join(TEMP_DIR, `${compositionId}-frame-30.png`);
        const baselineFile = path.join(
          BASELINE_DIR,
          `${compositionId}-frame-30.png`
        );

        // Step 1: Render current frame
        await renderCompositionFrame(compositionId, TEST_FRAME, currentFile);

        // Verify render succeeded
        expect(fs.existsSync(currentFile)).toBe(true);
        const currentStats = fs.statSync(currentFile);
        expect(currentStats.size).toBeGreaterThan(0);

        // Step 2 & 3: Compare or create baseline
        if (!fs.existsSync(baselineFile)) {
          console.log(
            `[Baseline] Creating baseline for ${compositionId}...`
          );
          saveBaseline(currentFile, baselineFile);
          console.log(
            `[Result] ${compositionId}: BASELINE CREATED (${currentStats.size} bytes)`
          );
        } else {
          // Step 4: Compare
          const result = comparePNGs(baselineFile, currentFile);
          const baselineStats = fs.statSync(baselineFile);

          if (result.match) {
            console.log(
              `[Result] ${compositionId}: PASS (baseline: ${baselineStats.size} bytes, current: ${currentStats.size} bytes, diff: ${result.sizeDiff} bytes)`
            );
            expect(true).toBe(true); // Passed
          } else {
            console.warn(
              `[Result] ${compositionId}: VISUAL DIFFERENCE DETECTED (baseline: ${baselineStats.size} bytes, current: ${currentStats.size} bytes, diff: ${result.sizeDiff} bytes)`
            );
            // This is a regression. You may want to:
            // 1. Review the visual diff manually
            // 2. Update the baseline if the change is intentional (copy current to baseline)
            // 3. Fix the code if the change is a bug
            expect(result.match).toBe(true);
          }
        }
      },
      TEST_TIMEOUT
    );
  });
});
