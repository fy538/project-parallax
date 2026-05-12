/**
 * editorialModes — unit tests for the mode-token system and the
 * backdrop-register → mode resolver consumed by FullEpisode.
 *
 * Reference: src/design/editorialModes.ts
 */

import { describe, expect, it } from "vitest";
import {
  EDITORIAL_COLORS,
  editorialColors,
  modeFromBackdropRegister,
  type EditorialMode,
} from "../design/editorialModes";
import { palette } from "../design/theme";
import backdropManifest from "../../data/backdrop-manifest.json";

describe("EDITORIAL_COLORS", () => {
  it("defines tokens for both light and dark modes", () => {
    expect(EDITORIAL_COLORS.light).toBeDefined();
    expect(EDITORIAL_COLORS.dark).toBeDefined();
  });

  it("light mode uses ink for body text (preserves pre-May-11 behavior)", () => {
    expect(EDITORIAL_COLORS.light.text).toBe(palette.ink);
    expect(EDITORIAL_COLORS.light.textSecondary).toBe(palette.ink);
    expect(EDITORIAL_COLORS.light.brandMark).toBe(palette.ink);
  });

  it("dark mode uses bone for body text (NOT ink)", () => {
    expect(EDITORIAL_COLORS.dark.text).toBe(palette.bone);
    expect(EDITORIAL_COLORS.dark.text).not.toBe(palette.ink);
    expect(EDITORIAL_COLORS.dark.textSecondary).toBe(palette.bone);
    expect(EDITORIAL_COLORS.dark.brandMark).toBe(palette.bone);
  });

  it("accent (amber/gold) is identical in both modes", () => {
    expect(EDITORIAL_COLORS.light.accent).toBe(palette.gold);
    expect(EDITORIAL_COLORS.dark.accent).toBe(palette.gold);
  });

  it("muted text uses warm-palette mid-tones, not pure ink/bone", () => {
    expect(EDITORIAL_COLORS.light.textMuted).toBe(palette.walnut);
    expect(EDITORIAL_COLORS.dark.textMuted).toBe(palette.umber);
  });

  it("rule color is the same family as muted text in each mode", () => {
    // Light: ink rule on paper (matches body text — the rule reads as text-derived)
    // Dark: umber rule on near-black (warmer than bone, dimmer than text)
    expect(EDITORIAL_COLORS.light.rule).toBe(palette.ink);
    expect(EDITORIAL_COLORS.dark.rule).toBe(palette.umber);
  });

  it("editorialColors() is equivalent to direct lookup", () => {
    expect(editorialColors("light")).toBe(EDITORIAL_COLORS.light);
    expect(editorialColors("dark")).toBe(EDITORIAL_COLORS.dark);
  });
});

describe("modeFromBackdropRegister", () => {
  it("returns 'dark' when register is 'dark'", () => {
    expect(modeFromBackdropRegister("dark")).toBe("dark");
  });

  it("returns 'light' when register is 'light'", () => {
    expect(modeFromBackdropRegister("light")).toBe("light");
  });

  it("returns 'light' when register is undefined (safe default)", () => {
    expect(modeFromBackdropRegister(undefined)).toBe("light");
  });

  it("returns 'light' when register is null (safe default)", () => {
    expect(modeFromBackdropRegister(null)).toBe("light");
  });
});

// ── Manifest contract — every backdrop has a register field ───────────────────

describe("backdrop-manifest.json register field", () => {
  const entries = backdropManifest.backdrops as Array<{
    id: string;
    register: "light" | "dark";
  }>;

  it("contains exactly 25 backdrops (16 light + 9 dark)", () => {
    expect(entries).toHaveLength(25);
    const light = entries.filter((e) => e.register === "light");
    const dark = entries.filter((e) => e.register === "dark");
    expect(light).toHaveLength(16);
    expect(dark).toHaveLength(9);
  });

  it("every entry has a register field (no implicit defaults)", () => {
    for (const e of entries) {
      expect(
        e.register,
        `${e.id} missing register field`,
      ).toMatch(/^(light|dark)$/);
    }
  });

  it("expected 9 dark-register backdrops are all dark", () => {
    const expectedDark = [
      "night-operations",
      "abyss-depth",
      "foundry-ember",
      "city-noir",
      "archive-nocturne",
      "constellation-grid",
      "switchyard-night",
      "rift-silhouette",
      "night-grid",
    ];
    for (const id of expectedDark) {
      const entry = entries.find((e) => e.id === id);
      expect(entry, `${id} not found in manifest`).toBeDefined();
      expect(entry?.register, `${id} should be dark`).toBe("dark");
    }
  });

  it("resolver agrees with manifest for every backdrop (9 dark → 'dark', rest → 'light')", () => {
    // Tripwire — locks the FullEpisode wiring's expected behavior. If a
    // backdrop's register flips in the manifest, this test catches it before
    // a silent render-time mode swap.
    let lightCount = 0;
    let darkCount = 0;
    for (const e of entries) {
      const mode: EditorialMode = modeFromBackdropRegister(e.register);
      expect(mode, `${e.id} resolver mismatch`).toBe(e.register);
      if (mode === "dark") darkCount++;
      else lightCount++;
    }
    expect(darkCount).toBe(9);
    expect(lightCount).toBe(16);
  });
});
