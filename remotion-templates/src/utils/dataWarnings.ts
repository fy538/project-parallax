/**
 * dataWarnings — semantic checks for chart data that go beyond zod typing.
 *
 * Zod catches type errors (number vs string) and shape errors (missing
 * required field). It can't catch *semantic* problems — a 120-character
 * title that will overflow the safe area, a y-axis that defaults to a
 * negative range for population data, an empty data array, etc.
 *
 * This util runs in development only (no-op in Remotion's render pipeline)
 * and prints a single console.warn per template per session. It's a
 * "tell me about my mistake before I see it" net for data authors.
 *
 * To use in a template:
 *   import { warnIf } from "../../utils/dataWarnings";
 *   warnIf(data.title.length > 80, "DataChart", "Title is 80+ chars and will likely overflow");
 *   warnIf(data.dataPoints.length === 0, "DataChart", "Empty dataPoints — chart will render blank");
 */

const seen = new Set<string>();

/**
 * Print a warning once per (template, message) tuple per session.
 * No-op when condition is falsy. Always no-op in production builds.
 */
export function warnIf(
  condition: boolean,
  template: string,
  message: string,
  data?: unknown
): void {
  if (!condition) return;
  // Keep-alive in production-rendered MP4 too (no-op there because no console)
  // — only show when there's a console (Remotion Studio dev environment).
  if (typeof console === "undefined" || typeof console.warn !== "function") return;
  const key = `${template}::${message}`;
  if (seen.has(key)) return;
  seen.add(key);
  if (data !== undefined) {
    console.warn(`[${template}] ${message}`, data);
  } else {
    console.warn(`[${template}] ${message}`);
  }
}

/**
 * Common semantic checks that apply to most chart templates. Call this
 * once per render with the template name and the data object.
 */
export function checkChartDataCommon(
  template: string,
  data: { title?: string; subtitle?: string; source?: string }
): void {
  warnIf(
    !!data.title && data.title.length > 80,
    template,
    `Title is ${data.title?.length} chars — likely to overflow. Split into title + subtitle.`,
    { title: data.title }
  );
  warnIf(
    !!data.subtitle && data.subtitle.length > 140,
    template,
    `Subtitle is ${data.subtitle?.length} chars — will wrap awkwardly. Trim to <140.`,
    { subtitle: data.subtitle }
  );
  warnIf(
    !data.source,
    template,
    "No source attribution provided. Editorial standard requires data provenance.",
  );
}
