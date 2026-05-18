/**
 * Tests for the cross-language video-config import:
 *   tools/config/video.json → theme.ts (via `import`)
 *   tools/config/video.json → tools/video_config.py (via json.load)
 *
 * Symmetrical to `tools/test_video_config.py` on the Python side. A
 * JSON-shape drift on the TS side (e.g. a renamed key) would otherwise
 * only surface as a `tsc` error or a runtime crash deep in a render.
 * These assertions surface it at unit-test time.
 *
 * Locks the current dimensions explicitly: if a channel-wide upgrade
 * changes them, this test (and the Python sibling, and every visual
 * baseline) must be updated in the same commit.
 */

import { describe, it, expect } from "vitest";
import videoConfig from "../../../tools/config/video.json";
import { layout } from "../design/theme";

describe("tools/config/video.json — shape", () => {
  it("has the four required profile blocks", () => {
    expect(videoConfig).toHaveProperty("episode");
    expect(videoConfig).toHaveProperty("short");
    expect(videoConfig).toHaveProperty("thumbnail");
    expect(videoConfig).toHaveProperty("social");
  });

  it("episode profile has width/height/fps", () => {
    expect(videoConfig.episode.width).toBe(1920);
    expect(videoConfig.episode.height).toBe(1080);
    expect(videoConfig.episode.fps).toBe(30);
  });

  it("short profile is vertical 9:16 at 30fps", () => {
    expect(videoConfig.short.width).toBe(1080);
    expect(videoConfig.short.height).toBe(1920);
    expect(videoConfig.short.fps).toBe(30);
    expect(videoConfig.short.width).toBeLessThan(videoConfig.short.height);
  });

  it("thumbnail profile is 1280×720", () => {
    expect(videoConfig.thumbnail.width).toBe(1280);
    expect(videoConfig.thumbnail.height).toBe(720);
  });

  it("has all four social-platform crops", () => {
    for (const platform of ["youtube", "instagram", "tiktok", "community"] as const) {
      expect(videoConfig.social).toHaveProperty(platform);
      const crop = videoConfig.social[platform];
      expect(crop.width).toBeGreaterThan(0);
      expect(crop.height).toBeGreaterThan(0);
    }
  });
});

describe("theme.ts::layout — wires through to video.json", () => {
  it("layout.width/height/fps come from videoConfig.episode", () => {
    expect(layout.width).toBe(videoConfig.episode.width);
    expect(layout.height).toBe(videoConfig.episode.height);
    expect(layout.fps).toBe(videoConfig.episode.fps);
  });

  it("layout.thumbnail mirrors videoConfig.thumbnail dims", () => {
    expect(layout.thumbnail.width).toBe(videoConfig.thumbnail.width);
    expect(layout.thumbnail.height).toBe(videoConfig.thumbnail.height);
  });

  it("layout.social mirrors videoConfig.social per-platform dims", () => {
    expect(layout.social.youtube.width).toBe(videoConfig.social.youtube.width);
    expect(layout.social.youtube.height).toBe(videoConfig.social.youtube.height);
    expect(layout.social.instagram.width).toBe(videoConfig.social.instagram.width);
    expect(layout.social.instagram.height).toBe(videoConfig.social.instagram.height);
    expect(layout.social.tiktok.width).toBe(videoConfig.social.tiktok.width);
    expect(layout.social.tiktok.height).toBe(videoConfig.social.tiktok.height);
    expect(layout.social.community.width).toBe(videoConfig.social.community.width);
    expect(layout.social.community.height).toBe(videoConfig.social.community.height);
  });
});
