/**
 * FilmOverlay Cascade Integration Test
 *
 * Proves that the per-segment FilmOverlay cascade resolves correctly when
 * rendered end-to-end through FullEpisode.tsx — that is, the manifest →
 * SegmentFilmOverlay → resolveFilmOverlay → <FilmOverlay> wiring actually
 * produces visually different output for different cascade-resolved presets.
 *
 * Composition under test: "film-overlay-cascade-test"
 * (registered in Root.tsx, defined in
 *  src/templates/Episodes/FilmOverlayCascadeTestComp.tsx)
 *
 * Manifest structure (6 s, 30 fps = 180 frames):
 *   frame 45  (t = 1.5 s)  →  seg-clean:   episode default "clean"
 *                                           effects: ["grain"], intensity 0.3
 *                                           → NO vignette
 *   frame 135 (t = 4.5 s)  →  seg-dramatic: segment override "dramatic" @ 0.8
 *                                           effects: ["grain","vignette","flicker"],
 *                                           intensity 0.8
 *                                           → vignette active, strong darkening
 *
 * Assertions:
 *   1. Gate smoke: frame 0 of a filmOverlay-free composition renders without
 *      crash, proving the gate (if !episodeFilmOverlay) path is intact.
 *   2. Both cascade frames render without crashing (> 10 KB PNG).
 *   3. Corner brightness: the dramatic frame is ≥ 15 brightness-units darker
 *      at the top-left corner than the clean frame — directly attributable to
 *      the vignette radial gradient (opacity = intensity × 0.32 = 0.256),
 *      which is far above the grain noise floor.
 *
 * Gate smoke uses "silicon-trap-full" which has no episode-level filmOverlay
 * set — so SegmentFilmOverlay renders children directly (cascade dormant).
 * That composition renders hundreds of frames in production smoke tests; a
 * single frame here confirms the gate path doesn't regress.
 *
 * Run: npm test (included in vitest's include glob)
 * Run alone: npx vitest run src/__tests__/filmOverlay-cascade-integration.test.ts
 * Expected time: ~40-70 s (bundle warm if smoke test ran first)
 */

import { describe, it, beforeAll, afterAll, expect } from "vitest";
import path from "path";
import fs from "fs";
import { PNG } from "pngjs";
import { initBundler, renderCompositionFrame } from "./render-helper";
import { initBrowser, closeBrowser } from "./setup";

// ── Config ────────────────────────────────────────────────────────────────────

const COMP_ID = "film-overlay-cascade-test";
const GATE_COMP_ID = "silicon-trap-full";

const TEMP_DIR = path.resolve(__dirname, ".temp-renders", "film-overlay-cascade");

/**
 * Frame numbers — chosen as midpoints of each 3-second segment.
 *   seg-clean:   frames  0– 89  → midpoint  45
 *   seg-dramatic: frames 90–179 → midpoint 135
 */
const FRAME_CLEAN = 45;
const FRAME_DRAMATIC = 135;

/**
 * Corner region size for brightness sampling.
 * 100×100 pixels at (0,0) — well inside the vignette's darkening zone
 * (vignette radiates from center; corners at 1920×1080 are ~100% from center).
 */
const CORNER_PX = 100;

const TEST_TIMEOUT = 180_000; // 3 min

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Average brightness (0–255) over the top-left CORNER_PX × CORNER_PX region.
 * Uses luminance-weighted formula: 0.299R + 0.587G + 0.114B (ITU-R BT.601).
 */
function topLeftCornerBrightness(pngPath: string): number {
  const raw = fs.readFileSync(pngPath);
  const png = PNG.sync.read(raw);
  let sum = 0;
  let count = 0;
  const hw = Math.min(CORNER_PX, png.height);
  const ww = Math.min(CORNER_PX, png.width);
  for (let y = 0; y < hw; y++) {
    for (let x = 0; x < ww; x++) {
      const idx = (y * png.width + x) * 4;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      sum += 0.299 * r + 0.587 * g + 0.114 * b;
      count++;
    }
  }
  return sum / count;
}

// ── Suite ────────────────────────────────────────────────────────────────────

describe("FilmOverlay cascade — integration (renderStill)", () => {
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

  // ── Gate smoke ──────────────────────────────────────────────────────────────

  it(
    "gate: silicon-trap-full frame 0 renders without crashing (cascade dormant path)",
    async () => {
      // silicon-trap-full has no episode-level filmOverlay → SegmentFilmOverlay
      // gate fires (if !episodeFilmOverlay) → children rendered directly.
      // This test confirms the dormant code path stays intact.
      const outPath = path.join(TEMP_DIR, `${GATE_COMP_ID}-gate-frame-0.png`);
      await renderCompositionFrame(GATE_COMP_ID, 0, outPath);
      expect(fs.existsSync(outPath), "gate PNG was not created").toBe(true);
      const { size } = fs.statSync(outPath);
      expect(size, `gate PNG too small (${size} B)`).toBeGreaterThan(10_000);
    },
    TEST_TIMEOUT,
  );

  // ── Cascade smoke ───────────────────────────────────────────────────────────

  it(
    `cascade: frame ${FRAME_CLEAN} (seg-clean, episode default "clean") renders without crashing`,
    async () => {
      const outPath = path.join(TEMP_DIR, `${COMP_ID}-frame-${FRAME_CLEAN}-clean.png`);
      await renderCompositionFrame(COMP_ID, FRAME_CLEAN, outPath);
      expect(fs.existsSync(outPath), "clean-preset PNG was not created").toBe(true);
      const { size } = fs.statSync(outPath);
      expect(size, `clean PNG too small (${size} B)`).toBeGreaterThan(10_000);
    },
    TEST_TIMEOUT,
  );

  it(
    `cascade: frame ${FRAME_DRAMATIC} (seg-dramatic, override "dramatic"@0.8) renders without crashing`,
    async () => {
      const outPath = path.join(TEMP_DIR, `${COMP_ID}-frame-${FRAME_DRAMATIC}-dramatic.png`);
      await renderCompositionFrame(COMP_ID, FRAME_DRAMATIC, outPath);
      expect(fs.existsSync(outPath), "dramatic-preset PNG was not created").toBe(true);
      const { size } = fs.statSync(outPath);
      expect(size, `dramatic PNG too small (${size} B)`).toBeGreaterThan(10_000);
    },
    TEST_TIMEOUT,
  );

  // ── Cascade visual assertion ─────────────────────────────────────────────────

  it(
    "vignette: dramatic corner is ≥ 15 brightness units darker than clean corner",
    async () => {
      /**
       * Why this assertion:
       *
       * VignetteOverlay (FilmOverlay.tsx ~L138) computes:
       *   opacity = clamp(intensity × 0.32, 0, 0.32)
       *
       * For "dramatic" @ intensity 0.8:
       *   opacity = 0.8 × 0.32 = 0.256
       *   corner overlay color: rgba(18, 16, 14, 0.256)
       *
       * For "clean" (grain only, no vignette):
       *   opacity = 0 (VignetteOverlay not in effects list)
       *
       * KineticTypography "light" background ≈ paper #F5F0E8 (≈ 245,240,232).
       * Alpha-blending the vignette overlay at corner:
       *   R: 18×0.256 + 245×0.744 ≈ 187  (vs 245 without vignette)
       *   Brightness delta ≈ 58 units
       *
       * Grain noise at 0.3–0.8 intensity is in the ±5 brightness range per
       * pixel (stochastic), which is well below the 58-unit vignette delta.
       * A 15-unit threshold is conservative: it passes when vignette fires
       * and fails if SegmentFilmOverlay short-circuits (cascade broken).
       *
       * Frame numbers (45 vs 135) introduce different grain seeds, but the
       * average over 10,000 pixels smooths out stochastic noise.
       */
      const cleanPath = path.join(TEMP_DIR, `${COMP_ID}-frame-${FRAME_CLEAN}-clean.png`);
      const dramaticPath = path.join(
        TEMP_DIR,
        `${COMP_ID}-frame-${FRAME_DRAMATIC}-dramatic.png`,
      );

      // Ensure both renders completed (re-render if somehow missing)
      for (const [frame, suffix] of [[FRAME_CLEAN, "clean"], [FRAME_DRAMATIC, "dramatic"]] as const) {
        const p = path.join(TEMP_DIR, `${COMP_ID}-frame-${frame}-${suffix}.png`);
        if (!fs.existsSync(p)) {
          await renderCompositionFrame(COMP_ID, frame, p);
        }
      }

      const cleanBrightness = topLeftCornerBrightness(cleanPath);
      const dramaticBrightness = topLeftCornerBrightness(dramaticPath);

      console.log(
        `[FilmOverlay cascade] Corner brightness — clean: ${cleanBrightness.toFixed(1)},` +
        ` dramatic: ${dramaticBrightness.toFixed(1)},` +
        ` delta: ${(cleanBrightness - dramaticBrightness).toFixed(1)}`,
      );

      expect(
        cleanBrightness - dramaticBrightness,
        `Expected dramatic corner to be ≥15 brightness units darker than clean corner.\n` +
        `  clean corner brightness: ${cleanBrightness.toFixed(1)}\n` +
        `  dramatic corner brightness: ${dramaticBrightness.toFixed(1)}\n` +
        `  difference: ${(cleanBrightness - dramaticBrightness).toFixed(1)}\n` +
        `\n` +
        `  If this fails, the FilmOverlay cascade wiring in FullEpisode.tsx likely\n` +
        `  short-circuits before calling <FilmOverlay> (vignette never rendered).\n` +
        `  Check: SegmentFilmOverlay gate logic, resolveFilmOverlay cascade levels,\n` +
        `  and that segment.template.filmOverlay is passed to SegmentFilmOverlay.`,
      ).toBeGreaterThanOrEqual(15);
    },
    TEST_TIMEOUT,
  );
});
