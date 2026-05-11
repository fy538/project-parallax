/**
 * HorizontalTimeline Real-Data QA — targeted render review for active timeline shots.
 *
 * HorizontalTimeline still uses manual overlay geometry for its camera label,
 * era labels, morph title, and episode label. This suite renders the active
 * silicon-trap shot plus a derived long-copy stress variant so we can catch
 * title/overlay crowding and pullback-state drift with real episode content.
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
import type { HorizontalTimelineData } from "../templates/HorizontalTimeline/types";
import oilChipParallel from "../../data/episodes/silicon-trap/horizontal-timeline-oil-chip.json";

const TEST_TIMEOUT = 60000;
const REVIEW_FRAMES = [45, 210, 420];
const BASELINE_DIR = path.resolve(__dirname, "baselines", "timeline-review");
const TEMP_DIR = path.resolve(__dirname, ".temp-renders", "timeline-review");

interface TimelineCase {
  reviewId: string;
  inputProps: { data: HorizontalTimelineData };
  why: string;
}

const baseTimeline = oilChipParallel as HorizontalTimelineData;

const longCopyTimeline: HorizontalTimelineData = {
  ...baseTimeline,
  title: "The Oil-Chip Parallel Across Two Strategic Denial Regimes",
  subtitle:
    "Resource dependence, coordinated restriction, and the forced-decision problem",
  eraATitle: "1940s PACIFIC RESOURCE DENIAL REGIME",
  eraBTitle: "2020s SEMICONDUCTOR CONTAINMENT ARCHITECTURE",
  cameraPath: baseTimeline.cameraPath?.map((step, index) => ({
    ...step,
    label:
      index === 0
        ? "DEPENDENCE STRUCTURE"
        : index === 1
          ? "COORDINATED DENIAL REGIME"
          : index === 2
            ? "MULTILATERAL LOCK-IN"
            : index === 3
              ? "FORCED DECISION WINDOW"
              : step.label,
  })),
};

const TIMELINE_CASES: TimelineCase[] = [
  {
    reviewId: "silicon-trap-oil-chip-parallel",
    inputProps: { data: baseTimeline },
    why: "live dual-mode shot with camera labels, era labels, and pullback connections",
  },
  {
    reviewId: "silicon-trap-oil-chip-parallel-long-copy",
    inputProps: { data: longCopyTimeline },
    why: "derived stress variant for long title, subtitle, era labels, and camera labels",
  },
];

describe("HorizontalTimeline Real-Data QA", () => {
  beforeAll(async () => {
    console.log("\n=== HorizontalTimeline Real-Data QA ===\n");
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

  TIMELINE_CASES.forEach((timelineCase) => {
    REVIEW_FRAMES.forEach((frame) => {
      it(
        `${timelineCase.reviewId}: frame ${frame} matches baseline (${timelineCase.why})`,
        async () => {
          const fileName = `${timelineCase.reviewId}-frame-${frame}.png`;
          const currentFile = path.join(TEMP_DIR, fileName);
          const baselineFile = path.join(BASELINE_DIR, fileName);

          await renderCompositionFrame(
            "HorizontalTimeline",
            frame,
            currentFile,
            timelineCase.inputProps
          );

          expect(fs.existsSync(currentFile)).toBe(true);
          expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

          if (!fs.existsSync(baselineFile)) {
            console.log(
              `[Baseline] Creating timeline baseline for ${timelineCase.reviewId} f${frame}...`
            );
            saveBaseline(currentFile, baselineFile);
            return;
          }

          const result = comparePNGs(baselineFile, currentFile);
          if (!result.match) {
            console.warn(
              `[Timeline QA] ${timelineCase.reviewId} f${frame}: visual regression ` +
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
