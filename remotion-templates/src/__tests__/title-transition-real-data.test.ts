/**
 * TitleTransition Real-Data QA — manifest-complete for both launch episodes.
 *
 * Every TitleTransition dataFile referenced in silicon-trap / prisoners-dilemma
 * assembly manifests is rendered here at stable frames vs baseline PNGs.
 *
 * Shot durations vary: section dividers use durationSec 2 (60 frames → last
 * index 59), so frame 60 would clamp/fail — those cases use [20, 45]. Episode
 * and end-card shots use durationSec ≥5 → [30, 60].
 *
 * Pattern mirrors framework-diagram-real-data.test.ts: render → baseline compare.
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
import type { TitleTransitionData } from "../templates/TitleTransition/types";

import titleSectionDenial from "../../data/episodes/silicon-trap/title-section-denial.json";
import titleSectionTrap   from "../../data/episodes/silicon-trap/title-section-trap.json";
import titleSectionChips  from "../../data/episodes/silicon-trap/title-section-chips.json";
import titleEndcard       from "../../data/episodes/silicon-trap/title-endcard.json";

import pdTitleEpisode   from "../../data/episodes/prisoners-dilemma/title-episode.json";
import pdSectionBeat2   from "../../data/episodes/prisoners-dilemma/title-section-beat2.json";
import pdSectionBeat3   from "../../data/episodes/prisoners-dilemma/title-section-beat3.json";
import pdSectionBeat4   from "../../data/episodes/prisoners-dilemma/title-section-beat4.json";
import pdSectionBeat5   from "../../data/episodes/prisoners-dilemma/title-section-beat5.json";
import pdTitleEndCard   from "../../data/episodes/prisoners-dilemma/title-end-card.json";

const TEST_TIMEOUT = 60000;
/** Frames for durations long enough that index 60 is in-range (episode / end cards). */
const REVIEW_FRAMES_LONG = [30, 60];
/** Section dividers: durationSec 2 → composition length 60 frames (0..59). */
const REVIEW_FRAMES_SHORT = [20, 45];
const BASELINE_DIR = path.resolve(__dirname, "baselines", "title-transition-review");
const TEMP_DIR     = path.resolve(__dirname, ".temp-renders", "title-transition-review");

interface TitleTransitionCase {
  reviewId: string;
  inputProps: { data: TitleTransitionData };
  why: string;
  frames: readonly number[];
}

const TITLE_CASES: TitleTransitionCase[] = [
  {
    reviewId: "silicon-trap-title-section-denial",
    inputProps: { data: titleSectionDenial as unknown as TitleTransitionData },
    why: "section divider — denial (manifest)",
    frames: REVIEW_FRAMES_SHORT,
  },
  {
    reviewId: "silicon-trap-title-section-trap",
    inputProps: { data: titleSectionTrap as unknown as TitleTransitionData },
    why: "section divider — trap (manifest)",
    frames: REVIEW_FRAMES_SHORT,
  },
  {
    reviewId: "silicon-trap-title-section-chips",
    inputProps: { data: titleSectionChips as unknown as TitleTransitionData },
    why: "section divider — chips (manifest)",
    frames: REVIEW_FRAMES_SHORT,
  },
  {
    reviewId: "silicon-trap-title-endcard",
    inputProps: { data: titleEndcard as unknown as TitleTransitionData },
    why: "end-card, dark bg — existing baseline pair",
    frames: REVIEW_FRAMES_LONG,
  },
  {
    reviewId: "prisoners-dilemma-title-episode",
    inputProps: { data: pdTitleEpisode as unknown as TitleTransitionData },
    why: "episode title (manifest)",
    frames: REVIEW_FRAMES_LONG,
  },
  {
    reviewId: "prisoners-dilemma-title-section-beat2",
    inputProps: { data: pdSectionBeat2 as unknown as TitleTransitionData },
    why: "section beat 2 divider (manifest)",
    frames: REVIEW_FRAMES_SHORT,
  },
  {
    reviewId: "prisoners-dilemma-title-section-beat3",
    inputProps: { data: pdSectionBeat3 as unknown as TitleTransitionData },
    why: "section beat 3 divider (manifest)",
    frames: REVIEW_FRAMES_SHORT,
  },
  {
    reviewId: "prisoners-dilemma-title-section-beat4",
    inputProps: { data: pdSectionBeat4 as unknown as TitleTransitionData },
    why: "section beat 4 divider (manifest)",
    frames: REVIEW_FRAMES_SHORT,
  },
  {
    reviewId: "prisoners-dilemma-title-section-beat5",
    inputProps: { data: pdSectionBeat5 as unknown as TitleTransitionData },
    why: "section beat 5 divider (manifest)",
    frames: REVIEW_FRAMES_SHORT,
  },
  {
    reviewId: "prisoners-dilemma-title-end-card",
    inputProps: { data: pdTitleEndCard as unknown as TitleTransitionData },
    why: "end-card (manifest)",
    frames: REVIEW_FRAMES_LONG,
  },
];

describe("TitleTransition Real-Data QA", () => {
  beforeAll(async () => {
    console.log("\n=== TitleTransition Real-Data QA ===\n");
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

  TITLE_CASES.forEach((titleCase) => {
    titleCase.frames.forEach((frame) => {
      it(
        `${titleCase.reviewId}: frame ${frame} matches baseline (${titleCase.why})`,
        async () => {
          const fileName = `${titleCase.reviewId}-frame-${frame}.png`;
          const currentFile = path.join(TEMP_DIR, fileName);
          const baselineFile = path.join(BASELINE_DIR, fileName);

          await renderCompositionFrame("TitleTransition", frame, currentFile, titleCase.inputProps);

          expect(fs.existsSync(currentFile)).toBe(true);
          expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

          if (!fs.existsSync(baselineFile)) {
            console.log(`[Baseline] Creating title-transition baseline for ${titleCase.reviewId} f${frame}...`);
            saveBaseline(currentFile, baselineFile);
            return;
          }

          const result = comparePNGs(baselineFile, currentFile);
          if (!result.match) {
            console.warn(
              `[TitleTransition QA] ${titleCase.reviewId} f${frame}: visual regression ` +
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
