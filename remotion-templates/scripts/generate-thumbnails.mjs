#!/usr/bin/env node
/**
 * generate-thumbnails.mjs — Batch-render every thumbnail concept for an episode.
 *
 * Reads `episodes/<slug>/thumbnail-spec.json` (schema:
 * `remotion-templates/data/episodes/_schemas/thumbnail-spec.schema.json`),
 * walks each concept entry, and invokes `npx remotion still Thumbnail`
 * to write `concept-<id>.png` into `episodes/<slug>/thumbnails/`.
 *
 * Each concept's `data` block is passed as `props.data` to the Thumbnail
 * composition — the script does not synthesize fields. See
 * `src/templates/Thumbnail/types.ts` for the `ThumbnailData` shape.
 *
 * Usage:
 *   node scripts/generate-thumbnails.mjs --episode=silicon-trap
 *   node scripts/generate-thumbnails.mjs --episode=silicon-trap --only=a,c
 *
 * Exit code is non-zero if any concept fails to render.
 */
import { execSync, spawnSync } from "child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync } from "fs";
import { join, dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const REPO_ROOT = resolve(ROOT, "..");

// ─── CLI Args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const episodeArg = args.find((a) => a.startsWith("--episode="));
const onlyArg = args.find((a) => a.startsWith("--only="));

if (!episodeArg) {
  console.error("Usage: node scripts/generate-thumbnails.mjs --episode=<slug> [--only=a,b]");
  process.exit(1);
}

const episode = episodeArg.split("=")[1];
const onlySet = onlyArg ? new Set(onlyArg.split("=")[1].split(",")) : null;

// ─── Load spec ──────────────────────────────────────────────────────────────

const specPath = join(REPO_ROOT, "episodes", episode, "thumbnail-spec.json");
if (!existsSync(specPath)) {
  console.error(`Spec not found: ${specPath}`);
  console.error(`Expected file: episodes/${episode}/thumbnail-spec.json`);
  process.exit(1);
}

let spec;
try {
  spec = JSON.parse(readFileSync(specPath, "utf-8"));
} catch (e) {
  console.error(`Failed to parse ${specPath}: ${e.message}`);
  process.exit(1);
}

if (!spec.concepts || !Array.isArray(spec.concepts) || spec.concepts.length === 0) {
  console.error(`Spec ${specPath} has no concepts to render`);
  process.exit(1);
}

// Validate IDs are unique — a duplicate would silently overwrite an output
const seen = new Set();
for (const c of spec.concepts) {
  if (!c.id) {
    console.error(`Concept missing required 'id' field: ${JSON.stringify(c).slice(0, 80)}`);
    process.exit(1);
  }
  if (seen.has(c.id)) {
    console.error(`Duplicate concept id: '${c.id}' — each id must be unique`);
    process.exit(1);
  }
  seen.add(c.id);
}

// ─── Browser detection (mirrors render-episode.mjs) ─────────────────────────

let browserArg = "";
const searchDirs = [
  `${process.env.HOME}/Library/Caches/ms-playwright`,
  `${process.env.HOME}/.cache/ms-playwright`,
];
for (const dir of searchDirs) {
  if (browserArg) break;
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
  } catch { /* dir doesn't exist */ }
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

// ─── Render loop ────────────────────────────────────────────────────────────

const outDir = join(REPO_ROOT, "episodes", episode, "thumbnails");
mkdirSync(outDir, { recursive: true });

console.log(`\n${"═".repeat(60)}`);
console.log(`  Thumbnails — ${episode}`);
console.log(`  Spec: ${specPath}`);
console.log(`  Output: ${outDir}/`);
console.log(`  Concepts: ${spec.concepts.length}${onlySet ? ` (filter: ${[...onlySet].join(",")})` : ""}`);
console.log(`${"═".repeat(60)}\n`);

let rendered = 0, failed = 0, skipped = 0;

for (const concept of spec.concepts) {
  if (onlySet && !onlySet.has(concept.id)) {
    skipped++;
    continue;
  }

  const label = concept.label ? ` — ${concept.label}` : "";
  const output = join(outDir, `concept-${concept.id}.png`);

  // Write props to a temp file to avoid shell escaping issues with embedded
  // JSON (mirrors render-episode.mjs convention).
  const propsFile = join(outDir, `_props-${concept.id}.json`);
  writeFileSync(propsFile, JSON.stringify({ data: concept.data }));

  // Frame 15 sits inside the opacity-1 window of the Thumbnail composition
  // (enter fade 0-8, exit fade 15-30; see Thumbnail/index.tsx). Frame 0 would
  // render blank because both enter and exit ramps clamp opacity to 0 there.
  const cmdParts = [
    "npx", "remotion", "still", "src/index.ts", "Thumbnail",
    "--frame=15",
    `--props=${propsFile}`,
    ...(browserArg ? [browserArg] : []),
    `--output=${output}`,
  ];

  process.stdout.write(`  [concept-${concept.id}]${label}...`);
  const t0 = Date.now();
  const result = spawnSync(cmdParts[0], cmdParts.slice(1), {
    cwd: ROOT,
    stdio: ["pipe", "pipe", "pipe"],
    encoding: "utf-8",
    timeout: 120_000,
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

  if (result.status === 0) {
    console.log(` ✓ (${elapsed}s) → ${output}`);
    rendered++;
  } else {
    console.log(` ✗ FAILED (${elapsed}s)`);
    if (result.stderr) {
      const tail = result.stderr.split("\n").slice(-3).join("\n");
      console.log(`    ${tail}`);
    }
    const errLog = `${output}.error.log`;
    const sections = [
      `=== Thumbnail — concept-${concept.id} ===`,
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

  try { unlinkSync(propsFile); } catch { /* ignore */ }
}

console.log(`\n${"═".repeat(60)}`);
console.log(`  Done: ${rendered} rendered, ${failed} failed, ${skipped} skipped`);
console.log(`${"═".repeat(60)}\n`);

process.exit(failed > 0 ? 1 : 0);
