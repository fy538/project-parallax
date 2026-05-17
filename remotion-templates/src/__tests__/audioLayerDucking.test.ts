/**
 * audioLayerDucking.test.ts — unit tests for MusicBedLayer ducking logic.
 *
 * Tests the buildDuckingArray helper exported from AudioLayer.tsx.
 * The function is pure (no Remotion / DOM dependencies) so these run in
 * Node without a browser context.
 *
 * COVERAGE:
 *   · Empty timeline → flat 1.0 multiplier (no ducking applied)
 *   · TEMPLATE segments → multiplier stays at 1.0
 *   · FOOTAGE segments → multiplier rises to 1.65
 *   · HOLD segments → same lift as FOOTAGE (1.65)
 *   · IMAGE segments → smaller lift (1.35)
 *   · TRANSITION segments → small lift (1.20)
 *   · Smoothing: no discontinuous step at segment boundaries
 *   · Smoothing: value converges toward target after enough frames
 *   · Bed section wider than segment → default (1.0) outside segment
 *   · Multiple non-overlapping segments in one bed section
 *   · Zero-length bed → empty Float32Array (no crash)
 */

import { describe, it, expect } from "vitest";
import { buildDuckingArray } from "../components/AudioLayer";
import type { SegmentTimeline } from "../components/AudioLayer";

const FPS = 30;

// ── helpers ──────────────────────────────────────────────────────────────────

function makeSeg(
  startSec: number,
  endSec: number,
  type: SegmentTimeline["type"],
): SegmentTimeline {
  return { startSec, endSec, type };
}

/** Max absolute difference between consecutive samples. */
function maxStep(arr: Float32Array): number {
  let m = 0;
  for (let i = 1; i < arr.length; i++) {
    m = Math.max(m, Math.abs(arr[i] - arr[i - 1]));
  }
  return m;
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("buildDuckingArray", () => {
  it("returns flat 1.0 when timeline is empty", () => {
    const arr = buildDuckingArray([], 0, 5, FPS);
    expect(arr.length).toBe(5 * FPS);
    for (let i = 0; i < arr.length; i++) {
      expect(arr[i]).toBeCloseTo(1.0, 5);
    }
  });

  it("returns empty array for zero-length bed without crashing", () => {
    const arr = buildDuckingArray([makeSeg(0, 5, "FOOTAGE")], 5, 5, FPS);
    expect(arr.length).toBe(0);
  });

  it("TEMPLATE segment → multiplier stays at 1.0 throughout", () => {
    const arr = buildDuckingArray([makeSeg(0, 3, "TEMPLATE")], 0, 3, FPS);
    // After smoothing settles (skip first frame), all values should be ~1.0
    const midpoint = Math.floor(arr.length / 2);
    expect(arr[midpoint]).toBeCloseTo(1.0, 3);
    expect(arr[arr.length - 1]).toBeCloseTo(1.0, 3);
  });

  it("FOOTAGE segment → multiplier converges to 1.65", () => {
    // Give enough time for EMA to settle: ~2s at 30fps = 60 frames
    const arr = buildDuckingArray([makeSeg(0, 5, "FOOTAGE")], 0, 5, FPS);
    const settled = arr[arr.length - 1];
    expect(settled).toBeGreaterThan(1.60);
    expect(settled).toBeLessThanOrEqual(1.65 + 1e-4);
  });

  it("HOLD segment → same lift as FOOTAGE (1.65)", () => {
    const footage = buildDuckingArray([makeSeg(0, 5, "FOOTAGE")], 0, 5, FPS);
    const hold    = buildDuckingArray([makeSeg(0, 5, "HOLD")],    0, 5, FPS);
    expect(footage[footage.length - 1]).toBeCloseTo(hold[hold.length - 1], 5);
  });

  it("IMAGE segment → converges to 1.35", () => {
    const arr = buildDuckingArray([makeSeg(0, 5, "IMAGE")], 0, 5, FPS);
    expect(arr[arr.length - 1]).toBeGreaterThan(1.30);
    expect(arr[arr.length - 1]).toBeLessThanOrEqual(1.35 + 1e-4);
  });

  it("TRANSITION segment → converges to 1.20", () => {
    const arr = buildDuckingArray([makeSeg(0, 5, "TRANSITION")], 0, 5, FPS);
    expect(arr[arr.length - 1]).toBeGreaterThan(1.15);
    expect(arr[arr.length - 1]).toBeLessThanOrEqual(1.20 + 1e-4);
  });

  it("smoothing: no discontinuous step at segment boundaries", () => {
    // TEMPLATE for first 3s, then FOOTAGE for next 3s
    const arr = buildDuckingArray(
      [makeSeg(0, 3, "TEMPLATE"), makeSeg(3, 6, "FOOTAGE")],
      0, 6, FPS,
    );
    // Maximum frame-to-frame step must be well below the raw jump (1.65 - 1.0 = 0.65)
    // With EMA smoothing the step at any single frame should be < 0.05
    expect(maxStep(arr)).toBeLessThan(0.05);
  });

  it("smoothing: value is strictly rising after FOOTAGE segment begins", () => {
    const arr = buildDuckingArray(
      [makeSeg(0, 1, "TEMPLATE"), makeSeg(1, 4, "FOOTAGE")],
      0, 4, FPS,
    );
    const transitionStart = 1 * FPS; // frame where FOOTAGE begins
    // After the transition starts, values should be monotonically non-decreasing
    // for at least the first second (before any subsequent segment changes)
    for (let f = transitionStart; f < transitionStart + FPS - 1; f++) {
      expect(arr[f + 1]).toBeGreaterThanOrEqual(arr[f] - 1e-6);
    }
  });

  it("region outside any segment defaults to TEMPLATE (1.0)", () => {
    // Segment covers only 2–4s; bed is 0–6s
    const arr = buildDuckingArray([makeSeg(2, 4, "FOOTAGE")], 0, 6, FPS);
    // At frame 0 (well before segment) value should be 1.0
    expect(arr[0]).toBeCloseTo(1.0, 5);
    // After FOOTAGE ends and 2s of TEMPLATE have elapsed, smoothed value
    // should have returned close to 1.0 — tighter bound than just "<1.65"
    // (at 30fps, 2s = 60 frames; EMA α^60 ≈ 0.96^60 ≈ 0.09, so residual
    // above 1.0 is roughly (1.65-1.0)*0.09 ≈ 0.06 → expect < 1.10)
    expect(arr[arr.length - 1]).toBeLessThan(1.10);
    expect(arr[arr.length - 1]).toBeGreaterThanOrEqual(1.0 - 1e-4);
  });

  it("handles two non-overlapping segments with a gap between them", () => {
    const arr = buildDuckingArray(
      [makeSeg(0, 2, "FOOTAGE"), makeSeg(4, 6, "FOOTAGE")],
      0, 6, FPS,
    );
    // In the gap (2–4s) the raw value is TEMPLATE (1.0), so smoothed value
    // should dip back toward 1.0
    const gapMid = Math.round(3 * FPS);
    expect(arr[gapMid]).toBeLessThan(1.65);
    // Both ends should be elevated toward 1.65
    expect(arr[arr.length - 1]).toBeGreaterThan(1.50);
  });

  it("bed section offset from episode start: uses bed-local frame coordinates", () => {
    // Bed starts at 100s, segment starts at 102s (relative frame 60 at 30fps)
    const arr = buildDuckingArray([makeSeg(102, 107, "FOOTAGE")], 100, 110, FPS);
    // Frame 0 (= 100s) is before the segment → default 1.0
    expect(arr[0]).toBeCloseTo(1.0, 5);
    // Frame 180 (= 106s, mid-segment) should be elevated
    expect(arr[6 * FPS]).toBeGreaterThan(1.50);
  });

  // ── G3: segment starting before bedStartSec (left-edge partial overlap) ──

  it("segment starting before bedStartSec is clamped to frame 0", () => {
    // Segment runs from -2s to 3s; bed runs from 0s to 6s.
    // The lo clamp (Math.max(0, ...)) should apply FOOTAGE from frame 0.
    const arr = buildDuckingArray([makeSeg(-2, 3, "FOOTAGE")], 0, 6, FPS);
    // Frame 0 should already be FOOTAGE-level (no leading TEMPLATE gap)
    expect(arr[0]).toBeCloseTo(1.65, 2); // raw[0] = 1.65, smoothed[0] = raw[0]
    // Midpoint of the segment (1.5s = frame 45) should be settled at 1.65
    expect(arr[Math.round(1.5 * FPS)]).toBeGreaterThan(1.60);
  });

  // ── G4: overlapping segments — last segment in iteration order wins ────────

  it("overlapping segments: last writer wins (documented last-write-wins behaviour)", () => {
    // FOOTAGE from 0–4s overlaps with TEMPLATE from 2–6s.
    // The fill loop processes in array order, so TEMPLATE overwrites frames 60–180.
    const arr = buildDuckingArray(
      [makeSeg(0, 4, "FOOTAGE"), makeSeg(2, 6, "TEMPLATE")],
      0, 6, FPS,
    );
    // Frames 0–1s: only FOOTAGE → elevated
    expect(arr[1 * FPS]).toBeGreaterThan(1.40);
    // Frames 3–6s: TEMPLATE wins the overlap → should trend back toward 1.0
    expect(arr[5 * FPS]).toBeLessThan(1.30);
  });

  it("overlapping segments: first writer wins when order is reversed", () => {
    // Same ranges, reversed order: TEMPLATE written first, then FOOTAGE overwrites
    const arr = buildDuckingArray(
      [makeSeg(2, 6, "TEMPLATE"), makeSeg(0, 4, "FOOTAGE")],
      0, 6, FPS,
    );
    // Frames 3–4s: FOOTAGE overwrote TEMPLATE → should be elevated
    expect(arr[Math.round(3.5 * FPS)]).toBeGreaterThan(1.40);
    // Frames 5–6s: only TEMPLATE (FOOTAGE ends at 4s) → trending toward 1.0
    expect(arr[Math.round(5.5 * FPS)]).toBeLessThan(1.50);
  });
});
