/**
 * Catalog Smoke Tests — Visual Regression for Catalog Variant Compositions
 *
 * Mirrors templates.test.ts but covers the ~50+ catalog-* variant comps
 * registered via the `catalogId()` helper across src/catalog/. The base
 * compositions (DecisionTree, TimeSeriesChart, GameBoard, etc.) are covered
 * by templates.test.ts; this suite catches drift in the catalog VARIANTS
 * that template-level tests don't see (e.g., catalog-decision-tree-excomm-
 * ladder, catalog-game-board-pd-canonical, catalog-time-series-chart-
 * population-small-multiples).
 *
 * Why a separate test file? Catalog comps are how we demo each variant to
 * ourselves; silent visual drift in them undermines the "verify backstage"
 * doctrine. Without this coverage, regressions in (say) the 8-option-clip
 * behavior of `catalog-decision-tree-excomm-ladder` would only surface on
 * manual render.
 *
 * Why hardcode the ID list? The catalog files are stable; programmatic
 * discovery (parsing src/catalog/*.tsx for `catalogId(...)` calls) would
 * couple the test runtime to source layout for no real upside. New catalog
 * comps appear when humans add them; humans can add them here too.
 *
 * Baseline directory: `baselines/catalog-smoke/` (subdir). Scoped per-test
 * via `regenBaselinesIfRequested({ kind: "subdir" })` so `BASELINE_REGEN=1
 * vitest run src/__tests__/catalog-smoke.test.ts` only refreshes this
 * suite's baselines — see commit e43ad48 for the wrapping rationale.
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
import {
  initBrowser,
  closeBrowser,
  ensureBaselineDir,
  regenBaselinesIfRequested,
} from "./setup";
import { catalogId } from "../catalog/helpers";

// Frame 30 = 1 second in — past most entrance staggers, before exit fades.
// Matches templates.test.ts default. Catalog comps don't need motion-extra
// frames (the base templates.test.ts owns that coverage at the template
// level); one mid-animation diff frame is enough to catch drift in the
// variant-specific data path.
const TEST_FRAME = 30;

const BASELINE_DIR = path.resolve(__dirname, "baselines", "catalog-smoke");
const TEMP_DIR = path.resolve(__dirname, ".temp-renders-catalog");

// All catalog variant comps. Each entry is `[template, variant]`; the test
// composes the full id via `catalogId()` so the convention stays in sync
// with src/catalog/helpers.ts (no string drift between test and source).
//
// Maps are skipped (catalog-choropleth-map-*, catalog-route-animation-*) —
// they need MAPBOX_ACCESS_TOKEN at render time, and the Remotion browser
// bundle doesn't reliably inherit env vars; see templates.test.ts
// MAP_COMPOSITIONS rationale for the full skip story.
//
// AtlasPlate is INCLUDED — it renders via d3-geo against local TopoJSON,
// no Mapbox dependency.
const CATALOG_COMPS: ReadonlyArray<readonly [string, string]> = [
  // Cinematic (3) — all use public/assets/sample-historical.png
  ["AnnotatedImage", "callout-demo"],
  ["ImageComposite", "archive"],
  ["PhotoMontage", "treatments"],
  // Data (20)
  ["BayesianUpdate", "venice-floods"],
  ["DataChart", "axelrod-lollipop"],
  ["DataChart", "olympics-small-multiples"],
  ["DataChart", "space-race-comparison"],
  ["DataChart", "speeds-bar"],
  ["PricingWaterfall", "coffee-cup"],
  ["PricingWaterfall", "motion-briefing"],
  ["PricingWaterfall", "motion-documentary"],
  ["PricingWaterfall", "motion-still"],
  ["ProbabilityGauge", "scorecard"],
  ["ProbabilityGauge", "weather"],
  ["RadarChart", "track-specialists"],
  ["SankeyFlow", "plastic-fate"],
  ["StatReveal", "apollo-cost"],
  ["StatReveal", "habitable-land"],
  ["StatReveal", "mariana-depth"],
  ["TimeSeriesChart", "atmospheric-co2"],
  ["TimeSeriesChart", "life-expectancy-slope"],
  ["TimeSeriesChart", "population-small-multiples"],
  ["TimeSeriesChart", "world-population"],
  // Diagrams (7)
  ["DuelingFrameworks", "empire-fall"],
  ["FrameworkDiagram", "comparison"],
  ["FrameworkDiagram", "flow"],
  ["FrameworkDiagram", "matrix"],
  ["NetworkDiagram", "hub-spoke"],
  ["SplitComposition", "maps"],
  ["SplitComposition", "time"],
  // Editorial / showcase / preview (5)
  ["Editorial", "aside"],
  ["Editorial", "hero"],
  ["Editorial", "minimal"],
  ["EmphasisShowcase", "all-six"],
  ["TemplatePreview", "emphasis-grid"],
  // Maps — local-TopoJSON only (1)
  ["AtlasPlate", "cocom"],
  // Scenarios (7)
  ["BifurcationRoute", "latin-romance"],
  ["DecisionTree", "chess-opening"],
  ["DecisionTree", "excomm-ladder"],
  ["GameBoard", "chess-endgame"],
  ["GameBoard", "iterated-pd"],
  ["GameBoard", "pd-canonical"],
  ["GameBoard", "stag-hunt"],
  // Timelines (7)
  ["DualTimeline", "imperial-transitions"],
  ["EscalationLadder", "arms-treaties"],
  ["EscalationLadder", "cold-war"],
  ["HorizontalTimeline", "computers"],
  ["HorizontalTimeline", "pandemics-dual"],
  ["HorizontalTimeline", "revolutions-phase"],
  ["TimelineComparison", "revolutions"],
  ["TimelineMorph", "blockades"],
  // Titles (4)
  ["TitleTransition", "editorial"],
  ["TitleTransition", "end-card"],
  ["TitleTransition", "episode"],
  ["TitleTransition", "section"],
  // Typography (4)
  ["KineticTypography", "bilingual"],
  ["KineticTypography", "definition"],
  ["KineticTypography", "quote"],
  ["KineticTypography", "statistic"],
];

// Catalog comps that need MAPBOX_ACCESS_TOKEN at render time. Excluded from
// CATALOG_COMPS above (not even attempted) — listed here as a sentinel so
// future additions know the skip is intentional. AtlasPlate is NOT in this
// set because it uses local d3-geo + TopoJSON, no Mapbox.
const MAPBOX_SKIPPED_TEMPLATES: ReadonlySet<string> = new Set([
  "ChoroplethMap",
  "RouteAnimation",
]);

// Catalog comp → required asset path (relative to remotion-templates/public).
// Mirrors COMPOSITION_ASSET_DEPS in templates.test.ts; if the asset is
// missing, the test skips with a clear message rather than failing.
const CATALOG_ASSET_DEPS: Record<string, string> = {
  "catalog-image-composite-archive": "assets/sample-historical.png",
  "catalog-photo-montage-treatments": "assets/sample-historical.png",
  "catalog-annotated-image-callout-demo": "assets/sample-historical.png",
};

// Catalog comps that have a known pre-existing rendering bug, NOT caught by
// templates.test.ts (which exercises the base composition with different
// default-props). Each entry must cite the bug — the skip is documentation,
// not a perpetual hiding mechanism.
//
// (Currently empty — the prior entry `catalog-annotated-image-callout-demo`
// was fixed by extracting `resolveAssetSrc` to `src/utils/assetPath.ts` and
// routing AnnotatedImage through it. See the un-skip commit for context.)
const KNOWN_BROKEN_CATALOG_COMPS: Record<string, string> = {};

function getSkipReason(compositionId: string, template: string): string | null {
  if (MAPBOX_SKIPPED_TEMPLATES.has(template)) {
    return "map catalog comps need MAPBOX_ACCESS_TOKEN at render time (see templates.test.ts MAP_COMPOSITIONS for rationale)";
  }
  const knownBroken = KNOWN_BROKEN_CATALOG_COMPS[compositionId];
  if (knownBroken) {
    return `known broken: ${knownBroken}`;
  }
  const asset = CATALOG_ASSET_DEPS[compositionId];
  if (asset) {
    const assetPath = path.resolve(__dirname, "..", "..", "public", asset);
    if (!fs.existsSync(assetPath)) {
      return `required asset missing: public/${asset}`;
    }
  }
  return null;
}

describe("Catalog Smoke Tests", () => {
  const TEST_TIMEOUT = 60000;

  beforeAll(async () => {
    console.log("\n=== Catalog Smoke Test Suite ===\n");
    console.log("[Setup] Initializing browser...");
    await initBrowser();

    console.log("[Setup] Bundling entry point...");
    await initBundler();

    console.log("[Setup] Preparing baseline directory...");
    // Catalog-smoke owns `baselines/catalog-smoke/` exclusively. With
    // BASELINE_REGEN=1, wipe just this subdir; other suites' baselines
    // (root + chart-review/, framework-review/, etc.) are untouched.
    regenBaselinesIfRequested(BASELINE_DIR, { kind: "subdir" });
    ensureBaselineDir(BASELINE_DIR);

    console.log("[Setup] Creating temp directory...");
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    console.log(`[Setup] Ready to render ${CATALOG_COMPS.length} catalog comps\n`);
  }, TEST_TIMEOUT);

  afterAll(async () => {
    console.log("\n[Cleanup] Closing browser...");
    await closeBrowser();
    console.log("[Cleanup] Test suite complete.\n");
  }, TEST_TIMEOUT);

  CATALOG_COMPS.forEach(([template, variant]) => {
    const compositionId = catalogId(template, variant);
    const skipReason = getSkipReason(compositionId, template);
    const testFn = skipReason ? it.skip : it;
    testFn(
      `${compositionId}: frame ${TEST_FRAME} matches baseline${skipReason ? ` (skipped — ${skipReason})` : ""}`,
      async () => {
        const fileName = `${compositionId}-frame-${TEST_FRAME}.png`;
        const currentFile = path.join(TEMP_DIR, fileName);
        const baselineFile = path.join(BASELINE_DIR, fileName);

        // Render current frame
        await renderCompositionFrame(compositionId, TEST_FRAME, currentFile);
        expect(fs.existsSync(currentFile)).toBe(true);
        const currentStats = fs.statSync(currentFile);
        expect(currentStats.size).toBeGreaterThan(0);

        if (!fs.existsSync(baselineFile)) {
          console.log(
            `[Baseline] Creating baseline for ${compositionId} f${TEST_FRAME}...`
          );
          saveBaseline(currentFile, baselineFile);
          console.log(
            `[Result] ${compositionId} f${TEST_FRAME}: BASELINE CREATED (${currentStats.size} bytes)`
          );
        } else {
          const result = comparePNGs(baselineFile, currentFile);
          if (result.match) {
            console.log(
              `[Result] ${compositionId} f${TEST_FRAME}: PASS (${result.diffPixels}/${result.totalPixels} px differ, ${result.diffPct.toFixed(3)}%)`
            );
            expect(true).toBe(true);
          } else {
            console.warn(
              `[Result] ${compositionId} f${TEST_FRAME}: VISUAL REGRESSION ` +
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
