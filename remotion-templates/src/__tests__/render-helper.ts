/**
 * Render Helper — Wraps @remotion/renderer for composition snapshot testing
 *
 * Provides a simple API to:
 * 1. Bundle the entry point once (shared across all tests)
 * 2. Render individual frames from any composition
 * 3. Save rendered PNGs to disk
 */

import path from "path";
import fs from "fs";
import { bundle } from "@remotion/bundler";
import { renderStill } from "@remotion/renderer";
import { getBrowser, initBrowser } from "./setup";

let serveUrl: string | null = null;

/**
 * Initialize the bundler once before all tests.
 * Bundles the entry point and returns a serve URL for rendering.
 */
export async function initBundler(): Promise<string> {
  if (serveUrl) {
    return serveUrl;
  }

  console.log("[Bundler] Starting Remotion bundle...");
  const entryPoint = path.resolve(__dirname, "../index.ts");

  try {
    serveUrl = await bundle({
      entryPoint,
      webpackOverride: (config) => {
        // Ensure proper resolution for TypeScript imports
        return config;
      },
    });

    console.log(`[Bundler] Bundle ready at: ${serveUrl}`);
    return serveUrl;
  } catch (error) {
    console.error("[Bundler] Failed to bundle entry point:", error);
    throw error;
  }
}

/**
 * Get the current serve URL (must call initBundler first).
 */
export function getServeUrl(): string {
  if (!serveUrl) {
    throw new Error(
      "Bundle not initialized. Call initBundler() before rendering."
    );
  }
  return serveUrl;
}

/**
 * Render a specific frame from a composition.
 *
 * @param compositionId - The composition ID (e.g., "ChoroplethMap")
 * @param frame - Frame number to render (e.g., 30)
 * @param outputPath - Where to save the PNG
 */
export async function renderCompositionFrame(
  compositionId: string,
  frame: number,
  outputPath: string
): Promise<void> {
  const url = getServeUrl();

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Ensure browser is initialized
  const browser = await initBrowser();

  console.log(
    `[Render] Rendering ${compositionId} frame ${frame} -> ${outputPath}`
  );

  try {
    await renderStill({
      serveUrl: url,
      composition: compositionId,
      output: outputPath,
      frame,
      browser,
    });

    console.log(`[Render] Successfully saved: ${outputPath}`);
  } catch (error) {
    console.error(
      `[Render] Failed to render ${compositionId} frame ${frame}:`,
      error
    );
    throw error;
  }
}

/**
 * Compare two PNG files for visual regression testing.
 * Returns file sizes as a quick smoke test (basic validation).
 *
 * For more advanced pixel-level comparison, integrate with libraries like:
 * - pixelmatch
 * - jimp
 * - sharp with custom diff logic
 *
 * @returns { match: boolean; baseline: number; current: number; diff: number }
 */
export function comparePNGs(
  baselinePath: string,
  currentPath: string
): {
  match: boolean;
  baselineSize: number;
  currentSize: number;
  sizeDiff: number;
} {
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Baseline PNG not found: ${baselinePath}`);
  }

  if (!fs.existsSync(currentPath)) {
    throw new Error(`Current PNG not found: ${currentPath}`);
  }

  const baselineSize = fs.statSync(baselinePath).size;
  const currentSize = fs.statSync(currentPath).size;
  const sizeDiff = Math.abs(baselineSize - currentSize);

  // Allow 5% size variation as tolerance for slight rendering variations
  // (compression artifacts, font rasterization, etc.)
  const tolerance = baselineSize * 0.05;
  const match = sizeDiff <= tolerance;

  return {
    match,
    baselineSize,
    currentSize,
    sizeDiff,
  };
}

/**
 * Save a PNG file as a baseline reference.
 */
export function saveBaseline(
  sourceFile: string,
  baselineFile: string
): void {
  const dir = path.dirname(baselineFile);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.copyFileSync(sourceFile, baselineFile);
  console.log(`[Baseline] Saved: ${baselineFile}`);
}
