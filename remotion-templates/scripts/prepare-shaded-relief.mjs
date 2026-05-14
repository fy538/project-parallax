#!/usr/bin/env node
/**
 * prepare-shaded-relief — pre-warp the public-domain Tom Patterson
 * shaded-relief raster into each AtlasPlate projection.
 *
 * Reads an equirectangular source PNG, then for each supported d3-geo
 * projection, inversely-projects every output pixel to lon/lat, samples
 * the source, and writes a warped PNG to
 * `remotion-templates/public/geo/relief/{projection}.png`.
 *
 * Run from the repo root (or anywhere — paths are absolute via
 * `import.meta.url`).
 *
 *   node tools/prepare-shaded-relief.mjs                # all projections
 *   node tools/prepare-shaded-relief.mjs --only=equalEarth,naturalEarth
 *   node tools/prepare-shaded-relief.mjs --source=path/to/source.png
 *
 * See tools/shaded-relief-setup.md for the manual asset acquisition
 * steps that precede this script.
 *
 * Why not GDAL? GDAL is the canonical tool for this but adds a binary
 * dependency the project doesn't otherwise need. d3-geo's invert() is
 * available in pure Node and gives identical results for the
 * projections we support — and it's the SAME projection code AtlasPlate
 * uses at render time, eliminating any chance of edge-case drift
 * between the warp pipeline and the runtime.
 */

import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { createReadStream, createWriteStream, existsSync, readFileSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { PNG } from "pngjs";
import {
  geoEqualEarth,
  geoNaturalEarth1,
  geoEquirectangular,
} from "d3-geo";

// ── Config ──────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Script lives in remotion-templates/scripts/; repo root is two levels up.
const REPO_ROOT = resolve(__dirname, "..", "..");

/** Output viewport — must match AtlasPlate's `layout` constants. */
const OUT_WIDTH = 1920;
const OUT_HEIGHT = 1080;
/** Default — must match AtlasPlate's DEFAULT_FRAME_PADDING. Override with
 *  `--framePadding=N` when an episode pins a non-default padding. The
 *  output filename also encodes the padding (`{projection}-{padding}.png`)
 *  for any non-default value so multiple paddings can coexist on disk. */
const DEFAULT_FRAME_PADDING = 80;

const RELIEF_DIR = join(REPO_ROOT, "remotion-templates/public/geo/relief");
const DEFAULT_SOURCE = join(RELIEF_DIR, "_source/equirect-source.png");

/**
 * Supported projections — names match AtlasPlate's `ProjectionName` type.
 *
 * The KEYS of this dict are also stored in
 * `src/templates/AtlasPlate/reliefProjections.ts` (`RELIEF_SUPPORTED_PROJECTIONS`)
 * so the runtime component and the warp script agree on the list. To
 * prevent silent drift, we parse that TS file at script-start and assert
 * the two lists match. Adding a new projection therefore requires two
 * edits: append the name there, map the factory here.
 */
const PROJECTIONS = {
  equalEarth: geoEqualEarth,
  naturalEarth: geoNaturalEarth1,
  equirectangular: geoEquirectangular,
};

const ASSERT_DRIFT_FILE = join(
  REPO_ROOT,
  "remotion-templates/src/templates/AtlasPlate/reliefProjections.ts",
);
try {
  const src = readFileSync(ASSERT_DRIFT_FILE, "utf8");
  // Extract the string literals between the array-open and array-close.
  // Permissive regex: tolerates trailing commas, comments, whitespace.
  const match = src.match(
    /RELIEF_SUPPORTED_PROJECTIONS\s*=\s*\[([\s\S]*?)\]\s*as const/,
  );
  if (!match) throw new Error("could not locate RELIEF_SUPPORTED_PROJECTIONS");
  const tsNames = [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  const scriptNames = Object.keys(PROJECTIONS);
  const tsSet = new Set(tsNames);
  const scriptSet = new Set(scriptNames);
  const missingInScript = tsNames.filter((n) => !scriptSet.has(n));
  const missingInTs = scriptNames.filter((n) => !tsSet.has(n));
  if (missingInScript.length || missingInTs.length) {
    console.error(
      "error: projection-list drift between component and warp script.\n" +
        `  in reliefProjections.ts but not in PROJECTIONS dict: ${missingInScript.join(", ") || "(none)"}\n` +
        `  in PROJECTIONS dict but not in reliefProjections.ts: ${missingInTs.join(", ") || "(none)"}\n` +
        "Reconcile the two files and rerun.",
    );
    process.exit(1);
  }
} catch (err) {
  console.warn(
    `warning: failed to verify projection-list alignment ` +
      `against ${ASSERT_DRIFT_FILE}: ${err.message}. Proceeding anyway.`,
  );
}

// ── CLI parsing ─────────────────────────────────────────────────────

const args = process.argv.slice(2);
const flag = (name) => {
  const a = args.find((x) => x.startsWith(`--${name}=`));
  return a ? a.split("=")[1] : null;
};

const sourcePath = flag("source")
  ? resolve(flag("source"))
  : DEFAULT_SOURCE;
const framePaddingArg = flag("framePadding");
const FRAME_PADDING = framePaddingArg
  ? Number.parseInt(framePaddingArg, 10)
  : DEFAULT_FRAME_PADDING;
if (!Number.isFinite(FRAME_PADDING) || FRAME_PADDING < 0 || FRAME_PADDING > 400) {
  console.error(
    `error: --framePadding must be an integer in [0, 400]; got "${framePaddingArg}"`,
  );
  process.exit(1);
}
const onlyArg = flag("only");
const targets = onlyArg
  ? onlyArg.split(",").filter((n) => PROJECTIONS[n])
  : Object.keys(PROJECTIONS);

if (onlyArg && targets.length === 0) {
  console.error(
    `error: --only=${onlyArg} matched no supported projections. ` +
      `Known: ${Object.keys(PROJECTIONS).join(", ")}`,
  );
  process.exit(1);
}

// ── Source raster load ──────────────────────────────────────────────

if (!existsSync(sourcePath)) {
  console.error(`error: source raster not found at ${sourcePath}`);
  console.error("Steps to obtain it:");
  console.error("  1. Download Natural Earth's HYP_50M_SR_W.tif (or 10m)");
  console.error("  2. Convert to equirect PNG (see tools/shaded-relief-setup.md)");
  console.error(`  3. Save to ${sourcePath}`);
  console.error("  4. Re-run this script");
  process.exit(1);
}

console.log(`reading source raster: ${sourcePath}`);
const source = await new Promise((resolveLoad, rejectLoad) => {
  createReadStream(sourcePath)
    .pipe(new PNG())
    .on("parsed", function () {
      resolveLoad(this);
    })
    .on("error", rejectLoad);
});
console.log(`  source: ${source.width} × ${source.height} px`);

// ── World-fit helper (mirrors atlasProjection.ts fitProjectionToWorld) ──

const fitProjectionToWorld = (proj) => {
  // d3-geo's fitExtent expects a GeoJSON Sphere object for "fit world."
  proj.fitExtent(
    [
      [FRAME_PADDING, FRAME_PADDING],
      [OUT_WIDTH - FRAME_PADDING, OUT_HEIGHT - FRAME_PADDING],
    ],
    { type: "Sphere" },
  );
};

// ── Per-projection warp ────────────────────────────────────────────

const sampleSource = (lon, lat) => {
  // Equirectangular → pixel: lon in [-180, 180] → x in [0, srcW);
  //                          lat in [90, -90]   → y in [0, srcH).
  // Wrap lon if it strayed (d3 invert occasionally returns 180.0001 etc).
  let l = ((lon + 180) % 360 + 360) % 360 - 180;
  const xf = ((l + 180) / 360) * source.width;
  const yf = ((90 - lat) / 180) * source.height;
  const x = Math.min(source.width - 1, Math.max(0, Math.floor(xf)));
  const y = Math.min(source.height - 1, Math.max(0, Math.floor(yf)));
  const idx = (y * source.width + x) * 4;
  return [
    source.data[idx],
    source.data[idx + 1],
    source.data[idx + 2],
    source.data[idx + 3],
  ];
};

const warpProjection = async (name) => {
  console.log(`\nwarping ${name}…`);
  const proj = PROJECTIONS[name]();
  fitProjectionToWorld(proj);

  const out = new PNG({ width: OUT_WIDTH, height: OUT_HEIGHT });
  // Initialize as transparent paper-tone (any pixel that doesn't invert —
  // i.e., outside the projection's valid extent — stays transparent so
  // AtlasPlate's ocean rect / background shows through).
  out.data.fill(0);

  let valid = 0;
  let total = 0;
  for (let y = 0; y < OUT_HEIGHT; y++) {
    for (let x = 0; x < OUT_WIDTH; x++) {
      total++;
      const inverted = proj.invert([x, y]);
      if (!inverted) continue;
      const [lon, lat] = inverted;
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
      if (lat < -90 || lat > 90) continue;
      const [r, g, b, a] = sampleSource(lon, lat);
      const idx = (y * OUT_WIDTH + x) * 4;
      out.data[idx] = r;
      out.data[idx + 1] = g;
      out.data[idx + 2] = b;
      out.data[idx + 3] = a === 0 ? 255 : a;
      valid++;
    }
    if (y % 100 === 0 && y > 0) {
      process.stdout.write(`  row ${y}/${OUT_HEIGHT}\r`);
    }
  }
  console.log(
    `  pixels: ${valid.toLocaleString()} valid / ${total.toLocaleString()} ` +
      `(${((valid / total) * 100).toFixed(1)}%)`,
  );

  // Filename encodes non-default framePadding so a project with multiple
  // paddings can coexist. Default padding keeps the un-suffixed name
  // (which is what ReliefUnderlay looks for); non-default paddings get
  // a suffix and require a custom data.reliefVariant in the future.
  const suffix =
    FRAME_PADDING === DEFAULT_FRAME_PADDING ? "" : `-${FRAME_PADDING}`;
  const outPath = join(RELIEF_DIR, `${name}${suffix}.png`);
  await new Promise((resolveWrite, rejectWrite) => {
    out
      .pack()
      .pipe(createWriteStream(outPath))
      .on("finish", resolveWrite)
      .on("error", rejectWrite);
  });
  console.log(`  → ${outPath}`);
};

await mkdir(RELIEF_DIR, { recursive: true });

for (const name of targets) {
  await warpProjection(name);
}

console.log(`\ndone — ${targets.length} projection(s) warped.`);
console.log(
  `verify with: cd remotion-templates && npx remotion still src/index.ts ` +
    `CatalogAtlasReliefDemo --frame=60 --output=out/relief-check.png`,
);
