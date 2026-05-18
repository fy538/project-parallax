"""
video_config.py — Python-side video output defaults (single source of truth).

Mirrors the structure of `tools/config/video.json`, the same file
`remotion-templates/src/design/theme.ts::layout` reads. Any Python
tool that needs to know "what dimensions does a Parallax episode
render at?" reads from here, NOT from a hardcoded `1920×1080` literal.

Profiles:
  · episode   — 16:9 landscape, the standard episode render (1920×1080 @ 30)
  · short     — 9:16 vertical for Shorts/Reels/TikTok        (1080×1920 @ 30)
  · thumbnail — 16:9 still at half-render resolution         (1280×720)
  · social    — per-platform export crops (youtube/instagram/tiktok/community)

To swap channel-wide dimensions (e.g. 4K upgrade): edit
`tools/config/video.json` ONCE. Both this module and theme.ts pick it
up on next run; visual regression tests will flag any pixel drift.

Usage:
    from tools.video_config import get_video_config

    ep = get_video_config("episode")
    print(ep.width, ep.height, ep.fps)   # 1920 1080 30

    sh = get_video_config("short")
    parser.add_argument("--width", type=int, default=sh.width)
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG_PATH = ROOT / "tools" / "config" / "video.json"


@dataclass(frozen=True)
class VideoProfile:
    """One render profile — frozen because no consumer should mutate.

    `fps` is required for animated profiles (episode/short/thumbnail). The
    sibling `SocialCrop` covers per-platform crops which don't have a
    frame rate — keeping them in a separate type prevents a caller from
    naively doing `parser.add_argument("--fps", default=youtube.fps)` and
    silently getting `0` (the prior sentinel-fps footgun)."""
    width: int
    height: int
    fps: int


@dataclass(frozen=True)
class SocialCrop:
    """A still per-platform export crop. No frame rate (stills/posts)."""
    width: int
    height: int


# Module-level cache. Single dict-of-dicts keeps everything from one
# JSON read together — tests monkeypatch CONFIG_PATH + reset_cache.
_Caches = dict[str, dict[str, VideoProfile | SocialCrop]]
_cached: _Caches | None = None


def _load() -> _Caches:
    """Parse video.json into typed profiles. Called once, cached."""
    raw = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    main: dict[str, VideoProfile | SocialCrop] = {}
    for key in ("episode", "short", "thumbnail"):
        block = raw[key]
        main[key] = VideoProfile(
            width=int(block["width"]),
            height=int(block["height"]),
            fps=int(block["fps"]),  # required for animated profiles
        )
    social: dict[str, VideoProfile | SocialCrop] = {}
    for name, block in raw.get("social", {}).items():
        if name.startswith("_"):
            continue
        social[name] = SocialCrop(
            width=int(block["width"]),
            height=int(block["height"]),
        )
    return {"main": main, "social": social}


def get_video_config(profile: str = "episode") -> VideoProfile:
    """Return the named render profile. Cached after first call.

    Valid profile names: 'episode', 'short', 'thumbnail'. For per-platform
    social crops, use `get_social_config(platform)`.
    """
    global _cached
    if _cached is None:
        _cached = _load()
    main = _cached["main"]
    if profile not in main:
        raise KeyError(
            f"unknown video profile {profile!r}; "
            f"valid: {sorted(main.keys())}"
        )
    result = main[profile]
    assert isinstance(result, VideoProfile)
    return result


def get_social_config(platform: str) -> SocialCrop:
    """Return the named social-platform crop (youtube/instagram/tiktok/community)."""
    global _cached
    if _cached is None:
        _cached = _load()
    social = _cached["social"]
    if platform not in social:
        raise KeyError(
            f"unknown social platform {platform!r}; "
            f"valid: {sorted(social.keys())}"
        )
    result = social[platform]
    assert isinstance(result, SocialCrop)
    return result


def reset_cache() -> None:
    """Clear the module cache. For tests that monkeypatch CONFIG_PATH."""
    global _cached
    _cached = None
