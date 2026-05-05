/**
 * Transition Grammar — context-aware default transitions for assembly.
 *
 * Maps segment context (template type, beat role, preceding/following
 * segment types) to recommended transition types and durations.
 *
 * Used by:
 *   - generate_manifest.py (via JSON export) for auto-populating transitions
 *   - visual-spec skill for transition recommendations in data files
 *   - FullEpisode.tsx at runtime if no explicit transition is specified
 *
 * Design principles:
 *   1. Cuts are the default — they're invisible and fast
 *   2. Dissolves for thematic shifts (era change, perspective switch)
 *   3. Wipes for geographic movement (map transitions)
 *   4. Fade for emotional moments (human stories, revelations)
 *   5. Iris for dramatic reveals (key statistics, turning points)
 *   6. No more than 2 non-cut transitions per 60s (avoid music video feel)
 *
 * Grammar:
 *   Same template type → cut (continuity)
 *   Map → Map → wipe-left (geographic progression)
 *   Map → non-Map → dissolve (context shift)
 *   Any → StatReveal → iris (dramatic reveal)
 *   TimelineComparison in/out → dissolve (temporal shift)
 *   KineticTypography → anything → fade (emotional beat)
 *   Section boundary → dissolve (structural break)
 *   Everything else → cut
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
