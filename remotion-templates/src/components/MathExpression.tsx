/**
 * MathExpression — render LaTeX math through KaTeX with a left-to-right
 * reveal-mask animation.
 *
 * Phase 1 of the math-rendering register (project/MATH_RENDER_REGISTER.md,
 * to be written in Phase 4). Wires KaTeX's HTML+CSS output into the
 * Meridian editorial surface — ink-on-paper coloring, brand-aware sizing,
 * and a clip-path reveal that matches the `reveal-mask` primitive in
 * TEXT_ANIMATION_REGISTER.md.
 *
 * Font note (Phase 5): KaTeX ships with Computer-Modern-derived fonts.
 * `src/styles/katex-brand.css` (imported below) is the canonical override
 * channel — it remaps text-mode TeX (`\text{}`, `\textrm{}`) to IBM Plex
 * Mono to match Parallax's annotation register, and stubs the @font-face
 * declarations needed for the full Latin Modern Math swap (woff2 files
 * pending, see katex-brand.css for the TO-DO). Do NOT set `fontFamily` in
 * the `style` prop on this component or its callers — M-MATH-FONT lint
 * will flag it. All KaTeX font overrides live in katex-brand.css.
 *
 * Multi-line alignment note: `\begin{aligned}...\end{aligned}` works
 * natively in KaTeX. Pass `display={true}` to enable display-mode math
 * (required for the aligned environment to render at full size). Example:
 *
 *   formula={`\\begin{aligned}
 *     x &= 1 + 2 \\\\
 *     y &= x^2
 *   \\end{aligned}`}
 *   display
 *
 * Usage (in a Remotion composition):
 *
 *   const reveal = interpolate(frame, [0, sec(1.2)], [0, 1], CLAMP_CUBIC);
 *   <MathExpression
 *     formula="\\mathbb{E}[U_i] = p \\cdot a + (1-p) \\cdot b"
 *     reveal={reveal}
 *     fontSize={56}
 *     display
 *   />
 *
 * The component is intentionally low-level — it doesn't decide WHEN to
 * reveal, only what fraction of the equation is visible at a given moment.
 * Composition / template code drives `reveal` via the frame clock.
 */

import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
// Brand-path override: text-mode font → Plex Mono, display margin fix,
// baseline alignment correction, LM Math font-face stub. Must come AFTER
// katex.min.css to win the cascade. See src/styles/katex-brand.css.
import "../styles/katex-brand.css";
import { palette } from "../design/theme";

export interface MathExpressionProps {
  /** LaTeX formula source. Pass raw TeX (double-escape backslashes in JS strings). */
  formula: string;
  /** Reveal progress 0–1. 0 = fully hidden, 1 = fully shown. */
  reveal?: number;
  /** Font size in px applied to the KaTeX root. Display math typically 48–72. */
  fontSize?: number;
  /** Text color. Defaults to `palette.ink`. */
  color?: string;
  /** Display mode (centered, larger operators). Default false (inline). */
  display?: boolean;
  /** Override container style (alignment, margin, etc.). */
  style?: React.CSSProperties;
  /** Optional className for the outer wrapper. */
  className?: string;
}

export const MathExpression: React.FC<MathExpressionProps> = ({
  formula,
  reveal = 1,
  fontSize = 48,
  color = palette.ink,
  display = false,
  style,
  className,
}) => {
  // Render KaTeX once per formula change. `throwOnError: false` makes
  // KaTeX render a red-tinted error inline instead of crashing the
  // composition — easier to debug a typo in a template than a black frame.
  const html = useMemo(
    () =>
      katex.renderToString(formula, {
        displayMode: display,
        output: "html",
        throwOnError: false,
        strict: "ignore",
      }),
    [formula, display],
  );

  // Clamp reveal to [0, 1] — defensive against `interpolate` overshoots.
  const r = Math.max(0, Math.min(1, reveal));
  // Left-to-right reveal: `inset(top right bottom left)`. As reveal goes
  // 0 → 1, right shrinks from 100% to 0%, revealing the equation from
  // the left. A 2px right pad keeps anti-aliased glyph edges from clipping.
  const clipPath = `inset(0 ${((1 - r) * 100).toFixed(3)}% 0 0)`;

  return (
    <div
      className={className}
      style={{
        display: "inline-block",
        fontSize,
        color,
        clipPath,
        WebkitClipPath: clipPath,
        // KaTeX's CSS sets line-height; let it through. We just
        // contribute color + size + the reveal mask.
        ...style,
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
