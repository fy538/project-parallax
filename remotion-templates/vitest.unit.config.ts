/**
 * vitest.unit.config.ts — fast unit-test runner
 *
 * Extends the base vitest.config.ts but excludes suites that require a
 * browser or the Remotion bundler (Playwright, @remotion/renderer, or
 * @remotion/bundler). Those suites live in the render/real-data targets:
 *
 *   npm test                  — full suite (includes render + real-data)
 *   npm run test:unit         — pure unit tests (this config, ~5 s)
 *   npm run test:real-data    — *-real-data.test.ts only (needs MAPBOX token)
 *   npm run test:visual       — templates.test.ts baseline regression
 *   npm run test:catalog      — catalog-smoke.test.ts
 *   npm run test:episode-smoke — full-episode-smoke.test.ts
 *
 * Any new *.test.ts file added to src/__tests__/ that does NOT import from
 * @remotion/renderer, @remotion/bundler, playwright, or render-helper's
 * rendering functions will be automatically included here — no whitelist edit
 * needed. This replaces the previous hand-maintained file list in package.json.
 *
 * Render-heavy exclusions:
 *   *-real-data.test.ts          — real episode JSON renders via Playwright
 *   templates.test.ts            — full visual-regression suite (~60 renders)
 *   catalog-smoke.test.ts        — renders every catalog entry
 *   full-episode-smoke.test.ts   — episode smoke renders (slow)
 *   editorialFrame-visual.test.ts    — visual frame renders
 *   filmOverlay-cascade-integration.test.ts — overlay cascade renders
 */
import { defineConfig, mergeConfig } from "vitest/config";
import base from "./vitest.config";

export default mergeConfig(
  base,
  defineConfig({
    test: {
      // Override the base timeout — unit tests should complete in < 10 s each;
      // the 60 s default is sized for full Remotion render suites.
      testTimeout: 10000,
      hookTimeout: 15000,

      exclude: [
        // Always exclude
        "node_modules",
        "dist",
        // ── Render-heavy suites (browser + Remotion bundler required) ──────
        // Real-data suites — render actual episode JSON via Playwright:
        "src/__tests__/*-real-data.test.ts",
        // Full visual-regression suite (~60 frame renders):
        "src/__tests__/templates.test.ts",
        // Catalog smoke — renders every catalog composition:
        "src/__tests__/catalog-smoke.test.ts",
        // Episode smoke — full-length episode renders:
        "src/__tests__/full-episode-smoke.test.ts",
        // Visual frame renders:
        "src/__tests__/editorialFrame-visual.test.ts",
        // FilmOverlay cascade integration (renders frames to verify cascade):
        "src/__tests__/filmOverlay-cascade-integration.test.ts",
      ],
    },
  }),
);
