#!/usr/bin/env node
/**
 * render-shorts.mjs — Render YouTube Shorts / TikTok / Douyin (9:16) from a
 * per-episode shorts-manifest.json.
 *
 * Mirrors render-episode.mjs but reads from
 * episodes/<slug>/shorts-manifest.json instead of scripts/sequences/<slug>.json,
 * and writes outputs into episodes/<slug>/shorts/short-NN.{mp4,png}.
 *
 * Why a separate script instead of folding into render-episode.mjs?
 *   - Different source (episode-level manifest, not template/sequence list)
 *   - Different output target (episodes/<slug>/shorts/ — not out/<slug>/)
 *   - Different resolution (1080x1920) — the composition's own
 *     calculateMetadata handles that, but keeping the entry point separate
 *     makes the contract obvious.
 *   - Shorts pipeline is independent of episode assembly-manifest / Whisper
 *     syncPoints. Shorts are standalone, not segments of an episode.
 *
 * Usage:
 *   node scripts/render-shorts.mjs --episode=silicon-trap                # all → MP4
 *   node scripts/render-shorts.mjs --episode=silicon-trap --preview      # frame 30 PNG previews
 *   node scripts/render-shorts.mjs --episode=silicon-trap --only=01,02   # specific shorts
 *   node scripts/render-shorts.mjs --episode=silicon-trap --from=03      # from short 03 onward
 *
 * Manifest schema: data/episodes/_schemas/shorts-manifest.schema.json
 */

import { execSync, spawnSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REPO_ROOT = join(ROOT, "..");

// ─── CLI Args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const episodeArg = args.find((a) => a.startsWith("--episode="));
// Also accept a bare positional argument for parity with render-episode.mjs:
//   node scripts/render-shorts.mjs silicon-trap
const positional = args.find((a) => !a.startsWith("--"));
const episode = episodeArg ? episodeArg.split("=")[1] : positional;

if (!episode) {
  console.error(
    "Usage: node scripts/render-shorts.mjs --episode=<slug> [--preview] [--only=01,02] [--from=03]"
  );
  process.exit(1);
}

const preview = args.includes("--preview");
const onlyArg = args.find((a) => a.startsWith("--only="));
const fromArg = args.find((a) => a.startsWith("--from="));
const onlySet = onlyArg ? new Set(onlyArg.split("=")[1].split(",")) : null;
const fromSeq = fromArg ? fromArg.split("=")[1] : null;

// ─── Manifest ───────────────────────────────────────────────────────────────

const manifestPath = join(REPO_ROOT, "episodes", episode, "shorts-manifest.json");
if (!existsSync(manifestPath)) {
  console.error(`shorts-manifest.json not found at ${manifestPath}`);
  console.error(
    "Create one following the schema at remotion-templates/data/episodes/_schemas/shorts-manifest.schema.json"
  );
  process.exit(1);
}

let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
} catch (e) {
  console.error(`Failed to parse ${manifestPath}: ${e.message}`);
  process.exit(1);
}

if (!Array.isArray(manifest.shorts) || manifest.shorts.length === 0) {
  console.error(`Manifest has no "shorts" array or it is empty: ${manifestPath}`);
  process.exit(1);
}
if (manifest.episode && manifest.episode !== episode) {
  console.warn(
    `  warning: manifest episode "${manifest.episode}" doesn't match --episode=${episode}; using CLI value for output paths`
  );
}

// Allowlist of composition IDs that exist as Shorts. Kept in sync with
// src/templates/Shorts/index.tsx. If you add a new Shorts composition,
// update both files (and the schema's enum). Catching invalid template
// names here gives a clean error message before npx remotion render
// fails with "no composition with the id ...".
const VALID_TEMPLATES = new Set([
  "KineticShort",
  "DataChartShort",
  "SplitShort",
  "StatRevealShort",
  "FrameworkDiagram-Short",
  "ChoroplethMap-Short",
  "SplitComposition-Short",
  "ProbabilityGauge-Short",
  "TimelineComparison-Short",
]);

// ─── Browser Detection ──────────────────────────────────────────────────────
// Copied verbatim from render-episode.mjs — same Playwright/system-Chrome
// fallback chain. Keeps both renderers behaviourally identical from the
// browser-detection standpoint.

let browserArg = "";
const searchDirs = [
  `${process.env.HOME}/Library/Caches/ms-playwright`,
  `${process.env.HOME}/.cache/ms-playwright`,
];
for (const dir of searchDirs) {
  if (!browserArg) {
    try {
      for (const name of ["headless_shell", "Google\\ Chrome\\ for\\ Testing"]) {
        const pw = execSync(`find "${dir}" -name ${name} 2>/dev/null | head -1`, {
          encoding: "utf-8",
        }).trim();
        if (pw) {
          browserArg = `--browser-executable=${pw}`;
          console.log(`Browser: Playwright Chromium (${pw})`);
          break;
        }
      }
    } catch { /* dir doesn't exist, continue */ }
  }
}
if (!browserArg) {
  const sysChromeExe = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  try {
    execSync(`test -x "${sysChromeExe}"`, { encoding: "utf-8" });
    browserArg = `--browser-executable=${sysChromeExe}`;
    console.log("Browser: system Chrome");
  } catch {
    console.log("Browser: Remotion default");
  }
}

// ─── Render ─────────────────────────────────────────────────────────────────

const outDir = join(REPO_ROOT, "episodes", episode, "shorts");
mkdirSync(outDir, { recursive: true });

console.log(`\n${"═".repeat(60)}`);
console.log(`  ${episode.toUpperCase()} Shorts Render — ${new Date().toISOString()}`);
console.log(`  Mode: ${preview ? "PREVIEW (frame-30 PNGs)" : "FULL (1080x1920 MP4)"}`);
console.log(`  Shorts: ${manifest.shorts.length}`);
console.log(`  Output: ${outDir}/`);
console.log(`${"═".repeat(60)}\n`);

let rendered = 0;
let failed = 0;
let skipped = 0;

for (const short of manifest.shorts) {
  const { id, label, template, data: rawData, durationSec } = short;

  if (!id || !template || !rawData) {
    console.log(`  [SKIP] short missing required field id/template/data: ${JSON.stringify(short).slice(0, 80)}…`);
    skipped++;
    continue;
  }
  if (onlySet && !onlySet.has(id)) continue;
  if (fromSeq && id < fromSeq) continue;

  if (!VALID_TEMPLATES.has(template)) {
    console.log(`  [SKIP] #${id} ${label ?? ""} — unknown template "${template}"`);
    console.log(`         valid: ${[...VALID_TEMPLATES].join(", ")}`);
    skipped++;
    continue;
  }

  // Pull `_render` overrides off the data (same convention as
  // render-episode.mjs). Allows per-short crf / image-format / scale tweaks
  // without polluting the template's prop shape.
  const renderOverrides = rawData._render ?? {};
  const { _render: _stripped, ...data } = rawData;
  void _stripped;

  // If durationSec is on the short envelope, push it into data so
  // calculateMetadata picks it up. Manifest-level override beats inline.
  if (durationSec !== undefined) {
    data.durationSec = durationSec;
  }

  const propsJson = JSON.stringify({ data });
  const propsFile = join(outDir, `_props-${id}.json`);
  writeFileSync(propsFile, propsJson);

  const renderFlags = [];
  if (renderOverrides.crf !== undefined) renderFlags.push(`--crf=${renderOverrides.crf}`);
  if (renderOverrides.imageFormat) renderFlags.push(`--image-format=${renderOverrides.imageFormat}`);
  if (renderOverrides.pixelFormat) renderFlags.push(`--pixel-format=${renderOverrides.pixelFormat}`);
  if (renderOverrides.scale !== undefined) renderFlags.push(`--scale=${renderOverrides.scale}`);
  if (renderFlags.length > 0) {
    process.stdout.write(`  [overrides: ${renderFlags.join(" ")}] `);
  }

  const ext = preview ? "png" : "mp4";
  const output = join(outDir, `short-${id}.${ext}`);
  const labelStr = `[${id}] ${label ?? template}`;

  process.stdout.write(`  ${labelStr}...`);

  // Preview uses frame 30 (1s in at 30fps) — far enough into the entrance
  // animation that hero elements have appeared, but before any holdout/exit
  // pause. render-episode.mjs uses frame 90 (which targets the 3s hold of
  // typical 5–10s long-form clips); Shorts often run 8–12s with faster
  // entrance, so frame 30 is the right "is this readable?" sample point.
  const cmdParts = preview
    ? [
        "npx", "remotion", "still", "src/index.ts", template,
        "--frame=30",
        `--props=${propsFile}`,
        ...(browserArg ? [browserArg] : []),
        ...renderFlags,
        `--output=${output}`,
      ]
    : [
        "npx", "remotion", "render", "src/index.ts", template,
        `--props=${propsFile}`,
        ...(browserArg ? [browserArg] : []),
        ...renderFlags,
        output,
      ];

  const result = spawnSync(cmdParts[0], cmdParts.slice(1), {
    cwd: ROOT,
    stdio: ["pipe", "pipe", "pipe"],
    encoding: "utf-8",
    timeout: 180_000,
  });

  if (result.status === 0) {
    console.log(" ✓");
    rendered++;
  } else {
    console.log(" ✗ FAILED");
    if (result.stderr) {
      const lastLines = result.stderr.split("\n").slice(-3).join("\n");
      console.log(`    ${lastLines}`);
    }
    const errLog = `${output}.error.log`;
    const sections = [
      `=== ${template} — short ${id} (${label ?? ""}) ===`,
      `cmd: ${cmdParts.join(" ")}`,
      `status: ${result.status}  signal: ${result.signal || "none"}`,
      "",
      "─── stdout ───",
      result.stdout || "(empty)",
      "",
      "─── stderr ───",
      result.stderr || "(empty)",
      "",
    ].join("\n");
    try {
      writeFileSync(errLog, sections, "utf-8");
      console.log(`    full stderr → ${errLog}`);
    } catch { /* ignore */ }
    failed++;
  }

  try { execSync(`rm -f "${propsFile}"`); } catch { /* ignore */ }
}

console.log(`\n${"═".repeat(60)}`);
console.log(`  Done: ${rendered} rendered, ${failed} failed, ${skipped} skipped`);
console.log(`${"═".repeat(60)}`);
console.log(`\nAll outputs in: ${outDir}/`);

if (failed > 0) process.exit(1);
