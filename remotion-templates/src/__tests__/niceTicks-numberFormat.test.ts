/**
 * niceTicks + numberFormat — unit tests for axis math and number display.
 *
 * These are pure functions used in every chart render. A regression here
 * produces wrong axis labels or display values across all DataChart and
 * TimeSeriesChart shots; the layout zone tests won't catch it because they
 * only check geometry, not computed content.
 *
 * COVERAGE — niceTicks.ts:
 *   · niceDomain: 1/2/5×10ⁿ snapping, real episode data ranges, edge cases
 *   · niceTicks: tick array generation, floating-point safety, boundary counts
 *   · computeYDomain: floor/ceiling-zero rules, mixed-sign padding, empty input
 *   · formatTick: prefix currencies, suffix units, plain integer/float
 *
 * COVERAGE — numberFormat.ts:
 *   · formatNumber: decimal, abbreviated (K/M/B/T), percent, currency
 *   · formatNumber: prefix/suffix pass-through, edge cases (NaN, Infinity, 0)
 *   · formatCountUp: integer-lock rounding, float delegation
 */

import { describe, expect, it } from "vitest";
import {
  niceDomain,
  niceTicks,
  computeYDomain,
  formatTick,
} from "../utils/niceTicks";
import { formatNumber, formatCountUp } from "../utils/numberFormat";

// ── niceDomain ────────────────────────────────────────────────────────────────

describe("niceDomain", () => {
  describe("canonical examples from the JSDoc", () => {
    it("(133, 4721, 5) → [0, 5000]", () => {
      const [lo, hi] = niceDomain(133, 4721, 5);
      expect(lo).toBe(0);
      expect(hi).toBe(5000);
    });

    it("(2018, 2024, 5) → preserves year range", () => {
      const [lo, hi] = niceDomain(2018, 2024, 5);
      expect(lo).toBeLessThanOrEqual(2018);
      expect(hi).toBeGreaterThanOrEqual(2024);
      // Spacing should be a nice round number
      expect((hi - lo) % 1).toBe(0);
    });

    it("(-12, 87, 5) → [-20, 100]", () => {
      const [lo, hi] = niceDomain(-12, 87, 5);
      expect(lo).toBe(-20);
      expect(hi).toBe(100);
    });
  });

  describe("real episode data ranges", () => {
    it("semiconductor market share 0–100%", () => {
      const [lo, hi] = niceDomain(0, 100, 5);
      expect(lo).toBe(0);
      expect(hi).toBe(100);
    });

    it("chip export values 0–165 ($B)", () => {
      const [lo, hi] = niceDomain(0, 165, 5);
      expect(lo).toBe(0);
      expect(hi).toBeGreaterThanOrEqual(165);
      // Must be a multiple of a 1/2/5×10ⁿ spacing
      expect(hi % 1).toBe(0);
    });

    it("TSMC revenue 2010–2023 range", () => {
      const [lo, hi] = niceDomain(0, 75900, 5); // millions USD
      expect(lo).toBe(0);
      expect(hi).toBeGreaterThanOrEqual(75900);
    });

    it("negative-only range (losses)", () => {
      const [lo, hi] = niceDomain(-500, -50, 5);
      expect(lo).toBeLessThanOrEqual(-500);
      expect(hi).toBeGreaterThanOrEqual(-50);
    });
  });

  describe("edge cases", () => {
    it("max === min returns [min, max] unchanged", () => {
      expect(niceDomain(42, 42)).toEqual([42, 42]);
    });

    it("max < min returns [min, max] unchanged", () => {
      expect(niceDomain(10, 5)).toEqual([10, 5]);
    });

    it("tiny fractional range snaps cleanly", () => {
      const [lo, hi] = niceDomain(0.1, 0.9, 5);
      expect(lo).toBeLessThanOrEqual(0.1);
      expect(hi).toBeGreaterThanOrEqual(0.9);
    });

    it("niceMin ≤ original min, niceMax ≥ original max", () => {
      for (const [a, b] of [[13, 47], [0, 7], [1000, 9999], [-100, 50]] as const) {
        const [lo, hi] = niceDomain(a, b);
        expect(lo).toBeLessThanOrEqual(a);
        expect(hi).toBeGreaterThanOrEqual(b);
      }
    });
  });
});

// ── niceTicks ─────────────────────────────────────────────────────────────────

describe("niceTicks", () => {
  describe("canonical examples from the JSDoc", () => {
    it("niceTicks(0, 5000, 5) → [0, 1000, 2000, 3000, 4000, 5000]", () => {
      expect(niceTicks(0, 5000, 5)).toEqual([0, 1000, 2000, 3000, 4000, 5000]);
    });

    it("niceTicks(0, 4000, 5) → [0, 1000, 2000, 3000, 4000]", () => {
      expect(niceTicks(0, 4000, 5)).toEqual([0, 1000, 2000, 3000, 4000]);
    });
  });

  describe("all tick values land on round numbers", () => {
    it("small range: [0, 10]", () => {
      const ticks = niceTicks(0, 10, 5);
      ticks.forEach((t) => expect(Number.isInteger(t)).toBe(true));
    });

    it("large range: [0, 1_000_000]", () => {
      const ticks = niceTicks(0, 1_000_000, 5);
      ticks.forEach((t) => expect(Number.isInteger(t)).toBe(true));
    });

    it("year range [2010, 2024]", () => {
      const ticks = niceTicks(2010, 2024, 5);
      expect(ticks[0]).toBeGreaterThanOrEqual(2010);
      expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(2024);
      ticks.forEach((t) => expect(Number.isInteger(t)).toBe(true));
    });
  });

  describe("tick count is close to target", () => {
    it("returns approximately targetTicks ticks (within a factor of 2)", () => {
      // 1/2/5×10ⁿ snapping means the actual count can differ noticeably from
      // the target for some ranges — e.g. target=7, range=1000 picks spacing=100
      // giving 11 ticks. The key contract is that the count is bounded and
      // the values are round numbers; exact count matching isn't guaranteed.
      for (const target of [3, 5, 7]) {
        const ticks = niceTicks(0, 1000, target);
        expect(ticks.length).toBeGreaterThanOrEqual(Math.max(1, target - 3));
        expect(ticks.length).toBeLessThanOrEqual(target * 2);
      }
    });

    it("niceTicks(0, 5000, 5) produces exactly 6 ticks", () => {
      // Canonical example from JSDoc — verify exact count for a clean range
      expect(niceTicks(0, 5000, 5).length).toBe(6);
    });
  });

  describe("edge cases", () => {
    it("max === min returns [min]", () => {
      expect(niceTicks(5, 5)).toEqual([5]);
    });

    it("max < min returns [min]", () => {
      expect(niceTicks(10, 2)).toEqual([10]);
    });

    it("ticks are strictly ascending", () => {
      const ticks = niceTicks(0, 100, 5);
      for (let i = 1; i < ticks.length; i++) {
        expect(ticks[i]).toBeGreaterThan(ticks[i - 1]);
      }
    });

    it("first tick ≥ min, last tick ≤ max", () => {
      const ticks = niceTicks(133, 4721, 5);
      expect(ticks[0]).toBeGreaterThanOrEqual(133);
      expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(4721);
    });
  });
});

// ── computeYDomain ────────────────────────────────────────────────────────────

describe("computeYDomain", () => {
  describe("non-negative data → floor at 0", () => {
    it("population-style data clamps bottom to 0", () => {
      const [lo] = computeYDomain([100, 200, 350, 420, 500]);
      expect(lo).toBe(0);
    });

    it("single positive value — bottom at 0, top padded", () => {
      const [lo, hi] = computeYDomain([42]);
      expect(lo).toBe(0);
      expect(hi).toBeGreaterThan(42);
    });
  });

  describe("all-negative data → ceiling at 0", () => {
    it("top snaps to 0 for all-negative values", () => {
      const [, hi] = computeYDomain([-500, -300, -100]);
      expect(hi).toBe(0);
    });
  });

  describe("mixed-sign data → both ends padded", () => {
    it("domain extends below min and above max", () => {
      const values = [-20, 0, 50];
      const [lo, hi] = computeYDomain(values);
      expect(lo).toBeLessThan(-20);
      expect(hi).toBeGreaterThan(50);
    });
  });

  describe("forceIncludeZero: false", () => {
    it("allows bottom to float above 0 for high-baseline data", () => {
      const values = [95, 97, 98, 99, 100];
      const [lo] = computeYDomain(values, { forceIncludeZero: false });
      expect(lo).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("empty array → [0, 1] safe fallback", () => {
      expect(computeYDomain([])).toEqual([0, 1]);
    });

    it("all-same value — still produces a non-zero domain", () => {
      const [lo, hi] = computeYDomain([50, 50, 50]);
      expect(hi).toBeGreaterThan(lo);
    });

    it("output is a valid niceDomain (niceMin ≤ dataMin, niceMax ≥ dataMax)", () => {
      const values = [133, 476, 821, 1204, 3892];
      const [lo, hi] = computeYDomain(values);
      expect(lo).toBeLessThanOrEqual(0); // non-negative floor
      expect(hi).toBeGreaterThanOrEqual(3892);
    });
  });
});

// ── formatTick ────────────────────────────────────────────────────────────────

describe("formatTick", () => {
  it("integer with no unit → comma-separated string", () => {
    expect(formatTick(1000)).toBe("1,000");
    expect(formatTick(0)).toBe("0");
    expect(formatTick(1000000)).toBe("1,000,000");
  });

  it("float with no unit → one decimal place", () => {
    const result = formatTick(3.7);
    expect(result).toMatch(/3[.,]7/);
  });

  it("prefix currency units ($, €, ¥) prepend symbol", () => {
    expect(formatTick(1000, "$")).toBe("$1,000");
    expect(formatTick(500, "€")).toBe("€500");
    expect(formatTick(2000, "¥")).toBe("¥2,000");
  });

  it("suffix units append after value", () => {
    expect(formatTick(75, "%")).toBe("75%");
    expect(formatTick(120, " mph")).toBe("120 mph");
    expect(formatTick(50, " m")).toBe("50 m");
  });
});

// ── formatNumber ──────────────────────────────────────────────────────────────

describe("formatNumber", () => {
  describe("decimal style (default)", () => {
    it("integer → no decimals, thousands separator", () => {
      expect(formatNumber(1234567)).toBe("1,234,567");
    });

    it("zero → '0'", () => {
      expect(formatNumber(0)).toBe("0");
    });

    it("negative integer", () => {
      expect(formatNumber(-42)).toBe("-42");
    });

    it("explicit decimals option overrides default", () => {
      const result = formatNumber(3.14159, { decimals: 2 });
      expect(result).toMatch(/3[.,]14/);
    });
  });

  describe("abbreviated style", () => {
    it("1.2M from 1,200,000", () => {
      const result = formatNumber(1_200_000, { style: "abbreviated" });
      expect(result).toBe("1.2M");
    });

    it("3.5B from 3,500,000,000", () => {
      const result = formatNumber(3_500_000_000, { style: "abbreviated" });
      expect(result).toBe("3.5B");
    });

    it("1.2T from 1,200,000,000,000", () => {
      const result = formatNumber(1_200_000_000_000, { style: "abbreviated" });
      expect(result).toBe("1.2T");
    });

    it("250K from 250,000 — no decimal when scaled ≥ 100", () => {
      // scaled = 250 ≥ 100 → d=0 by the decimals heuristic
      const result = formatNumber(250_000, { style: "abbreviated" });
      expect(result).toBe("250K");
    });

    it("values below 1K are not abbreviated", () => {
      const result = formatNumber(999, { style: "abbreviated" });
      expect(result).not.toMatch(/K|M|B|T/);
    });

    it("negative abbreviated value", () => {
      const result = formatNumber(-2_400_000, { style: "abbreviated" });
      expect(result).toContain("M");
      expect(result).toContain("-");
    });
  });

  describe("percent style", () => {
    it("fraction ≤ 1 treated as ratio (0.38 → 38%)", () => {
      expect(formatNumber(0.38, { style: "percent" })).toBe("38%");
    });

    it("value > 1 treated as already-percent (38 → 38%)", () => {
      expect(formatNumber(38, { style: "percent" })).toBe("38%");
    });

    it("with decimals: 1 decimal place", () => {
      const result = formatNumber(0.382, { style: "percent", decimals: 1 });
      expect(result).toMatch(/38[.,]2%/);
    });

    it("100% edge case", () => {
      expect(formatNumber(1.0, { style: "percent" })).toBe("100%");
    });
  });

  describe("currency style", () => {
    it("USD default — dollar sign + no decimals for integer", () => {
      const result = formatNumber(1234, { style: "currency" });
      expect(result).toContain("$");
      expect(result).toContain("1,234");
    });
  });

  describe("prefix / suffix pass-through", () => {
    it("prefix prepended to formatted value", () => {
      expect(formatNumber(165, { prefix: "~$" })).toBe("~$165");
    });

    it("suffix appended after formatted value", () => {
      expect(formatNumber(7, { suffix: "B chips" })).toBe("7B chips");
    });

    it("both prefix and suffix", () => {
      const result = formatNumber(42, { prefix: "≈", suffix: "%" });
      expect(result).toBe("≈42%");
    });
  });

  describe("non-finite edge cases", () => {
    it("NaN → empty string (just prefix+suffix)", () => {
      expect(formatNumber(NaN)).toBe("");
      expect(formatNumber(NaN, { prefix: "$" })).toBe("$");
    });

    it("Infinity → empty string", () => {
      expect(formatNumber(Infinity)).toBe("");
    });
  });
});

// ── formatCountUp ─────────────────────────────────────────────────────────────

describe("formatCountUp", () => {
  it("locks to integer when target is integer and current is near it", () => {
    // At the last animation frame, current is a float very close to integer target
    const result = formatCountUp(99.97, 100);
    expect(result).toBe("100");
  });

  it("rounds current to nearest integer when target is integer", () => {
    expect(formatCountUp(42.3, 100)).toBe("42");
    expect(formatCountUp(42.7, 100)).toBe("43");
  });

  it("uses 1 decimal when target is a float", () => {
    const result = formatCountUp(7.34, 7.4);
    expect(result).toMatch(/7[.,]\d/);
  });

  it("explicit decimals:0 forces rounding even for float target", () => {
    const result = formatCountUp(3.7, 3.9, { decimals: 0 });
    expect(result).toBe("4");
  });

  it("delegates prefix/suffix to formatNumber", () => {
    const result = formatCountUp(50, 100, { prefix: "$" });
    expect(result).toBe("$50");
  });

  it("zero current", () => {
    expect(formatCountUp(0, 100)).toBe("0");
  });
});
