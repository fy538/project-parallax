/**
 * Remotion version lock — asserts that all @remotion/* packages in
 * package.json are on the same version, and that zod matches Remotion's
 * required version.
 *
 * Why this matters:
 *   Mismatched @remotion/* versions produce cryptic runtime errors ("cannot
 *   read properties of undefined", silent render corruption, or bundle-time
 *   peer-dep conflicts). The zod constraint is stricter: Remotion 4.x requires
 *   exactly zod 4.3.6; a higher minor version causes schema validation to silently
 *   break in Remotion Studio.
 *
 * This test is intentionally a pure JSON read — no rendering required.
 * It runs in < 50ms.
 *
 * Run: npm run test:unit  (included in the unit suite)
 */

import { describe, it, expect } from "vitest";
import path from "path";
import fs from "fs";

const PKG_PATH = path.resolve(__dirname, "../../package.json");
const pkg = JSON.parse(fs.readFileSync(PKG_PATH, "utf8")) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

/** Strip ^ and ~ prefixes for comparison. Exact pins (no prefix) pass through. */
function normalizeVersion(v: string): string {
  return v.replace(/^[\^~]/, "");
}

describe("Remotion version lock", () => {
  it("all @remotion/* packages and remotion itself are on the same base version", () => {
    const allDeps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    // Collect every remotion-family package and its declared version
    const remotionPkgs: Record<string, string> = {};
    for (const [name, version] of Object.entries(allDeps)) {
      if (name === "remotion" || name.startsWith("@remotion/")) {
        remotionPkgs[name] = version;
      }
    }

    if (Object.keys(remotionPkgs).length === 0) {
      throw new Error("No remotion packages found in package.json — something is very wrong.");
    }

    // Normalize to bare semver for comparison
    const normalized = Object.fromEntries(
      Object.entries(remotionPkgs).map(([k, v]) => [k, normalizeVersion(v)])
    );

    // Find the plurality version (most packages share it → that's the target)
    const versionCounts: Record<string, number> = {};
    for (const v of Object.values(normalized)) {
      versionCounts[v] = (versionCounts[v] ?? 0) + 1;
    }
    const targetVersion = Object.entries(versionCounts).sort(
      (a, b) => b[1] - a[1]
    )[0][0];

    const outliers = Object.entries(normalized)
      .filter(([, v]) => v !== targetVersion)
      .map(([name, v]) => `  ${name}: ${v}  (majority is ${targetVersion})`);

    if (outliers.length > 0) {
      throw new Error(
        `\n${outliers.length} @remotion package(s) are on a different version than the rest:\n` +
          `${outliers.join("\n")}\n\n` +
          `Fix: align all packages to ${targetVersion}\n` +
          `  npm install ${Object.keys(remotionPkgs)
            .filter((n) => normalizeVersion(remotionPkgs[n]) !== targetVersion)
            .map((n) => `${n}@${targetVersion}`)
            .join(" ")} --save-exact`
      );
    }

    expect(outliers).toHaveLength(0);
  });

  it("zod is pinned to exactly 4.3.6 (Remotion 4.x peer requirement)", () => {
    const allDeps: Record<string, string> = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    const zodVersion = allDeps["zod"];
    expect(zodVersion, "zod is not declared as a dependency in package.json").toBeTruthy();

    const normalized = normalizeVersion(zodVersion ?? "");

    // Remotion 4.x requires zod exactly 4.3.6.
    // Using a higher version causes schema validation to silently break in Studio.
    // Fix: npx remotion add zod  (pins to the correct version automatically)
    expect(
      normalized,
      `zod must be exactly 4.3.6, got "${zodVersion}".\n` +
        `Fix: npx remotion add zod  (in remotion-templates/)`
    ).toBe("4.3.6");
  });
});
