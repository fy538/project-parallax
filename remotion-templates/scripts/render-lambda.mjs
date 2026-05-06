#!/usr/bin/env node
/**
 * render-lambda.mjs — Render compositions via Remotion Lambda.
 *
 * Prerequisites:
 *   Run deploy-lambda.mjs first to get REMOTION_FUNCTION_NAME and REMOTION_SERVE_URL.
 *
 * Usage:
 *   # Render a single composition
 *   node scripts/render-lambda.mjs --comp=DataChart --props=data/episodes/silicon-trap/chart-lithography.json
 *
 *   # Render all SILICON_TRAP clips
 *   node scripts/render-lambda.mjs --episode=silicon-trap
 *
 *   # Render a still (single frame)
 *   node scripts/render-lambda.mjs --comp=DataChart --props=chart-lithography.json --still --frame=60
 *
 * Environment variables:
 *   REMOTION_AWS_REGION (default: us-east-1)
 *   REMOTION_FUNCTION_NAME (from deploy-lambda.mjs)
 *   REMOTION_SERVE_URL (from deploy-lambda.mjs)
 */

import {
  renderMediaOnLambda,
  renderStillOnLambda,
  getRenderProgress,
} from "@remotion/lambda";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const REGION = process.env.REMOTION_AWS_REGION || "us-east-1";
const FUNCTION_NAME = process.env.REMOTION_FUNCTION_NAME;
const SERVE_URL = process.env.REMOTION_SERVE_URL;

if (!FUNCTION_NAME || !SERVE_URL) {
  console.error("Missing REMOTION_FUNCTION_NAME or REMOTION_SERVE_URL.");
  console.error("Run: node scripts/deploy-lambda.mjs first.");
  process.exit(1);
}

// ── Parse CLI args ─────────────────────────────────────────────────────────

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    const [key, val] = arg.replace(/^--/, "").split("=");
    args[key] = val || true;
  });
  return args;
}

// ── Episode sequences ─────────────────────────────────────────────────────
// Single source of truth: scripts/sequences/<slug>.json. Same file
// render-episode.mjs uses, so any clip add/remove/reorder lands in one place.

function loadSequence(slug) {
  const p = path.join(__dirname, "sequences", `${slug}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8")).clips;
}

// ── Render a single composition ────────────────────────────────────────────

async function renderSingle(composition, propsFile, { still, frame }) {
  const dataPath = path.resolve(__dirname, "..", propsFile);
  // Per-clip render overrides live in an optional `_render` block on the
  // data file. See render-episode.mjs for full schema documentation; both
  // render paths honor the same fields so a clip's quality intent travels
  // with its data.
  const rawData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const renderOverrides = rawData._render ?? {};
  const { _render: _stripped, ...data } = rawData;
  void _stripped;
  const inputProps = { data };

  console.log(`\n🎬 Rendering ${composition} from ${path.basename(propsFile)}...`);
  if (Object.keys(renderOverrides).length > 0) {
    console.log(`  overrides: ${JSON.stringify(renderOverrides)}`);
  }

  if (still) {
    const { url } = await renderStillOnLambda({
      region: REGION,
      functionName: FUNCTION_NAME,
      serveUrl: SERVE_URL,
      composition,
      inputProps,
      frame: parseInt(frame) || 60,
      imageFormat: "png",
    });
    console.log(`  ✓ Still: ${url}`);
    return url;
  }

  const { renderId, bucketName } = await renderMediaOnLambda({
    region: REGION,
    functionName: FUNCTION_NAME,
    serveUrl: SERVE_URL,
    composition,
    inputProps,
    codec: "h264",
    // PNG intermediate frames (lossless) — matches local render config. JPEG
    // would introduce quantization artifacts on hairline graphics + text
    // before H.264 encoding. ~20-30% longer per-frame render; quality lift
    // is worth it for a graphics-heavy channel. Per-clip _render overrides
    // (below) trump these defaults.
    imageFormat: renderOverrides.imageFormat ?? "png",
    pixelFormat: renderOverrides.pixelFormat ?? "yuv420p",
    ...(renderOverrides.crf !== undefined ? { crf: renderOverrides.crf } : {}),
    ...(renderOverrides.scale !== undefined ? { scale: renderOverrides.scale } : {}),
    framesPerLambda: 20,
  });

  console.log(`  Render ID: ${renderId}`);

  // Poll progress
  let done = false;
  while (!done) {
    const progress = await getRenderProgress({
      region: REGION,
      renderId,
      bucketName,
      functionName: FUNCTION_NAME,
    });

    if (progress.done) {
      const cost = progress.costs?.displayCost ?? "unknown";
      const elapsed = progress.timeToFinish
        ? `${(progress.timeToFinish / 1000).toFixed(1)}s`
        : "n/a";
      console.log(`  ✓ Complete: ${progress.outputFile}`);
      console.log(`    cost: ${cost}  ·  render time: ${elapsed}`);
      done = true;
      return {
        outputFile: progress.outputFile,
        accruedCost: progress.costs?.accruedSoFar ?? 0,
        displayCost: cost,
        renderMs: progress.timeToFinish ?? 0,
      };
    }

    if (progress.fatalErrorEncountered) {
      console.error(`  ✗ Error: ${progress.errors?.[0]?.message}`);
      process.exit(1);
    }

    const pct = Math.round((progress.overallProgress || 0) * 100);
    process.stdout.write(`  Progress: ${pct}%\r`);
    await new Promise((r) => setTimeout(r, 2000));
  }
}

// ── Render full episode ────────────────────────────────────────────────────

async function renderEpisode(episode) {
  const sequence = loadSequence(episode);
  if (!sequence) {
    console.error(`No sequence found at scripts/sequences/${episode}.json`);
    process.exit(1);
  }
  const dataDir = `data/episodes/${episode}`;
  console.log(`\n🎬 Rendering all ${sequence.length} clips for ${episode}...\n`);

  const results = [];
  for (let i = 0; i < sequence.length; i++) {
    const { comp, file } = sequence[i];
    const num = String(i + 1).padStart(2, "0");
    console.log(`[${num}/${sequence.length}] ${comp} — ${file}`);
    const result = await renderSingle(comp, `${dataDir}/${file}`, {});
    results.push({ num, file, ...result });
  }

  // Aggregate cost + time across the whole episode
  const totalCost = results.reduce((sum, r) => sum + (r.accruedCost || 0), 0);
  const totalRenderMs = results.reduce((sum, r) => sum + (r.renderMs || 0), 0);
  const currency = results[0]?.displayCost?.split(" ")?.[1] || "USD";

  console.log("\n━".repeat(50));
  console.log(`✅ All ${results.length} clips rendered.`);
  console.log(`   Total Lambda cost: $${totalCost.toFixed(4)} ${currency}`);
  console.log(`   Total render time: ${(totalRenderMs / 1000).toFixed(1)}s wall · ${(totalRenderMs / 60000).toFixed(1)} min\n`);
  results.forEach((r) =>
    console.log(`  ${r.num}. ${r.file.padEnd(38)} ${r.displayCost ?? "?"}  ${r.outputFile}`),
  );

  // Append a one-line summary to episodes/COST_LOG.md if it exists
  const costLog = path.resolve(__dirname, "../../episodes/COST_LOG.md");
  if (fs.existsSync(costLog) && totalCost > 0) {
    const today = new Date().toISOString().slice(0, 10);
    const note = `${results.length} clips, ${(totalRenderMs / 60000).toFixed(1)}min render`;
    const row = `| ${today} | ${episode} | lambda | ${totalCost.toFixed(4)} | ${note} |`;
    const text = fs.readFileSync(costLog, "utf-8");
    const sepIdx = text.indexOf("|---|---|---|---|---|");
    if (sepIdx >= 0) {
      const insertAt = text.indexOf("\n", sepIdx) + 1;
      const updated = text.slice(0, insertAt) + row + "\n" + text.slice(insertAt);
      fs.writeFileSync(costLog, updated, "utf-8");
      console.log(`   → appended to episodes/COST_LOG.md`);
    }
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

const args = parseArgs();

if (args.episode) {
  renderEpisode(args.episode).catch(console.error);
} else if (args.comp && args.props) {
  renderSingle(args.comp, args.props, {
    still: args.still,
    frame: args.frame,
  }).catch(console.error);
} else {
  console.log("Usage:");
  console.log("  node scripts/render-lambda.mjs --comp=DataChart --props=data/episodes/silicon-trap/chart-lithography.json");
  console.log("  node scripts/render-lambda.mjs --episode=silicon-trap");
  console.log("  node scripts/render-lambda.mjs --comp=DataChart --props=... --still --frame=60");
}
