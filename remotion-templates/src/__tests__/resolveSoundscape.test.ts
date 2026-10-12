/**
 * Soundscape cascade resolver contract tests.
 *
 * Locks the 5 priority levels for `ambient` and the per-field cascades
 * for `transitionIn`, `transitionOut`, and `textures`. Mirrors the
 * FilmOverlay resolver test pattern.
 */

import { describe, it, expect } from "vitest";
import {
  resolveSoundscape,
  type SoundscapeConfig,
  type BackdropSoundscapeHint,
} from "../utils/resolveSoundscape";
import {
  DEFAULT_REGISTER,
  TEMPLATE_SOUNDSCAPE_DEFAULTS,
} from "../design/soundscape";

// ── ambient cascade (5 levels) ─────────────────────────────────────────────

describe("resolveSoundscape — ambient cascade (5 levels)", () => {
  it("level 1: segment override wins over everything else", () => {
    const result = resolveSoundscape(
      { ambient: "silence" },
      { recommendedSoundscape: "atmospheric-outdoor" },
      "PrimarySourceReveal", // template default = archive-room
      { ambient: "editorial-print" },
    );
    expect(result.ambient).toBe("silence");
  });

  it("level 2: backdrop hint wins when no segment override", () => {
    const result = resolveSoundscape(
      null,
      { recommendedSoundscape: "cinematic-dark" },
      "PrimarySourceReveal", // template default = archive-room
      { ambient: "editorial-print" },
    );
    expect(result.ambient).toBe("cinematic-dark");
  });

  it("level 3: template default wins when no segment + no backdrop", () => {
    // PrimarySourceReveal's default per TEMPLATE_SOUNDSCAPE_DEFAULTS = archive-room
    const result = resolveSoundscape(
      null,
      null,
      "PrimarySourceReveal",
      { ambient: "editorial-print" },
    );
    expect(result.ambient).toBe("archive-room");
  });

  it("level 4: episode default wins when no template default exists", () => {
    // A template not in TEMPLATE_SOUNDSCAPE_DEFAULTS — falls to episode level.
    const result = resolveSoundscape(
      null,
      null,
      "SomeFutureTemplate", // not in registry
      { ambient: "atmospheric-outdoor" },
    );
    expect(result.ambient).toBe("atmospheric-outdoor");
  });

  it("level 5: channel default wins when nothing else resolves", () => {
    const result = resolveSoundscape(null, null, null, null);
    expect(result.ambient).toBe(DEFAULT_REGISTER); // "editorial-print"
  });

  it("invalid segment override falls through to next level", () => {
    const result = resolveSoundscape(
      // @ts-expect-error — testing runtime guard for bogus value
      { ambient: "not-a-register" },
      { recommendedSoundscape: "cinematic-dark" },
      null,
      null,
    );
    expect(result.ambient).toBe("cinematic-dark");
  });
});

// ── per-template defaults sanity checks ────────────────────────────────────

describe("TEMPLATE_SOUNDSCAPE_DEFAULTS — doctrinal coverage", () => {
  it("all documentary-archival templates → archive-room", () => {
    expect(TEMPLATE_SOUNDSCAPE_DEFAULTS.PrimarySourceReveal).toBe("archive-room");
    expect(TEMPLATE_SOUNDSCAPE_DEFAULTS.TelegramCable).toBe("archive-room");
    expect(TEMPLATE_SOUNDSCAPE_DEFAULTS.HandwrittenLetter).toBe("archive-room");
    expect(TEMPLATE_SOUNDSCAPE_DEFAULTS.NewspaperHeadlineRotator).toBe("archive-room");
  });

  it("cinematic-map → atmospheric-outdoor", () => {
    expect(TEMPLATE_SOUNDSCAPE_DEFAULTS.CinematicMap).toBe("atmospheric-outdoor");
  });

  it("feedback-system templates → cyclical-drone", () => {
    expect(TEMPLATE_SOUNDSCAPE_DEFAULTS.CausalLoopDiagram).toBe("cyclical-drone");
    expect(TEMPLATE_SOUNDSCAPE_DEFAULTS.SpiralTimeline).toBe("cyclical-drone");
  });

  it("hero / title moments → silence", () => {
    expect(TEMPLATE_SOUNDSCAPE_DEFAULTS.StatReveal).toBe("silence");
    expect(TEMPLATE_SOUNDSCAPE_DEFAULTS.KineticTypography).toBe("silence");
    expect(TEMPLATE_SOUNDSCAPE_DEFAULTS.TitleTransition).toBe("silence");
  });
});

// ── transitionIn / transitionOut cascade (2 levels) ────────────────────────

describe("resolveSoundscape — transitionIn / transitionOut", () => {
  it("segment transitionIn wins over episode", () => {
    const result = resolveSoundscape(
      { transitionIn: "stat-reveal" },
      null,
      null,
      { transitionIn: "beat-transition" },
    );
    expect(result.transitionIn).toBe("stat-reveal");
  });

  it("episode transitionIn used when segment has none", () => {
    const result = resolveSoundscape(
      null,
      null,
      null,
      { transitionIn: "beat-transition" },
    );
    expect(result.transitionIn).toBe("beat-transition");
  });

  it("undefined when neither segment nor episode specifies", () => {
    const result = resolveSoundscape(null, null, null, null);
    expect(result.transitionIn).toBeUndefined();
    expect(result.transitionOut).toBeUndefined();
  });
});

// ── textures (segment overrides episode entirely; no merge) ────────────────

describe("resolveSoundscape — textures", () => {
  it("segment textures REPLACE episode textures (no merge)", () => {
    const segmentTextures = [{ type: "typewriter-clack", atSec: 1.5 }];
    const episodeTextures = [{ type: "page-turn", atSec: 0.5 }];
    const result = resolveSoundscape(
      { textures: segmentTextures },
      null,
      null,
      { textures: episodeTextures },
    );
    expect(result.textures).toEqual(segmentTextures);
  });

  it("empty array returned when neither segment nor episode has textures", () => {
    const result = resolveSoundscape(null, null, null, null);
    expect(result.textures).toEqual([]);
  });
});
