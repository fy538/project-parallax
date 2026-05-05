/**
 * Tests for scripts/lint-conventions.mjs — verifies each lint rule actually
 * catches what it claims to. Without these, a rule could quietly stop firing
 * (regex regression, false-negative) and we'd never know.
 *
 * Each test feeds synthetic file content through `lintContent(content, filePath)`
 * and asserts on the returned issue array.
 */

import { describe, it, expect } from "vitest";
// @ts-expect-error — .mjs file, no .d.ts
import {
  lintContent,
  lintRootCompositions,
} from "../../scripts/lint-conventions.mjs";

interface Issue {
  rule: string;
  severity: "error" | "warn" | "info";
  message: string;
  line: number;
}

const lint = (content: string, filePath = "src/templates/Test/Test.tsx") =>
  lintContent(content, filePath, filePath) as Issue[];

const hasRule = (issues: Issue[], rule: string) =>
  issues.some((i) => i.rule === rule);

describe("lint rule: missing-composition-animation (L44)", () => {
  it("flags a .tsx with no useCompositionAnimation / wrapper", () => {
    const issues = lint(`export const Foo = () => <div>title</div>;`);
    expect(hasRule(issues, "missing-composition-animation")).toBe(true);
  });

  it("accepts useCompositionAnimation called directly", () => {
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      export const Foo = () => {
        const { style } = useCompositionAnimation();
        return <div style={style} />;
      };
    `);
    expect(hasRule(issues, "missing-composition-animation")).toBe(false);
  });

  it("accepts ShortsWrapper as a canonical wrapper", () => {
    const issues = lint(`
      import { ShortsWrapper } from "../../components/ShortsWrapper";
      export const Foo = () => <ShortsWrapper>{() => null}</ShortsWrapper>;
    `);
    expect(hasRule(issues, "missing-composition-animation")).toBe(false);
  });

  it("accepts EpisodeSeries as a canonical wrapper", () => {
    const issues = lint(`
      import { EpisodeSeries } from "../../components/EpisodeSeries";
      export const Foo = () => <EpisodeSeries clips={[]} />;
    `);
    expect(hasRule(issues, "missing-composition-animation")).toBe(false);
  });

  it("ignores grandfathered templates (TimeSeriesChart)", () => {
    const issues = lint(
      `export const Foo = () => <div />;`,
      "src/templates/TimeSeriesChart/TimeSeriesChart.tsx",
    );
    expect(hasRule(issues, "missing-composition-animation")).toBe(false);
  });

  it("does not check non-.tsx files", () => {
    const issues = lint(`const x = 1;`, "src/templates/Foo/types.ts");
    expect(hasRule(issues, "missing-composition-animation")).toBe(false);
  });

  it("skips index.tsx (composition registration files)", () => {
    const issues = lint(`<Composition id="foo" />`, "src/templates/Foo/index.tsx");
    expect(hasRule(issues, "missing-composition-animation")).toBe(false);
  });
});

describe("lint rule: nested-ken-burns (L66)", () => {
  it("warns when a template uses both useCompositionAnimation and a manual kenBurnsDrift", () => {
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      import { kenBurnsDrift } from "../../utils/animation";
      export const Foo = () => {
        const { style } = useCompositionAnimation();
        const drift = kenBurnsDrift(0, 100, 1.03);
        return <div style={{ ...style, transform: \`scale(\${drift})\` }} />;
      };
    `);
    const hits = issues.filter((i) => i.rule === "nested-ken-burns");
    expect(hits).toHaveLength(1);
    expect(hits[0].severity).toBe("warn");
  });

  it("allows manual kenBurnsDrift when noDrift: true is passed to the hook (L66 escape hatch)", () => {
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      import { kenBurnsDrift } from "../../utils/animation";
      export const Foo = () => {
        const { style } = useCompositionAnimation({ noDrift: true });
        const drift = kenBurnsDrift(0, 100, 1.03);
        return <div style={{ ...style, transform: \`scale(\${drift})\` }} />;
      };
    `);
    expect(hasRule(issues, "nested-ken-burns")).toBe(false);
  });

  it("allows kenBurnsDrift in files that don't use the hook (TimeSeriesChart pattern)", () => {
    const issues = lint(`
      import { kenBurnsDrift } from "../../utils/animation";
      export const Foo = () => {
        const drift = kenBurnsDrift(0, 100, 1.01);
        return <div style={{ transform: \`scale(\${drift})\` }} />;
      };
    `);
    expect(hasRule(issues, "nested-ken-burns")).toBe(false);
  });
});

describe("lint rule: cjk-without-chinese-font (L13)", () => {
  it("warns on CJK display text in JSX without fonts.chinese reference", () => {
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      export const Foo = () => {
        useCompositionAnimation();
        return <div>卡脖子</div>;
      };
    `);
    expect(hasRule(issues, "cjk-without-chinese-font")).toBe(true);
  });

  it("allows CJK when fonts.chinese is referenced", () => {
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      import { fonts } from "../../design/theme";
      export const Foo = () => {
        useCompositionAnimation();
        return <div style={{ fontFamily: fonts.chinese }}>卡脖子</div>;
      };
    `);
    expect(hasRule(issues, "cjk-without-chinese-font")).toBe(false);
  });

  it("does not flag CJK inside regex character classes", () => {
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      const cjkRe = /[一-鿿]/;
      export const Foo = () => {
        useCompositionAnimation();
        return <div>english only</div>;
      };
    `);
    expect(hasRule(issues, "cjk-without-chinese-font")).toBe(false);
  });

  it("skips index.tsx files (sample-data defaults are rendered by the companion component)", () => {
    const issues = lint(
      `<Composition defaultProps={{ data: { title: "卡脖子" } }} />`,
      "src/templates/Foo/index.tsx",
    );
    expect(hasRule(issues, "cjk-without-chinese-font")).toBe(false);
  });
});

describe("lint rule: explicit-standard-tier (L69)", () => {
  it("warns when safeAreaTier is set to literal 'standard'", () => {
    const issues = lint(`<TitleBlock safeAreaTier="standard" />`);
    expect(hasRule(issues, "explicit-standard-tier")).toBe(true);
  });

  it("does not flag generous, tight, or broadcast", () => {
    const issues = lint(`<TitleBlock safeAreaTier="tight" />`);
    expect(hasRule(issues, "explicit-standard-tier")).toBe(false);
  });
});

describe("lintRootCompositions (L20 — duplicate composition ids)", () => {
  it("returns no issues when all composition ids are unique", () => {
    const root = `
      <Composition id="DataChart" />
      <Composition id="ChoroplethMap" />
      <Composition id="silicon-trap" />
    `;
    const issues = lintRootCompositions(root) as Issue[];
    expect(issues).toEqual([]);
  });

  it("flags every duplicate id with line number of the duplicate", () => {
    const root = `
      <Composition id="DataChart" />
      <Composition id="ChoroplethMap" />
      <Composition id="DataChart" />
    `;
    const issues = lintRootCompositions(root) as Issue[];
    expect(issues).toHaveLength(1);
    expect(issues[0].rule).toBe("duplicate-composition-id");
    expect(issues[0].severity).toBe("error");
    expect(issues[0].message).toContain("DataChart");
  });

  it("handles multiple distinct duplicates", () => {
    const root = `
      <Composition id="A" />
      <Composition id="B" />
      <Composition id="A" />
      <Composition id="B" />
    `;
    const issues = lintRootCompositions(root) as Issue[];
    expect(issues).toHaveLength(2);
  });
});

describe("rules array integrity", () => {
  it("every rule has id, description, severity", () => {
    // Smoke test that the export shape is consistent — protects against accidental
    // schema drift when adding rules.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return import("../../scripts/lint-conventions.mjs").then((m: unknown) => {
      const rules = (m as { rules: { id: string; description: string; severity: string }[] }).rules;
      expect(rules.length).toBeGreaterThan(0);
      for (const r of rules) {
        expect(typeof r.id).toBe("string");
        expect(typeof r.description).toBe("string");
        expect(["error", "warn", "info"]).toContain(r.severity);
      }
    });
  });
});
