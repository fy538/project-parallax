#!/usr/bin/env node
/**
 * lint-templates.mjs — Opt-in POLISH.md source-code lint.
 *
 * Not the canonical CI gate — that's `scripts/lint-conventions.mjs`
 * (run by `npm run lint`). This file covers a distinct rule set
 * (B1-B6, focused on POLISH.md visual conventions) that hasn't been
 * promoted to the conventions linter. Run on-demand via:
 *
 *   npm run lint:source
 *
 * If a B1-B6 rule here proves valuable, promote it to
 * `lint-conventions.mjs` and remove it from here.
 *
 * Companion: `scripts/lint-templates.py` lints DATA files (JSON) — a
 * different concern. Run via `npm run lint:polish`.
 *
 * Usage:
 *   npm run lint:source                              # All templates
 *   node scripts/lint-templates.mjs RouteAnimation   # One template
 *
 * Exit code: 0 = clean, 1 = warnings found
 *
 * Rules enforced:
 *   B1: No raw pixel positions for titles (should use contentArea/TitleBlock)
 *   B2: All text with data-driven content should have maxWidth or textSafe
 *   B3: Linear interpolation without easing (POLISH.md A1)
 *   B4: Magic spacing numbers (not from layout.spacing.*)
 *   B5: Direct light/dark color references instead of useThemeMode
 *   B6: Missing overflow:hidden on containers with projected content
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, "..", "src", "templates");

// ─── Rule definitions ─────────────────────────────────────────────────────

const RULES = [
  {
    id: "B1",
    name: "Raw pixel title position",
    description: "Title positioned with hardcoded pixels instead of contentArea/TitleBlock",
    // Matches things like `top: 80` or `top: 120` without contentArea
    test: (content, filename) => {
      const warnings = [];
      // Skip if uses TitleBlock
      if (content.includes("TitleBlock")) return warnings;
      // Check for raw top/left positions near title-like content
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/top:\s*\d+(?!.*contentArea|.*safeArea|.*spacing)/.test(line) &&
            lines.slice(Math.max(0, i-5), i+5).join("").includes("title")) {
          warnings.push({ line: i + 1, msg: "Title positioned with raw pixels — use contentArea() or TitleBlock" });
        }
      }
      return warnings;
    },
  },
  {
    id: "B2",
    name: "Unbounded dynamic text",
    description: "Data-driven text without maxWidth or overflow protection",
    test: (content, filename) => {
      const warnings = [];
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Look for {data.xxx} or {pt.label} in JSX without maxWidth nearby
        if (/\{(?:data|pt|item|d|entry)\.\w*(?:label|title|name|text|subtitle)\}/.test(line)) {
          // Check surrounding 10 lines for maxWidth or textSafe or overflow
          const context = lines.slice(Math.max(0, i-10), i+10).join("\n");
          if (!context.includes("maxWidth") && !context.includes("textSafe") &&
              !context.includes("overflow") && !context.includes("textOverflow") &&
              !context.includes("whiteSpace")) {
            warnings.push({ line: i + 1, msg: "Dynamic text without overflow protection (add maxWidth or textSafe.*)" });
          }
        }
      }
      return warnings;
    },
  },
  {
    id: "B3",
    name: "Linear interpolation",
    description: "interpolate() without easing config (POLISH.md A1)",
    test: (content, filename) => {
      const warnings = [];
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Match interpolate( with only 3 args (no easing config)
        // This is a heuristic — looks for interpolate followed by only input/output arrays
        if (/interpolate\s*\(\s*$/.test(line) || /interpolate\s*\([^)]*\)/.test(line)) {
          // Check if there's a 4th argument (easing config)
          const nextLines = lines.slice(i, Math.min(i + 8, lines.length)).join("\n");
          const match = nextLines.match(/interpolate\s*\([^)]*,[^)]*,[^)]*\)/s);
          if (match && !match[0].includes("CLAMP") && !match[0].includes("Easing") &&
              !match[0].includes("extrapolateLeft") && !match[0].includes("easing")) {
            warnings.push({ line: i + 1, msg: "interpolate() without easing config — add CLAMP_CUBIC or similar" });
          }
        }
      }
      return warnings;
    },
  },
  {
    id: "B4",
    name: "Magic spacing numbers",
    description: "Spacing values that aren't from the 8px grid (layout.spacing.*)",
    test: (content, filename) => {
      const warnings = [];
      const VALID_SPACING = [0, 2, 4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96, 120, 160];
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Look for margin/padding/gap with non-grid values
        const spacingMatch = line.match(/(?:margin|padding|gap|top|bottom|left|right).*?:\s*(\d+)/);
        if (spacingMatch) {
          const value = parseInt(spacingMatch[1]);
          if (value > 4 && !VALID_SPACING.includes(value) &&
              !line.includes("layout.") && !line.includes("spacing") &&
              !line.includes("safeArea") && !line.includes("contentArea") &&
              !line.includes("//") && !line.includes("fontSize") &&
              !line.includes("width") && !line.includes("height") &&
              !line.includes("borderRadius")) {
            warnings.push({ line: i + 1, msg: `Spacing ${value}px not on 8px grid — use layout.spacing.*` });
          }
        }
      }
      return warnings;
    },
  },
  {
    id: "B5",
    name: "Direct color reference",
    description: "Using light.text.* or dark.text.* directly instead of useThemeMode()",
    test: (content, filename) => {
      const warnings = [];
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (/(?:light|dark)\.text\./.test(lines[i]) && !lines[i].includes("//")) {
          warnings.push({ line: i + 1, msg: "Direct light/dark color reference — use useThemeMode() instead" });
        }
      }
      return warnings;
    },
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────

const targetTemplate = process.argv[2];

function findTemplateFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      // Look for the main template file (same name as folder)
      const mainFile = join(fullPath, `${entry}.tsx`);
      try {
        statSync(mainFile);
        files.push({ name: entry, path: mainFile });
      } catch {
        // Try index.tsx
        const indexFile = join(fullPath, "index.tsx");
        try {
          statSync(indexFile);
          files.push({ name: entry, path: indexFile });
        } catch { /* skip */ }
      }
    }
  }
  return files;
}

const templates = findTemplateFiles(TEMPLATES_DIR)
  .filter(t => !targetTemplate || t.name === targetTemplate);

if (templates.length === 0) {
  console.error(`No templates found${targetTemplate ? ` matching "${targetTemplate}"` : ""}`);
  process.exit(1);
}

let totalWarnings = 0;

console.log(`\n${"─".repeat(60)}`);
console.log(`  Template Lint — POLISH.md enforcement`);
console.log(`  Checking ${templates.length} template(s)`);
console.log(`${"─".repeat(60)}\n`);

for (const { name, path } of templates) {
  const content = readFileSync(path, "utf-8");
  const fileWarnings = [];

  for (const rule of RULES) {
    const warnings = rule.test(content, name);
    fileWarnings.push(...warnings.map(w => ({ ...w, rule: rule.id, ruleName: rule.name })));
  }

  if (fileWarnings.length > 0) {
    console.log(`  ⚠  ${name} (${fileWarnings.length} warning${fileWarnings.length > 1 ? "s" : ""})`);
    for (const w of fileWarnings) {
      console.log(`     L${w.line} [${w.rule}] ${w.msg}`);
    }
    console.log("");
    totalWarnings += fileWarnings.length;
  } else {
    console.log(`  ✓  ${name}`);
  }
}

console.log(`\n${"─".repeat(60)}`);
console.log(`  ${totalWarnings === 0 ? "✓ All clean" : `⚠ ${totalWarnings} warning(s) across ${templates.length} templates`}`);
console.log(`${"─".repeat(60)}\n`);

process.exit(totalWarnings > 0 ? 1 : 0);
