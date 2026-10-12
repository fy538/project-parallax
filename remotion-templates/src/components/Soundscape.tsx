/**
 * Soundscape — React primitives for the Soundscape register system.
 *
 * Three components:
 *
 *   <AmbientBed register="..." />
 *     Looped ambient audio for the duration of the segment. Volume target
 *     from SOUNDSCAPE_REGISTERS[register].volumeDb (-24 dB to -20 dB
 *     range). Silently no-ops when register is "silence" or the asset
 *     hasn't been sourced yet.
 *
 *   <TransitionSFX type="beat-transition" atFrame={0} />
 *     One-shot SFX cue from the AUDIO_DESIGN.md transition palette
 *     (beat-transition / section-open / quote-bell / stat-reveal /
 *     map-whoosh / tension-rise / tension-resolve / end-stinger).
 *     Fires once at the given frame. Volume target -12 to -18 dB.
 *
 *   <TextureHit type="typewriter-clack" atFrame={123} />
 *     Micro-SFX cue from the AUDIO_DESIGN.md texture palette
 *     (dot-click / card-settle / line-draw / region-glow / bar-grow /
 *     node-pop / page-turn / typewriter-clack / pen-stroke /
 *     stamp-impact / chime-soft / chime-sharp / vinyl-pop).
 *     Fires once at the given frame. Volume target -22 to -16 dB.
 *
 * Each component wraps Remotion's `<Audio>`. Audio assets resolve via
 * `staticFile()`. Missing assets are SAFE no-ops (render returns null +
 * logs once in dev mode) — the audio register system can be deployed
 * before assets are sourced; segments degrade gracefully.
 *
 * Doctrine: project/SOUNDSCAPE_REGISTER.md, project/AUDIO_DESIGN.md
 */

import React from "react";
import { Audio, staticFile, useVideoConfig } from "remotion";
import { isAudioDisabled } from "../utils/qaMode";
import {
  SOUNDSCAPE_REGISTERS,
  type SoundscapeRegister,
} from "../design/soundscape";

// ── dB → linear volume conversion ──────────────────────────────────────────

/**
 * Convert decibel target to Remotion's 0-1 linear volume.
 *
 * Remotion's <Audio volume> is a linear gain multiplier; the doctrine
 * specifies dB targets (e.g., -24 dB for archive-room). The standard
 * relationship is amplitude = 10^(dB/20).
 *
 * Examples:
 *   -24 dB → 0.063
 *   -20 dB → 0.10
 *   -16 dB → 0.158
 *   -12 dB → 0.25
 *    -6 dB → 0.50
 *    0 dB  → 1.00
 */
function dBToLinear(dB: number): number {
  return Math.pow(10, dB / 20);
}

// Track which missing assets we've already warned about — prevent log
// flooding when a segment doesn't have its audio sourced yet.
const warnedMissingAssets = new Set<string>();

function warnMissingAssetOnce(path: string, context: string): void {
  if (warnedMissingAssets.has(path)) return;
  warnedMissingAssets.add(path);
  // eslint-disable-next-line no-console
  console.warn(
    `[Soundscape] Asset not found: ${path} (${context}). ` +
      `See public/assets/audio/README.md for sourcing guide. ` +
      `Render continues with no audio for this slot.`,
  );
}

// ── AmbientBed ─────────────────────────────────────────────────────────────

export interface AmbientBedProps {
  /** Which of the six canonical registers to play. */
  register: SoundscapeRegister;
  /**
   * Volume override (dB relative to narration). When unset, uses the
   * canonical target from `SOUNDSCAPE_REGISTERS[register].volumeDb`.
   * Use sparingly — the doctrine defaults are calibrated.
   */
  volumeDbOverride?: number;
  /**
   * When true, the ambient is silent for this segment regardless of the
   * register. Useful for nested compositions where a parent already
   * supplies ambient. Default false.
   */
  silent?: boolean;
}

/**
 * Plays the looped ambient bed for the given register. Designed to be
 * mounted once per segment by the segment renderer (FullEpisode wraps
 * each segment in <Sequence> + <AmbientBed register={resolved}/>).
 *
 * Silence register OR silent flag = no audio mounted at all.
 */
export const AmbientBed: React.FC<AmbientBedProps> = React.memo(
  ({ register, volumeDbOverride, silent = false }) => {
    if (silent || isAudioDisabled()) return null;
    if (register === "silence") return null;

    const meta = SOUNDSCAPE_REGISTERS[register];
    if (!meta.assetPath) return null;

    const effectiveDb = volumeDbOverride ?? meta.volumeDb;
    const volume = dBToLinear(effectiveDb);

    // Resolve asset path. staticFile() throws on remote URLs; assets are
    // always local under public/.
    let src: string;
    try {
      src = staticFile(meta.assetPath);
    } catch {
      warnMissingAssetOnce(meta.assetPath, `ambient register "${register}"`);
      return null;
    }

    return (
      <Audio
        src={src}
        volume={volume}
        // Loop the ambient for the full segment — Remotion handles this
        // natively via the `loop` prop.
        loop
      />
    );
  },
);
AmbientBed.displayName = "AmbientBed";

// ── TransitionSFX ──────────────────────────────────────────────────────────

/**
 * Transition-SFX cue catalog. Each entry maps a doctrine-named cue
 * (AUDIO_DESIGN.md "Transition SFX palette") to its asset path + volume.
 *
 * Naming follows the existing AUDIO_DESIGN.md palette — when adding a
 * cue, add it to AUDIO_DESIGN.md first, then mirror here.
 */
export const TRANSITION_SFX_CATALOG = {
  "beat-transition": { assetPath: "assets/audio/sfx/beat-transition.mp3", volumeDb: -16 },
  "stat-reveal": { assetPath: "assets/audio/sfx/stat-reveal.mp3", volumeDb: -14 },
  "tension-rise": { assetPath: "assets/audio/sfx/tension-rise.mp3", volumeDb: -14 },
  "tension-resolve": { assetPath: "assets/audio/sfx/tension-resolve.mp3", volumeDb: -14 },
  "map-whoosh": { assetPath: "assets/audio/sfx/map-whoosh.mp3", volumeDb: -12 },
  "quote-bell": { assetPath: "assets/audio/sfx/quote-bell.mp3", volumeDb: -16 },
  "section-open": { assetPath: "assets/audio/sfx/section-open.mp3", volumeDb: -14 },
  "end-stinger": { assetPath: "assets/audio/sfx/end-stinger.mp3", volumeDb: -10 },
} as const;

export type TransitionSFXType = keyof typeof TRANSITION_SFX_CATALOG;

export interface TransitionSFXProps {
  /** Cue type — name from AUDIO_DESIGN.md transition palette. */
  type: TransitionSFXType;
  /**
   * Frame at which the cue fires within the parent composition. Defaults
   * to 0 (start of segment).
   */
  atFrame?: number;
  /** Volume override (dB). Defaults to TRANSITION_SFX_CATALOG[type].volumeDb. */
  volumeDbOverride?: number;
}

/**
 * One-shot transition SFX. Fires once at `atFrame`. Use at segment
 * boundaries (BeginSegment renders <TransitionSFX type="beat-transition" />
 * at frame 0) or at internal moments (StatReveal's hero-number landing
 * triggers <TransitionSFX type="stat-reveal" atFrame={revealFrame} />).
 */
export const TransitionSFX: React.FC<TransitionSFXProps> = React.memo(
  ({ type, atFrame = 0, volumeDbOverride }) => {
    const meta = TRANSITION_SFX_CATALOG[type];
    if (!meta || isAudioDisabled()) return null;

    const volume = dBToLinear(volumeDbOverride ?? meta.volumeDb);

    let src: string;
    try {
      src = staticFile(meta.assetPath);
    } catch {
      warnMissingAssetOnce(meta.assetPath, `transition SFX "${type}"`);
      return null;
    }

    return (
      <Audio
        src={src}
        volume={volume}
        startFrom={0}
        // Bound the audio mount to a short window starting at atFrame.
        // Remotion clips the audio at composition boundaries automatically.
        trimBefore={atFrame > 0 ? atFrame : undefined}
      />
    );
  },
);
TransitionSFX.displayName = "TransitionSFX";

// ── TextureHit ─────────────────────────────────────────────────────────────

/**
 * Texture-hit cue catalog. Each entry maps a doctrine-named cue
 * (AUDIO_DESIGN.md "Texture palette" + soundscape-specific additions)
 * to its asset path + volume.
 */
export const TEXTURE_HIT_CATALOG = {
  "dot-click": { assetPath: "assets/audio/sfx/dot-click.mp3", volumeDb: -22 },
  "card-settle": { assetPath: "assets/audio/sfx/card-settle.mp3", volumeDb: -20 },
  "line-draw": { assetPath: "assets/audio/sfx/line-draw.mp3", volumeDb: -22 },
  "region-glow": { assetPath: "assets/audio/sfx/region-glow.mp3", volumeDb: -22 },
  "bar-grow": { assetPath: "assets/audio/sfx/bar-grow.mp3", volumeDb: -22 },
  "node-pop": { assetPath: "assets/audio/sfx/node-pop.mp3", volumeDb: -20 },
  "page-turn": { assetPath: "assets/audio/sfx/page-turn.mp3", volumeDb: -18 },
  "typewriter-clack": { assetPath: "assets/audio/sfx/typewriter-clack.mp3", volumeDb: -18 },
  "pen-stroke": { assetPath: "assets/audio/sfx/pen-stroke.mp3", volumeDb: -22 },
  "stamp-impact": { assetPath: "assets/audio/sfx/stamp-impact.mp3", volumeDb: -14 },
  "chime-soft": { assetPath: "assets/audio/sfx/chime-soft.mp3", volumeDb: -18 },
  "chime-sharp": { assetPath: "assets/audio/sfx/chime-sharp.mp3", volumeDb: -16 },
  "vinyl-pop": { assetPath: "assets/audio/sfx/vinyl-pop.mp3", volumeDb: -20 },
} as const;

export type TextureHitType = keyof typeof TEXTURE_HIT_CATALOG;

export interface TextureHitProps {
  type: TextureHitType;
  atFrame?: number;
  volumeDbOverride?: number;
}

/** One-shot micro-SFX. Fires once at `atFrame`. */
export const TextureHit: React.FC<TextureHitProps> = React.memo(
  ({ type, atFrame = 0, volumeDbOverride }) => {
    const meta = TEXTURE_HIT_CATALOG[type];
    if (!meta || isAudioDisabled()) return null;

    const volume = dBToLinear(volumeDbOverride ?? meta.volumeDb);

    let src: string;
    try {
      src = staticFile(meta.assetPath);
    } catch {
      warnMissingAssetOnce(meta.assetPath, `texture hit "${type}"`);
      return null;
    }

    return (
      <Audio
        src={src}
        volume={volume}
        trimBefore={atFrame > 0 ? atFrame : undefined}
      />
    );
  },
);
TextureHit.displayName = "TextureHit";

// ── Convenience: mount a resolved soundscape ───────────────────────────────

import type { ResolvedSoundscape } from "../utils/resolveSoundscape";

export interface SoundscapeMountProps {
  resolved: ResolvedSoundscape;
  /** When true, ambient is silenced regardless of resolved register. */
  silentAmbient?: boolean;
}

/**
 * Mount a fully-resolved soundscape — ambient + transition SFX + texture
 * hits in one component. Used by FullEpisode's per-segment wrapper.
 *
 * Authors generally don't use this directly; the manifest renderer wraps
 * each segment with `<SoundscapeMount resolved={resolveSoundscape(...)} />`.
 */
export const SoundscapeMount: React.FC<SoundscapeMountProps> = React.memo(
  ({ resolved, silentAmbient }) => {
    // useVideoConfig must be called at the top level (Rules of Hooks) —
    // we then use the constant fps value inside the textures map.
    const { fps } = useVideoConfig();
    return (
      <>
        <AmbientBed register={resolved.ambient} silent={silentAmbient} />
        {resolved.transitionIn && (
          <TransitionSFX type={resolved.transitionIn as TransitionSFXType} atFrame={0} />
        )}
        {resolved.textures.map((tx, i) => (
          <TextureHit
            key={`tx-${i}-${tx.type}-${tx.atSec}`}
            type={tx.type as TextureHitType}
            atFrame={Math.round(tx.atSec * fps)}
          />
        ))}
      </>
    );
  },
);
SoundscapeMount.displayName = "SoundscapeMount";
