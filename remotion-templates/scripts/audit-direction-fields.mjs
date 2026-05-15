#!/usr/bin/env node
/**
 * audit-direction-fields.mjs — orphan detector for `_direction` blocks.
 *
 * Compares:
 *   AUTHORED  — every key found inside a `_direction` object in any JSON
 *               data file under `data/episodes/`.
 *   CANONICAL — every explicit field declared in `DirectionBlockSchema`
 *               (`src/hooks/directionBlock.schema.ts`).
 *
 * ORPHANED authored keys (in JSON but not canonical) are almost always
 * typos that silently fall through `.passthrough()` Zod validation and
 * never take effect at render time — e.g. `paceProfilee`, `holdafter`,
 * `transitionout`. This script surfaces them before a render, not after.
 *
 * NEVER-AUTHORED canonical keys are listed as informational hints — they
 * indicate features wired in code but not yet used in any episode data.
 *
 * Usage:
 *   node scripts/audit-direction-fields.mjs                    # all episodes
 *   node scripts/audit-direction-fields.mjs --episode=silicon-trap
 *   node scripts/audit-direction-fields.mjs --json             # machine output
 *   node scripts/audit-direction-fields.mjs --strict           # exit 1 if any orphan
 *
 * Exit codes:
 *   0 — clean (no orphans found, or --strict not set)
 *   1 — orphans found AND --strict flag is set
 *   2 — internal error (schema parse failed, data dir missing, etc.)
 *
 * CI integration (add to scripts/check-episode.sh):
 *   node scripts/audit-direction-fields.mjs --episode=$SLUG --strict
 */

import { readFileSync, readdirSync, statSync, existsSync } from "fs";
import { join, relative, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── CLI args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const episodeFilter = args.find((a) => a.startsWith("--episode="))?.split("=")[1];
const jsonOutput = args.includes("--json");
const strict = args.includes("--strict");
const showHelp = args.includes("--help") || args.includes("-h");

if (showHelp) {
  console.log(`
audit-direction-fields — detect orphaned _direction keys in episode data files

Usage:
  node scripts/audit-direction-fields.mjs [options]

Options:
  --episode=<slug>   Limit scan to one episode (e.g. --episode=silicon-trap)
  --json             Output machine-readable JSON instead of pretty-print
  --strict           Exit 1 if any orphaned keys are found (for CI gating)
  -h, --help         Show this help

Exit codes:
  0  Clean — no orphans (or --strict not set)
  1  Orphans found with --strict
  2  Internal error (missing schema, bad JSON, etc.)
`);
  process.exit(0);
}

// ── Step 1: Parse canonical keys from DirectionBlockSchema ─────────────────
//
// We parse the TypeScript source with a lightweight regex rather than
// executing TS. The schema file has a stable structure:
//
//   export const DirectionBlockSchema = z
//     .object({
//       fieldName: z.something().optional(),
//       ...
//     })
//     .passthrough();
//
// We extract every `  fieldName:` inside the .object({...}) call.

const SCHEMA_PATH = join(ROOT, "src/hooks/directionBlock.schema.ts");

function parseCanonicalKeys() {
  if (!existsSync(SCHEMA_PATH)) {
    console.error(`[audit-direction] ERROR: schema not found at ${SCHEMA_PATH}`);
    process.exit(2);
  }

  const src = readFileSync(SCHEMA_PATH, "utf-8");
  const lines = src.split("\n");

  // Find the start line: "DirectionBlockSchema = z"
  const startIdx = lines.findIndex((l) =>
    /DirectionBlockSchema\s*=\s*z/.test(l)
  );
  if (startIdx === -1) {
    console.error("[audit-direction] ERROR: could not find DirectionBlockSchema in schema file");
    process.exit(2);
  }

  // Walk forward from startIdx, tracking brace depth.
  // The first `{` opens depth 1 (the outer .object({)).
  // We want keys at depth 1 only — the line-by-line entries directly inside
  // the outer object. Nested objects (narrationGate) are depth 2+.
  let depth = 0;
  let insideOuterObject = false;
  const keys = new Set();

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];

    // Count brace delta for this line (naive but works for well-formatted TS)
    for (const ch of line) {
      if (ch === "{") {
        depth++;
        if (depth === 1) insideOuterObject = true;
      }
      if (ch === "}") {
        if (depth === 1) {
          insideOuterObject = false;
          depth--;
          // Closed the outer object; stop scanning.
          break;
        }
        depth--;
      }
    }

    // We're interested in lines at depth exactly 1 (direct children of z.object)
    // After processing braces on this line, check if we were AT depth 1 for the key.
    // Simpler: re-scan the line for `  key:` pattern and only include if we
    // haven't descended into a nested object on this line.
    if (insideOuterObject && depth === 1) {
      // Skip comment lines
      const trimmed = line.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;

      // Match top-level field name: starts with optional spaces, then `word:`
      const keyMatch = line.match(/^\s{2,4}(\w+)\s*:/);
      if (keyMatch) {
        keys.add(keyMatch[1]);
      }
    }
  }

  if (keys.size === 0) {
    console.error("[audit-direction] ERROR: schema parser extracted 0 keys — check schema format");
    process.exit(2);
  }

  return keys;
}

// ── Step 2: Walk JSON data files and collect _direction usages ─────────────

const DATA_DIR = join(ROOT, "data/episodes");

/**
 * Recursively walk an object, collecting every `_direction` block found
 * at any depth. Returns an array of { path: string, block: object } entries
 * where `path` is the JSON key-path from root (e.g. "segments[3].template").
 */
function collectDirectionBlocks(obj, jsonPath = "") {
  const found = [];
  if (!obj || typeof obj !== "object") return found;

  if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      found.push(...collectDirectionBlocks(item, `${jsonPath}[${i}]`));
    });
    return found;
  }

  for (const [key, val] of Object.entries(obj)) {
    const childPath = jsonPath ? `${jsonPath}.${key}` : key;
    if (key === "_direction" && val && typeof val === "object" && !Array.isArray(val)) {
      found.push({ jsonPath: childPath, block: val });
    } else {
      found.push(...collectDirectionBlocks(val, childPath));
    }
  }

  return found;
}

function getEpisodeDirs() {
  if (!existsSync(DATA_DIR)) {
    console.error(`[audit-direction] ERROR: data directory not found at ${DATA_DIR}`);
    process.exit(2);
  }
  return readdirSync(DATA_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .filter((e) => !episodeFilter || e.name === episodeFilter)
    .map((e) => e.name);
}

function scanEpisode(slug) {
  const dir = join(DATA_DIR, slug);
  const results = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.name.endsWith(".json")) continue;
    const filePath = join(dir, entry.name);
    const relPath = relative(ROOT, filePath);

    let parsed;
    try {
      parsed = JSON.parse(readFileSync(filePath, "utf-8"));
    } catch (e) {
      results.push({
        file: relPath,
        error: `JSON parse error: ${e.message}`,
        blocks: [],
      });
      continue;
    }

    const blocks = collectDirectionBlocks(parsed);
    if (blocks.length > 0) {
      results.push({ file: relPath, error: null, blocks });
    }
  }

  return results;
}

// ── Step 3: Cross-reference and classify ──────────────────────────────────

function classify(canonical, episodeResults) {
  /** Map: key → Set of file paths where it appears */
  const authored = new Map(); // key → [{file, jsonPath}]

  for (const { file, blocks } of episodeResults) {
    for (const { jsonPath, block } of blocks) {
      for (const key of Object.keys(block)) {
        if (!authored.has(key)) authored.set(key, []);
        authored.get(key).push({ file, jsonPath });
      }
    }
  }

  const orphans = []; // authored keys NOT in canonical schema
  const neverAuthored = []; // canonical keys never used in any data file

  for (const [key, usages] of authored.entries()) {
    if (!canonical.has(key)) {
      orphans.push({ key, usages });
    }
  }
  orphans.sort((a, b) => a.key.localeCompare(b.key));

  for (const key of [...canonical].sort()) {
    if (!authored.has(key)) {
      neverAuthored.push(key);
    }
  }

  return { authored, orphans, neverAuthored };
}

// ── Step 4: Output ─────────────────────────────────────────────────────────

function prettyPrint(canonical, episodeResults, classification) {
  const { orphans, neverAuthored, authored } = classification;

  const totalBlocks = episodeResults.reduce((n, r) => n + r.blocks.length, 0);
  const totalFiles = episodeResults.filter((r) => r.blocks.length > 0).length;
  const errors = episodeResults.filter((r) => r.error);

  console.log("");
  console.log("╔═══════════════════════════════════════════════════════════╗");
  console.log("║           _direction field audit                          ║");
  console.log("╚═══════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`  Canonical keys (from DirectionBlockSchema): ${canonical.size}`);
  console.log(`  Data files scanned:  ${episodeResults.length} files across ${getEpisodeDirs().length} episode(s)`);
  console.log(`  _direction blocks found: ${totalBlocks} in ${totalFiles} file(s)`);
  console.log(`  Unique authored keys: ${authored.size}`);
  if (errors.length > 0) {
    console.log(`  Parse errors: ${errors.length} file(s) skipped`);
  }
  console.log("");

  // ── Orphaned keys ──
  if (orphans.length === 0) {
    console.log("  ✓ No orphaned keys — all authored _direction fields are canonical.");
  } else {
    console.log(`  ✖ ORPHANED KEYS — authored but not in DirectionBlockSchema:`);
    console.log(`    These keys are silently ignored at render time (schema is .passthrough()).`);
    console.log(`    Likely causes: typo in key name, renamed field, copy-paste from old script.`);
    console.log("");
    for (const { key, usages } of orphans) {
      console.log(`    ✖ "${key}"`);
      for (const { file, jsonPath } of usages) {
        console.log(`        ${file}  (at ${jsonPath})`);
      }
    }
  }

  console.log("");

  // ── Never-authored canonical keys (info only) ──
  if (neverAuthored.length > 0) {
    console.log(`  ℹ  Canonical fields never used in any data file (${neverAuthored.length}):`);
    console.log(`     These are wired in code but not yet authored in any episode JSON.`);
    // Group by category using comment groupings from the schema
    const grouped = groupByCategory(neverAuthored);
    for (const [cat, keys] of Object.entries(grouped)) {
      console.log(`     ${cat}: ${keys.join(", ")}`);
    }
  }

  // ── Parse errors ──
  if (errors.length > 0) {
    console.log("");
    console.log("  ⚠  Files with parse errors (skipped):");
    for (const { file, error } of errors) {
      console.log(`     ${file}: ${error}`);
    }
  }

  console.log("");
  if (orphans.length > 0) {
    console.log("  Fix: correct the key name to match DirectionBlockSchema.");
    console.log("  Canonical keys: " + [...canonical].sort().join(", "));
  }
  console.log("");
}

/**
 * Group canonical keys into rough categories based on their declaration
 * order in the schema (camera / reveal / hold / cut / mood / pace).
 */
function groupByCategory(keys) {
  const categories = {
    "camera": ["cameraPath", "cameraNote", "proportional", "syncPoints"],
    "reveal": ["revealMode", "staggerMs", "revealEasing", "highlightIndex", "spotlightSequence", "progressive"],
    "hold": ["holdAfter", "holdBehavior", "preDelay", "narrationGate"],
    "cut": ["transitionOut", "washColor", "transitionDuration"],
    "mood": ["atmosphere", "ambientParticles", "musicBedAtmosphereMultiplier", "driftPreset", "globalDim", "backgroundTint"],
    "pace": ["paceProfile"],
  };
  const result = {};
  const categorized = new Set();
  for (const [cat, catKeys] of Object.entries(categories)) {
    const found = catKeys.filter((k) => keys.includes(k));
    if (found.length > 0) {
      result[cat] = found;
      found.forEach((k) => categorized.add(k));
    }
  }
  const uncategorized = keys.filter((k) => !categorized.has(k));
  if (uncategorized.length > 0) result["other"] = uncategorized;
  return result;
}

// ── Main ──────────────────────────────────────────────────────────────────

const canonical = parseCanonicalKeys();
const episodeDirs = getEpisodeDirs();

if (episodeFilter && !episodeDirs.includes(episodeFilter)) {
  console.error(`[audit-direction] ERROR: episode "${episodeFilter}" not found in ${DATA_DIR}`);
  process.exit(2);
}

const allResults = episodeDirs.flatMap((slug) => scanEpisode(slug));
const classification = classify(canonical, allResults);

if (jsonOutput) {
  const { orphans, neverAuthored } = classification;
  console.log(JSON.stringify({
    canonical: [...canonical].sort(),
    orphans: orphans.map(({ key, usages }) => ({ key, usages })),
    neverAuthored,
    summary: {
      canonicalCount: canonical.size,
      orphanCount: orphans.length,
      neverAuthoredCount: neverAuthored.length,
      filesScanned: allResults.length,
      blocksFound: allResults.reduce((n, r) => n + r.blocks.length, 0),
    },
  }, null, 2));
} else {
  prettyPrint(canonical, allResults, classification);
}

if (strict && classification.orphans.length > 0) {
  process.exit(1);
}
