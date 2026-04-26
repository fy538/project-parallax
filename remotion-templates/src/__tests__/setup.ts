/**
 * Test Setup — Configure Remotion renderer for visual regression testing
 *
 * This module initializes the Remotion rendering environment for pixel-perfect
 * snapshot testing. It finds the Playwright browser, configures rendering options,
 * and handles browser lifecycle.
 */

import path from "path";
import fs from "fs";
import { chromium } from "playwright";
import type { Browser } from "playwright";

let browser: Browser | null = null;

/**
 * Find Playwright's bundled Chromium executable.
 * Searches the ms-playwright cache directory for the headless_shell binary.
 */
export async function findChromiumPath(): Promise<string> {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  const playwrightCacheDir = path.join(home, ".cache", "ms-playwright");

  if (!fs.existsSync(playwrightCacheDir)) {
    throw new Error(
      `Playwright cache directory not found at ${playwrightCacheDir}. ` +
        `Make sure Playwright is installed via npm.`
    );
  }

  // Search recursively for headless_shell binary
  function findBinary(dir: string): string | null {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const found = findBinary(fullPath);
        if (found) return found;
      } else if (file === "headless_shell" || file === "chromium.exe") {
        return fullPath;
      }
    }
    return null;
  }

  const chromiumPath = findBinary(playwrightCacheDir);
  if (!chromiumPath) {
    throw new Error(
      `Chromium binary not found in ${playwrightCacheDir}. ` +
        `Run 'npm install playwright' first.`
    );
  }

  return chromiumPath;
}

/**
 * Initialize browser instance for rendering.
 * Launches Playwright Chromium with rendering-optimized settings.
 */
export async function initBrowser(): Promise<Browser> {
  if (browser) {
    return browser;
  }

  try {
    const executablePath = await findChromiumPath();
    browser = await chromium.launch({ executablePath });
    return browser;
  } catch (error) {
    console.error("Failed to initialize Chromium browser:", error);
    throw error;
  }
}

/**
 * Close the browser instance.
 */
export async function closeBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

/**
 * Get the current browser instance.
 */
export function getBrowser(): Browser {
  if (!browser) {
    throw new Error(
      "Browser not initialized. Call initBrowser() before using getBrowser()."
    );
  }
  return browser;
}

/**
 * Ensure baseline directory exists.
 */
export function ensureBaselineDir(baselineDir: string): void {
  if (!fs.existsSync(baselineDir)) {
    fs.mkdirSync(baselineDir, { recursive: true });
  }
}
