/**
 * @vitest-environment happy-dom
 *
 * BrandLockup — verify the three placement modes render the right
 * lockup shape AND that the SVG branch lights up when palette.json
 * sets `brandMark.svg` to a non-null asset path.
 *
 * The SVG branch is exactly the feature the centralization refactor
 * was supposed to enable (logo swap to an image asset). Without a
 * test it's the kind of conditional that can silently rot.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";

// The component reads `brandMark` from theme.ts at module-import time —
// vi.mock replaces the export so the SVG branch becomes testable
// without editing the canonical palette.json. We re-import dynamically
// in each `describe` block so the mock takes effect per scenario.

describe("BrandLockup — glyph branch (svg: null)", () => {
  beforeEach(() => {
    vi.doMock("../design/theme", async (importOriginal) => {
      const real = await importOriginal<typeof import("../design/theme")>();
      return {
        ...real,
        brandMark: { ...real.brandMark, svg: null },
      };
    });
  });
  afterEach(() => {
    vi.resetModules();
    cleanup();
  });

  it("leading mode renders the glyph followed by children", async () => {
    const { BrandLockup } = await import("../components/BrandLockup");
    const { container } = render(<BrandLockup>parallax · catalog</BrandLockup>);
    expect(container.textContent).toContain("∴");
    expect(container.textContent).toContain("parallax · catalog");
    expect(container.querySelector("img")).toBeNull();
  });

  it("trailing mode renders prefix · ∴ · children", async () => {
    const { BrandLockup } = await import("../components/BrandLockup");
    const { container } = render(
      <BrandLockup placement="trailing" prefix="Source: Axelrod (1984)">
        parallax · B
      </BrandLockup>,
    );
    const text = container.textContent ?? "";
    expect(text).toContain("Source: Axelrod (1984)");
    expect(text).toContain("∴");
    expect(text).toContain("parallax · B");
    // Order: prefix appears before glyph; glyph appears before "parallax · B".
    expect(text.indexOf("Source")).toBeLessThan(text.indexOf("∴"));
    expect(text.indexOf("∴")).toBeLessThan(text.indexOf("parallax · B"));
  });

  it("only mode renders just the glyph", async () => {
    const { BrandLockup } = await import("../components/BrandLockup");
    const { container } = render(<BrandLockup placement="only" />);
    expect(container.textContent?.trim()).toBe("∴");
    expect(container.querySelector("img")).toBeNull();
  });

  it("sets aria-label on every placement (a11y)", async () => {
    const { BrandLockup } = await import("../components/BrandLockup");
    for (const placement of ["leading", "trailing", "only"] as const) {
      const { container, unmount } = render(
        <BrandLockup placement={placement} prefix={placement === "trailing" ? "X" : undefined}>
          y
        </BrandLockup>,
      );
      expect(
        container.querySelector("[aria-label='Parallax brand mark']"),
      ).not.toBeNull();
      unmount();
    }
  });
});

describe("BrandLockup — svg branch (svg: '/brand-mark.svg')", () => {
  beforeEach(() => {
    vi.doMock("../design/theme", async (importOriginal) => {
      const real = await importOriginal<typeof import("../design/theme")>();
      return {
        ...real,
        brandMark: { ...real.brandMark, svg: "/brand-mark.svg" },
      };
    });
  });
  afterEach(() => {
    vi.resetModules();
    cleanup();
  });

  it("leading mode renders an <img>, not the glyph", async () => {
    const { BrandLockup } = await import("../components/BrandLockup");
    const { container } = render(<BrandLockup>parallax · catalog</BrandLockup>);
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("/brand-mark.svg");
    expect(img?.getAttribute("alt")).toBe("Parallax");
    // Glyph must NOT appear in textContent when SVG is active.
    expect(container.textContent).not.toContain("∴");
  });

  it("only mode renders just the <img>", async () => {
    const { BrandLockup } = await import("../components/BrandLockup");
    const { container } = render(<BrandLockup placement="only" />);
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "/brand-mark.svg",
    );
    expect(container.textContent).not.toContain("∴");
  });

  it("trailing mode renders prefix · <img> · children", async () => {
    const { BrandLockup } = await import("../components/BrandLockup");
    const { container } = render(
      <BrandLockup placement="trailing" prefix="Source: X">
        parallax · B
      </BrandLockup>,
    );
    expect(container.querySelector("img")).not.toBeNull();
    expect(container.textContent).toContain("Source: X");
    expect(container.textContent).toContain("parallax · B");
    expect(container.textContent).not.toContain("∴");
  });
});
