/**
 * cinematicCamera — unit tests for the bezier easing, dwell windows, and
 * via-globe pose interpolation added in P2 #8.
 *
 * Reference: src/utils/mapUtils.ts
 */

import { describe, expect, it } from "vitest";
import {
  cubicBezier1D,
  applyDwell,
  viaGlobePoseInterpolate,
  easeCameraT,
} from "../utils/mapUtils";

// ── cubicBezier1D ─────────────────────────────────────────────────────────

describe("cubicBezier1D", () => {
  it("returns 0 at t=0 regardless of control points", () => {
    expect(cubicBezier1D(0.65, 0.35, 0)).toBe(0);
    expect(cubicBezier1D(0, 1, 0)).toBe(0);
    expect(cubicBezier1D(-1, 2, 0)).toBe(0);
  });

  it("returns 1 at t=1 regardless of control points", () => {
    expect(cubicBezier1D(0.65, 0.35, 1)).toBeCloseTo(1, 5);
    expect(cubicBezier1D(0, 1, 1)).toBeCloseTo(1, 5);
  });

  it("is monotonic for canonical easing curves", () => {
    // Cinematic snap: (0.65, 0.35) — should be monotonic over [0, 1].
    let prev = -Infinity;
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const v = cubicBezier1D(0.65, 0.35, t);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });

  it("produces smooth-ease for (0, 1) control points (cubic in/out shape)", () => {
    // The "smooth ease-in-out" curve from the dossier — value should be
    // exactly 0.5 at t=0.5 (symmetric).
    expect(cubicBezier1D(0, 1, 0.5)).toBeCloseTo(0.5, 5);
  });
});

// ── applyDwell ─────────────────────────────────────────────────────────────

describe("applyDwell", () => {
  it("returns 0 during the leading dwell", () => {
    expect(applyDwell(0, 0.2, 0)).toBe(0);
    expect(applyDwell(0.1, 0.2, 0)).toBe(0);
    expect(applyDwell(0.19, 0.2, 0)).toBe(0);
  });

  it("returns 1 during the trailing dwell", () => {
    expect(applyDwell(0.9, 0, 0.2)).toBe(1);
    expect(applyDwell(0.85, 0, 0.2)).toBe(1);
    expect(applyDwell(1, 0, 0.2)).toBe(1);
  });

  it("remaps the motion window linearly to [0, 1]", () => {
    // 20% leading + 20% trailing → motion window = [0.2, 0.8] = 60% of t.
    // At t=0.5 (midpoint), motion is at (0.5 - 0.2) / 0.6 = 0.5.
    expect(applyDwell(0.5, 0.2, 0.2)).toBeCloseTo(0.5, 5);
    // At t=0.2 (start of motion), motion is at 0.
    expect(applyDwell(0.2, 0.2, 0.2)).toBeCloseTo(0, 5);
    // At t=0.8 (end of motion), motion is at 1.
    expect(applyDwell(0.8, 0.2, 0.2)).toBeCloseTo(1, 5);
  });

  it("returns t unchanged when no dwell is configured", () => {
    expect(applyDwell(0.42, 0, 0)).toBeCloseTo(0.42, 5);
  });

  it("handles degenerate case (total dwell >= 1)", () => {
    // All dwell → snap to 0 in first half, 1 in second.
    expect(applyDwell(0.3, 0.6, 0.5)).toBe(0);
    expect(applyDwell(0.7, 0.6, 0.5)).toBe(1);
  });
});

// ── viaGlobePoseInterpolate ────────────────────────────────────────────────

describe("viaGlobePoseInterpolate", () => {
  const a = { scale: 4.0, translate: [400, 200] as [number, number] };
  const b = { scale: 4.0, translate: [-400, 200] as [number, number] };

  it("returns a.scale at t=0 and b.scale at t=1", () => {
    const at0 = viaGlobePoseInterpolate(a, b, 0);
    const at1 = viaGlobePoseInterpolate(a, b, 1);
    expect(at0.scale).toBeCloseTo(a.scale, 5);
    expect(at1.scale).toBeCloseTo(b.scale, 5);
  });

  it("pulls scale UNDER the smaller of a.scale/b.scale at midpoint", () => {
    // pullbackFactor default 0.6 → midpoint scale ≈ min(a, b) * 0.6
    // (Bezier minimum is approximate, not exactly midpoint, but close).
    const mid = viaGlobePoseInterpolate(a, b, 0.5);
    expect(mid.scale).toBeLessThan(Math.min(a.scale, b.scale));
    expect(mid.scale).toBeGreaterThan(0);
  });

  it("interpolates translate linearly (no curve)", () => {
    const mid = viaGlobePoseInterpolate(a, b, 0.5);
    expect(mid.translate[0]).toBeCloseTo(0, 5);   // midpoint of 400 → -400
    expect(mid.translate[1]).toBeCloseTo(200, 5); // unchanged
  });

  it("respects custom pullbackFactor", () => {
    const aggressive = viaGlobePoseInterpolate(a, b, 0.5, 0.2);
    const gentle = viaGlobePoseInterpolate(a, b, 0.5, 0.9);
    expect(aggressive.scale).toBeLessThan(gentle.scale);
  });
});

// ── easeCameraT ────────────────────────────────────────────────────────────

describe("easeCameraT", () => {
  it("linear returns t unchanged", () => {
    expect(easeCameraT(0.3, "linear")).toBe(0.3);
    expect(easeCameraT(0.7, "linear")).toBe(0.7);
  });

  it("cinematic differs from linear at off-midpoint values", () => {
    // The (0.65, 0.35) bezier is symmetric around (0.5, 0.5), so the
    // midpoint COINCIDES with linear. Off-midpoint values are where the
    // S-curve shape differs from linear.
    expect(easeCameraT(0.5, "cinematic")).toBeCloseTo(0.5, 5);
    // At t=0.25: cinematic > linear (curve rises faster early).
    // Hand-calculated: 3*(0.75)^2*0.25*0.65 + 3*0.75*(0.25)^2*0.35 + (0.25)^3 ≈ 0.339
    expect(easeCameraT(0.25, "cinematic")).toBeCloseTo(0.339, 2);
    expect(easeCameraT(0.25, "cinematic")).toBeGreaterThan(0.25);
    // And at t=0.75: cinematic < linear (curve flattens late by symmetry).
    expect(easeCameraT(0.75, "cinematic")).toBeLessThan(0.75);
  });

  it("via-globe uses the same time-easing as cinematic", () => {
    // The pose curve differs; the time curve is the same Bezier.
    expect(easeCameraT(0.42, "via-globe")).toBeCloseTo(
      easeCameraT(0.42, "cinematic"),
      5,
    );
  });

  it("preserves boundary conditions at 0 and 1 for all transitions", () => {
    for (const transition of ["linear", "cinematic", "via-globe"] as const) {
      expect(easeCameraT(0, transition)).toBeCloseTo(0, 5);
      expect(easeCameraT(1, transition)).toBeCloseTo(1, 5);
    }
  });
});
