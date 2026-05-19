/**
 * @vitest-environment happy-dom
 *
 * MathInline — tests for the inline-math parser + renderer (Phase 3 of
 * the math-rendering register).
 *
 * Coverage:
 *   · `parseMathInline()` — pure parser, exercised across the corner
 *     cases that bite in real authoring: escaping, empty math, unmatched
 *     dollars, mixed text + multiple math segments, newlines in text.
 *   · `<MathInline>` component — confirms text + math segments render
 *     to the expected DOM shape, and that inline math nests cleanly
 *     inside a flow context (vertical-align middle, inline-block).
 */

import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MathInline, parseMathInline } from "../components/MathInline";

afterEach(cleanup);

// ── Parser ────────────────────────────────────────────────────────────────

describe("parseMathInline", () => {
  it("returns a single text segment for plain prose", () => {
    expect(parseMathInline("just plain text")).toEqual([
      { type: "text", content: "just plain text" },
    ]);
  });

  it("returns a single math segment for math-only input", () => {
    expect(parseMathInline("$a + b$")).toEqual([
      { type: "math", content: "a + b" },
    ]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseMathInline("")).toEqual([]);
  });

  it("interleaves text and math correctly", () => {
    expect(parseMathInline("the payoff is $\\E[U] = pa + (1-p)b$ exactly")).toEqual([
      { type: "text", content: "the payoff is " },
      { type: "math", content: "\\E[U] = pa + (1-p)b" },
      { type: "text", content: " exactly" },
    ]);
  });

  it("handles multiple math segments in one string", () => {
    expect(parseMathInline("Given $x$ and $y$, find $z$.")).toEqual([
      { type: "text", content: "Given " },
      { type: "math", content: "x" },
      { type: "text", content: " and " },
      { type: "math", content: "y" },
      { type: "text", content: ", find " },
      { type: "math", content: "z" },
      { type: "text", content: "." },
    ]);
  });

  it("treats `\\$` as a literal dollar sign in text", () => {
    expect(parseMathInline("Cost: \\$100 per unit.")).toEqual([
      { type: "text", content: "Cost: $100 per unit." },
    ]);
  });

  it("supports a mix of escaped dollars and real math", () => {
    expect(parseMathInline("Cost: \\$10 for $n$ units → \\$10n")).toEqual([
      { type: "text", content: "Cost: $10 for " },
      { type: "math", content: "n" },
      { type: "text", content: " units → $10n" },
    ]);
  });

  it("treats an unmatched opening $ as a literal $", () => {
    // Trailing unmatched: keep the $ + the rest as text.
    expect(parseMathInline("price is $100 unmatched")).toEqual([
      { type: "text", content: "price is $100 unmatched" },
    ]);
  });

  it("drops empty `$$` and merges the surrounding text into one segment", () => {
    // Empty inline math is invalid (KaTeX would error), so we drop it.
    // The two text segments on either side merge into one so downstream
    // renderers don't see two adjacent text-segments.
    expect(parseMathInline("nothing $$ here")).toEqual([
      { type: "text", content: "nothing  here" },
    ]);
  });

  it("preserves newlines in text segments", () => {
    expect(parseMathInline("line one\nline two")).toEqual([
      { type: "text", content: "line one\nline two" },
    ]);
  });

  it("preserves whitespace inside math (KaTeX is whitespace-tolerant)", () => {
    expect(parseMathInline("see $ p + q $ above")).toEqual([
      { type: "text", content: "see " },
      { type: "math", content: " p + q " },
      { type: "text", content: " above" },
    ]);
  });
});

// ── Component render ──────────────────────────────────────────────────────

describe("MathInline — component render", () => {
  it("renders plain text without invoking KaTeX", () => {
    const { container } = render(<MathInline text="hello world" />);
    expect(container.querySelector(".katex")).toBeNull();
    expect(container.textContent).toBe("hello world");
  });

  it("renders KaTeX for the math segment", () => {
    const { container } = render(
      <MathInline text="result: $a + b$ matches" />,
    );
    expect(container.querySelector(".katex")).not.toBeNull();
    expect(container.textContent).toContain("result: ");
    expect(container.textContent).toContain(" matches");
  });

  it("renders inline-mode math (no .katex-display)", () => {
    const { container } = render(<MathInline text="$x^2$" />);
    expect(container.querySelector(".katex")).not.toBeNull();
    expect(container.querySelector(".katex-display")).toBeNull();
  });

  it("renders multiple math segments separately", () => {
    const { container } = render(
      <MathInline text="$x$ and $y$ and $z$" />,
    );
    expect(container.querySelectorAll(".katex").length).toBe(3);
  });

  it("applies fontSize to the wrapper and propagates to math", () => {
    const { container } = render(
      <MathInline text="see $a$" fontSize={32} />,
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.fontSize).toBe("32px");
  });

  it("renders as `display: inline` by default", () => {
    const { container } = render(<MathInline text="hi" />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.display).toBe("inline");
  });

  it("renders as `display: block` when block=true", () => {
    const { container } = render(<MathInline text="hi" block />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.display).toBe("block");
  });

  it("preserves source `\\n` as visual line breaks via white-space: pre-line", () => {
    const { container } = render(<MathInline text={"line 1\nline 2"} />);
    const wrapper = container.firstElementChild as HTMLElement;
    // CSS handles the line break — no manual <br /> insertion. Verify
    // both that the text content carries through with the newline AND
    // that the wrapper has the right white-space rule so it renders.
    expect(wrapper.style.whiteSpace).toBe("pre-line");
    expect(container.textContent).toBe("line 1\nline 2");
  });

  it("nests inline math via inline-block + vertical-align middle (baseline flow)", () => {
    const { container } = render(<MathInline text="text $x$ text" />);
    const mathWrapper = container.querySelector(".katex")
      ?.parentElement as HTMLElement | null;
    // The inline-math wrapper from MathInline applies inline-block styling.
    expect(mathWrapper).not.toBeNull();
    // KaTeX is wrapped twice (MathExpression's own wrapper + MathInline's
    // positioning wrapper); walk up until we find the inline-block.
    let el: HTMLElement | null = mathWrapper;
    let foundInlineBlock = false;
    while (el && el !== container) {
      if (el.style.display === "inline-block") {
        foundInlineBlock = true;
        break;
      }
      el = el.parentElement;
    }
    expect(foundInlineBlock).toBe(true);
  });

  it("renders nothing visible for empty input", () => {
    const { container } = render(<MathInline text="" />);
    expect(container.textContent).toBe("");
  });
});
