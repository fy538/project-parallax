/**
 * AnnotatedImage Real-Data QA — three callout-overlay shots from
 * prisoners-dilemma (Ostrom commons-governance fieldwork photos).
 *
 * Catches: callout placement drift, leader-line geometry regressions,
 * label collision with image content, brand-treatment ramp changes.
 *
 * Why three variants: each annotated-image-* file has different callout
 * density and placement strategies (corners vs edges vs interior). Test
 * one each so a layout regression in any placement mode is caught.
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
import type { AnnotatedImageData } from "../templates/AnnotatedImage/types";

import maine from "../../data/episodes/prisoners-dilemma/annotated-image-maine.json";
import torbel from "../../data/episodes/prisoners-dilemma/annotated-image-torbel.json";
import valencia from "../../data/episodes/prisoners-dilemma/annotated-image-valencia.json";

const TEST_TIMEOUT = 60000;
const REVIEW_FRAMES = [30, 90];
const BASELINE_DIR = path.resolve(__dirname, "baselines", "annotated-image-review");
const TEMP_DIR = path.resolve(__dirname, ".temp-renders", "annotated-image-review");

interface ReviewCase {
  id: string;
  data: AnnotatedImageData;
  why: string;
}

const CASES: ReviewCase[] = [
  {
    id: "prisoners-dilemma-maine-lobster",
    data: maine as unknown as AnnotatedImageData,
    why: "callout-heavy fieldwork shot — exercises label-placement collision avoidance",
  },
  {
    id: "prisoners-dilemma-torbel-pastures",
    data: torbel as unknown as AnnotatedImageData,
    why: "wide-landscape with edge callouts — exercises leader-line geometry",
  },
  {
    id: "prisoners-dilemma-valencia-huerta",
    data: valencia as unknown as AnnotatedImageData,
    why: "interior-placement callouts — exercises in-image label dispersion",
  },
];

describe("AnnotatedImage Real-Data QA", () => {
  beforeAll(async () => {
    console.log("\n=== AnnotatedImage Real-Data QA ===\n");
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

  for (const { id, data, why } of CASES) {
    REVIEW_FRAMES.forEach((frame) => {
      it(
        `${id}: frame ${frame} matches baseline — ${why}`,
        async () => {
          const fileName = `${id}-frame-${frame}.png`;
          const currentFile = path.join(TEMP_DIR, fileName);
          const baselineFile = path.join(BASELINE_DIR, fileName);

          await renderCompositionFrame("AnnotatedImage", frame, currentFile, { data });

          expect(fs.existsSync(currentFile)).toBe(true);
          expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

          if (!fs.existsSync(baselineFile)) {
            console.log(`[Baseline] Creating annotated-image baseline ${id} f${frame}...`);
            saveBaseline(currentFile, baselineFile);
            return;
          }

          const result = comparePNGs(baselineFile, currentFile);
          if (!result.match) {
            console.warn(
              `[AnnotatedImage QA] ${id} f${frame}: visual regression ` +
                `(${result.diffPixels}/${result.totalPixels} px differ, ` +
                `${result.diffPct.toFixed(3)}% > 0.5%). Diff: ${result.diffPath ?? "(not written)"}`,
            );
          }
          expect(result.match).toBe(true);
        },
        TEST_TIMEOUT,
      );
    });
  }
});
