#!/usr/bin/env node
/**
 * render-upload-test.mjs — build the clips for an unlisted YouTube test upload.
 *
 * What survives YouTube's encoder (grain, flat colour, small type) and whether
 * a 2160p upload buys a better 1080p stream can only be settled by uploading.
 * This renders one short clip per variant from a few ranges of the episode:
 *
 *   A  1080p, current look              the baseline; which codec does a 1080p upload get?
 *   B  2160p (scale 2), current look    does a larger upload improve what viewers see?
 *   C  as B, grain off                  does grain matter at all after YouTube? does anything band?
 *   D  as B, one static paper texture   does a static texture survive where moving grain does not?
 *
 * Protocol and what to look at: analysis/youtube-encoding-research-2026-10-10.md
 * ("Test protocol"). The clips are picture only.
 *
 * Settings follow that note: PNG frames, H.264 CRF 12 preset slow, 4:2:0 8-bit,
 * BT.709 written into the stream on the join (Remotion tags only the matrix).
 *
 * Usage:
 *   node scripts/render-upload-test.mjs --episode=ai-care-motives
 *   node scripts/render-upload-test.mjs --episode=<slug> --variants=A,C --ranges=52-66,227-240
 *
 * Output: out/upload-test/<slug>/<variant>-*.mp4
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const slug = args.episode;
if (!slug) {
  console.error("usage: render-upload-test.mjs --episode=<slug> [--variants=A,B,C,D] [--ranges=52-66,227-240,355-425]");
  process.exit(1);
}

const VARIANTS = {
  A: { name: "A-1080p-current", scale: 1, grain: "default" },
  B: { name: "B-2160p-current", scale: 2, grain: "default" },
  C: { name: "C-2160p-no-grain", scale: 2, grain: "off" },
  D: { name: "D-2160p-static-texture", scale: 2, grain: "static" },
};
const wanted = String(args.variants ?? "A,B,C,D").split(",");
const ranges = String(args.ranges ?? "52-66,227-240,355-425")
  .split(",")
  .map((r) => r.split("-").map(Number));

const outDir = path.join(ROOT, "out/upload-test", slug);
const partsDir = path.join(outDir, ".parts");
fs.mkdirSync(partsDir, { recursive: true });

const chromiumOptions = { gl: "angle" };
console.log("Bundling…");
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts") });

for (const key of wanted) {
  const v = VARIANTS[key];
  if (!v) {
    console.error(`Unknown variant ${key}`);
    continue;
  }
  // Picture only (no audio files are needed), with the grain variant.
  const inputProps = { noAudio: true, grain: v.grain };
  const composition = await selectComposition({ serveUrl, id: `${slug}-full`, inputProps, chromiumOptions });
  const parts = [];
  const started = Date.now();
  for (const [from, to] of ranges) {
    const part = path.join(partsDir, `${v.name}-${from}-${to}.mp4`);
    const frameRange = [Math.round(from * composition.fps), Math.min(composition.durationInFrames - 1, Math.round(to * composition.fps) - 1)];
    process.stdout.write(`${v.name}  ${from}–${to}s … `);
    await renderMedia({
      composition,
      serveUrl,
      inputProps,
      codec: "h264",
      crf: 12,
      x264Preset: "slow",
      imageFormat: "png",
      pixelFormat: "yuv420p",
      colorSpace: "bt709",
      scale: v.scale,
      chromiumOptions,
      frameRange,
      muted: true,
      logLevel: "error",
      onBrowserLog: () => undefined,
      outputLocation: part,
    });
    console.log("done");
    parts.push(part);
  }
  const list = path.join(partsDir, `${v.name}.txt`);
  fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
  const out = path.join(outDir, `${v.name}.mp4`);
  execFileSync("ffmpeg", [
    "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", list,
    "-c", "copy",
    // Full BT.709 tags in the H.264 stream itself: primaries, transfer, matrix.
    "-bsf:v", "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1",
    "-movflags", "+faststart",
    out,
  ]);
  const mb = (fs.statSync(out).size / 1e6).toFixed(0);
  console.log(`→ ${path.relative(process.cwd(), out)}  ${mb} MB  (${((Date.now() - started) / 60000).toFixed(1)} min)`);
}
fs.rmSync(partsDir, { recursive: true, force: true });
