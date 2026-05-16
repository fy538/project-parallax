/**
 * Tests for scripts/audit-direction-fields.mjs
 *
 * Covers:
 *   1. Schema parser — extracts canonical keys correctly from directionBlock.schema.ts
 *      (validates the depth-aware brace parser handles nested objects like narrationGate)
 *   2. Block collector — finds _direction at any depth in JSON
 *   3. Orphan classifier — correctly separates known / unknown keys
 *   4. Real data — current episode data files have zero orphans
 *
 * Does NOT import the mjs script directly (it's a CLI with process.exit calls).
 * Instead, the logic is re-implemented inline for the parts that matter most,
 * or tested by running the script as a child process and checking exit code.
 */

import { execFileSync } from "child_process";
import { join } from "path";
import { describe, it, expect } from "vitest";
import { existsSync, readFileSync } from "fs";

const SCRIPT = join(__dirname, "../../scripts/audit-direction-fields.mjs");
const SCHEMA = join(__dirname, "../hooks/directionBlock.schema.ts");

// ── Helper: run the script and return { stdout, exitCode } ─────────────────

function runScript(args: string[] = []): { stdout: string; exitCode: number } {
  try {
    const stdout = execFileSync(process.execPath, [SCRIPT, ...args], {
      encoding: "utf-8",
      cwd: join(__dirname, "../.."),
    });
    return { stdout, exitCode: 0 };
  } catch (e: any) {
    return { stdout: e.stdout ?? "", exitCode: e.status ?? 1 };
  }
}

// ── Helper: replicate the depth-aware key parser (pure logic, no file I/O) ─

function parseKeysFromSource(src: string): Set<string> {
  const lines = src.split("\n");
  const startIdx = lines.findIndex((l) => /DirectionBlockSchema\s*=\s*z/.test(l));
  if (startIdx === -1) return new Set();

  let depth = 0;
  let insideOuterObject = false;
  const keys = new Set<string>();

  for (let i = startIdx; i < lines.length; i++) {
    const line = lines[i];
    let closedOuter = false;

    for (const ch of line) {
      if (ch === "{") {
        depth++;
        if (depth === 1) insideOuterObject = true;
      }
      if (ch === "}") {
        if (depth === 1) {
          insideOuterObject = false;
          depth--;
          closedOuter = true;
          break;
        }
        depth--;
      }
    }

    if (insideOuterObject && depth === 1) {
      const trimmed = line.trimStart();
      if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) continue;
      const keyMatch = line.match(/^\s{2,4}(\w+)\s*:/);
      if (keyMatch) keys.add(keyMatch[1]);
    }

    if (closedOuter) break;
  }

  return keys;
}

// ── 1. Schema parser ────────────────────────────────────────────────────────

describe("audit-direction-fields: schema parser", () => {
  it("schema file exists", () => {
    expect(existsSync(SCHEMA)).toBe(true);
  });

  it("parses all expected canonical keys from directionBlock.schema.ts", () => {
    const src = readFileSync(SCHEMA, "utf-8");
    const keys = parseKeysFromSource(src);

    // Known groups — if you add a field to the schema, add it here too.
    // This test intentionally mirrors the schema so a rename surfaces here.
    const expectedKeys = new Set([
      // camera
      "cameraPath", "cameraNote", "proportional", "syncPoints",
      // reveal
      "revealMode", "staggerMs", "revealEasing", "highlightIndex",
      "spotlightSequence", "progressive",
      // hold
      "holdAfter", "holdBehavior", "preDelay", "narrationGate",
      // cut
      "transitionOut", "washColor", "transitionDuration",
      // mood
      "atmosphere", "ambientParticles", "musicBedAtmosphereMultiplier",
      "driftPreset", "globalDim", "backgroundTint",
      // pace
      "paceProfile",
      // text-animation register (Phase 1, May 2026)
      "textAnimation", "isCallback",
    ]);

    for (const key of expectedKeys) {
      expect(keys.has(key), `expected canonical key "${key}" to be parsed`).toBe(true);
    }
    // Parser shouldn't pick up random words (like 'z', 'optional', 'string')
    expect(keys.has("z")).toBe(false);
    expect(keys.has("optional")).toBe(false);
  });

  it("depth-aware parser handles nested z.object (narrationGate) without stopping early", () => {
    // Synthetic schema excerpt with a nested object — the old regex would stop here.
    const src = `
export const DirectionBlockSchema = z
  .object({
    holdAfter: z.number().optional(),
    narrationGate: z.object({ word: z.string() }).passthrough().optional(),
    paceProfile: PaceProfileSchema.optional(),
  })
  .passthrough();
`;
    const keys = parseKeysFromSource(src);
    expect(keys.has("holdAfter")).toBe(true);
    expect(keys.has("narrationGate")).toBe(true);
    // Must NOT stop at narrationGate's inner `}).passthrough()`
    expect(keys.has("paceProfile")).toBe(true);
    // Must NOT pick up `word` (nested key at depth 2)
    expect(keys.has("word")).toBe(false);
  });
});

// ── 2. Orphan classifier (pure logic) ──────────────────────────────────────

describe("audit-direction-fields: orphan classifier", () => {
  const canonical = new Set([
    "paceProfile", "driftPreset", "atmosphere", "holdAfter", "transitionOut",
  ]);

  function classify(authored: Record<string, unknown>) {
    return Object.keys(authored).filter((k) => !canonical.has(k));
  }

  it("returns empty array for a fully canonical _direction block", () => {
    expect(classify({ paceProfile: "breathing", driftPreset: "documentary" })).toEqual([]);
  });

  it("detects a typo key (extra letter)", () => {
    const orphans = classify({ paceProfilee: "breathing" });
    expect(orphans).toEqual(["paceProfilee"]);
  });

  it("detects wrong case (camelCase vs lowercase)", () => {
    const orphans = classify({ driftpreset: "documentary" });
    expect(orphans).toEqual(["driftpreset"]);
  });

  it("detects renamed field (old name still in JSON)", () => {
    // e.g. if 'holdTime' was renamed to 'holdAfter' in the schema
    const orphans = classify({ holdTime: 2.5, holdAfter: 2.5 });
    expect(orphans).toEqual(["holdTime"]);
  });

  it("does not flag passthrough extra keys when all are in canonical set", () => {
    const block = { atmosphere: "subtle", holdAfter: 3, transitionOut: "fade" };
    expect(classify(block)).toEqual([]);
  });
});

// ── 3. Block collector (JSON traversal) ────────────────────────────────────

describe("audit-direction-fields: _direction block collection", () => {
  /** Inline replica of collectDirectionBlocks from the script */
  function collect(obj: unknown, jsonPath = ""): Array<{ jsonPath: string; block: Record<string, unknown> }> {
    const found: Array<{ jsonPath: string; block: Record<string, unknown> }> = [];
    if (!obj || typeof obj !== "object") return found;
    if (Array.isArray(obj)) {
      obj.forEach((item, i) => found.push(...collect(item, `${jsonPath}[${i}]`)));
      return found;
    }
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      const childPath = jsonPath ? `${jsonPath}.${key}` : key;
      if (key === "_direction" && val && typeof val === "object" && !Array.isArray(val)) {
        found.push({ jsonPath: childPath, block: val as Record<string, unknown> });
      } else {
        found.push(...collect(val, childPath));
      }
    }
    return found;
  }

  it("finds _direction at top level", () => {
    const data = { title: "Test", _direction: { paceProfile: "breathing" } };
    const blocks = collect(data);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].jsonPath).toBe("_direction");
    expect(blocks[0].block).toEqual({ paceProfile: "breathing" });
  });

  it("finds _direction nested inside a template object (assembly manifest pattern)", () => {
    const manifest = {
      segments: [
        { id: "s1", template: { _direction: { atmosphere: "subtle" } } },
        { id: "s2", template: { title: "no direction" } },
      ],
    };
    const blocks = collect(manifest);
    expect(blocks).toHaveLength(1);
    expect(blocks[0].jsonPath).toBe("segments[0].template._direction");
  });

  it("finds multiple _direction blocks in one document", () => {
    const data = {
      _direction: { paceProfile: "urgent" },
      phases: [
        { _direction: { atmosphere: "dense" } },
        { _direction: { driftPreset: "documentary" } },
      ],
    };
    const blocks = collect(data);
    expect(blocks).toHaveLength(3);
  });

  it("skips _direction that is an array (not a block)", () => {
    const data = { _direction: [1, 2, 3] };
    expect(collect(data)).toHaveLength(0);
  });

  it("skips _direction that is null", () => {
    const data = { _direction: null };
    expect(collect(data)).toHaveLength(0);
  });
});

// ── 4. Real-data integration ───────────────────────────────────────────────

describe("audit-direction-fields: real episode data", () => {
  it("script exits 0 (no orphans) against current episode data", () => {
    const { exitCode, stdout } = runScript(["--strict"]);
    if (exitCode !== 0) {
      // Provide actionable output in the failure message
      throw new Error(
        `audit-direction-fields exited ${exitCode} — orphaned _direction keys detected:\n\n${stdout}`
      );
    }
    expect(exitCode).toBe(0);
  });

  it("--json output is valid JSON with expected shape", () => {
    const { stdout, exitCode } = runScript(["--json"]);
    expect(exitCode).toBe(0);
    const data = JSON.parse(stdout);
    expect(Array.isArray(data.canonical)).toBe(true);
    expect(Array.isArray(data.orphans)).toBe(true);
    expect(Array.isArray(data.neverAuthored)).toBe(true);
    expect(typeof data.summary.canonicalCount).toBe("number");
    expect(data.summary.canonicalCount).toBeGreaterThan(0);
  });

  it("--episode filter limits scan to one slug", () => {
    const { stdout } = runScript(["--json", "--episode=silicon-trap"]);
    const data = JSON.parse(stdout);
    expect(data.summary.filesScanned).toBeGreaterThan(0);
    // Sanity: the well-known episode has _direction blocks
    expect(data.summary.blocksFound).toBeGreaterThan(0);
  });

  it("--episode with unknown slug exits 2", () => {
    const { exitCode } = runScript(["--episode=nonexistent-episode-xyz"]);
    expect(exitCode).toBe(2);
  });
});
