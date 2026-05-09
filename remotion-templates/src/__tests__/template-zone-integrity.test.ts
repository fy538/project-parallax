/**
 * template-zone-integrity.test.ts — Layout math unit tests for computeTemplateLayout().
 *
 * Calls computeTemplateLayout() directly (zero browser / zero render overhead)
 * and asserts zone integrity using the shared layout-assertions helpers.
 *
 * WHY THIS EXISTS alongside real-data render tests:
 *   Real-data tests compare rendered PNGs against saved baselines. Baselines can
 *   be updated — a layout collision can be "fixed" by accepting the broken image.
 *   These tests operate on raw layout math and CANNOT be baseline-updated away.
 *
 *   Additionally: HorizontalTimeline and SplitComposition both use
 *   useTemplateLayout(). Previously the hook's geometry was untestable outside
 *   a React component. The computeTemplateLayout() extraction makes it testable
 *   here, covering both templates transitively.
 *
 * COVERAGE:
 *   · All four safeAreaTier values (tight → generous)
 *   · All title variants (content, minimal, episode, section, none, custom)
 *   · Footer present / absent
 *   · Split layout (left + right zones)
 *   · Custom gaps (titleContentGap, contentFooterGap, splitGap)
 *   · Known template configs (HorizontalTimeline, SplitComposition shapes)
 *   · Split-specific invariants: left/right adjacency, no overlap, symmetric sizing
 *   · Injected-collision regression: corrupted zones detected by assertNoOverlap
 */

import { describe, expect, it } from "vitest";
import {
  computeTemplateLayout,
  type TemplateLayoutOptions,
  type Rect,
} from "../hooks/useTemplateLayout";
import { layout } from "../design/theme";
import {
  assertZoneIntegrity,
  assertMinHeight,
  assertNoOverlap,
  type NamedBox,
  type ZoneRect,
} from "./layout-assertions";

const CANVAS_W = layout.width;   // 1920
const CANVAS_H = layout.height;  // 1080

// Minimum usable content height.
const MIN_CONTENT_HEIGHT = 150;

/**
 * Convert a Rect (top/left/width/height + bottom/right as distance-from-edge)
 * to a ZoneRect (top/left/width/height absolute coords) for assertZoneIntegrity.
 */
function rectToZoneRect(r: Rect): ZoneRect {
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

/** Pull the five zones out of a computeTemplateLayout result as NamedBox[]. */
function toNamedBoxes(opts: TemplateLayoutOptions): NamedBox[] {
  const { zones } = computeTemplateLayout(opts);
  return [
    { name: "title",   box: rectToZoneRect(zones.title.rect)   },
    { name: "content", box: rectToZoneRect(zones.content.rect) },
    { name: "footer",  box: rectToZoneRect(zones.footer.rect)  },
  ];
}

/** Pull split zones as NamedBox[]. */
function toSplitNamedBoxes(opts: TemplateLayoutOptions): NamedBox[] {
  const { zones } = computeTemplateLayout(opts);
  return [
    { name: "title",   box: rectToZoneRect(zones.title.rect)   },
    { name: "left",    box: rectToZoneRect(zones.left.rect)    },
    { name: "right",   box: rectToZoneRect(zones.right.rect)   },
    { name: "footer",  box: rectToZoneRect(zones.footer.rect)  },
  ];
}

// ── Config matrix ─────────────────────────────────────────────────────────────

interface ConfigCase {
  label: string;
  input: TemplateLayoutOptions;
}

const CONFIGS: ConfigCase[] = [
  // ── Title variants ────────────────────────────────────────────────────────
  { label: 'title:content (default)',             input: {} },
  { label: 'title:minimal',                       input: { title: "minimal" } },
  { label: 'title:episode',                       input: { title: "episode" } },
  { label: 'title:section',                       input: { title: "section" } },
  { label: 'title:none (content fills top)',       input: { title: "none" } },
  { label: 'title:custom 80px',                   input: { title: "custom", customTitleHeight: 80 } },
  { label: 'title:custom 200px',                  input: { title: "custom", customTitleHeight: 200 } },

  // ── safeAreaTier variants ─────────────────────────────────────────────────
  { label: 'safeArea:tight',                      input: { safeArea: "tight" } },
  { label: 'safeArea:standard',                   input: { safeArea: "standard" } },
  { label: 'safeArea:broadcast',                  input: { safeArea: "broadcast" } },
  { label: 'safeArea:generous (default)',         input: { safeArea: "generous" } },

  // ── Footer variants ───────────────────────────────────────────────────────
  { label: 'footer:0 (no footer)',                input: { footerHeight: 0 } },
  { label: 'footer:40 (default)',                 input: { footerHeight: 40 } },
  { label: 'footer:80 (tall footer)',             input: { footerHeight: 80 } },

  // ── Gap overrides ─────────────────────────────────────────────────────────
  { label: 'titleContentGap:0',                   input: { titleContentGap: 0 } },
  { label: 'titleContentGap:96 (double)',         input: { titleContentGap: 96 } },
  { label: 'contentFooterGap:0',                  input: { contentFooterGap: 0 } },

  // ── Combinations ─────────────────────────────────────────────────────────
  { label: 'minimal title + tight safe area',    input: { title: "minimal", safeArea: "tight" } },
  { label: 'episode title + broadcast safe area', input: { title: "episode", safeArea: "broadcast" } },
  { label: 'none title + no footer',             input: { title: "none", footerHeight: 0 } },

  // ── Template-specific configs ─────────────────────────────────────────────
  // HorizontalTimeline uses useTemplateLayout with these patterns
  { label: 'HorizontalTimeline shape (minimal + footer)',
    input: { title: "minimal", safeArea: "generous", footerHeight: 40 } },
  // SplitComposition non-split mode uses content zone for both panels
  { label: 'SplitComposition non-split (content title)',
    input: { title: "content", safeArea: "generous", footerHeight: 40 } },
];

const SPLIT_CONFIGS: ConfigCase[] = [
  { label: 'split:true, defaults',               input: { split: true } },
  { label: 'split:true, minimal title',          input: { split: true, title: "minimal" } },
  { label: 'split:true, no title',               input: { split: true, title: "none" } },
  { label: 'split:true, tight safe area',        input: { split: true, safeArea: "tight" } },
  { label: 'split:true, splitGap:0',             input: { split: true, splitGap: 0 } },
  { label: 'split:true, splitGap:96',            input: { split: true, splitGap: 96 } },
  { label: 'split:true, no footer',              input: { split: true, footerHeight: 0 } },
  // SplitComposition cinematic split shape
  { label: 'SplitComposition cinematic split',
    input: { split: true, title: "content", safeArea: "generous", footerHeight: 40 } },
];

// ── Matrix tests ──────────────────────────────────────────────────────────────

describe("computeTemplateLayout — no collision / in bounds (non-split)", () => {
  CONFIGS.forEach(({ label, input }) => {
    it(label, () => {
      assertZoneIntegrity(toNamedBoxes(input), CANVAS_W, CANVAS_H);
    });
  });
});

describe("computeTemplateLayout — content has usable height (non-split)", () => {
  CONFIGS.forEach(({ label, input }) => {
    it(label, () => {
      const { zones } = computeTemplateLayout(input);
      assertMinHeight(
        { name: "content", box: rectToZoneRect(zones.content.rect) },
        MIN_CONTENT_HEIGHT
      );
    });
  });
});

describe("computeTemplateLayout — no collision / in bounds (split)", () => {
  SPLIT_CONFIGS.forEach(({ label, input }) => {
    it(label, () => {
      assertZoneIntegrity(toSplitNamedBoxes(input), CANVAS_W, CANVAS_H);
    });
  });
});

describe("computeTemplateLayout — split panels have usable height", () => {
  SPLIT_CONFIGS.forEach(({ label, input }) => {
    it(label, () => {
      const { zones } = computeTemplateLayout(input);
      assertMinHeight({ name: "left",  box: rectToZoneRect(zones.left.rect)  }, MIN_CONTENT_HEIGHT);
      assertMinHeight({ name: "right", box: rectToZoneRect(zones.right.rect) }, MIN_CONTENT_HEIGHT);
    });
  });
});

// ── Structural invariants ─────────────────────────────────────────────────────

describe("computeTemplateLayout structural invariants", () => {
  it("title + content + footer stack without overlap", () => {
    const { zones } = computeTemplateLayout({ title: "content", footerHeight: 40 });
    const t = zones.title.rect;
    const c = zones.content.rect;
    const f = zones.footer.rect;
    // Content starts after title
    expect(c.top).toBeGreaterThan(t.top + t.height);
    // Footer starts after content
    expect(f.top).toBeGreaterThan(c.top + c.height);
  });

  it("title:none content starts at safe.top", () => {
    const { zones, safe } = computeTemplateLayout({ title: "none" });
    expect(zones.content.rect.top).toBe(safe.top);
  });

  it("footer bottom edge is at canvas bottom minus safe area", () => {
    const { zones, safe } = computeTemplateLayout({ footerHeight: 40 });
    const f = zones.footer.rect;
    expect(f.top + f.height).toBe(CANVAS_H - safe.bottom);
  });

  it("footerHeight:0 — footer zone has zero height", () => {
    const { zones } = computeTemplateLayout({ footerHeight: 0 });
    expect(zones.footer.rect.height).toBe(0);
  });

  it("all zones share the same left edge", () => {
    const { zones } = computeTemplateLayout({ title: "content", footerHeight: 40 });
    const lefts = [
      zones.title.rect.left,
      zones.content.rect.left,
      zones.footer.rect.left,
    ];
    expect(new Set(lefts).size).toBe(1);
  });

  it("all zones share the same width (title width = content width = footer width)", () => {
    const { zones } = computeTemplateLayout({ title: "content", footerHeight: 40 });
    expect(zones.content.rect.width).toBe(zones.title.rect.width);
    expect(zones.footer.rect.width).toBe(zones.title.rect.width);
  });

  it("canvas dimensions match layout constants", () => {
    const { canvas } = computeTemplateLayout();
    expect(canvas.width).toBe(CANVAS_W);
    expect(canvas.height).toBe(CANVAS_H);
  });

  it("safe area insets match the requested tier", () => {
    for (const tier of ["tight", "standard", "broadcast", "generous"] as const) {
      const { safe } = computeTemplateLayout({ safeArea: tier });
      const expected = layout.safeAreaTier[tier];
      expect(safe).toEqual(expected);
    }
  });

  it("larger safeAreaTier reduces content width", () => {
    const tight     = computeTemplateLayout({ safeArea: "tight" });
    const generous  = computeTemplateLayout({ safeArea: "generous" });
    expect(tight.zones.content.rect.width).toBeGreaterThan(
      generous.zones.content.rect.width
    );
  });

  it("episode title is taller than content title, which is taller than minimal", () => {
    const episode  = computeTemplateLayout({ title: "episode" });
    const content  = computeTemplateLayout({ title: "content" });
    const minimal  = computeTemplateLayout({ title: "minimal" });
    expect(episode.zones.title.rect.height).toBeGreaterThan(content.zones.title.rect.height);
    expect(content.zones.title.rect.height).toBeGreaterThan(minimal.zones.title.rect.height);
  });

  it("customTitleHeight is respected exactly", () => {
    const { zones } = computeTemplateLayout({ title: "custom", customTitleHeight: 123 });
    expect(zones.title.rect.height).toBe(123);
  });

  it("titleContentGap shifts content.top by the gap amount", () => {
    const base    = computeTemplateLayout({ title: "content", titleContentGap: 48 });
    const bigGap  = computeTemplateLayout({ title: "content", titleContentGap: 96 });
    expect(bigGap.zones.content.rect.top - base.zones.content.rect.top).toBe(48);
  });
});

// ── Split-specific invariants ─────────────────────────────────────────────────

describe("computeTemplateLayout split invariants", () => {
  it("left and right panels are the same size", () => {
    const { zones } = computeTemplateLayout({ split: true });
    expect(zones.left.rect.width).toBe(zones.right.rect.width);
    expect(zones.left.rect.height).toBe(zones.right.rect.height);
  });

  it("left and right panels start at the same vertical position", () => {
    const { zones } = computeTemplateLayout({ split: true });
    expect(zones.left.rect.top).toBe(zones.right.rect.top);
  });

  it("right panel starts exactly at left.left + left.width + splitGap", () => {
    const gap = 64;
    const { zones } = computeTemplateLayout({ split: true, splitGap: gap });
    const expectedRightLeft = zones.left.rect.left + zones.left.rect.width + gap;
    expect(zones.right.rect.left).toBe(expectedRightLeft);
  });

  it("left + gap + right fills the full content width", () => {
    const { zones } = computeTemplateLayout({ split: true, splitGap: 48 });
    const totalWidth =
      zones.left.rect.width + 48 + zones.right.rect.width;
    expect(totalWidth).toBe(zones.content.rect.width);
  });

  it("split panels do not overlap each other", () => {
    const { zones } = computeTemplateLayout({ split: true });
    const boxes: NamedBox[] = [
      { name: "left",  box: rectToZoneRect(zones.left.rect)  },
      { name: "right", box: rectToZoneRect(zones.right.rect) },
    ];
    assertNoOverlap(boxes);
  });

  it("split panels do not overlap title or footer", () => {
    assertZoneIntegrity(
      toSplitNamedBoxes({ split: true, title: "content", footerHeight: 40 }),
      CANVAS_W,
      CANVAS_H
    );
  });
});

// ── Regression: assertNoOverlap detects injected collisions ───────────────────

describe("assertNoOverlap — detects injected collisions in template zones", () => {
  it("flags content-title overlap when content.top < title.bottom", () => {
    const { zones } = computeTemplateLayout({ title: "content" });
    const t = zones.title.rect;
    const boxes: NamedBox[] = [
      { name: "title",   box: rectToZoneRect(t) },
      // Artificially move content to start at title top
      { name: "content", box: { top: t.top, left: t.left, width: t.width, height: 400 } },
    ];
    expect(() => assertNoOverlap(boxes)).toThrow(/collision/i);
  });

  it("flags footer-content overlap when footer moved into content area", () => {
    const { zones } = computeTemplateLayout({ title: "content", footerHeight: 40 });
    const c = zones.content.rect;
    const boxes: NamedBox[] = [
      { name: "content", box: rectToZoneRect(c) },
      // Artificially move footer to the middle of content
      { name: "footer",  box: { top: c.top + 50, left: c.left, width: c.width, height: 40 } },
    ];
    expect(() => assertNoOverlap(boxes)).toThrow(/collision/i);
  });
});
