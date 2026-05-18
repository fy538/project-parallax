import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use Node environment for testing (not jsdom)
    environment: "node",

    // Set high timeout for rendering tests (60 seconds per test)
    testTimeout: 60000,
    // Render-suite hooks bundle Chromium + Remotion and can exceed the default
    // hook timeout when several real-data suites initialize in one run.
    hookTimeout: 180000,

    // Run tests sequentially to avoid Chromium-instance contention in the
    // visual-regression suite. Vitest 4 removed nested `poolOptions` in favour
    // of top-level pool options (`maxWorkers`/`minWorkers` = 1 for serial).
    pool: "threads",
    maxWorkers: 1,
    minWorkers: 1,

    // Output configuration
    reporters: ["default"],
    outputFile: {
      json: "./test-results.json",
    },

    // Enable globals (describe, it, expect, etc.) without explicit imports
    globals: true,

    // Load .env so env-dependent checks (e.g. MAPBOX_ACCESS_TOKEN) behave
    // identically in tests and in `npx remotion render`.
    setupFiles: ["dotenv/config"],

    // Include test files. `.tsx` is accepted so component tests can use
    // JSX directly (the first such test is BrandLockup.test.tsx — verifies
    // the glyph-vs-SVG branch dispatch from the theme-token refactor).
    include: ["src/__tests__/**/*.test.ts", "src/__tests__/**/*.test.tsx"],
    exclude: ["node_modules", "dist"],
  },
});
