/**
 * Recreation — SPIKE (Route A): code-driven 3D historical recreation rendered
 * INSIDE the Remotion pipeline via @remotion/three.
 *
 * Proves the thesis that a rigged-glTF 3D scene can be authored entirely in
 * code, animated deterministically off `useCurrentFrame()` (NOT R3F's wall
 * clock — that would flicker under Remotion's frame-by-frame render), and
 * rendered to MP4 as a first-class data-driven Parallax template.
 *
 * Asset loading uses drei's `useGLTF` (React Suspense) — Remotion waits for
 * the Suspense boundary to resolve before capturing each frame. The model is
 * cloned (SkeletonUtils) and normalized (bbox → target height, centered, feet
 * on the ground) so ANY rigged GLB drops in without per-asset tuning.
 *
 * The Soldier.glb here is a generic stand-in. Swapping in a period-accurate
 * rigged GLB (Meshy auto-rig / Sketchfab) is the asset step — identical
 * pipeline. Character consistency across shots = reuse the same GLB.
 *
 * RENDER NOTE: skinned-mesh rendering requires a real GPU. Software WebGL
 * (`--gl=swangle` / SwiftShader, the headless sandbox fallback) renders
 * non-skinned geometry fine but NOT the animated rig — render this on a GPU
 * machine or Remotion Lambda with GPU enabled (`--gl=angle`).
 */

import React, { useMemo, useEffect } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import {
  EffectComposer,
  DepthOfField,
  ChromaticAberration,
  Vignette,
  HueSaturation,
  BrightnessContrast,
} from "@react-three/postprocessing";
import {
  AnimationMixer,
  Box3,
  Vector2,
  Vector3,
  CanvasTexture,
  RepeatWrapping,
  NearestFilter,
  MeshDepthMaterial,
  BasicDepthPacking,
  type Group,
} from "three";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { layout, palette } from "../../design/theme";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
import { ConstructivistEffect } from "./ConstructivistEffect";

export type RecreationData = {
  /** Public-relative path to a rigged GLB (resolved via staticFile). */
  src: string;
  /** Named animation clip; falls back to the first clip in the GLB. */
  clip?: string;
  /** Procedural set behind the character. "none" = bare diorama plane. */
  set?: "senate" | "none";
  /**
   * "beauty"        = graded photoreal-ish diorama (Mode A).
   * "constructivist" = NPR screenprint register (tritone ink/gold/bone +
   *                    halftone + grain) — the brand-coherent acted-motion look.
   * "depth"         = clean depth control pass (no post/grade) — input to an AI
   *                    restyle model (Wan / Runway) for the photoreal Mode B.
   */
  renderMode?: "beauty" | "constructivist" | "depth";
  durationSec?: number;
};

/** Rigged character — Suspense-loaded, normalized, pose sampled off the frame. */
const Character: React.FC<{ src: string; clip?: string }> = ({ src, clip }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { scene, animations } = useGLTF(src);

  const { object, mixer } = useMemo(() => {
    // Clone so the cached GLTF isn't mutated (and to allow reuse/instancing).
    const obj = cloneSkeleton(scene) as Group;
    obj.traverse((o) => {
      o.frustumCulled = false;
    });

    // Normalize any GLB to a known height, centered, feet on the ground.
    // updateMatrixWorld FIRST — otherwise Box3.setFromObject reads stale
    // identity matrices and returns a wrong (often tiny) box → invisible.
    obj.updateMatrixWorld(true);
    const box = new Box3().setFromObject(obj);
    const size = new Vector3();
    box.getSize(size);
    const center = new Vector3();
    box.getCenter(center);
    const targetHeight = 1.7;
    const s = Number.isFinite(size.y) && size.y > 1e-4 ? targetHeight / size.y : 1;
    obj.scale.setScalar(s);
    obj.position.set(-center.x * s, -box.min.y * s, -center.z * s);

    const m = new AnimationMixer(obj);
    const clipObj =
      (clip && animations.find((a) => a.name === clip)) || animations[0];
    if (clipObj) m.clipAction(clipObj).reset().play();
    return { object: obj, mixer: m };
  }, [scene, animations, clip]);

  // Absolute-time sampling — deterministic, no delta accumulation.
  mixer.setTime(frame / fps);

  return <primitive object={object} />;
};

/** Slow dolly down the aisle + gentle sway, driven off the frame. */
const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { camera } = useThree();
  const t = frame / fps;
  const sway = Math.sin(t * 0.3) * 0.6;
  const z = 7.0 - t * 0.25;
  // Low-ish camera looking UP the aisle so the arcade + columns tower (grander,
  // more heroic) and the bold floor doesn't dominate the lower frame.
  camera.position.set(sway, 1.9, z);
  camera.lookAt(0, 3.4, -8);
  return null;
};

/** Classical column silhouette (base · tapered shaft · capital) for LatheGeometry. */
const COLUMN_PROFILE: Vector2[] = [
  [0.0, 0.0],
  [0.66, 0.0],
  [0.66, 0.2],
  [0.52, 0.34],
  [0.48, 0.5],
  [0.4, 4.4],
  [0.46, 4.55],
  [0.66, 4.8],
  [0.66, 5.1],
  [0.0, 5.1],
].map(([x, y]) => new Vector2(x, y));

/** One revolved classical column. */
const Column: React.FC<{ x: number; z: number }> = ({ x, z }) => (
  <mesh position={[x, 0, z]}>
    <latheGeometry args={[COLUMN_PROFILE, 28]} />
    <meshStandardMaterial color={palette.bone} />
  </mesh>
);

const COLUMN_ROWS_Z = [3, -0.2, -3.4, -6.6, -9.8, -13, -16.2];
const COL_X = 4.0;

/** Procedural Roman-senate interior — colonnade, entablature, coffered ceiling,
 *  tiered benches, back niche + statue, dais steps, checkered marble floor. */
const SenateSet: React.FC = () => {
  const floorTexture = useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 64;
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = palette.sand;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = palette.umber;
    ctx.fillRect(0, 0, size / 2, size / 2);
    ctx.fillRect(size / 2, size / 2, size / 2, size / 2);
    const tex = new CanvasTexture(c);
    tex.wrapS = tex.wrapT = RepeatWrapping;
    tex.repeat.set(28, 28);
    tex.magFilter = NearestFilter;
    return tex;
  }, []);

  // Coffered-ceiling ribs — a recessed grid of beams overhead.
  const ceilingRibs = useMemo(() => {
    const ribs: {
      key: string;
      pos: [number, number, number];
      size: [number, number, number];
    }[] = [];
    for (let i = 0; i <= 7; i++) {
      ribs.push({ key: `cz${i}`, pos: [0, 7.0, 3 - i * 3.2], size: [12.6, 0.45, 0.45] });
    }
    for (let i = -2; i <= 2; i++) {
      ribs.push({ key: `cx${i}`, pos: [i * 3.0, 7.0, -6.6], size: [0.45, 0.45, 22] });
    }
    return ribs;
  }, []);

  return (
    <group>
      {/* checkered marble floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -6]}>
        <planeGeometry args={[56, 56]} />
        {floorTexture ? (
          <meshStandardMaterial map={floorTexture} />
        ) : (
          <meshStandardMaterial color={palette.sand} />
        )}
      </mesh>

      {/* colonnade flanking the central aisle */}
      {COLUMN_ROWS_Z.map((z) => (
        <React.Fragment key={z}>
          <Column x={-COL_X} z={z} />
          <Column x={COL_X} z={z} />
        </React.Fragment>
      ))}

      {/* Arcade: semicircular arches springing between consecutive columns. */}
      {[-COL_X, COL_X].map((x) =>
        COLUMN_ROWS_Z.slice(0, -1).map((z, i) => (
          <mesh
            key={`arch${x}-${i}`}
            position={[x, 5.05, (z + COLUMN_ROWS_Z[i + 1]) / 2]}
            rotation={[0, Math.PI / 2, 0]}
          >
            <torusGeometry args={[1.6, 0.22, 10, 28, Math.PI]} />
            <meshStandardMaterial color={palette.bone} />
          </mesh>
        )),
      )}
      {/* Cornice beam riding atop the arcade. */}
      {[-COL_X, COL_X].map((x) => (
        <mesh key={`ent${x}`} position={[x, 6.85, -6.6]}>
          <boxGeometry args={[1.5, 0.6, 21]} />
          <meshStandardMaterial color={palette.bone} />
        </mesh>
      ))}

      {/* coffered ceiling — dark plane + recessed rib grid */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 7.3, -6.6]}>
        <planeGeometry args={[13, 22]} />
        <meshStandardMaterial color={palette.walnut} />
      </mesh>
      {ceilingRibs.map((r) => (
        <mesh key={r.key} position={r.pos}>
          <boxGeometry args={r.size} />
          <meshStandardMaterial color={palette.umber} />
        </mesh>
      ))}

      {/* tiered senator benches along both sides */}
      {[-1, 1].map((side) =>
        [0, 1, 2].map((tier) => (
          <mesh
            key={`bench${side}-${tier}`}
            position={[side * (4.9 + tier * 0.5), 0.4 + tier * 0.55, -6.6]}
          >
            <boxGeometry args={[0.9, 0.5, 18]} />
            <meshStandardMaterial color={palette.walnut} />
          </mesh>
        )),
      )}

      {/* side walls behind the benches */}
      {[-6.4, 6.4].map((x) => (
        <mesh key={`wall${x}`} position={[x, 3.7, -6.6]}>
          <boxGeometry args={[0.5, 7.6, 22]} />
          <meshStandardMaterial color={palette.walnut} />
        </mesh>
      ))}

      {/* back wall + recessed niche */}
      <mesh position={[0, 3.7, -17.4]}>
        <boxGeometry args={[13.5, 7.6, 0.5]} />
        <meshStandardMaterial color={palette.midnight} />
      </mesh>
      <mesh position={[0, 3.0, -17.1]}>
        <boxGeometry args={[3.4, 5.2, 0.3]} />
        <meshStandardMaterial color={palette.ink} />
      </mesh>

      {/* dais steps up to the head of the chamber */}
      {[0, 1, 2].map((s) => (
        <mesh key={`step${s}`} position={[0, 0.2 + s * 0.34, -13.4 - s * 0.7]}>
          <boxGeometry args={[7 - s * 1.1, 0.34, 1.4]} />
          <meshStandardMaterial color={palette.sand} />
        </mesh>
      ))}

      {/* Robed standing statue in the niche — wide robe, narrower torso, head. */}
      <mesh position={[0, 0.55, -16.4]}>
        <boxGeometry args={[1.5, 1.1, 1.5]} />
        <meshStandardMaterial color={palette.bone} />
      </mesh>
      <mesh position={[0, 1.95, -16.4]}>
        <coneGeometry args={[0.55, 1.7, 24]} />
        <meshStandardMaterial color={palette.bone} />
      </mesh>
      <mesh position={[0, 2.95, -16.4]}>
        <cylinderGeometry args={[0.24, 0.34, 0.75, 16]} />
        <meshStandardMaterial color={palette.bone} />
      </mesh>
      <mesh position={[0, 3.5, -16.4]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={palette.bone} />
      </mesh>
    </group>
  );
};

/**
 * Mode B: override the whole scene with a depth material so the render is a
 * clean depth control pass (near = bright, far = dark) for an AI restyle model.
 * Lighting/materials/post are bypassed — geometry depth only.
 */
const DepthMode: React.FC<{ active: boolean }> = ({ active }) => {
  const { scene } = useThree();
  const mat = useMemo(
    () => new MeshDepthMaterial({ depthPacking: BasicDepthPacking }),
    [],
  );
  scene.overrideMaterial = active ? mat : null;
  useEffect(
    () => () => {
      scene.overrideMaterial = null;
    },
    [scene],
  );
  return null;
};

export const Recreation: React.FC<{ data: RecreationData }> = ({ data }) => {
  const src = staticFile(data.src);
  const depth = data.renderMode === "depth";
  const constructivist = data.renderMode === "constructivist";
  const beauty = !depth && !constructivist;
  // 3D motion lives in the camera (CameraRig); noDrift disables the CSS Ken
  // Burns and keeps only the canonical exit fade.
  const { style } = useCompositionAnimation({ noDrift: true });
  return (
    <AbsoluteFill style={{ backgroundColor: palette.ink, ...style }}>
      <ThreeCanvas
        width={layout.width}
        height={layout.height}
        camera={{
          fov: 40,
          position: [1.9, 2.2, 7.0],
          // Depth mode brackets near/far tightly around the set so the depth
          // gradient spreads across the scene (default far=1000 crushes it to
          // black). Beauty mode keeps the standard range.
          near: depth ? 2 : 0.1,
          far: depth ? 26 : 1000,
        }}
        gl={{ antialias: true }}
      >
        {depth ? (
          <color attach="background" args={[0, 0, 0]} />
        ) : (
          <color attach="background" args={[palette.ink]} />
        )}
        {/* Raking key + soft opposite fill → deep shadows (ink) and bright lit
            faces (bone), with enough fill that architecture isn't pure black.
            Warm point light at the brazier = focal pool. */}
        {/* Atmospheric fog → far colonnade recedes into ink (depth + focus). */}
        <fog attach="fog" args={[palette.ink, 13, 38]} />
        <ambientLight intensity={0.42} />
        <hemisphereLight args={[palette.bone, palette.ink, 0.4]} />
        <directionalLight position={[7, 6, 2]} intensity={2.6} />
        <directionalLight position={[-6, 3, 4]} intensity={0.9} />
        <pointLight
          position={[0, 3.0, -15.0]}
          intensity={34}
          distance={14}
          decay={2}
          color={palette.gold}
        />
        <CameraRig />
        <DepthMode active={depth} />
        <React.Suspense fallback={null}>
          <Character src={src} clip={data.clip} />
        </React.Suspense>
        {/* Set: procedural senate interior, or a bare diorama plane */}
        {data.set === "senate" ? (
          <SenateSet />
        ) : (
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
            <planeGeometry args={[40, 40]} />
            <meshStandardMaterial color={palette.midnight} />
          </mesh>
        )}

        {/* Diorama post + Parallax grade. All effects are static per frame
            (no time-driven randomness) so the render stays deterministic.
            DepthOfField focuses on the figure → the "miniature" look;
            HueSaturation/BrightnessContrast pull toward the warm, slightly
            desaturated Parallax register; ChromaticAberration + Vignette add
            the documentary-lens fringing and edge falloff. */}
        {/* Mode A — photoreal-ish graded diorama. */}
        {beauty && (
          <EffectComposer>
            <DepthOfField target={[0, 0.9, 0]} focalLength={0.025} bokehScale={4} />
            <HueSaturation saturation={-0.12} />
            <BrightnessContrast brightness={-0.02} contrast={0.1} />
            <ChromaticAberration offset={[0.0009, 0.0009]} />
            <Vignette offset={0.25} darkness={0.6} />
          </EffectComposer>
        )}

        {/* Constructivist — NPR screenprint register (the brand-coherent look).
            The 3D lighting does the form; this quantizes it to ink/gold/bone +
            halftone + grain. */}
        {constructivist && (
          <EffectComposer>
            <ConstructivistEffect
              ink={palette.ink}
              gold={palette.gold}
              bone={palette.bone}
              t0={0.3}
              t1={0.6}
              dot={0.0}
            />
            <Vignette offset={0.3} darkness={0.5} />
          </EffectComposer>
        )}

        {/* Depth pass (Mode B input) renders raw — no composer. */}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
