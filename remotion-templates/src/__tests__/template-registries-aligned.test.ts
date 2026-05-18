/**
 * Meta-test: TEMPLATE_COMPONENTS and TEMPLATE_SCHEMAS key sets must
 * match exactly.
 *
 * Failure mode this catches: you add a new template + register it in
 * FullEpisode.tsx's TEMPLATE_COMPONENTS but forget to add the schema to
 * Episodes/templateSchemas.ts (or vice versa). Without this test, the
 * mismatch surfaces only at runtime — the renderer dispatches to the
 * component but no schema validates the data, so a typo'd field in
 * the manifest produces a silent prop-shape bug.
 *
 * The test runs against the live registries. Adding/removing a
 * template is a one-line change in BOTH files; the test guarantees you
 * never make it in one without the other.
 *
 * Added: May 18, 2026 engineering audit #5.
 */

import { describe, it, expect } from "vitest";
import { TEMPLATE_COMPONENTS } from "../templates/Episodes/FullEpisode";
import { TEMPLATE_SCHEMAS } from "../templates/Episodes/templateSchemas";

describe("template registries — TEMPLATE_COMPONENTS ↔ TEMPLATE_SCHEMAS alignment", () => {
  it("every TEMPLATE_COMPONENTS key has a matching TEMPLATE_SCHEMAS entry", () => {
    const componentKeys = new Set(Object.keys(TEMPLATE_COMPONENTS));
    const schemaKeys = new Set(Object.keys(TEMPLATE_SCHEMAS));
    const missingFromSchemas = [...componentKeys].filter((k) => !schemaKeys.has(k));
    if (missingFromSchemas.length > 0) {
      throw new Error(
        `${missingFromSchemas.length} component(s) registered in TEMPLATE_COMPONENTS ` +
        `but missing from TEMPLATE_SCHEMAS:\n  - ${missingFromSchemas.join("\n  - ")}\n\n` +
        `Fix: add the corresponding <Name>Schema entry to ` +
        `src/templates/Episodes/templateSchemas.ts. Without a schema, manifest ` +
        `data for this component bypasses runtime validation — typo'd fields ` +
        `produce silent prop-shape bugs.`,
      );
    }
    expect(missingFromSchemas).toEqual([]);
  });

  it("every TEMPLATE_SCHEMAS key has a matching TEMPLATE_COMPONENTS entry", () => {
    const componentKeys = new Set(Object.keys(TEMPLATE_COMPONENTS));
    const schemaKeys = new Set(Object.keys(TEMPLATE_SCHEMAS));
    const missingFromComponents = [...schemaKeys].filter((k) => !componentKeys.has(k));
    if (missingFromComponents.length > 0) {
      throw new Error(
        `${missingFromComponents.length} schema(s) in TEMPLATE_SCHEMAS but no ` +
        `matching component in TEMPLATE_COMPONENTS:\n  - ${missingFromComponents.join("\n  - ")}\n\n` +
        `Fix: either add the component to TEMPLATE_COMPONENTS in FullEpisode.tsx, ` +
        `or remove the orphaned schema entry. A schema without a dispatch is dead ` +
        `code — it can't validate anything since nothing routes data through it.`,
      );
    }
    expect(missingFromComponents).toEqual([]);
  });

  it("at least 30 templates registered (sanity check that we're testing the real registries)", () => {
    // Defensive: catches the case where one or both registries get
    // accidentally tree-shaken to empty in a test build. The current
    // count is ~46; this floor lets us add/remove a few without
    // updating the test, but flags catastrophic regressions.
    expect(Object.keys(TEMPLATE_COMPONENTS).length).toBeGreaterThan(30);
    expect(Object.keys(TEMPLATE_SCHEMAS).length).toBeGreaterThan(30);
  });
});
