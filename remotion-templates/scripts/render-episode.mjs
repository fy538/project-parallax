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

const EPISODES = {
  silicon-trap: [
    // Opening
    { seq: "01", comp: "TitleTransition", file: "title-episode.json", desc: "Episode title" },
    // Beat 1 — The Paradox
    { seq: "02", comp: "TitleTransition", file: "title-section-paradox.json", desc: "Section I" },
    { seq: "03", comp: "KineticTypography", file: "kinetic-92-yield.json", desc: "92% yield stat" },
    { seq: "04", comp: "KineticTypography", file: "kinetic-165b.json", desc: "$165B stat" },
    { seq: "05", comp: "DataChart", file: "chart-7pct-demand.json", desc: "7% demand bar" },
    // Beat 2 — The Logic of Denial
    { seq: "06", comp: "TitleTransition", file: "title-section-denial.json", desc: "Section II" },
    { seq: "07", comp: "TimelineComparison", file: "timeline-oil-chips.json", desc: "Oil vs chips" },
    { seq: "08", comp: "KineticTypography", file: "kinetic-revenue-deal.json", desc: "Revenue deal" },
    { seq: "09", comp: "DataChart", file: "chart-chips-act.json", desc: "CHIPS Act funnel" },
    { seq: "10", comp: "ChoroplethMap", file: "choropleth-cocom.json", desc: "COCOM map" },
    { seq: "11", comp: "FrameworkDiagram", file: "framework-cocom-china.json", desc: "COCOM vs China" },
    // Beat 3 — The Other Side of the Wall
    { seq: "12", comp: "TitleTransition", file: "title-section-wall.json", desc: "Section III" },
    { seq: "13", comp: "KineticTypography", file: "kinetic-kabozi.json", desc: "Kabozi" },
    { seq: "14", comp: "KineticTypography", file: "kinetic-juguo.json", desc: "Juguo tizhi" },
    { seq: "15", comp: "DataChart", file: "chart-lithography.json", desc: "Lithography passes" },
    { seq: "16", comp: "DataChart", file: "chart-smic-yield.json", desc: "SMIC yield" },
    { seq: "17", comp: "FrameworkDiagram", file: "framework-kirin-teardown.json", desc: "Kirin teardown" },
    { seq: "18", comp: "KineticTypography", file: "kinetic-deepseek-zero.json", desc: "DeepSeek 0 runs" },
    // Beat 4 — The Trap
    { seq: "19", comp: "TitleTransition", file: "title-section-trap.json", desc: "Section IV" },
    { seq: "20", comp: "FrameworkDiagram", file: "framework-chess-go.json", desc: "Chess vs Go" },
    { seq: "21", comp: "RouteAnimation", file: "route-chip-supply.json", desc: "Supply route" },
    { seq: "22", comp: "KineticTypography", file: "kinetic-trap.json", desc: "Trap statement" },
    { seq: "23", comp: "ChoroplethMap", file: "choropleth-caught-between.json", desc: "Caught between" },
    { seq: "24", comp: "KineticTypography", file: "kinetic-morris-chang.json", desc: "Morris Chang" },
    // Beat 5 — Your Chips
    { seq: "25", comp: "TitleTransition", file: "title-section-chips.json", desc: "Section V" },
    { seq: "26", comp: "FrameworkDiagram", file: "framework-ai-timeline.json", desc: "AI timeline" },
    { seq: "27", comp: "RouteAnimation", file: "route-bifurcation.json", desc: "Bifurcation" },
    // Closing
    { seq: "28", comp: "TitleTransition", file: "title-endcard.json", desc: "End card" },
  ],
};

// ─── CLI Args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const episode = args.find((a) => !a.startsWith("--"));
if (!episode || !EPISODES[episode]) {
  console.error(`Usage: node scripts/render-episode.mjs <episode> [--preview] [--concat] [--only=01,02] [--from=16]`);
  console.error(`Available episodes: ${Object.keys(EPISODES).join(", ")}`);
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

const sequence = EPISODES[episode];
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
    if (result.stderr) {
      const lastLines = result.stderr.split("\n").slice(-3).join("\n");
      console.log(`    ${lastLines}`);
    }
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
