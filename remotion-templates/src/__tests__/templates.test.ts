/**
 * Visual Regression Tests — All Remotion Compositions
 *
 * Tests render frame 30 of each composition and compare against baseline PNGs.
 * On the FIRST run, baselines are created.
 * On subsequent runs, renders are compared with file-size tolerance (5%).
 *
 * Landscape compositions (22):
 *   ChoroplethMap, RouteAnimation, TimelineComparison, DataChart,
 *   KineticTypography, FrameworkDiagram, TitleTransition, DecisionTree,
 *   SplitComposition, ProbabilityGauge, ImageComposite, PhotoMontage,
 *   NetworkDiagram, TimeSeriesChart, SankeyFlow, GameBoard, BayesianUpdate,
 *   StatReveal, RadarChart, AnnotatedImage, EscalationLadder, DualTimeline,
 *   HorizontalTimeline, DuelingFrameworks, StrategicLandscape
 *
 * Shorts (6):
 *   KineticShort, DataChartShort, SplitShort, StatRevealShort,
 *   FrameworkDiagramShort, TimelineComparisonShort
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

// Default frame for every composition — preserves the original single-frame
// baseline coverage that the existing baselines were captured against.
const TEST_FRAME = 30;

// Motion-critical templates get *additional* frame coverage at entrance (0)
// and late-state (60). This catches stagger/entrance/exit regressions that
// the single mid-animation frame can't see. Frame 60 is the conservative
// late-state pick: every composition is at least 2 seconds (60 frames at
// 30fps), so frame 60 is always a valid render. Going higher (90, 120) would
// trip on the shortest Shorts compositions.
//
// Why a curated list and not all 32 templates? 32 × 3 = 96 renders per
// `npm test`, which would push the suite past 15 minutes. The five below are
// where camera/stagger work has the most surface area and where frame-30-only
// coverage has historically missed regressions.
const MOTION_EXTRA_FRAMES = [0, 60];
const MOTION_CRITICAL = new Set([
  "TitleTransition",
  "KineticTypography",
  "DataChart",
  "ChoroplethMap",
  "RouteAnimation",
]);

// Baseline directory
const BASELINE_DIR = path.resolve(__dirname, "baselines");
const TEMP_DIR = path.resolve(__dirname, ".temp-renders");

// All landscape compositions (must match Root.tsx registration IDs)
const COMPOSITIONS = [
  // Timelines
  "HorizontalTimeline",
  // (TimelineComparison / TimelineMorph / DualTimeline were removed from
  //  Root.tsx; the deprecated entries previously kept here for regression
  //  now reference compositions that don't exist and crash the suite.)
  "EscalationLadder",
  // Data
  "DataChart",
  "TimeSeriesChart",
  "SankeyFlow",
  "StatReveal",
  "RadarChart",
  "BayesianUpdate",
  // Frameworks
  "FrameworkDiagram",
  "DuelingFrameworks",
  "NetworkDiagram",
  // Scenarios
  "DecisionTree",
  "GameBoard",
  // Maps
  "ChoroplethMap",
  "RouteAnimation",
  "StrategicLandscape",
  // Cinematic
  "ImageComposite",
  "PhotoMontage",
  "AnnotatedImage",
  // Typography
  "KineticTypography",
  "TitleTransition",
  // Multi-segment
  "SplitComposition",
  "ProbabilityGauge",
];

// Shorts compositions — IDs match the Root.tsx registrations (note the
// hyphen in FrameworkDiagram-Short et al. — Shorts adopted hyphenated
// naming after the original test list was written).
const SHORTS_COMPOSITIONS = [
  "KineticShort",
  "DataChartShort",
  "SplitShort",
  "StatRevealShort",
  "FrameworkDiagram-Short",
  // TimelineComparison-Short relies on the deprecated TimelineComparison
  // template; removed from this list when the parent was retired.
];

// Combined list for testing
const ALL_COMPOSITIONS = [...COMPOSITIONS, ...SHORTS_COMPOSITIONS];

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
  ALL_COMPOSITIONS.forEach((compositionId) => {
    const framesForThis = MOTION_CRITICAL.has(compositionId)
      ? [TEST_FRAME, ...MOTION_EXTRA_FRAMES]
      : [TEST_FRAME];
    framesForThis.forEach((testFrame) => {
      it(
        `${compositionId}: frame ${testFrame} matches baseline`,
        async () => {
          const fileName = `${compositionId}-frame-${testFrame}.png`;
          const currentFile = path.join(TEMP_DIR, fileName);
          const baselineFile = path.join(BASELINE_DIR, fileName);

          // Step 1: Render current frame
          await renderCompositionFrame(compositionId, testFrame, currentFile);

          // Verify render succeeded
          expect(fs.existsSync(currentFile)).toBe(true);
          const currentStats = fs.statSync(currentFile);
          expect(currentStats.size).toBeGreaterThan(0);

          // Step 2 & 3: Compare or create baseline
          if (!fs.existsSync(baselineFile)) {
            console.log(
              `[Baseline] Creating baseline for ${compositionId} f${testFrame}...`
            );
            saveBaseline(currentFile, baselineFile);
            console.log(
              `[Result] ${compositionId} f${testFrame}: BASELINE CREATED (${currentStats.size} bytes)`
            );
          } else {
            // Step 4: Compare via real pixel diff (was file-size 5%
            // tolerance — see comparePNGs JSDoc for why that was leaky).
            const result = comparePNGs(baselineFile, currentFile);

            if (result.match) {
              console.log(
                `[Result] ${compositionId} f${testFrame}: PASS (${result.diffPixels}/${result.totalPixels} px differ, ${result.diffPct.toFixed(3)}%)`
              );
              expect(true).toBe(true); // Passed
            } else {
              console.warn(
                `[Result] ${compositionId} f${testFrame}: VISUAL REGRESSION ` +
                `(${result.diffPixels}/${result.totalPixels} px differ, ` +
                `${result.diffPct.toFixed(3)}% > 0.5% threshold). ` +
                `Diff PNG: ${result.diffPath ?? "(not written)"}`
              );
              expect(result.match).toBe(true);
            }
          }
        },
        TEST_TIMEOUT
      );
    });
  });
});

// Re-export for any external consumer that imported it
export { TEST_FRAME };
