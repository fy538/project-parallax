/**
 * @vitest-environment happy-dom
 *
 * MathCrossfade — tests for the engine that drives multi-step math.
 *
 * Two layers of coverage:
 *
 *   1. Pure timing math (`stepOpacities`, `activeStepIndex`,
 *      `crossfadeDurationFrames`) — exercised directly without rendering.
 *      This is the hardest-to-get-right surface; opacity arithmetic across
 *      crossfade boundaries is where subtle bugs live (e.g. the "last step
 *      goes invisible after its hold ends" regression caught in dev).
 *
 *   2. Component render — confirms the engine wires the pure math into
 *      stacked MathExpressions with the right opacities at a given frame.
 *
 * Phase 2 ships step-by-step + term-highlight + substitution as the same
 * crossfade engine — the editorial primitives differ only in how authors
 * compose the `steps` array. The tests therefore focus on the engine's
 * correctness, not on per-primitive authoring patterns.
 */

import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

// Mock Remotion's useCurrentFrame for component-render tests below.
import { vi } from "vitest";
vi.mock("remotion", async () => {
  const actual = await vi.importActual<typeof import("remotion")>("remotion");
  return {
    ...actual,
    useCurrentFrame: vi.fn(() => 0),
  };
});

import { useCurrentFrame } from "remotion";
import {
  MathCrossfade,
  stepOpacities,
  activeStepIndex,
  crossfadeDurationFrames,
} from "../components/MathCrossfade";

afterEach(cleanup);

// ── Timing math (pure) ──────────────────────────────────────────────────────

describe("crossfadeDurationFrames", () => {
  it("sums holdSec values and converts to frames at fps=30", () => {
    const steps = [{ holdSec: 2 }, { holdSec: 3 }, { holdSec: 1.5 }];
    // 2 + 3 + 1.5 = 6.5s × 30fps = 195
    expect(crossfadeDurationFrames(steps)).toBe(195);
  });

  it("handles a single-step sequence", () => {
    expect(crossfadeDurationFrames([{ holdSec: 4 }])).toBe(120);
  });
});

describe("activeStepIndex", () => {
  const steps = [{ holdSec: 2 }, { holdSec: 2 }, { holdSec: 2 }];

  it("returns 0 at frame 0", () => {
    expect(activeStepIndex(steps, 0)).toBe(0);
  });

  it("returns 0 just before the first boundary (frame 59 at fps=30)", () => {
    expect(activeStepIndex(steps, 59)).toBe(0);
  });

  it("returns 1 exactly at the first boundary", () => {
    expect(activeStepIndex(steps, 60)).toBe(1);
  });

  it("returns 2 in the third step's window", () => {
    expect(activeStepIndex(steps, 150)).toBe(2);
  });

  it("sticks on the last step past the end", () => {
    expect(activeStepIndex(steps, 999)).toBe(2);
  });
});

describe("stepOpacities", () => {
  const steps = [{ holdSec: 2 }, { holdSec: 2 }, { holdSec: 2 }];
  const crossfadeSec = 0.5; // 15 frames

  it("solo step 0 at the very start (frame 0)", () => {
    expect(stepOpacities(steps, 0, crossfadeSec)).toEqual([1, 0, 0]);
  });

  it("solo step 0 well into its hold (frame 20)", () => {
    expect(stepOpacities(steps, 20, crossfadeSec)).toEqual([1, 0, 0]);
  });

  it("mid-crossfade between step 0 and step 1 (frame 50)", () => {
    // Crossfade window for step 1's entrance: [60 - 15, 60) = [45, 60).
    // At frame 50 we're 5 frames into the 15-frame fade. t = 5/15 ≈ 0.333.
    const ops = stepOpacities(steps, 50, crossfadeSec);
    expect(ops[0]).toBeCloseTo(2 / 3, 3); // outgoing
    expect(ops[1]).toBeCloseTo(1 / 3, 3); // incoming
    expect(ops[2]).toBe(0);
  });

  it("hard boundary — step 1 fully solo at frame 60", () => {
    expect(stepOpacities(steps, 60, crossfadeSec)).toEqual([0, 1, 0]);
  });

  it("solo step 1 in the middle of its hold (frame 80)", () => {
    expect(stepOpacities(steps, 80, crossfadeSec)).toEqual([0, 1, 0]);
  });

  it("mid-crossfade between step 1 and step 2 (frame 115)", () => {
    // Crossfade window for step 2's entrance: [120 - 15, 120) = [105, 120).
    // At frame 115 we're 10 frames in. t = 10/15 ≈ 0.667.
    const ops = stepOpacities(steps, 115, crossfadeSec);
    expect(ops[0]).toBe(0);
    expect(ops[1]).toBeCloseTo(1 / 3, 3);
    expect(ops[2]).toBeCloseTo(2 / 3, 3);
  });

  it("last step sticks visible past the end (frame 999)", () => {
    // Critical regression: prior version went to [0, 0, 0] after the last
    // step's hold ended, leaving a blank frame between the math and the
    // parent template's exit fade.
    expect(stepOpacities(steps, 999, crossfadeSec)).toEqual([0, 0, 1]);
  });

  it("crossfadeSec=0 produces hard cuts (no opacity blend at boundaries)", () => {
    // At frame 59 (last frame of step 0's window) — solo step 0.
    expect(stepOpacities(steps, 59, 0)).toEqual([1, 0, 0]);
    // At frame 60 (first frame of step 1) — solo step 1.
    expect(stepOpacities(steps, 60, 0)).toEqual([0, 1, 0]);
  });

  it("handles asymmetric holdSec values correctly", () => {
    // Step 0 holds 1s (frames 0–29), step 1 holds 3s (frames 30–119).
    // Crossfade-in window for step 1: [30 - 15, 30) = [15, 30).
    const asym = [{ holdSec: 1 }, { holdSec: 3 }];
    // Frame 0 — solo step 0.
    expect(stepOpacities(asym, 0, 0.5)).toEqual([1, 0]);
    // Frame 14 — still solo step 0 (one frame before crossfade starts).
    expect(stepOpacities(asym, 14, 0.5)).toEqual([1, 0]);
    // Frame 29 — last frame of crossfade window. t = 14/15 ≈ 0.933.
    const opsAt29 = stepOpacities(asym, 29, 0.5);
    expect(opsAt29[0]).toBeCloseTo(1 / 15, 3);
    expect(opsAt29[1]).toBeCloseTo(14 / 15, 3);
    // Frame 60 — well into step 1's solo window.
    expect(stepOpacities(asym, 60, 0.5)).toEqual([0, 1]);
  });

  it("single-step sequence renders step 0 at full opacity always", () => {
    const single = [{ holdSec: 5 }];
    expect(stepOpacities(single, 0, 0.5)).toEqual([1]);
    expect(stepOpacities(single, 75, 0.5)).toEqual([1]); // mid-window
    expect(stepOpacities(single, 200, 0.5)).toEqual([1]); // past end
  });
});

// ── Component render ──────────────────────────────────────────────────────

describe("MathCrossfade — component render", () => {
  const mockFrame = (f: number) => {
    (useCurrentFrame as unknown as ReturnType<typeof vi.fn>).mockReturnValue(f);
  };

  it("renders one .katex root per step (stacked, opacity-controlled)", () => {
    mockFrame(0);
    const steps = [
      { formula: "a + b", holdSec: 2 },
      { formula: "a - b", holdSec: 2 },
    ];
    const { container } = render(<MathCrossfade steps={steps} />);
    expect(container.querySelectorAll(".katex").length).toBe(2);
  });

  it("at frame 0 step 0 is opaque and step 1 is hidden", () => {
    mockFrame(0);
    const steps = [
      { formula: "a + b", holdSec: 2 },
      { formula: "a - b", holdSec: 2 },
    ];
    const { container } = render(<MathCrossfade steps={steps} />);
    const stepDivs = container.querySelectorAll(":scope > div > div");
    expect(stepDivs.length).toBe(2);
    // Opacity 1 is fully eased to 1; opacity 0 stays 0. Both checked
    // against parseFloat to absorb any ".000" stringification.
    expect(parseFloat((stepDivs[0] as HTMLElement).style.opacity)).toBe(1);
    expect(parseFloat((stepDivs[1] as HTMLElement).style.opacity)).toBe(0);
  });

  it("at the final hard-boundary frame, step 1 is solo and step 0 is hidden", () => {
    mockFrame(60); // boundary between two 2s holds at fps=30
    const steps = [
      { formula: "a + b", holdSec: 2 },
      { formula: "a - b", holdSec: 2 },
    ];
    const { container } = render(<MathCrossfade steps={steps} />);
    const stepDivs = container.querySelectorAll(":scope > div > div");
    expect(parseFloat((stepDivs[0] as HTMLElement).style.opacity)).toBe(0);
    expect(parseFloat((stepDivs[1] as HTMLElement).style.opacity)).toBe(1);
  });

  it("past the end the last step sticks visible", () => {
    mockFrame(500); // way past 2 + 2 = 4s = 120 frames
    const steps = [
      { formula: "a + b", holdSec: 2 },
      { formula: "a - b", holdSec: 2 },
    ];
    const { container } = render(<MathCrossfade steps={steps} />);
    const stepDivs = container.querySelectorAll(":scope > div > div");
    expect(parseFloat((stepDivs[0] as HTMLElement).style.opacity)).toBe(0);
    expect(parseFloat((stepDivs[1] as HTMLElement).style.opacity)).toBe(1);
  });

  it("accepts a TeX color macro inside a formula (term-highlight primitive)", () => {
    // Term-highlight is just authoring — wrap the highlighted term in
    // \textcolor{HEX}{TERM}. KaTeX renders it; the component is agnostic.
    mockFrame(0);
    const steps = [
      {
        formula: "\\mathbb{E}[U] = \\textcolor{#C4A747}{p} \\cdot a + (1-p) \\cdot b",
        holdSec: 3,
      },
    ];
    const { container } = render(<MathCrossfade steps={steps} />);
    expect(container.querySelector(".katex")).not.toBeNull();
    // KaTeX renders the colored term — the color should appear as an
    // inline style somewhere in the rendered DOM.
    const html = container.innerHTML;
    expect(html.toLowerCase()).toContain("c4a747");
  });
});
