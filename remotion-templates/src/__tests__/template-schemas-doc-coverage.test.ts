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
  // ── Audit #16 grandfather list (May 18, 2026) ───────────────────────
  ["ArcDiagram", "grandfathered; doc section pending"],
  ["Slopegraph", "grandfathered; doc section pending — Phase 4 chart"],
  ["KPICard", "grandfathered; doc section pending — Phase 4 chart"],
  ["BulletChart", "grandfathered; doc section pending — Phase 4 chart"],
  ["StepLine", "grandfathered; doc section pending — Phase 4 chart"],
  ["BeeswarmChart", "grandfathered; doc section pending"],
  ["BumpChart", "grandfathered; doc section pending"],
  ["CalendarHeatmap", "grandfathered; doc section pending"],
  ["ConnectedScatterplot", "grandfathered; doc section pending"],
  ["DumbbellPlot", "grandfathered; doc section pending"],
  ["HorizonChart", "grandfathered; doc section pending"],
  ["IsotypeChart", "grandfathered; doc section pending"],
  ["MarimekkoChart", "grandfathered; doc section pending"],
  ["PopulationPyramid", "grandfathered; doc section pending"],
  ["RankChangeDotPlot", "grandfathered; doc section pending"],
  ["RidgelinePlot", "grandfathered; doc section pending"],
  ["Streamgraph", "grandfathered; doc section pending"],
  ["TernaryPlot", "grandfathered; doc section pending"],
  ["TilegramUSMap", "grandfathered; doc section pending"],
]);

describe("template-schemas.md doc coverage", () => {
  it("every TEMPLATE_SCHEMAS entry has a `## <Name>` heading in template-schemas.md", () => {
    if (!fs.existsSync(SCHEMAS_DOC_PATH)) {
      // The doc file moved or was deleted — flag loudly. The test isn't
      // useful without it.
      throw new Error(
        `references/template-schemas.md not found at ${SCHEMAS_DOC_PATH}. ` +
        `Either restore the file or update SCHEMAS_DOC_PATH in this test.`,
      );
    }
    const docContent = fs.readFileSync(SCHEMAS_DOC_PATH, "utf-8");
    // Extract all `## <Name>` headings (level-2). The convention is one
    // heading per template; some sections are content-only ("Common
    // Fields", "Universal conventions", etc.) and don't count.
    const headingRe = /^## (\S[^\n]*)$/gm;
    const docHeadings = new Set<string>();
    for (const m of docContent.matchAll(headingRe)) {
      docHeadings.add(m[1].trim());
    }

    const missing: string[] = [];
    for (const name of Object.keys(TEMPLATE_SCHEMAS)) {
      if (DOC_COVERAGE_EXEMPT.has(name)) continue;
      // Heading might be exactly `## DataChart` OR `## DataChart (...)` OR
      // similar. Substring-prefix match is enough.
      const hasHeading = [...docHeadings].some(
        (h) => h === name || h.startsWith(`${name} `) || h.startsWith(`${name}—`) || h.startsWith(`${name} —`),
      );
      if (!hasHeading) missing.push(name);
    }

    if (missing.length > 0) {
      throw new Error(
        `${missing.length} template(s) in TEMPLATE_SCHEMAS have no \`## <Name>\` ` +
        `section in references/template-schemas.md:\n` +
        missing.map((m) => `  - ${m}`).join("\n") +
        `\n\nFix: add a section to references/template-schemas.md with the ` +
        `template's data fields, types, required/optional status, and any ` +
        `editorial guidance. See existing sections (e.g. DataChart, ` +
        `BumpChart) for the canonical format. Or, if the template is ` +
        `documented elsewhere or shares a section with its parent, add an ` +
        `entry to DOC_COVERAGE_EXEMPT in this test with a reason.`,
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
