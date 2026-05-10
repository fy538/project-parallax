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
 *   - All audio files (musicBed, soundCues, textureCues, narration) exist on disk
 *   - MAPBOX_ACCESS_TOKEN is set when map templates are used
 *   - All template data files pass their Zod schema (catches bad data before render)
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
import { TEMPLATE_SCHEMAS } from "../templates/Episodes/templateSchemas";

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

    // ── Beat timestamp validation ─────────────────────────────────────────────
    //
    // beats[].startSec drives three runtime systems:
    //   1. SectionIndicator — shows which section label is active
    //   2. BeatFlash — fires the light-flash transition on beat changes
    //   3. LowerThird — some overlays key off beat boundaries
    //
    // A beat whose startSec is later than the first actual content for that beat
    // means the label shows late (or wrong label shows). A beat whose startSec
    // exceeds totalDurationSec never fires at all.

    it("all beats[].startSec are within the episode duration", () => {
      const total: number = manifest.totalDurationSec;
      const beats: any[] = manifest.beats ?? [];
      if (beats.length === 0) return; // No beats declared — skip

      const overrun = beats.filter((b: any) => b.startSec > total + 0.1);
      if (overrun.length > 0) {
        const details = overrun.map(
          (b: any) =>
            `  ${b.id}: startSec=${b.startSec} > totalDurationSec=${total} ` +
            `(label "${b.title ?? b.id}" will NEVER appear)`
        );
        throw new Error(
          `\n${overrun.length} beat(s) start beyond the episode end:\n` +
          `${details.join("\n")}\n\n` +
          `Fix: set beats[].startSec to the actual first-segment startSec for each beat.`
        );
      }
      expect(overrun).toHaveLength(0);
    });

    it("beats[].startSec match the first content segment for each beat (≤5s drift)", () => {
      // Tolerance: allow beat.startSec to be set up to 5s BEFORE the first segment
      // (e.g., if a HOLD segment precedes real content). Fail if beat.startSec is
      // more than 5s AFTER the first non-HOLD segment in that beat — that means the
      // SectionIndicator label is showing late for a chunk of real content.
      const TOLERANCE_SEC = 5;

      const beats: any[] = manifest.beats ?? [];
      if (beats.length === 0) return;

      // Build a map: beatId → minimum startSec across all non-HOLD segments
      const firstSegPerBeat: Record<string, number> = {};
      for (const seg of manifest.segments ?? []) {
        const beatId: string | undefined = seg.beat ?? seg.beatId;
        if (!beatId || seg.type === "HOLD") continue;
        const s: number = seg.startSec;
        if (!(beatId in firstSegPerBeat) || s < firstSegPerBeat[beatId]) {
          firstSegPerBeat[beatId] = s;
        }
      }

      const drifted: string[] = [];
      for (const b of beats) {
        const firstSeg = firstSegPerBeat[b.id];
        if (firstSeg === undefined) continue; // Beat has no segments — skip

        const drift = b.startSec - firstSeg; // positive = beat label fires LATE
        if (drift > TOLERANCE_SEC) {
          drifted.push(
            `  ${b.id}: beat.startSec=${b.startSec} but first segment starts ` +
            `at ${firstSeg} (label fires ${drift.toFixed(1)}s late)`
          );
        }
      }
      if (drifted.length > 0) {
        throw new Error(
          `\n${drifted.length} beat(s) have startSec set too late:\n` +
          `${drifted.join("\n")}\n\n` +
          `Fix: update beats[].startSec to match the minimum startSec of non-HOLD\n` +
          `segments labeled with that beat id. See generate_manifest.py.`
        );
      }
      expect(drifted).toHaveLength(0);
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

    // ── Mapbox token pre-flight ───────────────────────────────────────────────
    //
    // ChoroplethMap and RouteAnimation call assertMapboxToken() at render time.
    // A missing MAPBOX_ACCESS_TOKEN throws synchronously inside the component —
    // in standalone renders it crashes the entire composition; in FullEpisode it
    // now shows a red error card per segment (BackgroundSegment is wrapped in an
    // error boundary), but the episode will look broken at every map segment.

    it("episodes using map templates have MAPBOX_ACCESS_TOKEN set", () => {
      const MAP_COMPONENTS = new Set(["ChoroplethMap", "RouteAnimation"]);
      const mapSegments = (manifest.segments ?? []).filter(
        (s: any) => MAP_COMPONENTS.has(s.template?.component)
      );
      if (mapSegments.length === 0) return; // No map templates — skip

      const token = process.env.MAPBOX_ACCESS_TOKEN;
      if (!token) {
        throw new Error(
          `\nEpisode "${slug}" uses ${mapSegments.length} map segment(s) ` +
          `(${[...new Set(mapSegments.map((s: any) => s.template.component))].join(", ")}) ` +
          `but MAPBOX_ACCESS_TOKEN is not set.\n\n` +
          `Fix: add MAPBOX_ACCESS_TOKEN=pk.... to .env in remotion-templates/\n` +
          `  or set it in your shell before rendering:\n` +
          `  MAPBOX_ACCESS_TOKEN=pk.... npx remotion render ...`
        );
      }
      expect(token.startsWith("pk.")).toBe(true);
    });

    // ── Audio asset pre-flight ────────────────────────────────────────────────
    //
    // Remotion pre-downloads ALL staticFile() assets before frame 1 renders.
    // A 404 on any WAV crashes the render immediately — there is NO graceful
    // fallback to silence. This check catches missing files before any render.

    it("all audio files referenced in musicBed and soundCues exist on disk", () => {
      const missing: string[] = [];

      // 1. Music bed tracks: public/episodes/{slug}/{track.file}
      for (const track of manifest.musicBed?.tracks ?? []) {
        const filePath = path.join(PUBLIC_DIR, "episodes", slug, track.file);
        if (!fs.existsSync(filePath)) {
          missing.push(`  [musicBed] ${track.id}: public/episodes/${slug}/${track.file}`);
        }
      }

      // 2. Transition SFX: public/audio/sfx/transitions/{type}-{intensity}.wav
      //    and end-stinger (no intensity suffix).
      const seenSfx = new Set<string>();
      for (const seg of manifest.segments ?? []) {
        for (const cue of [seg.soundCue, seg.soundCueSecondary]) {
          if (!cue?.type) continue;
          const filename =
            cue.intensity
              ? `${cue.type}-${cue.intensity}.wav`
              : `${cue.type}.wav`;
          if (seenSfx.has(filename)) continue;
          seenSfx.add(filename);
          const filePath = path.join(
            PUBLIC_DIR,
            "audio/sfx/transitions",
            filename
          );
          if (!fs.existsSync(filePath)) {
            missing.push(
              `  [soundCue/${seg.id}] public/audio/sfx/transitions/${filename}`
            );
          }
        }
      }

      // 3. Texture hits: public/audio/sfx/textures/{type}.wav
      const seenTextures = new Set<string>();
      for (const seg of manifest.segments ?? []) {
        for (const tex of seg.textureCues ?? []) {
          if (!tex.type || seenTextures.has(tex.type)) continue;
          seenTextures.add(tex.type);
          const filePath = path.join(
            PUBLIC_DIR,
            "audio/sfx/textures",
            `${tex.type}.wav`
          );
          if (!fs.existsSync(filePath)) {
            missing.push(
              `  [textureCue] public/audio/sfx/textures/${tex.type}.wav`
            );
          }
        }
      }

      // 4. Narration audio: public/episodes/{slug}/{narration.audioFile}
      //    Not yet recorded for current episodes (audioFile is null/absent),
      //    but once set this will crash the render if the file is missing.
      const narrationFile = manifest.narration?.audioFile;
      if (narrationFile) {
        const filePath = path.join(PUBLIC_DIR, "episodes", slug, narrationFile);
        if (!fs.existsSync(filePath)) {
          missing.push(
            `  [narration] public/episodes/${slug}/${narrationFile}`
          );
        }
      }

      if (missing.length > 0) {
        throw new Error(
          `\n${missing.length} audio file(s) missing — render will crash on 404:\n` +
          `${missing.join("\n")}\n\n` +
          `Fix: run  python remotion-templates/scripts/create_placeholder_wavs.py\n` +
          `  or source real files from Epidemic Sound / Artlist and drop them in place.`
        );
      }
      expect(missing).toHaveLength(0);
    });

    // ── Template data Zod validation ─────────────────────────────────────────
    //
    // FullEpisode loads data files as raw JSON and passes them directly to
    // template components without re-running Zod validation (the schemas on
    // <Composition> only run at registration time for standalone renders).
    // This test runs each data file through its schema's safeParse() so bad
    // data is caught here rather than producing a red SegmentErrorBoundary
    // placeholder mid-episode.

    it("all template data files pass their Zod schema", () => {
      const failures: string[] = [];

      for (const seg of dataFileSegments(manifest)) {
        const component: string = seg.template?.component;
        const dataFile: string = seg.template.dataFile;
        const schema = TEMPLATE_SCHEMAS[component];

        if (!schema) {
          // No schema registered for this component — skip rather than fail.
          // Add missing schemas to src/templates/Episodes/templateSchemas.ts.
          continue;
        }

        const filePath = path.join(dataDir, dataFile);
        if (!fs.existsSync(filePath)) continue; // Already caught by data-files test

        let json: unknown;
        try {
          json = JSON.parse(fs.readFileSync(filePath, "utf8"));
        } catch {
          failures.push(`  ${dataFile}: invalid JSON`);
          continue;
        }

        // Schemas validate { data: <fileContents> } — the data file IS the data prop
        const result = schema.safeParse({ data: json });
        if (!result.success) {
          const issues = result.error.issues
            .slice(0, 3) // cap at 3 issues per file to keep output readable
            .map((i) => `    [${i.path.join(".")}] ${i.message}`);
          failures.push(
            `  ${seg.id} → ${dataFile} (${component}):\n${issues.join("\n")}` +
            (result.error.issues.length > 3
              ? `\n    … and ${result.error.issues.length - 3} more`
              : "")
          );
        }
      }

      if (failures.length > 0) {
        throw new Error(
          `\n${failures.length} data file(s) failed schema validation:\n` +
          `${failures.join("\n\n")}\n\n` +
          `Fix: correct the data file to match the template's Zod schema.\n` +
          `     Schema is in src/templates/<ComponentName>/schema.ts`
        );
      }
      expect(failures).toHaveLength(0);
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
