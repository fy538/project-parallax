#!/usr/bin/env node
// Kill orphaned "Google Chrome for Testing" processes left behind by interrupted
// Playwright/Puppeteer/Remotion test runs. Safe to run any time — only matches
// the test-binary path under ms-playwright cache and the puppeteer/playwright
// temp profile dirs, so it won't touch your real Chrome.

import { execSync } from "node:child_process";
import os from "node:os";

if (os.platform() !== "darwin" && os.platform() !== "linux") {
  console.log("[kill-stale-browsers] skipped (unsupported platform)");
  process.exit(0);
}

const PATTERNS = [
  "ms-playwright/chromium.*Google Chrome for Testing",
  "puppeteer_dev_chrome_profile",
  "playwright_chromiumdev_profile",
];

let killed = 0;
for (const pat of PATTERNS) {
  try {
    const pids = execSync(`pgrep -f ${JSON.stringify(pat)} || true`, {
      encoding: "utf8",
    })
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const pid of pids) {
      try {
        process.kill(Number(pid), "SIGTERM");
        killed++;
      } catch {
        // already gone
      }
    }
  } catch {
    // pgrep missing or no matches — ignore
  }
}

if (killed > 0) {
  console.log(`[kill-stale-browsers] sent SIGTERM to ${killed} stale process(es)`);
} else {
  console.log("[kill-stale-browsers] no stale test browsers found");
}
