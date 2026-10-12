/**
 * Soundscape register tokens — single source of truth for the per-template
 * audio-ambient defaults defined in `project/SOUNDSCAPE_REGISTER.md`.
 *
 * Sibling of `src/design/theme.ts` (visual tokens) — the audio counterpart.
 *
 *   • SOUNDSCAPE_REGISTERS — the six canonical ambient registers + their
 *                            asset slot paths + volume targets
 *   • TEMPLATE_SOUNDSCAPE_DEFAULTS — per-template default register
 *                            (matches the matrix in SOUNDSCAPE_REGISTER.md)
 *   • DEFAULT_REGISTER     — channel fallback when nothing else resolves
 *
 * No code outside this file should hardcode a register name or asset path.
 * Templates and the resolver read from these constants.
 */

// ── The six canonical registers ────────────────────────────────────────────

/** The six ambient-soundscape registers defined in SOUNDSCAPE_REGISTER.md. */
export const SOUNDSCAPE_REGISTER_NAMES = [
  "archive-room",
  "editorial-print",
  "atmospheric-outdoor",
  "cinematic-dark",
  "cyclical-drone",
  "silence",
] as const;

export type SoundscapeRegister = (typeof SOUNDSCAPE_REGISTER_NAMES)[number];

/**
 * Per-register asset metadata.
 *
 *   • assetPath — relative path under `public/assets/audio/` (resolved via
 *                 `staticFile()` at render time). Authors stub these
 *                 placeholders until real audio assets are sourced — see
 *                 `public/assets/audio/README.md` for the sourcing guide.
 *   • loopSeconds — the audio file's loop length (informs cross-fade pad).
 *   • volumeDb — target volume relative to narration (which is
 *                normalized to -14 LUFS for YouTube). Negative numbers
 *                = quieter than narration.
 *   • character — a one-line description for documentation / audio-spec UI.
 */
export interface SoundscapeMeta {
  readonly assetPath: string | null;
  readonly loopSeconds: number;
  readonly volumeDb: number;
  readonly character: string;
}

/** Per-register asset + volume metadata. */
export const SOUNDSCAPE_REGISTERS: Record<SoundscapeRegister, SoundscapeMeta> = {
  "archive-room": {
    assetPath: "assets/audio/archive-room.mp3",
    loopSeconds: 18,
    volumeDb: -24,
    character: "Quiet indoor reading-room — distant hum, faint paper rustle, near-silent fluorescent buzz",
  },
  "editorial-print": {
    assetPath: "assets/audio/editorial-print.mp3",
    loopSeconds: 24,
    volumeDb: -25,
    character: "Working newsroom / quiet office — faint typewriter clatter, low HVAC hum, no music",
  },
  "atmospheric-outdoor": {
    assetPath: "assets/audio/atmospheric-outdoor.mp3",
    loopSeconds: 30,
    volumeDb: -22,
    character: "Present-in-the-world — low wind layer, distant nature, occasional bird, no human voice",
  },
  "cinematic-dark": {
    assetPath: "assets/audio/cinematic-dark.mp3",
    loopSeconds: 36,
    volumeDb: -20,
    character: "Weight register — deep low drone 50–80 Hz, sub-bass swell, no rhythm, no melody",
  },
  "cyclical-drone": {
    assetPath: "assets/audio/cyclical-drone.mp3",
    loopSeconds: 9,
    volumeDb: -22,
    character: "Feedback-loop motif — 3–5 notes repeating every 6–12s with audibly-cyclical character",
  },
  silence: {
    // Explicit silence — no asset to play.
    assetPath: null,
    loopSeconds: 0,
    // Volume target N/A (no asset); we keep the field for type uniformity.
    volumeDb: 0,
    character: "Deliberate silence — no ambient layer. Pairs with cleared music bed for emphasis.",
  },
} as const;

/** Channel-wide fallback when no other tier of the cascade resolves. */
export const DEFAULT_REGISTER: SoundscapeRegister = "editorial-print";

// ── Per-template defaults (the decision matrix from SOUNDSCAPE_REGISTER.md) ────

/**
 * Per-template ambient-soundscape default. Keys are the same names used
 * in `TEMPLATE_COMPONENTS` (templateRegistry.ts). Templates not listed here
 * fall through to DEFAULT_REGISTER ("editorial-print").
 *
 * The doctrine (project/SOUNDSCAPE_REGISTER.md) is the source of truth
 * for WHY each template gets the register it does. This registry is the
 * MACHINE source — code reads from here, doctrine explains the why.
 *
 * Maintenance rule: when adding a new template to TEMPLATE_COMPONENTS,
 * add its soundscape default here too — or accept the channel default.
 * The lint rule `M-SOUNDSCAPE-DEFAULT` (pending) will surface gaps.
 */
export const TEMPLATE_SOUNDSCAPE_DEFAULTS: Record<string, SoundscapeRegister> = {
  // ── Documentary archival → Archive room ───────────────────────────────
  PrimarySourceReveal: "archive-room",
  TelegramCable: "archive-room",
  HandwrittenLetter: "archive-room",
  NewspaperHeadlineRotator: "archive-room",
  AnnotatedImage: "archive-room",

  // ── Cinematic / atmospheric → Atmospheric outdoor ─────────────────────
  CinematicMap: "atmospheric-outdoor",
  RouteAnimation: "atmospheric-outdoor",
  AtlasPlate: "atmospheric-outdoor",

  // ── Cinematic dark / weight → Cinematic dark ──────────────────────────
  EscalationLadder: "cinematic-dark",
  ArchivalReel: "cinematic-dark",

  // ── Feedback / recurrence → Cyclical drone ────────────────────────────
  CausalLoopDiagram: "cyclical-drone",
  SpiralTimeline: "cyclical-drone",
  Streamgraph: "cyclical-drone",

  // ── Hero / title / quote → Silence ────────────────────────────────────
  StatReveal: "silence",
  KineticTypography: "silence",
  TitleTransition: "silence",

  // Everything else falls through to DEFAULT_REGISTER ("editorial-print") —
  // covers DataChart, TimeSeriesChart, BumpChart, all chart family,
  // FrameworkDiagram, DecisionTree, NetworkDiagram, ComparisonPair,
  // MorphTransition, SmallMultiples, and the five Argument Primitives.
};

/** Helper: predicate guard for the union. */
export function isSoundscapeRegister(value: unknown): value is SoundscapeRegister {
  return (
    typeof value === "string" &&
    (SOUNDSCAPE_REGISTER_NAMES as readonly string[]).includes(value)
  );
}
