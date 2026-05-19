#!/usr/bin/env node
/**
 * lint-math-formulas.mjs — validate every KaTeX formula in episode data.
 *
 * Phase 4 of the math-rendering register. Scans every JSON file under
 * `data/episodes/**` for math-render data shapes (MathReveal,
 * MathDerivation) and runs each `formula` through KaTeX's strict
 * renderer. Anything that doesn't parse is a M-MATH-VALID violation.
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
 * Exit codes:
 *   0 — all formulas parse
 *   1 — at least one parse error
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
      const err = validateFormula(formula);
      if (err) {
        failures.push({
          file: path.relative(REPO_ROOT, file),
          pointer,
          formula: formula.length > 80 ? formula.slice(0, 80) + "…" : formula,
          error: err.split("\n")[0], // first line of KaTeX's error text
        });
      }
    }
    if (fileHasFormula) totalFiles += 1;
  }

  if (failures.length === 0) {
    console.log(
      `✓ M-MATH-VALID: ${totalFormulas} formula${totalFormulas === 1 ? "" : "s"} ` +
      `across ${totalFiles} file${totalFiles === 1 ? "" : "s"} parse cleanly through KaTeX.`,
    );
    return 0;
  }

  console.log(
    `✗ M-MATH-VALID: ${failures.length} of ${totalFormulas} formula(s) failed KaTeX validation.\n`,
  );
  for (const f of failures) {
    console.log(`  ${f.file}`);
    console.log(`    ${f.pointer}`);
    console.log(`    formula: ${f.formula}`);
    console.log(`    error:   ${f.error}`);
    console.log();
  }
  console.log(
    "Fix: KaTeX dialect reference — https://katex.org/docs/supported.html.\n" +
    "MathExpression.tsx renders errors inline at video render time " +
    "(throwOnError: false), but a typo here would surface as a red \n" +
    "KaTeX error in the composition. Catch it before publish.",
  );
  return 1;
}

process.exit(main());
