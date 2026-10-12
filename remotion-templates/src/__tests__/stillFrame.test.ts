import { describe, expect, it } from "vitest";
import { clampFraming, framingAt, framingTransform } from "../components/StillFrame";

describe("StillFrame framing", () => {
  it("shows the whole image at zoom 1, wherever the centre was asked for", () => {
    expect(clampFraming({ cx: 0.2, cy: 0.9, zoom: 1 })).toEqual({ cx: 0.5, cy: 0.5, zoom: 1 });
    expect(framingTransform({ cx: 0.5, cy: 0.5, zoom: 1 }, 1920, 1080)).toBe("translate(0px, 0px) scale(1)");
  });

  it("never frames past an edge of the image", () => {
    const f = clampFraming({ cx: 0.05, cy: 0.98, zoom: 2 });
    expect(f.cx).toBeCloseTo(0.25);
    expect(f.cy).toBeCloseTo(0.75);
    // Left edge of the image at the left edge of the frame, bottom at the bottom.
    expect(framingTransform(f, 1920, 1080)).toBe("translate(0px, -1080px) scale(2)");
  });

  it("moves in a straight line by default and comes to rest with settle", () => {
    const move = { from: { cx: 0.5, cy: 0.5, zoom: 1.5 }, to: { cx: 0.6, cy: 0.5, zoom: 1.5 } };
    expect(framingAt(move, 0.5).cx).toBeCloseTo(0.55);
    const settle = framingAt({ ...move, ease: "settle" }, 0.5).cx;
    expect(settle).toBeGreaterThan(0.55); // further along early, slowing at the end
    expect(framingAt({ ...move, ease: "settle" }, 1).cx).toBeCloseTo(0.6);
  });
});
