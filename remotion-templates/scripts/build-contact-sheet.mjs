#!/usr/bin/env node
/**
 * build-contact-sheet.mjs — Visual asset overview generator.
 *
 * Scans the test baseline directories and produces a single HTML page that
 * shows every rendered template + variant in a clean grid. Lets Tiger review
 * "what does our brand asset library look like right now" at a glance, without
 * scrubbing the 15-minute Remotion showreel.
 *
 * Output: /tmp/parallax-contact-sheet/index.html (file:// URL printable at run)
 *
 * Sources (in priority order — first found per id wins):
 *   1. src/__tests__/baselines/catalog-smoke/  — locked-in catalog variants
 *   2. src/__tests__/.temp-renders-catalog/    — last test-run renders
 *   3. src/__tests__/baselines/                — base template baselines
 *
 * Usage:
 *   node scripts/build-contact-sheet.mjs
 *   open /tmp/parallax-contact-sheet/index.html
 */

import { existsSync, readdirSync, mkdirSync, writeFileSync, copyFileSync } from "fs";
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TESTS = join(ROOT, "src", "__tests__");

const SOURCES = [
  { dir: join(TESTS, "baselines", "catalog-smoke"), label: "baseline-locked", priority: 1 },
  { dir: join(TESTS, ".temp-renders-catalog"), label: "last-render", priority: 2 },
  { dir: join(TESTS, "baselines"), label: "base-template", priority: 3 },
];

// Family grouping — drives the visual section order in the contact sheet.
// Lower index = appears first.
const FAMILY_ORDER = [
  { name: "Maps", match: /atlas|cartogram|density|choropleth|route|proportional|map-inset/i },
  { name: "Charts", match: /data-chart|time-series|bayesian|probability|radar|stat-reveal|sankey|pricing-waterfall/i },
  { name: "Diagrams", match: /framework|network|decision-tree|escalation|game-board|bifurcation|dueling|strategic|split/i },
  { name: "Timelines", match: /timeline/i },
  { name: "Typography", match: /kinetic|title-transition|annotated|image-composite|photo-montage/i },
  { name: "Editorial", match: /editorial|emphasis|template-preview/i },
  { name: "Shorts", match: /Short/ },
  { name: "Other", match: /.*/ },
];

// ─── Discover ───────────────────────────────────────────────────────────────

const found = new Map(); // key = displayId → { path, source }

for (const source of SOURCES) {
  if (!existsSync(source.dir)) continue;
  const files = readdirSync(source.dir).filter((f) => f.endsWith(".png"));
  for (const file of files) {
    const id = file.replace(/-frame-\d+\.png$/, "").replace(/\.png$/, "");
    // Only insert if higher priority (lower number) hasn't already claimed it
    const existing = found.get(id);
    if (!existing || source.priority < existing.priority) {
      found.set(id, {
        path: join(source.dir, file),
        source: source.label,
        priority: source.priority,
        filename: file,
      });
    }
  }
}

// ─── Group by family ────────────────────────────────────────────────────────

const families = new Map();
for (const [id, info] of found.entries()) {
  const family = FAMILY_ORDER.find((f) => f.match.test(id))?.name ?? "Other";
  if (!families.has(family)) families.set(family, []);
  families.get(family).push({ id, ...info });
}

// Sort each family alphabetically by id
for (const list of families.values()) {
  list.sort((a, b) => a.id.localeCompare(b.id));
}

// ─── Stage output ───────────────────────────────────────────────────────────

const OUT_DIR = "/tmp/parallax-contact-sheet";
const IMG_DIR = join(OUT_DIR, "images");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });
if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });

// Copy files into the output dir so the HTML loads cleanly via file://
let copied = 0;
const tileEntries = [];
for (const family of FAMILY_ORDER) {
  const list = families.get(family.name) ?? [];
  if (!list.length) continue;
  tileEntries.push({ family: family.name, list });
  for (const item of list) {
    const dest = join(IMG_DIR, item.filename);
    copyFileSync(item.path, dest);
    copied++;
  }
}

// ─── Write HTML ─────────────────────────────────────────────────────────────

const totalAssets = found.size;
const generatedAt = new Date().toISOString();
const familySummary = tileEntries
  .map((g) => `${g.family} ${g.list.length}`)
  .join(" · ");

const css = `
  :root {
    --ink: #1C1814;
    --paper: #F5F0E8;
    --bone: #F0E6D0;
    --amber: #C4A747;
    --rust: #A64D46;
    --taupe: #B8A189;
    --umber: #8B7355;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; font-family: -apple-system, "IBM Plex Sans", "Helvetica Neue", sans-serif; background: var(--paper); color: var(--ink); }
  header { position: sticky; top: 0; background: var(--ink); color: var(--bone); padding: 24px 40px; z-index: 100; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
  header h1 { margin: 0 0 6px; font-size: 24px; font-weight: 600; letter-spacing: -0.01em; }
  header .meta { font-size: 13px; opacity: 0.75; font-family: "IBM Plex Mono", "SF Mono", monospace; }
  header .meta strong { color: var(--amber); }
  .toc { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
  .toc a { color: var(--bone); text-decoration: none; padding: 4px 10px; border: 1px solid rgba(240,230,208,0.25); border-radius: 14px; font-size: 12px; font-family: "IBM Plex Mono", monospace; }
  .toc a:hover { background: var(--amber); color: var(--ink); border-color: var(--amber); }
  main { padding: 24px 40px 60px; }
  section { margin-bottom: 48px; }
  section h2 { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; margin: 0 0 4px; padding: 0 0 8px; border-bottom: 1px solid rgba(28,24,20,0.15); }
  section .count { font-family: "IBM Plex Mono", monospace; font-size: 12px; color: var(--umber); margin-bottom: 16px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 20px; }
  .tile { background: white; border: 1px solid rgba(28,24,20,0.1); border-radius: 6px; overflow: hidden; transition: transform 0.15s ease, box-shadow 0.15s ease; }
  .tile:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(28,24,20,0.18); }
  .tile img { display: block; width: 100%; height: auto; background: var(--bone); }
  .tile .label { padding: 10px 12px 12px; border-top: 1px solid rgba(28,24,20,0.07); }
  .tile .id { font-family: "IBM Plex Mono", "SF Mono", monospace; font-size: 11px; line-height: 1.4; word-break: break-word; }
  .tile .source { font-family: "IBM Plex Mono", monospace; font-size: 10px; color: var(--umber); margin-top: 4px; text-transform: uppercase; letter-spacing: 0.05em; }
  .tile .source.baseline-locked { color: var(--amber); }
  .tile .source.last-render { color: var(--umber); }
  .tile .source.base-template { color: var(--rust); }
  footer { padding: 24px 40px; font-family: "IBM Plex Mono", monospace; font-size: 11px; color: var(--umber); border-top: 1px solid rgba(28,24,20,0.1); margin-top: 40px; }
`;

const tocLinks = tileEntries
  .map((g) => `<a href="#${g.family.toLowerCase()}">${g.family} (${g.list.length})</a>`)
  .join("");

const sections = tileEntries
  .map((g) => {
    const tiles = g.list
      .map((item) => {
        const imgPath = `images/${item.filename}`;
        return `<div class="tile">
          <img src="${imgPath}" alt="${item.id}" loading="lazy">
          <div class="label">
            <div class="id">${item.id}</div>
            <div class="source ${item.source}">${item.source}</div>
          </div>
        </div>`;
      })
      .join("\n");
    return `<section id="${g.family.toLowerCase()}">
      <h2>${g.family}</h2>
      <div class="count">${g.list.length} asset${g.list.length === 1 ? "" : "s"}</div>
      <div class="grid">${tiles}</div>
    </section>`;
  })
  .join("\n");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Parallax — Visual Asset Contact Sheet</title>
  <style>${css}</style>
</head>
<body>
  <header>
    <h1>Parallax — Visual Asset Contact Sheet</h1>
    <div class="meta">
      <strong>${totalAssets}</strong> assets · ${familySummary}<br>
      Generated ${generatedAt}
    </div>
    <nav class="toc">${tocLinks}</nav>
  </header>
  <main>
    ${sections}
  </main>
  <footer>
    Sources by color: <span style="color: var(--amber); font-weight: 600">amber</span> = baseline-locked (visual regression coverage) ·
    <span style="color: var(--umber)">umber</span> = last-render (regenerated in temp on most recent test run) ·
    <span style="color: var(--rust)">rust</span> = base-template fallback.<br>
    Each thumbnail is the frame 30 (1 second in) capture of that template/variant. The full motion is in the catalog-showreel composition (15 min).
  </footer>
</body>
</html>`;

writeFileSync(join(OUT_DIR, "index.html"), html);

console.log(`✓ Contact sheet built: ${OUT_DIR}/index.html`);
console.log(`  ${copied} images copied across ${tileEntries.length} families`);
console.log(`  Total assets: ${totalAssets}`);
console.log("");
console.log("To view:");
console.log(`  open ${OUT_DIR}/index.html`);
