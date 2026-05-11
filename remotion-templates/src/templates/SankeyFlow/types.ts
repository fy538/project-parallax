/**
 * SankeyFlow template types.
 *
 * Animated Sankey/funnel diagrams showing how values flow from
 * sources through intermediate stages to destinations.
 * Used for budget breakdowns, policy cascades, resource flows.
 */

import type { DirectionBlock } from "../../hooks/useDirection";

export interface SankeyNode {
  id: string;
  label: string;
  /** Value (determines node height) */
  value: number;
  color?: string;
  /** Column position (0-indexed from left) */
  column: number;
}

export interface SankeyLink {
  from: string;  // node id
  to: string;    // node id
  /** Flow value (determines link thickness) */
  value: number;
  color?: string;
  label?: string;
  /**
   * Editorial emphasis for this ribbon:
   * - `"accent"` — the load-bearing flow the narration is about; rendered at
   *    full opacity in the link's color.
   * - `"muted"` — context flow; rendered at reduced opacity so the accent
   *    ribbon dominates the eye.
   *
   * Default (omitted) treats all flows equally. When ANY link sets emphasis,
   * other links automatically read as muted relative to accent ribbons.
   *
   * Use to highlight the editorial point without hardcoding colors per-frame.
   * See: references/template-research/sankey-flow.md § 6.2
   */
  emphasis?: "accent" | "muted";
}

export interface SankeyFlowData {
  episode: string;
  title: string;
  subtitle?: string;

  nodes: SankeyNode[];
  links: SankeyLink[];

  /** Show value labels on nodes? Default: true */
  showValues?: boolean;
  /** Value format unit (e.g., "$", "B", "%") */
  valuePrefix?: string;
  valueSuffix?: string;

  /**
   * Optional column header labels rendered above each Sankey column
   * (e.g., ["Production", "Use", "Fate"]). Makes the conservation framing
   * explicit — "values in = values out" — which is the whole point of a
   * Sankey. Without column headers, the diagram reads as a flow chart;
   * with them, it reads as a budget.
   *
   * Length should match the number of columns (max(node.column) + 1).
   * See: references/template-research/sankey-flow.md § 6
   */
  columnHeaders?: string[];

  /**
   * Source-total kicker rendered top-left as a prominent stat
   * (e.g., "8.3K Mt produced 1950–2017"). Names the conservation total
   * explicitly so the viewer knows what 100% means. Pair with `source`
   * for full attribution.
   *
   * See: references/template-research/sankey-flow.md § 6
   */
  sourceTotal?: {
    /** The big number / phrase (e.g., "8.3K Mt"). Plex Sans display weight. */
    value: string;
    /** Sub-line context (e.g., "global plastic produced 1950–2017"). */
    context?: string;
  };

  /**
   * Auto-aggregate minor terminal nodes into a single "Other" bucket to
   * prevent unreadable hairline ribbons. When set, every terminal-column
   * node whose total incoming flow is below `threshold × grandTotal` is
   * merged into a single "Other" terminal in the same column.
   *
   * Without this, real-world data (country-by-country, brand-by-brand)
   * produces dozens of <6px ribbons that read as noise. See dossier failure
   * mode "Unreadable hairlines — any ribbon under ~6px on a 1080p frame."
   *
   * Reference: references/template-research/sankey-flow.md § 6
   */
  aggregateOther?: {
    /** Fraction of total below which terminal nodes roll into "Other". Default 0.03 (3%). */
    threshold?: number;
    /** Label for the aggregated terminal. Default "Other". */
    label?: string;
    /** Color for the Other terminal. Default muted gray. */
    color?: string;
  };

  /**
   * Enable animated flow particles along link paths.
   * Particles travel from source to destination, with count proportional to
   * flow value. Default: false.
   *
   * **CINEMATIC-MODE ONLY.** Particles are decorative animation that makes
   * a held composition feel alive; they are NOT analytical signal. Use them
   * during sustained holds (8+ seconds on the same frame) where the
   * substrate-motion identity would otherwise feel static. DO NOT use them
   * during rapid scrubbing or in dense analytical sequences — the motion
   * competes with the conservation reading.
   *
   * Per the editorial doctrine, "elements should hold after revealing"
   * (POLISH.md A1). Particles violate that rule on purpose to add atmosphere;
   * apply only when atmosphere is what the moment needs.
   *
   * See: references/template-research/sankey-flow.md § 7 (failure modes)
   */
  flowParticles?: boolean;
  /** Particle speed multiplier (default: 1.0) */
  particleSpeed?: number;
  /** Particle density multiplier (default: 1.0) */
  particleDensity?: number;

  /** Show ambient background particles (default: false) */
  ambientParticles?: boolean;

  source?: string;
  durationSec?: number;
  backgroundVariant?: "dark" | "light";
  backgroundTint?: string;

  // ── Directing language overrides ──────────────────────────────────────
  /** Per-composition direction block from visual-spec _direction namespace. */
  _direction?: DirectionBlock;
}
