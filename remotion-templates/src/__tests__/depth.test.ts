/**
 * depth.ts — unit tests for shadow, glow, gradient, and color-math utilities.
 *
 * These are pure functions with no React or Remotion dependencies: they take
 * primitive arguments and return CSS strings or CSSProperties objects. Zero
 * mocking required.
 *
 * Used actively in at least 5 templates (EscalationLadder, HorizontalTimeline,
 * NetworkDiagram, DataChart, KineticTypography) — regressions here silently
 * break shadows and bar gradients across the board without type errors.
 *
 * COVERAGE:
 *   · contentShadow / mediumShadow — dark and light mode variants
 *   · accentGlow — default spread, custom spread
 *   · highlightShadow — composes contentShadow + accentGlow correctly
 *   · glow — intensity=0 returns "none"; non-zero scales spread + alpha
 *   · layeredShadow — falsy / "none" filtering, ordering, empty case
 *   · textShadow — dark returns value, light returns "none"
 *   · barGradient — structure, color preserved at top, darkened at bottom
 *   · gradientDivider — returns CSSProperties with expected geometry
 *   · lightenHex — moves each channel toward 255 by percentage
 *   · darkenHex (via barGradient) — channel-wise multiply, indirectly tested
 */

import { describe, expect, it } from "vitest";
import {
  contentShadow,
  mediumShadow,
  accentGlow,
  highlightShadow,
  glow,
  layeredShadow,
  textShadow,
  barGradient,
  gradientDivider,
  lightenHex,
} from "../utils/depth";

// ── contentShadow ─────────────────────────────────────────────────────────────

describe("contentShadow", () => {
  it("dark mode (default) returns a shadow string", () => {
    const s = contentShadow();
    expect(typeof s).toBe("string");
    expect(s.length).toBeGreaterThan(0);
  });

  it("dark mode and light mode return different values", () => {
    expect(contentShadow(true)).not.toBe(contentShadow(false));
  });

  it("dark mode has higher blur/opacity than light mode", () => {
    // Dark: 0 2px 12px rgba(0,0,0,0.25) — light: 0 1px 8px rgba(0,0,0,0.08)
    expect(contentShadow(true)).toContain("0.25");
    expect(contentShadow(false)).toContain("0.08");
  });
});

// ── mediumShadow ──────────────────────────────────────────────────────────────

describe("mediumShadow", () => {
  it("dark mode (default) has stronger shadow than contentShadow dark", () => {
    // mediumShadow: 0 4px 20px rgba(0,0,0,0.35)  vs  contentShadow: 0 2px 12px rgba(0,0,0,0.25)
    expect(mediumShadow(true)).toContain("0.35");
    expect(mediumShadow(false)).toContain("0.12");
  });

  it("dark and light modes differ", () => {
    expect(mediumShadow(true)).not.toBe(mediumShadow(false));
  });
});

// ── accentGlow ────────────────────────────────────────────────────────────────

describe("accentGlow", () => {
  it("returns expected default-spread format", () => {
    // 25% opacity = 0x40 hex
    expect(accentGlow("#E5A544")).toBe("0 0 16px #E5A54440");
  });

  it("custom spread is used", () => {
    expect(accentGlow("#E5A544", 8)).toBe("0 0 8px #E5A54440");
    expect(accentGlow("#C23B22", 32)).toBe("0 0 32px #C23B2240");
  });

  it("appends 40 alpha suffix to any 6-char hex color", () => {
    const result = accentGlow("#FFFFFF");
    expect(result).toContain("#FFFFFF40");
  });
});

// ── highlightShadow ───────────────────────────────────────────────────────────

describe("highlightShadow", () => {
  it("combines contentShadow and accentGlow with a comma", () => {
    const h = highlightShadow("#E5A544");
    expect(h).toContain(contentShadow(true));
    expect(h).toContain(accentGlow("#E5A544"));
    expect(h).toContain(", ");
  });

  it("uses light contentShadow when isDark=false", () => {
    const h = highlightShadow("#E5A544", false);
    expect(h).toContain(contentShadow(false));
    expect(h).toContain(accentGlow("#E5A544"));
  });
});

// ── glow ─────────────────────────────────────────────────────────────────────

describe("glow", () => {
  it("intensity=0 returns 'none'", () => {
    expect(glow("#FF0000", 0)).toBe("none");
  });

  it("negative intensity returns 'none'", () => {
    expect(glow("#FF0000", -1)).toBe("none");
  });

  it("intensity=1 produces spread = baseSpread + scaleSpread (defaults: 8+4=12)", () => {
    const result = glow("#FF0000", 1);
    expect(result).toContain("12px");
    expect(result).toContain("#FF0000");
  });

  it("intensity=0.5 produces spread = 8 + 4*0.5 = 10", () => {
    const result = glow("#FF0000", 0.5);
    expect(result).toContain("10px");
  });

  it("alpha scales with intensity: intensity=1 → 0x60, intensity=0.5 → 0x30", () => {
    expect(glow("#FF0000", 1)).toContain("#FF000060");
    expect(glow("#FF0000", 0.5)).toContain("#FF000030");
  });

  it("custom baseSpread and scaleSpread are respected", () => {
    // spread = 10 + 6*0.5 = 13
    const result = glow("#AA0000", 0.5, 10, 6);
    expect(result).toContain("13px");
  });

  it("default intensity=1 (no argument) returns a non-none string", () => {
    expect(glow("#E5A544")).not.toBe("none");
  });
});

// ── layeredShadow ─────────────────────────────────────────────────────────────

describe("layeredShadow", () => {
  it("no arguments returns 'none'", () => {
    expect(layeredShadow()).toBe("none");
  });

  it("all-falsy arguments returns 'none'", () => {
    expect(layeredShadow(null, false, undefined)).toBe("none");
  });

  it("single 'none' string returns 'none'", () => {
    expect(layeredShadow("none")).toBe("none");
  });

  it("'none' strings are filtered out", () => {
    expect(layeredShadow("none", "0 2px 4px black")).toBe("0 2px 4px black");
  });

  it("two real layers joined with ', '", () => {
    expect(layeredShadow("a", "b")).toBe("a, b");
  });

  it("falsy layers removed, real layers preserved in order", () => {
    expect(layeredShadow("a", null, "b", undefined, "c")).toBe("a, b, c");
  });

  it("single real layer returned without comma", () => {
    expect(layeredShadow("0 2px 8px black")).toBe("0 2px 8px black");
  });
});

// ── textShadow ────────────────────────────────────────────────────────────────

describe("textShadow", () => {
  it("dark mode (default) returns a non-empty shadow string", () => {
    const s = textShadow();
    expect(s).not.toBe("none");
    expect(s.length).toBeGreaterThan(0);
  });

  it("light mode returns 'none'", () => {
    expect(textShadow(false)).toBe("none");
  });
});

// ── barGradient ───────────────────────────────────────────────────────────────

describe("barGradient", () => {
  it("returns a linear-gradient string", () => {
    const result = barGradient("#E5A544");
    expect(result).toMatch(/^linear-gradient\(to bottom,/);
  });

  it("original color appears first (top of bar)", () => {
    expect(barGradient("#E5A544")).toContain("#E5A544");
  });

  it("bottom color is darker than top (15% channel-wise darkening)", () => {
    const result = barGradient("#E5A544");
    // #E5A544: r=229, g=165, b=68
    // darkened 15%: r=round(229*0.85)=195=0xC3, g=round(165*0.85)=140=0x8C, b=round(68*0.85)=58=0x3A
    expect(result).toContain("#c38c3a");
  });

  it("pure white: darken 15% → #d9d9d9", () => {
    // r=g=b=255: round(255*0.85)=217=0xD9
    const result = barGradient("#ffffff");
    expect(result).toContain("#d9d9d9");
  });

  it("pure black: darken 15% → #000000 (can't go darker)", () => {
    const result = barGradient("#000000");
    expect(result).toContain("#000000");
  });
});

// ── gradientDivider ───────────────────────────────────────────────────────────

describe("gradientDivider", () => {
  it("returns a CSSProperties object", () => {
    const div = gradientDivider("#E5A544");
    expect(typeof div).toBe("object");
    expect(div).not.toBeNull();
  });

  it("height is 2", () => {
    expect(gradientDivider("#E5A544").height).toBe(2);
  });

  it("default widthPercent is 70%", () => {
    expect(gradientDivider("#E5A544").width).toBe("70%");
  });

  it("custom widthPercent is respected", () => {
    expect(gradientDivider("#E5A544", 50).width).toBe("50%");
  });

  it("background is a horizontal gradient through the given color", () => {
    const bg = gradientDivider("#E5A544").background as string;
    expect(bg).toContain("to right");
    expect(bg).toContain("#E5A544");
    expect(bg).toContain("transparent");
  });

  it("margin is '0 auto'", () => {
    expect(gradientDivider("#E5A544").margin).toBe("0 auto");
  });
});

// ── lightenHex ────────────────────────────────────────────────────────────────

describe("lightenHex", () => {
  it("lighten pure black by 50% → #808080", () => {
    // r=g=b=0: round(0 + 255*0.5) = round(127.5) = 128 = 0x80
    expect(lightenHex("#000000", 0.5)).toBe("#808080");
  });

  it("lighten pure white by any amount → still white", () => {
    expect(lightenHex("#ffffff", 0.5)).toBe("#ffffff");
    expect(lightenHex("#ffffff", 1.0)).toBe("#ffffff");
  });

  it("lighten by 0 → color unchanged", () => {
    expect(lightenHex("#E5A544", 0)).toBe("#e5a544");
  });

  it("lighten by 1.0 → pure white", () => {
    expect(lightenHex("#1C1814", 1.0)).toBe("#ffffff");
  });

  it("each channel moves toward 255 independently", () => {
    // #ff0000 (r=255, g=0, b=0) lightened by 0.5:
    // r: round(255 + (255-255)*0.5) = 255 = 0xFF
    // g: round(0 + (255-0)*0.5) = round(127.5) = 128 = 0x80
    // b: same as g = 0x80
    expect(lightenHex("#ff0000", 0.5)).toBe("#ff8080");
  });

  it("returns lowercase hex string", () => {
    const result = lightenHex("#AABBCC", 0);
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });
});
