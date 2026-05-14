/**
 * ArcDiagram template types.
 *
 * Nodes on a horizontal baseline, connected by semicircular arcs above.
 * The editorial form for INFLUENCE, LINEAGE, and SUCCESSION stories
 * where the natural ordering (time, generation, hierarchy) matters and
 * the question is "who connects forward to whom across the sequence."
 *
 * ── When to use this template ─────────────────────────────────────────
 *
 * USE for:
 *   - Intellectual lineage ("Mahan → Mackinder → Spykman → Kennan")
 *   - Succession chains (emperors, regimes, party leaders)
 *   - Causation across a timeline ("Treaty X enables Doctrine Y enables War Z")
 *   - Citation / influence graphs where time ordering is fixed
 *   - Sequential events with non-adjacent skip-connections
 *
 * DO NOT USE when:
 *   - Entities have no natural ordering (use NetworkDiagram bipartite/hub-spoke)
 *   - Geography is editorially meaningful (use ChoroplethMap or RouteAnimation)
 *   - The story is magnitude concentration, not relationship (use Isotype/DataChart)
 *
 * ── Visual form ──────────────────────────────────────────────────────
 *
 * Node positions are determined by ARRAY ORDER (left to right). Arcs
 * are drawn as quadratic-bezier curves above the baseline; arc apex
 * height is clamped so wide spans don't shoot off the top of the
 * canvas. Skip-connections (non-adjacent arcs) read as the editorial
 * point — "this idea jumped two generations."
 *
 * Editorial precedents: NYT Upshot for lobbying-network co-occurrence;
 * Sloan Digital Sky Survey for genome adjacency (NYT 2007); Lev Manovich
 * for cultural-influence diagrams.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface ArcNode {
  id: string;
  label: string;
  /** Secondary line under the label (e.g., role, dates, affiliation). */
  sublabel?: string;
  /** Color token from theme.ts or hex. Defaults to theme.text.primary. */
  color?: string;
  /**
   * Editorial hierarchy. `primary` nodes get a larger disc and heavier
   * label weight — reserve for the protagonist(s) of the lineage.
   * Default `secondary` (uniform small disc).
   */
  importance?: "primary" | "secondary";
  /**
   * Optional axis stamp shown ABOVE the node (e.g., "1890", "Han").
   * Reads as a date / era marker — useful when the lineage is temporal.
   */
  axisStamp?: string;
}

export interface ArcConnection {
  /** Source node id. */
  from: string;
  /** Destination node id. */
  to: string;
  /**
   * Short label rendered near the arc's apex (e.g., "extended",
   * "rebutted", "synthesized"). Keep under ~16 chars.
   */
  label?: string;
  /**
   * Visual strength. 0.4–1.0 typical. Higher → thicker stroke + more
   * opaque arc. Reserve 1.0 for the editorial-hero connections.
   */
  strength?: number;
  /** Connection register. Default "solid". */
  style?: "solid" | "dashed";
  /**
   * Color override. Brand token "accent" resolves to amber; otherwise
   * any hex / palette token. Defaults to theme.text.muted.
   */
  color?: string;
}

export interface ArcDiagramData {
  episode: string;
  title: string;
  subtitle?: string;

  /** Nodes in editorial order (left = earliest / first). */
  nodes: ArcNode[];
  /** Arcs / connections between nodes. */
  connections: ArcConnection[];

  /**
   * Show the horizontal baseline beneath the nodes. Default `true`.
   * Set `false` for a pure-floating-arcs look (rare; usually you want
   * the baseline as visual anchor).
   */
  showBaseline?: boolean;

  /**
   * Optional axis title (e.g., "Century", "Generation"). Rendered as
   * a small caps label above the leftmost arc apex.
   */
  axisTitle?: string;

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;
  _direction?: DirectionBlock;
}
