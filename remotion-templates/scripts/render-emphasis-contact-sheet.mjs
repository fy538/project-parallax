#!/usr/bin/env node
/**
 * render-emphasis-contact-sheet.mjs — Render N representative templates
 * × all 6 emphases as individual PNGs, organized for visual QA.
 *
 * Builds on the EmphasisShowcase pattern but covers a spread of templates
 * (chart, framework, hero stat, title card, map) instead of just DataChart.
 * Per-emphasis review is now possible across the whole template family in
 * one script run.
 *
 * Output structure:
 *   out/emphasis-contact-sheet/
 *     DataChart/
 *       neutral.png
 *       soviet.png
 *       american-modernist.png
 *       chinese-state.png
 *       chinese-traditional.png
 *       japanese-showa.png
 *     FrameworkDiagram/
 *       neutral.png
 *       ...
 *     ...
 *
 * After running, build per-template contact sheets via ImageMagick:
 *   for d in out/emphasis-contact-sheet/*/; do
 *     name=$(basename "$d")
 *     montage "$d"*.png -tile 3x2 -geometry +12+12 \
 *       -background "#1C1814" -title "$name" "$d/_contact-sheet.png"
 *   done
 *
 * Total render time: ~2-5 minutes (5 templates × 6 emphases = 30 stills,
 * each ~3-8s including bundle reuse).
 */

import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { mkdirSync, existsSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const COMPOSITION_ID = "catalog-template-preview-emphasis-grid";

// 5 representative templates — must match keys in PREVIEW_REGISTRY in
// src/catalog/TemplatePreview.tsx. Adding a template there + here is all
// that's needed to expand the contact sheet's coverage.
const TEMPLATES = [
  "DataChart",
  "FrameworkDiagram",
  "StatReveal",
  "TitleTransition",
  "ChoroplethMap",
];

const EMPHASES = [
  "neutral",
  "soviet",
  "american-modernist",
  "chinese-state",
  "chinese-traditional",
  "japanese-showa",
];

// Render frame: 2 seconds in, past entrance, into steady state. Pulled
// from composition.fps below so the math survives an fps change.
const SETTLE_OFFSET_SEC = 2;

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
  const settleFrame = Math.round(SETTLE_OFFSET_SEC * composition.fps);
  console.log(
    `  ${composition.width}×${composition.height} @ ${composition.fps}fps, settle frame ${settleFrame}`,
  );

  const outDir = join(ROOT, "out", "emphasis-contact-sheet");
  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  const total = TEMPLATES.length * EMPHASES.length;
  let i = 0;
  let succeeded = 0;
  let failed = 0;

  for (const templateId of TEMPLATES) {
    const tplDir = join(outDir, templateId);
    if (!existsSync(tplDir)) {
      mkdirSync(tplDir, { recursive: true });
    }

    for (const emphasis of EMPHASES) {
      i++;
      const output = join(tplDir, `${emphasis}.png`);
      process.stdout.write(
        `  [${i}/${total}] ${templateId.padEnd(20)} ${emphasis.padEnd(22)}...`,
      );
      try {
        await renderStill({
          serveUrl,
          composition,
          output,
          frame: settleFrame,
          inputProps: { templateId, emphasis },
        });
        console.log(" ✓");
        succeeded++;
      } catch (e) {
        console.log(` ✗ ${e.message}`);
        failed++;
      }
    }
  }

  console.log(`\nDone. ${succeeded}/${total} stills in ${outDir}/`);
  if (failed > 0) {
    console.log(`  ${failed} failure(s) — check messages above.`);
  }
  console.log("\nBuild per-template contact sheets:");
  console.log(`  for d in ${outDir}/*/; do`);
  console.log(`    name=$(basename "$d")`);
  console.log(
    `    montage "$d"*.png -tile 3x2 -geometry +12+12 -background "#1C1814" -title "$name" "$d/_contact-sheet.png"`,
  );
  console.log("  done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
