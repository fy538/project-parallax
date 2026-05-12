/**
 * dorling — Dorling-cartogram decollision via d3-force.
 *
 * A Dorling cartogram places one CIRCLE per region, sized by data value,
 * de-collided so the circles don't overlap. The result is a topology-
 * preserving abstract map — circle positions roughly match country
 * locations, but no two circles overlap so each value reads cleanly.
 *
 * Trade-off vs. ProportionalSymbolMap: ProportionalSymbolMap keeps circles
 * at TRUE centroids (geographic honesty preserved; circles overlap in
 * dense regions like Europe). Dorling sacrifices some geographic precision
 * for guaranteed legibility — every circle is fully visible at its data
 * size.
 *
 * When to use which:
 *   - ProportionalSymbolMap: 5-12 countries, mostly non-adjacent
 *     (e.g., chip-fab nations across Asia + EU + Americas)
 *   - CartogramMap: 15+ countries, dense regions (e.g., European
 *     election cartogram, NATO members, EU GDP)
 *
 * Algorithm: d3-force simulation with:
 *   - x/y forces pulling each circle toward its target centroid
 *   - collide force pushing apart any overlapping pair
 *   - bounds clamp so circles stay inside the viewport
 *
 * Runs ~120 iterations once (NOT per frame) — Remotion's deterministic
 * render needs a stable result, and the force simulation converges in
 * tens of ms for ~30 circles.
 *
 * Reference: Daniel Dorling (1996), "Area Cartograms: Their Use and
 * Creation."
 */

import {
  forceSimulation,
  forceX,
  forceY,
  forceCollide,
  type SimulationNodeDatum,
} from "d3-force";

// ── Types ─────────────────────────────────────────────────────────────────

export interface DorlingNodeInput {
  /** Stable identifier (typically alpha-3 code). */
  id: string;
  /** Initial position (typically projected country centroid in pixels). */
  targetX: number;
  targetY: number;
  /** Desired radius in pixels (already computed via sqrt scaling). */
  radius: number;
}

export interface DorlingNodeOutput extends DorlingNodeInput {
  /** Final post-decollision position. */
  x: number;
  y: number;
}

export interface DorlingViewport {
  width: number;
  height: number;
  /** Padding (px) inside which circles are kept. Default 40. */
  padding?: number;
}

// ── Decollision ───────────────────────────────────────────────────────────

/**
 * Run the Dorling decollision simulation. Returns nodes with their
 * de-collided final positions. Pure function — same inputs → same outputs
 * (force simulation is deterministic when initial conditions are fixed).
 *
 * @param nodes - input nodes with target positions + radii
 * @param viewport - frame dimensions for bounds clamping
 * @param iterations - simulation steps (default 120; convergence is
 *   typically reached by ~80, more iterations smooth out residual overlap)
 * @param xyStrength - pull toward target position (default 0.1).
 *   Higher = more geographic faithfulness, lower = more aggressive
 *   decollision.
 */
export const runDorlingLayout = (
  nodes: readonly DorlingNodeInput[],
  viewport: DorlingViewport,
  iterations: number = 120,
  xyStrength: number = 0.1,
): DorlingNodeOutput[] => {
  // De-duplicate by id BEFORE building sim nodes. d3-force's `forceCollide`
  // adds random jiggle when two nodes are at identical positions to break
  // ties (would otherwise zero-divide the separation vector). The jiggle
  // is internally seeded but renders that share node-creation order across
  // frames can yield slightly different layouts when the seed advances
  // differently. Easiest fix: ensure inputs are unique-by-id. Duplicate
  // entries collapse to the FIRST occurrence (author error rather than
  // data-driven dedup).
  type SimNode = SimulationNodeDatum & DorlingNodeInput;
  const seen = new Set<string>();
  const deduped: DorlingNodeInput[] = [];
  for (const n of nodes) {
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    deduped.push(n);
  }
  // d3-force mutates the sim nodes in place; build fresh copies so callers'
  // input objects aren't touched.
  const simNodes: SimNode[] = deduped.map((n) => ({
    id: n.id,
    targetX: n.targetX,
    targetY: n.targetY,
    radius: n.radius,
    x: n.targetX,
    y: n.targetY,
  }));

  const simulation = forceSimulation(simNodes)
    .force("x", forceX<SimNode>((d) => d.targetX).strength(xyStrength))
    .force("y", forceY<SimNode>((d) => d.targetY).strength(xyStrength))
    // collide adds a 0.5px gap between circles so they're visually separated
    .force("collide", forceCollide<SimNode>((d) => d.radius + 0.5).iterations(2))
    .stop();

  // Run synchronously — Remotion needs deterministic single-frame results.
  for (let i = 0; i < iterations; i++) {
    simulation.tick();
  }

  // Clamp to viewport bounds (the force simulation can push nodes slightly
  // outside; this final pass guarantees they stay inside the safe area).
  const padding = viewport.padding ?? 40;
  return simNodes.map((n) => ({
    id: n.id,
    targetX: n.targetX,
    targetY: n.targetY,
    radius: n.radius,
    x: Math.max(padding + n.radius, Math.min(viewport.width - padding - n.radius, n.x ?? n.targetX)),
    y: Math.max(padding + n.radius, Math.min(viewport.height - padding - n.radius, n.y ?? n.targetY)),
  }));
};
