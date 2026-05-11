/**
 * Segment atmospheric backdrop — FullEpisode injects transparentBackground when
 * manifest template.backdropId is set; templates call resolveAnalyticalBackgroundVariant
 * so opaque Background paper does not hide SegmentBackdrop.
 */

export function transparentBackdropRequested(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    Boolean((data as { transparentBackground?: boolean }).transparentBackground)
  );
}

/** Normalize manifest `backgroundVariant` to Background base mode. */
export function analyticalBackgroundBase(
  backgroundVariant: string | undefined | null,
): "light" | "dark" | "map" {
  if (backgroundVariant === "dark") return "dark";
  if (backgroundVariant === "map") return "map";
  return "light";
}

/**
 * Maps analytical Background base mode to Remotion variant; punches through to
 * transparent only when the segment substrate would have been light paper.
 */
export function resolveAnalyticalBackgroundVariant(
  base: "light" | "dark" | "map",
  transparentRequested?: boolean,
): "light" | "dark" | "map" | "transparent" {
  if (transparentRequested && base === "light") {
    return "transparent";
  }
  return base;
}
