/**
 * Meta-test: every registered Remotion composition has baseline coverage.
 *
 * Failure mode this catches: a new template lands in Root.tsx but the author
 * forgets to add it to templates.test.ts (or a *-real-data.test.ts). The
 * composition then silently has no visual-regression baseline — a future
 * refactor can break it without anyone noticing until episode render time.
 *
 * How it works:
 *   1. Statically scan every `<Composition id="LITERAL">` in src/templates/
 *      and src/Root.tsx. (Catalog and shortcut compositions use dynamic IDs
 *      and are skipped automatically by the literal-string match.)
 *   2. Scan every src/__tests__/*.test.ts for the literal `"<id>"` string —
 *      an ID counts as "covered" if any test file references it.
 *   3. Diff. Anything registered-but-not-covered must appear in
 *      ALLOWLIST_UNCOVERED with a reason.
 *
 * Adding a new template? Either:
 *   - Add a smoke entry to templates.test.ts (COMPOSITIONS array), OR
 *   - Add a real-data test under src/__tests__/<name>-real-data.test.ts, OR
 *   - Add an entry to ALLOWLIST_UNCOVERED below with the reason it's exempt.
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const SRC_DIR = path.resolve(__dirname, "..");
const TEMPLATES_DIR = path.join(SRC_DIR, "templates");
const ROOT_FILE = path.join(SRC_DIR, "Root.tsx");
const TESTS_DIR = __dirname;
const SELF_BASENAME = "template-coverage.test.ts";

// ── Registered-ID collection ────────────────────────────────────────────────

/** Recursively collect all .tsx files under a directory. */
function walkTsx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walkTsx(full));
    } else if (entry.isFile() && entry.name.endsWith(".tsx")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Extract literal `id="X"` strings from `<Composition>` JSX tags.
 *
 * Strategy: split on `<Composition`, then for each chunk read up to the
 * tag terminator (`/>` or `>`) and grep for a literal `id="..."`. This
 * tolerates JSX attribute order, multi-line tags, and dynamic `id={...}`
 * usages (which are silently skipped — exactly what we want for catalog
 * and shortcut compositions).
 */
function extractCompositionIds(src: string): string[] {
  const ids: string[] = [];
  const chunks = src.split("<Composition");
  for (let i = 1; i < chunks.length; i++) {
    const chunk = chunks[i];
    // Find the end of the opening tag — prefer self-close, else `>`.
    const selfCloseIdx = chunk.indexOf("/>");
    const openCloseIdx = chunk.indexOf(">");
    const tagEnd =
      selfCloseIdx >= 0 && (openCloseIdx < 0 || selfCloseIdx < openCloseIdx)
        ? selfCloseIdx
        : openCloseIdx;
    if (tagEnd < 0) continue;
    const tagBody = chunk.slice(0, tagEnd);
    const m = tagBody.match(/\bid\s*=\s*"([^"]+)"/);
    if (m) ids.push(m[1]);
  }
  return ids;
}

function collectRegisteredIds(): Set<string> {
  const files = [...walkTsx(TEMPLATES_DIR), ROOT_FILE];
  const ids = new Set<string>();
  for (const file of files) {
    const src = fs.readFileSync(file, "utf-8");
    for (const id of extractCompositionIds(src)) {
      ids.add(id);
    }
  }
  return ids;
}

// ── Coverage detection ──────────────────────────────────────────────────────

/**
 * An ID is "covered" if any *.test.ts file under src/__tests__/ contains the
 * literal quoted string `"<id>"`. We don't care WHICH test mentions it — the
 * meta-test only enforces existence of some baseline reference.
 *
 * Excludes this file itself (otherwise the ALLOWLIST entries below would
 * be self-coverage, defeating the audit).
 */
function collectCoveredIds(registered: Set<string>): Set<string> {
  const covered = new Set<string>();
  const testFiles = fs
    .readdirSync(TESTS_DIR)
    .filter((f) => f.endsWith(".test.ts") && f !== SELF_BASENAME)
    .map((f) => path.join(TESTS_DIR, f));

  for (const file of testFiles) {
    const src = fs.readFileSync(file, "utf-8");
    for (const id of registered) {
      if (covered.has(id)) continue;
      if (src.includes(`"${id}"`)) {
        covered.add(id);
      }
    }
  }
  return covered;
}

// ── Allowlist ───────────────────────────────────────────────────────────────

/**
 * Compositions that are intentionally NOT covered by templates.test.ts or a
 * *-real-data.test.ts. Each entry must have a reason. Adding here is a
 * deliberate exemption — prefer adding a real test when possible.
 */
const ALLOWLIST_UNCOVERED = new Map<string, string>([
  // ── Episode-specific compositions (kept tight) ────────────────────────
  // PrisonersDilemmaShowcase is the standalone showcase comp; it isn't yet
  // referenced in any test. (The -full episode IS — full-episode-smoke
  // exercises prisoners-dilemma-full, and silicon-trap variants appear in
  // multiple integrity tests, so those are covered.)
  ["prisoners-dilemma-showcase", "showcase comp; covered indirectly via component tests of inner templates"],

  // ── Test fixtures / non-visual ────────────────────────────────────────
  ["AudioPreview", "audio-only composition; no visual baseline applies"],

  // ── Primitive / wrapper compositions ──────────────────────────────────
  ["ForegroundBackdropFoundation", "primitive; surface tested via dynamic shortcut compositions + catalog"],
  ["EditorialFrameHeroFlippedTest", "editorial frame test fixture; variant of the Hero test"],
  ["EditorialFrameAsideTest", "editorial frame test fixture; not a production template"],
  ["EditorialFrameMinimalTest", "editorial frame test fixture; not a production template"],

  // ── Deprecated / backward-compat ──────────────────────────────────────
  ["TimelineComparison-Short", "deprecated; replaced by HorizontalTimeline"],

  // ── Standalone tooling compositions ───────────────────────────────────
  ["Thumbnail", "rendered separately by scripts/generate-thumbnails.mjs per episode"],

  // ── Composite wrappers ────────────────────────────────────────────────
  ["BayesianUpdate-Multi", "wrapper around BayesianUpdate; inner template is baselined"],

  // ── Phase 4 editorial-frame templates (real-data tests deferred) ──────
  // Built May 17, 2026 as part of EDITORIAL_FRAME_ARCHITECTURE.md Phase 4
  // (5 missing chart types). Render-still validation passed manually before
  // shipping; the EditorialFrame composition wrapper itself is exercised by
  // editorialFrame-visual.test.ts. Per-template real-data tests
  // (-real-data.test.ts) and visual baselines (templates.test.ts) are
  // deferred until a published episode actually uses them — at which point
  // coverage flips to that episode's smoke test. Add a -real-data test
  // before promoting any of these into production rendering.
  ["Slopegraph", "Phase 4 editorial-frame template; manual render validation only — add -real-data test before production use"],
  ["KPICard", "Phase 4 editorial-frame template; manual render validation only — add -real-data test before production use"],
  ["BulletChart", "Phase 4 editorial-frame template; manual render validation only — add -real-data test before production use"],
  ["StepLine", "Phase 4 editorial-frame template; manual render validation only — add -real-data test before production use"],
  // OutcomePartition shipped May 17-18 (decision-space partition map, sibling
  // of DecisionTree). Same Phase-4 convention: manual render validation
  // before ship; coverage promoted when an episode actually uses it.
  ["OutcomePartition", "Phase 4-style template (shipped May 17-18); manual render validation only — add -real-data test before production use"],
]);

// ── Tests ───────────────────────────────────────────────────────────────────

describe("template-coverage meta-test", () => {
  const registered = collectRegisteredIds();
  const covered = collectCoveredIds(registered);

  it("collects a non-trivial set of registered composition IDs", () => {
    // Sanity: we should find at least 30 registered IDs. A drop below this
    // means the extractor regex broke, not that compositions vanished.
    expect(registered.size).toBeGreaterThan(30);
  });

  it("every registered composition is either covered by a test or explicitly allowlisted", () => {
    const uncovered: string[] = [];
    const stale: string[] = []; // allowlist entries that ARE covered (should be removed)

    for (const id of registered) {
      const isCovered = covered.has(id);
      const isAllowed = ALLOWLIST_UNCOVERED.has(id);
      if (!isCovered && !isAllowed) {
        uncovered.push(id);
      }
      if (isCovered && isAllowed) {
        stale.push(id);
      }
    }

    if (uncovered.length > 0) {
      throw new Error(
        `\n${uncovered.length} composition(s) registered in Root.tsx have no test coverage:\n` +
          uncovered.map((id) => `  - ${id}`).join("\n") +
          `\n\nFix: either add the composition to templates.test.ts COMPOSITIONS array,\n` +
          `add a real-data test under src/__tests__/<name>-real-data.test.ts,\n` +
          `or add an ALLOWLIST_UNCOVERED entry in template-coverage.test.ts with a reason.\n`,
      );
    }

    if (stale.length > 0) {
      throw new Error(
        `\n${stale.length} composition(s) are on ALLOWLIST_UNCOVERED but ARE covered by a test:\n` +
          stale.map((id) => `  - ${id}`).join("\n") +
          `\n\nFix: remove the stale allowlist entries from template-coverage.test.ts.\n`,
      );
    }

    expect(uncovered).toEqual([]);
    expect(stale).toEqual([]);
  });

  it("every ALLOWLIST_UNCOVERED entry refers to a currently-registered composition", () => {
    // Stops the allowlist from drifting — if a composition is removed from
    // Root.tsx, its allowlist entry becomes dead weight.
    const dead: string[] = [];
    for (const id of ALLOWLIST_UNCOVERED.keys()) {
      if (!registered.has(id)) dead.push(id);
    }

    if (dead.length > 0) {
      throw new Error(
        `\n${dead.length} ALLOWLIST_UNCOVERED entries reference compositions that no longer exist:\n` +
          dead.map((id) => `  - ${id}`).join("\n") +
          `\n\nFix: remove these entries from template-coverage.test.ts.\n`,
      );
    }
    expect(dead).toEqual([]);
  });
});
