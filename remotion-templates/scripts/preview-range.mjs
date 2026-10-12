#!/usr/bin/env node
/**
 * preview-range.mjs — render a few seconds of a manifest-driven episode to mp4,
 * to see one segment in context (the cut in, the segment, the cut out).
 *
 * Renders in QA mode (inputProps.qa = true, see src/utils/qaMode.ts), so audio
 * is skipped and missing music / ambient files can't fail the render. The
 * output is picture only.
 *
 * Usage:
 *   node scripts/preview-range.mjs --episode=ai-care-motives --from=356 --to=370
 *   node scripts/preview-range.mjs --episode=ai-care-motives --segment=beat5-seg27 [--pad=2]
 *   node scripts/preview-range.mjs --episode=ai-care-motives --from=0 --to=678.6 --scale=0.5
 *
 * --scale=0.5 renders at half size (960x540) for watch-throughs.
 *
 * remotion.config.ts only applies to the CLI, so the settings that matter are
 * repeated here: the GPU-backed GL renderer and BT.709 colour. Frames stay
 * JPEG (the config's PNG is for masters; a preview does not need it).
 *
 * Output: out/preview/<slug>/<from>-<to>[@<scale>x].mp4
 */

import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
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
if (!slug || (!args.segment && (args.from === undefined || args.to === undefined))) {
  console.error("usage: preview-range.mjs --episode=<slug> (--from=<sec> --to=<sec> | --segment=<id> [--pad=<sec>])");
  process.exit(1);
}

let from = Number(args.from);
let to = Number(args.to);
if (args.segment) {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, "data/episodes", slug, "assembly-manifest.json"), "utf8"),
  );
  const seg = manifest.segments.find((s) => s.id === args.segment);
  if (!seg) {
    console.error(`No segment ${args.segment} in the ${slug} manifest.`);
    process.exit(1);
  }
  const pad = Number(args.pad ?? 2);
  from = Math.max(0, seg.startSec - pad);
  to = seg.endSec + pad;
}

const outDir = path.join(ROOT, "out/preview", slug);
fs.mkdirSync(outDir, { recursive: true });
const scale = Number(args.scale ?? 1);
const suffix = scale === 1 ? "" : `@${scale}x`;
const out = path.join(outDir, `${from.toFixed(1)}-${to.toFixed(1)}${suffix}.mp4`);

const inputProps = { qa: true };
const chromiumOptions = args.gl === "default" ? {} : { gl: args.gl ?? "angle" };
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts") });
const composition = await selectComposition({
  serveUrl,
  id: args.comp ?? `${slug}-full`,
  inputProps,
  chromiumOptions,
});
const fps = composition.fps;
const frameRange = [Math.round(from * fps), Math.min(composition.durationInFrames - 1, Math.round(to * fps))];

console.log(`Rendering ${from.toFixed(1)}s–${to.toFixed(1)}s (frames ${frameRange[0]}–${frameRange[1]})…`);
const renderStart = Date.now();
await renderMedia({
  composition,
  serveUrl,
  inputProps,
  codec: "h264",
  scale,
  chromiumOptions,
  colorSpace: "bt709",
  pixelFormat: "yuv420p",
  frameRange,
  muted: true,
  logLevel: "error",
  // QA mode makes <QaProbe> log every frame's text measurements; a preview
  // has no use for them, so swallow page console output.
  onBrowserLog: () => undefined,
  outputLocation: out,
  onProgress: ({ progress }) => {
    if (Math.round(progress * 100) % 25 === 0) process.stdout.write(`\r${Math.round(progress * 100)}%`);
  },
});
const renderSec = (Date.now() - renderStart) / 1000;
const frames = frameRange[1] - frameRange[0] + 1;
console.log(`\nSaved ${path.relative(process.cwd(), out)} — ${frames} frames in ${renderSec.toFixed(0)}s (${(frames / renderSec).toFixed(1)} fps)`);
