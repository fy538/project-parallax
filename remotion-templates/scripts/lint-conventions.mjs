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
 *  10. Compositions derive durationInFrames from data via calculateMetadata, not hardcoded (L48)
 *  11. Template directories with types.ts must also have schema.ts (L47)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = path.resolve(__dirname, "../src/templates");
const COMPONENTS_DIR = path.resolve(__dirname, "../src/components");
const CATALOG_DIR = path.resolve(__dirname, "../src/catalog");
const ROOT_TSX = path.resolve(__dirname, "../src/Root.tsx");

// Files to exclude from checking (shared infrastructure, not templates)
const EXCLUDE_DIRS = ["__tests__"];
// Episodes/ is excluded from the full template scan (avoids false positives on
// missing-composition-animation for complex master compositions), but is covered
// by the targeted "components-too" scan below that includes hardcoded-brand-color.
const EXCLUDE_DIRS_EPISODES = ["Episodes", "__tests__"];

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

      // Check if it renders a title but doesn't use a recognized title
      // chrome component. Four delegation paths satisfy the rule:
      //
      //   · TitleBlock          → canonical centered hierarchy
      //   · MapTitleFrame       → map-overlay banner/cartouche/inline
      //   · EditorialFrame      → Phase-4 chart-family publication chrome
      //                            (renders data.title via frameProps header)
      //   · React.memo'd sub-component → likely a child of a parent that
      //                                    owns the chrome
      //
      // May 2026 audit #18: added EditorialFrame detection here to match
      // the same exemption in tools/lint/polish_lint.py. Without it, the
      // 8 chart-family templates that delegate to EditorialFrame surfaced
      // as info-level missing-title-block warnings forever.
      const hasTitle = content.includes("data.title");
      const hasTitleBlock = content.includes("TitleBlock");
      const hasMapTitleFrame = content.includes("MapTitleFrame");
      const hasEditorialFrame = content.includes("<EditorialFrame");
      const hasSubComponents = content.includes("React.memo");

      if (hasTitle && !hasTitleBlock && !hasMapTitleFrame && !hasEditorialFrame && !hasSubComponents) {
        return [{ line: 1, message: "Has title data but doesn't use TitleBlock / MapTitleFrame / EditorialFrame" }];
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
    severity: "error",
    scope: "components-too",  // also runs in component + episode scan passes
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
  // ── Rule 11: data.durationSec must have a fallback ────────────────────────
  // `durationSec` is optional on many template Zod schemas (`z.number().optional()`
  // or `z.number().positive().optional()`). Bare access produces `undefined`,
  // which `sec()` then turns into `NaN` frames, which Remotion turns into a
  // crash or an empty render. CLAUDE.md says: "Don't access data.durationSec
  // without a ?? 0 fallback."
  //
  // The rule accepts either `?? N` (nullish coalescing) or `|| N` (logical OR)
  // as valid fallbacks. Both short-circuit on `undefined`, which is the only
  // shape that matters for `durationSec` (0 is rejected at the Zod level via
  // `.positive()` in most schemas, so `||` doesn't accidentally short-circuit
  // a real value). The codebase has standardized on `||`; allowing both
  // avoids gratuitous stylistic churn.
  //
  // Skipped: dep-array context (the line contains `[` BEFORE the match and
  // `]` AFTER), because `useMemo`/`useEffect`/`useCallback` deps must reference
  // the raw value, not a fallback expression. Skipped: optional-chain reads
  // (`?.durationSec`) — those yield undefined and the consumer handles it.
  //
  // Suppression: `// eslint-disable-next-line no-bare-durationSec` on the
  // line above, for the rare case where the bare access is intentional.
  {
    id: "no-bare-durationSec",
    description: "data.durationSec accessed without ?? or || fallback — undefined → NaN frames → render crash",
    fileLevel: true,
    check: (content, filePath) => {
      const lines = content.split("\n");
      const issues = [];
      // Match `data.durationSec` or `(props.data as Foo).durationSec`.
      // Word-boundary on the left so `phase.durationSec`, `clip.durationSec`,
      // `img.durationSec` (which are required Zod fields on sub-schemas)
      // don't match — those are explicitly out of scope.
      const accessRe =
        /(?:\)|^|[^a-zA-Z_.])(?:data|props\.data)\.durationSec\b/g;
      const suppressRe =
        /eslint-disable(?:-next)?-line\s+no-bare-durationSec/;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip comment-only lines
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue;
        // Above-line suppression on the previous non-blank line
        const prev = lines[i - 1] ?? "";
        if (suppressRe.test(prev) || suppressRe.test(line)) continue;

        for (const m of line.matchAll(accessRe)) {
          const matchStart = m.index ?? 0;
          // Look ahead 30 chars for a fallback operator (?? or ||)
          const after = line.slice(
            matchStart + m[0].length,
            matchStart + m[0].length + 30,
          );
          if (/\s*(\?\?|\|\|)/.test(after)) continue;

          // Skip dep-array context: line has `[` before the match AND `]`
          // after the match. Loose but matches useMemo/useEffect/useCallback
          // deps which legitimately need the raw value.
          const before = line.slice(0, matchStart);
          if (/\[/.test(before) && /\]/.test(after)) continue;

          // Skip optional-chain reads — `?.durationSec` yields undefined
          // safely. The regex above doesn't match `?.` because the char
          // class `[^a-zA-Z_.]` excludes `.`, but `?` slips through. Check
          // explicitly.
          if (/\?\.durationSec/.test(m[0])) continue;

          issues.push({
            line: i + 1,
            message:
              "data.durationSec accessed without `??` or `||` fallback — undefined turns into NaN frames in `sec()`. Use `data.durationSec ?? <default>` or `data.durationSec || <default>` (most templates use 5–14s).",
          });
        }
      }
      return issues;
    },
    severity: "warn",
    fix: "Wrap the access with a fallback: `sec(data.durationSec ?? 8)` (or `|| 8`). Pick a default that matches the template's natural duration — most use 5–14s.",
  },
  // ── Rule 12: No `as any` in template files ────────────────────────────────
  // `as any` silently disables TypeScript's type safety. In templates this
  // manifests as runtime crashes that never surface until render time. Common
  // symptoms: wrong data shape passed to a child component, Mapbox layer
  // expressions accepted by TS but rejected at runtime, deck.gl prop mismatches.
  //
  // Legitimate exceptions (Mapbox GL expression arrays that TypeScript can't
  // type-check against the runtime expression grammar, fitProjectionToFeatures
  // d3-geo interop) should be suppressed individually with an inline comment:
  //   `// no-as-any-ok: <reason>` on the SAME line, or
  //   `// eslint-disable-next-line no-as-any-in-templates` on the line ABOVE.
  //
  // Exceptions that have been reviewed and allowed:
  //   - ChoroplethMap.tsx: Mapbox GL expression arrays — the TS types for
  //     layer `paint`/`layout` properties don't accept dynamic expression
  //     arrays even though they're valid at runtime. Each occurrence is
  //     individually suppressed with `// no-as-any-ok: mapbox-expression`.
  //   - AtlasPlate.tsx / ProportionalSymbolMap.tsx: fitProjectionToFeatures
  //     d3-geo interop (GeoJSON type mismatch between TopoJSON converter
  //     output and d3's expected FeatureCollection).
  //   - Episodes/*Full.tsx / FilmOverlayCascadeTestComp.tsx: manifest cast —
  //     AssemblyManifest type not yet exported from FullEpisode public surface.
  //   - Shorts/DataChartShort.tsx: backgroundVariant accessed on generic type.
  {
    id: "no-as-any-in-templates",
    description: "Avoid `as any` — disables TypeScript safety; suppress with `// no-as-any-ok: <reason>` on the same line",
    fileLevel: true,
    check: (content) => {
      const lines = content.split("\n");
      const issues = [];
      // Accepts both our custom tag and the standard @typescript-eslint suppression.
      const suppressSameLine =
        /\/\/\s*(no-as-any-ok:|eslint-disable(?:-next)?-line\s+(no-as-any-in-templates|@typescript-eslint\/no-explicit-any))/;
      // Preceding-line suppression (eslint-disable-next-line pattern)
      const suppressPrevLine =
        /eslint-disable-next-line\s+(no-as-any-in-templates|@typescript-eslint\/no-explicit-any)/;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip comment-only lines
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) continue;
        // Check if this line uses `as any`
        if (!/\bas\s+any\b/.test(line)) continue;

        // Allow if the same line has a suppression comment
        if (suppressSameLine.test(line)) continue;

        // Allow if the immediately preceding non-blank line has an above-line
        // suppression (eslint-disable-next-line style)
        const prev = lines[i - 1] ?? "";
        if (suppressPrevLine.test(prev)) continue;

        issues.push({
          line: i + 1,
          message:
            "`as any` found — this disables TypeScript type safety. " +
            "Add `// no-as-any-ok: <reason>` on the same line if this cast " +
            "is genuinely unavoidable (e.g. Mapbox expression array, d3 interop), " +
            "or fix the type to avoid the cast.",
        });
      }
      return issues;
    },
    severity: "warn",
    fix: "Either (a) fix the type to avoid the cast, (b) add `// no-as-any-ok: <reason>` on the same line for documented exceptions, or (c) use `as unknown as TargetType` for two-step casts where the intermediate type is verifiable.",
  },

  // ── L48: Composition durationInFrames must derive from data, not be hardcoded ──
  // Hardcoded `durationInFrames={sec(N)}` on a <Composition> desyncs whenever
  // an episode's JSON `data.durationSec` changes. The canonical pattern is
  // `calculateMetadata={({ props }) => ({ durationInFrames: sec(props.data.durationSec ?? FALLBACK), ... })}`.
  // Genuine fixtures with no data-driven duration opt out with the pragma
  // `// @hardcoded-duration: fixture` at the top of the file.
  {
    id: "composition-hardcoded-duration",
    description: "Compositions must derive durationInFrames from data via calculateMetadata, not hardcode it (L48)",
    fileLevel: true,
    check: (content, filePath) => {
      const basename = path.basename(filePath);
      if (basename !== "index.tsx") return [];
      if (!content.includes("<Composition")) return [];
      // Opt-out pragma for fixtures (EditorialTest frame demos, etc.)
      if (content.includes("@hardcoded-duration: fixture")) return [];

      const issues = [];
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        // Match the form `durationInFrames={sec(...)}` — the literal one,
        // not `durationInFrames: sec(...)` inside a calculateMetadata return
        // (which is the correct pattern).
        const match = lines[i].match(/durationInFrames\s*=\s*\{\s*sec\(/);
        if (!match) continue;

        // Look in a window around this line for a matching `calculateMetadata`
        // in the SAME <Composition> block. ±20 lines covers every existing
        // composition block in the codebase.
        const windowStart = Math.max(0, i - 20);
        const windowEnd = Math.min(lines.length, i + 20);
        const windowText = lines.slice(windowStart, windowEnd).join("\n");
        if (windowText.includes("calculateMetadata")) continue;

        issues.push({
          line: i + 1,
          col: match.index + 1,
          message:
            "Hardcoded `durationInFrames={sec(...)}` will desync when the JSON's " +
            "data.durationSec changes. Switch to calculateMetadata.",
        });
      }
      return issues;
    },
    severity: "warn",
    fix:
      "Replace with `calculateMetadata={({ props }) => ({ durationInFrames: " +
      "sec((props.data as YourDataType).durationSec ?? 8), fps: layout.fps, " +
      "width: layout.width, height: layout.height })}`. " +
      "For fixtures without data-driven duration, add `// @hardcoded-duration: fixture` " +
      "as a comment near the top of the file.",
  },

  // ── L47: Template directories with types.ts must also have schema.ts ──
  // Without schema.ts the Composition can't be Zod-validated (invalid data
  // renders silently broken instead of failing loudly) and Remotion Studio's
  // visual prop editor falls back to a generic JSON editor.
  // Triggered on `types.ts` so we fire exactly once per template directory.
  {
    id: "template-missing-schema",
    description: "Template directories with types.ts must also have schema.ts (L47)",
    fileLevel: true,
    check: (content, filePath) => {
      const basename = path.basename(filePath);
      if (basename !== "types.ts") return [];

      // Skip collection / wrapper directories whose children are
      // independently-checked templates, and skip episode + fixture dirs.
      const dir = path.dirname(filePath);
      const dirName = path.basename(dir);
      if (["Shorts", "Episodes", "EditorialTest"].includes(dirName)) return [];

      const schemaPath = path.join(dir, "schema.ts");
      if (fs.existsSync(schemaPath)) return [];

      return [{
        line: 1,
        col: 1,
        message:
          `Template directory \`${dirName}\` has types.ts but no schema.ts. ` +
          "Without it the Composition can't be Zod-validated at render time and " +
          "Studio's visual prop editor falls back to raw JSON.",
      }];
    },
    severity: "warn",
    fix:
      "Create `schema.ts` in this directory exporting a Zod schema that mirrors " +
      "the type in `types.ts`. Wrap in `z.object({ data: z.object({...}) })` to " +
      "match the `defaultProps={{ data: ... }}` shape used by the Composition.",
  },

  // ── M-BRAND-MARK-LITERAL: block hardcoded brand glyph outside canonical sites ──
  // The literal `∴` is centralized in `palette.json::brandMark.glyph` → exported
  // as `brandMark.glyph` from `theme.ts` → rendered via the `<BrandMark>` and
  // `<BrandLockup>` components. Swapping the channel mark (∴ → another glyph
  // or an SVG asset) should be a one-line change in palette.json, not a
  // codebase grep-and-replace. This rule blocks new hardcoded literals in
  // executable JSX/TS, but allows them in comments, JSDoc, generated `.d.ts`
  // files, and the canonical declaration sites listed below.
  {
    id: "no-literal-brand-mark",
    description:
      "Hardcoded `∴` outside the canonical brand-mark sites. Use `brandMark.glyph` from `design/theme` or render via `<BrandLockup>` / `<BrandMark>`.",
    fileLevel: true,
    // Apply to four scan passes: templates (default), components, episodes,
    // and catalog. Catalog is the most regression-prone surface (its footers
    // are exactly the literals this refactor cleaned up).
    scope: ["components-too", "catalog"],
    check: (content, filePath) => {
      // Allowlist: canonical declaration + render sites. Match without a
      // leading slash so the rule works in both real runs (absolute paths
      // from `walk()`) and unit tests (relative paths from `lintContent`).
      const allowedSubstrings = [
        "src/design/theme.ts",                      // the const declaration
        "src/components/BrandLockup.tsx",           // canonical render site (docs only)
        "src/components/EditorialScaffold.tsx",     // BrandMark component lives here
        "src/types/generated/",                     // generated .d.ts from JSON schema
        "src/__tests__/",                           // tests that assert the glyph appears
      ];
      if (allowedSubstrings.some((s) => filePath.includes(s))) return [];

      // Skip `.d.ts` files everywhere (generated).
      if (filePath.endsWith(".d.ts")) return [];

      // Blank out comments before scanning, preserving line count so reported
      // line numbers match the source file. JSDoc and inline comments may
      // legitimately describe the brand mark (e.g. `// ∴ brand mark — amber`).
      // `.replace(..., "")` would collapse newlines and silently shift all
      // subsequent reported line numbers — strip-by-line keeps the mapping 1:1.
      const lines = content.split("\n");
      let inBlockComment = false;
      const stripped = lines.map((line) => {
        let out = "";
        let i = 0;
        while (i < line.length) {
          if (inBlockComment) {
            const end = line.indexOf("*/", i);
            if (end === -1) { i = line.length; break; }
            inBlockComment = false;
            i = end + 2;
            continue;
          }
          // `//` line comment — but allow `://` (URLs in strings).
          if (line[i] === "/" && line[i + 1] === "/" && line[i - 1] !== ":") {
            break;  // rest of line is comment
          }
          if (line[i] === "/" && line[i + 1] === "*") {
            inBlockComment = true;
            i += 2;
            continue;
          }
          out += line[i];
          i += 1;
        }
        return out;
      });

      const issues = [];
      stripped.forEach((line, i) => {
        if (line.includes("∴")) {
          issues.push({
            line: i + 1,
            message:
              "Hardcoded `∴` literal — use `brandMark.glyph` (from `design/theme`) or `<BrandLockup>` / `<BrandMark>`.",
          });
        }
      });
      return issues;
    },
    severity: "error",
    fix:
      "Replace the literal `∴` with `{brandMark.glyph}` (after `import { brandMark } from '<path>/design/theme'`), " +
      "or — if you're building a footer lockup like `∴ parallax · context` — use `<BrandLockup>context</BrandLockup>`.",
  },

  // ── M-ZINDEX-GLOBAL-SCALE: block bare zIndex literals on the global scale ──
  // The 8-tier global stacking scale lives in `theme.ts` as `zIndex.{base,
  // attribution, callout, overlay, transition, hud, meta, chrome}`. Bare
  // integer values that match one of those tiers (5, 9, 10, 11, 15, 19, 20)
  // are almost always a missed migration; if intentional (local stacking
  // inside a single component that happens to land on the same number),
  // suppress with an inline pragma:
  //
  //   // no-bare-zindex-on-global-scale: ok
  //   zIndex: 10,
  //
  // Local stacking values that don't collide with a global tier (0, 1, 2,
  // 3, 6, 7, 8) are NOT blocked — those are normal intra-component layering
  // and forcing them through a token would create worse semantic confusion
  // than leaving them bare. Special case: `0` is excluded because it's the
  // CSS default and used everywhere for "behind."
  {
    id: "no-bare-zindex-on-global-scale",
    description:
      "Bare `zIndex: N` for N in the global scale {5, 9, 10, 11, 15, 19, 20}. Use `zIndex.<layer>` from `design/theme`.",
    fileLevel: true,
    scope: ["components-too", "catalog"],
    check: (content, filePath) => {
      // Allowlist: the scale declaration site + tests + generated.
      const allowedSubstrings = [
        "src/design/theme.ts",
        "src/__tests__/",
      ];
      if (allowedSubstrings.some((s) => filePath.includes(s))) return [];
      if (filePath.endsWith(".d.ts")) return [];

      const BLOCKED = new Set([5, 9, 10, 11, 15, 19, 20]);
      const issues = [];
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const m = line.match(/zIndex:\s*(\d+)\b/);
        if (!m) continue;
        const val = Number(m[1]);
        if (!BLOCKED.has(val)) continue;

        // Inline pragma on the same line OR the immediately preceding line.
        const prev = i > 0 ? lines[i - 1] : "";
        if (line.includes("no-bare-zindex-on-global-scale: ok")) continue;
        if (prev.includes("no-bare-zindex-on-global-scale: ok")) continue;

        const tier =
          val === 5  ? "zIndex.attribution"
          : val === 9  ? "zIndex.callout"
          : val === 10 ? "zIndex.overlay"
          : val === 11 ? "zIndex.transition"
          : val === 15 ? "zIndex.hud"
          : val === 19 ? "zIndex.meta"
          : /* 20 */   "zIndex.chrome";

        issues.push({
          line: i + 1,
          message: `Bare \`zIndex: ${val}\` — use \`${tier}\` (from \`design/theme\`) or add \`// no-bare-zindex-on-global-scale: ok\` if intentional local stacking.`,
        });
      }
      return issues;
    },
    severity: "error",
    fix:
      "Import `zIndex` from `<path>/design/theme` and replace the literal with the " +
      "named tier (5 → attribution, 9 → callout, 10 → overlay, 11 → transition, " +
      "15 → hud, 19 → meta, 20 → chrome). For intentional intra-component " +
      "stacking that happens to land on a tier number, add the inline pragma " +
      "`// no-bare-zindex-on-global-scale: ok` above the line.",
  },
];

// ── Scanner ────────────────────────────────────────────────────────────────

function getTemplateFiles() {
  const files = [];

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    const dirName = path.basename(dir);
    // Episodes/ excluded from full scan (complex master compositions would
    // false-positive on missing-composition-animation). Covered separately below.
    if (EXCLUDE_DIRS_EPISODES.includes(dirName)) return;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
        files.push(fullPath);
      }
    }
  }

  walk(TEMPLATES_DIR);
  return files;
}

/**
 * Files in `src/templates/Episodes/` — excluded from the full template scan
 * but checked for brand-color violations via the "components-too" scope filter.
 */
function getEpisodeFiles() {
  const episodesDir = path.join(TEMPLATES_DIR, "Episodes");
  const files = [];
  if (!fs.existsSync(episodesDir)) return files;
  for (const entry of fs.readdirSync(episodesDir, { withFileTypes: true })) {
    if (entry.name.endsWith(".tsx") || entry.name.endsWith(".ts")) {
      files.push(path.join(episodesDir, entry.name));
    }
  }
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
 * Files in `src/catalog/` (visual-reference compositions: catalog showreel,
 * editorial-directions explorations, atomic + composite text-animation
 * showcases). They render brand chrome (footers with the lockup, the slate
 * cover) and so share the same brand-mark hygiene surface as templates.
 * Returned separately so the runner applies only `scope: "components-too"`
 * rules (skipping template-only checks like `missing-composition-animation`).
 */
function getCatalogFiles() {
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
  walk(CATALOG_DIR);
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
    if (scopeFilter) {
      // `rule.scope` may be a single string or an array of strings (rules
      // that should apply to multiple separately-scanned directories).
      const ruleScopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];
      if (!ruleScopes.includes(scopeFilter)) continue;
    }
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

/**
 * Repo-wide check: templates marked `@deprecated` in their source must NOT
 * appear in either dispatch registry (TEMPLATE_COMPONENTS in FullEpisode.tsx
 * or TEMPLATE_SCHEMAS in Episodes/templateSchemas.ts). Manifest authors pick
 * templates by name from these registries; a deprecated entry there is a
 * silent-use risk — they can keep selecting it indefinitely without warning.
 *
 * Source files remain in the tree (visual reference, catalog showreel, git
 * provenance). Removal from the dispatch registries is the operational gate.
 *
 * Added: May 18, 2026 engineering audit P0 #8.
 */
export function lintDeprecatedTemplateDispatch(
  templatesDir = TEMPLATES_DIR,
  fullEpisodePath = path.resolve(__dirname, "../src/templates/Episodes/FullEpisode.tsx"),
  templateSchemasPath = path.resolve(__dirname, "../src/templates/Episodes/templateSchemas.ts"),
) {
  if (!fs.existsSync(templatesDir)) return [];
  const issues = [];

  // 1. Find every template whose main .tsx has a `@deprecated` JSDoc tag.
  //    Convention: each template lives at templates/<Name>/<Name>.tsx.
  const deprecated = new Set();
  for (const entry of fs.readdirSync(templatesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith("_") || entry.name === "Episodes" || entry.name === "Shorts") continue;
    const mainTsx = path.join(templatesDir, entry.name, `${entry.name}.tsx`);
    if (!fs.existsSync(mainTsx)) continue;
    const src = fs.readFileSync(mainTsx, "utf-8");
    // Only flag templates whose `@deprecated` tag is in the file-level JSDoc
    // (first ~30 lines). Catches the documented-deprecation case without
    // false-positiving on per-symbol `@deprecated` deeper in the file.
    const head = src.split("\n").slice(0, 30).join("\n");
    if (/@deprecated/.test(head)) {
      deprecated.add(entry.name);
    }
  }
  if (deprecated.size === 0) return issues;

  // 2. Scan dispatch registries for any deprecated name as an identifier.
  const dispatchFiles = [
    { path: fullEpisodePath, registry: "TEMPLATE_COMPONENTS" },
    { path: templateSchemasPath, registry: "TEMPLATE_SCHEMAS" },
  ];
  for (const { path: filePath, registry } of dispatchFiles) {
    if (!fs.existsSync(filePath)) continue;
    const src = fs.readFileSync(filePath, "utf-8");
    const lines = src.split("\n");
    for (const name of deprecated) {
      // Look for the deprecated name as a registry key: `  Name,` or `  Name:`
      // (object shorthand / value position inside the registry literal). The
      // regex deliberately requires comma OR colon AFTER the bare identifier
      // so we don't false-positive on import lines, comments, or string
      // references elsewhere in the file.
      const keyRe = new RegExp(`^\\s+${name}[,:]\\s*$|^\\s+${name}:\\s`, "m");
      for (let i = 0; i < lines.length; i++) {
        if (keyRe.test(lines[i])) {
          issues.push({
            file: path.relative(path.resolve(__dirname, ".."), filePath),
            line: i + 1,
            rule: "no-deprecated-template-dispatch",
            severity: "error",
            message: `Deprecated template '${name}' registered in ${registry} — manifest authors can still silently dispatch to it. Remove from the registry (keep source file for reference).`,
            fix: `Delete the '${name}' entry from ${registry} in this file. The template's source can stay under src/templates/${name}/ for catalog + historical reference.`,
          });
        }
      }
    }
  }
  return issues;
}

/**
 * Repo-wide check: types.ts files in template directories must derive
 * their types from schema.ts via z.infer, not hand-duplicate the shape.
 *
 * The old pattern (hand-typed types.ts + parallel schema.ts) silently
 * drifted whenever a field was added to one file without the other.
 * Adopters (z.infer) are the canonical pattern as of May 2026 audit #3.
 *
 * Grandfather list (TYPES_DRIFT_GRANDFATHERED below) tolerates the 46
 * templates that haven't been migrated yet. The list is the SHRINKABLE
 * surface: when a template is touched, migrate its types.ts to z.infer
 * and remove the entry. New templates (not in the list) get blocked at
 * commit time.
 *
 * Detection: a types.ts file is FLAGGED when:
 *   1. A sibling schema.ts exists, AND
 *   2. types.ts has no `z.infer` reference AND no `// @types-drift: ok`
 *      pragma (escape hatch with rationale required), AND
 *   3. types.ts declares at least one `export interface` or `export type`.
 *
 * Added: May 18, 2026 engineering audit #3.
 */
export const TYPES_DRIFT_GRANDFATHERED = new Set([
  // EditorialTest test fixture only — not a production template, kept here
  // because its hand-typed shape exists for fixture purposes, not for any
  // schema-derived runtime path. All production templates now derive their
  // types from their Zod schemas via z.infer (May 2026 audit #3 burn-down,
  // completed May 18, 2026).
  "EditorialTest",
]);

export function lintTypesDriftFromSchema(templatesDir = TEMPLATES_DIR) {
  if (!fs.existsSync(templatesDir)) return [];
  const issues = [];
  for (const entry of fs.readdirSync(templatesDir, { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name.startsWith("_") || entry.name === "Episodes" || entry.name === "Shorts") continue;

    const typesPath = path.join(templatesDir, entry.name, "types.ts");
    const schemaPath = path.join(templatesDir, entry.name, "schema.ts");
    if (!fs.existsSync(typesPath) || !fs.existsSync(schemaPath)) continue;

    const typesContent = fs.readFileSync(typesPath, "utf-8");

    // Migrated (uses z.infer)? Skip.
    if (typesContent.includes("z.infer")) {
      // Stale entry — was on the grandfather list but now migrated.
      // Stale entries don't break anything but should be cleaned up so
      // the list reflects truth. We could surface that here, but since
      // the manual list-shrink workflow is the point, we keep it quiet.
      continue;
    }
    // Explicit escape hatch.
    if (/\/\/\s*@types-drift:\s*ok/.test(typesContent)) continue;
    // No interface / type declarations? Not really a types.ts in the
    // sense the rule targets; skip silently.
    if (!/export\s+(interface|type)\s+\w/.test(typesContent)) continue;
    // Grandfathered → tolerated.
    if (TYPES_DRIFT_GRANDFATHERED.has(entry.name)) continue;

    issues.push({
      file: path.relative(path.resolve(__dirname, ".."), typesPath),
      line: 1,
      rule: "types-drift-from-schema",
      severity: "error",
      message: (
        `Template '${entry.name}' has both types.ts and schema.ts but ` +
        `types.ts hand-declares interfaces/types instead of deriving ` +
        `them via z.infer<typeof XSchema>. This is the pattern that ` +
        `silently drifts between the two files. See StatReveal for the ` +
        `canonical migration.`
      ),
      fix: (
        `Export the inner data shape as <Name>DataSchema in schema.ts, ` +
        `then in types.ts: \`export type <Name>Data = z.infer<typeof <Name>DataSchema>\`. ` +
        `Remove the entry from TYPES_DRIFT_GRANDFATHERED in lint-conventions.mjs ` +
        `after migration. Or, with rationale, add \`// @types-drift: ok\` ` +
        `to types.ts.`
      ),
    });
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

// Apply `scope: "components-too"` rules to src/templates/Episodes/ —
// master compositions (FullEpisode, PrisonersDilemmaFull, etc.) are too
// complex for the full template-rule set, but must still obey brand-color
// and console-in-render hygiene.
for (const file of getEpisodeFiles()) {
  const issues = lintFile(file, "components-too");
  allIssues.push(...issues);
}

// Apply `scope: "components-too"` rules to src/catalog/ — the catalog
// compositions render brand chrome (footers, slate) and so are part of
// the brand-mark hygiene surface. Without this pass, regressions in
// catalog files would silently bypass the `no-literal-brand-mark` rule.
for (const file of getCatalogFiles()) {
  const issues = lintFile(file, "catalog");
  allIssues.push(...issues);
}

allIssues.push(...lintRootCompositions());
allIssues.push(...lintDeprecatedTemplateDispatch());
allIssues.push(...lintTypesDriftFromSchema());

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
