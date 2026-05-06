#!/usr/bin/env node
/**
 * render-emphasis-reference.mjs — Render the EmphasisShowcase as a 6-PNG
 * reference set, one PNG per episode color emphasis.
 *
 * Why: the EmphasisShowcase catalog comp cycles through all six emphases
 * sequentially (4s each = 24s total). For QA — comparing emphases
 * side-by-side or reviewing whether one feels right for an upcoming
 * episode — six stills at the settled moment of each window are more
 * useful than a 24-second video to scrub through.
 *
 * Output: out/emphasis-reference/<emphasis-name>.png × 6
 *
 * Usage:
 *   node scripts/render-emphasis-reference.mjs
 *
 * After running, optionally combine into a contact sheet with ImageMagick:
 *   cd out/emphasis-reference
 *   montage *.png -tile 3x2 -geometry +12+12 -background "#1C1814" \
 *     -title "Emphasis Reference" contact-sheet.png
 *
 * Total render time: ~30-60 seconds (six stills, no video encoding).
 */

import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const COMPOSITION_ID = "catalog-emphasis-showcase-all-six";

// Six emphases, sequential at 4s each in the showcase. Render at the
// settled moment of each window — 2s in is past the bar entrance
// (~1.5s) and inside the steady-state hold. Frame math derives from
// the actual composition.fps below so this stays correct if the
// project's fps changes.
const PER_EMPHASIS_SEC = 4;
const SETTLE_OFFSET_SEC = 2;
const EMPHASES = [
  "neutral",
  "soviet",
  "american-modernist",
  "chinese-state",
  "chinese-traditional",
  "japanese-showa",
];

async function main() {
  console.log("Bundling Remotion entry point...");
  const serveUrl = await bundle({
    entryPoint: resolve(ROOT, "src/index.ts"),
  });
  console.log(`Bundle ready: ${serveUrl}`);

  console.log(`Selecting composition ${COMPOSITION_ID}...`);
  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
  });
  console.log(
    `  ${composition.width}×${composition.height} @ ${composition.fps}fps, ${composition.durationInFrames} frames`,
  );

  const perEmphasisFrames = Math.round(PER_EMPHASIS_SEC * composition.fps);
  const settleOffsetFrames = Math.round(SETTLE_OFFSET_SEC * composition.fps);

  const outDir = join(ROOT, "out", "emphasis-reference");
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  for (let i = 0; i < EMPHASES.length; i++) {
    const name = EMPHASES[i];
    const frame = i * perEmphasisFrames + settleOffsetFrames;
    const output = join(outDir, `${name}.png`);
    process.stdout.write(`  [${i + 1}/${EMPHASES.length}] ${name.padEnd(20)} frame ${frame}...`);
    try {
      await renderStill({
        serveUrl,
        composition,
        output,
        frame,
      });
      console.log(" ✓");
    } catch (e) {
      console.log(` ✗ ${e.message}`);
    }
  }

  console.log(`\nDone. Six reference PNGs in ${outDir}/`);
  console.log("Combine into a contact sheet with ImageMagick:");
  console.log(`  cd ${outDir}`);
  console.log(`  montage *.png -tile 3x2 -geometry +12+12 -background "#1C1814" -title "Emphasis Reference" contact-sheet.png`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
