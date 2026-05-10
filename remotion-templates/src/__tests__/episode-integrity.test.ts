/**
 * Episode Integrity — static manifest validation for all episodes (no render).
 *
 * Discovers every assembly-manifest.json under data/episodes/ and validates:
 *   - Every template.dataFile JSON exists on disk
 *   - Every template.component is registered in TEMPLATE_COMPONENTS
 *   - Every "resolved" asset file exists in public/
 *   - No segment exceeds totalDurationSec
 *   - No same-layer segment overlaps
 *   - No single-layer gap > 30s (dead visual air)
 *   - All required segment fields present
 *   - Manifest has valid fps + totalDurationSec
 *
 * Runs in < 1 second (pure filesystem + JSON checks, no rendering).
 * Add a new episode: drop its assembly-manifest.json — this test picks it up.
 *
 * Run: npm run test:episode
 * Run single episode: EPISODE=prisoners-dilemma npm run test:episode
 */

import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { TEMPLATE_COMPONENTS } from "../templates/Episodes/FullEpisode";

// ── Paths ─────────────────────────────────────────────────────────────────────

const REMOTION_ROOT = path.resolve(__dirname, "../..");
const DATA_EPISODES_DIR = path.resolve(REMOTION_ROOT, "data/episodes");
const PUBLIC_DIR = path.resolve(REMOTION_ROOT, "public");

// ── Episode discovery ─────────────────────────────────────────────────────────

function discoverEpisodes(): Array<{ slug: string; manifestPath: string }> {
  const filter = process.env.EPISODE;
  if (!fs.existsSync(DATA_EPISODES_DIR)) return [];

  return fs
    .readdirSync(DATA_EPISODES_DIR)
    .filter((d) => {
      if (filter && d !== filter) return false;
      const mp = path.join(DATA_EPISODES_DIR, d, "assembly-manifest.json");
      return (
        fs.statSync(path.join(DATA_EPISODES_DIR, d)).isDirectory() &&
        fs.existsSync(mp)
      );
    })
    .map((slug) => ({
      slug,
      manifestPath: path.join(DATA_EPISODES_DIR, slug, "assembly-manifest.json"),
    }));
}

const EPISODES = discoverEpisodes();

// ── Shared helpers ────────────────────────────────────────────────────────────

function loadManifest(manifestPath: string): any {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function templateSegments(manifest: any) {
  return (manifest.segments ?? []).filter((s: any) => s.template?.component);
}

function dataFileSegments(manifest: any) {
  return (manifest.segments ?? []).filter((s: any) => s.template?.dataFile);
}

function resolvedAssetSegments(manifest: any) {
  return (manifest.segments ?? []).filter(
    (s: any) => s.asset?.status === "resolved" && s.asset?.file
  );
}

// ── Test suite per episode ────────────────────────────────────────────────────

if (EPISODES.length === 0) {
  describe("Episode Integrity", () => {
    it("at least one episode manifest exists", () => {
      expect(
        false,
        `No assembly-manifest.json found under ${DATA_EPISODES_DIR}. ` +
        `Run generate_manifest.py for at least one episode.`
      ).toBe(true);
    });
  });
}

for (const { slug, manifestPath } of EPISODES) {
  const dataDir = path.join(DATA_EPISODES_DIR, slug);
  const manifest = loadManifest(manifestPath);

  describe(`Episode "${slug}" integrity`, () => {
    // ── Manifest metadata ───────────────────────────────────────────────────

    it("has valid fps and totalDurationSec", () => {
      expect(typeof manifest.fps, "fps must be a number").toBe("number");
      expect(manifest.fps, "fps must be > 0").toBeGreaterThan(0);
      expect(
        typeof manifest.totalDurationSec,
        "totalDurationSec must be a number"
      ).toBe("number");
      expect(
        manifest.totalDurationSec,
        "totalDurationSec must be > 0"
      ).toBeGreaterThan(0);
    });

    // ── Segment field completeness ──────────────────────────────────────────

    it("every segment has required fields: id, type, startSec, endSec, layer", () => {
      const violations: string[] = [];
      for (const seg of manifest.segments ?? []) {
        if (!seg.id) violations.push("missing id");
        if (!seg.type) violations.push(`${seg.id ?? "??"}: missing type`);
        if (typeof seg.startSec !== "number")
          violations.push(`${seg.id}: missing startSec`);
        if (typeof seg.endSec !== "number")
          violations.push(`${seg.id}: missing endSec`);
        if (typeof seg.startSec === "number" && typeof seg.endSec === "number" &&
            seg.startSec >= seg.endSec)
          violations.push(
            `${seg.id}: startSec (${seg.startSec}) >= endSec (${seg.endSec})`
          );
        if (!seg.layer) violations.push(`${seg.id}: missing layer`);
      }
      if (violations.length > 0) {
        throw new Error(
          `\nSegment field violations:\n  ${violations.join("\n  ")}`
        );
      }
      expect(violations).toHaveLength(0);
    });

    // ── JSON data files on disk ─────────────────────────────────────────────

    it("all template.dataFile JSON files exist on disk", () => {
      const missing: string[] = [];
      const seen = new Set<string>();
      for (const seg of dataFileSegments(manifest)) {
        const file: string = seg.template.dataFile;
        if (seen.has(file)) continue;
        seen.add(file);
        if (!fs.existsSync(path.join(dataDir, file))) {
          missing.push(`  ${file}  ← not found in data/episodes/${slug}/`);
        }
      }
      if (missing.length > 0) {
        throw new Error(
          `\n${missing.length} JSON data file(s) missing:\n${missing.join("\n")}\n` +
          `Fix: create the file or remove the manifest reference.`
        );
      }
      expect(missing).toHaveLength(0);
    });

    // ── Component registration ──────────────────────────────────────────────

    it("all template.component values are registered in TEMPLATE_COMPONENTS", () => {
      const unknown: string[] = [];
      const seen = new Set<string>();
      for (const seg of templateSegments(manifest)) {
        const comp: string = seg.template.component;
        if (seen.has(comp)) continue;
        seen.add(comp);
        if (!(comp in TEMPLATE_COMPONENTS)) {
          unknown.push(
            `  "${comp}"  ← not in TEMPLATE_COMPONENTS (FullEpisode.tsx)`
          );
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
      for (const seg of resolvedAssetSegments(manifest)) {
        const assetPath = path.join(
          PUBLIC_DIR,
          `episodes/${slug}`,
          seg.asset.file
        );
        if (!fs.existsSync(assetPath)) {
          missing.push(`  ${seg.id}: ${seg.asset.file}`);
        }
      }
      if (missing.length > 0) {
        throw new Error(
          `\n${missing.length} "resolved" asset file(s) missing from public/:\n` +
          `${missing.join("\n")}\n` +
          `Fix: source the file, or change asset.status to "pending"`
        );
      }
      expect(missing).toHaveLength(0);
    });

    // ── Timeline math ────────────────────────────────────────────────────────

    it("no segment exceeds totalDurationSec", () => {
      const total: number = manifest.totalDurationSec;
      const overrun = (manifest.segments ?? []).filter(
        (s: any) => s.endSec > total + 0.1
      );
      if (overrun.length > 0) {
        const details = overrun.map(
          (s: any) =>
            `  ${s.id}: endSec=${s.endSec} > totalDurationSec=${total}`
        );
        throw new Error(
          `\n${overrun.length} segment(s) exceed totalDurationSec:\n` +
          details.join("\n")
        );
      }
      expect(overrun).toHaveLength(0);
    });

    it("no two segments on the same layer overlap in time", () => {
      const byLayer: Record<string, any[]> = {};
      for (const seg of manifest.segments ?? []) {
        const layer = seg.layer ?? "background";
        (byLayer[layer] ??= []).push(seg);
      }

      const overlaps: string[] = [];
      for (const [layer, segs] of Object.entries(byLayer)) {
        const sorted = segs.slice().sort((a, b) => a.startSec - b.startSec);
        for (let i = 1; i < sorted.length; i++) {
          const prev = sorted[i - 1];
          const curr = sorted[i];
          if (curr.startSec < prev.endSec - 0.05) {
            overlaps.push(
              `  [${layer}] ${prev.id} (${prev.startSec}–${prev.endSec}) ` +
              `overlaps ${curr.id} (${curr.startSec}–${curr.endSec})`
            );
          }
        }
      }
      if (overlaps.length > 0) {
        throw new Error(
          `\n${overlaps.length} segment overlap(s):\n${overlaps.join("\n")}`
        );
      }
      expect(overlaps).toHaveLength(0);
    });

    // ── Visual coverage ───────────────────────────────────────────────────────

    it("no single-layer gap > 30s (dead visual air)", () => {
      const GAP_THRESHOLD = 30;
      const byLayer: Record<string, any[]> = {};
      for (const seg of manifest.segments ?? []) {
        const layer = seg.layer ?? "background";
        (byLayer[layer] ??= []).push(seg);
      }

      const criticalGaps: string[] = [];
      for (const [layer, segs] of Object.entries(byLayer)) {
        const sorted = segs.slice().sort((a, b) => a.startSec - b.startSec);
        for (let i = 1; i < sorted.length; i++) {
          const gap = sorted[i].startSec - sorted[i - 1].endSec;
          if (gap > GAP_THRESHOLD) {
            criticalGaps.push(
              `  [${layer}] ${gap.toFixed(1)}s: after ${sorted[i - 1].id} ` +
              `(${sorted[i - 1].endSec.toFixed(1)}s) before ${sorted[i].id} ` +
              `(${sorted[i].startSec.toFixed(1)}s)`
            );
          }
        }
      }
      if (criticalGaps.length > 0) {
        throw new Error(
          `\n${criticalGaps.length} gap(s) > ${GAP_THRESHOLD}s:\n` +
          `${criticalGaps.join("\n")}\n` +
          `Fix: run tools/assembly/fill_manifest_holds.py --episode ${slug}`
        );
      }
      expect(criticalGaps).toHaveLength(0);
    });
  });
}
