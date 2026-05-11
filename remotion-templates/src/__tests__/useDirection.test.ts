/**
 * useDirection — unit tests for the pure resolver.
 *
 * The hook itself is a thin alias for `resolveDirection`. The resolver is
 * load-bearing across nearly every template (atmosphere/tint/drift/hold/
 * pace consumption all flow through it), so its contract is worth locking.
 *
 * Why `resolveDirection` and not `useDirection` directly: same function,
 * different name. The exported helper is the testable handle; templates
 * import the hook for naming convention. Tests target the helper to make
 * intent clear (this is pure logic, not React state).
 */

import { describe, expect, it } from "vitest";
import { resolveDirection } from "../hooks/useDirection";

describe("resolveDirection", () => {
  describe("no direction (undefined / null)", () => {
    it("returns the no-direction defaults for undefined", () => {
      const result = resolveDirection(undefined);
      expect(result.hasDirection).toBe(false);
      expect(result.atmosphere).toBeUndefined();
      expect(result.atmosphereIntensity).toBeUndefined();
      expect(result.backgroundTint).toBeUndefined();
      expect(result.globalDim).toBeUndefined();
      expect(result.driftOptions).toEqual({});
      expect(result.holdAfter).toBeUndefined();
      expect(result.preDelay).toBeUndefined();
      expect(result.proportional).toBeUndefined();
      expect(result.syncPoints).toBeUndefined();
      expect(result.paceProfile).toBeUndefined();
      expect(result.paceTimingScale).toBe(1.0);
      expect(result.paceStaggerScale).toBe(1.0);
    });

    it("returns identical defaults for null", () => {
      expect(resolveDirection(null)).toEqual(resolveDirection(undefined));
    });

    it("pace scales default to 1.0 — animations play at template-natural speed", () => {
      // Critical contract: any template multiplying sec(N) by paceTimingScale
      // must produce sec(N) when no direction is provided. Backward compat.
      const { paceTimingScale, paceStaggerScale } = resolveDirection(undefined);
      expect(paceTimingScale).toBe(1.0);
      expect(paceStaggerScale).toBe(1.0);
    });
  });

  describe("paceProfile resolution", () => {
    it("urgent → 0.7 timing / 0.6 stagger (faster reveals, tighter cadence)", () => {
      const result = resolveDirection({ paceProfile: "urgent" });
      expect(result.paceTimingScale).toBe(0.7);
      expect(result.paceStaggerScale).toBe(0.6);
      expect(result.paceProfile).toBe("urgent");
    });

    it("analytical → 1.0 / 1.0 (the default)", () => {
      const result = resolveDirection({ paceProfile: "analytical" });
      expect(result.paceTimingScale).toBe(1.0);
      expect(result.paceStaggerScale).toBe(1.0);
    });

    it("breathing → 1.4 / 1.5 (slower, more deliberate)", () => {
      const result = resolveDirection({ paceProfile: "breathing" });
      expect(result.paceTimingScale).toBe(1.4);
      expect(result.paceStaggerScale).toBe(1.5);
    });

    it("missing paceProfile (but direction block present) → analytical", () => {
      const result = resolveDirection({});
      expect(result.paceTimingScale).toBe(1.0);
      expect(result.paceStaggerScale).toBe(1.0);
    });

    it("paceProfile values are ordered urgent < analytical < breathing", () => {
      // Lock the relative ordering — script writers and template authors
      // both assume urgent < analytical < breathing for both scales.
      const u = resolveDirection({ paceProfile: "urgent" });
      const a = resolveDirection({ paceProfile: "analytical" });
      const b = resolveDirection({ paceProfile: "breathing" });
      expect(u.paceTimingScale).toBeLessThan(a.paceTimingScale);
      expect(a.paceTimingScale).toBeLessThan(b.paceTimingScale);
      expect(u.paceStaggerScale).toBeLessThan(a.paceStaggerScale);
      expect(a.paceStaggerScale).toBeLessThan(b.paceStaggerScale);
    });
  });

  describe("ambientParticles → atmosphereIntensity", () => {
    it("converts particle count to intensity multiplier (count / 30)", () => {
      expect(resolveDirection({ ambientParticles: 15 }).atmosphereIntensity).toBeCloseTo(0.5, 5);
      expect(resolveDirection({ ambientParticles: 30 }).atmosphereIntensity).toBeCloseTo(1.0, 5);
      expect(resolveDirection({ ambientParticles: 45 }).atmosphereIntensity).toBeCloseTo(1.5, 5);
    });

    it("undefined particle count yields undefined intensity (use Background default)", () => {
      expect(resolveDirection({}).atmosphereIntensity).toBeUndefined();
    });

    it("zero particle count is explicit suppress-atmosphere (intensity 0)", () => {
      expect(resolveDirection({ ambientParticles: 0 }).atmosphereIntensity).toBe(0);
    });

    it("zero particles stays 0 when music bed scales intensity", () => {
      expect(
        resolveDirection({
          ambientParticles: 0,
          musicBedAtmosphereMultiplier: 1.5,
        }).atmosphereIntensity,
      ).toBe(0);
    });
  });

  describe("musicBedAtmosphereMultiplier", () => {
    it("multiplier only scales default base 1.0 when mood ≠ 1", () => {
      expect(
        resolveDirection({ musicBedAtmosphereMultiplier: 1.5 }).atmosphereIntensity,
      ).toBeCloseTo(1.5, 5);
      expect(
        resolveDirection({ musicBedAtmosphereMultiplier: 0.6 }).atmosphereIntensity,
      ).toBeCloseTo(0.6, 5);
    });

    it("multiplier 1 with no particles leaves intensity undefined (backward compat)", () => {
      expect(resolveDirection({ musicBedAtmosphereMultiplier: 1 }).atmosphereIntensity).toBeUndefined();
      expect(resolveDirection({}).atmosphereIntensity).toBeUndefined();
    });

    it("multiplies particle-derived intensity when both are set", () => {
      expect(
        resolveDirection({
          ambientParticles: 30,
          musicBedAtmosphereMultiplier: 1.5,
        }).atmosphereIntensity,
      ).toBeCloseTo(1.5, 5);
      expect(
        resolveDirection({
          ambientParticles: 15,
          musicBedAtmosphereMultiplier: 2,
        }).atmosphereIntensity,
      ).toBeCloseTo(1.0, 5);
    });
  });

  describe("driftPreset → driftOptions", () => {
    it("none → noDrift: true", () => {
      const result = resolveDirection({ driftPreset: "none" });
      expect(result.driftOptions).toEqual({ noDrift: true });
    });

    it("slow → restrained max scale + pan + rotation", () => {
      const result = resolveDirection({ driftPreset: "slow" });
      expect(result.driftOptions.maxScale).toBe(1.03);
      expect(result.driftOptions.maxPanX).toBe(8);
    });

    it("normal → fuller drift envelope", () => {
      const result = resolveDirection({ driftPreset: "normal" });
      expect(result.driftOptions.maxScale).toBe(1.06);
      expect(result.driftOptions.maxPanX).toBe(18);
    });

    it("missing driftPreset → empty options (template defaults apply)", () => {
      expect(resolveDirection({}).driftOptions).toEqual({});
    });

    it("normal drift envelope is wider than slow (drift presets ordered)", () => {
      const slow = resolveDirection({ driftPreset: "slow" });
      const normal = resolveDirection({ driftPreset: "normal" });
      expect(normal.driftOptions.maxScale!).toBeGreaterThan(slow.driftOptions.maxScale!);
      expect(normal.driftOptions.maxPanX!).toBeGreaterThan(slow.driftOptions.maxPanX!);
    });
  });

  describe("syncPoints passthrough", () => {
    it("forwards syncPoints from the direction block", () => {
      const points = [
        { word: "Taiwan", timeSec: 1.2, frame: 36, confidence: 0.94 },
      ];
      const result = resolveDirection({ syncPoints: points });
      expect(result.syncPoints).toBe(points);
    });

    it("absent syncPoints → undefined", () => {
      expect(resolveDirection({}).syncPoints).toBeUndefined();
    });

    it("empty syncPoints array passes through (lets useBeatSync see [])", () => {
      const result = resolveDirection({ syncPoints: [] });
      expect(result.syncPoints).toEqual([]);
    });
  });

  describe("hasDirection flag", () => {
    it("false when no direction block", () => {
      expect(resolveDirection(undefined).hasDirection).toBe(false);
      expect(resolveDirection(null).hasDirection).toBe(false);
    });

    it("true when any direction block is present, even an empty one", () => {
      expect(resolveDirection({}).hasDirection).toBe(true);
    });
  });

  describe("scalar passthrough", () => {
    it("forwards atmosphere, backgroundTint, globalDim, holdAfter, preDelay, proportional", () => {
      const block = {
        atmosphere: "dense" as const,
        backgroundTint: "#3266AD",
        globalDim: 0.4,
        holdAfter: 1.5,
        preDelay: 0.3,
        proportional: true,
      };
      const result = resolveDirection(block);
      expect(result.atmosphere).toBe("dense");
      expect(result.backgroundTint).toBe("#3266AD");
      expect(result.globalDim).toBe(0.4);
      expect(result.holdAfter).toBe(1.5);
      expect(result.preDelay).toBe(0.3);
      expect(result.proportional).toBe(true);
    });

    it("backgroundTint null → undefined (preserves the ?? coercion contract)", () => {
      // Some upstream tooling emits null for missing tint; the resolver
      // normalizes to undefined so consumers don't need to handle both.
      const result = resolveDirection({ backgroundTint: null as unknown as string });
      expect(result.backgroundTint).toBeUndefined();
    });
  });
});
