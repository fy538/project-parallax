#!/usr/bin/env node
/**
 * render-episode.mjs — Universal episode render script
 *
 * Reads the SEQUENCE.md-aligned sequence array, loads JSON data files,
 * and calls `npx remotion render` (or `still`) for each composition.
 *
 * Usage:
 *   node scripts/render-episode.mjs silicon-trap                    # Render all MP4s
 *   node scripts/render-episode.mjs silicon-trap --preview          # Render stills at frame 90
 *   node scripts/render-episode.mjs silicon-trap --concat           # Also make preview reel
 *   node scripts/render-episode.mjs silicon-trap --only=05,06,07    # Render specific clips
 *   node scripts/render-episode.mjs silicon-trap --from=16          # Render from clip 16 onward
 */

import { execSync, spawnSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ─── Episode Sequences ──────────────────────────────────────────────────────
// Single source of truth: scripts/sequences/<slug>.json. Loaded lazily so a
// missing/malformed sequence file produces a clean error message at use time
// (not import time) and so the script can list available episodes without
// requiring all of them to exist.

const SEQUENCES_DIR = join(__dirname, "sequences");

function loadSequence(slug) {
  const p = join(SEQUENCES_DIR, `${slug}.json`);
  if (!existsSync(p)) {
    return null;
  }
  const parsed = JSON.parse(readFileSync(p, "utf-8"));
  return parsed.clips;
}

function availableEpisodes() {
  if (!existsSync(SEQUENCES_DIR)) return [];
  return execSync(`ls ${SEQUENCES_DIR} 2>/dev/null || true`)
    .toString()
    .trim()
    .split("\n")
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

// ─── CLI Args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const episode = args.find((a) => !a.startsWith("--"));
const sequence = episode ? loadSequence(episode) : null;
if (!episode || !sequence) {
  console.error(`Usage: node scripts/render-episode.mjs <episode> [--preview] [--concat] [--only=01,02] [--from=16]`);
  console.error(`Available episodes: ${availableEpisodes().join(", ") || "(none — add scripts/sequences/<slug>.json)"}`);
  process.exit(1);
}

const preview = args.includes("--preview");
const concat = args.includes("--concat");
const onlyArg = args.find((a) => a.startsWith("--only="));
const fromArg = args.find((a) => a.startsWith("--from="));
const onlySet = onlyArg ? new Set(onlyArg.split("=")[1].split(",")) : null;
const fromSeq = fromArg ? fromArg.split("=")[1] : null;

// ─── Browser Detection ──────────────────────────────────────────────────────

let browserArg = "";
// Search macOS + Linux Playwright cache locations
const searchDirs = [
  `${process.env.HOME}/Library/Caches/ms-playwright`,
  `${process.env.HOME}/.cache/ms-playwright`,
];
for (const dir of searchDirs) {
  if (!browserArg) {
    try {
      // Try headless_shell first (Linux), then "Google Chrome for Testing" (macOS)
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
  // Fallback: system Chrome on macOS
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

const dataDir = join(ROOT, "data", "episodes", episode);
const outDir = join(ROOT, "out", episode);
mkdirSync(outDir, { recursive: true });

console.log(`\n${"═".repeat(60)}`);
console.log(`  ${episode.toUpperCase()} Render — ${new Date().toISOString()}`);
console.log(`  Mode: ${preview ? "PREVIEW (stills)" : "FULL (MP4)"}`);
console.log(`  Output: ${outDir}/`);
console.log(`${"═".repeat(60)}\n`);

let rendered = 0, failed = 0, skipped = 0;

for (const { seq, comp, file, desc } of sequence) {
  // Filter logic
  if (onlySet && !onlySet.has(seq)) continue;
  if (fromSeq && seq < fromSeq) continue;

  const jsonPath = join(dataDir, file);
  const slug = file.replace(".json", "");

  if (!existsSync(jsonPath)) {
    console.log(`  [SKIP] #${seq} ${desc} — ${file} not found`);
    skipped++;
    continue;
  }

  // Read data and build props
  const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
  const propsJson = JSON.stringify({ data });

  // Write props to temp file (avoids shell escaping issues with complex JSON)
  const propsFile = join(outDir, `_props-${seq}.json`);
  writeFileSync(propsFile, propsJson);

  const ext = preview ? "png" : "mp4";
  const output = join(outDir, `${seq}-${slug}.${ext}`);
  const label = `[${seq}/${sequence.length}] ${desc}`;

  process.stdout.write(`  ${label}...`);

  const cmdParts = preview
    ? [
        "npx", "remotion", "still", "src/index.ts", comp,
        "--frame=90",
        `--props=${propsFile}`,
        ...(browserArg ? [browserArg] : []),
        `--output=${output}`,
      ]
    : [
        "npx", "remotion", "render", "src/index.ts", comp,
        `--props=${propsFile}`,
        ...(browserArg ? [browserArg] : []),
        output,
      ];

  const result = spawnSync(cmdParts[0], cmdParts.slice(1), {
    cwd: ROOT,
    stdio: ["pipe", "pipe", "pipe"],
    encoding: "utf-8",
    timeout: 120_000,
  });

  if (result.status === 0) {
    console.log(` ✓`);
    rendered++;
  } else {
    console.log(` ✗ FAILED`);
    // Print the last 3 stderr lines inline for quick triage, but ALSO write
    // the full stderr (and stdout) to a per-clip error log so post-mortem
    // diagnosis isn't blocked by terminal-output truncation. Without this,
    // a multi-clip batch that loses one clip leaves you guessing whether
    // the failure was a missing data file, network error, or template throw.
    if (result.stderr) {
      const lastLines = result.stderr.split("\n").slice(-3).join("\n");
      console.log(`    ${lastLines}`);
    }
    const errLog = `${output}.error.log`;
    const sections = [
      `=== ${comp} — ${file} ===`,
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

  // Clean up temp props file
  try { execSync(`rm -f "${propsFile}"`); } catch { /* ignore */ }
}

console.log(`\n${"═".repeat(60)}`);
console.log(`  Done: ${rendered} rendered, ${failed} failed, ${skipped} skipped`);
console.log(`${"═".repeat(60)}`);

// ─── Concatenation ──────────────────────────────────────────────────────────

if (concat && !preview) {
  console.log("\nConcatenating into preview reel...");

  const concatList = sequence
    .map(({ seq, file }) => {
      const mp4 = join(outDir, `${seq}-${file.replace(".json", ".mp4")}`);
      return existsSync(mp4) ? `file '${seq}-${file.replace(".json", ".mp4")}'` : null;
    })
    .filter(Boolean)
    .join("\n");

  const concatFile = join(outDir, "concat.txt");
  writeFileSync(concatFile, concatList);

  const reel = join(outDir, `${episode}-preview-reel.mp4`);
  const ffResult = spawnSync("ffmpeg", [
    "-y", "-f", "concat", "-safe", "0",
    "-i", concatFile,
    "-c:v", "libx264", "-preset", "fast", "-crf", "18",
    "-pix_fmt", "yuv420p",
    reel,
  ], {
    cwd: outDir,
    stdio: ["pipe", "pipe", "pipe"],
    encoding: "utf-8",
  });

  if (ffResult.status === 0) {
    console.log(`  Preview reel: ${reel}`);
  } else {
    console.log(`  ffmpeg failed — ${ffResult.stderr?.split("\n").slice(-2).join(" ")}`);
  }

  try { execSync(`rm -f "${concatFile}"`); } catch { /* ignore */ }
}

console.log(`\nAll outputs in: ${outDir}/`);
