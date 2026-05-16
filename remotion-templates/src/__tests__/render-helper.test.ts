/**
 * Unit tests for `comparePNGs` from render-helper.ts.
 *
 * The function is the workhorse of all visual regression in the codebase —
 * 8+ test files depend on it (templates.test.ts, catalog-smoke.test.ts,
 * map-real-data, split-real-data, framework-diagram-real-data, etc.).
 * Despite the criticality, it had zero unit tests until now.
 *
 * Strategy: synthesise tiny PNGs in-memory (4×4 to 100×100 — small enough
 * to keep tests fast, large enough to exercise the percentage threshold
 * meaningfully), write to a temp directory, run `comparePNGs`, then
 * tear down.
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { PNG } from "pngjs";
import { comparePNGs } from "./render-helper";

// ── Helpers ────────────────────────────────────────────────────────────────

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "comparepngs-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

/**
 * Create a PNG of the given dimensions filled with a single RGBA color.
 * Returns the absolute path of the written file inside the test's tmp dir.
 */
function writeSolidPng(
  name: string,
  width: number,
  height: number,
  rgba: [number, number, number, number],
): string {
  const png = new PNG({ width, height });
  for (let i = 0; i < width * height; i++) {
    const off = i * 4;
    png.data[off]     = rgba[0];
    png.data[off + 1] = rgba[1];
    png.data[off + 2] = rgba[2];
    png.data[off + 3] = rgba[3];
  }
  const outPath = path.join(tmpDir, name);
  fs.writeFileSync(outPath, PNG.sync.write(png));
  return outPath;
}

/**
 * Create a PNG where `numChanged` pixels (starting from index 0) are set to
 * `changedColor` and the rest are `baseColor`. Used to precisely control
 * the percentage of differing pixels for threshold tests.
 */
function writePngWithChanges(
  name: string,
  width: number,
  height: number,
  baseColor: [number, number, number, number],
  changedColor: [number, number, number, number],
  numChanged: number,
): string {
  const png = new PNG({ width, height });
  const total = width * height;
  for (let i = 0; i < total; i++) {
    const off = i * 4;
    const c = i < numChanged ? changedColor : baseColor;
    png.data[off]     = c[0];
    png.data[off + 1] = c[1];
    png.data[off + 2] = c[2];
    png.data[off + 3] = c[3];
  }
  const outPath = path.join(tmpDir, name);
  fs.writeFileSync(outPath, PNG.sync.write(png));
  return outPath;
}

const WHITE: [number, number, number, number] = [255, 255, 255, 255];
const BLACK: [number, number, number, number] = [0, 0, 0, 255];

// ── 1. Identical inputs ────────────────────────────────────────────────────

describe("comparePNGs — identical inputs", () => {
  it("two byte-identical PNGs → match=true, diffPixels=0, diffPct=0", () => {
    const a = writeSolidPng("a.png", 4, 4, WHITE);
    const b = writeSolidPng("b.png", 4, 4, WHITE);
    const result = comparePNGs(a, b);

    expect(result.match).toBe(true);
    expect(result.diffPixels).toBe(0);
    expect(result.diffPct).toBe(0);
    expect(result.totalPixels).toBe(16);
    expect(result.diffPath).toBeNull();
  });
});

// ── 2. Percentage threshold ────────────────────────────────────────────────

describe("comparePNGs — percentage threshold (default 0.5%)", () => {
  // 100×100 = 10000 pixels. 1 changed = 0.01%; 50 changed = 0.5%; 51 = 0.51%.
  const W = 100;
  const H = 100;
  const TOTAL = W * H;

  it("1 pixel of 10000 (0.01%) → match=true (well under 0.5%)", () => {
    const baseline = writeSolidPng("base.png", W, H, WHITE);
    const current = writePngWithChanges("curr.png", W, H, WHITE, BLACK, 1);
    const result = comparePNGs(baseline, current);

    expect(result.match).toBe(true);
    expect(result.diffPixels).toBe(1);
    expect(result.diffPct).toBeCloseTo(0.01, 4);
    expect(result.totalPixels).toBe(TOTAL);
    expect(result.diffPath).toBeNull();
  });

  it("exactly 0.5% (50 of 10000) → match=true (boundary inclusive)", () => {
    const baseline = writeSolidPng("base.png", W, H, WHITE);
    const current = writePngWithChanges("curr.png", W, H, WHITE, BLACK, 50);
    const result = comparePNGs(baseline, current);

    expect(result.diffPixels).toBe(50);
    expect(result.diffPct).toBeCloseTo(0.5, 4);
    expect(result.match).toBe(true);
  });

  it("51 of 10000 (0.51%) → match=false (just over threshold)", () => {
    const baseline = writeSolidPng("base.png", W, H, WHITE);
    const current = writePngWithChanges("curr.png", W, H, WHITE, BLACK, 51);
    const result = comparePNGs(baseline, current);

    expect(result.diffPixels).toBe(51);
    expect(result.diffPct).toBeCloseTo(0.51, 4);
    expect(result.match).toBe(false);
  });

  it("custom pixelDiffPct=1.0 raises the threshold", () => {
    const baseline = writeSolidPng("base.png", W, H, WHITE);
    const current = writePngWithChanges("curr.png", W, H, WHITE, BLACK, 75);
    // 0.75% with default 0.5% → fail.
    expect(comparePNGs(baseline, current).match).toBe(false);
    // 0.75% with 1.0% threshold → pass.
    expect(comparePNGs(baseline, current, { pixelDiffPct: 1.0 }).match).toBe(true);
  });
});

// ── 3. Dimension mismatch ──────────────────────────────────────────────────

describe("comparePNGs — dimension mismatch", () => {
  it("throws when widths differ", () => {
    const a = writeSolidPng("a.png", 4, 4, WHITE);
    const b = writeSolidPng("b.png", 8, 4, WHITE);
    expect(() => comparePNGs(a, b)).toThrow(/dimension mismatch/);
  });

  it("throws when heights differ", () => {
    const a = writeSolidPng("a.png", 4, 4, WHITE);
    const b = writeSolidPng("b.png", 4, 8, WHITE);
    expect(() => comparePNGs(a, b)).toThrow(/dimension mismatch/);
  });

  it("error message includes both dimensions", () => {
    const a = writeSolidPng("a.png", 4, 4, WHITE);
    const b = writeSolidPng("b.png", 8, 16, WHITE);
    expect(() => comparePNGs(a, b)).toThrow(/baseline 4×4.*current 8×16/);
  });
});

// ── 4. Missing files ───────────────────────────────────────────────────────

describe("comparePNGs — missing files", () => {
  it("throws when baseline doesn't exist", () => {
    const current = writeSolidPng("curr.png", 4, 4, WHITE);
    expect(() => comparePNGs(path.join(tmpDir, "missing.png"), current)).toThrow(
      /Baseline PNG not found/,
    );
  });

  it("throws when current doesn't exist", () => {
    const baseline = writeSolidPng("base.png", 4, 4, WHITE);
    expect(() => comparePNGs(baseline, path.join(tmpDir, "missing.png"))).toThrow(
      /Current PNG not found/,
    );
  });
});

// ── 5. Diff PNG side-effects ───────────────────────────────────────────────

describe("comparePNGs — diff PNG side-effects", () => {
  it("writes <currentPath>.diff.png on mismatch by default", () => {
    const baseline = writeSolidPng("base.png", 100, 100, WHITE);
    const current = writePngWithChanges("curr.png", 100, 100, WHITE, BLACK, 200);
    const result = comparePNGs(baseline, current);

    expect(result.match).toBe(false);
    expect(result.diffPath).toBe(`${current}.diff.png`);
    expect(fs.existsSync(result.diffPath!)).toBe(true);
  });

  it("does NOT write diff PNG on match", () => {
    const baseline = writeSolidPng("base.png", 4, 4, WHITE);
    const current = writeSolidPng("curr.png", 4, 4, WHITE);
    const result = comparePNGs(baseline, current);

    expect(result.match).toBe(true);
    expect(result.diffPath).toBeNull();
    expect(fs.existsSync(`${current}.diff.png`)).toBe(false);
  });

  it("writeDiffOnMismatch:false suppresses diff write even on mismatch", () => {
    const baseline = writeSolidPng("base.png", 100, 100, WHITE);
    const current = writePngWithChanges("curr.png", 100, 100, WHITE, BLACK, 200);
    const result = comparePNGs(baseline, current, { writeDiffOnMismatch: false });

    expect(result.match).toBe(false);
    expect(result.diffPath).toBeNull();
    expect(fs.existsSync(`${current}.diff.png`)).toBe(false);
  });

  it("cleans up stale .diff.png from previous failing run on successful match", () => {
    const baseline = writeSolidPng("base.png", 4, 4, WHITE);
    const current = writeSolidPng("curr.png", 4, 4, WHITE);
    // Simulate a stale diff from a prior failing run.
    const stalePath = `${current}.diff.png`;
    fs.writeFileSync(stalePath, "stale fake content");
    expect(fs.existsSync(stalePath)).toBe(true);

    const result = comparePNGs(baseline, current);
    expect(result.match).toBe(true);
    expect(fs.existsSync(stalePath)).toBe(false); // cleaned up
  });
});

// ── 6. pixelThreshold tuning ───────────────────────────────────────────────

describe("comparePNGs — pixelThreshold tuning", () => {
  it("stricter threshold catches near-identical colors that default tolerates", () => {
    // Off-by-one-channel pixels: (255,255,255) vs (250,250,250). Under
    // default pixelmatch threshold (0.1) this falls below the color-distance
    // floor → pixelmatch counts ZERO differing pixels. Drop threshold to
    // catch it.
    const W = 100;
    const H = 100;
    const baseline = writeSolidPng("base.png", W, H, [255, 255, 255, 255]);
    const current = writeSolidPng("curr.png", W, H, [250, 250, 250, 255]);

    const lenient = comparePNGs(baseline, current, { pixelThreshold: 0.1 });
    const strict = comparePNGs(baseline, current, { pixelThreshold: 0.0 });

    // Strict catches every pixel; lenient may catch zero or near-zero.
    expect(strict.diffPixels).toBeGreaterThan(lenient.diffPixels);
  });
});
