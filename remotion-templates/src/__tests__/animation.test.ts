/**
 * animation.ts — unit tests for shared animation utilities.
 *
 * All functions here are pure math (wrapping Remotion's interpolate/spring).
 * A regression breaks every template that calls these utilities, since they
 * are used across DataChart, TimeSeriesChart, KineticTypography, and more.
 *
 * COVERAGE:
 *   · Constants: KEN_BURNS_MAX_SCALE, PAN_DRIFT_MAX_OFFSET, EXIT_FADE_DURATION
 *   · CLAMP / CLAMP_CUBIC / CLAMP_QUAD_INOUT config objects
 *   · fadeIn / fadeOut / fadeInOut — opacity envelope helpers
 *   · kenBurnsDrift / panDrift / exitFade — composition lifecycle motion
 *   · stagger / layerDelay — sequence timing
 *   · anticipatoryStartFrame / anticipatoryReveal — Economist 150ms rule
 *   · slideIn / scaleIn — entrance motion
 *   · pulse / lockOnPulse — emphasis post-entrance
 *   · pathDraw — SVG stroke animation
 *   · cubicBezier / focusPull — advanced camera math (tested indirectly)
 *   · cameraShake — deterministic noise via Remotion random()
 *
 * NOT tested here:
 *   · morphPath / morphPathAnimated — geometry-heavy; covered in catalog smoke
 *   · lerpColor / colorRamp — interpolateColors is Remotion internals
 *   · heroSpring / microSettle / gentleSpring — spring output is timing-
 *     sensitive; covered implicitly by visual regression tests
 */

import { describe, it, expect } from "vitest";
import {
  CLAMP,
  CLAMP_CUBIC,
  CLAMP_QUAD_INOUT,
  KEN_BURNS_MAX_SCALE,
  PAN_DRIFT_MAX_OFFSET,
  EXIT_FADE_DURATION,
  ANTICIPATE_FRAMES_DEFAULT,
  fadeIn,
  fadeOut,
  fadeInOut,
  kenBurnsDrift,
  panDrift,
  exitFade,
  stagger,
  layerDelay,
  anticipatoryStartFrame,
  anticipatoryReveal,
  slideIn,
  scaleIn,
  pulse,
  lockOnPulse,
  pathDraw,
  gridlineDraw,
  bloomIntensity,
  cameraShake,
} from "../utils/animation";

// ── Constants ─────────────────────────────────────────────────────────────────

describe("animation constants", () => {
  it("KEN_BURNS_MAX_SCALE is 1.02 (POLISH.md A6)", () => {
    // If this changes, every composition that calls kenBurnsDrift / panDrift
    // without explicit maxScale will silently zoom more or less.
    expect(KEN_BURNS_MAX_SCALE).toBe(1.02);
  });

  it("PAN_DRIFT_MAX_OFFSET is 8 (POLISH.md A6)", () => {
    expect(PAN_DRIFT_MAX_OFFSET).toBe(8);
  });

  it("EXIT_FADE_DURATION is 15 (POLISH.md A7)", () => {
    expect(EXIT_FADE_DURATION).toBe(15);
  });

  it("ANTICIPATE_FRAMES_DEFAULT is 5 (150ms at 30fps)", () => {
    // 150ms / (1000ms/30fps) = 4.5 → rounds to 5
    expect(ANTICIPATE_FRAMES_DEFAULT).toBe(5);
  });

  it("CLAMP has extrapolateLeft and extrapolateRight set to 'clamp'", () => {
    expect(CLAMP.extrapolateLeft).toBe("clamp");
    expect(CLAMP.extrapolateRight).toBe("clamp");
  });

  it("CLAMP_CUBIC has easing function", () => {
    expect(typeof CLAMP_CUBIC.easing).toBe("function");
  });

  it("CLAMP_QUAD_INOUT has easing function", () => {
    expect(typeof CLAMP_QUAD_INOUT.easing).toBe("function");
  });
});

// ── fadeIn ────────────────────────────────────────────────────────────────────

describe("fadeIn", () => {
  it("returns 0 before startFrame", () => {
    expect(fadeIn(0, 10)).toBe(0);
    expect(fadeIn(9, 10)).toBe(0);
  });

  it("returns 1 at and after the fade end", () => {
    // Default duration is durations.fadeIn (12 frames @ 30fps)
    const duration = 12;
    expect(fadeIn(10 + duration, 10, duration)).toBe(1);
    expect(fadeIn(100, 10, duration)).toBe(1);
  });

  it("is strictly increasing from startFrame to startFrame+duration", () => {
    const values = [0, 2, 4, 6, 8, 10, 12].map((f) => fadeIn(f, 0, 12));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });

  it("default startFrame is 0", () => {
    expect(fadeIn(0)).toBe(0);
    expect(fadeIn(100)).toBe(1);
  });

  it("supports non-zero startFrame", () => {
    expect(fadeIn(5, 5, 10)).toBe(0); // at startFrame → 0
    expect(fadeIn(15, 5, 10)).toBe(1); // at end → 1
  });
});

// ── fadeOut ───────────────────────────────────────────────────────────────────

describe("fadeOut", () => {
  it("returns 1 well before the fade", () => {
    expect(fadeOut(0, 100, 12)).toBe(1);
    expect(fadeOut(87, 100, 12)).toBe(1);
  });

  it("returns 0 at and after endFrame", () => {
    expect(fadeOut(100, 100, 12)).toBe(0);
    expect(fadeOut(200, 100, 12)).toBe(0);
  });

  it("is strictly decreasing through the fade window", () => {
    const end = 30;
    const duration = 12;
    const values = [18, 20, 22, 24, 26, 28, 30].map((f) => fadeOut(f, end, duration));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
    }
  });
});

// ── fadeInOut ─────────────────────────────────────────────────────────────────

describe("fadeInOut", () => {
  it("is 0 before startFrame", () => {
    expect(fadeInOut(0, 10, 30, 6)).toBe(0);
  });

  it("reaches ~1 in the visible middle", () => {
    const v = fadeInOut(25, 10, 30, 6); // mid-visible
    expect(v).toBeGreaterThan(0.9);
  });

  it("returns 0 after startFrame+visibleDuration", () => {
    expect(fadeInOut(50, 10, 30, 6)).toBe(0);
  });
});

// ── kenBurnsDrift ─────────────────────────────────────────────────────────────

describe("kenBurnsDrift", () => {
  it("starts at exactly 1.0 at frame 0", () => {
    expect(kenBurnsDrift(0, 90)).toBe(1.0);
  });

  it("ends at maxScale at the last frame (default KEN_BURNS_MAX_SCALE)", () => {
    expect(kenBurnsDrift(90, 90)).toBeCloseTo(KEN_BURNS_MAX_SCALE, 5);
  });

  it("is monotonically non-decreasing", () => {
    const total = 60;
    const values = [0, 10, 20, 30, 40, 50, 60].map((f) => kenBurnsDrift(f, total));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });

  it("respects custom maxScale", () => {
    expect(kenBurnsDrift(90, 90, 1.05)).toBeCloseTo(1.05, 5);
  });

  it("stays in [1.0, maxScale] throughout", () => {
    const total = 90;
    for (let f = 0; f <= total; f += 5) {
      const v = kenBurnsDrift(f, total);
      expect(v).toBeGreaterThanOrEqual(1.0);
      expect(v).toBeLessThanOrEqual(KEN_BURNS_MAX_SCALE + 0.001);
    }
  });
});

// ── panDrift ──────────────────────────────────────────────────────────────────

describe("panDrift", () => {
  it("starts at 0 at frame 0", () => {
    expect(panDrift(0, 90)).toBe(0);
  });

  it("ends at maxOffset at the last frame (default PAN_DRIFT_MAX_OFFSET)", () => {
    expect(panDrift(90, 90)).toBeCloseTo(PAN_DRIFT_MAX_OFFSET, 5);
  });

  it("stays in [0, maxOffset] throughout", () => {
    const total = 90;
    for (let f = 0; f <= total; f += 5) {
      const v = panDrift(f, total);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(PAN_DRIFT_MAX_OFFSET + 0.001);
    }
  });
});

// ── exitFade ──────────────────────────────────────────────────────────────────

describe("exitFade", () => {
  it("returns 1 well before the exit window", () => {
    expect(exitFade(0, 90)).toBe(1);
    expect(exitFade(74, 90)).toBe(1);
  });

  it("returns 0 at the final frame", () => {
    expect(exitFade(90, 90)).toBe(0);
  });

  it("is strictly decreasing through the exit window", () => {
    const total = 90;
    const duration = EXIT_FADE_DURATION;
    const start = total - duration;
    const values = [start, start + 4, start + 8, start + 12, total].map(
      (f) => exitFade(f, total, duration)
    );
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
    }
  });

  it("respects custom exit duration", () => {
    const total = 60;
    const customDuration = 20;
    expect(exitFade(40, total, customDuration)).toBeCloseTo(1, 4); // at window start → 1
    expect(exitFade(60, total, customDuration)).toBe(0);           // at end → 0
  });
});

// ── stagger ───────────────────────────────────────────────────────────────────

describe("stagger", () => {
  it("index 0 returns baseDelay (default 0)", () => {
    expect(stagger(0)).toBe(0);
    expect(stagger(0, 8, 10)).toBe(10);
  });

  it("increments by delayPerItem per index", () => {
    expect(stagger(1, 8)).toBe(8);
    expect(stagger(2, 8)).toBe(16);
    expect(stagger(5, 10)).toBe(50);
  });

  it("adds baseDelay to all entries", () => {
    expect(stagger(0, 8, 5)).toBe(5);
    expect(stagger(1, 8, 5)).toBe(13);
  });
});

// ── layerDelay ────────────────────────────────────────────────────────────────

describe("layerDelay", () => {
  it("layer 0 returns baseDelay (structure first)", () => {
    expect(layerDelay(0)).toBe(0);
    expect(layerDelay(0, 10)).toBe(10);
  });

  it("layer 1 returns baseDelay + layerGap (data after structure)", () => {
    expect(layerDelay(1)).toBe(12);
    expect(layerDelay(1, 0, 10)).toBe(10);
  });

  it("layer 2 returns baseDelay + 2×layerGap (labels last)", () => {
    expect(layerDelay(2)).toBe(24);
    expect(layerDelay(2, 0, 10)).toBe(20);
  });

  it("respects custom baseDelay and layerGap", () => {
    expect(layerDelay(1, 5, 15)).toBe(20);
    expect(layerDelay(2, 5, 15)).toBe(35);
  });
});

// ── anticipatoryStartFrame ────────────────────────────────────────────────────

describe("anticipatoryStartFrame", () => {
  it("element starts before the narration cue by settleFrames+anticipateFrames", () => {
    // Narrator says word at frame 126 (4.2s @30fps)
    // Default settle = 12 frames, anticipate = 5 frames
    const start = anticipatoryStartFrame(126);
    expect(start).toBe(126 - 5 - 12); // 109
  });

  it("can be configured with custom settle and anticipate", () => {
    const start = anticipatoryStartFrame(90, 6, 3);
    expect(start).toBe(90 - 3 - 6); // 81
  });
});

// ── anticipatoryReveal ────────────────────────────────────────────────────────

describe("anticipatoryReveal", () => {
  it("returns 0 before the entrance starts", () => {
    // Cue at 126, settle=12, anticipate=5 → start=109
    expect(anticipatoryReveal(0, 126)).toBe(0);
    expect(anticipatoryReveal(108, 126)).toBe(0);
  });

  it("reaches 1 by the anticipation point (before the cue)", () => {
    // Should be ≥1 at the settle-end point (cue - anticipate = 121)
    const v = anticipatoryReveal(121, 126);
    expect(v).toBeCloseTo(1, 4);
  });

  it("holds at 1 after the cue frame", () => {
    expect(anticipatoryReveal(130, 126)).toBe(1);
    expect(anticipatoryReveal(200, 126)).toBe(1);
  });
});

// ── slideIn ───────────────────────────────────────────────────────────────────

describe("slideIn", () => {
  it("returns full distance before startFrame", () => {
    expect(slideIn(0, 10, 40, 12)).toBe(40);
  });

  it("returns 0 at and after the slide completes", () => {
    expect(slideIn(22, 10, 40, 12)).toBe(0);
    expect(slideIn(100, 10, 40, 12)).toBe(0);
  });

  it("is strictly decreasing from startFrame to startFrame+duration", () => {
    const values = [10, 13, 16, 19, 22].map((f) => slideIn(f, 10, 40, 12));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThanOrEqual(values[i - 1]);
    }
  });
});

// ── scaleIn ───────────────────────────────────────────────────────────────────

describe("scaleIn", () => {
  it("returns 0 before startFrame", () => {
    expect(scaleIn(0, 10)).toBe(0);
  });

  it("returns 1 at and after the scale completes", () => {
    expect(scaleIn(22, 10, 12)).toBe(1);
    expect(scaleIn(100, 10, 12)).toBe(1);
  });

  it("is monotonically increasing", () => {
    const values = [10, 13, 16, 19, 22].map((f) => scaleIn(f, 10, 12));
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThanOrEqual(values[i - 1]);
    }
  });
});

// ── pulse ─────────────────────────────────────────────────────────────────────

describe("pulse", () => {
  it("returns 1.0 before and after the pulse window", () => {
    expect(pulse(0, 10, 9)).toBe(1.0);
    expect(pulse(20, 10, 9)).toBe(1.0);
  });

  it("reaches a peak above 1.0 during the pulse", () => {
    const mid = 10 + 4; // 40% of 9 ≈ 3.6, so midpoint near frame 14
    const v = pulse(14, 10, 9, 1.02);
    expect(v).toBeGreaterThanOrEqual(1.0);
    expect(v).toBeLessThanOrEqual(1.02 + 0.01);
  });

  it("starts and ends at 1.0", () => {
    expect(pulse(10, 10, 9)).toBe(1.0);
    expect(pulse(19, 10, 9)).toBe(1.0);
  });
});

// ── lockOnPulse ───────────────────────────────────────────────────────────────

describe("lockOnPulse", () => {
  it("returns 1.0 before startFrame", () => {
    expect(lockOnPulse(0, 10)).toBe(1.0);
    expect(lockOnPulse(9, 10)).toBe(1.0);
  });

  it("returns 1.0 after the pulse ends", () => {
    // 200ms at 30fps = 6 frames
    expect(lockOnPulse(20, 10)).toBe(1.0);
  });

  it("reaches peak scale mid-pulse", () => {
    // Default: 200ms = 6 frames, peak at 40% = frame 12.4
    const peakFrame = Math.round(10 + 6 * 0.4); // 12
    const v = lockOnPulse(peakFrame, 10, 30, 1.1, 200);
    expect(v).toBeGreaterThan(1.0);
    expect(v).toBeLessThanOrEqual(1.1 + 0.001);
  });

  it("respects custom peakScale", () => {
    const peakFrame = 10 + Math.round(6 * 0.4);
    const v = lockOnPulse(peakFrame, 10, 30, 1.05, 200);
    expect(v).toBeLessThanOrEqual(1.05 + 0.001);
  });
});

// ── pathDraw ──────────────────────────────────────────────────────────────────

describe("pathDraw", () => {
  it("dashOffset equals pathLength before animation (nothing drawn)", () => {
    const { dashArray, dashOffset } = pathDraw(0, 10, 20, 500);
    expect(dashArray).toBe(500);
    expect(dashOffset).toBe(500); // 0% drawn → full offset
  });

  it("dashOffset is 0 when animation is complete (fully drawn)", () => {
    const { dashOffset } = pathDraw(30, 10, 20, 500);
    expect(dashOffset).toBe(0);
  });

  it("dashArray always equals pathLength", () => {
    for (const f of [0, 10, 15, 20, 30]) {
      const { dashArray } = pathDraw(f, 10, 20, 300);
      expect(dashArray).toBe(300);
    }
  });

  it("dashOffset is strictly decreasing through the animation window", () => {
    const offsets = [10, 13, 16, 20, 23, 30].map(
      (f) => pathDraw(f, 10, 20, 500).dashOffset
    );
    for (let i = 1; i < offsets.length; i++) {
      expect(offsets[i]).toBeLessThanOrEqual(offsets[i - 1]);
    }
  });
});

// ── gridlineDraw ──────────────────────────────────────────────────────────────

describe("gridlineDraw", () => {
  it("returns 0 before startFrame", () => {
    expect(gridlineDraw(0, 10)).toBe(0);
  });

  it("returns 1 after the draw completes", () => {
    expect(gridlineDraw(100, 10, 18)).toBe(1);
  });

  it("later line indices start later (staggered)", () => {
    // line 0 starts at frame 10, line 1 starts at frame 13 (stagger=3)
    // At frame 12: line 0 has progressed past 0, line 1 has not yet started
    const line0At12 = gridlineDraw(12, 10, 18, 0, 3); // 2 frames into its animation
    const line1At12 = gridlineDraw(12, 10, 18, 1, 3); // hasn't started yet (starts at 13)
    expect(line0At12).toBeGreaterThan(0);
    expect(line1At12).toBe(0);
  });
});

// ── bloomIntensity ────────────────────────────────────────────────────────────

describe("bloomIntensity", () => {
  it("returns 0 before startFrame", () => {
    expect(bloomIntensity(0, 10)).toBe(0);
  });

  it("peaks at 1 at the end of the flash phase", () => {
    expect(bloomIntensity(10 + 8, 10, 8)).toBeCloseTo(1, 4);
  });

  it("settles to sustainLevel after the settle phase", () => {
    // settle ends at startFrame + flashDuration + flashDuration*2 = 10+8+16=34
    const v = bloomIntensity(50, 10, 8, 0.6);
    expect(v).toBeCloseTo(0.6, 4);
  });
});

// ── cameraShake ───────────────────────────────────────────────────────────────

describe("cameraShake", () => {
  it("returns { x:0, y:0, rotation:0 } before the shake", () => {
    const result = cameraShake(0, 30, 6, 20);
    expect(result).toEqual({ x: 0, y: 0, rotation: 0 });
  });

  it("returns { x:0, y:0, rotation:0 } after the shake ends", () => {
    const result = cameraShake(60, 30, 6, 20);
    expect(result).toEqual({ x: 0, y: 0, rotation: 0 });
  });

  it("returns non-zero offsets during the shake window", () => {
    const result = cameraShake(31, 30, 6, 20);
    // At least one axis should be non-zero (deterministic via Remotion random)
    const nonZero = result.x !== 0 || result.y !== 0 || result.rotation !== 0;
    expect(nonZero).toBe(true);
  });

  it("is deterministic — same frame always produces same result", () => {
    const a = cameraShake(35, 30, 6, 20);
    const b = cameraShake(35, 30, 6, 20);
    expect(a).toEqual(b);
  });

  it("x and y stay within [-intensity, +intensity]", () => {
    const intensity = 6;
    for (let f = 30; f <= 50; f++) {
      const { x, y } = cameraShake(f, 30, intensity, 20);
      expect(Math.abs(x)).toBeLessThanOrEqual(intensity);
      expect(Math.abs(y)).toBeLessThanOrEqual(intensity);
    }
  });
});
