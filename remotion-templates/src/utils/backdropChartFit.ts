/**
 * Backdrop ↔ foreground chart pairing — manifest `density` approximates visual
 * noise; optional `chartFit` overrides how much detailed Remotion graphics
 * (dense charts, networks, small labels) the plate tolerates.
 */

export type BackdropChartFit = "high" | "medium" | "low";

type BackdropDensity = "quiet" | "medium" | "busy";

/** Manifest row shape (subset of BackdropEntry). */
export type BackdropChartFitSource = {
  density?: BackdropDensity;
  chartFit?: BackdropChartFit;
};

const CHART_RANK: Record<BackdropChartFit, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

/** Default mapping when manifest omits chartFit. */
export function chartFitFromDensity(density: BackdropDensity | undefined): BackdropChartFit {
  switch (density) {
    case "quiet":
      return "high";
    case "busy":
      return "low";
    case "medium":
    default:
      return "medium";
  }
}

/** Resolved chart-fit for a manifest row. */
export function backdropChartFit(entry: BackdropChartFitSource): BackdropChartFit {
  const { chartFit: explicit } = entry;
  if (explicit === "high" || explicit === "medium" || explicit === "low") {
    return explicit;
  }
  return chartFitFromDensity(entry.density);
}

/** True if this backdrop supports at least `minimum` foreground complexity. */
export function backdropSupportsChartFit(
  entry: BackdropChartFitSource,
  minimum: BackdropChartFit,
): boolean {
  return CHART_RANK[backdropChartFit(entry)] >= CHART_RANK[minimum];
}

/** One-line hint for catalogs / Studio tooltips. */
export function backdropChartFitHint(fit: BackdropChartFit): string {
  switch (fit) {
    case "high":
      return "Dense charts OK (Sankey, network, multi-series, small labels) if hero quiet zone is respected.";
    case "medium":
      return "Typical analytical comps; avoid maximum clutter (full dashboards + micro-label stacks).";
    case "low":
      return "Sparse foreground only — big type, simple bars, kinetic quotes; skip busy diagrams.";
    default:
      return "";
  }
}
