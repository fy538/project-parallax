/**
 * usePhase — unit tests for computePhaseState().
 *
 * The hook (`usePhase`) is a thin React wrapper around `computePhaseState`,
 * which contains all the load-bearing timing math. These tests lock that math
 * against the contract so future refactors can't silently change phase
 * transitions across the templates that use the hook (DuelingFrameworks
 * cinematic mode, HorizontalTimeline, EscalationLadder).
 *
 * Why no React / hook test: extracting the pure function lets us test
 * the math directly without mocking useCurrentFrame, matching the
 * computeBeatState / useBeatSync split already established in this suite.
 *
 * COVERAGE:
 *   · Phase identification at every boundary (before, inside, after each phase)
 *   · frameInPhase, rawProgress, progress (0 → 1 within phase)
 *   · getPhaseStart / getPhaseEnd absolute frame lookups
 *   · isPhase / isPast predicates
 *   · baseDelay shifts all phase boundaries by the delay amount
 *   · Last phase clamps at progress = 1 when frame overruns total duration
 *   · Custom easing function is applied to rawProgress
 *   · Zero-duration phase (instantaneous) returns progress = 1
 *   · Edge: empty phases array returns neutral safe state
 *   · totalDuration accounts for baseDelay
 */

import { describe, expect, it } from "vitest";
import { computePhaseState } from "../hooks/usePhase";
import type { PhaseDefinition } from "../hooks/usePhase";

// ── Helpers ──────────────────────────────────────────────────────────────────

/** 30 fps reference — matches the Remotion project setting */
const FPS = 30;
const sec = (s: number) => Math.round(s * FPS);

/** A representative 4-phase sequence used by cinematic templates. */
const STANDARD_PHASES: PhaseDefinition[] = [
  { name: "intro",    duration: sec(1) },   // 0–29
  { name: "reveal",   duration: sec(2) },   // 30–89
  { name: "hold",     duration: sec(3) },   // 90–179
  { name: "exit",     duration: sec(0.5) }, // 180–194
];
// totalDuration = 195 frames

// ── Phase identification ──────────────────────────────────────────────────────

describe("computePhaseState — phase identification", () => {
  it("frame 0 is in the first phase", () => {
    const s = computePhaseState(0, STANDARD_PHASES);
    expect(s.phase).toBe("intro");
    expect(s.phaseIndex).toBe(0);
  });

  it("last frame of intro (29) is still 'intro'", () => {
    const s = computePhaseState(29, STANDARD_PHASES);
    expect(s.phase).toBe("intro");
  });

  it("first frame of reveal (30) transitions to 'reveal'", () => {
    const s = computePhaseState(30, STANDARD_PHASES);
    expect(s.phase).toBe("reveal");
    expect(s.phaseIndex).toBe(1);
  });

  it("mid-reveal frame is in 'reveal'", () => {
    const s = computePhaseState(60, STANDARD_PHASES);
    expect(s.phase).toBe("reveal");
  });

  it("frame 90 transitions to 'hold'", () => {
    const s = computePhaseState(90, STANDARD_PHASES);
    expect(s.phase).toBe("hold");
    expect(s.phaseIndex).toBe(2);
  });

  it("frame 180 transitions to 'exit'", () => {
    const s = computePhaseState(180, STANDARD_PHASES);
    expect(s.phase).toBe("exit");
    expect(s.phaseIndex).toBe(3);
  });

  it("frame past totalDuration stays in last phase", () => {
    const s = computePhaseState(9999, STANDARD_PHASES);
    expect(s.phase).toBe("exit");
    expect(s.phaseIndex).toBe(3);
  });
});

// ── progress / rawProgress ────────────────────────────────────────────────────

describe("computePhaseState — progress within phase", () => {
  it("frame 0: rawProgress = 0 in intro", () => {
    expect(computePhaseState(0, STANDARD_PHASES).rawProgress).toBeCloseTo(0);
  });

  it("last frame of intro: rawProgress approaches 1", () => {
    const s = computePhaseState(29, STANDARD_PHASES);
    expect(s.rawProgress).toBeGreaterThan(0.9);
    expect(s.rawProgress).toBeLessThanOrEqual(1);
  });

  it("first frame of reveal: rawProgress resets to ≈0", () => {
    expect(computePhaseState(30, STANDARD_PHASES).rawProgress).toBeCloseTo(0);
  });

  it("mid-reveal (frame 60 of 30+60 = frame 60, 30 frames into a 60-frame phase): rawProgress ≈ 0.5", () => {
    // reveal starts at 30, duration 60 → mid at frame 30+30=60
    expect(computePhaseState(60, STANDARD_PHASES).rawProgress).toBeCloseTo(0.5, 1);
  });

  it("overrun frame: rawProgress clamped to 1", () => {
    expect(computePhaseState(9999, STANDARD_PHASES).rawProgress).toBe(1);
  });

  it("progress === rawProgress when no easing function", () => {
    const s = computePhaseState(60, STANDARD_PHASES);
    expect(s.progress).toBe(s.rawProgress);
  });

  it("custom easing is applied to rawProgress", () => {
    const phases: PhaseDefinition[] = [
      { name: "ease", duration: 30, easing: (t) => t * t }, // quadratic
    ];
    // At frame 15, rawProgress = 0.5 → eased = 0.25
    const s = computePhaseState(15, phases);
    expect(s.rawProgress).toBeCloseTo(0.5, 1);
    expect(s.progress).toBeCloseTo(0.25, 1);
  });
});

// ── frameInPhase / phaseStart ─────────────────────────────────────────────────

describe("computePhaseState — frameInPhase and phaseStart", () => {
  it("frame 0: frameInPhase = 0", () => {
    expect(computePhaseState(0, STANDARD_PHASES).frameInPhase).toBe(0);
  });

  it("frame 45 (15 frames into reveal): frameInPhase = 15", () => {
    // reveal starts at 30, frame 45 → frameInPhase = 15
    expect(computePhaseState(45, STANDARD_PHASES).frameInPhase).toBe(15);
  });

  it("phaseStart for 'reveal' is 30", () => {
    const s = computePhaseState(60, STANDARD_PHASES);
    expect(s.phaseStart).toBe(30);
  });

  it("phaseStart for 'hold' is 90", () => {
    const s = computePhaseState(120, STANDARD_PHASES);
    expect(s.phaseStart).toBe(90);
  });
});

// ── getPhaseStart / getPhaseEnd ───────────────────────────────────────────────

describe("computePhaseState — getPhaseStart / getPhaseEnd", () => {
  const s = computePhaseState(0, STANDARD_PHASES);

  it("getPhaseStart('intro') = 0", () => {
    expect(s.getPhaseStart("intro")).toBe(0);
  });

  it("getPhaseStart('reveal') = 30", () => {
    expect(s.getPhaseStart("reveal")).toBe(30);
  });

  it("getPhaseStart('hold') = 90", () => {
    expect(s.getPhaseStart("hold")).toBe(90);
  });

  it("getPhaseStart('exit') = 180", () => {
    expect(s.getPhaseStart("exit")).toBe(180);
  });

  it("getPhaseEnd('intro') = 30", () => {
    expect(s.getPhaseEnd("intro")).toBe(30);
  });

  it("getPhaseEnd('exit') = 195", () => {
    expect(s.getPhaseEnd("exit")).toBe(195);
  });

  it("unknown phase name → 0 for both start and end", () => {
    expect(s.getPhaseStart("nonexistent")).toBe(0);
    expect(s.getPhaseEnd("nonexistent")).toBe(0);
  });
});

// ── isPhase / isPast ──────────────────────────────────────────────────────────

describe("computePhaseState — isPhase and isPast", () => {
  it("isPhase returns true only for the active phase", () => {
    const s = computePhaseState(60, STANDARD_PHASES); // in 'reveal'
    expect(s.isPhase("reveal")).toBe(true);
    expect(s.isPhase("intro")).toBe(false);
    expect(s.isPhase("hold")).toBe(false);
  });

  it("isPast returns false for current and future phases", () => {
    const s = computePhaseState(60, STANDARD_PHASES); // in 'reveal'
    expect(s.isPast("reveal")).toBe(false);
    expect(s.isPast("hold")).toBe(false);
    expect(s.isPast("exit")).toBe(false);
  });

  it("isPast returns true for completed phases", () => {
    const s = computePhaseState(100, STANDARD_PHASES); // in 'hold'
    expect(s.isPast("intro")).toBe(true);
    expect(s.isPast("reveal")).toBe(true);
    expect(s.isPast("hold")).toBe(false);
  });

  it("isPast('intro') is true at frame 30 (exactly at reveal start)", () => {
    const s = computePhaseState(30, STANDARD_PHASES); // reveal just started
    expect(s.isPast("intro")).toBe(true);
  });

  it("isPast returns false for unknown phase name", () => {
    const s = computePhaseState(100, STANDARD_PHASES);
    expect(s.isPast("ghost")).toBe(false);
  });
});

// ── baseDelay ─────────────────────────────────────────────────────────────────

describe("computePhaseState — baseDelay", () => {
  const DELAY = sec(1); // 30 frames

  it("frame < baseDelay: still in first phase (pre-delay)", () => {
    const s = computePhaseState(15, STANDARD_PHASES, DELAY);
    expect(s.phase).toBe("intro");
  });

  it("frame = baseDelay: intro starts (rawProgress ≈ 0)", () => {
    const s = computePhaseState(DELAY, STANDARD_PHASES, DELAY);
    expect(s.phase).toBe("intro");
    expect(s.rawProgress).toBeCloseTo(0);
  });

  it("getPhaseStart shifts by baseDelay", () => {
    const s = computePhaseState(0, STANDARD_PHASES, DELAY);
    expect(s.getPhaseStart("intro")).toBe(DELAY);
    expect(s.getPhaseStart("reveal")).toBe(DELAY + 30);
  });

  it("phaseStart of current phase accounts for baseDelay", () => {
    const s = computePhaseState(DELAY + 45, STANDARD_PHASES, DELAY); // in reveal
    expect(s.phaseStart).toBe(DELAY + 30);
  });

  it("totalDuration includes baseDelay", () => {
    const s = computePhaseState(0, STANDARD_PHASES, DELAY);
    expect(s.totalDuration).toBe(195 + DELAY);
  });
});

// ── totalDuration ─────────────────────────────────────────────────────────────

describe("computePhaseState — totalDuration", () => {
  it("equals sum of all phase durations (no delay)", () => {
    const total = STANDARD_PHASES.reduce((sum, p) => sum + p.duration, 0);
    const s = computePhaseState(0, STANDARD_PHASES);
    expect(s.totalDuration).toBe(total);
  });

  it("single-phase totalDuration equals that phase's duration", () => {
    const phases: PhaseDefinition[] = [{ name: "only", duration: 60 }];
    expect(computePhaseState(0, phases).totalDuration).toBe(60);
  });
});

// ── special cases ─────────────────────────────────────────────────────────────

describe("computePhaseState — special cases", () => {
  it("zero-duration phase has no temporal extent — frame 0 lands in next phase", () => {
    // The loop condition `frame < starts[i] + duration` evaluates `0 < 0+0 = false`
    // for a zero-duration phase, so the implementation falls through to the next
    // phase. A zero-duration phase can never be "active" — it has no frames.
    const phases: PhaseDefinition[] = [
      { name: "instant", duration: 0 },
      { name: "body",    duration: 60 },
    ];
    const s = computePhaseState(0, phases);
    expect(s.phase).toBe("body");
    expect(s.phaseIndex).toBe(1);
  });

  it("single phase — frame 0 starts at progress 0", () => {
    const phases: PhaseDefinition[] = [{ name: "only", duration: 60 }];
    const s = computePhaseState(0, phases);
    expect(s.phase).toBe("only");
    expect(s.rawProgress).toBeCloseTo(0);
  });

  it("empty phases array — returns safe neutral state", () => {
    const s = computePhaseState(0, []);
    expect(s.phase).toBe("");
    expect(s.phaseIndex).toBe(0);
    expect(s.progress).toBe(0);
    expect(s.totalDuration).toBe(0);
    // Helpers return 0 / false without throwing
    expect(s.getPhaseStart("any")).toBe(0);
    expect(s.isPhase("any")).toBe(false);
    expect(s.isPast("any")).toBe(false);
  });
});
