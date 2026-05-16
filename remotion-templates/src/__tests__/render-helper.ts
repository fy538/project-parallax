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
import { renderStill, selectComposition, type VideoConfig } from "@remotion/renderer";
import { findChromiumPath } from "./setup";

let chromiumExecutable: string | null = null;
async function getBrowserExecutable(): Promise<string> {
  if (!chromiumExecutable) {
    chromiumExecutable = await findChromiumPath();
  }
  return chromiumExecutable;
}

let serveUrl: string | null = null;
// Cache resolved compositions across tests so we don't re-select on every
// call. selectComposition is non-trivial (loads the bundle, evaluates the
// composition's calculateMetadata).
const compositionCache = new Map<string, VideoConfig>();

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function getCompositionCacheKey(
  compositionId: string,
  inputProps?: Record<string, unknown>
): string {
  return `${compositionId}::${JSON.stringify(inputProps ?? {})}`;
}

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
 * Note: Remotion 4.x's renderStill requires a full VideoConfig object
 * (with width/height/fps/durationInFrames) for the `composition` field,
 * not a string ID. We resolve via selectComposition + cache to avoid
 * re-resolving the same composition across multiple frames.
 *
 * @param compositionId - The composition ID (e.g., "ChoroplethMap")
 * @param frame - Frame number to render (e.g., 30)
 * @param outputPath - Where to save the PNG
 */
export async function renderCompositionFrame(
  compositionId: string,
  frame: number,
  outputPath: string,
  inputProps?: Record<string, unknown>
): Promise<void> {
  const url = getServeUrl();

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browserExecutable = await getBrowserExecutable();

  // Resolve composition once per id (cached). renderStill needs the full
  // VideoConfig object including width/height — passing just the string id
  // throws "height must be a number, but you passed a value of type undefined."
  const cacheKey = getCompositionCacheKey(compositionId, inputProps);
  let composition = compositionCache.get(cacheKey);
  if (!composition) {
    composition = await selectComposition({
      serveUrl: url,
      id: compositionId,
      browserExecutable,
      inputProps,
    });
    compositionCache.set(cacheKey, composition);
  }

  console.log(
    `[Render] Rendering ${compositionId} frame ${frame} -> ${outputPath}`
  );

  const maxAttempts = 2;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await renderStill({
        serveUrl: url,
        composition,
        output: outputPath,
        frame,
        browserExecutable,
        inputProps,
        // Forward env vars the bundle reads at module init (MapGL token +
        // Meridian map style URLs). `renderStill()` injects these into the
        // headless browser's `process.env` BEFORE the bundle loads, which
        // is when `MapGL.tsx` and `theme.ts` capture them into closure. See
        // LESSONS.md L101 (module-init env capture) and L102 (MapGL warm-up).
        // Forwarded only when set in the test process so untokenized CI
        // runs continue to fail loudly rather than render blank maps with
        // an empty token string.
        envVariables: {
          ...(process.env.MAPBOX_ACCESS_TOKEN ? { MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN } : {}),
          ...(process.env.MAPBOX_STYLE_LIGHT_URL ? { MAPBOX_STYLE_LIGHT_URL: process.env.MAPBOX_STYLE_LIGHT_URL } : {}),
          ...(process.env.MAPBOX_STYLE_DARK_URL ? { MAPBOX_STYLE_DARK_URL: process.env.MAPBOX_STYLE_DARK_URL } : {}),
          ...(process.env.MAPBOX_STYLE_SEPIA_URL ? { MAPBOX_STYLE_SEPIA_URL: process.env.MAPBOX_STYLE_SEPIA_URL } : {}),
          ...(process.env.MAPBOX_STYLE_TONER_URL ? { MAPBOX_STYLE_TONER_URL: process.env.MAPBOX_STYLE_TONER_URL } : {}),
        },
        // Forward browser-side console.warn / .error to the test stdout
        // so `warnIf(...)` warnings from inside templates (substrate-contrast
        // checks, semantic data warnings, etc.) surface during visual
        // regression runs. Without this, the warnings fire inside headless
        // Chromium but disappear silently. See LESSONS.md LM4 for context.
        onBrowserLog: (log) => {
          if (log.type === "warn" || log.type === "error") {
            const stamp = `[browser:${log.type}] ${compositionId} frame ${frame}`;
            console.warn(`${stamp}:`, log.text);
          }
        },
      });

      console.log(`[Render] Successfully saved: ${outputPath}`);
      return;
    } catch (error) {
      const isLastAttempt = attempt === maxAttempts;
      if (isLastAttempt) {
        console.error(
          `[Render] Failed to render ${compositionId} frame ${frame}:`,
          error
        );
        throw error;
      }

      console.warn(
        `[Render] Retry ${attempt}/${maxAttempts - 1} for ${compositionId} frame ${frame} after transient render failure.`,
      );
      await sleep(1000);
    }
  }
}

/**
 * Compare two PNG files for visual regression testing using actual pixel
 * comparison via `pixelmatch`. The previous implementation used a 5%
 * file-size tolerance, which had two failure modes: deliberate visual
 * changes that compress to similar size passed silently, and lossless
 * re-encodes tripped false positives. Pixel diff catches both.
 *
 * Behavior:
 *   - Read both PNGs (must be same dimensions; throws if not).
 *   - Run pixelmatch with threshold 0.1 (looser than default 0.1 to
 *     tolerate font rasterization noise across CI/local boundaries).
 *   - Default pass criterion: < 0.5% of pixels differ. Tunable via
 *     `pixelDiffPct` option for templates with known rasterization noise.
 *   - On mismatch, writes a side-by-side diff PNG to `<currentPath>.diff
 *     .png` so visual inspection doesn't require manually opening both
 *     baseline and current files.
 *
 * Returns metrics the test caller can log + assert against.
 */

import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

export interface ComparePNGsOptions {
  /** Per-pixel color-distance threshold passed to pixelmatch (0–1). Lower = stricter. Default 0.1. */
  pixelThreshold?: number;
  /** Maximum acceptable percentage of differing pixels before match=false. Default 0.5. */
  pixelDiffPct?: number;
  /** Write the diff PNG to disk on mismatch (defaults to true). */
  writeDiffOnMismatch?: boolean;
}

export function comparePNGs(
  baselinePath: string,
  currentPath: string,
  options: ComparePNGsOptions = {},
): {
  match: boolean;
  /** Total differing pixels. */
  diffPixels: number;
  /** Percentage of pixels that differ (0-100). */
  diffPct: number;
  /** Total pixels compared (width × height). */
  totalPixels: number;
  /** Baseline + current file sizes — kept for logging continuity. */
  baselineSize: number;
  currentSize: number;
  /** Path to the diff PNG written on mismatch; null otherwise. */
  diffPath: string | null;
} {
  if (!fs.existsSync(baselinePath)) {
    throw new Error(`Baseline PNG not found: ${baselinePath}`);
  }
  if (!fs.existsSync(currentPath)) {
    throw new Error(`Current PNG not found: ${currentPath}`);
  }

  const {
    pixelThreshold = 0.1,
    pixelDiffPct = 0.5,
    writeDiffOnMismatch = true,
  } = options;

  const baselinePng = PNG.sync.read(fs.readFileSync(baselinePath));
  const currentPng = PNG.sync.read(fs.readFileSync(currentPath));

  if (
    baselinePng.width !== currentPng.width ||
    baselinePng.height !== currentPng.height
  ) {
    throw new Error(
      `PNG dimension mismatch: baseline ${baselinePng.width}×${baselinePng.height} ` +
        `vs current ${currentPng.width}×${currentPng.height}`,
    );
  }

  const { width, height } = baselinePng;
  const totalPixels = width * height;
  const diff = new PNG({ width, height });

  const diffPixels = pixelmatch(
    baselinePng.data,
    currentPng.data,
    diff.data,
    width,
    height,
    { threshold: pixelThreshold },
  );

  const diffPct = (diffPixels / totalPixels) * 100;
  const match = diffPct <= pixelDiffPct;

  let diffPath: string | null = null;
  if (!match && writeDiffOnMismatch) {
    diffPath = `${currentPath}.diff.png`;
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
  }

  return {
    match,
    diffPixels,
    diffPct,
    totalPixels,
    baselineSize: fs.statSync(baselinePath).size,
    currentSize: fs.statSync(currentPath).size,
    diffPath,
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
