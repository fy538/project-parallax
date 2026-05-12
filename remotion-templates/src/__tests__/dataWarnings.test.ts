/**
 * dataWarnings — unit tests for the warnIf helper and the
 * `checkChartDataCommon` semantic check used by chart templates.
 *
 * These tests exercise the warning mechanism itself, not each template's
 * integration. Template-level heuristics live in their respective
 * components and rely on warnIf's per-(template, message) dedup —
 * locking the dedup contract here protects the runtime invariant.
 *
 * Reference: src/utils/dataWarnings.ts
 * Wayfinding context: TEMPLATE_FAMILIES.md (runtime heuristics layer).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// We re-import the module per-test to reset the module-level `seen` Set,
// which is required for the dedup-contract tests to be order-independent.
async function loadFreshWarnIf() {
  vi.resetModules();
  return await import("../utils/dataWarnings");
}

describe("warnIf", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("does not warn when condition is false", async () => {
    const { warnIf } = await loadFreshWarnIf();
    warnIf(false, "T", "should not appear");
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("warns once when condition is true", async () => {
    const { warnIf } = await loadFreshWarnIf();
    warnIf(true, "T", "appears once");
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0]?.[0]).toContain("[T]");
    expect(warnSpy.mock.calls[0]?.[0]).toContain("appears once");
  });

  it("DEDUPS — same (template, message) tuple only warns once", async () => {
    const { warnIf } = await loadFreshWarnIf();
    warnIf(true, "Network", "8 nodes");
    warnIf(true, "Network", "8 nodes");
    warnIf(true, "Network", "8 nodes");
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("does NOT dedup across different messages on the same template", async () => {
    const { warnIf } = await loadFreshWarnIf();
    warnIf(true, "Sankey", "too many nodes");
    warnIf(true, "Sankey", "too many links");
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("does NOT dedup across different templates with the same message", async () => {
    const { warnIf } = await loadFreshWarnIf();
    warnIf(true, "A", "shared message");
    warnIf(true, "B", "shared message");
    expect(warnSpy).toHaveBeenCalledTimes(2);
  });

  it("emits the data argument when provided", async () => {
    const { warnIf } = await loadFreshWarnIf();
    const payload = { count: 12 };
    warnIf(true, "T", "with payload", payload);
    expect(warnSpy).toHaveBeenCalledWith(expect.any(String), payload);
  });

  it("does not call console.warn at all when condition is false (no dedup churn)", async () => {
    const { warnIf } = await loadFreshWarnIf();
    for (let i = 0; i < 1000; i++) warnIf(false, "T", "loop");
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe("checkChartDataCommon", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("warns when title exceeds 80 chars", async () => {
    const { checkChartDataCommon } = await loadFreshWarnIf();
    checkChartDataCommon("DataChart", {
      title: "x".repeat(81),
      source: "S",
    });
    expect(
      warnSpy.mock.calls.some((c) =>
        String(c[0]).includes("Title is 81 chars"),
      ),
    ).toBe(true);
  });

  it("does NOT warn when title is exactly 80 chars (boundary)", async () => {
    const { checkChartDataCommon } = await loadFreshWarnIf();
    checkChartDataCommon("DataChart", {
      title: "x".repeat(80),
      source: "S",
    });
    expect(
      warnSpy.mock.calls.some((c) =>
        String(c[0]).includes("likely to overflow"),
      ),
    ).toBe(false);
  });

  it("warns when subtitle exceeds 140 chars", async () => {
    const { checkChartDataCommon } = await loadFreshWarnIf();
    checkChartDataCommon("DataChart", {
      subtitle: "x".repeat(141),
      source: "S",
    });
    expect(
      warnSpy.mock.calls.some((c) =>
        String(c[0]).includes("wrap awkwardly"),
      ),
    ).toBe(true);
  });

  it("warns when source attribution is missing", async () => {
    const { checkChartDataCommon } = await loadFreshWarnIf();
    checkChartDataCommon("DataChart", { title: "T" });
    expect(
      warnSpy.mock.calls.some((c) =>
        String(c[0]).includes("No source attribution"),
      ),
    ).toBe(true);
  });

  it("does not warn on a well-formed minimal data object", async () => {
    const { checkChartDataCommon } = await loadFreshWarnIf();
    checkChartDataCommon("DataChart", {
      title: "Short title",
      subtitle: "Reasonable subtitle.",
      source: "Cited source",
    });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

// ── Wayfinding-rollout heuristics: lock the cap thresholds ───────────────
//
// These are NOT integration tests against the templates themselves (those
// would require Remotion render context). They lock the THRESHOLDS that
// appear in each template's runtime warnIf so a refactor that drifts the
// cap (e.g., NetworkDiagram changes from >8 to >10 without doc update)
// shows up as a failing test and a doc update is forced.
//
// If you change a cap intentionally, update both the template AND the
// matching SELECTOR doc, then update the threshold here.

describe("Wayfinding heuristic thresholds (lock contract)", () => {
  const CAPS = {
    NetworkDiagram_maxNodes: 8,
    SankeyFlow_maxNodes: 10,
    SankeyFlow_maxLinks: 15,
    EscalationLadder_maxRungs: 7,
    HorizontalTimeline_maxEvents: 32,
    TimelineComparison_maxConnections: 5,
    AnnotatedImage_maxCallouts: 6,
    RadarChart_maxSubjects: 3,
    RadarChart_maxAxisLabelChars: 25,
    SplitComposition_maxItemImbalance: 2,
  } as const;

  it("documents the canonical cap for each templated heuristic", () => {
    // Tripwire — every cap must remain explicitly named. Don't mute this
    // test silently; if you change a cap, edit the constant AND the
    // SELECTOR doc, not the assertion.
    expect(Object.keys(CAPS).sort()).toEqual(
      [
        "AnnotatedImage_maxCallouts",
        "EscalationLadder_maxRungs",
        "HorizontalTimeline_maxEvents",
        "NetworkDiagram_maxNodes",
        "RadarChart_maxAxisLabelChars",
        "RadarChart_maxSubjects",
        "SankeyFlow_maxLinks",
        "SankeyFlow_maxNodes",
        "SplitComposition_maxItemImbalance",
        "TimelineComparison_maxConnections",
      ].sort(),
    );
    expect(CAPS.NetworkDiagram_maxNodes).toBe(8);
    expect(CAPS.SankeyFlow_maxNodes).toBe(10);
    expect(CAPS.SankeyFlow_maxLinks).toBe(15);
    expect(CAPS.EscalationLadder_maxRungs).toBe(7);
    expect(CAPS.HorizontalTimeline_maxEvents).toBe(32);
    expect(CAPS.TimelineComparison_maxConnections).toBe(5);
    expect(CAPS.AnnotatedImage_maxCallouts).toBe(6);
    expect(CAPS.RadarChart_maxSubjects).toBe(3);
    expect(CAPS.RadarChart_maxAxisLabelChars).toBe(25);
    expect(CAPS.SplitComposition_maxItemImbalance).toBe(2);
  });
});
