/**
 * Transition Grammar — context-aware default transitions for assembly.
 *
 * @deprecated SUPERSEDED (May 16, 2026, Phase 3 of TRANSITION_GRAMMAR doctrine).
 * This file has zero consumers — it predates the canonical doctrine and bakes
 * in wipe-based defaults that the doctrine now deprecates (wipe-left, wipe-right
 * for map transitions). The active implicit-default engine is
 * `apply_default_transitions()` in `tools/assembly/generate_manifest.py`.
 *
 * Canonical doctrine: `project/TRANSITION_GRAMMAR.md`.
 * Replacement defaults (per doctrine):
 *   - Within-beat seam → cut (not dissolve)
 *   - Beat-boundary seam → dissolve
 *   - Title-card boundary → fade-through-black (currently `fade`)
 *   - Map → Map → match-cut (NOT wipe-left)
 *   - Register shift → color-wash with explicit color token
 *
 * DO NOT add new consumers of `recommendTransition` /
 * `recommendSequenceTransitions` exports. They remain only to avoid breaking
 * any out-of-tree tooling that may have imported them. Phase 4 will either
 * rewrite this file to align with the doctrine or delete it entirely.
 *
 * Maps segment context (template type, beat role, preceding/following
 * segment types) to recommended transition types and durations.
 *
 * Original design principles (now superseded):
 *   1. Cuts are the default — they're invisible and fast
 *   2. Dissolves for thematic shifts (era change, perspective switch)
 *   3. Wipes for geographic movement (map transitions)  ← obsolete per doctrine
 *   4. Fade for emotional moments (human stories, revelations)
 *   5. Iris for dramatic reveals (key statistics, turning points)
 *   6. No more than 2 non-cut transitions per 60s (avoid music video feel)
 */

import type { TransitionType } from "../components/Transitions";

// ── Template categories ──────────────────────────────────────────────────────

type TemplateCategory = "map" | "data" | "narrative" | "framework" | "reveal" | "timeline" | "other";

const TEMPLATE_CATEGORIES: Record<string, TemplateCategory> = {
  // Maps
  ChoroplethMap: "map",
  RouteAnimation: "map",

  // Data visualization
  DataChart: "data",
  TimeSeriesChart: "data",
  RadarChart: "data",
  SankeyFlow: "data",
  NetworkDiagram: "data",

  // Narrative / emotional
  KineticTypography: "narrative",
  SplitComposition: "narrative",
  PhotoMontage: "narrative",
  ImageComposite: "narrative",
  AnnotatedImage: "narrative",

  // Frameworks / structural
  FrameworkDiagram: "framework",
  DecisionTree: "framework",
  GameBoard: "framework",
  BayesianUpdate: "framework",
  EscalationLadder: "framework",

  // Reveals
  StatReveal: "reveal",
  ProbabilityGauge: "reveal",

  // Timeline
  TimelineComparison: "timeline",

  // Titles
  TitleTransition: "other",
};

const getCategory = (template: string): TemplateCategory =>
  TEMPLATE_CATEGORIES[template] || "other";

// ── Transition rules ─────────────────────────────────────────────────────────

export interface TransitionRecommendation {
  type: TransitionType;
  durationSec: number;
  reason: string;
}

/**
 * Recommend a transition between two segments based on template types.
 *
 * @param fromTemplate - The outgoing segment's template component name
 * @param toTemplate - The incoming segment's template component name
 * @param isSectionBoundary - Whether this is a structural section break
 * @returns Transition recommendation with type, duration, and reasoning
 */
export const recommendTransition = (
  fromTemplate: string,
  toTemplate: string,
  isSectionBoundary: boolean = false,
): TransitionRecommendation => {
  const fromCat = getCategory(fromTemplate);
  const toCat = getCategory(toTemplate);

  // Rule 1: Section boundaries get dissolves
  if (isSectionBoundary) {
    return {
      type: "dissolve",
      durationSec: 0.8,
      reason: "Section boundary — structural break",
    };
  }

  // Rule 2: Same template → cut (visual continuity)
  if (fromTemplate === toTemplate) {
    return {
      type: "cut",
      durationSec: 0,
      reason: "Same template — continuity cut",
    };
  }

  // Rule 3: Into a reveal → iris (dramatic emphasis)
  if (toCat === "reveal") {
    return {
      type: "iris",
      durationSec: 0.6,
      reason: "Reveal entrance — dramatic iris",
    };
  }

  // Rule 4: Map → Map → wipe (geographic progression)
  if (fromCat === "map" && toCat === "map") {
    return {
      type: "wipe-left",
      durationSec: 0.5,
      reason: "Map-to-map — geographic progression wipe",
    };
  }

  // Rule 5: Map → non-Map → dissolve (context shift)
  if (fromCat === "map" && toCat !== "map") {
    return {
      type: "dissolve",
      durationSec: 0.6,
      reason: "Leaving map context — dissolve to new mode",
    };
  }

  // Rule 6: Non-Map → Map → wipe-right (entering geographic view)
  if (fromCat !== "map" && toCat === "map") {
    return {
      type: "wipe-right",
      durationSec: 0.5,
      reason: "Entering map context — wipe into geography",
    };
  }

  // Rule 7: Timeline in/out → dissolve (temporal shift)
  if (fromCat === "timeline" || toCat === "timeline") {
    return {
      type: "dissolve",
      durationSec: 0.6,
      reason: "Timeline transition — temporal dissolve",
    };
  }

  // Rule 8: Narrative → anything → fade (emotional beat)
  if (fromCat === "narrative") {
    return {
      type: "fade",
      durationSec: 0.5,
      reason: "Leaving narrative beat — emotional fade",
    };
  }

  // Rule 9: Data → Framework or vice versa → dissolve (analytical shift)
  if (
    (fromCat === "data" && toCat === "framework") ||
    (fromCat === "framework" && toCat === "data")
  ) {
    return {
      type: "dissolve",
      durationSec: 0.5,
      reason: "Data↔framework shift — analytical dissolve",
    };
  }

  // Default: cut
  return {
    type: "cut",
    durationSec: 0,
    reason: "Default — clean cut",
  };
};

/**
 * Apply transition grammar to a sequence of segments.
 * Returns transition recommendations for each boundary.
 *
 * @param segments - Array of { template, isSectionStart? }
 * @returns Array of recommendations (length = segments.length - 1)
 */
export const recommendSequenceTransitions = (
  segments: Array<{ template: string; isSectionStart?: boolean }>,
): TransitionRecommendation[] => {
  const recommendations: TransitionRecommendation[] = [];

  for (let i = 1; i < segments.length; i++) {
    const rec = recommendTransition(
      segments[i - 1].template,
      segments[i].template,
      segments[i].isSectionStart || false,
    );
    recommendations.push(rec);
  }

  // Post-process: enforce max 2 non-cut transitions per 60s
  // (Assuming ~10s per segment as rough estimate)
  let nonCutCount = 0;
  const windowSize = 6; // ~60s at 10s/segment

  for (let i = 0; i < recommendations.length; i++) {
    if (recommendations[i].type !== "cut") {
      nonCutCount++;
    }

    // Reset window
    if (i >= windowSize) {
      if (recommendations[i - windowSize].type !== "cut") {
        nonCutCount--;
      }
    }

    // If we exceed density limit, downgrade to cut
    if (nonCutCount > 2 && recommendations[i].type !== "cut") {
      const original = recommendations[i];
      recommendations[i] = {
        type: "cut",
        durationSec: 0,
        reason: `Downgraded from ${original.type} — density limit (max 2 non-cuts per ~60s)`,
      };
      nonCutCount--;
    }
  }

  return recommendations;
};

/**
 * Catalog metadata for documentation and tooling.
 */
export const TRANSITION_GRAMMAR_CATALOG = {
  name: "TransitionGrammar",
  description: "Context-aware transition defaults for assembly",
  rules: [
    "Section boundary → dissolve (0.8s)",
    "Same template → cut",
    "Into reveal → iris (0.6s)",
    "Map → Map → wipe-left (0.5s)",
    "Map → non-Map → dissolve (0.6s)",
    "non-Map → Map → wipe-right (0.5s)",
    "Timeline in/out → dissolve (0.6s)",
    "Narrative exit → fade (0.5s)",
    "Data ↔ Framework → dissolve (0.5s)",
    "Default → cut",
  ],
  densityLimit: "Max 2 non-cut transitions per ~60s window",
} as const;
