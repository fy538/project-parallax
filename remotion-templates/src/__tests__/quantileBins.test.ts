/**
 * quantileBins — unit tests for the choropleth binning helper.
 *
 * Reference: references/template-research/choropleth-map.md § 6.3
 */

import { describe, expect, it } from "vitest";
import {
  quantileBreaks,
  equalIntervalBreaks,
  assignBin,
  normalizeForRamp,
  binAndNormalize,
} from "../utils/quantileBins";

describe("quantileBreaks", () => {
  it("produces numBins - 1 internal breakpoints", () => {
    const breaks = quantileBreaks([10, 20, 30, 40, 50, 60, 70, 80, 90, 100], 5);
    expect(breaks).toHaveLength(4);
  });

  it("splits uniform data into equal-count bins (linear interp)", () => {
    // 10 values 1..10, 5 bins → breaks at 20%, 40%, 60%, 80% percentiles.
    const breaks = quantileBreaks([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 5);
    // Linear interpolation at idx = (10-1)*0.2 = 1.8 → value = 1 + 0.8*(3-2) ≈ 2.8
    expect(breaks[0]).toBeCloseTo(2.8, 1);
    expect(breaks[3]).toBeCloseTo(8.2, 1);
  });

  it("handles skewed distributions honestly (collapses interior breaks on a flat mass)", () => {
    // 9 × 1 + 1 × 100 — heavily right-skewed. All p<0.9 quantiles land on 1
    // (the value at every interior rank). The top bin still isolates 100
    // because assignBin(100, breaks) = breaks.length when 100 > all breaks.
    const breaks = quantileBreaks([1, 1, 1, 1, 1, 1, 1, 1, 1, 100], 5);
    expect(breaks).toHaveLength(4);
    expect(breaks).toEqual([1, 1, 1, 1]); // honest representation of the skew
    // 100 still lands in the top bin via assignBin (> all breaks).
    expect(assignBin(100, breaks)).toBe(4);
    // 1 lands in bin 0.
    expect(assignBin(1, breaks)).toBe(0);
  });

  it("returns empty for numBins < 2", () => {
    expect(quantileBreaks([1, 2, 3], 1)).toEqual([]);
    expect(quantileBreaks([1, 2, 3], 0)).toEqual([]);
  });

  it("returns empty for empty input", () => {
    expect(quantileBreaks([], 5)).toEqual([]);
  });

  it("filters non-finite values", () => {
    const breaks = quantileBreaks([1, 2, 3, NaN, Infinity, 4, 5], 4);
    expect(breaks).toHaveLength(3);
    expect(breaks.every(Number.isFinite)).toBe(true);
  });
});

describe("equalIntervalBreaks", () => {
  it("produces uniform splits of [min, max]", () => {
    const breaks = equalIntervalBreaks([0, 100], 5);
    expect(breaks).toEqual([20, 40, 60, 80]);
  });

  it("colors everything one color on heavily-skewed data (the dossier failure mode)", () => {
    // 1,1,1,1,1,1,1,1,1,100 with equal-interval 5 bins of [1, 100].
    // 9 of 10 values fall in bin 0 — the dossier's named failure mode.
    const breaks = equalIntervalBreaks([1, 1, 1, 1, 1, 1, 1, 1, 1, 100], 5);
    // Step = (100-1)/5 = 19.8 → breaks at 20.8, 40.6, 60.4, 80.2
    expect(breaks[0]).toBeCloseTo(20.8, 1);
    // All nine 1s land in bin 0.
    const bins = [1, 1, 1, 1, 1, 1, 1, 1, 1].map((v) => assignBin(v, breaks));
    expect(bins.every((b) => b === 0)).toBe(true);
  });
});

describe("assignBin", () => {
  it("returns 0 for values at or below breaks[0]", () => {
    expect(assignBin(0, [10, 20, 30])).toBe(0);
    expect(assignBin(10, [10, 20, 30])).toBe(0);
  });

  it("returns the top bin for values above breaks[last]", () => {
    expect(assignBin(100, [10, 20, 30])).toBe(3);
  });

  it("places values in the correct interior bin", () => {
    const breaks = [10, 20, 30];
    expect(assignBin(15, breaks)).toBe(1);
    expect(assignBin(25, breaks)).toBe(2);
  });

  it("total bin count = breaks.length + 1", () => {
    const breaks = [10, 20, 30, 40];
    const bins = new Set([0, 10, 15, 25, 35, 100].map((v) => assignBin(v, breaks)));
    // Should cover bins 0, 0, 1, 2, 3, 4 — five unique bins.
    expect(bins.has(0)).toBe(true);
    expect(bins.has(4)).toBe(true);
  });
});

describe("normalizeForRamp", () => {
  it("maps bin 0 to 0", () => {
    expect(normalizeForRamp(5, [10, 20, 30, 40])).toBe(0);
  });

  it("maps top bin to 1", () => {
    expect(normalizeForRamp(100, [10, 20, 30, 40])).toBe(1);
  });

  it("maps interior bins proportionally", () => {
    // 5 bins (4 breaks), bin index 2 → 2/4 = 0.5
    expect(normalizeForRamp(25, [10, 20, 30, 40])).toBe(0.5);
  });
});

describe("binAndNormalize", () => {
  it("end-to-end: raw values → enriched records with [0,1] value field", () => {
    const records = [
      { country: "A", gdp: 1000 },
      { country: "B", gdp: 5000 },
      { country: "C", gdp: 10000 },
      { country: "D", gdp: 50000 },
      { country: "E", gdp: 100000 },
    ];
    const { records: enriched, breaks } = binAndNormalize(records, {
      extractValue: (r) => r.gdp,
      strategy: "quantile",
      bins: 5,
    });
    expect(enriched).toHaveLength(5);
    expect(breaks).toHaveLength(4);
    // Each record gets a normalized value in [0,1]
    enriched.forEach((r) => {
      expect(r.value).toBeGreaterThanOrEqual(0);
      expect(r.value).toBeLessThanOrEqual(1);
    });
    // Top value (E, 100K) maps to top bin = 1.0
    expect(enriched[4].value).toBe(1);
    // Bottom value (A, 1K) maps to bin 0 = 0
    expect(enriched[0].value).toBe(0);
  });

  it("defaults to quantile strategy with 5 bins (dossier convention)", () => {
    const records = [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }, { value: 5 }];
    const { breaks } = binAndNormalize(records);
    expect(breaks).toHaveLength(4); // 5 bins → 4 breakpoints
  });
});
