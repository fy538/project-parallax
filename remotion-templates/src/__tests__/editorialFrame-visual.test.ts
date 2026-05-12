/**
 * EditorialFrame visual regression — locks the light/dark mode rendering
 * after the May 11, 2026 mode refactor (commit 74aa787).
 *
 * Why this exists: the catalog-smoke and templates.test.ts suites don't
 * render EditorialFrame compositions, so the May 11 refactor (token-driven
 * colors replacing 14 hardcoded `palette.ink` references) had no
 * pixel-level "light mode unchanged" guarantee. This test closes that gap.
 *
 * Frame choice: 90 — past the kicker rule (0-15), hero entrance (10-30),
 * headline slide (25-50), body fade (45-70), but BEFORE the byline rule
 * starts drawing (100-130). Captures the most editorial-scaffold elements
 * in their settled state without animation-mid-flight noise. Also matches
 * the manual still-render frame in the dossier renders under
 * `design-references/editorial-frame-hero-*.png`.
 *
 * Run:
 *   npx vitest run src/__tests__/editorialFrame-visual.test.ts
 * Regen baselines:
 *   BASELINE_REGEN=1 npx vitest run src/__tests__/editorialFrame-visual.test.ts
 *
 * Baselines live in `baselines/editorial-frame/`.
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

const TEMP_DIR = path.resolve(__dirname, ".temp-renders", "editorial-frame");
const BASELINE_DIR = path.resolve(__dirname, "baselines", "editorial-frame");
const TEST_FRAME = 90;
const TEST_TIMEOUT = 120_000;

const CASES: Array<{ id: string; mode: "light" | "dark"; backdrop: string }> = [
  // Light: existing hero test on cartographic paper.
  { id: "EditorialFrameHeroTest", mode: "light", backdrop: "cartographic" },
  // Dark: new hero-dark test on night-grid (sibling of strategy-grid).
  { id: "EditorialFrameHeroDarkTest", mode: "dark", backdrop: "night-grid" },
];

describe("EditorialFrame visual regression", () => {
  beforeAll(async () => {
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

  for (const { id, mode, backdrop } of CASES) {
    it(
      `${id} (mode=${mode}, backdrop=${backdrop}): frame ${TEST_FRAME} matches baseline`,
      async () => {
        const fileName = `${id}-frame-${TEST_FRAME}.png`;
        const currentFile = path.join(TEMP_DIR, fileName);
        const baselineFile = path.join(BASELINE_DIR, fileName);

        await renderCompositionFrame(id, TEST_FRAME, currentFile);
        expect(fs.existsSync(currentFile), `render did not produce ${fileName}`).toBe(true);

        if (!fs.existsSync(baselineFile)) {
          // First-run: write the baseline. Subsequent runs will diff against it.
          console.log(`[Baseline] Creating baseline for ${id} f${TEST_FRAME}...`);
          saveBaseline(currentFile, baselineFile);
          return;
        }

        const result = comparePNGs(baselineFile, currentFile);
        expect(
          result.match,
          `${id} f${TEST_FRAME} drifted (${result.diffPct.toFixed(3)}% pixels differ, diff at ${result.diffPath})`,
        ).toBe(true);
      },
      TEST_TIMEOUT,
    );
  }
});
