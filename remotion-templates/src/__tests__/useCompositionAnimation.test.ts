/**
 * useCompositionAnimation — unit tests via Remotion hook mocking.
 *
 * This hook is the single highest blast-radius piece of code in the template
 * library: every template calls it exactly once, and its output (exitOpacity,
 * driftScale, driftX, style) gates POLISH.md rules A6 and A7. A regression
 * would silently break exit fades and Ken Burns motion across all 25+
 * templates simultaneously.
 *
 * Why mock useCurrentFrame / useVideoConfig: the hook is pure math on frame
 * index and composition dimensions. Mocking these two Remotion hooks lets us
 * drive the hook at arbitrary frames without running Remotion's full rendering
 * pipeline. This matches the established codebase pattern of testing pure
 * compute helpers directly (useBeatSync → computeBeatState, usePhase →
 * computePhaseState), adapted for a hook that doesn't have an extracted helper.
 *
 * COVERAGE:
 *   · Default config: enter, mid, exit frames — opacity, scale, drift
 *   · { noDrift: true }: no Ken Burns scale/translate/rotation in style
 *   · { noExit: true }: exitOpacity is always 1; style opacity stays at 1
 *   · { noDrift, noExit }: plain { opacity } only — no transform
 *   · Custom exitFrames / maxScale / maxPanX overrides
 *   · style.transform includes all three components when noDrift=false
 *   · Return shape has all required fields
 */

import { vi, describe, it, expect, beforeEach } from "vitest";

// ── Remotion mock ─────────────────────────────────────────────────────────────
// Must be hoisted before import of the hook — vi.mock is hoisted by Vitest.
// We keep the real `interpolate` and `Easing` (pure math, no browser APIs),
// and swap out only the two hooks that require a Remotion rendering context.

let _mockFrame = 0;
let _mockTotalFrames = 90;
const _mockFps = 30;

vi.mock("remotion", async () => {
  const actual = await vi.importActual<typeof import("remotion")>("remotion");
  return {
    ...actual,
    useCurrentFrame: () => _mockFrame,
    useVideoConfig: () => ({
      fps: _mockFps,
      durationInFrames: _mockTotalFrames,
      width: 1920,
      height: 1080,
      id: "test-comp",
    }),
  };
});

// Import AFTER vi.mock so the hoisted mock is active.
import { useCompositionAnimation } from "../hooks/useCompositionAnimation";

// ── Helpers ───────────────────────────────────────────────────────────────────

const sec = (s: number) => Math.round(s * _mockFps);

/** Drive the hook at a specific frame within a composition of given length. */
function atFrame(frame: number, totalFrames = 90, options = {}) {
  _mockFrame = frame;
  _mockTotalFrames = totalFrames;
  return useCompositionAnimation(options);
}

// ── Return shape ──────────────────────────────────────────────────────────────

describe("useCompositionAnimation — return shape", () => {
  it("returns all required fields", () => {
    const result = atFrame(0);
    expect(typeof result.frame).toBe("number");
    expect(typeof result.totalFrames).toBe("number");
    expect(typeof result.fps).toBe("number");
    expect(typeof result.exitOpacity).toBe("number");
    expect(typeof result.enterOpacity).toBe("number");
    expect(typeof result.driftScale).toBe("number");
    expect(typeof result.driftX).toBe("number");
    expect(typeof result.driftY).toBe("number");
    expect(typeof result.driftRotation).toBe("number");
    expect(typeof result.style).toBe("object");
  });

  it("frame and totalFrames echo the mocked values", () => {
    const result = atFrame(45, 90);
    expect(result.frame).toBe(45);
    expect(result.totalFrames).toBe(90);
    expect(result.fps).toBe(30);
  });
});

// ── Default config (enter + drift + exit all active) ─────────────────────────

describe("default config", () => {
  beforeEach(() => {
    _mockTotalFrames = 90;
  });

  describe("frame 0 — enter fade starts", () => {
    it("enterOpacity is 0 at frame 0", () => {
      const { enterOpacity } = atFrame(0);
      expect(enterOpacity).toBe(0);
    });

    it("exitOpacity is 1 at frame 0 (exit window not yet reached)", () => {
      const { exitOpacity } = atFrame(0);
      expect(exitOpacity).toBe(1);
    });

    it("driftScale is 1.0 at frame 0 (Ken Burns hasn't started)", () => {
      const { driftScale } = atFrame(0);
      expect(driftScale).toBe(1.0);
    });

    it("driftX and driftY are 0 at frame 0", () => {
      const { driftX, driftY } = atFrame(0);
      expect(driftX).toBe(0);
      expect(driftY).toBe(0);
    });

    it("style.opacity is 0 at frame 0 (enter opacity gates out)", () => {
      const { style } = atFrame(0);
      expect(style.opacity).toBe(0);
    });
  });

  describe("frame 30 — mid-composition", () => {
    it("enterOpacity is 1 (fully faded in by frame 8+)", () => {
      const { enterOpacity } = atFrame(30);
      expect(enterOpacity).toBe(1);
    });

    it("exitOpacity is 1 (exit window is last 15 frames, far away)", () => {
      const { exitOpacity } = atFrame(30);
      expect(exitOpacity).toBe(1);
    });

    it("driftScale is greater than 1.0 (Ken Burns has progressed)", () => {
      const { driftScale } = atFrame(30);
      expect(driftScale).toBeGreaterThan(1.0);
    });

    it("style.opacity is 1 (fully visible)", () => {
      const { style } = atFrame(30);
      expect(style.opacity).toBe(1);
    });

    it("style.transform includes scale, translate, rotate", () => {
      const { style } = atFrame(30);
      expect(style.transform).toMatch(/scale\(/);
      expect(style.transform).toMatch(/translate\(/);
      expect(style.transform).toMatch(/rotate\(/);
    });

    it("style.transformOrigin is 'center center'", () => {
      const { style } = atFrame(30);
      expect(style.transformOrigin).toBe("center center");
    });
  });

  describe("last frame — exit fade", () => {
    it("exitOpacity is 0 at totalFrames (fully faded out)", () => {
      const { exitOpacity } = atFrame(90);
      expect(exitOpacity).toBe(0);
    });

    it("style.opacity is 0 at the last frame", () => {
      const { style } = atFrame(90);
      expect(style.opacity).toBe(0);
    });

    it("exitOpacity is 1 before the exit window (frame totalFrames - exitFrames)", () => {
      // Default exitFrames=15, so exit starts at frame 75
      const { exitOpacity } = atFrame(74, 90);
      expect(exitOpacity).toBe(1);
    });

    it("exitOpacity is between 0 and 1 inside the exit window", () => {
      const { exitOpacity } = atFrame(83, 90);
      expect(exitOpacity).toBeGreaterThan(0);
      expect(exitOpacity).toBeLessThan(1);
    });

    it("driftScale has increased from frame 0 (Ken Burns at max)", () => {
      const { driftScale } = atFrame(90);
      // motionBudget.scale is the max; should be at or near it
      expect(driftScale).toBeGreaterThan(1.0);
    });
  });
});

// ── { noDrift: true } ─────────────────────────────────────────────────────────

describe("{ noDrift: true } — maps / interactive compositions", () => {
  it("driftScale is exactly 1.0 at any frame", () => {
    expect(atFrame(0, 90, { noDrift: true }).driftScale).toBe(1.0);
    expect(atFrame(45, 90, { noDrift: true }).driftScale).toBe(1.0);
    expect(atFrame(90, 90, { noDrift: true }).driftScale).toBe(1.0);
  });

  it("driftX is 0 at any frame", () => {
    expect(atFrame(45, 90, { noDrift: true }).driftX).toBe(0);
  });

  it("driftY is 0 at any frame", () => {
    expect(atFrame(45, 90, { noDrift: true }).driftY).toBe(0);
  });

  it("driftRotation is 0 at any frame", () => {
    expect(atFrame(45, 90, { noDrift: true }).driftRotation).toBe(0);
  });

  it("style has no transform property (undefined)", () => {
    const { style } = atFrame(45, 90, { noDrift: true });
    expect(style.transform).toBeUndefined();
  });

  it("style has no transformOrigin (no transform to anchor)", () => {
    const { style } = atFrame(45, 90, { noDrift: true });
    expect(style.transformOrigin).toBeUndefined();
  });

  it("style.opacity is still active (exit fade still applies)", () => {
    // At last frame, exit fade should still apply
    const { style } = atFrame(90, 90, { noDrift: true });
    expect(style.opacity).toBe(0);
  });
});

// ── { noExit: true } ─────────────────────────────────────────────────────────

describe("{ noExit: true } — compositions with their own exit", () => {
  it("exitOpacity is 1 at all frames", () => {
    expect(atFrame(0, 90, { noExit: true }).exitOpacity).toBe(1);
    expect(atFrame(80, 90, { noExit: true }).exitOpacity).toBe(1);
    expect(atFrame(90, 90, { noExit: true }).exitOpacity).toBe(1);
  });

  it("style.opacity at the last frame is 1 (not faded by exit)", () => {
    // Only enterOpacity affects opacity; at frame 30+ it's 1
    const { style } = atFrame(30, 90, { noExit: true });
    expect(style.opacity).toBe(1);
  });

  it("driftScale still applies (drift is independent of exit)", () => {
    const { driftScale } = atFrame(45, 90, { noExit: true });
    expect(driftScale).toBeGreaterThan(1.0);
  });
});

// ── { noDrift: true, noExit: true } ──────────────────────────────────────────

describe("{ noDrift: true, noExit: true } — fully static compositions", () => {
  it("style only contains opacity — no transform", () => {
    const { style } = atFrame(30, 90, { noDrift: true, noExit: true });
    expect(style.transform).toBeUndefined();
    expect(style.transformOrigin).toBeUndefined();
    expect(style.opacity).toBeDefined();
  });

  it("opacity at frame 30 is 1 (enter fade complete, exit fade disabled)", () => {
    const { style } = atFrame(30, 90, { noDrift: true, noExit: true });
    expect(style.opacity).toBe(1);
  });

  it("exitOpacity is always 1", () => {
    expect(atFrame(90, 90, { noDrift: true, noExit: true }).exitOpacity).toBe(1);
  });

  it("driftScale is always 1.0", () => {
    expect(atFrame(45, 90, { noDrift: true, noExit: true }).driftScale).toBe(1.0);
  });
});

// ── Custom options ────────────────────────────────────────────────────────────

describe("custom options", () => {
  it("custom exitFrames shifts the fade window", () => {
    // With exitFrames=30, exit starts at frame 60 (in a 90-frame comp)
    const { exitOpacity } = atFrame(60, 90, { exitFrames: 30 });
    // At frame 60 with 30-frame exit window, opacity should be 1 (just at start)
    expect(exitOpacity).toBeCloseTo(1, 2);

    // At frame 75 (midpoint of 30-frame window) opacity should be ~0.5
    const { exitOpacity: mid } = atFrame(75, 90, { exitFrames: 30 });
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
  });

  it("custom maxScale changes the Ken Burns endpoint", () => {
    const { driftScale } = atFrame(90, 90, { maxScale: 1.06 });
    expect(driftScale).toBeCloseTo(1.06, 4);
  });

  it("noDrift=false + maxScale=0 → driftScale still 1.0 (maxScale=0 means no zoom)", () => {
    // When maxScale=0, interpolate returns 0 at the end, not 1 — this is
    // intentional: callers who set maxScale=0 expect no zoom effect.
    // The key contract is that noDrift: false uses maxScale as the endpoint.
    const { driftScale } = atFrame(0, 90, { maxScale: 1.0 });
    expect(driftScale).toBe(1.0); // at frame 0, always 1.0
  });

  it("custom enterFrames — still at 0 at frame 0, 1 after enterFrames", () => {
    expect(atFrame(0, 90, { enterFrames: 20 }).enterOpacity).toBe(0);
    expect(atFrame(20, 90, { enterFrames: 20 }).enterOpacity).toBe(1);
  });
});

// ── Opacity product ───────────────────────────────────────────────────────────

describe("style.opacity is enterOpacity × exitOpacity", () => {
  it("mid-composition: enter=1, exit=1 → opacity=1", () => {
    const { style, enterOpacity, exitOpacity } = atFrame(30, 90);
    expect(style.opacity).toBeCloseTo(enterOpacity * exitOpacity, 6);
  });

  it("at frame 0: enter=0, exit=1 → opacity=0", () => {
    const { style, enterOpacity, exitOpacity } = atFrame(0, 90);
    expect(style.opacity).toBeCloseTo(enterOpacity * exitOpacity, 6);
  });

  it("at last frame: enter=1, exit=0 → opacity=0", () => {
    const { style, enterOpacity, exitOpacity } = atFrame(90, 90);
    expect(style.opacity).toBeCloseTo(enterOpacity * exitOpacity, 6);
  });
});

// ── DriftMode: four drift modes produce the documented motion ────────────────
//
// Locks the math contract of each DriftMode (see useCompositionAnimation.ts
// DriftMode type docs). Each mode is consumed by a `driftPreset` in
// useDirection.ts (editorial→linear, breathing→breathing, settle→settle,
// sway→sway, documentary→linear). A drift here regresses the entire
// editorial motion vocabulary across every template at once.
//
// Test strategy: drive the hook at known frames with non-zero max{Scale,
// PanX, PanY, Rotation} so the mode math is observable. (Editorial defaults
// for panX/panY/rotation are 0 — see motionBudget — which would zero out
// the assertions if we relied on defaults.)

describe("DriftMode: linear (default)", () => {
  const opts = {
    mode: "linear" as const,
    maxScale: 1.06,
    maxPanX: 18,
    maxPanY: 12,
    maxRotation: 0.5,
  };
  const TOTAL = 300; // 10s at 30fps — long enough for ease-in-out to register

  it("at frame 0: identity (scale=1, pan=0, rotation=0)", () => {
    const r = atFrame(0, TOTAL, opts);
    expect(r.driftScale).toBeCloseTo(1.0, 6);
    expect(r.driftX).toBeCloseTo(0, 6);
    expect(r.driftY).toBeCloseTo(0, 6);
    expect(r.driftRotation).toBeCloseTo(0, 6);
  });

  it("at frame=totalFrames: reaches max for all four axes", () => {
    const r = atFrame(TOTAL, TOTAL, opts);
    expect(r.driftScale).toBeCloseTo(1.06, 4);
    expect(r.driftX).toBeCloseTo(18, 4);
    expect(r.driftY).toBeCloseTo(12, 4);
    expect(r.driftRotation).toBeCloseTo(0.5, 4);
  });

  it("monotonically increases through the composition", () => {
    // ease-in-out is monotonic; sample a few intermediate frames
    const samples = [0, 60, 120, 180, 240, 300].map((f) => atFrame(f, TOTAL, opts));
    for (let i = 1; i < samples.length; i++) {
      expect(samples[i].driftScale).toBeGreaterThanOrEqual(samples[i - 1].driftScale);
      expect(samples[i].driftX).toBeGreaterThanOrEqual(samples[i - 1].driftX);
      expect(samples[i].driftY).toBeGreaterThanOrEqual(samples[i - 1].driftY);
      expect(samples[i].driftRotation).toBeGreaterThanOrEqual(samples[i - 1].driftRotation);
    }
  });

  it("at midpoint the value sits between 1.0 and maxScale (ease-in-out)", () => {
    const r = atFrame(TOTAL / 2, TOTAL, opts);
    expect(r.driftScale).toBeGreaterThan(1.0);
    expect(r.driftScale).toBeLessThan(1.06);
  });
});

describe("DriftMode: breathing", () => {
  const opts = {
    mode: "breathing" as const,
    maxScale: 1.04,
    // pan/rotation max should be ignored by the breathing branch — set
    // non-zero to prove they don't bleed through.
    maxPanX: 30,
    maxPanY: 30,
    maxRotation: 2,
  };
  // 12s @ 30fps = 360 frames — covers one full 8s breathing cycle + half.
  const TOTAL = 360;

  it("at frame 0: scale at rest (1.0) — starts at floor of oscillation", () => {
    const r = atFrame(0, TOTAL, opts);
    expect(r.driftScale).toBeCloseTo(1.0, 6);
  });

  it("at fps*4 (half period = 4s): scale at peak (maxScale)", () => {
    const r = atFrame(sec(4), TOTAL, opts);
    expect(r.driftScale).toBeCloseTo(1.04, 6);
  });

  it("at fps*8 (full period = 8s): scale back to rest (1.0)", () => {
    const r = atFrame(sec(8), TOTAL, opts);
    expect(r.driftScale).toBeCloseTo(1.0, 6);
  });

  it("at fps*2 (quarter period = 2s): scale at the midpoint of rise (~1.02)", () => {
    // (1 - cos(π/2)) / 2 = 0.5 → midpoint = 1.0 + (0.04 * 0.5) = 1.02
    const r = atFrame(sec(2), TOTAL, opts);
    expect(r.driftScale).toBeCloseTo(1.02, 6);
  });

  it("pan and rotation are zero at every sampled frame (breathing is scale-only)", () => {
    for (const f of [0, sec(1), sec(2), sec(4), sec(6), sec(8), sec(10)]) {
      const r = atFrame(f, TOTAL, opts);
      expect(r.driftX).toBe(0);
      expect(r.driftY).toBe(0);
      expect(r.driftRotation).toBe(0);
    }
  });
});

describe("DriftMode: settle", () => {
  const opts = {
    mode: "settle" as const,
    maxScale: 1.03,
    maxPanX: 30,
    maxPanY: 30,
    maxRotation: 2,
  };
  const TOTAL = 300; // 10s
  const settleEnd = Math.round(_mockFps * 0.6); // 18 frames

  it("at frame 0: scale starts at 1.0", () => {
    const r = atFrame(0, TOTAL, opts);
    expect(r.driftScale).toBeCloseTo(1.0, 6);
  });

  it("at frame=settleEnd: scale reaches maxScale", () => {
    const r = atFrame(settleEnd, TOTAL, opts);
    expect(r.driftScale).toBeCloseTo(1.03, 6);
  });

  it("at settleEnd + 30: scale HELD at maxScale (no continuous drift)", () => {
    const r = atFrame(settleEnd + 30, TOTAL, opts);
    expect(r.driftScale).toBeCloseTo(1.03, 6);
  });

  it("at totalFrames - 1: still HELD at maxScale", () => {
    const r = atFrame(TOTAL - 1, TOTAL, opts);
    expect(r.driftScale).toBeCloseTo(1.03, 6);
  });

  it("pan and rotation are zero at every sampled frame (settle is scale-only)", () => {
    for (const f of [0, settleEnd, settleEnd + 30, TOTAL - 1]) {
      const r = atFrame(f, TOTAL, opts);
      expect(r.driftX).toBe(0);
      expect(r.driftY).toBe(0);
      expect(r.driftRotation).toBe(0);
    }
  });
});

describe("DriftMode: sway", () => {
  const opts = {
    mode: "sway" as const,
    maxScale: 1.02,
    maxPanX: 12,
    maxPanY: 8,
    maxRotation: 2, // should be ignored by sway branch
  };
  const TOTAL = 360; // 12s — long enough to cover X period (6s) and Y period (9s)

  it("at frame 0: pan at center (sin(0) = 0)", () => {
    const r = atFrame(0, TOTAL, opts);
    expect(r.driftX).toBeCloseTo(0, 6);
    expect(r.driftY).toBeCloseTo(0, 6);
  });

  it("at fps*1.5 (1/4 of X period): driftX peaks at maxPanX/2", () => {
    // sin(2π * 1.5 / 6) = sin(π/2) = 1 → driftX = 1 * (12/2) = 6
    const r = atFrame(Math.round(_mockFps * 1.5), TOTAL, opts);
    expect(r.driftX).toBeCloseTo(opts.maxPanX / 2, 4);
  });

  it("at fps*3 (1/2 of X period): driftX returns to 0", () => {
    // sin(2π * 3 / 6) = sin(π) ≈ 0
    const r = atFrame(sec(3), TOTAL, opts);
    expect(r.driftX).toBeCloseTo(0, 4);
  });

  it("at fps*4.5 (3/4 of X period): driftX at negative peak (-maxPanX/2)", () => {
    // sin(2π * 4.5 / 6) = sin(3π/2) = -1
    const r = atFrame(Math.round(_mockFps * 4.5), TOTAL, opts);
    expect(r.driftX).toBeCloseTo(-opts.maxPanX / 2, 4);
  });

  it("at fps*2.25 (1/4 of Y period): driftY peaks at maxPanY/2", () => {
    // sin(2π * 2.25 / 9) = sin(π/2) = 1 → driftY = 1 * (8/2) = 4
    // Math.round(30*2.25)=68 (not 67.5), so the sin isn't exactly 1 — small
    // frame-quantization slop is expected at 30fps. Precision 2 is plenty.
    const r = atFrame(Math.round(_mockFps * 2.25), TOTAL, opts);
    expect(r.driftY).toBeCloseTo(opts.maxPanY / 2, 2);
  });

  it("driftScale is held at maxScale at every sampled frame", () => {
    for (const f of [0, sec(1), sec(3), sec(6), sec(9), sec(12)]) {
      const r = atFrame(f, TOTAL, opts);
      expect(r.driftScale).toBeCloseTo(opts.maxScale, 6);
    }
  });

  it("driftRotation stays at 0 (sway is pure pan, no rotation)", () => {
    for (const f of [0, sec(1.5), sec(3), sec(6)]) {
      const r = atFrame(f, TOTAL, opts);
      expect(r.driftRotation).toBe(0);
    }
  });
});

describe("DriftMode: noDrift overrides every mode", () => {
  const TOTAL = 300;
  const baseOpts = {
    maxScale: 1.06,
    maxPanX: 30,
    maxPanY: 30,
    maxRotation: 2,
    noDrift: true,
  };

  for (const mode of ["linear", "breathing", "settle", "sway"] as const) {
    it(`mode="${mode}" + noDrift: identity at all sampled frames`, () => {
      for (const f of [0, sec(2), sec(4), sec(6), TOTAL]) {
        const r = atFrame(f, TOTAL, { ...baseOpts, mode });
        expect(r.driftScale).toBe(1.0);
        expect(r.driftX).toBe(0);
        expect(r.driftY).toBe(0);
        expect(r.driftRotation).toBe(0);
      }
    });
  }
});
