"""
Tests for tools/validate_data.py — JSON well-formedness + schema validation.

Run: pytest tools/test_validate_data.py -v
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

import validate_data as vd


# ── validate_wellformed — Layer 1 check ───────────────────────────────────


def test_wellformed_valid_json(tmp_path):
    p = tmp_path / "good.json"
    p.write_text('{"a": 1}', encoding="utf-8")
    assert vd.validate_wellformed(p) is None


def test_wellformed_malformed_json(tmp_path):
    p = tmp_path / "bad.json"
    p.write_text('{"a": 1,', encoding="utf-8")  # trailing comma, missing brace
    err = vd.validate_wellformed(p)
    assert err is not None
    assert "Expecting" in err or "delimiter" in err  # json.JSONDecodeError text


def test_wellformed_empty_file(tmp_path):
    p = tmp_path / "empty.json"
    p.write_text("", encoding="utf-8")
    err = vd.validate_wellformed(p)
    assert err is not None  # empty is not valid JSON


def test_wellformed_array_at_root(tmp_path):
    p = tmp_path / "arr.json"
    p.write_text('[1, 2, 3]', encoding="utf-8")
    assert vd.validate_wellformed(p) is None


def test_wellformed_unicode(tmp_path):
    p = tmp_path / "unicode.json"
    p.write_text('{"term": "卡脖子"}', encoding="utf-8")
    assert vd.validate_wellformed(p) is None


def test_wellformed_missing_file_returns_error(tmp_path):
    p = tmp_path / "ghost.json"
    err = vd.validate_wellformed(p)
    assert err is not None
    assert "read error" in err.lower() or "no such file" in err.lower()


# ── schema_for — pattern matching to schema files ─────────────────────────


def test_schema_for_assembly_manifest(tmp_path, monkeypatch):
    """If a path matches the assembly-manifest pattern, schema_for returns the schema path."""
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    schema = tmp_path / "remotion-templates/data/assembly-manifest.schema.json"
    schema.parent.mkdir(parents=True)
    schema.write_text("{}", encoding="utf-8")
    target = tmp_path / "remotion-templates/data/episodes/silicon-trap/assembly-manifest.json"
    target.parent.mkdir(parents=True)
    target.write_text("{}", encoding="utf-8")
    assert vd.schema_for(target) == schema


def test_schema_for_concepts(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    schema = tmp_path / "data/concept-registry.schema.json"
    schema.parent.mkdir(parents=True)
    schema.write_text("{}", encoding="utf-8")
    target = tmp_path / "data/concepts.json"
    target.write_text("{}", encoding="utf-8")
    assert vd.schema_for(target) == schema


def test_schema_for_no_match(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    target = tmp_path / "data/random-other.json"
    target.parent.mkdir(parents=True)
    target.write_text("{}", encoding="utf-8")
    assert vd.schema_for(target) is None


def test_schema_for_returns_none_when_schema_missing(tmp_path, monkeypatch):
    """If pattern matches but the schema file doesn't exist, return None (don't crash)."""
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    target = tmp_path / "data/concepts.json"
    target.parent.mkdir(parents=True)
    target.write_text("{}", encoding="utf-8")
    # Don't create the schema file
    assert vd.schema_for(target) is None


# ── validate_schema — Layer 2 check (uses jsonschema if installed) ────────


def test_schema_valid_data(tmp_path):
    schema = tmp_path / "schema.json"
    schema.write_text(json.dumps({
        "type": "object",
        "properties": {"x": {"type": "integer"}},
        "required": ["x"],
    }), encoding="utf-8")
    data = tmp_path / "data.json"
    data.write_text('{"x": 42}', encoding="utf-8")
    assert vd.validate_schema(data, schema) is None


def test_schema_violation_returns_error(tmp_path):
    schema = tmp_path / "schema.json"
    schema.write_text(json.dumps({
        "type": "object",
        "properties": {"x": {"type": "integer"}},
        "required": ["x"],
    }), encoding="utf-8")
    data = tmp_path / "data.json"
    data.write_text('{"x": "not an integer"}', encoding="utf-8")
    err = vd.validate_schema(data, schema)
    assert err is not None
    assert "schema error" in err.lower()


def test_schema_validation_includes_path_to_failure(tmp_path):
    """Error message should mention which field failed."""
    schema = tmp_path / "schema.json"
    schema.write_text(json.dumps({
        "type": "object",
        "properties": {
            "nested": {
                "type": "object",
                "properties": {"y": {"type": "string"}},
            }
        }
    }), encoding="utf-8")
    data = tmp_path / "data.json"
    data.write_text('{"nested": {"y": 123}}', encoding="utf-8")
    err = vd.validate_schema(data, schema)
    assert err is not None
    assert "y" in err  # path should mention 'y'


# ── find_json_files — directory traversal + filtering ─────────────────────


def test_find_json_files_skips_schemas(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    (tmp_path / "data").mkdir()
    (tmp_path / "data/regular.json").write_text("{}")
    (tmp_path / "data/something.schema.json").write_text("{}")
    found = vd.find_json_files()
    names = [p.name for p in found]
    assert "regular.json" in names
    assert "something.schema.json" not in names


def test_find_json_files_skips_node_modules(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    (tmp_path / "data").mkdir()
    (tmp_path / "data/regular.json").write_text("{}")
    (tmp_path / "remotion-templates/data/node_modules/foo").mkdir(parents=True)
    (tmp_path / "remotion-templates/data/node_modules/foo/pkg.json").write_text("{}")
    found = vd.find_json_files()
    paths = [str(p) for p in found]
    assert not any("node_modules" in p for p in paths)


def test_find_json_files_filter_paths(tmp_path, monkeypatch):
    """Filter to a subset — used by pre-commit hook."""
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    (tmp_path / "data").mkdir()
    a = tmp_path / "data/a.json"
    b = tmp_path / "data/b.json"
    a.write_text("{}")
    b.write_text("{}")
    found = vd.find_json_files(filter_paths=[a])
    assert found == [a]


def test_find_json_files_returns_sorted(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    (tmp_path / "data").mkdir()
    (tmp_path / "data/zebra.json").write_text("{}")
    (tmp_path / "data/apple.json").write_text("{}")
    found = vd.find_json_files()
    names = [p.name for p in found]
    assert names == sorted(names)


# ── Layer 3 — palette compliance ──────────────────────────────────────────


def test_load_palette_hex_set_extracts_all_hex(tmp_path, monkeypatch):
    palette = tmp_path / "palette.json"
    palette.write_text(json.dumps({
        "palette": {"ink": "#1C1814", "gold": "#C4A747"},
        "semantic": {"us": "#4A7BA7", "china": "#A64D46"},
    }), encoding="utf-8")
    monkeypatch.setattr(vd, "PALETTE_PATH", palette)
    s = vd.load_palette_hex_set()
    assert s == {"#1c1814", "#c4a747", "#4a7ba7", "#a64d46"}


def test_load_palette_hex_set_handles_nested_arrays(tmp_path, monkeypatch):
    palette = tmp_path / "palette.json"
    palette.write_text(json.dumps({
        "ramps": {"standard": {"shadows": ["#1C1814"], "highlights": ["#F5F0E8"]}},
    }), encoding="utf-8")
    monkeypatch.setattr(vd, "PALETTE_PATH", palette)
    s = vd.load_palette_hex_set()
    assert "#1c1814" in s
    assert "#f5f0e8" in s


def test_load_palette_hex_set_returns_empty_when_missing(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "PALETTE_PATH", tmp_path / "ghost.json")
    assert vd.load_palette_hex_set() == set()


def test_load_palette_hex_set_returns_empty_on_malformed(tmp_path, monkeypatch):
    palette = tmp_path / "palette.json"
    palette.write_text("{ not valid json", encoding="utf-8")
    monkeypatch.setattr(vd, "PALETTE_PATH", palette)
    assert vd.load_palette_hex_set() == set()


def test_validate_palette_passes_compliant_hex(tmp_path):
    data = tmp_path / "data.json"
    data.write_text(json.dumps({"color": "#1C1814"}), encoding="utf-8")
    err = vd.validate_palette(data, {"#1c1814", "#c4a747"})
    assert err is None


def test_validate_palette_flags_off_palette_hex(tmp_path):
    data = tmp_path / "data.json"
    data.write_text(json.dumps({"color": "#FF00FF"}), encoding="utf-8")
    err = vd.validate_palette(data, {"#1c1814", "#c4a747"})
    assert err is not None
    assert "#ff00ff" in err


def test_validate_palette_allows_pure_black_and_white(tmp_path):
    data = tmp_path / "data.json"
    data.write_text(json.dumps({
        "stroke": "#000000",
        "fill": "#FFFFFF",
    }), encoding="utf-8")
    err = vd.validate_palette(data, {"#1c1814"})
    assert err is None  # black/white always allowed


def test_validate_palette_accepts_rgba_when_rgb_in_palette(tmp_path):
    """8-char hex like #1C1814AA (with alpha) should pass if the RGB part is in the palette."""
    data = tmp_path / "data.json"
    data.write_text(json.dumps({"color": "#1C181480"}), encoding="utf-8")
    err = vd.validate_palette(data, {"#1c1814"})
    assert err is None


def test_validate_palette_dedupes_repeated_offenders(tmp_path):
    data = tmp_path / "data.json"
    data.write_text(json.dumps({
        "a": "#FF00FF",
        "b": "#FF00FF",
        "c": "#FF00FF",
    }), encoding="utf-8")
    err = vd.validate_palette(data, {"#1c1814"})
    assert err is not None
    # Same off-palette hex used 3 times should be reported once
    assert err.count("#ff00ff") == 1


def test_validate_palette_returns_none_when_palette_empty(tmp_path):
    """If palette didn't load (empty allowed set), skip Layer 3 silently rather than fail."""
    data = tmp_path / "data.json"
    data.write_text(json.dumps({"color": "#FF00FF"}), encoding="utf-8")
    assert vd.validate_palette(data, set()) is None


# ── is_template_data_file — which files Layer 3 applies to ─────────────────


def test_template_data_file_recognized(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    p = tmp_path / "remotion-templates/data/episodes/foo/bar.json"
    p.parent.mkdir(parents=True)
    p.write_text("{}")
    assert vd.is_template_data_file(p) is True


def test_template_data_file_skips_assembly_manifest(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    p = tmp_path / "remotion-templates/data/episodes/foo/assembly-manifest.json"
    p.parent.mkdir(parents=True)
    p.write_text("{}")
    assert vd.is_template_data_file(p) is False


def test_template_data_file_skips_deprecated_paths(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    p = tmp_path / "remotion-templates/data/episodes/foo/_deprecated_v4/old.json"
    p.parent.mkdir(parents=True)
    p.write_text("{}")
    assert vd.is_template_data_file(p) is False


def test_template_data_file_skips_concepts_registry(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    p = tmp_path / "data/concepts.json"
    p.parent.mkdir(parents=True)
    p.write_text("{}")
    assert vd.is_template_data_file(p) is False


def test_template_data_file_skips_schema_files(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    p = tmp_path / "remotion-templates/data/episodes/foo.schema.json"
    p.parent.mkdir(parents=True)
    p.write_text("{}")
    assert vd.is_template_data_file(p) is False


# ── validate_schema — crash handler ──────────────────────────────────────────


def test_schema_crash_handler_catches_schema_error(tmp_path, monkeypatch):
    """If the SCHEMA itself is malformed (vs the data), validate_schema
    returns a 'crashed' error string. May 2026: the broad-except was
    narrowed to (SchemaError, RefResolutionError, JSONDecodeError, OSError),
    so this test now uses a real one of those exception types — bare
    RuntimeError would (correctly) bubble as a programming error."""

    schema = tmp_path / "schema.json"
    schema.write_text(json.dumps({"type": "object"}), encoding="utf-8")
    data = tmp_path / "data.json"
    data.write_text('{"x": 1}', encoding="utf-8")

    try:
        import jsonschema
    except ImportError:
        return  # skip if jsonschema not installed

    def boom(instance, schema_):
        raise jsonschema.SchemaError("schema is malformed")

    monkeypatch.setattr(jsonschema, "validate", boom)
    err = vd.validate_schema(data, schema)
    assert err is not None
    assert "crashed" in err


def test_schema_crash_handler_lets_programming_errors_bubble(tmp_path, monkeypatch):
    """Contract guarantee: a TypeError / RuntimeError in our own code
    should NOT be silently absorbed as a 'schema validation crashed'
    message. That was the original anti-pattern — masking real bugs as
    schema infra problems. Narrowed catch ensures they bubble."""
    import pytest

    schema = tmp_path / "schema.json"
    schema.write_text(json.dumps({"type": "object"}), encoding="utf-8")
    data = tmp_path / "data.json"
    data.write_text('{"x": 1}', encoding="utf-8")

    try:
        import jsonschema
    except ImportError:
        return  # skip if jsonschema not installed

    def boom(instance, schema_):
        raise RuntimeError("simulated bug in our code")

    monkeypatch.setattr(jsonschema, "validate", boom)
    with pytest.raises(RuntimeError, match="simulated bug"):
        vd.validate_schema(data, schema)


# ── _expected_audio_files — manifest → file path set ─────────────────────────


def test_expected_audio_files_music_track(tmp_path):
    manifest = {
        "episode": "silicon-trap",
        "musicBed": {"tracks": [{"file": "theme.mp3"}]},
        "segments": [],
    }
    paths = vd._expected_audio_files(manifest, "silicon-trap")
    assert "episodes/silicon-trap/theme.mp3" in paths


def test_expected_audio_files_multiple_tracks(tmp_path):
    manifest = {
        "musicBed": {"tracks": [{"file": "intro.mp3"}, {"file": "outro.mp3"}]},
        "segments": [],
    }
    paths = vd._expected_audio_files(manifest, "ep01")
    assert "episodes/ep01/intro.mp3" in paths
    assert "episodes/ep01/outro.mp3" in paths


def test_expected_audio_files_sound_cue(tmp_path):
    manifest = {
        "musicBed": {},
        "segments": [
            {"soundCue": {"type": "whoosh", "intensity": "heavy"}}
        ],
    }
    paths = vd._expected_audio_files(manifest, "ep01")
    assert "audio/sfx/transitions/whoosh-heavy.wav" in paths


def test_expected_audio_files_cue_defaults_intensity_to_normal(tmp_path):
    manifest = {
        "musicBed": {},
        "segments": [{"soundCue": {"type": "swipe"}}],
    }
    paths = vd._expected_audio_files(manifest, "ep01")
    assert "audio/sfx/transitions/swipe-normal.wav" in paths


def test_expected_audio_files_secondary_cue(tmp_path):
    manifest = {
        "musicBed": {},
        "segments": [{"soundCueSecondary": {"type": "click", "intensity": "light"}}],
    }
    paths = vd._expected_audio_files(manifest, "ep01")
    assert "audio/sfx/transitions/click-light.wav" in paths


def test_expected_audio_files_texture_cues(tmp_path):
    manifest = {
        "musicBed": {},
        "segments": [
            {"textureCues": [{"type": "heartbeat"}, {"type": "breath"}]}
        ],
    }
    paths = vd._expected_audio_files(manifest, "ep01")
    assert "audio/sfx/textures/heartbeat.wav" in paths
    assert "audio/sfx/textures/breath.wav" in paths


def test_expected_audio_files_empty_manifest(tmp_path):
    paths = vd._expected_audio_files({}, "ep01")
    assert paths == set()


def test_expected_audio_files_skips_null_type(tmp_path):
    manifest = {
        "musicBed": {"tracks": [{"file": None}]},
        "segments": [{"soundCue": {"intensity": "normal"}}],  # no type key
    }
    paths = vd._expected_audio_files(manifest, "ep01")
    assert paths == set()


# ── check_audio_assets — disk existence check ────────────────────────────────


def test_check_audio_assets_no_public_dir(tmp_path, monkeypatch):
    """If public/ doesn't exist, return (0, []) without crashing."""
    monkeypatch.setattr(vd, "PUBLIC_DIR", tmp_path / "nonexistent-public")
    manifest_path = tmp_path / "assembly-manifest.json"
    manifest_path.write_text(json.dumps({"musicBed": {}, "segments": []}), encoding="utf-8")
    count, missing = vd.check_audio_assets(manifest_path)
    assert count == 0
    assert missing == []


def test_check_audio_assets_malformed_manifest(tmp_path, monkeypatch):
    public = tmp_path / "public"
    public.mkdir()
    monkeypatch.setattr(vd, "PUBLIC_DIR", public)
    bad = tmp_path / "assembly-manifest.json"
    bad.write_text("{not json", encoding="utf-8")
    count, missing = vd.check_audio_assets(bad)
    assert count == 0
    assert missing == []


def test_check_audio_assets_all_present(tmp_path, monkeypatch):
    public = tmp_path / "public"
    (public / "episodes/ep01").mkdir(parents=True)
    (public / "episodes/ep01/theme.mp3").write_text("audio")
    monkeypatch.setattr(vd, "PUBLIC_DIR", public)
    manifest_path = tmp_path / "assembly-manifest.json"
    manifest_path.write_text(json.dumps({
        "episode": "ep01",
        "musicBed": {"tracks": [{"file": "theme.mp3"}]},
        "segments": [],
    }), encoding="utf-8")
    count, missing = vd.check_audio_assets(manifest_path)
    assert count == 1
    assert missing == []


def test_check_audio_assets_reports_missing(tmp_path, monkeypatch):
    public = tmp_path / "public"
    public.mkdir()
    monkeypatch.setattr(vd, "PUBLIC_DIR", public)
    manifest_path = tmp_path / "assembly-manifest.json"
    manifest_path.write_text(json.dumps({
        "episode": "ep01",
        "musicBed": {"tracks": [{"file": "theme.mp3"}]},
        "segments": [],
    }), encoding="utf-8")
    count, missing = vd.check_audio_assets(manifest_path)
    assert count == 1
    assert "episodes/ep01/theme.mp3" in missing


def test_check_audio_assets_uses_parent_dir_as_slug_fallback(tmp_path, monkeypatch):
    """If manifest has no 'episode' key, fall back to manifest parent directory name."""
    public = tmp_path / "public"
    public.mkdir()
    monkeypatch.setattr(vd, "PUBLIC_DIR", public)
    ep_dir = tmp_path / "my-episode"
    ep_dir.mkdir()
    manifest_path = ep_dir / "assembly-manifest.json"
    manifest_path.write_text(json.dumps({
        "musicBed": {"tracks": [{"file": "music.mp3"}]},
        "segments": [],
    }), encoding="utf-8")
    count, missing = vd.check_audio_assets(manifest_path)
    assert count == 1
    assert "episodes/my-episode/music.mp3" in missing


# ── predictions-log schema in SCHEMAS list ────────────────────────────────────


def test_schema_for_predictions_log(tmp_path, monkeypatch):
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    schema = tmp_path / "data/predictions-log.schema.json"
    schema.parent.mkdir(parents=True)
    schema.write_text("{}", encoding="utf-8")
    target = tmp_path / "data/predictions-log.json"
    target.write_text("{}", encoding="utf-8")
    assert vd.schema_for(target) == schema


# ── main() — CLI integration tests ───────────────────────────────────────────


def _run_main(argv, monkeypatch, tmp_root):
    """Monkeypatch ROOT and sys.argv, call main(), return exit code."""
    monkeypatch.setattr(vd, "ROOT", tmp_root)
    monkeypatch.setattr(vd, "PALETTE_PATH", tmp_root / "palette.json")
    monkeypatch.setattr(vd, "PUBLIC_DIR", tmp_root / "public")
    monkeypatch.setattr(sys, "argv", ["validate_data.py"] + argv)
    return vd.main()


def test_main_no_files_returns_zero(tmp_path, monkeypatch, capsys):
    """When no JSON files are found at all, exit 0 with a clean message."""
    code = _run_main([], monkeypatch, tmp_path)
    assert code == 0
    assert "No JSON files" in capsys.readouterr().out


def test_main_valid_json_returns_zero(tmp_path, monkeypatch, capsys):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    (data_dir / "simple.json").write_text('{"ok": true}', encoding="utf-8")
    code = _run_main(["--no-palette", "--no-audio"], monkeypatch, tmp_path)
    assert code == 0
    assert "✓" in capsys.readouterr().out


def test_main_malformed_json_returns_one(tmp_path, monkeypatch, capsys):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    (data_dir / "bad.json").write_text("{bad", encoding="utf-8")
    code = _run_main(["--no-palette", "--no-audio"], monkeypatch, tmp_path)
    assert code == 1
    assert "failed validation" in capsys.readouterr().err


def test_main_files_flag_skips_non_json(tmp_path, monkeypatch, capsys):
    """--files with only non-JSON paths exits 0 immediately (pre-commit shortcut)."""
    txt = tmp_path / "something.txt"
    txt.write_text("hello")
    monkeypatch.setattr(sys, "argv", ["validate_data.py", "--files", str(txt)])
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    code = vd.main()
    assert code == 0


def test_main_files_flag_validates_specific_file(tmp_path, monkeypatch, capsys):
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    good = data_dir / "good.json"
    good.write_text('{"x": 1}', encoding="utf-8")
    bad = data_dir / "bad.json"
    bad.write_text("{broken", encoding="utf-8")
    # Only pass the good file — bad should not be validated
    monkeypatch.setattr(sys, "argv", ["validate_data.py", "--files", str(good), "--no-palette", "--no-audio"])
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    monkeypatch.setattr(vd, "PALETTE_PATH", tmp_path / "palette.json")
    monkeypatch.setattr(vd, "PUBLIC_DIR", tmp_path / "public")
    code = vd.main()
    assert code == 0


def test_main_episode_flag_unknown_episode_returns_one(tmp_path, monkeypatch, capsys):
    code = _run_main(["--episode", "nonexistent-slug", "--no-palette", "--no-audio"], monkeypatch, tmp_path)
    assert code == 1
    assert "nonexistent-slug" in capsys.readouterr().err


def test_main_episode_flag_finds_json_under_episodes_subdir(tmp_path, monkeypatch, capsys):
    """--episode finds JSON under episodes/<slug>/ and remotion-templates/data/episodes/<slug>/."""
    ep_dir = tmp_path / "episodes" / "my-ep"
    ep_dir.mkdir(parents=True)
    (ep_dir / "brief.json").write_text('{"ok": 1}', encoding="utf-8")
    code = _run_main(["--episode", "my-ep", "--no-palette", "--no-audio"], monkeypatch, tmp_path)
    assert code == 0
    assert "✓" in capsys.readouterr().out


def test_main_schema_violation_reported(tmp_path, monkeypatch, capsys):
    """If a file matches a schema and violates it, exit 1 with schema error message."""
    data_dir = tmp_path / "data"
    data_dir.mkdir()
    # Write a schema that requires "version" to be an integer
    schema = data_dir / "simple.schema.json"
    schema.write_text(json.dumps({
        "type": "object",
        "required": ["version"],
        "properties": {"version": {"type": "integer"}},
    }), encoding="utf-8")
    # Override SCHEMAS so this file is schema-checked
    monkeypatch.setattr(vd, "SCHEMAS", [("data/simple.json", "data/simple.schema.json")])
    target = data_dir / "simple.json"
    target.write_text('{"version": "should-be-int"}', encoding="utf-8")
    code = _run_main(["--no-palette", "--no-audio"], monkeypatch, tmp_path)
    assert code == 1
    assert "schema error" in capsys.readouterr().err


def test_main_palette_check_runs_on_template_data_file(tmp_path, monkeypatch, capsys):
    """Palette check runs on template data files and reports off-palette hex."""
    ep_dir = tmp_path / "remotion-templates/data/episodes/ep01"
    ep_dir.mkdir(parents=True)
    (ep_dir / "scene.json").write_text(json.dumps({"color": "#FF00FF"}), encoding="utf-8")
    palette = tmp_path / "tools/brand-treatment/palette.json"
    palette.parent.mkdir(parents=True)
    palette.write_text(json.dumps({"palette": {"ink": "#1C1814"}}), encoding="utf-8")
    monkeypatch.setattr(vd, "PALETTE_PATH", palette)
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    monkeypatch.setattr(vd, "PUBLIC_DIR", tmp_path / "public")
    monkeypatch.setattr(sys, "argv", ["validate_data.py", "--no-audio"])
    code = vd.main()
    assert code == 1
    assert "#ff00ff" in capsys.readouterr().err


def test_main_audio_soft_warning_does_not_fail(tmp_path, monkeypatch, capsys):
    """Missing audio without --audio-strict → warning in output but exit 0."""
    ep_dir = tmp_path / "remotion-templates/data/episodes/ep01"
    ep_dir.mkdir(parents=True)
    manifest = ep_dir / "assembly-manifest.json"
    manifest.write_text(json.dumps({
        "episode": "ep01",
        "musicBed": {"tracks": [{"file": "missing.mp3"}]},
        "segments": [],
    }), encoding="utf-8")
    public = tmp_path / "public"
    public.mkdir()
    monkeypatch.setattr(vd, "PUBLIC_DIR", public)
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    monkeypatch.setattr(vd, "PALETTE_PATH", tmp_path / "palette.json")
    monkeypatch.setattr(sys, "argv", ["validate_data.py", "--no-palette"])
    code = vd.main()
    assert code == 0
    out = capsys.readouterr()
    assert "missing audio" in out.out  # summary mentions it


def test_main_audio_strict_fails_on_missing_audio(tmp_path, monkeypatch, capsys):
    """With --audio-strict, missing audio files cause exit 1."""
    ep_dir = tmp_path / "remotion-templates/data/episodes/ep01"
    ep_dir.mkdir(parents=True)
    manifest = ep_dir / "assembly-manifest.json"
    manifest.write_text(json.dumps({
        "episode": "ep01",
        "musicBed": {"tracks": [{"file": "missing.mp3"}]},
        "segments": [],
    }), encoding="utf-8")
    public = tmp_path / "public"
    public.mkdir()
    monkeypatch.setattr(vd, "PUBLIC_DIR", public)
    monkeypatch.setattr(vd, "ROOT", tmp_path)
    monkeypatch.setattr(vd, "PALETTE_PATH", tmp_path / "palette.json")
    monkeypatch.setattr(sys, "argv", ["validate_data.py", "--no-palette", "--audio-strict"])
    code = vd.main()
    assert code == 1
