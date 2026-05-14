/**
 * MapInset — unit tests for position-resolution math.
 *
 * The component itself is exercised via the map-real-data PNG suite when
 * MAPBOX_ACCESS_TOKEN is set. This suite covers the pure helper that
 * decides where the inset lands — wrong corner math puts the inset on top
 * of the HeaderStrip or FooterStrip (or the TitleBlock, the May 13, 2026
 * collision discovery), which is the failure mode we most need to guard
 * against.
 *
 * Reference: components/MapInset.tsx
 */

import { describe, expect, it } from "vitest";
import { resolveInsetPosition } from "../components/MapInset";
import { titleHeight, layout as themeLayout } from "../design/theme";

const FRAME_W = 1920;
const FRAME_H = 1080;
const SIZE = 240;
const PADDING = 56;

// Title-clearance math: titleHeight.content (~180) + spacing.xl (~48) ≈ 228
// added to top-anchored positions when clearTitle=true (the default).
// Source: theme.ts titleHeight.content + layout.spacing.xl.
//
// We compute the actual expected value from the design tokens rather than
// hard-coding so the test stays accurate if those tokens are tuned later.
const titleAdjustedTop = (basePadding: number) =>
  basePadding + titleHeight.content + themeLayout.spacing.xl;

describe("resolveInsetPosition — title clearance (default)", () => {
  it("tl with default (clearTitle=true): drops below TitleBlock footprint", () => {
    const r = resolveInsetPosition("tl", SIZE, FRAME_W, FRAME_H, PADDING);
    expect(r.top).toBe(titleAdjustedTop(PADDING));
    expect(r.left).toBe(PADDING);
  });

  it("tr with default: same vertical drop, right edge intact", () => {
    const r = resolveInsetPosition("tr", SIZE, FRAME_W, FRAME_H, PADDING);
    expect(r.top).toBe(titleAdjustedTop(PADDING));
    expect(r.left).toBe(FRAME_W - SIZE - PADDING);
  });

  it("bl with default: bottom-anchored, no title adjustment", () => {
    const r = resolveInsetPosition("bl", SIZE, FRAME_W, FRAME_H, PADDING);
    expect(r).toEqual({ top: FRAME_H - SIZE - PADDING, left: PADDING });
  });

  it("br with default: bottom-anchored, no title adjustment", () => {
    const r = resolveInsetPosition("br", SIZE, FRAME_W, FRAME_H, PADDING);
    expect(r).toEqual({
      top: FRAME_H - SIZE - PADDING,
      left: FRAME_W - SIZE - PADDING,
    });
  });

  it("respects default padding when not given", () => {
    const r = resolveInsetPosition("tl", SIZE);
    // With clearTitle=true default, top is padding + title clearance.
    expect(r.top).toBe(titleAdjustedTop(56));
  });
});

describe("resolveInsetPosition — clearTitle=false (no top-anchored title)", () => {
  it("tl with clearTitle=false: padding from top-left corner (legacy behavior)", () => {
    const r = resolveInsetPosition("tl", SIZE, FRAME_W, FRAME_H, PADDING, false);
    expect(r).toEqual({ top: PADDING, left: PADDING });
  });

  it("tr with clearTitle=false: padding from top-right corner", () => {
    const r = resolveInsetPosition("tr", SIZE, FRAME_W, FRAME_H, PADDING, false);
    expect(r).toEqual({
      top: PADDING,
      left: FRAME_W - SIZE - PADDING,
    });
  });

  it("bl / br with clearTitle=false: unchanged from clearTitle=true", () => {
    const blDefault = resolveInsetPosition("bl", SIZE, FRAME_W, FRAME_H, PADDING);
    const blFalse = resolveInsetPosition("bl", SIZE, FRAME_W, FRAME_H, PADDING, false);
    expect(blDefault).toEqual(blFalse);
    const brDefault = resolveInsetPosition("br", SIZE, FRAME_W, FRAME_H, PADDING);
    const brFalse = resolveInsetPosition("br", SIZE, FRAME_W, FRAME_H, PADDING, false);
    expect(brDefault).toEqual(brFalse);
  });
});

describe("resolveInsetPosition — invariants", () => {
  it("respects custom size in corner calculations", () => {
    const r = resolveInsetPosition("br", 400, FRAME_W, FRAME_H, PADDING);
    expect(r).toEqual({
      top: FRAME_H - 400 - PADDING,
      left: FRAME_W - 400 - PADDING,
    });
  });

  it("respects custom padding", () => {
    const r = resolveInsetPosition("tl", SIZE, FRAME_W, FRAME_H, 100, false);
    expect(r).toEqual({ top: 100, left: 100 });
  });

  it("no corner collision with HeaderStrip / FooterStrip / TitleBlock at defaults", () => {
    // Brand chrome strips sit within ~50px of top/bottom. Default padding
    // of 56px keeps the inset outside the chrome zone.
    // ALSO new May 13, 2026 invariant: with clearTitle=true (default), tl
    // must sit BELOW the title's vertical footprint (~228px deep from top).
    const HEADER_BAND = 50;
    const FOOTER_BAND = 50;
    const tl = resolveInsetPosition("tl", SIZE, FRAME_W, FRAME_H, PADDING);
    const br = resolveInsetPosition("br", SIZE, FRAME_W, FRAME_H, PADDING);
    expect(tl.top).toBeGreaterThanOrEqual(HEADER_BAND);
    // Title-clearance regression guard: tl must clear the title block.
    expect(tl.top).toBeGreaterThan(200);
    expect(br.top + SIZE).toBeLessThanOrEqual(FRAME_H - FOOTER_BAND);
  });
});
