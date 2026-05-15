/**
 * Schema ↔ type alignment regression — locks the May 14 quick-win
 * pattern where map-template TypeScript unions are derived from Zod
 * enums via `z.infer`, NOT hand-typed.
 *
 * Why this matters: previously the same enum was duplicated in
 * `LabelDensitySchema` (Zod) and `RouteAnimationData.labelDensity` (TS
 * hand-typed union). Adding a 5th register meant editing 4 places with
 * no compile-time link. This test asserts the schemas' enum membership
 * matches what consumers expect, so the next time someone adds an enum
 * variant they get a failing test until the hand-typed union (if any)
 * catches up.
 *
 * If you're failing this test: don't hand-edit a union — re-import the
 * inferred type from the schema file.
 */

import { describe, it, expect } from "vitest";
import {
  LabelDensitySchema,
  LightPresetSchema,
  RegisterSchema,
} from "../components/MapGL.types";
import { AtlasAestheticSchema } from "../templates/AtlasPlate/schema";
import { MAP_STYLES } from "../components/MapGL";

describe("MapGL.types: LabelDensity enum membership is locked", () => {
  it("contains exactly the v1 register set", () => {
    expect(LabelDensitySchema.options).toEqual([
      "atlas",
      "editorial",
      "minimal",
      "off",
    ]);
  });
});

describe("MapGL.types: LightPreset enum membership is locked", () => {
  it("contains exactly the four canonical presets", () => {
    expect(LightPresetSchema.options).toEqual(["day", "dawn", "dusk", "night"]);
  });
});

describe("AtlasPlate: aesthetic enum membership is locked", () => {
  it("contains exactly the v1 register set", () => {
    expect(AtlasAestheticSchema.options).toEqual([
      "atlas",
      "vintage",
      "atlas-relief",
    ]);
  });
});

describe("MapGL: Register enum + MAP_STYLES dict are aligned", () => {
  it("RegisterSchema contains exactly the v1 register set", () => {
    expect(RegisterSchema.options).toEqual([
      "light",
      "dark",
      "vintage",
      "toner",
    ]);
  });

  it("MAP_STYLES has an entry for every register (no orphans either way)", () => {
    // Forward: every schema option must have a MAP_STYLES key. This is
    // the contract — adding a new register requires updating BOTH places.
    for (const reg of RegisterSchema.options) {
      expect(MAP_STYLES).toHaveProperty(reg);
      expect(typeof MAP_STYLES[reg]).toBe("string");
      expect(MAP_STYLES[reg].length).toBeGreaterThan(0);
    }
    // Reverse: every MAP_STYLES key must be a known register.
    for (const key of Object.keys(MAP_STYLES)) {
      expect(RegisterSchema.options).toContain(key);
    }
  });
});
