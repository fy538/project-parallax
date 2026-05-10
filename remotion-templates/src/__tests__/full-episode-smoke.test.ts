/**
 * Full Episode Smoke Test — renders key frames of PrisonersDilemmaFull to
 * catch render-time crashes before a full video render is attempted.
 *
 * Validates:
 *   1. The composition can be selected (calculateMetadata resolves)
 *   2. Frame 0 renders successfully (catches template/JSX/import errors)
 *   3. The first FOOTAGE frame renders successfully (catches BrandImage
 *      empty-src errors, OffthreadVideo issues, mid-episode composition bugs)
 *
 * Does NOT pixel-compare against a baseline — the episode composition
 * changes frequently during production. The bar is simply: renders without
 * crashing and produces a non-empty PNG (>10KB).
 *
 * Why both frames:
 *   - Frame 0 is instant and catches missing data files / unknown components.
 *   - The first FOOTAGE frame exercises a different code path: BrandImage
 *     is called with src="" (video-child mode), OffthreadVideo loads a real
 *     clip, and the SVG filter chain is active. This is the frame class that
 *     caused a production render crash (Remotion 4.0.457 strict <Img> validation).
 *
 * Run: npm run test:episode-smoke
 * Expected time: ~25-35 seconds (bundle cached after first run)
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
const MANIFEST_PATH = path.resolve(
  __dirname,
  "../../data/episodes/prisoners-dilemma/assembly-manifest.json"
);
const TEST_TIMEOUT = 180_000; // 3 min — bundle + 2 frames

// ── Manifest-driven frame discovery ──────────────────────────────────────────

/** Find the frame number for the first segment matching a given type. */
function firstSegmentFrame(
  manifest: any,
  type: string,
  offsetFrames = 1
): number | null {
  const seg = (manifest.segments ?? []).find((s: any) => s.type === type);
  if (!seg) return null;
  return Math.round(seg.startSec * manifest.fps) + offsetFrames;
}

const manifest = fs.existsSync(MANIFEST_PATH)
  ? JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"))
  : null;

const firstFootageFrame = manifest
  ? firstSegmentFrame(manifest, "FOOTAGE")
  : null;

// ── Test suite ────────────────────────────────────────────────────────────────

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
    `${COMPOSITION_ID}: frame 0 renders to a non-empty PNG (> 10KB)`,
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
      ).toBeGreaterThan(10_000); // 10KB minimum (TitleTransition may be sparse)
    },
    TEST_TIMEOUT,
  );

  it(
    `${COMPOSITION_ID}: first FOOTAGE frame renders without crashing`,
    async () => {
      if (firstFootageFrame === null) {
        console.warn(
          "[Smoke] No FOOTAGE segment found in manifest — skipping FOOTAGE frame test"
        );
        return; // Not a failure — episode may have no footage yet
      }

      const outPath = path.join(
        TEMP_DIR,
        `${COMPOSITION_ID}-frame-${firstFootageFrame}.png`
      );

      // This frame exercises:
      //   - BrandImage with src="" (video-child mode, grain+vignette only)
      //   - OffthreadVideo loading a real clip
      //   - The SVG filter chain for mid-episode background segments
      //
      // Previously crashed with: 'No "src" prop was passed' (Remotion 4.0.457)
      // Fixed by: {src && <Img .../>} guard in BrandImage.tsx
      await renderCompositionFrame(COMPOSITION_ID, firstFootageFrame, outPath);

      expect(fs.existsSync(outPath), "output PNG was not created").toBe(true);

      const { size } = fs.statSync(outPath);
      expect(
        size,
        `PNG too small (${size} bytes) — likely a blank/crashed render`
      ).toBeGreaterThan(10_000);
    },
    TEST_TIMEOUT,
  );
});
