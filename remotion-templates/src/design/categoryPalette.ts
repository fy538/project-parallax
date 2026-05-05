/**
 * CategoryPalette — consistent entity colors across templates and episodes.
 *
 * Maps recurring entities (nations, organizations, frameworks) to stable
 * colors so the same actor always gets the same visual identity, whether
 * it appears in a DataChart, TimelineComparison, or EscalationLadder.
 *
 * Three tiers:
 *   1. Semantic constants — geopolitical actors with branded colors (US, China)
 *   2. Entity registry — named entities with assigned palette slots
 *   3. Auto-assign — hash-based color from a curated pool for unknown entities
 *
 * Design contract:
 *   - BRAND.md: Uses palette + semantic colors as primary source
 *   - Concept registry: accentColor field provides per-concept overrides
 *   - POLISH.md: Consistent entity coloring across compositions
 */

import { palette, semantic, ramps } from "./theme";

// ── Semantic entity colors (tier 1) ──────────────────────────────────────────
// These are the "brand colors" for recurring geopolitical actors.

const SEMANTIC_ENTITIES: Record<string, string> = {
  // Nations
  "us": semantic.us,
  "usa": semantic.us,
  "united states": semantic.us,
  "america": semantic.us,
  "美国": semantic.us,

  "china": semantic.china,
  "prc": semantic.china,
  "中国": semantic.china,

  // Geopolitical concepts
  "neutral": semantic.neutral,
  "allies": semantic.success,
  "adversaries": semantic.danger,
};

// ── Entity registry (tier 2) ─────────────────────────────────────────────────
// Named entities that recur across episodes. Colors chosen for distinctiveness
// against semantic.us and semantic.china.

const ENTITY_REGISTRY: Record<string, string> = {
  // Nations (non-US/China)
  "japan": "#CC5200",           // deep orange
  "日本": "#CC5200",
  "taiwan": "#2A9D8F",          // teal
  "台湾": "#2A9D8F",
  "south korea": "#5B5EA6",     // muted purple
  "韩国": "#5B5EA6",
  "netherlands": "#E76F51",     // coral
  "荷兰": "#E76F51",
  "eu": "#264653",              // dark teal
  "european union": "#264653",
  "欧盟": "#264653",
  "russia": "#6B4C3B",          // brown
  "俄罗斯": "#6B4C3B",
  "india": "#E9C46A",           // gold
  "印度": "#E9C46A",

  // Organizations
  "tsmc": "#2A9D8F",            // shares Taiwan's teal
  "asml": "#E76F51",            // shares Netherlands' coral
  "smic": semantic.china,       // Chinese entity
  "nvidia": palette.olive,
  "intel": semantic.us,         // American entity
  "samsung": "#5B5EA6",         // shares South Korea's purple

  // Frameworks / abstract categories
  "offense": semantic.danger,
  "defense": semantic.us,
  "deterrence": palette.amber,
  "escalation": semantic.danger,
  "cooperation": semantic.success,
  "competition": palette.rust,
};

// ── Auto-assign pool (tier 3) ────────────────────────────────────────────────
// Curated colors that are distinct from semantic.us, semantic.china, and
// palette.amber. Used for unknown entities via deterministic hash.

const AUTO_POOL = [
  "#2A9D8F",  // teal
  "#E76F51",  // coral
  "#5B5EA6",  // muted purple
  "#264653",  // dark teal
  "#CC5200",  // deep orange
  "#6B4C3B",  // brown
  "#E9C46A",  // gold
  "#457B9D",  // steel blue
  "#A44A3F",  // burnt sienna
  "#7B8C4A",  // olive green
  "#8E6BB5",  // lavender
  "#C08552",  // caramel
] as const;

// ── Hash function ────────────────────────────────────────────────────────────

const stableHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash);
};

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Resolve a stable color for any entity name.
 *
 * Priority: explicit override → semantic → registry → auto-assign.
 *
 * @param entity - Entity name (case-insensitive)
 * @param override - Optional explicit color (from data JSON or concept registry)
 * @returns Hex color string
 */
export const resolveEntityColor = (
  entity: string,
  override?: string | null,
): string => {
  // Tier 0: explicit override wins
  if (override) return override;

  const key = entity.toLowerCase().trim();

  // Tier 1: semantic constants
  if (key in SEMANTIC_ENTITIES) return SEMANTIC_ENTITIES[key];

  // Tier 2: entity registry
  if (key in ENTITY_REGISTRY) return ENTITY_REGISTRY[key];

  // Tier 3: auto-assign from pool (deterministic)
  return AUTO_POOL[stableHash(key) % AUTO_POOL.length];
};

/**
 * Resolve colors for a list of entities, ensuring no adjacent duplicates.
 *
 * If two adjacent entities would get the same color, the second is shifted
 * to the next pool slot. Useful for comparison charts and legends.
 *
 * @param entities - Array of { name, color? } objects
 * @returns Array of hex color strings in the same order
 */
export const resolveEntityColors = (
  entities: Array<{ name: string; color?: string | null }>,
): string[] => {
  const colors = entities.map((e) => resolveEntityColor(e.name, e.color));

  // De-duplicate adjacent colors
  for (let i = 1; i < colors.length; i++) {
    if (colors[i] === colors[i - 1]) {
      const currentIdx = AUTO_POOL.indexOf(colors[i] as typeof AUTO_POOL[number]);
      if (currentIdx >= 0) {
        colors[i] = AUTO_POOL[(currentIdx + 1) % AUTO_POOL.length];
      } else {
        colors[i] = AUTO_POOL[stableHash(entities[i].name + "_shift") % AUTO_POOL.length];
      }
    }
  }

  return colors;
};

/**
 * Get ramp colors for a semantic entity (5-stop sequential).
 * Falls back to amber ramp for unknown entities.
 */
export const getEntityRamp = (
  entity: string,
): readonly [string, string, string, string, string] => {
  const key = entity.toLowerCase().trim();

  if (key === "us" || key === "usa" || key === "united states" || key === "america" || key === "美国") {
    return ramps.blue as readonly [string, string, string, string, string];
  }
  if (key === "china" || key === "prc" || key === "中国") {
    return ramps.red as readonly [string, string, string, string, string];
  }

  return ramps.amber as readonly [string, string, string, string, string];
};

/**
 * Catalog metadata for documentation and tooling.
 */
export const CATEGORY_PALETTE_CATALOG = {
  name: "CategoryPalette",
  description: "Consistent entity colors across templates and episodes",
  tiers: ["semantic", "registry", "auto-assign"] as const,
  semanticEntities: Object.keys(SEMANTIC_ENTITIES),
  registeredEntities: Object.keys(ENTITY_REGISTRY),
  autoPoolSize: AUTO_POOL.length,
} as const;
