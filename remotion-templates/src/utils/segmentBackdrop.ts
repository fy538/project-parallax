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
  overPicture?: boolean,
): "light" | "dark" | "map" | "transparent" {
  // Over a held picture the ground is always transparent, whatever the type colour.
  if (overPicture) return "transparent";
  if (transparentRequested && base === "light") {
    return "transparent";
  }
  return base;
}

/**
 * True when FullEpisode is rendering this card over the held picture of the
 * previous segment (hold-under — see utils/resolveSeams rule 6). Templates
 * that support it drop their ground and brand chrome and use dark-mode type.
 */
export function overPictureRequested(data: unknown): boolean {
  return (
    typeof data === "object" &&
    data !== null &&
    Boolean((data as { overPicture?: boolean }).overPicture)
  );
}
