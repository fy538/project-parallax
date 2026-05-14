/**
 * mapUtils + labelStack — unit tests for pure map and layout utilities.
 *
 * Both modules are pure (no React, no Remotion hooks, no browser APIs).
 * Regressions here would silently corrupt map color conversions, camera
 * interpolation, and label collision avoidance across all map templates.
 *
 * COVERAGE — mapUtils.ts:
 *   · hexToRgba: hex → [r,g,b,a] RGBA array for deck.gl
 *   · hexToRgbaString: hex → CSS rgba() string
 *   · scaleToZoom: react-simple-maps scale → Mapbox zoom level
 *   · interpolateCamera: linear blend between two CameraState objects
 *   · cubicBezier1D: 1D Bezier curve math (used by easeCameraT)
 *   · applyDwell: dwell window remapping [0,1]→[0,1]
 *   · easeCameraT: named transition easing presets
 *
 * COVERAGE — labelStack.ts:
 *   · computeLabelStacks: collision-avoidance stack level assignment
 *   · edge cases: empty input, non-colliding, full collision cluster
 */

import { describe, it, expect } from "vitest";
import {
  hexToRgba,
  hexToRgbaString,
  scaleToZoom,
  interpolateCamera,
  cubicBezier1D,
  applyDwell,
  easeCameraT,
  type CameraState,
} from "../utils/mapUtils";
import { computeLabelStacks } from "../utils/labelStack";

// ── hexToRgba ─────────────────────────────────────────────────────────────────

describe("hexToRgba", () => {
  it("converts #000000 to [0, 0, 0, 255]", () => {
    expect(hexToRgba("#000000")).toEqual([0, 0, 0, 255]);
  });

  it("converts #ffffff to [255, 255, 255, 255]", () => {
    expect(hexToRgba("#ffffff")).toEqual([255, 255, 255, 255]);
  });

  it("converts brand ink #1C1814 correctly", () => {
    const [r, g, b, a] = hexToRgba("#1C1814");
    expect(r).toBe(0x1c); // 28
    expect(g).toBe(0x18); // 24
    expect(b).toBe(0x14); // 20
    expect(a).toBe(255);
  });

  it("converts brand amber #E5A544 correctly", () => {
    const [r, g, b] = hexToRgba("#E5A544");
    expect(r).toBe(0xe5); // 229
    expect(g).toBe(0xa5); // 165
    expect(b).toBe(0x44); // 68
  });

  it("respects custom alpha argument (0–255)", () => {
    const [, , , a] = hexToRgba("#ff0000", 128);
    expect(a).toBe(128);
  });

  it("alpha defaults to 255 (opaque)", () => {
    const [, , , a] = hexToRgba("#ff0000");
    expect(a).toBe(255);
  });

  it("returns a 4-element array", () => {
    expect(hexToRgba("#aabbcc").length).toBe(4);
  });

  it("handles hex without leading #", () => {
    const withHash = hexToRgba("#aabbcc");
    const without = hexToRgba("aabbcc");
    expect(withHash).toEqual(without);
  });
});

// ── hexToRgbaString ───────────────────────────────────────────────────────────

describe("hexToRgbaString", () => {
  it("converts #ff0000 to rgba(255, 0, 0, 1)", () => {
    expect(hexToRgbaString("#ff0000")).toBe("rgba(255, 0, 0, 1)");
  });

  it("includes alpha as provided", () => {
    expect(hexToRgbaString("#000000", 0.5)).toBe("rgba(0, 0, 0, 0.5)");
  });

  it("defaults to alpha=1 (opaque)", () => {
    const result = hexToRgbaString("#ffffff");
    expect(result).toContain(", 1)");
  });

  it("starts with rgba(", () => {
    expect(hexToRgbaString("#123456")).toMatch(/^rgba\(/);
  });
});

// ── scaleToZoom ───────────────────────────────────────────────────────────────

describe("scaleToZoom", () => {
  it("scale below table minimum → returns minimum zoom", () => {
    // Table starts at scale=100 → zoom=1.2
    expect(scaleToZoom(50)).toBe(1.2);
  });

  it("scale at table entries → returns exact zoom", () => {
    // Table: [100→1.2], [150→1.8], [200→2.5], [250→3.0]
    expect(scaleToZoom(100)).toBe(1.2);
    expect(scaleToZoom(150)).toBe(1.8);
    expect(scaleToZoom(200)).toBe(2.5);
  });

  it("scale above table maximum → returns maximum zoom", () => {
    // Table ends at scale=1000 → zoom=5.8
    expect(scaleToZoom(2000)).toBe(5.8);
  });

  it("interpolates linearly between table entries", () => {
    // Between 100→1.2 and 150→1.8: midpoint at 125 should be 1.5
    const mid = scaleToZoom(125);
    expect(mid).toBeCloseTo(1.5, 4);
  });

  it("produces increasing zoom for increasing scale", () => {
    const scales = [100, 150, 200, 250, 300, 400, 500, 700, 1000];
    const zooms = scales.map(scaleToZoom);
    for (let i = 1; i < zooms.length; i++) {
      expect(zooms[i]).toBeGreaterThan(zooms[i - 1]);
    }
  });
});

// ── interpolateCamera ─────────────────────────────────────────────────────────

describe("interpolateCamera", () => {
  const world: CameraState = {
    longitude: 0,
    latitude: 0,
    zoom: 2,
    pitch: 0,
    bearing: 0,
  };

  const asia: CameraState = {
    longitude: 100,
    latitude: 40,
    zoom: 5,
    pitch: 45,
    bearing: 30,
  };

  it("at progress=0 → returns the `from` state exactly", () => {
    const result = interpolateCamera(world, asia, 0);
    expect(result.longitude).toBe(world.longitude);
    expect(result.latitude).toBe(world.latitude);
    expect(result.zoom).toBe(world.zoom);
    expect(result.pitch).toBe(world.pitch);
    expect(result.bearing).toBe(world.bearing);
  });

  it("at progress=1 → returns the `to` state exactly", () => {
    const result = interpolateCamera(world, asia, 1);
    expect(result.longitude).toBe(asia.longitude);
    expect(result.latitude).toBe(asia.latitude);
    expect(result.zoom).toBe(asia.zoom);
    expect(result.pitch).toBe(asia.pitch);
    expect(result.bearing).toBe(asia.bearing);
  });

  it("at progress=0.5 → returns midpoint", () => {
    const result = interpolateCamera(world, asia, 0.5);
    expect(result.longitude).toBeCloseTo(50, 5);
    expect(result.latitude).toBeCloseTo(20, 5);
    expect(result.zoom).toBeCloseTo(3.5, 5);
    expect(result.pitch).toBeCloseTo(22.5, 5);
  });

  it("interpolates all 5 camera fields", () => {
    const result = interpolateCamera(world, asia, 0.25);
    expect(result.longitude).toBeCloseTo(25, 4);
    expect(result.latitude).toBeCloseTo(10, 4);
    expect(result.zoom).toBeCloseTo(2.75, 4);
    expect(result.pitch).toBeCloseTo(11.25, 4);
    expect(result.bearing).toBeCloseTo(7.5, 4);
  });
});

// ── cubicBezier1D ─────────────────────────────────────────────────────────────

describe("cubicBezier1D", () => {
  it("at t=0 → returns 0 (start)", () => {
    expect(cubicBezier1D(0.5, 0.5, 0)).toBe(0);
  });

  it("at t=1 → returns 1 (end)", () => {
    expect(cubicBezier1D(0.5, 0.5, 1)).toBe(1);
  });

  it("symmetric control points (0.5, 0.5) → linear (t=0.5 → 0.5)", () => {
    expect(cubicBezier1D(0.5, 0.5, 0.5)).toBeCloseTo(0.5, 4);
  });

  it("ease-in-out shape: slow at edges, faster in middle", () => {
    // Standard ease-in-out: (0, 1) control points
    const quarter = cubicBezier1D(0, 1, 0.25);
    const half = cubicBezier1D(0, 1, 0.5);
    const threeQuarters = cubicBezier1D(0, 1, 0.75);

    // Rate of change: half-point has moved less than linear, then catches up
    expect(half).toBeCloseTo(0.5, 4);
    expect(quarter).toBeLessThan(0.25); // slow start
    expect(threeQuarters).toBeGreaterThan(0.75); // slow end compensated by fast middle
  });

  it("cinematic preset (0.65, 0.35) — output stays in [0, 1]", () => {
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const v = cubicBezier1D(0.65, 0.35, t);
      expect(v).toBeGreaterThanOrEqual(-0.001);
      expect(v).toBeLessThanOrEqual(1.001);
    }
  });
});

// ── applyDwell ────────────────────────────────────────────────────────────────

describe("applyDwell", () => {
  it("t before dwellBefore → returns 0 (holding at start pose)", () => {
    expect(applyDwell(0.05, 0.1, 0.1)).toBe(0);
  });

  it("t after (1 - dwellAfter) → returns 1 (holding at end pose)", () => {
    expect(applyDwell(0.95, 0.1, 0.1)).toBe(1);
  });

  it("t=0.5 with symmetric dwells → returns 0.5 (midpoint of motion)", () => {
    // 10% dwell before, 10% dwell after → motion is 80%, 0.5 is midpoint
    expect(applyDwell(0.5, 0.1, 0.1)).toBeCloseTo(0.5, 4);
  });

  it("no dwell (0, 0) → t is passed through unchanged", () => {
    expect(applyDwell(0, 0, 0)).toBe(0);
    expect(applyDwell(0.5, 0, 0)).toBeCloseTo(0.5, 4);
    expect(applyDwell(1, 0, 0)).toBe(1);
  });

  it("full dwell (degenerate) → returns 0 or 1 based on t < 0.5", () => {
    // totalDwell >= 1 → degenerate case
    expect(applyDwell(0.3, 0.6, 0.6)).toBe(0);
    expect(applyDwell(0.7, 0.6, 0.6)).toBe(1);
  });

  it("output is always in [0, 1]", () => {
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const v = applyDwell(t, 0.1, 0.1);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });
});

// ── easeCameraT ───────────────────────────────────────────────────────────────

describe("easeCameraT", () => {
  it("linear → returns t unchanged", () => {
    expect(easeCameraT(0, "linear")).toBe(0);
    expect(easeCameraT(0.5, "linear")).toBe(0.5);
    expect(easeCameraT(1, "linear")).toBe(1);
  });

  it("cinematic → applies Bezier curve (t=0 → 0, t=1 → 1)", () => {
    expect(easeCameraT(0, "cinematic")).toBe(0);
    expect(easeCameraT(1, "cinematic")).toBe(1);
  });

  it("via-globe → same easing as cinematic (t=0 → 0, t=1 → 1)", () => {
    expect(easeCameraT(0, "via-globe")).toBe(0);
    expect(easeCameraT(1, "via-globe")).toBe(1);
    // via-globe uses the same time curve as cinematic
    expect(easeCameraT(0.5, "via-globe")).toBeCloseTo(
      easeCameraT(0.5, "cinematic"),
      5
    );
  });

  it("cinematic output stays in [0, 1]", () => {
    for (let i = 0; i <= 10; i++) {
      const v = easeCameraT(i / 10, "cinematic");
      expect(v).toBeGreaterThanOrEqual(-0.001);
      expect(v).toBeLessThanOrEqual(1.001);
    }
  });
});

// ── computeLabelStacks ────────────────────────────────────────────────────────

describe("computeLabelStacks", () => {
  describe("empty input", () => {
    it("returns empty array for empty items", () => {
      expect(computeLabelStacks([])).toEqual([]);
    });
  });

  describe("non-colliding items", () => {
    it("all items at different positions → all stack level 0", () => {
      const items = [
        { xPx: 0 },
        { xPx: 200 },
        { xPx: 400 },
        { xPx: 600 },
      ];
      const stacks = computeLabelStacks(items, { collisionThreshold: 80 });
      expect(stacks).toEqual([0, 0, 0, 0]);
    });

    it("single item → stack level 0", () => {
      expect(computeLabelStacks([{ xPx: 100 }])).toEqual([0]);
    });
  });

  describe("colliding pairs", () => {
    it("two items within threshold → one at level 0, one at level 1", () => {
      const items = [{ xPx: 0 }, { xPx: 40 }]; // 40 < threshold 80
      const stacks = computeLabelStacks(items, { collisionThreshold: 80 });
      expect(stacks).toContain(0);
      expect(stacks).toContain(1);
      expect(Math.max(...stacks)).toBe(1);
    });

    it("two items just outside threshold → both at level 0", () => {
      const items = [{ xPx: 0 }, { xPx: 81 }]; // 81 > threshold 80
      const stacks = computeLabelStacks(items, { collisionThreshold: 80 });
      expect(stacks).toEqual([0, 0]);
    });
  });

  describe("cluster collision", () => {
    it("three clustered items → levels 0, 1, 2", () => {
      const items = [
        { xPx: 0 },
        { xPx: 20 },
        { xPx: 40 },
      ];
      const stacks = computeLabelStacks(items, { collisionThreshold: 80 });
      // All three collide → should assign 3 different levels
      const uniqueLevels = new Set(stacks);
      expect(uniqueLevels.size).toBe(3);
      expect(Math.max(...stacks)).toBe(2);
    });

    it("cluster + isolated → cluster gets levels, isolated stays at 0", () => {
      const items = [
        { xPx: 0 },
        { xPx: 30 },
        { xPx: 600 }, // far away, no collision
      ];
      const stacks = computeLabelStacks(items, { collisionThreshold: 80 });
      // Index 2 (x=600) should be at level 0
      expect(stacks[2]).toBe(0);
      // The other two should differ
      expect(stacks[0]).not.toBe(stacks[1]);
    });
  });

  describe("custom collision threshold", () => {
    it("tight threshold 10 → items 40px apart don't collide", () => {
      const items = [{ xPx: 0 }, { xPx: 40 }];
      const stacks = computeLabelStacks(items, { collisionThreshold: 10 });
      expect(stacks).toEqual([0, 0]);
    });

    it("loose threshold 200 → items 40px apart do collide", () => {
      const items = [{ xPx: 0 }, { xPx: 40 }];
      const stacks = computeLabelStacks(items, { collisionThreshold: 200 });
      expect(stacks).toContain(1);
    });
  });

  describe("result integrity", () => {
    it("output has same length as input", () => {
      const items = [{ xPx: 0 }, { xPx: 10 }, { xPx: 200 }, { xPx: 210 }];
      const stacks = computeLabelStacks(items);
      expect(stacks.length).toBe(items.length);
    });

    it("all stack levels are non-negative integers", () => {
      const items = [{ xPx: 0 }, { xPx: 20 }, { xPx: 40 }, { xPx: 400 }];
      const stacks = computeLabelStacks(items, { collisionThreshold: 80 });
      for (const s of stacks) {
        expect(typeof s).toBe("number");
        expect(s).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(s)).toBe(true);
      }
    });

    it("respects original array ordering (not sorted result)", () => {
      // Items out of x-order — result should be in same order as input
      const items = [
        { xPx: 400, label: "D" },
        { xPx: 0, label: "A" },
        { xPx: 20, label: "B" }, // collides with A
      ];
      const stacks = computeLabelStacks(items, { collisionThreshold: 80 });
      // D (index 0) is far from A and B → should be level 0
      expect(stacks[0]).toBe(0);
      // A (index 1) and B (index 2) collide → different levels
      expect(stacks[1]).not.toBe(stacks[2]);
    });
  });
});
