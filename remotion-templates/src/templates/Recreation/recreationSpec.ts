/**
 * recreation-spec — the "director layer" for 3D historical recreations.
 *
 * This is the schema an LLM (or human) fills to turn a script beat into a
 * sequence of rendered recreation shots WITHOUT hand-placing anything in 3D.
 * It is to the Recreation template what `assembly-manifest` is to FullEpisode:
 * a declarative scene description a compiler turns into per-shot renders.
 *
 * Design principles:
 *  - **Generate-once, reuse.** `cast` and `set` reference a versioned asset
 *    LIBRARY (keyed like the concept registry), so a recurring "caesar" is the
 *    same GLB across every shot and episode → free cross-shot consistency
 *    (the thing AI video can't do).
 *  - **Two render modes per shot:**
 *      "beauty"        — render the 3D directly (Mode A, stylized diorama).
 *      "depth-restyle" — render a depth/pose control pass, then hand it to an
 *                        AI restyle model (Wan 2.2 Fun Control / Runway Aleph)
 *                        for a photoreal pass (Mode B). Consistency stays in the
 *                        3D; AI only supplies the look.
 *  - **Reuses the editorial grammar.** `dir` (DIR: annotations) and `pace`
 *    (PACE: profiles) pass straight through to the existing systems.
 *  - **Embodied analytics.** A per-actor `label` renders a typographic tag over
 *    a figure — the "GROUP 1. FORMER ALLIES" / "TILLIUS CIMBER" move that makes
 *    a faction/relational point with bodies in space.
 *
 * STATUS: schema draft. The compiler (spec → per-shot Recreation renders →
 * optional AI restyle → stitch) is not built yet; this file defines the
 * contract that compiler will consume.
 */

import { z } from "zod";

const Vec3 = z.tuple([z.number(), z.number(), z.number()]);

/** A reusable cast member, resolved from the generate-once GLB library. */
export const ActorRefSchema = z.object({
  /** Stable role id, e.g. "caesar" — same id ⇒ same model across episodes. */
  id: z.string(),
  /** Library key or public path to the rigged GLB, e.g. "library/caesar.glb". */
  asset: z.string().optional(),
  /** If the asset must be generated (Meshy/Tripo), the generation prompt. */
  prompt: z.string().optional(),
});
export type ActorRef = z.infer<typeof ActorRefSchema>;

/** Where the set comes from. */
export const SetRefSchema = z.object({
  kind: z.enum(["procedural", "glb", "marble"]),
  /** "senate" (procedural id) | public GLB path | World Labs Marble world id. */
  id: z.string(),
});
export type SetRef = z.infer<typeof SetRefSchema>;

export const CameraSchema = z.object({
  move: z
    .enum(["static", "push", "pull", "dolly", "orbit", "crane"])
    .default("push"),
  /** Camera start position (world units). */
  from: Vec3.optional(),
  /** Look-at target (world units). */
  target: Vec3.optional(),
  /** Field of view in degrees. */
  fov: z.number().positive().optional(),
});
export type CameraMove = z.infer<typeof CameraSchema>;

/** One actor's blocking within a shot. */
export const ActorBlockingSchema = z.object({
  /** References an ActorRef.id from `cast`. */
  ref: z.string(),
  /** Position in the set (world units). */
  at: Vec3.default([0, 0, 0]),
  /** Yaw in degrees (0 = facing -z, down the aisle). */
  facing: z.number().default(0),
  /** Animation clip name; falls back to the GLB's first clip. */
  clip: z.string().optional(),
  /** Embodied-analytics label rendered over the figure (e.g. "TILLIUS CIMBER"). */
  label: z.string().optional(),
});
export type ActorBlocking = z.infer<typeof ActorBlockingSchema>;

/** Mode B restyle configuration. */
export const RestyleSchema = z.object({
  model: z.enum(["wan-fun-control", "runway-aleph"]),
  control: z.enum(["depth", "pose", "depth+pose"]).default("depth"),
  /** Look prompt, e.g. "photoreal ancient Roman senate, marble, cinematic light". */
  prompt: z.string(),
  /** How strongly the AI restyles vs. preserves the control pass (0..1). */
  strength: z.number().min(0).max(1).default(0.7),
});
export type Restyle = z.infer<typeof RestyleSchema>;

export const ShotSchema = z
  .object({
    id: z.string(),
    durationSec: z.number().positive(),
    camera: CameraSchema.default({ move: "push" }),
    actors: z.array(ActorBlockingSchema).default([]),
    /** "beauty" = render 3D directly (Mode A). "depth-restyle" = Mode B. */
    mode: z.enum(["beauty", "depth-restyle"]).default("beauty"),
    restyle: RestyleSchema.optional(),
    /** Raw DIR: annotations, passed through to the editorial grammar. */
    dir: z.string().optional(),
    /** PACE: profile for this shot. */
    pace: z.enum(["analytical", "urgent", "breathing"]).optional(),
  })
  .refine((s) => s.mode !== "depth-restyle" || !!s.restyle, {
    message: "`depth-restyle` shots require a `restyle` config",
    path: ["restyle"],
  });
export type Shot = z.infer<typeof ShotSchema>;

export const RecreationSpecSchema = z.object({
  episode: z.string(),
  /** Scene id, e.g. "ides-of-march-senate". */
  scene: z.string(),
  set: SetRefSchema,
  /** Reusable cast — generate/source once, reuse across shots + episodes. */
  cast: z.array(ActorRefSchema).min(1),
  shots: z.array(ShotSchema).min(1),
});
export type RecreationSpec = z.infer<typeof RecreationSpecSchema>;
