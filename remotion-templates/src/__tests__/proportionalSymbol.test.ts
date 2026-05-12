/**
 * proportionalSymbol — unit tests for area-proportional radius math, legend
 * tick generation, value formatting, and largest-first symbol sorting.
 *
 * The radius math is the load-bearing claim ("area encodes value") — bugs
 * here would silently make the template lie about magnitudes. So this
 * suite is heavier than a typical helpers suite.
 *
 * Reference: src/utils/proportionalSymbol.ts
 */

import { describe, expect, it } from "vitest";
import {
  computeRadius,
  radiusToValue,
  generateLegendTicks,
  niceCeil,
  formatLegendValue,
  sortSymbolsLargestFirst,
} from "../utils/proportionalSymbol";

// ── computeRadius — area-proportional math ────────────────────────────────

describe("computeRadius (sqrt / area-proportional, default)", () => {
  const maxRadius = 100;
  const maxValue = 100;

  it("renders zero for non-positive value", () => {
    expect(computeRadius(0, maxValue, maxRadius)).toBe(0);
    expect(computeRadius(-5, maxValue, maxRadius)).toBe(0);
  });

  it("renders maxRadius for value === maxValue", () => {
    expect(computeRadius(100, maxValue, maxRadius)).toBe(maxRadius);
  });

  it("CRITICAL: 1/4 value yields 1/2 radius (sqrt scaling, area-proportional)", () => {
    // If we got 1/4 radius here, the template would be encoding value
    // RADIUS-proportionally — the proportional-symbol lie.
    const r = computeRadius(25, 100, 100);
    expect(r).toBeCloseTo(50, 5);
  });

  it("CRITICAL: 1/16 value yields 1/4 radius (sqrt scaling)", () => {
    // Same invariant restated — area-proportional means radius ∝ sqrt(value).
    const r = computeRadius(6.25, 100, 100);
    expect(r).toBeCloseTo(25, 5);
  });

  it("AREA of symbol scales LINEARLY with value (the contract)", () => {
    // Area = π r². If value → area is linear, then r_2/r_1 = sqrt(v_2/v_1).
    const r1 = computeRadius(10, 100, 100);
    const r2 = computeRadius(40, 100, 100);
    // 4× value → 2× radius → 4× area. Verify the area ratio.
    const area1 = Math.PI * r1 * r1;
    const area2 = Math.PI * r2 * r2;
    expect(area2 / area1).toBeCloseTo(4, 1);
  });

  it("clamps to maxRadius for value > maxValue", () => {
    // Future-proofing: if data exceeds the declared max, we clip rather
    // than render a bigger-than-allowed circle that breaks layout.
    expect(computeRadius(500, 100, 50)).toBe(50);
  });

  it("returns 0 when maxValue is 0", () => {
    expect(computeRadius(10, 0, 100)).toBe(0);
  });
});

describe("computeRadius (linear — the footgun)", () => {
  it("encodes value RADIUS-proportionally (the lie this template avoids by default)", () => {
    // 1/4 value → 1/4 radius under linear → 1/16 area visually.
    // The lint should flag any production data file using scaleType: "linear".
    expect(computeRadius(25, 100, 100, "linear")).toBe(25);
  });

  it("still respects max-clip and zero", () => {
    expect(computeRadius(200, 100, 50, "linear")).toBe(50);
    expect(computeRadius(0, 100, 50, "linear")).toBe(0);
  });
});

// ── radiusToValue — inverse ───────────────────────────────────────────────

describe("radiusToValue (inverse of computeRadius)", () => {
  it("is the inverse of computeRadius under sqrt", () => {
    const v = 42;
    const r = computeRadius(v, 100, 50, "sqrt");
    expect(radiusToValue(r, 100, 50, "sqrt")).toBeCloseTo(v, 5);
  });

  it("is the inverse of computeRadius under linear", () => {
    const v = 42;
    const r = computeRadius(v, 100, 50, "linear");
    expect(radiusToValue(r, 100, 50, "linear")).toBeCloseTo(v, 5);
  });

  it("returns 0 for zero or negative radius", () => {
    expect(radiusToValue(0, 100, 50)).toBe(0);
    expect(radiusToValue(-5, 100, 50)).toBe(0);
  });
});

// ── niceCeil ──────────────────────────────────────────────────────────────

describe("niceCeil", () => {
  it("rounds up to 1/2/5/10 family at the appropriate decade", () => {
    expect(niceCeil(1.5)).toBe(2);
    expect(niceCeil(3)).toBe(5);
    expect(niceCeil(7)).toBe(10);
    expect(niceCeil(15)).toBe(20);
    expect(niceCeil(33)).toBe(50);
    expect(niceCeil(78)).toBe(100);
    expect(niceCeil(150)).toBe(200);
    expect(niceCeil(450)).toBe(500);
  });

  it("handles sub-1 values by snapping to the same family at smaller decade", () => {
    // 0.5 is itself a "nice" number (5 × 10^-1). 0.3 → 0.5. 0.07 → 0.1.
    expect(niceCeil(0.5)).toBe(0.5);
    expect(niceCeil(0.3)).toBe(0.5);
    expect(niceCeil(0.07)).toBeCloseTo(0.1, 10);
  });

  it("returns 0 for non-positive input", () => {
    expect(niceCeil(0)).toBe(0);
    expect(niceCeil(-10)).toBe(0);
  });

  it("handles values exactly on a nice boundary", () => {
    expect(niceCeil(1)).toBe(1);
    expect(niceCeil(10)).toBe(10);
    expect(niceCeil(100)).toBe(100);
  });
});

// ── generateLegendTicks ───────────────────────────────────────────────────

describe("generateLegendTicks", () => {
  it("returns three monotonic ascending ticks", () => {
    const { small, medium, large } = generateLegendTicks(100);
    expect(small).toBeLessThan(medium);
    expect(medium).toBeLessThan(large);
  });

  it("large tick is a nice-ceil of the max value", () => {
    expect(generateLegendTicks(78).large).toBe(100);
    expect(generateLegendTicks(450).large).toBe(500);
  });

  it("small tick is approximately large / 16 (nice-ceiled)", () => {
    // 100 / 16 = 6.25 → niceCeil = 10
    expect(generateLegendTicks(100).small).toBe(10);
  });

  it("medium tick is approximately large / 4 (nice-ceiled)", () => {
    expect(generateLegendTicks(100).medium).toBe(50); // 100/4 = 25 → nice = 50
  });

  it("returns zeros for zero/negative max", () => {
    expect(generateLegendTicks(0)).toEqual({ small: 0, medium: 0, large: 0 });
    expect(generateLegendTicks(-5)).toEqual({ small: 0, medium: 0, large: 0 });
  });
});

// ── formatLegendValue ─────────────────────────────────────────────────────

describe("formatLegendValue", () => {
  it("formats large numbers with K/M/B suffix", () => {
    expect(formatLegendValue(1500)).toBe("1.5K");
    expect(formatLegendValue(2_500_000)).toBe("2.5M");
    expect(formatLegendValue(3_400_000_000)).toBe("3.4B");
  });

  it("trims trailing .0 for round magnitudes", () => {
    expect(formatLegendValue(1000)).toBe("1K");
    expect(formatLegendValue(2_000_000)).toBe("2M");
  });

  it("rounds to integer for 10..999", () => {
    expect(formatLegendValue(45)).toBe("45");
    expect(formatLegendValue(999)).toBe("999");
  });

  it("formats small numbers with 1 decimal", () => {
    expect(formatLegendValue(2.3)).toBe("2.3");
    expect(formatLegendValue(0.5)).toBe("0.5");
  });

  it("appends unit when given", () => {
    expect(formatLegendValue(45, "fabs")).toBe("45 fabs");
    expect(formatLegendValue(2500, "GW")).toBe("2.5K GW");
  });
});

// ── sortSymbolsLargestFirst ───────────────────────────────────────────────

describe("sortSymbolsLargestFirst", () => {
  it("sorts descending by value", () => {
    const sorted = sortSymbolsLargestFirst([
      { iso3: "A", value: 5 },
      { iso3: "B", value: 100 },
      { iso3: "C", value: 30 },
    ]);
    expect(sorted.map((s) => s.iso3)).toEqual(["B", "C", "A"]);
  });

  it("does not mutate the input array", () => {
    const original = [
      { iso3: "A", value: 5 },
      { iso3: "B", value: 100 },
    ];
    sortSymbolsLargestFirst(original);
    expect(original.map((s) => s.iso3)).toEqual(["A", "B"]);
  });

  it("handles empty input", () => {
    expect(sortSymbolsLargestFirst([])).toEqual([]);
  });

  it("preserves auxiliary fields on each symbol", () => {
    const sorted = sortSymbolsLargestFirst([
      { iso3: "A", value: 5, color: "#ff0000" },
      { iso3: "B", value: 100, label: "Big" },
    ] as const);
    expect(sorted[0]).toMatchObject({ iso3: "B", label: "Big" });
    expect(sorted[1]).toMatchObject({ iso3: "A", color: "#ff0000" });
  });
});
