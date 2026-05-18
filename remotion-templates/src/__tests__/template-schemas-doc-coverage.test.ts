/**
 * Meta-test: every template registered in TEMPLATE_SCHEMAS must have a
 * `## <Name>` heading in references/template-schemas.md.
 *
 * Failure mode this catches: you add a new template + register it in
 * TEMPLATE_SCHEMAS but forget to document its fields in
 * template-schemas.md. The doc claims to be canonical for every
 * template; an undocumented one breaks that promise silently.
 *
 * Why a doc-coverage test instead of auto-generating the doc:
 *   The doc is a hand-curated editorial reference — it carries universal
 *   conventions, design rationale, examples, and per-template editorial
 *   guidance that mechanical generation would flatten. The test ensures
 *   *coverage* (no template orphaned) without dictating *content* (the
 *   author still writes the per-template guidance by hand). This was
 *   the audit's option (b) for item #16, picked over full auto-gen.
 *
 * Added: May 18, 2026 engineering audit P1 #16.
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { TEMPLATE_SCHEMAS } from "../templates/Episodes/templateSchemas";

const SCHEMAS_DOC_PATH = path.resolve(__dirname, "..", "..", "references", "template-schemas.md");

/**
 * Doc-exempt templates: either (a) documented elsewhere, (b) variant /
 * sub-component sharing parent's section, or (c) **grandfathered** — was
 * already undocumented when this test was added (May 18, 2026, audit #16).
 *
 * The grandfather list shrinks as authors document each template. New
 * templates default to "must have a doc section" — the test blocks any
 * registration in TEMPLATE_SCHEMAS that doesn't write the matching
 * `## <Name>` heading in references/template-schemas.md.
 *
 * Last reviewed: May 18, 2026. To remove an entry: add the template's
 * `## <Name>` section to references/template-schemas.md (canonical fields
 * + types + required/optional + editorial guidance — see DataChart or
 * BumpChart for the format), then delete the line below.
 */
const DOC_COVERAGE_EXEMPT = new Map<string, string>([
  // Empty as of May 18, 2026 — all 47 production templates now have
  // doc coverage via one of:
  //   · a dedicated `## <Name>` section with full editorial guidance, OR
  //   · an entry in the "Templates without dedicated schema documentation
  //     here" fallback table (the doc author's explicit "schema + dossier
  //     are sufficient" judgment for chart-family templates that don't
  //     have non-obvious compositional rules).
  //
  // Audit #16 grandfather list shrunk from 19 → 0 by:
  //   1. Loosening this test to recognize fallback-table entries as valid
  //      doc coverage (the existing 15-template table was already serving
  //      that role, the test just didn't see it).
  //   2. Adding the 4 remaining Phase-4 chart templates (BulletChart,
  //      KPICard, Slopegraph, StepLine) to that same fallback table.
  //
  // Use this map only if a future template is genuinely doc-exempt
  // (variant sharing parent's section, test fixture, etc.). For new
  // templates, the right move is to write a `## <Name>` section or add
  // to the fallback table — not to add an exemption here.
]);

describe("template-schemas.md doc coverage", () => {
  it("every TEMPLATE_SCHEMAS entry has either a `## <Name>` heading OR a fallback-table entry in template-schemas.md", () => {
    if (!fs.existsSync(SCHEMAS_DOC_PATH)) {
      // The doc file moved or was deleted — flag loudly. The test isn't
      // useful without it.
      throw new Error(
        `references/template-schemas.md not found at ${SCHEMAS_DOC_PATH}. ` +
        `Either restore the file or update SCHEMAS_DOC_PATH in this test.`,
      );
    }
    const docContent = fs.readFileSync(SCHEMAS_DOC_PATH, "utf-8");

    // Path 1: `## <Name>` heading at level 2. Some templates have a full
    // editorial section with field tables, examples, design rationale.
    const headingRe = /^## (\S[^\n]*)$/gm;
    const docHeadings = new Set<string>();
    for (const m of docContent.matchAll(headingRe)) {
      docHeadings.add(m[1].trim());
    }

    // Path 2: row in the "Templates without dedicated schema documentation
    // here" fallback table. The doc author's explicit editorial call is
    // that some templates' schema.ts + dossier together are sufficient
    // canonical reference, and a full doc section would just duplicate.
    // Pattern: `| **<Name>** |` inside a Markdown table row.
    const tableRowRe = /^\| \*\*([A-Z]\w*)\*\* \|/gm;
    const docTableEntries = new Set<string>();
    for (const m of docContent.matchAll(tableRowRe)) {
      docTableEntries.add(m[1].trim());
    }

    const missing: string[] = [];
    for (const name of Object.keys(TEMPLATE_SCHEMAS)) {
      if (DOC_COVERAGE_EXEMPT.has(name)) continue;
      // Heading might be exactly `## DataChart` OR `## DataChart (...)` OR
      // similar. Substring-prefix match for the heading path.
      const hasHeading = [...docHeadings].some(
        (h) => h === name || h.startsWith(`${name} `) || h.startsWith(`${name}—`) || h.startsWith(`${name} —`),
      );
      const hasTableEntry = docTableEntries.has(name);
      if (!hasHeading && !hasTableEntry) missing.push(name);
    }

    if (missing.length > 0) {
      throw new Error(
        `${missing.length} template(s) in TEMPLATE_SCHEMAS have no doc ` +
        `coverage in references/template-schemas.md (neither a \`## <Name>\` ` +
        `section nor an entry in the fallback table):\n` +
        missing.map((m) => `  - ${m}`).join("\n") +
        `\n\nFix (pick one):\n` +
        `  1. Add a full \`## <Name>\` section with field table, examples,\n` +
        `     and editorial guidance — for templates with non-obvious\n` +
        `     compositional rules. See DataChart, BumpChart, GameBoard\n` +
        `     for the canonical format.\n` +
        `  2. Add an entry to the "Templates without dedicated schema\n` +
        `     documentation here" fallback table near the end of the file —\n` +
        `     for templates where the schema.ts + dossier are sufficient.\n` +
        `     Format:\n` +
        `       | **<Name>** | <Family> | \`src/templates/<Name>/schema.ts\` | \`references/template-research/<kebab-name>.md\` |\n` +
        `  3. If the template is documented elsewhere or shares a section\n` +
        `     with its parent, add an entry to DOC_COVERAGE_EXEMPT in this\n` +
        `     test with a reason.`,
      );
    }
    expect(missing).toEqual([]);
  });

  it("every DOC_COVERAGE_EXEMPT entry references a currently-registered template", () => {
    const registeredNames = new Set(Object.keys(TEMPLATE_SCHEMAS));
    const stale: string[] = [];
    for (const name of DOC_COVERAGE_EXEMPT.keys()) {
      if (!registeredNames.has(name)) stale.push(name);
    }
    if (stale.length > 0) {
      throw new Error(
        `${stale.length} DOC_COVERAGE_EXEMPT entries reference templates ` +
        `that no longer exist in TEMPLATE_SCHEMAS:\n` +
        stale.map((s) => `  - ${s}`).join("\n") +
        `\n\nFix: remove the stale exemption(s) from this test.`,
      );
    }
    expect(stale).toEqual([]);
  });
});
