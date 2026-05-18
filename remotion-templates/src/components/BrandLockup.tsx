/**
 * BrandLockup — the canonical "∴ parallax · <context>" footer.
 *
 * Replaces the catalog/template footers that previously hardcoded a
 * literal "∴" in JSX. The lockup variants observed in the codebase are:
 *
 *   leading   `∴ parallax · cooperation theory`        (mark first)
 *   trailing  `Source: Axelrod (1984) · ∴ parallax · B` (mark inside prose)
 *   only      `∴`                                       (mark alone)
 *
 * The glyph + separator come from `brandMark` in theme.ts (sourced from
 * `tools/brand-treatment/palette.json::brandMark`). When `brandMark.svg`
 * is non-null, the SVG renders instead of the glyph — letting a future
 * logo swap to an image asset live in one place. Lint rule
 * `no-literal-brand-mark` (scripts/lint-conventions.mjs) blocks any new
 * literal "∴" outside the canonical render sites.
 *
 * Usage:
 *   <BrandLockup>parallax · catalog</BrandLockup>
 *   <BrandLockup placement="trailing" prefix="Source: Axelrod (1984)">
 *     parallax · B
 *   </BrandLockup>
 *   <BrandLockup placement="only" />
 */

import React from "react";
import { brandMark } from "../design/theme";

export interface BrandLockupProps {
  /**
   * Text to the right of the brand mark (leading mode) or after the mark
   * in trailing mode. Ignored when placement="only".
   */
  children?: React.ReactNode;
  /**
   * Where the brand mark sits relative to the text.
   *  - "leading"  (default): `∴ <children>`
   *  - "trailing": `<prefix> · ∴ <children>` — the mark sits between
   *                a prose lead-in and the trailing meta. Use for
   *                "Source: ... · ∴ parallax · B" patterns.
   *  - "only": render just the mark (no children — useful as a terminal
   *            mark on a slate).
   */
  placement?: "leading" | "trailing" | "only";
  /**
   * Prose that precedes the mark in trailing mode. The lockup separator
   * (` · ` by default) is inserted automatically between prefix and mark.
   * Ignored in leading / only modes.
   */
  prefix?: React.ReactNode;
  /** Optional inline style overrides applied to the wrapper. */
  style?: React.CSSProperties;
  /**
   * Optional className for the wrapper (lets callers add their own
   * typography/color rules without re-implementing the lockup).
   */
  className?: string;
}

/** Render the brand glyph or SVG asset. Single source of truth for the
 *  glyph-vs-svg dispatch — both placement modes route through this. */
const Mark: React.FC<{ inlineSize: string; trailingSpace: boolean }> = ({
  inlineSize,
  trailingSpace,
}) => {
  if (brandMark.svg) {
    return (
      <img
        src={brandMark.svg}
        alt="Parallax"
        style={{
          height: inlineSize,
          verticalAlign: "middle",
          marginRight: trailingSpace ? "0.4em" : 0,
        }}
      />
    );
  }
  return trailingSpace ? <>{brandMark.glyph} </> : <>{brandMark.glyph}</>;
};

export const BrandLockup: React.FC<BrandLockupProps> = ({
  children,
  placement = "leading",
  prefix,
  style,
  className,
}) => {
  if (placement === "only") {
    return (
      <span
        style={style}
        className={className}
        aria-label="Parallax brand mark"
      >
        <Mark inlineSize="1em" trailingSpace={false} />
      </span>
    );
  }

  if (placement === "trailing") {
    return (
      <span
        style={style}
        className={className}
        aria-label="Parallax brand mark"
      >
        {prefix}
        {prefix != null ? brandMark.lockupSeparator : null}
        <Mark inlineSize="1em" trailingSpace={true} />
        {children}
      </span>
    );
  }

  // Default: leading mark, children to the right.
  return (
    <span
      style={style}
      className={className}
      aria-label="Parallax brand mark"
    >
      <Mark inlineSize="1em" trailingSpace={true} />
      {children}
    </span>
  );
};
