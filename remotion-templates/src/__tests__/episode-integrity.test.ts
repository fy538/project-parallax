/**
 * Episode Integrity — static manifest validation (no render required).
 *
 * Catches manifest/data mismatches *before* a 2-hour full render:
 *   - Every template.dataFile referenced in the manifest is importable from TEMPLATE_DATA
 *   - Every template.dataFile JSON file exists on disk
 *   - Every template.component is registered in TEMPLATE_COMPONENTS
 *   - Every "resolved" asset file exists in public/
 *   - No segment exceeds totalDurationSec
 *   - Timeline gaps > 30s are reported as failures (dead visual air)
 *
 * Run: npm test src/__tests__/episode-integrity.test.ts
 * (< 1 second — pure filesystem + JSON checks, no rendering)
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// ── Import the manifest and episode data ────────────────────────────────────
import manifest from "../../data/episodes/prisoners-dilemma/assembly-manifest.json";
import { TEMPLATE_DATA } from "../templates/Episodes/prisoners-dilemma-data";
import { TEMPLATE_COMPONENTS } from "../templates/Episodes/FullEpisode";

const PUBLIC_DIR = path.resolve(__dirname, "../../public");
const DATA_DIR = path.resolve(__dirname, "../../data/episodes/prisoners-dilemma");

// ── Helpers ─────────────────────────────────────────────────────────────────

function segmentsWithTemplate() {
  return manifest.segments.filter((s: any) => s.template?.component);
}

function segmentsWithDataFile() {
  return manifest.segments.filter((s: any) => s.template?.dataFile);
}

function resolvedAssetSegments() {
  return manifest.segments.filter(
    (s: any) => s.asset?.status === "resolved" && s.asset?.file
  );
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("prisoners-dilemma episode integrity", () => {
  // ── Data file coverage ──────────────────────────────────────────────────

  it("all template.dataFile values are imported in TEMPLATE_DATA", () => {
    const missing: string[] = [];
    for (const seg of segmentsWithDataFile()) {
      const file = (seg as any).template.dataFile as string;
      if (!(file in TEMPLATE_DATA)) {
        missing.push(`${(seg as any).id}: "${file}" not in TEMPLATE_DATA`);
      }
    }
    if (missing.length > 0) {
      throw new Error(
        `\n${missing.length} dataFile(s) missing from TEMPLATE_DATA:\n  ${missing.join("\n  ")}\n` +
        `Fix: add import + entry in prisoners-dilemma-data.ts`
      );
    }
    expect(missing).toHaveLength(0);
  });

  it("all template.dataFile JSON files exist on disk", () => {
    const missing: string[] = [];
    const seen = new Set<string>();
    for (const seg of segmentsWithDataFile()) {
      const file = (seg as any).template.dataFile as string;
      if (seen.has(file)) continue;
      seen.add(file);
      const fullPath = path.join(DATA_DIR, file);
      if (!fs.existsSync(fullPath)) {
        missing.push(`  ${file}  ← missing from data/episodes/prisoners-dilemma/`);
      }
    }
    if (missing.length > 0) {
      throw new Error(`\n${missing.length} JSON data file(s) not found on disk:\n${missing.join("\n")}`);
    }
    expect(missing).toHaveLength(0);
  });

  // ── Component registration ──────────────────────────────────────────────

  it("all template.component values are registered in TEMPLATE_COMPONENTS", () => {
    const unknown: string[] = [];
    const seen = new Set<string>();
    for (const seg of segmentsWithTemplate()) {
      const comp = (seg as any).template.component as string;
      if (seen.has(comp)) continue;
      seen.add(comp);
      if (!(comp in TEMPLATE_COMPONENTS)) {
        unknown.push(`  "${comp}"  ← not in TEMPLATE_COMPONENTS (FullEpisode.tsx)`);
      }
    }
    if (unknown.length > 0) {
      throw new Error(
        `\n${unknown.length} unknown component(s) in manifest:\n${unknown.join("\n")}\n` +
        `Fix: add to TEMPLATE_COMPONENTS in FullEpisode.tsx`
      );
    }
    expect(unknown).toHaveLength(0);
  });

  // ── Asset file presence ─────────────────────────────────────────────────

  it("all resolved asset files exist in public/", () => {
    const missing: string[] = [];
    for (const seg of resolvedAssetSegments()) {
      const s = seg as any;
      const assetPath = path.join(
        PUBLIC_DIR,
        "episodes/prisoners-dilemma",
        s.asset.file
      );
      if (!fs.existsSync(assetPath)) {
        missing.push(`  ${s.id}: ${s.asset.file}`);
      }
    }
    if (missing.length > 0) {
      throw new Error(
        `\n${missing.length} "resolved" asset file(s) missing from public/:\n${missing.join("\n")}\n` +
        `Fix: either source the file or change asset.status to "pending"`
      );
    }
    expect(missing).toHaveLength(0);
  });

  // ── Timeline math ────────────────────────────────────────────────────────

  it("no segment exceeds totalDurationSec", () => {
    const total = (manifest as any).totalDurationSec as number;
    const overrun = manifest.segments.filter(
      (s: any) => s.endSec > total + 0.1 // 0.1s float tolerance
    );
    if (overrun.length > 0) {
      const details = overrun.map((s: any) =>
        `  ${s.id}: endSec=${s.endSec} > totalDurationSec=${total}`
      );
      throw new Error(`\n${overrun.length} segment(s) exceed totalDurationSec:\n${details.join("\n")}`);
    }
    expect(overrun).toHaveLength(0);
  });

  it("no two segments on the same layer overlap in time", () => {
    const byLayer: Record<string, any[]> = {};
    for (const seg of manifest.segments) {
      const s = seg as any;
      const layer = s.layer ?? "background";
      if (!byLayer[layer]) byLayer[layer] = [];
      byLayer[layer].push(s);
    }

    const overlaps: string[] = [];
    for (const [layer, segs] of Object.entries(byLayer)) {
      const sorted = segs.slice().sort((a, b) => a.startSec - b.startSec);
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        // Overlap: current starts before previous ends (with 0.05s float tolerance)
        if (curr.startSec < prev.endSec - 0.05) {
          overlaps.push(
            `  [${layer}] ${prev.id} (${prev.startSec}-${prev.endSec}) overlaps ${curr.id} (${curr.startSec}-${curr.endSec})`
          );
        }
      }
    }
    if (overlaps.length > 0) {
      throw new Error(`\n${overlaps.length} segment overlap(s) detected:\n${overlaps.join("\n")}`);
    }
    expect(overlaps).toHaveLength(0);
  });

  // ── Visual coverage gaps ─────────────────────────────────────────────────

  it("no single-layer gap > 30s (dead visual air)", () => {
    // For each layer, find gaps between consecutive segments. A gap > 30s
    // in BOTH layers simultaneously means that region renders as blank paper.
    // Threshold 30s = approx. 3-4 lines of narration with no visual support.
    const GAP_THRESHOLD = 30;

    const byLayer: Record<string, any[]> = {};
    for (const seg of manifest.segments) {
      const s = seg as any;
      const layer = s.layer ?? "background";
      if (!byLayer[layer]) byLayer[layer] = [];
      byLayer[layer].push(s);
    }

    const criticalGaps: string[] = [];
    for (const [layer, segs] of Object.entries(byLayer)) {
      const sorted = segs.slice().sort((a, b) => a.startSec - b.startSec);
      for (let i = 1; i < sorted.length; i++) {
        const gap = sorted[i].startSec - sorted[i - 1].endSec;
        if (gap > GAP_THRESHOLD) {
          criticalGaps.push(
            `  [${layer}] ${gap.toFixed(1)}s gap: after ${sorted[i - 1].id} ` +
            `(ends ${sorted[i - 1].endSec.toFixed(1)}s) before ${sorted[i].id} ` +
            `(starts ${sorted[i].startSec.toFixed(1)}s)`
          );
        }
      }
    }

    if (criticalGaps.length > 0) {
      throw new Error(
        `\n${criticalGaps.length} gap(s) > ${GAP_THRESHOLD}s — dead visual air in renders:\n` +
        `${criticalGaps.join("\n")}\n` +
        `Fix: insert HOLD segments or reduce gaps in assembly-manifest.json`
      );
    }
    expect(criticalGaps).toHaveLength(0);
  });

  // ── Manifest metadata ─────────────────────────────────────────────────────

  it("manifest has valid fps and totalDurationSec", () => {
    const m = manifest as any;
    expect(typeof m.fps).toBe("number");
    expect(m.fps).toBeGreaterThan(0);
    expect(typeof m.totalDurationSec).toBe("number");
    expect(m.totalDurationSec).toBeGreaterThan(0);
  });

  it("every segment has required fields: id, type, startSec, endSec, layer", () => {
    const invalid: string[] = [];
    for (const seg of manifest.segments) {
      const s = seg as any;
      if (!s.id) invalid.push("missing id");
      if (!s.type) invalid.push(`${s.id ?? "??"}: missing type`);
      if (typeof s.startSec !== "number") invalid.push(`${s.id}: missing startSec`);
      if (typeof s.endSec !== "number") invalid.push(`${s.id}: missing endSec`);
      if (s.startSec >= s.endSec) invalid.push(`${s.id}: startSec (${s.startSec}) >= endSec (${s.endSec})`);
      if (!s.layer) invalid.push(`${s.id}: missing layer`);
    }
    if (invalid.length > 0) {
      throw new Error(`\nSegment field violations:\n  ${invalid.join("\n  ")}`);
    }
    expect(invalid).toHaveLength(0);
  });
});
