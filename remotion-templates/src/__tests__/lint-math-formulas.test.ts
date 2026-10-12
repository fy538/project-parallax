/**
 * Tests for scripts/lint-math-formulas.mjs — Phase 4+5 math lint rules.
 *
 * Covers:
 *   · extractFormulas  — JSON tree walk yielding { formula, pointer }
 *   · validateFormula  — M-MATH-VALID (KaTeX parse)
 *   · checkFormulaLength — M-MATH-LENGTH (> 80 chars)
 *   · checkFormulaColors — M-MATH-COLOR (\textcolor{HEX} brand check)
 *   · ALLOWED_TEXTCOLOR_HEXES — the brand palette set
 */

import { describe, it, expect } from "vitest";

// @ts-expect-error — .mjs file, no .d.ts
import {
  extractFormulas,
  validateFormula,
  checkFormulaLength,
  checkFormulaColors,
  ALLOWED_TEXTCOLOR_HEXES,
} from "../../scripts/lint-math-formulas.mjs";

// ── extractFormulas ──────────────────────────────────────────────────────────

describe("extractFormulas", () => {
  it("yields formula from top-level object", () => {
    const obj = { formula: "x + y = z", other: "data" };
    const results = [...extractFormulas(obj)];
    expect(results).toHaveLength(1);
    expect(results[0].formula).toBe("x + y = z");
    expect(results[0].pointer).toBe("$.formula");
  });

  it("yields formula from nested steps array (MathDerivation shape)", () => {
    const obj = {
      steps: [
        { formula: "a = b", holdSec: 2 },
        { formula: "b = c", holdSec: 2 },
      ],
    };
    const results = [...extractFormulas(obj)];
    expect(results).toHaveLength(2);
    expect(results[0].formula).toBe("a = b");
    expect(results[0].pointer).toBe("$.steps[0].formula");
    expect(results[1].formula).toBe("b = c");
  });

  it("yields formula from deeply nested objects", () => {
    const obj = { section: { data: { formula: "\\pi" } } };
    const results = [...extractFormulas(obj)];
    expect(results).toHaveLength(1);
    expect(results[0].formula).toBe("\\pi");
    expect(results[0].pointer).toBe("$.section.data.formula");
  });

  it("yields no formulas from a flat object with no formula key", () => {
    const obj = { title: "test", durationSec: 5 };
    const results = [...extractFormulas(obj)];
    expect(results).toHaveLength(0);
  });

  it("does not descend into nested `formula` objects (formula must be a string)", () => {
    // If formula is an object, it should be recursed — not yielded as a string.
    const obj = { formula: { nested: "x" } };
    const results = [...extractFormulas(obj)];
    expect(results).toHaveLength(0); // formula object is NOT yielded; only string values
  });

  it("handles arrays at top level", () => {
    const arr = [{ formula: "a" }, { formula: "b" }];
    const results = [...extractFormulas(arr)];
    expect(results).toHaveLength(2);
  });

  it("handles null / undefined without crashing", () => {
    expect([...extractFormulas(null)]).toHaveLength(0);
    expect([...extractFormulas(undefined)]).toHaveLength(0);
  });
});

// ── validateFormula (M-MATH-VALID) ────────────────────────────────────────────

describe("validateFormula — M-MATH-VALID", () => {
  it("returns null for a valid formula", () => {
    expect(validateFormula("x + y = z")).toBeNull();
    expect(validateFormula("\\mathbb{E}[U_i] = p \\cdot a")).toBeNull();
    expect(validateFormula("\\frac{P(E|H)P(H)}{P(E)}")).toBeNull();
  });

  it("returns an error message for an invalid TeX command", () => {
    const err = validateFormula("\\notarealcommand{x}");
    expect(err).not.toBeNull();
    expect(typeof err).toBe("string");
  });

  it("returns an error for unclosed braces", () => {
    const err = validateFormula("\\frac{x}{");
    expect(err).not.toBeNull();
  });

  it("returns null for a valid aligned environment (multi-line)", () => {
    // \begin{aligned} works in KaTeX display mode — Phase 5 doc update.
    const aligned = "\\begin{aligned} x &= 1 \\\\ y &= x^2 \\end{aligned}";
    expect(validateFormula(aligned)).toBeNull();
  });

  it("returns null for a valid formula with \\textcolor (brand color)", () => {
    // \textcolor parses fine in KaTeX strict mode.
    const colored = "\\textcolor{#C4A747}{x} + y = z";
    expect(validateFormula(colored)).toBeNull();
  });
});

// ── checkFormulaLength (M-MATH-LENGTH) ────────────────────────────────────────

describe("checkFormulaLength — M-MATH-LENGTH", () => {
  it("returns null for a formula at exactly 80 chars", () => {
    const formula = "x".repeat(80);
    expect(checkFormulaLength(formula)).toBeNull();
  });

  it("returns null for a formula under 80 chars", () => {
    expect(checkFormulaLength("x + y = z")).toBeNull();
    expect(checkFormulaLength("\\mathbb{E}[U]")).toBeNull();
  });

  it("returns a message for a formula at 81 chars (just over)", () => {
    const formula = "x".repeat(81);
    const msg = checkFormulaLength(formula);
    expect(msg).not.toBeNull();
    expect(msg).toContain("81");
    expect(msg).toContain("M-MATH-LENGTH");
  });

  it("includes the actual char count in the message", () => {
    const formula = "a".repeat(120);
    const msg = checkFormulaLength(formula);
    expect(msg).toContain("120");
  });

  it("includes a split-step suggestion in the message", () => {
    const formula = "a".repeat(90);
    const msg = checkFormulaLength(formula);
    expect(msg).toContain("Split");
  });
});

// ── checkFormulaColors (M-MATH-COLOR) ─────────────────────────────────────────

describe("checkFormulaColors — M-MATH-COLOR", () => {
  it("returns empty array when no \\textcolor is used", () => {
    const errors = checkFormulaColors("x + y = z");
    expect(errors).toHaveLength(0);
  });

  it("returns empty array for all five brand palette hexes", () => {
    const brandHexes = [...ALLOWED_TEXTCOLOR_HEXES];
    for (const hex of brandHexes) {
      const formula = `\\textcolor{${hex}}{x}`;
      const errors = checkFormulaColors(formula);
      expect(errors).toHaveLength(0);
    }
  });

  it("returns empty array for brand hexes in any case (case-insensitive)", () => {
    // Uppercase
    expect(checkFormulaColors("\\textcolor{#C4A747}{x}")).toHaveLength(0);
    // Lowercase
    expect(checkFormulaColors("\\textcolor{#c4a747}{x}")).toHaveLength(0);
    // Mixed
    expect(checkFormulaColors("\\textcolor{#C4a747}{x}")).toHaveLength(0);
  });

  it("flags an off-brand hex", () => {
    const errors = checkFormulaColors("\\textcolor{#FF0000}{x}");
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("M-MATH-COLOR");
    expect(errors[0]).toContain("#FF0000");
  });

  it("flags multiple off-brand hexes in a single formula", () => {
    const formula = "\\textcolor{#FF0000}{x} + \\textcolor{#00FF00}{y}";
    const errors = checkFormulaColors(formula);
    expect(errors).toHaveLength(2);
  });

  it("flags off-brand but allows brand hexes in the same formula", () => {
    const formula = "\\textcolor{#C4A747}{x} + \\textcolor{#ABCDEF}{y}";
    const errors = checkFormulaColors(formula);
    // Only #ABCDEF is off-brand
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain("#ABCDEF");
  });

  it("does NOT flag named colors like `red` or `blue` (outside brand hex scope)", () => {
    // Named colors don't start with `#`; the rule only validates hex values.
    const errors = checkFormulaColors("\\textcolor{red}{x}");
    expect(errors).toHaveLength(0);
  });

  it("does NOT flag rgb() color arguments", () => {
    const errors = checkFormulaColors("\\textcolor{rgb(255,0,0)}{x}");
    expect(errors).toHaveLength(0);
  });
});

// ── ALLOWED_TEXTCOLOR_HEXES integrity ─────────────────────────────────────────

describe("ALLOWED_TEXTCOLOR_HEXES palette integrity", () => {
  const expectedPalette = [
    "#C4A747", // gold
    "#786526", // goldText (text on light backgrounds)
    "#3C6A95", // dustblueText (text on light backgrounds)
    "#A64D46", // rust/china
    "#7AA3C9", // dustblue
    "#5C4A3D", // walnut
    "#1C1814", // ink
  ];

  it("contains exactly the seven documented brand hexes", () => {
    expect(ALLOWED_TEXTCOLOR_HEXES.size).toBe(expectedPalette.length);
    for (const hex of expectedPalette) {
      expect(ALLOWED_TEXTCOLOR_HEXES.has(hex)).toBe(true);
    }
  });

  it("stores hexes in uppercase (normalization contract)", () => {
    for (const hex of ALLOWED_TEXTCOLOR_HEXES) {
      expect(hex).toBe(hex.toUpperCase());
    }
  });
});
