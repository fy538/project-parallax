/**
 * Smoke test for the Lambda scaffolding scripts.
 *
 * Status: scaffolded but not wired into npm scripts (see package.json
 * `_lambda_scaffolded` doc-key). The scripts have been sitting dormant
 * since May 5, 2026 — exactly the kind of code that bit-rots when
 * @remotion/lambda or @remotion/bundler upgrades break imports.
 *
 * This test imports both modules and asserts they parse cleanly + export
 * the expected functions. It does NOT hit AWS — both modules now have
 * `if (import.meta.url === argv[1])` guards around their CLI blocks
 * specifically to make this kind of import-only test safe.
 *
 * If this test breaks, the Lambda path is broken — either fix the import
 * surface or move the scripts to scripts/_archive/ and remove this test.
 *
 * Added May 18, 2026 (engineering audit P2 #17).
 */

import { describe, it, expect } from "vitest";

describe("Lambda scripts — smoke", () => {
  it("deploy-lambda.mjs imports cleanly and exports deploy + teardown", async () => {
    const mod = await import("../../scripts/deploy-lambda.mjs");
    expect(typeof mod.deploy).toBe("function");
    expect(typeof mod.teardown).toBe("function");
  });

  it("render-lambda.mjs imports cleanly and exports renderEpisode + renderSingle + parseArgs", async () => {
    const mod = await import("../../scripts/render-lambda.mjs");
    expect(typeof mod.renderEpisode).toBe("function");
    expect(typeof mod.renderSingle).toBe("function");
    expect(typeof mod.parseArgs).toBe("function");
  });
});
