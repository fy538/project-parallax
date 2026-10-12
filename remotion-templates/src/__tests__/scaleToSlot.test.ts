import { describe, expect, it } from "vitest";
import { scaleDataToSlot } from "../utils/scaleToSlot";

describe("scaleDataToSlot", () => {
  const list = {
    durationSec: 12,
    title: "Three checks",
    axioms: [{ text: "one", atSec: 1.2 }, { text: "two", atSec: 3 }, { text: "three", atSec: 6 }],
    textFadeInSec: 0.6,
    _direction: { syncPoints: [{ word: "x", timeSec: 4, frame: 120 }] },
  };

  it("returns the same object when the slot is the authored length", () => {
    expect(scaleDataToSlot(list, 12)).toBe(list);
    expect(scaleDataToSlot(list, 12.05)).toBe(list);
  });

  it("scales start times with the slot and reports the real length", () => {
    const out = scaleDataToSlot(list, 9);
    expect(out.durationSec).toBe(9);
    expect(out.axioms.map((a) => a.atSec)).toEqual([0.9, 2.25, 4.5]);
    // How long a fade takes is not a start time; sync points are not typed times.
    expect(out.textFadeInSec).toBe(0.6);
    expect(out._direction).toBe(list._direction);
    // The authored data is untouched.
    expect(list.axioms[0].atSec).toBe(1.2);
  });

  it("scales nested arrays of times, narration-paced staggers and step holds", () => {
    const table = { durationSec: 20, rowAtSec: [[2, 3], [8, 9]], staggerSec: 3.3 };
    const out = scaleDataToSlot(table, 10);
    expect(out.rowAtSec).toEqual([[1, 1.5], [4, 4.5]]);
    expect(out.staggerSec).toBe(1.65);
    // A quick visual cascade is not paced by the voice.
    expect(scaleDataToSlot({ durationSec: 20, staggerSec: 0.15 }, 10).staggerSec).toBe(0.15);
    // No durationSec of its own: the manifest's authored length is the basis.
    const steps = { steps: [{ holdSec: 2.5 }, { holdSec: 3.5 }], crossfadeSec: 0.6 };
    const scaled = scaleDataToSlot(steps, 9, 12);
    expect(scaled.steps.map((s) => s.holdSec)).toEqual([1.875, 2.625]);
    expect(scaled.crossfadeSec).toBe(0.6);
    expect(scaleDataToSlot(steps, 9)).toBe(steps);
  });

  it("leaves the data alone when the two lengths cannot be the same shot", () => {
    expect(scaleDataToSlot(list, 30)).toBe(list);
    expect(scaleDataToSlot(list, 3)).toBe(list);
  });
});
