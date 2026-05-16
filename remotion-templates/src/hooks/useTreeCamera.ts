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
import {
  computeStepBoundaries,
  getCurrentStepIndex,
  getStepProgress,
  motionEasings,
} from "../utils/stepFramework";

// Destructure at file top so call sites read as `track` / `zoom`
// (snap isn't used in this hook — tree camera transitions are always smooth).
const { track, zoom } = motionEasings;

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

// ── Easing presets — imported from stepFramework ────────────────────────────
// `track` / `zoom` destructured from `motionEasings` above. Remotion's
// `Easing` is still imported directly for getNodeScale's spring-settle curve
// (a one-off in-out-cubic that isn't shared with the other camera hooks).

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
  const stepBoundaries = useMemo(
    () => computeStepBoundaries(cameraPath.map((s) => sec(s.duration))),
    [cameraPath],
  );

  // ── Find current step and compute camera position ──────────────────
  const stepIndex = getCurrentStepIndex(frame, stepBoundaries);

  const currentStep = cameraPath[stepIndex];
  const currentBounds = stepBoundaries[stepIndex];
  const stepStart = currentBounds.start;
  const stepProgress = getStepProgress(frame, currentBounds);

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
    { ...CLAMP_OPTS, easing: track }
  );

  // Zoom interpolates slightly faster (settles before pan completes)
  const zoomProgress = interpolate(
    frame,
    [stepStart, stepStart + Math.max(transitionFrames * 0.75, sec(0.3))],
    [0, 1],
    { ...CLAMP_OPTS, easing: zoom }
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
    { ...CLAMP_OPTS, easing: track }
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
 *
 * Two sequences depending on whether a `highlightedPath` is provided:
 *
 * 1. **Highlighted-path mode (the editorial default)** — the camera ARGUES
 *    rather than inventories. Establish on root → reveal the fork (level-1
 *    children visible) → drive the chosen path leaf-by-leaf → glance at one
 *    named counterfactual (the most-visually-adjacent unchosen leaf, for
 *    the "bounded analogy" beat) → return to the chosen leaf and hold.
 *    This matches Parallax's bounded-analogy doctrine: name the structural
 *    pattern, acknowledge one place it breaks, return to the argument.
 *
 * 2. **No-highlighted-path mode** — a simpler inventory tour: establish →
 *    pullback. This is the fallback for trees whose author hasn't yet named
 *    a protagonist branch; the audit-skill flags this as a failure mode
 *    (see decision-tree.md "tree with no highlightedPath" failure).
 *
 * The previous default (root close-up → branch reveal → each leaf path →
 * full pullback) was an inventory tour — it presented all branches as
 * equally weighted possibilities. Editorial canon: the camera embodies the
 * argument. May 13, 2026 polish pass — see references/template-research/
 * decision-tree.md § 3 item 9.
 */
export function generateDefaultCameraPath(
  rootId: string,
  nodes: Array<{ id: string; children?: string[] }>,
  totalDurationSec: number,
  highlightedPath?: string[],
): CameraTarget[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // ── Highlighted-path mode: the editorial argument camera ───────────────
  if (highlightedPath && highlightedPath.length >= 2) {
    const chosenLeaf = highlightedPath[highlightedPath.length - 1];
    const pathIds = new Set(highlightedPath);

    // Pick the "glance" target — an unchosen leaf to briefly look at. We
    // prefer a level-1 unchosen sibling of the chosen path's first step
    // (the most editorially-comparable counterfactual). If none exists,
    // fall back to any leaf not on the path.
    const root = nodeMap.get(rootId);
    const level1Chosen = highlightedPath[1];
    const level1Unchosen = (root?.children ?? []).filter(
      (c) => c !== level1Chosen,
    );
    // Find a leaf descending from the first unchosen sibling.
    let glanceTarget: string | undefined;
    const descendToLeaf = (id: string): string => {
      const n = nodeMap.get(id);
      if (!n?.children || n.children.length === 0) return id;
      return descendToLeaf(n.children[0]);
    };
    if (level1Unchosen.length > 0) {
      glanceTarget = descendToLeaf(level1Unchosen[0]);
    } else {
      // Fallback: any leaf not on the chosen path
      const allLeaves: string[] = [];
      const findLeaves = (id: string) => {
        const n = nodeMap.get(id);
        if (!n?.children || n.children.length === 0) {
          allLeaves.push(id);
          return;
        }
        for (const c of n.children) findLeaves(c);
      };
      findLeaves(rootId);
      glanceTarget = allLeaves.find((l) => !pathIds.has(l));
    }

    // Time budget: establish 12% / fork 14% / drive 50% (split across path
    // nodes after root) / glance 12% / return-and-hold 12%.
    const establishDur = totalDurationSec * 0.12;
    const forkDur = totalDurationSec * 0.14;
    const driveDur = totalDurationSec * 0.50;
    const glanceDur = glanceTarget ? totalDurationSec * 0.12 : 0;
    const holdDur =
      totalDurationSec * 0.12 + (glanceTarget ? 0 : totalDurationSec * 0.12);

    const driveSteps = highlightedPath.slice(1); // skip root, already established
    const perDriveDur = driveDur / Math.max(driveSteps.length, 1);

    const steps: CameraTarget[] = [];

    // Zoom budget — capped at 1.35 to keep the tree from extending into
    // the title safe area (title block at y≈80–280; at zoom > 1.4 a 3-level
    // tree's mid-level row crashes into the title). The argument-camera
    // works through framing and dimming, not through aggressive zoom.
    const ESTABLISH_ZOOM = 1.8;
    const FORK_ZOOM = 1.1;
    const DRIVE_ZOOM_MIN = 1.2;
    const DRIVE_ZOOM_MAX = 1.35;
    const GLANCE_ZOOM = 1.2;
    const HOLD_ZOOM = 1.35;

    // 1. ESTABLISH on root — close-up framing. "One question."
    steps.push({
      focus: rootId,
      zoom: ESTABLISH_ZOOM,
      duration: establishDur,
    });

    // 2. FORK — pull back to fit the whole decision space. The branches
    //    become visible; camera frames the choice.
    steps.push({
      focus: rootId,
      zoom: FORK_ZOOM,
      duration: forkDur,
    });

    // 3. DRIVE — walk down the chosen path, dim others. Each node held for
    //    perDriveDur seconds. Zoom tightens slightly as we descend toward
    //    the leaf — the analogy is sharpening into focus.
    driveSteps.forEach((nodeId, i) => {
      const zoom =
        DRIVE_ZOOM_MIN +
        (i / Math.max(driveSteps.length - 1, 1)) *
          (DRIVE_ZOOM_MAX - DRIVE_ZOOM_MIN);
      steps.push({
        focus: nodeId,
        zoom,
        duration: perDriveDur,
        dimOthers: true,
      });
    });

    // 4. GLANCE — brief pan to one named counterfactual leaf. Bounded
    //    analogy: "...but here's where this analogy breaks." Short budget,
    //    enough for the eye to land + register the contrast, not enough to
    //    inventory possibilities.
    if (glanceTarget) {
      steps.push({
        focus: glanceTarget,
        zoom: GLANCE_ZOOM,
        duration: glanceDur,
        dimOthers: true,
      });
    }

    // 5. RETURN & HOLD on the chosen leaf — the argument's destination.
    steps.push({
      focus: chosenLeaf,
      zoom: HOLD_ZOOM,
      duration: holdDur,
      dimOthers: true,
    });

    return steps;
  }

  // ── Fallback: no highlightedPath → simpler inventory tour ─────────────
  // (The audit-skill should have flagged this; here we render a coherent
  // sequence anyway so the comp doesn't break in early drafts.)
  return [
    {
      focus: rootId,
      zoom: 2.0,
      duration: totalDurationSec * 0.3,
    },
    {
      focus: rootId,
      zoom: 1.0,
      duration: totalDurationSec * 0.7,
    },
  ];
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
