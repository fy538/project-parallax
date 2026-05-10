/**
 * Full Episode Smoke Test — validates PrisonersDilemmaFull renders frame 0
 * without crashing. Does NOT pixel-compare against a baseline (the episode
 * composition changes frequently during production); just confirms:
 *
 *   1. The composition can be selected (calculateMetadata resolves)
 *   2. Frame 0 renders to a non-empty PNG
 *   3. The file is > 100KB (not a blank/crashed render)
 *
 * Why frame 0 only: mid-episode frames take 3-5× longer to render due to
 * Remotion seeking through footage. Frame 0 is instant and catches:
 *   - Missing TEMPLATE_DATA entries (renders ⚠️ placeholder at frame 0)
 *   - Unknown component names (renders null at frame 0)
 *   - TypeScript/JSX errors in the composition tree
 *   - calculateMetadata crashes (test fails before render)
 *
 * Run: npm run test:episode-smoke
 * Expected time: ~15 seconds (bundle is cached from prior run)
 */

import { describe, it, beforeAll, afterAll, expect } from "vitest";
import path from "path";
import fs from "fs";
import {
  initBundler,
  renderCompositionFrame,
} from "./render-helper";
import { initBrowser, closeBrowser } from "./setup";

const TEMP_DIR = path.resolve(__dirname, ".temp-renders", "full-episode");
const COMPOSITION_ID = "prisoners-dilemma-full";
const TEST_TIMEOUT = 120_000; // 2 min — bundle + render

describe("Full Episode Smoke Test", () => {
  beforeAll(async () => {
    await initBrowser();
    await initBundler();
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await closeBrowser();
  }, TEST_TIMEOUT);

  it(
    `${COMPOSITION_ID}: frame 0 renders to a non-empty PNG (> 100KB)`,
    async () => {
      const outPath = path.join(TEMP_DIR, `${COMPOSITION_ID}-frame-0.png`);

      // Will throw if: composition not found, calculateMetadata crashes,
      // or any hard render error (malformed JSX, missing React import, etc.)
      await renderCompositionFrame(COMPOSITION_ID, 0, outPath);

      expect(fs.existsSync(outPath), "output PNG was not created").toBe(true);

      const { size } = fs.statSync(outPath);
      expect(
        size,
        `PNG too small (${size} bytes) — likely a blank/crashed render`
      ).toBeGreaterThan(100_000); // 100KB minimum
    },
    TEST_TIMEOUT,
  );
});
