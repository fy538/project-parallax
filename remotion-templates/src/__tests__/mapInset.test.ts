/**
 * MapInset — unit tests for position-resolution math.
 *
 * The component itself is exercised via the map-real-data PNG suite when
 * MAPBOX_ACCESS_TOKEN is set. This suite covers the pure helper that
 * decides where the inset lands — wrong corner math puts the inset on top
 * of the HeaderStrip or FooterStrip, which is the failure mode we most
 * need to guard against.
 *
 * Reference: components/MapInset.tsx
 */

import { describe, expect, it } from "vitest";
import { resolveInsetPosition } from "../components/MapInset";

const FRAME_W = 1920;
const FRAME_H = 1080;
const SIZE = 240;
const PADDING = 56;

describe("resolveInsetPosition", () => {
  it("tl: padding from top-left corner", () => {
    const r = resolveInsetPosition("tl", SIZE, FRAME_W, FRAME_H, PADDING);
    expect(r).toEqual({ top: PADDING, left: PADDING });
  });

  it("tr: padding from top-right corner", () => {
    const r = resolveInsetPosition("tr", SIZE, FRAME_W, FRAME_H, PADDING);
    expect(r).toEqual({
      top: PADDING,
      left: FRAME_W - SIZE - PADDING, // 1920 - 240 - 56 = 1624
    });
    expect(r.left).toBe(1624);
  });

  it("bl: padding from bottom-left corner", () => {
    const r = resolveInsetPosition("bl", SIZE, FRAME_W, FRAME_H, PADDING);
    expect(r).toEqual({
      top: FRAME_H - SIZE - PADDING, // 1080 - 240 - 56 = 784
      left: PADDING,
    });
    expect(r.top).toBe(784);
  });

  it("br: padding from bottom-right corner", () => {
    const r = resolveInsetPosition("br", SIZE, FRAME_W, FRAME_H, PADDING);
    expect(r).toEqual({
      top: FRAME_H - SIZE - PADDING,
      left: FRAME_W - SIZE - PADDING,
    });
  });

  it("respects default padding when not given", () => {
    const r = resolveInsetPosition("tl", SIZE);
    expect(r.top).toBe(56); // matches SAFE_PADDING in component
  });

  it("respects custom size in corner calculations", () => {
    const r = resolveInsetPosition("br", 400, FRAME_W, FRAME_H, PADDING);
    expect(r).toEqual({
      top: FRAME_H - 400 - PADDING, // 624
      left: FRAME_W - 400 - PADDING, // 1464
    });
  });

  it("respects custom padding", () => {
    const r = resolveInsetPosition("tl", SIZE, FRAME_W, FRAME_H, 100);
    expect(r).toEqual({ top: 100, left: 100 });
  });

  it("no corner collision with HeaderStrip-band at top or FooterStrip-band at bottom for default padding", () => {
    // The brand chrome strips sit within ~50px of top/bottom (per HeaderStrip
    // / FooterStrip safeAreaTier). Default padding of 56px keeps the inset
    // outside the chrome zone. This is the most important invariant — if
    // padding ever drops below the chrome height, inset will collide.
    const HEADER_BAND = 50;
    const FOOTER_BAND = 50;
    const tl = resolveInsetPosition("tl", SIZE, FRAME_W, FRAME_H, PADDING);
    const br = resolveInsetPosition("br", SIZE, FRAME_W, FRAME_H, PADDING);
    expect(tl.top).toBeGreaterThanOrEqual(HEADER_BAND);
    expect(br.top + SIZE).toBeLessThanOrEqual(FRAME_H - FOOTER_BAND);
  });
});
