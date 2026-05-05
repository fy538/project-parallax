#!/usr/bin/env node
/**
 * snapshot.mjs — Quick single-composition visual snapshot.
 *
 * Usage:
 *   node scripts/snapshot.mjs HorizontalTimeline         # Render frame 30
 *   node scripts/snapshot.mjs HorizontalTimeline 60      # Render frame 60
 *   node scripts/snapshot.mjs --all                      # Render all compositions
 *   node scripts/snapshot.mjs --update HorizontalTimeline  # Update baseline
 *
 * Renders a single frame as PNG and opens it (macOS).
 * Useful for quick visual checks during development without running the full test suite.
 */

import { execSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help") {
  console.log(`
Usage:
  node scripts/snapshot.mjs <CompositionId> [frame]
  node scripts/snapshot.mjs --all
  node scripts/snapshot.mjs --update <CompositionId>

Examples:
  node scripts/snapshot.mjs HorizontalTimeline
  node scripts/snapshot.mjs DecisionTree 90
  node scripts/snapshot.mjs --all
`);
  process.exit(0);
}

const isUpdate = args[0] === "--update";
const isAll = args[0] === "--all";

if (isAll) {
  console.log("Running full visual regression suite...");
  execSync("npx vitest run src/__tests__/templates.test.ts", {
    cwd: ROOT,
    stdio: "inherit",
  });
  process.exit(0);
}

const compositionId = isUpdate ? args[1] : args[0];
const frame = isUpdate ? 30 : parseInt(args[1] || "30", 10);

if (!compositionId) {
  console.error("Error: Must specify a composition ID.");
  process.exit(1);
}

const outputDir = path.join(ROOT, "src/__tests__/.temp-renders");
const outputFile = path.join(outputDir, `${compositionId}-frame-${frame}.png`);
const baselineFile = path.join(
  ROOT,
  `src/__tests__/baselines/${compositionId}-frame-${frame}.png`
);

console.log(`\nRendering ${compositionId} frame ${frame}...`);
console.log(`Output: ${outputFile}\n`);

try {
  // Use Remotion CLI for quick single-frame render
  execSync(
    `npx remotion still ${compositionId} ${outputFile} --frame=${frame}`,
    {
      cwd: ROOT,
      stdio: "inherit",
    }
  );

  if (isUpdate) {
    execSync(`cp "${outputFile}" "${baselineFile}"`, { stdio: "inherit" });
    console.log(`\nBaseline updated: ${baselineFile}`);
  }

  // Open on macOS
  try {
    execSync(`open "${outputFile}"`, { stdio: "ignore" });
  } catch {
    // Not on macOS, just print path
    console.log(`\nRendered: ${outputFile}`);
  }
} catch (error) {
  console.error(`\nFailed to render ${compositionId}:`, error.message);
  process.exit(1);
}
