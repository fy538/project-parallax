#!/usr/bin/env node
/**
 * render-lambda.mjs — Render compositions via Remotion Lambda.
 *
 * Prerequisites:
 *   Run deploy-lambda.mjs first to get REMOTION_FUNCTION_NAME and REMOTION_SERVE_URL.
 *
 * Usage:
 *   # Render a single composition
 *   node scripts/render-lambda.mjs --comp=DataChart --props=data/episodes/ep01/chart-lithography.json
 *
 *   # Render all EP01 clips
 *   node scripts/render-lambda.mjs --episode=ep01
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

// ── EP01 sequence (matches render-episode.mjs) ────────────────────────────

const EP01_SEQUENCE = [
  // Opening
  { comp: "TitleTransition", file: "title-episode.json" },
  // Beat 1 — The Paradox
  { comp: "TitleTransition", file: "title-section-paradox.json" },
  { comp: "KineticTypography", file: "kinetic-92-yield.json" },
  { comp: "KineticTypography", file: "kinetic-165b.json" },
  { comp: "DataChart", file: "chart-7pct-demand.json" },
  // Beat 2 — The Logic of Denial
  { comp: "TitleTransition", file: "title-section-denial.json" },
  { comp: "TimelineComparison", file: "timeline-oil-chips.json" },
  { comp: "KineticTypography", file: "kinetic-revenue-deal.json" },
  { comp: "DataChart", file: "chart-chips-act.json" },
  { comp: "ChoroplethMap", file: "choropleth-cocom.json" },
  { comp: "FrameworkDiagram", file: "framework-cocom-china.json" },
  // Beat 3 — The Other Side of the Wall
  { comp: "TitleTransition", file: "title-section-wall.json" },
  { comp: "KineticTypography", file: "kinetic-kabozi.json" },
  { comp: "KineticTypography", file: "kinetic-juguo.json" },
  { comp: "DataChart", file: "chart-lithography.json" },
  { comp: "DataChart", file: "chart-smic-yield.json" },
  { comp: "FrameworkDiagram", file: "framework-kirin-teardown.json" },
  { comp: "KineticTypography", file: "kinetic-deepseek-zero.json" },
  // Beat 4 — The Trap
  { comp: "TitleTransition", file: "title-section-trap.json" },
  { comp: "FrameworkDiagram", file: "framework-chess-go.json" },
  { comp: "RouteAnimation", file: "route-chip-supply.json" },
  { comp: "KineticTypography", file: "kinetic-trap.json" },
  { comp: "ChoroplethMap", file: "choropleth-caught-between.json" },
  { comp: "KineticTypography", file: "kinetic-morris-chang.json" },
  // Beat 5 — Your Chips
  { comp: "TitleTransition", file: "title-section-chips.json" },
  { comp: "FrameworkDiagram", file: "framework-ai-timeline.json" },
  // Closing
  { comp: "TitleTransition", file: "title-endcard.json" },
];

// ── Render a single composition ────────────────────────────────────────────

async function renderSingle(composition, propsFile, { still, frame }) {
  const dataPath = path.resolve(__dirname, "..", propsFile);
  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const inputProps = { data };

  console.log(`\n🎬 Rendering ${composition} from ${path.basename(propsFile)}...`);

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
    imageFormat: "jpeg",
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
      console.log(`  ✓ Complete: ${progress.outputFile}`);
      done = true;
      return progress.outputFile;
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
  const dataDir = `data/episodes/${episode}`;
  console.log(`\n🎬 Rendering all ${EP01_SEQUENCE.length} clips for ${episode}...\n`);

  const results = [];
  for (let i = 0; i < EP01_SEQUENCE.length; i++) {
    const { comp, file } = EP01_SEQUENCE[i];
    const num = String(i + 1).padStart(2, "0");
    console.log(`[${num}/${EP01_SEQUENCE.length}] ${comp} — ${file}`);
    const url = await renderSingle(comp, `${dataDir}/${file}`, {});
    results.push({ num, file, url });
  }

  console.log("\n━".repeat(50));
  console.log(`✅ All ${results.length} clips rendered.\n`);
  results.forEach((r) => console.log(`  ${r.num}. ${r.file} → ${r.url}`));
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
  console.log("  node scripts/render-lambda.mjs --comp=DataChart --props=data/episodes/ep01/chart-lithography.json");
  console.log("  node scripts/render-lambda.mjs --episode=ep01");
  console.log("  node scripts/render-lambda.mjs --comp=DataChart --props=... --still --frame=60");
}
