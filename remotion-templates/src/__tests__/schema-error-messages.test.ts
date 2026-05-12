/**
 * Schema error-message contracts.
 *
 * Several template schemas have prose `.min(N, { message: "..." })` or
 * `superRefine(ctx.addIssue({ message: "..." }))` error messages that are
 * specifically worded to help data authors understand why their input was
 * rejected. The shipping commits (`17af733`, `f37971c`, `5d3331c`,
 * `145d038`, `0a6861e`) chose those messages deliberately.
 *
 * Nothing else guards the message text. A future schema edit could strip
 * the second-arg `{ message: ... }` object and leave just `.min(1)` —
 * rejection would still happen but the UX would degrade silently (Zod's
 * default "Array must contain at least 1 element(s)" surfaces instead).
 *
 * This test locks the descriptive messages to source. Each constraint
 * gets two cases:
 *
 *   1. Negative — minimal-bad input rejects with the documented message
 *      at the documented path. Catches: message stripping, message
 *      rewording, constraint accidentally removed.
 *   2. Positive control — minimum valid input passes. Catches: future
 *      edits that accidentally raise the minimum (e.g., `.min(2)`).
 *
 * Tests use `safeParse` so assertions read off `result.error.issues`
 * cleanly without try/catch ceremony.
 *
 * If a message gets legitimately edited later, update this file in the
 * same commit. The whole point is that the diff is visible.
 */

import { describe, it, expect } from "vitest";
import { TimeSeriesChartSchema } from "../templates/TimeSeriesChart/schema";
import { DataChartSchema } from "../templates/DataChart/schema";
import { GameBoardSchema } from "../templates/GameBoard/schema";
import { SankeyFlowSchema } from "../templates/SankeyFlow/schema";
import { NetworkDiagramSchema } from "../templates/NetworkDiagram/schema";

// ── TimeSeriesChart — lines.min(1) ──────────────────────────────────────────
// Constraint shipped in commit 17af733.

describe("TimeSeriesChart schema — lines.min(1)", () => {
  const EXPECTED_MESSAGE =
    "TimeSeriesChart requires at least one line. Empty `lines` would also cause divide-by-zero in the small-multiples panel grid.";

  it("rejects empty lines with the documented message", () => {
    const result = TimeSeriesChartSchema.safeParse({
      data: { episode: "x", title: "x", lines: [] },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path.join(".") === "data.lines"
      );
      expect(issue?.message).toBe(EXPECTED_MESSAGE);
    }
  });

  it("accepts a single valid line (minimum)", () => {
    const result = TimeSeriesChartSchema.safeParse({
      data: {
        episode: "x",
        title: "x",
        lines: [
          { label: "L", color: "#000", points: [{ x: 0, y: 0 }] },
        ],
      },
    });
    expect(result.success).toBe(true);
  });
});

// ── DataChart — superRefine per variant ─────────────────────────────────────
// Constraints shipped in commits f37971c (small-multiples) + 17af733
// (refinement of message text). The bar/horizontal/lollipop branch uses a
// template-literal message — variant value gets substituted, so the test
// pins one variant ("bar") and verifies the substitution literally.

describe("DataChart schema — superRefine per variant", () => {
  describe("variant 'bar' (also horizontal, lollipop) — dataPoints required", () => {
    const EXPECTED_MESSAGE = "variant 'bar' requires at least one dataPoint";

    it("rejects empty dataPoints with the documented message", () => {
      const result = DataChartSchema.safeParse({
        data: { episode: "x", title: "x", variant: "bar", dataPoints: [] },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path.join(".") === "data.dataPoints"
        );
        expect(issue?.message).toBe(EXPECTED_MESSAGE);
      }
    });

    it("accepts a single dataPoint (minimum)", () => {
      const result = DataChartSchema.safeParse({
        data: {
          episode: "x",
          title: "x",
          variant: "bar",
          dataPoints: [{ label: "L", value: 1 }],
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("variant 'comparison' — comparisonPairs required", () => {
    const EXPECTED_MESSAGE =
      "variant 'comparison' requires at least one comparisonPair";

    it("rejects empty comparisonPairs with the documented message", () => {
      const result = DataChartSchema.safeParse({
        data: {
          episode: "x",
          title: "x",
          variant: "comparison",
          comparisonPairs: [],
        },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path.join(".") === "data.comparisonPairs"
        );
        expect(issue?.message).toBe(EXPECTED_MESSAGE);
      }
    });

    it("accepts a single comparisonPair (minimum)", () => {
      const result = DataChartSchema.safeParse({
        data: {
          episode: "x",
          title: "x",
          variant: "comparison",
          comparisonPairs: [{ label: "L", leftValue: 1, rightValue: 2 }],
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("variant 'small-multiples' — panels required", () => {
    const EXPECTED_MESSAGE =
      "variant 'small-multiples' requires at least one panel";

    it("rejects empty panels with the documented message", () => {
      const result = DataChartSchema.safeParse({
        data: {
          episode: "x",
          title: "x",
          variant: "small-multiples",
          panels: [],
        },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path.join(".") === "data.panels"
        );
        expect(issue?.message).toBe(EXPECTED_MESSAGE);
      }
    });

    it("accepts a single panel (minimum)", () => {
      const result = DataChartSchema.safeParse({
        data: {
          episode: "x",
          title: "x",
          variant: "small-multiples",
          panels: [
            { title: "P1", dataPoints: [{ label: "L", value: 1 }] },
          ],
        },
      });
      expect(result.success).toBe(true);
    });
  });
});

// ── GameBoard — variant-gated phases / rounds ───────────────────────────────
// Constraints shipped in commits 5d3331c (iterated-play variant) + 17af733
// (refinement of variant gate). Non-iterated branch uses a template-literal
// message; the test pins one variant ("chess") to verify substitution.

describe("GameBoard schema — variant-gated phases / rounds", () => {
  describe("variant 'iterated-play' — rounds required", () => {
    const EXPECTED_MESSAGE =
      "variant 'iterated-play' requires at least one entry in `rounds`";

    it("rejects empty rounds with the documented message", () => {
      const result = GameBoardSchema.safeParse({
        data: {
          episode: "x",
          title: "x",
          variant: "iterated-play",
          rounds: [],
        },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path.join(".") === "data.rounds"
        );
        expect(issue?.message).toBe(EXPECTED_MESSAGE);
      }
    });

    it("accepts a single round (minimum)", () => {
      const result = GameBoardSchema.safeParse({
        data: {
          episode: "x",
          title: "x",
          variant: "iterated-play",
          rounds: [{ label: "R1", highlights: [] }],
        },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("variant 'chess' (also go, payoff-matrix, pd-canonical) — phases required", () => {
    const EXPECTED_MESSAGE =
      "variant 'chess' requires at least one entry in `phases`";

    it("rejects empty phases with the documented message", () => {
      const result = GameBoardSchema.safeParse({
        data: {
          episode: "x",
          title: "x",
          variant: "chess",
          phases: [],
        },
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find(
          (i) => i.path.join(".") === "data.phases"
        );
        expect(issue?.message).toBe(EXPECTED_MESSAGE);
      }
    });

    it("accepts a single phase (minimum)", () => {
      const result = GameBoardSchema.safeParse({
        data: {
          episode: "x",
          title: "x",
          variant: "chess",
          phases: [{ label: "P1", durationSec: 1 }],
        },
      });
      expect(result.success).toBe(true);
    });
  });
});

// ── SankeyFlow — nodes.min(2) + links.min(1) ────────────────────────────────
// Constraints shipped in commit 145d038.

describe("SankeyFlow schema — nodes.min(2) + links.min(1)", () => {
  const EXPECTED_NODES_MESSAGE =
    "SankeyFlow requires at least 2 nodes (one source + one destination). A single-node Sankey has nothing to flow.";
  const EXPECTED_LINKS_MESSAGE =
    "SankeyFlow requires at least one link. The form IS the flow — no links means there's nothing to visualize.";

  it("rejects empty nodes with the documented message", () => {
    const result = SankeyFlowSchema.safeParse({
      data: { episode: "x", title: "x", nodes: [], links: [] },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path.join(".") === "data.nodes"
      );
      expect(issue?.message).toBe(EXPECTED_NODES_MESSAGE);
    }
  });

  it("rejects empty links with the documented message", () => {
    const result = SankeyFlowSchema.safeParse({
      data: {
        episode: "x",
        title: "x",
        nodes: [
          { id: "a", label: "A", value: 1, column: 0 },
          { id: "b", label: "B", value: 1, column: 1 },
        ],
        links: [],
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path.join(".") === "data.links"
      );
      expect(issue?.message).toBe(EXPECTED_LINKS_MESSAGE);
    }
  });

  it("accepts 2 nodes + 1 link (minimum)", () => {
    const result = SankeyFlowSchema.safeParse({
      data: {
        episode: "x",
        title: "x",
        nodes: [
          { id: "a", label: "A", value: 1, column: 0 },
          { id: "b", label: "B", value: 1, column: 1 },
        ],
        links: [{ from: "a", to: "b", value: 1 }],
      },
    });
    expect(result.success).toBe(true);
  });
});

// ── NetworkDiagram — nodes.min(1) ───────────────────────────────────────────
// Constraint shipped in commit 0a6861e.

describe("NetworkDiagram schema — nodes.min(1)", () => {
  const EXPECTED_MESSAGE =
    "NetworkDiagram requires at least one node. An empty diagram has nothing to render.";

  it("rejects empty nodes with the documented message", () => {
    const result = NetworkDiagramSchema.safeParse({
      data: {
        episode: "x",
        title: "x",
        layout: "hub-spoke",
        nodes: [],
        edges: [],
      },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues.find(
        (i) => i.path.join(".") === "data.nodes"
      );
      expect(issue?.message).toBe(EXPECTED_MESSAGE);
    }
  });

  it("accepts a single node (minimum)", () => {
    const result = NetworkDiagramSchema.safeParse({
      data: {
        episode: "x",
        title: "x",
        layout: "hub-spoke",
        nodes: [
          {
            id: "n1",
            label: "N1",
            type: "nation",
            color: "#000",
          },
        ],
        edges: [],
      },
    });
    expect(result.success).toBe(true);
  });
});
