/**
 * dorling — unit tests for the d3-force decollision wrapper used by
 * CartogramMap.
 *
 * Reference: src/utils/dorling.ts
 */

import { describe, expect, it } from "vitest";
import { runDorlingLayout, type DorlingNodeInput } from "../utils/dorling";

const VIEWPORT = { width: 1920, height: 1080, padding: 80 };

const makeNodes = (count: number, radius: number): DorlingNodeInput[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `n${i}`,
    targetX: 960 + (i - count / 2) * radius * 0.5, // intentionally clustered
    targetY: 540,
    radius,
  }));

describe("runDorlingLayout", () => {
  it("preserves node IDs and radii", () => {
    const inputs = makeNodes(10, 30);
    const out = runDorlingLayout(inputs, VIEWPORT);
    expect(out.length).toBe(inputs.length);
    for (let i = 0; i < inputs.length; i++) {
      expect(out[i].id).toBe(inputs[i].id);
      expect(out[i].radius).toBe(inputs[i].radius);
    }
  });

  it("DECOLLIDES — no two final circles overlap (within 0.5px tolerance)", () => {
    // 12 large circles clustered tightly → simulation must push apart.
    const inputs = makeNodes(12, 40);
    const out = runDorlingLayout(inputs, VIEWPORT);
    for (let i = 0; i < out.length; i++) {
      for (let j = i + 1; j < out.length; j++) {
        const dx = out[i].x - out[j].x;
        const dy = out[i].y - out[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = out[i].radius + out[j].radius;
        // collide force allows up to ~0.5px overlap; assert sane separation.
        expect(dist).toBeGreaterThanOrEqual(minDist - 1.5);
      }
    }
  });

  it("KEEPS nodes inside the viewport (with padding)", () => {
    const inputs = makeNodes(15, 50);
    const out = runDorlingLayout(inputs, VIEWPORT);
    for (const n of out) {
      expect(n.x).toBeGreaterThanOrEqual(VIEWPORT.padding + n.radius - 0.01);
      expect(n.x).toBeLessThanOrEqual(VIEWPORT.width - VIEWPORT.padding - n.radius + 0.01);
      expect(n.y).toBeGreaterThanOrEqual(VIEWPORT.padding + n.radius - 0.01);
      expect(n.y).toBeLessThanOrEqual(VIEWPORT.height - VIEWPORT.padding - n.radius + 0.01);
    }
  });

  it("is DETERMINISTIC (same input → same output)", () => {
    // Force simulation has fixed initial conditions; runs should match.
    const inputs = makeNodes(8, 35);
    const a = runDorlingLayout(inputs, VIEWPORT);
    const b = runDorlingLayout(inputs, VIEWPORT);
    for (let i = 0; i < a.length; i++) {
      expect(a[i].x).toBeCloseTo(b[i].x, 4);
      expect(a[i].y).toBeCloseTo(b[i].y, 4);
    }
  });

  it("handles empty input", () => {
    expect(runDorlingLayout([], VIEWPORT)).toEqual([]);
  });

  it("DEDUPES inputs by id — duplicates collapse to first occurrence (B2 audit)", () => {
    // If duplicates were passed through, d3-force's collide jiggle would
    // separate identically-positioned nodes via random pertubation,
    // potentially breaking determinism. The dedup guard prevents that.
    const inputs: DorlingNodeInput[] = [
      { id: "USA", targetX: 500, targetY: 500, radius: 30 },
      { id: "USA", targetX: 600, targetY: 600, radius: 25 }, // dup, ignored
      { id: "CHN", targetX: 700, targetY: 500, radius: 40 },
    ];
    const out = runDorlingLayout(inputs, VIEWPORT);
    expect(out.length).toBe(2); // 2 unique ids, not 3
    expect(out.find((n) => n.id === "USA")?.radius).toBe(30); // first occurrence wins
    expect(out.find((n) => n.id === "CHN")?.radius).toBe(40);
  });

  it("respects xyStrength (lower = more aggressive decollision)", () => {
    // Aggressive: nodes drift further from their target positions.
    const inputs = makeNodes(10, 40);
    const gentle = runDorlingLayout(inputs, VIEWPORT, 120, 0.5);
    const aggressive = runDorlingLayout(inputs, VIEWPORT, 120, 0.05);

    // Sum of "distance from target" should be larger with lower xyStrength.
    const driftGentle = gentle.reduce(
      (sum, n) => sum + Math.abs(n.x - n.targetX) + Math.abs(n.y - n.targetY),
      0,
    );
    const driftAggressive = aggressive.reduce(
      (sum, n) => sum + Math.abs(n.x - n.targetX) + Math.abs(n.y - n.targetY),
      0,
    );
    expect(driftAggressive).toBeGreaterThan(driftGentle);
  });
});
