/**
 * ConstructivistEffect — a code-only NPR post pass that renders 3D as a flat
 * woodcut / screenprint in the Parallax register. Recipe (bold-flat, NOT a
 * halftone-over-render filter):
 *   1. HARD-POSTERIZE luminance into flat ink / gold / bone bands (no gradient).
 *   2. Halftone ONLY inside the mid (gold) band — flats stay clean; the dot
 *      screen is the "ink pull" texture in the transition, not all-over.
 *   3. BOLD ink linework (normal + depth edges) is the hero element.
 *   4. Light screen-fixed paper grain.
 *
 * Strong scene lighting does the FORM (deep shadows → ink, lit faces → bone);
 * the shader just quantizes it. EffectAttribute.DEPTH grants the depth buffer +
 * readDepth/getViewZ (used to reconstruct a view-space normal for the creases).
 *
 * NOTE: halftone is screen-space (not world-anchored). World anchoring needs the
 * per-frame camera matrix, which required a ref on this wrapEffect component —
 * and under React 19 that ref leaks into props, where wrapEffect's
 * JSON.stringify memo hits a circular Object3D and crashes. Since the halftone
 * is now confined to the narrow mid-band, screen-space crawl is negligible, so
 * the simpler (crash-free) screen-space path wins.
 */

import { Effect, EffectAttribute } from "postprocessing";
import { Uniform, Color } from "three";
import { wrapEffect } from "@react-three/postprocessing";

const fragmentShader = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uGold;
uniform vec3 uBone;
uniform float uT0;
uniform float uT1;
uniform float uDot;
uniform float uGrain;
uniform float uGrid;
uniform float uEdge;
uniform float uEdgeThresh;
uniform float uEdgeInk;
uniform float uNThresh;

// Camera intrinsics are fixed for the Recreation composition (fov 40, 16:9).
const float TAN_HALF_FOV = 0.36397; // tan(40deg / 2)
const float ASPECT = 1.7777778;

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// Tonal halftone coverage at a 2D coordinate — dots grow in shadow.
float htCov(vec2 q, float L) {
  float a = 0.7853982; // 45deg screen angle
  mat2 R = mat2(cos(a), -sin(a), sin(a), cos(a));
  vec2 cell = fract((R * q) * uGrid) - 0.5;
  float d = length(cell);
  float radius = mix(0.12, 0.5, 1.0 - L);
  float aa = fwidth(d) + 0.0001;
  return smoothstep(radius + aa, radius - aa, d);
}

void mainImage(const in vec4 inputColor, const in vec2 uv, const in float depth, out vec4 outputColor) {
  float L = luma(inputColor.rgb);

  // Reconstruct view-space position + normal from depth (for crease edges).
  float vz = getViewZ(depth);
  vec3 viewPos = vec3(
    (uv.x * 2.0 - 1.0) * TAN_HALF_FOV * ASPECT * -vz,
    (uv.y * 2.0 - 1.0) * TAN_HALF_FOV * -vz,
    vz
  );
  vec3 nrm = normalize(cross(dFdx(viewPos), dFdy(viewPos)));

  // Hard posterize → flat ink / gold / bone bands (tiny AA at the seams).
  float w = 0.03;
  float s0 = smoothstep(uT0 - w, uT0 + w, L);
  float s1 = smoothstep(uT1 - w, uT1 + w, L);
  vec3 col = mix(uInk, uGold, s0);
  col = mix(col, uBone, s1);

  // Halftone ONLY in the mid (gold) band — clean ink/bone flats elsewhere.
  float midMask = s0 * (1.0 - s1);
  float ink = htCov(vec2(uv.x * ASPECT, uv.y), L);
  col = mix(col, uInk, ink * uDot * midMask);

  // Bold ink linework (the woodcut hero): normal creases + depth silhouettes.
  float normalEdge = smoothstep(uNThresh, uNThresh * 2.0, length(fwidth(nrm)));
  vec2 o = texelSize * uEdge;
  float vzL = getViewZ(readDepth(uv - vec2(o.x, 0.0)));
  float vzR = getViewZ(readDepth(uv + vec2(o.x, 0.0)));
  float vzD = getViewZ(readDepth(uv - vec2(0.0, o.y)));
  float vzU = getViewZ(readDepth(uv + vec2(0.0, o.y)));
  float lap = abs(vzL + vzR - 2.0 * vz) + abs(vzU + vzD - 2.0 * vz);
  float depthEdge = smoothstep(uEdgeThresh, uEdgeThresh * 3.0, lap);
  float edge = max(depthEdge, normalEdge);
  col = mix(col, uInk, edge * uEdgeInk);

  // Light paper grain — screen-fixed (the paper doesn't move with the camera).
  col += (hash(uv * 1600.0) - 0.5) * uGrain;

  outputColor = vec4(clamp(col, 0.0, 1.0), inputColor.a);
}
`;

export interface ConstructivistOptions {
  /** Shadow ink color (brand ink). */
  ink?: string;
  /** Mid-band accent color (brand gold). */
  gold?: string;
  /** Highlight color (brand bone). */
  bone?: string;
  /** Ink→gold band threshold (luminance). */
  t0?: number;
  /** Gold→bone band threshold (luminance). */
  t1?: number;
  /** Mid-band halftone ink strength (0..1). */
  dot?: number;
  /** Paper-grain amount. */
  grain?: number;
  /** Halftone dot density (dots across the frame). */
  grid?: number;
  /** Edge sample offset in texels (line thickness). */
  edge?: number;
  /** Depth-Laplacian threshold for drawing a line. */
  edgeThresh?: number;
  /** Edge ink strength (0..1). */
  edgeInk?: number;
  /** Normal-edge (crease) sensitivity threshold. */
  nThresh?: number;
}

class ConstructivistEffectImpl extends Effect {
  constructor({
    ink,
    gold,
    bone,
    t0 = 0.32,
    t1 = 0.58,
    dot = 0.85,
    grain = 0.04,
    grid = 120,
    edge = 2.5,
    edgeThresh = 0.05,
    edgeInk = 1.0,
    nThresh = 0.35,
  }: ConstructivistOptions = {}) {
    super("ConstructivistEffect", fragmentShader, {
      attributes: EffectAttribute.DEPTH,
      uniforms: new Map<string, Uniform>([
        ["uInk", new Uniform(new Color(ink ?? 0xffffff))],
        ["uGold", new Uniform(new Color(gold ?? 0xffffff))],
        ["uBone", new Uniform(new Color(bone ?? 0xffffff))],
        ["uT0", new Uniform(t0)],
        ["uT1", new Uniform(t1)],
        ["uDot", new Uniform(dot)],
        ["uGrain", new Uniform(grain)],
        ["uGrid", new Uniform(grid)],
        ["uEdge", new Uniform(edge)],
        ["uEdgeThresh", new Uniform(edgeThresh)],
        ["uEdgeInk", new Uniform(edgeInk)],
        ["uNThresh", new Uniform(nThresh)],
      ]),
    });
  }
}

// Cast across the duplicate `postprocessing` type identities introduced by the
// split node_modules layout — runtime is a real Effect subclass. no-as-any-ok
export const ConstructivistEffect = wrapEffect(
  ConstructivistEffectImpl as unknown as Parameters<typeof wrapEffect>[0],
);
