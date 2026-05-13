/**
 * Icon paths for IsotypeChart.
 *
 * All icons use a 16×16 viewBox for consistent scaling.
 * Paths are simple single-path or minimal SVG that reads clearly at 36px.
 * Each icon is a filled silhouette — no stroke, no outline.
 *
 * @composition-animation: delegated — pure data module, no composition lifecycle.
 */

export const ICON_PATHS: Record<string, string> = {
  // Simple filled circle (fallback / generic unit)
  circle: "M8 2a6 6 0 1 1 0 12A6 6 0 0 1 8 2z",

  // Person silhouette — head + shoulders body
  person:
    "M8 1a3 3 0 1 1 0 6A3 3 0 0 1 8 1zm-4 9a4 4 0 0 1 8 0v1H4v-1z",

  // Soldier — person with helmet brim
  soldier:
    "M8 5a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM4 5h8a.5.5 0 0 1 0 1H4a.5.5 0 0 1 0-1zM4 9a4 4 0 0 1 8 0v1H4V9z",

  // Ship — hull + deck + funnel
  ship:
    "M3 9l1-4h8l1 4H3zM5 5V3h6v2M7 3V1h2v2",

  // Plane — simplified top-down aircraft silhouette
  plane:
    "M8 1l-2 5H2l1 1.5h2L4 11h2l2-2.5 2 2.5h2l-1-3.5h2L13 6H10L8 1z",

  // Chip — square processor with pins
  chip:
    "M4 3h8v10H4V3zM2 5.5h2M2 8h2M2 10.5h2M12 5.5h2M12 8h2M12 10.5h2M5.5 1v2M8 1v2M10.5 1v2M5.5 13v2M8 13v2M10.5 13v2",

  // Dollar sign — S-curve with vertical bar
  dollar:
    "M8 1v14M5.5 4.5a2.5 2.5 0 0 1 5 0c0 1.5-5 2-5 4a2.5 2.5 0 0 0 5 0",

  // House — pitched roof + rectangular body
  house:
    "M8 1L1 7v8h5v-4h4v4h5V7L8 1z",
};

/** ViewBox size for all icons (16×16 coordinate space). */
export const ICON_VIEWBOX = "0 0 16 16";
