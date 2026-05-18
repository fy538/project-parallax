/**
 * BrandLockup — the canonical "∴ parallax · <context>" footer.
 *
 * Replaces ~12 catalog files that hardcoded a literal "∴" in JSX. Every
 * lockup variant — `∴ parallax · cooperation theory`, `∴ Parallax · catalog`,
 * `Source: Axelrod (1984), iterated tournament · ∴ parallax · B` — now
 * routes through this one component.
 *
 * The glyph + separator come from `brandMark` in theme.ts (sourced from
 * `tools/brand-treatment/palette.json::brandMark`). Lint rule
 * `no-literal-brand-mark` (scripts/lint-conventions.mjs) blocks any new
 * literal "∴" outside the canonical render sites.
 *
 * Three placement modes (matching the patterns observed in catalog/):
 *   · leading  — `∴ Parallax · catalog`               (mark first, default)
 *   · trailing — `Source: ... · ∴ parallax · B`       (mark inside trailing meta)
 *   · only     — `∴` alone (no surrounding text)
 *
 * Usage:
 *   <BrandLockup>parallax · catalog</BrandLockup>
 *   <BrandLockup placement="trailing">Source: ... · parallax · B</BrandLockup>
 *   <BrandLockup placement="only" />
 */

import React from "react";
import { brandMark } from "../design/theme";

export interface BrandLockupProps {
  /** Text to the right of the brand mark in leading mode. */
  children?: React.ReactNode;
  /**
   * Where the brand mark sits relative to the text.
   *  - "leading"  (default): mark first, then a space, then children
   *  - "trailing": children render as-is, with `∴` substituted at any
   *                `{brandMark.glyph}` placeholder. Use for the
   *                "Source: ... · ∴ parallax · B" pattern where the
   *                mark sits inside the prose.
   *  - "only": render just the glyph (no children — useful as a
   *                terminal mark on a slate).
   */
  placement?: "leading" | "trailing" | "only";
  /** Optional inline style overrides applied to the wrapper. */
  style?: React.CSSProperties;
  /** Optional className for the wrapper (lets callers add their own
   *  typography/color rules without re-implementing the lockup). */
  className?: string;
}

export const BrandLockup: React.FC<BrandLockupProps> = ({
  children,
  placement = "leading",
  style,
  className,
}) => {
  if (placement === "only") {
    return (
      <span style={style} className={className} aria-label="Parallax brand mark">
        {brandMark.svg ? (
          <img src={brandMark.svg} alt="Parallax" style={{ height: "1em", verticalAlign: "middle" }} />
        ) : (
          brandMark.glyph
        )}
      </span>
    );
  }

  if (placement === "trailing") {
    // Render children as-is. Callers compose the prose; the brand mark
    // appears at the right edge of the prose via children that include
    // `∴` indirectly (e.g. by reading `brandMark.glyph` themselves) OR
    // via this `{brandMark.glyph}` substitution if children is a string.
    if (typeof children === "string") {
      return (
        <span style={style} className={className}>
          {children.replace("{mark}", brandMark.glyph)}
        </span>
      );
    }
    return <span style={style} className={className}>{children}</span>;
  }

  // Default: leading mark, children to the right.
  return (
    <span style={style} className={className}>
      {brandMark.svg ? (
        <img src={brandMark.svg} alt="Parallax" style={{ height: "1em", verticalAlign: "middle", marginRight: "0.4em" }} />
      ) : (
        <>{brandMark.glyph}{" "}</>
      )}
      {children}
    </span>
  );
};
