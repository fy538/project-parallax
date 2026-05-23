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

import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useGLTF } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { AnimationMixer, Box3, Vector3, type Group } from "three";
import { clone as cloneSkeleton } from "three/addons/utils/SkeletonUtils.js";
import { layout, palette } from "../../design/theme";
import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";

export type RecreationData = {
  /** Public-relative path to a rigged GLB (resolved via staticFile). */
  src: string;
  /** Named animation clip; falls back to the first clip in the GLB. */
  clip?: string;
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

/** Slow cinematic orbit + dolly-in, driven off the frame (deterministic). */
const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { camera } = useThree();
  const t = frame / fps;
  const angle = -0.35 + t * 0.05;
  const radius = 5.5 - t * 0.15;
  camera.position.set(Math.sin(angle) * radius, 1.7, Math.cos(angle) * radius);
  camera.lookAt(0, 0.95, 0);
  return null;
};

export const Recreation: React.FC<{ data: RecreationData }> = ({ data }) => {
  const src = staticFile(data.src);
  // 3D motion lives in the camera (CameraRig); noDrift disables the CSS Ken
  // Burns and keeps only the canonical exit fade.
  const { style } = useCompositionAnimation({ noDrift: true });
  return (
    <AbsoluteFill style={{ backgroundColor: palette.ink, ...style }}>
      <ThreeCanvas
        width={layout.width}
        height={layout.height}
        camera={{ fov: 32, position: [1.9, 1.7, 5.2] }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={[palette.ink]} />
        <ambientLight intensity={0.6} />
        <hemisphereLight args={[palette.bone, palette.ink, 0.7]} />
        <directionalLight position={[4, 8, 3]} intensity={2.6} />
        <CameraRig />
        <React.Suspense fallback={null}>
          <Character src={src} clip={data.clip} />
        </React.Suspense>
        {/* Diorama ground plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color={palette.midnight} />
        </mesh>
      </ThreeCanvas>
    </AbsoluteFill>
  );
};
