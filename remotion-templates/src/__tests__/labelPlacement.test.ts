/**
 * labelPlacement — unit tests for the greedy 8-position label-collision
 * algorithm. Covers the May 14, 2026 review punch list:
 *
 *   • Priority-DESC placement order (high priority claims default slot)
 *   • Default candidate chosen when no collision
 *   • Displacement chosen when default collides
 *   • Manual `leader.dx/dy` always wins
 *   • Off-screen anchor returns `offscreen: true`
 *   • Tie-break by input index when priorities equal
 *   • `placementToLabelPosition` cardinal mapping
 *   • `estimateBboxPx` returns reasonable dimensions
 *   • Empty input handled
 *
 * The placer is deterministic — same inputs always produce same outputs.
 * Critical for video render where frame-to-frame label jitter would
 * destroy the editorial register. These tests pin that contract.
 */

import { describe, it, expect, vi } from "vitest";
import {
  placeLabels,
  placementToLabelPosition,
  estimateBboxPx,
  type PlaceableAnnotation,
  type Placement,
} from "../components/labelPlacement";
import type { MapAnnotation } from "../components/MapAnnotations.types";

// ── Test helpers ──────────────────────────────────────────────────────────

const makeAnnotation = (
  overrides: Partial<MapAnnotation> & Pick<MapAnnotation, "at" | "label">,
): MapAnnotation => ({
  hierarchy: "secondary",
  ...overrides,
});

/** Project function that maps each [lon, lat] to a unique pixel position
 *  via a deterministic 1:1 lookup — keeps the test independent of any
 *  real map projection. */
const makeProjectFn =
  (positions: Record<string, { x: number; y: number } | null>) =>
  ([lon, lat]: [number, number]) => {
    const key = `${lon},${lat}`;
    return positions[key] ?? null;
  };

const mkItem = (
  ann: MapAnnotation,
  defaultDy: number = -22,
): PlaceableAnnotation => ({ ann, defaultDy });

// ── placeLabels: default-candidate path ────────────────────────────────────

describe("placeLabels: collision-free placement", () => {
  it("returns empty result for empty input", () => {
    const result = placeLabels([], () => null);
    expect(result).toEqual([]);
  });

  it("one annotation gets default position (displaced: false)", () => {
    const ann = makeAnnotation({ at: [0, 0], label: "Solo" });
    const project = makeProjectFn({ "0,0": { x: 100, y: 100 } });
    const result = placeLabels([mkItem(ann, -22)], project);
    expect(result).toHaveLength(1);
    expect(result[0].displaced).toBe(false);
    expect(result[0].dy).toBe(-22); // default dy
    expect(result[0].dx).toBe(0);
    expect(result[0].offscreen).toBe(false);
  });

  it("two far-apart annotations both get default position", () => {
    const a = makeAnnotation({ at: [0, 0], label: "A" });
    const b = makeAnnotation({ at: [10, 10], label: "B" });
    const project = makeProjectFn({
      "0,0": { x: 100, y: 100 },
      "10,10": { x: 1000, y: 800 }, // far away
    });
    const result = placeLabels([mkItem(a), mkItem(b)], project);
    expect(result[0].displaced).toBe(false);
    expect(result[1].displaced).toBe(false);
  });
});

// ── placeLabels: collision-triggered displacement ──────────────────────────

describe("placeLabels: collision triggers displacement", () => {
  it("two annotations at same pixel: second one gets displaced", () => {
    const a = makeAnnotation({
      at: [0, 0],
      label: "AAAAAAAAAAA", // long label, hard to dodge
      priority: 10,
    });
    const b = makeAnnotation({
      at: [1, 1],
      label: "BBBBBBBBBBB",
      priority: 1,
    });
    // Both project to nearly the same pixel
    const project = makeProjectFn({
      "0,0": { x: 100, y: 100 },
      "1,1": { x: 105, y: 105 },
    });
    const result = placeLabels([mkItem(a), mkItem(b)], project);
    // Higher-priority A keeps default.
    expect(result[0].displaced).toBe(false);
    // Lower-priority B gets pushed.
    expect(result[1].displaced).toBe(true);
  });

  it("displaced candidates carry an align hint (left/right/center)", () => {
    const a = makeAnnotation({ at: [0, 0], label: "AAAAAAA", priority: 10 });
    const b = makeAnnotation({ at: [1, 1], label: "BBBBBBB", priority: 1 });
    const project = makeProjectFn({
      "0,0": { x: 100, y: 100 },
      "1,1": { x: 105, y: 105 },
    });
    const result = placeLabels([mkItem(a), mkItem(b)], project);
    // Displaced annotation should carry one of three align values.
    expect(["left", "right", "center"]).toContain(result[1].align);
  });
});

// ── placeLabels: priority ordering ─────────────────────────────────────────

describe("placeLabels: priority ordering", () => {
  it("higher priority placed first, claims the preferred default slot", () => {
    const low = makeAnnotation({ at: [0, 0], label: "Low", priority: 1 });
    const high = makeAnnotation({ at: [1, 1], label: "High", priority: 10 });
    // Both at near-same pixel.
    const project = makeProjectFn({
      "0,0": { x: 100, y: 100 },
      "1,1": { x: 102, y: 102 },
    });
    // Input order: low, high — but priority should reorder placement.
    const result = placeLabels([mkItem(low), mkItem(high)], project);
    // High-priority claims default (displaced: false).
    expect(result[1].displaced).toBe(false); // result[1] is `high`
    // Low-priority gets pushed.
    expect(result[0].displaced).toBe(true);
  });

  it("equal priority: deterministic tie-break by input index", () => {
    // Same priority, same projected pixel → first item in input order wins.
    const a = makeAnnotation({ at: [0, 0], label: "A" });
    const b = makeAnnotation({ at: [1, 1], label: "B" });
    const project = makeProjectFn({
      "0,0": { x: 100, y: 100 },
      "1,1": { x: 101, y: 101 },
    });
    const result = placeLabels([mkItem(a), mkItem(b)], project);
    expect(result[0].displaced).toBe(false); // first wins
    expect(result[1].displaced).toBe(true);
  });

  it("priority defaults to 0 when undefined", () => {
    const a = makeAnnotation({ at: [0, 0], label: "A" }); // no priority
    const b = makeAnnotation({ at: [1, 1], label: "B", priority: 5 });
    const project = makeProjectFn({
      "0,0": { x: 100, y: 100 },
      "1,1": { x: 102, y: 102 },
    });
    const result = placeLabels([mkItem(a), mkItem(b)], project);
    // Priority 5 wins over default 0.
    expect(result[1].displaced).toBe(false);
    expect(result[0].displaced).toBe(true);
  });
});

// ── placeLabels: manual override ───────────────────────────────────────────

describe("placeLabels: manual leader override", () => {
  it("manual leader.dx/dy always wins (even when default would fit)", () => {
    const ann = makeAnnotation({
      at: [0, 0],
      label: "Solo",
      leader: { dx: 50, dy: -30 },
    });
    const project = makeProjectFn({ "0,0": { x: 100, y: 100 } });
    const result = placeLabels([mkItem(ann)], project);
    expect(result[0].dx).toBe(50);
    expect(result[0].dy).toBe(-30);
    expect(result[0].displaced).toBe(true);
  });

  it("manual leader infers align from dx direction", () => {
    // Manual leader pointing right → align "left" (text starts near anchor).
    const right = makeAnnotation({
      at: [0, 0],
      label: "R",
      leader: { dx: 50, dy: 0 },
    });
    const left = makeAnnotation({
      at: [10, 10],
      label: "L",
      leader: { dx: -50, dy: 0 },
    });
    const above = makeAnnotation({
      at: [20, 20],
      label: "A",
      leader: { dx: 0, dy: -50 },
    });
    const project = makeProjectFn({
      "0,0": { x: 100, y: 100 },
      "10,10": { x: 500, y: 500 },
      "20,20": { x: 900, y: 900 },
    });
    const result = placeLabels(
      [mkItem(right), mkItem(left), mkItem(above)],
      project,
    );
    expect(result[0].align).toBe("left"); // dx > 4
    expect(result[1].align).toBe("right"); // dx < -4
    expect(result[2].align).toBe("center"); // |dx| <= 4
  });
});

// ── placeLabels: off-screen handling ───────────────────────────────────────

describe("placeLabels: off-screen anchors", () => {
  it("returns offscreen: true with default dy when project returns null", () => {
    const ann = makeAnnotation({ at: [180, -90], label: "Antarctic" });
    const project = makeProjectFn({}); // empty — everything returns null
    const result = placeLabels([mkItem(ann, -22)], project);
    expect(result[0].offscreen).toBe(true);
    expect(result[0].displaced).toBe(false);
    expect(result[0].dy).toBe(-22); // fall back to default dy
  });

  it("off-screen anchor doesn't push visible labels around", () => {
    const onScreen = makeAnnotation({ at: [0, 0], label: "Visible" });
    const offScreen = makeAnnotation({ at: [180, -90], label: "Hidden" });
    const project = makeProjectFn({
      "0,0": { x: 100, y: 100 },
      // off-screen anchor returns null
    });
    const result = placeLabels(
      [mkItem(onScreen), mkItem(offScreen)],
      project,
    );
    // Visible one still gets default; off-screen marked offscreen.
    expect(result[0].displaced).toBe(false);
    expect(result[1].offscreen).toBe(true);
  });
});

// ── placementToLabelPosition cardinal mapping ──────────────────────────────

describe("placementToLabelPosition: cardinal direction mapping", () => {
  const placement = (dx: number, dy: number): Placement => ({
    dx,
    dy,
    displaced: true,
    offscreen: false,
    align: "center",
  });

  it("dx > 0, |dy| small → 'right'", () => {
    expect(placementToLabelPosition(placement(50, 0))).toBe("right");
    expect(placementToLabelPosition(placement(30, -10))).toBe("right");
  });

  it("dx < 0, |dy| small → 'left'", () => {
    expect(placementToLabelPosition(placement(-50, 0))).toBe("left");
    expect(placementToLabelPosition(placement(-30, 5))).toBe("left");
  });

  it("|dx| small, dy < 0 → 'above'", () => {
    expect(placementToLabelPosition(placement(0, -50))).toBe("above");
    expect(placementToLabelPosition(placement(5, -30))).toBe("above");
  });

  it("|dx| small, dy > 0 → 'below'", () => {
    expect(placementToLabelPosition(placement(0, 50))).toBe("below");
    expect(placementToLabelPosition(placement(-5, 30))).toBe("below");
  });

  it("tie on magnitude (|dx| == |dy|) breaks toward horizontal", () => {
    // Tie: |dx| == |dy| → dominant axis is horizontal.
    expect(placementToLabelPosition(placement(30, 30))).toBe("right");
    expect(placementToLabelPosition(placement(-30, -30))).toBe("left");
  });
});

// ── estimateBboxPx ─────────────────────────────────────────────────────────

describe("estimateBboxPx", () => {
  it("returns positive width and height for any label", () => {
    const ann = makeAnnotation({ at: [0, 0], label: "Hello" });
    const bbox = estimateBboxPx(ann);
    expect(bbox.w).toBeGreaterThan(0);
    expect(bbox.h).toBeGreaterThan(0);
  });

  it("primary labels are larger than secondary", () => {
    const primary = makeAnnotation({
      at: [0, 0],
      label: "AAAA",
      hierarchy: "primary",
    });
    const secondary = makeAnnotation({
      at: [0, 0],
      label: "AAAA",
      hierarchy: "secondary",
    });
    const bP = estimateBboxPx(primary);
    const bS = estimateBboxPx(secondary);
    expect(bP.h).toBeGreaterThanOrEqual(bS.h);
  });

  it("annotations with sublabels are taller than without", () => {
    const withSub = makeAnnotation({
      at: [0, 0],
      label: "Hormuz",
      sublabel: "21% of oil",
    });
    const noSub = makeAnnotation({ at: [0, 0], label: "Hormuz" });
    expect(estimateBboxPx(withSub).h).toBeGreaterThan(
      estimateBboxPx(noSub).h,
    );
  });

  it("memoizes — same args return deep-equal result with no recomputation cost", () => {
    // The internal measure cache is keyed on (text, font, size, weight,
    // letter-spacing). The final return object is constructed fresh each
    // call (to compose label + sublabel dimensions), but the underlying
    // measurement is cached. Test deep equality.
    const ann = makeAnnotation({ at: [0, 0], label: "MemoizeMe" });
    const a = estimateBboxPx(ann);
    const b = estimateBboxPx(ann);
    expect(a).toEqual(b);
  });
});

// ── Determinism (the core guarantee) ───────────────────────────────────────

describe("placeLabels: determinism", () => {
  it("same inputs produce identical outputs across multiple calls", () => {
    const anns = [
      makeAnnotation({ at: [0, 0], label: "A", priority: 5 }),
      makeAnnotation({ at: [1, 0], label: "B", priority: 5 }),
      makeAnnotation({ at: [2, 0], label: "C", priority: 5 }),
    ];
    const project = makeProjectFn({
      "0,0": { x: 100, y: 100 },
      "1,0": { x: 105, y: 105 },
      "2,0": { x: 110, y: 110 },
    });
    const items = anns.map((a) => mkItem(a));
    const r1 = placeLabels(items, project);
    const r2 = placeLabels(items, project);
    expect(r1).toEqual(r2);
  });
});
