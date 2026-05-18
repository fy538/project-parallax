/**
 * ArcDiagram Real-Data QA — Prisoners-Dilemma intellectual lineage.
 *
 * The arc-pd-lineage shot traces 8 figures (Hobbes → Hardin → Ostrom)
 * connected by intellectual influence arcs. Catches: arc-curve geometry
 * regressions, node-importance hierarchy drift, era-band rendering,
 * axis baseline placement.
 *
 * Added: May 18, 2026 (tier 7 — closing the audit's #19 real-data-test gap
 * for templates that ARE used in episode manifests).
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
import type { ArcDiagramData } from "../templates/ArcDiagram/types";

import pdLineage from "../../data/episodes/prisoners-dilemma/arc-pd-lineage.json";

const TEST_TIMEOUT = 60000;
const REVIEW_FRAMES = [30, 90, 180];
const BASELINE_DIR = path.resolve(__dirname, "baselines", "arc-diagram-review");
const TEMP_DIR = path.resolve(__dirname, ".temp-renders", "arc-diagram-review");

const REVIEW_ID = "prisoners-dilemma-pd-lineage";
const INPUT_PROPS: { data: ArcDiagramData } = {
  data: pdLineage as unknown as ArcDiagramData,
};

describe("ArcDiagram Real-Data QA", () => {
  beforeAll(async () => {
    console.log("\n=== ArcDiagram Real-Data QA ===\n");
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
      `${REVIEW_ID}: frame ${frame} matches baseline — 8-node intellectual-lineage arcs`,
      async () => {
        const fileName = `${REVIEW_ID}-frame-${frame}.png`;
        const currentFile = path.join(TEMP_DIR, fileName);
        const baselineFile = path.join(BASELINE_DIR, fileName);

        await renderCompositionFrame("ArcDiagram", frame, currentFile, INPUT_PROPS);

        expect(fs.existsSync(currentFile)).toBe(true);
        expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

        if (!fs.existsSync(baselineFile)) {
          console.log(`[Baseline] Creating arc-diagram baseline f${frame}...`);
          saveBaseline(currentFile, baselineFile);
          return;
        }

        const result = comparePNGs(baselineFile, currentFile);
        if (!result.match) {
          console.warn(
            `[ArcDiagram QA] f${frame}: visual regression ` +
              `(${result.diffPixels}/${result.totalPixels} px differ, ` +
              `${result.diffPct.toFixed(3)}% > 0.5%). Diff: ${result.diffPath ?? "(not written)"}`,
          );
        }
        expect(result.match).toBe(true);
      },
      TEST_TIMEOUT,
    );
  });
});
