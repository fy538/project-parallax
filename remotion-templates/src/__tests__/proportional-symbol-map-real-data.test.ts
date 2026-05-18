/**
 * ProportionalSymbolMap Real-Data QA — Ostrom case-study geography.
 *
 * The proportional-symbol-ostrom shot places sized circles at the
 * geographic centroids of Ostrom's 8+ commons case studies (Maine
 * lobster, Torbel pastures, Valencia huerta, etc.) on an orthographic
 * world map. Catches: marker-scale regressions, projection drift,
 * footer-slot rendering, MapTitleFrame placement.
 *
 * Added: May 18, 2026 (tier 7 — closing the audit's #19 real-data-test gap
 * for templates that ARE used in episode manifests).
 *
 * Skipped without MAPBOX_ACCESS_TOKEN (matches map-real-data convention) —
 * the underlying MapGL component fetches Mapbox vector tiles via the
 * public token.
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
import type { ProportionalSymbolMapData } from "../templates/ProportionalSymbolMap/types";

import ostrom from "../../data/episodes/prisoners-dilemma/proportional-symbol-ostrom.json";

const TEST_TIMEOUT = 60000;
const REVIEW_FRAMES = [30, 90];
const BASELINE_DIR = path.resolve(__dirname, "baselines", "proportional-symbol-map-review");
const TEMP_DIR = path.resolve(__dirname, ".temp-renders", "proportional-symbol-map-review");

const REVIEW_ID = "prisoners-dilemma-ostrom-cases";
const INPUT_PROPS: { data: ProportionalSymbolMapData } = {
  data: ostrom as unknown as ProportionalSymbolMapData,
};

// Mapbox-backed maps skip without a public token (`pk.*` prefix).
const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || "";
const SKIP_REASON =
  MAPBOX_TOKEN.startsWith("pk.")
    ? null
    : "MAPBOX_ACCESS_TOKEN not set (or not a pk.* public token) — see remotion-templates/.env.example";

describe.skipIf(SKIP_REASON !== null)("ProportionalSymbolMap Real-Data QA", () => {
  beforeAll(async () => {
    console.log("\n=== ProportionalSymbolMap Real-Data QA ===\n");
    if (SKIP_REASON) {
      console.log(`  SKIPPED: ${SKIP_REASON}`);
      return;
    }
    await initBrowser();
    await initBundler();
    regenBaselinesIfRequested(BASELINE_DIR, { kind: "subdir" });
    ensureBaselineDir(BASELINE_DIR);
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    if (!SKIP_REASON) {
      await closeBrowser();
    }
  }, TEST_TIMEOUT);

  REVIEW_FRAMES.forEach((frame) => {
    it(
      `${REVIEW_ID}: frame ${frame} matches baseline — orthographic projection, sized circles at case-study centroids`,
      async () => {
        const fileName = `${REVIEW_ID}-frame-${frame}.png`;
        const currentFile = path.join(TEMP_DIR, fileName);
        const baselineFile = path.join(BASELINE_DIR, fileName);

        await renderCompositionFrame("ProportionalSymbolMap", frame, currentFile, INPUT_PROPS);

        expect(fs.existsSync(currentFile)).toBe(true);
        expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

        if (!fs.existsSync(baselineFile)) {
          console.log(`[Baseline] Creating proportional-symbol-map baseline f${frame}...`);
          saveBaseline(currentFile, baselineFile);
          return;
        }

        const result = comparePNGs(baselineFile, currentFile);
        if (!result.match) {
          console.warn(
            `[ProportionalSymbolMap QA] f${frame}: visual regression ` +
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
