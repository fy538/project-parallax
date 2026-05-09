/**
 * chart-zone-integrity.test.ts — Layout math unit tests for chartLayout().
 *
 * These tests call `chartLayout()` directly (zero browser / zero render overhead)
 * and assert zone integrity using the shared layout-assertions helpers.
 *
 * WHY THIS EXISTS alongside chart-real-data.test.ts:
 *   Real-data tests compare rendered PNGs against saved baselines. That catches
 *   visual drift, but baselines can be updated — meaning a layout collision can
 *   be "fixed" by accepting the broken image. These tests operate on the raw
 *   layout math and CANNOT be baseline-updated away.
 *
 * COVERAGE:
 *   · All four safeAreaTier values (tight → generous)
 *   · All combinations of hasTitle / hasLegend / hasXAxis / hasSource flags
 *   · Multi-row legend and source stacking
 *   · extraPad / insets overrides
 *   · Known real-data configs (DataChart cases in silicon-trap + prisoners-dilemma)
 *   · Edge-case regression: artificially injected collision detected by validator
 *
 * To add a new assertion variant: add an entry to CONFIGS or write a standalone
 * `it()` below the matrix block.
 */

import { describe, expect, it } from "vitest";
import {
  chartLayout,
  validateChartLayoutIntegrity,
  type ChartLayoutInput,
  type BoundingBox,
} from "../utils/chartLayout";
import { layout } from "../design/theme";
import {
  assertZoneIntegrity,
  assertMinHeight,
  assertCentered,
  assertNoOverlap,
  type NamedBox,
} from "./layout-assertions";

const CANVAS_W = layout.width;   // 1920
const CANVAS_H = layout.height;  // 1080

// Minimum usable chart area — if it drops below this, overlays will crowd it.
const MIN_CHART_HEIGHT = 200;

/** Convert a ChartLayoutResult to NamedBox[] for generic assertions. */
function toNamedBoxes(result: ReturnType<typeof chartLayout>): NamedBox[] {
  return [
    { name: "title",  box: result.title  as BoundingBox as NamedBox["box"] },
    { name: "legend", box: result.legend as BoundingBox as NamedBox["box"] },
    { name: "chart",  box: result.chart  as BoundingBox as NamedBox["box"] },
    { name: "axisX",  box: result.axisX  as BoundingBox as NamedBox["box"] },
    { name: "source", box: result.source as BoundingBox as NamedBox["box"] },
  ];
}

// ── Config matrix ─────────────────────────────────────────────────────────────
// Each entry exercises a distinct layout shape. Labels appear in test names.

interface ConfigCase {
  label: string;
  input: ChartLayoutInput;
}

const CONFIGS: ConfigCase[] = [
  // ── Minimal ────────────────────────────────────────────────────────────────
  {
    label: "chart-only (no title, no legend, no source)",
    input: { hasTitle: false },
  },
  {
    label: "title only",
    input: {},
  },

  // ── Single optional region ─────────────────────────────────────────────────
  {
    label: "title + legend (1 row)",
    input: { hasLegend: true },
  },
  {
    label: "title + source (1 row)",
    input: { hasSource: true },
  },
  {
    label: "title + x-axis",
    input: { hasXAxis: true },
  },

  // ── Two-region combinations ────────────────────────────────────────────────
  {
    label: "title + legend + source",
    input: { hasLegend: true, hasSource: true },
  },
  {
    label: "title + x-axis + source",
    input: { hasXAxis: true, hasSource: true },
  },

  // ── Maximum density (all regions active) ──────────────────────────────────
  {
    label: "all regions — 1-row legend, 1-row source, x-axis",
    input: { hasLegend: true, hasXAxis: true, hasSource: true },
  },

  // ── Multi-row stacking ─────────────────────────────────────────────────────
  {
    label: "legend 2 rows + source",
    input: { hasLegend: true, legendRows: 2, hasSource: true },
  },
  {
    label: "legend 3 rows + source",
    input: { hasLegend: true, legendRows: 3, hasSource: true },
  },
  {
    label: "legend + source 2 rows",
    input: { hasLegend: true, hasSource: true, sourceRows: 2 },
  },
  {
    label: "legend 2 rows + source 2 rows + x-axis (stress)",
    input: { hasLegend: true, legendRows: 2, hasXAxis: true, hasSource: true, sourceRows: 2 },
  },

  // ── safeAreaTier variants ──────────────────────────────────────────────────
  {
    label: "safeAreaTier:tight, legend + source",
    input: { safeAreaTier: "tight", hasLegend: true, hasSource: true },
  },
  {
    label: "safeAreaTier:standard, legend + source",
    input: { safeAreaTier: "standard", hasLegend: true, hasSource: true },
  },
  {
    label: "safeAreaTier:broadcast, legend + source",
    input: { safeAreaTier: "broadcast", hasLegend: true, hasSource: true },
  },
  {
    label: "safeAreaTier:generous, legend + source (default)",
    input: { safeAreaTier: "generous", hasLegend: true, hasSource: true },
  },

  // ── Padding overrides ──────────────────────────────────────────────────────
  {
    label: "extraPad left:100 (y-axis label room)",
    input: { extraPad: { left: 100 }, hasSource: true },
  },
  {
    label: "extraPad left:120 right:60 (asymmetric)",
    input: { extraPad: { left: 120, right: 60 }, hasLegend: true, hasSource: true },
  },
  {
    label: "insets override tight (40px all sides)",
    input: { insets: { top: 40, right: 40, bottom: 40, left: 40 }, hasLegend: true, hasSource: true },
  },

  // ── Title variant ──────────────────────────────────────────────────────────
  {
    label: "titleVariant:data, legend + source",
    input: { titleVariant: "data", hasLegend: true, hasSource: true },
  },
  {
    label: "titleVariant:chapter, legend + source",
    input: { titleVariant: "chapter", hasLegend: true, hasSource: true },
  },

  // ── Real episode DataChart shapes ─────────────────────────────────────────
  // These mirror the chartLayout() config that each active episode case would use.
  {
    label: "DataChart — silicon-trap lithography-gap (comparison legend, source)",
    input: { hasLegend: true, legendRows: 2, hasSource: true },
  },
  {
    label: "DataChart — silicon-trap chips-act-pipeline (source + context stacking)",
    input: { hasSource: true, sourceRows: 2 },
  },
  {
    label: "DataChart — prisoners-dilemma diffusion (dense bars, source)",
    input: { hasSource: true },
  },
  {
    label: "TimeSeriesChart — silicon-trap smic-yield (hero stat + source, single line)",
    input: { hasLegend: true, hasXAxis: true, hasSource: true },
  },
  {
    label: "TimeSeriesChart — prisoners-dilemma vol-smile (multi-line legend + era bands)",
    input: { hasLegend: true, legendRows: 2, hasXAxis: true, hasSource: true, sourceRows: 2 },
  },
];

// ── Matrix tests ──────────────────────────────────────────────────────────────

describe("chartLayout zone integrity — no collision / in bounds", () => {
  CONFIGS.forEach(({ label, input }) => {
    it(label, () => {
      const result = chartLayout(input);
      const zones = toNamedBoxes(result);
      assertZoneIntegrity(zones, CANVAS_W, CANVAS_H);
    });
  });
});

describe("chartLayout zone integrity — chart has usable height", () => {
  CONFIGS.forEach(({ label, input }) => {
    it(label, () => {
      const result = chartLayout(input);
      assertMinHeight({ name: "chart", box: result.chart }, MIN_CHART_HEIGHT);
    });
  });
});

describe("chartLayout zone integrity — validateChartLayoutIntegrity returns no issues", () => {
  CONFIGS.forEach(({ label, input }) => {
    it(label, () => {
      const result = chartLayout(input);
      const issues = validateChartLayoutIntegrity(result);
      expect(
        issues,
        `Integrity issues for "${label}":\n  · ${issues.join("\n  · ")}`
      ).toHaveLength(0);
    });
  });
});

// ── Structural invariant tests ────────────────────────────────────────────────

describe("chartLayout structural invariants", () => {
  it("all active zones share the same left edge", () => {
    const result = chartLayout({ hasLegend: true, hasXAxis: true, hasSource: true });
    const activeZones = toNamedBoxes(result).filter((z) => z.box.height > 0);
    const lefts = new Set(activeZones.map((z) => z.box.left));
    expect(
      lefts.size,
      `Expected all zones to share the same left edge, got: ${[...lefts].join(", ")}`
    ).toBe(1);
  });

  it("zones stack top-down without gaps below the cursor", () => {
    const result = chartLayout({ hasLegend: true, hasSource: true });
    // legend must start after title
    expect(result.legend.top).toBeGreaterThan(result.title.top + result.title.height);
    // chart must start after legend
    expect(result.chart.top).toBeGreaterThan(result.legend.top + result.legend.height);
    // source must start after chart
    expect(result.source.top).toBeGreaterThan(result.chart.top + result.chart.height);
  });

  it("legend height scales with row count, chart height shrinks accordingly", () => {
    const one   = chartLayout({ hasLegend: true, legendRows: 1 });
    const two   = chartLayout({ hasLegend: true, legendRows: 2 });
    const three = chartLayout({ hasLegend: true, legendRows: 3 });
    // Taller legend
    expect(two.legend.height).toBeGreaterThan(one.legend.height);
    expect(three.legend.height).toBeGreaterThan(two.legend.height);
    // Chart shrinks to compensate
    expect(two.chart.height).toBeLessThan(one.chart.height);
    expect(three.chart.height).toBeLessThan(two.chart.height);
  });

  it("zero-height legend when hasLegend:false", () => {
    const result = chartLayout({ hasLegend: false });
    expect(result.legend.height).toBe(0);
  });

  it("zero-height source when hasSource:false", () => {
    const result = chartLayout({ hasSource: false });
    expect(result.source.height).toBe(0);
  });

  it("zero-height axisX when hasXAxis:false", () => {
    const result = chartLayout({ hasXAxis: false });
    expect(result.axisX.height).toBe(0);
  });

  it("extraPad.left reduces both chart.left (inward) and chart.width", () => {
    const base   = chartLayout({});
    const padded = chartLayout({ extraPad: { left: 100 } });
    expect(padded.chart.left).toBe(base.chart.left + 100);
    expect(padded.chart.width).toBe(base.chart.width - 100);
  });

  it("extraPad.right reduces chart.width without touching chart.left", () => {
    const base   = chartLayout({});
    const padded = chartLayout({ extraPad: { right: 80 } });
    expect(padded.chart.left).toBe(base.chart.left);
    expect(padded.chart.width).toBe(base.chart.width - 80);
  });

  it("chart fills all available vertical space (no dead space between legend and source)", () => {
    const result = chartLayout({ hasLegend: true, hasSource: true });
    const chartBottom = result.chart.top + result.chart.height;
    // chart bottom must be above source.top (gap separates them)
    expect(chartBottom).toBeLessThanOrEqual(result.source.top);
    // but the gap must be reasonable (< 50px — the defined sourceGap is 16px)
    expect(result.source.top - chartBottom).toBeLessThan(50);
  });

  it("all chart zones are aligned on the full-width canvas width", () => {
    const result = chartLayout({ hasLegend: true, hasSource: true });
    const safe = layout.safeAreaTier.generous;
    const expectedWidth = layout.width - safe.left - safe.right;
    expect(result.chart.width).toBe(expectedWidth);
    expect(result.title.width).toBe(expectedWidth);
    expect(result.legend.width).toBe(expectedWidth);
  });
});

// ── Regression: validator detects injected collision ─────────────────────────

describe("validateChartLayoutIntegrity — detects injected collisions", () => {
  it("flags legend-title overlap when legend.top < title.bottom", () => {
    const result = chartLayout({ hasLegend: true, hasSource: true });
    const corrupted = {
      ...result,
      legend: { ...result.legend, top: result.title.top },
    };
    const issues = validateChartLayoutIntegrity(corrupted);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.includes("legend"))).toBe(true);
  });

  it("flags source out-of-bounds when source.top pushed below canvas", () => {
    const result = chartLayout({ hasSource: true });
    const corrupted = {
      ...result,
      source: { ...result.source, top: CANVAS_H + 10 },
    };
    const issues = validateChartLayoutIntegrity(corrupted);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues.some((i) => i.includes("source"))).toBe(true);
  });

  it("assertNoOverlap detects chart-legend collision", () => {
    const result = chartLayout({ hasLegend: true });
    const zones: NamedBox[] = [
      { name: "legend", box: result.legend },
      // Artificially place chart on top of legend
      { name: "chart", box: { ...result.chart, top: result.legend.top } },
    ];
    expect(() => assertNoOverlap(zones)).toThrow(/collision/i);
  });
});
