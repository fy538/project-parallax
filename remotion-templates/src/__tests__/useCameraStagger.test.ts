/**
 * Unit tests for the camera-stagger math (L56).
 *
 * Tests the pure `computeCameraStagger` function — the hook itself just wraps
 * this with `useVideoConfig().fps`, so the math is fully testable without a
 * Remotion render context.
 */

import { describe, it, expect } from "vitest";
import { computeCameraStagger } from "../hooks/useCameraStagger";

describe("computeCameraStagger", () => {
  it("returns the L56 default rhythm at 30fps", () => {
    const r = computeCameraStagger({}, 30);
    expect(r.cameraStart).toBe(0);
    expect(r.geometryStart).toBe(12); // 0.4s × 30fps
    expect(r.labelStart).toBe(24); //   0.8s × 30fps
  });

  it("respects narrationStartSec offset", () => {
    const r = computeCameraStagger({ narrationStartSec: 5 }, 30);
    expect(r.cameraStart).toBe(150); // 5.0s × 30fps
    expect(r.geometryStart).toBe(162); // 5.4s × 30fps
    expect(r.labelStart).toBe(174); //   5.8s × 30fps
  });

  it("respects custom geometry/label gaps for tighter pacing (urgent PACE)", () => {
    const r = computeCameraStagger(
      { geometryGapSec: 0.2, labelGapSec: 0.4 },
      30,
    );
    expect(r.geometryStart).toBe(6);
    expect(r.labelStart).toBe(12);
  });

  it("respects looser gaps for breathing pace", () => {
    const r = computeCameraStagger(
      { geometryGapSec: 0.6, labelGapSec: 1.2 },
      30,
    );
    expect(r.geometryStart).toBe(18);
    expect(r.labelStart).toBe(36);
  });

  it("scales correctly at 60fps", () => {
    const r = computeCameraStagger({}, 60);
    expect(r.cameraStart).toBe(0);
    expect(r.geometryStart).toBe(24); // 0.4s × 60fps
    expect(r.labelStart).toBe(48); //   0.8s × 60fps
  });

  it("rounds fractional frame computations to integers", () => {
    // 0.4s × 24fps = 9.6 → must round to nearest int (10)
    const r = computeCameraStagger({}, 24);
    expect(Number.isInteger(r.cameraStart)).toBe(true);
    expect(Number.isInteger(r.geometryStart)).toBe(true);
    expect(Number.isInteger(r.labelStart)).toBe(true);
    expect(r.geometryStart).toBe(10); // round(9.6)
  });

  it("preserves L56 invariant: cameraStart < geometryStart < labelStart", () => {
    const r = computeCameraStagger({ narrationStartSec: 12.7 }, 30);
    expect(r.cameraStart).toBeLessThan(r.geometryStart);
    expect(r.geometryStart).toBeLessThan(r.labelStart);
  });

  it("zero gaps collapse all three to the same frame (degenerate case)", () => {
    const r = computeCameraStagger(
      { geometryGapSec: 0, labelGapSec: 0 },
      30,
    );
    expect(r.cameraStart).toBe(r.geometryStart);
    expect(r.geometryStart).toBe(r.labelStart);
  });
});
