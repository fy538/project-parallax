import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Use Node environment for testing (not jsdom)
    environment: "node",

    // Set high timeout for rendering tests (60 seconds per test)
    testTimeout: 60000,

    // Run tests sequentially to avoid browser contention
    threads: false,
    singleThread: true,

    // Output configuration
    reporters: ["default"],
    outputFile: {
      json: "./test-results.json",
    },

    // Enable globals (describe, it, expect, etc.) without explicit imports
    globals: true,

    // Include test files
    include: ["src/__tests__/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
  },
});
