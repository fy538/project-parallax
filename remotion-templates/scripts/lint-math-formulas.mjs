#!/usr/bin/env node
/**
 * lint-math-formulas.mjs — validate every KaTeX formula in episode data.
 *
 * Phase 4+5 of the math-rendering register. Scans every JSON file under
 * `data/episodes/**` for math-render data shapes (MathReveal,
 * MathDerivation) and runs each `formula` through three checks:
 *
 *   M-MATH-VALID  (Phase 4) — KaTeX strict parse check
 *   M-MATH-LENGTH (Phase 5) — TeX source > 80 chars per step
 *   M-MATH-COLOR  (Phase 5) — \textcolor{HEX} with off-brand hex
 *
 * This is the line of defense between "typo in a TeX source" and
 * "composition renders a red KaTeX error inline." The MathExpression
 * component uses `throwOnError: false` so a typo doesn't crash the
 * render — but the lint here catches it before publish.
 *
 * Wired into:
 *   · `scripts/lint.sh` — full repo lint suite
 *   · Run standalone: `node remotion-templates/scripts/lint-math-formulas.mjs`
 *
 * Exported for tests (ESM):
 *   extractFormulas, validateFormula, checkFormulaLength, checkFormulaColors,
 *   ALLOWED_TEXTCOLOR_HEXES
 *
 * Exit codes:
 *   0 — all formulas pass all checks
 *   1 — at least one check failure
 *   2 — usage / IO error
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import katex from "katex";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const EPISODES_DIR = path.resolve(__dirname, "..", "data", "episodes");

// ── Formula extraction ─────────────────────────────────────────────────────

/**
 * Walk a parsed JSON value, yielding every string field named `formula`.
 * Math-render data shapes carry `formula` at:
 *   · top level (MathReveal)               — { formula, ... }
 *   · each entry of `steps[]` (MathDerivation) — { steps: [{ formula, ... }, ...] }
 *
 * Future shapes (Phase 5+) — e.g. an inline-math field in arbitrary
 * templates — will surface here automatically as soon as the field name
 * matches. If we ever rename `formula`, this lint needs updating.
 */
function* extractFormulas(obj, pathPrefix = "$") {
  if (obj == null) return;
  if (typeof obj === "string") return;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      yield* extractFormulas(obj[i], `${pathPrefix}[${i}]`);
    }
    return;
  }
  if (typeof obj !== "object") return;

  for (const [key, value] of Object.entries(obj)) {
    const here = `${pathPrefix}.${key}`;
    if (key === "formula" && typeof value === "string") {
      yield { formula: value, pointer: here };
    } else {
      yield* extractFormulas(value, here);
    }
  }
}

// ── Brand palette (for M-MATH-COLOR) ──────────────────────────────────────

/**
 * Permitted hex values for `\textcolor{HEX}{}` in TeX source. Must match
 * the "Brand color hexes" table in project/MATH_RENDER_REGISTER.md §03.
 * All comparisons are case-insensitive (uppercase normalised).
 */
const ALLOWED_TEXTCOLOR_HEXES = new Set([
  "#C4A747", // gold — primary accent, "look here"
  "#A64D46", // rust/china — boundary clause / danger
  "#7AA3C9", // dustblue — us / cool semantic
  "#5C4A3D", // walnut — secondary emphasis
  "#1C1814", // ink — body (default; rarely needed explicitly)
]);

// ── Validation ─────────────────────────────────────────────────────────────

/**
 * Returns null on success, or an error message on failure. KaTeX is
 * called with `throwOnError: true` so syntax errors surface as exceptions
 * we can catch and report cleanly.
 */
function validateFormula(formula) {
  try {
    katex.renderToString(formula, {
      displayMode: true,
      throwOnError: true,
      strict: "warn", // warn on KaTeX-isms; surface as errors below
    });
    return null;
  } catch (e) {
    return e && e.message ? e.message : String(e);
  }
}

/**
 * M-MATH-LENGTH — returns a warning if the TeX source is longer than 80
 * characters (the heuristic threshold for "this step is doing too much").
 * Long formulas are hard to author, hard to lint, and usually mean the
 * step should be split into smaller pieces (§ Anti-patterns in register).
 * Returns null if within budget, or a string message if over.
 */
function checkFormulaLength(formula) {
  if (formula.length > 80) {
    return `M-MATH-LENGTH: formula is ${formula.length} chars (limit 80). Split into smaller steps or simplify notation. Doc: MATH_RENDER_REGISTER.md § Anti-patterns`;
  }
  return null;
}

/**
 * M-MATH-COLOR — scans a TeX formula string for `\textcolor{HEX}{...}`
 * calls and validates each hex against the brand palette. Returns an array
 * of error messages (one per off-palette color), or an empty array if clean.
 *
 * The regex matches the full `\textcolor{ARG}` pattern in parsed TeX, where
 * ARG may be a hex like `#C4A747`, a named color like `red`, or a CSS string.
 * We only flag values that LOOK like hex codes (`#` prefix) but aren't in the
 * brand set — named colors and model-prefixed colors (`rgb(...)`) are passed
 * through without flagging since they don't correspond to the brand table.
 */
function checkFormulaColors(formula) {
  const errors = [];
  // Matches \textcolor{arg} — the content inside the first brace group.
  // Handles nested braces naively (stops at first `}`).
  const re = /\\textcolor\{([^}]+)\}/g;
  for (const m of formula.matchAll(re)) {
    const arg = m[1].trim();
    // Only validate hex-format arguments — skip named colors, rgb(), etc.
    if (!arg.startsWith("#")) continue;
    const hex = arg.toUpperCase();
    if (!ALLOWED_TEXTCOLOR_HEXES.has(hex)) {
      errors.push(
        `M-MATH-COLOR: \\textcolor{${arg}} uses an off-brand hex. ` +
        `Allowed: #C4A747 (gold) · #A64D46 (rust) · #7AA3C9 (dustblue) · ` +
        `#5C4A3D (walnut) · #1C1814 (ink). See MATH_RENDER_REGISTER.md §03.`,
      );
    }
  }
  return errors;
}

// ── File discovery ─────────────────────────────────────────────────────────

function listJsonFiles(dir) {
  const out = [];
  function walk(d) {
    if (!fs.existsSync(d)) return;
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name.endsWith(".json")) out.push(full);
    }
  }
  walk(dir);
  return out.sort();
}

// ── Main ───────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(EPISODES_DIR)) {
    console.error(`✗ episodes directory not found: ${EPISODES_DIR}`);
    return 2;
  }

  const files = listJsonFiles(EPISODES_DIR);
  let totalFormulas = 0;
  let totalFiles = 0;
  // Each failure entry carries a `rule` field so the summary can be broken
  // down by M-MATH-VALID / M-MATH-LENGTH / M-MATH-COLOR.
  const failures = [];

  for (const file of files) {
    let parsed;
    try {
      const raw = fs.readFileSync(file, "utf-8");
      parsed = JSON.parse(raw);
    } catch (e) {
      // Skip — other lints (jsonlint, schema validation) own JSON syntax
      // errors. This lint only reports KaTeX-specific issues.
      continue;
    }

    let fileHasFormula = false;
    for (const { formula, pointer } of extractFormulas(parsed)) {
      totalFormulas += 1;
      fileHasFormula = true;

      // M-MATH-VALID — KaTeX parse check (blocking)
      const parseErr = validateFormula(formula);
      if (parseErr) {
        failures.push({
          rule: "M-MATH-VALID",
          file: path.relative(REPO_ROOT, file),
          pointer,
          formula: formula.length > 80 ? formula.slice(0, 80) + "…" : formula,
          error: parseErr.split("\n")[0],
        });
      }

      // M-MATH-LENGTH — formula too long (blocking: hard to author / lint)
      const lengthErr = checkFormulaLength(formula);
      if (lengthErr) {
        failures.push({
          rule: "M-MATH-LENGTH",
          file: path.relative(REPO_ROOT, file),
          pointer,
          formula: formula.slice(0, 80) + "…",
          error: lengthErr,
        });
      }

      // M-MATH-COLOR — off-brand \textcolor{} hex (blocking: palette drift)
      const colorErrors = checkFormulaColors(formula);
      for (const colorErr of colorErrors) {
        failures.push({
          rule: "M-MATH-COLOR",
          file: path.relative(REPO_ROOT, file),
          pointer,
          formula: formula.length > 80 ? formula.slice(0, 80) + "…" : formula,
          error: colorErr,
        });
      }
    }
    if (fileHasFormula) totalFiles += 1;
  }

  // Separate blocking failures (exit 1) from informational hints (exit 0).
  //
  //   M-MATH-VALID  — blocking: broken TeX renders a red error in the video
  //   M-MATH-COLOR  — blocking: off-brand color is palette drift
  //   M-MATH-LENGTH — informational: authoring heuristic, does NOT block CI.
  //                   Annotated formulas with \underbrace / \overbrace are
  //                   structurally longer than their rendered complexity; the
  //                   80-char threshold is a loose guide, not a hard gate.
  const blocking = failures.filter((f) => f.rule !== "M-MATH-LENGTH");
  const informational = failures.filter((f) => f.rule === "M-MATH-LENGTH");

  if (failures.length === 0) {
    console.log(
      `✓ M-MATH-VALID / M-MATH-LENGTH / M-MATH-COLOR: ` +
      `${totalFormulas} formula${totalFormulas === 1 ? "" : "s"} ` +
      `across ${totalFiles} file${totalFiles === 1 ? "" : "s"} — all checks pass.`,
    );
    return 0;
  }

  // Print informational hints first (non-blocking).
  if (informational.length > 0) {
    console.log(
      `\n⚠ M-MATH-LENGTH: ${informational.length} formula(s) over 80 chars ` +
      `(informational — does not block CI). Consider splitting into smaller steps.\n`,
    );
    for (const f of informational) {
      console.log(`  ${f.file}`);
      console.log(`    ${f.pointer}`);
      console.log(`    formula: ${f.formula}`);
      console.log(`    hint:    ${f.error}`);
      console.log();
    }
  }

  // Print blocking failures.
  if (blocking.length > 0) {
    const byRule = {};
    for (const f of blocking) {
      if (!byRule[f.rule]) byRule[f.rule] = [];
      byRule[f.rule].push(f);
    }
    for (const [rule, ruleFailures] of Object.entries(byRule)) {
      console.log(
        `\n✗ ${rule}: ${ruleFailures.length} failure${ruleFailures.length === 1 ? "" : "s"}\n`,
      );
      for (const f of ruleFailures) {
        console.log(`  ${f.file}`);
        console.log(`    ${f.pointer}`);
        console.log(`    formula: ${f.formula}`);
        console.log(`    error:   ${f.error}`);
        console.log();
      }
    }
    console.log(
      "Fix references:\n" +
      "  M-MATH-VALID  — https://katex.org/docs/supported.html\n" +
      "  M-MATH-COLOR  — MATH_RENDER_REGISTER.md §03 brand color table\n",
    );
  }

  if (blocking.length === 0 && informational.length > 0) {
    console.log(
      `✓ M-MATH-VALID / M-MATH-COLOR: all ${totalFormulas} formula(s) pass blocking checks.\n` +
      `  (${informational.length} M-MATH-LENGTH hint(s) above — non-blocking)\n`,
    );
    return 0;
  }

  return blocking.length > 0 ? 1 : 0;
}

// ── CLI guard (matches lint-conventions.mjs pattern) ─────────────────────
// Skip when imported as a module (vitest / Jest imports to test helpers).
// process.exit at module level kills the test process before any test runs.
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  process.exit(main());
}

// ── Exports for tests ──────────────────────────────────────────────────────
// ESM named exports; the test file imports these directly.
export {
  extractFormulas,
  validateFormula,
  checkFormulaLength,
  checkFormulaColors,
  ALLOWED_TEXTCOLOR_HEXES,
};
