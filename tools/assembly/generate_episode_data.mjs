#!/usr/bin/env node
/**
 * generate_episode_data.mjs — Codegen for episode-specific Remotion data files.
 *
 * Reads an assembly manifest, finds every unique template.dataFile reference,
 * and emits two files that would otherwise be written by hand:
 *
 *   1. remotion-templates/src/templates/Episodes/{slug}-data.ts
 *      The static import barrel + TEMPLATE_DATA map consumed by FullEpisode.
 *      (Manually writing this is the biggest per-episode friction point.)
 *
 *   2. remotion-templates/src/templates/Episodes/{PascalSlug}Full.tsx
 *      The Composition registration file. Only written if it doesn't exist
 *      (or --force is passed), so existing customizations are preserved.
 *
 * Usage:
 *   node tools/assembly/generate_episode_data.mjs <episode-slug>
 *   node tools/assembly/generate_episode_data.mjs <episode-slug> --force
 *   node tools/assembly/generate_episode_data.mjs <episode-slug> --data-only
 *
 * Options:
 *   --force      Overwrite {slug}Full.tsx even if it already exists.
 *   --data-only  Only regenerate {slug}-data.ts; skip the composition file.
 *
 * After running, add the composition to src/index.ts:
 *   import { {PascalSlug}FullComposition } from "./templates/Episodes/{PascalSlug}Full";
 *   Then call <{PascalSlug}FullComposition /> inside the top-level registerRoot.
 *
 * Why static imports?
 *   Remotion bundles with webpack at build time. Dynamic require() / import()
 *   inside components won't resolve at render time. All data must be imported
 *   at module level and passed as props. This script automates that constraint.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ── Config ───────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "../..");
const REMOTION_ROOT = path.join(REPO_ROOT, "remotion-templates");
const EPISODES_DATA_DIR = path.join(REMOTION_ROOT, "data/episodes");
const TEMPLATES_EPISODES_DIR = path.join(
  REMOTION_ROOT,
  "src/templates/Episodes"
);

// ── CLI args ─────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--"));
const force = args.includes("--force");
const dataOnly = args.includes("--data-only");

if (!slug) {
  console.error(
    "Usage: node tools/assembly/generate_episode_data.mjs <episode-slug> [--force] [--data-only]"
  );
  console.error("Example: node tools/assembly/generate_episode_data.mjs silicon-trap");
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** "silicon-trap" → "SiliconTrap" */
function toPascalCase(str) {
  return str
    .split(/[-_\s]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

/**
 * "kinetic-92-yield.json" → "kinetic92Yield"
 * Strips .json, camelCases on delimiters. Preserves leading lowercase.
 */
function fileToVarName(filename) {
  const base = filename.replace(/\.json$/, "");
  // Split on hyphens/underscores/spaces, camelCase
  const parts = base.split(/[-_\s]+/);
  return parts
    .map((p, i) => (i === 0 ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join("");
}

// ── Load manifest ─────────────────────────────────────────────────────────────

const manifestPath = path.join(
  EPISODES_DATA_DIR,
  slug,
  "assembly-manifest.json"
);
if (!fs.existsSync(manifestPath)) {
  console.error(`Manifest not found: ${manifestPath}`);
  console.error(`Run generate_manifest.py first, or check the episode slug.`);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

// ── Collect unique dataFiles ──────────────────────────────────────────────────

const dataFiles = new Set();
for (const seg of manifest.segments ?? []) {
  if (seg.template?.dataFile) {
    dataFiles.add(seg.template.dataFile);
  }
}

const sortedFiles = [...dataFiles].sort();

if (sortedFiles.length === 0) {
  console.warn(
    `⚠  No template.dataFile entries found in ${manifestPath}.\n` +
    `   Manifest may only have FOOTAGE/HOLD segments, or template fields are missing.`
  );
}

console.log(
  `\n📋 Episode: ${slug}  |  ${sortedFiles.length} unique data files found\n`
);

// ── Generate {slug}-data.ts ───────────────────────────────────────────────────

const pascal = toPascalCase(slug);

const importLines = sortedFiles.map((f) => {
  const varName = fileToVarName(f);
  return `import ${varName} from "../../../data/episodes/${slug}/${f}";`;
});

const templateDataEntries = sortedFiles.map((f) => {
  const varName = fileToVarName(f);
  return `  "${f}": ${varName},`;
});

const dataFileContent = `/**
 * ${slug}-data.ts — GENERATED FILE
 *
 * Do not edit manually. Regenerate with:
 *   node tools/assembly/generate_episode_data.mjs ${slug}
 *
 * Static import barrel for the "${slug}" episode.
 * Maps assembly-manifest.json template.dataFile names → loaded JSON objects.
 * Consumed by ${pascal}Full.tsx via FullEpisode's templateData prop.
 *
 * Why static imports?
 *   Remotion uses webpack bundling. Dynamic imports at render time are not
 *   supported. All data must be imported at module level.
 *
 * Generated: ${new Date().toISOString().slice(0, 10)}
 * Data files: ${sortedFiles.length}
 */

${importLines.join("\n")}

export const TEMPLATE_DATA: Record<string, unknown> = {
${templateDataEntries.join("\n")}
};
`;

const dataOutPath = path.join(TEMPLATES_EPISODES_DIR, `${slug}-data.ts`);
const dataExists = fs.existsSync(dataOutPath);

// Detect if the existing file was previously generated (safe to overwrite)
const isGenerated =
  dataExists &&
  fs.readFileSync(dataOutPath, "utf8").includes("GENERATED FILE");

if (dataExists && !isGenerated && !force) {
  console.log(
    `⏭  Skipping ${slug}-data.ts — file exists and was NOT generated by this script.\n` +
    `   It may have custom named exports (e.g. for a Series composition).\n` +
    `   Pass --force to overwrite, or manually add missing imports + TEMPLATE_DATA entries.`
  );
} else {
  fs.writeFileSync(dataOutPath, dataFileContent);
  console.log(
    `✅ ${dataExists ? "Updated" : "Created"} ${path.relative(REPO_ROOT, dataOutPath)}`
  );
  console.log(`   ${sortedFiles.length} data files imported.\n`);
}

// ── Generate {Pascal}Full.tsx ─────────────────────────────────────────────────

if (!dataOnly) {
  const compPath = path.join(TEMPLATES_EPISODES_DIR, `${pascal}Full.tsx`);
  const compExists = fs.existsSync(compPath);

  if (compExists && !force) {
    console.log(
      `⏭  Skipping ${pascal}Full.tsx — already exists.\n` +
      `   Pass --force to regenerate (will overwrite any customizations).`
    );
  } else {
    const compositionId = `${slug}-full`;
    const compContent = `/**
 * ${pascal}Full — manifest-driven full episode composition.
 *
 * GENERATED by tools/assembly/generate_episode_data.mjs
 * Regenerate: node tools/assembly/generate_episode_data.mjs ${slug} --force
 *
 * Wires assembly-manifest.json + all JSON data files into FullEpisode.
 * Duration is derived from the manifest's totalDurationSec via
 * calculateFullEpisodeMetadata — no hardcoded frame counts.
 *
 * Register in src/index.ts:
 *   import { ${pascal}FullComposition } from "./templates/Episodes/${pascal}Full";
 *   Then <${pascal}FullComposition /> inside registerRoot.
 *
 * Render:
 *   npx remotion render ${compositionId} out/${slug}-full.mp4
 */

import React from "react";
import { Composition } from "remotion";
import { FullEpisode, calculateFullEpisodeMetadata } from "./FullEpisode";
import manifest from "../../../data/episodes/${slug}/assembly-manifest.json";
import { TEMPLATE_DATA } from "./${slug}-data";

export const ${pascal}Full: React.FC = () => (
  <FullEpisode
    manifest={manifest as any}
    templateData={TEMPLATE_DATA}
    assetBasePath="episodes/${slug}"
  />
);

export const ${pascal}FullComposition = () => (
  <Composition
    id="${compositionId}"
    component={${pascal}Full}
    calculateMetadata={() =>
      calculateFullEpisodeMetadata({
        props: {
          manifest: manifest as any,
          templateData: TEMPLATE_DATA,
          assetBasePath: "episodes/${slug}",
        },
      })
    }
  />
);
`;

    fs.writeFileSync(compPath, compContent);
    console.log(
      `✅ ${compExists ? "Regenerated" : "Created"} ${path.relative(REPO_ROOT, compPath)}`
    );
  }
}

// ── Next steps ────────────────────────────────────────────────────────────────

console.log(`
📋 Next steps:
   1. Verify TypeScript: cd remotion-templates && npx tsc --noEmit
   2. Register in src/index.ts:
        import { ${pascal}FullComposition } from "./templates/Episodes/${pascal}Full";
        <${pascal}FullComposition />
   3. Run integrity check: npm run test:episode
   4. Smoke test: npm run test:episode-smoke
`);
