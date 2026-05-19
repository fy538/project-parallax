/**
 * @vitest-environment happy-dom
 *
 * MathExpression — verify the component:
 *   · Renders KaTeX-produced markup into the wrapper
 *   · Applies the left-to-right clip-path mask from the `reveal` prop
 *   · Honors color / fontSize / display overrides
 *   · Survives a malformed formula without crashing (KaTeX's
 *     `throwOnError: false` mode + the component's defensive wiring)
 *
 * This is the Phase 1 surface — Phase 2 (step-by-step derivations,
 * term-highlight, substitution) will add their own test files.
 */

import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MathExpression } from "../components/MathExpression";

afterEach(cleanup);

describe("MathExpression — rendering", () => {
  it("produces a .katex root from KaTeX for a valid formula", () => {
    const { container } = render(
      <MathExpression formula="a + b = c" />,
    );
    expect(container.querySelector(".katex")).not.toBeNull();
    // The formula's text content should appear somewhere in the render.
    // KaTeX produces hidden MathML + rendered HTML; either path includes
    // the source letters.
    expect(container.textContent).toContain("a");
    expect(container.textContent).toContain("c");
  });

  it("renders displaystyle when display=true (KaTeX adds .katex-display)", () => {
    const { container } = render(
      <MathExpression formula="x^2 + y^2 = r^2" display />,
    );
    expect(container.querySelector(".katex-display")).not.toBeNull();
  });

  it("renders inline (no .katex-display) when display=false / unset", () => {
    const { container } = render(
      <MathExpression formula="x^2 + y^2 = r^2" />,
    );
    expect(container.querySelector(".katex-display")).toBeNull();
    expect(container.querySelector(".katex")).not.toBeNull();
  });
});

describe("MathExpression — reveal animation", () => {
  // The wrapper div carries `clipPath: inset(0 X% 0 0)` where X scales
  // with (1 - reveal). reveal=0 → fully masked, reveal=1 → fully shown.

  const wrapperOf = (container: HTMLElement) =>
    container.firstElementChild as HTMLElement | null;

  it("fully masks the equation when reveal=0", () => {
    const { container } = render(
      <MathExpression formula="a + b" reveal={0} />,
    );
    const w = wrapperOf(container);
    expect(w?.style.clipPath).toBe("inset(0 100.000% 0 0)");
  });

  it("fully reveals when reveal=1", () => {
    const { container } = render(
      <MathExpression formula="a + b" reveal={1} />,
    );
    const w = wrapperOf(container);
    expect(w?.style.clipPath).toBe("inset(0 0.000% 0 0)");
  });

  it("half-reveals at reveal=0.5", () => {
    const { container } = render(
      <MathExpression formula="a + b" reveal={0.5} />,
    );
    const w = wrapperOf(container);
    expect(w?.style.clipPath).toBe("inset(0 50.000% 0 0)");
  });

  it("defaults to fully revealed when reveal prop is omitted", () => {
    const { container } = render(<MathExpression formula="a + b" />);
    const w = wrapperOf(container);
    expect(w?.style.clipPath).toBe("inset(0 0.000% 0 0)");
  });

  it("clamps reveal values above 1 to fully revealed (defensive)", () => {
    // `interpolate` with clamped easing can occasionally produce 1.0000001
    // due to floating-point math. The component must not interpret that
    // as "10001% inset" — that would over-shrink the wrapper.
    const { container } = render(
      <MathExpression formula="a + b" reveal={1.5} />,
    );
    const w = wrapperOf(container);
    expect(w?.style.clipPath).toBe("inset(0 0.000% 0 0)");
  });

  it("clamps reveal values below 0 to fully hidden (defensive)", () => {
    const { container } = render(
      <MathExpression formula="a + b" reveal={-0.5} />,
    );
    const w = wrapperOf(container);
    expect(w?.style.clipPath).toBe("inset(0 100.000% 0 0)");
  });
});

describe("MathExpression — style overrides", () => {
  const wrapperOf = (container: HTMLElement) =>
    container.firstElementChild as HTMLElement | null;

  it("applies the fontSize prop to the wrapper", () => {
    const { container } = render(
      <MathExpression formula="a + b" fontSize={96} />,
    );
    const w = wrapperOf(container);
    expect(w?.style.fontSize).toBe("96px");
  });

  it("applies a custom color when provided", () => {
    const { container } = render(
      <MathExpression formula="a + b" color="#A64D46" />,
    );
    const w = wrapperOf(container);
    // happy-dom normalizes the hex into the RGB form for some setups; accept either.
    const c = w?.style.color ?? "";
    expect(c === "#A64D46" || c.toLowerCase() === "rgb(166, 77, 70)").toBe(true);
  });

  it("merges caller-provided style overrides without losing the clip-path", () => {
    const { container } = render(
      <MathExpression
        formula="a + b"
        reveal={0.25}
        style={{ marginTop: 16, opacity: 0.8 }}
      />,
    );
    const w = wrapperOf(container);
    expect(w?.style.marginTop).toBe("16px");
    expect(w?.style.opacity).toBe("0.8");
    expect(w?.style.clipPath).toBe("inset(0 75.000% 0 0)");
  });
});

describe("MathExpression — defensive rendering", () => {
  it("does not throw on a malformed formula (KaTeX renders inline error)", () => {
    // KaTeX with throwOnError: false produces a red-tinted error span
    // rather than crashing — verified to avoid composition-level black frames.
    expect(() => {
      render(<MathExpression formula="\\notarealcommand{x}" />);
    }).not.toThrow();
  });
});
