/**
 * chartLayout — unit tests for shared cartesian layout contracts.
 *
 * These tests lock the geometry assumptions behind TitleBlock-aligned chart
 * templates so future refactors don't quietly reintroduce the overlap bugs
 * we're trying to stamp out: wrong safe-area tier, missing source budget,
 * or boxes that collide after a helper change.
 */

import { describe, expect, it } from "vitest";
import { layout } from "../design/theme";
import {
  chartLayout,
  validateChartLayoutIntegrity,
  type ChartLayoutResult,
} from "../utils/chartLayout";

describe("chartLayout", () => {
  it("uses the requested safe-area tier for title and chart placement", () => {
    const standard = chartLayout({ safeAreaTier: "standard" });
    const generous = chartLayout({ safeAreaTier: "generous" });

    expect(standard.title.top).toBe(layout.safeAreaTier.standard.top);
    expect(generous.title.top).toBe(layout.safeAreaTier.generous.top);
    expect(generous.chart.left - standard.chart.left).toBe(
      layout.safeAreaTier.generous.left - layout.safeAreaTier.standard.left
    );
    expect(standard.chart.top - standard.title.top).toBe(
      generous.chart.top - generous.title.top
    );
  });

  it("reserves extra bottom space for stacked source and context rows", () => {
    const singleSource = chartLayout({ hasSource: true, sourceRows: 1 });
    const stackedSource = chartLayout({ hasSource: true, sourceRows: 2 });

    expect(singleSource.source.height).toBe(28);
    expect(stackedSource.source.height).toBe(60);
    expect(stackedSource.source.top).toBeLessThan(singleSource.source.top);
    expect(stackedSource.chart.height).toBeLessThan(singleSource.chart.height);
  });

  it("produces non-overlapping regions for a representative dense chart", () => {
    const result = chartLayout({
      hasTitle: true,
      hasLegend: true,
      legendRows: 1,
      hasXAxis: true,
      hasSource: true,
      sourceRows: 2,
      safeAreaTier: "generous",
      extraPad: { left: 100, right: 100, bottom: 112 },
    });

    expect(validateChartLayoutIntegrity(result)).toEqual([]);
  });
});

describe("validateChartLayoutIntegrity", () => {
  it("reports overlaps and canvas overflow", () => {
    const invalid: ChartLayoutResult = {
      title: { top: 120, left: 120, width: 500, height: 150 },
      legend: { top: 250, left: 120, width: 500, height: 36 },
      chart: { top: 270, left: 120, width: 1700, height: 700 },
      axisX: { top: 960, left: 120, width: 1700, height: 40 },
      source: { top: 995, left: 120, width: 1700, height: 120 },
    };

    const issues = validateChartLayoutIntegrity(invalid);

    expect(issues).toContain("legend overlaps title");
    expect(issues).toContain("source overlaps axisX");
    expect(issues).toContain("source extends beyond the canvas bounds");
  });
});
