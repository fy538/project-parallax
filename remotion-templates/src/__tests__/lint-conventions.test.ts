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

  it("accepts @composition-animation: delegated pragma (router/helper escape hatch)", () => {
    const issues = lint(`
      // @composition-animation: delegated — pure router
      import React from "react";
      import { SubA } from "./SubA";
      import { SubB } from "./SubB";
      export const Router = ({ data }: { data: any }) => {
        if (data.mode === "a") return <SubA data={data} />;
        return <SubB data={data} />;
      };
    `);
    expect(hasRule(issues, "missing-composition-animation")).toBe(false);
  });

  it("flags any template missing the hook — no grandfathering", () => {
    // The previously-grandfathered templates (GameBoard, StrategicLandscape,
    // TimeSeriesChart) have all been migrated to call useCompositionAnimation.
    // The rule is now uniform: every template needs the hook.
    const issues = lint(
      `export const Foo = () => <div />;`,
      "src/templates/TimeSeriesChart/TimeSeriesChart.tsx",
    );
    expect(hasRule(issues, "missing-composition-animation")).toBe(true);
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

describe("lint rule: missing-title-block", () => {
  const minimalAnimatedTemplate = `
    import { AbsoluteFill } from "remotion";
    import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
    import { useDirection } from "../../hooks/useDirection";
    export const Foo = ({ data }: { data: { title: string } }) => {
      useDirection(data._direction);
      const { style } = useCompositionAnimation();
      return (
        <AbsoluteFill style={style}>
          <span>{data.title}</span>
        </AbsoluteFill>
      );
    };
  `;

  it("flags templates that use data.title without TitleBlock", () => {
    const issues = lint(
      minimalAnimatedTemplate,
      "src/templates/Foo/Bar.tsx",
    );
    expect(hasRule(issues, "missing-title-block")).toBe(true);
  });

  it("allows TitleBlock", () => {
    const issues = lint(
      `
      import { AbsoluteFill } from "remotion";
      import { TitleBlock } from "../../components/TitleBlock";
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      import { useDirection } from "../../hooks/useDirection";
      export const Foo = ({ data }: any) => {
        useDirection(data._direction);
        const { style } = useCompositionAnimation();
        return (
          <AbsoluteFill style={style}>
            <TitleBlock title={data.title} mode="content" />
          </AbsoluteFill>
        );
      };
    `,
      "src/templates/Foo/Bar.tsx",
    );
    expect(hasRule(issues, "missing-title-block")).toBe(false);
  });

  it("skips Shorts/ (9:16 templates use Shorts title chrome, not TitleBlock)", () => {
    const issues = lint(
      minimalAnimatedTemplate,
      "src/templates/Shorts/DataChartShort.tsx",
    );
    expect(hasRule(issues, "missing-title-block")).toBe(false);
  });

  it("skips known non-TitleBlock layouts by basename", () => {
    for (const base of [
      "SplitComposition.tsx",
      "Thumbnail.tsx",
      "TitleTransition.tsx",
      "ImageComposite.tsx",
    ]) {
      const issues = lint(
        minimalAnimatedTemplate,
        `src/templates/X/${base}`,
      );
      expect(hasRule(issues, "missing-title-block")).toBe(false);
    }
  });

  it("accepts @title-block: none pragma", () => {
    const issues = lint(
      `
      // @title-block: none — custom kicker row
      ${minimalAnimatedTemplate}
    `,
      "src/templates/Foo/CustomTitle.tsx",
    );
    expect(hasRule(issues, "missing-title-block")).toBe(false);
  });

  it("accepts @title-block: delegated pragma (child owns TitleBlock)", () => {
    const issues = lint(
      `
      // @title-block: delegated — layout shell only
      ${minimalAnimatedTemplate}
    `,
      "src/templates/Foo/Shell.tsx",
    );
    expect(hasRule(issues, "missing-title-block")).toBe(false);
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

describe("lint rule: missing-direction-wiring (Rule 8)", () => {
  it("warns on animated template that skips useDirection", () => {
    const issues = lint(`
      import { AbsoluteFill, useCurrentFrame } from "remotion";
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      export const Foo = ({ data }: { data: any }) => {
        const { style } = useCompositionAnimation();
        return <AbsoluteFill style={style}><div>{data.title}</div></AbsoluteFill>;
      };
    `);
    expect(hasRule(issues, "missing-direction-wiring")).toBe(true);
  });

  it("accepts animated template that calls useDirection", () => {
    const issues = lint(`
      import { AbsoluteFill } from "remotion";
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      import { useDirection } from "../../hooks/useDirection";
      export const Foo = ({ data }: { data: any }) => {
        const { style } = useCompositionAnimation();
        const direction = useDirection(data._direction);
        return <AbsoluteFill style={style}>{direction.mode}</AbsoluteFill>;
      };
    `);
    expect(hasRule(issues, "missing-direction-wiring")).toBe(false);
  });

  it("skips static (noDrift: true) compositions", () => {
    const issues = lint(`
      import { AbsoluteFill } from "remotion";
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      export const Thumbnail = ({ data }: { data: any }) => {
        const { style } = useCompositionAnimation({ noDrift: true });
        return <AbsoluteFill style={style}><div>{data.title}</div></AbsoluteFill>;
      };
    `);
    expect(hasRule(issues, "missing-direction-wiring")).toBe(false);
  });

  it("skips pure router files with no AbsoluteFill even when they use useCompositionAnimation", () => {
    // A router/dispatcher file that calls the hook but renders only named
    // components (no AbsoluteFill) should be exempt — it delegates direction
    // to its children.
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      import { SubComponentA } from "./SubComponentA";
      import { SubComponentB } from "./SubComponentB";
      export const RouterFoo = ({ data }: { data: any }) => {
        useCompositionAnimation();
        if (data.mode === "a") return <SubComponentA data={data} />;
        return <SubComponentB data={data} />;
      };
    `);
    expect(hasRule(issues, "missing-direction-wiring")).toBe(false);
  });

  it("does not check index.tsx files", () => {
    const issues = lint(
      `const x = useCompositionAnimation();`,
      "src/templates/Foo/index.tsx"
    );
    expect(hasRule(issues, "missing-direction-wiring")).toBe(false);
  });
});

describe("lint rule: hardcoded-brand-color (Rule 9)", () => {
  it("errors on hardcoded palette.ink hex", () => {
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      export const Foo = ({ data }: { data: any }) => {
        useCompositionAnimation();
        return <div style={{ color: "#1C1814" }}>{data.title}</div>;
      };
    `);
    expect(hasRule(issues, "hardcoded-brand-color")).toBe(true);
  });

  it("errors on hardcoded legacy amber (#E5A544)", () => {
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      export const Foo = ({ data }: { data: any }) => {
        useCompositionAnimation();
        return <div style={{ backgroundColor: "#E5A544" }}>{data.title}</div>;
      };
    `);
    const brandIssues = issues.filter((i) => i.rule === "hardcoded-brand-color");
    expect(brandIssues.length).toBeGreaterThan(0);
    expect(brandIssues[0].message).toContain("palette.gold");
  });

  it("does not flag comment lines", () => {
    const issues = lint(`
      // Background: #F5F0E8 (paper white)
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      export const Foo = ({ data }: { data: any }) => {
        useCompositionAnimation();
        return <div>{data.title}</div>;
      };
    `);
    expect(hasRule(issues, "hardcoded-brand-color")).toBe(false);
  });

  it("does not flag index.tsx files", () => {
    const issues = lint(
      `const defaultBg = "#1C1814";`,
      "src/templates/Foo/index.tsx"
    );
    expect(hasRule(issues, "hardcoded-brand-color")).toBe(false);
  });

  it("does not flag theme.ts itself", () => {
    const issues = lint(
      `export const palette = { ink: "#1C1814" };`,
      "src/design/theme.ts"
    );
    expect(hasRule(issues, "hardcoded-brand-color")).toBe(false);
  });
});

// ── Rule 12: no-as-any-in-templates ─────────────────────────────────────────

describe("lint rule: no-as-any-in-templates (Rule 12)", () => {
  it("flags bare `as any` in template source", () => {
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      export const Foo = ({ data }: { data: any }) => {
        useCompositionAnimation();
        const val = (data.items as any).length;
        return <div>{val}</div>;
      };
    `);
    expect(hasRule(issues, "no-as-any-in-templates")).toBe(true);
  });

  it("does not flag `as any` with no-as-any-ok inline comment", () => {
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      export const Foo = ({ data }: { data: any }) => {
        useCompositionAnimation();
        const val = (data.items as any).length; // no-as-any-ok: mapbox-expression
        return <div>{val}</div>;
      };
    `);
    expect(hasRule(issues, "no-as-any-in-templates")).toBe(false);
  });

  it("does not flag `as any` with eslint-disable-next-line no-as-any-in-templates above", () => {
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      export const Foo = ({ data }: { data: any }) => {
        useCompositionAnimation();
        // eslint-disable-next-line no-as-any-in-templates
        const val = (data.items as any).length;
        return <div>{val}</div>;
      };
    `);
    expect(hasRule(issues, "no-as-any-in-templates")).toBe(false);
  });

  it("does not flag `as any` with @typescript-eslint/no-explicit-any suppression above", () => {
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      export const Foo = ({ data }: { data: any }) => {
        useCompositionAnimation();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const val = (data.items as any).length;
        return <div>{val}</div>;
      };
    `);
    expect(hasRule(issues, "no-as-any-in-templates")).toBe(false);
  });

  it("does not flag comment lines that mention 'as any'", () => {
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      // Use as any for Mapbox expressions only
      export const Foo = ({ data }: { data: any }) => {
        useCompositionAnimation();
        return <div>{data.title}</div>;
      };
    `);
    expect(hasRule(issues, "no-as-any-in-templates")).toBe(false);
  });

  it("flags multiple as-any on different lines", () => {
    const issues = lint(`
      import { useCompositionAnimation } from "../../hooks/useCompositionAnimation";
      export const Foo = ({ data }: { data: any }) => {
        useCompositionAnimation();
        const a = data.foo as any;
        const b = data.bar as any;
        return <div>{a}{b}</div>;
      };
    `);
    const asAnyIssues = issues.filter((i) => i.rule === "no-as-any-in-templates");
    expect(asAnyIssues.length).toBe(2);
  });
});

// ── Rule 10: composition-hardcoded-duration (L48) ───────────────────────────

describe("lint rule: composition-hardcoded-duration (L48)", () => {
  const indexPath = "src/templates/Foo/index.tsx";

  it("flags <Composition> with hardcoded durationInFrames={sec(N)} and no calculateMetadata", () => {
    const issues = lint(
      `
      import { Composition } from "remotion";
      export const FooComposition = () => (
        <Composition
          id="Foo"
          component={Foo}
          durationInFrames={sec(8)}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
          defaultProps={{ data: sampleData }}
        />
      );
      `,
      indexPath,
    );
    expect(hasRule(issues, "composition-hardcoded-duration")).toBe(true);
  });

  it("does not flag <Composition> with calculateMetadata even if sec(...) appears near it", () => {
    // The canonical pattern: durationInFrames lives INSIDE calculateMetadata's
    // return, which itself contains a sec(...) call. The rule must not trip on
    // the legitimate pattern.
    const issues = lint(
      `
      import { Composition } from "remotion";
      export const FooComposition = () => (
        <Composition
          id="Foo"
          component={Foo}
          calculateMetadata={({ props }) => ({
            durationInFrames: sec((props.data as FooData).durationSec ?? 8),
            fps: layout.fps,
            width: layout.width,
            height: layout.height,
          })}
          defaultProps={{ data: sampleData }}
        />
      );
      `,
      indexPath,
    );
    expect(hasRule(issues, "composition-hardcoded-duration")).toBe(false);
  });

  it("respects the @hardcoded-duration: fixture pragma", () => {
    const issues = lint(
      `
      // @hardcoded-duration: fixture
      import { Composition } from "remotion";
      export const FixtureComposition = () => (
        <Composition
          id="Fixture"
          component={Fixture}
          durationInFrames={sec(14)}
          fps={layout.fps}
          width={layout.width}
          height={layout.height}
        />
      );
      `,
      indexPath,
    );
    expect(hasRule(issues, "composition-hardcoded-duration")).toBe(false);
  });

  it("does not run on non-index files", () => {
    // The pattern would technically match in a non-index file but the rule's
    // intent is composition-level. Component files don't register compositions.
    const issues = lint(
      `<Composition id="x" durationInFrames={sec(5)} />`,
      "src/templates/Foo/Foo.tsx",
    );
    expect(hasRule(issues, "composition-hardcoded-duration")).toBe(false);
  });

  it("does not flag files that don't contain <Composition>", () => {
    const issues = lint(
      `export const helper = () => sec(8);`,
      indexPath,
    );
    expect(hasRule(issues, "composition-hardcoded-duration")).toBe(false);
  });
});

// ── Rule 11: template-missing-schema (L47) ──────────────────────────────────

describe("lint rule: template-missing-schema (L47)", () => {
  it("flags a types.ts in a template dir with no sibling schema.ts", () => {
    // Use a deliberately-unique fake template name that won't exist on disk.
    // The rule checks fs.existsSync(schemaPath) — for a directory that doesn't
    // exist, the schema certainly doesn't exist either, so the rule fires.
    const fakeTypesPath =
      "/tmp/parallax-lint-fixture-no-schema-xyz123/types.ts";
    const issues = lint(`export interface FooData { title: string; }`, fakeTypesPath);
    expect(hasRule(issues, "template-missing-schema")).toBe(true);
  });

  it("does not flag wrapper directories (Shorts/Episodes/EditorialTest)", () => {
    for (const dirName of ["Shorts", "Episodes", "EditorialTest"]) {
      const issues = lint(
        `export type Foo = string;`,
        `src/templates/${dirName}/types.ts`,
      );
      expect(hasRule(issues, "template-missing-schema")).toBe(false);
    }
  });

  it("does not flag non-types.ts files", () => {
    const issues = lint(
      `export const x = 1;`,
      "/tmp/parallax-lint-fixture-no-schema-xyz123/helper.ts",
    );
    expect(hasRule(issues, "template-missing-schema")).toBe(false);
  });

  it("does not flag a types.ts when schema.ts exists alongside (real template)", () => {
    // Use a real template's types.ts path — these all have schema.ts siblings.
    const issues = lint(
      `export interface DataChartData { title: string; }`,
      "src/templates/DataChart/types.ts",
    );
    expect(hasRule(issues, "template-missing-schema")).toBe(false);
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
