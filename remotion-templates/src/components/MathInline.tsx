/**
 * MathInline — render text with inline math segments delimited by `$...$`.
 *
 * Phase 3 of the math-rendering register. The "embed an equation in
 * flowing prose" primitive — for captions, labels, body text where the
 * narrator says "the expected payoff is $\mathbb{E}[U]$ which dominates"
 * and the same line wants to render the math glyph inline.
 *
 * Parser rules:
 *   · `$...$` is an inline math segment (KaTeX dialect)
 *   · `\$` is an escaped literal dollar sign (NOT math entry)
 *   · An unmatched `$` at end-of-string is treated as a literal
 *   · Empty `$$` is treated as a literal `$$`
 *
 * Output: text segments rendered as normal React text (inheriting the
 * wrapper's typography); math segments rendered through MathExpression
 * in inline mode (display=false), no reveal animation (reveal=1).
 *
 * Usage:
 *
 *   <MathInline
 *     text="The expected payoff is $\\mathbb{E}[U] = pa + (1-p)b$ which dominates."
 *     fontSize={28}
 *     color={palette.ink}
 *   />
 *
 *   // Inside a template's label field:
 *   <MathInline text={data.caption} fontSize={fontSizes.body} />
 *
 *   // Rendering a price with units:
 *   <MathInline text="Cost: \\$$10^{12}$ FLOPS" />
 *   // → "Cost: $" + math "10^{12}" + " FLOPS"
 *
 * The wrapper renders as `display: inline` by default so it nests cleanly
 * inside paragraphs. Pass `block` to wrap in a block-level container if
 * the math is the only thing on its line.
 */

import React, { useMemo } from "react";
import { MathExpression } from "./MathExpression";
import { palette } from "../design/theme";

export interface MathInlineProps {
  /** Text with `$...$` markers for inline math segments. */
  text: string;
  /** Font size in px for both prose and math. Default inherits (undefined). */
  fontSize?: number;
  /** Text color. Default inherits (undefined → falls through to parent CSS). */
  color?: string;
  /** Render as `display: block` instead of `inline`. Default inline. */
  block?: boolean;
  /** Override wrapper style (e.g. margin, text-align). */
  style?: React.CSSProperties;
  /** Wrapper className. */
  className?: string;
}

interface ParsedSegment {
  type: "text" | "math";
  content: string;
}

/**
 * Pure parser. Exported for tests + any caller that wants to drive the
 * segmentation independently (e.g. a script-format validator).
 *
 * Walks `text` character-by-character; switches between text and math
 * modes at unescaped `$`. Returns segments in order. Adjacent text
 * segments are merged (no empty text segments emitted).
 */
export function parseMathInline(text: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  let buf = "";
  let inMath = false;
  let i = 0;

  const flush = (type: "text" | "math") => {
    // Math segments are emitted even if empty (caller can decide to render
    // "$$" as a literal); text segments are dropped if empty.
    if (type === "math" || buf.length > 0) {
      segments.push({ type, content: buf });
    }
    buf = "";
  };

  while (i < text.length) {
    const ch = text[i];

    // Escaped dollar: `\$` → literal `$` in text mode.
    if (ch === "\\" && text[i + 1] === "$") {
      buf += "$";
      i += 2;
      continue;
    }

    if (ch === "$") {
      if (inMath) {
        // Closing $ — flush math segment, switch to text.
        flush("math");
        inMath = false;
      } else {
        // Opening $ — flush any pending text, switch to math.
        flush("text");
        inMath = true;
      }
      i += 1;
      continue;
    }

    buf += ch;
    i += 1;
  }

  // Tail handling.
  if (inMath) {
    // Unmatched $ at end: treat the contents as literal text including
    // the opening $. Reconstruct the original substring.
    buf = "$" + buf;
    flush("text");
  } else {
    flush("text");
  }

  // Drop empty math segments (the `$$` case) — empty inline math is not
  // meaningful and KaTeX would error on it.
  const filtered = segments.filter(
    (s) => !(s.type === "math" && s.content.length === 0),
  );

  // Merge adjacent text segments — they can appear when `$$` was dropped
  // OR when an unmatched closing `$` flushed a text segment that's now
  // followed by what was the unterminated math (also text). Renderer
  // shouldn't see two text-segments in a row.
  const merged: ParsedSegment[] = [];
  for (const seg of filtered) {
    const prev = merged[merged.length - 1];
    if (prev && prev.type === "text" && seg.type === "text") {
      merged[merged.length - 1] = { type: "text", content: prev.content + seg.content };
    } else {
      merged.push(seg);
    }
  }
  return merged;
}

export const MathInline: React.FC<MathInlineProps> = ({
  text,
  fontSize,
  color = palette.ink,
  block = false,
  style,
  className,
}) => {
  const segments = useMemo(() => parseMathInline(text), [text]);

  const wrapperStyle: React.CSSProperties = {
    display: block ? "block" : "inline",
    color,
    // `pre-line` preserves source-text `\n` as visual line breaks while
    // collapsing runs of internal whitespace — matches the editorial
    // "the narrator breathes here" convention for body text. Lets us
    // skip manual <br /> insertion (which doesn't survive Fragment
    // map noise cleanly in happy-dom + RTL test environments).
    whiteSpace: "pre-line",
    ...(fontSize ? { fontSize } : {}),
    ...style,
  };

  return (
    <span style={wrapperStyle} className={className}>
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <React.Fragment key={`t-${i}`}>{seg.content}</React.Fragment>;
        }
        // Inline math — display=false keeps KaTeX in inline mode so it
        // baseline-aligns with surrounding text.
        return (
          <MathExpression
            key={`m-${i}`}
            formula={seg.content}
            reveal={1}
            display={false}
            fontSize={fontSize}
            color={color}
            // Inline-math container needs inline-block so the clip-path
            // wrapper from MathExpression doesn't break the text flow.
            style={{ display: "inline-block", verticalAlign: "middle" }}
          />
        );
      })}
    </span>
  );
};
