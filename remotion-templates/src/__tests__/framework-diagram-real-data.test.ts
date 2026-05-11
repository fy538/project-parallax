/**
 * FrameworkDiagram Real-Data QA — targeted render review for active episode shots.
 *
 * FrameworkDiagram is used 11 times across both launch episodes (2 in
 * silicon-trap, 9 in prisoners-dilemma). It has three structurally distinct
 * variants — comparison (side-by-side columns), flow (sequential nodes), and
 * matrix (2×2 grid) — each with different layout paths. The smoke test covers
 * frame 30 with synthetic data; this suite uses real episode JSON to catch
 * the failure modes that matter in review:
 *   - column count density (comparison: 2 vs 3 columns)
 *   - flow depth (number of nodes, label overflow)
 *   - matrix cell highlighting (active vs neutral state)
 *   - variant-specific layout anchoring
 *
 * Pattern mirrors kinetic-typography-real-data.test.ts: render frame → compare
 * against baseline PNG. Baselines created on first run; must be committed.
 * To regenerate a baseline: delete the PNG and re-run.
 *
 * CASES:
 *   1. silicon-trap/framework-cocom-china     — comparison, 2 columns, dark bg
 *   2. silicon-trap/framework-kirin-teardown  — comparison, 2 columns, different density
 *   3. prisoners-dilemma/framework-narrowing  — flow variant (4 nodes)
 *   4. prisoners-dilemma/framework-standard-frame — matrix variant (2×2 highlight)
 *   5. prisoners-dilemma/framework-ostrom-vs-pd   — comparison, 2 columns, prisoners-dilemma
 *   6. prisoners-dilemma/framework-cycle-vs-question — comparison (manifest)
 *   7. prisoners-dilemma/framework-falsification — flow variant (manifest)
 *   8–10. prisoners-dilemma/framework-motif-beat3/beat5/final — comparison motif beats
 *   11. prisoners-dilemma/framework-reframe — comparison (manifest)
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
import type { FrameworkDiagramData } from "../templates/FrameworkDiagram/types";

import frameworkCocomChina    from "../../data/episodes/silicon-trap/framework-cocom-china.json";
import frameworkKirinTeardown from "../../data/episodes/silicon-trap/framework-kirin-teardown.json";
import frameworkNarrowing       from "../../data/episodes/prisoners-dilemma/framework-narrowing.json";
import frameworkStandardFrame   from "../../data/episodes/prisoners-dilemma/framework-standard-frame.json";
import frameworkOstromVsPd      from "../../data/episodes/prisoners-dilemma/framework-ostrom-vs-pd.json";
import frameworkCycleVsQuestion from "../../data/episodes/prisoners-dilemma/framework-cycle-vs-question.json";
import frameworkFalsification   from "../../data/episodes/prisoners-dilemma/framework-falsification.json";
import frameworkMotifBeat3      from "../../data/episodes/prisoners-dilemma/framework-motif-beat3.json";
import frameworkMotifBeat5      from "../../data/episodes/prisoners-dilemma/framework-motif-beat5.json";
import frameworkMotifFinal      from "../../data/episodes/prisoners-dilemma/framework-motif-final.json";
import frameworkReframe         from "../../data/episodes/prisoners-dilemma/framework-reframe.json";

const TEST_TIMEOUT   = 60000;
const REVIEW_FRAMES  = [30, 60];
const BASELINE_DIR   = path.resolve(__dirname, "baselines", "framework-review");
const TEMP_DIR       = path.resolve(__dirname, ".temp-renders", "framework-review");

interface FrameworkCase {
  reviewId: string;
  inputProps: { data: FrameworkDiagramData };
  why: string;
}

const FRAMEWORK_CASES: FrameworkCase[] = [
  {
    reviewId: "silicon-trap-framework-cocom-china",
    inputProps: { data: frameworkCocomChina as FrameworkDiagramData },
    why: "comparison, 2 columns — USSR vs China strategic contrast, dark bg",
  },
  {
    reviewId: "silicon-trap-framework-kirin-teardown",
    inputProps: { data: frameworkKirinTeardown as FrameworkDiagramData },
    why: "comparison, 2 columns — chip teardown comparison, density stress",
  },
  {
    reviewId: "prisoners-dilemma-framework-narrowing",
    inputProps: { data: frameworkNarrowing as FrameworkDiagramData },
    why: "flow variant — sequential node chain, label overflow pressure",
  },
  {
    reviewId: "prisoners-dilemma-framework-standard-frame",
    inputProps: { data: frameworkStandardFrame as FrameworkDiagramData },
    why: "matrix variant — 2×2 PD payoff grid with cell highlighting",
  },
  {
    reviewId: "prisoners-dilemma-framework-ostrom-vs-pd",
    inputProps: { data: frameworkOstromVsPd as FrameworkDiagramData },
    why: "comparison, 2 columns — Ostrom vs PD framing, max tenet density",
  },
  {
    reviewId: "prisoners-dilemma-framework-cycle-vs-question",
    inputProps: { data: frameworkCycleVsQuestion as FrameworkDiagramData },
    why: "comparison — default vs question columns (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-framework-falsification",
    inputProps: { data: frameworkFalsification as FrameworkDiagramData },
    why: "flow variant — falsification / what would change my mind (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-framework-motif-beat3",
    inputProps: { data: frameworkMotifBeat3 as FrameworkDiagramData },
    why: "comparison — model everywhere motif beat (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-framework-motif-beat5",
    inputProps: { data: frameworkMotifBeat5 as FrameworkDiagramData },
    why: "comparison — same game everywhere motif (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-framework-motif-final",
    inputProps: { data: frameworkMotifFinal as FrameworkDiagramData },
    why: "comparison — cooperative equilibrium motif final (manifest)",
  },
  {
    reviewId: "prisoners-dilemma-framework-reframe",
    inputProps: { data: frameworkReframe as FrameworkDiagramData },
    why: "comparison — reframe columns (manifest)",
  },
];

describe("FrameworkDiagram Real-Data QA", () => {
  beforeAll(async () => {
    console.log("\n=== FrameworkDiagram Real-Data QA ===\n");
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

  FRAMEWORK_CASES.forEach((fCase) => {
    REVIEW_FRAMES.forEach((frame) => {
      it(
        `${fCase.reviewId}: frame ${frame} matches baseline (${fCase.why})`,
        async () => {
          const fileName     = `${fCase.reviewId}-frame-${frame}.png`;
          const currentFile  = path.join(TEMP_DIR, fileName);
          const baselineFile = path.join(BASELINE_DIR, fileName);

          await renderCompositionFrame(
            "FrameworkDiagram",
            frame,
            currentFile,
            fCase.inputProps
          );

          expect(fs.existsSync(currentFile)).toBe(true);
          expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

          if (!fs.existsSync(baselineFile)) {
            console.log(
              `[Baseline] Creating framework baseline for ${fCase.reviewId} f${frame}...`
            );
            saveBaseline(currentFile, baselineFile);
            return;
          }

          const result = comparePNGs(baselineFile, currentFile);
          if (!result.match) {
            console.warn(
              `[Framework QA] ${fCase.reviewId} f${frame}: visual regression ` +
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
