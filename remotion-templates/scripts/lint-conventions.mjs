#!/usr/bin/env node
/**
 * lint-conventions.mjs — Lightweight convention checker for Parallax templates.
 *
 * Runs pattern-based checks on template source files to enforce project conventions
 * without requiring a full ESLint setup. Designed to be fast and zero-dependency.
 *
 * Usage:
 *   node scripts/lint-conventions.mjs          # Check all templates
 *   node scripts/lint-conventions.mjs --fix    # Show fix suggestions
 *
 * Conventions enforced:
 *   1. No direct layout.safeArea.* in templates (use layout.safeAreaTier.generous.*)
 *   2. All templates must use TitleBlock (not manual title positioning)
 *   3. No hardcoded 80/108 pixel safe area values
 *   4. Templates must import useCompositionAnimation
 *   5. No nested Ken Burns drift inside compStyle (L66 — silent compounding bug)
 *   6. Chinese text must explicitly set fontFamily: fonts.chinese (L13)
 *   7. Composition IDs in Root.tsx must be unique (L20)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../src/templates");
const ROOT_TSX = path.resolve(__dirname, "../src/Root.tsx");

// Files to exclude from checking (shared infrastructure, not templates)
const EXCLUDE_DIRS = ["Episodes", "__tests__"];

// ── Rules ──────────────────────────────────────────────────────────────────

const rules = [
  {
    id: "safe-area-direct",
    description: 'Use layout.safeAreaTier.generous.* instead of layout.safeArea.*',
    pattern: /layout\.safeArea\.(top|right|bottom|left)/g,
    // Allow in computed expressions like layout.safeArea.top + offset (these are intentional)
    exclude: /layout\.safeArea\.(top|right|bottom|left)\s*[\*\+\-\/]/,
    severity: "warn",
    fix: "Replace layout.safeArea.X with layout.safeAreaTier.generous.X",
  },
  // L69 default-flip: contentArea() and TitleBlock now default to "generous".
  // Passing it explicitly is no longer required — only flag if a template
  // uses a clearly-wrong tier without intent (e.g. literal "standard").
  {
    id: "explicit-standard-tier",
    description: 'Avoid explicit "standard" tier — it bypasses the channel-wide generous default (L69)',
    pattern: /safeAreaTier:\s*["']standard["']|safeAreaTier=["']standard["']|contentArea\([^)]*["']standard["']/g,
    severity: "warn",
    fix: 'Drop the explicit tier (defaults to "generous"), or change to "tight"/"broadcast" if intentional',
  },
  {
    id: "missing-composition-animation",
    description: "Templates must use useCompositionAnimation hook",
    fileLevel: true,
    check: (content, filePath) => {
      // Only check main component files (not types, index, schemas, etc.)
      const basename = path.basename(filePath);
      if (basename === "types.ts" || basename.startsWith("index")) return [];
      if (basename.includes("schema")) return [];
      if (!basename.endsWith(".tsx")) return []; // Only check TSX (React components)
      if (content.includes("@deprecated")) return []; // Skip deprecated templates

      if (!content.includes("useCompositionAnimation")) {
        return [{ line: 1, message: "Missing useCompositionAnimation import/usage" }];
      }
      return [];
    },
    severity: "error",
    fix: 'Add: const { style: compStyle } = useCompositionAnimation();',
  },
  {
    id: "missing-title-block",
    description: "Templates should use TitleBlock component (not manual titles)",
    fileLevel: true,
    check: (content, filePath) => {
      const basename = path.basename(filePath);
      if (basename === "types.ts" || basename.startsWith("index")) return [];
      if (basename.includes("schema")) return [];
      if (!basename.endsWith(".tsx")) return []; // Only TSX files
      if (content.includes("@deprecated")) return [];

      // Check if it renders a title but doesn't use TitleBlock
      const hasTitle = content.includes("data.title");
      const hasTitleBlock = content.includes("TitleBlock");
      const hasSubComponents = content.includes("React.memo"); // might be a sub-component file

      if (hasTitle && !hasTitleBlock && !hasSubComponents) {
        return [{ line: 1, message: "Has title data but doesn't use TitleBlock component" }];
      }
      return [];
    },
    severity: "info",
    fix: "Replace manual title JSX with <TitleBlock title={data.title} mode={mode} safeAreaTier=\"generous\" />",
  },
  {
    id: "hardcoded-safe-pixels",
    description: "Avoid hardcoded safe area pixel values (80, 108)",
    pattern: /(?:top|left|right|bottom|padding):\s*(80|108)(?!\d)/g,
    severity: "info",
    fix: "Use layout.safeAreaTier.generous.* or layout.spacing.* tokens instead",
  },
  // ── L66: Nested Ken Burns drift (silent compounding bug) ─────────────────
  // Two drift layers in the same composition compound their transforms — content
  // appears to slide into the title even though static positions are correct.
  // useCompositionAnimation already provides drift; never wrap content in another.
  {
    id: "nested-ken-burns",
    description: "Nested Ken Burns drift detected (L66) — useCompositionAnimation is the single source of drift",
    fileLevel: true,
    check: (content, filePath) => {
      const basename = path.basename(filePath);
      if (!basename.endsWith(".tsx")) return [];
      if (basename === "useCompositionAnimation.ts") return [];

      const usesHook = content.includes("useCompositionAnimation");
      if (!usesHook) return [];

      // Skip files that explicitly opt out of automatic drift via { noDrift: true }
      // — those CAN legitimately use kenBurnsDrift to apply drift manually.
      if (/useCompositionAnimation\s*\(\s*\{[^}]*noDrift:\s*true/.test(content)) return [];

      const issues = [];
      const lines = content.split("\n");
      lines.forEach((line, i) => {
        if (/kenBurnsDrift\s*\(/.test(line)) {
          issues.push({ line: i + 1, message: "kenBurnsDrift() call alongside useCompositionAnimation — drifts compound" });
        }
      });
      return issues;
    },
    severity: "warn",
    fix: "Either remove the manual kenBurnsDrift() (the hook already drifts), or pass { noDrift: true } to useCompositionAnimation and drive drift manually for ALL elements from the same origin.",
  },
  // ── L13: Chinese text must be paired with fonts.chinese ────────────────────
  // Brand fonts (Space Grotesk, IBM Plex Mono, JetBrains Mono) lack CJK glyphs;
  // without an explicit Chinese font, system fallback differs across renderers.
  // File-level check: flag if a .tsx renders CJK content but never references
  // fonts.chinese / hasChinese / hasCJK anywhere.
  {
    id: "cjk-without-chinese-font",
    description: "Component contains CJK display text but never references fonts.chinese (L13)",
    fileLevel: true,
    check: (content, filePath) => {
      const basename = path.basename(filePath);
      if (!basename.endsWith(".tsx")) return [];
      // Sample data files (index.tsx with defaultProps) don't render — the
      // companion component is responsible for font wiring.
      if (basename.startsWith("index")) return [];

      // Strip JS regex literals and string-class CJK ranges before scanning,
      // so character-class patterns like /[一-鿿]/ don't trip the check.
      const stripped = content
        .replace(/\/\*[\s\S]*?\*\//g, "")               // /* block comments */
        .replace(/(^|\s)\/\/[^\n]*/g, "$1")              // // line comments
        .replace(/\/\[[^\]]*\]\/[gimsuy]*/g, "")         // regex with char class
        .replace(/\\u[0-9a-fA-F]{4}/g, "");              // unicode escapes

      const cjk = /[一-鿿㐀-䶿]/;
      if (!cjk.test(stripped)) return [];

      // CJK is present in non-pattern context; require an opt-in.
      if (/fonts\.chinese|hasChinese\s*\(|hasCJK\s*\(/.test(content)) return [];

      return [{
        line: 1,
        message: "CJK display text present but no fonts.chinese / hasChinese / hasCJK reference in this file",
      }];
    },
    severity: "warn",
    fix: 'Set fontFamily: fonts.chinese on the CJK span, or use hasChinese()/hasCJK() to detect and switch fonts conditionally.',
  },
];

// ── Scanner ────────────────────────────────────────────────────────────────

function getTemplateFiles() {
  const files = [];

  function walk(dir) {
    const dirName = path.basename(dir);
    if (EXCLUDE_DIRS.includes(dirName)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
        // Skip type-only files and index files for pattern rules
        files.push(fullPath);
      }
    }
  }

  walk(TEMPLATES_DIR);
  return files;
}

function lintFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const issues = [];
  const relativePath = path.relative(
    path.resolve(__dirname, ".."),
    filePath
  );

  for (const rule of rules) {
    if (rule.fileLevel) {
      // File-level check
      const fileIssues = rule.check(content, filePath);
      for (const issue of fileIssues) {
        issues.push({
          file: relativePath,
          line: issue.line,
          rule: rule.id,
          severity: rule.severity,
          message: issue.message || rule.description,
          fix: rule.fix,
        });
      }
    } else {
      // Line-level pattern check
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.matchAll(rule.pattern);

        for (const match of matches) {
          // Check exclusion pattern
          if (rule.exclude && rule.exclude.test(line)) continue;

          // Check validation function
          if (rule.validate && !rule.validate(match[0])) continue;

          issues.push({
            file: relativePath,
            line: i + 1,
            rule: rule.id,
            severity: rule.severity,
            message: `${rule.description}: "${match[0]}"`,
            fix: rule.fix,
          });
        }
      }
    }
  }

  return issues;
}

// ── Main ───────────────────────────────────────────────────────────────────

const showFix = process.argv.includes("--fix");
const files = getTemplateFiles();
let allIssues = [];

for (const file of files) {
  const issues = lintFile(file);
  allIssues.push(...issues);
}

// ── Repo-wide check: duplicate composition IDs in Root.tsx (L20) ────────────
if (fs.existsSync(ROOT_TSX)) {
  const rootContent = fs.readFileSync(ROOT_TSX, "utf-8");
  const idRe = /<Composition[^>]*\bid=["']([^"']+)["']/g;
  const seen = new Map();
  for (const m of rootContent.matchAll(idRe)) {
    const id = m[1];
    const lineNum = rootContent.slice(0, m.index).split("\n").length;
    if (seen.has(id)) {
      allIssues.push({
        file: "src/Root.tsx",
        line: lineNum,
        rule: "duplicate-composition-id",
        severity: "error",
        message: `Duplicate composition id="${id}" (first defined at line ${seen.get(id)}) — Remotion requires unique IDs`,
        fix: "Rename one of the duplicates to a unique slug (e.g. append the variant or episode name).",
      });
    } else {
      seen.set(id, lineNum);
    }
  }
}

// ── Output ─────────────────────────────────────────────────────────────────

if (allIssues.length === 0) {
  console.log("✓ All conventions pass! No issues found.");
  process.exit(0);
}

// Group by severity
const errors = allIssues.filter((i) => i.severity === "error");
const warnings = allIssues.filter((i) => i.severity === "warn");
const infos = allIssues.filter((i) => i.severity === "info");

// Print grouped by file
const byFile = {};
for (const issue of allIssues) {
  if (!byFile[issue.file]) byFile[issue.file] = [];
  byFile[issue.file].push(issue);
}

for (const [file, issues] of Object.entries(byFile)) {
  console.log(`\n${file}`);
  for (const issue of issues) {
    const icon =
      issue.severity === "error" ? "✖" : issue.severity === "warn" ? "⚠" : "ℹ";
    console.log(`  ${icon} L${issue.line}: [${issue.rule}] ${issue.message}`);
    if (showFix && issue.fix) {
      console.log(`    → Fix: ${issue.fix}`);
    }
  }
}

console.log(`
Summary: ${errors.length} errors, ${warnings.length} warnings, ${infos.length} info
`);

// Exit with error code if there are actual errors
if (errors.length > 0) {
  process.exit(1);
}
