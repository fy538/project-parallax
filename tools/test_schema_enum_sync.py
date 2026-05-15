"""
Schema-enum sync test.

The canonical sound-cue, texture-cue, and music-mood enum values live in
`remotion-templates/data/assembly-manifest.schema.json`. Several Python tools
mirror those sets as frozensets so they can validate without loading the
schema at runtime:

  - tools/lint/manifest_lint.py     → CANONICAL_SOUND_CUE_TYPES,
                                       CANONICAL_TEXTURE_CUE_TYPES
  - tools/check_audio_cues.py       → CANONICAL_SFX_TYPES,
                                       CANONICAL_TEXTURE_TYPES,
                                       CANONICAL_MUSIC_MOODS

Today these are kept in sync with a brittle "Last synced: <date>" comment
inside manifest_lint.py. This test makes the contract enforceable: any
schema change must update every mirror, and any new mirror that doesn't
match the schema fails CI before the inconsistency lands.

Also asserts soundCue.type and soundCueSecondary.type enums are identical
in the schema itself (they're separate properties — easy to drift apart).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO_ROOT / "remotion-templates" / "data" / "assembly-manifest.schema.json"

# Make sibling tool modules importable for direct constant inspection.
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent / "lint"))

import manifest_lint  # noqa: E402  (tools/lint/manifest_lint.py)
import check_audio_cues  # noqa: E402  (tools/check_audio_cues.py)


# ─── Schema enum extraction ──────────────────────────────────────────────────


@pytest.fixture(scope="module")
def schema() -> dict:
    return json.loads(SCHEMA_PATH.read_text())


def _enum_at(schema: dict, path: list) -> set[str]:
    """Walk a JSON-pointer-ish path into the schema and return the enum at the leaf.

    Path is a list of keys; lists implicit through "items" (e.g. ["properties",
    "segments", "items", ...]). Raises a clear AssertionError with the path
    on a miss — schema reorganisations should surface here, not as a silent
    empty-set comparison passing the test.
    """
    node = schema
    walked: list[str] = []
    for key in path:
        walked.append(key)
        assert isinstance(node, dict) and key in node, (
            f"schema path not found at {'.'.join(walked)} "
            f"(in {SCHEMA_PATH.relative_to(REPO_ROOT)})"
        )
        node = node[key]
    assert isinstance(node, list), f"schema path {'.'.join(path)} did not resolve to an enum list"
    return set(node)


# The segment shape is factored into $defs/segment — paths point there
# rather than walking through properties.segments.items.
SOUND_CUE_TYPE_PATH = [
    "$defs", "segment", "properties",
    "soundCue", "properties", "type", "enum",
]
SOUND_CUE_SECONDARY_TYPE_PATH = [
    "$defs", "segment", "properties",
    "soundCueSecondary", "properties", "type", "enum",
]
TEXTURE_CUE_TYPE_PATH = [
    "$defs", "segment", "properties",
    "textureCues", "items", "properties", "type", "enum",
]
MUSIC_MOOD_PATH = [
    "properties", "musicBed", "properties", "tracks", "items",
    "properties", "mood", "enum",
]


# ─── Sync assertions ─────────────────────────────────────────────────────────


class TestManifestLintMirrors:
    def test_sound_cue_types_match_schema(self, schema):
        schema_enum = _enum_at(schema, SOUND_CUE_TYPE_PATH)
        mirror = set(manifest_lint.CANONICAL_SOUND_CUE_TYPES)
        assert mirror == schema_enum, (
            f"manifest_lint.CANONICAL_SOUND_CUE_TYPES drifted from schema.\n"
            f"  only in mirror: {sorted(mirror - schema_enum)}\n"
            f"  only in schema: {sorted(schema_enum - mirror)}"
        )

    def test_texture_cue_types_match_schema(self, schema):
        schema_enum = _enum_at(schema, TEXTURE_CUE_TYPE_PATH)
        mirror = set(manifest_lint.CANONICAL_TEXTURE_CUE_TYPES)
        assert mirror == schema_enum, (
            f"manifest_lint.CANONICAL_TEXTURE_CUE_TYPES drifted from schema.\n"
            f"  only in mirror: {sorted(mirror - schema_enum)}\n"
            f"  only in schema: {sorted(schema_enum - mirror)}"
        )


class TestCheckAudioCuesMirrors:
    def test_sfx_types_match_schema(self, schema):
        schema_enum = _enum_at(schema, SOUND_CUE_TYPE_PATH)
        mirror = set(check_audio_cues.CANONICAL_SFX_TYPES)
        assert mirror == schema_enum, (
            f"check_audio_cues.CANONICAL_SFX_TYPES drifted from schema.\n"
            f"  only in mirror: {sorted(mirror - schema_enum)}\n"
            f"  only in schema: {sorted(schema_enum - mirror)}"
        )

    def test_texture_types_match_schema(self, schema):
        schema_enum = _enum_at(schema, TEXTURE_CUE_TYPE_PATH)
        mirror = set(check_audio_cues.CANONICAL_TEXTURE_TYPES)
        assert mirror == schema_enum, (
            f"check_audio_cues.CANONICAL_TEXTURE_TYPES drifted from schema.\n"
            f"  only in mirror: {sorted(mirror - schema_enum)}\n"
            f"  only in schema: {sorted(schema_enum - mirror)}"
        )

    def test_music_moods_match_schema(self, schema):
        schema_enum = _enum_at(schema, MUSIC_MOOD_PATH)
        mirror = set(check_audio_cues.CANONICAL_MUSIC_MOODS)
        assert mirror == schema_enum, (
            f"check_audio_cues.CANONICAL_MUSIC_MOODS drifted from schema.\n"
            f"  only in mirror: {sorted(mirror - schema_enum)}\n"
            f"  only in schema: {sorted(schema_enum - mirror)}"
        )


class TestSchemaInternalConsistency:
    """soundCueSecondary mirrors soundCue.type — keep them identical."""

    def test_soundCue_and_soundCueSecondary_enums_match(self, schema):
        primary = _enum_at(schema, SOUND_CUE_TYPE_PATH)
        secondary = _enum_at(schema, SOUND_CUE_SECONDARY_TYPE_PATH)
        assert primary == secondary, (
            "soundCue.type and soundCueSecondary.type enums diverged within "
            "the schema itself.\n"
            f"  only in soundCue:          {sorted(primary - secondary)}\n"
            f"  only in soundCueSecondary: {sorted(secondary - primary)}"
        )

    def test_all_mirror_sets_are_nonempty(self, schema):
        """Sanity guard against an enum being moved + the mirror silently emptying."""
        for path, label in [
            (SOUND_CUE_TYPE_PATH, "soundCue.type"),
            (TEXTURE_CUE_TYPE_PATH, "textureCues.items.type"),
            (MUSIC_MOOD_PATH, "musicBed.tracks.mood"),
        ]:
            values = _enum_at(schema, path)
            assert len(values) > 0, f"schema enum at {label} is unexpectedly empty"
