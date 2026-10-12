/**
 * Grain switch for test renders — `--props='{"grain":"off"}'` or `"static"`.
 *
 * Used by `scripts/render-upload-test.mjs` to make the variants that answer
 * what survives YouTube's encoder (analysis/youtube-encoding-research-2026-10-10.md):
 *   "off"    — no grain at all (both layers).
 *   "static" — one coarser paper texture at about twice the strength with a
 *              fixed seed (costs the encoder almost nothing after the first
 *              frame); the fine per-template layer is off.
 * Anything else, or no prop, is the normal look. Studio and ordinary renders
 * are unaffected.
 */
import { getInputProps } from "remotion";

export type GrainMode = "default" | "off" | "static";

export function grainMode(): GrainMode {
  try {
    const grain = (getInputProps() as Record<string, unknown>).grain;
    return grain === "off" || grain === "static" ? grain : "default";
  } catch {
    return "default";
  }
}
