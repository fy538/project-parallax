/**
 * useNarratedCamera — unit tests for the extracted pure helpers.
 *
 * Covers the three pure functions that formerly lived inline inside the
 * hook's useMemo blocks:
 *   1. detectProportionalMode  — proportional vs absolute duration detection
 *   2. buildSyncLookup         — Whisper sync-point lookup builder
 *   3. buildNarratedCameraBoundaries — boundary construction with auto-fill
 *      and sync-anchor snapping (incl. squeeze-guard and overlap-prevention)
 *
 * Convention matches useBeatSync.test.ts / usePhase.test.ts: test the pure
 * functions directly without rendering a composition.
 */

import { describe, it, expect } from "vitest";
import {
  detectProportionalMode,
  buildSyncLookup,
  buildNarratedCameraBoundaries,
} from "../hooks/useNarratedCamera";
import type {
  NarratedCameraStep,
  SyncPoint,
} from "../hooks/useNarratedCamera";

// ── 1. detectProportionalMode ──────────────────────────────────────────────

describe("detectProportionalMode", () => {
  const step = (duration: number): NarratedCameraStep => ({
    target: "overview",
    zoom: 1,
    duration,
  });

  it("forceProportional=true wins over content", () => {
    // Durations sum to 12 (absolute-looking) but forceProportional overrides.
    expect(detectProportionalMode([step(3), step(4), step(5)], true)).toBe(true);
  });

  it("forceProportional=false wins over content", () => {
    // Durations sum to 1.0 (proportional-looking) but forceProportional overrides.
    expect(detectProportionalMode([step(0.4), step(0.6)], false)).toBe(false);
  });

  it("auto-detect: durations summing to ≤1.01 → proportional", () => {
    expect(detectProportionalMode([step(0.3), step(0.3), step(0.4)], undefined)).toBe(true);
  });

  it("auto-detect: float-rounding budget — total 1.005 still proportional", () => {
    // 1.005 ≤ 1.01 → proportional. Guards against fractions that don't sum
    // exactly to 1.0 due to author rounding.
    expect(detectProportionalMode([step(0.5), step(0.505)], undefined)).toBe(true);
  });

  it("auto-detect: total above 1.01 → absolute", () => {
    expect(detectProportionalMode([step(1), step(2), step(3)], undefined)).toBe(false);
  });

  it("auto-detect: exactly 1.02 → absolute (budget upper edge)", () => {
    expect(detectProportionalMode([step(0.51), step(0.51)], undefined)).toBe(false);
  });

  it("empty cameraPath → false", () => {
    expect(detectProportionalMode([], undefined)).toBe(false);
    // Even with forceProportional set, an empty path is a no-op shape:
    // forceProportional still wins because the function honours the override.
    expect(detectProportionalMode([], true)).toBe(true);
  });
});

// ── 2. buildSyncLookup ─────────────────────────────────────────────────────

describe("buildSyncLookup", () => {
  const sp = (word: string, frame: number): SyncPoint => ({
    word,
    timeSec: frame / 30,
    frame,
  });

  it("returns null when syncPoints is undefined", () => {
    expect(buildSyncLookup(undefined)).toBeNull();
  });

  it("returns null when syncPoints is empty", () => {
    expect(buildSyncLookup([])).toBeNull();
  });

  it("builds a lowercase-keyed lookup", () => {
    const lookup = buildSyncLookup([
      sp("Tokyo", 30),
      sp("BEIJING", 60),
      sp("seoul", 90),
    ]);
    expect(lookup).not.toBeNull();
    expect(lookup!.get("tokyo")).toBe(30);
    expect(lookup!.get("beijing")).toBe(60);
    expect(lookup!.get("seoul")).toBe(90);
    // Original-case keys must NOT be present (case-folded only).
    expect(lookup!.get("Tokyo")).toBeUndefined();
  });

  it("later occurrences of the same word win (last-write-wins)", () => {
    const lookup = buildSyncLookup([sp("again", 10), sp("again", 50)]);
    expect(lookup!.get("again")).toBe(50);
  });
});

// ── 3. buildNarratedCameraBoundaries ───────────────────────────────────────

describe("buildNarratedCameraBoundaries — basic construction", () => {
  const absoluteStep = (duration: number, syncStart?: string): NarratedCameraStep => ({
    target: "overview",
    zoom: 1,
    duration,
    syncStart,
  });

  it("absolute mode: durations in seconds → cumulative frame windows", () => {
    // 1s, 2s, 1.5s at 30fps = 30, 60, 45 frames cumulative
    const boundaries = buildNarratedCameraBoundaries(
      [absoluteStep(1), absoluteStep(2), absoluteStep(1.5)],
      300, // composition total
      false,
      null,
    );
    expect(boundaries[0]).toMatchObject({ start: 0, end: 30 });
    expect(boundaries[1]).toMatchObject({ start: 30, end: 90 });
    // Last step extends to durationInFrames via auto-fill (135 → 300).
    expect(boundaries[2]).toMatchObject({ start: 90, end: 300 });
  });

  it("proportional mode: fractions of total → multiplied by durationInFrames", () => {
    // 30%, 50%, 20% of 300 frames = 90, 150, 60 cumulative
    const boundaries = buildNarratedCameraBoundaries(
      [absoluteStep(0.3), absoluteStep(0.5), absoluteStep(0.2)],
      300,
      true,
      null,
    );
    expect(boundaries[0]).toMatchObject({ start: 0, end: 90 });
    expect(boundaries[1]).toMatchObject({ start: 90, end: 240 });
    expect(boundaries[2]).toMatchObject({ start: 240, end: 300 });
  });

  it("proportional mode: no auto-fill (already covers durationInFrames)", () => {
    const boundaries = buildNarratedCameraBoundaries(
      [absoluteStep(0.5), absoluteStep(0.5)],
      200,
      true,
      null,
    );
    // Last step ends at exactly durationInFrames in proportional mode;
    // auto-fill is gated to !isProportional so doesn't touch it.
    expect(boundaries[1].end).toBe(200);
  });
});

describe("buildNarratedCameraBoundaries — auto-fill", () => {
  it("absolute mode: extends last step to durationInFrames when path ends earlier", () => {
    const boundaries = buildNarratedCameraBoundaries(
      [
        { target: "overview", zoom: 1, duration: 1 },
        { target: "overview", zoom: 1, duration: 1 },
      ],
      300,
      false,
      null,
    );
    // 2 × 30 = 60 cumulative, but durationInFrames=300 → last extends.
    expect(boundaries[1].end).toBe(300);
  });

  it("absolute mode: does NOT shrink last step when path ALREADY exceeds duration", () => {
    const boundaries = buildNarratedCameraBoundaries(
      [{ target: "overview", zoom: 1, duration: 20 }], // 600 frames
      300,
      false,
      null,
    );
    // 600 > 300, auto-fill condition is `last.end < durationInFrames` only.
    // The path overruns; that's the author's choice.
    expect(boundaries[0].end).toBe(600);
  });

  it("empty cameraPath → empty boundaries (no auto-fill drama)", () => {
    expect(buildNarratedCameraBoundaries([], 300, false, null)).toEqual([]);
  });
});

describe("buildNarratedCameraBoundaries — sync-anchor snapping", () => {
  const sp = (word: string, frame: number): SyncPoint => ({
    word,
    timeSec: frame / 30,
    frame,
  });
  const cameraPath: NarratedCameraStep[] = [
    { target: "overview", zoom: 1, duration: 2 }, // 60f
    { target: "overview", zoom: 1.4, duration: 2, syncStart: "taiwan" }, // 60f
    { target: "overview", zoom: 1, duration: 2 }, // 60f
  ];

  it("snaps step's start to sync word's frame; adjusts previous step's end", () => {
    const syncLookup = buildSyncLookup([sp("taiwan", 75)]);
    const boundaries = buildNarratedCameraBoundaries(
      cameraPath,
      300,
      false,
      syncLookup,
    );
    // Step 1 starts at 75 (synced), step 0 ends at 75.
    expect(boundaries[0].end).toBe(75);
    expect(boundaries[1].start).toBe(75);
  });

  it("case-insensitive: 'TAIWAN' in syncStart still matches lowercase lookup", () => {
    const path: NarratedCameraStep[] = [
      { target: "overview", zoom: 1, duration: 2 },
      { target: "overview", zoom: 1, duration: 2, syncStart: "TAIWAN" },
    ];
    const syncLookup = buildSyncLookup([sp("taiwan", 50)]);
    const boundaries = buildNarratedCameraBoundaries(path, 200, false, syncLookup);
    expect(boundaries[1].start).toBe(50);
  });

  it("no sync word in lookup → step boundary untouched", () => {
    const syncLookup = buildSyncLookup([sp("japan", 100)]);
    const boundaries = buildNarratedCameraBoundaries(
      cameraPath,
      300,
      false,
      syncLookup,
    );
    // No "taiwan" entry → boundaries[1].start stays at the cumulative 60.
    expect(boundaries[1].start).toBe(60);
  });

  it("squeeze guard: sync collapses prev step → restore 0.5s minimum + push current", () => {
    // Snap "taiwan" to frame 0 → step 0 collapses to [0,0]. Guard kicks in:
    // step 0 gets sec(0.5) = 15 frames, step 1 start pushed to 15.
    const syncLookup = buildSyncLookup([sp("taiwan", 0)]);
    const boundaries = buildNarratedCameraBoundaries(
      cameraPath,
      300,
      false,
      syncLookup,
    );
    expect(boundaries[0].start).toBe(0);
    expect(boundaries[0].end).toBe(15); // sec(0.5) at 30fps
    expect(boundaries[1].start).toBe(15);
  });

  it("step-end-precedes-start guard: floors at `start` when next.start is below (degenerate over inverted)", () => {
    // Force step 1 to have start > end via a late sync. Step 2's natural
    // cumulative start (120) is BELOW step 1's snapped start (200), so the
    // Math.min(start+0.5s, next.start) inner clamp would have produced
    // end=120 — below start. The Math.max(start, …) floor accepts a
    // degenerate zero-width window over an inverted (end<start) boundary.
    //
    // Path: 60f, 60f, 60f. Sync "taiwan" → frame 200. Step 1.start=200.
    // Step 1.end was 120 → end <= start → extension fires →
    //   inner Math.min(200+15=215, next.start=120) = 120
    //   floor Math.max(200, 120) = 200
    // → boundaries[1] = { start: 200, end: 200 } (zero-width, valid).
    const syncLookup = buildSyncLookup([sp("taiwan", 200)]);
    const boundaries = buildNarratedCameraBoundaries(
      cameraPath,
      300,
      false,
      syncLookup,
    );
    expect(boundaries[1].start).toBe(200);
    expect(boundaries[1].end).toBe(200);
    // Invariant: end >= start always holds (regression lock).
    expect(boundaries[1].end).toBeGreaterThanOrEqual(boundaries[1].start);
  });

  it("step-end-precedes-start guard: last step has no `next` → uses durationInFrames", () => {
    // Use proportional mode to skip auto-fill — otherwise the last step's
    // .end would already equal durationInFrames before sync-snap fires, and
    // the end-extension branch on the LAST step would never see end < start.
    // Proportional [0.1, 0.1] of 300f → [{0,30},{30,60}]; no auto-fill.
    const path: NarratedCameraStep[] = [
      { target: "overview", zoom: 1, duration: 0.1 },
      { target: "overview", zoom: 1, duration: 0.1, syncStart: "late" },
    ];
    // Sync "late" to frame 150. Step 1.start=150. Step 1.end was 60.
    // 60 ≤ 150 → extend to min(150 + sec(0.5)=165, durationInFrames=300) = 165.
    const syncLookup = buildSyncLookup([sp("late", 150)]);
    const boundaries = buildNarratedCameraBoundaries(path, 300, true, syncLookup);
    expect(boundaries[1].start).toBe(150);
    expect(boundaries[1].end).toBe(165); // start + sec(0.5)
  });

  it("auto-fill happens BEFORE sync-snap (interaction lock)", () => {
    // Lock that the order of operations is: build → auto-fill → snap.
    // Snap on a last step that auto-fill already extended leaves end at
    // durationInFrames, not at start + 0.5s. This is the test the original
    // attempt hit unexpectedly; recording the actual behaviour here so future
    // refactors that swap the order will fail.
    const path: NarratedCameraStep[] = [
      { target: "overview", zoom: 1, duration: 2 },
      { target: "overview", zoom: 1, duration: 2, syncStart: "late" },
    ];
    const syncLookup = buildSyncLookup([sp("late", 150)]);
    const boundaries = buildNarratedCameraBoundaries(path, 300, false, syncLookup);
    // Step 1.end was 120 → auto-filled to 300 → sync sets start=150 → 300 > 150,
    // so end-extension branch DOES NOT fire and end stays at 300.
    expect(boundaries[1].start).toBe(150);
    expect(boundaries[1].end).toBe(300);
  });

  it("step 0 with syncStart: snaps step 0's start without prev-step adjustment", () => {
    const path: NarratedCameraStep[] = [
      { target: "overview", zoom: 1, duration: 2, syncStart: "intro" },
      { target: "overview", zoom: 1, duration: 2 },
    ];
    const syncLookup = buildSyncLookup([sp("intro", 25)]);
    const boundaries = buildNarratedCameraBoundaries(path, 300, false, syncLookup);
    // No prev step to adjust; step 0 just snaps.
    expect(boundaries[0].start).toBe(25);
    // Step 0 end was 60; 60 > 25 so the end-precedes-start branch doesn't fire.
    expect(boundaries[0].end).toBe(60);
  });
});

describe("buildNarratedCameraBoundaries — immutability", () => {
  it("returns cloned boundary objects (consumers can mutate without leaking)", () => {
    const boundaries = buildNarratedCameraBoundaries(
      [{ target: "overview", zoom: 1, duration: 2 }],
      300,
      false,
      null,
    );
    // Each call should produce fresh objects (the .map(b => ({...b})) clone).
    const second = buildNarratedCameraBoundaries(
      [{ target: "overview", zoom: 1, duration: 2 }],
      300,
      false,
      null,
    );
    expect(boundaries[0]).not.toBe(second[0]);
  });
});
