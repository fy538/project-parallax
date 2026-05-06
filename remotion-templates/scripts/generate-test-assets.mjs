#!/usr/bin/env node
/**
 * generate-test-assets.mjs — Produce synthetic test assets so the visual
 * regression suite doesn't depend on vendor images that may not be present
 * in a fresh clone or on a fresh CI runner.
 *
 * Currently generates:
 *   public/assets/sample-historical.png
 *
 * The image is a 1920×1080 synthetic composition (radial gradient + tonal
 * bands + a centered geometric mark) — visually neutral, not pretending
 * to be archival footage, but tonally varied enough to exercise the
 * duotone treatment pipeline (shadows → midtones → highlights need a
 * spread of input luminances to produce an interesting output).
 *
 * Run once on a fresh checkout, or whenever the asset is missing. The
 * resulting PNG is checked into the repo (~50KB) so subsequent runs
 * don't need to regenerate.
 */

import { PNG } from "pngjs";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// 480×270 = quarter-of-a-quarter HD. ImageComposite scales the source
// to fit the frame anyway, so the regression-test purpose (stable input
// → stable output) doesn't need the source at full resolution. Keeps
// the committed asset under 100KB instead of 700KB+.
const W = 480;
const H = 270;
const OUT_PATH = resolve(ROOT, "public", "assets", "sample-historical.png");

function generateSampleHistorical() {
  const png = new PNG({ width: W, height: H });

  // Center coordinates for the radial component.
  const cx = W / 2;
  const cy = H / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // Radial gradient (1.0 at center → 0 at corners), with slight bias
      // so the brightest point sits a little above center (rule of
      // thirds-ish, more interesting for duotone)
      const dx = x - cx;
      const dy = y - cy * 0.85;
      const radial = 1 - Math.sqrt(dx * dx + dy * dy) / maxDist;

      // Horizontal tonal band so the image isn't purely radial — gives
      // shadows and highlights a clearer separation.
      const band = 0.5 + 0.5 * Math.sin((x / W) * Math.PI * 2 - Math.PI / 2);

      // Compose: radial dominates (75%), band adds variation (25%).
      let v = Math.max(0, Math.min(1, 0.45 * radial + 0.35 * band + 0.1));

      // A subtle noise texture so the duotone pipeline doesn't produce
      // perfectly smooth gradients (which look unnaturally clean and
      // make rasterization noise harder to detect).
      v += (Math.sin(x * 0.13 + y * 0.07) * Math.cos(x * 0.07 - y * 0.11)) * 0.015;

      const luma = Math.max(0, Math.min(255, Math.round(v * 255)));

      const idx = (W * y + x) << 2;
      png.data[idx] = luma;       // R
      png.data[idx + 1] = luma;   // G
      png.data[idx + 2] = luma;   // B
      png.data[idx + 3] = 255;    // A
    }
  }

  return png;
}

function main() {
  const outDir = dirname(OUT_PATH);
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  console.log(`Generating ${W}×${H} sample-historical PNG...`);
  const png = generateSampleHistorical();
  const buffer = PNG.sync.write(png);
  writeFileSync(OUT_PATH, buffer);
  console.log(`  ✓ ${OUT_PATH} (${(buffer.length / 1024).toFixed(0)} KB)`);
}

main();
