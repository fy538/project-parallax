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
    """One render profile — frozen because no consumer should mutate."""
    width: int
    height: int
    fps: int  # 0 for stills / social crops that don't have a frame rate


# Module-level cache; tests can monkeypatch CONFIG_PATH + reset_cache().
_cached: dict[str, VideoProfile] | None = None
_cached_social: dict[str, VideoProfile] | None = None


def _load() -> tuple[dict[str, VideoProfile], dict[str, VideoProfile]]:
    """Parse video.json into typed profiles. Called once, cached."""
    raw = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    profiles: dict[str, VideoProfile] = {}
    for key in ("episode", "short", "thumbnail"):
        block = raw[key]
        profiles[key] = VideoProfile(
            width=int(block["width"]),
            height=int(block["height"]),
            fps=int(block.get("fps", 0)),
        )
    social: dict[str, VideoProfile] = {}
    for name, block in raw.get("social", {}).items():
        if name.startswith("_"):
            continue
        social[name] = VideoProfile(
            width=int(block["width"]),
            height=int(block["height"]),
            fps=int(block.get("fps", 0)),
        )
    return profiles, social


def get_video_config(profile: str = "episode") -> VideoProfile:
    """Return the named render profile. Cached after first call.

    Valid profile names: 'episode', 'short', 'thumbnail'. For per-platform
    social crops, use `get_social_config(platform)`.
    """
    global _cached, _cached_social
    if _cached is None:
        _cached, _cached_social = _load()
    if profile not in _cached:
        raise KeyError(
            f"unknown video profile {profile!r}; "
            f"valid: {sorted(_cached.keys())}"
        )
    return _cached[profile]


def get_social_config(platform: str) -> VideoProfile:
    """Return the named social-platform crop (youtube/instagram/tiktok/community)."""
    global _cached, _cached_social
    if _cached_social is None:
        _cached, _cached_social = _load()
    if platform not in _cached_social:
        raise KeyError(
            f"unknown social platform {platform!r}; "
            f"valid: {sorted(_cached_social.keys())}"
        )
    return _cached_social[platform]


def reset_cache() -> None:
    """Clear the module cache. For tests that monkeypatch CONFIG_PATH."""
    global _cached, _cached_social
    _cached = None
    _cached_social = None
