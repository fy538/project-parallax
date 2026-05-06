/**
 * useBeatSync — unit tests for the pure compute helper.
 *
 * The hook itself is a thin wrapper around `computeBeatState` that handles
 * Remotion's `useCurrentFrame()` and useMemo'd marker normalization. The
 * load-bearing math (lastBeatIndex walk, exponential decay, on-beat window,
 * empty-marker neutral state) lives in `computeBeatState`. These tests
 * lock that math against the contract so future refactors can't silently
 * change beat-sync behavior across the 9 templates that consume it.
 *
 * Why no React/hook test: extracting the pure function lets us test the
 * math directly without mocking useCurrentFrame, rendering a composition,
 * or pulling in @testing-library/react.
 */

import { describe, expect, it } from "vitest";
import { computeBeatState } from "../hooks/useBeatSync";

describe("computeBeatState", () => {
  describe("empty markers — neutral state", () => {
    it("returns neutral state with zero pulse", () => {
      const state = computeBeatState(60, [], 7.5);
      expect(state.pulse).toBe(0);
      expect(state.isOnBeat).toBe(false);
      expect(state.framesSinceLastBeat).toBe(Infinity);
      expect(state.framesUntilNextBeat).toBe(-1);
      expect(state.lastBeatIndex).toBe(-1);
      expect(state.currentIntensity).toBe(0);
      expect(state.currentBeatType).toBeUndefined();
    });

    it("returns neutral regardless of frame", () => {
      const earlyState = computeBeatState(0, [], 7.5);
      const lateState = computeBeatState(10000, [], 7.5);
      expect(earlyState).toEqual(lateState);
    });
  });

  describe("before any beat", () => {
    it("pulse is zero, lastBeatIndex is -1, framesUntilNextBeat counts down", () => {
      const beats = [{ frame: 30, intensity: 1.0 }];
      const state = computeBeatState(10, beats, 7.5);
      expect(state.pulse).toBe(0);
      expect(state.lastBeatIndex).toBe(-1);
      expect(state.framesSinceLastBeat).toBe(Infinity);
      expect(state.framesUntilNextBeat).toBe(20);
      expect(state.isOnBeat).toBe(false);
    });
  });

  describe("at exactly the beat frame", () => {
    it("pulse equals intensity, lastBeatIndex points at the beat, isOnBeat true", () => {
      const beats = [{ frame: 30, intensity: 1.0 }];
      const state = computeBeatState(30, beats, 7.5);
      expect(state.pulse).toBeCloseTo(1.0, 5);
      expect(state.framesSinceLastBeat).toBe(0);
      expect(state.lastBeatIndex).toBe(0);
      expect(state.isOnBeat).toBe(true);
      expect(state.currentIntensity).toBe(1.0);
    });

    it("respects intensity scaling", () => {
      const beats = [{ frame: 30, intensity: 0.5 }];
      const state = computeBeatState(30, beats, 7.5);
      expect(state.pulse).toBeCloseTo(0.5, 5);
      expect(state.currentIntensity).toBe(0.5);
    });
  });

  describe("exponential pulse decay", () => {
    const beats = [{ frame: 30, intensity: 1.0 }];

    it("decays from 1.0 at the beat to ~0.37 (1/e) one decay-window later", () => {
      const decayFrames = 10;
      const state = computeBeatState(30 + decayFrames, beats, decayFrames);
      // exp(-1) ≈ 0.3679
      expect(state.pulse).toBeCloseTo(Math.exp(-1), 4);
    });

    it("is monotonically decreasing across the decay window", () => {
      const decayFrames = 10;
      const at0 = computeBeatState(30, beats, decayFrames).pulse;
      const at5 = computeBeatState(35, beats, decayFrames).pulse;
      const at10 = computeBeatState(40, beats, decayFrames).pulse;
      const at20 = computeBeatState(50, beats, decayFrames).pulse;
      expect(at0).toBeGreaterThan(at5);
      expect(at5).toBeGreaterThan(at10);
      expect(at10).toBeGreaterThan(at20);
    });

    it("cuts off to exactly 0 past 3× decay window (avoids tail budget)", () => {
      const decayFrames = 10;
      const state = computeBeatState(30 + 3 * decayFrames + 1, beats, decayFrames);
      expect(state.pulse).toBe(0);
    });
  });

  describe("on-beat window", () => {
    const beats = [{ frame: 30, intensity: 1.0 }];

    it("isOnBeat true within default 3-frame window", () => {
      expect(computeBeatState(30, beats, 7.5).isOnBeat).toBe(true);
      expect(computeBeatState(31, beats, 7.5).isOnBeat).toBe(true);
      expect(computeBeatState(33, beats, 7.5).isOnBeat).toBe(true);
    });

    it("isOnBeat false past the window", () => {
      expect(computeBeatState(34, beats, 7.5).isOnBeat).toBe(false);
    });

    it("custom beatWindowFrames overrides the default", () => {
      expect(computeBeatState(35, beats, 7.5, 10).isOnBeat).toBe(true);
      expect(computeBeatState(41, beats, 7.5, 10).isOnBeat).toBe(false);
    });
  });

  describe("multi-beat sequence", () => {
    const beats = [
      { frame: 30, intensity: 1.0 },
      { frame: 60, intensity: 0.7, type: "accent" },
      { frame: 90, intensity: 1.0, type: "drop" },
    ];

    it("lastBeatIndex advances through the sequence", () => {
      expect(computeBeatState(0, beats, 7.5).lastBeatIndex).toBe(-1);
      expect(computeBeatState(45, beats, 7.5).lastBeatIndex).toBe(0);
      expect(computeBeatState(75, beats, 7.5).lastBeatIndex).toBe(1);
      expect(computeBeatState(120, beats, 7.5).lastBeatIndex).toBe(2);
    });

    it("framesUntilNextBeat counts down to the next, returns -1 after final", () => {
      expect(computeBeatState(45, beats, 7.5).framesUntilNextBeat).toBe(15);
      expect(computeBeatState(75, beats, 7.5).framesUntilNextBeat).toBe(15);
      expect(computeBeatState(120, beats, 7.5).framesUntilNextBeat).toBe(-1);
    });

    it("currentBeatType reflects the last-fired beat", () => {
      expect(computeBeatState(75, beats, 7.5).currentBeatType).toBe("accent");
      expect(computeBeatState(120, beats, 7.5).currentBeatType).toBe("drop");
    });

    it("intensity follows the most recent beat", () => {
      expect(computeBeatState(60, beats, 7.5).currentIntensity).toBe(0.7);
      expect(computeBeatState(90, beats, 7.5).currentIntensity).toBe(1.0);
    });
  });

  describe("edge cases", () => {
    it("identical-frame beats: lastBeatIndex picks the last in array", () => {
      const beats = [
        { frame: 30, intensity: 1.0 },
        { frame: 30, intensity: 0.5 },
      ];
      const state = computeBeatState(30, beats, 7.5);
      expect(state.lastBeatIndex).toBe(1);
      expect(state.currentIntensity).toBe(0.5);
    });

    it("negative frame (composition pre-roll) returns pre-beat state", () => {
      const beats = [{ frame: 30, intensity: 1.0 }];
      const state = computeBeatState(-5, beats, 7.5);
      expect(state.lastBeatIndex).toBe(-1);
      expect(state.framesUntilNextBeat).toBe(35);
    });
  });
});
