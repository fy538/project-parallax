import { describe, expect, it } from "vitest";
import backdropManifest from "../../data/backdrop-manifest.json";
import type { BackdropEntry } from "../components/EditorialSurface";
import {
  backdropChartFit,
  backdropSupportsChartFit,
  chartFitFromDensity,
} from "../utils/backdropChartFit";

const rows = backdropManifest.backdrops as unknown as BackdropEntry[];

describe("backdropChartFit", () => {
  it("derives low from busy density", () => {
    expect(chartFitFromDensity("busy")).toBe("low");
    expect(chartFitFromDensity("quiet")).toBe("high");
    expect(chartFitFromDensity("medium")).toBe("medium");
  });

  it("respects manifest chartFit override on strategy-grid", () => {
    const sg = rows.find((b) => b.id === "strategy-grid")!;
    expect(sg.density).toBe("medium");
    expect(backdropChartFit(sg)).toBe("high");
  });

  it("reading-room supports sparse foreground only", () => {
    const rr = rows.find((b) => b.id === "reading-room")!;
    expect(backdropChartFit(rr)).toBe("low");
    expect(backdropSupportsChartFit(rr, "low")).toBe(true);
    expect(backdropSupportsChartFit(rr, "high")).toBe(false);
  });
});
