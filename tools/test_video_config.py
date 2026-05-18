"""Tests for tools/video_config.py — the Python-side video defaults loader."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from tools import video_config


@pytest.fixture(autouse=True)
def _reset_cache() -> None:
    video_config.reset_cache()
    yield
    video_config.reset_cache()


def test_episode_profile_matches_canonical_values() -> None:
    """The on-disk video.json must currently describe a 1920×1080 @ 30fps episode.
    If a future channel-wide refactor changes that, update this assertion + every
    visual baseline + every dependent Python tool default in the same commit."""
    ep = video_config.get_video_config("episode")
    assert ep.width == 1920
    assert ep.height == 1080
    assert ep.fps == 30


def test_short_profile_is_vertical() -> None:
    sh = video_config.get_video_config("short")
    assert sh.width == 1080
    assert sh.height == 1920
    assert sh.fps == 30
    assert sh.width < sh.height  # vertical


def test_thumbnail_profile_is_half_render() -> None:
    th = video_config.get_video_config("thumbnail")
    assert th.width == 1280
    assert th.height == 720


def test_unknown_profile_raises_keyerror() -> None:
    with pytest.raises(KeyError) as exc:
        video_config.get_video_config("4k-master")
    assert "valid:" in str(exc.value)


def test_social_platforms_present() -> None:
    for platform in ("youtube", "instagram", "tiktok", "community"):
        s = video_config.get_social_config(platform)
        assert s.width > 0
        assert s.height > 0


def test_get_video_config_is_cached() -> None:
    first = video_config.get_video_config("episode")
    second = video_config.get_video_config("episode")
    assert first is second


def test_reset_cache_picks_up_swapped_palette(
    tmp_path: Path, monkeypatch: pytest.MonkeyPatch
) -> None:
    """reset_cache() + a different config path yields a different profile —
    proves the cache is bypassable for tests / hot-reload scenarios."""
    baseline = video_config.get_video_config("episode")
    assert baseline.width == 1920

    swap = tmp_path / "video.json"
    swap.write_text(json.dumps({
        "episode": {"width": 3840, "height": 2160, "fps": 60},
        "short": {"width": 1080, "height": 1920, "fps": 30},
        "thumbnail": {"width": 1920, "height": 1080, "fps": 30},
        "social": {},
    }), encoding="utf-8")
    monkeypatch.setattr(video_config, "CONFIG_PATH", swap)
    video_config.reset_cache()

    bumped = video_config.get_video_config("episode")
    assert bumped.width == 3840
    assert bumped.fps == 60


def test_video_profile_is_frozen() -> None:
    from dataclasses import FrozenInstanceError

    ep = video_config.get_video_config("episode")
    with pytest.raises(FrozenInstanceError):
        ep.width = 9999  # type: ignore[misc]


def test_theme_ts_reads_same_json() -> None:
    """The TS side imports `tools/config/video.json` directly. Verify the
    file exists and has the structure theme.ts expects. (A theme.ts typo
    would be caught by tsc, but a missing/malformed JSON would surface
    here as a clearer error than a downstream Remotion render crash.)"""
    cfg = json.loads(video_config.CONFIG_PATH.read_text(encoding="utf-8"))
    assert "episode" in cfg
    assert "short" in cfg
    assert "thumbnail" in cfg
    assert "social" in cfg
    for key in ("youtube", "instagram", "tiktok", "community"):
        assert key in cfg["social"], f"missing social.{key}"
