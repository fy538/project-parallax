/**
 * Tests for `formatEpisodeLabel` in design/theme.ts — the canonical
 * `EP.XX` / `EP.XX — TITLE` formatter used by MetadataStrip (and any
 * future label-rendering site). Format-preserving by construction; this
 * test locks the contract so any future cadence change ("S01·E02",
 * "Ep 01", etc.) is a deliberate edit that has to update the assertions.
 */

import { describe, it, expect } from "vitest";
import { formatEpisodeLabel } from "../design/theme";

describe("formatEpisodeLabel", () => {
  it("pads single-digit episode numbers to two digits", () => {
    expect(formatEpisodeLabel(1)).toBe("EP.01");
    expect(formatEpisodeLabel(7)).toBe("EP.07");
    expect(formatEpisodeLabel(9)).toBe("EP.09");
  });

  it("keeps two-digit episode numbers as-is", () => {
    expect(formatEpisodeLabel(10)).toBe("EP.10");
    expect(formatEpisodeLabel(42)).toBe("EP.42");
    expect(formatEpisodeLabel(99)).toBe("EP.99");
  });

  it("does not truncate three-digit episode numbers (post-100 channel)", () => {
    expect(formatEpisodeLabel(100)).toBe("EP.100");
    expect(formatEpisodeLabel(255)).toBe("EP.255");
  });

  it("appends ` — TITLE` when a title is provided", () => {
    expect(formatEpisodeLabel(1, "THE SILICON TRAP")).toBe(
      "EP.01 — THE SILICON TRAP",
    );
    expect(formatEpisodeLabel(99, "Prisoner's Dilemma")).toBe(
      "EP.99 — Prisoner's Dilemma",
    );
  });

  it("treats an empty title as no title (no trailing ` — `)", () => {
    expect(formatEpisodeLabel(1, "")).toBe("EP.01");
  });

  it("treats undefined title as no title", () => {
    expect(formatEpisodeLabel(1, undefined)).toBe("EP.01");
  });

  it("preserves byte-identical output to the prior inline construction", () => {
    // This is the format the MetadataStrip prior to centralization used.
    // Locking it explicitly prevents an accidental tweak (e.g. swapping
    // the em-dash for a hyphen) from drifting silently.
    const ep = 7;
    const title = "Test Episode";
    const expected = `EP.${String(ep).padStart(2, "0")} — ${title}`;
    expect(formatEpisodeLabel(ep, title)).toBe(expected);
  });
});
