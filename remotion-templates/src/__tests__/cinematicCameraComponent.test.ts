/**
 * Unit tests for the FreeCamera-driven cinematic camera component
 * (src/components/CinematicCamera.tsx).
 *
 * Distinct from cinematicCamera.test.ts which tests the AtlasPlate-side
 * camera utilities (cubicBezier1D, applyDwell, viaGlobePoseInterpolate)
 * in src/utils/mapUtils.ts. The two systems are complementary:
 *
 *   • mapUtils.ts        — pure SVG AtlasPlate, scale + translate math
 *   • CinematicCamera    — Mapbox FreeCamera (3D altitude curves, lookAt)
 *
 * These tests cover the pure interpolation helpers — the React side
 * effect (the actual setFreeCameraOptions call) is verified separately
 * via the integration test path.
 */

import { describe, it, expect } from "vitest";
import {
  zoomToAltitudeM,
  lerpLongitude,
  resolveCameraPose,
  cinematicPathFromDirective,
  type CameraKeyframe,
} from "../components/CinematicCamera";

describe("zoomToAltitudeM", () => {
  it("doubles altitude for each zoom level decrease", () => {
    const z4 = zoomToAltitudeM(4);
    const z3 = zoomToAltitudeM(3);
    expect(z3 / z4).toBeCloseTo(2, 5);
  });

  it("matches expected magnitudes", () => {
    expect(zoomToAltitudeM(1)).toBeCloseTo(7_000_000);
    expect(zoomToAltitudeM(4)).toBeCloseTo(875_000);
  });
});

describe("lerpLongitude", () => {
  it("interpolates linearly within a hemisphere", () => {
    expect(lerpLongitude(0, 90, 0.5)).toBeCloseTo(45);
    expect(lerpLongitude(-30, 30, 0.5)).toBeCloseTo(0);
  });

  it("takes the short way across the antimeridian", () => {
    expect(lerpLongitude(170, -170, 0.5)).toBeCloseTo(180);
    expect(lerpLongitude(-175, 175, 0.5)).toBeCloseTo(-180);
  });
});

describe("resolveCameraPose", () => {
  const keyframes: CameraKeyframe[] = [
    {
      frame: 0,
      center: [104, 35],
      altitudeM: 8_000_000,
      bearing: 0,
      pitch: 30,
      easing: "linear",
    },
    {
      frame: 60,
      center: [120, 25],
      altitudeM: 4_000_000,
      bearing: 30,
      pitch: 45,
      easing: "linear",
    },
  ];

  it("clamps to the first keyframe before its frame", () => {
    const pose = resolveCameraPose(keyframes, -10);
    expect(pose.center).toEqual([104, 35]);
    expect(pose.altitudeM).toBe(8_000_000);
  });

  it("clamps to the last keyframe after its frame", () => {
    const pose = resolveCameraPose(keyframes, 999);
    expect(pose.center).toEqual([120, 25]);
    expect(pose.altitudeM).toBe(4_000_000);
  });

  it("interpolates linearly at the midpoint (with linear easing)", () => {
    const pose = resolveCameraPose(keyframes, 30);
    expect(pose.center[0]).toBeCloseTo(112, 5);
    expect(pose.center[1]).toBeCloseTo(30, 5);
    expect(pose.altitudeM).toBeCloseTo(6_000_000, 0);
    expect(pose.bearing).toBeCloseTo(15, 5);
    expect(pose.pitch).toBeCloseTo(37.5, 5);
  });

  it("handles single keyframe as static pose", () => {
    const pose = resolveCameraPose([keyframes[0]], 999);
    expect(pose.center).toEqual([104, 35]);
  });

  it("handles empty array with safe defaults", () => {
    const pose = resolveCameraPose([], 0);
    expect(pose.center).toEqual([0, 0]);
    expect(pose.altitudeM).toBeGreaterThan(0);
  });

  it("derives altitudeM from zoom when altitudeM is unset", () => {
    const pose = resolveCameraPose(
      [
        { frame: 0, center: [0, 0], zoom: 4, easing: "linear" },
        { frame: 30, center: [0, 0], zoom: 4, easing: "linear" },
      ],
      15,
    );
    expect(pose.altitudeM).toBeCloseTo(zoomToAltitudeM(4));
  });
});

describe("cinematicPathFromDirective", () => {
  const base = {
    startFrame: 0,
    durationFrames: 60,
    center: [104, 35] as [number, number],
    altitudeM: 6_000_000,
    bearing: 10,
    pitch: 30,
  };

  it("push-in halves the altitude", () => {
    const kf = cinematicPathFromDirective({ ...base, mode: "push-in" });
    expect(kf).toHaveLength(2);
    expect(kf[0].altitudeM).toBe(6_000_000);
    expect(kf[1].altitudeM).toBe(3_000_000);
  });

  it("pull-back doubles the altitude", () => {
    const kf = cinematicPathFromDirective({ ...base, mode: "pull-back" });
    expect(kf[1].altitudeM).toBe(12_000_000);
  });

  it("orbit sweeps bearing by default 30 degrees", () => {
    const kf = cinematicPathFromDirective({ ...base, mode: "orbit" });
    expect(kf[0].bearing).toBe(10);
    expect(kf[1].bearing).toBe(40);
    expect(kf[0].altitudeM).toBe(kf[1].altitudeM);
  });

  it("pivot sweeps pitch", () => {
    const kf = cinematicPathFromDirective({
      ...base,
      mode: "pivot",
      pitchDelta: 20,
    });
    expect(kf[0].pitch).toBe(30);
    expect(kf[1].pitch).toBe(50);
  });

  it("orbit respects custom bearingDelta", () => {
    const kf = cinematicPathFromDirective({
      ...base,
      mode: "orbit",
      bearingDelta: 90,
    });
    expect(kf[1].bearing).toBe(100);
  });
});
