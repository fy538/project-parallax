/**
 * DensityMap — unit tests for the pure helpers used by the template.
 *
 * The deck.gl aggregation layers themselves are tested by deck.gl's own
 * suite; this file covers the Parallax-specific glue: color ramp
 * conversion + schema acceptance.
 *
 * Reference: src/templates/DensityMap/DensityMap.tsx
 */

import { describe, expect, it } from "vitest";
import { hexRampToRgbTuples } from "../templates/DensityMap/DensityMap";
import { DensityMapSchema } from "../templates/DensityMap/schema";
import { palette } from "../design/theme";

describe("hexRampToRgbTuples", () => {
  it("converts hex strings to [r, g, b] tuples in [0, 255]", () => {
    const tuples = hexRampToRgbTuples(["#000000", "#FFFFFF"]);
    expect(tuples).toEqual([
      [0, 0, 0],
      [255, 255, 255],
    ]);
  });

  it("preserves color ordering (sequential ramp stays sequential)", () => {
    const tuples = hexRampToRgbTuples([palette.paper, palette.bone, palette.rust]);
    expect(tuples).toHaveLength(3);
    // First entry is lightest (high RGB values), last is most saturated.
    expect(tuples[0][0]).toBeGreaterThan(tuples[2][0] - 30); // paper has high red
    expect(tuples[2][0]).toBeGreaterThan(tuples[2][1]); // rust: more red than green
  });

  it("handles arbitrary-length ramps", () => {
    const ramp = [palette.paper, palette.bone, palette.gold, palette.rust, palette.umber];
    expect(hexRampToRgbTuples(ramp)).toHaveLength(5);
  });

  it("returns empty array for empty input", () => {
    expect(hexRampToRgbTuples([])).toEqual([]);
  });
});

describe("DensityMapSchema", () => {
  const baseData = {
    episode: "test",
    title: "test",
    phases: [
      {
        title: "p1",
        durationSec: 5,
        points: [{ at: [120, 25] }, { at: [-100, 40] }],
      },
    ],
  };

  it("accepts minimal valid data", () => {
    expect(() => DensityMapSchema.parse({ data: baseData })).not.toThrow();
  });

  it("accepts all three mode values", () => {
    for (const mode of ["hex", "heatmap", "grid"] as const) {
      expect(() =>
        DensityMapSchema.parse({ data: { ...baseData, mode } }),
      ).not.toThrow();
    }
  });

  it("rejects unknown mode value", () => {
    expect(() =>
      DensityMapSchema.parse({ data: { ...baseData, mode: "bubblechart" } }),
    ).toThrow();
  });

  it("rejects empty phases array (schema enforces .min(1))", () => {
    expect(() =>
      DensityMapSchema.parse({ data: { ...baseData, phases: [] } }),
    ).toThrow();
  });

  it("rejects negative point weights", () => {
    expect(() =>
      DensityMapSchema.parse({
        data: {
          ...baseData,
          phases: [
            {
              title: "p1",
              durationSec: 5,
              points: [{ at: [120, 25], weight: -1 }],
            },
          ],
        },
      }),
    ).toThrow();
  });

  it("accepts custom colorRamp + opacity + coverage + cellSize", () => {
    expect(() =>
      DensityMapSchema.parse({
        data: {
          ...baseData,
          colorRamp: ["#000000", "#FFFFFF"],
          opacity: 0.5,
          coverage: 0.85,
          cellSize: 50_000,
        },
      }),
    ).not.toThrow();
  });

  it("rejects opacity / coverage outside [0, 1]", () => {
    expect(() =>
      DensityMapSchema.parse({ data: { ...baseData, opacity: 1.5 } }),
    ).toThrow();
    expect(() =>
      DensityMapSchema.parse({ data: { ...baseData, coverage: -0.1 } }),
    ).toThrow();
  });

  it("accepts inset configuration block", () => {
    expect(() =>
      DensityMapSchema.parse({
        data: {
          ...baseData,
          inset: { show: true, position: "tl", size: 240, framed: true },
        },
      }),
    ).not.toThrow();
  });

  it("rejects unknown inset position", () => {
    expect(() =>
      DensityMapSchema.parse({
        data: { ...baseData, inset: { position: "middle" } },
      }),
    ).toThrow();
  });

  it("accepts points with colorWeight (bivariate)", () => {
    expect(() =>
      DensityMapSchema.parse({
        data: {
          ...baseData,
          phases: [
            {
              title: "p1",
              durationSec: 5,
              points: [
                { at: [0, 0], weight: 5, colorWeight: 2020 },
                { at: [10, 10], weight: 3, colorWeight: 1995 },
              ],
            },
          ],
        },
      }),
    ).not.toThrow();
  });

  it("accepts all three colorAggregation values", () => {
    for (const agg of ["sum", "mean", "max"] as const) {
      expect(() =>
        DensityMapSchema.parse({
          data: { ...baseData, colorAggregation: agg },
        }),
      ).not.toThrow();
    }
  });

  it("rejects unknown colorAggregation", () => {
    expect(() =>
      DensityMapSchema.parse({
        data: { ...baseData, colorAggregation: "median" },
      }),
    ).toThrow();
  });
});
