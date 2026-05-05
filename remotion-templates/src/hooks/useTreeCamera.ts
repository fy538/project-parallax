/**
 * useTreeCamera — virtual camera system for tree/graph visualizations.
 *
 * Instead of cramming a tree into a fixed viewport, this hook renders the
 * tree at full internal scale and animates a virtual camera (scale + translate)
 * to zoom/pan between nodes. The result feels like a documentary zooming into
 * a war-room map — cinematic, narrative, engaging.
 *
 * Architecture:
 *   - Tree content is rendered into an oversized container (e.g., 2× canvas)
 *   - This hook returns a `viewportStyle` and `contentStyle`:
 *       viewportStyle: overflow:hidden, full canvas size
 *       contentStyle: transform with animated scale() + translate()
 *   - Each CameraStep targets a node ID, zoom level, and duration
 *   - The hook interpolates between steps with easeInOutCubic for cinema feel
 *   - A 200ms settle delay offsets pan after zoom for natural motion
 *
 * Per-node effects:
 *   - `getNodeDim(nodeId)`: returns 0–1 dimming factor (0 = fully visible)
 *   - `getNodeScale(nodeId)`: returns scale multiplier for focused node pop
 *   - `focusNodeId`: which node the camera is currently targeting
 *
 * Usage:
 *   const camera = useTreeCamera({
 *     positions,       // Map<string, { x, y }>
 *     cameraPath,      // CameraStep[]
 *     canvasWidth: 1920,
 *     canvasHeight: 1080,
 *     nodeWidth: 240,
 *     nodeHeight: 72,
 *   });
 *
 *   <div style={camera.viewportStyle}>
 *     <div style={camera.contentStyle}>
 *       {nodes...}
 *     </div>
 *   </div>
 */

import { useMemo } from "react";
import { useCurrentFrame, interpolate, Easing } from "remotion";
import { sec } from "../design/theme";

// ── Types ──────────────────────────────────────────────────────────────────

export interface CameraTarget {
  /** Node ID to center on */
  focus: string;
  /** Zoom level: 1.0 = fit full tree, 2.0+ = close-up */
  zoom: number;
  /** Duration of this step in seconds */
  duration: number;
  /** Dim nodes not on the path from root to this node */
  dimOthers?: boolean;
  /** Optional overlay label */
  label?: string;
}

export interface NodePosition {
  x: number;
  y: number;
}

export interface UseTreeCameraOptions {
  /** Map of nodeId → pixel position (top-left corner of node) */
  positions: Map<string, NodePosition>;
  /** Camera keyframe sequence */
  cameraPath: CameraTarget[];
  /** Canvas dimensions (Remotion composition size) */
  canvasWidth: number;
  canvasHeight: number;
  /** Node dimensions for center-point calculation */
  nodeWidth: number;
  nodeHeight: number;
  /** Tree structure for path-based dimming: Map<nodeId, parentId> */
  parentMap?: Map<string, string>;
  /** Transition duration between steps in seconds (default: 0.6) */
  transitionSec?: number;
}

export interface TreeCameraState {
  /** Style for the outer viewport (overflow:hidden, full canvas) */
  viewportStyle: React.CSSProperties;
  /** Style for the inner content container (animated transform) */
  contentStyle: React.CSSProperties;
  /** Current focus node ID */
  focusNodeId: string;
  /** Current camera step index */
  stepIndex: number;
  /** Progress within current step (0–1) */
  stepProgress: number;
  /** Get dimming factor for a node (0 = fully visible, 1 = fully dimmed) */
  getNodeDim: (nodeId: string) => number;
  /** Get scale multiplier for a node (focused node pops to ~1.08) */
  getNodeScale: (nodeId: string) => number;
  /** Current camera zoom level */
  currentZoom: number;
  /** Current step's label (if any) */
  currentLabel: string | undefined;
}

// ── Easing presets ─────────────────────────────────────────────────────────

/** Cinematic camera move: smooth start and end */
const CAMERA_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);

/** Zoom ease: slightly faster out for snappy settle */
const ZOOM_EASE = Easing.bezier(0.22, 0.68, 0.36, 1);

const CLAMP_OPTS = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Get ancestors of a node (including itself) for path-based dimming */
function getAncestors(
  nodeId: string,
  parentMap: Map<string, string>
): Set<string> {
  const ancestors = new Set<string>();
  let current: string | undefined = nodeId;
  while (current) {
    ancestors.add(current);
    current = parentMap.get(current);
  }
  return ancestors;
}

/** Get all descendants of a node */
function getDescendants(
  nodeId: string,
  childrenMap: Map<string, string[]>
): Set<string> {
  const desc = new Set<string>();
  const queue = [nodeId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    desc.add(id);
    const children = childrenMap.get(id);
    if (children) {
      for (const c of children) queue.push(c);
    }
  }
  return desc;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export const useTreeCamera = (opts: UseTreeCameraOptions): TreeCameraState => {
  const {
    positions,
    cameraPath,
    canvasWidth,
    canvasHeight,
    nodeWidth,
    nodeHeight,
    parentMap,
    transitionSec = 0.6,
  } = opts;

  const frame = useCurrentFrame();
  const transitionFrames = sec(transitionSec);

  // ── Build cumulative frame boundaries for each step ────────────────
  const stepBoundaries = useMemo(() => {
    const boundaries: Array<{ start: number; end: number; holdEnd: number }> = [];
    let cumulative = 0;
    for (const step of cameraPath) {
      const stepFrames = sec(step.duration);
      boundaries.push({
        start: cumulative,
        end: cumulative + stepFrames,
        holdEnd: cumulative + stepFrames,
      });
      cumulative += stepFrames;
    }
    return boundaries;
  }, [cameraPath]);

  // ── Find current step and compute camera position ──────────────────
  let stepIndex = cameraPath.length - 1;
  for (let i = 0; i < stepBoundaries.length; i++) {
    if (frame < stepBoundaries[i].end) {
      stepIndex = i;
      break;
    }
  }

  const currentStep = cameraPath[stepIndex];
  const stepStart = stepBoundaries[stepIndex].start;
  const stepEnd = stepBoundaries[stepIndex].end;
  const stepProgress = interpolate(
    frame,
    [stepStart, stepEnd],
    [0, 1],
    CLAMP_OPTS
  );

  // ── Compute camera target position (center of focused node) ─────────
  const getNodeCenter = (nodeId: string): { cx: number; cy: number } => {
    const pos = positions.get(nodeId);
    if (!pos) return { cx: canvasWidth / 2, cy: canvasHeight / 2 };
    return {
      cx: pos.x + nodeWidth / 2,
      cy: pos.y + nodeHeight / 2,
    };
  };

  // Current and previous step targets for smooth interpolation
  const prevStep = stepIndex > 0 ? cameraPath[stepIndex - 1] : currentStep;
  const prevCenter = getNodeCenter(prevStep.focus);
  const currCenter = getNodeCenter(currentStep.focus);

  // Interpolate between previous and current camera positions
  // Use transition at the START of each step (first transitionFrames)
  const moveProgress = interpolate(
    frame,
    [stepStart, stepStart + transitionFrames],
    [0, 1],
    { ...CLAMP_OPTS, easing: CAMERA_EASE }
  );

  // Zoom interpolates slightly faster (settles before pan completes)
  const zoomProgress = interpolate(
    frame,
    [stepStart, stepStart + Math.max(transitionFrames * 0.75, sec(0.3))],
    [0, 1],
    { ...CLAMP_OPTS, easing: ZOOM_EASE }
  );

  const prevZoom = prevStep.zoom;
  const currZoom = currentStep.zoom;
  const currentZoom = interpolate(zoomProgress, [0, 1], [prevZoom, currZoom], CLAMP_OPTS);

  // Camera center in tree-space
  const camCx = interpolate(moveProgress, [0, 1], [prevCenter.cx, currCenter.cx], CLAMP_OPTS);
  const camCy = interpolate(moveProgress, [0, 1], [prevCenter.cy, currCenter.cy], CLAMP_OPTS);

  // ── Compute transform ──────────────────────────────────────────────
  // We want the camera center (camCx, camCy) to appear at the viewport center.
  // After scaling by currentZoom, the point (camCx, camCy) in tree-space is at
  // (camCx * currentZoom, camCy * currentZoom) in screen-space.
  // We want that to map to (canvasWidth/2, canvasHeight/2).
  const translateX = canvasWidth / 2 - camCx * currentZoom;
  const translateY = canvasHeight / 2 - camCy * currentZoom;

  const viewportStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: canvasWidth,
    height: canvasHeight,
    overflow: "hidden",
  };

  const contentStyle: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: canvasWidth,
    height: canvasHeight,
    transform: `translate(${translateX}px, ${translateY}px) scale(${currentZoom})`,
    transformOrigin: "0 0",
    willChange: "transform",
  };

  // ── Per-node effects ───────────────────────────────────────────────

  // Build children map from parentMap for descendant lookups
  const childrenMap = useMemo(() => {
    const cMap = new Map<string, string[]>();
    if (!parentMap) return cMap;
    for (const [childId, pId] of parentMap) {
      if (!cMap.has(pId)) cMap.set(pId, []);
      cMap.get(pId)!.push(childId);
    }
    return cMap;
  }, [parentMap]);

  // Precompute which nodes are "active" for current AND previous steps
  const prevDimOthers = prevStep.dimOthers ?? false;
  const currDimOthers = currentStep.dimOthers ?? false;

  const activeNodes = useMemo(() => {
    if (!currDimOthers || !parentMap) return null;
    const ancestors = getAncestors(currentStep.focus, parentMap);
    const descendants = getDescendants(currentStep.focus, childrenMap);
    return new Set([...ancestors, ...descendants]);
  }, [currentStep.focus, currDimOthers, parentMap, childrenMap]);

  const prevActiveNodes = useMemo(() => {
    if (!prevDimOthers || !parentMap) return null;
    const ancestors = getAncestors(prevStep.focus, parentMap);
    const descendants = getDescendants(prevStep.focus, childrenMap);
    return new Set([...ancestors, ...descendants]);
  }, [prevStep.focus, prevDimOthers, parentMap, childrenMap]);

  // Dim transition (smooth in/out as dimOthers changes between steps)
  const dimTransition = interpolate(
    frame,
    [stepStart, stepStart + transitionFrames],
    [0, 1],
    { ...CLAMP_OPTS, easing: CAMERA_EASE }
  );

  const getNodeDim = (nodeId: string): number => {
    if (!parentMap) return 0;

    // Previous step's dim state (precomputed)
    const prevDim = prevActiveNodes
      ? (prevActiveNodes.has(nodeId) ? 0 : 0.75)
      : 0;

    // Current step's dim state (precomputed)
    const currDim = activeNodes
      ? (activeNodes.has(nodeId) ? 0 : 0.75)
      : 0;

    // Interpolate between prev and curr dim states
    return interpolate(dimTransition, [0, 1], [prevDim, currDim], CLAMP_OPTS);
  };

  const getNodeScale = (nodeId: string): number => {
    if (nodeId !== currentStep.focus) return 1.0;
    // Focused node gets a subtle scale-up with spring settle
    const scaleUp = interpolate(
      frame,
      [stepStart + transitionFrames * 0.5, stepStart + transitionFrames],
      [1.0, 1.08],
      { ...CLAMP_OPTS, easing: Easing.out(Easing.cubic) }
    );
    // Micro-settle back
    const settle = interpolate(
      frame,
      [stepStart + transitionFrames, stepStart + transitionFrames + sec(0.2)],
      [1.08, 1.04],
      CLAMP_OPTS
    );
    return frame < stepStart + transitionFrames ? scaleUp : settle;
  };

  return {
    viewportStyle,
    contentStyle,
    focusNodeId: currentStep.focus,
    stepIndex,
    stepProgress,
    getNodeDim,
    getNodeScale,
    currentZoom,
    currentLabel: currentStep.label,
  };
};

// ── Auto-generate camera path from tree structure ─────────────────────────

/**
 * Generate a default camera path from tree topology.
 * Sequence: root close-up → zoom out for branches → each leaf path → full pullback.
 */
export function generateDefaultCameraPath(
  rootId: string,
  nodes: Array<{ id: string; children?: string[] }>,
  totalDurationSec: number
): CameraTarget[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Find leaf paths (root → each leaf)
  const leafPaths: string[][] = [];
  const findLeaves = (id: string, path: string[]) => {
    const node = nodeMap.get(id);
    const currentPath = [...path, id];
    if (!node?.children || node.children.length === 0) {
      leafPaths.push(currentPath);
      return;
    }
    for (const childId of node.children) {
      findLeaves(childId, currentPath);
    }
  };
  findLeaves(rootId, []);

  const numPaths = leafPaths.length;
  // Time budget: 20% establish, 60% explore paths, 20% pullback
  const establishDur = totalDurationSec * 0.15;
  const branchDur = totalDurationSec * 0.12;
  const pathDur = (totalDurationSec * 0.53) / Math.max(numPaths, 1);
  const pullbackDur = totalDurationSec * 0.2;

  const steps: CameraTarget[] = [];

  // 1. Establish: zoom in on root
  steps.push({
    focus: rootId,
    zoom: 2.2,
    duration: establishDur,
    label: undefined,
  });

  // 2. Branch reveal: zoom out to show immediate children
  steps.push({
    focus: rootId,
    zoom: 1.4,
    duration: branchDur,
  });

  // 3. Each leaf path: zoom to the leaf, dim others
  for (const path of leafPaths) {
    const leafId = path[path.length - 1];
    steps.push({
      focus: leafId,
      zoom: 1.6,
      duration: pathDur,
      dimOthers: true,
    });
  }

  // 4. Full pullback
  steps.push({
    focus: rootId,
    zoom: 1.0,
    duration: pullbackDur,
  });

  return steps;
}

/**
 * Build a parent lookup map from flat node array.
 * Returns Map<childId, parentId>.
 */
export function buildParentMap(
  nodes: Array<{ id: string; children?: string[] }>
): Map<string, string> {
  const map = new Map<string, string>();
  for (const node of nodes) {
    if (node.children) {
      for (const childId of node.children) {
        map.set(childId, node.id);
      }
    }
  }
  return map;
}
