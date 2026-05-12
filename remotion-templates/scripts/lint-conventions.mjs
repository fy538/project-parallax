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
 *   2. Long-form templates must use TitleBlock — Shorts, Thumbnail, transitions,
 *      split-screen, and ImageComposite are excluded; others may use
 *      @title-block: none | @title-block: delegated
 *   3. No hardcoded 80/108 pixel safe area values
 *   4. Templates must import useCompositionAnimation
 *   5. No nested Ken Burns drift inside compStyle (L66 — silent compounding bug)
 *   6. Chinese text must explicitly set fontFamily: fonts.chinese (L13)
 *   7. Composition IDs in Root.tsx must be unique (L20)
 *   8. Animated templates must call useDirection(data._direction) for manifest direction wiring
 *   9. No hardcoded brand palette hex values — use palette.* / semantic.* constants
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../src/templates");
const COMPONENTS_DIR = path.resolve(__dirname, "../src/components");
const ROOT_TSX = path.resolve(__dirname, "../src/Root.tsx");

// Files to exclude from checking (shared infrastructure, not templates)
const EXCLUDE_DIRS = ["Episodes", "__tests__"];

/**
 * Long-form templates must use <TitleBlock>; these paths use different title
 * chrome (9:16 shorts, section cards, thumbnails, image-led layouts). Keep the
 * basename list in sync with `npm run lint` — any new exception needs a design
 * rationale, not a silent skip.
 */
const MISSING_TITLE_BLOCK_EXCLUDED_BASENAMES = new Set([
  "SplitComposition.tsx", // split-screen: title in panel chrome, not TitleBlock
  "Thumbnail.tsx", // 16:9 promo card — condensed title treatment
  "TitleTransition.tsx", // full-card section openers
  "ImageComposite.tsx", // photo-first: HeaderStrip / caption strip, not TitleBlock
]);

function isMissingTitleBlockRuleSkipped(content, filePath) {
  // Explicit opt-out (rare one-offs). Use `none` when this file owns a custom
  // title row; `delegated` when a child component renders TitleBlock instead.
  if (
    content.includes("@title-block: none") ||
    content.includes("@title-block: delegated")
  ) {
    return true;
  }
  const normalized = filePath.replace(/\\/g, "/");
  if (normalized.includes("/Shorts/")) return true;
  if (MISSING_TITLE_BLOCK_EXCLUDED_BASENAMES.has(path.basename(filePath))) {
    return true;
  }
  return false;
}

// ── Palette color literals → must use palette.* / semantic.* constants ──────
// These are the hex values from palette.json. If written as string literals
// in component files they'll drift out of sync when the palette changes.
const KNOWN_PALETTE_LITERALS = {
  "#1C1814": "palette.ink",
  "#2A2520": "palette.midnight",
  "#5C4A3D": "palette.walnut",
  "#8B7355": "palette.umber",
  "#B8A189": "palette.taupe",
  "#D9C9B0": "palette.sand",
  "#F0E6D0": "palette.bone",
  "#F5F0E8": "palette.paper",
  "#C4A747": "palette.gold",
  "#4A7BA7": "semantic.us",
  "#A64D46": "semantic.china (or semantic.danger)",
  "#888780": "semantic.neutral",
  // Common legacy values still encountered in the codebase
  "#E5A544": "palette.gold (old amber — palette.gold is now #C4A747)",
  "#C23B22": "semantic.danger (old rust — now #A64D46)",
  "#6B1D1D": "palette.walnut (old oxblood — now #5C4A3D)",
  "#D64545": "semantic.danger (non-palette danger red — use semantic.danger)",
};

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
    description: "Templates must use useCompositionAnimation hook (directly or via a wrapper that does)",
    fileLevel: true,
    check: (content, filePath) => {
      // Only check main component files (not types, index, schemas, etc.)
      const basename = path.basename(filePath);
      if (basename === "types.ts" || basename.startsWith("index")) return [];
      if (basename.includes("schema")) return [];
      if (!basename.endsWith(".tsx")) return []; // Only check TSX (React components)
      if (content.includes("@deprecated")) return []; // Skip deprecated templates

      // Escape hatch for pure router/dispatcher files and sub-component helpers
      // that delegate composition animation to their children. Add this pragma
      // to suppress the check on files that intentionally skip the hook:
      //   // @composition-animation: delegated
      if (content.includes("@composition-animation: delegated")) return [];

      // Accept the hook directly OR any of the canonical wrappers that call it.
      // ShortsWrapper applies the hook to its render-prop children; EpisodeSeries
      // is for master compositions where each clip has its own hook call.
      const acceptedSignals = [
        "useCompositionAnimation",
        "ShortsWrapper",
        "EpisodeSeries",
      ];
      if (!acceptedSignals.some((s) => content.includes(s))) {
        return [{ line: 1, message: "Missing useCompositionAnimation (or canonical wrapper: ShortsWrapper / EpisodeSeries)" }];
      }
      return [];
    },
    severity: "error",
    fix: "Add: const { style: compStyle } = useCompositionAnimation(); — or wrap the render-prop with <ShortsWrapper> if this is a 9:16 Short.",
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
      if (isMissingTitleBlockRuleSkipped(content, filePath)) return [];

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
  // ── Rule 8: Animated templates must wire useDirection (manifest direction) ──
  // Any template that calls useCompositionAnimation without { noDrift: true }
  // is an animated composition and should call useDirection(data._direction)
  // so that _direction blocks in assembly-manifest.json take effect.
  // Pure routers (files with no direct JSX output) are skipped because they
  // delegate to sub-components that each call useDirection themselves.
  {
    id: "missing-direction-wiring",
    description: "Animated templates must call useDirection(data._direction) so manifest _direction blocks take effect",
    fileLevel: true,
    check: (content, filePath) => {
      const basename = path.basename(filePath);
      if (!basename.endsWith(".tsx")) return [];
      if (basename.startsWith("index")) return [];
      if (basename.includes("schema")) return [];
      if (content.includes("@deprecated")) return [];

      // Only applies to files that call useCompositionAnimation
      if (!content.includes("useCompositionAnimation")) return [];

      // Skip static compositions (noDrift: true means no animation to direct)
      if (/useCompositionAnimation\s*\(\s*\{[^}]*noDrift:\s*true/.test(content)) return [];

      // Skip audio-only compositions (no visual animation to direct)
      if (/useCompositionAnimation\s*\(\s*\{[^}]*noExit:\s*true/.test(content) &&
          !content.includes("AbsoluteFill")) return [];

      // Skip pure router/dispatcher files that render only other components
      // (no AbsoluteFill / direct visual JSX — they delegate to sub-components)
      if (!/AbsoluteFill/.test(content)) return [];

      if (!content.includes("useDirection")) {
        return [{
          line: 1,
          message: "Animated template calls useCompositionAnimation but never calls useDirection(data._direction)",
        }];
      }
      return [];
    },
    severity: "warn",
    fix: "Add: import { useDirection } from '../../hooks/useDirection'; — then call: const direction = useDirection(data._direction);",
  },
  // ── Rule 9: No hardcoded brand palette hex values ─────────────────────────
  // Brand colors must be referenced via palette.* or semantic.* constants from
  // design/theme.ts. Hardcoded literals drift out of sync when palette.json changes.
  // This rule flags the known palette hex values (case-insensitive).
  {
    id: "hardcoded-brand-color",
    description: "Hardcoded brand palette hex — use palette.* or semantic.* constant from design/theme.ts",
    fileLevel: true,
    check: (content, filePath) => {
      const basename = path.basename(filePath);
      if (!basename.endsWith(".tsx") && !basename.endsWith(".ts")) return [];
      if (basename.startsWith("index")) return [];
      if (basename.includes("schema")) return [];
      if (basename.includes("theme")) return [];  // theme.ts defines the values
      if (content.includes("@deprecated")) return [];

      const issues = [];
      const lines = content.split("\n");
      for (const [hex, constant] of Object.entries(KNOWN_PALETTE_LITERALS)) {
        const re = new RegExp(hex, "gi");
        lines.forEach((line, i) => {
          // Skip comment lines and import lines (palette.json import in theme.ts)
          if (/^\s*(\/\/|\/\*|\*|import )/.test(line)) return;
          if (re.test(line)) {
            issues.push({
              line: i + 1,
              message: `Hardcoded palette color ${hex} — use ${constant}`,
            });
          }
        });
      }
      return issues;
    },
    severity: "warn",
    fix: "Replace the hex literal with the palette/semantic constant (e.g. palette.ink, semantic.danger). Import from ../../design/theme.",
  },
  // ── Rule 10: No console.warn/error/log in render bodies ───────────────────
  // Templates and shared components render every frame (30fps). A `console.warn`
  // inside the render body or a per-frame useMemo/useEffect fires 30× per
  // second, polluting Studio output and slowing renders. Use `warnIf` from
  // `utils/dataWarnings.ts` instead — it dedupes by (template, message) tuple
  // per session.
  //
  // Suppression: add `// eslint-disable-next-line no-console` on the line
  // ABOVE the call. Reserve for legitimate one-shot cases:
  //   - `componentDidCatch` error-boundary logging (lifecycle, not render)
  //   - `useEffect` + `setTimeout/setInterval` (one-shot or scheduled)
  //   - Module-level / IIFE-level diagnostics that fire at import time
  //
  // Scope: scans src/templates/ + src/components/ (extended by the scanner).
  // Episodes/ subdir is excluded globally (EXCLUDE_DIRS) — FullEpisode.tsx
  // has its own warnIf integration and a documented componentDidCatch
  // console.error inside the error boundary.
  {
    id: "no-console-in-render",
    description: "Use `warnIf` from utils/dataWarnings.ts instead of console.* — renders 30×/sec else",
    fileLevel: true,
    // Apply to src/components/ as well as src/templates/ — shared components
    // render every frame at 30fps too. Other rules are template-specific.
    scope: "components-too",
    check: (content, filePath) => {
      const basename = path.basename(filePath);
      if (basename.startsWith("index")) return [];
      if (basename.includes("schema") || basename.endsWith("types.ts")) return [];

      const lines = content.split("\n");
      const issues = [];
      const consoleRe = /\bconsole\.(warn|error|log)\s*\(/;
      const suppressRe = /eslint-disable(?:-next)?-line\s+no-console/;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!consoleRe.test(line)) continue;
        // Skip lines inside comments — naive `/^\s*(\/\/|\*)/` check
        if (/^\s*(\/\/|\*)/.test(line)) continue;
        // Inline suppression on the same line
        if (suppressRe.test(line)) continue;
        // Above-line suppression on the previous non-blank line
        const prev = lines[i - 1] ?? "";
        if (suppressRe.test(prev)) continue;
        const method = line.match(consoleRe)?.[1] ?? "warn";
        issues.push({
          line: i + 1,
          message: `console.${method} fires 30×/sec in render bodies — use warnIf("TemplateName", "message") from utils/dataWarnings.ts, or add \`// eslint-disable-next-line no-console\` above the call for legitimate one-shot cases (componentDidCatch, useEffect+setTimeout).`,
        });
      }
      return issues;
    },
    severity: "warn",
    fix: "import { warnIf } from \"../../utils/dataWarnings\"; — then `warnIf(condition, \"TemplateName\", \"message\");`. " +
      "For legitimate one-shot cases (componentDidCatch, useEffect+setTimeout), add `// eslint-disable-next-line no-console` above the call.",
  },
];

// ── Scanner ────────────────────────────────────────────────────────────────

function getTemplateFiles() {
  const files = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
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

/**
 * Files in `src/components/` that render every frame (same drift-hazard
 * surface as templates for `console.*`). Returned separately so the lint
 * runner can apply only the `scope: "components-too"` rules to them,
 * skipping template-specific rules like `missing-composition-animation`
 * and `missing-title-block`.
 */
function getComponentFiles() {
  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(fullPath);
      else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  }
  walk(COMPONENTS_DIR);
  return files;
}

/**
 * Run all rules against in-memory content (no disk I/O). Used by tests.
 * Pass the same `filePath` as if the content were on disk — file-level rules
 * use it for path-based decisions (e.g. excluding deprecated dirs).
 */
export function lintContent(content, filePath, relativePath = filePath, scopeFilter = null) {
  const lines = content.split("\n");
  const issues = [];
  for (const rule of rules) {
    // When linting non-template files (e.g. src/components/), only rules
    // tagged with `scope: "components-too"` apply. Template-specific rules
    // like missing-composition-animation would false-positive on shared
    // components which legitimately don't call those hooks.
    if (scopeFilter && rule.scope !== scopeFilter) continue;
    if (rule.fileLevel) {
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
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.matchAll(rule.pattern);
        for (const match of matches) {
          if (rule.exclude && rule.exclude.test(line)) continue;
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

export function lintFile(filePath, scopeFilter = null) {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(path.resolve(__dirname, ".."), filePath);
  return lintContent(content, filePath, relativePath, scopeFilter);
}

/**
 * Repo-wide check for duplicate <Composition id="..."> values (L20).
 * Pass `rootContent` directly (testable) or call without args to read Root.tsx.
 */
export function lintRootCompositions(rootContent) {
  if (rootContent === undefined) {
    if (!fs.existsSync(ROOT_TSX)) return [];
    rootContent = fs.readFileSync(ROOT_TSX, "utf-8");
  }
  const idRe = /<Composition[^>]*\bid=["']([^"']+)["']/g;
  const seen = new Map();
  const issues = [];
  for (const m of rootContent.matchAll(idRe)) {
    const id = m[1];
    const lineNum = rootContent.slice(0, m.index).split("\n").length;
    if (seen.has(id)) {
      issues.push({
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
  return issues;
}

// Re-export rule definitions for inspection in tests.
export { rules };

// ── CLI ────────────────────────────────────────────────────────────────────
// Skip when imported as a module (e.g. by the test harness).
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (!isMain) {
  // No-op: tests import this file; the CLI block below should not execute.
} else {

const showFix = process.argv.includes("--fix");
const files = getTemplateFiles();
let allIssues = [];

for (const file of files) {
  const issues = lintFile(file);
  allIssues.push(...issues);
}

// Apply only the `scope: "components-too"` rules to src/components/ files —
// shared components render every frame at 30fps and share the
// console-in-render drift hazard with templates, but they legitimately
// don't call useCompositionAnimation/useDirection/TitleBlock themselves.
for (const file of getComponentFiles()) {
  const issues = lintFile(file, "components-too");
  allIssues.push(...issues);
}

allIssues.push(...lintRootCompositions());

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

} // end CLI guard
