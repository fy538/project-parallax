/**
 * useEpisodeColorEmphasis — unit tests for the validation guard.
 *
 * The Provider's behavior depends on `normalizeEpisodeColorEmphasis(value)`
 * to keep the resolved palette and the stored emphasis name consistent.
 * Without normalization, an invalid string would resolve to the neutral
 * palette (via getEpisodeColorEmphasis fallback) but be tagged as
 * "non-neutral" by name — causing Background to apply an unintended
 * atmospheric tint.
 *
 * The pure helper `normalizeEpisodeColorEmphasis` is testable without
 * rendering React; the Provider/context behavior is exercised indirectly
 * through every template render.
 */

import { describe, expect, it } from "vitest";
import { normalizeEpisodeColorEmphasis } from "../hooks/useEpisodeColorEmphasis";
import { EMPHASIS_VALUES } from "../design/theme";

describe("normalizeEpisodeColorEmphasis", () => {
  describe("recognized values pass through", () => {
    for (const name of EMPHASIS_VALUES) {
      it(`returns "${name}" unchanged`, () => {
        expect(normalizeEpisodeColorEmphasis(name)).toBe(name);
      });
    }
  });

  describe("invalid values normalize to neutral", () => {
    it("undefined → neutral", () => {
      expect(normalizeEpisodeColorEmphasis(undefined)).toBe("neutral");
    });

    it("null → neutral", () => {
      expect(normalizeEpisodeColorEmphasis(null)).toBe("neutral");
    });

    it("empty string → neutral", () => {
      expect(normalizeEpisodeColorEmphasis("")).toBe("neutral");
    });

    it("typo (close to valid name) → neutral", () => {
      // Typo of "soviet" — silently falls back so a misspelling doesn't
      // ship as a non-neutral atmospheric tint.
      expect(normalizeEpisodeColorEmphasis("sovet")).toBe("neutral");
    });

    it("future / unrecognized name → neutral", () => {
      expect(normalizeEpisodeColorEmphasis("post-soviet")).toBe("neutral");
    });

    it("non-string types defensively → neutral", () => {
      // The type signature accepts string | undefined | null but JS
      // could pass anything. Belt + suspenders.
      expect(normalizeEpisodeColorEmphasis(42 as unknown as string)).toBe("neutral");
      expect(normalizeEpisodeColorEmphasis({} as unknown as string)).toBe("neutral");
    });
  });

  describe("contract: name + palette stay consistent", () => {
    it("normalize never returns a name outside EMPHASIS_VALUES", () => {
      const inputs = [undefined, null, "", "soviet", "garbage", "neutral", "purple"];
      for (const input of inputs) {
        const result = normalizeEpisodeColorEmphasis(input as string | undefined);
        expect(EMPHASIS_VALUES).toContain(result);
      }
    });
  });
});
