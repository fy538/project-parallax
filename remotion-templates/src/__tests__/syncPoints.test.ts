import { describe, expect, it } from "vitest";
import { firstUnresolvedSyncWord, resolvedSyncPrefix } from "../utils/syncPoints";

const hit = (word: string, timeSec: number) => ({ word, timeSec, frame: Math.round(timeSec * 30), confidence: 1 });
const miss = (word: string) => ({ word, timeSec: null, frame: null, confidence: 0 });

describe("resolvedSyncPrefix", () => {
  it("passes every cue when all resolved", () => {
    const points = [hit("one", 1), hit("two", 2), hit("three", 3)];
    expect(resolvedSyncPrefix(points)).toEqual(points);
    expect(firstUnresolvedSyncWord(points)).toBeUndefined();
  });

  it("stops at the first unresolved cue so later cues keep their positions", () => {
    const points = [hit("one", 1), miss("two"), hit("three", 3)];
    // Cue 3 must not slide into position 1, where element 2 would use it.
    expect(resolvedSyncPrefix(points).map((p) => p.word)).toEqual(["one"]);
    expect(firstUnresolvedSyncWord(points)).toBe("two");
  });

  it("returns nothing when the first cue is unresolved, or there are none", () => {
    expect(resolvedSyncPrefix([miss("one"), hit("two", 2)])).toEqual([]);
    expect(resolvedSyncPrefix(undefined)).toEqual([]);
  });
});
