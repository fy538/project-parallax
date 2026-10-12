/**
 * grammar.tsx — unit tests for the TransitionSeries grammar library.
 *
 * Pure-logic coverage for the token → presentation+timing mapping that
 * `GrammarTransitionSeries` and any sequential/showcase consumer relies on.
 * A regression here silently changes branded seams, so the mapping, the
 * deprecated-token resolution, the `cut`→null contract, and the duration math
 * are all locked down.
 */
import { describe, it, expect } from "vitest";
import {
  grammarTransition,
  resolveTransitionToken,
  matchCutZoom,
  dissolve,
  colorWash,
  fadeThrough,
} from "../transitions/grammar";
import { TRANSITION_CATALOG } from "../components/Transitions";

const FPS = 30;

describe("resolveTransitionToken", () => {
  it("passes canonical tokens through unchanged", () => {
    for (const t of ["cut", "fade", "dissolve", "color-wash", "iris", "match-cut", "match-cut-still"] as const) {
      expect(resolveTransitionToken(t)).toBe(t);
    }
  });

  it("collapses every deprecated token to its grammar replacement", () => {
    expect(resolveTransitionToken("wipe-left")).toBe("dissolve");
    expect(resolveTransitionToken("wipe-right")).toBe("dissolve");
    expect(resolveTransitionToken("wipe-up")).toBe("dissolve");
    expect(resolveTransitionToken("blur-through")).toBe("dissolve");
    expect(resolveTransitionToken("whip-pan")).toBe("cut");
    expect(resolveTransitionToken("spatial-zoom")).toBe("match-cut");
  });
});

describe("grammarTransition", () => {
  it("returns null for cut (no <Transition> node → hard cut)", () => {
    expect(grammarTransition("cut", { fps: FPS })).toBeNull();
  });

  it("resolves deprecated tokens to a working presentation (whip-pan → cut → null)", () => {
    expect(grammarTransition("whip-pan", { fps: FPS })).toBeNull();
    // wipe-left resolves to dissolve → non-null
    const wipe = grammarTransition("wipe-left", { fps: FPS });
    expect(wipe).not.toBeNull();
    expect(typeof wipe?.presentation.component).toBe("function");
  });

  it("produces a presentation + timing for every canonical non-cut token", () => {
    for (const t of ["fade", "dissolve", "color-wash", "iris", "match-cut", "match-cut-still"] as const) {
      const res = grammarTransition(t, { fps: FPS });
      expect(res, t).not.toBeNull();
      expect(typeof res?.presentation.component, t).toBe("function");
      expect(typeof res?.timing.getDurationInFrames, t).toBe("function");
    }
  });

  it("defaults each transition's duration to the grammar catalog value", () => {
    for (const t of ["fade", "dissolve", "color-wash", "iris", "match-cut"] as const) {
      const res = grammarTransition(t, { fps: FPS })!;
      const expected = Math.max(1, Math.round(TRANSITION_CATALOG[t].defaultDurationSec * FPS));
      expect(res.timing.getDurationInFrames({ fps: FPS }), t).toBe(expected);
    }
  });

  it("honours an explicit durationSec override", () => {
    const res = grammarTransition("dissolve", { fps: FPS, durationSec: 1 })!;
    expect(res.timing.getDurationInFrames({ fps: FPS })).toBe(30);
  });

  it("never returns a zero-or-negative duration", () => {
    const res = grammarTransition("dissolve", { fps: FPS, durationSec: 0.001 })!;
    expect(res.timing.getDurationInFrames({ fps: FPS })).toBeGreaterThanOrEqual(1);
  });
});

describe("presentation factories", () => {
  it("matchCutZoom defaults to a 1.15 scale (aligned with TransitionWrapper)", () => {
    expect(matchCutZoom().props.scale).toBeCloseTo(1.15);
    expect(matchCutZoom(1.3).props.scale).toBeCloseTo(1.3);
  });

  it("dissolve / fadeThrough / colorWash return a component + props", () => {
    expect(typeof dissolve().component).toBe("function");

    const black = fadeThrough();
    expect(typeof black.component).toBe("function");
    expect(black.props.peak).toBe(1);

    const wash = colorWash("#C4A747");
    expect(typeof wash.component).toBe("function");
    expect(wash.props.color).toBe("#C4A747");
    expect(wash.props.peak).toBeCloseTo(0.92);
  });
});
