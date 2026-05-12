/**
 * MapAnnotations — unit tests for schema + pure helpers.
 *
 * Visual rendering is exercised separately under map-real-data.test.ts (gated
 * on MAPBOX_ACCESS_TOKEN). This suite covers the schema contract and the
 * pure timing/color/alignment resolution helpers — fast, no browser required.
 *
 * Reference: references/template-research/map-annotations.md
 */

import { describe, expect, it } from "vitest";
import {
  MapAnnotationSchema,
  MapAnnotationListSchema,
} from "../components/MapAnnotations.types";
import {
  resolveTiming,
  resolveColor,
  resolveAlign,
} from "../components/MapAnnotations";
import { palette } from "../design/theme";

// ── Schema ────────────────────────────────────────────────────────────────

describe("MapAnnotationSchema", () => {
  it("accepts a minimal valid annotation", () => {
    expect(() =>
      MapAnnotationSchema.parse({
        at: [12.5, 41.9],
        label: "Rome",
        hierarchy: "secondary",
      }),
    ).not.toThrow();
  });

  it("accepts a fully-specified annotation", () => {
    expect(() =>
      MapAnnotationSchema.parse({
        at: [120.99, 24.78],
        label: "TAIWAN",
        sublabel: "Source: TSMC",
        hierarchy: "primary",
        leader: { dx: 60, dy: -40 },
        align: "right",
        emphasis: "accent",
        phase: 2,
      }),
    ).not.toThrow();
  });

  it("rejects unknown hierarchy", () => {
    expect(() =>
      MapAnnotationSchema.parse({
        at: [0, 0],
        label: "x",
        hierarchy: "tertiaryish",
      }),
    ).toThrow();
  });

  it("rejects non-tuple coordinates", () => {
    expect(() =>
      MapAnnotationSchema.parse({
        at: [0, 0, 0],
        label: "x",
        hierarchy: "primary",
      }),
    ).toThrow();
  });

  it("rejects empty label", () => {
    expect(() =>
      MapAnnotationSchema.parse({
        at: [0, 0],
        label: "",
        hierarchy: "primary",
      }),
    ).toThrow();
  });

  it("list schema validates an array of annotations", () => {
    expect(() =>
      MapAnnotationListSchema.parse([
        { at: [0, 0], label: "A", hierarchy: "primary" },
        { at: [10, 10], label: "B", hierarchy: "tertiary" },
      ]),
    ).not.toThrow();
  });
});

// ── resolveTiming ─────────────────────────────────────────────────────────

describe("resolveTiming", () => {
  const phaseWindows = [
    { startSec: 0, endSec: 4 },
    { startSec: 4, endSec: 9 },
    { startSec: 9, endSec: 14 },
  ];

  it("uses explicit appearAtSec/exitAtSec when given (wins over phase)", () => {
    const r = resolveTiming(
      {
        at: [0, 0],
        label: "x",
        hierarchy: "primary",
        appearAtSec: 2,
        exitAtSec: 10,
        phase: 2, // ignored because explicit times present
      },
      phaseWindows,
      14,
    );
    expect(r).toEqual({ startSec: 2, endSec: 10 });
  });

  it("resolves phase shorthand against phaseWindows", () => {
    const r = resolveTiming(
      { at: [0, 0], label: "x", hierarchy: "primary", phase: 1 },
      phaseWindows,
      14,
    );
    expect(r).toEqual({ startSec: 4, endSec: 9 });
  });

  it("falls back to whole composition when no timing given", () => {
    const r = resolveTiming(
      { at: [0, 0], label: "x", hierarchy: "primary" },
      phaseWindows,
      14,
    );
    expect(r).toEqual({ startSec: 0, endSec: 14 });
  });

  it("ignores phase shorthand when phaseWindows omitted", () => {
    const r = resolveTiming(
      { at: [0, 0], label: "x", hierarchy: "primary", phase: 1 },
      undefined,
      14,
    );
    expect(r).toEqual({ startSec: 0, endSec: 14 });
  });

  it("ignores out-of-range phase index", () => {
    const r = resolveTiming(
      { at: [0, 0], label: "x", hierarchy: "primary", phase: 99 },
      phaseWindows,
      14,
    );
    expect(r).toEqual({ startSec: 0, endSec: 14 });
  });

  it("supports appearAtSec without exitAtSec (default to composition end)", () => {
    const r = resolveTiming(
      { at: [0, 0], label: "x", hierarchy: "primary", appearAtSec: 3 },
      phaseWindows,
      14,
    );
    expect(r).toEqual({ startSec: 3, endSec: 14 });
  });
});

// ── resolveColor ──────────────────────────────────────────────────────────

describe("resolveColor", () => {
  it("accent wins regardless of hierarchy or theme", () => {
    expect(resolveColor("primary", "accent", false)).toBe(palette.rust);
    expect(resolveColor("tertiary", "accent", true)).toBe(palette.rust);
  });

  it("mute returns taupe", () => {
    expect(resolveColor("primary", "mute", false)).toBe(palette.taupe);
  });

  it("tertiary is taupe by default regardless of mode", () => {
    expect(resolveColor("tertiary", "default", false)).toBe(palette.taupe);
    expect(resolveColor("tertiary", undefined, true)).toBe(palette.taupe);
  });

  it("primary/secondary use ink on light, bone on dark", () => {
    expect(resolveColor("primary", "default", false)).toBe(palette.ink);
    expect(resolveColor("primary", "default", true)).toBe(palette.bone);
    expect(resolveColor("secondary", undefined, false)).toBe(palette.ink);
    expect(resolveColor("secondary", undefined, true)).toBe(palette.bone);
  });
});

// ── resolveAlign ──────────────────────────────────────────────────────────

describe("resolveAlign", () => {
  it("explicit align wins", () => {
    expect(
      resolveAlign({
        at: [0, 0],
        label: "x",
        hierarchy: "primary",
        align: "left",
        leader: { dx: 50, dy: 0 },
      }),
    ).toBe("left");
  });

  it("infers right when leader points right (dx > 4)", () => {
    expect(
      resolveAlign({
        at: [0, 0],
        label: "x",
        hierarchy: "primary",
        leader: { dx: 30, dy: 0 },
      }),
    ).toBe("right");
  });

  it("infers left when leader points left (dx < -4)", () => {
    expect(
      resolveAlign({
        at: [0, 0],
        label: "x",
        hierarchy: "primary",
        leader: { dx: -30, dy: 0 },
      }),
    ).toBe("left");
  });

  it("infers center for vertical leaders (|dx| <= 4)", () => {
    expect(
      resolveAlign({
        at: [0, 0],
        label: "x",
        hierarchy: "primary",
        leader: { dx: 0, dy: -40 },
      }),
    ).toBe("center");
    expect(
      resolveAlign({
        at: [0, 0],
        label: "x",
        hierarchy: "primary",
        leader: { dx: 3, dy: 40 },
      }),
    ).toBe("center");
  });

  it("defaults to center when no leader given", () => {
    expect(
      resolveAlign({ at: [0, 0], label: "x", hierarchy: "primary" }),
    ).toBe("center");
  });
});
