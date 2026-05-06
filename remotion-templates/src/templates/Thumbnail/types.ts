/**
 * Thumbnail — static 1280×720 composition for YouTube thumbnail export.
 *
 * Three layout modes, each corresponding to a concept from the
 * thumbnail-concept skill:
 *   juxtaposition   — image panel + dual stat cards (Concept A)
 *   data-provocation — hero stat over faded background (Concept B)
 *   symbolic         — centered illustration + title (Concept C)
 *
 * Render: npx remotion still Thumbnail --props='{"data":{...}}' --output thumbnail.png
 */

export type ThumbnailLayout =
  | "juxtaposition"
  | "data-provocation"
  | "symbolic";

export type ThumbnailRamp = "standard" | "conflict" | "editorial";

export interface ThumbnailData {
  layout: ThumbnailLayout;
  episode: string;

  /** Right-side header metadata, e.g. "EP01 · GEOPOLITICS" */
  episodeLabel?: string;

  /** Image path relative to public/ (layouts A and B) */
  imageSrc?: string;
  imageRamp?: ThumbnailRamp;

  // ── Layout A: Juxtaposition ──────────────────────────────────────────────
  /** Upper title spanning full width, e.g. "TRIUMPH & TRAP" */
  titleText?: string;
  /** Primary stat in amber, e.g. "$165B" */
  statPrimary?: string;
  /** Label below statPrimary */
  statPrimaryLabel?: string;
  /** Contrast stat in rust (or statContrastColor), e.g. "7%" */
  statContrast?: string;
  /** Label below statContrast */
  statContrastLabel?: string;
  /** Override color for statContrast — defaults to palette.rust */
  statContrastColor?: string;

  // ── Layout B: Data Provocation ───────────────────────────────────────────
  /** Dominant hero text, e.g. "$165 BILLION" */
  heroText?: string;
  /** Supporting line below heroText, e.g. "→ 7% solution" */
  subText?: string;

  // ── Layout C: Symbolic ───────────────────────────────────────────────────
  /** Illustration path relative to public/ (SVG or PNG from Recraft/Claude) */
  illustrationSrc?: string;
  /** Title text below the illustration */
  symbolTitle?: string;
}
