/**
 * Visual Regression Tests — All Remotion Compositions
 *
 * Tests render frame 30 of each composition and compare against baseline PNGs.
 * On the FIRST run, baselines are created.
 * On subsequent runs, renders are compared with pixelmatch at a 0.5%
 * pixel-diff threshold (see `render-helper.ts` → `compareFramesPixel`).
 *
 * The composition set is maintained as the `COMPOSITIONS` array below.
 * Deprecated compositions (TimelineComparison, DualTimeline, etc. — migrated
 * to HorizontalTimeline / DuelingFrameworks per `docs/migration-*.md`)
 * are deliberately omitted from the array; don't re-add them.
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
import { initBrowser, closeBrowser, ensureBaselineDir, regenBaselinesIfRequested } from "./setup";

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
// Why a curated list and not all 45 templates? 45 × 3 = 135 renders per
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
  "HorizontalTimelineSingle", // Added May 15, 2026 — registered in Root.tsx (prior round) but missed from test list
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
  "ArcDiagram",
  // Scenarios
  "DecisionTree",
  "GameBoard",
  // Maps
  "ChoroplethMap",
  "RouteAnimation",
  "StrategicLandscape",
  "TilegramUSMap",
  // Cinematic
  "ImageComposite",
  "PhotoMontage",
  "AnnotatedImage",
  // Typography
  "KineticTypography",
  "TitleTransition",
  // Math (Phase 1 — math-rendering register, May 18, 2026)
  "MathReveal",
  // Math (Phase 2 — multi-step derivations, May 18, 2026)
  "MathDerivation",
  // Multi-segment
  "SplitComposition",
  "ProbabilityGauge",
  // Data — added May 14, 2026 (catalog completion sweep)
  "BumpChart",
  "PopulationPyramid",
  "RankChangeDotPlot",
  "IsotypeChart",
  // Data — new templates from the May 2026 build-out
  "BeeswarmChart",
  "CalendarHeatmap",
  "ConnectedScatterplot",
  "Streamgraph",
  "RidgelinePlot",
  "MarimekkoChart",
  "TernaryPlot",
  "HorizonChart",
  "DumbbellPlot",
  // Phase 4 chart family — added May 18, 2026 as part of the doc-coverage
  // burn-down (audit #16). All four render fine and have full Zod schemas;
  // baselines auto-create on next `npm run test:visual -- --update`.
  "Slopegraph",
  "KPICard",
  "BulletChart",
  "StepLine",
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
  // Added May 15, 2026 — flagged by template-coverage.test.ts as
  // registered-without-baseline. Both shipped in BL-02 (May 14) but were
  // missed from this list. Baselines auto-create on next BASELINE_REGEN run.
  "SplitComposition-Short",
  "ProbabilityGauge-Short",
  // TimelineComparison-Short relies on the deprecated TimelineComparison
  // template; removed from this list when the parent was retired.
];

// Combined list for testing
const ALL_COMPOSITIONS = [...COMPOSITIONS, ...SHORTS_COMPOSITIONS];

// ── Skip-on-missing-env predicates ──────────────────────────────────────────
// Some tests have hard external dependencies that can't be satisfied without
// runtime configuration (Mapbox token, sample assets). Rather than report
// them as failures every time a fresh dev clones the repo, we skip with a
// clear message so the suite still reports honest pass/skip counts.

/**
 * Map templates are skipped in the generic visual-regression suite.
 *
 * Even when Vitest loads `.env`, the Remotion browser bundle used by
 * `renderStill()` does not reliably inherit `MAPBOX_ACCESS_TOKEN`, so these
 * compositions become noisy false-failures here. Their dependency contract is
 * covered separately by `episode-integrity.test.ts`, and they are better
 * validated in Studio / real renders where the token is present end-to-end.
 */
const MAP_COMPOSITIONS = new Set([
  "ChoroplethMap",
  "RouteAnimation",
  "ChoroplethMap-Short",
]);

/** Composition → required asset path (relative to remotion-templates/public). */
const COMPOSITION_ASSET_DEPS: Record<string, string> = {
  // Generated by scripts/generate-test-assets.mjs; committed in repo.
  // Listed here so a fresh checkout that's missing the file gets a
  // clear skip message rather than a render-time error.
  ImageComposite: "assets/sample-historical.png",
};

function getSkipReason(compositionId: string): string | null {
  if (MAP_COMPOSITIONS.has(compositionId)) {
    return "map compositions are validated outside the generic snapshot suite";
  }
  const asset = COMPOSITION_ASSET_DEPS[compositionId];
  if (asset) {
    const assetPath = path.resolve(__dirname, "..", "..", "public", asset);
    if (!fs.existsSync(assetPath)) {
      return `required asset missing: public/${asset}`;
    }
  }
  return null;
}

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
    // Templates.test.ts writes loose `<Composition>-frame-<N>.png` files at the
    // root of baselines/. The *-real-data tests write into subdirs (chart-review/,
    // framework-review/, etc.) — leave those alone when this test is the one
    // being regenerated. See setup.ts → regenBaselinesIfRequested.
    regenBaselinesIfRequested(BASELINE_DIR, {
      kind: "rootFiles",
      pattern: /-frame-\d+\.png$/,
    });
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
    const skipReason = getSkipReason(compositionId);
    framesForThis.forEach((testFrame) => {
      const testFn = skipReason ? it.skip : it;
      testFn(
        `${compositionId}: frame ${testFrame} matches baseline${skipReason ? ` (skipped — ${skipReason})` : ""}`,
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
