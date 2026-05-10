/**
 * Chart Real-Data QA — targeted render review for active episode chart shots.
 *
 * This suite renders representative DataChart + TimeSeriesChart frames using
 * the actual JSON files from silicon-trap and prisoners-dilemma, not just the
 * generic composition defaults. The goal is to catch the failures that keep
 * showing up in review: title/content crowding, stacked source/context issues,
 * legend pressure, and long-label centering drift.
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
import type { DataChartData } from "../templates/DataChart/types";
import type { TimeSeriesChartData } from "../templates/TimeSeriesChart/types";
import lithographyGap from "../../data/episodes/silicon-trap/chart-lithography.json";
import chipsActPipeline from "../../data/episodes/silicon-trap/chart-chips-act.json";
import usChipDemand from "../../data/episodes/silicon-trap/chart-7pct-demand.json";
import smicYieldTrajectory from "../../data/episodes/silicon-trap/timeseries-smic-yield.json";
import pdDiffusion from "../../data/episodes/prisoners-dilemma/chart-diffusion.json";
import volSmile from "../../data/episodes/prisoners-dilemma/chart-vol-smile.json";

const TEST_TIMEOUT = 60000;
const CHART_REVIEW_FRAMES = [30, 60];
const BASELINE_DIR = path.resolve(__dirname, "baselines", "chart-review");
const TEMP_DIR = path.resolve(__dirname, ".temp-renders", "chart-review");

interface ChartCase {
  reviewId: string;
  compositionId: "DataChart" | "TimeSeriesChart";
  inputProps: {
    data: DataChartData | TimeSeriesChartData;
  };
  why: string;
}

const CHART_CASES: ChartCase[] = [
  {
    reviewId: "silicon-trap-lithography-gap",
    compositionId: "DataChart",
    inputProps: { data: lithographyGap as DataChartData },
    why: "comparison legend + context note pressure",
  },
  {
    reviewId: "silicon-trap-chips-act-pipeline",
    compositionId: "DataChart",
    inputProps: { data: chipsActPipeline as DataChartData },
    why: "source + context note stacking under bar chart",
  },
  {
    reviewId: "silicon-trap-chip-demand-share",
    compositionId: "DataChart",
    inputProps: { data: usChipDemand as DataChartData },
    why: "long bar labels + narrow two-bar spacing",
  },
  {
    reviewId: "prisoners-dilemma-diffusion",
    compositionId: "DataChart",
    inputProps: { data: pdDiffusion as DataChartData },
    why: "dense five-bar labels + source row",
  },
  {
    reviewId: "silicon-trap-smic-yield",
    compositionId: "TimeSeriesChart",
    inputProps: { data: smicYieldTrajectory as TimeSeriesChartData },
    why: "hero stat + annotation + source on single-line chart",
  },
  {
    reviewId: "prisoners-dilemma-vol-smile",
    compositionId: "TimeSeriesChart",
    inputProps: { data: volSmile as TimeSeriesChartData },
    why: "multi-line legend + annotation + era bands + hero stat",
  },
];

describe("Chart Real-Data QA", () => {
  beforeAll(async () => {
    console.log("\n=== Chart Real-Data QA ===\n");
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

  CHART_CASES.forEach((chartCase) => {
    CHART_REVIEW_FRAMES.forEach((frame) => {
      it(
        `${chartCase.reviewId}: frame ${frame} matches baseline (${chartCase.why})`,
        async () => {
          const fileName = `${chartCase.reviewId}-frame-${frame}.png`;
          const currentFile = path.join(TEMP_DIR, fileName);
          const baselineFile = path.join(BASELINE_DIR, fileName);

          await renderCompositionFrame(
            chartCase.compositionId,
            frame,
            currentFile,
            chartCase.inputProps
          );

          expect(fs.existsSync(currentFile)).toBe(true);
          expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

          if (!fs.existsSync(baselineFile)) {
            console.log(
              `[Baseline] Creating chart baseline for ${chartCase.reviewId} f${frame}...`
            );
            saveBaseline(currentFile, baselineFile);
            return;
          }

          const result = comparePNGs(baselineFile, currentFile);
          if (!result.match) {
            console.warn(
              `[Chart QA] ${chartCase.reviewId} f${frame}: visual regression ` +
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
