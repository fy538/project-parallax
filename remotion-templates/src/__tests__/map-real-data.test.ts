/**
 * Map Templates Real-Data QA — ChoroplethMap + RouteAnimation
 *
 * Both templates call assertMapboxToken() at render time, so this suite skips
 * automatically when MAPBOX_ACCESS_TOKEN is not set (the same behaviour as the
 * Mapbox gate in episode-integrity.test.ts). Set the token locally to run:
 *
 *   MAPBOX_ACCESS_TOKEN=pk.... npx vitest run src/__tests__/map-real-data.test.ts
 *
 * Pattern mirrors framework-diagram-real-data.test.ts and
 * kinetic-typography-real-data.test.ts: render a key frame → compare against a
 * committed baseline PNG. First run creates baselines; subsequent runs detect drift.
 * To regenerate a single baseline: delete its PNG and re-run.
 *
 * ── WHY THESE CASES ─────────────────────────────────────────────────────────
 *
 * ChoroplethMap:
 *   1. prisoners-dilemma/choropleth-ostrom  — dark bg, 3-phase progressive reveal
 *      (single fill color then multi-color expansion). The only pd-map shot; tests
 *      phase-driven animation, country-label positioning, center/scale camera.
 *   2. silicon-trap/choropleth-caught-between — large set of countries across two
 *      fill groups; tests multi-country phase density + iso3 resolution.
 *   3. silicon-trap/choropleth-cocom  — COCOM membership (17 countries); tests
 *      dense label suppression and historical phase progression.
 *
 * RouteAnimation:
 *   4. silicon-trap/route-chip-supply  — 6 points + 5 segments, phased reveal,
 *      point labels with sublabels, multiple routeColors; the densest case.
 *   5. silicon-trap/route-bifurcation  — 7 points + 6 segments including a dashed
 *      "caught-between" edge; tests dashed-segment render path.
 *
 * ── FRAMES ───────────────────────────────────────────────────────────────────
 *
 * Frame 30 (1 s): first phase fully revealed — catches initial camera, label
 * positioning, and fill rendering.
 * Frame 90 (3 s): mid-composition — verifies phase transition and map pan.
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
import type { ChoroplethMapData } from "../templates/ChoroplethMap/types";
import type { RouteAnimationData } from "../templates/RouteAnimation/types";

// ── Guard ─────────────────────────────────────────────────────────────────────

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN ?? "";
const HAS_TOKEN = MAPBOX_TOKEN.startsWith("pk.");

// ── Data imports ──────────────────────────────────────────────────────────────

import choroplethOstrom       from "../../data/episodes/prisoners-dilemma/choropleth-ostrom.json";
import choroplethCaughtBetween from "../../data/episodes/silicon-trap/choropleth-caught-between.json";
import choroplethCocom        from "../../data/episodes/silicon-trap/choropleth-cocom.json";
import routeChipSupply        from "../../data/episodes/silicon-trap/route-chip-supply.json";
import routeBifurcation       from "../../data/episodes/silicon-trap/route-bifurcation.json";

// ── Config ────────────────────────────────────────────────────────────────────

const TEST_TIMEOUT  = 90_000;  // map tiles fetched over network — allow more time
const REVIEW_FRAMES = [30, 90];
const BASELINE_DIR  = path.resolve(__dirname, "baselines", "map-review");
const TEMP_DIR      = path.resolve(__dirname, ".temp-renders", "map-review");

// ── Case types ────────────────────────────────────────────────────────────────

interface ChoroplethCase {
  reviewId: string;
  inputProps: { data: ChoroplethMapData };
  why: string;
}

interface RouteCase {
  reviewId: string;
  inputProps: { data: RouteAnimationData };
  why: string;
}

// ── Cases ─────────────────────────────────────────────────────────────────────

const CHOROPLETH_CASES: ChoroplethCase[] = [
  {
    reviewId: "pd-choropleth-ostrom",
    inputProps: { data: choroplethOstrom as ChoroplethMapData },
    why: "dark bg, 3-phase progressive reveal, single→multi color, camera pan",
  },
  {
    reviewId: "st-choropleth-caught-between",
    inputProps: { data: choroplethCaughtBetween as ChoroplethMapData },
    why: "two fill groups, dense multi-country phase, iso3 resolution stress",
  },
  {
    reviewId: "st-choropleth-cocom",
    inputProps: { data: choroplethCocom as ChoroplethMapData },
    why: "COCOM 17-member phase — label suppression + historical progression",
  },
];

const ROUTE_CASES: RouteCase[] = [
  {
    reviewId: "st-route-chip-supply",
    inputProps: { data: routeChipSupply as RouteAnimationData },
    why: "6 points, 5 phased segments, sublabels, densest route case",
  },
  {
    reviewId: "st-route-bifurcation",
    inputProps: { data: routeBifurcation as RouteAnimationData },
    why: "dashed segment edge — tests dashed render path + two-cluster layout",
  },
];

// ── Suite ─────────────────────────────────────────────────────────────────────

describe("Map Templates Real-Data QA", () => {
  if (!HAS_TOKEN) {
    it.skip(
      "MAPBOX_ACCESS_TOKEN not set — skipping map render QA " +
        "(set MAPBOX_ACCESS_TOKEN=pk.... to run locally)",
      () => {}
    );
    return;
  }

  beforeAll(async () => {
    console.log("\n=== Map Templates Real-Data QA ===");
    console.log(`Token present: ${MAPBOX_TOKEN.slice(0, 8)}...\n`);
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

  // ── ChoroplethMap ──────────────────────────────────────────────────────────

  describe("ChoroplethMap", () => {
    CHOROPLETH_CASES.forEach((c) => {
      REVIEW_FRAMES.forEach((frame) => {
        it(
          `${c.reviewId}: frame ${frame} matches baseline (${c.why})`,
          async () => {
            const fileName     = `${c.reviewId}-frame-${frame}.png`;
            const currentFile  = path.join(TEMP_DIR, fileName);
            const baselineFile = path.join(BASELINE_DIR, fileName);

            await renderCompositionFrame(
              "ChoroplethMap",
              frame,
              currentFile,
              c.inputProps
            );

            expect(fs.existsSync(currentFile)).toBe(true);
            expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

            if (!fs.existsSync(baselineFile)) {
              console.log(
                `[Baseline] Creating choropleth baseline for ${c.reviewId} f${frame}...`
              );
              saveBaseline(currentFile, baselineFile);
              return;
            }

            const result = comparePNGs(baselineFile, currentFile);
            if (!result.match) {
              console.warn(
                `[Map QA] ${c.reviewId} f${frame}: visual regression ` +
                  `(${result.diffPixels}/${result.totalPixels} px differ, ` +
                  `${result.diffPct.toFixed(3)}% > 0.5%). ` +
                  `Diff: ${result.diffPath ?? "(not written)"}`
              );
            }
            expect(result.match).toBe(true);
          },
          TEST_TIMEOUT
        );
      });
    });
  });

  // ── RouteAnimation ─────────────────────────────────────────────────────────

  describe("RouteAnimation", () => {
    ROUTE_CASES.forEach((c) => {
      REVIEW_FRAMES.forEach((frame) => {
        it(
          `${c.reviewId}: frame ${frame} matches baseline (${c.why})`,
          async () => {
            const fileName     = `${c.reviewId}-frame-${frame}.png`;
            const currentFile  = path.join(TEMP_DIR, fileName);
            const baselineFile = path.join(BASELINE_DIR, fileName);

            await renderCompositionFrame(
              "RouteAnimation",
              frame,
              currentFile,
              c.inputProps
            );

            expect(fs.existsSync(currentFile)).toBe(true);
            expect(fs.statSync(currentFile).size).toBeGreaterThan(0);

            if (!fs.existsSync(baselineFile)) {
              console.log(
                `[Baseline] Creating route baseline for ${c.reviewId} f${frame}...`
              );
              saveBaseline(currentFile, baselineFile);
              return;
            }

            const result = comparePNGs(baselineFile, currentFile);
            if (!result.match) {
              console.warn(
                `[Map QA] ${c.reviewId} f${frame}: visual regression ` +
                  `(${result.diffPixels}/${result.totalPixels} px differ, ` +
                  `${result.diffPct.toFixed(3)}% > 0.5%). ` +
                  `Diff: ${result.diffPath ?? "(not written)"}`
              );
            }
            expect(result.match).toBe(true);
          },
          TEST_TIMEOUT
        );
      });
    });
  });
});
